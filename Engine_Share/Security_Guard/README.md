# Lithosite Security Guard

## Misi

Menerapkan aturan keamanan bersama lintas produk Lithosite tanpa menyatukan seluruh validasi domain ke dalam satu modul dan tanpa membuat browser sebagai otoritas keamanan.

## Lapisan pemilik

- `Browser_Guard/`: validasi awal input/payload, batas pemrosesan file pada browser, dan pola rendering aman. Seluruh kontrol browser dianggap dapat dilewati dan tidak menggantikan backend guard.
- `Host_Guard/`: kebijakan request HTTP, Origin, ukuran body, parsing, batas path/file, dan respons error aman pada host.
- `../Geo_Engine/`: validasi domain geospasial tetap dimiliki engine Geo.
- `../Topo_Engine/`: validasi DTM, mesh, dan biaya sumber daya tetap dimiliki engine Topo3D.
- Mine Services `RuntimeAdapter`, `ValidationEngine`, `TransactionManager`, persistence, dan audit tetap menjadi batas otoritatif untuk data operasional.

## Prinsip

1. Deny by default untuk endpoint/operasi yang tidak dikenal.
2. Validasi request dan batas sumber daya sebelum parsing/operasi mahal jika memungkinkan.
3. Jangan mengembalikan stack trace, path privat, atau detail internal runtime kepada caller.
4. Jangan mengandalkan ekstensi file atau Origin saja sebagai satu-satunya kontrol.
5. Semua tes adversarial berjalan memakai database dan direktori sementara; jangan menulis ke workbook operasional A.3.
6. Setiap perubahan memiliki regression test dan pemilik yang jelas.
7. Kontrol yang sudah ada dipertahankan sampai pengganti teruji.

## Tahap kerja

1. Petakan attack surface dan ownership — dokumentasi/analisis saja.
2. Buat tes reproduksi terisolasi untuk setiap gap terverifikasi.
3. Implementasikan kontrol terkecil yang menutup gap.
4. Jalankan tes terarah dan seluruh regression suite.
5. Audit efek samping dan dokumentasikan PASS atau HOLD.

## Bukan tujuan

- Membuat autentikasi semu yang tidak terikat pada threat model.
- Memindahkan logika bisnis dari RuntimeAdapter/ValidationEngine.
- Menganggap CSS sebagai kontrol keamanan.
- Mengubah Geo Engine atau Topo3D Engine pada tahap pertama.
