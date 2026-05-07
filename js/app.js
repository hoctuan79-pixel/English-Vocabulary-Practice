/**
 * app.js — Shared utilities used across all pages.
 * - JSON validation
 * - Shuffle
 * - Toast notifications
 * - Navigation helpers
 */

const App = (() => {

  // ── Navigation ──────────────────────────────────────────────

  /** Redirect to another page in the app. */
  function navigate(page) {
    window.location.href = page;
  }

  // ── Data Validation ─────────────────────────────────────────

  /**
   * Validate that imported JSON matches the expected vocabulary schema.
   * Returns { valid: true, data } or { valid: false, error }
   * @param {Object} json — parsed JSON object
   */
  function validateVocabJSON(json) {
    if (!json || typeof json !== 'object') {
      return { valid: false, error: 'JSON must be an object.' };
    }

    if (!Array.isArray(json.vocabularies)) {
      return { valid: false, error: 'Missing "vocabularies" array.' };
    }

    if (json.vocabularies.length === 0) {
      return { valid: false, error: '"vocabularies" array is empty.' };
    }

    for (let i = 0; i < json.vocabularies.length; i++) {
      const item = json.vocabularies[i];
      if (!item.word || !item.meaning || !item.partOfSpeech) {
        return { valid: false, error: `Entry #${i + 1} is missing word, meaning, or partOfSpeech.` };
      }
      if (!Array.isArray(item.examples) || item.examples.length === 0) {
        return { valid: false, error: `"${item.word}" has no examples.` };
      }
      for (let j = 0; j < item.examples.length; j++) {
        const ex = item.examples[j];
        if (!ex.sentence || !ex.answer || !Array.isArray(ex.options) || ex.options.length < 2) {
          return { valid: false, error: `"${item.word}" example #${j + 1} is malformed.` };
        }
        if (!ex.options.includes(ex.answer)) {
          return { valid: false, error: `"${item.word}" answer "${ex.answer}" not in options.` };
        }
      }
    }

    return { valid: true, data: json.vocabularies };
  }

  // ── Randomisation ───────────────────────────────────────────

  /**
   * Fisher-Yates shuffle — returns a new shuffled array.
   * @param {Array} arr
   * @returns {Array}
   */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Build a flat question list from vocabulary entries.
   * Each example sentence becomes one question.
   * Shuffles the examples and caps at `count`.
   * @param {Array}  vocab — full vocabulary list
   * @param {number} count — max questions
   * @returns {Array} questions
   */
  function buildQuestions(vocab, count) {
    // Flatten every example from every word into a question object
    const all = [];
    vocab.forEach(v => {
      v.examples.forEach(ex => {
        all.push({
          word:        v.word,
          meaning:     v.meaning,
          partOfSpeech: v.partOfSpeech,
          sentence:    ex.sentence,
          answer:      ex.answer,
          // Shuffle options so the correct answer isn't always in the same slot
          options:     shuffle(ex.options),
        });
      });
    });

    // Shuffle all questions and take only `count`
    return shuffle(all).slice(0, count);
  }

  // ── Toast Notifications ─────────────────────────────────────

  let _toastTimer = null;

  /**
   * Display a transient toast message.
   * @param {string} msg     — text to show
   * @param {'info'|'success'|'error'} type
   * @param {number} duration — ms before auto-hide (default 2800)
   */
  function toast(msg, type = 'info', duration = 2800) {
    // Remove any existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    clearTimeout(_toastTimer);

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);

    _toastTimer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ── Helpers ─────────────────────────────────────────────────

  /**
   * Read a File object as text and resolve with its content.
   * @param {File} file
   * @returns {Promise<string>}
   */
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsText(file);
    });
  }

  return { navigate, validateVocabJSON, shuffle, buildQuestions, toast, readFileAsText };
})();
