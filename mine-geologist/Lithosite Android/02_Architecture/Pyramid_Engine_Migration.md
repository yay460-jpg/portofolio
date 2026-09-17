# MINE GEOLOGIST / LITHOSITE

## Engine Architecture Migration --- Pyramid Lama → Pyramid Terbaru

### Audit & Structural Reference --- 10 September 2026

> Dokumen referensi arsitektur. Tidak mengubah kode.

## 1. Tujuan

Dokumen ini memetakan perubahan engine GeoPDF/Lithosite dari model
**tile pyramid lama** ke model **tile pyramid terbaru**. Core
`levels[] -> tiles[]` tetap dipertahankan; yang berubah adalah lifecycle
di sekelilingnya: identity, store index, queue, runtime loader, missing
resolver, runtime creation, expected geometry, compositor integration,
dan persistence version-aware.

## 2. Struktur Lama

``` text
tilePyramid
├── version
├── tileSize
├── baseScale
├── sourceWidth
├── sourceHeight
└── levels[]
    ├── level
    ├── factor
    ├── scale
    ├── width
    ├── height
    ├── tilesX
    ├── tilesY
    └── tiles[]
        ├── x
        ├── y
        ├── width
        ├── height
        ├── levelFactor
        ├── tileKey / tileId
        └── dataUrl
```

Pola visual:

``` text
              X →
        0       1       2       3
     ┌───────┬───────┬───────┬───────┐
 Y 0 │ 0,0   │ 1,0   │ 2,0   │ 3,0   │
     ├───────┼───────┼───────┼───────┤
 Y 1 │ 0,1   │ 1,1   │ 2,1   │ 3,1   │
     ├───────┼───────┼───────┼───────┤
 Y 2 │ 0,2   │ 1,2   │ 2,2   │ 3,2   │
     └───────┴───────┴───────┴───────┘
```

Model lama pada dasarnya menganggap `levels[].tiles[]` sebagai kumpulan
tile yang siap dipakai renderer. Tidak ada pemisahan lifecycle yang
tegas antara **STORED** dan **RUNTIME_READY**.

## 3. Struktur Terbaru

``` text
tilePyramid
├── metadata
│   ├── version: 2
│   ├── mode
│   ├── tileSize
│   ├── baseScale
│   ├── sourceWidth / sourceHeight
│   ├── runtimeMapId
│   ├── __persistVersion
│   └── __lastPersistAt
│
├── levels[]
│   ├── factor
│   ├── width / height
│   ├── tilesX / tilesY
│   └── tiles[]
│       ├── x / y
│       ├── width / height
│       ├── levelFactor
│       ├── tileKey
│       ├── tileId
│       └── dataUrl
│
├── baseLayer
├── tileStore
├── tileQueue
├── runtimeTileLoader
└── missingDetailResolver
```

Current builder menggunakan `version: 2`, mode direct PDF.js tile
rendering, identity `factor/x/y`, dan marker seamless base/detail.

## 4. Perubahan Arsitektur Utama

### Lama

``` text
GeoPDF
  ↓
tilePyramid
  ↓
levels[].tiles[]
  ↓
renderer
```

### Terbaru

``` text
GeoPDF
  ↓
PDF.js
  ↓
GeoReference / C1
  ↓
expected tile geometry
  ↓
tile identity
  ↓
┌──────────────────────────────┐
│ tileStore / tileQueue        │
│ runtime loader / resolver    │
└──────────────┬───────────────┘
               ↓
       runtime tile lifecycle
               ↓
          compositor
               ↓
         BASE + DETAIL
               ↓
          persistence
               ↓
          IndexedDB
```

Perubahan terbesar bukan penggantian tile, tetapi perubahan dari
**static tile collection** menjadi **tile lifecycle engine**.

## 5. `levels[]` Tetap Menjadi Core

``` text
levels[0] → factor 0.25 → tiles[]
levels[1] → factor 0.5  → tiles[]
levels[2] → factor 1    → tiles[]
levels[3] → factor 2    → tiles[]
```

Engine juga memiliki konfigurasi adaptive C2. Untuk LOW device, source
saat ini memakai density `1.55x` dengan raster tile `768px`; ini
merupakan konfigurasi C2 dan bukan perubahan identity tile.

## 6. Tile Identity

Identity resmi:

``` text
factor / x / y
```

Contoh:

``` text
1/0/0   1/1/0   1/2/0
1/0/1   1/1/1   1/2/1
1/0/2   1/1/2   1/2/2
```

``` text
             X →
       0         1         2
    ┌─────────┬─────────┬─────────┐
 0  │ 1/0/0   │ 1/1/0   │ 1/2/0   │
    ├─────────┼─────────┼─────────┤
 1  │ 1/0/1   │ 1/1/1   │ 1/2/1   │
    ├─────────┼─────────┼─────────┤
 2  │ 1/0/2   │ 1/1/2   │ 1/2/2   │
    └─────────┴─────────┴─────────┘
```

Identity yang sama digunakan oleh Store, Queue, Loader, Resolver, dan
persistence.

## 7. `tileStore` --- Index, Bukan Data Kedua

``` text
tileStore
├── version: 2
├── identity: factor/x/y
├── count
└── index
      │
      ├── "1/0/0" → {levelIndex, tileIndex}
      ├── "1/1/0" → {levelIndex, tileIndex}
      └── ...
                    ↓
             levels[].tiles[]
                    ↓
                  dataUrl
```

Prinsip wajib:

``` text
tileStore       = INDEX
levels[].tiles  = RASTER DATA
```

Jangan membuat duplicate `dataUrl` di `tileStore`.

## 8. `tileQueue` --- Lifecycle Registry

Struktur terbaru:

``` text
tileQueue
├── version: 2
├── identity: factor/x/y
├── pending[]
├── pendingSet
├── loadedSet
├── failedSet
└── storedSet
```

Kontrak terpenting:

``` text
STORED ≠ RUNTIME_READY
```

``` text
             tile key
                ↓
          tileStore lookup
             /      \
          found    absent
            ↓        ↓
         STORED    MISSING
            ↓
         QUEUED
            ↓
         LOADING
            ↓
      RUNTIME_READY
```

`storedSet` hanya berarti tile ada di store. `loadedSet` berarti runtime
loader sudah menyelesaikan loading.

## 9. Runtime Loader

``` text
runtimeTileLoader
├── cache
├── loading
├── loaded
└── failed
```

Lifecycle:

``` text
STORED → QUEUED → LOADING → RUNTIME_READY
                         └→ FAILED
```

`Image` runtime berada di RAM/browser dan tidak menjadi bagian dari
persistence.

## 10. Missing Detail Resolver

``` text
EXPECTED KEY
     ↓
tileStore lookup
  ┌──┴──┐
  ↓     ↓
FOUND ABSENT
  ↓     ↓
STORED MISSING
        ↓
      resolver
```

Resolver bukan renderer. Ia menentukan apakah expected tile tersedia
atau perlu dibuat.

## 11. Expected Geometry --- Perubahan Fundamental

### Model lama

``` text
existing level.tiles
       ↓
intersection test
       ↓
visible existing tiles
```

Jika tile belum ada, tile tersebut tidak pernah masuk daftar dan
resolver tidak mendapat kesempatan membuatnya.

### Model terbaru

``` text
CURRENT VIEWPORT
       ↓
C1 geometry
       ↓
expected X/Y range
       ↓
expectedKeys
       ↓
┌───────────────┴───────────────┐
↓                               ↓
ada di tileStore                tidak ada
↓                               ↓
STORED                          MISSING
```

Geometry memakai `floor` untuk batas minimum dan `ceil(...)-1` untuk
batas maksimum, kemudian di-clamp ke `0..tilesX-1` dan `0..tilesY-1`.

## 12. Runtime Tile Creation

``` text
MISSING
  ↓
missing resolver
  ↓
PDF source tersedia
  ↓
PDF.js render
  ↓
canvas / dataUrl
  ↓
addLithositeRuntimeCreatedTile_
  ↓
levels[].tiles
  ↓
tileStore rebuild
  ↓
queue update
  ↓
__persistVersion++
  ↓
persistence
```

Creation berjalan background dan tidak boleh memblokir render utama.

## 13. BASE + DETAIL

Arsitektur seamless:

``` text
┌────────────────────────────────────┐
│ BASE 0.25x — FULL COVERAGE         │
│                                    │
│      ┌────────────────────────┐    │
│      │ DETAIL                 │    │
│      │ viewport / expected    │    │
│      │ tiles                  │    │
│      └────────────────────────┘    │
│                                    │
└────────────────────────────────────┘
```

Jika detail belum siap:

``` text
DETAIL missing
      ↓
BASE tetap terlihat
      ↓
background loading / creation
      ↓
DETAIL masuk
```

BASE adalah safety layer. DETAIL dapat dilengkapi secara runtime.

## 14. Direct PDF.js Tile Rendering

Engine terbaru merender tile langsung dari PDF.js:

``` text
GeoPDF
 ├── PDF.js → Tile A
 ├── PDF.js → Tile B
 ├── PDF.js → Tile C
 └── PDF.js → Tile D
```

Bukan:

``` text
PDF → satu PNG besar → crop → upscale
```

Dengan demikian tiap tile dirender pada resolusi levelnya.

## 15. Adaptive C2

Pada adaptive C2:

``` text
BASE   = full coverage
DETAIL = viewport-cropped
```

Pola:

``` text
┌───────────────────────────────┐
│ BASE BASE BASE BASE BASE      │
│ BASE ┌───────────────────┐    │
│ BASE │ DETAIL WINDOW     │    │
│ BASE │                   │    │
│ BASE └───────────────────┘    │
│ BASE BASE BASE BASE BASE      │
└───────────────────────────────┘
```

Karena DETAIL dapat partial, expected geometry + missing creation
menjadi penting untuk melengkapi coverage.

## 16. Runtime Orchestrator

``` text
renderMineGridSvg()
       ↓
expectedKeys
       ↓
ensureRuntimeTiles_NonBlocking_
       │
       ├── READY   → runtime cache
       │
       ├── STORED  → runtime queue → loader
       │
       └── MISSING → missing worker → PDF.js creation
                                      ↓
                                  persistence
       ↓
surface invalidation
       ↓
compositor
```

`ensureRuntimeTiles_NonBlocking_()` harus synchronous/non-blocking.
Jangan `await` PDF.js atau IndexedDB di render path.

## 17. Compositor

``` text
expected tile
     ↓
runtime cache?
  ┌──┴──┐
 yes    no
  ↓      ↓
runtime stored dataUrl / BASE
 image
  └──┬───┘
     ↓
 SVG image
```

READY memakai runtime image. Jika belum READY, fallback tetap tersedia.

## 18. Device Profiles

### LOW

``` text
tileSize       768
maxFactor      1
usableFactors  [0.5, 1]
batchSize      2
batchDelay     25 ms
prefetchRadius 0
cacheLimit     40
```

### BALANCED

``` text
tileSize       256
maxFactor      2
usableFactors  [0.25, 0.5, 1, 2]
batchSize      8
batchDelay     12 ms
prefetchRadius 2
cacheLimit     150
```

### HIGH

``` text
tileSize       512
maxFactor      2
usableFactors  [0.25, 0.5, 1, 2]
batchSize      16
batchDelay     0 ms
prefetchRadius 3
cacheLimit     300
```

## 19. Persistence --- Model Lama

Race yang harus dicegah:

``` text
T0 worker snapshot V0
        ↓
T1 runtime tile dibuat → V1
        ↓
T2 DB = V1
        ↓
T3 worker lama V0 selesai
        ↓
BAD: DB kembali V0
```

## 20. Persistence --- Model Terbaru

``` text
T0 worker snapshot V0
        ↓
T1 runtime tile → V1
        ↓
T2 persistence → DB V1
        ↓
T3 worker lama V0
        ↓
DB current = V1
        ↓
V0 < V1
        ↓
SKIP
```

Ada dua perlindungan:

1.  scheduler mengambil entry terbaru dari RAM;
2.  worker membaca version di IndexedDB sebelum `put` dan menolak
    snapshot yang lebih tua.

## 21. `__persistVersion`

``` text
initial  → V0
tile A   → V1
tile B   → V2
tile C   → V3
```

Version adalah ordering marker. Snapshot lama tidak boleh mengalahkan
snapshot baru.

## 22. Sanitize Sebelum IndexedDB

RAM:

``` text
tilePyramid
├── levels / tiles
├── tileStore
├── tileQueue
├── runtimeTileLoader
│    └── Image objects
└── resolver
```

Persistent:

``` text
persistable tilePyramid
├── metadata
├── levels
│   └── serializable tiles + dataUrl
├── baseLayer
└── tileStore metadata
```

`Image`, `HTMLImageElement`, Promise, runtime cache, dan DOM state tidak
disimpan.

## 23. Persistence Queue / Coalescing

``` text
Tile A ─┐
Tile B ─┤
Tile C ─┼─→ debounce 120 ms → latest snapshot → DB
Tile D ─┘
```

State queue:

``` text
scheduled
pendingPyramid
inProgress
retryCount
timeoutId
lastPersistAt
```

Jika gagal:

``` text
FAIL → restore pending → backoff → retry
```

## 24. Gesture Isolation

Gesture tetap terpisah dari tile engine:

``` text
Touch / Pointer
      ↓
gesture state
      ↓
CSS/SVG compositor movement
      ↓
visual movement
```

Tile lifecycle berjalan melalui:

``` text
viewport state
      ↓
expected geometry
      ↓
runtime lifecycle
```

Gesture tidak boleh menunggu PDF.js, IndexedDB, atau runtime creation.

## 25. Full Architecture Terbaru

``` text
                         ┌───────────────┐
                         │    GeoPDF     │
                         └───────┬───────┘
                                 ↓
                         ┌───────────────┐
                         │     PDF.js    │
                         └───────┬───────┘
                                 ↓
                         ┌───────────────┐
                         │ GeoReference  │
                         └───────┬───────┘
                                 ↓
                         ┌───────────────┐
                         │ C1 Planner    │
                         └───────┬───────┘
                                 ↓
                         expected tile keys
                                 │
                  ┌──────────────┴──────────────┐
                  ↓                             ↓
             tileStore                    missing resolver
                  ↓                             ↓
                STORED                    PDF.js creation
                  ↓                             ↓
             runtime queue                     tile
                  ↓                             ↓
             runtime loader              tileStore update
                  ↓                             ↓
             RUNTIME_READY                     │
                  └──────────────┬──────────────┘
                                 ↓
                             compositor
                                 ↓
                          BASE + DETAIL
                                 ↓
                       atomic surface update
                                 ↓
                              display

runtime-created tile
        ↓
__persistVersion++
        ↓
coalesced persistence
        ↓
sanitize
        ↓
version-aware worker
        ↓
IndexedDB
```

## 26. State Machine

``` text
                  EXPECTED KEY
                       ↓
                tileStore lookup
                 /             \
                /               \
             FOUND             ABSENT
               ↓                  ↓
            STORED             MISSING
               ↓                  ↓
            QUEUED          CREATE QUEUE
               ↓                  ↓
            LOADING          CREATING
             /    \               |
            /      \              ↓
        READY     FAILED       STORED
          ↓
      COMPOSITOR
```

## 27. Kontrak / Invariant

1.  `levels[].tiles[]` tetap single owner raster.
2.  `tileStore` hanya identity/index.
3.  Identity tetap `factor/x/y`.
4.  `STORED != RUNTIME_READY`.
5.  BASE tetap full coverage.
6.  DETAIL mengikuti expected viewport geometry.
7.  `renderMineGridSvg()` tetap synchronous.
8.  Async PDF.js/Image/IndexedDB berjalan background.
9.  Gesture tidak bergantung pada tile creation.
10. Runtime-only Image objects tidak masuk IndexedDB.
11. Snapshot lama tidak boleh overwrite snapshot baru.
12. `__persistVersion` naik saat runtime tile berhasil dibuat.
13. C1/C2/renderer tidak boleh diubah tanpa audit dependency.

## 28. Perbandingan

  Area              Pyramid Lama          Pyramid Terbaru
  ----------------- --------------------- ----------------------------
  Core              levels → tiles        tetap
  Identity          sederhana             `factor/x/y`
  Store             tidak terpisah        `tileStore` index
  Queue             sederhana             lifecycle v2
  STORED vs READY   tidak tegas           tegas
  Runtime loader    tidak formal          cache/loading/failed
  Missing tile      tidak terorkestrasi   resolver + worker
  Geometry          existing tiles        expected viewport
  BASE              layer dasar           full-coverage safety layer
  DETAIL            static/cropped        expected + runtime
  Persistence       snapshot              coalesced + version-aware
  Worker race       terbuka               protected
  Clone safety      raw runtime risk      sanitized
  Gesture           harus dijaga          terisolasi

## 29. Hal yang Tidak Boleh Diubah Sembarangan

``` text
C1 viewport geometry
C2 adaptive tile selection
factor policy
tile-size policy
BASE full coverage
SVG compositor
gesture/pan lifecycle
V17.1 no-flicker lifecycle
V22 atomic surface swap
V23 modal lifecycle
V24.1 save lifecycle
IndexedDB schema
runtimeMapId
factor/x/y identity
```

Setiap perubahan pada area tersebut harus dimulai dengan audit
dependency/cross-file.

## 30. Source Audit Reference

Basis utama: `member-app/scripts/peta.js` yang dilampirkan untuk audit.
Struktur source mengonfirmasi:

-   `buildTilePyramidDirect_()` membuat `version: 2` dan direct PDF.js
    tile pyramid;
-   `ensureLithositeTileStore_()` membangun index `factor/x/y`;
-   `ensureLithositeTileQueue_()` memisahkan `storedSet` dari
    `loadedSet`;
-   `getViewportTilePlan_()` menghitung expected viewport tile geometry;
-   `addLithositeRuntimeCreatedTile_()` menaikkan `__persistVersion`;
-   `sanitizePyramidForStorage_()` membuang runtime-only objects;
-   persistence coalescing menggunakan queue dan retry/backoff;
-   V24.1 scheduler mencari latest RAM entry;
-   V24.1 worker melakukan version check sebelum `put`.

## 31. Prinsip Satu Kalimat

> **Pyramid terbaru tetap menyimpan raster di `levels[].tiles[]`; engine
> baru menambahkan identity, lifecycle, expected geometry, runtime
> creation, compositor integration, dan persistence version-aware di
> sekeliling core tersebut.**
