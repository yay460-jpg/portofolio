# Topo3D Engine — Shared Ownership Target

## Tujuan

Folder ini disediakan sebagai tujuan kepemilikan bersama untuk engine topografi 3D Lithosite dan aturan keamanan paket DTM/mesh.

## Existing implementation

Repository saat ini memuat `lithosite-Mine-Geologist/shared/topo3d/topo3d-engine.js` dan `lithosite-Mine-Services/shared/topo3d/topo3d-engine.js`. Keduanya tidak boleh diganti atau dipindahkan sebelum pemeriksaan kesetaraan file, urutan load/import, pemilik API, dan semua pemanggil selesai.

## Aturan

- Pertahankan batas resource yang sudah ada sampai seluruh jalur parsing terbukti memakainya.
- Jangan mengubah shader, geometri, rendering, atau UX dalam pekerjaan Security Guard tahap pertama.
- Security rules memvalidasi ukuran, count, dan nilai input sebelum alokasi resource; tidak mengubah perilaku visual engine.
- Konsolidasi engine dilakukan di tahap terpisah dengan regression test lintas produk.

## Status

**Reserved / not migrated.** Belum ada engine code yang disalin ke sini.
