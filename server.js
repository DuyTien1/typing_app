require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Cấu hình thời gian cho chế độ Ngẫu Hứng
const NGAU_HUNG_ROUND_DURATION = 7;
const NGAU_HUNG_INTERMISSION_DURATION = 3;
const NGAU_HUNG_TOTAL_ROUNDS = 15;

app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// QUẢN LÝ HIGH SCORES & TỰ ĐỘNG RESET 0H GMT+7
// ==========================================
const HIGHSCORES_FILE = path.join(__dirname, "highscores.json");

let highScores = {
	vi_dau: null,
	vi_nodau: null,
	en: null,
	numpad: null,
	ngau_hung: null,
};

function loadHighScoresFromFile() {
	try {
		if (fs.existsSync(HIGHSCORES_FILE)) {
			const data = fs.readFileSync(HIGHSCORES_FILE, "utf8");
			highScores = Object.assign(
				{
					vi_dau: null,
					vi_nodau: null,
					en: null,
					numpad: null,
					ngau_hung: null,
				},
				JSON.parse(data),
			);
		}
	} catch (err) {
		console.log("Lỗi load high scores:", err.message);
	}
}

function saveHighScoresToFile() {
	try {
		fs.writeFileSync(HIGHSCORES_FILE, JSON.stringify(highScores, null, 2), "utf8");
	} catch (err) {
		console.log("Lỗi save high scores:", err.message);
	}
}

function resetHighScores() {
	console.log("[SYSTEM] Đã đến 0h GMT+7: Tiến hành reset bảng điểm High Scores...");
	highScores = {
		vi_dau: null,
		vi_nodau: null,
		en: null,
		numpad: null,
		ngau_hung: null,
	};
	saveHighScoresToFile();
	io.emit("update_high_scores", highScores);
}

function scheduleDailyReset() {
	const now = new Date();
	const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
	const gmt7OffsetMs = 7 * 60 * 60 * 1000;
	const gmt7Ms = utcMs + gmt7OffsetMs;
	const gmt7Date = new Date(gmt7Ms);

	const nextResetGmt7 = new Date(gmt7Ms);
	nextResetGmt7.setHours(24, 0, 0, 0);

	const timeUntilReset = nextResetGmt7.getTime() - gmt7Date.getTime();

	setTimeout(() => {
		resetHighScores();
		scheduleDailyReset();
	}, timeUntilReset);
}

loadHighScoresFromFile();
scheduleDailyReset();

function updateHighScoresAndBroadcast(lang, username, wpm, errors, playerCount, score = 0) {
	if (playerCount < 3) return;

	const currentRecord = highScores[lang];
	let isNewRecord = false;

	if (lang === "ngau_hung") {
		isNewRecord =
			!currentRecord ||
			score > (currentRecord.score || 0) ||
			(score === (currentRecord.score || 0) && errors < currentRecord.errors);
	} else {
		isNewRecord =
			!currentRecord ||
			wpm > currentRecord.wpm ||
			(wpm === currentRecord.wpm && errors < currentRecord.errors);
	}

	if (isNewRecord) {
		highScores[lang] = {
			username: username,
			wpm: wpm,
			score: score,
			errors: errors,
			timestamp: Date.now(),
		};
		saveHighScoresToFile();
		io.emit("update_high_scores", highScores);
	}
}

// ==========================================
// QUẢN LÝ TIN NHẮN CHAT & CHỐNG SPAM
// ==========================================
const MESSAGES_FILE = path.join(__dirname, "messages.json");
const MESSAGE_TTL = 3 * 60 * 1000;
let chatMessages = [];

const userChatHistory = new Map();
const mutedUsers = new Map();

function loadMessagesFromFile() {
	try {
		if (fs.existsSync(MESSAGES_FILE)) {
			const data = fs.readFileSync(MESSAGES_FILE, "utf8");
			chatMessages = JSON.parse(data);
			cleanOldMessages();
		}
	} catch (err) {
		console.log("Lỗi load messages:", err.message);
		chatMessages = [];
	}
}

function saveMessagesToFile() {
	try {
		fs.writeFileSync(MESSAGES_FILE, JSON.stringify(chatMessages, null, 2), "utf8");
	} catch (err) {
		console.log("Lỗi save messages:", err.message);
	}
}

function cleanOldMessages() {
	const now = Date.now();
	const initialLength = chatMessages.length;
	chatMessages = chatMessages.filter((msg) => now - msg.timestamp < MESSAGE_TTL);

	if (chatMessages.length !== initialLength) {
		saveMessagesToFile();
		io.emit("load_initial_messages", chatMessages);
	}
}

setInterval(cleanOldMessages, 10000);
loadMessagesFromFile();

function checkSpamLimit(socketId) {
	const now = Date.now();

	if (mutedUsers.has(socketId)) {
		const unmuteTime = mutedUsers.get(socketId);
		if (now < unmuteTime) {
			const remainingSec = Math.ceil((unmuteTime - now) / 1000);
			return { allowed: false, remainingSec };
		} else {
			mutedUsers.delete(socketId);
			userChatHistory.delete(socketId);
		}
	}

	let history = userChatHistory.get(socketId) || [];
	history = history.filter((time) => now - time < 5000);

	if (history.length >= 5) {
		const unmuteTime = now + 5000;
		mutedUsers.set(socketId, unmuteTime);
		userChatHistory.delete(socketId);
		return { allowed: false, remainingSec: 5 };
	}

	history.push(now);
	userChatHistory.set(socketId, history);
	return { allowed: true };
}

// ==========================================
// QUẢN LÝ ADMIN & BAN USER
// ==========================================
const connectedUsers = new Map();
const bannedUsers = new Map();

function isUserBanned(socketId) {
	if (!socketId || !bannedUsers.has(socketId)) return false;
	const b = bannedUsers.get(socketId);
	if (Date.now() > b.expiresAt) {
		unbanUser(socketId);
		return false;
	}
	return true;
}

function unbanUser(socketId) {
	if (bannedUsers.has(socketId)) {
		const b = bannedUsers.get(socketId);
		if (b.timeoutId) clearTimeout(b.timeoutId);
		bannedUsers.delete(socketId);
		broadcastAdminData();
	}
}

function getOnlineUsersList() {
	const list = [];
	for (let [id, u] of connectedUsers.entries()) {
		list.push({
			id: u.id,
			username: u.username || "Vô danh",
			isAdmin: u.isAdmin || false,
			isBanned: u.isAdmin ? false : isUserBanned(u.id),
		});
	}

	list.sort((a, b) => {
		if (a.isAdmin && !b.isAdmin) return -1;
		if (!a.isAdmin && b.isAdmin) return 1;
		return 0;
	});

	return list;
}

function getBannedUsersList() {
	const list = [];
	const now = Date.now();
	for (let [id, b] of bannedUsers.entries()) {
		const remainingSec = Math.max(0, Math.ceil((b.expiresAt - now) / 1000));
		list.push({
			id: b.id,
			username: b.username || "Vô danh",
			bannedAt: b.bannedAt,
			expiresAt: b.expiresAt,
			remainingSec: remainingSec,
		});
	}
	return list;
}

function broadcastAdminData() {
	const onlineList = getOnlineUsersList();
	const bannedList = getBannedUsersList();
	io.sockets.sockets.forEach((s) => {
		if (s.isAdmin) {
			s.emit("admin_online_users", onlineList);
			s.emit("admin_banned_users", bannedList);
		}
	});
}

// ==========================================
// DỮ LIỆU TỪ VỰNG & QUẢN LÝ ROOM
// ==========================================
const BIG_WORD_BANKS = {
	vi_dau: {
		easy: [
			"ngày",
			"đêm",
			"mưa",
			"nắng",
			"gió",
			"mây",
			"sông",
			"núi",
			"biển",
			"rừng",
			"trời",
			"đất",
			"lửa",
			"nước",
			"cây",
			"hoa",
			"lá",
			"cỏ",
			"chim",
			"cá",
			"nhà",
			"xe",
			"cơm",
			"áo",
			"tiền",
			"sách",
			"bút",
			"bàn",
			"ghế",
			"đèn",
			"tay",
			"chân",
			"mắt",
			"mũi",
			"tai",
			"miệng",
			"tóc",
			"răng",
			"mặt",
			"lưng",
			"anh",
			"em",
			"ông",
			"bà",
			"cha",
			"mẹ",
			"con",
			"chú",
			"bác",
			"cô",
			"thầy",
			"bạn",
			"người",
			"bé",
			"trẻ",
			"già",
			"nam",
			"nữ",
			"tôi",
			"ta",
			"mình",
			"bạn",
			"họ",
			"ai",
			"gì",
			"đâu",
			"đây",
			"đó",
			"này",
			"kia",
			"sáng",
			"trưa",
			"chiều",
			"tối",
			"hôm",
			"mai",
			"nay",
			"sớm",
			"muộn",
			"lúc",
			"giờ",
			"năm",
			"tháng",
			"tuần",
			"phút",
			"mùa",
			"xuân",
			"hè",
			"thu",
			"đông",
			"một",
			"hai",
			"ba",
			"bốn",
			"năm",
			"sáu",
			"bảy",
			"tám",
			"chín",
			"mười",
			"lớn",
			"nhỏ",
			"cao",
			"thấp",
			"dài",
			"ngắn",
			"to",
			"bé",
			"mới",
			"cũ",
			"tốt",
			"xấu",
			"đẹp",
			"hay",
			"dở",
			"nhanh",
			"chậm",
			"đúng",
			"sai",
			"dễ",
			"khó",
			"vui",
			"buồn",
			"yêu",
			"ghét",
			"thích",
			"sợ",
			"lo",
			"tin",
			"nhớ",
			"quên",
			"cười",
			"khóc",
			"nói",
			"nghe",
			"đọc",
			"viết",
			"xem",
			"ăn",
			"uống",
			"ngủ",
			"đi",
			"đến",
			"về",
			"ra",
			"vào",
			"lên",
			"xuống",
			"qua",
			"lại",
			"chạy",
			"đi",
			"đứng",
			"ngồi",
			"nằm",
			"bay",
			"bơi",
			"nhảy",
			"đánh",
			"đá",
			"mở",
			"đóng",
			"bật",
			"tắt",
			"đưa",
			"nhận",
			"cho",
			"lấy",
			"giữ",
			"mất",
			"tìm",
			"gặp",
			"gọi",
			"hỏi",
			"trả",
			"mua",
			"bán",
			"dùng",
			"làm",
			"học",
			"dạy",
			"làm",
			"sống",
			"chết",
			"sinh",
			"giúp",
			"cần",
			"muốn",
			"có",
			"không",
			"rất",
			"cũng",
			"đã",
			"đang",
			"sẽ",
			"vẫn",
			"chỉ",
			"còn",
			"được",
			"bị",
			"và",
			"hay",
			"hoặc",
			"nhưng",
			"vì",
			"nên",
			"nếu",
			"khi",
			"mà",
			"để",
			"với",
			"cho",
			"từ",
			"theo",
			"trên",
			"dưới",
			"trong",
			"ngoài",
			"trước",
			"sau",
			"bên",
			"giữa",
			"gần",
			"xa",
			"cùng",
			"khác",
			"mỗi",
			"mọi",
			"nhiều",
			"ít",
			"đủ",
			"thiếu",
			"hết",
			"thêm",
			"bớt",
			"đầu",
			"cuối",
			"giữa",
			"trái",
			"phải",
			"trong",
			"ngoài",
			"sau",
			"trước",
			"bóng",
			"hình",
			"màu",
			"âm",
			"ánh",
			"sáng",
			"đường",
			"phố",
			"làng",
			"chợ",
			"trường",
			"lớp",
			"phòng",
			"cửa",
			"tường",
			"sân",
			"vườn",
			"ruộng",
			"đồng",
			"bãi",
			"bờ",
			"cầu",
			"sách",
			"vở",
			"giấy",
			"mực",
			"kim",
			"đồng",
			"vàng",
			"bạc",
			"đá",
			"gỗ",
			"sắt",
			"vải",
			"da",
			"len",
			"bát",
			"đĩa",
			"cốc",
			"ly",
			"nồi",
			"chén",
			"dao",
			"kéo",
			"muỗng",
			"thìa",
			"bánh",
			"kẹo",
			"đường",
			"muối",
			"cá",
			"thịt",
			"trứng",
			"rau",
			"quả",
			"gạo",
			"bếp",
			"nồi",
			"xoong",
			"chảo",
			"bếp",
			"cơm",
			"cháo",
			"canh",
			"súp",
			"mì",
			"phở",
			"bún",
			"bánh",
			"sữa",
			"trà",
			"cà",
			"nước",
			"mật",
			"mía",
			"dừa",
			"cam",
			"chanh",
			"xoài",
			"ổi",
			"mít",
			"na",
			"lê",
			"đào",
			"mận",
			"dưa",
			"bí",
			"đậu",
			"ngô",
			"khoai",
			"sắn",
			"lạc",
			"vừng",
			"mè",
			"tiêu",
			"tỏi",
			"gừng",
			"ớt",
			"hành",
			"tôm",
			"cua",
			"ốc",
			"nghêu",
			"sò",
			"lươn",
			"ếch",
			"gà",
			"vịt",
			"heo",
			"bò",
			"dê",
			"ngựa",
			"trâu",
			"voi",
			"hổ",
			"sư tử",
			"gấu",
			"khỉ",
			"nai",
			"hươu",
			"cáo",
			"sói",
			"mèo",
			"thỏ",
			"chuột",
			"rắn",
			"rùa",
			"ếch",
			"ong",
			"kiến",
			"muỗi",
			"ruồi",
			"bướm",
			"sâu",
			"nhện",
			"dế",
			"đỏ",
			"xanh",
			"vàng",
			"trắng",
			"đen",
			"tím",
			"hồng",
			"nâu",
			"cam",
			"xám",
			"tròn",
			"vuông",
			"thẳng",
			"cong",
			"mềm",
			"cứng",
			"nóng",
			"lạnh",
			"ấm",
			"mát",
		],
		hard: [
			"khoảnh",
			"nghiêng",
			"khuếch",
			"khuỵu",
			"ngoéo",
			"thuở",
			"ngoằn",
			"ngoèo",
			"nghiến",
			"nguyện",
			"truyền",
			"khuyến",
			"chuyện",
			"quyển",
			"quỷ",
			"nghễu",
			"nghiễu",
			"soạn",
			"duyệt",
			"chuộng",
			"hoảng",
			"khoảng",
			"nghèo",
			"xoắn",
			"ngoắc",
			"khoác",
			"hoắt",
			"hoẵng",
			"thuần",
			"khuần",
			"ngoài",
			"quệt",
			"nghiêm",
			"nghiệm",
			"nghiệp",
			"nghiêng",
			"nguyễn",
			"quyết",
			"quyền",
			"quýnh",
			"quỳnh",
			"quyến",
			"quyện",
			"uyển",
			"uyển",
			"uyết",
			"huyễn",
			"huyền",
			"huyện",
			"chuyển",
			"chuyến",
			"chuyện",
			"chuyễn",
			"tuyển",
			"tuyến",
			"tuyệt",
			"tuyên",
			"duyên",
			"duyệt",
			"khuyết",
			"khuyến",
			"khuyên",
			"khuyển",
			"khuya",
			"khuây",
			"khuất",
			"khuẩn",
			"khuếch",
			"khuôn",
			"nguệch",
			"nguẩy",
			"nguẩy",
			"nguyện",
			"nguyệt",
			"nguyền",
			"nguyền",
			"nghịch",
			"nghiệt",
			"nghiễm",
			"nghĩa",
			"nghễnh",
			"nghệch",
			"nghênh",
			"nghiêm",
			"nghiễm",
			"nguyễn",
			"ngoảnh",
			"ngoặt",
			"ngoằn",
			"ngoẵng",
			"ngoẹo",
			"ngoét",
			"xoẹt",
			"xoắn",
			"xoạc",
			"xoạch",
			"quạnh",
			"quẫy",
			"quệt",
			"khuỷu",
			"khuất",
			"khuynh",
			"khuấy",
			"khuya",
			"khoắng",
			"khoảnh",
			"khoẻn",
			"khuyến",
			"khuyết",
			"khuyển",
			"khuyếch",
			"nghiêng",
			"nghiễm",
			"nghiến",
			"nghễnh",
			"nghệch",
			"nghênh",
			"nguyện",
			"nguyệt",
			"nguyền",
			"nguyền",
			"nguệch",
			"nguẩy",
			"ngoảnh",
			"ngoặt",
			"ngoằn",
			"ngoẵng",
			"ngoẹo",
			"ngoét",
			"xoẹt",
			"xoạc",
			"xoạch",
			"xoắn",
			"quạnh",
			"quẫy",
			"quệt",
			"quyến",
			"quyện",
			"quyền",
			"quyết",
			"quỳnh",
			"huyễn",
			"huyện",
			"uyển",
			"tuyển",
			"tuyến",
			"tuyệt",
			"duyên",
			"khuyết",
		],
	},
	vi_nodau: {
		easy: [
			"ngay",
			"dem",
			"mua",
			"nang",
			"gio",
			"may",
			"song",
			"nui",
			"bien",
			"rung",
			"troi",
			"dat",
			"lua",
			"nuoc",
			"cay",
			"hoa",
			"la",
			"co",
			"chim",
			"ca",
			"nha",
			"xe",
			"com",
			"ao",
			"tien",
			"sach",
			"but",
			"ban",
			"ghe",
			"den",
			"tay",
			"chan",
			"mat",
			"mui",
			"tai",
			"mieng",
			"toc",
			"rang",
			"mat",
			"lung",
			"anh",
			"em",
			"ong",
			"ba",
			"cha",
			"me",
			"con",
			"chu",
			"bac",
			"co",
			"thay",
			"ban",
			"nguoi",
			"be",
			"tre",
			"gia",
			"nam",
			"nu",
			"toi",
			"ta",
			"minh",
			"ban",
			"ho",
			"ai",
			"gi",
			"dau",
			"day",
			"do",
			"nay",
			"kia",
			"sang",
			"trua",
			"chieu",
			"toi",
			"hom",
			"mai",
			"nay",
			"som",
			"muon",
			"luc",
			"gio",
			"nam",
			"thang",
			"tuan",
			"phut",
			"mua",
			"xuan",
			"he",
			"thu",
			"dong",
			"mot",
			"hai",
			"ba",
			"bon",
			"nam",
			"sau",
			"bay",
			"tam",
			"chin",
			"muoi",
			"lon",
			"nho",
			"cao",
			"thap",
			"dai",
			"ngan",
			"to",
			"be",
			"moi",
			"cu",
			"tot",
			"xau",
			"dep",
			"hay",
			"do",
			"nhanh",
			"cham",
			"dung",
			"sai",
			"de",
			"kho",
			"vui",
			"buon",
			"yeu",
			"ghet",
			"thich",
			"so",
			"lo",
			"tin",
			"nho",
			"quen",
			"cuoi",
			"khoc",
			"noi",
			"nghe",
			"doc",
			"viet",
			"xem",
			"an",
			"uong",
			"ngu",
			"di",
			"den",
			"ve",
			"ra",
			"vao",
			"len",
			"xuong",
			"qua",
			"lai",
			"chay",
			"di",
			"dung",
			"ngoi",
			"nam",
			"bay",
			"boi",
			"nhay",
			"danh",
			"da",
			"mo",
			"dong",
			"bat",
			"tat",
			"dua",
			"nhan",
			"cho",
			"lay",
			"giu",
			"mat",
			"tim",
			"gap",
			"goi",
			"hoi",
			"tra",
			"mua",
			"ban",
			"dung",
			"lam",
			"hoc",
			"day",
			"lam",
			"song",
			"chet",
			"sinh",
			"giup",
			"can",
			"muon",
			"co",
			"khong",
			"rat",
			"cung",
			"da",
			"dang",
			"se",
			"van",
			"chi",
			"con",
			"duoc",
			"bi",
			"va",
			"hay",
			"hoac",
			"nhung",
			"vi",
			"nen",
			"neu",
			"khi",
			"ma",
			"de",
			"voi",
			"cho",
			"tu",
			"theo",
			"tren",
			"duoi",
			"trong",
			"ngoai",
			"truoc",
			"sau",
			"ben",
			"giua",
			"gan",
			"xa",
			"cung",
			"khac",
			"moi",
			"moi",
			"nhieu",
			"it",
			"du",
			"thieu",
			"het",
			"them",
			"bot",
			"dau",
			"cuoi",
			"giua",
			"trai",
			"phai",
			"trong",
			"ngoai",
			"sau",
			"truoc",
			"bong",
			"hinh",
			"mau",
			"am",
			"anh",
			"sang",
			"duong",
			"pho",
			"lang",
			"cho",
			"truong",
			"lop",
			"phong",
			"cua",
			"tuong",
			"san",
			"vuon",
			"ruong",
			"dong",
			"bai",
			"bo",
			"cau",
			"sach",
			"vo",
			"giay",
			"muc",
			"kim",
			"dong",
			"vang",
			"bac",
			"da",
			"go",
			"sat",
			"vai",
			"da",
			"len",
			"bat",
			"dia",
			"coc",
			"ly",
			"noi",
			"chen",
			"dao",
			"keo",
			"muong",
			"thia",
			"banh",
			"keo",
			"duong",
			"muoi",
			"ca",
			"thit",
			"trung",
			"rau",
			"qua",
			"gao",
			"bep",
			"noi",
			"xoong",
			"chao",
			"bep",
			"com",
			"chao",
			"canh",
			"sup",
			"mi",
			"pho",
			"bun",
			"banh",
			"sua",
			"tra",
			"ca",
			"nuoc",
			"mat",
			"mia",
			"dua",
			"cam",
			"chanh",
			"xoai",
			"oi",
			"mit",
			"na",
			"le",
			"dao",
			"man",
			"dua",
			"bi",
			"dau",
			"ngo",
			"khoai",
			"san",
			"lac",
			"vung",
			"me",
			"tieu",
			"toi",
			"gung",
			"ot",
			"hanh",
			"tom",
			"cua",
			"oc",
			"ngheu",
			"so",
			"luon",
			"ech",
			"ga",
			"vit",
			"heo",
			"bo",
			"de",
			"ngua",
			"trau",
			"voi",
			"ho",
			"su tu",
			"gau",
			"khi",
			"nai",
			"huou",
			"cao",
			"soi",
			"meo",
			"tho",
			"chuot",
			"ran",
			"rua",
			"ech",
			"ong",
			"kien",
			"muoi",
			"ruoi",
			"buom",
			"sau",
			"nhen",
			"de",
			"do",
			"xanh",
			"vang",
			"trang",
			"den",
			"tim",
			"hong",
			"nau",
			"cam",
			"xam",
			"tron",
			"vuong",
			"thang",
			"cong",
			"mem",
			"cung",
			"nong",
			"lanh",
			"am",
			"mat",
		],
		hard: [
			"khoanh",
			"nghieng",
			"khuech",
			"khuyu",
			"ngoeo",
			"thuo",
			"ngoan",
			"ngheo",
			"nghien",
			"nguyen",
			"truyen",
			"khuyen",
			"chuyen",
			"quyen",
			"quy",
			"ngheu",
			"nghieu",
			"soan",
			"duyet",
			"chuong",
			"hoang",
			"khoang",
			"ngheo",
			"xoan",
			"ngoac",
			"khoac",
			"hoat",
			"hoang",
			"thuan",
			"khuan",
			"ngoai",
			"quet",
			"nghiem",
			"nghiem",
			"nghiep",
			"nghieng",
			"nguyen",
			"quyet",
			"quyen",
			"quynh",
			"quynh",
			"quyen",
			"quyen",
			"uyen",
			"uyen",
			"uyet",
			"huyen",
			"huyen",
			"huyen",
			"chuyen",
			"chuyen",
			"chuyen",
			"chuyen",
			"tuyen",
			"tuyen",
			"tuyet",
			"tuyen",
			"duyen",
			"duyet",
			"khuyet",
			"khuyen",
			"khuyen",
			"khuyen",
			"khuya",
			"khuay",
			"khuat",
			"khuan",
			"khuech",
			"khuon",
			"nguech",
			"nguy",
			"nguy",
			"nguyen",
			"nguyet",
			"nguyen",
			"nguyen",
			"nghich",
			"nghiet",
			"nghiem",
			"nghia",
			"nghenh",
			"nghech",
			"nghenh",
			"nghiem",
			"nghiem",
			"nguyen",
			"ngoanh",
			"ngoat",
			"ngoan",
			"ngoang",
			"ngoeo",
			"ngoet",
			"xoet",
			"xoan",
			"xoac",
			"xoach",
			"quanh",
			"quay",
			"quet",
			"khuyu",
			"khuat",
			"khuynh",
			"khuay",
			"khuya",
			"khoang",
			"khoanh",
			"khoen",
			"khuyen",
			"khuyet",
			"khuyen",
			"khuech",
			"nghieng",
			"nghiem",
			"nghien",
			"nghenh",
			"nghech",
			"nghenh",
			"nguyen",
			"nguyet",
			"nguyen",
			"nguyen",
			"nguech",
			"nguay",
			"ngoanh",
			"ngoat",
			"ngoan",
			"ngoang",
			"ngoeo",
			"ngoet",
			"xoet",
			"xoac",
			"xoach",
			"xoan",
			"quanh",
			"quay",
			"quet",
			"quyen",
			"quyen",
			"quyen",
			"quyet",
			"quynh",
			"huyen",
			"huyen",
			"uyen",
			"tuyen",
			"tuyen",
			"tuyet",
			"duyen",
			"khuyet",
		],
	},
	en: {
		easy: [
			"cat",
			"dog",
			"sun",
			"moon",
			"star",
			"tree",
			"book",
			"pen",
			"desk",
			"fish",
			"fast",
			"good",
			"apple",
			"orange",
			"grape",
			"peach",
			"pear",
			"lemon",
			"melon",
			"berry",
			"bread",
			"rice",
			"cake",
			"soup",
			"milk",
			"water",
			"juice",
			"coffee",
			"tea",
			"sugar",
			"salt",
			"egg",
			"meat",
			"beef",
			"pork",
			"fish",
			"chicken",
			"duck",
			"horse",
			"sheep",
			"goat",
			"mouse",
			"house",
			"home",
			"room",
			"door",
			"wall",
			"floor",
			"roof",
			"bed",
			"chair",
			"table",
			"school",
			"class",
			"teacher",
			"student",
			"friend",
			"family",
			"mother",
			"father",
			"sister",
			"brother",
			"baby",
			"child",
			"boy",
			"girl",
			"man",
			"woman",
			"king",
			"queen",
			"name",
			"face",
			"hand",
			"head",
			"hair",
			"eye",
			"ear",
			"nose",
			"mouth",
			"foot",
			"leg",
			"arm",
			"car",
			"bus",
			"train",
			"boat",
			"road",
			"street",
			"park",
			"shop",
			"store",
			"farm",
			"red",
			"blue",
			"green",
			"white",
			"black",
			"brown",
			"pink",
			"gray",
			"round",
			"square",
			"big",
			"small",
			"long",
			"short",
			"high",
			"low",
			"hot",
			"cold",
			"warm",
			"cool",
		],
		hard: [
			"rhythm",
			"queue",
			"knapsack",
			"quizzical",
			"puzzling",
			"knowledge",
			"strength",
			"synergy",
			"awkward",
			"beautiful",
			"bizarre",
			"brilliant",
			"cautious",
			"curious",
			"dangerous",
			"delicate",
			"difficult",
			"efficient",
			"enormous",
			"excellent",
			"fascinating",
			"fortunate",
			"generous",
			"gorgeous",
			"grateful",
			"harmonious",
			"impressive",
			"incredible",
			"independent",
			"intelligent",
			"mysterious",
			"necessary",
			"obvious",
			"optimistic",
			"particular",
			"powerful",
			"precious",
			"previous",
			"reasonable",
			"remarkable",
			"significant",
			"spectacular",
			"successful",
			"surprising",
			"technical",
			"thoughtful",
			"traditional",
			"unusual",
			"valuable",
			"wonderful",
			"adventure",
			"challenge",
			"experience",
			"knowledge",
			"language",
			"question",
			"strength",
			"throughout",
		],
	},
};
const runnerIcons = [
	"🤖",
	"🐶",
	"🐭",
	"🐷",
	"🐱",
	"🐨",
	"🐯",
	"🐺",
	"🐰",
	"🦝",
	"🐵",
	"🦁",
	"🐸",
	"🐧",
	"🐻",
	"🐼",
	"🐲",
	"🐢",
	"🦑",
	"🦭",
];

function generateNgauHungItems(count = NGAU_HUNG_TOTAL_ROUNDS) {
	const list = [];
	const viPool = [...BIG_WORD_BANKS.vi_nodau.easy, ...BIG_WORD_BANKS.vi_nodau.hard];
	const enPool = [...BIG_WORD_BANKS.en.easy, ...BIG_WORD_BANKS.en.hard];

	for (let i = 0; i < count; i++) {
		const type = Math.floor(Math.random() * 3);
		if (type === 0) {
			list.push(viPool[Math.floor(Math.random() * viPool.length)]);
		} else if (type === 1) {
			list.push(enPool[Math.floor(Math.random() * enPool.length)]);
		} else {
			list.push(Math.floor(10000 + Math.random() * 90000).toString());
		}
	}
	return list;
}

function generateWords(lang, count = 100) {
	if (lang === "ngau_hung") {
		return generateNgauHungItems(NGAU_HUNG_TOTAL_ROUNDS);
	}
	if (lang === "numpad") {
		const zipList = [];
		for (let i = 0; i < 500; i++)
			zipList.push(Math.floor(10000 + Math.random() * 90000).toString());
		return zipList;
	}
	const bank = BIG_WORD_BANKS[lang] || BIG_WORD_BANKS.vi_dau;
	const result = [];
	for (let i = 0; i < count; i++) {
		const isHard = Math.random() < 0.3;
		const pool = isHard ? bank.hard : bank.easy;
		result.push(pool[Math.floor(Math.random() * pool.length)]);
	}
	return result;
}

const rooms = { en: [], vi_nodau: [], vi_dau: [], numpad: [], ngau_hung: [] };
let totalOnlineUsers = 0;

function getOrCreateRoom(lang) {
	let roomList = rooms[lang] || rooms.vi_dau;
	let room = roomList.find((r) => r.state === "waiting" && r.players.length < 10);

	if (!room) {
		room = {
			id: "room_" + lang + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
			lang: lang,
			state: "waiting",
			players: [],
			words: generateWords(lang),
			matchInterval: null,
			startTime: null,
			finishedCount: 0,
			currentRound: 0,
			totalRounds: NGAU_HUNG_TOTAL_ROUNDS,
			roundWinners: [],
			roundActive: false,
			roundTimer: null,
			roundIntermissionTimer: null,
		};
		roomList.push(room);
	}
	return room;
}

function clearRoomTimers(room) {
	if (room.matchInterval) clearInterval(room.matchInterval);
	if (room.roundTimer) clearTimeout(room.roundTimer);
	if (room.roundIntermissionTimer) clearTimeout(room.roundIntermissionTimer);
}

function checkMatchCompletion(room) {
	if (room.lang === "ngau_hung") return;
	const activeOrFinished = room.players.filter(
		(p) => p.isFinished || p.isSurrendered || p.isDisconnected,
	);
	if (activeOrFinished.length >= room.players.length) finishMatch(room);
}

function startNgauHungRound(room) {
	if (room.state !== "playing") return;

	room.currentRound++;
	if (room.currentRound > room.totalRounds) {
		finishMatch(room);
		return;
	}

	room.roundWinners = [];
	room.roundActive = true;
	const currentWord = room.words[room.currentRound - 1];

	io.to(room.id).emit("ngau_hung_new_round", {
		round: room.currentRound,
		totalRounds: room.totalRounds,
		targetWord: currentWord,
		duration: NGAU_HUNG_ROUND_DURATION, // 7 giây
	});

	if (room.roundTimer) clearTimeout(room.roundTimer);
	room.roundTimer = setTimeout(() => {
		endNgauHungRound(room);
	}, NGAU_HUNG_ROUND_DURATION * 1000); // 7000ms
}

function endNgauHungRound(room) {
	if (!room.roundActive || room.state !== "playing") return;
	room.roundActive = false;
	if (room.roundTimer) clearTimeout(room.roundTimer);

	io.to(room.id).emit("ngau_hung_round_ended", {
		round: room.currentRound,
		roundWinners: room.roundWinners,
		players: room.players,
	});

	if (room.currentRound >= room.totalRounds) {
		setTimeout(() => {
			finishMatch(room);
		}, 1500);
	} else {
		io.to(room.id).emit("ngau_hung_intermission", { duration: NGAU_HUNG_INTERMISSION_DURATION }); // 3 giây
		if (room.roundIntermissionTimer) clearTimeout(room.roundIntermissionTimer);
		room.roundIntermissionTimer = setTimeout(() => {
			startNgauHungRound(room);
		}, NGAU_HUNG_INTERMISSION_DURATION * 1000); // 3000ms
	}
}

function finishMatch(room) {
	if (room.state === "finished") return;
	room.state = "finished";
	clearRoomTimers(room);

	// Thuật toán sắp xếp: Người bị AFK/Đầu hàng xếp dưới, nếu nhiều người AFK thì ai nhiều ký tự hơn xếp trên
	const leaderboard = [...room.players].sort((a, b) => {
		const isInactiveA = a.isSurrendered || a.isDisconnected || a.isAFK;
		const isInactiveB = b.isSurrendered || b.isDisconnected || b.isAFK;

		if (isInactiveA && !isInactiveB) return 1;
		if (!isInactiveA && isInactiveB) return -1;

		if (isInactiveA && isInactiveB) {
			return (b.correctChars || 0) - (a.correctChars || 0) || (a.errors || 0) - (b.errors || 0);
		}

		if (room.lang === "ngau_hung") {
			return (
				(b.score || 0) - (a.score || 0) ||
				(b.correctChars || 0) - (a.correctChars || 0) ||
				(a.errors || 0) - (b.errors || 0)
			);
		}
		return (
			(b.wpm || 0) - (a.wpm || 0) ||
			(b.correctChars || 0) - (a.correctChars || 0) ||
			(a.errors || 0) - (b.errors || 0)
		);
	});

	io.to(room.id).emit("game_over", {
		leaderboard: leaderboard,
		language: room.lang,
	});

	leaderboard.forEach((p) => {
		if (!p.isSurrendered && !p.isDisconnected && !p.isAFK) {
			updateHighScoresAndBroadcast(
				room.lang,
				p.username,
				p.wpm || 0,
				p.errors || 0,
				room.players.length,
				p.score || 0,
			);
		}
	});

	if (rooms[room.lang]) {
		rooms[room.lang] = rooms[room.lang].filter((r) => r.id !== room.id);
	}
}

// ==========================================
// SOCKET.IO EVENTS
// ==========================================
io.on("connection", (socket) => {
	totalOnlineUsers++;

	connectedUsers.set(socket.id, {
		id: socket.id,
		username: "Vô danh",
		isAdmin: false,
	});

	io.emit("update_online_count", totalOnlineUsers);
	socket.emit("init_high_scores", highScores);
	socket.emit("load_initial_messages", chatMessages);
	broadcastAdminData();

	let currentRoom = null;
	let player = null;

	function leaveCurrentLobby() {
		if (currentRoom && player) {
			socket.leave(currentRoom.id);

			if (currentRoom.state === "playing") {
				player.isDisconnected = true;
				io.to(currentRoom.id).emit("race_update", currentRoom.players);

				if (currentRoom.lang === "ngau_hung") {
					const activeRemaining = currentRoom.players.filter(
						(p) => !p.isSurrendered && !p.isDisconnected && !p.isAFK,
					);
					if (activeRemaining.length === 0) {
						finishMatch(currentRoom);
					}
				} else {
					checkMatchCompletion(currentRoom);
				}
			} else {
				currentRoom.players = currentRoom.players.filter((p) => p.id !== socket.id);
				if (currentRoom.players.length === 0) {
					clearRoomTimers(currentRoom);
					if (rooms[currentRoom.lang]) {
						rooms[currentRoom.lang] = rooms[currentRoom.lang].filter(
							(r) => r.id !== currentRoom.id,
						);
					}
				} else if (currentRoom.state === "waiting") {
					io.to(currentRoom.id).emit("update_lobby", {
						players: currentRoom.players,
						language: currentRoom.lang,
					});
				}
			}
			currentRoom = null;
			player = null;
		}
	}

	// --- ADMIN SOCKET EVENTS ---
	socket.on("admin_login", ({ password }) => {
		if (password === ADMIN_PASSWORD) {
			socket.isAdmin = true;
			const u = connectedUsers.get(socket.id);
			if (u) u.isAdmin = true;

			socket.emit("admin_login_response", { success: true });
			broadcastAdminData();
		} else {
			socket.emit("admin_login_response", {
				success: false,
				message: "Mật khẩu Admin không chính xác!",
			});
		}
	});

	socket.on("admin_logout", () => {
		socket.isAdmin = false;
		const u = connectedUsers.get(socket.id);
		if (u) u.isAdmin = false;

		socket.emit("admin_logout_response");
		broadcastAdminData();
	});

	socket.on("admin_ban_user", ({ targetSocketId }) => {
		if (!socket.isAdmin) return;
		const targetSocket = io.sockets.sockets.get(targetSocketId);
		const targetUser = connectedUsers.get(targetSocketId);

		const expiresAt = Date.now() + 5 * 60 * 1000;
		const timeoutId = setTimeout(
			() => {
				unbanUser(targetSocketId);
			},
			5 * 60 * 1000,
		);

		bannedUsers.set(targetSocketId, {
			id: targetSocketId,
			username: targetUser ? targetUser.username : "Vô danh",
			bannedAt: Date.now(),
			expiresAt: expiresAt,
			timeoutId: timeoutId,
		});

		if (targetSocket) {
			targetSocket.emit("banned_notice", {
				message: "Bạn đã bị Admin tạm cấm 5 phút!",
				expiresAt: expiresAt,
			});
		}

		broadcastAdminData();
	});

	socket.on("admin_unban_user", ({ targetId }) => {
		if (!socket.isAdmin) return;
		unbanUser(targetId);
	});

	socket.on("admin_clear_chat", () => {
		if (!socket.isAdmin) return;
		chatMessages = [];
		saveMessagesToFile();
		io.emit("clear_global_chat");
	});

	socket.on("admin_reset_highscore", ({ lang }) => {
		if (!socket.isAdmin) return;
		if (highScores.hasOwnProperty(lang)) {
			highScores[lang] = null;
			saveHighScoresToFile();
			io.emit("update_high_scores", highScores);
		}
	});

	socket.on("admin_kick_lobby_player", ({ targetSocketId }) => {
		if (!socket.isAdmin) return;
		const targetSocket = io.sockets.sockets.get(targetSocketId);
		if (targetSocket) {
			targetSocket.emit("kicked_from_lobby", {
				message: "Bạn đã bị Admin đá ra khỏi phòng chờ!",
			});
		}
	});

	// --- GAME & CHAT EVENTS ---
	socket.on("update_username", (data) => {
		const u = connectedUsers.get(socket.id);
		if (u) u.username = data.username;
		broadcastAdminData();
	});

	socket.on("send_global_chat", (data) => {
		const spamStatus = checkSpamLimit(socket.id);
		if (!spamStatus.allowed) {
			socket.emit("chat_error", {
				message: `Bạn thao tác quá nhanh! Vui lòng chờ ${spamStatus.remainingSec}s để tiếp tục nhắn.`,
			});
			return;
		}

		const msgData = {
			username: data.username || "Vô danh",
			message: data.message,
			timestamp: Date.now(),
		};

		chatMessages.push(msgData);
		cleanOldMessages();
		saveMessagesToFile();

		io.emit("receive_global_chat", msgData);
	});

	socket.on("send_in_game_chat", (data) => {
		if (currentRoom) {
			const u = connectedUsers.get(socket.id);
			io.to(currentRoom.id).emit("receive_in_game_chat", {
				username: u ? u.username : "Vô danh",
				message: data.message,
			});
		}
	});

	socket.on("join_lobby", (data) => {
		if (isUserBanned(socket.id)) {
			const b = bannedUsers.get(socket.id);
			socket.emit("join_lobby_banned", {
				message: "Bạn đang bị cấm tham gia phòng chờ!",
				expiresAt: b ? b.expiresAt : Date.now(),
			});
			return;
		}

		leaveCurrentLobby();

		const lang = data.language || "vi_dau";
		const username = data.username || "Vô danh";
		const selectedIcon = data.selectedIcon || runnerIcons[0];

		currentRoom = getOrCreateRoom(lang);

		player = {
			id: socket.id,
			username: username,
			icon: selectedIcon,
			progress: 0,
			wpm: 0,
			score: 0,
			errors: 0,
			correctChars: 0,
			isFinished: false,
			isSurrendered: false,
			isAFK: false,
			isDisconnected: false,
		};

		currentRoom.players.push(player);
		socket.join(currentRoom.id);

		io.to(currentRoom.id).emit("update_lobby", {
			players: currentRoom.players,
			language: currentRoom.lang,
		});
	});

	socket.on("select_icon", (data) => {
		if (currentRoom && player) {
			player.icon = data.icon;
			io.to(currentRoom.id).emit("update_lobby", {
				players: currentRoom.players,
				language: currentRoom.lang,
			});
		}
	});

	socket.on("force_start_game", () => {
		if (currentRoom && currentRoom.state === "waiting") {
			currentRoom.state = "playing";
			currentRoom.startTime = Date.now();

			io.to(currentRoom.id).emit("game_start", {
				words: currentRoom.words,
				players: currentRoom.players,
				countdown: 3,
				language: currentRoom.lang,
			});

			if (currentRoom.lang === "ngau_hung") {
				currentRoom.currentRound = 0;
				setTimeout(() => {
					if (currentRoom && currentRoom.state === "playing") {
						startNgauHungRound(currentRoom);
					}
				}, 3000);
			}
		}
	});

	socket.on("submit_ngau_hung_word", (data) => {
		if (!currentRoom || currentRoom.lang !== "ngau_hung" || !currentRoom.roundActive || !player)
			return;
		if (player.isSurrendered || player.isDisconnected || player.isAFK) return;

		if (typeof data.errors === "number") {
			player.errors = data.errors;
		}

		const targetWord = currentRoom.words[currentRoom.currentRound - 1];
		if (data.word === targetWord && !currentRoom.roundWinners.includes(socket.id)) {
			currentRoom.roundWinners.push(socket.id);
			const rank = currentRoom.roundWinners.length;
			const pts = rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0;

			player.score = (player.score || 0) + pts;
			player.correctChars = (player.correctChars || 0) + targetWord.length;
			player.progress = Math.round((currentRoom.currentRound / currentRoom.totalRounds) * 100);

			socket.emit("ngau_hung_player_success", {
				rank: rank,
				pointsAwarded: pts,
				totalScore: player.score,
			});

			io.to(currentRoom.id).emit("race_update", currentRoom.players);

			const activePlayersCount = currentRoom.players.filter(
				(p) => !p.isSurrendered && !p.isDisconnected && !p.isAFK,
			).length;

			if (
				currentRoom.roundWinners.length >= 3 ||
				currentRoom.roundWinners.length >= activePlayersCount
			) {
				endNgauHungRound(currentRoom);
			}
		}
	});

	socket.on("leave_lobby", () => {
		leaveCurrentLobby();
	});

	socket.on("update_progress", (data) => {
		if (currentRoom && player) {
			player.progress = data.progress;
			player.wpm = data.wpm;
			player.correctChars = data.correctChars;
			player.errors = data.errors;

			io.to(currentRoom.id).emit("race_update", currentRoom.players);
		}
	});

	socket.on("player_finished", (data) => {
		if (currentRoom && player) {
			player.progress = 100;
			player.wpm = data.wpm;
			player.correctChars = data.correctChars;
			player.errors = data.errors;
			player.isFinished = true;

			io.to(currentRoom.id).emit("race_update", currentRoom.players);
			checkMatchCompletion(currentRoom);
		}
	});

	socket.on("surrender", (data) => {
		if (currentRoom && player) {
			player.isSurrendered = true;
			if (data && data.isAFK) {
				player.isAFK = true;
			}
			io.to(currentRoom.id).emit("race_update", currentRoom.players);

			if (currentRoom.lang === "ngau_hung") {
				const activeRemaining = currentRoom.players.filter(
					(p) => !p.isSurrendered && !p.isDisconnected && !p.isAFK,
				);
				if (activeRemaining.length === 0) {
					finishMatch(currentRoom);
				}
			} else {
				checkMatchCompletion(currentRoom);
			}
		}
	});

	socket.on("disconnect", () => {
		totalOnlineUsers = Math.max(0, totalOnlineUsers - 1);
		connectedUsers.delete(socket.id);

		leaveCurrentLobby();

		io.emit("update_online_count", totalOnlineUsers);
		broadcastAdminData();
	});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
