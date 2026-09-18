/* MG1 / LITHOSITE V24.5 — MAP PACKAGE TRANSFER
 * Owns import/export of durable Map Library entries only.
 * Does not own IndexedDB primitives, rendering, tiles, GeoReference parsing,
 * activation, deletion, upload processing, or surface lifecycle.
 *
 * Package format: JSON .mg1map, schema 1.
 * Integrity: SHA-256 over canonical JSON of {format,schemaVersion,exportedAt,maps}.
 */
(function (global) {
  'use strict';

  var FORMAT = 'MG1-LITHOSITE-MAP-PACKAGE';
  var SCHEMA_VERSION = 1;
  var EXTENSION = '.mg1map';
  var MAX_PACKAGE_BYTES = 512 * 1024 * 1024;
  var MAX_MAPS_PER_PACKAGE = 24;

  function canonicalize_(value) {
    if (Array.isArray(value)) return '[' + value.map(canonicalize_).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (key) {
        return JSON.stringify(key) + ':' + canonicalize_(value[key]);
      }).join(',') + '}';
    }
    return JSON.stringify(value);
  }

  async function sha256Hex_(text) {
    if (!global.crypto || !global.crypto.subtle) throw new Error('Web Crypto tidak tersedia');
    var bytes = new TextEncoder().encode(text);
    var digest = await global.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function clone_(value) {
    if (typeof global.structuredClone === 'function') {
      try { return global.structuredClone(value); } catch (_) {}
    }
    return JSON.parse(JSON.stringify(value));
  }

  function getMaps_() {
    if (!global.MG1MapLibrary || typeof global.MG1MapLibrary.getAll !== 'function') {
      throw new Error('Map Library tidak tersedia');
    }
    return global.MG1MapLibrary.getAll();
  }

  // Security boundary: package payload is untrusted even when SHA-256 is valid.
  function isSafeImageDataUrl_(value) {
    if (typeof value !== 'string' || value.length === 0 || value.length > 64 * 1024 * 1024) return false;
    var m = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
    if (!m) return false;
    var b64 = m[2];
    if (b64.length % 4 !== 0) return false;
    try {
      var normalized = b64.replace(/=+$/, '');
      return normalized.length > 0 && /^[A-Za-z0-9+/]+$/.test(normalized);
    } catch (_) { return false; }
  }

  function isSafeTileKey_(value) {
    if (typeof value !== 'string' || value.length > 80) return false;
    return /^L(?:-?(?:\d+(?:\.\d+)?|\.\d+))_X-?\d+_Y-?\d+$/i.test(value);
  }

  function validateTile_(tile, levelFactor) {
    if (!tile || typeof tile !== 'object') throw new Error('Tile payload tidak valid');
    var x = Number(tile.x), y = Number(tile.y);
    if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error('Tile coordinate tidak valid');
    if (Math.abs(x) > 1000000 || Math.abs(y) > 1000000) throw new Error('Tile coordinate di luar batas');
    if (tile.width != null && (!Number.isFinite(Number(tile.width)) || Number(tile.width) <= 0 || Number(tile.width) > 8192)) throw new Error('Tile width tidak valid');
    if (tile.height != null && (!Number.isFinite(Number(tile.height)) || Number(tile.height) <= 0 || Number(tile.height) > 8192)) throw new Error('Tile height tidak valid');
    var key = tile.tileKey != null ? String(tile.tileKey) : (tile.tileId != null ? String(tile.tileId) : '');
    if (key && !isSafeTileKey_(key)) throw new Error('Tile identity tidak valid');
    if (key) {
      var km = key.match(/^L(-?(?:\d+(?:\.\d+)?|\.\d+))_X(-?\d+)_Y(-?\d+)$/i);
      if (!km || Math.abs(Number(km[1]) - Number(levelFactor)) > 0.0001 || Number(km[2]) !== x || Number(km[3]) !== y) {
        throw new Error('Tile identity tidak cocok dengan koordinat/level');
      }
    }
    if (tile.dataUrl != null && !isSafeImageDataUrl_(tile.dataUrl)) throw new Error('Tile image payload tidak aman');
  }

  function validatePayloadSecurity_(entry) {
    if (!entry || typeof entry !== 'object') throw new Error('Map entry tidak valid');
    if (entry.imageDataUrl != null && !isSafeImageDataUrl_(entry.imageDataUrl)) throw new Error('Preview image payload tidak aman');
    var pyramid = entry.tilePyramid;
    if (pyramid != null) {
      if (typeof pyramid !== 'object' || !Array.isArray(pyramid.levels)) throw new Error('Tile pyramid tidak valid');
      if (pyramid.levels.length > 16) throw new Error('Tile pyramid terlalu banyak level');
      pyramid.levels.forEach(function(level) {
        if (!level || typeof level !== 'object') throw new Error('Level tile tidak valid');
        var factor = Number(level.factor);
        if (!Number.isFinite(factor) || factor <= 0 || factor > 16) throw new Error('Tile factor tidak valid');
        if (level.width != null && (!Number.isFinite(Number(level.width)) || Number(level.width) <= 0 || Number(level.width) > 100000000)) throw new Error('Level width tidak valid');
        if (level.height != null && (!Number.isFinite(Number(level.height)) || Number(level.height) <= 0 || Number(level.height) > 100000000)) throw new Error('Level height tidak valid');
        if (!Array.isArray(level.tiles)) throw new Error('Tile list tidak valid');
        if (level.tiles.length > 100000) throw new Error('Tile count terlalu besar');
        level.tiles.forEach(function(tile) { validateTile_(tile, factor); });
      });
    }
    return true;
  }

  function sanitizeImportedEntry_(entry) {
    var clean = clone_(entry);
    // Active identity is device-local and must never travel with a package.
    if (Object.prototype.hasOwnProperty.call(clean, 'active')) delete clean.active;
    if (Object.prototype.hasOwnProperty.call(clean, 'isActive')) delete clean.isActive;
    if (clean.tilePyramid && typeof clean.tilePyramid === 'object') {
      clean.tilePyramid.runtimeMapId = String(clean.id);
    }
    return clean;
  }

  function validateEntry_(entry) {
    if (global.MG1MapLibraryContract && typeof global.MG1MapLibraryContract.validate === 'function') {
      var result = global.MG1MapLibraryContract.validate(entry);
      if (!result.ok) throw new Error(result.errors.join(', '));
    } else if (!entry || !entry.id || !entry.name) {
      throw new Error('Map entry tidak valid');
    }
    if (!entry.imageDataUrl && !entry.tilePyramid) throw new Error('Map entry tidak memiliki payload');
    validatePayloadSecurity_(entry);
  }

  function buildPayload_(maps, exportedAt) {
    return {
      format: FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: exportedAt,
      maps: maps.map(function (entry) {
        validateEntry_(entry);
        return clone_(entry);
      })
    };
  }

  async function exportMaps_(ids) {
    var maps = await getMaps_();
    var wanted = Array.isArray(ids) && ids.length
      ? maps.filter(function (m) { return ids.indexOf(String(m.id)) >= 0; })
      : maps;
    if (!wanted.length) throw new Error('Tidak ada peta untuk di-export');

    var payload = buildPayload_(wanted, new Date().toISOString());
    var integrity = await sha256Hex_(canonicalize_(payload));
    var packageObject = Object.assign({}, payload, {
      integrity: { algorithm: 'SHA-256', scope: 'payload', value: integrity }
    });
    var json = JSON.stringify(packageObject, null, 2);
    var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var stamp = new Date().toISOString().replace(/[:.]/g, '-');
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Lithosite_MapPackage_' + stamp + EXTENSION;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

    return { ok: true, count: wanted.length, bytes: blob.size, integrity: integrity };
  }

  function parsePackage_(raw) {
    var pkg;
    try { pkg = JSON.parse(raw); } catch (_) { throw new Error('File package bukan JSON yang valid'); }
    if (!pkg || pkg.format !== FORMAT) throw new Error('Format Map Package tidak dikenali');
    if (Number(pkg.schemaVersion) !== SCHEMA_VERSION) throw new Error('Schema Map Package tidak didukung: ' + pkg.schemaVersion);
    if (!Array.isArray(pkg.maps) || !pkg.maps.length) throw new Error('Package tidak berisi peta');
    if (pkg.maps.length > MAX_MAPS_PER_PACKAGE) throw new Error('Package melebihi batas ' + MAX_MAPS_PER_PACKAGE + ' peta');
    if (typeof pkg.exportedAt !== 'string' || !Number.isFinite(Date.parse(pkg.exportedAt))) throw new Error('Timestamp package tidak valid');
    if (!pkg.integrity || pkg.integrity.algorithm !== 'SHA-256' || pkg.integrity.scope !== 'payload' || !/^[a-f0-9]{64}$/i.test(String(pkg.integrity.value))) {
      throw new Error('Integrity package tidak valid');
    }
    return pkg;
  }

  async function preflightCollision_(pkg) {
    // Preflight is deliberately read-only. It checks both the durable Library
    // store and the legacy in-memory background cache before any import commit.
    var libraryMaps = await getMaps_();
    var existingIds = Object.create(null);
    libraryMaps.forEach(function (m) {
      if (m && m.id != null) existingIds[String(m.id)] = true;
    });
    if (Array.isArray(global.backgroundMapsList)) {
      global.backgroundMapsList.forEach(function (m) {
        if (m && m.id != null) existingIds[String(m.id)] = true;
      });
    }

    var packageIds = Object.create(null);
    var internalDuplicates = [];
    pkg.maps.forEach(function (entry) {
      var id = String(entry && entry.id != null ? entry.id : '');
      if (packageIds[id]) internalDuplicates.push(id);
      packageIds[id] = true;
    });
    if (internalDuplicates.length) {
      var packageDuplicateError = new Error('Package memiliki ID peta duplikat');
      packageDuplicateError.code = 'PACKAGE_ID_DUPLICATE';
      packageDuplicateError.ids = internalDuplicates.slice();
      packageDuplicateError.committedCount = 0;
      throw packageDuplicateError;
    }

    var collisions = pkg.maps.filter(function (m) {
      return m && m.id != null && existingIds[String(m.id)];
    }).map(function (m) { return String(m.id); });
    if (collisions.length) {
      var collisionError = new Error('Import dibatalkan — ID map sudah ada: ' + collisions.join(', '));
      collisionError.code = 'ID_COLLISION';
      collisionError.ids = collisions.slice();
      collisionError.committedCount = 0;
      throw collisionError;
    }
    return { ok: true, checkedLibrary: true, checkedBackground: true };
  }

  async function validatePackage_(pkg) {
    var payload = {
      format: pkg.format,
      schemaVersion: pkg.schemaVersion,
      exportedAt: pkg.exportedAt,
      maps: pkg.maps
    };
    var actual = await sha256Hex_(canonicalize_(payload));
    if (actual.toLowerCase() !== String(pkg.integrity.value).toLowerCase()) {
      var integrityError = new Error('Integrity check gagal — package berubah atau rusak');
      integrityError.code = 'INTEGRITY_MISMATCH';
      integrityError.committedCount = 0;
      integrityError.expected = String(pkg.integrity.value);
      integrityError.actual = actual;
      throw integrityError;
    }
    var ids = Object.create(null);
    pkg.maps.forEach(function (entry) {
      validateEntry_(entry);
      var id = String(entry.id);
      if (ids[id]) {
        var duplicateError = new Error('ID map duplikat di dalam package: ' + id);
        duplicateError.code = 'PACKAGE_ID_DUPLICATE';
        duplicateError.ids = [id];
        duplicateError.committedCount = 0;
        throw duplicateError;
      }
      ids[id] = true;
    });
    return { ok: true, count: pkg.maps.length, integrity: actual };
  }

  async function commitPackage_(pkg) {
    if (typeof global.dbPutMap_ !== 'function') throw new Error('Storage Map Library tidak tersedia');
    var existing = await getMaps_();
    var existingIds = Object.create(null);
    existing.forEach(function (m) { if (m && m.id) existingIds[String(m.id)] = true; });
    var collisions = pkg.maps.filter(function (m) { return existingIds[String(m.id)]; }).map(function (m) { return String(m.id); });
    if (collisions.length) {
      var collisionError = new Error('Import dibatalkan — ID map sudah ada: ' + collisions.join(', '));
      collisionError.code = 'ID_COLLISION';
      collisionError.ids = collisions.slice();
      collisionError.committedCount = 0;
      throw collisionError;
    }

    var committed = [];
    var importedIds = pkg.maps.map(function (entry) { return String(entry.id); });
    if (global.MG1MapRecovery && typeof global.MG1MapRecovery.beginImport === 'function') {
      global.MG1MapRecovery.beginImport(importedIds);
    }
    try {
      for (var i = 0; i < pkg.maps.length; i++) {
        var entry = sanitizeImportedEntry_(pkg.maps[i]);
        await global.dbPutMap_(entry);
        committed.push(entry);
      }
    } catch (err) {
      // Best-effort rollback only for entries committed by this import operation.
      // Keep the journal only if any rollback delete fails; S2.9 will retry it.
      var rollbackFailed = false;
      for (var j = 0; j < committed.length; j++) {
        try {
          if (typeof global.dbDeleteMap_ === 'function') await global.dbDeleteMap_(committed[j].id);
          else rollbackFailed = true;
        } catch (_) { rollbackFailed = true; }
      }
      if (!rollbackFailed && global.MG1MapRecovery && typeof global.MG1MapRecovery.clearImport === 'function') {
        global.MG1MapRecovery.clearImport();
      }
      throw err;
    }

    if (global.MG1MapRecovery && typeof global.MG1MapRecovery.clearImport === 'function') {
      global.MG1MapRecovery.clearImport();
    }

    if (typeof global.loadBackgroundMapsFromDb_ === 'function') {
      await global.loadBackgroundMapsFromDb_();
    } else if (Array.isArray(global.backgroundMapsList)) {
      committed.forEach(function (entry) { global.backgroundMapsList.push(entry); });
    }
    return { ok: true, count: committed.length };
  }

  async function importFile_(file, onProgress) {
    if (!file) throw new Error('File package belum dipilih');
    var report = typeof onProgress === 'function' ? onProgress : function(){};
    var fileName = String(file.name || '').trim();
    var fileSize = Number(file.size || 0);
    if (fileName && !/\.mg1map$/i.test(fileName)) {
      var extensionError = new Error('File backup harus berekstensi .mg1map');
      extensionError.code = 'INVALID_EXTENSION';
      throw extensionError;
    }
    if (fileSize > MAX_PACKAGE_BYTES) {
      var sizeError = new Error('File backup terlalu besar (maksimum 512 MB)');
      sizeError.code = 'PACKAGE_TOO_LARGE';
      throw sizeError;
    }
    report(8, 'Membaca backup .mg1map...');
    var raw = await file.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_PACKAGE_BYTES) {
      var rawSizeError = new Error('File backup terlalu besar (maksimum 512 MB)');
      rawSizeError.code = 'PACKAGE_TOO_LARGE';
      throw rawSizeError;
    }
    report(28, 'Memvalidasi struktur backup...');
    var pkg = parsePackage_(raw);

    // Critical UX + safety gate: determine collision before integrity work and
    // before commit. This is read-only and checks Library + background cache.
    report(42, 'Memeriksa ID peta di Library...');
    try {
      await preflightCollision_(pkg);
    } catch (e) {
      if (e && e.code === 'ID_COLLISION') {
        report(100, 'Ditolak — ID peta sudah ada di Library');
      }
      throw e;
    }

    report(58, 'Memeriksa integrity SHA-256...');
    var validation = await validatePackage_(pkg);
    report(72, 'Backup tervalidasi. Menyiapkan import...');
    var result = await commitPackage_(pkg);
    report(94, 'Memperbarui Map Library...');
    report(100, 'Backup berhasil dikembalikan.');
    return Object.assign({ filename: file.name }, validation, result);
  }

  global.MG1LithositeSecurity = Object.freeze({
    isSafeImageDataUrl: isSafeImageDataUrl_,
    isSafeTileKey: isSafeTileKey_,
    validateTile: validateTile_,
    validatePayload: validatePayloadSecurity_
  });

  global.MG1MapPackageTransfer = Object.freeze({
    version: '24.5-s2.8',
    maxPackageBytes: MAX_PACKAGE_BYTES,
    maxMapsPerPackage: MAX_MAPS_PER_PACKAGE,
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportMaps: exportMaps_,
    importFile: importFile_,
    preflightCollision: preflightCollision_,
    validatePackage: async function (raw) {
      var pkg = parsePackage_(raw);
      return validatePackage_(pkg);
    }
  });

  console.log('[V24.5 MAP PACKAGE] Import/export + SHA-256 integrity boundary ready');
})(window);
