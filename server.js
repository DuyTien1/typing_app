const express = require("express");
const http = require("http");
const https = require("https");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// =========================================================================
// KHO TỪ VỰNG PHÂN LOẠI TỪ ĐƠN VÀ TỪ GHÉP (TỈ LỆ 80% - 20%)
// =========================================================================
const BIG_WORD_BANKS = {
	vi_dau: {
		single: [
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
			"hổ",
			"báo",
			"sói",
			"thỏ",
			"mèo",
			"chó",
			"trâu",
			"bò",
			"ngựa",
			"dê",
			"nhà",
			"cửa",
			"sách",
			"bút",
			"bàn",
			"ghế",
			"máy",
			"xe",
			"tàu",
			"thuyền",
			"chạy",
			"nhảy",
			"bơi",
			"bay",
			"đi",
			"đứng",
			"ngồi",
			"nằm",
			"ăn",
			"uống",
			"ngủ",
			"thức",
			"nghe",
			"nhìn",
			"nói",
			"cười",
			"khóc",
			"nghĩ",
			"yêu",
			"ghét",
			"nhanh",
			"chậm",
			"mạnh",
			"yếu",
			"cao",
			"thấp",
			"dài",
			"ngắn",
			"to",
			"nhỏ",
			"đỏ",
			"xanh",
			"vàng",
			"trắng",
			"đen",
			"tím",
			"hồng",
			"cam",
			"xám",
			"nâu",
			"sáng",
			"tối",
			"sớm",
			"muộn",
			"mới",
			"cũ",
			"đẹp",
			"xấu",
			"đúng",
			"sai",
			"mắt",
			"tai",
			"mũi",
			"miệng",
			"tay",
			"chân",
			"đầu",
			"tóc",
			"lưng",
			"bụng",
			"tim",
			"gan",
			"máu",
			"xương",
			"thịt",
			"da",
			"răng",
			"lưỡi",
			"vai",
			"ngực",
			"lúa",
			"ngô",
			"khoai",
			"sắn",
			"rau",
			"quả",
			"hạt",
			"mầm",
			"rễ",
			"thân",
			"vui",
			"buồn",
			"giận",
			"hờn",
			"sợ",
			"lo",
			"mơ",
			"ước",
			"nhớ",
			"quên",
		],
		compound: [
			"hà-nội",
			"sài-gòn",
			"đà-nẵng",
			"phú-quốc",
			"việt-nam",
			"thái-lan",
			"nhật-bản",
			"hàn-quốc",
			"mỹ-tho",
			"cần-thơ",
			"công-nghe",
			"máy-tính",
			"lập-trình",
			"mạng-lưới",
			"dữ-liệu",
			"bảo-mật",
			"giao-diện",
			"máy-chủ",
			"ứng-dụng",
			"hệ-thống",
			"trí-tuệ",
			"nhân-tạo",
			"kỹ-thuật",
			"sáng-tạo",
			"phát-triển",
			"tương-lai",
			"hiện-đại",
			"tự-động",
			"quy-trình",
			"giải-pháp",
			"học-sinh",
			"sinh-viên",
			"thầy-cô",
			"trường-học",
			"lớp-học",
			"bài-tập",
			"kiến-thức",
			"kỹ-năng",
			"tư-duy",
			"sách-vở",
			"gia-đình",
			"bố-mẹ",
			"ông-bà",
			"anh-em",
			"con-cái",
			"bạn-bè",
			"đồng-nghiệp",
			"hàng-xóm",
			"tình-yêu",
			"hạnh-phúc",
			"sức-khỏe",
			"thể-thao",
			"bóng-đá",
			"chạy-bộ",
			"bơi-lội",
			"âm-nhạc",
			"hội-họa",
			"du-lịch",
			"ẩm-thực",
			"thời-trang",
			"mặt-trời",
			"mặt-trăng",
			"ngôi-sao",
			"vũ-trụ",
			"hành-tinh",
			"thiên-nhiên",
			"môi-trường",
			"thời-tiết",
			"khí-hậu",
			"phong-cảnh",
			"thành-phố",
			"nông-thôn",
			"mặt-đất",
			"bầu-trời",
			"đại-dương",
			"con-suối",
			"ngọn-núi",
			"cánh-đồng",
			"bờ-biển",
			"rừng-rậm",
			"thời-gian",
			"quá-khứ",
			"hiện-tại",
			"tương-lai",
			"bắt-đầu",
			"kết-thúc",
			"thành-công",
			"thất-bại",
			"cơ-hội",
			"thử-thách",
			"suy-nghĩ",
			"hành-động",
			"mục-tiêu",
			"kế-hoạch",
			"ước-mơ",
			"khát-vọng",
			"động-lực",
			"năng-lượng",
			"sức-mạnh",
			"niềm-tin",
			"chuyên-nghiệp",
			"nghiêm-túc",
			"nghiêm-ngặt",
			"khoảng-cách",
			"khoảnh-khắc",
			"suy-ngẫm",
			"trải-nghiệm",
			"phấn-đấu",
			"đột-phá",
			"chuyển-đổi",
			"linh-hoạt",
			"tương-tác",
			"trung-thực",
			"trách-nhiệm",
			"kiên-trì",
			"nhẫn-nại",
			"sáng-tạo",
			"tiềm-năng",
		],
	},

	vi_nodau: {
		single: [
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
			"ho",
			"bao",
			"soi",
			"tho",
			"meo",
			"cho",
			"trau",
			"bo",
			"ngua",
			"de",
			"nha",
			"cua",
			"sach",
			"but",
			"ban",
			"ghe",
			"may",
			"xe",
			"tau",
			"thuyen",
			"chay",
			"nhay",
			"boi",
			"bay",
			"di",
			"dung",
			"ngoi",
			"nam",
			"an",
			"uong",
			"ngu",
			"thuc",
			"nghe",
			"nhin",
			"noi",
			"cuoi",
			"khoc",
			"nghi",
			"yeu",
			"ghet",
			"nhanh",
			"cham",
			"manh",
			"yeu",
			"cao",
			"thap",
			"dai",
			"ngan",
			"to",
			"nho",
			"do",
			"xanh",
			"vang",
			"trang",
			"den",
			"tim",
			"hong",
			"cam",
			"xam",
			"nau",
			"sang",
			"toi",
			"som",
			"muon",
			"moi",
			"cu",
			"dep",
			"xau",
			"dung",
			"sai",
		],
		compound: [
			"ha-noi",
			"sai-gon",
			"da-nang",
			"phu-quoc",
			"viet-nam",
			"thai-lan",
			"nhat-ban",
			"han-quoc",
			"cong-nghe",
			"may-tinh",
			"lap-trinh",
			"mang-luoi",
			"du-lieu",
			"bao-mat",
			"giao-dien",
			"may-chu",
			"tri-tue",
			"nhan-tao",
			"ky-thuat",
			"sang-tao",
			"phat-trien",
			"tuong-lai",
			"hien-dai",
			"tu-dong",
			"hoc-sinh",
			"sinh-vien",
			"thay-co",
			"truong-hoc",
			"lop-hoc",
			"bai-tap",
			"kien-thuc",
			"ky-nang",
			"gia-dinh",
			"bo-me",
			"ong-ba",
			"anh-em",
			"con-cai",
			"ban-be",
			"dong-nghiep",
			"hanh-phuc",
			"suc-khoe",
			"the-thao",
			"bong-da",
			"chay-bo",
			"boi-loi",
			"am-nhac",
			"hoi-hoa",
			"du-lich",
			"mat-troi",
			"mat-trang",
			"ngoi-sao",
			"vu-tru",
			"hanh-tinh",
			"thien-nhien",
			"moi-truong",
			"thoi-tiet",
			"thanh-pho",
			"nong-thon",
			"mat-dat",
			"bau-troi",
			"dai-duong",
			"con-suoi",
			"ngon-nui",
			"canh-dong",
			"thoi-gian",
			"qua-khu",
			"hien-tai",
			"bat-dau",
			"ket-thuc",
			"thanh-cong",
			"that-bai",
			"co-hoi",
		],
	},

	en: {
		single: [
			"speed",
			"code",
			"fast",
			"type",
			"data",
			"byte",
			"loop",
			"node",
			"time",
			"web",
			"cloud",
			"link",
			"text",
			"file",
			"port",
			"disk",
			"cpu",
			"ram",
			"task",
			"run",
			"core",
			"net",
			"host",
			"test",
			"grid",
			"main",
			"flow",
			"key",
			"dash",
			"sync",
			"light",
			"sound",
			"space",
			"power",
			"cyber",
			"pixel",
			"laser",
			"radar",
			"signal",
			"game",
			"play",
			"user",
			"work",
			"load",
			"page",
			"site",
			"view",
			"item",
			"list",
		],
		compound: [
			"new-york",
			"hong-kong",
			"full-stack",
			"front-end",
			"back-end",
			"real-time",
			"high-tech",
			"open-source",
			"multi-task",
			"auto-scale",
			"peer-to-peer",
			"cloud-native",
			"data-base",
			"user-friendly",
			"cross-platform",
			"ultra-fast",
			"cyber-space",
			"micro-service",
			"hyper-link",
			"super-computer",
			"zero-trust",
			"dry-run",
		],
	},
};

// =========================================================================
// HÀM SINH TỪ THEO TỈ LỆ 80% TỪ ĐƠN - 20% TỪ GHÉP & CHỐNG TRÙNG LẶP (ĐÃ FIX LỖI)
// =========================================================================
function generateWords(lang, count = 80) {
	// Kiểm tra an toàn: Nếu lang không hợp lệ thì mặc định lấy 'vi_dau' hoặc 'en'
	const bank = BIG_WORD_BANKS[lang] || BIG_WORD_BANKS.vi_dau || BIG_WORD_BANKS.en;

	// Lấy mảng từ đơn và từ ghép, fallback về mảng rỗng [] nếu bị undefined
	const singleList = bank.single || [];
	const compoundList = bank.compound || [];

	// Tính toán số lượng 80% từ đơn và 20% từ ghép
	const compoundCount = Math.round(count * 0.25);
	const singleCount = count - compoundCount;

	// Thuật toán xáo trộn Fisher-Yates an toàn
	const shuffle = (array) => {
		if (!Array.isArray(array)) return []; // Kiểm tra bảo vệ nếu không phải mảng
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	};

	// Chọn danh sách ngẫu nhiên không trùng lặp
	const selectedSingles = shuffle(singleList).slice(0, singleCount);
	const selectedCompounds = shuffle(compoundList).slice(0, compoundCount);

	// Gộp lại và xáo trộn vị trí từ đơn/từ ghép lẫn nhau
	return shuffle([...selectedSingles, ...selectedCompounds]);
}

const rooms = { en: [], vi_nodau: [], vi_dau: [] };

function getOrCreateRoom(lang) {
	let roomList = rooms[lang];
	let room = roomList.find(
		(r) => (r.state === "waiting" || r.state === "counting") && r.players.length < 7,
	);

	if (!room) {
		room = {
			id: "room_" + lang + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
			lang: lang,
			state: "waiting",
			players: [],
			words: generateWords(lang, 80), // Sinh 80 từ (60 từ đơn, 20 từ ghép, không trùng)
			countdown: 15,
			timerInterval: null,
			matchInterval: null,
			startTime: null,
			finishCount: 0,
		};
		roomList.push(room);
	}
	return room;
}

io.on("connection", (socket) => {
	let currentRoom = null;
	let player = null;

	socket.on("join_game", ({ username, lang }) => {
		currentRoom = getOrCreateRoom(lang);

		if (currentRoom.players.length >= 7) {
			currentRoom = getOrCreateRoom(lang);
		}

		player = {
			id: socket.id,
			username: username || "CyberRacer_" + Math.floor(Math.random() * 100),
			wordIndex: 0,
			wpm: 0,
			progress: 0,
			finished: false,
			finishTime: null,
			rank: null,
		};

		currentRoom.players.push(player);
		socket.join(currentRoom.id);

		io.to(currentRoom.id).emit("room_update", {
			players: currentRoom.players,
			words: currentRoom.words,
			state: currentRoom.state,
			countdown: currentRoom.countdown,
		});

		if (currentRoom.state === "waiting") {
			startRoomCountdown(currentRoom);
		}
	});

	socket.on("type_progress", ({ wordIndex, wpm }) => {
		if (!currentRoom || currentRoom.state !== "racing" || !player || player.finished) return;

		player.wordIndex = wordIndex;
		player.wpm = wpm;
		player.progress = Math.min(100, Math.floor((wordIndex / currentRoom.words.length) * 100));

		if (!currentRoom.startTime) {
			currentRoom.startTime = Date.now();
			io.to(currentRoom.id).emit("race_start_timer");

			currentRoom.matchInterval = setTimeout(
				() => {
					finishMatch(currentRoom);
				},
				5 * 60 * 1000,
			);
		}

		if (wordIndex >= currentRoom.words.length) {
			player.finished = true;
			currentRoom.finishCount++;
			player.rank = currentRoom.finishCount;
			player.finishTime = ((Date.now() - currentRoom.startTime) / 1000).toFixed(1);

			if (currentRoom.finishCount === 1) {
				io.to(currentRoom.id).emit("winner_celebration", { winnerName: player.username });
			}

			if (currentRoom.finishCount === currentRoom.players.length) {
				finishMatch(currentRoom);
			}
		}

		io.to(currentRoom.id).emit("progress_update", {
			players: currentRoom.players,
		});
	});

	socket.on("send_chat", (message) => {
		if (!currentRoom || !player || !player.finished) return;
		io.to(currentRoom.id).emit("new_chat", {
			username: player.username,
			message: message,
		});
	});

	socket.on("disconnect", () => {
		if (currentRoom && player) {
			currentRoom.players = currentRoom.players.filter((p) => p.id !== socket.id);

			if (currentRoom.players.length === 0) {
				clearInterval(currentRoom.timerInterval);
				clearTimeout(currentRoom.matchInterval);
				rooms[currentRoom.lang] = rooms[currentRoom.lang].filter((r) => r.id !== currentRoom.id);
			} else {
				io.to(currentRoom.id).emit("room_update", {
					players: currentRoom.players,
					words: currentRoom.words,
					state: currentRoom.state,
					countdown: currentRoom.countdown,
				});
			}
		}
	});
});

function startRoomCountdown(room) {
	room.state = "counting";
	room.timerInterval = setInterval(() => {
		room.countdown--;
		io.to(room.id).emit("countdown_tick", room.countdown);

		if (room.countdown <= 0) {
			clearInterval(room.timerInterval);
			room.state = "racing";
			io.to(room.id).emit("start_race");
		}
	}, 1000);
}

function finishMatch(room) {
	if (room.state === "finished") return;
	room.state = "finished";
	clearTimeout(room.matchInterval);

	room.players.forEach((p) => {
		if (!p.finished) {
			p.finished = true;
			p.finishTime = "DNF (5m+)";
		}
	});

	io.to(room.id).emit("match_finished", { players: room.players });
}

// Keep-Alive 24/7 trên Render
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_EXTERNAL_URL) {
	setInterval(
		() => {
			const protocol = RENDER_EXTERNAL_URL.startsWith("https") ? https : http;
			protocol
				.get(RENDER_EXTERNAL_URL, (res) => {
					console.log(`[Keep-Alive] Ping OK! Status: ${res.statusCode}`);
				})
				.on("error", (err) => console.error("[Keep-Alive] Error:", err.message));
		},
		10 * 60 * 1000,
	);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
