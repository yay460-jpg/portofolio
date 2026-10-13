# Lithosite Security Guard Evo 2 — Attack-Surface Matrix

## Status

**Initial inventory — hypotheses to test, not confirmed vulnerabilities.** Matrix ini dibuat dari struktur kode pada baseline V41 terkunci. Setiap gap harus direproduksi dalam tes terisolasi sebelum diberi status temuan.

## Batas keselamatan pengujian

- Gunakan fixture database A.3 sementara dan folder Evidence sementara.
- Jangan menguji mutation, import, restore, upload, atau delete terhadap workbook operasional.
- Jangan mengubah baseline terkunci atau menambahkan endpoint produksi untuk keperluan tes.
- Catat request, respons yang diharapkan, respons aktual, dan regresi yang relevan.

## Matrix awal

| ID | Permukaan | Risiko yang diuji | Kontrol yang terlihat saat inventaris | Validasi yang dibutuhkan | Prioritas awal |
|---|---|---|---|---|---|
| SG-01 | Origin untuk endpoint host | Browser/page asing mencoba mengirim request ke loopback host | Host bind ke 127.0.0.1; ada `is_allowed_origin`; aturan saat ini menerima Origin kosong/`null` serta HTTP localhost/127.0.0.1 pada port apa pun | Uji origin yang diharapkan, Origin asing, null/absent, dan kompatibilitas launcher/dev server; tentukan policy sebelum mengetatkan | Tinggi |
| SG-02 | `POST /runtime` | JSON malformed, ukuran body berlebihan, operasi tidak dikenal, request tanpa field wajib, detail error bocor | Batas ukuran body, JSON object check, Origin check, RuntimeAdapter | Uji ukuran tepi, Content-Type, body parsial, request_id/operation, response sanitization, request ke operasi READ dan mutasi dalam fixture | Tinggi |
| SG-03 | Import/restore/dataset operations | Path keluar dari area yang diizinkan atau perubahan dataset yang tidak disengaja | Operasi diteruskan ke RuntimeAdapter; contract mengharuskan validasi aplikasi dan atomicity | Petakan allowlist path, mode restore, traversal, symlink/junction, rollback dan audit dengan fixture sementara | Tinggi |
| SG-04 | `/evidence/upload` | Nama file/path crafted, file terlalu besar, race/symlink, jenis file palsu, upload ke record yang tidak ada | Allowlist modul, validasi record ID/nama file, ekstensi, limit per file, owner record via adapter, create-exclusive | Uji separator, nama OS-reserved, ukuran batas, payload file tidak cocok, symlink/junction, duplikasi, kegagalan tulis; jangan menulis ke Evidence operasional | Tinggi |
| SG-05 | `/evidence/file`, `/evidence/preview`, `/evidence/list`, `/evidence/status` | Path traversal, akses file di luar Evidence, file terlalu besar, MIME/Content-Disposition tidak tepat | Allowlist module, validasi path/name, containment check, batas ukuran dan sebagian security headers | Uji path traversal encoded, symlink/junction, nama case-variant, ukuran, MIME, header dan error sanitization | Tinggi |
| SG-06 | `POST /report-pdf` | Body malformed/berlebihan dan error detail internal terungkap | Batas body 10 MB; parser JSON; generator PDF | Uji object/list/field ekstrem, ukuran batas, karakter tak terduga, error response tanpa stack/path internal | Menengah |
| SG-07 | Static file serving | Path traversal atau pembacaan database/config/private files | Root containment dan blokir direktori Database serta ekstensi XLSX/XLS/CSV | Uji traversal ter-encode, separator Windows, ekstensi/case variasi, symlink/junction, file di luar root | Tinggi |
| SG-08 | RuntimeAdapter | Envelope malformed, dispatch operasi, exception sanitization, response tidak sengaja mengekspos object internal | Pemeriksaan object/request_id/operation, operation-specific required fields, generic ADP-005 untuk exception | Audit setiap operasi yang bisa mutasi atau akses file; pastikan required fields, allowlist entitas, sanitasi, idempotensi | Tinggi |
| SG-09 | Geo Engine input | NaN/infinity, CRS/zone/hemisphere tidak valid, angka ekstrem, payload spasial rusak | Engine menghitung inverse UTM dan bearing/distance; aturan geospasial merupakan pemilik domain | Petakan semua pemanggil lalu tambahkan uji domain-range tanpa mengubah rumus valid yang sudah PASS | Menengah |
| SG-10 | Topo3D input | File DTM/paket/mesh oversized, jumlah geometri ekstrem, nilai numerik invalid, kehabisan memori/GPU | Topo3D memiliki batas file/paket, vertex, dan triangle | Verifikasi semua parser/import path menggunakan batas itu; uji NaN/infinity, ukuran, count, malformed/truncated input dan cleanup GPU | Tinggi |
| SG-11 | Existing map security | Payload package/tile/image berbahaya atau tidak konsisten | `map-security.js` memeriksa image data URL, tile key, koordinat tile, dan payload | Petakan pemanggil/urutan script; uji payload invalid dan pastikan import ditolak sebelum storage/render | Menengah |
| SG-12 | Error/logging dan resource controls | Informasi lokal sensitif bocor; request berulang menyebabkan resource pressure | Beberapa endpoint mempunyai error code dan size limit; host mencetak request log | Inventaris detail error/log, ukuran seluruh endpoint, concurrent requests; rate limiting perlu disesuaikan untuk host single-user lokal | Menengah |

## Aturan keputusan

1. Status awal semua item adalah **TO VERIFY**.
2. Item berubah menjadi **CONFIRMED** hanya jika ada tes terisolasi yang mereproduksi hasil tidak aman.
3. Patch harus minimal, owner-nya jelas, dan memiliki regression test.
4. Jangan membuat middleware generik yang diam-diam mengubah kontrak payload/hasil engine.
5. Browser Guard menyediakan defense-in-depth; Host Guard, RuntimeAdapter, dan layanan domain tetap otoritatif sesuai batasnya.
6. Setelah setiap patch: jalankan tes terkait, full Pytest, pemeriksaan file ownership/dependency, dan cek bahwa data operasional tidak disentuh.

## Exit gate tahap inventaris

- [ ] Semua endpoint/operasi di host didaftar.
- [ ] Pemilik tiap validasi/path/data dicatat.
- [ ] Tes adversarial untuk SG-01 sampai SG-12 diprioritaskan berdasarkan bukti, bukan asumsi.
- [ ] Runtime, import/restore, Evidence, dan UI existing tidak diubah selama tahap inventaris.
