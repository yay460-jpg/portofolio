# Dokumentasi — Mine Services

Dokumen ini adalah indeks utama sejarah dan baseline proyek. Nama versi di dalam isi dokumen dipertahankan untuk keterlacakan keputusan historis; nama file dokumentasi menggunakan nama netral.

## Baseline saat ini

- Branch kerja: `v41-workspace`
- Commit dasar sebelum konsolidasi: `fce3f696442b1d635ec0a851691213acb9499add`
- Status: konsolidasi nama file dan referensi; belum menjadi lock rilis baru.
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

## Status dan batasan

Indeks ini tidak menyatakan ulang semua keputusan historis sebagai keputusan aktif. Untuk perilaku aktif, ikuti README proyek dan kontrak bersama yang berlaku.

Konsolidasi ini harus diikuti pemeriksaan tautan internal, tes workspace baseline, tes CSS cascade, serta seluruh pytest. Promosi ke `main` dan lock baseline hanya dilakukan setelah pemeriksaan tersebut lulus.
