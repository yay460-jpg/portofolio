/* ============================================================
 * MINE GEOLOGIST -- SERVICE WORKER (PWA update notification)
 * BARU (dibuat 22 Agu, belum pernah ada sebelumnya di proyek ini -- dikonfirmasi
 * user & pihak A sama-sama belum pernah membuatnya).
 *
 * WAJIB DIBACA SEBELUM DEPLOY VERSI BARU:
 * CACHE_NAME di bawah ini HARUS ikut diubah setiap kali APP_VERSION di index.html
 * (dashboard.html) di-bump. Browser mendeteksi "ada versi baru" dengan membandingkan
 * BYTE file sw.js ini terhadap yang sudah ter-install -- kalau isinya persis sama,
 * Chrome/Edge akan menganggap TIDAK ADA update sama sekali, walau index.html-nya
 * sendiri sudah berubah total. Sinkronkan CACHE_NAME = APP_VERSION setiap rilis.
 * ============================================================ */
const CACHE_NAME = 'mine-geologist-v90.2.100';

// Precache HANYA app shell yang statis (HTML shell, manifest, ikon). SENGAJA TIDAK
// mencakup panggilan ke Google Apps Script (doGet/doPost) -- itu SEMUA data produksi
// LIVE (dashboard, chat, RCA, dsb), wajib selalu diambil segar dari network, tidak
// boleh pernah disajikan dari cache basi.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './favicon-32.png',
  './favicon-16.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll dibungkus per-item supaya 1 aset yang gagal (mis. ikon belum ada di
      // repo) tidak menggagalkan install SW secara keseluruhan.
      Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      )
    )
    // SENGAJA TIDAK memanggil self.skipWaiting() di sini -- SW baru dibiarkan
    // berstatus "waiting" sampai user KONFIRMASI reload lewat toast di UI
    // (lihat postMessage SKIP_WAITING di index.html). Ini mencegah versi baru
    // "memaksa" reload di tengah tim sedang mengisi form/laporan tanpa sepengetahuan mereka.
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Cuma GET yang ditangani SW -- semua POST (submit form, chat, RCA, dsb) SELALU
  // langsung ke network asli, tidak pernah disentuh cache.
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // JANGAN PERNAH cache request ke luar origin (mis. script.google.com/.../exec,
  // Google Fonts, CDN ikon) -- terutama endpoint Apps Script yang berisi data live.
  if (url.origin !== self.location.origin) return;

  // Network-first untuk dokumen HTML (navigasi) -- begitu online, versi TERBARU
  // selalu diutamakan; fallback ke cache HANYA kalau benar-benar offline.
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

  // Aset statis lain (manifest, ikon): cache-first demi kecepatan, fallback network
  // kalau belum ada di cache.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

// Dipicu dari index.html saat user klik "Muat Ulang" di toast notifikasi update --
// baru di titik INI SW baru benar-benar mengambil alih kendali (skipWaiting), bukan otomatis.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
