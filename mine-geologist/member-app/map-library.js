/* MG1 V24.3 — MAP LIBRARY / SINGLE SOURCE OF TRUTH (Slice 3)
 *
 * Canonical persistence source: IndexedDB via map-package.js.
 * backgroundMapsList remains a legacy in-memory compatibility cache only.
 *
 * Safety:
 * - No renderer, viewport, marker, tile, GeoReference, or save algorithm changes.
 * - Existing V23 atomic activation/delete helpers are preferred when available.
 * - This slice changes Map Library reads/actions at the boundary only.
 */
(function (global) {
  'use strict';

  async function getAll() {
    if (typeof global.dbGetAllMaps_ === 'function') {
      return await global.dbGetAllMaps_();
    }
    if (typeof global.backgroundMapsList !== 'undefined') {
      return Array.isArray(global.backgroundMapsList) ? global.backgroundMapsList.slice() : [];
    }
    return [];
  }

  async function find(id) {
    if (!id) return null;
    const maps = await getAll();
    return maps.find(function (m) { return m && String(m.id) === String(id); }) || null;
  }

  async function getActive() {
    let id = null;
    try { id = global.localStorage.getItem('mg1_active_bg_map_id') || null; } catch (_) {}
    return id ? await find(id) : null;
  }

  async function refresh() {
    if (typeof global.loadBackgroundMapsFromDb_ === 'function') {
      await global.loadBackgroundMapsFromDb_();
      return await getAll();
    }
    const maps = await getAll();
    try { global.backgroundMapsList = maps.slice(); } catch (_) {}
    return maps;
  }

  async function updateMetadata(id, patch) {
    if (!id) throw new Error('Map Library updateMetadata requires id');
    if (!patch || typeof patch !== 'object') throw new Error('Map Library updateMetadata requires patch');
    const current = await find(id);
    if (!current) throw new Error('Map Library map not found: ' + id);

    // Metadata-only write boundary. Runtime payload fields are deliberately
    // not accepted here so rename/folder/collection cannot accidentally
    // mutate tiles, GeoReference, imageDataUrl, or tilePyramid.
    const updated = Object.assign({}, current);
    ['name', 'folderName', 'collectionNames'].forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        if (key === 'name') {
          const name = String(patch[key] == null ? '' : patch[key]).trim();
          if (!name) throw new Error('Map Library name cannot be empty');
          updated.name = name.slice(0, 120);
        } else if (key === 'folderName') {
          const folder = String(patch[key] == null ? '' : patch[key]).trim().slice(0, 80);
          if (folder) updated.folderName = folder; else delete updated.folderName;
        } else if (key === 'collectionNames') {
          const values = Array.isArray(patch[key]) ? patch[key] : [];
          const seen = Object.create(null), names = [];
          values.forEach(function (v) {
            const name = String(v == null ? '' : v).trim().slice(0, 80);
            if (!name) return;
            const k = name.toLocaleLowerCase();
            if (seen[k]) return;
            seen[k] = true; names.push(name);
          });
          if (names.length) updated.collectionNames = names.slice(0, 8);
          else delete updated.collectionNames;
        }
      }
    });

    const check = validate(updated);
    if (!check.ok) throw new Error(check.errors.join(', '));
    if (typeof global.dbPutMap_ !== 'function') throw new Error('Map Library metadata storage unavailable');
    await global.dbPutMap_(updated);

    if (Array.isArray(global.backgroundMapsList)) {
      const idx = global.backgroundMapsList.findIndex(function (m) { return m && String(m.id) === String(id); });
      if (idx >= 0) global.backgroundMapsList[idx] = updated;
    }
    return updated;
  }

  async function activate(id) {
    if (!id) throw new Error('Map Library activate requires id');
    // Preserve the already-tested V23 isolated/atomic path whenever installed.
    if (typeof global._v23ActivateMap === 'function') {
      return global._v23ActivateMap(id);
    }
    if (typeof global.activateBackgroundMap_ === 'function') {
      return global.activateBackgroundMap_(id);
    }
    throw new Error('Map Library activate boundary unavailable');
  }

  async function remove(id) {
    if (!id) throw new Error('Map Library remove requires id');
    // Preserve the already-tested V23 delete confirmation/lifecycle path.
    if (typeof global._v23DeleteMap === 'function') {
      return global._v23DeleteMap(id);
    }
    if (typeof global.deleteBackgroundMapEntry_ === 'function') {
      return global.deleteBackgroundMapEntry_(id);
    }
    throw new Error('Map Library remove boundary unavailable');
  }

  function validate(entry) {
    if (global.MG1MapLibraryContract && typeof global.MG1MapLibraryContract.validate === 'function') {
      return global.MG1MapLibraryContract.validate(entry);
    }
    return { ok: true, errors: [] };
  }

  function metadata(entry) {
    if (global.MG1MapLibraryContract && typeof global.MG1MapLibraryContract.metadata === 'function') {
      return global.MG1MapLibraryContract.metadata(entry);
    }
    return null;
  }

  global.MG1MapLibrary = Object.freeze({
    getAll: getAll,
    find: find,
    getActive: getActive,
    refresh: refresh,
    activate: activate,
    remove: remove,
    updateMetadata: updateMetadata,
    validate: validate,
    metadata: metadata
  });

  console.log('[V24.3 MAP LIBRARY] Slice 14 ready — metadata writes centralized; V23 actions preserved');
})(window);
