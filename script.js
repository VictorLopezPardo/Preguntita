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
    drawLetterBoxes(answer); // donde answer es la palabra correcta
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

function drawLetterBoxes(word) {
  const container = document.getElementById("letterContainer");
  container.innerHTML = "";

  for (let i = 0; i < word.length; i++) {
    const input = document.createElement("input");
    input.classList.add("letterBox");
    input.maxLength = 1;

    input.dataset.index = i;

    // comportamiento: escribir → avanzar
    input.addEventListener("input", (e) => {
      const value = e.target.value.toUpperCase();
      e.target.value = value;

      const next = document.querySelector(`input[data-index="${i + 1}"]`);
      if (value && next) next.focus();
    });

    // Backspace → retroceder
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value) {
        const prev = document.querySelector(`input[data-index="${i - 1}"]`);
        if (prev) prev.focus();
      }
    });

    container.appendChild(input);
  }

  // Foco en el primero
  container.firstChild.focus();
}
function getTypedAnswer() {
  const boxes = document.querySelectorAll(".letterBox");
  return Array.from(boxes).map(b => b.value).join("");
}

// Guess checking
document.getElementById("checkBtn").addEventListener("click", () => {
  const attempt = getTypedAnswer();
  if (attempt === answer) {
    feedback.textContent = "🎉 ¡Correcto!";
    feedback.style.color = "green";

    saveWin();
    document.getElementById("shareBtn").style.display = "block";
    document.querySelectorAll(".letterBox").forEach((box, i) => {
      setTimeout(() => box.classList.add("flip"), i * 80);
    });
    revealAll();
  } else {
    feedback.textContent = "❌ Incorrecto";
    feedback.style.color = "red";
    feedback.classList.add("shake");
    setTimeout(() => feedback.classList.remove("shake"), 500);

  }
});

// Reveal one letter (hint)
document.getElementById("hintBtn").addEventListener("click", () => {
  const boxes = document.querySelectorAll(".letterBox");

  const emptyIndices = Array.from(boxes)
    .map((b, i) => (!b.value ? i : null))
    .filter(i => i !== null);

  if (emptyIndices.length === 0) return;

  const i = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

  boxes[i].value = answer[i];
  boxes[i].classList.add("pop"); // si tienes la animación pop
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
