// ==== BARGING.js -- v90.2.120 ====

 function setExportConfirmLoadingState(disabled) {
 const confirmBtn = document.getElementById('btn-confirm-export');
 if (!confirmBtn) return;
 if (disabled) {
  confirmBtn.disabled = true;
  confirmBtn.classList.add('opacity-60', 'cursor-not-allowed');
  confirmBtn.classList.remove('hover:bg-blue-500');
  confirmBtn.setAttribute('aria-busy', 'true');
  confirmBtn.innerHTML = '<i data-lucide="loader-circle" class="w-3.5 h-3.5 animate-spin"></i> ' + (currentLang === 'en' ? 'Loading RCA data...' : 'Memuat data RCA...');
 } else {
  confirmBtn.disabled = false;
  confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
  confirmBtn.classList.add('hover:bg-blue-500');
  confirmBtn.removeAttribute('aria-busy');
  lucide.createIcons();
 }
 lucide.createIcons();
 }

 function canAssignDome() {
 const role = String(getCurrentExportRole() || '').trim().toUpperCase();
 return role === 'DEVELOPER' || role === 'SUPERVISOR';
 }
 function canViewDomeHistory() {
 return isDeveloperUnlocked();
 }

 // BARU (28 Agu): helper permission KPI & Attitude -- kpi_event.create dikonfirmasi
 // MEMBER/SUPERVISOR/DEVELOPER (siapa saja yg login boleh ajukan kejadian). approve
 // & assess DEVELOPER-only / SUPERVISOR+DEVELOPER, sesuai RolePermissions asli.
 function canManageBarge() {
 return isDeveloperUnlocked();
 }

 // RCA Maker-Checker UI gate:
 // Create: Supervisor + Developer.
 // Close: Developer only, matching the final RolePermissions policy.
 // Server-side rca.create/rca.close remains the final authority.
 function showAppLoading(title, message) {
  const overlay = document.getElementById('app-loading-overlay');
  const titleEl = document.getElementById('app-loading-title');
  const messageEl = document.getElementById('app-loading-message');
  if (!overlay) return;
  appLoadingDepth++;
  if (titleEl) titleEl.textContent = title || (currentLang === 'en' ? 'Processing...' : 'Memproses...');
  if (messageEl) messageEl.textContent = message || (currentLang === 'en' ? 'Please wait...' : 'Mohon tunggu...');
  overlay.classList.add('is-visible');
 }

 function hideAppLoading(force) {
  if (force) appLoadingDepth = 0;
  else appLoadingDepth = Math.max(0, appLoadingDepth - 1);
  if (appLoadingDepth === 0) {
   const overlay = document.getElementById('app-loading-overlay');
   if (overlay) overlay.classList.remove('is-visible');
  }
 }

 function closeDomeHistoryModal() {
 const modal = document.getElementById('dome-history-modal');
 hideModalAnimated(modal);
 }

 async function openDomeHistoryModal() {
 const row = currentOpenDiggingRow;
 if (!row) return;

 if (!canViewDomeHistory()) {
  showNoticeModal(
  currentLang === 'en' ? 'Locked' : 'Terkunci',
  currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first to view the Dome history.' : 'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu untuk melihat riwayat Dome.'
  );
  return;
 }

 const domeIds = [row.idEfo, row.idEto].filter(id => id && id !== '-');
 if (domeIds.length === 0) {
  showNoticeModal(
  currentLang === 'en' ? 'No Dome Linked' : 'Belum Ada Dome',
  currentLang === 'en' ? 'This row has never been assigned to any Dome.' : 'Baris ini belum pernah di-assign ke Dome manapun.'
  );
  return;
 }

 document.getElementById('dome-history-subtitle').innerText = `ID Sampel: ${row.idSampel} -- Dome: ${domeIds.join(', ')}`;
 const bodyEl = document.getElementById('dome-history-body');
 bodyEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'Loading history...' : 'Memuat riwayat...'}</p>`;

 const modal = document.getElementById('dome-history-modal');
 showModalAnimated(modal);
 lucide.createIcons();

 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=domelog&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load Dome history.' : 'Gagal memuat riwayat Dome'));
  // v90.2.125 FIX (temuan audit -- race condition nyata): modal ini PERSISTEN, sama pola
  // dgn openBargeDetailModal() -- kalau user pindah ke baris Digging lain sblm fetch ini
  // selesai, response basi ttg baris LAMA bisa menimpa modal yg subtitle-nya sudah baris
  // BARU. Guard ini buang hasil basi kalau baris yg sedang dibuka user sudah beda.
  if (row !== currentOpenDiggingRow) return;

  const allLogs = result.data || [];
  bodyEl.innerHTML = domeIds.map(domeId => {
  const logsForDome = allLogs.filter(l => (l.dome_id || '').toString().trim() === domeId);
  return renderDomeHistoryTable(domeId, logsForDome, row.idSampel);
  }).join('');
  lucide.createIcons();
 } catch (err) {
  if (row !== currentOpenDiggingRow) return;
  console.error('Gagal memuat riwayat Dome:', err);
  const isTimeout = err.name === 'AbortError';
  bodyEl.innerHTML = `<p class="text-[11px] text-rose-400 font-medium">${isTimeout ? (currentLang === 'en' ? 'Server not responding (timeout).' : 'Server tidak merespons (timeout).') : (currentLang === 'en' ? 'Failed to load Dome history.' : 'Gagal memuat riwayat Dome.')}</p>`;
 }
 }

 // Baris yang ref_id_sampel-nya cocok dengan ID Sampel baris digging yang sedang dibuka
 // ditandai kuning -- supaya langsung kelihatan "ini transaksi yang tercipta dari baris
 // ini", di antara transaksi lain milik member/hari lain yang memakai Dome yang sama.
 function renderDomeHistoryTable(domeId, logs, currentIdSampel) {
 const headerHtml = `<p class="text-xs font-bold text-title mb-2">Dome ${domeId}</p>`;
 if (logs.length === 0) {
  return `<div>${headerHtml}<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'No transactions recorded yet.' : 'Belum ada transaksi tercatat.'}</p></div>`;
 }

 const rowsHtml = logs.map(l => {
  const isCurrent = (l.ref_id_sampel || '').toString().trim() === currentIdSampel;
  const tonaseTx = l.tonase_transaksi || 0;
  const niTx = l.ni_transaksi || 0;
  const tonaseAfter = l.tonase_dome_sesudah || 0;
  const niAfter = l.ni_dome_sesudah || 0;
  return `<tr class="${isCurrent ? 'bg-amber-500/10' : ''}">
   <td class="p-2 text-slate-300 whitespace-nowrap">${l.tanggal || '-'} ${l.waktu || ''}</td>
   <td class="p-2 text-slate-300">${l.jenis || '-'}</td>
   <td class="p-2 text-slate-400">${l.ref_id_sampel || '-'}${isCurrent ? ` <span class="text-amber-400 font-semibold">(${currentLang === 'en' ? 'this row' : 'baris ini'})</span>` : ''}</td>
   <td class="p-2 text-right font-semibold text-title whitespace-nowrap">${tonaseTx.toLocaleString()}</td>
   <td class="p-2 text-center text-emerald-400 whitespace-nowrap">${niTx.toFixed(2)}%</td>
   <td class="p-2 text-right text-slate-300 whitespace-nowrap">${tonaseAfter.toLocaleString()}</td>
   <td class="p-2 text-center text-slate-300 whitespace-nowrap">${niAfter.toFixed(2)}%</td>
   <td class="p-2 text-slate-400">${l.pic || '-'}</td>
  </tr>`;
 }).join('');

 return `<div>
  ${headerHtml}
  <div class="overflow-x-auto">
  <table class="w-full text-[11px]">
   <thead>
   <tr class="text-slate-500 border-b border-slate-700/50 text-left">
    <th class="p-2">${currentLang === 'en' ? 'Time' : 'Waktu'}</th>
    <th class="p-2">${currentLang === 'en' ? 'Type' : 'Jenis'}</th>
    <th class="p-2">Ref ID Sampel</th>
    <th class="p-2 text-right">${currentLang === 'en' ? 'Tonnage' : 'Tonase'}</th>
    <th class="p-2 text-center">Ni %</th>
    <th class="p-2 text-right">${currentLang === 'en' ? 'Tonnage After' : 'Tonase Sesudah'}</th>
    <th class="p-2 text-center">${currentLang === 'en' ? 'Ni % After' : 'Ni % Sesudah'}</th>
    <th class="p-2">PIC</th>
   </tr>
   </thead>
   <tbody class="divide-y divide-slate-800/50">${rowsHtml}</tbody>
  </table>
  </div>
 </div>`;
 }

 // ==== BARU: Riwayat Tujuan -- audit trail perubahan Tujuan EFO/ETO/Direct/Disposal
 // untuk baris digging ini. Terbuka untuk SEMUA orang (LIHAT), tidak di-gate canAssignDome()
 // seperti popup Update Tujuan -- ini murni transparansi log, bukan aksi ubah data.
 // Menjawab celah lama: sebelumnya perubahan Tujuan bisa terjadi tanpa jejak siapa/kapan/
 // dari-apa-ke-apa, cuma kolom Keterangan biasa yang bisa tertimpa kalau diubah lagi. ====

 async function loadDomeSelectOptions(selectEl, area) {
 selectEl.innerHTML = `<option value="">${currentLang === 'en' ? 'Loading...' : 'Memuat...'}</option>`;
 try {
  if (domePickerListCache.length === 0) {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=domestock&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load Dome data.' : 'Gagal memuat data Dome'));
  domePickerListCache = result.data || [];
  }
  const domes = domePickerListCache.filter(d => (d.area || '').toUpperCase() === area.toUpperCase() && (d.status || '').toLowerCase() === 'aktif');
  if (domes.length === 0) {
  selectEl.innerHTML = `<option value="">${currentLang === 'en' ? 'No active Dome -- open one below' : 'Belum ada Dome aktif -- buka di bawah'}</option>`;
  return;
  }
  selectEl.innerHTML = '<option value="">-</option>' + domes.map(d =>
  `<option value="${d.dome_id}">${d.dome_id} (${(d.tonase_saat_ini || 0).toLocaleString()}/${d.kapasitas.toLocaleString()} ton, Ni ${(d.ni_saat_ini || 0).toFixed(2)}%)</option>`
  ).join('');
 } catch (err) {
  console.error('Gagal memuat opsi Dome:', err);
  selectEl.innerHTML = `<option value="">${currentLang === 'en' ? 'Failed to load' : 'Gagal memuat'}</option>`;
 }
 }

 function toggleNewDomeForm() {
 const willShow = document.getElementById('update-new-dome-form').classList.contains('hidden');
 document.getElementById('update-new-dome-form').classList.toggle('hidden');
 if (willShow) refreshNewDomeAreaOptions();
 }

 // Kalau lagi mode split dengan 2 area Dome berbeda ikut aktif, tanyakan Dome baru ini
 // mau ditaruh di area yang mana -- dropdown ini cuma berisi area EFO/ETO yang sedang
 // relevan pada pilihan Tujuan saat itu, bukan semua area yang ada.
 function refreshNewDomeAreaOptions() {
 const val = document.getElementById('update-tujuan-select').value;
 const areas = val.includes('_') ? val.split('_') : [val];
 const domeAreas = areas.filter(a => a === 'ETO' || a === 'EFO');
 const areaSelect = document.getElementById('new-dome-target-area');
 areaSelect.innerHTML = domeAreas.map(a => `<option value="${a}">${a}</option>`).join('');
 }

 async function confirmNewDome() {
 const domeId = document.getElementById('new-dome-id-input').value.trim();
 const kapasitas = parseFloat(document.getElementById('new-dome-kapasitas-input').value);
 const area = document.getElementById('new-dome-target-area').value;
 const statusMsg = document.getElementById('update-tujuan-status-msg');

 if (!domeId || !kapasitas || kapasitas <= 0 || !area) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Fill in Dome ID and a valid capacity first.' : 'Isi ID Dome dan kapasitas yang valid dulu.';
  statusMsg.classList.remove('hidden');
  return;
 }

 try {
  const payload = buildAuthenticatedPayload({
  action: 'addDomeConfig',
  area: area,
  dome_id: domeId,
  kapasitas: kapasitas
  }, { developerOnly: true });
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();

  if (result.status === 'success') {
  domePickerListCache.push({ area: area, dome_id: domeId, kapasitas: kapasitas, status: 'Aktif', tonase_saat_ini: 0, ni_saat_ini: 0, sisa_ruang: kapasitas });
  // Refresh opsi Dome di portion yang area-nya cocok, supaya Dome baru langsung kelihatan.
  ['a', 'b'].forEach(prefix => {
   const label = document.getElementById(`split-${prefix}-label`);
   if (label && label.innerText === area) {
   loadDomeSelectOptions(document.getElementById(`split-${prefix}-dome`), area);
   }
  });
  document.getElementById('update-new-dome-form').classList.add('hidden');
  document.getElementById('new-dome-id-input').value = '';
  document.getElementById('new-dome-kapasitas-input').value = '';
  } else {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = result.message || (currentLang === 'en' ? 'Failed to create Dome.' : 'Gagal membuat Dome.');
  statusMsg.classList.remove('hidden');
  }
 } catch (err) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Failed to create Dome (connection issue).' : 'Gagal membuat Dome (masalah koneksi).';
  statusMsg.classList.remove('hidden');
 }
 }

 // Submit terpadu -- menangani 4 kasus: (1) Direct/Disposal (perilaku lama, tanpa Dome),
 // (2) 1 tujuan Dome/Tongkang tunggal, (3) split 2 tujuan. Kasus (2) & (3) sama-sama
 // lewat "portion", bedanya cuma portion B ada isinya atau tidak.
 async function fetchBargeShipmentData() {
 const listEl = document.getElementById('barge-shipment-list');
 listEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'Loading shipment data...' : 'Memuat data shipment...'}</p>`;
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=bargeshipment&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load shipment data.' : 'Gagal memuat data shipment'));
  globalBargeShipmentData = result.data || [];
  renderBargeShipmentList();
  computeReconciliationMatrix(); // F3/F4 butuh Total Plant (Tonase Aktual) dari data ini
  lucide.createIcons();
  markDataFresh_('Barging');
 } catch (err) {
  console.error('Gagal memuat data shipment:', err);
  markDataStale_('Barging');
  const isTimeout = err.name === 'AbortError';
  listEl.innerHTML = `<div class="text-center py-6"><p class="text-[11px] text-rose-400 font-medium mb-2">${isTimeout ? (currentLang === 'en' ? 'Server not responding (timeout).' : 'Server tidak merespons (timeout).') : (currentLang === 'en' ? 'Failed to load shipment data.' : 'Gagal memuat data shipment.')}</p><button onclick="fetchBargeShipmentData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer">${currentLang === 'en' ? 'Retry' : 'Coba Lagi'}</button></div>`;
 }
 }

 function renderBargeShipmentList() {
 const listEl = document.getElementById('barge-shipment-list');
 // DIBUAT DEFENSIF (Split 3 Dashboard, 23 Agu): elemen ini hidup di tab-barging, tidak
 // ada di dashboard Member. Fungsi ini dipanggil dari blok i18n dynamic-refresh bersama
 // beberapa render lain (Chat, RCA Log, dst) -- kalau throw di sini tanpa guard, SEMUA
 // render sesudahnya di blok yang sama ikut batal setiap kali Member ganti bahasa.
 if (!listEl) return;
 if (globalBargeShipmentData.length === 0) {
  listEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'No shipments yet.' : 'Belum ada shipment.'}</p>`;
  return;
 }

 listEl.innerHTML = globalBargeShipmentData.map(s => {
  const pct = Math.min(100, s.progress_percent || 0);
  const statusColors = {
  'loading': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'selesai': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'close': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  };
  const statusClass = statusColors[(s.status || '').toLowerCase()] || 'bg-slate-700/40 text-slate-400 border-slate-600/40';
  const noShipmentSafe = (s.no_shipment || '').toString().replace(/'/g, "\\'");
  return `<div onclick="openBargeDetailModal('${noShipmentSafe}')" class="glass-card p-3.5 rounded-xl cursor-pointer hover:border-blue-500/40 transition-all border border-slate-700/60">
   <div class="flex items-start justify-between gap-2 mb-2">
   <div>
    <p class="font-bold text-title text-xs">${s.no_shipment}</p>
    <p class="text-[11px] text-slate-400 font-medium">${s.nama_tug} / ${s.nama_barge} -- ${s.ore_type}</p>
   </div>
   <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusClass} whitespace-nowrap">${s.status || '-'}</span>
   </div>
   <div class="w-full bg-slate-700/40 rounded-full h-2 overflow-hidden mb-1.5">
   <div class="h-full bg-blue-500 rounded-full" style="width: ${pct}%"></div>
   </div>
   <div class="flex items-center justify-between text-[11px] text-slate-400 font-medium flex-wrap gap-1">
   <span>${(s.progress_ton || 0).toLocaleString()} / ${(s.plan_tonase || 0).toLocaleString()} ton (${pct.toFixed(1)}%)</span>
   ${s.tonase_aktual ? `<span class="text-emerald-400 font-semibold">${currentLang === 'en' ? 'Actual' : 'Aktual'}: ${Number(s.tonase_aktual).toLocaleString()} ton</span>` : ''}
   </div>
  </div>`;
 }).join('');
 }

 async function openBargeDetailModal(noShipment) {
 const shipment = globalBargeShipmentData.find(s => s.no_shipment === noShipment);
 if (!shipment) return;
 currentOpenBargeShipment = noShipment;

 document.getElementById('barge-detail-title').innerText = noShipment;
 document.getElementById('barge-detail-subtitle').innerText = `${shipment.nama_tug} / ${shipment.nama_barge} -- ${shipment.tanggal_mulai}`;
 document.getElementById('barge-detail-summary').innerHTML = `<p class="text-[11px] text-slate-500 col-span-full">${currentLang === 'en' ? 'Loading details...' : 'Memuat detail...'}</p>`;
 document.getElementById('barge-loading-log-table').innerHTML = '';
 document.getElementById('barge-shift-report-list').innerHTML = '';
 document.getElementById('barge-sublot-table').innerHTML = '';

 const canManage = canManageBarge();
 ['btn-open-form-loading-log', 'btn-open-form-shift-report', 'btn-open-form-sublot'].forEach(id => {
  const btn = document.getElementById(id);
  btn.classList.toggle('hidden', !canManage);
  btn.classList.toggle('flex', canManage);
 });

 const aktualForm = document.getElementById('barge-detail-aktual-form');
 aktualForm.classList.toggle('hidden', !canManage);
 document.getElementById('barge-aktual-tonase-input').value = shipment.tonase_aktual || '';
 document.getElementById('barge-aktual-status-msg').classList.add('hidden');

 const modal = document.getElementById('barge-detail-modal');
 showModalAnimated(modal);
 lucide.createIcons();

 try {
  const [llRes, srRes, slRes] = await Promise.all([
  fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=bargeloadinglog&t=' + new Date().getTime()).then(r => r.json()),
  fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=bargeshiftreport&t=' + new Date().getTime()).then(r => r.json()),
  fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=bargesublot&t=' + new Date().getTime()).then(r => r.json())
  ]);
  // v90.2.125 FIX (temuan audit -- race condition nyata): modal ini PERSISTEN (tidak
  // dihancurkan/dibangun ulang spt kartu Member), render function query DOM SEGAR
  // setelah await -- kalau user buka Shipment B sebelum fetch Shipment A selesai, response
  // A yg telat BENERAN bisa menimpa body modal yg judulnya sudah B. Guard ini buang hasil
  // basi kalau shipment yg sedang dibuka user sudah beda dari saat fetch ini dimulai.
  if (noShipment !== currentOpenBargeShipment) return;
  globalBargeLoadingLogData = llRes.status === 'success' ? (llRes.data || []) : [];
  globalBargeShiftReportData = srRes.status === 'success' ? (srRes.data || []) : [];
  globalBargeSublotData = slRes.status === 'success' ? (slRes.data || []) : [];

  renderBargeDetailSummary(shipment);
  renderBargeLoadingLogTable(noShipment);
  renderBargeShiftReportList(noShipment);
  renderBargeSublotTable(noShipment);
  lucide.createIcons();
 } catch (err) {
  if (noShipment !== currentOpenBargeShipment) return;
  console.error('Gagal memuat detail shipment:', err);
  document.getElementById('barge-detail-summary').innerHTML = `<p class="text-[11px] text-rose-400 col-span-full">${currentLang === 'en' ? 'Failed to load details.' : 'Gagal memuat detail.'}</p>`;
 }
 }

 function closeBargeDetailModal() {
 const modal = document.getElementById('barge-detail-modal');
 hideModalAnimated(modal);
 }

 function renderBargeDetailSummary(shipment) {
 const pct = Math.min(100, shipment.progress_percent || 0);
 const cards = [
  { label: currentLang === 'en' ? 'Plan Tonnage' : 'Plan Tonase', value: (shipment.plan_tonase || 0).toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton') },
  { label: currentLang === 'en' ? 'Progress' : 'Progress', value: (shipment.progress_ton || 0).toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton') + ' (' + pct.toFixed(1) + '%)' },
  { label: currentLang === 'en' ? 'Remaining' : 'Kekurangan', value: (shipment.kekurangan_ton || 0).toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton') },
  { label: currentLang === 'en' ? 'Actual (Draft Survey)' : 'Aktual (Draft Survey)', value: shipment.tonase_aktual ? Number(shipment.tonase_aktual).toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton') : '-' }
 ];
 document.getElementById('barge-detail-summary').innerHTML = cards.map(c => `
  <div class="bg-slate-900/40 border border-slate-700/60 rounded-xl p-3">
  <p class="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">${c.label}</p>
  <p class="text-sm font-bold text-title">${c.value}</p>
  </div>
 `).join('');
 }

 function renderBargeLoadingLogTable(noShipment) {
 const rows = globalBargeLoadingLogData.filter(l => l.no_shipment === noShipment);
 const tableEl = document.getElementById('barge-loading-log-table');
 if (rows.length === 0) {
  tableEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'No loading log yet.' : 'Belum ada loading log.'}</p>`;
  return;
 }
 const rowsHtml = rows.map(r => `
  <tr>
  <td class="p-2 text-slate-300 whitespace-nowrap">${r.tanggal} -- ${r.shift}</td>
  <td class="p-2 font-semibold text-title">${r.dome_id}</td>
  <td class="p-2 text-slate-400">${r.area}</td>
  <td class="p-2 text-center text-emerald-400">${(r.ni || 0).toFixed(2)}%</td>
  <td class="p-2 text-right">${r.rit}</td>
  <td class="p-2 text-right font-semibold text-title">${(r.tonase || 0).toLocaleString()}</td>
  <td class="p-2 text-center">${r.no_sublot || '-'}</td>
  <td class="p-2 text-center">${r.status}</td>
  </tr>
 `).join('');
 tableEl.innerHTML = `<table class="w-full text-[11px]">
  <thead><tr class="text-slate-500 border-b border-slate-700/50 text-left">
  <th class="p-2">${currentLang === 'en' ? 'Time' : 'Waktu'}</th>
  <th class="p-2">Dome</th>
  <th class="p-2">Area</th>
  <th class="p-2 text-center">Ni %</th>
  <th class="p-2 text-right">Rit</th>
  <th class="p-2 text-right">${currentLang === 'en' ? 'Tonnage' : 'Tonase'}</th>
  <th class="p-2 text-center">Sublot</th>
  <th class="p-2 text-center">Status</th>
  </tr></thead>
  <tbody class="divide-y divide-slate-800/50">${rowsHtml}</tbody>
 </table>`;
 }

 function renderBargeShiftReportList(noShipment) {
 const rows = globalBargeShiftReportData.filter(r => r.no_shipment === noShipment);
 const listEl = document.getElementById('barge-shift-report-list');
 if (rows.length === 0) {
  listEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'No shift report yet.' : 'Belum ada laporan shift.'}</p>`;
  return;
 }
 listEl.innerHTML = rows.map(r => `
  <div class="bg-slate-900/40 border border-slate-700/60 rounded-xl p-3">
  <div class="flex items-center justify-between mb-1 flex-wrap gap-1">
   <p class="font-semibold text-title text-[11px]">${r.tanggal} -- Shift ${r.shift} (${r.jam})</p>
   <span class="text-[10px] font-semibold ${r.status === 'Close' ? 'text-emerald-400' : 'text-blue-400'}">${r.status}</span>
  </div>
  <p class="text-[11px] text-slate-400 font-medium mb-1">${(r.progress_ton || 0).toLocaleString()} ton (${(r.progress_percent || 0).toFixed(1)}%) -- ${currentLang === 'en' ? 'remaining' : 'kekurangan'} ${(r.kekurangan_ton || 0).toLocaleString()} ton</p>
  ${r.catatan ? `<p class="text-[11px] text-slate-500">${r.catatan}</p>` : ''}
  </div>
 `).join('');
 }

 function renderBargeSublotTable(noShipment) {
 const rows = globalBargeSublotData.filter(r => r.no_shipment === noShipment);
 const tableEl = document.getElementById('barge-sublot-table');
 if (rows.length === 0) {
  tableEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'No sublot data yet.' : 'Belum ada data Sublot.'}</p>`;
  return;
 }
 // BARU (v90.2.124, temuan audit): pembeda "belum ada hasil lab" (null/undefined) vs
 // "hasil lab = 0" (angka 0 yg genuine) -- sebelumnya `|| 0` menyamarkan keduanya jadi
 // "0.00%"/"0.000" yg sama, padahal beda makna penting utk audit data geologi.
 const fmtOrDash_ = (val, decimals, suffix) => (val === null || val === undefined || val === '') ? '-' : Number(val).toFixed(decimals) + (suffix || '');
 const rowsHtml = rows.map(r => {
  const safeSublot = String(r.no_sublot || '').replace(/'/g, "\\'");
  const safeShipment = String(r.no_shipment || '').replace(/'/g, "\\'");
  return `
  <tr>
  <td class="p-2 font-semibold text-title">${r.no_sublot} <button type="button" onclick="openSublotRadarModal('${safeSublot}', '${safeShipment}')" title="${currentLang === 'en' ? 'Chemical Fingerprint' : 'Chemical Fingerprint'}" class="ml-1 inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 transition-all cursor-pointer align-middle"><i data-lucide="activity" class="w-2.5 h-2.5"></i></button></td>
  <td class="p-2 text-right">${r.tonase_plan === null || r.tonase_plan === undefined || r.tonase_plan === '' ? '-' : Number(r.tonase_plan).toLocaleString()}</td>
  <td class="p-2 text-center text-slate-300">${fmtOrDash_(r.ni_plan, 2, '%')}</td>
  <td class="p-2 text-right">${r.tonase_aktual === null || r.tonase_aktual === undefined || r.tonase_aktual === '' ? '-' : Number(r.tonase_aktual).toLocaleString()}</td>
  <td class="p-2 text-center text-emerald-400">${fmtOrDash_(r.ni_aktual, 2, '%')}</td>
  <td class="p-2 text-center ${Math.abs(r.disc_ni || 0) > 0.1 ? 'text-amber-400' : 'text-slate-300'}">${fmtOrDash_(r.disc_ni, 3)}</td>
  <td class="p-2 text-center ${Math.abs(r.disc_sio2_mgo || 0) > 0.2 ? 'text-amber-400' : 'text-slate-300'}">${fmtOrDash_(r.disc_sio2_mgo, 3)}</td>
  </tr>
 `;
 }).join('');
 tableEl.innerHTML = `<table class="w-full text-[11px]">
  <thead><tr class="text-slate-500 border-b border-slate-700/50 text-left">
  <th class="p-2">Sublot</th>
  <th class="p-2 text-right">${currentLang === 'en' ? 'Plan Ton' : 'Ton Plan'}</th>
  <th class="p-2 text-center">Ni Plan</th>
  <th class="p-2 text-right">${currentLang === 'en' ? 'Actual Ton' : 'Ton Aktual'}</th>
  <th class="p-2 text-center">Ni Aktual</th>
  <th class="p-2 text-center">DISC Ni</th>
  <th class="p-2 text-center">DISC SiO2/MgO</th>
  </tr></thead>
  <tbody class="divide-y divide-slate-800/50">${rowsHtml}</tbody>
 </table>`;
 lucide.createIcons();
 }

 // BARU (Sidequest #5): Radar Chart Chemical Fingerprint -- lihat komentar di HTML modal
 // #sublot-radar-modal utk alasan desain "% Aktual dari Plan" (bukan nilai mentah).
 // Chart di-destroy & dibuat ulang tiap modal dibuka (bukan pola persistent-chart spt chart
 // lain di dashboard ini) karena chart ini genuinely on-demand per baris Sublot yang diklik,
 // beda konteks tiap kali -- destroy-recreate adalah cara Chart.js resmi menghindari error
 // "Canvas is already in use" kalau canvas yang sama dipakai ulang.
 let sublotRadarChartInstance = null;
 function openSublotRadarModal(noSublot, noShipment) {
 const r = (globalBargeSublotData || []).find(x => x.no_sublot === noSublot && x.no_shipment === noShipment);
 if (!r) return;

 const elements = [
  { key: 'ni', label: 'Ni' },
  { key: 'fe', label: 'Fe' },
  { key: 'co', label: 'Co' },
  { key: 'mgo', label: 'MgO' },
  { key: 'sio2', label: 'SiO2' }
 ];
 const labels = elements.map(e => e.label);
 // Plan = 0 dianggap tidak punya acuan deviasi utk unsur itu -- default ratio 100 (netral)
 // supaya bentuk radar tidak "jebol" ke titik 0 hanya krn Plan-nya kebetulan kosong.
 // BARU (v90.2.124, temuan audit): 100 di sini murni penanda GEOMETRI radar (biar bentuk
 // tidak collapse), BUKAN berarti "tepat sasaran" -- titik itu akan PERSIS menimpa garis
 // putus-putus "Target (100%)" scr visual, gampang disalahartikan capaian sempurna padahal
 // sebenarnya tidak ada baseline sama sekali. `noPlanFlags` melacak elemen mana yg begini,
 // dipakai tooltip di bawah supaya hover menunjukkan "N/A (Plan belum ada)", bukan "100%".
 const noPlanFlags = elements.map(e => (parseFloat(r[e.key + '_plan']) || 0) <= 0);
 const ratios = elements.map(e => {
  const planVal = parseFloat(r[e.key + '_plan']) || 0;
  const aktualVal = parseFloat(r[e.key + '_aktual']) || 0;
  return planVal > 0 ? (aktualVal / planVal * 100) : 100;
 });
 const maxRatio = Math.max(100, ...ratios);
 const suggestedMax = Math.ceil((maxRatio + 10) / 10) * 10;

 document.getElementById('sublot-radar-subtitle').innerText = `-- ${r.no_sublot} (${r.no_shipment})`;

 const modal = document.getElementById('sublot-radar-modal');
 showModalAnimated(modal);
 lucide.createIcons();

 if (sublotRadarChartInstance) sublotRadarChartInstance.destroy();
 const ctx = document.getElementById('sublot-radar-canvas').getContext('2d');
 sublotRadarChartInstance = new Chart(ctx, {
  type: 'radar',
  data: {
  labels: labels,
  datasets: [
   {
   label: currentLang === 'en' ? 'Target (100%)' : 'Target (100%)',
   data: elements.map(() => 100),
   borderColor: 'rgba(148, 163, 184, 0.6)',
   backgroundColor: 'transparent',
   borderDash: [4, 4],
   borderWidth: 1.5,
   pointRadius: 0
   },
   {
   label: currentLang === 'en' ? 'Actual (% of Plan)' : 'Aktual (% Plan)',
   data: ratios,
   borderColor: 'rgb(34, 211, 238)',
   backgroundColor: 'rgba(34, 211, 238, 0.2)',
   borderWidth: 2,
   pointBackgroundColor: 'rgb(34, 211, 238)',
   pointRadius: 3
   }
  ]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
   r: {
   suggestedMin: 0,
   suggestedMax: suggestedMax,
   ticks: { color: 'rgba(148, 163, 184, 0.7)', backdropColor: 'transparent', font: { size: 9 } },
   grid: { color: 'rgba(100, 116, 139, 0.25)' },
   angleLines: { color: 'rgba(100, 116, 139, 0.25)' },
   pointLabels: { color: 'rgba(226, 232, 240, 0.9)', font: { size: 11, weight: 'bold' } }
   }
  },
  plugins: {
   legend: { position: 'bottom', labels: { color: 'rgba(226, 232, 240, 0.85)', font: { size: 10 }, boxWidth: 12 } },
   tooltip: {
   callbacks: {
    // BARU (v90.2.124): elemen tanpa Plan tampil "N/A (Plan belum ada)" di tooltip,
    // bukan "100%" yg bisa disalahartikan sbg capaian tepat sasaran.
    label: (ctxItem) => {
    if (ctxItem.datasetIndex === 1 && noPlanFlags[ctxItem.dataIndex]) {
     return `${ctxItem.dataset.label}: N/A (${currentLang === 'en' ? 'no Plan data' : 'Plan belum ada'})`;
    }
    return `${ctxItem.dataset.label}: ${ctxItem.formattedValue}%`;
    }
   }
   }
  }
  }
 });
 }
 function closeSublotRadarModal() {
 hideModalAnimated(document.getElementById('sublot-radar-modal'));
 }

 // ---- Form: Shipment Baru ----
 function openFormBargeShipmentPopup() {
 if (!canManageBarge()) {
  showNoticeModal(
  currentLang === 'en' ? 'Locked' : 'Terkunci',
  currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first.' : 'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu.'
  );
  return;
 }
 ['bs-no-shipment', 'bs-tanggal-mulai', 'bs-nama-tug', 'bs-nama-barge', 'bs-ore-type', 'bs-plan-tonase', 'bs-plan-rit'].forEach(id => document.getElementById(id).value = '');
 document.getElementById('bs-status-msg').classList.add('hidden');
 const modal = document.getElementById('form-barge-shipment-popup-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }
 function closeFormBargeShipmentPopup() {
 hideModalAnimated(document.getElementById('form-barge-shipment-popup-modal'));
 }
 async function submitBargeShipment() {
 const noShipment = document.getElementById('bs-no-shipment').value.trim();
 const tanggalMulai = document.getElementById('bs-tanggal-mulai').value;
 const namaTug = document.getElementById('bs-nama-tug').value.trim();
 const namaBarge = document.getElementById('bs-nama-barge').value.trim();
 const oreType = document.getElementById('bs-ore-type').value.trim();
 const planTonase = parseFloat(document.getElementById('bs-plan-tonase').value) || 0;
 const planRit = parseFloat(document.getElementById('bs-plan-rit').value) || 0;
 const statusMsg = document.getElementById('bs-status-msg');
 const submitBtn = document.getElementById('btn-submit-barge-shipment');
 const originalHtml = submitBtn.innerHTML;

 if (!noShipment || !tanggalMulai || !namaTug || !namaBarge || planTonase <= 0) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Fill in No Shipment, Start Date, Tug, Barge, and a valid Plan Tonnage.' : 'Isi No Shipment, Tanggal Mulai, Tug, Barge, dan Plan Tonase yang valid.';
  statusMsg.classList.remove('hidden');
  return;
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const payload = buildAuthenticatedPayload({
  action: 'addBargeShipment',
  no_shipment: noShipment,
  tanggal_mulai: tanggalMulai,
  nama_tug: namaTug,
  nama_barge: namaBarge,
  ore_type: oreType,
  plan_tonase: planTonase,
  plan_rit: planRit
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to create shipment.' : 'Gagal membuat shipment.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Created!' : 'Berhasil dibuat!';
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
  closeFormBargeShipmentPopup();
  statusMsg.classList.add('hidden');
  fetchBargeShipmentData();
  }, 900);
 } catch (error) {
  console.error('Error creating shipment:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error.message || (currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalHtml;
  lucide.createIcons();
 }
 }

 // ---- Form: Loading Log ----
 function openFormBargeLoadingLogPopup() {
 if (!canManageBarge()) {
  showNoticeModal(
  currentLang === 'en' ? 'Locked' : 'Terkunci',
  currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first.' : 'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu.'
  );
  return;
 }
 ['bl-tanggal', 'bl-ni', 'bl-fe', 'bl-co', 'bl-mgo', 'bl-sio2', 'bl-rit', 'bl-no-sublot'].forEach(id => document.getElementById(id).value = '');
 document.getElementById('bl-shift').value = '';
 document.getElementById('bl-area').value = '';
 document.getElementById('bl-tf').value = 27;
 document.getElementById('bl-dome-id').innerHTML = '<option value="">-</option>';
 document.getElementById('bl-tonase-preview').innerText = '';
 document.getElementById('bl-status-msg').classList.add('hidden');
 const modal = document.getElementById('form-barge-loadinglog-popup-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }
 function closeFormBargeLoadingLogPopup() {
 hideModalAnimated(document.getElementById('form-barge-loadinglog-popup-modal'));
 }
 function onBargeLoadingLogAreaChange() {
 const area = document.getElementById('bl-area').value;
 const domeSelect = document.getElementById('bl-dome-id');
 if (!area) { domeSelect.innerHTML = '<option value="">-</option>'; return; }
 loadDomeSelectOptions(domeSelect, area); // fungsi generik yang sudah ada dari fitur Dome
 }
 function updateBargeLoadingLogTonasePreview() {
 const rit = parseFloat(document.getElementById('bl-rit').value) || 0;
 const tf = parseFloat(document.getElementById('bl-tf').value) || 0;
 const preview = document.getElementById('bl-tonase-preview');
 preview.innerText = (rit > 0 && tf > 0) ? (currentLang === 'en' ? 'Tonnage: ' : 'Tonase: ') + (rit * tf).toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton') : '';
 }
 async function submitBargeLoadingLog() {
 if (!currentOpenBargeShipment) return;
 const tanggal = document.getElementById('bl-tanggal').value;
 const shift = document.getElementById('bl-shift').value;
 const area = document.getElementById('bl-area').value;
 const domeId = document.getElementById('bl-dome-id').value;
 const ni = parseFloat(document.getElementById('bl-ni').value) || 0;
 const fe = parseFloat(document.getElementById('bl-fe').value) || 0;
 const co = parseFloat(document.getElementById('bl-co').value) || 0;
 const mgo = parseFloat(document.getElementById('bl-mgo').value) || 0;
 const sio2 = parseFloat(document.getElementById('bl-sio2').value) || 0;
 const rit = parseFloat(document.getElementById('bl-rit').value) || 0;
 const tf = parseFloat(document.getElementById('bl-tf').value) || 0;
 const noSublot = document.getElementById('bl-no-sublot').value.trim();
 const statusMsg = document.getElementById('bl-status-msg');
 const submitBtn = document.getElementById('btn-submit-barge-loadinglog');
 const originalHtml = submitBtn.innerHTML;

 if (!tanggal || !shift || !area || !domeId || rit <= 0 || tf <= 0) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Fill in Date, Shift, Area, Dome, Rit, and TF.' : 'Isi Tanggal, Shift, Area, Dome, Rit, dan TF.';
  statusMsg.classList.remove('hidden');
  return;
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const payload = buildAuthenticatedPayload({
  action: 'addBargeLoadingLog',
  tanggal, shift, no_shipment: currentOpenBargeShipment, dome_id: domeId, area,
  ni, fe, co, mgo, sio2, rit, tf, no_sublot: noSublot
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save Loading Log.' : 'Gagal mencatat Loading Log.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Recorded!' : 'Berhasil dicatat!';
  statusMsg.classList.remove('hidden');
  setTimeout(async () => {
  closeFormBargeLoadingLogPopup();
  statusMsg.classList.add('hidden');
  await fetchBargeShipmentData();
  openBargeDetailModal(currentOpenBargeShipment);
  }, 900);
 } catch (error) {
  console.error('Error recording loading log:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error.message || (currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalHtml;
  lucide.createIcons();
 }
 }

 // ---- Form: Laporan Shift ----
 function openFormBargeShiftReportPopup() {
 if (!canManageBarge()) {
  showNoticeModal(
  currentLang === 'en' ? 'Locked' : 'Terkunci',
  currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first.' : 'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu.'
  );
  return;
 }
 ['sr-tanggal', 'sr-jam', 'sr-catatan'].forEach(id => document.getElementById(id).value = '');
 document.getElementById('sr-shift').value = '';
 document.getElementById('sr-status').value = 'Continue';
 document.getElementById('sr-status-msg').classList.add('hidden');
 const modal = document.getElementById('form-barge-shiftreport-popup-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }
 function closeFormBargeShiftReportPopup() {
 hideModalAnimated(document.getElementById('form-barge-shiftreport-popup-modal'));
 }
 async function submitBargeShiftReport() {
 if (!currentOpenBargeShipment) return;
 const tanggal = document.getElementById('sr-tanggal').value;
 const shift = document.getElementById('sr-shift').value;
 const jam = document.getElementById('sr-jam').value.trim();
 const status = document.getElementById('sr-status').value;
 const catatan = document.getElementById('sr-catatan').value.trim();
 const statusMsg = document.getElementById('sr-status-msg');
 const submitBtn = document.getElementById('btn-submit-barge-shiftreport');
 const originalHtml = submitBtn.innerHTML;

 if (!tanggal || !shift) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Fill in Date and Shift.' : 'Isi Tanggal dan Shift.';
  statusMsg.classList.remove('hidden');
  return;
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const payload = buildAuthenticatedPayload({
  action: 'addBargeShiftReport',
  tanggal, shift, jam, no_shipment: currentOpenBargeShipment, status, catatan
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save the shift report.' : 'Gagal mencatat laporan shift.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Recorded!' : 'Berhasil dicatat!';
  statusMsg.classList.remove('hidden');
  setTimeout(async () => {
  closeFormBargeShiftReportPopup();
  statusMsg.classList.add('hidden');
  await fetchBargeShipmentData();
  openBargeDetailModal(currentOpenBargeShipment);
  }, 900);
 } catch (error) {
  console.error('Error recording shift report:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error.message || (currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalHtml;
  lucide.createIcons();
 }
 }

 // ---- Form: Sublot Aktual ----
 function openFormBargeSublotPopup() {
 if (!canManageBarge()) {
  showNoticeModal(
  currentLang === 'en' ? 'Locked' : 'Terkunci',
  currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first.' : 'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu.'
  );
  return;
 }
 ['sl-no-sublot', 'sl-tonase-aktual', 'sl-ni-aktual', 'sl-fe-aktual', 'sl-co-aktual', 'sl-mgo-aktual', 'sl-sio2-aktual'].forEach(id => document.getElementById(id).value = '');
 document.getElementById('sl-status-msg').classList.add('hidden');
 const modal = document.getElementById('form-barge-sublot-popup-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }
 function closeFormBargeSublotPopup() {
 hideModalAnimated(document.getElementById('form-barge-sublot-popup-modal'));
 }
 async function submitBargeSublot() {
 if (!currentOpenBargeShipment) return;
 const noSublot = document.getElementById('sl-no-sublot').value.trim();
 const tonaseAktual = parseFloat(document.getElementById('sl-tonase-aktual').value) || 0;
 const niAktual = parseFloat(document.getElementById('sl-ni-aktual').value) || 0;
 const feAktual = parseFloat(document.getElementById('sl-fe-aktual').value) || 0;
 const coAktual = parseFloat(document.getElementById('sl-co-aktual').value) || 0;
 const mgoAktual = parseFloat(document.getElementById('sl-mgo-aktual').value) || 0;
 const sio2Aktual = parseFloat(document.getElementById('sl-sio2-aktual').value) || 0;
 const statusMsg = document.getElementById('sl-status-msg');
 const submitBtn = document.getElementById('btn-submit-barge-sublot');
 const originalHtml = submitBtn.innerHTML;

 if (!noSublot || tonaseAktual <= 0) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Fill in No Sublot and a valid Actual Tonnage.' : 'Isi No Sublot dan Tonase Aktual yang valid.';
  statusMsg.classList.remove('hidden');
  return;
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const payload = buildAuthenticatedPayload({
  action: 'addBargeSublotAktual',
  no_sublot: noSublot, no_shipment: currentOpenBargeShipment,
  tonase_aktual: tonaseAktual, ni_aktual: niAktual, fe_aktual: feAktual,
  co_aktual: coAktual, mgo_aktual: mgoAktual, sio2_aktual: sio2Aktual
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save Sublot data.' : 'Gagal menyimpan data Sublot.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Saved!' : 'Berhasil disimpan!';
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
  closeFormBargeSublotPopup();
  statusMsg.classList.add('hidden');
  openBargeDetailModal(currentOpenBargeShipment);
  }, 900);
 } catch (error) {
  console.error('Error saving sublot:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error.message || (currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalHtml;
  lucide.createIcons();
 }
 }

 // ---- Tonase Aktual (diisi langsung dari dalam Detail Modal, bukan popup terpisah) ----
 async function submitBargeAktual() {
 if (!currentOpenBargeShipment) return;
 const tonaseAktual = parseFloat(document.getElementById('barge-aktual-tonase-input').value);
 const statusMsg = document.getElementById('barge-aktual-status-msg');

 if (isNaN(tonaseAktual) || tonaseAktual <= 0) {
  statusMsg.className = 'text-[11px] text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Enter a valid tonnage.' : 'Isi tonase yang valid.';
  statusMsg.classList.remove('hidden');
  return;
 }

 try {
  const payload = buildAuthenticatedPayload({
  action: 'updateBargeShipmentAktual',
  no_shipment: currentOpenBargeShipment,
  tonase_aktual: tonaseAktual,
  status: 'Selesai'
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save Actual Tonnage.' : 'Gagal menyimpan Tonase Aktual.'));

  statusMsg.className = 'text-[11px] text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Saved! Status set to Selesai.' : 'Berhasil disimpan! Status diubah jadi Selesai.';
  statusMsg.classList.remove('hidden');
  setTimeout(async () => {
  statusMsg.classList.add('hidden');
  await fetchBargeShipmentData();
  openBargeDetailModal(currentOpenBargeShipment);
  }, 900);
 } catch (error) {
  console.error('Error saving tonase aktual:', error);
  statusMsg.className = 'text-[11px] text-rose-400';
  statusMsg.innerText = error.message || (currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.');
  statusMsg.classList.remove('hidden');
 }
 }

 // ============================================================
 // ============================================================
 // JSA_LOG -- rekam TTD & kehadiran toolbox JSA per member (self-service, TANPA devToken --
 // beda dari RCA/Dome/Barging yang INPUT-nya developer-only, sign-off JSA memang harus bisa
 // diisi semua member sendiri, bukan cuma Developer). Dipakai badge Compliance di KPI Member.
 // ============================================================

 // BARU (v90.2.110/111): badge pilar KPI di kartu KPI Member -- panggil endpoint kpiscore
 // SEKALI per member (periode = bulan berjalan), isi SEMUA badge pilar dari 1 response yg
 // sama. Fire-and-forget per kartu, tidak memblokir render grid member yang lain.
 // ============================================================
 // BARU (v90.2.117): Panel "Formula KPI" -- Developer-only. Simpan state bobot per mode
 // (A/B/C) di memori lokal supaya pindah dropdown tidak kehilangan draft yg belum disimpan
 // ke server dalam sesi yg sama.
 // ============================================================
 let kpiFormulaWeightsCache = { A: null, B: null, C: null };
 let kpiFormulaActiveOption = 'A';
