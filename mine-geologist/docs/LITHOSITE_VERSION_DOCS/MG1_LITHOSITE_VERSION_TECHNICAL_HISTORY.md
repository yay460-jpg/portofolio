# MG1 / LITHOSITE --- VERSION TECHNICAL HISTORY

## Engineering Changelog, Lifecycle, Architecture & Before/After Record

**Project:** MG1 / Mine Geologist / Lithosite Member App\
**Document type:** Technical version history / architecture record\
**Scope:** Product evolution, map runtime, GeoPDF, Tile Engine,
lifecycle, Map Library, UI, persistence, validation and known technical
debt.\
**Document status:** Living engineering document\
**Current documented baseline:** **V24.3 Map Library --- FINAL LOCKED**\
**Next stage:** **V24.4 --- Map Lifecycle Completion**

------------------------------------------------------------------------

## 0. PURPOSE & DOCUMENT RULES

Dokumen ini dibuat sebagai **single technical history** agar evolusi
MG1/Lithosite tidak hanya tercatat sebagai daftar perubahan, tetapi juga
menjelaskan:

1.  masalah teknis yang ditemukan;
2.  alasan perubahan;
3.  alur sebelum dan sesudah;
4.  fitur yang ditambahkan;
5.  perbaikan yang dilakukan;
6.  struktur file dan ownership;
7.  perubahan arsitektur;
8.  batas area yang sengaja tidak disentuh;
9.  hasil validasi;
10. keputusan baseline/lock;
11. ringkasan akhir tiap versi.

### Prinsip pencatatan

-   **Tidak mengarang detail yang tidak memiliki bukti.**
-   Jika sebuah versi hanya diketahui secara parsial, ditandai sebagai
    **partial record**.
-   Technical debt yang sudah diketahui tidak dianggap regresi kecuali
    ada bukti perubahan behavior.
-   Runtime yang sudah di-lock tidak boleh dibongkar incidental oleh
    feature management.
-   Perubahan lintas-file harus dicatat sebagai dependency/ownership
    change.
-   `peta.js` tidak dianggap sebagai tempat default untuk semua fitur;
    ownership harus dipisahkan bila memungkinkan.
-   Setiap release/baseline harus memiliki status validasi yang jelas.
-   **Kolom/field terakhir pada master table selalu `Ringkasan`.**

------------------------------------------------------------------------

# 1. MASTER VERSION TABLE

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Versi / Era  Technical Issue /    Alur / Flow Utama             Fitur                                     Perbaikan / Perubahan       Struktur &           Struktur &        Validasi / Status   Ringkasan
               Kondisi                                                                                                                  Arsitektur Sebelum   Arsitektur                            
                                                                                                                                                             Sesudah                               
  ------------ -------------------- ----------------------------- ----------------------------------------- --------------------------- -------------------- ----------------- ------------------- --------------------
  **V1**       Map masih merupakan  Member App → Background Map → Dashboard, Ringkasan, Digging, Validasi,  Fondasi awal mapping        Satu Member App      Map mulai         Historical          **Fondasi functional
               salah satu fitur di  GeoPDF/GeoReference/GPS/Map   KPI, Chat/Issue, Settings, Background Map operasional                 dengan map sebagai   memiliki fondasi  foundation          mining member app.**
               Member App;          Tap/Tile Rendering                                                                                  feature              geospatial                            
               ownership map belum                                                                                                                           sendiri                               
               menjadi subsystem                                                                                                                                                                   
               penuh                                                                                                                                                                               

  **V2**       Kebutuhan offline    GeoPDF → GeoReference → C1 →  Offline runtime, viewport planning, tile  Map berubah dari feature    Map feature          Offline           **Runtime V2        **Fondasi arsitektur
               geospatial runtime   Device Profile → C2 → Tile    identity, persistent tile, runtime        menjadi runtime engine      bercampur dengan     geospatial        dilindungi /        map modern
               dan lifecycle yang   Identity → Store → Loader →   loading, atomic surface                                               application flow     runtime berlapis  LOCKED**            Lithosite.**
               lebih kuat           Missing Resolver → Tile                                                                                                                                        
                                    Creation → Persistence →                                                                                                                                       
                                    Atomic Surface                                                                                                                                                 

  **V14.22**   Device capability    Device → micro/Canvas/WebGL   Device Profiler V1                        Tambah                      Renderer memakai     Device profile    Changelog recorded  **Awal
               tidak boleh ditebak  profile → LOW/BALANCED/HIGH                                             `getDeviceTileProfile_()`   asumsi umum          menjadi input                         adaptive-device
               dari satu setting                                                                                                                             diagnostik                            strategy.**

  **V14.23**   Profil device sulit  Profiler → Diagnostic Overlay On-screen profiler                        Tambah diagnostic overlay   Profil hanya         Profil dapat      Renderer/runtime    **Observability
               diamati saat field                                                                           tanpa mengubah renderer     internal             dilihat saat      unchanged           ditambahkan tanpa
               test                                                                                                                                          testing                               menyentuh
                                                                                                                                                                                                   renderer.**

  **V14.24**   Benchmark            Warm-up → multiple samples →  Profiler V2                               Benchmark 512×512           Single/kurang stabil Median-based      Changelog recorded  **Profiling dibuat
               single-sample kurang median                                                                  raster/compositing + median                      device                                lebih realistis.**
               representatif                                                                                                                                 measurement                           

  **V14.25**   Parameter tile       Device tier → tile params     Tile size, max factor, batch, delay,      Candidate parameters dibuat Renderer belum       Parameter profile Parameter-only      **Parameter adaptive
               engine belum                                       prefetch, cache                                                       memakai parameter    siap menjadi                          tersedia, belum
               adaptive per device                                                                                                                           contract                              dikonsumsi
                                                                                                                                                                                                   renderer.**

  **V14.26**   Renderer perlu       GeoReference + zoom +         C1 Viewport Tile Planner                  Planner menghitung          Rendering tidak      C1 menjadi        Planner-only        **Fondasi viewport
               mengetahui tile yang viewport + tile size →                                                  visible/required/prefetch   berbasis viewport    planning layer                        culling.**
               benar-benar terlihat visible/required/prefetch                                                                           planner                                                    

  **V14.27**   Diagnostic panel     Panel → minimize/reopen       Minimize diagnostic                       UI diagnostic diperbaiki    Panel selalu terbuka Panel dapat       Rendering/gesture   **Observability
               mengganggu area test                                                                                                                          disembunyikan     unchanged           lebih usable.**

  **V14.28**   Full render semua    Base/fallback full preview +  C2 adaptive visible-tile rendering        Experimental C2             Semua level          Higher levels     Experimental        **Awal adaptive C2
               high-res tile mahal  higher level                                                                                        cenderung full       mulai                                 rendering.**
               untuk device rendah  viewport/prefetch                                                                                                        viewport-based                        

  **V14.29**   Browser dapat memuat Build → cache                 SW cache bump                             Cache version dinaikkan     Risiko stale JS      Build terbaru     Changelog recorded  **Deployment/cache
               build lama dari                                                                                                                               dipaksa terambil                      consistency
               Service Worker                                                                                                                                                                      diperbaiki.**

  **V14.30**   Tidak ada bukti      C1 → C2 → metrics             Planned/Rendered/Failed/Skipped/elapsed   Diagnostic metrics          Status ACTIVE bisa   ACTIVE setelah    Changelog recorded  **C2 menjadi
               objektif apakah C2                                                                           ditambahkan                 ambigu               render completion                     measurable.**
               benar-benar efisien                                                                                                                                                                 

  **V14.31**   Perlu field test     C1 Visible → C2               Auto visible field test                   C2 otomatis untuk           Manual trigger       Test path lebih   Controlled field    **Planner dan
               otomatis terhadap    Planned/Rendered                                                        controlled testing                               repeatable        test                renderer mulai dapat
               planner vs renderer                                                                                                                                                                 dibandingkan.**

  **V14.32**   Handoff C1/C2 dan    Upload → incoming             Handoff fix                               `adaptiveC2`                Risiko planner       Incoming          Changelog recorded  **Handoff geospatial
               GeoReference upload  GeoReference → C1/C2 →                                                  initialization/handoff      memakai state lama   GeoReference                          dibuat konsisten.**
               belum konsisten      persistence                                                             diperbaiki; incoming                             menjadi sumber                        
                                                                                                            GeoReference dipakai                             handoff                               
                                                                                                            sebelum persistence                                                                    

  **V14.33**   LOW render terlalu   C2 LOW → 0.5x                 Quality improvement                       LOW factor dinaikkan        Prioritas            Sharpness         Changelog recorded  **Kualitas LOW
               blur pada factor                                                                             \~0.25x → 0.5x              performance terlalu  meningkat                             dinaikkan.**
               \~0.25x                                                                                                                  tinggi                                                     

  **V14.34**   0.5x masih kurang    C2 LOW → native 1x            Native rendering                          Factor dinaikkan ke 1x,     Sub-native rendering Native 1x +       Changelog recorded  **LOW kembali ke
               tajam                                                                                        tile tetap 256px                                 viewport culling                      native sharpness.**

  **V14.35**   Diagnostic factor    Actual C2 → diagnostic        Factor reporting fix                      Reporting diperbaiki ke 1x  Diagnostic           Diagnostic sesuai Changelog recorded  **Observability
               tidak mencerminkan                                                                                                       misleading           runtime                               disinkronkan dengan
               actual setting                                                                                                                                                                      behavior.**

  **V14.36**   New GeoPDF upload    Upload → incoming extent → C1 GeoRef handoff fix                        Handoff extent diperbaiki   Risiko C1 membaca    Incoming extent   Changelog recorded  **GeoReference
               harus menyerahkan    → persistence                                                                                       GeoRef lama          dipakai lebih                         handoff diperkuat.**
               GeoReference ke C1                                                                                                                            awal                                  
               sebelum persistence                                                                                                                                                                 

  **V14.37**   Tile 256px kurang    C2 LOW → 512px                Tile size 512                             Tile size naik 256 → 512    Banyak tile kecil    Tile lebih besar  Changelog recorded  **Tile granularity
               efisien pada LOW                                                                                                                              dengan native 1x                      dioptimalkan.**

  **V14.38**   Perlu                C2 LOW → density \~1.5x + 768 Tile 768 / density                        Raster ceiling 768px +      512px                768px + density   Changelog recorded  **HIGHER density
               density/sharpness    ceiling                                                                 effective scale diagnostic                                                             diuji.**
               lebih baik                                                                                                                                                                          

  **V14.39**   Scaling V14.38 tidak C1 ↔ C2 scale                 Native sharp render correction            LOW kembali native 1x +     Scaling mismatch     Native 1x +       Changelog recorded  **Scaling kembali
               aligned                                                                                      768px; C1 alignment                              aligned planning                      konsisten.**

  **V14.40**   Native 1x masih      C2 LOW → 1.50x                Sharp 1.50x                               Factor 1.0 → 1.50x dengan   Native 1x            1.50x + 768px     Changelog recorded  **Sharpness LOW
               punya ruang                                                                                  768px                                                                                  ditingkatkan.**
               sharpness                                                                                                                                                                           

  **V14.41**   Coverage tile perlu  C2 → selected coverage        25-tile target                            LOW target coverage sampai  Coverage kurang      Coverage target   Changelog recorded  **Adaptive render
               dibatasi                                                                                     25 tile                     terkontrol           eksplisit                             punya target
                                                                                                                                                                                                   coverage.**

  **V14.15**   Boot → Dashboard     Boot → Dashboard Animation →  Pixel Boot, Dashboard Reveal, repeatable  Lifecycle boot/dashboard    Transition kurang    Boot handoff +    **Baseline field    **Baseline
               transition dan       Dashboard                     gesture, smooth pan                       dan gesture diperbaiki      final                dashboard         test PASS**         frontend/map
               gesture lifecycle                                                                                                                             animation +                           interaction yang
               perlu stabil                                                                                                                                  repeatable                            stabil sebelum tahap
                                                                                                                                                             gesture                               berikutnya.**

  **V19**      Map modal lama       Open modal → global render    Isolated new map modal                    Modal dipisahkan dari       Modal tergantung     Isolated modal    Historical          **Awal isolasi modal
               terkait global                                                                               render lifecycle            render               DOM lifecycle     compatibility layer map.**
               render dan dapat                                                                                                                                                                    
               menyebabkan flicker                                                                                                                                                                 

  **V22**      Surface swap harus   Build hidden surface →        Atomic Surface Swap, fixed SVG `<image>`  New surface hidden, preload Replace dapat        Non-destructive   Runtime LOCKED      **Fondasi surface
               aman; partial/failed preload → swap OR cancel      preload path                              3000ms, swap hanya jika     terjadi sebelum      atomic swap                           lifecycle yang masih
               preload tidak boleh                                                                          ready, timeout              surface siap                                               dipakai V24.3.**
               merusak map lama                                                                             mempertahankan old surface                                                             

  **V23**      Global `render()`    Open/close modal → DOM only;  No-modal-flicker, isolated management     Override open/close tanpa   Modal masih          Management modal  Runtime LOCKED      **Management UI
               menyebabkan modal    activate/delete → atomic swap modal, V23 activate/delete helpers        global render; atomic       render-coupled       isolated; runtime                     dipisahkan dari
               flicker dan                                                                                  activation/delete                                surface swap                          render lifecycle.**
               management path                                                                                                                               preserved                             
               bercampur                                                                                                                                                                           

  **V24.1**    Save path berat jika Upload → RAM commit → instant RAM-first save, instant preview,          Heavy persistence           Save menunggu        RAM-first         Runtime LOCKED      **Save UX dibuat
               menunggu             preview → background          worker/background persistence             dikeluarkan dari click path pekerjaan berat      response + async                      instant tanpa
               IndexedDB/pyramid    persistence → detail atomic                                                                                              persistence                           membuang
               sebelum UI kembali   upgrade                                                                                                                                                        persistence.**

  **V24.2**    Adaptive renderer    Device profile → tile profile LOW viewport fit, marker behavior         LOW baseline dipertahankan; Renderer berisiko    LOW viewport      **V24.2 LOCKED**    **Runtime
               harus benar-benar    → C1 → C2 → runtime                                                     HIGH frozen                 over-render          behavior locked                       performance baseline
               viewport-first dan                                                                                                                                                                  yang dilindungi.**
               marker tetap presisi                                                                                                                                                                

  **V24.3**    Map Runtime sudah    Management UI → Library       Search, sort, Active/Inactive, Label,     Cross-file ownership        Management bercampur Library boundary  **FINAL LOCKED /    **Map
               matang tetapi Map    facade → contract/capability  Collection, Info, Rename, Delete,         mapping; `MG1MapLibrary`;   dengan legacy        terpisah dari     runtime smoke       Library/Management
               Library/Management   → IndexedDB/existing          canonical UI                              metadata boundary;          bridge/state/cache   runtime;          PASS**              menjadi subsystem
               belum menjadi        lifecycle                                                               canonical UI; F1 legacy                          IndexedDB                             canonical tanpa
               subsystem dengan                                                                             flag hardening                                   canonical;                            menyentuh locked
               boundary jelas;                                                                                                                               compatibility                         runtime.**
               legacy UI dapat                                                                                                                               cache retained                        
               resurrect                                                                                                                                                                           
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 2. ERA V1 --- FUNCTIONAL MINING MEMBER APP

## 2.1 Kondisi awal

Pada V1, Lithosite masih merupakan bagian dari **Member App** yang
mencakup:

-   Dashboard
-   Ringkasan
-   Digging
-   Validasi
-   KPI
-   Chat / Issue
-   Settings
-   Background Map

Map memiliki:

-   GeoPDF
-   GeoReference
-   GPS
-   Map Tap
-   Tile Rendering

### Struktur awal

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

## 2.2 Masalah arsitektur

Map masih dipandang sebagai **feature**, bukan platform runtime.

Akibatnya:

-   lifecycle map belum menjadi boundary tersendiri;
-   persistence/runtime belum terpisah jelas;
-   management dan rendering dapat berkembang bersama;
-   sulit melakukan optimasi map tanpa risiko menyentuh application
    flow.

## 2.3 Hasil

V1 menjadi fondasi functional mining application.

**Ringkasan:** map sudah usable, tetapi belum memiliki arsitektur
runtime yang berdiri sendiri.

------------------------------------------------------------------------

# 3. ERA V2 --- OFFLINE GEOSPATIAL RUNTIME

V2 merupakan perubahan arsitektur besar.

## 3.1 Alur runtime

``` text
GeoPDF
  ↓
GeoReference
  ↓
C1 Viewport Planner
  ↓
Device Tile Profile
  ↓
C2 Tile Pyramid
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

## 3.2 Konsep utama

V2 memperkenalkan pemisahan:

-   planning;
-   device profiling;
-   tile generation;
-   tile identity;
-   tile persistence;
-   runtime loading;
-   missing tile recovery;
-   surface swap.

## 3.3 Keputusan penting

V2 menjadi **fondasi runtime yang dilindungi**.

Area V2 yang kemudian dianggap locked:

-   Tile Engine
-   C1
-   C2
-   GeoReference
-   gesture/interaction
-   runtime tile loading
-   tile identity
-   persistent tile runtime
-   atomic surface
-   existing map rendering pipeline

**Ringkasan:** V2 mengubah map dari feature menjadi offline geospatial
runtime.

------------------------------------------------------------------------

# 4. V14.22--V14.41 --- DEVICE PROFILE → C1 → C2 ADAPTIVE RENDERING

## 4.1 Device Profiling

### V14.22 --- Device Profiler V1

Masalah:

> satu konfigurasi tidak cukup untuk semua device.

Profiler mengukur:

-   RAM;
-   CPU;
-   DPR;
-   resolution;
-   WebGL;
-   Canvas benchmark.

Output:

``` text
LOW
BALANCED
HIGH
```

Renderer belum diubah.

### V14.23 --- Diagnostic Overlay

Profiler dibuat observable di layar.

Prinsip:

``` text
Diagnostic
    ↓
Observe
    ↓
Do not alter renderer
```

### V14.24 --- Profiler V2

Benchmark dibuat lebih representative:

``` text
Warm-up
   ↓
Multiple samples
   ↓
Median
```

Benchmark menggunakan raster/compositing 512×512.

------------------------------------------------------------------------

## 4.2 Tile Engine Profile

### V14.25

Candidate parameter mulai didefinisikan:

``` text
Tile Size
Max Factor
Batch
Delay
Prefetch
Cache
```

Tetapi:

> parameter masih **belum dikonsumsi renderer**.

Ini penting karena tahap ini adalah **parameter layer**, bukan adaptive
runtime penuh.

------------------------------------------------------------------------

## 4.3 C1 Viewport Planner

### V14.26

Planner menghitung:

``` text
GeoReference
+ Zoom
+ Viewport
+ Tile Size
        ↓
Visible
Required
Prefetch
```

Ini menjadi dasar viewport culling.

------------------------------------------------------------------------

## 4.4 C2 Adaptive Rendering

### V14.28

Konsep:

``` text
Base / fallback
      ↓
Full preview

Higher detail
      ↓
Viewport
   +
Prefetch ring
```

Tujuannya menghindari rendering seluruh high-resolution map.

### V14.30

C2 diberi metrics:

``` text
Planned
Rendered
Failed
Skipped
Elapsed
```

Status ACTIVE hanya setelah render selesai.

### V14.31

C2 diaktifkan untuk controlled field test sehingga:

``` text
C1 Visible
      ↕
C2 Planned / Rendered
```

dapat dibandingkan.

------------------------------------------------------------------------

## 4.5 GeoReference handoff

### V14.32 / V14.36

Problem:

> upload GeoPDF baru harus menggunakan incoming GeoReference sebelum map
> persistence.

Flow diperbaiki:

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

bukan:

``` text
New GeoPDF
   ↓
Persist
   ↓
baru planner membaca state
```

**Ringkasan V14.22--V14.41:** adaptive map engine berkembang dari
profiling → parameter → viewport planner → adaptive renderer →
measurable C2 → GeoReference handoff → tile/density/sharpness tuning.

------------------------------------------------------------------------

# 5. V14.33--V14.41 --- LOW QUALITY / SHARPNESS TUNING

Urutan tuning penting karena menunjukkan trade-off performance vs
sharpness.

``` text
V14.33
~0.25x → 0.5x

V14.34
0.5x → 1.0x

V14.35
diagnostic factor correction

V14.37
256px → 512px

V14.38
512px → 768px
density ~1.5x

V14.39
scaling correction
native 1x + 768px

V14.40
1.0x → 1.50x

V14.41
coverage target → up to 25 tiles
```

**Ringkasan:** LOW tidak sekadar dibuat cepat; kualitas visual dinaikkan
bertahap sambil mempertahankan viewport culling.

------------------------------------------------------------------------

# 6. V14.15 --- BOOT / DASHBOARD / GESTURE BASELINE

V14.15 mencatat:

``` text
Boot
 ↓
Pixel Boot
 ↓
Dashboard Animation
 ↓
Dashboard Reveal
```

Selain itu:

-   gesture 1-jari;
-   gesture 2-jari;
-   repeated gesture lifecycle;
-   smooth pan.

V14.15 ditetapkan sebagai baseline setelah field test PASS.

**Ringkasan:** frontend transition dan gesture lifecycle dibuat stabil
tanpa mengorbankan map interaction.

------------------------------------------------------------------------

# 7. V19 --- ISOLATED MAP MODAL

## Masalah

Management/upload modal terlalu dekat dengan global `render()`.

Risiko:

``` text
Open Modal
   ↓
render()
   ↓
DOM rebuild
   ↓
flicker
```

## Perubahan

Modal baru dibuat isolated.

``` text
Map Management
      ↓
Isolated DOM Modal
      ↓
No global render dependency
```

**Ringkasan:** V19 memulai pemisahan lifecycle modal dari rendering
utama.

------------------------------------------------------------------------

# 8. V22 --- ATOMIC SURFACE LIFECYCLE

## Masalah

Pergantian map tidak boleh membuat layar kehilangan map lama jika map
baru belum siap.

## Flow sebelum

``` text
Old map
  ↓
replace
  ↓
new map loading
  ↓
risk blank / partial surface
```

## Flow sesudah

``` text
Old surface
    │
    ├──────────────┐
    │              │
    │        Build new surface
    │              ↓
    │        Hidden / detached
    │              ↓
    │        Preload all images
    │              ↓
    │       ┌──────┴──────┐
    │       │             │
    │     READY         TIMEOUT
    │       │             │
    │       ↓             ↓
    │     SWAP       REMOVE NEW
    │                     │
    └─────────────────────┘
              ↓
       Old map retained
```

Karakteristik yang dikunci:

-   new surface hidden;
-   preload;
-   swap hanya jika ready;
-   timeout membatalkan surface baru;
-   old surface dipertahankan.

**Ringkasan:** V22 membentuk fondasi non-destructive map surface
lifecycle.

------------------------------------------------------------------------

# 9. V23 --- NO-MODAL-FLICKER + MANAGEMENT ISOLATION

## Masalah

`render()` global masih dapat menyebabkan flicker saat management modal
dibuka/ditutup.

## Perubahan

Override:

``` text
openMapManagePanel_()
closeMapManagePanel_()
openMapUploadForm_()
closeMapUploadForm_()
```

menggunakan isolated modal path.

Activation:

``` text
Select map
   ↓
set active state
   ↓
Atomic Surface Swap
   ↓
No global render
```

Delete:

``` text
Delete DB
   ↓
refresh list
   ↓
if active:
    clear active
    atomic surface update
```

## Catatan teknis

V23 juga memperkenalkan compatibility writer terhadap:

``` text
activeBackgroundMapId
mg1_active_bg_map_id
```

Multi-writer ini kemudian menjadi technical debt yang **sengaja tidak
direfactor incidental**.

**Ringkasan:** V23 memisahkan management UI dari global render dan
mempertahankan runtime lewat atomic surface swap.

------------------------------------------------------------------------

# 10. V24.1 --- TRUE INSTANT / RAM-FIRST SAVE

## Masalah

Save map besar tidak boleh membuat user menunggu seluruh persistence
pipeline.

## Flow lama

``` text
Click Save
   ↓
Heavy processing
   ↓
IndexedDB persistence
   ↓
UI response
```

## Flow V24.1

``` text
Click Save
   ↓
RAM commit
   ↓
Instant preview
   ↓
UI immediately responsive
   │
   ├── background persistence
   │
   └── atomic detail upgrade
```

Heavy IndexedDB persistence dipisahkan dari click path.

Komponen penting:

-   RAM-first save;
-   instant preview;
-   background persistence;
-   detail atomic upgrade;
-   management list dari RAM;
-   no global render.

**Ringkasan:** V24.1 memisahkan perceived response time dari heavy
persistence tanpa membuang durability.

------------------------------------------------------------------------

# 11. V24.2 --- LOCKED MAP RUNTIME BASELINE

V24.2 menjadi baseline runtime sebelum Map Library.

## Fokus

-   LOW viewport behavior;
-   adaptive rendering;
-   marker behavior;
-   device profile;
-   C1/C2;
-   runtime tile behavior.

Status:

> **V24.2 LOCKED**

Prinsip:

``` text
V24.2 Runtime
      ↓
      🔒
V24.3 management boleh berkembang
tetapi tidak membongkar runtime
```

## Area terlindungi

-   Tile Engine;
-   C1;
-   C2;
-   GeoReference;
-   gesture;
-   marker/GPS;
-   tile identity;
-   tile persistence;
-   Atomic Surface Swap;
-   rendering pipeline;
-   RAM-first save lifecycle.

**Ringkasan:** V24.2 menjadi runtime foundation yang harus diperlakukan
sebagai protected subsystem.

------------------------------------------------------------------------

# 12. V24.3 --- MAP LIBRARY / MAP MANAGEMENT

## 12.1 Masalah sebelum V24.3

Runtime sudah kuat, tetapi management belum menjadi subsystem dengan
boundary yang jelas.

Kondisi:

``` text
backgroundMapsList
activeBackgroundMapId
legacy management
compatibility bridge
IndexedDB
runtime
```

masih saling berdekatan.

Masalah utama:

> **Map Runtime sudah menjadi engine, tetapi pengelolaan koleksi map
> belum sepenuhnya menjadi subsystem Library.**

------------------------------------------------------------------------

## 12.2 Pendekatan V24.3

V24.3 tidak dimulai dengan patch renderer.

Urutan:

``` text
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

------------------------------------------------------------------------

# 13. V24.3 --- OWNERSHIP FINAL

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
        ├── map-library-capability.js
        │
        ▼
IndexedDB / existing lifecycle
        │
        ├── map-package.js
        ├── map-background-lifecycle.js
        └── map-surface-lifecycle.js
```

## Owner

  File                            Owner
  ------------------------------- ----------------------------------------------------
  `map-package.js`                IndexedDB / persisted map storage
  `map-background-lifecycle.js`   activate/deactivate/delete lifecycle
  `map-surface-lifecycle.js`      atomic surface/runtime swap
  `map-management-compat.js`      management UI + compatibility boundary
  `map-library.js`                Library facade + metadata write boundary
  `map-library-contract.js`       contract / validation
  `map-library-capability.js`     query / filter / summary
  `developer-profile.js`          Developer Profile modal
  `map-ui.js`                     legacy compatibility UI; not canonical V24.3 owner
  `peta.js`                       protected runtime/application compatibility

------------------------------------------------------------------------

# 14. V24.3 --- MAP LIBRARY CAPABILITIES

Sudah tersedia:

-   Search map;
-   Sort A--Z / Z--A;
-   Terbaru / Terlama;
-   Active / Inactive;
-   Label filter;
-   Collection filter;
-   Map Info;
-   Rename;
-   Edit Label;
-   Collection metadata;
-   Delete;
-   Active visual state;
-   Inactive visual state;
-   IndexedDB canonical persistence;
-   compatibility cache `backgroundMapsList`.

------------------------------------------------------------------------

# 15. V24.3 --- LABEL ARCHITECTURE

Konsep `Folder` diubah menjadi **Label**.

Label:

-   bukan filesystem folder;
-   bukan Android folder;
-   bukan SD card folder;
-   bukan physical storage location.

Label adalah metadata/tag.

Contoh:

``` text
Map A
  labels: ["Production", "Geology"]

Map B
  labels: ["Survey"]

Map C
  labels: ["Production", "Planning"]
```

Satu map dapat memiliki beberapa Label.

Canonical:

``` text
labels[]
```

Legacy:

``` text
folderName
```

masih readable untuk compatibility.

------------------------------------------------------------------------

# 16. V24.3 --- COLLECTION

Collection menjadi metadata tambahan.

``` text
Map
├── labels[]
└── collectionNames[]
```

Collection tidak membuat IndexedDB store baru.

Tujuannya:

-   grouping;
-   filtering;
-   future package/collection management.

------------------------------------------------------------------------

# 17. V24.3 --- METADATA WRITE BOUNDARY

`MG1MapLibrary.updateMetadata(id, patch)` menjadi boundary untuk
perubahan metadata.

Whitelist:

``` text
name
labels
collectionNames
```

Tidak boleh melalui metadata API:

``` text
tiles
GeoReference
imageDataUrl
tilePyramid
runtime payload
```

Runtime/full-payload writes tetap menggunakan lifecycle/storage owner
masing-masing.

### Arsitektur

``` text
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

**Ringkasan:** metadata dan runtime payload sekarang memiliki jalur
ownership yang berbeda.

------------------------------------------------------------------------

# 18. V24.3 --- ACTIVE / INACTIVE UI

### Active

``` text
subtle emerald card
● AKTIF
```

Tidak ada tombol activate ulang.

### Inactive

``` text
normal navy card
AKTIFKAN
```

Tidak dibuat per-card `DEACTIVATE`.

Nonaktifkan background tetap menggunakan lifecycle existing.

------------------------------------------------------------------------

# 19. V24.3 --- MAP ACTION SHEET

Canonical action sheet:

### Inactive

``` text
Aktifkan Peta
Lihat Info Peta
Edit Nama
Edit Label
Ganti Koleksi
Hapus Peta
```

### Active

``` text
Lihat Info Peta
Edit Nama
Edit Label
Ganti Koleksi
Hapus Peta
```

------------------------------------------------------------------------

# 20. V24.3 --- MAP INFO

Map Info menampilkan:

-   status;
-   ID;
-   jumlah tile level;
-   preview availability;
-   GeoReference availability;
-   last saved timestamp;
-   Lithosite Contact Us slot.

`uploadedBy` tidak digunakan karena authorship tidak diverifikasi.

------------------------------------------------------------------------

# 21. V24.3 --- DUPLICATE UI BUG

## Masalah

Terdapat dua management UI:

``` text
V24.3 canonical Map Library
+
legacy renderMapManagePanel_()
```

Root cause:

``` text
openManageModal()
   ↓
mapManagePanelOpen = true
   ↓
future render()
   ↓
legacy renderMapManagePanel_()
```

## Hardening F1

``` text
openManageModal()
   ↓
mapManagePanelOpen = false
   ↓
canonical modal only
```

`closeManageModal()` juga membersihkan flag.

### File yang berubah

``` text
member-app/scripts/map/map-management-compat.js
```

Tidak berubah:

-   `peta.js`;
-   Tile Engine;
-   C1/C2;
-   GeoReference;
-   IndexedDB schema;
-   tile persistence;
-   Surface Lifecycle.

**Ringkasan:** canonical UI diputus dari legacy render flag sehingga old
UI tidak dapat resurrect melalui global render.

------------------------------------------------------------------------

# 22. V24.3 --- TECHNICAL DEBT YANG DI-LOCK

## 22.1 Active-state multi-writer

Writer berasal dari beberapa generasi:

-   V19;
-   V22;
-   V23;
-   V24.1;
-   V24.3 compatibility;
-   background lifecycle;
-   DB restore;
-   upload/save paths.

**Keputusan:** tidak direfactor incidental.

## 22.2 Atomic failure-path state mismatch

Secara teoritis:

``` text
set active state
   ↓
atomic surface swap
   ↓
FAIL
```

surface lama dapat tetap dipertahankan sementara active state sudah
menunjuk map baru.

**Keputusan:** dedicated transaction refactor diperlukan jika ingin
menyatukan commit boundary.

## 22.3 Collection scalability

Collection saat ini dibatasi agar query/UI tetap ringan.

Bukan blocker.

## 22.4 Contract version marker

Ada housekeeping mismatch internal marker:

``` text
contract: 24.3-s13
capability: 24.3-s14-labels
facade: Slice 14
```

Behavior tidak terpengaruh.

**Keputusan:** maintenance pass terpisah.

------------------------------------------------------------------------

# 23. V24.3 --- VALIDATION RECORD

Final runtime smoke menunjukkan:

-   canonical Map Library tampil;
-   old/duplicate UI tidak muncul;
-   `openMapManagePanel_ overridden - no render()` aktif;
-   Active/Inactive visual state benar;
-   Search/Library bekerja;
-   Map Info bekerja;
-   map kembali ke runtime;
-   atomic surface swap tetap berjalan;
-   `Atomic swap SUCCESS` terlihat;
-   map rendering tetap normal;
-   GeoReference tetap normal;
-   gesture tetap normal;
-   marker tetap normal.

Warning CRS:

``` text
Gagal ambil config CRS dari server, pakai fallback lokal
AbortError: signal is aborted without reason
```

dikategorikan sebagai warning existing dari config/server fallback,
bukan regresi Map Library.

------------------------------------------------------------------------

# 24. V24.3 --- FINAL ARCHITECTURE

### Sebelum

``` text
Member App
   │
   ├── peta.js
   │     ├── runtime
   │     ├── map management
   │     ├── legacy state
   │     └── compatibility
   │
   ├── backgroundMapsList
   ├── activeBackgroundMapId
   └── IndexedDB
```

### Sesudah

``` text
                  MAP MANAGEMENT
                        │
                        ▼
             map-management-compat.js
                        │
                        ▼
                  MG1MapLibrary
                 /      |       \
                /       |        \
          Contract  Capability  Metadata
                \       |        /
                 \      |       /
                  ▼     ▼      ▼
                 IndexedDB Boundary
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   map-package   background-      surface-
                  lifecycle        lifecycle
                                      │
                                      ▼
                              LOCKED MAP RUNTIME
                                      │
                              ┌───────┼───────┐
                              ▼       ▼       ▼
                             C1      C2    Tile Engine
```

### Prinsip

``` text
Management ≠ Runtime
Metadata ≠ Tile Payload
Library ≠ Renderer
Query ≠ Persistence Owner
UI ≠ Surface Lifecycle
```

------------------------------------------------------------------------

# 25. CURRENT SYSTEM BOUNDARY

## Protected Runtime

``` text
V24.2
  ↓
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

Status:

> **LOCKED**

## Management Layer

``` text
V24.3
  ↓
Map Library
Search
Sort
Filter
Label
Collection
Rename
Info
Delete
Active/Inactive
```

Status:

> **FINAL LOCKED**

------------------------------------------------------------------------

# 26. WHAT IS STILL MISSING BEFORE MAP LIFECYCLE IS COMPLETE?

V24.3 sudah menyelesaikan **management/read/metadata layer**, tetapi
lifecycle sebagai subsystem penuh masih memiliki pekerjaan:

1.  **Map State Contract**
2.  **Duplicate / Copy Map**
3.  **Update / Replace Map**
4.  **Failure / Recovery Boundary**
5.  **Lifecycle Regression Test**
6.  **Import / Export Package**
7.  **Package Integrity**
8.  **Storage / Capacity Management**
9.  **Transfer / Sharing**

Tidak semuanya harus masuk satu release.

------------------------------------------------------------------------

# 27. V24.4 --- PLANNED NEXT STAGE

## Name

**Map Lifecycle Completion**

## Scope awal

``` text
Map State Contract
       ↓
Duplicate / Copy
       ↓
Update / Replace
       ↓
Failure / Recovery Boundary
       ↓
Lifecycle Regression
```

### Prinsip V24.4

-   V24.2 runtime tetap protected.
-   V24.3 Library tetap boundary.
-   Tidak patch langsung `peta.js` tanpa kebutuhan terbukti.
-   Duplicate harus menghasilkan ID baru dan payload independen.
-   Update tidak boleh merusak map lama bila proses gagal.
-   Active state harus memiliki aturan yang jelas.
-   Existing technical debt tidak dibongkar incidental.

------------------------------------------------------------------------

# 28. BASELINE & RELEASE GATES

  Baseline         Status             Keputusan
  ---------------- ------------------ --------------------------------------
  V14.15           PASS               Historical frontend/gesture baseline
  V14.22--V14.41   Recorded           Adaptive rendering evolution
  V22              LOCKED             Atomic surface foundation
  V23              LOCKED             Modal/lifecycle isolation
  V24.1            LOCKED             RAM-first save
  V24.2            **LOCKED**         Protected runtime
  V24.3            **FINAL LOCKED**   Map Library / Management
  V24.4            **READY / NEXT**   Map Lifecycle Completion

------------------------------------------------------------------------

# 29. ENGINEERING RULES GOING FORWARD

1.  Setiap versi baru dimulai dengan **cross-file ownership/dependency
    mapping**.
2.  Jangan mengulang audit yang sudah PASS tanpa bukti regresi.
3.  Jangan meminta screenshot setiap frame/click untuk happy path yang
    sudah tervalidasi.
4.  Jangan melakukan tambal-sulam pada `peta.js` bila boundary baru
    dapat dibuat.
5.  Runtime V2/V24.2 tetap protected.
6.  Library feature harus tinggal di Library/Management boundary selama
    memungkinkan.
7.  Runtime payload dan metadata harus memiliki write boundary berbeda.
8.  Technical debt yang sudah ditandai tidak disentuh incidental.
9.  Setiap perubahan cross-file harus memiliki dependency impact record.
10. Jangan menyatakan FINISH sebelum runtime validation sesuai scope.
11. Setiap baseline harus mempunyai dokumen release/lock.
12. Jika behavior belum tervalidasi, statusnya **PENDING**, bukan PASS.

------------------------------------------------------------------------

# 30. DOCUMENT MAINTENANCE FORMAT

Setiap versi baru ditambahkan dengan format berikut:

``` text
## Vxx — NAME

### Technical Issue
### Root Cause
### Before Flow
### Feature / Requirement
### Fix / Implementation
### After Flow
### Before Architecture
### After Architecture
### Files / Ownership
### Data / State Contract
### Validation
### Technical Debt
### Baseline Decision
### Ringkasan
```

Dan pada **MASTER VERSION TABLE**, kolom terakhir selalu:

> **Ringkasan**

------------------------------------------------------------------------

# 31. FINAL CURRENT SUMMARY

**MG1/Lithosite telah berevolusi dari functional mining member app
menjadi offline geospatial runtime, kemudian berkembang menjadi Map
Library/Management subsystem.**

Transformasi arsitektur utamanya:

``` text
V1
Functional Member App
        ↓
V2
Offline Geospatial Runtime
        ↓
V14.22–V14.41
Adaptive Device + C1/C2 Rendering
        ↓
V19
Isolated Map Modal
        ↓
V22
Atomic Surface Lifecycle
        ↓
V23
No-Render Management Lifecycle
        ↓
V24.1
RAM-first / Instant Save
        ↓
V24.2
Protected Runtime Baseline
        ↓
V24.3
Canonical Map Library / Management
        ↓
V24.4
Map Lifecycle Completion
```

**Current final state:**

> **V24.3 --- Map Library / Management: FINAL LOCKED**\
> **V24.2 --- Map Runtime: LOCKED / PROTECTED**\
> **V24.4 --- Map Lifecycle Completion: FUNCTIONALLY COMPLETE / RELEASE CLOSURE**

---

------------------------------------------------------------------------

# 32. V24.4 --- MAP LIFECYCLE COMPLETION

## 32.1 Technical Issue
V24.3 completed the canonical Map Library / Management boundary, but full map lifecycle behavior still required an explicit state contract, Duplicate/Copy, Replace, failure/recovery semantics, and lifecycle regression validation.

## 32.2 Implementation Boundary
V24.4 introduces `map-lifecycle-completion.js` as a narrow orchestration boundary. It does not take ownership of IndexedDB primitives, activation/delete, Atomic Surface implementation, rendering, GeoReference, Tile Engine, C1/C2, or `peta.js`.

## 32.3 Ownership
- `map-lifecycle-completion.js` — lifecycle completion / state observation / Duplicate / Replace boundary.
- `map-management-compat.js` — management UI entry points only.
- `map-package.js` — IndexedDB / persisted map storage.
- `map-background-lifecycle.js` — activate/deactivate/delete.
- `map-surface-lifecycle.js` — atomic surface/runtime swap.
- `map-library.js` — Library facade / metadata writes.
- `peta.js` — protected runtime/application compatibility.

## 32.4 Validation
Runtime evidence confirms:
- Duplicate / Copy — PASS
- New identity — PASS
- Original preservation — PASS
- Replace / Update — PASS
- Same-ID replacement — PASS
- Replacement persistence — PASS
- Hard reload / restore — PASS
- Activate — PASS
- Active-state persistence — PASS
- Delete non-active — PASS
- Delete active — PASS
- Active fallback — PASS
- Reload after active delete — PASS

Static syntax and ZIP integrity checks also PASS. No new V24.4 lifecycle error was observed in the supplied runtime evidence. Console Clean is intentionally not claimed because pre-existing CRS/Validasi AbortError, Tailwind CDN, manifest, and browser tracking-prevention messages remain outside V24.4 scope.

## 32.5 Recovery Boundary
Failure before durable commit leaves the original map untouched. A post-commit surface failure does not invalidate the durable replacement; the existing visible surface may remain temporarily until the runtime surface path completes.

## 32.6 Protected Runtime
V24.2 protected runtime remains unchanged by lifecycle scope: Tile Engine, C1, C2, GeoReference, gesture, marker/GPS, tile identity/persistence algorithm, Atomic Surface implementation, RAM-first save lifecycle, and `peta.js` rendering pipeline.

## 32.7 Baseline Decision
**V24.4 Map Lifecycle Completion — FUNCTIONALLY COMPLETE / RELEASE CLOSURE.**

Import/Export Package, Package Integrity, Storage/Capacity Management, and Transfer/Sharing remain future scope and are not silently included in V24.4.

## 32.8 Ringkasan
V24.4 completes the map lifecycle boundary from state observation through Duplicate, Replace, persistence, activation, deletion, fallback, and reload while preserving the locked V24.2 runtime and final-locked V24.3 management architecture.

---

## V24.5 — Map Package Transfer (S1)

**Status:** S1 IMPLEMENTED / STATIC PASS / RUNTIME PENDING

Starting from the V24.4 LOCKED release, V24.5 introduces a dedicated `map-package-transfer.js` boundary for portable `.mg1map` JSON export/import with SHA-256 integrity verification. Existing IndexedDB primitives remain owned by `map-package.js`; lifecycle, renderer, Tile Engine, C1/C2, GeoReference, and Atomic Surface remain protected.

Import rejects invalid format/schema, failed integrity, invalid entries, and local ID collisions before writes. Multi-map commit uses the existing DB primitive and attempts rollback if a later write fails. Active map identity is device-local and is not imported.

Runtime browser validation is still required before V24.5 can be declared complete/locked.

## V24.5 S1.7 — ID Preflight / Collision Guard

**Status:** FUNCTIONALLY COMPLETE / RUNTIME PASS

S1.7 adds a read-only ID preflight before package integrity work and before any durable write. The preflight checks both the canonical Map Library and the V24.1 RAM-first `backgroundMapsList` cache. Existing IDs are rejected with fast 100% progress, concise Lithosite warning/toast feedback, and zero committed writes. A second collision check remains immediately before commit as a race-condition defense.

Runtime evidence confirms duplicate rejection, valid restore, export/integrity reporting, and preservation of the existing active map. No Tile Engine, C1/C2, GeoReference, Atomic Surface, or V24.4 lifecycle code was changed for this gate.

Known CRS/config `AbortError` remains outside this package-transfer scope; Console Clean is not claimed.

## V24.5 S1.6 — Ringkasan Error/Empty State Layout Hardening

S1.6 memperbaiki presentasi status Ringkasan ketika fetch Digging gagal. Error-state dan empty-state tidak lagi dirender bersamaan. Error banner dibuat full-width dan shrink-safe; empty-state hanya muncul bila fetch sukses tetapi dataset benar-benar kosong. Perubahan dibatasi pada `index.html` dan `scripts/digging.js`; map runtime dan Tile Engine tetap protected.
