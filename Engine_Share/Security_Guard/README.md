# Lithosite Security Guard — Security Evolution 2

## Misi

Evo 2 menerapkan aturan keamanan bersama lintas produk Lithosite tanpa menyatukan seluruh validasi domain ke satu modul dan tanpa membuat browser sebagai otoritas keamanan.

## Hubungan dengan Evo 1

Evo 1 adalah track hardening historis yang sudah mencatat audit batas keamanan, hardening XSS, batas sumber daya, dependency, dan session. Evo 2 tidak mengulang atau membatalkan kontrol tersebut; Evo 2 mengaudit kontrol yang sudah ada, menyelaraskan kebijakan yang memang generik, dan menambah kontrol hanya jika ada gap yang dibuktikan oleh tes.

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
8. Pengetatan Origin, ukuran request, dan akses lokal tidak boleh dilakukan tanpa menguji kompatibilitas launcher/runtime dan skenario browser yang didukung.

## Tahap kerja

1. Petakan attack surface dan ownership — dokumentasi/analisis saja.
2. Buat tes reproduksi terisolasi untuk setiap gap terverifikasi.
3. Implementasikan kontrol terkecil yang menutup gap.
4. Jalankan tes terarah dan seluruh regression suite.
5. Audit efek samping dan dokumentasikan PASS atau HOLD.

Roadmap terperinci: [Security Evolution 2 Roadmap](Security-Evolution-2-Roadmap.md). Daftar permukaan awal: [Attack-Surface Matrix](Attack-Surface-Matrix.md).

## Bukan tujuan

- Membuat autentikasi semu yang tidak terikat pada threat model.
- Memindahkan logika bisnis dari RuntimeAdapter/ValidationEngine.
- Menganggap CSS sebagai kontrol keamanan.
- Mengubah Geo Engine atau Topo3D Engine pada tahap pertama.
- Mengklaim gap sebagai kerentanan terkonfirmasi sebelum ada reproduksi tes.
