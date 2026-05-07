/**
 * practice.js — Practice screen controller.
 *
 * Responsibilities:
 *  - Load questions built by App.buildQuestions()
 *  - Render each question with MCQ options
 *  - Track correct / wrong answers
 *  - Save session result and navigate to result screen
 */

const Practice = (() => {

  // ── State ────────────────────────────────────────────────────
  let questions   = [];   // full question list for this session
  let current     = 0;    // index of the active question
  let correctCount = 0;
  let wrongCount   = 0;
  let wrongItems   = [];  // { word, sentence, yourAnswer, correctAnswer }

  // ── DOM references (set in init) ─────────────────────────────
  let els = {};

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    // Read questions from sessionStorage (set by vocab.js before navigation)
    const raw = sessionStorage.getItem('practiceQuestions');
    if (!raw) {
      App.toast('No questions found. Please set up a session first.', 'error');
      setTimeout(() => App.navigate('index.html'), 1500);
      return;
    }

    questions = JSON.parse(raw);

    // Gather DOM nodes
    els = {
      progressFill:  document.getElementById('progressFill'),
      progressCount: document.getElementById('progressCount'),
      correctChip:   document.getElementById('correctChip'),
      wrongChip:     document.getElementById('wrongChip'),
      questionCard:  document.getElementById('questionCard'),
      wordHint:      document.getElementById('wordHint'),
      sentenceEl:    document.getElementById('sentence'),
      optionsGrid:   document.getElementById('optionsGrid'),
      feedback:      document.getElementById('feedback'),
      nextBtn:       document.getElementById('nextBtn'),
    };

    // Wire Next button
    els.nextBtn.addEventListener('click', nextQuestion);

    renderQuestion();
  }

  // ── Render a question ─────────────────────────────────────────
  function renderQuestion() {
    const q = questions[current];

    // Update progress
    const pct = (current / questions.length) * 100;
    els.progressFill.style.width = pct + '%';
    els.progressCount.textContent = `${current + 1} / ${questions.length}`;

    // Live score chips
    els.correctChip.textContent = `✓ ${correctCount}`;
    els.wrongChip.textContent   = `✗ ${wrongCount}`;

    // Word hint (part of speech only — don't show the answer word)
    els.wordHint.textContent = q.partOfSpeech;

    // Render sentence with blank marker
    const rendered = q.sentence.replace('___', `<span class="question-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`);
    els.sentenceEl.innerHTML = rendered;

    // Hide feedback and next button
    els.feedback.classList.add('hidden');
    els.nextBtn.classList.add('hidden');

    // Animate card
    els.questionCard.classList.remove('fade-in');
    // Force reflow to restart animation
    void els.questionCard.offsetWidth;
    els.questionCard.classList.add('fade-in');

    // Build option buttons
    renderOptions(q);
  }

  // ── Build MCQ buttons ─────────────────────────────────────────
  function renderOptions(q) {
    els.optionsGrid.innerHTML = '';

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn slide-up';
      btn.style.animationDelay = `${idx * 0.06}s`;
      btn.textContent = opt;
      btn.dataset.value = opt;
      btn.addEventListener('click', () => handleAnswer(opt, q, btn));
      els.optionsGrid.appendChild(btn);
    });
  }

  // ── Handle answer selection ────────────────────────────────────
  function handleAnswer(chosen, q, clickedBtn) {
    // Disable all option buttons to prevent double-click
    const allBtns = els.optionsGrid.querySelectorAll('.option-btn');
    allBtns.forEach(b => { b.disabled = true; });

    const isCorrect = chosen === q.answer;

    if (isCorrect) {
      correctCount++;
      clickedBtn.classList.add('correct');
      showFeedback(true, `Correct! "${q.answer}" — ${q.meaning}`);
    } else {
      wrongCount++;
      clickedBtn.classList.add('wrong');

      // Highlight the correct button green
      allBtns.forEach(b => {
        if (b.dataset.value === q.answer) b.classList.add('correct');
      });

      // Track wrong answer for result screen
      wrongItems.push({
        word:          q.word,
        sentence:      q.sentence,
        yourAnswer:    chosen,
        correctAnswer: q.answer,
        meaning:       q.meaning,
      });

      showFeedback(false, `Incorrect. The answer is "${q.answer}"`);
    }

    // Update score chips
    els.correctChip.textContent = `✓ ${correctCount}`;
    els.wrongChip.textContent   = `✗ ${wrongCount}`;

    // Show next / finish button
    els.nextBtn.textContent =
      current === questions.length - 1 ? 'See Results →' : 'Next Question →';
    els.nextBtn.classList.remove('hidden');
  }

  // ── Feedback bar ───────────────────────────────────────────────
  function showFeedback(isCorrect, msg) {
    els.feedback.textContent = isCorrect ? `✓ ${msg}` : `✗ ${msg}`;
    els.feedback.className = `feedback-bar ${isCorrect ? 'correct' : 'wrong'}`;
    els.feedback.classList.remove('hidden');
  }

  // ── Advance to next question or finish ─────────────────────────
  function nextQuestion() {
    if (current < questions.length - 1) {
      current++;
      renderQuestion();
    } else {
      finishSession();
    }
  }

  // ── Save session and go to result screen ───────────────────────
  function finishSession() {
    const total    = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const session = {
      total,
      correct:    correctCount,
      wrong:      wrongCount,
      accuracy,
      wrongItems,
    };

    Storage.saveSession(session);
    App.navigate('result.html');
  }

  return { init };
})();

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', Practice.init);