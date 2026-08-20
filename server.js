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
// QUẢN LÝ TIN NHẮN CHAT & CHỐNG SPAM
// ==========================================
const MESSAGES_FILE = path.join(__dirname, "messages.json");
const MESSAGE_TTL = 3 * 60 * 1000; // 3 phút tự động xóa
let chatMessages = [];

// Quản lý rate limit chống spam
const userChatHistory = new Map(); // socket.id -> array of timestamps
const mutedUsers = new Map(); // socket.id -> unmute timestamp

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

// Dọn dẹp tin nhắn hết hạn mỗi 10 giây
setInterval(cleanOldMessages, 10000);
loadMessagesFromFile();

function checkSpamLimit(socketId) {
	const now = Date.now();

	// Kiểm tra xem user có đang trong thời gian phạt tạm dừng nhắn (5s) không
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
	// Lọc các tin nhắn gửi trong 5 giây gần đây
	history = history.filter((time) => now - time < 5000);

	if (history.length >= 5) {
		const unmuteTime = now + 5000; // Khóa 5 giây
		mutedUsers.set(socketId, unmuteTime);
		userChatHistory.delete(socketId);
		return { allowed: false, remainingSec: 5 };
	}

	history.push(now);
	userChatHistory.set(socketId, history);
	return { allowed: true };
}

// ==========================================
// QUẢN LÝ ADMIN & BAN USER BẰNG SOCKET.ID
// ==========================================
const connectedUsers = new Map(); // socket.id -> { id, username, isAdmin }
const bannedUsers = new Map(); // socket.id -> { id, username, bannedAt, expiresAt, timeoutId }

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
		],
		hard: ["khoanh", "nghieng", "khuech", "khuyu", "ngoeo", "thuo", "ngoan", "ngheo"],
	},
	en: {
		easy: ["cat", "dog", "sun", "moon", "star", "tree", "book", "pen", "desk", "fish"],
		hard: ["rhythm", "queue", "knapsack", "quizzical", "puzzling", "knowledge"],
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

function finishMatch(room) {
	if (room.state === "finished") return;
	room.state = "finished";
	if (room.matchInterval) clearInterval(room.matchInterval);

	const leaderboard = [...room.players].sort((a, b) => {
		if (a.isSurrendered || a.isDisconnected) return 1;
		if (b.isSurrendered || b.isDisconnected) return -1;
		return (b.wpm || 0) - (a.wpm || 0);
	});

	io.to(room.id).emit("game_over", leaderboard);

	leaderboard.forEach((p) => {
		if (!p.isSurrendered && !p.isDisconnected) {
			updateHighScoresAndBroadcast(
				room.lang,
				p.username,
				p.wpm || 0,
				p.errors || 0,
				room.players.length,
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
			currentRoom.players = currentRoom.players.filter((p) => p.id !== socket.id);
			socket.leave(currentRoom.id);
			if (currentRoom.players.length === 0) {
				if (currentRoom.matchInterval) clearTimeout(currentRoom.matchInterval);
				if (rooms[currentRoom.lang]) {
					rooms[currentRoom.lang] = rooms[currentRoom.lang].filter((r) => r.id !== currentRoom.id);
				}
			} else {
				io.to(currentRoom.id).emit("update_lobby", {
					players: currentRoom.players,
					lang: currentRoom.lang,
				});
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

		const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút
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
			errors: 0,
			correctChars: 0,
			isFinished: false,
			isSurrendered: false,
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
			});
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

	socket.on("surrender", () => {
		if (currentRoom && player) {
			player.isSurrendered = true;
			io.to(currentRoom.id).emit("race_update", currentRoom.players);
			checkMatchCompletion(currentRoom);
		}
	});

	socket.on("disconnect", () => {
		totalOnlineUsers = Math.max(0, totalOnlineUsers - 1);
		connectedUsers.delete(socket.id);

		if (currentRoom && player) {
			player.isDisconnected = true;
			io.to(currentRoom.id).emit("race_update", currentRoom.players);
			checkMatchCompletion(currentRoom);
			leaveCurrentLobby();
		}

		io.emit("update_online_count", totalOnlineUsers);
		broadcastAdminData();
	});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
