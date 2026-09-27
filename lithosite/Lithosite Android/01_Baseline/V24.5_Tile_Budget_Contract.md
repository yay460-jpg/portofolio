# MG1 / LITHOSITE --- TILE BUDGET CONTRACT V1

## Device-Tier Adaptive Tile Processing --- Engineering Reference & Permanent Reminder

**Status:** ARCHITECTURE CONTRACT / REMINDER\
**Project:** MG1 / Mine Geologist / Lithosite Member App\
**Runtime:** V24.5 --- IndexedDB V2\
**Scope:** Adaptive Tile Engine, Device Profiler, C1 Viewport Planner,
C2 Tile Selection, Tile Processing Budget\
**Priority:** HIGH --- performance architecture / anti-regression\
**Implementation status:** FINAL LOCKED — 50/80 BASELINE
\
**Rule:** Do not invent LOW/BALANCED/HIGH tile-budget numbers before
calibration evidence exists.

> **Baseline update 2026-09-17:** The calibration/implementation stage for the current V24.5 baseline has now locked the operational tier ceilings at **LOW 50 / cache 80, BALANCED 100 / cache 150, HIGH 200 / cache 300**. The current Quality Selection contract uses **QUALITY_FLOOR 50** and **MAX_EXPANSION_RADIUS 20**. Historical TBD/NO-MINIMUM statements in this document are retained only as engineering history and are superseded by the current locked contract above.

------------------------------------------------------------------------

# 1. Purpose

Dokumen ini menjadi **engineering reference dan reminder permanen**
untuk pengembangan Adaptive Tile Engine Lithosite.

Tujuan utamanya adalah memastikan jumlah tile yang diproses GeoPDF tidak
kembali ke pola lama berupa full-pyramid rendering seperti:

-   230+ tile
-   280 tile
-   376 tile

padahal viewport aktif hanya membutuhkan sebagian kecil tile.

Pada saat yang sama, sistem tidak boleh dipaksa menggunakan satu angka
global untuk semua perangkat.

Kontrak ini menggunakan prinsip:

``` text
Device capability
       ↓
Device Tier
       ↓
Tile Engine Profile
       ↓
Viewport Demand
       ↓
Tile Budget Gate
       ↓
Actual Processing
```

Kontrak ini **tidak menggantikan C1**, tidak menggantikan C2, dan tidak
menggantikan Tile Queue.

Budget adalah **safety/performance boundary** di antara kebutuhan
adaptif dan workload aktual.

------------------------------------------------------------------------

# 2. Product Highlight --- Keunggulan Lithosite

## 2.1 Device-aware offline map runtime

Lithosite tidak memperlakukan semua perangkat sebagai perangkat yang
sama.

Sistem telah memiliki Device Profiler yang menghasilkan tier:

``` text
LOW
BALANCED
HIGH
```

Tier tersebut berasal dari kombinasi micro-benchmark dan hardware hints.

Ini menjadi fondasi untuk mengatur workload secara adaptif.

------------------------------------------------------------------------

## 2.2 Adaptive Tile Engine

Lithosite menggunakan pendekatan:

``` text
GeoPDF
  ↓
GeoReference
  ↓
Device Profiler
  ↓
Tile Engine Profile
  ↓
Viewport Planner
  ↓
Adaptive Tile Pyramid
  ↓
Tile Identity
  ↓
Persistent Tile Store
  ↓
Runtime Tile Loader
  ↓
Missing Tile Resolver
  ↓
Runtime Tile Creation
  ↓
Atomic Surface
  ↓
Map Runtime
```

Arsitektur ini membuat map lebih dekat ke **offline geospatial
runtime**, bukan sekadar image viewer.

------------------------------------------------------------------------

## 2.3 Viewport culling

C1 tidak sekadar menghitung seluruh tile.

Planner menghitung:

``` text
VISIBLE
PREFETCH
REQUIRED
```

Contoh historical planner:

``` text
Zoom       : 1.25x
Factor     : 0.25x
Tile       : 256 px
Visible    : 6
Prefetch   : 1
Required   : 6
```

Artinya workload seharusnya mengikuti kebutuhan viewport, bukan ukuran
penuh GeoPDF.

------------------------------------------------------------------------

## 2.4 Device-tier workload

STEP B sudah memiliki parameter berbeda untuk setiap tier.

Current/reference profile:

``` text
LOW
  tileSize       768 px
  maxFactor      1x
  batchSize      2
  batchDelay     25 ms
  prefetch       0
  cacheLimit     40

BALANCED
  tileSize       256 px
  maxFactor      2x
  batchSize      8
  batchDelay     12 ms
  prefetch       2
  cacheLimit     150

HIGH
  tileSize       512 px
  maxFactor      2x
  batchSize      16
  batchDelay     0 ms
  prefetch       3
  cacheLimit     300
```

Parameter tersebut adalah **existing/reference architecture**, bukan
otomatis berarti angka tile budget.

Jangan mencampurkan:

``` text
tileSize
maxFactor
batchSize
prefetch
cacheLimit
```

dengan:

``` text
maxTiles / tile processing budget
```

Keduanya berbeda kontrak.

------------------------------------------------------------------------

# 3. Existing Device Profiler

## 3.1 STEP A

Device Profiler melakukan pengukuran kemampuan perangkat.

Input yang tersedia antara lain:

``` text
navigator.deviceMemory
navigator.hardwareConcurrency
devicePixelRatio
screen width
screen height
screen pixel count
WebGL renderer
canvas raster micro-benchmark
```

Micro-benchmark menggunakan beberapa sample dan median sebagai
representasi hasil.

Tujuannya mengurangi pengaruh cold-start / JIT / initialization spike.

------------------------------------------------------------------------

## 3.2 Historical worst-case reference

Field test yang telah tercatat:

``` text
Device      : Samsung S7 Edge
GPU         : Mali-T880 / ANGLE
DPR         : 3.15
RAM         : 4 GB

Cold        : 224.9 ms
Warm        : 44 ms
             38.2 ms
             20.4 ms

Profile     : LOW
```

Data ini adalah **field evidence**, bukan angka budget final.

Jangan menggunakan:

``` text
20.4 ms → LOW = X tiles
```

secara langsung tanpa calibration.

------------------------------------------------------------------------

# 4. Why a Tile Budget Is Needed

Viewport culling menjawab:

> "Tile mana yang dibutuhkan?"

Device Profiler menjawab:

> "Perangkat ini termasuk tier apa?"

Tile Budget menjawab:

> "Berapa besar workload maksimum yang boleh dilepas ke processing
> pipeline pada tier tersebut?"

Ketiganya berbeda.

``` text
C1 = geometric demand
Profiler = device capability
Budget = workload safety boundary
```

------------------------------------------------------------------------

# 5. Tile Budget Contract V1

## 5.1 Global contract

Kontrak V1:

``` text
LOW_MAX       = 50
BALANCED_MAX  = 100
HIGH_MAX      = 200
GLOBAL_MAX    = 200
```

Invariant:

``` text
LOW_MAX
   <=
BALANCED_MAX
   <=
HIGH_MAX
   <=
GLOBAL_MAX
```

Quality selection menggunakan floor adaptif, bukan target processing mati:

``` text
QUALITY_FLOOR = 50
MAX_EXPANSION_RADIUS = 20
```

Catatan: QUALITY_FLOOR 50 bukan kewajiban untuk memproses tepat 50 pada setiap kondisi. Jika C1 sudah membutuhkan lebih dari 50 dan masih berada dalam capability ceiling, demand tersebut dipertahankan.

------------------------------------------------------------------------

# 6. NO MINIMUM Rule

Ini merupakan aturan penting.

Budget bukan target.

Jika C1 hanya membutuhkan:

``` text
required = 6
```

maka sistem tidak boleh memaksa:

``` text
6 → 50
```

atau:

``` text
6 → 100
```

Hasil yang benar:

``` text
actual = 6
```

Budget hanya menjadi batas maksimum.

Secara konsep:

``` text
actualTiles = min(requiredTiles, tierMaxTiles, globalMaxTiles)
```

Tetapi formula tersebut hanya menjadi model konseptual sampai C2
selection mechanism ditetapkan.

------------------------------------------------------------------------

# 7. 376-Tile Regression

## 7.1 Problem

Historical V1 processing pernah menghasilkan:

``` text
230+
280
376
```

Dalam satu skenario 376 tile membutuhkan sekitar:

``` text
159 seconds
```

Ini merupakan workload yang harus diperlakukan sebagai **anti-regression
reference**.

------------------------------------------------------------------------

## 7.2 376 is not a target

376 bukan angka yang harus "dioptimalkan sedikit".

376 adalah indikasi bahwa full-pyramid fallback dapat terjadi.

Jika viewport hanya:

``` text
Visible = 6
Required = 6
```

tetapi processing:

``` text
376
```

maka terjadi mismatch antara:

``` text
C1 demand
```

dan:

``` text
C2 / tile processing
```

Hal ini harus ditrace secara arsitektural.

------------------------------------------------------------------------

# 8. Historical 58 / 65 / 98

Historical results juga pernah berada pada:

``` text
58
65
98
```

Angka tersebut diperlakukan sebagai:

``` text
CALIBRATION EVIDENCE
```

bukan:

``` text
FIXED TARGET
```

Jangan membuat konfigurasi:

``` text
LOW       = 58
BALANCED  = 65
HIGH      = 98
```

hanya karena tiga angka tersebut pernah terlihat.

Yang harus dicari adalah:

``` text
mengapa workload tersebut muncul
```

dan:

``` text
apakah hasil tersebut stabil pada tier/perangkat tertentu
```

------------------------------------------------------------------------

# 9. Separation of Responsibilities

## STEP A --- Device Profiler

Tanggung jawab:

``` text
Measure device
Classify tier
Produce profile
```

Tidak bertanggung jawab menentukan tile demand.

------------------------------------------------------------------------

## STEP B --- Tile Engine Profile

Tanggung jawab:

``` text
tier
tileSize
maxFactor
batchSize
batchDelay
prefetch
cacheLimit
```

Parameter ini menjadi workload profile.

------------------------------------------------------------------------

## STEP C1 --- Viewport Planner

Tanggung jawab:

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
totalLevelTiles
```

C1 adalah **geometric planner**.

------------------------------------------------------------------------

## STEP C2 --- Adaptive Selection

Tanggung jawab:

``` text
mengubah demand C1 menjadi selection yang dapat diproses
```

C2 tidak boleh mengabaikan C1 lalu kembali ke full pyramid.

------------------------------------------------------------------------

## TILE BUDGET GATE

Tanggung jawab:

``` text
membatasi workload berdasarkan tier
```

Budget Gate bukan renderer.

Budget Gate bukan queue.

Budget Gate bukan geometry.

------------------------------------------------------------------------

## TILE QUEUE

Tanggung jawab:

``` text
enqueue
dequeue
pending
loading
loaded
failed
stored
```

Queue reconciliation tetap hanya menangani lifecycle queue.

Jangan mencampur budget contract ke queue state kecuali ada audit
khusus.

------------------------------------------------------------------------

# 10. Recommended Processing Flow

``` text
                 ┌──────────────────┐
                 │  Device Profiler │
                 └────────┬─────────┘
                          ↓
                  LOW / BAL / HIGH
                          ↓
                 ┌──────────────────┐
                 │ Tile Engine      │
                 │ Profile          │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ C1 Viewport      │
                 │ Planner          │
                 └────────┬─────────┘
                          ↓
                  required tile set
                          ↓
                 ┌──────────────────┐
                 │ C2 Adaptive      │
                 │ Selection        │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Budget Gate      │
                 └────────┬─────────┘
                          ↓
                    allowed work
                          ↓
                 ┌──────────────────┐
                 │ Tile Queue       │
                 └────────┬─────────┘
                          ↓
                    Tile Renderer
```

------------------------------------------------------------------------

# 11. Budget Decision Model

Secara konseptual:

``` text
Demand
  ↓
Is demand <= tier budget?
  ├── YES → allow
  └── NO
        ↓
   adaptive reduction
        ↓
   process within budget
```

Namun "adaptive reduction" tidak boleh berupa random crop atau geometry
distortion.

Reduction harus terjadi pada selection/resolution/window policy yang
memang menjadi tanggung jawab C2.

------------------------------------------------------------------------

# 12. Geometry Contract Must Stay Separate

Geometry Contract V1 sudah dikunci.

Prinsip:

``` text
Do not tune.
Trace the contract first.
```

Internal SVG geometry:

``` text
width  = 320
height = 320
aspect = 1:1
```

Tidak boleh membuat:

``` text
LOW-only Y multiplier
portrait compensation
percentage tuning
12% / 48% / 42% style tuning
```

Tile budget tidak boleh memperbaiki geometry.

Jika map kembali mengalami:

``` text
atas/bawah tidak stabil
kiri/kanan tidak stabil
circle berubah menjadi oval
```

trace:

``` text
GeoReference
 ↓
Geometry Contract
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
 ↓
Screen
```

Jangan langsung mengubah budget.

------------------------------------------------------------------------

# 13. Device Profile Is Performance-only

Device tier tidak boleh menjadi shortcut untuk mengubah geometry.

Contoh yang benar:

``` text
LOW
 → smaller workload
 → slower batch
 → conservative processing
```

Contoh yang salah:

``` text
LOW
 → ubah aspect ratio
 → ubah Y multiplier
 → ubah bounds
 → ubah viewport geometry
```

Device Profile adalah performance contract.

------------------------------------------------------------------------

# 14. Calibration Matrix

Sebelum angka LOW/BALANCED/HIGH dikunci, buat matrix berikut:

  ---------------------------------------------------------------------------
  Tier         Benchmark       Tile     Actual     Render       Fail Stable
                             Demand      Tiles       Time            
  ---------- ----------- ---------- ---------- ---------- ---------- --------
  LOW                TBD        TBD        TBD        TBD        TBD TBD

  BALANCED           TBD        TBD        TBD        TBD        TBD TBD

  HIGH               TBD        TBD        TBD        TBD        TBD TBD
  ---------------------------------------------------------------------------

Tambahkan field:

``` text
device model
GPU
RAM
DPR
screen resolution
profiler version
tileSize
factor
batchSize
prefetch
cacheLimit
C1 visible
C1 required
C2 selected
actual processed
processing time
failure count
```

------------------------------------------------------------------------

# 15. Minimum Evidence Required Before Numeric Lock

Untuk setiap tier, idealnya tersedia lebih dari satu observation.

Jangan mengunci budget hanya berdasarkan:

``` text
1 device
1 run
1 GeoPDF
1 benchmark
```

Minimal calibration harus membedakan:

``` text
device capability
+
viewport demand
+
tile processing workload
```

Jika data belum cukup:

``` text
budget = NOT CALIBRATED
```

lebih baik daripada:

``` text
budget = arbitrary number
```

------------------------------------------------------------------------

# 16. Final Tier Budget — 50/80

Baseline V24.5 Engine V2 Final Clean menggunakan:

``` text
LOW       maxTiles = 50    cacheLimit = 80
BALANCED  maxTiles = 100   cacheLimit = 150
HIGH      maxTiles = 200   cacheLimit = 300
```

`maxTiles` adalah processing/capability ceiling Raja. `cacheLimit` adalah kapasitas RAM/cache dan sengaja lebih besar dari `maxTiles` untuk mengurangi eviction thrashing.

``` text
LOW_MAX <= BALANCED_MAX <= HIGH_MAX
50      <= 100          <= 200
```

Quality policy tetap terpisah:

``` text
QUALITY_FLOOR = 50
MAX_EXPANSION_RADIUS = 20
```

------------------------------------------------------------------------

# 17. Why This Is Better Than One Global Max

Global-only:

``` text
all devices
    ↓
MAX 100
```

Masalah:

``` text
LOW
BALANCED
HIGH
```

mendapat ceiling sama walaupun kemampuan berbeda.

Tiered:

``` text
LOW
   ↓
conservative ceiling

BALANCED
   ↓
medium ceiling

HIGH
   ↓
larger ceiling

GLOBAL
   ↓
absolute safety ceiling
```

Ini lebih konsisten dengan arsitektur Device Profiler yang memang sudah
membedakan workload.

------------------------------------------------------------------------

# 18. Important Distinction: Tile Count vs Tile Size

Jangan menyimpulkan:

``` text
768px tile
=
lebih sedikit workload
```

secara otomatis.

Workload aktual bergantung pada:

``` text
tile count
×
tile pixel area
×
raster factor
×
number of levels
×
processing path
```

Karena itu:

``` text
tileSize
```

dan:

``` text
maxTiles
```

harus dipantau sebagai dua parameter berbeda.

LOW saat ini menggunakan tileSize 768 pada reference profile, sehingga
jumlah tile yang sama tidak berarti pixel workload yang sama dengan tile
256.

------------------------------------------------------------------------

# 19. Important Distinction: Budget vs Batch

Jangan mencampurkan:

``` text
maxTiles
```

dengan:

``` text
batchSize
```

Contoh:

``` text
maxTiles = 60
batchSize = 2
```

berarti:

``` text
total allowed workload = 60
concurrency/chunking = 2
```

Bukan:

``` text
2 × 60
```

Batch mengatur cara workload diproses.

Budget mengatur seberapa banyak workload yang boleh diproses.

------------------------------------------------------------------------

# 20. Important Distinction: Budget vs Prefetch

Prefetch juga tidak boleh diam-diam masuk ke core visible budget.

Existing architecture memisahkan:

``` text
VISIBLE
PREFETCH
REQUIRED
```

Passive prefetch planner hanya menghasilkan kandidat tambahan dan tidak
mengubah core visible viewport.

Karena itu future budget design harus menetapkan apakah:

``` text
budget applies to visible only
```

atau:

``` text
budget applies to visible + permitted prefetch
```

Hal ini harus ditetapkan secara eksplisit dalam calibration.

Jangan mengasumsikan.

------------------------------------------------------------------------

# 21. Queue Contract Reminder

Current queue reconciliation memiliki fungsi:

``` text
reconcile pending queue
with current visible keys
```

Tujuannya membuang pending work yang sudah tidak relevan.

Reconciliation:

``` text
touches:
  pending
  pendingSet

does NOT touch:
  loading
  loadedSet
  failedSet
  storedSet
```

Budget Contract tidak boleh merusak ownership tersebut.

Budget Gate dan Queue Lifecycle adalah dua concern berbeda.

------------------------------------------------------------------------

# 22. Anti-Regression Rules

## Rule 1

Jangan kembali ke:

``` text
full pyramid → crop → resize → all levels → all tiles
```

sebagai default runtime path.

------------------------------------------------------------------------

## Rule 2

Jika:

``` text
C1 required = 6
```

jangan sampai:

``` text
C2 actual = 376
```

tanpa alasan arsitektural yang eksplisit dan terukur.

------------------------------------------------------------------------

## Rule 3

Jangan menjadikan:

``` text
58 / 65 / 98
```

sebagai hardcoded target.

------------------------------------------------------------------------

## Rule 4

Jangan menggunakan:

``` text
100
```

sebagai target minimum.

100 hanya:

``` text
absolute maximum
```

jika/ketika global ceiling tersebut dikunci.

------------------------------------------------------------------------

## Rule 5

Jangan mengubah Geometry Contract untuk menyelesaikan masalah
performance.

------------------------------------------------------------------------

## Rule 6

Jangan mengubah IndexedDB V2 untuk masalah tile budget.

------------------------------------------------------------------------

## Rule 7

Jangan mengubah gesture/compositor untuk masalah tile budget.

------------------------------------------------------------------------

## Rule 8

Jangan mengubah Tile Queue hanya untuk memperkenalkan budget jika
boundary dapat dibuat di C2/selection layer.

------------------------------------------------------------------------

## Rule 9

Jangan mengubah Device Profiler hanya karena budget belum terkalibrasi.

------------------------------------------------------------------------

# 23. V24.5 / V25 Boundary

## V24.5

Tetap:

``` text
IndexedDB V2
```

Current V24.5 map architecture harus tetap terpisah dari V25.

------------------------------------------------------------------------

## V25

V25 memiliki:

``` text
IndexedDB V4
Layer store
Feature store
Map layer state
Feature management
```

Jangan membawa perubahan V25 ke V24.5 hanya karena perubahan tile
budget.

------------------------------------------------------------------------

# 24. Protected Architecture

Perubahan Tile Budget tidak boleh secara otomatis menyentuh:

``` text
Geometry Contract
Map Gesture
IndexedDB schema
Map Lifecycle architecture
Modal Point Detail
Layer/Feature architecture V25
```

Jika perubahan membutuhkan file-file tersebut, lakukan:

``` text
cross-file dependency audit
```

terlebih dahulu.

------------------------------------------------------------------------

# 25. Audit Procedure Before Any Patch

Sebelum membuat patch baru:

### Step 1 --- Confirm current baseline

Pastikan:

``` text
V24.5
IndexedDB V2
Geometry Contract V1
Point Detail Modal V2
```

------------------------------------------------------------------------

### Step 2 --- Confirm profiler output

Log:

``` text
tier
benchMs
memory
cores
DPR
GPU
profilerVersion
```

------------------------------------------------------------------------

### Step 3 --- Confirm STEP B

Log:

``` text
tileSize
maxFactor
batchSize
batchDelay
prefetch
cacheLimit
```

------------------------------------------------------------------------

### Step 4 --- Confirm C1

Log:

``` text
zoom
factor
tileSize
visible.count
required.count
totalLevelTiles
```

------------------------------------------------------------------------

### Step 5 --- Confirm C2

Log:

``` text
adaptiveC2
selected tile count
level selection
window
fallback
```

------------------------------------------------------------------------

### Step 6 --- Confirm budget

Log:

``` text
tierMax
globalMax
demand
selected
allowed
```

------------------------------------------------------------------------

### Step 7 --- Confirm actual processing

Log:

``` text
actual processed
success
failed
elapsed
```

------------------------------------------------------------------------

# 26. Recommended Diagnostic Log

Future diagnostic should ideally produce one compact record:

``` text
[ADAPTIVE TILE]

Device
  Tier       : LOW
  Bench      : 20.4 ms
  RAM        : 4 GB
  DPR        : 3.15
  GPU        : Mali-T880

Profile
  Tile       : 768
  Factor     : 1
  Batch      : 2
  Prefetch   : 0

C1
  Visible    : 6
  Required   : 6
  Total      : 376

C2
  Enabled    : true
  Selected   : TBD
  Fallback   : false

Budget
  Tier Max   : TBD
  Global Max : 100
  Demand     : 6
  Allowed    : TBD

Process
  Actual     : TBD
  Failed     : TBD
  Time       : TBD
```

Tujuannya agar ketika regresi muncul, kita dapat langsung mengetahui:

``` text
problem di profiler?
problem di C1?
problem di C2?
problem di budget?
problem di queue?
problem di renderer?
```

------------------------------------------------------------------------

# 27. Definition of Done --- Tile Budget Contract V1

Kontrak dianggap siap implementasi setelah:

-   [ ] Device Profiler tier verified
-   [ ] STEP B profile verified
-   [ ] C1 demand verified
-   [ ] C2 adaptive selection verified
-   [ ] Historical 58/65/98 classified as evidence
-   [ ] Historical 230+/280/376 classified as regression evidence
-   [ ] LOW calibration data available
-   [ ] BALANCED calibration data available
-   [ ] HIGH calibration data available
-   [ ] LOW_MAX derived from evidence
-   [ ] BALANCED_MAX derived from evidence
-   [ ] HIGH_MAX derived from evidence
-   [ ] Global ceiling defined
-   [ ] NO MINIMUM invariant verified
-   [ ] Budget does not alter geometry
-   [ ] Budget does not alter IndexedDB
-   [ ] Budget does not alter gesture
-   [ ] Budget does not break queue ownership
-   [ ] Browser console clean
-   [ ] Regression test against 376 completed
-   [ ] Field test completed on LOW reference device
-   [ ] Release note added

------------------------------------------------------------------------

# 28. Current Status

``` text
TILE BUDGET CONTRACT V1

Architecture
  PASS / DEFINED

Device Tier
  PASS / EXISTING

STEP B workload profile
  PASS / EXISTING

C1 viewport demand
  PASS / EXISTING

C2 adaptive concept
  ACTIVE / UNDER VALIDATION

Global maximum concept
  200 (HIGH tier ceiling)

Quality floor
  50 (adaptive selection floor; not a fixed processing target)

LOW_MAX
  50

BALANCED_MAX
  100

HIGH_MAX
  200

Cache limits
  80 / 150 / 300

Numeric status
  FINAL LOCKED — 50/80 BASELINE
```

------------------------------------------------------------------------

# 29. Permanent Reminder

## DO NOT

``` text
DO NOT guess tile budgets.

DO NOT target 58.

DO NOT target 65.

DO NOT target 98.

DO NOT accept 376 as normal.

DO NOT use one identical budget for every device tier.

DO NOT convert QUALITY_FLOOR 50 into a fixed processing target.

DO NOT modify Geometry to fix tile performance.

DO NOT mix V24.5 IndexedDB V2 with V25 IndexedDB V4.

DO NOT patch renderer before tracing the contract.

DO NOT solve a C1/C2 problem in Queue.

DO NOT solve a performance problem with arbitrary percentage tuning.
```

## DO

``` text
DO use Device Profiler.

DO distinguish LOW / BALANCED / HIGH.

DO preserve C1 geometric demand.

DO let C2 perform adaptive selection.

DO use tier-specific ceilings.

DO keep one global absolute ceiling.

DO keep QUALITY_FLOOR separate from capability ceiling and visible demand.

DO derive numbers from calibration evidence.

DO log demand → selection → budget → actual processing.

DO test against 376 as an anti-regression case.

DO validate on real devices.

DO keep Geometry Contract V1 locked.

DO keep V24.5 and V25 architecture separated.
```

------------------------------------------------------------------------

# 30. Core Principle

The fundamental Lithosite principle is:

``` text
DEVICE CAPABILITY
       +
VIEWPORT DEMAND
       +
ADAPTIVE SELECTION
       +
TIER BUDGET
       =
CONTROLLED TILE WORKLOAD
```

Bukan:

``` text
ALL PDF
   ↓
ALL LEVEL
   ↓
ALL TILE
```

Dan bukan pula:

``` text
ALL DEVICES
   ↓
ONE HARD-CODED TILE COUNT
```

Target arsitektur adalah:

``` text
LOW device
   → conservative workload

BALANCED device
   → moderate workload

HIGH device
   → larger workload

GLOBAL
   → absolute safety ceiling
```

dengan:

``` text
NO MINIMUM
```

dan:

``` text
LOW_MAX <= BALANCED_MAX <= HIGH_MAX <= GLOBAL_MAX
```

------------------------------------------------------------------------

# 31. Final Engineering Statement

**Tile Budget Contract V1 adalah kontrak performance, bukan kontrak
geometry.**

Device Profiler menentukan kemampuan perangkat.

C1 menentukan kebutuhan viewport.

C2 menentukan adaptive selection.

Budget menentukan batas workload.

Queue mengelola lifecycle tile.

Renderer melakukan rendering.

Setiap layer harus tetap memiliki ownership yang jelas.

**Jangan menambal gejala. Trace contract → measure → calibrate →
implement → validate.**

------------------------------------------------------------------------

## Historical Evidence Reference

### Samsung S7 Edge

``` text
Cold       224.9 ms
Warm       44 ms
           38.2 ms
           20.4 ms
DPR        3.15
RAM        4 GB
Profile    LOW
```

### Historical tile results

``` text
58
65
98
230+
280
376
```

Interpretation:

``` text
58 / 65 / 98
    = adaptive/calibration evidence

230+ / 280 / 376
    = high-workload / regression evidence
```

Tidak ada angka di atas yang otomatis menjadi
LOW_MAX/BALANCED_MAX/HIGH_MAX.

------------------------------------------------------------------------

# 32. Next Engineering Stage

Tahap berikutnya:

``` text
CALIBRATION MATRIX
        ↓
COLLECT DEVICE/TIER DATA
        ↓
CORRELATE BENCHMARK ↔ TILE WORKLOAD
        ↓
MEASURE STABILITY
        ↓
DERIVE LOW_MAX
        ↓
DERIVE BALANCED_MAX
        ↓
DERIVE HIGH_MAX
        ↓
LOCK GLOBAL_MAX
        ↓
IMPLEMENT BUDGET GATE
        ↓
REGRESSION TEST
        ↓
FIELD TEST
```

**Do not implement arbitrary numeric ceilings before this stage is
complete.**

------------------------------------------------------------------------

**Document status:** FINAL LOCKED — ENGINE V2 / 50/80\
**Scope:** V24.5 Adaptive Tile Engine\
**IndexedDB:** V2\
**Geometry:** Contract V1 LOCKED\
**Point Detail Modal:** V2 LOCKED\
**Numeric Tile Budgets:** TBD by calibration evidence
