# Equipment KPI Reminder — PA, UA, EU, MTBF, MTTR

> **V34 reminder / learning note**
>
> Dokumen ini menjadi pengingat konsep KPI equipment sebelum PA, UA, EU, MTBF, dan MTTR diimplementasikan ke Dashboard/Reports Mine Services.
>
> **Penting:** formula KPI dapat berbeda antar perusahaan/site. Jangan mengunci formula resmi di aplikasi sebelum definisi KPI perusahaan/site disepakati.

---

## 1. PA — Physical Availability

**Pertanyaan utama:**  
> Equipment tersedia secara fisik berapa persen dari waktu yang menjadi basis pengukuran?

Contoh formula sederhana:

`PA (%) = (Scheduled Time - Downtime) / Scheduled Time × 100%`

### Contoh

- Scheduled Time = 24 jam
- Breakdown / Repair = 2 jam
- Available Time = 22 jam

**PA = 22 / 24 × 100% = 91,7%**

PA tinggi tidak otomatis berarti equipment digunakan secara optimal.

---

## 2. UA — Utilization of Availability

**Pertanyaan utama:**  
> Dari waktu equipment sudah tersedia, berapa yang benar-benar digunakan/beroperasi?

Contoh formula:

`UA (%) = Operating Time / Available Time × 100%`

### Contoh

- Available Time = 22 jam
- Operating Time = 16 jam
- Available but not operating = 6 jam

**UA = 16 / 22 × 100% = 72,7%**

6 jam sisanya dapat berupa standby, waiting, lack of work, operator issue, traffic, weather, atau kategori delay lain sesuai definisi site.

---

## 3. EU — Effective Utilization

**Pertanyaan utama:**  
> Dari seluruh waktu yang menjadi basis pengukuran, berapa yang menjadi waktu operasi efektif?

Contoh sederhana:

`EU (%) = Effective Operating Time / Scheduled Time × 100%`

Jika:

- Effective Operating Time = 16 jam
- Scheduled Time = 24 jam

**EU = 16 / 24 × 100% = 66,7%**

### ⚠️ Perhatian

Definisi EU dapat berbeda antar perusahaan/site. Sebelum implementasi, harus ditentukan apakah basisnya operating hours, effective hours, productive hours, atau klasifikasi waktu tertentu.

---

## 4. MTBF — Mean Time Between Failures

**Pertanyaan utama:**  
> Rata-rata berapa lama equipment beroperasi sebelum failure berikutnya?

Contoh formula:

`MTBF = Total Operating Time / Number of Failure`

### Contoh

| Failure | Operating time sebelum failure |
|---|---:|
| F1 | 100 jam |
| F2 | 120 jam |
| F3 | 80 jam |
| **Total** | **300 jam** |

**MTBF = 300 / 3 = 100 jam/failure**

Definisi **failure** harus dikunci. Planned maintenance tidak otomatis dianggap failure.

---

## 5. MTTR — Mean Time To Repair

**Pertanyaan utama:**  
> Setelah failure terjadi, rata-rata berapa lama equipment membutuhkan repair?

Contoh formula:

`MTTR = Total Repair Time / Number of Repair Events`

### Contoh

| Repair | Repair time |
|---|---:|
| R1 | 4 jam |
| R2 | 6 jam |
| R3 | 5 jam |
| **Total** | **15 jam** |

**MTTR = 15 / 3 = 5 jam/event**

Harus ditentukan apakah MTTR hanya actual repair time atau juga mencakup response, diagnosis, menunggu teknisi, dan menunggu spare part.

---

## 6. Contoh Lengkap — 1 Dump Truck / 24 Jam

| Komponen waktu | Jam |
|---|---:|
| Scheduled / Calendar Time | 24 |
| Maintenance / Breakdown Downtime | 2 |
| Available Time | 22 |
| Operating Time | 16 |
| Available but Not Operating | 6 |

Hasil contoh:

| KPI | Perhitungan | Hasil |
|---|---|---:|
| PA | 22 / 24 × 100% | **91,7%** |
| UA | 16 / 22 × 100% | **72,7%** |
| EU* | 16 / 24 × 100% | **66,7%** |

* EU menggunakan definisi sederhana untuk contoh. Formula resmi harus mengikuti standar perusahaan/site.

---

## 7. Cara Membaca Hubungan KPI

### Availability / Utilization

`TOTAL / SCHEDULED TIME`
↓  
**PA — tersedia atau tidak?**
↓  
`AVAILABLE TIME`
↓  
**UA — benar-benar digunakan?**
↓  
`OPERATING / EFFECTIVE TIME`

### Reliability / Maintenance

`OPERATE → FAILURE → REPAIR → RETURN TO SERVICE → OPERATE`

- **MTBF** = panjang interval operasi antar failure.
- **MTTR** = lama waktu repair setelah failure.

---

## 8. Contoh Analisis

### PA tinggi tetapi UA rendah

Contoh:

- PA = 95%
- UA = 60%

Artinya equipment relatif sering tersedia, tetapi banyak waktu available tidak menjadi operating time.

Hal yang perlu ditelusuri:

- work front tersedia atau tidak
- operator tersedia atau tidak
- menunggu equipment lain
- queue / traffic
- material atau stockpile belum siap
- cuaca
- klasifikasi delay

**Jangan langsung menyimpulkan penyebab hanya dari angka KPI. Telusuri data sumber.**

### MTBF rendah dan MTTR tinggi

Perlu ditelusuri:

- komponen yang sering gagal
- failure berulang
- jenis failure: engine / hydraulic / electrical / tyre / structural
- actual repair time vs waiting time
- keterlambatan spare part
- kebutuhan specialist/vendor
- preventive maintenance

---

## 9. Data Minimum yang Perlu Ada di Mine Services

Untuk membuat KPI dapat ditelusuri ke sumbernya, perhatikan data berikut:

- Equipment ID
- Date / Shift
- Scheduled Hours
- Operating Hours
- Downtime
- Standby / Delay
- Failure Event
- Failure Start / End
- Repair Duration
- Failure Classification
- Maintenance Type

Alur konsep:

`Equipment → Shift/Period → Operations & Maintenance Events → Time Classification → KPI Calculation → Dashboard/Reports`

**KPI sebaiknya dihitung dari data transaksi, bukan diinput sebagai angka manual.**

---

## 10. Yang Harus Dikunci Sebelum Implementasi

- Definisi Scheduled Time
- Definisi Available Time
- Definisi Operating Time
- Definisi Effective Operating Time
- Kategori downtime / standby / delay / productive time
- Definisi failure untuk MTBF
- Definisi repair event untuk MTTR
- Apakah waiting spare part masuk MTTR
- Apakah planned maintenance masuk downtime availability
- Periode agregasi: shift / harian / mingguan / bulanan
- Perlakuan equipment yang tidak beroperasi karena tidak ada pekerjaan

---

## 11. Reminder untuk V34

> **Jangan langsung membuat KPI hanya karena nama KPI sudah ada di Dashboard.**

Sebelum coding:

1. Tentukan definisi resmi.
2. Tentukan formula.
3. Tentukan sumber data.
4. Tentukan klasifikasi waktu.
5. Tentukan cara menangani missing/invalid data.
6. Pastikan hasil dapat ditelusuri kembali ke Operations/Maintenance.
7. Baru implementasikan ke Dashboard/Reports.
8. Tambahkan test untuk formula dan edge cases.

**Tujuan akhirnya:** ketika PA, UA, EU, MTBF, atau MTTR berubah, pengguna dapat menjelaskan *mengapa* angka berubah berdasarkan data sumber, bukan hanya melihat angka KPI.

---

### Status

**Status:** Reference / Reminder  
**Stage:** V34 — Stage 22  
**Scope:** Equipment KPI concept  
**Implementation:** Belum dikunci sebagai formula resmi sampai standar perusahaan/site ditentukan.
