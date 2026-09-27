# Lithosite V2 / MG1 — Posisi Arsitektur vs Avenza
**Update Posisi: 12 September 2026**

> Dokumen penilaian engineering internal — bukan angka resmi dari Avenza.
> Sumber: Perkembangan Lithosite/MG1 + Dokumentasi Avenza terbaru.

---

## Executive Summary

Lithosite V2 sudah mencapai fondasi **"offline map engine"** yang serius, tetapi Avenza masih jauh di depan pada level **produk mapping lengkap, ecosystem, layer/feature management, import/export, dan native mobile maturity**.

Saya tidak akan memakai angka "80% Avenza" lagi karena itu terlalu menyederhanakan. Lebih tepat kita ukur per layer.

**Kalimat paling jujur hari ini:**

> **Lithosite V2 sudah melewati fase "aplikasi yang bisa membuka GeoPDF" dan masuk fase "mining offline map runtime"; sedangkan Avenza sudah berada pada fase "production-grade general-purpose mapping ecosystem".**

Dan itu justru kabar bagus. Engine V2 sekarang jangan dibongkar lagi.

---

## 1. Posisi Sekarang — 4 Lapisan

```
LAYER 4 — PRODUCT / ECOSYSTEM
        Avenza ████████████████████ 100%
        MG1    ███████░░░░░░░░░░░░  ~35%

LAYER 3 — MAP MANAGEMENT
        Avenza ████████████████████ 100%
        MG1    █████████░░░░░░░░░░░  ~50%

LAYER 2 — OFFLINE MAP RUNTIME
        Avenza ████████████████████ 100%
        MG1    ████████████████░░░░  ~80-85%

LAYER 1 — GEO MAP FOUNDATION
        Avenza ████████████████████ 100%
        MG1    █████████████████░░░  ~90%
```

**Insight kunci:** Pada Layer 1–2, MG1 sudah cukup dekat secara konsep. Gap terbesar sekarang bukan lagi "bisakah kita menampilkan GeoPDF?", tetapi seberapa lengkap ekosistem map di atas engine tersebut.

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

### MG1 Sekarang (~50%)

```
Kelola Peta Background
  → Map list
  → Thumbnail
  → Aktifkan
  → Delete
  → Tambah Peta Baru
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

**Posisi:**
```
MG1 Map Manager   ██████████░░░░░░░░░░ 50%
Avenza Map Library ████████████████████ 100%
```

**Gap terbesar MG1 berikutnya ada di sini.**

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

**MG1:**

```
Import              ██████████████░░░░░░ 70%
Export/package      ████░░░░░░░░░░░░░░░░ 15%
Device transfer     ██░░░░░░░░░░░░░░░░░░ 10%
```

Ini salah satu roadmap berikutnya.

---

## 9. Offline Persistence

**Prinsip sama, implementasi berbeda.**

Avenza: `Map → device storage → offline use` — custom maps disimpan pada perangkat untuk offline.

MG1: `Map → RAM → Tile representation → IndexedDB → Runtime loader`

MG1 bahkan lebih eksplisit: **STORED vs RUNTIME_READY** — keputusan arsitektur yang bagus.

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
│ ██████████░░░░░░░░░░  ~50%          │
├─────────────────────────────────────┤
│ LAYER / FEATURES                    │
│ ████░░░░░░░░░░░░░░░░  ~20%          │
├─────────────────────────────────────┤
│ PACKAGE / EXPORT / TRANSFER         │
│ ███░░░░░░░░░░░░░░░░░  ~15%          │
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

### Urutan yang Disarankan:

**Tahap — Map Lifecycle**
1. Map Package
2. Map metadata
3. Map version
4. Map migration
5. Import/export package

↓

**Map Library**
6. Folder
7. Collection
8. Search
9. Filter
10. Multi-map management

↓

**Layer**
11. Layer model
12. Feature persistence
13. Map ↔ Layer relationship
14. Visibility
15. Active layer

↓

**Advanced**
16. Spatial index
17. Background pre-generation
18. Package integrity/hash
19. Device transfer
20. Large-map memory optimization

---

## Catatan Penutup

Engine V2 sekarang jangan dibongkar lagi. Yang perlu kita bangun berikutnya adalah lapisan di atas engine, terutama **Map Package → Map Library → Layer**, bukan mengulang lagi pekerjaan tile dari nol.

**File referensi:**
- Dokumen ini: `Lithosite_MG1_Position_2026-09-12.md`
- Chibi assets: `chibi_tiny_180_trans.webp` (10KB transparent)
- Splash JS: `lithosite-splash.js` & `LithositeSplash.jsx`

*Disusun: 12 September 2026 — MG1 Team*
