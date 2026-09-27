/* MG1 / LITHOSITE V24.5 S2.6 — MAP STORAGE MANAGEMENT
 * Read-only storage management model. No IndexedDB writes/deletes, no activation,
 * no import/export, no renderer/tile/runtime behavior.
 * UI remains owned by map-management-compat.js; this module supplies usage detail.
 */
(function (global) {
  'use strict';

  function byteSize_(value) {
    try {
      var json = JSON.stringify(value);
      if (global.TextEncoder) return new global.TextEncoder().encode(json).byteLength;
      return unescape(encodeURIComponent(json)).length;
    } catch (_) { return 0; }
  }

  async function getMaps_() {
    if (!global.MG1MapLibrary || typeof global.MG1MapLibrary.getAll !== 'function') {
      throw new Error('Map Library tidak tersedia');
    }
    var maps = await global.MG1MapLibrary.getAll();
    return Array.isArray(maps) ? maps : [];
  }

  async function overview() {
    var maps = await getMaps_();
    var items = maps.map(function (entry) {
      return {
        id: entry && entry.id != null ? String(entry.id) : '',
        name: entry && entry.name ? String(entry.name) : 'Tanpa nama',
        bytes: byteSize_(entry),
        mb: byteSize_(entry) / 1024 / 1024,
        active: false,
        labels: Array.isArray(entry && entry.labels) ? entry.labels.slice() : [],
        collectionNames: Array.isArray(entry && entry.collectionNames) ? entry.collectionNames.slice() : []
      };
    });
    var activeId = null;
    try { activeId = global.localStorage.getItem('mg1_active_bg_map_id') || null; } catch (_) {}
    items.forEach(function (item) { item.active = !!activeId && item.id === String(activeId); });
    items.sort(function (a, b) { return b.bytes - a.bytes; });

    var totalBytes = items.reduce(function (sum, item) { return sum + item.bytes; }, 0);
    var storage = null;
    if (global.MG1MapStorageCapability && typeof global.MG1MapStorageCapability.summary === 'function') {
      storage = await global.MG1MapStorageCapability.summary();
    }
    return {
      mapCount: items.length,
      totalPayloadBytes: totalBytes,
      totalPayloadMB: totalBytes / 1024 / 1024,
      largest: items[0] || null,
      items: items,
      storage: storage
    };
  }

  async function getMap(id) {
    var data = await overview();
    return data.items.find(function (item) { return item.id === String(id); }) || null;
  }

  global.MG1MapStorageManagement = Object.freeze({
    version: '24.5-s2.6',
    overview: overview,
    getMap: getMap
  });

  console.log('[V24.5 S2.6] Storage management ready — read-only map usage model');
})(window);
