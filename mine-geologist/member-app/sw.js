/* ============================================================
 * LITHOSITE -- MEMBER APP (Android Prototype) SERVICE WORKER
 * V24.5 RUNTIME UPDATE — Geometry V1 + Modal V2 -- UI / OFFLINE SHELL
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
const CACHE_NAME = 'lithosite-member-app-v24.5-lock-20260918-maplib3';

// Precache HANYA app shell statis (HTML shell, manifest, ikon dari folder bersama).
// SENGAJA TIDAK mencakup panggilan ke Google Apps Script (doGet/doPost) -- data
// produksi/chat/KPI dsb WAJIB selalu diambil segar dari network, tidak boleh basi.
// [PARTISI -- 4 Sep, Tahap 6] index.html Tahap 5 dipecah jadi 10 file (1 shared/ +
// 9 scripts/) -- SEMUA WAJIB masuk sini, pelajaran lama (member-card-expand.js
// Master sempat kelewat 1x) jangan terulang di sini.
//
// [FIX -- 15 Sep] Pelajaran itu KETERULANG dalam skala jauh lebih besar: peta.js
// displit bertahap jadi 22 file di scripts/map/* dan developer-profile.js ditambah,
// TAPI daftar di bawah ini tidak pernah ikut diupdate. index.html memuat 34 script,
// daftar ini cuma mendaftar 11 -- artinya 23 file berjalan TANPA precache sama
// sekali. Digabung dgn bug kedua (lihat catatan cache.put di handler fetch), file2
// itu TIDAK PERNAH tersimpan walau sudah sukses dimuat berkali-kali saat online ->
// begitu app ditutup & dibuka lagi tanpa internet, tab Peta (dan sebagian besar app,
// krn renderPeta dkk ada di map-ui.js) GAGAL TOTAL.
// [UPDATE -- 17 Sep] Toolbar GPS/Layers + Global Shell Boundary + Settings overlay.
// peta.js, map-ui.js, map-management-compat.js, settings.js, dan index.html
// sudah tercakup di APP_SHELL di bawah; cache version dinaikkan agar browser
// mengambil runtime terbaru dan tidak memakai cache lama.
// Urutan di bawah dibuat PERSIS mengikuti urutan <script> di index.html supaya
// gampang dicek ulang berdampingan tiap kali ada file baru ditambahkan.
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
  '../assets/lithosite-member-developer.png',
  './vendor/pdfjs/pdf.min.js',
  './vendor/pdfjs/pdf.worker.min.js',
  '../shared/geo-engine.js',
  './scripts/config.js',
  './scripts/auth.js',
  './scripts/kpi.js',
  './scripts/digging.js',
  './scripts/validasi.js',
  './scripts/map/map-state.js',
  './scripts/map/map-device-profile.js',
  './scripts/map/map-coordinate.js',
  './scripts/map/map-package.js',
  './scripts/map/map-tile-pyramid.js',
  './scripts/map/map-tile-store.js',
  './scripts/map/map-tile-queue.js',
  './scripts/map/map-runtime-loader.js',
  './scripts/map/map-missing-detail-resolver.js',
  './scripts/map/map-runtime-tile-creation.js',
  './scripts/map/map-background-lifecycle.js',
  './scripts/map/map-upload-save-lifecycle.js',
  './scripts/map/map-surface-lifecycle.js',
  './scripts/map/map-interaction.js',
  './scripts/map/map-ui.js',
  './scripts/peta.js',
  './scripts/map/map-library-contract.js',
  './scripts/map/map-library.js',
  './scripts/map/map-library-capability.js',
  './scripts/map/map-storage-capability.js',
  './scripts/map/map-management-compat.js',
  './scripts/map/map-lifecycle-completion.js',
  './scripts/map/map-package-transfer.js',
  './scripts/chat.js',
  './scripts/issue.js',
  './scripts/settings.js',
  './scripts/developer-profile.js'
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
  // [FIX -- 15 Sep] SEBELUMNYA baris ini cuma `cached || fetch(req)` TANPA
  // menyimpan hasil fetch-nya ke cache. Akibatnya file same-origin apa pun yang
  // TIDAK terdaftar di APP_SHELL akan di-fetch ulang dari network SETIAP KALI dan
  // TIDAK PERNAH tersimpan -- walau sudah sukses dimuat ratusan kali saat online,
  // saat offline tetap gagal. Ini yang bikin 23 file map/* + developer-profile.js
  // (lihat catatan APP_SHELL di atas) mati total offline. Sekarang hasil fetch yang
  // sukses ikut disimpan, jadi file yang kelewat dari APP_SHELL masih punya jaring
  // pengaman -- TAPI APP_SHELL tetap harus lengkap, karena runtime-cache ini cuma
  // terisi SETELAH file itu pernah diminta sekali saat online.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Cuma simpan respons yang benar-benar OK & bukan partial (206) -- jangan
        // pernah cache error page/redirect opaque, nanti malah "meracuni" cache.
        if (res && res.ok && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
