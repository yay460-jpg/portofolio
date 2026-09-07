/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- member-app/scripts/kpi.js
 * [PARTISI -- 4 Sep, Tahap 4] Modal KPI & Absensi (5 Pilar + Skor Gabungan, align
 * dgn kartu Member Master) + Modal JSA (Job Safety Analysis, dipicu dari dalam
 * Modal KPI). Diekstrak dari index.html tunggal -- 0 restrukturisasi logika.
 * Dependency: GOOGLE_SCRIPT_READ_URL/fetchWithTimeout/icon (config.js), sessionInfo
 * (auth.js), renderSimpleModal (masih di index.html, Tahap 5), render() (index.html).
 * ============================================================ */

// ==== MODAL: KPI 5 PILAR (ROMBAK TOTAL -- 4 Sep, align dgn Engine KPI 5 Pilar Master) ====
// Sebelumnya modal ini pakai skema field LAMA (target/inspeksi/accuracy) yg SUDAH
// DIHAPUS dari backend sejak v90.2.150 (30 Agu) -- 3 baris itu selalu tampil "-" tanpa
// disadari, dan modal ini SAMA SEKALI TIDAK PUNYA Tonase/Ni/Waste ataupun Engine KPI 5
// Pilar yg sekarang jadi fitur inti dashboard Master. Dirombak total supaya SAMA PERSIS
// dgn kartu Member di Master (modules/member.js: fetchKpiBadgesForMember_) -- 2 fetch
// paralel (sheet=member utk Tonase/Ni/Waste/Grade/Absensi, sheet=kpiscore utk 5 Pilar +
// Skor Gabungan), threshold warna SAMA (>=90 emerald, >=70 amber, else rose).
let kpiModalOpen = false;
let kpiData = null; // dari sheet=member: {nama, jabatan, status, total_tonase, avg_ni_total, waste_tonase, grade, absensi_hadir, absensi_izin, absensi_cuti, catatan_kinerja}
let kpiScoreData = null; // dari sheet=kpiscore: {final_score, weight_mode, safety_gate, pilar_laporan_tepat_waktu, pilar_kehadiran, pilar_safety, pilar_kelengkapan_sampling, pilar_attitude}
let kpiScoreErrorMsg = ''; // gagal fetch kpiscore TIDAK menggagalkan seluruh modal -- kpiData (Tonase dkk) tetap tampil, cuma bagian 5 Pilar yg fallback '-'
let kpiLoading = false;
let kpiErrorMsg = '';

// Sama persis logika getLocalPeriodeYyyyMm() di scripts/helpers.js Master (disederhanakan
// -- Android app tidak punya state regionalTimeSettings, default Asia/Jakarta langsung).
function getLocalPeriodeYyyyMm_() {
  const d = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).formatToParts(d);
    const map = {}; parts.forEach(p => { map[p.type] = p.value; });
    if (map.year && map.month) return map.year + '-' + map.month;
  } catch (e) { /* fallback */ }
  return String(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
// Sama persis threshold warna di modules/member.js Master.
function kpiScoreColorClass_(score) {
  if (score === null || score === undefined) return 'text-white/40';
  return score >= 90 ? 'text-[#22c55e]' : (score >= 70 ? 'text-amber-400' : 'text-rose-400');
}

async function fetchKpiScoreOnly_() {
  if (!sessionInfo) return;
  try {
    const periode = getLocalPeriodeYyyyMm_();
    const url = GOOGLE_SCRIPT_READ_URL + '?sheet=kpiscore&member_id=' + encodeURIComponent(sessionInfo.userName) + '&periode=' + periode + '&t=' + Date.now();
    const response = await fetchWithTimeout(url, {}, 20000);
    const result = await response.json();
    if (result.status === 'success' && result.data) { kpiScoreData = result.data; kpiScoreErrorMsg = ''; }
    else { kpiScoreData = null; kpiScoreErrorMsg = result.message || 'Skor KPI 5 Pilar belum tersedia.'; }
  } catch (err) {
    kpiScoreData = null;
    kpiScoreErrorMsg = 'Gagal memuat skor KPI 5 Pilar.';
  }
}

async function openKpiModal() {
  accountMenuOpen = false;
  if (!sessionInfo) { openLoginModal(); return; }
  kpiModalOpen = true; kpiLoading = true; kpiErrorMsg = ''; kpiData = null; kpiScoreData = null; kpiScoreErrorMsg = '';
  render();
  try {
    const [memberResp] = await Promise.all([
      fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=member&t=' + Date.now()),
      fetchKpiScoreOnly_() // paralel -- kegagalan endpoint ini TIDAK menggagalkan modal (lihat kpiScoreErrorMsg)
    ]);
    const result = await memberResp.json();
    if (result.status === 'error') {
      kpiErrorMsg = result.message || 'Server menolak permintaan data KPI.';
    } else {
      const rows = result.data || [];
      const mine = rows.find(r => String(r.nama||'').trim().toLowerCase() === String(sessionInfo.userName||'').trim().toLowerCase());
      if (mine) kpiData = mine;
      else kpiErrorMsg = 'Data KPI utk nama akun ini belum ditemukan di sheet Member.';
    }
  } catch (err) {
    kpiErrorMsg = 'Tidak bisa menghubungi server: ' + (err && err.message ? err.message : String(err));
  }
  kpiLoading = false;
  render();
}
function closeKpiModal() { kpiModalOpen = false; render(); }
async function refreshKpiOnly() {
  if (!sessionInfo) return;
  try {
    const [memberResp] = await Promise.all([
      fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=member&t=' + Date.now()),
      fetchKpiScoreOnly_()
    ]);
    const result = await memberResp.json();
    if (result.status !== 'error') {
      const rows = result.data || [];
      const mine = rows.find(r => String(r.nama||'').trim().toLowerCase() === String(sessionInfo.userName||'').trim().toLowerCase());
      if (mine) kpiData = mine;
    }
  } catch (err) { console.error('Gagal refresh KPI:', err); }
  render();
}
function renderKpiModal(justOpened) {
  if (!kpiModalOpen) return '';
  let body;
  const jsaTriggerBtn = '<button onclick="openJsaModal()" title="Job Safety Analysis" class="w-8 h-8 rounded-full bg-[#2563eb]/15 border border-[#2563eb]/30 flex items-center justify-center">' + icon('shield-alert','w-4 h-4 text-[#2563eb]') + '</button>';
  if (kpiLoading) {
    body = '<div class="flex items-center justify-center py-10"><span class="w-6 h-6 border-2 border-white/20 border-t-[#2563eb] rounded-full spin"></span></div>';
  } else if (kpiErrorMsg) {
    body = '<div class="rounded-[12px] bg-rose-500/10 border border-rose-500/25 p-4"><div class="text-xs font-bold text-rose-300">Gagal memuat KPI</div><div class="text-[11px] text-rose-300/70 mt-1">' + kpiErrorMsg + '</div></div>';
  } else if (kpiData) {
    function row(label, val, color, sub) {
      return '<div class="flex items-center justify-between py-2 border-b border-white/[0.06]"><span class="text-[11px] text-white/50 font-medium">' + label + '</span><span class="text-right"><span class="text-[13px] font-bold ' + (color||'text-white') + '">' + (val === null || val === undefined || val === '' ? '-' : val) + '</span>' + (sub ? '<div class="text-[9px] text-white/30 mt-0.5">' + sub + '</div>' : '') + '</span></div>';
    }
    function pilarRow(label, pilar, sub) {
      if (!pilar || pilar.score === null || pilar.score === undefined) return row(label, null);
      return row(label, pilar.score, kpiScoreColorClass_(pilar.score), sub);
    }

    let pilarSection;
    if (kpiScoreErrorMsg) {
      pilarSection = '<div class="rounded-[10px] bg-white/[0.03] border border-white/[0.06] p-3 text-[10px] text-white/40 text-center">' + kpiScoreErrorMsg + '</div>';
    } else if (kpiScoreData) {
      const p = kpiScoreData;
      const laporanSub = p.pilar_laporan_tepat_waktu && p.pilar_laporan_tepat_waktu.mode === 'proksi_assay' ? '(proksi ketepatan assay)' : '';
      const kehadiranSub = p.pilar_kehadiran ? ('Hadir ' + p.pilar_kehadiran.hadir + ' / ' + p.pilar_kehadiran.denominator + ' hari wajib') : '';
      const safetySub = p.pilar_safety ? ('Rata-rata APD dari ' + p.pilar_safety.total_hari_hadir + ' hari Hadir') : '';
      const samplingSub = p.pilar_kelengkapan_sampling ? (p.pilar_kelengkapan_sampling.lengkap + ' / ' + p.pilar_kelengkapan_sampling.total_baris + ' baris lengkap Ni%') : '';
      const attitudeSub = p.pilar_attitude && p.pilar_attitude.mode === 'belum_dinilai' ? '(belum dinilai periode ini)' : '';
      const gateWarning = (p.safety_gate && p.safety_gate.triggered) ?
        '<div class="mt-2 rounded-[8px] bg-rose-500/10 border border-rose-500/25 px-2.5 py-1.5 text-[9px] text-rose-300 font-semibold">Skor dipotong Safety Gate (APD di bawah ambang)</div>' : '';
      pilarSection =
        '<div class="text-[9px] font-bold text-violet-400 tracking-wide uppercase mb-1 mt-1">Engine KPI 5 Pilar</div>' +
        pilarRow('Laporan Tepat Waktu', p.pilar_laporan_tepat_waktu, laporanSub) +
        pilarRow('Kehadiran', p.pilar_kehadiran, kehadiranSub) +
        pilarRow('Safety (APD)', p.pilar_safety, safetySub) +
        pilarRow('Kelengkapan Sampling', p.pilar_kelengkapan_sampling, samplingSub) +
        pilarRow('Attitude', p.pilar_attitude, attitudeSub) +
        '<div class="flex items-center justify-between py-2.5 mt-1 border-t border-white/10">' +
          '<span class="text-[12px] text-white/70 font-bold">Skor Gabungan</span>' +
          '<span class="text-[16px] font-bold ' + kpiScoreColorClass_(p.final_score) + '">' + (p.final_score === null || p.final_score === undefined ? '-' : p.final_score) + '</span>' +
        '</div>' + gateWarning;
    } else {
      pilarSection = '<div class="rounded-[10px] bg-white/[0.03] border border-white/[0.06] p-3 text-[10px] text-white/40 text-center">Skor KPI 5 Pilar belum tersedia.</div>';
    }

    body = '<button onclick="openJsaModal()" class="w-full mb-3 flex items-center justify-center gap-2 bg-[#2563eb]/15 border border-[#2563eb]/30 text-blue-300 font-bold text-xs py-2.5 rounded-xl">' + icon('shield-alert','w-4 h-4') + '<span>Job Safety Analysis &amp; Konfirmasi Kehadiran</span></button>' +
    '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4">' +
      '<div class="text-white font-bold text-sm mb-1">' + (kpiData.nama||'-') + '</div>' +
      '<div class="text-[11px] text-white/40 mb-3">' + (kpiData.jabatan||'-') + ' &bull; ' + (kpiData.status||'-') + '</div>' +
      '<div class="text-[9px] font-bold text-[#22c55e] tracking-wide uppercase mb-1">Hasil Bersih</div>' +
      row('Tonase', kpiData.total_tonase !== undefined ? Number(kpiData.total_tonase).toLocaleString('id-ID') + ' Ton' : null, 'text-[#22c55e]') +
      row('Average Ni', kpiData.avg_ni_total !== undefined ? Number(kpiData.avg_ni_total).toFixed(2) + '%' : null, 'text-[#22c55e]') +
      row('Waste', kpiData.waste_tonase !== undefined ? Number(kpiData.waste_tonase).toLocaleString('id-ID') + ' Ton' : null) +
      pilarSection +
      row('Grade', kpiData.grade, 'text-[#22c55e]') +
      row('Absensi Hadir', kpiData.absensi_hadir, 'text-[#22c55e]') +
      row('Absensi Izin', kpiData.absensi_izin, 'text-amber-400') +
      row('Absensi Cuti', kpiData.absensi_cuti, 'text-amber-400') +
      row('Catatan Kinerja', kpiData.catatan_kinerja) +
    '</div>';
  } else {
    body = '<div class="text-center text-white/40 text-xs py-6">Tidak ada data.</div>';
  }
  return renderSimpleModal('KPI &amp; Absensi', 'Data kehadiran &amp; performa Anda', body, 'closeKpiModal()', jsaTriggerBtn, justOpened);
}

// ==== MODAL: JOB SAFETY ANALYSIS & KONFIRMASI KEHADIRAN ====
// Endpoint asli: action=addJsaLog (sheet JSA_Log). Server idempotent per hari (1 member
// cuma bisa konfirmasi 1x/hari, percobaan kedua dibalas denied:true dgn pesan ramah,
// BUKAN error) dan OTOMATIS menambah counter Absensi_Hadir/Izin/Cuti di sheet Member --
// makanya setelah sukses kita panggil refreshKpiOnly() supaya KPI modal ikut ter-update.
const JSA_DOC_NO = 'JSA-MINEGEO-2026-REV02'; // No dokumen JSA aktif -- update manual kalau revisi berganti.
let jsaModalOpen = false;
let jsaSubmitBusy = false;
let jsaSubmitStatusMsg = '';
let jsaSubmitOk = true;
let jsaConfirmedToday = false;
// BARU (v90.2.112): state checklist APD -- 4 item INDEPENDEN dari Status_Kehadiran, dicentang
// manual per-item oleh member sendiri. HANYA 4 item ini yg dikirim ke backend (kolom
// APD_Helm/APD_Masker/APD_Sarung_Tangan/APD_Rompi di JSA_Log) -- 4 item lain (Kacamata/Safety
// Boots/Life Jacket/Earplug) tetap tampil sbg referensi teks saja, backend belum punya kolomnya.
let jsaApdChecked = { helm: false, masker: false, sarung_tangan: false, rompi: false };

function toggleJsaApd(key) {
  jsaApdChecked[key] = !jsaApdChecked[key];
  render();
}

function openJsaModal() {
  jsaModalOpen = true;
  jsaSubmitStatusMsg = ''; jsaConfirmedToday = false;
  jsaApdChecked = { helm: false, masker: false, sarung_tangan: false, rompi: false };
  render();
}
function closeJsaModal() { jsaModalOpen = false; render(); }

async function submitJsaConfirm(status) {
  if (!sessionInfo) { openLoginModal(); return; }
  jsaSubmitBusy = true; jsaSubmitStatusMsg = ''; render();
  try {
    const payload = buildAuthenticatedPayload({
      action: 'addJsaLog', jsa_no: JSA_DOC_NO, attendance_status: status,
      apd_helm: jsaApdChecked.helm ? 'Y' : 'N',
      apd_masker: jsaApdChecked.masker ? 'Y' : 'N',
      apd_sarung_tangan: jsaApdChecked.sarung_tangan ? 'Y' : 'N',
      apd_rompi: jsaApdChecked.rompi ? 'Y' : 'N'
    });
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
    const result = await response.json();
    if (result.status === 'success') {
      if (result.denied) {
        jsaSubmitStatusMsg = result.message || 'Kehadiran Anda sudah tercatat hari ini.';
        jsaSubmitOk = true;
        jsaConfirmedToday = true;
      } else {
        jsaSubmitStatusMsg = 'Kehadiran (' + status + ') berhasil dikonfirmasi!';
        jsaSubmitOk = true;
        jsaConfirmedToday = true;
        await refreshKpiOnly(); // sinkron langsung -- Absensi Hadir/Izin/Cuti di KPI ikut update
      }
    } else {
      jsaSubmitStatusMsg = result.message || 'Gagal mengonfirmasi kehadiran.';
      jsaSubmitOk = false;
    }
  } catch (err) {
    jsaSubmitStatusMsg = 'Tidak bisa menghubungi server: ' + (err && err.message ? err.message : String(err));
    jsaSubmitOk = false;
  }
  jsaSubmitBusy = false;
  render();
}

function renderJsaModal(justOpened) {
  if (!jsaModalOpen) return '';
  function apdItem(label) {
    return '<div class="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-white/[0.03] border border-white/[0.06]"><span class="w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0"></span><span class="text-[11px] text-white/70">' + label + '</span></div>';
  }
  // BARU (v90.2.112): checkbox APD interaktif (4 item yg dilacak backend). Dibungkus DIV
  // onclick (bukan input checkbox asli) supaya konsisten dgn pola re-render penuh app ini
  // -- input checkbox asli akan reset fokus/state visual tiap render() dipanggil ulang.
  function apdCheckbox(key, label) {
    const checked = !!jsaApdChecked[key];
    return '<div onclick="toggleJsaApd(\'' + key + '\')" class="flex items-center gap-2 px-3 py-2.5 rounded-[8px] cursor-pointer border transition-all ' +
      (checked ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-white/[0.03] border-white/[0.06]') + '">' +
      '<span class="w-4 h-4 rounded shrink-0 flex items-center justify-center border-2 ' +
      (checked ? 'bg-emerald-500 border-emerald-500' : 'border-white/25') + '">' +
      (checked ? icon('check','w-3 h-3 text-white') : '') +
      '</span><span class="text-[11px] font-medium ' + (checked ? 'text-emerald-300' : 'text-white/70') + '">' + label + '</span></div>';
  }
  let body = '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4 mb-3">' +
    '<div class="flex items-center gap-2 mb-2">' +
      '<span class="text-[9px] font-bold px-2 py-1 rounded-full bg-[#2563eb]/15 text-blue-300 border border-[#2563eb]/25">' + JSA_DOC_NO + '</span>' +
    '</div>' +
    '<div class="text-white font-black text-base leading-tight mb-1">JOB SAFETY ANALYSIS</div>' +
    '<div class="text-[11px] text-white/40 mb-3">Division Mine Geologist &bull; Pit, Stockpile &amp; Jetty</div>' +
    '<div class="text-[11px] text-white/60 leading-relaxed">Pekerjaan Mine Geologist mencakup validasi block model, pengambilan sampel grade control, supervisi penggalian, pengawasan barging shipment, hingga entry data dashboard -- di area pit aktif &amp; jetty dengan risiko heavy equipment dan geoteknis.</div>' +
  '</div>';
  body += '<div class="mb-3"><div class="text-[10px] font-bold text-white/40 tracking-wide mb-2">APD WAJIB (MINIMUM) -- centang sebelum konfirmasi Hadir</div><div class="grid grid-cols-2 gap-1.5">' +
    apdCheckbox('helm', 'Helm Safety (SNI)') + apdItem('Kacamata Safety') +
    apdCheckbox('masker', 'Masker P2 / N95') + apdCheckbox('sarung_tangan', 'Sarung Tangan') +
    apdItem('Safety Boots Steel') + apdCheckbox('rompi', 'Rompi Reflektif') +
    apdItem('Life Jacket (Jetty)') + apdItem('Earplug (Area Bising)') +
  '</div></div>';
  body += '<div class="rounded-[10px] bg-amber-500/10 border border-amber-500/25 px-3 py-2.5 text-[10px] text-amber-300 mb-4">Dokumen ini WAJIB dibaca sebelum mulai bekerja (toolbox meeting). Konfirmasi kehadiran di bawah ini akan tercatat dgn nama &amp; waktu dari sesi login Anda -- tidak bisa diwakilkan.</div>';
  body += '<div class="text-[10px] font-bold text-white/40 tracking-wide mb-2">TTD &amp; KONFIRMASI KEHADIRAN</div>';
  if (jsaSubmitStatusMsg) {
    body += '<p class="text-xs font-medium mb-2 ' + (jsaSubmitOk?'text-emerald-400':'text-rose-400') + '">' + jsaSubmitStatusMsg + '</p>';
  }
  if (!jsaConfirmedToday) {
    body += '<div class="grid grid-cols-3 gap-2">' +
      '<button onclick="submitJsaConfirm(\'Hadir\')" ' + (jsaSubmitBusy?'disabled':'') + ' class="flex flex-col items-center gap-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs disabled:opacity-60">' + icon('check-circle-2','w-4 h-4') + '<span>Hadir</span></button>' +
      '<button onclick="submitJsaConfirm(\'Izin\')" ' + (jsaSubmitBusy?'disabled':'') + ' class="flex flex-col items-center gap-1 py-3 rounded-xl bg-amber-600 text-white font-bold text-xs disabled:opacity-60">' + icon('clock','w-4 h-4') + '<span>Izin</span></button>' +
      '<button onclick="submitJsaConfirm(\'Cuti\')" ' + (jsaSubmitBusy?'disabled':'') + ' class="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/10 text-white font-bold text-xs disabled:opacity-60">' + icon('calendar-x','w-4 h-4') + '<span>Cuti</span></button>' +
    '</div>';
    if (jsaSubmitBusy) body += '<div class="flex items-center justify-center mt-3"><span class="w-5 h-5 border-2 border-white/20 border-t-[#2563eb] rounded-full spin"></span></div>';
  }
  return renderSimpleModal('Job Safety Analysis', 'Mine Geologist', body, 'closeJsaModal()', undefined, justOpened);
}
