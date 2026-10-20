# Panduan: Migrasi Backend Code.gs Tunggal → 8 File Terpisah

**Status:** Selesai & terverifikasi berhasil deploy (Versi 228, 3 Sep 2026)
**Konteks:** Bagian dari rencana "Split Code.gs jadi multi-file" (Opsi A — split dangkal, murni pindah fungsi tanpa restrukturisasi logika). Opsi B (pecah `doPost`/`doGet` jadi handler per-sheet) menyusul di sesi terpisah.

---

## Daftar 8 File & Isinya

| File | Isi |
|---|---|
| `01_Config.gs` | Konstanta, koneksi spreadsheet, utilitas generik (jsonOut_, headerMap_, col_, hash), konfigurasi region/timezone |
| `02_Auth.gs` | Login, session, credential, RBAC, API Abuse Guard, export audit |
| `03_DeveloperTools.gs` | Developer Console: hapus/reset baris, backfill User_ID, cleanup |
| `04_PostEndpoints.gs` | `doPost` — router tunggal semua endpoint tulis (masih monolitik ~2800 baris, target Opsi B) |
| `05_GetEndpoints.gs` | `doGet` — router tunggal semua endpoint baca (masih monolitik ~1200 baris, target Opsi B) |
| `06_DataHelpers.gs` | Validasi tanggal, auto-routing Dome, format tampilan, ChatLog |
| `07_Maintenance.gs` | Migrasi timestamp historis, retensi & archive terjadwal |
| `08_KPIEngine.gs` | Engine KPI 5 Pilar + statistik produksi (termasuk migrasi User_ID Tahap 4, 3 Sep) |

Batas potong ditentukan pakai parser JS (acorn), bukan tebakan manual — memastikan tidak ada fungsi terpotong di tengah. Diverifikasi diff byte-per-byte 100% identik dengan file sumber sebelum split, ditambah cek: sintaks tiap file valid berdiri sendiri, 158 fungsi total (0 hilang/dobel), set nama fungsi identik dengan baseline.

**Catatan penting:** `writeDomeTransaction_` (helper barging) ternyata bersarang di dalam `doPost` — bukan fungsi berdiri sendiri — jadi otomatis ikut pindah utuh sebagai satu kesatuan di `04_PostEndpoints.gs`, tidak perlu diekstrak manual.

---

## Langkah Pemasangan di Apps Script Editor

1. **Buat file baru** — klik ikon '+' di sebelah 'File' di panel kiri → pilih 'Script'.
2. **Beri nama** sesuai daftar di atas (tanpa akhiran `.gs`, otomatis ditambahkan).
3. ⚠️ **WAJIB: kosongkan dulu isi bawaan sebelum tempel.** File baru otomatis berisi boilerplate:
   ```
   function myFunction() {

   }
   ```
   **Select all (Ctrl+A) → Delete → baru paste** isi file split yang sudah disiapkan.
4. Ulangi langkah 1-3 untuk kedelapan file.
5. Setelah semua terisi, kosongkan (jangan langsung hapus) file lama `Kode.gs` sebagai jaga-jaga rollback.
6. Simpan (Ctrl+S), pastikan **tidak ada titik oranye/tanda error** di panel file manapun.
7. Setelah yakin semua 8 file bersih, baru hapus `Kode.gs` yang lama.

### ⚠️ Jebakan yang pernah terjadi (dicatat sebagai pelajaran)
Sempat 1 file (`01_Config.gs`) tertempel **di dalam** `function myFunction() {` yang lupa dihapus dulu — akibatnya seluruh isi file "terkurung" jadi lokal, bukan fungsi level-atas/global lagi (fungsi jadi tidak bisa dipanggil dari file lain). Terlihat dari baris 1 masih ada `function myFunction() {` sebelum komentar header. **Solusi:** kalau ketemu kasus ini, select all isi file itu, hapus total, paste ulang dari awal — jangan coba edit manual sebagian.

---

## Checklist Verifikasi Setelah Pemasangan

- [ ] Ke-8 file ada di panel kiri, 0 tanda error/titik oranye
- [ ] Baris 1 tiap file adalah komentar header `/* ====...`, BUKAN `function myFunction() {`
- [ ] `Kode.gs` lama sudah dihapus (setelah semua file baru dipastikan benar)
- [ ] Deploy berhasil ("Penerapan berhasil diperbarui", ada nomor versi baru)
- [ ] Login ke aplikasi web berhasil normal
- [ ] Kartu Member (KPI) tampil Tonase/Ni/Waste dengan angka, bukan "-" semua
- [ ] Submit 1 data uji ke Produksi_GC atau Validasi berhasil tanpa error
- [ ] Panel Developer Console masih bisa dibuka & berfungsi

---

## Riwayat
- **3 Sep 2026** — Split dari `Code_v90.2.141_MG1_RESTORED.gs` (7028 baris, 158 fungsi) menjadi 8 file. Dipasang & berhasil deploy (Versi 228).
