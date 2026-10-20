/* MG1 V24.3 — MAP LIBRARY CAPABILITY LAYER (Slice 4)
 * Read/query capabilities only. No storage, renderer, viewport, marker, tile,
 * GeoReference, upload, activate, or delete implementation is changed here.
 */
(function (global) {
  'use strict';

  function getMapLabels_(m) {
    if (Array.isArray(m && m.labels)) return m.labels.map(function(v){ return String(v || '').trim(); }).filter(Boolean);
    const legacy = String(m && m.folderName || '').trim();
    return legacy ? [legacy] : [];
  }

  async function list(options) {
    options = options || {};
    const base = (global.MG1MapLibrary && typeof global.MG1MapLibrary.getAll === 'function')
      ? await global.MG1MapLibrary.getAll() : [];
    const query = String(options.query || '').trim().toLowerCase();
    return base.filter(function (entry) {
      if (!entry) return false;
      if (!query) return true;
      const labels = getMapLabels_(entry);
      const collections = Array.isArray(entry.collectionNames) ? entry.collectionNames : [];
      return String(entry.name || '').toLowerCase().includes(query)
        || String(entry.id || '').toLowerCase().includes(query)
        || labels.some(function(v){ return v.toLowerCase().includes(query); })
        || collections.some(function(v){ return String(v || '').toLowerCase().includes(query); });
    });
  }

  async function summary() {
    const maps = await list();
    let activeId = null;
    try { activeId = global.localStorage.getItem('mg1_active_bg_map_id') || null; } catch (_) {}
    const labels = []; const seen = new Set();
    maps.forEach(function(m){
      getMapLabels_(m).forEach(function(v){
        const k = v.toLocaleLowerCase(); if (!v || seen.has(k)) return;
        seen.add(k); labels.push(v);
      });
    });
    labels.sort(function(a,b){ return a.localeCompare(b, 'id', {sensitivity:'base', numeric:true}); });
    return {
      total: maps.length,
      labelCount: labels.length,
      labels: labels,
      activeId: activeId,
      hasActive: !!activeId && maps.some(function (m) { return String(m.id) === String(activeId); })
    };
  }

  global.MG1MapLibraryCapability = Object.freeze({
    version: '24.3-s14-labels',
    list: list,
    summary: summary
  });

  console.log('[V24.3 MAP LIBRARY] Slice 4 capability ready — labels query/summary only; behavior unchanged');
})(window);
