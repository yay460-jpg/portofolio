# Dokumentasi — Mine Services

Dokumen ini adalah indeks utama sejarah dan baseline proyek. Nama versi di dalam isi dokumen dipertahankan untuk keterlacakan keputusan historis; nama file dokumentasi menggunakan nama netral.

## Baseline saat ini

- Branch utama: `main`
- Commit kandidat baseline: `88fff603e3890227bcf9c755d0c663aa58b1172c` (`docs: record A3 runtime smoke test pass and next gate`). Full Pytest #596 dan Pages #2127 PASS; acceptance runtime read-only A.3 PASS berdasarkan bukti pengguna. `v41-workspace` telah fast-forward ke commit kandidat ini tanpa force push. Status lock final menunggu commit pencatatan sinkronisasi/release gate ini lulus CI.
- Branch workspace: `v41-workspace`; telah fast-forward ke commit kandidat `88fff603e3890227bcf9c755d0c663aa58b1172c` setelah Full Pytest dan Pages pada kandidat tersebut lulus.
- Status validasi commit kandidat `88fff603e3890227bcf9c755d0c663aa58b1172c`: Full Pytest #596 PASS ([run](https://github.com/yay460-jpg/portofolio/actions/runs/38400979456)); GitHub Pages #2127 PASS ([run](https://github.com/yay460-jpg/portofolio/actions/runs/38400978338)). `v41-workspace` kemudian fast-forward ke kandidat ini.
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
| 4 | Full Pytest dan GitHub Pages build/deploy pada commit yang sama | PASS pada commit `edfddab769636c69cd7b461cb8f8ff6cf961fe35` — Pytest #594, Pages #2126, dan Pytest `v41-workspace` PASS |
| 5 | Audit referensi Markdown relatif | PASS — seluruh 98 file Markdown pada tree diperiksa untuk tautan inline Markdown dan pola autolink lokal. Semua 15 target relatif yang ditemukan di indeks README, Contracts, Testing, Version-History, dan panduan hauling cocok dengan path yang ada di tree; 0 target rusak dalam cakupan pola tersebut. |
| 6 | Sinkronkan `v41-workspace` dari baseline `main` tanpa force push | PASS pada `edfddab769636c69cd7b461cb8f8ff6cf961fe35`; fast-forward tanpa force push |
| 7 | Acceptance runtime Desktop Host A.3 (workbook integrity, health, modul, dialog, Console) | PASS berdasarkan bukti lokal yang dilaporkan pengguna; pemeriksaan read-only, tanpa menyimpan perubahan. Gate tulis/persistence tidak dijalankan dan dicatat tidak dilakukan. |
| 8 | Verifikasi final release gate dan lock baseline | Hampir selesai — semua gate fungsional/CI kandidat PASS dan branch tersinkron. Validasi CI pada commit pencatatan final ini masih menjadi syarat terakhir; setelah PASS, SHA commit ini menjadi baseline lock.

## Checklist kerja aktif

- [x] Netralisasi nama file versi dan pertahankan identitas sejarah di isi dokumen.
- [x] Perbarui indeks/tautan yang terdampak dan perbaiki tautan relatif hauling yang ditemukan rusak.
- [x] Pastikan `main` dan `v41-workspace` sinkron pada commit CI yang lulus, tanpa force push.
- [x] Periksa 98/98 file Markdown untuk tautan inline Markdown/autolink lokal; semua 15 target relatif yang ditemukan ada pada tree.
- [x] Full Pytest pada kedua branch dan GitHub Pages pada commit baseline sinkron saat ini lulus.
- [x] Periksa integritas ZIP workbook operasional A.3 secara read-only — pengguna melaporkan `Workbook ZIP integrity: PASS`; tidak ada mutasi workbook pada langkah ini.
- [x] Jalankan health check dan smoke test read-only Desktop Host terhadap workbook operasional A.3; tidak ada perubahan data yang disimpan.
- [x] Health check Desktop Host — `status = READY`, `offline = true`, `schema = A.3`, `runtime = RuntimeAdapter`; database path mengarah ke workbook operasional A.3 lokal.
- [x] Smoke test Dashboard/Work Control, Equipment, Work Front, Operations, Target Plan, Reports, dialog Add Operation/Add Work Front, dan Console — seluruhnya PASS berdasarkan hasil yang dilaporkan pengguna.
- [x] Rekam hasil smoke test modul dan Console pada checklist ini; semua sembilan pemeriksaan PASS.
- [x] Catat write/persistence test sebagai NOT RUN; smoke test hanya read-only dan tidak ada perubahan operasional.
- [x] Review akhir release gate: audit tautan dalam cakupan, CI kandidat, integritas workbook, health check, dan sembilan smoke test read-only PASS; write/persistence test tercatat NOT RUN.
- [ ] Lock baseline pada SHA commit pencatatan final ini setelah CI final PASS dan sinkronisasi branch diverifikasi.
- [ ] Setelah CI pada commit dokumentasi final lulus dan review gate disetujui, catat keputusan lock baseline; baru kemudian siapkan workspace turunan berikutnya.

## Status dan batasan

Audit tautan mencakup 98 file Markdown pada tree untuk tautan inline Markdown dan pola autolink lokal; 15 target relatif yang terdeteksi pada indeks README, Contracts, Testing, Version-History, dan panduan hauling semuanya ditemukan di tree. Tidak ada target rusak dalam cakupan pola tersebut; tautan eksternal dan sintaks tautan kustom/nonstandar tidak diklaim telah divalidasi.

Runtime acceptance A.3: integritas ZIP workbook operasional PASS; health check PASS (`READY`, `offline=true`, `schema=A.3`, `RuntimeAdapter`); smoke test read-only PASS untuk Dashboard/Work Control, Equipment, Work Front, Operations, Target Plan, Reports, dialog Add Operation dan Add Work Front, serta Console tanpa error merah baru. Pengguna melaporkan tidak ada perubahan data yang disimpan. Write/persistence test tidak dijalankan dan tetap dicatat NOT RUN; tidak diwajibkan untuk acceptance read-only ini.

CI memakai fixture A.3 terisolasi untuk tes database-dependent. Workbook operasional tidak diubah oleh langkah validasi ini. Hasil CI saja tidak membuktikan acceptance runtime desktop terhadap workbook operasional.

Indeks ini tidak menyatakan ulang semua keputusan historis sebagai keputusan aktif. Untuk perilaku aktif, ikuti README proyek dan kontrak bersama yang berlaku.

Konsolidasi ini harus diikuti pemeriksaan tautan internal, tes workspace baseline, tes CSS cascade, serta seluruh pytest. Promosi dan lock baseline hanya dilakukan setelah pemeriksaan yang relevan lulus dan bukti audit terdokumentasi.
