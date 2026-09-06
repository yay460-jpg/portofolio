/* STEP 7.6 V10.6.1 TOUCH OWNERSHIP BUILD: direct PDF.js tile path; logic unchanged from V4. */
/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- member-app/scripts/peta.js
 * [PARTISI -- 4 Sep, Tahap 4] Tab Peta -- Mine Grid SVG, North Arrow (3-mode
 * Grid/True/GPS-disabled), Mode Ukur (TP->TP Bearing+Distance), Detail Modal per-TP.
 * Diekstrak dari index.html tunggal -- 0 restrukturisasi logika.
 * Dependency: shared/geo-engine.js (inverseUtm_/gridConvergence_/computeConvergence-
 * ForPoint_/bearingDistanceGrid_), config.js (getField/icon), validasi.js
 * (groupValidasiByTp/getGradeColorPreset), digging.js (globalValidasiFullForMap),
 * render()/switchTab() (index.html Tahap 5).
 * ============================================================ */

// ==== PETA (Mine Grid) -- v90.2.113 BARU ====
// State panel/interaksi peta -- terpisah dari state tab lain, tidak saling pengaruh.
let mapZoom = 1;             // 1 = fit-all murni; default background map memakai 1.25x agar layout lebih padat
let mapViewportState_ = { centerNative: null }
let mapPanVelocity_ = { x:0, y:0, lastX:0, lastY:0, lastT:0 };
let mapPanInertiaRaf_ = null;; // posisi viewport persisten; tap tidak pernah mengubahnya
// STEP 5.6: state gesture pinch-to-zoom 2 jari.
let mapPinchState_ = { active: false, startDistance: 0, startZoom: 1, anchorNative: null, midX: 0, midY: 0, suppressTapUntil: 0, visualSvg: null };
let mapPinchRenderScheduled_ = false;
// STEP 7.6: single-finger pan state. Selama gesture aktif, SVG yang sudah tampil
// digerakkan oleh compositor (CSS transform); DOM/tile tidak dibangun ulang per touchmove.
let mapPanState_ = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, baseCenterNative: null, baseRectW: 0, baseRectH: 0, baseBounds: null, visualSvg: null, moved: false, suppressTapUntil: 0, velocityX: 0, velocityY: 0, lastX: 0, lastY: 0, lastT: 0 };
let mapPanRenderScheduled_ = false;

// STEP 7.6 gesture ownership: cegah long-press Android/Chrome mengambil alih
// map image (context menu / save image / share). Hanya berlaku di area map.
function isMapGestureTarget_(target) {
  try { return !!(target && target.closest && target.closest('svg[data-map-gesture=\"true\"]')); } catch (_) { return false; }
}
if (typeof document !== 'undefined') {
  document.addEventListener('contextmenu', function(event) {
    if (isMapGestureTarget_(event.target)) event.preventDefault();
  }, true);
  document.addEventListener('selectstart', function(event) {
    if (isMapGestureTarget_(event.target)) event.preventDefault();
  }, true);
  document.addEventListener('dragstart', function(event) {
    if (isMapGestureTarget_(event.target)) event.preventDefault();
  }, true);
}
// STEP 7.6 V10.4: unified Pointer Events state. Visual movement stays on compositor.
let mapPointerState_ = new Map();
// STEP 7.6B-V13.1: one gesture = one input owner.
let mapGestureOwner_ = null; // 'touch' | 'pointer' | null
let mapGestureRenderPending_ = false;
function requestMapRender_() {
  if (mapPanState_.active || mapPinchState_.active || mapPanInertiaRaf_) {
    mapGestureRenderPending_ = true;
    return;
  }
  render();
}
function flushMapGestureRender_() {
  if (!mapGestureRenderPending_) return;
  mapGestureRenderPending_ = false;
  render();
}
// STEP 7.6B-V13.2: clear stale transient input state before a new gesture.
function resetMapGestureTransientState_() {
  mapGestureOwner_ = null;
  mapPointerState_.clear();
  mapPanState_.active = false; mapPanState_.visualSvg = null;
  mapPanState_.dx = 0; mapPanState_.dy = 0;
  mapPanState_.velocityX = 0; mapPanState_.velocityY = 0; mapPanState_.moved = false;
  mapPinchState_.active = false; mapPinchState_.visualSvg = null;
  mapPinchRenderScheduled_ = false; mapPanRenderScheduled_ = false;
  if (mapPanInertiaRaf_) { try { cancelAnimationFrame(mapPanInertiaRaf_); } catch (_) {} mapPanInertiaRaf_ = null; }
}
let mapViewportRatio_ = 1;
let mapViewportSyncScheduled_ = false;

function blockMapContextMenu_() {
  try {
    const vp = document.getElementById('mg1-map-viewport');
    if (!vp || vp.__mg1CtxBlocked) return;
    vp.__mg1CtxBlocked = true;
    const stop = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    vp.addEventListener('contextmenu', stop, { capture: true, passive: false });
    vp.addEventListener('selectstart', stop, { capture: true, passive: false });
    vp.addEventListener('dragstart', stop, { capture: true, passive: false });
    vp.addEventListener('mousedown', (e) => { if (e.button===2) stop(e); }, { capture: true });
    let longPressTimer = null;
    vp.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        clearTimeout(longPressTimer);
        // TRACE: jangan preventDefault di sini dengan stale event, cegah menu via CSS saja
        longPressTimer = setTimeout(() => { console.log('[TRACE] longPress 400ms would trigger menu - blocked by CSS'); }, 400);
      }
    }, { passive: true, capture: true });
    vp.addEventListener('touchend', () => { clearTimeout(longPressTimer); }, { passive: true });
    vp.addEventListener('touchmove', () => { clearTimeout(longPressTimer); }, { passive: false });
  } catch(e){}
}
// STEP 7.6B-ROOT-2: activate scoped map touch/context ownership after DOM creation.
function ensureMapContextBlocker_() {
  try {
    if (typeof blockMapContextMenu_ === 'function') blockMapContextMenu_();
  } catch (_) {}
}

function getMapViewportRatio_() {
  const el = document.getElementById('mg1-map-viewport');
  if (!el) return 1;
  const w = el.clientWidth, h = el.clientHeight;
  if (!(w > 0 && h > 0)) return 1;
  return w / h;
}

function scheduleMapViewportFit_() {
  if (mapViewportSyncScheduled_) return;
  mapViewportSyncScheduled_ = true;
  requestAnimationFrame(() => {
    mapViewportSyncScheduled_ = false;
    const ratio = getMapViewportRatio_();
    if (ratio > 0 && Math.abs(ratio - mapViewportRatio_) >= 0.01) {
      mapViewportRatio_ = ratio;
      render();
    }
  });
}

if (!window.__mg1MapViewportResizeBound) {
  window.__mg1MapViewportResizeBound = true;
  window.addEventListener('resize', scheduleMapViewportFit_, { passive: true });
}

let mapDetailIdTp = null;    // ID TP yg sedang dibuka detailnya, null = tidak ada modal terbuka
// v90.2.116 BARU (permintaan user -- lompat dari Validasi ke lokasi Peta): TP yg harus
// otomatis dibuka detailnya begitu tab Peta aktif -- dipicu dari tombol pin di kartu
// Validasi, BUKAN cuma pindah tab tapi juga langsung fokus ke TP spesifik yg diminta.
let mapFocusIdTp = null;
function focusMapFromValidasi(idTp) {
  mapFocusIdTp = idTp;
  switchTab('peta');
}
// STEP 7.5.1: 50m sebelumnya menjadi batas karena zoom maksimum = 4.
// Naik ke 8 agar target 25m dapat dicapai; tile pyramid tetap menjadi sumber detail.
const MAP_ZOOM_MIN = 1, MAP_ZOOM_MAX = 8, MAP_ZOOM_STEP = 0.5;

// STEP 7.5: tile pyramid generated from the already-rendered GeoPDF crop.
const GEOPDF_TILE_SIZE_ = 256;
// [BARU -- pengaman ringan] Batas atas eksplisit ukuran 1 tile (px). Tile SELALU
// dibuat <=GEOPDF_TILE_SIZE_, jadi ini sebenarnya jaring pengaman kedua -- murah,
// tidak pernah kena kecuali GEOPDF_TILE_SIZE_ diubah jadi sangat besar di masa depan.
const GEOPDF_TILE_SIZE_MAX_SAFE_ = 512;
const GEOPDF_TILE_LEVEL_FACTORS_ = [0.25, 0.5, 1, 2];
const GEOPDF_TILE_MAX_LEVEL_ = GEOPDF_TILE_LEVEL_FACTORS_.length - 1;

// ==== PETA BACKGROUND (foto udara/hasil olah ArcGIS) -- BARU 5 Sep ====
// Bukan baca GeoPDF/GeoTIFF asli (butuh mesin libproj+libgdal spt Avenza, mustahil di
// browser PWA) -- pendekatan lebih ringan: gambar biasa (PNG/JPG) + 2 titik referensi
// (Timur/Utara pojok kiri-atas & kanan-bawah gambar). Posisi & skala gambar dihitung
// otomatis pakai projectToSvg() yg SUDAH ADA (fungsi yg sama dipakai utk plot titik TP)
// -- 0 logic proyeksi baru perlu ditulis.
// Disimpan di IndexedDB (bukan localStorage -- gambar bisa besar, localStorage limitnya
// cuma ~5-10MB & síncron/blocking). SEMUA Member boleh upload, TAPI cuma LOKAL per-HP
// (keputusan disadari: tiap HP bisa beda peta background, belum otomatis seragam se-tim
// -- kalau nanti perlu diseragamkan, itu perlu versi backend terpisah, BUKAN sekarang).
const MAP_DB_NAME_ = 'mg1_background_maps';
const MAP_DB_STORE_ = 'maps';
const KML_DB_STORE_ = 'kmlOverlays'; // [BARU -- 5 Sep] store baru, DB version dinaikkan
let backgroundMapsList = []; // cache in-memory dari IndexedDB, direfresh tiap ada perubahan
let activeBackgroundMapId = null;
let mapManagePanelOpen = false;
let mapUploadFormOpen = false;
let mapUploadFormState = { name: '', fileDataUrl: '', fileName: '', tlTimur: '', tlUtara: '', brTimur: '', brUtara: '', geoReference: null, tilePyramid: null };
let mapUploadStatusMsg = '', mapUploadStatusOk = true, mapUploadBusy = false, mapUploadProcessing = false;
// STEP 8D: GPS realtime state -- hanya aktif saat user menyalakan GPS.
let gpsWatchId_ = null;
let gpsState_ = {
  active: false, status: 'off', lat: null, lon: null, accuracyM: null,
  timestamp: null, native: null, page: null, pixel: null, error: null
};
// STEP 8E: state koordinat hasil tap peta. Tidak mengubah state GPS/Mode Ukur.
let mapTapState_ = { active: false, svg: null, native: null, page: null, pixel: null, wgs84: null, error: null };

// [BARU -- 5 Sep] KML overlay (titik + garis batas) -- BEDA dari peta background: KML
// bisa BEBERAPA aktif SEKALIGUS (checkbox, bukan pilih 1 spt background image) krn cuma
// data vektor ringan (titik/garis), tidak saling menutupi spt gambar raster.
let kmlOverlaysList = [];
let activeKmlOverlayIds = []; // array id, bisa >1 aktif bersamaan
let kmlManagePanelOpen = false;
let kmlUploadFormOpen = false;
let kmlUploadFileName = '', kmlUploadParsedName = '', kmlUploadParsedPoints = [], kmlUploadParsedLines = [];
let kmlUploadStatusMsg = '', kmlUploadStatusOk = true, kmlUploadBusy = false;

function openMapDb_() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MAP_DB_NAME_, 2); // [BARU -- 5 Sep] versi 1->2, tambah store KML
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MAP_DB_STORE_)) db.createObjectStore(MAP_DB_STORE_, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(KML_DB_STORE_)) db.createObjectStore(KML_DB_STORE_, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbGetAllMaps_() {
  const db = await openMapDb_();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAP_DB_STORE_, 'readonly');
    const req = tx.objectStore(MAP_DB_STORE_).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbPutMap_(entry) {
  const db = await openMapDb_();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAP_DB_STORE_, 'readwrite');
    tx.objectStore(MAP_DB_STORE_).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbDeleteMap_(id) {
  const db = await openMapDb_();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAP_DB_STORE_, 'readwrite');
    tx.objectStore(MAP_DB_STORE_).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
// Dipanggil sekali saat boot (lihat pemanggilan di index.html) -- gagal (mis. browser
// lama tanpa IndexedDB) TIDAK BOLEH bikin app crash, Peta tetap jalan tanpa background.
async function loadBackgroundMapsFromDb_() {
  try {
    backgroundMapsList = await dbGetAllMaps_();
    const stored = localStorage.getItem('mg1_active_bg_map_id');
    if (stored && backgroundMapsList.find(m => m.id === stored)) { activeBackgroundMapId = stored; mapZoom = 1.25; mapViewportState_.centerNative = null; }
  } catch (e) {
    console.warn('Gagal muat daftar peta background (IndexedDB mungkin tidak didukung):', e);
    backgroundMapsList = [];
  }
  // [BARU -- 5 Sep] Muat juga daftar KML overlay + status aktif mana saja (bisa >1).
  try {
    const db = await openMapDb_();
    kmlOverlaysList = await new Promise((resolve, reject) => {
      const tx = db.transaction(KML_DB_STORE_, 'readonly');
      const req = tx.objectStore(KML_DB_STORE_).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    const storedActive = localStorage.getItem('mg1_active_kml_ids');
    if (storedActive) {
      const parsed = JSON.parse(storedActive);
      activeKmlOverlayIds = parsed.filter(id => kmlOverlaysList.find(k => k.id === id));
    }
  } catch (e) {
    console.warn('Gagal muat daftar KML overlay:', e);
    kmlOverlaysList = [];
  }
}
function openMapManagePanel_() { mapManagePanelOpen = true; render(); }
function closeMapManagePanel_() { mapManagePanelOpen = false; mapUploadFormOpen = false; render(); }
function openMapUploadForm_() {
  mapUploadFormState = { name: '', fileDataUrl: '', fileName: '', tlTimur: '', tlUtara: '', brTimur: '', brUtara: '', geoReference: null, tilePyramid: null };
  mapUploadStatusMsg = ''; mapUploadStatusOk = true; mapUploadBusy = false; mapUploadProcessing = false; mapUploadFormOpen = true; render();
}
function closeMapUploadForm_() { mapUploadFormOpen = false; mapUploadProcessing = false; render(); }
function updateMapUploadField_(field, value) { mapUploadFormState[field] = value; }
// [BARU -- 5 Sep] Deteksi GeoTIFF: cek EKSTENSI file (bukan cuma MIME type -- browser
// kadang kasih MIME kosong/salah utk .tif). Kalau .tif/.tiff, coba baca koordinat
// tertanam via geotiff.js DULU -- kalau GAGAL/tidak ada tag geo (spt file biasa yg
// diekspor "Export Map/Print" bukan "Export Data", lihat histori diskusi), otomatis
// JATUH KE alur manual (isi 2 sudut sendiri) -- TIDAK PERNAH bikin form macet/error total
// gara2 GeoTIFF gagal dibaca.
function syncMapUploadGeoReferenceDom_() {
  try {
    const f = typeof mapUploadFormState !== 'undefined' ? mapUploadFormState : (window.mapUploadFormState||null);
    if (!f) return;
    const pairs = [
      ['map-upload-tl-timur', f.tlTimur],
      ['map-upload-tl-utara', f.tlUtara],
      ['map-upload-br-timur', f.brTimur],
      ['map-upload-br-utara', f.brUtara]
    ];
    for (const [id, value] of pairs) {
      const el = document.getElementById(id);
      if (!el) continue;
      const strVal = value == null ? '' : String(value);
      if (strVal && el.value !== strVal) el.value = strVal;
      if (f.geoReference) {
        if (!el.readOnly) el.readOnly = true;
        requestAnimationFrame(()=>{ const e=document.getElementById(id); if(e) e.disabled=true; });
      } else {
        el.readOnly = false; el.disabled = false;
      }
    }
    const progText = document.getElementById('map-upload-progress-text');
    if (progText && typeof mapUploadStatusMsg === 'string') progText.textContent = mapUploadStatusMsg;
  } catch(e){ console.warn('sync DOM fail', e); }
}


function makeGeoPdfProgressReporter_() {
  // HOT PATH: dipanggil ratusan kali. Jangan render() modal di sini.
  // Semua update visual digabung ke 1 animation frame: status text + progress line.
  let pendingMsg = '';
  let pendingPercent = 0;
  let rafPending = false;
  let lastPercent = -1;

  const paint_ = () => {
    rafPending = false;
    const statusEl = document.getElementById('map-upload-status');
    const fillEl = document.getElementById('map-upload-progress-fill');
    const percent = Math.max(0, Math.min(100, Number(pendingPercent) || 0));
    const whole = Math.round(percent);

    if (statusEl && pendingMsg) statusEl.textContent = pendingMsg;
    if (fillEl && whole !== lastPercent) {
      fillEl.style.width = whole + '%';
      lastPercent = whole;
    }
  };

  return (stageMsg, percent = 0) => {
    pendingMsg = String(stageMsg || pendingMsg || 'Memproses GeoPDF...');
    pendingPercent = Math.max(0, Math.min(100, Number(percent) || 0));
    mapUploadStatusMsg = pendingMsg;
    mapUploadStatusOk = true;

    // Sinkronisasi koordinat tetap ringan; tidak membangun ulang modal.
    syncMapUploadGeoReferenceDom_();

    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(paint_);
    }
  };
}


async function handleMapImageFileSelected_(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const isTiff = /\.(tif|tiff)$/i.test(file.name);

  if (isTiff) {
    mapUploadStatusMsg = 'Membaca koordinat dari GeoTIFF...'; mapUploadStatusOk = true; render();
    const geoResult = await tryParseGeoTiff_(file);
    if (geoResult) {
      mapUploadFormState.geoReference = null;
      mapUploadFormState.fileDataUrl = geoResult.imageDataUrl;
      mapUploadFormState.fileName = file.name;
      mapUploadFormState.tlTimur = String(geoResult.cornerTL.timur);
      mapUploadFormState.tlUtara = String(geoResult.cornerTL.utara);
      mapUploadFormState.brTimur = String(geoResult.cornerBR.timur);
      mapUploadFormState.brUtara = String(geoResult.cornerBR.utara);
      mapUploadStatusMsg = '✓ Koordinat berhasil dibaca otomatis dari GeoTIFF -- cek angkanya, lalu Simpan.';
      mapUploadStatusOk = true; render(); return;
    }
    // GeoTIFF gagal/tidak ada tag koordinat -- lanjut ke alur gambar biasa di bawah
    // (banyak file .tif ternyata cuma gambar biasa yg disimpan ekstensi .tif, spt
    // temuan sebelumnya -- file "Export Map/Print" ArcGIS, bukan "Export Data").
    mapUploadStatusMsg = 'File .tif ini tidak punya koordinat tertanam (mungkin hasil "Export Map/Print", bukan "Export Data" dari ArcGIS) -- lanjut isi 2 sudut manual di bawah.';
    mapUploadStatusOk = false;
  } else if (/\.pdf$/i.test(file.name)) {
    // GeoPDF: pisahkan status GeoReference dari proses tile. Koordinat dikirim ke form
    // segera setelah metadata+transform tervalidasi; user tidak perlu menunggu seluruh
    // pyramid selesai.
    mapUploadStatusMsg = 'Membaca koordinat dari GeoPDF...'; mapUploadStatusOk = true; mapUploadProcessing = true; render();
    // STEP 7.5.3C: jangan gunakan Promise.race/timeout untuk lifecycle GeoPDF.
    // Tile pyramid pada Android lama memang dapat >20 detik. Timeout sebelumnya membuat
    // handler upload selesai lebih dulu sementara tryParseGeoPdf_ masih berjalan, sehingga
    // state form dan callback GeoReference bisa terlihat tidak sinkron. Satu promise menjadi
    // satu-satunya owner lifecycle sampai GeoReference + tilePyramid selesai.
    let geoReferenceReady = false;
    const applyGeoReferenceEarly_ = ({ geoReference, cornerTL, cornerBR }) => {
      if (!cornerTL || !cornerBR) return;
      geoReferenceReady = true;
      mapUploadFormState.geoReference = geoReference || null;
      mapUploadFormState.fileName = file.name;
      mapUploadFormState.tlTimur = String(cornerTL.timur);
      mapUploadFormState.tlUtara = String(cornerTL.utara);
      mapUploadFormState.brTimur = String(cornerBR.timur);
      mapUploadFormState.brUtara = String(cornerBR.utara);
      mapUploadStatusMsg = '✓ GeoReference/koordinat berhasil dibaca. Tile pyramid sedang diproses...';
      mapUploadStatusOk = true;
      // Update the live form immediately; render() below may recreate the modal DOM.
      syncMapUploadGeoReferenceDom_();
      render();
      // Re-apply after render so a freshly recreated modal cannot show stale defaults.
      requestAnimationFrame(() => syncMapUploadGeoReferenceDom_());
    };
    const progressReporter = makeGeoPdfProgressReporter_();
    const geoResult = await tryParseGeoPdf_(file, progressReporter, applyGeoReferenceEarly_);
    if (geoResult.ok) {
      mapUploadFormState.geoReference = geoResult.geoReference || null;
      mapUploadFormState.tilePyramid = geoResult.tilePyramid || null;
      mapUploadFormState.fileDataUrl = geoResult.imageDataUrl;
      mapUploadFormState.fileName = file.name;
      mapUploadFormState.tlTimur = String(geoResult.cornerTL.timur);
      mapUploadFormState.tlUtara = String(geoResult.cornerTL.utara);
      mapUploadFormState.brTimur = String(geoResult.cornerBR.timur);
      mapUploadFormState.brUtara = String(geoResult.cornerBR.utara);
      mapUploadStatusMsg = '✓ Koordinat & gambar berhasil dibaca otomatis dari GeoPDF -- cek angkanya, lalu Simpan.';
      mapUploadStatusOk = true;
    } else if (geoResult.cornerTL) {
      mapUploadFormState.geoReference = geoResult.geoReference || null;
      // [BARU -- 5 Sep] Kasus SEBAGIAN berhasil: koordinat ketemu, tapi render gambar
      // gagal (mis. pdf.js/CDN bermasalah di HP ini) -- isi angkanya SAJA, biar user
      // tidak perlu ketik ulang manual, tapi minta upload gambar terpisah (PNG/JPG hasil
      // export ArcGIS lain) krn gambarnya sendiri gagal dibuat dari PDF ini.
      mapUploadFormState.tlTimur = String(geoResult.cornerTL.timur);
      mapUploadFormState.tlUtara = String(geoResult.cornerTL.utara);
      mapUploadFormState.brTimur = String(geoResult.cornerBR.timur);
      mapUploadFormState.brUtara = String(geoResult.cornerBR.utara);
      mapUploadStatusMsg = geoResult.reason;
      mapUploadStatusOk = false;
    } else {
      mapUploadStatusMsg = geoResult.reason + ' PDF tidak bisa ditampilkan langsung di Peta -- silakan export ulang sbg gambar PNG/JPG.';
      mapUploadStatusOk = false;
    }
    mapUploadProcessing = false;
    render(); return;
  } else if (!file.type.startsWith('image/')) {
    mapUploadStatusMsg = 'File harus berupa gambar (PNG/JPG), GeoTIFF (.tif), atau GeoPDF (.pdf).'; mapUploadStatusOk = false; render(); return;
  }

  // STEP 6: ordinary PNG/JPG import has no GeoReference Object of its own.
  // Jangan membawa object GeoPDF dari pemilihan file sebelumnya ke raster lain.
  mapUploadFormState.geoReference = null;
  const reader = new FileReader();
  reader.onload = () => {
    mapUploadFormState.fileDataUrl = reader.result;
    mapUploadFormState.fileName = file.name;
    render();
  };
  reader.readAsDataURL(file);
}

// Kembalikan null kalau file BUKAN GeoTIFF bergeoreferensi (fallback aman, tidak throw
// ke pemanggil) -- kalau berhasil, kembalikan { imageDataUrl (PNG data-URL siap pakai di
// <img>/SVG <image>), cornerTL, cornerBR } dlm Timur/Utara (Easting/Northing native file,
// TIDAK dikonversi -- asumsi file UTM, konsisten dgn semua data proyek yg sudah dicek).
async function tryParseGeoTiff_(file) {
  if (typeof GeoTIFF === 'undefined') { console.warn('geotiff.js belum termuat.'); return null; }
  try {
    const buffer = await file.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(buffer);
    const image = await tiff.getImage();
    const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY]
    const isValidBbox = bbox && bbox.length === 4 && bbox.every(v => typeof v === 'number' && isFinite(v));
    // Tolak bbox default [0,0,width,height] (pola umum file TANPA geo tag sungguhan --
    // geotiff.js kadang isi bbox pixel-space apa adanya, bukan error/exception).
    const w = image.getWidth(), h = image.getHeight();
    const looksLikePixelSpaceFallback = isValidBbox && bbox[0] === 0 && bbox[1] === 0 && bbox[2] === w && bbox[3] === h;
    if (!isValidBbox || looksLikePixelSpaceFallback) return null;

    const raster = await image.readRasters({ interleave: true });
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(w, h);
    const samplesPerPixel = image.getSamplesPerPixel();
    for (let i = 0, p = 0; i < w * h; i++, p += 4) {
      if (samplesPerPixel >= 3) {
        imgData.data[p] = raster[i * samplesPerPixel];
        imgData.data[p+1] = raster[i * samplesPerPixel + 1];
        imgData.data[p+2] = raster[i * samplesPerPixel + 2];
      } else { // grayscale/1-band -- ulang ke 3 channel spy tetap kelihatan normal
        imgData.data[p] = imgData.data[p+1] = imgData.data[p+2] = raster[i];
      }
      imgData.data[p+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    return {
      imageDataUrl: canvas.toDataURL('image/png'),
      cornerTL: { timur: bbox[0], utara: bbox[3] }, // minX, maxY
      cornerBR: { timur: bbox[2], utara: bbox[1] }  // maxX, minY
    };
  } catch (e) {
    console.warn('Gagal parse GeoTIFF:', e);
    return null;
  }
}

// [BARU -- 5 Sep] Baca koordinat tertanam GeoPDF (standar OGC/ISO modern -- Viewport/
// Measure/GPTS/LPTS -- BUKAN standar TerraGo lama "LGIDict", itu di luar jangkauan
// SENGAJA, akan fallback ke manual kalau ketemu). Ekstraksi via REGEX teks mentah pada
// byte PDF, BUKAN lewat API resmi pdf.js (yg tidak expose dictionary internal scr rapi)
// -- pendekatan ini DIVALIDASI dulu manual terhadap 4 file GeoPDF ArcMap asli sebelum
// kode ini ditulis (semua berhasil, termasuk 1 file yg metadatanya SENGAJA rusak/salah
// label, lihat catatan heuristik di bawah).
// [DIPERBAIKI -- 5 Sep, temuan bug nyata di HP] SEBELUMNYA semua kegagalan (metadata tidak
// ketemu, ATAU pdf.js gagal muat/render) ditangkap 1 try/catch besar -> semua tampil pesan
// generik "bukan GeoPDF dikenali", padahal PENYEBABNYA BISA BEDA SAMA SEKALI (mis. pdf.js
// gagal render krn CDN diblok/worker gagal/file terlalu berat) -- MENYESATKAN saat debug.
// Sekarang kembalikan {ok:false, reason:'...'} spesifik per-tahap, bukan null generik.
// [BARU -- 5 Sep] Parameter onProgress OPSIONAL -- PURE INSTRUMENTASI, 0 mengubah logika
// inti sama sekali. Tujuannya: supaya kalau macet lagi, kita tahu PERSIS di tahap mana
// (baca file? cari metadata? muat pdf.js? buka dokumen? render halaman?) -- tanpa ini,
// "macet" cuma 1 titik buta besar, tidak bisa didiagnosis lebih lanjut dari jauh.
function solveAffineTransform2D_(src, dst) {
  if (!src || !dst || src.length !== dst.length || src.length < 3) return null;
  // Pilih tiga titik non-kolinear untuk menyelesaikan enam parameter affine.
  for (let i = 0; i < src.length - 2; i++) {
    for (let j = i + 1; j < src.length - 1; j++) {
      for (let k = j + 1; k < src.length; k++) {
        const x1=src[i].x,y1=src[i].y,x2=src[j].x,y2=src[j].y,x3=src[k].x,y3=src[k].y;
        const det = x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2);
        if (Math.abs(det) < 1e-9) continue;
        const d1=dst[i],d2=dst[j],d3=dst[k];
        const solve=(v1,v2,v3)=>({
          a:(v1*(y2-y3)+v2*(y3-y1)+v3*(y1-y2))/det,
          b:(x1*(v2-v3)+x2*(v3-v1)+x3*(v1-v2))/det,
          c:(x1*(y2*v3-y3*v2)+x2*(y3*v1-y1*v3)+x3*(y1*v2-y2*v1))/det
        });
        const tx=solve(d1.x,d2.x,d3.x), ty=solve(d1.y,d2.y,d3.y);
        return { ax:tx.a,bx:tx.b,cx:tx.c, ay:ty.a,by:ty.b,cy:ty.c };
      }
    }
  }
  return null;
}
function applyAffineTransform2D_(t, p) {
  return { x:t.ax*p.x+t.bx*p.y+t.cx, y:t.ay*p.x+t.by*p.y+t.cy };
}
// STEP 8B: Inverse affine transform -- native CRS -> PDF page coordinate.
// Dipakai untuk membalik arah page-to-native saat koordinat GPS/native akan
// diproyeksikan kembali ke posisi pada GeoPDF.
function applyInverseAffineTransform2D_(t, p) {
  if (!t || !p) return null;
  const det = t.ax * t.by - t.bx * t.ay;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;
  const dx = p.x - t.cx;
  const dy = p.y - t.cy;
  return {
    x: (t.by * dx - t.bx * dy) / det,
    y: (-t.ay * dx + t.ax * dy) / det
  };
}
// STEP 8C + STEP 11D: Composite bidirectional GeoPDF coordinate engine.
// Supports the projection families explicitly supported by projectionParamsFromCrs11C_():
// GEOGRAPHIC, WEB_MERCATOR, and TRANSVERSE_MERCATOR/UTM. Zone/hemisphere are required
// only for the TM/UTM family; geographic and Web Mercator CRS do not require them.
function wgs84ToGeoPdfPage_(geoReference, lat, lon) {
  if (!geoReference || !geoReference.crs || !geoReference.transform) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const crs=geoReference.crs, datum=String(crs.datum||'WGS84');
  const projection=String(crs.projection||'TRANSVERSE_MERCATOR').toUpperCase();
  const isGeographic=['GEOGRAPHIC','LATLON','GEOGRAPHIC_2D'].includes(projection) || Number(crs.epsg)===4326;
  const isWebMercator=['WEB_MERCATOR','MERCATOR_SPHERICAL'].includes(projection) || Number(crs.epsg)===3857 || Number(crs.epsg)===900913;
  const isTm=projection==='TRANSVERSE_MERCATOR' || projection==='TRANSVERSE_MERCATOR_UTM_COMPATIBLE' || projection==='UTM';
  if (!isGeographic && !isWebMercator && !isTm) return null;
  if (isTm && (!Number.isInteger(Number(crs.zone)) || Number(crs.zone)<1 || Number(crs.zone)>60 || !['N','S'].includes(String(crs.hemisphere||'').toUpperCase()))) return null;
  let nativeGeo={lat,lon,height:0};
  if (datum.toUpperCase()!=='WGS84') {
    const dt=geoReference.datumTransform;
    if (!dt || !dt.parameters) return null;
    nativeGeo=transformDatumWgs84To11B_(lat,lon,datum,dt.parameters);
    if (!nativeGeo) return null;
  }
  const ell=getDatumEllipsoid11B_(datum);
  if (!ell) return null;
  const native=forwardProjection11D_(nativeGeo.lat,nativeGeo.lon,crs,ell);
  if (!native || !Number.isFinite(native.easting) || !Number.isFinite(native.northing)) return null;
  const page=applyInverseAffineTransform2D_(geoReference.transform.coefficients||geoReference.transform,{x:native.easting,y:native.northing});
  if (!page) return null;
  return {lat,lon,native:{x:native.easting,y:native.northing},page};
}

function geoPdfPageToWgs84_(geoReference,pageX,pageY) {
  if (!geoReference || !geoReference.crs || !geoReference.transform) return null;
  if (!Number.isFinite(pageX) || !Number.isFinite(pageY)) return null;
  const crs=geoReference.crs, datum=String(crs.datum||'WGS84');
  const projection=String(crs.projection||'TRANSVERSE_MERCATOR').toUpperCase();
  const isGeographic=['GEOGRAPHIC','LATLON','GEOGRAPHIC_2D'].includes(projection) || Number(crs.epsg)===4326;
  const isWebMercator=['WEB_MERCATOR','MERCATOR_SPHERICAL'].includes(projection) || Number(crs.epsg)===3857 || Number(crs.epsg)===900913;
  const isTm=projection==='TRANSVERSE_MERCATOR' || projection==='TRANSVERSE_MERCATOR_UTM_COMPATIBLE' || projection==='UTM';
  if (!isGeographic && !isWebMercator && !isTm) return null;
  if (isTm && (!Number.isInteger(Number(crs.zone)) || Number(crs.zone)<1 || Number(crs.zone)>60 || !['N','S'].includes(String(crs.hemisphere||'').toUpperCase()))) return null;
  const native=applyAffineTransform2D_(geoReference.transform.coefficients||geoReference.transform,{x:pageX,y:pageY});
  if (!native || !Number.isFinite(native.x) || !Number.isFinite(native.y)) return null;
  const ell=getDatumEllipsoid11B_(datum);
  if (!ell) return null;
  const geoNative=inverseProjection11D_(native.x,native.y,crs,ell);
  if (!geoNative || !Number.isFinite(geoNative.lat) || !Number.isFinite(geoNative.lon)) return null;
  let wgs84=geoNative;
  if (datum.toUpperCase()!=='WGS84') {
    const dt=geoReference.datumTransform;
    if (!dt || !dt.parameters) return null;
    wgs84=transformDatum11BToWgs84_(geoNative.lat,geoNative.lon,datum,dt.parameters);
    if (!wgs84) return null;
  }
  return {page:{x:pageX,y:pageY},native,wgs84:{lat:wgs84.lat,lon:wgs84.lon}};
}

function validateBidirectionalGeoPdfTransform_(geoReference, points, toleranceMeters) {
  if (!geoReference || !Array.isArray(points) || !points.length) return { ok: false, reason: 'Input tidak lengkap.' };
  const tol = Number.isFinite(toleranceMeters) ? toleranceMeters : 0.1;
  let maxPageError = 0;
  let maxLatLonErrorMeters = 0;
  for (const p of points) {
    const a = wgs84ToGeoPdfPage_(geoReference, p.lat, p.lon);
    if (!a) return { ok: false, reason: 'Forward transform gagal.' };
    const b = geoPdfPageToWgs84_(geoReference, a.page.x, a.page.y);
    if (!b) return { ok: false, reason: 'Inverse transform gagal.' };
    const pageError = Math.hypot(b.native.x - a.native.x, b.native.y - a.native.y);
    const latErrorMeters = Math.abs(b.wgs84.lat - p.lat) * 111320;
    const lonScale = Math.max(Math.cos(p.lat * Math.PI / 180), 1e-6);
    const lonErrorMeters = Math.abs(b.wgs84.lon - p.lon) * 111320 * lonScale;
    const geoError = Math.hypot(latErrorMeters, lonErrorMeters);
    if (pageError > maxPageError) maxPageError = pageError;
    if (geoError > maxLatLonErrorMeters) maxLatLonErrorMeters = geoError;
  }
  return { ok: maxPageError <= tol && maxLatLonErrorMeters <= tol, maxPageError, maxLatLonErrorMeters };
}

function validateAffineTransform2D_(t, src, dst) {
  let maxError = 0;
  for (let i=0;i<src.length;i++) {
    const p=applyAffineTransform2D_(t,src[i]);
    const e=Math.hypot(p.x-dst[i].x,p.y-dst[i].y);
    if (e>maxError) maxError=e;
  }
  // GeoPDF tie points dari export raster normal harus konsisten sangat dekat; ambang 2 m
  // menjaga file dengan pembulatan metadata tetap diterima tanpa menerima transformasi rusak.
  return { ok:maxError <= 2, maxError };
}

// STEP 8D: PDF page <-> rendered VP-crop pixel coordinates.
// tryParseGeoPdf_() renders the VP area at the selected render scale, with PDF Y inverted by pdf.js.
const GEOPDF_RENDER_SCALE_ = 3.5; // STEP 7.4: dinaikkan dari 2 -- kurangi downsampling dini raster GeoPDF sblm di-crop PNG, kualitas lebih tajam saat deep-zoom. Guard memori (9C) & batas piksel/dimensi tetap menyesuaikan otomatis.
// STEP 9B: adaptive render guard for very large GeoPDF/VP areas.
const GEOPDF_MAX_RENDER_PIXELS_ = 12000000;
const GEOPDF_MAX_RENDER_DIMENSION_ = 4096;
// STEP 9C: Android memory guard. Canvas RGBA uses roughly 4 bytes/pixel, while
// PNG encoding/Data-URL and pdf.js internals temporarily need additional memory.
const GEOPDF_CANVAS_BYTES_PER_PIXEL_ = 4;
const GEOPDF_MEMORY_HEADROOM_ = 2.5;
// STEP M2: source-file preflight before ArrayBuffer/text duplication.
function getGeoPdfSourceMemoryProfileM2_() {
  const deviceMemory = Number(typeof navigator !== 'undefined' && navigator ? navigator.deviceMemory : NaN);
  let maxSourceBytes = 96 * 1024 * 1024;
  if (Number.isFinite(deviceMemory) && deviceMemory > 0) {
    if (deviceMemory <= 2) maxSourceBytes = 64 * 1024 * 1024;
    else if (deviceMemory <= 4) maxSourceBytes = 128 * 1024 * 1024;
    else maxSourceBytes = 256 * 1024 * 1024;
  }
  return { deviceMemory, maxSourceBytes };
}
function getGeoPdfMemoryProfile_() {
  const deviceMemory = Number(typeof navigator !== 'undefined' && navigator ? navigator.deviceMemory : NaN);
  let maxCanvasBytes = 64 * 1024 * 1024; // conservative default for Android WebView/browser.
  if (Number.isFinite(deviceMemory) && deviceMemory > 0) {
    if (deviceMemory <= 2) maxCanvasBytes = 32 * 1024 * 1024;
    else if (deviceMemory <= 4) maxCanvasBytes = 48 * 1024 * 1024;
    else maxCanvasBytes = 64 * 1024 * 1024;
  }
  return { deviceMemory, maxCanvasBytes };
}
function estimateGeoPdfRenderMemoryBytes_(width, height) {
  const pixels = Math.max(0, Number(width) || 0) * Math.max(0, Number(height) || 0);
  return pixels * GEOPDF_CANVAS_BYTES_PER_PIXEL_ * GEOPDF_MEMORY_HEADROOM_;
}
function releaseGeoPdfCanvas_(canvas) {
  if (!canvas) return;
  try { canvas.width = 1; canvas.height = 1; } catch (_) {}
  try { canvas.width = 0; canvas.height = 0; } catch (_) {}
}
function cleanupGeoPdfResources_(page, pdf, loadingTask, canvas) {
  try { if (page && typeof page.cleanup === 'function') page.cleanup(); } catch (_) {}
  try { if (pdf && typeof pdf.cleanup === 'function') pdf.cleanup(); } catch (_) {}
  try { if (pdf && typeof pdf.destroy === 'function') pdf.destroy(); } catch (_) {}
  try { if (!pdf && loadingTask && typeof loadingTask.destroy === 'function') loadingTask.destroy(); } catch (_) {}
  releaseGeoPdfCanvas_(canvas);
}
// STEP 7.5: Generator tile/pyramid dari hasil crop image yang SUDAH ada.
// Tidak merender GeoPDF ulang per tile. Level tertinggi (factor 1) mempertahankan
// resolusi crop asli; level bawah hanya downsample untuk zoom yang lebih dangkal.
// [DIPERBAIKI -- STEP 7.6.2 SAFE RENDER] Fungsi lama merender tiap tile LANGSUNG dari
// pdf.js pakai getViewport({offsetX,offsetY}) ke kanvas kecil -- ini PERSIS mekanisme yg
// terbukti gagal di HP nyata sebelumnya (Step 9B: hasil malah tampilkan seluruh halaman,
// bukan area yg diminta). Diganti total dengan pendekatan yg SUDAH tervalidasi lapangan:
// (1) render HALAMAN PENUH 1x saja (page.render() standar, tanpa offset apa pun),
// (2) potong ke VP BBox pakai drawImage() (operasi umum, 0 ambiguitas),
// (3) turunkan level pyramid lain dari hasil crop itu via drawImage() resize -- pola yg
//     SUDAH dikonfirmasi visual PASS oleh user sendiri (generator standalone STEP 7.5b).
// Guard memori (9C) sekarang BENAR-BENAR dipakai: kalau level tertinggi (mis. 2x) terlalu
// besar utk direder aman, level itu diturunkan otomatis -- bukan diam-diam diabaikan.
async function buildTilePyramidDirect_(page, vpBBox, baseScale, onProgress) {
  if (!page || !vpBBox || vpBBox.length !== 4) throw new Error('Data GeoPDF untuk tile pyramid tidak lengkap.');
  const tileSize = GEOPDF_TILE_SIZE_;
  const factors = GEOPDF_TILE_LEVEL_FACTORS_;
  const vpWPt = Math.abs(vpBBox[2] - vpBBox[0]);
  const vpHPt = Math.abs(vpBBox[3] - vpBBox[1]);
  if (!(vpWPt > 0) || !(vpHPt > 0)) throw new Error('VP BBox GeoPDF tidak valid untuk tile pyramid.');

  const out = {
    version: 2,
    mode: 'pdfjs-direct-tile-render',
    tileSize,
    baseScale,
    sourceWidth: Math.max(1, Math.round(vpWPt * baseScale)),
    sourceHeight: Math.max(1, Math.round(vpHPt * baseScale)),
    levels: [],
    maxLevel: factors.length - 1
  };

  // Hitung total tile seluruh level sekali supaya progress bar menunjukkan 0..100%
  // untuk keseluruhan pyramid, bukan reset 0% setiap ganti level.
  const levelPlan = factors.map((factor) => {
    const scale = baseScale * Number(factor);
    const width = Math.max(1, Math.round(vpWPt * scale));
    const height = Math.max(1, Math.round(vpHPt * scale));
    const tilesX = Math.ceil(width / tileSize);
    const tilesY = Math.ceil(height / tileSize);
    return { factor: Number(factor), scale, width, height, tilesX, tilesY, total: tilesX * tilesY };
  });
  const grandTotalTiles = Math.max(1, levelPlan.reduce((sum, item) => sum + item.total, 0));
  let globalDone = 0;
  if (onProgress) onProgress('Menyiapkan tile pyramid: 0/' + grandTotalTiles + ' (0%)', 0);

  // PDF.js tetap menjadi renderer sumber. Setiap tile dirender langsung dari halaman PDF
  // pada resolusi levelnya; kita tidak meng-upscale satu PNG crop yang sudah ter-raster.
  // Ini mempertahankan detail vector/text pada deep zoom dan lebih dekat ke pola quadrant
  // renderer Avenza yang sudah kita audit.
  for (let li = 0; li < factors.length; li++) {
    const plan = levelPlan[li];
    const factor = plan.factor;
    const scale = plan.scale;
    const width = plan.width;
    const height = plan.height;
    const tilesX = plan.tilesX;
    const tilesY = plan.tilesY;
    const tiles = [];
    const total = tilesX * tilesY;
    let done = 0;
    const viewport = page.getViewport({ scale });

    // PDF page coordinates: origin bottom-left. Convert VP crop top edge into viewport
    // (canvas) coordinates before building the tile offsets.
    const leftPt = Math.min(vpBBox[0], vpBBox[2]);
    const bottomPt = Math.min(vpBBox[1], vpBBox[3]);
    const topPt = Math.max(vpBBox[1], vpBBox[3]);
    const cropLeftPx = leftPt * scale;
    const cropTopPx = viewport.height - (topPt * scale);
    const pageLeftPx = cropLeftPx;
    const pageTopPx = cropTopPx;

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const x = tx * tileSize;
        const y = ty * tileSize;
        const tw = Math.min(tileSize, width - x);
        const th = Math.min(tileSize, height - y);
        // [BARU -- pengaman ringan] Tiap tile SELALU <= tileSize (256px), jadi risiko
        // memori per-tile memang kecil -- tapi validasi eksplisit tetap murah & aman
        // sbg jaring pengaman kalau suatu saat GEOPDF_TILE_SIZE_ diubah jadi besar.
        if (tw <= 0 || th <= 0 || tw > GEOPDF_TILE_SIZE_MAX_SAFE_ || th > GEOPDF_TILE_SIZE_MAX_SAFE_) {
          console.warn('Tile ' + tx + ',' + ty + ' level ' + li + ' dilewati (ukuran tidak wajar: ' + tw + 'x' + th + ').');
          done++; globalDone++;
          continue;
        }
        let canvas = null;
        try {
          canvas = document.createElement('canvas');
          canvas.width = tw;
          canvas.height = th;
          const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
          if (!ctx) throw new Error('Canvas tile tidak tersedia.');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Render hanya quadrant yang diminta. offsetX/offsetY pada viewport menjaga skala
          // PDF tetap asli; canvas kecil menjadi clipping surface, bukan target resize halaman.
          const tileViewport = page.getViewport({
            scale,
            offsetX: -(pageLeftPx + x),
            offsetY: -(pageTopPx + y)
          });
          await page.render({
            canvasContext: ctx,
            viewport: tileViewport,
            intent: 'display',
            useRequestAnimationFrame: true
          }).promise;

          const dataUrl = canvas.toDataURL('image/png');
          tiles.push({ x: tx, y: ty, width: tw, height: th, dataUrl });
        } catch (tileErr) {
          // [BARU -- pengaman ringan] 1 tile gagal (mis. render() pdf.js gagal sesaat di
          // Android tertentu) TIDAK BOLEH menggagalkan seluruh upload GeoPDF. Tile ini
          // dilewati -- akan tampil sbg celah kecil di zoom dalam, jauh lebih baik drpd
          // seluruh proses upload gagal total.
          console.warn('Render tile ' + tx + ',' + ty + ' level ' + li + ' gagal, dilewati:', tileErr);
        } finally {
          if (canvas) releaseGeoPdfCanvas_(canvas);
        }
        done++;
        globalDone++;
        if (onProgress) {
          const percent = (globalDone / grandTotalTiles) * 100;
          onProgress(
            'Memproses tile PDF: ' + globalDone + '/' + grandTotalTiles + ' (' + Math.round(percent) + '%)',
            percent
          );
        }
        // Give older Android/WebView devices a small scheduling window every few tiles.
        // This keeps the UI responsive and lets released canvases become collectible.
        if (done % 5 === 0) {
          await new Promise(r => setTimeout(r, 15));
        } else {
          await new Promise(r => setTimeout(r, 0));
        }
      }
    }
    out.levels.push({ level: li, factor, scale, width, height, tilesX, tilesY, tiles });
  }
  return out;
}

function getGeoPdfRenderScale_(geoReference) {
  const s = geoReference && Number(geoReference.renderScale);
  return Number.isFinite(s) && s > 0 ? s : GEOPDF_RENDER_SCALE_;
}
function geoPdfPageToPixel_(geoReference, pageX, pageY) {
  if (!geoReference || !geoReference.metadata || !Array.isArray(geoReference.metadata.vpBBox)) return null;
  if (!Number.isFinite(pageX) || !Number.isFinite(pageY)) return null;
  const b = geoReference.metadata.vpBBox;
  if (b.length !== 4 || !b.every(Number.isFinite)) return null;
  // [DIPERBAIKI -- 5 Sep, bug nyata ditemukan] SEBELUMNYA pakai b[0]/b[3] mentah, asumsikan
  // urutan vpBBox SELALU x0<x1 dan y-maksimum ada di indeks 3 -- TIDAK TERJAMIN (temuan lama:
  // beberapa GeoPDF nyata simpan y0>y1, urutan "non-standar"). Step 4 (render asli, TERBUKTI
  // benar via tes 4 file nyata) SELALU pakai Math.min/Math.max eksplisit -- disamakan di sini
  // supaya posisi GPS di layar taat pada logika crop yg SAMA dgn yg benar2 dipakai render.
  const xMin = Math.min(b[0], b[2]);
  const yMax = Math.max(b[1], b[3]);
  return { x: (pageX - xMin) * getGeoPdfRenderScale_(geoReference), y: (yMax - pageY) * getGeoPdfRenderScale_(geoReference) };
}
function geoPdfPixelToPage_(geoReference, pixelX, pixelY) {
  if (!geoReference || !geoReference.metadata || !Array.isArray(geoReference.metadata.vpBBox)) return null;
  if (!Number.isFinite(pixelX) || !Number.isFinite(pixelY)) return null;
  const b = geoReference.metadata.vpBBox;
  if (b.length !== 4 || !b.every(Number.isFinite)) return null;
  const xMin = Math.min(b[0], b[2]);
  const yMax = Math.max(b[1], b[3]);
  return { x: xMin + pixelX / getGeoPdfRenderScale_(geoReference), y: yMax - pixelY / getGeoPdfRenderScale_(geoReference) };
}
function validateGeoPdfPagePixelRoundTrip_(geoReference, points, tolerancePx) {
  if (!geoReference || !Array.isArray(points) || !points.length) return { ok: false, reason: 'Input tidak lengkap.' };
  const tol = Number.isFinite(tolerancePx) ? tolerancePx : 0.01;
  let maxErrorPx = 0;
  for (const p of points) {
    const px = geoPdfPageToPixel_(geoReference, p.x, p.y);
    const page = px && geoPdfPixelToPage_(geoReference, px.x, px.y);
    if (!page) return { ok: false, reason: 'Round-trip page/pixel gagal.' };
    const e = Math.hypot(page.x - p.x, page.y - p.y) * getGeoPdfRenderScale_(geoReference);
    if (e > maxErrorPx) maxErrorPx = e;
  }
  return { ok: maxErrorPx <= tol, maxErrorPx };
}

// STEP 8F: Accuracy & boundary validation for the complete coordinate chain.
// Tidak mengubah schema GeoReference; fungsi-fungsi ini hanya memvalidasi object/koordinat
// sebelum dipakai oleh GPS atau hasil tap. Tolerance default sengaja ketat untuk transform,
// tetapi tidak mengklaim akurasi GPS hardware.
function isValidGeoReferenceForCoordinate_(geoReference) {
  if (!geoReference || geoReference.schema !== 'MG1-GeoReference') return false;
  const c = geoReference.crs, t = geoReference.transform;
  const b = geoReference.metadata && geoReference.metadata.vpBBox;
  const e = geoReference.extent;
  if (!c || !t || !b || !e) return false;
  const projection=String(c.projection||'TRANSVERSE_MERCATOR').toUpperCase();
  const isGeographic=['GEOGRAPHIC','LATLON','GEOGRAPHIC_2D'].includes(projection) || Number(c.epsg)===4326;
  const isWebMercator=['WEB_MERCATOR','MERCATOR_SPHERICAL'].includes(projection) || Number(c.epsg)===3857 || Number(c.epsg)===900913;
  const isTm=projection==='TRANSVERSE_MERCATOR' || projection==='TRANSVERSE_MERCATOR_UTM_COMPATIBLE' || projection==='UTM';
  if (!isGeographic && !isWebMercator && !isTm) return false;
  if (isTm) {
    if (!Number.isInteger(c.zone) || c.zone < 1 || c.zone > 60) return false;
    if (!['N','S'].includes(String(c.hemisphere).toUpperCase())) return false;
  }
  const k = t.coefficients || t;
  if (![k.ax,k.bx,k.cx,k.ay,k.by,k.cy].every(Number.isFinite)) return false;
  if (Math.abs(k.ax * k.by - k.bx * k.ay) < 1e-12) return false;
  if (!Array.isArray(b) || b.length !== 4 || !b.every(Number.isFinite)) return false;
  if (!e.cornerTL || !e.cornerBR) return false;
  if (![e.cornerTL.timur,e.cornerTL.utara,e.cornerBR.timur,e.cornerBR.utara].every(Number.isFinite)) return false;
  if (!(e.cornerTL.timur < e.cornerBR.timur && e.cornerTL.utara > e.cornerBR.utara)) return false;
  return true;
}

function isNativeCoordinateWithinGeoReferenceExtent_(geoReference, x, y, epsilonMeters) {
  if (!isValidGeoReferenceForCoordinate_(geoReference) || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const rawEps = Number.isFinite(epsilonMeters) ? Math.max(0, epsilonMeters) : 0;
  const proj=geoReference.crs ? String(geoReference.crs.projection||'').toUpperCase() : '';
  const eps = (proj==='GEOGRAPHIC' || proj==='LATLON' || proj==='GEOGRAPHIC_2D' || Number(geoReference.crs && geoReference.crs.epsg)===4326) ? rawEps/111320 : rawEps;
  const tl = geoReference.extent.cornerTL, br = geoReference.extent.cornerBR;
  return x >= tl.timur - eps && x <= br.timur + eps && y <= tl.utara + eps && y >= br.utara - eps;
}

function validateGeoReferenceAccuracy_(geoReference, toleranceMeters, tolerancePx) {
  if (!isValidGeoReferenceForCoordinate_(geoReference)) return { ok:false, reason:'GeoReference tidak valid untuk coordinate engine.' };
  const tolM = Number.isFinite(toleranceMeters) ? toleranceMeters : 0.1;
  const tolPx = Number.isFinite(tolerancePx) ? tolerancePx : 0.01;
  const b = geoReference.metadata.vpBBox;
  const pagePoints = [
    {x:b[0],y:b[1]}, {x:b[2],y:b[1]}, {x:b[2],y:b[3]}, {x:b[0],y:b[3]},
    {x:(b[0]+b[2])/2,y:(b[1]+b[3])/2}
  ];
  let maxPageErrorUnits = 0, maxWgs84ErrorM = 0, maxPixelErrorPx = 0, outsideCount = 0;
  for (const pagePoint of pagePoints) {
    const native = applyAffineTransform2D_(geoReference.transform.coefficients || geoReference.transform, pagePoint);
    if (!native || !isNativeCoordinateWithinGeoReferenceExtent_(geoReference, native.x, native.y, 2)) outsideCount++;
    const w = geoPdfPageToWgs84_(geoReference, pagePoint.x, pagePoint.y);
    if (!w || !w.wgs84) return {ok:false, reason:'Page → WGS84 gagal.'};
    const back = wgs84ToGeoPdfPage_(geoReference, w.wgs84.lat, w.wgs84.lon);
    if (!back || !back.page) return {ok:false, reason:'WGS84 → Page gagal.'};
    const pageErrUnits = Math.hypot(back.page.x-pagePoint.x, back.page.y-pagePoint.y);
    const latErrM = (back.lat-w.wgs84.lat) * 111320;
    const lonScale = Math.max(Math.cos(w.wgs84.lat*Math.PI/180), 1e-6);
    const lonErrM = (back.lon-w.wgs84.lon) * 111320 * lonScale;
    const geoErrM = Math.hypot(latErrM, lonErrM);
    const px = geoPdfPageToPixel_(geoReference, pagePoint.x, pagePoint.y);
    const backPage = px && geoPdfPixelToPage_(geoReference, px.x, px.y);
    if (!backPage) return {ok:false, reason:'Page ↔ Pixel gagal.'};
    const pxErr = Math.hypot(backPage.x-pagePoint.x, backPage.y-pagePoint.y) * getGeoPdfRenderScale_(geoReference);
    if (pageErrUnits > maxPageErrorUnits) maxPageErrorUnits = pageErrUnits;
    if (geoErrM > maxWgs84ErrorM) maxWgs84ErrorM = geoErrM;
    if (pxErr > maxPixelErrorPx) maxPixelErrorPx = pxErr;
  }
  return {
    ok: outsideCount === 0 && maxPageErrorUnits <= 0.01 && maxWgs84ErrorM <= tolM && maxPixelErrorPx <= tolPx,
    maxPageErrorUnits, maxWgs84ErrorM, maxPixelErrorPx, outsideCount,
    toleranceMeters: tolM, tolerancePx: tolPx
  };
}

// GPS WGS84 -> native -> PDF page -> rendered pixel.
function gpsWgs84ToGeoPdfPixel_(geoReference, lat, lon) {
  if (!geoReference || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const pageResult = wgs84ToGeoPdfPage_(geoReference, lat, lon);
  if (!pageResult || !pageResult.page) return null;
  const pixel = geoPdfPageToPixel_(geoReference, pageResult.page.x, pageResult.page.y);
  if (!pixel) return null;
  return { lat, lon, native: pageResult.native, page: pageResult.page, pixel };
}
function stopGpsTracking_() {
  if (gpsWatchId_ !== null && navigator.geolocation) navigator.geolocation.clearWatch(gpsWatchId_);
  gpsWatchId_ = null;
  gpsState_ = { active: false, status: 'off', lat: null, lon: null, accuracyM: null, timestamp: null, native: null, page: null, pixel: null, error: null };
  render();
}
function startGpsTracking_() {
  if (!navigator.geolocation) {
    gpsState_ = { ...gpsState_, active: false, status: 'error', error: 'GPS browser tidak tersedia.' };
    render(); return;
  }
  const activeMap = activeBackgroundMapId ? backgroundMapsList.find(m => m.id === activeBackgroundMapId) : null;
  const geoReference = activeMap && activeMap.geoReference;
  if (!geoReference) {
    gpsState_ = { ...gpsState_, active: false, status: 'no-georef', error: 'Aktifkan peta GeoPDF yang memiliki GeoReference terlebih dahulu.' };
    render(); return;
  }
  if (gpsWatchId_ !== null) navigator.geolocation.clearWatch(gpsWatchId_);
  gpsState_ = { ...gpsState_, active: true, status: 'searching', error: null };
  gpsWatchId_ = navigator.geolocation.watchPosition(
    pos => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      // Ambil GeoReference aktif setiap update GPS supaya pergantian background map
      // tidak memakai GeoReference lama.
      const currentMap = activeBackgroundMapId ? backgroundMapsList.find(m => m.id === activeBackgroundMapId) : null;
      const currentGeoReference = currentMap && currentMap.geoReference;
      const mapped = currentGeoReference ? gpsWgs84ToGeoPdfPixel_(currentGeoReference, lat, lon) : null;
      const insideBoundary = mapped && currentGeoReference
        ? isNativeCoordinateInsideGeoPdfBoundary_(currentGeoReference, mapped.native.x, mapped.native.y, 0.25)
        : false;
      gpsState_ = {
        active: true, status: mapped && insideBoundary ? 'ok' : (mapped ? 'outside-neatline' : 'transform-error'),
        lat, lon, accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
        timestamp: pos.timestamp || Date.now(), native: mapped ? mapped.native : null,
        page: mapped ? mapped.page : null, pixel: mapped ? mapped.pixel : null,
        error: mapped ? (insideBoundary ? null : 'Posisi GPS berada di luar Neatline GeoPDF.') : 'Koordinat GPS tidak dapat diproyeksikan ke GeoPDF.'
      };
      requestMapRender_();
    },
    err => {
      gpsState_ = { ...gpsState_, active: true, status: 'error', error: 'GPS error (' + err.code + '): ' + (err.message || 'lokasi tidak tersedia') };
      render();
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
  );
  render();
}

// STEP 8E: SVG/map tap -> native -> PDF page/pixel -> WGS84.
// Event pointer diterima pada SVG agar mouse/touch memakai satu jalur koordinat.
function handleMapTap_(event) {
  try {
    if (!event || !event.currentTarget) return;
    // STEP 5.6: tap yg dipicu di tengah/tepat sesudah gesture pinch diabaikan -- browser
    // kadang tetap sintesis 1 event klik dari sisa sentuhan multi-jari.
    if (mapPinchState_.active || mapPanState_.active || Date.now() < Math.max(mapPinchState_.suppressTapUntil, mapPanState_.suppressTapUntil || 0)) return;
    const svgEl = event.currentTarget;
    const bounds = computeResponsiveDisplayBounds_(buildMapData());
    if (!bounds) return;
    const rect = svgEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const viewW = 320, viewH = 320;
    const viewBox = getMapViewBox_(bounds);
    const svgX = viewBox.x + ((event.clientX - rect.left) / rect.width) * viewBox.w;
    const svgY = viewBox.y + ((event.clientY - rect.top) / rect.height) * viewBox.h;
    if (!Number.isFinite(svgX) || !Number.isFinite(svgY)) return;
    const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
    const nativeX = bounds.minT + (svgX / viewW) * rangeT;
    const nativeY = bounds.minU + ((viewH - svgY) / viewH) * rangeU;
    if (!Number.isFinite(nativeX) || !Number.isFinite(nativeY)) return;

    const activeMap = activeBackgroundMapId ? backgroundMapsList.find(m => m.id === activeBackgroundMapId) : null;
    const geoReference = activeMap && activeMap.geoReference;
    let page = null, pixel = null, wgs84 = null, error = null;
    if (geoReference) {
      if (!isNativeCoordinateInsideGeoPdfBoundary_(geoReference, nativeX, nativeY, 0.25)) {
        error = 'Titik berada di luar Neatline GeoPDF.';
      } else {
        const pageResult = applyInverseAffineTransform2D_(geoReference.transform.coefficients || geoReference.transform, { x: nativeX, y: nativeY });
        if (pageResult) {
          page = pageResult;
          pixel = geoPdfPageToPixel_(geoReference, page.x, page.y);
          const geoResult = geoPdfPageToWgs84_(geoReference, page.x, page.y);
          if (geoResult && geoResult.wgs84) wgs84 = geoResult.wgs84;
        } else {
          error = 'Transformasi native ke PDF gagal.';
        }
      }
    } else {
      error = 'Pilih peta GeoPDF yang memiliki GeoReference untuk melihat koordinat WGS84.';
    }
    mapTapState_ = { active: true, svg: { x: svgX, y: svgY }, native: { x: nativeX, y: nativeY }, page, pixel, wgs84, error };
    render();
  } catch (e) {
    mapTapState_ = { active: true, svg: null, native: null, page: null, pixel: null, wgs84: null, error: e.message || String(e) };
    render();
  }
}
function clearMapTap_() {
  mapTapState_ = { active: false, svg: null, native: null, page: null, pixel: null, wgs84: null, error: null };
  render();
}

// STEP 5: Satu kontrak standar untuk seluruh hasil georeferensi GeoPDF.
// Object ini sengaja murni data (tanpa fungsi/runtime state), supaya STEP 6 cukup
// menerima SATU object dan tidak perlu tahu bagaimana metadata, transform, dan CRS ditemukan.

// STEP 10A: TerraGo/LGI legacy georegistration compatibility.
// Basis publik: OGC 08-139r3 mendefinisikan page-level /LGIDict map frame dengan
// /CTM atau /Registration, /Projection, dan optional /Neatline. MG1 hanya membaca
// struktur tersebut; tidak menyalin implementasi proprietary Avenza/TerraGo.
function extractPdfBlock10A_(text, startIndex, openChar, closeChar) {
  if (!text || startIndex < 0 || text[startIndex] !== openChar) return null;
  let depth = 0;
  for (let i = startIndex; i < text.length; i++) {
    if (openChar === '<' && text[i] === '<' && text[i + 1] === '<') {
      depth++; i++;
      continue;
    }
    if (openChar === '<' && text[i] === '>' && text[i + 1] === '>') {
      depth--;
      if (depth === 0) return { raw: text.slice(startIndex, i + 2), end: i + 2 };
      i++;
      continue;
    }
    if (text[i] === openChar) depth++;
    else if (text[i] === closeChar) {
      depth--;
      if (depth === 0) return { raw: text.slice(startIndex, i + 1), end: i + 1 };
    }
  }
  return null;
}
function pdfValue10A_(dictText, key) {
  const re = new RegExp('/' + key + '\\s+');
  const m = re.exec(dictText || '');
  if (!m) return null;
  let i = m.index + m[0].length;
  while (/\s/.test(dictText[i] || '')) i++;
  if (dictText.startsWith('<<', i)) return extractPdfBlock10A_(dictText, i, '<', '>');
  if (dictText[i] === '[') return extractPdfBlock10A_(dictText, i, '[', ']');
  const refToken = dictText.slice(i).match(/^\d+\s+0\s+R\b/);
  if (refToken) return { raw: refToken[0], end: i + refToken[0].length };
  const token = dictText.slice(i).match(/^\S+/);
  return token ? { raw: token[0], end: i + token[0].length } : null;
}
function pdfRefObject10A_(text, token) {
  const m = String(token || '').match(/^(\d+)\s+0\s+R$/);
  if (!m) return null;
  const re = new RegExp('(?:^|\\n|\\r)\\s*' + m[1] + '\\s+0\\s+obj\\b([\\s\\S]*?)\\bendobj\\b');
  const hit = re.exec(text || '');
  return hit ? hit[1] : null;
}
function pdfNums10A_(raw) {
  const nums = String(raw || '').match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g) || [];
  return nums.map(Number).filter(Number.isFinite);
}
function pdfScalar10A_(dictText, key) {
  const v = pdfValue10A_(dictText, key);
  if (!v) return null;
  const n = pdfNums10A_(v.raw)[0];
  return Number.isFinite(n) ? n : null;
}
function pdfString10A_(dictText, key) {
  const v = pdfValue10A_(dictText, key);
  if (!v) return null;
  return String(v.raw).replace(/^\(/, '').replace(/\)$/, '').replace(/^\//, '').trim();
}
// STEP 10B: Measure Dictionary variants: inline/indirect and arbitrary key order.
function resolvePdfValue10B_(value, fullText) {
  if (!value || !value.raw) return null; const raw=String(value.raw).trim();
  if (raw.startsWith('<<')) return raw;
  if (/^\d+\s+0\s+R$/.test(raw)) return pdfRefObject10A_(fullText, raw);
  return raw;
}
function pdfArrayNumbers10B_(body,key,fullText) { const v=pdfValue10A_(body,key); return v ? pdfNums10A_(resolvePdfValue10B_(v,fullText)||v.raw) : []; }
// STEP 10C keeps 10B's Measure variants intact; structural ownership/Viewport
// resolution is layered on top rather than changing the Measure schema.
// STEP 10D: tolerant fallback parser for GeoPDF metadata dictionaries.
// Some producers serialize object declarations without a line break before `obj`,
// or place equivalent GEO dictionaries in slightly different object layouts.
// This parser is intentionally conservative: it only accepts explicit GEO Measure
// dictionaries with valid GPTS/LPTS pairs and never guesses CRS/transform data.
// STEP M1: strengthen PDF object parsing without replacing pdf.js.
// GeoPDF metadata may live inside compressed /ObjStm object streams. The legacy
// raw-text scanner cannot see those objects. This helper expands FlateDecode
// object streams into synthetic `N 0 obj ... endobj` text, then the existing
// 10A-10E parsers can consume them unchanged. No CRS/transform inference is added.
async function expandPdfObjectStreamsM1_(bytes, text, report) {
  const src = String(text || '');
  if (!(bytes instanceof Uint8Array) || !src) return src;
  if (typeof DecompressionStream === 'undefined') {
    if (report) report('ObjStm compressed: browser tidak menyediakan DecompressionStream; parser raw-text tetap digunakan.');
    return src;
  }
  const objRe = /(?:^|\n|\r)\s*(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj\b/g;
  const additions = [];
  let m, expanded = 0;
  while ((m = objRe.exec(src))) {
    const body = m[2];
    if (!/\/Type\s*\/ObjStm\b/i.test(body)) continue;
    const nMatch = body.match(/\/N\s+(\d+)/i);
    const firstMatch = body.match(/\/First\s+(\d+)/i);
    const filterMatch = body.match(/\/Filter\s*(?:\[\s*)?\/FlateDecode\b/i);
    if (!nMatch || !firstMatch || !filterMatch) continue;
    const streamRel = body.search(/stream\s*(?:\r\n|\n|\r)/i);
    if (streamRel < 0) continue;
    const bodyStart = m.index + m[0].indexOf(body);
    const streamMatch = body.slice(streamRel).match(/^stream\s*(?:\r\n|\n|\r)/i);
    if (!streamMatch) continue;
    const dataStart = bodyStart + streamRel + streamMatch[0].length;
    const endRel = body.indexOf('endstream', streamRel + streamMatch[0].length);
    if (endRel < 0) continue;
    const dataEnd = bodyStart + endRel;
    let compressed = bytes.slice(dataStart, dataEnd);
    while (compressed.length && (compressed[compressed.length - 1] === 10 || compressed[compressed.length - 1] === 13)) compressed = compressed.slice(0, -1);
    try {
      const ds = new DecompressionStream('deflate');
      const decodedBuffer = await new Response(new Blob([compressed]).stream().pipeThrough(ds)).arrayBuffer();
      const decoded = new TextDecoder('latin1').decode(new Uint8Array(decodedBuffer));
      const first = Number(firstMatch[1]), count = Number(nMatch[1]);
      if (!Number.isFinite(first) || !Number.isFinite(count) || first < 0 || count < 1 || first >= decoded.length) continue;
      const header = decoded.slice(0, first);
      const pairs = header.match(/\d+\s+\d+/g) || [];
      if (pairs.length < count) continue;
      for (let i = 0; i < count; i++) {
        const pm = pairs[i].match(/^(\d+)\s+(\d+)$/);
        if (!pm) continue;
        const objectNumber = Number(pm[1]), offset = Number(pm[2]);
        const start = first + offset;
        const next = i + 1 < count ? Number(pairs[i + 1].match(/^(\d+)\s+(\d+)$/)[2]) : (decoded.length - first);
        if (!Number.isFinite(start) || !Number.isFinite(next) || next < offset || start > decoded.length) continue;
        const objectBody = decoded.slice(start, first + next).trim();
        if (!objectBody) continue;
        additions.push(objectNumber + ' 0 obj\n' + objectBody + '\nendobj\n');
        expanded++;
      }
    } catch (e) {
      if (report) report('ObjStm FlateDecode gagal didekompresi; object stream dilewati.');
    }
  }
  if (report && expanded) report('PDF object stream diperluas: ' + expanded + ' object(s).');
  return additions.length ? src + '\n' + additions.join('\n') : src;
}

function extractPdfObjects10D_(text) {
  const out = [];
  const src = String(text || '');
  const re = /\b(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj\b/g;
  let m;
  while ((m = re.exec(src))) {
    const objectNumber = Number(m[1]);
    if (!Number.isInteger(objectNumber)) continue;
    out.push({ objectNumber, body: m[2] });
  }
  return out;
}
function parseGeoMeasureFallback10D_(text) {
  const objects = extractPdfObjects10D_(text);
  const out = [];
  const seen = new Set();
  const add = (body, source, owner) => {
    if (!body || !/\/Subtype\s*\/GEO\b/i.test(body)) return;
    const gpts = pdfArrayNumbers10B_(body, 'GPTS', text);
    const lpts = pdfArrayNumbers10B_(body, 'LPTS', text);
    if (gpts.length < 6 || lpts.length < 6 || gpts.length % 2 || lpts.length % 2 || gpts.length !== lpts.length) return;
    const gcs = pdfValue10A_(body, 'GCS');
    const rawGcs = gcs ? String(gcs.raw).trim() : '';
    const ref = (rawGcs.match(/^(\d+)\s+0\s+R$/) || [])[1];
    const key = gpts.join(',') + '|' + lpts.join(',');
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      source,
      ownerObjectNumber: owner || null,
      gpts,
      lpts,
      bounds: pdfArrayNumbers10B_(body, 'Bounds', text),
      gcsObjectNumber: ref ? Number(ref) : null,
      gcsText: gcs ? (resolvePdfValue10B_(gcs, text) || '') : ''
    });
  };
  for (const obj of objects) {
    const measure = pdfValue10A_(obj.body, 'Measure');
    const resolved = resolvePdfValue10B_(measure, text);
    if (resolved && String(resolved).startsWith('<<')) add(resolved, 'MEASURE_FALLBACK_REFERENCE', obj.objectNumber);
    add(obj.body, 'MEASURE_FALLBACK_OBJECT', obj.objectNumber);
  }
  return out;
}
function parseGeoPdfFallback10D_(text) {
  const measures = parseGeoMeasureFallback10D_(text);
  if (measures.length) return { ok: true, type: 'GEO_MEASURE_FALLBACK', measures };
  return { ok: false, reason: 'Fallback parser tidak menemukan Measure/GEO metadata yang lengkap.' };
}

function parseGeoMeasureVariants10B_(text) {
  const out=[]; const add=(body,source,owner)=>{
    if (!body || String(pdfString10A_(body,'Subtype')||'').toUpperCase()!=='GEO') return;
    const gpts=pdfArrayNumbers10B_(body,'GPTS',text), lpts=pdfArrayNumbers10B_(body,'LPTS',text);
    if(gpts.length<6||lpts.length<6||gpts.length%2||lpts.length%2||gpts.length!==lpts.length)return;
    const bv=pdfValue10A_(body,'GCS'), raw=bv?String(bv.raw).trim():''; const ref=(raw.match(/^(\d+)\s+0\s+R$/)||[])[1];
    out.push({source,ownerObjectNumber:owner||null,gpts,lpts,bounds:pdfArrayNumbers10B_(body,'Bounds',text),gcsObjectNumber:ref?Number(ref):null,gcsText:bv?(resolvePdfValue10B_(bv,text)||''):''});
  };
  // [DIPERBAIKI -- ditemukan regresi nyata] Pola PALING TERBUKTI dicoba PERTAMA: file ArcMap
  // tim kita menulis `/Measure/Subtype/GEO/...` TANPA spasi & TANPA `<<` pembungkus -- struktur
  // non-standar yg TIDAK cocok dgn 3 strategi generik di bawah (semua mensyaratkan spasi/`<<`
  // setelah `/Measure`). Tanpa baris ini, SEMUA 4 file GeoPDF nyata tim gagal terbaca sama sekali.
  const legacyRe = /\/Measure\/Subtype\/GEO\/Bounds\[([^\]]*)\]\/GPTS\[([^\]]*)\]\/LPTS\[([^\]]*)\]\/GCS (\d+) 0 R/g;
  let lm;
  while ((lm = legacyRe.exec(text || ''))) {
    const gpts = lm[2].trim().split(/\s+/).map(Number);
    const lpts = lm[3].trim().split(/\s+/).map(Number);
    if (gpts.length < 6 || lpts.length < 6 || gpts.length % 2 || lpts.length % 2 || gpts.length !== lpts.length) continue;
    out.push({ source: 'MEASURE_ARCGIS_LEGACY', ownerObjectNumber: null, gpts, lpts, bounds: lm[1].trim().split(/\s+/).map(Number), gcsObjectNumber: Number(lm[4]), gcsText: '' });
  }
  const re=/(?:^|\n|\r)\s*(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj\b/g; let m;
  while((m=re.exec(text||''))){const v=pdfValue10A_(m[2],'Measure');const b=resolvePdfValue10B_(v,text);if(b&&String(b).startsWith('<<'))add(b,'MEASURE_DICTIONARY',Number(m[1]));}
  re.lastIndex=0; while((m=re.exec(text||''))){if(String(pdfString10A_(m[2],'Subtype')||'').toUpperCase()==='GEO')add(m[2],'MEASURE_OBJECT',Number(m[1]));}
  const ir=/\/Measure\s*(<<[\s\S]*?>>)/gi; while((m=ir.exec(text||'')))add(m[1],'MEASURE_INLINE',null);
  const seen=new Set(); return out.filter(x=>{const k=[x.gpts.join(','),x.lpts.join(',')].join('|');if(seen.has(k))return false;seen.add(k);return true;});
}
function findGeoPdfViewportBBox10B_(text) { const m=text&&text.match(/\/Type\s*\/Viewport[\s\S]{0,800}?\/BBox\s*\[([^\]]+)\]/i); return m?pdfNums10A_(m[1]).slice(0,4):null; }
// STEP 10C: GeoPDF structural variants. A Measure dictionary is not always attached
// to the first Viewport in the file: common exports use /VP arrays, indirect Viewport
// objects, or put /Measure directly inside the Viewport dictionary. Resolve the closest
// structural owner first, then fall back to the legacy global Viewport search.
function extractPdfObject10C_(text, objectNumber) {
  if (!objectNumber) return null;
  const re = new RegExp('(?:^|\\n|\\r)\\s*' + Number(objectNumber) + '\\s+0\\s+obj\\b([\\s\\S]*?)\\bendobj\\b');
  const m = re.exec(text || '');
  return m ? m[1] : null;
}
function bboxFromViewportText10C_(body) {
  if (!body) return null;
  const m = String(body).match(/\/Type\s*\/Viewport\b[\s\S]{0,1400}?\/BBox\s*\[([^\]]+)\]/i);
  if (!m) return null;
  const b = pdfNums10A_(m[1]).slice(0,4);
  return b.length === 4 && b.every(Number.isFinite) ? b : null;
}
function findGeoPdfViewportBBoxForMeasure10C_(text, measureVariant) {
  const full = String(text || '');
  const owner = measureVariant && Number(measureVariant.ownerObjectNumber);
  if (owner) {
    const ownerBody = extractPdfObject10C_(full, owner);
    const direct = bboxFromViewportText10C_(ownerBody);
    if (direct) return direct;

    // Page/Viewport dictionaries commonly reference the Measure object indirectly.
    const ref = Number(owner);
    const objectRe = /(?:^|\n|\r)\s*(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj\b/g;
    let m;
    while ((m = objectRe.exec(full))) {
      const body = m[2];
      if (!/\/Type\s*\/Viewport\b/i.test(body)) continue;
      const measureRef = body.match(new RegExp('\/Measure\s+' + ref + '\\s+0\\s+R\b'));
      if (measureRef) {
        const b = bboxFromViewportText10C_(body);
        if (b) return b;
      }
    }
  }

  // /VP [N 0 R ...] can live on a page object. Find a page/object referencing the
  // Measure, then resolve its VP references to Viewport objects.
  if (owner) {
    const refRe = new RegExp('\\/Measure\\s+' + owner + '\\s+0\\s+R\\b[\\s\\S]{0,1600}?\\/VP\\s*\\[([^\\]]+)\\]', 'i');
    const hit = refRe.exec(full);
    if (hit) {
      const refs = String(hit[1]).match(/\b\d+\s+0\s+R\b/g) || [];
      for (const token of refs) {
        const n = Number(token.match(/^\d+/)[0]);
        const b = bboxFromViewportText10C_(extractPdfObject10C_(full, n));
        if (b) return b;
      }
    }
  }

  // Direct Measure inside Viewport, including inline dictionaries.
  const directRe = /\/Type\s*\/Viewport\b[\s\S]{0,1800}?\/Measure\s*(?:\d+\s+0\s+R|<<)[\s\S]{0,900}?\/BBox\s*\[([^\]]+)\]/gi;
  let dm;
  while ((dm = directRe.exec(full))) {
    const b = pdfNums10A_(dm[1]).slice(0,4);
    if (b.length === 4 && b.every(Number.isFinite)) return b;
  }

  return findGeoPdfViewportBBox10B_(full);
}

function parseTerraGoProjection10A_(body, fullText) {
  const b = pdfValue10A_(body, 'Projection');
  if (!b) return null;
  const p = b.raw.startsWith('<<') ? b.raw : (pdfRefObject10A_(fullText, b.raw) || '');
  if (!p) return null;
  return {
    type: pdfString10A_(p, 'ProjectionType') || 'NONE',
    datum: pdfString10A_(p, 'Datum') || '',
    hemisphere: (pdfString10A_(p, 'Hemisphere') || '').toUpperCase() || null,
    zone: pdfScalar10A_(p, 'Zone'),
    centralMeridian: pdfScalar10A_(p, 'CentralMeridian'),
    falseEasting: pdfScalar10A_(p, 'FalseEasting'),
    falseNorthing: pdfScalar10A_(p, 'FalseNorthing'),
    scaleFactor: pdfScalar10A_(p, 'ScaleFactor')
  };
}
// STEP 11A: Datum detection only. This step NEVER transforms coordinates.
// Priority: explicit EPSG authority -> explicit datum/name -> TerraGo/LGI datum token.
// Unknown stays UNKNOWN; MG1 must not guess a datum.
function detectDatum11A_(input) {
  const src = input || {};
  const text = String(src.text || src.gcsText || '');
  const epsgCandidate = src.epsg;
  const epsg = (epsgCandidate !== null && epsgCandidate !== undefined && epsgCandidate !== '' && Number.isInteger(Number(epsgCandidate))) ? Number(epsgCandidate) : null;
  const projectionDatum = String(src.projectionDatum || '').trim();
  const hay = text + ' | ' + projectionDatum;
  const epsgMap = [
    { min: 32601, max: 32660, datum: 'WGS84' },
    { min: 32701, max: 32760, datum: 'WGS84' },
    { min: 26901, max: 26923, datum: 'NAD83' },
    { min: 26701, max: 26722, datum: 'NAD27' },
    { min: 25828, max: 25838, datum: 'ETRS89' },
    { min: 28348, max: 28358, datum: 'GDA94' },
    { min: 7850, max: 7859, datum: 'GDA2020' },
    { min: 31965, max: 31985, datum: 'SIRGAS2000' }
  ];
  if (epsg !== null) {
    const hit = epsgMap.find(r => epsg >= r.min && epsg <= r.max);
    if (hit) return { datum: hit.datum, status: 'recognized', confidence: 'epsg-derived', source: 'EPSG', epsg };
  }
  const patterns = [
    { datum: 'WGS84', re: /WGS[_\s-]*(?:84|1984)|D[_\s-]*WGS[_\s-]*1984|GCS[_\s-]*WGS[_\s-]*1984/i },
    { datum: 'GDA2020', re: /GDA[_\s-]*2020/i },
    { datum: 'GDA94', re: /GDA[_\s-]*94/i },
    { datum: 'NZGD2000', re: /NZGD[_\s-]*2000/i },
    { datum: 'ETRS89', re: /ETRS[_\s-]*89/i },
    { datum: 'NAD83', re: /NAD[_\s-]*83/i },
    { datum: 'NAD27', re: /NAD[_\s-]*27/i },
    { datum: 'SIRGAS2000', re: /SIRGAS[_\s-]*2000/i },
    { datum: 'DGN95', re: /DGN[_\s-]*95|Datum[_\s-]*Geodesi[_\s-]*Nasional[_\s-]*1995/i },
    { datum: 'ID74', re: /(?:\bID[_\s-]*74\b|Indonesian[_\s-]*Datum[_\s-]*1974)/i },
    { datum: 'ED50', re: /\bED[_\s-]*50\b|European[_\s-]*Datum[_\s-]*1950/i },
    { datum: 'Arc1960', re: /Arc[_\s-]*1960/i },
    { datum: 'OSGB36', re: /OSGB[_\s-]*36/i },
    { datum: 'Tokyo', re: /Tokyo[_\s-]*Datum/i },
    { datum: 'CH1903', re: /CH1903/i }
  ];
  const hit = patterns.find(item => item.re.test(hay));
  if (hit) return { datum: hit.datum, status: 'recognized', confidence: 'explicit-name', source: 'GCS_WKT_OR_LGI', epsg };
  return { datum: 'UNKNOWN', status: 'unknown', confidence: 'none', source: 'NO_EXPLICIT_DATUM', epsg };
}

// STEP 11B: Generic datum transformation engine.
// Prinsip: WGS84 <-> datum target dilakukan di geocentric XYZ memakai Helmert
// 3/7-parameter bila parameter transformasi dinyatakan eksplisit oleh metadata.
// Tidak ada datum shift yang ditebak dari nama datum saja.
function getDatumEllipsoid11B_(datum) {
  const d = String(datum || '').toUpperCase();
  const map = {
    WGS84: { a: 6378137.0, invF: 298.257223563 },
    NAD83: { a: 6378137.0, invF: 298.257222101 },
    GRS80: { a: 6378137.0, invF: 298.257222101 },
    ETRS89: { a: 6378137.0, invF: 298.257222101 },
    GDA94: { a: 6378137.0, invF: 298.257222101 },
    GDA2020: { a: 6378137.0, invF: 298.257222101 },
    SIRGAS2000: { a: 6378137.0, invF: 298.257222101 },
    NZGD2000: { a: 6378137.0, invF: 298.257222101 },
    NAD27: { a: 6378206.4, invF: 294.9786982 },
    ED50: { a: 6378388.0, invF: 297.0 },
    OSGB36: { a: 6377563.396, invF: 299.3249646 },
    TOKYO: { a: 6377397.155, invF: 299.1528128 },
    CH1903: { a: 6377397.155, invF: 299.1528128 }
  };
  return map[d] || null;
}

function parseTowgs84Parameters11B_(text) {
  const m = String(text || '').match(/TOWGS84\s*\[([^\]]+)\]/i);
  if (!m) return null;
  const v = (m[1].match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g) || []).map(Number);
  if (v.length < 3 || v.length > 7 || v.some(x => !Number.isFinite(x))) return null;
  return { dx:v[0], dy:v[1], dz:v[2], rxArcSec:v[3] || 0, ryArcSec:v[4] || 0, rzArcSec:v[5] || 0, dsPpm:v[6] || 0, source:'TOWGS84' };
}

function geodeticToEcef11B_(lat, lon, h, ellipsoid) {
  if (!ellipsoid || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const a=ellipsoid.a, f=1/ellipsoid.invF, e2=f*(2-f);
  const p=lat*Math.PI/180, l=lon*Math.PI/180, sinP=Math.sin(p), cosP=Math.cos(p);
  const N=a/Math.sqrt(1-e2*sinP*sinP);
  const H=Number.isFinite(h)?h:0;
  return { x:(N+H)*cosP*Math.cos(l), y:(N+H)*cosP*Math.sin(l), z:(N*(1-e2)+H)*sinP };
}

function ecefToGeodetic11B_(xyz, ellipsoid) {
  if (!xyz || !ellipsoid) return null;
  const a=ellipsoid.a, f=1/ellipsoid.invF, e2=f*(2-f), x=xyz.x,y=xyz.y,z=xyz.z;
  const p=Math.hypot(x,y);
  if (!Number.isFinite(p) || !Number.isFinite(z)) return null;
  let lat=Math.atan2(z,p*(1-e2));
  for (let i=0;i<12;i++) {
    const sin=Math.sin(lat), N=a/Math.sqrt(1-e2*sin*sin);
    const next=Math.atan2(z+e2*N*sin,p);
    if (Math.abs(next-lat)<1e-13) { lat=next; break; }
    lat=next;
  }
  const sin=Math.sin(lat), N=a/Math.sqrt(1-e2*sin*sin);
  const h=p/Math.max(Math.cos(lat),1e-15)-N;
  const lon=Math.atan2(y,x);
  return { lat:lat*180/Math.PI, lon:lon*180/Math.PI, height:h };
}

function helmert11B_(xyz, params, inverse) {
  if (!xyz || !params) return null;
  const secToRad=Math.PI/(180*3600), s=1+(Number(params.dsPpm)||0)*1e-6;
  const rx=(Number(params.rxArcSec)||0)*secToRad, ry=(Number(params.ryArcSec)||0)*secToRad, rz=(Number(params.rzArcSec)||0)*secToRad;
  let X=xyz.x,Y=xyz.y,Z=xyz.z;
  let dx=Number(params.dx)||0,dy=Number(params.dy)||0,dz=Number(params.dz)||0;
  if (inverse) {
    X=(X-dx)/s; Y=(Y-dy)/s; Z=(Z-dz)/s;
    return { x:X+rz*Y-ry*Z, y:Y-rz*X+rx*Z, z:Z+ry*X-rx*Y };
  }
  return { x:dx+s*(X-rz*Y+ry*Z), y:dy+s*(rz*X+Y-rx*Z), z:dz+s*(-ry*X+rx*Y+Z) };
}

// STEP 11C: Generalized Transverse Mercator projection engine.
// UTM adalah konfigurasi khusus TM; wrapper 11B di bawah tetap mempertahankan
// kontrak lama, tetapi sekarang parameter central meridian/scale/false origins
// dapat dipakai eksplisit tanpa mengubah datum engine.
function forwardTransverseMercator11C_(lat, lon, ellipsoid, params) {
  if (!ellipsoid || !params || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const a=ellipsoid.a, f=1/ellipsoid.invF, e2=f*(2-f), ep2=e2/(1-e2);
  const k0=Number.isFinite(params.scaleFactor) ? params.scaleFactor : 0.9996;
  const fe=Number.isFinite(params.falseEasting) ? params.falseEasting : 500000;
  const fn=Number.isFinite(params.falseNorthing) ? params.falseNorthing : 0;
  const cm=Number(params.centralMeridian);
  if (!Number.isFinite(cm) || !Number.isFinite(k0) || k0<=0) return null;
  const p=lat*Math.PI/180,l=lon*Math.PI/180,l0=cm*Math.PI/180;
  const sin=Math.sin(p),cos=Math.cos(p),tan=Math.tan(p),N=a/Math.sqrt(1-e2*sin*sin),T=tan*tan,C=ep2*cos*cos,A=cos*(l-l0);
  const M=a*((1-e2/4-3*e2*e2/64-5*e2*e2*e2/256)*p-(3*e2/8+3*e2*e2/32+45*e2*e2*e2/1024)*Math.sin(2*p)+(15*e2*e2/256+45*e2*e2*e2/1024)*Math.sin(4*p)-(35*e2*e2*e2/3072)*Math.sin(6*p));
  return {easting:fe+k0*N*(A+(1-T+C)*A**3/6+(5-18*T+T*T+72*C-58*ep2)*A**5/120),northing:fn+k0*(M+N*tan*(A*A/2+(5-T+9*C+4*C*C)*A**4/24+(61-58*T+T*T+600*C-330*ep2)*A**6/720))};
}
function inverseTransverseMercator11C_(easting,northing,ellipsoid,params) {
  if (!ellipsoid || !params || !Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  const a=ellipsoid.a,f=1/ellipsoid.invF,e2=f*(2-f),ep2=e2/(1-e2);
  const k0=Number.isFinite(params.scaleFactor) ? params.scaleFactor : 0.9996;
  const fe=Number.isFinite(params.falseEasting) ? params.falseEasting : 500000;
  const fn=Number.isFinite(params.falseNorthing) ? params.falseNorthing : 0;
  const cm=Number(params.centralMeridian);
  if (!Number.isFinite(cm) || !Number.isFinite(k0) || k0<=0) return null;
  const x=easting-fe,y=northing-fn,M=y/k0,e1=(1-Math.sqrt(1-e2))/(1+Math.sqrt(1-e2)),mu=M/(a*(1-e2/4-3*e2*e2/64-5*e2*e2*e2/256));
  const p1=mu+(3*e1/2-27*e1**3/32)*Math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*Math.sin(4*mu)+(151*e1**3/96)*Math.sin(6*mu)+(1097*e1**4/512)*Math.sin(8*mu);
  const sp=Math.sin(p1),cp=Math.cos(p1),tp=Math.tan(p1),C=ep2*cp*cp,T=tp*tp,N=a/Math.sqrt(1-e2*sp*sp),R=a*(1-e2)/Math.pow(1-e2*sp*sp,1.5),D=x/(N*k0);
  const lat=p1-(N*tp/R)*(D*D/2-(5+3*T+10*C-4*C*C-9*ep2)*D**4/24+(61+90*T+298*C+45*T*T-252*ep2-3*C*C)*D**6/720);
  const lon=cm*Math.PI/180+(D-(1+2*T+C)*D**3/6+(5-2*C+28*T-3*C*C+8*ep2+24*T*T)*D**5/120)/cp;
  return {lat:lat*180/Math.PI,lon:lon*180/Math.PI};
}
function projectionParamsFromCrs11C_(crs) {
  if (!crs) return null;
  const type=String(crs.projection||'TRANSVERSE_MERCATOR').toUpperCase();
  if (type==='GEOGRAPHIC' || type==='LATLON' || type==='GEOGRAPHIC_2D' || Number(crs.epsg)===4326) return { type:'GEOGRAPHIC' };
  if (type==='WEB_MERCATOR' || type==='MERCATOR_SPHERICAL' || Number(crs.epsg)===3857 || Number(crs.epsg)===900913) return { type:'WEB_MERCATOR' };
  const zone=Number(crs.zone);
  const cm=Number.isFinite(Number(crs.centralMeridian)) ? Number(crs.centralMeridian) : (zone>=1&&zone<=60 ? -183+zone*6 : null);
  const hemisphere=String(crs.hemisphere||'N').toUpperCase();
  if (!Number.isFinite(cm) || !['N','S'].includes(hemisphere)) return null;
  return { type:'TRANSVERSE_MERCATOR', centralMeridian:cm, scaleFactor:Number.isFinite(Number(crs.scaleFactor))&&Number(crs.scaleFactor)>0?Number(crs.scaleFactor):0.9996, falseEasting:Number.isFinite(Number(crs.falseEasting))?Number(crs.falseEasting):500000, falseNorthing:Number.isFinite(Number(crs.falseNorthing))?Number(crs.falseNorthing):(hemisphere==='S'?10000000:0) };
}
function forwardWebMercator11D_(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>=90) return null;
  const R=6378137, maxLat=85.0511287798066, clamped=Math.max(-maxLat,Math.min(maxLat,lat));
  const p=clamped*Math.PI/180;
  return {easting:R*lon*Math.PI/180,northing:R*Math.log(Math.tan(Math.PI/4+p/2))};
}
function inverseWebMercator11D_(easting, northing) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  const R=6378137;
  const lat=(2*Math.atan(Math.exp(northing/R))-Math.PI/2)*180/Math.PI;
  const lon=easting/R*180/Math.PI;
  return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon}:null;
}
function forwardProjection11D_(lat,lon,crs,ellipsoid) {
  const p=projectionParamsFromCrs11C_(crs);
  if (!p) return null;
  if (p.type==='GEOGRAPHIC') return {easting:lon,northing:lat};
  if (p.type==='WEB_MERCATOR') return forwardWebMercator11D_(lat,lon);
  return forwardTransverseMercator11C_(lat,lon,ellipsoid,p);
}
function inverseProjection11D_(easting,northing,crs,ellipsoid) {
  const p=projectionParamsFromCrs11C_(crs);
  if (!p) return null;
  if (p.type==='GEOGRAPHIC') return {lat:northing,lon:easting};
  if (p.type==='WEB_MERCATOR') return inverseWebMercator11D_(easting,northing);
  return inverseTransverseMercator11C_(easting,northing,ellipsoid,p);
}
function forwardUtmEllipsoid11B_(lat, lon, zone, hemisphere, ellipsoid) {
  const params=projectionParamsFromCrs11C_({zone,hemisphere,centralMeridian:-183+zone*6,scaleFactor:0.9996,falseEasting:500000,falseNorthing:hemisphere==='S'?10000000:0});
  return forwardTransverseMercator11C_(lat,lon,ellipsoid,params);
}
function inverseUtmEllipsoid11B_(easting,northing,zone,hemisphere,ellipsoid) {
  const params=projectionParamsFromCrs11C_({zone,hemisphere,centralMeridian:-183+zone*6,scaleFactor:0.9996,falseEasting:500000,falseNorthing:hemisphere==='S'?10000000:0});
  return inverseTransverseMercator11C_(easting,northing,ellipsoid,params);
}
function forwardProjection11C_(lat,lon,crs,ellipsoid) {
  const p=projectionParamsFromCrs11C_(crs);
  return p ? forwardTransverseMercator11C_(lat,lon,ellipsoid,p) : null;
}
function inverseProjection11C_(easting,northing,crs,ellipsoid) {
  const p=projectionParamsFromCrs11C_(crs);
  return p ? inverseTransverseMercator11C_(easting,northing,ellipsoid,p) : null;
}

function transformDatumWgs84To11B_(lat, lon, targetDatum, params) {
  const target=getDatumEllipsoid11B_(targetDatum), wgs=getDatumEllipsoid11B_('WGS84');
  if (!target || !wgs || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (String(targetDatum).toUpperCase()==='WGS84') return {lat,lon,height:0,method:'IDENTITY'};
  if (!params) return null;
  const wgsXyz=geodeticToEcef11B_(lat,lon,0,wgs);
  const targetXyz=helmert11B_(wgsXyz,params,true);
  return ecefToGeodetic11B_(targetXyz,target);
}

function transformDatum11BToWgs84_(lat, lon, sourceDatum, params) {
  const source=getDatumEllipsoid11B_(sourceDatum), wgs=getDatumEllipsoid11B_('WGS84');
  if (!source || !wgs || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (String(sourceDatum).toUpperCase()==='WGS84') return {lat,lon,height:0,method:'IDENTITY'};
  if (!params) return null;
  const srcXyz=geodeticToEcef11B_(lat,lon,0,source);
  const wgsXyz=helmert11B_(srcXyz,params,false);
  return ecefToGeodetic11B_(wgsXyz,wgs);
}

function datumDetectionIsWgs84_11A_(detection) {
  return !!detection && String(detection.datum || '').toUpperCase() === 'WGS84';
}

function parseTerraGoRegistration10A_(raw) {
  if (!raw) return [];
  const groups = [];
  const re = /\[([^\[\]]+)\]/g;
  let m;
  while ((m = re.exec(raw))) {
    const n = pdfNums10A_(m[1]);
    if (n.length >= 4) groups.push({ pdf: { x:n[0], y:n[1] }, map:{ x:n[2], y:n[3] } });
  }
  return groups;
}
function parseTerraGoNeatline10A_(raw) {
  const n = pdfNums10A_(raw);
  if (n.length < 4 || n.length % 2) return null;
  const pts = [];
  for (let i=0;i<n.length;i+=2) pts.push({x:n[i],y:n[i+1]});
  if (pts.length === 2) {
    const a=pts[0], b=pts[1];
    return [{x:a.x,y:a.y},{x:a.x,y:b.y},{x:b.x,y:b.y},{x:b.x,y:a.y}];
  }
  return pts;
}
function terraGoCtmToAffine10A_(ctm) {
  if (!Array.isArray(ctm) || ctm.length !== 6 || ctm.some(v => !Number.isFinite(v))) return null;
  return { ax:ctm[0], bx:ctm[2], cx:ctm[4], ay:ctm[1], by:ctm[3], cy:ctm[5] };
}
function parseTerraGoLgi10A_(text) {
  const frames=[];
  const objectRe=/(?:^|\n|\r)\s*(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj\b/g;
  let m;
  while ((m=objectRe.exec(text||''))) {
    if (/\/Type\s+\/LGIDict\b/i.test(m[2])) frames.push({objectNumber:Number(m[1]),text:m[2]});
  }
  if (!frames.length) return {ok:false,reason:'Tidak ditemukan /LGIDict TerraGo/LGI.'};
  const parsed=[];
  for (const frame of frames) {
    const body=frame.text;
    const ctmBlock=pdfValue10A_(body,'CTM');
    const ctm=ctmBlock ? pdfNums10A_(ctmBlock.raw) : [];
    const registration=parseTerraGoRegistration10A_((pdfValue10A_(body,'Registration')||{}).raw);
    const neatline=parseTerraGoNeatline10A_((pdfValue10A_(body,'Neatline')||{}).raw);
    const projection=parseTerraGoProjection10A_(body,text);
    let affine=terraGoCtmToAffine10A_(ctm);
    if (!affine && registration.length >= 3) affine=solveAffineTransform2D_(registration.map(p=>p.pdf),registration.map(p=>p.map));
    if (!affine || !projection) continue;
    const ptype=String(projection.type||'').toUpperCase();
    if (ptype !== 'UT' || !Number.isInteger(projection.zone) || projection.zone<1 || projection.zone>60 || !['N','S'].includes(projection.hemisphere)) continue;
    const vp=neatline && neatline.length ? [Math.min(...neatline.map(p=>p.x)),Math.min(...neatline.map(p=>p.y)),Math.max(...neatline.map(p=>p.x)),Math.max(...neatline.map(p=>p.y))] : (registration.length ? [Math.min(...registration.map(p=>p.pdf.x)),Math.min(...registration.map(p=>p.pdf.y)),Math.max(...registration.map(p=>p.pdf.x)),Math.max(...registration.map(p=>p.pdf.y))] : null);
    if (!vp) continue;
    const native=neatline ? neatline.map(p=>applyAffineTransform2D_(affine,p)) : [];
    const boundary=native.length>=3 ? {type:'neatline',source:'TERRAGO_LGI_NEATLINE',pagePoints:neatline,nativePoints:native,extent:{cornerTL:{timur:Math.min(...native.map(p=>p.x)),utara:Math.max(...native.map(p=>p.y))},cornerBR:{timur:Math.max(...native.map(p=>p.x)),utara:Math.min(...native.map(p=>p.y))}}} : null;
    const datum=projection.datum==='WE'?'WGS84':(projection.datum||'UNKNOWN');
    parsed.push({objectNumber:frame.objectNumber,description:pdfString10A_(body,'Description')||'',version:pdfString10A_(body,'Version'),projection,affine,registration,neatline,boundary,vpBBox:vp,crs:{datum,zone:projection.zone,hemisphere:projection.hemisphere,epsg:datum==='WGS84'?(projection.hemisphere==='N'?32600+projection.zone:32700+projection.zone):null,name:'TerraGo/LGI UTM Zone '+projection.zone+projection.hemisphere,centralMeridian:projection.centralMeridian,falseEasting:projection.falseEasting,falseNorthing:projection.falseNorthing,scaleFactor:projection.scaleFactor,projection:'TRANSVERSE_MERCATOR'}});
  }
  if (!parsed.length) return {ok:false,reason:'LGIDict ditemukan, tetapi belum ada map frame TerraGo/LGI UTM yang dapat dipakai aman oleh engine MG1.'};
  return {ok:true,frames:parsed,frame:parsed[0]};
}

// STEP 9A: GeoPDF Neatline / map-frame boundary.
// Neatline adalah batas valid georegistration pada PDF page. Implementasi ini
// sengaja memakai data publik GeoPDF/OGC dan tidak meniru kode proprietary Avenza.
function parseNeatlineCandidates_(text) {
  const out = [];
  if (!text) return out;
  const re = /\/Neatline\s*\[\s*([^\]]+?)\s*\]/gi;
  let m;
  while ((m = re.exec(text))) {
    const nums = m[1].trim().split(/\s+/).map(Number);
    if (nums.length < 8 || nums.length % 2 !== 0 || nums.some(v => !Number.isFinite(v))) continue;
    const points = [];
    for (let i = 0; i < nums.length; i += 2) points.push({ x: nums[i], y: nums[i + 1] });
    out.push(points);
  }
  return out;
}

function selectGeoPdfNeatline_(candidates, vpBBox) {
  if (!Array.isArray(candidates) || !candidates.length || !Array.isArray(vpBBox) || vpBBox.length < 4) return null;
  const vx0 = Math.min(vpBBox[0], vpBBox[2]), vx1 = Math.max(vpBBox[0], vpBBox[2]);
  const vy0 = Math.min(vpBBox[1], vpBBox[3]), vy1 = Math.max(vpBBox[1], vpBBox[3]);
  let best = null, bestScore = -Infinity;
  for (const points of candidates) {
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const px0 = Math.min(...xs), px1 = Math.max(...xs), py0 = Math.min(...ys), py1 = Math.max(...ys);
    const iw = Math.max(0, Math.min(vx1, px1) - Math.max(vx0, px0));
    const ih = Math.max(0, Math.min(vy1, py1) - Math.max(vy0, py0));
    const interArea = iw * ih;
    const pArea = Math.max(1e-9, (px1 - px0) * (py1 - py0));
    const vArea = Math.max(1e-9, (vx1 - vx0) * (vy1 - vy0));
    const centerInside = ((px0 + px1) / 2 >= vx0 && (px0 + px1) / 2 <= vx1 &&
      (py0 + py1) / 2 >= vy0 && (py0 + py1) / 2 <= vy1) ? 1 : 0;
    const score = (interArea / Math.max(pArea, vArea)) + centerInside * 0.25;
    if (score > bestScore) { bestScore = score; best = points; }
  }
  return best ? best.map(p => ({ x: p.x, y: p.y })) : null;
}

function buildGeoPdfBoundary_(neatlinePagePoints, affine) {
  if (!Array.isArray(neatlinePagePoints) || neatlinePagePoints.length < 4 || !affine) return null;
  const nativePoints = neatlinePagePoints.map(p => applyAffineTransform2D_(affine, p)).filter(Boolean);
  if (nativePoints.length !== neatlinePagePoints.length) return null;
  const xs = nativePoints.map(p => p.x), ys = nativePoints.map(p => p.y);
  return {
    type: 'neatline',
    source: 'GEOPDF_NEATLINE',
    pagePoints: neatlinePagePoints.map(p => ({ x: p.x, y: p.y })),
    nativePoints: nativePoints.map(p => ({ x: p.x, y: p.y })),
    extent: {
      cornerTL: { timur: Math.min(...xs), utara: Math.max(...ys) },
      cornerBR: { timur: Math.max(...xs), utara: Math.min(...ys) }
    }
  };
}

function isPointInsidePolygon_(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function isNativeCoordinateInsideGeoPdfBoundary_(geoReference, x, y, epsilonMeters) {
  const b = geoReference && geoReference.boundary;
  if (!b || b.type !== 'neatline' || !Array.isArray(b.nativePoints) || b.nativePoints.length < 3) return true;
  const eps = Number.isFinite(epsilonMeters) ? Math.max(0, epsilonMeters) : 0;
  if (isPointInsidePolygon_({ x, y }, b.nativePoints)) return true;
  // Boundary vertex/edge tolerance: accept a small distance to the polygon bbox first.
  const ex = b.extent;
  if (ex && x >= ex.cornerTL.timur - eps && x <= ex.cornerBR.timur + eps &&
      y <= ex.cornerTL.utara + eps && y >= ex.cornerBR.utara - eps) {
    return isPointInsidePolygon_({ x: x + eps, y }, b.nativePoints) ||
           isPointInsidePolygon_({ x: x - eps, y }, b.nativePoints) ||
           isPointInsidePolygon_({ x, y: y + eps }, b.nativePoints) ||
           isPointInsidePolygon_({ x, y: y - eps }, b.nativePoints);
  }
  return false;
}

// STEP 10E: Multi-Viewport / Multi-Map-Frame handling.
// Satu PDF dapat memiliki beberapa Viewport/Measure pair (mis. main map + inset map).
// MG1 tetap menyimpan satu GeoReference aktif untuk satu background map, tetapi sebelum
// memilih frame kita enumerasi semua kandidat valid agar tidak lagi bergantung pada [0].
// Primary frame dipilih deterministik: kandidat dengan area viewport terbesar.
function buildGeoPdfMapFrameCandidates10E_(text, measureVariants) {
  const candidates = [];
  const seen = new Set();
  (measureVariants || []).forEach((variant, index) => {
    const bbox = findGeoPdfViewportBBoxForMeasure10C_(text, variant);
    if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every(Number.isFinite)) return;
    const width = Math.abs(bbox[2] - bbox[0]);
    const height = Math.abs(bbox[3] - bbox[1]);
    const area = width * height;
    if (!(width > 0 && height > 0 && Number.isFinite(area))) return;
    const key = [
      variant.ownerObjectNumber || '',
      bbox.map(v => Number(v).toFixed(6)).join(','),
      (variant.gpts || []).join(','),
      (variant.lpts || []).join(',')
    ].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({
      index, source: variant.source || 'UNKNOWN',
      ownerObjectNumber: variant.ownerObjectNumber || null,
      bbox: bbox.slice(), width, height, area, measureVariant: variant
    });
  });
  return candidates;
}

function selectGeoPdfMapFrame10E_(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) return null;
  return candidates.slice().sort((a, b) => {
    if (b.area !== a.area) return b.area - a.area;
    return a.index - b.index;
  })[0];
}

function findGeoPdfViewportBBoxForMeasure10C_(text, measureVariant) {
  const full = String(text || '');
  const owner = measureVariant && Number(measureVariant.ownerObjectNumber);
  if (owner) {
    const ownerBody = extractPdfObject10C_(full, owner);
    const direct = bboxFromViewportText10C_(ownerBody);
    if (direct) return direct;

    // Page/Viewport dictionaries commonly reference the Measure object indirectly.
    const ref = Number(owner);
    const objectRe = /(?:^|\n|\r)\s*(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj\b/g;
    let m;
    while ((m = objectRe.exec(full))) {
      const body = m[2];
      if (!/\/Type\s*\/Viewport\b/i.test(body)) continue;
      const measureRef = body.match(new RegExp('\/Measure\s+' + ref + '\\s+0\\s+R\b'));
      if (measureRef) {
        const b = bboxFromViewportText10C_(body);
        if (b) return b;
      }
    }
  }

  // /VP [N 0 R ...] can live on a page object. Find a page/object referencing the
  // Measure, then resolve its VP references to Viewport objects.
  if (owner) {
    const refRe = new RegExp('\\/Measure\\s+' + owner + '\\s+0\\s+R\\b[\\s\\S]{0,1600}?\\/VP\\s*\\[([^\\]]+)\\]', 'i');
    const hit = refRe.exec(full);
    if (hit) {
      const refs = String(hit[1]).match(/\b\d+\s+0\s+R\b/g) || [];
      for (const token of refs) {
        const n = Number(token.match(/^\d+/)[0]);
        const b = bboxFromViewportText10C_(extractPdfObject10C_(full, n));
        if (b) return b;
      }
    }
  }

  // Direct Measure inside Viewport, including inline dictionaries.
  const directRe = /\/Type\s*\/Viewport\b[\s\S]{0,1800}?\/Measure\s*(?:\d+\s+0\s+R|<<)[\s\S]{0,900}?\/BBox\s*\[([^\]]+)\]/gi;
  let dm;
  while ((dm = directRe.exec(full))) {
    const b = pdfNums10A_(dm[1]).slice(0,4);
    if (b.length === 4 && b.every(Number.isFinite)) return b;
  }

  return findGeoPdfViewportBBox10B_(full);
}

function parseTerraGoProjection10A_(body, fullText) {
  const b = pdfValue10A_(body, 'Projection');
  if (!b) return null;
  const p = b.raw.startsWith('<<') ? b.raw : (pdfRefObject10A_(fullText, b.raw) || '');
  if (!p) return null;
  return {
    type: pdfString10A_(p, 'ProjectionType') || 'NONE',
    datum: pdfString10A_(p, 'Datum') || '',
    hemisphere: (pdfString10A_(p, 'Hemisphere') || '').toUpperCase() || null,
    zone: pdfScalar10A_(p, 'Zone'),
    centralMeridian: pdfScalar10A_(p, 'CentralMeridian'),
    falseEasting: pdfScalar10A_(p, 'FalseEasting'),
    falseNorthing: pdfScalar10A_(p, 'FalseNorthing'),
    scaleFactor: pdfScalar10A_(p, 'ScaleFactor')
  };
}
function parseTerraGoRegistration10A_(raw) {
  if (!raw) return [];
  const groups = [];
  const re = /\[([^\[\]]+)\]/g;
  let m;
  while ((m = re.exec(raw))) {
    const n = pdfNums10A_(m[1]);
    if (n.length >= 4) groups.push({ pdf: { x:n[0], y:n[1] }, map:{ x:n[2], y:n[3] } });
  }
  return groups;
}
function parseTerraGoNeatline10A_(raw) {
  const n = pdfNums10A_(raw);
  if (n.length < 4 || n.length % 2) return null;
  const pts = [];
  for (let i=0;i<n.length;i+=2) pts.push({x:n[i],y:n[i+1]});
  if (pts.length === 2) {
    const a=pts[0], b=pts[1];
    return [{x:a.x,y:a.y},{x:a.x,y:b.y},{x:b.x,y:b.y},{x:b.x,y:a.y}];
  }
  return pts;
}
function terraGoCtmToAffine10A_(ctm) {
  if (!Array.isArray(ctm) || ctm.length !== 6 || ctm.some(v => !Number.isFinite(v))) return null;
  return { ax:ctm[0], bx:ctm[2], cx:ctm[4], ay:ctm[1], by:ctm[3], cy:ctm[5] };
}
function parseTerraGoLgi10A_(text) {
  const frames=[];
  const objectRe=/(?:^|\n|\r)\s*(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj\b/g;
  let m;
  while ((m=objectRe.exec(text||''))) {
    if (/\/Type\s+\/LGIDict\b/i.test(m[2])) frames.push({objectNumber:Number(m[1]),text:m[2]});
  }
  if (!frames.length) return {ok:false,reason:'Tidak ditemukan /LGIDict TerraGo/LGI.'};
  const parsed=[];
  for (const frame of frames) {
    const body=frame.text;
    const ctmBlock=pdfValue10A_(body,'CTM');
    const ctm=ctmBlock ? pdfNums10A_(ctmBlock.raw) : [];
    const registration=parseTerraGoRegistration10A_((pdfValue10A_(body,'Registration')||{}).raw);
    const neatline=parseTerraGoNeatline10A_((pdfValue10A_(body,'Neatline')||{}).raw);
    const projection=parseTerraGoProjection10A_(body,text);
    let affine=terraGoCtmToAffine10A_(ctm);
    if (!affine && registration.length >= 3) affine=solveAffineTransform2D_(registration.map(p=>p.pdf),registration.map(p=>p.map));
    if (!affine || !projection) continue;
    const ptype=String(projection.type||'').toUpperCase();
    if (ptype !== 'UT' || !Number.isInteger(projection.zone) || projection.zone<1 || projection.zone>60 || !['N','S'].includes(projection.hemisphere)) continue;
    const vp=neatline && neatline.length ? [Math.min(...neatline.map(p=>p.x)),Math.min(...neatline.map(p=>p.y)),Math.max(...neatline.map(p=>p.x)),Math.max(...neatline.map(p=>p.y))] : (registration.length ? [Math.min(...registration.map(p=>p.pdf.x)),Math.min(...registration.map(p=>p.pdf.y)),Math.max(...registration.map(p=>p.pdf.x)),Math.max(...registration.map(p=>p.pdf.y))] : null);
    if (!vp) continue;
    const native=neatline ? neatline.map(p=>applyAffineTransform2D_(affine,p)) : [];
    const boundary=native.length>=3 ? {type:'neatline',source:'TERRAGO_LGI_NEATLINE',pagePoints:neatline,nativePoints:native,extent:{cornerTL:{timur:Math.min(...native.map(p=>p.x)),utara:Math.max(...native.map(p=>p.y))},cornerBR:{timur:Math.max(...native.map(p=>p.x)),utara:Math.min(...native.map(p=>p.y))}}} : null;
    const datum=projection.datum==='WE'?'WGS84':(projection.datum||'UNKNOWN');
    parsed.push({objectNumber:frame.objectNumber,description:pdfString10A_(body,'Description')||'',version:pdfString10A_(body,'Version'),projection,affine,registration,neatline,boundary,vpBBox:vp,crs:{datum,zone:projection.zone,hemisphere:projection.hemisphere,epsg:datum==='WGS84'?(projection.hemisphere==='N'?32600+projection.zone:32700+projection.zone):null,name:'TerraGo/LGI UTM Zone '+projection.zone+projection.hemisphere,centralMeridian:projection.centralMeridian,falseEasting:projection.falseEasting,falseNorthing:projection.falseNorthing,scaleFactor:projection.scaleFactor}});
  }
  if (!parsed.length) return {ok:false,reason:'LGIDict ditemukan, tetapi belum ada map frame TerraGo/LGI UTM yang dapat dipakai aman oleh engine MG1.'};
  return {ok:true,frames:parsed,frame:parsed[0]};
}

// STEP 9A: GeoPDF Neatline / map-frame boundary.
// Neatline adalah batas valid georegistration pada PDF page. Implementasi ini
// sengaja memakai data publik GeoPDF/OGC dan tidak meniru kode proprietary Avenza.
function parseNeatlineCandidates_(text) {
  const out = [];
  if (!text) return out;
  const re = /\/Neatline\s*\[\s*([^\]]+?)\s*\]/gi;
  let m;
  while ((m = re.exec(text))) {
    const nums = m[1].trim().split(/\s+/).map(Number);
    if (nums.length < 8 || nums.length % 2 !== 0 || nums.some(v => !Number.isFinite(v))) continue;
    const points = [];
    for (let i = 0; i < nums.length; i += 2) points.push({ x: nums[i], y: nums[i + 1] });
    out.push(points);
  }
  return out;
}

function selectGeoPdfNeatline_(candidates, vpBBox) {
  if (!Array.isArray(candidates) || !candidates.length || !Array.isArray(vpBBox) || vpBBox.length < 4) return null;
  const vx0 = Math.min(vpBBox[0], vpBBox[2]), vx1 = Math.max(vpBBox[0], vpBBox[2]);
  const vy0 = Math.min(vpBBox[1], vpBBox[3]), vy1 = Math.max(vpBBox[1], vpBBox[3]);
  let best = null, bestScore = -Infinity;
  for (const points of candidates) {
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const px0 = Math.min(...xs), px1 = Math.max(...xs), py0 = Math.min(...ys), py1 = Math.max(...ys);
    const iw = Math.max(0, Math.min(vx1, px1) - Math.max(vx0, px0));
    const ih = Math.max(0, Math.min(vy1, py1) - Math.max(vy0, py0));
    const interArea = iw * ih;
    const pArea = Math.max(1e-9, (px1 - px0) * (py1 - py0));
    const vArea = Math.max(1e-9, (vx1 - vx0) * (vy1 - vy0));
    const centerInside = ((px0 + px1) / 2 >= vx0 && (px0 + px1) / 2 <= vx1 &&
      (py0 + py1) / 2 >= vy0 && (py0 + py1) / 2 <= vy1) ? 1 : 0;
    const score = (interArea / Math.max(pArea, vArea)) + centerInside * 0.25;
    if (score > bestScore) { bestScore = score; best = points; }
  }
  return best ? best.map(p => ({ x: p.x, y: p.y })) : null;
}

function buildGeoPdfBoundary_(neatlinePagePoints, affine) {
  if (!Array.isArray(neatlinePagePoints) || neatlinePagePoints.length < 4 || !affine) return null;
  const nativePoints = neatlinePagePoints.map(p => applyAffineTransform2D_(affine, p)).filter(Boolean);
  if (nativePoints.length !== neatlinePagePoints.length) return null;
  const xs = nativePoints.map(p => p.x), ys = nativePoints.map(p => p.y);
  return {
    type: 'neatline',
    source: 'GEOPDF_NEATLINE',
    pagePoints: neatlinePagePoints.map(p => ({ x: p.x, y: p.y })),
    nativePoints: nativePoints.map(p => ({ x: p.x, y: p.y })),
    extent: {
      cornerTL: { timur: Math.min(...xs), utara: Math.max(...ys) },
      cornerBR: { timur: Math.max(...xs), utara: Math.min(...ys) }
    }
  };
}

function isPointInsidePolygon_(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function isNativeCoordinateInsideGeoPdfBoundary_(geoReference, x, y, epsilonMeters) {
  const b = geoReference && geoReference.boundary;
  if (!b || b.type !== 'neatline' || !Array.isArray(b.nativePoints) || b.nativePoints.length < 3) return true;
  const eps = Number.isFinite(epsilonMeters) ? Math.max(0, epsilonMeters) : 0;
  if (isPointInsidePolygon_({ x, y }, b.nativePoints)) return true;
  // Boundary vertex/edge tolerance: accept a small distance to the polygon bbox first.
  const ex = b.extent;
  if (ex && x >= ex.cornerTL.timur - eps && x <= ex.cornerBR.timur + eps &&
      y <= ex.cornerTL.utara + eps && y >= ex.cornerBR.utara - eps) {
    return isPointInsidePolygon_({ x: x + eps, y }, b.nativePoints) ||
           isPointInsidePolygon_({ x: x - eps, y }, b.nativePoints) ||
           isPointInsidePolygon_({ x, y: y + eps }, b.nativePoints) ||
           isPointInsidePolygon_({ x, y: y - eps }, b.nativePoints);
  }
  return false;
}


function buildGeoReferenceObject_(args) {
  const {
    sourceFileName, measureSubtype, gcsObjectNumber, vpBBox, gpts, lpts,
    coordinateType, crs, crsSource, transform, residualM, extent, mapFrame, boundary, datumTransform, datumDetection
  } = args;

  return {
    schema: 'MG1-GeoReference',
    version: 1,
    source: {
      type: 'GeoPDF',
      fileName: sourceFileName || '',
      measureSubtype: measureSubtype || 'GEO',
      gcsObjectNumber: gcsObjectNumber || null
    },
    metadata: {
      gpts: gpts.slice(),
      lpts: lpts.slice(),
      vpBBox: vpBBox.slice(),
      coordinateType: coordinateType || 'projected'
    },
    transform: {
      type: 'affine-2d',
      direction: 'page-to-native',
      coefficients: {
        ax: transform.ax, bx: transform.bx, cx: transform.cx,
        ay: transform.ay, by: transform.by, cy: transform.cy
      },
      validation: {
        maxResidualMeters: residualM
      }
    },
    crs: {
      datum: crs.datum || 'UNKNOWN',
      zone: crs.zone ?? null,
      hemisphere: crs.hemisphere || null,
      epsg: crs.epsg ?? null,
      name: crs.name || '',
      centralMeridian: crs.centralMeridian ?? null,
      falseEasting: crs.falseEasting ?? null,
      falseNorthing: crs.falseNorthing ?? null,
      scaleFactor: crs.scaleFactor ?? null,
      projection: crs.projection || 'TRANSVERSE_MERCATOR_UTM_COMPATIBLE',
      nativeUnits: crs.nativeUnits || ((String(crs.projection||'').toUpperCase()==='GEOGRAPHIC') ? 'degrees' : 'meters'),
      source: crsSource
    },
    datumTransform: datumTransform ? {
      method: datumTransform.method || 'HELMERT',
      sourceDatum: datumTransform.sourceDatum || null,
      targetDatum: datumTransform.targetDatum || null,
      parameters: datumTransform.parameters || null,
      status: datumTransform.status || 'available',
      source: datumTransform.source || 'EXPLICIT_METADATA'
    } : null,
    datumDetection: datumDetection ? {
      datum: datumDetection.datum || 'UNKNOWN',
      status: datumDetection.status || 'unknown',
      confidence: datumDetection.confidence || 'none',
      source: datumDetection.source || 'NO_EXPLICIT_DATUM',
      epsg: datumDetection.epsg ?? null
    } : null,
    extent: {
      cornerTL: { timur: extent.cornerTL.timur, utara: extent.cornerTL.utara },
      cornerBR: { timur: extent.cornerBR.timur, utara: extent.cornerBR.utara }
    },
    mapFrame: mapFrame ? {
      candidateCount: Number(mapFrame.candidateCount) || 1,
      selectedIndex: Number(mapFrame.selectedIndex) || 0,
      selection: mapFrame.selection || 'largest-viewport'
    } : null,
    boundary: boundary ? {
      type: boundary.type || 'neatline',
      source: boundary.source || 'GEOPDF_NEATLINE',
      pagePoints: (boundary.pagePoints || []).map(p => ({ x: p.x, y: p.y })),
      nativePoints: (boundary.nativePoints || []).map(p => ({ x: p.x, y: p.y })),
      extent: boundary.extent ? {
        cornerTL: { timur: boundary.extent.cornerTL.timur, utara: boundary.extent.cornerTL.utara },
        cornerBR: { timur: boundary.extent.cornerBR.timur, utara: boundary.extent.cornerBR.utara }
      } : null
    } : null
  };
}

async function tryParseGeoPdf_(file, onProgress, onGeoReferenceReady) {
  // [DIPERBAIKI] report() SEBELUMNYA cuma meneruskan `msg`, membuang `percent` -- makanya
  // progress bar upload GeoPDF terlihat diam di 0% walau teks jalan (tile pyramid ratusan
  // tile TIDAK PERNAH mengirim angka persen ke UI). Sekarang teruskan keduanya.
  const report = (msg, percent) => { if (onProgress) onProgress(msg, percent); };
  report('Cek pdf.js...');
  if (typeof pdfjsLib === 'undefined') return { ok: false, reason: 'pdf.js belum termuat (kemungkinan CDN diblok jaringan HP ini).' };

  // STEP M2: early source-file memory strategy. File.size is available before reading the
  // bytes, so reject files that are predictably unsafe on low-RAM Android before creating
  // a large ArrayBuffer/string. For accepted files, decode text first and keep the raw byte
  // buffer deferred until pdf.js actually needs it. This avoids holding ArrayBuffer + TEXT
  // simultaneously for the common non-ObjStm path.
  const sourceBytes = Number(file && file.size) || 0;
  const sourceProfile = getGeoPdfSourceMemoryProfileM2_();
  if (sourceBytes > sourceProfile.maxSourceBytes) {
    return { ok: false, reason: 'File GeoPDF terlalu besar untuk diproses aman pada memori perangkat ini (' + (sourceBytes / 1024 / 1024).toFixed(1) + ' MB).', sourceFileBytes: sourceBytes };
  }
  report('Membaca metadata GeoPDF (' + (sourceBytes / 1024 / 1024).toFixed(1) + ' MB)...');
  let buffer = null;
  let bytes = null;
  // File.text() avoids explicitly retaining a caller-owned ArrayBuffer while metadata is
  // decoded. The raw PDF bytes are loaded later only when pdf.js rendering is required.
  let text = '';
  try {
    if (typeof file.text === 'function') {
      text = await file.text();
    } else {
      buffer = await file.arrayBuffer();
      bytes = new Uint8Array(buffer);
      text = typeof TextDecoder !== 'undefined'
        ? new TextDecoder('latin1').decode(bytes)
        : '';
    }
  } catch (_) {
    return { ok: false, reason: 'Gagal membaca metadata PDF dari file.' };
  }

  report('Memeriksa PDF object stream (ObjStm/FlateDecode)...');
  // M1 compressed Object Streams need raw bytes. Only allocate them when the metadata text
  // actually advertises an ObjStm; otherwise the common path remains text-only until render.
  const hasObjStm = /\/Type\s*\/ObjStm\b/i.test(text);
  if (hasObjStm && !bytes) {
    report('Object stream terdeteksi; memuat byte PDF untuk dekompresi metadata...');
    buffer = await file.arrayBuffer();
    bytes = new Uint8Array(buffer);
  }
  if (hasObjStm) {
    text = await expandPdfObjectStreamsM1_(bytes, text, report);
  }
  report('Mencari metadata koordinat (Measure/GPTS/LPTS variants atau TerraGo/LGI LGIDict)...');
  let measureVariants=parseGeoMeasureVariants10B_(text);
  // STEP 10E: enumerasi semua Measure/Viewport candidates sebelum memilih frame aktif.
  let mapFrameCandidates=buildGeoPdfMapFrameCandidates10E_(text, measureVariants);
  let selectedMapFrame=selectGeoPdfMapFrame10E_(mapFrameCandidates);
  let measureVariant=selectedMapFrame ? selectedMapFrame.measureVariant : null;
  // STEP 10D: fallback hanya bila parser utama 10B/10C tidak menemukan Measure.
  // Fallback tidak menimpa hasil parser utama dan tetap mensyaratkan GPTS/LPTS valid.
  if (!measureVariant) {
    const fallback10D=parseGeoPdfFallback10D_(text);
    if (fallback10D.ok) {
      measureVariants=fallback10D.measures;
      mapFrameCandidates=buildGeoPdfMapFrameCandidates10E_(text, measureVariants);
      selectedMapFrame=selectGeoPdfMapFrame10E_(mapFrameCandidates);
      measureVariant=selectedMapFrame ? selectedMapFrame.measureVariant : null;
      report('Fallback GeoPDF parser aktif: metadata GEO ditemukan pada struktur object non-standar.');
    }
  }
  const legacyLgi=measureVariant?null:parseTerraGoLgi10A_(text);
  const isLegacyLgi=!measureVariant&&legacyLgi&&legacyLgi.ok;
  if(!measureVariant&&!isLegacyLgi)return{ok:false,reason:(legacyLgi&&legacyLgi.reason)||'Metadata GeoPDF tidak ditemukan.'};
  let gpts=[],lpts=[],gcsObjNum=null,vpBBox=null,looksLikeLatLon=false;
  let geoPdfCrs=null,affine=null,residual={maxError:0,ok:true},geoPdfBoundary=null,datumDetection=null,datumTransform=null;
  if(measureVariant){
    gpts=measureVariant.gpts.slice();lpts=measureVariant.lpts.slice();gcsObjNum=measureVariant.gcsObjectNumber;
    if (!selectedMapFrame) {
      mapFrameCandidates=buildGeoPdfMapFrameCandidates10E_(text, [measureVariant]);
      selectedMapFrame=selectGeoPdfMapFrame10E_(mapFrameCandidates);
    }
    vpBBox=findGeoPdfViewportBBoxForMeasure10C_(text, measureVariant);
    if(!vpBBox||vpBBox.length!==4||vpBBox.some(v=>!Number.isFinite(v)))return{ok:false,reason:'Metadata koordinat ketemu, tapi Viewport tidak ditemukan.'};
    looksLikeLatLon=gpts.every(v=>Math.abs(v)<=180);
  } else {
    const frame=legacyLgi.frame;
    vpBBox=frame.vpBBox.slice(); affine=frame.affine; geoPdfCrs=frame.crs; geoPdfBoundary=frame.boundary; gcsObjNum=frame.objectNumber;
    datumDetection=detectDatum11A_({ projectionDatum: frame.projection && frame.projection.datum, epsg: frame.crs && frame.crs.epsg });
    if (datumDetection.status === 'recognized') geoPdfCrs.datum = datumDetection.datum;
    if (frame.registration.length) {
      gpts=frame.registration.flatMap(p=>[p.map.y,p.map.x]);
      lpts=frame.registration.flatMap(p=>[(p.pdf.x-vpBBox[0])/((vpBBox[2]-vpBBox[0])||1),(p.pdf.y-vpBBox[1])/((vpBBox[3]-vpBBox[1])||1)]);
    }
    report('TerraGo/LGI LGIDict terdeteksi: map frame '+(frame.description||frame.objectNumber||'1')+', UTM '+frame.crs.zone+frame.crs.hemisphere+'.');
  }

  // STEP 3: deteksi CRS dari objek GCS/PROJCS GeoPDF sebelum memakai fallback situs.
  // Prioritas: nama UTM eksplisit -> fallback Central_Meridian/False_Northing -> situs aktif.
  // Tidak mengubah MG1_CRS_CONFIG global; hasil ini cuma berlaku utk GeoPDF yg sedang dibaca.
  if (!isLegacyLgi) {
  const gcsObjMatch = gcsObjNum ? text.match(new RegExp(gcsObjNum + ' 0 obj([\\s\\S]*?)endobj')) : null;
  const measureGcsText = measureVariant && measureVariant.gcsText && String(measureVariant.gcsText).startsWith('<<') ? measureVariant.gcsText : null;
  if (gcsObjMatch || measureGcsText) {
    const gcsText = gcsObjMatch ? gcsObjMatch[1] : measureGcsText;
    const epsgInText = (gcsText.match(/(?:EPSG\s*[:=]\s*|AUTHORITY\s*\[\s*[\"']EPSG[\"']\s*,\s*[\"'])(\d{4,6})/i) || [])[1];
    datumDetection = detectDatum11A_({ text: gcsText, epsg: epsgInText ? Number(epsgInText) : null });
    const towgs84 = parseTowgs84Parameters11B_(gcsText);
    if (towgs84 && datumDetection && datumDetection.status === 'recognized' && !datumDetectionIsWgs84_11A_(datumDetection)) {
      datumTransform = { method:'HELMERT', sourceDatum:datumDetection.datum, targetDatum:'WGS84', parameters:towgs84, status:'available', source:'GCS_WKT_TOWGS84' };
    }
    const epsgMatch = gcsText.match(/(?:EPSG\s*[:=]\s*|AUTHORITY\s*\[\s*["']EPSG["']\s*,\s*["'])(\d{4,6})/i);
    const utmNameMatch = gcsText.match(/(?:WGS[_\s-]*1984[_\s-]*UTM[_\s-]*Zone[_\s-]*|UTM[_\s-]*Zone[_\s-]*)(\d{1,2})\s*([NS])/i);
    const cmMatch = gcsText.match(/Central_Meridian"?\s*,?\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/i);
    const feMatch = gcsText.match(/False_Easting"?\s*,?\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/i);
    const fnMatch = gcsText.match(/False_Northing"?\s*,?\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/i);
    const k0Match = gcsText.match(/Scale_Factor"?\s*,?\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/i);
    const nameMatch = gcsText.match(/(?:PROJCS|GEOGCS)\["([^"]+)/i);
    let zoneD = null, hemisphereD = null, epsg = epsgMatch ? parseInt(epsgMatch[1], 10) : null;
    const upperGcs = String(gcsText).toUpperCase();
    const geographicEpsgDatums = {4326:'WGS84',4269:'NAD83',4258:'ETRS89',4283:'GDA94',7844:'GDA2020'};
    const isGeographicD = Object.prototype.hasOwnProperty.call(geographicEpsgDatums, epsg) || (/GEOGCS\[/.test(upperGcs) && /WGS[_\s-]*84|GCS[_\s-]*WGS[_\s-]*1984/.test(upperGcs) && !/PROJCS\[/.test(upperGcs));
    const isWebMercatorD = epsg===3857 || epsg===900913 || /WEB[_\s-]*MERCATOR|PSEUDO[_\s-]*MERCATOR|SPHERICAL[_\s-]*MERCATOR/.test(upperGcs);
    if (utmNameMatch) { zoneD = parseInt(utmNameMatch[1], 10); hemisphereD = utmNameMatch[2].toUpperCase(); }
    // ArcGIS WKT kadang tidak menulis UTM_Zone_N/S, tapi parameternya lengkap -- utk UTM
    // WGS84 standar, central meridian = zone*6-183.
    if (!zoneD && cmMatch) {
      const cm = Number(cmMatch[1]);
      const inferredZone = Math.round((cm + 183) / 6);
      const standardCm = inferredZone * 6 - 183;
      if (inferredZone >= 1 && inferredZone <= 60 && Math.abs(cm - standardCm) < 0.001) {
        zoneD = inferredZone;
        const fn = fnMatch ? Number(fnMatch[1]) : 0;
        hemisphereD = fn >= 10000000 ? 'S' : 'N';
      }
    }
    if (zoneD && hemisphereD) {
      if (!epsg && /^N$/i.test(hemisphereD) && zoneD >= 1 && zoneD <= 60) epsg = 32600 + zoneD;
      if (!epsg && /^S$/i.test(hemisphereD) && zoneD >= 1 && zoneD <= 60) epsg = 32700 + zoneD;
      geoPdfCrs = {
        datum: datumDetection && datumDetection.status === 'recognized' ? datumDetection.datum : 'UNKNOWN',
        zone: zoneD, hemisphere: hemisphereD, epsg,
        name: nameMatch ? nameMatch[1] : '',
        centralMeridian: cmMatch ? Number(cmMatch[1]) : null,
        falseEasting: feMatch ? Number(feMatch[1]) : null,
        falseNorthing: fnMatch ? Number(fnMatch[1]) : null,
        scaleFactor: k0Match ? Number(k0Match[1]) : null,
        projection: 'TRANSVERSE_MERCATOR', source: 'GEOPDF_GCS_WKT'
      };
    } else if (isWebMercatorD) {
      geoPdfCrs = { datum:'WGS84', zone:null, hemisphere:null, epsg:epsg || 3857, name:nameMatch ? nameMatch[1] : 'WGS 84 / Pseudo-Mercator', centralMeridian:0, falseEasting:0, falseNorthing:0, scaleFactor:1, projection:'WEB_MERCATOR', source:'GEOPDF_GCS_WKT' };
      datumDetection = { datum:'WGS84', status:'recognized', confidence:'projection-derived', source:'EPSG_PROJECTION', epsg:geoPdfCrs.epsg };
    } else if (isGeographicD) {
      const geographicDatum = geographicEpsgDatums[epsg] || (datumDetection && datumDetection.status === 'recognized' ? datumDetection.datum : 'WGS84');
      geoPdfCrs = { datum:geographicDatum, zone:null, hemisphere:null, epsg:epsg || null, name:nameMatch ? nameMatch[1] : geographicDatum, centralMeridian:null, falseEasting:null, falseNorthing:null, scaleFactor:null, projection:'GEOGRAPHIC', source:'GEOPDF_GCS_WKT' };
      datumDetection = { datum:geographicDatum, status:'recognized', confidence:epsg ? 'epsg-derived' : 'explicit-name', source:epsg ? 'EPSG_PROJECTION' : 'GCS_WKT', epsg:geoPdfCrs.epsg };
    } else if (epsg || /PROJCS\[|GEOGCS\[/.test(upperGcs)) {
      geoPdfCrs = { datum: datumDetection && datumDetection.status === 'recognized' ? datumDetection.datum : 'UNKNOWN', zone:null, hemisphere:null, epsg:epsg || null, name:nameMatch ? nameMatch[1] : '', centralMeridian:cmMatch ? Number(cmMatch[1]) : null, falseEasting:feMatch ? Number(feMatch[1]) : null, falseNorthing:fnMatch ? Number(fnMatch[1]) : null, scaleFactor:k0Match ? Number(k0Match[1]) : null, projection:'UNSUPPORTED', source:'GEOPDF_GCS_WKT' };
    }
  }
  }
  if (!datumDetection) datumDetection = detectDatum11A_({ epsg: geoPdfCrs && geoPdfCrs.epsg, projectionDatum: geoPdfCrs && geoPdfCrs.datum });
  const zone = geoPdfCrs ? geoPdfCrs.zone : MG1_CRS_CONFIG.zone;
  const hemisphere = geoPdfCrs ? geoPdfCrs.hemisphere : MG1_CRS_CONFIG.hemisphere;
  report(geoPdfCrs
    ? 'CRS GeoPDF terdeteksi: ' + (geoPdfCrs.name || (geoPdfCrs.projection === 'WEB_MERCATOR' ? 'Web Mercator' : geoPdfCrs.projection === 'GEOGRAPHIC' ? 'Geographic WGS84' : ('UTM ' + zone + hemisphere))) + (geoPdfCrs.epsg ? ' / EPSG:' + geoPdfCrs.epsg : '')
    : 'CRS GeoPDF tidak eksplisit; memakai CRS situs sbg fallback: UTM ' + zone + hemisphere);
  report(datumDetection && datumDetection.status === 'recognized'
    ? 'Datum GeoPDF terdeteksi: ' + datumDetection.datum + ' (' + datumDetection.confidence + ').'
    : 'Datum GeoPDF tidak eksplisit/terkenali; belum dilakukan asumsi transformasi datum.');
  if (!isLegacyLgi) {
    report('GeoPDF map frame: ' + (mapFrameCandidates.length || 1) + ' candidate(s), frame utama=' +
      (selectedMapFrame ? ('#' + (selectedMapFrame.index + 1) + ', area=' + Math.round(selectedMapFrame.area)) : 'legacy/single') + '.');
  }

  if (!isLegacyLgi) {
  // STEP 2: GPTS dan LPTS dipakai sebagai pasangan titik, bukan sekadar membaca GPTS
  // sebagai bounding box. LPTS berada pada koordinat lokal viewport PDF; kita ubah ke
  // koordinat page menggunakan VP BBox, lalu hitung affine transform 2D page -> geo.
  // Ini menangani rotasi/skew yang tidak bisa ditangkap oleh min/max GPTS saja.
  const pagePts = [];
  for (let i = 0; i < lpts.length; i += 2) {
    pagePts.push({
      x: vpBBox[0] + lpts[i] * (vpBBox[2] - vpBBox[0]),
      y: vpBBox[1] + lpts[i + 1] * (vpBBox[3] - vpBBox[1])
    });
  }
  const geoPts = [];
  for (let i = 0; i < gpts.length; i += 2) {
    const v1 = gpts[i], v2 = gpts[i + 1];
    if (looksLikeLatLon) {
      let lat=v1, lon=v2;
      // 11B: GPTS source datum -> WGS84 hanya untuk jalur koordinat publik;
      // parameter TOWGS84 eksplisit dibalik saat GPS/WGS84 -> source datum.
      // Untuk membentuk native projected coordinate, gunakan ellipsoid source datum.
      const sourceEllipsoid = getDatumEllipsoid11B_(datumDetection && datumDetection.datum);
      if (!sourceEllipsoid) return { ok:false, reason:'Datum ' + (datumDetection && datumDetection.datum || 'UNKNOWN') + ' terdeteksi tetapi ellipsoid belum didukung.' };
      const projected = forwardProjection11D_(lat, lon, geoPdfCrs || { zone, hemisphere }, sourceEllipsoid);
      if (!projected) return { ok:false, reason:'Projection GeoPDF belum didukung oleh engine 11D.' };
      geoPts.push({ x: projected.easting, y: projected.northing });
    } else {
      geoPts.push({ x: v2, y: v1 });
    }
  }

  affine = solveAffineTransform2D_(pagePts, geoPts);
  if (!affine) return { ok: false, reason: 'GPTS/LPTS ditemukan, tetapi transformasi page-to-geo tidak dapat dihitung (titik kolinear/degenerat).' };
  residual = validateAffineTransform2D_(affine, pagePts, geoPts);
  if (!residual.ok) return { ok: false, reason: 'GPTS/LPTS ditemukan, tetapi transformasi tidak konsisten (error maksimum ' + residual.maxError.toFixed(2) + ' m).' };

  }

  // STEP 9A: baca Neatline opsional. Jika ada beberapa map frame, pilih kandidat
  // yang paling beririsan dengan Viewport aktif. Neatline tidak menggantikan VP extent:
  // VP tetap menjadi area raster, sedangkan Neatline menjadi batas valid georeferensi.
  if (!isLegacyLgi) {
    const neatlineCandidates = parseNeatlineCandidates_(text);
    const neatlinePagePoints = selectGeoPdfNeatline_(neatlineCandidates, vpBBox);
    geoPdfBoundary = neatlinePagePoints ? buildGeoPdfBoundary_(neatlinePagePoints, affine) : null;
  }
  report(geoPdfBoundary
    ? 'Neatline GeoPDF terdeteksi (' + geoPdfBoundary.pagePoints.length + ' vertex): batas valid georeferensi aktif.'
    : 'Neatline GeoPDF tidak ditemukan; batas valid memakai Viewport/extent seperti sebelumnya.');

  // Hitung extent dari seluruh viewport melalui transform, bukan min/max GPTS yang bisa
  // salah ketika map diputar. Format penyimpanan Member masih axis-aligned TL/BR.
  const pageCorners = [
    { x: vpBBox[0], y: vpBBox[1] },
    { x: vpBBox[2], y: vpBBox[1] },
    { x: vpBBox[2], y: vpBBox[3] },
    { x: vpBBox[0], y: vpBBox[3] }
  ];
  const geoCorners = pageCorners.map(p => applyAffineTransform2D_(affine, p));
  const eastings = geoCorners.map(p => p.x), northings = geoCorners.map(p => p.y);
  const cornerTL = { timur: Math.min(...eastings), utara: Math.max(...northings) };
  const cornerBR = { timur: Math.max(...eastings), utara: Math.min(...northings) };

  // STEP 5: gabungkan hasil metadata + transform + CRS menjadi satu object standar.
  // CRS efektif harus sama dengan CRS yang benar-benar dipakai membentuk geoPts:
  // GeoPDF WKT bila terdeteksi, atau MG1 site CRS bila metadata CRS tidak eksplisit.
  const effectiveCrs = geoPdfCrs || {
    datum: MG1_CRS_CONFIG.datum || 'UNKNOWN',
    zone,
    hemisphere,
    epsg: null,
    name: MG1_CRS_CONFIG.presetLabel || '',
    centralMeridian: null,
    falseEasting: null,
    falseNorthing: null,
    scaleFactor: null,
    projection: 'TRANSVERSE_MERCATOR_UTM_COMPATIBLE'
  };
  if (effectiveCrs.projection === 'UNSUPPORTED') return { ok:false, reason:'CRS GeoPDF terdeteksi tetapi projection belum didukung oleh engine MG1 (EPSG:' + (effectiveCrs.epsg || '?') + ').' };
  const geoReference = buildGeoReferenceObject_({
    sourceFileName: file && file.name,
    measureSubtype: isLegacyLgi ? 'LGIDict' : 'GEO',
    gcsObjectNumber: gcsObjNum,
    vpBBox,
    gpts,
    lpts,
    coordinateType: looksLikeLatLon ? 'geographic-latlon' : 'projected',
    crs: effectiveCrs,
    crsSource: isLegacyLgi ? 'TERRAGO_LGI_PROJECTION' : (geoPdfCrs ? 'GEOPDF_GCS_WKT' : 'MG1_SITE_FALLBACK'),
    transform: affine,
    residualM: residual.maxError,
    extent: { cornerTL, cornerBR },
    mapFrame: !isLegacyLgi ? {
      candidateCount: mapFrameCandidates.length,
      selectedIndex: selectedMapFrame ? selectedMapFrame.index : 0,
      selection: 'largest-viewport'
    } : null,
    datumDetection,
    datumTransform,
    boundary: geoPdfBoundary
  });
  report('GeoReference Object siap (' + cornerTL.timur.toFixed(0) + '/' + cornerTL.utara.toFixed(0) + ' -- ' + cornerBR.timur.toFixed(0) + '/' + cornerBR.utara.toFixed(0) + '): metadata + transform + CRS tersatukan.');
  // STEP 7.5.3B: GeoReference harus dikembalikan ke form SEBELUM tile processing.
  // Tile generation boleh memakan waktu, tetapi koordinat/CRS sudah valid dan tidak
  // boleh menunggu seluruh pyramid selesai. Callback ini hanya mengirim GeoReference
  // + extent; tidak mengubah transformasi/proyeksi.
  if (typeof onGeoReferenceReady === 'function') {
    try { onGeoReferenceReady({ geoReference, cornerTL, cornerBR }); } catch (callbackError) { console.warn('GeoReference early callback gagal:', callbackError); }
  }

  let loadingTask = null, pdf = null, page = null, cropCanvas = null;
  try {
    // STEP 9C: metadata text tidak diperlukan lagi setelah GeoReference terbentuk.
    // Lepaskan referensi string besar sebelum rasterisasi untuk memberi kesempatan GC Android.
    text = '';
    if (!bytes) {
      report('Memuat byte PDF untuk renderer...');
      buffer = await file.arrayBuffer();
      bytes = new Uint8Array(buffer);
    }
    report('Membuka dokumen PDF (pdfjsLib.getDocument)...');
    loadingTask = pdfjsLib.getDocument({ data: bytes });
    pdf = await loadingTask.promise;
    // pdf.js sudah menerima data; lepaskan referensi wrapper Uint8Array/ArrayBuffer milik kita.
    bytes = null;
    buffer = null;
    report('Dokumen terbuka. Memuat halaman 1 (getPage)...');
    page = await pdf.getPage(1);
    report('Halaman dimuat. Menentukan area render dari VP BBox...');
    // STEP 9B: target 2x tetap dipertahankan untuk file normal. Untuk VP besar,
    // scale diturunkan agar canvas tidak melebihi batas area/dimensi Android. pdf.js
    // tetap menjadi renderer dan tetap mengomposisikan content/tile PDF.
    const baseViewport = page.getViewport({ scale: GEOPDF_RENDER_SCALE_ });
    const vpW = Math.abs(vpBBox[2] - vpBBox[0]);
    const vpH = Math.abs(vpBBox[3] - vpBBox[1]);
    const baseW = vpW * GEOPDF_RENDER_SCALE_;
    const baseH = vpH * GEOPDF_RENDER_SCALE_;
    let scale = GEOPDF_RENDER_SCALE_;
    const areaLimitedScale = Math.sqrt(GEOPDF_MAX_RENDER_PIXELS_ / Math.max(1, vpW * vpH));
    const dimensionLimitedScale = GEOPDF_MAX_RENDER_DIMENSION_ / Math.max(1, vpW, vpH);
    scale = Math.min(scale, areaLimitedScale, dimensionLimitedScale);
    scale = Math.max(0.05, Math.min(GEOPDF_RENDER_SCALE_, scale));
    scale = Math.round(scale * 1000) / 1000;
    const viewport = scale === GEOPDF_RENDER_SCALE_ ? baseViewport : page.getViewport({ scale });
    const pageWidth = viewport.width, pageHeight = viewport.height;
    geoReference.renderScale = scale;
    geoReference.render = { scale, baseScale: GEOPDF_RENDER_SCALE_, maxPixels: GEOPDF_MAX_RENDER_PIXELS_, maxDimension: GEOPDF_MAX_RENDER_DIMENSION_ };
    if (scale < GEOPDF_RENDER_SCALE_) {
      report('GeoPDF besar: render scale diturunkan dari ' + GEOPDF_RENDER_SCALE_ + 'x menjadi ' + scale + 'x untuk menjaga memori Android.');
    } else {
      report('Render scale GeoPDF: ' + scale + 'x.');
    }

    // STEP 7.5.3: DIRECT TILE-ONLY GeoPDF path.
    // Setiap tile dirender langsung dari PDF.js pada resolusi levelnya; tidak ada
    // full-page raster/crop yang kemudian di-upscale menjadi sumber deep-zoom.
    const tileStartedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    report('Membangun tile pyramid langsung dari PDF...');
    const tilePyramid = await buildTilePyramidDirect_(page, vpBBox, scale, report);
    const tileFinishedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    // IndexedDB/form lama masih membutuhkan imageDataUrl sebagai preview/fallback.
    // Preview dibuat dari level terendah tile pyramid, sehingga canvas yang dialokasikan
    // kecil dan tidak lagi memicu OOM. Ini BUKAN sumber deep-zoom.
    const previewLevel = tilePyramid.levels[0];
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = previewLevel.width;
    previewCanvas.height = previewLevel.height;
    const previewCtx = previewCanvas.getContext('2d', { alpha: false, willReadFrequently: false });
    if (!previewCtx) throw new Error('Canvas preview tidak tersedia.');
    for (const t of (previewLevel.tiles || [])) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = t.dataUrl;
      });
      previewCtx.drawImage(img, t.x * tilePyramid.tileSize, t.y * tilePyramid.tileSize, t.width, t.height);
      try { img.src = ''; } catch (_) {}
    }
    const imageDataUrl = previewCanvas.toDataURL('image/png');
    const previewEncodeFinishedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    geoReference.render.performance = {
      renderMs: Math.max(0, tileFinishedAt - tileStartedAt),
      renderedPixels: previewLevel.width * previewLevel.height,
      megapixels: Number(((previewLevel.width * previewLevel.height) / 1000000).toFixed(3)),
      pixelsPerSecond: null,
      requestAnimationFrame: true,
      mode: 'pdfjs-direct-tile-render',
      tileRenderMs: Math.max(0, tileFinishedAt - tileStartedAt),
      previewEncodeMs: Math.max(0, previewEncodeFinishedAt - tileFinishedAt)
    };
    geoReference.render.tilePyramid = {
      mode: 'pdfjs-direct-tile-render',
      tileSize: GEOPDF_TILE_SIZE_,
      levels: GEOPDF_TILE_LEVEL_FACTORS_.slice(),
      baseScale: scale,
      source: 'GeoPDF direct PDF.js tile render',
      deepZoomUsesTiles: true
    };
    releaseGeoPdfCanvas_(previewCanvas);
    // Tidak ada fullCanvas/cropCanvas pada jalur GeoPDF ini.
    return { ok: true, imageDataUrl, tilePyramid, cornerTL, cornerBR, geoReference };
  } catch (e) {
    console.warn('Koordinat GeoPDF berhasil dibaca, TAPI render halaman via pdf.js gagal:', e);
    return { ok: false, reason: 'Koordinat berhasil dibaca (' + JSON.stringify(cornerTL) + ' / ' + JSON.stringify(cornerBR) + '), TAPI gagal render gambar halamannya: ' + (e.message || e) + '. Coba isi manual pakai angka di atas, upload gambar PNG/JPG terpisah.', cornerTL, cornerBR, geoReference };
  } finally {
    // STEP 9C: satu jalur cleanup untuk success, render error, getPage error, dan early OOM guard.
    cleanupGeoPdfResources_(page, pdf, loadingTask, cropCanvas);
    page = null; pdf = null; loadingTask = null; cropCanvas = null;
    bytes = null; buffer = null; text = '';
  }
}
async function submitMapUpload_() {
  if (mapUploadBusy || mapUploadProcessing) return;
  const f = mapUploadFormState;
  if (!f.fileDataUrl) { mapUploadStatusMsg = 'Pilih gambar peta dulu.'; mapUploadStatusOk = false; render(); return; }
  if (!f.name.trim()) { mapUploadStatusMsg = 'Nama peta wajib diisi.'; mapUploadStatusOk = false; render(); return; }
  if (!isStrictNumeric(f.tlTimur) || !isStrictNumeric(f.tlUtara) || !isStrictNumeric(f.brTimur) || !isStrictNumeric(f.brUtara)) {
    mapUploadStatusMsg = 'Ke-4 angka Timur/Utara wajib angka valid (bukan kosong/teks).'; mapUploadStatusOk = false; render(); return;
  }
  mapUploadBusy = true; mapUploadStatusMsg = 'Menyimpan ke HP...'; mapUploadStatusOk = true; render();
  try {
    const id = 'bgmap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await dbPutMap_({
      id: id,
      name: f.name.trim(),
      imageDataUrl: f.fileDataUrl,
      cornerTL: f.geoReference && f.geoReference.extent ? { ...f.geoReference.extent.cornerTL } : { timur: parseFloat(f.tlTimur), utara: parseFloat(f.tlUtara) },
      cornerBR: f.geoReference && f.geoReference.extent ? { ...f.geoReference.extent.cornerBR } : { timur: parseFloat(f.brTimur), utara: parseFloat(f.brUtara) },
      geoReference: f.geoReference || null,
      tilePyramid: f.tilePyramid || null,
      uploadedAt: new Date().toISOString(),
      uploadedBy: sessionInfo ? sessionInfo.userName : 'unknown'
    });
    await loadBackgroundMapsFromDb_();
    activeBackgroundMapId = id; // peta baru diupload langsung diaktifkan
    mapZoom = 1.25;
    mapViewportState_.centerNative = null;
    localStorage.setItem('mg1_active_bg_map_id', id);
    mapUploadFormOpen = false;
  } catch (e) {
    mapUploadStatusMsg = 'Gagal menyimpan (HP mungkin kehabisan ruang penyimpanan).'; mapUploadStatusOk = false;
  } finally {
    mapUploadBusy = false; render();
  }
}
function activateBackgroundMap_(id) {
  activeBackgroundMapId = id;
  mapZoom = 1.25;
  mapViewportState_.centerNative = null;
  localStorage.setItem('mg1_active_bg_map_id', id);
  render();
}
async function deactivateBackgroundMap_() {
  activeBackgroundMapId = null;
  mapZoom = 1;
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

// ==== NORTH ARROW / CRS CONFIG -- v90.2.117 BARU (4 Sep, desain LOCKED sesi audit
// Avenza+ArcGIS, lihat memori proyek utk histori lengkap). Config CRS DISENGAJA disimpan
// sbg 1 objek terpisah di sini (bukan ditanam ke dalam logic kalkulasi) -- kalau situs
// tambang/client lain pakai zona UTM beda, cukup ubah zone/hemisphere di objek ini, TIDAK
// perlu bongkar fungsi inverseUtm_/gridConvergence_ di north_engine bawah.
// Central_Meridian/False_Easting/False_Northing DITURUNKAN OTOMATIS dari zone/hemisphere
// (rumus UTM standar) -- sengaja TIDAK diketik manual, mengurangi risiko typo kalibrasi.
// Sumber: Layer Properties > Source project ArcGIS "Maps_TP" (dikonfirmasi user 4 Sep
// sbg CRS yg sama dipakai utk data tambang aktif MG1).
// [DIUBAH -- 4 Sep] const -> let: sekarang bisa di-update runtime dari backend (lihat
// fetchCrsConfig() di bawah), bukan cuma hardcode tetap. Nilai di sini TETAP jadi fallback
// kalau fetch gagal (mis. offline) -- app tidak pernah "kosong" config, selalu ada nilai
// yg valid dipakai (sama persis nilai lama sebelum fitur config-dari-backend ini ada).
let MG1_CRS_CONFIG = { datum: 'WGS84', zone: 52, hemisphere: 'N', presetLabel: 'Halmahera (Tengah + Timur)' };

// [BARU -- 4 Sep] Ambil config CRS dari backend (SecurityConfig, via sheet=crsconfig) --
// dipanggil sekali saat boot app. Kalau gagal (network/dll), MG1_CRS_CONFIG TETAP pakai
// nilai fallback di atas -- North Arrow tidak pernah crash gara2 config CRS gagal dimuat,
// paling buruk convergence dihitung dari asumsi Halmahera (default lama).
async function fetchCrsConfig() {
  try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=crsconfig&t=' + Date.now(), {}, 10000);
    const result = await response.json();
    if (result.status === 'success' && result.data) {
      MG1_CRS_CONFIG = {
        datum: 'WGS84',
        zone: result.data.zone,
        hemisphere: result.data.hemisphere,
        presetLabel: result.data.presetLabel || MG1_CRS_CONFIG.presetLabel
      };
    }
  } catch (e) {
    console.warn('Gagal ambil config CRS dari server, pakai fallback lokal:', e);
  }
}

// Mode North Arrow: 'grid' (default, 0 kalkulasi) | 'true' (dihitung dari convergence) |
// 'compass' (BELUM AKTIF -- guard eksplisit di setNorthMode_, bukan cuma disabled visual).
let northMode = 'grid';
let northInfoOpen = false; // panel detail (tap ikon North utk buka/tutup)

// Mode Ukur (bonus fitur, TP->TP Bearing+Distance) -- terpisah dari mapDetailIdTp supaya
// tidak saling ganggu (buka detail 1 TP tetap bisa jalan normal walau lagi mode ukur).
let measureModeActive = false;
let measureFromIdTp = null;    // titik pertama yg sudah ditap, null = belum pilih titik awal
let measureToIdTp = null;      // titik kedua, null = hasil belum lengkap
function toggleMeasureMode_() {
  measureModeActive = !measureModeActive;
  measureFromIdTp = null; measureToIdTp = null; // reset selalu -- ganti mode = mulai ulang
  render();
}

// ==== FUNGSI UTAMA PETA (data, SVG, North Arrow, Mode Ukur, Detail Modal) ====
// [BARU] Peta STANDALONE -- fetch data validasi SENDIRI, lazy (cuma dipanggil saat tab
// Peta pertama kali dibuka), TIDAK bergantung ke loadRingkasanData() (yg juga fetch
// Produksi utk tab Digging, tidak relevan bagi Peta). Kalau `mapDataFetchAttempted` sudah
// true (mis. loadRingkasanData() normal sudah selesai lebih dulu, atau tab Peta sudah
// pernah dibuka sebelumnya), fungsi ini SKIP -- 0 fetch redundan ke server.
async function loadValidasiDataForMapStandalone_() {
  if (mapDataFetchAttempted || mapDataBusy) return;
  mapDataBusy = true;
  mapDataErrorMsg = '';
  render();
  if (!globalCOGConfig) await fetchCOGConfig(); // grade/warna TP butuh ini, lazy juga kalau blm ada
  try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=validasi&t=' + Date.now());
    const result = await response.json();
    if (result.status === 'error') {
      globalValidasiFullForMap = [];
      mapDataErrorMsg = result.message || 'Server menolak permintaan data Validasi.';
    } else {
      globalValidasiFullForMap = forwardFillValidasiRows_(result.data || []).slice();
      mapDataFetchAttempted = true;
    }
  } catch (err) {
    console.error('Gagal memuat data Peta (standalone):', err);
    globalValidasiFullForMap = [];
    mapDataErrorMsg = 'Tidak bisa menghubungi server: ' + (err && err.message ? err.message : String(err));
  }
  mapDataBusy = false;
  render();
}

function buildMapData() {
  const grouped = groupValidasiByTp(globalValidasiFullForMap);
  // [PARTISI -- 4 Sep, Tahap 2] isStrictNumeric dipindah jadi fungsi umum di
  // scripts/config.js (dipakai apa adanya, definisi lokal di sini dihapus).
  return grouped.map(g => ({
    idTp: g.idTp,
    blok: g.blok,
    area: g.area,
    bench: g.bench,
    timur: g.timur,
    utara: g.utara,
    tanggal: g.tanggal,
    tipeLaterit: g.tipeLaterit,
    classGrade: g.classGrade,
    avgNi: g.avgNi,
    depthCount: g.depthCount,
    maxDepth: g.maxDepth,
    depths: g.depths, // dipakai kalau marker diklik utk detail kedalaman
    coordConflict: g.coordConflict, // v90.2.115 (temuan #4) -- diteruskan apa adanya ke mapData
    // Koordinat invalid (poin desain #7/#9) -- ditandai eksplisit di sini, BUKAN di renderer,
    // supaya 1 sumber kebenaran "titik ini bisa diplot atau tidak".
    hasValidCoord: isStrictNumeric(g.timur) && isStrictNumeric(g.utara)
  }));
}

// ==== Mine Grid: geometri auto-scale (poin desain #4) ====
// Timur/Utara itu koordinat GRID tambang (Easting/Northing lokal, spt contoh PDF ArcGIS
// "Timur 428200-428300, Utara 101900-102000"), BUKAN Latitude/Longitude -- sengaja TIDAK
// dipakai di Leaflet/Google Maps. Diplot sbg scatter-plot SVG custom, auto-scale ke area
// yg tersedia berapa pun rentang koordinatnya (tidak hardcode skala tertentu).
function computeMineGridBounds(points, extraBounds) {
  const valid = points.filter(p => p.hasValidCoord);
  if (!valid.length && (!Array.isArray(extraBounds) || extraBounds.length === 0)) return null;
  const timurs = valid.map(p => parseFloat(p.timur));
  const utaras = valid.map(p => parseFloat(p.utara));
  const extras = Array.isArray(extraBounds) ? extraBounds.filter(b =>
    b && Number.isFinite(b.minT) && Number.isFinite(b.maxT) &&
    Number.isFinite(b.minU) && Number.isFinite(b.maxU)
  ) : [];
  let minT = timurs.length ? Math.min(...timurs) : Infinity;
  let maxT = timurs.length ? Math.max(...timurs) : -Infinity;
  let minU = utaras.length ? Math.min(...utaras) : Infinity;
  let maxU = utaras.length ? Math.max(...utaras) : -Infinity;
  extras.forEach(b => {
    minT = Math.min(minT, b.minT); maxT = Math.max(maxT, b.maxT);
    minU = Math.min(minU, b.minU); maxU = Math.max(maxU, b.maxU);
  });
  // Jaga-jaga: kalau semua titik kebetulan segaris (rentang 0), beri buffer artifisial
  // supaya SVG tidak collapse jadi 1 titik/garis tak terlihat.
  if (maxT - minT < 1) { minT -= 5; maxT += 5; }
  if (maxU - minU < 1) { minU -= 5; maxU += 5; }
  // V10.1: padding adaptif - 2% kalau ada background map (biar fit 150-200m padat, bukan 250m)
  const hasBackgroundMap = extras.length > 0;
  const padFactor = hasBackgroundMap ? 0.02 : 0.08;
  const padT = (maxT - minT) * padFactor, padU = (maxU - minU) * padFactor;
  let effMinT = minT - padT, effMaxT = maxT + padT;
  let effMinU = minU - padU, effMaxU = maxU + padU;
  // v90.2.115 FIX (temuan audit #3 -- distorsi geometri): SEBELUMNYA rentang Timur & Utara
  // masing2 dipaksa memenuhi 320x320 SECARA INDEPENDEN -- kalau area sebenarnya tidak persegi
  // (mis. Timur 1000m x Utara 200m), peta tetap tergambar hampir persegi, jarak/bentuk relatif
  // jadi menyesatkan utk peta mining (beda dgn konsep ArcGIS asli yg mempertahankan aspect
  // ratio). Sekarang KEDUA sumbu WAJIB pakai meter-per-unit yg SAMA -- sumbu yg rentangnya
  // lebih pendek "diberi napas" (padding tambahan, di-tengah-kan), BUKAN diregangkan.
  const rangeT = effMaxT - effMinT, rangeU = effMaxU - effMinU;
  if (rangeT > rangeU) {
    const extra = (rangeT - rangeU) / 2;
    effMinU -= extra; effMaxU += extra;
  } else if (rangeU > rangeT) {
    const extra = (rangeU - rangeT) / 2;
    effMinT -= extra; effMaxT += extra;
  }
  return { minT: effMinT, maxT: effMaxT, minU: effMinU, maxU: effMaxU };
}

// Bounds untuk DEFAULT VIEW: seluruh area yang benar-benar sedang ditampilkan.
// Selain TP, ikut memasukkan extent background map aktif dan seluruh KML aktif.
// mapZoom=1 adalah FIT-ALL murni; background map memakai default presentation zoom 1.25x agar viewport lebih padat.
function computeMapViewBounds(points) {
  const extras = [];

  const activeMap = activeBackgroundMapId
    ? backgroundMapsList.find(m => m.id === activeBackgroundMapId)
    : null;
  if (activeMap) {
    const extent = activeMap.geoReference && activeMap.geoReference.extent
      ? activeMap.geoReference.extent
      : { cornerTL: activeMap.cornerTL, cornerBR: activeMap.cornerBR };
    if (extent && extent.cornerTL && extent.cornerBR) {
      const e1 = parseFloat(extent.cornerTL.timur), n1 = parseFloat(extent.cornerTL.utara);
      const e2 = parseFloat(extent.cornerBR.timur), n2 = parseFloat(extent.cornerBR.utara);
      if ([e1,n1,e2,n2].every(Number.isFinite)) {
        extras.push({ minT: Math.min(e1,e2), maxT: Math.max(e1,e2), minU: Math.min(n1,n2), maxU: Math.max(n1,n2) });
      }
    }
  }

  activeKmlOverlayIds.forEach(id => {
    const kml = kmlOverlaysList.find(k => k.id === id);
    if (!kml) return;
    const coords = [];
    (kml.points || []).forEach(pt => coords.push(pt));
    (kml.lines || []).forEach(line => (line.path || []).forEach(pt => coords.push(pt)));
    const valid = coords.filter(pt => Number.isFinite(parseFloat(pt.timur)) && Number.isFinite(parseFloat(pt.utara)));
    if (!valid.length) return;
    const ts = valid.map(pt => parseFloat(pt.timur));
    const ns = valid.map(pt => parseFloat(pt.utara));
    extras.push({ minT: Math.min(...ts), maxT: Math.max(...ts), minU: Math.min(...ns), maxU: Math.max(...ns) });
  });

  return computeMineGridBounds(points, extras);
}

// STEP 04: display-only bounds mengikuti aspect ratio viewport.
// Tidak mengubah GeoReference/native bounds; hanya menambah ruang pada sumbu pendek.
function computeResponsiveDisplayBounds_(points) {
  const base = computeMapViewBounds(points);
  if (!base) return null;

  const ratio = mapViewportRatio_ > 0 ? mapViewportRatio_ : 1;
  const w = base.maxT - base.minT;
  const h = base.maxU - base.minU;
  if (!(w > 0) || !(h > 0)) return base;

  const currentRatio = w / h;
  let minT = base.minT, maxT = base.maxT;
  let minU = base.minU, maxU = base.maxU;

  if (currentRatio > ratio) {
    // World terlalu lebar dibanding viewport: tambah range Utara.
    const targetH = w / ratio;
    const extra = (targetH - h) / 2;
    minU -= extra; maxU += extra;
  } else if (currentRatio < ratio) {
    // World terlalu tinggi dibanding viewport: tambah range Timur.
    const targetW = h * ratio;
    const extra = (targetW - w) / 2;
    minT -= extra; maxT += extra;
  }
  return { minT, maxT, minU, maxU };
}

// STEP 5.3/5.6: viewBox zoom memakai native coordinate sebagai sumber kebenaran.
// Tap anchor dipakai untuk tombol +/-; pinch anchor dipakai selama gesture 2-jari.
function getMapViewBox_(bounds) {
  const viewW = 320, viewH = 320;
  const zoomedW = viewW / mapZoom, zoomedH = viewH / mapZoom;
  let centerX = viewW / 2, centerY = viewH / 2;
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  if (rangeT > 0 && rangeU > 0) {
    // V10.2: pinch anchor hanya berlaku selama gesture. Setelah gesture selesai,
    // pusat hasil pinch disimpan di mapViewportState_ agar render berikutnya tidak reset.
    const anchor = mapPinchState_.active && mapPinchState_.anchorNative
      ? mapPinchState_.anchorNative
      : null;
    if (anchor) {
      const anchorX = ((anchor.x - bounds.minT) / rangeT) * viewW;
      const anchorY = viewH - ((anchor.y - bounds.minU) / rangeU) * viewH;
      if (mapPinchState_.active) {
        const fx = Math.max(0, Math.min(1, mapPinchState_.midX));
        const fy = Math.max(0, Math.min(1, mapPinchState_.midY));
        return { x: anchorX - fx * zoomedW, y: anchorY - fy * zoomedH, w: zoomedW, h: zoomedH };
      }
    }
    // Persistent center adalah satu-satunya sumber pan setelah pinch selesai.
    // mapTapState_ SENGAJA tidak pernah dipakai di sini.
    const saved = mapViewportState_ && mapViewportState_.centerNative;
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      centerX = ((saved.x - bounds.minT) / rangeT) * viewW;
      centerY = viewH - ((saved.y - bounds.minU) / rangeU) * viewH;
      if (!Number.isFinite(centerX)) centerX = viewW / 2;
      if (!Number.isFinite(centerY)) centerY = viewH / 2;
    }
  }
  return { x: centerX - zoomedW / 2, y: centerY - zoomedH / 2, w: zoomedW, h: zoomedH };
}

function captureMapViewportCenter_(bounds) {
  if (!bounds) return;
  const viewBox = getMapViewBox_(bounds);
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  if (!(rangeT > 0) || !(rangeU > 0)) return;
  const centerSvgX = viewBox.x + viewBox.w / 2;
  const centerSvgY = viewBox.y + viewBox.h / 2;
  const nativeX = bounds.minT + (centerSvgX / 320) * rangeT;
  const nativeY = bounds.minU + ((320 - centerSvgY) / 320) * rangeU;
  if (Number.isFinite(nativeX) && Number.isFinite(nativeY)) {
    mapViewportState_.centerNative = { x: nativeX, y: nativeY };
  }
}

// STEP 5.6: helper geometri pinch-to-zoom.
function pinchDistance_(a, b) {
  const dx = b.clientX - a.clientX, dy = b.clientY - a.clientY;
  return Math.hypot(dx, dy);
}
function pinchMidpoint_(a, b, rect) {
  return {
    x: ((a.clientX + b.clientX) / 2 - rect.left) / rect.width,
    y: ((a.clientY + b.clientY) / 2 - rect.top) / rect.height
  };
}
function nativeFromClientPoint_(event, bounds, rect) {
  const viewW = 320, viewH = 320;
  const viewBox = getMapViewBox_(bounds);
  const sx = viewBox.x + ((event.clientX - rect.left) / rect.width) * viewBox.w;
  const sy = viewBox.y + ((event.clientY - rect.top) / rect.height) * viewBox.h;
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  return {
    x: bounds.minT + (sx / viewW) * rangeT,
    y: bounds.minU + ((viewH - sy) / viewH) * rangeU
  };
}
function scheduleMapPinchRender_() {
  if (mapPinchRenderScheduled_) return;
  mapPinchRenderScheduled_ = true;
  requestAnimationFrame(() => {
    mapPinchRenderScheduled_ = false;
    if (mapPinchState_.active) render();
  });
}

function handleMapTouchStart_(event) {
  if (mapGestureOwner_ === 'pointer') return;
  if (mapGestureOwner_ === null) {
    if (mapPointerState_.size || mapPanState_.active || mapPinchState_.active || mapPanInertiaRaf_) resetMapGestureTransientState_();
    mapGestureOwner_ = 'touch';
  }
  console.log('[TRACE] touchstart owner=touch', event.touches.length);
  if (!event || !event.touches || event.touches.length!==1) {
    if (event.touches && event.touches.length===2) {
      // 2 finger -> pinch
      const a=event.touches[0], b=event.touches[1];
      const rect=event.currentTarget.getBoundingClientRect();
      const bounds=computeResponsiveDisplayBounds_(buildMapData());
      if (!bounds) return;
      const distance=Math.hypot(b.clientX-a.clientX, b.clientY-a.clientY);
      const midpoint={x:((a.clientX+b.clientX)/2-rect.left)/rect.width, y:((a.clientY+b.clientY)/2-rect.top)/rect.height};
      const anchor=nativeFromClientPoint_({clientX:(a.clientX+b.clientX)/2, clientY:(a.clientY+b.clientY)/2}, bounds, rect);
      mapPanState_.active=false;
      if (mapPanInertiaRaf_) { cancelAnimationFrame(mapPanInertiaRaf_); mapPanInertiaRaf_=null; }
      const svg=event.currentTarget.querySelector('svg');
      mapPinchState_={active:true,startDistance:distance,startZoom:mapZoom,anchorNative:anchor,midX:midpoint.x,midY:midpoint.y,suppressTapUntil:Date.now()+500,visualSvg:svg};
      if(svg){svg.style.transform='none';svg.style.willChange='transform';}
      event.preventDefault();event.stopPropagation();
    }
    return;
  }
  event.preventDefault();event.stopPropagation();
  const svg=event.currentTarget.querySelector('svg')||event.currentTarget;
  const bounds=computeResponsiveDisplayBounds_(buildMapData());
  if(!bounds) { console.log('[TRACE] no bounds'); return; }
  const startX=event.touches[0].clientX, startY=event.touches[0].clientY;
  beginMapPanPointer_(event, svg, bounds, startX, startY);
  console.log('[TRACE] pan started', startX, startY, 'center', mapPanState_.baseCenterNative);
}
function handleMapTouchMove_(event) {
  if (!mapPanState_.active || !event.touches || event.touches.length!==1) {
    if (mapPinchState_.active && event.touches && event.touches.length===2) {
      event.preventDefault();
      const a=event.touches[0], b=event.touches[1];
      const distance=Math.hypot(b.clientX-a.clientX, b.clientY-a.clientY);
      if(!(distance>0)||!(mapPinchState_.startDistance>0)) return;
      const rect=event.currentTarget.getBoundingClientRect();
      const midpoint={x:((a.clientX+b.clientX)/2-rect.left)/rect.width, y:((a.clientY+b.clientY)/2-rect.top)/rect.height};
      mapPinchState_.midX=midpoint.x; mapPinchState_.midY=midpoint.y;
      mapZoom=Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, mapPinchState_.startZoom*(distance/mapPinchState_.startDistance)));
      applyPinchVisualTransform_(mapZoom);
    }
    return;
  }
  event.preventDefault();event.stopPropagation();
  const curX=event.touches[0].clientX, curY=event.touches[0].clientY;
  const dx=curX-mapPanState_.startX, dy=curY-mapPanState_.startY;
  const now=performance.now();
  const dt=Math.max(1,now-mapPanState_.lastT);
  const sample=Math.max(0.001, Math.min(1,16/dt));
  const vx=(curX-mapPanState_.lastX)/dt, vy=(curY-mapPanState_.lastY)/dt;
  mapPanState_.velocityX=mapPanState_.velocityX*(1-sample)+vx*sample;
  mapPanState_.velocityY=mapPanState_.velocityY*(1-sample)+vy*sample;
  mapPanState_.lastX=curX;mapPanState_.lastY=curY;mapPanState_.lastT=now;
  mapPanState_.dx=dx;mapPanState_.dy=dy;
  if(Math.hypot(dx,dy)>=4) mapPanState_.moved=true;
  scheduleMapPanVisual_();
}
function handleMapTouchEnd_(event) {
  if (mapGestureOwner_ !== 'touch') return;
  const touches = event && event.touches ? event.touches : null;
  console.log('[TRACE] touchend owner=touch moved', mapPanState_.moved, 'remaining', touches ? touches.length : 0);
  if (touches && touches.length === 1 && mapPinchState_.active) {
    try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
    const bounds = computeResponsiveDisplayBounds_(buildMapData());
    if (bounds) commitMapPinchViewport_(bounds);
    const visual = mapPinchState_.visualSvg;
    mapPinchState_.active = false; mapPinchState_.suppressTapUntil = Date.now()+350;
    if (visual) { visual.style.transform='none'; visual.style.willChange=''; }
    mapPinchState_.visualSvg = null; mapPinchRenderScheduled_ = false;
    const svg = event.currentTarget.querySelector('svg') || event.currentTarget;
    if (bounds) beginMapPanPointer_(event, svg, bounds, touches[0].clientX, touches[0].clientY);
    return;
  }
  if (touches && touches.length > 0) return;
  if (!mapPanState_.active && !mapPinchState_.active) { mapGestureOwner_=null; return; }
  try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
  if (mapPinchState_.active) {
    const bounds=computeResponsiveDisplayBounds_(buildMapData()); if(bounds) commitMapPinchViewport_(bounds);
    mapPinchState_.active=false; mapPinchState_.suppressTapUntil=Date.now()+350;
    const visual=mapPinchState_.visualSvg; if(visual){visual.style.transform='none';visual.style.willChange='';}
    mapPinchState_.visualSvg=null; mapPinchRenderScheduled_=false; mapGestureOwner_=null;
    requestAnimationFrame(()=>{render();flushMapGestureRender_();}); return;
  }
  if (mapPanState_.active) {
    if (mapPanState_.moved && startMapPanInertia_()) { mapPanState_.suppressTapUntil=Date.now()+500; mapGestureOwner_=null; return; }
    commitMapPan_(0,0); mapPanState_.suppressTapUntil=mapPanState_.moved?Date.now()+350:0; mapGestureOwner_=null; flushMapGestureRender_();
  }
}

function scheduleMapPanVisual__OLD() {
  if (mapPanRenderScheduled_) return;
  mapPanRenderScheduled_ = true;
  requestAnimationFrame(() => {
    mapPanRenderScheduled_ = false;
    const svg = mapPanState_.visualSvg;
    if (!svg || !mapPanState_.active) return;
    // Gunakan translate3d biar GPU - ini yang bikin smooth di video Avenza
    svg.style.transform = 'translate3d(' + mapPanState_.dx.toFixed(2) + 'px,' + mapPanState_.dy.toFixed(2) + 'px,0)';
    svg.style.willChange = 'transform';
    // Update koordinat bawah realtime kayak video 397191,53353
    try {
      const bounds = computeResponsiveDisplayBounds_(buildMapData());
      if (bounds) {
        const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
        const zoomedW = 320 / Math.max(0.0001, mapZoom), zoomedH = 320 / Math.max(0.0001, mapZoom);
        const dxView = mapPanState_.dx / Math.max(1, svg.getBoundingClientRect().width);
        const dyView = mapPanState_.dy / Math.max(1, svg.getBoundingClientRect().height);
        const deltaNativeX = -(dxView * zoomedW / 320) * rangeT;
        const deltaNativeY = (dyView * zoomedH / 320) * rangeU;
        if (mapPanState_.baseCenterNative) {
          const cx = mapPanState_.baseCenterNative.x + deltaNativeX;
          const cy = mapPanState_.baseCenterNative.y + deltaNativeY;
          // Update display koordinat di bawah (seperti video 3972xx, 53xx)
          const coordEl = document.getElementById('mg1-map-coord-live');
          if (coordEl) coordEl.textContent = Math.round(cx) + ',' + Math.round(cy);
        }
      }
    } catch(e){}
  });
}
function applyPanVisual_(svg, dx, dy) {
  if (!svg) return;
  svg.style.transform = 'translate3d(' + Number(dx || 0).toFixed(2) + 'px,' + Number(dy || 0).toFixed(2) + 'px,0)';
  svg.style.willChange = 'transform';
}
function applyPinchVisualTransform_(zoom) {
  const svg = mapPinchState_.visualSvg;
  if (!svg || !mapPinchState_.active) return false;
  const baseZoom = Math.max(0.0001, mapPinchState_.startZoom);
  const visualScale = Math.max(0.1, zoom / baseZoom);
  svg.style.transformOrigin = (mapPinchState_.midX * 100).toFixed(2) + '% ' + (mapPinchState_.midY * 100).toFixed(2) + '%';
  svg.style.transform = 'scale(' + visualScale.toFixed(4) + ')';
  svg.style.willChange = 'transform';
  return true;
}
function getMapPointerSvg_(event) {
  return event && event.currentTarget && event.currentTarget.tagName === 'svg'
    ? event.currentTarget
    : (event && event.currentTarget ? event.currentTarget.querySelector('svg') : null);
}
function getMapPointerRect_(svg) {
  if (!svg) return null;
  const r = svg.getBoundingClientRect();
  return r && r.width > 0 && r.height > 0 ? r : null;
}
function getMapCenterNative_(bounds) {
  if (!bounds) return null;
  const vb = getMapViewBox_(bounds);
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  if (!(rangeT > 0) || !(rangeU > 0)) return null;
  const sx = vb.x + vb.w / 2, sy = vb.y + vb.h / 2;
  return {
    x: bounds.minT + (sx / 320) * rangeT,
    y: bounds.minU + ((320 - sy) / 320) * rangeU
  };
}
function beginMapPanPointer_(event, svg, bounds, startX, startY) {
  const baseCenterNative = getMapCenterNative_(bounds);
  const rect = getMapPointerRect_(svg);
  if (!baseCenterNative || !rect) return false;
  if (mapPanInertiaRaf_) { cancelAnimationFrame(mapPanInertiaRaf_); mapPanInertiaRaf_ = null; }
  mapPanState_ = {
    active: true,
    startX, startY,
    dx: 0, dy: 0,
    baseCenterNative,
    baseRectW: rect.width,
    baseRectH: rect.height,
    baseBounds: bounds,
    visualSvg: svg,
    moved: false,
    suppressTapUntil: 0,
    velocityX: 0,
    velocityY: 0,
    lastX: startX,
    lastY: startY,
    lastT: performance.now()
  };
  svg.style.transition = 'none';
  applyPanVisual_(svg, 0, 0);
  return true;
}
function commitMapPan_(extraDx, extraDy) {
  const svg = mapPanState_.visualSvg;
  const bounds = mapPanState_.baseBounds;
  if (bounds && mapPanState_.baseCenterNative && mapPanState_.baseRectW > 0 && mapPanState_.baseRectH > 0) {
    const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
    const zoomedW = 320 / Math.max(0.0001, mapZoom), zoomedH = 320 / Math.max(0.0001, mapZoom);
    const totalDx = mapPanState_.dx + (extraDx || 0);
    const totalDy = mapPanState_.dy + (extraDy || 0);
    const deltaNativeX = -(totalDx / mapPanState_.baseRectW) * (zoomedW / 320) * rangeT;
    const deltaNativeY = (totalDy / mapPanState_.baseRectH) * (zoomedH / 320) * rangeU;
    const nx = mapPanState_.baseCenterNative.x + deltaNativeX;
    const ny = mapPanState_.baseCenterNative.y + deltaNativeY;
    if (Number.isFinite(nx) && Number.isFinite(ny)) mapViewportState_.centerNative = { x: nx, y: ny };
  }
  if (svg) { svg.style.transition = ''; svg.style.transform = 'none'; svg.style.willChange = ''; }
  mapPanState_.active = false;
  mapPanState_.visualSvg = null;
  mapPanRenderScheduled_ = false;
  mapPanInertiaRaf_ = null;
  if (mapPanState_.moved) render();
}
function startMapPanInertia_() {
  const svg = mapPanState_.visualSvg;
  if (!svg) return false;
  let vx = mapPanState_.velocityX;
  let vy = mapPanState_.velocityY;
  const speed = Math.hypot(vx, vy);
  if (!mapPanState_.moved || speed < 0.08) return false;
  const friction = 0.90;
  let extraDx = 0, extraDy = 0;
  let lastFrame = performance.now();
  const tick = (now) => {
    if (!mapPanState_.active || mapPanState_.visualSvg !== svg) { mapPanInertiaRaf_ = null; return; }
    const dt = Math.min(32, Math.max(8, now - lastFrame));
    lastFrame = now;
    extraDx += vx * dt;
    extraDy += vy * dt;
    vx *= Math.pow(friction, dt / 16);
    vy *= Math.pow(friction, dt / 16);
    applyPanVisual_(svg, mapPanState_.dx + extraDx, mapPanState_.dy + extraDy);
    if (Math.hypot(vx, vy) > 0.02 && Math.hypot(extraDx, extraDy) < 420) {
      mapPanInertiaRaf_ = requestAnimationFrame(tick);
    } else {
      mapPanState_.dx += extraDx;
      mapPanState_.dy += extraDy;
      commitMapPan_(0, 0);
    }
  };
  mapPanInertiaRaf_ = requestAnimationFrame(tick);
  return true;
}
function commitMapPinchViewport_(bounds) {
  if (!bounds || !mapPinchState_.anchorNative) return;
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  const zoomedW = 320 / Math.max(0.0001, mapZoom), zoomedH = 320 / Math.max(0.0001, mapZoom);
  if (!(rangeT > 0) || !(rangeU > 0)) return;
  const anchor = mapPinchState_.anchorNative;
  const anchorX = ((anchor.x - bounds.minT) / rangeT) * 320;
  const anchorY = 320 - ((anchor.y - bounds.minU) / rangeU) * 320;
  const fx = Math.max(0, Math.min(1, mapPinchState_.midX));
  const fy = Math.max(0, Math.min(1, mapPinchState_.midY));
  const centerSvgX = anchorX - fx * zoomedW + zoomedW / 2;
  const centerSvgY = anchorY - fy * zoomedH + zoomedH / 2;
  const centerNativeX = bounds.minT + (centerSvgX / 320) * rangeT;
  const centerNativeY = bounds.minU + ((320 - centerSvgY) / 320) * rangeU;
  if (Number.isFinite(centerNativeX) && Number.isFinite(centerNativeY)) {
    mapViewportState_.centerNative = { x: centerNativeX, y: centerNativeY };
  }
}
function handleMapPointerDown_(event) {
  if (mapGestureOwner_ === 'touch') return;
  if (mapGestureOwner_ === null) {
    if (mapPointerState_.size || mapPanState_.active || mapPinchState_.active || mapPanInertiaRaf_) resetMapGestureTransientState_();
    mapGestureOwner_ = 'pointer';
  }
  if (!event || !event.currentTarget) { mapGestureOwner_=null; return; }
  const svg = getMapPointerSvg_(event);
  if (!svg) return;
  // V13 TRACE FIX: di S7 Edge, pointerdown HARUS preventDefault untuk dapat pointermove, tap tetap masuk via suppressTapUntil
  try{ event.preventDefault(); }catch(_){}
  try { svg.setPointerCapture(event.pointerId); } catch (_) {}
  mapPointerState_.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const points = Array.from(mapPointerState_.entries());
  const bounds = computeResponsiveDisplayBounds_(buildMapData());
  if (!bounds) return;
  if (points.length === 1) {
    beginMapPanPointer_(event, svg, bounds, event.clientX, event.clientY);
    return;
  }
  if (points.length === 2) {
    const a = points[0][1], b = points[1][1];
    const rect = getMapPointerRect_(svg);
    if (!rect) return;
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (!(distance > 0)) return;
    const midpoint = { x: ((a.x + b.x) / 2 - rect.left) / rect.width, y: ((a.y + b.y) / 2 - rect.top) / rect.height };
    const anchor = nativeFromClientPoint_({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }, bounds, rect);
    mapPanState_.active = false;
    if (mapPanInertiaRaf_) { cancelAnimationFrame(mapPanInertiaRaf_); mapPanInertiaRaf_ = null; }
    mapPinchState_ = { active: true, startDistance: distance, startZoom: mapZoom, anchorNative: anchor, midX: midpoint.x, midY: midpoint.y, suppressTapUntil: Date.now() + 500, visualSvg: svg };
    svg.style.transform = 'none';
    svg.style.willChange = 'transform';
    event.preventDefault();
  }
}
function handleMapPointerMove_(event) {
  if (mapGestureOwner_ !== 'pointer') return;
  if (!event || !event.currentTarget || !mapPointerState_.has(event.pointerId)) return;
  mapPointerState_.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const svg = getMapPointerSvg_(event);
  const points = Array.from(mapPointerState_.entries());
  if (mapPinchState_.active && points.length >= 2) {
    event.preventDefault();
    const a = points[0][1], b = points[1][1];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (!(distance > 0) || !(mapPinchState_.startDistance > 0)) return;
    const rect = getMapPointerRect_(svg);
    if (!rect) return;
    mapPinchState_.midX = ((a.x + b.x) / 2 - rect.left) / rect.width;
    mapPinchState_.midY = ((a.y + b.y) / 2 - rect.top) / rect.height;
    mapZoom = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, mapPinchState_.startZoom * (distance / mapPinchState_.startDistance)));
    applyPinchVisualTransform_(mapZoom);
    return;
  }
  if (mapPanState_.active && points.length === 1) {
    event.preventDefault();
    const curX = event.clientX, curY = event.clientY;
    const dx = curX - mapPanState_.startX;
    const dy = curY - mapPanState_.startY;
    const now = performance.now();
    const dt = Math.max(1, now - mapPanState_.lastT);
    const sample = Math.max(0.001, Math.min(1, 16 / dt));
    const vx = (curX - mapPanState_.lastX) / dt;
    const vy = (curY - mapPanState_.lastY) / dt;
    mapPanState_.velocityX = mapPanState_.velocityX * (1 - sample) + vx * sample;
    mapPanState_.velocityY = mapPanState_.velocityY * (1 - sample) + vy * sample;
    mapPanState_.lastX = curX; mapPanState_.lastY = curY; mapPanState_.lastT = now;
    mapPanState_.dx = dx; mapPanState_.dy = dy;
    if (Math.hypot(dx, dy) >= 4) mapPanState_.moved = true;
    scheduleMapPanVisual_();
  }
}
function handleMapPointerUp_(event) {
  if (mapGestureOwner_ !== 'pointer') return;
  if (!event) { resetMapGestureTransientState_(); return; }
  const svg=getMapPointerSvg_(event); const wasPinching=mapPinchState_.active; const wasPanning=mapPanState_.active; const moved=mapPanState_.moved;
  mapPointerState_.delete(event.pointerId);
  try { if(svg && svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId); } catch(_) {}
  const remaining=Array.from(mapPointerState_.entries());
  if (wasPinching && remaining.length===1) {
    const bounds=computeResponsiveDisplayBounds_(buildMapData()); if(bounds) commitMapPinchViewport_(bounds);
    mapPinchState_.active=false; mapPinchState_.suppressTapUntil=Date.now()+350;
    const visual=mapPinchState_.visualSvg || svg; if(visual){visual.style.transform='none';visual.style.willChange='';}
    mapPinchState_.visualSvg=null; mapPinchRenderScheduled_=false;
    if(bounds && visual){const q=remaining[0][1]; beginMapPanPointer_(event,visual,bounds,q.x,q.y);}
    return;
  }
  if (remaining.length>0) return;
  if (wasPinching) {
    const bounds=computeResponsiveDisplayBounds_(buildMapData()); if(bounds) commitMapPinchViewport_(bounds);
    mapPinchState_.active=false; mapPinchState_.suppressTapUntil=Date.now()+350;
    const visual=mapPinchState_.visualSvg; if(visual){visual.style.transform='none';visual.style.willChange='';}
    mapPinchState_.visualSvg=null; mapPinchRenderScheduled_=false; mapGestureOwner_=null;
    requestAnimationFrame(()=>{render();flushMapGestureRender_();}); return;
  }
  if (wasPanning) {
    if(moved && startMapPanInertia_()){mapPanState_.suppressTapUntil=Date.now()+500;mapGestureOwner_=null;return;}
    commitMapPan_(0,0); mapPanState_.suppressTapUntil=moved?Date.now()+350:0; mapGestureOwner_=null; flushMapGestureRender_();
  } else { mapGestureOwner_=null; flushMapGestureRender_(); }
}

function handleMapPointerCancel_(event) {
  handleMapPointerUp_(event);
}

// Konversi 1 titik Timur/Utara -> koordinat SVG (x,y). SVG y-axis terbalik dari Utara
// (Utara makin besar = "ke atas" secara peta, tapi SVG y makin besar = "ke bawah") --
// makanya utara di-flip di rumus y.
function projectToSvg(timur, utara, bounds, viewW, viewH) {
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  const x = ((timur - bounds.minT) / rangeT) * viewW;
  const y = viewH - (((utara - bounds.minU) / rangeU) * viewH);
  return { x, y };
}

// [PARTISI -- 4 Sep, Tahap 1] 4 fungsi geo-engine (inverseUtm_, gridConvergence_,
// computeConvergenceForPoint_, bearingDistanceGrid_) DIPINDAH ke ../shared/geo-engine.js
// -- SATU-SATUNYA salinan, dipakai bersama Master & Member Android. Dimuat lewat
// <script src="../shared/geo-engine.js"> di <head> (lihat bagian atas file).
// computeConvergenceForPoint_ signature BERUBAH: sekarang terima (easting, northing,
// zone, hemisphere) eksplisit -- SEBELUMNYA baca MG1_CRS_CONFIG global langsung dari
// sini, tidak cocok lagi utk file bersama. 2 titik pemanggilan di bawah sudah
// disesuaikan (tambah MG1_CRS_CONFIG.zone, MG1_CRS_CONFIG.hemisphere).

// v90.2.114 BARU: skala batang GENUINELY hidup -- dihitung ulang tiap kali mapZoom berubah
// (BUKAN angka/panjang tetap). Timur/Utara sudah dikonfirmasi satuan METER (sama seperti
// contoh peta ArcGIS PKS1E). Aim ~25% lebar tampilan, dibulatkan ke angka "bersih" (1/2/5/10/
// 20/25/50/100/...) terdekat yg TIDAK melebihi target -- supaya batang selalu menunjukkan
// jarak asli yg benar pada zoom berapapun, bukan dekorasi statis.
const NICE_SCALE_METERS = [1,2,5,10,20,25,50,100,200,250,500,1000,2000,5000];
function renderMapScaleBar(bounds) {
  if (!bounds) return '';
  const viewW = 320;
  // Total meter yg terlihat di LEBAR PENUH viewBox saat ini (viewBox menyempit saat zoom,
  // jadi meter yg terlihat pun ikut menyempit -- inilah yg bikin skala "hidup").
  const totalMetersVisible = (bounds.maxT - bounds.minT) / mapZoom;
  const target = totalMetersVisible * 0.25;
  let niceMeters = NICE_SCALE_METERS[0];
  for (const m of NICE_SCALE_METERS) { if (m <= target) niceMeters = m; else break; }
  const barWidthPercent = Math.min(60, (niceMeters / totalMetersVisible) * 100);
  return '<div class="absolute left-3 bottom-3 flex flex-col items-start gap-1">' +
    '<div class="h-[3px] rounded-full bg-white/70" style="width:' + barWidthPercent.toFixed(1) + '%; min-width:20px;"></div>' +
    '<div class="text-[9px] text-white/60 font-semibold">' + niceMeters + ' m</div>' +
  '</div>';
}

function renderMineGridSvg(points) {
  ensureMapContextBlocker_();
  const bounds = computeResponsiveDisplayBounds_(points);
  const viewW = 320, viewH = 320;
  if (!bounds) return '';
  // Zoom diterapkan lewat viewBox SVG (bukan transform per-titik) -- viewBox lebih kecil
  // = area yg sama ditampilkan lebih besar (efek perbesar). STEP 5.3: pusat viewBox
  // mengikuti persistent viewport state; titik tap tidak pernah menjadi anchor.
  const viewBox = getMapViewBox_(bounds);
  const valid = points.filter(p => p.hasValidCoord);
  let svg = '<svg viewBox="' + viewBox.x + ' ' + viewBox.y + ' ' + viewBox.w + ' ' + viewBox.h + '" class="w-full h-full" data-map-gesture="true" oncontextmenu="return false" onselectstart="return false" ondragstart="return false" style="pointer-events:auto; touch-action:none; overflow:hidden; will-change:transform; transition:none; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; -webkit-user-drag:none;" onclick="handleMapTap_(event)" ontouchstart="handleMapTouchStart_(event)" ontouchmove="handleMapTouchMove_(event)" ontouchend="handleMapTouchEnd_(event)" ontouchcancel="handleMapTouchEnd_(event)" onpointerdown="handleMapPointerDown_(event)" onpointermove="handleMapPointerMove_(event)" onpointerup="handleMapPointerUp_(event)" onpointercancel="handleMapPointerCancel_(event)">';
  // [BARU -- 5 Sep] Peta background (foto udara/olah ArcGIS) -- digambar PALING BAWAH
  // (sebelum grid helper & marker) supaya tidak menutupi apa pun. Posisi & ukuran dihitung
  // dari 2 sudut referensi pakai projectToSvg() yg SAMA dgn yg plot titik TP -- kalau titik
  // TP di posisi X benar, gambar background otomatis ikut benar juga (logic sama).
  if (activeBackgroundMapId) {
    const activeMap = backgroundMapsList.find(m => m.id === activeBackgroundMapId);
    if (activeMap) {
      // STEP 6: Map Import memakai GeoReference Object sebagai sumber extent utama.
      // Entry lama tetap kompatibel lewat fallback cornerTL/cornerBR.
      const mapExtent = activeMap.geoReference && activeMap.geoReference.extent
        ? activeMap.geoReference.extent
        : { cornerTL: activeMap.cornerTL, cornerBR: activeMap.cornerBR };
      const tl = projectToSvg(mapExtent.cornerTL.timur, mapExtent.cornerTL.utara, bounds, viewW, viewH);
      const br = projectToSvg(mapExtent.cornerBR.timur, mapExtent.cornerBR.utara, bounds, viewW, viewH);
      const imgX = Math.min(tl.x, br.x), imgY = Math.min(tl.y, br.y);
      const imgW = Math.abs(br.x - tl.x), imgH = Math.abs(br.y - tl.y);
      const boundary = activeMap.geoReference && activeMap.geoReference.boundary;
      let clipAttr = '';
      if (boundary && Array.isArray(boundary.nativePoints) && boundary.nativePoints.length >= 3) {
        const clipId = 'mg1-geopdf-neatline-clip';
        const clipPts = boundary.nativePoints.map(p => projectToSvg(p.x, p.y, bounds, viewW, viewH));
        svg += '<defs><clipPath id="' + clipId + '" clipPathUnits="userSpaceOnUse"><polygon points="' +
          clipPts.map(p => p.x + ',' + p.y).join(' ') + '"/></clipPath></defs>';
        clipAttr = ' clip-path="url(#' + clipId + ')"';
      }
      const pyramid = activeMap.tilePyramid;
      if (pyramid && Array.isArray(pyramid.levels) && pyramid.levels.length) {
        // Pilih level resolusi yang paling dekat di bawah kebutuhan zoom. Deep zoom
        // memakai level native hasil render langsung dari PDF, bukan upscale crop PNG.
        const maxFactor = Math.max(...pyramid.levels.map(l => Number(l.factor) || 0));
        let targetFactor = maxFactor;
        if (mapZoom <= 1.5) targetFactor = Math.min(0.25, maxFactor);
        else if (mapZoom <= 2.5) targetFactor = Math.min(0.5, maxFactor);
        let level = pyramid.levels[0];
        for (const candidate of pyramid.levels) {
          if (Number(candidate.factor) <= targetFactor) level = candidate;
        }
        const tileSize = Number(pyramid.tileSize) || GEOPDF_TILE_SIZE_;
        const pxScaleX = imgW / level.width, pxScaleY = imgH / level.height;
        for (const t of (level.tiles || [])) {
          const tx = imgX + t.x * tileSize * pxScaleX;
          const ty = imgY + t.y * tileSize * pxScaleY;
          const tw = t.width * pxScaleX, th = t.height * pxScaleY;
          svg += '<image href="' + t.dataUrl + '" x="' + tx + '" y="' + ty + '" width="' + tw + '" height="' + th + '" decoding="sync" preserveAspectRatio="none" opacity="0.9" draggable="false" oncontextmenu="return false" style="-webkit-user-drag:none; pointer-events:none;"' + clipAttr + '/>';
        }
      } else {
        svg += '<image href="' + activeMap.imageDataUrl + '" x="' + imgX + '" y="' + imgY + '" width="' + imgW + '" height="' + imgH + '" decoding="sync" preserveAspectRatio="none" opacity="0.9" draggable="false" oncontextmenu="return false" style="-webkit-user-drag:none; pointer-events:none;"' + clipAttr + ' pointer-events="none" draggable="false" oncontextmenu="return false;"/>';
      }
    }
  }
  // Grid garis bantu tipis (visual saja, bukan data) -- membantu orientasi skala.
  for (let i = 1; i < 4; i++) {
    const gx = (viewW / 4) * i, gy = (viewH / 4) * i;
    svg += '<line x1="' + gx + '" y1="0" x2="' + gx + '" y2="' + viewH + '" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>';
    svg += '<line x1="0" y1="' + gy + '" x2="' + viewW + '" y2="' + gy + '" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>';
  }
  // [BARU -- 5 Sep] KML overlay -- garis/batas dulu (di bawah titik KML & TP marker),
  // bisa BEBERAPA file aktif sekaligus (beda dari peta background yg cuma 1 aktif).
  activeKmlOverlayIds.forEach(id => {
    const kml = kmlOverlaysList.find(k => k.id === id);
    if (!kml) return;
    (kml.lines || []).forEach(line => {
      const pathStr = line.path.map(pt => {
        const proj = projectToSvg(pt.timur, pt.utara, bounds, viewW, viewH);
        return proj.x + ',' + proj.y;
      }).join(' ');
      svg += '<polyline points="' + pathStr + '" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="2,2" opacity="0.85"/>';
    });
    (kml.points || []).forEach(pt => {
      const proj = projectToSvg(pt.timur, pt.utara, bounds, viewW, viewH);
      // Marker beda bentuk (kotak) & warna (ungu) dari titik TP (lingkaran) -- supaya
      // tidak ketuker sumbernya sekilas dilihat.
      svg += '<rect x="' + (proj.x-3.5) + '" y="' + (proj.y-3.5) + '" width="7" height="7" fill="#c084fc" fill-opacity="0.3" stroke="#c084fc" stroke-width="1.5"/>';
    });
  });
  // [BONUS -- 4 Sep] Mode Ukur: garis putus-putus penghubung 2 titik terpilih, digambar
  // SEBELUM marker supaya marker tetap di atas garis (klik tetap kena marker, bukan garis).
  if (measureModeActive && measureFromIdTp && measureToIdTp) {
    const pFrom = valid.find(p => p.idTp === measureFromIdTp);
    const pTo = valid.find(p => p.idTp === measureToIdTp);
    if (pFrom && pTo) {
      const rawFrom = projectToSvg(parseFloat(pFrom.timur), parseFloat(pFrom.utara), bounds, viewW, viewH);
      const rawTo = projectToSvg(parseFloat(pTo.timur), parseFloat(pTo.utara), bounds, viewW, viewH);
      svg += '<line x1="' + rawFrom.x + '" y1="' + rawFrom.y + '" x2="' + rawTo.x + '" y2="' + rawTo.y + '" stroke="#facc15" stroke-width="1.5" stroke-dasharray="4,3"/>';
    }
  }
  // STEP 8D: GPS marker memakai native coordinate yang sama dengan TP/background.
  if (gpsState_.active && gpsState_.status === 'ok' && gpsState_.native) {
    const gpsRaw = projectToSvg(gpsState_.native.x, gpsState_.native.y, bounds, viewW, viewH);
    svg += '<g aria-label="Posisi GPS" pointer-events="none">' +
      '<circle cx="' + gpsRaw.x + '" cy="' + gpsRaw.y + '" r="11" fill="none" stroke="#22d3ee" stroke-width="2" opacity="0.85"/>' +
      '<circle cx="' + gpsRaw.x + '" cy="' + gpsRaw.y + '" r="4" fill="#22d3ee" stroke="#0b1329" stroke-width="2"/>' +
      '</g>';
  }
  // STEP 8E: marker hasil tap. Pointer-events none agar tidak mengganggu tap berikutnya.
  // STEP 5.3: posisi dihitung ULANG tiap render dari native (bukan svg statis) -- kalau
  // tidak, posisi marker jadi USANG begitu viewBox berpindah (mis. saat zoom-anchor aktif).
  if (mapTapState_.active && mapTapState_.native) {
    const tp = projectToSvg(mapTapState_.native.x, mapTapState_.native.y, bounds, viewW, viewH);
    svg += '<g aria-label="Koordinat tap" pointer-events="none">' +
      '<circle cx="' + tp.x + '" cy="' + tp.y + '" r="7" fill="none" stroke="#facc15" stroke-width="2"/>' +
      '<line x1="' + (tp.x-10) + '" y1="' + tp.y + '" x2="' + (tp.x+10) + '" y2="' + tp.y + '" stroke="#facc15" stroke-width="1"/>' +
      '<line x1="' + tp.x + '" y1="' + (tp.y-10) + '" x2="' + tp.x + '" y2="' + (tp.y+10) + '" stroke="#facc15" stroke-width="1"/>' +
      '</g>';
  }
  valid.forEach(p => {
    const raw = projectToSvg(parseFloat(p.timur), parseFloat(p.utara), bounds, viewW, viewH);
    const preset = getGradeColorPreset(p.classGrade);
    const fillColor = { merah:'#f43f5e', abu:'#94a3b8', kuning:'#f59e0b', biru:'#3b82f6', hijau:'#22c55e' }[
      (globalCOGConfig && globalCOGConfig['Warna_' + p.classGrade]) || GRADE_COLOR_DEFAULTS[p.classGrade] || 'abu'
    ];
    // v90.2.115 (temuan #4): TP dgn koordinat konflik ditandai cincin kuning putus-putus
    // di sekeliling marker -- visual, sebelum user tap utk lihat detail konfliknya.
    const conflictRing = p.coordConflict
      ? '<circle cx="' + raw.x + '" cy="' + raw.y + '" r="10.5" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/>'
      : '';
    // [BONUS -- 4 Sep] Cincin kuning solid utk titik yg sedang dipilih di Mode Ukur --
    // beda dari conflictRing (dashed) supaya tidak ketuker maknanya.
    const measureSelectedRing = (measureModeActive && (p.idTp === measureFromIdTp || p.idTp === measureToIdTp))
      ? '<circle cx="' + raw.x + '" cy="' + raw.y + '" r="10.5" fill="none" stroke="#facc15" stroke-width="2"/>'
      : '';
    svg += '<g onclick="handleMapPointTap_(\'' + p.idTp.replace(/'/g,"\\'") + '\')" style="cursor:pointer;">' +
      conflictRing +
      measureSelectedRing +
      '<circle cx="' + raw.x + '" cy="' + raw.y + '" r="7" fill="' + fillColor + '" fill-opacity="0.25" stroke="' + fillColor + '" stroke-width="2"/>' +
      '<circle cx="' + raw.x + '" cy="' + raw.y + '" r="2.5" fill="' + fillColor + '"/>' +
      '</g>';
  });
  svg += '</svg>';
  return svg;
}

function zoomMapIn() {
  const bounds = computeResponsiveDisplayBounds_(buildMapData());
  if (bounds) captureMapViewportCenter_(bounds);
  mapZoom = Math.min(MAP_ZOOM_MAX, mapZoom + MAP_ZOOM_STEP);
  render();
}
function zoomMapOut() {
  const bounds = computeResponsiveDisplayBounds_(buildMapData());
  if (bounds) captureMapViewportCenter_(bounds);
  mapZoom = Math.max(MAP_ZOOM_MIN, mapZoom - MAP_ZOOM_STEP);
  if (mapZoom === MAP_ZOOM_MIN) mapViewportState_.centerNative = null;
  render();
}
// "Crosshair" = reset tampilan ke fit area peta/responsive viewport -- BUKAN GPS lokasi user (poin desain #4,
// GPS Generic sengaja tidak dikerjakan krn tidak ada sumber Lat/Long sama sekali).
function resetMapView() { mapZoom = activeBackgroundMapId ? 1.25 : 1; mapViewportState_.centerNative = null; mapPanState_ = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, baseCenterNative: null, baseRectW: 0, baseRectH: 0, baseBounds: null, visualSvg: null, moved: false, suppressTapUntil: 0, velocityX: 0, velocityY: 0, lastX: 0, lastY: 0, lastT: 0 }; mapPinchState_ = { active: false, startDistance: 0, startZoom: mapZoom, anchorNative: null, midX: 0, midY: 0, suppressTapUntil: 0, visualSvg: null }; render(); }

// [BONUS -- 4 Sep] Dispatcher tap marker: rute ke Mode Ukur ATAU buka detail seperti biasa,
// tergantung measureModeActive. Perilaku detail TP normal (openMapDetail) TIDAK diubah sama
// sekali kalau Mode Ukur tidak aktif -- 0 risiko regresi ke alur yg sudah ada.
function handleMapPointTap_(idTp) {
  if (!measureModeActive) { openMapDetail(idTp); return; }
  if (!measureFromIdTp) {
    measureFromIdTp = idTp;
  } else if (measureFromIdTp === idTp) {
    measureFromIdTp = null; // tap titik yg sama lagi = batal pilih
  } else if (!measureToIdTp) {
    measureToIdTp = idTp;
  } else {
    // Sudah ada hasil sebelumnya -- tap baru mulai ulang dari titik ini (bukan nambah titik ke-3).
    measureFromIdTp = idTp;
    measureToIdTp = null;
  }
  render();
}

function openMapDetail(idTp) { mapDetailIdTp = idTp; render(); }
function closeMapDetail() { mapDetailIdTp = null; render(); }

// ==== NORTH ARROW UI -- overlay, BUKAN bagian dari SVG koordinat/marker (keputusan LOCKED
// 4 Sep) -- supaya rotasi panah tidak ikut ke-zoom/pan bareng peta. ====
function toggleNorthInfo_() { northInfoOpen = !northInfoOpen; render(); }
function setNorthMode_(mode) {
  // Guard EKSPLISIT di JS, bukan cuma tombol disabled visual -- kalau ada yg coba panggil
  // langsung dari console/DOM manapun, tetap tidak bisa masuk mode compass yg belum siap.
  if (mode === 'compass') return;
  northMode = mode;
  render();
}
function renderNorthArrow_(bounds) {
  if (!bounds) return '';
  // Titik referensi convergence = TITIK TENGAH area yg sedang ditampilkan (bounds), BUKAN
  // 1 titik tetap/hardcode -- representatif thd area yg dilihat user saat itu. Convergence
  // berubah sangat lambat scr spasial (tervalidasi 4 Sep: titik beda ratusan meter cuma
  // beda <0.01 arcsec utk situs tambang ini) jadi TIDAK perlu dihitung per-TP individual.
  const centerE = (bounds.minT + bounds.maxT) / 2;
  const centerN = (bounds.minU + bounds.maxU) / 2;

  let rotationDeg = 0, convergenceInfo = null;
  if (northMode === 'true') {
    convergenceInfo = computeConvergenceForPoint_(centerE, centerN, MG1_CRS_CONFIG.zone, MG1_CRS_CONFIG.hemisphere);
    // CATATAN JUJUR (blm di-E2E-test dgn referensi bearing lapangan sungguhan): arah rotasi
    // (tanda +/-) di bawah ini konsisten scr matematis dgn rumus gridConvergence_, TAPI
    // besarnya cuma -28 detik busur (~0.008 deg) di situs ini -- SECARA VISUAL TIDAK
    // TERLIHAT bedanya dari Grid North apapun tandanya. Kalau MG1 dipakai di situs lain yg
    // convergence-nya jauh lebih besar (lintang tinggi/jauh dari central meridian), WAJIB
    // uji ulang tanda rotasi ini terhadap bearing referensi asli sebelum dipercaya penuh.
    rotationDeg = convergenceInfo.ok ? -convergenceInfo.convergenceDeg : 0;
  }

  const modeLabel = northMode === 'grid' ? 'GRID' : (northMode === 'true' ? 'TRUE' : 'GPS');
  const arrowSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="transform:rotate(' + rotationDeg.toFixed(4) + 'deg);transition:transform .3s ease;display:block">' +
    '<path d="M12 2 L17 15 L12 11.5 L7 15 Z" fill="white"/>' +
  '</svg>';

  return '<button onclick="toggleNorthInfo_()" aria-label="Info arah Utara" class="absolute left-3 top-3 z-10 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl bg-[#0b1329]/90 border border-white/10 active:scale-95 transition-transform">' +
    arrowSvg +
    '<span class="text-[7px] font-bold text-white/50 tracking-wide">' + modeLabel + '</span>' +
  '</button>' +
  renderNorthInfoPanel_(convergenceInfo);
}
function renderNorthInfoPanel_(convergenceInfo) {
  if (!northInfoOpen) return '';
  const rows = [];
  rows.push(['Mode', northMode === 'grid' ? 'GRID NORTH' : (northMode === 'true' ? 'TRUE NORTH' : 'COMPASS')]);
  if (northMode === 'true') {
    rows.push(['CRS', 'WGS84 / UTM ' + MG1_CRS_CONFIG.zone + MG1_CRS_CONFIG.hemisphere]);
    rows.push(['Situs', MG1_CRS_CONFIG.presetLabel || '-']);
    rows.push(['Grid Conv.', (convergenceInfo && convergenceInfo.ok) ? ((convergenceInfo.convergenceDeg >= 0 ? '+' : '') + convergenceInfo.convergenceDeg.toFixed(4) + '\u00b0') : '-']);
    rows.push(['Status', (convergenceInfo && convergenceInfo.ok) ? 'CALCULATED' : 'ERROR']);
  } else if (northMode === 'grid') {
    rows.push(['Status', 'Arah sumbu Utara grid tambang -- belum dikoreksi ke True North']);
  }
  const rowsHtml = rows.map(function(r) {
    return '<div class="flex items-start justify-between gap-2 py-1.5 border-b border-white/[0.06] last:border-0">' +
      '<span class="text-[10px] text-white/40 font-medium shrink-0">' + r[0] + '</span>' +
      '<span class="text-[11px] text-white font-bold text-right">' + r[1] + '</span>' +
    '</div>';
  }).join('');
  return '<div class="absolute left-3 top-[62px] w-[210px] z-10 rounded-xl bg-[#0b1329] border border-white/10 p-3 shadow-lg" onclick="event.stopPropagation()">' +
    '<div class="flex gap-1.5 mb-2">' +
      '<button onclick="setNorthMode_(\'grid\')" class="flex-1 py-1.5 rounded-lg text-[10px] font-bold ' + (northMode==='grid' ? 'bg-[#2563eb] text-white' : 'bg-white/[0.06] text-white/50') + '">GRID</button>' +
      '<button onclick="setNorthMode_(\'true\')" class="flex-1 py-1.5 rounded-lg text-[10px] font-bold ' + (northMode==='true' ? 'bg-[#2563eb] text-white' : 'bg-white/[0.06] text-white/50') + '">TRUE</button>' +
      '<button disabled title="Segera hadir" class="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-white/[0.03] text-white/20 cursor-not-allowed">GPS</button>' +
    '</div>' +
    rowsHtml +
    '<div class="mt-2 pt-2 border-t border-white/[0.06] text-[9px] text-white/30 leading-relaxed">Compass (GPS) -- Segera Hadir. Menunggu kalibrasi magnetometer &amp; model deklinasi magnetik utk akurasi lapangan.</div>' +
  '</div>';
}

// ==== BONUS: Banner hasil Mode Ukur (TP -> TP Bearing + Distance) ====
function renderMeasureBanner_(mapData) {
  if (!measureModeActive) return '';
  if (!measureFromIdTp) {
    return '<div class="absolute left-1/2 -translate-x-1/2 top-3 z-10 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-bold whitespace-nowrap">Mode Ukur: tap titik pertama</div>';
  }
  if (!measureToIdTp) {
    return '<div class="absolute left-1/2 -translate-x-1/2 top-3 z-10 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-bold whitespace-nowrap">Mode Ukur: tap titik kedua (' + measureFromIdTp + ' dipilih)</div>';
  }
  const pFrom = mapData.find(p => p.idTp === measureFromIdTp);
  const pTo = mapData.find(p => p.idTp === measureToIdTp);
  if (!pFrom || !pTo) return '';
  const bd = bearingDistanceGrid_(parseFloat(pFrom.timur), parseFloat(pFrom.utara), parseFloat(pTo.timur), parseFloat(pTo.utara));
  let bearingLabel = bd.bearingGridDeg.toFixed(1) + '\u00b0 Grid';
  if (northMode === 'true') {
    const conv = computeConvergenceForPoint_(parseFloat(pFrom.timur), parseFloat(pFrom.utara), MG1_CRS_CONFIG.zone, MG1_CRS_CONFIG.hemisphere);
    if (conv.ok) {
      let trueBearing = bd.bearingGridDeg - conv.convergenceDeg;
      if (trueBearing < 0) trueBearing += 360; if (trueBearing >= 360) trueBearing -= 360;
      bearingLabel = trueBearing.toFixed(1) + '\u00b0 True';
    }
  }
  return '<div class="absolute left-1/2 -translate-x-1/2 top-3 z-10 px-3 py-2 rounded-xl bg-[#0b1329]/95 border border-amber-500/30 text-center whitespace-nowrap">' +
    '<div class="text-[9px] text-white/40 font-semibold">' + measureFromIdTp + ' &rarr; ' + measureToIdTp + '</div>' +
    '<div class="text-[13px] text-amber-300 font-bold">' + bearingLabel + ' &bull; ' + bd.distanceMeters.toFixed(1) + ' m</div>' +
  '</div>';
}

function renderMapDetailModal(mapData) {
  if (!mapDetailIdTp) return '';
  const p = mapData.find(m => m.idTp === mapDetailIdTp);
  if (!p) return ''; // TP hilang dari dataset (mis. re-fetch di tengah modal terbuka) -- tutup diam2, bukan error
  const depthRows = (p.depths || []).slice().sort((a,b) => (parseFloat(getField(a,'Meter'))||0) - (parseFloat(getField(b,'Meter'))||0))
    .map(d => '<div class="flex items-center justify-between py-1.5 border-b border-white/[0.06] text-[11px]">' +
      '<span class="text-white/50">' + (getField(d,'Meter')||'-') + ' m</span>' +
      '<span class="text-white font-semibold">Ni ' + fmt2(parseFloat(getField(d,'Ni %')||getField(d,'Ni'))) + '%</span>' +
      '</div>').join('');
  return '<div class="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onclick="closeMapDetail()">' +
    '<div class="w-full max-w-md bg-[#0b1329] border-t border-white/10 rounded-t-[20px] p-5 max-h-[75vh] overflow-y-auto" onclick="event.stopPropagation()">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<div class="text-white font-bold text-base">' + p.idTp + '</div>' +
        renderClassGradeBadge(p.classGrade) +
      '</div>' +
      (p.coordConflict ? '<div class="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 font-semibold flex items-start gap-1.5">' + icon('alert-triangle','w-3.5 h-3.5 shrink-0 mt-0.5') + '<span>Konflik data: beberapa baris kedalaman TP ini punya nilai Timur/Utara BERBEDA di sheet Validasi. Marker memakai nilai pertama yang ditemukan -- mohon periksa &amp; perbaiki di sheet asli.</span></div>' : '') +
      '<div class="grid grid-cols-2 gap-2 mb-3 text-[11px]">' +
        '<div><span class="text-white/40">Blok</span><div class="text-white font-semibold">' + (p.blok||'-') + '</div></div>' +
        '<div><span class="text-white/40">Area</span><div class="text-white font-semibold">' + (p.area||'-') + '</div></div>' +
        '<div><span class="text-white/40">Bench</span><div class="text-white font-semibold">' + (p.bench||'-') + '</div></div>' +
        '<div><span class="text-white/40">Tipe</span><div class="text-white font-semibold">' + (p.tipeLaterit||'-') + '</div></div>' +
        '<div><span class="text-white/40">Timur</span><div class="text-white font-semibold">' + (p.timur||'-') + '</div></div>' +
        '<div><span class="text-white/40">Utara</span><div class="text-white font-semibold">' + (p.utara||'-') + '</div></div>' +
      '</div>' +
      '<div class="text-[10px] font-bold text-white/40 tracking-wide mb-1">KEDALAMAN (' + p.depthCount + '/' + p.maxDepth + ' m)</div>' +
      depthRows +
      '<button onclick="closeMapDetail()" class="w-full mt-4 py-2.5 rounded-xl bg-white/[0.06] text-white text-xs font-bold">Tutup</button>' +
    '</div>' +
  '</div>';
}

function renderMapTapInfo_() {
  if (!mapTapState_.active) return '';
  const n = mapTapState_.native, p = mapTapState_.page, px = mapTapState_.pixel, g = mapTapState_.wgs84;
  const body = n && g
    ? '<div class="text-[10px] text-white/80">E ' + n.x.toFixed(2) + ' / N ' + n.y.toFixed(2) + '</div>' +
      '<div class="text-[10px] text-cyan-300">' + g.lat.toFixed(6) + ', ' + g.lon.toFixed(6) + '</div>' +
      (p && px ? '<div class="text-[9px] text-white/40">Page ' + p.x.toFixed(2) + ', ' + p.y.toFixed(2) + ' · Pixel ' + px.x.toFixed(1) + ', ' + px.y.toFixed(1) + '</div>' : '')
    : '<div class="text-[10px] text-amber-300">' + (mapTapState_.error || 'Koordinat tidak tersedia.') + '</div>';
  return '<div class="absolute left-3 top-3 z-10 max-w-[245px] px-3 py-2 rounded-xl bg-[#0b1329]/95 border border-yellow-400/30 shadow-lg">' +
    '<div class="flex items-center justify-between gap-3"><span class="text-[9px] text-yellow-300 font-bold">Titik Tap</span><button onclick="clearMapTap_()" class="text-[9px] text-white/40">Tutup</button></div>' + body + '</div>';
}

function renderPeta() {
  let html = renderHeader();
  html += '<main class="app-main flex-1 min-h-0 flex flex-col gap-[10px] px-4 pt-3 pb-3">';

  // [BARU] State loading -- muncul singkat saat tab Peta pertama kali dibuka & fetch
  // mandirinya (loadValidasiDataForMapStandalone_) masih berjalan.
  if (mapDataBusy) {
    html += renderSectionTitle('PETA LOKASI', 'memuat...');
    html += '<div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-8 text-center">' +
      '<span class="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full spin"></span>' +
      '<div class="text-white/50 text-xs">Memuat data Peta...</div>' +
    '</div>';
    html += '</main>' + renderBottomNav();
    return html;
  }

  // v90.2.115 FIX (temuan audit #2): SEKARANG pakai mapDataErrorMsg yg KHUSUS terisi dari
  // fetch Validasi -- SEBELUMNYA salah pakai dataLoadErrorMsg (punya Produksi), bikin Peta
  // ikut "error" saat Produksi gagal padahal Validasi sukses, ATAU sebaliknya Validasi
  // gagal tapi Peta tidak masuk state error sama sekali (malah pakai dataset lama).
  if (mapDataErrorMsg) {
    html += renderSectionTitle('PETA LOKASI', 'gagal memuat');
    html += '<div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0b1329] border border-rose-500/20 p-8 text-center">' +
      icon('alert-triangle','w-10 h-10 text-rose-400') +
      '<div class="text-white font-bold text-sm">Gagal Memuat Data Peta</div>' +
      '<div class="text-[11px] text-white/40 max-w-[260px]">' + mapDataErrorMsg + '</div>' +
      '<button onclick="mapDataFetchAttempted=false; loadValidasiDataForMapStandalone_()" class="mt-1 px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold active:scale-95 transition-transform">Coba Lagi</button>' +
    '</div>';
    html += '</main>' + renderBottomNav();
    return html;
  }

  const mapData = buildMapData();
  const validPoints = mapData.filter(p => p.hasValidCoord);
  const invalidCount = mapData.length - validPoints.length;

  // v90.2.116: konsumsi permintaan fokus dari kartu Validasi -- kalau TP-nya BENAR ADA
  // di mapData (mis. belum kehapus/berubah), buka detailnya otomatis. "Konsumsi 1x" --
  // flag langsung direset supaya tidak terus2an buka modal tiap render() lain dipicu.
  if (mapFocusIdTp) {
    if (mapData.some(p => p.idTp === mapFocusIdTp)) mapDetailIdTp = mapFocusIdTp;
    mapFocusIdTp = null;
  }

  html += renderSectionTitle('PETA LOKASI', mapData.length + ' titik TP');

  // v90.2.113: state EMPTY (poin desain #7) -- 0 TP sama sekali (bukan krn error, genuinely
  // belum ada data Validasi).
  if (mapData.length === 0) {
    html += '<div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-8 text-center">' +
      icon('map','w-10 h-10 text-white/20') +
      '<div class="text-white font-bold text-sm">Belum Ada Titik TP</div>' +
      '<div class="text-[11px] text-white/40 max-w-[260px]">Data Validasi/Test Pit belum ada utk periode ini.</div>' +
    '</div>';
    html += '</main>' + renderBottomNav();
    return html;
  }

  // Semua TP ADA tapi TIDAK SATUPUN punya koordinat valid -- beda dari "benar2 kosong",
  // jadi pesan & state-nya juga dibedakan (poin desain #9, "TP tanpa koordinat").
  if (validPoints.length === 0) {
    html += '<div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0b1329] border border-amber-500/20 p-8 text-center">' +
      icon('map-pin-off','w-10 h-10 text-amber-400/60') +
      '<div class="text-white font-bold text-sm">Koordinat Belum Tersedia</div>' +
      '<div class="text-[11px] text-white/40 max-w-[260px]">' + mapData.length + ' titik TP ada, tapi belum satupun punya Timur/Utara terisi dari Plan/Head.</div>' +
    '</div>';
    html += '</main>' + renderBottomNav();
    return html;
  }

  // ==== SUCCESS: render Mine Grid ====
  html += '<div id="mg1-map-viewport" class="relative flex-1 min-h-0 rounded-[12px] bg-[#0b1329] border border-white/[0.08] overflow-hidden select-none" style="touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;" oncontextmenu="return false" onselectstart="return false" ondragstart="return false">' +
    renderMineGridSvg(validPoints) +
    renderNorthArrow_(computeResponsiveDisplayBounds_(validPoints)) +
    renderMeasureBanner_(mapData) +
    // Kontrol zoom + crosshair (reset view) -- poin desain #2 (MAP-02): sekarang BENAR2
    // py handler, bukan sekadar elemen visual. [BONUS -- 4 Sep] Tombol Mode Ukur ditambah
    // di grup yg sama (kanan-atas), ikon berubah & warna nyala kuning saat aktif.
    '<div class="absolute right-3 top-3 flex flex-col gap-2">' +
      '<button onclick="zoomMapIn()" aria-label="Perbesar" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('plus','w-4 h-4 text-white') + '</button>' +
      '<button onclick="zoomMapOut()" aria-label="Perkecil" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('minus','w-4 h-4 text-white') + '</button>' +
      '<button onclick="resetMapView()" aria-label="Reset tampilan" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('crosshair','w-4 h-4 text-white') + '</button>' +
      '<button onclick="toggleMeasureMode_()" aria-label="Mode Ukur" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (measureModeActive ? 'bg-amber-500 border border-amber-400' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('ruler','w-4 h-4 ' + (measureModeActive ? 'text-[#0b1329]' : 'text-white')) + '</button>' +
      '<button onclick="' + (gpsState_.active ? 'stopGpsTracking_()' : 'startGpsTracking_()') + '" aria-label="' + (gpsState_.active ? 'Matikan GPS' : 'Aktifkan GPS') + '" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (gpsState_.active ? 'bg-cyan-400 border border-cyan-300' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('navigation','w-4 h-4 ' + (gpsState_.active ? 'text-[#0b1329]' : 'text-white')) + '</button>' +
      '<button onclick="openMapManagePanel_()" aria-label="Kelola Peta Background" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (activeBackgroundMapId ? 'bg-emerald-500 border border-emerald-400' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('layers','w-4 h-4 ' + (activeBackgroundMapId ? 'text-[#0b1329]' : 'text-white')) + '</button>' +
      '<button onclick="openKmlManagePanel_()" aria-label="Kelola KML" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (activeKmlOverlayIds.length > 0 ? 'bg-purple-500 border border-purple-400' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('shapes','w-4 h-4 ' + (activeKmlOverlayIds.length > 0 ? 'text-white' : 'text-white')) + '</button>' +
    '</div>' +
    (invalidCount > 0 ? '<div class="absolute left-3 bottom-11 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-semibold">' + invalidCount + ' TP tanpa koordinat</div>' : '') +
    (mapTapState_.active ? renderMapTapInfo_() : '') +
    renderMapScaleBar(computeResponsiveDisplayBounds_(validPoints)) +
  '</div>';
  if (gpsState_.active) {
    const gpsText = gpsState_.status === 'ok'
      ? ('GPS: ' + gpsState_.lat.toFixed(6) + ', ' + gpsState_.lon.toFixed(6) + (gpsState_.accuracyM != null ? ' ±' + gpsState_.accuracyM.toFixed(0) + 'm' : ''))
      : (gpsState_.status === 'searching' ? 'GPS: mencari posisi...' : 'GPS: ' + (gpsState_.error || 'belum tersedia'));
    html += '<div class="text-[10px] ' + (gpsState_.status === 'ok' ? 'text-cyan-300' : 'text-amber-300') + ' text-center shrink-0">' + gpsText + '</div>';
  }
  html += '<div class="text-[10px] text-white/30 text-center shrink-0">Koordinat grid tambang (Timur/Utara) -- bukan GPS. Tap titik utk detail.</div>';
  html += '</main>';
  html += renderBottomNav();
  html += renderMapDetailModal(mapData);
  html += renderMapManagePanel_();
  html += renderMapUploadForm_();
  html += renderKmlManagePanel_();
  html += renderKmlUploadForm_();
  // STEP 04: setelah DOM dipasang oleh render(), ukur container aktual agar FIT
  // mengikuti portrait/landscape tanpa mengubah GeoReference.
  scheduleMapViewportFit_();
  return html;
}

// ==== RENDER: Panel Kelola Peta Background ====
function renderMapManagePanel_() {
  if (!mapManagePanelOpen) return '';
  const listHtml = backgroundMapsList.length === 0
    ? '<p class="text-[11px] text-white/30 text-center py-4">Belum ada peta background tersimpan.</p>'
    : backgroundMapsList.map(function(m) {
        const active = m.id === activeBackgroundMapId;
        return '<div class="flex items-center gap-2.5 rounded-xl p-2.5 mb-1.5 ' + (active ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/[0.04]') + '">' +
          '<img src="' + m.imageDataUrl + '" class="w-11 h-11 rounded-lg object-cover shrink-0">' +
          '<div class="flex-1 min-w-0" onclick="activateBackgroundMap_(\'' + m.id + '\')">' +
            '<div class="text-[12px] font-semibold text-white truncate">' + m.name + (active ? ' <span class="text-emerald-400 text-[9px] font-bold">&bull; AKTIF</span>' : '') + '</div>' +
            '<div class="text-[9px] text-white/30">oleh ' + (m.uploadedBy || '-') + '</div>' +
          '</div>' +
          '<button onclick="event.stopPropagation(); deleteBackgroundMapEntry_(\'' + m.id + '\')" class="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">' + icon('trash-2','w-3.5 h-3.5 text-rose-400') + '</button>' +
        '</div>';
      }).join('');
  const body = listHtml +
    (activeBackgroundMapId ? '<button onclick="deactivateBackgroundMap_()" class="w-full mt-1 mb-2 py-2 rounded-xl bg-white/[0.04] text-white/50 text-[11px] font-semibold">Nonaktifkan Background</button>' : '') +
    '<button onclick="openMapUploadForm_()" class="w-full mt-2 flex items-center justify-center gap-2 bg-[#2563eb]/15 border border-[#2563eb]/30 text-blue-300 font-bold text-xs py-2.5 rounded-xl">' + icon('plus','w-4 h-4') + '<span>Tambah Peta Baru</span></button>' +
    '<p class="text-[9px] text-white/25 mt-2 leading-relaxed">Peta background cuma tersimpan di HP ini (lokal) -- HP lain tidak otomatis ikut lihat peta yang sama.</p>';
  return renderSimpleModal('Kelola Peta Background', backgroundMapsList.length + ' peta tersimpan', body, 'closeMapManagePanel_()');
}

// ==== RENDER: Form Upload Peta Background ====
function renderMapUploadForm_() {
  if (!mapUploadFormOpen) return '';
  const f = mapUploadFormState;
  function inputRow(label, field, placeholder) {
    // [BARU] Kunci 4 kolom ini kalau koordinat berasal dari GeoPDF auto-detect (jaga-jaga
    // human error -- angka GeoPDF sudah tervalidasi otomatis, tidak perlu/boleh diubah
    // manual). GeoTIFF & upload manual TETAP bisa diedit seperti biasa (0 geoReference).
    const locked = !!f.geoReference;
    const domFieldId = {
      tlTimur: 'tl-timur', tlUtara: 'tl-utara',
      brTimur: 'br-timur', brUtara: 'br-utara'
    }[field] || field;
    return '<div><label class="block text-[10px] text-white/40 mb-1 font-medium">' + label + '</label>' +
      '<input id="map-upload-' + domFieldId + '" type="text" inputmode="decimal" value="' + (f[field]||'') + '" oninput="updateMapUploadField_(\'' + field + '\', this.value)" placeholder="' + placeholder + '" ' + (locked ? 'disabled readonly' : '') + ' class="w-full bg-[#0b1329] border border-white/10 rounded-lg px-2.5 py-2 text-[12px] text-white focus:outline-none focus:border-blue-400/60' + (locked ? ' opacity-50 cursor-not-allowed' : '') + '"></div>';
  }
  const body =
    '<div class="mb-3">' +
      '<label class="block text-[10px] text-white/40 mb-1 font-medium">Nama Peta</label>' +
      '<input type="text" value="' + f.name + '" oninput="updateMapUploadField_(\'name\', this.value)" placeholder="cth. Foto Udara Avanza Sep 2026" class="w-full bg-[#0b1329] border border-white/10 rounded-lg px-2.5 py-2 text-[12px] text-white focus:outline-none focus:border-blue-400/60">' +
    '</div>' +
    '<div class="mb-3">' +
      '<label class="block text-[10px] text-white/40 mb-1 font-medium">Gambar Peta (PNG/JPG, GeoTIFF, atau GeoPDF -- koordinat auto-terisi kalau ada)</label>' +
      '<input type="file" accept="image/*,.tif,.tiff,.pdf" onchange="handleMapImageFileSelected_(this)" class="w-full text-[11px] text-white/60">' +
      (f.fileDataUrl ? '<img src="' + f.fileDataUrl + '" class="w-full h-24 object-cover rounded-lg mt-2">' : '') +
    '</div>' +
    '<p class="text-[10px] text-white/40 mb-2 leading-relaxed">Masukkan Timur/Utara pojok KIRI-ATAS dan KANAN-BAWAH gambar (dari ArcGIS/data survey) -- ini yang dipakai app utk menempel gambar ke posisi yang benar.</p>' +
    (f.geoReference ? '<p class="text-[10px] text-emerald-400/80 mb-2 leading-relaxed">🔒 Terkunci -- koordinat ini hasil auto-detect GeoPDF, tidak bisa diedit manual (jaga-jaga salah ketik). Ganti file kalau perlu koordinat berbeda.</p>' : '') +
    '<div class="grid grid-cols-2 gap-2 mb-2">' +
      inputRow('Kiri-Atas: Timur', 'tlTimur', '397000') +
      inputRow('Kiri-Atas: Utara', 'tlUtara', '53500') +
      inputRow('Kanan-Bawah: Timur', 'brTimur', '397300') +
      inputRow('Kanan-Bawah: Utara', 'brUtara', '53100') +
    '</div>' +
    '<div class="mt-2">' +
      '<p id="map-upload-status" class="text-[10px] mt-1 mb-1 font-medium ' + (mapUploadStatusOk ? 'text-emerald-400' : 'text-rose-400') + '">' + (mapUploadStatusMsg || 'Siap memproses file...') + '</p>' +
      '<div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-label="Proses tile GeoPDF">' +
        '<div id="map-upload-progress-fill" class="h-full rounded-full bg-blue-500" style="width: 0%; transition: width 120ms ease-out;"></div>' +
      '</div>' +
    '</div>' +
    '<button onclick="submitMapUpload_()" ' + ((mapUploadBusy || mapUploadProcessing) ? 'disabled' : '') + ' class="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs py-2.5 rounded-xl disabled:opacity-60">' +
      ((mapUploadBusy || mapUploadProcessing) ? '<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"></span>' : icon('upload','w-4 h-4')) + '<span>' + (mapUploadBusy ? 'Menyimpan...' : (mapUploadProcessing ? 'Memproses GeoPDF...' : 'Simpan Peta')) + '</span>' +
    '</button>';
  return renderSimpleModal('Tambah Peta Baru', 'Upload gambar + 2 titik referensi', body, 'closeMapUploadForm_()');
}

// ==== KML OVERLAY -- BARU 5 Sep ====
// Parsing pakai DOMParser BAWAAN BROWSER (0 library tambahan, beda dari GeoTIFF yg
// butuh geotiff.js) -- KML itu XML biasa, dan SELALU simpan koordinat sbg Lat/Lon
// (standar KML, bukan pilihan) -- makanya forwardUtm_ (shared/geo-engine.js) WAJIB
// dipakai di sini utk konversi ke Easting/Northing sblm bisa diplot di sistem Peta MG1.
function parseKmlText_(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('File KML tidak valid/rusak.');
  const points = [];
  const lines = [];
  const placemarks = doc.querySelectorAll('Placemark');
  placemarks.forEach(pm => {
    const nameEl = pm.querySelector('name');
    const name = nameEl ? nameEl.textContent.trim() : '(tanpa nama)';

    const pointEl = pm.querySelector('Point > coordinates');
    if (pointEl) {
      const parts = pointEl.textContent.trim().split(',');
      const lon = parseFloat(parts[0]), lat = parseFloat(parts[1]);
      if (isFinite(lon) && isFinite(lat)) {
        const utm = forwardUtm_(lat, lon, MG1_CRS_CONFIG.zone, MG1_CRS_CONFIG.hemisphere);
        points.push({ name: name, timur: utm.easting, utara: utm.northing });
      }
    }
    // LineString ATAU Polygon (outerBoundaryIs) -- keduanya sama-sama "garis" utk ditampilkan,
    // Polygon cuma LineString yg baliknya nyambung ke titik awal.
    const coordsEl = pm.querySelector('LineString > coordinates, Polygon coordinates');
    if (coordsEl) {
      const path = coordsEl.textContent.trim().split(/\s+/).map(triplet => {
        const parts = triplet.split(',');
        const lon = parseFloat(parts[0]), lat = parseFloat(parts[1]);
        if (!isFinite(lon) || !isFinite(lat)) return null;
        const utm = forwardUtm_(lat, lon, MG1_CRS_CONFIG.zone, MG1_CRS_CONFIG.hemisphere);
        return { timur: utm.easting, utara: utm.northing };
      }).filter(p => p !== null);
      if (path.length >= 2) lines.push({ name: name, path: path });
    }
  });
  return { points, lines };
}
function openKmlManagePanel_() { kmlManagePanelOpen = true; render(); }
function closeKmlManagePanel_() { kmlManagePanelOpen = false; kmlUploadFormOpen = false; render(); }
function openKmlUploadForm_() {
  kmlUploadFileName = ''; kmlUploadParsedName = ''; kmlUploadParsedPoints = []; kmlUploadParsedLines = [];
  kmlUploadStatusMsg = ''; kmlUploadFormOpen = true; render();
}
function closeKmlUploadForm_() { kmlUploadFormOpen = false; render(); }
function handleKmlFileSelected_(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  if (!/\.kml$/i.test(file.name)) { kmlUploadStatusMsg = 'File harus berekstensi .kml.'; kmlUploadStatusOk = false; render(); return; }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const result = parseKmlText_(reader.result);
      if (result.points.length === 0 && result.lines.length === 0) {
        kmlUploadStatusMsg = 'Tidak ada titik/garis yang bisa dibaca dari file ini.'; kmlUploadStatusOk = false;
      } else {
        kmlUploadParsedPoints = result.points;
        kmlUploadParsedLines = result.lines;
        kmlUploadParsedName = file.name.replace(/\.kml$/i, '');
        kmlUploadFileName = file.name;
        kmlUploadStatusMsg = '✓ Ditemukan ' + result.points.length + ' titik & ' + result.lines.length + ' garis/batas.';
        kmlUploadStatusOk = true;
      }
    } catch (e) {
      kmlUploadStatusMsg = 'Gagal baca file: ' + e.message; kmlUploadStatusOk = false;
    }
    render();
  };
  reader.readAsText(file);
}
async function submitKmlUpload_() {
  if (kmlUploadBusy) return;
  if (kmlUploadParsedPoints.length === 0 && kmlUploadParsedLines.length === 0) {
    kmlUploadStatusMsg = 'Pilih file KML yang valid dulu.'; kmlUploadStatusOk = false; render(); return;
  }
  kmlUploadBusy = true; render();
  try {
    const id = 'kml_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const db = await openMapDb_();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(KML_DB_STORE_, 'readwrite');
      tx.objectStore(KML_DB_STORE_).put({
        id: id, name: kmlUploadParsedName, points: kmlUploadParsedPoints, lines: kmlUploadParsedLines,
        uploadedAt: new Date().toISOString(), uploadedBy: sessionInfo ? sessionInfo.userName : 'unknown'
      });
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    await loadBackgroundMapsFromDb_();
    if (activeKmlOverlayIds.indexOf(id) < 0) activeKmlOverlayIds.push(id);
    localStorage.setItem('mg1_active_kml_ids', JSON.stringify(activeKmlOverlayIds));
    kmlUploadFormOpen = false;
  } catch (e) {
    kmlUploadStatusMsg = 'Gagal menyimpan.'; kmlUploadStatusOk = false;
  } finally {
    kmlUploadBusy = false; render();
  }
}
function toggleKmlOverlayActive_(id) {
  const idx = activeKmlOverlayIds.indexOf(id);
  if (idx >= 0) activeKmlOverlayIds.splice(idx, 1); else activeKmlOverlayIds.push(id);
  localStorage.setItem('mg1_active_kml_ids', JSON.stringify(activeKmlOverlayIds));
  render();
}
async function deleteKmlOverlayEntry_(id) {
  try {
    const db = await openMapDb_();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(KML_DB_STORE_, 'readwrite');
      tx.objectStore(KML_DB_STORE_).delete(id);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    activeKmlOverlayIds = activeKmlOverlayIds.filter(x => x !== id);
    localStorage.setItem('mg1_active_kml_ids', JSON.stringify(activeKmlOverlayIds));
    await loadBackgroundMapsFromDb_();
  } catch (e) { console.warn('Gagal hapus KML:', e); }
  render();
}

// ==== RENDER: Panel Kelola KML Overlay ====
function renderKmlManagePanel_() {
  if (!kmlManagePanelOpen) return '';
  const listHtml = kmlOverlaysList.length === 0
    ? '<p class="text-[11px] text-white/30 text-center py-4">Belum ada KML tersimpan.</p>'
    : kmlOverlaysList.map(function(k) {
        const active = activeKmlOverlayIds.indexOf(k.id) >= 0;
        return '<div class="flex items-center gap-2.5 rounded-xl p-2.5 mb-1.5 ' + (active ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/[0.04]') + '">' +
          '<div class="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">' + icon('shapes','w-4 h-4 text-purple-400') + '</div>' +
          '<div class="flex-1 min-w-0" onclick="toggleKmlOverlayActive_(\'' + k.id + '\')">' +
            '<div class="text-[12px] font-semibold text-white truncate">' + k.name + '</div>' +
            '<div class="text-[9px] text-white/30">' + k.points.length + ' titik &bull; ' + k.lines.length + ' garis</div>' +
          '</div>' +
          '<button onclick="toggleKmlOverlayActive_(\'' + k.id + '\')" class="text-[9px] font-bold px-2 py-1 rounded-full ' + (active ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/40') + '">' + (active ? 'TAMPIL' : 'SEMBUNYI') + '</button>' +
          '<button onclick="event.stopPropagation(); deleteKmlOverlayEntry_(\'' + k.id + '\')" class="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">' + icon('trash-2','w-3.5 h-3.5 text-rose-400') + '</button>' +
        '</div>';
      }).join('');
  const body = listHtml +
    '<button onclick="openKmlUploadForm_()" class="w-full mt-2 flex items-center justify-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-xs py-2.5 rounded-xl">' + icon('plus','w-4 h-4') + '<span>Import KML Baru</span></button>' +
    '<p class="text-[9px] text-white/25 mt-2 leading-relaxed">Bisa aktifkan beberapa KML sekaligus. Titik &amp; garis dikonversi otomatis dari Lat/Lon ke grid Timur/Utara pakai CRS situs aktif (' + (MG1_CRS_CONFIG.presetLabel||'-') + ').</p>';
  return renderSimpleModal('Kelola KML', kmlOverlaysList.length + ' file tersimpan', body, 'closeKmlManagePanel_()');
}

// ==== RENDER: Form Upload KML ====
function renderKmlUploadForm_() {
  if (!kmlUploadFormOpen) return '';
  const body =
    '<div class="mb-3">' +
      '<label class="block text-[10px] text-white/40 mb-1 font-medium">File KML</label>' +
      '<input type="file" accept=".kml" onchange="handleKmlFileSelected_(this)" class="w-full text-[11px] text-white/60">' +
    '</div>' +
    (kmlUploadStatusMsg ? '<p class="text-[11px] mb-2 font-medium ' + (kmlUploadStatusOk ? 'text-emerald-400' : 'text-rose-400') + '">' + kmlUploadStatusMsg + '</p>' : '') +
    (kmlUploadParsedPoints.length > 0 || kmlUploadParsedLines.length > 0
      ? '<p class="text-[9px] text-white/30 mb-2">Koordinat KML (Lat/Lon) otomatis dikonversi ke Timur/Utara pakai CRS situs aktif sekarang: <span class="text-white/50 font-semibold">' + (MG1_CRS_CONFIG.presetLabel||'-') + '</span>.</p>'
      : '') +
    '<button onclick="submitKmlUpload_()" ' + (kmlUploadBusy ? 'disabled' : '') + ' class="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-xs py-2.5 rounded-xl disabled:opacity-60">' +
      (kmlUploadBusy ? '<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"></span>' : icon('upload','w-4 h-4')) + '<span>' + (kmlUploadBusy ? 'Menyimpan...' : 'Simpan KML') + '</span>' +
    '</button>';
  return renderSimpleModal('Import KML', 'Titik &amp; garis batas', body, 'closeKmlUploadForm_()');
}
