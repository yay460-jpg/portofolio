# Lithosite 3D Topography

## 1. Tujuan Fitur

3D Topography adalah tampilan topografi 3D pada modul Peta Lithosite
Member. Fitur ini digunakan untuk memvisualisasikan permukaan terrain
berdasarkan pasangan data DTM + STR atau package `.ltdtm`.

Fitur ini berjalan sebagai view yang berdiri sendiri dari Peta Lokasi.
Pergantian antara Peta Lokasi dan 3D Topografi hanya mengubah view yang
terlihat; engine masing-masing tidak menjadi satu lifecycle.

## 2. Arsitektur

Struktur ownership saat ini:

``` text
Peta Host
├── Fixed View Tabs
│   ├── Peta Lokasi
│   └── 3D Topografi
│
├── Peta Lokasi
│   └── Map lifecycle / Map engine
│
└── 3D Topografi
    ├── map-topography.js
    │   └── Member Topo3D UI adapter
    │
    └── shared/topo3d/topo3d-engine.js
        └── Topo3D rendering engine
```

`map-topography.js` menjadi adapter UI/lifecycle untuk Topo3D pada
Member App. Engine rendering berada terpisah di
`shared/topo3d/topo3d-engine.js`.

View switcher adalah controller tampilan bersama. Controller tidak
membuat engine Map atau engine Topo3D baru.

## 3. Sumber Data

3D Topography menerima:

-   pasangan `.dtm` + `.str`;
-   package `.ltdtm`.

Saat pasangan DTM + STR dimuat, engine membaca data secara lokal.

### DTM

Parser mencari bagian `TRISOLATION` pada file DTM dan membaca referensi
triangle.

### STR

Parser membaca record koordinat dan membangun pasangan:

``` text
vertex index → X, Y, Z
```

Triangle dari DTM kemudian direferensikan ke vertex dari STR.

Triangle yang memiliki referensi vertex tidak valid tidak dimasukkan ke
model render.

Jika tidak ditemukan triangle valid, proses load menghasilkan error.

## 4. Import DTM + STR

Alur import:

``` text
Import DTM/STR
      ↓
Validasi pasangan file
      ↓
Baca STR
      ↓
Baca DTM / TRISOLATION
      ↓
Validasi referensi triangle
      ↓
Bangun model geometry
      ↓
Bangun GPU buffers
      ↓
FIT / render
      ↓
3D Topography siap
```

Pembacaan dilakukan secara lokal di browser/WebView.

Status UI menampilkan jumlah triangle setelah data berhasil dimuat.

## 5. Package `.ltdtm`

Package digunakan untuk menyimpan sumber DTM + STR sebagai satu file.

Untuk package Topography V2, struktur konseptualnya:

``` text
LITHODTM
version = 2
manifest
original DTM payload
original STR payload
```

Manifest menyimpan informasi sumber dan checksum SHA-256.

Pada restore:

``` text
.ltdtm
  ↓
validasi header/version/struktur
  ↓
baca manifest
  ↓
ambil DTM payload
  ↓
ambil STR payload
  ↓
hitung SHA-256
  ↓
bandingkan checksum
  ↓
rekonstruksi File DTM + STR
  ↓
parser DTM + STR yang sama
  ↓
bangun ulang geometry
  ↓
3D Topography
```

Checksum yang tidak cocok menyebabkan package ditolak.

Package V2 tidak menggantikan parser DTM + STR. Package hanya menjadi
wadah sumber data dan integrity metadata.

## 6. Save Package

`SAVE PACKAGE` digunakan setelah data DTM + STR berhasil dimuat.

Alurnya:

``` text
DTM + STR
   ↓
Topo3D model siap
   ↓
exportLTDtm()
   ↓
.ltdtm
```

Tombol Save tidak dimaksudkan sebagai export screenshot atau export mesh
visual. Package menyimpan sumber topografi untuk dapat dipulihkan
kembali.

## 7. Restore Package

`RESTORE PACKAGE` menerima file `.ltdtm`.

Setelah package berhasil divalidasi dan DTM + STR direkonstruksi, engine
menjalankan pipeline parser DTM + STR yang sama.

Restore kemudian melakukan resize dan fit agar terrain kembali terlihat
pada viewport.

## 8. Kontrol View

### 3D

Menampilkan terrain menggunakan perspektif 3D.

### TOP

Mengubah kamera ke tampilan top/atas.

### FIT

Mengembalikan orientasi dan zoom ke framing default berdasarkan model
yang tersedia.

### SHADE

Menggunakan mode shaded terrain.

### ELEV

Menggunakan mode elevation. Warna terrain mengikuti rentang elevasi dan
dilengkapi garis kontur pada mode tersebut.

### WIRE

Menampilkan TIN sebagai wireframe.

## 9. Kontrol Visual

### Z

`Z` mengatur vertical exaggeration/elevasi visual.

Rentang UI saat ini:

``` text
0.25 – 2.50
default 1.10
```

Nilai ini memengaruhi skala vertikal visual, bukan mengubah nilai Z
sumber.

### AO

`AO` mengatur kekuatan soft ambient-occlusion/cavity effect.

Rentang UI saat ini:

``` text
0.00 – 0.60
default 0.28
```

### Relief

Slider `RELIEF` mengatur kekuatan efek relief.

Rentang UI saat ini:

``` text
0.00 – 1.50
default 0.10
```

### Gap

`Gap Guard` mengendalikan penyaringan triangle berdasarkan panjang edge
untuk menghindari triangle dengan gap/geometri terlalu besar masuk ke
render list.

Default:

``` text
ON
```

### Mesh

`Mesh` mengaktifkan overlay wireframe di atas terrain.

Default:

``` text
OFF
```

### Relief checkbox

Mengaktifkan atau menonaktifkan efek relief shading.

Default:

``` text
ON
```

### Tint

Mengaktifkan elevation tint tambahan pada shaded rendering.

Default:

``` text
OFF
```

## 10. Rendering Pipeline

Topo3D menggunakan WebGL.

Pipeline utama:

``` text
Parsed DTM + STR
       ↓
raw XYZ + triangle indices
       ↓
geometry audit / metadata
       ↓
Gap Guard filtering
       ↓
GPU buffers
       ↓
normals + AO data
       ↓
vertex/fragment shader
       ↓
terrain rendering
```

Engine menyimpan geometry model dan membangun GPU buffers untuk posisi,
normal, AO, triangle index, dan wireframe index.

Terrain dirender menggunakan depth testing dan perspective projection.

## 11. Elevation Rendering

Mode elevation menggunakan nilai Z model untuk menentukan warna terrain.

Rentang warna mengikuti posisi relatif elevasi:

``` text
lower elevation
    ↓
blue / teal
    ↓
yellow
    ↓
orange / red
higher elevation
```

Mode ini juga dapat menampilkan garis kontur berdasarkan interval
elevasi yang dihitung oleh renderer.

## 12. Shaded Rendering

Mode shaded menggunakan pencahayaan terarah, ambient component,
fill/bounce component, slope cavity dan soft AO.

Tujuannya adalah membuat bentuk terrain terbaca secara visual tanpa
mengubah geometry sumber.

## 13. Wireframe

Mode wire menggunakan edge index dari triangle network.

Wireframe dibangun dari pasangan edge unik sehingga edge yang sama tidak
perlu dibuat berulang.

## 14. Gap Guard

Gap Guard merupakan bagian dari rendering protection.

Engine menghitung batas edge berdasarkan metadata geometry audit dan
menggunakan batas tersebut untuk menentukan triangle yang masuk ke
render list.

Tujuannya adalah mengurangi artefak visual akibat triangle dengan edge
yang terlalu panjang atau gap geometry.

Gap Guard hanya memengaruhi daftar triangle yang dirender; data sumber
DTM/STR tidak dimodifikasi.

## 15. View Lifecycle

Pergantian view:

``` text
Peta Lokasi
    ↕
Fixed View Tabs
    ↕
3D Topografi
```

Saat Topo3D dipilih:

1.  panel Topo3D dibuat/ditampilkan oleh lifecycle adapter;
2.  engine dipersiapkan bila belum siap;
3.  canvas di-resize;
4.  option visual diterapkan;
5.  renderer tetap berjalan.

Saat kembali ke Peta Lokasi:

-   panel Topo3D disembunyikan;
-   engine tidak sengaja dihancurkan hanya karena pergantian tab;
-   Map kembali menjadi view yang terlihat.

Tujuan lifecycle ini adalah menjaga perpindahan view tanpa rebuild
engine yang tidak diperlukan.

## 16. Ownership Contract

Kontrak ownership:

-   `map-ui.js` / Map lifecycle tetap bertanggung jawab atas Peta
    Lokasi.
-   `map-topography.js` bertanggung jawab atas adapter UI dan lifecycle
    Topo3D.
-   `shared/topo3d/topo3d-engine.js` bertanggung jawab atas rendering
    engine.
-   Fixed View Tabs hanya mengontrol visibility dan active state.
-   Tidak boleh dibuat owner Topo3D kedua.
-   Tidak boleh dibuat switcher Peta/Topo kedua.
-   Pergantian tab tidak boleh menjadi alasan untuk destroy/recreate
    engine.

## 17. UI Package Actions

Menu `3D TOPOGRAFI` menyediakan:

``` text
3D TOPOGRAFI
├── IMPORT DTM/STR
├── RESTORE PACKAGE
└── SAVE PACKAGE
```

Menu dapat dibuka dan ditutup tanpa mengubah model terrain.

## 18. UI Advanced Controls

Tombol `•••` mengontrol panel advanced controls:

``` text
Z
AO
RELIEF

Gap
Mesh
Relief
Tint
```

Panel ini hanya mengubah opsi rendering. Data sumber tidak dimodifikasi.

## 19. State dan Reuse

Engine menyimpan state seperti:

-   prepared;
-   ready/model availability;
-   view;
-   mode;
-   geometry metadata;
-   visual rendering options.

Jika engine dan canvas yang sama masih tersedia, adapter dapat
menggunakan instance yang sudah dipersiapkan.

Pembuatan engine baru hanya diperlukan apabila canvas berubah atau
lifecycle memang memerlukan instance baru.

## 20. Error Handling

Kesalahan import/restore dilaporkan melalui status Topo3D.

Contoh kondisi error:

-   canvas tidak tersedia;
-   WebGL tidak tersedia;
-   pasangan DTM + STR tidak lengkap;
-   `TRISOLATION` tidak ditemukan;
-   tidak ada triangle valid;
-   struktur package tidak valid;
-   checksum DTM tidak cocok;
-   checksum STR tidak cocok.

Error tidak boleh dianggap sebagai keberhasilan load.

## 21. Batasan Fitur

Dokumen ini hanya mendeskripsikan fitur yang saat ini didukung oleh
source Topo3D.

Tidak dinyatakan di sini sebagai fitur yang sudah tersedia:

-   editing geometry DTM;
-   editing triangle;
-   export CAD;
-   GIS layer editing di dalam Topo3D;
-   server/cloud terrain processing;
-   perubahan koordinat sumber;
-   perubahan nilai elevasi sumber.

## 22. Integrasi Dengan Peta Lokasi

Peta Lokasi dan 3D Topography merupakan dua view pada host Peta yang
sama:

``` text
Peta Lokasi
    └── Map data / map engine

3D Topography
    └── DTM + STR / Topo3D engine
```

Keduanya tidak diperlakukan sebagai satu renderer.

Shared component hanya:

``` text
Fixed View Tabs
```

Hal ini menjaga isolasi lifecycle dan mengurangi risiko perubahan pada
Topo3D mengganggu Tile Engine atau Map Library.

## 23. Kontrak Yang Tidak Boleh Rusak

Perubahan berikut harus dianggap locked ketika mengembangkan fitur
berikutnya:

1.  Save/Restore package V2.
2.  Integrity SHA-256 DTM dan STR.
3.  DTM + STR parser.
4.  Topo3D rendering engine.
5.  Map Tile Engine.
6.  Map Library lifecycle.
7.  Fixed Peta/3D view tabs.
8.  Separate Map dan Topo3D ownership.
9.  Tidak ada duplicate view switcher.
10. Pergantian view tidak melakukan rebuild yang tidak diperlukan.

## 24. Dokumentasi Evolusi

Dokumen ini merupakan dokumentasi global fitur 3D Topography.

Catatan perubahan implementasi per tahap sebaiknya disimpan pada
dokumentasi history/baseline terpisah, bukan dengan menambahkan nomor
versi ke nama dokumen global ini.

## 25. Status Fitur

Berdasarkan source dan pengujian UI yang telah dilakukan pada baseline
saat ini:

-   Peta Lokasi ↔ 3D Topografi: PASS
-   Fixed View Tabs: PASS
-   Import DTM + STR: tersedia
-   Restore `.ltdtm`: tersedia
-   Save `.ltdtm`: tersedia
-   3D / TOP / FIT: tersedia
-   SHADE / ELEV / WIRE: tersedia
-   Z / AO / Relief: tersedia
-   Gap / Mesh / Relief / Tint: tersedia
-   Package actions collapse/expand: tersedia
-   Advanced controls collapse/expand: tersedia
-   Map dan Topo3D ownership separation: PASS

Status implementasi tetap harus divalidasi kembali setelah perubahan
source berikutnya.
