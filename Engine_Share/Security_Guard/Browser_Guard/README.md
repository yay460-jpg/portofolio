# Browser Guard

## Scope

Defense-in-depth di sisi browser untuk input pengguna, payload yang diimpor, pemrosesan file, dan rendering data.

## Kontrol yang akan dinilai

- Gunakan sink DOM yang aman; hindari memasukkan data tidak tepercaya melalui `innerHTML` tanpa sanitasi yang tepat.
- Batas ukuran/jenis data sebelum parsing file atau membuat object URL.
- Validasi struktur payload dengan batas jumlah item, dimensi, dan kedalaman.
- Jangan menyimpan token/rahasia yang memberi otoritas backend di JavaScript.
- Jangan menganggap hasil Browser Guard sebagai bukti bahwa request aman untuk backend.

## Kepemilikan existing

Lithosite Mine Geologist sudah memiliki `member-app/scripts/map/map-security.js`. File itu tetap dipertahankan sebagai kontrol existing hingga call-site, ekspor global, dan tesnya dipetakan. Jangan langsung memindahkan atau mengganti nama file tersebut.

## Status

Belum ada implementasi baru pada tahap scaffold ini. Temuan konkret dan regression test harus mendahului patch.
