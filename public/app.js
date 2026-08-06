const socket = io();

const loginModal = document.getElementById("login-modal");
const joinBtn = document.getElementById("join-btn");
const usernameInput = document.getElementById("username-input");
const langSelect = document.getElementById("lang-select");

const lobbyScreen = document.getElementById("lobby-screen");
const lobbyCountdown = document.getElementById("lobby-countdown");
const lobbyCount = document.getElementById("lobby-count");
const lobbyPlayersGrid = document.getElementById("lobby-players-grid");

const gameContainer = document.getElementById("game-container");
const statusBox = document.getElementById("status-box");
const timerEl = document.getElementById("timer");
const playersList = document.getElementById("players-list");
const wordsDisplay = document.getElementById("words-display");
const typeInput = document.getElementById("type-input");

const summaryModal = document.getElementById("summary-modal");
const summaryTbody = document.getElementById("summary-tbody");

const chatContainer = document.getElementById("chat-container");
const chatInput = document.getElementById("chat-input");
const chatPopups = document.getElementById("chat-popups");

let words = [];
let currentWordIndex = 0;
let raceStarted = false;
let timerInterval = null;
let raceStartTime = null;

joinBtn.addEventListener("click", () => {
	const username = usernameInput.value.trim();
	if (!username) return alert("Vui lòng nhập tên!");

	socket.emit("join_game", {
		username: username,
		lang: langSelect.value,
	});

	loginModal.classList.add("hidden");
	lobbyScreen.classList.remove("hidden");
});

socket.on("room_update", (data) => {
	words = data.words;
	renderWords();
	renderPlayers(data.players);
	renderLobbyPlayers(data.players);

	lobbyCount.innerText = `${data.players.length}/7`;
	if (data.countdown) lobbyCountdown.innerText = data.countdown;
});

socket.on("countdown_tick", (count) => {
	lobbyCountdown.innerText = count;
});

socket.on("start_race", () => {
	raceStarted = true;
	lobbyScreen.classList.add("hidden");
	gameContainer.classList.remove("hidden");

	typeInput.disabled = false;
	typeInput.placeholder = "Gõ từ và ấn Space...";
	typeInput.focus();
	highlightCurrentWord();
});

socket.on("race_start_timer", () => {
	raceStartTime = Date.now();
	timerInterval = setInterval(() => {
		const elapsed = ((Date.now() - raceStartTime) / 1000).toFixed(1);
		timerEl.innerText = elapsed;
	}, 100);
});

typeInput.addEventListener("input", () => {
	if (!raceStarted) return;

	const currentWord = words[currentWordIndex];
	const val = typeInput.value;

	if (val.endsWith(" ")) {
		const typedWord = val.trim();
		if (typedWord === currentWord) {
			const wordSpan = document.getElementById(`word-${currentWordIndex}`);
			if (wordSpan) wordSpan.className = "word correct";

			currentWordIndex++;
			typeInput.value = "";

			const timeSpentMinutes = (Date.now() - raceStartTime) / 60000;
			const wpm = timeSpentMinutes > 0 ? Math.round(currentWordIndex / timeSpentMinutes) : 0;

			socket.emit("type_progress", { wordIndex: currentWordIndex, wpm });

			if (currentWordIndex < words.length) {
				highlightCurrentWord();
			} else {
				typeInput.disabled = true;
				typeInput.placeholder = "BẠN ĐÃ HOÀN THÀNH!";
				statusBox.innerText = "HOÀN THÀNH!";
				clearInterval(timerInterval);
				chatContainer.classList.remove("hidden");
			}
		} else {
			typeInput.classList.add("flash-red");
			setTimeout(() => typeInput.classList.remove("flash-red"), 200);
			typeInput.value = "";
		}
	}
});

function renderWords() {
	wordsDisplay.innerHTML = words
		.map((w, i) => `<span id="word-${i}" class="word">${w}</span>`)
		.join(" ");
}

function highlightCurrentWord() {
	const prev = document.querySelector(".word.current");
	if (prev) prev.classList.remove("current");

	const current = document.getElementById(`word-${currentWordIndex}`);
	if (current) {
		current.classList.add("current");
		current.scrollIntoView({ behavior: "smooth", block: "center" });
	}
}

function renderLobbyPlayers(players) {
	lobbyPlayersGrid.innerHTML = players
		.map(
			(p) => `
    <div class="lobby-player-card">
      ⚡ ${p.username}
    </div>
  `,
		)
		.join("");
}

function renderPlayers(players) {
	const medals = ["🥇 TOP 1", "🥈 TOP 2", "🥉 TOP 3"];
	playersList.innerHTML = players
		.map((p) => {
			let badge = "";
			let timeText = p.finishTime ? `<span class="time-tag">⏱️ ${p.finishTime}s</span>` : "";
			if (p.finished && p.rank <= 3) {
				badge = medals[p.rank - 1];
			}
			return `
      <div class="player-row">
        <div class="player-info">
          <span class="name">${badge} ${p.username} ${timeText}</span>
          <span class="stats">${p.wpm} WPM (${p.progress}%)</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${p.progress}%"></div>
        </div>
      </div>
    `;
		})
		.join("");
}

socket.on("progress_update", (data) => renderPlayers(data.players));

socket.on("match_finished", ({ players }) => {
	clearInterval(timerInterval);
	summaryTbody.innerHTML = players
		.sort((a, b) => (a.rank || 99) - (b.rank || 99))
		.map(
			(p, index) => `
      <tr>
        <td>${p.rank ? "TOP " + p.rank : "DNF"}</td>
        <td style="color:var(--primary); font-weight:bold;">${p.username}</td>
        <td>${p.finishTime || "---"}s</td>
        <td style="color:var(--accent); font-weight:bold;">${p.wpm} WPM</td>
      </tr>
    `,
		)
		.join("");

	summaryModal.classList.remove("hidden");
});

chatInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter" && chatInput.value.trim()) {
		socket.emit("send_chat", chatInput.value.trim());
		chatInput.value = "";
	}
});

socket.on("new_chat", ({ username, message }) => {
	const bubble = document.createElement("div");
	bubble.className = "chat-bubble";
	bubble.innerHTML = `<span class="sender">💬 ${username}</span>${message}`;
	chatPopups.appendChild(bubble);

	// Giữ tin nhắn hiển thị trong 4 giây rồi ẩn dần
	setTimeout(() => {
		bubble.style.transition = "opacity 0.5s ease";
		bubble.style.opacity = "0";
		setTimeout(() => bubble.remove(), 500);
	}, 4000);
});

// Canvas Pháo hoa
const canvas = document.getElementById("fireworks-canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on("winner_celebration", () => triggerFireworks());

function triggerFireworks() {
	let particles = [];
	for (let i = 0; i < 120; i++) {
		particles.push({
			x: canvas.width / 2,
			y: canvas.height / 2,
			vx: (Math.random() - 0.5) * 15,
			vy: (Math.random() - 0.5) * 15,
			color: `hsl(${Math.random() * 360}, 100%, 60%)`,
			alpha: 1,
		});
	}
	function animate() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		particles.forEach((p, index) => {
			p.x += p.vx;
			p.y += p.vy;
			p.alpha -= 0.015;
			ctx.fillStyle = p.color;
			ctx.globalAlpha = Math.max(0, p.alpha);
			ctx.beginPath();
			ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
			ctx.fill();
			if (p.alpha <= 0) particles.splice(index, 1);
		});
		if (particles.length > 0) requestAnimationFrame(animate);
	}
	animate();
}
