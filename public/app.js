const socket = io();

const ZIPCODE_TEST_DURATION = 90;
const NORMAL_RACE_DURATION = 300;
const DEFAULT_ICON = "🤖";
const AFK_TIMEOUT = 30000; // 30 giây không thao tác sẽ bị tính AFK

let currentLanguage = "vi_dau";
let myUsername = "bot_1000";
let mySelectedIcon = DEFAULT_ICON;
let currentWords = [];
let wordIndex = 0;
let correctChars = 0;
let totalErrors = 0;
let isPlaying = false;
let startTime = null;
let timerInterval = null;
let afkTimer = null;
let currentMatchPlayerCount = 0;
let currentLobbyPlayers = [];

// Admin states & timers
let isAdmin = false;
let lastEnteredAdminPassword = "";
let adminOnlineUsers = [];
let adminBannedUsers = [];
let bannedModalTimer = null;
let banNoticeTimer = null;

// Auto-Typer Bot States
let autoTyperActive = false;
let autoTyperTimeout = null;

// Khung Chat Emojis
let activeChatInput = null;
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

let serverHighScores = {
	vi_dau: null,
	vi_nodau: null,
	en: null,
	numpad: null,
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

const modeNames = {
	vi_dau: "🇻🇳 Tiếng Việt",
	vi_nodau: "🔤 Không Dấu",
	en: "🔠 English",
	numpad: "🔢 Numpad",
};

// Helper Functions cho Cookie
function setCookie(name, value, days) {
	let expires = "";
	if (days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
	const nameEQ = name + "=";
	const ca = document.cookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

function eraseCookie(name) {
	document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

socket.on("connect", () => {
	if (myUsername) {
		socket.emit("update_username", { username: myUsername });
	}

	const savedAdminPwd = getCookie("admin_token");
	if (savedAdminPwd) {
		lastEnteredAdminPassword = savedAdminPwd;
		socket.emit("admin_login", { password: savedAdminPwd });
	}
});

function resetToDefaultIcon() {
	mySelectedIcon = DEFAULT_ICON;
	localStorage.removeItem("racer_icon");
}

function generateBotName() {
	const randomNum = Math.floor(1000 + Math.random() * 9000);
	return `bot_${randomNum}`;
}

function loadHighScores() {
	const modes = ["vi_dau", "vi_nodau", "en", "numpad"];

	modes.forEach((mode) => {
		const data = serverHighScores[mode];
		const nameEl = document.getElementById(`hs-name-${mode}`);
		const wpmEl = document.getElementById(`hs-wpm-${mode}`);
		const errEl = document.getElementById(`hs-err-${mode}`);
		const actionTd = document.getElementById(`hs-action-${mode}`);

		if (data) {
			if (nameEl) nameEl.innerText = data.username || "Vô danh";
			if (wpmEl) wpmEl.innerText = `${data.wpm || 0} WPM`;
			if (errEl) errEl.innerText = data.errors || 0;
		} else {
			if (nameEl) nameEl.innerText = "Chưa có";
			if (wpmEl) wpmEl.innerText = "0";
			if (errEl) errEl.innerText = "0";
		}

		if (actionTd) {
			if (isAdmin) {
				actionTd.classList.remove("hidden");
				actionTd.innerHTML = `<button class="btn-small btn-danger" onclick="resetHighScore('${mode}')">Reset</button>`;
			} else {
				actionTd.classList.add("hidden");
			}
		}
	});
}

window.resetHighScore = function (mode) {
	if (isAdmin) {
		socket.emit("admin_reset_highscore", { lang: mode });
	}
};

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
	socket.emit("update_username", { username: myUsername });
	loadHighScores();
	setupAdminControls();
	setupChatEmojiPicker();
	setupBotModal();

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
			socket.emit("join_lobby", {
				username: myUsername,
				language: currentLanguage,
				selectedIcon: mySelectedIcon,
			});
		});
	}

	const btnOpenIconSelect = document.getElementById("btn-open-icon-select");
	const iconSelectPopup = document.getElementById("icon-select-popup");
	const btnCloseIconPopup = document.getElementById("btn-close-icon-popup");

	if (btnOpenIconSelect) {
		btnOpenIconSelect.addEventListener("click", () => {
			renderIconPicker();
			iconSelectPopup.classList.remove("hidden");
		});
	}

	if (btnCloseIconPopup) {
		btnCloseIconPopup.addEventListener("click", () => {
			iconSelectPopup.classList.add("hidden");
		});
	}

	const startGameNowBtn = document.getElementById("start-game-now-btn");
	if (startGameNowBtn) {
		startGameNowBtn.addEventListener("click", () => {
			socket.emit("force_start_game");
		});
	}

	document.getElementById("btn-lobby-home")?.addEventListener("click", () => {
		socket.emit("leave_lobby");
		resetToDefaultIcon();
		document.getElementById("lobby-screen").classList.add("hidden");
		document.getElementById("login-modal").classList.remove("hidden");
		loadHighScores();
		updateBanBadgeVisibility();
		const bgCanvas = document.getElementById("keyboard-bg-canvas");
		if (bgCanvas) bgCanvas.style.display = "block";
	});

	const btnSurrender = document.getElementById("btn-surrender");
	const surrenderModal = document.getElementById("surrender-modal");
	const btnConfirmSurrender = document.getElementById("btn-confirm-surrender");
	const btnCancelSurrender = document.getElementById("btn-cancel-surrender");

	if (btnSurrender) {
		btnSurrender.addEventListener("click", () => {
			if (isPlaying && surrenderModal) surrenderModal.classList.remove("hidden");
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
		typeInput.addEventListener("keydown", (e) => {
			resetAFKTimer();
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
		socket.emit("join_lobby", {
			username: myUsername,
			language: currentLanguage,
			selectedIcon: mySelectedIcon,
		});
	});

	document.getElementById("btn-home")?.addEventListener("click", () => {
		socket.emit("leave_lobby");
		resetToDefaultIcon();
		document.getElementById("summary-modal").classList.add("hidden");
		document.getElementById("game-container").classList.add("hidden");
		document.getElementById("lobby-screen").classList.add("hidden");
		document.getElementById("login-modal").classList.remove("hidden");
		loadHighScores();
		updateBanBadgeVisibility();
		const bgCanvas = document.getElementById("keyboard-bg-canvas");
		if (bgCanvas) bgCanvas.style.display = "block";
	});

	const chatInput = document.getElementById("chat-input");
	const inGameSendBtn = document.getElementById("in-game-chat-send-btn");

	function sendInGameChatMsg() {
		if (chatInput) {
			const msg = chatInput.value.trim();
			if (msg) {
				socket.emit("send_in_game_chat", { message: msg });
				chatInput.value = "";
			}
		}
	}

	if (inGameSendBtn) {
		inGameSendBtn.addEventListener("click", sendInGameChatMsg);
	}

	if (chatInput) {
		chatInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				sendInGameChatMsg();
			}
		});
	}

	window.addEventListener("keydown", (e) => {
		if (e.key === "F4") {
			e.preventDefault();
			if (isAdmin) {
				const botModal = document.getElementById("bot-config-popup");
				if (botModal) {
					botModal.classList.remove("hidden");
					document.getElementById("bot-speed-input")?.focus();
				}
			}
		} else if (e.key === "F8") {
			e.preventDefault();
			if (autoTyperActive) {
				stopAutoTyperBot();
			}
		}
	});
});

function setupBotModal() {
	let botModal = document.getElementById("bot-config-popup");
	if (!botModal) {
		botModal = document.createElement("div");
		botModal.id = "bot-config-popup";
		botModal.className = "custom-popup hidden";
		botModal.innerHTML = `
			<div class="popup-content">
				<h3 style="font-family: 'Orbitron', sans-serif; color: var(--primary); margin-bottom: 15px;">
					🤖 THIẾT LẬP AUTO BOT
				</h3>
				<div style="margin-bottom: 12px; text-align: left;">
					<label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">TỐC ĐỘ (WPM):</label>
					<input type="number" id="bot-speed-input" value="100" min="10" max="500" style="width: 100%; padding: 8px; background: var(--input-bg); border: 1px solid var(--primary); color: var(--text-main); border-radius: 6px;" />
				</div>
				<div style="margin-bottom: 20px; text-align: left;">
					<label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">SỐ LỖI MONG MUỐN CỦA BOT:</label>
					<input type="number" id="bot-errors-input" value="0" min="0" max="100" style="width: 100%; padding: 8px; background: var(--input-bg); border: 1px solid var(--primary); color: var(--text-main); border-radius: 6px;" />
				</div>
				<p style="font-size: 12px; color: var(--accent); margin-bottom: 15px;">Tip: Nhấn <b>F8</b> khi bot đang chạy để dừng ngay lập tức.</p>
				<div style="display: flex; gap: 10px; justify-content: center;">
					<button id="btn-start-bot" class="cyber-btn" style="padding: 8px 20px; font-size: 14px;">BẮT ĐẦU BOT</button>
					<button id="btn-cancel-bot" class="cyber-btn" style="padding: 8px 20px; font-size: 14px; background: linear-gradient(45deg, #444, #222);">HỦY</button>
				</div>
			</div>
		`;
		document.body.appendChild(botModal);

		document.getElementById("btn-cancel-bot")?.addEventListener("click", () => {
			botModal.classList.add("hidden");
		});

		document.getElementById("btn-start-bot")?.addEventListener("click", () => {
			const targetWPM = parseInt(document.getElementById("bot-speed-input").value) || 100;
			const targetErrors = parseInt(document.getElementById("bot-errors-input").value) || 0;
			botModal.classList.add("hidden");
			startAutoTyperBot(targetWPM, targetErrors);
		});
	}
}

function startAutoTyperBot(targetWPM, targetErrors) {
	if (!isPlaying) return;
	stopAutoTyperBot();
	autoTyperActive = true;

	const remainingWords = currentWords.slice(wordIndex);
	if (remainingWords.length === 0) return;

	let totalCharsToType = remainingWords.join(" ").length + 1;
	const totalTimeSeconds = totalCharsToType / 5 / (targetWPM / 60);
	const msPerChar = Math.max(10, (totalTimeSeconds * 1000) / (totalCharsToType + targetErrors * 2));

	let errorsPerformed = 0;

	function typeNextChar() {
		if (!isPlaying || !autoTyperActive || wordIndex >= currentWords.length) {
			stopAutoTyperBot();
			return;
		}

		resetAFKTimer();

		const typeInput = document.getElementById("type-input");
		if (!typeInput) return;

		// Ngay chữ đầu tiên, tạo đủ số lỗi yêu cầu trước khi đánh đúng
		if (errorsPerformed < targetErrors) {
			typeInput.value = "x";
			typeInput.dispatchEvent(new Event("input", { bubbles: true }));

			setTimeout(() => {
				typeInput.value = "x ";
				typeInput.dispatchEvent(new Event("input", { bubbles: true }));
				errorsPerformed++;
				autoTyperTimeout = setTimeout(typeNextChar, msPerChar);
			}, msPerChar);

			return;
		}

		const targetWord = currentWords[wordIndex];
		const currentTyped = typeInput.value;

		if (currentTyped.length < targetWord.length) {
			let nextChar = targetWord[currentTyped.length];
			typeInput.value = currentTyped + nextChar;
		} else {
			typeInput.value = currentTyped + " ";
		}

		typeInput.dispatchEvent(new Event("input", { bubbles: true }));
		autoTyperTimeout = setTimeout(typeNextChar, msPerChar);
	}

	typeNextChar();
}

function stopAutoTyperBot() {
	autoTyperActive = false;
	if (autoTyperTimeout) {
		clearTimeout(autoTyperTimeout);
		autoTyperTimeout = null;
	}
}

function resetAFKTimer() {
	if (!isPlaying) return;
	if (afkTimer) clearTimeout(afkTimer);
	afkTimer = setTimeout(() => {
		if (isPlaying) {
			surrenderGame(true);
		}
	}, AFK_TIMEOUT);
}

function clearAFKTimer() {
	if (afkTimer) {
		clearTimeout(afkTimer);
		afkTimer = null;
	}
}

function setupChatEmojiPicker() {
	const picker = document.getElementById("chat-emoji-picker");
	const grid = document.getElementById("chat-emoji-grid");
	if (!grid || !picker) return;

	grid.innerHTML = "";
	chatEmojis.forEach((emoji) => {
		const btn = document.createElement("div");
		btn.className = "chat-emoji-item";
		btn.innerText = emoji;
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			if (activeChatInput) {
				const start = activeChatInput.selectionStart || activeChatInput.value.length;
				const end = activeChatInput.selectionEnd || activeChatInput.value.length;
				const val = activeChatInput.value;
				activeChatInput.value = val.substring(0, start) + emoji + val.substring(end);
				activeChatInput.focus();
				activeChatInput.selectionStart = activeChatInput.selectionEnd = start + emoji.length;
			}
			picker.classList.add("hidden");
		});
		grid.appendChild(btn);
	});

	document.querySelectorAll(".chat-emoji-btn").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			const wrapper =
				e.currentTarget.closest(".global-chat-input-wrapper") ||
				e.currentTarget.closest(".in-game-chat-wrapper");

			if (wrapper) {
				activeChatInput = wrapper.querySelector("input");
			}

			const isCurrentlyOpen = !picker.classList.contains("hidden");
			const isSameButton = picker.getAttribute("data-last-btn") === (btn.id || btn.className);

			if (isCurrentlyOpen && isSameButton) {
				picker.classList.add("hidden");
				return;
			}

			picker.setAttribute("data-last-btn", btn.id || btn.className);
			picker.classList.remove("hidden");

			const rect = e.currentTarget.getBoundingClientRect();
			const pickerHeight = picker.offsetHeight || 160;
			const pickerWidth = picker.offsetWidth || 280;

			// Ưu tiên hiển thị ngay phía trên nút bấm (cách 8px)
			let top = rect.top - pickerHeight - 8;

			// Nếu tràn mép trên màn hình thì tự động chuyển xuống phía dưới nút
			if (top < 10) {
				top = rect.bottom + 8;
			}

			// Căn lề phải của picker khớp theo cạnh phải nút bấm
			let left = rect.right - pickerWidth;
			if (left < 10) left = 10;
			if (left + pickerWidth > window.innerWidth - 10) {
				left = window.innerWidth - pickerWidth - 10;
			}

			picker.style.top = `${top}px`;
			picker.style.left = `${left}px`;
		});
	});

	document.addEventListener("click", (e) => {
		if (!picker.contains(e.target) && !e.target.classList.contains("chat-emoji-btn")) {
			picker.classList.add("hidden");
		}
	});
}

function initUserProfile() {
	let savedName = localStorage.getItem("racer_username");
	if (!savedName) {
		savedName = generateBotName();
		localStorage.setItem("racer_username", savedName);
	}
	myUsername = savedName;
	resetToDefaultIcon();
	const profileName = document.getElementById("profile-name");
	if (profileName) profileName.innerText = myUsername;
}

// ==========================================
// THIẾT LẬP ADMIN
// ==========================================
function setupAdminControls() {
	const btnAdminGear = document.getElementById("btn-admin-gear");
	const adminLoginPopup = document.getElementById("admin-login-popup");
	const adminPasswordInput = document.getElementById("admin-password-input");
	const btnSubmitAdminLogin = document.getElementById("btn-submit-admin-login");
	const btnCancelAdminLogin = document.getElementById("btn-cancel-admin-login");
	const adminLoginError = document.getElementById("admin-login-error");

	btnAdminGear?.addEventListener("click", () => {
		if (!isAdmin) {
			adminPasswordInput.value = "";
			adminLoginError.classList.add("hidden");
			adminLoginPopup.classList.remove("hidden");
			adminPasswordInput.focus();
		} else {
			eraseCookie("admin_token");
			socket.emit("admin_logout");
		}
	});

	btnCancelAdminLogin?.addEventListener("click", () => {
		adminLoginPopup.classList.add("hidden");
	});

	btnSubmitAdminLogin?.addEventListener("click", () => {
		const pwd = adminPasswordInput.value.trim();
		if (pwd) {
			lastEnteredAdminPassword = pwd;
			socket.emit("admin_login", { password: pwd });
		}
	});

	adminPasswordInput?.addEventListener("keydown", (e) => {
		if (e.key === "Enter") btnSubmitAdminLogin.click();
	});

	document.getElementById("online-badge")?.addEventListener("click", () => {
		if (isAdmin) {
			renderOnlineUsersModal();
			document.getElementById("online-users-modal").classList.remove("hidden");
		}
	});

	document.getElementById("admin-banned-badge")?.addEventListener("click", () => {
		if (isAdmin) {
			renderBannedUsersModal();
			document.getElementById("banned-users-modal").classList.remove("hidden");
			startBannedModalTimer();
		}
	});

	document.getElementById("btn-close-online-users")?.addEventListener("click", () => {
		document.getElementById("online-users-modal").classList.add("hidden");
	});

	document.getElementById("btn-close-banned-users")?.addEventListener("click", () => {
		document.getElementById("banned-users-modal").classList.add("hidden");
		if (bannedModalTimer) clearInterval(bannedModalTimer);
	});

	document.getElementById("btn-close-ban-notice")?.addEventListener("click", () => {
		document.getElementById("ban-notice-popup").classList.add("hidden");
		if (banNoticeTimer) clearInterval(banNoticeTimer);
	});

	document.getElementById("btn-clear-chat")?.addEventListener("click", () => {
		if (isAdmin) socket.emit("admin_clear_chat");
	});
}

socket.on("admin_login_response", (res) => {
	const adminLoginError = document.getElementById("admin-login-error");
	const adminPasswordInput = document.getElementById("admin-password-input");

	if (res.success) {
		isAdmin = true;
		if (lastEnteredAdminPassword) {
			setCookie("admin_token", lastEnteredAdminPassword, 7);
		}
		document.getElementById("admin-login-popup").classList.add("hidden");
		updateAdminUI();
	} else {
		eraseCookie("admin_token");
		if (adminPasswordInput) {
			adminPasswordInput.value = "";
			adminPasswordInput.focus();
		}
		if (adminLoginError) {
			adminLoginError.innerText = res.message || "Mật khẩu Admin không chính xác!";
			adminLoginError.classList.remove("hidden");
		}
	}
});

socket.on("admin_logout_response", () => {
	isAdmin = false;
	eraseCookie("admin_token");
	updateAdminUI();
});

function updateBanBadgeVisibility() {
	const adminBannedBadge = document.getElementById("admin-banned-badge");
	if (isAdmin) {
		if (adminBannedBadge) adminBannedBadge.classList.remove("hidden");
	} else {
		if (adminBannedBadge) adminBannedBadge.classList.add("hidden");
		document.getElementById("banned-users-modal")?.classList.add("hidden");
		if (bannedModalTimer) clearInterval(bannedModalTimer);
	}
}

function updateAdminUI() {
	const btnAdminGear = document.getElementById("btn-admin-gear");
	const onlineBadge = document.getElementById("online-badge");
	const adminOnlyElements = document.querySelectorAll(".admin-only");
	const adminOnlyCols = document.querySelectorAll(".admin-only-col");

	if (isAdmin) {
		if (btnAdminGear) {
			btnAdminGear.innerText = "❌";
			btnAdminGear.title = "Thoát chế độ Admin";
		}
		if (onlineBadge) onlineBadge.classList.add("clickable");

		adminOnlyElements.forEach((el) => el.classList.remove("hidden"));
		adminOnlyCols.forEach((col) => col.classList.remove("hidden"));
	} else {
		if (btnAdminGear) {
			btnAdminGear.innerText = "⚙️";
			btnAdminGear.title = "Quản trị viên";
		}
		if (onlineBadge) onlineBadge.classList.remove("clickable");

		adminOnlyElements.forEach((el) => el.classList.add("hidden"));
		adminOnlyCols.forEach((col) => col.classList.add("hidden"));

		document.getElementById("online-users-modal")?.classList.add("hidden");
		document.getElementById("banned-users-modal")?.classList.add("hidden");
		if (bannedModalTimer) clearInterval(bannedModalTimer);
	}
	updateBanBadgeVisibility();
	loadHighScores();
	renderLobbyPlayers();
}

socket.on("admin_online_users", (users) => {
	adminOnlineUsers = users;
	if (!document.getElementById("online-users-modal").classList.contains("hidden")) {
		renderOnlineUsersModal();
	}
});

function renderOnlineUsersModal() {
	const tbody = document.getElementById("online-users-tbody");
	if (!tbody) return;
	tbody.innerHTML = "";

	adminOnlineUsers.forEach((u) => {
		const tr = document.createElement("tr");
		const isSelf = u.id === socket.id;

		let banBtn = "";
		if (u.isAdmin || isSelf) {
			banBtn = `<span style="color: var(--text-muted); font-size: 11px;">${isSelf ? "(Bạn)" : "(Admin)"}</span>`;
		} else if (u.isBanned) {
			banBtn = `<button class="btn-small btn-danger" disabled style="opacity: 0.5; cursor: not-allowed;" title="Người chơi đang bị cấm">Đã Ban</button>`;
		} else {
			banBtn = `<button class="btn-small btn-danger" onclick="banUser('${u.id}')">Ban</button>`;
		}

		tr.innerHTML = `
			<td style="font-weight: bold;">${u.username} ${u.isAdmin ? "👑" : ""}</td>
			<td style="font-size: 11px; color: var(--text-muted);">${u.id}</td>
			<td><span class="status-tag ${u.isBanned ? "surrendered" : "online"}">${u.isBanned ? "Đang Ban" : "Online"}</span></td>
			<td>${banBtn}</td>
		`;
		tbody.appendChild(tr);
	});
}

window.banUser = function (socketId) {
	if (isAdmin) socket.emit("admin_ban_user", { targetSocketId: socketId });
};

socket.on("admin_banned_users", (bannedList) => {
	adminBannedUsers = bannedList;
	const bannedCount = document.getElementById("banned-count");
	if (bannedCount) bannedCount.innerText = bannedList.length;

	if (!document.getElementById("banned-users-modal").classList.contains("hidden")) {
		renderBannedUsersModal();
	}
});

function startBannedModalTimer() {
	if (bannedModalTimer) clearInterval(bannedModalTimer);
	bannedModalTimer = setInterval(() => {
		const modal = document.getElementById("banned-users-modal");
		if (modal && !modal.classList.contains("hidden")) {
			renderBannedUsersModal();
		} else {
			clearInterval(bannedModalTimer);
		}
	}, 1000);
}

function renderBannedUsersModal() {
	const tbody = document.getElementById("banned-users-tbody");
	if (!tbody) return;
	tbody.innerHTML = "";

	if (adminBannedUsers.length === 0) {
		tbody.innerHTML = `<tr><td colspan="3" style="color: var(--text-muted);">Không có ai bị ban</td></tr>`;
		return;
	}

	const now = Date.now();
	adminBannedUsers.forEach((b) => {
		const tr = document.createElement("tr");
		const remainingSec = Math.max(0, Math.ceil((b.expiresAt - now) / 1000));
		const mins = Math.floor(remainingSec / 60);
		const secs = remainingSec % 60;
		const secsFormatted = secs < 10 ? `0${secs}` : secs;

		tr.innerHTML = `
			<td style="font-weight: bold;">${b.username} (${b.id})</td>
			<td style="color: var(--secondary); font-weight: bold;">${mins}m ${secsFormatted}s</td>
			<td><button class="btn-small btn-success" onclick="unbanUser('${b.id}')">Gỡ Ban</button></td>
		`;
		tbody.appendChild(tr);
	});
}

window.unbanUser = function (targetId) {
	if (isAdmin) socket.emit("admin_unban_user", { targetId: targetId });
};

function showBanNoticePopup(expiresAt, baseMsg) {
	const popup = document.getElementById("ban-notice-popup");
	const msgEl = document.getElementById("ban-notice-msg");
	if (!popup || !msgEl) return;

	if (banNoticeTimer) clearInterval(banNoticeTimer);

	function updateNoticeTimer() {
		const now = Date.now();
		const remainingSec = Math.max(0, Math.ceil((expiresAt - now) / 1000));

		if (remainingSec <= 0) {
			clearInterval(banNoticeTimer);
			msgEl.innerHTML = `Lệnh cấm đã hết hạn! Bạn có thể tham gia phòng chờ ngay bây giờ.`;
		} else {
			const mins = Math.floor(remainingSec / 60);
			const secs = remainingSec % 60;
			const secsFormatted = secs < 10 ? `0${secs}` : secs;
			msgEl.innerHTML = `${baseMsg}<br><br>⏱️ Thời gian cấm còn lại: <strong style="color: var(--secondary); font-size: 16px;">${mins} phút ${secsFormatted} giây</strong>`;
		}
	}

	updateNoticeTimer();
	banNoticeTimer = setInterval(updateNoticeTimer, 1000);
	popup.classList.remove("hidden");
}

socket.on("join_lobby_banned", (data) => {
	showBanNoticePopup(data.expiresAt, data.message || "Bạn đang bị cấm tham gia phòng chờ!");
});

socket.on("banned_notice", (data) => {
	showBanNoticePopup(data.expiresAt, data.message || "Bạn đã bị Admin tạm cấm 5 phút!");
	socket.emit("leave_lobby");
	resetToDefaultIcon();
	document.getElementById("lobby-screen").classList.add("hidden");
	document.getElementById("game-container").classList.add("hidden");
	document.getElementById("summary-modal").classList.add("hidden");
	document.getElementById("login-modal").classList.remove("hidden");
	loadHighScores();
	updateBanBadgeVisibility();
	const bgCanvas = document.getElementById("keyboard-bg-canvas");
	if (bgCanvas) bgCanvas.style.display = "block";
});

socket.on("clear_global_chat", () => {
	document.querySelectorAll(".global-chat-messages").forEach((container) => {
		container.innerHTML = "";
	});
});

window.kickLobbyPlayer = function (targetSocketId) {
	if (isAdmin) {
		socket.emit("admin_kick_lobby_player", { targetSocketId: targetSocketId });
	}
};

function showKickedPopup(message) {
	let popup = document.getElementById("kicked-notice-popup");
	if (!popup) {
		popup = document.createElement("div");
		popup.id = "kicked-notice-popup";
		popup.className = "custom-popup hidden";
		popup.innerHTML = `
			<div class="popup-content cyber-box kicked-popup-content">
				<div class="kicked-popup-icon">🚫</div>
				<h3 class="kicked-popup-title">BỊ ĐÁ KHỎI PHÒNG</h3>
				<p id="kicked-notice-msg" class="kicked-popup-msg"></p>
				<button id="btn-close-kicked-notice" class="cyber-btn">ĐÃ HIỂU</button>
			</div>
		`;
		document.body.appendChild(popup);

		document.getElementById("btn-close-kicked-notice")?.addEventListener("click", () => {
			popup.classList.add("hidden");
		});
	}

	const msgEl = document.getElementById("kicked-notice-msg");
	if (msgEl) msgEl.innerText = message || "Bạn đã bị Admin đá ra khỏi phòng chờ!";
	popup.classList.remove("hidden");
}

socket.on("kicked_from_lobby", (data) => {
	showKickedPopup(data.message || "Bạn đã bị Admin đá ra khỏi phòng chờ!");
	socket.emit("leave_lobby");
	resetToDefaultIcon();
	document.getElementById("lobby-screen").classList.add("hidden");
	document.getElementById("login-modal").classList.remove("hidden");
	loadHighScores();
	updateBanBadgeVisibility();
	const bgCanvas = document.getElementById("keyboard-bg-canvas");
	if (bgCanvas) bgCanvas.style.display = "block";
});

function renderIconPicker() {
	const grid = document.getElementById("icon-picker-grid");
	if (!grid) return;
	grid.innerHTML = "";

	const takenIcons = currentLobbyPlayers.filter((p) => p.id !== socket.id).map((p) => p.icon);

	runnerIcons.forEach((icon) => {
		const btn = document.createElement("button");
		btn.className = "icon-picker-btn";
		btn.innerText = icon;

		const me = currentLobbyPlayers.find((p) => p.id === socket.id);
		const isMyCurrentIcon = me && me.icon === icon;
		const isTaken = takenIcons.includes(icon);

		if (isMyCurrentIcon) btn.classList.add("active");

		if (isTaken) {
			btn.classList.add("disabled");
			btn.disabled = true;
		} else {
			btn.addEventListener("click", () => {
				mySelectedIcon = icon;
				socket.emit("select_icon", { icon: icon });
				document.getElementById("icon-select-popup").classList.add("hidden");
			});
		}
		grid.appendChild(btn);
	});
}

function renderLobbyPlayers() {
	const lobbyPlayersGrid = document.getElementById("lobby-players-grid");
	if (!lobbyPlayersGrid) return;
	lobbyPlayersGrid.innerHTML = "";

	currentLobbyPlayers.forEach((p) => {
		const card = document.createElement("div");
		card.className = "lobby-player-card";
		card.textContent = `${p.icon || DEFAULT_ICON} ${p.username} ${p.id === socket.id ? "(Bạn)" : ""}`;

		if (isAdmin && p.id !== socket.id) {
			const kickBtn = document.createElement("button");
			kickBtn.className = "kick-player-btn";
			kickBtn.innerHTML = "&times;";
			kickBtn.title = "Đá khỏi phòng";
			kickBtn.onclick = (e) => {
				e.stopPropagation();
				kickLobbyPlayer(p.id);
			};
			card.appendChild(kickBtn);
		}

		lobbyPlayersGrid.appendChild(card);
	});
}

socket.on("update_online_count", (count) => {
	const onlineCount = document.getElementById("online-count");
	if (onlineCount) onlineCount.innerText = count;
});

socket.on("init_high_scores", (scores) => {
	serverHighScores = scores;
	loadHighScores();
});

socket.on("update_high_scores", (scores) => {
	serverHighScores = scores;
	loadHighScores();
});

socket.on("update_lobby", (data) => {
	document.getElementById("login-modal").classList.add("hidden");
	document.getElementById("lobby-screen").classList.remove("hidden");
	updateBanBadgeVisibility();

	const bgCanvas = document.getElementById("keyboard-bg-canvas");
	if (bgCanvas) bgCanvas.style.display = "none";

	currentLobbyPlayers = data.players || [];
	const lobbyCount = document.getElementById("lobby-count");
	const lobbyModeDisplay = document.getElementById("lobby-mode-display");

	const me = currentLobbyPlayers.find((p) => p.id === socket.id);
	if (me) mySelectedIcon = me.icon;

	const activeLang = data.language || currentLanguage;
	if (lobbyModeDisplay)
		lobbyModeDisplay.innerText = `CHẾ ĐỘ: ${modeNames[activeLang] || activeLang}`;

	if (lobbyCount) lobbyCount.innerText = `${data.players.length}/10`;
	renderLobbyPlayers();
});

socket.on("game_start", (data) => {
	document.getElementById("lobby-screen").classList.add("hidden");
	document.getElementById("summary-modal").classList.add("hidden");
	document.getElementById("game-container").classList.remove("hidden");
	document.getElementById("chat-container").classList.remove("hidden");
	updateBanBadgeVisibility();

	currentWords = data.words;
	currentMatchPlayerCount = data.players ? data.players.length : 0;
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
			resetAFKTimer();
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
		currentSpan.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}
}

function handleTypingInput(e) {
	if (!isPlaying) return;

	const typeInput = document.getElementById("type-input");
	const val = typeInput.value;
	const currentWord = currentWords[wordIndex];
	const wordsDisplay = document.getElementById("words-display");
	const currentSpan = wordsDisplay.children[wordIndex];

	if (val.endsWith(" ")) {
		const typedWord = val.trim();
		if (typedWord === currentWord) {
			// Nhập chính xác và nhấn Space: Chuyển sang từ tiếp theo
			correctChars += currentWord.length + 1;
			if (currentSpan) {
				currentSpan.className = "word correct";
			}
			wordIndex++;
			typeInput.value = "";

			if (wordIndex >= currentWords.length) {
				finishGame();
				return;
			}

			renderWordsHighlight();
			scrollCurrentWordIntoView();
		} else {
			// Nhập sai và nhấn Space: Bị tính 1 lỗi, xóa chữ vừa nhập và bắt gõ lại chữ đó
			totalErrors++;
			typeInput.value = "";
			if (currentSpan) {
				currentSpan.className = "word current incorrect-typing";
			}
		}
	} else {
		if (currentWord.startsWith(val)) {
			if (currentSpan) currentSpan.className = "word current correct-typing";
		} else {
			if (currentSpan) currentSpan.className = "word current incorrect-typing";
		}
	}

	sendProgressUpdate();
}

function renderWordsHighlight() {
	const wordsDisplay = document.getElementById("words-display");
	Array.from(wordsDisplay.children).forEach((child, idx) => {
		if (idx < wordIndex) return;
		if (idx === wordIndex) {
			child.className = "word current correct-typing";
		} else {
			child.className = "word";
		}
	});
}

function sendProgressUpdate() {
	if (!isPlaying) return;
	const timeElapsedSec = Math.max(1, (Date.now() - startTime) / 1000);
	const wpm = Math.round(correctChars / 5 / (timeElapsedSec / 60));
	const progress = Math.min(100, Math.round((wordIndex / currentWords.length) * 100));

	socket.emit("update_progress", {
		progress: progress,
		wpm: wpm,
		correctChars: correctChars,
		errors: totalErrors,
	});
}

function finishGame() {
	if (!isPlaying) return;
	stopAutoTyperBot();
	isPlaying = false;
	clearAFKTimer();
	if (timerInterval) clearInterval(timerInterval);

	const timeElapsedSec = Math.max(1, (Date.now() - startTime) / 1000);
	const wpm = Math.round(correctChars / 5 / (timeElapsedSec / 60));

	document.getElementById("type-input").disabled = true;
	document.getElementById("status-box").innerText = "HOÀN THÀNH";

	socket.emit("player_finished", {
		wpm: wpm,
		correctChars: correctChars,
		errors: totalErrors,
	});
}

function surrenderGame(isAFK = false) {
	stopAutoTyperBot();
	isPlaying = false;
	clearAFKTimer();
	if (timerInterval) clearInterval(timerInterval);

	document.getElementById("type-input").disabled = true;
	document.getElementById("status-box").innerText = isAFK ? "AFK" : "ĐÃ ĐẦU HÀNG";

	socket.emit("surrender", { isAFK: isAFK });
}

function renderRaceTracks(players) {
	const container = document.getElementById("race-tracks-container");
	if (!container) return;
	container.innerHTML = "";

	players.forEach((p) => {
		const row = document.createElement("div");
		const isDisabled = p.isSurrendered || p.isDisconnected;
		row.className = `track-row ${isDisabled ? "disabled-track" : ""}`;

		let statusHtml = `${p.wpm || 0} WPM | ${p.progress || 0}%`;
		if (p.isSurrendered) {
			statusHtml = p.isAFK
				? `<span class="status-tag afk">AFK</span>`
				: `<span class="status-tag surrendered">GIẢNG HÒA</span>`;
		} else if (p.isDisconnected) {
			statusHtml = `<span class="status-tag disconnected">MẤT KẾT NỐI</span>`;
		}

		let trackFillColor = "var(--text-muted)";
		if (!isDisabled) {
			trackFillColor = p.id === socket.id ? "var(--primary)" : "var(--accent)";
		}

		row.innerHTML = `
			<div class="track-header">
				<span>${p.username} ${p.id === socket.id ? "(Bạn)" : ""}</span>
				<span>${statusHtml}</span>
			</div>
			<div class="track-line-bg">
				<div class="track-line-fill" style="width: ${p.progress || 0}%; background: ${trackFillColor};">
					<div class="runner-icon-badge">${p.icon || DEFAULT_ICON}</div>
				</div>
			</div>
		`;
		container.appendChild(row);
	});
}

socket.on("race_update", (players) => {
	renderRaceTracks(players);
});

socket.on("game_over", (leaderboard) => {
	stopAutoTyperBot();
	isPlaying = false;
	clearAFKTimer();
	if (timerInterval) clearInterval(timerInterval);

	document.getElementById("game-container").classList.add("hidden");
	document.getElementById("chat-container").classList.add("hidden");
	document.getElementById("summary-modal").classList.remove("hidden");

	const tbody = document.getElementById("summary-tbody");
	if (!tbody) return;
	tbody.innerHTML = "";

	leaderboard.forEach((p, idx) => {
		const tr = document.createElement("tr");

		if (idx === 0) {
			tr.classList.add("winner-row");
		} else if (leaderboard.length > 1 && idx === leaderboard.length - 1) {
			tr.classList.add("last-place-row");
		}

		let rankStr = `${idx + 1}`;
		if (idx === 0) rankStr = "🥇 1";
		else if (idx === 1) rankStr = "🥈 2";
		else if (idx === 2) rankStr = "🥉 3";

		let statusHtml = `${p.wpm || 0} WPM`;
		if (p.isSurrendered) {
			statusHtml = p.isAFK
				? `<span class="status-tag afk">AFK</span>`
				: `<span class="status-tag surrendered">GIẢNG HÒA</span>`;
		} else if (p.isDisconnected) {
			statusHtml = `<span class="status-tag disconnected">BẢY CHỌ</span>`;
		}

		tr.innerHTML = `
			<td>${rankStr}</td>
			<td>${p.icon || DEFAULT_ICON} ${p.username} ${p.id === socket.id ? "(Bạn)" : ""}</td>
			<td>${p.correctChars || 0}</td>
			<td>${statusHtml}</td>
			<td>${p.errors || 0}</td>
		`;
		tbody.appendChild(tr);
	});
});

function setupGlobalChat() {
	document.querySelectorAll(".global-chat-send-btn").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const wrapper = e.target.closest(".global-chat-input-wrapper");
			if (wrapper) {
				const input = wrapper.querySelector(".global-chat-input");
				const msg = input.value.trim();
				if (msg) {
					socket.emit("send_global_chat", { username: myUsername, message: msg });
					input.value = "";
				}
			}
		});
	});

	document.querySelectorAll(".global-chat-input").forEach((input) => {
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				const msg = input.value.trim();
				if (msg) {
					socket.emit("send_global_chat", { username: myUsername, message: msg });
					input.value = "";
				}
			}
		});
	});
}

socket.on("load_initial_messages", (messages) => {
	document.querySelectorAll(".global-chat-messages").forEach((container) => {
		container.innerHTML = "";
		messages.forEach((msg) => appendGlobalChatMessage(container, msg));
	});
});

socket.on("receive_global_chat", (msg) => {
	document.querySelectorAll(".global-chat-messages").forEach((container) => {
		appendGlobalChatMessage(container, msg);
	});
});

function appendGlobalChatMessage(container, msg) {
	const div = document.createElement("div");
	div.className = "chat-msg-item";

	const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});

	div.innerHTML = `
		<span class="chat-msg-user">${msg.username}:</span>
		<span class="chat-msg-text">${msg.message}</span>
		<span class="chat-msg-time">${timeStr}</span>
	`;

	container.appendChild(div);
	container.scrollTop = container.scrollHeight;
}

socket.on("receive_in_game_chat", (data) => {
	showInGameChatBubble(data.username, data.message);
});

function showInGameChatBubble(username, message) {
	const popupsContainer = document.getElementById("chat-popups");
	if (!popupsContainer) return;

	const bubble = document.createElement("div");
	bubble.className = "chat-bubble";
	bubble.innerHTML = `
		<span class="sender">${username}</span>
		<span class="text">${message}</span>
	`;

	popupsContainer.appendChild(bubble);

	setTimeout(() => {
		bubble.remove();
	}, 4000);
}
