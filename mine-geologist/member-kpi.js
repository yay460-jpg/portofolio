// ==== MEMBER-KPI.js -- v90.2.120 ====

 function canProposeKpiEvent() {
 const role = String(getCurrentExportRole() || '').trim().toUpperCase();
 return role === 'MEMBER' || role === 'SUPERVISOR' || role === 'DEVELOPER';
 }
 function canApproveKpiEvent() {
 return isDeveloperUnlocked();
 }
 function canAssessAttitude() {
 const role = String(getCurrentExportRole() || '').trim().toUpperCase();
 return role === 'SUPERVISOR' || role === 'DEVELOPER';
 }
 function updateKpiButtonsVisibility() {
 const btnEvent = document.getElementById('btn-open-kpi-event');
 const btnAttitude = document.getElementById('btn-open-attitude');
 if (btnEvent) { btnEvent.classList.toggle('hidden', !canProposeKpiEvent()); btnEvent.classList.toggle('flex', canProposeKpiEvent()); }
 if (btnAttitude) { btnAttitude.classList.toggle('hidden', !canAssessAttitude()); btnAttitude.classList.toggle('flex', canAssessAttitude()); }
 }

 // Fitur Barging: LIHAT progress terbuka untuk semua (tidak butuh fungsi akses -- semua
 // fetch/render publik). INPUT/kelola data (bikin shipment, catat loading log, dst) tetap
 // developer-only, sesuai kesepakatan yang sama dengan pola Dome di atas.
 function getRcaUiRole() {
 const role = String(getCurrentExportRole() || '').trim().toUpperCase();
 return role || 'PUBLIC';
 }
 function canCreateRca() {
 const role = getRcaUiRole();
 return role === 'DEVELOPER' || role === 'SUPERVISOR';
 }
 function canCloseRca() {
 const role = getRcaUiRole();
 return role === 'DEVELOPER';
 }
 function canManageRca() {
 return canCreateRca();
 }

 // Pit Actual: sama pola dengan RCA/Barging/Dome -- developer-only untuk INPUT.
function memberInitials(name, loginId) {
 const sourceName = (name || loginId || 'Member').trim();
 const words = sourceName.replace(/[_-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
 if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
 return sourceName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'ME';
}

async function loadKpiEventApprovalList() {
 const listEl = document.getElementById('kpi-event-approval-list');
 if (!listEl) return;
 listEl.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Memuat...</div>';
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=kpievent&t=' + Date.now());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || 'Gagal memuat data KPIEvent.');
  const pending = (result.data || []).filter(function(ev) { return String(ev.status||'').toUpperCase() === 'PENDING'; });
  if (!pending.length) {
   listEl.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Tidak ada kejadian yang menunggu persetujuan.</div>';
   return;
  }
  listEl.innerHTML = pending.map(function(ev) {
   const jenisColor = ev.jenis === 'Full Exclusion' ? 'text-rose-400' : (ev.jenis === 'Member Exclusion' ? 'text-blue-400' : 'text-amber-400');
   const jamInfo = ev.jenis === 'Partial Adjustment' ? ('Jam Hilang: ' + (ev.jam_hilang||'-') + ' &bull; Jam Recovery: ' + (ev.jam_recovery||'-') + ' &bull; ') : '';
   return '<div class="rounded-xl bg-slate-900 border border-slate-700 p-3">' +
    '<div class="flex items-center justify-between mb-1.5">' +
     '<span class="text-xs font-bold ' + jenisColor + '">' + ev.jenis + '</span>' +
     '<span class="text-[10px] text-slate-500">' + ev.event_id + '</span>' +
    '</div>' +
    '<div class="text-[11px] text-slate-300 mb-1">' + ev.alasan + '</div>' +
    '<div class="text-[10px] text-slate-500 mb-2">Diajukan: ' + ev.diajukan_oleh + ' &bull; Tanggal Kejadian: ' + ev.tanggal_kejadian + (ev.pit_area ? (' &bull; ' + ev.pit_area) : '') + (ev.target_member ? (' &bull; Target: ' + ev.target_member) : '') + '</div>' +
    (jamInfo ? '<div class="text-[10px] text-slate-500 mb-2">' + jamInfo.replace(/&bull; $/, '') + '</div>' : '') +
    '<div class="flex gap-2">' +
     '<button onclick="decideKpiEvent(\'' + ev.event_id + '\',\'APPROVED\')" class="flex-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold">Approve</button>' +
     '<button onclick="decideKpiEvent(\'' + ev.event_id + '\',\'REJECTED\')" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 text-[11px] font-bold">Reject</button>' +
    '</div>' +
   '</div>';
  }).join('');
 } catch (err) {
  console.error('Gagal memuat KPIEvent:', err);
  listEl.innerHTML = '<div class="text-center text-rose-400 text-xs py-4">Gagal memuat data. <button onclick="loadKpiEventApprovalList()" class="underline">Coba lagi</button></div>';
 }
}
async function decideKpiEvent(eventId, decision) {
 try {
  const result = await postCentralAuthenticated({ action: 'approveKpiEvent', event_id: eventId, decision: decision }, { developerOnly: true });
  if (!result.success && !(result.status === 'success')) {
   alert(result.message || 'Gagal memproses keputusan.');
   return;
  }
  loadKpiEventApprovalList();
 } catch (err) {
  alert('Error server: ' + (err && err.message ? err.message : String(err)));
 }
}

 function applyJsaLanguage(lang) {
  const iframe = document.getElementById('jsa-iframe');
  if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body) return;
  const doc = iframe.contentDocument;
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const nodes=[]; let n; while(n=walker.nextNode()) nodes.push(n);
  // Text nodes do not support .dataset. Keep the original JSA text in a WeakMap.
  if (!iframe._jsaOriginalText) iframe._jsaOriginalText = new WeakMap();
  const originalMap = iframe._jsaOriginalText;
  const keys = Object.keys(JSA_I18N_EN).sort((a,b)=>b.length-a.length);
  nodes.forEach(node => {
   const parent = node.parentElement;
   if (!parent || ['SCRIPT','STYLE'].includes(parent.tagName)) return;
   if (!originalMap.has(node)) originalMap.set(node, node.nodeValue);
   const original = originalMap.get(node) || '';
   if (lang === 'id') { node.nodeValue = original; return; }
   let text = original;
   keys.forEach(k => { text = text.split(k).join(JSA_I18N_EN[k]); });
   node.nodeValue = text;
  });
  doc.documentElement.lang = lang === 'en' ? 'en' : 'id';
 }

 function openJsaModal() {
  const modal = document.getElementById('jsa-modal');
  const iframe = document.getElementById('jsa-iframe');
  if (iframe && !iframe.getAttribute('data-loaded')) {
   iframe.onload = () => applyJsaLanguage(currentLang);
   iframe.srcdoc = JSA_HTML_CONTENT;
   iframe.setAttribute('data-loaded', '1');
  }
  showModalAnimated(modal);
  setTimeout(() => applyJsaLanguage(currentLang), 50);
 }

 function closeJsaModal() {
  const modal = document.getElementById('jsa-modal');
  hideModalAnimated(modal);
 }

 // BARU: koneksi JSA <-> RCA (Opsi 2) -- dipanggil dari tombol "Catat RCA dari JSA" di
 // header modal JSA. Tutup modal JSA dulu (biar tidak menumpuk dua modal sekaligus di
 // atas satu sama lain), baru buka Form RCA dengan Deskripsi Isu ter-prefill penanda asal
 // (nomor dokumen JSA), supaya jejaknya jelas kalau nanti dibaca ulang di RCA Log. Blok/Pit
 // & Tahap Bermasalah SENGAJA dibiarkan kosong -- JSA sifatnya umum (bisa terkait banyak
 // Blok/Pit/tahap), user yang tahu persis konteks bahayanya isi sendiri.
 function openRcaFromJsa() {
  closeJsaModal();
  const deskripsiAwal = currentLang === 'en'
  ? 'Found while reviewing JSA-MINEGEO-2026-REV02: '
  : 'Ditemukan saat review JSA-MINEGEO-2026-REV02: ';
  openFormRcaPopup(null, null, null, deskripsiAwal);
 }

 // BARU: Modal konfirmasi TTD & kehadiran toolbox JSA -- self-service (setiap member isi
 // sendiri), TIDAK di-gate canManageRca()/devToken seperti RCA, karena sign-off keselamatan
 // memang harus bisa dilakukan semua orang, bukan cuma Developer. Versi awal cuma nama +
 // dropdown status Hadir/Izin/Cuti -- kuis/Competency ditahan dulu (belum diputuskan bentuknya).
 function openJsaConfirmModal() {
  const nameSelect = document.getElementById('jsa-confirm-nama');
  const identity = getLoggedInChatIdentity();
  nameSelect.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = identity.sender || '';
  opt.textContent = identity.sender || (currentLang === 'en' ? 'Login required' : 'Login diperlukan');
  nameSelect.appendChild(opt);
  nameSelect.value = identity.sender || '';
  nameSelect.disabled = true;
  nameSelect.classList.add('opacity-80','cursor-not-allowed');
  document.getElementById('jsa-confirm-status').value = 'Hadir';
  ['jsa-apd-helm','jsa-apd-masker','jsa-apd-sarung-tangan','jsa-apd-rompi'].forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });
  toggleJsaApdVisibility();
  document.getElementById('jsa-confirm-status-msg').classList.add('hidden');
  const modal = document.getElementById('jsa-confirm-modal');
  showModalAnimated(modal);
  lucide.createIcons();
 }

 // BARU (v90.2.112): checklist APD cuma relevan &amp; ditampilkan saat Status Kehadiran =
 // Hadir (Izin/Cuti tidak perlu APD di lapangan hari itu).
 function toggleJsaApdVisibility() {
  const status = document.getElementById('jsa-confirm-status').value;
  const wrap = document.getElementById('jsa-confirm-apd-wrap');
  if (wrap) wrap.classList.toggle('hidden', status !== 'Hadir');
 }

 function closeJsaConfirmModal() {
  const modal = document.getElementById('jsa-confirm-modal');
  hideModalAnimated(modal);
 }

 async function submitJsaLog() {
  const identity = getLoggedInChatIdentity();
  const nama = identity.sender || '';
  const attendanceStatus = document.getElementById('jsa-confirm-status').value || 'Hadir';
  const statusMsg = document.getElementById('jsa-confirm-status-msg');
  const submitBtn = document.getElementById('btn-submit-jsa-confirm');
  const originalHtml = submitBtn.innerHTML;

  if (!nama) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Please select a name.' : 'Pilih nama terlebih dahulu.';
  statusMsg.classList.remove('hidden');
  return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');

  try {
  const payload = buildAuthenticatedPayload({
   action: 'addJsaLog',
   jsa_no: 'JSA-MINEGEO-2026-REV02',
   attendance_status: attendanceStatus,
   apd_helm: document.getElementById('jsa-apd-helm')?.checked ? 'Y' : 'N',
   apd_masker: document.getElementById('jsa-apd-masker')?.checked ? 'Y' : 'N',
   apd_sarung_tangan: document.getElementById('jsa-apd-sarung-tangan')?.checked ? 'Y' : 'N',
   apd_rompi: document.getElementById('jsa-apd-rompi')?.checked ? 'Y' : 'N'
  });
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
  let result;
  try {
   result = await response.json();
  } catch (parseError) {
   throw new Error('Response server tidak valid (HTTP ' + response.status + '). Pastikan deployment Apps Script sudah diperbarui ke v90.2.43.');
  }
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save JSA confirmation.' : 'Gagal menyimpan konfirmasi JSA.'));

  if (result.denied) {
   statusMsg.className = 'text-xs text-amber-400';
   statusMsg.innerText = currentLang === 'en' ? 'Your attendance has already been recorded today.' : 'Kehadiran Anda sudah tercatat hari ini.';
  } else {
   statusMsg.className = 'text-xs text-emerald-400';
   statusMsg.innerText = currentLang === 'en' ? 'Attendance recorded successfully.' : 'Kehadiran berhasil dicatat.';
  }
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
   closeJsaConfirmModal();
   statusMsg.classList.add('hidden');
   fetchJsaLogData();
  }, 900);
  } catch (error) {
  console.error('Error saving JSA confirmation:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = (error && error.name === 'TypeError' && String(error.message || '').toLowerCase().includes('fetch'))
   ? (currentLang === 'en' ? 'Connection to server failed. Check the Apps Script deployment and try again.' : 'Koneksi ke server gagal. Periksa deployment Apps Script lalu coba lagi.')
   : (error.message || (currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.'));
  statusMsg.classList.remove('hidden');
  } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalHtml;
  lucide.createIcons();
  }
 }

 const CHANGELOG_DATA = [
 { version: `v90.2.95`, items: [
  {id:'Export Loading Integrity: RCA Log sekarang menampilkan state loading yang jelas dan tidak lagi menampilkan 0 Baris sebagai hasil sementara; tombol export tetap terkunci sampai fetch selesai. Fix activeTab juga dipertahankan di fetchJsaLogData().', en:'Export Loading Integrity: RCA Log now shows an explicit loading state instead of a misleading temporary 0 Rows; the export button remains locked until the fetch completes. The activeTab fix is also retained in fetchJsaLogData().' },
 ] },
 { version: `v90.2.86`, items: [
  {id:'AuditTrail export diagnostics: logExportActivity kini membaca response JSON server dan menampilkan alasan kegagalan ke DevTools Console tanpa mengganggu alur export.', en:'AuditTrail export diagnostics: logExportActivity now reads the server JSON response and reports failure reasons to the DevTools Console without interrupting the export flow.'},
 ] },
 { version: `v90.2.84`, items: [
  {id:'RCA Maker-Checker timestamp split: RCA_Log menggunakan Created_By/Created_Date/Created_Time dan Closed_By/Closed_Date/Closed_Time. Status pembuatan selalu Open; penutupan terpisah melalui rca.close dan Maker tidak dapat menutup RCA sendiri.', en:'RCA Maker-Checker timestamp split: RCA_Log now uses Created_By/Created_Date/Created_Time and Closed_By/Closed_Date/Closed_Time. Creation always starts Open; closing is a separate rca.close action and the Maker cannot close their own RCA.'},
 ] },
 { version: `v90.2.80`, items: [
  {id:'Unified Export Authorization Gate: PUBLIC tidak dapat export; MEMBER hanya PDF; SUPERVISOR PDF+Word; DEVELOPER CSV+PDF+Word. Authorization dilakukan server-side sebelum file dibuat dan penolakan terautit sebagai FAILED untuk role terautentikasi.', en:'Unified Export Authorization Gate: PUBLIC cannot export; MEMBER only PDF; SUPERVISOR PDF+Word; DEVELOPER CSV+PDF+Word. Authorization is server-side before file generation and authenticated-role denials are audited as FAILED.'},
 ] },
  { version: `v90.2.76`, items: [
  {id:'I18N hardcode audit: validasi Developer, login Member, Credential Manager, session warning, PIN toggle, JSA/chat fallback, dan beberapa output dinamis kini mengikuti bahasa aktif.', en:'I18N hardcode audit: Developer validation, Member login, Credential Manager, session warning, PIN toggle, JSA/chat fallbacks, and selected dynamic outputs now follow the active language.'},
 ] },  { version: `v90.2.74`, items: [
  {id:'Audit Trail aktivitas ekspor ditambahkan untuk CSV/PDF/Word; identitas user/session tetap diambil server-side dari session tervalidasi, tanpa mengubah alur export.', en:'Export activity Audit Trail added for CSV/PDF/Word; user/session identity remains resolved server-side from the validated session without changing the existing export flow.'},
 ] }, { version: `v90.2.72`, items: [
  {id:'Final I18N one-door refresh: language switch sekarang menyegarkan seluruh view dinamis, tooltip, filter title, Trend/Rekonsiliasi sub-view, laporan, chat, Pit Actual History, dan warning sesi tanpa mengubah data/backend.', en:'Final I18N one-door refresh: the language switch now refreshes all dynamic views, tooltips, filter titles, Trend/Reconciliation sub-views, reports, chat, Pit Actual History, and session warnings without changing data/backend.'},
  { id: `JSA I18N tetap dipertahankan: switch Indonesia/English menerjemahkan seluruh isi dokumen JSA di iframe.`, en: `JSA I18N remains intact: Indonesia/English switching translates the full JSA document inside the iframe.` },
 ] }, { version: `v89.16.29`, items: [
  { id: `Bug fix: guard tanggal di 10 field input (Catat Pit Actual, RCA Log, Barge, filter Rekonsiliasi, Laporan Berkala) -- ditambah batas tahun 2020-2035 dan diblokir ketik langsung (cuma bisa lewat kalender), mencegah tahun ngawur kepencet (kejadian nyata: jadi tahun "0002") gara-gara input tanggal bawaan browser bisa diketik bebas per-digit`, en: `Bug fix: date guards on 10 input fields (Record Pit Actual, RCA Log, Barge, Reconciliation filter, Periodic Report) -- year range 2020-2035 added and direct typing blocked (calendar only), preventing accidental garbage years (real occurrence: year became "0002") caused by the browser's native date input allowing free per-digit typing` },
  { id: `Bug fix penting: kolom "GC (TON)" & perhitungan F1 di tabel Matriks Rekonsiliasi (F1-F4) ternyata diam-diam ambil dari row Realisasi_Tonase (BlockModel), bukan dihitung dari Produksi_GC seperti chart "Block Model vs Actual" & Laporan Rekonsiliasi Profesional -- baru ketahuan setelah formula Realisasi_Tonase di sheet diubah supaya narik dari PitActual, kolom "GC" ikut nyamar jadi PitActual (cuma keisi di Blok yang sudah ada data PitActual). Sekarang ketiga tempat (chart, Laporan Profesional, Matriks F1-F4) pakai 1 fungsi sama (computeGcTonaseByBlok()) sebagai satu-satunya sumber kebenaran GC`, en: `Important bug fix: the "GC (TON)" column & F1 calculation in the Reconciliation Matrix (F1-F4) table was quietly pulling from the BlockModel's Realisasi_Tonase row, not calculated from Produksi_GC like the "Block Model vs Actual" chart & Professional Reconciliation Report -- only discovered after the sheet's Realisasi_Tonase formula was changed to pull from PitActual, causing the "GC" column to masquerade as PitActual (only populated for Blocks with PitActual data). All three places (chart, Professional Report, F1-F4 Matrix) now use the same function (computeGcTonaseByBlok()) as the single source of truth for GC` },
  { id: `Fitur besar baru: dokumen Job Safety Analysis (JSA-MINEGEO-2026-REV02) terintegrasi langsung ke dashboard -- tombol "Lihat JSA" di Settings (terbuka untuk semua orang, bukan developer-only) membuka modal berisi JSA lengkap lewat iframe, struktur dokumen aslinya tidak diubah sama sekali`, en: `Major new feature: the Job Safety Analysis document (JSA-MINEGEO-2026-REV02) is now integrated directly into the dashboard -- a "View JSA" button in Settings (open to everyone, not developer-only) opens a modal containing the full JSA via iframe, with the original document's structure left completely unchanged` },
  { id: `Fitur baru: EWS (Early Warning System) Dilusi/Ore Loss di Matriks F1-F4 (Rekonsiliasi) -- ambang warna F2 (Pit Actual/GC) disesuaikan jadi OK<=2%/WARNING 2-5%/OUT OF TOL>5%, dan banner merah otomatis muncul di atas tabel kalau ada Blok/Pit yang OUT OF TOL, supaya tidak perlu scroll baca satu-satu baris`, en: `New feature: EWS (Early Warning System) for Dilution/Ore Loss on the F1-F4 Matrix (Reconciliation) -- F2 (Pit Actual/GC) color thresholds adjusted to OK<=2%/WARNING 2-5%/OUT OF TOL>5%, and a red banner now appears automatically above the table when any Block/Pit is OUT OF TOL, so there's no need to scroll through every row` },
  { id: `Fitur baru: tombol "Quick Link RCA" di baris F2 OUT OF TOL pada Matriks F1-F4, sama pola dengan tabel "Block Model vs Actual" tapi lebih pintar -- otomatis isi Tahap Bermasalah "Pit Actual" & Deskripsi Isu berisi angka deviasi F2, supaya RCA yang tercipta dari EWS ini konsisten kategorinya`, en: `New feature: "Quick Link RCA" button on F2 OUT OF TOL rows in the F1-F4 Matrix, same pattern as the "Block Model vs Actual" table but smarter -- automatically fills in the Affected Stage as "Pit Actual" & the Issue Description with the F2 deviation figure, so RCA entries created from this EWS are consistently categorized` },
  { id: `Fitur baru: Total Loss/Dilusi sekarang ditampilkan dalam satuan Ton (bukan cuma %) di 3 tempat -- kartu ringkasan Rekonsiliasi, tabel "Block Model vs Actual" (per baris), dan Laporan Berkala`, en: `New feature: Total Loss/Dilution is now shown in Tons (not just %) in 3 places -- the Reconciliation summary card, the "Block Model vs Actual" table (per row), and the Periodic Report` },
  { id: `Fitur baru: toggle "Bulan ke Bulan" di tab Visual & Trend -- 2 kartu perbandingan Tonase & Ni% (bulan ini vs bulan lalu, dengan panah & persentase perubahan) plus chart 6 bulan terakhir, diagregasi otomatis dari data digging yang sama dipakai chart harian`, en: `New feature: "Month over Month" toggle in the Visual & Trend tab -- 2 comparison cards for Tonnage & Ni% (this month vs last month, with arrows & percentage change) plus a last-6-months chart, automatically aggregated from the same digging data used by the daily charts` },
  { id: `Fitur baru: DISC Sublot rata-rata otomatis di Laporan Berkala -- rata-rata absolut DISC Ni% & SiO2/MgO dari semua Sublot yang shipment-nya masuk periode laporan, tidak perlu dicari manual dari BargeSublot lagi`, en: `New feature: automatic average Sublot DISC in the Periodic Report -- absolute average of DISC Ni% & SiO2/MgO from all Sublots whose shipments fall within the report period, no more manual lookup from BargeSublot needed` },
  { id: `Fitur baru: RCA Log pengelompokan otomatis per Status & Tahap Bermasalah -- badge ringkasan (Open/Progress/Closed dan BM/Validasi/GC/Pit Actual/Plant) muncul di atas daftar RCA Log dalam Laporan Berkala`, en: `New feature: automatic RCA Log grouping by Status & Affected Stage -- summary badges (Open/Progress/Closed and BM/Validation/GC/Pit Actual/Plant) appear above the RCA Log list in the Periodic Report` },
  { id: `Fitur baru: koneksi JSA <-> RCA -- tombol "Catat RCA dari JSA" di modal JSA, buka Form RCA dengan Deskripsi Isu ter-prefill penanda asal dokumen, dipakai saat baca JSA & sadar ada bahaya yang belum tertangani`, en: `New feature: JSA <-> RCA connection -- "Log RCA from JSA" button in the JSA modal, opens the RCA form with the Issue Description pre-filled with a document origin marker, used when reading the JSA and realizing there's an unaddressed hazard` },
  { id: `Fitur baru: koneksi JSA <-> KPI Member -- tombol "TTD & Konfirmasi Kehadiran" (self-service, TANPA PIN Developer) di modal JSA, setiap member konfirmasi sendiri sudah baca JSA & hadir Toolbox Meeting. Hasilnya tersimpan di sheet baru JSA_Log & tampil sebagai badge Compliance ("JSA: Nx TTD - Nx Toolbox") di kartu KPI Member masing-masing. Versi awal cuma hitung frekuensi (Compliance) -- skor pemahaman/kuis (Competency) masih ditahan untuk versi berikutnya`, en: `New feature: JSA <-> KPI Member connection -- "Sign & Confirm Attendance" button (self-service, NO Developer PIN needed) in the JSA modal, each member confirms for themselves that they've read the JSA & attended the Toolbox Meeting. Results are stored in a new JSA_Log sheet & shown as a Compliance badge ("JSA: Nx signed - Nx Toolbox") on each member's KPI Member card. The initial version only counts frequency (Compliance) -- a comprehension/quiz score (Competency) is still on hold for a future version` },
  { id: `Panduan Rekonsiliasi (Settings, Developer-only) diperbarui -- Langkah 7 & 8 disesuaikan dengan fitur EWS/Quick Link RCA/Total Ton/pengelompokan RCA/DISC Sublot otomatis/Trend Bulan-ke-Bulan yang baru, dan Langkah 9 baru "JSA & Keselamatan Kerja (Safety)" ditambahkan menjelaskan alur JSA-RCA-KPI Member lengkap`, en: `Reconciliation Guide (Settings, Developer-only) updated -- Steps 7 & 8 revised to reflect the new EWS/Quick Link RCA/Total Tons/automatic RCA grouping/automatic Sublot DISC/Month-over-Month Trend features, and a new Step 9 "JSA & Safety" added explaining the full JSA-RCA-KPI Member flow` },
 ] },
 { version: `v89.16.28`, items: [
  { id: `Chart "Block Model vs Actual" (Visual & Trend) tambah series "GC (Ton)" -- sekarang tampilkan 3 batang per Blok+Pit (Estimasi -> GC -> Realisasi), bukan cuma 2 (Estimasi vs Realisasi) seperti sebelumnya. GC dihitung otomatis (SUM Tonase per Blok+Pit) dari data Tabel Digging, supaya kelihatan di tahap mana selisih besar terjadi -- BM->GC (akurasi model) atau GC->Realisasi (akurasi penambangan)`, en: `"Block Model vs Actual" chart (Visual & Trend) gets a new "GC (Ton)" series -- now shows 3 bars per Block+Pit (Estimate -> GC -> Actual), instead of just 2 (Estimate vs Actual) as before. GC is auto-calculated (SUM Tonnage per Block+Pit) from the Digging Table data, making it visible at which stage a large deviation occurs -- BM->GC (model accuracy) or GC->Actual (mining accuracy)` },
 ] },
 { version: `v89.16.26`, items: [
  { id: `Fitur baru: Legenda & badge Toleransi Variance (OK/WARNING/OUT OF TOL) di tabel "Block Model vs Actual" (Rekonsiliasi) -- ambang batas WARNING & OUT OF TOL bisa diatur dari Settings > Parameter COG (tab COG). Berbeda dari badge Status (Aman/Tidak Aman) yang sudah ada -- badge baru ini soal SEBERAPA BESAR penyimpangannya, badge lama soal ARAH-nya (Loss/Dilusi)`, en: `New feature: Variance Tolerance legend & badge (OK/WARNING/OUT OF TOL) on the "Block Model vs Actual" table (Reconciliation) -- WARNING & OUT OF TOL thresholds can be set via Settings > COG Parameters (COG tab). Different from the existing Status badge (Safe/Not Safe) -- this new badge is about HOW BIG the deviation is, the old badge is about its DIRECTION (Loss/Dilution)` },
  { id: `Fitur baru: tombol "Quick Link RCA" (ikon petir) muncul di baris OUT OF TOL pada tabel "Block Model vs Actual" (Rekonsiliasi), khusus Developer -- klik langsung buka Form RCA Baru dengan Blok & Pit sudah terisi otomatis dari baris yang diklik, tinggal isi Deskripsi Isu/Root Cause/Tindakan. Kontrol akses tetap di endpoint addRcaLog (server-side rca.create/rca.close), tombol ini cuma jalan pintas UI`, en: `New feature: "Quick Link RCA" button (lightning icon) appears on OUT OF TOL rows in the "Block Model vs Actual" table (Reconciliation), Developer-only -- clicking it opens the New RCA form with Block & Pit already pre-filled from the clicked row, leaving just Issue Description/Root Cause/Action to fill in. Access control remains on the addRcaLog endpoint (server-side rca.create/rca.close), this button is just a UI shortcut` },
  { id: `Bug fix: header kolom Tonase di sheet Produksi_GC yang bertuliskan "Tonase (auto)" membuat dashboard tidak bisa membaca nilainya (kode mencari key persis "tonase", bukan "tonase (auto)") -- semua KPI Ringkasan, chart, dan Realisasi Rekonsiliasi tampil 0 akibatnya. Solusinya header perlu ditulis persis "Tonase" tanpa keterangan tambahan`, en: `Bug fix: the Tonase column header in the Produksi_GC sheet reading "Tonase (auto)" prevented the dashboard from reading its value (the code looks for the exact key "tonase", not "tonase (auto)") -- causing all Summary KPIs, charts, and Reconciliation Actuals to show 0. The fix requires the header to read exactly "Tonase" with no extra text` },
  { id: `Settings > Atur Parameter (Global): 3 kartu (COG/Flag Warna/Bucket & Sampel) dirapikan -- tombol besar "Atur COG/Flag/Bucket" di bawah kartu dihapus, sekarang icon di pojok kiri atas kartu yang jadi pemicu klik langsung, tampilan lebih ringkas`, en: `Settings > Set Parameters (Global): the 3 cards (COG/Flag Colors/Bucket & Sample) were tidied -- the large "Set COG/Flags/Bucket" button below each card was removed, now the icon in the card's top-left corner is the click trigger directly, giving a more compact look` },
  { id: `Settings: kartu "Pengaturan Bahasa" & "Pengaturan Tema Dashboard" digabung jadi 1 kartu "Bahasa & Tema Dashboard" -- 4 tombol (Indonesia/English/Dark/White) ditaruh berdampingan dalam 1 baris, mengurangi jumlah kartu terpisah di panel Settings`, en: `Settings: the "Language Settings" & "Dashboard Theme Settings" cards are merged into 1 "Language & Theme" card -- 4 buttons (Indonesia/English/Dark/White) sit side-by-side in one row, reducing the number of separate cards in the Settings panel` },
  { id: `Fitur besar baru: "Laporan Rekonsiliasi Profesional" (tombol ikon dokumen merah di tab Rekonsiliasi) -- laporan siap cetak/PDF berisi Ringkasan Eksekutif (F1/F2/F4), tabel Rekonsiliasi 3-Tahap per Blok+Pit (BM vs GC vs Realisasi, dengan badge OK/WARNING/OUT OF TOL), dan daftar Temuan RCA yang masih terbuka. SEMUA data ditarik LIVE dari globalBlockModelData, globalRcaLogData, & globalCOGConfig (ambang toleransi ikut Settings > Parameter > COG) -- bukan data contoh statis`, en: `Major new feature: "Professional Reconciliation Report" (red document icon button in the Reconciliation tab) -- a print/PDF-ready report with an Executive Summary (F1/F2/F4), a 3-Stage Reconciliation table per Block+Pit (BM vs GC vs Actual, with OK/WARNING/OUT OF TOL badges), and a list of open RCA findings. ALL data is pulled LIVE from globalBlockModelData, globalRcaLogData, & globalCOGConfig (tolerance thresholds follow Settings > Parameters > COG) -- not static sample data` },
 ] },
 ];
 // Versi lebih lama (v89.16.25, v89.16.24, v89.16.23, dan seterusnya) sudah dimigrasi ke
 // sheet "Changelog" -- tetap bisa dilihat lewat tombol "Lihat Semua Riwayat" di modal.

 async function loadKpiFormulaConfig() {
  const statusMsg = document.getElementById('kpi-formula-status-msg');
  try {
   const payload = buildAuthenticatedPayload({}, { developerOnly: true });
   const url = GOOGLE_SCRIPT_READ_URL + '?sheet=kpiformula&' + payload.toString() + '&t=' + new Date().getTime();
   const response = await fetchWithTimeout(url);
   const result = await response.json();
   if (result.status !== 'success' || !result.data) throw new Error(result.message || 'Gagal memuat config Formula KPI.');
   kpiFormulaWeightsCache = result.data.weights || { A: null, B: null, C: null };
   kpiFormulaActiveOption = result.data.active_option || 'A';
   document.getElementById('kpi-formula-mode-select').value = kpiFormulaActiveOption;
   applyKpiFormulaWeightsToSliders(kpiFormulaActiveOption);
   populateKpiFormulaPreviewMemberDropdown();
  } catch (error) {
   console.error('Error loadKpiFormulaConfig:', error);
   if (statusMsg) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = error && error.message ? error.message : 'Gagal memuat config Formula KPI.';
    statusMsg.classList.remove('hidden');
   }
  }
 }

 function applyKpiFormulaWeightsToSliders(mode) {
  const w = (kpiFormulaWeightsCache && kpiFormulaWeightsCache[mode]) || { kehadiran: 20, safety: 20, sampling: 20, laporan: 20, attitude: 20 };
  document.getElementById('kpi-w-kehadiran').value = w.kehadiran;
  document.getElementById('kpi-w-safety').value = w.safety;
  document.getElementById('kpi-w-sampling').value = w.sampling;
  document.getElementById('kpi-w-laporan').value = w.laporan;
  document.getElementById('kpi-w-attitude').value = w.attitude;
  onKpiFormulaSliderInput();
 }

 function onKpiFormulaModeChange() {
  const mode = document.getElementById('kpi-formula-mode-select').value;
  applyKpiFormulaWeightsToSliders(mode);
 }

 function onKpiFormulaSliderInput() {
  const ids = ['kehadiran','safety','sampling','laporan','attitude'];
  let total = 0;
  ids.forEach(k => {
   const val = document.getElementById('kpi-w-' + k).value;
   document.getElementById('kpi-w-' + k + '-val').textContent = val;
   total += parseFloat(val) || 0;
  });
  const totalEl = document.getElementById('kpi-w-total');
  totalEl.textContent = total;
  // BARU (v90.2.128, keputusan user): backend sekarang WAJIB total persis 100 -- beri
  // peringatan visual (merah) SEBELUM user klik Simpan & kena ditolak backend, supaya
  // jelas kenapa gagal tanpa perlu baca pesan error dulu.
  const isValidTotal = Math.abs(total - 100) < 0.01;
  totalEl.className = isValidTotal ? 'text-title font-bold' : 'text-rose-400 font-bold';
  updateKpiFormulaPreview();
 }

 function populateKpiFormulaPreviewMemberDropdown() {
  const select = document.getElementById('kpi-formula-preview-member');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '';
  (globalMemberData || []).forEach(item => {
   const member = {};
   Object.keys(item).forEach(k => member[k.trim().toLowerCase()] = item[k]);
   const nama = member['nama'] || member['name'] || '';
   if (!nama) return;
   const opt = document.createElement('option');
   opt.value = nama;
   opt.textContent = nama;
   select.appendChild(opt);
  });
  if (currentVal) select.value = currentVal;
  updateKpiFormulaPreview();
 }

 // Preview LIVE: simulasi client-side pakai skor 5 pilar yg SUDAH pernah diambil endpoint
 // kpiscore (fetch ulang tiap ganti member/slider supaya selalu terkini) -- rumus persis
 // sama dgn computeKpiFinalScore_ backend (weighted average + Safety Gate), supaya preview
 // di UI konsisten dgn hasil sungguhan begitu disimpan.
 let kpiFormulaPreviewDebounceTimer = null;
 let kpiFormulaPreviewRequestSeq = 0; // BARU (v90.2.122, temuan audit): sequence guard
 function updateKpiFormulaPreview() {
  clearTimeout(kpiFormulaPreviewDebounceTimer);
  kpiFormulaPreviewDebounceTimer = setTimeout(async () => {
   const requestSeq = ++kpiFormulaPreviewRequestSeq;
   const previewEl = document.getElementById('kpi-formula-preview-text');
   const namaMember = document.getElementById('kpi-formula-preview-member')?.value;
   if (!previewEl) return;
   if (!namaMember) { previewEl.textContent = currentLang === 'en' ? 'Preview: no member available' : 'Preview: belum ada member'; return; }
   previewEl.textContent = (currentLang === 'en' ? 'Preview: loading...' : 'Preview: memuat...');
   try {
    const periode = getLocalPeriodeYyyyMm();
    const url = GOOGLE_SCRIPT_READ_URL + '?sheet=kpiscore&member_id=' + encodeURIComponent(namaMember) + '&periode=' + periode + '&t=' + new Date().getTime();
    const response = await fetchWithTimeout(url);
    const result = await response.json();
    if (requestSeq !== kpiFormulaPreviewRequestSeq) return; // pilihan Member/slider sudah berubah lagi, buang hasil basi ini
    if (result.status !== 'success' || !result.data) throw new Error('no data');
    const p = result.data;
    // BARU (v90.2.122, temuan audit): pilar yg BELUM ADA skornya (null/undefined) sekarang
    // DIKELUARKAN dari total bobot penyebut, BUKAN dipaksa jadi 0 -- sebelumnya `|| 0`
    // membuat weighted average turun drastis kalau 1 pilar memang belum dinilai (mis.
    // Attitude belum dinilai bulan ini), padahal badge pilar itu sendiri tampil "-"
    // (bukan 0). Preview sekarang konsisten dgn makna "-" di badge: pilar tsb tidak ikut
    // dihitung sama sekali, bukan dianggap gagal total.
    const pilarKeys = { kehadiran: 'pilar_kehadiran', safety: 'pilar_safety', sampling: 'pilar_kelengkapan_sampling', laporan: 'pilar_laporan_tepat_waktu', attitude: 'pilar_attitude' };
    const w = {
     kehadiran: parseFloat(document.getElementById('kpi-w-kehadiran').value) || 0,
     safety: parseFloat(document.getElementById('kpi-w-safety').value) || 0,
     sampling: parseFloat(document.getElementById('kpi-w-sampling').value) || 0,
     laporan: parseFloat(document.getElementById('kpi-w-laporan').value) || 0,
     attitude: parseFloat(document.getElementById('kpi-w-attitude').value) || 0
    };
    let weightedSum = 0, totalW = 0, missingCount = 0;
    Object.keys(pilarKeys).forEach(key => {
     const pilarData = p[pilarKeys[key]];
     const hasScore = pilarData && pilarData.score !== null && pilarData.score !== undefined;
     if (!hasScore) { missingCount++; return; }
     weightedSum += pilarData.score * w[key];
     totalW += w[key];
    });
    let finalScore = totalW > 0 ? (weightedSum / totalW) : 0;
    const scores_safety = (p.pilar_safety && p.pilar_safety.score !== null && p.pilar_safety.score !== undefined) ? p.pilar_safety.score : null;
    let gateNote = '';
    const gate = p.safety_gate;
    if (gate && gate.enabled && scores_safety !== null && scores_safety < gate.threshold) {
     finalScore = Math.min(finalScore, gate.cap);
     gateNote = ' (Gate)';
    }
    finalScore = Math.round(finalScore*100)/100;
    const mode = document.getElementById('kpi-formula-mode-select').value;
    const incompleteNote = missingCount > 0 ? (currentLang === 'en' ? ` [${missingCount} pillar(s) not yet scored, excluded]` : ` [${missingCount} pilar belum dinilai, dikecualikan]`) : '';
    previewEl.textContent = (currentLang === 'en' ? 'Preview: If using this mode, ' : 'Preview: Jika pakai mode ini, ') + namaMember + ' = ' + finalScore + gateNote + ' (' + mode + ')' + incompleteNote;
   } catch (err) {
    if (requestSeq !== kpiFormulaPreviewRequestSeq) return;
    previewEl.textContent = currentLang === 'en' ? 'Preview: failed to load' : 'Preview: gagal memuat';
   }
  }, 300);
 }

 async function saveKpiFormula(setActive) {
  const statusMsg = document.getElementById('kpi-formula-status-msg');
  const btnMode = document.getElementById('btn-save-kpi-formula-mode');
  const btnActive = document.getElementById('btn-save-kpi-formula-active');
  const mode = document.getElementById('kpi-formula-mode-select').value;
  function showErr(msg) { if(statusMsg){statusMsg.className = 'text-xs text-rose-400'; statusMsg.innerText = msg; statusMsg.classList.remove('hidden');} }

  const w = {
   kehadiran: document.getElementById('kpi-w-kehadiran').value,
   safety: document.getElementById('kpi-w-safety').value,
   sampling: document.getElementById('kpi-w-sampling').value,
   laporan: document.getElementById('kpi-w-laporan').value,
   attitude: document.getElementById('kpi-w-attitude').value
  };

  [btnMode, btnActive].forEach(b => { if(b) b.disabled = true; });
  if (statusMsg) statusMsg.classList.add('hidden');
  try {
   const payload = buildAuthenticatedPayload({
    action: 'saveKpiFormula', mode, set_active: setActive ? 'true' : 'false',
    w_kehadiran: w.kehadiran, w_safety: w.safety, w_sampling: w.sampling, w_laporan: w.laporan, w_attitude: w.attitude
   }, { developerOnly: true });
   const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
   const result = await response.json();
   if (result.status !== 'success') throw new Error(result.message || 'Gagal menyimpan Formula KPI.');
   kpiFormulaWeightsCache[mode] = { kehadiran: parseFloat(w.kehadiran), safety: parseFloat(w.safety), sampling: parseFloat(w.sampling), laporan: parseFloat(w.laporan), attitude: parseFloat(w.attitude) };
   if (setActive) kpiFormulaActiveOption = mode;
   if (statusMsg) {
    statusMsg.className = 'text-xs text-emerald-400';
    statusMsg.innerText = setActive ? ('Mode ' + mode + ' disimpan & dijadikan aktif.') : ('Mode ' + mode + ' disimpan.');
    statusMsg.classList.remove('hidden');
   }
   updateKpiFormulaPreview();
  } catch (error) {
   console.error('Error saveKpiFormula:', error);
   showErr(error && error.message ? error.message : 'Terjadi kesalahan.');
  } finally {
   [btnMode, btnActive].forEach(b => { if(b) b.disabled = false; });
  }
 }

 // BARU (v90.2.136, keputusan user -- "Konteks Periode Ini"): fetch gabungan KPIEvent+
 // Issue&Action+RCA per periode, MURNI TAMPILAN -- fungsi ini TIDAK PERNAH dipanggil dari
 // manapun yg terhubung ke perhitungan skor (computeKpiFinalScore_ dkk sama sekali tidak
 // menyentuh endpoint ini). Ambil referensi DOM SEBELUM await, sama pola aman dgn
 // fetchKpiBadgesForMember_ -- kalau kartu di-render ulang saat fetch masih jalan, response
 // basi nulis ke node yg sudah lepas dari DOM (tidak ada efek visual keliru).
 async function fetchKpiContextForMember_(namaMember, contextElId) {
 const contextEl = document.getElementById(contextElId);
 if (!contextEl) return;
 try {
  const periode = getLocalPeriodeYyyyMm();
  const url = GOOGLE_SCRIPT_READ_URL + '?sheet=kpicontext&member_id=' + encodeURIComponent(namaMember) + '&periode=' + periode + '&t=' + new Date().getTime();
  const response = await fetchWithTimeout(url);
  const result = await response.json();
  if (result.status !== 'success' || !result.data) { contextEl.innerHTML = ''; return; }
  const events = result.data.events || [];
  // v90.2.138 FIX (temuan audit #3 -- identitas Nama vs User_ID): kalau backend deteksi
  // >1 Member dgn Nama persis sama, tampilkan peringatan jelas -- konteks di bawah ini
  // BISA SAJA milik member lain yg kebetulan namanya identik, bukan cuma dekorasi info.
  const ambiguousWarning = result.data.identity_ambiguous
   ? `<div class="text-rose-400 font-bold mb-1">⚠️ ${currentLang === 'en' ? `Ambiguous name (${result.data.identity_match_count} Members share this exact name) -- context below may not belong to this specific person.` : `Nama ambigu (${result.data.identity_match_count} Member punya Nama persis sama) -- konteks di bawah bisa saja bukan milik orang ini.`}</div>`
   : '';
  if (events.length === 0 && !result.data.identity_ambiguous) { contextEl.innerHTML = ''; return; }

  const sourceIcon = { kpievent: '🔧', issue: '⚠️', rca: '📋' };
  // v90.2.137 FIX (temuan audit -- klarifikasi cakupan): tag kecil "Tim"/"Semua" utk
  // event yg TIDAK spesifik ke member ini (scope !== 'personal') -- supaya reviewer tidak
  // salah kira SEMUA baris di panel ini "milik" member yg kartunya sedang dibuka.
  const scopeTag = (scope) => scope === 'personal'
   ? ''
   : `<span class="px-1 rounded bg-slate-700/60 text-slate-400 text-[8px] font-bold uppercase">${currentLang === 'en' ? 'Team' : 'Tim'}</span>`;
  const rows = events.map((ev, i) => {
   const safeRingkasan = String(ev.ringkasan || '-').replace(/</g, '&lt;');
   const safeDetail = String(ev.detail || '').replace(/</g, '&lt;');
   const tglShort = (ev.tanggal || '').slice(8, 10) + '/' + (ev.tanggal || '').slice(5, 7);
   return `
    <div class="cursor-pointer" onclick="event.stopPropagation(); const d=document.getElementById('kctx-detail-${contextElId}-${i}'); d.classList.toggle('hidden');">
    <div class="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors">
     <span>${sourceIcon[ev.source] || '•'}</span>
     <span class="font-semibold">${tglShort}</span>
     <span class="truncate">${safeRingkasan}</span>
     ${scopeTag(ev.scope)}
    </div>
    ${safeDetail ? `<div id="kctx-detail-${contextElId}-${i}" class="hidden pl-4 py-1 text-slate-500 italic">${safeDetail}</div>` : ''}
    </div>`;
  }).join('');

  contextEl.innerHTML = `
   ${ambiguousWarning}
   <div class="text-[9px] font-bold text-amber-400 tracking-wide uppercase mb-1">${currentLang === 'en' ? `Context This Period (${events.length})` : `Konteks Periode Ini (${events.length})`}</div>
   <div class="text-[9px] text-slate-500 mb-1">${currentLang === 'en' ? 'Tag "Team" = not specific to this member, shown for cross-reference' : 'Tag "Tim" = bukan spesifik member ini, ditampilkan utk cross-reference'}</div>
   <div class="space-y-0.5 max-h-24 overflow-y-auto">${rows}</div>
  `;
 } catch (err) {
  if (contextEl) contextEl.innerHTML = ''; // gagal diam-diam -- ini cuma info pendukung, jangan ganggu tampilan utama kartu
 }
 }

 async function fetchKpiBadgesForMember_(namaMember, laporanBadgeId, kehadiranBadgeId, safetyBadgeId, samplingBadgeId, attitudeBadgeId, finalScoreId, finalScoreGateId) { const laporanBadgeEl = document.getElementById(laporanBadgeId);
 const kehadiranBadgeEl = document.getElementById(kehadiranBadgeId);
 const safetyBadgeEl = document.getElementById(safetyBadgeId);
 const samplingBadgeEl = document.getElementById(samplingBadgeId);
 const attitudeBadgeEl = document.getElementById(attitudeBadgeId);
 const finalScoreEl = document.getElementById(finalScoreId);
 const finalScoreGateEl = document.getElementById(finalScoreGateId);
 if (!laporanBadgeEl && !kehadiranBadgeEl && !safetyBadgeEl && !samplingBadgeEl && !attitudeBadgeEl && !finalScoreEl) return;
 try {
  const periode = getLocalPeriodeYyyyMm();
  const url = GOOGLE_SCRIPT_READ_URL + '?sheet=kpiscore&member_id=' + encodeURIComponent(namaMember) + '&periode=' + periode + '&t=' + new Date().getTime();
  const response = await fetchWithTimeout(url);
  const result = await response.json();
  if (result.status !== 'success' || !result.data) throw new Error('no data');

  const pilar = result.data.pilar_laporan_tepat_waktu;
  if (laporanBadgeEl) {
   if (!pilar || pilar.score === null || pilar.score === undefined) { laporanBadgeEl.textContent = '-'; }
   else {
    const scoreColor = pilar.score >= 90 ? 'text-emerald-400' : (pilar.score >= 70 ? 'text-amber-400' : 'text-rose-400');
    const modeLabel = pilar.mode === 'proksi_assay' ? (currentLang === 'en' ? ' (proxy)' : ' (proksi)') : '';
    laporanBadgeEl.className = 'font-semibold ' + scoreColor;
    laporanBadgeEl.textContent = pilar.score + modeLabel;
    laporanBadgeEl.title = pilar.mode === 'proksi_assay'
     ? (currentLang === 'en' ? 'Based on Assay Update timeliness proxy (Waktu_Input data not old enough yet)' : 'Berdasarkan proksi Ketepatan Update Assay (data Waktu_Input belum cukup umur)')
     : (currentLang === 'en' ? 'Based on actual submission time' : 'Berdasarkan jam submit asli (Waktu_Input)');
   }
  }

  const kehadiran = result.data.pilar_kehadiran;
  if (kehadiranBadgeEl) {
   if (!kehadiran || kehadiran.score === null || kehadiran.score === undefined) { kehadiranBadgeEl.textContent = '-'; }
   else {
    const scoreColorK = kehadiran.score >= 90 ? 'text-emerald-400' : (kehadiran.score >= 70 ? 'text-amber-400' : 'text-rose-400');
    kehadiranBadgeEl.className = 'font-semibold ' + scoreColorK;
    kehadiranBadgeEl.textContent = kehadiran.score;
    kehadiranBadgeEl.title = currentLang === 'en'
     ? `Present: ${kehadiran.hadir} / Eligible days (excl. Izin/Cuti): ${kehadiran.denominator}`
     : `Hadir: ${kehadiran.hadir} / Hari wajib dinilai (sudah dikurangi Izin/Cuti): ${kehadiran.denominator}`;
   }
  }

  const sampling = result.data.pilar_kelengkapan_sampling;
  if (samplingBadgeEl) {
   if (!sampling || sampling.score === null || sampling.score === undefined) { samplingBadgeEl.textContent = '-'; }
   else {
    const scoreColorSp = sampling.score >= 90 ? 'text-emerald-400' : (sampling.score >= 70 ? 'text-amber-400' : 'text-rose-400');
    samplingBadgeEl.className = 'font-semibold ' + scoreColorSp;
    samplingBadgeEl.textContent = sampling.score;
    samplingBadgeEl.title = currentLang === 'en'
     ? `Complete with Ni%: ${sampling.lengkap} / Total rows submitted: ${sampling.total_baris}`
     : `Sampel lengkap Ni%: ${sampling.lengkap} / Total baris disubmit: ${sampling.total_baris}`;
   }
  }

  const attitude = result.data.pilar_attitude;
  if (attitudeBadgeEl) {
   if (!attitude || attitude.score === null || attitude.score === undefined) { attitudeBadgeEl.textContent = '-'; }
   else {
    const scoreColorA = attitude.score >= 90 ? 'text-emerald-400' : (attitude.score >= 70 ? 'text-amber-400' : 'text-rose-400');
    attitudeBadgeEl.className = 'font-semibold ' + scoreColorA;
    attitudeBadgeEl.textContent = attitude.score + (attitude.mode === 'belum_dinilai' ? (currentLang === 'en' ? ' (not yet assessed)' : ' (belum dinilai)') : '');
    attitudeBadgeEl.title = attitude.mode === 'belum_dinilai'
     ? (currentLang === 'en' ? 'No Attitude assessment yet this period' : 'Belum ada penilaian Attitude periode ini')
     : (currentLang === 'en'
       ? `Discipline: ${attitude.disiplin} · Teamwork: ${attitude.kerja_sama} · Initiative: ${attitude.inisiatif} · Integrity: ${attitude.integritas} (scale 1-5)`
       : `Disiplin: ${attitude.disiplin} · Kerja Sama: ${attitude.kerja_sama} · Inisiatif: ${attitude.inisiatif} · Integritas: ${attitude.integritas} (skala 1-5)`);
   }
  }

  const safety = result.data.pilar_safety;
  if (safetyBadgeEl) {
   if (!safety || safety.score === null || safety.score === undefined) { safetyBadgeEl.textContent = '-'; }
   else {
    const scoreColorS = safety.score >= 90 ? 'text-emerald-400' : (safety.score >= 70 ? 'text-amber-400' : 'text-rose-400');
    safetyBadgeEl.className = 'font-semibold ' + scoreColorS;
    safetyBadgeEl.textContent = safety.score;
    safetyBadgeEl.title = currentLang === 'en'
     ? `Average PPE checklist compliance across ${safety.total_hari_hadir} present day(s)`
     : `Rata-rata kepatuhan checklist APD dari ${safety.total_hari_hadir} hari Hadir`;
   }
  }

  if (finalScoreEl) {
   const finalScore = result.data.final_score;
   if (finalScore === null || finalScore === undefined) { finalScoreEl.textContent = '-'; }
   else {
    const scoreColorF = finalScore >= 90 ? 'text-emerald-400' : (finalScore >= 70 ? 'text-amber-400' : 'text-rose-400');
    finalScoreEl.className = 'font-bold text-sm ' + scoreColorF;
    finalScoreEl.textContent = finalScore;
    finalScoreEl.title = currentLang === 'en' ? `Weight mode: ${result.data.weight_mode}` : `Mode bobot: ${result.data.weight_mode}`;
    const gate = result.data.safety_gate;
    if (finalScoreGateEl) finalScoreGateEl.classList.toggle('hidden', !(gate && gate.triggered));
   }
  }
 } catch (err) {
  if (laporanBadgeEl) { laporanBadgeEl.textContent = '-'; laporanBadgeEl.title = currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
  if (kehadiranBadgeEl) { kehadiranBadgeEl.textContent = '-'; kehadiranBadgeEl.title = currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
  if (safetyBadgeEl) { safetyBadgeEl.textContent = '-'; safetyBadgeEl.title = currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
  if (samplingBadgeEl) { samplingBadgeEl.textContent = '-'; samplingBadgeEl.title = currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
  if (attitudeBadgeEl) { attitudeBadgeEl.textContent = '-'; attitudeBadgeEl.title = currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
  if (finalScoreEl) { finalScoreEl.textContent = '-'; finalScoreEl.title = currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
 }
 }

 async function fetchJsaLogData() {
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=jsalog&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load JSA Log.' : 'Gagal memuat data JSA Log'));
  globalJsaLogData = result.data || [];
  const activeTab = document.querySelector('aside nav button.nav-item-active');
  // Race condition guard (pelajaran lama): kartu Member gabung data dari 2 sumber
  // (globalMemberData + globalJsaLogData) -- render ulang dari SINI juga, bukan cuma
  // dari loadMembersFromSheet(), supaya siapapun datang belakangan memperbaiki tampilan.
  if (activeTab && activeTab.id === 'btn-kpimember' && typeof loadMembersFromSheet === 'function' && globalMemberData.length > 0) loadMembersFromSheet();
 } catch (err) {
  console.error('Gagal memuat data JSA Log:', err);
  // Diam-diam gagal (tidak ada UI dedicated buat ini) -- badge Compliance di kartu Member
  // otomatis tetap tampil "-" (globalJsaLogData kosong), bukan error yang mengganggu tab lain.
 }
 }

 // RCA LOG (Root Cause Analysis) -- penjelasan akar masalah & tindakan untuk
 // penyimpangan rekonsiliasi per Blok. LIHAT terbuka untuk semua, INPUT developer-only.
 // ============================================================

 async function fetchRcaLogData(exportRequestId) {
 const listEl = document.getElementById('rca-log-list');
 if (listEl) listEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'Loading RCA data...' : 'Memuat data RCA...'}</p>`;
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=rcalog&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load RCA data.' : 'Gagal memuat data RCA'));
  globalRcaLogData = result.data || [];
  if (listEl) renderRcaLogList();
  // Kalau request ini berasal dari Export RCA yang masih aktif, render ulang preview
  // hanya untuk request terbaru agar response lama tidak menimpa request baru.
  const exportModal = document.getElementById('export-preview-modal');
  if (exportRequestId === undefined || exportRequestId === rcaExportRequestId) {
   if (exportModal && !exportModal.classList.contains('hidden') && pendingExportSource === 'rca') {
    renderExportPreview();
   }
  }
  lucide.createIcons();
  return true;
 } catch (err) {
  console.error('Gagal memuat data RCA:', err);
  const isTimeout = err.name === 'AbortError';
  if (listEl) listEl.innerHTML = `<div class="text-center py-4"><p class="text-[11px] text-rose-400 font-medium mb-2">${isTimeout ? (currentLang === 'en' ? 'Server not responding (timeout).' : 'Server tidak merespons (timeout).') : (currentLang === 'en' ? 'Failed to load RCA data.' : 'Gagal memuat data RCA.')}</p><button onclick="fetchRcaLogData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer">${currentLang === 'en' ? 'Retry' : 'Coba Lagi'}</button></div>`;
  return false;
 }
 }

 function isRcaOverdue(r) {
 if (!r || !r.target) return false;
 const statusLower = String(r.status || 'Open').toLowerCase();
 if (statusLower === 'closed') return false;
 const targetDate = parseDiggingDate(r.target);
 if (!targetDate) return false;
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 targetDate.setHours(0, 0, 0, 0);
 return today.getTime() > targetDate.getTime();
 }

 function renderRcaLogList() {
 const listEl = document.getElementById('rca-log-list');
 if (!listEl) return;

 const overdueBadgeEl = document.getElementById('rca-overdue-badge');
 if (overdueBadgeEl) {
  const overdueCount = (globalRcaLogData || []).filter(isRcaOverdue).length;
  if (overdueCount > 0) {
   overdueBadgeEl.innerText = overdueCount + ' ' + (currentLang === 'en' ? 'OVERDUE' : 'TERLAMBAT');
   overdueBadgeEl.classList.remove('hidden');
  } else {
   overdueBadgeEl.classList.add('hidden');
  }
 }

 if (globalRcaLogData.length === 0) {
  listEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'No RCA entries yet.' : 'Belum ada entri RCA.'}</p>`;
  return;
 }

 const statusPriority = { 'open': 0, 'progress': 1, 'closed': 2 };
 const sorted = [...globalRcaLogData].sort((a, b) => {
  const pa = statusPriority[(a.status || '').toLowerCase()] ?? 3;
  const pb = statusPriority[(b.status || '').toLowerCase()] ?? 3;
  if (pa !== pb) return pa - pb;
  // Dalam status yang sama, RCA yang sudah overdue ditampilkan lebih dulu -- supaya
  // yang paling butuh perhatian tidak tenggelam di tengah daftar Open/Progress lain.
  const oa = isRcaOverdue(a) ? 0 : 1;
  const ob = isRcaOverdue(b) ? 0 : 1;
  return oa - ob;
 });

 const statusColors = {
  'open': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'closed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
 };

 listEl.innerHTML = sorted.map(r => {
  const statusLower = String(r.status || 'Open').toLowerCase();
  const statusClass = statusColors[statusLower] || 'bg-slate-700/40 text-slate-400 border-slate-600/40';
  const isClosed = statusLower === 'closed';
  const overdue = isRcaOverdue(r);
  const createdDate = formatRcaDateTimePart(r.created_date, 'date');
  const createdTime = formatRcaDateTimePart(r.created_time, 'time');
  const closedDate = formatRcaDateTimePart(r.closed_date, 'date');
  const closedTime = formatRcaDateTimePart(r.closed_time, 'time');
  const createdInfo = (r.created_by || createdDate || createdTime)
   ? `<span>Maker: ${r.created_by || '-'}${createdDate ? ' · ' + createdDate : ''}${createdTime ? ' ' + createdTime : ''}</span>` : '';
  const closedInfo = isClosed && (r.closed_by || closedDate || closedTime)
   ? `<span class="text-emerald-400/80">Checker: ${r.closed_by || '-'}${closedDate ? ' · ' + closedDate : ''}${closedTime ? ' ' + closedTime : ''}</span>` : '';
  const safeId = String(r.rca_id || '').replace(/'/g, "\\'");
  const overdueBadge = overdue
   ? `<span class="px-1.5 py-0.5 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[10px] font-bold whitespace-nowrap animate-pulse">${currentLang === 'en' ? 'OVERDUE' : 'TERLAMBAT'}</span>` : '';
  const closeButton = (!isClosed && canCloseRca())
   ? `<button type="button" onclick="closeRcaLog('${safeId}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all cursor-pointer"><i data-lucide="check-circle-2" class="w-3 h-3"></i>${currentLang === 'en' ? 'Close RCA' : 'Tutup RCA'}</button>` : '';
  return `<div class="bg-slate-900/40 border ${overdue ? 'border-rose-500/50' : 'border-slate-700/60'} rounded-xl p-3">
   <div class="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
   <div class="flex items-center gap-2 flex-wrap">
    <span class="font-bold text-title text-xs">${r.blok}${r.pit ? ' / ' + r.pit : ''}</span>
    <span class="px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[10px] font-semibold border border-blue-500/25">${r.tahap || '-'}</span>
    <span class="text-[10px] text-slate-600">${r.rca_id || ''}</span>
   </div>
   <div class="flex items-center gap-1.5 flex-wrap justify-end">
    ${overdueBadge}
    <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusClass} whitespace-nowrap">${r.status ? ((currentLang === 'en' || statusLower !== 'open') ? r.status : 'Terbuka') : (currentLang === 'en' ? 'Open' : 'Terbuka')}</span>
   </div>
   </div>
   <p class="text-[11px] text-slate-300 font-medium mb-1">${r.deskripsi_isu || '-'}</p>
   ${r.root_cause ? `<p class="text-[11px] text-slate-500"><span class="font-semibold text-slate-400">${currentLang === 'en' ? 'Root Cause:' : 'Akar Masalah:'}</span> ${r.root_cause}</p>` : ''}
   ${r.tindakan ? `<p class="text-[11px] text-slate-500"><span class="font-semibold text-slate-400">${currentLang === 'en' ? 'Action' : 'Tindakan'}:</span> ${r.tindakan}</p>` : ''}
   <div class="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-medium flex-wrap">
    ${r.pic ? `<span>PIC: ${r.pic}</span>` : ''}
    ${r.target ? `<span class="${overdue ? 'text-rose-400 font-bold' : ''}">Target: ${r.target}</span>` : ''}
    ${createdInfo}${closedInfo}
   </div>
   <div class="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-slate-800/70">
    <button type="button" onclick="copyRcaToClipboard(this, '${safeId}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-600/40 text-[10px] font-bold transition-all cursor-pointer"><i data-lucide="clipboard-copy" class="w-3 h-3"></i>${currentLang === 'en' ? 'Copy' : 'Salin'}</button>
    ${closeButton}
   </div>
  </div>`;
 }).join('');
 lucide.createIcons();
 }

 // BARU (Sidequest #1): Copy to Clipboard RCA -- salin ringkasan 1 entri RCA sebagai teks
 // rapi ke clipboard, supaya bisa langsung ditempel ke WA/email/laporan tanpa perlu screenshot
 // atau ketik ulang manual. Murni baca dari globalRcaLogData yang sudah ada di frontend --
 // tidak ada endpoint baru, tidak menyentuh backend sama sekali.
 async function copyRcaToClipboard(btnEl, rcaId) {
 const r = (globalRcaLogData || []).find(x => String(x.rca_id) === String(rcaId));
 if (!r) return;

 const en = currentLang === 'en';
 const statusLower = String(r.status || 'Open').toLowerCase();
 const createdDate = formatRcaDateTimePart(r.created_date, 'date');
 const createdTime = formatRcaDateTimePart(r.created_time, 'time');
 const closedDate = formatRcaDateTimePart(r.closed_date, 'date');
 const closedTime = formatRcaDateTimePart(r.closed_time, 'time');

 const lines = [];
 lines.push(`RCA ${r.rca_id || ''}`);
 lines.push(`${en ? 'Block/Pit' : 'Blok/Pit'}: ${r.blok || '-'}${r.pit ? ' / ' + r.pit : ''}`);
 lines.push(`${en ? 'Affected Stage' : 'Tahap Bermasalah'}: ${r.tahap || '-'}`);
 lines.push(`Status: ${r.status || (en ? 'Open' : 'Terbuka')}`);
 lines.push(`${en ? 'Issue Description' : 'Deskripsi Isu'}: ${r.deskripsi_isu || '-'}`);
 if (r.root_cause) lines.push(`${en ? 'Root Cause' : 'Akar Masalah'}: ${r.root_cause}`);
 if (r.tindakan) lines.push(`${en ? 'Action' : 'Tindakan'}: ${r.tindakan}`);
 if (r.pic) lines.push(`PIC: ${r.pic}`);
 if (r.target) lines.push(`Target: ${r.target}`);
 if (r.created_by || createdDate || createdTime) {
  lines.push(`Maker: ${r.created_by || '-'}${createdDate ? ' · ' + createdDate : ''}${createdTime ? ' ' + createdTime : ''}`);
 }
 if (statusLower === 'closed' && (r.closed_by || closedDate || closedTime)) {
  lines.push(`Checker: ${r.closed_by || '-'}${closedDate ? ' · ' + closedDate : ''}${closedTime ? ' ' + closedTime : ''}`);
 }
 const text = lines.join('\n');

 try {
  if (navigator.clipboard && window.isSecureContext) {
   await navigator.clipboard.writeText(text);
  } else {
   // Fallback untuk konteks non-secure (http biasa) atau browser lama yang tidak
   // punya Clipboard API -- textarea sementara + execCommand('copy').
   const ta = document.createElement('textarea');
   ta.value = text;
   ta.style.position = 'fixed';
   ta.style.opacity = '0';
   document.body.appendChild(ta);
   ta.focus();
   ta.select();
   document.execCommand('copy');
   document.body.removeChild(ta);
  }
  if (btnEl) {
   const original = btnEl.innerHTML;
   btnEl.disabled = true;
   btnEl.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i>${en ? 'Copied' : 'Tersalin'}`;
   lucide.createIcons();
   setTimeout(() => {
    btnEl.innerHTML = original;
    btnEl.disabled = false;
    lucide.createIcons();
   }, 1500);
  }
 } catch (err) {
  console.error('Copy RCA failed:', err);
  showNoticeModal(en ? 'Copy Failed' : 'Gagal Menyalin', en ? 'Could not copy to clipboard.' : 'Tidak dapat menyalin ke clipboard.');
 }
 }

 // ============================================================
 // LAPORAN BERKALA (Weekly/Monthly untuk GM) -- rangkuman siap cetak. Bukan sumber data
 // baru, cuma menggabungkan & memfilter data yang sudah ada di Rekonsiliasi/RCA/Barging/
 // Issue sesuai periode yang dipilih. Bagian "Ringkasan Rekonsiliasi" sengaja SNAPSHOT
 // (tidak difilter tanggal) -- sesuai kesepakatan: Blok final dihitung apa adanya saat
 // laporan dibuat, bukan cuma yang jadi final dalam periode itu (tanggal final belum
 // dicatat di sheet manapun).
 // ============================================================

 function openFormRcaPopup(prefillBlok, prefillPit, prefillTahap, prefillDeskripsi) {
 if (!canManageRca()) {
  showNoticeModal(
  currentLang === 'en' ? 'Locked' : 'Terkunci',
  currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first.' : 'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu.'
  );
  return;
 }
 ['rca-blok', 'rca-pit', 'rca-deskripsi', 'rca-root-cause', 'rca-tindakan', 'rca-target'].forEach(id => document.getElementById(id).value = '');
 document.getElementById('rca-tahap').value = '';
 populateNameOptions(document.getElementById('rca-pic'));
 document.getElementById('rca-status-msg').classList.add('hidden');
 // Pre-fill Blok/Pit kalau dipanggil dari Quick Link -- field lain (Root Cause, Tindakan)
 // tetap kosong, biar user yang isi analisisnya sendiri. Tahap & Deskripsi ikut ke-isi
 // kalau dipanggil dengan 4 argumen (dari Quick Link F2), tetap kosong kalau dipanggil
 // manual dari tombol "Catat RCA" biasa atau Quick Link lama (2 argumen).
 if (prefillBlok) document.getElementById('rca-blok').value = prefillBlok;
 if (prefillPit) document.getElementById('rca-pit').value = prefillPit;
 if (prefillTahap) document.getElementById('rca-tahap').value = prefillTahap;
 if (prefillDeskripsi) document.getElementById('rca-deskripsi').value = prefillDeskripsi;
 updateRcaPitActualEvidence();
 const modal = document.getElementById('form-rca-popup-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeFormRcaPopup() {
 hideModalAnimated(document.getElementById('form-rca-popup-modal'));
 }

 // BARU: isi/kosongkan panel "Catatan Pit Actual Terkait" di form RCA, dipanggil saat
 // modal dibuka (termasuk dari Quick Link) & tiap kali field Blok/Pit diketik manual.
 async function closeRcaLog(rcaId) {
 if (!canCloseRca()) {
  showNoticeModal(currentLang === 'en' ? 'Access Denied' : 'Akses Ditolak', currentLang === 'en' ? 'Your role cannot close RCA.' : 'Role Anda tidak memiliki hak menutup RCA.');
  return;
 }
 if (!rcaId) return;
 const ok = await showConfirmModal(
  currentLang === 'en' ? 'Close RCA' : 'Tutup RCA',
  currentLang === 'en' ? 'Close this RCA? This action will mark it Closed and record the Checker identity.' : 'Tutup RCA ini? RCA akan menjadi Closed dan identitas Checker akan dicatat.'
 );
 if (!ok) return;
 try {
  const payload = buildAuthenticatedPayload({ action: 'closeRcaLog', rca_id: rcaId }, {});
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') {
   const err = new Error(result.message || (currentLang === 'en' ? 'Failed to close RCA.' : 'Gagal menutup RCA.'));
   err.code = result.code || '';
   throw err;
  }
  showNoticeModal(currentLang === 'en' ? 'RCA Closed' : 'RCA Ditutup', currentLang === 'en' ? 'RCA successfully closed by Checker.' : 'RCA berhasil ditutup oleh Checker.');
  fetchRcaLogData();
 } catch (error) {
  console.error('Error closing RCA:', error);
  showNoticeModal(currentLang === 'en' ? 'Close RCA Failed' : 'Gagal Menutup RCA', error.message || (currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.'));
 }
 }

 async function submitRcaLog() {
 const blok = document.getElementById('rca-blok').value.trim();
 const pit = document.getElementById('rca-pit').value.trim();
 const tahap = document.getElementById('rca-tahap').value;
 const deskripsi = document.getElementById('rca-deskripsi').value.trim();
 const rootCause = document.getElementById('rca-root-cause').value.trim();
 const tindakan = document.getElementById('rca-tindakan').value.trim();
 const pic = document.getElementById('rca-pic').value;
 const target = document.getElementById('rca-target').value;
 const statusMsg = document.getElementById('rca-status-msg');
 const submitBtn = document.getElementById('btn-submit-rca');
 const originalHtml = submitBtn.innerHTML;

 if (!blok || !deskripsi) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Fill in Blok and Issue Description at minimum.' : 'Isi minimal Blok dan Deskripsi Isu.';
  statusMsg.classList.remove('hidden');
  return;
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const payload = buildAuthenticatedPayload({
  action: 'addRcaLog',
  blok, pit, tahap,
  deskripsi_isu: deskripsi,
  root_cause: rootCause,
  tindakan, pic, target
  }, {});
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save RCA.' : 'Gagal mencatat RCA.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Recorded!' : 'Berhasil dicatat!';
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
  closeFormRcaPopup();
  statusMsg.classList.add('hidden');
  fetchRcaLogData();
  }, 900);
 } catch (error) {
  console.error('Error recording RCA:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error.message || (currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalHtml;
  lucide.createIcons();
 }
 }

 // ---- Panduan Rekonsiliasi (accordion, khusus Developer, sekarang dibuka lewat modal) ----
 function openKpiEventModal() {
 document.getElementById('kpi-event-jenis').value = 'Full Exclusion';
 document.getElementById('kpi-event-tanggal').value = getLocalDateYyyyMmDd();
 document.getElementById('kpi-event-pit-area').value = '';
 document.getElementById('kpi-event-target-member').value = '';
 document.getElementById('kpi-event-jam-normal').value = '';
 document.getElementById('kpi-event-jam-hilang').value = '';
 document.getElementById('kpi-event-jam-recovery').value = '';
 document.getElementById('kpi-event-alasan').value = '';
 document.getElementById('kpi-event-status-msg').classList.add('hidden');
 onKpiEventJenisChange();
 const modal = document.getElementById('kpi-event-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }
 function closeKpiEventModal() {
 const modal = document.getElementById('kpi-event-modal');
 hideModalAnimated(modal);
 }
 function onKpiEventJenisChange() {
 const jenis = document.getElementById('kpi-event-jenis').value;
 document.getElementById('kpi-event-target-member-wrapper').classList.toggle('hidden', jenis !== 'Member Exclusion');
 document.getElementById('kpi-event-jam-wrapper').classList.toggle('hidden', jenis !== 'Partial Adjustment');
 }
 async function submitKpiEvent() {
 const submitBtn = document.getElementById('btn-submit-kpi-event');
 const statusMsg = document.getElementById('kpi-event-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;
 const jenis = document.getElementById('kpi-event-jenis').value;
 const tanggalKejadian = document.getElementById('kpi-event-tanggal').value;
 const pitArea = document.getElementById('kpi-event-pit-area').value.trim();
 const targetMember = document.getElementById('kpi-event-target-member').value.trim();
 const jamNormal = document.getElementById('kpi-event-jam-normal').value;
 const jamHilang = document.getElementById('kpi-event-jam-hilang').value;
 const jamRecovery = document.getElementById('kpi-event-jam-recovery').value;
 const alasan = document.getElementById('kpi-event-alasan').value.trim();

 function showErr(msg) { statusMsg.className = 'text-xs text-rose-400'; statusMsg.innerText = msg; statusMsg.classList.remove('hidden'); }
 if (!tanggalKejadian) return showErr('Tanggal Kejadian wajib diisi.');
 if (!alasan) return showErr('Alasan wajib diisi.');
 if (jenis === 'Member Exclusion' && !targetMember) return showErr('Member Exclusion wajib mencantumkan Target Member (Nama persis, BUKAN ID -- backend mencocokkan berdasarkan Nama, sistem ini belum punya User_ID resmi yg bisa dipilih).');

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Mengajukan...';
 statusMsg.classList.add('hidden');
 try {
  const payload = buildAuthenticatedPayload({
  action: 'addKpiEvent', jenis, tanggal_kejadian: tanggalKejadian, pit_area: pitArea,
  target_member: targetMember, jam_kerja_normal: jamNormal, jam_hilang: jamHilang,
  jam_recovery: jamRecovery, alasan
  });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || 'Gagal mengajukan kejadian.');
  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = 'Kejadian berhasil diajukan sebagai PENDING (' + (result.data && result.data.event_id || '') + ').';
  statusMsg.classList.remove('hidden');
  setTimeout(() => { closeKpiEventModal(); statusMsg.classList.add('hidden'); }, 1200);
 } catch (error) {
  console.error('Error submitKpiEvent:', error);
  showErr(error && error.message ? error.message : 'Terjadi kesalahan. Coba lagi.');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }

 // ==== BARU (28 Agu): MODAL NILAI ATTITUDE (submitAttitudeAssessment) ====
 function openAttitudeModal() {
 const now = new Date();
 document.getElementById('attitude-periode').value = getLocalPeriodeYyyyMm(now);
 document.getElementById('attitude-member-id').value = '';
 document.getElementById('attitude-disiplin').value = '';
 document.getElementById('attitude-kerjasama').value = '';
 document.getElementById('attitude-inisiatif').value = '';
 document.getElementById('attitude-integritas').value = '';
 document.getElementById('attitude-catatan').value = '';
 document.getElementById('attitude-status-msg').classList.add('hidden');
 const modal = document.getElementById('attitude-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }
 function closeAttitudeModal() {
 const modal = document.getElementById('attitude-modal');
 hideModalAnimated(modal);
 }
 async function submitAttitudeAssessment() {
 const submitBtn = document.getElementById('btn-submit-attitude');
 const statusMsg = document.getElementById('attitude-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;
 const periode = document.getElementById('attitude-periode').value;
 const memberId = document.getElementById('attitude-member-id').value.trim();
 const disiplin = document.getElementById('attitude-disiplin').value;
 const kerjaSama = document.getElementById('attitude-kerjasama').value;
 const inisiatif = document.getElementById('attitude-inisiatif').value;
 const integritas = document.getElementById('attitude-integritas').value;
 const catatan = document.getElementById('attitude-catatan').value.trim();

 function showErr(msg) { statusMsg.className = 'text-xs text-rose-400'; statusMsg.innerText = msg; statusMsg.classList.remove('hidden'); }
 if (!periode) return showErr('Periode wajib diisi.');
 if (!memberId) return showErr('Member_ID wajib diisi.');
 const scores = [disiplin, kerjaSama, inisiatif, integritas].map(v => parseInt(v, 10));
 if (scores.some(s => isNaN(s) || s < 1 || s > 5)) return showErr('Disiplin/Kerja Sama/Inisiatif/Integritas wajib angka 1-5.');
 if (scores.some(s => s === 1 || s === 5) && !catatan) return showErr('Catatan (evidence) wajib diisi kalau ada nilai 1 atau 5.');

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Menyimpan...';
 statusMsg.classList.add('hidden');
 try {
  const payload = buildAuthenticatedPayload({
  action: 'submitAttitudeAssessment', periode, member_id: memberId,
  disiplin, kerja_sama: kerjaSama, inisiatif, integritas, catatan
  });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || 'Gagal menyimpan penilaian.');
  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = 'Penilaian Attitude berhasil disimpan.';
  statusMsg.classList.remove('hidden');
  setTimeout(() => { closeAttitudeModal(); statusMsg.classList.add('hidden'); }, 1200);
 } catch (error) {
  console.error('Error submitAttitudeAssessment:', error);
  showErr(error && error.message ? error.message : 'Terjadi kesalahan. Coba lagi.');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }

 async function submitMemberForm(event) {
 event.preventDefault();
 const form = document.getElementById('kpiManagerForm');
 const submitBtn = document.getElementById('btn-submit-member');
 const statusMsg = document.getElementById('member-form-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;

 // MODE EDIT: form dipakai openMemberEdit() -- lewati semua validasi Login_ID/Email/PIN
 // (field itu disembunyikan & tidak wajib di mode ini), kirim ke developerUpdateMember
 // bukan createMemberAccount. Field yang dikirim cuma profil KPI Member.
 if (form.dataset.editMode === '1' && form.dataset.editRow) {
  const nama = (form.elements.nama?.value || '').trim();
  if (!nama) {
   statusMsg.className = 'text-xs text-rose-400';
   statusMsg.innerText = currentLang === 'en' ? 'Full name is required.' : 'Nama Lengkap wajib diisi.';
   statusMsg.classList.remove('hidden');
   return;
  }
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');
  try {
   const editFields = {
    row_number: form.dataset.editRow,
    nama: nama,
    jabatan: (form.elements.jabatan?.value || '').trim(),
    target: (form.elements.target?.value || '').trim(),
    inspeksi: (form.elements.inspeksi?.value || '').trim(),
    accuracy: (form.elements.accuracy?.value || '').trim(),
    status: (form.elements.status?.value || '').trim(),
    grade: (form.elements.grade?.value || '').trim(),
    nomor_hp: (form.elements.nomor_hp?.value || '').trim()
   };
   await postDeveloperAdmin('developerUpdateMember', editFields);
   statusMsg.className = 'text-xs text-emerald-400';
   statusMsg.innerText = currentLang === 'en' ? 'Member data successfully saved!' : 'Data member berhasil disimpan!';
   statusMsg.classList.remove('hidden');
   setTimeout(() => {
    closeFormPopup();
    resetMemberFormMode();
    statusMsg.classList.add('hidden');
    manualRefreshData();
   }, 900);
  } catch (error) {
   console.error('Error updating member:', error);
   statusMsg.className = 'text-xs text-rose-400';
   statusMsg.innerText = error && error.message ? error.message : (currentLang === 'en' ? 'An error occurred while saving. Please try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
   statusMsg.classList.remove('hidden');
  } finally {
   submitBtn.disabled = false;
   submitBtn.innerHTML = originalBtnHtml;
   lucide.createIcons();
  }
  return;
 }


 const loginId = (form.elements.login_id?.value || '').trim();
 const email = (form.elements.email?.value || '').trim();
 const pin = String(form.elements.pin?.value || '').replace(/\D/g, '').slice(0, 6);
 const pinConfirm = String(form.elements.pin_confirm?.value || '').replace(/\D/g, '').slice(0, 6);

 // Pastikan nilai yang dibandingkan sama persis dengan nilai yang terlihat di form.
 if (form.elements.pin) form.elements.pin.value = pin;
 if (form.elements.pin_confirm) form.elements.pin_confirm.value = pinConfirm;

 // Reset transient validation marker on every submit attempt.
 statusMsg.dataset.errorCode = '';

 if (!/^[A-Za-z0-9._-]{3,40}$/.test(loginId)) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Login_ID must be 3-40 characters and use only letters, numbers, dot, underscore, or hyphen.' : 'Login_ID harus 3-40 karakter dan hanya boleh memakai huruf, angka, titik, garis bawah, atau tanda minus.';
  statusMsg.classList.remove('hidden');
  return;
 }
 if (!email) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Registered email is required.' : 'Email terdaftar wajib diisi.';
  statusMsg.classList.remove('hidden');
  return;
 }
 if (!/^\d{6}$/.test(pin)) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Member PIN must be exactly 6 digits.' : 'PIN Member harus tepat 6 digit.';
  statusMsg.classList.remove('hidden');
  return;
 }
 if (pin !== pinConfirm) {
  statusMsg.dataset.errorCode = 'pin-mismatch';
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'PIN confirmation does not match.' : 'Konfirmasi PIN tidak sama.';
  statusMsg.classList.remove('hidden');
  return;
 }

 // PIN sudah cocok; pastikan pesan mismatch lama benar-benar dibersihkan.
 statusMsg.dataset.errorCode = '';
 statusMsg.innerText = '';
 statusMsg.className = 'text-xs hidden';

 const payload = buildAuthenticatedPayload(form, { developerOnly: true });
 payload.set('action', 'createMemberAccount');
 payload.set('sheet_name', 'member');
 // pin_confirm sengaja tetap dikirim agar Code.js memvalidasi PIN di server.

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, {
  method: 'POST',
  body: payload
  });
  const result = await response.json();

  if (result.status === 'success') {
  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Member data successfully saved!' : 'Data member berhasil disimpan!';
  statusMsg.classList.remove('hidden');
  form.reset();

  setTimeout(() => {
   closeFormPopup();
   statusMsg.classList.add('hidden');
   manualRefreshData();
  }, 900);
  } else {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to save member data.' : 'Gagal menyimpan data member.'));
  }
 } catch (error) {
  console.error('Error submitting form:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error && error.message ? error.message : (currentLang === 'en' ? 'An error occurred while saving. Please try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }

 async function loadMembersFromSheet() {
 const container = document.getElementById('member-grid-container');
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL);
  const result = await response.json();

  if (result.status === 'success' && result.data.length > 0) {
  container.innerHTML = '';
  globalMemberData = result.data;
  populateReporterDropdown();

  result.data.forEach((item, index) => {
   const member = {};
   Object.keys(item).forEach(k => member[k.trim().toLowerCase()] = item[k]);

   const namaVal = member['nama'] || member['name'] || 'Tanpa Nama';
   const jabatanVal = member['jabatan'] || member['role'] || '-';
   // v90.2.140 FIX (keputusan user 30 Agu -- alih fungsi Accuracy Grade lama): backend
   // sekarang kirim field BARU (total_tonase/avg_ni_total/waste_tonase/avg_ni_waste/
   // tonase_murni/avg_ni_murni) menggantikan target/inspeksi/accuracy statis lama.
   const fmt1 = (v) => (v === null || v === undefined || v === '' || isNaN(parseFloat(v))) ? '-' : Number(v).toLocaleString('id-ID', {minimumFractionDigits:1, maximumFractionDigits:1});
   const fmtPct2 = (v) => (v === null || v === undefined || v === '' || isNaN(parseFloat(v))) ? '-' : Number(v).toFixed(2) + '%';
   const totalTonaseVal = fmt1(member['total_tonase']);
   const avgNiTotalVal = fmtPct2(member['avg_ni_total']);
   const wasteTonaseVal = fmt1(member['waste_tonase']);
   const avgNiWasteVal = fmtPct2(member['avg_ni_waste']);
   const tonaseMurniVal = fmt1(member['tonase_murni']);
   const avgNiMurniVal = fmtPct2(member['avg_ni_murni']);
   const statusVal = member['status'] || '-';
   const gradeVal = member['grade'] || '-';

   // BARU: badge Compliance JSA -- hitung dari globalJsaLogData yang Nama_Member-nya
   // cocok (case-insensitive, trim) dengan kartu member ini. Versi awal cuma hitung
   // jumlah TTD & jumlah kehadiran toolbox, BELUM ada skor Competency (kuis ditahan).
   const jsaLogsForMember = (globalJsaLogData || []).filter(l => {
   const namaLog = (l.nama_member || '').toString().trim().toLowerCase();
   return namaLog === namaVal.toString().trim().toLowerCase();
   });
   const jsaTtdCount = jsaLogsForMember.length;
   const jsaToolboxCount = jsaLogsForMember.filter(l => (l.toolbox_hadir || '').toString().trim().toUpperCase() === 'Y').length;
   const jsaBadgeHtml = jsaTtdCount > 0
   ? `<div class="flex justify-between"><span class="text-slate-400">JSA <span class="text-slate-600 font-normal">(${currentLang === 'en' ? 'all-time' : 'sepanjang waktu'})</span>:</span> <span class="font-semibold text-cyan-400">${jsaTtdCount}x ${currentLang === 'en' ? 'signed' : 'TTD'} &middot; ${jsaToolboxCount}x Toolbox</span></div>`
   : `<div class="flex justify-between"><span class="text-slate-400">JSA:</span> <span class="font-semibold text-slate-500">${currentLang === 'en' ? 'No record yet' : 'Belum ada catatan'}</span></div>`;

   // BARU (v90.2.110): badge pilar KPI "Laporan Tepat Waktu" -- baru pilar INI yang punya
   // engine skor (4 pilar lain masih menyusul, lihat Kerangka_Engine_KPI_5_Pilar.md).
   // Diisi placeholder dulu, di-update async setelah endpoint kpiscore selesai dipanggil
   // (per-kartu, TIDAK memblokir render grid member yg lain).
   const kpiLaporanBadgeId = `kpi-laporan-badge-${index}`;
   const kpiLaporanBadgeHtml = `<div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'On-Time Reporting' : 'Laporan Tepat Waktu'}:</span> <span id="${kpiLaporanBadgeId}" class="font-semibold text-slate-500">${currentLang === 'en' ? 'Loading...' : 'Memuat...'}</span></div>`;
   // BARU (v90.2.111): badge pilar KPI "Kehadiran" -- sama pola, 1 elemen id unik, diisi
   // dari response endpoint kpiscore yg SAMA dgn Laporan (field pilar_kehadiran), TIDAK
   // nambah panggilan fetch terpisah.
   const kpiKehadiranBadgeId = `kpi-kehadiran-badge-${index}`;
   const kpiKehadiranBadgeHtml = `<div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Attendance' : 'Kehadiran'}:</span> <span id="${kpiKehadiranBadgeId}" class="font-semibold text-slate-500">${currentLang === 'en' ? 'Loading...' : 'Memuat...'}</span></div>`;
   // BARU (v90.2.112): badge pilar "Safety (APD)".
   const kpiSafetyBadgeId = `kpi-safety-badge-${index}`;
   const kpiSafetyBadgeHtml = `<div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Safety (PPE)' : 'Safety (APD)'}:</span> <span id="${kpiSafetyBadgeId}" class="font-semibold text-slate-500">${currentLang === 'en' ? 'Loading...' : 'Memuat...'}</span></div>`;
   // BARU (v90.2.113): badge pilar "Kelengkapan Sampling".
   const kpiSamplingBadgeId = `kpi-sampling-badge-${index}`;
   const kpiSamplingBadgeHtml = `<div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Sampling Completeness' : 'Kelengkapan Sampling'}:</span> <span id="${kpiSamplingBadgeId}" class="font-semibold text-slate-500">${currentLang === 'en' ? 'Loading...' : 'Memuat...'}</span></div>`;
   // BARU (v90.2.114): badge pilar "Attitude" -- pilar KE-5 DAN TERAKHIR, engine 5 pilar
   // KPI kini lengkap semua (Kehadiran/Safety/Sampling/Laporan/Attitude).
   const kpiAttitudeBadgeId = `kpi-attitude-badge-${index}`;
   const kpiAttitudeBadgeHtml = `<div class="flex justify-between"><span class="text-slate-400">Attitude:</span> <span id="${kpiAttitudeBadgeId}" class="font-semibold text-slate-500">${currentLang === 'en' ? 'Loading...' : 'Memuat...'}</span></div>`;
   // BARU (v90.2.116): Skor KPI Gabungan Final -- 5 pilar x bobot mode aktif + Safety Gate.
   // Ditaruh terpisah dari 5 badge pilar (styling lebih menonjol), karena ini "hasil akhir"
   // yg paling relevan dilihat sekilas, bukan cuma 1 dari sekian badge biasa.
   const kpiFinalScoreId = `kpi-final-score-${index}`;
   const kpiFinalScoreGateId = `kpi-final-score-gate-${index}`;
   const kpiFinalScoreHtml = `<div class="flex justify-between items-center pt-2 mt-1.5 border-t border-slate-700/40">
    <span class="text-slate-300 font-bold text-[11px]">${currentLang === 'en' ? 'Final KPI Score' : 'Skor KPI Gabungan'}:</span>
    <span class="flex items-center gap-1.5">
    <span id="${kpiFinalScoreId}" class="font-bold text-sm text-slate-500">${currentLang === 'en' ? 'Loading...' : 'Memuat...'}</span>
    <span id="${kpiFinalScoreGateId}" class="hidden px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold" title="${currentLang === 'en' ? 'Capped by Safety Gate' : 'Dipotong Safety Gate'}">GATE</span>
    </span>
   </div>`;
   // BARU (v90.2.136, keputusan user -- "Konteks Periode Ini"): gabungan KPIEvent+Issue&
   // Action+RCA utk periode yg sama, MURNI INFORMASI PENDUKUNG audit -- TIDAK mengubah skor
   // apapun (lihat prinsip locked di catatan proyek). Ringkas di kartu, klik utk detail.
   const kpiContextId = `kpi-context-${index}`;
   const kpiContextHtml = `<div id="${kpiContextId}" class="pt-2 mt-1.5 border-t border-slate-700/40 text-[10px]"></div>`;

   const card = document.createElement('div');
   card.className = "glass-card p-4.5 rounded-xl border border-slate-700/40 flex flex-col justify-between hover:border-blue-500/50 transition-all cursor-pointer text-xs";
   card.onclick = () => openMemberModal(index);
   card.innerHTML = `
   <div>
    <div class="flex items-center gap-3 mb-3.5">
    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(namaVal)}&background=2563eb&color=fff&bold=true" class="w-10 h-10 rounded-full border-2 border-blue-500 shadow-sm" alt="Avatar">
    <div>
     <h4 class="font-bold text-title tracking-tight">${namaVal}</h4>
     <p class="text-[11px] text-slate-400 font-medium">${jabatanVal}</p>
    </div>
    </div>
    <div class="space-y-1.5 mb-3.5 font-medium">
    <div class="pt-1 pb-1.5">
     <div class="text-[9px] font-bold text-slate-500 tracking-wide uppercase mb-1">${currentLang === 'en' ? 'Total Excavation' : 'Total Penggalian'}</div>
     <div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Tonnage' : 'Tonase'}</span><span class="font-semibold text-title">${totalTonaseVal} ${totalTonaseVal !== '-' ? 'ton' : ''}</span></div>
     <div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Average Ni' : 'Average Ni'}</span><span class="font-semibold text-title">${avgNiTotalVal}</span></div>
    </div>
    <div class="pt-1.5 pb-1.5 border-t border-slate-700/40">
     <div class="text-[9px] font-bold text-amber-400/80 tracking-wide uppercase mb-1">${currentLang === 'en' ? 'Waste Non COG' : 'Waste Non COG'}</div>
     <div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Tonnage' : 'Tonase'}</span><span class="font-semibold text-title">${wasteTonaseVal} ${wasteTonaseVal !== '-' ? 'ton' : ''}</span></div>
     <div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Average Ni' : 'Average Ni'}</span><span class="font-semibold text-title">${avgNiWasteVal}</span></div>
    </div>
    <div class="pt-1.5 pb-1 border-t border-slate-700/40">
     <div class="text-[9px] font-bold text-emerald-400/80 tracking-wide uppercase mb-1">${currentLang === 'en' ? 'Net Result' : 'Hasil Bersih'}</div>
     <div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Tonnage' : 'Tonase'}</span><span class="font-semibold text-emerald-400">${tonaseMurniVal} ${tonaseMurniVal !== '-' ? 'ton' : ''}</span></div>
     <div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Average Ni' : 'Average Ni'}</span><span class="font-semibold text-emerald-400">${avgNiMurniVal}</span></div>
    </div>
    ${member['anomaly_waste_exceeds_total'] ? `<div class="text-[9px] text-rose-400 font-semibold">⚠ ${currentLang === 'en' ? 'Data anomaly: Waste exceeds Total' : 'Anomali data: Waste melebihi Total'}</div>` : ''}
    ${jsaBadgeHtml}
    <div class="pt-2 mt-1.5 border-t border-slate-700/40 text-[9px] font-bold text-violet-400 tracking-wide uppercase">${currentLang === 'en' ? '5-Pillar KPI Engine (New)' : 'Engine KPI 5 Pilar (Baru)'}</div>
    ${kpiLaporanBadgeHtml}
    ${kpiKehadiranBadgeHtml}
    ${kpiSafetyBadgeHtml}
    ${kpiSamplingBadgeHtml}
    ${kpiAttitudeBadgeHtml}
    ${kpiFinalScoreHtml}
    ${kpiContextHtml}
    </div>
   </div>
   <div class="pt-3 border-t border-slate-700/40 flex justify-between items-center text-[11px]">
    <span class="text-slate-400 font-medium">${translations[currentLang].form_status}: <strong class="${statusVal.toLowerCase() === 'achieved' ? 'text-emerald-400' : 'text-amber-400'}">${statusVal}</strong></span>
    <span class="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">${gradeVal}</span>
   </div>
   ${isDeveloperUnlocked() ? `<div class="pt-2 mt-2 flex gap-1.5" onclick="event.stopPropagation()">
    <button type="button" onclick="openMemberEdit(${item['_row'] || index + 2})" class="flex-1 px-2 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-[10px] font-bold">Edit</button>
    <button type="button" onclick="deleteMemberByRow(${item['_row'] || index + 2})" class="flex-1 px-2 py-1.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 text-[10px] font-bold">Delete</button>
   </div>` : ''}
   `;
   container.appendChild(card);
   fetchKpiBadgesForMember_(namaVal, kpiLaporanBadgeId, kpiKehadiranBadgeId, kpiSafetyBadgeId, kpiSamplingBadgeId, kpiAttitudeBadgeId, kpiFinalScoreId, kpiFinalScoreGateId);
   fetchKpiContextForMember_(namaVal, kpiContextId);
  });
  lucide.createIcons();
  } else {
  container.innerHTML = `<div class="col-span-full text-center py-8 text-slate-400 text-xs font-medium">${translations[currentLang].member_empty}</div>`;
  }
  renderLeaderboard();
  markDataFresh_('Member');
 } catch (error) {
  console.error('Error fetching member data:', error);
  markDataStale_('Member');
  const isTimeout = error.name === 'AbortError';
  container.innerHTML = `
  <div class="col-span-full text-center py-8 text-rose-400 text-xs space-y-3 font-medium">
   <p>${isTimeout ? (currentLang === 'en' ? 'Server did not respond within 20 seconds (timeout).' : 'Server tidak merespons dalam 20 detik (timeout).') : translations[currentLang].member_load_error}</p>
   <button onclick="loadMembersFromSheet()" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all">
   ${translations[currentLang].retry}
   </button>
  </div>`;
 }
 }

 // BARU (Sidequest #4): Leaderboard Geologist -- ranking murni turunan dari globalMemberData
 // (field Accuracy) yang sudah di-fetch bareng loadMembersFromSheet() di atas. TIDAK ada
 // endpoint/data baru, TIDAK mengubah sheet Member sama sekali -- cuma diurutkan & ditampilkan
 // ulang di frontend. Accuracy sengaja dipilih sbg basis ranking (bukan Target/Inspeksi) karena
 // field ini paling merepresentasikan akurasi kerja individu, sementara Target format bervariasi
 // per member (ada yg "98%", ada yg "3 Hari / Segera" -- tidak konsisten numerik).
 // Accuracy adalah free-text field (placeholder cth. "96.5%") -- diparse defensif dgn regex,
 // member yang nilainya tidak mengandung angka sama sekali DIKELUARKAN dari ranking (bukan
 // ditaruh di posisi terakhir dgn nilai 0, supaya tidak menyesatkan seolah performanya buruk).
 function openMemberModal(index) {
 const item = globalMemberData[index];
 if (!item) return;

 const member = {};
 Object.keys(item).forEach(k => member[k.trim().toLowerCase()] = item[k]);

 const nama = member['nama'] || 'Tanpa Nama';
 document.getElementById('modal-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&background=2563eb&color=fff&bold=true`;
 document.getElementById('modal-nama').innerText = nama;
 document.getElementById('modal-jabatan').innerText = member['jabatan'] || '-';
 document.getElementById('modal-hp').innerText = member['nomor_hp'] || '-';
 document.getElementById('modal-hadir').innerText = member['absensi_hadir'] || '-';
 document.getElementById('modal-izin').innerText = member['absensi_izin'] || '-';
 document.getElementById('modal-cuti').innerText = member['absensi_cuti'] || '-';
 // v90.2.140 FIX: field lama target/inspeksi/accuracy diganti hasil hitung Produksi_GC.
 const fmt1M = (v) => (v === null || v === undefined || v === '' || isNaN(parseFloat(v))) ? '-' : Number(v).toLocaleString('id-ID', {minimumFractionDigits:1, maximumFractionDigits:1}) + (isNaN(parseFloat(v)) ? '' : ' ton');
 const fmtPct2M = (v) => (v === null || v === undefined || v === '' || isNaN(parseFloat(v))) ? '-' : Number(v).toFixed(2) + '%';
 document.getElementById('modal-target').innerText = fmt1M(member['total_tonase']);
 document.getElementById('modal-inspeksi').innerText = fmtPct2M(member['avg_ni_total']);
 document.getElementById('modal-catatan').innerText = member['catatan_kinerja'] || '-';
 document.getElementById('modal-detail').innerText = member['detail'] || '-';
 document.getElementById('modal-accuracy').innerText = fmt1M(member['waste_tonase']) + (member['waste_tonase'] ? ' @ ' + fmtPct2M(member['avg_ni_waste']) : '');
 document.getElementById('modal-grade').innerText = member['grade'] || '-';
 // v90.2.140 BARU: "Hasil Bersih" (Tonase Murni + Avg Ni Murni) -- elemen id="modal-hasil-bersih"
 // ditambahkan ke index.html, diisi di sini kalau elemennya ada (aman kalau markup blm diupdate).
 var hasilBersihEl = document.getElementById('modal-hasil-bersih');
 if (hasilBersihEl) hasilBersihEl.innerText = fmt1M(member['tonase_murni']) + ' @ ' + fmtPct2M(member['avg_ni_murni']);

 const modal = document.getElementById('member-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeMemberModal() {
 const modal = document.getElementById('member-modal');
 hideModalAnimated(modal);
 }

 const ISSUE_MAX_AUTO_RETRY = 2;
 let issueAutoRetryCount = 0;

 // ========== FITUR CHAT TIM ==========

async function deleteMemberByRow(rowNumber) {
  if (!(await showConfirmModal(currentLang === 'en' ? 'Delete Member Record' : 'Hapus Record Member', currentLang === 'en' ? 'Delete this Member record from the Member sheet?' : 'Hapus record Member ini dari sheet Member?'))) return;
  try { await postDeveloperAdmin('developerDeleteMember',{row_number:String(rowNumber)}); closeMemberModal(); await loadMembersFromSheet(); }
  catch(e){ showNoticeModal(currentLang==='en'?'Delete Failed':'Hapus Gagal',e.message); }
}

function resetMemberFormMode() {
  const form=document.getElementById('kpiManagerForm'); if(!form) return;
  form.dataset.editMode='0'; form.dataset.editRow='';
  const hidden=form.elements.edit_row; if(hidden) hidden.value='';
  const account=document.getElementById('member-account-access-block'); if(account) account.classList.remove('hidden');
  ['login_id','email','pin','pin_confirm'].forEach(n=>{ if(form.elements[n]) form.elements[n].required=true; });
  const title=document.querySelector('#form-popup-modal [data-i18n="form_member_title"]'); if(title) title.innerText='Form Member & KPI Geologi';
  const subtitle=document.querySelector('#form-popup-modal [data-i18n="form_member_subtitle"]'); if(subtitle) subtitle.innerText='Isi formulir di bawah ini untuk menambahkan data member baru.';
  const btn=document.getElementById('btn-submit-member'); if(btn) btn.innerHTML='<i data-lucide="save" class="w-3.5 h-3.5"></i> Simpan Member';
  lucide.createIcons();
}

function openMemberEdit(rowNumber) {
  if (!isDeveloperUnlocked()) return;
  const item=globalMemberData.find(x=>Number(x._row)===Number(rowNumber));
  if(!item) { showNoticeModal('Edit Gagal','Data Member tidak ditemukan. Refresh data lalu coba lagi.'); return; }
  const form=document.getElementById('kpiManagerForm');
  if(!form) return;
  resetMemberFormMode();
  form.dataset.editMode='1'; form.dataset.editRow=String(rowNumber);
  if(form.elements.edit_row) form.elements.edit_row.value=String(rowNumber);
  const member={}; Object.keys(item).forEach(k=>member[k.trim().toLowerCase()]=item[k]);
  const set=(n,v)=>{ if(form.elements[n]) form.elements[n].value=(v===null||v===undefined)?'':v; };
  set('nama',member.nama||''); set('jabatan',member.jabatan||''); set('target',member.target||'');
  set('inspeksi',member.inspeksi||''); set('accuracy',member.accuracy||''); set('grade',member.grade||'Grade A');
  set('status',member.status||'Achieved'); set('nomor_hp',member.nomor_hp||'');
  const account=document.getElementById('member-account-access-block'); if(account) account.classList.add('hidden');
  ['login_id','email','pin','pin_confirm'].forEach(n=>{ if(form.elements[n]) form.elements[n].required=false; });
  const title=document.querySelector('#form-popup-modal [data-i18n="form_member_title"]'); if(title) title.innerText='Edit Member & KPI';
  const subtitle=document.querySelector('#form-popup-modal [data-i18n="form_member_subtitle"]'); if(subtitle) subtitle.innerText='Perubahan langsung disimpan ke sheet Member.';
  const btn=document.getElementById('btn-submit-member'); if(btn) btn.innerHTML='<i data-lucide="save" class="w-3.5 h-3.5"></i> Simpan Perubahan';
  showModalAnimated(document.getElementById('form-popup-modal')); lucide.createIcons();
}
