/* ============================================================
 * MINE GEOLOGIST -- SERVICE WORKER (PWA update notification)
 *
 * FIX (23 Agu): CACHE_NAME DIPISAH TOTAL dari APP_VERSION -- sebelumnya keduanya
 * disamakan (v90.2.100), tapi APP_VERSION SENGAJA ditahan tidak di-bump (kebijakan
 * user: "kumpulkan bump-nya, tunggu arahan"). Akibatnya CACHE_NAME juga ikut BEKU
 * sepanjang sesi ini, walau index.html sudah berubah PULUHAN kali (sidebar collapse,
 * fix avatar, legend chart, dsb) -- PWA yang sudah ter-install TIDAK PERNAH
 * mendeteksi update apapun sepanjang sesi ini, user harus uninstall-reinstall manual
 * tiap kali mau lihat perubahan terbaru.
 *
 * SKEMA BARU: CACHE_NAME pakai penanda build TERPISAH (tanggal+urutan), BUKAN
 * APP_VERSION. Claude WAJIB naikkan nilai ini setiap kali mengirim index.html/sw.js
 * baru ke user -- terlepas dari kapan user memutuskan bump APP_VERSION resmi sendiri.
 * Browser mendeteksi "ada versi baru" dengan membandingkan BYTE file sw.js ini
 * terhadap yang sudah ter-install -- kalau isinya persis sama, Chrome/Edge/PWA app
 * akan menganggap TIDAK ADA update, walau index.html-nya sendiri sudah berubah total.
 * ============================================================ */
const CACHE_NAME = 'mine-geologist-build-20260827c';

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
