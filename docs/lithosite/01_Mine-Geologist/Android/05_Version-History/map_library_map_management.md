# MG1 / LITHOSITE — V24.3 — Map Library / Map Management

**Status:** FINAL LOCKED  
**Progress versi:** **100%**  
**Jenis record:** Technical version record

---

## 1. Technical Issue

Runtime sudah kuat, tetapi management belum menjadi subsystem dengan boundary jelas; dua UI sempat dapat muncul karena legacy render flag.

## 2. Feature / Requirement

- Search
- Sort
- Active / Inactive
- Label
- Collection
- Map Info
- Rename
- Edit Label
- Collection metadata
- Delete
- Canonical UI
- IndexedDB canonical persistence
- Metadata write boundary

## 3. Alur Utama

```text
Cross-file audit → ownership mapping → contract → facade → capability → Management UI → hardening → runtime validation
```

## 4. Struktur / Arsitektur Sebelum

```text
Management bercampur dengan backgroundMapsList, activeBackgroundMapId, legacy UI dan compatibility bridge.
```

## 5. Struktur / Arsitektur Sesudah

```text
map-management-compat.js → MG1MapLibrary → contract/capability → IndexedDB/existing lifecycle; runtime tetap protected.
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

**Status validasi:** FINAL LOCKED

Progress **100%** di sini berarti **scope versi yang terdokumentasi telah selesai/tercatat sesuai status release**, bukan persentase kualitas kode atau benchmark performa.

## 10. Technical Debt / Catatan

Technical debt yang belum dibuktikan sebagai regresi tidak boleh direfactor incidental.  
Jika sebuah issue belum tervalidasi, statusnya harus **PENDING**, bukan PASS.

## 11. Baseline Decision

**FINAL LOCKED**

## 12. Ringkasan

> **Map Runtime tetap engine; Map Library menjadi canonical management subsystem. V24.3 final locked.**
