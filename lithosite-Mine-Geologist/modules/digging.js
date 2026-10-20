// ============================================================
// DIGGING.JS -- Tabel Digging, Form Input, Filter, Pagination
// ============================================================

// ============================================================
// STATE VARIABLES (KHUSUS DIGGING)
// ============================================================
let currentPageDiggingRows = [];

// ============================================================
// POPULATE PIT DROPDOWN
// ============================================================
function populatePitDropdown(data) {
  const pitSelect = document.getElementById('pit-filter');
  const currentVal = pitSelect.value;

  const pits = [];
  data.forEach(function(row) {
    const cleanRow = window.rawToCleanRow.get(row) || {};
    const pit = cleanRow['pit'] || cleanRow['area'] || null;
    if (pit && pits.indexOf(pit) === -1) pits.push(pit);
  });

  const defaultOptText = window.currentLang === 'en' ? 'All Pits' : 'Semua Pit';
  pitSelect.innerHTML = '<option value="">' + defaultOptText + '</option>';
  pits.forEach(function(pit) {
    const opt = document.createElement('option');
    opt.value = pit;
    opt.textContent = pit;
    pitSelect.appendChild(opt);
  });
  pitSelect.value = currentVal;

  const rekonPitSelect = document.getElementById('rekon-pit-filter');
  if (rekonPitSelect) {
    const rekonCurrentVal = rekonPitSelect.value;
    rekonPitSelect.innerHTML = '<option value="">' + defaultOptText + '</option>';
    pits.forEach(function(pit) {
      const opt = document.createElement('option');
      opt.value = pit;
      opt.textContent = pit;
      rekonPitSelect.appendChild(opt);
    });
    rekonPitSelect.value = rekonCurrentVal;
  }
}

// ============================================================
// APPLY GLOBAL FILTER (Search + Pit + Material)
// ============================================================
function handleSearchInput() {
  clearTimeout(window.searchDebounceTimer);
  window.searchDebounceTimer = setTimeout(function() {
    applyGlobalFilter();
  }, 350);
}

function applyGlobalFilter() {
  const selectedPit = document.getElementById('pit-filter').value.toLowerCase();
  const selectedMaterial = document.getElementById('material-filter').value.toLowerCase();
  const searchValue = document.getElementById('table-search') ? document.getElementById('table-search').value.toLowerCase() : '';

  const filteredData = window.globalRawData.filter(function(row) {
    const cleanRow = window.rawToCleanRow.get(row) || {};
    const pit = (cleanRow['pit'] || cleanRow['area'] || '').toLowerCase();
    const mat = (cleanRow['material'] || '').toLowerCase();

    const pitMatch = !selectedPit || pit.includes(selectedPit);
    const matMatch = !selectedMaterial || mat.includes(selectedMaterial);
    const textMatch = !searchValue || Object.values(cleanRow).some(function(v) {
      return v && v.toString().toLowerCase().includes(searchValue);
    });

    return pitMatch && matMatch && textMatch;
  });

  window.currentPage = 1;
  window.globalFilteredTableData = filteredData;
  renderTableData(filteredData);
  if (typeof updateDashboard === 'function') updateDashboard(filteredData);
}

// ============================================================
// RENDER TABLE DATA (Pagination)
// ============================================================
function renderTableData(data) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';
  window.globalFilteredTableData = data;
  currentPageDiggingRows = [];

  const total = data ? data.length : 0;

  if (!total) {
    tbody.innerHTML = '<tr><td colspan="17" class="text-center p-6 text-slate-500 font-medium">' +
      (window.currentLang === 'en' ? 'No data found.' : 'Tidak ada data yang ditemukan.') +
      '</td></tr>';
    document.getElementById('table-info').innerText = window.currentLang === 'en' ? 'Showing 0 data rows' : 'Menampilkan 0 baris data';
    updatePaginationControls(1, 1);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / window.ROWS_PER_PAGE));
  if (window.currentPage > totalPages) window.currentPage = totalPages;
  if (window.currentPage < 1) window.currentPage = 1;
  const start = (window.currentPage - 1) * window.ROWS_PER_PAGE;
  const end = Math.min(start + window.ROWS_PER_PAGE, total);
  const pageData = data.slice(start, end);

  pageData.forEach(function(row, i) {
    const cleanRow = {};
    Object.keys(row).forEach(function(k) {
      cleanRow[k.trim().toLowerCase()] = row[k];
    });

    const material = cleanRow['material'] || '';
    const tonaseRaw = cleanNumber(cleanRow['tonase']);
    if (!material && tonaseRaw === 0) return;

    const tanggal = cleanRow['tanggal'] || cleanRow['date'] || '-';
    const dayVal = cleanRow['shift'] || '-';
    const pelapor = cleanRow['pelapor'] || cleanRow['nama'] || '-';
    const pit = cleanRow['pit'] || cleanRow['area'] || '-';
    const blok = cleanRow['blok'] || cleanRow['id blok'] || cleanRow['idblok'] || cleanRow['id_blok'] || '-';
    const tonase = tonaseRaw;
    const ni = cleanRow['ni %'] || cleanRow['ni'] || '-';
    const fe = cleanRow['fe %'] || cleanRow['fe'] || '-';
    const co = cleanRow['co %'] || cleanRow['co'] || '-';
    const mgo = cleanRow['mgo %'] || cleanRow['mgo'] || '-';
    const sio2 = cleanRow['sio2 %'] || cleanRow['sio2'] || '-';
    const smRaw = cleanRow['sm %'] || cleanRow['sm'] || '-';
    const sm = typeof smRaw === 'number' ? smRaw.toFixed(2) : smRaw;
    const niNum = cleanNumber(ni);

    const cuaca = cleanRow['cuaca'] || '-';
    const waktuInput = cleanRow['waktu_input'] || cleanRow['waktu input'] || '-';
    const idSampel = cleanRow['id sampel'] || cleanRow['id_sampel'] || '-';
    const totalSampelDisplay = cleanRow['total sampel (karung)'] || cleanRow['total sampel'] || cleanRow['total_sampel'] || '-';
    const tujuan = cleanRow['tujuan'] || '-';
    const namaShip = cleanRow['nama ship'] || cleanRow['kapal'] || cleanRow['ship'] || '-';
    const idEfo = cleanRow['id efo'] || '-';
    const idEto = cleanRow['id eto'] || '-';
    const keterangan = cleanRow['keterangan'] || '-';

    const tipeOreRow = cleanRow['tipe_ore'] || cleanRow['tipe ore'] || '';
    const smForClassify = typeof sm === 'number' ? sm : parseFloat(sm);
    const classifyResult = classifyMaterial(niNum, tipeOreRow, smForClassify);
    const isPendingAssay = classifyResult.classGrade === 'N/A';
    const statusBadge = isPendingAssay ?
      '<span class="px-2 py-0.5 rounded-md text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>' +
      (window.currentLang === 'en' ? 'Awaiting Lab' : 'Menunggu Lab') + '</span>' :
      renderClassGradeBadge(classifyResult.classGrade);

    const tipeOreLabelMap = { 'Sapro': 'Saprolite', 'Limo': 'Limonite' };
    const tipeOreLabel = tipeOreLabelMap[classifyResult.tipeOreFinal] || classifyResult.tipeOreFinal;

    const rowIndex = currentPageDiggingRows.length;
    currentPageDiggingRows.push({
      tanggal, dayVal, pelapor, pit, blok, material, tonase, ni, fe, co, mgo, sio2, sm,
      cuaca, waktuInput, idSampel, tujuan, namaShip, idEfo, idEto, keterangan, totalSampelDisplay,
      classGrade: classifyResult.classGrade, tipeOreFinal: classifyResult.tipeOreFinal, tipeOreLabel,
      isPendingAssay
    });

    const niColorClass = getGradeTextClass(classifyResult.classGrade);

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/30 transition-colors cursor-pointer';
    tr.onclick = function() {
      if (typeof openDiggingDetailModal === 'function') openDiggingDetailModal(rowIndex);
    };
    tr.innerHTML = `
      <td class="p-3 text-slate-400">${start + i + 1}</td>
      <td class="p-3 text-slate-300">${tanggal}</td>
      <td class="p-3 text-blue-400 font-semibold">${dayVal}</td>
      <td class="p-3 text-slate-300">${pelapor}</td>
      <td class="p-3 font-semibold text-title">${pit}</td>
      <td class="p-3 font-medium text-title">${blok}</td>
      <td class="p-3 text-slate-300">${tipeOreLabel}</td>
      <td class="p-3 text-slate-300">${idSampel}</td>
      <td class="p-3 text-center text-slate-400">${totalSampelDisplay}</td>
      <td class="p-3 text-right font-bold text-title">${tonase.toLocaleString()}</td>
      <td class="p-3 text-center ${niColorClass} font-bold">${ni}</td>
      <td class="p-3 text-center text-slate-300">${fe}</td>
      <td class="p-3 text-center text-slate-300">${co}</td>
      <td class="p-3 text-center text-slate-300">${mgo}</td>
      <td class="p-3 text-center text-slate-300">${sio2}</td>
      <td class="p-3 text-center text-slate-300">${sm}</td>
      <td class="p-3 text-center">${statusBadge}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('table-info').innerText = window.currentLang === 'en' ?
    'Showing ' + (start + 1) + '-' + end + ' of ' + total + ' rows' :
    'Menampilkan ' + (start + 1) + '-' + end + ' dari ' + total + ' baris';
  updatePaginationControls(window.currentPage, totalPages);
}

function updatePaginationControls(page, totalPages) {
  const pageIndicator = document.getElementById('page-indicator');
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');
  if (!pageIndicator || !btnPrev || !btnNext) return;

  pageIndicator.innerText = page + ' / ' + totalPages;
  btnPrev.disabled = page <= 1;
  btnNext.disabled = page >= totalPages;
}

function prevPage() {
  if (window.currentPage > 1) {
    window.currentPage--;
    renderTableData(window.globalFilteredTableData);
  }
}

function nextPage() {
  const totalPages = Math.max(1, Math.ceil(window.globalFilteredTableData.length / window.ROWS_PER_PAGE));
  if (window.currentPage < totalPages) {
    window.currentPage++;
    renderTableData(window.globalFilteredTableData);
  }
}

// ============================================================
// FORM INPUT DIGGING
// ============================================================
function openFormDiggingPopup() {
  if (typeof populateReporterDropdown === 'function') populateReporterDropdown();
  const dateInput = document.querySelector('#diggingManagerForm input[name="tanggal"]');
  if (dateInput) {
    dateInput.value = typeof getLocalDateYyyyMmDd === 'function' ? getLocalDateYyyyMmDd() : '';
  }
  document.getElementById('digging-id-sampel-warning').classList.add('hidden');
  const modal = document.getElementById('form-digging-popup-modal');
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeFormDiggingPopup() {
  const modal = document.getElementById('form-digging-popup-modal');
  hideModalAnimated(modal);
}

function checkDuplicateIdSampel(value) {
  const warningEl = document.getElementById('digging-id-sampel-warning');
  if (!warningEl) return;
  const warningText = warningEl.querySelector('span');
  const trimmed = (value || '').trim();
  if (!trimmed) { warningEl.classList.add('hidden'); return; }

  const match = window.globalRawData.find(function(row) {
    const cleanRow = window.rawToCleanRow.get(row) || {};
    const existingId = (cleanRow['id sampel'] || cleanRow['id_sampel'] || '').toString().trim();
    return existingId && existingId.toLowerCase() === trimmed.toLowerCase();
  });

  if (match) {
    const cleanMatch = window.rawToCleanRow.get(match) || {};
    const tgl = (cleanMatch['tanggal'] || '-').toString().split(' ')[0];
    const pit = cleanMatch['pit'] || cleanMatch['area'] || '-';
    const material = cleanMatch['material'] || '-';
    warningText.innerText = window.currentLang === 'en' ?
      'This ID Sampel already exists (' + tgl + ', Pit ' + pit + ', ' + material + '). If this is an intentional resample, use a different code (e.g. add "R") and note it in Keterangan.' :
      'ID Sampel ini sudah pernah dipakai (' + tgl + ', Pit ' + pit + ', ' + material + '). Kalau ini re-sampling yang disengaja, pakai kode berbeda (misal tambah "R") dan catat di Keterangan.';
    warningEl.classList.remove('hidden');
  } else {
    warningEl.classList.add('hidden');
  }
}

function updateDiggingSM() {
  const mgo = parseFloat(document.querySelector('#diggingManagerForm input[name="mgo"]').value);
  const sio2 = parseFloat(document.querySelector('#diggingManagerForm input[name="sio2"]').value);
  const smInput = document.getElementById('digging-sm-input');
  if (!isNaN(mgo) && mgo > 0 && !isNaN(sio2)) {
    smInput.value = (sio2 / mgo).toFixed(2);
  } else {
    smInput.value = '';
  }
  updateDiggingTonaseAuto();
}

function updateDiggingTonaseAuto() {
  const totalSampelInput = document.getElementById('digging-total-sampel-input');
  const tonaseInput = document.getElementById('digging-tonase-input');
  if (!totalSampelInput || !tonaseInput) return;

  const totalSampel = parseFloat(totalSampelInput.value);
  const tipeOreSelected = document.getElementById('digging-tipe-ore-select').value;
  const smInput = document.getElementById('digging-sm-input');
  const smVal = smInput ? parseFloat(smInput.value) : NaN;

  if (isNaN(totalSampel) || totalSampel <= 0) {
    tonaseInput.value = '';
    return;
  }

  const cfg = window.globalCOGConfig || {
    Sapro: { WMT_per_Bucket: 2.2 }, Limo: { WMT_per_Bucket: 2.2 },
    Limo_Aktif: false, SM_Threshold_AutoDetect: 3, Bucket_per_Sampel: 8
  };
  let tipeOreFinal = tipeOreSelected;
  if (!cfg.Limo_Aktif) {
    tipeOreFinal = 'Sapro';
  } else if (tipeOreSelected === 'Auto') {
    tipeOreFinal = (!isNaN(smVal) && smVal >= (cfg.SM_Threshold_AutoDetect || 3)) ? 'Limo' : 'Sapro';
  } else if (tipeOreSelected !== 'Sapro' && tipeOreSelected !== 'Limo') {
    tipeOreFinal = 'Sapro';
  }

  const wmtPerBucket = (cfg[tipeOreFinal] && cfg[tipeOreFinal].WMT_per_Bucket) || 2.2;
  const bucketPerSampel = cfg.Bucket_per_Sampel || 8;
  const tonase = totalSampel * bucketPerSampel * wmtPerBucket;
  tonaseInput.value = tonase.toFixed(2);
}

function onDiggingTujuanChange() {
  const tujuan = document.getElementById('digging-tujuan-select').value;
  const shipWrapper = document.getElementById('digging-ship-wrapper');
  if (tujuan === 'Direct') {
    shipWrapper.classList.remove('hidden');
  } else {
    shipWrapper.classList.add('hidden');
    document.querySelector('#diggingManagerForm input[name="ship"]').value = '';
  }
}

async function submitDiggingForm(event) {
  event.preventDefault();
  const form = document.getElementById('diggingManagerForm');
  const submitBtn = document.getElementById('btn-submit-digging');
  const statusMsg = document.getElementById('digging-form-status-msg');
  const originalBtnHtml = submitBtn.innerHTML;

  const tanggal = form.tanggal.value;
  const pit = form.pit.value.trim();
  const blok = form.blok.value.trim();
  const tonase = form.tonase.value;
  const totalSampel = form.total_sampel.value;
  const idSampelVal = form.id_sampel.value.trim();

  if (!tanggal || !pit || !blok || !totalSampel || !tonase || !idSampelVal) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Date, Pit, Block, Total Samples, and Sample ID are required.' :
      'Tanggal, Pit, Blok, Total Sampel, dan ID Sampel wajib diisi.';
    statusMsg.classList.remove('hidden');
    return;
  }

  const payload = buildAuthenticatedPayload(form);

  const niRawInput = form.ni.value.trim();
  if (!niRawInput) {
    payload.set('material', 'Menunggu Assay');
    payload.set('tipe_ore', form.tipe_ore.value === 'Auto' ? 'Sapro' : form.tipe_ore.value);
  } else {
    const niForClassify = parseFloat(niRawInput) || 0;
    const smForClassify = parseFloat(form.sm.value) || 0;
    const tipeOreSelected = form.tipe_ore.value;
    const classifyResultForm = classifyMaterial(niForClassify, tipeOreSelected, smForClassify);
    payload.set('material', classifyResultForm.classGrade);
    payload.set('tipe_ore', classifyResultForm.tipeOreFinal);
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' +
    (window.currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');

  try {
    const response = await fetch(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
    const result = await response.json();

    if (result.status === 'success') {
      statusMsg.className = 'text-xs text-emerald-400';
      statusMsg.innerText = result.auto_route ?
        ((window.currentLang === 'en' ? 'Production data saved -- ' : 'Data produksi berhasil disimpan -- ') + result.auto_route) :
        (window.currentLang === 'en' ? 'Production data saved!' : 'Data produksi berhasil disimpan!');
      statusMsg.classList.remove('hidden');
      form.reset();
      if (typeof populateReporterDropdown === 'function') populateReporterDropdown();
      document.getElementById('digging-id-sampel-warning').classList.add('hidden');
      document.getElementById('digging-ship-wrapper').classList.add('hidden');

      setTimeout(function() {
        closeFormDiggingPopup();
        statusMsg.classList.add('hidden');
        if (typeof fetchDataFromGoogleSheets === 'function') fetchDataFromGoogleSheets(true);
      }, 900);
    } else {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to save production data.' : 'Gagal menyimpan data produksi.'));
    }
  } catch (error) {
    console.error('Error submitting digging form:', error);
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = error && error.message ? error.message :
      (window.currentLang === 'en' ? 'An error occurred while saving. Try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
    statusMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

// ============================================================
// DETAIL DIGGING MODAL
// ============================================================
function openDiggingDetailModal(rowIndex) {
  const row = currentPageDiggingRows[rowIndex];
  if (!row) return;
  window.currentOpenDiggingRow = row;

  document.getElementById('digging-detail-subtitle').innerText = row.tanggal + ' -- ' + row.pit + ' / ' + row.blok + ' -- ' +
    row.classGrade + ' (' + row.tipeOreLabel + ')';
  document.getElementById('digging-detail-waktu-input').innerText = row.waktuInput;
  document.getElementById('digging-detail-cuaca').innerText = row.cuaca;
  document.getElementById('digging-detail-sampel').innerText = row.idSampel;
  document.getElementById('digging-detail-ship').innerText = row.namaShip;
  document.getElementById('digging-detail-pelapor').innerText = row.pelapor;
  document.getElementById('digging-detail-ni').innerText = row.ni;
  document.getElementById('digging-detail-fe').innerText = row.fe;
  document.getElementById('digging-detail-co').innerText = row.co;
  document.getElementById('digging-detail-mgo').innerText = row.mgo;
  document.getElementById('digging-detail-sio2').innerText = row.sio2;
  document.getElementById('digging-detail-tonase').innerText = row.tonase.toLocaleString();
  document.getElementById('digging-detail-total-sampel').innerText = row.totalSampelDisplay;
  document.getElementById('digging-detail-id-efo').innerText = row.idEfo;
  document.getElementById('digging-detail-id-eto').innerText = row.idEto;
  document.getElementById('digging-detail-keterangan').innerText = row.keterangan;

  const tujuanEl = document.getElementById('digging-detail-tujuan');
  const tujuanColors = { 'efo': 'text-blue-400', 'eto': 'text-emerald-400', 'direct': 'text-amber-400' };
  tujuanEl.innerText = row.tujuan;
  tujuanEl.className = 'font-semibold text-xs ' + (tujuanColors[row.tujuan.toLowerCase()] || 'text-title');

  const hasDomeLink = (row.idEfo && row.idEfo !== '-') || (row.idEto && row.idEto !== '-');
  const btnDomeHistory = document.getElementById('btn-open-dome-history');
  if (btnDomeHistory) {
    btnDomeHistory.classList.toggle('hidden', !(hasDomeLink && typeof canViewDomeHistory === 'function' && canViewDomeHistory()));
  }

  const btnUpdateAssay = document.getElementById('btn-open-update-assay');
  if (btnUpdateAssay) btnUpdateAssay.classList.toggle('hidden', !row.isPendingAssay);

  const modal = document.getElementById('digging-detail-modal');
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeDiggingDetailModal() {
  const modal = document.getElementById('digging-detail-modal');
  hideModalAnimated(modal);
}

// ============================================================
// EXPOSE FUNCTIONS KE GLOBAL WINDOW
// ============================================================
window.populatePitDropdown = populatePitDropdown;
window.handleSearchInput = handleSearchInput;
window.applyGlobalFilter = applyGlobalFilter;
window.renderTableData = renderTableData;
window.updatePaginationControls = updatePaginationControls;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.openFormDiggingPopup = openFormDiggingPopup;
window.closeFormDiggingPopup = closeFormDiggingPopup;
window.checkDuplicateIdSampel = checkDuplicateIdSampel;
window.updateDiggingSM = updateDiggingSM;
window.updateDiggingTonaseAuto = updateDiggingTonaseAuto;
window.onDiggingTujuanChange = onDiggingTujuanChange;
window.submitDiggingForm = submitDiggingForm;
window.openDiggingDetailModal = openDiggingDetailModal;
window.closeDiggingDetailModal = closeDiggingDetailModal;

// ======= RESTORASI DARI BASELINE (fungsi hilang di MG1) =======

// [RESTORED from baseline/core.js] closeTujuanHistoryModal
 function closeTujuanHistoryModal() {
 const modal = document.getElementById('tujuan-history-modal');
 hideModalAnimated(modal);
 }

// [RESTORED from baseline/core.js] closeUpdateAssayModal
 function closeUpdateAssayModal() {
 const modal = document.getElementById('update-assay-modal');
 hideModalAnimated(modal);
 }

// [RESTORED from baseline/core.js] closeUpdateTujuanModal
 function closeUpdateTujuanModal() {
 const modal = document.getElementById('update-tujuan-modal');
 hideModalAnimated(modal);
 }

// [RESTORED from baseline/core.js] onTujuanKombinasiChange
 function onTujuanKombinasiChange() {
 const val = document.getElementById('update-tujuan-select').value;
 const portionsWrapper = document.getElementById('update-portions-wrapper');
 const portionA = document.getElementById('update-split-portion-a');
 const portionB = document.getElementById('update-split-portion-b');

 document.getElementById('split-a-tonase').value = '';
 document.getElementById('split-b-tonase').value = '';
 document.getElementById('split-a-catatan').value = '';
 document.getElementById('split-b-catatan').value = '';
 document.getElementById('update-new-dome-form').classList.add('hidden');
 document.getElementById('update-split-total-info').innerText = '';

 const domeAreas = ['ETO', 'EFO', 'TONGKANG'];
 const isDomeRelated = domeAreas.includes(val) || val.includes('_');

 portionsWrapper.classList.toggle('hidden', !isDomeRelated);
 document.getElementById('btn-toggle-new-dome').classList.toggle('hidden', !isDomeRelated);

 if (!isDomeRelated) {
  portionA.classList.add('hidden');
  portionB.classList.add('hidden');
  return;
 }

 if (val.includes('_')) {
  const [areaA, areaB] = val.split('_');
  setupSplitPortion('a', areaA);
  setupSplitPortion('b', areaB);
 } else {
  setupSplitPortion('a', val);
  portionB.classList.add('hidden');
  const row = currentOpenDiggingRow;
  document.getElementById('split-a-tonase').value = row ? row.tonase : '';
 }
 updateSplitTotalInfo();
 refreshNewDomeAreaOptions();
 }

// [RESTORED from baseline/core.js] onUpdateAssayTujuanChange
 function onUpdateAssayTujuanChange() {
 const tujuan = document.getElementById('update-assay-tujuan').value;
 const shipWrapper = document.getElementById('update-assay-ship-wrapper');
 if (tujuan === 'Direct') {
  shipWrapper.classList.remove('hidden');
 } else {
  shipWrapper.classList.add('hidden');
  document.getElementById('update-assay-ship').value = '';
 }
 }

// [RESTORED from baseline/core.js] openTujuanHistoryModal
 async function openTujuanHistoryModal() {
 const row = currentOpenDiggingRow;
 if (!row) return;

 document.getElementById('tujuan-history-subtitle').innerText = `ID Sampel: ${row.idSampel}`;
 const bodyEl = document.getElementById('tujuan-history-body');
 bodyEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'Loading history...' : 'Memuat riwayat...'}</p>`;

 const modal = document.getElementById('tujuan-history-modal');
 showModalAnimated(modal);
 lucide.createIcons();

 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=tujuanchangelog&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load Destination history.' : 'Gagal memuat riwayat Tujuan'));

  const logsForRow = (result.data || []).filter(l => (l.id_sampel || '').toString().trim() === row.idSampel);
  if (logsForRow.length === 0) {
  bodyEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'No destination changes recorded yet for this row.' : 'Belum ada perubahan Tujuan tercatat untuk baris ini.'}</p>`;
  return;
  }

  bodyEl.innerHTML = logsForRow.map(l => `
  <div class="bg-slate-900/40 border border-slate-700/60 rounded-xl p-3">
   <div class="flex items-center justify-between mb-1.5">
   <span class="text-[11px] text-slate-400 font-medium">${l.tanggal || '-'}</span>
   <span class="text-[11px] font-semibold text-amber-400">PIC: ${l.pic || '-'}</span>
   </div>
   <div class="text-xs text-title font-semibold mb-1">
   ${l.tujuan_lama || '-'} <i data-lucide="arrow-right" class="w-3 h-3 inline-block mx-1"></i> ${l.tujuan_baru || '-'}
   </div>
   ${(l.id_efo_lama || l.id_efo_baru) ? `<p class="text-[11px] text-slate-400">ID EFO: ${l.id_efo_lama || '-'} <i data-lucide="arrow-right" class="w-2.5 h-2.5 inline-block mx-1"></i> ${l.id_efo_baru || '-'}</p>` : ''}
   ${(l.id_eto_lama || l.id_eto_baru) ? `<p class="text-[11px] text-slate-400">ID ETO: ${l.id_eto_lama || '-'} <i data-lucide="arrow-right" class="w-2.5 h-2.5 inline-block mx-1"></i> ${l.id_eto_baru || '-'}</p>` : ''}
   ${l.keterangan ? `<p class="text-[11px] text-slate-500 mt-1">${l.keterangan}</p>` : ''}
  </div>
  `).join('');
  lucide.createIcons();
 } catch (err) {
  console.error('Gagal memuat riwayat Tujuan:', err);
  const isTimeout = err.name === 'AbortError';
  bodyEl.innerHTML = `<p class="text-[11px] text-rose-400 font-medium">${isTimeout ? (currentLang === 'en' ? 'Server not responding (timeout).' : 'Server tidak merespons (timeout).') : (currentLang === 'en' ? 'Failed to load Destination history.' : 'Gagal memuat riwayat Tujuan.')}</p>`;
 }
 }

// [RESTORED from baseline/core.js] openUpdateAssayModal
 function openUpdateAssayModal() {
 const row = currentOpenDiggingRow;
 if (!row) return;

 if (!row.idSampel || row.idSampel === '-') {
  showNoticeModal(
  currentLang === 'en' ? 'No Sample ID' : 'ID Sampel Kosong',
  currentLang === 'en' ? 'This record has no ID Sampel, so it cannot be reliably tracked or updated.' : 'Baris ini tidak punya ID Sampel, jadi tidak bisa dilacak/diupdate dengan aman.'
  );
  return;
 }

 document.getElementById('update-assay-subtitle').innerText = `${row.tanggal} -- ${row.pit} / ${row.blok} -- ${row.idSampel}`;
 document.getElementById('update-assay-ni').value = '';
 document.getElementById('update-assay-fe').value = '';
 document.getElementById('update-assay-co').value = '';
 document.getElementById('update-assay-mgo').value = '';
 document.getElementById('update-assay-sio2').value = '';
 document.getElementById('update-assay-tipe-ore').value = 'Sapro';

 // Tujuan cuma ditawarkan di sini kalau baris ini BELUM pernah punya Tujuan --
 // kalau sudah ada (mis. sudah EFO ke Dome tertentu), ganti Tujuan/Dome tetap lewat
 // modal "Update Tujuan & ID Pengapalan" yang sudah ada, bukan dobel jalur di sini.
 const belumAdaTujuan = !row.tujuan || row.tujuan === '-';
 const tujuanWrapper = document.getElementById('update-assay-tujuan-wrapper');
 tujuanWrapper.classList.toggle('hidden', !belumAdaTujuan);
 document.getElementById('update-assay-tujuan').value = '';
 document.getElementById('update-assay-ship-wrapper').classList.add('hidden');
 document.getElementById('update-assay-ship').value = '';

 document.getElementById('update-assay-status-msg').classList.add('hidden');

 const modal = document.getElementById('update-assay-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

// [RESTORED from baseline/core.js] openUpdateTujuanModal
 function openUpdateTujuanModal() {
 const row = currentOpenDiggingRow;
 if (!row) return;

 if (!canAssignDome()) {
  showNoticeModal(
  currentLang === 'en' ? 'Locked' : 'Terkunci',
  currentLang === 'en' ? 'Log in as Developer or Supervisor first to update Destination & Dome assignment.' : 'Login sebagai Developer atau Supervisor terlebih dahulu untuk mengubah Tujuan & assign Dome.'
  );
  return;
 }

 if (!row.idSampel || row.idSampel === '-') {
  showNoticeModal(
  currentLang === 'en' ? 'No Sample ID' : 'ID Sampel Kosong',
  currentLang === 'en' ? 'This record has no ID Sampel, so it cannot be reliably tracked or updated. Please fill in the ID Sampel first when reporting.' : 'Baris ini tidak punya ID Sampel, jadi tidak bisa dilacak/diupdate dengan aman. Mohon isi ID Sampel dulu saat pelaporan.'
  );
  return;
 }

 document.getElementById('update-tujuan-subtitle').innerText = `${row.tanggal} -- ${row.pit} / ${row.blok}`;
 document.getElementById('update-tujuan-id-sampel').value = row.idSampel;
 document.getElementById('update-tujuan-row-ni').value = (row.ni && row.ni !== '-') ? row.ni + '%' : '-';
 // Baris lama kadang punya nilai Tujuan yang sekarang cuma opsi tunggal (EFO/ETO/Direct/Disposal)
 // -- opsi gabungan/Tongkang tidak bisa dipulihkan otomatis dari data lama, biarkan kosong.
 const oldTujuan = (row.tujuan && row.tujuan !== '-') ? row.tujuan : '';
 const validSingleValues = ['Direct', 'Disposal', 'ETO', 'EFO'];
 document.getElementById('update-tujuan-select').value = validSingleValues.includes(oldTujuan) ? oldTujuan : '';
 document.getElementById('update-tujuan-keterangan').value = (row.keterangan && row.keterangan !== '-') ? row.keterangan : '';
 document.getElementById('update-new-dome-form').classList.add('hidden');
 document.getElementById('new-dome-id-input').value = '';
 document.getElementById('new-dome-kapasitas-input').value = '';
 populateNameOptions(document.getElementById('update-tujuan-pic'));
 domePickerListCache = []; // paksa ambil ulang stok Dome terkini tiap popup dibuka
 onTujuanKombinasiChange();
 document.getElementById('update-tujuan-status-msg').classList.add('hidden');

 const modal = document.getElementById('update-tujuan-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

// [RESTORED from baseline/core.js] setupSplitPortion
 function setupSplitPortion(prefix, area) {
 const label = document.getElementById(`split-${prefix}-label`);
 const domeSelect = document.getElementById(`split-${prefix}-dome`);
 const catatanInput = document.getElementById(`split-${prefix}-catatan`);
 const isTongkang = (area === 'TONGKANG');

 label.innerText = isTongkang ? (currentLang === 'en' ? 'Barge (no Dome)' : 'Tongkang (tanpa Dome)') : area;
 domeSelect.classList.toggle('hidden', isTongkang);
 catatanInput.classList.toggle('hidden', !isTongkang);
 document.getElementById(`update-split-portion-${prefix}`).classList.remove('hidden');

 if (!isTongkang) {
  loadDomeSelectOptions(domeSelect, area);
 }
 }

// [RESTORED from baseline/core.js] submitUpdateAssay
 async function submitUpdateAssay() {
 const row = currentOpenDiggingRow;
 if (!row) return;
 const submitBtn = document.getElementById('btn-submit-update-assay');
 const statusMsg = document.getElementById('update-assay-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;

 const niVal = document.getElementById('update-assay-ni').value.trim();
 const feVal = document.getElementById('update-assay-fe').value.trim();
 const coVal = document.getElementById('update-assay-co').value.trim();
 const mgoVal = document.getElementById('update-assay-mgo').value.trim();
 const sio2Val = document.getElementById('update-assay-sio2').value.trim();
 const tipeOreVal = document.getElementById('update-assay-tipe-ore').value;
 const tujuanVal = document.getElementById('update-assay-tujuan-wrapper').classList.contains('hidden')
  ? '' : document.getElementById('update-assay-tujuan').value;
 const shipVal = document.getElementById('update-assay-ship').value.trim();

 if (!niVal) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Ni % is required to save assay results.' : 'Ni % wajib diisi untuk menyimpan hasil assay.';
  statusMsg.classList.remove('hidden');
  return;
 }

 // Material dihitung ulang di sini juga (client-side), SAMA PERSIS pola submitDiggingForm --
 // supaya kolom Material konsisten dgn cara dashboard menghitung di tempat lain.
 const smComputed = (parseFloat(mgoVal) > 0) ? (parseFloat(sio2Val) / parseFloat(mgoVal)) : 0;
 const classifyResultAssay = classifyMaterial(parseFloat(niVal) || 0, tipeOreVal, smComputed);

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const payload = buildAuthenticatedPayload({
  action: 'updateAssayResult',
  id_sampel: row.idSampel,
  ni: niVal, fe: feVal, co: coVal, mgo: mgoVal, sio2: sio2Val,
  sm: smComputed ? smComputed.toFixed(2) : '',
  material: classifyResultAssay.classGrade,
  tipe_ore: classifyResultAssay.tipeOreFinal,
  tujuan: tujuanVal,
  ship: tujuanVal === 'Direct' ? shipVal : ''
  });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save assay results.' : 'Gagal menyimpan hasil assay.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = result.auto_route ? ((currentLang === 'en' ? 'Saved -- ' : 'Tersimpan -- ') + result.auto_route) : (currentLang === 'en' ? 'Assay results saved!' : 'Hasil assay berhasil disimpan!');
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
  closeUpdateAssayModal();
  closeDiggingDetailModal();
  statusMsg.classList.add('hidden');
  fetchDataFromGoogleSheets(true);
  }, 900);
 } catch (error) {
  console.error('Error updating assay result:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error && error.message ? error.message : (currentLang === 'en' ? 'An error occurred. Try again.' : 'Terjadi kesalahan. Coba lagi.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }

// [RESTORED from baseline/core.js] submitUpdateTujuan
 async function submitUpdateTujuan() {
 const idSampel = document.getElementById('update-tujuan-id-sampel').value;
 const val = document.getElementById('update-tujuan-select').value;
 const pic = document.getElementById('update-tujuan-pic').value;
 const keteranganUser = document.getElementById('update-tujuan-keterangan').value.trim();
 const submitBtn = document.getElementById('btn-submit-update-tujuan');
 const statusMsg = document.getElementById('update-tujuan-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;
 const row = currentOpenDiggingRow;

 if (!val) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Please select a Destination first.' : 'Pilih Tujuan terlebih dahulu.';
  statusMsg.classList.remove('hidden');
  return;
 }

 // Kasus (1): Direct/Disposal -- tidak terkait Dome sama sekali, perilaku lama.
 if (val === 'Direct' || val === 'Disposal') {
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');
  try {
  const payload = buildAuthenticatedPayload({
   action: 'updateDiggingIds',
   id_sampel: idSampel,
   tujuan: val,
   id_efo: '',
   id_eto: '',
   pic: pic,
   keterangan: keteranganUser
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to update data.' : 'Gagal mengupdate data.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Updated!' : 'Berhasil diupdate!';
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
   closeUpdateTujuanModal();
   closeDiggingDetailModal();
   statusMsg.classList.add('hidden');
   fetchDataFromGoogleSheets(true);
  }, 900);
  } catch (error) {
  console.error('Error updating tujuan:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'An error occurred. Try again.' : 'Terjadi kesalahan. Coba lagi.';
  statusMsg.classList.remove('hidden');
  } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
  }
  return;
 }

 // Kasus (2) & (3): tujuan Dome/Tongkang, tunggal atau split.
 const isCombo = val.includes('_');
 const [areaA, areaB] = isCombo ? val.split('_') : [val, null];
 const tonaseA = parseFloat(document.getElementById('split-a-tonase').value) || 0;
 const tonaseB = isCombo ? (parseFloat(document.getElementById('split-b-tonase').value) || 0) : 0;
 const total = tonaseA + tonaseB;

 if (tonaseA <= 0 || (isCombo && tonaseB <= 0)) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Fill in the tonnage (must be greater than 0).' : 'Isi tonase (harus lebih dari 0).';
  statusMsg.classList.remove('hidden');
  return;
 }

 if (row && Math.abs(total - row.tonase) >= 0.01) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en'
  ? 'Total tonnage must exactly match this row (' + row.tonase.toLocaleString() + ' ton).'
  : 'Total tonase harus pas persis dengan baris ini (' + row.tonase.toLocaleString() + ' ton).';
  statusMsg.classList.remove('hidden');
  return;
 }

 const domeA = document.getElementById('split-a-dome').value;
 const domeB = isCombo ? document.getElementById('split-b-dome').value : '';
 const catatanA = document.getElementById('split-a-catatan').value.trim();
 const catatanB = isCombo ? document.getElementById('split-b-catatan').value.trim() : '';

 if (areaA !== 'TONGKANG' && !domeA) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = (currentLang === 'en' ? 'Please select a Dome for the ' : 'Pilih Dome untuk bagian ') + areaA + (currentLang === 'en' ? ' portion.' : '.');
  statusMsg.classList.remove('hidden');
  return;
 }
 if (isCombo && areaB !== 'TONGKANG' && !domeB) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = (currentLang === 'en' ? 'Please select a Dome for the ' : 'Pilih Dome untuk bagian ') + areaB + (currentLang === 'en' ? ' portion.' : '.');
  statusMsg.classList.remove('hidden');
  return;
 }
 if (!pic) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Please select a PIC first.' : 'Pilih PIC terlebih dahulu.';
  statusMsg.classList.remove('hidden');
  return;
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 const tujuanFinal = isCombo ? 'Split' : areaA;
 const keteranganFinal = isCombo
  ? ('Split: '
   + `${tonaseA.toLocaleString()} ton -> ${areaA}${domeA ? '/' + domeA : ''}${catatanA ? ' (' + catatanA + ')' : ''}`
   + ', '
   + `${tonaseB.toLocaleString()} ton -> ${areaB}${domeB ? '/' + domeB : ''}${catatanB ? ' (' + catatanB + ')' : ''}`
   + (keteranganUser ? ' -- ' + keteranganUser : ''))
  : keteranganUser;

 try {
  // v90.2.130 FIX (temuan audit #39 -- data-integrity risk): SEBELUMNYA 2 panggilan
  // terpisah (updateDiggingIds sukses dulu, BARU loop addDomeTransaction) -- kalau
  // Tujuan sukses tapi Dome gagal di tengah, data tersangkut PARSIAL tanpa rollback.
  // Sekarang 1 panggilan ke endpoint gabungan 'updateDiggingIdsWithDome' -- backend
  // yg menjamin atomicity (rollback Tujuan kalau ADA SATU SAJA Dome gagal).
  const comboPayloadObj = {
  action: 'updateDiggingIdsWithDome',
  id_sampel: idSampel,
  tujuan: tujuanFinal,
  id_efo: (areaA === 'EFO' ? domeA : (areaB === 'EFO' ? domeB : '')),
  id_eto: (areaA === 'ETO' ? domeA : (areaB === 'ETO' ? domeB : '')),
  pic: pic,
  keterangan: keteranganFinal,
  portion0_area: areaA, portion0_dome: domeA, portion0_tonase: tonaseA,
  portion0_ni: row ? cleanNumber(row.ni) : 0, portion0_catatan: catatanA || keteranganUser
  };
  if (isCombo) {
  comboPayloadObj.portion1_area = areaB;
  comboPayloadObj.portion1_dome = domeB;
  comboPayloadObj.portion1_tonase = tonaseB;
  comboPayloadObj.portion1_ni = row ? cleanNumber(row.ni) : 0;
  comboPayloadObj.portion1_catatan = catatanB || keteranganUser;
  }
  const payload = buildAuthenticatedPayload(comboPayloadObj, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to update data.' : 'Gagal mengupdate data.'));
  }

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Updated!' : 'Berhasil diupdate!';
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
  closeUpdateTujuanModal();
  closeDiggingDetailModal();
  statusMsg.classList.add('hidden');
  fetchDataFromGoogleSheets(true);
  }, 900);
 } catch (error) {
  console.error('Error updating tujuan (dome/split):', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error && error.message ? error.message : (currentLang === 'en' ? 'An error occurred. Try again.' : 'Terjadi kesalahan. Coba lagi.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }
