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
let mapZoom = 1;             // 1 = fit-semua-titik (default), >1 memperbesar
let mapDetailIdTp = null;    // ID TP yg sedang dibuka detailnya, null = tidak ada modal terbuka
// v90.2.116 BARU (permintaan user -- lompat dari Validasi ke lokasi Peta): TP yg harus
// otomatis dibuka detailnya begitu tab Peta aktif -- dipicu dari tombol pin di kartu
// Validasi, BUKAN cuma pindah tab tapi juga langsung fokus ke TP spesifik yg diminta.
let mapFocusIdTp = null;
function focusMapFromValidasi(idTp) {
  mapFocusIdTp = idTp;
  switchTab('peta');
}
const MAP_ZOOM_MIN = 1, MAP_ZOOM_MAX = 4, MAP_ZOOM_STEP = 0.5;

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
let backgroundMapsList = []; // cache in-memory dari IndexedDB, direfresh tiap ada perubahan
let activeBackgroundMapId = null;
let mapManagePanelOpen = false;
let mapUploadFormOpen = false;
let mapUploadFormState = { name: '', fileDataUrl: '', fileName: '', tlTimur: '', tlUtara: '', brTimur: '', brUtara: '' };
let mapUploadStatusMsg = '', mapUploadStatusOk = true, mapUploadBusy = false;

function openMapDb_() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MAP_DB_NAME_, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MAP_DB_STORE_)) db.createObjectStore(MAP_DB_STORE_, { keyPath: 'id' });
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
    if (stored && backgroundMapsList.find(m => m.id === stored)) activeBackgroundMapId = stored;
  } catch (e) {
    console.warn('Gagal muat daftar peta background (IndexedDB mungkin tidak didukung):', e);
    backgroundMapsList = [];
  }
}
function openMapManagePanel_() { mapManagePanelOpen = true; render(); }
function closeMapManagePanel_() { mapManagePanelOpen = false; mapUploadFormOpen = false; render(); }
function openMapUploadForm_() {
  mapUploadFormState = { name: '', fileDataUrl: '', fileName: '', tlTimur: '', tlUtara: '', brTimur: '', brUtara: '' };
  mapUploadStatusMsg = ''; mapUploadFormOpen = true; render();
}
function closeMapUploadForm_() { mapUploadFormOpen = false; render(); }
function updateMapUploadField_(field, value) { mapUploadFormState[field] = value; }
function handleMapImageFileSelected_(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { mapUploadStatusMsg = 'File harus berupa gambar (PNG/JPG).'; mapUploadStatusOk = false; render(); return; }
  const reader = new FileReader();
  reader.onload = () => {
    mapUploadFormState.fileDataUrl = reader.result;
    mapUploadFormState.fileName = file.name;
    render();
  };
  reader.readAsDataURL(file);
}
async function submitMapUpload_() {
  if (mapUploadBusy) return;
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
      cornerTL: { timur: parseFloat(f.tlTimur), utara: parseFloat(f.tlUtara) },
      cornerBR: { timur: parseFloat(f.brTimur), utara: parseFloat(f.brUtara) },
      uploadedAt: new Date().toISOString(),
      uploadedBy: sessionInfo ? sessionInfo.userName : 'unknown'
    });
    await loadBackgroundMapsFromDb_();
    activeBackgroundMapId = id; // peta baru diupload langsung diaktifkan
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
  localStorage.setItem('mg1_active_bg_map_id', id);
  render();
}
async function deactivateBackgroundMap_() {
  activeBackgroundMapId = null;
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
function computeMineGridBounds(points) {
  const valid = points.filter(p => p.hasValidCoord);
  if (!valid.length) return null;
  const timurs = valid.map(p => parseFloat(p.timur));
  const utaras = valid.map(p => parseFloat(p.utara));
  let minT = Math.min(...timurs), maxT = Math.max(...timurs);
  let minU = Math.min(...utaras), maxU = Math.max(...utaras);
  // Jaga-jaga: kalau semua titik kebetulan segaris (rentang 0), beri buffer artifisial
  // supaya SVG tidak collapse jadi 1 titik/garis tak terlihat.
  if (maxT - minT < 1) { minT -= 5; maxT += 5; }
  if (maxU - minU < 1) { minU -= 5; maxU += 5; }
  // Padding 10% di tiap sisi supaya marker di tepi rentang tidak mepet ke batas SVG.
  const padT = (maxT - minT) * 0.1, padU = (maxU - minU) * 0.1;
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
  const bounds = computeMineGridBounds(points);
  const viewW = 320, viewH = 320;
  if (!bounds) return '';
  // Zoom diterapkan lewat viewBox SVG (bukan transform per-titik) -- viewBox lebih kecil
  // = area yg sama ditampilkan lebih besar (efek perbesar), digeser ke tengah supaya
  // titik yg terlihat tetap proporsional terhadap pusat, bukan menempel pojok kiri-atas.
  const zoomedW = viewW / mapZoom, zoomedH = viewH / mapZoom;
  const offX = (viewW - zoomedW) / 2, offY = (viewH - zoomedH) / 2;
  const valid = points.filter(p => p.hasValidCoord);
  let svg = '<svg viewBox="' + offX + ' ' + offY + ' ' + zoomedW + ' ' + zoomedH + '" class="w-full h-full" style="touch-action:none;">';
  // [BARU -- 5 Sep] Peta background (foto udara/olah ArcGIS) -- digambar PALING BAWAH
  // (sebelum grid helper & marker) supaya tidak menutupi apa pun. Posisi & ukuran dihitung
  // dari 2 sudut referensi pakai projectToSvg() yg SAMA dgn yg plot titik TP -- kalau titik
  // TP di posisi X benar, gambar background otomatis ikut benar juga (logic sama).
  if (activeBackgroundMapId) {
    const activeMap = backgroundMapsList.find(m => m.id === activeBackgroundMapId);
    if (activeMap) {
      const tl = projectToSvg(activeMap.cornerTL.timur, activeMap.cornerTL.utara, bounds, viewW, viewH);
      const br = projectToSvg(activeMap.cornerBR.timur, activeMap.cornerBR.utara, bounds, viewW, viewH);
      const imgX = Math.min(tl.x, br.x), imgY = Math.min(tl.y, br.y);
      const imgW = Math.abs(br.x - tl.x), imgH = Math.abs(br.y - tl.y);
      svg += '<image href="' + activeMap.imageDataUrl + '" x="' + imgX + '" y="' + imgY + '" width="' + imgW + '" height="' + imgH + '" preserveAspectRatio="none" opacity="0.9"/>';
    }
  }
  // Grid garis bantu tipis (visual saja, bukan data) -- membantu orientasi skala.
  for (let i = 1; i < 4; i++) {
    const gx = (viewW / 4) * i, gy = (viewH / 4) * i;
    svg += '<line x1="' + gx + '" y1="0" x2="' + gx + '" y2="' + viewH + '" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>';
    svg += '<line x1="0" y1="' + gy + '" x2="' + viewW + '" y2="' + gy + '" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>';
  }
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

function zoomMapIn() { mapZoom = Math.min(MAP_ZOOM_MAX, mapZoom + MAP_ZOOM_STEP); render(); }
function zoomMapOut() { mapZoom = Math.max(MAP_ZOOM_MIN, mapZoom - MAP_ZOOM_STEP); render(); }
// "Crosshair" = reset tampilan ke fit-semua-titik -- BUKAN GPS lokasi user (poin desain #4,
// GPS Generic sengaja tidak dikerjakan krn tidak ada sumber Lat/Long sama sekali).
function resetMapView() { mapZoom = 1; render(); }

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

function renderPeta() {
  let html = renderHeader();
  html += '<main class="app-main flex-1 min-h-0 flex flex-col gap-[10px] px-4 pt-3 pb-3">';

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
      '<button onclick="loadRingkasanData()" class="mt-1 px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold active:scale-95 transition-transform">Coba Lagi</button>' +
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
  html += '<div class="relative flex-1 min-h-0 rounded-[12px] bg-[#0b1329] border border-white/[0.08] overflow-hidden">' +
    renderMineGridSvg(validPoints) +
    renderNorthArrow_(computeMineGridBounds(validPoints)) +
    renderMeasureBanner_(mapData) +
    // Kontrol zoom + crosshair (reset view) -- poin desain #2 (MAP-02): sekarang BENAR2
    // py handler, bukan sekadar elemen visual. [BONUS -- 4 Sep] Tombol Mode Ukur ditambah
    // di grup yg sama (kanan-atas), ikon berubah & warna nyala kuning saat aktif.
    '<div class="absolute right-3 top-3 flex flex-col gap-2">' +
      '<button onclick="zoomMapIn()" aria-label="Perbesar" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('plus','w-4 h-4 text-white') + '</button>' +
      '<button onclick="zoomMapOut()" aria-label="Perkecil" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('minus','w-4 h-4 text-white') + '</button>' +
      '<button onclick="resetMapView()" aria-label="Reset tampilan" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('crosshair','w-4 h-4 text-white') + '</button>' +
      '<button onclick="toggleMeasureMode_()" aria-label="Mode Ukur" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (measureModeActive ? 'bg-amber-500 border border-amber-400' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('ruler','w-4 h-4 ' + (measureModeActive ? 'text-[#0b1329]' : 'text-white')) + '</button>' +
      '<button onclick="openMapManagePanel_()" aria-label="Kelola Peta Background" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (activeBackgroundMapId ? 'bg-emerald-500 border border-emerald-400' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('layers','w-4 h-4 ' + (activeBackgroundMapId ? 'text-[#0b1329]' : 'text-white')) + '</button>' +
    '</div>' +
    (invalidCount > 0 ? '<div class="absolute left-3 bottom-11 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-semibold">' + invalidCount + ' TP tanpa koordinat</div>' : '') +
    renderMapScaleBar(computeMineGridBounds(validPoints)) +
  '</div>';
  html += '<div class="text-[10px] text-white/30 text-center shrink-0">Koordinat grid tambang (Timur/Utara) -- bukan GPS. Tap titik utk detail.</div>';
  html += '</main>';
  html += renderBottomNav();
  html += renderMapDetailModal(mapData);
  html += renderMapManagePanel_();
  html += renderMapUploadForm_();
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
    return '<div><label class="block text-[10px] text-white/40 mb-1 font-medium">' + label + '</label>' +
      '<input type="text" inputmode="decimal" value="' + (f[field]||'') + '" oninput="updateMapUploadField_(\'' + field + '\', this.value)" placeholder="' + placeholder + '" class="w-full bg-[#0b1329] border border-white/10 rounded-lg px-2.5 py-2 text-[12px] text-white focus:outline-none focus:border-blue-400/60"></div>';
  }
  const body =
    '<div class="mb-3">' +
      '<label class="block text-[10px] text-white/40 mb-1 font-medium">Nama Peta</label>' +
      '<input type="text" value="' + f.name + '" oninput="updateMapUploadField_(\'name\', this.value)" placeholder="cth. Foto Udara Avanza Sep 2026" class="w-full bg-[#0b1329] border border-white/10 rounded-lg px-2.5 py-2 text-[12px] text-white focus:outline-none focus:border-blue-400/60">' +
    '</div>' +
    '<div class="mb-3">' +
      '<label class="block text-[10px] text-white/40 mb-1 font-medium">Gambar Peta (PNG/JPG)</label>' +
      '<input type="file" accept="image/*" onchange="handleMapImageFileSelected_(this)" class="w-full text-[11px] text-white/60">' +
      (f.fileDataUrl ? '<img src="' + f.fileDataUrl + '" class="w-full h-24 object-cover rounded-lg mt-2">' : '') +
    '</div>' +
    '<p class="text-[10px] text-white/40 mb-2 leading-relaxed">Masukkan Timur/Utara pojok KIRI-ATAS dan KANAN-BAWAH gambar (dari ArcGIS/data survey) -- ini yang dipakai app utk menempel gambar ke posisi yang benar.</p>' +
    '<div class="grid grid-cols-2 gap-2 mb-2">' +
      inputRow('Kiri-Atas: Timur', 'tlTimur', '397000') +
      inputRow('Kiri-Atas: Utara', 'tlUtara', '53500') +
      inputRow('Kanan-Bawah: Timur', 'brTimur', '397300') +
      inputRow('Kanan-Bawah: Utara', 'brUtara', '53100') +
    '</div>' +
    (mapUploadStatusMsg ? '<p class="text-[10px] mt-1 mb-1 font-medium ' + (mapUploadStatusOk ? 'text-emerald-400' : 'text-rose-400') + '">' + mapUploadStatusMsg + '</p>' : '') +
    '<button onclick="submitMapUpload_()" ' + (mapUploadBusy ? 'disabled' : '') + ' class="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs py-2.5 rounded-xl disabled:opacity-60">' +
      (mapUploadBusy ? '<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"></span>' : icon('upload','w-4 h-4')) + '<span>' + (mapUploadBusy ? 'Menyimpan...' : 'Simpan Peta') + '</span>' +
    '</button>';
  return renderSimpleModal('Tambah Peta Baru', 'Upload gambar + 2 titik referensi', body, 'closeMapUploadForm_()');
}
