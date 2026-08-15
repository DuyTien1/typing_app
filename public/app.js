const socket = io();

const ZIPCODE_TEST_DURATION = 90;
const NORMAL_RACE_DURATION = 300;

let currentLanguage = "vi_dau";
let myUsername = "Vô danh";
let currentWords = [];
let wordIndex = 0;
let correctChars = 0;
let totalErrors = 0;
let isPlaying = false;
let startTime = null;
let timerInterval = null;
let currentMatchPlayerCount = 0; // Biến lưu số lượng người chơi trong phòng đấu hiện tại

const runnerIcons = ["🐶", "🐭", "🐷", "🐱", "🐨", "🐯", "🐺", "🐰", "🦝", "🐵"];

// Bảng tra cứu tên hiển thị của từng chế độ chơi
const modeNames = {
	vi_dau: "🇻🇳 Tiếng Việt",
	vi_nodau: "🔤 Không Dấu",
	en: "🔠 English",
	numpad: "🔢 Numpad",
};

/**
 * Lấy chuỗi ngày YYYY-MM-DD chính xác theo múi giờ Asia/Ho_Chi_Minh (GMT+7)
 */
function getVNCurrentDateString() {
	const now = new Date();
	const vnTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
	const vnDate = new Date(vnTimeStr);

	const year = vnDate.getFullYear();
	const month = String(vnDate.getMonth() + 1).padStart(2, "0");
	const day = String(vnDate.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

/**
 * Đọc dữ liệu HighScore. Nếu khác ngày GMT+7 hiện tại -> Tự động Reset dữ liệu.
 */
function getValidHighScores() {
	const todayStr = getVNCurrentDateString();
	const savedData = JSON.parse(localStorage.getItem("racer_high_scores")) || {};

	if (savedData.date !== todayStr) {
		const freshData = {
			date: todayStr,
			scores: {},
		};
		localStorage.setItem("racer_high_scores", JSON.stringify(freshData));
		return freshData.scores;
	}

	return savedData.scores || {};
}

function loadHighScores() {
	const scores = getValidHighScores();
	const modes = ["vi_dau", "vi_nodau", "en", "numpad"];

	modes.forEach((mode) => {
		const data = scores[mode];
		const nameEl = document.getElementById(`hs-name-${mode}`);
		const wpmEl = document.getElementById(`hs-wpm-${mode}`);
		const errEl = document.getElementById(`hs-err-${mode}`);

		if (data) {
			if (nameEl) nameEl.innerText = data.username || "Vô danh";
			if (wpmEl) wpmEl.innerText = `${data.wpm || 0} WPM`;
			if (errEl) errEl.innerText = data.errors || 0;
		} else {
			if (nameEl) nameEl.innerText = "Chưa có";
			if (wpmEl) wpmEl.innerText = "0";
			if (errEl) errEl.innerText = "0";
		}
	});
}

/**
 * Cập nhật kỷ lục cá nhân. CHỈ LƯU khi số người chơi trong trận đấu >= 3.
 */
function updateHighScore(lang, username, wpm, errors, roomPlayerCount) {
	// Yêu cầu phòng chơi phải có tối thiểu 3 người chơi
	if (roomPlayerCount < 3) return;

	const todayStr = getVNCurrentDateString();
	let currentScores = getValidHighScores();
	const currentRecord = currentScores[lang];

	// Kiểm tra điều kiện lập kỷ lục mới: WPM cao hơn HOẶC WPM bằng nhưng số lỗi ít hơn
	const isNewRecord =
		!currentRecord ||
		wpm > currentRecord.wpm ||
		(wpm === currentRecord.wpm && errors < currentRecord.errors);

	if (isNewRecord) {
		currentScores[lang] = {
			username: username,
			wpm: wpm,
			errors: errors,
			timestamp: Date.now(),
		};

		const dataToSave = {
			date: todayStr,
			scores: currentScores,
		};

		localStorage.setItem("racer_high_scores", JSON.stringify(dataToSave));
		loadHighScores();
	}
}

function initTheme() {
	const savedTheme = localStorage.getItem("racer_theme") || "dark";
	applyTheme(savedTheme);
}

function applyTheme(theme) {
	const themeToggleBtn = document.getElementById("theme-toggle-btn");
	if (theme === "light") {
		document.documentElement.setAttribute("data-theme", "light");
		if (themeToggleBtn) themeToggleBtn.innerText = "☀️ Sáng";
	} else {
		document.documentElement.removeAttribute("data-theme");
		if (themeToggleBtn) themeToggleBtn.innerText = "🌙 Tối";
	}
	localStorage.setItem("racer_theme", theme);
}

document.addEventListener("DOMContentLoaded", () => {
	initTheme();
	initUserProfile();
	loadHighScores();

	const themeToggleBtn = document.getElementById("theme-toggle-btn");
	if (themeToggleBtn) {
		themeToggleBtn.addEventListener("click", () => {
			const currentTheme = document.documentElement.getAttribute("data-theme");
			applyTheme(currentTheme === "light" ? "dark" : "light");
		});
	}

	const modeCards = document.querySelectorAll(".mode-card");
	modeCards.forEach((card) => {
		card.addEventListener("click", () => {
			modeCards.forEach((c) => c.classList.remove("selected"));
			card.classList.add("selected");
			currentLanguage = card.getAttribute("data-lang");
		});
	});

	const joinBtn = document.getElementById("join-btn");
	if (joinBtn) {
		joinBtn.addEventListener("click", () => {
			document.getElementById("login-modal").classList.add("hidden");
			document.getElementById("lobby-screen").classList.remove("hidden");

			const bgCanvas = document.getElementById("keyboard-bg-canvas");
			if (bgCanvas) bgCanvas.style.display = "none";

			socket.emit("join_lobby", { username: myUsername, language: currentLanguage });
		});
	}

	const startGameNowBtn = document.getElementById("start-game-now-btn");
	if (startGameNowBtn) {
		startGameNowBtn.addEventListener("click", () => {
			socket.emit("force_start_game");
		});
	}

	document.getElementById("btn-lobby-home")?.addEventListener("click", () => {
		document.getElementById("lobby-screen").classList.add("hidden");
		document.getElementById("login-modal").classList.remove("hidden");

		loadHighScores();
		const bgCanvas = document.getElementById("keyboard-bg-canvas");
		if (bgCanvas) bgCanvas.style.display = "block";
		socket.disconnect();
		socket.connect();
	});

	const btnSurrender = document.getElementById("btn-surrender");
	const surrenderModal = document.getElementById("surrender-modal");
	const btnConfirmSurrender = document.getElementById("btn-confirm-surrender");
	const btnCancelSurrender = document.getElementById("btn-cancel-surrender");

	if (btnSurrender) {
		btnSurrender.addEventListener("click", () => {
			if (isPlaying && surrenderModal) {
				surrenderModal.classList.remove("hidden");
			}
		});
	}

	if (btnCancelSurrender) {
		btnCancelSurrender.addEventListener("click", () => {
			if (surrenderModal) surrenderModal.classList.add("hidden");
		});
	}

	if (btnConfirmSurrender) {
		btnConfirmSurrender.addEventListener("click", () => {
			if (surrenderModal) surrenderModal.classList.add("hidden");
			surrenderGame();
		});
	}

	const btnChangeName = document.getElementById("btn-change-name");
	const renamePopup = document.getElementById("rename-popup");
	const popupNameInput = document.getElementById("popup-name-input");
	const btnSavePopupName = document.getElementById("btn-save-popup-name");
	const btnCancelPopupName = document.getElementById("btn-cancel-popup-name");

	if (btnChangeName) {
		btnChangeName.addEventListener("click", () => {
			popupNameInput.value = myUsername;
			renamePopup.classList.remove("hidden");
			popupNameInput.focus();
		});
	}
	if (btnCancelPopupName) {
		btnCancelPopupName.addEventListener("click", () => {
			renamePopup.classList.add("hidden");
		});
	}
	if (btnSavePopupName) {
		btnSavePopupName.addEventListener("click", () => {
			const newName = popupNameInput.value.trim();
			if (newName) {
				myUsername = newName;
				localStorage.setItem("racer_username", myUsername);
				document.getElementById("profile-name").innerText = myUsername;
				renamePopup.classList.add("hidden");
				socket.emit("update_username", { username: myUsername });
			}
		});
	}

	setupGlobalChat();

	const typeInput = document.getElementById("type-input");
	if (typeInput) {
		typeInput.addEventListener("input", handleTypingInput);

		// Thêm sự kiện bắt phím Dấu trừ (-) và NumpadMinus để thực hiện xóa ký tự tương tự phím Backspace
		typeInput.addEventListener("keydown", (e) => {
			if (e.key === "-" || e.code === "NumpadMinus") {
				e.preventDefault();
				typeInput.value = typeInput.value.slice(0, -1);
				typeInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
	}

	document.getElementById("btn-play-again")?.addEventListener("click", () => {
		document.getElementById("summary-modal").classList.add("hidden");
		document.getElementById("game-container").classList.add("hidden");
		document.getElementById("lobby-screen").classList.remove("hidden");
		socket.emit("join_lobby", { username: myUsername, language: currentLanguage });
	});

	document.getElementById("btn-home")?.addEventListener("click", () => {
		document.getElementById("summary-modal").classList.add("hidden");
		document.getElementById("game-container").classList.add("hidden");
		document.getElementById("lobby-screen").classList.add("hidden");
		document.getElementById("login-modal").classList.remove("hidden");

		loadHighScores();

		const bgCanvas = document.getElementById("keyboard-bg-canvas");
		if (bgCanvas) bgCanvas.style.display = "block";
	});

	const chatInput = document.getElementById("chat-input");
	if (chatInput) {
		chatInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				const msg = chatInput.value.trim();
				if (msg) {
					socket.emit("send_in_game_chat", { message: msg });
					chatInput.value = "";
				}
			}
		});
	}
});

function initUserProfile() {
	let savedName = localStorage.getItem("racer_username");
	if (!savedName) {
		savedName = "TayĐua_" + Math.floor(1000 + Math.random() * 9000);
		localStorage.setItem("racer_username", savedName);
	}
	myUsername = savedName;
	const profileName = document.getElementById("profile-name");
	if (profileName) profileName.innerText = myUsername;
}

socket.on("update_online_count", (count) => {
	const onlineCount = document.getElementById("online-count");
	if (onlineCount) onlineCount.innerText = count;
});

socket.on("update_lobby", (data) => {
	const lobbyCount = document.getElementById("lobby-count");
	const lobbyPlayersGrid = document.getElementById("lobby-players-grid");
	const lobbyModeDisplay = document.getElementById("lobby-mode-display");

	// Cập nhật tên hiển thị chế độ chơi trong phòng chờ
	const activeLang = data.language || currentLanguage;
	if (lobbyModeDisplay) {
		lobbyModeDisplay.innerText = `CHẾ ĐỘ: ${modeNames[activeLang] || activeLang}`;
	}

	if (lobbyCount) lobbyCount.innerText = `${data.players.length}/10`;
	if (lobbyPlayersGrid) {
		lobbyPlayersGrid.innerHTML = "";
		data.players.forEach((p) => {
			const card = document.createElement("div");
			card.className = "lobby-player-card";
			card.innerText = `🏎️ ${p.username}`;
			lobbyPlayersGrid.appendChild(card);
		});
	}
});

socket.on("game_start", (data) => {
	document.getElementById("lobby-screen").classList.add("hidden");
	document.getElementById("summary-modal").classList.add("hidden");
	document.getElementById("game-container").classList.remove("hidden");
	document.getElementById("chat-container").classList.remove("hidden");

	currentWords = data.words;
	currentMatchPlayerCount = data.players ? data.players.length : 0; // Lưu số người trong phòng
	wordIndex = 0;
	correctChars = 0;
	totalErrors = 0;
	isPlaying = false;
	startTime = null;

	const typeInput = document.getElementById("type-input");
	typeInput.value = "";
	typeInput.disabled = true;
	typeInput.placeholder = "Chuẩn bị...";
	document.getElementById("status-box").innerText = "CHUẨN BỊ";

	const btnSurrender = document.getElementById("btn-surrender");
	if (btnSurrender) btnSurrender.disabled = false;

	renderWords();
	renderRaceTracks(data.players);
	startCountdown(data.countdown || 3);
});

function startCountdown(seconds) {
	const timerEl = document.getElementById("timer");
	const statusBox = document.getElementById("status-box");
	const typeInput = document.getElementById("type-input");

	let count = seconds;
	timerEl.innerText = count;
	const cdInterval = setInterval(() => {
		count--;
		if (count > 0) {
			timerEl.innerText = count;
		} else {
			clearInterval(cdInterval);

			const raceDuration =
				currentLanguage === "numpad" ? ZIPCODE_TEST_DURATION : NORMAL_RACE_DURATION;

			timerEl.innerText = raceDuration;
			statusBox.innerText = "ĐANG THI ĐẤU";
			typeInput.disabled = false;
			typeInput.placeholder = "Gõ chữ vào đây...";
			typeInput.focus();
			isPlaying = true;
			startTime = Date.now();
			startRaceTimer(raceDuration);
		}
	}, 1000);
}

function startRaceTimer(duration) {
	const timerEl = document.getElementById("timer");
	let timeLeft = duration;
	if (timerInterval) clearInterval(timerInterval);
	timerInterval = setInterval(() => {
		timeLeft--;
		timerEl.innerText = timeLeft;
		if (timeLeft <= 0) {
			clearInterval(timerInterval);
			finishGame();
		}
	}, 1000);
}

function renderWords() {
	const wordsDisplay = document.getElementById("words-display");
	wordsDisplay.innerHTML = "";

	if (currentLanguage === "numpad") {
		wordsDisplay.classList.add("numpad-mode");
	} else {
		wordsDisplay.classList.remove("numpad-mode");
	}

	currentWords.forEach((word, idx) => {
		const span = document.createElement("span");
		span.className = "word";
		if (idx === wordIndex) span.className = "word current correct-typing";
		span.innerText = word;
		wordsDisplay.appendChild(span);
	});
	scrollCurrentWordIntoView();
}

function scrollCurrentWordIntoView() {
	const wordsDisplay = document.getElementById("words-display");
	const currentSpan = wordsDisplay.children[wordIndex];
	if (currentSpan) {
		currentSpan.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
	}
}

function handleTypingInput(e) {
	if (!isPlaying) return;

	const typeInput = e.target;
	const val = typeInput.value;
	const targetWord = currentWords[wordIndex];

	if (val.endsWith(" ")) {
		const typedWord = val.trim();

		if (typedWord === targetWord) {
			correctChars += targetWord.length + 1;
			markWordStatus(wordIndex, "correct");

			wordIndex++;
			typeInput.value = "";
			typeInput.classList.remove("input-error");

			if (wordIndex >= currentWords.length) {
				finishGame();
				return;
			} else {
				markWordStatus(wordIndex, "current correct-typing");
				scrollCurrentWordIntoView();
			}

			sendProgressUpdate();
		} else {
			totalErrors++;
			flashInputError(typeInput);
			typeInput.value = "";
			typeInput.classList.remove("input-error");
			markWordStatus(wordIndex, "current correct-typing");
			typeInput.focus();
		}
	} else {
		if (!targetWord.startsWith(val)) {
			typeInput.classList.add("input-error");
			markWordStatus(wordIndex, "current incorrect-typing");
		} else {
			typeInput.classList.remove("input-error");
			markWordStatus(wordIndex, "current correct-typing");
		}
	}
}

function markWordStatus(index, statusClass) {
	const wordsDisplay = document.getElementById("words-display");
	const targetEl = wordsDisplay.children[index];
	if (targetEl) {
		targetEl.className = "word " + statusClass;
	}
}

function flashInputError(inputEl) {
	inputEl.classList.add("flash-red");
	setTimeout(() => {
		inputEl.classList.remove("flash-red");
	}, 300);
}

function sendProgressUpdate() {
	const progress = Math.min(100, Math.round((wordIndex / currentWords.length) * 100));
	const elapsedTime = (Date.now() - startTime) / 60000;
	const wpm = elapsedTime > 0 ? Math.round(correctChars / 5 / elapsedTime) : 0;

	socket.emit("update_progress", {
		progress: progress,
		wpm: wpm,
		correctChars: correctChars,
		errors: totalErrors,
	});
}

function finishGame() {
	isPlaying = false;
	const typeInput = document.getElementById("type-input");
	typeInput.disabled = true;
	if (timerInterval) clearInterval(timerInterval);
	document.getElementById("status-box").innerText = "HOÀN THÀNH";

	const elapsedTime = (Date.now() - startTime) / 60000;
	const finalWpm = elapsedTime > 0 ? Math.round(correctChars / 5 / elapsedTime) : 0;

	socket.emit("player_finished", {
		wpm: finalWpm,
		correctChars: correctChars,
		errors: totalErrors,
	});
}

function surrenderGame() {
	isPlaying = false;
	const typeInput = document.getElementById("type-input");
	typeInput.disabled = true;
	if (timerInterval) clearInterval(timerInterval);
	document.getElementById("status-box").innerText = "ĐÃ ĐẦU HÀNG";

	const btnSurrender = document.getElementById("btn-surrender");
	if (btnSurrender) btnSurrender.disabled = true;

	socket.emit("surrender");
}

function renderRaceTracks(players) {
	const raceTracksContainer = document.getElementById("race-tracks-container");
	raceTracksContainer.innerHTML = "";
	players.forEach((p, idx) => {
		const trackRow = document.createElement("div");
		trackRow.className = "track-row";
		trackRow.id = `track-${p.id}`;

		const icon = runnerIcons[idx % runnerIcons.length];
		const colorHue = (idx * 137.5) % 360;

		let statusBadge = `<span class="wpm-tag" id="wpm-${p.id}">${p.wpm || 0} WPM</span>`;
		if (p.isSurrendered) {
			statusBadge = `<span class="status-tag surrendered" id="wpm-${p.id}">GIẢNG HÒA</span>`;
		} else if (p.isDisconnected) {
			statusBadge = `<span class="status-tag disconnected" id="wpm-${p.id}">BẢY CHỌ</span>`;
		}

		trackRow.innerHTML = `
			<div class="track-header">
				<span>${p.username} ${p.id === socket.id ? " (Bạn)" : ""}</span>
				${statusBadge}
			</div>
			<div class="track-line-bg ${p.isSurrendered || p.isDisconnected ? "disabled-track" : ""}">
				<div class="track-line-fill" id="fill-${p.id}" style="width: ${p.progress || 0}%; background: hsl(${colorHue}, 80%, 50%);">
					<div class="runner-icon-badge" style="border-color: hsl(${colorHue}, 80%, 50%);">${icon}</div>
				</div>
			</div>
		`;
		raceTracksContainer.appendChild(trackRow);
	});
}

socket.on("race_update", (players) => {
	players.forEach((p) => {
		const fillEl = document.getElementById(`fill-${p.id}`);
		const wpmEl = document.getElementById(`wpm-${p.id}`);
		const trackBg = document.querySelector(`#track-${p.id} .track-line-bg`);

		if (fillEl) fillEl.style.width = `${p.progress}%`;
		if (wpmEl) {
			if (p.isSurrendered) {
				wpmEl.className = "status-tag surrendered";
				wpmEl.innerText = "GIẢNG HÒA";
				if (trackBg) trackBg.classList.add("disabled-track");
			} else if (p.isDisconnected) {
				wpmEl.className = "status-tag disconnected";
				wpmEl.innerText = "BẢY CHỌ";
				if (trackBg) trackBg.classList.add("disabled-track");
			} else {
				wpmEl.innerText = `${p.wpm || 0} WPM`;
			}
		}
	});
});

socket.on("game_over", (leaderboard) => {
	const summaryTbody = document.getElementById("summary-tbody");
	summaryTbody.innerHTML = "";
	leaderboard.forEach((p, idx) => {
		const tr = document.createElement("tr");
		let rankBadge = `${idx + 1}`;
		if (idx === 0) rankBadge = "🥇 1";
		else if (idx === 1) rankBadge = "🥈 2";
		else if (idx === 2) rankBadge = "🥉 3";

		let statusText = `${p.wpm || 0} WPM`;
		if (p.isSurrendered) statusText = "🏳️ GIẢNG HÒA";
		else if (p.isDisconnected) statusText = "❌ BẢY CHỌ";

		tr.innerHTML = `
			<td style="font-weight: bold; color: var(--accent);">${rankBadge}</td>
			<td style="font-weight: bold;">${p.username}</td>
			<td style="color: var(--correct);">${p.correctChars || 0}</td>
			<td style="font-weight: bold; color: ${p.isSurrendered || p.isDisconnected ? "var(--secondary)" : "var(--primary)"};">${statusText}</td>
			<td style="color: var(--secondary);">${p.errors || 0}</td>
		`;
		summaryTbody.appendChild(tr);

		// Truyền thêm currentMatchPlayerCount để kiểm tra điều kiện >= 3 người
		if (!p.isSurrendered && !p.isDisconnected) {
			updateHighScore(
				currentLanguage,
				p.username,
				p.wpm || 0,
				p.errors || 0,
				currentMatchPlayerCount,
			);
		}
	});

	document.getElementById("summary-modal").classList.remove("hidden");
	triggerFireworks();
});

function setupGlobalChat() {
	const globalChatInputs = document.querySelectorAll(".global-chat-input");
	const globalChatSendBtns = document.querySelectorAll(".global-chat-send-btn");

	function sendMsg(inputEl) {
		if (!inputEl) return;
		const msg = inputEl.value.trim();
		if (msg) {
			socket.emit("send_global_chat", {
				message: msg,
				username: myUsername,
			});
			inputEl.value = "";
		}
	}

	globalChatSendBtns.forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const wrapper = e.currentTarget.closest(".global-chat-input-wrapper");
			if (wrapper) {
				sendMsg(wrapper.querySelector(".global-chat-input"));
			}
		});
	});

	globalChatInputs.forEach((input) => {
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				sendMsg(input);
			}
		});
	});
}

socket.on("receive_global_chat", (data) => {
	const chatContainers = document.querySelectorAll(".global-chat-messages");
	chatContainers.forEach((container) => {
		const msgDiv = document.createElement("div");
		msgDiv.className = "chat-msg-item";
		const timeStr = new Date(data.timestamp).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
		msgDiv.innerHTML = `<span class="chat-msg-user">${data.username}:</span><span>${data.message}</span><span class="chat-msg-time">${timeStr}</span>`;
		container.appendChild(msgDiv);
		container.scrollTop = container.scrollHeight;
	});
});

socket.on("receive_in_game_chat", (data) => {
	const chatPopups = document.getElementById("chat-popups");
	const bubble = document.createElement("div");
	bubble.className = "chat-bubble";
	bubble.innerHTML = `<span class="sender">${data.username}</span><div>${data.message}</div>`;
	chatPopups.appendChild(bubble);

	setTimeout(() => {
		bubble.style.opacity = "0";
		bubble.style.transition = "opacity 0.5s ease";
		setTimeout(() => bubble.remove(), 500);
	}, 4000);
});

const canvas = document.getElementById("fireworks-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
let particles = [];

function resizeCanvas() {
	if (!canvas) return;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function triggerFireworks() {
	if (!canvas || !ctx) return;
	particles = [];
	for (let i = 0; i < 5; i++) {
		setTimeout(() => {
			createExplosion(Math.random() * canvas.width, Math.random() * (canvas.height * 0.5));
		}, i * 300);
	}
	animateFireworks();
}

function createExplosion(x, y) {
	const count = 90;
	for (let i = 0; i < count; i++) {
		const angle = ((Math.PI * 2) / count) * i;
		const speed = Math.random() * 5 + 2;
		particles.push({
			x: x,
			y: y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			alpha: 1,
			color: `hsl(${Math.random() * 360}, 100%, 50%)`,
		});
	}
}

function animateFireworks() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	particles.forEach((p, idx) => {
		p.x += p.vx;
		p.y += p.vy;
		p.vy += 0.05;
		p.alpha -= 0.015;

		ctx.globalAlpha = Math.max(0, p.alpha);
		ctx.fillStyle = p.color;
		ctx.beginPath();
		ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
		ctx.fill();

		if (p.alpha <= 0) particles.splice(idx, 1);
	});

	if (particles.length > 0) {
		requestAnimationFrame(animateFireworks);
	}
}

(function initStealthKeyboardBG() {
	const bgCanvas = document.getElementById("keyboard-bg-canvas");
	if (!bgCanvas) return;
	const bgCtx = bgCanvas.getContext("2d");

	const baseKeyLayout = [
		["Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Del"],
		["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
		["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
		["Caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
		["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
		["Ctrl", "Win", "Alt", "Space", "Alt", "Fn", "Ctrl"],
	];

	let keysList = [];

	function resizeBgCanvas() {
		bgCanvas.width = window.innerWidth;
		bgCanvas.height = window.innerHeight;
		buildKeyboardGrid();
	}

	function buildKeyboardGrid() {
		keysList = [];
		const screenW = bgCanvas.width;
		const screenH = bgCanvas.height;

		const centerMarginX = 320;
		const centerMarginY = 320;
		const centerX = screenW / 2;
		const centerY = screenH / 2;

		const padding = 12;
		const baseKeyWidth = 80;
		const keyHeight = 60;

		const rowCount = baseKeyLayout.length;
		const totalBlockH = rowCount * (keyHeight + padding);
		const startY = (screenH % totalBlockH) / 2;

		for (let yPtr = startY - totalBlockH; yPtr < screenH + totalBlockH; yPtr += totalBlockH) {
			baseKeyLayout.forEach((row, rIdx) => {
				const currentY = yPtr + rIdx * (keyHeight + padding);

				let baseRowWidth = 0;
				row.forEach((keyText) => {
					let mult = 1;
					if (keyText === "Space") mult = 4;
					else if (keyText === "Backspace" || keyText === "Shift" || keyText === "Enter")
						mult = 1.8;
					else if (keyText === "Tab" || keyText === "Caps") mult = 1.3;
					baseRowWidth += baseKeyWidth * mult + padding;
				});

				const startX = (screenW % baseRowWidth) / 2;
				for (
					let xPtr = startX - baseRowWidth;
					xPtr < screenW + baseRowWidth;
					xPtr += baseRowWidth
				) {
					let currentX = xPtr;

					row.forEach((keyText) => {
						let wMultiplier = 1;
						if (keyText === "Space") wMultiplier = 4;
						else if (keyText === "Backspace" || keyText === "Shift" || keyText === "Enter")
							wMultiplier = 1.8;
						else if (keyText === "Tab" || keyText === "Caps") wMultiplier = 1.3;

						const actualWidth = baseKeyWidth * wMultiplier;
						const keyCenterX = currentX + actualWidth / 2;
						const keyCenterY = currentY + keyHeight / 2;

						const isInsideCenterBox =
							Math.abs(keyCenterX - centerX) < centerMarginX &&
							Math.abs(keyCenterY - centerY) < centerMarginY;

						if (!isInsideCenterBox) {
							keysList.push({
								text: keyText,
								x: currentX,
								y: currentY,
								w: actualWidth,
								h: keyHeight,
								alpha: 0,
								hue: 0,
							});
						}

						currentX += actualWidth + padding;
					});
				}
			});
		}
	}

	function triggerRandomKey() {
		if (keysList.length === 0) return;
		for (let i = 0; i < 3; i++) {
			const randIndex = Math.floor(Math.random() * keysList.length);
			const key = keysList[randIndex];
			if (key.alpha <= 0.2) {
				key.hue = Math.floor(Math.random() * 360);
				key.alpha = 1.0;
			}
		}
	}

	function animateKeyboardBG() {
		bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

		const isLight = document.documentElement.getAttribute("data-theme") === "light";

		const defaultStroke = isLight ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.08)";
		const defaultFill = isLight ? "rgba(240, 242, 245, 0.85)" : "rgba(10, 10, 18, 0.4)";
		const defaultText = isLight ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.2)";

		keysList.forEach((key) => {
			bgCtx.lineWidth = 1.5;
			bgCtx.strokeStyle = defaultStroke;
			bgCtx.fillStyle = defaultFill;

			bgCtx.beginPath();
			bgCtx.roundRect(key.x, key.y, key.w, key.h, 8);
			bgCtx.fill();
			bgCtx.stroke();

			bgCtx.fillStyle = defaultText;
			bgCtx.font = "bold 13px Orbitron, sans-serif";
			bgCtx.textAlign = "center";
			bgCtx.textBaseline = "middle";
			bgCtx.fillText(key.text, key.x + key.w / 2, key.y + key.h / 2);

			if (key.alpha > 0) {
				bgCtx.save();

				if (isLight) {
					const strokeColor = `hsla(${key.hue}, 100%, 38%, ${key.alpha})`;
					const fillColor = `hsla(${key.hue}, 100%, 65%, ${key.alpha * 0.7})`;
					const textColor = `hsla(${key.hue}, 100%, 15%, ${key.alpha})`;

					bgCtx.shadowColor = `hsl(${key.hue}, 100%, 45%)`;
					bgCtx.shadowBlur = 20 * key.alpha;

					bgCtx.fillStyle = fillColor;
					bgCtx.strokeStyle = strokeColor;
					bgCtx.lineWidth = 3;

					bgCtx.beginPath();
					bgCtx.roundRect(key.x, key.y, key.w, key.h, 8);
					bgCtx.fill();
					bgCtx.stroke();

					bgCtx.fillStyle = textColor;
					bgCtx.font = "bold 15px Orbitron, sans-serif";
					bgCtx.fillText(key.text, key.x + key.w / 2, key.y + key.h / 2);
				} else {
					bgCtx.shadowColor = `hsl(${key.hue}, 100%, 55%)`;
					bgCtx.shadowBlur = 40 * key.alpha;

					bgCtx.fillStyle = `hsla(${key.hue}, 100%, 50%, ${key.alpha * 0.9})`;
					bgCtx.strokeStyle = `hsla(${key.hue}, 100%, 85%, ${key.alpha})`;
					bgCtx.lineWidth = 3;

					bgCtx.beginPath();
					bgCtx.roundRect(key.x, key.y, key.w, key.h, 8);
					bgCtx.fill();
					bgCtx.stroke();

					bgCtx.shadowBlur = 15 * key.alpha;
					bgCtx.shadowColor = "#ffffff";
					bgCtx.fillStyle = `rgba(255, 255, 255, ${key.alpha})`;
					bgCtx.font = "bold 16px Orbitron, sans-serif";
					bgCtx.fillText(key.text, key.x + key.w / 2, key.y + key.h / 2);
				}

				bgCtx.restore();

				key.alpha -= 0.008;
			}
		});

		requestAnimationFrame(animateKeyboardBG);
	}

	function scheduleNextKeyPress() {
		triggerRandomKey();
		const nextDelay = Math.random() * 70 + 30;
		setTimeout(scheduleNextKeyPress, nextDelay);
	}

	window.addEventListener("resize", resizeBgCanvas);
	resizeBgCanvas();
	animateKeyboardBG();
	scheduleNextKeyPress();
})();
