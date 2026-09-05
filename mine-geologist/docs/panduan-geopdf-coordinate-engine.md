# Panduan GeoPDF Coordinate Engine — Member Android

> Dokumen ini merangkum **seluruh perjalanan** membangun kemampuan baca-koordinat-otomatis dari GeoPDF di Member Android (PWA), dari percobaan pertama sampai baseline `M2_Final`. Ditulis supaya sesi kerja berikutnya (manusia atau AI) tidak perlu mengulang riset yang sudah selesai, dan tahu persis di mana batas yang sudah/belum diverifikasi.

---

## 1. Kenapa Fitur Ini Ada

Tim geologist di lapangan sudah terbiasa pakai **ArcGIS/ArcMap** untuk membuat peta situs tambang, dan mengekspor-nya sebagai **GeoPDF** (PDF dengan koordinat georeferensi tertanam) untuk dipakai di aplikasi seperti Avenza Maps. Tujuannya: Member Android bisa membaca file GeoPDF yang SAMA, tempel otomatis ke posisi yang benar di Peta — tanpa perlu isi 2 sudut referensi manual satu-satu.

## 2. Arsitektur Akhir (Ringkas)

```
GeoPDF diupload
      │
      ▼
Metadata Engine (regex, baca /Measure /GPTS /LPTS /VP dari byte PDF)
      │
      ├── GPTS/LPTS ditemukan (standar ArcGIS/OGC modern)
      │        │
      │        ▼
      │   Affine Transform 2D (page ↔ native, Cramer's rule, 3 titik + validasi residual)
      │        │
      │        ▼
      │   CRS Detection (EPSG/WKT — bukan hardcode zona situs)
      │        │
      │        ▼
      │   GeoReference Object (schema standar: source+metadata+transform+crs+extent+boundary)
      │
      └── Tidak ditemukan → coba TerraGo/LGI (standar lama, CTM/Registration)
                   │
                   └── Keduanya gagal → fallback manual (isi 2 sudut sendiri, SELALU tersedia)
      │
      ▼
pdf.js merender HANYA area Viewport (bukan seluruh halaman) → gambar dipotong otomatis
      │
      ▼
Ditempel ke Peta pakai fungsi proyeksi yg SAMA dgn plot titik TP (0 logic baru)
```

**Prinsip kunci yang dipegang sepanjang proyek:** MG1 punya *coordinate engine* sendiri (`solveAffineTransform2D_`, `forwardUtm_`/`inverseUtm_`) yang **divalidasi identik presisi floating-point** dengan PROJ (library referensi dunia) untuk semua CRS yang benar-benar dipakai MG1 (WGS84 UTM 51S/52N/52S). Library eksternal (GDAL, PROJ-WASM) diteliti tapi **tidak diintegrasikan** karena tidak dibutuhkan — lihat bagian 6.

## 3. Kemampuan yang Sudah Selesai (per kategori)

| Kategori | Kemampuan |
|---|---|
| **Metadata** | Baca `GPTS`/`LPTS`/`VP`/`GCS` langsung dari byte PDF (regex, bukan library PDF penuh) |
| **Transform** | Affine 2D lengkap (menangani rotasi/skew halaman, bukan cuma bounding-box) + versi kebalikannya (native→page) |
| **CRS** | Deteksi EPSG/WKT otomatis: UTM, Geographic (EPSG:4326 dkk), Web Mercator (EPSG:3857) |
| **Datum** | Deteksi datum + transformasi Helmert (TOWGS84) kalau parameter tersedia di file |
| **Standar lama** | TerraGo/LGI (CTM & Registration control-point), sesuai OGC 08-139r3 |
| **Struktur ganda** | Multi-Viewport/multi-map-frame (pilih Viewport terbesar), Measure dictionary variant (indirect ref, inline, dll), fallback parser untuk struktur non-standar |
| **Batas area** | Neatline (batas peta bisa tidak persegi/dipotong miring) |
| **Render** | Skala adaptif (turun otomatis untuk file besar, target ≤12MP/≤4096px), render cuma area yang dibutuhkan (bukan 1 halaman penuh), `page.cleanup()`/`pdf.destroy()` (lepas memori) |
| **Kompresi PDF** | Deteksi & expand `/ObjStm` (object stream terkompresi FlateDecode) — untuk PDF dari software selain ArcMap |
| **Keamanan memori** | Preflight ukuran file vs `navigator.deviceMemory` sebelum alokasi besar (64/96/128/256MB) |
| **GPS realtime** | `navigator.geolocation.watchPosition` → posisi GPS diproyeksikan ke pixel Peta, cek dulu ada `GeoReference` |
| **Tap koordinat** | Tap di mana saja di Peta → native/halaman/pixel/WGS84 |
| **QA internal** | Validasi struktur `GeoReference` + akurasi seluruh rantai (5 titik: 4 sudut + tengah) |

## 4. Yang BELUM/TIDAK Dikerjakan (dan Kenapa)

- **PROJ/GDAL/library eksternal** — diaudit mendalam (lihat bagian 6), **tidak diintegrasikan** karena kebutuhan CRS MG1 (WGS84 UTM murni) 100% tercakup engine sendiri.
- **Multi-CRS-per-client sekaligus** (1 klien 2+ tambang beda zona di 1 layar) — di-hold, keputusan besar terpisah.
- **CDN eksternal untuk UI** (`cdn.tailwindcss.com`, `unpkg.com/lucide`, `cdn.jsdelivr.net/npm/geotiff`) — belum di-lokal-kan, tapi ini **bukan** blocker inti GeoPDF (cuma UI/GeoTIFF).

## 5. Pola Masalah yang TERUS Berulang — Wajib Diwaspadai

Sepanjang proyek ini, ZIP/kiriman "step baru" berkali-kali (7-8 kali total) ternyata:
1. **Dibangun dari checkpoint SEBELUM step yang sudah PASS** — diam-diam menghapus balik fungsi yang sudah tervalidasi.
2. **Lolos dari tabel klaim "PASS" self-report**, padahal ada bug fatal (contoh nyata: *variable shadowing* yang bikin **crash 100% untuk semua GeoPDF modern**, sampai ditemukan lewat tes langsung).

**Aturan wajib untuk sesi berikutnya:** setiap ada kode/laporan baru —
- Diff MD5 + isi terhadap baseline PASS **terakhir** (bukan asumsi aman)
- Kalau ada logika baru: **jalankan kodenya** dengan data nyata, bukan cuma baca/percaya klaim tertulis
- Kalau regresi ditemukan: ekstrak bagian genuine, suntik manual ke baseline PASS — jangan terima file mentah-mentah

## 6. Riset PROJ/GDAL — Kesimpulan Akhir (Tidak Diintegrasikan)

Diaudit menyeluruh 2 kandidat nyata:
- **`gdal3.js`** (GDAL asli dikompilasi WASM) — build browser-nya **tidak menyertakan pembaca PDF** (cuma "Write Only" untuk PDF).
- **`proj-wasm`** (proyek `clj-proj`, PROJ 9.8.1 asli dikompilasi WASM) — **genuinely berhasil dijalankan live**: transform tanpa grid identik presisi floating-point dengan `forwardUtm_` MG1; grid fetching terbukti selektif (byte-range HTTP, bukan unduh semua) untuk kasus yang butuh grid (mis. NAD27→NAD83). **Tapi**: cache native PROJ tidak ter-compile di build ini, dan intercept jalur jaringan dari luar tidak berhasil (arsitektur *Worker* memisahkan *scope* JS) — jadi *offline persistence* untuk grid **tidak terbukti bekerja** di artifact `0.1.0-alpha9` (masih tahap awal pengembangan).

**Kesimpulan paling penting:** ketiga preset CRS situs MG1 (Halmahera 52N, Morowali/Kendari 51S, Ambon 52S) **tidak pernah butuh grid sama sekali** — karena semuanya WGS84 UTM murni (proyeksi matematis langsung, bukan transform antar-datum). Jadi masalah "grid offline" yang diteliti berminggu-minggu itu **tidak relevan untuk kebutuhan MG1 yang sesungguhnya**. PROJ-WASM disimpan sebagai opsi masa depan (kalau nanti ada kebutuhan CRS di luar WGS84-UTM, mis. datum lokal Indonesia lama), bukan dependency sekarang.

## 7. Pelajaran Teknis Penting Lain

- **`CACHE_NAME` di `sw.js` WAJIB naik tiap kirim file baru** — `scripts/*.js` di-precache cache-first; lupa naikkan berarti update **tidak pernah sampai** ke HP yang sudah pernah buka app, walau file di server sudah benar. Ini kemungkinan besar akar dari laporan awal "app macet total" yang memicu seluruh investigasi ini.
- **Loop `text += String.fromCharCode(byte)` per-byte itu O(n²)** — untuk file beberapa MB bisa makan puluhan detik di HP, dan karena sinkron, **timeout/timer apa pun ikut ter-block**. Ganti proses per-*chunk* (8KB), ~30x lebih cepat.
- **`TextDecoder('latin1')` sebenarnya `windows-1252`** menurut spesifikasi WHATWG — beda dari Latin-1 murni di byte 0x80-0x9F. Aman dipakai untuk regex PDF kita (semua yang dicari karakter ASCII murni) — **tapi harus dibuktikan per-kasus**, jangan diasumsikan.
- **`Math.min`/`Math.max` eksplisit wajib** untuk urutan sudut `VP BBox` — file GeoPDF nyata TIDAK menjamin `vpBBox[1] > vpBBox[3]`, sempat jadi bug pixel negatif.
- **Node.js 22 punya `navigator` bawaan** yang menolak `global.navigator = {...}` sederhana — perlu `delete global.navigator` dulu saat simulasi kode browser di Node.

## 8. Baseline & Riwayat File

Baseline resmi terakhir: **`MemberAndroid_Baseline_M2_Final.zip`** (15 file: `shared/geo-engine.js`, `member-app/{index.html,manifest.json,sw.js,scripts/*.js (9 file), vendor/pdfjs/*.js}`), dengan perbaikan `sw.js` precache `vendor/pdfjs` (Gate OFF-03) sebagai revisi terakhir.

**Fungsi inti coordinate engine (`member-app/scripts/peta.js`):**
`tryParseGeoPdf_`, `solveAffineTransform2D_`, `applyAffineTransform2D_`, `applyInverseAffineTransform2D_`, `validateAffineTransform2D_`, `buildGeoReferenceObject_`, `wgs84ToGeoPdfPage_`, `geoPdfPageToWgs84_`, `geoPdfPageToPixel_`, `geoPdfPixelToPage_`, `gpsWgs84ToGeoPdfPixel_`, `parseGeoMeasureVariants10B_`, `findGeoPdfViewportBBoxForMeasure10C_`, `buildGeoPdfMapFrameCandidates10E_`, `selectGeoPdfMapFrame10E_`, `parseTerraGoLgi10A_`, `parseNeatlineCandidates_`, `detectDatum11A_`, `forwardProjection11D_`, `expandPdfObjectStreamsM1_`, `getGeoPdfSourceMemoryProfileM2_`.

**Konfirmasi lapangan (6 Sep 2026):** upload GeoPDF nyata (`Zhongchai`) berhasil — koordinat 4 sudut otomatis terisi, gambar tertempel di Peta, GPS realtime & North Arrow (True/Grid) berfungsi.

---

*Dokumen ini disusun dari sesi kerja GeoPDF Coordinate Engine, 5-6 September 2026. Untuk detail partisi awal `member-app/` (7 tahap, sebelum GeoPDF), lihat [`panduan-partisi-member-android.md`](panduan-partisi-member-android.md).*
