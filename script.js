const API_URL = "https://opentdb.com/api.php?amount=10&encode=url3986";

let questions = [];
let currentIndex = 0;
let score = 0;

let timerInterval;
const TIME_LIMIT = 15;

const screens = {
  start: document.getElementById("screen-start"),
  loading: document.getElementById("screen-loading"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result")
};

document.getElementById("btn-start").addEventListener("click", fetchQuestions);
document.getElementById("btn-next").addEventListener("click", nextQuestion);
document.getElementById("btn-restart").addEventListener("click", () => showScreen("start"));

function showScreen(screenKey) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[screenKey].classList.add("active");
}

async function fetchQuestions() {
  showScreen("loading");
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.response_code !== 0 || !data.results.length) {
      throw new Error("Could not retrieve questions.");
    }

    questions = data.results;
    currentIndex = 0;
    score = 0;

    showScreen("quiz");
    renderQuestion();
  } catch (err) {
    alert("Error connecting to OpenTDB. Please try again.");
    showScreen("start");
  }
}

function renderQuestion() {
  const q = questions[currentIndex];


  const decodedQuestion = decodeURIComponent(q.question);
  const decodedCategory = decodeURIComponent(q.category);
  const correctAnswer = decodeURIComponent(q.correct_answer);
  const incorrectAnswers = q.incorrect_answers.map(ans => decodeURIComponent(ans));

  document.getElementById("category-label").textContent = decodedCategory;
  document.getElementById("counter-label").textContent = `${currentIndex + 1} / ${questions.length}`;
  document.getElementById("progress").style.width = `${((currentIndex) / questions.length) * 100}%`;
  document.getElementById("question-text").textContent = decodedQuestion;


  const allOptions = [...incorrectAnswers, correctAnswer];
  allOptions.sort(() => Math.random() - 0.5); 

  // 4. Render Buttons
  const optionsBox = document.getElementById("options-box");
  optionsBox.innerHTML = "";

  allOptions.forEach(optText => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = optText;

    btn.addEventListener("click", () => selectOption(btn, optText, correctAnswer));
    optionsBox.appendChild(btn);
  });

  document.getElementById("btn-next").style.display = "none";
  startTimer(correctAnswer);

}

function selectOption(selectedBtn, chosenText, correctText) {
  clearInterval(timerInterval);
  const allButtons = document.querySelectorAll(".option-btn");
  allButtons.forEach(b => b.disabled = true); // Lock inputs

  if (chosenText === correctText) {
    selectedBtn.classList.add("correct");
    score += 3;
  } else {
    selectedBtn.classList.add("wrong");
    
    allButtons.forEach(b => {
      if (b.textContent === correctText) b.classList.add("correct");
    });
  }

  document.getElementById("btn-next").style.display = "block";
}

function nextQuestion() {
  clearInterval(timerInterval);
  currentIndex++;

  if (currentIndex < questions.length) {
    renderQuestion();
  } else {

    const maxMarks = questions.length * 3;

    const pct = Math.round((score / maxMarks) * 100);

    let msg = "Keep practicing, you'll get there!";
    if (pct >= 90) msg = "Outstanding! You're a knowledge wizard! 🌟";
    else if (pct >= 70) msg = "Great job! You have a solid understanding.";
    else if (pct >= 50) msg = "Good effort! A bit more practice and you'll ace it.";

    document.getElementById("final-score").textContent = `${score} / ${maxMarks}`;

    const msgElement = document.getElementById("result-msg");
    if (msgElement) msgElement.textContent = msg;

    showScreen("result");

    if (pct >= 80) {
      triggerCelebration();
    }
  }
}

function triggerCelebration() {
  const duration = 3 * 1000; // Run animation for 3 seconds
  const end = Date.now() + duration;

  (function frame() {

    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 }
    });


    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}



function startTimer(correctText) {
  let timeLeft = TIME_LIMIT;
  const timerLabel = document.getElementById("timer-label");
  timerLabel.textContent = `⏱ ${timeLeft}s`;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerLabel.textContent = `⏱ ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout(correctText);
    }
  }, 1000);
}

function handleTimeout(correctText) {
  const allButtons = document.querySelectorAll(".option-btn");

  allButtons.forEach(b => b.disabled = true);

  allButtons.forEach(b => {
    if (b.textContent === correctText) {
      b.classList.add("correct");
    }
  });

  document.getElementById("timer-label").textContent = "⏱ Time's Up!";

  document.getElementById("btn-next").style.display = "block";
}
