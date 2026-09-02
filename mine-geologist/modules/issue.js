// ============================================================
// ISSUE.JS -- (file baru, dibuat saat restorasi MG1)
// ============================================================



// ======= RESTORASI DARI BASELINE (fungsi hilang di MG1) =======

// [RESTORED from baseline/core.js] applyIssueFilter
 function applyIssueFilter() {
 renderIssueTable(globalIssueRawData);
 }

// [RESTORED from baseline/core.js] deleteAllIssues
async function deleteAllIssues() {
  if (!(await showConfirmModal(currentLang === 'en' ? 'Delete All Issue & Action' : 'Hapus Semua Issue & Action', currentLang === 'en' ? 'Delete ALL Issue & Action records?' : 'Hapus SEMUA record Issue & Action?'))) return;
  try { await postDeveloperAdmin('developerDeleteAllIssues',{}); await fetchIssueData(); }
  catch(e){ showNoticeModal(currentLang==='en'?'Cleanup Failed':'Cleanup Gagal',e.message); }
}

// [RESTORED from baseline/core.js] deleteIssueByRow
async function deleteIssueByRow(rowNumber) {
  if (!(await showConfirmModal(currentLang === 'en' ? 'Delete Issue & Action' : 'Hapus Issue & Action', currentLang === 'en' ? 'Delete this Issue & Action record?' : 'Hapus record Issue & Action ini?'))) return;
  try { await postDeveloperAdmin('developerDeleteIssue',{row_number:String(rowNumber)}); await fetchIssueData(); }
  catch(e){ showNoticeModal(currentLang==='en'?'Delete Failed':'Hapus Gagal',e.message); }
}

// [RESTORED from baseline/core.js] fetchIssueData
 async function fetchIssueData(isAutoRetry = false) {
 const tbody = document.getElementById('issue-table-body');
 if (!isAutoRetry) issueAutoRetryCount = 0;

 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=issue&t=' + new Date().getTime());
  const result = await response.json();

  if (result.status !== 'success') {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to load issue data.' : 'Gagal memuat data issue'));
  }

  globalIssueRawData = result.data || [];
  renderIssueTable(globalIssueRawData);
  issueAutoRetryCount = 0;
  markDataFresh_('Issue');
 } catch (err) {
  console.error('Gagal memuat data issue:', err);
  if (issueAutoRetryCount < ISSUE_MAX_AUTO_RETRY) {
  issueAutoRetryCount++;
  setTimeout(() => fetchIssueData(true), 2000 * issueAutoRetryCount);
  } else {
  markDataStale_('Issue');
  const isTimeout = err.name === 'AbortError';
  const msg = isTimeout ? (currentLang === 'en' ? 'Server did not respond within 20 seconds (timeout).' : 'Server tidak merespons dalam 20 detik (timeout).') : (currentLang === 'en' ? 'Failed to load issue data from Google Sheets.' : 'Gagal memuat data issue dari Google Sheets.');
  tbody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-rose-400 text-xs space-y-2 font-medium"><p>${msg}</p><button onclick="fetchIssueData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all">${translations[currentLang].retry}</button></td></tr>`;
  }
 }
 }

// [RESTORED from baseline/core.js] renderIssueTable
 function renderIssueTable(data) {
 const tbody = document.getElementById('issue-table-body');
 tbody.innerHTML = '';
 const statusFilter = document.getElementById('issue-status-filter') ? document.getElementById('issue-status-filter').value.toLowerCase() : '';

 let openCount = 0, progressCount = 0, resolvedCount = 0;
 let rowsRendered = 0;

 data.forEach(row => {
  const cleanRow = {};
  Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);

  const masalah = cleanRow['masalah'] || '';
  const lokasi = cleanRow['lokasi'] || '';
  if (!masalah && !lokasi) return;

  const status = (cleanRow['status'] || '').trim();
  const statusLower = status.toLowerCase();

  if (statusLower === 'open') openCount++;
  else if (statusLower === 'in progress' || statusLower === 'progress') progressCount++;
  else if (statusLower === 'close' || statusLower === 'closed' || statusLower === 'resolved') resolvedCount++;

  if (statusFilter) {
  if (statusFilter === 'open' && statusLower !== 'open') return;
  if (statusFilter === 'progress' && !statusLower.includes('progress')) return;
  if (statusFilter === 'close' && !statusLower.includes('close') && !statusLower.includes('resolved')) return;
  }

  rowsRendered++;
  const tanggal = cleanRow['tanggal'] || '-';
  const waktu = cleanRow['waktu'] || '-';

  const namaPelapor = cleanRow['pelapor'] || '-';
  const dampak = cleanRow['dampak'] || '-';
  const rekomendasi = cleanRow['rekomendasi'] || '-';
  const pic = cleanRow['pic'] || '-';
  const target = cleanRow['target'] || '-';

  let statusBadgeClass = 'bg-slate-700/30 text-slate-400 border-slate-600/30';
  if (statusLower === 'open') statusBadgeClass = 'bg-red-500/20 text-red-500 border-red-500/30';
  else if (statusLower === 'in progress' || statusLower === 'progress') statusBadgeClass = 'bg-amber-500/20 text-amber-500 border-amber-500/30';
  else if (statusLower === 'close' || statusLower === 'closed' || statusLower === 'resolved') statusBadgeClass = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';

  const tr = document.createElement('tr');
  tr.className = 'hover:bg-slate-800/20 transition-colors';
  tr.innerHTML = `
  <td class="p-3 text-slate-400">${tanggal} ${waktu !== '-' ? '<span class="text-slate-400 text-[10px] ml-1">(' + waktu + ')</span>' : ''}</td>
  <td class="p-3 text-slate-300 font-semibold">${namaPelapor}</td>
  <td class="p-3 font-semibold text-title">${lokasi || '-'}</td>
  <td class="p-3"><span class="px-2 py-0.5 rounded-md text-[11px] bg-red-500/20 text-red-500 border border-red-500/30 font-semibold">${masalah || '-'}</span></td>
  <td class="p-3 text-slate-300 font-medium">${dampak}</td>
  <td class="p-3 text-emerald-500 font-semibold">${rekomendasi}</td>
  <td class="p-3 text-slate-300 font-medium">${pic}</td>
  <td class="p-3 text-slate-300 font-medium">${target}</td>
  <td class="p-3 text-center"><span class="px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadgeClass}">${translateIssueStatus(status)}</span></td>
  <td class="p-3 text-center">${isDeveloperUnlocked() && row['_row'] ? `<button type="button" onclick="deleteIssueByRow(${row['_row']})" class="px-2 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 text-[10px] font-bold">Hapus</button>` : ''}</td>
  `;
  tbody.appendChild(tr);
 });

 if (rowsRendered === 0) {
  tbody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-slate-500 text-xs font-medium" data-i18n="issue_empty_filter">${translations[currentLang].issue_empty_filter}</td></tr>`;
 }

 document.getElementById('issue-count-open').innerText = openCount;
 document.getElementById('issue-count-progress').innerText = progressCount;
 document.getElementById('issue-count-resolved').innerText = resolvedCount;
 }

// [RESTORED from baseline/core.js] submitIssueForm
 async function submitIssueForm(event) {
 event.preventDefault();
 const form = document.getElementById('issueManagerForm');
 const submitBtn = document.getElementById('btn-submit-issue');
 const statusMsg = document.getElementById('issue-form-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;

 const lokasi = form.lokasi.value.trim();
 const masalah = form.masalah.value.trim();
 const dampak = form.dampak.value.trim();
 const rekomendasi = form.rekomendasi.value.trim();

 if (!lokasi || !masalah || !dampak || !rekomendasi) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Location, Issue, Impact, and Recommendation are required.' : 'Lokasi, Masalah, Dampak, dan Rekomendasi wajib diisi.';
  statusMsg.classList.remove('hidden');
  return;
 }

 const payload = buildAuthenticatedPayload(form);

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
  statusMsg.innerText = currentLang === 'en' ? 'Issue data successfully saved!' : 'Data issue berhasil disimpan!';
  statusMsg.classList.remove('hidden');
  form.reset();
  populateReporterDropdown();

  setTimeout(() => {
   closeFormIssuePopup();
   statusMsg.classList.add('hidden');
   fetchIssueData();
  }, 900);
  } else {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to save issue data.' : 'Gagal menyimpan data issue.'));
  }
 } catch (error) {
  console.error('Error submitting issue form:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error && error.message ? error.message : (currentLang === 'en' ? 'An error occurred while saving. Please try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }

// [RESTORED from baseline/core.js] translateIssueStatus
 function translateIssueStatus(status) {
 const s = String(status || '').trim().toLowerCase();
 if (currentLang === 'en') {
  if (s === 'open') return 'Open';
  if (s === 'in progress' || s === 'progress') return 'In Progress';
  if (s === 'close' || s === 'closed') return 'Closed';
  if (s === 'resolved') return 'Resolved';
 } else {
  if (s === 'open') return 'Terbuka';
  if (s === 'in progress' || s === 'progress') return 'Dalam Proses';
  if (s === 'close' || s === 'closed' || s === 'resolved') return 'Selesai';
 }
 return status || '-';
 }
