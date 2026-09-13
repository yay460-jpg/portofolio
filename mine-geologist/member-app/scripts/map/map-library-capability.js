/* MG1 V24.3 — MAP LIBRARY CAPABILITY LAYER (Slice 4)
 *
 * Read/query capabilities only. No storage, renderer, viewport, marker, tile,
 * GeoReference, upload, activate, or delete implementation is changed here.
 * The purpose is to give the Library UI one stable query surface while the
 * existing V23/V24.1 compatibility actions remain untouched.
 */
(function (global) {
  'use strict';

  async function list(options) {
    options = options || {};
    const base = (global.MG1MapLibrary && typeof global.MG1MapLibrary.getAll === 'function')
      ? await global.MG1MapLibrary.getAll()
      : [];
    const query = String(options.query || '').trim().toLowerCase();
    let result = base.filter(function (entry) {
      if (!entry) return false;
      if (!query) return true;
      return String(entry.name || '').toLowerCase().includes(query)
        || String(entry.id || '').toLowerCase().includes(query);
    });
    return result;
  }

  async function summary() {
    const maps = await list();
    let activeId = null;
    try { activeId = global.localStorage.getItem('mg1_active_bg_map_id') || null; } catch (_) {}
    const folders = []; const seen = new Set();
    maps.forEach(function(m){ const f=String(m && m.folderName || '').trim(); if(!f) return; const k=f.toLocaleLowerCase(); if(seen.has(k)) return; seen.add(k); folders.push(f); });
    folders.sort(function(a,b){ return a.localeCompare(b, 'id', {sensitivity:'base', numeric:true}); });
    return {
      total: maps.length,
      folderCount: folders.length,
      folders: folders,
      activeId: activeId,
      hasActive: !!activeId && maps.some(function (m) { return String(m.id) === String(activeId); })
    };
  }

  global.MG1MapLibraryCapability = Object.freeze({
    version: '24.3-s12',
    list: list,
    summary: summary
  });

  console.log('[V24.3 MAP LIBRARY] Slice 4 capability ready — query/summary only; behavior unchanged');
})(window);
