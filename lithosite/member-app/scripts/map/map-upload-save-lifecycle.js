// MINE GEOLOGIST — STEP 9.11-B
// Map Upload / Save Lifecycle boundary.
// Structural extraction only: logic and global contract preserved.

async function submitMapUpload_() {
  cancelApplyGeoReferenceRaf_();
  if (mapUploadBusy || mapUploadProcessing) return;
  const f = mapUploadFormState;
  if (!f.fileDataUrl) { mapUploadStatusMsg = 'Pilih gambar peta dulu.'; mapUploadStatusOk = false; render(); return; }
  if (!f.name.trim()) { mapUploadStatusMsg = 'Nama peta wajib diisi.'; mapUploadStatusOk = false; render(); return; }
  if (!isStrictNumeric(f.tlTimur) || !isStrictNumeric(f.tlUtara) || !isStrictNumeric(f.brTimur) || !isStrictNumeric(f.brUtara)) {
    mapUploadStatusMsg = 'Ke-4 angka Timur/Utara wajib angka valid (bukan kosong/teks).'; mapUploadStatusOk = false; render(); return;
  }

  // V17.1 NO FLICKER: capture the currently visible map BEFORE the final render().
  // The snapshot lives outside #app, so replacing app.innerHTML cannot expose a
  // black/empty frame while the new SVG/tile images are being attached.
  const v17MapFreeze = captureMapSurfaceTransition_();
  mapUploadBusy = true;
  mapUploadStatusMsg = 'Menyimpan ke HP...';
  mapUploadStatusOk = true;
  paintMapUploadSaveUi_();

  let id = null;
  let savedToHp = false;
  try {
    id = 'bgmap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const runtimeFile = mapUploadRuntimeFile_;
    const tilePyramid = (f.tilePyramid && typeof f.tilePyramid === 'object') ? { ...f.tilePyramid } : null;
    // V15.14: set runtimeMapId BEFORE initial DB write so persisted metadata sudah lengkap.
    if (tilePyramid) tilePyramid.runtimeMapId = id;

    await dbPutMap_({
      id: id,
      name: f.name.trim(),
      imageDataUrl: f.fileDataUrl,
      cornerTL: f.geoReference && f.geoReference.extent ? { ...f.geoReference.extent.cornerTL } : { timur: parseFloat(f.tlTimur), utara: parseFloat(f.tlUtara) },
      cornerBR: f.geoReference && f.geoReference.extent ? { ...f.geoReference.extent.cornerBR } : { timur: parseFloat(f.brTimur), utara: parseFloat(f.brUtara) },
      geoReference: f.geoReference || null,
      tilePyramid: tilePyramid,
      uploadedAt: new Date().toISOString(),
      uploadedBy: sessionInfo ? sessionInfo.userName : 'unknown'
    });
    savedToHp = true;
    mapUploadStatusMsg = '✓ Peta berhasil disimpan ke HP.';
    mapUploadStatusOk = true;
    paintMapUploadSaveUi_();

    // Refresh in-memory list, tetapi JANGAN render() di tengah lifecycle.
    await loadBackgroundMapsFromDb_();

    // V15.12/V15.14: runtime PDF source memakai File asli yang dipilih user.
    // Jika registration gagal/tidak tersedia, itu bukan kegagalan penyimpanan map.
    if (f.geoReference && runtimeFile) {
      const registered = registerLithositeRuntimePdfSource_(id, runtimeFile, f.geoReference);
      if (!registered) {
        mapUploadStatusMsg = '✓ Peta tersimpan. Runtime source belum aktif pada sesi ini.';
        mapUploadStatusOk = true;
        paintMapUploadSaveUi_();
      }
    } else if (f.geoReference && !runtimeFile) {
      mapUploadStatusMsg = '✓ Peta tersimpan. Runtime source PDF tidak tersedia pada sesi ini.';
      mapUploadStatusOk = true;
      paintMapUploadSaveUi_();
    }

    activeBackgroundMapId = id;
    mapZoom = 1.25;
    compassRotationOffsetDeg_ = 0;
    mapRotationDeg_ = (compassState_.active && Number.isFinite(compassState_.smoothedHeadingDeg)) ? normalizeSignedDeg_(-compassState_.smoothedHeadingDeg) : 0;
    mapViewportState_.centerNative = null;
    localStorage.setItem('mg1_active_bg_map_id', id);
    mapUploadFormOpen = false;
  } catch (e) {
    if (savedToHp) {
      // Defensive: seharusnya tidak masuk sini setelah dbPutMap_ sukses, tetapi jangan
      // pernah menyatakan "gagal simpan" kalau data sudah commit di IndexedDB.
      mapUploadStatusMsg = '✓ Peta sudah tersimpan ke HP. Ada langkah lanjutan yang gagal: ' + String(e && e.message || e);
      mapUploadStatusOk = true;
    } else {
      mapUploadStatusMsg = 'Gagal menyimpan ke HP: ' + String(e && e.message || e);
      mapUploadStatusOk = false;
    }
  } finally {
    mapUploadBusy = false;
    // Exactly one final render. The old map remains visually frozen outside #app
    // until the new viewport has had a chance to attach/decode its tiles.
    render();
    releaseMapSurfaceTransition_(v17MapFreeze);
  }
}
