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
};

function loadHighScoresFromFile() {
	try {
		if (fs.existsSync(HIGHSCORES_FILE)) {
			const data = fs.readFileSync(HIGHSCORES_FILE, "utf8");
			highScores = JSON.parse(data);
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

function updateHighScoresAndBroadcast(lang, username, wpm, errors, playerCount) {
	if (playerCount < 3) return;

	const currentRecord = highScores[lang];
	const isNewRecord =
		!currentRecord ||
		wpm > currentRecord.wpm ||
		(wpm === currentRecord.wpm && errors < currentRecord.errors);

	if (isNewRecord) {
		highScores[lang] = {
			username: username,
			wpm: wpm,
			errors: errors,
			timestamp: Date.now(),
		};
		saveHighScoresToFile();
		io.emit("update_high_scores", highScores);
	}
}

// ==========================================
// QUẢN LÝ ADMIN & BAN USER
// ==========================================
const connectedUsers = new Map(); // socket.id -> { id, username, ip, isAdmin }
const bannedUsers = new Map(); // ip -> { ip, username, bannedAt, expiresAt, timeoutId }

function getClientIp(socket) {
	const forwarded = socket.handshake.headers["x-forwarded-for"];
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	return socket.handshake.address;
}

function isIpBanned(ip) {
	if (!bannedUsers.has(ip)) return false;
	const b = bannedUsers.get(ip);
	if (Date.now() > b.expiresAt) {
		unbanIp(ip);
		return false;
	}
	return true;
}

function unbanIp(ip) {
	if (bannedUsers.has(ip)) {
		const b = bannedUsers.get(ip);
		if (b.timeoutId) clearTimeout(b.timeoutId);
		bannedUsers.delete(ip);
		broadcastAdminData();
	}
}

function getOnlineUsersList() {
	const list = [];
	for (let [id, u] of connectedUsers.entries()) {
		list.push({
			id: u.id,
			username: u.username || "Vô danh",
			ip: u.ip,
			isAdmin: u.isAdmin || false,
			isBanned: u.isAdmin ? false : isIpBanned(u.ip),
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
	for (let [ip, b] of bannedUsers.entries()) {
		const remainingSec = Math.max(0, Math.ceil((b.expiresAt - now) / 1000));
		list.push({
			ip: b.ip,
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

function generateWords(lang, count = 100) {
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

const rooms = { en: [], vi_nodau: [], vi_dau: [], numpad: [] };
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
		};
		roomList.push(room);
	}
	return room;
}

function checkMatchCompletion(room) {
	const activeOrFinished = room.players.filter(
		(p) => p.isFinished || p.isSurrendered || p.isDisconnected,
	);
	if (activeOrFinished.length >= room.players.length) finishMatch(room);
}

// ==========================================
// SOCKET.IO EVENTS
// ==========================================
io.on("connection", (socket) => {
	totalOnlineUsers++;
	const clientIp = getClientIp(socket);

	connectedUsers.set(socket.id, {
		id: socket.id,
		username: "Vô danh",
		ip: clientIp,
		isAdmin: false,
	});

	io.emit("update_online_count", totalOnlineUsers);
	socket.emit("init_high_scores", highScores);
	broadcastAdminData();

	let currentRoom = null;
	let player = null;

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

		socket.emit("admin_logout_response", { success: true });
		broadcastAdminData();
	});

	socket.on("admin_ban_user", ({ targetSocketId }) => {
		if (!socket.isAdmin || targetSocketId === socket.id) return;

		const targetUser = connectedUsers.get(targetSocketId);
		if (!targetUser) return;

		const targetIp = targetUser.ip;
		const targetName = targetUser.username || "Vô danh";

		if (!targetIp) return;

		if (isIpBanned(targetIp)) return;

		const DURATION = 5 * 60 * 1000;
		const now = Date.now();
		const expiresAt = now + DURATION;

		const timeoutId = setTimeout(() => {
			unbanIp(targetIp);
		}, DURATION);

		bannedUsers.set(targetIp, {
			ip: targetIp,
			username: targetName,
			bannedAt: now,
			expiresAt: expiresAt,
			timeoutId: timeoutId,
		});

		io.sockets.sockets.forEach((s) => {
			if (getClientIp(s) === targetIp && !s.isAdmin) {
				s.emit("banned_notice", {
					expiresAt: expiresAt,
					message: "Bạn đã bị Admin tạm cấm 5 phút!",
				});
			}
		});

		broadcastAdminData();
	});

	socket.on("admin_unban_user", ({ targetIp }) => {
		if (!socket.isAdmin) return;
		unbanIp(targetIp);
	});

	socket.on("admin_reset_highscore", ({ lang }) => {
		if (!socket.isAdmin) return;
		if (lang && highScores.hasOwnProperty(lang)) {
			highScores[lang] = null;
		} else {
			highScores = { vi_dau: null, vi_nodau: null, en: null, numpad: null };
		}
		saveHighScoresToFile();
		io.emit("update_high_scores", highScores);
	});

	socket.on("admin_clear_chat", () => {
		if (!socket.isAdmin) return;
		io.emit("clear_global_chat");
	});

	// --- GAME SOCKET EVENTS ---
	socket.on("join_lobby", ({ username, language, selectedIcon }) => {
		if (!socket.isAdmin && isIpBanned(clientIp)) {
			const b = bannedUsers.get(clientIp);
			const expiresAt = b ? b.expiresAt : Date.now() + 5 * 60 * 1000;
			socket.emit("join_lobby_banned", {
				expiresAt: expiresAt,
				message: "Bạn đang bị cấm tham gia phòng chờ!",
			});
			return;
		}

		const selectedLang = language || "vi_dau";
		currentRoom = getOrCreateRoom(selectedLang);
		const defaultIcon = selectedIcon || runnerIcons[Math.floor(Math.random() * runnerIcons.length)];

		player = {
			id: socket.id,
			username: username || "TayĐua_" + Math.floor(1000 + Math.random() * 9000),
			icon: defaultIcon,
			progress: 0,
			wpm: 0,
			correctChars: 0,
			errors: 0,
			isFinished: false,
			isSurrendered: false,
			isDisconnected: false,
		};

		currentRoom.players.push(player);
		socket.join(currentRoom.id);

		io.to(currentRoom.id).emit("update_lobby", {
			players: currentRoom.players,
			lang: currentRoom.lang,
		});
	});

	socket.on("select_icon", ({ icon }) => {
		if (player && currentRoom && currentRoom.state === "waiting") {
			const isTaken = currentRoom.players.some((p) => p.id !== player.id && p.icon === icon);
			if (!isTaken) {
				player.icon = icon;
				io.to(currentRoom.id).emit("update_lobby", {
					players: currentRoom.players,
					lang: currentRoom.lang,
				});
			}
		}
	});

	socket.on("force_start_game", () => {
		if (currentRoom && currentRoom.state === "waiting") {
			currentRoom.state = "racing";
			io.to(currentRoom.id).emit("game_start", {
				words: currentRoom.words,
				players: currentRoom.players,
				countdown: 3,
			});
		}
	});

	socket.on("update_username", ({ username }) => {
		const cleanName = (username || "").trim() || "Vô danh";
		if (player) player.username = cleanName;

		const u = connectedUsers.get(socket.id);
		if (u) {
			u.username = cleanName;
			if (!u.isAdmin && bannedUsers.has(u.ip)) {
				bannedUsers.get(u.ip).username = cleanName;
			}
		}

		if (currentRoom) {
			io.to(currentRoom.id).emit("update_lobby", {
				players: currentRoom.players,
				lang: currentRoom.lang,
			});
		}
		broadcastAdminData();
	});

	socket.on("update_progress", (data) => {
		if (
			!currentRoom ||
			currentRoom.state !== "racing" ||
			!player ||
			player.isSurrendered ||
			player.isDisconnected
		)
			return;

		player.progress = data.progress || 0;
		player.wpm = data.wpm || 0;
		player.correctChars = data.correctChars || 0;
		player.errors = data.errors || 0;

		if (!currentRoom.startTime) {
			currentRoom.startTime = Date.now();
			io.to(currentRoom.id).emit("race_start_timer");
			const DURATION_MS = currentRoom.lang === "numpad" ? 90 * 1000 : 5 * 60 * 1000;
			currentRoom.matchInterval = setTimeout(() => {
				finishMatch(currentRoom);
			}, DURATION_MS);
		}

		io.to(currentRoom.id).emit("race_update", currentRoom.players);
	});

	socket.on("player_finished", (data) => {
		if (
			!currentRoom ||
			!player ||
			player.isFinished ||
			player.isSurrendered ||
			player.isDisconnected
		)
			return;

		player.isFinished = true;
		player.wpm = data.wpm;
		player.correctChars = data.correctChars;
		player.errors = data.errors;
		player.progress = 100;

		currentRoom.finishedCount++;
		checkMatchCompletion(currentRoom);
	});

	socket.on("surrender", () => {
		if (
			!currentRoom ||
			!player ||
			player.isFinished ||
			player.isSurrendered ||
			player.isDisconnected
		)
			return;

		player.isSurrendered = true;
		player.wpm = 0;
		io.to(currentRoom.id).emit("race_update", currentRoom.players);
		checkMatchCompletion(currentRoom);
	});

	socket.on("send_global_chat", ({ message, username }) => {
		if (!message || !message.trim()) return;
		const senderName = player && player.username ? player.username : username || "Vô danh";
		io.emit("receive_global_chat", {
			username: senderName,
			message: message.trim(),
			timestamp: Date.now(),
		});
	});

	socket.on("send_in_game_chat", ({ message }) => {
		if (currentRoom && player && message) {
			io.to(currentRoom.id).emit("receive_in_game_chat", {
				username: player.username,
				message: message.trim(),
			});
		}
	});

	socket.on("disconnect", () => {
		totalOnlineUsers = Math.max(0, totalOnlineUsers - 1);
		connectedUsers.delete(socket.id);
		io.emit("update_online_count", totalOnlineUsers);
		broadcastAdminData();

		if (currentRoom && player) {
			if (currentRoom.state === "waiting") {
				currentRoom.players = currentRoom.players.filter((p) => p.id !== socket.id);
				if (currentRoom.players.length === 0) {
					if (currentRoom.matchInterval) clearTimeout(currentRoom.matchInterval);
					if (rooms[currentRoom.lang]) {
						rooms[currentRoom.lang] = rooms[currentRoom.lang].filter(
							(r) => r.id !== currentRoom.id,
						);
					}
				} else {
					io.to(currentRoom.id).emit("update_lobby", {
						players: currentRoom.players,
						lang: currentRoom.lang,
					});
				}
			} else if (currentRoom.state === "racing") {
				player.isDisconnected = true;
				player.wpm = 0;
				io.to(currentRoom.id).emit("race_update", currentRoom.players);
				checkMatchCompletion(currentRoom);
			}
		}
	});
});

function finishMatch(room) {
	if (room.state === "finished") return;
	room.state = "finished";
	if (room.matchInterval) clearTimeout(room.matchInterval);

	const leaderboard = [...room.players].sort((a, b) => {
		if (a.isSurrendered || a.isDisconnected) return 1;
		if (b.isSurrendered || b.isDisconnected) return -1;
		if (b.wpm !== a.wpm) return b.wpm - a.wpm;
		return a.errors - b.errors;
	});

	if (leaderboard.length > 0) {
		const winner = leaderboard[0];
		if (!winner.isSurrendered && !winner.isDisconnected) {
			updateHighScoresAndBroadcast(
				room.lang,
				winner.username,
				winner.wpm || 0,
				winner.errors || 0,
				room.players.length,
			);
		}
	}
	io.to(room.id).emit("game_over", leaderboard);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server đang chạy trên port ${PORT}`));
