# V24.3 — MAP LIBRARY / MAP MANAGEMENT — DETAILED RECORD

**Status:** FINAL LOCKED  
**Progress:** **100% untuk scope V24.3**  
**Runtime baseline:** V24.2 LOCKED / PROTECTED

## 1. Masalah Sebelum

Runtime sudah kuat, tetapi management belum menjadi subsystem dengan boundary yang jelas.

Kondisi yang saling berdekatan:

```text
backgroundMapsList
activeBackgroundMapId
legacy management
compatibility bridge
IndexedDB
runtime
```

Masalah utama:

> Map Runtime sudah menjadi engine, tetapi pengelolaan koleksi map belum sepenuhnya menjadi subsystem Library.

## 2. Pendekatan

```text
Cross-file audit
      ↓
Ownership mapping
      ↓
Contract
      ↓
Facade
      ↓
Capability
      ↓
Management UI
      ↓
Hardening
      ↓
Runtime validation
```

## 3. Ownership Final

| File | Owner |
|---|---|
| `map-package.js` | IndexedDB / persisted map storage |
| `map-background-lifecycle.js` | activate/deactivate/delete lifecycle |
| `map-surface-lifecycle.js` | atomic surface/runtime swap |
| `map-management-compat.js` | management UI + compatibility boundary |
| `map-library.js` | Library facade + metadata write boundary |
| `map-library-contract.js` | contract / validation |
| `map-library-capability.js` | query / filter / summary |
| `developer-profile.js` | Developer Profile modal |
| `map-ui.js` | legacy compatibility UI; not canonical V24.3 owner |
| `peta.js` | protected runtime/application compatibility |

## 4. Capability

- Search
- Sort A–Z / Z–A
- Terbaru / Terlama
- Active / Inactive
- Label filter
- Collection filter
- Map Info
- Rename
- Edit Label
- Collection metadata
- Delete
- Active visual state
- Inactive visual state
- IndexedDB canonical persistence
- `backgroundMapsList` sebagai compatibility cache

## 5. Label Architecture

`Folder` diubah menjadi **Label**.

Label adalah metadata/tag, bukan filesystem folder, Android folder, SD card folder, atau physical storage location.

```text
Map A
  labels: ["Production", "Geology"]

Map B
  labels: ["Survey"]

Map C
  labels: ["Production", "Planning"]
```

Canonical:

```text
labels[]
```

Legacy compatibility:

```text
folderName
```

## 6. Collection

```text
Map
├── labels[]
└── collectionNames[]
```

Collection tidak membuat IndexedDB store baru. Tujuan saat ini:

- grouping
- filtering
- future package/collection management

## 7. Metadata Write Boundary

`MG1MapLibrary.updateMetadata(id, patch)` menangani:

```text
name
labels
collectionNames
```

Tidak menangani:

```text
tiles
GeoReference
imageDataUrl
tilePyramid
runtime payload
```

Flow:

```text
UI
 ↓
MG1MapLibrary.updateMetadata()
 ↓
validate contract
 ↓
dbPutMap_()
 ↓
backgroundMapsList compatibility cache
```

## 8. Canonical Active / Inactive UI

Active:

```text
subtle emerald card
● AKTIF
```

Inactive:

```text
normal navy card
AKTIFKAN
```

Tidak ada per-card `DEACTIVATE`.

## 9. Action Sheet

Inactive:

```text
Aktifkan Peta
Lihat Info Peta
Edit Nama
Edit Label
Ganti Koleksi
Hapus Peta
```

Active:

```text
Lihat Info Peta
Edit Nama
Edit Label
Ganti Koleksi
Hapus Peta
```

## 10. Duplicate UI Issue

Sempat terdapat:

```text
V24.3 canonical Map Library
+
legacy renderMapManagePanel_()
```

Root cause:

```text
openManageModal()
   ↓
mapManagePanelOpen = true
   ↓
future render()
   ↓
legacy renderMapManagePanel_()
```

Hardening:

```text
openManageModal()
   ↓
mapManagePanelOpen = false
   ↓
canonical modal only
```

File yang berubah:

```text
member-app/scripts/map/map-management-compat.js
```

Runtime yang tidak disentuh:

- `peta.js`
- Tile Engine
- C1/C2
- GeoReference
- IndexedDB schema
- tile persistence
- Surface Lifecycle

## 11. Technical Debt — LOCKED

### Active-state multi-writer

Writer berasal dari V19, V22, V23, V24.1, V24.3 compatibility, background lifecycle, DB restore dan upload/save paths.

**Decision:** jangan refactor incidental.

### Atomic failure-path state mismatch

Secara teoritis:

```text
set active state
   ↓
atomic surface swap
   ↓
FAIL
```

surface lama dapat dipertahankan sementara active state sudah menunjuk map baru.

**Decision:** dedicated lifecycle transaction refactor jika kelak diperlukan.

### Collection scalability

Batas normalisasi saat ini ditujukan agar query/UI ringan.

**Decision:** bukan blocker.

### Contract version marker

Housekeeping mismatch internal pernah tercatat antara contract/capability/facade.

**Decision:** maintenance pass terpisah.

## 12. Validation

Scope V24.3 dinyatakan selesai setelah runtime smoke menunjukkan:

- canonical Map Library tampil;
- old/duplicate UI tidak muncul;
- Active/Inactive benar;
- Search/Library bekerja;
- Map Info bekerja;
- map kembali ke runtime;
- atomic surface swap tetap berjalan;
- rendering normal;
- GeoReference normal;
- gesture normal;
- marker normal.

Warning CRS/server fallback yang tidak berasal dari Map Library tidak dikategorikan sebagai regresi Library.

## 13. Before → After

### Before

```text
Member App
   │
   ├── peta.js
   │     ├── runtime
   │     ├── map management
   │     ├── legacy state
   │     └── compatibility
   ├── backgroundMapsList
   ├── activeBackgroundMapId
   └── IndexedDB
```

### After

```text
MAP MANAGEMENT
      │
      ▼
map-management-compat.js
      │
      ▼
MG1MapLibrary
 /      |       Contract Capability Metadata
 \       |       /
  ▼      ▼      ▼
IndexedDB Boundary
      │
 ┌────┼────────────┐
 ▼    ▼            ▼
package background  surface
         lifecycle   lifecycle
                     │
                     ▼
              LOCKED MAP RUNTIME
              ┌─────┼─────┐
              ▼     ▼     ▼
              C1    C2   Tile Engine
```

## 14. Ringkasan

> **V24.3 memisahkan Map Management dari Map Runtime tanpa membongkar runtime yang sudah locked. IndexedDB tetap menjadi storage owner, Library menjadi facade/contract/capability boundary, dan management UI menjadi canonical single UI.**
