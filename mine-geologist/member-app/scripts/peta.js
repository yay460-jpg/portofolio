/* STEP 7.6 V10.6.1 TOUCH OWNERSHIP BUILD: direct PDF.js tile path. V17.1 GEO-PDF NO FLICKER STABILIZATION. */
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
// STEP 5.6: state gesture pinch-to-zoom 2 jari.
// STEP 7.6: single-finger pan state. Selama gesture aktif, SVG yang sudah tampil
// digerakkan oleh compositor (CSS transform); DOM/tile tidak dibangun ulang per touchmove.
// STEP 7.6E: smooth zoom-button visual transition. mapZoom tetap menjadi
// sumber kebenaran; selama animasi hanya SVG yang diberi transform compositor.

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
// STEP 7.6B-V13.1: one gesture = one input owner.
function requestMapRender_() {
  if (mapPanState_.active || mapPinchState_.active || mapPanInertiaRaf_ || mapButtonZoomRaf_) {
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
  mapPanState_.active = false; if(mapPanState_.visualSvg){ mapPanState_.visualSvg.style.willChange='auto'; } mapPanState_.visualSvg = null;
  mapPanState_.dx = 0; mapPanState_.dy = 0;
  mapPanState_.velocityX = 0; mapPanState_.velocityY = 0; mapPanState_.moved = false;
  mapPinchState_.active = false; if (mapPinchState_.visualSvg) { mapPinchState_.visualSvg.style.transform = composeMapTransform_(1, mapRotationDeg_, 0, 0); mapPinchState_.visualSvg.style.transformOrigin='50% 50%'; } mapPinchState_.visualSvg = null;
  mapPinchRenderScheduled_ = false; mapPanRenderScheduled_ = false;
  if (mapPanInertiaRaf_) { try { cancelAnimationFrame(mapPanInertiaRaf_); } catch (_) {} mapPanInertiaRaf_ = null; }
}

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
  // KEYBOARD FIX: Android visual viewport resize fires while a form input is focused.
  // The map-fit listener must never rebuild the whole app during keyboard activity,
  // otherwise Digging/Validasi inputs lose focus and the keyboard closes.
  const active = document.activeElement;
  const keyboardInputActive = !!(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA'));
  if (keyboardInputActive || currentTab !== 'peta') return;
  if (mapViewportSyncScheduled_) return;
  mapViewportSyncScheduled_ = true;
  requestAnimationFrame(() => {
    mapViewportSyncScheduled_ = false;
    const activeNow = document.activeElement;
    const keyboardStillActive = !!(activeNow && (activeNow.tagName === 'INPUT' || activeNow.tagName === 'TEXTAREA'));
    if (keyboardStillActive || currentTab !== 'peta') return;
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

// v90.2.116 BARU (permintaan user -- lompat dari Validasi ke lokasi Peta): TP yg harus
// otomatis dibuka detailnya begitu tab Peta aktif -- dipicu dari tombol pin di kartu
// Validasi, BUKAN cuma pindah tab tapi juga langsung fokus ke TP spesifik yg diminta.
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
const GEOPDF_TILE_SIZE_MAX_SAFE_ = 768;
const GEOPDF_TILE_LEVEL_FACTORS_ = [0.25, 0.5, 1, 2];
const GEOPDF_TILE_MAX_LEVEL_ = GEOPDF_TILE_LEVEL_FACTORS_.length - 1;

// STEP C1 - VIEWPORT TILE PLANNER V1
// Planner ONLY. Tidak merender tile, tidak mengubah renderer V13.1, tidak mengubah
// gesture, tidak mengubah DPR, dan tidak menulis cache tile. Tujuan: menghitung tile
// yang secara geometris diperlukan oleh viewport saat ini, berdasarkan GeoReference,
// mapZoom, tile size, dan profile perangkat.
function getViewportTilePlan_(geoReferenceOverride) {
  try {
    const activeMap = activeBackgroundMapId ? backgroundMapsList.find(m => m.id === activeBackgroundMapId) : null;
    const geoReference = geoReferenceOverride || (activeMap && activeMap.geoReference);
    if (!geoReference || !geoReference.metadata || !Array.isArray(geoReference.metadata.vpBBox)) {
      return { ok:false, reason:'GeoPDF aktif dengan GeoReference belum tersedia.' };
    }

    // V14.36: pada upload GeoPDF baru, activeBackgroundMapId belum terisi karena
    // peta belum disimpan ke IndexedDB. C1 sebelumnya langsung gagal di sini,
    // sehingga C2 kehilangan daftar Visible dan fallback ke seluruh tile (70).
    // Untuk incoming GeoReference, gunakan extent GeoPDF sebagai extra bound sementara.
    let bounds = null;
    if (activeMap) {
      bounds = computeResponsiveDisplayBounds_(buildMapData());
    } else {
      const extras = [];
      const ext = geoReference.extent;
      if (ext && ext.cornerTL && ext.cornerBR) {
        const e1 = parseFloat(ext.cornerTL.timur), n1 = parseFloat(ext.cornerTL.utara);
        const e2 = parseFloat(ext.cornerBR.timur), n2 = parseFloat(ext.cornerBR.utara);
        if ([e1, n1, e2, n2].every(Number.isFinite)) {
          extras.push({ minT:Math.min(e1,e2), maxT:Math.max(e1,e2), minU:Math.min(n1,n2), maxU:Math.max(n1,n2) });
        }
      }
      const base = computeMineGridBounds(buildMapData(), extras);
      if (base) {
        const ratio = mapViewportRatio_ > 0 ? mapViewportRatio_ : 1;
        const w = base.maxT - base.minT, h = base.maxU - base.minU;
        let minT = base.minT, maxT = base.maxT, minU = base.minU, maxU = base.maxU;
        if (w > 0 && h > 0) {
          const currentRatio = w / h;
          if (currentRatio > ratio) {
            const extra = ((w / ratio) - h) / 2;
            minU -= extra; maxU += extra;
          } else if (currentRatio < ratio) {
            const extra = ((h * ratio) - w) / 2;
            minT -= extra; maxT += extra;
          }
        }
        bounds = { minT, maxT, minU, maxU };
      }
    }
    if (!bounds) return { ok:false, reason:'Map bounds belum tersedia.' };

    const deviceProfile = window.mg1DeviceTileEngineProfile || getDeviceTileEngineProfile_();
    const tileSize = Math.max(64, Number(deviceProfile.tileSize) || GEOPDF_TILE_SIZE_);
    const maxFactor = Math.max(0.25, Number(deviceProfile.maxFactor) || 1);

    // Ikuti pemetaan zoom yang SUDAH dipakai renderer, tetapi batasi dengan profile.
    let requestedFactor = 1;
    // V14.39: LOW device uses native 1x at normal zoom. The previous 0.5x
    // planner was fast but visibly too soft on the S7 Edge.
    if (mapZoom <= 1.5) requestedFactor = (String(deviceProfile.tier) === 'LOW') ? 1 : 0.25;
    else if (mapZoom <= 2.5) requestedFactor = 0.5;
    else requestedFactor = 1;
    const factor = Math.min(requestedFactor, maxFactor);

    const b = geoReference.metadata.vpBBox;
    const xMin = Math.min(b[0], b[2]), xMax = Math.max(b[0], b[2]);
    const yMin = Math.min(b[1], b[3]), yMax = Math.max(b[1], b[3]);
    const baseScale = getGeoPdfRenderScale_(geoReference);
    const levelWidth = Math.max(1, Math.round((xMax - xMin) * baseScale * factor));
    const levelHeight = Math.max(1, Math.round((yMax - yMin) * baseScale * factor));
    const tilesX = Math.ceil(levelWidth / tileSize);
    const tilesY = Math.ceil(levelHeight / tileSize);

    const viewBox = getMapViewBox_(bounds);
    const corners = [
      {x:viewBox.x, y:viewBox.y},
      {x:viewBox.x + viewBox.w, y:viewBox.y},
      {x:viewBox.x + viewBox.w, y:viewBox.y + viewBox.h},
      {x:viewBox.x, y:viewBox.y + viewBox.h}
    ];
    const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
    if (!(rangeT > 0) || !(rangeU > 0)) return { ok:false, reason:'Map bounds tidak valid.' };

    // SVG saat ini dapat diputar. Untuk planner, inverse-rotate corner viewport agar
    // tile yang dibutuhkan tetap dihitung secara konservatif dan tidak ada area hilang.
    const nativeCorners = corners.map(function(c) {
      let sx = c.x, sy = c.y;
      if (Math.abs(mapRotationDeg_) > 0.0001) {
        const rad = -mapRotationDeg_ * Math.PI / 180;
        const cx = 160, cy = 160;
        const dx = sx - cx, dy = sy - cy;
        sx = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
        sy = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
      }
      return {
        x: bounds.minT + (sx / 320) * rangeT,
        y: bounds.minU + ((320 - sy) / 320) * rangeU
      };
    });

    const pageCorners = nativeCorners.map(function(n) {
      return applyInverseAffineTransform2D_(geoReference.transform && (geoReference.transform.coefficients || geoReference.transform), n);
    }).filter(Boolean);
    if (pageCorners.length < 4) return { ok:false, reason:'Transform viewport ke PDF gagal.' };

    const pxCorners = pageCorners.map(function(pt) {
      return {
        x: (pt.x - xMin) * baseScale * factor,
        y: (yMax - pt.y) * baseScale * factor
      };
    });
    let pxMin = Math.min.apply(null, pxCorners.map(p => p.x));
    let pxMax = Math.max.apply(null, pxCorners.map(p => p.x));
    let pyMin = Math.min.apply(null, pxCorners.map(p => p.y));
    let pyMax = Math.max.apply(null, pxCorners.map(p => p.y));
    pxMin = Math.max(0, Math.min(levelWidth, pxMin));
    pxMax = Math.max(0, Math.min(levelWidth, pxMax));
    pyMin = Math.max(0, Math.min(levelHeight, pyMin));
    pyMax = Math.max(0, Math.min(levelHeight, pyMax));

    const radius = Math.max(0, Number(deviceProfile.prefetchRadius) || 0);
    const visibleMinX = Math.max(0, Math.floor(pxMin / tileSize));
    const visibleMaxX = Math.min(tilesX - 1, Math.floor(Math.max(pxMin, pxMax - 0.001) / tileSize));
    const visibleMinY = Math.max(0, Math.floor(pyMin / tileSize));
    const visibleMaxY = Math.min(tilesY - 1, Math.floor(Math.max(pyMin, pyMax - 0.001) / tileSize));

    let visibleCount = 0;
    if (visibleMaxX >= visibleMinX && visibleMaxY >= visibleMinY) {
      visibleCount = (visibleMaxX - visibleMinX + 1) * (visibleMaxY - visibleMinY + 1);
    }
    const planMinX = Math.max(0, visibleMinX - radius);
    const planMaxX = Math.min(tilesX - 1, visibleMaxX + radius);
    const planMinY = Math.max(0, visibleMinY - radius);
    const planMaxY = Math.min(tilesY - 1, visibleMaxY + radius);
    let requiredCount = 0;
    if (planMaxX >= planMinX && planMaxY >= planMinY) {
      requiredCount = (planMaxX - planMinX + 1) * (planMaxY - planMinY + 1);
    }

    return {
      ok:true,
      tier:String(deviceProfile.tier || 'BALANCED'),
      zoom:Number(mapZoom.toFixed(2)),
      factor:Number(factor),
      tileSize,
      levelWidth,
      levelHeight,
      tilesX,
      tilesY,
      visible:{minX:visibleMinX,maxX:visibleMaxX,minY:visibleMinY,maxY:visibleMaxY,count:visibleCount},
      prefetchRadius:radius,
      required:{minX:planMinX,maxX:planMaxX,minY:planMinY,maxY:planMaxY,count:requiredCount},
      totalLevelTiles:tilesX * tilesY,
      rotationDeg:Number(mapRotationDeg_.toFixed(2)),
      status:'PLANNER ONLY'
    };
  } catch (e) {
    console.warn('[ADAPTIVE] Viewport planner gagal:', e);
    return { ok:false, reason:e && e.message ? e.message : 'Planner error.' };
  }
}

// V14.49 STEP D1 — PASSIVE PREFETCH PLANNER
// Hanya membaca hasil C1 + arah pan yang SUDAH selesai. Tidak dipanggil dari
// touchmove/pointermove dan tidak menyentuh DOM peta, SVG transform, level.tiles,
// tile positioning, atau renderer. Output hanya daftar kandidat tile untuk tahap D2.
function planPassivePrefetchAfterPan_(dx, dy) {
  try {
    const plan = getViewportTilePlan_();
    if (!plan || !plan.ok) return { ok:false, reason:plan && plan.reason ? plan.reason : 'C1 belum siap.' };

    const x = Number(dx) || 0, y = Number(dy) || 0;
    const ax = Math.abs(x), ay = Math.abs(y);
    if (Math.max(ax, ay) < 4) {
      return { ok:true, direction:'NONE', candidates:[], plan:plan, status:'PLANNER ONLY' };
    }

    // Drag kiri -> viewport berikutnya cenderung membuka sisi kanan.
    // Drag kanan -> membuka sisi kiri. Demikian pula sumbu Y.
    const dirX = ax >= 4 ? (x < 0 ? 1 : -1) : 0;
    const dirY = ay >= 4 ? (y < 0 ? 1 : -1) : 0;
    const candidates = [];
    const seen = new Set();

    function addCandidate(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= plan.tilesX || ty >= plan.tilesY) return;
      if (tx >= plan.visible.minX && tx <= plan.visible.maxX && ty >= plan.visible.minY && ty <= plan.visible.maxY) return;
      const key = tx + ':' + ty;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ x:tx, y:ty, key:key });
    }

    // Satu ring/strip tile tepat di depan viewport. Tidak memperluas core visible.
    if (dirX !== 0) {
      const edgeX = dirX > 0 ? plan.visible.maxX + 1 : plan.visible.minX - 1;
      for (let ty = plan.visible.minY; ty <= plan.visible.maxY; ty++) addCandidate(edgeX, ty);
    }
    if (dirY !== 0) {
      const edgeY = dirY > 0 ? plan.visible.maxY + 1 : plan.visible.minY - 1;
      for (let tx = plan.visible.minX; tx <= plan.visible.maxX; tx++) addCandidate(tx, edgeY);
    }
    // Tambahkan sudut depan bila pan diagonal.
    if (dirX !== 0 && dirY !== 0) {
      const edgeX = dirX > 0 ? plan.visible.maxX + 1 : plan.visible.minX - 1;
      const edgeY = dirY > 0 ? plan.visible.maxY + 1 : plan.visible.minY - 1;
      addCandidate(edgeX, edgeY);
    }

    return {
      ok:true,
      direction:(dirX > 0 ? 'RIGHT' : dirX < 0 ? 'LEFT' : '') +
                (dirY > 0 ? (dirX ? '+DOWN' : 'DOWN') : dirY < 0 ? (dirX ? '+UP' : 'UP') : ''),
      drag:{x:Number(x.toFixed(1)), y:Number(y.toFixed(1))},
      candidates:candidates,
      plan:plan,
      status:'PLANNER ONLY'
    };
  } catch (e) {
    console.warn('[ADAPTIVE] Passive prefetch planner gagal:', e);
    return { ok:false, reason:e && e.message ? e.message : 'Passive planner error.' };
  }
}

// STEP C1 - VIEWPORT TILE PLANNER V1 !== 'boolean') window.mg1AdaptiveC2Enabled = true;
// V14.31: C2 field test is automatic; no manual 'next upload' activation required.
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
let backgroundMapsList = []; // cache in-memory dari IndexedDB, direfresh tiap ada perubahan
let activeBackgroundMapId = null;
let mapManagePanelOpen = false;
let mapUploadFormOpen = false;
let mapUploadFormState = { name: '', fileDataUrl: '', fileName: '', tlTimur: '', tlUtara: '', brTimur: '', brUtara: '', geoReference: null, tilePyramid: null };
let mapUploadStatusMsg = '', mapUploadStatusOk = true, mapUploadBusy = false, mapUploadProcessing = false;
// V15.14: browser File reference untuk runtime GeoPDF. IndexedDB tetap hanya menyimpan data map/tile; File asli dipakai runtime bila tersedia.
let mapUploadRuntimeFile_ = null;
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

// V15.13 STEP J — RUNTIME TILE PERSISTENCE
// Menyimpan kembali tilePyramid setelah tile runtime berhasil dibuat. Tidak mengubah
// renderer/gesture; tujuan tahap ini hanya agar tile yang sudah dibuat tidak hilang
// ketika map dibaca ulang dari IndexedDB. Raw PDF bytes/File tetap TIDAK disimpan.
// Dipanggil sekali saat boot (lihat pemanggilan di index.html) -- gagal (mis. browser
// lama tanpa IndexedDB) TIDAK BOLEH bikin app crash, Peta tetap jalan tanpa background.

function openMapManagePanel_() { mapManagePanelOpen = true; render(); }
function closeMapManagePanel_() { mapManagePanelOpen = false; mapUploadFormOpen = false; render(); }
let applyGeoRefRafId_ = null;

function cancelApplyGeoReferenceRaf_() {
  if (applyGeoRefRafId_ !== null) {
    cancelAnimationFrame(applyGeoRefRafId_);
    applyGeoRefRafId_ = null;
  }
}

function openMapUploadForm_() {
  cancelApplyGeoReferenceRaf_();
  mapUploadFormState = { name: '', fileDataUrl: '', fileName: '', tlTimur: '', tlUtara: '', brTimur: '', brUtara: '', geoReference: null, tilePyramid: null };
  mapUploadStatusMsg = ''; mapUploadStatusOk = true; mapUploadBusy = false; mapUploadProcessing = false; mapUploadFormOpen = true; render();
}
function closeMapUploadForm_() { cancelApplyGeoReferenceRaf_(); mapUploadFormOpen = false; mapUploadProcessing = false; mapUploadRuntimeFile_ = null; render(); }
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
  let rafPending = null;
  let lastPercent = -1;
  let stopped = false;

  const paint_ = () => {
    rafPending = null;
    if (stopped) return;
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

  const reporter = (stageMsg, percent = 0) => {
    if (stopped) return;
    pendingMsg = String(stageMsg || pendingMsg || 'Memproses GeoPDF...');
    pendingPercent = Math.max(0, Math.min(100, Number(percent) || 0));
    mapUploadStatusMsg = pendingMsg;
    mapUploadStatusOk = true;

    // Sinkronisasi koordinat tetap ringan; tidak membangun ulang modal.
    syncMapUploadGeoReferenceDom_();

    if (rafPending === null) {
      rafPending = requestAnimationFrame(paint_);
    }
  };
  // [BARU -- perbaiki 2-modal-tumpang-tindih sesaat] paint_() dijadwalkan lewat
  // requestAnimationFrame (jalan di FRAME BERIKUTNYA), sementara render() akhir (saat
  // proses 100% selesai) jalan SINKRON segera setelah await tryParseGeoPdf_ resolve --
  // ada celah waktu sempit di mana KEDUANYA bisa "berebut" DOM di frame yg sama: paint_()
  // masih mencari elemen progress-bar LAMA yg mungkin sudah/sedang diganti render() dgn
  // DOM sukses yg baru. .stop() dipanggil pemanggil TEPAT SEBELUM render() akhir supaya
  // paint_() yg masih ter-jadwal jadi no-op total -- tidak ada lagi peluang tabrakan.
  reporter.stop = () => {
    stopped = true;
    if (rafPending) {
      // V17.1 FIX-1: cancel the queued progress paint instead of allowing a
      // stale frame to run after GeoPDF lifecycle completion.
      try { cancelAnimationFrame(rafPending); } catch (_) {}
      rafPending = false;
    }
  };
  return reporter;
}

function paintMapUploadGeoPdfUi_() {
  try {
    const f = mapUploadFormState || {};
    const statusEl = document.getElementById('map-upload-status');
    const progressTextEl = document.getElementById('map-upload-progress-text');
    const previewEl = document.getElementById('map-upload-preview');
    const lockNoteEl = document.getElementById('map-upload-geo-lock-note');
    const saveBtn = document.getElementById('map-upload-save-btn');
    const fillEl = document.getElementById('map-upload-progress-fill');

    const fields = [
      ['map-upload-tl-timur', f.tlTimur],
      ['map-upload-tl-utara', f.tlUtara],
      ['map-upload-br-timur', f.brTimur],
      ['map-upload-br-utara', f.brUtara]
    ];
    for (const [id, value] of fields) {
      const el = document.getElementById(id);
      if (!el) continue;
      const v = value == null ? '' : String(value);
      if (el.value !== v) el.value = v;
      el.readOnly = !!f.geoReference;
      el.disabled = !!f.geoReference;
    }

    const msg = String(mapUploadStatusMsg || 'Memproses GeoPDF...');
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.classList.toggle('text-emerald-400', !!mapUploadStatusOk);
      statusEl.classList.toggle('text-rose-400', !mapUploadStatusOk);
      statusEl.classList.toggle('text-amber-300', mapUploadStatusOk && /peringatan|warning/i.test(msg));
    }
    if (progressTextEl) progressTextEl.textContent = msg;

    if (fillEl) {
      const pct = mapUploadProcessing ? 0 : (f.fileDataUrl ? 100 : 0);
      fillEl.style.width = pct + '%';
    }

    if (previewEl) {
      if (f.fileDataUrl) {
        if (previewEl.src !== f.fileDataUrl) previewEl.src = f.fileDataUrl;
        previewEl.classList.remove('hidden');
      } else {
        previewEl.removeAttribute('src');
        previewEl.classList.add('hidden');
      }
    }

    if (lockNoteEl) lockNoteEl.classList.toggle('hidden', !f.geoReference);

    if (saveBtn) {
      const busy = !!mapUploadBusy || !!mapUploadProcessing;
      saveBtn.disabled = busy;
      saveBtn.innerHTML = busy
        ? '<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"></span><span>' +
          (mapUploadProcessing ? 'Memproses GeoPDF...' : 'Menyimpan...') + '</span>'
        : icon('upload','w-4 h-4') + '<span>Simpan Peta</span>';
    }
  } catch (_) {}
}

async function handleMapImageFileSelected_(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  // V15.14: retain the browser File object for the runtime GeoPDF source registry.
  mapUploadRuntimeFile_ = file;
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
    // V17 NO FLICKER: GeoPDF - jangan render() full, cuma update status modal
    mapUploadStatusMsg = 'Membaca koordinat dari GeoPDF...'; mapUploadStatusOk = true; mapUploadProcessing = true;
    try { paintMapUploadGeoPdfUi_(); } catch(_) {}
    // Jangan render() full map di belakang modal - biar tidak kedip
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
      // V17 NO FLICKER: Jangan render() full map saat modal masih proses - cuma sync DOM form
      syncMapUploadGeoReferenceDom_();
      paintMapUploadGeoPdfUi_();
      // Re-apply after next frame tanpa render() full. RAF ini dikelola eksplisit
      // agar tidak tertinggal saat lifecycle GeoPDF masuk ke done/save/close.
      cancelApplyGeoReferenceRaf_();
      applyGeoRefRafId_ = requestAnimationFrame(() => {
        applyGeoRefRafId_ = null;
        if (!geoReferenceReady) return;
        syncMapUploadGeoReferenceDom_();
        paintMapUploadGeoPdfUi_();
      });
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
    cancelApplyGeoReferenceRaf_();
    mapUploadProcessing = false;
    progressReporter.stop();
    paintMapUploadGeoPdfUi_();
    return;
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

// STEP C2 - ADAPTIVE VISIBLE TILE RENDER V1 (OPT-IN FIELD TEST)
// Hanya aktif bila window.mg1AdaptiveC2Enabled === true.
// Prinsip: level terendah tetap lengkap untuk preview/fallback; level di atasnya
// hanya merender tile yang berada di viewport + prefetch ring. Renderer PDF.js,
// transform GeoReference, gesture, dan jalur V13.1 tetap dipertahankan.

// V15.2 STEP A — TILE IDENTITY
// Tile menjadi unit mandiri: level + x + y. Tidak mengubah visual, gesture, C1/C2,
// factor 1.55x, atau ukuran tile. Identity ini menjadi fondasi cache/queue berikutnya.

// V15.3 STEP B — PERSISTENT BASE TILE LAYER
// BASE bukan lagi sekadar level pertama yang kebetulan dipilih renderer.
// Metadata ini menetapkan BASE sebagai layer permanen/full-coverage yang menjadi
// safety surface saat DETAIL berubah. Tidak menduplikasi dataUrl/tile di store.

// V15.7 STEP D — PERSISTENT TILE STORE INDEX
// Tile data tetap disimpan satu kali di level.tiles. Store ini hanya menyimpan
// identity -> lokasi tile, sehingga renderer/queue berikutnya dapat mengambil tile
// tanpa membangun ulang pyramid atau menduplikasi dataUrl.
// V15.8 STEP E — PERSISTENT TILE QUEUE REGISTRY
// Queue hanya mengatur identity/lifecycle bookkeeping. Tidak merender ulang tile,
// tidak melakukan culling/prefetch, dan tidak mengubah visual/gesture/viewport.

// === STEP 8.10B-2 FIX: getVisibleDetailKeysFromPlan_() with pyramid.tileSize alignment ===
// FIX BLOCKER 1: planner tileSize (deviceProfile) ≠ pyramid tileSize (768)
// Jangan pakai plan.visible.minX/maxX langsung sebagai pyramid X/Y
// Hitung visible berdasarkan actual pyramid tiles + viewBox intersection + factor = detailLevel.factor
function getVisibleDetailKeysFromPlan_(pyramid, detailLevel, bounds, viewBox, imgX, imgY, imgW, imgH) {
  try {
    if (!pyramid || !detailLevel || !Array.isArray(detailLevel.tiles)) {
      return { ok:false, keys:[], reason:'pyramid or detailLevel invalid' };
    }
    const factor = Number(detailLevel.factor);
    if (!Number.isFinite(factor)) {
      return { ok:false, keys:[], reason:'detailLevel.factor invalid: ' + (detailLevel && detailLevel.factor) };
    }
    const tileSize = Number(pyramid.tileSize) || 768;
    const levelWidth = Number(detailLevel.width) || 1;
    const levelHeight = Number(detailLevel.height) || 1;
    if (!(levelWidth>0) || !(levelHeight>0)) {
      return { ok:false, keys:[], reason:'level width/height invalid' };
    }

    // pxScale sama seperti di appendLevel() - menjaga alignment dengan compositor
    const pxScaleX = imgW / Math.max(1, levelWidth);
    const pxScaleY = imgH / Math.max(1, levelHeight);
    const stepX = tileSize * pxScaleX;
    const stepY = tileSize * pxScaleY;

    // ViewBox dari getMapViewBox_() - sudah ada di renderMineGridSvg()
    const vb = viewBox;
    if (!vb || !Number.isFinite(vb.x) || !Number.isFinite(vb.w) || !Number.isFinite(vb.h) || stepX <= 0 || stepY <= 0) {
      // Fallback: viewBox tidak tersedia → return semua tile existing (aman)
      const allKeys = detailLevel.tiles.map(t => t.tileKey || t.tileId).filter(Boolean);
      return { ok:true, keys: allKeys, factor, visible: { minX:0, maxX:0, minY:0, maxY:0, count: allKeys.length }, reason:'viewBox fallback to all tiles' };
    }

    const vbX1 = vb.x, vbY1 = vb.y, vbX2 = vb.x + vb.w, vbY2 = vb.y + vb.h;

    // === STEP 8.14 FIX: expected geometry, bukan existing tiles ===
    // Hitung tilesX/Y dari level geometry
    const tilesX = Math.max(1, Math.ceil(levelWidth / tileSize));
    const tilesY = Math.max(1, Math.ceil(levelHeight / tileSize));

    const localX1 = vbX1 - imgX;
    const localX2 = vbX2 - imgX;
    const localY1 = vbY1 - imgY;
    const localY2 = vbY2 - imgY;

    // Koreksi off-by-one sesuai audit 8.14:
    // tile screen X = imgX + x * tileSize * pxScaleX
    let minX = Math.floor(localX1 / stepX);
    let maxX = Math.ceil(localX2 / stepX) - 1;
    let minY = Math.floor(localY1 / stepY);
    let maxY = Math.ceil(localY2 / stepY) - 1;

    // Clamp ke level bounds
    minX = Math.max(0, Math.min(tilesX - 1, minX));
    maxX = Math.max(0, Math.min(tilesX - 1, maxX));
    minY = Math.max(0, Math.min(tilesY - 1, minY));
    maxY = Math.max(0, Math.min(tilesY - 1, maxY));

    // Jika viewBox di luar img, bisa jadi min>max → fallback ke 0 tile? kembalikan 0 untuk safety, biar tidak fallback ke all
    if (minX > maxX || minY > maxY) {
      return { ok:true, keys:[], factor, visible: { minX, maxX, minY, maxY, count:0, empty:true }, visibleTiles:[], detailLevelFactor:factor, pyramidTileSize:tileSize, img:{x:imgX,y:imgY,w:imgW,h:imgH}, viewBox:vb, reason:'viewBox outside img' };
    }

    const keys = [];
    const visibleTiles = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = (typeof makeLithositeTileId_ === 'function') ? makeLithositeTileId_(factor, x, y) : ('L'+factor+'_X'+x+'_Y'+y);
        if (!key) continue;
        keys.push(key);
        // Untuk diagnostic, hitung tx/ty/tw/th sama seperti compositor
        const tx = imgX + x * tileSize * pxScaleX;
        const ty = imgY + y * tileSize * pxScaleY;
        const tw = Math.min(tileSize, levelWidth - x * tileSize) * pxScaleX;
        const th = Math.min(tileSize, levelHeight - y * tileSize) * pxScaleY;
        visibleTiles.push({ x, y, key, tx, ty, tw, th });
      }
    }

    return { 
      ok:true, 
      keys, 
      factor, 
      visible: { minX, maxX, minY, maxY, count: keys.length, tilesX, tilesY },
      visibleTiles,
      detailLevelFactor: factor,
      pyramidTileSize: tileSize,
      img: { x: imgX, y: imgY, w: imgW, h: imgH },
      viewBox: vb,
      reason:'expected geometry 8.14'
    };
  } catch(e) {
    return { ok:false, keys:[], reason: e && e.message ? e.message : 'getVisibleDetailKeys 8.14 error' };
  }
}

// === STEP 8.10B-3: Orchestrator non-blocking untuk existing stored tiles ===
// SYNC, tidak await, tidak block renderMineGridSvg
function ensureRuntimeTiles_NonBlocking_(visibleKeys, pyramid) {
  if (!pyramid || !Array.isArray(visibleKeys) || !visibleKeys.length) {
    return { ok:false, readyMap: Object.create(null), queued:0, missing:[], total:0, reason:'visibleKeys empty' };
  }
  const loader = typeof ensureLithositeRuntimeTileLoader_ === 'function' ? ensureLithositeRuntimeTileLoader_(pyramid) : null;
  if (!loader) return { ok:false, readyMap: Object.create(null), queued:0, missing:[], total: visibleKeys.length, reason:'loader not ready' };

  const readyMap = Object.create(null);
  let queued = 0;
  const missing = [];
  let alreadyLoading = 0;
  let alreadyReady = 0;

  for (let i=0;i<visibleKeys.length;i++) {
    const k = String(visibleKeys[i]);
    if (!k) continue;
    // READY?
    if (loader.cache && loader.cache[k]) {
      readyMap[k] = loader.cache[k];
      alreadyReady++;
      continue;
    }
    if (loader.loading && loader.loading[k]) {
      alreadyLoading++;
      continue;
    }
    // Resolve availability - hanya untuk stored tiles di patch pertama
    try {
      const avail = typeof resolveLithositeDetailTileAvailability_ === 'function' ? resolveLithositeDetailTileAvailability_(pyramid, k) : { status:'missing' };
      if (avail.status === 'available') {
        // STORED ada, perlu runtime loading
        const enqueued = typeof requestLithositeDetailTile_ === 'function' ? requestLithositeDetailTile_(pyramid, k) : false;
        if (enqueued) queued++;
      } else if (avail.status === 'missing') {
        missing.push(k);
        // Untuk 8.10B patch pertama, MISSING hanya ditandai, tidak creation
      }
    } catch(e) {
      missing.push(k);
    }
  }

  return { ok:true, readyMap, queued, missing, total: visibleKeys.length, alreadyReady, alreadyLoading };
}

// === STEP 8.10B-4: Background consumer + surface-only invalidation ===
let mg1RuntimeInvalidationScheduled_ = false;
let mg1RuntimeInvalidationRaf_ = null;
let mg1IsSurfaceInvalidationInProgress_ = false;
let mg1CoalescePending_ = 0;
let mg1CoalesceTimer_ = null;

// STEP 8.29C: coalesce runtime/missing tile updates before one atomic surface swap.
// Geometry/tile selection unchanged; only invalidation timing is grouped.
function scheduleCoalescedInvalidation_(n) {
  const count = Math.max(0, Number(n) || 0);
  if (count > 0) mg1CoalescePending_ += count;
  // STEP 8.29C-R1: fixed 500ms window. Never reset an active window.
  if (mg1CoalesceTimer_) return;
  if (mg1CoalescePending_ <= 0) return;
  mg1CoalesceTimer_ = setTimeout(() => {
    const pending = mg1CoalescePending_;
    mg1CoalescePending_ = 0;
    mg1CoalesceTimer_ = null;
    if (pending > 0) scheduleSurfaceInvalidationOnce_();
  }, 500);
}

function scheduleSurfaceInvalidationOnce_() {
  if (mg1RuntimeInvalidationScheduled_) return;
  if (mg1IsSurfaceInvalidationInProgress_) return;
  mg1RuntimeInvalidationScheduled_ = true;
  try {
    if (mg1RuntimeInvalidationRaf_) cancelAnimationFrame(mg1RuntimeInvalidationRaf_);
  } catch(_) {}
  mg1RuntimeInvalidationRaf_ = requestAnimationFrame(async () => {
    mg1RuntimeInvalidationScheduled_ = false;
    if (mg1IsSurfaceInvalidationInProgress_) return;
    mg1IsSurfaceInvalidationInProgress_ = true;
    try {
      const vp = document.getElementById('mg1-map-viewport');
      if (!vp) {
        mg1IsSurfaceInvalidationInProgress_ = false;
        return;
      }
      // 8.10B-FIX: NO GLOBAL render() fallback - sesuai audit STEP 8.9
      // Hanya surface-only atomic swap, bukan rebuild #app
      if (typeof window.executeAtomicSurfaceSwap_ === 'function' && typeof window.buildNewMapSurfaceV25 === 'function') {
        await window.executeAtomicSurfaceSwap_(vp, window.buildNewMapSurfaceV25);
      } else if (typeof window.executeAtomicSurfaceSwap_ === 'function') {
        const buildFn = () => {
          try {
            const points = typeof buildMapData === 'function' ? buildMapData() : [];
            return typeof renderMineGridSvg === 'function' ? renderMineGridSvg(points) : '';
          } catch(e) { return ''; }
        };
        await window.executeAtomicSurfaceSwap_(vp, buildFn);
      } else {
        // FIX: Hapus fallback requestMapRender_() → log warning saja
        console.warn('[8.10B-4 FIX] Atomic swap not available, skip invalidation. No global render() fallback per STEP 8.9 contract.');
        mg1IsSurfaceInvalidationInProgress_ = false;
        return;
      }
    } catch(e) {
      console.warn('[8.10B-4 FIX] surface invalidation failed', e);
    } finally {
      mg1IsSurfaceInvalidationInProgress_ = false;
    }
  });
}

async function processRuntimeQueueBatch_(pyramid, maxItems) {
  if (!pyramid) return { processed:0, loaded:0, failed:0, pending:0 };
  try {
    const max = Number.isFinite(Number(maxItems)) ? Number(maxItems) : 3;
    const result = typeof consumeLithositeRuntimeDetailQueue_ === 'function' 
      ? await consumeLithositeRuntimeDetailQueue_(pyramid, max)
      : { processed:0, loaded:0, failed:0, pending:0 };
    if (result.loaded > 0) {
      scheduleCoalescedInvalidation_(result.loaded);
    }
    return result;
  } catch(e) {
    console.warn('[8.10B-4] processRuntimeQueueBatch failed', e);
    return { processed:0, loaded:0, failed:0, pending:0, error: String(e) };
  }
}

// V15.9 STEP F — QUEUE CONSUMER / TILE LIFECYCLE EXECUTOR
// Executor generik: hanya memproses queue lifecycle melalui worker yang diberikan.
// Belum melakukan PDF re-render, culling, prefetch, atau perubahan compositor.
async function consumeLithositeTileQueue_(pyramid, worker, maxItems) {
  const q = ensureLithositeTileQueue_(pyramid);
  if (!q || typeof worker !== 'function') return { processed: 0, loaded: 0, failed: 0, pending: q ? q.pending.length : 0 };
  const limit = Number.isFinite(Number(maxItems)) && Number(maxItems) > 0 ? Math.floor(Number(maxItems)) : 1;
  let processed = 0, loaded = 0, failed = 0;
  while (processed < limit) {
    const tileKey = dequeueLithositeTileKey_(pyramid);
    if (!tileKey) break;
    processed++;
    try {
      const result = await worker(tileKey, getLithositeTileByKey_(pyramid, tileKey), pyramid);
      if (result === false) throw new Error('Tile worker returned false.');
      markLithositeTileLoaded_(pyramid, tileKey);
      loaded++;
    } catch (err) {
      markLithositeTileFailed_(pyramid, tileKey);
      failed++;
    }
  }
  return { processed, loaded, failed, pending: q.pending.length };
}

// V15.10 STEP G — RUNTIME DETAIL TILE LOADER
// Loader runtime hanya mengambil tile yang SUDAH tersedia di persistent tileStore.
// Tidak melakukan PDF re-render, culling, prefetch, atau perubahan compositor.








// V15.12 STEP I — RUNTIME TILE SOURCE + MISSING DETAIL TILE CREATION
// V15.13 adds persistence of successfully created runtime tiles back to IndexedDB.
// Runtime source memakai File asli yang dipilih user, bukan menyimpan raw PDF bytes
// secara permanen di IndexedDB. Satu tile dibuat per request; setelah selesai resource
// pdf.js ditutup kembali. Tahap ini belum mengubah compositor/gesture/C1/C2.











function getPersistQueueState_(pyramid) {
  const mapId = pyramid && pyramid.runtimeMapId ? String(pyramid.runtimeMapId) : '';
  if (!mapId) return null;
  if (!mg1PersistQueue_[mapId]) mg1PersistQueue_[mapId] = { scheduled:false, pendingPyramid:null, inProgress:false, retryCount:0, timeoutId:null, lastPersistAt:0 };
  return mg1PersistQueue_[mapId];
}
function schedulePersistCoalesced_(pyramid) {
  if (!pyramid || !pyramid.runtimeMapId) return;
  const q = getPersistQueueState_(pyramid);
  if (!q) return;
  q.pendingPyramid = pyramid;
  if (q.inProgress) return;
  if (q.scheduled) return;
  q.scheduled = true;
  const debounceMs = 120;
  try { if (q.timeoutId) clearTimeout(q.timeoutId); } catch(_) {}
  q.timeoutId = setTimeout(async () => { q.scheduled=false; q.timeoutId=null; await executePersistCoalesced_(pyramid.runtimeMapId); }, debounceMs);
}
async function executePersistCoalesced_(runtimeMapId) {
  const mapId = runtimeMapId ? String(runtimeMapId) : '';
  const q = mapId ? mg1PersistQueue_[mapId] : null;
  if (!q || q.inProgress) return;
  const pyramid = q.pendingPyramid;
  if (!pyramid || !pyramid.runtimeMapId || String(pyramid.runtimeMapId)!==mapId) return;
  q.inProgress = true;
  try {
    let entry=null, retries=0;
    while (retries<8) {
      try {
        if (typeof backgroundMapsList !== 'undefined' && Array.isArray(backgroundMapsList)) {
          entry = backgroundMapsList.find(m => m && String(m.id)===mapId);
          if (entry) break;
        }
        await new Promise(r=>setTimeout(r,200)); retries++;
      } catch(_) { await new Promise(r=>setTimeout(r,200)); retries++; }
    }
    if (!entry) { q.inProgress=false; setTimeout(()=>{ if(q.pendingPyramid) schedulePersistCoalesced_(q.pendingPyramid); },500); return; }
    const latestPyramid = q.pendingPyramid || pyramid;
    q.pendingPyramid=null;
    let result=null;
    try { result = await persistLithositeRuntimeTileStore_(latestPyramid); } catch(err) { result={ok:false, reason:err&&err.message}; }
    if (!result || result.ok===false) {
      if (!q.pendingPyramid) q.pendingPyramid=latestPyramid;
      q.inProgress=false; q.retryCount++;
      const backoff=Math.min(2000,300*Math.pow(1.5,q.retryCount));
      setTimeout(()=>{ if(q.pendingPyramid) schedulePersistCoalesced_(q.pendingPyramid); }, backoff);
      return result;
    }
    q.lastPersistAt=Date.now(); q.inProgress=false; q.retryCount=0;
    if (q.pendingPyramid) schedulePersistCoalesced_(q.pendingPyramid);
    return result;
  } catch(e) {
    q.inProgress=false;
    if (!q.pendingPyramid && pyramid) q.pendingPyramid=pyramid;
    setTimeout(()=>{ if(q.pendingPyramid) schedulePersistCoalesced_(q.pendingPyramid); },500);
  }
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
    const rect = (svgEl.parentElement || svgEl).getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const viewW = 320, viewH = 320;
    const viewBox = getMapViewBox_(bounds);
    let svgX = viewBox.x + ((event.clientX - rect.left) / rect.width) * viewBox.w;
    let svgY = viewBox.y + ((event.clientY - rect.top) / rect.height) * viewBox.h;
    if (!Number.isFinite(svgX) || !Number.isFinite(svgY)) return;
    // STEP 7.6F: undo persistent screen rotation before converting tap to native coordinates.
    if (Math.abs(mapRotationDeg_) > 0.0001) {
      const rad = -mapRotationDeg_ * Math.PI / 180;
      const cx = viewW / 2, cy = viewH / 2;
      const dx = svgX - cx, dy = svgY - cy;
      svgX = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
      svgY = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    }
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
    const tilePyramid = await buildTilePyramidDirect_(page, vpBBox, scale, report, geoReference);
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
      tileSize: Number(tilePyramid && tilePyramid.tileSize) || GEOPDF_TILE_SIZE_,
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

// V17.1 NO FLICKER — freeze the currently rendered map outside #app while the
// final render() rebuilds the application DOM. This is a visual shield only;
// it does not alter map state, tiles, gestures, or compositor math.






// V17.1 STEP K — STABLE SAVE + MAP TRANSITION UI
// Selama proses Simpan, jangan panggil render() berulang-ulang. render() mengganti
// app.innerHTML dan dapat membuat map surface berkedip. Status upload diperbarui langsung
// pada DOM yang sudah ada; render() hanya dilakukan sekali setelah lifecycle save selesai.
function paintMapUploadSaveUi_() {
  try {
    const statusEl = document.getElementById('map-upload-status');
    const btn = document.getElementById('map-upload-save-btn');
    if (statusEl) {
      statusEl.textContent = String(mapUploadStatusMsg || 'Memproses...');
      statusEl.classList.toggle('text-emerald-400', !!mapUploadStatusOk);
      statusEl.classList.toggle('text-rose-400', !mapUploadStatusOk);
      statusEl.classList.toggle('text-amber-300', mapUploadStatusOk && /peringatan|warning/i.test(String(mapUploadStatusMsg || '')));
    }
    if (btn) {
      const busy = !!mapUploadBusy || !!mapUploadProcessing;
      btn.disabled = busy;
      btn.innerHTML = busy
        ? '<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"></span><span>' + (mapUploadProcessing ? 'Memproses GeoPDF...' : 'Menyimpan...') + '</span>'
        : icon('upload','w-4 h-4') + '<span>Simpan Peta</span>';
    }
  } catch (_) {}
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
// STEP 7.7: Compass / Heading-Up state. Sensor owns the map rotation while active;
// dual-finger rotate remains available and becomes a temporary manual offset.
let compassRotationOffsetDeg_ = 0;
let compassState_ = {
  active: false,
  supported: false,
  permission: 'unknown',
  headingDeg: null,
  smoothedHeadingDeg: null,
  source: null,
  accuracyDeg: null,
  error: null,
  listenerAttached: false
};
let compassFallbackTimer_ = null;

function normalizeHeadingDeg_(deg) {
  if (!Number.isFinite(deg)) return null;
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}
function normalizeSignedDeg_(deg) {
  if (!Number.isFinite(deg)) return 0;
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}
function getScreenOrientationAngle_() {
  try {
    if (screen && screen.orientation && Number.isFinite(screen.orientation.angle)) return screen.orientation.angle;
  } catch (_) {}
  try {
    if (typeof window.orientation === 'number' && Number.isFinite(window.orientation)) return window.orientation;
  } catch (_) {}
  return 0;
}
function getCompassHeadingFromEvent_(event) {
  if (!event) return null;
  // iOS/WebKit exposes a direct compass heading; prefer it because it is already
  // expressed as clockwise degrees from North.
  if (Number.isFinite(event.webkitCompassHeading)) {
    return { heading: normalizeHeadingDeg_(event.webkitCompassHeading), source: 'webkit-compass', accuracy: Number.isFinite(event.webkitCompassAccuracy) ? event.webkitCompassAccuracy : null };
  }
  // For absolute DeviceOrientation, alpha is counter-clockwise from North, so
  // convert it to the normal compass convention (clockwise from North).
  if (event.absolute === true && Number.isFinite(event.alpha)) {
    const screenAngle = getScreenOrientationAngle_();
    return { heading: normalizeHeadingDeg_(360 - event.alpha + screenAngle), source: 'deviceorientation-absolute', accuracy: null };
  }
  return null;
}
function applyCompassRotationVisual_() {
  if (!compassState_.active || !Number.isFinite(compassState_.smoothedHeadingDeg)) return;
  if (mapPinchState_.active || mapButtonZoomRaf_) return;
  mapRotationDeg_ = normalizeSignedDeg_(-compassState_.smoothedHeadingDeg + compassRotationOffsetDeg_);
  const svg = getMapButtonZoomSvg_();
  if (svg) {
    if (mapPanState_.active) applyPanVisual_(svg, mapPanState_.dx, mapPanState_.dy);
    else svg.style.transform = composeMapTransform_(1, mapRotationDeg_, 0, 0);
  }
  try {
    const arrow = document.querySelector('[data-mg1-compass-arrow="true"]');
    if (arrow) arrow.style.transform = 'rotate(' + mapRotationDeg_.toFixed(3) + 'deg)';
  } catch (_) {}
}
function handleCompassOrientation_(event) {
  if (!compassState_.active) return;
  const data = getCompassHeadingFromEvent_(event);
  if (!data || !Number.isFinite(data.heading)) return;
  const h = data.heading;
  compassState_.headingDeg = h;
  if (compassFallbackTimer_) { clearTimeout(compassFallbackTimer_); compassFallbackTimer_ = null; }
  compassState_.source = data.source;
  compassState_.accuracyDeg = data.accuracy;
  compassState_.error = null;
  if (!Number.isFinite(compassState_.smoothedHeadingDeg)) {
    compassState_.smoothedHeadingDeg = h;
  } else {
    const delta = normalizeSignedDeg_(h - compassState_.smoothedHeadingDeg);
    // Light low-pass smoothing: responsive enough for map use, but avoids
    // magnetic-sensor jitter from shaking the whole map.
    compassState_.smoothedHeadingDeg = normalizeHeadingDeg_(compassState_.smoothedHeadingDeg + delta * 0.22);
  }
  applyCompassRotationVisual_();
}
function detachCompassListeners_() {
  if (typeof window === 'undefined' || !compassState_.listenerAttached) return;
  try { window.removeEventListener('deviceorientationabsolute', handleCompassOrientation_, true); } catch (_) {}
  try { window.removeEventListener('deviceorientation', handleCompassOrientation_, true); } catch (_) {}
  compassState_.listenerAttached = false;
  if (compassFallbackTimer_) { clearTimeout(compassFallbackTimer_); compassFallbackTimer_ = null; }
}
function stopCompassMode_(renderAfter) {
  detachCompassListeners_();
  compassState_.active = false;
  compassState_.headingDeg = null;
  compassState_.smoothedHeadingDeg = null;
  compassState_.source = null;
  compassState_.accuracyDeg = null;
  compassState_.error = null;
  compassRotationOffsetDeg_ = 0;
  if (renderAfter) render();
}
async function startCompassMode_() {
  if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
    compassState_.supported = false;
    compassState_.permission = 'unsupported';
    compassState_.error = 'Sensor arah perangkat tidak tersedia di WebView ini.';
    render();
    return false;
  }
  compassState_.supported = true;
  compassState_.permission = 'unknown';
  compassState_.error = null;
  // Some user agents require explicit permission for absolute orientation.
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission(true);
      compassState_.permission = permission;
      if (permission !== 'granted') {
        compassState_.error = 'Izin sensor arah ditolak.';
        render();
        return false;
      }
    } catch (e) {
      compassState_.permission = 'error';
      compassState_.error = 'Izin sensor arah tidak dapat diminta.';
      render();
      return false;
    }
  } else {
    compassState_.permission = 'not-required';
  }
  detachCompassListeners_();
  compassState_.active = true;
  compassState_.headingDeg = null;
  compassState_.smoothedHeadingDeg = null;
  compassState_.source = null;
  compassState_.error = null;
  // Entering Compass means true Heading-Up: North is derived from the current
  // device heading, without inheriting an old manual rotation.
  compassRotationOffsetDeg_ = 0;
  try { window.addEventListener('deviceorientationabsolute', handleCompassOrientation_, true); } catch (_) {}
  try { window.addEventListener('deviceorientation', handleCompassOrientation_, true); } catch (_) {}
  compassState_.listenerAttached = true;
  // If no absolute event arrives, keep the normal deviceorientation listener alive;
  // some Android WebViews expose absolute=true only on the normal event.
  compassFallbackTimer_ = setTimeout(function() {
    if (compassState_.active && !Number.isFinite(compassState_.headingDeg)) {
      compassState_.error = 'Menunggu sensor kompas...';
      render();
    }
  }, 2500);
  render();
  return true;
}

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



// STEP 5.6: helper geometri pinch-to-zoom.














// V15.4 STEP C — PERSISTENT MAP SURFACE.
// Pan visual tidak lagi mentransform SVG element-nya. SVG tetap berada tepat di dalam
// viewport; yang digeser hanya jendela viewBox terhadap tile BASE yang sudah ada.
// Ini mencegah container membuka area kosong/navy ketika surface tidak ikut diperbesar.


















// Konversi 1 titik Timur/Utara -> koordinat SVG (x,y). SVG y-axis terbalik dari Utara
// (Utara makin besar = "ke atas" secara peta, tapi SVG y makin besar = "ke bawah") --
// makanya utara di-flip di rumus y.
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
function renderMineGridSvg(points) {
  // STEP 8.21D MINIMAL FIX: hoist counters to top to avoid TDZ - diagnostic/compositor only
  var mg1RuntimeUsedCount_ = 0;
  var mg1FallbackCount_ = 0;
  ensureMapContextBlocker_();
  const bounds = computeResponsiveDisplayBounds_(points);
  const viewW = 320, viewH = 320;
  if (!bounds) return '';
  // Zoom diterapkan lewat viewBox SVG (bukan transform per-titik) -- viewBox lebih kecil
  // = area yg sama ditampilkan lebih besar (efek perbesar). STEP 5.3: pusat viewBox
  // mengikuti persistent viewport state; titik tap tidak pernah menjadi anchor.
  const viewBox = getMapViewBox_(bounds);
  const valid = points.filter(p => p.hasValidCoord);
  let svg = '<svg viewBox="' + viewBox.x + ' ' + viewBox.y + ' ' + viewBox.w + ' ' + viewBox.h + '" class="w-full h-full" data-map-gesture="true" oncontextmenu="return false" onselectstart="return false" ondragstart="return false" style="pointer-events:auto; touch-action:none; overflow:hidden; will-change:transform; transition:none; transform-origin:50% 50%; transform:rotate(' + mapRotationDeg_.toFixed(4) + 'deg); -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; -webkit-user-drag:none;" onclick="handleMapTap_(event)" ontouchstart="handleMapTouchStart_(event)" ontouchmove="handleMapTouchMove_(event)" ontouchend="handleMapTouchEnd_(event)" ontouchcancel="handleMapTouchEnd_(event)" onpointerdown="handleMapPointerDown_(event)" onpointermove="handleMapPointerMove_(event)" onpointerup="handleMapPointerUp_(event)" onpointercancel="handleMapPointerCancel_(event)">';
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
        // STEP 8.19 FIX: counters
        // V15.1 SEAMLESS 2-LAYER DISPLAY:
        //   BASE 0.25x = always rendered first and covers the full GeoPDF extent.
        //   DETAIL     = selected higher-resolution level rendered on top.
        // If detail is incomplete/outside its viewport window, BASE remains visible.
        const maxFactor = Math.max(...pyramid.levels.map(l => Number(l.factor) || 0));
        let targetFactor = maxFactor;
        if (mapZoom <= 1.5) targetFactor = Math.min(0.25, maxFactor);
        else if (mapZoom <= 2.5) targetFactor = Math.min(0.5, maxFactor);

        // V15.3 STEP B: BASE layer is resolved from explicit persistent metadata.
        // Legacy pyramids without baseLayer remain compatible via the old fallback.
        const baseMeta = pyramid.baseLayer && pyramid.baseLayer.persistent ? pyramid.baseLayer : null;
        const baseLevel = (baseMeta && pyramid.levels[baseMeta.levelIndex])
          || pyramid.levels.find(l => Math.abs(Number(l.factor) - 0.25) < 0.0001)
          || pyramid.levels[0];
        let detailLevel = pyramid.levels[0];
        for (const candidate of pyramid.levels) {
          if (Number(candidate.factor) <= targetFactor) detailLevel = candidate;
        }
        // On LOW/C2 the stored detail is the tested 1.55x layer. Keep it as detail
        // even when targetFactor is below it; BASE is the visual fallback.
        if (detailLevel === baseLevel && pyramid.levels.length > 1) {
          detailLevel = pyramid.levels[pyramid.levels.length - 1];
        }

        // === STEP 8.10B-FIX HOOK: Non-blocking runtime orchestration with tileSize alignment ===
        // FIX BLOCKER 1: pakai actual pyramid tiles + viewBox intersection, bukan planner indices langsung
        // BASE tetap fallback visual, appendLevel() 100% untouched
        try {
          try { if (typeof window !== 'undefined') { window.mg1LastPyramidCheck = { hasPyramid: !!pyramid, hasDetail: !!detailLevel, pyramidLevels: pyramid && pyramid.levels ? pyramid.levels.length : 0 }; } } catch(_) {}
          if (pyramid && detailLevel) {
            const visibleResult = typeof getVisibleDetailKeysFromPlan_ === 'function' 
              ? getVisibleDetailKeysFromPlan_(pyramid, detailLevel, bounds, viewBox, imgX, imgY, imgW, imgH) 
              : { ok:false, keys:[] };
            // STEP 8.21D: record visibleResult regardless of ok
            try { if (typeof window !== 'undefined') { window.mg1LastVisibleResult = visibleResult; window.mg1LastDetailFactor = detailLevel ? detailLevel.factor : null; window.mg1LastTargetFactor = targetFactor; } } catch(_) {}
            if (visibleResult.ok && visibleResult.keys.length) {
              const runtimeResult = typeof ensureRuntimeTiles_NonBlocking_ === 'function' ? ensureRuntimeTiles_NonBlocking_(visibleResult.keys, pyramid) : { ok:false, queued:0, missing:[], alreadyReady:0, alreadyLoading:0 };
              if (runtimeResult.ok && runtimeResult.queued > 0) {
                // Background consumer - jangan await di render path, jangan block compositor
                setTimeout(() => {
                  try {
                    processRuntimeQueueBatch_(pyramid, 3);
                  } catch(_) {}
                }, 0);
              }
              // STEP 8.14: Missing worker - async, 1-2/batch, in-flight protection, tidak block render
              if (runtimeResult.ok && Array.isArray(runtimeResult.missing) && runtimeResult.missing.length > 0) {
                setTimeout(() => {
                  try {
                    const mapIdForMissing = (typeof activeBackgroundMapId !== 'undefined' && activeBackgroundMapId) ? activeBackgroundMapId : (typeof activeMap !== 'undefined' && activeMap ? activeMap.id : null);
                    processMissingCreationBatch_(pyramid, mapIdForMissing, runtimeResult.missing, 2);
                  } catch(_) {}
                }, 50);
              }
              // STEP 8.21D - ALWAYS set diagnostics, even when visibleResult not ok, to debug undefined
              if (typeof window !== 'undefined') {
                try { window.mg1LastPyramid = pyramid; } catch(_) {}
                try {
                  window.mg1LastVisibleResult = visibleResult;
                  window.mg1LastRuntimeResult = runtimeResult;
                } catch(_) {}
                try {
                  window.mg1LastRuntimeOrchestration = {
                    visibleKeys: visibleResult && visibleResult.keys ? visibleResult.keys.length : 0,
                    ok: visibleResult ? visibleResult.ok : false,
                    reason: visibleResult ? visibleResult.reason : 'no-result',
                    factor: visibleResult ? visibleResult.factor : null,
                    pyramidTileSize: visibleResult ? visibleResult.pyramidTileSize : null,
                    queued: runtimeResult ? runtimeResult.queued : 0,
                    alreadyReady: runtimeResult ? runtimeResult.alreadyReady : 0,
                    alreadyLoading: runtimeResult ? runtimeResult.alreadyLoading : 0,
                    missing: runtimeResult && Array.isArray(runtimeResult.missing) ? runtimeResult.missing.length : 0,
                    runtimeUsed: mg1RuntimeUsedCount_,
                    fallback: mg1FallbackCount_,
                    viewBox: visibleResult ? visibleResult.viewBox : null,
                    img: visibleResult ? visibleResult.img : null,
                    detailFactor: detailLevel ? detailLevel.factor : null,
                    targetFactor: typeof targetFactor !== 'undefined' ? targetFactor : null,
                    pyramidLevels: pyramid && pyramid.levels ? pyramid.levels.map(l=>({factor:l.factor, tiles:l.tiles?l.tiles.length:0})) : null,
                    timestamp: Date.now()
                  };
                } catch(e2) {
                  console.warn('[8.21D] diagnostic assignment failed', e2);
                  window.mg1LastRuntimeOrchestration = { error: String(e2), ok:false, reason:'assignment-failed' };
                }
              }
            }
          }
        } catch(e) {
          console.warn('[8.10B-FIX] runtime hook failed', e);
        }

        const tileSize = Number(pyramid.tileSize) || GEOPDF_TILE_SIZE_;
        // STEP 8.11-PATCH: compositor memakai runtime cache bila READY, fallback t.dataUrl
        const appendLevel = (level, layerName, opacity) => {
          if (!level || !Array.isArray(level.tiles)) return;
          const pxScaleX = imgW / Math.max(1, Number(level.width) || 1);
          const pxScaleY = imgH / Math.max(1, Number(level.height) || 1);
          for (const t of level.tiles) {
            const tx = imgX + t.x * tileSize * pxScaleX;
            const ty = imgY + t.y * tileSize * pxScaleY;
            const tw = t.width * pxScaleX, th = t.height * pxScaleY;
            // Resolve tileKey: L<factor>_X<x>_Y<y>
            let tileKey = t.tileKey || t.tileId || null;
            if (!tileKey && typeof makeLithositeTileId_ === 'function') {
              try { tileKey = makeLithositeTileId_(level.factor, t.x, t.y); } catch(_) {}
            }
            let href = t.dataUrl;
            let isRuntime = 0;
            try {
              if (tileKey && typeof getLithositeRuntimeTile_ === 'function') {
                const rt = getLithositeRuntimeTile_(pyramid, tileKey);
                if (rt) {
                  // rt = { key, tile, image } — image sudah onload (RUNTIME_READY)
                  if (rt.tile && rt.tile.dataUrl) href = rt.tile.dataUrl;
                  else if (rt.image && rt.image.src) href = rt.image.src;
                  isRuntime = 1;
                  mg1RuntimeUsedCount_++;
                } else {
                  mg1FallbackCount_++;
                }
              } else {
                mg1FallbackCount_++;
              }
            } catch(_) {
              mg1FallbackCount_++;
            }
            svg += '<image data-map-layer="' + layerName + '" data-runtime="' + isRuntime + '" data-key="' + (tileKey||'') + '" href="' + href + '" x="' + tx + '" y="' + ty + '" width="' + tw + '" height="' + th + '" decoding="sync" preserveAspectRatio="none" opacity="' + opacity + '" draggable="false" oncontextmenu="return false" style="-webkit-user-drag:none; pointer-events:none;"' + clipAttr + '/>';
          }
        };

        appendLevel(baseLevel, 'base', '0.94');
        if (detailLevel && detailLevel !== baseLevel) appendLevel(detailLevel, 'detail', '0.98');
        // STEP 8.29A: compositor diagnostics are snapshotted only after all layers are appended.
        try { window.mg1LastCompositorStats = { runtimeUsed: mg1RuntimeUsedCount_, fallback: mg1FallbackCount_ }; } catch(_) {}
        try {
          if (window.mg1LastRuntimeOrchestration) window.mg1LastRuntimeOrchestration.runtimeUsed = mg1RuntimeUsedCount_;
        } catch(_) {}
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
  // V14.0: ukuran marker GPS mengikuti skala viewport. Koordinat GPS tetap identik.
  if (gpsState_.active && gpsState_.status === 'ok' && gpsState_.native) {
    const gpsRaw = projectToSvg(gpsState_.native.x, gpsState_.native.y, bounds, viewW, viewH);
    const gpsMarkerScale = Math.max(0.4, Math.min(1.25, 1 / Math.max(1, Number(mapZoom) || 1)));
    const gpsRingR = 11 * gpsMarkerScale;
    const gpsDotR = 4 * gpsMarkerScale;
    const gpsStroke = Math.max(1, 2 * gpsMarkerScale);
    svg += '<g aria-label="Posisi GPS" pointer-events="none">' +
      '<circle cx="' + gpsRaw.x + '" cy="' + gpsRaw.y + '" r="' + gpsRingR.toFixed(2) + '" fill="none" stroke="#22d3ee" stroke-width="' + gpsStroke.toFixed(2) + '" opacity="0.85"/>' +
      '<circle cx="' + gpsRaw.x + '" cy="' + gpsRaw.y + '" r="' + gpsDotR.toFixed(2) + '" fill="#22d3ee" stroke="#0b1329" stroke-width="' + gpsStroke.toFixed(2) + '"/>' +
      '</g>';
  }
  // STEP 8E: marker hasil tap. Pointer-events none agar tidak mengganggu tap berikutnya.
  // STEP 5.3: posisi dihitung ULANG tiap render dari native (bukan svg statis) -- kalau
  // tidak, posisi marker jadi USANG begitu viewBox berpindah (mis. saat zoom-anchor aktif).
  if (mapTapState_.active && mapTapState_.native) {
    const tp = projectToSvg(mapTapState_.native.x, mapTapState_.native.y, bounds, viewW, viewH);
    // V14.3: Titik Tap juga true-adaptive. Visual di-anchor pada koordinat tap
    // sehingga deep zoom mengecilkan crosshair tanpa menggeser titik koordinat.
    const tapZoom = Math.max(1, Number(mapZoom) || 1);
    const tapScale = 1 / Math.pow(tapZoom, 1.25);
    const tapVisualTransform = 'translate(' + tp.x.toFixed(3) + ' ' + tp.y.toFixed(3) + ') scale(' + tapScale.toFixed(6) + ') translate(' + (-tp.x).toFixed(3) + ' ' + (-tp.y).toFixed(3) + ')';
    svg += '<g aria-label="Koordinat tap" pointer-events="none" transform="' + tapVisualTransform + '">' +
      '<circle cx="' + tp.x + '" cy="' + tp.y + '" r="7" fill="none" stroke="#facc15" stroke-width="2"/>' +
      '<line x1="' + (tp.x-10) + '" y1="' + tp.y + '" x2="' + (tp.x+10) + '" y2="' + tp.y + '" stroke="#facc15" stroke-width="1"/>' +
      '<line x1="' + tp.x + '" y1="' + (tp.y-10) + '" x2="' + tp.x + '" y2="' + (tp.y+10) + '" stroke="#facc15" stroke-width="1"/>' +
      '</g>';
  }
  // V14.2: TRUE adaptive TP/Validasi marker.
  // V14.1 mengecilkan radius elemen secara langsung. V14.2 mengunci anchor visual
  // pada koordinat raw (x,y) dan memberi counter-scale pada GROUP marker.
  // Effective screen scale ~= mapZoom * mapZoom^(-1.25) = mapZoom^(-0.25),
  // sehingga deep zoom membuat marker benar-benar mengecil secara bertahap.
  // Koordinat native/raw tidak pernah diubah.
  const tpMarkerZoom = Math.max(1, Number(mapZoom) || 1);
  const tpCounterScale = 1 / Math.pow(tpMarkerZoom, 1.25);
  const tpMarkerScale = Math.max(0.35 / tpMarkerZoom, tpCounterScale);
  const tpMarkerR = 7;
  const tpCoreR = 2.5;
  const tpStroke = 2;
  const tpRingR = 10.5;
  const tpRingStroke = 1.5;
  const tpMeasureStroke = 2;
  const tpHitR = 9;
  valid.forEach(p => {
    const raw = projectToSvg(parseFloat(p.timur), parseFloat(p.utara), bounds, viewW, viewH);
    const preset = getGradeColorPreset(p.classGrade);
    const fillColor = { merah:'#f43f5e', abu:'#94a3b8', kuning:'#f59e0b', biru:'#3b82f6', hijau:'#22c55e' }[
      (globalCOGConfig && globalCOGConfig['Warna_' + p.classGrade]) || GRADE_COLOR_DEFAULTS[p.classGrade] || 'abu'
    ];
    const visualTransform = 'translate(' + raw.x.toFixed(3) + ' ' + raw.y.toFixed(3) + ') scale(' + tpMarkerScale.toFixed(6) + ') translate(' + (-raw.x).toFixed(3) + ' ' + (-raw.y).toFixed(3) + ')';
    // v90.2.115: TP dgn koordinat konflik ditandai cincin kuning putus-putus.
    const conflictRing = p.coordConflict
      ? '<circle cx="' + raw.x + '" cy="' + raw.y + '" r="' + tpRingR + '" fill="none" stroke="#f59e0b" stroke-width="' + tpRingStroke + '" stroke-dasharray="3,2"/>'
      : '';
    // Cincin kuning solid utk titik yg sedang dipilih di Mode Ukur.
    const measureSelectedRing = (measureModeActive && (p.idTp === measureFromIdTp || p.idTp === measureToIdTp))
      ? '<circle cx="' + raw.x + '" cy="' + raw.y + '" r="' + tpRingR + '" fill="none" stroke="#facc15" stroke-width="' + tpMeasureStroke + '"/>'
      : '';
    const safeId = p.idTp.replace(/'/g,"\\'");
    // Visual marker di-counter-scale terhadap viewBox dengan anchor (x,y) yang terkunci.
    // Hit target sengaja berada di luar group visual agar ukuran area sentuh tetap nyaman.
    svg += '<g onclick="handleMapPointTap_(\'' + safeId + '\')" style="cursor:pointer;">' +
      '<circle cx="' + raw.x + '" cy="' + raw.y + '" r="' + tpHitR + '" fill="transparent" stroke="none" pointer-events="all"/>' +
      '<g transform="' + visualTransform + '" pointer-events="none">' +
      conflictRing +
      measureSelectedRing +
      '<circle cx="' + raw.x + '" cy="' + raw.y + '" r="' + tpMarkerR + '" fill="' + fillColor + '" fill-opacity="0.25" stroke="' + fillColor + '" stroke-width="' + tpStroke + '"/>' +
      '<circle cx="' + raw.x + '" cy="' + raw.y + '" r="' + tpCoreR + '" fill="' + fillColor + '"/>' +
      '</g>' +
      '</g>';
  });
  svg += '</svg>';
  return svg;
}







// "Crosshair" = reset tampilan ke fit area peta/responsive viewport -- BUKAN GPS lokasi user (poin desain #4,
// GPS Generic sengaja tidak dikerjakan krn tidak ada sumber Lat/Long sama sekali).


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
async function setNorthMode_(mode) {
  if (mode === 'compass') {
    northMode = 'compass';
    const ok = await startCompassMode_();
    if (!ok) {
      // Keep the selected mode visible so the user can see the sensor/permission error.
      render();
    }
    return;
  }
  if (compassState_.active) stopCompassMode_(false);
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
    rotationDeg = convergenceInfo.ok ? -convergenceInfo.convergenceDeg : 0;
  } else if (northMode === 'compass') {
    rotationDeg = Number.isFinite(mapRotationDeg_) ? mapRotationDeg_ : 0;
  }

  const modeLabel = northMode === 'grid' ? 'GRID' : (northMode === 'true' ? 'TRUE' : 'GPS');
  const arrowSvg = '<svg data-mg1-compass-arrow="true" width="14" height="14" viewBox="0 0 24 24" fill="none" style="transform:rotate(' + rotationDeg.toFixed(4) + 'deg);transition:transform .12s linear;display:block">' +
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
  } else if (northMode === 'compass') {
    rows.push(['Heading', Number.isFinite(compassState_.smoothedHeadingDeg) ? compassState_.smoothedHeadingDeg.toFixed(1) + '\u00b0' : '--']);
    rows.push(['Sumber', compassState_.source || '--']);
    rows.push(['Akurasi', Number.isFinite(compassState_.accuracyDeg) ? '±' + compassState_.accuracyDeg.toFixed(0) + '\u00b0' : '--']);
    rows.push(['Status', compassState_.error ? compassState_.error : (Number.isFinite(compassState_.headingDeg) ? 'ACTIVE' : 'MENUNGGU SENSOR')]);
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
      '<button onclick="setNorthMode_(\'compass\')" class="flex-1 py-1.5 rounded-lg text-[10px] font-bold ' + (northMode==='compass' ? 'bg-[#2563eb] text-white' : 'bg-white/[0.06] text-white/50') + '">GPS</button>' +
    '</div>' +
    rowsHtml +
    '<div class="mt-2 pt-2 border-t border-white/[0.06] text-[9px] text-white/30 leading-relaxed">' + (northMode === 'compass' ? 'Heading-Up memakai sensor orientasi absolut perangkat. Kalibrasi kompas tetap diperlukan bila heading tidak stabil.' : 'Compass (GPS) siap diaktifkan dari mode GPS.') + '</div>' +
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
    '<div class="w-full max-w-md bg-[#0b1329] border-t border-white/10 rounded-t-[20px] p-5 overflow-y-auto" style="max-height:calc(var(--mg1-vvh, 100svh) * 0.75);" onclick="event.stopPropagation()">' +
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



// ==== RENDER: Panel Kelola Peta Background ====


// ==== RENDER: Form Upload Peta Background ====


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


// ==== RENDER: Form Upload KML ====


/* ============================================================
 * V22 FIXED-2 RUNTIME MERGE
 * Merged into the canonical runtime filename: scripts/peta.js
 * Non-destructive atomic map surface swap.
 * ============================================================ */
/* V22 ATOMIC SWAP FIXED - SVGImageElement vs HTMLImageElement
 * FIX: SVG <image> tidak punya .decode(), harus pakai new Image() loader dari href
 * + Cancel swap saat timeout, tahan map lama, jangan tampilkan incomplete frame
 * Implementasi persis koreksi user untuk arsitektur V17.1
 */



/* ===== V19 NEW MODAL UX INTEGRATED ===== */
/* V19 NEW MODAL UX - NO FLICKER NO GLITCH
 * Modal import GeoPDF isolasi total dari render() global.
 * - Hidup di document.body, di luar #app
 * - Tidak pernah manggil render() selama proses baca + pyramid
 * - Progress update via direct DOM, bukan via global state + render()
 * - Pas Simpan: capture overlay peta lama, tutup modal, 1x render() final + fade
 * Cara pakai: load file ini SETELAH peta.js, lalu panggil window.MG1NewMapModal.open()
 * Tombol "Tambah Peta Baru" yang lama otomatis di-override ke modal baru.
 */

(function(){
  console.log('[V19 NEW MODAL] Loading isolated no-flicker modal');

  // State isolated - tidak pakai mapUploadFormState global
  const state = {
    open: false,
    file: null,
    fileName: '',
    name: '',
    fileDataUrl: '',
    geoReference: null,
    tilePyramid: null,
    cornerTL: null,
    cornerBR: null,
    busy: false,
    processing: false,
    statusMsg: '',
    statusOk: true,
    progress: 0
  };

  let els = {};
  let progressRaf = null;
  let lastProgress = -1;

  function ensureDom() {
    if(document.getElementById('mg1-new-map-modal-root')) {
      els.root = document.getElementById('mg1-new-map-modal-root');
      els.backdrop = document.getElementById('mg1-new-modal-backdrop');
      els.panel = document.getElementById('mg1-new-modal-panel');
      els.nameInput = document.getElementById('mg1-new-modal-name');
      els.fileInput = document.getElementById('mg1-new-modal-file');
      els.fileLabel = document.getElementById('mg1-new-modal-file-label');
      els.preview = document.getElementById('mg1-new-modal-preview');
      els.coords = document.getElementById('mg1-new-modal-coords');
      els.status = document.getElementById('mg1-new-modal-status');
      els.progressBar = document.getElementById('mg1-new-modal-progress');
      els.progressFill = document.getElementById('mg1-new-modal-progress-fill');
      els.saveBtn = document.getElementById('mg1-new-modal-save');
      return;
    }

    const root = document.createElement('div');
    root.id = 'mg1-new-map-modal-root';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:none;';
    root.innerHTML = `
      <div id="mg1-new-modal-backdrop" style="position:absolute;inset:0;background:rgba(3,8,20,0.78);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;transition:opacity 220ms ease;"></div>
      <div id="mg1-new-modal-panel" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-44%) scale(0.96);width:min(92vw,420px);max-height:86vh;overflow:auto;background:#0e1933;border:1px solid rgba(255,255,255,0.12);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08);opacity:0;transition:all 280ms cubic-bezier(0.16,1,0.3,1);">
        <div style="position:sticky;top:0;z-index:2;background:rgba(14,25,51,0.9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:18px 18px 12px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:14px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Tambah Peta Baru</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px;">GeoPDF / GeoTIFF / PNG-JPG + koordinat auto</div>
          </div>
          <button id="mg1-new-modal-close" style="width:32px;height:32px;border-radius:9999px;background:rgba(255,255,255,0.08);border:none;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.6);font-size:16px;">✕</button>
        </div>
        <div style="padding:16px 18px 18px;">
          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:10px;color:rgba(255,255,255,0.45);margin-bottom:6px;font-weight:600;letter-spacing:0.04em;">NAMA PETA</label>
            <input id="mg1-new-modal-name" placeholder="cth. Foto Udara Avenza Sep 2025" style="width:100%;background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:10px 12px;font-size:13px;color:#fff;outline:none;transition:border 0.2s;" />
          </div>
          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:10px;color:rgba(255,255,255,0.45);margin-bottom:6px;font-weight:600;">GAMBAR PETA (PNG,JPG,GeoTIFF,GeoPDF)</label>
            <input type="file" id="mg1-new-modal-file" accept=".png,.jpg,.jpeg,.tif,.tiff,.pdf" style="display:none;" />
            <button id="mg1-new-modal-pick" style="width:100%;background:rgba(37,99,235,0.12);border:1px dashed rgba(37,99,235,0.4);border-radius:12px;padding:12px;font-size:12px;font-weight:700;color:#60a5fa;">+ Pilih File</button>
            <div id="mg1-new-modal-file-label" style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.35);">Tidak ada file dipilih</div>
          </div>
          <div id="mg1-new-modal-preview" style="display:none;margin-bottom:12px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);background:#0b1329;"></div>
          <div id="mg1-new-modal-coords" style="display:none;margin-bottom:12px;background:rgba(255,255,255,0.04);border-radius:12px;padding:10px 12px;"></div>
          <div id="mg1-new-modal-progress" style="display:none;margin-bottom:12px;">
            <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:9999px;overflow:hidden;">
              <div id="mg1-new-modal-progress-fill" style="height:100%;width:0%;background:linear-gradient(90deg,#2563eb,#60a5fa);transition:width 0.2s ease;"></div>
            </div>
            <div id="mg1-new-modal-status" style="margin-top:8px;font-size:11px;font-weight:500;color:rgba(255,255,255,0.7);"></div>
          </div>
          <button id="mg1-new-modal-save" style="width:100%;background:linear-gradient(180deg,#2563eb,#1d4ed8);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:800;color:#fff;box-shadow:0 4px 16px rgba(37,99,235,0.4);transition:all 0.2s;opacity:0.5;pointer-events:none;">Simpan Peta</button>
          <div style="margin-top:10px;text-align:center;font-size:9px;color:rgba(255,255,255,0.25);line-height:1.4;">Koordinat auto-detect dari GeoPDF/GeoTIFF. Cek ulang sebelum Simpan.<br/>Peta disimpan di HP (IndexedDB) - tidak perlu internet lagi.</div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    // cache els
    els.root = root;
    els.backdrop = document.getElementById('mg1-new-modal-backdrop');
    els.panel = document.getElementById('mg1-new-modal-panel');
    els.nameInput = document.getElementById('mg1-new-modal-name');
    els.fileInput = document.getElementById('mg1-new-modal-file');
    els.fileLabel = document.getElementById('mg1-new-modal-file-label');
    els.preview = document.getElementById('mg1-new-modal-preview');
    els.coords = document.getElementById('mg1-new-modal-coords');
    els.status = document.getElementById('mg1-new-modal-status');
    els.progressBar = document.getElementById('mg1-new-modal-progress');
    els.progressFill = document.getElementById('mg1-new-modal-progress-fill');
    els.saveBtn = document.getElementById('mg1-new-modal-save');

    // events
    document.getElementById('mg1-new-modal-close').onclick = close;
    document.getElementById('mg1-new-modal-pick').onclick = () => els.fileInput.click();
    els.backdrop.onclick = close;
    els.fileInput.onchange = onFileSelected;
    els.nameInput.oninput = (e) => { state.name = e.target.value; validate(); };
    els.saveBtn.onclick = onSave;
  }

  function open() {
    ensureDom();
    state.open = true;
    els.root.style.display = 'block';
    // animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        els.backdrop.style.opacity = '1';
        els.panel.style.opacity = '1';
        els.panel.style.transform = 'translate(-50%,-50%) scale(1)';
      });
    });
    // reset
    reset();
  }

  function close() {
    if(!state.open) return;
    els.backdrop.style.opacity = '0';
    els.panel.style.opacity = '0';
    els.panel.style.transform = 'translate(-50%,-44%) scale(0.96)';
    setTimeout(() => {
      els.root.style.display = 'none';
      state.open = false;
    }, 260);
  }

  function reset() {
    state.file = null;
    state.fileName = '';
    state.name = '';
    state.fileDataUrl = '';
    state.geoReference = null;
    state.tilePyramid = null;
    state.cornerTL = null;
    state.cornerBR = null;
    state.busy = false;
    state.processing = false;
    state.statusMsg = '';
    state.progress = 0;
    els.nameInput.value = '';
    els.fileInput.value = '';
    els.fileLabel.textContent = 'Tidak ada file dipilih';
    els.fileLabel.style.color = 'rgba(255,255,255,0.35)';
    els.preview.style.display = 'none';
    els.preview.innerHTML = '';
    els.coords.style.display = 'none';
    els.coords.innerHTML = '';
    els.progressBar.style.display = 'none';
    els.progressFill.style.width = '0%';
    els.status.textContent = '';
    els.saveBtn.style.opacity = '0.5';
    els.saveBtn.style.pointerEvents = 'none';
    els.saveBtn.textContent = 'Simpan Peta';
  }

  function validate() {
    const ok = state.fileDataUrl && state.name.trim().length >= 2;
    els.saveBtn.style.opacity = ok ? '1' : '0.5';
    els.saveBtn.style.pointerEvents = ok ? 'auto' : 'none';
  }

  function setStatus(msg, ok=true, progress=null) {
    state.statusMsg = msg;
    state.statusOk = ok;
    if(els.status) {
      els.status.textContent = msg;
      els.status.style.color = ok ? 'rgba(255,255,255,0.7)' : '#fb7185';
    }
    if(progress !== null) {
      state.progress = progress;
      if(els.progressBar) els.progressBar.style.display = 'block';
      // batch via rAF
      if(progressRaf) cancelAnimationFrame(progressRaf);
      progressRaf = requestAnimationFrame(() => {
        if(els.progressFill) {
          els.progressFill.style.width = Math.max(0,Math.min(100,progress)) + '%';
        }
        lastProgress = progress;
      });
    }
  }

  async function onFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    state.file = file;
    state.fileName = file.name;
    els.fileLabel.textContent = file.name + ' (' + (file.size/1024/1024).toFixed(2) + ' MB)';
    els.fileLabel.style.color = '#fff';
    
    // auto fill name
    if(!state.name) {
      const base = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g,' ').slice(0,40);
      state.name = base;
      els.nameInput.value = base;
    }

    setStatus('Membaca file...', true, 0);
    els.progressBar.style.display = 'block';

    if(/\.pdf$/i.test(file.name)) {
      await handleGeoPdf(file);
    } else if(/\.(tif|tiff)$/i.test(file.name)) {
      await handleGeoTiff(file);
    } else {
      await handleImage(file);
    }
    validate();
  }

  async function handleImage(file) {
    const reader = new FileReader();
    reader.onload = () => {
      state.fileDataUrl = reader.result;
      els.preview.style.display = 'block';
      els.preview.innerHTML = `<img src="${reader.result}" style="width:100%;display:block;" />`;
      setStatus('Gambar siap. Isi koordinat manual 2 sudut.', true, 100);
      showManualCoordsForm();
    };
    reader.readAsDataURL(file);
  }

  async function handleGeoTiff(file) {
    setStatus('Membaca GeoTIFF...', true, 10);
    try {
      if(typeof tryParseGeoTiff_ === 'function') {
        const res = await tryParseGeoTiff_(file);
        if(res && res.cornerTL) {
          state.fileDataUrl = res.imageDataUrl;
          state.cornerTL = res.cornerTL;
          state.cornerBR = res.cornerBR;
          els.preview.style.display = 'block';
          els.preview.innerHTML = `<img src="${res.imageDataUrl}" style="width:100%;display:block;" />`;
          showCoords(res.cornerTL, res.cornerBR, true);
          setStatus('✓ Koordinat GeoTIFF terbaca otomatis.', true, 100);
          return;
        }
      }
    } catch(err) {
      console.warn('[V19] GeoTIFF parse fail', err);
    }
    // fallback to image
    await handleImage(file);
  }

  async function handleGeoPdf(file) {
    state.processing = true;
    setStatus('Membaca metadata GeoPDF...', true, 5);

    // Progress reporter yang TIDAK manggil render() global
    let pendingMsg = '';
    let pendingPct = 0;
    let rafPending = false;
    const paint = () => {
      rafPending = false;
      setStatus(pendingMsg, true, pendingPct);
    };
    const reporter = (msg, pct) => {
      pendingMsg = msg;
      pendingPct = pct;
      if(!rafPending) {
        rafPending = true;
        requestAnimationFrame(paint);
      }
    };
    reporter.stop = () => {};

    try {
      // tryParseGeoPdf_ ada di peta.js global - pakai itu tapi dengan reporter isolasi
      let geoRefReady = false;
      const applyEarly = ({geoReference, cornerTL, cornerBR}) => {
        if(!cornerTL || !cornerBR) return;
        geoRefReady = true;
        state.geoReference = geoReference;
        state.cornerTL = cornerTL;
        state.cornerBR = cornerBR;
        // update coords DOM langsung tanpa render()
        showCoords(cornerTL, cornerBR, true);
      };

      if(typeof tryParseGeoPdf_ !== 'function') {
        setStatus('PDF parser belum siap. Coba lagi.', false, 0);
        return;
      }

      const result = await tryParseGeoPdf_(file, reporter, applyEarly);

      if(result && result.ok) {
        state.geoReference = result.geoReference;
        state.tilePyramid = result.tilePyramid;
        state.fileDataUrl = result.imageDataUrl;
        state.cornerTL = result.cornerTL;
        state.cornerBR = result.cornerBR;
        
        // preview
        els.preview.style.display = 'block';
        els.preview.innerHTML = `<img src="${result.imageDataUrl}" style="width:100%;display:block;" />`;
        showCoords(result.cornerTL, result.cornerBR, true);
        setStatus('✓ Koordinat & gambar terbaca otomatis dari GeoPDF.', true, 100);
        
        // simpan runtime file untuk V15
        try {
          if(typeof mapUploadRuntimeFile_ !== 'undefined') {
            mapUploadRuntimeFile_ = file;
          }
          window._v19RuntimeFile = file;
        } catch(_){}
      } else if(result && result.cornerTL) {
        // partial: koordinat ok, gambar gagal
        state.geoReference = result.geoReference;
        state.cornerTL = result.cornerTL;
        state.cornerBR = result.cornerBR;
        showCoords(result.cornerTL, result.cornerBR, true);
        setStatus(result.reason || 'Koordinat terbaca, tapi gambar gagal. Upload PNG/JPG terpisah.', false, 100);
        // tetap allow save dengan koordinat saja? minta image
      } else {
        setStatus((result && result.reason) ? result.reason : 'Gagal baca GeoPDF. Export ulang sebagai PNG/JPG.', false, 0);
      }
    } catch(err) {
      console.error('[V19] GeoPDF error', err);
      setStatus('Error baca GeoPDF: ' + (err.message||err), false, 0);
    } finally {
      state.processing = false;
    }
  }

  function showCoords(tl, br, auto) {
    els.coords.style.display = 'block';
    els.coords.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
        <div><div style="color:rgba(255,255,255,0.35);font-size:9px;">KIRI-ATAS Timur</div><div style="color:#fff;font-weight:600;">${tl.timur}</div></div>
        <div><div style="color:rgba(255,255,255,0.35);font-size:9px;">KIRI-ATAS Utara</div><div style="color:#fff;font-weight:600;">${tl.utara}</div></div>
        <div><div style="color:rgba(255,255,255,0.35);font-size:9px;">KANAN-BAWAH Timur</div><div style="color:#fff;font-weight:600;">${br.timur}</div></div>
        <div><div style="color:rgba(255,255,255,0.35);font-size:9px;">KANAN-BAWAH Utara</div><div style="color:#fff;font-weight:600;">${br.utara}</div></div>
      </div>
      <div style="margin-top:8px;font-size:9px;color:${auto?'#4ade80':'#fbbf24'};">${auto?'✓ Koordinat auto-detect dari file':'Isi manual 2 sudut'}</div>
    `;
  }

  function showManualCoordsForm() {
    // untuk PNG/JPG biasa - tetap tampilkan form manual simple
    els.coords.style.display = 'block';
    els.coords.innerHTML = `
      <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:6px;">Masukkan Timur/Utara KIRI-ATAS dan KANAN-BAWAH dari ArcGIS/data survey</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <input id="mg1-v19-tl-timur" placeholder="Kiri-Atas Timur" style="background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;font-size:11px;color:#fff;" />
        <input id="mg1-v19-tl-utara" placeholder="Kiri-Atas Utara" style="background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;font-size:11px;color:#fff;" />
        <input id="mg1-v19-br-timur" placeholder="Kanan-Bawah Timur" style="background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;font-size:11px;color:#fff;" />
        <input id="mg1-v19-br-utara" placeholder="Kanan-Bawah Utara" style="background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;font-size:11px;color:#fff;" />
      </div>
    `;
  }

  async function onSave() {
    if(state.busy || state.processing) return;
    if(!state.fileDataUrl) {
      setStatus('Pilih gambar peta dulu.', false);
      return;
    }
    if(!state.name.trim()) {
      setStatus('Nama peta wajib diisi.', false);
      return;
    }

    // ambil koordinat - dari auto atau manual
    let tlTimur, tlUtara, brTimur, brUtara;
    if(state.cornerTL && state.cornerBR) {
      tlTimur = state.cornerTL.timur;
      tlUtara = state.cornerTL.utara;
      brTimur = state.cornerBR.timur;
      brUtara = state.cornerBR.utara;
    } else {
      // manual
      const tlT = document.getElementById('mg1-v19-tl-timur');
      const tlU = document.getElementById('mg1-v19-tl-utara');
      const brT = document.getElementById('mg1-v19-br-timur');
      const brU = document.getElementById('mg1-v19-br-utara');
      if(!tlT || !tlU || !brT || !brU || !tlT.value || !tlU.value || !brT.value || !brU.value) {
        setStatus('Isi 4 angka Timur/Utara.', false);
        return;
      }
      tlTimur = parseFloat(tlT.value);
      tlUtara = parseFloat(tlU.value);
      brTimur = parseFloat(brT.value);
      brUtara = parseFloat(brU.value);
    }

    state.busy = true;
    els.saveBtn.textContent = 'Menyimpan...';
    els.saveBtn.style.opacity = '0.7';
    setStatus('Menyimpan ke HP...', true, 90);

    // V19: capture peta lama untuk no flicker transition
    let freezeOverlay = null;
    try {
      if(typeof captureMapSurfaceTransition_ === 'function') {
        freezeOverlay = captureMapSurfaceTransition_();
      }
    } catch(_){}

    try {
      const id = 'bgmap_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
      const tilePyramid = state.tilePyramid ? {...state.tilePyramid, runtimeMapId: id} : null;

      // dbPutMap_ ada di peta.js global
      if(typeof dbPutMap_ !== 'function') throw new Error('dbPutMap_ tidak tersedia');

      await dbPutMap_({
        id: id,
        name: state.name.trim(),
        imageDataUrl: state.fileDataUrl,
        cornerTL: state.geoReference && state.geoReference.extent ? {...state.geoReference.extent.cornerTL} : {timur: tlTimur, utara: tlUtara},
        cornerBR: state.geoReference && state.geoReference.extent ? {...state.geoReference.extent.cornerBR} : {timur: brTimur, utara: brUtara},
        geoReference: state.geoReference || null,
        tilePyramid: tilePyramid,
        uploadedAt: new Date().toISOString(),
        uploadedBy: (typeof sessionInfo !== 'undefined' && sessionInfo) ? sessionInfo.userName : 'unknown'
      });

      if(typeof loadBackgroundMapsFromDb_ === 'function') {
        await loadBackgroundMapsFromDb_();
      }

      // runtime PDF source
      try {
        const runtimeFile = window._v19RuntimeFile || state.file;
        if(state.geoReference && runtimeFile && typeof registerLithositeRuntimePdfSource_ === 'function') {
          registerLithositeRuntimePdfSource_(id, runtimeFile, state.geoReference);
        }
      } catch(_){}

      // aktifkan peta baru langsung - tidak lewat Kelola modal
      if(typeof activeBackgroundMapId !== 'undefined') {
        activeBackgroundMapId = id;
      }
      if(typeof mapZoom !== 'undefined') mapZoom = 1.25;
      if(typeof mapViewportState_ !== 'undefined') mapViewportState_.centerNative = null;
      try { localStorage.setItem('mg1_active_bg_map_id', id); } catch(_){}

      setStatus('✓ Peta tersimpan!', true, 100);

      // tutup modal dengan fade natural
      setTimeout(() => {
        close();
        // satu render final saja - dengan overlay freeze yang sudah di-capture
        try {
          if(typeof mapManagePanelOpen !== 'undefined') mapManagePanelOpen = false;
          if(typeof mapUploadFormOpen !== 'undefined') mapUploadFormOpen = false;
          if(typeof render === 'function') render();
        } catch(_){}
        try {
          if(typeof releaseMapSurfaceTransition_ === 'function') {
            releaseMapSurfaceTransition_(freezeOverlay);
          } else if(freezeOverlay) {
            freezeOverlay.style.transition = 'opacity 250ms ease-out';
            freezeOverlay.style.opacity = '0';
            setTimeout(()=>{ try{freezeOverlay.remove();}catch(_){} }, 300);
          }
        } catch(_){}
      }, 400);

    } catch(err) {
      console.error('[V19] save error', err);
      setStatus('Gagal simpan: ' + (err.message||err), false);
      state.busy = false;
      els.saveBtn.textContent = 'Simpan Peta';
      els.saveBtn.style.opacity = '1';
      try { if(freezeOverlay) freezeOverlay.remove(); } catch(_){}
    }
  }

  // Public API
  window.MG1NewMapModal = {
    open: open,
    close: close,
    _state: state
  };

  // Auto-override tombol lama "Tambah Peta Baru" dan "Kelola Peta Background"
  function overrideOldButtons() {
    // Override global openMapUploadForm_ jika ada
    if(typeof window.openMapUploadForm_ === 'function') {
      const old = window.openMapUploadForm_;
      window.openMapUploadForm_ = function() {
        console.log('[V19] openMapUploadForm_ overridden -> new modal');
        open();
      };
    }
    // Override openMapManagePanel_ untuk tetap pakai modal lama? tapi kita skip
    // Tombol di UI yang manggil openMapManagePanel_ tetap jalan, tapi Tambah Peta Baru di dalamnya kita override
    const check = setInterval(() => {
      const btns = document.querySelectorAll('button');
      btns.forEach(b => {
        if(b.textContent && b.textContent.includes('Tambah Peta Baru') && !b.__v19Overridden) {
          b.__v19Overridden = true;
          b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); open(); };
        }
      });
    }, 1000);
  }

  // Init after DOM ready
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { ensureDom(); overrideOldButtons(); });
  } else {
    ensureDom();
    overrideOldButtons();
  }

  console.log('[V19 NEW MODAL] Ready - call MG1NewMapModal.open() to test');
})();

/* ===== V23 NO MODAL FLICKER TIMING FIX INTEGRATED ===== */
/* V23 NO MODAL FLICKER - MATIKAN render() UNTUK SEMUA MODAL PETA
 * Masalah video 18.28: 
 * - openMapManagePanel_() { render() } -> rebuild #app
 * - openMapUploadForm_() { render() } -> rebuild #app lagi
 * - Klik + Tambah Peta Baru di dalam Kelola -> 2 modal rebutan render -> flicker 7.6s, 10.8s
 * Solusi: Override semua open/close modal jadi isolated, tidak pakai render() global
 */

(function(){
  console.log('[V23] Loading NO-MODAL-FLICKER fix');

  // Simpan original untuk fallback
  const origOpenManage = window.openMapManagePanel_;
  const origCloseManage = window.closeMapManagePanel_;
  const origOpenUpload = window.openMapUploadForm_;
  const origCloseUpload = window.closeMapUploadForm_;

  // State untuk modal isolated
  let manageModalEl = null;
  let uploadModalEl = null;

  function ensureManageModalDom() {
    if(manageModalEl && document.body.contains(manageModalEl)) return manageModalEl;
    
    // Buat modal Kelola isolasi (tidak pakai render())
    const el = document.createElement('div');
    el.id = 'mg1-manage-modal-isolated';
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483646;display:none;';
    el.innerHTML = `
      <div id="mg1-manage-backdrop" style="position:absolute;inset:0;background:rgba(3,8,20,0.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;transition:opacity 200ms ease;"></div>
      <div id="mg1-manage-panel" style="position:absolute;left:0;right:0;bottom:0;max-height:78vh;background:#0e1933;border-top:1px solid rgba(255,255,255,0.1);border-radius:20px 20px 0 0;transform:translateY(100%);transition:transform 300ms cubic-bezier(0.16,1,0.3,1);overflow:auto;">
        <div style="padding:16px;">
          <div style="width:36px;height:4px;background:rgba(255,255,255,0.2);border-radius:9999px;margin:0 auto 12px;"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div>
              <div style="font-size:13px;font-weight:800;color:#fff;">Kelola Peta Background</div>
              <div id="mg1-manage-count" style="font-size:10px;color:rgba(255,255,255,0.4);">0 peta tersimpan</div>
            </div>
            <button id="mg1-manage-close" style="width:28px;height:28px;border-radius:9999px;background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);">✕</button>
          </div>
          <div id="mg1-manage-list"></div>
          <button id="mg1-manage-add" style="width:100%;margin-top:12px;background:rgba(37,99,235,0.12);border:1px dashed rgba(37,99,235,0.4);border-radius:12px;padding:12px;font-size:12px;font-weight:700;color:#60a5fa;">+ Tambah Peta Baru</button>
          <div style="margin-top:8px;font-size:9px;color:rgba(255,255,255,0.25);text-align:center;">Peta disimpan di HP (IndexedDB) - offline</div>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    
    // Events
    el.querySelector('#mg1-manage-backdrop').onclick = () => closeManageModal();
    el.querySelector('#mg1-manage-close').onclick = () => closeManageModal();
    el.querySelector('#mg1-manage-add').onclick = () => {
      closeManageModal();
      setTimeout(() => openUploadModal(), 330);
    };
    
    manageModalEl = el;
    return el;
  }

  function openManageModal() {
    const el = ensureManageModalDom();
    const backdrop = el.querySelector('#mg1-manage-backdrop');
    const panel = el.querySelector('#mg1-manage-panel');
    const listEl = el.querySelector('#mg1-manage-list');
    const countEl = el.querySelector('#mg1-manage-count');
    
    // Update list dari backgroundMapsList global
    try {
      const maps = typeof backgroundMapsList !== 'undefined' ? backgroundMapsList : [];
      countEl.textContent = maps.length + ' peta tersimpan';
      if(maps.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:20px 0;color:rgba(255,255,255,0.3);font-size:11px;">Belum ada peta background tersimpan.</div>';
      } else {
        listEl.innerHTML = maps.map(m => `
          <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:12px;padding:10px;margin-bottom:8px;">
            <div style="width:48px;height:48px;border-radius:8px;background:#0b1329;overflow:hidden;flex-shrink:0;">
              ${m.imageDataUrl ? `<img src="${m.imageDataUrl}" style="width:100%;height:100%;object-fit:cover;" />` : ''}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name||'Tanpa nama'}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);">${(m.id||'').slice(0,12)} • ${m.tilePyramid ? (m.tilePyramid.levels?.length||0)+' level' : 'single'}</div>
            </div>
            <button onclick="window._v23ActivateMap('${m.id}')" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:6px 10px;font-size:10px;font-weight:700;">AKTIFKAN</button>
            <button onclick="window._v23DeleteMap('${m.id}')" style="background:rgba(244,63,94,0.15);color:#f43f5e;border:none;border-radius:8px;width:28px;height:28px;">🗑</button>
          </div>
        `).join('');
      }
    } catch(e) {
      console.warn('[V23] manage list update fail', e);
    }
    
    el.style.display = 'block';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      });
    });
    
    // Set flag tanpa render()
    if(typeof mapManagePanelOpen !== 'undefined') mapManagePanelOpen = true;
  }

  function closeManageModal() {
    if(!manageModalEl) return;
    const backdrop = manageModalEl.querySelector('#mg1-manage-backdrop');
    const panel = manageModalEl.querySelector('#mg1-manage-panel');
    if(backdrop) backdrop.style.opacity = '0';
    if(panel) panel.style.transform = 'translateY(100%)';
    setTimeout(() => {
      manageModalEl.style.display = 'none';
      if(typeof mapManagePanelOpen !== 'undefined') mapManagePanelOpen = false;
    }, 300);
  }

  // Dipakai save flow V22 agar daftar peta langsung tampil tanpa render() global.
  window._v23OpenManageModal = openManageModal;

  // Isolated upload modal sudah ada di V19, tapi kita pastikan tidak pakai render()
  function openUploadModal() {
    // Jika V19 modal ada, pakai itu
    if(window.MG1NewMapModal && typeof window.MG1NewMapModal.open === 'function') {
      window.MG1NewMapModal.open();
      return;
    }
    // Fallback: pakai original tapi tanpa flicker double
    // Tutup manage dulu baru buka upload
    closeManageModal();
    setTimeout(() => {
      if(typeof mapUploadFormOpen !== 'undefined') {
        mapUploadFormOpen = true;
        // JANGAN render() - langsung buat modal isolated simple
        // Untuk sekarang fallback ke original jika V19 tidak ada
        if(origOpenUpload) {
          // Override render di original untuk tidak rebuild #app? 
          // Kita set flag untuk skip render sekali
          window._v23SkipNextRender = true;
          origOpenUpload();
        }
      }
    }, 200);
  }

  function closeUploadModal() {
    if(window.MG1NewMapModal && typeof window.MG1NewMapModal.close === 'function') {
      window.MG1NewMapModal.close();
      return;
    }
    if(typeof mapUploadFormOpen !== 'undefined') mapUploadFormOpen = false;
    // Jangan render() - tutup via DOM saja jika ada
    const v19Root = document.getElementById('mg1-new-map-modal-root');
    if(v19Root) {
      const backdrop = document.getElementById('mg1-new-modal-backdrop');
      const panel = document.getElementById('mg1-new-modal-panel');
      if(backdrop) backdrop.style.opacity = '0';
      if(panel) { panel.style.opacity = '0'; panel.style.transform = 'translate(-50%,-44%) scale(0.96)'; }
      setTimeout(() => { v19Root.style.display = 'none'; }, 260);
    } else {
      if(origCloseUpload) {
        window._v23SkipNextRender = true;
        origCloseUpload();
      }
    }
  }

  // Override global functions - NO RENDER
  window.openMapManagePanel_ = function() {
    console.log('[V23] openMapManagePanel_ overridden - no render()');
    openManageModal();
  };

  window.closeMapManagePanel_ = function() {
    console.log('[V23] closeMapManagePanel_ overridden - no render()');
    closeManageModal();
    // Juga tutup upload jika ada
    if(typeof mapUploadFormOpen !== 'undefined' && mapUploadFormOpen) {
      mapUploadFormOpen = false;
    }
  };

  window.openMapUploadForm_ = function() {
    console.log('[V23] openMapUploadForm_ overridden - no render(), use V19 isolated modal');
    // Tutup manage dulu biar tidak double modal
    closeManageModal();
    setTimeout(() => openUploadModal(), 330);
  };

  window.closeMapUploadForm_ = function() {
    console.log('[V23] closeMapUploadForm_ overridden - no render()');
    closeUploadModal();
  };

  // Helper untuk activate/delete tanpa render() global - pakai atomic swap
  window._v23ActivateMap = async function(id) {
    closeManageModal();
    setTimeout(async () => {
      try {
        activeBackgroundMapId = id;
        mapZoom = 1.25;
        if(typeof mapViewportState_ !== 'undefined') mapViewportState_.centerNative = null;
        try { localStorage.setItem('mg1_active_bg_map_id', id); } catch(_){}
        
        // Atomic swap tanpa render()
        const vp = document.getElementById('mg1-map-viewport');
        if(vp && typeof window.executeAtomicSurfaceSwap_ === 'function' && typeof window.buildNewMapSurfaceV22 === 'function') {
          await window.executeAtomicSurfaceSwap_(vp, window.buildNewMapSurfaceV22);
        } else if(typeof window.updateMapViewportDirectNoRender_ === 'function') {
          window.updateMapViewportDirectNoRender_();
        } else if(typeof render === 'function') {
          render();
        }
      } catch(e) {
        console.error('[V23] activate fail', e);
        if(typeof render === 'function') render();
      }
    }, 200);
  };

  window._v23DeleteMap = async function(id) {
    if(!confirm('Hapus peta ini?')) return;
    try {
      if(typeof dbDeleteMap_ === 'function') await dbDeleteMap_(id);
      if(activeBackgroundMapId === id) {
        activeBackgroundMapId = null;
        try { localStorage.removeItem('mg1_active_bg_map_id'); } catch(_){}
      }
      if(typeof loadBackgroundMapsFromDb_ === 'function') await loadBackgroundMapsFromDb_();
      // Refresh manage modal list tanpa render()
      openManageModal();
      // Jika peta aktif dihapus, update viewport
      if(!activeBackgroundMapId) {
        const vp = document.getElementById('mg1-map-viewport');
        if(vp && typeof window.buildNewMapSurfaceV22 === 'function' && typeof window.executeAtomicSurfaceSwap_ === 'function') {
          await window.executeAtomicSurfaceSwap_(vp, window.buildNewMapSurfaceV22);
        }
      }
    } catch(e) {
      console.error('[V23] delete fail', e);
    }
  };

  // Intercept render() untuk skip jika flag _v23SkipNextRender
  if(typeof window.render === 'function' && !window._v23RenderPatched) {
    const origRender = window.render;
    window.render = function() {
      if(window._v23SkipNextRender) {
        console.log('[V23] Skipping render() to prevent modal flicker');
        window._v23SkipNextRender = false;
        return;
      }
      return origRender.apply(this, arguments);
    };
    window._v23RenderPatched = true;
  }

  // Auto patch tombol-tombol lama
  function patchOldButtons() {
    const check = setInterval(() => {
      const btns = document.querySelectorAll('button, [onclick*="openMapManagePanel"], [onclick*="openMapUploadForm"]');
      btns.forEach(b => {
        const onclick = b.getAttribute('onclick') || '';
        if(onclick.includes('openMapManagePanel_') && !b.__v23Patched) {
          b.__v23Patched = true;
          b.onclick = (e) => { e.preventDefault(); openManageModal(); };
        }
        if(onclick.includes('openMapUploadForm_') && !b.__v23Patched) {
          b.__v23Patched = true;
          b.onclick = (e) => { e.preventDefault(); openUploadModal(); };
        }
      });
    }, 1000);
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchOldButtons);
  } else {
    patchOldButtons();
  }

  console.log('[V23] Ready - All map modals isolated, no render() flicker');
})();
(function(){
  'use strict';
  console.log('[V24.1] TRUE INSTANT SAVE loading');

  function getSaveState_(){
    const f = typeof mapUploadFormState !== 'undefined' ? mapUploadFormState : null;
    const modalState = window.MG1NewMapModal ? window.MG1NewMapModal._state : null;
    const isNewModal = !!(modalState && modalState.open);
    if(isNewModal) return { state: modalState, isNewModal };
    if(!f) return { state:null, isNewModal:false };
    return {
      isNewModal:false,
      state:{
        file: typeof mapUploadRuntimeFile_ !== 'undefined' ? mapUploadRuntimeFile_ : (window._v19RuntimeFile || null),
        name: f.name,
        fileDataUrl: f.fileDataUrl,
        geoReference: f.geoReference,
        tilePyramid: f.tilePyramid,
        cornerTL: f.geoReference?.extent ? f.geoReference.extent.cornerTL : (f.tlTimur ? {timur:parseFloat(f.tlTimur), utara:parseFloat(f.tlUtara)} : null),
        cornerBR: f.geoReference?.extent ? f.geoReference.extent.cornerBR : (f.brTimur ? {timur:parseFloat(f.brTimur), utara:parseFloat(f.brUtara)} : null)
      }
    };
  }

  function closeUploadModalInstant_(isNewModal, modalState){
    const root = document.getElementById('mg1-new-map-modal-root');
    const backdrop = document.getElementById('mg1-new-modal-backdrop');
    const panel = document.getElementById('mg1-new-modal-panel');
    if(root && isNewModal){
      if(backdrop) backdrop.style.opacity='0';
      if(panel){ panel.style.opacity='0'; panel.style.transform='translate(-50%,-44%) scale(0.96)'; }
      setTimeout(()=>{ root.style.display='none'; if(modalState) modalState.open=false; }, 200);
    } else {
      if(typeof mapUploadFormOpen !== 'undefined') mapUploadFormOpen=false;
      if(typeof mapManagePanelOpen !== 'undefined') mapManagePanelOpen=false;
    }
  }

  function buildInstantPreviewSurface_(mapEntry){
    if(typeof renderMineGridSvg !== 'function' || typeof buildMapData !== 'function') return null;
    const idx = Array.isArray(backgroundMapsList) ? backgroundMapsList.findIndex(m=>m && m.id===mapEntry.id) : -1;
    const previous = idx >= 0 ? backgroundMapsList[idx] : null;
    // Force the existing renderer to use the single full image for the first paint.
    // This avoids building/preloading the 25-level pyramid before the user sees the map.
    if(idx >= 0) backgroundMapsList[idx] = {...mapEntry, tilePyramid:null};
    else if(Array.isArray(backgroundMapsList)) backgroundMapsList.push({...mapEntry, tilePyramid:null});
    let built='';
    try { built = renderMineGridSvg(buildMapData()); } finally {
      if(idx >= 0) backgroundMapsList[idx] = previous;
      else if(Array.isArray(backgroundMapsList)) backgroundMapsList.pop();
    }
    const temp=document.createElement('div');
    temp.innerHTML=String(built||'').trim();
    const svg=temp.firstElementChild;
    if(!svg) return null;
    svg.classList.add('lithosite-map-surface','lithosite-map-surface--instant');
    svg.style.visibility='hidden';
    svg.style.pointerEvents='none';
    svg.style.position='absolute';
    svg.style.inset='0';
    svg.style.opacity='1';
    return svg;
  }

  function showInstantPreview_(mapEntry){
    const vp=document.getElementById('mg1-map-viewport');
    if(!vp) return Promise.resolve(false);
    let svg;
    try { svg=buildInstantPreviewSurface_(mapEntry); } catch(e){ console.warn('[V24.1] preview build failed',e); return Promise.resolve(false); }
    if(!svg) return Promise.resolve(false);
    vp.appendChild(svg);
    const href=svg.querySelector('image')?.getAttribute('href') || svg.querySelector('image')?.getAttribute('xlink:href') || '';
    if(!href){
      svg.style.visibility=''; svg.style.pointerEvents='';
      const old=vp.querySelector('svg[data-map-gesture="true"]:not(.lithosite-map-surface--instant)');
      if(old) old.remove();
      return Promise.resolve(true);
    }
    return new Promise(resolve=>{
      let settled=false;
      const finish=(ok)=>{
        if(settled) return; settled=true;
        if(ok){
          svg.style.visibility=''; svg.style.pointerEvents='';
          const old=vp.querySelector('svg[data-map-gesture="true"]:not(.lithosite-map-surface--instant)');
          if(old) old.remove();
          svg.classList.remove('lithosite-map-surface--instant');
          requestAnimationFrame(()=>{ try{ if(typeof ensureMapContextBlocker_==='function') ensureMapContextBlocker_(); }catch(_){} });
        } else {
          try{svg.remove();}catch(_){}
        }
        resolve(!!ok);
      };
      const loader=new Image();
      loader.onload=()=>finish(true);
      loader.onerror=()=>finish(false);
      loader.src=href;
      setTimeout(()=>finish(false),1200);
    });
  }

  function persistMapVersionAware_(entry){
    return new Promise(async (resolve,reject)=>{
      try {
        if(!entry || !entry.id) return reject(new Error('entry unavailable'));
        const db=await openMapDb_();
        const tx=db.transaction(MAP_DB_STORE_,'readwrite');
        const store=tx.objectStore(MAP_DB_STORE_);
        let skipped=false;
        const req=store.get(entry.id);
        req.onsuccess=()=>{
          const existing=req.result;
          const curVer=existing && existing.tilePyramid && Number(existing.tilePyramid.__persistVersion)||0;
          const newVer=entry && entry.tilePyramid && Number(entry.tilePyramid.__persistVersion)||0;
          if(newVer < curVer){
            skipped=true;
            return;
          }
          store.put(entry);
        };
        req.onerror=()=>{ try{store.put(entry);}catch(_){} };
        tx.oncomplete=()=>{
          try{db.close();}catch(_){}
          resolve(skipped ? {ok:true,skipped:true,reason:'version-skipped fallback'} : {ok:true});
        };
        tx.onerror=()=>{try{db.close();}catch(_){} reject(tx.error||new Error('version-aware fallback failed'));};
        tx.onabort=()=>{try{db.close();}catch(_){} reject(tx.error||new Error('version-aware fallback aborted'));};
      } catch(e) { reject(e); }
    });
  }

  function persistMapInWorker_(entry){
    return new Promise((resolve,reject)=>{
      if(typeof Worker==='undefined' || typeof Blob==='undefined' || typeof URL==='undefined' || !URL.createObjectURL){
        reject(new Error('Worker tidak tersedia')); return;
      }
      const workerCode=`
        self.onmessage=function(ev){
          const d=ev.data||{}; const req=indexedDB.open(d.dbName,2);
          req.onupgradeneeded=function(){const db=req.result; if(!db.objectStoreNames.contains(d.storeName)) db.createObjectStore(d.storeName,{keyPath:'id'}); if(!db.objectStoreNames.contains('kmlOverlays')) db.createObjectStore('kmlOverlays',{keyPath:'id'});};
          req.onerror=function(){self.postMessage({ok:false,error:String(req.error&&req.error.message||req.error||'open failed')});};
          req.onsuccess=function(){
            const db=req.result;
            try {
              // Read + version check + put must share ONE readwrite transaction.
              // This closes the T0-T3 race where a stale worker read could overwrite
              // a newer runtime persistence that committed between separate transactions.
              const tx=db.transaction(d.storeName,'readwrite');
              const store=tx.objectStore(d.storeName);
              let skipped=false;
              const getReq=store.get(d.entry.id);
              getReq.onsuccess=function(){
                const existing=getReq.result;
                const curVer=existing && existing.tilePyramid && Number(existing.tilePyramid.__persistVersion)||0;
                const newVer=d.entry && d.entry.tilePyramid && Number(d.entry.tilePyramid.__persistVersion)||0;
                if(newVer < curVer){
                  skipped=true;
                  return;
                }
                store.put(d.entry);
              };
              getReq.onerror=function(){
                // Preserve previous fallback behavior if the version read itself fails.
                try{store.put(d.entry);}catch(_){}
              };
              tx.oncomplete=function(){
                try{db.close();}catch(_){}
                if(skipped){
                  self.postMessage({ok:true, skipped:true, reason:'version-skipped V24.1 worker'});
                } else {
                  self.postMessage({ok:true});
                }
              };
              tx.onerror=function(){try{db.close();}catch(_){} self.postMessage({ok:false,error:String(tx.error&&tx.error.message||tx.error||'put failed')});};
              tx.onabort=tx.onerror;
            }catch(e){try{db.close();}catch(_){} self.postMessage({ok:false,error:String(e&&e.message||e)});}
          };
        };
      `;
      const blob=new Blob([workerCode],{type:'application/javascript'});
      const url=URL.createObjectURL(blob);
      const worker=new Worker(url);
      const cleanup=()=>{try{worker.terminate();}catch(_){} try{URL.revokeObjectURL(url);}catch(_){} };
      worker.onmessage=ev=>{const r=ev.data||{}; cleanup(); if(r.skipped){ resolve(true); return; } r.ok?resolve(true):reject(new Error(r.error||'worker save failed'));};
      worker.onerror=ev=>{cleanup(); reject(new Error(ev&&ev.message||'worker error'));};
      try{worker.postMessage({dbName:'mg1_background_maps',storeName:'maps',entry:entry});}
      catch(e){cleanup(); reject(e);}
    });
  }

  function scheduleBackgroundPersistence_(entry){
    const run=()=>{
      console.log('[V24.1] Background persistence starting - version-aware + clone-safe');
      try {
        let entryToPersist = entry;
        // === FIX race T0-T3: ambil entry terbaru dari RAM, bukan closure lama ===
        try {
          if (typeof backgroundMapsList !== 'undefined' && Array.isArray(backgroundMapsList)) {
            const latest = backgroundMapsList.find(m => m && String(m.id) === String(entry.id));
            if (latest) {
              const curVer = Number(latest.tilePyramid && latest.tilePyramid.__persistVersion) || 0;
              const oldVer = Number(entry.tilePyramid && entry.tilePyramid.__persistVersion) || 0;
              if (curVer > oldVer) {
                console.log('[V24.1] Using latest entry from RAM, version', oldVer, '->', curVer);
                entryToPersist = latest;
              }
              // Jika latest sudah lebih baru, jangan overwrite dengan versi lama
              if (curVer > 0 && oldVer > 0 && oldVer < curVer && latest !== entry) {
                console.log('[V24.1] Skipped - newer version in RAM exists', curVer, 'vs', oldVer);
                return;
              }
            }
          }
        } catch(_) {}
        // Clone-safe sanitize
        try {
          if (entryToPersist && entryToPersist.tilePyramid && typeof sanitizePyramidForStorage_ === 'function') {
            const cleanPyramid = sanitizePyramidForStorage_(entryToPersist.tilePyramid);
            entryToPersist = { ...entryToPersist, tilePyramid: cleanPyramid };
          }
        } catch(_) {}
        persistMapInWorker_(entryToPersist).then(()=>{
          console.log('[V24.1] Background IndexedDB save DONE');
          entry.__v24Persisted=true;
        }).catch(err=>{
          console.warn('[V24.1] Worker persistence failed, fallback idle DB save:',err);
          const fallback=()=>{
            try {
              let safe = entryToPersist;
              try {
                if (safe && safe.tilePyramid && typeof sanitizePyramidForStorage_ === 'function') {
                  safe = { ...safe, tilePyramid: sanitizePyramidForStorage_(safe.tilePyramid) };
                }
              } catch(_) {}
              // Final version check before fallback
              try {
                if (typeof backgroundMapsList !== 'undefined' && Array.isArray(backgroundMapsList)) {
                  const latest = backgroundMapsList.find(m => m && String(m.id) === String(safe.id));
                  if (latest) {
                    const curVer = Number(latest.tilePyramid && latest.tilePyramid.__persistVersion) || 0;
                    const newVer = Number(safe.tilePyramid && safe.tilePyramid.__persistVersion) || 0;
                    if (curVer > 0 && newVer > 0 && newVer < curVer) {
                      console.log('[V24.1 fallback] Skipped - newer version exists', curVer, 'vs', newVer);
                      return;
                    }
                  }
                }
              } catch(_) {}
              if(typeof persistMapVersionAware_==='function') persistMapVersionAware_(safe).then(r=>{
                if(r&&r.skipped) console.log('[V24.1 fallback] Skipped stale DB write');
              }).catch(e=>console.warn('[V24.1] fallback DB save failed',e));
            } catch(e2) { console.warn('[V24.1] fallback sanitize failed', e2); }
          };
          if(typeof requestIdleCallback==='function') requestIdleCallback(fallback,{timeout:10000}); else setTimeout(fallback,1000);
        });
      } catch(e) { console.warn('[V24.1] schedule failed', e); }
    };
    if(typeof requestIdleCallback==='function') requestIdleCallback(run,{timeout:5000});
    else setTimeout(run,1500);
  }

  window.submitMapUpload_InstantV24_1 = async function(){
    if(window.__v24SaveInFlight) return;
    const pack=getSaveState_();
    const state=pack.state, isNewModal=pack.isNewModal;
    if(!state) return;
    if(!state.fileDataUrl || !String(state.name||'').trim()) return;
    window.__v24SaveInFlight=true;

    const id='bgmap_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
    const tilePyramid=state.tilePyramid && typeof state.tilePyramid==='object' ? {...state.tilePyramid,runtimeMapId:id} : null;
    const entry={
      id,
      name:String(state.name).trim(),
      imageDataUrl:state.fileDataUrl,
      cornerTL:state.geoReference?.extent ? {...state.geoReference.extent.cornerTL} : state.cornerTL,
      cornerBR:state.geoReference?.extent ? {...state.geoReference.extent.cornerBR} : state.cornerBR,
      geoReference:state.geoReference||null,
      tilePyramid,
      uploadedAt:new Date().toISOString(),
      uploadedBy:(typeof sessionInfo!=='undefined' && sessionInfo)?sessionInfo.userName:'unknown'
    };

    if(isNewModal && pack.state){
      pack.state.busy=false;
      const btn=document.getElementById('mg1-new-modal-save'); if(btn){btn.textContent='Menyimpan...';btn.style.opacity='0.7';}
      const st=document.getElementById('mg1-new-modal-status'); if(st) st.textContent='Peta diterapkan. Menyimpan data di belakang...';
    }

    // 1) RAM commit first — this is the user-visible save.
    if(Array.isArray(backgroundMapsList)) backgroundMapsList.push(entry);
    activeBackgroundMapId=id;
    mapZoom=1.25;
    if(typeof compassRotationOffsetDeg_!=='undefined') compassRotationOffsetDeg_=0;
    if(typeof mapViewportState_!=='undefined' && mapViewportState_) mapViewportState_.centerNative=null;
    try{localStorage.setItem('mg1_active_bg_map_id',id);}catch(_){ }

    // 2) Close upload modal immediately; never wait for IndexedDB.
    closeUploadModalInstant_(isNewModal, pack.state);

    // 3) Show the new map from the full image as soon as it decodes; old map stays until then.
    showInstantPreview_(entry).catch(e=>console.warn('[V24.1] instant preview error',e));

    // 4) Upgrade to pyramid atomically in the background; never await it here.
    setTimeout(()=>{
      try{
        const vp=document.getElementById('mg1-map-viewport');
        if(vp && typeof executeAtomicSurfaceSwap_==='function' && typeof buildNewMapSurfaceV22==='function'){
          executeAtomicSurfaceSwap_(vp,buildNewMapSurfaceV22).then(ok=>console.log('[V24.1] detail atomic swap',ok?'READY':'CANCELLED')).catch(e=>console.warn('[V24.1] detail swap failed; current map retained',e));
        }
      }catch(e){console.warn('[V24.1] detail swap start failed',e);}
    },50);

    // 5) Manage list appears quickly from RAM; no DB reload and no global render.
    setTimeout(()=>{
      try{
        if(typeof window._v23OpenManageModal==='function') window._v23OpenManageModal();
        else if(typeof window.openMapManagePanel_==='function') window.openMapManagePanel_();
      }catch(e){console.warn('[V24.1] manage modal failed',e);}
    },230);

    // 6) Heavy IndexedDB persistence is deliberately decoupled from the click path.
    scheduleBackgroundPersistence_(entry);

    // UI busy state can be cleared immediately because save-to-RAM already committed.
    if(typeof mapUploadBusy!=='undefined') mapUploadBusy=false;
    if(isNewModal && pack.state) pack.state.busy=false;
    window.__v24SaveInFlight=false;
  };

  window.submitMapUpload_ = window.submitMapUpload_InstantV24_1;
  window.submitMapUpload_NoRender_ = window.submitMapUpload_InstantV24_1;
  window.submitMapUpload_Atomic_ = window.submitMapUpload_InstantV24_1;

  const bind=()=>{
    const b=document.getElementById('mg1-new-modal-save');
    if(!b) return false;
    b.type='button'; b.onclick=window.submitMapUpload_InstantV24_1; b.__v24SaveBound=true; return true;
  };
  bind();
  const iv=setInterval(()=>{ if(bind()) clearInterval(iv); },250);
  console.log('[V24.1] Ready - RAM-first save, worker persistence, instant preview, V22 detail upgrade');
})();

// === STEP 8.14 - Missing Creation Worker with in-flight protection ===
let mg1MissingCreationTracker_ = null;
function ensureMissingCreationTracker_(pyramid) {
  if (!pyramid) return null;
  if (!mg1MissingCreationTracker_ || mg1MissingCreationTracker_.pyramid !== pyramid) {
    mg1MissingCreationTracker_ = {
      pyramid: pyramid,
      creatingSet: Object.create(null),
      lastMissingCount: 0
    };
  }
  if (!pyramid.missingCreationTracker || pyramid.missingCreationTracker.version !== 1) {
    pyramid.missingCreationTracker = {
      version: 1,
      creatingSet: Object.create(null)
    };
  }
  return mg1MissingCreationTracker_;
}

async function processMissingCreationBatch_(pyramid, mapId, missingKeys, batchSize) {
  try {
    if (!pyramid || !Array.isArray(missingKeys) || !missingKeys.length) return { processed:0, created:0, failed:0 };
    if (!mapId) {
      try { mapId = (typeof activeBackgroundMapId !== 'undefined' && activeBackgroundMapId) ? activeBackgroundMapId : null; } catch(_) { mapId = null; }
    }
    if (!mapId) return { processed:0, created:0, failed:0, reason:'mapId missing' };
    const tracker = ensureMissingCreationTracker_(pyramid);
    if (!tracker) return { processed:0, created:0, failed:0 };
    const creatingSet = pyramid.missingCreationTracker ? pyramid.missingCreationTracker.creatingSet : tracker.creatingSet;
    const bs = Math.max(1, Math.min(2, Number(batchSize) || 1));

    // Filter: jangan buat yang sedang in-flight atau sudah available
    const toCreate = [];
    for (let i=0;i<missingKeys.length && toCreate.length<bs;i++) {
      const k = String(missingKeys[i]);
      if (!k) continue;
      if (creatingSet[k]) continue; // in-flight protection
      // cek sudah available sekarang?
      try {
        const av = typeof resolveLithositeDetailTileAvailability_ === 'function' ? resolveLithositeDetailTileAvailability_(pyramid, k) : null;
        if (av && av.status === 'available') continue;
      } catch(_) {}
      toCreate.push(k);
    }
    if (!toCreate.length) return { processed:0, created:0, failed:0 };

    // Mark in-flight
    for (const k of toCreate) creatingSet[k] = true;

    let created = 0, failed = 0, processed = 0;
    for (const k of toCreate) {
      try {
        const result = typeof resolveAndCreateLithositeMissingDetailTile_ === 'function'
          ? await resolveAndCreateLithositeMissingDetailTile_(mapId, pyramid, k)
          : (typeof createLithositeMissingDetailTileFromPdf_ === 'function' ? await createLithositeMissingDetailTileFromPdf_(mapId, pyramid, k) : { status:'no-creator' });
        processed++;
        if (result && (result.status === 'created' || result.status === 'available')) {
          created++;
        } else {
          failed++;
        }
      } catch(e) {
        failed++; processed++;
      } finally {
        delete creatingSet[k];
      }
    }

    if (created > 0) {
      try { if (typeof scheduleCoalescedInvalidation_ === 'function') scheduleCoalescedInvalidation_(created); } catch(_) {}
    }

    // Jika masih ada missing lain, schedule next batch (jangan flood PDF.js)
    try {
      const remaining = missingKeys.filter(k => !creatingSet[String(k)]);
      if (remaining.length > toCreate.length) {
        setTimeout(() => {
          try { processMissingCreationBatch_(pyramid, mapId, remaining.slice(toCreate.length), bs); } catch(_) {}
        }, 250);
      }
    } catch(_) {}

    return { processed, created, failed };
  } catch(e) {
    return { processed:0, created:0, failed:0, error: e && e.message };
  }
}

