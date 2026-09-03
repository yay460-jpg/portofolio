// ============================================================
// MEMBER.JS -- KPI Member, JSA, Attitude, KPI Event, Leaderboard
// ============================================================

// ==== MEMBER-KPI.js -- v90.2.120 ====

// ============================================================
// PERMISSION HELPERS
// ============================================================

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
  if (btnEvent) {
    btnEvent.classList.toggle('hidden', !canProposeKpiEvent());
    btnEvent.classList.toggle('flex', canProposeKpiEvent());
  }
  if (btnAttitude) {
    btnAttitude.classList.toggle('hidden', !canAssessAttitude());
    btnAttitude.classList.toggle('flex', canAssessAttitude());
  }
}

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

// ============================================================
// KPI EVENT APPROVAL LIST
// ============================================================

async function loadKpiEventApprovalList() {
  const listEl = document.getElementById('kpi-event-approval-list');
  if (!listEl) return;
  listEl.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Memuat...</div>';
  try {
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL + '?sheet=kpievent&t=' + Date.now());
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Gagal memuat data KPIEvent.');
    const pending = (result.data || []).filter(function(ev) {
      return String(ev.status || '').toUpperCase() === 'PENDING';
    });
    if (!pending.length) {
      listEl.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Tidak ada kejadian yang menunggu persetujuan.</div>';
      return;
    }
    listEl.innerHTML = pending.map(function(ev) {
      const jenisColor = ev.jenis === 'Full Exclusion' ? 'text-rose-400' :
                         (ev.jenis === 'Member Exclusion' ? 'text-blue-400' : 'text-amber-400');
      const jamInfo = ev.jenis === 'Partial Adjustment' ?
        ('Jam Hilang: ' + (ev.jam_hilang || '-') + ' &bull; Jam Recovery: ' + (ev.jam_recovery || '-') + ' &bull; ') :
        '';
      return '<div class="rounded-xl bg-slate-900 border border-slate-700 p-3">' +
        '<div class="flex items-center justify-between mb-1.5">' +
          '<span class="text-xs font-bold ' + jenisColor + '">' + ev.jenis + '</span>' +
          '<span class="text-[10px] text-slate-500">' + ev.event_id + '</span>' +
        '</div>' +
        '<div class="text-[11px] text-slate-300 mb-1">' + ev.alasan + '</div>' +
        '<div class="text-[10px] text-slate-500 mb-2">Diajukan: ' + ev.diajukan_oleh + ' &bull; Tanggal Kejadian: ' +
          ev.tanggal_kejadian + (ev.pit_area ? (' &bull; ' + ev.pit_area) : '') +
          (ev.target_member ? (' &bull; Target: ' + ev.target_member) : '') + '</div>' +
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
    const result = await postCentralAuthenticated({
      action: 'approveKpiEvent',
      event_id: eventId,
      decision: decision
    }, { developerOnly: true });
    if (!result.success && !(result.status === 'success')) {
      alert(result.message || 'Gagal memproses keputusan.');
      return;
    }
    loadKpiEventApprovalList();
  } catch (err) {
    alert('Error server: ' + (err && err.message ? err.message : String(err)));
  }
}

// ============================================================
// JSA (Job Safety Analysis) - sudah di i18n.js
// ============================================================
// PERBAIKAN KONTRAK ANTAR-FILE: fungsi applyJsaLanguage(lang) yang tadinya
// didefinisikan ulang di sini DIHAPUS. Karena member.js dimuat SETELAH
// i18n.js, definisi lokal ini akan MENIMPA window.applyJsaLanguage milik
// i18n.js dengan versi yang cuma memanggil window.applyJsaLanguage lagi --
// itu artinya memanggil DIRINYA SENDIRI selamanya (infinite recursion /
// stack overflow) begitu iframe JSA dibuka. Semua pemanggil di bawah ini
// (openJsaModal/closeJsaModal) memanggil window.applyJsaLanguage langsung,
// yang sudah benar merujuk ke implementasi asli di i18n.js.

function openJsaModal() {
  const modal = document.getElementById('jsa-modal');
  const iframe = document.getElementById('jsa-iframe');
  if (iframe && !iframe.getAttribute('data-loaded')) {
    iframe.onload = function() {
      if (typeof window.applyJsaLanguage === 'function') {
        window.applyJsaLanguage(window.currentLang);
      }
    };
    iframe.srcdoc = window.JSA_HTML_CONTENT || '';
    iframe.setAttribute('data-loaded', '1');
  }
  showModalAnimated(modal);
  setTimeout(function() {
    if (typeof window.applyJsaLanguage === 'function') {
      window.applyJsaLanguage(window.currentLang);
    }
  }, 50);
}

function closeJsaModal() {
  const modal = document.getElementById('jsa-modal');
  hideModalAnimated(modal);
}

function openRcaFromJsa() {
  closeJsaModal();
  const deskripsiAwal = window.currentLang === 'en' ?
    'Found while reviewing JSA-MINEGEO-2026-REV02: ' :
    'Ditemukan saat review JSA-MINEGEO-2026-REV02: ';
  if (typeof openFormRcaPopup === 'function') {
    openFormRcaPopup(null, null, null, deskripsiAwal);
  }
}

function openJsaConfirmModal() {
  const nameSelect = document.getElementById('jsa-confirm-nama');
  const identity = typeof getLoggedInChatIdentity === 'function' ? getLoggedInChatIdentity() : { sender: '' };
  nameSelect.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = identity.sender || '';
  opt.textContent = identity.sender || (window.currentLang === 'en' ? 'Login required' : 'Login diperlukan');
  nameSelect.appendChild(opt);
  nameSelect.value = identity.sender || '';
  nameSelect.disabled = true;
  nameSelect.classList.add('opacity-80', 'cursor-not-allowed');

  document.getElementById('jsa-confirm-status').value = 'Hadir';
  ['jsa-apd-helm', 'jsa-apd-masker', 'jsa-apd-sarung-tangan', 'jsa-apd-rompi'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
  toggleJsaApdVisibility();
  document.getElementById('jsa-confirm-status-msg').classList.add('hidden');
  const modal = document.getElementById('jsa-confirm-modal');
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

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
  const identity = typeof getLoggedInChatIdentity === 'function' ? getLoggedInChatIdentity() : { sender: '' };
  const nama = identity.sender || '';
  const attendanceStatus = document.getElementById('jsa-confirm-status').value || 'Hadir';
  const statusMsg = document.getElementById('jsa-confirm-status-msg');
  const submitBtn = document.getElementById('btn-submit-jsa-confirm');
  const originalHtml = submitBtn.innerHTML;

  if (!nama) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Please select a name.' : 'Pilih nama terlebih dahulu.';
    statusMsg.classList.remove('hidden');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' +
    (window.currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
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
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      throw new Error('Response server tidak valid (HTTP ' + response.status + ').');
    }
    if (result.status !== 'success') throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to save JSA confirmation.' : 'Gagal menyimpan konfirmasi JSA.'));

    if (result.denied) {
      statusMsg.className = 'text-xs text-amber-400';
      statusMsg.innerText = window.currentLang === 'en' ? 'Your attendance has already been recorded today.' : 'Kehadiran Anda sudah tercatat hari ini.';
    } else {
      statusMsg.className = 'text-xs text-emerald-400';
      statusMsg.innerText = window.currentLang === 'en' ? 'Attendance recorded successfully.' : 'Kehadiran berhasil dicatat.';
    }
    statusMsg.classList.remove('hidden');
    setTimeout(function() {
      closeJsaConfirmModal();
      statusMsg.classList.add('hidden');
      if (typeof fetchJsaLogData === 'function') fetchJsaLogData();
    }, 900);
  } catch (error) {
    console.error('Error saving JSA confirmation:', error);
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = (error && error.name === 'TypeError' && String(error.message || '').toLowerCase().includes('fetch')) ?
      (window.currentLang === 'en' ? 'Connection to server failed.' : 'Koneksi ke server gagal.') :
      (error.message || (window.currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.'));
    statusMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

// ============================================================
// CHANGELOG DATA (sudah di i18n.js)
// ============================================================

// ============================================================
// KPI FORMULA CONFIG
// ============================================================

let kpiFormulaWeightsCache = { A: null, B: null, C: null };
let kpiFormulaActiveOption = 'A';

async function loadKpiFormulaConfig() {
  const statusMsg = document.getElementById('kpi-formula-status-msg');
  try {
    const payload = buildAuthenticatedPayload({}, { developerOnly: true });
    const url = window.GOOGLE_SCRIPT_READ_URL + '?sheet=kpiformula&' + payload.toString() + '&t=' + new Date().getTime();
    const response = await fetchWithTimeout(url);
    const result = await response.json();
    if (result.status !== 'success' || !result.data) {
      throw new Error(result.message || 'Gagal memuat config Formula KPI.');
    }
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
  const w = (kpiFormulaWeightsCache && kpiFormulaWeightsCache[mode]) || {
    kehadiran: 20, safety: 20, sampling: 20, laporan: 20, attitude: 20
  };
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
  const ids = ['kehadiran', 'safety', 'sampling', 'laporan', 'attitude'];
  let total = 0;
  ids.forEach(function(k) {
    const val = document.getElementById('kpi-w-' + k).value;
    document.getElementById('kpi-w-' + k + '-val').textContent = val;
    total += parseFloat(val) || 0;
  });
  const totalEl = document.getElementById('kpi-w-total');
  totalEl.textContent = total;
  const isValidTotal = Math.abs(total - 100) < 0.01;
  totalEl.className = isValidTotal ? 'text-title font-bold' : 'text-rose-400 font-bold';
  updateKpiFormulaPreview();
}

function populateKpiFormulaPreviewMemberDropdown() {
  const select = document.getElementById('kpi-formula-preview-member');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '';
  (window.globalMemberData || []).forEach(function(item) {
    const member = {};
    Object.keys(item).forEach(function(k) {
      member[k.trim().toLowerCase()] = item[k];
    });
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

let kpiFormulaPreviewDebounceTimer = null;
let kpiFormulaPreviewRequestSeq = 0;

function updateKpiFormulaPreview() {
  clearTimeout(kpiFormulaPreviewDebounceTimer);
  kpiFormulaPreviewDebounceTimer = setTimeout(async function() {
    const requestSeq = ++kpiFormulaPreviewRequestSeq;
    const previewEl = document.getElementById('kpi-formula-preview-text');
    const namaMember = document.getElementById('kpi-formula-preview-member')?.value;
    if (!previewEl) return;
    if (!namaMember) {
      previewEl.textContent = window.currentLang === 'en' ? 'Preview: no member available' : 'Preview: belum ada member';
      return;
    }
    previewEl.textContent = window.currentLang === 'en' ? 'Preview: loading...' : 'Preview: memuat...';
    try {
      const periode = typeof getLocalPeriodeYyyyMm === 'function' ? getLocalPeriodeYyyyMm() : '';
      const url = window.GOOGLE_SCRIPT_READ_URL + '?sheet=kpiscore&member_id=' + encodeURIComponent(namaMember) + '&periode=' + periode + '&t=' + new Date().getTime();
      const response = await fetchWithTimeout(url);
      const result = await response.json();
      if (requestSeq !== kpiFormulaPreviewRequestSeq) return;
      if (result.status !== 'success' || !result.data) throw new Error('no data');
      const p = result.data;
      const pilarKeys = {
        kehadiran: 'pilar_kehadiran',
        safety: 'pilar_safety',
        sampling: 'pilar_kelengkapan_sampling',
        laporan: 'pilar_laporan_tepat_waktu',
        attitude: 'pilar_attitude'
      };
      const w = {
        kehadiran: parseFloat(document.getElementById('kpi-w-kehadiran').value) || 0,
        safety: parseFloat(document.getElementById('kpi-w-safety').value) || 0,
        sampling: parseFloat(document.getElementById('kpi-w-sampling').value) || 0,
        laporan: parseFloat(document.getElementById('kpi-w-laporan').value) || 0,
        attitude: parseFloat(document.getElementById('kpi-w-attitude').value) || 0
      };
      let weightedSum = 0, totalW = 0, missingCount = 0;
      Object.keys(pilarKeys).forEach(function(key) {
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
      finalScore = Math.round(finalScore * 100) / 100;
      const mode = document.getElementById('kpi-formula-mode-select').value;
      const incompleteNote = missingCount > 0 ?
        (window.currentLang === 'en' ? ` [${missingCount} pillar(s) not yet scored, excluded]` : ` [${missingCount} pilar belum dinilai, dikecualikan]`) :
        '';
      previewEl.textContent = (window.currentLang === 'en' ? 'Preview: If using this mode, ' : 'Preview: Jika pakai mode ini, ') +
        namaMember + ' = ' + finalScore + gateNote + ' (' + mode + ')' + incompleteNote;
    } catch (err) {
      if (requestSeq !== kpiFormulaPreviewRequestSeq) return;
      previewEl.textContent = window.currentLang === 'en' ? 'Preview: failed to load' : 'Preview: gagal memuat';
    }
  }, 300);
}

async function saveKpiFormula(setActive) {
  const statusMsg = document.getElementById('kpi-formula-status-msg');
  const btnMode = document.getElementById('btn-save-kpi-formula-mode');
  const btnActive = document.getElementById('btn-save-kpi-formula-active');
  const mode = document.getElementById('kpi-formula-mode-select').value;

  function showErr(msg) {
    if (statusMsg) {
      statusMsg.className = 'text-xs text-rose-400';
      statusMsg.innerText = msg;
      statusMsg.classList.remove('hidden');
    }
  }

  const w = {
    kehadiran: document.getElementById('kpi-w-kehadiran').value,
    safety: document.getElementById('kpi-w-safety').value,
    sampling: document.getElementById('kpi-w-sampling').value,
    laporan: document.getElementById('kpi-w-laporan').value,
    attitude: document.getElementById('kpi-w-attitude').value
  };

  [btnMode, btnActive].forEach(function(b) { if (b) b.disabled = true; });
  if (statusMsg) statusMsg.classList.add('hidden');

  try {
    const payload = buildAuthenticatedPayload({
      action: 'saveKpiFormula',
      mode: mode,
      set_active: setActive ? 'true' : 'false',
      w_kehadiran: w.kehadiran,
      w_safety: w.safety,
      w_sampling: w.sampling,
      w_laporan: w.laporan,
      w_attitude: w.attitude
    }, { developerOnly: true });
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Gagal menyimpan Formula KPI.');
    kpiFormulaWeightsCache[mode] = {
      kehadiran: parseFloat(w.kehadiran),
      safety: parseFloat(w.safety),
      sampling: parseFloat(w.sampling),
      laporan: parseFloat(w.laporan),
      attitude: parseFloat(w.attitude)
    };
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
    [btnMode, btnActive].forEach(function(b) { if (b) b.disabled = false; });
  }
}

// ============================================================
// KPI CONTEXT & BADGES (fetch data untuk kartu member)
// ============================================================

async function fetchKpiContextForMember_(namaMember, contextElId) {
  const contextEl = document.getElementById(contextElId);
  if (!contextEl) return;
  try {
    const periode = typeof getLocalPeriodeYyyyMm === 'function' ? getLocalPeriodeYyyyMm() : '';
    const url = window.GOOGLE_SCRIPT_READ_URL + '?sheet=kpicontext&member_id=' + encodeURIComponent(namaMember) + '&periode=' + periode + '&t=' + new Date().getTime();
    const response = await fetchWithTimeout(url);
    const result = await response.json();
    if (result.status !== 'success' || !result.data) { contextEl.innerHTML = ''; return; }
    const events = result.data.events || [];
    const ambiguousWarning = result.data.identity_ambiguous ?
      '<div class="text-rose-400 font-bold mb-1">⚠️ ' +
        (window.currentLang === 'en' ? `Ambiguous name (${result.data.identity_match_count} Members share this exact name) -- context below may not belong to this specific person.` :
        `Nama ambigu (${result.data.identity_match_count} Member punya Nama persis sama) -- konteks di bawah bisa saja bukan milik orang ini.`) +
      '</div>' : '';
    if (events.length === 0 && !result.data.identity_ambiguous) { contextEl.innerHTML = ''; return; }

    const sourceIcon = { kpievent: '🔧', issue: '⚠️', rca: '📋' };
    const scopeTag = function(scope) {
      return scope === 'personal' ? '' :
        '<span class="px-1 rounded bg-slate-700/60 text-slate-400 text-[8px] font-bold uppercase">' +
        (window.currentLang === 'en' ? 'Team' : 'Tim') + '</span>';
    };
    const rows = events.map(function(ev, i) {
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
      <div class="text-[9px] font-bold text-amber-400 tracking-wide uppercase mb-1">${window.currentLang === 'en' ? `Context This Period (${events.length})` : `Konteks Periode Ini (${events.length})`}</div>
      <div class="text-[9px] text-slate-500 mb-1">${window.currentLang === 'en' ? 'Tag "Team" = not specific to this member, shown for cross-reference' : 'Tag "Tim" = bukan spesifik member ini, ditampilkan utk cross-reference'}</div>
      <div class="space-y-0.5 max-h-24 overflow-y-auto">${rows}</div>
    `;
  } catch (err) {
    if (contextEl) contextEl.innerHTML = '';
  }
}

async function fetchKpiBadgesForMember_(namaMember, laporanBadgeId, kehadiranBadgeId, safetyBadgeId, samplingBadgeId, attitudeBadgeId, finalScoreId, finalScoreGateId) {
  const laporanBadgeEl = document.getElementById(laporanBadgeId);
  const kehadiranBadgeEl = document.getElementById(kehadiranBadgeId);
  const safetyBadgeEl = document.getElementById(safetyBadgeId);
  const samplingBadgeEl = document.getElementById(samplingBadgeId);
  const attitudeBadgeEl = document.getElementById(attitudeBadgeId);
  const finalScoreEl = document.getElementById(finalScoreId);
  const finalScoreGateEl = document.getElementById(finalScoreGateId);
  if (!laporanBadgeEl && !kehadiranBadgeEl && !safetyBadgeEl && !samplingBadgeEl && !attitudeBadgeEl && !finalScoreEl) return;

  try {
    const periode = typeof getLocalPeriodeYyyyMm === 'function' ? getLocalPeriodeYyyyMm() : '';
    const url = window.GOOGLE_SCRIPT_READ_URL + '?sheet=kpiscore&member_id=' + encodeURIComponent(namaMember) + '&periode=' + periode + '&t=' + new Date().getTime();
    const response = await fetchWithTimeout(url);
    const result = await response.json();
    if (result.status !== 'success' || !result.data) throw new Error('no data');

    const pilar = result.data.pilar_laporan_tepat_waktu;
    if (laporanBadgeEl) {
      if (!pilar || pilar.score === null || pilar.score === undefined) {
        laporanBadgeEl.textContent = '-';
      } else {
        const scoreColor = pilar.score >= 90 ? 'text-emerald-400' : (pilar.score >= 70 ? 'text-amber-400' : 'text-rose-400');
        const modeLabel = pilar.mode === 'proksi_assay' ? (window.currentLang === 'en' ? ' (proxy)' : ' (proksi)') : '';
        laporanBadgeEl.className = 'font-semibold ' + scoreColor;
        laporanBadgeEl.textContent = pilar.score + modeLabel;
        laporanBadgeEl.title = pilar.mode === 'proksi_assay' ?
          (window.currentLang === 'en' ? 'Based on Assay Update timeliness proxy' : 'Berdasarkan proksi Ketepatan Update Assay') :
          (window.currentLang === 'en' ? 'Based on actual submission time' : 'Berdasarkan jam submit asli');
      }
    }

    const kehadiran = result.data.pilar_kehadiran;
    if (kehadiranBadgeEl) {
      if (!kehadiran || kehadiran.score === null || kehadiran.score === undefined) {
        kehadiranBadgeEl.textContent = '-';
      } else {
        const scoreColorK = kehadiran.score >= 90 ? 'text-emerald-400' : (kehadiran.score >= 70 ? 'text-amber-400' : 'text-rose-400');
        kehadiranBadgeEl.className = 'font-semibold ' + scoreColorK;
        kehadiranBadgeEl.textContent = kehadiran.score;
        kehadiranBadgeEl.title = window.currentLang === 'en' ?
          `Present: ${kehadiran.hadir} / Eligible days: ${kehadiran.denominator}` :
          `Hadir: ${kehadiran.hadir} / Hari wajib dinilai: ${kehadiran.denominator}`;
      }
    }

    const sampling = result.data.pilar_kelengkapan_sampling;
    if (samplingBadgeEl) {
      if (!sampling || sampling.score === null || sampling.score === undefined) {
        samplingBadgeEl.textContent = '-';
      } else {
        const scoreColorSp = sampling.score >= 90 ? 'text-emerald-400' : (sampling.score >= 70 ? 'text-amber-400' : 'text-rose-400');
        samplingBadgeEl.className = 'font-semibold ' + scoreColorSp;
        samplingBadgeEl.textContent = sampling.score;
        samplingBadgeEl.title = window.currentLang === 'en' ?
          `Complete with Ni%: ${sampling.lengkap} / Total rows: ${sampling.total_baris}` :
          `Sampel lengkap Ni%: ${sampling.lengkap} / Total baris: ${sampling.total_baris}`;
      }
    }

    const attitude = result.data.pilar_attitude;
    if (attitudeBadgeEl) {
      if (!attitude || attitude.score === null || attitude.score === undefined) {
        attitudeBadgeEl.textContent = '-';
      } else {
        const scoreColorA = attitude.score >= 90 ? 'text-emerald-400' : (attitude.score >= 70 ? 'text-amber-400' : 'text-rose-400');
        attitudeBadgeEl.className = 'font-semibold ' + scoreColorA;
        attitudeBadgeEl.textContent = attitude.score + (attitude.mode === 'belum_dinilai' ? (window.currentLang === 'en' ? ' (not yet assessed)' : ' (belum dinilai)') : '');
        attitudeBadgeEl.title = attitude.mode === 'belum_dinilai' ?
          (window.currentLang === 'en' ? 'No Attitude assessment yet this period' : 'Belum ada penilaian Attitude periode ini') :
          (window.currentLang === 'en' ?
            `Discipline: ${attitude.disiplin} · Teamwork: ${attitude.kerja_sama} · Initiative: ${attitude.inisiatif} · Integrity: ${attitude.integritas}` :
            `Disiplin: ${attitude.disiplin} · Kerja Sama: ${attitude.kerja_sama} · Inisiatif: ${attitude.inisiatif} · Integritas: ${attitude.integritas}`);
      }
    }

    const safety = result.data.pilar_safety;
    if (safetyBadgeEl) {
      if (!safety || safety.score === null || safety.score === undefined) {
        safetyBadgeEl.textContent = '-';
      } else {
        const scoreColorS = safety.score >= 90 ? 'text-emerald-400' : (safety.score >= 70 ? 'text-amber-400' : 'text-rose-400');
        safetyBadgeEl.className = 'font-semibold ' + scoreColorS;
        safetyBadgeEl.textContent = safety.score;
        safetyBadgeEl.title = window.currentLang === 'en' ?
          `Average PPE compliance across ${safety.total_hari_hadir} present day(s)` :
          `Rata-rata kepatuhan APD dari ${safety.total_hari_hadir} hari Hadir`;
      }
    }

    if (finalScoreEl) {
      const finalScore = result.data.final_score;
      if (finalScore === null || finalScore === undefined) {
        finalScoreEl.textContent = '-';
      } else {
        const scoreColorF = finalScore >= 90 ? 'text-emerald-400' : (finalScore >= 70 ? 'text-amber-400' : 'text-rose-400');
        finalScoreEl.className = 'font-bold text-sm ' + scoreColorF;
        finalScoreEl.textContent = finalScore;
        finalScoreEl.title = window.currentLang === 'en' ? `Weight mode: ${result.data.weight_mode}` : `Mode bobot: ${result.data.weight_mode}`;
        const gate = result.data.safety_gate;
        if (finalScoreGateEl) finalScoreGateEl.classList.toggle('hidden', !(gate && gate.triggered));
      }
    }
  } catch (err) {
    if (laporanBadgeEl) { laporanBadgeEl.textContent = '-'; laporanBadgeEl.title = window.currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
    if (kehadiranBadgeEl) { kehadiranBadgeEl.textContent = '-'; kehadiranBadgeEl.title = window.currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
    if (safetyBadgeEl) { safetyBadgeEl.textContent = '-'; safetyBadgeEl.title = window.currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
    if (samplingBadgeEl) { samplingBadgeEl.textContent = '-'; samplingBadgeEl.title = window.currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
    if (attitudeBadgeEl) { attitudeBadgeEl.textContent = '-'; attitudeBadgeEl.title = window.currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
    if (finalScoreEl) { finalScoreEl.textContent = '-'; finalScoreEl.title = window.currentLang === 'en' ? 'Failed to load score' : 'Gagal memuat skor'; }
  }
}

// ============================================================
// JSA LOG DATA
// ============================================================

async function fetchJsaLogData() {
  try {
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL + '?sheet=jsalog&t=' + new Date().getTime());
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to load JSA Log.' : 'Gagal memuat data JSA Log'));
    window.globalJsaLogData = result.data || [];
    const activeTab = document.querySelector('aside nav button.nav-item-active');
    if (activeTab && activeTab.id === 'btn-kpimember' && typeof loadMembersFromSheet === 'function' && window.globalMemberData && window.globalMemberData.length > 0) {
      loadMembersFromSheet();
    }
  } catch (err) {
    console.error('Gagal memuat data JSA Log:', err);
  }
}

// ============================================================
// LOAD MEMBERS FROM SHEET (Fungsi utama)
// ============================================================

// [UPDATED dari baseline -- alih fungsi Accuracy Grade lama v90.2.140, keputusan user 30 Agu]
 async function loadMembersFromSheet() {
 const container = document.getElementById('member-grid-container');
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL);
  const result = await response.json();

  if (result.status === 'success' && result.data.length > 0) {
  container.innerHTML = '';
  globalMemberData = result.data;
  window.globalMemberData = globalMemberData; // [FIX] MG1 sinkronisasi window.X manual (lihat
  // syncGlobalStateToWindow di main.js) -- fungsi ini direstorasi dari baseline yang memakai
  // variabel bare langsung, jadi window.globalMemberData WAJIB disamakan manual di sini juga,
  // supaya kode lain (leaderboard, dev console, dll) yang baca window.globalMemberData tidak
  // ketinggalan data basi.
  populateReporterDropdown();

  result.data.forEach((item, index) => {
   const member = {};
   Object.keys(item).forEach(k => member[k.trim().toLowerCase()] = item[k]);

   const namaVal = member['nama'] || member['name'] || 'Tanpa Nama';
   const jabatanVal = member['jabatan'] || member['role'] || '-';
   // [MIGRASI User_ID -- Tahap 2] Tampilkan User_ID resmi (GEO-XXX) di kartu, kalau sudah
   // terisi (member lama sebelum kolom ini ada mungkin masih kosong sampai backfill jalan).
   const userIdVal = member['user_id'] || '';
   // v90.2.140 FIX (keputusan user 30 Agu -- alih fungsi Accuracy Grade lama): backend
   // sekarang kirim field BARU (total_tonase/avg_ni_total/waste_tonase/avg_ni_waste/
   // tonase_murni/avg_ni_murni) menggantikan target/inspeksi/accuracy statis lama.
   const fmt1 = (v) => (v === null || v === undefined || v === '' || isNaN(parseFloat(v))) ? '-' : Number(v).toLocaleString('id-ID', {minimumFractionDigits:1, maximumFractionDigits:1});
   const fmtPct2 = (v) => (v === null || v === undefined || v === '' || isNaN(parseFloat(v))) ? '-' : Number(v).toFixed(2) + '%';
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

   // [FINAL -- 4 Sep, keputusan user] Expand view kartu Member: Opsi 2 (card memanjang
   // ke bawah) dipilih permanen dari 3 opsi trial yang sempat dipasang di Developer
   // Console. Trial dihapus -- lihat scripts/member-card-expand.js (disederhanakan).
   const kpiExpandBlockId = `member-kpi-expand-${index}`;
   const kpiExpandIconId = `member-kpi-expand-icon-${index}`;
   const kpiExpandTriggerHtml = `<button type="button" class="member-kpi-expand-trigger" onclick="event.stopPropagation(); toggleMemberKpiExpand(${index})" aria-label="${currentLang === 'en' ? 'Show 5-Pillar KPI details' : 'Lihat detail KPI 5 Pilar'}"><i data-lucide="chevron-down" id="${kpiExpandIconId}" class="w-3.5 h-3.5"></i><span>${currentLang === 'en' ? 'View details' : 'Lihat selengkapnya'}</span></button>`;

   const card = document.createElement('div');
   card.id = `member-card-${index}`;
   card.className = "glass-card p-4.5 rounded-xl border border-slate-700/40 flex flex-col justify-between hover:border-blue-500/50 transition-all cursor-pointer text-xs";
   card.onclick = () => openMemberModal(index);
   card.innerHTML = `
   <div>
    <div class="flex items-center gap-3 mb-3.5">
    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(namaVal)}&background=2563eb&color=fff&bold=true" class="w-10 h-10 rounded-full border-2 border-blue-500 shadow-sm" alt="Avatar">
    <div>
     <h4 class="font-bold text-title tracking-tight">${namaVal}</h4>
     <p class="text-[11px] text-slate-400 font-medium">${jabatanVal}</p>
     ${userIdVal ? `<p class="text-[9px] text-blue-400 font-mono font-semibold mt-0.5">${userIdVal}</p>` : ''}
    </div>
    </div>
    <div class="space-y-1.5 mb-3.5 font-medium">
    <div class="pt-1 pb-1">
     <div class="text-[9px] font-bold text-emerald-400/80 tracking-wide uppercase mb-1">${currentLang === 'en' ? 'Net Result' : 'Hasil Bersih'}</div>
     <div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Tonnage' : 'Tonase'}</span><span class="font-semibold text-emerald-400">${tonaseMurniVal} ${tonaseMurniVal !== '-' ? 'ton' : ''}</span></div>
     <div class="flex justify-between"><span class="text-slate-400">${currentLang === 'en' ? 'Average Ni' : 'Average Ni'}</span><span class="font-semibold text-emerald-400">${avgNiMurniVal}</span></div>
    </div>
    ${member['anomaly_waste_exceeds_total'] ? `<div class="text-[9px] text-rose-400 font-semibold">⚠ ${currentLang === 'en' ? 'Data anomaly: Waste exceeds Total' : 'Anomali data: Waste melebihi Total'}</div>` : ''}
    ${jsaBadgeHtml}
    <div class="pt-2 mt-1.5 border-t border-slate-700/40 text-[9px] font-bold text-violet-400 tracking-wide uppercase">${currentLang === 'en' ? '5-Pillar KPI Engine (New)' : 'Engine KPI 5 Pilar (Baru)'}</div>
    ${kpiExpandTriggerHtml}
    <div id="${kpiExpandBlockId}" class="member-kpi-expand-block">
    ${kpiLaporanBadgeHtml}
    ${kpiKehadiranBadgeHtml}
    ${kpiSafetyBadgeHtml}
    ${kpiSamplingBadgeHtml}
    ${kpiAttitudeBadgeHtml}
    ${kpiFinalScoreHtml}
    ${kpiContextHtml}
    </div>
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


// ============================================================
// LEADERBOARD
// ============================================================

function renderLeaderboard() {
  const listEl = document.getElementById('leaderboard-list');
  if (!listEl) return;

  const ranked = (window.globalMemberData || [])
    .map(function(item) {
      const member = {};
      Object.keys(item).forEach(function(k) {
        member[k.trim().toLowerCase()] = item[k];
      });
      return {
        nama: member['nama'] || member['name'] || (window.currentLang === 'en' ? 'No Name' : 'Tanpa Nama'),
        jabatan: member['jabatan'] || member['role'] || '-',
        target: member['target'] || '-',
        inspeksi: member['inspeksi'] || '-',
        accuracyRaw: member['accuracy'] || '-',
        accuracyNum: typeof parseAccuracyValue === 'function' ? parseAccuracyValue(member['accuracy']) : null
      };
    })
    .filter(function(m) { return m.accuracyNum !== null; })
    .sort(function(a, b) { return b.accuracyNum - a.accuracyNum; });

  if (ranked.length === 0) {
    listEl.innerHTML = '<p class="text-[11px] text-slate-500 font-medium">' +
      (window.translations && window.translations[window.currentLang] ? window.translations[window.currentLang].leaderboard_empty : 'Belum ada data untuk diperingkat.') +
      '</p>';
    return;
  }

  const medalByRank = { 1: '🥇', 2: '🥈', 3: '🥉' };
  listEl.innerHTML = ranked.map(function(m, idx) {
    const rank = idx + 1;
    const medal = medalByRank[rank] || '';
    const rankBadgeClass = rank <= 3 ?
      'bg-amber-500/15 text-amber-300 border-amber-500/30' :
      'bg-slate-800/60 text-slate-400 border-slate-700/60';
    return '<div class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-900/40 border border-slate-700/50 text-xs">' +
      '<div class="flex items-center gap-3 min-w-0">' +
        '<span class="flex items-center justify-center w-7 h-7 rounded-lg border font-bold text-[11px] shrink-0 ' + rankBadgeClass + '">' + (medal || rank) + '</span>' +
        '<div class="min-w-0">' +
          '<p class="font-semibold text-title truncate">' + m.nama + '</p>' +
          '<p class="text-[10px] text-slate-500 font-medium truncate">' + m.jabatan +
            (m.target !== '-' ? ' · ' + (window.currentLang === 'en' ? 'Target' : 'Target') + ': ' + m.target : '') +
            (m.inspeksi !== '-' ? ' · ' + m.inspeksi : '') +
          '</p>' +
        '</div>' +
      '</div>' +
      '<span class="font-bold text-blue-400 shrink-0">' + m.accuracyRaw + '</span>' +
    '</div>';
  }).join('');
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

// ============================================================
// MEMBER MODAL (Detail Klik Kartu)
// ============================================================

// [UPDATED dari baseline -- alih fungsi Accuracy Grade lama v90.2.140, keputusan user 30 Agu]
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
 // [MIGRASI User_ID -- Tahap 2] Tampilkan User_ID resmi di modal detail juga.
 var modalUserIdEl = document.getElementById('modal-user-id');
 if (modalUserIdEl) modalUserIdEl.innerText = member['user_id'] || '';
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

// ============================================================
// DELETE & EDIT MEMBER (Developer)
// ============================================================

async function deleteMemberByRow(rowNumber) {
  if (!(await showConfirmModal(
    window.currentLang === 'en' ? 'Delete Member Record' : 'Hapus Record Member',
    window.currentLang === 'en' ? 'Delete this Member record from the Member sheet?' : 'Hapus record Member ini dari sheet Member?'
  ))) return;
  try {
    await postDeveloperAdmin('developerDeleteMember', { row_number: String(rowNumber) });
    closeMemberModal();
    await loadMembersFromSheet();
  } catch (e) {
    showNoticeModal(window.currentLang === 'en' ? 'Delete Failed' : 'Hapus Gagal', e.message);
  }
}

function resetMemberFormMode() {
  const form = document.getElementById('kpiManagerForm');
  if (!form) return;
  form.dataset.editMode = '0';
  form.dataset.editRow = '';
  const hidden = form.elements.edit_row;
  if (hidden) hidden.value = '';
  const account = document.getElementById('member-account-access-block');
  if (account) account.classList.remove('hidden');
  ['login_id', 'email', 'pin', 'pin_confirm'].forEach(function(n) {
    if (form.elements[n]) form.elements[n].required = true;
  });
  const title = document.querySelector('#form-popup-modal [data-i18n="form_member_title"]');
  if (title) title.innerText = 'Form Member & KPI Geologi';
  const subtitle = document.querySelector('#form-popup-modal [data-i18n="form_member_subtitle"]');
  if (subtitle) subtitle.innerText = 'Isi formulir di bawah ini untuk menambahkan data member baru.';
  const btn = document.getElementById('btn-submit-member');
  if (btn) btn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i> Simpan Member';
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function openMemberEdit(rowNumber) {
  if (!isDeveloperUnlocked()) return;
  const item = window.globalMemberData.find(function(x) { return Number(x._row) === Number(rowNumber); });
  if (!item) {
    showNoticeModal('Edit Gagal', 'Data Member tidak ditemukan. Refresh data lalu coba lagi.');
    return;
  }
  const form = document.getElementById('kpiManagerForm');
  if (!form) return;
  resetMemberFormMode();
  form.dataset.editMode = '1';
  form.dataset.editRow = String(rowNumber);
  if (form.elements.edit_row) form.elements.edit_row.value = String(rowNumber);

  const member = {};
  Object.keys(item).forEach(function(k) {
    member[k.trim().toLowerCase()] = item[k];
  });

  function setField(n, v) {
    if (form.elements[n]) form.elements[n].value = (v === null || v === undefined) ? '' : v;
  }
  setField('nama', member.nama || '');
  setField('jabatan', member.jabatan || '');
  setField('grade', member.grade || 'Grade A');
  setField('status', member.status || 'Achieved');
  setField('nomor_hp', member.nomor_hp || '');

  const account = document.getElementById('member-account-access-block');
  if (account) account.classList.add('hidden');
  ['login_id', 'email', 'pin', 'pin_confirm'].forEach(function(n) {
    if (form.elements[n]) form.elements[n].required = false;
  });

  const title = document.querySelector('#form-popup-modal [data-i18n="form_member_title"]');
  if (title) title.innerText = 'Edit Member & KPI';
  const subtitle = document.querySelector('#form-popup-modal [data-i18n="form_member_subtitle"]');
  if (subtitle) subtitle.innerText = 'Perubahan langsung disimpan ke sheet Member.';
  const btn = document.getElementById('btn-submit-member');
  if (btn) btn.innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i> Simpan Perubahan';

  showModalAnimated(document.getElementById('form-popup-modal'));
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

// ============================================================
// SUBMIT MEMBER FORM (Create/Update)
// ============================================================

async function submitMemberForm(event) {
  event.preventDefault();
  const form = document.getElementById('kpiManagerForm');
  const submitBtn = document.getElementById('btn-submit-member');
  const statusMsg = document.getElementById('member-form-status-msg');
  const originalBtnHtml = submitBtn.innerHTML;

  // MODE EDIT
  if (form.dataset.editMode === '1' && form.dataset.editRow) {
    const nama = (form.elements.nama?.value || '').trim();
    if (!nama) {
      statusMsg.className = 'text-xs text-rose-400';
      statusMsg.innerText = window.currentLang === 'en' ? 'Full name is required.' : 'Nama Lengkap wajib diisi.';
      statusMsg.classList.remove('hidden');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' +
      (window.currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
    statusMsg.classList.add('hidden');
    try {
      const editFields = {
        row_number: form.dataset.editRow,
        nama: nama,
        jabatan: (form.elements.jabatan?.value || '').trim(),
        status: (form.elements.status?.value || '').trim(),
        grade: (form.elements.grade?.value || '').trim(),
        nomor_hp: (form.elements.nomor_hp?.value || '').trim()
      };
      await postDeveloperAdmin('developerUpdateMember', editFields);
      statusMsg.className = 'text-xs text-emerald-400';
      statusMsg.innerText = window.currentLang === 'en' ? 'Member data successfully saved!' : 'Data member berhasil disimpan!';
      statusMsg.classList.remove('hidden');
      setTimeout(function() {
        closeFormPopup();
        resetMemberFormMode();
        statusMsg.classList.add('hidden');
        if (typeof manualRefreshData === 'function') manualRefreshData();
      }, 900);
    } catch (error) {
      console.error('Error updating member:', error);
      statusMsg.className = 'text-xs text-rose-400';
      statusMsg.innerText = error && error.message ? error.message :
        (window.currentLang === 'en' ? 'An error occurred while saving. Please try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
      statusMsg.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }
    return;
  }

  // MODE CREATE (Baru)
  const loginId = (form.elements.login_id?.value || '').trim();
  const email = (form.elements.email?.value || '').trim();
  const pin = String(form.elements.pin?.value || '').replace(/\D/g, '').slice(0, 6);
  const pinConfirm = String(form.elements.pin_confirm?.value || '').replace(/\D/g, '').slice(0, 6);

  if (form.elements.pin) form.elements.pin.value = pin;
  if (form.elements.pin_confirm) form.elements.pin_confirm.value = pinConfirm;

  statusMsg.dataset.errorCode = '';

  if (!/^[A-Za-z0-9._-]{3,40}$/.test(loginId)) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Login_ID must be 3-40 characters and use only letters, numbers, dot, underscore, or hyphen.' :
      'Login_ID harus 3-40 karakter dan hanya boleh memakai huruf, angka, titik, garis bawah, atau tanda minus.';
    statusMsg.classList.remove('hidden');
    return;
  }
  if (!email) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Registered email is required.' : 'Email terdaftar wajib diisi.';
    statusMsg.classList.remove('hidden');
    return;
  }
  if (!/^\d{6}$/.test(pin)) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Member PIN must be exactly 6 digits.' : 'PIN Member harus tepat 6 digit.';
    statusMsg.classList.remove('hidden');
    return;
  }
  if (pin !== pinConfirm) {
    statusMsg.dataset.errorCode = 'pin-mismatch';
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'PIN confirmation does not match.' : 'Konfirmasi PIN tidak sama.';
    statusMsg.classList.remove('hidden');
    return;
  }

  statusMsg.dataset.errorCode = '';
  statusMsg.innerText = '';
  statusMsg.className = 'text-xs hidden';

  const payload = buildAuthenticatedPayload(form, { developerOnly: true });
  payload.set('action', 'createMemberAccount');
  payload.set('sheet_name', 'member');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' +
    (window.currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');

  try {
    const response = await fetch(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
    const result = await response.json();

    if (result.status === 'success') {
      statusMsg.className = 'text-xs text-emerald-400';
      statusMsg.innerText = window.currentLang === 'en' ? 'Member data successfully saved!' : 'Data member berhasil disimpan!';
      statusMsg.classList.remove('hidden');
      form.reset();

      setTimeout(function() {
        closeFormPopup();
        statusMsg.classList.add('hidden');
        if (typeof manualRefreshData === 'function') manualRefreshData();
      }, 900);
    } else {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to save member data.' : 'Gagal menyimpan data member.'));
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = error && error.message ? error.message :
      (window.currentLang === 'en' ? 'An error occurred while saving. Please try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
    statusMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

function closeFormPopup() {
  const modal = document.getElementById('form-popup-modal');
  if (modal) hideModalAnimated(modal);
}

// ============================================================
// EXPOSE FUNCTIONS KE GLOBAL WINDOW
// ============================================================
window.canProposeKpiEvent = canProposeKpiEvent;
window.canApproveKpiEvent = canApproveKpiEvent;
window.canAssessAttitude = canAssessAttitude;
window.updateKpiButtonsVisibility = updateKpiButtonsVisibility;
window.getRcaUiRole = getRcaUiRole;
window.canCreateRca = canCreateRca;
window.canCloseRca = canCloseRca;
window.canManageRca = canManageRca;
window.loadKpiEventApprovalList = loadKpiEventApprovalList;
window.decideKpiEvent = decideKpiEvent;
window.openJsaModal = openJsaModal;
window.closeJsaModal = closeJsaModal;
window.openRcaFromJsa = openRcaFromJsa;
window.openJsaConfirmModal = openJsaConfirmModal;
window.closeJsaConfirmModal = closeJsaConfirmModal;
window.submitJsaLog = submitJsaLog;
window.toggleJsaApdVisibility = toggleJsaApdVisibility;
window.loadKpiFormulaConfig = loadKpiFormulaConfig;
window.applyKpiFormulaWeightsToSliders = applyKpiFormulaWeightsToSliders;
window.onKpiFormulaModeChange = onKpiFormulaModeChange;
window.onKpiFormulaSliderInput = onKpiFormulaSliderInput;
window.populateKpiFormulaPreviewMemberDropdown = populateKpiFormulaPreviewMemberDropdown;
window.updateKpiFormulaPreview = updateKpiFormulaPreview;
window.saveKpiFormula = saveKpiFormula;
window.fetchJsaLogData = fetchJsaLogData;
window.loadMembersFromSheet = loadMembersFromSheet;
window.renderLeaderboard = renderLeaderboard;
window.closeFormPopup = closeFormPopup;
window.openMemberModal = openMemberModal;
window.closeMemberModal = closeMemberModal;
window.deleteMemberByRow = deleteMemberByRow;
window.resetMemberFormMode = resetMemberFormMode;
window.openMemberEdit = openMemberEdit;
window.submitMemberForm = submitMemberForm;

// ======= RESTORASI DARI BASELINE (fungsi hilang di MG1) =======

// [RESTORED from baseline/core.js] checkMemberLoginLocalRateLimit
function checkMemberLoginLocalRateLimit(loginId, email) {
  try {
   var key = memberLoginThrottleKey(loginId, email);
   var now = Date.now();
   var arr = JSON.parse(localStorage.getItem(key) || '[]').filter(function(t){ return now - t < MEMBER_LOGIN_RATE_WINDOW_MS; });
   if (arr.length >= MEMBER_LOGIN_RATE_LIMIT) {
    var retryMs = MEMBER_LOGIN_RATE_WINDOW_MS - (now - arr[0]);
    return {allowed:false, retrySeconds:Math.max(1, Math.ceil(retryMs / 1000))};
   }
   arr.push(now);
   localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {}
  return {allowed:true, retrySeconds:0};
 }

// [RESTORED from baseline/member-kpi.js] closeAttitudeModal
function closeAttitudeModal() {
 const modal = document.getElementById('attitude-modal');
 hideModalAnimated(modal);
 }

// [RESTORED from baseline/member-kpi.js] closeKpiEventModal
function closeKpiEventModal() {
 const modal = document.getElementById('kpi-event-modal');
 hideModalAnimated(modal);
 }

// [RESTORED from baseline/member-kpi.js] onKpiEventJenisChange
function onKpiEventJenisChange() {
 const jenis = document.getElementById('kpi-event-jenis').value;
 document.getElementById('kpi-event-target-member-wrapper').classList.toggle('hidden', jenis !== 'Member Exclusion');
 document.getElementById('kpi-event-jam-wrapper').classList.toggle('hidden', jenis !== 'Partial Adjustment');
 }

// [RESTORED from baseline/member-kpi.js] openAttitudeModal
 // ==== BARU (28 Agu): MODAL NILAI ATTITUDE (submitAttitudeAssessment) ====
 function openAttitudeModal() {
 const now = new Date();
 document.getElementById('attitude-periode').value = getLocalPeriodeYyyyMm(now);
 populateMemberSelectOptions('attitude-member-id', 'user_id');
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

// [RESTORED from baseline/member-kpi.js] openKpiEventModal
 // ---- Panduan Rekonsiliasi (accordion, khusus Developer, sekarang dibuka lewat modal) ----
 function openKpiEventModal() {
 document.getElementById('kpi-event-jenis').value = 'Full Exclusion';
 document.getElementById('kpi-event-tanggal').value = getLocalDateYyyyMmDd();
 document.getElementById('kpi-event-pit-area').value = '';
 populateMemberSelectOptions('kpi-event-target-member', 'nama');
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

// [RESTORED from baseline/core.js] startMemberLoginCountdown
function startMemberLoginCountdown(seconds,message) {
  seconds=Math.max(1,parseInt(seconds,10)||1); var li=document.getElementById('member-login-id-input'), em=document.getElementById('member-login-email-input'); var loginId=(li?li.value:'').trim(), email=(em?em.value:'').trim(); memberLoginCountdownUntil=Date.now()+seconds*1000;
  try{localStorage.setItem(memberLoginCountdownStorageKey(loginId,email),String(memberLoginCountdownUntil));}catch(e){}
  if(memberLoginCountdownTimer)clearInterval(memberLoginCountdownTimer); var b=document.getElementById('member-login-submit'); if(b){b.disabled=true;b.classList.add('opacity-60','cursor-wait');}
  function tick(){var remain=Math.max(0,Math.ceil((memberLoginCountdownUntil-Date.now())/1000)); if(remain<=0){try{localStorage.removeItem(memberLoginCountdownStorageKey(loginId,email));}catch(e){} stopMemberLoginCountdown(); setMemberLoginStatus(currentLang === 'en' ? 'Lockout finished. Please try logging in again.' : 'Lockout selesai. Silakan coba login kembali.',false); return;} setMemberLoginStatus((message||'Login sementara dikunci.')+' | Coba lagi dalam '+formatMemberCountdown(remain),false);}
  tick(); memberLoginCountdownTimer=setInterval(tick,250);
 }

// [RESTORED from baseline/core.js] stopMemberLoginCountdown
function stopMemberLoginCountdown() { if(memberLoginCountdownTimer) clearInterval(memberLoginCountdownTimer); memberLoginCountdownTimer=null; memberLoginCountdownUntil=0; var b=document.getElementById('member-login-submit'); if(b){b.disabled=false;b.classList.remove('opacity-60','cursor-wait');} }

// [RESTORED from baseline/member-kpi.js] submitAttitudeAssessment
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

// [RESTORED from baseline/member-kpi.js] submitKpiEvent
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

// [DIHAPUS -- kode duplikat, versi aktif yang benar ada di modules/settings.js]

// [RESTORED from baseline/core.js] syncMemberPinConfirmation
 function syncMemberPinConfirmation() {
 const form = document.getElementById('kpiManagerForm');
 const statusMsg = document.getElementById('member-form-status-msg');
 if (!form || !statusMsg) return;

 const pinInput = form.elements.pin;
 const pinConfirmInput = form.elements.pin_confirm;
 if (!pinInput || !pinConfirmInput) return;

 // Normalisasi hanya untuk validasi UI: PIN memang harus 6 digit.
 // Ini mencegah pesan mismatch lama tertinggal setelah kedua kolom sudah sama.
 const pin = String(pinInput.value || '').replace(/\D/g, '').slice(0, 6);
 const pinConfirm = String(pinConfirmInput.value || '').replace(/\D/g, '').slice(0, 6);

 if (pinInput.value !== pin) pinInput.value = pin;
 if (pinConfirmInput.value !== pinConfirm) pinConfirmInput.value = pinConfirm;

 const bothValid = /^\d{6}$/.test(pin) && /^\d{6}$/.test(pinConfirm);
 const same = bothValid && pin === pinConfirm;

 // Jika sudah sama, HAPUS pesan mismatch lama tanpa bergantung pada dataset.errorCode.
 if (same) {
  statusMsg.dataset.errorCode = '';
  if (statusMsg.innerText === 'Konfirmasi PIN tidak sama.' || statusMsg.innerText === 'PIN confirmation does not match.') {
   statusMsg.className = 'text-xs hidden';
   statusMsg.innerText = '';
  }
  statusMsg.classList.add('hidden');
 }
 }

// [RESTORED from baseline/core.js] toggleMemberSessionMenu
function toggleMemberSessionMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('member-session-menu');
  if (!menu) return;
  menu.classList.toggle('hidden');
  if (!menu.classList.contains('hidden') && window.lucide && typeof window.lucide.createIcons === 'function') {
   window.lucide.createIcons();
  }
}
