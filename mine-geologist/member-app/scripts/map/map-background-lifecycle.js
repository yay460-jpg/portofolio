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
