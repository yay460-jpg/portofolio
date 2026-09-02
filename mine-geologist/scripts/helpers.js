// ============================================================
// HELPERS.JS -- Fungsi utilitas (clean, format, klasifikasi, modal)
// FINAL v90.2.140 — Issue + Chat fully implemented
// ============================================================

// ============================================================
// CLEANING & PARSING
// ============================================================

/**
 * Bersihkan nilai angka dari berbagai format (ribuan, desimal)
 * Fungsi ini KHUSUS untuk field TONASE (nilai besar, bisa pakai pemisah ribuan)
 * JANGAN dipakai untuk field persentase (Ni/Fe/Co/MgO/SiO2/SM) -- pakai cleanPercentValue()
 */
function cleanNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  let s = val.toString().trim();
  if (s === '') return 0;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    s = s.replace(',', '.');
  } else if (hasDot && !hasComma) {
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      s = s.replace('.', '');
    }
  }

  return parseFloat(s) || 0;
}

/**
 * Bersihkan nilai persentase (Ni/Fe/Co/MgO/SiO2/SM)
 * TANPA heuristik pemisah ribuan -- titik SELALU dianggap desimal.
 * Ini mencegah angka 1.234% (desimal) salah dibaca 1234 (ribuan)
 */
function cleanPercentValue(val) {
  if (val === null || val === undefined || val === '') return 0;
  let s = val.toString().trim();
  if (s === '') return 0;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    s = s.replace(',', '.');
  }
  // TIDAK ADA cabang "hasDot && !hasComma" -- titik tetap desimal
  return parseFloat(s) || 0;
}

/**
 * Parse nilai "Accuracy" (bisa "96.5%" atau "96.5" atau "-")
 */
function parseAccuracyValue(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s || s === '-') return null;
  const m = s.match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(',', '.'));
  return isNaN(n) ? null : n;
}

// ============================================================
// DATE & TIME FORMATTING
// ============================================================

function _formatDateWithTz(dateObj, tz, format) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  if (format === 'yyyy-MM-dd') return year + '-' + month + '-' + day;
  if (format === 'HH:mm') return hours + ':' + minutes;
  if (format === 'HH:mm:ss') return hours + ':' + minutes + ':' + seconds;
  if (format === 'dd/MM/yyyy') return day + '/' + month + '/' + year;
  if (format === 'dd MMM yyyy, HH:mm') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return day + ' ' + months[d.getMonth()] + ' ' + year + ', ' + hours + ':' + minutes;
  }
  return year + '-' + month + '-' + day;
}

function formatTanggal(value) {
  if (isDateValue(value)) {
    const tz = (typeof regionalTimeSettings !== 'undefined' && regionalTimeSettings && regionalTimeSettings.timezone) || 'Asia/Jakarta';
    return _formatDateWithTz(value, tz, 'yyyy-MM-dd');
  }
  return value;
}

function formatWaktu(value) {
  if (isDateValue(value)) {
    const tz = (typeof regionalTimeSettings !== 'undefined' && regionalTimeSettings && regionalTimeSettings.timezone) || 'Asia/Jakarta';
    return _formatDateWithTz(value, tz, 'HH:mm');
  }
  if (!value) return '';
  return value;
}

function formatChatTimestamp(value) {
  if (isDateValue(value)) {
    const tz = (typeof regionalTimeSettings !== 'undefined' && regionalTimeSettings && regionalTimeSettings.timezone) || 'Asia/Jakarta';
    return _formatDateWithTz(value, tz, 'dd MMM yyyy, HH:mm');
  }
  return value || '';
}

function formatChatSplitTimestamp(dateValue, timeValue) {
  const tz = (typeof regionalTimeSettings !== 'undefined' && regionalTimeSettings && regionalTimeSettings.timezone) || 'Asia/Jakarta';
  const d = canonicalSplitDate(dateValue, tz);
  const t = canonicalSplitTime(timeValue, tz);
  if (!d && !t) return '';
  if (!d) return t;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return d + (t ? ' ' + t : '');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = months[Number(m[2]) - 1] || m[2];
  return m[1] + ' ' + month + ' ' + m[3] + (t ? ', ' + t.slice(0, 5) : '');
}

function canonicalSplitDate(v, tz) {
  if (isDateValue(v)) {
    const tzLocal = tz || 'Asia/Jakarta';
    return _formatDateWithTz(v, tzLocal, 'dd/MM/yyyy');
  }
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    return ('0' + Number(m[1])).slice(-2) + '/' + ('0' + Number(m[2])).slice(-2) + '/' + y;
  }
  return '';
}

function canonicalSplitTime(v, tz) {
  if (isDateValue(v)) {
    const tzLocal = tz || 'Asia/Jakarta';
    return _formatDateWithTz(v, tzLocal, 'HH:mm:ss');
  }
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/^(\d{1,2})[:\.]([0-5]\d)(?:[:\.]([0-5]\d))?$/);
  return m ? ('0' + Number(m[1])).slice(-2) + ':' + m[2] + ':' + (m[3] || '00') : '';
}

function isDateValue(value) {
  return Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime());
}

function parseDiggingDate(val) {
  if (!val) return null;
  const raw = val.toString().split(' ')[0].trim();
  const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11 };
  const partsDash = raw.split('-');
  if (partsDash.length === 3 && isNaN(partsDash[0]) === false && partsDash[1].length <= 3 && isNaN(partsDash[1])) {
    const mon = monthMap[partsDash[1].toLowerCase()];
    let yr = parseInt(partsDash[2], 10);
    if (yr < 100) yr += 2000;
    if (mon !== undefined) return new Date(yr, mon, parseInt(partsDash[0], 10));
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function getLocalDateYyyyMmDd(dateObj) {
  const d = dateObj || new Date();
  const tz = (typeof regionalTimeSettings !== 'undefined' && regionalTimeSettings && regionalTimeSettings.timezone) || 'Asia/Jakarta';
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    if (map.year && map.month && map.day) return map.year + '-' + map.month + '-' + map.day;
  } catch (e) { /* fallback */ }
  return String(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getLocalPeriodeYyyyMm(dateObj) {
  const d = dateObj || new Date();
  const tz = (typeof regionalTimeSettings !== 'undefined' && regionalTimeSettings && regionalTimeSettings.timezone) || 'Asia/Jakarta';
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit' }).formatToParts(d);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    if (map.year && map.month) return map.year + '-' + map.month;
  } catch (e) { /* fallback */ }
  return String(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function formatTanggalExport(value) {
  if (isDateValue(value)) {
    const tz = (typeof regionalTimeSettings !== 'undefined' && regionalTimeSettings && regionalTimeSettings.timezone) || 'Asia/Jakarta';
    return _formatDateWithTz(value, tz, 'yyyy-MM-dd');
  }
  return value;
}

// ============================================================
// CLASSIFY MATERIAL (COG Engine)
// ============================================================

function classifyMaterial(ni, tipeOreInput, smValue) {
  const niNum = parseFloat(ni) || 0;
  const usingInlineFallback = !window.globalCOGConfig;
  const cfg = window.globalCOGConfig || {
    Sapro: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7 },
    Limo: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7 },
    Limo_Aktif: false,
    SM_Threshold_AutoDetect: 3
  };

  if (usingInlineFallback && typeof window.showCogFallbackWarning_ === 'function') {
    window.cogConfigUsingFallback = true;
    window.showCogFallbackWarning_();
  }

  let tipeOreFinal = (tipeOreInput || 'Sapro').trim();
  const tipeOreNorm = tipeOreFinal.toLowerCase();
  if (tipeOreNorm === 'auto') tipeOreFinal = 'Auto';
  else if (tipeOreNorm === 'sapro') tipeOreFinal = 'Sapro';
  else if (tipeOreNorm === 'limo') tipeOreFinal = 'Limo';

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
  if (niNum <= 0) {
    classGrade = 'N/A';
  } else if (niNum < batas.Batas_Waste_LG) {
    classGrade = 'Waste';
  } else if (niNum < batas.Batas_LG_MG) {
    classGrade = 'LG';
  } else if (niNum < batas.Batas_MG_HG) {
    classGrade = 'MG';
  } else if (niNum < batas.Batas_HG_VHG) {
    classGrade = 'HG';
  } else {
    classGrade = 'VHG';
  }

  return { classGrade, tipeOreFinal };
}

// ============================================================
// GRADE COLOR PRESETS
// ============================================================

const GRADE_COLOR_PRESETS = {
  merah: { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
  abu: { text: 'text-slate-400', bg: 'bg-slate-700/40', border: 'border-slate-600/40' },
  kuning: { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  biru: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  hijau: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }
};

const GRADE_COLOR_DEFAULTS = {
  Waste: 'abu',
  LG: 'kuning',
  MG: 'biru',
  HG: 'hijau',
  VHG: 'hijau'
};

function getGradeColorPreset(classGrade) {
  const cfg = window.globalCOGConfig || {};
  const colorKey = cfg['Warna_' + classGrade] || GRADE_COLOR_DEFAULTS[classGrade] || 'abu';
  return GRADE_COLOR_PRESETS[colorKey] || GRADE_COLOR_PRESETS['abu'];
}

function getGradeTextClass(classGrade) {
  if (classGrade === 'N/A' || !classGrade) return 'text-slate-500';
  return getGradeColorPreset(classGrade).text;
}

function renderClassGradeBadge(classGrade) {
  if (classGrade === 'N/A' || !classGrade) {
    return '<span class="px-2 py-0.5 rounded-md text-[11px] bg-slate-700/40 text-slate-400 border border-slate-600/40 font-semibold">N/A</span>';
  }
  const preset = getGradeColorPreset(classGrade);
  return `<span class="px-2 py-0.5 rounded-md text-[11px] ${preset.bg} ${preset.text} border ${preset.border} font-semibold">${classGrade}</span>`;
}

// ============================================================
// MODAL HELPERS (animasi buka/tutup)
// ============================================================

function showModalAnimated(modal) {
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.classList.remove('modal-anim-in');
  void modal.offsetWidth; // paksa reflow
  modal.classList.add('modal-anim-in');
}

function hideModalAnimated(modal) {
  if (!modal) return;
  modal.classList.remove('modal-anim-in');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 200);
}

// ============================================================
// NOTICE & CONFIRM MODALS
// ============================================================

let pendingConfirmResolve = null;

function showNoticeModal(title, message) {
  const titleEl = document.getElementById('notice-title');
  const msgEl = document.getElementById('notice-message');
  if (titleEl) titleEl.innerText = title;
  if (msgEl) msgEl.innerText = message;
  const modal = document.getElementById('notice-modal');
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeNoticeModal() {
  const modal = document.getElementById('notice-modal');
  hideModalAnimated(modal);
}

function showConfirmModal(title, message) {
  return new Promise(function(resolve) {
    pendingConfirmResolve = resolve;
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = message;
    const modal = document.getElementById('confirm-modal');
    showModalAnimated(modal);
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  });
}

function closeConfirmModal(result) {
  const modal = document.getElementById('confirm-modal');
  hideModalAnimated(modal);
  const resolve = pendingConfirmResolve;
  pendingConfirmResolve = null;
  if (resolve) resolve(Boolean(result));
}

// ============================================================
// APP LOADING OVERLAY
// ============================================================

let appLoadingDepth = 0;

function showAppLoading(title, message) {
  const overlay = document.getElementById('app-loading-overlay');
  const titleEl = document.getElementById('app-loading-title');
  const messageEl = document.getElementById('app-loading-message');
  if (!overlay) return;
  appLoadingDepth++;
  if (titleEl) titleEl.textContent = title || (window.currentLang === 'en' ? 'Processing...' : 'Memproses...');
  if (messageEl) messageEl.textContent = message || (window.currentLang === 'en' ? 'Please wait...' : 'Mohon tunggu...');
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

// ============================================================
// SIDEBAR COLLAPSE
// ============================================================

function toggleSidebarCollapse() {
  const sidebar = document.getElementById('main-sidebar');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
  try {
    localStorage.setItem('mine_sidebar_collapsed', isCollapsed ? '1' : '0');
  } catch (e) { /* localStorage tidak tersedia */ }
}

function initSidebarCollapseState() {
  try {
    const saved = localStorage.getItem('mine_sidebar_collapsed');
    if (saved === '1') {
      const sidebar = document.getElementById('main-sidebar');
      if (sidebar) sidebar.classList.add('sidebar-collapsed');
    }
  } catch (e) { /* default expanded */ }
}

// ============================================================
// COG FALLBACK WARNING (toast peringatan)
// ============================================================

window.cogConfigUsingFallback = false;
window.cogFallbackToastShown = false;

function showCogFallbackWarning_() {
  if (window.cogFallbackToastShown) return;
  window.cogFallbackToastShown = true;
  const toast = document.createElement('div');
  toast.id = 'cog-fallback-toast';
  toast.className = 'fixed bottom-4 left-4 z-[95] max-w-xs rounded-xl border border-amber-500/40 bg-slate-900/95 backdrop-blur-md shadow-2xl p-3.5';
  toast.innerHTML = `
    <div class="flex items-start gap-2.5">
      <div class="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 shrink-0"><i data-lucide="triangle-alert" class="w-3.5 h-3.5"></i></div>
      <div class="min-w-0 flex-1">
        <p class="text-title text-xs font-bold">${window.currentLang === 'en' ? 'Using default COG parameters' : 'Memakai parameter COG default'}</p>
        <p class="text-slate-400 text-[10px] font-medium mt-0.5">${window.currentLang === 'en' ? 'Failed to load COGConfig from sheet. Grade classification (HG/MG/LG/Waste) currently uses fallback numbers, not the live configured values.' : 'Gagal memuat COGConfig dari sheet. Klasifikasi Grade (HG/MG/LG/Waste) saat ini memakai angka default, bukan nilai yang benar-benar berlaku.'}</p>
        <div class="flex gap-2 mt-2.5">
          <button onclick="document.getElementById('cog-fallback-toast')?.remove()" class="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-all cursor-pointer">${window.currentLang === 'en' ? 'Understood' : 'Mengerti'}</button>
          <button onclick="document.getElementById('cog-fallback-toast')?.remove(); window.fetchCOGConfig && window.fetchCOGConfig();" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer">${window.currentLang === 'en' ? 'Retry' : 'Coba Lagi'}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(toast);
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

// ============================================================
// OTHER HELPERS
// ============================================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.innerText = str || '';
  return div.innerHTML;
}

function memberInitials(name, loginId) {
  const sourceName = (name || loginId || 'Member').trim();
  const words = sourceName.replace(/[_-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return sourceName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'ME';
}

function setLoginButtonLoading(buttonId, spinnerId, loading, labelId, loadingLabel) {
  const button = document.getElementById(buttonId);
  const spinner = document.getElementById(spinnerId);
  const label = labelId ? document.getElementById(labelId) : null;
  if (!button) return;
  button.disabled = !!loading;
  button.classList.toggle('opacity-60', !!loading);
  button.classList.toggle('cursor-wait', !!loading);
  if (spinner) spinner.classList.toggle('hidden', !loading);
  if (buttonId === 'dev-login-submit') {
    const lockIcon = document.getElementById('dev-login-lock-icon');
    if (lockIcon) lockIcon.classList.toggle('hidden', !!loading);
  }
  if (label && loadingLabel) {
    if (loading) {
      if (!label.dataset.idleText) label.dataset.idleText = label.textContent;
      label.textContent = loadingLabel;
    } else if (label.dataset.idleText) {
      label.textContent = label.dataset.idleText;
    }
  }
}

// ============================================================
// FALLBACK / PLACEHOLDER FUNCTIONS (stub yang aman)
// ============================================================

// Catatan: window.updateDashboard TIDAK lagi dideklarasikan di sini.
// Implementasi asli ada di main.js. Hapus fallback untuk mencegah timpa.

window.populateReporterDropdown = function() {
  const select = document.getElementById('reporter-dropdown');
  if (!select) return;
  select.innerHTML = '';
  const members = window.globalMemberData || [];
  members.forEach(function(m) {
    const nama = m['nama'] || m['name'] || '';
    if (nama) {
      const opt = document.createElement('option');
      opt.value = nama;
      opt.textContent = nama;
      select.appendChild(opt);
    }
  });
  if (select.options.length === 0) {
    const opt = document.createElement('option');
    opt.value = 'Admin';
    opt.textContent = 'Admin';
    select.appendChild(opt);
  }
};

window.populateNameOptions = function(selectElement) {
  if (!selectElement) return;
  selectElement.innerHTML = '';
  const members = window.globalMemberData || [];
  members.forEach(function(m) {
    const nama = m['nama'] || m['name'] || '';
    if (nama) {
      const opt = document.createElement('option');
      opt.value = nama;
      opt.textContent = nama;
      selectElement.appendChild(opt);
    }
  });
  if (selectElement.options.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Tidak ada member';
    selectElement.appendChild(opt);
  }
};

window.getLoggedInChatIdentity = function() {
  const memberToken = localStorage.getItem('mine_member_token');
  const devToken = localStorage.getItem('mine_dev_token');
  let sender = localStorage.getItem('mine_chat_sender') || '';
  let role = '';
  if (memberToken) {
    role = localStorage.getItem('mine_member_role_id') || 'MEMBER';
    if (!sender) sender = localStorage.getItem('mine_member_user_name') || 'Member';
  } else if (devToken) {
    role = 'DEVELOPER';
    if (!sender) sender = localStorage.getItem('mine_user_name') || 'Developer';
  }
  return { sender: sender || 'Guest', role: role };
};

// [UPDATED dari baseline -- versi lama pakai ID elemen HTML yang sudah tidak dipakai index.html]
 // Kontrol akses fitur Dome -- sengaja 2 fungsi terpisah (assign vs lihat riwayat), bukan 1
 // pengecekan yang dipakai berulang -- supaya kalau nanti mau diubah (misal riwayat dibuka
 // untuk semua member tapi assign tetap dikunci developer), cukup ubah DI SINI SAJA, tidak
 // perlu bongkar ulang semua tempat yang memakainya. Saat ini keduanya sama: developer-only.
 // v90.2.104: Update Tujuan EFO/ETO/Disposal -- dibuka utk Developer+Supervisor,
 // sama pola dengan canCreateRca(). Matching permission granular server-side
 // 'digging.destination.update' (updatediggingids sudah dikeluarkan dari daftar
 // isDeveloperProtectedAction_ di backend). Server-side tetap otoritas akhir.
 function updateDeveloperAccessUI() {
 const lockedView = document.getElementById('dev-locked-view');
 const unlockedView = document.getElementById('dev-unlocked-view');
 const btnFormMember = document.getElementById('btn-open-form-member');
 const csvOption = document.getElementById('export-csv-option');
 const btnPrintView = document.getElementById('btn-print-view');
 const btnChatDeleteAll = document.getElementById('btn-chat-delete-all');
 const btnIssueDeleteAll = document.getElementById('btn-issue-delete-all');
 const devCleanupPanel = document.getElementById('dev-cleanup-panel');
 const panelResetProject = document.getElementById('panel-reset-project');
 const panelResetMemberPin = document.getElementById('panel-reset-member-pin'); // BARU (27 Agu)
 const sidebarDevIdentityCard = document.getElementById('sidebar-dev-identity-card');
 const unlocked = isDeveloperUnlocked();

 // BARU (22 Agu): kartu identitas Developer di sidebar bawah -- muncul HANYA saat
 // Developer Access ter-unlock (PIN benar), hilang total saat locked/logout. Pakai
 // pola add/remove 'flex' eksplisit (bukan cuma toggle 'hidden') -- konsisten dgn
 // showModalAnimated/hideModalAnimated di file ini, krn elemen ini butuh display:flex
 // (items-center) begitu ditampilkan, bukan display default div.
 if (sidebarDevIdentityCard) {
  if (unlocked) {
   sidebarDevIdentityCard.classList.remove('hidden');
   sidebarDevIdentityCard.classList.add('flex');
  } else {
   sidebarDevIdentityCard.classList.add('hidden');
   sidebarDevIdentityCard.classList.remove('flex');
  }
 }

 if (panelResetProject) {
  panelResetProject.classList.toggle('hidden', !unlocked);
 }

 if (panelResetMemberPin) {
  panelResetMemberPin.classList.toggle('hidden', !unlocked);
 }

 // BARU (28 Agu)
 const panelKpiEventApproval = document.getElementById('panel-kpi-event-approval');
 if (panelKpiEventApproval) {
  panelKpiEventApproval.classList.toggle('hidden', !unlocked);
  if (unlocked) loadKpiEventApprovalList();
 }

 // BARU (v90.2.117)
 const panelFormulaKpi = document.getElementById('panel-formula-kpi');
 if (panelFormulaKpi) {
  panelFormulaKpi.classList.toggle('hidden', !unlocked);
  if (unlocked && panelFormulaKpi.dataset.kpiFormulaLoaded !== '1') {
   panelFormulaKpi.dataset.kpiFormulaLoaded = '1';
   loadKpiFormulaConfig();
  }
  if (!unlocked) panelFormulaKpi.dataset.kpiFormulaLoaded = '';
 }

 if (devCleanupPanel) {
   devCleanupPanel.classList.toggle('hidden', !unlocked);
   if (unlocked && devCleanupPanel.dataset.retentionLoaded !== '1') {
    devCleanupPanel.dataset.retentionLoaded = '1';
    loadRetentionPolicy();
    loadSessionCachePolicy();
    loadApiAbuseGuardPolicy();
   }
   if (!unlocked) devCleanupPanel.dataset.retentionLoaded = '';
  }

 if (btnChatDeleteAll) {
  btnChatDeleteAll.classList.toggle('hidden', !unlocked);
  btnChatDeleteAll.classList.toggle('flex', unlocked);
 }
 if (btnIssueDeleteAll) {
  btnIssueDeleteAll.classList.toggle('hidden', !unlocked);
  btnIssueDeleteAll.classList.toggle('flex', unlocked);
 }

 if (btnPrintView) {
  btnPrintView.classList.toggle('hidden', !unlocked);
  btnPrintView.classList.toggle('flex', unlocked);
 }

 if (csvOption) {
  csvOption.innerText = unlocked
  ? ((translations[currentLang] && translations[currentLang].opt_csv) || '📊 Ekspor CSV')
  : '🔒 ' + (currentLang === 'en' ? 'Export CSV' : 'Ekspor CSV');
 }

 if (lockedView && unlockedView) {
  lockedView.classList.toggle('hidden', unlocked);
  unlockedView.classList.toggle('hidden', !unlocked);
  unlockedView.classList.toggle('flex', unlocked);
 }
 if (btnFormMember) {
  btnFormMember.classList.toggle('opacity-50', !unlocked);
  btnFormMember.title = unlocked ? '' : (currentLang === 'en' ? 'Locked -- unlock Developer Access in Settings first.' : 'Terkunci -- buka Akses Developer di Settings terlebih dahulu.');
 }
 var btnUpdateTujuan = document.getElementById('btn-open-update-tujuan');
 if (btnUpdateTujuan) {
  btnUpdateTujuan.classList.toggle('hidden', !canAssignDome());
 }
 var btnBargeShipment = document.getElementById('btn-open-form-barge-shipment');
 if (btnBargeShipment) {
  btnBargeShipment.classList.toggle('hidden', !canManageBarge());
  btnBargeShipment.classList.toggle('flex', canManageBarge());
 }
 var btnRca = document.getElementById('btn-open-form-rca');
 if (btnRca) {
  btnRca.classList.toggle('hidden', !canManageRca());
  btnRca.classList.toggle('flex', canManageRca());
 }
 var btnPitActual = document.getElementById('btn-open-form-pitactual');
 if (btnPitActual) {
  btnPitActual.classList.toggle('hidden', !canManagePitActual());
  btnPitActual.classList.toggle('inline-flex', canManagePitActual());
 }
 var panelGuide = document.getElementById('panel-guide-rekonsiliasi');
 if (panelGuide) {
  panelGuide.classList.toggle('hidden', !isDeveloperUnlocked());
 }
 // BARU: panel Parameter Global (gabungan 3 kartu: COG/Flag/Bucket & Sampel), sama pola
 // dengan panel Panduan Rekonsiliasi.
 var panelParameterGlobal = document.getElementById('panel-parameter-global');
 if (panelParameterGlobal) {
  panelParameterGlobal.classList.toggle('hidden', !isDeveloperUnlocked());
 }
 // v90.2.100: panel Padatkan Baris Kosong, sama pola dengan panel Developer lain.
 var devCompactPanel = document.getElementById('dev-compact-panel');
 if (devCompactPanel) {
  devCompactPanel.classList.toggle('hidden', !isDeveloperUnlocked());
 }
 }

// [UPDATED dari baseline -- tambah pengecekan unlock + isi identity]
 function openDeveloperConsoleModal() {
  if (!isDeveloperUnlocked()) {
   showNoticeModal(currentLang === 'en' ? 'Developer Access Locked' : 'Akses Developer Terkunci', currentLang === 'en' ? 'Unlock Developer Access first.' : 'Buka Akses Developer terlebih dahulu.');
   return;
  }
  const modal = document.getElementById('developer-console-modal');
  const identity = document.getElementById('developer-console-identity');
  const name = (localStorage.getItem('mine_user_name') || localStorage.getItem('mine_user_id') || 'Developer').trim();
  if (identity) identity.textContent = (currentLang === 'en' ? 'Access active as: ' : 'Akses aktif sebagai: ') + name;
  updateDeveloperAccessUI();
  showModalAnimated(modal);
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
 }

window.closeDeveloperConsoleModal = function() {
  const modal = document.getElementById('developer-console-modal');
  if (modal) hideModalAnimated(modal);
};

// CATATAN RESTORASI: 6 stub di bawah ini (refreshSecuritySession,
// refreshMemberSecuritySession, loadActiveMemberSessions, renderMonthlyTrend,
// initResetProjectControls, initCompactBlankRowsControls) DIHAPUS -- semuanya
// sudah punya implementasi ASLI dari baseline yang direstorasi ke file yang
// benar (scripts/auth.js dan modules/settings.js/reconciliation.js), yang
// dimuat SETELAH helpers.js. Stub lama dibiarkan berisiko: kalau urutan
// <script> pernah berubah, versi stub (no-op) bisa menimpa versi asli.

// loadRegionalTimeSettings: stub dihapus, implementasi asli sudah direstorasi
// ke modules/settings.js (dimuat setelah file ini).

window.applyRegionalTimeSettings = function(settings) {
  console.debug('applyRegionalTimeSettings called', settings);
};

// ============================================================
// IMPLEMENTASI ISSUE + CHAT (FINAL, MENGGANTI STUB)
// ============================================================

// --- ISSUE ---

// [DIHAPUS -- kode mati, versi aktif yang benar ada di modules/issue.js yang dimuat setelah file ini]

/**
 * Render daftar issue berdasarkan filter status yang aktif.
 * Filter diambil dari tombol dengan id #issue-filter-open, #issue-filter-progress, #issue-filter-close
 * atau menggunakan nilai dari elemen dengan id #issue-status-filter.
 * Jika tidak ada, tampilkan semua.
 */
window.renderIssueList = function() {
  const container = document.getElementById('issue-list');
  if (!container) return;

  // Cari status filter yang aktif
  let statusFilter = 'all';
  const btnOpen = document.getElementById('issue-filter-open');
  const btnProgress = document.getElementById('issue-filter-progress');
  const btnClose = document.getElementById('issue-filter-close');
  if (btnOpen && btnOpen.classList.contains('active')) statusFilter = 'open';
  else if (btnProgress && btnProgress.classList.contains('active')) statusFilter = 'progress';
  else if (btnClose && btnClose.classList.contains('active')) statusFilter = 'close';

  const data = window.globalIssueRawData || [];
  const filtered = data.filter(item => {
    const status = (item.status || '').toLowerCase();
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return status === 'open' || status === '';
    if (statusFilter === 'progress') return status === 'progress' || status === 'in progress';
    if (statusFilter === 'close') return status === 'close' || status === 'closed';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-center text-slate-500 text-xs py-6">' +
      (window.currentLang === 'en' ? 'No issues found.' : 'Tidak ada issue.') +
    '</p>';
    return;
  }

  // Urutkan berdasarkan tanggal terbaru
  filtered.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

  const statusColors = {
    'open': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'close': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  };

  container.innerHTML = filtered.map(item => {
    const statusLower = (item.status || 'open').toLowerCase();
    const statusClass = statusColors[statusLower] || 'bg-slate-700/40 text-slate-400 border-slate-600/40';
    const statusDisplay = item.status || (window.currentLang === 'en' ? 'Open' : 'Terbuka');
    return `<div class="bg-slate-900/40 border border-slate-700/60 rounded-xl p-3 hover:border-blue-500/40 transition-all">
      <div class="flex items-start justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="font-bold text-title text-xs">${escapeHtml(item.masalah || '-')}</span>
          <span class="text-[10px] text-slate-500">${escapeHtml(item.lokasi || '')}</span>
        </div>
        <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusClass} whitespace-nowrap">${statusDisplay}</span>
      </div>
      <div class="mt-1 text-[11px] text-slate-400">${escapeHtml(item.dampak || '')}</div>
      <div class="mt-1 text-[11px] text-slate-300">${window.currentLang === 'en' ? 'Recommendation' : 'Rekomendasi'}: ${escapeHtml(item.rekomendasi || '-')}</div>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[10px] text-slate-500">
        <span>${window.currentLang === 'en' ? 'Date' : 'Tanggal'}: ${item.tanggal || '-'} ${item.waktu || ''}</span>
        <span>${window.currentLang === 'en' ? 'Reporter' : 'Pelapor'}: ${escapeHtml(item.pelapor || '-')}</span>
        <span>PIC: ${escapeHtml(item.pic || '-')}</span>
        <span>${window.currentLang === 'en' ? 'Target' : 'Target'}: ${escapeHtml(item.target || '-')}</span>
      </div>
      ${isDeveloperUnlocked() ? `<div class="mt-2 flex gap-1.5" onclick="event.stopPropagation()">
        <button onclick="deleteIssueRow(${item._row})" class="px-2 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 text-[10px] font-bold">${window.currentLang === 'en' ? 'Delete' : 'Hapus'}</button>
      </div>` : ''}
    </div>`;
  }).join('');

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
};

/**
 * Set filter status issue.
 */
window.setIssueFilter = function(filter) {
  ['open', 'progress', 'close'].forEach(f => {
    const btn = document.getElementById('issue-filter-' + f);
    if (btn) btn.classList.toggle('active', f === filter);
  });
  renderIssueList();
};

/**
 * Delete issue row (Developer only)
 */
window.deleteIssueRow = async function(rowNumber) {
  if (!isDeveloperUnlocked()) {
    showNoticeModal(
      window.currentLang === 'en' ? 'Developer Access Required' : 'Akses Developer Diperlukan',
      window.currentLang === 'en' ? 'Please unlock Developer Access in Settings.' : 'Buka Akses Developer di Settings.'
    );
    return;
  }
  if (!await showConfirmModal(
    window.currentLang === 'en' ? 'Delete Issue' : 'Hapus Issue',
    window.currentLang === 'en' ? 'Delete this issue row?' : 'Hapus baris issue ini?'
  )) return;
  try {
    await postDeveloperAdmin('developerDeleteIssue', { row_number: String(rowNumber) });
    await fetchIssueData();
  } catch (e) {
    showNoticeModal(
      window.currentLang === 'en' ? 'Delete Failed' : 'Hapus Gagal',
      e.message
    );
  }
};

// [DIHAPUS -- kode mati, versi aktif yang benar ada di modules/issue.js yang dimuat setelah file ini]

/**
 * Buka form Issue baru (memanggil popup yang sudah ada di HTML).
 * Pastikan ada elemen dengan id #form-issue-popup-modal dan #issueManagerForm.
 */
window.openFormIssuePopup = function() {
  const form = document.getElementById('issueManagerForm');
  if (form) form.reset();
  const modal = document.getElementById('form-issue-popup-modal');
  if (modal) showModalAnimated(modal);
  if (typeof populateReporterDropdown === 'function') populateReporterDropdown();
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  // Set tanggal & waktu otomatis
  const now = new Date();
  const tz = (typeof regionalTimeSettings !== 'undefined' && regionalTimeSettings && regionalTimeSettings.timezone) || 'Asia/Jakarta';
  const dateStr = _formatDateWithTz(now, tz, 'yyyy-MM-dd');
  const timeStr = _formatDateWithTz(now, tz, 'HH:mm');
  const datetimeEl = document.getElementById('auto-issue-datetime');
  const tanggalField = document.getElementById('issue-field-tanggal');
  const waktuField = document.getElementById('issue-field-waktu');
  if (datetimeEl) datetimeEl.value = dateStr + ' ' + timeStr;
  if (tanggalField) tanggalField.value = dateStr;
  if (waktuField) waktuField.value = timeStr;
};

window.closeFormIssuePopup = function() {
  const modal = document.getElementById('form-issue-popup-modal');
  if (modal) hideModalAnimated(modal);
};

// [DIHAPUS -- kode mati, versi aktif yang benar ada di modules/issue.js yang dimuat setelah file ini]

// --- CHAT ---

// [DIHAPUS -- kode mati, versi aktif yang benar ada di scripts/main.js yang dimuat setelah file ini]

/**
 * Render pesan chat ke dalam #chat-messages.
 */
// [UPDATED dari baseline -- versi lama pakai container ID 'chat-messages' yang tidak ada di HTML (harusnya 'chat-messages-area'), jadi loading spinner tidak pernah hilang]
window.renderChatMessages = function() {
 const area = document.getElementById('chat-messages-area');
 if (!area) return;

 if (globalChatData.length === 0) {
  area.innerHTML = `<div class="text-center py-8 text-slate-500 text-xs font-medium">${currentLang === 'en' ? 'No messages yet. Start the conversation!' : 'Belum ada pesan. Mulai obrolan!'}</div>`;
  return;
 }

 const chatIdentity = getLoggedInChatIdentity();
 const mySender = chatIdentity.sender || '';

 area.innerHTML = globalChatData.map(msg => {
  const isMine = msg.sender === mySender;
  const initials = (msg.sender || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  if (isMine) {
  return `
   <div class="flex items-start justify-end gap-2.5">
   <div class="max-w-[75%]">
    <div class="flex items-baseline gap-1.5 justify-end">
    ${msg.role ? `<span class="text-[10px] text-slate-500 font-medium">${escapeHtml(msg.role)}</span>` : ''}
    <span class="text-xs font-bold text-title">${escapeHtml(msg.sender)}</span>
    </div>
    <div class="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm font-medium shadow-md mt-0.5">${escapeHtml(msg.message)}</div>
    <p class="text-[10px] text-slate-500 font-medium mt-1 text-right">${msg.timestamp}</p>
    ${isDeveloperUnlocked() && msg._row ? `<button type="button" onclick="deleteChatMessage(${msg._row})" class="mt-1 text-[9px] text-rose-300 hover:text-rose-200 font-semibold">Hapus</button>` : ''}
   </div>
   <div class="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">${initials}</div>
   </div>`;
  } else {
  return `
   <div class="flex items-start gap-2.5">
   <div class="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">${initials}</div>
   <div class="max-w-[75%]">
    <div class="flex items-baseline gap-1.5">
    <span class="text-xs font-bold text-title">${escapeHtml(msg.sender)}</span>
    ${msg.role ? `<span class="text-[10px] text-slate-500 font-medium">${escapeHtml(msg.role)}</span>` : ''}
    </div>
    <div class="bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm font-medium mt-0.5">${escapeHtml(msg.message)}</div>
    <p class="text-[10px] text-slate-500 font-medium mt-1">${msg.timestamp}</p>
    ${isDeveloperUnlocked() && msg._row ? `<button type="button" onclick="deleteChatMessage(${msg._row})" class="mt-1 text-[9px] text-rose-300 hover:text-rose-200 font-semibold">Hapus</button>` : ''}
   </div>
   </div>`;
  }
 }).join('');
 };

/**
 * Update badge jumlah pesan belum terbaca di tab Chat.
 */
window.updateChatUnreadBadge = function() {
  const badge = document.getElementById('chat-unread-badge');
  if (!badge) return;
  const data = window.globalChatData || [];
  if (data.length === 0) {
    badge.classList.add('hidden');
    return;
  }
  const lastRow = data.reduce((max, item) => Math.max(max, item._row || 0), 0);
  const seenRow = window.chatLastSeenRow || 0;
  const unread = data.filter(item => (item._row || 0) > seenRow).length;
  if (unread > 0) {
    badge.textContent = unread;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
};

/**
 * Scroll container chat ke bawah.
 */
window.scrollChatToBottom = function() {
  const container = document.getElementById('chat-messages-area');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
};

// [DIHAPUS -- kode mati, versi aktif yang benar ada di scripts/main.js yang dimuat setelah file ini]

// [DIHAPUS -- kode mati, versi aktif yang benar ada di scripts/main.js yang dimuat setelah file ini]

// ============================================================
// SESSION IDLE WARNING (diambil dari auth.js, ditaruh di sini
// agar tersedia untuk semua halaman)
// ============================================================

window.sessionIdleWarningEl = null;

// ============================================================
// EXPOSE FUNCTIONS KE GLOBAL WINDOW (agar bisa dipanggil dari HTML onclick)
// ============================================================

window.cleanNumber = cleanNumber;
window.cleanPercentValue = cleanPercentValue;
window.parseAccuracyValue = parseAccuracyValue;
window.formatTanggal = formatTanggal;
window.formatWaktu = formatWaktu;
window.formatChatTimestamp = formatChatTimestamp;
window.formatChatSplitTimestamp = formatChatSplitTimestamp;
window.canonicalSplitDate = canonicalSplitDate;
window.canonicalSplitTime = canonicalSplitTime;
window.formatTanggalExport = formatTanggalExport;
window.isDateValue = isDateValue;
window.parseDiggingDate = parseDiggingDate;
window.getLocalDateYyyyMmDd = getLocalDateYyyyMmDd;
window.getLocalPeriodeYyyyMm = getLocalPeriodeYyyyMm;
window.classifyMaterial = classifyMaterial;
window.getGradeTextClass = getGradeTextClass;
window.renderClassGradeBadge = renderClassGradeBadge;
window.showModalAnimated = showModalAnimated;
window.hideModalAnimated = hideModalAnimated;
window.showNoticeModal = showNoticeModal;
window.closeNoticeModal = closeNoticeModal;
window.showConfirmModal = showConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.showAppLoading = showAppLoading;
window.hideAppLoading = hideAppLoading;
window.toggleSidebarCollapse = toggleSidebarCollapse;
window.initSidebarCollapseState = initSidebarCollapseState;
window.escapeHtml = escapeHtml;
window.memberInitials = memberInitials;
window.setLoginButtonLoading = setLoginButtonLoading;
window.showCogFallbackWarning_ = showCogFallbackWarning_;

// Issue
window.fetchIssueData = window.fetchIssueData;
window.renderIssueList = window.renderIssueList;
window.setIssueFilter = window.setIssueFilter;
window.deleteIssueRow = window.deleteIssueRow;
window.deleteAllIssues = window.deleteAllIssues;
window.openFormIssuePopup = window.openFormIssuePopup;
window.closeFormIssuePopup = window.closeFormIssuePopup;
window.submitIssueForm = window.submitIssueForm;

// Chat
window.fetchChatData = window.fetchChatData;
window.renderChatMessages = window.renderChatMessages;
window.updateChatUnreadBadge = window.updateChatUnreadBadge;
window.scrollChatToBottom = window.scrollChatToBottom;
window.submitChatMessage = window.submitChatMessage;
window.deleteAllChatMessages = window.deleteAllChatMessages;

// ======= RESTORASI DARI BASELINE (fungsi hilang di MG1) =======

// [RESTORED from baseline/core.js] formatMemberCountdown
function formatMemberCountdown(totalSec) { totalSec=Math.max(0,parseInt(totalSec,10)||0); return String(Math.floor(totalSec/60)).padStart(2,'0')+':'+String(totalSec%60).padStart(2,'0'); }

// [RESTORED from baseline/core.js] memberLoginCountdownStorageKey
function memberLoginCountdownStorageKey(loginId, email) { return 'mine_member_login_lock_until_' + sha256Local(memberLoginThrottleKey(loginId, email)); }

// [RESTORED from baseline/core.js] memberLoginThrottleKey
function memberLoginThrottleKey(loginId, email) {
  return 'mine_member_login_attempts_' + sha256Local((loginId + '|' + email).toLowerCase());
 }

// [RESTORED from baseline/core.js] openFormPopup
 function openFormPopup() {
 if (!isDeveloperUnlocked()) {
  showNoticeModal(
  currentLang === 'en' ? 'Form Member Locked' : 'Form Member Terkunci',
  currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first to enable this form.' : 'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu untuk mengaktifkan form ini.'
  );
  return;
 }
 const modal = document.getElementById('form-popup-modal');
 const statusMsg = document.getElementById('member-form-status-msg');
 if (statusMsg) {
  statusMsg.dataset.errorCode = '';
  statusMsg.innerText = '';
  statusMsg.classList.add('hidden');
 }
 showModalAnimated(modal);
 lucide.createIcons();
 resetMemberFormMode(); // pastikan selalu mulai dari mode "tambah baru", bukan nyangkut mode edit sebelumnya

 // Sinkronisasi pesan validasi PIN secara realtime.
 // Listener dipasang sekali per input agar pesan mismatch lama tidak menempel.
 const memberForm = document.getElementById('kpiManagerForm');
 if (memberForm) {
  const pinInput = memberForm.elements.pin;
  const pinConfirmInput = memberForm.elements.pin_confirm;
  [pinInput, pinConfirmInput].forEach((input) => {
   if (!input || input.dataset.pinSyncBound === '1') return;
   input.addEventListener('input', syncMemberPinConfirmation);
   input.addEventListener('change', syncMemberPinConfirmation);
   input.dataset.pinSyncBound = '1';
  });
  syncMemberPinConfirmation();
 }
 }

// [RESTORED from baseline/core.js] parseAccuracyValue_
 function parseAccuracyValue_(raw) {
 if (raw === null || raw === undefined) return null;
 const s = String(raw).trim();
 if (!s || s === '-') return null;
 const m = s.match(/-?\d+(?:[.,]\d+)?/);
 if (!m) return null;
 const n = parseFloat(m[0].replace(',', '.'));
 return isNaN(n) ? null : n;
 }

// [RESTORED from baseline/core.js] resetCompactPreviewState
function resetCompactPreviewState() {
 compactPreviewState={sheet:'',totalRows:0,blankRows:[]};
 const status=document.getElementById('compact-preview-status');
 if(status) status.textContent=translations[currentLang].compact_status_idle;
 updateCompactExecuteButton();
}

// [RESTORED from baseline/core.js] resetProjectData
async function resetProjectData() {
  if(!isDeveloperUnlocked()) return;
  const confirmInput=document.getElementById('reset-project-confirm');
  const typed=confirmInput ? confirmInput.value.trim() : '';
  if(typed!=='RESET PROJECT') { showNoticeModal('Konfirmasi Salah','Ketik persis: RESET PROJECT'); return; }
  const targets=[].slice.call(document.querySelectorAll('.reset-project-target:checked')).map(function(el){return el.value;});
  const member=document.getElementById('reset-project-member');
  if(member && member.checked) targets.push('Member');
  if(!targets.length) { showNoticeModal('Belum Ada Target','Pilih minimal 1 sheet.'); return; }

  const label=targets.join(', ');
  const msg='PERINGATAN: data terpilih akan dikosongkan dan tidak dapat dipulihkan dari aplikasi.\n\nTarget:\n'+label+'\n\nDeveloper Member tetap dipertahankan. Lanjutkan?';
  if(!(await showConfirmModal(currentLang === 'en' ? 'Reset Project' : 'Reset Project', msg))) return;

  const btn=document.getElementById('btn-reset-project');
  const status=document.getElementById('reset-project-status');
  if(btn) { btn.disabled=true; btn.classList.add('opacity-50'); }
  if(status) status.textContent='Reset sedang diproses...';
  try {
    const result=await postDeveloperAdmin('developerResetProjectData',{targets:targets.join(','),confirm_text:typed});
    const cleared=(result.results||[]).map(function(x){return x.sheet+': '+(x.rows||0)+' row';}).join(' | ');
    if(status) status.textContent='Selesai — '+cleared;
    showNoticeModal('Reset Selesai','Data operasional terpilih berhasil dibersihkan. Developer Member tetap dipertahankan.');
    document.querySelectorAll('.reset-project-target').forEach(function(el){el.checked=false;});
    if(member) member.checked=false;
    if(confirmInput) confirmInput.value='';
    updateResetProjectButton();
    try { await Promise.all([fetchChatData(), fetchIssueData(), loadMembersFromSheet()]); } catch(ignore) {}
  } catch(e) {
    if(status) status.textContent='Reset gagal';
    showNoticeModal('Reset Gagal',e.message);
    updateResetProjectButton();
  }
}

// [RESTORED from baseline/produksi.js] setOnceGlobal_
function setOnceGlobal_(fieldName, value) {
  if (alreadySetFields.has(fieldName)) return;
  alreadySetFields.add(fieldName);
  cfg[fieldName] = value;
  }

// (tick tidak direstorasi berdiri sendiri -- sudah ikut terbawa sebagai fungsi
// bersarang di dalam startMemberLoginCountdown() pada modules/member.js)

// [RESTORED from baseline/core.js] updateCompactExecuteButton
function updateCompactExecuteButton() {
 const btn=document.getElementById('btn-compact-execute');
 const select=document.getElementById('compact-sheet-select');
 if(!btn || !select) return;
 const ready=isDeveloperUnlocked() && compactPreviewState.sheet===select.value && compactPreviewState.blankRows.length>0;
 btn.disabled=!ready;
 btn.classList.toggle('opacity-50',!ready);
 btn.classList.toggle('cursor-not-allowed',!ready);
 btn.classList.toggle('bg-indigo-700/30',!ready);
 btn.classList.toggle('bg-indigo-600',ready);
 btn.classList.toggle('hover:bg-indigo-500',ready);
 btn.classList.toggle('cursor-pointer',ready);
}

// [RESTORED from baseline/core.js] updateSplitTotalInfo
 function updateSplitTotalInfo() {
 const infoEl = document.getElementById('update-split-total-info');
 const row = currentOpenDiggingRow;
 if (!row) return;
 const val = document.getElementById('update-tujuan-select').value;
 const isCombo = val.includes('_');

 const tonaseA = parseFloat(document.getElementById('split-a-tonase').value) || 0;
 const tonaseB = isCombo ? (parseFloat(document.getElementById('split-b-tonase').value) || 0) : 0;
 const total = tonaseA + tonaseB;
 const target = row.tonase;
 const selisih = Math.abs(total - target);

 if (selisih < 0.01) {
  infoEl.className = 'text-[11px] font-semibold text-emerald-400';
  infoEl.innerText = (currentLang === 'en' ? 'Total matches: ' : 'Total sudah pas: ') + total.toLocaleString() + ' / ' + target.toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton');
 } else {
  infoEl.className = 'text-[11px] font-semibold text-amber-400';
  infoEl.innerText = (currentLang === 'en' ? 'Total ' : 'Total ') + total.toLocaleString() + ' / ' + target.toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton') + ' (' + (currentLang === 'en' ? 'must match exactly' : 'harus pas persis') + ')';
 }
 }
