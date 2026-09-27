# Panduan: Partisi Member Android (`member-app/` + `shared/`)

**Status:** Selesai & tervalidasi menyeluruh (baseline `v90.2.119`, 4 September 2026)
**Konteks:** Member Android awalnya 1 file HTML tunggal (~2500 baris, semua JS nempel di 1 `<script>`) — dipecah jadi 1 shell tipis + 9 file `scripts/` + 1 file logic bersama (`shared/geo-engine.js`), mengikuti pola yang sudah terbukti aman waktu Master di-split 28-29 Agustus.

---

## Struktur Final

```
mine-geologist/
├── shared/
│   └── geo-engine.js          <- logic geospasial murni (lihat bagian "shared/" di bawah)
├── index.html, scripts/, modules/, style/    <- Master, TIDAK disentuh partisi ini
└── member-app/
    ├── index.html               <- shell tipis (338 baris, dari 2524 baris asli)
    ├── manifest.json
    ├── sw.js
    └── scripts/
        ├── config.js             <- URL backend, APP_VERSION, fetchWithTimeout, getField/setField, dll
        ├── auth.js                <- login PIN, session (localStorage), logout
        ├── kpi.js                  <- Modal KPI & Absensi + Modal JSA
        ├── digging.js                <- fetch data utama (loadRingkasanData), Ringkasan, Tab Digging
        ├── validasi.js                 <- grouping baris per-TP, Tab Validasi
        ├── peta.js                      <- Mine Grid SVG, North Arrow, Mode Ukur
        ├── chat.js                       <- Modal Chat Tim
        ├── issue.js                       <- Modal Issue & Action
        └── settings.js                     <- Report, Pengaturan, Menu Akun
```

---

## Kenapa `shared/geo-engine.js` Terpisah dari `member-app/scripts/`

Ada 2 jenis "kode yang dipakai bersama" di proyek ini, dan keduanya diperlakukan **beda**:

| | Logic murni (matematika) | Kode tampilan (modal, form, dll) |
|---|---|---|
| Contoh | `inverseUtm_()`, `gridConvergence_()` | `renderKpiModal()`, `renderDiggingModal()` |
| Hasil beda per-device? | **Tidak** — angka yang sama selalu menghasilkan output sama, di Master atau Member Android | **Ya, sengaja** — Master pakai kartu grid desktop, Member Android pakai modal mobile tumpuk vertikal |
| Lokasi | `shared/` (folder sejajar `member-app/`, dipakai bersama) | `member-app/scripts/` (murni milik Member Android sendiri) |

**Prinsip:** kalau memindahkan sesuatu ke "1 sumber bersama" justru memaksa 2 tampilan berbeda pakai kode yang sama, itu salah — buat 2 device jadi tidak pas satu sama lain. Cuma logic yang **tidak peduli tampilan** yang aman dijadikan 1 sumber.

`shared/geo-engine.js` berisi 4 fungsi (Inverse UTM, Grid Convergence, Bearing/Distance) yang dipakai `peta.js` Member Android sekarang — dan **sudah siap dipakai Master juga** kapan pun Master butuh fitur geospasial serupa, tanpa perlu menyalin ulang kode.

**Catatan teknis:** `computeConvergenceForPoint_()` sengaja menerima `zone`/`hemisphere` sebagai parameter eksplisit (bukan membaca variabel global `MG1_CRS_CONFIG` yang spesifik-Android) — supaya file ini genuinely reusable, tidak diam-diam bergantung ke variabel yang cuma ada di 1 sisi.

---

## Kenapa Data (Google Sheets + Backend) Tidak Perlu Dipikirkan Ulang

Partisi ini **hanya menyentuh bagaimana kode JavaScript diorganisir** — bukan dari mana data diambil. Baik sebelum maupun sesudah partisi, semua file (Master maupun Member Android) memanggil **1 `GOOGLE_SCRIPT_READ_URL` yang sama**, ke **1 backend Apps Script yang sama**, membaca/menulis ke **1 Google Sheets yang sama**.

Ini bekerja karena semua file `<script src="...">` yang dimuat di 1 halaman HTML **berbagi 1 ruang memori JavaScript yang sama** (global scope) — tidak peduli fungsi itu didefinisikan di file mana, definisi ditemukan otomatis selama semua file sudah selesai dimuat sebelum ada yang memanggilnya. Prinsip yang sama yang membuat Master aman dipecah jadi 14 file sejak 28-29 Agustus.

---

## Cara Pemasangan di GitHub

1. Buat folder baru `shared/` **sejajar** dengan `member-app/`, `modules/`, `scripts/`, `style/` (bukan di dalam salah satunya).
2. Timpa isi `member-app/` sepenuhnya dengan struktur baru di atas (termasuk subfolder `scripts/` yang baru).
3. **Wajib:** cek `member-app/sw.js` — pastikan `CACHE_NAME` sudah naik dan daftar `APP_SHELL` mencakup **semua 10 file baru** (`shared/geo-engine.js` + 9 file di `member-app/scripts/`). Precache yang tidak sinkron = fitur baru gagal muncul saat offline sebelum sempat online sekali.
4. Clear cache browser/PWA seperti biasa (unregister Service Worker + hapus Cache Storage) sebelum testing.

---

## Checklist Verifikasi Setelah Pemasangan

- [ ] Folder `shared/` ada di level yang sama dengan `member-app/`, `modules/`, `scripts/`, `style/`
- [ ] `member-app/index.html` memuat 10 `<script src>` baru dengan urutan: `../shared/geo-engine.js` → `scripts/config.js` → `scripts/auth.js` → (6 file fitur, urutan bebas) — config & auth harus di depan karena file lain bergantung padanya
- [ ] `member-app/sw.js` `CACHE_NAME` sudah naik & `APP_SHELL` mencakup 10 file baru
- [ ] Buka app: Ringkasan, Digging, Validasi, Peta, Chat, Issue, Settings — semua tab masih berfungsi normal
- [ ] Buka Peta dengan data TP valid — North Arrow & tombol Mode Ukur muncul
- [ ] Login/Logout masih berfungsi normal
- [ ] Buka `Settings > Versi App` — harus menunjukkan `v90.2.119`

---

## Pelajaran dari Proses Ekstraksi (untuk sesi partisi berikutnya, kalau ada)

3 hal sempat **hampir jadi bug** saat proses ekstraksi berlangsung (semua ketemu & dibenerin sebelum dikirim ke pengguna, lewat sisir sistematis di setiap tahap):

1. **Konstanta yang menyertai suatu fungsi bisa tertinggal** kalau titik potong (line range) dimulai persis di baris fungsinya, bukan di baris komentar/konstanta yang mendahuluinya. Selalu cek: apakah fungsi yang dipindah punya konstanta pendukung tepat di atasnya?
2. **State/variabel global yang mengiringi 1 fungsi fetch** (misal `globalCOGConfig` yang diisi `loadRingkasanData()`) harus ikut co-located, bukan ditinggal di file lama.
3. **2 fitur yang namanya mirip tapi beda** (Form Input Digging utama vs Update Assay form) — mudah tertukar/terlewat kalau cuma mengandalkan grep sekilas tanpa membaca konteks fungsi satu-satu.

**Metode yang terbukti akurat:** gunakan parser/`view` untuk menemukan batas baris **persis** tiap fungsi (bukan menebak dari nama), potong dari **belakang ke depan** kalau menghapus banyak blok dari 1 file (supaya nomor baris blok di atas tidak ikut bergeser), dan **selalu diff nama fungsi** (`comm` antara daftar sebelum & sesudah) di akhir sebagai bukti 0 kehilangan — bukan cuma percaya `node --check` (itu cuma cek sintaks, bukan cek kelengkapan).

---

## Riwayat

- **4 September 2026** — Partisi 7 tahap dari `Geobank-Member-Android-App-v90.2.116` (1 file tunggal) menjadi struktur `shared/`+`member-app/scripts/` di atas. Baseline `v90.2.119`. 132 fungsi original, 0 hilang, 0 duplikat (terverifikasi via diff nama fungsi).
