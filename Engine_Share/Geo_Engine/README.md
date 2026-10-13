# Geo Engine — Shared Ownership Target

## Tujuan

Folder ini disediakan sebagai tujuan kepemilikan bersama untuk engine geospasial Lithosite dan aturan validasi domain-spasial.

## Existing implementation

Repository saat ini memuat `lithosite-Mine-Geologist/shared/geo-engine.js` dan `lithosite-Mine-Services/shared/geo-engine.js`. Sebelum konsolidasi, harus diperiksa apakah keduanya identik, bagaimana urutan load/import, dan siapa saja pemanggilnya.

## Aturan

- Jangan menghapus, memindahkan, atau mengganti file existing dalam pekerjaan Security Guard tahap pertama.
- Pertahankan tanda tangan fungsi dan hasil numerik yang sudah divalidasi.
- Geo security rules memeriksa validitas input/data, bukan mengganti rumus proyeksi atau keputusan CRS.
- Konsolidasi baru boleh dilakukan sebagai perubahan tersendiri dengan inventory pemanggil dan regression test lintas produk.

## Status

**Reserved / not migrated.** Belum ada engine code yang disalin ke sini.
