# Mine Geologist — Dashboard Operasional Tambang

**PT. Lithosite** — Dashboard operasional tambang nikel laterit, single-page-app (HTML+JS statis) yang membaca/menulis ke Google Sheets lewat Google Apps Script sebagai backend.

> Dokumen ini untuk **developer/kontributor teknis** (cara deploy, struktur kode, kenapa sesuatu dibangun seperti itu). Kalau kamu pengguna dashboard yang mau tahu cara pakai fitur-fiturnya (input data, rekonsiliasi, laporan), baca **Panduan Rekonsiliasi** — tombol "Panduan" di dalam Settings dashboard, bukan dokumen ini.

---

## 1. Arsitektur Singkat

```
Browser (PWA)  <--fetch-->  Google Apps Script (Code.gs)  <-->  Google Sheets (29 sheet)
```

- **Tidak ada server sendiri.** Semua backend jalan di Google Apps Script (`doGet`/`doPost`), 1 URL deployment (`GOOGLE_SCRIPT_READ_URL`), dibedakan lewat parameter `?sheet=` atau `?action=`.
- **Tidak ada database sendiri.** Google Sheets = database. 29 sheet, masing-masing 1 tabel data (Member, Produksi_GC, Sessions, dll).
- **Frontend statis** — di-hosting di GitHub Pages (`https://yay460-jpg.github.io/portofolio/mine-geologist/`), berjalan sebagai PWA (bisa di-install di Windows/Android).

## 2. Struktur File

```
mine-geologist/
├── index.html              <- markup saja, semua isi/logic ada di file .js
├── manifest.json            <- konfigurasi PWA
├── sw.js                    <- Service Worker (caching offline + deteksi update)
├── style/
│   └── theme.css             <- semua CSS custom (di luar Tailwind utility)
├── scripts/                  <- fungsi INTI, dipakai lintas-halaman
│   ├── config.js               <- konstanta global (URL backend, APP_VERSION, timeout, dll)
│   ├── api.js                  <- fetchWithTimeout() dan helper request lainnya
│   ├── i18n.js                 <- semua teks terjemahan ID/EN + CHANGELOG_DATA
│   ├── helpers.js              <- fungsi utilitas umum (format tanggal, modal, dll)
│   ├── auth.js                 <- login Developer & Member, validasi sesi, rotasi token
│   ├── export.js               <- semua fitur Export/Cetak PDF/CSV
│   ├── main.js                 <- DOMContentLoaded, state global, dashboard utama
│   ├── bg-particles.js         <- Background Animasi opsional (kanvas titik terkoneksi)
│   ├── splash.js                <- Splash Screen "Pixel Boot" opsional (loading awal)
│   └── member-card-expand.js    <- toggle collapse/expand kartu Member (Engine KPI 5 Pilar)
├── modules/                  <- fungsi PER-FITUR/PER-HALAMAN
│   ├── barging.js              <- tab Barging (Shipment, Loading, Dome)
│   ├── digging.js              <- tab Tabel Digging (input Produksi_GC)
│   ├── validation.js           <- tab Validasi (Test Pit)
│   ├── reconciliation.js       <- tab Rekonsiliasi + Visual & Trend
│   ├── member.js               <- tab KPI Member (Engine KPI 5 Pilar, Attitude, JSA)
│   ├── settings.js             <- tab Settings (Developer Console, Regional, dll)
│   └── issue.js                <- tab Issue & Action
├── assets/                   <- favicon, ikon PWA, avatar (dipakai BERSAMA index.html & member-app/)
├── shared/                    <- logic MURNI MATEMATIKA dipakai Master DAN member-app/ sekaligus
│   └── geo-engine.js            (Inverse+Forward UTM, Grid Convergence, Bearing/Distance -- 1 salinan,
│                                  bukan duplikat; Master belum pakai, disiapkan utk fitur geospasial nanti)
├── member-app/                <- Companion app Android (PWA terpisah, 1 shell + 9 file scripts)
│   ├── index.html               <- shell tipis: render()/switchTab()/header/nav/boot init
│   ├── manifest.json, sw.js      <- PWA sendiri, CACHE_NAME terpisah dari index.html root
│   ├── vendor/pdfjs/              <- pdf.js + pdf.worker.js DI-HOST LOKAL (bukan CDN), dipakai
│   │   ├── pdf.min.js               GeoPDF coordinate engine -- lihat docs/panduan-geopdf-
│   │   └── pdf.worker.min.js        coordinate-engine.md. Wajib ikut di-precache sw.js.
│   └── scripts/
│       ├── config.js              <- URL backend, APP_VERSION, fetchWithTimeout, getField, dll
│       ├── auth.js                 <- login PIN, session, logout
│       ├── kpi.js                   <- Modal KPI & Absensi + JSA
│       ├── digging.js                <- fetch data utama, Ringkasan, Tab Digging
│       ├── validasi.js                <- grouping per-TP, Tab Validasi
│       ├── peta.js                     <- Mine Grid SVG, North Arrow, Mode Ukur, Peta Background,
│       │                                  GeoTIFF, KML, GeoPDF Coordinate Engine (lihat docs/)
│       ├── chat.js                      <- Modal Chat Tim
│       ├── issue.js                      <- Modal Issue & Action
│       └── settings.js                    <- Report, Pengaturan, Menu Akun
└── docs/                     <- dokumentasi tambahan (panduan split backend, partisi member-app, dll)
```

**Backend (Google Apps Script, repo terpisah di Apps Script Editor):**

```
01_Config.gs           <- konstanta, koneksi spreadsheet, utilitas generik (hash, headerMap_, dll)
02_Auth.gs              <- login, session, credential, RBAC, API Abuse Guard
03_DeveloperTools.gs     <- fungsi Developer Console (hapus/reset baris, backfill User_ID)
04_PostEndpoints.gs      <- doPost -- router SEMUA endpoint tulis (1 fungsi besar, ~2800 baris)
05_GetEndpoints.gs       <- doGet -- router SEMUA endpoint baca (1 fungsi besar, ~1200 baris)
06_DataHelpers.gs        <- validasi tanggal, auto-routing Dome, format tampilan, ChatLog
07_Maintenance.gs        <- migrasi timestamp historis, retensi & archive terjadwal
08_KPIEngine.gs          <- Engine KPI 5 Pilar lengkap + statistik produksi member
```

Dipecah dari 1 file `Code.gs` (7000+ baris) murni untuk kerapian editor Apps Script — **tanpa restrukturisasi logika apapun**, `doPost`/`doGet` masih 1 fungsi monolitik masing-masing (rencana dipecah lebih dalam jadi dispatcher + handler per-sheet, belum dikerjakan). Semua file berbagi 1 global scope yang sama (Apps Script menggabungkan semua `.gs` sebelum eksekusi), jadi urutan nama file TIDAK memengaruhi fungsi lintas-file.

**Aturan penempatan kode baru:** kalau fiturnya dipakai di banyak halaman (format tanggal, modal, auth) → `scripts/`. Kalau fiturnya spesifik 1 tab/halaman → `modules/` sesuai nama tabnya.

Semua file JS dimuat sebagai `<script>` biasa (bukan ES module) — artinya semua fungsi top-level otomatis jadi **global**, saling bisa panggil antar file selama urutan `<script>` di `index.html` benar (lihat urutannya di situ: `scripts/` dulu baru `modules/`).

## 3. Cara Deploy

### Frontend (GitHub Pages)
1. Upload file yang berubah ke repo `yay460-jpg/portofolio`, folder `mine-geologist/`
2. **⚠️ WAJIB naikkan `CACHE_NAME` di `sw.js`** tiap kirim file baru (format: `mine-geologist-build-YYYYMMDDx`, atau `lithosite-member-app-build-YYYYMMDDx` untuk `member-app/sw.js`) — Service Worker mendeteksi update dari perubahan BYTE `sw.js`, bukan dari `APP_VERSION`. Kalau lupa, browser/PWA yang sudah install akan tetap pakai file lama dari cache (termasuk `scripts/*.js` dan `vendor/pdfjs/*.js`), walau file di GitHub sudah benar — **ini pernah jadi akar bug "app macet total" yang perlu berminggu-minggu untuk didiagnosis, lihat `docs/panduan-geopdf-coordinate-engine.md` bagian 7**.
3. Setelah upload, PWA yang sudah terinstall butuh 1 siklus reload untuk deteksi versi baru — untuk `member-app/`, kadang butuh **clear site data / uninstall-reinstall PWA** manual kalau Service Worker lama tetap aktif (SW baru sengaja tidak `skipWaiting()` otomatis).

### Backend (Google Apps Script)
1. Buka Apps Script Editor, tempel isi `Code.gs` terbaru
2. **⚠️ WAJIB pakai "Deploy → Manage deployments" → edit deployment yang sudah ada → "New version"** — JANGAN pilih "New deployment", itu akan generate URL `/exec` BARU dan memutus koneksi semua client yang masih pakai URL lama (harus update `GOOGLE_SCRIPT_READ_URL` di `scripts/config.js` kalau ini kejadian)

### Urutan Kerja Rekomendasi
1. Test perubahan di device sendiri dulu (hard-refresh/clear cache)
2. Kalau sudah yakin, baru resmikan sebagai versi baru: naikkan `APP_VERSION` (`scripts/config.js`) + tambah entri baru di `CHANGELOG_DATA` (`scripts/i18n.js`, paling atas array)

## 4. Kebijakan Penomoran Versi (penting, sering disalahpahami)

Ada **3 sistem angka versi yang SENGAJA terpisah**, jangan disamakan:

| Yang mana | Contoh | Siapa yang naikkan | Kapan |
|---|---|---|---|
| `APP_VERSION` (`config.js`) | `v90.2.150` | User (kamu) | Hanya saat eksplisit minta "naikkan versi" — bukan tiap ada fix kecil |
| Nama file yang diserahkan sesi kerja | `Code_v90.2.146_FixMemberStats.gs` | Otomatis per sesi | Penomoran internal, BUKAN rilis resmi |
| Komentar `// vX.X.X FIX` di kode | — | Ad-hoc | Jejak audit "fix dari titik mana", tidak perlu sinkron ke `APP_VERSION` |

Selisih ketiganya **bukan bug** — kalau ada yang bilang "APP_VERSION tidak sinkron dengan nama file/komentar", itu memang disengaja, boleh diabaikan.

## 5. Catatan Arsitektur & Keputusan Penting

- **Kenapa dipecah 14 file, bukan 1 file besar?** Sinyal internet di lokasi tambang lemah — HTTP cache per-file (304 Not Modified) jauh lebih hemat bandwidth daripada download ulang 1 file besar tiap ada 1 baris berubah.
- **Kenapa bukan React/Vue?** Semua vanilla JS + Tailwind CDN, tanpa build step — supaya bisa langsung edit & deploy tanpa proses compile, cocok untuk iterasi cepat lewat GitHub web UI.
- **Variabel global lintas-file:** karena bukan ES module, variabel state (`globalMemberData`, `globalRawData`, dll) dideklarasikan `let` di `main.js`, lalu di-`window.X = X` manual supaya file lain bisa akses. **Kalau nambah state baru, JANGAN lupa dua-duanya** — deklarasi `let` DAN sinkron ke `window` — beberapa bug pernah terjadi karena salah satu maupun keduanya terlewat.
- **Migrasi User_ID:** sistem sedang transisi dari identitas berbasis Nama (rawan typo/tabrakan nama kembar) ke User_ID (`GEO-XXX`). Member/JSA_Log sudah utamakan User_ID; Produksi_GC/Issue/KPIEvent masih campuran (lihat `CHANGELOG_DATA` versi terbaru untuk detail).
- **Kenapa `pdf.js` di-host lokal (`member-app/vendor/pdfjs/`), bukan CDN?** Web Worker yang dibuat dari URL cross-origin (CDN) kena pembatasan *same-origin* yang tidak konsisten antar browser/versi Android — sempat jadi bug nyata (GeoPDF gagal dirender). Host lokal + masuk precache `sw.js` menghilangkan masalah ini sepenuhnya, sekaligus selaras prinsip "internet cuma untuk data dashboard, bukan buka file peta lokal".

## 6. Kalau Ada yang "Tidak Berfungsi" Padahal Kodenya Sudah Benar

Urutan cek paling sering menyelesaikan masalah, dari yang paling murah:
1. **Cache browser/Service Worker** — hard-refresh (Ctrl+Shift+R), atau naikkan `CACHE_NAME`
2. **URL backend berubah** — cek `GOOGLE_SCRIPT_READ_URL` di `scripts/config.js` masih cocok dengan deployment aktif di Apps Script
3. **Session/token kadaluarsa** — coba logout-login ulang
4. Baru curigai bug kode kalau 3 hal di atas sudah dipastikan bukan penyebabnya

## 7. Dokumentasi Tambahan

Panduan teknis lebih detail untuk topik spesifik ada di folder [`docs/`](docs/):

- [Panduan Split Backend 8-File](docs/panduan-split-backend-8file.md) — cara pindahkan 8 file backend ke Apps Script editor, jebakan umum (boilerplate `myFunction` belum dihapus), checklist verifikasi.
- [Panduan Partisi Member Android](docs/panduan-partisi-member-android.md) — struktur `member-app/` + `shared/`, cara kerja arsitektur berbagi logic geospasial dengan Master, checklist precache PWA.
- [Panduan GeoPDF Coordinate Engine](docs/panduan-geopdf-coordinate-engine.md) — perjalanan lengkap membangun baca-koordinat-otomatis dari GeoPDF di Member Android: arsitektur akhir, semua kemampuan (CRS/datum/Neatline/GPS/dll), pola bug berulang yang wajib diwaspadai di sesi berikutnya, dan kenapa PROJ/GDAL diteliti tapi tidak diintegrasikan.

---

*Dokumen ini disusun berdasarkan sesi kerja pengembangan MG1 baseline v90.2.170 — untuk riwayat perubahan lengkap per versi, lihat tombol "Lihat Riwayat Update" di dalam Settings dashboard.*
