/* ============================================================
 * MINE GEOLOGIST -- SERVICE WORKER (PWA update notification)
 * v90.2.120: index.html dipecah jadi 5 file JS terpisah (core/produksi/barging/
 * member-kpi/settings.js) -- markup HTML TIDAK berubah. Precache sekarang mendaftar
 * ke-6 file (index.html + 5 JS) satu-satu, supaya browser bisa deteksi update per-file
 * granular: kalau cuma member-kpi.js berubah, 4 file lain dapat 304 Not Modified,
 * TIDAK perlu download ulang semuanya (beda dari skema lama, 1 file 1MB monolitik).
 * ============================================================ */
const CACHE_NAME = 'mine-geologist-build-20260829e';

const APP_SHELL = [
  './',
  './index.html',
  './core.js',
  './produksi.js',
  './barging.js',
  './member-kpi.js',
  './settings.js',
  './manifest.json',
  './favicon.ico',
  './favicon-32.png',
  './favicon-16.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      )
    )
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
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

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

  // BARU v90.2.120: untuk file .js (5 file baru), pakai network-first juga (bukan
  // cache-first) -- supaya perubahan 1 file JS langsung kepakai begitu online, TIDAK
  // ketahan cache lama sampai CACHE_NAME dinaikkan lagi. Aset statis lain (manifest,
  // ikon) tetap cache-first demi kecepatan, jarang berubah.
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

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
