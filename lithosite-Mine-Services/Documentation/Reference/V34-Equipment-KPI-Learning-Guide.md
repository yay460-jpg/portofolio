# V34 Learning Guide — Memahami KPI Equipment dari Cerita Operasi

> **Dokumen khusus pembelajaran**
>
> Dokumen ini dibuat untuk membantu memahami PA, UA, EU, MTBF, dan MTTR dari **kejadian equipment yang nyata**, bukan dengan menghafalkan rumus terlebih dahulu.
>
> **Status:** Learning / Reference  
> **Stage:** V34 — Stage 22  
> **Catatan:** contoh angka di dokumen ini adalah simulasi pembelajaran, bukan formula KPI resmi perusahaan.

---

## 1. Cara Berpikir

Sebelum memahami KPI, bayangkan kita sedang mengikuti **satu equipment selama satu shift**.

Jangan mulai dengan “Apa rumus PA?”. Mulai dengan:

> **Apa yang terjadi pada equipment ini selama shift?**

Contoh: equipment bekerja → standby → bekerja → breakdown → repair → kembali bekerja.

Alurnya:

**KEJADIAN → DATA WAKTU → KLASIFIKASI → KPI → DASHBOARD**

---

## 2. Simulasi Satu Equipment

**Equipment:** DT-001 — Dump Truck  
**Shift:** Day Shift  
**Periode:** 06:00–18:00  
**Total shift:** 12 jam

Kita mengikuti DT-001 dari awal sampai akhir shift.

---

## 3. Cerita DT-001

### 06:00–08:00 — Operating

DT-001 melakukan hauling selama 2 jam.

**Operating Time = 2 jam**

### 08:00–09:00 — Standby

Work front berhenti sementara. DT-001 masih tersedia secara fisik, tetapi tidak digunakan.

**Standby = 1 jam**

> **Standby bukan otomatis breakdown.**

### 09:00–11:00 — Operating

DT-001 kembali hauling selama 2 jam.

Total operating sementara:

**2 + 2 = 4 jam**

### 11:00–13:00 — Breakdown

DT-001 mengalami hydraulic failure dan tidak dapat beroperasi.

**Breakdown / Downtime = 2 jam**

### 13:00–14:00 — Repair

Maintenance melakukan repair selama 1 jam.

**Actual Repair Time = 1 jam**

Setelah repair selesai, equipment kembali ready.

> Dalam sistem nyata, harus ditentukan apakah MTTR menghitung actual repair time saja atau seluruh failure-to-ready time.

### 14:00–18:00 — Operating

DT-001 kembali bekerja selama 4 jam.

Total operating:

**2 + 2 + 4 = 8 jam**

---

## 4. Seluruh Shift

| Waktu | Kondisi | Durasi |
|---|---|---:|
| 06:00–08:00 | Operating | 2 jam |
| 08:00–09:00 | Standby | 1 jam |
| 09:00–11:00 | Operating | 2 jam |
| 11:00–13:00 | Breakdown | 2 jam |
| 13:00–14:00 | Repair | 1 jam |
| 14:00–18:00 | Operating | 4 jam |
| **Total** | | **12 jam** |

---

## 5. Pisahkan Waktunya

**Operating:** 2 + 2 + 4 = **8 jam**

**Standby:** **1 jam**

**Breakdown:** **2 jam**

**Actual repair:** **1 jam**

Hal penting:

> **Breakdown duration dan repair duration tidak selalu identik.**

Contoh: failure 11:00, teknisi tiba 11:30, diagnosis 30 menit, actual repair 1 jam, ready 13:00.

Maka failure-to-ready = 2 jam, tetapi actual repair = 1 jam.

---

## 6. PA — Physical Availability

Pertanyaan:

> **Equipment tersedia secara fisik berapa lama dari scheduled time?**

Dalam contoh sederhana:

Scheduled Time = 12 jam  
Downtime = 2 jam  
Available Time = 12 − 2 = **10 jam**

Formula:

**PA = Available Time / Scheduled Time × 100%**

**PA = 10 / 12 × 100% = 83,3%**

Artinya DT-001 tersedia secara fisik sekitar **83,3%** dari shift.

> PA bukan berarti equipment bekerja 83,3%.

---

## 7. UA — Utilization of Availability

Pertanyaan:

> **Dari waktu equipment tersedia, berapa yang benar-benar digunakan?**

Available Time = 10 jam  
Operating Time = 8 jam

Formula:

**UA = Operating Time / Available Time × 100%**

**UA = 8 / 10 × 100% = 80%**

Artinya 80% dari available time menjadi operating time.

Sisa waktu harus dianalisis berdasarkan klasifikasi waktu yang disepakati.

---

## 8. EU — Effective Utilization

Untuk pembelajaran sederhana:

**EU = Effective Operating Time / Scheduled Time**

Jika seluruh 8 jam operating dianggap effective:

**EU = 8 / 12 × 100% = 66,7%**

> **EU harus paling hati-hati.** Definisinya dapat berbeda antar perusahaan/site. Jangan mengunci formula resmi hanya dari contoh ini.

---

## 9. MTBF — Mean Time Between Failures

Pertanyaan:

> **Rata-rata berapa lama equipment beroperasi sebelum failure berikutnya?**

Untuk histori DT-001:

| Failure | Operating time sebelum failure |
|---|---:|
| F1 | 100 jam |
| F2 | 120 jam |
| F3 | 80 jam |
| **Total** | **300 jam** |

Formula:

**MTBF = Total Operating Time / Number of Failure**

**MTBF = 300 / 3 = 100 jam/failure**

MTBF membutuhkan histori failure yang memadai; satu shift saja tidak cukup untuk menghasilkan gambaran reliability yang baik.

---

## 10. MTTR — Mean Time To Repair

Pertanyaan:

> **Setelah failure terjadi, rata-rata berapa lama equipment membutuhkan repair?**

| Repair | Repair Time |
|---|---:|
| R1 | 4 jam |
| R2 | 6 jam |
| R3 | 5 jam |
| **Total** | **15 jam** |

Formula:

**MTTR = Total Repair Time / Number of Repair Events**

**MTTR = 15 / 3 = 5 jam/event**

Definisi harus menentukan apakah waiting/response/spare-part time termasuk MTTR.

---

## 11. Lima KPI, Lima Pertanyaan

| KPI | Pertanyaan |
|---|---|
| **PA** | Equipment tersedia atau tidak? |
| **UA** | Saat tersedia, equipment digunakan atau tidak? |
| **EU** | Dari seluruh waktu, berapa yang menjadi waktu efektif? |
| **MTBF** | Seberapa lama equipment beroperasi sebelum failure? |
| **MTTR** | Setelah failure, berapa lama repair/recovery? |

---

## 12. Gambaran Visual

**TOTAL / SCHEDULED TIME**  
↓  
**PA — tersedia atau tidak?**  
↓  
**AVAILABLE TIME**  
↓  
**UA — benar-benar digunakan?**  
↓  
**OPERATING / EFFECTIVE TIME**

Reliability:

**OPERATE → FAILURE → REPAIR → RETURN TO SERVICE → OPERATE**

- **MTBF** melihat interval operasi antar failure.
- **MTTR** melihat durasi repair/recovery sesuai definisi yang disepakati.

---

## 13. PA Tinggi tetapi UA Rendah

Contoh:

**PA = 95%**  
**UA = 55%**

Jangan langsung menyimpulkan equipment bermasalah secara mechanical.

Kemungkinan yang perlu ditelusuri:

- work front tidak tersedia
- operator tidak tersedia
- menunggu equipment lain
- queue / traffic
- material belum tersedia
- weather
- operational delay
- klasifikasi waktu yang tidak konsisten

> Angka KPI menunjukkan gejala; data event diperlukan untuk menjelaskan penyebab.

---

## 14. MTBF Rendah dan MTTR Tinggi

Perlu ditelusuri:

- komponen yang sering gagal
- failure berulang
- jenis failure: engine / hydraulic / electrical / tyre / structural
- actual repair time vs waiting time
- keterlambatan spare part
- kebutuhan specialist/vendor
- preventive maintenance

MTBF dan MTTR menjawab dua pertanyaan berbeda:

**MTBF → seberapa sering failure terjadi?**  
**MTTR → berapa lama recovery/repair?**

---

## 15. Data yang Dibutuhkan Mine Services

### Equipment
- Equipment ID
- Equipment Type
- Status
- Owner

### Time
- Date
- Shift
- Start Time
- End Time
- Duration

### Operational State
- Operating
- Standby
- Delay
- Breakdown
- Maintenance
- kategori lain sesuai standar

### Failure
- Failure ID
- Equipment ID
- Failure Date/Time
- Failure Type
- Component
- Cause
- Status

### Repair
- Repair Start
- Repair End
- Actual Repair Duration
- Technician / Team
- Spare Part
- Maintenance Type

---

## 16. Hubungan dengan Mine Services

V34 seharusnya tidak hanya menampilkan:

**PA 83,3%**  
**UA 80%**  
**EU 66,7%**  
**MTBF 100 h**  
**MTTR 5 h**

Yang lebih penting:

> **Dari mana angka itu berasal?**

Contoh PA:

- Equipment: DT-001
- Shift: Day
- Scheduled: 12 h
- Downtime: 2 h
- Available: 10 h
- Formula: 10 / 12
- Result: 83,3%

Contoh MTTR:

- Equipment: DT-001
- Repair events: R1, R2, R3
- Total repair: 15 h
- Events: 3
- Result: 5 h/event

---

## 17. Konsep Traceability

Target V34:

**RAW EVENT**  
↓  
**TIME CLASSIFICATION**  
↓  
**AGGREGATION**  
↓  
**KPI CALCULATION**  
↓  
**DASHBOARD / REPORTS**

Contoh:

**DT-001 / 11:00 / Hydraulic Failure**  
↓  
**Breakdown = 2 h**  
↓  
**Available Time = 10 h**  
↓  
**PA = 10 / 12**  
↓  
**PA = 83,3%**

KPI bukan angka yang berdiri sendiri.

---

## 18. Kesalahan yang Harus Dihindari

### 1. PA = productivity

Tidak. PA membahas availability.

### 2. Standby = breakdown

Tidak. Standby dapat berarti equipment tersedia tetapi tidak digunakan.

### 3. MTBF = jumlah breakdown

Tidak. MTBF mengukur interval waktu antar failure.

### 4. MTTR = seluruh downtime

Belum tentu. Definisi awal/akhir MTTR harus dikunci.

### 5. EU punya satu formula universal

Tidak. Formula EU harus mengikuti standar perusahaan/site.

### 6. KPI diinput manual

Sebaiknya tidak. KPI harus dihitung dari data sumber yang dapat ditelusuri.

---

## 19. Cara Belajar yang Mudah

Kalau menemukan KPI equipment baru, gunakan pertanyaan:

1. **Equipment tersedia atau tidak?** → PA
2. **Kalau tersedia, digunakan atau tidak?** → UA
3. **Dari seluruh waktu, berapa yang efektif?** → EU
4. **Seberapa sering failure?** → MTBF
5. **Kalau failure, berapa lama recovery/repair?** → MTTR

---

## 20. Reminder Khusus V34

Sebelum coding KPI:

1. Pahami event equipment.
2. Tentukan kategori waktu.
3. Tentukan Scheduled Time.
4. Tentukan Available Time.
5. Tentukan Operating Time.
6. Tentukan Effective Time.
7. Tentukan Failure.
8. Tentukan Repair.
9. Tentukan formula PA.
10. Tentukan formula UA.
11. Tentukan formula EU.
12. Tentukan formula MTBF.
13. Tentukan formula MTTR.
14. Tentukan sumber data.
15. Tentukan periode perhitungan.
16. Tentukan aturan missing/invalid data.
17. Desain UI Dashboard.
18. Implementasikan calculation engine.
19. Tambahkan test.
20. Pastikan hasil dapat ditelusuri kembali ke data sumber.

---

## 21. Kalimat yang Perlu Diingat

> **“KPI bukan data sumber. KPI adalah hasil perhitungan dari data sumber.”**

> **“Sebelum menghitung KPI, kita harus tahu apa yang sebenarnya terjadi pada equipment.”**

> **“Kalau angka KPI berubah, kita harus bisa menjelaskan data apa yang menyebabkan perubahan tersebut.”**

Ini adalah prinsip utama untuk membawa V34 dari konsep menuju implementasi.

---

## Status

**Document:** V34 Equipment KPI Learning Guide  
**Purpose:** Pembelajaran pribadi dan referensi pengembangan  
**Stage:** V34 — Stage 22  
**Status:** Learning / Reference  
**Official KPI Formula:** Belum dikunci  
**Implementation:** Belum dianggap final sampai definisi perusahaan/site ditentukan
