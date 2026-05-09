/**
 * practice.js — Matching game controller.
 *
 * Each "round" shows a batch of words on the left and shuffled
 * meanings on the right.  Player clicks a word card, then a
 * meaning card to form a pair.
 *
 * Correct pair  → both cards turn green and lock.
 * Wrong pair    → brief red flash, selection resets.
 *
 * When all pairs in a round are matched → show Next Round button.
 * After all rounds → save session and navigate to result.html.
 */

const Practice = (() => {

  // ── Config ────────────────────────────────────────────────────
  const ROUND_SIZE = 6;   // words per round (max)

  // ── State ─────────────────────────────────────────────────────
  let allWords     = [];  // full vocabulary list (from sessionStorage)
  let rounds       = [];  // array of word-batches
  let roundIndex   = 0;

  let correctCount = 0;
  let wrongCount   = 0;
  let wrongItems   = [];  // { word, meaning, yourAnswer }

  let selectedWord    = null;  // { el, word, meaning }
  let selectedMeaning = null;  // { el, word, meaning }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    const raw = sessionStorage.getItem('practiceQuestions');
    if (!raw) {
      App.toast('No questions found. Please set up a session first.', 'error');
      setTimeout(() => App.navigate('index.html'), 1500);
      return;
    }

    // practiceQuestions is an array of { word, meaning, partOfSpeech }
    // (built by App.buildQuestions → but now each vocab item IS the question)
    allWords = JSON.parse(raw);

    // Split into rounds of ROUND_SIZE
    rounds = [];
    for (let i = 0; i < allWords.length; i += ROUND_SIZE) {
      rounds.push(allWords.slice(i, i + ROUND_SIZE));
    }

    updateProgress();
    renderRound();
  }

  // ── Progress UI ───────────────────────────────────────────────
  function updateProgress() {
    const total = rounds.length;
    document.getElementById('progressCount').textContent =
      `${roundIndex + 1} / ${total}`;
    document.getElementById('progressFill').style.width =
      `${(roundIndex / total) * 100}%`;
    document.getElementById('correctChip').textContent = `✓ ${correctCount}`;
    document.getElementById('wrongChip').textContent   = `✗ ${wrongCount}`;
  }

  // ── Render a round ────────────────────────────────────────────
  function renderRound() {
    const batch = rounds[roundIndex];

    // Shuffle meanings independently
    const shuffledMeanings = App.shuffle(batch.map(w => ({
      word:    w.word,
      meaning: w.meaning,
    })));

    const colWords    = document.getElementById('colWords');
    const colMeanings = document.getElementById('colMeanings');

    colWords.innerHTML    = '';
    colMeanings.innerHTML = '';

    // Reset selection
    selectedWord    = null;
    selectedMeaning = null;

    // Hide feedback / next button
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('nextBtn').classList.add('hidden');

    // Build word cards (left column)
    batch.forEach((item, i) => {
      const card = document.createElement('div');
      card.className   = 'match-card word-card slide-up';
      card.style.animationDelay = `${i * 0.05}s`;
      card.dataset.word    = item.word;
      card.dataset.meaning = item.meaning;
      card.innerHTML = `
        <span class="match-card-pos">${escapeHtml(item.partOfSpeech)}</span>
        <span class="match-card-text">${escapeHtml(item.word)}</span>
      `;
      card.addEventListener('click', () => onWordClick(card, item));
      colWords.appendChild(card);
    });

    // Build meaning cards (right column — shuffled)
    shuffledMeanings.forEach((item, i) => {
      const card = document.createElement('div');
      card.className   = 'match-card meaning-card slide-up';
      card.style.animationDelay = `${i * 0.05}s`;
      card.dataset.word    = item.word;
      card.dataset.meaning = item.meaning;
      card.innerHTML = `
        <span class="match-card-text meaning-text">${escapeHtml(item.meaning)}</span>
      `;
      card.addEventListener('click', () => onMeaningClick(card, item));
      colMeanings.appendChild(card);
    });

    updateProgress();
  }

  // ── Click handlers ────────────────────────────────────────────
  function onWordClick(card, item) {
    if (card.classList.contains('matched') || card.classList.contains('locked')) return;

    // Deselect previous word selection
    if (selectedWord) {
      selectedWord.el.classList.remove('selected');
    }

    selectedWord = { el: card, word: item.word, meaning: item.meaning };
    card.classList.add('selected');

    if (selectedMeaning) tryMatch();
  }

  function onMeaningClick(card, item) {
    if (card.classList.contains('matched') || card.classList.contains('locked')) return;

    // Deselect previous meaning selection
    if (selectedMeaning) {
      selectedMeaning.el.classList.remove('selected');
    }

    selectedMeaning = { el: card, word: item.word, meaning: item.meaning };
    card.classList.add('selected');

    if (selectedWord) tryMatch();
  }

  // ── Attempt a match ───────────────────────────────────────────
  function tryMatch() {
    const wCard = selectedWord;
    const mCard = selectedMeaning;

    // Clear refs immediately
    selectedWord    = null;
    selectedMeaning = null;

    const isCorrect = wCard.word === mCard.word;

    if (isCorrect) {
      // Lock both cards as matched
      [wCard.el, mCard.el].forEach(el => {
        el.classList.remove('selected');
        el.classList.add('matched');
      });

      correctCount++;
      updateProgress();
      showFeedback(true, `✓  ${wCard.word} = ${wCard.meaning}`);

      // Check if round is complete
      const remaining = document.querySelectorAll('.match-card:not(.matched)');
      if (remaining.length === 0) {
        setTimeout(onRoundComplete, 600);
      }

    } else {
      // Flash wrong
      [wCard.el, mCard.el].forEach(el => {
        el.classList.remove('selected');
        el.classList.add('wrong-flash');
        setTimeout(() => el.classList.remove('wrong-flash'), 700);
      });

      wrongCount++;
      wrongItems.push({
        word:       wCard.word,
        meaning:    wCard.meaning,
        yourAnswer: mCard.meaning,
      });

      updateProgress();
      showFeedback(false, `✗  "${mCard.meaning}" không khớp với "${wCard.word}"`);
    }
  }

  // ── Round complete ────────────────────────────────────────────
  function onRoundComplete() {
    const isLastRound = roundIndex >= rounds.length - 1;
    const btn = document.getElementById('nextBtn');
    btn.textContent = isLastRound ? 'See Results →' : 'Next Round →';
    btn.classList.remove('hidden');
    btn.onclick = isLastRound ? finishSession : () => {
      roundIndex++;
      renderRound();
    };
  }

  // ── Feedback bar ──────────────────────────────────────────────
  function showFeedback(isCorrect, msg) {
    const el = document.getElementById('feedback');
    el.textContent = msg;
    el.className = `feedback-bar ${isCorrect ? 'correct' : 'wrong'}`;
    el.classList.remove('hidden');
  }

  // ── Finish ────────────────────────────────────────────────────
  function finishSession() {
    const total    = allWords.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    Storage.saveSession({
      total,
      correct:    correctCount,
      wrong:      wrongCount,
      accuracy,
      wrongItems,
    });

    App.navigate('result.html');
  }

  // ── Helpers ───────────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Practice.init);
