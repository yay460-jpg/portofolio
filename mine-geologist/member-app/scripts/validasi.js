/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- member-app/scripts/validasi.js
 * [PARTISI -- 4 Sep, Tahap 4] Grouping baris Validasi per ID_TP (numFieldGet/avgOf/
 * groupValidasiByTp -- dipakai jg oleh peta.js via buildMapData), Tab Validasi
 * (tabel+detail+form input), badge Class Grade. Diekstrak dari index.html tunggal
 * -- 0 restrukturisasi logika.
 * Catatan: updateValidasiSearch() TETAP di scripts/digging.js (kebetulan berdekatan
 * scr fisik dgn updateDiggingSearch() saat ekstraksi Tahap 4 -- global scope jadi
 * lokasinya tidak memengaruhi fungsi, murni catatan histori).
 * Dependency: config.js, digging.js (globalValidasiToday/FullForMap, globalCOGConfig,
 * classifyMaterial), render()/renderErrorBanner()/renderSectionTitle() (Tahap 5).
 * ============================================================ */

function numFieldGet(row, ...names) {
  for (const n of names) { const v = parseFloat(getField(row, n)); if (!isNaN(v)) return v; }
  return null;
}
function avgOf(arr) { const v = arr.filter(x => x !== null); return v.length ? (v.reduce((a,b)=>a+b,0)/v.length) : null; }
// [PARTISI -- 4 Sep, Tahap 2] fmt2 dipindah ke scripts/config.js.

function groupValidasiByTp(rows) {
  const map = {}, order = [];
  rows.forEach(r => {
    const idTp = String(getField(r,'ID_TP')||'').trim();
    if (!idTp) return;
    if (!map[idTp]) { map[idTp] = []; order.push(idTp); }
    map[idTp].push(r);
  });
  return order.map(idTp => {
    const depths = map[idTp].slice().sort((a,b) => (numFieldGet(a,'Meter')||0) - (numFieldGet(b,'Meter')||0));
    // Field umum per-TP (Area/Bench/Timur/Utara/Warna/Struktur) biasanya cuma diisi di
    // baris kedalaman pertama -- ambil dari baris manapun yang punya nilai non-kosong.
    function pickStatic(name) { const found = depths.find(d => String(getField(d,name)||'').trim()); return found ? getField(found,name) : ''; }
    // v90.2.115 FIX (temuan audit #4 -- konflik koordinat disembunyikan): SEBELUMNYA
    // pickStatic() diam2 memilih nilai PERTAMA yg ditemukan kalau ada >1 baris kedalaman
    // dgn Timur/Utara BEDA (data rusak/salah input) -- tidak ada tanda apapun ke user.
    // Fungsi ini SAMA seperti pickStatic tapi tambah deteksi: kalau ada >1 nilai UNIK
    // non-kosong utk field yg sama, tandai conflict=true.
    function pickStaticWithConflict(name) {
      const nonEmpty = depths.map(d => String(getField(d,name)||'').trim()).filter(v => v);
      const unique = [...new Set(nonEmpty)];
      return { value: nonEmpty.length ? nonEmpty[0] : '', conflict: unique.length > 1 };
    }
    const timurResult = pickStaticWithConflict('Timur');
    const utaraResult = pickStaticWithConflict('Utara');
    const niArr = depths.map(d => numFieldGet(d,'Ni %','Ni'));
    const feArr = depths.map(d => numFieldGet(d,'Fe %','Fe'));
    const coArr = depths.map(d => numFieldGet(d,'Co %','Co'));
    const mgoArr = depths.map(d => numFieldGet(d,'MgO %','MgO'));
    const sio2Arr = depths.map(d => numFieldGet(d,'SiO2 %','SiO2'));
    const smArr = depths.map(d => numFieldGet(d,'SM %','SM'));
    const avgNi = avgOf(niArr), avgSm = avgOf(smArr);
    const tipeLateritRaw = String(pickStatic('Tipe_Laterit')||'').toLowerCase();
    const tipeOreMapped = tipeLateritRaw.indexOf('limo') >= 0 ? 'Limo' : 'Sapro';
    let classGrade = '-';
    if (avgNi !== null) { try { classGrade = classifyMaterial(avgNi, tipeOreMapped, avgSm).classGrade; } catch (e) {} }
    const depthValues = depths.map(d => numFieldGet(d,'Meter')).filter(v => v !== null);
    const maxDepth = depthValues.length ? Math.max(...depthValues) : 0;
    return {
      idTp, depths,
      blok: pickStatic('Blok'), area: pickStatic('Area'), bench: pickStatic('Bench'), timur: timurResult.value, utara: utaraResult.value,
      coordConflict: timurResult.conflict || utaraResult.conflict, // v90.2.115 (temuan #4)
      warna: pickStatic('Warna'), struktur: pickStatic('Struktur'), tipeLaterit: pickStatic('Tipe_Laterit'),
      tanggal: pickStatic('Tanggal'), pelapor: pickStatic('Pelapor'),
      avgNi, avgFe: avgOf(feArr), avgCo: avgOf(coArr), avgMgo: avgOf(mgoArr), avgSio2: avgOf(sio2Arr), avgSm,
      classGrade, depthCount: depths.length, maxDepth
    };
  });
}

// v90.2.113 BARU (Peta -- kontrak mapData): dibangun dari dataset UTUH globalValidasiFullForMap
// (bukan globalValidasiToday yg sudah kepotong 100), lalu disaring hanya field yg genuinely
// dibutuhkan Peta (poin desain #1 "field minimum") -- BUKAN seluruh baris Validasi mentah.
// Detail assay/kedalaman tetap ada (via `depths` dari groupValidasiByTp), tapi field lain yg
// tidak relevan utk visualisasi lokasi (Pelapor dkk) sengaja tidak dibawa ke object akhir ini.

// ==== TAB VALIDASI (tabel + detail + form input) ====
// ==== Class Grade badge -- sistem IDENTIK dgn dashboard web (renderClassGradeBadge()):
// 5 preset warna translucent+border, dibaca dari globalCOGConfig.Warna_<Grade> kalau
// Developer sudah kustomisasi lewat Settings, fallback ke default sama persis dgn master.
// [PARTISI -- 4 Sep, catatan] Konstanta ini sempat tertinggal terpisah di index.html saat
// ekstraksi awal (comment header-nya tidak ketangkap batas potong) -- dipindahkan susulan
// ke sini (lokasi yg benar, bareng fungsi yg memakainya) sebelum sempat kepakai/hilang.
const GRADE_COLOR_PRESETS = {
  merah: { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
  abu: { text: 'text-slate-400', bg: 'bg-slate-700/40', border: 'border-slate-600/40' },
  kuning: { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  biru: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  hijau: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }
};
const GRADE_COLOR_DEFAULTS = { Waste: 'abu', LG: 'kuning', MG: 'biru', HG: 'hijau', VHG: 'hijau' };
function getGradeColorPreset(classGrade) {
  const cfg = globalCOGConfig || {};
  const colorKey = cfg['Warna_' + classGrade] || GRADE_COLOR_DEFAULTS[classGrade] || 'abu';
  return GRADE_COLOR_PRESETS[colorKey] || GRADE_COLOR_PRESETS['abu'];
}
function renderClassGradeBadge(classGrade) {
  if (classGrade === 'N/A' || !classGrade || classGrade === '-') {
    return '<span class="px-2 py-0.5 rounded-md text-[11px] bg-slate-700/40 text-slate-400 border border-slate-600/40 font-semibold">N/A</span>';
  }
  const preset = getGradeColorPreset(classGrade);
  return '<span class="px-2 py-0.5 rounded-md text-[11px] ' + preset.bg + ' ' + preset.text + ' border ' + preset.border + ' font-semibold">' + classGrade + '</span>';
}

let validasiSearchQuery = '';
let validasiDisplayedGroups = [];
function renderValidasi() {
  const allGroups = groupValidasiByTp(globalValidasiToday);
  const q = validasiSearchQuery.trim().toLowerCase();
  const groups = q ? allGroups.filter(g => g.idTp.toLowerCase().includes(q) || String(g.area||'').toLowerCase().includes(q)) : allGroups;
  validasiDisplayedGroups = groups;

  let html = renderHeader();
  html += '<main class="app-main flex-1 min-h-0 flex flex-col gap-[10px] px-4 pt-3 pb-3">';
  html += renderSectionTitle('VALIDASI', allGroups.length + ' titik TP');
  html += '<div class="flex flex-row items-center gap-[8px] shrink-0">' +
    '<div class="flex-1 flex items-center gap-[8px] bg-[#0b1329] border border-white/10 rounded-full px-[12px] py-[8px] min-w-0">' +
      icon('search','w-[16px] h-[16px] text-white/40 shrink-0') +
      '<input value="' + validasiSearchQuery.replace(/"/g,'&quot;') + '" oninput="updateValidasiSearch(this.value)" placeholder="Cari ID TP / Area..." class="flex-1 bg-transparent outline-none text-[12px] font-medium text-white placeholder:text-white/35 min-w-0">' +
    '</div>' +
    '<button aria-label="Input Validasi" onclick="openValidasiForm()" class="shrink-0 w-9 h-9 rounded-full bg-[#2563eb] border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' +
      icon('plus','w-[20px] h-[20px] text-white') +
    '</button>' +
  '</div>';
  if (!groups.length) {
    html += '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-6 text-center text-white/40 text-xs">' + (q ? 'Tidak ada TP yang cocok dgn pencarian.' : 'Belum ada data Validasi.') + '</div>';
  } else {
    html += '<div class="flex-1 min-h-0 flex flex-col gap-[10px] overflow-y-auto overflow-x-hidden">';
    groups.forEach((g, i) => {
      const headerLine = g.idTp + ' &bull; ' + g.depthCount + '/' + g.maxDepth + ' m &bull; ' + (g.area||'-') + ' &bull; Bench ' + (g.bench||'-');
      function assayStat(label, val, accent) {
        return '<div class="flex-1 min-w-0"><div class="text-[9px] font-bold text-white/35 tracking-wide">' + label + '</div><div class="text-[13px] font-bold ' + (accent ? 'text-[#2563eb]' : 'text-white') + ' mt-0.5">' + val + '</div></div>';
      }
      html += '<div onclick="openValidasiDetail(' + i + ')" class="text-left rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4 shrink-0 active:scale-[0.99] transition-transform cursor-pointer">' +
        '<div class="flex items-start justify-between gap-2 mb-3">' +
          '<div class="text-sm font-bold text-white leading-tight">' + headerLine + '</div>' +
          '<div class="shrink-0 flex items-center gap-1.5">' +
            (g.timur && g.utara ? '<button onclick="event.stopPropagation(); focusMapFromValidasi(\'' + g.idTp.replace(/'/g,"\\'") + '\')" aria-label="Lihat di Peta" title="Lihat di Peta" class="w-6 h-6 rounded-full bg-[#2563eb]/15 border border-[#2563eb]/40 flex items-center justify-center active:scale-90 transition-transform">' + icon('map-pin','w-3.5 h-3.5 text-[#2563eb]') + '</button>' : '') +
            '<span class="text-[9px] font-bold px-2 py-1 rounded-full bg-[#22c55e] text-white">VALID</span>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-start gap-2 pt-3 border-t border-white/[0.06]">' +
          assayStat('NI %', fmt2(g.avgNi), true) +
          assayStat('FE %', fmt2(g.avgFe)) +
          assayStat('CO %', fmt2(g.avgCo)) +
          assayStat('MGO %', fmt2(g.avgMgo)) +
          assayStat('SIO2 %', fmt2(g.avgSio2)) +
          assayStat('SM %', fmt2(g.avgSm)) +
          '<div class="shrink-0"><div class="text-[9px] font-bold text-white/35 tracking-wide mb-0.5">GRADE</div>' + renderClassGradeBadge(g.classGrade) + '</div>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
  }
  html += '</main>';
  html += renderBottomNav();
  return html;
}

// ==== MODAL: DETAIL VALIDASI (klik item di daftar Validasi -- rincian per kedalaman) ====
let validasiDetailOpen = false;
let validasiDetailIndex = -1;
function openValidasiDetail(idx) { validasiDetailIndex = idx; validasiDetailOpen = true; render(); }
function closeValidasiDetail() { validasiDetailOpen = false; render(); }
function renderValidasiDetailModal(justOpened) {
  if (!validasiDetailOpen) return '';
  const g = validasiDisplayedGroups[validasiDetailIndex];
  if (!g) return '';
  function infoCard(label, val) {
    return '<div class="rounded-[10px] bg-[#0b1329] border border-white/[0.08] px-3 py-2.5"><div class="text-[13px] font-bold text-white">' + (val || '-') + '</div><div class="text-[10px] text-white/40">' + label + '</div></div>';
  }
  let body = '<div class="grid grid-cols-2 gap-2 mb-3">' +
    infoCard('Tanggal', g.tanggal) +
    infoCard('Bench', g.bench) +
    infoCard('Area', g.area) +
    infoCard('Timur / Utara', (g.timur||'-') + ' / ' + (g.utara||'-')) +
    infoCard('Warna', g.warna) +
    infoCard('Struktur', g.struktur) +
  '</div>';
  body += '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] overflow-hidden">';
  g.depths.forEach((d, idx) => {
    const meterVal = getField(d,'Meter') || '-';
    const catatan = getField(d,'Catatan');
    body += '<div class="px-3.5 py-3 ' + (idx > 0 ? 'border-t border-white/[0.06]' : '') + '">' +
      '<div class="flex items-center justify-between mb-1.5">' +
        '<span class="text-[12px] font-black text-white">' + meterVal + ' m</span>' +
        '<span class="text-[11px] font-bold text-[#2563eb]">Ni ' + fmt2(numFieldGet(d,'Ni %','Ni')) + '%</span>' +
      '</div>' +
      '<div class="text-[10px] text-white/45 leading-relaxed">Fe ' + fmt2(numFieldGet(d,'Fe %','Fe')) + '% &bull; Co ' + fmt2(numFieldGet(d,'Co %','Co')) + '% &bull; MgO ' + fmt2(numFieldGet(d,'MgO %','MgO')) + '% &bull; SiO2 ' + fmt2(numFieldGet(d,'SiO2 %','SiO2')) + '% &bull; SM ' + fmt2(numFieldGet(d,'SM %','SM')) + '</div>' +
      (catatan ? '<div class="text-[10px] text-white/35 mt-1 italic">' + catatan + '</div>' : '') +
    '</div>';
  });
  body += '</div>';
  body += '<div class="rounded-[10px] bg-[#2563eb]/10 border border-[#2563eb]/25 px-3.5 py-3 mt-3">' +
    '<div class="text-[10px] font-bold text-blue-300 mb-1 flex items-center gap-1.5">Rata-rata (1-' + g.maxDepth + 'm) &bull; Grade ' + renderClassGradeBadge(g.classGrade) + '</div>' +
    '<div class="text-[11px] text-white font-medium">Ni ' + fmt2(g.avgNi) + '% | Fe ' + fmt2(g.avgFe) + '% | Co ' + fmt2(g.avgCo) + '% | MgO ' + fmt2(g.avgMgo) + '% | SiO2 ' + fmt2(g.avgSio2) + '% | SM ' + fmt2(g.avgSm) + '</div>' +
  '</div>';
  return renderSimpleModal('Detail Test Pit', g.idTp, body, 'closeValidasiDetail()', undefined, justOpened);
}

// ==== MODAL: TAMBAH VALIDASI (input assay utk TP yang SUDAH ADA -- Member tidak
// boleh set koordinat Timur/Utara, itu wewenang Head/Developer lewat Plan. Server
// menolak otomatis kalau ID TP belum punya koordinat Plan -- pesan errornya
// ditampilkan apa adanya ke user, bukan ditutup-tutupi.) ====
let validasiFormOpen = false;
let validasiFormState = { id_tp:'', area:'', bench:'', tipe_laterit:'', warna:'', struktur:'', meter:'', catatan:'', ni:'', fe:'', co:'', mgo:'', sio2:'', sm:'' };
let validasiSubmitStatusMsg = '', validasiSubmitOk = true, validasiSubmitBusy = false;

function openValidasiForm() {
  validasiFormOpen = true;
  validasiFormState = { id_tp:'', area:'', bench:'', tipe_laterit:'', warna:'', struktur:'', meter:'', catatan:'', ni:'', fe:'', co:'', mgo:'', sio2:'', sm:'' };
  validasiSubmitStatusMsg = '';
  render();
}
function closeValidasiForm() { validasiFormOpen = false; render(); }
function updateValidasiField(name, val) { validasiFormState[name] = val; render(); }

async function submitValidasiEntry() {
  const f = validasiFormState;
  if (!f.id_tp || !f.area) {
    validasiSubmitStatusMsg = 'ID TP dan Area wajib diisi.'; validasiSubmitOk = false; render(); return;
  }
  if (!f.meter) {
    validasiSubmitStatusMsg = 'Kedalaman (m) wajib dipilih -- 1 s/d 5 meter sesuai prosedur.'; validasiSubmitOk = false; render(); return;
  }
  validasiSubmitBusy = true; validasiSubmitStatusMsg = ''; render();
  try {
    const payload = buildAuthenticatedPayload({
      sheet_name: 'Validasi',
      tanggal: todayDateStr(),
      id_tp: f.id_tp, area: f.area, bench: f.bench,
      tipe_laterit: f.tipe_laterit, warna: f.warna, struktur: f.struktur,
      meter: f.meter, catatan: f.catatan,
      ni: f.ni, fe: f.fe, co: f.co, mgo: f.mgo, sio2: f.sio2, sm: f.sm
      // Timur/Utara SENGAJA tidak dikirim -- server otomatis pakai koordinat Plan
      // yang sudah ditetapkan Head/Developer utk ID TP ini.
    });
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
    const result = await response.json();
    if (result.status === 'success') {
      validasiSubmitStatusMsg = 'Data Validasi berhasil disimpan!'; validasiSubmitOk = true; render();
      setTimeout(async () => { validasiFormOpen = false; await loadRingkasanData(); }, 800);
    } else {
      throw new Error(result.message || 'Gagal menyimpan data Validasi.');
    }
  } catch (err) {
    // Pesan error server (mis. "TP belum memiliki koordinat Plan...") ditampilkan
    // APA ADANYA -- ini bukan bug, itu memang aturan backend yg wajib dipatuhi.
    validasiSubmitStatusMsg = err.message || 'Terjadi kesalahan saat menyimpan.'; validasiSubmitOk = false;
  }
  validasiSubmitBusy = false;
  render();
}

function renderValidasiFormModal(justOpened) {
  if (!validasiFormOpen) return '';
  const f = validasiFormState;
  const body = '<div class="space-y-3">' +
    '<div class="rounded-[10px] bg-amber-500/10 border border-amber-500/25 px-3 py-2.5 text-[10px] text-amber-300 leading-relaxed">Hanya utk ID TP yang koordinatnya sudah ditetapkan Head/Developer lewat Plan. TP baru tanpa Plan akan ditolak server. Kedalaman maksimal 5m (batas jangkauan excavator PC200) -- WAJIB dipilih per meter, satu entri per kedalaman.</div>' +
    fieldRow('ID TP *', textField('id_tp', f.id_tp, 'cth. TP-L1Y-01')) +
    '<div class="grid grid-cols-2 gap-2.5">' +
      fieldRow('Area *', textField('area', f.area, 'cth. Avanza')) +
      fieldRow('Bench', textField('bench', f.bench, 'cth. 85')) +
    '</div>' +
    fieldRow('Tipe Laterit', textField('tipe_laterit', f.tipe_laterit, 'cth. Limonit')) +
    '<div class="grid grid-cols-2 gap-2.5">' +
      fieldRow('Warna', textField('warna', f.warna, 'cth. Coklat Kemerahan')) +
      fieldRow('Struktur', textField('struktur', f.struktur, 'cth. Massive')) +
    '</div>' +
    fieldRow('Kedalaman (m) *', selectField('meter', ['','1','2','3','4','5'], f.meter)) +
    fieldRow('Catatan', textField('catatan', f.catatan, 'Catatan lapangan')) +
    '<div class="grid grid-cols-3 gap-2.5">' +
      fieldRow('Ni %', numField('ni', f.ni, '1.85')) +
      fieldRow('Fe %', numField('fe', f.fe, '12.40')) +
      fieldRow('Co %', numField('co', f.co, '0.08')) +
    '</div>' +
    '<div class="grid grid-cols-2 gap-2.5">' +
      fieldRow('MgO %', numField('mgo', f.mgo, '28.50')) +
      fieldRow('SiO2 %', numField('sio2', f.sio2, '38.20')) +
    '</div>' +
    fieldRow('SM %', numField('sm', f.sm, '1.34')) +
    (validasiSubmitStatusMsg ? '<p class="text-xs font-medium ' + (validasiSubmitOk?'text-emerald-400':'text-rose-400') + '">' + validasiSubmitStatusMsg + '</p>' : '') +
    '<button onclick="submitValidasiEntry()" ' + (validasiSubmitBusy?'disabled':'') + ' class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm py-3 rounded-xl disabled:opacity-60">' +
      (validasiSubmitBusy ? '<span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full spin"></span>' : icon('save','w-4 h-4')) +
      '<span>' + (validasiSubmitBusy?'Menyimpan...':'Simpan Validasi') + '</span>' +
    '</button>' +
  '</div>';
  return renderSimpleModal('Input Validasi', 'Data assay Test Pit', body, 'closeValidasiForm()', undefined, justOpened);
}
