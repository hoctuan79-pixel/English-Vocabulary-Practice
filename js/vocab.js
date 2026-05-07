/**
 * vocab.js — Vocabulary Management screen controller.
 *
 * Responsibilities:
 *  - Handle JSON file import (click + drag-and-drop)
 *  - Render vocabulary table
 *  - Let user choose how many questions to practise
 *  - Pass questions to practice.html via sessionStorage
 */

const Vocab = (() => {

  // ── State ────────────────────────────────────────────────────
  let vocabulary = [];   // current list loaded into the app

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    vocabulary = Storage.loadVocab();
    renderTable();
    bindEvents();
  }

  // ── DOM Binding ───────────────────────────────────────────────
  function bindEvents() {
    const uploadZone  = document.getElementById('uploadZone');
    const fileInput   = document.getElementById('fileInput');
    const countInput  = document.getElementById('countInput');
    const startBtn    = document.getElementById('startBtn');
    const clearBtn    = document.getElementById('clearBtn');

    // Click on zone → trigger hidden file input
    uploadZone.addEventListener('click', () => fileInput.click());

    // File selected via dialog
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Drag-and-drop support
    uploadZone.addEventListener('dragover', e => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });
    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    // Start practice
    startBtn.addEventListener('click', () => {
      const count = parseInt(countInput.value, 10);
      startPractice(count);
    });

    // Clear all data
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all vocabulary data?')) {
          Storage.clearAll();
          vocabulary = [];
          renderTable();
          App.toast('Vocabulary cleared.', 'info');
        }
      });
    }
  }

  // ── File Handling ─────────────────────────────────────────────

  /**
   * Read the dropped/selected file, validate, merge with existing vocab.
   * @param {File} file
   */
  async function handleFile(file) {
    if (!file.name.endsWith('.json')) {
      App.toast('Please upload a .json file.', 'error');
      return;
    }

    try {
      const text   = await App.readFileAsText(file);
      const json   = JSON.parse(text);
      const result = App.validateVocabJSON(json);

      if (!result.valid) {
        App.toast(`Invalid JSON: ${result.error}`, 'error', 4000);
        return;
      }

      // Merge: avoid duplicate words (by word key)
      const existingWords = new Set(vocabulary.map(v => v.word.toLowerCase()));
      const incoming = result.data.filter(v => !existingWords.has(v.word.toLowerCase()));
      const duplicates = result.data.length - incoming.length;

      vocabulary = [...vocabulary, ...incoming];
      Storage.saveVocab(vocabulary);
      renderTable();

      const msg = duplicates > 0
        ? `Imported ${incoming.length} words (${duplicates} duplicates skipped).`
        : `Imported ${incoming.length} words successfully!`;
      App.toast(msg, 'success');

    } catch (err) {
      App.toast('Could not parse JSON file. Check the format.', 'error');
      console.error('[Vocab] Import error:', err);
    }
  }

  // ── Table Rendering ───────────────────────────────────────────

  function renderTable() {
    const tableWrap  = document.getElementById('tableWrap');
    const emptyState = document.getElementById('emptyState');
    const countInput = document.getElementById('countInput');
    const startBtn   = document.getElementById('startBtn');
    const wordCount  = document.getElementById('wordCount');

    if (wordCount) {
      wordCount.textContent = `${vocabulary.length} word${vocabulary.length !== 1 ? 's' : ''} loaded`;
    }

    if (vocabulary.length === 0) {
      tableWrap.classList.add('hidden');
      emptyState.classList.remove('hidden');
      startBtn.disabled = true;
      return;
    }

    emptyState.classList.add('hidden');
    tableWrap.classList.remove('hidden');
    startBtn.disabled = false;

    // Set sane max for question count
    const maxQuestions = countTotalExamples(vocabulary);
    countInput.max   = maxQuestions;
    countInput.value = Math.min(parseInt(countInput.value, 10) || 10, maxQuestions);

    // Build table rows
    const tbody = document.getElementById('vocabTbody');
    tbody.innerHTML = vocabulary.map((v, i) => `
      <tr class="fade-in" style="animation-delay: ${Math.min(i * 0.03, 0.5)}s">
        <td class="word-cell">${escapeHtml(v.word)}</td>
        <td><span class="pos-badge">${escapeHtml(v.partOfSpeech)}</span></td>
        <td class="meaning-cell">${escapeHtml(v.meaning)}</td>
        <td style="color: var(--ink-muted); font-size: 0.8rem; font-family: var(--font-mono)">
          ${v.examples.length}
        </td>
      </tr>
    `).join('');
  }

  // ── Start Practice ────────────────────────────────────────────

  function startPractice(count) {
    if (vocabulary.length === 0) {
      App.toast('Import vocabulary first.', 'error');
      return;
    }

    const maxQ = countTotalExamples(vocabulary);
    const finalCount = Math.max(1, Math.min(count || 10, maxQ));

    // Build and shuffle questions, store in sessionStorage for practice.html
    const questions = App.buildQuestions(vocabulary, finalCount);
    sessionStorage.setItem('practiceQuestions', JSON.stringify(questions));

    App.navigate('practice.html');
  }

  // ── Helpers ───────────────────────────────────────────────────

  /** Count total examples (= max possible questions) across all vocab entries. */
  function countTotalExamples(vocab) {
    return vocab.reduce((sum, v) => sum + v.examples.length, 0);
  }

  /** Basic HTML escape to avoid XSS when inserting user-imported text. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Vocab.init);
