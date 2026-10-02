// ============================================================
// storage.js - LocalStorage Data Layer
// ============================================================

const Storage = (() => {
  const STORAGE_KEY = 'arena_tournaments';

  function _getData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading storage:', e);
      return [];
    }
  }

  function _saveData(tournaments) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function getAll() {
    return _getData();
  }

  function getById(id) {
    return _getData().find(t => t.id === id) || null;
  }

  function save(tournament) {
    const tournaments = _getData();
    const index = tournaments.findIndex(t => t.id === tournament.id);
    if (index >= 0) {
      tournaments[index] = tournament;
    } else {
      tournaments.push(tournament);
    }
    _saveData(tournaments);
  }

  function remove(id) {
    const tournaments = _getData().filter(t => t.id !== id);
    _saveData(tournaments);
  }

  function exportData() {
    return JSON.stringify(_getData(), null, 2);
  }

  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        _saveData(data);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  return { generateId, getAll, getById, save, remove, exportData, importData };
})();
