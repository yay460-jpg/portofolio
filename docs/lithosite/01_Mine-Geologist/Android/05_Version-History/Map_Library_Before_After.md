# MG1 / LITHOSITE --- V24.3 MAP LIBRARY

## Kesimpulan Sebelum & Sesudah Implementasi

**Tanggal:** 13 September 2026\
**Scope:** Map Library / Map Management\
**Baseline yang dilindungi:** V24.2 / locked map-runtime behavior

------------------------------------------------------------------------

## 1. KESIMPULAN SEBELUM

Sebelum pekerjaan V24.3 Map Library dilanjutkan, fondasi runtime peta
Lithosite sudah kuat, tetapi fungsi **Map Library / Map Management**
masih berada pada tahap awal dan sebagian masih bergantung pada struktur
legacy.

### Kondisi sebelum V24.3

-   Map masih dikelola terutama melalui state/cache legacy seperti
    `backgroundMapsList` dan `activeBackgroundMapId`.
-   IndexedDB sudah tersedia sebagai penyimpanan peta offline.
-   Lifecycle aktivasi/deaktivasi background map sudah ada.
-   Atomic Surface Swap dan runtime tile loading sudah tersedia.
-   Tile Engine, C1 Viewport Planner, C2 Adaptive Render, GeoReference,
    gesture, dan persistence runtime sudah menjadi fondasi V2.
-   Namun, Map Library belum mempunyai boundary/contract yang jelas
    sebagai subsystem tersendiri.
-   Fungsi management masih bercampur dengan compatibility/legacy
    bridge.
-   UI management belum mempunyai representasi active/inactive yang
    konsisten dan elegan.
-   Metadata map seperti folder dan collection masih berkembang dan
    belum dipisahkan secara tegas dari payload runtime.
-   Karena area Map Library berpotensi menyentuh banyak file, perubahan
    langsung pada `peta.js` atau runtime engine berisiko menimbulkan
    regresi.

### Masalah utama sebelum

**Map Runtime sudah matang, tetapi Map Library belum memiliki ownership
architecture yang cukup jelas.**

Dengan kata lain:

> **Runtime peta sudah menjadi engine, tetapi pengelolaan koleksi peta
> belum sepenuhnya menjadi subsystem Library.**

------------------------------------------------------------------------

# 2. PERUBAHAN V24.3

V24.3 dimulai dengan pendekatan **cross-file audit → ownership mapping →
contract → facade/capability → UI**, bukan patch langsung pada renderer.

### Struktur yang dibangun

``` text
Map Management UI
        │
        ▼
map-management-compat.js
        │
        ▼
MG1MapLibrary
        │
        ├── map-library-contract.js
        │
        ├── map-library-capability.js
        │
        └── IndexedDB / existing lifecycle
                │
                ├── map-package.js
                ├── map-background-lifecycle.js
                └── map-surface-lifecycle.js
```

### Prinsip ownership

-   `map-package.js`
    -   tetap menjadi owner IndexedDB/storage.
-   `map-background-lifecycle.js`
    -   tetap menjadi owner activate/deactivate/delete lifecycle.
-   `map-surface-lifecycle.js`
    -   tetap menjadi owner atomic surface/runtime swap.
-   `map-management-compat.js`
    -   menjadi boundary untuk UI/compatibility management.
-   `map-library.js`
    -   menjadi facade/boundary Map Library.
-   `map-library-contract.js`
    -   mendefinisikan contract/validation metadata.
-   `map-library-capability.js`
    -   menyediakan query/summary capability tanpa mengubah runtime
        behavior.

------------------------------------------------------------------------

# 3. KONDISI SESUDAH

Setelah Slice V24.3 yang sudah dikerjakan dan diuji secara bertahap:

### Map Library sekarang sudah mempunyai

-   Search map.
-   Sort nama A--Z.
-   Filter Active.
-   Filter Inactive.
-   Filter Folder.
-   Filter Collection.
-   Map Info.
-   Rename.
-   Folder metadata.
-   Collection metadata.
-   Delete.
-   Active/Inactive visual state.
-   IndexedDB sebagai canonical persisted map source pada boundary
    Library.
-   Legacy `backgroundMapsList` diperlakukan sebagai compatibility
    cache, bukan sebagai sumber kebenaran utama.
-   Action Activate/Delete tetap melewati lifecycle yang sudah ada.

### Active State UI

UI sekarang membedakan state dengan sederhana:

``` text
ACTIVE
  └── card subtle emerald
  └── ● AKTIF
  └── tidak menyediakan tombol activate ulang

INACTIVE
  └── normal navy card
  └── AKTIFKAN
```

Pendekatan ini sengaja dibuat sederhana dan elegan agar Map Library
tidak terasa seperti panel teknis.

------------------------------------------------------------------------

# 4. HAL YANG TETAP DI-LOCK

Selama implementasi V24.3 Map Library, area berikut **tidak disentuh**:

-   Tile Engine.
-   C1 Viewport Planner.
-   C2 Adaptive Render.
-   GeoReference.
-   Map interaction / gesture.
-   Runtime tile loading.
-   Tile identity.
-   Persistent tile runtime.
-   Atomic Surface Swap.
-   Existing V22/V23/V24.1 runtime behavior.
-   RAM-first save lifecycle.
-   Existing map rendering pipeline.

Tujuannya:

> **Map Library berkembang di atas runtime yang sudah stabil, bukan
> mengubah runtime untuk memenuhi kebutuhan Library.**

------------------------------------------------------------------------

# 5. HASIL AUDIT V24.3

### Status

  Area                          Status
  ----------------------------- --------
  Map Library contract          PASS
  Library facade                PASS
  Capability/query layer        PASS
  IndexedDB boundary            PASS
  Active/Inactive UI            PASS
  Existing activate lifecycle   LOCKED
  Existing delete lifecycle     LOCKED
  Atomic Surface                LOCKED
  Tile Engine                   LOCKED
  C1/C2                         LOCKED
  GeoReference                  LOCKED
  Gesture/Interaction           LOCKED

### Kesimpulan teknis

V24.3 berhasil mengubah Map Library dari sekadar kumpulan fungsi
management menjadi **boundary subsystem yang lebih terstruktur**, tanpa
mengganggu fondasi Map Runtime V2.

------------------------------------------------------------------------

# 6. CATATAN TECHNICAL DEBT

Masih terdapat beberapa fallback legacy di compatibility layer.

Fallback tersebut dipertahankan dengan sengaja untuk menjaga
compatibility selama masa transisi.

**Tidak dibersihkan pada tahap ini.**

Alasannya:

1.  Map Library belum selesai seluruh lifecycle-nya.
2.  Compatibility path masih berguna sebagai safety net.
3.  Membersihkan legacy terlalu dini dapat memperbesar scope perubahan.
4.  Prioritas saat ini adalah stabilitas runtime dan persistence.

------------------------------------------------------------------------

# 7. KESIMPULAN BESAR

### SEBELUM

``` text
MAP RUNTIME
    kuat/stabil

MAP LIBRARY
    masih legacy + berkembang
    ownership belum tegas
    metadata belum terpisah
    UI active/inactive belum konsisten
```

### SESUDAH

``` text
MAP RUNTIME
    tetap LOCKED
    tetap stabil

MAP LIBRARY
    ├── Contract
    ├── Facade
    ├── Capability
    ├── Metadata boundary
    ├── Search
    ├── Sort
    ├── Filter
    ├── Folder
    ├── Collection
    ├── Info
    ├── Rename
    ├── Activate
    └── Delete
```

### Prinsip utama

> **V24.3 bukan membangun ulang Map Runtime.**
>
> **V24.3 membangun struktur Map Library di atas Map Runtime yang sudah
> ada.**

Dengan demikian, evolusi berikutnya dapat dilakukan secara modular tanpa
kembali ke pola **tambal-sulam** pada `peta.js`.

------------------------------------------------------------------------

# 8. NEXT STEP

Sebelum masuk ke fitur Library yang lebih besar, tahap berikutnya
adalah:

## V24.3 --- Persistence & Lifecycle Integrity

Validasi end-to-end:

``` text
Rename
   ↓
Reload
   ↓
Tetap tersimpan

Folder
   ↓
Reload
   ↓
Tetap tersimpan

Collection
   ↓
Reload
   ↓
Tetap tersimpan

Active Map
   ↓
Reload
   ↓
Tetap Active

Delete
   ↓
Reload
   ↓
Benar-benar hilang

Delete Active Map
   ↓
Surface tetap aman
```

Setelah lifecycle persistence dinyatakan PASS, barulah aman melanjutkan
ke:

-   Copy / Duplicate Map
-   Update Map
-   Import / Export
-   Package Management
-   Transfer / sharing workflow
-   Layer subsystem

**Status keseluruhan saat ini: V24.3 Map Library --- FUNCTIONALLY GOOD,
belum FINAL/FINISH sebelum persistence & lifecycle E2E PASS.**
