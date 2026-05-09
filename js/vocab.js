/**
 * vocab.js — Vocabulary Management screen controller.
 */

const Vocab = (() => {

  let vocabulary = [];

  function init() {
    vocabulary = Storage.loadVocab();
    renderTable();
    bindEvents();
  }

  function bindEvents() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput  = document.getElementById('fileInput');
    const countInput = document.getElementById('countInput');
    const startBtn   = document.getElementById('startBtn');
    const clearBtn   = document.getElementById('clearBtn');

    uploadZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    });

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

    startBtn.addEventListener('click', () => {
      const count = parseInt(countInput.value, 10);
      startPractice(count);
    });

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

      const existingWords = new Set(vocabulary.map(v => v.word.toLowerCase()));
      const incoming   = result.data.filter(v => !existingWords.has(v.word.toLowerCase()));
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

    countInput.max   = vocabulary.length;
    countInput.value = Math.min(parseInt(countInput.value, 10) || 10, vocabulary.length);

    const tbody = document.getElementById('vocabTbody');
    tbody.innerHTML = vocabulary.map((v, i) => `
      <tr class="fade-in" style="animation-delay: ${Math.min(i * 0.03, 0.5)}s">
        <td class="word-cell">${escapeHtml(v.word)}</td>
        <td><span class="pos-badge">${escapeHtml(v.partOfSpeech)}</span></td>
        <td class="meaning-cell">${escapeHtml(v.meaning)}</td>
      </tr>
    `).join('');
  }

  function startPractice(count) {
    if (vocabulary.length === 0) {
      App.toast('Import vocabulary first.', 'error');
      return;
    }
    const finalCount = Math.max(1, Math.min(count || 10, vocabulary.length));
    const questions  = App.buildQuestions(vocabulary, finalCount);
    sessionStorage.setItem('practiceQuestions', JSON.stringify(questions));
    App.navigate('practice.html');
  }

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
