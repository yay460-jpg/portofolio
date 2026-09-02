// ============================================================
// I18N.JS -- Terjemahan, Bahasa, JSA, & Changelog
// ============================================================

// ============================================================
// TRANSLATIONS DICTIONARY (ID/EN)
// Diambil dari core.js asli
// ============================================================
window.translations = {
 id: {
  nav_ringkasan: "Ringkasan",
  nav_trend: "Visual & Trend",
  nav_tabel: "Tabel Digging",
  nav_rekonsiliasi: "Rekonsiliasi",
  nav_validasi: "Validasi",
  nav_barging: "Barging",
  rca_title: "RCA Log -- Root Cause & Rekomendasi",
  pitactual_new_btn: "Catat Pit Actual",
  pitactual_history_btn: "Riwayat",
  pitactual_history_title: "Riwayat Pit Actual",
  pitactual_history_subtitle: "Semua baris timbangan resmi (Ritase x TF) beserta Catatan/kendala lapangan -- bukti audit kalau ada penyimpangan.",
  rca_evidence_title: "Catatan Pit Actual Terkait (Bukti Pendukung)",
  pitactual_form_title: "Catat Pit Actual",
  pitactual_info: "Tonase dihitung otomatis (Rit x TF) -- ini hasil timbang di weighbridge, murni tonase tanpa kadar.",
  matrix_f1_label: "F1 (GC/BM)",
  matrix_f2_label: "F2 (PA/GC)",
  matrix_f3_label: "F3: Plant / Pit Actual",
  matrix_f4_label: "F4: Plant / Block Model",
  matrix_total_pitactual: "Total Pit Actual",
  matrix_total_plant: "Total Plant (Aktual)",
  matrix_th_bm: "BM (Ton)",
  matrix_th_gc: "GC (Ton)",
  matrix_th_pitactual: "Pit Actual (Ton)",
  matrix_f1f2_note: "F1/F2 mendekati 100% = bagus (sesuai rencana). Di bawah 100% = ada Loss di tahap itu. Di atas 100% = ada Dilusi/tambahan material di tahap itu.",
  rca_subtitle: "Penjelasan akar masalah & tindakan untuk penyimpangan rekonsiliasi per Blok",
  rca_new_btn: "RCA Baru",
  rca_loading: "Memuat data RCA...",
  rca_form_title: "RCA Baru",
  rca_maker_status_label: "Status",
  rca_maker_status_note: "Dibuat otomatis oleh server sebagai Maker",
  rca_th_tahap: "Tahap Bermasalah",
  rca_th_deskripsi: "Deskripsi Isu",
  rca_th_root_cause: "Root Cause",
  rca_th_tindakan: "Tindakan / Rekomendasi",
  rca_th_pic: "PIC",
  rca_th_target: "Target",
  barging_list_title: "Daftar Shipment",
  barging_new_shipment_btn: "Shipment Baru",
  barging_loading: "Memuat data shipment...",
  barging_aktual_title: "Isi Tonase Aktual (Draft Survey)",
  barging_aktual_ph: "cth. 9000",
  barging_loading_log_title: "Loading Log",
  barging_add_loading_log: "Catat Penarikan Dome",
  barging_shift_report_title: "Laporan Shift",
  barging_add_shift_report: "Laporan Shift Baru",
  barging_sublot_title: "Sublot (Plan vs Aktual)",
  barging_add_sublot: "Isi Hasil Lab Sublot",
  barging_form_shipment_title: "Shipment Baru",
  barging_th_no_shipment: "No Shipment",
  barging_th_tanggal_mulai: "Tanggal Mulai",
  barging_th_ore_type: "Ore Type",
  barging_th_nama_tug: "Nama Tug",
  barging_th_nama_barge: "Nama Barge",
  barging_th_plan_tonase: "Plan Tonase",
  barging_th_plan_rit: "Plan Rit",
  barging_form_loadinglog_title: "Catat Penarikan Dome",
  barging_th_area: "Area",
  barging_th_dome_id: "Dome ID",
  barging_th_no_sublot: "No Sublot",
  barging_th_rit: "Rit",
  barging_th_tf: "TF (Tonnage Factor)",
  barging_form_shiftreport_title: "Laporan Shift Baru",
  barging_shiftreport_info: "Progress Ton, %, dan Kekurangan dihitung otomatis dari Loading Log yang sudah tercatat -- tidak perlu diketik manual.",
  barging_th_jam: "Jam",
  barging_th_status: "Status",
  barging_th_catatan: "Catatan / Kendala",
  barging_form_sublot_title: "Isi Hasil Lab Sublot",
  barging_sublot_info: "Tonase & kadar Plan dihitung otomatis dari Loading Log -- di sini cukup isi hasil X-Ray Aktual dari lab, DISC (selisih) dihitung otomatis.",
  barging_sublot_aktual_section: "Hasil X-Ray Aktual",
  barging_th_tonase_aktual: "Tonase Aktual",
  btn_save_generic: "Simpan",
  btn_add_validasi: "Input Data",
  validasi_form_title: "Input Data Validasi Test Pit",
  validasi_form_subtitle: "Catat hasil analisa assay per kedalaman ke sheet Validasi.",
  validasi_form_idtp: "ID TP",
  th_east: "Timur",
  th_north: "Utara",
  btn_save_validasi: "Simpan Data",
  validasi_search_placeholder: "Cari berdasarkan ID TP, Bench, Tipe Laterit...",
  validasi_th_idtp: "ID TP",
  validasi_th_area: "Area",
  validasi_th_tipe: "Laterit",
  validasi_th_meter: "Dalam (m)",
  validasi_th_grade: "Class Grade",
  validasi_th_status: "Status",
  validasi_chart_title: "Rata-rata Ni % per Area",
  validasi_view_chart: "Grafik",
  validasi_view_tp: "TP",

  validasi_avg_note: "Nilai parameter di tabel ini adalah rata-rata dari semua kedalaman (1-5 meter) yang sudah diukur. Klik baris untuk lihat rincian per kedalaman.",
  validasi_th_koordinat: "Timur / Utara",
  validasi_th_warna: "Warna",
  validasi_th_struktur: "Struktur",
  validasi_th_average: "Rata-rata (1-5m)",
  digging_detail_bench: "Bench",
  filter_all_pit: "Pit",
  rekon_date_to: "s/d",
  rekon_total_produksi: "Produksi",
  rekon_total_terkirim: "Ter-assign",
  periodic_report_title: "Laporan Berkala",
  periodic_report_subtitle: "Rangkuman rekonsiliasi siap kirim ke GM, pilih periode lalu Generate.",
  periodic_report_date_start: "Dari Tanggal",
  periodic_report_date_end: "Sampai Tanggal",
  periodic_report_preset_week: "Minggu Ini",
  periodic_report_preset_month: "Bulan Ini",
  periodic_report_generate: "Generate",
  periodic_report_empty: "Pilih periode lalu klik Generate untuk melihat laporan.",
  periodic_report_print: "Cetak / Simpan PDF",
  proreport_title: "Laporan Rekonsiliasi Profesional",
  proreport_subtitle: "Ringkasan F1-F4, Block Model vs GC vs Realisasi, & temuan RCA -- siap cetak/PDF.",
  proreport_print: "Cetak / Simpan PDF",
  rekon_selisih: "Selisih",
  rekon_persen_reconciled: "% Ter-reconcile",
  rekon_chart_title: "Breakdown/Pit",
  rekon_th_produksi: "Produksi (Ton)",
  rekon_th_efo: "EFO (Ton)",
  rekon_th_eto: "ETO (Ton)",
  rekon_th_direct: "Direct (Ton)",
  rekon_th_disposal: "Disposal (Ton)",
  rekon_th_belum: "Belum Dikirim (Ton)",
  rekon_th_menunggu: "Menunggu",
  rekon_view_breakdown: "Breakdown per Pit",
  rekon_view_pending: "Belum Ter-assign",
  rekon_view_blockmodel: "Block Model",
  rekon_view_matrix: "Matriks F1-F4",
  rekon_view_rca: "RCA Log",
  guide_title: "Panduan Rekonsiliasi (Developer)",
  guide_open_btn: "Lihat Panduan",
  guide_subtitle: "Urutan input dari hulu ke hilir -- pengingat kalau lupa cara pakai dashboard ini.",
  guide_pwa_url_label: "URL aplikasi (produksi/PWA):",
  guide_step0_title: "Reset Data -- Sheet Mana Boleh Dikosongkan?",
  guide_step0_intro: "Kalau mau mulai dari nol (proyek/site baru, atau bersih-bersih data lama), tidak semua sheet boleh diperlakukan sama. Sebagian sheet cuma catatan histori lapangan (aman dikosongkan), sebagian lagi acuan/aturan yang dipakai sistem untuk menghitung (JANGAN dikosongkan, cuma boleh DIEDIT nilainya kalau perlu).",
  guide_step0_data_title: "✅ Sheet DATA -- aman dikosongkan (hapus baris data, HEADER tetap dibiarkan)",
  guide_step0_data_list: "BlockModel, Validasi, Produksi_GC, PitActual, DomeLog, BargeShipment, BargeLoadingLog, BargeShiftReport, BargeSublot, RCA_Log, Masalah & Rekomendasi, ChatLog, TujuanChangeLog, JSA_Log, Production_Plan.",
  guide_step0_jantung_title: "🧬 Formula \"Jantung\" BlockModel -- 5 sel WAJIB tetap utuh (K2, O2, P2, Q2, R2)",
  guide_step0_jantung_desc: "Kelima sel ini di baris 2 sheet BlockModel berisi ARRAYFORMULA yang otomatis \"melimpah\" ke semua baris di bawahnya (bukan copy-paste per baris). Kalau salah satu terhapus/tertimpa manual, SELURUH kolom di bawahnya ikut kosong permanen -- P dan Q bergantung pada O, R bergantung pada Q, jadi kerusakan bisa merambat. Kalau ini sampai terjadi, tinggal copy-paste ulang formula persis di bawah ini ke sel yang sesuai (JANGAN diketik ulang manual, rawan typo):",
  guide_step0_jantung_catatan: "Catatan: kolom lain di BlockModel (O2:R2 melimpah dari baris 2, kolom K juga) aman disortir/difilter -- yang tidak boleh cuma mengetik/menghapus ISI sel K2, O2, P2, Q2, R2 itu sendiri. Sheet Validasi (kolom SM%) dan BargeSublot (kolom DISC Ni/DISC SiO2-MgO) TIDAK memakai pola ini -- nilainya ditulis sekali oleh backend/frontend saat submit, jadi kalau terhapus cukup input ulang manual per baris, tidak merambat ke baris lain.",
  guide_step0_config_title: "🔒 Sheet CONFIG/MASTER -- JANGAN dikosongkan, hanya EDIT nilainya kalau perlu",
  guide_step0_config_list: "COGConfig (batas Waste/LG/MG/HG/VHG per Tipe Ore -- dikosongkan = Tabel Digging & KPI grade error/fallback default), DomeConfig (daftar Dome aktif -- dikosongkan = tidak ada Dome yang bisa dipilih saat Assign Tujuan), Changelog (riwayat rilis versi -- tidak terkait data tambang sama sekali).",
  guide_step0_pertimbangan_title: "⚠️ Perlu dipikirkan dulu, tergantung maksud \"reset\"",
  guide_step0_pertimbangan_desc: "Sheet Member (data KPI staf/karyawan) biasanya TETAP dipertahankan kalau yang direset cuma data tambang -- hapus hanya kalau memang mau ganti tim juga. Kalau memang ikut direset lewat fitur \"Reset Total Pindah Proyek\" (Settings, Developer-only), baris akun Developer otomatis dipertahankan, cuma anggota tim lain yang dikosongkan. Penting: sheet Users/Credential (identitas login) TIDAK PERNAH ikut ter-reset apapun pilihannya -- jadi setelah Reset Total, seluruh anggota tim TETAP BISA LOGIN normal pakai PIN yang sama, cuma data KPI di tab \"KPI Member\" akan tampil kosong sampai diisi ulang manual. Ini bukan bug.",
  guide_step0_retention_desc: "Sheet Sessions, SecurityAuditLog, dan AuditTrail JUGA TIDAK PERNAH ikut ter-reset lewat Reset Total apapun pilihannya -- ketiganya dikelola terpisah lewat kebijakan Retention & Archive di panel Cleanup Data (Developer). Kalau toggle \"Aktifkan terjadwal\" di Retention & Archive sedang menyala, 14 checkbox sheet data operasional di bawah (semua kecuali ChatLog) otomatis terkunci tercentang semua supaya Reset Total selalu full-wipe konsisten -- matikan dulu toggle itu kalau Anda butuh reset sebagian saja.",
  guide_step0_urutan_title: "Urutan kalau benar-benar reset total",
  guide_step0_urutan_1: "1. Kosongkan sheet DATA (baris data saja, header tetap).",
  guide_step0_urutan_2: "2. Jangan sentuh COGConfig, DomeConfig, Changelog.",
  guide_step0_urutan_3: "3. Isi ulang BlockModel dulu (acuan awal rantai rekonsiliasi -- lihat Langkah 1).",
  guide_step0_urutan_4: "4. Baru lanjut Validasi -> Produksi_GC -> PitActual -> dst, sesuai urutan Langkah 1-8 di bawah.",
  cogconfig_modal_title: "Parameter COG (Cut of Grade)",
  cogconfig_modal_subtitle: "Ubah batas klasifikasi Waste/LG/MG/HG/VHG per Tipe Ore",
  cogconfig_select_tipe: "Tipe Ore yang Diatur",
  cogconfig_batas_waste_lg: "Batas Waste -> LG",
  cogconfig_batas_lg_mg: "Batas LG -> MG",
  cogconfig_batas_mg_hg: "Batas MG -> HG",
  cogconfig_batas_hg_vhg: "Batas HG -> VHG",
  cogconfig_urutan_note: "Urutan harus naik: Waste->LG < LG->MG < MG->HG < HG->VHG.",
  cogconfig_limo_aktif_title: "Aktifkan Pembedaan Sapro/Limo",
  cogconfig_limo_aktif_desc: "Kalau nonaktif, semua material dianggap Sapro (Tipe_Ore diabaikan).",
  cogconfig_sm_threshold: "Ambang SM% untuk Auto Detect",
  cogconfig_sm_threshold_note: "SM% >= ambang ini -> Limo. SM% < ambang ini -> Sapro. Dipakai saat Tipe Ore dipilih \"Auto Detect\".",
  cogconfig_target_ship: "Target Ni % Penjualan Kapal (Range)",
  cogconfig_target_ship_note: "Range spesifikasi kadar Ni% yang diminta pembeli kapal -- dipakai sebagai garis Min/Max di chart \"Kadar Ni % vs Target\" (Ringkasan), bukan batas klasifikasi grade material.",
  cogconfig_toleransi: "Ambang Toleransi Variance (Block Model vs Actual)",
  cogconfig_toleransi_note: "|Variasi %| <= WARNING -> OK. Di antara WARNING dan OUT OF TOL -> WARNING. > OUT OF TOL -> OUT OF TOL. Dipakai di badge tabel \"Block Model vs Actual\" (Rekonsiliasi).",
  cogconfig_warna_title: "Warna Flag per Grade",
  cogconfig_warna_note: "Dipakai untuk badge & warna angka Ni% di seluruh dashboard (Digging, Validasi, Rekonsiliasi, Export PDF) -- sesuaikan dengan standar warna flag perusahaan.",
  cogconfig_btn_cancel: "Batal",
  cogconfig_btn_save: "Simpan Parameter",
  parameter_global_title: "Atur Parameter (Global)",
  cogconfig_card_title: "COG (Cut of Grade)",
  cogconfig_card_desc: "Batas klasifikasi Waste/LG/MG/HG/VHG per Tipe Ore.",
  flagconfig_card_title: "Flag Warna",
  flagconfig_card_desc: "Warna badge & angka Ni% per Grade, sesuai standar perusahaan.",
  flagconfig_modal_subtitle: "Ubah warna badge & teks Ni% per Grade (5 preset warna)",
  bucketconfig_card_title: "Bucket & Sampel",
  bucketconfig_card_desc: "Konversi bucket ke tonase & batas sampel per Dome.",
  bucketconfig_modal_subtitle: "Atur konversi Bucket -> Tonase & batas sampel per Dome",
  cogconfig_wmt_bucket: "WMT per Bucket (Tipe Ore terpilih di atas)",
  cogconfig_wmt_bucket_note: "Estimasi ton (wmt) per 1 bucket PC220, beda per Tipe Ore sesuai density masing-masing.",
  cogconfig_bucket_sampel: "Bucket per Sampel (Karung)",
  cogconfig_bucket_sampel_note: "Berlaku global (bukan per Tipe Ore).",
  cogconfig_sampel_dome: "Batas Maksimal Sampel per Dome",
  cogconfig_sampel_dome_note: "Berlaku global -- pengingat kapan GC sebaiknya stop & buka Dome baru untuk jaga kualitas material.",
  guide_step1_title: "Block Model (BM) -- Acuan Awal",
  guide_step1_p1: "Ini titik awal dari semuanya. Sebelum tambang mulai kerja di suatu Blok, hasil hitungan cadangan dari Surpac (metode IDW/Kriging) sudah harus tercatat -- estimasi tonase & kadar per Blok dan Pit.",
  guide_step1_p2: "Cara input: langsung ke sheet \"BlockModel\" di Google Sheets (bukan lewat dashboard). Kolom penting: Id_blok, Pit, Estimasi_tonase, Estimasi_Ni %, Status_Depletion (isi \"Selesai\" begitu Blok itu tuntas ditambang, supaya perhitungan Loss/Dilusi & Matriks F1-F4 ikut memperhitungkannya).",
  guide_step1_p3: "Kapan: sebelum digging dimulai di Blok itu. 1 Blok bisa punya banyak Pit (misal L-01 = Avanza + Honda + Yamaha).",
  guide_step2_title: "Validasi (Test Pit) -- Cek Sebelum Gali",
  guide_step2_p1: "Sebelum suatu titik digali, cek dulu apakah kadar sebenarnya di situ mendekati prediksi Block Model. Pakai excavator arm 5 meter, ukur per kedalaman 1-5m.",
  guide_step2_p2: "Cara input: tab \"Validasi\" > tombol \"Input Data\" > isi per kedalaman (1 titik TP bisa sampai 5 baris, 1 per meter).",
  guide_step2_p3: "Lihat hasilnya: di tab Rekonsiliasi > Block Model, kolom \"Validasi (Ni %)\" menampilkan rata-rata Ni% dari titik TP di Blok itu dibanding prediksi BM (angka dalam kurung = selisih). Ini cuma pengecekan dini, BUKAN bagian dari perbandingan Estimasi/Realisasi.",
  guide_step3_title: "Tabel Digging (Grade Control) -- Assay Saat Gali",
  guide_step3_p1: "Ini tahap \"GC\" (Grade Control) -- pencatatan assay yang sebenarnya, pas material digali di lapangan. Ini yang jadi angka Realisasi di perbandingan dengan Block Model.",
  guide_step3_p2: "Cara input: tab \"Tabel Digging\" > tombol \"Input Data\" > isi Tanggal, Shift, Pit, Blok, Tipe Ore (Sapro/Limo/Auto Detect -- WAJIB dipilih), ID Sampel, Total Sampel (jumlah karung -- WAJIB), dan assay lengkap (Ni/Fe/Co/MgO/SiO2). Tonase TIDAK diketik manual lagi -- dihitung otomatis dari Total Sampel x Bucket per Sampel x WMT per Bucket (lihat Settings > Parameter > Bucket & Sampel). Class_Grade (Waste/LG/MG/HG/VHG) juga tidak dipilih manual, dihitung otomatis dari Ni% + Tipe Ore begitu data disimpan. ID Sampel WAJIB diisi supaya bisa dilacak nanti.",
  guide_step3_p3: "Tujuan (EFO/ETO/dst) belum perlu diisi di tahap ini -- itu keputusan susulan (lihat Langkah 4).",
  guide_step4_title: "Assign Dome -- Tentukan Tujuan Material",
  guide_step4_p1: "Setelah digali, tim QC di area EFO/ETO memutuskan material ini numpuk ke Dome mana (berdasarkan kadar yang mirip & Dome itu masih ada slot).",
  guide_step4_p2: "Cara input: buka baris di Tabel Digging > \"Update Tujuan & ID Pengapalan\" > pilih Tujuan (ETO/EFO/Tongkang, atau kombinasi Split kalau materialnya kepecah ke 2 tujuan) > pilih Dome dari daftar yang muncul, atau \"Buka Dome Baru\" kalau semua penuh.",
  guide_step4_p3: "Riwayat lengkap tiap Dome (siapa isi kapan, blending kadar) bisa dilihat lewat tombol \"Lihat Riwayat Dome\" di baris yang sudah di-assign.",
  guide_step5_title: "Pit Actual -- Ritase Weighbridge",
  guide_step5_p1: "Verifikasi independen berapa ton yang benar-benar keluar dari Pit, dihitung dari Ritase (jumlah dump truck) dikali TF (Tonnage Factor, 25-27 ton tergantung keputusan perusahaan). Ini murni tonase, tanpa kadar -- sama seperti fungsi weighbridge di lapangan.",
  guide_step5_p2: "Cara input: tab \"Rekonsiliasi\" > toggle \"Matriks F1-F4\" > tombol \"Catat Pit Actual\" > isi Tanggal, Shift, Blok, Pit, Rit, TF. Tonase dihitung otomatis.",
  guide_step6_title: "Barging / Plant -- Pengapalan",
  guide_step6_p1: "Tahap paling hilir -- material dari Dome dimuat ke tongkang/kapal. Ini titik verifikasi paling akhir dan paling independen (Tonase Aktual dari draft survey, dikonfirmasi Captain kapal).",
  guide_step6_p2: "Urutan input di tab \"Barging\": (a) \"Shipment Baru\" -- buat trip kapal baru; (b) buka shipment itu > \"Catat Penarikan Dome\" tiap kali Dome ditarik ke kapal (per shift); (c) \"Laporan Shift Baru\" -- catatan progress & kendala tiap shift (Progress dihitung otomatis); (d) setelah kapal selesai dimuat, isi \"Tonase Aktual\" (langsung di modal detail shipment) -- status otomatis jadi \"Selesai\"; (e) kalau ada hasil lab X-Ray, isi juga \"Hasil Lab Sublot\" (Plan dihitung otomatis, tinggal isi Aktual, DISC dihitung otomatis).",
  guide_step7_title: "Baca Hasil -- Rekonsiliasi & RCA Log",
  guide_step7_p1: "Setelah semua tahap di atas jalan, tab \"Rekonsiliasi\" otomatis menghitung semuanya:",
  guide_step7_p2: "-- Block Model vs Actual: Variasi % kuning = Loss, merah = Dilusi (cuma berlaku Blok yang sudah final). Badge OK/WARNING/OUT OF TOL di sebelahnya menunjukkan seberapa besar penyimpangannya, ambangnya bisa diatur di Settings > Parameter > COG. Baris OUT OF TOL ada ikon petir (Developer) untuk langsung buka Form RCA dengan Blok/Pit sudah terisi.",
  guide_step7_p3: "-- Matriks F1-F4: F1 (GC/BM) & F2 (Pit Actual/GC) per Blok+Pit -- bisa dilacak. F3 (Plant/Pit Actual) & F4 (Plant/BM) cuma level total -- karena material sudah tercampur di Dome, tidak bisa dilacak balik per Blok. BARU: banner merah EWS otomatis muncul di atas tabel kalau ada Blok/Pit dengan deviasi F2 >5% -- baris yang OUT OF TOL punya ikon petir (Developer) untuk langsung buka Form RCA dengan Blok/Pit & Tahap Bermasalah (\"Pit Actual\") sudah terisi otomatis.",
  guide_step7_p4: "-- RCA Log: kalau ada penyimpangan yang perlu dijelaskan (misal F1 jauh di bawah 100%), catat lewat tombol \"RCA Baru\" -- pilih Tahap Bermasalah (BM/Validasi/GC/Pit Actual/Plant), tulis Root Cause & Tindakan. Ini yang jadi bahan laporan ke GM.",
 guide_step8_title: "Laporan ke GM -- Weekly & Monthly",
 guide_step8_intro: "Laporan berkala (dari tombol ikon dokumen indigo) BUKAN sumber data baru -- semua bahannya sudah ada di tab-tab yang dibahas di Langkah 1-7 di atas, tinggal dirangkum sesuai periode. Untuk laporan siap-cetak formal (Ringkasan Eksekutif F1/F2/F4 + tabel 3-Tahap BM/GC/Realisasi + Temuan RCA terbuka dalam 1 dokumen), pakai tombol ikon dokumen merah \"Laporan Rekonsiliasi Profesional\" di sebelahnya -- datanya juga live, tinggal klik & cetak/PDF tanpa perlu pilih periode.",
 guide_step8_weekly_title: "Weekly -- fokus operasional, cepat tangkap masalah",
 guide_step8_weekly_1: "1. Progress per Blok/Pit minggu ini -- dari Rekonsiliasi > Block Model vs Actual. Lihat mana yang jalan sesuai rencana, mana yang belum.",
 guide_step8_weekly_2: "2. Loss/Dilusi Blok yang baru \"Aman\"/\"Tidak Aman\" minggu ini -- dari kolom Variasi % (kuning/merah). Deteksi dini sebelum penyimpangan menumpuk.",
 guide_step8_weekly_3: "3. Cross-check Validasi vs BM untuk Blok yang mau digali -- klik baris di popup Detail (Rekonsiliasi > Block Model vs Actual), bukan lagi kolom terpisah di tabel utama. Peringatan dini sebelum salah rencana tambang.",
 guide_step8_weekly_4: "4. RCA yang masih Open/Progress -- dari RCA Log, filter Status. GM perlu tahu apa yang sedang ditangani, siapa PIC-nya.",
 guide_step8_weekly_5: "5. Progress shipment aktif -- dari tab Barging, shipment berstatus Loading. Kapal mana yang lagi jalan, berapa persen termuat.",
 guide_step8_weekly_6: "6. Isu lapangan minggu ini -- dari tab Issue & Action. Kendala operasional non-rekonsiliasi (cuaca, alat, dll).",
 guide_step8_monthly_title: "Monthly -- fokus strategis, gambaran besar & akuntabilitas",
 guide_step8_monthly_1: "1. F1-F4 kumulatif sebulan -- dari Matriks Rekonsiliasi F1-F4. Ini \"rapor\" akurasi sistem dari hulu ke hilir.",
 guide_step8_monthly_2: "2. Total Loss/Dilusi sebulan -- BARU: sekarang tampil otomatis dalam satuan Ton (bukan cuma %) di kartu ringkasan Rekonsiliasi & Laporan Berkala, tidak perlu direkap manual lagi. Dampak keseluruhan, bukan cuma per-Blok.",
 guide_step8_monthly_3: "3. Semua RCA Closed bulan ini + tren akar masalah -- dari RCA Log, filter Closed. BARU: pengelompokan per Status & Tahap Bermasalah sekarang muncul otomatis sebagai badge ringkasan di Laporan Berkala, tidak perlu dikelompokkan manual lagi. Cek pola berulang di tahap mana.",
 guide_step8_monthly_4: "4. Rekap shipment selesai bulan ini -- dari tab Barging, shipment yang Tonase Aktual-nya sudah terisi. Total realisasi pengapalan vs target bulanan.",
 guide_step8_monthly_5: "5. DISC Sublot rata-rata bulanan -- BARU: sekarang dihitung & tampil otomatis sebagai kartu ringkasan di Laporan Berkala (rata-rata DISC Ni & SiO2/MgO dari Sublot yang shipment-nya masuk periode laporan), tidak perlu dicari manual dari BargeSublot lagi. Akurasi estimasi kadar kapal secara keseluruhan.",
 guide_step8_note: "Catatan: BARU -- perbandingan bulan ini vs bulan lalu sekarang otomatis, lihat toggle \"Bulan ke Bulan\" di tab Visual & Trend (kartu delta Tonase & Ni% + chart 6 bulan terakhir).",
 guide_step9_title: "JSA & Keselamatan Kerja (Safety)",
 guide_step9_p1: "BARU: dokumen Job Safety Analysis (JSA-MINEGEO-2026-REV02) sekarang terintegrasi langsung di dashboard, bukan file terpisah. Tombol \"Lihat JSA\" ada di panel Settings, terbuka untuk SEMUA orang (bukan developer-only).",
 guide_step9_p2: "-- Di dalam modal JSA ada 2 tombol pintas: \"Catat RCA dari JSA\" (kalau sadar ada bahaya belum tertangani saat baca JSA, langsung buka Form RCA dengan penanda asal terisi otomatis) dan \"TTD & Konfirmasi Kehadiran\" (self-service, setiap member konfirmasi sendiri bahwa sudah membaca JSA & hadir Toolbox Meeting hari itu -- TIDAK perlu PIN Developer).",
 guide_step9_p3: "-- Hasil TTD & kehadiran toolbox tersimpan di sheet JSA_Log, lalu muncul sebagai badge \"JSA: Nx TTD · Nx Toolbox\" di kartu KPI Member masing-masing -- versi awal cuma hitung frekuensi (Compliance), BELUM ada skor pemahaman/kuis (Competency, masih ditahan untuk versi berikutnya).",
 guide_step9_p4: "-- Koneksi ke Matriks F1-F4: baris F2 yang OUT OF TOL (>5%) juga punya tombol Quick Link RCA sendiri, otomatis isi Tahap Bermasalah \"Pit Actual\" -- supaya RCA yang tercipta dari penyimpangan rekonsiliasi maupun dari review JSA sama-sama konsisten kategorinya untuk pengelompokan otomatis di Laporan Berkala (lihat Langkah 8).",
 guide_step10_title: "Security & Policy -- Akses, Session & Aturan Penggunaan",
 guide_step10_p1: "Security dasar aplikasi sudah terintegrasi: Login Developer dan Login Member dipisahkan, session divalidasi ke server, token tidak ditampilkan sebagai token mentah di log session, serta status session dapat berakhir karena EXPIRED atau ditutup dengan LOGOUT.",
 guide_step10_p2: "Member login tetap dilakukan dari tabel KPI Member. Setelah berhasil login, identitas Member muncul sebagai icon ME; menu tersebut menyediakan Log Out. Setelah logout, icon ME hilang dan session Member ditutup di server.",
 guide_step10_p3: "Akses Developer digunakan untuk fungsi administrasi/input yang memang dibatasi. Developer harus membuka akses dengan Login_ID + email terdaftar + PIN aplikasi, dan setelah selesai dapat menguncinya kembali. Jangan membagikan PIN, token, atau kredensial kepada orang lain.",
 guide_step10_p4: "Policy data: sheet DATA boleh dikosongkan hanya saat reset yang memang direncanakan; sheet CONFIG/MASTER dan formula inti BlockModel tidak boleh dihapus sembarangan. Perubahan penting harus tetap dapat ditelusuri melalui log/session dan riwayat update.",
 guide_step10_p5: "Policy operasional: gunakan hak akses minimum yang diperlukan, selalu Logout setelah selesai, jangan meninggalkan session aktif di komputer bersama, dan lakukan review user/role/permission secara berkala. Jika ada anomali akses atau perubahan data yang tidak dikenal, hentikan penggunaan dan periksa log Security/Audit sebelum melakukan perubahan lebih lanjut.",
 guide_step10_p6: "Catatan: ini adalah Security & Policy baseline v90.2.15. Hardening lanjutan seperti rate-limit/brute-force protection, rotasi token terjadwal, dan review permission berkala dapat ditambahkan sebagai tahap penguatan berikutnya tanpa mengubah alur kerja utama.",
 guide_step11_title: "Deploy & Update PWA -- Checklist Tiap Rilis",
 guide_step11_p1: "BARU: dashboard ini sekarang punya Service Worker (file sw.js, taruh di folder yang SAMA PERSIS dengan index.html) yang memunculkan toast \"Versi baru tersedia\" ke semua user begitu file di-update di GitHub -- ini yang sebelumnya TIDAK PERNAH ada di proyek ini.",
 guide_step11_p2: "WAJIB dilakukan SETIAP kali deploy versi baru (jangan sampai lupa, ini bukan otomatis):",
 guide_step11_p3: "1. Update nomor versi di baris const APP_VERSION pada index.html (dashboard.html) seperti biasa.",
 guide_step11_p4: "2. Buka file sw.js, ganti baris const CACHE_NAME = 'mine-geologist-vX.X.X'; supaya angkanya SAMA PERSIS dengan APP_VERSION yang baru. Kalau baris ini TIDAK diubah, browser akan menganggap sw.js \"tidak berubah\" (dibandingkan byte-per-byte) dan toast update TIDAK AKAN PERNAH muncul, walau index.html-nya sendiri sudah beda total.",
 guide_step11_p5: "3. Upload ULANG kedua file (index.html dan sw.js) ke folder yang sama di GitHub Pages. Tunggu sekitar 1 menit -- toast \"Versi baru tersedia\" akan muncul otomatis di pojok kanan bawah untuk semua user yang sedang membuka dashboard (desktop maupun Android), tanpa perlu reload paksa (user pilih sendiri kapan klik \"Muat Ulang\").",
 guide_step11_p6: "Catatan: Service Worker ini sengaja HANYA menyimpan cache untuk file statis (HTML shell, manifest, ikon) -- data live (dashboard, chat, RCA, dsb dari Google Sheets) TIDAK PERNAH ikut di-cache, selalu diambil segar dari server setiap saat.",
 guide_step12_title: "KPI & Performance Member -- Mekanisme (RENCANA)",
 guide_step12_p0: "STATUS: BELUM DIIMPLEMENTASI. Ini catatan hasil diskusi mekanisme (27 Agu) sebagai reminder sebelum dieksekusi ke sheet KPIConfig/KPIEvent -- bukan fitur yang sudah berjalan di dashboard.",
 guide_step12_p1: "Prinsip dasar: controllability. Hanya masukkan ke KPI individu Geologist hal-hal yang benar-benar dia kontrol. Tonase harian TIDAK dijadikan pilar utama -- itu tanggung jawab campuran operator excavator + mine plan, bukan murni Grade Control.",
 guide_step12_p2: "5 Pilar (revisi): Kehadiran, Safety (JSA+APD), Kelengkapan Sampling (pengganti \"Produksi\"), Laporan Tepat Waktu, Attitude (Disiplin/Kerja Sama/Inisiatif/Integritas dari Supervisor). 3 opsi bobot (Balanced/Safety First/Data-Integrity Driven) dipilih GM, diatur Developer -- rencana ditaruh di kartu baru \"Formula KPI\" sejajar Atur Parameter Global.",
 guide_step12_p15: "BARU (28 Agu): nama Pilar 3 DIPERSEMPIT dari \"Kelengkapan Sampling & Ketepatan Assay\" jadi \"Kelengkapan Sampling\" SAJA -- ketepatan assay TETAP eksklusif jadi proksi Pilar 4 (hitungProksiKetepatanAssay_), supaya 1 keterlambatan assay tidak dihukum 2x (melanggar prinsip Anti Dobel-Hukuman guide_step12_p7). Pilar 3 murni kuantitas: (Sampel dgn Ni% terisi / Total baris disubmit) * 100, TIDAK peduli kapan diisinya.",
 guide_step12_p3: "Kartu \"Kualitas Grade Control Bulanan\" (terpisah dari skor KPI gabungan): Ni% tertimbang = SUM(Tonase x Ni%) / SUM(Tonase) per Member per bulan, dibandingkan ke rentang COGConfig min-max (atau Estimasi Block Model kalau data cukup). Tonase tetap ditampilkan tapi bobot kecil (peringkat 3, bukan penentu). Jumlah sampel ditampilkan apa adanya TANPA ambang minimum -- ambang batas cuma pindahkan masalah controllability yang sama ke tempat lain.",
 guide_step12_p4: "Celah \"Menunggu Assay\" (2 lapis pengaman, WAJIB ada sebelum kartu Ni% dipakai): (1) Assay yang tidak di-update dalam N hari (default 3 hari, configurable di Developer Console) otomatis jadi penalti ke pilar Laporan Tepat Waktu -- supaya menggantungkan data ada konsekuensinya. (2) Hitung terpisah tingkat penyelesaian = Sampel ter-assay lengkap / Total sampel disubmit.",
 guide_step12_p5: "Eligible Day, bukan hari dinilai 0. Hari yang memang tidak bisa dinilai karena faktor eksternal DIKELUARKAN dari pembagi (denominator), bukan dihitung sebagai pencapaian nol. 3 jenis: Full Exclusion (libur nasional, demo besar sampai tutup total -- instruksi manajemen ke Head Dept), Partial Adjustment (breakdown alat/hujan parsial -- target hari itu disesuaikan proporsional sesuai jam tersedia), Member Exclusion (cuti/izin -- khusus 1 orang, rekan lain yang tetap masuk tetap dinilai normal).",
 guide_step12_p6: "Alur pengajuan-persetujuan (FINAL, 27 Agu; DIKONFIRMASI dari RolePermissions asli 28 Agu): sistem cuma punya 4 role -- PUBLIC/MEMBER/SUPERVISOR/DEVELOPER, TIDAK ADA role Head Dept terpisah. Head Department Mine Geologist = Developer, orang yang sama. Status PENDING (baru diajukan) -> APPROVED (disahkan Developer, sistem hitung ulang otomatis) -> REJECTED (ditolak, kembali ke perhitungan normal). Permission SUDAH ADA di sheet: kpi_event.create = MEMBER+SUPERVISOR+DEVELOPER, kpi_event.approve = DEVELOPER saja (persis pola rca.close), attitude.assess = SUPERVISOR+DEVELOPER. Setiap perubahan tersimpan sbg audit trail.",
 guide_step12_p9: "Rumus Partial Adjustment DIBEDAKAN menurut jenis kejadian (27 Agu): Hujan cuma pakai Jam Hilang (tim langsung lanjut begitu reda, tanpa waktu pemulihan). Breakdown Alat pakai Jam Hilang + Jam Recovery (butuh waktu tambahan pemanasan mesin & pindah front setelah alat normal). Contoh: breakdown 2 jam + recovery 1 jam dari 10 jam kerja -> target disesuaikan proporsional thd 7 jam tersisa (BUKAN 8 jam). Sheet KPIEvent butuh 2 kolom terpisah (Jam Hilang, Jam Recovery) supaya fakta yg disaksikan & estimasi tambahan tetap bisa ditelusuri terpisah saat diaudit. Validasi wajib: kalau (Jam Hilang+Jam Recovery) >= Jam Kerja Normal, kejadian otomatis jadi Full Exclusion, bukan Partial Adjustment lagi.",
 guide_step12_p7: "Anti dobel-hukuman: Keterlambatan cuma dihitung 1 tempat (jangan dipotong di Kehadiran DAN Attitude->Disiplin sekaligus). Skor tiap pilar dibatasi maksimal 100 -- kalau mau beri penghargaan pencapaian di atas target, buat Bonus terpisah, jangan campur ke skor pilar.",
 guide_step12_p8: "STATUS 28 Agu -- SEMUA LAPISAN DATA SUDAH DIBUAT. Sheet KPIEvent (17 kolom) dan Attitude (9 kolom) sudah dibuat di Google Sheets. SecurityConfig sudah ditambah 5 baris KPI_*. RolePermissions sudah ditambah kpi_event.create/approve + attitude.assess, dikonfirmasi persis sesuai desain. Yang tersisa murni lapisan KODE: backend (Code.gs -- addKpiEvent, approveKpiEvent, submitAttitudeAssessment, calculation engine) dan frontend (form pengajuan, panel approval, kartu skor KPI).",
 guide_step12_p10: "BARU (27 Agu, diadopsi dari audit dokumen pihak lain): Kehadiran administratif (Cuti/Izin) TIDAK mengurangi Attendance -- dikeluarkan dari Eligible Working Days, sama prinsip dgn Full Exclusion. TIDAK butuh field/sheet baru -- reuse data JSA_Log attendance_status (Hadir/Izin/Cuti) yang sudah berjalan lewat addJsaLog. Sakit belum dimasukkan (belum ada penyimpanan bukti medis) -- kalau nanti perlu, jadi status ke-4 di attendance_status yang sama, bukan mekanisme baru.",
 guide_step12_p11: "BARU (27 Agu): Safety Gate opsional (ON/OFF, default OFF, key KPI_SAFETY_GATE_ENABLED+KPI_SAFETY_GATE_THRESHOLD di SecurityConfig) -- pengaman tambahan supaya pilar lain yg tinggi tidak \"menutupi\" Safety yang buruk, BUKAN pengganti Safety Score. Kategori \"Tidak Diwajibkan\" pada pilar Laporan -- efek OTOMATIS dari hari Full Exclusion (bukan KPIEvent terpisah), dikeluarkan dari denominator Laporan, beda dari laporan yang memang telat/gagal. DITOLAK dari dokumen sama: Production/Tonase balik jadi pilar KPI (kontradiksi keputusan controllability yg sudah dikunci). DITUNDA: JSA partial-score per item (fitur skrng masih konfirmasi biner), Union Time (antisipasi kasus yg belum tentu terjadi).",
 guide_step12_p12_title: "STATUS 28 Agu -- Pilar 4 (Laporan Tepat Waktu) SELESAI & live (badge sudah tampil di kartu KPI Member). Panduan uji skenario KPIEvent di bawah -- BELUM dijalankan user, masih ditunda sampai pilar lain selesai.",
 guide_step12_p13: "Cara uji skenario KPIEvent Full Exclusion (utk dijalankan nanti): (1) Tab KPI Member -> \"Ajukan Kejadian\" -> Jenis=Full Exclusion, isi Tanggal Kejadian & Alasan. (2) Login Developer (akun BEDA dari pengaju, anti self-approve) -> approve di panel KPIEvent. (3) Cek ?sheet=kpiscore&member_id=NAMA&periode=yyyy-MM -- field eligible_days harus turun 1 dari total hari kalender bulan itu.",
 guide_step12_p14: "FIXED 28 Agu (v90.2.115): eligible_days sekarang JADI PENYEBUT nyata di Pilar 4 -- formula di-loop per HARI ELIGIBLE (bukan per baris yg ada disubmit lagi), hari TANPA submission sama sekali dihukum sbg gagal lapor, hari yg dikecualikan KPIEvent APPROVED (Full/Member Exclusion) otomatis tidak ikut dinilai. 1 hari dgn >1 baris (beda Pit) dianggap on-time cuma kalau SEMUA baris hari itu on-time. Tervalidasi 4 test simulasi Node.js termasuk skenario persis yg diminta user (hari kosong = gagal, Full Exclusion beneran ubah skor).",
  blockmodel_title: "Block Model vs Actual",
  blockmodel_th_blok: "Blok",
  blockmodel_th_ni: "Ni % (Est -> Akt)",
  blockmodel_th_fe: "Fe % (Est -> Akt)",
  blockmodel_th_sm: "SM % (Est -> Akt)",
  blockmodel_th_estimasi: "Estimasi (Ton)",
  blockmodel_th_realisasi: "Realisasi (Ton)",
  blockmodel_th_variasi: "Variasi %",
  blockmodel_th_status: "Status",
  blockmodel_variance_note: "Variasi % berwarna kuning = Loss (Realisasi < Estimasi), berwarna merah = Dilusi (Realisasi > Estimasi). Pewarnaan cuma berlaku untuk blok berstatus Aman/Tidak Aman -- blok Menunggu Data belum bisa dinilai. Klik baris untuk lihat detail lengkap perbandingan kimia (Ni/Fe/Co/MgO/SiO2/SM) Estimasi vs Aktual, termasuk cross-check Validasi (Test Pit).",
  blockmodel_detail_title: "Detail Perbandingan Kimia",
  blockmodel_detail_validasi_label: "Validasi (Test Pit, sebelum digali)",
  blockmodel_detail_th_param: "Parameter",
  blockmodel_detail_th_est: "Estimasi",
  blockmodel_detail_th_akt: "Aktual",
  blockmodel_detail_th_selisih: "Selisih",
  nav_issue: "Issue & Action",
  nav_kpimember: "KPI Member",
  nav_chat: "Chat Tim",
  nav_settings: "Settings",
  chat_title: "Chat Tim Geologi",
  chat_subtitle: "Pesan tersimpan otomatis ke Google Sheets (sheet ChatLog).",
  chat_identity_label: "Kirim sebagai:",
  chat_loading: "Memuat pesan...",
  chat_input_placeholder: "Tulis pesan...",
  page_title_ringkasan: "Laporan Harian Geologist",
  sub_live_api: "Ringkasan performa produksi & kadar tambang hari ini",
  all_pit: "Semua Pit",
  btn_export: "Ekspor Laporan",
  opt_csv: "📊 Ekspor CSV",
  opt_pdf: "📄 Ekspor PDF",
  opt_word: "📝 Ekspor Word",
  auto_refresh: "Auto Refresh:",
  auto_refresh_value: "60 Detik",
  sync_status_label: "Status Sinkronisasi:",
  sync_connecting: "Menghubungkan...",
  session_idle_warning: "Sesi akan berakhir dalam sekitar {minutes} menit karena tidak ada aktivitas.",
  tooltip_refresh_data: "Refresh data manual dari Google Sheets",
  tooltip_toggle_theme: "Ganti tema Dark/White",
  tooltip_sidebar_collapse: "Ciutkan/Lebarkan Sidebar",
  tooltip_print_view: "Cetak tampilan halaman ini (khusus Developer)",
  tooltip_export_report: "Ekspor Laporan",
  tooltip_active_member: "Member aktif",
  tooltip_filter_date_pit: "Filter Tanggal & Pit",
  tooltip_filter_pit: "Filter berdasarkan Pit",
  tooltip_filter_start: "Filter Tanggal Mulai",
  tooltip_filter_end: "Filter Tanggal Akhir",
  tooltip_reset_filter: "Reset Filter Tanggal & Pit",
  tooltip_periodic_report: "Laporan Berkala",
  tooltip_professional_report: "Laporan Rekonsiliasi Profesional",

  tooltip_cog: "Atur COG",
  tooltip_flag: "Atur Flag",
  tooltip_bucket: "Atur Bucket",
  tooltip_show_pin: "Tampilkan PIN",
  tooltip_developer_access: "Buka Akses Developer",
  tooltip_credential_manager: "Kelola Credential User yang belum memiliki Credential",
  credential_manager_title: "Credential Manager (Developer)",
  credential_manager_desc: "Daftar User aktif yang belum mempunyai record di sheet Credential. Fitur ini hanya membuat Credential; tidak membuat/mengubah User, Member, Role, atau Permission.",
  credential_manager_loading: "Memuat User yang belum memiliki Credential...",
  tooltip_close: "Tutup",
  tooltip_member_input_rule: "3-40 karakter: huruf, angka, titik, garis bawah, atau tanda minus",
  tooltip_pin_rule: "PIN harus tepat 6 digit",
  member_empty: "Belum ada data member pada Google Sheets. Silakan isi form terlebih dahulu.",
  member_load_error: "Gagal memuat data member dari Google Sheets.",
  retry: "Coba Lagi (Retry)",
  kpi_1: "TOTAL DIGGING",
  kpi_1_sub: "Target Harian Tercapai",
  unit_ton: "Ton",
  kpi_2: "TOTAL ORE",
  kpi_3: "RATA-RATA NI %",
  kpi_3_sub: "Target Min: 1.30% Aman",
  kpi_3b: "RATA-RATA NI %",
  kpi_3b_sub: "Hanya Saprolit, Limonit & LG",
  kpi_ore_sub: "Saprolit, Limonit & LG",
  kpi_4: "STRIP RATIO (SR)",
  chart_1_title: "Distribusi Material Per Blok",
 summary_bm_estimasi: "Total Estimasi Block Model",
 summary_bm_estimasi_ni: "Ni % Estimasi",
 summary_bm_realisasi: "Total Realisasi Aktual",
 summary_bm_realisasi_ni: "Ni % Realisasi",
 summary_bm_variance: "Variance Keseluruhan",
  chart_2_title: "Kadar Ni % vs Target per Jenis Material",
  trend_box_1: "Puncak Produksi Harian Tertinggi",
  trend_box_2: "Kadar Nikel Tertinggi Terpantau",
  trend_box_status: "Stabil",
  trend_box_3: "Indeks Kestabilan Kadar Grade",
  trend_1_title: "Tren Tonase Digging (Harian)",
  trend_1_desc: "Aktual kapasitas produksi material harian di front penambangan.",
  btn_trend_tonase: "Tonase Digging",
  btn_trend_ni: "Fluktuasi Ni %",
  btn_trend_sm: "Distribusi SM",
  btn_trend_monthly: "Bulan ke Bulan",
  trend_monthly_tonase_label: "Tonase Bulan Ini vs Bulan Lalu",
  trend_monthly_ni_label: "Rata-rata Ni % Bulan Ini vs Bulan Lalu",
  search_placeholder: "Cari berdasarkan Blok, Material, Pit...",
  all_material: "Semua Material",
  th_no: "No",
  th_date: "Tanggal",
  th_day: "Shift",
  th_pit: "Pit",
  th_block: "Blok",
  th_material: "Material",
  th_id_sampel_col: "ID Sampel",
  th_total_sampel: "Total Sampel",
  th_tonnage: "Tonase",
  th_ni: "Ni %",
  th_fe: "Fe %",
  th_co: "Co %",
  th_mgo: "MgO %",
  th_sio2: "SiO2 %",
  th_sm: "SM %",
  th_id_efo: "ID EFO",
  th_id_eto: "ID ETO",
  th_ship: "Ship",
  th_status: "Status Grade",
  th_reporter_col: "Pelapor",
  export_source_label: "Sumber Data",
  export_source_digging: "Tabel Digging",
  export_source_member: "KPI Member",
  export_source_rekonsiliasi: "Rekonsiliasi",
  export_source_validasi: "Validasi",
  export_source_rca: "RCA Log",
  export_orientation_label: "Orientasi Cetak",
  export_orientation_portrait: "Potrait",
  export_orientation_landscape: "Landscape",
  export_th_nama: "Nama",
  export_th_jabatan: "Jabatan",
  export_th_inspeksi: "Inspeksi Bench",
  export_th_accuracy: "Accuracy",
  export_th_status: "Status",
  export_th_grade: "Grade",
  digging_form_btn: "Input Data",
  digging_form_title: "Input Data Produksi Digging",
  digging_form_subtitle: "Catat hasil produksi & assay harian ke sheet Produksi_GC.",
  digging_form_date: "Tanggal",
  digging_form_date_locked: "Otomatis hari ini, tidak bisa diubah.",
  digging_form_shift: "Shift",
  digging_form_weather: "Cuaca",
  digging_form_reporter: "Pelapor",
  digging_form_pit: "Pit",
  digging_form_block: "Blok",
  digging_form_tipe_ore: "Tipe Ore",
  digging_form_sample_id: "ID Sampel",
  digging_form_total_sampel: "Total Sampel (Karung)",
  digging_form_tonase: "Tonase (Otomatis)",
  digging_form_tonase_note: "Total Sampel x Bucket per Sampel x WMT per Bucket (Settings > Bucket & Sampel).",
  digging_form_ni: "Ni %",
  digging_form_fe: "Fe %",
  digging_form_co: "Co %",
  digging_form_tujuan: "Tujuan",
  update_tujuan_cancel_btn: "Batal",
  digging_form_mgo: "MgO %",
  digging_form_sio2: "SiO2 %",
  digging_form_sm: "SM %",
  digging_form_auto: "(otomatis)",
  digging_form_destination: "Tujuan",
  digging_form_ship: "Nama Ship",
  digging_form_footer_note: "Pastikan data assay akurat sebelum disimpan.",
  btn_save_digging: "Simpan Data",
  digging_detail_title: "Detail Baris Produksi",
  digging_detail_waktu_input: "Waktu Input",
  digging_detail_weather: "Cuaca",
  digging_detail_sample_id: "ID Sampel",
  digging_detail_destination: "Tujuan",
  digging_detail_ship: "Nama Ship",
  digging_detail_reporter: "Pelapor",
  digging_detail_shipping_tracking: "Tracking ID Pengapalan",
  digging_detail_id_efo: "ID EFO",
  digging_detail_id_eto: "ID ETO",
  digging_detail_keterangan: "Keterangan",
  digging_detail_update_btn: "Update Tujuan & ID Pengapalan",
  digging_detail_update_assay_btn: "Update Hasil Assay",
  update_assay_title: "Update Hasil Assay",
  update_assay_notice: "Isi hasil assay dari lab. Material (Waste/LG/MG/HG/VHG) akan dihitung ulang otomatis begitu Ni % diisi.",
  update_assay_save_btn: "Simpan Hasil Assay",
  digging_detail_dome_history_btn: "Lihat Riwayat Dome",
  digging_detail_tujuan_history_btn: "Lihat Riwayat Tujuan",
  tujuan_history_title: "Riwayat Perubahan Tujuan",
  dome_history_title: "Riwayat Transaksi Dome",
  dome_history_loading: "Memuat riwayat...",
  update_tujuan_title: "Update Tujuan & ID Pengapalan",
  update_tujuan_warning: "Perubahan ini langsung menimpa data baris terkait di Google Sheets berdasarkan ID Sampel. Pastikan ID Sampel sudah benar.",
  update_tujuan_baris_ni: "Ni % Baris Ini",
  update_tujuan_dome_baru: "Buka Dome Baru",
  update_tujuan_dome_baru_konfirmasi_2: "Buat Dome Ini",
  update_tujuan_opt_tongkang: "Tongkang",
  update_tujuan_pic: "PIC",
  update_tujuan_split_eto_efo: "ETO + EFO",
  update_tujuan_split_eto_tongkang: "ETO + Tongkang",
  update_tujuan_split_efo_tongkang: "EFO + Tongkang",
  update_tujuan_split_tonase_ph: "Tonase bagian ini",
  update_tujuan_split_catatan_ph: "cth. Rencana tongkang 2 hari lagi",
  update_tujuan_save_btn: "Simpan Perubahan",
  digging_detail_assay_recap: "Rekap Assay",
  loading_data: "Memuat data...",
  table_info_default: "Menampilkan 0 baris data",
  issue_box_1: "Open Issue",
  issue_box_2: "In Progress",
  issue_box_3: "Resolved",
  issue_title: "Daftar Issue & Rekomendasi Action Operasional",
  issue_filter_all: "Semua Status",
  issue_filter_open: "Open",
  issue_filter_progress: "In Progress",
  issue_filter_close: "Close / Resolved",
  btn_add_issue: "Issue Baru",
  btn_delete_all_issue: "Hapus Semua",
  issue_th_date: "Tanggal & Waktu",
  issue_th_reporter: "Pelapor",
  issue_loc: "Lokasi",
  issue_cat: "Kategori Issue",
  issue_desc: "Deskripsi Issue",
  issue_rec: "Rekomendasi Action",
  issue_pic: "PIC",
  issue_target: "Target",
  issue_th_status: "Status",
  issue_empty_filter: "Tidak ada data issue yang cocok dengan filter status.",
  kpimember_title: "Daftar Kinerja & KPI Member Tim Geologi",
  kpimember_desc: "Klik pada salah satu kartu karyawan untuk melihat detail lengkap absensi, kinerja, dan standar penilaian.",
  btn_form_member: "Form Member",
  loading_members: "Mengambil data member dari Google Sheets...",
  leaderboard_title: "Leaderboard Geologist",
  leaderboard_desc: "Peringkat berdasarkan Current Accuracy (sistem Accuracy Grade LAMA -- bukan Skor Gabungan Engine KPI 5 Pilar) -- otomatis dihitung dari data KPI Member yang sama di atas, TIDAK terikat ke periode tertentu.",
  leaderboard_empty: "Belum ada member dengan Accuracy dalam format angka untuk diperingkat.",
  leaderboard_col_accuracy: "Accuracy",
  sublot_radar_title: "Chemical Fingerprint",
  sublot_radar_desc: "Persentase Aktual terhadap Plan per unsur -- lingkaran putus-putus adalah acuan 100% (sama persis Plan).",
  retention_title: "Retention & Archive",
  retention_desc: "Sessions non-ACTIVE dihapus setelah 7 hari. SecurityAuditLog dan AuditTrail dipindahkan ke sheet archive setelah 90 hari.",
  retention_enable_label: "Aktifkan terjadwal",
  retention_sessions_label: "Sessions (hari)",
  retention_security_label: "SecurityAuditLog (hari)",
  retention_audit_label: "AuditTrail (hari)",
  retention_chatlog_label: "ChatLog (opsional)",
  retention_btn_save: "Simpan Kebijakan",
  retention_btn_run: "Jalankan Sekarang",
  session_cache_title: "Session Cache",
  session_cache_desc: "Cache hasil validasi sesi selama beberapa detik supaya request beruntun (polling tab) tidak scan ulang Sessions/Users/Credential tiap kali. Tetap full re-validasi keamanan tiap cache-miss -- default OFF.",
  session_cache_enable_label: "Aktifkan cache",
  session_cache_ttl_label: "TTL Cache (detik, 5-60)",
  session_cache_btn_save: "Simpan Kebijakan",
  api_abuse_guard_title: "API Abuse Guard",
  api_abuse_guard_desc: "Batasi jumlah request per sesi dalam rentang waktu tertentu -- melindungi token yang sudah login dari penyalahgunaan berulang (mis. token bocor dipakai spam request). Rate-limit login tetap berjalan terpisah. Default OFF.",
  api_abuse_guard_enable_label: "Aktifkan guard",
  api_abuse_guard_max_label: "Maks Request (10-1000)",
  api_abuse_guard_window_label: "Jendela Waktu (detik, 10-300)",
  api_abuse_guard_btn_save: "Simpan Kebijakan",
  compact_card_title: "Padatkan Baris Kosong (Developer)",
  compact_card_desc: "Hanya memadatkan baris yang benar-benar kosong. Header dan baris yang masih berisi data tidak disentuh.",
  compact_sheet_label: "Sheet Target",
  compact_preview_btn: "Preview",
  compact_execute_btn: "Padatkan Sekarang",
  compact_status_idle: "Pilih sheet lalu jalankan Preview. Tidak ada perubahan data pada tahap ini.",
  compact_status_loading: "Memindai baris kosong...",
  compact_status_none: "Sheet {sheet}: tidak ada baris kosong ditemukan dari {rows} baris data.",
  compact_status_ready: "Ditemukan {count} baris kosong di sheet {sheet} (dari {rows} baris data): {list}",
  compact_status_preview_required: "Jalankan Preview dulu sebelum memadatkan.",
  compact_status_executing: "Memadatkan baris kosong...",
  compact_status_success: "Sheet {sheet} berhasil dipadatkan. Sebelum: {before} baris, dihapus: {removed} baris kosong, sesudah: {after} baris.",
  compact_error_prefix: "Gagal:",
  compact_confirm_title: "Padatkan Baris Kosong",
  compact_confirm_message: "Akan menghapus {count} baris kosong di sheet {sheet}. Baris yang masih berisi data TIDAK akan disentuh. Lanjutkan?",
  pwa_update_title: "Versi baru tersedia",
  pwa_update_desc: "Muat ulang untuk memakai versi terbaru dashboard ini.",
  pwa_update_btn_reload: "Muat Ulang",
  pwa_update_btn_dismiss: "Nanti Saja",
  lang_theme_settings_title: "Bahasa, Tema & Regional",
  lang_theme_settings_desc: "Atur bahasa, tampilan, timezone, dan format tanggal/waktu aplikasi.",
  regional_time_title: "Regional & Time",
  regional_timezone_label: "Zona Waktu",
  regional_locale_label: "Lokal",
  regional_date_format_label: "Format Tanggal",
  regional_time_format_label: "Format Waktu",
  theme_dark: "Gelap",
  theme_white: "Putih",
  regional_time_desc: "Timezone dan format tanggal/waktu resmi aplikasi. Default: Asia/Jakarta · id-ID.",
  regional_time_save: "Simpan Regional & Time",
  regional_time_open: "Atur Regional & Time",
  regional_time_modal_desc: "Atur zona waktu, lokal, format tanggal, dan format waktu resmi aplikasi.",
  regional_time_cancel: "Batal",
  settings_data_update_title: "Data Feed & Riwayat Update",
  settings_api_title: "Integrasi Data Direct Feed",
  settings_api_status: "Status:",
  settings_api_connected: "Terhubung Langsung ke Google Sheets API",
  settings_api_desc: "Data dashboard ini disinkronisasi secara otomatis setiap 30 detik.",
  dev_access_title: "Akses Developer",
  dev_access_desc: "Buka kunci ini untuk mengaktifkan tombol \"Form Member\" (Tambah Member Baru). Berlaku khusus di browser/perangkat ini saja.",
  dev_access_error: "PIN salah, coba lagi.",
  dev_access_placeholder: "PIN Developer",
  dev_access_unlock_btn: "Buka",
  dev_access_active: "Aktif",
  dev_access_lock_btn: "Kunci",
  dev_console_title: "Developer Console",
  dev_console_desc: "Semua fitur administrasi Developer dalam satu jendela.",
  dev_console_title_sistem: "Developer Console \u2014 Control Sistem",
  dev_console_desc_sistem: "Credential, Cleanup Data, Padatkan Baris, Reset Total, Reset PIN Member.",
  dev_console_title_technical: "Developer Console \u2014 Control Technical",
  dev_console_desc_technical: "Panduan Rekonsiliasi, Atur Parameter Global (COG, Flag Warna, Bucket & Sampel), & Persetujuan Kejadian KPI.",
  dev_console_open_sistem: "Sistem",
  dev_console_open_technical: "Technical",
  dev_console_active_as: "Akses aktif sebagai",
  dev_console_credential: "Credential Manager",
  dev_console_credential_desc: "Buat Credential untuk User aktif yang belum memilikinya.",
  dev_console_manage: "Kelola",
  dev_console_cleanup: "Cleanup Data",
  dev_cleanup_panel_title: "Cleanup Data (Developer)",
  dev_cleanup_panel_desc: "Bersihkan sheet log tertentu -- sesi Developer yang sedang aktif selalu dipertahankan.",
  dev_cleanup_btn_sessions: "Bersihkan Sessions",
  dev_cleanup_btn_security: "Bersihkan SecurityAuditLog",
  dev_cleanup_btn_audit: "Bersihkan AuditTrail",
  retention_footer_note: "ChatLog default OFF. Reset Total tidak pernah menyentuh data keamanan atau archive.",
  dev_console_reset: "Reset Total — Pindah Proyek",
  dev_console_guide: "Panduan Rekonsiliasi",
  dev_console_parameters: "Parameter Global",
  dev_console_close: "Tutup",
  dev_console_open: "Developer",
  dev_loading_title: "Memverifikasi Akses Developer",
  dev_loading_message: "Mohon tunggu, server sedang memproses login...",
  member_loading_title: "Memverifikasi Login Member",
  member_loading_message: "Mohon tunggu, server sedang memproses login...",
  dev_operation_loading_title: "Memproses Operasi Developer",
  dev_operation_loading_message: "Mohon tunggu, perubahan sedang diproses di server...",
  changelog_title: "Riwayat Update Dashboard",
  changelog_version_label: "Versi",
  changelog_desc: "lihat ringkasan perbaikan & fitur.",
  changelog_view_all: "Lihat Semua Riwayat",
  changelog_btn: "Lihat Riwayat Update",
  jsa_btn: "Lihat JSA",
  jsa_rca_btn: "Catat RCA dari JSA",
  jsa_confirm_btn: "TTD & Konfirmasi Kehadiran",
  jsa_confirm_title: "TTD & Konfirmasi Kehadiran JSA",
  jsa_confirm_desc: "Konfirmasi bahwa Anda sudah membaca & memahami JSA-MINEGEO-2026-REV02 sebelum mulai kerja.",
  jsa_confirm_nama: "Nama",
  jsa_confirm_status: "Status Kehadiran",
  jsa_status_present: "Hadir",
  jsa_status_permission: "Izin",
  jsa_status_leave: "Cuti",
  jsa_confirm_apd_label: "Checklist APD Wajib",
  jsa_apd_helm: "Helm Safety (SNI)",
  jsa_apd_masker: "Masker P2 / N95",
  jsa_apd_sarung_tangan: "Sarung Tangan",
  jsa_apd_rompi: "Rompi Reflektif",
  jsa_confirm_submit: "Konfirmasi & Simpan",
  dev_profile_btn: "Profil Developer",
  dev_profile_role: "Head Mine Geologist / Developer",
  dev_profile_desc: "Merancang & mengembangkan dashboard operasional tambang ini.",
  dev_profile_view_full: "Lihat Selengkapnya",
  dev_profile_app_info: "Mine Geologist · Geobank Minerals",
  preview_modal_title: "Pratinjau Ekspor Laporan",
  preview_modal_subtitle: "Periksa ringkasan data sebelum file diunduh.",
  preview_format: "Format File",
  preview_rows: "Total Baris Data",
  preview_pit: "Filter Pit Aktif",
  preview_sample: "Sampel Data (5 Baris Teratas)",
  btn_cancel: "Batal",
  btn_confirm_download: "Konfirmasi & Unduh",
  modal_contact: "Informasi Kontak",
  modal_whatsapp: "Nomor WhatsApp",
  modal_attendance: "Rekap Absensi",
  modal_present: "Hadir",
  modal_permission: "Izin",
  modal_leave: "Cuti",
  modal_field_perf: "Kinerja Lapangan",
  modal_blending_target: "Target Blending",
  modal_bench_insp: "Inspeksi Bench",
  modal_notes_title: "Catatan & Detail Kinerja",
  modal_grading_standard: "Waste Non COG",
  modal_grading_desc: "Tonase & Average Ni dari baris Produksi_GC Member ini yang terklasifikasi Waste (di bawah batas COG minimum di Settings).",
  modal_curr_accuracy: "Waste Tonase @ Avg Ni",
  form_member_title: "Form Member & KPI Geologi",
  form_member_subtitle: "Isi formulir di bawah ini untuk menambahkan data member baru.",
  form_general_info: "Informasi Umum",
  form_fullname: "Nama Lengkap",
  form_role: "Jabatan",
  form_whatsapp: "Nomor WhatsApp",
  form_account_access_title: "Akun & Akses Member",
  form_account_access_desc: "Akun dibuat oleh Developer. PIN hanya dipakai saat proses ini lalu langsung di-hash di server.",
  form_login_id: "Login_ID",
  form_email: "Email Terdaftar",
  form_pin: "PIN Member (6 digit)",
  form_pin_confirm: "Konfirmasi PIN",
  form_pin_security_note: "PIN asli tidak disimpan di Google Sheets. Yang tersimpan hanya PIN_Hash pada sheet Credential.",
  form_field_perf: "Kinerja Lapangan",
  form_target_blending: "Target Blending (%)",
  form_bench_insp: "Inspeksi Bench",
  form_accuracy: "Accuracy Grade (%)",
  form_grade: "Grade",
  form_status: "Status",
  form_member_footer_note: "Pastikan data terisi dengan benar sebelum disimpan.",
  btn_save_member: "Simpan Member",
  issue_modal_title: "Form Tambah Issue & Action Plan Baru",
  issue_modal_subtitle: "Catat kendala operasional tambang dan rekomendasi tindakannya.",
  issue_form_datetime: "Tanggal & Waktu Otomatis",
  issue_form_reporter: "Pelapor",
  issue_form_location: "Lokasi / Pit",
  issue_form_category: "Kategori Masalah / Issue",
  issue_form_desc: "Deskripsi / Dampak Issue",
  issue_form_rec: "Rekomendasi Action",
  issue_form_pic: "Penanggung Jawab (PIC)",
  issue_form_target: "Target Selesai",
  issue_form_status: "Status",
  issue_form_footer_note: "Pastikan data issue akurat sebelum disimpan.",
  btn_save_issue: "Simpan Issue"
 },
 en: {
  nav_ringkasan: "Summary",
  nav_trend: "Visual & Trend",
  nav_tabel: "Digging Table",
  nav_rekonsiliasi: "Reconciliation",
  nav_validasi: "Validation",
  nav_barging: "Barging",
  rca_title: "RCA Log -- Root Cause & Recommendations",
  pitactual_new_btn: "Record Pit Actual",
  pitactual_history_btn: "History",
  pitactual_history_title: "Pit Actual History",
  pitactual_history_subtitle: "All official weighbridge rows (Ritase x TF) with field notes/issues -- audit evidence for deviations.",
  rca_evidence_title: "Related Pit Actual Notes (Supporting Evidence)",
  pitactual_form_title: "Record Pit Actual",
  pitactual_info: "Tonnage is auto-calculated (Rit x TF) -- this is the weighbridge result, pure tonnage without grade.",
  matrix_f1_label: "F1 (GC/BM)",
  matrix_f2_label: "F2 (PA/GC)",
  matrix_f3_label: "F3: Plant / Pit Actual",
  matrix_f4_label: "F4: Plant / Block Model",
  matrix_total_pitactual: "Total Pit Actual",
  matrix_total_plant: "Total Plant (Actual)",
  matrix_th_bm: "BM (Ton)",
  matrix_th_gc: "GC (Ton)",
  matrix_th_pitactual: "Pit Actual (Ton)",
  matrix_f1f2_note: "F1/F2 close to 100% = good (as planned). Below 100% = Loss occurred at that stage. Above 100% = Dilution/extra material added at that stage.",
  rca_subtitle: "Root cause explanations & actions for reconciliation deviations per Block",
  rca_new_btn: "New RCA",
  rca_loading: "Loading RCA data...",
  rca_form_title: "New RCA",
  rca_maker_status_label: "Status",
  rca_maker_status_note: "Created automatically by the server as Maker",
  rca_th_tahap: "Affected Stage",
  rca_th_deskripsi: "Issue Description",
  rca_th_root_cause: "Root Cause",
  rca_th_tindakan: "Action / Recommendation",
  rca_th_pic: "PIC",
  rca_th_target: "Target",
  barging_list_title: "Shipment List",
  barging_new_shipment_btn: "New Shipment",
  barging_loading: "Loading shipment data...",
  barging_aktual_title: "Enter Actual Tonnage (Draft Survey)",
  barging_aktual_ph: "e.g. 9000",
  barging_loading_log_title: "Loading Log",
  barging_add_loading_log: "Record Dome Loading",
  barging_shift_report_title: "Shift Report",
  barging_add_shift_report: "New Shift Report",
  barging_sublot_title: "Sublot (Plan vs Actual)",
  barging_add_sublot: "Enter Sublot Lab Results",
  barging_form_shipment_title: "New Shipment",
  barging_th_no_shipment: "No Shipment",
  barging_th_tanggal_mulai: "Start Date",
  barging_th_ore_type: "Ore Type",
  barging_th_nama_tug: "Tug Name",
  barging_th_nama_barge: "Barge Name",
  barging_th_plan_tonase: "Plan Tonnage",
  barging_th_plan_rit: "Plan Rit",
  barging_form_loadinglog_title: "Record Dome Loading",
  barging_th_area: "Area",
  barging_th_dome_id: "Dome ID",
  barging_th_no_sublot: "No Sublot",
  barging_th_rit: "Rit",
  barging_th_tf: "TF (Tonnage Factor)",
  barging_form_shiftreport_title: "New Shift Report",
  barging_shiftreport_info: "Progress Tonnage, %, and Remaining are auto-calculated from recorded Loading Log data -- no need to type them manually.",
  barging_th_jam: "Hours",
  barging_th_status: "Status",
  barging_th_catatan: "Notes / Issues",
  barging_form_sublot_title: "Enter Sublot Lab Results",
  barging_sublot_info: "Plan tonnage & grade are auto-calculated from Loading Log -- just enter the Actual X-Ray lab results here, DISC (difference) is calculated automatically.",
  barging_sublot_aktual_section: "Actual X-Ray Results",
  barging_th_tonase_aktual: "Actual Tonnage",
  btn_save_generic: "Save",
  btn_add_validasi: "Input Data",
  validasi_form_title: "Test Pit Validation Data Entry",
  validasi_form_subtitle: "Record assay results per depth into the Validasi sheet.",
  validasi_form_idtp: "Test Pit ID",
  th_east: "East",
  th_north: "North",
  btn_save_validasi: "Save Data",
  validasi_search_placeholder: "Search by Test Pit ID, Bench, Laterite Type...",
  validasi_th_idtp: "Test Pit ID",
  validasi_th_area: "Area",
  validasi_th_tipe: "Laterite",
  validasi_th_meter: "Depth (m)",
  validasi_th_grade: "Class Grade",
  validasi_th_status: "Status",
  validasi_chart_title: "Average Ni % per Area",
  validasi_view_chart: "Chart",
  validasi_view_tp: "TP",

  validasi_avg_note: "Values in this table are the average of all measured depths (1-5 meters). Click a row to see the per-depth breakdown.",
  validasi_th_koordinat: "East / North",
  validasi_th_warna: "Color",
  validasi_th_struktur: "Structure",
  validasi_th_average: "Average (1-5m)",
  digging_detail_bench: "Bench",
  filter_all_pit: "All Pits",
  rekon_date_to: "to",
  rekon_total_produksi: "Total Production",
  rekon_total_terkirim: "Total Assigned",
  periodic_report_title: "Periodic Report",
  periodic_report_subtitle: "Reconciliation summary ready to send to the GM, pick a period then Generate.",
  periodic_report_date_start: "From Date",
  periodic_report_date_end: "To Date",
  periodic_report_preset_week: "This Week",
  periodic_report_preset_month: "This Month",
  periodic_report_generate: "Generate",
  periodic_report_empty: "Select a period then click Generate to see the report.",
  periodic_report_print: "Print / Save PDF",
  proreport_title: "Professional Reconciliation Report",
  proreport_subtitle: "F1-F4 summary, Block Model vs GC vs Actual, & RCA findings -- ready to print/PDF.",
  proreport_print: "Print / Save PDF",
  rekon_selisih: "Variance",
  rekon_persen_reconciled: "% Reconciled",
  rekon_chart_title: "Breakdown Chart by Pit",
  rekon_th_produksi: "Production (Ton)",
  rekon_th_efo: "EFO (Ton)",
  rekon_th_eto: "ETO (Ton)",
  rekon_th_direct: "Direct (Ton)",
  rekon_th_disposal: "Disposal (Ton)",
  rekon_th_belum: "Unassigned (Ton)",
  rekon_th_menunggu: "Waiting",
  rekon_view_breakdown: "Breakdown by Pit",
  rekon_view_pending: "Unassigned",
  rekon_view_blockmodel: "Block Model",
  rekon_view_matrix: "Matrix F1-F4",
  rekon_view_rca: "RCA Log",
  guide_title: "Reconciliation Guide (Developer)",
  guide_open_btn: "View Guide",
  guide_subtitle: "Input order from upstream to downstream -- a reminder in case you forget how to use this dashboard.",
  guide_pwa_url_label: "App URL (production/PWA):",
  guide_step0_title: "Data Reset -- Which Sheets Can Be Cleared?",
  guide_step0_intro: "If starting from scratch (new project/site, or cleaning up old data), not all sheets should be treated the same. Some sheets are just field history logs (safe to clear), others are reference/rules the system uses for calculations (do NOT clear, only EDIT the values if needed).",
  guide_step0_data_title: "✅ DATA sheets -- safe to clear (delete data rows, keep the HEADER)",
  guide_step0_data_list: "BlockModel, Validasi, Produksi_GC, PitActual, DomeLog, BargeShipment, BargeLoadingLog, BargeShiftReport, BargeSublot, RCA_Log, Masalah & Rekomendasi, ChatLog, TujuanChangeLog, JSA_Log, Production_Plan.",
  guide_step0_jantung_title: "🧬 BlockModel \"Heart\" Formulas -- 5 cells MUST stay intact (K2, O2, P2, Q2, R2)",
  guide_step0_jantung_desc: "These 5 cells in row 2 of the BlockModel sheet hold an ARRAYFORMULA that auto-spills into every row below (not copy-pasted per row). If one is deleted or manually overwritten, EVERY row below it goes permanently blank -- P and Q depend on O, R depends on Q, so damage can cascade. If this happens, just copy-paste the exact formula below into the matching cell (do NOT retype it manually -- typo-prone):",
  guide_step0_jantung_catatan: "Note: other BlockModel columns (O2:R2 spilling from row 2, and K too) are safe to sort/filter -- the only thing not allowed is typing into or deleting the CONTENTS of cells K2, O2, P2, Q2, R2 themselves. The Validasi sheet (SM% column) and BargeSublot (DISC Ni / DISC SiO2-MgO columns) do NOT use this pattern -- their values are written once by the backend/frontend at submit time, so if deleted they just need re-entering per row and won't cascade to other rows.",
  guide_step0_config_title: "🔒 CONFIG/MASTER sheets -- do NOT clear, only EDIT the values if needed",
  guide_step0_config_list: "COGConfig (Waste/LG/MG/HG/VHG thresholds per Ore Type -- clearing it breaks Digging Table & KPI grade calculations / falls back to defaults), DomeConfig (list of active Domes -- clearing it means no Dome can be selected when assigning a destination), Changelog (version release history -- unrelated to mining data at all).",
  guide_step0_pertimbangan_title: "⚠️ Needs thought first, depending on what \"reset\" means",
  guide_step0_pertimbangan_desc: "The Member sheet (staff/employee KPI data) is usually kept if only mining data is being reset -- delete it only if the team is also changing. If it is included via the \"Full Project-Move Reset\" feature (Settings, Developer-only), Developer account rows are automatically preserved -- only other team members' rows are cleared. Important: the Users/Credential sheets (login identity) are NEVER reset regardless of your selection -- so after a Full Reset, every team member can STILL LOG IN normally with the same PIN, only the \"Member KPI\" tab will show empty until re-filled manually. This is not a bug.",
  guide_step0_retention_desc: "The Sessions, SecurityAuditLog, and AuditTrail sheets are ALSO NEVER touched by Full Reset regardless of your selection -- all three are managed separately through the Retention & Archive policy in the Cleanup Data (Developer) panel. When the \"Enable scheduled run\" toggle in Retention & Archive is on, the 14 operational data checkboxes below (all except ChatLog) are automatically locked checked so Full Reset always stays a consistent full wipe -- turn that toggle off first if you need a partial reset instead.",
  guide_step0_urutan_title: "Order to follow for a full reset",
  guide_step0_urutan_1: "1. Clear the DATA sheets (data rows only, keep the header).",
  guide_step0_urutan_2: "2. Do not touch COGConfig, DomeConfig, Changelog.",
  guide_step0_urutan_3: "3. Re-fill BlockModel first (the starting reference for the reconciliation chain -- see Step 1).",
  guide_step0_urutan_4: "4. Then continue with Validation -> Produksi_GC -> PitActual -> etc, following the order of Steps 1-8 below.",
  cogconfig_modal_title: "COG Parameters (Cut of Grade)",
  cogconfig_modal_subtitle: "Change the Waste/LG/MG/HG/VHG classification thresholds per Ore Type",
  cogconfig_select_tipe: "Ore Type Being Configured",
  cogconfig_batas_waste_lg: "Waste -> LG Threshold",
  cogconfig_batas_lg_mg: "LG -> MG Threshold",
  cogconfig_batas_mg_hg: "MG -> HG Threshold",
  cogconfig_batas_hg_vhg: "HG -> VHG Threshold",
  cogconfig_urutan_note: "Order must be ascending: Waste->LG < LG->MG < MG->HG < HG->VHG.",
  cogconfig_limo_aktif_title: "Enable Sapro/Limo Distinction",
  cogconfig_limo_aktif_desc: "When disabled, all material is treated as Sapro (Ore Type is ignored).",
  cogconfig_sm_threshold: "SM% Threshold for Auto Detect",
  cogconfig_sm_threshold_note: "SM% >= this threshold -> Limo. SM% < this threshold -> Sapro. Used when Ore Type is set to \"Auto Detect\".",
  cogconfig_target_ship: "Ship Sale Target Ni % (Range)",
  cogconfig_target_ship_note: "The Ni% specification range requested by ship buyers -- used as the Min/Max lines on the \"Ni % vs Target\" chart (Summary), not a material grade classification threshold.",
  cogconfig_toleransi: "Variance Tolerance Threshold (Block Model vs Actual)",
  cogconfig_toleransi_note: "|Variance %| <= WARNING -> OK. Between WARNING and OUT OF TOL -> WARNING. > OUT OF TOL -> OUT OF TOL. Used in the \"Block Model vs Actual\" table badge (Reconciliation).",
  cogconfig_warna_title: "Flag Colors per Grade",
  cogconfig_warna_note: "Used for the badge & Ni% text color across the whole dashboard (Digging, Validation, Reconciliation, PDF Export) -- adjust to your company's flag color standard.",
  cogconfig_btn_cancel: "Cancel",
  cogconfig_btn_save: "Save Parameters",
  parameter_global_title: "Set Parameters (Global)",
  cogconfig_card_title: "COG (Cut of Grade)",
  cogconfig_card_desc: "Waste/LG/MG/HG/VHG classification thresholds per Ore Type.",
  flagconfig_card_title: "Flag Colors",
  flagconfig_card_desc: "Badge & Ni% text color per Grade, matching your company standard.",
  flagconfig_modal_subtitle: "Change badge & Ni% text color per Grade (5 color presets)",
  bucketconfig_card_title: "Bucket & Sample",
  bucketconfig_card_desc: "Bucket-to-tonnage conversion & sample-per-Dome limits.",
  bucketconfig_modal_subtitle: "Set Bucket -> Tonnage conversion & sample-per-Dome limits",
  cogconfig_wmt_bucket: "WMT per Bucket (Ore Type selected above)",
  cogconfig_wmt_bucket_note: "Estimated tonnage (wmt) per 1 PC220 bucket, differs per Ore Type based on density.",
  cogconfig_bucket_sampel: "Buckets per Sample (Sack)",
  cogconfig_bucket_sampel_note: "Global (not per Ore Type).",
  cogconfig_sampel_dome: "Maximum Samples per Dome",
  cogconfig_sampel_dome_note: "Global -- a reminder for when Grade Control should stop and open a new Dome to keep material quality consistent.",
  guide_step1_title: "Block Model (BM) -- Starting Reference",
  guide_step1_p1: "This is where everything begins. Before mining starts working on a Block, the reserve calculation from Surpac (IDW/Kriging method) must already be recorded -- estimated tonnage & grade per Block and Pit.",
  guide_step1_p2: "How to input: directly into the \"BlockModel\" sheet in Google Sheets (not via the dashboard). Key columns: Id_blok, Pit, Estimasi_tonase, Estimasi_Ni %, Status_Depletion (set to \"Selesai\" once that Block is fully mined, so the Loss/Dilution & F1-F4 Matrix calculations account for it).",
  guide_step1_p3: "When: before digging starts in that Block. 1 Block can have many Pits (e.g. L-01 = Avanza + Honda + Yamaha).",
  guide_step2_title: "Validation (Test Pit) -- Check Before Digging",
  guide_step2_p1: "Before a point is dug, check whether the actual grade there is close to the Block Model prediction. Uses a 5-meter excavator arm, measured per 1-5m depth.",
  guide_step2_p2: "How to input: \"Validation\" tab > \"Input Data\" button > fill in per depth (1 TP point can have up to 5 rows, 1 per meter).",
  guide_step2_p3: "See the result: on the Reconciliation tab > Block Model, the \"Validation (Ni %)\" column shows the average Ni% from TP points in that Block versus the BM prediction (number in parentheses = difference). This is only an early check, NOT part of the Estimate/Actual comparison.",
  guide_step3_title: "Digging Table (Grade Control) -- Assay While Digging",
  guide_step3_p1: "This is the \"GC\" (Grade Control) stage -- recording the actual assay as material is dug in the field. This becomes the Actual figure compared against the Block Model.",
  guide_step3_p2: "How to input: \"Digging Table\" tab > \"Input Data\" button > fill in Date, Shift, Pit, Block, Ore Type (Sapro/Limo/Auto Detect -- REQUIRED), Sample ID, Total Samples (sack count -- REQUIRED), and full assay (Ni/Fe/Co/MgO/SiO2). Tonnage is NO LONGER typed manually -- it's auto-calculated from Total Samples x Buckets per Sample x WMT per Bucket (see Settings > Parameters > Bucket & Sample). Class_Grade (Waste/LG/MG/HG/VHG) is also not manually selected -- it's auto-calculated from Ni% + Ore Type once the data is saved. Sample ID MUST be filled in so it can be traced later.",
  guide_step3_p3: "Destination (EFO/ETO/etc) doesn't need to be filled in at this stage -- that's a follow-up decision (see Step 4).",
  guide_step4_title: "Assign Dome -- Decide Material Destination",
  guide_step4_p1: "After digging, the QC team in the EFO/ETO area decides which Dome this material piles onto (based on similar grade & that Dome still having space).",
  guide_step4_p2: "How to input: open a row in the Digging Table > \"Update Destination & Shipping ID\" > choose Destination (ETO/EFO/Barge, or a Split combination if the material is divided into 2 destinations) > pick a Dome from the list shown, or \"Open New Dome\" if all are full.",
  guide_step4_p3: "The full history of each Dome (who filled it when, grade blending) can be seen via the \"View Dome History\" button on rows that have been assigned.",
  guide_step5_title: "Pit Actual -- Weighbridge Ritase",
  guide_step5_p1: "Independent verification of how many tonnes actually left the Pit, calculated from Ritase (number of dump trucks) times TF (Tonnage Factor, 25-27 tonnes depending on company policy). This is pure tonnage, without grade -- same as a weighbridge's function in the field.",
  guide_step5_p2: "How to input: \"Reconciliation\" tab > \"Matrix F1-F4\" toggle > \"Record Pit Actual\" button > fill in Date, Shift, Block, Pit, Rit, TF. Tonnage is calculated automatically.",
  guide_step6_title: "Barging / Plant -- Shipping",
  guide_step6_p1: "The furthest downstream stage -- material from the Dome is loaded onto a barge/vessel. This is the final and most independent verification point (Actual Tonnage from the draft survey, confirmed by the ship's Captain).",
  guide_step6_p2: "Input order on the \"Barging\" tab: (a) \"New Shipment\" -- create a new vessel trip; (b) open that shipment > \"Record Dome Loading\" every time a Dome is drawn to the vessel (per shift); (c) \"New Shift Report\" -- progress & issue notes per shift (Progress is auto-calculated); (d) once the vessel is fully loaded, enter \"Actual Tonnage\" (directly in the shipment detail modal) -- status automatically becomes \"Selesai\" (Completed); (e) if X-Ray lab results are available, also fill in \"Sublot Lab Results\" (Plan is auto-calculated, just enter Actual, DISC is calculated automatically).",
  guide_step7_title: "Reading Results -- Reconciliation & RCA Log",
  guide_step7_p1: "Once all the stages above are running, the \"Reconciliation\" tab automatically calculates everything:",
  guide_step7_p2: "-- Block Model vs Actual: yellow Variance % = Loss, red = Dilution (only applies to Blocks with a final status). The OK/WARNING/OUT OF TOL badge next to it shows how large the deviation is, its thresholds can be set in Settings > Parameters > COG. OUT OF TOL rows have a lightning icon (Developer) to instantly open the RCA form with Block/Pit pre-filled.",
  guide_step7_p3: "-- F1-F4 Matrix: F1 (GC/BM) & F2 (Pit Actual/GC) per Block+Pit -- traceable. F3 (Plant/Pit Actual) & F4 (Plant/BM) are total level only -- since material has already been blended in the Dome, it can no longer be traced back per Block. NEW: a red EWS banner now appears automatically above the table if any Block/Pit has an F2 deviation >5% -- OUT OF TOL rows have a lightning icon (Developer) to instantly open the RCA form with Block/Pit & Affected Stage (\"Pit Actual\") already pre-filled.",
  guide_step7_p4: "-- RCA Log: if there's a deviation that needs explaining (e.g. F1 far below 100%), record it via the \"New RCA\" button -- choose the Affected Stage (BM/Validation/GC/Pit Actual/Plant), write the Root Cause & Action. This becomes the material for reporting to the GM.",
 guide_step8_title: "Report to GM -- Weekly & Monthly",
 guide_step8_intro: "Periodic reports (from the indigo document icon button) are NOT a new data source -- everything is already in the tabs covered in Steps 1-7 above, just summarized by period. For a formal print-ready report (Executive Summary F1/F2/F4 + 3-Stage BM/GC/Actual table + open RCA findings in one document), use the red document icon button \"Professional Reconciliation Report\" next to it -- the data is also live, just click & print/PDF without needing to pick a period.",
 guide_step8_weekly_title: "Weekly -- operational focus, catch issues fast",
 guide_step8_weekly_1: "1. Progress per Block/Pit this week -- from Reconciliation > Block Model vs Actual. See what's on plan and what isn't.",
 guide_step8_weekly_2: "2. Loss/Dilution for Blocks newly \"Safe\"/\"Not Safe\" this week -- from the Variance % column (yellow/red). Catch deviations early before they pile up.",
 guide_step8_weekly_3: "3. Validation vs BM cross-check for Blocks about to be dug -- click a row in the Detail popup (Reconciliation > Block Model vs Actual), no longer a separate column in the main table. Early warning before a mining plan mistake.",
 guide_step8_weekly_4: "4. RCA entries still Open/In Progress -- from the RCA Log, filtered by Status. The GM needs to know what's being worked on and who's the PIC.",
 guide_step8_weekly_5: "5. Active shipment progress -- from the Barging tab, shipments with Loading status. Which vessel is underway, what percent loaded.",
 guide_step8_weekly_6: "6. Field issues this week -- from the Issue & Action tab. Non-reconciliation operational obstacles (weather, equipment, etc).",
 guide_step8_monthly_title: "Monthly -- strategic focus, big picture & accountability",
 guide_step8_monthly_1: "1. Cumulative F1-F4 for the month -- from the F1-F4 Reconciliation Matrix. This is the system's end-to-end accuracy \"report card\".",
 guide_step8_monthly_2: "2. Total Loss/Dilution for the month -- NEW: now shown automatically in Tons (not just %) on the Reconciliation summary card & Periodic Report, no more manual recap needed. Overall impact, not just per-Block.",
 guide_step8_monthly_3: "3. All RCA entries Closed this month + root-cause trend -- from the RCA Log, filtered by Closed. NEW: grouping by Status & Affected Stage now appears automatically as summary badges in the Periodic Report, no more manual grouping needed. Check for a recurring pattern at a particular stage.",
 guide_step8_monthly_4: "4. Recap of shipments completed this month -- from the Barging tab, shipments with Actual Tonnage filled in. Total shipped versus the monthly target.",
 guide_step8_monthly_5: "5. Average monthly Sublot DISC -- NEW: now calculated & shown automatically as a summary card in the Periodic Report (average DISC Ni & SiO2/MgO from Sublots whose shipments fall within the report period), no more manual lookup from BargeSublot needed. Overall accuracy of vessel grade estimates.",
 guide_step8_note: "Note: NEW -- comparing this month against last month is now automatic, see the \"Month over Month\" toggle in the Visual & Trend tab (Tonnage & Ni% delta cards + last 6 months chart).",
 guide_step9_title: "JSA & Safety",
 guide_step9_p1: "NEW: the Job Safety Analysis document (JSA-MINEGEO-2026-REV02) is now integrated directly into the dashboard, not a separate file. A \"View JSA\" button is available in the Settings panel, open to EVERYONE (not developer-only).",
 guide_step9_p2: "-- Inside the JSA modal there are 2 shortcut buttons: \"Log RCA from JSA\" (if you realize there's an unaddressed hazard while reading the JSA, instantly open the RCA form with an origin marker pre-filled) and \"Sign & Confirm Attendance\" (self-service, each member confirms for themselves that they've read the JSA & attended that day's Toolbox Meeting -- NO Developer PIN needed).",
 guide_step9_p3: "-- Sign-off & toolbox attendance results are stored in the JSA_Log sheet, then appear as a \"JSA: Nx signed · Nx Toolbox\" badge on each member's KPI Member card -- the initial version only counts frequency (Compliance), there is NO comprehension/quiz score yet (Competency, still on hold for a future version).",
 guide_step9_p4: "-- Connection to the F1-F4 Matrix: F2 rows that are OUT OF TOL (>5%) also have their own Quick Link RCA button, automatically filling the Affected Stage as \"Pit Actual\" -- so RCA entries created from reconciliation deviations or from a JSA review are both consistently categorized for automatic grouping in the Periodic Report (see Step 8).",
 guide_step10_title: "Security & Policy -- Access, Sessions & Usage Rules",
 guide_step10_p1: "Core application security is integrated: Developer Login and Member Login are separated, sessions are validated against the server, raw tokens are not displayed in session logs, and sessions can end as EXPIRED or be closed with LOGOUT.",
 guide_step10_p2: "Member login remains available from the KPI Member table. After successful login, the Member identity appears as the ME icon; its menu provides Log Out. After logout, the ME icon disappears and the Member session is closed on the server.",
 guide_step10_p3: "Developer Access is used for restricted administration/input functions. The Developer must unlock access with Login_ID + registered email + application PIN, then lock it again when finished. Never share PINs, tokens, or credentials with others.",
 guide_step10_p4: "Data policy: DATA sheets may only be cleared during an intentional reset; CONFIG/MASTER sheets and core BlockModel formulas must not be deleted casually. Important changes should remain traceable through session/security logs and the update history.",
 guide_step10_p5: "Operational policy: use the minimum access required, always Log Out when finished, do not leave an active session on a shared computer, and review users/roles/permissions periodically. If an access anomaly or unknown data change is found, stop and review Security/Audit logs before making further changes.",
 guide_step10_p6: "Note: this is the Security & Policy baseline v90.2.15. Further hardening such as rate-limit/brute-force protection, scheduled token rotation, and periodic permission review can be added as a future strengthening stage without changing the main workflow.",
 guide_step11_title: "Deploy & PWA Update -- Checklist for Every Release",
 guide_step11_p1: "NEW: this dashboard now has a Service Worker (sw.js file, place it in the SAME EXACT folder as index.html) that shows a \"New version available\" toast to every user as soon as the files are updated on GitHub -- this never existed in this project before.",
 guide_step11_p2: "MUST be done EVERY time you deploy a new version (don't forget, this is not automatic):",
 guide_step11_p3: "1. Update the version number in the const APP_VERSION line in index.html (dashboard.html) as usual.",
 guide_step11_p4: "2. Open the sw.js file and change the const CACHE_NAME = 'mine-geologist-vX.X.X'; line so the number EXACTLY matches the new APP_VERSION. If this line is NOT changed, the browser will consider sw.js \"unchanged\" (compared byte-for-byte) and the update toast will NEVER appear, even though index.html itself is completely different.",
 guide_step11_p5: "3. Re-upload BOTH files (index.html and sw.js) to the same folder on GitHub Pages. Wait about 1 minute -- the \"New version available\" toast will automatically appear in the bottom-right corner for every user with the dashboard open (desktop or Android), without forcing a reload (the user chooses when to click \"Reload\").",
 guide_step11_p6: "Note: this Service Worker deliberately caches ONLY static files (HTML shell, manifest, icons) -- live data (dashboard, chat, RCA, etc. from Google Sheets) is NEVER cached, and is always fetched fresh from the server every time.",
 guide_step12_title: "Member KPI & Performance -- Mechanism (PLANNED)",
 guide_step12_p0: "STATUS: NOT YET IMPLEMENTED. This is a design-discussion note (Aug 27) kept as a reminder before it's executed into the KPIConfig/KPIEvent sheets -- not a feature that's live in the dashboard.",
 guide_step12_p1: "Core principle: controllability. Only put things a Geologist genuinely controls into their individual KPI. Daily tonnage is NOT a main pillar -- it's a mixed responsibility of the excavator operator + mine plan, not purely Grade Control.",
 guide_step12_p2: "5 Pillars (revised): Attendance, Safety (JSA+PPE), Sampling Completeness (replaces \"Production\"), Timely Reporting, Attitude (Discipline/Teamwork/Initiative/Integrity from Supervisor). 3 weighting options (Balanced/Safety First/Data-Integrity Driven) chosen by GM, configured by Developer -- planned as a new \"KPI Formula\" card next to Global Parameters.",
 guide_step12_p15: "NEW (Aug 28): Pillar 3's name NARROWED from \"Sampling Completeness & Assay Timeliness\" to just \"Sampling Completeness\" -- assay timeliness stays EXCLUSIVE to the Pillar-4 proxy (hitungProksiKetepatanAssay_), so one late assay isn't penalized twice (which would violate the locked Anti Double-Penalty principle, guide_step12_p7). Pillar 3 is pure quantity: (Rows with Ni% filled / Total rows submitted) * 100, regardless of when it was filled.",
 guide_step12_p3: "\"Monthly Grade Control Quality\" card (kept separate from the combined KPI score): weighted Ni% = SUM(Tonnage x Ni%) / SUM(Tonnage) per Member per month, compared against the COGConfig min-max range (or Block Model Estimate if enough data exists). Tonnage is still shown but lightly weighted (rank 3, not a determinant). Sample count is shown as-is with NO minimum threshold -- a threshold just moves the same controllability problem elsewhere.",
 guide_step12_p4: "\"Awaiting Assay\" loophole (2-layer safeguard, REQUIRED before the Ni% card is used): (1) Assay not updated within N days (default 3 days, configurable in Developer Console) automatically becomes a penalty on the Timely Reporting pillar -- so leaving data hanging has a consequence. (2) Completion rate calculated separately = fully-assayed samples / total samples submitted.",
 guide_step12_p5: "Eligible Day, not a zero-scored day. Days that genuinely cannot be evaluated due to external factors are EXCLUDED from the denominator, not counted as zero achievement. 3 types: Full Exclusion (national holidays, large protests causing full shutdown -- management instruction to Head Dept), Partial Adjustment (partial equipment breakdown/rain -- that day's target is adjusted proportionally to available hours), Member Exclusion (leave/permission -- specific to one person, colleagues who still worked that day are still evaluated normally).",
 guide_step12_p6: "Proposal-approval flow (FINAL, Aug 27; CONFIRMED from the real RolePermissions data Aug 28): the system only has 4 roles -- PUBLIC/MEMBER/SUPERVISOR/DEVELOPER, there is NO separate Head Dept role. The Head of Mine Geologist Department IS the Developer, the same person. Status PENDING (just proposed) -> APPROVED (approved by the Developer, system recalculates automatically) -> REJECTED (rejected, reverts to normal calculation). Permissions are ALREADY set up in the sheet: kpi_event.create = MEMBER+SUPERVISOR+DEVELOPER, kpi_event.approve = DEVELOPER only (the exact same pattern as rca.close), attitude.assess = SUPERVISOR+DEVELOPER. Every change is stored as an audit trail.",
 guide_step12_p9: "Partial Adjustment formula is DIFFERENTIATED by event type (Aug 27): Rain uses only Hours Lost (the team resumes immediately once it clears, no recovery time needed). Equipment Breakdown uses Hours Lost + Recovery Hours (extra time needed to warm up the machine & relocate to the working front once the equipment is back to normal). Example: 2-hour breakdown + 1-hour recovery out of a 10-hour workday -> target is adjusted proportionally to the 7 remaining hours (NOT 8). The KPIEvent sheet needs two separate columns (Hours Lost, Recovery Hours) so the witnessed fact and the added estimate can still be traced separately during an audit. Required validation: if (Hours Lost + Recovery Hours) >= the day's Normal Working Hours, the event automatically becomes a Full Exclusion instead of a Partial Adjustment.",
 guide_step12_p7: "Anti double-penalty: Lateness is counted in only one place (don't dock it in both Attendance AND Attitude->Discipline). Each pillar's score is capped at 100 -- if you want to reward over-target achievement, create a separate Bonus, don't mix it into a pillar score.",
 guide_step12_p8: "STATUS Aug 28 -- THE ENTIRE DATA LAYER IS DONE. The KPIEvent sheet (17 columns) and Attitude sheet (9 columns) have been created in Google Sheets. SecurityConfig has 5 new KPI_* rows. RolePermissions has kpi_event.create/approve + attitude.assess added, confirmed to match the design exactly. What remains is purely the CODE layer: backend (Code.gs -- addKpiEvent, approveKpiEvent, submitAttitudeAssessment, calculation engine) and frontend (proposal form, approval panel, KPI score card).",
 guide_step12_p10: "NEW (Aug 27, adopted from an external document audit): Administrative absence (Izin/Cuti) does NOT reduce Attendance -- excluded from Eligible Working Days, same principle as Full Exclusion. Needs NO new field/sheet -- reuses the already-working JSA_Log attendance_status data (Hadir/Izin/Cuti) via addJsaLog. Sick leave is not yet included (no medical-evidence storage exists) -- if needed later, it becomes a 4th status on the same attendance_status field, not a new mechanism.",
 guide_step12_p11: "NEW (Aug 27): Optional Safety Gate (ON/OFF, default OFF, keys KPI_SAFETY_GATE_ENABLED+KPI_SAFETY_GATE_THRESHOLD in SecurityConfig) -- an extra safeguard so other high pillars can't \"mask\" a poor Safety score, NOT a replacement for the Safety pillar score itself. \"Not Required\" category on the Reporting pillar -- an AUTOMATIC consequence of a Full Exclusion day (not a separate KPIEvent), excluded from the Reporting denominator, distinct from a report that's genuinely late/failed. REJECTED from the same document: bringing back Production/Tonnage as a KPI pillar (contradicts the already-locked controllability decision). DEFERRED: per-item JSA partial scoring (the current feature is a binary confirmation), Union Time (anticipates a case that hasn't actually occurred yet).",
 guide_step12_p12_title: "STATUS Aug 28 -- Pillar 4 (On-Time Reporting) DONE & live (badge now shown on KPI Member cards). KPIEvent test scenario guide below -- NOT YET run by the user, deferred until the other pillars are done.",
 guide_step12_p13: "How to test the KPIEvent Full Exclusion scenario (to be run later): (1) KPI Member tab -> \"Propose Event\" -> Type=Full Exclusion, fill in Event Date & Reason. (2) Log in as Developer (a DIFFERENT account from the proposer, anti self-approve) -> approve in the KPIEvent panel. (3) Check ?sheet=kpiscore&member_id=NAME&periode=yyyy-MM -- the eligible_days field should drop by 1 from the month's total calendar days.",
 guide_step12_p14: "FIXED Aug 28 (v90.2.115): eligible_days is now a REAL denominator in Pillar 4 -- the formula loops per ELIGIBLE DAY (no longer per submitted row), a day with NO submission at all is penalized as a missed report, and days excluded by an APPROVED KPIEvent (Full/Member Exclusion) are automatically skipped from scoring. A day with >1 row (different Pit) only counts as on-time if EVERY row that day is on-time. Validated with 4 Node.js simulation tests, including the exact scenario the user requested (empty day = fail, Full Exclusion genuinely changes the score).",
  blockmodel_title: "Block Model vs Actual",
  blockmodel_th_blok: "Block",
  blockmodel_th_ni: "Ni % (Est -> Act)",
  blockmodel_th_fe: "Fe % (Est -> Act)",
  blockmodel_th_sm: "SM % (Est -> Act)",
  blockmodel_th_estimasi: "Estimated (Ton)",
  blockmodel_th_realisasi: "Actual (Ton)",
  blockmodel_th_variasi: "Variance %",
  blockmodel_th_status: "Status",
  blockmodel_variance_note: "Variance % highlighted in yellow = Loss (Actual < Estimate), in red = Dilution (Actual > Estimate). Coloring only applies to blocks with Safe/Not Safe status -- blocks Awaiting Data cannot be assessed yet. Click a row to see the full chemical comparison detail (Ni/Fe/Co/MgO/SiO2/SM) Estimate vs Actual, including the Validation (Test Pit) cross-check.",
  blockmodel_detail_title: "Chemical Comparison Detail",
  blockmodel_detail_validasi_label: "Validation (Test Pit, before mining)",
  blockmodel_detail_th_param: "Parameter",
  blockmodel_detail_th_est: "Estimate",
  blockmodel_detail_th_akt: "Actual",
  blockmodel_detail_th_selisih: "Difference",
  nav_issue: "Issue & Action",
  nav_kpimember: "KPI Member",
  nav_chat: "Team Chat",
  nav_settings: "Settings",
  chat_title: "Geology Team Chat",
  chat_subtitle: "Messages are automatically saved to Google Sheets (ChatLog sheet).",
  chat_identity_label: "Send as:",
  chat_loading: "Loading messages...",
  chat_input_placeholder: "Type a message...",
  page_title_ringkasan: "Daily Geologist Report",
  sub_live_api: "Today's mining production & grade performance summary",
  all_pit: "All Pits",
  btn_export: "Export Report",
  opt_csv: "📊 Export CSV",
  opt_pdf: "📄 Export PDF",
  opt_word: "📝 Export Word",
  auto_refresh: "Auto Refresh:",
  auto_refresh_value: "60 Seconds",
  sync_status_label: "Sync Status:",
  sync_connecting: "Connecting...",
  session_idle_warning: "Session will end in about {minutes} minutes due to inactivity.",
  tooltip_refresh_data: "Manually refresh data from Google Sheets",
  tooltip_toggle_theme: "Toggle Dark/White theme",
  tooltip_sidebar_collapse: "Collapse/Expand Sidebar",
  tooltip_print_view: "Print this page view (Developer only)",
  tooltip_export_report: "Export Report",
  tooltip_active_member: "Active member",
  tooltip_filter_date_pit: "Filter Date & Pit",
  tooltip_filter_pit: "Filter by Pit",
  tooltip_filter_start: "Start Date Filter",
  tooltip_filter_end: "End Date Filter",
  tooltip_reset_filter: "Reset Date & Pit Filter",
  tooltip_periodic_report: "Periodic Report",
  tooltip_professional_report: "Professional Reconciliation Report",

  tooltip_cog: "Configure COG",
  tooltip_flag: "Configure Flag",
  tooltip_bucket: "Configure Bucket",
  tooltip_show_pin: "Show PIN",
  tooltip_developer_access: "Open Developer Access",
  tooltip_credential_manager: "Manage Users without Credentials",
  credential_manager_title: "Credential Manager (Developer)",
  credential_manager_desc: "List of active Users without a record in the Credential sheet. This feature only creates Credentials; it does not create or modify Users, Members, Roles, or Permissions.",
  credential_manager_loading: "Loading Users without Credentials...",
  tooltip_close: "Close",
  tooltip_member_input_rule: "3-40 characters: letters, numbers, dot, underscore, or hyphen",
  tooltip_pin_rule: "PIN must be exactly 6 digits",
  member_empty: "No member data found in Google Sheets. Please fill in the form first.",
  member_load_error: "Failed to load member data from Google Sheets.",
  retry: "Retry",
  kpi_1: "TOTAL DIGGING TONNAGE",
  kpi_1_sub: "Daily Target Achieved",
  unit_ton: "Tons",
  kpi_2: "TOTAL ORE",
  kpi_3: "AVERAGE NI GRADE",
  kpi_3_sub: "Minimum Target: 1.30% (Safe)",
  kpi_3b: "AVERAGE NI % (EXCLUDING WASTE)",
  kpi_3b_sub: "Saprolite, Limonite & LG only",
  kpi_ore_sub: "Saprolite, Limonite & LG",
  kpi_4: "STRIP RATIO (SR)",
  chart_1_title: "Material Distribution Per Block",
 summary_bm_estimasi: "Total Block Model Estimate",
 summary_bm_estimasi_ni: "Ni % Estimated",
 summary_bm_realisasi: "Total Actual Realized",
 summary_bm_realisasi_ni: "Ni % Actual",
 summary_bm_variance: "Overall Variance",
  chart_2_title: "Ni Grade % vs Target per Material Type",
  trend_box_1: "Peak Daily Production",
  trend_box_2: "Highest Nickel Grade Observed",
  trend_box_status: "Stable",
  trend_box_3: "Grade Stability Index",
  trend_1_title: "Digging Tonnage Trend (Daily)",
  trend_1_desc: "Daily actual mining material movement production capacity movement chart.",
  btn_trend_tonase: "Digging Tonnage",
  btn_trend_ni: "Ni Grade Fluctuation",
  btn_trend_sm: "SM Distribution",
  btn_trend_monthly: "Month over Month",
  trend_monthly_tonase_label: "Tonnage This Month vs Last Month",
  trend_monthly_ni_label: "Average Ni % This Month vs Last Month",
  search_placeholder: "Search by Block, Material, Pit...",
  all_material: "All Materials",
  th_no: "No",
  th_date: "Date",
  th_day: "Shift",
  th_pit: "Pit",
  th_block: "Block",
  th_material: "Material",
  th_id_sampel_col: "Sample ID",
  th_total_sampel: "Total Samples",
  th_tonnage: "Tonnage",
  th_ni: "Ni %",
  th_fe: "Fe %",
  th_co: "Co %",
  th_mgo: "MgO %",
  th_sio2: "SiO2 %",
  th_sm: "SM %",
  th_id_efo: "EFO ID",
  th_id_eto: "ETO ID",
  th_ship: "Ship",
  th_status: "Grade Status",
  th_reporter_col: "Reporter",
  export_source_label: "Data Source",
  export_source_digging: "Digging Table",
  export_source_member: "KPI Member",
  export_source_rekonsiliasi: "Reconciliation",
  export_source_validasi: "Validation",
  export_source_rca: "RCA Log",
  export_orientation_label: "Print Orientation",
  export_orientation_portrait: "Portrait",
  export_orientation_landscape: "Landscape",
  export_th_nama: "Name",
  export_th_jabatan: "Position",
  export_th_inspeksi: "Bench Inspection",
  export_th_accuracy: "Accuracy",
  export_th_status: "Status",
  export_th_grade: "Grade",
  digging_form_btn: "Add Entry",
  digging_form_title: "Digging Production Data Entry",
  digging_form_subtitle: "Record daily production & assay results to the Produksi_GC sheet.",
  digging_form_date: "Date",
  digging_form_date_locked: "Automatically today, cannot be changed.",
  digging_form_shift: "Shift",
  digging_form_weather: "Weather",
  digging_form_reporter: "Reporter",
  digging_form_pit: "Pit",
  digging_form_block: "Block",
  digging_form_tipe_ore: "Ore Type",
  digging_form_sample_id: "Sample ID",
  digging_form_total_sampel: "Total Samples (Sacks)",
  digging_form_tonase: "Tonnage (Automatic)",
  digging_form_tonase_note: "Total Samples x Buckets per Sample x WMT per Bucket (Settings > Bucket & Sample).",
  digging_form_ni: "Ni %",
  digging_form_fe: "Fe %",
  digging_form_co: "Co %",
  digging_form_tujuan: "Destination",
  update_tujuan_cancel_btn: "Cancel",
  digging_form_mgo: "MgO %",
  digging_form_sio2: "SiO2 %",
  digging_form_sm: "SM %",
  digging_form_auto: "(auto)",
  digging_form_destination: "Destination",
  digging_form_ship: "Ship Name",
  digging_form_footer_note: "Make sure assay data is accurate before saving.",
  btn_save_digging: "Save Data",
  digging_detail_title: "Production Row Detail",
  digging_detail_waktu_input: "Input Time",
  digging_detail_weather: "Weather",
  digging_detail_sample_id: "Sample ID",
  digging_detail_destination: "Destination",
  digging_detail_ship: "Ship Name",
  digging_detail_reporter: "Reporter",
  digging_detail_shipping_tracking: "Shipping ID Tracking",
  digging_detail_id_efo: "EFO ID",
  digging_detail_id_eto: "ETO ID",
  digging_detail_keterangan: "Notes",
  digging_detail_update_btn: "Update Destination & Shipping ID",
  digging_detail_update_assay_btn: "Update Assay Result",
  update_assay_title: "Update Assay Result",
  update_assay_notice: "Fill in the lab assay result. Material (Waste/LG/MG/HG/VHG) will be recalculated automatically once Ni % is filled in.",
  update_assay_save_btn: "Save Assay Result",
  digging_detail_dome_history_btn: "View Dome History",
  digging_detail_tujuan_history_btn: "View Destination History",
  tujuan_history_title: "Destination Change History",
  dome_history_title: "Dome Transaction History",
  dome_history_loading: "Loading history...",
  update_tujuan_title: "Update Destination & Shipping ID",
  update_tujuan_warning: "This change directly overwrites the matching row in Google Sheets based on ID Sampel. Make sure the ID Sampel is correct.",
  update_tujuan_baris_ni: "This Row's Ni %",
  update_tujuan_dome_baru: "Open New Dome",
  update_tujuan_dome_baru_konfirmasi_2: "Create This Dome",
  update_tujuan_opt_tongkang: "Barge",
  update_tujuan_pic: "PIC",
  update_tujuan_split_eto_efo: "ETO + EFO",
  update_tujuan_split_eto_tongkang: "ETO + Barge",
  update_tujuan_split_efo_tongkang: "EFO + Barge",
  update_tujuan_split_tonase_ph: "Tonnage for this portion",
  update_tujuan_split_catatan_ph: "e.g. Barge scheduled in 2 days",
  update_tujuan_save_btn: "Save Changes",
  digging_detail_assay_recap: "Assay Recap",
  loading_data: "Loading data...",
  table_info_default: "Showing 0 data rows",
  issue_box_1: "Open Issue",
  issue_box_2: "In Progress",
  issue_box_3: "Resolved",
  issue_title: "Mining Operational Issues & Action Recommendations",
  issue_filter_all: "All Status",
  issue_filter_open: "Open",
  issue_filter_progress: "In Progress",
  issue_filter_close: "Close / Resolved",
  btn_add_issue: "New Issue",
  btn_delete_all_issue: "Delete All",
  issue_th_date: "Date & Time",
  issue_th_reporter: "Reporter",
  issue_loc: "Location",
  issue_cat: "Issue Category",
  issue_desc: "Issue Description",
  issue_rec: "Action Recommendation",
  issue_pic: "PIC",
  issue_target: "Target",
  issue_th_status: "Status",
  issue_empty_filter: "No issue data matches the status filter.",
  kpimember_title: "Geology Team Member KPI & Performance",
  kpimember_desc: "Click on a member card to view full attendance, performance, and grading detail.",
  btn_form_member: "Member Form",
  loading_members: "Fetching member data from Google Sheets...",
  leaderboard_title: "Geologist Leaderboard",
  leaderboard_desc: "Ranked by Current Accuracy (OLD Accuracy Grade system -- NOT the new 5-Pillar KPI Engine Final Score) -- automatically calculated from the same KPI Member data above, NOT tied to any specific period.",
  leaderboard_empty: "No members with a numeric Accuracy value to rank yet.",
  leaderboard_col_accuracy: "Accuracy",
  sublot_radar_title: "Chemical Fingerprint",
  sublot_radar_desc: "Actual as a percentage of Plan per element -- the dashed circle is the 100% reference (exact match with Plan).",
  retention_title: "Retention & Archive",
  retention_desc: "Non-ACTIVE Sessions are deleted after 7 days. SecurityAuditLog and AuditTrail are moved to the archive sheet after 90 days.",
  retention_enable_label: "Enable scheduled run",
  retention_sessions_label: "Sessions (days)",
  retention_security_label: "SecurityAuditLog (days)",
  retention_audit_label: "AuditTrail (days)",
  retention_chatlog_label: "ChatLog (optional)",
  retention_btn_save: "Save Policy",
  retention_btn_run: "Run Now",
  session_cache_title: "Session Cache",
  session_cache_desc: "Caches session validation results for a few seconds so back-to-back requests (tab polling) don't re-scan Sessions/Users/Credential every time. Still fully re-validates security on every cache miss -- default OFF.",
  session_cache_enable_label: "Enable cache",
  session_cache_ttl_label: "Cache TTL (seconds, 5-60)",
  session_cache_btn_save: "Save Policy",
  api_abuse_guard_title: "API Abuse Guard",
  api_abuse_guard_desc: "Limits requests per session within a time window -- protects logged-in tokens from repeated abuse (e.g. a leaked token used to spam requests). Login rate-limit still runs separately. Default OFF.",
  api_abuse_guard_enable_label: "Enable guard",
  api_abuse_guard_max_label: "Max requests (10-1000)",
  api_abuse_guard_window_label: "Time window (seconds, 10-300)",
  api_abuse_guard_btn_save: "Save Policy",
  compact_card_title: "Compact Blank Rows (Developer)",
  compact_card_desc: "Only compacts rows that are completely empty. Headers and rows still containing data are left untouched.",
  compact_sheet_label: "Target Sheet",
  compact_preview_btn: "Preview",
  compact_execute_btn: "Compact Now",
  compact_status_idle: "Select a sheet then run Preview. No data is changed at this stage.",
  compact_status_loading: "Scanning for blank rows...",
  compact_status_none: "Sheet {sheet}: no blank rows found out of {rows} data rows.",
  compact_status_ready: "Found {count} blank rows in sheet {sheet} (out of {rows} data rows): {list}",
  compact_status_preview_required: "Run Preview first before compacting.",
  compact_status_executing: "Compacting blank rows...",
  compact_status_success: "Sheet {sheet} compacted successfully. Before: {before} rows, removed: {removed} blank rows, after: {after} rows.",
  compact_error_prefix: "Failed:",
  compact_confirm_title: "Compact Blank Rows",
  compact_confirm_message: "This will delete {count} blank rows in sheet {sheet}. Rows still containing data will NOT be touched. Continue?",
  pwa_update_title: "New version available",
  pwa_update_desc: "Reload to use the latest version of this dashboard.",
  pwa_update_btn_reload: "Reload",
  pwa_update_btn_dismiss: "Later",
  lang_theme_settings_title: "Language, Theme & Regional",
  lang_theme_settings_desc: "Set the language, appearance, timezone, and application date/time format.",
  regional_time_title: "Regional & Time",
  regional_timezone_label: "Timezone",
  regional_locale_label: "Locale",
  regional_date_format_label: "Date Format",
  regional_time_format_label: "Time Format",
  theme_dark: "Dark",
  theme_white: "White",
  regional_time_desc: "Official application timezone and date/time formats. Default: Asia/Jakarta · id-ID.",
  regional_time_save: "Save Regional & Time",
  regional_time_open: "Set Regional & Time",
  regional_time_modal_desc: "Set the official application timezone, locale, date format, and time format.",
  regional_time_cancel: "Cancel",
  settings_data_update_title: "Data Feed & Update History",
  settings_api_title: "Direct Feed Data Integration",
  settings_api_status: "Status:",
  settings_api_connected: "Directly Connected to Google Sheets API",
  settings_api_desc: "This dashboard data is automatically synchronized every 30 seconds.",
  dev_access_title: "Developer Access",
  dev_access_desc: "Unlock this to enable the \"Form Member\" (Add New Member) button. Applies only to this browser/device.",
  dev_access_error: "Wrong PIN, try again.",
  dev_access_placeholder: "Developer PIN",
  dev_access_unlock_btn: "Unlock",
  dev_access_active: "Active",
  dev_access_lock_btn: "Lock",
  dev_console_title: "Developer Console",
  dev_console_desc: "All Developer administration tools in one window.",
  dev_console_title_sistem: "Developer Console \u2014 System Control",
  dev_console_desc_sistem: "Credential, Cleanup Data, Compact Rows, Full Reset, Reset Member PIN.",
  dev_console_title_technical: "Developer Console \u2014 Technical Control",
  dev_console_desc_technical: "Reconciliation Guide, Global Parameters (COG, Color Flags, Bucket & Sample), & KPI Event Approval.",
  dev_console_open_sistem: "System",
  dev_console_open_technical: "Technical",
  dev_console_active_as: "Access active as",
  dev_console_credential: "Credential Manager",
  dev_console_credential_desc: "Create Credentials for active Users who do not have one yet.",
  dev_console_manage: "Manage",
  dev_console_cleanup: "Cleanup Data",
  dev_cleanup_panel_title: "Cleanup Data (Developer)",
  dev_cleanup_panel_desc: "Clear specific log sheets -- the Developer's own active session is always preserved.",
  dev_cleanup_btn_sessions: "Clear Sessions",
  dev_cleanup_btn_security: "Clear SecurityAuditLog",
  dev_cleanup_btn_audit: "Clear AuditTrail",
  retention_footer_note: "ChatLog defaults to OFF. Full Reset never touches security or archive data.",
  dev_console_reset: "Reset Total — Project Move",
  dev_console_guide: "Reconciliation Guide",
  dev_console_parameters: "Global Parameters",
  dev_console_close: "Close",
  dev_console_open: "Developer",
  dev_loading_title: "Verifying Developer Access",
  dev_loading_message: "Please wait while the server processes the login...",
  member_loading_title: "Verifying Member Login",
  member_loading_message: "Please wait while the server processes the login...",
  dev_operation_loading_title: "Processing Developer Operation",
  dev_operation_loading_message: "Please wait while the server processes the change...",
  changelog_title: "Dashboard Update History",
  changelog_version_label: "Version",
  changelog_desc: "view a summary of fixes & features.",
  changelog_view_all: "View All History",
  changelog_btn: "View Update History",
  jsa_btn: "View JSA",
  jsa_rca_btn: "Log RCA from JSA",
  jsa_confirm_btn: "Sign & Confirm Attendance",
  jsa_confirm_title: "JSA Sign-off & Attendance Confirmation",
  jsa_confirm_desc: "Confirm that you have read & understood JSA-MINEGEO-2026-REV02 before starting work.",
  jsa_confirm_nama: "Name",
  jsa_confirm_status: "Attendance Status",
  jsa_status_present: "Present",
  jsa_status_permission: "Permission",
  jsa_status_leave: "Leave",
  jsa_confirm_apd_label: "Mandatory PPE Checklist",
  jsa_apd_helm: "Safety Helmet (SNI)",
  jsa_apd_masker: "P2 / N95 Mask",
  jsa_apd_sarung_tangan: "Gloves",
  jsa_apd_rompi: "Reflective Vest",
  jsa_confirm_submit: "Confirm & Save",
  dev_profile_btn: "Developer Profile",
  dev_profile_role: "Head Mine Geologist / Developer",
  dev_profile_desc: "Designed & developed this mining operations dashboard.",
  dev_profile_view_full: "View More",
  dev_profile_app_info: "Mine Geologist · Geobank Minerals",
  preview_modal_title: "Report Export Preview",
  preview_modal_subtitle: "Check data summary before downloading file.",
  preview_format: "File Format",
  preview_rows: "Total Data Rows",
  preview_pit: "Active Pit Filter",
  preview_sample: "Data Sample (Top 5 Rows)",
  btn_cancel: "Cancel",
  btn_confirm_download: "Confirm & Download",
  modal_contact: "Contact Information",
  modal_whatsapp: "WhatsApp Number",
  modal_attendance: "Attendance Summary",
  modal_present: "Present",
  modal_permission: "Permission",
  modal_leave: "Leave",
  modal_field_perf: "Field Performance",
  modal_blending_target: "Blending Target",
  modal_bench_insp: "Bench Inspection",
  modal_notes_title: "Notes & Performance Detail",
  modal_grading_standard: "Waste Non COG",
  modal_grading_desc: "Tonnage & Average Ni from this Member's Produksi_GC rows classified as Waste (below the minimum COG threshold in Settings).",
  modal_curr_accuracy: "Waste Tonnage @ Avg Ni",
  form_member_title: "Geology Member & KPI Form",
  form_member_subtitle: "Fill out the form below to add new member data.",
  form_general_info: "General Information",
  form_fullname: "Full Name",
  form_role: "Role / Position",
  form_whatsapp: "WhatsApp Number",
  form_account_access_title: "Member Account & Access",
  form_account_access_desc: "The account is created by the Developer. The PIN is used only during this process and immediately hashed on the server.",
  form_login_id: "Login_ID",
  form_email: "Registered Email",
  form_pin: "Member PIN (6 digits)",
  form_pin_confirm: "Confirm PIN",
  form_pin_security_note: "The original PIN is never stored in Google Sheets. Only PIN_Hash is stored in Credential.",
  form_field_perf: "Field Performance",
  form_target_blending: "Blending Target (%)",
  form_bench_insp: "Bench Inspection",
  form_accuracy: "Accuracy Grade (%)",
  form_grade: "Grade",
  form_status: "Status",
  form_member_footer_note: "Make sure data is filled correctly before saving.",
  btn_save_member: "Save Member",
  issue_modal_title: "Add New Issue & Action Plan Form",
  issue_modal_subtitle: "Record mining operational obstacles and corrective action recommendations.",
  issue_form_datetime: "Automatic Date & Time",
  issue_form_reporter: "Reporter",
  issue_form_location: "Location / Pit",
  issue_form_category: "Issue Category",
  issue_form_desc: "Issue Description / Impact",
  issue_form_rec: "Action Recommendation",
  issue_form_pic: "Person in Charge (PIC)",
  issue_form_target: "Completion Target",
  issue_form_status: "Status",
  issue_form_footer_note: "Make sure issue data is accurate before saving.",
  btn_save_issue: "Save Issue"
 }
};

// ============================================================
// JSA (JOB SAFETY ANALYSIS) -- HTML Content
// ============================================================
window.JSA_HTML_CONTENT = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Safety Analysis - Mine Geologist</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    @media print {
      body { padding: 0; background-color: white; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body class="bg-gray-50 text-neutral-900 font-sans p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">

  <!-- HALAMAN 1: HEADER & OVERVIEW PEKERJAAN -->
  <div class="bg-white border-2 border-black p-4 shadow-sm">
    <!-- Header Utama -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b-2 border-black">
      <div class="md:col-span-8 flex items-start gap-4">
        <div class="bg-[#0f1a3d] text-white font-black text-2xl p-3 rounded shrink-0">GB</div>
        <div>
          <div class="flex flex-wrap items-center gap-2 text-xs font-bold mb-1">
            <span class="bg-[#0f1a3d] text-white px-2.5 py-1 rounded">NO: JSA-MINEGEO-2026-REV02</span>
            <span class="bg-[#0f1a3d] text-white px-2.5 py-1 rounded tracking-widest uppercase">No Ore is Worth Your Life • GEO NICKEL LATERITE</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black leading-tight uppercase mt-0.5">JOB SAFETY ANALYSIS <span class="text-lg font-bold text-red-700 align-middle">DIVISION MINE GEOLOGIST</span></h1>
          
          <div class="flex flex-wrap gap-2 mt-3 text-xs font-bold">
            <span class="border border-black px-2.5 py-1 rounded">📍 PIT. STOCKPILE & JETTY</span>
            <span class="border border-black px-2.5 py-1 rounded" id="dateBadge">📅 <span id="jsa-tgl">..</span>/<span id="jsa-bln">..</span>/<span id="jsa-thn">....</span> (<span id="jsa-hari">.....</span>) 🕐 <span id="jsa-jam">..:..</span></span>
          </div>
        </div>
      </div>

      <div class="md:col-span-4 border-t md:border-t-0 md:border-l border-black pt-3 md:pt-0 md:pl-4 text-xs space-y-1.5">
        <div class="flex justify-between"><span class="font-bold text-neutral-600">DEPARTEMEN:</span> <span class="font-semibold">Geology & Mine Planning</span></div>
        <div class="flex justify-between"><span class="font-bold text-neutral-600">DISUSUN OLEH:</span> <span class="font-semibold">Superintendent Mine Geologist</span></div>
        <div class="flex justify-between"><span class="font-bold text-neutral-600">DIPERIKSA OLEH:</span> <span class="font-semibold">Superintendent K3 & Geotech</span></div>
        <div class="flex justify-between"><span class="font-bold text-neutral-600">DISETUJUI OLEH:</span> <span class="font-semibold">Mine Manager / KTT</span></div>
        <div class="mt-2 bg-red-100 border border-red-700 text-red-800 font-bold p-1.5 text-center text-[11px] rounded uppercase">
          ⚠️ DOKUMEN WAJIB DI TOOLBOX MEETING
        </div>
      </div>
    </div>

    <!-- Ringkasan Pekerjaan, Alat & APD -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 text-xs">
      <div class="md:col-span-4 border-b md:border-b-0 md:border-r border-black pb-4 md:pb-0 md:pr-4">
        <h3 class="font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">📋 DESKRIPSI PEKERJAAN</h3>
        <p class="text-justify leading-relaxed text-neutral-800">
          Pekerjaan Mine Geologist mencakup validasi block model, pengambilan sampel grade control (saprolit/limonit), supervisi penggalian excavator & dump truck, pengelolaan material, pengawasan barging shipment, pelabelan ID sampel & chain of custody, entry data di dashboard MINE GEOLOGIST, serta handling preparasi sampel untuk analisa kimia Ni, Fe, SiO2, MgO, Co di area pit aktif & jetty dengan risiko tinggi heavy equipment, geotechnical, dan marine operations.
        </p>
      </div>

      <div class="md:col-span-4 border-b md:border-b-0 md:border-r border-black pb-4 md:pb-0 md:pr-4">
        <h3 class="font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">📦 ALAT & MATERIAL</h3>
        <ul class="list-disc list-inside space-y-1 text-neutral-800 leading-tight">
          <li>Light Vehicle 4x4, Radio HT, GPS Handheld</li>
          <li>Cangkul, Linggis, Sekop, Kantong Sampel, Spidol Permanen</li>
          <li>Peta Grade Control, Patok Batas, Roll Meter, Kompas</li>
          <li>Tablet Dashboard MINE GEOLOGIST, Form CoC, Kamera</li>
          <li>Peralatan Lab: Crusher, Splitter, Oven, Timbangan</li>
          <li>Rambu, Cone, Bendera Buggy Whip, APAR 3kg di LV</li>
        </ul>
      </div>

      <div class="md:col-span-4">
        <h3 class="font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">🛡️ APD WAJIB (MINIMUM)</h3>
        <div class="grid grid-cols-2 gap-1.5 font-semibold text-[11px]">
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Helm Safety (SNI)</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Kacamata Safety</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Masker P2 / N95</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Sarung Tangan</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Safety Boots Steel</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Rompi Reflektif</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Life Jacket (Jetty)</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Earplug (Area Bising)</div>
        </div>
        <p class="text-[10px] text-neutral-500 italic mt-2">*APD harus SNI, dalam kondisi layak, dipakai area kerja tambang.</p>
      </div>
    </div>
  </div>

  <!-- HALAMAN 2: TABEL TAHAPAN KERJA 1-10 -->
  <div class="bg-white border-2 border-black p-4 shadow-sm">
    <div class="bg-[#0f1a3d] text-white p-2 mb-4 flex justify-between items-center">
      <h2 class="font-bold text-sm tracking-wider uppercase">TABEL TAHAPAN KERJA - <span class="italic normal-case">"No Ore is Worth Your Life - Lihat, Pikir, Aman"</span></h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-xs text-left border-collapse border border-black">
        <thead>
          <tr class="bg-[#0f1a3d] text-white uppercase text-[11px]">
            <th class="border border-black p-2 w-[40px] text-center">No</th>
            <th class="border border-black p-2 w-[180px]">Tahapan Kerja</th>
            <th class="border border-black p-2 w-[180px]">Bahaya Utama</th>
            <th class="border border-black p-2 w-[80px] text-center">Risiko</th>
            <th class="border border-black p-2">Tindakan Pengendalian</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black">
          <tr>
            <td class="border border-black p-2 text-center font-bold">1</td>
            <td class="border border-black p-2 font-semibold">Perjalanan ke Front Tambang / Area Kerja</td>
            <td class="border border-black p-2">Tabrakan DT/alat berat, jalan licin limonit, debu tebal</td>
            <td class="border border-black p-2 text-center bg-yellow-200 font-bold">HIGH</td>
            <td class="border border-black p-2">Pemeriksaan P2H LV 4x4, lampu rotari ON, kecepatan maks 30km/h, radio, masker P2, jaga jarak aman 50m dari DT.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">2</td>
            <td class="border border-black p-2 font-semibold">Inspeksi Bench & Safety Talk (P5M)</td>
            <td class="border border-black p-2">Highwall longsor, batu jatuh (rockfall)</td>
            <td class="border border-black p-2 text-center bg-yellow-200 font-bold">HIGH</td>
            <td class="border border-black p-2">Cek Kondisi Fisik Batuan (IBH), dilarang di bawah highwall >3m, safety talk 5 menit, helm + kacamata safety.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">3</td>
            <td class="border border-black p-2 font-semibold">Validasi Test Pit & Pemetaan Geologi</td>
            <td class="border border-black p-2">Lubang terbuka, tertimbun dinding test pit</td>
            <td class="border border-black p-2 text-center bg-yellow-100 font-bold">MEDIUM</td>
            <td class="border border-black p-2">Pasang rambu/barikade, tutup lubang setelah selesai, angkut beban &lt;20kg, terapkan buddy system.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">4</td>
            <td class="border border-black p-2 font-semibold">Grade Control Sampling (Saprolit/Limonit)</td>
            <td class="border border-black p-2">Debu silika, tanah licin, mis-grade Ni%</td>
            <td class="border border-black p-2 text-center bg-yellow-100 font-bold">MEDIUM</td>
            <td class="border border-black p-2">Basahi permukaan berdabu, masker P2 + gloves, patuhi SOP sampling, label ID double check.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">5</td>
            <td class="border border-black p-2 font-semibold">Chain of Custody & Pelabelan Sampel</td>
            <td class="border border-black p-2">Tertukar sampel, kontaminasi mineral</td>
            <td class="border border-black p-2 text-center bg-yellow-100 font-bold">MEDIUM</td>
            <td class="border border-black p-2">Tulis ID spidol permanen, foto lokasi, masukan data ke dashboard MINE GEOLOGIST real-time.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">6</td>
            <td class="border border-black p-2 font-semibold">Supervisi Excavator Digging & Loading</td>
            <td class="border border-black p-2">Tertabrak bucket/counterweight, blind spot operator</td>
            <td class="border border-black p-2 text-center bg-red-200 text-red-900 font-bold">EXTREME</td>
            <td class="border border-black p-2 font-medium"><span class="font-bold underline">Jaga jarak aman 15-20m (1.5x radius boom)</span>, kontak visual/radio sebelum mendekat, vest high-vis. <strong>JANGAN DI BAWAH BUCKET.</strong></td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">7</td>
            <td class="border border-black p-2 font-semibold">Pengelolaan Material</td>
            <td class="border border-black p-2">Longsoran tumpukan ore</td>
            <td class="border border-black p-2 text-center bg-yellow-100 font-bold">MEDIUM</td>
            <td class="border border-black p-2">Jaga jarak dari lereng tumpukan ore (>5m), koordinasi via radio Channel sudah diseusaikan, pastikan area sekitar pijakan stabil.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">8</td>
            <td class="border border-black p-2 font-semibold">Entry Data & Pelaporan Final</td>
            <td class="border border-black p-2">Kesalahan input data kimia/lokasi</td>
            <td class="border border-black p-2 text-center bg-green-100 font-bold">LOW</td>
            <td class="border border-black p-2">Verifikasi ulang data lab vs titik lokasi pit sebelum approval pengiriman.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- HALAMAN 3: PROSEDUR DARURAT & LEMBAR PENGESAHAN -->
  <div class="bg-white border-2 border-black p-4 shadow-sm space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs items-start">
      
      <!-- Hirarki Pengendalian -->
      <div class="md:col-span-4 border-b md:border-b-0 md:border-r border-black pb-4 md:pb-0 md:pr-4">
        <h3 class="font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">🛡️ HIRARKI PENGENDALIAN RISIKO</h3>
        <div class="space-y-1.5">
          <div class="bg-[#0f1a3d] text-white p-1.5 text-[11px]"><strong>1. Eliminasi:</strong> Tunda kerja saat hujan deras / petir / highwall retak</div>
          <div class="bg-[#0f1a3d] text-white p-1.5 text-[11px]"><strong>2. Substitusi:</strong> Wet sampling untuk tekan debu, foto drone kestabilan</div>
          <div class="bg-neutral-600 text-white p-1.5 text-[11px]"><strong>3. Rekayasa:</strong> Berm, tanggul test pit, dust collector, gangway jetty</div>
          <div class="bg-yellow-400 text-black p-1.5 text-[11px] font-semibold"><strong>4. Administratif:</strong> SOP Pit Access, Radio, P5M, rambu, spotter</div>
          <div class="border border-black p-1.5 text-[11px]"><strong>5. APD:</strong> Helm, masker P2, kacamata, vest, boots, life jacket, earplug</div>
        </div>
      </div>

      <!-- Prosedur Darurat & Kontak -->
      <div class="md:col-span-5 border-b md:border-b-0 md:border-r border-black pb-4 md:pb-0 md:pr-4">
        <h3 class="font-bold uppercase tracking-wider text-red-700 border-b border-black pb-1 mb-2">🚨 PROSEDUR DARURAT</h3>
        <ol class="list-decimal list-inside space-y-1 text-neutral-800 leading-tight mb-3">
          <li><strong>LONGSOR:</strong> Menjauh 90° dari arah longsor, lari ke high ground, tekan emergency channel.</li>
          <li><strong>TABRAKAN ALAT BERAT:</strong> Matikan mesin LV, amankan area 50m, jangan pindahkan korban spinal, panggil ERT.</li>
          <li><strong>PAPARAN KIMIA:</strong> Siram 15 menit di eye wash, lepas baju terkontaminasi, bawa MSDS ke klinik.</li>
        </ol>

        <div class="grid grid-cols-2 gap-2 text-center text-[11px]">
          <div class="border border-black p-1.5 rounded">
            <span class="block font-bold">CH ERT PIT</span>
          </div>
          <div class="border border-black p-1.5 rounded">
            <span class="block font-bold">CH KLINIK SITE</span>
          </div>
          <div class="border border-black p-1.5 rounded">
            <span class="block font-bold">MUSTER POINT PIT</span>
            <span class="font-semibold">Gate 1 & Office</span>
          </div>
          <div class="bg-red-700 text-white p-1.5 rounded font-bold">
            ATURAN 30-30 PETIR<br>Stop kerja jika kilat &lt;30s
          </div>
        </div>
      </div>

      <!-- Komunikasi & Rambu -->
      <div class="md:col-span-3">
        <h3 class="font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">📡 KOMUNIKASI & RAMBU</h3>
        <div class="space-y-1 text-[11px] mb-3">
          <div class="flex justify-between border border-black p-1"><span>Ch Emergency</span> <span class="bg-red-700 text-white px-1 font-bold">STANDBY</span></div>
          <div class="flex justify-between border border-black p-1"><span>Ch Pit Office</span> <span class="bg-[#0f1a3d] text-white px-1 font-bold">MONITOR</span></div>
        </div>

        <h4 class="font-bold text-[11px] mb-1">RAMBU VISUAL DI PIT:</h4>
        <div class="grid grid-cols-3 gap-1 text-[9px] text-center font-bold mb-3">
          <div class="border border-red-700 text-red-700 p-1 flex items-center justify-center">DILARANG MASUK ALAT BERAT BEKERJA</div>
          <div class="border border-yellow-500 text-yellow-700 p-1 flex items-center justify-center">AWAS LONGSOR HIGHWALL TIDAK STABIL</div>
          <div class="border border-green-700 text-green-700 p-1 flex items-center justify-center">SAFE ZONE PARDIR GEOLOGIST</div>
        </div>

        <div class="border border-black p-2 text-[10px] text-neutral-700 rounded">
          <strong>Catatan:</strong> Selalu ikuti rambu, instruksi radio dari pengawas selama berada di area site.
        </div>
      </div>
    </div>

    <!-- Catatan Khusus Geologist - full width -->
    <div class="p-2 bg-yellow-50 border border-yellow-400 text-[11px] rounded">
      <strong>CATATAN KHUSUS GEOLOGIST:</strong> Ore Ni laterite bersifat licin saat basah (limonit). Selalu cek kestabilan pijakan. Pastikan Chain of Custody tidak putus.
    </div>

    <!-- Lembar Pengesahan -->
    <div class="border-t-2 border-black pt-4">
      <div class="flex items-center gap-2 mb-3">
        <h3 class="font-bold text-xs uppercase whitespace-nowrap">PENGESAHAN DOKUMEN JSA</h3>
        <span class="flex-1 border-t border-black"></span>
        <span class="border border-black px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">ISO 45001:2018 · SMKP MINERBA · ESDM</span>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] text-center">
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">DISUSUN OLEH</span>
          <span class="font-bold mb-4">Superintendent Mine Geologist</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">GEO-01 / MINE GEOLOGIST</div>
        </div>
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">DIPERIKSA OLEH</span>
          <span class="font-bold mb-4">K3 & Geotech Engineer</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">K3 & GEOTECH</div>
        </div>
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">DISETUJUI OLEH</span>
          <span class="font-bold mb-4">Mine Manager / KTT</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">MINE MANAGER - KTT</div>
        </div>
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">GEOLOGIST ON DUTY</span>
          <span class="font-bold mb-4">Pelaksana Lapangan</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">GEOLOGIST ON DUTY</div>
        </div>
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">FOREMAN PIT</span>
          <span class="font-bold mb-4">Pengawas Lapangan</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">FOREMAN PIT / STOCKPILE</div>
        </div>
      </div>
    </div>

    <!-- Footer Bar -->
    <div class="bg-[#0f1a3d] text-white p-2 text-[10px] flex flex-wrap justify-between items-center gap-2 font-mono">
      <div class="flex flex-wrap items-center gap-2">
        <span class="bg-yellow-400 text-black px-1.5 py-0.5 font-bold">DOKUMEN K3 RAHASIA</span>
        <span>INDUKSI WAJIB SEBELUM MASUK PIT</span>
        <span>•</span>
        <span>REV 02</span>
        <span>•</span>
        <span>ISO45001:2018</span>
        <span>•</span>
        <span>SMKP MINERBA No. 1827 K/30/MEM/2018</span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-neutral-300">HAL 3/3 - JSA MINE GEOLOGIST</span>
        <span class="border border-white px-1.5 py-0.5 font-bold">JSA-MINEGEO-2026-REV02 · PT GEOBANK MINERALS</span>
      </div>
    </div>

    <!-- Slogan Bar -->
    <div class="bg-yellow-400 text-black p-1.5 text-center text-[10px] font-bold tracking-wide">
      NO ORE IS WORTH YOUR LIFE • SAFETY FIRST • PRODUCTION SECOND • QUALITY THIRD • GEO NICKEL LATERITE • ZERO LTI
    </div>

    <p class="text-[9.5px] text-neutral-500 text-center italic mt-1">
      Dokumen ini dibuat sesuai regulasi Kepmen ESDM No. 1827 K/30/MEM/2018 tentang Pedoman Pelaksanaan Kaidah Teknik Pertambangan Yang Baik. JSA harus direview ulang jika terjadi perubahan metode kerja, kecelakaan, atau minimal 1 tahun sekali.
    </p>
  </div>

  <script>
    (function () {
      try {
        var hariNama = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        var now = new Date();
        var tglEl = document.getElementById("jsa-tgl");
        var hariEl = document.getElementById("jsa-hari");
        var blnEl = document.getElementById("jsa-bln");
        var thnEl = document.getElementById("jsa-thn");
        var jamEl = document.getElementById("jsa-jam");
        if (tglEl) tglEl.textContent = String(now.getDate()).padStart(2, "0");
        if (hariEl) hariEl.textContent = hariNama[now.getDay()];
        if (blnEl) blnEl.textContent = String(now.getMonth() + 1).padStart(2, "0");
        if (thnEl) thnEl.textContent = now.getFullYear();
        if (jamEl) jamEl.textContent = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      } catch (e) {
        // Biarkan kosong / titik-titik untuk diisi manual jika JS gagal berjalan
      }
    })();
  <\/script>
</body>
</html>`;

// ============================================================
// JSA I18N (Terjemahan dokumen JSA ke Inggris)
// ============================================================
window.JSA_I18N_EN = {
  'Job Safety Analysis - Mine Geologist':'Job Safety Analysis - Mine Geologist',
  'JOB SAFETY ANALYSIS':'JOB SAFETY ANALYSIS',
  'DIVISION MINE GEOLOGIST':'MINE GEOLOGIST DIVISION',
  'PIT. STOCKPILE & JETTY':'PIT, STOCKPILE & JETTY',
  'DEPARTEMEN:':'DEPARTMENT:', 'DISUSUN OLEH:':'PREPARED BY:', 'DIPERIKSA OLEH:':'CHECKED BY:', 'DISETUJUI OLEH:':'APPROVED BY:',
  'DOKUMEN WAJIB DI TOOLBOX MEETING':'DOCUMENT REQUIRED AT TOOLBOX MEETING',
  'DESKRIPSI PEKERJAAN':'JOB DESCRIPTION', 'ALAT & MATERIAL':'TOOLS & MATERIALS', 'APD WAJIB (MINIMUM)':'MANDATORY PPE (MINIMUM)',
  'Helm Safety (SNI)':'Safety Helmet (SNI)', 'Kacamata Safety':'Safety Glasses', 'Masker P2 / N95':'P2 / N95 Mask', 'Sarung Tangan':'Gloves', 'Safety Boots Steel':'Steel Safety Boots', 'Rompi Reflektif':'Reflective Vest', 'Life Jacket (Jetty)':'Life Jacket (Jetty)', 'Earplug (Area Bising)':'Earplugs (Noisy Area)',
  'TABEL TAHAPAN KERJA':'WORK STEP TABLE', 'Lihat, Pikir, Aman':'Look, Think, Stay Safe', 'Tahapan Kerja':'Work Step', 'Bahaya Utama':'Main Hazard', 'Risiko':'Risk', 'Tindakan Pengendalian':'Control Measures',
  'Perjalanan ke Front Tambang / Area Kerja':'Travel to Mining Front / Work Area', 'Inspeksi Bench & Safety Talk (P5M)':'Bench Inspection & Safety Talk (P5M)', 'Validasi Test Pit & Pemetaan Geologi':'Test Pit Validation & Geological Mapping', 'Grade Control Sampling (Saprolit/Limonit)':'Grade Control Sampling (Saprolite/Limonite)', 'Chain of Custody & Pelabelan Sampel':'Chain of Custody & Sample Labelling', 'Supervisi Excavator Digging & Loading':'Excavator Digging & Loading Supervision', 'Pengelolaan Material':'Material Handling', 'Entry Data & Pelaporan Final':'Data Entry & Final Reporting',
  'HIGH':'HIGH', 'MEDIUM':'MEDIUM', 'EXTREME':'EXTREME', 'LOW':'LOW',
  'HIRARKI PENGENDALIAN RISIKO':'HIERARCHY OF RISK CONTROLS', 'Eliminasi':'Elimination', 'Substitusi':'Substitution', 'Rekayasa':'Engineering Controls', 'Administratif':'Administrative Controls',
  'PROSEDUR DARURAT':'EMERGENCY PROCEDURES', 'LONGSOR':'LANDSLIDE', 'TABRAKAN ALAT BERAT':'HEAVY EQUIPMENT COLLISION', 'PAPARAN KIMIA':'CHEMICAL EXPOSURE',
  'KOMUNIKASI & RAMBU':'COMMUNICATION & SIGNAGE', 'RAMBU VISUAL DI PIT:':'VISUAL PIT SIGNAGE:', 'Catatan:':'Note:', 'CATATAN KHUSUS GEOLOGIST:':'GEOLOGIST SPECIAL NOTE:',
  'PENGESAHAN DOKUMEN JSA':'JSA DOCUMENT APPROVAL', 'Tanda Tangan & Cap':'Signature & Stamp', 'Pelaksana Lapangan':'Field Operator', 'Pengawas Lapangan':'Field Supervisor', 'FOREMAN PIT':'PIT FOREMAN', 'GEOLOGIST ON DUTY':'GEOLOGIST ON DUTY',
  'Stop kerja jika kilat <30s':'Stop work if lightning is <30s', 'STANDBY':'STANDBY', 'MONITOR':'MONITOR',
  'No Ore is Worth Your Life':'No Ore is Worth Your Life',
  'Lihat, Pikir, Aman':'Look, Think, Stay Safe',
  'Pekerjaan Mine Geologist mencakup validasi block model, pengambilan sampel grade control (saprolit/limonit), supervisi penggalian excavator & dump truck, pengelolaan material, pengawasan barging shipment, pelabelan ID sampel & chain of custody, entry data di dashboard MINE GEOLOGIST, serta handling preparasi sampel untuk analisa kimia Ni, Fe, SiO2, MgO, Co di area pit aktif & jetty dengan risiko tinggi heavy equipment, geotechnical, dan marine operations.':'Mine Geologist work includes block model validation, grade control sampling (saprolite/limonite), excavator & dump truck excavation supervision, material handling, barging shipment supervision, sample ID labelling & chain of custody, data entry in the MINE GEOLOGIST dashboard, and sample preparation for Ni, Fe, SiO2, MgO, Co chemical analysis in active pit & jetty areas with high heavy-equipment, geotechnical, and marine-operation risks.',
  'Light Vehicle 4x4, Radio HT, GPS Handheld':'Light Vehicle 4x4, HT Radio, Handheld GPS',
  'Cangkul, Linggis, Sekop, Kantong Sampel, Spidol Permanen':'Hoe, Crowbar, Shovel, Sample Bags, Permanent Marker',
  'Peta Grade Control, Patok Batas, Roll Meter, Kompas':'Grade Control Map, Boundary Stakes, Measuring Tape, Compass',
  'Tablet Dashboard MINE GEOLOGIST, Form CoC, Kamera':'MINE GEOLOGIST Dashboard Tablet, CoC Form, Camera',
  'Peralatan Lab: Crusher, Splitter, Oven, Timbangan':'Lab Equipment: Crusher, Splitter, Oven, Scale',
  'Rambu, Cone, Bendera Buggy Whip, APAR 3kg di LV':'Signs, Cone, Buggy Whip Flag, 3kg Fire Extinguisher in LV',
  '*APD harus SNI, dalam kondisi layak, dipakai area kerja tambang.':'*PPE must comply with SNI, be in good condition, and be worn in mining work areas.',
  'Tabrakan DT/alat berat, jalan licin limonit, debu tebal':'Collision with DT/heavy equipment, slippery limonite road, heavy dust',
  'Pemeriksaan P2H LV 4x4, lampu rotari ON, kecepatan maks 30km/h, radio, masker P2, jaga jarak aman 50m dari DT.':'Perform P2H inspection of LV 4x4, rotary beacon ON, max speed 30 km/h, radio, P2 mask, maintain 50 m safe distance from DT.',
  'Highwall longsor, batu jatuh (rockfall)':'Highwall landslide, falling rocks (rockfall)',
  'Cek Kondisi Fisik Batuan (IBH), dilarang di bawah highwall >3m, safety talk 5 menit, helm + kacamata safety.':'Check Rock Physical Condition (IBH), do not stand below highwall >3 m, 5-minute safety talk, safety helmet + safety glasses.',
  'Lubang terbuka, tertimbun dinding test pit':'Open hole, buried by test pit wall',
  'Pasang rambu/barikade, tutup lubang setelah selesai, angkut beban <20kg, terapkan buddy system.':'Install signs/barricades, close the hole after completion, carry loads <20 kg, apply the buddy system.',
  'Debu silika, tanah licin, mis-grade Ni%':'Silica dust, slippery ground, Ni% mis-grade',
  'Basahi permukaan berdabu, masker P2 + gloves, patuhi SOP sampling, label ID double check.':'Wet dusty surfaces, P2 mask + gloves, follow the sampling SOP, double-check sample ID labels.',
  'Tertukar sampel, kontaminasi mineral':'Mixed-up samples, mineral contamination',
  'Tulis ID spidol permanen, foto lokasi, masukan data ke dashboard MINE GEOLOGIST real-time.':'Write the ID with permanent marker, photograph the location, enter data into the MINE GEOLOGIST dashboard in real time.',
  'Tertabrak bucket/counterweight, blind spot operator':'Struck by bucket/counterweight, operator blind spot',
  'Jaga jarak aman 15-20m (1.5x radius boom)':'Maintain a 15-20 m safe distance (1.5x boom radius)',
  'kontak visual/radio sebelum mendekat, vest high-vis.':'visual/radio contact before approaching, high-visibility vest.',
  'JANGAN DI BAWAH BUCKET.':'DO NOT STAND UNDER THE BUCKET.',
  'Longsoran tumpukan ore':'Ore stockpile collapse',
  'Jaga jarak dari lereng tumpukan ore (>5m), koordinasi via radio Channel sudah diseusaikan, pastikan area sekitar pijakan stabil.':'Keep distance from the ore stockpile slope (>5 m), coordinate by radio on the designated channel, ensure the footing area is stable.',
  'Kesalahan input data kimia/lokasi':'Chemical/location data entry error',
  'Verifikasi ulang data lab vs titik lokasi pit sebelum approval pengiriman.':'Re-verify lab data against the pit location point before shipment approval.',
  'Tunda kerja saat hujan deras / petir / highwall retak':'Stop work during heavy rain / lightning / cracked highwall',
  'Wet sampling untuk tekan debu, foto drone kestabilan':'Wet sampling to reduce dust, drone stability photos',
  'Berm, tanggul test pit, dust collector, gangway jetty':'Berm, test pit bund, dust collector, jetty gangway',
  'SOP Pit Access, Radio, P5M, rambu, spotter':'Pit Access SOP, Radio, P5M, signs, spotter',
  'Helm, masker P2, kacamata, vest, boots, life jacket, earplug':'Helmet, P2 mask, safety glasses, vest, boots, life jacket, earplugs',
  'Menjauh 90° dari arah longsor, lari ke high ground, tekan emergency channel.':'Move 90° away from the landslide direction, run to high ground, activate the emergency channel.',
  'Matikan mesin LV, amankan area 50m, jangan pindahkan korban spinal, panggil ERT.':'Shut down the LV engine, secure a 50 m area, do not move a suspected spinal-injury victim, call ERT.',
  'Siram 15 menit di eye wash, lepas baju terkontaminasi, bawa MSDS ke klinik.':'Flush at the eyewash for 15 minutes, remove contaminated clothing, bring the MSDS to the clinic.',
  'Gate 1 & Office':'Gate 1 & Office',
  'Ch Emergency':'Emergency Channel',
  'Ch Pit Office':'Pit Office Channel',
  'DILARANG MASUK ALAT BERAT BEKERJA':'NO ENTRY — HEAVY EQUIPMENT OPERATING',
  'AWAS LONGSOR HIGHWALL TIDAK STABIL':'CAUTION — UNSTABLE HIGHWALL LANDSLIDE',
  'SAFE ZONE PARDIR GEOLOGIST':'GEOLOGIST PARKING SAFE ZONE',
  'Selalu ikuti rambu, instruksi radio dari pengawas selama berada di area site.':'Always follow signs and radio instructions from the supervisor while in the site area.',
  'Ore Ni laterite bersifat licin saat basah (limonit). Selalu cek kestabilan pijakan. Pastikan Chain of Custody tidak putus.':'Lateritic Ni ore is slippery when wet (limonite). Always check footing stability. Ensure the Chain of Custody is maintained.',
  'ISO 45001:2018 · SMKP MINERBA · ESDM':'ISO 45001:2018 · SMKP MINERBA · ESDM',
  'K3 & Geotech Engineer':'K3 & Geotechnical Engineer',
  'MINE MANAGER - KTT':'MINE MANAGER - KTT',
  'FOREMAN PIT / STOCKPILE':'PIT / STOCKPILE FOREMAN',
  'DOKUMEN K3 RAHASIA':'CONFIDENTIAL K3 DOCUMENT',
  'INDUKSI WAJIB SEBELUM MASUK PIT':'MANDATORY INDUCTION BEFORE ENTERING PIT',
  'HAL 3/3 - JSA MINE GEOLOGIST':'PAGE 3/3 - JSA MINE GEOLOGIST',
  'Dokumen ini dibuat sesuai regulasi Kepmen ESDM No. 1827 K/30/MEM/2018 tentang Pedoman Pelaksanaan Kaidah Teknik Pertambangan Yang Baik. JSA harus direview ulang jika terjadi perubahan metode kerja, kecelakaan, atau minimal 1 tahun sekali.':'This document is prepared in accordance with ESDM Decree No. 1827 K/30/MEM/2018 on Guidelines for the Implementation of Good Mining Engineering Practices. The JSA must be reviewed when work methods change, an incident occurs, or at least once every year.'
};

// ============================================================
// CHANGELOG DATA
// ============================================================
window.CHANGELOG_DATA = [
 { version: `v90.2.150`, items: [
  { id: `Bug kritis ditemukan & diperbaiki: 1 tag </div> hilang di index.html membuat modal "Form Member" (dan turunannya, Edit Member) ikut bersarang di dalam modal Detail Member -- akibatnya popup Tambah/Edit Member tidak pernah tampak sendirian, baru muncul (tertumpuk di belakang) setelah kartu member diklik. Popup "Input Data Digging" ikut pulih otomatis karena satu akar masalah yang sama.`, en: `Critical bug found & fixed: 1 missing </div> tag in index.html caused the "Add Member" form modal (and its Edit counterpart) to be accidentally nested inside the Member Detail modal -- as a result the Add/Edit Member popup never appeared on its own, only becoming visible (stacked behind) after a member card was clicked. The "Digging Input Data" popup recovered automatically since it shared the same root cause.` },
  { id: `Ikon tampil/sembunyikan PIN (mata) diperbaiki di 4 tempat sekaligus (PIN Developer, Login Member, Reset PIN Member, Konfirmasi PIN) -- listener klik globalnya sempat hilang total saat restrukturisasi file, sekarang dipasang kembali.`, en: `Show/hide PIN (eye) icon fixed across all 4 locations at once (Developer PIN, Member Login, Reset Member PIN, PIN Confirmation) -- the global click listener had gone missing entirely during the file restructure, now restored.` },
  { id: `Migrasi User_ID (GEO-XXX) tuntas 6 tahap: kolom User_ID otomatis terisi saat akun member baru dibuat; tool backfill (dry-run + eksekusi) untuk member lama di Developer Console; User_ID tampil di kartu & modal detail Member; field Attitude dan KPI Event diganti dari ketik manual jadi dropdown pilih member (anti-typo); JSA_Log kini utamakan cocok by User_ID (bukan lagi murni Nama); Produksi_GC & Issue dapat kolom User_ID pelengkap opsional.`, en: `User_ID (GEO-XXX) migration completed across 6 stages: the User_ID column now auto-fills when a new member account is created; a backfill tool (dry-run + execute) added to the Developer Console for legacy members; User_ID now shown on the Member card & detail modal; the Attitude and KPI Event fields switched from free-text typing to a member-picker dropdown (typo-proof); JSA_Log now prioritizes matching by User_ID (no longer purely by Name); Produksi_GC & Issue gained an optional supplementary User_ID column.` },
  { id: `Bug backend ditemukan & diperbaiki: response GET sheet Member tidak pernah mengirim kolom User_ID ke frontend (masih pakai index kolom tetap, warisan struktur 13 kolom lama) -- User_ID di sheet sudah benar, tapi tidak pernah sampai ke tampilan. Diperbaiki pakai pencarian kolom via nama header, bukan posisi tetap.`, en: `Backend bug found & fixed: the Member sheet's GET response never actually sent the User_ID column to the frontend (still used a fixed column index, a holdover from the old 13-column structure) -- the sheet's User_ID data was correct, it just never reached the UI. Fixed using header-name-based column lookup instead of a fixed position.` },
  { id: `Bug backend kedua ditemukan & diperbaiki: response GET Member masih mengirim field lama (target/inspeksi/accuracy) padahal frontend sudah beralih baca field baru (total_tonase/avg_ni_total/dst) sejak keputusan "alih fungsi" -- backend-nya sendiri lupa ikut diupdate saat itu, computeLegacyProductionStatsAll_ yang sudah direstorasi ternyata tidak pernah dipanggil di manapun. Sekarang disamakan persis dengan baseline, Total Tonase/Waste/Hasil Bersih di kartu Member kembali terisi benar.`, en: `Second backend bug found & fixed: the Member GET response was still sending the old fields (target/inspeksi/accuracy) even though the frontend had already switched to reading the new fields (total_tonase/avg_ni_total/etc.) since the "function reassignment" decision -- the backend itself was never updated at the time, and the already-restored computeLegacyProductionStatsAll_ turned out to never be called anywhere. Now matched exactly to baseline; Total Tonnage/Waste/Net Result on the Member card are correctly populated again.` },
  { id: `Bug performa server ditemukan & diperbaiki: cleanupSessions_ (scan penuh sheet Sessions + tulis status/audit tiap sesi expired) dijalankan di SETIAP login, bukan sesekali -- kalau sesi menumpuk (mis. user retry login berkali-kali), scan ini makin berat tiap dipanggil ulang, menyebabkan eksekusi doPost sampai puluhan detik hingga client timeout (20 detik) lalu retry lagi, memperparah antrian (lingkaran setan, terkonfirmasi lewat Apps Script Executions log sampai 71 detik). Diperbaiki dengan throttle (scan penuh maksimal 1x/2 menit via CacheService); timeout client dinaikkan jadi 35 detik sebagai pengaman tambahan.`, en: `Server performance bug found & fixed: cleanupSessions_ (a full Sessions sheet scan + status/audit write for every expired session) was running on EVERY login, not periodically -- if sessions piled up (e.g. from repeated login retries), this scan got heavier with each call, causing doPost executions to take tens of seconds until the client timeout (20s) fired and the user retried, worsening the queue (a vicious cycle, confirmed via Apps Script Executions logs reaching 71 seconds). Fixed by throttling the full scan to at most once per 2 minutes via CacheService; client timeout also raised to 35 seconds as an added safety margin.` },
  { id: `Fitur yang sudah ada tapi belum tersambung ditemukan & diperbaiki: rate-limit login LOKAL di sisi browser untuk Member (checkMemberLoginLocalRateLimit) sudah pernah direstorasi tapi tidak pernah dipanggil dari submitMemberLogin -- ditambah, fungsi pendukungnya resumeMemberLoginCountdown ternyata cuma stub kosong (placeholder tidak melakukan apa-apa). Keduanya sekarang tersambung & berfungsi penuh, membantu cegah retry cepat berulang yang membebani server.`, en: `An existing-but-unwired feature found & fixed: the client-side LOCAL login rate-limit for Members (checkMemberLoginLocalRateLimit) had already been restored but was never actually called from submitMemberLogin -- additionally, its companion function resumeMemberLoginCountdown turned out to be an empty stub (a placeholder doing nothing). Both are now wired up and fully functional, helping prevent rapid repeated retries from overloading the server.` },
  { id: `Bug ditemukan & diperbaiki: variabel global activeMemberSessions dan activeMemberIndicatorRequestSeq dipakai di fitur avatar "member/SPV yang sedang aktif" (header, dekat Export) tapi tidak pernah dideklarasikan di manapun -- activeMemberIndicatorRequestSeq khususnya dipakai dengan operator increment (++) yang WAJIB bisa baca nilai lama dulu, jadi ini menghentikan seluruh fungsi lebih awal dengan ReferenceError. Setelah dideklarasikan, fitur avatar member aktif kembali berfungsi.`, en: `Bug found & fixed: the global variables activeMemberSessions and activeMemberIndicatorRequestSeq were used by the "currently active member/supervisor" avatar feature (header, near Export) but were never declared anywhere -- activeMemberIndicatorRequestSeq in particular was used with the increment operator (++), which requires reading the prior value first, so this halted the entire function early with a ReferenceError. Once declared, the active-member avatar feature works again.` },
  { id: `Panel "Migrasi User_ID -- Backfill Member Lama" dipindah dari Developer Console "Technical" ke "Sistem", diposisikan tepat di bawah "Reset PIN Member" sesuai permintaan.`, en: `The "User_ID Migration -- Backfill Legacy Members" panel moved from the "Technical" Developer Console to "System", positioned directly below "Reset Member PIN" as requested.` },
  { id: `Login Developer tidak lagi otomatis membuka modal Developer Console setelah berhasil -- login sekarang cuma mengaktifkan akses (badge "Aktif" + tombol Sistem/Technical jadi bisa diklik), user yang memilih sendiri console mana yang mau dibuka.`, en: `Developer login no longer automatically opens the Developer Console modal on success -- login now only activates access (an "Active" badge + Sistem/Technical buttons become clickable), leaving it to the user to choose which console to open.` },
  { id: `Audit kode mati menyeluruh: fungsi provisionExistingCredential yang terduplikasi dihapus; renderIssueList/setIssueFilter/deleteIssueRow (sisa sistem Issue lama, menunjuk elemen "issue-list" yang sudah tidak ada di HTML) dihapus, digantikan sepenuhnya oleh renderIssueTable/deleteIssueByRow yang aktif; clearDeveloperSessionStorageIfCurrent, formatDateInAppTimezone_, dan parseAccuracyValue_ dihapus karena fungsinya sudah ada versi inline yang jalan di tempat lain; setOnceGlobal_ dihapus karena ternyata rusak (memakai variabel cfg/alreadySetFields yang tidak ada di scope-nya) selain redundan.`, en: `Comprehensive dead-code audit: the duplicated provisionExistingCredential function removed; renderIssueList/setIssueFilter/deleteIssueRow (leftovers of the old Issue system, targeting an "issue-list" element no longer present in the HTML) removed, fully superseded by the active renderIssueTable/deleteIssueByRow; clearDeveloperSessionStorageIfCurrent, formatDateInAppTimezone_, and parseAccuracyValue_ removed since equivalent inline versions were already running elsewhere; setOnceGlobal_ removed after being found not just redundant but actually broken (referenced cfg/alreadySetFields variables outside its own scope).` },
  { id: `Field lama "Target Blending (%)", "Inspeksi Bench", dan "Accuracy Grade (%)" dihapus dari form Tambah/Edit Member -- sudah tidak relevan sejak Total Tonase/Ni dihitung otomatis dari Produksi_GC. Bagian "Kinerja Lapangan" diganti "Grade & Status", tetap menyimpan pilihan Grade dan Status yang masih aktif dipakai.`, en: `The legacy "Target Blending (%)", "Bench Inspection", and "Accuracy Grade (%)" fields removed from the Add/Edit Member form -- no longer relevant since Total Tonnage/Ni is now calculated automatically from Produksi_GC. The "Field Performance" section renamed to "Grade & Status", retaining the still-active Grade and Status selectors.` },
  { id: `Laporan Ekspor "KPI Member" dirombak total -- kolom lama (Target Blending/Inspeksi Bench/Accuracy) diganti 14 kolom baru: 3 pasang tonase (Total/Waste/Hasil Bersih + Ni masing-masing), 5 pilar KPI (Laporan Tepat Waktu/Kehadiran/Safety/Sampling/Attitude), dan Skor Gabungan. Skor KPI di-fetch paralel untuk semua member sekaligus saat sumber "KPI Member" dipilih di preview export (bukan satu-satu berurutan), dengan indikator loading & tombol export terkunci sampai selesai.`, en: `The "KPI Member" Export Report overhauled -- legacy columns (Target Blending/Bench Inspection/Accuracy) replaced with 14 new columns: 3 tonnage pairs (Total/Waste/Net Result + Ni for each), the 5 KPI pillars (On-Time Reporting/Attendance/Safety/Sampling/Attitude), and the Combined Score. KPI scores are now fetched in parallel for all members at once when the "KPI Member" source is selected in the export preview (rather than sequentially one by one), with a loading indicator and the export button locked until complete.` },
  { id: `Kartu Member (tampilan grid utama) dirampingkan -- bagian "Total Penggalian" dan "Waste Non COG" dihapus dari kartu (sudah duplikat, tetap tersedia lengkap di modal detail saat kartu diklik), langsung ke "Hasil Bersih".`, en: `The Member card (main grid view) streamlined -- the "Total Excavation" and "Waste Non COG" sections removed from the card (redundant, still fully available in the detail modal when the card is clicked), going straight to "Net Result".` },
  { id: `Label modal detail Member yang masih menyebut "Standar Penilaian Accuracy Grade"/"Accuracy Grade Saat Ini" (ID & EN) diperbaiki jadi "Waste Non COG"/"Waste Tonase @ Avg Ni", menyamakan dengan skema field baru pasca alih fungsi 30 Agu.`, en: `Member detail modal labels still reading "Accuracy Grade Grading Standard"/"Current Accuracy Grade" (ID & EN) fixed to "Waste Non COG"/"Waste Tonnage @ Avg Ni", matching the new field scheme after the 30 Aug function reassignment.` },
  { id: `Label "Auto Refresh: 30 Detik" diperbaiki jadi "60 Detik" (ID & EN) -- teksnya tidak pernah disesuaikan sejak interval polling produksi sebenarnya dinaikkan ke 60 detik.`, en: `The "Auto Refresh: 30 Seconds" label fixed to "60 Seconds" (ID & EN) -- the text was never updated after the actual production polling interval was raised to 60 seconds.` },
  { id: `Tab bar "Tren" (Visual & Trend) diperbaiki supaya selalu 1 baris rapi apa pun lebar sidebar/jendela -- sebelumnya bisa pecah jadi 2 baris kartu yang kurang enak dilihat saat sidebar diperlebar; deskripsi disembunyikan & judul dipersingkat kalau ruang sempit, baris tombol tab scroll horizontal (scrollbar tersembunyi) kalau kurang muat.`, en: `The "Trend" tab bar (Visual & Trend) fixed to always stay on a single tidy row regardless of sidebar/window width -- previously it could break into an awkward 2-row card layout when the sidebar was expanded; description hides & title truncates under tight space, and the tab-button row scrolls horizontally (scrollbar hidden) when it doesn't fit.` },
  { id: `5 teks deskripsi di tab Visual & Trend diperhalus redaksinya (Tonase Digging, Fluktuasi Ni%, Distribusi SM, Breakdown/Pit, Block Model vs Actual) supaya lebih ringkas & langsung ke inti.`, en: `5 description texts in the Visual & Trend tab refined for conciseness and clarity (Tonnage Digging, Ni% Fluctuation, SM Distribution, Breakdown/Pit, Block Model vs Actual).` },
  { id: `Restorasi menyeluruh atas restrukturisasi kode (index.html+core.js+produksi.js+barging.js+member-kpi.js+settings.js jadi 14 file terpisah di scripts/ & modules/) -- 146 fungsi frontend & 4 fungsi backend yang sempat hilang/rusak saat proses pemecahan file berhasil dipulihkan & diverifikasi cocok 100% dengan baseline, termasuk beberapa bug tersembunyi yang baru ketahuan lewat testing langsung (bukan cuma dari audit kode statis): modal Chat yang macet di "Memuat..." selamanya (salah target elemen), panel Developer Console yang nempel di halaman biasa alih-alih masuk ke dalam modal (logika pemindahan elemen saat halaman dimuat sempat hilang), dan beberapa variabel state global yang tidak pernah dideklarasikan.`, en: `A comprehensive restoration following the code restructure (index.html+core.js+produksi.js+barging.js+member-kpi.js+settings.js split into 14 separate files under scripts/ & modules/) -- 146 frontend functions and 4 backend functions that had gone missing or broken during the file-splitting process were recovered & verified to match baseline 100%, including several hidden bugs only discovered through live testing (not just static code audit): a Chat modal permanently stuck on "Loading..." (wrong element target), Developer Console panels stuck on the regular page instead of moving into their modal (the page-load element-relocation logic had gone missing), and several global state variables that were never declared.` }
 ] },
 { version: `v90.2.95`, items: [
  {id:'Export Loading Integrity: RCA Log sekarang menampilkan state loading yang jelas dan tidak lagi menampilkan 0 Baris sebagai hasil sementara; tombol export tetap terkunci sampai fetch selesai. Fix activeTab juga dipertahankan di fetchJsaLogData().', en:'Export Loading Integrity: RCA Log now shows an explicit loading state instead of a misleading temporary 0 Rows; the export button remains locked until the fetch completes. The activeTab fix is also retained in fetchJsaLogData().' },
 ] },
 { version: `v90.2.86`, items: [
  {id:'AuditTrail export diagnostics: logExportActivity kini membaca response JSON server dan menampilkan alasan kegagalan ke DevTools Console tanpa mengganggu alur export.', en:'AuditTrail export diagnostics: logExportActivity now reads the server JSON response and reports failure reasons to the DevTools Console without interrupting the export flow.'},
 ] },
 { version: `v90.2.84`, items: [
  {id:'RCA Maker-Checker timestamp split: RCA_Log menggunakan Created_By/Created_Date/Created_Time dan Closed_By/Closed_Date/Closed_Time. Status pembuatan selalu Open; penutupan terpisah melalui rca.close dan Maker tidak dapat menutup RCA sendiri.', en:'RCA Maker-Checker timestamp split: RCA_Log now uses Created_By/Created_Date/Created_Time and Closed_By/Closed_Date/Closed_Time. Creation always starts Open; closing is a separate rca.close action and the Maker cannot close their own RCA.'},
 ] },
 { version: `v90.2.80`, items: [
  {id:'Unified Export Authorization Gate: PUBLIC tidak dapat export; MEMBER hanya PDF; SUPERVISOR PDF+Word; DEVELOPER CSV+PDF+Word. Authorization dilakukan server-side sebelum file dibuat dan penolakan terautit sebagai FAILED untuk role terautentikasi.', en:'Unified Export Authorization Gate: PUBLIC cannot export; MEMBER only PDF; SUPERVISOR PDF+Word; DEVELOPER CSV+PDF+Word. Authorization is server-side before file generation and authenticated-role denials are audited as FAILED.'},
 ] },
  { version: `v90.2.76`, items: [
  {id:'I18N hardcode audit: validasi Developer, login Member, Credential Manager, session warning, PIN toggle, JSA/chat fallback, dan beberapa output dinamis kini mengikuti bahasa aktif.', en:'I18N hardcode audit: Developer validation, Member login, Credential Manager, session warning, PIN toggle, JSA/chat fallbacks, and selected dynamic outputs now follow the active language.'},
 ] },  { version: `v90.2.74`, items: [
  {id:'Audit Trail aktivitas ekspor ditambahkan untuk CSV/PDF/Word; identitas user/session tetap diambil server-side dari session tervalidasi, tanpa mengubah alur export.', en:'Export activity Audit Trail added for CSV/PDF/Word; user/session identity remains resolved server-side from the validated session without changing the existing export flow.'},
 ] }, { version: `v90.2.72`, items: [
  {id:'Final I18N one-door refresh: language switch sekarang menyegarkan seluruh view dinamis, tooltip, filter title, Trend/Rekonsiliasi sub-view, laporan, chat, Pit Actual History, dan warning sesi tanpa mengubah data/backend.', en:'Final I18N one-door refresh: the language switch now refreshes all dynamic views, tooltips, filter titles, Trend/Reconciliation sub-views, reports, chat, Pit Actual History, and session warnings without changing data/backend.'},
  { id: `JSA I18N tetap dipertahankan: switch Indonesia/English menerjemahkan seluruh isi dokumen JSA di iframe.`, en: `JSA I18N remains intact: Indonesia/English switching translates the full JSA document inside the iframe.` },
 ] }, { version: `v89.16.29`, items: [
  { id: `Bug fix: guard tanggal di 10 field input (Catat Pit Actual, RCA Log, Barge, filter Rekonsiliasi, Laporan Berkala) -- ditambah batas tahun 2020-2035 dan diblokir ketik langsung (cuma bisa lewat kalender), mencegah tahun ngawur kepencet (kejadian nyata: jadi tahun "0002") gara-gara input tanggal bawaan browser bisa diketik bebas per-digit`, en: `Bug fix: date guards on 10 input fields (Record Pit Actual, RCA Log, Barge, Reconciliation filter, Periodic Report) -- year range 2020-2035 added and direct typing blocked (calendar only), preventing accidental garbage years (real occurrence: year became "0002") caused by the browser's native date input allowing free per-digit typing` },
  { id: `Bug fix penting: kolom "GC (TON)" & perhitungan F1 di tabel Matriks Rekonsiliasi (F1-F4) ternyata diam-diam ambil dari row Realisasi_Tonase (BlockModel), bukan dihitung dari Produksi_GC seperti chart "Block Model vs Actual" & Laporan Rekonsiliasi Profesional -- baru ketahuan setelah formula Realisasi_Tonase di sheet diubah supaya narik dari PitActual, kolom "GC" ikut nyamar jadi PitActual (cuma keisi di Blok yang sudah ada data PitActual). Sekarang ketiga tempat (chart, Laporan Profesional, Matriks F1-F4) pakai 1 fungsi sama (computeGcTonaseByBlok()) sebagai satu-satunya sumber kebenaran GC`, en: `Important bug fix: the "GC (TON)" column & F1 calculation in the Reconciliation Matrix (F1-F4) table was quietly pulling from the BlockModel's Realisasi_Tonase row, not calculated from Produksi_GC like the "Block Model vs Actual" chart & Professional Reconciliation Report -- only discovered after the sheet's Realisasi_Tonase formula was changed to pull from PitActual, causing the "GC" column to masquerade as PitActual (only populated for Blocks with PitActual data). All three places (chart, Professional Report, F1-F4 Matrix) now use the same function (computeGcTonaseByBlok()) as the single source of truth for GC` },
  { id: `Fitur besar baru: dokumen Job Safety Analysis (JSA-MINEGEO-2026-REV02) terintegrasi langsung ke dashboard -- tombol "Lihat JSA" di Settings (terbuka untuk semua orang, bukan developer-only) membuka modal berisi JSA lengkap lewat iframe, struktur dokumen aslinya tidak diubah sama sekali`, en: `Major new feature: the Job Safety Analysis document (JSA-MINEGEO-2026-REV02) is now integrated directly into the dashboard -- a "View JSA" button in Settings (open to everyone, not developer-only) opens a modal containing the full JSA via iframe, with the original document's structure left completely unchanged` },
  { id: `Fitur baru: EWS (Early Warning System) Dilusi/Ore Loss di Matriks F1-F4 (Rekonsiliasi) -- ambang warna F2 (Pit Actual/GC) disesuaikan jadi OK<=2%/WARNING 2-5%/OUT OF TOL>5%, dan banner merah otomatis muncul di atas tabel kalau ada Blok/Pit yang OUT OF TOL, supaya tidak perlu scroll baca satu-satu baris`, en: `New feature: EWS (Early Warning System) for Dilution/Ore Loss on the F1-F4 Matrix (Reconciliation) -- F2 (Pit Actual/GC) color thresholds adjusted to OK<=2%/WARNING 2-5%/OUT OF TOL>5%, and a red banner now appears automatically above the table when any Block/Pit is OUT OF TOL, so there's no need to scroll through every row` },
  { id: `Fitur baru: tombol "Quick Link RCA" di baris F2 OUT OF TOL pada Matriks F1-F4, sama pola dengan tabel "Block Model vs Actual" tapi lebih pintar -- otomatis isi Tahap Bermasalah "Pit Actual" & Deskripsi Isu berisi angka deviasi F2, supaya RCA yang tercipta dari EWS ini konsisten kategorinya`, en: `New feature: "Quick Link RCA" button on F2 OUT OF TOL rows in the F1-F4 Matrix, same pattern as the "Block Model vs Actual" table but smarter -- automatically fills in the Affected Stage as "Pit Actual" & the Issue Description with the F2 deviation figure, so RCA entries created from this EWS are consistently categorized` },
  { id: `Fitur baru: Total Loss/Dilusi sekarang ditampilkan dalam satuan Ton (bukan cuma %) di 3 tempat -- kartu ringkasan Rekonsiliasi, tabel "Block Model vs Actual" (per baris), dan Laporan Berkala`, en: `New feature: Total Loss/Dilution is now shown in Tons (not just %) in 3 places -- the Reconciliation summary card, the "Block Model vs Actual" table (per row), and the Periodic Report` },
  { id: `Fitur baru: toggle "Bulan ke Bulan" di tab Visual & Trend -- 2 kartu perbandingan Tonase & Ni% (bulan ini vs bulan lalu, dengan panah & persentase perubahan) plus chart 6 bulan terakhir, diagregasi otomatis dari data digging yang sama dipakai chart harian`, en: `New feature: "Month over Month" toggle in the Visual & Trend tab -- 2 comparison cards for Tonnage & Ni% (this month vs last month, with arrows & percentage change) plus a last-6-months chart, automatically aggregated from the same digging data used by the daily charts` },
  { id: `Fitur baru: DISC Sublot rata-rata otomatis di Laporan Berkala -- rata-rata absolut DISC Ni% & SiO2/MgO dari semua Sublot yang shipment-nya masuk periode laporan, tidak perlu dicari manual dari BargeSublot lagi`, en: `New feature: automatic average Sublot DISC in the Periodic Report -- absolute average of DISC Ni% & SiO2/MgO from all Sublots whose shipments fall within the report period, no more manual lookup from BargeSublot needed` },
  { id: `Fitur baru: RCA Log pengelompokan otomatis per Status & Tahap Bermasalah -- badge ringkasan (Open/Progress/Closed dan BM/Validasi/GC/Pit Actual/Plant) muncul di atas daftar RCA Log dalam Laporan Berkala`, en: `New feature: automatic RCA Log grouping by Status & Affected Stage -- summary badges (Open/Progress/Closed and BM/Validation/GC/Pit Actual/Plant) appear above the RCA Log list in the Periodic Report` },
  { id: `Fitur baru: koneksi JSA <-> RCA -- tombol "Catat RCA dari JSA" di modal JSA, buka Form RCA dengan Deskripsi Isu ter-prefill penanda asal dokumen, dipakai saat baca JSA & sadar ada bahaya yang belum tertangani`, en: `New feature: JSA <-> RCA connection -- "Log RCA from JSA" button in the JSA modal, opens the RCA form with the Issue Description pre-filled with a document origin marker, used when reading the JSA and realizing there's an unaddressed hazard` },
  { id: `Fitur baru: koneksi JSA <-> KPI Member -- tombol "TTD & Konfirmasi Kehadiran" (self-service, TANPA PIN Developer) di modal JSA, setiap member konfirmasi sendiri sudah baca JSA & hadir Toolbox Meeting. Hasilnya tersimpan di sheet baru JSA_Log & tampil sebagai badge Compliance ("JSA: Nx TTD - Nx Toolbox") di kartu KPI Member masing-masing. Versi awal cuma hitung frekuensi (Compliance) -- skor pemahaman/kuis (Competency) masih ditahan untuk versi berikutnya`, en: `New feature: JSA <-> KPI Member connection -- "Sign & Confirm Attendance" button (self-service, NO Developer PIN needed) in the JSA modal, each member confirms for themselves that they've read the JSA & attended the Toolbox Meeting. Results are stored in a new JSA_Log sheet & shown as a Compliance badge ("JSA: Nx signed - Nx Toolbox") on each member's KPI Member card. The initial version only counts frequency (Compliance) -- a comprehension/quiz score (Competency) is still on hold for a future version` },
  { id: `Panduan Rekonsiliasi (Settings, Developer-only) diperbarui -- Langkah 7 & 8 disesuaikan dengan fitur EWS/Quick Link RCA/Total Ton/pengelompokan RCA/DISC Sublot otomatis/Trend Bulan-ke-Bulan yang baru, dan Langkah 9 baru "JSA & Keselamatan Kerja (Safety)" ditambahkan menjelaskan alur JSA-RCA-KPI Member lengkap`, en: `Reconciliation Guide (Settings, Developer-only) updated -- Steps 7 & 8 revised to reflect the new EWS/Quick Link RCA/Total Tons/automatic RCA grouping/automatic Sublot DISC/Month-over-Month Trend features, and a new Step 9 "JSA & Safety" added explaining the full JSA-RCA-KPI Member flow` },
 ] },
 { version: `v89.16.28`, items: [
  { id: `Chart "Block Model vs Actual" (Visual & Trend) tambah series "GC (Ton)" -- sekarang tampilkan 3 batang per Blok+Pit (Estimasi -> GC -> Realisasi), bukan cuma 2 (Estimasi vs Realisasi) seperti sebelumnya. GC dihitung otomatis (SUM Tonase per Blok+Pit) dari data Tabel Digging, supaya kelihatan di tahap mana selisih besar terjadi -- BM->GC (akurasi model) atau GC->Realisasi (akurasi penambangan)`, en: `"Block Model vs Actual" chart (Visual & Trend) gets a new "GC (Ton)" series -- now shows 3 bars per Block+Pit (Estimate -> GC -> Actual), instead of just 2 (Estimate vs Actual) as before. GC is auto-calculated (SUM Tonnage per Block+Pit) from the Digging Table data, making it visible at which stage a large deviation occurs -- BM->GC (model accuracy) or GC->Actual (mining accuracy)` },
 ] },
 { version: `v89.16.26`, items: [
  { id: `Fitur baru: Legenda & badge Toleransi Variance (OK/WARNING/OUT OF TOL) di tabel "Block Model vs Actual" (Rekonsiliasi) -- ambang batas WARNING & OUT OF TOL bisa diatur dari Settings > Parameter COG (tab COG). Berbeda dari badge Status (Aman/Tidak Aman) yang sudah ada -- badge baru ini soal SEBERAPA BESAR penyimpangannya, badge lama soal ARAH-nya (Loss/Dilusi)`, en: `New feature: Variance Tolerance legend & badge (OK/WARNING/OUT OF TOL) on the "Block Model vs Actual" table (Reconciliation) -- WARNING & OUT OF TOL thresholds can be set via Settings > COG Parameters (COG tab). Different from the existing Status badge (Safe/Not Safe) -- this new badge is about HOW BIG the deviation is, the old badge is about its DIRECTION (Loss/Dilution)` },
  { id: `Fitur baru: tombol "Quick Link RCA" (ikon petir) muncul di baris OUT OF TOL pada tabel "Block Model vs Actual" (Rekonsiliasi), khusus Developer -- klik langsung buka Form RCA Baru dengan Blok & Pit sudah terisi otomatis dari baris yang diklik, tinggal isi Deskripsi Isu/Root Cause/Tindakan. Kontrol akses tetap di endpoint addRcaLog (server-side rca.create/rca.close), tombol ini cuma jalan pintas UI`, en: `New feature: "Quick Link RCA" button (lightning icon) appears on OUT OF TOL rows in the "Block Model vs Actual" table (Reconciliation), Developer-only -- clicking it opens the New RCA form with Block & Pit already pre-filled from the clicked row, leaving just Issue Description/Root Cause/Action to fill in. Access control remains on the addRcaLog endpoint (server-side rca.create/rca.close), this button is just a UI shortcut` },
  { id: `Bug fix: header kolom Tonase di sheet Produksi_GC yang bertuliskan "Tonase (auto)" membuat dashboard tidak bisa membaca nilainya (kode mencari key persis "tonase", bukan "tonase (auto)") -- semua KPI Ringkasan, chart, dan Realisasi Rekonsiliasi tampil 0 akibatnya. Solusinya header perlu ditulis persis "Tonase" tanpa keterangan tambahan`, en: `Bug fix: the Tonase column header in the Produksi_GC sheet reading "Tonase (auto)" prevented the dashboard from reading its value (the code looks for the exact key "tonase", not "tonase (auto)") -- causing all Summary KPIs, charts, and Reconciliation Actuals to show 0. The fix requires the header to read exactly "Tonase" with no extra text` },
  { id: `Settings > Atur Parameter (Global): 3 kartu (COG/Flag Warna/Bucket & Sampel) dirapikan -- tombol besar "Atur COG/Flag/Bucket" di bawah kartu dihapus, sekarang icon di pojok kiri atas kartu yang jadi pemicu klik langsung, tampilan lebih ringkas`, en: `Settings > Set Parameters (Global): the 3 cards (COG/Flag Colors/Bucket & Sample) were tidied -- the large "Set COG/Flags/Bucket" button below each card was removed, now the icon in the card's top-left corner is the click trigger directly, giving a more compact look` },
  { id: `Settings: kartu "Pengaturan Bahasa" & "Pengaturan Tema Dashboard" digabung jadi 1 kartu "Bahasa & Tema Dashboard" -- 4 tombol (Indonesia/English/Dark/White) ditaruh berdampingan dalam 1 baris, mengurangi jumlah kartu terpisah di panel Settings`, en: `Settings: the "Language Settings" & "Dashboard Theme Settings" cards are merged into 1 "Language & Theme" card -- 4 buttons (Indonesia/English/Dark/White) sit side-by-side in one row, reducing the number of separate cards in the Settings panel` },
  { id: `Fitur besar baru: "Laporan Rekonsiliasi Profesional" (tombol ikon dokumen merah di tab Rekonsiliasi) -- laporan siap cetak/PDF berisi Ringkasan Eksekutif (F1/F2/F4), tabel Rekonsiliasi 3-Tahap per Blok+Pit (BM vs GC vs Realisasi, dengan badge OK/WARNING/OUT OF TOL), dan daftar Temuan RCA yang masih terbuka. SEMUA data ditarik LIVE dari globalBlockModelData, globalRcaLogData, & globalCOGConfig (ambang toleransi ikut Settings > Parameter > COG) -- bukan data contoh statis`, en: `Major new feature: "Professional Reconciliation Report" (red document icon button in the Reconciliation tab) -- a print/PDF-ready report with an Executive Summary (F1/F2/F4), a 3-Stage Reconciliation table per Block+Pit (BM vs GC vs Actual, with OK/WARNING/OUT OF TOL badges), and a list of open RCA findings. ALL data is pulled LIVE from globalBlockModelData, globalRcaLogData, & globalCOGConfig (tolerance thresholds follow Settings > Parameters > COG) -- not static sample data` },
 ] },
 ];

// ============================================================
// SET LANGUAGE FUNCTION
// ============================================================
window.setLanguage = function(lang) {
  window.currentLang = lang;

  // Update UI Language Cards (ID/EN)
  var cardId = document.getElementById('lang-card-id');
  var cardEn = document.getElementById('lang-card-en');
  var checkId = document.getElementById('check-lang-id');
  var checkEn = document.getElementById('check-lang-en');
  if (cardId && cardEn && checkId && checkEn) {
    if (lang === 'en') {
      cardEn.classList.add('border-blue-500');
      cardEn.classList.remove('border-slate-700');
      cardId.classList.remove('border-blue-500');
      cardId.classList.add('border-slate-700');
      checkEn.classList.remove('hidden', 'text-slate-600');
      checkEn.classList.add('text-blue-500');
      checkId.classList.add('hidden');
    } else {
      cardId.classList.add('border-blue-500');
      cardId.classList.remove('border-slate-700');
      cardEn.classList.remove('border-blue-500');
      cardEn.classList.add('border-slate-700');
      checkId.classList.remove('hidden');
      checkId.classList.add('text-blue-500');
      checkEn.classList.add('hidden');
    }
  }

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (window.translations[lang][key]) {
      el.innerText = window.translations[lang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-placeholder');
    if (window.translations[lang][key]) {
      el.placeholder = window.translations[lang][key];
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-title');
    if (window.translations[lang][key]) el.title = window.translations[lang][key];
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-aria-label');
    if (window.translations[lang][key]) el.setAttribute('aria-label', window.translations[lang][key]);
  });

  // Update active tab title/subtitle
  var activeTab = document.querySelector('aside nav button.nav-item-active');
  if (activeTab) {
    var tabId = activeTab.id.replace('btn-', '');
    window.updateTabTitles(tabId);
  }

  // Refresh dynamic views
  try {
    if (typeof window.renderMonthlyTrend === 'function') window.renderMonthlyTrend();
    if (typeof window.renderReconciliation === 'function' && window.globalRawData && window.globalRawData.length > 0) window.renderReconciliation();
    if (typeof window.renderBargeShipmentList === 'function') window.renderBargeShipmentList();
    if (typeof window.renderChatMessages === 'function') window.renderChatMessages();
    if (typeof window.loadMembersFromSheet === 'function' && window.globalMemberData && window.globalMemberData.length > 0) window.loadMembersFromSheet();
    if (typeof window.renderRcaLogList === 'function') window.renderRcaLogList();
    if (typeof window.renderBlockModelTable === 'function') window.renderBlockModelTable();
  } catch (refreshErr) {
    console.warn('I18N dynamic refresh warning:', refreshErr);
  }

  // Update Developer UI and JSA
  if (typeof window.updateDeveloperAccessUI === 'function') window.updateDeveloperAccessUI();
  if (typeof window.applyJsaLanguage === 'function') window.applyJsaLanguage(lang);
};

// ============================================================
// APPLY JSA LANGUAGE (terjemahan dokumen JSA di iframe)
// ============================================================
window.applyJsaLanguage = function(lang) {
  var iframe = document.getElementById('jsa-iframe');
  if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body) return;
  var doc = iframe.contentDocument;
  var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  var nodes = [];
  var n;
  while (n = walker.nextNode()) nodes.push(n);
  if (!iframe._jsaOriginalText) iframe._jsaOriginalText = new WeakMap();
  var originalMap = iframe._jsaOriginalText;
  var keys = Object.keys(window.JSA_I18N_EN).sort(function(a,b){ return b.length - a.length; });
  nodes.forEach(function(node) {
    var parent = node.parentElement;
    if (!parent || ['SCRIPT','STYLE'].includes(parent.tagName)) return;
    if (!originalMap.has(node)) originalMap.set(node, node.nodeValue);
    var original = originalMap.get(node) || '';
    if (lang === 'id') { node.nodeValue = original; return; }
    var text = original;
    keys.forEach(function(k) {
      text = text.split(k).join(window.JSA_I18N_EN[k]);
    });
    node.nodeValue = text;
  });
  doc.documentElement.lang = lang === 'en' ? 'en' : 'id';
};

// ============================================================
// TOGGLE GUIDE STEP (untuk accordion di Panduan Rekonsiliasi)
// ============================================================
window.toggleGuideStep = function(n) {
  var content = document.getElementById('guide-content-' + n);
  var chevron = document.getElementById('guide-chevron-' + n);
  if (!content) return;
  var isHidden = content.classList.contains('hidden');
  content.classList.toggle('hidden');
  if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
};
