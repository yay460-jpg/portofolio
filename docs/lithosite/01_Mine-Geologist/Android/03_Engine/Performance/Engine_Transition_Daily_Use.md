# MG1 / LITHOSITE --- ENGINE V1 → V2

## Daily-Use Engineering Architecture, Runtime Flow, Tile Lifecycle & Diagnostic Reference

**Project:** MG1 / Mine Geologist / Lithosite Member App\
**Runtime baseline:** V24.5\
**IndexedDB:** V2\
**Document status:** Engineering Reference / Architecture Lock / Daily
Use\
**Primary scope:** GeoPDF → Device Profiler → Tile Engine → C1 → C2 →
Tile Runtime → Persistence → Map Surface\
**Important:** Dokumen ini mendokumentasikan evolusi Engine V1 menuju
Engine V2 dan cara membaca sistem saat dipakai sehari-hari. Dokumen ini
bukan proposal patch baru.

------------------------------------------------------------------------

# 1. TUJUAN DOKUMEN

Dokumen ini dibuat supaya ketika kita membuka kembali project
MG1/Lithosite setelah beberapa hari atau beberapa minggu, kita tidak
perlu menebak:

-   apa yang dimaksud Engine V1;
-   apa yang berubah ketika masuk Engine V2;
-   siapa pemilik setiap proses;
-   apa fungsi Device Profiler;
-   apa fungsi Tile Engine Profile;
-   apa yang dihitung C1;
-   apa yang dipilih C2;
-   bagaimana tile masuk Queue;
-   bagaimana tile yang sudah ada di IndexedDB dipakai kembali;
-   kapan PDF.js benar-benar melakukan rendering;
-   apa arti `Planned`, `Actual rendered`, `Skipped`, `Failed`, dan
    `Elapsed`;
-   mengapa angka `376`, `98`, dan `52` tidak boleh langsung diberi arti
    yang sama;
-   bagian mana yang sudah locked;
-   dan bagian mana yang masih harus dibuktikan dengan telemetry.

Dokumen ini mempertahankan prinsip utama:

> **Trace contract → measure → calibrate → implement → validate.**

Bukan:

> **Lihat angka → tebak penyebab → patch.**

------------------------------------------------------------------------

# 2. RINGKASAN EKSEKUTIF

Lithosite mengalami perubahan arsitektur dari **V1 Functional Mining
Member App** menjadi **V2 Offline Geospatial Runtime**.

Pada V1, map pada dasarnya masih merupakan salah satu feature di dalam
Member App.

Alur sederhananya:

``` text
Member App
   ↓
Background Map
   ↓
GeoPDF / GeoReference
   ↓
Image / Tile Rendering
   ↓
Map
```

Masalah utama pendekatan ini:

``` text
GeoPDF
   ↓
Render besar
   ↓
Crop / Resize
   ↓
Buat banyak tile
   ↓
Tampilkan map
```

Akibatnya workload dapat mengikuti ukuran penuh raster/pyramid, bukan
kebutuhan viewport aktif.

Historical test pernah menghasilkan:

``` text
230+
280
376
```

dan salah satu skenario 376 tile pernah membutuhkan sekitar 159 detik.

V2 mengubah map menjadi subsystem/runtime geospatial yang memiliki
boundary sendiri:

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
Persistence
   ↓
Atomic Surface
   ↓
Map Runtime
```

Tujuan V2 bukan sekadar:

> "render lebih cepat."

Tujuan V2 adalah:

> **workload rendering harus sesuai dengan kemampuan device dan
> kebutuhan viewport.**

------------------------------------------------------------------------

# 3. EVOLUSI ENGINE V1 → V2

## 3.1 Engine V1 --- Functional Mining Map

V1 berisi:

``` text
Dashboard
Ringkasan
Digging
Validasi
KPI
Chat / Issue
Settings
Background Map
GeoPDF
GeoReference
GPS
Map Tap
Tile Rendering
```

Map masih bercampur secara arsitektural dengan application flow.

Model mental V1:

``` text
Application
    │
    ├── Dashboard
    ├── Digging
    ├── Validasi
    ├── KPI
    ├── Chat
    ├── Settings
    │
    └── Map
         ├── GeoPDF
         ├── GeoReference
         ├── GPS
         ├── Map Tap
         └── Tile Rendering
```

### Konsekuensi

Optimasi tile berisiko menyentuh:

-   map rendering;
-   UI;
-   save flow;
-   modal;
-   persistence;
-   gesture;
-   lifecycle.

Ownership belum cukup terpisah.

------------------------------------------------------------------------

# 4. MASALAH UTAMA ENGINE V1

## 4.1 Full-pyramid tendency

Pola lama dapat diringkas:

``` text
GeoPDF
   ↓
Full render / large raster
   ↓
Crop
   ↓
Resize
   ↓
Generate levels
   ↓
Generate tiles
   ↓
Display
```

Jika pyramid memiliki banyak tile, renderer dapat menghabiskan waktu
untuk tile yang sebenarnya tidak dibutuhkan viewport saat itu.

Contoh historical evidence:

``` text
230+
280
376
```

Angka tersebut merupakan evidence workload, bukan target.

------------------------------------------------------------------------

# 5. KELAHIRAN ENGINE V2

V2 memisahkan map menjadi runtime geospatial berlapis.

Arsitektur:

``` text
                  ┌──────────────────┐
                  │ Device Profiler  │
                  └────────┬─────────┘
                           ↓
                  LOW / BALANCED / HIGH
                           ↓
                  ┌──────────────────┐
                  │ Tile Engine      │
                  │ Profile          │
                  └────────┬─────────┘
                           ↓
                  ┌──────────────────┐
                  │ C1 Viewport      │
                  │ Planner           │
                  └────────┬─────────┘
                           ↓
                  ┌──────────────────┐
                  │ C2 Adaptive      │
                  │ Selection        │
                  └────────┬─────────┘
                           ↓
                  ┌──────────────────┐
                  │ Tile Identity    │
                  └────────┬─────────┘
                           ↓
                  ┌──────────────────┐
                  │ Persistent Tile │
                  │ Store            │
                  └────────┬─────────┘
                           ↓
                  ┌──────────────────┐
                  │ Runtime Loader   │
                  └────────┬─────────┘
                           ↓
                  ┌──────────────────┐
                  │ Missing Resolver │
                  └────────┬─────────┘
                           ↓
                  ┌──────────────────┐
                  │ Runtime Creation │
                  └────────┬─────────┘
                           ↓
                  ┌──────────────────┐
                  │ Persistence      │
                  └────────┬─────────┘
                           ↓
                  ┌──────────────────┐
                  │ Atomic Surface   │
                  └──────────────────┘
```

V2 bukan satu fungsi baru.

V2 adalah **rantai contract**.

------------------------------------------------------------------------

# 6. VERSION HISTORY ENGINE V2

## V14.22 --- Device Profiler V1

Masalah:

> satu konfigurasi tidak cukup untuk semua device.

Profiler mulai mengukur:

``` text
RAM
CPU
DPR
Screen resolution
WebGL
Canvas benchmark
```

Output:

``` text
LOW
BALANCED
HIGH
```

Pada tahap ini profiler belum menjadi renderer.

------------------------------------------------------------------------

## V14.23 --- Diagnostic Overlay

Profiler dibuat observable.

Prinsip:

``` text
Measure
   ↓
Display
   ↓
Observe
   ↓
Do not alter renderer
```

Diagnostic overlay harus dianggap sebagai jendela observasi terhadap
engine, bukan engine baru.

------------------------------------------------------------------------

## V14.24 --- Device Profiler V2

Benchmark dibuat lebih representative:

``` text
Warm-up
   ↓
Multiple samples
   ↓
Median
```

Benchmark menggunakan raster/compositing 512×512.

Tujuannya mengurangi pengaruh:

-   cold start;
-   initialization spike;
-   JIT;
-   sample tunggal yang tidak representatif.

------------------------------------------------------------------------

## V14.25 --- Tile Engine Profile

Mulai ada parameter per tier:

``` text
Tile Size
Max Factor
Batch
Delay
Prefetch
Cache
```

Penting:

> parameter ini awalnya merupakan **parameter layer**, bukan otomatis
> berarti tile budget.

------------------------------------------------------------------------

## V14.26 --- C1 Viewport Planner

C1 mulai menjawab:

> "Tile mana yang secara geometris dibutuhkan viewport?"

Input utama:

``` text
GeoReference
Map zoom
Map rotation
Viewport geometry
Tile size
Render factor
```

Output:

``` text
Visible
Required
Total level tiles
```

------------------------------------------------------------------------

## V14.28 --- C2 Adaptive Rendering

Konsep adaptive mulai dipakai:

``` text
BASE / fallback
       ↓
Full preview

DETAIL
       ↓
Viewport
   +
Prefetch / edge coverage
```

Tujuannya:

``` text
Jangan render seluruh high-resolution map
jika viewport hanya membutuhkan sebagian.
```

------------------------------------------------------------------------

## V14.30 --- C2 Metrics

C2 mulai memiliki telemetry:

``` text
Planned
Rendered
Failed
Skipped
Elapsed
```

Ini sangat penting karena mulai memungkinkan kita membedakan:

``` text
demand
vs
selection
vs
actual processing
```

------------------------------------------------------------------------

## V14.31 --- Controlled Field Test

C2 diaktifkan untuk field testing sehingga:

``` text
C1 Visible
      ↕
C2 Planned
      ↕
Actual Rendered
```

dapat dibandingkan.

------------------------------------------------------------------------

## V14.32 / V14.36 --- GeoReference Handoff

Flow GeoPDF baru diperbaiki menjadi:

``` text
New GeoPDF
   ↓
Incoming GeoReference
   ↓
C1
   ↓
C2
   ↓
Persistence
```

Bukan:

``` text
New GeoPDF
   ↓
Persist dulu
   ↓
Planner baru membaca state lama
```

Ini penting karena C1/C2 harus bekerja terhadap GeoReference yang
benar-benar berasal dari GeoPDF yang sedang diproses.

------------------------------------------------------------------------

# 7. LOW TUNING SEBELUM V2 RUNTIME MATANG

Evolution historical:

``` text
V14.33
factor ~0.25 → 0.5

V14.34
0.5 → 1.0

V14.37
tile 256 → 512

V14.38
tile 512 → 768

V14.39
native 1x + 768

V14.40
1.0x → 1.50x

V14.41
coverage sampai sekitar 25 tile
```

Kemudian:

``` text
V14.47
1.50x → 1.55x
```

Catatan:

Tuning ini adalah bagian dari historical evolution. Angka tersebut tidak
otomatis menjadi budget final.

------------------------------------------------------------------------

# 8. TRANSISI BESAR V15.1 → V15.14

Ini adalah bagian penting dari perubahan Engine V1 menuju runtime V2.

## V15.1 --- BASE / DETAIL

Konsep:

``` text
BASE
0.25x
full-map persistent layer

DETAIL
1.55x
viewport-cropped visual layer
```

Model:

``` text
              MAP SURFACE
                  │
        ┌─────────┴─────────┐
        │                   │
      BASE                DETAIL
    full map              viewport
    low-res               high-res
```

BASE menyediakan coverage.

DETAIL menyediakan visual authority.

------------------------------------------------------------------------

## V15.2 --- Tile Identity

Tile tidak lagi diperlakukan sebagai image anonim.

Identity:

``` text
factor / x / y
```

Contoh:

``` text
1/0/0
1/1/0
1/0/1
1/1/1
```

Identity menjadi fondasi:

``` text
Store
Queue
Loader
Resolver
Persistence
```

------------------------------------------------------------------------

## V15.3 --- Persistent BASE Tile Layer

BASE menjadi:

``` text
persistent
full coverage
factor/x/y identity
```

tetap kompatibel dengan legacy pyramid.

------------------------------------------------------------------------

## V15.4 --- Persistent Map Surface

Visual pan dipindahkan ke SVG `viewBox`.

Prinsip:

``` text
Native map center
      ↓
Source of truth

SVG viewBox
      ↓
Visual viewport
```

Ini memisahkan:

``` text
persistent geometry
```

dari:

``` text
visual movement
```

------------------------------------------------------------------------

## V15.5 --- DETAIL Tile Lifecycle

DETAIL hanya dipasang jika tile beririsan dengan:

``` text
viewport
+
edge margin
```

Penting:

> lifecycle ini tidak membuat PDF tile baru.

------------------------------------------------------------------------

## V15.6 --- DETAIL-first Compositor

DETAIL 1.55x menjadi visual authority.

Tujuannya mencegah:

``` text
DETAIL
  ↓
transparan / bleed
  ↓
BASE terlihat melalui celah
```

Compositor menggunakan layer yang sesuai agar BASE tidak mengganggu
detail.

------------------------------------------------------------------------

## V15.7 --- Persistent Tile Store Index

`tileStore` menjadi index.

Kontrak:

``` text
tileStore
   =
INDEX
```

sedangkan:

``` text
levels[].tiles
   =
RASTER DATA
```

Jangan menyimpan `dataUrl` kedua kali di `tileStore`.

Model:

``` text
tileStore
   ↓
factor/x/y
   ↓
levelIndex + tileIndex
   ↓
levels[].tiles[]
   ↓
dataUrl
```

------------------------------------------------------------------------

## V15.8 --- Persistent Tile Queue Registry

Queue diperkenalkan sebagai lifecycle registry.

State:

``` text
pending
loaded
failed
stored
```

Queue belum melakukan PDF rendering runtime pada tahap ini.

------------------------------------------------------------------------

## V15.9 --- Queue Consumer

Consumer mengerjakan:

``` text
pending
   ↓
execute
   ↓
loaded
```

atau:

``` text
pending
   ↓
execute
   ↓
failed
```

------------------------------------------------------------------------

## V15.10 --- Runtime Detail Tile Loader

Loader membaca tile yang sudah tersedia:

``` text
tileStore
   ↓
runtime loader
   ↓
Image
   ↓
RAM / browser runtime
```

Loader tidak membuat tile PDF baru.

------------------------------------------------------------------------

## V15.11 --- Missing Detail Resolver

Expected tile diperiksa:

``` text
expected key
     ↓
tileStore lookup
   ┌─┴─┐
 FOUND ABSENT
   ↓     ↓
STORED MISSING
         ↓
      resolver
```

Resolver menjawab:

> tile tersedia atau tile perlu dibuat?

Resolver bukan renderer.

------------------------------------------------------------------------

## V15.12 --- Runtime Tile Creation

Jika tile benar-benar missing:

``` text
MISSING
   ↓
Resolver
   ↓
PDF source tersedia
   ↓
PDF.js
   ↓
Canvas
   ↓
dataUrl
   ↓
Runtime-created tile
```

Ini adalah titik penting:

> **PDF.js runtime rendering terjadi di sini ketika tile missing dan
> source tersedia.**

------------------------------------------------------------------------

## V15.13 --- Runtime Tile Persistence

Tile hasil creation:

``` text
runtime tile
   ↓
levels[].tiles
   ↓
tileStore rebuild
   ↓
IndexedDB persistence
```

Tujuannya agar tile yang sudah dibuat tidak perlu dibuat ulang pada
penggunaan berikutnya.

------------------------------------------------------------------------

## V15.14 --- Stable Save Surface

Save UI tidak lagi bergantung pada repeated global `render()`.

Status update dilakukan langsung di DOM.

Persistence juga dipisahkan dari kegagalan registrasi PDF source.

------------------------------------------------------------------------

# 9. V17.1 → V24.5: RUNTIME MATURATION

## V17.1 --- GeoPDF no flicker

GeoPDF import flow distabilkan untuk mengurangi flicker selama
processing/save.

------------------------------------------------------------------------

## V19 --- Isolated Map Modal

Modal management dipisahkan dari global render.

Sebelumnya:

``` text
Open Modal
   ↓
render()
   ↓
DOM rebuild
   ↓
flicker
```

Setelah isolasi:

``` text
Map Management
      ↓
Isolated Modal
      ↓
No global render dependency
```

------------------------------------------------------------------------

## V22 --- Atomic Map Surface Swap

Map surface menggunakan atomic swap.

Konsep:

``` text
Old Surface
     ↓
prepare new surface
     ↓
decode resources
     ↓
ready
     ↓
atomic swap
```

Tujuan:

``` text
jangan memperlihatkan surface setengah jadi.
```

------------------------------------------------------------------------

## V23 --- Management Isolation

Map management dan New Map modal tetap dipisahkan dari global render
lifecycle.

------------------------------------------------------------------------

## V24.1 --- RAM-first / Instant Save

Save map:

``` text
new map
   ↓
activate in memory
   ↓
persist asynchronously
```

Persistence tidak boleh menghalangi immediate map activation.

------------------------------------------------------------------------

## V24.2 --- Protected Map Runtime Baseline

Area berikut menjadi protected:

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

## V24.3 / V24.4 / V24.5

Management dan lifecycle berkembang di boundary sendiri:

``` text
Map Library
Search
Sort
Filter
Label
Collection
Rename
Info
Delete
Active / Inactive
Duplicate
Update / Replace
Failure / Recovery
Package
Storage
```

Runtime map tetap dipertahankan sebagai subsystem terpisah.

------------------------------------------------------------------------

# 10. DAILY RUNTIME FLOW --- SAAT USER MEMAKAI MAP

Ini adalah flow yang perlu dipahami setiap hari.

## 10.1 Saat aplikasi dibuka

``` text
Boot
  ↓
Application ready
  ↓
Map runtime initialization
  ↓
Active map
  ↓
Existing persistent data
  ↓
Surface ready
```

Tidak setiap membuka aplikasi berarti PDF harus dirender ulang.

Jika tile sudah tersedia:

``` text
IndexedDB
   ↓
tileStore
   ↓
runtime loader
   ↓
Image
   ↓
Map
```

------------------------------------------------------------------------

# 11. DAILY FLOW --- SAAT MEMBUKA MAP YANG SUDAH ADA

``` text
Active Map
    ↓
Map Runtime
    ↓
Current viewport
    ↓
Expected tile keys
    ↓
Tile Store lookup
```

Untuk setiap key:

``` text
FOUND
  ↓
STORED
  ↓
LOAD
  ↓
RUNTIME READY
```

atau:

``` text
ABSENT
  ↓
MISSING
  ↓
Resolver
```

Jika source PDF tersedia:

``` text
MISSING
  ↓
PDF.js individual tile render
  ↓
Persistence
  ↓
Runtime
```

------------------------------------------------------------------------

# 12. DAILY FLOW --- SAAT PAN / ZOOM

Pan/zoom mengubah demand.

``` text
User gesture
    ↓
viewport changes
    ↓
C1
    ↓
visible
required
prefetch
    ↓
expected keys
    ↓
Store lookup
    ↓
Queue
    ↓
Loader / Resolver
    ↓
Runtime surface
```

Penting:

> pan tidak seharusnya otomatis berarti "render seluruh GeoPDF lagi".

------------------------------------------------------------------------

# 13. DEVICE PROFILER --- STEP A

## 13.1 Tanggung jawab

Device Profiler:

``` text
Measure device
Classify tier
Produce profile
```

Bukan:

``` text
Measure device
↓
choose exact tile demand
```

Demand tetap menjadi tanggung jawab C1.

------------------------------------------------------------------------

## 13.2 Data yang tersedia

Profiler menggunakan kombinasi:

``` text
navigator.deviceMemory
navigator.hardwareConcurrency
devicePixelRatio
screen width
screen height
screen pixel count
WebGL renderer
Canvas raster micro-benchmark
```

Hardware hints bukan satu-satunya dasar.

Micro-benchmark dipakai untuk mendapatkan measurement yang lebih nyata.

------------------------------------------------------------------------

## 13.3 Median

Model:

``` text
Warm-up
   ↓
Samples
   ↓
Sort
   ↓
Median
```

Contoh field data S7 Edge yang pernah tercatat:

``` text
Samples:
16.8
20.7
21.7
23.7
26.3
26.7

Median:
23.7 ms
```

Dengan hardware:

``` text
RAM   : 4 GB
CPU   : 8 cores
DPR   : 3.15
Screen: 458 × 813
GPU   : ANGLE / ARM / Mali-T880
```

Tier yang terlihat pada field test tersebut:

``` text
LOW
```

------------------------------------------------------------------------

# 14. HIGH DEVICE FIELD EXAMPLE

Field run lain menunjukkan:

``` text
Tier         : HIGH
Bench median : 4.3 ms
Samples      : 3.9, 4, 4.1, 4.3, 4.7, 5
RAM          : 16 GB
CPU          : 8 cores
DPR          : 1.25
Screen       : 1536 × 864
GPU          : ANGLE / Intel UHD Graphics 620
```

Current/reference Tile Engine Profile yang terlihat:

``` text
Tile       : 512 px
Max factor : 2x
Batch      : 16
Delay      : 0 ms
Prefetch   : 3
Cache      : 300
```

Ini menunjukkan bahwa device tier dapat menghasilkan workload profile
yang berbeda.

------------------------------------------------------------------------

# 15. STEP B --- TILE ENGINE PROFILE

Current/reference architecture:

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

### Jangan salah membaca

Parameter:

``` text
tileSize
maxFactor
batchSize
prefetch
cacheLimit
```

BUKAN:

``` text
maxTiles / processing budget
```

Batch mengatur cara workload diproses.

Budget, jika nanti dikalibrasi, mengatur batas jumlah workload.

------------------------------------------------------------------------

# 16. STEP C1 --- VIEWPORT TILE PLANNER

C1 adalah geometric planner.

Input:

``` text
GeoReference
mapZoom
mapRotation
viewport
tileSize
factor
```

C1 menghitung:

``` text
visible
required
prefetch
totalLevelTiles
```

Contoh historical:

``` text
Zoom       : 1.25x
Factor     : 0.25x
Tile       : 256 px
Visible    : 6
Prefetch   : 1
Required   : 6
```

Interpretasinya:

``` text
viewport demand
=
6 tiles
```

Bukan berarti:

``` text
renderer actual
=
6
```

C1 hanya menjawab kebutuhan geometris.

------------------------------------------------------------------------

# 17. C1 VS FULL LEVEL

C1 dapat memiliki dua informasi yang berbeda:

``` text
Visible / Required
```

dan:

``` text
Total tiles pada level tersebut
```

Contoh:

``` text
Visible  : 6
Required : 6
FullLevel: 376
```

Ketiganya tidak sama.

Model:

``` text
Full level
┌──────────────────────────────────────┐
│                                      │
│       ┌───────────────┐              │
│       │   VIEWPORT    │              │
│       │               │              │
│       │  6 required   │              │
│       └───────────────┘              │
│                                      │
└──────────────────────────────────────┘

FullLevel = seluruh ruang tile
Required  = demand viewport
```

------------------------------------------------------------------------

# 18. STEP C2 --- ADAPTIVE SELECTION

C2 menerima hasil C1 dan menentukan selection yang dapat diproses.

Secara konseptual:

``` text
C1 demand
   ↓
C2 selection
   ↓
renderer
```

C2 tidak boleh diam-diam kembali ke:

``` text
full pyramid
```

kecuali ada fallback yang memang terjadi dan dapat dibuktikan.

------------------------------------------------------------------------

# 19. BASE / DETAIL PADA C2

Arsitektur fixed-window yang menjadi reference:

``` text
BASE
   ↓
full coverage

DETAIL
   ↓
C2 viewport-selected window
```

Model:

``` text
                GeoPDF Pyramid
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
        BASE                  DETAIL
      full level           selected window
          │                     │
          └──────────┬──────────┘
                     ↓
                 compositor
                     ↓
                 map surface
```

Ini penting untuk membaca angka tile.

Jika BASE full dan DETAIL selected, maka:

``` text
Planned
=
BASE full
+
DETAIL selected
```

Jika C2 fallback/full terjadi:

``` text
Planned
=
BASE full
+
DETAIL full
```

Karena itu angka `Planned` tidak boleh langsung disamakan dengan
`C1 Required`.

------------------------------------------------------------------------

# 20. TILE IDENTITY

Semua runtime tile memakai identity:

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

Identity ini dipakai oleh:

``` text
C2
Tile Store
Queue
Loader
Resolver
Persistence
```

Identity adalah contract lintas subsystem.

------------------------------------------------------------------------

# 21. PERSISTENT TILE STORE

Kontrak:

``` text
tileStore = INDEX
levels[].tiles = RASTER DATA
```

Model:

``` text
tileStore
   │
   ├── version
   ├── identity
   ├── count
   └── index
        │
        ├── factor/x/y
        └── levelIndex/tileIndex
                  ↓
            levels[].tiles[]
                  ↓
                dataUrl
```

Tujuannya:

``` text
index cepat
+
satu payload raster
```

bukan:

``` text
duplicate raster payload
```

------------------------------------------------------------------------

# 22. TILE QUEUE

Current queue concept:

``` text
tileQueue
   ├── version
   ├── identity
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

Artinya:

``` text
STORED
=
tile ada di persistence

RUNTIME_READY
=
tile sudah berhasil dimuat ke runtime/browser
```

------------------------------------------------------------------------

# 23. TILE LIFECYCLE

Lifecycle:

``` text
EXPECTED
   ↓
STORE LOOKUP
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
LOADING      CREATE
│               │
↓               ↓
RUNTIME_READY ←┘
```

Failure:

``` text
LOADING
   ↓
FAILED
```

------------------------------------------------------------------------

# 24. QUEUE RECONCILIATION

Queue reconciliation bertugas menjaga pending work agar tidak stale.

Konsep:

``` text
current viewport
      ↓
current visible keys
      ↓
reconcile pending
      ↓
buang pending yang tidak lagi relevan
```

Reconciliation hanya menyentuh:

``` text
pending
pendingSet
```

Tidak menyentuh:

``` text
loading
loadedSet
failedSet
storedSet
```

Alasan:

> lifecycle state tidak boleh rusak hanya karena viewport berubah.

------------------------------------------------------------------------

# 25. RUNTIME TILE LOADER

Loader bertugas:

``` text
stored tile
   ↓
load Image
   ↓
decode
   ↓
runtime ready
```

Data runtime berada di:

``` text
RAM / browser
```

bukan sebagai duplicate persistence payload.

------------------------------------------------------------------------

# 26. MISSING DETAIL RESOLVER

Resolver menjawab:

``` text
Apakah expected tile tersedia?
```

Bukan:

``` text
Bagaimana merender seluruh pyramid?
```

Model:

``` text
Expected key
     ↓
Tile Store
   ┌─┴─┐
 FOUND ABSENT
   ↓     ↓
 STORED MISSING
           ↓
        Resolver
```

------------------------------------------------------------------------

# 27. RUNTIME TILE CREATION

Hanya ketika tile benar-benar missing dan PDF source tersedia:

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
runtime tile
   ↓
tileStore
   ↓
IndexedDB
```

Ini berbeda dengan full-pyramid generation.

Target arsitektur runtime:

``` text
buat tile yang diperlukan
```

bukan:

``` text
buat semua tile setiap saat
```

------------------------------------------------------------------------

# 28. PERSISTENCE

Runtime-created tile yang berhasil:

``` text
levels[].tiles
      ↓
tileStore index
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

sehingga tidak perlu selalu membuka kembali PDF source untuk tile yang
sudah tersedia.

------------------------------------------------------------------------

# 29. ATOMIC SURFACE

Map surface tidak boleh diganti setengah jadi.

Konsep:

``` text
Prepare
   ↓
Decode
   ↓
Validate
   ↓
Ready
   ↓
Atomic swap
```

Tujuannya:

``` text
old surface
   ↓
tetap stabil
```

sampai:

``` text
new surface
   ↓
benar-benar siap
```

------------------------------------------------------------------------

# 30. GEOMETRY CONTRACT

Geometry adalah concern berbeda dari performance budget.

Contract V1:

``` text
SVG internal geometry = 320 × 320
aspect ratio = 1:1
```

Tidak boleh menyelesaikan masalah tile performance dengan:

``` text
Y multiplier
%
offset tuning
LOW-only geometry
```

atau perubahan visual lain yang sebenarnya tidak berkaitan dengan
workload.

Prinsip:

``` text
Geometry
   ≠
Performance Budget
```

C1 menggunakan geometry untuk menentukan demand.

Budget tidak boleh mengubah geometry.

------------------------------------------------------------------------

# 31. GEOREFERENCE

GeoReference adalah sumber kebenaran untuk hubungan:

``` text
PDF coordinate
      ↕
native map coordinate
```

Untuk GeoPDF baru:

``` text
Incoming GeoReference
      ↓
C1
      ↓
C2
      ↓
tile processing
```

Jangan menggunakan stale GeoReference dari map sebelumnya.

------------------------------------------------------------------------

# 32. RENDER SCALE GEOPDF

GeoPDF processing menggunakan render scale yang dibatasi oleh:

``` text
GEOPDF_RENDER_SCALE_ = 3.5
GEOPDF_MAX_RENDER_PIXELS_ = 12,000,000
GEOPDF_MAX_RENDER_DIMENSION_ = 4096
```

Secara konseptual:

``` text
requested scale
      ↓
area limit
      ↓
dimension limit
      ↓
final renderScale
```

Tujuannya membatasi ukuran raster/canvas agar tidak menyebabkan ledakan
memory.

Ini adalah concern render input/scale.

Bukan tile budget.

------------------------------------------------------------------------

# 33. 376 TILE --- APA SEBENARNYA?

`376` harus diperlakukan sebagai **angka yang harus dijelaskan**, bukan
langsung sebagai:

``` text
bug
```

dan juga bukan:

``` text
normal
```

Yang kita tahu dari historical evidence:

``` text
230+
280
376
```

pernah muncul sebagai workload besar.

Satu skenario historical 376 pernah sekitar:

``` text
159 seconds
```

Karena itu 376 adalah:

``` text
anti-regression reference
```

dan workload evidence.

------------------------------------------------------------------------

# 34. 58 / 65 / 98

Historical results:

``` text
58
65
98
```

juga pernah tercatat.

Jangan membuat:

``` text
LOW = 58
BALANCED = 65
HIGH = 98
```

secara hard-coded.

Angka tersebut adalah:

``` text
calibration evidence
```

bukan fixed target.

------------------------------------------------------------------------

# 35. 100 BUKAN TARGET FINAL

Jangan menggunakan:

``` text
GLOBAL_MAX = 100
```

sebagai kesimpulan final.

Yang benar:

``` text
GLOBAL_MAX
=
absolute architectural/emergency ceiling
```

dan nilainya harus dikunci berdasarkan evidence/calibration.

Tier budget juga tidak boleh ditebak.

Secara kontrak:

``` text
LOW_MAX
   ≤
BALANCED_MAX
   ≤
HIGH_MAX
   ≤
GLOBAL_MAX
```

tetapi angka aktual:

``` text
LOW_MAX
BALANCED_MAX
HIGH_MAX
```

masih harus berasal dari calibration evidence.

------------------------------------------------------------------------

# 36. NO MINIMUM RULE

Budget bukan target.

Jika C1 hanya membutuhkan:

``` text
Required = 6
```

maka sistem tidak boleh memaksa:

``` text
6 → 50
```

atau:

``` text
6 → 100
```

Hasil yang benar bila tidak ada kebutuhan tambahan:

``` text
Actual = 6
```

Budget hanya menjadi batas maksimum workload yang diizinkan.

------------------------------------------------------------------------

# 37. DEVICE PROFILER BUKAN TILE COUNTER

Device Profiler menjawab:

> "Seberapa kuat device ini?"

C1 menjawab:

> "Berapa tile yang dibutuhkan viewport?"

C2 menjawab:

> "Tile mana yang dipilih untuk diproses?"

Queue menjawab:

> "Bagaimana lifecycle tile dikelola?"

Renderer menjawab:

> "Bagaimana tile dibuat/render?"

Persistence menjawab:

> "Bagaimana tile disimpan dan digunakan kembali?"

Model:

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

------------------------------------------------------------------------

# 38. TELEMETRY YANG KITA BUTUHKAN

Telemetry yang ideal untuk satu proses GeoPDF:

``` text
DEVICE
  Tier
  Bench median
  RAM
  CPU
  DPR
  GPU
  Screen

PROFILE
  Tile size
  Max factor
  Batch
  Delay
  Prefetch
  Cache

C1
  Visible
  Required
  Full level
  Factor
  Tile size

C2
  Enabled
  Window valid
  Base full
  Detail full
  Detail selected
  Fallback
  Fallback reason

RENDER
  Planned
  Actual rendered
  Skipped
  Failed
  Elapsed
  Average tile time
```

Dengan data ini kita bisa membedakan:

``` text
Demand
Selection
Fallback
Actual processing
```

------------------------------------------------------------------------

# 39. CONTOH PEMBACAAN TELEMETRY

Misalnya hasil akhirnya:

``` text
C1
Visible        = 6
Required       = 6
Full level     = 376

C2
Base full      = ?
Detail full    = ?
Detail selected= ?
Window valid   = ?
Fallback       = ?

Render
Planned        = ?
Actual         = ?
Skipped        = ?
Failed         = ?
Elapsed        = ?
```

Kita belum boleh menyimpulkan dari angka 52 saja.

------------------------------------------------------------------------

# 40. SKENARIO A --- 376 HANYA FULL LEVEL

Contoh:

``` text
Full level       = 376
C1 Required      = 6
C2 Detail select = 46
Actual rendered  = 52
```

Maka 376 bukan actual processing.

Ia adalah:

``` text
full-level capacity / possible tile space
```

Actual:

``` text
52
```

Namun komposisi tepatnya harus dibuktikan dari telemetry.

------------------------------------------------------------------------

# 41. SKENARIO B --- PLANNED 52

Contoh:

``` text
Full level       = 376
C2 Planned       = 52
Actual rendered  = 52
Skipped          = 324
```

Interpretasi yang dapat didukung:

``` text
full level = 376
selection  = 52
actual     = 52
```

Artinya adaptive selection telah mengurangi processing dibanding full
level.

------------------------------------------------------------------------

# 42. SKENARIO C --- PLANNED 376

Contoh:

``` text
Full level       = 376
C2 Planned       = 376
Actual rendered  = 376
Skipped          = 0
```

Maka C2 tidak melakukan reduction pada workload tersebut.

Baru setelah itu kita perlu menelusuri:

``` text
C1 validity
C2 window
fallback
BASE/DETAIL composition
```

------------------------------------------------------------------------

# 43. SKENARIO D --- PLANNED 52, ACTUAL 376

Contoh:

``` text
C2 Planned       = 52
Actual rendered  = 376
```

Ini merupakan mismatch serius.

Yang harus ditelusuri:

``` text
planned set
     ↓
renderer input
     ↓
loop source
     ↓
selection enforcement
```

Bukan langsung mengubah profiler.

------------------------------------------------------------------------

# 44. APA YANG DICARI SEKARANG

Pertanyaan utama bukan:

> "Bagaimana membuat angka 376 menjadi 50?"

Pertanyaan sebenarnya:

> **"Apa yang dimaksud angka 376 pada runtime ini, dan berapa workload
> yang benar-benar diproses PDF.js?"**

Lalu:

``` text
376
 ↓
Full level?
Planned?
Actual?
 ↓
52
```

Kita ingin memisahkan:

``` text
GEOMETRIC SPACE
```

dari:

``` text
SELECTED WORKLOAD
```

dan:

``` text
ACTUAL WORKLOAD
```

------------------------------------------------------------------------

# 45. DATA FIELD YANG SUDAH KITA MILIKI

## LOW / Samsung S7 Edge

Field evidence:

``` text
Tier         : LOW
Bench median : 23.7 ms
Samples      : 16.8, 20.7, 21.7, 23.7, 26.3, 26.7
RAM          : 4 GB
CPU          : 8 cores
DPR          : 3.15
Screen       : 458 × 813
GPU          : ANGLE / ARM / Mali-T880
```

Profile:

``` text
Tile         : 768 px
Max factor   : 1x
Batch        : 2
Delay        : 25 ms
Prefetch     : 0
Cache        : 40
```

Field processing yang diamati:

``` text
52 tiles
```

Angka 52 dicatat sebagai observed field result.

**Komposisi 52 belum boleh dipastikan tanpa telemetry C2 lengkap.**

------------------------------------------------------------------------

## HIGH / Desktop field

Field evidence:

``` text
Tier         : HIGH
Bench median : 4.3 ms
Samples      : 3.9, 4, 4.1, 4.3, 4.7, 5
RAM          : 16 GB
CPU          : 8 cores
DPR          : 1.25
Screen       : 1536 × 864
GPU          : Intel UHD Graphics 620 via ANGLE
```

Profile:

``` text
Tile         : 512 px
Max factor   : 2x
Batch        : 16
Delay        : 0 ms
Prefetch     : 3
Cache        : 300
```

Field diagnostic yang terlihat:

``` text
Status  : DONE
Planned : 98 tiles
```

`98` tetap harus dibaca sebagai observed workload/diagnostic evidence,
bukan otomatis sebagai final HIGH budget.

------------------------------------------------------------------------

# 46. HUBUNGAN 52 VS 98 VS 376

Jangan membuat persamaan:

``` text
52 = LOW
98 = HIGH
376 = BUG
```

Persamaan itu terlalu sederhana.

Model yang benar:

``` text
Device
  ↓
Tier
  ↓
Profile
  ↓
GeoPDF
  ↓
GeoReference
  ↓
Viewport
  ↓
C1 demand
  ↓
C2 selection
  ↓
BASE/DETAIL composition
  ↓
Planned
  ↓
Actual render
```

Angka yang berbeda dapat berasal dari tahap yang berbeda.

------------------------------------------------------------------------

# 47. DAILY DIAGNOSTIC READING ORDER

Jika ada masalah performance, baca urut:

## 1. Device

``` text
Tier?
Bench?
RAM?
GPU?
DPR?
```

## 2. Profile

``` text
Tile size?
Factor?
Batch?
Delay?
Prefetch?
Cache?
```

## 3. C1

``` text
Visible?
Required?
Full level?
```

## 4. C2

``` text
Window valid?
Base full?
Detail full?
Detail selected?
Fallback?
```

## 5. Render

``` text
Planned?
Actual?
Skipped?
Failed?
Elapsed?
```

## 6. Queue

``` text
Pending?
Loading?
Loaded?
Failed?
Stored?
```

## 7. Persistence

``` text
Tile already exists?
Tile missing?
Runtime creation?
Saved?
```

Baru setelah itu melihat renderer.

------------------------------------------------------------------------

# 48. ANTI-REGRESSION CHECKLIST

Jangan melakukan patch sebelum menjawab:

``` text
[ ] Device tier benar
[ ] Profile benar
[ ] C1 valid
[ ] C1 Required diketahui
[ ] Full level diketahui
[ ] C2 enabled diketahui
[ ] C2 window validity diketahui
[ ] BASE/DETAIL composition diketahui
[ ] Planned diketahui
[ ] Actual diketahui
[ ] Skipped diketahui
[ ] Failed diketahui
[ ] Elapsed diketahui
```

Jika salah satu data inti belum ada:

``` text
STOP
MEASURE FIRST
```

------------------------------------------------------------------------

# 49. JANGAN MENYENTUH BAGIAN YANG SALAH

## Jika masalahnya C1

Jangan memperbaiki dengan:

``` text
Queue
```

## Jika masalahnya C2

Jangan memperbaiki dengan:

``` text
Device Profiler
```

## Jika masalahnya budget

Jangan memperbaiki dengan:

``` text
Geometry
```

## Jika masalahnya queue

Jangan memperbaiki dengan:

``` text
GeoReference
```

## Jika masalahnya persistence

Jangan memperbaiki dengan:

``` text
renderer
```

Ownership harus tetap jelas.

------------------------------------------------------------------------

# 50. V24.5 VS V25

## V24.5

``` text
IndexedDB V2
```

Protected architecture:

``` text
peta.js
map-state.js
map-surface-lifecycle.js
map-background-lifecycle.js
```

V24.5 tidak boleh dicampur dengan schema V25.

------------------------------------------------------------------------

## V25

V25 memiliki schema yang berbeda:

``` text
IndexedDB V4

maps
kmlOverlays
layers
mapLayerState
features
```

Jangan membawa perubahan V25 ke V24.5 hanya untuk menyelesaikan tile
performance.

------------------------------------------------------------------------

# 51. PROTECTED RUNTIME PRINCIPLE

Area runtime yang sudah dianggap protected:

``` text
GeoReference
C1
C2
Tile Engine
Tile Identity
Tile Store
Tile Queue
Runtime Loader
Missing Resolver
Runtime Tile Creation
Persistence
Gesture
Atomic Surface
```

Perubahan terhadap salah satu area tersebut harus memiliki:

``` text
contract
↓
evidence
↓
minimal change
↓
validation
```

------------------------------------------------------------------------

# 52. BOOT SAFETY

Boot adalah boundary terpisah dari tile calibration.

Jika patch diagnostic membuat:

``` text
stuck booting
```

maka diagnostic patch tersebut tidak boleh dipertahankan hanya karena
"telemetry berguna".

Urutan prioritas:

``` text
BOOT NORMAL
    ↓
MAP NORMAL
    ↓
GEO PDF NORMAL
    ↓
TELEMETRY
```

Telemetry adalah observability layer.

Ia tidak boleh merusak startup/runtime baseline.

------------------------------------------------------------------------

# 53. APA YANG SUDAH SELESAI

Secara arsitektur, bagian berikut sudah memiliki fondasi:

``` text
Device Profiler
      PASS / EXISTING

Tile Engine Profile
      PASS / EXISTING

C1 Viewport Planner
      PASS / EXISTING

C2 Adaptive Concept
      ACTIVE / UNDER VALIDATION

Tile Identity
      EXISTING

Persistent Tile Store
      EXISTING

Tile Queue
      EXISTING

Runtime Loader
      EXISTING

Missing Resolver
      EXISTING

Runtime Tile Creation
      EXISTING

Runtime Persistence
      EXISTING

Atomic Surface
      LOCKED

Geometry Contract
      LOCKED

V24.5 IndexedDB
      V2 / LOCKED
```

------------------------------------------------------------------------

# 54. APA YANG BELUM SELESAI

Yang belum boleh dikunci hanya berdasarkan angka historis:

``` text
LOW_MAX
BALANCED_MAX
HIGH_MAX
GLOBAL_MAX
```

Nilainya harus berasal dari calibration.

Juga belum boleh dikunci:

``` text
arti pasti angka 52
komposisi pasti BASE/DETAIL dari 52
```

sampai telemetry C2 lengkap terlihat.

------------------------------------------------------------------------

# 55. CALIBRATION MATRIX

Tahap berikutnya setelah telemetry lengkap:

``` text
                 LOW       BALANCED       HIGH
Device            ✓            ✓             ✓
Bench median      ✓            ✓             ✓
Tile size         ✓            ✓             ✓
C1 demand         ✓            ✓             ✓
C2 selection      ✓            ✓             ✓
Actual render     ✓            ✓             ✓
Elapsed           ✓            ✓             ✓
Stability         ✓            ✓             ✓
```

Lalu:

``` text
correlate benchmark
       ↕
tile workload
       ↓
measure stability
       ↓
derive tier ceiling
```

Bukan:

``` text
ambil angka 98
↓
jadikan HIGH_MAX
```

------------------------------------------------------------------------

# 56. BUDGET MODEL

Budget masa depan:

``` text
C1 Demand
      ↓
C2 Selected Set
      ↓
Tier Budget Gate
      ↓
Allowed Set
      ↓
Actual Processing
```

Budget harus:

``` text
NO MINIMUM
```

dan hanya menjadi upper boundary.

Contoh konseptual:

``` text
C1 = 6
C2 = 6
Budget = 100

Actual = 6
```

Bukan:

``` text
Actual = 100
```

------------------------------------------------------------------------

# 57. GLOBAL CEILING

Global ceiling harus dipahami sebagai:

``` text
absolute safety boundary
```

bukan:

``` text
target workload
```

dan bukan:

``` text
minimum
```

Nilainya belum boleh dianggap final sebelum calibration selesai.

Jika evidence suatu tier menunjukkan workload aman di atas 100, angka
\>100 tidak otomatis salah.

Jika evidence menunjukkan workload jauh di bawah 100 sudah tidak stabil,
angka 100 juga tidak otomatis aman.

------------------------------------------------------------------------

# 58. PERFORMANCE VS QUALITY

Tile size dan render factor memengaruhi:

``` text
quality
memory
render cost
```

Contoh historical LOW:

``` text
768 px
1.0x
1.50x
1.55x
```

merupakan evolusi tuning visual/performance.

Tetapi:

``` text
render factor
```

tidak boleh digunakan sebagai pengganti:

``` text
tile budget
```

dan:

``` text
geometry
```

tidak boleh digunakan sebagai pengganti:

``` text
C2 selection
```

------------------------------------------------------------------------

# 59. CORE CONTRACT

Seluruh Engine V2 dapat diringkas:

``` text
STEP A
DEVICE PROFILER
      ↓
"kemampuan device"

STEP B
TILE ENGINE PROFILE
      ↓
"parameter workload"

STEP C1
VIEWPORT PLANNER
      ↓
"kebutuhan geometry"

STEP C2
ADAPTIVE SELECTION
      ↓
"tile yang dipilih"

QUEUE
      ↓
"lifecycle"

LOADER / RESOLVER
      ↓
"available vs missing"

RUNTIME CREATION
      ↓
"buat hanya tile yang diperlukan"

PERSISTENCE
      ↓
"simpan untuk penggunaan berikutnya"

SURFACE
      ↓
"tampilkan secara atomic"
```

------------------------------------------------------------------------

# 60. CORE PRINCIPLE

Lithosite bukan:

``` text
ALL PDF
   ↓
ALL LEVEL
   ↓
ALL TILE
```

dan bukan:

``` text
ALL DEVICE
   ↓
ONE TILE COUNT
```

Arsitektur yang diinginkan:

``` text
DEVICE CAPABILITY
        +
VIEWPORT DEMAND
        +
ADAPTIVE SELECTION
        +
TIER POLICY
        =
CONTROLLED TILE WORKLOAD
```

Dengan:

``` text
NO MINIMUM
```

------------------------------------------------------------------------

# 61. APA YANG HARUS DILAKUKAN JIKA ANGKA 376 MUNCUL LAGI

Jangan langsung patch.

Ambil:

``` text
Device Profiler
   ↓
C1
   ↓
C2
   ↓
Render
```

dan catat:

``` text
Tier
Bench
Tile
Factor

C1 Visible
C1 Required
C1 FullLevel

C2 BaseFull
C2 DetailFull
C2 DetailSelected
C2 WindowValid
C2 Fallback

Planned
Actual
Skipped
Failed
Elapsed
```

Lalu baru tentukan sumber 376.

------------------------------------------------------------------------

# 62. PROSEDUR FIELD TEST V24.5

## Test 1 --- Cold open

``` text
Close app/tab
↓
Open
↓
Boot
↓
Map
```

Catat:

``` text
boot stable?
map stable?
console error?
```

------------------------------------------------------------------------

## Test 2 --- Existing map

``` text
Open existing map
↓
Wait
↓
Observe map
```

Catat:

``` text
tile already stored?
new PDF processing?
```

------------------------------------------------------------------------

## Test 3 --- New GeoPDF

``` text
New Map
↓
Choose GeoPDF
↓
GeoReference detected
↓
Process
↓
Wait until DONE
```

Catat telemetry lengkap.

------------------------------------------------------------------------

## Test 4 --- Repeat same GeoPDF

``` text
same file
↓
second processing
```

Bandingkan:

``` text
Planned
Actual
Elapsed
```

------------------------------------------------------------------------

## Test 5 --- Restart

``` text
close application
↓
reopen
↓
open same map
```

Tujuannya melihat:

``` text
persistence
vs
new rendering
```

------------------------------------------------------------------------

# 63. CURRENT FIELD OBSERVATION

Field observation yang relevan:

``` text
S7 Edge / LOW
≈ 52 tile
```

dan:

``` text
Desktop / HIGH
≈ 98 planned tiles
```

Historical:

``` text
376 full/high workload case
```

Ketiga angka ini sekarang harus ditempatkan dalam satu telemetry chain.

Belum boleh disatukan menjadi satu jenis metric.

------------------------------------------------------------------------

# 64. SATU-SATUNYA PERTANYAAN TEKNIS YANG TERSISA

Pertanyaan utama:

> **Pada runtime V24.5 sekarang, ketika angka 52 muncul, 52 itu
> sebenarnya mewakili apa?**

Kita perlu tahu:

``` text
Base full       = ?
Detail full     = ?
Detail selected = ?
C2 Window       = ?
Fallback        = ?
Actual rendered = ?
Elapsed         = ?
```

Jika semua sudah tersedia, kita bisa menjawab dengan bukti:

``` text
376
 ↓
full level
 ↓
C2 selection
 ↓
actual render
 ↓
52
```

------------------------------------------------------------------------

# 65. JANGAN MEMBUAT PROFILER BARU UNTUK INI

Device Profiler sudah melakukan tugasnya.

Profiler sudah dapat mendeteksi:

``` text
Tier
Bench
RAM
CPU
DPR
Screen
GPU
Tile profile
```

Telemetry yang diperlukan untuk pertanyaan 376/52 berada pada sisi:

``` text
GeoPDF processing
C1
C2
Renderer
```

Jadi kebutuhan saat ini bukan membuat profiler baru.

Yang diperlukan adalah:

``` text
READ EXISTING TELEMETRY
```

------------------------------------------------------------------------

# 66. STATUS ENGINE V1 → V2

``` text
V1
Functional Mining App
        ↓
Map Feature
        ↓
Large / pyramid-oriented processing
        ↓
Limited lifecycle separation

                MIGRATION

V2
Offline Geospatial Runtime
        ↓
Device-aware
        ↓
Viewport-aware
        ↓
Adaptive selection
        ↓
Stable tile identity
        ↓
Persistent store
        ↓
Queue lifecycle
        ↓
Runtime loader
        ↓
Missing resolver
        ↓
Runtime tile creation
        ↓
Persistence
        ↓
Atomic surface
```

------------------------------------------------------------------------

# 67. ENGINEERING RULES PERMANEN

## Jangan

``` text
DO NOT guess tile budget.

DO NOT target 58.

DO NOT target 65.

DO NOT target 98.

DO NOT treat 376 as automatically normal.

DO NOT treat 376 as automatically a bug.

DO NOT add minimum tile count.

DO NOT use one identical workload for all devices.

DO NOT change geometry to solve performance.

DO NOT change IndexedDB to solve C1/C2.

DO NOT change Queue to solve Profiler.

DO NOT change Profiler to explain a renderer bug.

DO NOT patch before tracing telemetry.
```

## Lakukan

``` text
USE Device Profiler.

USE device tiers.

USE C1 for geometric demand.

USE C2 for adaptive selection.

USE Tile Identity.

USE persistent Tile Store.

USE Queue lifecycle.

USE runtime loader.

USE missing resolver.

USE runtime tile creation when required.

USE telemetry.

USE calibration evidence.

USE real-device validation.
```

------------------------------------------------------------------------

# 68. DEFINITION OF DONE --- ENGINE V2 DAILY RUNTIME

Engine V2 dianggap sehat untuk daily use jika:

``` text
[✓] Boot normal
[✓] Map surface normal
[✓] GeoReference valid
[✓] Device tier observable
[✓] C1 produces valid demand
[✓] C2 selection is traceable
[✓] Stored tiles can load
[✓] Missing tiles can resolve
[✓] Runtime tile creation works when needed
[✓] Created tiles can persist
[✓] Queue state remains consistent
[✓] Pan/zoom remains stable
[✓] Geometry remains unchanged
[✓] IndexedDB V2 remains intact
[✓] Atomic surface remains stable
[ ] Final LOW budget calibrated
[ ] Final BALANCED budget calibrated
[ ] Final HIGH budget calibrated
[ ] Final global ceiling calibrated
```

------------------------------------------------------------------------

# 69. CURRENT WORKING STATUS

``` text
ENGINE V1 → V2
        ARCHITECTURE DOCUMENTED

DEVICE PROFILER
        EXISTING / OBSERVABLE

TILE ENGINE PROFILE
        EXISTING

C1
        EXISTING / ACTIVE

C2
        ACTIVE / UNDER VALIDATION

QUEUE
        EXISTING

PERSISTENT STORE
        EXISTING

RUNTIME LOADER
        EXISTING

RUNTIME CREATION
        EXISTING

PERSISTENCE
        EXISTING

GEOMETRY
        LOCKED

ATOMIC SURFACE
        LOCKED

V24.5 IndexedDB
        V2 / LOCKED

NUMERIC TILE BUDGET
        NOT YET LOCKED
```

------------------------------------------------------------------------

# 70. FINAL ENGINE STATEMENT

Lithosite Engine V2 bukan sekadar perubahan jumlah tile.

Perubahan fundamentalnya adalah perubahan cara map bekerja:

``` text
V1

MAP = FEATURE
```

menjadi:

``` text
V2

MAP = OFFLINE GEOSPATIAL RUNTIME
```

Dengan boundary:

``` text
Device
   ↓
Profile
   ↓
Geometry
   ↓
Selection
   ↓
Lifecycle
   ↓
Storage
   ↓
Runtime
   ↓
Surface
```

Karena itu angka tile tidak boleh dibaca sendirian.

Yang harus dibaca adalah:

``` text
WHO requested it?
WHO selected it?
WHO rendered it?
WHO stored it?
WHO loaded it?
HOW LONG did it take?
```

Itulah alasan telemetry menjadi penting.

------------------------------------------------------------------------

# 71. NEXT VALIDATION --- TANPA PATCH

Untuk investigasi `376 → 52`, tidak perlu membuat profiler baru dan
tidak perlu membuat patch baru.

Cukup satu field run pada S7:

``` text
1. Jalankan GeoPDF.
2. Tunggu sampai benar-benar selesai.
3. Buka Device Profiler.
4. Scroll ke bawah.
5. Ambil bagian:
      GEO PDF PERFORMANCE
      C1
      C2
      RENDER
6. Kirim screenshot lengkap.
```

Data yang dicari:

``` text
Base full
Detail full
Detail selected
C2 Window
Fallback
Planned
Actual rendered
Skipped
Failed
Elapsed
```

Setelah itu kita dapat menentukan arti angka 52 tanpa menebak.

------------------------------------------------------------------------

# 72. FIVE FOOTNOTES / CATATAN KAKI

### \[1\] Tentang Device Profiler

Device Profiler adalah alat pengukuran dan klasifikasi device. Ia tidak
otomatis menentukan jumlah tile yang harus dirender. Device capability
dan viewport demand adalah dua contract berbeda.

### \[2\] Tentang angka 58 / 65 / 98

Angka tersebut adalah historical/calibration evidence. Mereka tidak
boleh langsung dijadikan `LOW_MAX`, `BALANCED_MAX`, atau `HIGH_MAX`.

### \[3\] Tentang angka 376

`376` adalah workload/full-level evidence yang harus dijelaskan melalui
telemetry. Angka tersebut tidak boleh otomatis disebut bug, dan tidak
boleh otomatis dianggap workload daily yang benar.

### \[4\] Tentang budget

`LOW_MAX`, `BALANCED_MAX`, `HIGH_MAX`, dan global ceiling belum boleh
dipatok berdasarkan tebakan. Tidak ada minimum tile count. Budget adalah
batas workload, bukan target workload.

### \[5\] YANG BELUM BOLEH KITA SIMPULKAN

Kita **belum boleh mengatakan**:

> **"52 pasti C2."**

Karena kita belum melihat komposisi:

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
C1 / C2 / BASE / DETAIL
  ↓
52
```

Telemetry yang dibutuhkan untuk menjawab pertanyaan tersebut sudah
berada pada alur GeoPDF/runtime yang ada; tidak perlu membuat Device
Profiler baru hanya untuk pertanyaan ini.

------------------------------------------------------------------------

# 73. PERMANENT REMINDER

``` text
MEASURE FIRST
     ↓
UNDERSTAND CONTRACT
     ↓
TRACE OWNER
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
BREAK BOOT
     ↓
PATCH AGAIN
```

**V24.5 Engine V2 harus diperlakukan sebagai runtime yang terstruktur,
bukan kumpulan patch.**
