/* ============================================================
 * LITHOSITE -- MEMBER APP (Android Prototype) SERVICE WORKER
 *
 * Terpisah TOTAL dari sw.js dashboard utama (index.html/member.html/supervisor.html)
 * -- CACHE_NAME beda, daftar precache beda -- supaya update salah satu tidak pernah
 * memengaruhi cache yang lain. Ikon dipakai BERSAMA dari folder ../assets/ (satu
 * sumber kebenaran utk semua ikon di proyek ini, tidak digandakan).
 *
 * Sama seperti sw.js dashboard utama: Claude WAJIB naikkan CACHE_NAME ini setiap kali
 * mengirim index.html/sw.js baru utk Member App -- browser mendeteksi update dengan
 * membandingkan BYTE file ini, bukan APP_VERSION.
 * ============================================================ */
const CACHE_NAME = 'lithosite-member-app-build-20260906t';

// Precache HANYA app shell statis (HTML shell, manifest, ikon dari folder bersama).
// SENGAJA TIDAK mencakup panggilan ke Google Apps Script (doGet/doPost) -- data
// produksi/chat/KPI dsb WAJIB selalu diambil segar dari network, tidak boleh basi.
// [PARTISI -- 4 Sep, Tahap 6] index.html Tahap 5 dipecah jadi 10 file (1 shared/ +
// 9 scripts/) -- SEMUA WAJIB masuk sini, pelajaran lama (member-card-expand.js
// Master sempat kelewat 1x) jangan terulang di sini.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  '../assets/favicon-32.png',
  '../assets/favicon-16.png',
  '../assets/apple-touch-icon.png',
  '../assets/icon-192.png',
  '../assets/icon-512.png',
  '../assets/lithosite-logo.png',
  '../shared/geo-engine.js',
  './scripts/config.js',
  './scripts/auth.js',
  './scripts/kpi.js',
  './scripts/digging.js',
  './scripts/validasi.js',
  './scripts/peta.js',
  './scripts/chat.js',
  './scripts/issue.js',
  './scripts/settings.js',
  './vendor/pdfjs/pdf.min.js',
  './vendor/pdfjs/pdf.worker.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll dibungkus per-item supaya 1 aset yang gagal tidak menggagalkan install
      // SW secara keseluruhan.
      Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      )
    )
    // STEP 7.5 V9: activate build baru segera agar peta.js terbaru tidak tertahan
    // oleh Service Worker lama yang masih waiting.
    .then(() => self.skipWaiting())
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
  // Cuma GET yang ditangani SW -- semua POST (submit Digging, Chat, Issue, dsb)
  // SELALU langsung ke network asli, tidak pernah disentuh cache.
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // JANGAN PERNAH cache request ke luar origin (script.google.com/.../exec, CDN
  // Tailwind/Lucide, dsb) -- terutama endpoint Apps Script yang berisi data live.
  if (url.origin !== self.location.origin) return;

  // Network-first untuk dokumen HTML (navigasi) -- versi terbaru selalu diutamakan
  // saat online; fallback ke cache HANYA kalau benar-benar offline.
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

  // Aset statis lain (manifest, ikon dari ../assets/): cache-first demi kecepatan,
  // fallback network kalau belum ada di cache.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
