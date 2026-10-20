# Dokumentasi — Mine Services

Dokumen ini adalah indeks utama sejarah dan baseline proyek. Nama versi di dalam isi dokumen dipertahankan untuk keterlacakan keputusan historis; nama file dokumentasi menggunakan nama netral.

## Baseline saat ini

- Branch utama: `main`.
- **Baseline kode V41 LOCKED:** `e1447ccda06d530314a1cd0b05ce1a48acb8eed0` ([commit](https://github.com/yay460-jpg/portofolio/commit/e1447ccda06d530314a1cd0b05ce1a48acb8eed0)).
- Pada 2026-10-20, `main` dipindahkan secara force-with-lease dari `698469057aa588de2c3d17a1327ef4892863994d` ke baseline V41 `e1447ccda06d530314a1cd0b05ce1a48acb8eed0`. Riwayat `main` sebelumnya tidak lagi menjadi riwayat aktif pada branch tersebut.
- Workspace `v42-workspace` dibuat dari commit kode baseline V41 yang sama. Setelah catatan transisi ini dikomit, `main` dan `v42-workspace` akan menunjuk commit dokumentasi terbaru dengan kode aplikasi tetap berasal dari baseline V41.
- `v41-workspace` masih menunjuk commit baseline kode `e1447ccda06d530314a1cd0b05ce1a48acb8eed0`; tidak ada pekerjaan fitur baru yang dilakukan pada branch tersebut.
- **Status tes:** belum ada hasil tes yang terverifikasi untuk commit `e1447ccda06d530314a1cd0b05ce1a48acb8eed0` setelah pemulihan cache key. Hasil terakhir yang dilaporkan pengguna adalah 854 passed dan 2 failed; jangan menganggap baseline lulus penuh sebelum tes dijalankan ulang.
- Status CI commit baseline yang diperiksa melalui konektor GitHub: belum ada status check yang dilaporkan untuk SHA tersebut.
- Runtime aktif: `Artifacts/Mine-Services-Operations.html`.
- Database runtime: A.3, `Database/Mine-Services-Database-A3.xlsx`.

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
| 4 | Full Pytest dan GitHub Pages build/deploy pada commit yang sama | PASS pada baseline `0c782500a6021a5008daacb34d8e57e38380ccfb` — Pytest #600 dan Pages #2130 PASS |
| 5 | Audit referensi Markdown relatif | PASS — seluruh 98 file Markdown pada tree diperiksa untuk tautan inline Markdown dan pola autolink lokal. Semua 15 target relatif yang ditemukan di indeks README, Contracts, Testing, Version-History, dan panduan hauling cocok dengan path yang ada di tree; 0 target rusak dalam cakupan pola tersebut. |
| 6 | Sinkronkan `v41-workspace` dari baseline `main` tanpa force push | PASS pada `0c782500a6021a5008daacb34d8e57e38380ccfb`; fast-forward tanpa force push dan SHA kedua branch sama |
| 7 | Acceptance runtime Desktop Host A.3 (workbook integrity, health, modul, dialog, Console) | PASS berdasarkan bukti lokal yang dilaporkan pengguna; pemeriksaan read-only, tanpa menyimpan perubahan. Gate tulis/persistence tidak dijalankan dan dicatat tidak dilakukan. |
| 8 | Verifikasi final release gate dan lock baseline | PASS — baseline V41 LOCKED pada `0c782500a6021a5008daacb34d8e57e38380ccfb`; semua gate selesai. |

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
- [x] Validasi CI untuk commit baseline dan pastikan `main` dan `v41-workspace` identik pada SHA yang sama.
- [x] Tandai baseline V41 sebagai LOCKED setelah seluruh gate lulus. Workspace berikutnya dibuat hanya sesuai instruksi, tanpa folder/workspace tambahan yang tidak diminta.

## Status dan batasan

Audit tautan mencakup 98 file Markdown pada tree untuk tautan inline Markdown dan pola autolink lokal; 15 target relatif yang terdeteksi pada indeks README, Contracts, Testing, Version-History, dan panduan hauling semuanya ditemukan di tree. Tidak ada target rusak dalam cakupan pola tersebut; tautan eksternal dan sintaks tautan kustom/nonstandar tidak diklaim telah divalidasi.

Runtime acceptance A.3: integritas ZIP workbook operasional PASS; health check PASS (`READY`, `offline=true`, `schema=A.3`, `RuntimeAdapter`); smoke test read-only PASS untuk Dashboard/Work Control, Equipment, Work Front, Operations, Target Plan, Reports, dialog Add Operation dan Add Work Front, serta Console tanpa error merah baru. Pengguna melaporkan tidak ada perubahan data yang disimpan. Write/persistence test tidak dijalankan dan tetap dicatat NOT RUN; tidak diwajibkan untuk acceptance read-only ini.

CI memakai fixture A.3 terisolasi untuk tes database-dependent. Workbook operasional tidak diubah oleh langkah validasi ini. Hasil CI saja tidak membuktikan acceptance runtime desktop terhadap workbook operasional.

Indeks ini tidak menyatakan ulang semua keputusan historis sebagai keputusan aktif. Untuk perilaku aktif, ikuti README proyek dan kontrak bersama yang berlaku.

Konsolidasi ini harus diikuti pemeriksaan tautan internal, tes workspace baseline, tes CSS cascade, serta seluruh pytest. Promosi dan lock baseline hanya dilakukan setelah pemeriksaan yang relevan lulus dan bukti audit terdokumentasi.

## V42 — normalisasi nama file dokumentasi

- [x] Menetralkan nama file historis yang memuat nomor versi/stage pada dokumentasi Mine Geologist dan kontrak Mine Services; isi teknis historis dipertahankan.
- [x] Memperbarui indeks Version-History untuk nama file netral dan membetulkan referensi kontrak operasional.
- [x] Audit tree repository pada commit pemeriksaan: 670 file, tree lengkap, tidak ada nama file yang cocok dengan pola audit versi.
- [x] Memastikan `v42-workspace` berada 14 commit di depan `main` dan tidak tertinggal commit; `main` tidak diubah.
- [ ] CI untuk commit terbaru `184bdf8aa96f28f9d3dee1a80198c87976e6ab4c` belum tercatat saat pemeriksaan; hasil CI sukses terakhir yang teramati adalah commit `04f3a8045381ad44384292ef40950e1c6f7fb037`.
- [ ] Jangan mempromosikan V42 ke `main` sebelum CI pada perubahan akhir dan pemeriksaan referensi terkait selesai.

## V42 — normalisasi awalan Stage pada nama file

- [x] Menetralkan 73 path dokumentasi/kontrak yang masih memakai awalan Stage, termasuk nama workbook dan direktori arsip.
- [x] Menetralkan 44 nama file test yang masih memakai label stage; pola `test_*.py` tetap dipertahankan agar pytest tetap dapat mengumpulkannya.
- [x] Nama target diperiksa agar tidak bertabrakan; satu test host menggunakan nama `test_offline_desktop_host.py` untuk menghindari konflik.
- [ ] Menunggu CI penuh pada commit perubahan ini dan memeriksa ulang semua referensi internal sebelum baseline dikunci.
