/* MG1 / LITHOSITE V24.5 S2.9 — MAP RECOVERY BOUNDARY
 * Owns recovery journal orchestration only.
 * It does not own IndexedDB primitives, import/export validation, rendering,
 * activation, tile/runtime behavior, or the persistence schema.
 *
 * Purpose: if an import is interrupted after one or more durable writes,
 * remember the intended imported IDs and clean them on the next startup.
 */
(function (global) {
  'use strict';

  var KEY = 'mg1_map_recovery_journal_v245';
  var VERSION = '24.5-s2.9';

  function read_() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return null;
      var value = JSON.parse(raw);
      if (!value || value.version !== VERSION || value.operation !== 'import' || !Array.isArray(value.ids)) return null;
      return value;
    } catch (_) { return null; }
  }

  function write_(journal) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(journal));
      return true;
    } catch (_) { return false; }
  }

  function clear_() {
    try { global.localStorage.removeItem(KEY); } catch (_) {}
  }

  function normalizeIds_(ids) {
    return Array.from(new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean)));
  }

  function beginImport(ids) {
    var normalized = normalizeIds_(ids);
    if (!normalized.length) throw new Error('Recovery journal requires imported map IDs');
    var journal = {
      version: VERSION,
      operation: 'import',
      createdAt: new Date().toISOString(),
      ids: normalized
    };
    if (!write_(journal)) throw new Error('Recovery journal tidak dapat disimpan');
    return journal;
  }

  function clearImport() { clear_(); }

  async function recoverPending() {
    var journal = read_();
    if (!journal) return { ok: true, pending: false, recoveredIds: [], failed: [] };
    if (typeof global.dbDeleteMap_ !== 'function') {
      return { ok: false, pending: true, recoveredIds: [], failed: journal.ids.map(function (id) { return { id: id, error: 'IndexedDB delete boundary unavailable' }; }) };
    }

    var recovered = [];
    var failed = [];
    for (var i = 0; i < journal.ids.length; i++) {
      var id = journal.ids[i];
      try {
        await global.dbDeleteMap_(id);
        recovered.push(id);
      } catch (e) {
        failed.push({ id: id, error: String(e && e.message || e) });
      }
    }

    if (!failed.length) {
      clear_();
    } else {
      write_({
        version: VERSION,
        operation: 'import',
        createdAt: journal.createdAt,
        ids: failed.map(function (item) { return item.id; })
      });
    }

    if (recovered.length && typeof global.loadBackgroundMapsFromDb_ === 'function') {
      try { await global.loadBackgroundMapsFromDb_(); } catch (_) {}
    }

    return { ok: failed.length === 0, pending: true, recoveredIds: recovered, failed: failed };
  }

  function pending() { return read_(); }

  global.MG1MapRecovery = Object.freeze({
    version: VERSION,
    beginImport: beginImport,
    clearImport: clearImport,
    recoverPending: recoverPending,
    pending: pending
  });

  // Startup recovery is intentionally asynchronous and non-blocking for boot.
  // It only acts when a previous import left a journal behind.
  setTimeout(function () {
    recoverPending().then(function (result) {
      if (result && result.pending) {
        if (result.ok) console.warn('[V24.5 S2.9] Recovery completed', result);
        else console.error('[V24.5 S2.9] Recovery incomplete', result);
      }
    }).catch(function (e) {
      console.error('[V24.5 S2.9] Recovery failed', e);
    });
  }, 0);

  console.log('[V24.5 S2.9] Recovery boundary ready — interrupted imports can self-recover');
})(window);
