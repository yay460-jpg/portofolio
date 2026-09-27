# MG1 / LITHOSITE --- V24.5 FINAL RELEASE LOCKED

**Update:** 15 September 2026\
**Status:** FINAL RELEASE LOCKED\
**Baseline:** V24.5\
**IndexedDB:** V2

------------------------------------------------------------------------

## 1. Final Status

V24.5 dinyatakan sebagai **FINAL RELEASE LOCKED** setelah penyelesaian
Map Package, Storage/Capacity, Recovery, Map Library UI, dan hardening
lifecycle/modal.

V24.5 tetap menggunakan fondasi runtime yang sudah ada dan **tidak
memasukkan arsitektur V25 Layer/Feature atau IndexedDB V4**.

------------------------------------------------------------------------

## 2. V24.5 Completed Scope

-   Map Lifecycle: Duplicate / Copy
-   Update / Replace
-   Failure / Recovery Boundary
-   Lifecycle Regression
-   Map Package
-   Import / Export
-   SHA-256 Package Integrity
-   Collision Preflight
-   Storage / Capacity Summary
-   Storage Management
-   Safe Cleanup
-   Recovery / Startup Journal
-   Management / Modal Isolation
-   Map Library UI hardening
-   Point Detail Modal lifecycle hardening
-   Logout hard-refresh handling

------------------------------------------------------------------------

## 3. Final Map Library UI

### Library controls

Pengaturan Library sekarang dibuat ringkas dalam satu baris:

``` text
Nama A–Z | Label & Koleksi
```

### Sort

Pilihan pengurutan tetap tersedia melalui kontrol **Nama A--Z**:

-   Nama A--Z
-   Nama Z--A
-   Terbaru
-   Terlama

Pilihan sort ditampilkan dalam satu baris pada modal.

### Filter

Label dan Koleksi digabung menjadi **satu kontrol**:

``` text
Label & Koleksi
```

Kontrol tersebut membuka pilihan:

-   Semua Label
-   Tanpa Label
-   Semua koleksi
-   Tanpa koleksi

Tujuan desain: mengurangi jumlah kontrol pada Library tanpa
menghilangkan fungsi filter.

------------------------------------------------------------------------

## 4. Map Action Sheet

Map Action Sheet menggunakan pola bottom-sheet dengan:

-   Info
-   Duplikat
-   Ganti Data
-   Edit Nama
-   Edit Label
-   Ganti Koleksi
-   Aktifkan Peta untuk map nonaktif
-   Backup / Export
-   Hapus Peta
-   Batal

Share Sheet native tidak menjadi capability stable V24.5 dan tetap
deferred.

------------------------------------------------------------------------

## 5. Point Detail Modal

Point Detail Modal menggunakan lifecycle terisolasi dari render peta
utama.

### Final behavior

-   Modal hidup pada root terpisah.
-   Membuka modal tidak melakukan rebuild `render()` global.
-   Enter animation: **bottom-up, tanpa fade**.
-   Close animation: **fade-out diperbolehkan**.
-   Map/SVG di belakang modal tetap stabil.
-   Viewport-fit tidak berjalan saat modal aktif atau sedang closing.
-   Foto hanya satu.
-   Kamera / Galeri tersedia.
-   Foto dapat dibuka fullscreen.
-   Detail menggunakan layout compact:
    -   ID
    -   tanggal + user
    -   Blok / Area / Tipe
    -   Bench / Timur (X) / Utara (Y)
    -   Foto
    -   Kedalaman
    -   Catatan

------------------------------------------------------------------------

## 6. Ownership / Dependency Boundary

``` text
index.html
   │
   ├── map-state.js
   │      └── Map state ownership
   │
   ├── peta.js
   │      └── Map behavior / render / runtime
   │
   ├── map-management-compat.js
   │      └── Library / management UI compatibility
   │
   └── map lifecycle / package / storage modules
```

Prinsip V24.5:

-   `map-state.js` tetap sebagai owner state.
-   `peta.js` tidak boleh membawa kembali deklarasi state yang sudah
    menjadi ownership `map-state.js`.
-   Modal tidak boleh bergantung pada global render cycle.
-   Perubahan UI harus tetap berada pada boundary modulnya.

------------------------------------------------------------------------

## 7. Persistence Boundary

Database:

``` text
mg1_background_maps
```

Schema V24.5:

``` text
IndexedDB v2
```

V24.5 **tidak** menggunakan:

``` text
layers
mapLayerState
features
```

Store tersebut merupakan bagian dari V25 / IndexedDB v4 dan tidak boleh
dicampurkan ke baseline V24.5.

------------------------------------------------------------------------

## 8. Protected Runtime

Fondasi berikut tetap menjadi baseline V24.5 dan tidak boleh diubah
secara tidak terkontrol:

-   Map state ownership
-   GeoReference
-   Tile Engine
-   Adaptive rendering
-   Gesture / interaction runtime
-   Atomic Surface
-   Existing map persistence algorithm

Jika pekerjaan berikutnya menyentuh beberapa file, lakukan cross-file
ownership/dependency audit sebelum patch.

------------------------------------------------------------------------

## 9. Validation

Target final V24.5:

  Area                         Status
  ---------------------------- --------
  Boot / Dashboard             PASS
  Map Library                  PASS
  Sort                         PASS
  Label & Koleksi              PASS
  Map Action Sheet             PASS
  Map Lifecycle                PASS
  Map Package                  PASS
  Backup / Restore             PASS
  Package Integrity            PASS
  Storage / Capacity           PASS
  Safe Cleanup                 PASS
  Point Detail Modal           PASS
  Modal no-flicker lifecycle   PASS
  IndexedDB V2                 PASS

------------------------------------------------------------------------

## 10. Release Decision

> **V24.5 = FINAL RELEASE LOCKED.**

Tidak ada lagi perubahan V24.5 kecuali bug release-blocking yang
memiliki evidence jelas.

Tahap berikutnya dilanjutkan sebagai **V25**, dengan fokus:

``` text
Advanced Map Library
        ↓
Layer
        ↓
Feature
        ↓
Mining Map Platform
```

V25 harus dibangun **di atas V24.5**, bukan dengan membongkar kembali
Tile Engine atau runtime map yang sudah stabil.

------------------------------------------------------------------------

## 11. Final Rule

**Jangan melakukan tambal-sulam lintas modul.**

Untuk perubahan yang menyentuh 2--3 file atau lebih:

1.  Audit dependency.
2.  Tetapkan owner state/function.
3.  Identifikasi contract antar-file.
4.  Patch seminimal mungkin.
5.  Syntax check.
6.  Regression check.
7.  Baru overwrite/test.

**V24.5 tetap menjadi baseline stabil sebelum pekerjaan V25
dilanjutkan.**
