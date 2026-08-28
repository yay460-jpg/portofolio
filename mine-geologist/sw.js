/* MINE GEOLOGIST -- SERVICE WORKER (PWA update notification)
 * BUILD: 20260828a
 * CACHE_NAME dipisahkan dari APP_VERSION.
 * Setiap perubahan index.html wajib disertai perubahan build ini
 * agar browser mendeteksi sw.js yang baru.
 * SW baru menunggu sampai user memilih "Muat Ulang".
 */

const CACHE_NAME = 'mine-geologist-build-20260828a';

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
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => {})))
    )
  );
});

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
        .catch(() =>
          caches.match(req).then(
            (cached) => cached || caches.match('./index.html')
          )
        )
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
