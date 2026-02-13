// ---------- Personalization config ----------
const CONFIG = {
  wifeName: "MY_WIFE_NAME",
  yourName: "MY_NAME",
  anniversaryDate: "YYYY-MM-DD",
  accentEmoji: "💖",
  optionalEmbedUrl: "",
};

const STORAGE_KEY = "love-quiz-state-v1";

const QUESTIONS = [
  {
    id: "bestDate",
    type: "choice",
    title: "Where was our best date?",
    hint: "Choose one sweet memory.",
    options: ["Our first dinner", "That surprise road trip", "Movie + snacks night", "Every day with you"],
  },
  {
    id: "loveMeter",
    type: "slider",
    title: "How much do you love me today?",
    hint: "Use the slider for today's score.",
    min: 1,
    max: 100,
    step: 1,
  },
  {
    id: "favoriteThing",
    type: "text",
    title: "One thing you love about us?",
    hint: "A short line is enough.",
    placeholder: "I love that we...",
  },
  {
    id: "songMood",
    type: "choice",
    title: "Which song feels most like us?",
    hint: "Pick the vibe.",
    options: ["Soft and cozy", "Energetic and playful", "Classic romantic", "Our own inside-joke song"],
  },
  {
    id: "futurePlan",
    type: "text",
    title: "A dream date we should plan soon?",
    hint: "It can be simple or grand.",
    placeholder: "Let's go...",
  },
  {
    id: "smileMoment",
    type: "choice",
    title: "When do I make you smile the most?",
    hint: "Pick your favorite moment.",
    options: ["When I laugh", "When I surprise you", "When we cook together", "When we do nothing, just together"],
  },
  {
    id: "promise",
    type: "text",
    title: "Write one tiny promise for us.",
    hint: "Just a sentence from your heart.",
    placeholder: "I promise to...",
  },
];

const state = {
  currentStep: 0,
  started: false,
  answers: {},
};

const ui = {
  startScreen: document.getElementById("startScreen"),
  quizScreen: document.getElementById("quizScreen"),
  resultScreen: document.getElementById("resultScreen"),
  startTitle: document.getElementById("startTitle"),
  introText: document.getElementById("introText"),
  startBtn: document.getElementById("startBtn"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
  progressBar: document.querySelector(".progress-bar"),
  questionTitle: document.getElementById("questionTitle"),
  questionHint: document.getElementById("questionHint"),
  questionInput: document.getElementById("questionInput"),
  validationMsg: document.getElementById("validationMsg"),
  quizForm: document.getElementById("quizForm"),
  backBtn: document.getElementById("backBtn"),
  nextBtn: document.getElementById("nextBtn"),
  resultHeading: document.getElementById("resultHeading"),
  resultSummary: document.getElementById("resultSummary"),
  loveLetterText: document.getElementById("loveLetterText"),
  playSurpriseBtn: document.getElementById("playSurpriseBtn"),
  shareBtn: document.getElementById("shareBtn"),
  savePageBtn: document.getElementById("savePageBtn"),
  restartBtn: document.getElementById("restartBtn"),
  videoSection: document.getElementById("videoSection"),
  videoContainer: document.getElementById("videoContainer"),
  muteToggleBtn: document.getElementById("muteToggleBtn"),
  replayBtn: document.getElementById("replayBtn"),
  heartsLayer: document.getElementById("heartsLayer"),
};

let playerRef = null;

init();

function init() {
  hydrateConfigText();
  loadFromStorage();
  spawnHearts();

  ui.startBtn.addEventListener("click", handleStart);
  ui.quizForm.addEventListener("submit", handleNext);
  ui.backBtn.addEventListener("click", handleBack);
  ui.playSurpriseBtn.addEventListener("click", revealVideo);
  ui.shareBtn.addEventListener("click", handleShare);
  ui.savePageBtn.addEventListener("click", showSaveInstructions);
  ui.restartBtn.addEventListener("click", restartQuiz);
  ui.muteToggleBtn.addEventListener("click", toggleMute);
  ui.replayBtn.addEventListener("click", replayVideo);

  if (state.started) {
    showQuizScreen();
    renderQuestion();
  }
}

function hydrateConfigText() {
  ui.startTitle.textContent = `A Little Love Surprise ${CONFIG.accentEmoji}`;
  ui.introText.textContent = `For you, ${CONFIG.wifeName}. I made this tiny surprise with all my love.`;
  ui.resultHeading.textContent = `For you, ${CONFIG.wifeName} ${CONFIG.accentEmoji}`;
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed) {
      state.currentStep = Number.isInteger(parsed.currentStep) ? Math.min(parsed.currentStep, QUESTIONS.length) : 0;
      state.answers = parsed.answers || {};
      state.started = Boolean(parsed.started);
      if (state.currentStep >= QUESTIONS.length) {
        showResultScreen();
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function handleStart() {
  state.started = true;
  persist();
  showQuizScreen();
  renderQuestion();
}

function showQuizScreen() {
  ui.startScreen.classList.add("hidden");
  ui.resultScreen.classList.add("hidden");
  ui.quizScreen.classList.remove("hidden");
}

function renderQuestion() {
  const question = QUESTIONS[state.currentStep];
  if (!question) {
    showResultScreen();
    return;
  }

  ui.validationMsg.textContent = "";
  ui.questionTitle.textContent = question.title;
  ui.questionHint.textContent = question.hint;
  ui.questionInput.innerHTML = "";

  const answered = state.answers[question.id];

  if (question.type === "choice") {
    renderChoices(question, answered);
  } else if (question.type === "slider") {
    renderSlider(question, answered);
  } else {
    renderTextInput(question, answered);
  }

  ui.backBtn.disabled = state.currentStep === 0;
  ui.nextBtn.textContent = state.currentStep === QUESTIONS.length - 1 ? "Finish" : "Next";
  updateProgress();
}

function renderChoices(question, selectedValue) {
  const fieldset = document.getElementById("radioTemplate").content.firstElementChild.cloneNode(true);
  fieldset.setAttribute("aria-label", question.title);

  question.options.forEach((option, i) => {
    const id = `${question.id}-${i}`;
    const label = document.createElement("label");
    label.className = "option";
    label.setAttribute("for", id);

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = question.id;
    radio.id = id;
    radio.value = option;
    radio.required = true;
    if (selectedValue === option) radio.checked = true;

    const span = document.createElement("span");
    span.textContent = option;

    label.append(radio, span);
    fieldset.append(label);
  });

  ui.questionInput.append(fieldset);
}

function renderSlider(question, value) {
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = question.min;
  slider.max = question.max;
  slider.step = question.step;
  slider.value = value || "70";
  slider.id = question.id;
  slider.setAttribute("aria-label", question.title);

  const preview = document.createElement("p");
  preview.id = "rangeValue";
  preview.textContent = `${slider.value}/100`;

  slider.addEventListener("input", () => {
    preview.textContent = `${slider.value}/100`;
  });

  ui.questionInput.append(slider, preview);
}

function renderTextInput(question, value) {
  const input = document.createElement("textarea");
  input.rows = 3;
  input.id = question.id;
  input.placeholder = question.placeholder;
  input.value = value || "";
  input.maxLength = 180;
  input.required = true;
  input.setAttribute("aria-label", question.title);
  ui.questionInput.append(input);
}

function updateProgress() {
  const total = QUESTIONS.length;
  const current = state.currentStep + 1;
  const percent = (current / total) * 100;

  ui.progressText.textContent = `${current}/${total}`;
  ui.progressFill.style.width = `${percent}%`;
  ui.progressBar.setAttribute("aria-valuenow", String(current));
  ui.progressBar.setAttribute("aria-valuemax", String(total));
}

function handleNext(event) {
  event.preventDefault();
  const question = QUESTIONS[state.currentStep];
  const answer = getCurrentAnswer(question);

  if (!answer) {
    ui.validationMsg.textContent = "Please add an answer before moving on.";
    return;
  }

  state.answers[question.id] = answer;
  state.currentStep += 1;
  persist();

  if (state.currentStep >= QUESTIONS.length) {
    showResultScreen();
  } else {
    renderQuestion();
  }
}

function getCurrentAnswer(question) {
  if (question.type === "choice") {
    const selected = ui.questionInput.querySelector("input[type='radio']:checked");
    return selected?.value || "";
  }

  if (question.type === "slider") {
    const slider = ui.questionInput.querySelector("input[type='range']");
    return slider ? Number(slider.value) : "";
  }

  const input = ui.questionInput.querySelector("textarea");
  return input ? input.value.trim() : "";
}

function handleBack() {
  if (state.currentStep <= 0) return;
  state.currentStep -= 1;
  persist();
  renderQuestion();
}

function showResultScreen() {
  ui.startScreen.classList.add("hidden");
  ui.quizScreen.classList.add("hidden");
  ui.resultScreen.classList.remove("hidden");
  renderResultText();
}

function renderResultText() {
  const a = state.answers;
  const yearsTogether = getYearsTogether(CONFIG.anniversaryDate);

  ui.resultSummary.textContent =
    yearsTogether >= 0
      ? `${CONFIG.wifeName}, every answer feels like us. ${yearsTogether} year(s) of love and still my favorite person every day.`
      : `${CONFIG.wifeName}, every answer feels like us. You are still my favorite person every day.`;

  ui.loveLetterText.textContent = `My dearest ${CONFIG.wifeName}, when I think of us I remember ${a.bestDate || "our best moments"}. I love how ${a.favoriteThing || "we are a team"}. Let's make ${a.futurePlan || "more beautiful plans"} real, and I promise ${a.promise || "to keep choosing you"}. Forever yours, ${CONFIG.yourName}.`;
  persist();
}

function revealVideo() {
  ui.videoSection.hidden = false;

  // Create only once
  if (playerRef) {
    safePlay();
    return;
  }

  const embedSrc = toEmbedUrl(CONFIG.optionalEmbedUrl);

  if (embedSrc) {
    const iframe = document.createElement("iframe");
    iframe.src = embedSrc;
    iframe.title = "Surprise video embed";
    iframe.loading = "lazy";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    playerRef = iframe;
    ui.videoContainer.append(iframe);
    // External embed controlled by provider.
    ui.muteToggleBtn.hidden = true;
    ui.replayBtn.hidden = true;
    return;
  }

  const video = document.createElement("video");
  video.src = "assets/kiss.mp4";
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.setAttribute("aria-label", "Surprise kissing video");
  playerRef = video;
  ui.videoContainer.append(video);
  ui.muteToggleBtn.hidden = false;
  ui.replayBtn.hidden = false;
  safePlay();
}

function safePlay() {
  if (playerRef && playerRef.tagName === "VIDEO") {
    playerRef.play().catch(() => {
      ui.validationMsg.textContent = "Tap play on the video if autoplay is blocked on your browser.";
    });
  }
}

function toggleMute() {
  if (playerRef && playerRef.tagName === "VIDEO") {
    playerRef.muted = !playerRef.muted;
    ui.muteToggleBtn.textContent = playerRef.muted ? "Unmute" : "Mute";
  }
}

function replayVideo() {
  if (playerRef && playerRef.tagName === "VIDEO") {
    playerRef.currentTime = 0;
    safePlay();
  }
}

async function handleShare() {
  const text = `A tiny love surprise for ${CONFIG.wifeName} ${CONFIG.accentEmoji}`;
  const url = window.location.href;

  try {
    if (navigator.share) {
      await navigator.share({ title: "Love Surprise", text, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    alert("Link copied! You can now send it in a message.");
  } catch {
    alert("Sharing is not available on this device.");
  }
}

function showSaveInstructions() {
  alert(
    "Save this page:\n\n• iPhone (Safari): Tap Share → Add to Home Screen\n• Android (Chrome): Menu ⋮ → Add to Home screen\n• Desktop: Bookmark this page (Ctrl/Cmd + D)"
  );
}

function restartQuiz() {
  state.currentStep = 0;
  state.answers = {};
  state.started = false;
  localStorage.removeItem(STORAGE_KEY);
  playerRef = null;
  ui.videoSection.hidden = true;
  ui.videoContainer.innerHTML = "";
  ui.muteToggleBtn.hidden = true;
  ui.replayBtn.hidden = true;
  ui.validationMsg.textContent = "";

  ui.resultScreen.classList.add("hidden");
  ui.quizScreen.classList.add("hidden");
  ui.startScreen.classList.remove("hidden");
}

function toEmbedUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) return "";

  try {
    const url = new URL(rawUrl.trim());
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${encodeURIComponent(v)}?autoplay=1&rel=0` : "";
    }

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0` : "";
    }

    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1` : "";
    }
  } catch {
    return "";
  }

  return "";
}

function getYearsTogether(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return -1;
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const beforeAnniversary =
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate());

  if (beforeAnniversary) years -= 1;
  return Math.max(0, years);
}

function spawnHearts() {
  const symbols = ["💖", "💕", "💘"];
  setInterval(() => {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${12 + Math.random() * 18}px`;
    heart.style.animationDuration = `${9 + Math.random() * 8}s`;
    ui.heartsLayer.append(heart);

    setTimeout(() => heart.remove(), 17000);
  }, 950);
}
