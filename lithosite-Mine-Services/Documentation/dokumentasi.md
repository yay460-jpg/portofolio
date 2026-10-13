# Dokumentasi — Mine Services

Dokumen ini adalah indeks utama sejarah dan baseline proyek. Nama versi di dalam isi dokumen dipertahankan untuk keterlacakan keputusan historis; nama file dokumentasi menggunakan nama netral.

## Baseline saat ini

- Branch utama: `main`
- Commit dokumentasi terbaru: `76442b67ad116af566eff16d24c4af1a07af6c9b` (`docs: restore report implementation markdown line breaks`).
- Branch workspace: `v41-workspace`; saat verifikasi terakhir, branch ini tersinkron dengan `main` pada commit yang sama melalui fast-forward tanpa force push.
- Status validasi commit tersebut: Full Pytest PASS pada `main` dan `v41-workspace`; GitHub Pages Build & Deployment PASS pada `main`.
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
| 4 | Full Pytest dan GitHub Pages build/deploy pada commit yang sama | PASS pada commit `76442b67ad116af566eff16d24c4af1a07af6c9b` — Pytest `main`, Pytest `v41-workspace`, dan Pages Build/Deploy `main` semuanya PASS |
| 5 | Audit referensi Markdown relatif | PARTIAL PASS — 90 dokumen telah diperiksa dalam audit terdahulu; dokumen tambahan yang diperiksa terhadap tree repository tidak menunjukkan tautan lokal rusak. Belum diklaim seluruh 98 dokumen selesai sampai matriks cakupan per dokumen direkonsiliasi. |
| 6 | Sinkronkan `v41-workspace` dari baseline `main` tanpa force push | PASS pada commit `76442b67ad116af566eff16d24c4af1a07af6c9b`; kedua branch menunjuk SHA yang sama saat diverifikasi |
| 7 | Verifikasi final dan catat keputusan lock baseline | PENDING — rekonsiliasi cakupan audit tautan Markdown, kemudian validasi CI atas commit dokumentasi final |

## Status dan batasan

Audit tautan pada 90 dokumen prioritas sebelumnya menemukan dua referensi yang masih menunjuk nama file lama. Keduanya telah diperbarui: kontrak Dump Truck Retase pada panduan hauling dan bukti penerimaan Desktop Runtime A.3 pada catatan inisialisasi workspace. Audit tambahan pada dokumen README, kontrak, panduan, dan bukti pengujian yang diperiksa tidak menemukan tautan lokal rusak. Jumlah file Markdown pada tree proyek sebelumnya terhitung 98; karena daftar per-dokumen yang diperiksa belum direkonsiliasi menjadi matriks cakupan lengkap, audit menyeluruh tetap berstatus belum selesai.

CI memakai fixture A.3 terisolasi untuk tes database-dependent. Workbook operasional tidak diubah oleh langkah validasi ini. Hasil CI saja tidak membuktikan acceptance runtime desktop terhadap workbook operasional.

Indeks ini tidak menyatakan ulang semua keputusan historis sebagai keputusan aktif. Untuk perilaku aktif, ikuti README proyek dan kontrak bersama yang berlaku.

Konsolidasi ini harus diikuti pemeriksaan tautan internal, tes workspace baseline, tes CSS cascade, serta seluruh pytest. Promosi dan lock baseline hanya dilakukan setelah pemeriksaan yang relevan lulus dan bukti audit terdokumentasi.
