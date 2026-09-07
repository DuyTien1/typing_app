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

const MONKEY_THEMES = [
	{
		id: "serika_dark",
		name: "Serika Dark",
		bg: "#323437",
		main: "#e2b714",
		sub: "#646669",
		text: "#d1d0c5",
	},
	{ id: "carbon", name: "Carbon", bg: "#313131", main: "#f66e0d", sub: "#616161", text: "#f5e6c8" },
	{
		id: "dracula",
		name: "Dracula",
		bg: "#282a36",
		main: "#f1fa8c",
		sub: "#6272a4",
		text: "#f8f8f2",
	},
	{ id: "nord", name: "Nord", bg: "#2e3440", main: "#88c0d0", sub: "#4c566a", text: "#eceff4" },
	{
		id: "botanical",
		name: "Botanical",
		bg: "#7b9c98",
		main: "#eaf1f1",
		sub: "#495e5b",
		text: "#eaf1f1",
	},
	{ id: "olivia", name: "Olivia", bg: "#1c1b1d", main: "#deaf9d", sub: "#655e60", text: "#f2efed" },
	{ id: "matrix", name: "Matrix", bg: "#000000", main: "#15ff00", sub: "#008000", text: "#00ff41" },
	{
		id: "cyberpunk",
		name: "Cyberpunk",
		bg: "#181c24",
		main: "#00f0ff",
		sub: "#53647d",
		text: "#f0f6fc",
	},
	{ id: "bento", name: "Bento", bg: "#2d394d", main: "#ff7a90", sub: "#5c6e8e", text: "#fffaf8" },
	{
		id: "vaporwave",
		name: "Vaporwave",
		bg: "#a4a7de",
		main: "#ff75a0",
		sub: "#616497",
		text: "#2b2b46",
	},
	{
		id: "theme_8008",
		name: "8008",
		bg: "#333a45",
		main: "#f44c7f",
		sub: "#939eae",
		text: "#e9ecf0",
	},
	{
		id: "milkshake",
		name: "Milkshake",
		bg: "#ffffff",
		main: "#212b43",
		sub: "#7b889b",
		text: "#131927",
	},
	{ id: "muted", name: "Muted", bg: "#525252", main: "#c4c4c4", sub: "#8a8a8a", text: "#f0f0f0" },
	{
		id: "modern_dolch",
		name: "Modern Dolch",
		bg: "#2d3139",
		main: "#03a89e",
		sub: "#636c7a",
		text: "#e5e9f0",
	},
	{ id: "laser", name: "Laser", bg: "#221b44", main: "#00e8c6", sub: "#b82375", text: "#dbeafe" },
	{
		id: "dualshot",
		name: "Dualshot",
		bg: "#737373",
		main: "#212224",
		sub: "#a3a3a3",
		text: "#ffffff",
	},
	{ id: "taro", name: "Taro", bg: "#b388eb", main: "#ffe1a8", sub: "#6c4675", text: "#1b1b2f" },
	{
		id: "red_samurai",
		name: "Red Samurai",
		bg: "#84202a",
		main: "#c79e54",
		sub: "#5d161d",
		text: "#f0e6e7",
	},
	{
		id: "magic_girl",
		name: "Magic Girl",
		bg: "#ffffff",
		main: "#f5b0cb",
		sub: "#92bed4",
		text: "#191b1f",
	},
	{
		id: "metaverse",
		name: "Metaverse",
		bg: "#232323",
		main: "#d82934",
		sub: "#6b6b6b",
		text: "#f5f5f5",
	},
];

const MONKEY_FONTS = [
	{ id: "lexend", name: "Lexend", sample: "The quick brown fox jumps" },
	{ id: "fira_code", name: "Fira Code", sample: "const code = 100;" },
	{ id: "jetbrains_mono", name: "JetBrains Mono", sample: "function typeFast() {}" },
	{ id: "roboto_mono", name: "Roboto Mono", sample: "Clean and balanced glyphs" },
	{ id: "space_mono", name: "Space Mono", sample: "Retro technological type" },
	{ id: "ubuntu_mono", name: "Ubuntu Mono", sample: "Warm and friendly terminal" },
	{ id: "inconsolata", name: "Inconsolata", sample: "Clear monospaced rendering" },
	{ id: "source_code_pro", name: "Source Code Pro", sample: "Adobe engineered monospace" },
	{ id: "inter", name: "Inter", sample: "Modern screen-first sans" },
	{ id: "montserrat", name: "Montserrat", sample: "Geometric and elegant" },
	{ id: "nunito", name: "Nunito", sample: "Rounded, soft letterforms" },
	{ id: "vt323", name: "VT323", sample: "Retro 8-bit arcade terminal" },
	{ id: "anonymous_pro", name: "Anonymous Pro", sample: "Fixed-width coding font" },
	{ id: "comfortaa", name: "Comfortaa", sample: "Geometric rounded design" },
	{ id: "cousine", name: "Cousine", sample: "Functional typewriter design" },
	{ id: "major_mono", name: "Major Mono Display", sample: "Eclectic geometric mono" },
	{ id: "nanum_coding", name: "Nanum Gothic Coding", sample: "Crisp and legible monotype" },
	{ id: "nova_mono", name: "Nova Mono", sample: "Futuristic stylistic typeface" },
	{ id: "overpass_mono", name: "Overpass Mono", sample: "Highway signage inspired" },
	{ id: "plus_jakarta", name: "Plus Jakarta Sans", sample: "Refined geometric sans" },
];

const savedTheme =
	localStorage.getItem("monkey_theme") || getCookie("monkey_theme") || "serika_dark";
const savedFont = localStorage.getItem("monkey_font") || getCookie("monkey_font") || "lexend";

let currentTheme = savedTheme;
let currentFont = savedFont;

let currentLanguage = "vi_dau",
	currentDifficulty = "normal",
	myUsername = "bot_1000",
	mySelectedIcon = DEFAULT_ICON;

function applyTheme(themeId) {
	if (isPlaying) return;

	const theme = MONKEY_THEMES.find((t) => t.id === themeId) || MONKEY_THEMES[0];
	currentTheme = theme.id;
	document.documentElement.setAttribute("data-theme", currentTheme);

	const label = $("theme-btn-label");
	if (label) label.innerText = theme.name;

	localStorage.setItem("monkey_theme", currentTheme);
	setCookie("monkey_theme", currentTheme, 365);

	$$("#theme-cards-grid .monkey-card").forEach((card) => {
		card.classList.toggle("selected", card.dataset.themeId === currentTheme);
	});
}

function applyFont(fontId) {
	if (isPlaying) return;

	const font = MONKEY_FONTS.find((f) => f.id === fontId) || MONKEY_FONTS[0];
	currentFont = font.id;
	document.documentElement.setAttribute("data-font", currentFont);

	const label = $("font-btn-label");
	if (label) label.innerText = font.name;

	localStorage.setItem("monkey_font", currentFont);
	setCookie("monkey_font", currentFont, 365);

	$$("#font-cards-grid .monkey-card").forEach((card) => {
		card.classList.toggle("selected", card.dataset.fontId === currentFont);
	});

	if (isPlaying) updateCaretPosition(true);
}

function updateThemeFontButtonsState() {
	const themeBtn = $("theme-select-btn");
	const fontBtn = $("font-select-btn");
	const disabled = isPlaying;

	[themeBtn, fontBtn].forEach((btn) => {
		if (btn) {
			btn.disabled = disabled;
			btn.title = disabled
				? "Không thể đổi Theme/Font khi đang trong trận đấu"
				: btn.id === "theme-select-btn"
					? "Chọn Theme"
					: "Chọn Font gõ phím";
		}
	});

	if (isPlaying) {
		$("theme-select-popup")?.classList.add("hidden");
		$("font-select-popup")?.classList.add("hidden");
	}
}

// Cấu hình Client nhận từ Server
let clientGameConfig = {
	normalRace: { duration: 300, wordCount: 150 },
	numpad: {
		duration: 90,
		wordCount: 500,
		difficulties: {
			fullsize: { id: "fullsize", name: "Fullsize", icon: "🖩", color: "#e2b714" },
			number: { id: "number", name: "Number", icon: "🔢", color: "#00f0ff" },
		},
	},
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
			},
			legendary: {
				id: "legendary",
				name: "Huyền Thoại",
				icon: "👑",
				color: "#ff0055",
				roundDuration: 3.5,
				intermissionDuration: 1.5,
				totalRounds: 25,
			},
		},
	},
	doanChu: {
		difficulties: {
			normal: {
				id: "normal",
				name: "Bình thường",
				icon: "🟡",
				color: "#ffe600",
				roundDuration: 18,
				revealInterval: 1.2,
				intermissionDuration: 3,
				totalRounds: 10,
				showHint: true,
			},
			hard: {
				id: "hard",
				name: "Khó",
				icon: "🔴",
				color: "#ff7700",
				roundDuration: 14,
				revealInterval: 1.0,
				intermissionDuration: 2.5,
				totalRounds: 12,
				showHint: true,
			},
			legendary: {
				id: "legendary",
				name: "Huyền Thoại",
				icon: "👑",
				color: "#ff0055",
				roundDuration: 10,
				revealInterval: 0.7,
				intermissionDuration: 2,
				totalRounds: 15,
				showHint: false,
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
				smokeDuration: 4,
				numMode: "number",
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
				smokeDuration: 4,
				numMode: "number",
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
				smokeDuration: 4.5,
				numMode: "number",
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
				smokeDuration: 5,
				numMode: "fullsize",
			},
		},
	},
};

let tempAdminDifficulties = JSON.parse(JSON.stringify(clientGameConfig.sanBoss.difficulties));
let selectedConfigDiffKey = "normal";

let tempAdminNhDifficulties = JSON.parse(JSON.stringify(clientGameConfig.ngauHung.difficulties));
let selectedConfigNhDiffKey = "normal";

let tempAdminDcDifficulties = JSON.parse(JSON.stringify(clientGameConfig.doanChu.difficulties));
let selectedConfigDcDiffKey = "normal";

let currentWords = [],
	wordIndex = 0,
	correctChars = 0,
	totalErrors = 0,
	rawCharsCount = 0,
	isPlaying = false;
let startTime = null,
	timerInterval = null,
	afkTimer = null;
let currentLobbyPlayers = [];

// ==========================================
// OUTPLAY YOURSELF (SOLO GHOST ENGINE) STATE
// ==========================================
const OutplaySession = {
	isActive: false,
	mode: "vi_dau",
	duration: 30,
	ghostMode: "last", // 'last' | 'pb' | 'custom'
	customWpm: 100,
	hasStartedTyping: false,
	// Lưu trữ kỷ lục (PB) và Ván trước (LastRun) theo khóa: `${mode}_${duration}`
	recordsByConfig: {},
	currentRun: {
		netWpm: 0,
		rawWpm: 0,
		accuracy: 100,
		errors: 0,
		duration: 30,
		timeline: [], // [{ second, netWpm, rawWpm, ghostWpm }]
		errorMarkers: [], // [second1, second2...]
		keystrokeTrace: [], // [{ timeMs, charIndex }]
	},
	ghostRafId: null,
	liveSecondInterval: null,
};

// Chế độ Ngẫu Hứng & Đoán Chữ & Săn Boss
let ngauHungTargetWord = "",
	ngauHungRoundTimer = null,
	ngauHungHasSubmittedThisRound = false,
	ngauHungCurrentRound = 0;

let doanChuRoundTimer = null,
	doanChuHasSubmittedThisRound = false,
	doanChuCurrentRound = 0,
	doanChuTotalTiles = 0,
	isInputPenaltyLocked = false;

let currentBossData = null;
let bossComboCount = 0;
let bossFractionalDamageBuffer = 0.0;
let bossBackspaceCount = 0;
let isBossCapsLockActive = false;
let smokeClearTimeout = null;

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

// Biến điều khiển con trỏ và chuyển dòng mượt mà
let currentViewportOffsetY = 0;
let firstLineOffsetTop = 0;
let lastCaretWordTop = null;
let caretTypingTimeout = null;

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
	numpad: "🔢 Numpad (58008)",
	ngau_hung: "🎲 Ngẫu Hứng",
	doan_chu: "🧩 Đoán Chữ",
	san_boss: "🐉 Săn Boss",
	outplay: "👻 Outplay Yourself",
};

const difficultyMeta = {
	custom: { name: "TÙY CHỈNH", color: "#00f0ff", icon: "🛠️" },
	normal: { name: "BÌNH THƯỜNG", color: "#ffe600", icon: "🟡" },
	hard: { name: "KHÓ", color: "#ff7700", icon: "🔴" },
	hell: { name: "ĐỊA NGỤC", color: "#ff0055", icon: "💀" },
	legendary: { name: "HUYỀN THOẠI", color: "#ff0055", icon: "👑" },
	fullsize: { name: "FULLSIZE (58008)", color: "#e2b714", icon: "🖩" },
	number: { name: "CHỈ SỐ", color: "#00f0ff", icon: "🔢" },
};

let serverHighScores = {
	vi_dau: null,
	vi_nodau: null,
	en: null,
	numpad: null,
	ngau_hung: null,
	doan_chu: null,
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

function renderThemeSelector() {
	const grid = $("theme-cards-grid");
	if (!grid) return;
	grid.innerHTML = MONKEY_THEMES.map(
		(t) => `
		<div class="monkey-card ${t.id === currentTheme ? "selected" : ""}" data-theme-id="${t.id}">
			<div class="monkey-card-title">
				<span>${t.name}</span>
				<div class="theme-preview-dots">
					<span class="theme-dot" style="background: ${t.bg};" title="Nền"></span>
					<span class="theme-dot" style="background: ${t.main};" title="Màu chính"></span>
					<span class="theme-dot" style="background: ${t.text};" title="Chữ"></span>
				</div>
			</div>
		</div>
	`,
	).join("");

	$$("#theme-cards-grid .monkey-card").forEach((card) => {
		card.addEventListener("click", () => {
			if (isPlaying) return;
			applyTheme(card.dataset.themeId);
			$("theme-select-popup")?.classList.add("hidden");
		});
	});
}

function renderFontSelector() {
	const grid = $("font-cards-grid");
	if (!grid) return;
	grid.innerHTML = MONKEY_FONTS.map(
		(f) => `
		<div class="monkey-card ${f.id === currentFont ? "selected" : ""}" data-font-id="${f.id}">
			<div class="monkey-card-title">
				<span>${f.name}</span>
			</div>
			<div class="font-preview-text" style="font-family: '${f.name}', monospace, sans-serif;">
				${f.sample}
			</div>
		</div>
	`,
	).join("");

	$$("#font-cards-grid .monkey-card").forEach((card) => {
		card.addEventListener("click", () => {
			if (isPlaying) return;
			applyFont(card.dataset.fontId);
			$("font-select-popup")?.classList.add("hidden");
		});
	});
}

function triggerCaretTypingState() {
	const caret = $("caret");
	if (!caret) return;
	caret.classList.add("typing");
	clearTimeout(caretTypingTimeout);
	caretTypingTimeout = setTimeout(() => {
		caret.classList.remove("typing");
	}, 450);
}

function updateCaretPosition(instant = false) {
	const caret = $("caret");
	const display = $("words-display");

	if (
		!caret ||
		!display ||
		!isPlaying ||
		currentLanguage === "doan_chu" ||
		currentLanguage === "ngau_hung"
	) {
		caret?.classList.add("hidden");
		return;
	}

	const currentWordEl = $(`word-${wordIndex}`);
	if (!currentWordEl) {
		caret.classList.add("hidden");
		return;
	}

	handleSmoothLineShift(currentWordEl);

	const isLineJump = lastCaretWordTop !== null && lastCaretWordTop !== currentWordEl.offsetTop;
	lastCaretWordTop = currentWordEl.offsetTop;

	const shouldBeInstant = instant || isLineJump;
	if (shouldBeInstant) {
		caret.classList.add("no-transition");
	}

	const inputVal = $("type-input")?.value || "";
	const letterElements = currentWordEl.querySelectorAll(".letter:not(.extra)");

	const displayRect = display.getBoundingClientRect();
	const wordRect = currentWordEl.getBoundingClientRect();

	let targetX = 0;
	let targetHeight = wordRect.height || 36;
	const CARET_GAP = 2;

	if (inputVal.length < letterElements.length) {
		const targetLetter = letterElements[inputVal.length];
		const letterRect = targetLetter.getBoundingClientRect();
		targetX = letterRect.left - displayRect.left - CARET_GAP;
		targetHeight = letterRect.height || targetHeight;
	} else if (letterElements.length > 0) {
		const lastLetter = letterElements[letterElements.length - 1];
		const lastLetterRect = lastLetter.getBoundingClientRect();
		targetX = lastLetterRect.right - displayRect.left + CARET_GAP;
		targetHeight = lastLetterRect.height || targetHeight;
	} else {
		targetX = wordRect.left - displayRect.left - CARET_GAP;
	}

	const targetY = wordRect.top - displayRect.top;

	caret.style.left = `${Math.round(targetX)}px`;
	caret.style.top = `${Math.round(targetY)}px`;
	caret.style.height = `${Math.round(Math.max(26, targetHeight))}px`;

	caret.classList.remove("hidden");

	if (shouldBeInstant) {
		void caret.offsetWidth;
		requestAnimationFrame(() => {
			caret.classList.remove("no-transition");
		});
	}
}

function handleSmoothLineShift(currentWordEl) {
	const display = $("words-display");
	if (!display || !currentWordEl) return;

	const firstWord = display.querySelector(".word");
	if (!firstWord) return;

	if (firstLineOffsetTop === 0 || wordIndex === 0) {
		firstLineOffsetTop = firstWord.offsetTop;
	}

	const currentWordTop = currentWordEl.offsetTop;
	const diffY = currentWordTop - firstLineOffsetTop;

	if (diffY > 44) {
		currentViewportOffsetY = -(diffY - 8);
	} else {
		currentViewportOffsetY = 0;
	}

	display.style.transform = `translate3d(0, ${currentViewportOffsetY}px, 0)`;
}

function loadHighScores() {
	const tbody = $("high-score-tbody");
	if (!tbody) return;
	tbody.innerHTML = "";

	Object.keys(modeNames).forEach((mode) => {
		if (mode === "outplay") return;
		const data = serverHighScores[mode];
		const tr = document.createElement("tr");
		const scoreDisplay =
			mode === "ngau_hung" || mode === "doan_chu"
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
		multTag.style.color = mult > 1.0 ? "var(--main-color)" : "var(--text-color)";
	}
	if (bsCount) {
		bsCount.innerText = `${bossBackspaceCount}/10`;
		bsCount.style.color = bossBackspaceCount >= 7 ? "var(--error-color)" : "var(--sub-color)";
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

	const smokeLayer = $("boss-smoke-layer");
	if (smokeLayer) {
		smokeLayer.classList.remove("active");
		smokeLayer.classList.add("hidden");
	}
	const wordsDisplay = $("words-display");
	if (wordsDisplay) {
		wordsDisplay.classList.remove("smoke-blurred");
		wordsDisplay.style.removeProperty("--smoke-duration");
	}
	clearTimeout(smokeClearTimeout);

	$("boss-skill-alert")?.classList.add("hidden");
	$("boss-arena-box")?.classList.remove("boss-stunned");
}

// =========================================================================
// OUTPLAY YOURSELF: SIDEBAR STATS & ENGINE (HỖ TRỢ THEO TỪNG CẤU HÌNH RIÊNG)
// =========================================================================
function getOutplayConfigKey() {
	return `${OutplaySession.mode}_${OutplaySession.duration}`;
}

function getOutplayRecordForCurrentConfig() {
	const key = getOutplayConfigKey();
	if (!OutplaySession.recordsByConfig[key]) {
		OutplaySession.recordsByConfig[key] = {
			lastRun: null,
			sessionPB: null,
		};
	}
	return OutplaySession.recordsByConfig[key];
}

function updateOutplaySidebarStats() {
	const pbEl = $("sidebar-pb-wpm");
	const lastEl = $("sidebar-last-wpm");
	const record = getOutplayRecordForCurrentConfig();

	const pbVal = record.sessionPB ? record.sessionPB.netWpm : 0;
	const lastVal = record.lastRun ? record.lastRun.netWpm : 0;

	if (pbEl) pbEl.innerText = pbVal;
	if (lastEl) lastEl.innerText = lastVal;
}

function setupOutplayToolbarEvents() {
	$("outplay-select-mode")?.addEventListener("change", (e) => {
		OutplaySession.mode = e.target.value;
		updateOutplaySidebarStats();
		initOutplayRound(false);
	});

	// KHI THAY ĐỔI THỜI GIAN THI ĐẤU: CẬP NHẬT ĐÚNG STATS CỦA CẤU HÌNH MỚI
	$("outplay-select-duration")?.addEventListener("change", (e) => {
		OutplaySession.duration = parseInt(e.target.value) || 30;
		updateOutplaySidebarStats();
		if (!OutplaySession.hasStartedTyping) {
			$("timer").innerText = OutplaySession.duration;
		}
		const input = $("type-input");
		if (input && !input.disabled) {
			input.focus();
		}
	});

	$("outplay-select-ghost-mode")?.addEventListener("change", (e) => {
		OutplaySession.ghostMode = e.target.value;
		const customWrap = $("outplay-custom-wpm-wrapper");
		if (customWrap) {
			customWrap.classList.toggle("hidden", OutplaySession.ghostMode !== "custom");
		}
		$("type-input")?.focus();
	});

	$("outplay-custom-wpm-input")?.addEventListener("input", (e) => {
		OutplaySession.customWpm = Math.max(20, Math.min(300, parseInt(e.target.value) || 100));
	});

	// CHƠI TIẾP: GIỮ NGUYÊN KHUNG WORDS-DISPLAY ĐỂ SO SÁNH TRỰC DIỆN
	$("btn-outplay-replay")?.addEventListener("click", () => {
		commitOutplayRunToSession();
		$("summary-modal")?.classList.add("hidden");
		$("game-container")?.classList.remove("hidden");
		initOutplayRound(true); // Giữ nguyên từ
	});

	// RESET TỐC ĐỘ: ĐẶT LẠI STATS ĐÃ LƯU CỦA ĐÚNG CẤU HÌNH HIỆN TẠI
	$("btn-outplay-reset")?.addEventListener("click", () => {
		const record = getOutplayRecordForCurrentConfig();
		record.lastRun = null;
		record.sessionPB = null;
		updateOutplaySidebarStats();
		$("summary-modal")?.classList.add("hidden");
		$("game-container")?.classList.remove("hidden");
		initOutplayRound(false);
	});

	$("btn-outplay-home")?.addEventListener("click", () => {
		OutplaySession.isActive = false;
		OutplaySession.recordsByConfig = {};
		stopGhostCaret();
		clearInterval(OutplaySession.liveSecondInterval);

		["game-container", "summary-modal"].forEach((id) => $(id)?.classList.add("hidden"));
		$("login-modal")?.classList.remove("hidden");
		updateThemeFontButtonsState();
	});
}

function startOutplaySoloDirect() {
	OutplaySession.isActive = true;
	currentLanguage = "outplay";

	["login-modal", "lobby-screen", "summary-modal"].forEach((id) => $(id)?.classList.add("hidden"));
	["game-container"].forEach((id) => $(id)?.classList.remove("hidden"));

	$("chat-container")?.classList.add("hidden");
	$("leaderboard")?.classList.add("hidden");
	$("boss-arena-box")?.classList.add("hidden");
	$("ngau-hung-status")?.classList.add("hidden");
	$("doan-chu-status")?.classList.add("hidden");
	$("outplay-hud-toolbar")?.classList.remove("hidden");
	$("outplay-stats-sidebar")?.classList.remove("hidden");

	if ($("outplay-select-mode")) $("outplay-select-mode").value = OutplaySession.mode;
	if ($("outplay-select-duration"))
		$("outplay-select-duration").value = OutplaySession.duration.toString();
	if ($("outplay-select-ghost-mode"))
		$("outplay-select-ghost-mode").value = OutplaySession.ghostMode;
	if ($("outplay-custom-wpm-input"))
		$("outplay-custom-wpm-input").value = OutplaySession.customWpm.toString();
	$("outplay-custom-wpm-wrapper")?.classList.toggle(
		"hidden",
		OutplaySession.ghostMode !== "custom",
	);

	updateOutplaySidebarStats();
	initOutplayRound(false);
}

function initOutplayRound(keepWords = false) {
	stopGhostCaret();
	clearInterval(timerInterval);
	clearInterval(OutplaySession.liveSecondInterval);
	clearAllBossSkillEffects();

	isPlaying = true;
	OutplaySession.hasStartedTyping = false;
	wordIndex = correctChars = totalErrors = rawCharsCount = 0;
	currentViewportOffsetY = 0;
	firstLineOffsetTop = 0;
	lastCaretWordTop = null;

	OutplaySession.currentRun = {
		netWpm: 0,
		rawWpm: 0,
		accuracy: 100,
		errors: 0,
		duration: OutplaySession.duration,
		timeline: [],
		errorMarkers: [],
		keystrokeTrace: [],
	};

	updateOutplaySidebarStats();
	$("timer").innerText = OutplaySession.duration;
	$("status-box").innerText = "GÕ KÝ TỰ ĐẦU TIÊN ĐỂ BẮT ĐẦU";

	const isNumpad = OutplaySession.mode.startsWith("numpad");
	$("words-display").className = `words-display ${isNumpad ? "numpad-mode-display" : ""}`;
	$("words-display").style.transform = "translate3d(0, 0, 0)";

	const input = $("type-input");
	input.value = "";
	input.disabled = false;
	input.placeholder = "Bắt đầu gõ để kích hoạt đồng hồ...";
	input.focus();

	if (!keepWords || currentWords.length === 0) {
		socket.emit("get_outplay_words", {
			mode: OutplaySession.mode,
			wordCount: 350,
		});
	} else {
		renderWords();
		requestAnimationFrame(() => {
			updateCaretPosition(true);
			input.focus();
		});
	}

	$("ghost-caret")?.classList.add("hidden");
	$("caret")?.classList.add("hidden");
}

socket.on("outplay_words_ready", (data) => {
	if (!OutplaySession.isActive) return;
	currentWords = data.words || [];
	renderWords();
	requestAnimationFrame(() => {
		updateCaretPosition(true);
		$("type-input")?.focus();
	});
});

function triggerOutplayFirstKeystroke() {
	if (OutplaySession.hasStartedTyping) return;
	OutplaySession.hasStartedTyping = true;
	startTime = Date.now();
	$("status-box").innerText = "ĐANG THI ĐẤU (SOLO)";

	startOutplayCountdowns();
	startGhostCaretRunner();
}

function startOutplayCountdowns() {
	let timeLeft = OutplaySession.duration;
	let secondsElapsed = 0;

	clearInterval(timerInterval);
	clearInterval(OutplaySession.liveSecondInterval);

	timerInterval = setInterval(() => {
		timeLeft--;
		$("timer").innerText = Math.max(0, timeLeft);

		if (timeLeft <= 0) {
			clearInterval(timerInterval);
			clearInterval(OutplaySession.liveSecondInterval);
			finishOutplayGame();
		}
	}, 1000);

	OutplaySession.liveSecondInterval = setInterval(() => {
		secondsElapsed++;
		const minutes = secondsElapsed / 60;
		const netWpm = Math.max(0, Math.round(correctChars / 5 / minutes));
		const rawWpm = Math.max(0, Math.round(rawCharsCount / 5 / minutes));
		const record = getOutplayRecordForCurrentConfig();

		let ghostWpm = 0;
		if (OutplaySession.ghostMode === "custom") {
			ghostWpm = OutplaySession.customWpm;
		} else if (
			OutplaySession.ghostMode === "pb" &&
			record.sessionPB &&
			record.sessionPB.netWpm > 0
		) {
			const ref = record.sessionPB;
			const pt = ref.timeline?.find((t) => t.second === secondsElapsed);
			ghostWpm = pt ? pt.netWpm : ref.netWpm;
		} else if (OutplaySession.ghostMode === "last" && record.lastRun && record.lastRun.netWpm > 0) {
			const ref = record.lastRun;
			const pt = ref.timeline?.find((t) => t.second === secondsElapsed);
			ghostWpm = pt ? pt.netWpm : ref.netWpm;
		}

		OutplaySession.currentRun.timeline.push({
			second: secondsElapsed,
			netWpm,
			rawWpm,
			ghostWpm,
		});
	}, 1000);
}

// XỬ LÝ GHOST CARET: CHỈ HIỆN KHI ĐÃ CÓ DỮ LIỆU CỦA ĐÚNG CẤU HÌNH [KIỂU CHƠI + THỜI GIAN] ĐƯỢC CHỌN
function startGhostCaretRunner() {
	const ghostCaret = $("ghost-caret");
	if (!ghostCaret) return;

	let referenceTrace = null;
	let referenceWpm = 0;
	let constantPaceCharsPerMs = 0;
	const record = getOutplayRecordForCurrentConfig();

	if (OutplaySession.ghostMode === "custom") {
		constantPaceCharsPerMs = (OutplaySession.customWpm * 5) / 60000;
	} else if (OutplaySession.ghostMode === "pb") {
		// Chỉ khi có sessionPB và netWpm > 0 của đúng cấu hình hiện tại mới hiện bóng ma
		if (!record.sessionPB || !record.sessionPB.netWpm || record.sessionPB.netWpm <= 0) {
			ghostCaret.classList.add("hidden");
			return;
		}
		referenceTrace = record.sessionPB.keystrokeTrace || [];
		referenceWpm = record.sessionPB.netWpm;
	} else if (OutplaySession.ghostMode === "last") {
		// Chỉ khi có lastRun và netWpm > 0 của đúng cấu hình hiện tại mới hiện bóng ma
		if (!record.lastRun || !record.lastRun.netWpm || record.lastRun.netWpm <= 0) {
			ghostCaret.classList.add("hidden");
			return;
		}
		referenceTrace = record.lastRun.keystrokeTrace || [];
		referenceWpm = record.lastRun.netWpm;
	}

	if (
		OutplaySession.ghostMode !== "custom" &&
		(!referenceTrace || referenceTrace.length === 0) &&
		referenceWpm <= 0
	) {
		ghostCaret.classList.add("hidden");
		return;
	}

	ghostCaret.classList.remove("hidden");
	const ghostStartTime = performance.now();

	// Tính toán điểm chặn thời gian tối đa của ván cũ nếu có
	const maxTraceTimeMs =
		referenceTrace && referenceTrace.length > 0
			? referenceTrace[referenceTrace.length - 1].timeMs
			: 0;
	const maxTraceChars =
		referenceTrace && referenceTrace.length > 0
			? referenceTrace[referenceTrace.length - 1].charIndex
			: 0;
	const extrapolatedPaceCharsPerMs = (Math.max(20, referenceWpm) * 5) / 60000;

	function ghostFrame(now) {
		if (!isPlaying || !OutplaySession.isActive || !OutplaySession.hasStartedTyping) {
			ghostCaret.classList.add("hidden");
			return;
		}

		const elapsedMs = now - ghostStartTime;
		let targetCharIdx = 0;

		if (OutplaySession.ghostMode === "custom") {
			targetCharIdx = Math.floor(elapsedMs * constantPaceCharsPerMs);
		} else if (referenceTrace && referenceTrace.length > 0) {
			if (elapsedMs <= maxTraceTimeMs) {
				// Đang trong khoảng thời gian có dữ liệu chi tiết của lượt cũ
				for (let i = referenceTrace.length - 1; i >= 0; i--) {
					if (elapsedMs >= referenceTrace[i].timeMs) {
						targetCharIdx = referenceTrace[i].charIndex;
						break;
					}
				}
			} else {
				// Khi thời gian thi đấu hiện tại dài hơn thời gian ván cũ: tiếp tục chạy theo tốc độ WPM của ván cũ
				const extraMs = elapsedMs - maxTraceTimeMs;
				targetCharIdx = maxTraceChars + Math.floor(extraMs * extrapolatedPaceCharsPerMs);
			}
		} else {
			targetCharIdx = Math.floor(elapsedMs * extrapolatedPaceCharsPerMs);
		}

		positionGhostCaretAtGlobalChar(targetCharIdx);
		OutplaySession.ghostRafId = requestAnimationFrame(ghostFrame);
	}

	OutplaySession.ghostRafId = requestAnimationFrame(ghostFrame);
}

function stopGhostCaret() {
	if (OutplaySession.ghostRafId) {
		cancelAnimationFrame(OutplaySession.ghostRafId);
		OutplaySession.ghostRafId = null;
	}
	$("ghost-caret")?.classList.add("hidden");
}

function positionGhostCaretAtGlobalChar(globalCharIndex) {
	const ghostCaret = $("ghost-caret");
	const display = $("words-display");
	if (!ghostCaret || !display) return;

	let accumulated = 0;
	let targetWordEl = null;
	let targetLetterOffset = 0;

	for (let i = 0; i < currentWords.length; i++) {
		const wLen = currentWords[i].length + 1;
		if (globalCharIndex < accumulated + wLen) {
			targetWordEl = $(`word-${i}`);
			targetLetterOffset = globalCharIndex - accumulated;
			break;
		}
		accumulated += wLen;
	}

	if (!targetWordEl) return;

	const displayRect = display.getBoundingClientRect();
	const wordRect = targetWordEl.getBoundingClientRect();
	const letters = targetWordEl.querySelectorAll(".letter");

	let posX = 0;
	if (targetLetterOffset < letters.length) {
		const letterRect = letters[targetLetterOffset].getBoundingClientRect();
		posX = letterRect.left - displayRect.left;
	} else {
		posX = wordRect.right - displayRect.left;
	}
	const posY = wordRect.top - displayRect.top;

	ghostCaret.style.left = `${Math.round(posX)}px`;
	ghostCaret.style.top = `${Math.round(posY)}px`;
	ghostCaret.style.height = `${Math.round(wordRect.height || 36)}px`;
}

function commitOutplayRunToSession() {
	if (!OutplaySession.currentRun) return;

	const record = getOutplayRecordForCurrentConfig();
	const runData = { ...OutplaySession.currentRun };
	record.lastRun = runData;

	if (!record.sessionPB || runData.netWpm > record.sessionPB.netWpm) {
		record.sessionPB = runData;
	}
	updateOutplaySidebarStats();
}

function finishOutplayGame() {
	isPlaying = false;
	updateThemeFontButtonsState();
	stopGhostCaret();
	clearInterval(timerInterval);
	clearInterval(OutplaySession.liveSecondInterval);
	$("caret")?.classList.add("hidden");
	$("type-input").disabled = true;
	$("status-box").innerText = "HOÀN THÀNH";

	const totalSecs = OutplaySession.duration;
	const minutes = totalSecs / 60;
	const netWpm = Math.max(0, Math.round(correctChars / 5 / minutes));
	const rawWpm = Math.max(0, Math.round(rawCharsCount / 5 / minutes));
	const accuracy =
		rawCharsCount > 0 ? Math.max(0, Math.round((correctChars / rawCharsCount) * 100)) : 100;

	OutplaySession.currentRun.netWpm = netWpm;
	OutplaySession.currentRun.rawWpm = rawWpm;
	OutplaySession.currentRun.accuracy = accuracy;
	OutplaySession.currentRun.errors = totalErrors;

	commitOutplayRunToSession();
	showOutplaySummaryView();
}

function showOutplaySummaryView() {
	$("game-container")?.classList.add("hidden");
	$("summary-modal")?.classList.remove("hidden");

	$("multiplayer-summary-view")?.classList.add("hidden");
	$("outplay-summary-view")?.classList.remove("hidden");

	const res = OutplaySession.currentRun;
	const record = getOutplayRecordForCurrentConfig();

	if ($("outplay-res-wpm")) $("outplay-res-wpm").innerText = res.netWpm;
	if ($("outplay-res-raw")) $("outplay-res-raw").innerText = res.rawWpm;
	if ($("outplay-res-acc")) $("outplay-res-acc").innerText = `${res.accuracy}%`;
	if ($("outplay-res-errors")) $("outplay-res-errors").innerText = res.errors;

	const currentPbWpm = record.sessionPB
		? Math.max(record.sessionPB.netWpm, res.netWpm)
		: res.netWpm;
	if ($("outplay-res-pb")) $("outplay-res-pb").innerText = `${currentPbWpm} WPM`;

	$("summary-modal-title").innerText = "⚡ PHÂN TÍCH HIỆU SUẤT GÕ PHÍM";

	requestAnimationFrame(() => renderOutplayCanvasChart());
}

// ==========================================
// VẼ BIỂU ĐỒ MONKEYTYPE HIỆU NĂNG CAO
// ==========================================
function renderOutplayCanvasChart() {
	const canvas = $("outplay-chart-canvas");
	if (!canvas) return;

	const ctx = canvas.getContext("2d");
	const dpr = window.devicePixelRatio || 1;
	const rect = canvas.getBoundingClientRect();

	canvas.width = rect.width * dpr;
	canvas.height = rect.height * dpr;
	ctx.scale(dpr, dpr);

	const width = rect.width;
	const height = rect.height;
	ctx.clearRect(0, 0, width, height);

	const timeline = OutplaySession.currentRun.timeline || [];
	const errorMarkers = OutplaySession.currentRun.errorMarkers || [];
	const totalSeconds = OutplaySession.duration;

	let maxWpm = 60;
	timeline.forEach((t) => {
		if (t.netWpm > maxWpm) maxWpm = t.netWpm;
		if (t.rawWpm > maxWpm) maxWpm = t.rawWpm;
		if (t.ghostWpm > maxWpm) maxWpm = t.ghostWpm;
	});
	maxWpm = Math.ceil((maxWpm + 15) / 20) * 20;

	const padLeft = 45;
	const padRight = 25;
	const padTop = 20;
	const padBottom = 30;
	const plotW = width - padLeft - padRight;
	const plotH = height - padTop - padBottom;

	// 1. Lưới ngang & Nhãn trục Y
	ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
	ctx.lineWidth = 1;
	ctx.fillStyle = "rgba(160, 160, 160, 0.75)";
	ctx.font = "10.5px Lexend, sans-serif";
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";

	const gridSteps = 4;
	for (let i = 0; i <= gridSteps; i++) {
		const val = Math.round((maxWpm / gridSteps) * i);
		const y = padTop + plotH - (val / maxWpm) * plotH;
		ctx.beginPath();
		ctx.moveTo(padLeft, y);
		ctx.lineTo(width - padRight, y);
		ctx.stroke();
		ctx.fillText(val.toString(), padLeft - 8, y);
	}

	// 2. Trục X & Mốc thời gian
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	const timeSteps = totalSeconds <= 30 ? 5 : totalSeconds <= 60 ? 10 : 15;
	for (let s = 0; s <= totalSeconds; s += timeSteps) {
		const x = padLeft + (s / totalSeconds) * plotW;
		ctx.fillText(`${s}s`, x, height - padBottom + 8);
	}

	const getX = (sec) => padLeft + (sec / totalSeconds) * plotW;
	const getY = (wpm) => padTop + plotH - (Math.min(maxWpm, wpm) / maxWpm) * plotH;

	// 3. Đường Ghost Pace (Neon Cyan #00f0ff - Nét đứt rõ ràng)
	if (timeline.some((t) => t.ghostWpm > 0)) {
		ctx.save();
		ctx.strokeStyle = "#00f0ff";
		ctx.lineWidth = 2.4;
		ctx.setLineDash([6, 5]);
		ctx.shadowColor = "rgba(0, 240, 255, 0.45)";
		ctx.shadowBlur = 6;
		ctx.beginPath();
		timeline.forEach((t, idx) => {
			const x = getX(t.second);
			const y = getY(t.ghostWpm);
			if (idx === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.stroke();
		ctx.restore();
	}

	// 4. Đường Raw WPM (Xám nét mảnh)
	const subColor =
		getComputedStyle(document.documentElement).getPropertyValue("--sub-color").trim() || "#646669";
	ctx.strokeStyle = subColor;
	ctx.lineWidth = 1.6;
	ctx.beginPath();
	timeline.forEach((t, idx) => {
		const x = getX(t.second);
		const y = getY(t.rawWpm);
		if (idx === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});
	ctx.stroke();

	// 5. Đường Live WPM của Người chơi (Vàng rực rỡ nét đậm)
	const mainColor =
		getComputedStyle(document.documentElement).getPropertyValue("--main-color").trim() || "#e2b714";
	ctx.save();
	ctx.strokeStyle = mainColor;
	ctx.lineWidth = 3.2;
	ctx.lineJoin = "round";
	ctx.shadowColor = "rgba(226, 183, 20, 0.4)";
	ctx.shadowBlur = 8;
	ctx.beginPath();
	timeline.forEach((t, idx) => {
		const x = getX(t.second);
		const y = getY(t.netWpm);
		if (idx === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});
	ctx.stroke();
	ctx.restore();

	// Đổ bóng gradient mờ dưới đường Người chơi
	if (timeline.length > 0) {
		ctx.save();
		const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
		grad.addColorStop(0, "rgba(226, 183, 20, 0.22)");
		grad.addColorStop(1, "rgba(226, 183, 20, 0.0)");
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.moveTo(getX(timeline[0].second), getY(timeline[0].netWpm));
		timeline.forEach((t) => ctx.lineTo(getX(t.second), getY(t.netWpm)));
		ctx.lineTo(getX(timeline[timeline.length - 1].second), padTop + plotH);
		ctx.lineTo(getX(timeline[0].second), padTop + plotH);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	// 6. Điểm đánh dấu Lỗi Sai ❌
	const errColor =
		getComputedStyle(document.documentElement).getPropertyValue("--error-color").trim() ||
		"#ca4754";
	ctx.font = "bold 13px Inter, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	errorMarkers.forEach((sec) => {
		const x = getX(sec);
		const point = timeline.find((t) => t.second === sec);
		const y = point ? getY(point.netWpm) : padTop + plotH / 2;

		ctx.beginPath();
		ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
		ctx.fillStyle = "rgba(202, 71, 84, 0.25)";
		ctx.fill();
		ctx.strokeStyle = errColor;
		ctx.lineWidth = 1.4;
		ctx.stroke();

		ctx.fillStyle = errColor;
		ctx.fillText("✕", x, y - 10);
	});
}

// ==========================================
// KHỞI TẠO VÀ LẮNG NGHE SỰ KIỆN GIAO DIỆN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
	applyTheme(currentTheme);
	applyFont(currentFont);

	renderThemeSelector();
	renderFontSelector();

	myUsername =
		localStorage.getItem("racer_username") || `bot_${Math.floor(1000 + Math.random() * 9000)}`;
	localStorage.setItem("racer_username", myUsername);
	$("profile-name").innerText = myUsername;
	if ($("user-icon-status")) $("user-icon-status").innerText = mySelectedIcon;

	initBotWorker();
	setupEmojiPicker();
	setupBotModal();
	setupOutplayToolbarEvents();

	document.addEventListener("click", (e) => {
		const closeBtn = e.target.closest("[data-close]");
		if (closeBtn) {
			$(closeBtn.dataset.close)?.classList.add("hidden");
			if (closeBtn.dataset.close === "surrender-modal" && isPlaying) {
				$("type-input")?.focus();
			}
		}
	});

	$("typing-area")?.addEventListener("click", () => {
		if (isPlaying && $("type-input") && !$("type-input").disabled) {
			$("type-input").focus();
		}
	});

	$$(".mode-card").forEach((card) => {
		card.addEventListener("click", () => {
			$$(".mode-card").forEach((c) => c.classList.remove("selected"));
			card.classList.add("selected");
			currentLanguage = card.dataset.lang;
			if (currentLanguage === "numpad") {
				currentDifficulty = "number";
			} else {
				currentDifficulty = "normal";
			}

			const joinBtnText = $("join-btn")?.querySelector(".btn-text");
			if (joinBtnText) {
				joinBtnText.innerText =
					currentLanguage === "outplay" ? "👻 BẮT ĐẦU SOLO NGAY" : "🚀 VÀO PHÒNG CHỜ";
			}
		});
	});

	const openThemeModal = () => {
		if (!isPlaying) $("theme-select-popup")?.classList.remove("hidden");
	};
	const openFontModal = () => {
		if (!isPlaying) $("font-select-popup")?.classList.remove("hidden");
	};

	$("theme-select-btn")?.addEventListener("click", openThemeModal);
	$("font-select-btn")?.addEventListener("click", openFontModal);

	$("join-btn")?.addEventListener("click", () => {
		if (currentLanguage === "outplay") {
			startOutplaySoloDirect();
			return;
		}

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

	$("btn-open-icon-select")?.addEventListener("click", openIconSelect);

	$("btn-open-numpad-mode-select")?.addEventListener("click", () => {
		$$("#numpad-mode-popup .diff-card").forEach((c) => {
			c.classList.toggle("selected", c.dataset.numpadDiff === currentDifficulty);
		});
		$("numpad-mode-popup").classList.remove("hidden");
	});

	$$("#numpad-mode-popup .diff-card").forEach((card) => {
		card.addEventListener("click", () => {
			const diff = card.dataset.numpadDiff;
			currentDifficulty = diff;
			$$("#numpad-mode-popup .diff-card").forEach((c) => c.classList.remove("selected"));
			card.classList.add("selected");
			socket.emit("select_difficulty", { difficulty: diff });
			$("numpad-mode-popup").classList.add("hidden");
		});
	});

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

	$("btn-open-dc-difficulty-select")?.addEventListener("click", () => {
		$$("#dc-difficulty-popup .diff-card").forEach((c) => {
			c.classList.toggle("selected", c.dataset.dcDiff === currentDifficulty);
		});
		$("dc-difficulty-popup").classList.remove("hidden");
	});

	$$("#dc-difficulty-popup .diff-card").forEach((card) => {
		card.addEventListener("click", () => {
			const diff = card.dataset.dcDiff;
			currentDifficulty = diff;
			$$("#dc-difficulty-popup .diff-card").forEach((c) => c.classList.remove("selected"));
			card.classList.add("selected");
			socket.emit("select_difficulty", { difficulty: diff });
			$("dc-difficulty-popup").classList.add("hidden");
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

	// NÚT RESET CHỈ CHỨA ICON: ĐỔI TỪ MỚI MÀ KHÔNG ẢNH HƯỞNG TỚI TỐC ĐỘ ĐÃ LƯU
	$("btn-quick-restart")?.addEventListener("click", () => {
		if (OutplaySession.isActive) {
			initOutplayRound(false); // Sinh từ mới, giữ nguyên sessionPB và lastRun
		} else if (isPlaying) {
			surrenderGame(false);
		}
	});

	// NÚT ĐẦU HÀNG TRÊN HEADER
	$("btn-surrender")?.addEventListener("click", () => {
		if (isPlaying) {
			$("surrender-modal-desc").innerText = OutplaySession.isActive
				? "Bạn muốn làm lại màn chơi này? Tốc độ ván vừa qua sẽ được đặt về 0."
				: "Bạn có chắc chắn muốn bỏ cuộc và nhường phần thắng cho đối thủ?";
			$("surrender-modal").classList.remove("hidden");
		}
	});

	$("btn-confirm-surrender")?.addEventListener("click", () => {
		$("surrender-modal").classList.add("hidden");
		surrenderGame();
	});

	$("btn-cancel-surrender")?.addEventListener("click", () => {
		$("surrender-modal").classList.add("hidden");
		if (isPlaying) $("type-input")?.focus();
	});

	const returnHome = () => {
		socket.emit("leave_lobby");
		isPlaying = false;
		OutplaySession.isActive = false;
		stopGhostCaret();
		clearInterval(OutplaySession.liveSecondInterval);

		updateThemeFontButtonsState();
		currentDifficulty = "normal";
		mySelectedIcon = DEFAULT_ICON;
		clearAllBossSkillEffects();
		$("caret")?.classList.add("hidden");
		$("ghost-caret")?.classList.add("hidden");
		$("outplay-stats-sidebar")?.classList.add("hidden");

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
		isPlaying = false;
		updateThemeFontButtonsState();
		clearAllBossSkillEffects();
		$("caret")?.classList.add("hidden");
		$("ghost-caret")?.classList.add("hidden");
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
		triggerCaretTypingState();

		if (OutplaySession.isActive && !OutplaySession.hasStartedTyping) {
			triggerOutplayFirstKeystroke();
		}

		if (currentLanguage === "doan_chu" && e.key === "Enter") {
			handleDoanChuSubmit();
			return;
		}

		const isCurrentNumpad =
			currentLanguage === "numpad" ||
			(OutplaySession.isActive && OutplaySession.mode.startsWith("numpad"));
		if (isCurrentNumpad && (e.key === "Enter" || e.code === "NumpadEnter")) {
			e.preventDefault();
			typeInput.value += " ";
			typeInput.dispatchEvent(new Event("input", { bubbles: true }));
			return;
		}

		if (e.key === "Backspace") {
			if (currentLanguage === "san_boss" && isPlaying) {
				bossBackspaceCount++;
				if (bossBackspaceCount >= 10) {
					resetBossCombo("Xóa từ 10 lần");
				} else {
					updateBossComboUI();
				}
			}
		}
	});

	window.addEventListener("resize", () => {
		if (isPlaying) updateCaretPosition(true);
	});

	setupChatHandling();
	setupAdminEvents();

	// ==========================================================
	// BẮT PHÍM TẮT TOÀN CỤC:
	// ESC ĐẦU HÀNG; PHÍM TAB CHỈ FOCUS LẠI INPUT (KHÔNG LÀM ĐỔI TỪ)
	// ==========================================================
	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			const surrenderModal = $("surrender-modal");
			if (isPlaying && surrenderModal) {
				e.preventDefault();
				if (surrenderModal.classList.contains("hidden")) {
					$("surrender-modal-desc").innerText = OutplaySession.isActive
						? "Bạn muốn làm lại màn chơi này? Tốc độ ván vừa qua sẽ được đặt về 0."
						: "Bạn có chắc chắn muốn bỏ cuộc và nhường phần thắng cho đối thủ?";
					surrenderModal.classList.remove("hidden");
				} else {
					surrenderModal.classList.add("hidden");
					$("type-input")?.focus();
				}
				return;
			}
		}

		// KHI MẤT FOCUS VÀO INPUT: NHẤN TAB CHỈ CHUYỂN FOCUS LẠI VÀO INPUT, TUYỆT ĐỐI KHÔNG ĐỔI TỪ
		if (e.key === "Tab") {
			if (isPlaying && $("game-container") && !$("game-container").classList.contains("hidden")) {
				e.preventDefault();
				const input = $("type-input");
				if (input && !input.disabled) {
					input.focus();
				}
				return;
			}
		}

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

		const isFullsize = $("cfg-boss-num-mode-switch")
			? $("cfg-boss-num-mode-switch").checked
			: false;
		diff.numMode = isFullsize ? "fullsize" : "number";

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
		if ($("cfg-diff-smoke-dur"))
			diff.smokeDuration = parseFloat($("cfg-diff-smoke-dur").value) || 4;
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
		diff.enabledSkills.smoke = $("cfg-skill-enable-smoke")
			? $("cfg-skill-enable-smoke").checked
			: true;
		diff.enabledSkills.reverse = $("cfg-skill-enable-reverse")
			? $("cfg-skill-enable-reverse").checked
			: false;

		if ($("cfg-skill-weight-shield"))
			diff.skillWeights.shield = parseInt($("cfg-skill-weight-shield").value) || 0;
		if ($("cfg-skill-weight-capslock"))
			diff.skillWeights.capslock = parseInt($("cfg-skill-weight-capslock").value) || 0;
		if ($("cfg-skill-weight-shake"))
			diff.skillWeights.shake = parseInt($("cfg-skill-weight-shake").value) || 0;
		if ($("cfg-skill-weight-smoke"))
			diff.skillWeights.smoke = parseInt($("cfg-skill-weight-smoke").value) || 0;
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

	if (tempAdminDcDifficulties[selectedConfigDcDiffKey]) {
		const dc = tempAdminDcDifficulties[selectedConfigDcDiffKey];
		if ($("cfg-dc-round-dur")) dc.roundDuration = parseFloat($("cfg-dc-round-dur").value) || 18;
		if ($("cfg-dc-reveal-interval"))
			dc.revealInterval = parseFloat($("cfg-dc-reveal-interval").value) || 1.2;
		if ($("cfg-dc-inter-dur"))
			dc.intermissionDuration = parseFloat($("cfg-dc-inter-dur").value) || 3;
		if ($("cfg-dc-total-rounds")) dc.totalRounds = parseInt($("cfg-dc-total-rounds").value) || 10;

		if ($("cfg-dc-ratio-vi-dau"))
			dc.ratioViDau = isNaN(parseInt($("cfg-dc-ratio-vi-dau").value))
				? 0
				: parseInt($("cfg-dc-ratio-vi-dau").value);
		if ($("cfg-dc-ratio-vi-nodau"))
			dc.ratioViNoDau = isNaN(parseInt($("cfg-dc-ratio-vi-nodau").value))
				? 0
				: parseInt($("cfg-dc-ratio-vi-nodau").value);
		if ($("cfg-dc-ratio-en"))
			dc.ratioEn = isNaN(parseInt($("cfg-dc-ratio-en").value))
				? 0
				: parseInt($("cfg-dc-ratio-en").value);
	}
}

function updateBossToggleLabelsUI(isFullsize) {
	const labelNumber = $("cfg-boss-num-label-number");
	const labelFullsize = $("cfg-boss-num-label-fullsize");
	if (labelNumber) labelNumber.classList.toggle("active", !isFullsize);
	if (labelFullsize) labelFullsize.classList.toggle("active", isFullsize);
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
		if ($("cfg-boss-ratio-num")) $("cfg-boss-ratio-num").value = diff.ratioNum ?? 35;

		const isFullsize = diff.numMode === "fullsize";
		if ($("cfg-boss-num-mode-switch")) $("cfg-boss-num-mode-switch").checked = isFullsize;
		updateBossToggleLabelsUI(isFullsize);

		if ($("cfg-boss-hard-vi-dau")) $("cfg-boss-hard-vi-dau").value = diff.hardViDauRate ?? 35;
		if ($("cfg-boss-hard-vi-nodau")) $("cfg-boss-hard-vi-nodau").value = diff.hardViNoDauRate ?? 35;
		if ($("cfg-boss-hard-en")) $("cfg-boss-hard-en").value = diff.hardEnRate ?? 35;

		if ($("cfg-diff-shield-per-player"))
			$("cfg-diff-shield-per-player").value = diff.shieldBasePerPlayer;
		if ($("cfg-diff-shield-dur")) $("cfg-diff-shield-dur").value = diff.shieldDuration;
		if ($("cfg-diff-stun-dur")) $("cfg-diff-stun-dur").value = diff.stunDuration;

		if ($("cfg-diff-capslock-dur")) $("cfg-diff-capslock-dur").value = diff.capslockDuration || 6;
		if ($("cfg-diff-shake-dur")) $("cfg-diff-shake-dur").value = diff.shakeDuration || 5;
		if ($("cfg-diff-smoke-dur")) $("cfg-diff-smoke-dur").value = diff.smokeDuration || 4;
		if ($("cfg-diff-reverse-dur")) $("cfg-diff-reverse-dur").value = diff.reverseDuration || 5;

		const sk = diff.enabledSkills || {};
		if ($("cfg-skill-enable-shield")) $("cfg-skill-enable-shield").checked = sk.shield ?? true;
		if ($("cfg-skill-enable-capslock"))
			$("cfg-skill-enable-capslock").checked = sk.capslock ?? false;
		if ($("cfg-skill-enable-shake")) $("cfg-skill-enable-shake").checked = sk.shake ?? true;
		if ($("cfg-skill-enable-smoke")) $("cfg-skill-enable-smoke").checked = sk.smoke ?? true;
		if ($("cfg-skill-enable-reverse")) $("cfg-skill-enable-reverse").checked = sk.reverse ?? false;

		const sw = diff.skillWeights || {};
		if ($("cfg-skill-weight-shield")) $("cfg-skill-weight-shield").value = sw.shield ?? 35;
		if ($("cfg-skill-weight-capslock")) $("cfg-skill-weight-capslock").value = sw.capslock ?? 25;
		if ($("cfg-skill-weight-shake")) $("cfg-skill-weight-shake").value = sw.shake ?? 20;
		if ($("cfg-skill-weight-smoke")) $("cfg-skill-weight-smoke").value = sw.smoke ?? 20;
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

	const dc = tempAdminDcDifficulties[selectedConfigDcDiffKey];
	if (dc) {
		const metaDc = difficultyMeta[selectedConfigDcDiffKey] || difficultyMeta.normal;
		if ($("cfg-dc-diff-active-title")) {
			$("cfg-dc-diff-active-title").innerText = `⚙️ THÔNG SỐ ĐỘ KHÓ: ${metaDc.name.toUpperCase()}`;
			$("cfg-dc-diff-active-title").style.color = metaDc.color;
		}

		if ($("cfg-dc-round-dur")) $("cfg-dc-round-dur").value = dc.roundDuration;
		if ($("cfg-dc-reveal-interval")) $("cfg-dc-reveal-interval").value = dc.revealInterval;
		if ($("cfg-dc-inter-dur")) $("cfg-dc-inter-dur").value = dc.intermissionDuration;
		if ($("cfg-dc-total-rounds")) dc.totalRounds = parseInt($("cfg-dc-total-rounds").value) || 10;

		if ($("cfg-dc-ratio-vi-dau"))
			dc.ratioViDau = isNaN(parseInt($("cfg-dc-ratio-vi-dau").value))
				? 0
				: parseInt($("cfg-dc-ratio-vi-dau").value);
		if ($("cfg-dc-ratio-vi-nodau"))
			dc.ratioViNoDau = isNaN(parseInt($("cfg-dc-ratio-vi-nodau").value))
				? 0
				: parseInt($("cfg-dc-ratio-vi-nodau").value);
		if ($("cfg-dc-ratio-en"))
			dc.ratioEn = isNaN(parseInt($("cfg-dc-ratio-en").value))
				? 0
				: parseInt($("cfg-dc-ratio-en").value);
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

	if (clientGameConfig.doanChu && clientGameConfig.doanChu.difficulties) {
		tempAdminDcDifficulties = JSON.parse(JSON.stringify(clientGameConfig.doanChu.difficulties));
	}

	if ($("cfg-boss-diff-select"))
		selectedConfigDiffKey = $("cfg-boss-diff-select").value || "normal";
	if ($("cfg-nh-diff-select")) selectedConfigNhDiffKey = $("cfg-nh-diff-select").value || "normal";
	if ($("cfg-dc-diff-select")) selectedConfigDcDiffKey = $("cfg-dc-diff-select").value || "normal";
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
			titleEl.style.color = "var(--main-color)";
		}
		if (descEl)
			descEl.innerText = message || "Tất cả thông số và tỷ lệ từ vựng trận đấu đã được lưu.";
	} else {
		if (iconEl) iconEl.innerText = "❌";
		if (titleEl) {
			titleEl.innerText = "LỖI LƯU CÀI ĐẶT";
			titleEl.style.color = "var(--error-color)";
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

	$("cfg-dc-diff-select")?.addEventListener("change", (e) => {
		saveActiveDiffInputsToState();
		selectedConfigDcDiffKey = e.target.value;
		updateSelectedDiffInputsFromState();
	});

	$("cfg-boss-num-mode-switch")?.addEventListener("change", (e) => {
		updateBossToggleLabelsUI(e.target.checked);
		saveActiveDiffInputsToState();
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
		"cfg-diff-smoke-dur",
		"cfg-diff-reverse-dur",
		"cfg-skill-enable-shield",
		"cfg-skill-enable-capslock",
		"cfg-skill-enable-shake",
		"cfg-skill-enable-smoke",
		"cfg-skill-enable-reverse",
		"cfg-skill-weight-shield",
		"cfg-skill-weight-capslock",
		"cfg-skill-weight-shake",
		"cfg-skill-weight-smoke",
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
		"cfg-dc-round-dur",
		"cfg-dc-reveal-interval",
		"cfg-dc-inter-dur",
		"cfg-dc-total-rounds",
		"cfg-dc-ratio-vi-dau",
		"cfg-dc-ratio-vi-nodau",
		"cfg-dc-ratio-en",
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
			doanChu: { difficulties: tempAdminDcDifficulties },
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
			<td style="font-size: 11px; color: var(--sub-color); font-family: monospace;">${u.id}</td>
			<td><span class="status-tag ${u.isBanned ? "status-surrendered" : "status-online"}">${u.isBanned ? "Đang Ban" : "Online"}</span></td>
			<td>${
				u.isAdmin || u.id === socket.id
					? `<span style="color: var(--sub-color); font-size: 11px; font-weight: bold;">(${u.id === socket.id ? "Bạn" : "Admin"})</span>`
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
			? `<tr><td colspan="3" style="color: var(--sub-color); padding: 16px;">Không có ai bị ban</td></tr>`
			: adminBannedUsers
					.map((b) => {
						const rem = Math.max(0, Math.ceil((b.expiresAt - now) / 1000));
						return `
			<tr>
				<td style="font-weight: 700;">${b.username} <span style="font-size: 11px; color: var(--sub-color);">(${b.id})</span></td>
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
// GAMEPLAY MULTIPLAYER ENGINE
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
	const isDoanChu = currentLang === "doan_chu";
	const isSanBoss = currentLang === "san_boss";
	const isNumpad = currentLang === "numpad";

	$("lobby-count").innerText = `${currentLobbyPlayers.length}/10`;
	$("lobby-mode-display").innerText = `CHẾ ĐỘ: ${modeNames[currentLang]}`;

	$("btn-open-numpad-mode-select")?.classList.toggle("hidden", !isNumpad);
	$("btn-open-nh-difficulty-select")?.classList.toggle("hidden", !isNgauHung);
	$("btn-open-dc-difficulty-select")?.classList.toggle("hidden", !isDoanChu);
	$("btn-open-boss-difficulty-select")?.classList.toggle("hidden", !isSanBoss);

	const diffTag = $("lobby-difficulty-tag");
	if (diffTag) {
		const isDiffMode = isNgauHung || isDoanChu || isSanBoss || isNumpad;
		diffTag.classList.toggle("hidden", !isDiffMode);
		if (isDiffMode) {
			const meta =
				difficultyMeta[currentDifficulty] ||
				(isNumpad ? difficultyMeta.number : difficultyMeta.normal);
			diffTag.innerText = isNumpad ? `KIỂU: ${meta.name}` : `ĐỘ KHÓ: ${meta.name}`;
			diffTag.setAttribute("data-diff", currentDifficulty);
			diffTag.style.borderColor = meta.color;
			diffTag.style.color = meta.color;
		}
	}

	$$("#numpad-mode-popup .diff-card").forEach((c) => {
		c.classList.toggle("selected", c.dataset.numpadDiff === currentDifficulty);
	});
	$$("#nh-difficulty-popup .diff-card").forEach((c) => {
		c.classList.toggle("selected", c.dataset.nhDiff === currentDifficulty);
	});
	$$("#dc-difficulty-popup .diff-card").forEach((c) => {
		c.classList.toggle("selected", c.dataset.dcDiff === currentDifficulty);
	});
	$$("#boss-difficulty-popup .diff-card").forEach((c) => {
		c.classList.toggle("selected", c.dataset.bossDiff === currentDifficulty);
	});

	renderLobbyPlayers();
	updateThemeFontButtonsState();
});

socket.on("game_start", (data) => {
	OutplaySession.isActive = false;
	["lobby-screen", "summary-modal"].forEach((id) => $(id).classList.add("hidden"));
	["game-container", "chat-container", "leaderboard"].forEach((id) =>
		$(id).classList.remove("hidden"),
	);
	$("outplay-hud-toolbar")?.classList.add("hidden");
	$("outplay-stats-sidebar")?.classList.add("hidden");
	$("ghost-caret")?.classList.add("hidden");

	clearAllBossSkillEffects();

	currentLanguage = data.language || currentLanguage;
	currentDifficulty = data.difficulty || currentDifficulty;
	currentWords = data.words || [];
	wordIndex = correctChars = totalErrors = rawCharsCount = 0;
	isPlaying = true;
	updateThemeFontButtonsState();

	currentViewportOffsetY = 0;
	firstLineOffsetTop = 0;
	lastCaretWordTop = null;

	bossComboCount = 0;
	bossFractionalDamageBuffer = 0.0;
	bossBackspaceCount = 0;
	isBossCapsLockActive = false;
	updateBossComboUI();

	const isNgauHung = currentLanguage === "ngau_hung";
	const isDoanChu = currentLanguage === "doan_chu";
	const isNumpad = currentLanguage === "numpad";
	const isBoss = currentLanguage === "san_boss";

	$("ngau-hung-status")?.classList.toggle("hidden", !isNgauHung);
	$("ngau-hung-diff-badge")?.classList.toggle("hidden", !isNgauHung);
	$("doan-chu-status")?.classList.toggle("hidden", !isDoanChu);
	$("boss-arena-box")?.classList.toggle("hidden", !isBoss);

	$("race-tracks-title").innerText = isNgauHung
		? "BẢNG ĐIỂM NGẪU HỨNG"
		: isDoanChu
			? "BẢNG ĐIỂM ĐOÁN CHỮ"
			: isBoss
				? "SÁT THƯƠNG DIỆT BOSS"
				: "TIẾN ĐỘ HOÀN THÀNH";

	$("words-display").classList.toggle("ngau-hung-mode-display", isNgauHung);
	$("words-display").classList.toggle("doan-chu-mode-display", isDoanChu);
	$("words-display").classList.toggle("numpad-mode-display", isNumpad);
	$("words-display").style.transform = "translate3d(0, 0, 0)";

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
			`<span class="word" style="color: var(--main-color);"><span class="letter">Chuẩn bị...</span></span>`;
		$("caret")?.classList.add("hidden");
	} else if (isDoanChu) {
		$("doan-chu-round-text").innerText = "VÒNG 1/10";
		$("doan-chu-hint-badge").innerText = "💡 GỢI Ý: Chuẩn bị...";
		$("doan-chu-hidden-count").innerText = "KÝ TỰ ẨN: --";
		$("words-display").innerHTML =
			`<span class="word" style="color: var(--main-color);"><span class="letter">Chuẩn bị đoán chữ...</span></span>`;
		$("caret")?.classList.add("hidden");
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
			updateThemeFontButtonsState();
			startTime = Date.now();
			resetAFKTimer();
			$("status-box").innerText = "ĐANG THI ĐẤU";

			if (currentLanguage !== "ngau_hung" && currentLanguage !== "doan_chu") {
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
						: currentLanguage === "numpad"
							? "Nhập số rồi bấm Space hoặc Enter..."
							: "Gõ chữ vào đây...";
				$("type-input").focus();

				requestAnimationFrame(() => {
					updateCaretPosition(true);
				});

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

// ==========================================
// ĐOÁN CHỮ (MYSTERY WORD) CLIENT LOGIC
// ==========================================
socket.on("doan_chu_new_round", (d) => {
	doanChuHasSubmittedThisRound = false;
	doanChuCurrentRound = d.round;
	doanChuTotalTiles = d.length;
	isPlaying = true;
	updateThemeFontButtonsState();
	$("caret")?.classList.add("hidden");

	if (d.difficulty) currentDifficulty = d.difficulty;
	$("doan-chu-round-text").innerText = `VÒNG ${d.round}/${d.totalRounds}`;
	$("doan-chu-hint-badge").innerText = `💡 GỢI Ý: ${d.hint || "Không có gợi ý"}`;

	const nonSpaceCount = d.length - (d.spaceIndices ? d.spaceIndices.length : 0);
	$("doan-chu-hidden-count").innerText = `KÝ TỰ ẨN: ${nonSpaceCount}`;

	const wd = $("words-display");
	wd.innerHTML = "";

	let currentGroup = document.createElement("div");
	currentGroup.className = "doan-chu-word-group";

	for (let i = 0; i < d.length; i++) {
		if (d.spaceIndices && d.spaceIndices.includes(i)) {
			wd.appendChild(currentGroup);
			currentGroup = document.createElement("div");
			currentGroup.className = "doan-chu-word-group";
		} else {
			const tile = document.createElement("div");
			tile.id = `dc-tile-${i}`;
			tile.className = "mystery-tile tile-hidden";
			tile.innerText = "";
			currentGroup.appendChild(tile);
		}
	}
	if (currentGroup.children.length > 0) wd.appendChild(currentGroup);

	const input = $("type-input");
	input.value = "";
	input.disabled = false;
	input.placeholder = "Nhập dự đoán rồi nhấn Enter...";
	input.classList.remove("input-penalty-shake");
	input.focus();

	let timeLeft = d.duration;
	$("timer").innerText = timeLeft;
	clearInterval(doanChuRoundTimer);
	doanChuRoundTimer = setInterval(() => {
		timeLeft = Math.max(0, timeLeft - 1);
		$("timer").innerText = timeLeft;
		if (timeLeft <= 0) clearInterval(doanChuRoundTimer);
	}, 1000);
});

socket.on("doan_chu_reveal_char", (d) => {
	const tile = $(`dc-tile-${d.charIndex}`);
	if (tile && tile.classList.contains("tile-hidden")) {
		tile.className = "mystery-tile tile-revealed";
		tile.innerText = d.char.toUpperCase();
	}
	if (typeof d.remainingHiddenCount === "number") {
		$("doan-chu-hidden-count").innerText = `KÝ TỰ ẨN: ${d.remainingHiddenCount}`;
	}
});

socket.on("doan_chu_player_success", (d) => {
	doanChuHasSubmittedThisRound = true;
	const input = $("type-input");
	input.disabled = true;
	input.placeholder = `🎉 ĐOÁN ĐÚNG! Hạng ${d.rank} (+${d.totalPoints}đ)`;

	if (d.targetWord) {
		for (let i = 0; i < d.targetWord.length; i++) {
			if (d.targetWord[i] !== " ") {
				const tile = $(`dc-tile-${i}`);
				if (tile) {
					tile.className = "mystery-tile tile-revealed";
					tile.innerText = d.targetWord[i].toUpperCase();
				}
			}
		}
	}
});

socket.on("doan_chu_guess_failed", (d) => {
	totalErrors = d.errors || totalErrors + 1;
	const input = $("type-input");
	input.classList.add("input-penalty-shake");
	input.disabled = true;
	isInputPenaltyLocked = true;
	input.placeholder = "❌ Đoán sai! Khóa 1s...";

	setTimeout(
		() => {
			input.classList.remove("input-penalty-shake");
			if (!doanChuHasSubmittedThisRound && isPlaying) {
				input.disabled = false;
				input.placeholder = "Nhập dự đoán rồi nhấn Enter...";
				input.focus();
			}
			isInputPenaltyLocked = false;
		},
		(d.penaltySeconds || 1.0) * 1000,
	);
});

socket.on("doan_chu_round_ended", (d) => {
	clearInterval(doanChuRoundTimer);
	const input = $("type-input");
	input.disabled = true;

	if (d.targetWord) {
		for (let i = 0; i < d.targetWord.length; i++) {
			if (d.targetWord[i] !== " ") {
				const tile = $(`dc-tile-${i}`);
				if (tile) {
					tile.className = "mystery-tile tile-revealed";
					tile.innerText = d.targetWord[i].toUpperCase();
				}
			}
		}
	}

	if (!doanChuHasSubmittedThisRound) {
		input.placeholder = `Hết giờ! Đáp án: ${d.targetWord}`;
	}
});

socket.on("doan_chu_intermission", (d) => {
	let t = d.duration;
	$("timer").innerText = t;
	$("doan-chu-hint-badge").innerText = `💡 Vòng kế tiếp sau ${t}s...`;
	const it = setInterval(() => {
		if (--t > 0) $("doan-chu-hint-badge").innerText = `💡 Vòng kế tiếp sau ${t}s...`;
		else clearInterval(it);
	}, 1000);
});

function handleDoanChuSubmit() {
	if (!isPlaying || doanChuHasSubmittedThisRound || isInputPenaltyLocked) return;
	const input = $("type-input");
	const val = input.value.trim();
	if (val) {
		socket.emit("doan_chu_submit_guess", { guess: val });
		input.value = "";
	}
}

// ==========================================
// BOSS RAID & NGẪU HỨNG SOCKET LISTENERS
// ==========================================
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
			: d.skill === "smoke"
				? "💣💨 BOSS CHUẨN BỊ NÉM BOM KHÓI MÙ (SMOKE BOMB)!"
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
	const smokeLayer = $("boss-smoke-layer");
	const alertBox = $("boss-skill-alert");

	if (alertBox) {
		const skillName =
			d.skill === "smoke" ? "💣💨 BOM KHÓI MÙ (DENSE SMOKE BOMB)" : d.skill.toUpperCase();
		alertBox.innerText = `🔥 BOSS ĐANG KÍCH HOẠT KỸ NĂNG: ${skillName}!`;
		alertBox.classList.remove("hidden");
	}

	if (d.skill === "shake" && gameContainer) gameContainer.classList.add("boss-shake-active");
	if (d.skill === "reverse" && wordsDisplay) wordsDisplay.classList.add("boss-reverse-active");

	if (d.skill === "smoke" && smokeLayer && wordsDisplay) {
		const dur = d.duration || 4;
		smokeLayer.style.setProperty("--smoke-duration", `${dur}s`);
		wordsDisplay.style.setProperty("--smoke-duration", `${dur}s`);

		smokeLayer.classList.remove("hidden", "active");
		wordsDisplay.classList.remove("smoke-blurred");
		void smokeLayer.offsetWidth;
		void wordsDisplay.offsetWidth;

		smokeLayer.classList.remove("hidden");
		smokeLayer.classList.add("active");
		wordsDisplay.classList.add("smoke-blurred");

		clearTimeout(smokeClearTimeout);
		smokeClearTimeout = setTimeout(() => {
			smokeLayer.classList.remove("active");
			smokeLayer.classList.add("hidden");
			wordsDisplay.classList.remove("smoke-blurred");
		}, dur * 1000);
	}

	setTimeout(
		() => {
			if (d.skill === "shake" && gameContainer) gameContainer.classList.remove("boss-shake-active");
			if (d.skill === "reverse" && wordsDisplay)
				wordsDisplay.classList.remove("boss-reverse-active");
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
	updateThemeFontButtonsState();
	$("caret")?.classList.add("hidden");

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

	const lettersHTML = d.targetWord
		.split("")
		.map((c) => `<span class="letter">${c}</span>`)
		.join("");
	$("words-display").innerHTML =
		`<div id="ngau-hung-word" class="word current">${lettersHTML}</div>`;

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
	const wordEl = $("ngau-hung-word");
	if (wordEl) {
		wordEl.querySelectorAll(".letter").forEach((l) => (l.className = "letter correct"));
	}
});

socket.on("ngau_hung_round_ended", () => {
	clearInterval(ngauHungRoundTimer);
	$("type-input").disabled = true;
	if (!ngauHungHasSubmittedThisRound) {
		$("type-input").placeholder = "Hết thời gian!";
		const wordEl = $("ngau-hung-word");
		if (wordEl) {
			wordEl.querySelectorAll(".letter").forEach((l) => (l.className = "letter incorrect"));
		}
	}
});

socket.on("ngau_hung_intermission", (d) => {
	let t = d.duration;
	$("timer").innerText = t;
	$("words-display").innerHTML =
		`<span class="word" style="color: var(--main-color);"><span class="letter">Vòng kế tiếp sau ${t}s...</span></span>`;
	const it = setInterval(() => {
		if (--t > 0)
			$("words-display").innerHTML =
				`<span class="word" style="color: var(--main-color);"><span class="letter">Vòng kế tiếp sau ${t}s...</span></span>`;
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
	if (!wd) return;

	wd.innerHTML =
		`<div id="caret" class="custom-caret hidden"></div>` +
		`<div id="ghost-caret" class="ghost-caret hidden"></div>` +
		currentWords
			.map((w, idx) => {
				const wordText = getRenderedWord(w, idx);
				const lettersHtml = wordText
					.split("")
					.map((char) => `<span class="letter">${char}</span>`)
					.join("");
				return `<div class="word" id="word-${idx}">${lettersHtml}</div>`;
			})
			.join("");

	for (let i = 0; i < wordIndex; i++) {
		const wEl = $(`word-${i}`);
		if (wEl) {
			wEl.querySelectorAll(".letter").forEach((l) => (l.className = "letter correct"));
		}
	}

	requestAnimationFrame(() => {
		updateCaretPosition(true);
	});
}

function handleTypingInput() {
	if (!isPlaying) return;
	const input = $("type-input");
	let val = input.value;

	triggerCaretTypingState();

	if (currentLanguage === "doan_chu") return;

	if (currentLanguage === "ngau_hung") {
		if (ngauHungHasSubmittedThisRound) return (input.value = "");
		const wordEl = $("ngau-hung-word");

		if (val.length > ngauHungTargetWord.length && !val.endsWith(" ")) {
			input.value = val.slice(0, ngauHungTargetWord.length);
			if (wordEl) {
				wordEl.classList.remove("shake-overflow");
				void wordEl.offsetWidth;
				wordEl.classList.add("shake-overflow");
			}
			return;
		}

		if (val.endsWith(" ")) {
			const typed = val.trim();
			input.value = "";
			if (typed === ngauHungTargetWord) {
				ngauHungHasSubmittedThisRound = true;
				socket.emit("submit_ngau_hung_word", { word: typed, errors: totalErrors });
				if (wordEl) {
					wordEl.querySelectorAll(".letter").forEach((l) => (l.className = "letter correct"));
				}
			} else {
				totalErrors++;
				socket.emit("update_progress", {
					wpm: 0,
					correctChars,
					errors: totalErrors,
				});
			}
			return;
		}

		if (wordEl) {
			const letters = wordEl.querySelectorAll(".letter");
			letters.forEach((l, i) => {
				if (i < val.length) {
					l.className = `letter ${val[i] === ngauHungTargetWord[i] ? "correct" : "incorrect"}`;
				} else {
					l.className = "letter";
				}
			});
		}
		return;
	}

	const baseTarget = currentWords[wordIndex];
	const target = getRenderedWord(baseTarget, wordIndex);
	const currentWordEl = $(`word-${wordIndex}`);

	if (currentWordEl && currentWordEl.classList.contains("error-word") && val.length > 0) {
		currentWordEl.classList.remove("error-word");
	}

	if (val.length > target.length && !val.endsWith(" ")) {
		input.value = val.slice(0, target.length);
		val = input.value;
		if (currentWordEl) {
			currentWordEl.classList.remove("shake-overflow");
			void currentWordEl.offsetWidth;
			currentWordEl.classList.add("shake-overflow");
		}
	}

	if (val.endsWith(" ")) {
		const typedWord = val.slice(0, -1);

		if (typedWord === target) {
			input.value = "";
			const wordLength = target.length + 1;
			correctChars += wordLength;
			rawCharsCount += wordLength;

			if (OutplaySession.isActive && OutplaySession.hasStartedTyping) {
				OutplaySession.currentRun.keystrokeTrace.push({
					timeMs: Date.now() - startTime,
					charIndex: correctChars,
				});
			}

			if (currentWordEl) {
				currentWordEl.classList.remove("error-word");
				currentWordEl.querySelectorAll(".letter").forEach((l) => (l.className = "letter correct"));
			}
			wordIndex++;

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

			if (wordIndex >= currentWords.length) {
				return OutplaySession.isActive ? finishOutplayGame() : finishGame();
			}

			updateCaretPosition();
		} else {
			totalErrors++;
			rawCharsCount += val.length;
			input.value = "";
			input.focus();

			if (OutplaySession.isActive && OutplaySession.hasStartedTyping) {
				const currentSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
				if (!OutplaySession.currentRun.errorMarkers.includes(currentSec)) {
					OutplaySession.currentRun.errorMarkers.push(currentSec);
				}
			}

			if (currentWordEl) {
				currentWordEl.classList.add("error-word");
				currentWordEl.querySelectorAll(".letter").forEach((l) => (l.className = "letter"));
			}

			if (currentLanguage === "san_boss") {
				resetBossCombo("Gõ sai từ");
				socket.emit("deal_boss_damage", { damage: 0, errors: totalErrors });
			}

			updateCaretPosition();
		}
	} else if (currentWordEl) {
		const letters = currentWordEl.querySelectorAll(".letter:not(.extra)");

		letters.forEach((l, i) => {
			if (i < val.length) {
				if (val[i] === target[i]) {
					l.className = "letter correct";
				} else {
					l.className = "letter incorrect";
				}
			} else {
				l.className = "letter";
			}
		});

		updateCaretPosition();
	}

	if (currentLanguage !== "san_boss" && !OutplaySession.isActive) {
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
	updateThemeFontButtonsState();
	clearTimeout(afkTimer);
	clearInterval(timerInterval);
	clearAllBossSkillEffects();
	$("caret")?.classList.add("hidden");

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
	clearTimeout(afkTimer);
	clearInterval(timerInterval);
	clearInterval(ngauHungRoundTimer);
	clearInterval(doanChuRoundTimer);
	clearAllBossSkillEffects();
	$("caret")?.classList.add("hidden");
	$("ghost-caret")?.classList.add("hidden");

	// NẾU LÀ CHẾ ĐỘ OUTPLAY: ĐẦU HÀNG COI NHƯ CHƠI LẠI, VÁN VỪA RỒI ĐƯỢC RESET VỀ 0 NHƯNG PB CỦA CẤU HÌNH ĐÓ ĐƯỢC GIỮ NGUYÊN
	if (OutplaySession.isActive) {
		clearInterval(OutplaySession.liveSecondInterval);
		stopGhostCaret();

		const record = getOutplayRecordForCurrentConfig();
		record.lastRun = {
			netWpm: 0,
			rawWpm: 0,
			accuracy: 0,
			errors: 0,
			duration: OutplaySession.duration,
			timeline: [],
			errorMarkers: [],
			keystrokeTrace: [],
		};

		initOutplayRound(false);
		return;
	}

	isPlaying = false;
	updateThemeFontButtonsState();
	$("type-input").disabled = true;
	$("status-box").innerText = isAFK ? "AFK" : "ĐÃ ĐẦU HÀNG";
	socket.emit("surrender", { isAFK });
}

function resetAFKTimer() {
	if (!isPlaying || OutplaySession.isActive) return;
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
					: currentLanguage === "ngau_hung" || currentLanguage === "doan_chu"
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
					<div class="track-line-fill" style="width: ${p.progress || 0}%; background: ${isDis ? "#4a4a4a" : p.id === socket.id ? "var(--main-color)" : "var(--sub-color)"};">
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
	if (OutplaySession.isActive) return;

	stopAutoTyperBot();
	isPlaying = false;
	updateThemeFontButtonsState();
	clearTimeout(afkTimer);
	clearInterval(timerInterval);
	clearInterval(ngauHungRoundTimer);
	clearInterval(doanChuRoundTimer);
	clearAllBossSkillEffects();
	$("caret")?.classList.add("hidden");

	$("game-container").classList.add("hidden");
	$("chat-container").classList.add("hidden");
	$("summary-modal").classList.remove("hidden");
	$("multiplayer-summary-view")?.classList.remove("hidden");
	$("outplay-summary-view")?.classList.add("hidden");

	const isNH = (d.language || currentLanguage) === "ngau_hung";
	const isDC = (d.language || currentLanguage) === "doan_chu";
	const isBoss = (d.language || currentLanguage) === "san_boss";

	const modalTitle = $("summary-modal-title");
	const bossSubtitle = $("boss-result-subtitle");

	if (isBoss) {
		bossSubtitle.classList.remove("hidden");
		const meta = difficultyMeta[d.difficulty || currentDifficulty] || difficultyMeta.normal;
		if (d.isBossVictory) {
			modalTitle.innerText = "🎉 LỤM! CHIẾN THẮNG! 🎉";
			modalTitle.style.color = "var(--main-color)";
			bossSubtitle.innerText = `Cả đội đã hợp lực tiêu diệt thành công Hắc Long Ma Vương [${meta.name}]!`;
			bossSubtitle.style.color = "var(--main-color)";
		} else {
			modalTitle.innerText = "💀 THẤT BẠI! 💀";
			modalTitle.style.color = "var(--error-color)";
			bossSubtitle.innerText = `Hết giờ! Hắc Long Ma Vương [${meta.name}] đã quét sạch toàn bộ đội hình!`;
			bossSubtitle.style.color = "var(--error-color)";
		}
	} else {
		modalTitle.innerText = "🏆 BẢNG TỔNG KẾT TRẬN ĐẤU";
		modalTitle.style.color = "var(--main-color)";
		bossSubtitle.classList.add("hidden");
	}

	$("summary-thead").innerHTML = `
		<tr>
			<th>HẠNG</th>
			<th>TÊN</th>
			<th>${isNH || isDC ? "KÝ TỰ" : isBoss ? "TỔNG SÁT THƯƠNG" : "KÝ TỰ ĐÚNG"}</th>
			<th>${isNH || isDC ? "TỔNG ĐIỂM" : isBoss ? "TỐC ĐỘ" : "TỐC ĐỘ"}</th>
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
					: isNH || isDC
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
				<label style="font-size: 12px; font-weight: bold; color: var(--sub-color);">TỐC ĐỘ (WPM):</label>
				<input type="number" id="bot-speed-input" value="100" min="10" max="500" class="cyber-input" style="margin-top: 5px; margin-bottom: 0;" />
			</div>
			<div style="margin-bottom: 20px; text-align: left;">
				<label style="font-size: 12px; font-weight: bold; color: var(--sub-color);">SỐ LỖI MONG MUỐN:</label>
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
	if (!isPlaying || currentLanguage === "doan_chu") return;
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
