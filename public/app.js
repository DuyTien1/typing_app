const socket = io();

// DOM Helper functions ($ và $$)
const $ = (id) =>
	typeof id === "string" && !id.startsWith(".") && !id.startsWith("#") && !id.includes(" ")
		? document.getElementById(id)
		: document.querySelector(id);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const ZIPCODE_TEST_DURATION = 90;
const NORMAL_RACE_DURATION = 300;
const BOSS_RAID_DURATION = 120;
const DEFAULT_ICON = "🤖";
const AFK_TIMEOUT = 30000;

// Cookie helper functions
function setCookie(n, v, d = 365) {
	document.cookie = `${n}=${v || ""}; max-age=${d * 86400}; path=/; SameSite=Lax`;
}
function getCookie(n) {
	const m = document.cookie.match(new RegExp(`(^| )${n}=([^;]+)`));
	return m ? m[2] : null;
}
function eraseCookie(n) {
	document.cookie = `${n}=; max-age=0; path=/`;
}

// Khôi phục phong cách đã lưu từ localStorage hoặc Cookie
const savedInitialStyle =
	localStorage.getItem("racer_style") || getCookie("racer_style") || "cyberpunk";

let currentLanguage = "vi_dau",
	myUsername = "bot_1000",
	mySelectedIcon = DEFAULT_ICON,
	currentStyle = savedInitialStyle;

// Áp dụng phong cách ngay lập tức vào DOM gốc để chống FOUC (nhấp nháy giao diện)
if (document.documentElement) {
	document.documentElement.setAttribute("data-style", currentStyle);
}

let currentWords = [],
	wordIndex = 0,
	correctChars = 0,
	totalErrors = 0,
	isPlaying = false;
let startTime = null,
	timerInterval = null,
	afkTimer = null;
let currentLobbyPlayers = [];

// Chế độ Ngẫu Hứng & Săn Boss
let ngauHungTargetWord = "",
	ngauHungRoundTimer = null,
	ngauHungHasSubmittedThisRound = false,
	ngauHungCurrentRound = 0;
let currentBossData = null;

// Admin & Bot state
let isAdmin = false,
	lastEnteredAdminPassword = "",
	adminOnlineUsers = [],
	adminBannedUsers = [];
let bannedModalTimer = null,
	banNoticeTimer = null,
	autoTyperActive = false,
	botWorker = null,
	activeChatInput = null;

const chatEmojis = [
	"😀",
	"😂",
	"🤣",
	"😍",
	"😎",
	"🔥",
	"👍",
	"👎",
	"❤️",
	"🎉",
	"💩",
	"👀",
	"🤡",
	"⚡",
	"🎮",
	"🚀",
	"💀",
	"🤫",
	"💪",
	"🏆",
	"😡",
	"🙏",
	"😭",
	"😤",
];

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

const modeNames = {
	vi_dau: "🇻🇳 Tiếng Việt",
	vi_nodau: "🔤 Không Dấu",
	en: "🔠 English",
	numpad: "🔢 Numpad",
	ngau_hung: "🎲 Ngẫu Hứng",
	san_boss: "🐉 Săn Boss",
};

const styleNames = {
	cyberpunk: "⚡ Cyberpunk",
	vintage: "📜 Cổ Điển",
	xianxia: "🪷 Tiên Hiệp",
};

let serverHighScores = {
	vi_dau: null,
	vi_nodau: null,
	en: null,
	numpad: null,
	ngau_hung: null,
	san_boss: null,
};

function initBotWorker() {
	if (!botWorker && window.Worker) {
		const blob = new Blob(
			[
				`
			let t = null;
			self.onmessage = (e) => {
				if (e.data.action === 'start') { clearInterval(t); t = setInterval(() => self.postMessage('tick'), e.data.interval); }
				else if (e.data.action === 'stop') { clearInterval(t); t = null; }
			};
		`,
			],
			{ type: "application/javascript" },
		);
		botWorker = new Worker(URL.createObjectURL(blob));
	}
}

// Cuộn mượt tâm điểm dòng đang gõ
function scrollActiveWordToCenter() {
	const container = $("words-display");
	const activeWord = container?.children[wordIndex];
	if (!container || !activeWord || currentLanguage === "ngau_hung") return;

	const firstWord = container.firstElementChild;
	const firstRowTop = firstWord ? firstWord.offsetTop : 0;

	if (activeWord.offsetTop <= firstRowTop + 5) {
		container.scrollTo({ top: 0, behavior: "smooth" });
	} else {
		const targetScroll =
			activeWord.offsetTop - container.clientHeight / 2 + activeWord.offsetHeight / 2;
		container.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
	}
}

// Render Phong thần bảng
function loadHighScores() {
	const tbody = $("high-score-tbody");
	if (!tbody) return;
	tbody.innerHTML = "";

	Object.keys(modeNames).forEach((mode) => {
		const data = serverHighScores[mode];
		const tr = document.createElement("tr");
		const scoreDisplay =
			mode === "ngau_hung"
				? `${data?.score || 0} ĐIỂM`
				: mode === "san_boss"
					? `${data?.score || 0} DMG`
					: `${data?.wpm || 0} WPM`;

		tr.innerHTML = `
			<td>${modeNames[mode]}</td>
			<td>${data ? data.username || "Vô danh" : "---"}</td>
			<td class="highlight-val">${data ? scoreDisplay : "0"}</td>
			<td>${data ? data.errors || 0 : "0"}</td>
			<td class="admin-only-col ${isAdmin ? "" : "hidden"}">
				${isAdmin ? `<button class="btn-small btn-danger" onclick="resetHighScore('${mode}')">Reset</button>` : ""}
			</td>
		`;
		tbody.appendChild(tr);
	});
}

window.resetHighScore = (lang) => {
	if (isAdmin) socket.emit("admin_reset_highscore", { lang });
};

function applyTheme(theme) {
	if (theme === "light") {
		document.documentElement.setAttribute("data-theme", "light");
	} else {
		document.documentElement.removeAttribute("data-theme");
	}
	const btn = $("theme-toggle-btn");
	if (btn) btn.innerText = theme === "light" ? "☀️ Sáng" : "🌙 Tối";
	localStorage.setItem("racer_theme", theme);
	setCookie("racer_theme", theme, 365);
}

// Hàm cập nhật và lưu trữ phong cách vĩnh viễn
function applyStyle(style) {
	currentStyle = style || "cyberpunk";
	document.documentElement.setAttribute("data-style", currentStyle);

	const btn = $("style-toggle-btn");
	if (btn) btn.innerText = styleNames[currentStyle] || "⚡ Cyberpunk";

	// Lưu song song vào localStorage và Cookie (365 ngày)
	localStorage.setItem("racer_style", currentStyle);
	setCookie("racer_style", currentStyle, 365);

	// Đánh dấu thẻ đang active trong popup chọn phong cách
	$$(".style-card").forEach((card) => {
		card.classList.toggle("selected", card.dataset.style === currentStyle);
	});
}

document.addEventListener("DOMContentLoaded", () => {
	// Khôi phục Theme Sáng/Tối
	const savedTheme = localStorage.getItem("racer_theme") || getCookie("racer_theme") || "dark";
	applyTheme(savedTheme);

	// Khôi phục Phong cách giao diện đã lưu
	const savedStyle = localStorage.getItem("racer_style") || getCookie("racer_style") || "cyberpunk";
	applyStyle(savedStyle);

	// Khôi phục Tên người chơi
	myUsername =
		localStorage.getItem("racer_username") || `bot_${Math.floor(1000 + Math.random() * 9000)}`;
	localStorage.setItem("racer_username", myUsername);
	$("profile-name").innerText = myUsername;

	initBotWorker();
	setupEmojiPicker();
	setupBotModal();

	document.addEventListener("click", (e) => {
		const closeBtn = e.target.closest("[data-close]");
		if (closeBtn) $(closeBtn.dataset.close)?.classList.add("hidden");
	});

	$$(".mode-card").forEach((card) => {
		card.addEventListener("click", () => {
			$$(".mode-card").forEach((c) => c.classList.remove("selected"));
			card.classList.add("selected");
			currentLanguage = card.dataset.lang;
		});
	});

	$("theme-toggle-btn")?.addEventListener("click", () => {
		const isLight = document.documentElement.getAttribute("data-theme") === "light";
		applyTheme(isLight ? "dark" : "light");
	});

	// Mở Popup chọn phong cách
	$("style-toggle-btn")?.addEventListener("click", () => {
		$("style-select-popup")?.classList.remove("hidden");
	});

	// Chọn phong cách trong popup
	$$(".style-card").forEach((card) => {
		card.addEventListener("click", () => {
			applyStyle(card.dataset.style);
			$("style-select-popup")?.classList.add("hidden");
		});
	});

	$("join-btn")?.addEventListener("click", () => {
		socket.emit("join_lobby", {
			username: myUsername,
			language: currentLanguage,
			selectedIcon: mySelectedIcon,
		});
	});

	$("btn-open-icon-select")?.addEventListener("click", () => {
		renderIconPicker();
		$("icon-select-popup").classList.remove("hidden");
	});

	$("start-game-now-btn")?.addEventListener("click", () => socket.emit("force_start_game"));
	$("btn-surrender")?.addEventListener("click", () => {
		if (isPlaying) $("surrender-modal").classList.remove("hidden");
	});
	$("btn-confirm-surrender")?.addEventListener("click", () => {
		$("surrender-modal").classList.add("hidden");
		surrenderGame();
	});

	const returnHome = () => {
		socket.emit("leave_lobby");
		mySelectedIcon = DEFAULT_ICON;
		["lobby-screen", "game-container", "summary-modal"].forEach((id) =>
			$(id).classList.add("hidden"),
		);
		$("login-modal").classList.remove("hidden");
		loadHighScores();
		updateAdminUI();
	};

	$("btn-lobby-home")?.addEventListener("click", returnHome);
	$("btn-home")?.addEventListener("click", returnHome);
	$("btn-play-again")?.addEventListener("click", () => {
		["summary-modal", "game-container"].forEach((id) => $(id).classList.add("hidden"));
		$("lobby-screen").classList.remove("hidden");
		socket.emit("join_lobby", {
			username: myUsername,
			language: currentLanguage,
			selectedIcon: mySelectedIcon,
		});
	});

	$("btn-change-name")?.addEventListener("click", () => {
		$("popup-name-input").value = myUsername;
		$("rename-popup").classList.remove("hidden");
		$("popup-name-input").focus();
	});

	// Lưu tên và tự động cập nhật ngay lập tức
	const saveNameAction = () => {
		const newName = $("popup-name-input").value.trim();
		if (newName) {
			myUsername = newName;
			localStorage.setItem("racer_username", myUsername);
			$("profile-name").innerText = myUsername;
			$("rename-popup").classList.add("hidden");
			socket.emit("update_username", { username: myUsername });
		}
	};

	$("btn-save-popup-name")?.addEventListener("click", saveNameAction);
	$("popup-name-input")?.addEventListener("keydown", (e) => {
		if (e.key === "Enter") saveNameAction();
	});

	const typeInput = $("type-input");
	typeInput?.addEventListener("input", handleTypingInput);
	typeInput?.addEventListener("keydown", (e) => {
		resetAFKTimer();
		if (e.key === "-" || e.code === "NumpadMinus") {
			e.preventDefault();
			typeInput.value = typeInput.value.slice(0, -1);
			typeInput.dispatchEvent(new Event("input", { bubbles: true }));
		}
	});

	setupChatHandling();
	setupAdminEvents();

	window.addEventListener("keydown", (e) => {
		if (e.key === "F4" && isAdmin) {
			e.preventDefault();
			$("bot-config-popup")?.classList.remove("hidden");
		} else if (e.key === "F8" && autoTyperActive) {
			e.preventDefault();
			stopAutoTyperBot();
		}
	});
});

// ==========================================
// SOCKET & ADMIN LOGIC
// ==========================================
socket.on("connect", () => {
	socket.emit("update_username", { username: myUsername });
	const savedAdminPwd = getCookie("admin_token");
	if (savedAdminPwd)
		socket.emit("admin_login", { password: (lastEnteredAdminPassword = savedAdminPwd) });
});

function setupAdminEvents() {
	$("btn-admin-gear")?.addEventListener("click", () => {
		if (!isAdmin) {
			$("admin-password-input").value = "";
			$("admin-login-error").classList.add("hidden");
			$("admin-login-popup").classList.remove("hidden");
			$("admin-password-input").focus();
		} else {
			eraseCookie("admin_token");
			socket.emit("admin_logout");
		}
	});

	$("btn-submit-admin-login")?.addEventListener("click", () => {
		const pwd = $("admin-password-input").value.trim();
		if (pwd) socket.emit("admin_login", { password: (lastEnteredAdminPassword = pwd) });
	});

	$("admin-password-input")?.addEventListener("keydown", (e) => {
		if (e.key === "Enter") $("btn-submit-admin-login").click();
	});

	$("online-badge")?.addEventListener("click", () => {
		if (isAdmin) {
			renderOnlineUsersModal();
			$("online-users-modal").classList.remove("hidden");
		}
	});

	$("admin-banned-badge")?.addEventListener("click", () => {
		if (isAdmin) {
			renderBannedUsersModal();
			$("banned-users-modal").classList.remove("hidden");
			startBannedModalTimer();
		}
	});

	$("btn-clear-chat")?.addEventListener("click", () => {
		if (isAdmin) socket.emit("admin_clear_chat");
	});
}

socket.on("admin_login_response", (res) => {
	isAdmin = res.success;
	if (res.success) {
		setCookie("admin_token", lastEnteredAdminPassword, 7);
		$("admin-login-popup").classList.add("hidden");
	} else {
		eraseCookie("admin_token");
		$("admin-login-error").innerText = res.message;
		$("admin-login-error").classList.remove("hidden");
	}
	updateAdminUI();
});

socket.on("admin_logout_response", () => {
	isAdmin = false;
	eraseCookie("admin_token");
	updateAdminUI();
});

function updateAdminUI() {
	const gear = $("btn-admin-gear");
	if (gear) {
		gear.innerText = isAdmin ? "❌" : "⚙️";
		gear.title = isAdmin ? "Thoát Admin" : "Quản trị viên";
	}
	$("online-badge")?.classList.toggle("clickable", isAdmin);
	$("admin-banned-badge")?.classList.toggle("hidden", !isAdmin);
	$$(".admin-only").forEach((el) => el.classList.toggle("hidden", !isAdmin));
	loadHighScores();
	renderLobbyPlayers();
}

function renderOnlineUsersModal() {
	const tbody = $("online-users-tbody");
	if (!tbody) return;
	tbody.innerHTML = adminOnlineUsers
		.map(
			(u) => `
		<tr>
			<td style="font-weight: bold;">${u.username} ${u.isAdmin ? "👑" : ""}</td>
			<td style="font-size: 11px; color: var(--text-muted);">${u.id}</td>
			<td><span class="status-tag ${u.isBanned ? "surrendered" : "online"}">${u.isBanned ? "Đang Ban" : "Online"}</span></td>
			<td>${
				u.isAdmin || u.id === socket.id
					? `<span style="color: var(--text-muted); font-size: 11px;">(${u.id === socket.id ? "Bạn" : "Admin"})</span>`
					: u.isBanned
						? `<button class="btn-small btn-danger" disabled style="opacity: 0.5;">Đã Ban</button>`
						: `<button class="btn-small btn-danger" onclick="socket.emit('admin_ban_user', { targetSocketId: '${u.id}' })">Ban</button>`
			}</td>
		</tr>
	`,
		)
		.join("");
}

function renderBannedUsersModal() {
	const tbody = $("banned-users-tbody");
	if (!tbody) return;
	const now = Date.now();
	tbody.innerHTML =
		adminBannedUsers.length === 0
			? `<tr><td colspan="3" style="color: var(--text-muted);">Không có ai bị ban</td></tr>`
			: adminBannedUsers
					.map((b) => {
						const rem = Math.max(0, Math.ceil((b.expiresAt - now) / 1000));
						return `
				<tr>
					<td style="font-weight: bold;">${b.username} (${b.id})</td>
					<td style="color: var(--secondary); font-weight: bold;">${Math.floor(rem / 60)}m ${(rem % 60).toString().padStart(2, "0")}s</td>
					<td><button class="btn-small btn-success" onclick="socket.emit('admin_unban_user', { targetId: '${b.id}' })">Gỡ Ban</button></td>
				</tr>
			`;
					})
					.join("");
}

function startBannedModalTimer() {
	clearInterval(bannedModalTimer);
	bannedModalTimer = setInterval(() => {
		if ($("banned-users-modal")?.classList.contains("hidden")) clearInterval(bannedModalTimer);
		else renderBannedUsersModal();
	}, 1000);
}

socket.on("admin_online_users", (u) => {
	adminOnlineUsers = u;
	if (!$("online-users-modal").classList.contains("hidden")) renderOnlineUsersModal();
});
socket.on("admin_banned_users", (b) => {
	adminBannedUsers = b;
	$("banned-count").innerText = b.length;
	if (!$("banned-users-modal").classList.contains("hidden")) renderBannedUsersModal();
});

function showNoticePopup(id, msg, expiresAt) {
	const p = $(id);
	if (!p) return;
	p.classList.remove("hidden");
	if (expiresAt) {
		clearInterval(banNoticeTimer);
		const update = () => {
			const rem = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
			$("ban-notice-msg").innerHTML =
				`${msg}<br><br>⏱️ Còn lại: <strong style="color: var(--secondary); font-size: 16px;">${Math.floor(rem / 60)}m ${(rem % 60).toString().padStart(2, "0")}s</strong>`;
			if (rem <= 0) clearInterval(banNoticeTimer);
		};
		update();
		banNoticeTimer = setInterval(update, 1000);
	}
}

socket.on("banned_notice", (d) => {
	showNoticePopup("ban-notice-popup", d.message, d.expiresAt);
	$("btn-home").click();
});
socket.on("join_lobby_banned", (d) => showNoticePopup("ban-notice-popup", d.message, d.expiresAt));
socket.on("kicked_from_lobby", (d) => {
	alert(d.message);
	$("btn-lobby-home").click();
});
socket.on("clear_global_chat", () =>
	$$(".global-chat-messages").forEach((el) => (el.innerHTML = "")),
);

// ==========================================
// GAMEPLAY & BOSS RAID ENGINE
// ==========================================
function renderLobbyPlayers() {
	const grid = $("lobby-players-grid");
	if (!grid) return;
	grid.innerHTML = currentLobbyPlayers
		.map(
			(p) => `
		<div class="lobby-player-card">
			${p.icon || DEFAULT_ICON} ${p.username} ${p.id === socket.id ? "(Bạn)" : ""}
			${isAdmin && p.id !== socket.id ? `<button class="kick-player-btn" onclick="socket.emit('admin_kick_lobby_player', { targetSocketId: '${p.id}' })">&times;</button>` : ""}
		</div>
	`,
		)
		.join("");
}

function renderIconPicker() {
	const grid = $("icon-picker-grid");
	if (!grid) return;
	const taken = currentLobbyPlayers.filter((p) => p.id !== socket.id).map((p) => p.icon);
	grid.innerHTML = runnerIcons
		.map(
			(icon) => `
		<button class="icon-picker-btn ${mySelectedIcon === icon ? "active" : ""} ${taken.includes(icon) ? "disabled" : ""}" 
			${taken.includes(icon) ? "disabled" : ""} onclick="selectIcon('${icon}')">${icon}</button>
	`,
		)
		.join("");
}

window.selectIcon = (icon) => {
	mySelectedIcon = icon;
	socket.emit("select_icon", { icon });
	$("icon-select-popup").classList.add("hidden");
};

socket.on("update_online_count", (c) => ($("online-count").innerText = c));
socket.on("init_high_scores", (s) => {
	serverHighScores = s;
	loadHighScores();
});
socket.on("update_high_scores", (s) => {
	serverHighScores = s;
	loadHighScores();
});

socket.on("update_lobby", (data) => {
	$("login-modal").classList.add("hidden");
	$("lobby-screen").classList.remove("hidden");
	currentLobbyPlayers = data.players || [];
	$("lobby-count").innerText = `${currentLobbyPlayers.length}/10`;
	$("lobby-mode-display").innerText = `CHẾ ĐỘ: ${modeNames[data.language || currentLanguage]}`;
	renderLobbyPlayers();
});

socket.on("game_start", (data) => {
	["lobby-screen", "summary-modal"].forEach((id) => $(id).classList.add("hidden"));
	["game-container", "chat-container"].forEach((id) => $(id).classList.remove("hidden"));

	currentLanguage = data.language || currentLanguage;
	currentWords = data.words;
	wordIndex = correctChars = totalErrors = 0;
	isPlaying = false;

	const isNgauHung = currentLanguage === "ngau_hung";
	const isBoss = currentLanguage === "san_boss";

	$("ngau-hung-status")?.classList.toggle("hidden", !isNgauHung);
	$("boss-arena-box")?.classList.toggle("hidden", !isBoss);
	$("race-tracks-title").innerText = isNgauHung
		? "BẢNG ĐIỂM NGẪU HỨNG"
		: isBoss
			? "SÁT THƯƠNG DIỆT BOSS"
			: "TIẾN ĐỘ HOÀN THÀNH";
	$("words-display").classList.toggle("ngau-hung-mode-display", isNgauHung);

	if (isBoss && data.boss) {
		currentBossData = data.boss;
		$("boss-name").innerText = data.boss.name;
		$("boss-avatar").innerText = data.boss.icon;
		$("boss-hp-text").innerText = `${data.boss.hp}/${data.boss.maxHp} HP`;
		$("boss-hp-fill").style.width = "100%";
		$("boss-skill-alert").classList.add("hidden");
	}

	if (isNgauHung)
		$("words-display").innerHTML =
			`<span class="word current" style="color: var(--accent);">Chuẩn bị...</span>`;
	else renderWords();

	const input = $("type-input");
	input.value = "";
	input.disabled = true;
	input.placeholder = "Chuẩn bị...";
	$("status-box").innerText = "CHUẨN BỊ";
	$("btn-surrender").disabled = false;

	renderRaceTracks(data.players);
	startCountdown(data.countdown || 3);
});

function startCountdown(seconds) {
	let count = seconds;
	$("timer").innerText = count;
	const cd = setInterval(() => {
		if (--count > 0) $("timer").innerText = count;
		else {
			clearInterval(cd);
			isPlaying = true;
			startTime = Date.now();
			resetAFKTimer();
			$("status-box").innerText = "ĐANG THI ĐẤU";

			if (currentLanguage !== "ngau_hung") {
				const duration =
					currentLanguage === "numpad"
						? ZIPCODE_TEST_DURATION
						: currentLanguage === "san_boss"
							? BOSS_RAID_DURATION
							: NORMAL_RACE_DURATION;

				$("timer").innerText = duration;
				$("type-input").disabled = false;
				$("type-input").placeholder =
					currentLanguage === "san_boss"
						? "Gõ thật nhanh để xả sát thương lên Boss..."
						: "Gõ chữ vào đây...";
				$("type-input").focus();
				startRaceTimer(duration);
			}
		}
	}, 1000);
}

function startRaceTimer(duration) {
	let timeLeft = duration;
	clearInterval(timerInterval);
	timerInterval = setInterval(() => {
		$("timer").innerText = --timeLeft;
		if (timeLeft <= 0) {
			clearInterval(timerInterval);
			finishGame();
		}
	}, 1000);
}

// Xử lý Sự kiện Boss (Realtime Damage & Skills)
socket.on("boss_hp_update", (d) => {
	currentBossData = d;
	const percent = Math.max(0, Math.round((d.hp / d.maxHp) * 100));
	$("boss-hp-fill").style.width = `${percent}%`;
	$("boss-hp-text").innerText = `${d.hp}/${d.maxHp} HP`;
	if (d.players) renderRaceTracks(d.players);
});

socket.on("boss_skill_warning", (d) => {
	const alertBox = $("boss-skill-alert");
	const skillDesc =
		d.skill === "shake"
			? "🌋 ĐỘNG ĐẤT"
			: d.skill === "fog"
				? "🌫️ MÀN ĐÊM KHÓI MÙ"
				: "🌀 ẢO GIÁC ĐẢO NGƯỢC";
	alertBox.innerText = `⚠️ CẢNH BÁO: BOSS CHUẨN BỊ TUNG [${skillDesc}]!`;
	alertBox.classList.remove("hidden");
});

socket.on("boss_skill_cast", (d) => {
	const gameContainer = $("game-container");
	const wordsDisplay = $("words-display");
	const fogLayer = $("boss-fog-layer");
	const alertBox = $("boss-skill-alert");

	alertBox.innerText = `🔥 BOSS ĐANG KÍCH HOẠT KỸ NĂNG!`;

	if (d.skill === "shake") gameContainer.classList.add("boss-shake-active");
	if (d.skill === "reverse") wordsDisplay.classList.add("boss-reverse-active");
	if (d.skill === "fog") fogLayer.classList.remove("hidden");

	setTimeout(() => {
		gameContainer.classList.remove("boss-shake-active");
		wordsDisplay.classList.remove("boss-reverse-active");
		fogLayer.classList.add("hidden");
		alertBox.classList.add("hidden");
	}, d.duration * 1000);
});

// Ngẫu Hứng Events
socket.on("ngau_hung_new_round", (d) => {
	ngauHungTargetWord = d.targetWord;
	ngauHungHasSubmittedThisRound = false;
	ngauHungCurrentRound = d.round;
	isPlaying = true;

	$("ngau-hung-status").innerText = `VÒNG ${d.round}/${d.totalRounds}`;
	$("words-display").innerHTML =
		`<span id="ngau-hung-word" class="word current correct-typing">${d.targetWord}</span>`;

	const input = $("type-input");
	input.value = "";
	input.disabled = false;
	input.placeholder = "Gõ chữ rồi nhấn Space...";
	input.focus();

	let timeLeft = d.duration;
	$("timer").innerText = timeLeft;
	clearInterval(ngauHungRoundTimer);
	ngauHungRoundTimer = setInterval(() => {
		$("timer").innerText = Math.max(0, --timeLeft);
		if (timeLeft <= 0) clearInterval(ngauHungRoundTimer);
	}, 1000);

	if (autoTyperActive) startAutoTyperBot(parseInt($("bot-speed-input")?.value) || 100, 0);
});

socket.on("ngau_hung_player_success", (d) => {
	$("type-input").disabled = true;
	$("type-input").placeholder = `🎉 Hạng ${d.rank} (+${d.pointsAwarded} điểm)!`;
	if ($("ngau-hung-word")) $("ngau-hung-word").className = "word correct";
});

socket.on("ngau_hung_round_ended", () => {
	clearInterval(ngauHungRoundTimer);
	$("type-input").disabled = true;
	if (!ngauHungHasSubmittedThisRound) {
		$("type-input").placeholder = "Hết thời gian!";
		if ($("ngau-hung-word")) $("ngau-hung-word").className = "word incorrect";
	}
});

socket.on("ngau_hung_intermission", (d) => {
	let t = d.duration;
	$("timer").innerText = t;
	$("words-display").innerHTML =
		`<span class="word" style="color: var(--accent);">Vòng kế tiếp sau ${t}s...</span>`;
	const it = setInterval(() => {
		if (--t > 0)
			$("words-display").innerHTML =
				`<span class="word" style="color: var(--accent);">Vòng kế tiếp sau ${t}s...</span>`;
		else clearInterval(it);
	}, 1000);
});

function renderWords() {
	const wd = $("words-display");
	wd.classList.toggle("numpad-mode", currentLanguage === "numpad");
	wd.innerHTML = currentWords
		.map(
			(w, idx) =>
				`<span class="word ${idx === wordIndex ? "current correct-typing" : ""}">${w}</span>`,
		)
		.join("");
	wd.scrollTo({ top: 0, behavior: "smooth" });
}

// Xử lý logic gõ phím & tự động khôi phục giao diện khi nhấn Space xóa từ sai
function handleTypingInput() {
	if (!isPlaying) return;
	const input = $("type-input"),
		val = input.value;

	if (currentLanguage === "ngau_hung") {
		if (ngauHungHasSubmittedThisRound) return (input.value = "");
		const wordEl = $("ngau-hung-word");
		if (val.endsWith(" ")) {
			const typed = val.trim();
			input.value = "";
			if (typed === ngauHungTargetWord) {
				ngauHungHasSubmittedThisRound = true;
				socket.emit("submit_ngau_hung_word", { word: typed, errors: totalErrors });
				if (wordEl) wordEl.className = "word correct";
			} else {
				totalErrors++;
				// Reset chữ focus về trạng thái bình thường sau khi xóa input
				if (wordEl) wordEl.className = "word current correct-typing";
				socket.emit("update_progress", {
					progress: Math.round((ngauHungCurrentRound / 15) * 100),
					wpm: 0,
					correctChars,
					errors: totalErrors,
				});
			}
			return;
		}
		if (wordEl)
			wordEl.className = `word current ${ngauHungTargetWord.startsWith(val) ? "correct-typing" : "incorrect-typing"}`;
		return;
	}

	const target = currentWords[wordIndex],
		currSpan = $("words-display").children[wordIndex];
	if (val.endsWith(" ")) {
		if (val.trim() === target) {
			const wordLength = target.length + 1;
			correctChars += wordLength;
			if (currSpan) currSpan.className = "word correct";
			wordIndex++;
			input.value = "";

			if (currentLanguage === "san_boss") {
				socket.emit("deal_boss_damage", { damage: wordLength, errors: totalErrors });
			}

			if (wordIndex >= currentWords.length) return finishGame();
			if ($("words-display").children[wordIndex])
				$("words-display").children[wordIndex].className = "word current correct-typing";

			scrollActiveWordToCenter();
		} else {
			totalErrors++;
			input.value = "";
			// Reset chữ focus về trạng thái bình thường sau khi xóa input
			if (currSpan) currSpan.className = "word current correct-typing";

			if (currentLanguage === "san_boss") {
				socket.emit("deal_boss_damage", { damage: 0, errors: totalErrors });
			}
		}
	} else if (currSpan) {
		currSpan.className = `word current ${target.startsWith(val) ? "correct-typing" : "incorrect-typing"}`;
	}

	if (currentLanguage !== "san_boss") {
		const elapsed = Math.max(1, (Date.now() - startTime) / 1000);
		socket.emit("update_progress", {
			progress: Math.min(100, Math.round((wordIndex / currentWords.length) * 100)),
			wpm: Math.round(correctChars / 5 / (elapsed / 60)),
			correctChars,
			errors: totalErrors,
		});
	}
}

function finishGame() {
	if (!isPlaying) return;
	stopAutoTyperBot();
	isPlaying = false;
	clearTimeout(afkTimer);
	clearInterval(timerInterval);

	const elapsed = Math.max(1, (Date.now() - startTime) / 1000);
	$("type-input").disabled = true;
	$("status-box").innerText = "HOÀN THÀNH";
	socket.emit("player_finished", {
		wpm: Math.round(correctChars / 5 / (elapsed / 60)),
		correctChars,
		errors: totalErrors,
	});
}

function surrenderGame(isAFK = false) {
	stopAutoTyperBot();
	isPlaying = false;
	clearTimeout(afkTimer);
	clearInterval(timerInterval);
	clearInterval(ngauHungRoundTimer);
	$("type-input").disabled = true;
	$("status-box").innerText = isAFK ? "AFK" : "ĐÃ ĐẦU HÀNG";
	socket.emit("surrender", { isAFK });
}

function resetAFKTimer() {
	if (!isPlaying) return;
	clearTimeout(afkTimer);
	afkTimer = setTimeout(() => {
		if (isPlaying) surrenderGame(true);
	}, AFK_TIMEOUT);
}

function renderRaceTracks(players) {
	const container = $("race-tracks-container");
	if (!container) return;
	container.innerHTML = players
		.map((p) => {
			const isDis = p.isSurrendered || p.isDisconnected || p.isAFK;
			const status = p.isSurrendered
				? `<span class="status-tag ${p.isAFK ? "afk" : "surrendered"}">${p.isAFK ? "AFK" : "GIẢNG HÒA"}</span>`
				: p.isDisconnected
					? `<span class="status-tag disconnected">BẢY CHỌ</span>`
					: currentLanguage === "ngau_hung"
						? `⭐ ${p.score || 0} ĐIỂM`
						: currentLanguage === "san_boss"
							? `⚔️ ${p.score || p.correctChars || 0} DMG`
							: `${p.wpm || 0} WPM | ${p.progress || 0}%`;

			return `
			<div class="track-row ${isDis ? "disabled-track" : ""}">
				<div class="track-header">
					<span>${p.username} ${p.id === socket.id ? "(Bạn)" : ""}</span>
					<span>${status}</span>
				</div>
				<div class="track-line-bg">
					<div class="track-line-fill" style="width: ${p.progress || 0}%; background: ${isDis ? "var(--text-muted)" : p.id === socket.id ? "var(--primary)" : "var(--accent)"};">
						<div class="runner-icon-badge">${p.icon || DEFAULT_ICON}</div>
					</div>
				</div>
			</div>
		`;
		})
		.join("");
}

socket.on("race_update", renderRaceTracks);

socket.on("game_over", (d) => {
	stopAutoTyperBot();
	isPlaying = false;
	clearTimeout(afkTimer);
	clearInterval(timerInterval);
	clearInterval(ngauHungRoundTimer);

	$("game-container").classList.add("hidden");
	$("chat-container").classList.add("hidden");
	$("summary-modal").classList.remove("hidden");

	const isNH = (d.language || currentLanguage) === "ngau_hung";
	const isBoss = (d.language || currentLanguage) === "san_boss";

	const modalTitle = $("summary-modal-title");
	const bossSubtitle = $("boss-result-subtitle");

	if (isBoss) {
		bossSubtitle.classList.remove("hidden");
		if (d.isBossVictory) {
			modalTitle.innerText = "🎉 LỤM! 🎉";
			modalTitle.style.color = "var(--correct)";
			bossSubtitle.innerText = "Cả đội đã hợp lực tiêu diệt thành công Hắc Long Ma Vương!";
			bossSubtitle.style.color = "var(--correct)";
		} else {
			modalTitle.innerText = "💀 NGU DỐT! 💀";
			modalTitle.style.color = "var(--secondary)";
			bossSubtitle.innerText = "Hết giờ! Hắc Long Ma Vương đã quét sạch toàn bộ đội hình!";
			bossSubtitle.style.color = "var(--secondary)";
		}
	} else {
		modalTitle.innerText = "🏆 BẢNG TỔNG KẾT TRẬN ĐẤU";
		modalTitle.style.color = "var(--primary)";
		bossSubtitle.classList.add("hidden");
	}

	$("summary-thead").innerHTML = `
		<tr>
			<th>HẠNG</th>
			<th>TÊN</th>
			<th>${isNH ? "KÝ TỰ" : isBoss ? "TỔNG SÁT THƯƠNG" : "KÝ TỰ ĐÚNG"}</th>
			<th>${isNH ? "TỔNG ĐIỂM" : isBoss ? "TỐC ĐỘ" : "TỐC ĐỘ"}</th>
			<th>LỖI</th>
		</tr>
	`;

	const board = d.leaderboard || d;
	$("summary-tbody").innerHTML = board
		.map((p, idx) => {
			const rank = idx === 0 ? "🥇 MVP" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : `${idx + 1}`;
			const status = p.isSurrendered
				? `<span class="status-tag ${p.isAFK ? "afk" : "surrendered"}">${p.isAFK ? "AFK" : "GIẢNG HÒA"}</span>`
				: p.isDisconnected
					? `<span class="status-tag disconnected">BẢY CHỌ</span>`
					: isNH
						? `⭐ ${p.score || 0} ĐIỂM`
						: `${p.wpm || Math.round((p.correctChars || 0) / 5)} WPM`;

			return `
			<tr class="${idx === 0 ? "winner-row" : board.length > 1 && idx === board.length - 1 ? "last-place-row" : ""}">
				<td>${rank}</td>
				<td>${p.icon || DEFAULT_ICON} ${p.username} ${p.id === socket.id ? "(Bạn)" : ""}</td>
				<td>${isBoss ? `⚔️ ${p.score || p.correctChars || 0} DMG` : p.correctChars || 0}</td>
				<td>${status}</td>
				<td>${p.errors || 0}</td>
			</tr>
		`;
		})
		.join("");
});

// ==========================================
// CHAT ENGINE
// ==========================================
function setupChatHandling() {
	const sendGlobal = (input) => {
		const msg = input.value.trim();
		if (msg) {
			socket.emit("send_global_chat", { username: myUsername, message: msg });
			input.value = "";
		}
	};

	$$(".global-chat-send-btn").forEach((btn) =>
		btn.addEventListener("click", (e) =>
			sendGlobal(e.target.closest(".global-chat-input-wrapper").querySelector("input")),
		),
	);
	$$(".global-chat-input").forEach((inp) =>
		inp.addEventListener("keydown", (e) => {
			if (e.key === "Enter") sendGlobal(e.target);
		}),
	);

	const sendInGame = () => {
		const inp = $("chat-input");
		if (inp?.value.trim()) {
			socket.emit("send_in_game_chat", { message: inp.value.trim() });
			inp.value = "";
		}
	};
	$("in-game-chat-send-btn")?.addEventListener("click", sendInGame);
	$("chat-input")?.addEventListener("keydown", (e) => {
		if (e.key === "Enter") sendInGame();
	});
}

function appendChatMsg(container, msg) {
	const div = document.createElement("div");
	div.className = "chat-msg-item";
	div.innerHTML = `
		<span class="chat-msg-user">${msg.username}:</span>
		<span class="chat-msg-text">${msg.message}</span>
		<span class="chat-msg-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
	`;
	container.appendChild(div);
	container.scrollTop = container.scrollHeight;
}

socket.on("load_initial_messages", (msgs) =>
	$$(".global-chat-messages").forEach((c) => {
		c.innerHTML = "";
		msgs.forEach((m) => appendChatMsg(c, m));
	}),
);
socket.on("receive_global_chat", (m) =>
	$$(".global-chat-messages").forEach((c) => appendChatMsg(c, m)),
);
socket.on("receive_in_game_chat", (d) => {
	const popups = $("chat-popups");
	if (!popups) return;
	const b = document.createElement("div");
	b.className = "chat-bubble";
	b.innerHTML = `<span class="sender">${d.username}</span><span class="text">${d.message}</span>`;
	popups.appendChild(b);
	setTimeout(() => b.remove(), 4000);
});

// Emoji Picker
function setupEmojiPicker() {
	const picker = $("chat-emoji-picker"),
		grid = $("chat-emoji-grid");
	if (!grid || !picker) return;

	grid.innerHTML = chatEmojis.map((e) => `<div class="chat-emoji-item">${e}</div>`).join("");
	grid.addEventListener("click", (e) => {
		const item = e.target.closest(".chat-emoji-item");
		if (item && activeChatInput) {
			const pos = activeChatInput.selectionStart || activeChatInput.value.length;
			activeChatInput.value =
				activeChatInput.value.slice(0, pos) + item.innerText + activeChatInput.value.slice(pos);
			activeChatInput.focus();
			picker.classList.add("hidden");
		}
	});

	$$(".chat-emoji-btn").forEach((btn) =>
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			activeChatInput = e.currentTarget
				.closest(".global-chat-input-wrapper, .in-game-chat-wrapper")
				?.querySelector("input");
			picker.classList.toggle("hidden");
			const r = e.currentTarget.getBoundingClientRect();
			picker.style.top = `${Math.max(10, r.top - 170)}px`;
			picker.style.left = `${Math.min(window.innerWidth - 300, Math.max(10, r.right - 280))}px`;
		}),
	);

	document.addEventListener("click", (e) => {
		if (!picker.contains(e.target) && !e.target.classList.contains("chat-emoji-btn"))
			picker.classList.add("hidden");
	});
}

// ==========================================
// BOT AUTO-TYPER ENGINE
// ==========================================
function setupBotModal() {
	if ($("bot-config-popup")) return;
	const div = document.createElement("div");
	div.id = "bot-config-popup";
	div.className = "custom-popup hidden";
	div.innerHTML = `
		<div class="popup-content">
			<h3 style="color: var(--primary); margin-bottom: 15px;">🤖 THIẾT LẬP AUTO BOT</h3>
			<div style="margin-bottom: 12px; text-align: left;">
				<label style="font-size: 12px; color: var(--text-muted);">TỐC ĐỘ (WPM):</label>
				<input type="number" id="bot-speed-input" value="100" min="10" max="500" style="width: 100%; padding: 8px; background: var(--input-bg); border: 1px solid var(--primary); color: var(--text-main); border-radius: 6px;" />
			</div>
			<div style="margin-bottom: 20px; text-align: left;">
				<label style="font-size: 12px; color: var(--text-muted);">SỐ LỖI MONG MUỐN:</label>
				<input type="number" id="bot-errors-input" value="0" min="0" max="100" style="width: 100%; padding: 8px; background: var(--input-bg); border: 1px solid var(--primary); color: var(--text-main); border-radius: 6px;" />
			</div>
			<div style="display: flex; gap: 10px; justify-content: center;">
				<button id="btn-start-bot" class="cyber-btn" style="padding: 8px 20px; font-size: 14px;">BẮT ĐẦU</button>
				<button class="cyber-btn" data-close="bot-config-popup" style="padding: 8px 20px; font-size: 14px; background: linear-gradient(45deg, #444, #222);">HỦY</button>
			</div>
		</div>
	`;
	document.body.appendChild(div);

	$("btn-start-bot")?.addEventListener("click", () => {
		const wpm = parseInt($("bot-speed-input").value) || 100;
		const err = parseInt($("bot-errors-input").value) || 0;
		$("bot-config-popup").classList.add("hidden");
		startAutoTyperBot(wpm, err);
	});
}

function startAutoTyperBot(targetWPM, targetErrors) {
	if (!isPlaying) return;
	stopAutoTyperBot();
	autoTyperActive = true;
	initBotWorker();

	const isNH = currentLanguage === "ngau_hung";
	const targetWord = isNH ? ngauHungTargetWord : currentWords.slice(wordIndex).join(" ");
	if (!targetWord) return;

	const totalChars = targetWord.length + 1;
	const msPerChar = Math.max(
		10,
		Math.round(((totalChars / 5 / (targetWPM / 60)) * 1000) / (totalChars + targetErrors * 2)),
	);
	let errorsDone = 0,
		inCorrection = false;

	botWorker.onmessage = (e) => {
		if (e.data !== "tick" || !isPlaying || !autoTyperActive) return stopAutoTyperBot();
		resetAFKTimer();
		const inp = $("type-input");
		if (!inp) return;

		if (!isNH && errorsDone < targetErrors) {
			if (!inCorrection) {
				inp.value = "x";
				inCorrection = true;
			} else {
				inp.value = "x ";
				errorsDone++;
				inCorrection = false;
			}
			return inp.dispatchEvent(new Event("input", { bubbles: true }));
		}

		const currTarget = isNH ? ngauHungTargetWord : currentWords[wordIndex];
		if (!currTarget) return stopAutoTyperBot();

		if (inp.value.length < currTarget.length) inp.value += currTarget[inp.value.length];
		else inp.value += " ";
		inp.dispatchEvent(new Event("input", { bubbles: true }));
	};

	botWorker.postMessage({ action: "start", interval: msPerChar });
}

function stopAutoTyperBot() {
	autoTyperActive = false;
	botWorker?.postMessage({ action: "stop" });
}
