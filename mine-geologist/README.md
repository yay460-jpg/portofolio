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
│   └── main.js                 <- DOMContentLoaded, state global, dashboard utama
├── modules/                  <- fungsi PER-FITUR/PER-HALAMAN
│   ├── barging.js              <- tab Barging (Shipment, Loading, Dome)
│   ├── digging.js              <- tab Tabel Digging (input Produksi_GC)
│   ├── validation.js           <- tab Validasi (Test Pit)
│   ├── reconciliation.js       <- tab Rekonsiliasi + Visual & Trend
│   ├── member.js               <- tab KPI Member (Engine KPI 5 Pilar, Attitude, JSA)
│   ├── settings.js             <- tab Settings (Developer Console, Regional, dll)
│   └── issue.js                <- tab Issue & Action
└── assets/                   <- favicon, ikon PWA, avatar
```

**Aturan penempatan kode baru:** kalau fiturnya dipakai di banyak halaman (format tanggal, modal, auth) → `scripts/`. Kalau fiturnya spesifik 1 tab/halaman → `modules/` sesuai nama tabnya.

Semua file JS dimuat sebagai `<script>` biasa (bukan ES module) — artinya semua fungsi top-level otomatis jadi **global**, saling bisa panggil antar file selama urutan `<script>` di `index.html` benar (lihat urutannya di situ: `scripts/` dulu baru `modules/`).

## 3. Cara Deploy

### Frontend (GitHub Pages)
1. Upload file yang berubah ke repo `yay460-jpg/portofolio`, folder `mine-geologist/`
2. **⚠️ WAJIB naikkan `CACHE_NAME` di `sw.js`** tiap kirim file baru (format: `mine-geologist-build-YYYYMMDDx`) — Service Worker mendeteksi update dari perubahan BYTE `sw.js`, bukan dari `APP_VERSION`. Kalau lupa, browser/PWA yang sudah install akan tetap pakai file lama dari cache, walau file di GitHub sudah benar.
3. Setelah upload, PWA yang sudah terinstall butuh 1 siklus reload untuk deteksi versi baru.

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

## 6. Kalau Ada yang "Tidak Berfungsi" Padahal Kodenya Sudah Benar

Urutan cek paling sering menyelesaikan masalah, dari yang paling murah:
1. **Cache browser/Service Worker** — hard-refresh (Ctrl+Shift+R), atau naikkan `CACHE_NAME`
2. **URL backend berubah** — cek `GOOGLE_SCRIPT_READ_URL` di `scripts/config.js` masih cocok dengan deployment aktif di Apps Script
3. **Session/token kadaluarsa** — coba logout-login ulang
4. Baru curigai bug kode kalau 3 hal di atas sudah dipastikan bukan penyebabnya

---

*Dokumen ini disusun berdasarkan sesi kerja pengembangan MG1 baseline v90.2.150 — untuk riwayat perubahan lengkap per versi, lihat tombol "Lihat Riwayat Update" di dalam Settings dashboard.*
