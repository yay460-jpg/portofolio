# Host Guard — Evo 2

## Scope

Penjagaan otoritatif pada batas HTTP/proses: pemeriksaan request, Origin, parsing JSON, ukuran body, path/file, error response, dan akses terhadap operasi runtime.

## Pemilik existing

Mine Services saat ini memakai `lithosite-Mine-Services/desktop-host/server.py`, yang bind ke `127.0.0.1`, memiliki aturan Origin, endpoint Evidence, static-file guard, batas ukuran di beberapa endpoint, dan meneruskan operasi runtime ke `RuntimeAdapter`.

Kontrol tersebut harus diuji sebelum dirapikan. Jangan menganggap setiap dugaan sebagai kerentanan sampai ada reproduksi tes.

## Batas otoritas

- Request mutasi harus melalui RuntimeAdapter dan layanan domain terkait.
- Host tidak boleh membuka jalur langsung ke repository/persistence untuk UI.
- Origin check tidak sama dengan autentikasi caller lokal.
- Port loopback tidak boleh diasumsikan melindungi dari semua proses lokal atau seluruh skenario browser-to-loopback.
- Perubahan limit atau aturan Origin harus mempertimbangkan launcher, Live Server development, dan runtime resmi.

## Status

Tahap Evo 2 sekarang adalah audit dan pembuatan attack-surface matrix. Belum ada perubahan pada `server.py` atau konfigurasi operasi.
