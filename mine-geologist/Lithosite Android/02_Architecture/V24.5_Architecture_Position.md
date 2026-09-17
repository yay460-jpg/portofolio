# Lithosite V2 / MG1 — Posisi Arsitektur vs Avenza
**Update Posisi: 14 September 2026 — V24.5 FINAL RELEASE LOCKED**

> Dokumen penilaian engineering internal — bukan angka resmi dari Avenza.
> Sumber: Perkembangan Lithosite/MG1 + Dokumentasi Avenza terbaru.

---

## Executive Summary

Lithosite V2 sudah mencapai fondasi **"offline map engine"** yang serius. Setelah V24.4 dan V24.5, MG1 juga sudah memiliki **map lifecycle lengkap, package transfer/integrity, storage-capacity management, safe cleanup, dan recovery boundary**. Avenza tetap jauh di depan pada level **produk mapping lengkap, ecosystem, layer/feature management, dan native mobile maturity**.

Saya tidak akan memakai angka "80% Avenza" lagi karena itu terlalu menyederhanakan. Lebih tepat kita ukur per layer.

**Kalimat paling jujur hari ini:**

> **Lithosite V2 sudah melewati fase "aplikasi yang bisa membuka GeoPDF" dan masuk fase "mining offline map runtime + map lifecycle platform"; sedangkan Avenza sudah berada pada fase "production-grade general-purpose mapping ecosystem".**

Dan itu justru kabar bagus. Engine V2 sekarang jangan dibongkar lagi.

---

## 1. Posisi Sekarang — 4 Lapisan

```
LAYER 4 — PRODUCT / ECOSYSTEM
        Avenza ████████████████████ 100%
        MG1    ████████░░░░░░░░░░░░  ~40%*

LAYER 3 — MAP MANAGEMENT
        Avenza ████████████████████ 100%
        MG1    ████████████░░░░░░░░  ~60%*

LAYER 2 — OFFLINE MAP RUNTIME
        Avenza ████████████████████ 100%
        MG1    ████████████████░░░░  ~80-85%

LAYER 1 — GEO MAP FOUNDATION
        Avenza ████████████████████ 100%
        MG1    █████████████████░░░  ~90%
```

**Insight kunci:** Pada Layer 1–2, MG1 sudah cukup dekat secara konsep. Setelah V24.5, gap terbesar makin jelas berada di **Layer 3–4**, terutama **advanced Map Library, Layer/Feature subsystem, multi-map relationships, dan ecosystem**. Angka bertanda `*` adalah **engineering estimate internal**, bukan skor resmi Avenza dan bukan ukuran kuantitatif terstandar.

---

## 2. Layer 1 — Geo/Map Foundation

### Lithosite V2 — Status: Sangat Matang (~90%)

Kita sudah punya:

- GeoPDF ingestion
- TerraGo GeoPDF handling
- GPTS/LPTS
- CRS detection
- GeoReference
- Neatline
- Affine transform
- Inverse affine
- Bidirectional transform
- GPS coordinate mapping
- Map tap coordinate
- Accuracy simulation
- GeoPDF tile pyramid
- IndexedDB persistence

### Avenza — Foundation

Mendukung antara lain:

- Geospatial PDF
- TerraGo GeoPDF
- GeoTIFF
- JPG dengan world-file/projection information
- Custom map yang sudah ter-georeference dapat digunakan dengan tool Avenza

### Posisi

MG1 ≈ Avenza secara konsep untuk fondasi GeoPDF/georeference. Tetapi implementasinya berbeda:

**MG1**
```
GeoPDF → own parser → own coordinate pipeline → own tile runtime
```

**Avenza**
```
GeoPDF/GeoTIFF → native proprietary engine
```

---

## 3. Layer 2 — Offline Map Runtime

Ini justru bagian yang paling berhasil dari perjalanan MG1.

### Arsitektur MG1 Sekarang

```
GeoPDF
  ↓
GeoReference
  ↓
Tile Pyramid
  ↓
Viewport Planner
  ↓
Device Profile
  ↓
Runtime Tile Loader
  ↓
Missing Tile Resolver
  ↓
Runtime Tile Creation
  ↓
Persistent Tile Store
  ↓
Atomic Surface
  ↓
Offline Map
```

Ditambah:

- adaptive tile profile
- viewport culling
- runtime tile creation
- persistent storage
- RAM-first activation
- background persistence
- atomic map surface swap
- **STORED ≠ RUNTIME_READY**

> **MG1 sekarang sudah merupakan offline geospatial tile runtime.**

Avenza juga menyediakan custom maps secara offline setelah map tersedia di perangkat. Avenza mendokumentasikan bahwa custom imported maps dapat dimuat tanpa internet selama map sudah tersedia di device/storage.

Jadi pada level offline map behavior, kedua produk sudah berada di kategori yang sama. Tetapi Avenza memakai native mobile engine yang sudah matang bertahun-tahun, sedangkan MG1 masih Web/PWA.

**Posisi:** MG1 kuat secara arsitektur, tetapi belum setara maturity engine Avenza.

---

## 4. Tile Engine — Keunggulan Arsitektur MG1

Ini adalah **intellectual property arsitektur MG1** yang sebaiknya jangan dibongkar lagi.

### Konsep Eksplisit MG1

```
DEVICE → PROFILE → TILE POLICY → VIEWPORT → RUNTIME
```

Contoh:

| Profile | Tile Size |
|---------|-----------|
| LOW | 768 |
| BALANCED | 256 |
| HIGH | 512 |

Kita sudah menemukan masalah kontrak:

```
C1 tileSize ≠ C2 tileSize → blur / kualitas
```

Kontrak diperbaiki menjadi:

```
Device Profile → C1 Planner → same tileSize → C2 Pyramid
```

Avenza tidak mendokumentasikan secara publik detail internal tile/device strategy mereka, jadi kita tidak boleh mengklaim Avenza memakai mekanisme yang sama.

---

## 5. Layer 3 — Map Management — Gap Mulai Besar

### MG1 Sekarang — V24.5 (~60%*)

```
Map Library / Management
  → Map list + thumbnail
  → Aktifkan / active-inactive state
  → Delete + safe cleanup
  → Tambah Peta Baru
  → Rename / Info
  → Search / Sort / Filter
  → Label / Collection
  → Duplicate / Copy
  → Update / Replace
  → Storage / Capacity Summary
  → Per-map Storage Management
```

Delete Map V2 sudah bagus: `🗑 → Hapus Data Map? → Batal / Oke`

### Avenza — Map Library

- map library
- layer library
- search, sort, filter
- folders, collections
- imported maps, Map Store maps
- active/georeferenced filtering
- update checking
- Collections dapat digunakan untuk urutan penggunaan beberapa map

**Posisi setelah V24.5:**
```
MG1 Map Manager    ████████████░░░░░░░░ ~60%*
Avenza Map Library ████████████████████ 100%
```

**Gap terbesar MG1 berikutnya:** advanced Map Library organization, richer collections/folders, ecosystem-level map discovery/update, dan hubungan map↔layer.

---

## 6. Layer 4 — Layers / Features — Gap Lebih Besar

### Avenza

Layer dapat berisi: placemarks, lines, tracks, areas, photos, schema.

Layer dapat: dibuat, diedit, dihapus, dicari, diaktifkan, di-link ke map, di-unlink, dipakai oleh beberapa map.

Import: KML/KMZ, GPX, Shapefile, GeoPackage.

### MG1 (~20%)

Kita belum berada di level ini. Kita memiliki coordinate/GPS/map tap dan workflow operasional, tetapi belum memiliki general-purpose persistent map layer architecture seperti Avenza.

---

## 7. Feature Collection / Field Mapping

**Avenza:** placemark, GPS track recording, photo plotting, draw/measure, GPS averaging, navigation, coordinate tools.

**MG1 — Konteks Berbeda:**

```
Map → Digging → Validasi → KPI → operasional tambang
```

> **Penting: Saya tidak ingin MG1 berubah menjadi "Avenza clone." MG1 seharusnya menjadi Mining Operational Map Platform.**

---

## 8. Import/Export

**Avenza:** device storage, Google Drive, Dropbox, web, QR, custom scheme, sharing custom maps, GeoPackage, Nearby Share/AirDrop.

**MG1 setelah V24.5:**

```
Import / Restore          ██████████████████░░  ~90%*
Export / Package          ████████████████░░░░  ~80%*
Package Integrity         ██████████████████░░  ~90%*
Storage / Capacity        ████████████████░░░░  ~80%*
Device / Native Sharing   ██░░░░░░░░░░░░░░░░░░  ~10%*
```

V24.5 sudah menutup **Backup/Export → Package → SHA-256 integrity → collision preflight → Restore → storage management → safe cleanup → recovery journal**. Native in-app Share Sheet sengaja **dibatalkan/deferred**; transfer file tetap dapat dilakukan melalui file manager perangkat. Angka `*` adalah engineering estimate internal, bukan skor resmi Avenza.

---

## 9. Offline Persistence

**Prinsip sama, implementasi berbeda.**

Avenza: `Map → device storage → offline use` — custom maps disimpan pada perangkat untuk offline.

MG1: `Map → RAM → Tile representation → IndexedDB → Runtime loader`

MG1 bahkan lebih eksplisit: **STORED vs RUNTIME_READY** — keputusan arsitektur yang bagus. V24.5 menambahkan lifecycle di atas persistence: duplicate, replace, delete-safe, package integrity, storage capacity, dan recovery journal.

---

## 10. Mobile Architecture — Avenza Menang Jelas

**Avenza:** Native mobile + native rendering + native filesystem + native GPS + native sharing

**MG1:** PWA/Web + Canvas/SVG + IndexedDB + Browser runtime

Bukan berarti MG1 salah. Untuk deployment internal/member, PWA memberikan keuntungan: update cepat, satu codebase, tidak tergantung Play Store, deployment terkontrol, mudah diintegrasikan dengan backend perusahaan. Tetapi untuk raw rendering/memory/native integration, Avenza memiliki advantage struktural.

---

## 11. Map Store / Ecosystem

Tidak seimbang — Avenza punya Map Store dengan lebih dari satu juta map. MG1 tidak mempunyai tujuan seperti itu.

```
Mine Geologist → Company/member workflow → Mining maps
```

Bukan gap yang harus dikejar.

---

## 12. Maturity Map MG1 V2

```
┌─────────────────────────────────────┐
│ GEO FOUNDATION                      │
│ ███████████████████░  ~90%          │
├─────────────────────────────────────┤
│ OFFLINE MAP RUNTIME                 │
│ █████████████████░░░  ~80–85%       │
├─────────────────────────────────────┤
│ TILE ENGINE                         │
│ █████████████████░░░  ~80–85%       │
├─────────────────────────────────────┤
│ MAP MANAGEMENT                      │
│ ████████████░░░░░░░░  ~60%*         │
├─────────────────────────────────────┤
│ LAYER / FEATURES                    │
│ ████░░░░░░░░░░░░░░░░  ~20%          │
├─────────────────────────────────────┤
│ PACKAGE / EXPORT / TRANSFER         │
│ ███████████████░░░░░  ~75%*         │
├─────────────────────────────────────┤
│ MINING WORKFLOW                     │
│ ██████████████████░░  ~90%          │
└─────────────────────────────────────┘
```

---

## 13. Avenza — Finished Ecosystem

```
GEO MAP             ████████████████████
OFFLINE ENGINE      ████████████████████
MAP LIBRARY         ████████████████████
LAYERS              ████████████████████
FEATURES            ████████████████████
IMPORT / EXPORT     ███████████████████░
DEVICE TRANSFER     ██████████████████░░
NAVIGATION          ███████████████████░
ECOSYSTEM           ████████████████████
```

Avenza sudah merupakan finished mapping product ecosystem, bukan hanya map engine.

---

## 14. Siapa Lebih Maju?

- **Sebagai produk mapping umum:** Avenza jauh lebih maju. Tidak perlu diperdebatkan.
- **Sebagai core offline GeoPDF → tile runtime yang kita desain sendiri:** MG1 sudah sangat jauh dibanding V1, dan sekarang berada pada arsitektur yang masuk akal untuk aplikasi mapping offline profesional.
- **Sebagai mining operational application:** MG1 mempunyai sesuatu yang Avenza tidak punya sebagai fokus utama: `Map → Mining → Digging → Validation → KPI → Member workflow`. Jadi MG1 tidak perlu mengejar Avenza di semua dimensi.

---

## 15. Roadmap Paling Tepat Sekarang

> **Jangan bongkar tile engine lagi.** Fondasi `GeoReference → Tile Pyramid → Adaptive Tile → Runtime Loader → Persistent Store → Atomic Surface` sudah cukup kuat untuk jangka panjang.

### Status roadmap — 14 September 2026

**Selesai / LOCKED di V24.4–V24.5**
1. Map State Contract
2. Duplicate / Copy
3. Update / Replace
4. Failure / Recovery boundary
5. Lifecycle regression validation
6. Map Package
7. Import / Export package
8. Package integrity / SHA-256
9. Collision preflight
10. Storage / Capacity Summary
11. Storage Management
12. Safe Cleanup
13. Recovery journal / startup recovery

↓

**Tahap berikutnya — Advanced Map Library**
14. Folder hierarchy yang lebih kaya
15. Collection workflow yang lebih dalam
16. Search / filter yang lebih advanced
17. Multi-map relationships
18. Map version / migration strategy
19. Package ecosystem yang lebih luas

↓

**Layer Platform**
20. Layer model
21. Feature persistence
22. Map ↔ Layer relationship
23. Visibility
24. Active layer
25. Feature editing / operational objects

↓

**Advanced Runtime / Platform**
26. Spatial index
27. Background pre-generation
28. Device transfer / native sharing bila memang diperlukan
29. Large-map memory optimization
30. Mining-specific map workflows di atas Layer Platform

---

## Catatan Penutup

Engine V2 sekarang jangan dibongkar lagi. V24.5 sudah menutup **Map Lifecycle** dan fondasi **Package/Storage/Recovery**. Yang perlu kita bangun berikutnya adalah lapisan di atas engine, terutama **Advanced Map Library → Layer → Features → Mining Map Platform**, bukan mengulang lagi pekerjaan tile dari nol.

**Status dokumen:** diperbarui setelah **V24.5 FINAL RELEASE LOCKED**.

**File referensi:**
- Dokumen ini: `Lithosite_MG1_Position_2026-09-12.md`
- Chibi assets: `chibi_tiny_180_trans.webp` (10KB transparent)
- Splash JS: `lithosite-splash.js` & `LithositeSplash.jsx`

*Disusun: 14 September 2026 — MG1 Team*
