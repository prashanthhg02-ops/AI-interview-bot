const stageOrder = ["role", "experience", "project", "challenge", "strength", "complete"];
const messages = document.querySelector("#messages");
const welcome = document.querySelector("#welcome");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const composer = document.querySelector("#composer");
const answerInput = document.querySelector("#answer");
const sendButton = composer.querySelector("button[type='submit']");
const progressCount = document.querySelector("#progress-count");
const progressFill = document.querySelector("#progress-fill");
const composerHint = document.querySelector("#composer-hint");

let sessionId = null;
let busy = false;

function addMessage(role, text) {
  const message = document.createElement("article");
  message.className = `message message-${role}`;

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "bot" ? "COACH" : "YOU";

  const body = document.createElement("p");
  body.textContent = text;
  message.append(label, body);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

function updateProgress(stage) {
  const stageIndex = stageOrder.indexOf(stage);
  const completed = stage === "complete" ? 5 : Math.max(0, stageIndex);
  progressCount.textContent = `${completed} / 5`;
  progressFill.style.width = `${completed * 20}%`;

  document.querySelectorAll(".step").forEach((step, index) => {
    step.classList.toggle("is-done", index < completed);
    step.classList.toggle("is-current", stage !== "complete" && index === stageIndex);
  });

  if (stage === "complete") {
    composerHint.textContent = "Round complete. Start a new one whenever you're ready.";
    answerInput.placeholder = "Start a new round to continue…";
    answerInput.disabled = true;
    sendButton.disabled = true;
  } else {
    composerHint.textContent = "Your practice stays in this session.";
    answerInput.placeholder = "Write your answer…";
    answerInput.disabled = false;
    sendButton.disabled = busy;
  }
}

async function requestJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

async function startInterview() {
  if (busy) return;
  busy = true;
  startButton.disabled = true;
  restartButton.disabled = true;

  try {
    const data = await requestJson("/api/start", {});
    sessionId = data.sessionId;
    welcome.remove();
    messages.replaceChildren();
    addMessage("bot", data.reply);
    updateProgress(data.stage);
    restartButton.disabled = false;
    answerInput.focus();
  } catch (error) {
    showError(error.message);
    startButton.disabled = false;
  } finally {
    busy = false;
  }
}

function showError(text) {
  const notice = document.createElement("p");
  notice.className = "error-notice";
  notice.textContent = text;
  messages.append(notice);
  messages.scrollTop = messages.scrollHeight;
}

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = answerInput.value.trim();
  if (!text || !sessionId || busy) return;

  busy = true;
  answerInput.value = "";
  answerInput.disabled = true;
  sendButton.disabled = true;
  addMessage("user", text);

  try {
    const data = await requestJson("/api/chat", { sessionId, message: text });
    addMessage("bot", data.reply);
    updateProgress(data.stage);
  } catch (error) {
    showError(error.message);
    answerInput.value = text;
  } finally {
    busy = false;
    if (document.querySelector("#answer").disabled === false) {
      sendButton.disabled = !answerInput.value.trim();
      answerInput.focus();
    }
  }
});

answerInput.addEventListener("input", () => {
  sendButton.disabled = busy || answerInput.disabled || !answerInput.value.trim();
  answerInput.style.height = "auto";
  answerInput.style.height = `${Math.min(answerInput.scrollHeight, 144)}px`;
});

answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    composer.requestSubmit();
  }
});

startButton.addEventListener("click", startInterview);
restartButton.addEventListener("click", startInterview);