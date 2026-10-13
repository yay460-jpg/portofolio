# Engine Share — Lithosite

## Tujuan

Folder root bersama ini menjadi tempat kepemilikan bersama lintas produk Lithosite. Ia berada sejajar dengan `lithosite-Mine-Geologist/` dan `lithosite-Mine-Services/`, bukan di dalam salah satu produk.

## Struktur

- `Security_Guard/` — kontrak keamanan global, pembagian tanggung jawab browser/host, matriks attack surface, roadmap Evo 2, serta bukti tes keamanan.
- `Geo_Engine/` — tujuan konsolidasi engine geospasial bersama dan aturan validasi spasial khusus.
- `Topo_Engine/` — tujuan konsolidasi engine topografi 3D bersama dan aturan validasi DTM/mesh khusus.

## Nomenklatur Security Evolution

- **Security Evolution 1 (Evo 1):** hardening historis yang sudah diterapkan pada permukaan keamanan aplikasi yang ada, termasuk audit batas keamanan, XSS, batas sumber daya, dependency, dan session pada track Mine Geologist.
- **Security Evolution 2 (Evo 2):** arsitektur keamanan global lintas produk/runtime Lithosite dengan kebijakan bersama serta guard yang spesifik pada batas browser, host, Geo, dan Topo3D.

Evo 2 memperluas dan mengoordinasikan prinsip Evo 1. Evo 2 tidak menghapus, mengganti, atau mengklaim ulang kontrol historis yang sudah terkunci. Status implementasi baru hanya boleh dinyatakan PASS/LOCKED setelah bukti tes yang sesuai tersedia.

## Aturan kepemilikan

1. Security Guard menyediakan kebijakan dan kontrol generik; validasi domain tetap berada pada pemilik data/runtime.
2. Browser Guard adalah defense-in-depth, bukan otoritas untuk mengizinkan perubahan data.
3. Host Guard dan RuntimeAdapter menjadi penjaga otoritatif untuk operasi backend.
4. Geo dan Topo3D mempertahankan validasi khusus domain yang tidak dapat digantikan oleh aturan generik.
5. Jangan pindahkan, menggandakan, atau mengganti engine existing sebelum inventaris seluruh pemanggil, kontrak, dan regression test selesai.
6. Perubahan lintas produk harus mengacu pada baseline terkunci, diuji di workspace, dan mencatat pemilik file/dependensi.

## Status awal

Struktur ini adalah scaffold arsitektur dan dokumentasi; belum ada runtime engine yang dipindahkan atau perilaku produk yang diubah. Pekerjaan aktif dimulai dari Security Guard Evo 2. Geo_Engine dan Topo_Engine disiapkan sebagai tempat kepemilikan masa depan, bukan salinan baru dari engine yang sudah ada.
