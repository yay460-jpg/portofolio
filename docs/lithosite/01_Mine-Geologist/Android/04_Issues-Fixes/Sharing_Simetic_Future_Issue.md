# MG1 / Lithosite — V24.5
## FUTURE ISSUE REMINDER — Sharing & Simetic Layer

**Status: FUTURE / NOT TO BE WORKED YET**

> Issue ini hanya dokumentasi/reminder.
> Jangan implementasi, patch, refactor, atau mengubah arsitektur V24.5 sampai ada instruksi eksplisit untuk mengerjakannya.

---

## 1. Scope Issue

Issue future ini mencatat dua area yang akan dibahas pada tahap berikutnya:

1. **Sharing**
2. **Simetic Layer**

Keduanya sengaja dipisahkan dari pekerjaan V24.5 yang sedang di-lock sekarang.

Tujuan dokumen ini adalah menjaga konteks agar saat issue dibuka kembali, pekerjaan dimulai dari baseline yang benar dan tidak dilakukan sebagai patch spontan.

---

## 2. Current Baseline

Gunakan:

**MG1_LITHOSITE_V24.5_BASELINE_FINAL**

Baseline terakhir mencakup:

- Viewport Geometry Contract V1 — LOCKED
- Point Detail Modal V2 — LOCKED
- Tile Queue lifecycle — LOCKED
- Map Library UI — LOCKED
- Logout hard refresh — LOCKED
- IndexedDB V2
- Device Profile — jangan diubah tanpa kebutuhan
- Tile Resolution / factor — belum menjadi target issue ini
- V25 architecture — tidak dicampur

---

# PART A — SHARING

## 3. Status

**NOT STARTED**

Belum ada keputusan implementasi final pada issue ini.

Jangan mengasumsikan bentuk sharing, storage, permission, sinkronisasi, atau transport sebelum requirement ditentukan.

---

## 4. Hal yang perlu ditentukan ketika issue dibuka

Saat nanti dikerjakan, audit harus menentukan:

### A. Apa yang dibagikan?

Contoh kategori yang perlu dipastikan:

- peta/background map;
- data titik TP;
- layer;
- feature;
- metadata;
- hasil pengukuran;
- konfigurasi tampilan;
- atau kombinasi tertentu.

Jangan menganggap semua data harus ikut dibagikan.

### B. Kepada siapa?

Perlu dibedakan:

- device yang sama;
- user yang sama;
- user lain;
- anggota project/team;
- publik;
- atau penerima melalui link/export.

### C. Bentuk sharing

Harus ditentukan apakah targetnya:

- share link;
- export/import;
- package;
- server synchronization;
- peer/device transfer;
- atau mekanisme lain.

### D. Ownership & permission

Sebelum coding, tetapkan:

```text
Owner
  ↓
Writer / Editor
  ↓
Reader
  ↓
Public / Restricted
```

Jangan membuat permission model baru hanya berdasarkan asumsi.

### E. Offline / local behavior

V24.5 memiliki komponen penyimpanan lokal.

Saat issue sharing dibuka, wajib dipastikan:

- data lokal tetap aman;
- sharing tidak merusak IndexedDB V2;
- import tidak menimpa data tanpa aturan;
- duplicate ID ditangani;
- versi package dapat diverifikasi;
- kegagalan transfer dapat dipulihkan.

---

# PART B — SIMETIC LAYER

## 5. Status

**NOT STARTED**

Istilah **"Simetic Layer"** dipertahankan sesuai terminology issue saat ini.

Belum boleh mengubahnya menjadi implementasi atau mengasumsikan definisi teknis final sebelum requirement/arsitektur dibahas.

---

## 6. Tujuan audit ketika issue dibuka

Sebelum membuat code, lakukan pemetaan:

```text
Data Source
    ↓
Contract
    ↓
Simetic Layer
    ↓
Application State
    ↓
Renderer / UI
```

Tujuan pertama adalah mengetahui:

- data apa yang masuk;
- contract apa yang digunakan;
- siapa owner state;
- siapa yang membaca data;
- siapa yang menulis data;
- bagaimana perubahan dipropagasikan;
- bagaimana layer berhubungan dengan sharing;
- apakah layer bersifat local, remote, atau hybrid.

---

## 7. Jangan membuat duplicate ownership

Saat issue dikerjakan nanti, wajib audit terhadap:

- state ownership;
- contract ownership;
- storage ownership;
- renderer ownership;
- lifecycle ownership.

Jangan membuat layer baru yang hanya menggandakan fungsi layer lama.

Prinsip:

```text
1 source of truth
        ↓
clear contract
        ↓
clear owner
        ↓
clear consumer
```

---

# PART C — HUBUNGAN SHARING ↔ SIMETIC LAYER

## 8. Jangan langsung digabung

Sharing dan Simetic Layer memiliki kemungkinan hubungan, tetapi **belum boleh dianggap sebagai satu sistem** sebelum audit.

Pertanyaan yang harus dijawab ketika issue dibuka:

```text
Apakah Simetic Layer:
    ├─ menjadi sumber data sharing?
    ├─ hanya abstraction layer?
    ├─ menangani synchronization?
    ├─ menangani normalization?
    └─ tidak berhubungan langsung dengan sharing?
```

Jawaban harus berasal dari audit arsitektur, bukan asumsi.

---

# PART D — WORKFLOW SAAT ISSUE DIBUKA

## 9. Urutan kerja wajib

Jangan langsung coding.

Gunakan urutan:

```text
STEP 1
Audit baseline V24.5
        ↓
STEP 2
Mapping file & dependency
        ↓
STEP 3
Mapping data contract
        ↓
STEP 4
Mapping ownership
        ↓
STEP 5
Define Sharing Contract
        ↓
STEP 6
Define Simetic Layer Contract
        ↓
STEP 7
Check interaction between both
        ↓
STEP 8
Design minimal implementation
        ↓
STEP 9
Static audit
        ↓
STEP 10
Runtime test
        ↓
STEP 11
Only then create release patch
```

---

## 10. Protected areas

Issue ini **tidak otomatis memberikan izin** untuk mengubah:

- Viewport Geometry Contract V1;
- Point Detail Modal V2;
- Tile Queue;
- IndexedDB V2;
- Device Profile;
- Tile Resolution;
- Gesture lifecycle;
- V25 architecture.

Jika perubahan ternyata diperlukan, perubahan tersebut harus dinyatakan sebagai dependency/impact secara eksplisit sebelum coding.

---

# PART E — REMINDER

## 11. Jangan dikerjakan sekarang

**STOP CONDITION**

Jika belum ada instruksi eksplisit dari owner/project untuk membuka issue:

```text
DO NOT IMPLEMENT
DO NOT PATCH
DO NOT REFACTOR
DO NOT CHANGE DATABASE
DO NOT CHANGE V24.5 BASELINE
```

Dokumen ini hanya menjadi marker bahwa issue tersebut **ada dan akan dikerjakan pada fase berikutnya**.

---

## 12. Trigger untuk membuka issue

Issue dianggap aktif hanya setelah ada instruksi eksplisit, misalnya:

> "Kerjakan issue Sharing & Simetic Layer."

Setelah trigger tersebut diberikan, mulai dari:

**V24.5 BASELINE FINAL**

dan lakukan audit struktural terlebih dahulu.

---

## 13. Final Reminder

```text
CURRENT STATUS
────────────────────────
V24.5 baseline       🔒 LOCK
Geometry Contract    🔒 LOCK
Modal V2             🔒 LOCK
Sharing              ⏸ FUTURE
Simetic Layer        ⏸ FUTURE
Implementation       🚫 NOT YET
```

**Do not implement until instructed.**

**First audit the contract. Then define ownership. Then implement.**
