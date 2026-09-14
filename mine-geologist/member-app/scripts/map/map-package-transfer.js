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

  function validateEntry_(entry) {
    if (global.MG1MapLibraryContract && typeof global.MG1MapLibraryContract.validate === 'function') {
      var result = global.MG1MapLibraryContract.validate(entry);
      if (!result.ok) throw new Error(result.errors.join(', '));
    } else if (!entry || !entry.id || !entry.name) {
      throw new Error('Map entry tidak valid');
    }
    if (!entry.imageDataUrl && !entry.tilePyramid) throw new Error('Map entry tidak memiliki payload');
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

  async function buildPackageBlob_(ids) {
    var maps = await getMaps_();
    var wanted = Array.isArray(ids) && ids.length
      ? maps.filter(function (m) { return ids.indexOf(String(m.id)) >= 0; })
      : maps;
    if (!wanted.length) throw new Error('Tidak ada peta untuk di-transfer');
    var payload = buildPayload_(wanted, new Date().toISOString());
    var integrity = await sha256Hex_(canonicalize_(payload));
    var packageObject = Object.assign({}, payload, {
      integrity: { algorithm: 'SHA-256', scope: 'payload', value: integrity }
    });
    var json = JSON.stringify(packageObject, null, 2);
    return {
      blob: new Blob([json], { type: 'application/json' }),
      count: wanted.length,
      bytes: new Blob([json], { type: 'application/json' }).size,
      integrity: integrity,
      filename: 'Lithosite_MapPackage_' + new Date().toISOString().replace(/[:.]/g, '-') + EXTENSION
    };
  }

  async function exportMaps_(ids) {
    var pkg = await buildPackageBlob_(ids);
    var url = URL.createObjectURL(pkg.blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = pkg.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return { ok: true, count: pkg.count, bytes: pkg.bytes, integrity: pkg.integrity };
  }

  var sharePreparedCache_ = new Map();

  async function prepareSharePackage_(ids) {
    var key = Array.isArray(ids) ? ids.map(String).sort().join('|') : '';
    var existing = sharePreparedCache_.get(key);
    if (existing && existing.ready) return existing.value;
    if (existing && existing.promise) return existing.promise;
    var record = { ready: false, value: null, promise: null };
    record.promise = buildPackageBlob_(ids).then(function (pkg) {
      var file = new File([pkg.blob], pkg.filename, { type: 'application/octet-stream' });
      if (typeof global.navigator.canShare === 'function' && !global.navigator.canShare({ files: [file] })) {
        var unsupported = new Error('Browser tidak mendukung berbagi file .mg1map');
        unsupported.code = 'SHARE_FILE_UNSUPPORTED';
        throw unsupported;
      }
      record.value = { pkg: pkg, file: file };
      record.ready = true;
      return record.value;
    }).catch(function (e) {
      sharePreparedCache_.delete(key);
      throw e;
    });
    sharePreparedCache_.set(key, record);
    return record.promise;
  }

  function clearPreparedShare_(ids) {
    var key = Array.isArray(ids) ? ids.map(String).sort().join('|') : '';
    sharePreparedCache_.delete(key);
  }

  async function shareMaps_(ids) {
    if (!global.navigator || typeof global.navigator.share !== 'function') {
      var unavailable = new Error('Web Share API tidak tersedia di browser ini');
      unavailable.code = 'SHARE_UNAVAILABLE';
      throw unavailable;
    }
    var key = Array.isArray(ids) ? ids.map(String).sort().join('|') : '';
    var record = sharePreparedCache_.get(key);
    if (!record || !record.ready || !record.value) {
      var pending = new Error('Package share sedang disiapkan');
      pending.code = 'SHARE_PREPARE_PENDING';
      throw pending;
    }
    // Do not await anything before navigator.share(): preserve the user activation
    // generated by the Share button tap so Android can open its native Share Sheet.
    var pkg = record.value.pkg;
    var file = record.value.file;
    try {
      await global.navigator.share({
        title: 'Lithosite Map Package',
        text: pkg.count === 1 ? 'Transfer peta Lithosite (.mg1map)' : 'Transfer ' + pkg.count + ' peta Lithosite (.mg1map)',
        files: [file]
      });
    } catch (err) {
      if (err && (err.name === 'AbortError' || err.code === 'ABORT_ERR')) {
        var cancelled = new Error('Berbagi dibatalkan');
        cancelled.code = 'SHARE_CANCELLED';
        throw cancelled;
      }
      // Some desktop/browser environments reject navigator.share() with
      // NotAllowedError (for example when the share surface is unavailable
      // or the required user-activation policy is not satisfied). Keep this
      // as a transport-state result; never fall back to Export implicitly.
      if (err && err.name === 'NotAllowedError') {
        var unavailable = new Error('Bagikan tidak tersedia pada browser/perangkat ini');
        unavailable.code = 'SHARE_UNAVAILABLE';
        unavailable.cause = err;
        throw unavailable;
      }
      throw err;
    }
    return { ok: true, count: pkg.count, bytes: pkg.bytes, integrity: pkg.integrity, filename: pkg.filename };
  }

  function parsePackage_(raw) {
    var pkg;
    try { pkg = JSON.parse(raw); } catch (_) { throw new Error('File package bukan JSON yang valid'); }
    if (!pkg || pkg.format !== FORMAT) throw new Error('Format Map Package tidak dikenali');
    if (Number(pkg.schemaVersion) !== SCHEMA_VERSION) throw new Error('Schema Map Package tidak didukung: ' + pkg.schemaVersion);
    if (!Array.isArray(pkg.maps) || !pkg.maps.length) throw new Error('Package tidak berisi peta');
    if (!pkg.integrity || pkg.integrity.algorithm !== 'SHA-256' || !pkg.integrity.value) throw new Error('Integrity package tidak tersedia');
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
    try {
      for (var i = 0; i < pkg.maps.length; i++) {
        var entry = clone_(pkg.maps[i]);
        await global.dbPutMap_(entry);
        committed.push(entry);
      }
    } catch (err) {
      // Best-effort rollback only for entries committed by this import operation.
      for (var j = 0; j < committed.length; j++) {
        try { if (typeof global.dbDeleteMap_ === 'function') await global.dbDeleteMap_(committed[j].id); } catch (_) {}
      }
      throw err;
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
    report(8, 'Membaca backup .mg1map...');
    var raw = await file.text();
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

  global.MG1MapPackageTransfer = Object.freeze({
    version: '24.5-s2.5.1',
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportMaps: exportMaps_,
    shareMaps: shareMaps_,
    prepareShare: prepareSharePackage_,
    clearPreparedShare: clearPreparedShare_,
    importFile: importFile_,
    preflightCollision: preflightCollision_,
    validatePackage: async function (raw) {
      var pkg = parsePackage_(raw);
      return validatePackage_(pkg);
    }
  });

  console.log('[V24.5 MAP PACKAGE] Import/export + SHA-256 integrity boundary ready');
})(window);
