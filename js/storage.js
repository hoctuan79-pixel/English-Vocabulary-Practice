/**
 * storage.js — Centralized localStorage interface
 * All read/write to localStorage goes through this module.
 */

const KEYS = {
  VOCAB:   'vocabmaster_vocab',
  SESSION: 'vocabmaster_session',
};

const Storage = (() => {

  /**
   * Persist the full vocabulary list.
   * @param {Array} vocabularies — array of vocab objects
   */
  function saveVocab(vocabularies) {
    try {
      localStorage.setItem(KEYS.VOCAB, JSON.stringify(vocabularies));
    } catch (e) {
      console.error('[Storage] Failed to save vocab:', e);
    }
  }

  /**
   * Retrieve stored vocabulary list.
   * @returns {Array} — vocabulary array or empty array if none
   */
  function loadVocab() {
    try {
      const raw = localStorage.getItem(KEYS.VOCAB);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[Storage] Failed to load vocab:', e);
      return [];
    }
  }

  /**
   * Save a practice session result so the result screen can display it.
   * @param {Object} session — { total, correct, wrong, wrongItems, accuracy }
   */
  function saveSession(session) {
    try {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    } catch (e) {
      console.error('[Storage] Failed to save session:', e);
    }
  }

  /**
   * Load the last practice session.
   * @returns {Object|null}
   */
  function loadSession() {
    try {
      const raw = localStorage.getItem(KEYS.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[Storage] Failed to load session:', e);
      return null;
    }
  }

  /** Clear all stored data (useful for reset). */
  function clearAll() {
    localStorage.removeItem(KEYS.VOCAB);
    localStorage.removeItem(KEYS.SESSION);
  }

  return { saveVocab, loadVocab, saveSession, loadSession, clearAll };
})();
