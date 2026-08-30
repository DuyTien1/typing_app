const socket = io();

// DOM Helper functions ($ và $$)
const $ = (id) =>
	typeof id === "string" && !id.startsWith(".") && !id.startsWith("#") && !id.includes(" ")
		? document.getElementById(id)
		: document.querySelector(id);
const $$ = (sel) => [...document.querySelectorAll(sel)];

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

// Khôi phục phong cách giao diện
const savedInitialStyle =
	localStorage.getItem("racer_style") || getCookie("racer_style") || "cyberpunk";

let currentLanguage = "vi_dau",
	currentDifficulty = "normal",
	myUsername = "bot_1000",
	mySelectedIcon = DEFAULT_ICON,
	currentStyle = savedInitialStyle;

if (document.documentElement) {
	document.documentElement.setAttribute("data-style", currentStyle);
}

// Cấu hình Client nhận từ Server
let clientGameConfig = {
	normalRace: { duration: 300, wordCount: 150 },
	numpad: { duration: 90, wordCount: 500 },
	ngauHung: {
		difficulties: {
			normal: {
				id: "normal",
				name: "Bình thường",
				icon: "🟡",
				color: "#ffe600",
				roundDuration: 7,
				intermissionDuration: 3,
				totalRounds: 15,
				ratioViDau: 25,
				ratioViNoDau: 25,
				ratioEn: 40,
				ratioNum: 10,
				hardViDauRate: 35,
				hardViNoDauRate: 35,
				hardEnRate: 35,
			},
			legendary: {
				id: "legendary",
				name: "Huyền Thoại",
				icon: "👑",
				color: "#ff0055",
				roundDuration: 3.5,
				intermissionDuration: 1.5,
				totalRounds: 25,
				ratioViDau: 25,
				ratioViNoDau: 25,
				ratioEn: 25,
				ratioNum: 25,
				hardViDauRate: 85,
				hardViNoDauRate: 85,
				hardEnRate: 85,
			},
		},
	},
	sanBoss: {
		wordPoolCount: 400,
		difficulties: {
			custom: {
				id: "custom",
				name: "Tùy Chỉnh",
				icon: "🛠️",
				color: "#00f0ff",
				duration: 180,
				baseHp: 450,
				hpPerPlayer: 400,
				selfDestructTarget: 450,
				skillInterval: 16,
				shieldBasePerPlayer: 30,
				shieldDuration: 8,
				stunDuration: 4,
				shakeDuration: 5,
				fogDuration: 5,
				reverseDuration: 5,
				capslockDuration: 5,
				ratioViDau: 20,
				ratioViNoDau: 40,
				ratioEn: 30,
				ratioNum: 10,
				hardViDauRate: 20,
				hardViNoDauRate: 20,
				hardEnRate: 20,
				enabledSkills: {
					shield: true,
					capslock: false,
					shake: true,
					fog: false,
					reverse: false,
				},
				skillWeights: {
					shield: 60,
					capslock: 0,
					shake: 40,
					fog: 0,
					reverse: 0,
				},
			},
			normal: {
				id: "normal",
				name: "Bình thường",
				icon: "🟡",
				color: "#ffe600",
				duration: 150,
				baseHp: 550,
				hpPerPlayer: 500,
				selfDestructTarget: 450,
				skillInterval: 14,
				shieldBasePerPlayer: 40,
				shieldDuration: 6,
				stunDuration: 3,
				shakeDuration: 5,
				fogDuration: 5,
				reverseDuration: 5,
				capslockDuration: 6,
				ratioViDau: 25,
				ratioViNoDau: 35,
				ratioEn: 30,
				ratioNum: 10,
				hardViDauRate: 35,
				hardViNoDauRate: 35,
				hardEnRate: 35,
				enabledSkills: {
					shield: true,
					capslock: true,
					shake: true,
					fog: true,
					reverse: false,
				},
				skillWeights: {
					shield: 35,
					capslock: 25,
					shake: 20,
					fog: 20,
					reverse: 0,
				},
			},
			hard: {
				id: "hard",
				name: "Khó",
				icon: "🔴",
				color: "#ff7700",
				duration: 130,
				baseHp: 650,
				hpPerPlayer: 600,
				selfDestructTarget: 500,
				skillInterval: 12,
				shieldBasePerPlayer: 50,
				shieldDuration: 5,
				stunDuration: 2.5,
				shakeDuration: 6,
				fogDuration: 6,
				reverseDuration: 5,
				capslockDuration: 7,
				ratioViDau: 30,
				ratioViNoDau: 30,
				ratioEn: 25,
				ratioNum: 15,
				hardViDauRate: 50,
				hardViNoDauRate: 50,
				hardEnRate: 50,
				enabledSkills: {
					shield: true,
					capslock: true,
					shake: true,
					fog: true,
					reverse: true,
				},
				skillWeights: {
					shield: 25,
					capslock: 20,
					shake: 20,
					fog: 20,
					reverse: 15,
				},
			},
			hell: {
				id: "hell",
				name: "Địa ngục",
				icon: "💀",
				color: "#ff0055",
				duration: 120,
				baseHp: 750,
				hpPerPlayer: 700,
				selfDestructTarget: 550,
				skillInterval: 10,
				shieldBasePerPlayer: 60,
				shieldDuration: 5,
				stunDuration: 2,
				shakeDuration: 7,
				fogDuration: 7,
				reverseDuration: 6,
				capslockDuration: 8,
				ratioViDau: 30,
				ratioViNoDau: 25,
				ratioEn: 25,
				ratioNum: 20,
				hardViDauRate: 80,
				hardViNoDauRate: 80,
				hardEnRate: 80,
				enabledSkills: {
					shield: true,
					capslock: true,
					shake: true,
					fog: true,
					reverse: true,
				},
				skillWeights: {
					shield: 20,
					capslock: 20,
					shake: 20,
					fog: 20,
					reverse: 20,
				},
			},
		},
	},
};

// Cấu hình tạm thời trong Admin Modal
let tempAdminDifficulties = JSON.parse(JSON.stringify(clientGameConfig.sanBoss.difficulties));
let selectedConfigDiffKey = "normal";

let tempAdminNhDifficulties = JSON.parse(JSON.stringify(clientGameConfig.ngauHung.difficulties));
let selectedConfigNhDiffKey = "normal";

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

let bossComboCount = 0;
let bossFractionalDamageBuffer = 0.0;
let bossBackspaceCount = 0;
let isBossCapsLockActive = false;

// Admin & Bot state
let isAdmin = false,
	lastEnteredAdminPassword = "",
	adminOnlineUsers = [],
	adminBannedUsers = [];
let bannedModalTimer = null,
	banNoticeTimer = null,
	adminSavePopupTimer = null,
	autoTyperActive = false,
	botWorker = null,
	activeChatInput = null;

let isRenderTracksPending = false;
let latestPlayersData = null;

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
	steampunk: "⚙️ Cơ Khí",
	thuymac: "☯️ Thủy Mặc",
	pixel: "👾 Arcade 8-Bit",
};

const difficultyMeta = {
	custom: { name: "TÙY CHỈNH", color: "#00f0ff", icon: "🛠️" },
	normal: { name: "BÌNH THƯỜNG", color: "#ffe600", icon: "🟡" },
	hard: { name: "KHÓ", color: "#ff7700", icon: "🔴" },
	hell: { name: "ĐỊA NGỤC", color: "#ff0055", icon: "💀" },
	legendary: { name: "HUYỀN THOẠI", color: "#ff0055", icon: "👑" },
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

function scrollActiveWordToCenter() {
	const container = $("words-display");
	const activeWord = container?.children[wordIndex];
	if (!container || !activeWord || currentLanguage === "ngau_hung") return;

	const firstWord = container.firstElementChild;
	const firstRowTop = firstWord ? firstWord.offsetTop : 0;

	if (activeWord.offsetTop <= firstRowTop + 5) {
		container.scrollTop = 0;
	} else {
		const targetScroll =
			activeWord.offsetTop - container.clientHeight / 2 + activeWord.offsetHeight / 2;
		container.scrollTop = Math.max(0, targetScroll);
	}
}

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
				${isAdmin ? `<button class="btn-small btn-surrender-style" onclick="resetHighScore('${mode}')">Reset</button>` : ""}
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

function applyStyle(style) {
	currentStyle = style || "cyberpunk";
	document.documentElement.setAttribute("data-style", currentStyle);

	const btn = $("style-toggle-btn");
	if (btn) btn.innerText = styleNames[currentStyle] || "⚡ Cyberpunk";

	localStorage.setItem("racer_style", currentStyle);
	setCookie("racer_style", currentStyle, 365);

	$$(".style-card").forEach((card) => {
		card.classList.toggle("selected", card.dataset.style === currentStyle);
	});
}

function getComboMultiplier(combo) {
	if (combo >= 40) return 2.0;
	if (combo >= 30) return 1.75;
	if (combo >= 20) return 1.5;
	if (combo >= 10) return 1.25;
	return 1.0;
}

function updateBossComboUI() {
	const comboNum = $("boss-combo-num");
	const multTag = $("boss-combo-mult-tag");
	const bsCount = $("boss-backspace-count");

	if (comboNum) comboNum.innerText = bossComboCount;
	if (multTag) {
		const mult = getComboMultiplier(bossComboCount);
		multTag.innerText = `SÁT THƯƠNG: x${mult}`;
		multTag.style.color = mult > 1.0 ? "var(--accent)" : "var(--correct)";
	}
	if (bsCount) {
		bsCount.innerText = `${bossBackspaceCount}/10`;
		bsCount.style.color = bossBackspaceCount >= 7 ? "var(--secondary)" : "var(--text-muted)";
	}
}

function resetBossCombo(reason = "") {
	bossComboCount = 0;
	bossFractionalDamageBuffer = 0.0;
	bossBackspaceCount = 0;
	updateBossComboUI();
}

function clearAllBossSkillEffects() {
	$("game-container")?.classList.remove("boss-shake-active");
	$("words-display")?.classList.remove("boss-reverse-active");
	$("boss-fog-layer")?.classList.add("hidden");
	$("boss-skill-alert")?.classList.add("hidden");
	$("boss-arena-box")?.classList.remove("boss-stunned");
}

document.addEventListener("DOMContentLoaded", () => {
	const savedTheme = localStorage.getItem("racer_theme") || getCookie("racer_theme") || "dark";
	applyTheme(savedTheme);

	const savedStyle = localStorage.getItem("racer_style") || getCookie("racer_style") || "cyberpunk";
	applyStyle(savedStyle);

	myUsername =
		localStorage.getItem("racer_username") || `bot_${Math.floor(1000 + Math.random() * 9000)}`;
	localStorage.setItem("racer_username", myUsername);
	$("profile-name").innerText = myUsername;
	if ($("user-icon-status")) $("user-icon-status").innerText = mySelectedIcon;

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

	$("style-toggle-btn")?.addEventListener("click", () => {
		$("style-select-popup")?.classList.remove("hidden");
	});

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
			difficulty: currentDifficulty,
			selectedIcon: mySelectedIcon,
		});
	});

	const openIconSelect = () => {
		renderIconPicker();
		$("icon-select-popup")?.classList.remove("hidden");
	};

	$("btn-change-icon")?.addEventListener("click", openIconSelect);
	$("btn-open-icon-select")?.addEventListener("click", openIconSelect);

	$("btn-open-nh-difficulty-select")?.addEventListener("click", () => {
		$$("#nh-difficulty-popup .diff-card").forEach((c) => {
			c.classList.toggle("selected", c.dataset.nhDiff === currentDifficulty);
		});
		$("nh-difficulty-popup").classList.remove("hidden");
	});

	$$("#nh-difficulty-popup .diff-card").forEach((card) => {
		card.addEventListener("click", () => {
			const diff = card.dataset.nhDiff;
			currentDifficulty = diff;
			$$("#nh-difficulty-popup .diff-card").forEach((c) => c.classList.remove("selected"));
			card.classList.add("selected");
			socket.emit("select_difficulty", { difficulty: diff });
			$("nh-difficulty-popup").classList.add("hidden");
		});
	});

	$("btn-open-boss-difficulty-select")?.addEventListener("click", () => {
		$$("#boss-difficulty-popup .diff-card").forEach((c) => {
			c.classList.toggle("selected", c.dataset.bossDiff === currentDifficulty);
		});
		$("boss-difficulty-popup").classList.remove("hidden");
	});

	$$("#boss-difficulty-popup .diff-card").forEach((card) => {
		card.addEventListener("click", () => {
			const diff = card.dataset.bossDiff;
			currentDifficulty = diff;
			$$("#boss-difficulty-popup .diff-card").forEach((c) => c.classList.remove("selected"));
			card.classList.add("selected");
			socket.emit("select_difficulty", { difficulty: diff });
			$("boss-difficulty-popup").classList.add("hidden");
		});
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
		currentDifficulty = "normal";
		mySelectedIcon = DEFAULT_ICON;
		clearAllBossSkillEffects();
		if ($("user-icon-status")) $("user-icon-status").innerText = mySelectedIcon;
		["lobby-screen", "game-container", "summary-modal"].forEach((id) =>
			$(id).classList.add("hidden"),
		);
		$("login-modal").classList.remove("hidden");
		loadHighScores();
		updateAdminUI();
	};

	$("btn-lobby-home")?.addEventListener("click", returnHome);
	$("btn-home")?.addEventListener("click", returnHome);
	$("btn-confirm-kicked")?.addEventListener("click", returnHome);

	$("btn-play-again")?.addEventListener("click", () => {
		clearAllBossSkillEffects();
		["summary-modal", "game-container"].forEach((id) => $(id).classList.add("hidden"));
		$("lobby-screen").classList.remove("hidden");
		socket.emit("join_lobby", {
			username: myUsername,
			language: currentLanguage,
			difficulty: currentDifficulty,
			selectedIcon: mySelectedIcon,
		});
	});

	$("btn-change-name")?.addEventListener("click", () => {
		$("popup-name-input").value = myUsername;
		$("rename-popup").classList.remove("hidden");
		$("popup-name-input").focus();
	});

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

		if (e.key === "Backspace" || e.key === "-" || e.code === "NumpadMinus") {
			if (currentLanguage === "san_boss" && isPlaying) {
				bossBackspaceCount++;
				if (bossBackspaceCount >= 10) {
					resetBossCombo("Xóa từ 10 lần");
				} else {
					updateBossComboUI();
				}
			}

			if (e.key === "-" || e.code === "NumpadMinus") {
				e.preventDefault();
				typeInput.value = typeInput.value.slice(0, -1);
				typeInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
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

socket.on("sync_game_config", (cfg) => {
	clientGameConfig = cfg;
	fillAdminConfigInputs();
});

function saveActiveDiffInputsToState() {
	if (tempAdminDifficulties[selectedConfigDiffKey]) {
		const diff = tempAdminDifficulties[selectedConfigDiffKey];
		if (!diff.enabledSkills) diff.enabledSkills = {};
		if (!diff.skillWeights) diff.skillWeights = {};

		if ($("cfg-diff-duration")) diff.duration = parseInt($("cfg-diff-duration").value) || 150;
		if ($("cfg-diff-base-hp")) diff.baseHp = parseInt($("cfg-diff-base-hp").value) || 550;
		if ($("cfg-diff-hp-per-player"))
			diff.hpPerPlayer = parseInt($("cfg-diff-hp-per-player").value) || 500;
		if ($("cfg-diff-self-destruct"))
			diff.selfDestructTarget = parseInt($("cfg-diff-self-destruct").value) || 450;
		if ($("cfg-diff-skill-interval"))
			diff.skillInterval = parseInt($("cfg-diff-skill-interval").value) || 14;

		if ($("cfg-boss-ratio-vi-dau"))
			diff.ratioViDau = isNaN(parseInt($("cfg-boss-ratio-vi-dau").value))
				? 0
				: parseInt($("cfg-boss-ratio-vi-dau").value);
		if ($("cfg-boss-ratio-vi-nodau"))
			diff.ratioViNoDau = isNaN(parseInt($("cfg-boss-ratio-vi-nodau").value))
				? 0
				: parseInt($("cfg-boss-ratio-vi-nodau").value);
		if ($("cfg-boss-ratio-en"))
			diff.ratioEn = isNaN(parseInt($("cfg-boss-ratio-en").value))
				? 0
				: parseInt($("cfg-boss-ratio-en").value);
		if ($("cfg-boss-ratio-num"))
			diff.ratioNum = isNaN(parseInt($("cfg-boss-ratio-num").value))
				? 0
				: parseInt($("cfg-boss-ratio-num").value);

		if ($("cfg-boss-hard-vi-dau"))
			diff.hardViDauRate = isNaN(parseInt($("cfg-boss-hard-vi-dau").value))
				? 0
				: parseInt($("cfg-boss-hard-vi-dau").value);
		if ($("cfg-boss-hard-vi-nodau"))
			diff.hardViNoDauRate = isNaN(parseInt($("cfg-boss-hard-vi-nodau").value))
				? 0
				: parseInt($("cfg-boss-hard-vi-nodau").value);
		if ($("cfg-boss-hard-en"))
			diff.hardEnRate = isNaN(parseInt($("cfg-boss-hard-en").value))
				? 0
				: parseInt($("cfg-boss-hard-en").value);

		if ($("cfg-diff-shield-per-player"))
			diff.shieldBasePerPlayer = parseInt($("cfg-diff-shield-per-player").value) || 40;
		if ($("cfg-diff-shield-dur"))
			diff.shieldDuration = parseInt($("cfg-diff-shield-dur").value) || 6;
		if ($("cfg-diff-stun-dur")) diff.stunDuration = parseFloat($("cfg-diff-stun-dur").value) || 3;

		if ($("cfg-diff-capslock-dur"))
			diff.capslockDuration = parseInt($("cfg-diff-capslock-dur").value) || 6;
		if ($("cfg-diff-shake-dur")) diff.shakeDuration = parseInt($("cfg-diff-shake-dur").value) || 5;
		if ($("cfg-diff-fog-dur")) diff.fogDuration = parseInt($("cfg-diff-fog-dur").value) || 5;
		if ($("cfg-diff-reverse-dur"))
			diff.reverseDuration = parseInt($("cfg-diff-reverse-dur").value) || 5;

		diff.enabledSkills.shield = $("cfg-skill-enable-shield")
			? $("cfg-skill-enable-shield").checked
			: true;
		diff.enabledSkills.capslock = $("cfg-skill-enable-capslock")
			? $("cfg-skill-enable-capslock").checked
			: false;
		diff.enabledSkills.shake = $("cfg-skill-enable-shake")
			? $("cfg-skill-enable-shake").checked
			: true;
		diff.enabledSkills.fog = $("cfg-skill-enable-fog") ? $("cfg-skill-enable-fog").checked : false;
		diff.enabledSkills.reverse = $("cfg-skill-enable-reverse")
			? $("cfg-skill-enable-reverse").checked
			: false;

		if ($("cfg-skill-weight-shield"))
			diff.skillWeights.shield = parseInt($("cfg-skill-weight-shield").value) || 0;
		if ($("cfg-skill-weight-capslock"))
			diff.skillWeights.capslock = parseInt($("cfg-skill-weight-capslock").value) || 0;
		if ($("cfg-skill-weight-shake"))
			diff.skillWeights.shake = parseInt($("cfg-skill-weight-shake").value) || 0;
		if ($("cfg-skill-weight-fog"))
			diff.skillWeights.fog = parseInt($("cfg-skill-weight-fog").value) || 0;
		if ($("cfg-skill-weight-reverse"))
			diff.skillWeights.reverse = parseInt($("cfg-skill-weight-reverse").value) || 0;
	}

	if (tempAdminNhDifficulties[selectedConfigNhDiffKey]) {
		const nh = tempAdminNhDifficulties[selectedConfigNhDiffKey];
		if ($("cfg-nh-round-dur")) nh.roundDuration = parseFloat($("cfg-nh-round-dur").value) || 7;
		if ($("cfg-nh-inter-dur"))
			nh.intermissionDuration = parseFloat($("cfg-nh-inter-dur").value) || 3;
		if ($("cfg-nh-total-rounds")) nh.totalRounds = parseInt($("cfg-nh-total-rounds").value) || 15;

		if ($("cfg-nh-ratio-vi-dau"))
			nh.ratioViDau = isNaN(parseInt($("cfg-nh-ratio-vi-dau").value))
				? 0
				: parseInt($("cfg-nh-ratio-vi-dau").value);
		if ($("cfg-nh-ratio-vi-nodau"))
			nh.ratioViNoDau = isNaN(parseInt($("cfg-nh-ratio-vi-nodau").value))
				? 0
				: parseInt($("cfg-nh-ratio-vi-nodau").value);
		if ($("cfg-nh-ratio-en"))
			nh.ratioEn = isNaN(parseInt($("cfg-nh-ratio-en").value))
				? 0
				: parseInt($("cfg-nh-ratio-en").value);
		if ($("cfg-nh-ratio-num"))
			nh.ratioNum = isNaN(parseInt($("cfg-nh-ratio-num").value))
				? 0
				: parseInt($("cfg-nh-ratio-num").value);

		if ($("cfg-nh-hard-vi-dau"))
			nh.hardViDauRate = isNaN(parseInt($("cfg-nh-hard-vi-dau").value))
				? 0
				: parseInt($("cfg-nh-hard-vi-dau").value);
		if ($("cfg-nh-hard-vi-nodau"))
			nh.hardViNoDauRate = isNaN(parseInt($("cfg-nh-hard-vi-nodau").value))
				? 0
				: parseInt($("cfg-nh-hard-vi-nodau").value);
		if ($("cfg-nh-hard-en"))
			nh.hardEnRate = isNaN(parseInt($("cfg-nh-hard-en").value))
				? 0
				: parseInt($("cfg-nh-hard-en").value);
	}
}

function updateSelectedDiffInputsFromState() {
	const diff = tempAdminDifficulties[selectedConfigDiffKey];
	if (diff) {
		const meta = difficultyMeta[selectedConfigDiffKey] || difficultyMeta.normal;
		if ($("cfg-diff-active-title")) {
			$("cfg-diff-active-title").innerText = `⚙️ THÔNG SỐ ĐỘ KHÓ: ${meta.name.toUpperCase()}`;
			$("cfg-diff-active-title").style.color = meta.color;
		}

		if ($("cfg-diff-duration")) $("cfg-diff-duration").value = diff.duration;
		if ($("cfg-diff-base-hp")) $("cfg-diff-base-hp").value = diff.baseHp;
		if ($("cfg-diff-hp-per-player")) $("cfg-diff-hp-per-player").value = diff.hpPerPlayer;
		if ($("cfg-diff-self-destruct")) $("cfg-diff-self-destruct").value = diff.selfDestructTarget;
		if ($("cfg-diff-skill-interval")) $("cfg-diff-skill-interval").value = diff.skillInterval;

		if ($("cfg-boss-ratio-vi-dau")) $("cfg-boss-ratio-vi-dau").value = diff.ratioViDau ?? 25;
		if ($("cfg-boss-ratio-vi-nodau")) $("cfg-boss-ratio-vi-nodau").value = diff.ratioViNoDau ?? 35;
		if ($("cfg-boss-ratio-en")) $("cfg-boss-ratio-en").value = diff.ratioEn ?? 30;
		if ($("cfg-boss-ratio-num")) $("cfg-boss-ratio-num").value = diff.ratioNum ?? 10;

		if ($("cfg-boss-hard-vi-dau")) $("cfg-boss-hard-vi-dau").value = diff.hardViDauRate ?? 35;
		if ($("cfg-boss-hard-vi-nodau")) $("cfg-boss-hard-vi-nodau").value = diff.hardViNoDauRate ?? 35;
		if ($("cfg-boss-hard-en")) $("cfg-boss-hard-en").value = diff.hardEnRate ?? 35;

		if ($("cfg-diff-shield-per-player"))
			$("cfg-diff-shield-per-player").value = diff.shieldBasePerPlayer;
		if ($("cfg-diff-shield-dur")) $("cfg-diff-shield-dur").value = diff.shieldDuration;
		if ($("cfg-diff-stun-dur")) $("cfg-diff-stun-dur").value = diff.stunDuration;

		if ($("cfg-diff-capslock-dur")) $("cfg-diff-capslock-dur").value = diff.capslockDuration || 6;
		if ($("cfg-diff-shake-dur")) $("cfg-diff-shake-dur").value = diff.shakeDuration || 5;
		if ($("cfg-diff-fog-dur")) $("cfg-diff-fog-dur").value = diff.fogDuration || 5;
		if ($("cfg-diff-reverse-dur")) $("cfg-diff-reverse-dur").value = diff.reverseDuration || 5;

		const sk = diff.enabledSkills || {};
		if ($("cfg-skill-enable-shield")) $("cfg-skill-enable-shield").checked = sk.shield ?? true;
		if ($("cfg-skill-enable-capslock"))
			$("cfg-skill-enable-capslock").checked = sk.capslock ?? false;
		if ($("cfg-skill-enable-shake")) $("cfg-skill-enable-shake").checked = sk.shake ?? true;
		if ($("cfg-skill-enable-fog")) $("cfg-skill-enable-fog").checked = sk.fog ?? false;
		if ($("cfg-skill-enable-reverse")) $("cfg-skill-enable-reverse").checked = sk.reverse ?? false;

		const sw = diff.skillWeights || {};
		if ($("cfg-skill-weight-shield")) $("cfg-skill-weight-shield").value = sw.shield ?? 35;
		if ($("cfg-skill-weight-capslock")) $("cfg-skill-weight-capslock").value = sw.capslock ?? 25;
		if ($("cfg-skill-weight-shake")) $("cfg-skill-weight-shake").value = sw.shake ?? 20;
		if ($("cfg-skill-weight-fog")) $("cfg-skill-weight-fog").value = sw.fog ?? 20;
		if ($("cfg-skill-weight-reverse")) $("cfg-skill-weight-reverse").value = sw.reverse ?? 0;
	}

	const nh = tempAdminNhDifficulties[selectedConfigNhDiffKey];
	if (nh) {
		const metaNh = difficultyMeta[selectedConfigNhDiffKey] || difficultyMeta.normal;
		if ($("cfg-nh-diff-active-title")) {
			$("cfg-nh-diff-active-title").innerText = `⚙️ THÔNG SỐ ĐỘ KHÓ: ${metaNh.name.toUpperCase()}`;
			$("cfg-nh-diff-active-title").style.color = metaNh.color;
		}

		if ($("cfg-nh-round-dur")) $("cfg-nh-round-dur").value = nh.roundDuration;
		if ($("cfg-nh-inter-dur")) $("cfg-nh-inter-dur").value = nh.intermissionDuration;
		if ($("cfg-nh-total-rounds")) $("cfg-nh-total-rounds").value = nh.totalRounds;

		if ($("cfg-nh-ratio-vi-dau")) $("cfg-nh-ratio-vi-dau").value = nh.ratioViDau ?? 25;
		if ($("cfg-nh-ratio-vi-nodau")) $("cfg-nh-ratio-vi-nodau").value = nh.ratioViNoDau ?? 25;
		if ($("cfg-nh-ratio-en")) $("cfg-nh-ratio-en").value = nh.ratioEn ?? 40;
		if ($("cfg-nh-ratio-num")) $("cfg-nh-ratio-num").value = nh.ratioNum ?? 10;

		if ($("cfg-nh-hard-vi-dau")) $("cfg-nh-hard-vi-dau").value = nh.hardViDauRate ?? 35;
		if ($("cfg-nh-hard-vi-nodau")) $("cfg-nh-hard-vi-nodau").value = nh.hardViNoDauRate ?? 35;
		if ($("cfg-nh-hard-en")) $("cfg-nh-hard-en").value = nh.hardEnRate ?? 35;
	}
}

function fillAdminConfigInputs() {
	if (!clientGameConfig) return;
	if ($("cfg-normal-duration"))
		$("cfg-normal-duration").value = clientGameConfig.normalRace.duration;
	if ($("cfg-normal-words")) $("cfg-normal-words").value = clientGameConfig.normalRace.wordCount;
	if ($("cfg-numpad-duration")) $("cfg-numpad-duration").value = clientGameConfig.numpad.duration;
	if ($("cfg-numpad-words")) $("cfg-numpad-words").value = clientGameConfig.numpad.wordCount;

	if (clientGameConfig.sanBoss && clientGameConfig.sanBoss.difficulties) {
		tempAdminDifficulties = JSON.parse(JSON.stringify(clientGameConfig.sanBoss.difficulties));
	}

	if (clientGameConfig.ngauHung && clientGameConfig.ngauHung.difficulties) {
		tempAdminNhDifficulties = JSON.parse(JSON.stringify(clientGameConfig.ngauHung.difficulties));
	}

	if ($("cfg-boss-diff-select"))
		selectedConfigDiffKey = $("cfg-boss-diff-select").value || "normal";
	if ($("cfg-nh-diff-select")) selectedConfigNhDiffKey = $("cfg-nh-diff-select").value || "normal";
	updateSelectedDiffInputsFromState();
}

function showAdminSaveNotice(success, message) {
	const popup = $("admin-save-result-popup");
	const iconEl = $("admin-save-status-icon");
	const titleEl = $("admin-save-status-title");
	const descEl = $("admin-save-status-desc");
	if (!popup) return;

	if (success) {
		if (iconEl) iconEl.innerText = "✨";
		if (titleEl) {
			titleEl.innerText = "LƯU CÀI ĐẶT THÀNH CÔNG";
			titleEl.style.color = "var(--correct)";
		}
		if (descEl)
			descEl.innerText = message || "Tất cả thông số và tỷ lệ từ vựng trận đấu đã được lưu.";
	} else {
		if (iconEl) iconEl.innerText = "❌";
		if (titleEl) {
			titleEl.innerText = "LỖI LƯU CÀI ĐẶT";
			titleEl.style.color = "var(--secondary)";
		}
		if (descEl) descEl.innerText = message || "Không thể cập nhật cấu hình!";
	}

	popup.classList.remove("hidden");

	clearTimeout(adminSavePopupTimer);
	adminSavePopupTimer = setTimeout(() => {
		popup.classList.add("hidden");
	}, 2500);
}

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

	$("admin-settings-badge")?.addEventListener("click", () => {
		if (isAdmin) {
			fillAdminConfigInputs();
			$("admin-settings-modal").classList.remove("hidden");
		}
	});

	$("cfg-boss-diff-select")?.addEventListener("change", (e) => {
		saveActiveDiffInputsToState();
		selectedConfigDiffKey = e.target.value;
		updateSelectedDiffInputsFromState();
	});

	$("cfg-nh-diff-select")?.addEventListener("change", (e) => {
		saveActiveDiffInputsToState();
		selectedConfigNhDiffKey = e.target.value;
		updateSelectedDiffInputsFromState();
	});

	const diffInputIds = [
		"cfg-diff-duration",
		"cfg-diff-base-hp",
		"cfg-diff-hp-per-player",
		"cfg-diff-self-destruct",
		"cfg-diff-skill-interval",
		"cfg-boss-ratio-vi-dau",
		"cfg-boss-ratio-vi-nodau",
		"cfg-boss-ratio-en",
		"cfg-boss-ratio-num",
		"cfg-boss-hard-vi-dau",
		"cfg-boss-hard-vi-nodau",
		"cfg-boss-hard-en",
		"cfg-diff-shield-per-player",
		"cfg-diff-shield-dur",
		"cfg-diff-stun-dur",
		"cfg-diff-capslock-dur",
		"cfg-diff-shake-dur",
		"cfg-diff-fog-dur",
		"cfg-diff-reverse-dur",
		"cfg-skill-enable-shield",
		"cfg-skill-enable-capslock",
		"cfg-skill-enable-shake",
		"cfg-skill-enable-fog",
		"cfg-skill-enable-reverse",
		"cfg-skill-weight-shield",
		"cfg-skill-weight-capslock",
		"cfg-skill-weight-shake",
		"cfg-skill-weight-fog",
		"cfg-skill-weight-reverse",
		"cfg-nh-round-dur",
		"cfg-nh-inter-dur",
		"cfg-nh-total-rounds",
		"cfg-nh-ratio-vi-dau",
		"cfg-nh-ratio-vi-nodau",
		"cfg-nh-ratio-en",
		"cfg-nh-ratio-num",
		"cfg-nh-hard-vi-dau",
		"cfg-nh-hard-vi-nodau",
		"cfg-nh-hard-en",
	];
	diffInputIds.forEach((id) => {
		$(id)?.addEventListener("input", saveActiveDiffInputsToState);
		$(id)?.addEventListener("change", saveActiveDiffInputsToState);
	});

	$("btn-save-admin-config")?.addEventListener("click", () => {
		if (!isAdmin) return;
		saveActiveDiffInputsToState();

		const updatedConfig = {
			normalRace: {
				duration: parseInt($("cfg-normal-duration").value) || 300,
				wordCount: parseInt($("cfg-normal-words").value) || 150,
			},
			numpad: {
				duration: parseInt($("cfg-numpad-duration").value) || 90,
				wordCount: parseInt($("cfg-numpad-words").value) || 500,
			},
			ngauHung: { difficulties: tempAdminNhDifficulties },
			sanBoss: { difficulties: tempAdminDifficulties },
		};
		socket.emit("admin_update_config", updatedConfig);
	});

	socket.on("admin_config_saved", (res) => {
		showAdminSaveNotice(res.success, res.message);
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
	$("admin-settings-badge")?.classList.toggle("hidden", !isAdmin);
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
			<td style="font-weight: 700;">${u.username} ${u.isAdmin ? "👑" : ""}</td>
			<td style="font-size: 11px; color: var(--text-muted); font-family: monospace;">${u.id}</td>
			<td><span class="status-tag ${u.isBanned ? "status-surrendered" : "status-online"}">${u.isBanned ? "Đang Ban" : "Online"}</span></td>
			<td>${
				u.isAdmin || u.id === socket.id
					? `<span style="color: var(--text-muted); font-size: 11px; font-weight: bold;">(${u.id === socket.id ? "Bạn" : "Admin"})</span>`
					: u.isBanned
						? `<button class="btn-small btn-surrender-style" disabled style="opacity: 0.5; cursor: not-allowed;">Đã Ban</button>`
						: `<button class="btn-ban-action" onclick="socket.emit('admin_ban_user', { targetSocketId: '${u.id}' })">🚫 Ban</button>`
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
			? `<tr><td colspan="3" style="color: var(--text-muted); padding: 16px;">Không có ai bị ban</td></tr>`
			: adminBannedUsers
					.map((b) => {
						const rem = Math.max(0, Math.ceil((b.expiresAt - now) / 1000));
						return `
				<tr>
					<td style="font-weight: 700;">${b.username} <span style="font-size: 11px; color: var(--text-muted);">(${b.id})</span></td>
					<td class="banned-timer-text">${Math.floor(rem / 60)}m ${(rem % 60).toString().padStart(2, "0")}s</td>
					<td><button class="btn-unban-action" onclick="socket.emit('admin_unban_user', { targetId: '${b.id}' })">✅ Gỡ Ban</button></td>
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
				`${msg}<br><br>⏱️ Còn lại: <strong class="banned-timer-text" style="font-size: 16px;">${Math.floor(rem / 60)}m ${(rem % 60).toString().padStart(2, "0")}s</strong>`;
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
	const p = $("kicked-notice-popup");
	if (p) {
		$("kicked-notice-msg").innerText = d.message || "Bạn đã bị Quản trị viên đá khỏi phòng chờ!";
		p.classList.remove("hidden");
	}
	socket.emit("leave_lobby");
	["lobby-screen", "game-container", "summary-modal"].forEach((id) =>
		$(id).classList.add("hidden"),
	);
	$("login-modal").classList.remove("hidden");
	loadHighScores();
	updateAdminUI();
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
			<span class="lobby-player-icon">${p.icon || DEFAULT_ICON}</span>
			<span class="lobby-player-name">${p.username} ${p.id === socket.id ? "(Bạn)" : ""}</span>
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
	if ($("user-icon-status")) $("user-icon-status").innerText = icon;
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

	if (data.difficulty) {
		currentDifficulty = data.difficulty;
	}
	const currentLang = data.language || currentLanguage;

	const isNgauHung = currentLang === "ngau_hung";
	const isSanBoss = currentLang === "san_boss";

	$("lobby-count").innerText = `${currentLobbyPlayers.length}/10`;
	$("lobby-mode-display").innerText = `CHẾ ĐỘ: ${modeNames[currentLang]}`;

	$("btn-open-nh-difficulty-select")?.classList.toggle("hidden", !isNgauHung);
	$("btn-open-boss-difficulty-select")?.classList.toggle("hidden", !isSanBoss);

	const diffTag = $("lobby-difficulty-tag");
	if (diffTag) {
		const isDiffMode = isNgauHung || isSanBoss;
		diffTag.classList.toggle("hidden", !isDiffMode);
		if (isDiffMode) {
			const meta = difficultyMeta[currentDifficulty] || difficultyMeta.normal;
			diffTag.innerText = `ĐỘ KHÓ: ${meta.name}`;
			diffTag.setAttribute("data-diff", currentDifficulty);
			diffTag.style.borderColor = meta.color;
			diffTag.style.color = meta.color;
		}
	}

	$$("#nh-difficulty-popup .diff-card").forEach((c) => {
		c.classList.toggle("selected", c.dataset.nhDiff === currentDifficulty);
	});
	$$("#boss-difficulty-popup .diff-card").forEach((c) => {
		c.classList.toggle("selected", c.dataset.bossDiff === currentDifficulty);
	});

	renderLobbyPlayers();
});

socket.on("game_start", (data) => {
	["lobby-screen", "summary-modal"].forEach((id) => $(id).classList.add("hidden"));
	["game-container", "chat-container"].forEach((id) => $(id).classList.remove("hidden"));

	clearAllBossSkillEffects();

	currentLanguage = data.language || currentLanguage;
	currentDifficulty = data.difficulty || currentDifficulty;
	currentWords = data.words;
	wordIndex = correctChars = totalErrors = 0;
	isPlaying = false;

	bossComboCount = 0;
	bossFractionalDamageBuffer = 0.0;
	bossBackspaceCount = 0;
	isBossCapsLockActive = false;
	updateBossComboUI();

	const isNgauHung = currentLanguage === "ngau_hung";
	const isBoss = currentLanguage === "san_boss";

	$("ngau-hung-status")?.classList.toggle("hidden", !isNgauHung);
	$("ngau-hung-diff-badge")?.classList.toggle("hidden", !isNgauHung);
	$("boss-arena-box")?.classList.toggle("hidden", !isBoss);
	$("race-tracks-title").innerText = isNgauHung
		? "BẢNG ĐIỂM NGẪU HỨNG"
		: isBoss
			? "SÁT THƯƠNG DIỆT BOSS"
			: "TIẾN ĐỘ HOÀN THÀNH";
	$("words-display").classList.toggle("ngau-hung-mode-display", isNgauHung);

	if (isNgauHung) {
		const meta = difficultyMeta[currentDifficulty] || difficultyMeta.normal;
		const diffBadge = $("ngau-hung-diff-badge");
		if (diffBadge) {
			diffBadge.innerText = meta.name;
			diffBadge.style.color = meta.color;
			diffBadge.style.borderColor = meta.color;
		}
		$("ngau-hung-round-text").innerText = `VÒNG 1/${currentWords.length || 15}`;
		$("words-display").innerHTML =
			`<span class="word current" style="color: var(--accent);">Chuẩn bị...</span>`;
	} else if (isBoss && data.boss) {
		currentBossData = data.boss;
		$("boss-name").innerText = data.boss.name;
		$("boss-avatar").innerText = data.boss.icon;
		$("boss-hp-text").innerText = `${data.boss.hp}/${data.boss.maxHp} HP`;
		$("boss-hp-fill").style.width = "100%";
		$("boss-shield-wrapper")?.classList.add("hidden");
		$("boss-skill-alert").classList.add("hidden");
		$("boss-arena-box")?.classList.remove("boss-stunned");

		const bossDiffBadge = $("boss-difficulty-badge");
		if (bossDiffBadge) {
			const meta =
				difficultyMeta[data.boss.difficulty || currentDifficulty] || difficultyMeta.normal;
			bossDiffBadge.innerText = meta.name;
			bossDiffBadge.style.color = meta.color;
			bossDiffBadge.style.borderColor = meta.color;
		}
		renderWords();
	} else {
		renderWords();
	}

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
						? clientGameConfig.numpad.duration
						: currentLanguage === "san_boss"
							? currentBossData?.duration || 150
							: clientGameConfig.normalRace.duration;

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

socket.on("boss_hp_update", (d) => {
	currentBossData = d;
	const hpPercent = Math.max(0, Math.round((d.hp / d.maxHp) * 100));
	const hpFill = $("boss-hp-fill");
	const hpText = $("boss-hp-text");
	if (hpFill) hpFill.style.width = `${hpPercent}%`;
	if (hpText) hpText.innerText = `${d.hp}/${d.maxHp} HP`;

	const shieldWrapper = $("boss-shield-wrapper");
	const shieldFill = $("boss-shield-fill");
	const shieldText = $("boss-shield-text");
	if (shieldWrapper && shieldFill && shieldText) {
		if (d.isShieldActive && d.shield > 0 && d.maxShield > 0) {
			shieldWrapper.classList.remove("hidden");
			const shieldPercent = Math.max(0, Math.round((d.shield / d.maxShield) * 100));
			shieldFill.style.width = `${shieldPercent}%`;
			shieldText.innerText = `${d.shield}/${d.maxShield} GIÁP`;
		} else if (!d.isShieldActive) {
			shieldWrapper.classList.add("hidden");
		}
	}

	if (d.players) queueRenderTracks(d.players);
});

socket.on("boss_self_destruct_notice", (d) => {
	const container = $("boss-toast-container");
	if (!container) return;

	const toast = document.createElement("div");
	toast.className = "self-destruct-toast";
	toast.innerHTML = `
		<div class="toast-blast-icon">💥</div>
		<div class="toast-content-wrapper">
			<div class="toast-title-row">
				<span class="toast-headline">QUYẾT TỬ BỘC PHÁ!</span>
				<span class="toast-dmg-pill">+${d.damage} DMG</span>
			</div>
			<div class="toast-desc">
				<strong>${d.username}</strong> đã lao thẳng vào boss tự bạo!
			</div>
		</div>
	`;

	container.appendChild(toast);
	setTimeout(() => toast.remove(), 4000);
});

socket.on("boss_shield_start", (d) => {
	const alertBox = $("boss-skill-alert");
	const shieldWrapper = $("boss-shield-wrapper");
	const shieldFill = $("boss-shield-fill");
	const shieldText = $("boss-shield-text");

	if (alertBox) {
		alertBox.innerText = `🛡️ CẢNH BÁO: BOSS KÍCH HOẠT GIÁP HỘ THỂ!`;
		alertBox.classList.remove("hidden");
	}
	if (shieldWrapper && shieldFill && shieldText) {
		shieldWrapper.classList.remove("hidden");
		shieldFill.style.width = "100%";
		shieldText.innerText = `${d.shield}/${d.maxShield} GIÁP`;
	}
});

socket.on("boss_shield_broken", (d) => {
	const alertBox = $("boss-skill-alert");
	const shieldWrapper = $("boss-shield-wrapper");
	const arena = $("boss-arena-box");

	if (shieldWrapper) shieldWrapper.classList.add("hidden");
	if (arena) arena.classList.add("boss-stunned");
	if (alertBox) {
		alertBox.innerText = d.message || "⚡ GIÁP ĐÃ VỠ! Boss bị Choáng!";
		alertBox.classList.remove("hidden");
	}
});

socket.on("boss_stun_end", () => {
	const arena = $("boss-arena-box");
	const alertBox = $("boss-skill-alert");
	if (arena) arena.classList.remove("boss-stunned");
	if (alertBox) alertBox.classList.add("hidden");
});

socket.on("boss_shield_failed", (d) => {
	const alertBox = $("boss-skill-alert");
	const shieldWrapper = $("boss-shield-wrapper");

	if (shieldWrapper) shieldWrapper.classList.add("hidden");
	if (alertBox) {
		alertBox.innerText = d.message;
		alertBox.classList.remove("hidden");
		setTimeout(() => alertBox.classList.add("hidden"), 3000);
	}
	resetBossCombo("Sóng xung kích từ Giáp Boss");
});

socket.on("boss_capslock_start", () => {
	isBossCapsLockActive = true;
	const alertBox = $("boss-skill-alert");
	if (alertBox) {
		alertBox.innerText = `🔠 CHUẨN BỊ PHÙ PHÉP CHỮ KHUYẾT TẬT!`;
		alertBox.classList.remove("hidden");
	}
	renderWords();
});

socket.on("boss_capslock_end", () => {
	isBossCapsLockActive = false;
	const alertBox = $("boss-skill-alert");
	if (alertBox) alertBox.classList.add("hidden");
	renderWords();
});

socket.on("boss_skill_warning", (d) => {
	const alertBox = $("boss-skill-alert");
	const skillDesc =
		d.skill === "shake"
			? "🌋 BOSS CHUẨN BỊ XÀI MÁY RUNG (TREMOR)!"
			: d.skill === "fog"
				? "🌫️ BOSS CHUẨN BỊ HÀ HƠI SƯƠNG TỐI (DARK FOG)!"
				: d.skill === "reverse"
					? "🌀 BOSS CHUẨN BỊ ĐẢO CHỮ GƯƠNG (MIRROR)!"
					: d.skill === "shield"
						? "🛡️ BOSS CHUẨN BỊ BUFF GIÁP HỘ THỂ!"
						: "🔠 BOSS CHUẨN BỊ PHÙ PHÉP CHỮ KHUYẾT TẬT!";
	if (alertBox) {
		alertBox.innerText = `⚠️ CẢNH BÁO: [${skillDesc}]!`;
		alertBox.classList.remove("hidden");
	}
});

socket.on("boss_skill_cast", (d) => {
	const gameContainer = $("game-container");
	const wordsDisplay = $("words-display");
	const fogLayer = $("boss-fog-layer");
	const alertBox = $("boss-skill-alert");

	if (alertBox) {
		alertBox.innerText = `🔥 BOSS ĐANG KÍCH HOẠT KỸ NĂNG: ${d.skill.toUpperCase()}!`;
		alertBox.classList.remove("hidden");
	}

	if (d.skill === "shake" && gameContainer) {
		gameContainer.classList.add("boss-shake-active");
	}
	if (d.skill === "reverse" && wordsDisplay) {
		wordsDisplay.classList.add("boss-reverse-active");
	}
	if (d.skill === "fog" && fogLayer) {
		fogLayer.classList.remove("hidden");
	}

	setTimeout(
		() => {
			if (d.skill === "shake" && gameContainer) gameContainer.classList.remove("boss-shake-active");
			if (d.skill === "reverse" && wordsDisplay)
				wordsDisplay.classList.remove("boss-reverse-active");
			if (d.skill === "fog" && fogLayer) fogLayer.classList.add("hidden");
			if (alertBox) alertBox.classList.add("hidden");
		},
		(d.duration || 5) * 1000,
	);
});

socket.on("ngau_hung_new_round", (d) => {
	ngauHungTargetWord = d.targetWord;
	ngauHungHasSubmittedThisRound = false;
	ngauHungCurrentRound = d.round;
	isPlaying = true;

	if (d.difficulty) currentDifficulty = d.difficulty;
	const meta = difficultyMeta[currentDifficulty] || difficultyMeta.normal;

	const diffBadge = $("ngau-hung-diff-badge");
	if (diffBadge) {
		diffBadge.innerText = meta.name;
		diffBadge.style.color = meta.color;
		diffBadge.style.borderColor = meta.color;
		diffBadge.classList.remove("hidden");
	}

	$("ngau-hung-round-text").innerText = `VÒNG ${d.round}/${d.totalRounds}`;
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
		timeLeft = Math.max(0, timeLeft - 1);
		$("timer").innerText = timeLeft;
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

function getRenderedWord(w, idx) {
	let displayWord = w;
	if (isBossCapsLockActive && currentLanguage === "san_boss") {
		displayWord =
			idx % 2 === 0
				? w.toUpperCase()
				: w
						.split("")
						.map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
						.join("");
	}
	return displayWord;
}

function renderWords() {
	const wd = $("words-display");
	wd.classList.toggle("numpad-mode", currentLanguage === "numpad");
	wd.innerHTML = currentWords
		.map((w, idx) => {
			const wordText = getRenderedWord(w, idx);
			let cls = "word";
			if (idx < wordIndex) {
				cls = "word correct";
			} else if (idx === wordIndex) {
				cls = "word current correct-typing";
			}
			return `<span class="${cls}">${wordText}</span>`;
		})
		.join("");
	scrollActiveWordToCenter();
}

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
				if (wordEl) wordEl.className = "word current correct-typing";
				socket.emit("update_progress", {
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

	const baseTarget = currentWords[wordIndex];
	const target = getRenderedWord(baseTarget, wordIndex);
	const currSpan = $("words-display").children[wordIndex];

	if (val.endsWith(" ")) {
		if (val.trim() === target) {
			const wordLength = target.length + 1;
			correctChars += wordLength;
			if (currSpan) currSpan.className = "word correct";
			wordIndex++;
			input.value = "";

			if (currentLanguage === "san_boss") {
				bossComboCount++;
				updateBossComboUI();

				const mult = getComboMultiplier(bossComboCount);
				const calculatedDamage = wordLength * mult;
				let finalIntegerDamage = Math.floor(calculatedDamage);
				const fractionPart = calculatedDamage - finalIntegerDamage;

				bossFractionalDamageBuffer += fractionPart;
				if (bossFractionalDamageBuffer >= 1.0) {
					const bonus = Math.floor(bossFractionalDamageBuffer);
					finalIntegerDamage += bonus;
					bossFractionalDamageBuffer -= bonus;
				}

				socket.emit("deal_boss_damage", { damage: finalIntegerDamage, errors: totalErrors });
			}

			if (wordIndex >= currentWords.length) return finishGame();
			if ($("words-display").children[wordIndex])
				$("words-display").children[wordIndex].className = "word current correct-typing";

			scrollActiveWordToCenter();
		} else {
			totalErrors++;
			input.value = "";
			if (currSpan) currSpan.className = "word current correct-typing";

			if (currentLanguage === "san_boss") {
				resetBossCombo("Gõ sai từ");
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
	clearAllBossSkillEffects();

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
	clearAllBossSkillEffects();
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

function queueRenderTracks(players) {
	latestPlayersData = players;
	if (!isRenderTracksPending) {
		isRenderTracksPending = true;
		requestAnimationFrame(() => {
			if (latestPlayersData) renderRaceTracks(latestPlayersData);
			isRenderTracksPending = false;
		});
	}
}

function renderRaceTracks(players) {
	const container = $("race-tracks-container");
	if (!container) return;
	container.innerHTML = players
		.map((p) => {
			const isDis = p.isSurrendered || p.isDisconnected || p.isAFK;
			const status = p.isSurrendered
				? `<span class="status-tag status-surrendered">${p.isAFK ? "AFK" : "GIẢNG HÒA"}</span>`
				: p.isDisconnected
					? `<span class="status-tag status-surrendered">BẢY CHỌ</span>`
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
					<div class="track-line-fill" style="width: ${p.progress || 0}%; background: ${isDis ? "#4a4a4a" : p.id === socket.id ? "var(--primary)" : "var(--accent)"};">
						<div class="runner-icon-badge">${p.icon || DEFAULT_ICON}</div>
					</div>
				</div>
			</div>
		`;
		})
		.join("");
}

socket.on("race_update", queueRenderTracks);

socket.on("game_over", (d) => {
	stopAutoTyperBot();
	isPlaying = false;
	clearTimeout(afkTimer);
	clearInterval(timerInterval);
	clearInterval(ngauHungRoundTimer);
	clearAllBossSkillEffects();

	$("game-container").classList.add("hidden");
	$("chat-container").classList.add("hidden");
	$("summary-modal").classList.remove("hidden");

	const isNH = (d.language || currentLanguage) === "ngau_hung";
	const isBoss = (d.language || currentLanguage) === "san_boss";

	const modalTitle = $("summary-modal-title");
	const bossSubtitle = $("boss-result-subtitle");

	if (isBoss) {
		bossSubtitle.classList.remove("hidden");
		const meta = difficultyMeta[d.difficulty || currentDifficulty] || difficultyMeta.normal;
		if (d.isBossVictory) {
			modalTitle.innerText = "🎉 LỤM! CHIẾN THẮNG! 🎉";
			modalTitle.style.color = "var(--correct)";
			bossSubtitle.innerText = `Cả đội đã hợp lực tiêu diệt thành công Hắc Long Ma Vương [${meta.name}]!`;
			bossSubtitle.style.color = "var(--correct)";
		} else {
			modalTitle.innerText = "💀 THẤT BẠI! 💀";
			modalTitle.style.color = "var(--secondary)";
			bossSubtitle.innerText = `Hết giờ! Hắc Long Ma Vương [${meta.name}] đã quét sạch toàn bộ đội hình!`;
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
				? `<span class="status-tag status-surrendered">${p.isAFK ? "AFK" : "GIẢNG HÒA"}</span>`
				: p.isDisconnected
					? `<span class="status-tag status-surrendered">BẢY CHỌ</span>`
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
// CHAT ENGINE & TIN NHẮN THỜI GIAN THỰC
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
	b.innerHTML = `
		<span class="sender">${d.username}</span>
		<span class="text">${d.message}</span>
	`;
	popups.appendChild(b);
	setTimeout(() => b.remove(), 4500);
});

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
// BOT AUTO-TYPER ENGINE (TESTING ENGINE)
// ==========================================
function setupBotModal() {
	if ($("bot-config-popup")) return;
	const div = document.createElement("div");
	div.id = "bot-config-popup";
	div.className = "custom-popup hidden";
	div.innerHTML = `
		<div class="popup-content modal-auth">
			<div class="popup-icon-badge">🤖</div>
			<h3 class="popup-auth-title">THIẾT LẬP AUTO BOT TEST</h3>
			<div style="margin-bottom: 14px; text-align: left;">
				<label style="font-size: 12px; font-weight: bold; color: var(--text-muted);">TỐC ĐỘ (WPM):</label>
				<input type="number" id="bot-speed-input" value="100" min="10" max="500" class="cyber-input" style="margin-top: 5px; margin-bottom: 0;" />
			</div>
			<div style="margin-bottom: 20px; text-align: left;">
				<label style="font-size: 12px; font-weight: bold; color: var(--text-muted);">SỐ LỖI MONG MUỐN:</label>
				<input type="number" id="bot-errors-input" value="0" min="0" max="100" class="cyber-input" style="margin-top: 5px; margin-bottom: 0;" />
			</div>
			<div class="popup-actions-row">
				<button id="btn-start-bot" class="cyber-btn btn-primary-style">BẮT ĐẦU (F4)</button>
				<button class="cyber-btn btn-secondary-style" data-close="bot-config-popup">HỦY</button>
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

		const currTarget = isNH
			? ngauHungTargetWord
			: getRenderedWord(currentWords[wordIndex], wordIndex);
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
