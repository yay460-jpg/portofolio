# MG1 / Lithosite — V24.5
## REMINDER CASE — Viewport Geometry Contract V1

**Status: LOCKED / OBSERVE ONLY**

Tanggal catatan: 2026-09-16

---

## 1. Latar belakang kasus

Pada pengujian V24.5 ditemukan perilaku viewport yang sebelumnya berbeda antara:

- sisi kiri/kanan
- sisi atas/bawah

Pada beberapa iterasi sebelumnya, masalah atas/bawah pernah dicoba diselesaikan menggunakan **temporary viewport compensation / tuning percentage**.

Contoh pendekatan lama yang **tidak boleh dihidupkan kembali**:

- mencari titik balance dengan angka persentase tertentu;
- vertical expansion khusus LOW portrait;
- multiplier khusus Y;
- perlakuan berbeda antara atas/bawah dan kiri/kanan.

Pendekatan tersebut dapat terlihat benar pada kondisi/device tertentu, tetapi tidak membuktikan bahwa kontrak geometry-nya benar secara fundamental.

---

## 2. Kondisi setelah Viewport Geometry Contract V1

V24.5 sekarang menggunakan satu basis geometry internal:

```text
Viewport Geometry Contract V1
    width  = 320
    height = 320
    aspectRatio = 1:1
```

Geometry internal tidak lagi dibedakan berdasarkan LOW/HIGH atau portrait untuk tujuan koreksi arah Y.

Prinsipnya:

```text
X kiri/kanan ─┐
              ├── satu basis geometry
Y atas/bawah ─┘
```

Bounds dan viewBox harus berasal dari kontrak geometry yang sama.

C1 viewport planner dan jalur runtime tidak boleh membuat kontrak geometry alternatif sendiri.

---

## 3. Hasil observasi saat ini

### Video pendek

Hasil pengujian menunjukkan objek lingkaran hijau pada peta terlihat sebagai **lingkaran yang sempurna**, bukan oval/tertarik pada arah vertikal.

### Video lebih panjang

Setelah peta dipindahkan ke berbagai arah dan digunakan lebih lama:

- kiri/kanan tetap stabil;
- atas/bawah tetap stabil;
- tidak terlihat lagi perbedaan perilaku geometry antara arah horizontal dan vertikal;
- viewport tetap konsisten selama perpindahan peta.

**Kesimpulan sementara:** hasil saat ini mendukung bahwa geometry sudah kembali ke satu basis yang simetris.

Namun status ini masih **OBSERVE**, bukan klaim permanen berdasarkan satu sesi pengujian.

---

## 4. RULE PENTING — JANGAN KEMBALI KE TEMPORARY TUNING

Jika di kemudian hari muncul anomali atas/bawah:

### JANGAN langsung:

```text
+ percentage correction
+ vertical expansion
+ Y multiplier
+ portrait-only compensation
+ LOW-only geometry branch
+ angka "balance" baru
```

Jangan menganggap angka yang pernah terlihat cocok pada satu device sebagai solusi geometry.

### WAJIB lakukan:

Trace kontrak dari awal sampai akhir:

```text
GeoReference
    ↓
Viewport Geometry Contract V1
    ↓
Bounds
    ↓
ViewBox
    ↓
C1 Viewport Planner
    ↓
Tile Resolution
    ↓
C2 Runtime
    ↓
Tile Queue
    ↓
Compositor
    ↓
SVG / Screen
```

Cari layer tempat kontrak mulai berbeda atau rusak.

---

## 5. Separation of concerns

Untuk kasus ini:

### Geometry

Menentukan:

- ukuran internal viewport;
- aspect ratio internal;
- bounds;
- viewBox;
- transform geometry.

### Device Profile

Hanya menentukan performance budget seperti:

- tile size;
- max factor;
- batch;
- delay;
- cache;
- prefetch.

**Device Profile tidak boleh menentukan geometry X/Y yang berbeda.**

### Tile Resolution

Merupakan kontrak terpisah.

Jangan mencampurkan perubahan resolution/factor dengan investigasi geometry.

---

## 6. Freeze sementara

Selama fase observasi ini:

```text
VIEWPORT GEOMETRY CONTRACT V1     🔒 LOCK
Queue                            🔒 NO CHANGE
IndexedDB V2                     🔒 NO CHANGE
Gesture / pinch                  🔒 NO CHANGE
Device Profiler                  🔒 NO CHANGE
Tile Resolution / factor         🔒 NO CHANGE
V25 architecture                 🔒 NO CHANGE
```

Tujuannya agar jika muncul anomali di masa depan, sumber perubahan dapat diisolasi dengan jelas.

---

## 7. Test jangka panjang yang disarankan

Tidak perlu patch tambahan hanya untuk melakukan test.

Amati:

- pan kiri → kanan;
- pan kanan → kiri;
- pan atas → bawah;
- pan bawah → atas;
- diagonal;
- zoom in/out;
- kombinasi pan + zoom;
- buka/tutup Point Detail;
- render ulang setelah lifecycle tertentu;
- pindah map jika relevan;
- penggunaan dengan durasi panjang.

Device LOW/worst-case tetap penting untuk observasi karena masalah historis paling jelas muncul pada kelas device tersebut.

---

## 8. Kriteria jika kelak muncul bug lagi

Bug baru **tidak otomatis berarti Geometry Contract V1 salah**.

Pertanyaan pertama:

> Apakah semua tahap masih menggunakan geometry contract yang sama?

Periksa:

1. input GeoReference;
2. bounds;
3. viewBox;
4. C1;
5. C2;
6. compositor;
7. lifecycle yang memicu render ulang.

Hanya jika ditemukan kontrak geometry memang salah, lakukan revisi contract.

**Jangan menambal gejala dengan compensation percentage.**

---

## 9. Reminder untuk backup / GitHub

File ini dimaksudkan sebagai **case reminder**, bukan source code runtime.

Saat membuat backup GitHub:

```text
docs/
└── V24.5_VIEWPORT_GEOMETRY_CONTRACT_CASE_REMINDER.md
```

Atau dapat disimpan sebagai:

```text
doc.md
```

Isi catatan ini harus ikut dipertahankan agar developer berikutnya memahami bahwa temporary compensation sebelumnya adalah bagian dari **riwayat debugging**, bukan desain geometry yang boleh digunakan kembali.

---

## 10. Status

**V24.5 Viewport Geometry Contract V1**

```text
IMPLEMENTED
STATIC VALIDATION  : PASS
SHORT VIDEO        : STABLE
LONG VIDEO         : STABLE
TEMPORARY Y FIX    : REMOVED
X/Y BASIS          : UNIFIED
CURRENT ACTION     : OBSERVE
```

**Do not tune. Trace the contract first.**

---
