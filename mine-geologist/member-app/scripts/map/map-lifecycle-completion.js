/* MG1 / LITHOSITE V24.4 — MAP LIFECYCLE COMPLETION
 * Owns lifecycle completion only: state contract, duplicate/copy, replace,
 * and recovery boundaries. Does not own rendering, tiles, GeoReference,
 * activation algorithm, or IndexedDB primitives.
 *
 * Protected: Tile Engine / C1 / C2 / renderer / viewport / gestures / marker-GPS /
 * GeoReference processing / Atomic Surface implementation / tile persistence algorithm.
 */
(function (global) {
  'use strict';

  var VERSION = '24.4-s1';
  var pendingReplaceId = null;
  var originalSaveHandler = null;

  function nowIso_() { return new Date().toISOString(); }

  function makeId_() {
    return 'bgmap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  function cloneEntry_(entry) {
    if (typeof global.structuredClone === 'function') {
      try { return global.structuredClone(entry); } catch (_) {}
    }
    return JSON.parse(JSON.stringify(entry));
  }

  function getMaps_() {
    return (global.MG1MapLibrary && typeof global.MG1MapLibrary.getAll === 'function')
      ? global.MG1MapLibrary.getAll()
      : Promise.resolve(Array.isArray(global.backgroundMapsList) ? global.backgroundMapsList.slice() : []);
  }

  async function getEntry_(id) {
    if (!id) throw new Error('Map lifecycle requires id');

    // V24.1 save is intentionally RAM-first: a newly saved map can be visible
    // in Map Library before its deferred IndexedDB write completes. Lifecycle
    // actions must therefore resolve the runtime-visible entry as a fallback
    // when the canonical DB lookup has not caught up yet.
    if (global.MG1MapLibrary && typeof global.MG1MapLibrary.find === 'function') {
      var found = await global.MG1MapLibrary.find(id);
      if (found) return found;
    }

    if (Array.isArray(global.backgroundMapsList)) {
      var ramFound = global.backgroundMapsList.find(function (m) {
        return m && String(m.id) === String(id);
      });
      if (ramFound) return ramFound;
    }

    var maps = await getMaps_();
    return maps.find(function (m) { return m && String(m.id) === String(id); }) || null;
  }

  function getActiveId_() {
    try {
      return (typeof global.activeBackgroundMapId !== 'undefined' && global.activeBackgroundMapId)
        || global.localStorage.getItem('mg1_active_bg_map_id') || null;
    } catch (_) { return null; }
  }

  function stateOf_(entry) {
    if (!entry) return { state: 'MISSING', exists: false, valid: false, active: false, hasPayload: false };
    var valid = !!(entry.id && entry.name);
    var hasPayload = !!(entry.imageDataUrl || entry.tilePyramid);
    var active = String(getActiveId_() || '') === String(entry.id);
    return {
      state: !valid ? 'INVALID' : (active ? 'ACTIVE' : 'READY'),
      exists: true,
      valid: valid,
      active: active,
      hasPayload: hasPayload,
      id: String(entry.id),
      name: String(entry.name || '')
    };
  }

  async function syncRam_() {
    if (typeof global.loadBackgroundMapsFromDb_ === 'function') {
      await global.loadBackgroundMapsFromDb_();
      return;
    }
    if (global.MG1MapLibrary && typeof global.MG1MapLibrary.getAll === 'function') {
      global.backgroundMapsList = await global.MG1MapLibrary.getAll();
    }
  }

  function replaceRamEntry_(entry) {
    if (!Array.isArray(global.backgroundMapsList)) return;
    var idx = global.backgroundMapsList.findIndex(function (m) { return m && String(m.id) === String(entry.id); });
    if (idx >= 0) global.backgroundMapsList[idx] = entry;
    else global.backgroundMapsList.push(entry);
  }

  async function persist_(entry) {
    if (typeof global.dbPutMap_ !== 'function') throw new Error('Map lifecycle storage unavailable');
    await global.dbPutMap_(entry);
  }

  async function duplicate(id) {
    var source = await getEntry_(id);
    if (!source) throw new Error('Map tidak ditemukan: ' + id);
    var copy = cloneEntry_(source);
    var newId = makeId_();
    copy.id = newId;
    copy.name = String(source.name || 'Peta') + ' Copy';
    copy.uploadedAt = nowIso_();
    copy.uploadedBy = (global.sessionInfo && global.sessionInfo.userName) || source.uploadedBy || 'unknown';
    if (copy.tilePyramid && typeof copy.tilePyramid === 'object') copy.tilePyramid.runtimeMapId = newId;
    await persist_(copy);
    replaceRamEntry_(copy);
    return copy;
  }

  function getUploadState_() {
    var modal = global.MG1NewMapModal;
    return modal && modal._state ? modal._state : null;
  }

  function parseManualCoords_() {
    var ids = ['mg1-v19-tl-timur','mg1-v19-tl-utara','mg1-v19-br-timur','mg1-v19-br-utara'];
    var vals = ids.map(function (id) {
      var el = document.getElementById(id);
      return el ? parseFloat(el.value) : NaN;
    });
    if (vals.some(function (v) { return !Number.isFinite(v); })) return null;
    return { cornerTL: { timur: vals[0], utara: vals[1] }, cornerBR: { timur: vals[2], utara: vals[3] } };
  }

  function buildReplacementEntry_(source, state) {
    if (!state || !state.fileDataUrl) throw new Error('File pengganti belum siap');
    var corners = (state.cornerTL && state.cornerBR)
      ? { cornerTL: state.cornerTL, cornerBR: state.cornerBR }
      : parseManualCoords_();
    if (!corners) throw new Error('Koordinat pengganti belum lengkap');

    var entry = cloneEntry_(source);
    entry.name = String(state.name || source.name || 'Peta').trim();
    if (!entry.name) throw new Error('Nama peta tidak boleh kosong');
    entry.imageDataUrl = state.fileDataUrl;
    entry.cornerTL = state.geoReference && state.geoReference.extent
      ? cloneEntry_(state.geoReference.extent.cornerTL) : cloneEntry_(corners.cornerTL);
    entry.cornerBR = state.geoReference && state.geoReference.extent
      ? cloneEntry_(state.geoReference.extent.cornerBR) : cloneEntry_(corners.cornerBR);
    entry.geoReference = state.geoReference || null;
    entry.tilePyramid = state.tilePyramid ? cloneEntry_(state.tilePyramid) : null;
    if (entry.tilePyramid && typeof entry.tilePyramid === 'object') entry.tilePyramid.runtimeMapId = entry.id;
    entry.updatedAt = nowIso_();
    entry.updatedBy = (global.sessionInfo && global.sessionInfo.userName) || entry.uploadedBy || 'unknown';
    return entry;
  }

  async function commitReplacement_(entry, wasActive) {
    // Transaction boundary: IndexedDB commit is authoritative. RAM is synced
    // only after the durable write succeeds; the old entry remains untouched
    // if the durable write fails.
    await persist_(entry);
    replaceRamEntry_(entry);
    try { await syncRam_(); } catch (_) { replaceRamEntry_(entry); }

    if (!wasActive) return { ok: true, active: false };

    // Preserve active identity. Only the surface is swapped after durable commit.
    try {
      if (typeof global.executeAtomicSurfaceSwap_ === 'function' && typeof global.buildNewMapSurfaceV22 === 'function') {
        var vp = document.getElementById('mg1-map-viewport');
        if (vp) {
          var swapped = await global.executeAtomicSurfaceSwap_(vp, global.buildNewMapSurfaceV22);
          if (swapped === false) return { ok: true, active: true, surface: 'retained-old' };
        }
      }
    } catch (surfaceError) {
      console.warn('[V24.4] replacement surface swap failed; persisted map retained', surfaceError);
      return { ok: true, active: true, surface: 'retained-old', recovery: true };
    }
    return { ok: true, active: true, surface: 'updated' };
  }

  async function saveReplacement_() {
    var id = pendingReplaceId;
    if (!id) return false;
    var source = await getEntry_(id);
    if (!source) throw new Error('Map pengganti tidak ditemukan: ' + id);
    var state = getUploadState_();
    var entry = buildReplacementEntry_(source, state);
    var wasActive = String(getActiveId_() || '') === String(id);
    var result = await commitReplacement_(entry, wasActive);

    // Runtime PDF source is session-only; failure here must not roll back a
    // successful map persistence.
    try {
      var runtimeFile = global._v19RuntimeFile || state.file;
      if (entry.geoReference && runtimeFile && typeof global.registerLithositeRuntimePdfSource_ === 'function') {
        global.registerLithositeRuntimePdfSource_(entry.id, runtimeFile, entry.geoReference);
      }
    } catch (e) {
      console.warn('[V24.4] runtime source registration skipped', e);
    }

    pendingReplaceId = null;
    if (global.MG1NewMapModal && typeof global.MG1NewMapModal.close === 'function') global.MG1NewMapModal.close();
    if (typeof global._v23OpenManageModal === 'function') setTimeout(function () { global._v23OpenManageModal(); }, 260);
    console.log('[V24.4] Map replacement committed', entry.id, result);
    return result;
  }

  function bindReplacementSave_() {
    var btn = document.getElementById('mg1-new-modal-save');
    if (!btn || !pendingReplaceId) return false;
    if (!originalSaveHandler) originalSaveHandler = btn.onclick;
    btn.onclick = async function () {
      if (!pendingReplaceId) return originalSaveHandler && originalSaveHandler.call(btn);
      var state = getUploadState_();
      if (!state || state.processing || state.busy) return;
      state.busy = true;
      btn.textContent = 'Mengganti...';
      btn.style.opacity = '0.7';
      try {
        await saveReplacement_();
      } catch (e) {
        console.error('[V24.4] replacement failed; original map retained', e);
        state.busy = false;
        btn.textContent = 'Ganti Data Peta';
        btn.style.opacity = '1';
        var status = document.getElementById('mg1-new-modal-status');
        if (status) { status.textContent = 'Gagal mengganti peta: ' + String(e && e.message || e); status.style.color = '#fb7185'; }
      }
    };
    btn.textContent = 'Ganti Data Peta';
    return true;
  }

  async function beginReplace(id) {
    var source = await getEntry_(id);
    if (!source) throw new Error('Map tidak ditemukan: ' + id);
    pendingReplaceId = String(id);
    if (global.MG1NewMapModal && typeof global.MG1NewMapModal.open === 'function') {
      global.MG1NewMapModal.open();
      setTimeout(function () {
        var state = getUploadState_();
        if (state) state.name = String(source.name || '');
        var input = document.getElementById('mg1-new-modal-name');
        if (input) input.value = String(source.name || '');
        bindReplacementSave_();
      }, 20);
      setTimeout(bindReplacementSave_, 100);
      setTimeout(bindReplacementSave_, 300);
      return true;
    }
    pendingReplaceId = null;
    throw new Error('New Map modal unavailable');
  }

  function cancelReplace_() { pendingReplaceId = null; }

  global.MG1MapLifecycleCompletion = Object.freeze({
    version: VERSION,
    stateOf: stateOf_,
    duplicate: duplicate,
    beginReplace: beginReplace,
    cancelReplace: cancelReplace_
  });

  console.log('[V24.4 MAP LIFECYCLE] State contract + duplicate/replace boundary ready');
})(window);
