// ============================================================
// CONFIG.JS -- Semua konstanta global aplikasi
// ============================================================

// ------ BACKEND ------
// SATU-SATUNYA titik yang perlu diubah kalau deploy Apps Script baru!
window.GOOGLE_SCRIPT_READ_URL = 'https://script.google.com/macros/s/AKfycbwVeP2inU_-Cm4aazxiaTfulb_ta3OalMdKk9icwqRUNVF-Rz8n9cnhylQuWOspYh2Ztw/exec';

// ------ TIMEOUT & PERFORMANCE ------
window.FETCH_TIMEOUT_MS = 35000;          // 35 detik (naik dari 20 detik -- diagnosa 2 Sep: doPost bisa 20-70+ detik saat sesi menumpuk, lihat fix cleanupSessions_ di backend)
window.CHAT_POLL_INTERVAL = 15000;        // 15 detik (chat polling)
window.ROWS_PER_PAGE = 100;               // Pagination Tabel Digging
window.ISSUE_MAX_AUTO_RETRY = 2;          // Maks retry Issue data

// ------ SESSION & TOKEN ------
window.TOKEN_ROTATION_INTERVAL_MS = 15 * 60 * 1000;       // 15 menit
window.TOKEN_ROTATION_ACTIVITY_WINDOW_MS = 5 * 60 * 1000; // 5 menit
window.MEMBER_SESSION_CHECK_INTERVAL_MS = 30000;          // 30 detik
window.SESSION_IDLE_WARNING_MINUTES = 5;

// ------ VERSI APLIKASI ------
window.APP_VERSION = 'v90.2.140';

// ------ REGIONAL & TIME (Default) ------
window.REGIONAL_TIME_DEFAULTS = {
  timezone: 'Asia/Jakarta',
  locale: 'id-ID',
  dateFormat: 'dd-MMM-yyyy',
  timeFormat: 'HH:mm:ss'
};

// ------ KPI ENGINE (Default) ------
window.KPI_DEFAULTS = {
  activeOption: 'A',
  weights: {
    A: { kehadiran: 20, safety: 20, sampling: 20, laporan: 20, attitude: 20 },
    B: { kehadiran: 15, safety: 35, sampling: 20, laporan: 15, attitude: 15 },
    C: { kehadiran: 15, safety: 15, sampling: 35, laporan: 20, attitude: 15 }
  },
  safetyGate: {
    enabled: false,
    threshold: 70,
    cap: 70
  }
};

// ------ JSA (Job Safety Analysis) ------
// JSA_HTML_CONTENT dan JSA_I18N_EN tetap di i18n.js karena besar
// dan spesifik untuk translasi

// ------ CHANGELOG ------
// CHANGELOG_DATA tetap di i18n.js karena besar dan statis
