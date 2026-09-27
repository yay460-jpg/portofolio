/* MG1 / LITHOSITE V24.5 S2.7 — SAFE STORAGE CLEANUP
 * Orchestrates safe removal of selected maps. It does not own IndexedDB primitives.
 * Active maps are never accepted in a cleanup plan. Actual deletion remains owned
 * by the existing background-map lifecycle boundary.
 */
(function (global) {
  'use strict';

  function activeId_() {
    try { return global.localStorage.getItem('mg1_active_bg_map_id') || null; } catch (_) { return null; }
  }

  async function plan(ids) {
    var list = Array.isArray(ids) ? ids.map(String).filter(Boolean) : [];
    list = Array.from(new Set(list));
    if (!list.length) throw new Error('Tidak ada peta yang dipilih');
    if (!global.MG1MapStorageManagement || typeof global.MG1MapStorageManagement.getMap !== 'function') {
      throw new Error('Storage management tidak tersedia');
    }
    var activeId = activeId_();
    var items = [];
    for (var i = 0; i < list.length; i++) {
      var item = await global.MG1MapStorageManagement.getMap(list[i]);
      if (!item) throw new Error('Peta tidak ditemukan: ' + list[i]);
      if (activeId && item.id === String(activeId)) {
        throw new Error('Peta aktif tidak boleh dihapus melalui Safe Cleanup');
      }
      items.push(item);
    }
    return {
      ids: items.map(function (item) { return item.id; }),
      items: items,
      count: items.length,
      bytes: items.reduce(function (sum, item) { return sum + item.bytes; }, 0),
      mb: items.reduce(function (sum, item) { return sum + item.bytes; }, 0) / 1024 / 1024
    };
  }

  async function execute(ids) {
    var cleanupPlan = await plan(ids);
    if (typeof global.deleteBackgroundMapsForCleanup_ !== 'function') {
      throw new Error('Safe Cleanup lifecycle boundary tidak tersedia');
    }
    var result = await global.deleteBackgroundMapsForCleanup_(cleanupPlan.ids);
    return Object.assign({}, cleanupPlan, result || {});
  }

  global.MG1MapSafeCleanup = Object.freeze({
    version: '24.5-s2.7',
    plan: plan,
    execute: execute
  });

  console.log('[V24.5 S2.7] Safe Cleanup ready — active-map protection enforced');
})(window);
