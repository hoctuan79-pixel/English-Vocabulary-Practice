/**
 * app.js — Shared utilities used across all pages.
 * - JSON validation
 * - Shuffle
 * - Toast notifications
 * - Navigation helpers
 */

const App = (() => {

  // ── Navigation ──────────────────────────────────────────────
  function navigate(page) {
    window.location.href = page;
  }

  // ── Data Validation ─────────────────────────────────────────
  /**
   * Validate imported JSON.
   * Simple format: { vocabularies: [{ word, meaning, partOfSpeech }] }
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
        return {
          valid: false,
          error: `Entry #${i + 1} is missing word, meaning, or partOfSpeech.`,
        };
      }
    }
    return { valid: true, data: json.vocabularies };
  }

  // ── Randomisation ───────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Build the question list for matching mode.
   * Returns a shuffled array of { word, meaning, partOfSpeech } capped at `count`.
   */
  function buildQuestions(vocab, count) {
    const shuffled = shuffle([...vocab]);
    return shuffled.slice(0, count).map(v => ({
      word:         v.word,
      meaning:      v.meaning,
      partOfSpeech: v.partOfSpeech,
    }));
  }

  // ── Toast Notifications ─────────────────────────────────────
  let _toastTimer = null;

  function toast(msg, type = 'info', duration = 2800) {
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
