/**
 * result.js — Result screen controller.
 *
 * Responsibilities:
 *  - Load last session from Storage
 *  - Render accuracy ring, stat boxes, and wrong-answer list
 *  - Animate the SVG ring on load
 */

const Result = (() => {

  function init() {
    const session = Storage.loadSession();

    if (!session) {
      // No session data — redirect home
      App.toast('No session data found.', 'error');
      setTimeout(() => App.navigate('index.html'), 1500);
      return;
    }

    renderHero(session);
    renderWrongList(session.wrongItems || []);
    bindButtons();
  }

  // ── Hero (ring + stats) ───────────────────────────────────────
  function renderHero(session) {
    // Accuracy ring
    const pct = session.accuracy;
    document.getElementById('ringPct').textContent = pct + '%';

    // Animate SVG ring after a short delay
    const ringFill = document.getElementById('ringFill');
    const circumference = 377; // 2π × r (r=60)
    const offset = circumference - (pct / 100) * circumference;
    setTimeout(() => {
      ringFill.style.strokeDashoffset = offset;
    }, 120);

    // Headline based on accuracy
    const headline = document.getElementById('resultHeadline');
    const sub      = document.getElementById('resultSub');

    if (pct === 100) {
      headline.textContent = 'Perfect score!';
      sub.textContent = 'Flawless. You know these words cold.';
    } else if (pct >= 80) {
      headline.textContent = 'Great work!';
      sub.textContent = 'You\'re getting there. Almost perfect!';
    } else if (pct >= 50) {
      headline.textContent = 'Keep practising.';
      sub.textContent = 'Good effort — review the missed words below.';
    } else {
      headline.textContent = 'Room to grow.';
      sub.textContent = 'Don\'t worry — review and try again!';
    }

    // Stat boxes
    document.getElementById('statTotal').textContent   = session.total;
    document.getElementById('statCorrect').textContent = session.correct;
    document.getElementById('statWrong').textContent   = session.wrong;
  }

  // ── Wrong answers list ────────────────────────────────────────
  function renderWrongList(wrongItems) {
    const section   = document.getElementById('wrongSection');
    const container = document.getElementById('wrongList');

    if (wrongItems.length === 0) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');

    container.innerHTML = wrongItems.map((item, i) => `
      <div class="wrong-item" style="animation-delay: ${i * 0.06}s">
        <div class="wrong-item-word">✗ ${escapeHtml(item.word)}</div>
        <div class="wrong-item-detail">
          Nghĩa đúng: <span style="color: var(--success); font-family: var(--font-mono)">${escapeHtml(item.meaning)}</span>
        </div>
        <div class="wrong-item-detail" style="margin-top: 6px;">
          Bạn chọn: <span style="color: var(--danger)">${escapeHtml(item.yourAnswer)}</span>
        </div>
      </div>
    `).join('');
  }

  // ── Button wiring ─────────────────────────────────────────────
  function bindButtons() {
    document.getElementById('retryBtn').addEventListener('click', () => {
      // Re-use the same questions stored in sessionStorage
      App.navigate('practice.html');
    });

    document.getElementById('homeBtn').addEventListener('click', () => {
      App.navigate('index.html');
    });
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

document.addEventListener('DOMContentLoaded', Result.init);
