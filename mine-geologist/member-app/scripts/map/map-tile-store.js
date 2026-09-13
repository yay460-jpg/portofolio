// STEP 9.10-B — Persistent Tile Store
// Structural extraction only. Runtime/visual behavior intentionally unchanged.

function sanitizePyramidForStorage_(pyramid) {
  if (!pyramid || typeof pyramid !== 'object') return pyramid;
  try {
    const clean = {};
    // Copy only serializable fields
    if (Number.isFinite(pyramid.tileSize)) clean.tileSize = pyramid.tileSize;
    if (pyramid.runtimeMapId) clean.runtimeMapId = pyramid.runtimeMapId;
    if (Number.isFinite(pyramid.__persistVersion)) clean.__persistVersion = pyramid.__persistVersion;
    if (Number.isFinite(pyramid.__lastPersistAt)) clean.__lastPersistAt = pyramid.__lastPersistAt;
    if (Array.isArray(pyramid.levels)) {
      clean.levels = pyramid.levels.map(level => {
        if (!level || typeof level !== 'object') return null;
        const cl = {};
        if (Number.isFinite(level.factor)) cl.factor = level.factor;
        if (Number.isFinite(level.width)) cl.width = level.width;
        if (Number.isFinite(level.height)) cl.height = level.height;
        if (Array.isArray(level.tiles)) {
          cl.tiles = level.tiles.map(t => {
            if (!t || typeof t !== 'object') return null;
            // Only keep serializable tile data - NO Image, no HTMLImageElement
            const ct = {};
            if (Number.isFinite(t.x)) ct.x = t.x;
            if (Number.isFinite(t.y)) ct.y = t.y;
            if (Number.isFinite(t.width)) ct.width = t.width;
            if (Number.isFinite(t.height)) ct.height = t.height;
            if (Number.isFinite(t.levelFactor)) ct.levelFactor = t.levelFactor;
            if (t.tileKey) ct.tileKey = String(t.tileKey);
            if (t.tileId) ct.tileId = String(t.tileId);
            if (t.dataUrl && typeof t.dataUrl === 'string' && t.dataUrl.startsWith('data:')) ct.dataUrl = t.dataUrl;
            return ct;
          }).filter(Boolean);
        } else {
          cl.tiles = [];
        }
        return cl;
      }).filter(Boolean);
    }
    // Preserve baseLayer metadata if exists
    if (pyramid.baseLayer && typeof pyramid.baseLayer === 'object') {
      clean.baseLayer = { ...pyramid.baseLayer };
    }
    // Preserve tileStore count but not the index with non-clonable objects - will be rebuilt on load
    if (pyramid.tileStore && typeof pyramid.tileStore.count === 'number') {
      clean.tileStore = { count: pyramid.tileStore.count, version: pyramid.tileStore.version || 1 };
    }
    return clean;
  } catch(e) {
    console.warn('[SANITIZE] pyramid sanitize failed, using original', e);
    return pyramid;
  }
}



async function persistLithositeRuntimeTileStore_(pyramid) {
  if (!pyramid || !pyramid.runtimeMapId) return { ok:false, reason:'map-id-unavailable' };
  const mapId = String(pyramid.runtimeMapId);
  const entry = Array.isArray(backgroundMapsList)
    ? backgroundMapsList.find(m => m && String(m.id) === mapId)
    : null;
  if (!entry) return { ok:false, reason:'map-entry-unavailable' };
  try {
    try {
      const curVer = Number(entry.tilePyramid && entry.tilePyramid.__persistVersion) || 0;
      const newVer = Number(pyramid.__persistVersion) || 0;
      if (curVer > 0 && newVer > 0 && newVer < curVer) {
        return { ok:true, skipped:true, reason:'version-skipped', mapId };
      }
    } catch(_) {}
    // FIX DataCloneError: sanitize pyramid to remove HTMLImageElement / Image objects
    const cleanPyramid = sanitizePyramidForStorage_(pyramid);
    const updated = { ...entry, tilePyramid: cleanPyramid };
    await dbPutMap_(updated);
    const idx = backgroundMapsList.findIndex(m => m && String(m.id) === mapId);
    if (idx >= 0) backgroundMapsList[idx] = updated;
    return { ok:true, mapId, tileCount: pyramid.tileStore ? Number(pyramid.tileStore.count) || 0 : 0 };
  } catch (err) {
    console.warn('Persist runtime tile ' + mapId + ' gagal:', err);
    return { ok:false, reason:String(err && err.message || err) };
  }
}



function ensureLithositeTileStore_(pyramid) {
  if (!pyramid || !Array.isArray(pyramid.levels)) return pyramid;
  const index = Object.create(null);
  for (let li = 0; li < pyramid.levels.length; li++) {
    const level = pyramid.levels[li];
    if (!level || !Array.isArray(level.tiles)) continue;
    const factor = Number(level.factor);
    for (let ti = 0; ti < level.tiles.length; ti++) {
      const tile = level.tiles[ti];
      const normalized = normalizeLithositeTile_(tile, factor);
      if (!normalized) continue;
      // Keep the same tile object/dataUrl; do not duplicate raster payload.
      if (normalized !== tile) level.tiles[ti] = normalized;
      index[normalized.tileKey] = { levelIndex: li, tileIndex: ti };
    }
  }
  pyramid.tileStore = {
    version: 2,
    identity: 'factor/x/y',
    count: Object.keys(index).length,
    index
  };
  return pyramid;
}



function getLithositeTileByKey_(pyramid, tileKey) {
  if (!pyramid || !pyramid.tileStore || !pyramid.tileStore.index) return null;
  const ref = pyramid.tileStore.index[String(tileKey)];
  if (!ref) return null;
  const level = pyramid.levels && pyramid.levels[ref.levelIndex];
  const tile = level && Array.isArray(level.tiles) ? level.tiles[ref.tileIndex] : null;
  return tile || null;
}



