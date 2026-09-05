/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- member-app/scripts/digging.js
 * [PARTISI -- 4 Sep, Tahap 4] Fetch data utama (loadRingkasanData -- SATU fungsi
 * mengisi globalDiggingToday, globalValidasiToday, globalValidasiFullForMap,
 * globalCOGConfig sekaligus, dipakai jg oleh validasi.js & peta.js), Tab Ringkasan,
 * Tab Digging (tabel+form+detail+update assay), classifyMaterial/computeTonase/
 * computeSM (dipakai jg oleh validasi.js via global scope). Diekstrak dari
 * index.html tunggal -- 0 restrukturisasi logika.
 * Dependency: config.js, auth.js, render()/renderErrorBanner() (index.html Tahap 5).
 * ============================================================ */

// [PARTISI -- 4 Sep, susulan] Dipindah dari index.html -- state data GLOBAL, dipakai jg
// oleh validasi.js & peta.js via global scope (populated oleh loadRingkasanData() di bawah).
let globalCOGConfig = null;
let globalDiggingToday = [];
let globalValidasiToday = [];
// v90.2.113 BARU (Peta): dataset UTUH (tanpa limit 100) khusus utk Peta -- lihat catatan
// di loadRingkasanData(). globalValidasiToday TETAP dipakai apa adanya utk tab Validasi,
// TIDAK diubah -- 2 dataset terpisah, sengaja tidak saling mewarisi filter/limit.
let globalValidasiFullForMap = [];
let diggingFormState = { tanggal:'', shift:'Pagi', cuaca:'Cerah', pit:'', blok:'', tipe_ore:'Sapro', id_sampel:'', total_sampel:'', ni:'', fe:'', co:'', mgo:'', sio2:'', tujuan:'', ship:'' };

async function fetchCOGConfig() {
  try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=cogconfig&t=' + Date.now());
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Gagal memuat COGConfig');
    const rows = result.data || [];
    const cfg = { Sapro: null, Limo: null, Limo_Aktif: false, SM_Threshold_AutoDetect: 3, Bucket_per_Sampel: 8 };
    rows.forEach(row => {
      const tipe = (row['Tipe_Ore'] || '').toString().trim();
      const batas = {
        Batas_Waste_LG: parseFloat(row['Batas_Waste_LG']),
        Batas_LG_MG: parseFloat(row['Batas_LG_MG']),
        Batas_MG_HG: parseFloat(row['Batas_MG_HG']),
        Batas_HG_VHG: parseFloat(row['Batas_HG_VHG']),
        WMT_per_Bucket: (row['WMT_per_Bucket'] !== undefined && row['WMT_per_Bucket'] !== '' && !isNaN(parseFloat(row['WMT_per_Bucket']))) ? parseFloat(row['WMT_per_Bucket']) : 2.2
      };
      if (tipe === 'Sapro') cfg.Sapro = batas;
      if (tipe === 'Limo') cfg.Limo = batas;
      if (row['Limo_Aktif'] !== undefined && row['Limo_Aktif'] !== '') cfg.Limo_Aktif = String(row['Limo_Aktif']).trim().toUpperCase() === 'TRUE';
      if (row['SM_Threshold_AutoDetect'] !== undefined && row['SM_Threshold_AutoDetect'] !== '') { const v = parseFloat(row['SM_Threshold_AutoDetect']); if (!isNaN(v)) cfg.SM_Threshold_AutoDetect = v; }
      if (row['Bucket_per_Sampel'] !== undefined && row['Bucket_per_Sampel'] !== '') { const v = parseFloat(row['Bucket_per_Sampel']); if (!isNaN(v)) cfg.Bucket_per_Sampel = v; }
    });
    if (!cfg.Sapro) cfg.Sapro = { Batas_Waste_LG:0.8, Batas_LG_MG:1.25, Batas_MG_HG:1.45, Batas_HG_VHG:1.7, WMT_per_Bucket:2.2 };
    if (!cfg.Limo) cfg.Limo = { Batas_Waste_LG:0.8, Batas_LG_MG:1.25, Batas_MG_HG:1.45, Batas_HG_VHG:1.7, WMT_per_Bucket:2.2 };
    globalCOGConfig = cfg;
  } catch (err) {
    console.error('Gagal memuat COGConfig, pakai fallback:', err);
    globalCOGConfig = { Sapro:{Batas_Waste_LG:0.8,Batas_LG_MG:1.25,Batas_MG_HG:1.45,Batas_HG_VHG:1.7,WMT_per_Bucket:2.2}, Limo:{Batas_Waste_LG:0.8,Batas_LG_MG:1.25,Batas_MG_HG:1.45,Batas_HG_VHG:1.7,WMT_per_Bucket:2.2}, Limo_Aktif:false, SM_Threshold_AutoDetect:3, Bucket_per_Sampel:8 };
  }
}

// ==== classifyMaterial() -- LOGIC IDENTIK dgn dashboard.html, jangan pernah menyimpang ====
function classifyMaterial(ni, tipeOreInput, smValue) {
  const niNum = parseFloat(ni) || 0;
  const cfg = globalCOGConfig || { Sapro:{Batas_Waste_LG:0.8,Batas_LG_MG:1.25,Batas_MG_HG:1.45,Batas_HG_VHG:1.7}, Limo:{Batas_Waste_LG:0.8,Batas_LG_MG:1.25,Batas_MG_HG:1.45,Batas_HG_VHG:1.7}, Limo_Aktif:false, SM_Threshold_AutoDetect:3 };
  let tipeOreFinal = (tipeOreInput || 'Sapro').trim();
  if (!cfg.Limo_Aktif) {
    tipeOreFinal = 'Sapro';
  } else if (tipeOreFinal === 'Auto') {
    const sm = parseFloat(smValue) || 0;
    tipeOreFinal = (sm >= cfg.SM_Threshold_AutoDetect) ? 'Limo' : 'Sapro';
  } else if (tipeOreFinal !== 'Sapro' && tipeOreFinal !== 'Limo') {
    tipeOreFinal = 'Sapro';
  }
  const batas = cfg[tipeOreFinal] || cfg.Sapro;
  let classGrade;
  if (niNum <= 0) classGrade = 'N/A';
  else if (niNum < batas.Batas_Waste_LG) classGrade = 'Waste';
  else if (niNum < batas.Batas_LG_MG) classGrade = 'LG';
  else if (niNum < batas.Batas_MG_HG) classGrade = 'MG';
  else if (niNum < batas.Batas_HG_VHG) classGrade = 'HG';
  else classGrade = 'VHG';
  return { classGrade, tipeOreFinal };
}
// Tonase = Total Sampel x Bucket_per_Sampel x WMT_per_Bucket -- IDENTIK dgn updateDiggingTonaseAuto() web
function computeTonase(totalSampel, tipeOreSelected, smVal) {
  const cfg = globalCOGConfig || { Sapro:{WMT_per_Bucket:2.2}, Limo:{WMT_per_Bucket:2.2}, Limo_Aktif:false, SM_Threshold_AutoDetect:3, Bucket_per_Sampel:8 };
  const ts = parseFloat(totalSampel);
  if (isNaN(ts) || ts <= 0) return '';
  let tipeOreFinal = tipeOreSelected;
  if (!cfg.Limo_Aktif) tipeOreFinal = 'Sapro';
  else if (tipeOreSelected === 'Auto') tipeOreFinal = (!isNaN(smVal) && smVal >= (cfg.SM_Threshold_AutoDetect || 3)) ? 'Limo' : 'Sapro';
  else if (tipeOreSelected !== 'Sapro' && tipeOreSelected !== 'Limo') tipeOreFinal = 'Sapro';
  const wmt = (cfg[tipeOreFinal] && cfg[tipeOreFinal].WMT_per_Bucket) || 2.2;
  const bucketPerSampel = cfg.Bucket_per_Sampel || 8;
  return (ts * bucketPerSampel * wmt).toFixed(2);
}
function computeSM(mgo, sio2) {
  const m = parseFloat(mgo), s = parseFloat(sio2);
  if (!isNaN(m) && m > 0 && !isNaN(s)) return (s / m).toFixed(2);
  return '';
}

// ==== DATA: Digging (Produksi_GC) hari ini ====
function todayDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
let dataLoadErrorMsg = ''; // ditampilkan di UI kalau fetch Produksi gagal/ditolak server
// v90.2.115 FIX (temuan audit #1/#2 -- state Peta bisa nyangkut data lama): SEBELUMNYA
// error Validasi TIDAK mengosongkan globalValidasiFullForMap (dataset Peta lama tetap
// nyangkut), DAN renderPeta() salah pakai dataLoadErrorMsg (punya Produksi) sbg error
// Peta -- 2 fetch berbeda, 1 variabel error dicampur. Sekarang error Peta py variabel
// SENDIRI, terisi/dikosongkan HANYA oleh fetch Validasi.
let mapDataErrorMsg = '';
// [BARU] Peta sekarang bisa fetch data SENDIRI (lazy, saat tab dibuka pertama kali) --
// tidak lagi WAJIB menunggu loadRingkasanData() (Digging+Validasi) selesai dulu saat boot.
// Flag ini "diklaim" oleh SIAPAPUN yang fetch validasi DULUAN (baik loadRingkasanData()
// normal saat app dibuka, ATAU loadValidasiDataForMapStandalone_() saat tab Peta dibuka
// duluan) -- siapa pun yg lebih dulu selesai, yg satunya tidak fetch ulang redundan.
let mapDataFetchAttempted = false;
let mapDataBusy = false;
let diggingViewMode = 'today'; // 'today' kalau ada data hari ini, 'recent' kalau fallback ke entri terbaru
// v90.2.115 FIX (temuan audit #6 -- race condition): SEBELUMNYA tidak ada sequence guard --
// 2 panggilan loadRingkasanData() tumpang tindih (mis. submit form cepat berturut-turut)
// bisa membuat response LEBIH LAMA menimpa hasil response LEBIH BARU, tergantung urutan
// selesai (bukan urutan mulai). Pola sama persis dgn produksiFetchRequestSeq di dashboard.
let ringkasanFetchSeq = 0;

// [BARU] Diekstrak dari loadRingkasanData() -- forward-fill ID_TP baris kedalaman lanjutan
// (2m/3m/4m/5m yg ID_TP-nya sengaja kosong di sheet asli). Dipakai BERSAMA oleh
// loadRingkasanData() (jalur normal boot) DAN loadValidasiDataForMapStandalone_() (jalur
// lazy tab Peta) -- supaya logikanya SATU sumber kebenaran, tidak dobel/berisiko beda.
function forwardFillValidasiRows_(rawRows) {
  let lastTp = '';
  const filled = [];
  rawRows.forEach(r => {
    const idTp = String(getField(r,'ID_TP')||'').trim();
    const meterVal = String(getField(r,'Meter')||'').trim();
    if (idTp) {
      lastTp = idTp;
      filled.push(r);
    } else if (meterVal && lastTp) {
      const merged = Object.assign({}, r);
      setField(merged, 'ID_TP', lastTp);
      filled.push(merged);
    }
    // else: baris benar-benar kosong -- dilewati.
  });
  return filled;
}
async function loadRingkasanData() {
  const mySeq = ++ringkasanFetchSeq;
  dataLoadErrorMsg = '';
  mapDataErrorMsg = '';
  await fetchCOGConfig();
  if (mySeq !== ringkasanFetchSeq) return; // ada panggilan lebih baru, buang hasil basi ini
  try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=produksi&t=' + Date.now());
    const result = await response.json();
    if (mySeq !== ringkasanFetchSeq) return;
    if (result.status === 'error') {
      // Server merespons 200 tapi menolak permintaan (mis. Unauthorized krn belum ada
      // sessionToken selama Login ditunda) -- ini BUKAN "data kosong", tampilkan apa adanya.
      dataLoadErrorMsg = result.message || 'Server menolak permintaan data.';
      globalDiggingToday = [];
    } else {
      const rows = result.data || [];
      const todayLabel = new Date().toDateString();
      const todaysRows = rows.filter(r => {
        const t = r['Tanggal'];
        if (!t) return false;
        const dt = new Date(t);
        return !isNaN(dt) && dt.toDateString() === todayLabel;
      });
      if (todaysRows.length) {
        globalDiggingToday = todaysRows;
        diggingViewMode = 'today';
      } else {
        // FALLBACK: belum ada entri persis hari ini -- daripada tampil kosong total (bikin
        // seolah data tidak tersinkron), tampilkan entri TERBARU yang sudah tercatat di
        // sheet, diurutkan tanggal terbaru dulu. UI menandai ini beda dari "hari ini".
        const sorted = rows.slice().sort((a, b) => new Date(b['Tanggal']) - new Date(a['Tanggal']));
        globalDiggingToday = sorted.slice(0, 15);
        diggingViewMode = 'recent';
      }
    }
  } catch (err) {
    if (mySeq !== ringkasanFetchSeq) return;
    console.error('Gagal memuat data Digging:', err);
    dataLoadErrorMsg = 'Tidak bisa menghubungi server: ' + (err && err.message ? err.message : String(err));
    globalDiggingToday = [];
  }
  try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=validasi&t=' + Date.now());
    const result = await response.json();
    if (mySeq !== ringkasanFetchSeq) return;
    if (result.status === 'error') {
      globalValidasiToday = [];
      globalValidasiFullForMap = []; // v90.2.115 FIX #1: dataset Peta ikut dikosongkan, jangan nyangkut data lama
      mapDataErrorMsg = result.message || 'Server menolak permintaan data Validasi.';
    } else {
      const filled = forwardFillValidasiRows_(result.data || []);
      globalValidasiFullForMap = filled.slice(); // v90.2.113 (Peta): SALINAN UTUH, sengaja TIDAK
      // ikut .slice(-100) di bawah -- Peta butuh SEMUA titik TP, bukan cuma 100 baris terakhir
      // yg ditampilkan tab Validasi. "Filter Peta jangan warisi limit tab lain" (poin desain #5).
      globalValidasiToday = filled.slice(-100).reverse();
    }
    mapDataFetchAttempted = true; // [BARU] tandai -- lazy loader Peta tidak perlu fetch ulang
  } catch (err) {
    if (mySeq !== ringkasanFetchSeq) return;
    console.error('Gagal memuat data Validasi:', err);
    globalValidasiToday = [];
    globalValidasiFullForMap = []; // v90.2.115 FIX #1: dataset Peta ikut dikosongkan saat gagal
    mapDataErrorMsg = 'Tidak bisa menghubungi server: ' + (err && err.message ? err.message : String(err));
  }
  render();
}

// ==== SUBMIT DIGGING -- endpoint & skema kolom IDENTIK dgn dashboard.html ====
async function submitDiggingEntry(onStatus) {
  const f = diggingFormState;
  // BARU (28 Agu, "Submit Dulu Koreksi Nanti", menyusul web): Tujuan & assay SEKARANG
  // opsional -- Pit/Blok/Total Sampel/ID Sampel yang wajib, sama persis validasi backend
  // (yang sudah diperbarui utk fitur ini kemarin).
  if (!f.pit || !f.blok || !f.total_sampel || !f.id_sampel) {
    onStatus('Pit, Blok, Total Sampel, dan ID Sampel wajib diisi.', false);
    return false;
  }
  const smVal = computeSM(f.mgo, f.sio2);
  const tonase = computeTonase(f.total_sampel, f.tipe_ore, parseFloat(smVal));
  if (!tonase) {
    onStatus('Total Sampel belum valid, Tonase tidak bisa dihitung.', false);
    return false;
  }
  // BARU (28 Agu): Ni kosong -> Material "Menunggu Assay" (bukan diklasifikasi asal jadi
  // grade palsu dari Ni=0) -- sama persis logika yang sudah dipakai di web.
  const niRaw = String(f.ni || '').trim();
  let materialVal, tipeOreVal;
  if (!niRaw) {
    materialVal = 'Menunggu Assay';
    tipeOreVal = f.tipe_ore === 'Auto' ? 'Sapro' : f.tipe_ore;
  } else {
    const classify = classifyMaterial(f.ni, f.tipe_ore, smVal);
    materialVal = classify.classGrade;
    tipeOreVal = classify.tipeOreFinal;
  }
  onStatus('Menyimpan data...', true, true);
  try {
    const payload = buildAuthenticatedPayload({
      sheet_name: 'Produksi_GC',
      tanggal: todayDateStr(),
      shift: f.shift, cuaca: f.cuaca,
      pit: f.pit, blok: f.blok,
      material: materialVal, tipe_ore: tipeOreVal,
      id_sampel: f.id_sampel, total_sampel: f.total_sampel,
      tonase: tonase,
      ni: f.ni, fe: f.fe, co: f.co, mgo: f.mgo, sio2: f.sio2, sm: smVal,
      tujuan: f.tujuan, ship: f.tujuan === 'Direct' ? f.ship : ''
    });
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
    const result = await response.json();
    if (result.status === 'success') {
      onStatus(result.auto_route ? ('Tersimpan -- ' + result.auto_route) : 'Data produksi berhasil disimpan!', true);
      return true;
    }
    throw new Error(result.message || 'Gagal menyimpan data produksi.');
  } catch (err) {
    console.error('Submit digging error:', err);
    onStatus(err.message || 'Terjadi kesalahan saat menyimpan.', false);
    return false;
  }
}

// ==== BARU (28 Agu, "Submit Dulu Koreksi Nanti" -- menyusul web): MODAL UPDATE HASIL
// ASSAY. Terhubung ke action updateAssayResult yang SUDAH ADA di backend sejak kemarin
// (dibangun bareng fitur ini utk web) -- di sini murni kerjaan Android, backend tidak
// perlu disentuh sama sekali.
let updateAssayModalOpen = false;
let updateAssayForm = { ni:'', fe:'', co:'', mgo:'', sio2:'', tipe_ore:'Sapro', tujuan:'', ship:'' };
let updateAssayStatusMsg = '', updateAssayStatusOk = true, updateAssayBusy = false;

function openUpdateAssayModal() {
  const r = diggingDisplayedRows[diggingDetailIndex];
  if (!r) return;
  updateAssayForm = { ni:'', fe:'', co:'', mgo:'', sio2:'', tipe_ore:'Sapro', tujuan:'', ship:'' };
  updateAssayStatusMsg = '';
  updateAssayModalOpen = true;
  render();
}
function closeUpdateAssayModal() { updateAssayModalOpen = false; render(); }
function updateAssayField(name, val) { updateAssayForm[name] = val; render(); }

function renderUpdateAssayModal(justOpened) {
  if (!updateAssayModalOpen) return '';
  const r = diggingDisplayedRows[diggingDetailIndex];
  if (!r) return '';
  const f = updateAssayForm;
  // Tujuan cuma ditawarkan kalau baris ini BELUM pernah punya Tujuan -- kalau sudah
  // ada (mis. sudah EFO ke Dome tertentu), ganti Tujuan/Dome bukan cakupan modal ini.
  const tujuanBelumAda = !getField(r,'Tujuan') || getField(r,'Tujuan') === '-';
  const body =
    '<div class="rounded-[10px] bg-amber-500/10 border border-amber-500/25 px-3 py-2.5 text-[10px] text-amber-300 leading-relaxed mb-3">Isi hasil assay dari lab. Material akan dihitung ulang otomatis begitu Ni % diisi.</div>' +
    '<div class="grid grid-cols-3 gap-2.5">' +
      fieldRow('Ni %', numField('ni', f.ni, '1.85').replace(/updateDiggingField/g, 'updateAssayField')) +
      fieldRow('Fe %', numField('fe', f.fe, '12.40').replace(/updateDiggingField/g, 'updateAssayField')) +
      fieldRow('Co %', numField('co', f.co, '0.08').replace(/updateDiggingField/g, 'updateAssayField')) +
    '</div>' +
    '<div class="grid grid-cols-2 gap-2.5 mt-2.5">' +
      fieldRow('MgO %', numField('mgo', f.mgo, '28.50').replace(/updateDiggingField/g, 'updateAssayField')) +
      fieldRow('SiO2 %', numField('sio2', f.sio2, '38.20').replace(/updateDiggingField/g, 'updateAssayField')) +
    '</div>' +
    '<div class="mt-2.5">' + fieldRow('Tipe Ore', selectField('tipe_ore', ['Sapro','Limo','Auto'], f.tipe_ore).replace(/updateDiggingField/g, 'updateAssayField')) + '</div>' +
    (tujuanBelumAda ? '<div class="mt-2.5">' + fieldRow('Tujuan', selectField('tujuan', ['','EFO','ETO','Direct','Disposal'], f.tujuan).replace(/updateDiggingField/g, 'updateAssayField')) + '</div>' : '') +
    (tujuanBelumAda && f.tujuan === 'Direct' ? '<div class="mt-2.5">' + fieldRow('Nama Ship', textField('ship', f.ship, 'cth. MV Ocean Star').replace(/updateDiggingField/g, 'updateAssayField')) + '</div>' : '') +
    (updateAssayStatusMsg ? '<p class="text-xs font-medium mt-3 ' + (updateAssayStatusOk?'text-emerald-400':'text-rose-400') + '">' + updateAssayStatusMsg + '</p>' : '') +
    '<button onclick="handleSubmitUpdateAssay()" ' + (updateAssayBusy?'disabled':'') + ' class="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl disabled:opacity-60 mt-4">' +
      (updateAssayBusy ? '<span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full spin"></span>' : icon('save','w-4 h-4')) +
      '<span>' + (updateAssayBusy?'Menyimpan...':'Simpan Hasil Assay') + '</span>' +
    '</button>';
  return renderSimpleModal('Update Hasil Assay', getField(r,'ID Sampel') || '-', body, 'closeUpdateAssayModal()', undefined, justOpened);
}

async function handleSubmitUpdateAssay() {
  const r = diggingDisplayedRows[diggingDetailIndex];
  const f = updateAssayForm;
  const idSampel = r ? getField(r,'ID Sampel') : '';
  if (!idSampel) { updateAssayStatusMsg = 'ID Sampel baris ini kosong, tidak bisa diupdate.'; updateAssayStatusOk = false; render(); return; }
  const niRaw = String(f.ni || '').trim();
  if (!niRaw) { updateAssayStatusMsg = 'Ni % wajib diisi untuk menyimpan hasil assay.'; updateAssayStatusOk = false; render(); return; }

  const smVal = computeSM(f.mgo, f.sio2);
  const classify = classifyMaterial(f.ni, f.tipe_ore, smVal);
  updateAssayBusy = true; updateAssayStatusMsg = ''; render();
  try {
    const payload = buildAuthenticatedPayload({
      action: 'updateAssayResult',
      id_sampel: idSampel,
      ni: f.ni, fe: f.fe, co: f.co, mgo: f.mgo, sio2: f.sio2, sm: smVal,
      material: classify.classGrade, tipe_ore: classify.tipeOreFinal,
      tujuan: f.tujuan || '', ship: f.tujuan === 'Direct' ? f.ship : ''
    });
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Gagal menyimpan hasil assay.');
    updateAssayStatusMsg = result.auto_route ? ('Tersimpan -- ' + result.auto_route) : 'Hasil assay berhasil disimpan!';
    updateAssayStatusOk = true;
    render();
    setTimeout(() => {
      closeUpdateAssayModal();
      closeDiggingDetail();
      loadRingkasanData();
    }, 900);
  } catch (err) {
    console.error('Update assay error:', err);
    updateAssayStatusMsg = err.message || 'Terjadi kesalahan saat menyimpan.';
    updateAssayStatusOk = false;
  }
  updateAssayBusy = false;
  render();
}


// ==== RINGKASAN & TABEL DIGGING ====
function renderRingkasan() {
  const rows = globalDiggingToday;
  const totalTonase = sumField(rows, 'Tonase');
  const oreRows = rows.filter(r => String(r['Material']||'').toUpperCase() !== 'WASTE' && String(r['Material']||'').toUpperCase() !== 'N/A');
  const totalOre = sumField(oreRows, 'Tonase');
  const avgNi = avgField(rows, 'Ni %') || avgField(rows, 'Ni');
  const nonWasteRows = rows.filter(r => String(r['Material']||'').toUpperCase() !== 'WASTE');
  const avgNiCleanRows = nonWasteRows.length ? nonWasteRows : rows;
  const avgNiClean = avgField(avgNiCleanRows, 'Ni %') || avgField(avgNiCleanRows, 'Ni');
  const avgSM = avgField(rows, 'SM %') || avgField(rows, 'SM');
  const oreTypes = new Set(oreRows.map(r => r['Material']).filter(Boolean));
  const dominantOre = oreRows.length ? (oreRows[0]['Material'] || '-') : '-';

  function card(iconName, borderColor, badgeBg, badge, label, value, unit, sub, barPct) {
    return '<div class="flex-1 min-h-0 rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-[12px] flex flex-col justify-between gap-[8px]">' +
      '<div class="flex justify-end leading-none shrink-0">' +
        (badge ? '<span class="text-[9px] font-bold rounded-full px-[8px] py-[3px] tracking-wide leading-none ' + badgeBg + ' text-white">' + badge + '</span>' : '') +
      '</div>' +
      '<div class="flex gap-[10px] items-center flex-1 min-h-0">' +
        '<div class="w-[44px] h-[44px] shrink-0 rounded-full bg-[#0b1329] flex items-center justify-center border-[2px] ' + borderColor + '">' +
          icon(iconName, 'w-[24px] h-[24px] text-white') +
        '</div>' +
        '<div class="flex-1 min-w-0 flex flex-col justify-center gap-[2px]">' +
          '<span class="text-[10px] font-bold tracking-[0.12em] text-white/60 leading-[1.1]">' + label + '</span>' +
          '<div class="flex items-baseline gap-1">' +
            '<span class="text-[24px] font-black leading-none text-white tracking-tight">' + value + '</span>' +
            (unit ? '<span class="text-[11px] font-bold text-white/50 leading-none">' + unit + '</span>' : '') +
          '</div>' +
          '<div class="text-[9px] font-medium text-white/50 leading-[1.2] truncate">' + sub + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="shrink-0"><div class="h-[2px] w-full rounded-full bg-white/[0.08] overflow-hidden">' +
        '<div class="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#22c55e]" style="width:' + Math.min(100,barPct||0) + '%"></div>' +
      '</div></div>' +
    '</div>';
  }

  const modeLabel = diggingViewMode === 'today' ? 'hari ini' : 'terbaru tercatat';
  let html = renderHeader();
  html += '<main class="app-main flex-1 min-h-0 flex flex-col gap-[10px] px-4 pt-3 pb-3">';
  html += renderSectionTitle('RINGKASAN', diggingViewMode === 'today' ? '4 metrik &bull; live' : 'entri terbaru');
  html += renderErrorBanner();
  if (!rows.length) {
    html += '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-6 text-center text-white/40 text-xs">Belum ada data Digging tercatat sama sekali. Tekan tombol + di Digging utk mulai input.</div>';
  } else {
    html += '<div class="flex-1 min-h-0 flex flex-col gap-[10px] justify-between">';
    html += card('pickaxe', 'border-[#2563eb]', 'bg-[#2563eb]', rows.length + ' ENTRI', 'TOTAL DIGGING', totalTonase.toFixed(0), 'Ton', rows.length + ' baris data ' + modeLabel, 100);
    html += card('layers', 'border-[#2563eb]', 'bg-[#2563eb]', rows.length + ' ENTRI', 'TOTAL ORE', totalOre.toFixed(0), 'Ton', dominantOre + ' &bull; ' + oreTypes.size + ' jenis ore', totalTonase ? (totalOre/totalTonase*100) : 0);
    html += card('flask-conical', 'border-[#2563eb]', 'bg-[#2563eb]', 'VALID', 'RATA-RATA NI', avgNi.toFixed(2) + '%', '', 'Dari ' + rows.length + ' entri rata-rata sampel', Math.min(100, avgNi/2.5*100));
    html += card('gem', 'border-[#22c55e]', 'bg-[#22c55e]', 'CLEAN', 'RATA-RATA NI TANPA WASTE', avgNiClean.toFixed(2) + '%', '', 'Clean ore grade tanpa impurities', Math.min(100, avgNiClean/2.5*100));
    html += '</div>';
    // Kartu Issue & Rekomendasi: sekarang AKTIF -- klik buka daftar issue asli
    // (sheet "Masalah & Rekomendasi"), bukan cuma titik hijau dekoratif.
    html += '<button onclick="openIssueModal()" class="shrink-0 rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-[14px] flex items-center justify-between gap-2 w-full text-left active:scale-[0.99] transition-transform">' +
      '<div class="flex items-center gap-[8px] min-w-0 flex-1">' +
        '<div class="w-[28px] h-[28px] rounded-[8px] bg-[#2563eb]/15 border border-[#2563eb]/20 flex items-center justify-center shrink-0">' +
          icon('clipboard-list','w-[18px] h-[18px] text-[#2563eb]') +
        '</div>' +
        '<span class="text-[12px] font-bold text-white leading-[1.2] tracking-tight">Daftar Issue &amp; Rekomendasi Action Operasional</span>' +
      '</div>' +
      icon('chevron-right','w-[16px] h-[16px] text-white/30 shrink-0') +
    '</button>';
  }
  html += '</main>';
  html += renderBottomNav();
  return html;
}

// ==== RENDER: TABEL (DIGGING LOG) ====
let diggingSearchQuery = '';
let diggingDisplayedRows = [];
function renderTabel() {
  const allRows = globalDiggingToday;
  const q = diggingSearchQuery.trim().toLowerCase();
  const rows = q ? allRows.filter(r => {
    const idSampel = String(r['ID Sampel'] || '').toLowerCase();
    const pit = String(r['Pit'] || '').toLowerCase();
    const blok = String(r['Blok'] || '').toLowerCase();
    return idSampel.includes(q) || pit.includes(q) || blok.includes(q);
  }) : allRows;
  diggingDisplayedRows = rows;
  const countLabel = diggingViewMode === 'today' ? (allRows.length + ' entri &bull; live') : (allRows.length + ' entri terbaru');

  let html = renderHeader();
  html += '<main class="app-main flex-1 min-h-0 flex flex-col gap-[10px] px-4 pt-3 pb-3">';
  html += renderSectionTitle('DIGGING LOG', countLabel);
  html += renderErrorBanner();
  html += '<div class="flex flex-row items-center gap-[8px] shrink-0">' +
    '<div class="flex-1 flex items-center gap-[8px] bg-[#0b1329] border border-white/10 rounded-full px-[12px] py-[8px] min-w-0">' +
      icon('search','w-[16px] h-[16px] text-white/40 shrink-0') +
      '<input value="' + diggingSearchQuery.replace(/"/g,'&quot;') + '" oninput="updateDiggingSearch(this.value)" placeholder="Cari ID Sampel / Pit / Blok..." class="flex-1 bg-transparent outline-none text-[12px] font-medium text-white placeholder:text-white/35 min-w-0">' +
    '</div>' +
    '<button aria-label="Input Digging" onclick="openDiggingForm()" class="shrink-0 w-9 h-9 rounded-full bg-[#2563eb] border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' +
      icon('plus','w-[20px] h-[20px] text-white') +
    '</button>' +
  '</div>';
  if (!rows.length) {
    html += '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-6 text-center text-white/40 text-xs">' + (q ? 'Tidak ada entri yang cocok dgn pencarian.' : 'Belum ada entri.') + '</div>';
  } else {
    html += '<div class="flex-1 min-h-0 flex flex-col gap-[10px] overflow-y-auto overflow-x-hidden">';
    rows.forEach((r, i) => {
      const ni = parseFloat(r['Ni %'] ?? r['Ni']) || 0;
      const sm = parseFloat(r['SM %'] ?? r['SM']) || 0;
      const material = r['Material'] || '-';
      const numLabel = String(i + 1).padStart(3, '0');
      // BARU (28 Agu): baris "Menunggu Assay" dapat badge kuning berkedip, bukan badge
      // grade biasa -- sama persis pola yg sudah dipakai web.
      const isPendingAssay = material === 'Menunggu Assay';
      const statusBadgeHtml = isPendingAssay
        ? '<span class="px-2 py-0.5 rounded-md text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>Menunggu Lab</span>'
        : renderClassGradeBadge(material);
      html += '<button onclick="openDiggingDetail(' + i + ')" class="text-left min-h-[62px] rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-3.5 flex items-center justify-between shrink-0 active:scale-[0.99] transition-transform">' +
        '<div class="flex items-center gap-3 min-w-0">' +
          '<div class="w-10 h-10 rounded-[10px] bg-white/[0.06] border border-white/10 flex items-center justify-center text-[11px] font-black text-white/70 shrink-0">' + numLabel + '</div>' +
          '<div class="min-w-0">' +
            '<div class="text-white font-bold text-[13px] leading-none truncate">' + (r['Pit']||'-') + ' &bull; ' + (parseFloat(r['Tonase'])||0).toFixed(0) + ' Ton</div>' +
            '<div class="text-[11px] text-white/45 mt-1 font-medium truncate">Ni ' + ni.toFixed(2) + '%' + (sm ? (' &bull; SM ' + sm.toFixed(2)) : '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="shrink-0 ml-2">' + statusBadgeHtml + '</div>' +
      '</button>';
    });
    html += '</div>';
  }
  html += '</main>';
  html += renderBottomNav();
  return html;
}
function updateDiggingSearch(val) { diggingSearchQuery = val; render(); }
function updateValidasiSearch(val) { validasiSearchQuery = val; render(); }

// ==== MODAL: DETAIL DIGGING (klik item di daftar Digging) ====
let diggingDetailOpen = false;
let diggingDetailIndex = -1;
function openDiggingDetail(idx) { diggingDetailIndex = idx; diggingDetailOpen = true; render(); }
function closeDiggingDetail() { diggingDetailOpen = false; render(); }
function renderDiggingDetailModal(justOpened) {
  if (!diggingDetailOpen) return '';
  const r = diggingDisplayedRows[diggingDetailIndex];
  if (!r) return '';
  // v90.2.116 (permintaan user -- keseragaman visual dgn Detail Test Pit): dari daftar
  // baris rata datar, dipindah jadi kartu 2-kolom (identitas) + grid statistik assay
  // (mirip renderValidasi's assayStat) + baris administratif di bawah -- pola SAMA persis
  // dgn renderMapDetailModal/renderValidasi, supaya seluruh modal detail app ini konsisten.
  function infoCard(label1, val1, label2, val2) {
    return '<div class="grid grid-cols-2 gap-2">' +
      '<div class="rounded-xl bg-[#0b1329] border border-white/[0.08] p-3"><div class="text-[10px] text-white/40 font-medium mb-0.5">' + label1 + '</div><div class="text-sm font-bold text-white">' + (val1||'-') + '</div></div>' +
      '<div class="rounded-xl bg-[#0b1329] border border-white/[0.08] p-3"><div class="text-[10px] text-white/40 font-medium mb-0.5">' + label2 + '</div><div class="text-sm font-bold text-white">' + (val2||'-') + '</div></div>' +
    '</div>';
  }
  function assayStat(label, val) {
    return '<div class="flex-1 min-w-0"><div class="text-[9px] font-bold text-white/35 tracking-wide">' + label + '</div><div class="text-[13px] font-bold text-white mt-0.5">' + (val||'-') + '</div></div>';
  }
  function adminRow(label, val) {
    return '<div class="flex items-center justify-between py-1.5 border-b border-white/[0.06] text-[11px]"><span class="text-white/45 font-medium">' + label + '</span><span class="text-white font-semibold text-right">' + (val || '-') + '</span></div>';
  }
  const tonase = parseFloat(getField(r,'Tonase')) || 0;
  const ni = getField(r,'Ni %') || getField(r,'Ni');
  const body = '<div class="flex flex-col gap-2 mb-3">' +
      infoCard('Tanggal', getField(r,'Tanggal'), 'Shift', getField(r,'Shift')) +
      infoCard('Cuaca', getField(r,'Cuaca'), 'Pelapor', getField(r,'Pelapor')) +
      infoCard('Pit', getField(r,'Pit'), 'Blok', getField(r,'Blok')) +
      infoCard('Material', getField(r,'Material'), 'ID Sampel', getField(r,'ID Sampel')) +
      infoCard('Total Sampel', getField(r,'Total_Sampel'), 'Tonase', tonase ? (tonase.toFixed(2) + ' Ton') : '-') +
    '</div>' +
    '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4 mb-3">' +
      '<div class="text-[10px] font-bold text-white/40 tracking-wide mb-2">HASIL ASSAY</div>' +
      '<div class="flex items-start gap-2 flex-wrap">' +
        assayStat('NI %', fmt2(parseFloat(ni))) +
        assayStat('FE %', fmt2(parseFloat(getField(r,'Fe %') || getField(r,'Fe')))) +
        assayStat('CO %', fmt2(parseFloat(getField(r,'Co %') || getField(r,'Co')))) +
        assayStat('MGO %', fmt2(parseFloat(getField(r,'MgO %') || getField(r,'MgO')))) +
        assayStat('SIO2 %', fmt2(parseFloat(getField(r,'SiO2 %') || getField(r,'SiO2')))) +
        assayStat('SM %', fmt2(parseFloat(getField(r,'SM %') || getField(r,'SM')))) +
      '</div>' +
    '</div>' +
    '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4">' +
      adminRow('Tujuan', getField(r,'Tujuan')) +
      adminRow('ID EFO', getField(r,'ID EFO')) +
      adminRow('ID ETO', getField(r,'ID ETO')) +
      adminRow('Ship', getField(r,'Ship')) +
      adminRow('Tipe Ore', getField(r,'Tipe_Ore')) +
      adminRow('Keterangan', getField(r,'Keterangan')) +
    '</div>';
  // BARU (28 Agu): tombol "Update Hasil Assay" cuma muncul kalau Material masih
  // "Menunggu Assay" -- sama persis pola web.
  const isPending = getField(r,'Material') === 'Menunggu Assay';
  const actionBtn = isPending
    ? '<button onclick="openUpdateAssayModal()" class="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md animate-pulse">' + icon('flask-conical','w-3.5 h-3.5') + '<span>Update Hasil Assay</span></button>'
    : '';
  return renderSimpleModal('Detail Digging', getField(r,'ID Sampel') || (getField(r,'Pit')||'-'), body + actionBtn, 'closeDiggingDetail()', undefined, justOpened);
}

// [PARTISI -- 4 Sep, susulan] Form Input Digging utama (sempat tertinggal di index.html
// saat ekstraksi awal Tahap 4, beda dari Update Assay form yg sudah lebih dulu pindah).
// ==== RENDER: MODAL INPUT DIGGING ====
let diggingModalOpen = false;
let diggingStatusMsg = '', diggingStatusOk = true, diggingBusy = false;
function renderDiggingModal(justOpened) {
  if (!diggingModalOpen) return '';
  const animClass = (justOpened === false) ? '' : ' fade-in';
  const f = diggingFormState;
  const smPreview = computeSM(f.mgo, f.sio2);
  const tonasePreview = computeTonase(f.total_sampel, f.tipe_ore, parseFloat(smPreview));
  return '' +
  '<div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-end' + animClass + '" onclick="if(event.target===this)closeDiggingForm()">' +
    '<div class="w-full max-w-[480px] mx-auto bg-[#0e1933] rounded-t-[28px] max-h-[92vh] overflow-y-auto border-t border-white/10">' +
      '<div class="sticky top-0 bg-[#0e1933] px-5 pt-5 pb-3 border-b border-white/[0.06] flex items-center justify-between">' +
        '<div><div class="text-sm font-bold text-white">Input Data Digging</div><div class="text-[10px] text-white/35">Produksi_GC &bull; ' + todayDateStr() + '</div></div>' +
        '<button onclick="closeDiggingForm()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">' + icon('x','w-4 h-4 text-white/50') + '</button>' +
      '</div>' +
      '<div class="px-5 py-4 space-y-3">' +
        fieldRow('Pelapor', '<div class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/60">' + ((sessionInfo && sessionInfo.userName) ? sessionInfo.userName + ' (otomatis dari sesi login)' : 'Belum login -- Pelapor akan diisi server saat login aktif') + '</div>') +
        '<div class="grid grid-cols-2 gap-2.5">' +
          fieldRow('Shift', selectField('shift', ['Pagi','Malam'], f.shift)) +
          fieldRow('Cuaca', selectField('cuaca', ['Cerah','Mendung','Hujan'], f.cuaca)) +
        '</div>' +
        '<div class="grid grid-cols-2 gap-2.5">' +
          fieldRow('Pit *', textField('pit', f.pit, 'cth. Limon')) +
          fieldRow('Blok *', textField('blok', f.blok, 'cth. L-05')) +
        '</div>' +
        fieldRow('Tipe Ore *', selectField('tipe_ore', ['Sapro','Limo','Auto'], f.tipe_ore)) +
        '<div class="grid grid-cols-2 gap-2.5">' +
          fieldRow('ID Sampel *', textField('id_sampel', f.id_sampel, 'cth. DM01.L.05')) +
          fieldRow('Total Sampel (Karung) *', numField('total_sampel', f.total_sampel, 'cth. 25')) +
        '</div>' +
        fieldRow('Tonase (Otomatis)', '<div class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/60">' + (tonasePreview || '-') + ' Ton</div>') +
        '<div class="rounded-[10px] bg-amber-500/10 border border-amber-500/25 px-3 py-2.5 text-[10px] text-amber-300 leading-relaxed">Ni % dan Tujuan boleh dikosongkan dulu kalau hasil lab belum keluar -- lengkapi belakangan lewat "Update Hasil Assay" di detail baris.</div>' +
        '<div class="grid grid-cols-3 gap-2.5">' +
          fieldRow('Ni %', numField('ni', f.ni, '1.85')) +
          fieldRow('Fe %', numField('fe', f.fe, '12.40')) +
          fieldRow('Co %', numField('co', f.co, '28.50')) +
        '</div>' +
        '<div class="grid grid-cols-2 gap-2.5">' +
          fieldRow('MgO %', numField('mgo', f.mgo, '28.50')) +
          fieldRow('SiO2 %', numField('sio2', f.sio2, '38.20')) +
        '</div>' +
        fieldRow('SM % (otomatis)', '<div class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/60">' + (smPreview || '-') + '</div>') +
        fieldRow('Tujuan', selectField('tujuan', ['','EFO','ETO','Direct','Disposal'], f.tujuan)) +
        (f.tujuan === 'Direct' ? fieldRow('Nama Ship', textField('ship', f.ship, 'cth. MV Ocean Star')) : '') +
        (diggingStatusMsg ? '<p class="text-xs font-medium ' + (diggingStatusOk?'text-emerald-400':'text-rose-400') + '">' + diggingStatusMsg + '</p>' : '') +
      '</div>' +
      '<div class="sticky bottom-0 bg-[#0e1933] px-5 py-4 border-t border-white/[0.06]">' +
        '<button onclick="handleSubmitDigging()" ' + (diggingBusy?'disabled':'') + ' class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm py-3 rounded-xl disabled:opacity-60">' +
          (diggingBusy ? '<span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full spin"></span>' : icon('save','w-4 h-4')) +
          '<span>' + (diggingBusy?'Menyimpan...':'Simpan Data') + '</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}
function fieldRow(label, inputHtml) {
  return '<div><label class="block text-[11px] text-white/45 mb-1 font-medium">' + label + '</label>' + inputHtml + '</div>';
}
function textField(name, val, placeholder) {
  return '<input type="text" value="' + (val||'').replace(/"/g,'&quot;') + '" placeholder="' + placeholder + '" oninput="updateDiggingField(\'' + name + '\', this.value)" class="w-full bg-[#0b1329] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/50">';
}
function numField(name, val, placeholder) {
  return '<input type="number" step="any" value="' + (val||'') + '" placeholder="' + placeholder + '" oninput="updateDiggingField(\'' + name + '\', this.value)" class="w-full bg-[#0b1329] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/50">';
}
function selectField(name, options, val) {
  let html = '<select onchange="updateDiggingField(\'' + name + '\', this.value)" class="w-full bg-[#0b1329] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/50">';
  options.forEach(o => { html += '<option value="' + o + '" ' + (o===val?'selected':'') + '>' + (o||'-') + '</option>'; });
  html += '</select>';
  return html;
}
function updateDiggingField(name, val) {
  diggingFormState[name] = val;
  render();
  requestAnimationFrame(() => { const el = document.querySelector('[data-focus-guard]'); });
}

// ==== ACTIONS ====
function openDiggingForm() {
  diggingFormState = { tanggal: todayDateStr(), shift:'Pagi', cuaca:'Cerah', pit:'', blok:'', tipe_ore:'Sapro', id_sampel:'', total_sampel:'', ni:'', fe:'', co:'', mgo:'', sio2:'', tujuan:'', ship:'' };
  diggingStatusMsg = ''; diggingBusy = false;
  diggingModalOpen = true;
  render();
}
function closeDiggingForm() { diggingModalOpen = false; render(); }
async function handleSubmitDigging() {
  diggingBusy = true; render();
  const ok = await submitDiggingEntry((msg, isOk) => { diggingStatusMsg = msg; diggingStatusOk = isOk; render(); });
  diggingBusy = false;
  if (ok) {
    setTimeout(async () => { diggingModalOpen = false; await loadRingkasanData(); }, 900);
  } else {
    render();
  }
}
