# MG1 / LITHOSITE — V1 — Functional Mining Member App

**Status:** FOUNDATION  
**Progress versi:** **100%**  
**Jenis record:** Technical version record

---

## 1. Technical Issue

Map masih merupakan salah satu feature di Member App.

## 2. Feature / Requirement

- Dashboard
- Ringkasan
- Digging
- Validasi
- KPI
- Chat / Issue
- Settings
- Background Map
- GeoPDF
- GeoReference
- GPS
- Map Tap
- Tile Rendering

## 3. Alur Utama

```text
Member App → Background Map → GeoPDF / GeoReference / GPS / Map Tap / Tile Rendering
```

## 4. Struktur / Arsitektur Sebelum

```text
Map feature berada di dalam application flow; ownership runtime belum menjadi subsystem mandiri.
```

## 5. Struktur / Arsitektur Sesudah

```text
Background Map memiliki fondasi geospatial yang kemudian berkembang menjadi runtime V2.
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

**Status validasi:** FOUNDATION

Progress **100%** di sini berarti **scope versi yang terdokumentasi telah selesai/tercatat sesuai status release**, bukan persentase kualitas kode atau benchmark performa.

## 10. Technical Debt / Catatan

Technical debt yang belum dibuktikan sebagai regresi tidak boleh direfactor incidental.  
Jika sebuah issue belum tervalidasi, statusnya harus **PENDING**, bukan PASS.

## 11. Baseline Decision

**FOUNDATION**

## 12. Ringkasan

> **Fondasi functional mining member app; map masih feature, belum platform runtime.**
