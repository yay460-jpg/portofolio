# Engine Share — Lithosite

## Tujuan

Folder root bersama ini menjadi tempat kepemilikan bersama lintas produk Lithosite. Ia berada sejajar dengan `lithosite-Mine-Geologist/` dan `lithosite-Mine-Services/`, bukan di dalam salah satu produk.

## Struktur

- `Security_Guard/` — kontrak keamanan global, pembagian tanggung jawab browser/host, matriks attack surface, serta bukti tes keamanan.
- `Geo_Engine/` — tujuan konsolidasi engine geospasial bersama dan aturan validasi spasial khusus.
- `Topo_Engine/` — tujuan konsolidasi engine topografi 3D dan aturan validasi DTM/mesh khusus.

## Aturan kepemilikan

1. Security Guard menyediakan kebijakan dan kontrol generik; validasi domain tetap berada pada pemilik data/runtime.
2. Browser Guard adalah defense-in-depth, bukan otoritas untuk mengizinkan perubahan data.
3. Host Guard dan RuntimeAdapter menjadi penjaga otoritatif untuk operasi backend.
4. Geo dan Topo3D mempertahankan validasi khusus domain yang tidak dapat digantikan oleh aturan generik.
5. Jangan pindahkan, menggandakan, atau mengganti engine existing sebelum inventaris seluruh pemanggil, kontrak, dan regression test selesai.
6. Perubahan lintas produk harus mengacu pada baseline terkunci, diuji di workspace, dan mencatat pemilik file/dependensi.

## Status awal

Struktur ini adalah scaffold arsitektur dan dokumentasi; belum ada runtime engine yang dipindahkan atau perilaku produk yang diubah. Pekerjaan aktif dimulai dari Security Guard. Geo_Engine dan Topo_Engine disiapkan sebagai tempat kepemilikan masa depan, bukan salinan baru dari engine yang sudah ada.
