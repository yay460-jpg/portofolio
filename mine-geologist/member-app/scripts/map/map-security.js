/* MG1 / LITHOSITE V24.5 — SECURITY BOUNDARY
 * Untrusted package/storage payload validation. No rendering or storage ownership.
 */
(function (global) {
  'use strict';

  function isSafeImageDataUrl_(value) {
    if (typeof value !== 'string' || value.length === 0 || value.length > 64 * 1024 * 1024) return false;
    return /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)
      && ((value.split(',')[1] || '').length % 4 === 0);
  }

  function isSafeTileKey_(value) {
    if (typeof value !== 'string' || value.length > 80) return false;
    return /^L(?:-?(?:\d+(?:\.\d+)?|\.\d+))_X-?\d+_Y-?\d+$/i.test(value);
  }

  function validateTile_(tile, levelFactor) {
    if (!tile || typeof tile !== 'object') return false;
    var x = Number(tile.x), y = Number(tile.y);
    if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
    if (Math.abs(x) > 1000000 || Math.abs(y) > 1000000) return false;
    if (tile.width != null && (!Number.isFinite(Number(tile.width)) || Number(tile.width) <= 0 || Number(tile.width) > 8192)) return false;
    if (tile.height != null && (!Number.isFinite(Number(tile.height)) || Number(tile.height) <= 0 || Number(tile.height) > 8192)) return false;
    var key = tile.tileKey != null ? String(tile.tileKey) : (tile.tileId != null ? String(tile.tileId) : '');
    if (key) {
      if (!isSafeTileKey_(key)) return false;
      var km = key.match(/^L(-?(?:\d+(?:\.\d+)?|\.\d+))_X(-?\d+)_Y(-?\d+)$/i);
      if (!km || Math.abs(Number(km[1]) - Number(levelFactor)) > 0.0001 || Number(km[2]) !== x || Number(km[3]) !== y) return false;
    }
    if (tile.dataUrl != null && !isSafeImageDataUrl_(tile.dataUrl)) return false;
    return true;
  }

  function validatePayload_(entry) {
    if (!entry || typeof entry !== 'object') return false;
    if (entry.imageDataUrl != null && !isSafeImageDataUrl_(entry.imageDataUrl)) return false;
    var pyramid = entry.tilePyramid;
    if (pyramid == null) return true;
    if (typeof pyramid !== 'object' || !Array.isArray(pyramid.levels) || pyramid.levels.length > 16) return false;
    for (var i = 0; i < pyramid.levels.length; i++) {
      var level = pyramid.levels[i];
      if (!level || typeof level !== 'object') return false;
      var factor = Number(level.factor);
      if (!Number.isFinite(factor) || factor <= 0 || factor > 16) return false;
      if (level.width != null && (!Number.isFinite(Number(level.width)) || Number(level.width) <= 0 || Number(level.width) > 100000000)) return false;
      if (level.height != null && (!Number.isFinite(Number(level.height)) || Number(level.height) <= 0 || Number(level.height) > 100000000)) return false;
      if (!Array.isArray(level.tiles) || level.tiles.length > 100000) return false;
      for (var j = 0; j < level.tiles.length; j++) if (!validateTile_(level.tiles[j], factor)) return false;
    }
    return true;
  }

  global.MG1LithositeSecurity = Object.freeze({
    isSafeImageDataUrl: isSafeImageDataUrl_,
    isSafeTileKey: isSafeTileKey_,
    validateTile: validateTile_,
    validatePayload: validatePayload_
  });
})(window);


  /**
   * Global import security gate.
   * Extension is treated only as compatibility metadata; package content remains untrusted
   * until parsed and validated.
   */
  function validateImportPackage(pkg) {
    try {
      if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
        return { ok:false, reason:'invalid-package' };
      }
      const maps = Array.isArray(pkg.maps) ? pkg.maps : null;
      if (!maps || maps.length < 1) return { ok:false, reason:'invalid-maps' };

      for (const map of maps) {
        if (!map || typeof map !== 'object') return { ok:false, reason:'invalid-map' };

        if (typeof map.imageDataUrl === 'string' && map.imageDataUrl) {
          if (typeof isSafeImageDataUrl === 'function' && !isSafeImageDataUrl(map.imageDataUrl)) {
            return { ok:false, reason:'unsafe-image-data' };
          }
        }

        const tiles = Array.isArray(map.tiles) ? map.tiles : [];
        for (const tile of tiles) {
          if (!tile || typeof tile !== 'object') return { ok:false, reason:'invalid-tile' };
          if (typeof tile.dataUrl === 'string' && tile.dataUrl) {
            if (typeof isSafeImageDataUrl === 'function' && !isSafeImageDataUrl(tile.dataUrl)) {
              return { ok:false, reason:'unsafe-tile-data' };
            }
          }
          if (typeof tile.tileKey === 'string' && tile.tileKey) {
            if (typeof isSafeTileKey === 'function' && !isSafeTileKey(tile.tileKey)) {
              return { ok:false, reason:'unsafe-tile-key' };
            }
          }
        }
      }
      return { ok:true };
    } catch (e) {
      return { ok:false, reason:'security-validation-error' };
    }
  }

  window.MG1LithositeSecurity = Object.assign(window.MG1LithositeSecurity || {}, {
    validateImportPackage: validateImportPackage
  });
