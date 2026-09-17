# MG1 / LITHOSITE — V2 — Offline Geospatial Runtime

**Status:** LOCKED FOUNDATION  
**Progress versi:** **100%**  
**Jenis record:** Technical version record

---

## 1. Technical Issue

Map perlu berubah dari feature menjadi offline geospatial runtime yang mempunyai lifecycle, persistence, tile identity, viewport planning, loading dan atomic surface.

## 2. Feature / Requirement

- Offline geospatial runtime
- C1 Viewport Planner
- Device Tile Profile
- C2 Tile Pyramid
- Tile Identity
- Persistent Tile Store
- Runtime Tile Loader
- Missing Tile Resolver
- Runtime Tile Creation
- Persistence
- Atomic Surface

## 3. Alur Utama

```text
GeoPDF → GeoReference → C1 → Device Profile → C2 → Tile Identity → Persistent Tile Store → Runtime Tile Loader → Missing Tile Resolver → Runtime Tile Creation → Persistence → Atomic Surface → Map Runtime
```

## 4. Struktur / Arsitektur Sebelum

```text
Map masih merupakan bagian dari Member App dan belum memiliki pipeline runtime berlapis.
```

## 5. Struktur / Arsitektur Sesudah

```text
Map menjadi offline geospatial runtime berlapis. Fondasi ini kemudian diproteksi sebagai runtime locked.
```

## 6. Perubahan Teknis

Perubahan pada versi ini dicatat sebagai perubahan terhadap issue dan flow di atas.  
Area yang tidak disebut sebagai berubah dianggap **tidak boleh diasumsikan berubah** hanya dari nama versinya.

## 7. Ownership / Dependency

- Catat file owner aktual pada source/build yang digunakan.
- Jangan memindahkan ownership ke file lain tanpa audit cross-file.
- Runtime locked tidak menjadi target incidental untuk management feature.

## 8. Data / State Contract

- State/data yang relevan: sesuai flow dan fitur versi ini.
- Bila ada legacy state, perlakukan sebagai compatibility state sampai ada dedicated cleanup.
- Jangan menganggap metadata sama dengan runtime payload.

## 9. Validation

**Status validasi:** LOCKED FOUNDATION

Progress **100%** di sini berarti **scope versi yang terdokumentasi telah selesai/tercatat sesuai status release**, bukan persentase kualitas kode atau benchmark performa.

## 10. Technical Debt / Catatan

Technical debt yang belum dibuktikan sebagai regresi tidak boleh direfactor incidental.  
Jika sebuah issue belum tervalidasi, statusnya harus **PENDING**, bukan PASS.

## 11. Baseline Decision

**LOCKED FOUNDATION**

## 12. Ringkasan

> **Transformasi arsitektur terbesar: map berubah dari feature menjadi offline geospatial runtime.**
