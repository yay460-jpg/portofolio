# MG1 / LITHOSITE — V22 — Atomic Surface Lifecycle

**Status:** LOCKED  
**Progress versi:** **100%**  
**Jenis record:** Technical version record

---

## 1. Technical Issue

Surface baru tidak boleh menggantikan map lama sebelum siap.

## 2. Feature / Requirement

- Atomic Surface Swap
- Hidden new surface
- Image preload
- Timeout recovery

## 3. Alur Utama

```text
Old surface → build new hidden → preload → READY: swap / TIMEOUT: remove new + retain old
```

## 4. Struktur / Arsitektur Sebelum

```text
Replace langsung berisiko blank/partial surface.
```

## 5. Struktur / Arsitektur Sesudah

```text
New surface hidden; preload; swap hanya jika ready; timeout mempertahankan old surface.
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

**Status validasi:** LOCKED

Progress **100%** di sini berarti **scope versi yang terdokumentasi telah selesai/tercatat sesuai status release**, bukan persentase kualitas kode atau benchmark performa.

## 10. Technical Debt / Catatan

Technical debt yang belum dibuktikan sebagai regresi tidak boleh direfactor incidental.  
Jika sebuah issue belum tervalidasi, statusnya harus **PENDING**, bukan PASS.

## 11. Baseline Decision

**LOCKED**

## 12. Ringkasan

> **Fondasi non-destructive surface lifecycle.**
