(function (global) {
  'use strict';

  const subscribers = new Map();

  function register(name, refresh) {
    if (!name || typeof refresh !== 'function') return false;
    subscribers.set(name, refresh);
    return true;
  }

  async function refreshAll(detail) {
    const jobs = [];
    subscribers.forEach(function (refresh, name) {
      jobs.push(Promise.resolve().then(refresh).catch(function (error) {
        console.error('[Lithosite Data Sync] Refresh failed for ' + name + ':', error);
      }));
    });
    await Promise.all(jobs);
  }

  let refreshQueue = Promise.resolve();

  window.addEventListener('lithosite:runtime-mutated', function (event) {
    const detail = event.detail || {};
    refreshQueue = refreshQueue.then(function () {
      return refreshAll(detail);
    });
  });

  global.LithositeDataSync = Object.freeze({
    register,
    refreshAll
  });
})(window);
