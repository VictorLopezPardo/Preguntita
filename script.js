// script.js - versión completa y robusta para Preguntita
// Requisitos: en el HTML debe existir #clue, #letterContainer, #checkBtn, #hintBtn, #shareBtn, #streak, #feedback

// ---------- Variables globales ----------
let todayPuzzle = null;
let answer = "";
let todayKey = new Date().toISOString().slice(0,10);

// ---------- Utilidades ----------
function dateDiffInDays(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function getPuzzleOfTheDay(puzzles, startDate) {
  const today = new Date();
  const start = new Date(startDate);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return puzzles[diffDays % puzzles.length];
}

// ---------- Dibuja las casillas y su lógica ----------
function drawLetterBoxes(word, onSubmit) {
  const container = document.getElementById("letterContainer");
  if (!container) {
    console.error("No existe #letterContainer en el DOM");
    return;
  }

  container.innerHTML = ""; // limpiar

  for (let i = 0; i < word.length; i++) {
    const box = document.createElement("input");
    box.classList.add("letterBox");
    box.type = "text";
    box.maxLength = 1;
    box.dataset.index = i;

    // Input: siempre minúsculas, reemplaza y avanza
    box.addEventListener("input", (e) => {
      // fuerza minúscula
      e.target.value = (e.target.value || "").toLowerCase();

      // marcar filled y animar
      if (e.target.value) {
        e.target.classList.add("filled");
        e.target.classList.add("pop");
        // quitar la clase pop después de la animación
        setTimeout(() => e.target.classList.remove("pop"), 180);
      } else {
        e.target.classList.remove("filled");
      }

      // Avanzar al siguiente si existe
      const next = document.querySelector(`input[data-index="${i + 1}"]`);
      if (e.target.value && next) next.focus();
    });

    // Teclas: Enter, Backspace, y reemplazo al escribir sobre letra
    box.addEventListener("keydown", (e) => {
      // Enter -> envío
      if (e.key === "Enter") {
        e.preventDefault();
        if (typeof onSubmit === "function") onSubmit(getTypedAnswer());
        return;
      }

      // Backspace -> si está vacío, retroceder
      if (e.key === "Backspace" && !box.value) {
        const prev = document.querySelector(`input[data-index="${i - 1}"]`);
        if (prev) {
          prev.focus();
          // prevenir comportamiento nativo que podría borrar antes de tiempo
          e.preventDefault();
        }
        return;
      }

      // Si se escribe sobre letra ya escrita -> limpiar primero (para reemplazar)
      // e.key.length === 1 filtra teclas imprimibles
      if (e.key.length === 1 && box.value.length === 1) {
        box.value = "";
        box.classList.remove("filled");
      }
    });

    container.appendChild(box);
  }

  // poner foco en la primera caja disponible
  const first = container.querySelector('input[data-index="0"]');
  if (first) first.focus();
}

// obtener la palabra tecleada
function getTypedAnswer() {
  return Array.from(document.querySelectorAll(".letterBox")).map(b => b.value || "").join("");
}

// ---------- Animación shake ----------
function triggerShake() {
  const row = document.getElementById("letterContainer");
  if (!row) return;
  row.classList.add("shake");
  setTimeout(() => row.classList.remove("shake"), 400);
}

// ---------- Racha (streak) ----------
function loadStreak() {
  const streak = parseInt(localStorage.getItem("streak") || "0", 10);
  document.getElementById("streak").textContent = `🔥 Racha: ${streak}`;
  // mostrar botón compartir si ya jugó hoy
  if (localStorage.getItem(todayKey)) {
    document.getElementById("shareBtn").style.display = "inline-block";
  }
}

function saveWin() {
  localStorage.setItem(todayKey, "true");
  let streak = parseInt(localStorage.getItem("streak") || "0", 10);
  const last = localStorage.getItem("lastWin");

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

// ---------- Comprobación de respuesta ----------
function checkAnswer(attempt) {
  if (!answer) return;
  const feedback = document.getElementById("feedback");

  if (!attempt || attempt.length !== answer.length) {
    feedback.textContent = "La palabra no está completa.";
    feedback.style.color = "#c00";
    triggerShake();
    return;
  }

  if (attempt === answer) {
    feedback.textContent = "🎉 ¡Correcto!";
    feedback.style.color = "green";
    revealAllBoxes();
    saveWin();
    document.getElementById("shareBtn").style.display = "inline-block";
  } else {
    feedback.textContent = "❌ Incorrecto";
    feedback.style.color = "red";
    triggerShake();
  }
}

// revelar todas las letras (útil al acertar)
function revealAllBoxes() {
  const boxes = document.querySelectorAll(".letterBox");
  boxes.forEach((b, i) => {
    b.value = answer[i];
    b.classList.add("filled");
  });
}

// ---------- Hint (pedir letra) ----------
function giveHint() {
  const boxes = document.querySelectorAll(".letterBox");
  const emptyIndices = Array.from(boxes)
    .map((b, i) => (!b.value ? i : null))
    .filter(i => i !== null);

  if (emptyIndices.length === 0) return;

  const idx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  boxes[idx].value = answer[idx];
  boxes[idx].classList.add("filled", "pop");
  setTimeout(() => boxes[idx].classList.remove("pop"), 200);
  // poner foco en la siguiente vacía si existe
  const nextEmpty = Array.from(boxes).find(b => !b.value);
  if (nextEmpty) nextEmpty.focus();
}

// ---------- Compartir ----------
async function shareResult() {
  const streak = localStorage.getItem("streak") || 0;
  const text = `Preguntita\nPista: ${todayPuzzle ? todayPuzzle.clue : ""}\n¡Lo acerté! 🔥 Racha: ${streak}`;
  try {
    await navigator.clipboard.writeText(text);
    alert("Resultado copiado al portapapeles");
  } catch {
    alert("No se pudo copiar automáticamente. Selecciona y copia manualmente:");
    prompt("Resultado para copiar:", text);
  }
}

// ---------- Inicialización principal (espera DOM cargado) ----------
document.addEventListener("DOMContentLoaded", () => {
  // Botones: siempre cuidamos que existan
  const checkBtn = document.getElementById("checkBtn");
  const hintBtn = document.getElementById("hintBtn");
  const shareBtn = document.getElementById("shareBtn");

  if (checkBtn) {
    checkBtn.addEventListener("click", () => {
      checkAnswer(getTypedAnswer());
    });
  }
  if (hintBtn) {
    hintBtn.addEventListener("click", giveHint);
  }
  if (shareBtn) {
    shareBtn.addEventListener("click", shareResult);
  }

  // Cargar puzzles.json de forma robusta
  fetch("puzzles.json")
    .then(res => {
      if (!res.ok) throw new Error("No se pudo cargar puzzles.json: " + res.status);
      return res.json();
    })
    .then(data => {
      try {
        if (!data || !data.puzzles || !data.startDate) {
          throw new Error("Formato de puzzles.json incorrecto. Debe contener { startDate, puzzles }");
        }
        todayPuzzle = getPuzzleOfTheDay(data.puzzles, data.startDate);
        if (!todayPuzzle || !todayPuzzle.answer) {
          throw new Error("No se encontró puzzle válido para hoy.");
        }

        // NORMALIZAR: usamos minúsculas en todo el flujo
        answer = String(todayPuzzle.answer || "").toLowerCase();
        document.getElementById("clue").textContent = todayPuzzle.clue || "";
        drawLetterBoxes(answer, checkAnswer);
        loadStreak();
      } catch (err) {
        console.error(err);
        document.getElementById("feedback").textContent = "Error al cargar puzzle: " + err.message;
        document.getElementById("feedback").style.color = "red";
      }
    })
    .catch(err => {
      console.error(err);
      document.getElementById("feedback").textContent = "No se pudo cargar puzzles.json. Revisa la consola.";
      document.getElementById("feedback").style.color = "red";
    });
});
