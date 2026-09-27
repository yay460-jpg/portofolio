/* ============================================================
 * MINE GEOLOGIST -- SERVICE WORKER (PWA update notification)
 * v90.2.140 - STRUKTUR FOLDER BARU (scripts/, modules/, style/, assets/)
 * ============================================================
 * Update ini menyesuaikan daftar file yang di-cache dengan struktur folder baru:
 * - scripts/ (config, api, i18n, helpers, auth, main)
 * - modules/ (settings, barging, member, digging, validation, reconciliation)
 * - style/ (theme.css)
 * - assets/ (favicon, icon, avatar)
 *
 * CACHE_NAME harus diubah setiap deploy versi baru agar browser mendownload ulang.
 * ============================================================ */

const CACHE_NAME = 'mine-geologist-build-20260904a';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',

  // ====== STYLES ======
  './style/theme.css',

  // ====== SCRIPTS (Core) ======
  './scripts/config.js',
  './scripts/api.js',
  './scripts/i18n.js',
  './scripts/helpers.js',
  './scripts/auth.js',
  './scripts/export.js',
  './scripts/main.js',
  './scripts/bg-particles.js',
  './scripts/splash.js',
  './scripts/member-card-expand.js',

  // ====== MODULES (Fitur per halaman) ======
  './modules/settings.js',
  './modules/barging.js',
  './modules/member.js',
  './modules/digging.js',
  './modules/validation.js',
  './modules/reconciliation.js',
  './modules/issue.js',

  // ====== ASSETS (Ikon & Gambar) ======
  './assets/favicon.ico',
  './assets/favicon-32.png',
  './assets/favicon-16.png',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/avatar-yaya.png',
  './assets/lithosite-logo.png'
];

// ============================================================
// INSTALL: cache semua file shell
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => {
            console.warn('SW: Gagal cache', url);
          })
        )
      )
    )
  );
});

// ============================================================
// ACTIVATE: hapus cache lama, claim clients segera
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ============================================================
// FETCH: strategi network-first untuk JS, cache-first untuk lainnya
// ============================================================
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  // ====== NAVIGASI (HTML) ======
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // ====== FILE JAVASCRIPT (.js) ======
  // Network-first agar update file JS langsung terpakai tanpa harus naik versi CACHE_NAME
  if (url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // ====== FILE STATIS LAINNYA (CSS, gambar, manifest) ======
  // Cache-first untuk kecepatan
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

// ============================================================
// MESSAGE: skipWaiting dari client (untuk update PWA)
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
