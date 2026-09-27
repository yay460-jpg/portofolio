// STEP 9.11-A — Background Map Lifecycle
function activateBackgroundMap_(id) {
  activeBackgroundMapId = id;
  mapZoom = 1.25;
  compassRotationOffsetDeg_ = 0;
  mapRotationDeg_ = (compassState_.active && Number.isFinite(compassState_.smoothedHeadingDeg)) ? normalizeSignedDeg_(-compassState_.smoothedHeadingDeg) : 0;
  mapViewportState_.centerNative = null;
  localStorage.setItem('mg1_active_bg_map_id', id);
  render();
}
async function deactivateBackgroundMap_() {
  activeBackgroundMapId = null;
  mapZoom = 1;
  compassRotationOffsetDeg_ = 0;
  mapRotationDeg_ = (compassState_.active && Number.isFinite(compassState_.smoothedHeadingDeg)) ? normalizeSignedDeg_(-compassState_.smoothedHeadingDeg) : 0;
  mapViewportState_.centerNative = null;
  localStorage.removeItem('mg1_active_bg_map_id');
  render();
}
async function deleteBackgroundMapEntry_(id) {
  try {
    await dbDeleteMap_(id);
    if (activeBackgroundMapId === id) { activeBackgroundMapId = null; localStorage.removeItem('mg1_active_bg_map_id'); }
    await loadBackgroundMapsFromDb_();
  } catch (e) { console.warn('Gagal hapus peta:', e); }
  render();
}

// V24.5 S2.7 — Safe Cleanup lifecycle boundary.
// Persistence primitive remains map-package.js; this owner only orchestrates
// already-existing deletion + one final refresh/render after a validated batch.
async function deleteBackgroundMapsForCleanup_(ids) {
  const list = Array.isArray(ids) ? Array.from(new Set(ids.map(String).filter(Boolean))) : [];
  if (!list.length) throw new Error('Cleanup tidak memiliki peta');
  const activeId = (typeof activeBackgroundMapId !== 'undefined' && activeBackgroundMapId)
    || localStorage.getItem('mg1_active_bg_map_id') || null;
  if (activeId && list.includes(String(activeId))) {
    throw new Error('Peta aktif dilindungi dari Safe Cleanup');
  }

  const deleted = [];
  const failed = [];
  for (const id of list) {
    try {
      if (typeof dbDeleteMap_ !== 'function') throw new Error('IndexedDB delete boundary unavailable');
      await dbDeleteMap_(id);
      deleted.push(id);
    } catch (e) {
      failed.push({ id: id, error: String(e && e.message || e) });
    }
  }

  if (typeof loadBackgroundMapsFromDb_ === 'function') await loadBackgroundMapsFromDb_();
  if (typeof render === 'function') render();
  return { requestedCount: list.length, deletedIds: deleted, failed: failed, deletedCount: deleted.length };
}

console.log('[V24.5 S2.7] Background lifecycle safe-cleanup boundary ready');
