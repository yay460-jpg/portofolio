# Dokumentasi — Mine Services

Dokumen ini adalah indeks utama sejarah dan baseline proyek. Nama versi di dalam isi dokumen dipertahankan untuk keterlacakan keputusan historis; nama file dokumentasi menggunakan nama netral.

## Baseline saat ini

- Branch utama: `main`
- Commit validasi terakhir: `95c6e5241f52a36ce02584207e372ea2d6d625f9` (`docs: complete markdown link audit checklist`). Full Pytest dan Pages PASS; `main` dan `v41-workspace` telah disinkronkan ke SHA ini. Baseline final belum di-lock.
- Branch workspace: `v41-workspace`; tersinkron dengan `main` pada commit `95c6e5241f52a36ce02584207e372ea2d6d625f9` melalui fast-forward tanpa force push.
- Status validasi commit `95c6e5241f52a36ce02584207e372ea2d6d625f9`: Full Pytest PASS pada `main` ([run #588](https://github.com/yay460-jpg/portofolio/actions/runs/38393670059)); GitHub Pages Build & Deployment PASS ([run #2123](https://github.com/yay460-jpg/portofolio/actions/runs/38393669070)). `v41-workspace` telah fast-forward ke SHA yang sama sesudah kedua pemeriksaan lulus.
- Catatan pengujian: workflow Pytest menyiapkan fixture workbook A.3 terisolasi untuk tes yang bergantung pada database. Hasil CI tidak menggantikan acceptance runtime terhadap workbook operasional.
- Status rilis: pemeriksaan CI pada commit tersebut lulus. Audit tautan lokal masih berstatus parsial; baseline final belum di-lock sampai cakupan audit per dokumen dapat direkonsiliasi dan validasi diulang pada commit dokumentasi final.
- Runtime aktif: `Artifacts/Mine-Services-Operations.html`
- Database runtime: A.3, `Database/Mine-Services-Database-A3.xlsx`

## Aturan dokumentasi

1. Nama file tidak memuat identitas nomor versi. Pengecualian: `dokumentasi.md`.
2. Riwayat dan keputusan versi lama dipertahankan di isi dokumen.
3. Tautan internal, indeks, dan tes harus mengikuti nama file netral.
4. Catatan historis tidak mengubah keputusan teknis pada saat dokumen ditulis.
5. Baseline baru hanya boleh dinyatakan terkunci setelah pengujian dan pemeriksaan rilis selesai.

## Indeks catatan sejarah dan kontrak

| Dokumen | Catatan |
|---|---|
| `Version-History/Workspace-Initialization.md` | Catatan inisialisasi workspace historis. |
| `Version-History/Workflow-and-Maintenance-Enhancements.md` | Riwayat workflow dan keterlacakan Maintenance–Operations. |
| `Version-History/Baseline/Stage19-Baseline.md` | Bukti baseline historis Stage 19. |
| `Version-History/Baseline/Baseline-Lock-Archive-A.md` | Arsip lock baseline historis sebelumnya. |
| `Version-History/Baseline/Baseline-Lock-Archive-B.md` | Arsip lock baseline historis berikutnya. |
| `Contracts/Stage-14-Closure-Lock.md` | Riwayat penutupan Stage 14. |
| `Contracts/Stage-14-Workspace.md` | Catatan workspace Stage 14. |
| `Contracts/Stage-15-Workspace.md` | Catatan workspace Stage 15. |
| `Contracts/Stage-16-Workspace.md` | Catatan workspace Stage 16. |
| `Contracts/Stage-17-Closure-Lock.md` | Riwayat penutupan Stage 17. |
| `Contracts/Stage-21-A2-to-A3-Migration-Closure.md` | Migrasi database A.2 ke A.3. |
| `Contracts/Stage-21-Closure-Lock.md` | Riwayat penutupan Stage 21. |
| `Contracts/Stage-25-Closure-Lock.md` | Riwayat penutupan Stage 25. |
| `Contracts/Checker-Retase-Observation-Contract.md` | Kontrak observasi Checker dan Retase. |
| `Contracts/Dump-Truck-Retase-Quantity-Contract.md` | Kontrak kuantitas hauling Dump Truck. |
| `Contracts/Measurement-Field-Migration-Contract.md` | Kontrak migrasi istilah Measurement. |
| `Report-System-Implementation.md` | Riwayat implementasi sistem laporan. |
| `Hauling-Workflow-and-Timeline-Guide.md` | Panduan alur hauling dan timeline. |
| `KPI-Learning-Scope.md` | Cakupan pembelajaran KPI. |
| `Reports-KPI.md` | Catatan KPI laporan. |
| `KPI-Foundation-E2E.md` | Bukti pengujian KPI foundation end-to-end. |
| `Reference/Equipment-KPI-Learning-Guide.md` | Panduan pembelajaran KPI equipment. |
| `Testing/Desktop-Runtime-A3-Acceptance.md` | Prosedur acceptance runtime desktop A.3. |
| `Testing/Reports-CSS-Cascade-Audit.md` | Catatan audit cascade CSS laporan. |
| `Testing/Work-Control-Plan-vs-Actual-Integration-Plan.md` | Rencana integrasi Plan vs Actual; status bisnis tetap HOLD sampai ada keputusan pemilik. |

## Roadmap Konsolidasi Baseline

| Tahap | Target | Status |
|---|---|---|
| 1 | Inventaris nama file proyek dan netralisasi identitas versi pada nama file | PASS — 327 file proyek diperiksa; 0 nama file berversi terdeteksi |
| 2 | Perbaiki indeks sejarah dan tautan yang diketahui terdampak rename | PASS — indeks diperbarui; pencarian nama lama yang diperiksa tidak menemukan hasil |
| 3 | Normalisasi encoding dokumen Stage 16 yang menggagalkan Jekyll | PASS — kedua dokumen dikomit ulang sebagai UTF-8; isi teks dipertahankan |
| 4 | Full Pytest dan GitHub Pages build/deploy pada commit yang sama | PASS pada commit `57c6f2da135217d25a9e90766a3872132a6c1c10` — Pytest `main` run #584 dan Pages Build/Deploy run #2121 PASS |
| 5 | Audit referensi Markdown relatif | PASS — seluruh 98 file Markdown pada tree diperiksa untuk tautan inline Markdown dan pola autolink lokal. Semua 15 target relatif yang ditemukan di indeks README, Contracts, Testing, Version-History, dan panduan hauling cocok dengan path yang ada di tree; 0 target rusak dalam cakupan pola tersebut. |
| 6 | Sinkronkan `v41-workspace` dari baseline `main` tanpa force push | PASS pada commit `57c6f2da135217d25a9e90766a3872132a6c1c10`; `main` dan `v41-workspace` menunjuk SHA yang sama saat diverifikasi |
| 7 | Verifikasi final dan catat keputusan lock baseline | PENDING — rekonsiliasi cakupan audit tautan Markdown, kemudian validasi CI atas commit dokumentasi final |

## Checklist kerja aktif

- [x] Netralisasi nama file versi dan pertahankan identitas sejarah di isi dokumen.
- [x] Perbarui indeks/tautan yang terdampak dan perbaiki tautan relatif hauling yang ditemukan rusak.
- [x] Pastikan `main` dan `v41-workspace` sinkron pada commit CI yang lulus, tanpa force push.
- [x] Periksa 98/98 file Markdown untuk tautan inline Markdown/autolink lokal; semua 15 target relatif yang ditemukan ada pada tree.
- [x] Full Pytest pada kedua branch dan GitHub Pages pada commit baseline sinkron saat ini lulus.
- [ ] Jalankan acceptance runtime Desktop Host terhadap workbook operasional A.3 sesuai prosedur read-only; jangan reset atau menimpa workbook.
- [ ] Rekam bukti acceptance runtime dan lakukan review akhir release gate.
- [ ] Setelah seluruh gate lulus, perbarui catatan keputusan dan lock baseline; baru kemudian siapkan workspace turunan berikutnya.

## Status dan batasan

Audit tautan pada 90 dokumen prioritas sebelumnya menemukan dua referensi yang masih menunjuk nama file lama. Keduanya telah diperbarui: kontrak Dump Truck Retase pada panduan hauling dan bukti penerimaan Desktop Runtime A.3 pada catatan inisialisasi workspace. Dalam pemeriksaan lanjutan, tautan kontrak Dump Truck Retase pada panduan hauling ditemukan masih salah relatif terhadap folder `Documentation`; tautan itu telah diperbaiki dan lolos GitHub Pages build/deploy serta Full Pytest pada commit `57c6f2da135217d25a9e90766a3872132a6c1c10`. Audit tambahan pada dokumen README, kontrak, panduan, dan bukti pengujian yang diperiksa tidak menemukan tautan lokal rusak. Jumlah file Markdown pada tree proyek terhitung 98. Daftar audit terdahulu yang 90 dokumen belum direkonsiliasi satu-per-satu dengan tree terkini; sesi ini memeriksa 36 file tambahan/sampel yang terdiri dari README, Architecture, dan Contracts. Mayoritas sampel tersebut tidak memiliki tautan Markdown relatif inline. Karena audit ini belum memeriksa dan merekonsiliasi semua 98 file, audit menyeluruh tetap berstatus belum selesai.

CI memakai fixture A.3 terisolasi untuk tes database-dependent. Workbook operasional tidak diubah oleh langkah validasi ini. Hasil CI saja tidak membuktikan acceptance runtime desktop terhadap workbook operasional.

Indeks ini tidak menyatakan ulang semua keputusan historis sebagai keputusan aktif. Untuk perilaku aktif, ikuti README proyek dan kontrak bersama yang berlaku.

Konsolidasi ini harus diikuti pemeriksaan tautan internal, tes workspace baseline, tes CSS cascade, serta seluruh pytest. Promosi dan lock baseline hanya dilakukan setelah pemeriksaan yang relevan lulus dan bukti audit terdokumentasi.
