let todayPuzzle = null;
let revealed = [];
let answer = "";
let todayKey = new Date().toISOString().slice(0,10);

// Load puzzles
fetch("puzzles.json")
  .then(res => res.json())
  .then(data => {
    todayPuzzle = getPuzzleOfTheDay(data.puzzles, data.startDate);
    answer = todayPuzzle.answer.toUpperCase();
    revealed = Array(answer.length).fill(false);
    renderBoxes();
    document.getElementById("clue").textContent = todayPuzzle.clue;

    loadStreak();
  });

// Select puzzle of the day
function getPuzzleOfTheDay(puzzles, startDate) {
  const today = new Date();
  const start = new Date(startDate);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return puzzles[diffDays % puzzles.length];
}

// Render empty letter boxes
function renderBoxes() {
  const box = document.getElementById("answerBox");
  box.innerHTML = "";
  for (let i = 0; i < answer.length; i++) {
    const div = document.createElement("div");
    div.className = "letterBox";
    if (revealed[i]) {
      div.textContent = answer[i];
      div.classList.add("revealed");
    }
    box.appendChild(div);
  }
}

// Guess checking
document.getElementById("checkBtn").addEventListener("click", () => {
  const input = document.getElementById("answerInput").value.trim().toUpperCase();
  const feedback = document.getElementById("feedback");

  if (input === answer) {
    feedback.textContent = "🎉 ¡Correcto!";
    feedback.style.color = "green";

    saveWin();
    document.getElementById("shareBtn").style.display = "block";

    revealAll();
  } else {
    feedback.textContent = "❌ Incorrecto";
    feedback.style.color = "red";
  }
});

// Reveal one letter (hint)
document.getElementById("hintBtn").addEventListener("click", () => {
  const indices = [];
  for (let i = 0; i < answer.length; i++) {
    if (!revealed[i]) indices.push(i);
  }
  if (indices.length === 0) return;

  const idx = indices[Math.floor(Math.random() * indices.length)];
  revealed[idx] = true;
  renderBoxes();
});

// Reveal entire word after success
function revealAll() {
  revealed = revealed.map(() => true);
  renderBoxes();
}

// Save streak data
function saveWin() {
  localStorage.setItem(todayKey, "true");

  let streak = parseInt(localStorage.getItem("streak") || "0");
  let last = localStorage.getItem("lastWin");

  if (last) {
    const diff = dateDiffInDays(new Date(last), new Date());
    if (diff === 1) streak++;
    else streak = 1;
  } else {
    streak = 1;
  }

  localStorage.setItem("streak", streak);
  localStorage.setItem("lastWin", todayKey);

  document.getElementById("streak").textContent = `🔥 Racha: ${streak}`;
}

// Load streak
function loadStreak() {
  const streak = localStorage.getItem("streak");
  if (localStorage.getItem(todayKey)) {
    document.getElementById("shareBtn").style.display = "block";
  }
  document.getElementById("streak").textContent = streak ? `🔥 Racha: ${streak}` : "🔥 Racha: 0";
}

function dateDiffInDays(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

// Share results
document.getElementById("shareBtn").addEventListener("click", async () => {
  const text = `Preguntita\nPista: ${todayPuzzle.clue}\n¡Lo acerté!\nRacha: ${localStorage.getItem("streak")}`;

  try {
    await navigator.clipboard.writeText(text);
    alert("Resultado copiado al portapapeles");
  } catch {
    alert("No se pudo copiar automáticamente");
  }
});
