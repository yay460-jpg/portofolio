# MG1 / LITHOSITE --- ENGINE V1 → V2

## AUDIT DOCUMENT --- DAILY USE / RUNTIME / TILE ENGINE / LIFECYCLE

**Project:** MG1 / Mine Geologist / Lithosite Member App\
**Current working baseline:** V24.5\
**IndexedDB:** V2\
**Purpose:** audited engineering reference for daily use and future
maintenance\
**Scope:** Engine V1 → V2, Device Profiler, Tile Engine Profile, C1, C2,
BASE/DETAIL, Tile Identity, Store, Queue, Runtime Loader, Resolver,
Runtime Creation, Persistence, Geometry, Atomic Surface, Map Lifecycle\
**Patch status for this audit:** **NO PATCH**\
**Current investigation:** `376 → ? → 52`\
**Critical unresolved evidence:** composition of the observed `52`

------------------------------------------------------------------------

# 0. AUDIT RESULT --- BACA INI DULU

Dokumen ini adalah **audit dan konsolidasi** dari dokumen Engine/Tile
Budget/Technical History yang sudah ada.

Audit menemukan satu koreksi penting terhadap dokumen sebelumnya:

### Koreksi 1 --- `GLOBAL_MAX = 100` tidak boleh lagi dianggap final

Dokumen Tile Budget lama masih menuliskan:

``` text
GLOBAL_MAX = 100
```

dan menjadikannya ceiling. Itu **tidak lagi boleh dipakai sebagai
kesimpulan final**.

Status yang benar sekarang:

``` text
GLOBAL_MAX
    =
evidence-derived architectural / emergency ceiling

nilai final = TBD sampai calibration selesai
```

`100` boleh muncul sebagai **historical design discussion**, tetapi
bukan angka final yang dikunci.

------------------------------------------------------------------------

### Koreksi 2 --- 58 / 65 / 98 bukan target

Angka:

``` text
58
65
98
```

harus diperlakukan sebagai:

``` text
historical / calibration evidence
```

bukan:

``` text
LOW = 58
BALANCED = 65
HIGH = 98
```

------------------------------------------------------------------------

### Koreksi 3 --- 376 tidak boleh diberi arti tunggal

`376` dapat berhubungan dengan:

``` text
full-level tile space
full pyramid workload
planned workload
fallback workload
actual rendered workload
```

tergantung telemetry runtime.

Karena itu:

> **376 tidak boleh otomatis disebut bug dan tidak boleh otomatis
> disebut workload aktual.**

------------------------------------------------------------------------

### Koreksi 4 --- 52 juga belum boleh diberi arti tunggal

Kita **belum boleh mengatakan:**

> **"52 pasti C2."**

Data yang masih harus dibaca:

``` text
Base full       = ?
Detail full     = ?
Detail selected = ?
C2 Window       = ?
Fallback        = ?
Actual rendered = ?
Elapsed         = ?
```

Itulah evidence yang masih kurang untuk menghubungkan:

``` text
376
 ↓
BASE / DETAIL / C2
 ↓
52
```

Tidak perlu membuat Device Profiler baru untuk pertanyaan ini.

------------------------------------------------------------------------

### Koreksi 5 --- tidak ada patch pada tahap ini

Keputusan audit:

``` text
NO PATCH
NO PROFILER REBUILD
NO GEOMETRY CHANGE
NO QUEUE CHANGE
NO INDEXEDDB CHANGE
NO C2 CHANGE
```

Langkah validasi berikutnya hanya:

``` text
1 GeoPDF run di S7
↓
tunggu DONE
↓
Device Profiler
↓
scroll ke GEO PDF PERFORMANCE
↓
ambil C1 + C2 + render telemetry
```

------------------------------------------------------------------------

# 1. SUMBER DAN METODE AUDIT

Audit ini menggunakan:

1.  `doc.md` Tile Budget Contract V1 yang sudah ada;
2.  `MINE_GEOLOGIST_LITHOSITE_PYRAMID_ENGINE_ARCHITECTURE_MIGRATION_2026-09-10.md`;
3.  `MG1_LITHOSITE_VERSION_TECHNICAL_HISTORY.md`;
4.  changelog Lithosite V14.22--V15.14;
5.  current architectural findings yang sudah dicatat selama audit
    V24.5;
6.  field evidence yang sudah tercatat dalam project history;
7.  aturan baseline V24.5 / IndexedDB V2.

Dokumen sumber arsitektur menyatakan bahwa perubahan terbesar bukan
mengganti core `levels[] → tiles[]`, melainkan menambahkan lifecycle di
sekeliling core tersebut: identity, store index, queue, runtime loader,
missing resolver, runtime creation, expected geometry, compositor, dan
persistence version-aware.

------------------------------------------------------------------------

# 2. DEFINISI ENGINE V1

## 2.1 V1 = Functional Mining Member App

V1 memiliki:

``` text
Dashboard
Ringkasan
Digging
Validasi
KPI
Chat / Issue
Settings
Background Map
```

Map memiliki:

``` text
GeoPDF
GeoReference
GPS
Map Tap
Tile Rendering
```

Model:

``` text
Member App
├── Dashboard
├── Digging
├── Validasi
├── KPI
├── Chat
├── Settings
└── Background Map
    ├── GeoPDF
    ├── GeoReference
    ├── GPS
    ├── Map Tap
    └── Tile Rendering
```

Pada fase ini map sudah menjadi feature yang usable, tetapi belum
sepenuhnya diperlakukan sebagai offline geospatial runtime.

------------------------------------------------------------------------

# 3. MASALAH ARSITEKTUR V1

Masalah utama bukan sekadar "renderer lambat".

Masalahnya adalah ownership dan lifecycle belum cukup terpisah.

Model lama:

``` text
GeoPDF
   ↓
tilePyramid
   ↓
levels[].tiles[]
   ↓
renderer
```

`levels[].tiles[]` cenderung diperlakukan sebagai kumpulan tile yang
siap dipakai.

Belum ada pemisahan tegas antara:

``` text
STORED
```

dan:

``` text
RUNTIME_READY
```

Belum ada lifecycle formal:

``` text
expected
→ stored/missing
→ queued
→ loading/creating
→ ready/failed
```

------------------------------------------------------------------------

# 4. V1 TILE PYRAMID

Core lama:

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

Model ini **tidak dibuang** pada V2.

Ini penting:

> V2 adalah migration/lifecycle expansion, bukan penghapusan
> `levels[].tiles[]`.

------------------------------------------------------------------------

# 5. PERUBAHAN FUNDAMENTAL V1 → V2

## V1

``` text
GeoPDF
   ↓
Tile Pyramid
   ↓
Raster Tiles
   ↓
Renderer
```

## V2

``` text
GeoPDF
   ↓
GeoReference
   ↓
Device Profiler
   ↓
Tile Engine Profile
   ↓
C1 Viewport Planner
   ↓
C2 Adaptive Selection
   ↓
Expected Tile Geometry
   ↓
Tile Identity
   ↓
Tile Store / Queue
   ↓
Runtime Loader / Resolver
   ↓
Runtime Tile Creation
   ↓
Persistence
   ↓
Compositor
   ↓
Atomic Surface
   ↓
Map Runtime
```

Perubahan fundamental:

``` text
STATIC TILE COLLECTION
          ↓
TILE LIFECYCLE ENGINE
```

------------------------------------------------------------------------

# 6. DEFINISI ENGINE V2

V2 adalah:

> **Offline Geospatial Runtime**

Map bukan lagi sekadar image viewer.

Map memiliki subsystem:

``` text
Planning
Device profiling
Adaptive selection
Tile identity
Storage
Queue lifecycle
Runtime loading
Missing recovery
Runtime creation
Persistence
Surface lifecycle
```

Fondasi V2 kemudian menjadi protected runtime baseline.

------------------------------------------------------------------------

# 7. DEVICE PROFILER --- STEP A

## 7.1 Ownership

Device Profiler hanya bertanggung jawab untuk:

``` text
Measure device
↓
Classify tier
↓
Produce device profile
```

Bukan menentukan:

``` text
berapa tile viewport harus meminta
```

------------------------------------------------------------------------

## 7.2 Input

Data yang digunakan dapat mencakup:

``` text
navigator.deviceMemory
navigator.hardwareConcurrency
devicePixelRatio
screen width
screen height
screen pixel count
WebGL renderer
Canvas micro-benchmark
```

Hardware hints tidak berdiri sendiri.

Micro-benchmark digunakan untuk mendapatkan measurement yang lebih
representative.

------------------------------------------------------------------------

## 7.3 Benchmark

Model:

``` text
Warm-up
   ↓
Multiple samples
   ↓
Median
```

Tujuannya mengurangi pengaruh:

``` text
cold start
JIT
initialization spike
sample tunggal
```

------------------------------------------------------------------------

# 8. DEVICE FIELD EVIDENCE --- S7 EDGE

Historical field reference:

``` text
Device : Samsung S7 Edge
GPU    : Mali-T880 / ANGLE
RAM    : 4 GB
DPR    : 3.15
Profile: LOW
```

Benchmark historis:

``` text
Cold : 224.9 ms

Warm:
44 ms
38.2 ms
20.4 ms
```

Data tersebut adalah:

``` text
FIELD EVIDENCE
```

bukan:

``` text
FINAL TILE BUDGET
```

Tidak boleh membuat persamaan:

``` text
20.4 ms → LOW = X tiles
```

tanpa calibration.

------------------------------------------------------------------------

# 9. STEP B --- TILE ENGINE PROFILE

Reference profile saat ini:

## LOW

``` text
tileSize      = 768 px
maxFactor     = 1x
batchSize     = 2
batchDelay    = 25 ms
prefetch      = 0
cacheLimit    = 40
```

## BALANCED

``` text
tileSize      = 256 px
maxFactor     = 2x
batchSize     = 8
batchDelay    = 12 ms
prefetch      = 2
cacheLimit    = 150
```

## HIGH

``` text
tileSize      = 512 px
maxFactor     = 2x
batchSize     = 16
batchDelay    = 0 ms
prefetch      = 3
cacheLimit    = 300
```

Status angka-angka tersebut:

``` text
EXISTING / REFERENCE PROFILE
```

bukan automatic tile-count budget.

------------------------------------------------------------------------

# 10. BATCH ≠ BUDGET

Contoh:

``` text
batchSize = 2
```

berarti bagaimana work diproses secara bertahap.

Bukan:

``` text
2 tiles × budget
```

Budget, bila sudah dikalibrasi, adalah batas workload.

Batch adalah scheduling/chunking.

------------------------------------------------------------------------

# 11. PREFETCH ≠ CORE VISIBLE DEMAND

Architecture membedakan:

``` text
VISIBLE
PREFETCH
REQUIRED
```

Prefetch adalah kandidat tambahan.

Jangan otomatis memasukkan prefetch ke core visible budget tanpa
contract/calibration yang eksplisit.

------------------------------------------------------------------------

# 12. STEP C1 --- VIEWPORT PLANNER

C1 adalah **geometric planner**.

Input:

``` text
GeoReference
mapZoom
mapRotation
viewport geometry
tileSize
factor
```

Output:

``` text
visible
required
prefetch
totalLevelTiles
```

C1 menjawab:

> "Secara geometry, tile mana yang dibutuhkan viewport?"

C1 tidak menjawab:

> "Device mampu memproses berapa tile?"

------------------------------------------------------------------------

# 13. CONTOH C1

Historical example:

``` text
Zoom       = 1.25x
Factor     = 0.25x
Tile       = 256 px
Visible    = 6
Prefetch   = 1
Required   = 6
```

Artinya:

``` text
viewport demand = 6
```

Bukan otomatis:

``` text
actual PDF.js render = 6
```

------------------------------------------------------------------------

# 14. C1 --- FULL LEVEL VS REQUIRED

Satu level dapat memiliki:

``` text
Visible   = 6
Required  = 6
FullLevel = 376
```

Model:

``` text
FULL LEVEL
┌─────────────────────────────┐
│                             │
│       ┌─────────────┐       │
│       │  viewport   │       │
│       │  6 tiles    │       │
│       └─────────────┘       │
│                             │
└─────────────────────────────┘

FullLevel = ruang tile seluruh level
Required  = demand viewport
```

Jangan menyamakan ketiganya.

------------------------------------------------------------------------

# 15. STEP C2 --- ADAPTIVE SELECTION

C2 menerima hasil C1 dan menentukan selection yang akan diproses.

``` text
C1 demand
   ↓
C2 selection
   ↓
renderer
```

C2 adalah boundary adaptive selection.

------------------------------------------------------------------------

# 16. FIXED BASE / DETAIL ARCHITECTURE

Reference architecture:

``` text
BASE
   ↓
FULL COVERAGE

DETAIL
   ↓
C2 SELECTED WINDOW
```

Model:

``` text
┌──────────────────────────────────┐
│ BASE — FULL COVERAGE             │
│                                  │
│       ┌────────────────────┐     │
│       │ DETAIL             │     │
│       │ viewport-selected  │     │
│       │ window             │     │
│       └────────────────────┘     │
│                                  │
└──────────────────────────────────┘
```

BASE bukan berarti seluruh high-detail pyramid harus dirender.

BASE adalah full coverage pada level/base policy yang ditentukan engine.

DETAIL dapat dibatasi oleh C2.

------------------------------------------------------------------------

# 17. C2 FALLBACK HARUS DIBACA DARI TELEMETRY

Jangan mengasumsikan:

``` text
C2 selalu selected
```

atau:

``` text
C2 selalu full
```

Runtime harus dibaca dari:

``` text
Window valid?
Fallback?
Detail selected?
Planned?
Actual?
```

Jika C2 window invalid dan renderer menggunakan fallback, angka workload
dapat berubah secara material.

------------------------------------------------------------------------

# 18. TILE IDENTITY

Identity resmi:

``` text
factor / x / y
```

Contoh:

``` text
1/0/0
1/1/0
1/2/0
1/0/1
```

Identity yang sama dipakai oleh:

``` text
Tile Store
Tile Queue
Runtime Loader
Resolver
Persistence
```

Identity adalah contract lintas subsystem.

------------------------------------------------------------------------

# 19. TILE STORE --- INDEX, BUKAN DUPLICATE DATA

Model:

``` text
tileStore
├── version: 2
├── identity: factor/x/y
├── count
└── index
     ├── "1/0/0" → {levelIndex, tileIndex}
     ├── "1/1/0" → {levelIndex, tileIndex}
     └── ...
```

Lalu:

``` text
levelIndex
   +
tileIndex
   ↓
levels[].tiles[]
   ↓
dataUrl
```

Kontrak:

``` text
tileStore       = INDEX
levels[].tiles  = RASTER DATA
```

Jangan membuat duplicate `dataUrl` di `tileStore`.

------------------------------------------------------------------------

# 20. TILE QUEUE --- LIFECYCLE REGISTRY

Queue:

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

Kontrak:

``` text
STORED ≠ RUNTIME_READY
```

------------------------------------------------------------------------

# 21. TILE LIFECYCLE

``` text
EXPECTED
   ↓
Tile Store Lookup
   ↓
┌───────────────┐
│               │
FOUND         ABSENT
│               │
↓               ↓
STORED        MISSING
│               │
↓               ↓
QUEUED       RESOLVER
│               │
↓               ↓
LOADING      CREATING
│               │
↓               ↓
RUNTIME_READY  STORED
│
↓
COMPOSITOR
```

Failure:

``` text
LOADING / CREATING
        ↓
      FAILED
```

------------------------------------------------------------------------

# 22. QUEUE RECONCILIATION

Saat viewport berubah:

``` text
new visible keys
      ↓
reconcile pending
      ↓
remove stale pending work
```

Yang boleh disentuh:

``` text
pending
pendingSet
```

Yang tidak boleh disentuh oleh reconciliation:

``` text
loading
loadedSet
failedSet
storedSet
```

Ini adalah lifecycle ownership.

------------------------------------------------------------------------

# 23. RUNTIME TILE LOADER

Loader:

``` text
STORED
   ↓
QUEUE
   ↓
LOADING
   ↓
Image decode
   ↓
RUNTIME_READY
```

`Image` runtime berada di browser/RAM.

Ia bukan payload persistence kedua.

------------------------------------------------------------------------

# 24. MISSING DETAIL RESOLVER

Resolver:

``` text
EXPECTED KEY
      ↓
Tile Store
   ┌──┴──┐
FOUND  ABSENT
  ↓      ↓
STORED  MISSING
           ↓
        RESOLVER
```

Resolver hanya menentukan:

``` text
available
atau
needs creation
```

Resolver bukan renderer.

------------------------------------------------------------------------

# 25. RUNTIME TILE CREATION

Jika expected tile missing dan PDF source tersedia:

``` text
MISSING
   ↓
Resolver
   ↓
PDF source
   ↓
PDF.js
   ↓
Canvas
   ↓
dataUrl
   ↓
Runtime tile
   ↓
Tile Store
   ↓
Persistence
```

Perubahan V15.12 memperkenalkan on-demand creation.

Prinsip:

> **buat tile yang dibutuhkan, bukan otomatis membangun seluruh
> high-resolution pyramid untuk setiap runtime request.**

------------------------------------------------------------------------

# 26. RUNTIME TILE PERSISTENCE

Tile hasil runtime creation:

``` text
levels[].tiles
      ↓
tileStore rebuild
      ↓
__persistVersion++
      ↓
persistence
      ↓
IndexedDB
```

Penggunaan berikutnya:

``` text
IndexedDB
   ↓
Tile Store
   ↓
Loader
   ↓
Runtime
```

------------------------------------------------------------------------

# 27. PERSISTENCE VERSIONING

Race lama:

``` text
T0 snapshot V0
   ↓
T1 runtime tile → V1
   ↓
DB = V1
   ↓
T3 worker lama V0 selesai
   ↓
BAD: DB kembali V0
```

Model terbaru:

``` text
T0 V0
 ↓
T1 runtime tile V1
 ↓
DB V1
 ↓
worker V0 selesai
 ↓
DB current = V1
 ↓
V0 < V1
 ↓
SKIP
```

`__persistVersion` menjadi ordering marker.

------------------------------------------------------------------------

# 28. SANITIZE SEBELUM INDEXEDDB

Runtime RAM:

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
metadata
levels
serializable tiles
baseLayer
tileStore metadata
```

Tidak disimpan:

``` text
Image
HTMLImageElement
Promise
runtime cache
DOM state
```

------------------------------------------------------------------------

# 29. PERSISTENCE COALESCING

Model:

``` text
Tile A ─┐
Tile B ─┤
Tile C ─┼─→ debounce → latest snapshot → DB
Tile D ─┘
```

Tujuan:

``` text
menghindari terlalu banyak write
+
mengutamakan snapshot terbaru
```

Failure:

``` text
FAIL
 ↓
restore pending
 ↓
backoff
 ↓
retry
```

------------------------------------------------------------------------

# 30. DIRECT PDF.JS TILE RENDERING

Engine terbaru mendukung direct PDF.js tile rendering.

Model:

``` text
GeoPDF
 ├── PDF.js → Tile A
 ├── PDF.js → Tile B
 ├── PDF.js → Tile C
 └── PDF.js → Tile D
```

Bukan:

``` text
PDF
 ↓
satu PNG besar
 ↓
crop
 ↓
upscale semua level
```

Namun historical legacy/full-pyramid behavior tetap harus dibedakan dari
runtime path saat membaca telemetry.

------------------------------------------------------------------------

# 31. GEOMETRY CONTRACT

Geometry adalah contract terpisah.

Locked geometry:

``` text
SVG internal = 320 × 320
aspect ratio = 1:1
```

Tidak boleh menyelesaikan masalah performance dengan:

``` text
LOW-only Y multiplier
portrait compensation
percentage tuning
arbitrary offset
```

Jika ada masalah:

``` text
oval
top/bottom drift
left/right mismatch
```

trace:

``` text
GeoReference
 ↓
Geometry
 ↓
Bounds
 ↓
ViewBox
 ↓
C1
 ↓
Tile Resolution
 ↓
C2
 ↓
Queue
 ↓
Compositor
```

Bukan langsung mengubah budget.

------------------------------------------------------------------------

# 32. GEOPDF RENDER SCALE

Reference constants:

``` text
GEOPDF_RENDER_SCALE_        = 3.5
GEOPDF_MAX_RENDER_PIXELS_   = 12,000,000
GEOPDF_MAX_RENDER_DIMENSION_= 4096
```

Scale final dibatasi oleh:

``` text
requested scale
area limit
dimension limit
```

Ini adalah input rasterization constraint.

Bukan tile-count budget.

------------------------------------------------------------------------

# 33. BASE / DETAIL DAN ARTI "FULL"

Sangat penting:

``` text
BASE FULL
```

tidak boleh dibaca sebagai:

``` text
FULL HIGH-RES PYRAMID
```

BASE adalah full coverage pada base layer policy.

DETAIL adalah layer yang dapat dipersempit oleh C2.

Karena itu telemetry harus memisahkan:

``` text
Base full
Detail full
Detail selected
```

------------------------------------------------------------------------

# 34. 376 TILE --- AUDIT INTERPRETATION

Historical evidence:

``` text
230+
280
376
```

dan salah satu historical scenario:

``` text
376 tiles
≈ 159 seconds
```

Status:

``` text
ANTI-REGRESSION / HIGH-WORKLOAD REFERENCE
```

Bukan:

``` text
fixed target
```

Bukan pula otomatis:

``` text
actual current renderer
```

------------------------------------------------------------------------

# 35. 58 / 65 / 98 --- AUDIT INTERPRETATION

Historical evidence:

``` text
58
65
98
```

Status:

``` text
CALIBRATION EVIDENCE
```

Bukan:

``` text
fixed budget
```

Bukan:

``` text
tier identity
```

------------------------------------------------------------------------

# 36. NO MINIMUM

Tidak boleh ada:

``` text
minimum tile count
```

Jika demand:

``` text
C1 Required = 6
```

dan tidak ada additional required coverage:

``` text
Actual = 6
```

Budget tidak boleh memaksa:

``` text
6 → 50
6 → 100
```

------------------------------------------------------------------------

# 37. BUDGET CONTRACT YANG BENAR

Model:

``` text
Device capability
        ↓
Device tier
        ↓
Tile Engine Profile
        ↓
C1 viewport demand
        ↓
C2 adaptive selection
        ↓
Budget Gate
        ↓
Allowed workload
        ↓
Queue / Renderer
```

Budget adalah:

``` text
upper safety boundary
```

bukan:

``` text
target
```

------------------------------------------------------------------------

# 38. GLOBAL MAXIMUM --- STATUS AUDIT

Dokumen lama pernah menulis:

``` text
GLOBAL_MAX = 100
```

Audit mengubah statusnya menjadi:

``` text
GLOBAL_MAX
=
architectural / emergency ceiling
derived from evidence
```

Nilai final:

``` text
TBD
```

Invariant yang diinginkan:

``` text
LOW_MAX
 ≤ BALANCED_MAX
 ≤ HIGH_MAX
 ≤ GLOBAL_MAX
```

tetapi nilai numeriknya belum boleh dikunci.

Catatan:

Jika calibration membuktikan workload aman di atas 100, angka \>100
tidak otomatis salah.

Jika calibration membuktikan workload 100 tidak stabil pada device
tertentu, angka 100 tidak otomatis aman.

------------------------------------------------------------------------

# 39. DEVICE × VIEWPORT × SELECTION × WORKLOAD

Model V2 yang benar:

``` text
DEVICE CAPABILITY
        +
VIEWPORT DEMAND
        +
ADAPTIVE SELECTION
        +
TIER POLICY
        =
CONTROLLED WORKLOAD
```

Bukan:

``` text
ALL DEVICES
   ↓
ONE TILE COUNT
```

dan bukan:

``` text
ALL PDF
   ↓
ALL LEVEL
   ↓
ALL TILE
```

------------------------------------------------------------------------

# 40. FIELD EVIDENCE --- 52

Observed field result:

``` text
S7 / LOW
≈ 52
```

Namun angka `52` belum boleh diklasifikasikan sebagai:

``` text
C2
```

atau:

``` text
actual render
```

tanpa membaca telemetry lengkap.

Yang harus dicari:

``` text
Base full
Detail full
Detail selected
C2 Window
Fallback
Actual rendered
Elapsed
```

------------------------------------------------------------------------

# 41. SKENARIO PEMBUKTIAN 52

## Scenario A

``` text
Full pyramid : 376
Planned      : 52
Actual       : 52
Skipped      : 324
```

Interpretasi:

``` text
376 = full workload/space
52  = selected + actual workload
```

Ini akan mendukung kesimpulan bahwa runtime tidak merender seluruh 376
pada run tersebut.

Tetapi komposisi BASE/DETAIL tetap harus dibaca dari telemetry.

------------------------------------------------------------------------

## Scenario B

``` text
Full pyramid : 376
Planned      : 52
Actual       : 52
Skipped      : 0
```

Interpretasi:

``` text
52
=
planned set yang seluruhnya dirender
```

Sumber angka 52 masih harus ditelusuri dari C2/selection.

------------------------------------------------------------------------

## Scenario C

``` text
Full pyramid : 376
Planned      : 376
Actual       : 376
Skipped      : 0
```

Interpretasi:

``` text
adaptive reduction tidak terjadi pada workload tersebut
```

Lalu trace:

``` text
C1
C2 window
fallback
BASE/DETAIL
```

------------------------------------------------------------------------

## Scenario D

``` text
Planned      : 52
Actual       : 376
```

Ini adalah mismatch:

``` text
selection contract
        ≠
actual renderer work
```

Harus diaudit sebelum patch apa pun.

------------------------------------------------------------------------

# 42. DATA YANG TIDAK BOLEH DIKIRA-KIRA

Jangan mengisi:

``` text
Base full       = guessed
Detail full     = guessed
Detail selected = guessed
C2 Window       = guessed
Fallback        = guessed
Actual rendered = guessed
Elapsed         = guessed
```

Jika tidak terlihat di telemetry:

``` text
TBD
```

------------------------------------------------------------------------

# 43. TELEMETRY YANG SUDAH DIBUTUHKAN

Target panel:

``` text
GEO PDF PERFORMANCE
```

dengan:

``` text
DEVICE
PROFILE
C1
C2
RENDER
```

Minimal C1:

``` text
Visible
Required
Full level
Factor
Tile size
```

Minimal C2:

``` text
Enabled
Window valid
Base full
Detail full
Detail selected
Fallback
Fallback reason
```

Minimal render:

``` text
Planned
Actual rendered
Skipped
Failed
Elapsed
```

------------------------------------------------------------------------

# 44. TIDAK PERLU PROFILER BARU

Pertanyaan:

> "52 itu apa?"

bukan pertanyaan Device Profiling.

Profiler sudah menjawab:

``` text
device capability
tier
benchmark
hardware context
```

Pertanyaan 52 berada pada:

``` text
GeoPDF Performance
C1
C2
Renderer
```

Karena itu:

``` text
NO NEW PROFILER
```

------------------------------------------------------------------------

# 45. DAILY DIAGNOSTIC ORDER

Jika map terasa lambat:

### 1. Device

``` text
Tier
Bench
RAM
CPU
DPR
GPU
```

### 2. Profile

``` text
Tile size
Factor
Batch
Delay
Prefetch
Cache
```

### 3. C1

``` text
Visible
Required
Full level
```

### 4. C2

``` text
Window
Selection
Fallback
BASE/DETAIL
```

### 5. Renderer

``` text
Planned
Actual
Skipped
Failed
Elapsed
```

### 6. Queue

``` text
Pending
Loading
Loaded
Failed
Stored
```

### 7. Persistence

``` text
Stored?
Missing?
Created?
Persisted?
```

------------------------------------------------------------------------

# 46. ANTI-REGRESSION RULES

## Rule 1

Jangan kembali ke default:

``` text
full pyramid
→ crop
→ resize
→ all levels
→ all tiles
```

untuk runtime viewport work.

------------------------------------------------------------------------

## Rule 2

Jika:

``` text
C1 Required = 6
```

jangan tiba-tiba:

``` text
Actual = 376
```

tanpa alasan arsitektural yang terlihat di telemetry.

------------------------------------------------------------------------

## Rule 3

Jangan membuat:

``` text
LOW = 58
BALANCED = 65
HIGH = 98
```

------------------------------------------------------------------------

## Rule 4

Jangan menjadikan:

``` text
100
```

sebagai minimum.

------------------------------------------------------------------------

## Rule 5

Jangan mengubah geometry untuk menyelesaikan tile budget.

------------------------------------------------------------------------

## Rule 6

Jangan mengubah IndexedDB untuk menyelesaikan C1/C2.

------------------------------------------------------------------------

## Rule 7

Jangan mengubah Queue hanya karena budget belum terkalibrasi.

------------------------------------------------------------------------

## Rule 8

Jangan mengubah Device Profiler untuk menjelaskan renderer mismatch.

------------------------------------------------------------------------

## Rule 9

Jangan patch sebelum owner masalah diketahui.

------------------------------------------------------------------------

# 47. FILE OWNERSHIP PRINCIPLE

Engine V2 tidak boleh diperlakukan sebagai satu file raksasa secara
konseptual.

Boundary utama:

``` text
Device Profiler
    ↓
device capability

Tile Engine Profile
    ↓
workload parameters

C1
    ↓
geometry demand

C2
    ↓
selection

Tile Queue
    ↓
lifecycle

Tile Store
    ↓
persistent index

Runtime Loader
    ↓
runtime loading

Resolver
    ↓
missing decision

Runtime Creation
    ↓
PDF.js tile creation

Persistence
    ↓
durability

Surface Lifecycle
    ↓
visual replacement
```

------------------------------------------------------------------------

# 48. MANAGEMENT ≠ RUNTIME

V24.3 Map Library dibuat di boundary:

``` text
Map Management UI
       ↓
map-management-compat.js
       ↓
MG1MapLibrary
       ↓
Contract / Capability / Metadata
       ↓
IndexedDB boundary
```

Runtime tetap:

``` text
LOCKED MAP RUNTIME
```

Prinsip:

``` text
Management ≠ Runtime
Metadata ≠ Tile Payload
Library ≠ Renderer
Query ≠ Persistence Owner
UI ≠ Surface Lifecycle
```

------------------------------------------------------------------------

# 49. METADATA WRITE BOUNDARY

Metadata API hanya untuk:

``` text
name
labels
collectionNames
```

Bukan:

``` text
tiles
GeoReference
imageDataUrl
tilePyramid
runtime payload
```

Runtime/full-payload write tetap dimiliki lifecycle/storage owner
masing-masing.

------------------------------------------------------------------------

# 50. ATOMIC SURFACE

Map replacement:

``` text
Old Surface
     ↓
Build New Surface
     ↓
Hidden
     ↓
Preload
     ↓
READY?
   ┌─┴─┐
 YES  NO
  ↓    ↓
SWAP  REMOVE NEW
```

Old surface dipertahankan jika new surface belum siap.

------------------------------------------------------------------------

# 51. MODAL ISOLATION

V19/V23 memisahkan management modal dari global render.

Jangan membuat:

``` text
Open Modal
   ↓
global render()
   ↓
map rebuild
```

untuk modal lifecycle.

Modal harus isolated.

Ini penting agar diagnostic/performance changes tidak merusak UI
lifecycle.

------------------------------------------------------------------------

# 52. RAM-FIRST SAVE

V24.1:

``` text
Save
 ↓
RAM commit
 ↓
Instant preview
 ↓
background persistence
```

Heavy IndexedDB persistence tidak menjadi blocking click path.

------------------------------------------------------------------------

# 53. V24.5 BOUNDARY

V24.5:

``` text
IndexedDB V2
```

V24.5 runtime tetap terpisah dari V25.

Protected runtime:

``` text
Tile Engine
C1
C2
GeoReference
Gesture
Marker/GPS
Tile Runtime
Atomic Surface
RAM-first save
```

------------------------------------------------------------------------

# 54. V25 BOUNDARY

V25 memiliki schema berbeda:

``` text
IndexedDB V4

maps
kmlOverlays
layers
mapLayerState
features
```

Jangan membawa schema V25 ke V24.5 hanya untuk menyelesaikan tile
performance.

------------------------------------------------------------------------

# 55. VERSION EVOLUTION --- RINGKASAN AUDIT

``` text
V1
Functional Mining Member App
        ↓
V2
Offline Geospatial Runtime
        ↓
V14.22
Device Profiler
        ↓
V14.23
Diagnostic Overlay
        ↓
V14.24
Profiler V2 / Median
        ↓
V14.25
Tile Engine Profile
        ↓
V14.26
C1 Viewport Planner
        ↓
V14.28
Adaptive C2
        ↓
V14.30
C2 Metrics
        ↓
V14.31
Controlled Field Test
        ↓
V14.32 / V14.36
GeoReference Handoff
        ↓
V14.33–V14.47
LOW quality / density / factor tuning
        ↓
V15.1
BASE + DETAIL
        ↓
V15.2
Tile Identity
        ↓
V15.3
Persistent BASE
        ↓
V15.4
Persistent SVG Surface
        ↓
V15.5
DETAIL lifecycle
        ↓
V15.6
DETAIL-first compositor
        ↓
V15.7
Persistent Tile Store
        ↓
V15.8
Queue Registry
        ↓
V15.9
Queue Consumer
        ↓
V15.10
Runtime Loader
        ↓
V15.11
Missing Resolver
        ↓
V15.12
Runtime Tile Creation
        ↓
V15.13
Runtime Persistence
        ↓
V15.14
Stable Save Surface
        ↓
V17.1
GeoPDF no-flicker
        ↓
V19
Isolated Modal
        ↓
V22
Atomic Surface
        ↓
V23
Management Isolation
        ↓
V24.1
RAM-first / Instant Save
        ↓
V24.2
Protected Runtime
        ↓
V24.3+
Map Library / Lifecycle
        ↓
V24.5
Current Runtime + Storage / Recovery baseline
```

------------------------------------------------------------------------

# 56. ENGINE V1 VS V2 --- AUDIT TABLE

  Area                 V1                     V2
  -------------------- ---------------------- ----------------------------
  Map role             Feature                Offline geospatial runtime
  Tile core            `levels[].tiles[]`     Tetap dipertahankan
  Identity             sederhana              `factor/x/y`
  Store                implicit               `tileStore` index
  Queue                limited/simple         lifecycle registry
  Stored vs Ready      tidak tegas            tegas
  Geometry             existing tiles         expected viewport geometry
  Device adaptation    minim                  Device Profiler + tier
  Planning             limited                C1
  Adaptive selection   limited                C2
  BASE                 legacy/base behavior   full coverage base layer
  DETAIL               static/cropped         viewport-selected/runtime
  Missing tile         tidak formal           resolver
  Runtime creation     tidak formal           on-demand PDF.js
  Persistence          snapshot-oriented      version-aware/coalesced
  Surface              replace-oriented       atomic
  Management           dekat runtime          boundary terpisah

------------------------------------------------------------------------

# 57. WHAT IS LOCKED

``` text
[LOCKED]
Geometry Contract V1
SVG 320×320
Aspect 1:1

[LOCKED]
V24.2 Protected Runtime

[LOCKED]
V24.5 IndexedDB V2

[LOCKED]
Tile Identity factor/x/y

[LOCKED]
BASE/DETAIL architectural concept

[LOCKED]
Atomic Surface lifecycle

[LOCKED]
RAM-first save principle

[LOCKED]
Management ≠ Runtime
```

"Locked" berarti jangan diubah incidental.

Jika ada bukti regresi, audit dependency dilakukan terlebih dahulu.

------------------------------------------------------------------------

# 58. WHAT IS NOT LOCKED

Numeric budget:

``` text
LOW_MAX       = TBD
BALANCED_MAX  = TBD
HIGH_MAX      = TBD
GLOBAL_MAX    = TBD
```

Dan:

``` text
meaning of observed 52
```

belum dikunci.

------------------------------------------------------------------------

# 59. CALIBRATION MATRIX

Untuk setiap tier:

  -----------------------------------------------------------------------------
  Field                           LOW             BALANCED                 HIGH
  -------------- -------------------- -------------------- --------------------
  Device model                    TBD                  TBD                  TBD

  GPU                             TBD                  TBD                  TBD

  RAM                             TBD                  TBD                  TBD

  DPR                             TBD                  TBD                  TBD

  Bench median                    TBD                  TBD                  TBD

  Tile size        Existing/reference   Existing/reference   Existing/reference

  Factor                  TBD per run          TBD per run          TBD per run

  C1 visible                      TBD                  TBD                  TBD

  C1 required                     TBD                  TBD                  TBD

  Full level                      TBD                  TBD                  TBD

  C2 selected                     TBD                  TBD                  TBD

  Planned                         TBD                  TBD                  TBD

  Actual                          TBD                  TBD                  TBD

  Skipped                         TBD                  TBD                  TBD

  Failed                          TBD                  TBD                  TBD

  Elapsed                         TBD                  TBD                  TBD

  Stability                       TBD                  TBD                  TBD
  -----------------------------------------------------------------------------

Numeric ceiling hanya boleh diturunkan setelah evidence cukup.

------------------------------------------------------------------------

# 60. CALIBRATION RULE

Jangan mengunci budget berdasarkan:

``` text
1 device
1 run
1 GeoPDF
1 benchmark
```

Idealnya calibration melihat:

``` text
device capability
+
viewport demand
+
tile size
+
factor
+
selected workload
+
actual render
+
elapsed
+
stability
```

------------------------------------------------------------------------

# 61. PERFORMANCE MODEL

Workload tidak hanya:

``` text
tile count
```

Tetapi dipengaruhi:

``` text
tile count
× tile pixel area
× render factor
× number of levels
× rendering path
```

Karena itu:

``` text
768px
```

tidak otomatis berarti:

``` text
lebih ringan
```

dibanding:

``` text
256px
```

Jumlah tile dan pixel workload harus dibaca bersama.

------------------------------------------------------------------------

# 62. DAILY USE --- EXISTING MAP

Saat user membuka map yang sudah tersimpan:

``` text
Active Map
   ↓
Viewport
   ↓
Expected keys
   ↓
Tile Store
```

Jika ada:

``` text
STORED
```

maka:

``` text
Queue
 ↓
Loader
 ↓
Runtime Ready
```

Jika tidak ada:

``` text
MISSING
 ↓
Resolver
 ↓
Runtime Creation
```

bila source tersedia.

------------------------------------------------------------------------

# 63. DAILY USE --- PAN / ZOOM

``` text
User gesture
   ↓
viewport changes
   ↓
C1
   ↓
expected tile keys
   ↓
Store lookup
   ↓
Queue / Resolver
   ↓
Loader / Creation
   ↓
Compositor
```

Gesture tidak boleh menunggu:

``` text
PDF.js
IndexedDB
runtime tile creation
```

------------------------------------------------------------------------

# 64. DAILY USE --- NEW GEOPDF

``` text
New GeoPDF
   ↓
Incoming GeoReference
   ↓
C1
   ↓
C2
   ↓
Tile processing
   ↓
Persistence
   ↓
Atomic surface
```

Incoming GeoReference harus tersedia sebelum planner menggunakan state
baru.

------------------------------------------------------------------------

# 65. DAILY USE --- RESTART

``` text
Close
 ↓
Reopen
 ↓
Open same map
 ↓
IndexedDB
 ↓
Tile Store
 ↓
Loader
```

Tujuannya memastikan tile yang sudah persistent dapat digunakan kembali
tanpa selalu melakukan PDF.js creation ulang.

------------------------------------------------------------------------

# 66. DIAGNOSTIC FIELD TEST --- S7

**Tidak ada patch.**

Satu run:

``` text
1. Jalankan GeoPDF di S7.
2. Tunggu proses benar-benar DONE.
3. Buka Device Profiler.
4. Scroll panel sampai bawah.
5. Cari GEO PDF PERFORMANCE.
6. Ambil bagian C1.
7. Ambil bagian C2.
8. Ambil bagian RENDER.
```

Yang dicari:

``` text
C1
Visible
Required
FullLevel

C2
BaseFull
DetailFull
DetailSelected
Window
Fallback

Render
Planned
Actual
Skipped
Failed
Elapsed
```

------------------------------------------------------------------------

# 67. HASIL YANG KITA INGINKAN DARI SCREENSHOT

Bukan screenshot UI umum.

Yang paling berguna:

``` text
GEO PDF PERFORMANCE
        ↓
C1
        ↓
C2
        ↓
RENDER
```

Jika panel terpotong:

``` text
scroll
```

bukan patch.

------------------------------------------------------------------------

# 68. DECISION TREE SETELAH TELEMETRY ADA

``` text
FullLevel = 376
        ↓
Planned ?
        ↓
Actual ?
        ↓
Skipped ?
        ↓
C2 Window valid?
        ↓
Fallback?
        ↓
Base / Detail composition?
```

Lalu:

``` text
IF Planned << FullLevel
AND Actual ≈ Planned
→ adaptive selection likely active

IF Planned = FullLevel
AND Actual = FullLevel
→ full workload actually selected

IF Planned << FullLevel
BUT Actual >> Planned
→ renderer/selection mismatch

IF C2 Window invalid
→ inspect fallback path

IF BASE FULL dominates planned
→ distinguish base coverage from detail workload
```

Kata **likely** digunakan sampai telemetry lengkap.

------------------------------------------------------------------------

# 69. STATUS 52 --- TIDAK BOLEH OVERCLAIM

Current statement yang aman:

``` text
Observed field result:
≈ 52
```

Current statement yang belum aman:

``` text
52 = C2
```

Current statement yang belum aman:

``` text
52 = actual PDF.js render
```

Current statement yang belum aman:

``` text
52 = detail selected
```

Current statement yang belum aman:

``` text
52 = budget
```

Semua itu menunggu telemetry.

------------------------------------------------------------------------

# 70. STATUS 376 --- TIDAK BOLEH OVERCLAIM

Current statement yang aman:

``` text
376 = historical/full-level/high-workload evidence
```

Current statement yang belum aman untuk run tertentu:

``` text
376 = actual PDF.js render
```

atau:

``` text
376 = C2 fallback
```

atau:

``` text
376 = current bug
```

tanpa telemetry.

------------------------------------------------------------------------

# 71. AUDIT TERHADAP DOKUMEN SEBELUMNYA

## Finding A --- Architecture coverage

**PASS**

Dokumen sebelumnya sudah mencakup:

``` text
V1
V2
Profiler
C1
C2
Store
Queue
Persistence
Geometry
V24.5/V25
```

------------------------------------------------------------------------

## Finding B --- V1 → V2 lifecycle

**PASS**

Migration source secara eksplisit menyatakan core `levels[] → tiles[]`
tetap dan lifecycle di sekelilingnya berkembang.

------------------------------------------------------------------------

## Finding C --- Tile identity

**PASS**

``` text
factor/x/y
```

tetap menjadi identity lintas subsystem.

------------------------------------------------------------------------

## Finding D --- Stored vs Runtime Ready

**PASS**

Kontrak:

``` text
STORED ≠ RUNTIME_READY
```

dipertahankan.

------------------------------------------------------------------------

## Finding E --- Queue ownership

**PASS**

Reconciliation hanya menyentuh:

``` text
pending
pendingSet
```

dan tidak menyentuh state lifecycle lainnya.

------------------------------------------------------------------------

## Finding F --- Geometry separation

**PASS**

Geometry dipisahkan dari performance budget.

------------------------------------------------------------------------

## Finding G --- V24.5/V25 separation

**PASS**

V24.5 tetap IndexedDB V2 dan tidak dicampur dengan V25 IndexedDB V4.

------------------------------------------------------------------------

## Finding H --- Global 100

**CORRECTED**

Dokumen lama masih mengunci:

``` text
GLOBAL_MAX = 100
```

Status baru:

``` text
GLOBAL_MAX = TBD / evidence-derived
```

------------------------------------------------------------------------

## Finding I --- 52 interpretation

**PENDING**

Belum ada dasar untuk menyatakan:

``` text
52 = C2
```

------------------------------------------------------------------------

## Finding J --- 376 interpretation

**PENDING FOR CURRENT RUN**

376 memiliki historical meaning, tetapi arti tepat pada current runtime
run harus dibaca dari telemetry.

------------------------------------------------------------------------

# 72. RELEASE / PATCH GATE

Sebelum patch:

``` text
[ ] Current baseline confirmed
[ ] Device tier confirmed
[ ] STEP B confirmed
[ ] C1 confirmed
[ ] C2 confirmed
[ ] BASE/DETAIL confirmed
[ ] Planned confirmed
[ ] Actual confirmed
[ ] Queue state confirmed
[ ] Persistence state confirmed
[ ] Console clean
```

Jika belum:

``` text
NO PATCH
```

------------------------------------------------------------------------

# 73. FINAL ENGINEERING RULE

Urutan:

``` text
TRACE CONTRACT
      ↓
MEASURE
      ↓
UNDERSTAND OWNER
      ↓
CALIBRATE
      ↓
MINIMAL CHANGE
      ↓
VALIDATE
      ↓
LOCK
```

Bukan:

``` text
SEE NUMBER
      ↓
GUESS
      ↓
PATCH
      ↓
REGRESSION
      ↓
PATCH AGAIN
```

------------------------------------------------------------------------

# 74. FINAL ARCHITECTURE

``` text
                           GEOPDF
                              │
                              ▼
                        GeoReference
                              │
                              ▼
                       DEVICE PROFILER
                              │
                    LOW / BAL / HIGH
                              │
                              ▼
                    TILE ENGINE PROFILE
                              │
                              ▼
                       C1 VIEWPORT
                           PLANNER
                              │
                 ┌────────────┴────────────┐
                 │                         │
              VISIBLE                  REQUIRED
                 │                         │
                 └────────────┬────────────┘
                              ▼
                       C2 ADAPTIVE
                         SELECTION
                              │
                     ┌────────┴────────┐
                     │                 │
                   BASE              DETAIL
                full coverage     selected window
                     │                 │
                     └────────┬────────┘
                              ▼
                       TILE IDENTITY
                         factor/x/y
                              │
                    ┌─────────┴─────────┐
                    │                   │
                TILE STORE          TILE QUEUE
                    │                   │
                 STORED             PENDING
                    │                   │
                    │                LOADING
                    │                   │
                    └────────┬──────────┘
                             ▼
                       RUNTIME LOADER
                             │
                       ┌─────┴─────┐
                       │           │
                     READY       MISSING
                       │           │
                       │       RESOLVER
                       │           │
                       │      PDF.js CREATE
                       │           │
                       └─────┬─────┘
                             ▼
                         COMPOSITOR
                             ▼
                       ATOMIC SURFACE
                             ▼
                         MAP RUNTIME
                             │
                             ▼
                         PERSISTENCE
                             │
                             ▼
                         INDEXEDDB V2
```

------------------------------------------------------------------------

# 75. FINAL DAILY-USE MODEL

Untuk penggunaan sehari-hari, cukup ingat:

``` text
DEVICE
  ↓
PROFILE
  ↓
C1
  ↓
C2
  ↓
STORE / QUEUE
  ↓
LOAD / CREATE
  ↓
COMPOSITE
  ↓
DISPLAY
  ↓
PERSIST
```

Dan jika ada masalah:

``` text
JANGAN LANGSUNG PATCH.

LIHAT TELEMETRY.
```

------------------------------------------------------------------------

# 76. FIVE FOOTNOTES / CATATAN KAKI

### \[1\] Device Profiler

Profiler menentukan kemampuan/tier device. Ia bukan tile counter dan
bukan renderer.

### \[2\] Historical 58 / 65 / 98

Angka tersebut adalah calibration evidence. Tidak boleh dipakai sebagai
fixed LOW/BALANCED/HIGH target.

### \[3\] Historical 376

376 adalah high-workload/full-level evidence dan anti-regression
reference. Pada current run, maknanya harus dibuktikan dari telemetry.

### \[4\] Budget

Budget tidak memiliki minimum. Nilai tier dan global ceiling harus
evidence-derived. `100` bukan final hard ceiling.

### \[5\] Yang belum boleh kita simpulkan

Kita belum boleh mengatakan:

> **"52 pasti C2."**

Karena kita belum melihat:

``` text
Base full       = ?
Detail full     = ?
Detail selected = ?
C2 Window       = ?
Fallback        = ?
Actual rendered = ?
Elapsed         = ?
```

Itulah satu-satunya data penting yang masih kurang untuk menjelaskan
hubungan:

``` text
376
 ↓
BASE / DETAIL / C2
 ↓
52
```

Telemetry yang dibutuhkan sudah berada di jalur GeoPDF/C1/C2/render pada
`peta.js`; tidak perlu membuat profiler baru.

------------------------------------------------------------------------

# 77. CURRENT ACTION --- NO PATCH

``` text
STATUS:
AUDIT DOCUMENTED
ENGINE V1 → V2 DOCUMENTED
BUDGET NUMBERS NOT LOCKED
52 INTERPRETATION PENDING
NO PATCH
```

Langkah berikutnya:

``` text
S7
 ↓
1× GeoPDF process
 ↓
WAIT UNTIL DONE
 ↓
Device Profiler
 ↓
SCROLL DOWN
 ↓
GEO PDF PERFORMANCE
 ↓
C1
 ↓
C2
 ↓
RENDER
 ↓
SCREENSHOT
```

Setelah telemetry itu tersedia, barulah hubungan:

``` text
376
 ↓
BASE / DETAIL / C2
 ↓
52
```

dapat dihitung dan dikunci secara evidence-based.

------------------------------------------------------------------------

# 78. END STATE

**Engine V2 bukan kumpulan patch.**

Engine V2 adalah:

``` text
DEVICE-AWARE
+
VIEWPORT-AWARE
+
ADAPTIVE
+
IDENTITY-BASED
+
LIFECYCLE-BASED
+
PERSISTENT
+
SURFACE-SAFE
```

Dengan prinsip permanen:

> **Measure first. Trace ownership. Calibrate. Change minimally.
> Validate. Lock.**

**V24.5 tetap menjadi baseline IndexedDB V2 untuk dokumen ini.**
