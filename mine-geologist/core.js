// ==== CORE.js -- v90.2.120 (diekstrak otomatis dari v90.2.119 terkunci, batas fungsi
// diverifikasi ulang oleh Claude thd nama+posisi asli, BUKAN pakai baris_js CSV pihak lain
// yg terbukti offset 3 baris & menyebabkan korupsi) ====


 // BARU (23 Agu): inisialisasi state Sidebar Collapse SEBELUM lucide.createIcons()
 // pertama kali jalan -- supaya ikon toggle & lebar sidebar sudah benar sejak render
 // pertama, tidak ada "kedipan" salah sesaat. Fungsi didefinisikan di bawah (hoisting
 // function declaration aman dalam 1 blok script yang sama).
 initSidebarCollapseState();
 lucide.createIcons();

 const ORIGINAL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_V7N6lGzP-YFgzLsc-yDhE2J5tgrCiwRfKJX48X3RQL6oxzwe87Jo2AchJP-x4zc-FXuo5R1GGYT5/pub?gid=1273255101&single=true&output=csv';
 const GOOGLE_SCRIPT_READ_URL = 'https://script.google.com/macros/s/AKfycbwVeP2inU_-Cm4aazxiaTfulb_ta3OalMdKk9icwqRUNVF-Rz8n9cnhylQuWOspYh2Ztw/exec';

 // Timeout default untuk fetch data (baca) -- dulu semua fetch() di dashboard ini TIDAK
 // punya batas waktu sama sekali, jadi kalau backend Apps Script macet/tidak merespons,
 // browser menunggu tanpa batas tanpa ada tanda apa pun ke user. Sekarang kalau lebih dari
 // FETCH_TIMEOUT_MS, request dibatalkan otomatis dan fungsi pemanggilnya bisa menampilkan
 // pesan gagal + opsi coba lagi, alih-alih dashboard diam menggantung tanpa kabar.
 const FETCH_TIMEOUT_MS = 20000;

 // RP07 READ AUTH CORRECTIVE: authenticated GET membawa session token
 // ke doGet() tanpa mengubah POST authentication flow. PUBLIC tetap tanpa token.

// ==== I18N: translations dict ====
 const translations = {
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
  auto_refresh_value: "30 Detik",
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
  trend_1_desc: "Grafik pergerakan kapasitas produksi pemindahan material harian aktual di front penambangan.",
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
  leaderboard_desc: "Peringkat berdasarkan Current Accuracy -- otomatis dihitung dari data KPI Member yang sama di atas.",
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
  modal_grading_standard: "Standar Penilaian Accuracy Grade",
  modal_grading_desc: "Nilai Accuracy Grade dihitung dari bobot: 40% Target Blending + 40% Inspeksi Bench + 20% Absensi.",
  modal_curr_accuracy: "Accuracy Grade Saat Ini",
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
  auto_refresh_value: "30 Seconds",
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
  leaderboard_desc: "Ranked by Current Accuracy -- automatically calculated from the same KPI Member data above.",
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
  modal_grading_standard: "Accuracy Grade Grading Standard",
  modal_grading_desc: "Accuracy Grade value is calculated from weight: 40% Blending Target + 40% Bench Inspection + 20% Attendance.",
  modal_curr_accuracy: "Current Accuracy Grade",
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

// ==== CORE FUNCTIONS ====
 function withReadAuthToken(url) {
  const rawUrl = String(url || '');
  if (/[?&](sessionToken|devToken)=/i.test(rawUrl)) return rawUrl;
  const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
  const memberToken = (localStorage.getItem('mine_member_token') || '').trim();
  const token = devToken || memberToken;
  if (!token) return rawUrl;
  const key = devToken ? 'devToken' : 'sessionToken';
  return rawUrl + (rawUrl.indexOf('?') >= 0 ? '&' : '?') + key + '=' + encodeURIComponent(token);
 }

 async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
 const controller = new AbortController();
 const timer = setTimeout(() => controller.abort(), timeoutMs);
 try {
  const method = String(options.method || 'GET').toUpperCase();
  const requestUrl = method === 'GET' ? withReadAuthToken(url) : url;
  return await fetch(requestUrl, { ...options, signal: controller.signal });
 } finally {
  clearTimeout(timer);
 }
 }

 let materialChart, gradeChart, trendTonaseChart, trendNiChart, smChart, rekonChart, validasiChart, blockModelChart, trendMonthlyChart;
 let currentPage = 1;
 const ROWS_PER_PAGE = 100;
 let searchDebounceTimer = null;
 let globalFilteredTableData = [];
 let globalRawData = [];
 // Cache hasil "pembersihan" nama kolom (lowercase, trim) per baris data produksi --
 // dibangun SEKALI tiap kali data baru masuk (lihat parseAndRenderCSV), supaya
 // applyGlobalFilter/updateDashboard/renderReconciliation/populatePitDropdown
 // tidak perlu mengulang proses yang sama untuk baris yang identik di setiap siklus refresh.
 let rawToCleanRow = new WeakMap();
 let filteredExportData = [];
 let globalMemberData = [];
 // BARU: JSA_Log -- rekam TTD & kehadiran toolbox JSA per member, sumber untuk badge
 // Compliance di kartu KPI Member. Kuis/Competency SENGAJA belum ada (ditahan, versi awal
 // cuma TTD + centang kehadiran toolbox).
 let globalJsaLogData = [];
 // Data Barging (Fase 2) -- di-fetch lazy saat tab dibuka pertama kali, lihat switchTab()
 let globalBargeShipmentData = [];
 let globalBargeLoadingLogData = [];
 let globalBargeShiftReportData = [];
 let globalBargeSublotData = [];
 let globalRcaLogData = []; // RCA Log rekonsiliasi -- di-fetch bareng data Block Model saat tab Rekonsiliasi dibuka
 let globalPitActualData = []; // Pit Actual (Ritase x TF weighbridge) -- dipakai hitung F1/F2/F3/F4
 let ewsAlertNotified = false; // BARU (Sidequest #3): flag transisi utk Suara & Haptik EWS -- lihat triggerEwsAlert()
 let currentOpenBargeShipment = null; // No Shipment yang sedang dibuka di detail modal
 let globalIssueRawData = [];
 let globalValidasiData = [];
 let globalValidasiConfig = {};
 // BARU (v89.16.24): parameter COG (Cut of Grade) per Tipe_Ore, dibaca dari sheet "COGConfig".
 // Struktur: { Sapro: {Batas_Waste_LG, Batas_LG_MG, Batas_MG_HG, Batas_HG_VHG}, Limo: {...},
 //             Limo_Aktif: bool, SM_Threshold_AutoDetect: number }
 let globalCOGConfig = null;
 let globalBlockModelData = [];
 let globalChatData = [];
 // FIX (23 Agu, ditemukan saat terapkan pagination chat limit=100 dari kiriman pihak
 // lain -- BUG JUGA ADA di kiriman mereka, belum ditangani): SEBELUMNYA chatLastSeenCount
 // dibandingkan lewat globalChatData.length -- begitu total chat lebih dari 100 pesan,
 // panjang array SELALU mentok 100 (efek pagination baru), jadi badge notifikasi
 // "pesan belum dibaca" bisa salah hitung (bisa-bisa selalu nunjuk 0 walau ada pesan
 // baru). Diganti lacak _row (nomor baris sheet asli, monoton naik, TIDAK kepotong
 // pagination) -- pola yang sama persis dgn fix hadNewMessages di fetchChatData().
 let chatLastSeenRow = 0;
 const CHAT_POLL_INTERVAL = 15000; // feed chat terbaru; polling hanya saat tab terlihat
 let pendingExportType = '';
 let rcaExportRequestId = 0;
 let rcaExportLoading = false;
 let currentLang = 'id';
 let currentTrendView = 'tonase';
 let currentRekonView = 'breakdown';


 function switchTrendView(viewType) {
 currentTrendView = viewType;
 const btnTonase = document.getElementById('btn-view-tonase');
 const btnNi = document.getElementById('btn-view-ni');
 const btnSm = document.getElementById('btn-view-sm');
 const btnBreakdown = document.getElementById('btn-view-breakdown');
 const btnBlockmodel = document.getElementById('btn-view-blockmodel');
 const btnMonthly = document.getElementById('btn-view-monthly');
 const wrapTonase = document.getElementById('wrapper-trend-tonase');
 const wrapNi = document.getElementById('wrapper-trend-ni');
 const wrapSm = document.getElementById('wrapper-trend-sm');
 const wrapBreakdown = document.getElementById('wrapper-trend-breakdown');
 const wrapBlockmodel = document.getElementById('wrapper-trend-blockmodel');
 const wrapMonthly = document.getElementById('wrapper-trend-monthly');
 const titleText = document.getElementById('trend-title-text');
 const activeDesc = document.getElementById('trend-active-desc');
 const activeIcon = document.getElementById('trend-active-icon');

 const activeClass = (color) => `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${color} text-white shadow-sm flex items-center gap-1.5 cursor-pointer`;
 const inactiveClass = "px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer";

 btnTonase.className = inactiveClass;
 btnNi.className = inactiveClass;
 btnSm.className = inactiveClass;
 btnBreakdown.className = inactiveClass;
 btnBlockmodel.className = inactiveClass;
 btnMonthly.className = inactiveClass;
 wrapTonase.classList.add('hidden');
 wrapNi.classList.add('hidden');
 wrapSm.classList.add('hidden');
 wrapBreakdown.classList.add('hidden');
 wrapBlockmodel.classList.add('hidden');
 wrapMonthly.classList.add('hidden');

 if (viewType === 'tonase') {
  btnTonase.className = activeClass('bg-blue-600');
  wrapTonase.classList.remove('hidden');

  titleText.innerText = currentLang === 'en' ? 'Digging Tonnage Trend (Daily)' : 'Tren Tonase Digging (Harian)';
  activeDesc.innerText = currentLang === 'en' ? 'Daily actual mining material movement production capacity movement chart.' : 'Grafik pergerakan kapasitas produksi pemindahan material harian aktual di front penambangan.';
  activeIcon.setAttribute('data-lucide', 'trending-up');
 } else if (viewType === 'ni') {
  btnNi.className = activeClass('bg-emerald-600');
  wrapNi.classList.remove('hidden');

  titleText.innerText = currentLang === 'en' ? 'Ni Grade Fluctuation Trend (Daily)' : 'Tren Fluktuasi Kadar Ni % (Harian)';
  activeDesc.innerText = currentLang === 'en' ? 'Daily nickel grade trend analysis compared with minimum cut-off limit line (1.30%).' : 'Analisis tren kadar nikel harian dibandingkan dengan garis batas cut-off minimum (1.30%).';
  activeIcon.setAttribute('data-lucide', 'activity');
 } else if (viewType === 'sm') {
  btnSm.className = activeClass('bg-amber-600');
  wrapSm.classList.remove('hidden');

  titleText.innerText = currentLang === 'en' ? 'SM (SiO2/MgO) Distribution per Pit' : 'Distribusi SM (SiO2/MgO) per Pit';
  activeDesc.innerText = currentLang === 'en' ? 'SiO2/MgO ratio (Silica Modulus) per pit, used to monitor slag/smelting characteristics.' : 'Rasio SiO2/MgO (Silica Modulus) per pit, untuk memantau karakteristik slag/peleburan.';
  activeIcon.setAttribute('data-lucide', 'bar-chart-3');
 } else if (viewType === 'breakdown') {
  btnBreakdown.className = activeClass('bg-purple-600');
  wrapBreakdown.classList.remove('hidden');
  if (globalRawData && globalRawData.length > 0) renderReconciliation();

  titleText.innerText = currentLang === 'en' ? 'Breakdown Chart by Pit' : 'Grafik Breakdown per Pit';
  activeDesc.innerText = currentLang === 'en' ? 'Shipment destination breakdown per Pit, following the date & Pit filter on the Reconciliation tab.' : 'Breakdown tujuan pengapalan per Pit, mengikuti filter tanggal & Pit di tab Rekonsiliasi.';
  activeIcon.setAttribute('data-lucide', 'layers');
 } else if (viewType === 'blockmodel') {
  btnBlockmodel.className = activeClass('bg-rose-600');
  wrapBlockmodel.classList.remove('hidden');
  fetchBlockModelData();

  titleText.innerText = currentLang === 'en' ? 'Block Model vs Actual' : 'Block Model vs Aktual';
  activeDesc.innerText = currentLang === 'en' ? 'Comparison of geological model estimates (Surpac) against actual mined tonnage per Block & Pit.' : 'Perbandingan estimasi model geologi (Surpac) dengan realisasi tonase hasil gali per Blok & Pit.';
  activeIcon.setAttribute('data-lucide', 'layers-3');
 } else if (viewType === 'monthly') {
  btnMonthly.className = activeClass('bg-cyan-600');
  wrapMonthly.classList.remove('hidden');
  if (typeof renderMonthlyTrend === 'function') renderMonthlyTrend();

  titleText.innerText = currentLang === 'en' ? 'Month-over-Month Trend' : 'Tren Bulan ke Bulan';
  activeDesc.innerText = currentLang === 'en' ? 'Automatic comparison of tonnage & average Ni% between this month and the previous month, plus the last 6 months trend.' : 'Perbandingan otomatis tonase & rata-rata Ni%, plus tren 6 bulan terakhir.';
  activeIcon.setAttribute('data-lucide', 'calendar-range');
 }
 lucide.createIcons();
 if(trendTonaseChart) trendTonaseChart.resize();
 if(trendNiChart) trendNiChart.resize();
 if(smChart) smChart.resize();
 if(trendMonthlyChart) trendMonthlyChart.resize();
 if(rekonChart) rekonChart.resize();
 if(blockModelChart) blockModelChart.resize();
 }

 // BARU: Trend Bulan-ke-Bulan -- agregasi dari globalRawData (sumber sama dengan chart
 // Tonase/Ni harian), dikelompokkan per bulan (YYYY-MM dari kolom tanggal). Menampilkan
 // 2 kartu perbandingan (Bulan Ini vs Bulan Lalu) + chart 6 bulan terakhir yang punya data.
 // Lazy-render: cuma dipanggil saat toggle "Bulan ke Bulan" dibuka (switchTrendView), bukan
 // tiap kali updateDashboard() jalan, supaya tidak menambah beban render di view lain.
 function renderMonthlyTrend() {
 const cardTonaseCurrent = document.getElementById('monthly-tonase-current');
 const cardTonaseDelta = document.getElementById('monthly-tonase-delta');
 const cardTonasePrevLabel = document.getElementById('monthly-tonase-prev-label');
 const cardNiCurrent = document.getElementById('monthly-ni-current');
 const cardNiDelta = document.getElementById('monthly-ni-delta');
 const cardNiPrevLabel = document.getElementById('monthly-ni-prev-label');
 if (!cardTonaseCurrent || !trendMonthlyChart) return;

 const monthTonaseMap = {}, monthNiMap = {};
 (globalRawData || []).forEach(row => {
  const cleanRow = rawToCleanRow.get(row) || {};
  const tonase = cleanNumber(cleanRow['tonase']);
  let ni = cleanNumber(cleanRow['ni %'] || cleanRow['ni']);
  if (ni > 50) ni = ni / 100;
  const tanggal = cleanRow['tanggal'] ? cleanRow['tanggal'].trim() : (cleanRow['date'] ? cleanRow['date'].trim() : '');
  if (!tanggal || tonase === 0) return;

  const dateKey = tanggal.split(' ')[0]; // format ISO yyyy-MM-dd
  const monthKey = dateKey.substring(0, 7); // yyyy-MM
  if (monthKey.length !== 7) return;

  monthTonaseMap[monthKey] = (monthTonaseMap[monthKey] || 0) + tonase;
  if (ni > 0) {
  if (!monthNiMap[monthKey]) monthNiMap[monthKey] = { sum: 0, count: 0 };
  monthNiMap[monthKey].sum += ni;
  monthNiMap[monthKey].count++;
  }
 });

 const sortedMonths = Object.keys(monthTonaseMap).sort();
 const emptyState = () => {
  cardTonaseCurrent.innerText = '-';
  cardTonaseDelta.innerText = '-';
  cardTonaseDelta.className = 'text-xs font-semibold mb-1 text-slate-500';
  cardTonasePrevLabel.innerText = currentLang === 'en' ? 'No monthly data yet.' : 'Belum ada data bulanan.';
  cardNiCurrent.innerText = '-';
  cardNiDelta.innerText = '-';
  cardNiDelta.className = 'text-xs font-semibold mb-1 text-slate-500';
  cardNiPrevLabel.innerText = currentLang === 'en' ? 'No monthly data yet.' : 'Belum ada data bulanan.';
  trendMonthlyChart.data.labels = [];
  trendMonthlyChart.data.datasets[0].data = [];
  trendMonthlyChart.data.datasets[1].data = [];
  trendMonthlyChart.update();
 };

 if (sortedMonths.length === 0) { emptyState(); return; }

 const monthLabel = (mk) => {
  const [y, m] = mk.split('-');
  const namaBulan = currentLang === 'en'
  ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  : ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return namaBulan[parseInt(m, 10) - 1] + ' ' + y;
 };

 // Kartu perbandingan: bulan terakhir yang punya data (current) vs bulan sebelum itu (prev).
 // TIDAK selalu berarti "bulan kalender berjalan" -- kalau bulan ini belum ada input sama
 // sekali, current jatuh ke bulan terakhir yang benar-benar ada datanya (fallback aman).
 const lastMonth = sortedMonths[sortedMonths.length - 1];
 const prevMonth = sortedMonths.length >= 2 ? sortedMonths[sortedMonths.length - 2] : null;

 const currentTonase = monthTonaseMap[lastMonth] || 0;
 const prevTonase = prevMonth ? (monthTonaseMap[prevMonth] || 0) : null;
 const currentNi = monthNiMap[lastMonth] ? (monthNiMap[lastMonth].sum / monthNiMap[lastMonth].count) : null;
 const prevNi = (prevMonth && monthNiMap[prevMonth]) ? (monthNiMap[prevMonth].sum / monthNiMap[prevMonth].count) : null;

 const deltaHtml = (curr, prev, isPercentPoint) => {
  if (prev === null || prev === undefined || prev === 0) {
  return { text: currentLang === 'en' ? 'No previous month data' : 'Belum ada data bulan sebelumnya', cls: 'text-xs font-semibold mb-1 text-slate-500' };
  }
  const diff = curr - prev;
  const pct = (diff / prev) * 100;
  const arrow = diff > 0 ? '&#9650;' : (diff < 0 ? '&#9660;' : '&#8212;');
  const colorCls = diff > 0 ? 'text-emerald-400' : (diff < 0 ? 'text-rose-400' : 'text-slate-400');
  const pctFmt = Math.abs(pct).toFixed(1) + '%';
  return { text: `${arrow} ${pctFmt}`, cls: `text-xs font-semibold mb-1 ${colorCls}` };
 };

 cardTonaseCurrent.innerText = currentTonase.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + (currentLang === 'en' ? ' Tons' : ' Ton');
 const tonaseDelta = deltaHtml(currentTonase, prevTonase, false);
 cardTonaseDelta.innerHTML = tonaseDelta.text;
 cardTonaseDelta.className = tonaseDelta.cls;
 cardTonasePrevLabel.innerText = (currentLang === 'en' ? 'vs ' : 'vs ') + (prevMonth ? monthLabel(prevMonth) + ': ' + prevTonase.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + (currentLang === 'en' ? ' Tons' : ' Ton') : (currentLang === 'en' ? 'no prior month' : 'belum ada bulan sebelumnya')) + ' (' + monthLabel(lastMonth) + ')';

 cardNiCurrent.innerText = currentNi !== null ? currentNi.toFixed(2) + '%' : '-';
 const niDelta = deltaHtml(currentNi || 0, prevNi, true);
 cardNiDelta.innerHTML = currentNi !== null ? niDelta.text : '-';
 cardNiDelta.className = currentNi !== null ? niDelta.cls : 'text-xs font-semibold mb-1 text-slate-500';
 cardNiPrevLabel.innerText = (currentLang === 'en' ? 'vs ' : 'vs ') + (prevMonth && prevNi !== null ? monthLabel(prevMonth) + ': ' + prevNi.toFixed(2) + '%' : (currentLang === 'en' ? 'no prior month' : 'belum ada bulan sebelumnya')) + ' (' + monthLabel(lastMonth) + ')';

 // Chart 6 bulan terakhir yang punya data (bukan cuma 6 bulan kalender terakhir -- kalau
 // datanya bolong/jarang, chart tetap menampilkan bulan-bulan yang benar-benar terisi).
 const last6Months = sortedMonths.slice(-6);
 trendMonthlyChart.data.labels = last6Months.map(monthLabel);
 trendMonthlyChart.data.datasets[0].data = last6Months.map(mk => monthTonaseMap[mk] || 0);
 trendMonthlyChart.data.datasets[1].data = last6Months.map(mk => monthNiMap[mk] ? (monthNiMap[mk].sum / monthNiMap[mk].count) : null);
 trendMonthlyChart.update();
 }

 function switchRekonView(viewType) {
 currentRekonView = viewType;
 const btnBreakdown = document.getElementById('btn-rekon-view-breakdown');
 const btnPending = document.getElementById('btn-rekon-view-pending');
 const btnBlockmodel = document.getElementById('btn-rekon-view-blockmodel');
 const btnMatrix = document.getElementById('btn-rekon-view-matrix');
 const btnRca = document.getElementById('btn-rekon-view-rca');
 const wrapBreakdown = document.getElementById('wrapper-rekon-breakdown');
 const wrapPending = document.getElementById('wrapper-rekon-pending');
 const wrapBlockmodel = document.getElementById('wrapper-rekon-blockmodel');
 const wrapMatrix = document.getElementById('wrapper-rekon-matrix');
 const wrapRca = document.getElementById('wrapper-rekon-rca');
 const titleText = document.getElementById('rekon-title-text');
 const activeDesc = document.getElementById('rekon-active-desc');
 const activeIcon = document.getElementById('rekon-active-icon');

 const activeClass = (color) => `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${color} text-white shadow-sm flex items-center gap-1.5 cursor-pointer`;
 const inactiveClass = "px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer";

 btnBreakdown.className = inactiveClass;
 btnPending.className = inactiveClass;
 btnBlockmodel.className = inactiveClass;
 btnMatrix.className = inactiveClass;
 btnRca.className = inactiveClass;
 wrapBreakdown.classList.add('hidden');
 wrapPending.classList.add('hidden');
 wrapBlockmodel.classList.add('hidden');
 wrapMatrix.classList.add('hidden');
 wrapRca.classList.add('hidden');

 if (viewType === 'breakdown') {
  btnBreakdown.className = activeClass('bg-blue-600');
  wrapBreakdown.classList.remove('hidden');

  titleText.innerText = currentLang === 'en' ? 'Breakdown by Pit & Destination' : 'Breakdown per Pit & Tujuan';
  activeDesc.innerText = currentLang === 'en' ? 'Production tonnage detail per Pit, broken down by shipment destination.' : 'Rincian tonase produksi per Pit, dipecah berdasarkan tujuan pengapalan.';
  activeIcon.setAttribute('data-lucide', 'layers');
 } else if (viewType === 'pending') {
  btnPending.className = activeClass('bg-amber-600');
  wrapPending.classList.remove('hidden');

  titleText.innerText = currentLang === 'en' ? 'Rows Without an Assigned Destination' : 'Baris Belum Ter-assign Tujuan';
  activeDesc.innerText = currentLang === 'en' ? 'Rows with an empty Destination. Sorted by longest waiting time, click to update via the Destination & Shipping ID popup.' : 'Baris tujuan kosong. Diurutkan yang lama menunggu, klik update popup Tujuan & ID Pengapalan.';
  activeIcon.setAttribute('data-lucide', 'alert-circle');
 } else if (viewType === 'blockmodel') {
  btnBlockmodel.className = activeClass('bg-rose-600');
  wrapBlockmodel.classList.remove('hidden');
  fetchBlockModelData();

  titleText.innerText = currentLang === 'en' ? 'Block Model vs Actual' : 'Block Model vs Aktual';
  activeDesc.innerText = currentLang === 'en' ? 'Comparison of geological model estimates (Surpac) against actual mined tonnage per Block & Pit.' : 'Perbandingan estimasi model geologi (Surpac) dengan realisasi tonase hasil gali per Blok & Pit.';
  activeIcon.setAttribute('data-lucide', 'layers-3');
 } else if (viewType === 'matrix') {
  btnMatrix.className = activeClass('bg-indigo-600');
  wrapMatrix.classList.remove('hidden');
  fetchPitActualData();

  titleText.innerText = currentLang === 'en' ? 'Reconciliation Matrix (F1-F4)' : 'Matriks Rekonsiliasi (F1-F4)';
  activeDesc.innerText = currentLang === 'en' ? 'F1 & F2 per Block (traceable). F3 & F4 total-level only (material blends across Blocks in the Dome).' : 'F1 & F2 per Blok (bisa dilacak). F3 & F4 cuma level total (material tercampur antar-Blok di Dome).';
  activeIcon.setAttribute('data-lucide', 'git-compare');
 } else if (viewType === 'rca') {
  btnRca.className = activeClass('bg-blue-600');
  wrapRca.classList.remove('hidden');
  fetchRcaLogData();

  titleText.innerText = currentLang === 'en' ? 'RCA Log -- Root Cause & Recommendations' : 'RCA Log -- Root Cause & Rekomendasi';
  activeDesc.innerText = currentLang === 'en' ? 'Root-cause explanations and actions for reconciliation deviations by Block.' : 'Penjelasan akar masalah & tindakan untuk penyimpangan rekonsiliasi per Blok.';
  activeIcon.setAttribute('data-lucide', 'search-check');
 }
 lucide.createIcons();
 }

 let pendingExportSource = 'digging';
 let pendingExportOrientation = 'portrait';

 function setExportOrientation(orientation) {
 pendingExportOrientation = orientation;
 const btnP = document.getElementById('btn-orientation-portrait');
 const btnL = document.getElementById('btn-orientation-landscape');
 const activeClass = 'bg-blue-600 text-white shadow-md';
 const inactiveClass = 'text-slate-400 hover:text-slate-200';
 btnP.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ' + (orientation === 'portrait' ? activeClass : inactiveClass);
 btnL.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ' + (orientation === 'landscape' ? activeClass : inactiveClass);
 }

 function getExportColumns(source) {
 if (source === 'validasi') {
  return {
  heads: [
   { key: 'th_date_export_v', i18n: 'th_date', fallback: 'Tanggal' },
   { key: 'th_idtp_export', i18n: 'validasi_th_idtp', fallback: 'ID TP' },
   { key: 'th_area_export', i18n: 'validasi_th_area', fallback: 'Area' },
   { key: 'th_pelapor_export', i18n: 'digging_detail_reporter', fallback: 'Pelapor' },
   { key: 'th_kedalaman_export', i18n: 'validasi_th_meter', fallback: 'Kedalaman', align: 'text-center' },
   { key: 'th_bench_export', i18n: 'digging_detail_bench', fallback: 'Bench' },
   { key: 'th_timur_export', i18n: 'th_east', fallback: 'Timur' },
   { key: 'th_utara_export', i18n: 'th_north', fallback: 'Utara' },
   { key: 'th_ni_export', i18n: 'th_ni', fallback: 'Ni %', align: 'text-center' },
   { key: 'th_fe_export', i18n: 'th_fe', fallback: 'Fe %', align: 'text-center' },
   { key: 'th_co_export', i18n: 'th_co', fallback: 'Co %', align: 'text-center' },
   { key: 'th_mgo_export', i18n: 'th_mgo', fallback: 'MgO %', align: 'text-center' },
   { key: 'th_sio2_export', i18n: 'th_sio2', fallback: 'SiO2 %', align: 'text-center' },
   { key: 'th_sm_export', i18n: 'th_sm', fallback: 'SM %', align: 'text-center' },
   { key: 'th_status_export_v', i18n: 'validasi_th_status', fallback: 'Status', align: 'text-center' },
   { key: 'th_note_export_v', i18n: 'digging_detail_keterangan', fallback: 'Note' }
  ],
  rowHtml: function(g) {
   const fmt = v => v === null || v === undefined ? '-' : v.toFixed(2);
   const niStatus = getValidasiNiStatus(g.avg.ni);
   const notes = g.depths.map(d => d.catatan).filter(c => c && c !== '-').join('; ') || '-';
   // Samakan warna Ni% dengan tabel live Validasi/Digging lewat preset terpusat.
   const classifyExportV = classifyMaterial(g.avg.ni, 'Auto', g.avg.sm);
   const niColorClassExportV = getGradeTextClass(classifyExportV.classGrade);
   return `
   <td class="p-2.5 text-slate-300">${g.tanggal}</td>
   <td class="p-2.5 font-semibold text-title">${g.idTp}</td>
   <td class="p-2.5">${g.area}</td>
   <td class="p-2.5">${g.pelapor}</td>
   <td class="p-2.5 text-center">${g.depths.length}/5 m</td>
   <td class="p-2.5">${g.bench}</td>
   <td class="p-2.5">${g.timur}</td>
   <td class="p-2.5">${g.utara}</td>
   <td class="p-2.5 text-center ${niColorClassExportV} font-bold">${fmt(g.avg.ni)}</td>
   <td class="p-2.5 text-center">${fmt(g.avg.fe)}</td>
   <td class="p-2.5 text-center">${fmt(g.avg.co)}</td>
   <td class="p-2.5 text-center">${fmt(g.avg.mgo)}</td>
   <td class="p-2.5 text-center">${fmt(g.avg.sio2)}</td>
   <td class="p-2.5 text-center">${fmt(g.avg.sm)}</td>
   <td class="p-2.5 text-center">${niStatus.label}</td>
   <td class="p-2.5 text-slate-400">${notes}</td>
   `;
  },
  rowPrint: function(g) {
   const fmt = v => v === null || v === undefined ? '-' : v.toFixed(2);
   const niStatus = getValidasiNiStatus(g.avg.ni);
   const notes = g.depths.map(d => d.catatan).filter(c => c && c !== '-').join('; ') || '-';
   return [g.tanggal, g.idTp, g.area, g.pelapor, g.depths.length + '/5 m', g.bench, g.timur, g.utara, fmt(g.avg.ni), fmt(g.avg.fe), fmt(g.avg.co), fmt(g.avg.mgo), fmt(g.avg.sio2), fmt(g.avg.sm), niStatus.label, notes];
  }
  };
 }
 if (source === 'rekonsiliasi') {
  return {
  heads: [
   { key: 'th_pit_rekon', i18n: 'th_pit', fallback: 'Pit' },
   { key: 'th_produksi_rekon', i18n: 'rekon_th_produksi', fallback: 'Produksi (Ton)', align: 'text-right' },
   { key: 'th_efo_rekon', i18n: 'rekon_th_efo', fallback: 'EFO (Ton)', align: 'text-right' },
   { key: 'th_eto_rekon', i18n: 'rekon_th_eto', fallback: 'ETO (Ton)', align: 'text-right' },
   { key: 'th_direct_rekon', i18n: 'rekon_th_direct', fallback: 'Direct (Ton)', align: 'text-right' },
   { key: 'th_disposal_rekon', i18n: 'rekon_th_disposal', fallback: 'Disposal (Ton)', align: 'text-right' },
   { key: 'th_belum_rekon', i18n: 'rekon_th_belum', fallback: 'Belum Dikirim (Ton)', align: 'text-right' }
  ],
  rowHtml: function(item) {
   const fmt = n => (n || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });
   return `
   <td class="p-2.5 font-semibold text-title">${item.pit}</td>
   <td class="p-2.5 text-right font-bold text-title">${fmt(item.produksi)}</td>
   <td class="p-2.5 text-right text-blue-400">${fmt(item.efo)}</td>
   <td class="p-2.5 text-right text-emerald-400">${fmt(item.eto)}</td>
   <td class="p-2.5 text-right text-amber-400">${fmt(item.direct)}</td>
   <td class="p-2.5 text-right text-slate-400">${fmt(item.disposal)}</td>
   <td class="p-2.5 text-right ${item.belum > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}">${fmt(item.belum)}</td>
   `;
  },
  rowPrint: function(item) {
   const fmt = n => (n || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });
   return [item.pit, fmt(item.produksi), fmt(item.efo), fmt(item.eto), fmt(item.direct), fmt(item.disposal), fmt(item.belum)];
  }
  };
 }
   // BARU: Export RCA Log ke PDF/Excel/Word -- dipakai manajemen untuk pantau action plan
 // & PIC terkait secara berkala, tanpa perlu buka Google Sheets manual. Sumber data:
 // globalRcaLogData (sama data dipakai tampilan RCA Log & Laporan Berkala).
 if (source === 'rca') {
  return {
  heads: [
   { key: 'th_date_export_rca', i18n: 'th_date', fallback: 'Tanggal' },
   { key: 'th_blok_export_rca', i18n: 'blockmodel_th_blok', fallback: 'Blok' },
   { key: 'th_pit_export_rca', i18n: 'th_pit', fallback: 'Pit' },
   { key: 'th_tahap_export_rca', i18n: 'rca_th_tahap', fallback: 'Tahap Bermasalah' },
   { key: 'th_deskripsi_export_rca', i18n: 'rca_th_deskripsi', fallback: 'Deskripsi Isu' },
   { key: 'th_rootcause_export_rca', i18n: 'rca_th_root_cause', fallback: 'Root Cause' },
   { key: 'th_tindakan_export_rca', i18n: 'rca_th_tindakan', fallback: 'Tindakan' },
   { key: 'th_pic_export_rca', i18n: 'rca_th_pic', fallback: 'PIC' },
   { key: 'th_target_export_rca', i18n: 'rca_th_target', fallback: 'Target' },
   { key: 'th_status_export_rca', i18n: 'th_status', fallback: 'Status', align: 'text-center' }
  ],
  rowHtml: function(item) {
   const statusColorMap = { open: 'text-rose-400', progress: 'text-amber-400', closed: 'text-emerald-400' };
   const statusCls = statusColorMap[(item.status || '').toLowerCase()] || 'text-slate-400';
   return `
   <td class="p-2.5 text-slate-300">${item.tanggal || '-'}</td>
   <td class="p-2.5 font-semibold text-title">${item.blok || '-'}</td>
   <td class="p-2.5">${item.pit || '-'}</td>
   <td class="p-2.5">${item.tahap || '-'}</td>
   <td class="p-2.5">${item.deskripsi_isu || '-'}</td>
   <td class="p-2.5 text-slate-400">${item.root_cause || '-'}</td>
   <td class="p-2.5 text-slate-400">${item.tindakan || '-'}</td>
   <td class="p-2.5">${item.pic || '-'}</td>
   <td class="p-2.5">${item.target || '-'}</td>
   <td class="p-2.5 text-center font-semibold ${statusCls}">${item.status || 'Open'}</td>
   `;
  },
  rowPrint: function(item) {
   return [item.tanggal || '-', item.blok || '-', item.pit || '-', item.tahap || '-', item.deskripsi_isu || '-', item.root_cause || '-', item.tindakan || '-', item.pic || '-', item.target || '-', item.status || 'Open'];
  }
  };
 }
 if (source === 'member') {
  return {
  heads: [
   { key: 'th_nama_export', i18n: 'export_th_nama', fallback: 'Nama' },
   { key: 'th_jabatan_export', i18n: 'export_th_jabatan', fallback: 'Jabatan' },
   { key: 'th_target_export', i18n: 'modal_blending_target', fallback: 'Target Blending' },
   { key: 'th_inspeksi_export', i18n: 'export_th_inspeksi', fallback: 'Inspeksi Bench' },
   { key: 'th_accuracy_export', i18n: 'export_th_accuracy', fallback: 'Accuracy' },
   { key: 'th_status_export', i18n: 'export_th_status', fallback: 'Status' },
   { key: 'th_grade_export', i18n: 'export_th_grade', fallback: 'Grade' }
  ],
  rowHtml: function(item) {
   return `
   <td class="p-2.5 font-medium text-title">${item.nama || '-'}</td>
   <td class="p-2.5">${item.jabatan || '-'}</td>
   <td class="p-2.5 text-center">${item.target || '-'}</td>
   <td class="p-2.5 text-center">${item.inspeksi || '-'}</td>
   <td class="p-2.5 text-center">${item.accuracy || '-'}</td>
   <td class="p-2.5">${item.status || '-'}</td>
   <td class="p-2.5 text-center font-semibold">${item.grade || '-'}</td>
   `;
  },
  rowPrint: function(item) {
   return [item.nama || '-', item.jabatan || '-', item.target || '-', item.inspeksi || '-', item.accuracy || '-', item.status || '-', item.grade || '-'];
  }
  };
 }
 return {
  heads: [
  { key: 'th_date', i18n: 'th_date', fallback: 'Tanggal' },
  { key: 'th_day', i18n: 'th_day', fallback: 'Shift' },
  { key: 'th_reporter_col', i18n: 'th_reporter_col', fallback: 'Pelapor' },
  { key: 'th_pit', i18n: 'th_pit', fallback: 'Pit' },
  { key: 'th_block', i18n: 'th_block', fallback: 'Blok' },
  { key: 'th_material', i18n: 'th_material', fallback: 'Material' },
  { key: 'th_tonnage', i18n: 'th_tonnage', fallback: 'Tonase', align: 'text-right' },
  { key: 'th_ni', i18n: 'th_ni', fallback: 'Ni %', align: 'text-center' },
  { key: 'th_fe', i18n: 'th_fe', fallback: 'Fe %', align: 'text-center' },
  { key: 'th_co', i18n: 'th_co', fallback: 'Co %', align: 'text-center' },
  { key: 'th_mgo', i18n: 'th_mgo', fallback: 'MgO %', align: 'text-center' },
  { key: 'th_sio2', i18n: 'th_sio2', fallback: 'SiO2 %', align: 'text-center' },
  { key: 'th_sm', i18n: 'th_sm', fallback: 'SM %', align: 'text-center' },
  { key: 'th_tujuan', i18n: 'digging_form_destination', fallback: 'Tujuan' },
  { key: 'th_id_efo', i18n: 'th_id_efo', fallback: 'ID EFO' },
  { key: 'th_id_eto', i18n: 'th_id_eto', fallback: 'ID ETO' },
  { key: 'th_ship', i18n: 'th_ship', fallback: 'Ship' },
  { key: 'th_keterangan', i18n: 'digging_detail_keterangan', fallback: 'Keterangan' }
  ],
  rowHtml: function(row) {
  const cleanRow = {};
  Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);
  let rawDateTime = cleanRow['tanggal'] || cleanRow['date'] || '-';
  let dateVal = rawDateTime.split(' ')[0] || '-';
  let dayVal = cleanRow['shift'] || '-';
  let pelapor = cleanRow['pelapor'] || cleanRow['nama'] || '-';
  // SM % bisa berupa angka mentah berdesimal panjang (hasil hitung SiO2÷MgO di sheet) --
  // dibulatkan 2 desimal, konsisten dengan Tabel Digging.
  const smValHtml = cleanRow['sm %'] || cleanRow['sm'] || '-';
  const smHtml = typeof smValHtml === 'number' ? smValHtml.toFixed(2) : smValHtml;
  return `
   <td class="p-2.5">${dateVal}</td>
   <td class="p-2.5 text-slate-400 font-semibold">${dayVal}</td>
   <td class="p-2.5">${pelapor}</td>
   <td class="p-2.5">${cleanRow['pit'] || cleanRow['area'] || '-'}</td>
   <td class="p-2.5 font-medium text-title">${cleanRow['blok'] || cleanRow['id blok'] || cleanRow['idblok'] || cleanRow['id_blok'] || '-'}</td>
   <td class="p-2.5">${cleanRow['material'] || '-'}</td>
   <td class="p-2.5 text-right font-semibold">${cleanNumber(cleanRow['tonase']).toLocaleString()}</td>
   <td class="p-2.5 text-center text-emerald-400 font-bold">${cleanRow['ni %'] || cleanRow['ni'] || '-'}</td>
   <td class="p-2.5 text-center">${cleanRow['fe %'] || cleanRow['fe'] || '-'}</td>
   <td class="p-2.5 text-center">${cleanRow['co %'] || cleanRow['co'] || '-'}</td>
   <td class="p-2.5 text-center">${cleanRow['mgo %'] || cleanRow['mgo'] || '-'}</td>
   <td class="p-2.5 text-center">${cleanRow['sio2 %'] || cleanRow['sio2'] || '-'}</td>
   <td class="p-2.5 text-center">${smHtml}</td>
   <td class="p-2.5">${cleanRow['tujuan'] || '-'}</td>
   <td class="p-2.5">${cleanRow['id efo'] || '-'}</td>
   <td class="p-2.5">${cleanRow['id eto'] || '-'}</td>
   <td class="p-2.5">${cleanRow['ship'] || cleanRow['nama ship'] || cleanRow['kapal'] || '-'}</td>
   <td class="p-2.5">${cleanRow['keterangan'] || '-'}</td>
  `;
  },
  rowPrint: function(row) {
  const cleanRow = {};
  Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);
  let rawDateTime = cleanRow['tanggal'] || cleanRow['date'] || '-';
  const smValPrint = cleanRow['sm %'] || cleanRow['sm'] || '-';
  const smPrint = typeof smValPrint === 'number' ? smValPrint.toFixed(2) : smValPrint;
  return [
   rawDateTime.split(' ')[0] || '-', cleanRow['shift'] || '-', cleanRow['pelapor'] || cleanRow['nama'] || '-',
   cleanRow['pit'] || cleanRow['area'] || '-', cleanRow['blok'] || cleanRow['id blok'] || cleanRow['idblok'] || cleanRow['id_blok'] || '-', cleanRow['material'] || '-',
   cleanNumber(cleanRow['tonase']).toLocaleString(), cleanRow['ni %'] || cleanRow['ni'] || '-',
   cleanRow['fe %'] || cleanRow['fe'] || '-', cleanRow['co %'] || cleanRow['co'] || '-',
   cleanRow['mgo %'] || cleanRow['mgo'] || '-', cleanRow['sio2 %'] || cleanRow['sio2'] || '-',
   smPrint, cleanRow['tujuan'] || '-',
   cleanRow['id efo'] || '-', cleanRow['id eto'] || '-',
   cleanRow['ship'] || cleanRow['nama ship'] || cleanRow['kapal'] || '-', cleanRow['keterangan'] || '-'
  ];
  }
 };
 }

 function setExportSource(source) {
 pendingExportSource = source;
 const btnDigging = document.getElementById('btn-source-digging');
 const btnMember = document.getElementById('btn-source-member');
 const btnRekon = document.getElementById('btn-source-rekonsiliasi');
 const btnValidasi = document.getElementById('btn-source-validasi');
 const btnRca = document.getElementById('btn-source-rca');
 const activeClass = 'bg-blue-600 text-white shadow-md';
 const inactiveClass = 'text-slate-400 hover:text-slate-200';
 btnDigging.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ' + (source === 'digging' ? activeClass : inactiveClass);
 btnMember.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ' + (source === 'member' ? activeClass : inactiveClass);
 btnRekon.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ' + (source === 'rekonsiliasi' ? activeClass : inactiveClass);
 btnValidasi.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ' + (source === 'validasi' ? activeClass : inactiveClass);
 btnRca.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ' + (source === 'rca' ? activeClass : inactiveClass);
 document.getElementById('preview-pit-box').classList.toggle('hidden', source === 'member' || source === 'validasi' || source === 'rca');

 // RCA export harus menunggu fetch selesai sebelum tombol konfirmasi boleh dipakai.
 // Ini menutup race window yang sebelumnya bisa menghasilkan Record_Count=0 saat
 // user mengklik Export tepat setelah memilih sumber RCA.
 if (source === 'rca') {
  const requestId = ++rcaExportRequestId;
  rcaExportLoading = true;
  renderExportPreview();
  setExportConfirmLoadingState(true);
  fetchRcaLogData(requestId).then(ok => {
   if (requestId !== rcaExportRequestId || pendingExportSource !== 'rca') return;
   rcaExportLoading = false;
   renderExportPreview();
   setExportConfirmLoadingState(!ok);
  });
  return;
 }

 // Membatalkan state loading RCA yang mungkin masih berjalan ketika user berpindah sumber.
 rcaExportRequestId++;
 rcaExportLoading = false;
 renderExportPreview();
 }

 function handleExportSelection(selectElement) {
 const val = selectElement.value;
 if (!val) return;

 const role = getCurrentExportRole();
 if (!isExportFormatAllowed(role, val)) {
  showExportFormatForbidden(val);
  selectElement.selectedIndex = 0;
  return;
 }

 pendingExportType = val;
 if (currentActiveTab === 'kpimember') pendingExportSource = 'member';
 else if (currentActiveTab === 'rekonsiliasi') pendingExportSource = 'rekonsiliasi';
 else if (currentActiveTab === 'validasi') pendingExportSource = 'validasi';
 else pendingExportSource = 'digging';

 if ((pendingExportSource === 'digging' && (!globalRawData || globalRawData.length === 0)) ||
  (pendingExportSource === 'member' && (!globalMemberData || globalMemberData.length === 0)) ||
  (pendingExportSource === 'rekonsiliasi' && (!globalRawData || globalRawData.length === 0)) ||
  (pendingExportSource === 'validasi' && (!globalValidasiData || globalValidasiData.length === 0))) {
  showNoticeModal(
  currentLang === 'en' ? 'No Data' : 'Tidak Ada Data',
  currentLang === 'en' ? 'No data to export yet. Try refreshing the dashboard first.' : 'Belum ada data untuk diekspor. Coba refresh dashboard terlebih dahulu.'
  );
  selectElement.selectedIndex = 0;
  return;
 }

 const modal = document.getElementById('export-preview-modal');
 showModalAnimated(modal);
 setExportSource(pendingExportSource);
 selectElement.selectedIndex = 0;
 }

 function renderExportPreview() {
 const cols = getExportColumns(pendingExportSource);
 const isRcaLoading = pendingExportSource === 'rca' && rcaExportLoading;

 if (pendingExportSource === 'member') {
  filteredExportData = globalMemberData.slice();
 } else if (pendingExportSource === 'rekonsiliasi') {
  renderReconciliation();
  filteredExportData = reconciliationBreakdownData.slice();
 } else if (pendingExportSource === 'validasi') {
  filteredExportData = globalValidasiData.slice();
 } else if (pendingExportSource === 'rca') {
  filteredExportData = (globalRcaLogData || []).slice();
 } else {
  const selectedPit = document.getElementById('pit-filter').value.toLowerCase();
  filteredExportData = globalRawData.filter(row => {
  const cleanRow = {};
  Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);
  const pit = (cleanRow['pit'] || cleanRow['area'] || '').toLowerCase();
  return !selectedPit || pit.includes(selectedPit);
  });
 }

 document.getElementById('preview-format-val').innerText = pendingExportType.toUpperCase();
 document.getElementById('preview-rows-val').innerText = isRcaLoading
  ? (currentLang === 'en' ? 'Loading...' : 'Memuat...')
  : filteredExportData.length + (currentLang === 'en' ? ' Rows' : ' Baris');
 if (pendingExportSource === 'digging') {
  document.getElementById('preview-pit-val').innerText = document.getElementById('pit-filter').value || (currentLang === 'en' ? 'All Pits' : 'Semua Pit');
 } else if (pendingExportSource === 'rekonsiliasi') {
  document.getElementById('preview-pit-val').innerText = document.getElementById('rekon-pit-filter').value || (currentLang === 'en' ? 'All Pits' : 'Semua Pit');
 }

 document.getElementById('export-orientation-toggle').classList.toggle('hidden', pendingExportType !== 'pdf');
 if (pendingExportType === 'pdf') {
  setExportOrientation(pendingExportOrientation);
 }

 const headerIcon = document.getElementById('preview-header-icon');
 const confirmBtn = document.getElementById('btn-confirm-export');
 if (pendingExportType === 'csv') {
  headerIcon.setAttribute('data-lucide', 'file-spreadsheet');
  confirmBtn.innerHTML = '<i data-lucide="download" class="w-3.5 h-3.5"></i> ' + (currentLang === 'en' ? 'Download CSV Now' : 'Download CSV Sekarang');
 } else if (pendingExportType === 'word') {
  headerIcon.setAttribute('data-lucide', 'file-text');
  confirmBtn.innerHTML = '<i data-lucide="download" class="w-3.5 h-3.5"></i> ' + (currentLang === 'en' ? 'Download Word Now' : 'Download Word Sekarang');
 } else {
  headerIcon.setAttribute('data-lucide', 'file-text');
  confirmBtn.innerHTML = '<i data-lucide="printer" class="w-3.5 h-3.5"></i> ' + (currentLang === 'en' ? 'Print / Save Professional PDF' : 'Cetak / Simpan PDF Profesional');
 }

 const thead = document.getElementById('preview-table-head');
 const theadRow = cols.heads.map(h => `<th class="p-2.5 ${h.align || ''}">${(translations[currentLang] && translations[currentLang][h.i18n]) || h.fallback}</th>`).join('');
 thead.innerHTML = '<tr>' + theadRow + '</tr>';

 const tbody = document.getElementById('preview-table-body');
 tbody.innerHTML = '';
 if (isRcaLoading) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td colspan="${cols.heads.length}" class="p-6 text-center text-slate-400 font-medium">` +
   `<span class="inline-flex items-center gap-2"><i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i>` +
   `${currentLang === 'en' ? 'Loading RCA data...' : 'Memuat data RCA...'}</span></td>`;
  tbody.appendChild(tr);
 } else {
  const sampleData = filteredExportData.slice(0, 5);
  sampleData.forEach(item => {
   const tr = document.createElement('tr');
   tr.innerHTML = cols.rowHtml(item);
   tbody.appendChild(tr);
  });
 }

 const sampleLabel = document.querySelector('#export-preview-modal [data-i18n="preview_sample"]');
 if (sampleLabel) {
  sampleLabel.innerText = isRcaLoading
   ? (currentLang === 'en' ? 'Loading Data' : 'Memuat Data')
   : (currentLang === 'en' ? 'Sample Data (Top 5 Rows)' : 'Sampel Data (5 Baris Teratas)');
 }
 lucide.createIcons();
 }

 function closeExportPreview() {
 const modal = document.getElementById('export-preview-modal');
 hideModalAnimated(modal);
 }

 function getExportTitleSubtitle() {
 const title = pendingExportSource === 'member'
  ? (currentLang === 'en' ? 'Geology Team Member KPI Report' : 'Laporan KPI Member Tim Geologi')
  : pendingExportSource === 'rekonsiliasi'
  ? (currentLang === 'en' ? 'Production & Reserve Reconciliation Report' : 'Laporan Rekonsiliasi Produksi & Cadangan')
  : pendingExportSource === 'validasi'
  ? (currentLang === 'en' ? 'Test Pit Assay Validation Report' : 'Laporan Validasi Assay Test Pit')
  : pendingExportSource === 'rca'
  ? (currentLang === 'en' ? 'RCA Log Report' : 'Laporan RCA Log')
  : (currentLang === 'en' ? 'Mining Production Report' : 'Laporan Produksi Tambang');
 const pitInfo = pendingExportSource === 'digging'
  ? ((currentLang === 'en' ? 'Pit Filter: ' : 'Filter Pit: ') + (document.getElementById('pit-filter').value || (currentLang === 'en' ? 'All Pits' : 'Semua Pit')) + ' -- ')
  : pendingExportSource === 'rekonsiliasi'
  ? ((currentLang === 'en' ? 'Pit Filter: ' : 'Filter Pit: ') + (document.getElementById('rekon-pit-filter').value || (currentLang === 'en' ? 'All Pits' : 'Semua Pit')) + ' -- ')
  : '';
 const subtitle = pitInfo + (currentLang === 'en' ? 'Total ' + filteredExportData.length + ' rows -- generated ' : 'Total ' + filteredExportData.length + ' baris -- dibuat ') + new Date().toLocaleString(currentLang === 'en' ? 'en-US' : 'id-ID');
 return { title, subtitle };
 }

 function buildPrintReport() {
 const cols = getExportColumns(pendingExportSource);
 const { title, subtitle } = getExportTitleSubtitle();

 document.getElementById('print-report-title').innerText = title;
 document.getElementById('print-report-subtitle').innerText = subtitle;

 const thead = document.getElementById('print-report-thead');
 thead.innerHTML = cols.heads.map(h => `<th style="padding:6px 8px;border:1px solid #cbd5e1;background:#f1f5f9;text-align:left;">${(translations[currentLang] && translations[currentLang][h.i18n]) || h.fallback}</th>`).join('');

 const tbody = document.getElementById('print-report-tbody');
 tbody.innerHTML = '';
 filteredExportData.forEach(item => {
  const values = cols.rowPrint(item);
  const tr = document.createElement('tr');
  tr.innerHTML = values.map(v => `<td style="padding:6px 8px;border:1px solid #cbd5e1;">${v}</td>`).join('');
  tbody.appendChild(tr);
 });
 }

  function getExportAuditFilterParams() {
  try {
   if (pendingExportSource === 'digging') return JSON.stringify({ pit: document.getElementById('pit-filter')?.value || '' });
   if (pendingExportSource === 'rekonsiliasi') return JSON.stringify({ pit: document.getElementById('rekon-pit-filter')?.value || '', date_start: document.getElementById('rekon-date-start')?.value || '', date_end: document.getElementById('rekon-date-end')?.value || '' });
   return '{}';
  } catch (e) { return '{}'; }
 }

 function isExportFormatAllowed(role, format) {
  role = String(role || 'PUBLIC').toUpperCase();
  format = String(format || '').toLowerCase();
  if (role === 'DEVELOPER') return ['csv','pdf','word'].indexOf(format) >= 0;
  if (role === 'SUPERVISOR') return ['pdf','word'].indexOf(format) >= 0;
  if (role === 'MEMBER') return format === 'pdf';
  return false;
 }

 function showExportFormatForbidden(format) {
  const role = getCurrentExportRole();
  const label = format === 'csv' ? 'CSV' : (format === 'word' ? 'Word' : 'PDF');
  const message = currentLang === 'en'
   ? (label + ' export is not available for role ' + role + '.')
   : ('Ekspor ' + label + ' tidak tersedia untuk role ' + role + '.');
  showNoticeModal(currentLang === 'en' ? 'Export Restricted' : 'Ekspor Dibatasi', message);
 }

 function getExportAuthToken() {
  // Export harus mengikuti role/session yang sedang diprioritaskan UI.
  // Bila Developer session aktif, jangan jatuhkan request ke member token lama/stale.
  const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
  if (devToken) return devToken;
  return (localStorage.getItem('mine_member_token') || '').trim();
 }

 function buildExportAuthenticatedPayload(source) {
  const payload = source instanceof URLSearchParams
   ? new URLSearchParams(source)
   : new URLSearchParams(source || {});
  const token = getExportAuthToken();
  payload.delete('sessionToken');
  payload.delete('devToken');
  if (token) payload.set('sessionToken', token);
  return payload;
 }

 async function authorizeExportServerSide(format) {
  try {
   const token = getExportAuthToken();
   if (!token) { showExportFormatForbidden(format); return false; }
   const payload = buildExportAuthenticatedPayload({ action:'authorizeExport', source_module:pendingExportSource, format:String(format || '').toUpperCase(), record_count:String(filteredExportData.length || 0), filter_params:getExportAuditFilterParams() });
   const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method:'POST', body:payload });
   const result = await response.json();
   if (!result || result.status !== 'success') { showExportFormatForbidden(format); return false; }
   return true;
  } catch (e) {
   showNoticeModal(currentLang === 'en' ? 'Export Authorization Failed' : 'Otorisasi Ekspor Gagal', currentLang === 'en' ? 'The server could not authorize this export. No file was generated.' : 'Server tidak dapat mengotorisasi ekspor ini. Tidak ada file yang dibuat.');
   return false;
  }
 }

 // Fire-and-forget Audit Trail export. Logging failure must never block export UX.
 // v90.2.86: read server response so AuditTrail failures are no longer silent.
 function logExportActivity(sourceModule, format, recordCount, status) {
  try {
   const token = getExportAuthToken();
   if (!token) return;
   const payload = buildExportAuthenticatedPayload({ action:'logExport', source_module:sourceModule, format:format, filter_params:getExportAuditFilterParams(), record_count:String(recordCount || 0), status:status || 'SUCCESS' });
   fetch(GOOGLE_SCRIPT_READ_URL, { method:'POST', body:payload })
    .then(function(res) { return res.json(); })
    .then(function(result) {
     if (!result || result.status !== 'success') {
      console.warn('logExportActivity gagal:', result && result.message, result && result.code ? '(' + result.code + ')' : '');
     }
    })
    .catch(function(err) {
     console.warn('logExportActivity error jaringan:', err);
    });
  } catch (e) {
   console.warn('logExportActivity exception:', e);
  }
 }

function exportToWord() {
 const cols = getExportColumns(pendingExportSource);
 const { title, subtitle } = getExportTitleSubtitle();

 const theadHtml = cols.heads.map(h => `<th style="padding:6px 8px;border:1px solid #333;background:#dbeafe;text-align:left;font-family:Arial,sans-serif;font-size:11px;">${(translations[currentLang] && translations[currentLang][h.i18n]) || h.fallback}</th>`).join('');
 const tbodyHtml = filteredExportData.map(item => {
  const values = cols.rowPrint(item);
  return '<tr>' + values.map(v => `<td style="padding:6px 8px;border:1px solid #333;font-family:Arial,sans-serif;font-size:11px;">${v}</td>`).join('') + '</tr>';
 }).join('');

 const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset="utf-8"><title>${title}</title></head>
  <body>
  <h2 style="font-family:Arial,sans-serif;">${title}</h2>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#555;">${subtitle}</p>
  <table style="border-collapse:collapse;width:100%;">
   <thead><tr>${theadHtml}</tr></thead>
   <tbody>${tbodyHtml}</tbody>
  </table>
  </body>
  </html>`;

 const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 const filenameBase = pendingExportSource === 'member' ? 'Laporan_KPI_Member_' : (pendingExportSource === 'rekonsiliasi' ? 'Laporan_Rekonsiliasi_' : (pendingExportSource === 'validasi' ? 'Laporan_Validasi_TestPit_' : (pendingExportSource === 'rca' ? 'Laporan_RCA_Log_' : 'Laporan_Produksi_Tambang_')));
 link.setAttribute('href', url);
 link.setAttribute('download', filenameBase + new Date().toISOString().slice(0, 10) + '.doc');
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 logExportActivity(pendingExportSource, 'Word', filteredExportData.length, 'SUCCESS');
 }

 async function executeConfirmedExport() {
 if (pendingExportSource === 'rca' && rcaExportLoading) {
  showNoticeModal(
   currentLang === 'en' ? 'RCA Data Still Loading' : 'Data RCA Masih Dimuat',
   currentLang === 'en' ? 'Please wait until RCA data finishes loading before exporting.' : 'Tunggu sampai data RCA selesai dimuat sebelum melakukan export.'
  );
  return;
 }
 const exportType = pendingExportType;
 if (!isExportFormatAllowed(getCurrentExportRole(), exportType)) {
  closeExportPreview();
  showExportFormatForbidden(exportType);
  return;
 }
 const authorized = await authorizeExportServerSide(exportType);
 if (!authorized) {
  closeExportPreview();
  return;
 }
 closeExportPreview();
 if (pendingExportType === 'csv') {
  try {
   const csv = Papa.unparse(filteredExportData);
   const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');
   const filenameBase = pendingExportSource === 'member' ? 'Laporan_KPI_Member_' : (pendingExportSource === 'rekonsiliasi' ? 'Laporan_Rekonsiliasi_' : (pendingExportSource === 'validasi' ? 'Laporan_Validasi_TestPit_' : (pendingExportSource === 'rca' ? 'Laporan_RCA_Log_' : 'Laporan_Produksi_Tambang_')));
   link.setAttribute('href',url);
   link.setAttribute('download',filenameBase + new Date().toISOString().slice(0,10) + '.csv');
   document.body.appendChild(link); link.click(); document.body.removeChild(link);
   logExportActivity(pendingExportSource,'CSV',filteredExportData.length,'SUCCESS');
  } catch(error) {
   logExportActivity(pendingExportSource,'CSV',filteredExportData.length,'FAILED');
   console.error('CSV export failed:',error);
  }
 } else if (pendingExportType === 'pdf') {
  try {
   buildPrintReport();
   let orientationStyle=document.getElementById('print-orientation-style');
   if(!orientationStyle){ orientationStyle=document.createElement('style'); orientationStyle.id='print-orientation-style'; document.head.appendChild(orientationStyle); }
   orientationStyle.innerHTML='@page { size: A4 ' + pendingExportOrientation + '; }';
   document.body.classList.add('printing-report');
   window.print();
   logExportActivity(pendingExportSource,'PDF',filteredExportData.length,'SUCCESS');
  } catch(error) {
   logExportActivity(pendingExportSource,'PDF',filteredExportData.length,'FAILED');
   console.error('PDF export failed:',error);
  }
 } else if (pendingExportType === 'word') {
  try { exportToWord(); } catch(error) { logExportActivity(pendingExportSource,'Word',filteredExportData.length,'FAILED'); console.error('Word export failed:',error); }
 }
 }

window.addEventListener('afterprint', function() {
 document.body.classList.remove('printing-report');
 document.body.classList.remove('printing-periodic-report');
 document.body.classList.remove('printing-professional-report');
 // PERBAIKAN BUG: tag <style id="print-orientation-style"> dipakai bareng oleh 3 alur
 // print/export berbeda (tombol Print biasa, Export PDF, Cetak Laporan Berkala), tapi
 // dulu tidak pernah dibersihkan setelah selesai -- akibatnya orientasi (Portrait/Landscape)
 // dari 1 aksi "nyangkut" dan ikut kepakai di aksi print lain berikutnya dalam sesi yang
 // sama (misal: cetak Laporan Berkala paksa Portrait, lalu klik tombol Print biasa jadi
 // ikut ke-Portrait walau usernya pilih Landscape di dialog browser). Hapus tag ini
 // begitu proses print selesai, supaya tiap aksi print SELALU mulai dari keadaan bersih
 // dan orientasinya ditentukan ulang oleh fungsi yang memicunya, bukan sisa aksi sebelumnya.
 const leftoverOrientationStyle = document.getElementById('print-orientation-style');
 if (leftoverOrientationStyle) leftoverOrientationStyle.remove();
 });

 // BARU: tombol Print utama (icon di header) -- SELALU set orientasi Landscape secara
 // eksplisit sebelum print, tidak lagi bergantung ke @page default di CSS maupun sisa
 // state dari aksi print/export lain (lihat catatan bug di atas pada afterprint listener).
 function printCurrentView() {
 let orientationStyle = document.getElementById('print-orientation-style');
 if (!orientationStyle) {
  orientationStyle = document.createElement('style');
  orientationStyle.id = 'print-orientation-style';
  document.head.appendChild(orientationStyle);
 }
 orientationStyle.innerHTML = '@page { size: A4 landscape; }';
 window.print();
 }

 // Penghalang ringan tambahan -- MEMBLOKIR shortcut umum untuk buka DevTools/View Source.
 // CATATAN JUJUR: ini bukan proteksi sungguhan. Browser modern punya banyak cara lain
 // untuk membuka DevTools (menu tiga titik, dsb) yang tidak bisa dicegah lewat JavaScript.
 document.addEventListener('keydown', function(e) {
 const key = e.key ? e.key.toUpperCase() : '';
 if (key === 'F12') { e.preventDefault(); return false; }
 if (e.ctrlKey && key === 'U') { e.preventDefault(); return false; }
 if (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) { e.preventDefault(); return false; }
 });

 // PIN developer TIDAK lagi disimpan di sini. Verifikasi dilakukan di server
 // (Google Apps Script), yang mengembalikan token sesi bila PIN benar.
 // Ini mencegah PIN terbaca lewat "View Page Source" / DevTools.

 function isDeveloperUnlocked() {
 return !!localStorage.getItem('mine_dev_token');
 }

 // BARU (22 Agu): fallback avatar sidebar bertingkat -- Google Drive (utama) gagal ->
 // foto lokal GitHub (avatar-yaya.png, di folder yang sama dgn index.html) -> avatar
 // generik ui-avatars.com sbg jaring pengaman terakhir. Pakai fungsi terpisah + penanda
 // tahap (data-fallback-stage) -- BUKAN onerror inline berantai -- supaya kalau SEMUA
 // sumber gagal sekaligus (kasus sangat jarang), tidak terjadi infinite loop request.
 function handleSidebarAvatarError(imgEl) {
 const stage = imgEl.dataset.fallbackStage || '0';
 if (stage === '0') {
  imgEl.dataset.fallbackStage = '1';
  imgEl.src = './assets/avatar-yaya.png';
 } else if (stage === '1') {
  imgEl.dataset.fallbackStage = '2';
  imgEl.src = 'https://ui-avatars.com/api/?name=Yaya&background=2563eb&color=fff';
 }
 // stage 2: sudah di fallback terakhir -- kalau ini juga gagal, dibiarkan (kasus
 // ekstrem: foto lokal belum ke-upload DAN API ui-avatars.com sedang down bersamaan).
 }

 // Kontrol akses fitur Dome -- sengaja 2 fungsi terpisah (assign vs lihat riwayat), bukan 1
 // pengecekan yang dipakai berulang -- supaya kalau nanti mau diubah (misal riwayat dibuka
 // untuk semua member tapi assign tetap dikunci developer), cukup ubah DI SINI SAJA, tidak
 // perlu bongkar ulang semua tempat yang memakainya. Saat ini keduanya sama: developer-only.
 // v90.2.104: Update Tujuan EFO/ETO/Disposal -- dibuka utk Developer+Supervisor,
 // sama pola dengan canCreateRca(). Matching permission granular server-side
 // 'digging.destination.update' (updatediggingids sudah dikeluarkan dari daftar
 // isDeveloperProtectedAction_ di backend). Server-side tetap otoritas akhir.
 function updateDeveloperAccessUI() {
 const lockedView = document.getElementById('dev-locked-view');
 const unlockedView = document.getElementById('dev-unlocked-view');
 const btnFormMember = document.getElementById('btn-open-form-member');
 const csvOption = document.getElementById('export-csv-option');
 const btnPrintView = document.getElementById('btn-print-view');
 const btnChatDeleteAll = document.getElementById('btn-chat-delete-all');
 const btnIssueDeleteAll = document.getElementById('btn-issue-delete-all');
 const devCleanupPanel = document.getElementById('dev-cleanup-panel');
 const panelResetProject = document.getElementById('panel-reset-project');
 const panelResetMemberPin = document.getElementById('panel-reset-member-pin'); // BARU (27 Agu)
 const sidebarDevIdentityCard = document.getElementById('sidebar-dev-identity-card');
 const unlocked = isDeveloperUnlocked();

 // BARU (22 Agu): kartu identitas Developer di sidebar bawah -- muncul HANYA saat
 // Developer Access ter-unlock (PIN benar), hilang total saat locked/logout. Pakai
 // pola add/remove 'flex' eksplisit (bukan cuma toggle 'hidden') -- konsisten dgn
 // showModalAnimated/hideModalAnimated di file ini, krn elemen ini butuh display:flex
 // (items-center) begitu ditampilkan, bukan display default div.
 if (sidebarDevIdentityCard) {
  if (unlocked) {
   sidebarDevIdentityCard.classList.remove('hidden');
   sidebarDevIdentityCard.classList.add('flex');
  } else {
   sidebarDevIdentityCard.classList.add('hidden');
   sidebarDevIdentityCard.classList.remove('flex');
  }
 }

 if (panelResetProject) {
  panelResetProject.classList.toggle('hidden', !unlocked);
 }

 if (panelResetMemberPin) {
  panelResetMemberPin.classList.toggle('hidden', !unlocked);
 }

 // BARU (28 Agu)
 const panelKpiEventApproval = document.getElementById('panel-kpi-event-approval');
 if (panelKpiEventApproval) {
  panelKpiEventApproval.classList.toggle('hidden', !unlocked);
  if (unlocked) loadKpiEventApprovalList();
 }

 // BARU (v90.2.117)
 const panelFormulaKpi = document.getElementById('panel-formula-kpi');
 if (panelFormulaKpi) {
  panelFormulaKpi.classList.toggle('hidden', !unlocked);
  if (unlocked && panelFormulaKpi.dataset.kpiFormulaLoaded !== '1') {
   panelFormulaKpi.dataset.kpiFormulaLoaded = '1';
   loadKpiFormulaConfig();
  }
  if (!unlocked) panelFormulaKpi.dataset.kpiFormulaLoaded = '';
 }

 if (devCleanupPanel) {
   devCleanupPanel.classList.toggle('hidden', !unlocked);
   if (unlocked && devCleanupPanel.dataset.retentionLoaded !== '1') {
    devCleanupPanel.dataset.retentionLoaded = '1';
    loadRetentionPolicy();
    loadSessionCachePolicy();
    loadApiAbuseGuardPolicy();
   }
   if (!unlocked) devCleanupPanel.dataset.retentionLoaded = '';
  }

 if (btnChatDeleteAll) {
  btnChatDeleteAll.classList.toggle('hidden', !unlocked);
  btnChatDeleteAll.classList.toggle('flex', unlocked);
 }
 if (btnIssueDeleteAll) {
  btnIssueDeleteAll.classList.toggle('hidden', !unlocked);
  btnIssueDeleteAll.classList.toggle('flex', unlocked);
 }

 if (btnPrintView) {
  btnPrintView.classList.toggle('hidden', !unlocked);
  btnPrintView.classList.toggle('flex', unlocked);
 }

 if (csvOption) {
  csvOption.innerText = unlocked
  ? ((translations[currentLang] && translations[currentLang].opt_csv) || '📊 Ekspor CSV')
  : '🔒 ' + (currentLang === 'en' ? 'Export CSV' : 'Ekspor CSV');
 }

 if (lockedView && unlockedView) {
  lockedView.classList.toggle('hidden', unlocked);
  unlockedView.classList.toggle('hidden', !unlocked);
  unlockedView.classList.toggle('flex', unlocked);
 }
 if (btnFormMember) {
  btnFormMember.classList.toggle('opacity-50', !unlocked);
  btnFormMember.title = unlocked ? '' : (currentLang === 'en' ? 'Locked -- unlock Developer Access in Settings first.' : 'Terkunci -- buka Akses Developer di Settings terlebih dahulu.');
 }
 var btnUpdateTujuan = document.getElementById('btn-open-update-tujuan');
 if (btnUpdateTujuan) {
  btnUpdateTujuan.classList.toggle('hidden', !canAssignDome());
 }
 var btnBargeShipment = document.getElementById('btn-open-form-barge-shipment');
 if (btnBargeShipment) {
  btnBargeShipment.classList.toggle('hidden', !canManageBarge());
  btnBargeShipment.classList.toggle('flex', canManageBarge());
 }
 var btnRca = document.getElementById('btn-open-form-rca');
 if (btnRca) {
  btnRca.classList.toggle('hidden', !canManageRca());
  btnRca.classList.toggle('flex', canManageRca());
 }
 var btnPitActual = document.getElementById('btn-open-form-pitactual');
 if (btnPitActual) {
  btnPitActual.classList.toggle('hidden', !canManagePitActual());
  btnPitActual.classList.toggle('inline-flex', canManagePitActual());
 }
 var panelGuide = document.getElementById('panel-guide-rekonsiliasi');
 if (panelGuide) {
  panelGuide.classList.toggle('hidden', !isDeveloperUnlocked());
 }
 // BARU: panel Parameter Global (gabungan 3 kartu: COG/Flag/Bucket & Sampel), sama pola
 // dengan panel Panduan Rekonsiliasi.
 var panelParameterGlobal = document.getElementById('panel-parameter-global');
 if (panelParameterGlobal) {
  panelParameterGlobal.classList.toggle('hidden', !isDeveloperUnlocked());
 }
 // v90.2.100: panel Padatkan Baris Kosong, sama pola dengan panel Developer lain.
 var devCompactPanel = document.getElementById('dev-compact-panel');
 if (devCompactPanel) {
  devCompactPanel.classList.toggle('hidden', !isDeveloperUnlocked());
 }
 }

 let appLoadingDepth = 0;

 function openDeveloperConsoleModal() {
  if (!isDeveloperUnlocked()) {
   showNoticeModal(currentLang === 'en' ? 'Developer Access Locked' : 'Akses Developer Terkunci', currentLang === 'en' ? 'Unlock Developer Access first.' : 'Buka Akses Developer terlebih dahulu.');
   return;
  }
  const modal = document.getElementById('developer-console-modal');
  const identity = document.getElementById('developer-console-identity');
  const name = (localStorage.getItem('mine_user_name') || localStorage.getItem('mine_user_id') || 'Developer').trim();
  if (identity) identity.textContent = (currentLang === 'en' ? 'Access active as: ' : 'Akses aktif sebagai: ') + name;
  updateDeveloperAccessUI();
  showModalAnimated(modal);
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
 }

 function closeDeveloperConsoleModal() {
  const modal = document.getElementById('developer-console-modal');
  hideModalAnimated(modal);
 }

 // BARU (27 Agu): Control Technical -- pola open/close identik dgn Control Sistem,
 // cuma target modal & container identity beda. updateDeveloperAccessUI() dipanggil
 // di sini juga karena fungsi itu men-toggle SEMUA panel Developer berdasarkan ID,
 // tidak peduli panel itu ada di modal Sistem atau Technical.
 function openDeveloperConsoleTechnicalModal() {
  if (!isDeveloperUnlocked()) {
   showNoticeModal(currentLang === 'en' ? 'Developer Access Locked' : 'Akses Developer Terkunci', currentLang === 'en' ? 'Unlock Developer Access first.' : 'Buka Akses Developer terlebih dahulu.');
   return;
  }
  const modal = document.getElementById('developer-console-technical-modal');
  const identity = document.getElementById('developer-console-technical-identity');
  const name = (localStorage.getItem('mine_user_name') || localStorage.getItem('mine_user_id') || 'Developer').trim();
  if (identity) identity.textContent = (currentLang === 'en' ? 'Access active as: ' : 'Akses aktif sebagai: ') + name;
  updateDeveloperAccessUI();
  showModalAnimated(modal);
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
 }

 function closeDeveloperConsoleTechnicalModal() {
  const modal = document.getElementById('developer-console-technical-modal');
  hideModalAnimated(modal);
 }

 function setLoginButtonLoading(buttonId, spinnerId, loading, labelId, loadingLabel) {
  const button = document.getElementById(buttonId);
  const spinner = document.getElementById(spinnerId);
  const label = labelId ? document.getElementById(labelId) : null;
  if (!button) return;
  button.disabled = !!loading;
  button.classList.toggle('opacity-60', !!loading);
  button.classList.toggle('cursor-wait', !!loading);
  if (spinner) spinner.classList.toggle('hidden', !loading);
  // Developer uses a circular lock button: hide the lock icon while the spinner is active
  // so the two glyphs never overlap. Member keeps its text label + spinner behavior.
  if (buttonId === 'dev-login-submit') {
   const lockIcon = document.getElementById('dev-login-lock-icon');
   if (lockIcon) lockIcon.classList.toggle('hidden', !!loading);
  }
  if (label && loadingLabel) {
   if (loading) {
    if (!label.dataset.idleText) label.dataset.idleText = label.textContent;
    label.textContent = loadingLabel;
   } else if (label.dataset.idleText) {
    label.textContent = label.dataset.idleText;
   }
  }
 }

 async function unlockDeveloperAccess() {
  const loginInput=document.getElementById('dev-login-id-input');
  const emailInput=document.getElementById('dev-email-input');
  const input=document.getElementById('dev-pin-input');
  const errorMsg=document.getElementById('dev-pin-error');
  const login_id=(loginInput?loginInput.value:'').trim(), email=(emailInput?emailInput.value:'').trim(), pin=input.value.trim();
  if(!login_id||!email||!/^[0-9]{6}$/.test(pin)){errorMsg.textContent=currentLang==='en'?'Login_ID, registered email, and 6-digit PIN are required.':'Login_ID, email terdaftar, dan PIN 6 digit wajib diisi.';errorMsg.classList.remove('hidden');return;}
  errorMsg.classList.add('hidden');
  input.disabled=true;
  if (loginInput) loginInput.disabled=true;
  if (emailInput) emailInput.disabled=true;
  setLoginButtonLoading('dev-login-submit','dev-login-spinner',true);
  try {
   const payload=new URLSearchParams({action:'verifyDevPin',login_id:login_id,email:email,pin:pin,client_info:navigator.userAgent.slice(0,180)});
   const response=await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL,{method:'POST',body:payload},20000);
   const result=await response.json();
   if(result.success&&result.token){
    localStorage.setItem('mine_dev_token',result.token);
    localStorage.setItem('mine_dev_session_id',result.session_id||'');
    localStorage.setItem('mine_dev_expires_at',result.expires_at||'');
    localStorage.setItem('mine_user_id',result.user_id||'');
    localStorage.setItem('mine_role_id',result.role_id||'');
    localStorage.setItem('mine_user_name',result.user_name||'');
    loadActiveMemberSessions(); // BARU (27 Agu): Active User Indicator langsung terisi setelah unlock, tidak nunggu poll berikutnya
    input.value='';
    errorMsg.classList.add('hidden');
    updateDeveloperAccessUI();
    openDeveloperConsoleModal();
    // Refresh Member grid tetap berjalan di belakang; jangan menahan pembukaan console.
    loadMembersFromSheet().catch(function(err){ console.warn('Refresh Member grid setelah Developer login ditunda/gagal:',err); });
   } else {
    errorMsg.textContent=result.message||(currentLang==='en'?'Developer login failed.':'Login Developer gagal.');
    errorMsg.classList.remove('hidden');
   }
  } catch(error) {
   console.error('Error login:',error);
   errorMsg.textContent=currentLang==='en'?'Could not reach server. Try again.':'Tidak bisa menghubungi server. Coba lagi.';
   errorMsg.classList.remove('hidden');
  } finally {
   input.disabled=false;
   if (loginInput) loginInput.disabled=false;
   if (emailInput) emailInput.disabled=false;
   setLoginButtonLoading('dev-login-submit','dev-login-spinner',false);
  }
 }

  // Developer uses the same serialized-client-session discipline as Member.
  // The token equality guard also protects two tabs: a stale response may not
  // clear a token that another request has already rotated successfully.
  let developerSessionOperationChain = Promise.resolve();
  function queueDeveloperSessionOperation(task) {
   const run = developerSessionOperationChain.then(task, task);
   developerSessionOperationChain = run.catch(function(){});
   return run;
  }
  function clearDeveloperSessionStorageIfCurrent(token) {
   if (token && (localStorage.getItem('mine_dev_token') || '').trim() !== token) return false;
   ['mine_dev_token','mine_dev_session_id','mine_dev_expires_at','mine_user_id','mine_role_id','mine_user_name'].forEach(function(key){localStorage.removeItem(key);});
   return true;
  }
  async function refreshSecuritySession(){return queueDeveloperSessionOperation(async function(){const token=(localStorage.getItem('mine_dev_token')||'').trim();if(!token){updateDeveloperAccessUI();return false;}try{const response=await fetch(GOOGLE_SCRIPT_READ_URL,{method:'POST',body:new URLSearchParams({action:'validateSession',sessionToken:token})});const result=await response.json();if(!result.success)clearDeveloperSessionStorageIfCurrent(token);updateDeveloperAccessUI();return !!result.success;}catch(e){console.warn('Session validation skipped:',e);updateDeveloperAccessUI();return false;}});}

 async function lockDeveloperAccess(){
  closeDeveloperConsoleModal();
  const token=localStorage.getItem('mine_dev_token');
  if(token){
   showAppLoading(currentLang==='en'?'Locking Developer Access':'Mengunci Akses Developer',currentLang==='en'?'Please wait...':'Mohon tunggu...');
   try{await fetch(GOOGLE_SCRIPT_READ_URL,{method:'POST',body:new URLSearchParams({action:'logoutSession',sessionToken:token})});}
   catch(e){}
   finally{hideAppLoading();}
  }
  localStorage.removeItem('mine_dev_token');
  localStorage.removeItem('mine_dev_session_id');
  localStorage.removeItem('mine_dev_expires_at');
  localStorage.removeItem('mine_user_id');
  localStorage.removeItem('mine_role_id');
  localStorage.removeItem('mine_user_name');
  updateDeveloperAccessUI();
  await loadMembersFromSheet();
}

 // SECURITY 90V: Login Member -- memakai endpoint server verifyMemberPin.
 // Session Member disimpan terpisah dari mine_dev_token agar akses Developer tidak tertimpa.
 function openMemberLoginModal() {
  const modal = document.getElementById('member-login-modal');
  const status = document.getElementById('member-login-status');
  if (status) { status.className = 'hidden text-xs font-medium leading-relaxed'; status.textContent = ''; }
  showModalAnimated(modal);
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  const login = document.getElementById('member-login-id-input');
  if (login) setTimeout(() => { login.focus(); resumeMemberLoginCountdown(); }, 50);
 }

 function closeMemberLoginModal() {
  const modal = document.getElementById('member-login-modal');
  hideModalAnimated(modal);
 }

 function setMemberLoginStatus(message, ok) {
  const status = document.getElementById('member-login-status');
  if (!status) return;
  status.className = ok ? 'text-xs font-medium leading-relaxed text-emerald-400' : 'text-xs font-medium leading-relaxed text-rose-400';
  status.textContent = message || '';
  status.classList.remove('hidden');
 }

 // MEMBER SESSION AVATAR -- tidak mengubah mekanisme login.
 // Sumber identitas tetap localStorage yang sudah diisi oleh verifyMemberPin.
 // Jika endpoint suatu saat mengirim avatar_url/photo_url, foto otomatis dipakai;
 // jika belum ada foto, tampilkan inisial nama/Login_ID (contoh: ME).
 function renderMemberSessionAvatar() {
  const wrap = document.getElementById('member-session-avatar-wrap');
  const box = document.getElementById('member-session-avatar');
  const img = document.getElementById('member-session-avatar-img');
  const initials = document.getElementById('member-session-avatar-initials');
  const menu = document.getElementById('member-session-menu');
  const menuName = document.getElementById('member-session-menu-name');
  const menuLogin = document.getElementById('member-session-menu-login');
  if (!wrap || !box || !img || !initials) return;

  const token = (localStorage.getItem('mine_member_token') || '').trim();
  const loginId = (localStorage.getItem('mine_member_login_id') || '').trim();
  const userName = (localStorage.getItem('mine_member_user_name') || '').trim();
  const avatarUrl = (localStorage.getItem('mine_member_avatar_url') || '').trim();

  if (!token || !loginId) {
   wrap.classList.add('hidden');
   box.classList.add('hidden');
   box.classList.remove('flex');
   if (menu) menu.classList.add('hidden');
   img.src = '';
   img.classList.add('hidden');
   initials.classList.add('hidden');
   initials.textContent = '';
   return;
  }

  const sourceName = userName || loginId;
  const words = sourceName.replace(/[_-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  let initialsText = '';
  if (words.length >= 2) {
   initialsText = (words[0][0] + words[1][0]).toUpperCase();
  } else {
   initialsText = sourceName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
  }
  initials.textContent = initialsText || 'ME';
  box.title = (currentLang === 'en' ? 'Active member: ' : 'Member aktif: ') + sourceName;
  if (menuName) menuName.textContent = sourceName;
  if (menuLogin) menuLogin.textContent = loginId;
  wrap.classList.remove('hidden');
  box.classList.remove('hidden');
  box.classList.add('flex');

  img.classList.add('hidden');
  initials.classList.remove('hidden');
  img.onload = function () {
   img.classList.remove('hidden');
   initials.classList.add('hidden');
  };
  img.onerror = function () {
   img.classList.add('hidden');
   initials.classList.remove('hidden');
  };
  if (avatarUrl) img.src = avatarUrl;
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
 }

// SECURITY 90V STEP 12B / v90.2.64: ACTIVE-SESSION TOKEN ROTATION
// Rotasi hanya dilakukan ketika browser mendeteksi aktivitas user baru-baru ini.
// Ini mencegah rotasi berkala menghidupkan kembali idle timeout saat user benar-benar diam.
// Rotasi mengganti token pada SESSION yang sama; Expires_At absolut tetap tidak berubah.
const TOKEN_ROTATION_INTERVAL_MS = 15 * 60 * 1000;
const TOKEN_ROTATION_ACTIVITY_WINDOW_MS = 5 * 60 * 1000;
let lastSecurityUserActivityAt = Date.now();
let lastMemberTokenRotationAt = 0;
let lastDeveloperTokenRotationAt = 0;

function getClientIdleLimitMinutes() {
  const role = String(localStorage.getItem('mine_member_role_id') || '').toUpperCase();
  if (localStorage.getItem('mine_dev_token')) return 60;
  if (role === 'DEVELOPER') return 60;
  return 30;
}
function ensureSessionIdleWarning() {
  if (sessionIdleWarningEl) return sessionIdleWarningEl;
  const el = document.createElement('div');
  el.id = 'session-idle-warning';
  el.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;display:none;max-width:min(92vw,520px);padding:12px 14px;border:1px solid rgba(245,158,11,.45);border-radius:12px;background:rgba(15,23,42,.96);box-shadow:0 10px 30px rgba(0,0,0,.35);color:#fff;font:600 13px/1.35 system-ui,sans-serif;';
  el.innerHTML = '<span id="session-idle-warning-text"></span><button id="session-idle-warning-btn" type="button" style="margin-left:10px;padding:6px 10px;border-radius:8px;border:1px solid rgba(245,158,11,.55);background:rgba(245,158,11,.16);color:#fde68a;font-weight:700;cursor:pointer">' + (currentLang === 'en' ? 'Stay Logged In' : 'Tetap Login') + '</button>';
  document.body.appendChild(el);
  el.querySelector('#session-idle-warning-btn').addEventListener('click', function() {
    markSecurityUserActivity();
    el.style.display = 'none';
    rotateActiveSecurityTokens().catch(function(err) { console.warn('Session keep-alive skipped:', err); });
  });
  sessionIdleWarningEl = el;
  return el;
}
function updateSessionIdleWarning() {
  if (document.visibilityState !== 'visible') return;
  const hasSession = !!(localStorage.getItem('mine_member_token') || localStorage.getItem('mine_dev_token'));
  if (!hasSession) { if (sessionIdleWarningEl) sessionIdleWarningEl.style.display = 'none'; return; }
  const idleLimitMs = getClientIdleLimitMinutes() * 60000;
  const warningMs = SESSION_IDLE_WARNING_MINUTES * 60000;
  const idleFor = Date.now() - lastSecurityUserActivityAt;
  const el = ensureSessionIdleWarning();
  if (idleFor >= Math.max(0, idleLimitMs - warningMs) && idleFor < idleLimitMs) {
    const remain = Math.max(1, Math.ceil((idleLimitMs - idleFor) / 60000));
    el.querySelector('#session-idle-warning-text').textContent = (translations[currentLang].session_idle_warning || '').replace('{minutes}', remain);
    el.querySelector('#session-idle-warning-btn').textContent = currentLang === 'en' ? 'Stay Logged In' : 'Tetap Login';
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}
setInterval(updateSessionIdleWarning, 30000);

async function rotateStoredSession(storagePrefix, tokenKey, expiresKey, sessionKey, rotationStateKey) {
  const token = (localStorage.getItem(tokenKey) || '').trim();
  if (!token) return false;
  try {
    const response = await fetch(GOOGLE_SCRIPT_READ_URL, {
      method: 'POST',
      body: new URLSearchParams({ action: 'rotateSession', sessionToken: token })
    });
    const result = await response.json();
    if (!result.success || !result.token) {
      const msg = String(result && result.message || '').toLowerCase();
      if (msg.includes('tidak valid') || msg.includes('tidak aktif') || msg.includes('expired') || msg.includes('kedaluwarsa') || msg.includes('session tidak ditemukan')) {
        // A failed request may carry a stale token while another tab/request
        // has already rotated and stored a newer one. Never clear that token.
        if ((localStorage.getItem(tokenKey) || '').trim() === token) {
          [tokenKey, expiresKey, sessionKey].forEach(function(key) { localStorage.removeItem(key); });
        }
        if (storagePrefix === 'member') renderMemberSessionAvatar();
        if (storagePrefix === 'developer') updateDeveloperAccessUI();
      }
      return false;
    }
    localStorage.setItem(tokenKey, result.token);
    if (result.session_id) localStorage.setItem(sessionKey, result.session_id);
    if (result.expires_at) localStorage.setItem(expiresKey, result.expires_at);
    if (storagePrefix === 'member') renderMemberSessionAvatar();
    if (storagePrefix === 'developer') updateDeveloperAccessUI();
    // BUGFIX (22 Agu): baris lama "window[rotationStateKey] = Date.now();" menulis ke
    // properti window BARU yang tidak nyambung ke variabel `let lastMemberTokenRotationAt`/
    // `let lastDeveloperTokenRotationAt` di atas (deklarasi `let` di scope script TIDAK
    // otomatis jadi properti window, beda dgn `var`) -- akibatnya penanda "kapan terakhir
    // dirotasi" TIDAK PERNAH ter-update, gerbang 15 menit jadi selalu lolos begitu tab
    // kembali fokus (visibilitychange), menyebabkan rotasi berulang tiap 30-90 detik
    // alih-alih tiap 15 menit sekali. Perbaikan: tulis LANGSUNG ke variabel lexical yang
    // sesuai (bukan lewat window[...] bracket) supaya benar-benar terbaca oleh
    // rotateActiveSecurityTokens() di atas.
    if (rotationStateKey === 'lastMemberTokenRotationAt') lastMemberTokenRotationAt = Date.now();
    else if (rotationStateKey === 'lastDeveloperTokenRotationAt') lastDeveloperTokenRotationAt = Date.now();
    return true;
  } catch (error) {
    // Network failure bukan alasan untuk menghapus session; request berikutnya tetap memakai token terakhir.
    console.warn('Token rotation skipped:', error);
    return false;
  }
}

function queueMemberSessionOperation(task) {
  const run = memberSessionOperationChain.then(task, task);
  memberSessionOperationChain = run.catch(function () {});
  return run;
}

// SECURITY 90V.2.54: prevent stale validation responses from kicking a newly
// logged-in member. Every validation is bound to the exact token it checked.
// If login/rotation replaces the token while an older validation is still in
// flight, that older response MUST NOT clear the new session.
async function refreshMemberSecuritySession() {
  return queueMemberSessionOperation(async function() {
    const token = (localStorage.getItem('mine_member_token') || '').trim();
    if (!token) { renderMemberSessionAvatar(); return false; }

    const validationSeq = ++memberSessionValidationSeq;
    try {
      const response = await fetch(GOOGLE_SCRIPT_READ_URL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'validateSession', sessionToken: token, touch: '0' })
      });
      const result = await response.json();

      // Ignore stale/out-of-order responses. Only the latest validation for the
      // same token may change the local member-session state.
      const currentToken = (localStorage.getItem('mine_member_token') || '').trim();
      if (validationSeq !== memberSessionValidationSeq || currentToken !== token) {
        return currentToken === token;
      }

      if (!result.success) {
        // v90.2.63: hanya logout lokal bila server memberi bukti eksplisit bahwa
        // session memang invalid/expired/revoked. Error response umum tidak boleh
        // menghapus session karena dapat berupa transient/network/backend failure.
        const msg = String(result && result.message || '').toLowerCase();
        const explicitInvalid = [
          'session tidak ditemukan',
          'token session tidak valid',
          'session tidak valid',
          'session tidak aktif',
          'session sudah berakhir',
          'session expired',
          'session sudah expired',
          'user tidak aktif',
          'credential tidak ditemukan',
          'credential tidak aktif',
          'role session sudah berubah'
        ].some(function(marker) { return msg.indexOf(marker) >= 0; });
        if (explicitInvalid) {
          [
            'mine_member_token', 'mine_member_session_id', 'mine_member_expires_at', 'mine_member_user_id',
            'mine_member_login_id', 'mine_member_role_id', 'mine_member_user_name',
            'mine_member_avatar_url', 'mine_member_must_change_pin'
          ].forEach(key => localStorage.removeItem(key));
          renderMemberSessionAvatar();
          return false;
        }
        console.warn('Member session validation returned a non-explicit failure; preserving local session:', result.message || result);
        return true;
      }
      return true;
    } catch (error) {
      // Jangan logout lokal hanya karena jaringan sementara gagal. Server tetap menjadi
      // sumber kebenaran pada request berikutnya.
      console.warn('Member session validation skipped:', error);
      return true;
    }
  });
}

// BARU (27 Agu): ACTIVE USER SESSION INDICATOR -- Developer melihat session Member +
// Supervisor yang sedang aktif. Diadaptasi dari kiriman pihak lain (v90.2.105), diaudit
// dan disambungkan ulang IDnya supaya tidak bentrok dengan avatar-diri (#member-session-*)
// yang sudah ada. Server-authoritative sepenuhnya -- TIDAK pernah menyuntik sesi lokal
// browser ini ke daftar (beda dari avatar-diri di atas yang baca localStorage sendiri).
let activeMemberSessions = [];
let activeMemberIndicatorRequestSeq = 0;

function renderActiveSessionsIndicator(sessionsOverride) {
 const wrap = document.getElementById('active-sessions-indicator-wrap');
 const list = document.getElementById('active-sessions-avatar-list');
 if (!wrap || !list) return;

 if (Array.isArray(sessionsOverride)) activeMemberSessions = sessionsOverride.slice();
 let sessions = Array.isArray(activeMemberSessions) ? activeMemberSessions.slice() : [];

 const seen = new Set();
 sessions = sessions.filter(function(item) {
  const sid = String(item.session_id || '').trim();
  if (!sid || seen.has(sid)) return false;
  seen.add(sid);
  return true;
 });
 activeMemberSessions = sessions;

 list.innerHTML = '';
 if (!sessions.length) {
  wrap.classList.add('hidden');
  return;
 }

 wrap.classList.remove('hidden');

 sessions.forEach(function(session) {
  const name = String(session.user_name || session.login_id || session.user_id || 'Member').trim();
  const loginId = String(session.login_id || session.user_id || '').trim();
  const avatarUrl = String(session.avatar_url || '').trim();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'active-member-avatar';
  btn.title = (currentLang === 'en' ? 'Active user: ' : 'User aktif: ') + name + (loginId ? ' (' + loginId + ')' : '');
  btn.setAttribute('aria-label', btn.title);
  if (avatarUrl) {
   const img = document.createElement('img');
   img.src = avatarUrl;
   img.alt = name;
   img.onerror = function() { this.replaceWith(document.createTextNode(memberInitials(name, loginId))); };
   btn.appendChild(img);
  } else {
   btn.textContent = memberInitials(name, loginId);
  }
  list.appendChild(btn);
 });
}

async function loadActiveMemberSessions() {
 const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
 if (!devToken) {
  activeMemberSessions = [];
  renderActiveSessionsIndicator([]);
  return false;
 }
 const requestSeq = ++activeMemberIndicatorRequestSeq;
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: new URLSearchParams({ action: 'getActiveMemberSessions', sessionToken: devToken }) }, 15000);
  const result = await response.json();
  if (requestSeq !== activeMemberIndicatorRequestSeq) return false;
  if (!result || !result.success) {
   console.warn('Active Member indicator skipped:', result && result.message ? result.message : result);
   activeMemberSessions = [];
   renderActiveSessionsIndicator([]);
   return false;
  }
  renderActiveSessionsIndicator(result.sessions || []);
  return true;
 } catch (error) {
  if (requestSeq !== activeMemberIndicatorRequestSeq) return false;
  console.warn('Active Member indicator request failed:', error);
  activeMemberSessions = [];
  renderActiveSessionsIndicator([]);
  return false;
 }
}

function toggleMemberSessionMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('member-session-menu');
  if (!menu) return;
  menu.classList.toggle('hidden');
  if (!menu.classList.contains('hidden') && window.lucide && typeof window.lucide.createIcons === 'function') {
   window.lucide.createIcons();
  }
}

async function logoutMemberSession(event) {
  if (event) event.stopPropagation();
  const token = (localStorage.getItem('mine_member_token') || '').trim();
  const menu = document.getElementById('member-session-menu');
  if (menu) menu.classList.add('hidden');

  // Best-effort server logout. Bila endpoint tidak merespons, session lokal tetap
  // dibersihkan agar avatar langsung hilang dan member benar-benar keluar dari browser ini.
  if (token) {
   try {
    await fetch(GOOGLE_SCRIPT_READ_URL, {
     method: 'POST',
     body: new URLSearchParams({ action: 'logoutSession', sessionToken: token })
    });
   } catch (error) {
    console.warn('Member server logout skipped:', error);
   }
  }

  [
   'mine_member_token',
   'mine_member_session_id',
   'mine_member_user_id',
   'mine_member_login_id',
   'mine_member_role_id',
   'mine_member_user_name',
   'mine_member_avatar_url',
   'mine_member_must_change_pin'
  ].forEach(key => localStorage.removeItem(key));

  renderMemberSessionAvatar();
  // v90.2.104: sama seperti login, refresh tombol role-gated setelah logout supaya
  // tombol yang tadinya muncul (mis. Update Tujuan utk Supervisor) ikut disembunyikan.
  updateDeveloperAccessUI();
  await loadMembersFromSheet();
}

 // SECURITY HARDENING 90V.2.16: client-side login request throttle.
 // Server-side rate-limit tetap menjadi pengaman utama; throttle lokal hanya mencegah
 // browser melakukan request berulang terlalu cepat dari halaman yang sama.
 const MEMBER_LOGIN_RATE_LIMIT = 5;
 const MEMBER_LOGIN_RATE_WINDOW_MS = 60 * 1000;
 function memberLoginThrottleKey(loginId, email) {
  return 'mine_member_login_attempts_' + sha256Local((loginId + '|' + email).toLowerCase());
 }
 function sha256Local(text) {
  // Fallback ringan untuk key lokal; tidak digunakan untuk autentikasi/token.
  var h = 2166136261;
  for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
 }
 function checkMemberLoginLocalRateLimit(loginId, email) {
  try {
   var key = memberLoginThrottleKey(loginId, email);
   var now = Date.now();
   var arr = JSON.parse(localStorage.getItem(key) || '[]').filter(function(t){ return now - t < MEMBER_LOGIN_RATE_WINDOW_MS; });
   if (arr.length >= MEMBER_LOGIN_RATE_LIMIT) {
    var retryMs = MEMBER_LOGIN_RATE_WINDOW_MS - (now - arr[0]);
    return {allowed:false, retrySeconds:Math.max(1, Math.ceil(retryMs / 1000))};
   }
   arr.push(now);
   localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {}
  return {allowed:true, retrySeconds:0};
 }

 let memberLoginCountdownTimer = null;
 let memberLoginCountdownUntil = 0;
 function memberLoginCountdownStorageKey(loginId, email) { return 'mine_member_login_lock_until_' + sha256Local(memberLoginThrottleKey(loginId, email)); }
 function formatMemberCountdown(totalSec) { totalSec=Math.max(0,parseInt(totalSec,10)||0); return String(Math.floor(totalSec/60)).padStart(2,'0')+':'+String(totalSec%60).padStart(2,'0'); }
 function stopMemberLoginCountdown() { if(memberLoginCountdownTimer) clearInterval(memberLoginCountdownTimer); memberLoginCountdownTimer=null; memberLoginCountdownUntil=0; var b=document.getElementById('member-login-submit'); if(b){b.disabled=false;b.classList.remove('opacity-60','cursor-wait');} }
 function startMemberLoginCountdown(seconds,message) {
  seconds=Math.max(1,parseInt(seconds,10)||1); var li=document.getElementById('member-login-id-input'), em=document.getElementById('member-login-email-input'); var loginId=(li?li.value:'').trim(), email=(em?em.value:'').trim(); memberLoginCountdownUntil=Date.now()+seconds*1000;
  try{localStorage.setItem(memberLoginCountdownStorageKey(loginId,email),String(memberLoginCountdownUntil));}catch(e){}
  if(memberLoginCountdownTimer)clearInterval(memberLoginCountdownTimer); var b=document.getElementById('member-login-submit'); if(b){b.disabled=true;b.classList.add('opacity-60','cursor-wait');}
  function tick(){var remain=Math.max(0,Math.ceil((memberLoginCountdownUntil-Date.now())/1000)); if(remain<=0){try{localStorage.removeItem(memberLoginCountdownStorageKey(loginId,email));}catch(e){} stopMemberLoginCountdown(); setMemberLoginStatus(currentLang === 'en' ? 'Lockout finished. Please try logging in again.' : 'Lockout selesai. Silakan coba login kembali.',false); return;} setMemberLoginStatus((message||'Login sementara dikunci.')+' | Coba lagi dalam '+formatMemberCountdown(remain),false);}
  tick(); memberLoginCountdownTimer=setInterval(tick,250);
 }
 function resumeMemberLoginCountdown(){
  var li=document.getElementById('member-login-id-input'), em=document.getElementById('member-login-email-input'); var loginId=(li?li.value:'').trim(), email=(em?em.value:'').trim(); if(!loginId||!email)return false;
  try{var until=parseInt(localStorage.getItem(memberLoginCountdownStorageKey(loginId,email))||'0',10)||0; if(until>Date.now()){memberLoginCountdownUntil=until; startMemberLoginCountdown(Math.ceil((until-Date.now())/1000), currentLang === 'en' ? 'Too many login attempts.' : 'Terlalu banyak percobaan login.'); return true;} localStorage.removeItem(memberLoginCountdownStorageKey(loginId,email));}catch(e){} return false;
 }

 let memberLoginInFlight = false;

 async function submitMemberLogin(event) {
  event.preventDefault();
  if (memberLoginInFlight) return;
  const loginInput = document.getElementById('member-login-id-input');
  const emailInput = document.getElementById('member-login-email-input');
  const pinInput = document.getElementById('member-login-pin-input');
  const submitBtn = document.getElementById('member-login-submit');
  const login_id = (loginInput ? loginInput.value : '').trim();
  const email = (emailInput ? emailInput.value : '').trim();
  const pin = (pinInput ? pinInput.value : '').replace(/\D/g, '').slice(0, 6);
  if (pinInput && pinInput.value !== pin) pinInput.value = pin;

  if (!login_id || !email || !/^[0-9]{6}$/.test(pin)) {
   setMemberLoginStatus(currentLang === 'en' ? 'Login_ID, registered email, and 6-digit PIN are required.' : 'Login_ID, email terdaftar, dan PIN 6 digit wajib diisi.', false);
   return;
  }

  if (resumeMemberLoginCountdown()) return;
  const localRate = checkMemberLoginLocalRateLimit(login_id, email);
  if (!localRate.allowed) {
   startMemberLoginCountdown(localRate.retrySeconds, currentLang === 'en' ? 'Too many login attempts.' : 'Terlalu banyak percobaan login.');
   return;
  }

  memberLoginInFlight = true;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-60', 'cursor-wait'); }
  setLoginButtonLoading('member-login-submit','member-login-spinner',true,'member-login-submit-label',currentLang === 'en' ? 'Checking...' : 'Memeriksa...');
  setMemberLoginStatus(currentLang === 'en' ? 'Checking member account...' : 'Memeriksa akun member...', true);

  try {
   const payload = new URLSearchParams({
    action: 'verifyMemberPin',
    login_id: login_id,
    email: email,
    pin: pin,
    client_info: navigator.userAgent.slice(0, 180)
   });
   const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
   const result = await response.json();

   if (!result.success || !result.token) {
    if (result.brute_force_blocked) {
     const retry = Math.max(1, parseInt(result.retry_after || 60, 10) || 60);
     startMemberLoginCountdown(retry, currentLang === 'en' ? 'Too many failed attempts detected.' : 'Terlalu banyak percobaan gagal terdeteksi.');
    } else if (result.rate_limited) {
     const retry = Math.max(1, parseInt(result.retry_after || 60, 10) || 60);
     startMemberLoginCountdown(retry, currentLang === 'en' ? 'Too many login attempts.' : 'Terlalu banyak percobaan login.');
    } else if (result.locked && result.retry_after) {
     startMemberLoginCountdown(Math.max(1, parseInt(result.retry_after, 10) || 1), currentLang === 'en' ? 'Credential is locked.' : 'Credential sedang terkunci.');
    } else {
     setMemberLoginStatus(result.message || (currentLang === 'en' ? 'Member login failed.' : 'Login member gagal.'), false);
    }
    return;
   }

   localStorage.setItem('mine_member_token', result.token);
   localStorage.setItem('mine_member_session_id', result.session_id || '');
   localStorage.setItem('mine_member_expires_at', result.expires_at || '');
   localStorage.setItem('mine_member_user_id', result.user_id || '');
   localStorage.setItem('mine_member_login_id', result.login_id || login_id);
   localStorage.setItem('mine_member_role_id', result.role_id || '');
   localStorage.setItem('mine_member_user_name', result.user_name || '');
   localStorage.setItem('mine_member_avatar_url', result.avatar_url || result.photo_url || result.avatar || '');
   localStorage.setItem('mine_member_must_change_pin', result.must_change_pin ? '1' : '0');

   renderMemberSessionAvatar();
   // v90.2.104: refresh tombol role-gated (Catat RCA, Update Tujuan, dst) segera setelah
   // login Member/Supervisor -- sebelumnya baru muncul setelah reload halaman karena
   // updateDeveloperAccessUI() tidak pernah dipanggil di sini.
   updateDeveloperAccessUI();
   setMemberLoginStatus((currentLang === 'en' ? 'Logged in as ' : 'Login berhasil sebagai ') + (result.user_name || result.login_id || login_id) + '.', true);
   // v90.2.63: jangan menahan penyelesaian login menunggu pembacaan ulang seluruh
   // daftar Member. Session sudah tersimpan dan UI utama dapat langsung dipakai;
   // refresh grid berjalan asinkron di belakang.
   loadMembersFromSheet().catch(function(err) { console.warn('Refresh Member grid setelah login ditunda/gagal:', err); });
   if (pinInput) pinInput.value = '';
   setTimeout(() => closeMemberLoginModal(), 700);
  } catch (error) {
   console.error('Error login member:', error);
   setMemberLoginStatus(currentLang === 'en' ? 'Could not reach server. Try again.' : 'Tidak bisa menghubungi server. Coba lagi.', false);
  } finally {
   setLoginButtonLoading('member-login-submit','member-login-spinner',false,'member-login-submit-label');
   memberLoginInFlight = false;
   // Jangan menghidupkan kembali tombol bila countdown server/local masih aktif.
   // Sebelumnya finally selalu meng-enable tombol, sehingga saat rate-limit/lockout
   // tombol tampak bisa diklik padahal request berikutnya langsung ditolak oleh countdown.
   const countdownActive = memberLoginCountdownUntil > Date.now();
   if (submitBtn && !countdownActive) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-60', 'cursor-wait');
   }
  }
 }

 // Nomor versi dashboard -- dinaikkan setiap ada revisi baru dari Claude.
 const APP_VERSION = 'v90.2.100';

 function openDeveloperProfileModal() {
 const modal = document.getElementById('developer-profile-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeDeveloperProfileModal() {
 const modal = document.getElementById('developer-profile-modal');
 hideModalAnimated(modal);
 }

 // SECURITY 90V: Developer-only Credential Provisioning.
// Tujuan: membuat Credential untuk User yang SUDAH ADA tetapi belum punya Credential.
// Tidak membuat User/Member baru dan tidak mengubah Role/Permission.
async function submitResetMemberPin() {
 const elUserId = document.getElementById('reset-member-pin-userid');
 const elPin = document.getElementById('reset-member-pin-new');
 const elConfirm = document.getElementById('reset-member-pin-confirm');
 const elStatus = document.getElementById('reset-member-pin-status');
 if (!elUserId || !elPin || !elConfirm || !elStatus) return;
 const userId = elUserId.value.trim();
 const pin = elPin.value.trim();
 const confirmPin = elConfirm.value.trim();
 function setStatus(msg, ok) {
  elStatus.textContent = msg;
  elStatus.className = 'text-[10px] font-medium mt-2 ' + (ok ? 'text-emerald-400' : 'text-rose-400');
 }
 if (!userId) { setStatus(currentLang === 'en' ? 'User_ID is required.' : 'User_ID wajib diisi.', false); return; }
 if (!/^[0-9]{6}$/.test(pin)) { setStatus(currentLang === 'en' ? 'PIN must be 6 digits.' : 'PIN harus 6 digit angka.', false); return; }
 if (pin !== confirmPin) { setStatus(currentLang === 'en' ? 'PIN confirmation does not match.' : 'Ulangi PIN tidak cocok.', false); return; }
 setStatus(currentLang === 'en' ? 'Saving...' : 'Menyimpan...', true);
 try {
  const result = await postCentralAuthenticated({ action: 'setMemberPin', user_id: userId, pin: pin }, { developerOnly: true });
  if (result.success) {
   setStatus((currentLang === 'en' ? 'PIN saved for ' : 'PIN tersimpan utk ') + userId + '.', true);
   elPin.value = ''; elConfirm.value = '';
  } else {
   setStatus(result.message || (currentLang === 'en' ? 'Failed to save PIN.' : 'Gagal menyimpan PIN.'), false);
  }
 } catch (err) {
  setStatus((currentLang === 'en' ? 'Server error: ' : 'Error server: ') + (err && err.message ? err.message : String(err)), false);
 }
}

// ==== BARU (28 Agu): Panel Approval KPIEvent -- muat daftar PENDING, Approve/Reject
// langsung kirim ke action approveKpiEvent. Pengaju yang sama TIDAK BOLEH approve
// pengajuannya sendiri -- backend sudah menolak ini, di sini kita cuma tampilkan pesannya.
 function renderChangelogEntries() {
 const latestEl = document.getElementById('changelog-latest');
 const olderEl = document.getElementById('changelog-older-versions');
 if (!latestEl || !olderEl || !CHANGELOG_DATA.length) return;

 const renderItems = (items) => items.map(it => `<div class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">✅</span> ${(currentLang === 'en' ? it.en : it.id)}</div>`).join('');
 const getVersionLabel = (v) => (typeof v === 'object' ? (currentLang === 'en' ? v.en : v.id) : v);

 const latest = CHANGELOG_DATA[0];
 latestEl.innerHTML = `<div class="text-blue-400 font-bold text-[11px] uppercase tracking-wider mb-2">${getVersionLabel(latest.version)}</div><div class="space-y-2">${renderItems(latest.items)}</div>`;

 olderEl.innerHTML = CHANGELOG_DATA.slice(1).map(entry => `<div class="border-t border-slate-700/50 pt-3"><div class="text-slate-500 font-bold text-[11px] uppercase tracking-wider mb-2">${getVersionLabel(entry.version)}</div><div class="space-y-2">${renderItems(entry.items)}</div></div>`).join('');
 }
 // Auto-sync versi terbaru ke sheet "Changelog" -- dipicu diam-diam tiap modal Riwayat
 // Update dibuka (bukan nunggu klik manual). Cuma jalan kalau Developer sudah unlock
 // (butuh devToken buat POST), dan cuma kirim kalau versi ini BELUM ada di sheet (dicek
 // dulu lewat GET, supaya tidak dobel-catat tiap kali modal dibuka berulang).
 async function autoSyncLatestChangelogToSheet() {
 if (!isDeveloperUnlocked()) return;
 try {
  const latest = CHANGELOG_DATA[0];
  if (!latest) return;
  const latestVersion = typeof latest.version === 'object' ? latest.version.id : latest.version;

  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=changelog&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') return;

  const alreadySynced = (result.data || []).some(v => v.version === latestVersion);
  if (alreadySynced) return;

  const itemsPayload = latest.items.map(it => ({ id: it.id, en: it.en }));
  const payload = buildAuthenticatedPayload({
  action: 'addChangelogEntry',
  version: latestVersion,
  items_json: JSON.stringify(itemsPayload)
  }, { developerOnly: true });
  const syncResponse = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const syncResult = await syncResponse.json();
  if (syncResult.status === 'success') {
  console.log('Changelog versi', latestVersion, 'berhasil disinkron otomatis ke Sheets.');
  }
 } catch (err) {
  console.error('Auto-sync changelog gagal (akan dicoba lagi lain kali modal dibuka):', err);
 }
 }

 function openChangelogModal() {
 document.getElementById('app-version-label').innerText = APP_VERSION;
 document.getElementById('app-version-label-modal').innerText = APP_VERSION;
 renderChangelogEntries();
 const modal = document.getElementById('changelog-modal');
 showModalAnimated(modal);
 // Selalu mulai dari kondisi tertutup (hanya versi terbaru) tiap modal dibuka ulang
 const olderVersions = document.getElementById('changelog-older-versions');
 const toggleBtn = document.getElementById('btn-toggle-changelog-history');
 if (olderVersions) olderVersions.classList.add('hidden');
 if (toggleBtn) toggleBtn.querySelector('span').innerText = (currentLang === 'en') ? 'View All History' : 'Lihat Semua Riwayat';
 lucide.createIcons();
 autoSyncLatestChangelogToSheet(); // fire-and-forget, tidak menunda modal terbuka
 }

 function closeChangelogModal() {
 const modal = document.getElementById('changelog-modal');
 hideModalAnimated(modal);
 }

 let changelogFullHistoryLoaded = false;

 async function toggleChangelogHistory() {
 const olderVersions = document.getElementById('changelog-older-versions');
 const toggleBtn = document.getElementById('btn-toggle-changelog-history');
 const icon = toggleBtn.querySelector('[data-lucide]');
 const label = toggleBtn.querySelector('span');
 const isHidden = olderVersions.classList.contains('hidden');

 if (isHidden) {
  olderVersions.classList.remove('hidden');
  label.innerText = (currentLang === 'en') ? 'Hide Older History' : 'Sembunyikan Riwayat Lama';
  icon.setAttribute('data-lucide', 'chevron-up');
  lucide.createIcons();

  // Versi terbaru (3 terakhir) sudah tampil instan dari CHANGELOG_DATA lokal (tanpa fetch).
  // Riwayat lebih lama dari itu cuma ada di sheet "Changelog" -- fetch sekali saja saat
  // pertama kali dibuka (bukan tiap buka-tutup), tambahkan di BAWAH yang sudah ada.
  if (!changelogFullHistoryLoaded) {
   changelogFullHistoryLoaded = true; // set duluan, cegah fetch dobel kalau diklik cepat
   const loadingId = 'changelog-sheet-loading-indicator';
   olderVersions.insertAdjacentHTML('beforeend', `<p id="${loadingId}" class="text-[11px] text-slate-500 font-medium text-center py-2">${currentLang === 'en' ? 'Loading full history...' : 'Memuat riwayat lengkap...'}</p>`);

   try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=changelog&t=' + new Date().getTime());
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load history.' : 'Gagal memuat riwayat'));

    // Buang versi yang sudah tampil dari CHANGELOG_DATA lokal, biar tidak dobel.
    const localVersions = new Set(CHANGELOG_DATA.map(v => (typeof v.version === 'object' ? v.version.id : v.version)));
    const olderFromSheet = (result.data || []).filter(v => !localVersions.has(v.version));

    const loadingEl = document.getElementById(loadingId);
    if (olderFromSheet.length === 0) {
     if (loadingEl) loadingEl.innerText = currentLang === 'en' ? 'No older history yet.' : 'Belum ada riwayat lebih lama.';
    } else {
     const renderItems = (items) => items.map(it => `<div class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">✅</span> ${(currentLang === 'en' ? it.en : it.id) || it.id}</div>`).join('');
     const html = olderFromSheet.map(entry => `<div class="border-t border-slate-700/50 pt-3"><div class="text-slate-500 font-bold text-[11px] uppercase tracking-wider mb-2">${entry.version}</div><div class="space-y-2">${renderItems(entry.items)}</div></div>`).join('');
     if (loadingEl) loadingEl.outerHTML = html;
    }
   } catch (err) {
    console.error('Gagal memuat riwayat changelog lengkap:', err);
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
     loadingEl.className = 'text-[11px] text-rose-400 font-medium text-center py-2';
     loadingEl.innerText = currentLang === 'en' ? 'Failed to load full history.' : 'Gagal memuat riwayat lengkap.';
    }
    changelogFullHistoryLoaded = false; // izinkan coba lagi kalau ditutup-buka ulang
   }
  }
 } else {
  olderVersions.classList.add('hidden');
  label.innerText = (currentLang === 'en') ? 'View All History' : 'Lihat Semua Riwayat';
  icon.setAttribute('data-lucide', 'chevron-down');
 }
 lucide.createIcons();
 }

 let currentOpenDiggingRow = null;
 let domePickerListCache = []; // hasil fetch domestock terakhir, dipakai ulang tanpa fetch ulang tiap ganti Tujuan

 function closeTujuanHistoryModal() {
 const modal = document.getElementById('tujuan-history-modal');
 hideModalAnimated(modal);
 }

 async function openTujuanHistoryModal() {
 const row = currentOpenDiggingRow;
 if (!row) return;

 document.getElementById('tujuan-history-subtitle').innerText = `ID Sampel: ${row.idSampel}`;
 const bodyEl = document.getElementById('tujuan-history-body');
 bodyEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'Loading history...' : 'Memuat riwayat...'}</p>`;

 const modal = document.getElementById('tujuan-history-modal');
 showModalAnimated(modal);
 lucide.createIcons();

 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=tujuanchangelog&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load Destination history.' : 'Gagal memuat riwayat Tujuan'));

  const logsForRow = (result.data || []).filter(l => (l.id_sampel || '').toString().trim() === row.idSampel);
  if (logsForRow.length === 0) {
  bodyEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'No destination changes recorded yet for this row.' : 'Belum ada perubahan Tujuan tercatat untuk baris ini.'}</p>`;
  return;
  }

  bodyEl.innerHTML = logsForRow.map(l => `
  <div class="bg-slate-900/40 border border-slate-700/60 rounded-xl p-3">
   <div class="flex items-center justify-between mb-1.5">
   <span class="text-[11px] text-slate-400 font-medium">${l.tanggal || '-'}</span>
   <span class="text-[11px] font-semibold text-amber-400">PIC: ${l.pic || '-'}</span>
   </div>
   <div class="text-xs text-title font-semibold mb-1">
   ${l.tujuan_lama || '-'} <i data-lucide="arrow-right" class="w-3 h-3 inline-block mx-1"></i> ${l.tujuan_baru || '-'}
   </div>
   ${(l.id_efo_lama || l.id_efo_baru) ? `<p class="text-[11px] text-slate-400">ID EFO: ${l.id_efo_lama || '-'} <i data-lucide="arrow-right" class="w-2.5 h-2.5 inline-block mx-1"></i> ${l.id_efo_baru || '-'}</p>` : ''}
   ${(l.id_eto_lama || l.id_eto_baru) ? `<p class="text-[11px] text-slate-400">ID ETO: ${l.id_eto_lama || '-'} <i data-lucide="arrow-right" class="w-2.5 h-2.5 inline-block mx-1"></i> ${l.id_eto_baru || '-'}</p>` : ''}
   ${l.keterangan ? `<p class="text-[11px] text-slate-500 mt-1">${l.keterangan}</p>` : ''}
  </div>
  `).join('');
  lucide.createIcons();
 } catch (err) {
  console.error('Gagal memuat riwayat Tujuan:', err);
  const isTimeout = err.name === 'AbortError';
  bodyEl.innerHTML = `<p class="text-[11px] text-rose-400 font-medium">${isTimeout ? (currentLang === 'en' ? 'Server not responding (timeout).' : 'Server tidak merespons (timeout).') : (currentLang === 'en' ? 'Failed to load Destination history.' : 'Gagal memuat riwayat Tujuan.')}</p>`;
 }
 }

 function openUpdateTujuanModal() {
 const row = currentOpenDiggingRow;
 if (!row) return;

 if (!canAssignDome()) {
  showNoticeModal(
  currentLang === 'en' ? 'Locked' : 'Terkunci',
  currentLang === 'en' ? 'Log in as Developer or Supervisor first to update Destination & Dome assignment.' : 'Login sebagai Developer atau Supervisor terlebih dahulu untuk mengubah Tujuan & assign Dome.'
  );
  return;
 }

 if (!row.idSampel || row.idSampel === '-') {
  showNoticeModal(
  currentLang === 'en' ? 'No Sample ID' : 'ID Sampel Kosong',
  currentLang === 'en' ? 'This record has no ID Sampel, so it cannot be reliably tracked or updated. Please fill in the ID Sampel first when reporting.' : 'Baris ini tidak punya ID Sampel, jadi tidak bisa dilacak/diupdate dengan aman. Mohon isi ID Sampel dulu saat pelaporan.'
  );
  return;
 }

 document.getElementById('update-tujuan-subtitle').innerText = `${row.tanggal} -- ${row.pit} / ${row.blok}`;
 document.getElementById('update-tujuan-id-sampel').value = row.idSampel;
 document.getElementById('update-tujuan-row-ni').value = (row.ni && row.ni !== '-') ? row.ni + '%' : '-';
 // Baris lama kadang punya nilai Tujuan yang sekarang cuma opsi tunggal (EFO/ETO/Direct/Disposal)
 // -- opsi gabungan/Tongkang tidak bisa dipulihkan otomatis dari data lama, biarkan kosong.
 const oldTujuan = (row.tujuan && row.tujuan !== '-') ? row.tujuan : '';
 const validSingleValues = ['Direct', 'Disposal', 'ETO', 'EFO'];
 document.getElementById('update-tujuan-select').value = validSingleValues.includes(oldTujuan) ? oldTujuan : '';
 document.getElementById('update-tujuan-keterangan').value = (row.keterangan && row.keterangan !== '-') ? row.keterangan : '';
 document.getElementById('update-new-dome-form').classList.add('hidden');
 document.getElementById('new-dome-id-input').value = '';
 document.getElementById('new-dome-kapasitas-input').value = '';
 populateNameOptions(document.getElementById('update-tujuan-pic'));
 domePickerListCache = []; // paksa ambil ulang stok Dome terkini tiap popup dibuka
 onTujuanKombinasiChange();
 document.getElementById('update-tujuan-status-msg').classList.add('hidden');

 const modal = document.getElementById('update-tujuan-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeUpdateTujuanModal() {
 const modal = document.getElementById('update-tujuan-modal');
 hideModalAnimated(modal);
 }

 // ==== Alur terpadu Tujuan: 1 dropdown, 8 opsi (Direct, Disposal, ETO, EFO, Tongkang,
 // dan 3 kombinasi split ETO+EFO / ETO+Tongkang / EFO+Tongkang). Direct/Disposal tidak
 // terkait Dome sama sekali (perilaku lama, tidak berubah). ETO/EFO/Tongkang -- baik
 // sendirian maupun kombinasi split -- semuanya lewat mekanisme "portion" yang sama,
 // supaya 1 baris digging bisa dipecah ke lebih dari 1 tujuan (kasus nyata: sebagian
 // muat ke Dome yang keburu penuh, sisanya nunggu jadwal tongkang berikutnya). ====

 function onTujuanKombinasiChange() {
 const val = document.getElementById('update-tujuan-select').value;
 const portionsWrapper = document.getElementById('update-portions-wrapper');
 const portionA = document.getElementById('update-split-portion-a');
 const portionB = document.getElementById('update-split-portion-b');

 document.getElementById('split-a-tonase').value = '';
 document.getElementById('split-b-tonase').value = '';
 document.getElementById('split-a-catatan').value = '';
 document.getElementById('split-b-catatan').value = '';
 document.getElementById('update-new-dome-form').classList.add('hidden');
 document.getElementById('update-split-total-info').innerText = '';

 const domeAreas = ['ETO', 'EFO', 'TONGKANG'];
 const isDomeRelated = domeAreas.includes(val) || val.includes('_');

 portionsWrapper.classList.toggle('hidden', !isDomeRelated);
 document.getElementById('btn-toggle-new-dome').classList.toggle('hidden', !isDomeRelated);

 if (!isDomeRelated) {
  portionA.classList.add('hidden');
  portionB.classList.add('hidden');
  return;
 }

 if (val.includes('_')) {
  const [areaA, areaB] = val.split('_');
  setupSplitPortion('a', areaA);
  setupSplitPortion('b', areaB);
 } else {
  setupSplitPortion('a', val);
  portionB.classList.add('hidden');
  const row = currentOpenDiggingRow;
  document.getElementById('split-a-tonase').value = row ? row.tonase : '';
 }
 updateSplitTotalInfo();
 refreshNewDomeAreaOptions();
 }

 function setupSplitPortion(prefix, area) {
 const label = document.getElementById(`split-${prefix}-label`);
 const domeSelect = document.getElementById(`split-${prefix}-dome`);
 const catatanInput = document.getElementById(`split-${prefix}-catatan`);
 const isTongkang = (area === 'TONGKANG');

 label.innerText = isTongkang ? (currentLang === 'en' ? 'Barge (no Dome)' : 'Tongkang (tanpa Dome)') : area;
 domeSelect.classList.toggle('hidden', isTongkang);
 catatanInput.classList.toggle('hidden', !isTongkang);
 document.getElementById(`update-split-portion-${prefix}`).classList.remove('hidden');

 if (!isTongkang) {
  loadDomeSelectOptions(domeSelect, area);
 }
 }

 function updateSplitTotalInfo() {
 const infoEl = document.getElementById('update-split-total-info');
 const row = currentOpenDiggingRow;
 if (!row) return;
 const val = document.getElementById('update-tujuan-select').value;
 const isCombo = val.includes('_');

 const tonaseA = parseFloat(document.getElementById('split-a-tonase').value) || 0;
 const tonaseB = isCombo ? (parseFloat(document.getElementById('split-b-tonase').value) || 0) : 0;
 const total = tonaseA + tonaseB;
 const target = row.tonase;
 const selisih = Math.abs(total - target);

 if (selisih < 0.01) {
  infoEl.className = 'text-[11px] font-semibold text-emerald-400';
  infoEl.innerText = (currentLang === 'en' ? 'Total matches: ' : 'Total sudah pas: ') + total.toLocaleString() + ' / ' + target.toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton');
 } else {
  infoEl.className = 'text-[11px] font-semibold text-amber-400';
  infoEl.innerText = (currentLang === 'en' ? 'Total ' : 'Total ') + total.toLocaleString() + ' / ' + target.toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton') + ' (' + (currentLang === 'en' ? 'must match exactly' : 'harus pas persis') + ')';
 }
 }

 async function submitUpdateTujuan() {
 const idSampel = document.getElementById('update-tujuan-id-sampel').value;
 const val = document.getElementById('update-tujuan-select').value;
 const pic = document.getElementById('update-tujuan-pic').value;
 const keteranganUser = document.getElementById('update-tujuan-keterangan').value.trim();
 const submitBtn = document.getElementById('btn-submit-update-tujuan');
 const statusMsg = document.getElementById('update-tujuan-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;
 const row = currentOpenDiggingRow;

 if (!val) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Please select a Destination first.' : 'Pilih Tujuan terlebih dahulu.';
  statusMsg.classList.remove('hidden');
  return;
 }

 // Kasus (1): Direct/Disposal -- tidak terkait Dome sama sekali, perilaku lama.
 if (val === 'Direct' || val === 'Disposal') {
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');
  try {
  const payload = buildAuthenticatedPayload({
   action: 'updateDiggingIds',
   id_sampel: idSampel,
   tujuan: val,
   id_efo: '',
   id_eto: '',
   pic: pic,
   keterangan: keteranganUser
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to update data.' : 'Gagal mengupdate data.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Updated!' : 'Berhasil diupdate!';
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
   closeUpdateTujuanModal();
   closeDiggingDetailModal();
   statusMsg.classList.add('hidden');
   fetchDataFromGoogleSheets(true);
  }, 900);
  } catch (error) {
  console.error('Error updating tujuan:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'An error occurred. Try again.' : 'Terjadi kesalahan. Coba lagi.';
  statusMsg.classList.remove('hidden');
  } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
  }
  return;
 }

 // Kasus (2) & (3): tujuan Dome/Tongkang, tunggal atau split.
 const isCombo = val.includes('_');
 const [areaA, areaB] = isCombo ? val.split('_') : [val, null];
 const tonaseA = parseFloat(document.getElementById('split-a-tonase').value) || 0;
 const tonaseB = isCombo ? (parseFloat(document.getElementById('split-b-tonase').value) || 0) : 0;
 const total = tonaseA + tonaseB;

 if (tonaseA <= 0 || (isCombo && tonaseB <= 0)) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Fill in the tonnage (must be greater than 0).' : 'Isi tonase (harus lebih dari 0).';
  statusMsg.classList.remove('hidden');
  return;
 }

 if (row && Math.abs(total - row.tonase) >= 0.01) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en'
  ? 'Total tonnage must exactly match this row (' + row.tonase.toLocaleString() + ' ton).'
  : 'Total tonase harus pas persis dengan baris ini (' + row.tonase.toLocaleString() + ' ton).';
  statusMsg.classList.remove('hidden');
  return;
 }

 const domeA = document.getElementById('split-a-dome').value;
 const domeB = isCombo ? document.getElementById('split-b-dome').value : '';
 const catatanA = document.getElementById('split-a-catatan').value.trim();
 const catatanB = isCombo ? document.getElementById('split-b-catatan').value.trim() : '';

 if (areaA !== 'TONGKANG' && !domeA) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = (currentLang === 'en' ? 'Please select a Dome for the ' : 'Pilih Dome untuk bagian ') + areaA + (currentLang === 'en' ? ' portion.' : '.');
  statusMsg.classList.remove('hidden');
  return;
 }
 if (isCombo && areaB !== 'TONGKANG' && !domeB) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = (currentLang === 'en' ? 'Please select a Dome for the ' : 'Pilih Dome untuk bagian ') + areaB + (currentLang === 'en' ? ' portion.' : '.');
  statusMsg.classList.remove('hidden');
  return;
 }
 if (!pic) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Please select a PIC first.' : 'Pilih PIC terlebih dahulu.';
  statusMsg.classList.remove('hidden');
  return;
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 const tujuanFinal = isCombo ? 'Split' : areaA;
 const keteranganFinal = isCombo
  ? ('Split: '
   + `${tonaseA.toLocaleString()} ton -> ${areaA}${domeA ? '/' + domeA : ''}${catatanA ? ' (' + catatanA + ')' : ''}`
   + ', '
   + `${tonaseB.toLocaleString()} ton -> ${areaB}${domeB ? '/' + domeB : ''}${catatanB ? ' (' + catatanB + ')' : ''}`
   + (keteranganUser ? ' -- ' + keteranganUser : ''))
  : keteranganUser;

 try {
  const payload = buildAuthenticatedPayload({
  action: 'updateDiggingIds',
  id_sampel: idSampel,
  tujuan: tujuanFinal,
  id_efo: (areaA === 'EFO' ? domeA : (areaB === 'EFO' ? domeB : '')),
  id_eto: (areaA === 'ETO' ? domeA : (areaB === 'ETO' ? domeB : '')),
  pic: pic,
  keterangan: keteranganFinal
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to update data.' : 'Gagal mengupdate data.'));
  }

  const domeCallErrors = [];
  const portions = [{ area: areaA, tonase: tonaseA, dome: domeA, catatan: catatanA }];
  if (isCombo) portions.push({ area: areaB, tonase: tonaseB, dome: domeB, catatan: catatanB });

  for (const p of portions) {
  if (p.area === 'TONGKANG') continue;
  const domePayload = buildAuthenticatedPayload({
   action: 'addDomeTransaction',
    dome_id: p.dome,
   area: p.area,
   jenis: 'Masuk',
   ref_id_sampel: idSampel,
   tonase_transaksi: p.tonase,
   ni_transaksi: row ? cleanNumber(row.ni) : 0,
   pic: pic,
   catatan: p.catatan || keteranganUser
  }, { developerOnly: true });
  const domeResp = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: domePayload });
  const domeResult = await domeResp.json();
  if (domeResult.status !== 'success') {
   domeCallErrors.push(p.area + ': ' + (domeResult.message || 'gagal'));
  }
  }

  if (domeCallErrors.length > 0) {
  console.error('Sebagian transaksi Dome gagal dicatat:', domeCallErrors);
  statusMsg.className = 'text-xs text-amber-400';
  statusMsg.innerText = (currentLang === 'en'
   ? 'Destination updated, but some Dome logs failed: '
   : 'Tujuan berhasil diupdate, tapi sebagian catatan Dome gagal: ') + domeCallErrors.join('; ');
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
   closeUpdateTujuanModal();
   closeDiggingDetailModal();
   statusMsg.classList.add('hidden');
   fetchDataFromGoogleSheets(true);
  }, 3000);
  return;
  }

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Updated!' : 'Berhasil diupdate!';
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
  closeUpdateTujuanModal();
  closeDiggingDetailModal();
  statusMsg.classList.add('hidden');
  fetchDataFromGoogleSheets(true);
  }, 900);
 } catch (error) {
  console.error('Error updating tujuan (dome/split):', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'An error occurred. Try again.' : 'Terjadi kesalahan. Coba lagi.';
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }


 // ============================================================
 // FITUR BARGING (Fase 2) -- pemuatan tongkang/kapal dari Dome ke kapal.
 // LIHAT progress: terbuka untuk semua (tanpa devToken di endpoint GET).
 // INPUT/kelola data: developer-only lewat canManageBarge(), sama pola dengan Dome.
 // ============================================================

 function formatRcaDateTimePart(value, kind) {
  if (value === null || value === undefined || value === '') return '';
  const s = String(value).trim();
  // Backend v90.2.85 should already normalize these values. This fallback also
  // handles legacy Google Sheets JSON where a time-only cell becomes 1899-12-30T...Z.
  if (kind === 'time') {
   const legacyTime = s.match(/^1899-12-30T(\d{2}):(\d{2})(?::(\d{2}))?/i);
   if (legacyTime) return `${legacyTime[1]}:${legacyTime[2]}:${legacyTime[3] || '00'}`;
   const timeMatch = s.match(/(?:T|\s)(\d{2}):(\d{2})(?::(\d{2}))?/);
   if (timeMatch) return `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3] || '00'}`;
   return s;
  }
  if (kind === 'date') {
   const legacyDate = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s)/);
   if (legacyDate) {
    const d = new Date(`${legacyDate[1]}-${legacyDate[2]}-${legacyDate[3]}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g,'-');
   }
   return s;
  }
  return s;
 }

 // BARU (Sidequest #2): Indikator SLA overdue RCA -- "SLA" di sini = Target (tanggal
 // deadline yang dipilih Maker saat submit form RCA, input type="date" di rca-target).
 // Overdue = RCA belum Closed DAN tanggal Target sudah lewat hari ini. Sengaja TIDAK pakai
 // ambang hari tetap (mis. >7 hari sejak dibuat) -- proyek ini sudah punya field Target
 // eksplisit per RCA, jadi lebih akurat memakai deadline yang memang dipilih user sendiri
 // ketimbang menebak ambang generik. RCA tanpa Target sama sekali tidak ditandai overdue
 // (tidak ada dasar SLA utk RCA itu).
 function openPeriodicReportModal() {
 if (!document.getElementById('periodic-report-start').value) {
  setPeriodicReportPreset('week');
 }
 document.getElementById('periodic-report-preview').innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${currentLang === 'en' ? 'Select a period then click Generate to see the report.' : 'Pilih periode lalu klik Generate untuk melihat laporan.'}</p>`;
 document.getElementById('btn-print-periodic-report').classList.add('hidden');
 document.getElementById('btn-print-periodic-report').classList.remove('flex');
 const modal = document.getElementById('periodic-report-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closePeriodicReportModal() {
 hideModalAnimated(document.getElementById('periodic-report-modal'));
 }

 function setPeriodicReportPreset(type) {
 const today = new Date();
 const endStr = today.toISOString().slice(0, 10);
 let start;
 if (type === 'week') {
  const day = today.getDay();
  const diffToMonday = (day === 0) ? 6 : day - 1;
  start = new Date(today);
  start.setDate(today.getDate() - diffToMonday);
 } else {
  start = new Date(today.getFullYear(), today.getMonth(), 1);
 }
 document.getElementById('periodic-report-start').value = start.toISOString().slice(0, 10);
 document.getElementById('periodic-report-end').value = endStr;
 }

 // Fungsi inti -- dipakai bareng oleh preview di layar DAN versi cetak, supaya isinya
 // selalu konsisten (tidak ada 2 logika terpisah yang bisa berbeda sendiri-sendiri).
 // BARU: RCA Log pengelompokan otomatis per Status & Tahap Bermasalah -- dipanggil dari
 // buildPeriodicReportHtml() untuk kasih ringkasan visual sebelum daftar detail (yang masih
 // ditampilkan polos di bawahnya). Dibuat standalone (bukan nested di dalam
 // buildPeriodicReportHtml) supaya bisa dipanggil langsung dari template string ${...}.
 // Sumber data RCA sekarang lebih rapi Tahap-nya berkat Quick Link dari EWS F2 & JSA
 // (openFormRcaPopup dengan prefillTahap), jadi pengelompokan ini representatif.
 function renderRcaGroupingSummary(rcaRows) {
 if (!rcaRows || rcaRows.length === 0) return '';

 const statusCounts = {};
 const tahapCounts = {};
 rcaRows.forEach(r => {
  const status = (r.status || 'Open').trim() || 'Open';
  statusCounts[status] = (statusCounts[status] || 0) + 1;
  const tahap = (r.tahap || '').trim() || (currentLang === 'en' ? 'Uncategorized' : 'Tanpa Kategori');
  tahapCounts[tahap] = (tahapCounts[tahap] || 0) + 1;
 });

 const statusOrder = ['Open', 'Progress', 'Closed'];
 const sortedStatusKeys = Object.keys(statusCounts).sort((a, b) => {
  const ia = statusOrder.indexOf(a), ib = statusOrder.indexOf(b);
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
 });
 const sortedTahapKeys = Object.keys(tahapCounts).sort((a, b) => tahapCounts[b] - tahapCounts[a]);

 const statusColorMap = { Open: '#e11d48', Progress: '#d97706', Closed: '#059669' };
 const badge = (label, count, color) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:3px 9px;border-radius:999px;border:1px solid ${color};color:${color};font-size:10px;font-weight:700;">${label}: ${count}</span>`;

 const statusBadges = sortedStatusKeys.map(k => badge(k, statusCounts[k], statusColorMap[k] || '#64748b')).join('');
 const tahapBadges = sortedTahapKeys.map(k => badge(k, tahapCounts[k], '#0ea5e9')).join('');

 return `<div style="margin-bottom:10px;">
  <div style="font-size:10px;color:#64748b;margin-bottom:3px;font-weight:600;">${currentLang === 'en' ? 'By Status' : 'Per Status'}:</div>
  <div>${statusBadges}</div>
  <div style="font-size:10px;color:#64748b;margin:6px 0 3px;font-weight:600;">${currentLang === 'en' ? 'By Affected Stage' : 'Per Tahap Bermasalah'}:</div>
  <div>${tahapBadges}</div>
 </div>`;
 }

 function buildPeriodicReportHtml(startDate, endDate) {
 const t = (id, en) => currentLang === 'en' ? en : id;

 const finalRows = (globalBlockModelData || []).filter(row => {
  const statusKpi = (row['Status_KPI'] || '').toString();
  const isBelumFinal = statusKpi.includes('Belum Final') || !row['Status_Depletion'];
  return !isBelumFinal;
 });
 const totalEstimasi = finalRows.reduce((s, r) => s + (typeof r['Estimasi_tonase'] === 'number' ? r['Estimasi_tonase'] : 0), 0);
 const totalRealisasi = finalRows.reduce((s, r) => s + (typeof r['Realisasi_Tonase'] === 'number' ? r['Realisasi_Tonase'] : 0), 0);
 const varianceOverall = totalEstimasi > 0 ? Math.abs(totalEstimasi - totalRealisasi) / totalEstimasi * 100 : 0;
 // BARU: Total Loss/Dilusi dalam satuan Ton, sama populasi blok final dengan varianceOverall.
 const varianceTonOverall = totalRealisasi - totalEstimasi;
 const varianceTonLabel = varianceTonOverall < 0
  ? t(`Loss ${Math.abs(varianceTonOverall).toLocaleString('id-ID')} Ton`, `Loss ${Math.abs(varianceTonOverall).toLocaleString('id-ID')} Ton`)
  : (varianceTonOverall > 0
    ? t(`Dilusi +${varianceTonOverall.toLocaleString('id-ID')} Ton`, `Dilution +${varianceTonOverall.toLocaleString('id-ID')} Ton`)
    : t('0 Ton', '0 Ton'));

 let totalPitActual = 0;
 (globalPitActualData || []).forEach(row => { totalPitActual += (row.tonase || 0); });
 let totalPlant = 0;
 (globalBargeShipmentData || []).forEach(s => {
  const aktual = parseFloat(s.tonase_aktual);
  if (!isNaN(aktual) && aktual > 0) totalPlant += aktual;
 });
 const f3 = totalPitActual > 0 ? (totalPlant / totalPitActual * 100) : null;
 const f4 = totalEstimasi > 0 ? (totalPlant / totalEstimasi * 100) : null;

 const filteredRca = (globalRcaLogData || []).filter(r => r.tanggal >= startDate && r.tanggal <= endDate);
 const filteredShipments = (globalBargeShipmentData || []).filter(s => s.tanggal_mulai >= startDate && s.tanggal_mulai <= endDate);
 const filteredIssues = (globalIssueRawData || []).filter(i => i.tanggal >= startDate && i.tanggal <= endDate);

 // BARU: DISC Sublot rata-rata dalam periode -- BargeSublot sendiri tidak punya kolom
 // tanggal langsung, jadi diikat lewat no_shipment yang shipment-nya SUDAH masuk filter
 // periode di atas (filteredShipments). Rata-rata polos (bukan tertimbang tonase), karena
 // DISC di sini soal akurasi ESTIMASI kadar (Plan vs Aktual X-Ray), bukan soal kuantitas.
 const filteredShipmentNos = new Set(filteredShipments.map(s => s.no_shipment));
 const filteredSublots = (globalBargeSublotData || []).filter(sl => filteredShipmentNos.has(sl.no_shipment));
 let avgDiscNi = null, avgDiscSioMgo = null;
 if (filteredSublots.length > 0) {
  const sumDiscNi = filteredSublots.reduce((s, sl) => s + Math.abs(sl.disc_ni || 0), 0);
  const sumDiscSioMgo = filteredSublots.reduce((s, sl) => s + Math.abs(sl.disc_sio2_mgo || 0), 0);
  avgDiscNi = sumDiscNi / filteredSublots.length;
  avgDiscSioMgo = sumDiscSioMgo / filteredSublots.length;
 }

 const genDate = new Date().toLocaleString(currentLang === 'en' ? 'en-US' : 'id-ID');

 const statCard = (label, value) => `<div style="border:1px solid #94a3b8;border-radius:8px;padding:8px;"><div style="color:#64748b;font-size:10px;">${label}</div><div style="font-weight:700;font-size:12px;">${value}</div></div>`;

 const tableOrEmpty = (rows, emptyMsg, headers, rowFn) => {
  if (rows.length === 0) return `<p style="font-size:11px;color:#64748b;">${emptyMsg}</p>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:10px;">
   <thead><tr style="background:#f1f5f9;text-align:left;">${headers.map(h => `<th style="padding:5px;border:1px solid #94a3b8;">${h}</th>`).join('')}</tr></thead>
   <tbody>${rows.map(rowFn).join('')}</tbody>
  </table>`;
 };
 const td = (v) => `<td style="padding:5px;border:1px solid #94a3b8;">${v}</td>`;

 return `
  <div style="margin-bottom:16px;">
  <h2 style="font-size:18px;font-weight:800;margin-bottom:2px;">${t('Laporan Rekonsiliasi', 'Reconciliation Report')}</h2>
  <p style="font-size:11px;color:#64748b;">${t('Periode', 'Period')}: ${startDate} ${t('s/d', 'to')} ${endDate} -- ${t('Dibuat', 'Generated')}: ${genDate}</p>
  </div>

  <div style="margin-bottom:18px;">
  <h3 style="font-size:13px;font-weight:700;margin-bottom:8px;">${t('Ringkasan Rekonsiliasi (Snapshot Saat Ini)', 'Reconciliation Summary (Current Snapshot)')}</h3>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:11px;">
   ${statCard(t('Total Estimasi', 'Total Estimate'), totalEstimasi.toLocaleString('id-ID') + ' Ton')}
   ${statCard(t('Total Realisasi', 'Total Actual'), totalRealisasi.toLocaleString('id-ID') + ' Ton')}
   ${statCard(t('Variance Keseluruhan', 'Overall Variance'), varianceOverall.toFixed(2) + '% (' + finalRows.length + ' ' + t('blok final', 'final blocks') + ')')}
   ${statCard(t('Total Loss/Dilusi (Ton)', 'Total Loss/Dilution (Ton)'), varianceTonLabel)}
   ${statCard(
    t('Rata-rata DISC Sublot (Periode)', 'Average Sublot DISC (Period)'),
    avgDiscNi !== null
     ? `Ni: ${avgDiscNi.toFixed(3)} | SiO2/MgO: ${avgDiscSioMgo.toFixed(3)} (${filteredSublots.length} ${t('sublot', 'sublots')})`
     : t('Belum ada data Sublot di periode ini', 'No Sublot data in this period')
   )}
   ${statCard('F3: Plant / Pit Actual', f3 !== null ? f3.toFixed(1) + '%' : '-')}
   ${statCard('F4: Plant / Block Model', f4 !== null ? f4.toFixed(1) + '%' : '-')}
   ${statCard(t('Total Pit Actual', 'Total Pit Actual'), totalPitActual.toLocaleString('id-ID') + (currentLang === 'en' ? ' Tons' : ' Ton'))}
  </div>
  </div>

  <div style="margin-bottom:18px;">
  <h3 style="font-size:13px;font-weight:700;margin-bottom:8px;">${t('RCA Log dalam Periode', 'RCA Log in Period')} (${filteredRca.length})</h3>
  ${renderRcaGroupingSummary(filteredRca)}
  ${tableOrEmpty(filteredRca, t('Tidak ada entri RCA di periode ini.', 'No RCA entries in this period.'),
  [t('Tanggal', 'Date'), 'Blok/Pit', t('Tahap', 'Stage'), t('Deskripsi Isu', 'Issue'), 'PIC', 'Status'],
  r => `<tr>${td(r.tanggal || '-')}${td((r.blok || '-') + (r.pit ? '/' + r.pit : ''))}${td(r.tahap || '-')}${td(r.deskripsi_isu || '-')}${td(r.pic || '-')}${td(r.status || '-')}</tr>`)}
  </div>

  <div style="margin-bottom:18px;">
  <h3 style="font-size:13px;font-weight:700;margin-bottom:8px;">${t('Shipment Mulai dalam Periode', 'Shipments Started in Period')} (${filteredShipments.length})</h3>
  ${tableOrEmpty(filteredShipments, t('Tidak ada shipment yang mulai di periode ini.', 'No shipments started in this period.'),
  ['No Shipment', 'Tug/Barge', t('Progress', 'Progress'), t('Tonase Aktual', 'Actual Tonnage'), 'Status'],
  s => `<tr>${td(s.no_shipment || '-')}${td((s.nama_tug || '-') + ' / ' + (s.nama_barge || '-'))}${td((s.progress_percent || 0).toFixed(1) + '%')}${td(s.tonase_aktual ? Number(s.tonase_aktual).toLocaleString('id-ID') + ' Ton' : '-')}${td(s.status || '-')}</tr>`)}
  </div>

  <div>
  <h3 style="font-size:13px;font-weight:700;margin-bottom:8px;">Issue &amp; Action (${filteredIssues.length})</h3>
  ${tableOrEmpty(filteredIssues, t('Tidak ada isu tercatat di periode ini.', 'No issues recorded in this period.'),
  [t('Tanggal', 'Date'), t('Masalah', 'Issue'), t('Lokasi', 'Location'), 'PIC', 'Status'],
  i => `<tr>${td(i.tanggal || '-')}${td(i.masalah || '-')}${td(i.lokasi || '-')}${td(i.pic || '-')}${td(i.status || '-')}</tr>`)}
  </div>
 `;
 }

 function generatePeriodicReport() {
 const startDate = document.getElementById('periodic-report-start').value;
 const endDate = document.getElementById('periodic-report-end').value;
 const preview = document.getElementById('periodic-report-preview');
 const printBtn = document.getElementById('btn-print-periodic-report');

 if (!startDate || !endDate) {
  preview.innerHTML = `<p class="text-[11px] text-rose-400 font-medium">${currentLang === 'en' ? 'Please select a start and end date first.' : 'Pilih tanggal mulai dan akhir dulu.'}</p>`;
  printBtn.classList.add('hidden');
  printBtn.classList.remove('flex');
  return;
 }
 if (startDate > endDate) {
  preview.innerHTML = `<p class="text-[11px] text-rose-400 font-medium">${currentLang === 'en' ? 'Start date must be before the end date.' : 'Tanggal mulai harus sebelum tanggal akhir.'}</p>`;
  printBtn.classList.add('hidden');
  printBtn.classList.remove('flex');
  return;
 }

 preview.innerHTML = buildPeriodicReportHtml(startDate, endDate);
 printBtn.classList.remove('hidden');
 printBtn.classList.add('flex');
 lucide.createIcons();
 }

 function printPeriodicReport() {
 const startDate = document.getElementById('periodic-report-start').value;
 const endDate = document.getElementById('periodic-report-end').value;
 if (!startDate || !endDate) return;

 const printContainer = document.getElementById('print-periodic-report-container');
 printContainer.innerHTML = buildPeriodicReportHtml(startDate, endDate);
 printContainer.style.background = 'white';
 printContainer.style.color = '#0f172a';
 printContainer.style.padding = '10px';

 let orientationStyle = document.getElementById('print-orientation-style');
 if (!orientationStyle) {
  orientationStyle = document.createElement('style');
  orientationStyle.id = 'print-orientation-style';
  document.head.appendChild(orientationStyle);
 }
 orientationStyle.innerHTML = '@page { size: A4 portrait; }';

 document.body.classList.add('printing-periodic-report');
 window.print();
 }

 // BARU: openFormRcaPopup terima param opsional (blok, pit) untuk pre-fill -- dipicu dari
 // tombol Quick Link RCA di badge OUT OF TOL tabel Block Model vs Actual, supaya user
 // tidak perlu ketik ulang Blok/Pit yang sudah jelas dari baris yang diklik.
 // BARU: parameter ke-3 & ke-4 opsional (prefillTahap, prefillDeskripsi) -- dipakai Quick
 // Link RCA dari Matriks F1-F4 (F2 OUT OF TOL) supaya Tahap Bermasalah otomatis terisi
 // "Pit Actual" (tahap GC->Pit Actual yang bermasalah) & deskripsi awal berisi angka deviasi,
 // BUKAN cuma Blok/Pit kosong seperti Quick Link lama dari tabel "Block Model vs Actual".
 // Konsisten dari sumbernya bikin RCA Log pengelompokan otomatis per Tahap (rencana lanjutan)
 // punya data yang lebih rapi, tidak perlu tebak-tebak Tahap mana yang cocok.
 function openProfessionalReportModal() {
 const preview = document.getElementById('professional-report-preview');
 preview.innerHTML = buildProfessionalReportHtml();
 const modal = document.getElementById('professional-report-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeProfessionalReportModal() {
 hideModalAnimated(document.getElementById('professional-report-modal'));
 }

 function buildProfessionalReportHtml() {
 const tolCfg = globalCOGConfig || {};
 const warnPct = typeof tolCfg.Toleransi_Warning_Pct === 'number' ? tolCfg.Toleransi_Warning_Pct : 5;
 const ootPct = typeof tolCfg.Toleransi_OutOfTol_Pct === 'number' ? tolCfg.Toleransi_OutOfTol_Pct : 10;
 const gcTonaseByBlok = (typeof computeGcTonaseByBlok === 'function') ? computeGcTonaseByBlok() : {};

 const rows = (globalBlockModelData || []).map(row => {
  const idBlok = (row['Id_blok'] || '-').toString();
  const pit = (row['Pit'] || '-').toString();
  const estimasi = typeof row['Estimasi_tonase'] === 'number' ? row['Estimasi_tonase'] : 0;
  const realisasi = typeof row['Realisasi_Tonase'] === 'number' ? row['Realisasi_Tonase'] : 0;
  const variasi = row['Variasi_%'];
  const statusKpi = (row['Status_KPI'] || '').toString();
  const isBelumFinal = statusKpi.includes('Belum Final') || !row['Status_Depletion'];
  const gcKey = idBlok.trim().toUpperCase() + '|' + pit.trim().toUpperCase();
  const gc = gcTonaseByBlok[gcKey] || 0;

  let tolStatus = 'N/A';
  if (!isBelumFinal && typeof variasi === 'number') {
  const absVariasi = Math.abs(variasi);
  tolStatus = absVariasi > ootPct ? 'OUT OF TOL' : (absVariasi > warnPct ? 'WARNING' : 'OK');
  }
  return { idBlok, pit, estimasi, gc, realisasi, variasi, isBelumFinal, tolStatus };
 });

 // Ringkasan eksekutif: cuma Blok status Final yang dihitung, sama pola dengan Matriks
 // F1-F4 global (exclude Belum Final) supaya akurasi tidak bias oleh Blok yang belum tuntas.
 const finalRows = rows.filter(r => !r.isBelumFinal);
 const totalBm = finalRows.reduce((s, r) => s + r.estimasi, 0);
 const totalGc = finalRows.reduce((s, r) => s + r.gc, 0);
 const totalRealisasi = finalRows.reduce((s, r) => s + r.realisasi, 0);
 const f1 = totalBm > 0 ? ((totalGc - totalBm) / totalBm * 100) : 0;
 const f2 = totalGc > 0 ? ((totalRealisasi - totalGc) / totalGc * 100) : 0;
 const f4 = totalBm > 0 ? ((totalRealisasi - totalBm) / totalBm * 100) : 0;
 const outOfTolCount = finalRows.filter(r => r.tolStatus === 'OUT OF TOL').length;

 const fmt = v => v.toLocaleString('id-ID', { maximumFractionDigits: 0 });
 const fmtPct = v => (v >= 0 ? '+' : '') + v.toFixed(2) + '%';

 const tolBadgeClass = s => s === 'OK' ? 'background:#d1fae5;color:#065f46;' : s === 'WARNING' ? 'background:#fef3c7;color:#92400e;' : s === 'OUT OF TOL' ? 'background:#fee2e2;color:#991b1b;' : 'background:#e2e8f0;color:#475569;';

 const tableRows = rows.map(r => `
  <tr>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${r.idBlok}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${r.pit}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(r.estimasi)}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(r.gc)}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(r.realisasi)}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${r.isBelumFinal ? '-' : fmtPct(r.variasi || 0)}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;"><span style="${tolBadgeClass(r.tolStatus)}padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;">${r.tolStatus}</span></td>
  </tr>
 `).join('');

 // Temuan RCA -- prioritaskan status Open/Progress (belum tuntas), maksimal 8 baris
 // supaya laporan tetap ringkas & fokus ke yang perlu tindak lanjut.
 const rcaOpen = (globalRcaLogData || []).filter(r => (r.status || 'Open') !== 'Closed').slice(0, 8);
 const rcaRowsHtml = rcaOpen.length > 0 ? rcaOpen.map(r => `
  <tr>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${r.tanggal || '-'}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${r.blok || '-'} / ${r.pit || '-'}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${r.deskripsi_isu || '-'}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${r.tindakan || '-'}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${r.pic || '-'}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;"><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;">${r.status ? ((currentLang === 'en' || String(r.status).toLowerCase() !== 'open') ? r.status : 'Terbuka') : (currentLang === 'en' ? 'Open' : 'Terbuka')}</span></td>
  </tr>
 `).join('') : `<tr><td colspan="6" style="padding:10px 8px;text-align:center;color:#94a3b8;">Tidak ada temuan RCA terbuka.</td></tr>`;

 const now = new Date();
 const genDate = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

 return `
 <div style="font-family:Arial,sans-serif;color:#0f172a;">
  <div style="border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:16px;">
  <p style="font-size:10px;color:#64748b;margin:0 0 2px;letter-spacing:1px;">LAPORAN REKONSILIASI PROFESIONAL</p>
  <h2 style="font-size:18px;font-weight:700;margin:0;">Geobank Minerals -- Rekonsiliasi Produksi & Cadangan</h2>
  <p style="font-size:10px;color:#64748b;margin:4px 0 0;">Dokumen ini dihasilkan otomatis oleh Dashboard Mine Geologist, dicetak ${genDate}. Data live dari Google Sheets (globalBlockModelData, globalRcaLogData).</p>
  </div>

  <h3 style="font-size:13px;font-weight:700;margin:0 0 8px;">1. Ringkasan Eksekutif</h3>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
  <div style="background:#f1f5f9;border-radius:8px;padding:8px 10px;">
   <p style="font-size:9px;color:#64748b;margin:0 0 2px;">F1 (GC/BM)</p>
   <p style="font-size:15px;font-weight:700;margin:0;">${fmtPct(f1)}</p>
  </div>
  <div style="background:#f1f5f9;border-radius:8px;padding:8px 10px;">
   <p style="font-size:9px;color:#64748b;margin:0 0 2px;">F2 (Realisasi/GC)</p>
   <p style="font-size:15px;font-weight:700;margin:0;">${fmtPct(f2)}</p>
  </div>
  <div style="background:#f1f5f9;border-radius:8px;padding:8px 10px;">
   <p style="font-size:9px;color:#64748b;margin:0 0 2px;">F4 (Realisasi/BM, Global)</p>
   <p style="font-size:15px;font-weight:700;margin:0;">${fmtPct(f4)}</p>
  </div>
  <div style="background:${outOfTolCount > 0 ? '#fee2e2' : '#f1f5f9'};border-radius:8px;padding:8px 10px;">
   <p style="font-size:9px;color:#64748b;margin:0 0 2px;">Blok Out of Tolerance</p>
   <p style="font-size:15px;font-weight:700;margin:0;">${outOfTolCount} dari ${finalRows.length} Blok Final</p>
  </div>
  </div>
  <p style="font-size:10px;color:#64748b;margin:-8px 0 16px;">F1-F4 dihitung dari Blok berstatus Final saja (exclude Belum Final), supaya akurasi tidak bias oleh Blok yang belum tuntas ditambang.</p>

  <h3 style="font-size:13px;font-weight:700;margin:0 0 8px;">2. Rekonsiliasi 3-Tahap: Block Model vs Grade Control vs Realisasi</h3>
  <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px;">
  <thead>
   <tr style="background:#0f172a;color:white;">
   <th style="padding:6px 8px;text-align:left;">Blok</th>
   <th style="padding:6px 8px;text-align:left;">Pit</th>
   <th style="padding:6px 8px;text-align:right;">BM (Ton)</th>
   <th style="padding:6px 8px;text-align:right;">GC (Ton)</th>
   <th style="padding:6px 8px;text-align:right;">Realisasi (Ton)</th>
   <th style="padding:6px 8px;text-align:right;">Variasi %</th>
   <th style="padding:6px 8px;text-align:center;">Status</th>
   </tr>
  </thead>
  <tbody>${tableRows || `<tr><td colspan="7" style="padding:10px 8px;text-align:center;color:#94a3b8;">Belum ada data Block Model.</td></tr>`}</tbody>
  </table>
  <p style="font-size:10px;color:#64748b;margin:0 0 16px;">
  Legenda toleransi: <b style="color:#065f46;">OK</b> &le; &plusmn;${warnPct}% &middot; <b style="color:#92400e;">WARNING</b> &plusmn;${warnPct}%-${ootPct}% &middot; <b style="color:#991b1b;">OUT OF TOL</b> &gt; &plusmn;${ootPct}% (diatur dari Settings &gt; Parameter &gt; COG).
  </p>

  <h3 style="font-size:13px;font-weight:700;margin:0 0 8px;">3. Temuan RCA yang Perlu Tindak Lanjut</h3>
  <table style="width:100%;border-collapse:collapse;font-size:11px;">
  <thead>
   <tr style="background:#0f172a;color:white;">
   <th style="padding:6px 8px;text-align:left;">Tanggal</th>
   <th style="padding:6px 8px;text-align:left;">Blok/Pit</th>
   <th style="padding:6px 8px;text-align:left;">Deskripsi Isu</th>
   <th style="padding:6px 8px;text-align:left;">Tindakan</th>
   <th style="padding:6px 8px;text-align:left;">PIC</th>
   <th style="padding:6px 8px;text-align:center;">Status</th>
   </tr>
  </thead>
  <tbody>${rcaRowsHtml}</tbody>
  </table>
 </div>
 `;
 }

 function printProfessionalReport() {
 const printContainer = document.getElementById('print-professional-report-container');
 printContainer.innerHTML = buildProfessionalReportHtml();
 printContainer.style.background = 'white';
 printContainer.style.color = '#0f172a';
 printContainer.style.padding = '10px';

 let orientationStyle = document.getElementById('print-orientation-style');
 if (!orientationStyle) {
  orientationStyle = document.createElement('style');
  orientationStyle.id = 'print-orientation-style';
  document.head.appendChild(orientationStyle);
 }
 orientationStyle.innerHTML = '@page { size: A4 portrait; }';

 document.body.classList.add('printing-professional-report');
 window.print();
 }

 function openGuideModal() {
 const modal = document.getElementById('guide-rekonsiliasi-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeGuideModal() {
 hideModalAnimated(document.getElementById('guide-rekonsiliasi-modal'));
 }

 // BARU (v89.16.24): Modal Form COGConfig -- baca/ubah parameter Cut of Grade dari Settings.
 // BARU: openCOGConfigModal terima parameter tab ('cog'|'flag'|'bucket') dari 3 kartu
 // terpisah di panel Settings -- 1 modal, konten sama (sheet COGConfig), beda tab default.
 function toggleGuideStep(n) {
 const content = document.getElementById('guide-content-' + n);
 const chevron = document.getElementById('guide-chevron-' + n);
 if (!content) return;
 const isHidden = content.classList.contains('hidden');
 content.classList.toggle('hidden');
 if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
 }

 // ---- Form: Pit Actual (Ritase x TF di weighbridge) ----
 function showNoticeModal(title, message) {
 document.getElementById('notice-title').innerText = title;
 document.getElementById('notice-message').innerText = message;
 const modal = document.getElementById('notice-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeNoticeModal() {
 const modal = document.getElementById('notice-modal');
 hideModalAnimated(modal);
 }

 let pendingConfirmResolve = null;

 function showConfirmModal(title, message) {
 return new Promise(resolve => {
  pendingConfirmResolve = resolve;
  document.getElementById('confirm-title').innerText = title;
  document.getElementById('confirm-message').innerText = message;
  const modal = document.getElementById('confirm-modal');
  showModalAnimated(modal);
  lucide.createIcons();
 });
 }

 function closeConfirmModal(result) {
 const modal = document.getElementById('confirm-modal');
 hideModalAnimated(modal);
 const resolve = pendingConfirmResolve;
 pendingConfirmResolve = null;
 if (resolve) resolve(Boolean(result));
 }

 function syncMemberPinConfirmation() {
 const form = document.getElementById('kpiManagerForm');
 const statusMsg = document.getElementById('member-form-status-msg');
 if (!form || !statusMsg) return;

 const pinInput = form.elements.pin;
 const pinConfirmInput = form.elements.pin_confirm;
 if (!pinInput || !pinConfirmInput) return;

 // Normalisasi hanya untuk validasi UI: PIN memang harus 6 digit.
 // Ini mencegah pesan mismatch lama tertinggal setelah kedua kolom sudah sama.
 const pin = String(pinInput.value || '').replace(/\D/g, '').slice(0, 6);
 const pinConfirm = String(pinConfirmInput.value || '').replace(/\D/g, '').slice(0, 6);

 if (pinInput.value !== pin) pinInput.value = pin;
 if (pinConfirmInput.value !== pinConfirm) pinConfirmInput.value = pinConfirm;

 const bothValid = /^\d{6}$/.test(pin) && /^\d{6}$/.test(pinConfirm);
 const same = bothValid && pin === pinConfirm;

 // Jika sudah sama, HAPUS pesan mismatch lama tanpa bergantung pada dataset.errorCode.
 if (same) {
  statusMsg.dataset.errorCode = '';
  if (statusMsg.innerText === 'Konfirmasi PIN tidak sama.' || statusMsg.innerText === 'PIN confirmation does not match.') {
   statusMsg.className = 'text-xs hidden';
   statusMsg.innerText = '';
  }
  statusMsg.classList.add('hidden');
 }
 }

 function openFormPopup() {
 if (!isDeveloperUnlocked()) {
  showNoticeModal(
  currentLang === 'en' ? 'Form Member Locked' : 'Form Member Terkunci',
  currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first to enable this form.' : 'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu untuk mengaktifkan form ini.'
  );
  return;
 }
 const modal = document.getElementById('form-popup-modal');
 const statusMsg = document.getElementById('member-form-status-msg');
 if (statusMsg) {
  statusMsg.dataset.errorCode = '';
  statusMsg.innerText = '';
  statusMsg.classList.add('hidden');
 }
 showModalAnimated(modal);
 lucide.createIcons();
 resetMemberFormMode(); // pastikan selalu mulai dari mode "tambah baru", bukan nyangkut mode edit sebelumnya

 // Sinkronisasi pesan validasi PIN secara realtime.
 // Listener dipasang sekali per input agar pesan mismatch lama tidak menempel.
 const memberForm = document.getElementById('kpiManagerForm');
 if (memberForm) {
  const pinInput = memberForm.elements.pin;
  const pinConfirmInput = memberForm.elements.pin_confirm;
  [pinInput, pinConfirmInput].forEach((input) => {
   if (!input || input.dataset.pinSyncBound === '1') return;
   input.addEventListener('input', syncMemberPinConfirmation);
   input.addEventListener('change', syncMemberPinConfirmation);
   input.dataset.pinSyncBound = '1';
  });
  syncMemberPinConfirmation();
 }
 }

 function closeFormPopup() {
 const modal = document.getElementById('form-popup-modal');
 hideModalAnimated(modal);
 resetMemberFormMode(); // cegah mode edit "nyangkut" kalau modal ditutup manual tanpa submit
 }

 function populateNameOptions(selectEl, preserveVal) {
 selectEl.innerHTML = '<option value="Yaya (Head Mine Geologist)">Yaya (Head Mine Geologist / Developer)</option>';

 globalMemberData.forEach(item => {
  const member = {};
  Object.keys(item).forEach(k => member[k.trim().toLowerCase()] = item[k]);
  const namaVal = member['nama'] || member['name'];
  if (namaVal) {
  const opt = document.createElement('option');
  opt.value = namaVal;
  opt.textContent = namaVal;
  selectEl.appendChild(opt);
  }
 });

 if (preserveVal && [...selectEl.options].some(o => o.value === preserveVal)) {
  selectEl.value = preserveVal;
 }
 }

 function populateReporterDropdown() {
 const identity = getLoggedInChatIdentity();
 const identitySelects = ['auto-issue-reporter','digging-reporter-select','validasi-reporter-select','chat-sender-select'];
 identitySelects.forEach(function(id) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = identity.sender || '';
  opt.textContent = identity.sender || (currentLang === 'en' ? 'Login required' : 'Login diperlukan');
  select.appendChild(opt);
  select.value = identity.sender || '';
  select.disabled = true;
  select.required = false;
  select.classList.add('opacity-80','cursor-not-allowed');
 });
 if (identity.sender) localStorage.setItem('mine_active_identity_name', identity.sender);
 }

 function checkDuplicateIdSampel(value) {
 const warningEl = document.getElementById('digging-id-sampel-warning');
 if (!warningEl) return;
 const warningText = warningEl.querySelector('span');
 const trimmed = (value || '').trim();
 if (!trimmed) { warningEl.classList.add('hidden'); return; }

 const match = globalRawData.find(row => {
  const cleanRow = rawToCleanRow.get(row) || {};
  const existingId = (cleanRow['id sampel'] || cleanRow['id_sampel'] || '').toString().trim();
  return existingId && existingId.toLowerCase() === trimmed.toLowerCase();
 });

 if (match) {
  const cleanMatch = rawToCleanRow.get(match) || {};
  const tgl = (cleanMatch['tanggal'] || '-').toString().split(' ')[0];
  const pit = cleanMatch['pit'] || cleanMatch['area'] || '-';
  const material = cleanMatch['material'] || '-';
  warningText.innerText = currentLang === 'en'
   ? `This ID Sampel already exists (${tgl}, Pit ${pit}, ${material}). If this is an intentional resample, use a different code (e.g. add "R") and note it in Keterangan.`
   : `ID Sampel ini sudah pernah dipakai (${tgl}, Pit ${pit}, ${material}). Kalau ini re-sampling yang disengaja, pakai kode berbeda (misal tambah "R") dan catat di Keterangan.`;
  warningEl.classList.remove('hidden');
 } else {
  warningEl.classList.add('hidden');
 }
 }

 function onUpdateAssayTujuanChange() {
 const tujuan = document.getElementById('update-assay-tujuan').value;
 const shipWrapper = document.getElementById('update-assay-ship-wrapper');
 if (tujuan === 'Direct') {
  shipWrapper.classList.remove('hidden');
 } else {
  shipWrapper.classList.add('hidden');
  document.getElementById('update-assay-ship').value = '';
 }
 }

 function openUpdateAssayModal() {
 const row = currentOpenDiggingRow;
 if (!row) return;

 if (!row.idSampel || row.idSampel === '-') {
  showNoticeModal(
  currentLang === 'en' ? 'No Sample ID' : 'ID Sampel Kosong',
  currentLang === 'en' ? 'This record has no ID Sampel, so it cannot be reliably tracked or updated.' : 'Baris ini tidak punya ID Sampel, jadi tidak bisa dilacak/diupdate dengan aman.'
  );
  return;
 }

 document.getElementById('update-assay-subtitle').innerText = `${row.tanggal} -- ${row.pit} / ${row.blok} -- ${row.idSampel}`;
 document.getElementById('update-assay-ni').value = '';
 document.getElementById('update-assay-fe').value = '';
 document.getElementById('update-assay-co').value = '';
 document.getElementById('update-assay-mgo').value = '';
 document.getElementById('update-assay-sio2').value = '';
 document.getElementById('update-assay-tipe-ore').value = 'Sapro';

 // Tujuan cuma ditawarkan di sini kalau baris ini BELUM pernah punya Tujuan --
 // kalau sudah ada (mis. sudah EFO ke Dome tertentu), ganti Tujuan/Dome tetap lewat
 // modal "Update Tujuan & ID Pengapalan" yang sudah ada, bukan dobel jalur di sini.
 const belumAdaTujuan = !row.tujuan || row.tujuan === '-';
 const tujuanWrapper = document.getElementById('update-assay-tujuan-wrapper');
 tujuanWrapper.classList.toggle('hidden', !belumAdaTujuan);
 document.getElementById('update-assay-tujuan').value = '';
 document.getElementById('update-assay-ship-wrapper').classList.add('hidden');
 document.getElementById('update-assay-ship').value = '';

 document.getElementById('update-assay-status-msg').classList.add('hidden');

 const modal = document.getElementById('update-assay-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeUpdateAssayModal() {
 const modal = document.getElementById('update-assay-modal');
 hideModalAnimated(modal);
 }

 async function submitUpdateAssay() {
 const row = currentOpenDiggingRow;
 if (!row) return;
 const submitBtn = document.getElementById('btn-submit-update-assay');
 const statusMsg = document.getElementById('update-assay-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;

 const niVal = document.getElementById('update-assay-ni').value.trim();
 const feVal = document.getElementById('update-assay-fe').value.trim();
 const coVal = document.getElementById('update-assay-co').value.trim();
 const mgoVal = document.getElementById('update-assay-mgo').value.trim();
 const sio2Val = document.getElementById('update-assay-sio2').value.trim();
 const tipeOreVal = document.getElementById('update-assay-tipe-ore').value;
 const tujuanVal = document.getElementById('update-assay-tujuan-wrapper').classList.contains('hidden')
  ? '' : document.getElementById('update-assay-tujuan').value;
 const shipVal = document.getElementById('update-assay-ship').value.trim();

 if (!niVal) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Ni % is required to save assay results.' : 'Ni % wajib diisi untuk menyimpan hasil assay.';
  statusMsg.classList.remove('hidden');
  return;
 }

 // Material dihitung ulang di sini juga (client-side), SAMA PERSIS pola submitDiggingForm --
 // supaya kolom Material konsisten dgn cara dashboard menghitung di tempat lain.
 const smComputed = (parseFloat(mgoVal) > 0) ? (parseFloat(sio2Val) / parseFloat(mgoVal)) : 0;
 const classifyResultAssay = classifyMaterial(parseFloat(niVal) || 0, tipeOreVal, smComputed);

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const payload = buildAuthenticatedPayload({
  action: 'updateAssayResult',
  id_sampel: row.idSampel,
  ni: niVal, fe: feVal, co: coVal, mgo: mgoVal, sio2: sio2Val,
  sm: smComputed ? smComputed.toFixed(2) : '',
  material: classifyResultAssay.classGrade,
  tipe_ore: classifyResultAssay.tipeOreFinal,
  tujuan: tujuanVal,
  ship: tujuanVal === 'Direct' ? shipVal : ''
  });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save assay results.' : 'Gagal menyimpan hasil assay.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = result.auto_route ? ((currentLang === 'en' ? 'Saved -- ' : 'Tersimpan -- ') + result.auto_route) : (currentLang === 'en' ? 'Assay results saved!' : 'Hasil assay berhasil disimpan!');
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
  closeUpdateAssayModal();
  closeDiggingDetailModal();
  statusMsg.classList.add('hidden');
  fetchDataFromGoogleSheets(true);
  }, 900);
 } catch (error) {
  console.error('Error updating assay result:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error && error.message ? error.message : (currentLang === 'en' ? 'An error occurred. Try again.' : 'Terjadi kesalahan. Coba lagi.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }

 // ==== BARU (28 Agu): MODAL AJUKAN KEJADIAN KPI (addKpiEvent) ====
 function openFormIssuePopup() {
 populateReporterDropdown();
 const now = new Date();
 const tanggalOnly = now.toISOString().slice(0, 10);           // yyyy-MM-dd
 const waktuOnly = now.toTimeString().slice(0, 5);             // HH:MM
 const displayText = tanggalOnly + '  ' + waktuOnly;

 const displayInput = document.getElementById('auto-issue-datetime');
 if (displayInput) displayInput.value = displayText;

 const tanggalInput = document.getElementById('issue-field-tanggal');
 if (tanggalInput) tanggalInput.value = tanggalOnly;

 const waktuInput = document.getElementById('issue-field-waktu');
 if (waktuInput) waktuInput.value = waktuOnly;

 const modal = document.getElementById('form-issue-popup-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeFormIssuePopup() {
 const modal = document.getElementById('form-issue-popup-modal');
 hideModalAnimated(modal);
 }


// SECURITY 90V STEP 12B CENTRAL AUTH LAYER
// Semua write normal memakai session member aktif; bila tidak ada, fallback ke session Developer.
// Endpoint Developer-only wajib memakai devToken dan TIDAK pernah memakai member token.
function getCentralAuthToken(options) {
  options = options || {};
  const memberToken = (localStorage.getItem('mine_member_token') || '').trim();
  const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
  return options.developerOnly ? devToken : (memberToken || devToken);
}

function buildAuthenticatedPayload(source, options) {
  options = options || {};
  let payload;
  if (source instanceof HTMLFormElement) {
    payload = new URLSearchParams(new FormData(source));
  } else if (source instanceof URLSearchParams) {
    payload = new URLSearchParams(source);
  } else if (source && typeof source === 'object') {
    payload = new URLSearchParams(source);
  } else {
    payload = new URLSearchParams();
  }

  const token = getCentralAuthToken(options);
  payload.delete('sessionToken');
  payload.delete('devToken');

  if (options.developerOnly) {
    payload.set('devToken', token);
  } else {
    payload.set('sessionToken', token);
  }
  return payload;
}

async function postCentralAuthenticated(source, options) {
  options = options || {};
  const payload = buildAuthenticatedPayload(source, options);
  const needsLoading = !!options.developerOnly && options.showLoading !== false;
  if (needsLoading) showAppLoading(translations[currentLang].dev_operation_loading_title, translations[currentLang].dev_operation_loading_message);
  try {
   const response = await fetch(GOOGLE_SCRIPT_READ_URL, {
    method: 'POST',
    body: payload
   });
   let result;
   try {
    result = await response.json();
   } catch (parseError) {
    throw new Error('Response server tidak valid (bukan JSON). HTTP ' + response.status);
   }
   if (!response.ok) {
    throw new Error(result && result.message ? result.message : ('HTTP ' + response.status));
   }
   return result;
  } finally {
   if (needsLoading) hideAppLoading();
  }
}

 async function submitIssueForm(event) {
 event.preventDefault();
 const form = document.getElementById('issueManagerForm');
 const submitBtn = document.getElementById('btn-submit-issue');
 const statusMsg = document.getElementById('issue-form-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;

 const lokasi = form.lokasi.value.trim();
 const masalah = form.masalah.value.trim();
 const dampak = form.dampak.value.trim();
 const rekomendasi = form.rekomendasi.value.trim();

 if (!lokasi || !masalah || !dampak || !rekomendasi) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Location, Issue, Impact, and Recommendation are required.' : 'Lokasi, Masalah, Dampak, dan Rekomendasi wajib diisi.';
  statusMsg.classList.remove('hidden');
  return;
 }

 const payload = buildAuthenticatedPayload(form);

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, {
  method: 'POST',
  body: payload
  });
  const result = await response.json();

  if (result.status === 'success') {
  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Issue data successfully saved!' : 'Data issue berhasil disimpan!';
  statusMsg.classList.remove('hidden');
  form.reset();
  populateReporterDropdown();

  setTimeout(() => {
   closeFormIssuePopup();
   statusMsg.classList.add('hidden');
   fetchIssueData();
  }, 900);
  } else {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to save issue data.' : 'Gagal menyimpan data issue.'));
  }
 } catch (error) {
  console.error('Error submitting issue form:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error && error.message ? error.message : (currentLang === 'en' ? 'An error occurred while saving. Please try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }

 const REGIONAL_TIME_DEFAULTS = { timezone: 'Asia/Jakarta', locale: 'id-ID', dateFormat: 'dd-MMM-yyyy', timeFormat: 'HH:mm:ss' };
 const REGIONAL_TIME_STORAGE_KEY = 'mine_regional_time_config';
 let regionalTimeSettings = { ...REGIONAL_TIME_DEFAULTS };
 let regionalTimeServerLoaded = false;

 function normalizeRegionalTimeConfig(cfg) {
  const source = cfg || {};
  return {
   timezone: source.timezone || REGIONAL_TIME_DEFAULTS.timezone,
   locale: source.locale || REGIONAL_TIME_DEFAULTS.locale,
   dateFormat: source.dateFormat || REGIONAL_TIME_DEFAULTS.dateFormat,
   timeFormat: source.timeFormat || REGIONAL_TIME_DEFAULTS.timeFormat
  };
 }

 function regionalTimeConfigEquals(a, b) {
  const x = normalizeRegionalTimeConfig(a);
  const y = normalizeRegionalTimeConfig(b);
  return x.timezone === y.timezone && x.locale === y.locale && x.dateFormat === y.dateFormat && x.timeFormat === y.timeFormat;
 }

 function cacheRegionalTimeSettings(cfg) {
  try { localStorage.setItem(REGIONAL_TIME_STORAGE_KEY, JSON.stringify(normalizeRegionalTimeConfig(cfg))); } catch (e) {}
 }

 function readCachedRegionalTimeSettings() {
  try {
   const raw = localStorage.getItem(REGIONAL_TIME_STORAGE_KEY);
   if (!raw) return null;
   return normalizeRegionalTimeConfig(JSON.parse(raw));
  } catch (e) { return null; }
 }

 function applyRegionalTimeSettings(cfg) {
  regionalTimeSettings = normalizeRegionalTimeConfig(cfg);
  const tz = document.getElementById('regional-timezone');
  const loc = document.getElementById('regional-locale');
  const df = document.getElementById('regional-date-format');
  const tf = document.getElementById('regional-time-format');
  if (tz) tz.value = regionalTimeSettings.timezone;
  if (loc) loc.value = regionalTimeSettings.locale;
  if (df) df.value = regionalTimeSettings.dateFormat;
  if (tf) tf.value = regionalTimeSettings.timeFormat;
  updateRegionalTimeSummary();
 }

 function updateRegionalTimeSummary() {
  const summary = document.getElementById('regional-time-summary');
  if (!summary) return;
  const cfg = regionalTimeSettings || REGIONAL_TIME_DEFAULTS;
  summary.innerText = [cfg.timezone, cfg.locale, cfg.dateFormat, cfg.timeFormat].join(' · ');
 }

 function openRegionalTimeModal() {
  const modal = document.getElementById('regional-time-modal');
  if (!modal) return;
  applyRegionalTimeSettings(regionalTimeSettings || REGIONAL_TIME_DEFAULTS);
  const modalStatus = document.getElementById('regional-time-modal-status');
  if (modalStatus) modalStatus.innerText = currentLang === 'en' ? 'Current saved configuration.' : 'Konfigurasi tersimpan saat ini.';
  showModalAnimated(modal);
  lucide.createIcons();
 }

 function closeRegionalTimeModal() {
  hideModalAnimated(document.getElementById('regional-time-modal'));
 }

 async function loadRegionalTimeSettings() {
  const status = document.getElementById('regional-time-status');
  // READ path is intentionally public. Developer authorization is NOT required here.
  applyRegionalTimeSettings(REGIONAL_TIME_DEFAULTS);
  if (status) status.innerText = currentLang === 'en' ? 'Loading Regional & Time...' : 'Memuat Regional & Time...';
  try {
   const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?action=getRegionalTimeSettings&t=' + Date.now());
   const result = await response.json();
   if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load Regional & Time.' : 'Gagal memuat Regional & Time.'));
   applyRegionalTimeSettings(result.data);
   regionalTimeServerLoaded = true;
   cacheRegionalTimeSettings(regionalTimeSettings);
   if (status) status.innerText = currentLang === 'en'
    ? 'Saved: ' + regionalTimeSettings.timezone + ' · ' + regionalTimeSettings.locale
    : 'Tersimpan: ' + regionalTimeSettings.timezone + ' · ' + regionalTimeSettings.locale;
  } catch (err) {
   console.warn('Regional & Time read fallback:', err);
   const cached = readCachedRegionalTimeSettings();
   if (cached) {
    applyRegionalTimeSettings(cached);
    if (status) status.innerText = currentLang === 'en'
     ? 'Last saved: ' + regionalTimeSettings.timezone + ' · ' + regionalTimeSettings.locale
     : 'Tersimpan terakhir: ' + regionalTimeSettings.timezone + ' · ' + regionalTimeSettings.locale;
   } else {
    applyRegionalTimeSettings(REGIONAL_TIME_DEFAULTS);
    if (status) status.innerText = currentLang === 'en' ? 'Default: Asia/Jakarta · id-ID' : 'Default: Asia/Jakarta · id-ID';
   }
  }
 }

 async function saveRegionalTimeSettings() {
  const status = document.getElementById('regional-time-status');
  const btn = document.getElementById('btn-save-regional-time');
  const cfg = normalizeRegionalTimeConfig({
   timezone: document.getElementById('regional-timezone')?.value,
   locale: document.getElementById('regional-locale')?.value,
   dateFormat: document.getElementById('regional-date-format')?.value,
   timeFormat: document.getElementById('regional-time-format')?.value
  });

  // Saving the already-active configuration is a no-op. This prevents F5/reopen from
  // forcing a fresh Developer login when the user simply clicks Save without changes.
  if (regionalTimeServerLoaded && regionalTimeConfigEquals(cfg, regionalTimeSettings)) {
   cacheRegionalTimeSettings(cfg);
   if (status) status.innerText = currentLang === 'en'
    ? 'Saved: ' + cfg.timezone + ' · ' + cfg.locale
    : 'Tersimpan: ' + cfg.timezone + ' · ' + cfg.locale;
   const modalStatus = document.getElementById('regional-time-modal-status');
   if (modalStatus) modalStatus.innerText = status ? status.innerText : '';
   setTimeout(() => closeRegionalTimeModal(), 150);
   return;
  }

  // WRITE path remains Developer-protected. This preserves the existing security boundary.
  if (!isDeveloperUnlocked()) {
   if (status) status.innerText = currentLang === 'en' ? 'Developer Access required to save changes.' : 'Akses Developer diperlukan untuk menyimpan perubahan.';
   return;
  }
  if (btn) btn.disabled = true;
  try {
   const result = await postCentralAuthenticated({ action: 'updateRegionalTimeSettings', ...cfg }, { developerOnly: true });
   if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save Regional & Time.' : 'Gagal menyimpan Regional & Time.'));
   applyRegionalTimeSettings(result.data || cfg);
   regionalTimeServerLoaded = true;
   cacheRegionalTimeSettings(regionalTimeSettings);
   if (status) status.innerText = currentLang === 'en'
    ? 'Saved: ' + cfg.timezone + ' · ' + cfg.locale
    : 'Tersimpan: ' + cfg.timezone + ' · ' + cfg.locale;
   const modalStatus = document.getElementById('regional-time-modal-status');
   if (modalStatus) modalStatus.innerText = status ? status.innerText : '';
   updateRegionalTimeSummary();
   setTimeout(() => closeRegionalTimeModal(), 250);
  } catch (err) {
   console.error('Regional & Time save failed:', err);
   if (status) status.innerText = err.message || (currentLang === 'en' ? 'Failed to save Regional & Time.' : 'Gagal menyimpan Regional & Time.');
  } finally {
   if (btn) btn.disabled = false;
  }
 }

 function setLanguage(lang) {
 currentLang = lang;
 const cardId = document.getElementById('lang-card-id');
 const cardEn = document.getElementById('lang-card-en');
 const checkId = document.getElementById('check-lang-id');
 const checkEn = document.getElementById('check-lang-en');

 // DIBUAT DEFENSIF (Split 3 Dashboard, 23 Agu): keempat elemen ini hidup di dalam
 // tab-settings, yang tidak ada di dashboard Member/Supervisor. setLanguage() dipanggil
 // PALING PERTAMA di DOMContentLoaded utama -- tanpa guard, SELURUH aplikasi gagal start
 // di kedua dashboard turunan. Guard di sini TIDAK mengubah perilaku Developer sama sekali.
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

 document.querySelectorAll('[data-i18n]').forEach(el => {
  const key = el.getAttribute('data-i18n');
  if (translations[lang][key]) {
  el.innerText = translations[lang][key];
  }
 });

 document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
  const key = el.getAttribute('data-i18n-placeholder');
  if (translations[lang][key]) {
  el.placeholder = translations[lang][key];
  }
 });

 document.querySelectorAll('[data-i18n-title]').forEach(el => {
  const key = el.getAttribute('data-i18n-title');
  if (translations[lang][key]) el.title = translations[lang][key];
 });

 document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
  const key = el.getAttribute('data-i18n-aria-label');
  if (translations[lang][key]) el.setAttribute('aria-label', translations[lang][key]);
 });

 const activeTab = document.querySelector('aside nav button.nav-item-active');
 if (activeTab) {
  const tabId = activeTab.id.replace('btn-', '');
  updateTabTitles(tabId);
 }

 if(globalRawData.length > 0) {
  applyGlobalFilter();
 }
 if(globalIssueRawData.length > 0) {
  renderIssueTable(globalIssueRawData);
 }
 if(globalValidasiData.length > 0) {
  renderValidasiTable();
 }
 if(globalBlockModelData.length > 0) {
  renderBlockModelChart();
  renderBlockModelTable();
  updateBlockModelSummaryCard();
 }

 // ONE-DOOR I18N: refresh dynamic views from the central language switch.
 try {
  if (typeof renderMonthlyTrend === 'function') renderMonthlyTrend();
  if (typeof renderReconciliation === 'function' && globalRawData.length > 0) renderReconciliation();
  if (typeof renderBargeShipmentList === 'function') renderBargeShipmentList();
  if (typeof renderChatMessages === 'function') renderChatMessages();
  if (typeof loadMembersFromSheet === 'function' && globalMemberData.length > 0) loadMembersFromSheet();
  const pitHistoryModal = document.getElementById('pitactual-history-modal');
  if (pitHistoryModal && !pitHistoryModal.classList.contains('hidden') && typeof renderPitActualHistoryTable === 'function') renderPitActualHistoryTable();
  if (typeof renderRcaLogList === 'function') renderRcaLogList();
  // Compact panel: refresh dynamic status text when language changes.
  try {
   const compactStatus = document.getElementById('compact-preview-status');
   const compactSelect = document.getElementById('compact-sheet-select');
   if (compactStatus && compactSelect && compactPreviewState && compactPreviewState.sheet === compactSelect.value) {
    if (compactPreviewState.blankRows.length > 0) {
     compactStatus.textContent = translations[lang].compact_status_ready
      .replace('{count}',String(compactPreviewState.blankRows.length))
      .replace('{sheet}',compactPreviewState.sheet)
      .replace('{rows}',String(compactPreviewState.totalRows))
      .replace('{list}',compactPreviewState.blankRows.join(', '));
    } else if (compactPreviewState.sheet) {
     compactStatus.textContent = translations[lang].compact_status_none
      .replace('{sheet}',compactPreviewState.sheet)
      .replace('{rows}',String(compactPreviewState.totalRows));
    }
   }
  } catch (ignoreCompactI18n) {}
  const profModal = document.getElementById('professional-report-modal');
  if (profModal && !profModal.classList.contains('hidden') && typeof buildProfessionalReportHtml === 'function') {
   const preview = document.getElementById('professional-report-preview');
   if (preview) preview.innerHTML = buildProfessionalReportHtml();
  }
  const periodicModal = document.getElementById('periodic-report-modal');
  if (periodicModal && !periodicModal.classList.contains('hidden') && typeof buildPeriodicReportHtml === 'function') {
   const startDate = document.getElementById('periodic-report-start')?.value;
   const endDate = document.getElementById('periodic-report-end')?.value;
   const preview = document.getElementById('periodic-report-preview');
   if (preview && startDate && endDate) preview.innerHTML = buildPeriodicReportHtml(startDate, endDate);
  }
  if (activeTab && activeTab.id === 'btn-trend' && typeof switchTrendView === 'function') switchTrendView(currentTrendView);
  if (activeTab && activeTab.id === 'btn-rekonsiliasi' && typeof switchRekonView === 'function') switchRekonView(currentRekonView);
 } catch (i18nRefreshErr) {
  console.warn('I18N dynamic refresh warning:', i18nRefreshErr);
 }
 applyJsaLanguage(lang);
 updateDeveloperAccessUI();
 }

 function updateTabTitles(tabName) {
 const titleMap = {
  'ringkasan': currentLang === 'en' ? 'Daily Geologist Report' : 'Laporan Harian Geologist',
  'trend': currentLang === 'en' ? 'Visual & Trend Report' : 'Report Visual & Analisis Tren',
  'tabel': currentLang === 'en' ? 'Mining Digging Database Details' : 'Detail Database Digging Tambang',
  'rekonsiliasi': currentLang === 'en' ? 'Production & Reserve Reconciliation' : 'Rekonsiliasi Produksi & Cadangan',
  'validasi': currentLang === 'en' ? 'Test Pit Assay Validation' : 'Validasi Assay Test Pit',
  'barging': currentLang === 'en' ? 'Barge Loading & Shipment' : 'Pemuatan Tongkang & Shipment',
  'issue': currentLang === 'en' ? 'Issue & Action Plan Management' : 'Manajemen Issue & Action Plan',
  'kpimember': currentLang === 'en' ? 'Geology Team Member KPI & Performance' : 'Kinerja & KPI Member Tim Geologi',
  'chat': currentLang === 'en' ? 'Team Chat' : 'Chat Tim',
  'settings': currentLang === 'en' ? 'Dashboard Settings & Preferences' : 'Pengaturan Dashboard & Preferences'
 };
 const subtitleMap = {
  'ringkasan': currentLang === 'en' ? "Today's mining production & grade performance summary" : 'Ringkasan performa produksi & kadar tambang hari ini',
  'trend': currentLang === 'en' ? 'Historical Tonnage & Mineral Grade Fluctuation Charts' : 'Grafik Historis Fluktuasi Tonase & Kadar Mineral',
  'tabel': currentLang === 'en' ? 'Full detail of daily production & assay data, per row' : 'Rincian lengkap data produksi & assay harian per baris',
  'rekonsiliasi': currentLang === 'en' ? 'Match production tonnage, shipment destinations, and geological model reserve estimates' : 'Sinkron data produksi, tujuan kapal, dan estimasi model geologi',
  'validasi': currentLang === 'en' ? 'Assay results per depth (1-5m) for each test pit' : 'Hasil assay per kedalaman (1-5m) tiap titik test pit',
  'barging': currentLang === 'en' ? 'Barge loading progress per shipment, from Dome to vessel' : 'Progress pemuatan tongkang per shipment, dari Dome sampai kapal',
  'issue': currentLang === 'en' ? 'Field Evaluation & Corrective Actions' : 'Evaluasi Lapangan & Tindakan Perbaikan',
  'kpimember': currentLang === 'en' ? 'Field Geologist Performance Monitoring' : 'Monitoring Kinerja Geologist Lapangan',
  'chat': currentLang === 'en' ? 'Internal Team Communication -- Synced to Google Sheets' : 'Komunikasi Internal Tim -- Tersinkron ke Google Sheets',
  'settings': currentLang === 'en' ? 'Appearance & Data Connection Settings' : 'Pengaturan Tampilan & Koneksi Data'
 };

 document.getElementById('page-title').innerText = titleMap[tabName];
 document.getElementById('page-subtitle').innerText = subtitleMap[tabName];
 }

 function toggleMobileSidebar() {
 const sidebar = document.getElementById('main-sidebar');
 const overlay = document.getElementById('mobile-sidebar-overlay');
 const isOpen = !sidebar.classList.contains('-translate-x-full');
 if (isOpen) {
  closeMobileSidebar();
 } else {
  sidebar.classList.remove('-translate-x-full');
  overlay.classList.remove('hidden');
 }
 }

 function closeMobileSidebar() {
 const sidebar = document.getElementById('main-sidebar');
 const overlay = document.getElementById('mobile-sidebar-overlay');
 sidebar.classList.add('-translate-x-full');
 overlay.classList.add('hidden');
 }

 // BARU (23 Agu, disederhanakan sesuai masukan user -- logo pickaxe sendiri jadi tombol
 // toggle, bukan tombol chevron terpisah): ciutkan sidebar desktop jadi ikon saja (semua
 // navigasi TETAP berfungsi penuh, cuma teks labelnya yang disembunyikan lewat CSS
 // ".sidebar-label"). Ikon pickaxe TIDAK ditukar-tukar (tetap identitas brand) -- cukup
 // hover tooltip yang kasih tahu fungsinya. State disimpan di localStorage per
 // browser/device (murni preferensi tampilan, bukan data sensitif) -- persisten lintas
 // reload/sesi.
 function toggleSidebarCollapse() {
 const sidebar = document.getElementById('main-sidebar');
 if (!sidebar) return;
 const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
 try { localStorage.setItem('mine_sidebar_collapsed', isCollapsed ? '1' : '0'); } catch (e) { /* localStorage tidak tersedia -- state tetap jalan di sesi ini, cuma tidak persisten */ }
 }
 function initSidebarCollapseState() {
 try {
  const saved = localStorage.getItem('mine_sidebar_collapsed');
  if (saved === '1') {
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar) sidebar.classList.add('sidebar-collapsed');
  }
 } catch (e) { /* localStorage tidak tersedia -- default tetap expanded, aman */ }
 }

 // Helper animasi buka/tutup modal (fade + scale) -- dipakai bersama oleh semua modal
 // supaya kalau suatu saat mau ganti gaya animasi, cukup ubah di 1 tempat ini.
 function showModalAnimated(modal) {
 if (!modal) return;
 modal.classList.remove('hidden');
 modal.classList.add('flex');
 modal.classList.remove('modal-anim-in');
 void modal.offsetWidth; // paksa reflow supaya browser sempat "melihat" state awal (belum animasi) sebelum ditransisikan
 modal.classList.add('modal-anim-in');
 }
 function hideModalAnimated(modal) {
 if (!modal) return;
 modal.classList.remove('modal-anim-in');
 setTimeout(() => {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
 }, 200);
 }

 function toggleRekonFilterPanel() {
 const panel = document.getElementById('rekon-filter-panel');
 panel.classList.toggle('hidden');
 panel.classList.toggle('flex');
 }

 document.addEventListener('click', function(e) {
 const panel = document.getElementById('rekon-filter-panel');
 const toggleBtn = document.getElementById('rekon-filter-toggle-btn');
 if (!panel || panel.classList.contains('hidden')) return;
 if (panel.contains(e.target) || toggleBtn.contains(e.target)) return;
 panel.classList.add('hidden');
 panel.classList.remove('flex');
 });

 let currentActiveTab = 'ringkasan';

 function switchTab(tabName) {
 if (window.innerWidth < 768) { closeMobileSidebar(); }
 currentActiveTab = tabName;
 const tabs = ['ringkasan', 'trend', 'tabel', 'rekonsiliasi', 'validasi', 'barging', 'issue', 'kpimember', 'chat', 'settings'];
 // DIBUAT DEFENSIF (Split 3 Dashboard, 23 Agu): dashboard turunan (Member/Supervisor) tidak
 // punya semua 10 tab -- guard null WAJIB di sini, atau loop berhenti total di elemen
 // pertama yang tidak ada (TypeError pada .classList null), bikin SEMUA tab lain ikut tidak
 // bisa dibuka. Fix ini identik di ketiga file, tidak mengubah perilaku Developer sama sekali.
 tabs.forEach(t => {
  const tabEl = document.getElementById('tab-' + t);
  const btnEl = document.getElementById('btn-' + t);
  if (tabEl) tabEl.classList.add('hidden');
  if (btnEl) btnEl.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all nav-item-inactive";
 });

 const targetTabEl = document.getElementById('tab-' + tabName);
 const targetBtnEl = document.getElementById('btn-' + tabName);
 if (targetTabEl) targetTabEl.classList.remove('hidden');
 if (targetBtnEl) targetBtnEl.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all nav-item-active";

 if (tabName === 'rekonsiliasi') {
  renderReconciliation();
  fetchBlockModelData();
  fetchValidasiData();
  fetchRcaLogData();
  fetchPitActualData();
  fetchBargeShipmentData(); // dipakai juga utk hitung F3/F4 (Total Plant/Tonase Aktual)
 }

 if (tabName === 'trend') {
  fetchBlockModelData();
 }

 if (tabName === 'validasi') {
  fetchValidasiData();
 }

 if (tabName === 'kpimember') {
  fetchJsaLogData();
  updateKpiButtonsVisibility();
 }

 if (tabName === 'chat') {
  fetchChatData().then(() => { chatLastSeenRow = globalChatData.length ? Number(globalChatData[globalChatData.length - 1]._row || 0) : 0; updateChatUnreadBadge(); });
  scrollChatToBottom();
 }

 // Barging: data di-fetch LAZY (baru sekali diambil saat tab ini pertama dibuka), bukan
 // ikut nimbrung di stagger fetch awal DOMContentLoaded -- supaya tidak menambah beban
 // loading awal untuk fitur yang belum tentu dibuka semua orang.
 if (tabName === 'barging') {
  fetchBargeShipmentData();
 }

 updateTabTitles(tabName);
 }

 function setTheme(theme) {
 const body = document.body;
 const darkCard = document.getElementById('theme-card-dark');
 const whiteCard = document.getElementById('theme-card-white');
 const checkDark = document.getElementById('check-dark');
 const checkWhite = document.getElementById('check-white');

 // DIBUAT DEFENSIF (Split 3 Dashboard, 23 Agu): sama pola dgn setLanguage() -- keempat
 // elemen ini hidup di tab-settings, tidak ada di Member/Supervisor. Saat ini setTheme()
 // cuma dipanggil dari tombol yg juga ikut terpotong (jadi technically dead code utk
 // kedua dashboard itu), tapi guard tetap dipasang supaya aman kalau nanti toggle
 // bahasa/tema dipindah ke header (rencana yg belum dieksekusi).
 if (darkCard && whiteCard && checkDark && checkWhite) {
 if (theme === 'white') {
  body.classList.remove('theme-dark');
  body.classList.add('theme-white');
  darkCard.classList.remove('border-blue-500');
  darkCard.classList.add('border-slate-800');
  whiteCard.classList.remove('border-slate-300');
  whiteCard.classList.add('border-blue-500');
  checkDark.classList.add('hidden');
  checkWhite.classList.remove('hidden');
  checkWhite.classList.add('text-blue-500');
  updateChartTheme('#475569');
 } else {
  body.classList.remove('theme-white');
  body.classList.add('theme-dark');
  whiteCard.classList.remove('border-blue-500');
  whiteCard.classList.add('border-slate-300');
  darkCard.classList.remove('border-slate-800');
  darkCard.classList.add('border-blue-500');
  checkWhite.classList.add('hidden');
  checkDark.classList.remove('hidden');
  updateChartTheme('#94a3b8');
 }
 } else {
 // Elemen toggle tidak ada (Member/Supervisor) -- tetap terapkan class tema ke body
 // dan re-theme chart, cuma lewati bagian UI kartu/centang yang memang tidak ada.
 if (theme === 'white') {
  body.classList.remove('theme-dark');
  body.classList.add('theme-white');
  updateChartTheme('#475569');
 } else {
  body.classList.remove('theme-white');
  body.classList.add('theme-dark');
  updateChartTheme('#94a3b8');
 }
 }
 // Legend HTML manual materialChart TIDAK ikut lewat updateChartTheme (itu jalur
 // Chart.js) -- re-render manual di sini pakai data TERAKHIR yang sudah ada di chart,
 // supaya warnanya ikut ganti pas user pindah tema tanpa mereset ke nol.
 if (materialChart) renderMaterialLegend(materialChart.data.datasets[0].data);
 }

 // BARU (Split 3 Dashboard, 23 Agu): toggle tema ringkas utk header -- dipakai Member &
 // Supervisor (Settings mereka sudah dihapus, jadi tidak ada lagi kartu Dark/White di
 // sana). Developer TETAP pakai toggle asli di Settings (tidak diganti), tombol header ini
 // cuma dirender utk Member/Supervisor lewat marker ROLE -- fungsi ini aman dipanggil dari
 // dashboard manapun karena setTheme() sendiri sudah defensif thdp elemen yg tidak ada.
 function toggleHeaderTheme() {
 const goingWhite = !document.body.classList.contains('theme-white');
 const newTheme = goingWhite ? 'white' : 'dark';
 setTheme(newTheme);
 const icon = document.getElementById('header-theme-toggle-icon');
 if (icon) {
  icon.setAttribute('data-lucide', newTheme === 'white' ? 'moon' : 'sun');
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
 }
 }

 // FIX (23 Agu): legend HTML manual utk materialChart -- gantikan legend Chart.js bawaan
 // yang warnanya tidak konsisten di tema Dark. Warna teks dipilih manual berdasarkan
 // tema aktif (body.theme-white), BUKAN lewat Chart.js sama sekali -- kontrol penuh,
 // dijamin sama persis di semua item, tidak ada lagi ambiguitas.
 function renderMaterialLegend(values) {
 const el = document.getElementById('material-chart-legend');
 if (!el) return;
 const labels = ['Saprolit', 'Limonit', 'Low Grade', 'Waste'];
 const colors = ['#059669', '#0ea5e9', '#f59e0b', '#475569'];
 const isWhite = document.body.classList.contains('theme-white');
 const textColor = isWhite ? '#334155' : '#e2e8f0';
 const total = values.reduce(function(a, b) { return a + (Number(b) || 0); }, 0);
 el.innerHTML = labels.map(function(label, i) {
  const value = Number(values[i]) || 0;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  return `<span style="display:inline-flex;align-items:center;gap:6px;color:${textColor};font-weight:500;">
   <span style="width:10px;height:10px;border-radius:9999px;background:${colors[i]};display:inline-block;flex-shrink:0;"></span>
   ${label} ${pct}%
  </span>`;
 }).join('');
 }

 function updateChartTheme(textColor) {
 const charts = [materialChart, gradeChart, trendTonaseChart, trendNiChart, smChart, rekonChart, blockModelChart, validasiChart, trendMonthlyChart];
 charts.forEach(c => {
  if (c) {
  // materialChart TIDAK punya legend Chart.js lagi (legend HTML manual, lihat
  // renderMaterialLegend) -- baris ini otomatis dilewati utknya (c.options.plugins.legend.labels
  // tidak ada), harmless, cuma berlaku ke chart lain yang masih pakai legend Chart.js bawaan.
  if (c.options.plugins.legend && c.options.plugins.legend.labels) {
   c.options.plugins.legend.labels.color = textColor;
  }
  if (c.options.scales) {
   if (c.options.scales.x) c.options.scales.x.ticks.color = textColor;
   if (c.options.scales.y) c.options.scales.y.ticks.color = textColor;
  }
  c.update();
  }
 });
 }

 function initCharts() {
 const ctx1 = document.getElementById('materialChart').getContext('2d');
 materialChart = new Chart(ctx1, {
  type: 'doughnut',
  data: {
  labels: ['Saprolit', 'Limonit', 'Low Grade', 'Waste'],
  datasets: [{
   data: [0, 0, 0, 0],
   backgroundColor: ['#059669', '#0ea5e9', '#f59e0b', '#475569'],
   borderWidth: 0
  }]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
   // FIX (23 Agu): legend Chart.js bawaan dimatikan total -- diganti legend HTML manual
   // (#material-chart-legend, diisi via renderMaterialLegend()) krn warna teks legend
   // bawaan Chart.js terbukti tidak konsisten di tema Dark (sebagian item terang,
   // sebagian redup, walau cuma 1 nilai warna seragam yg di-set -- perilaku internal
   // Chart.js yg tidak bisa diandalkan utk kasus ini).
   legend: { display: false }
  },
  cutout: '68%'
  }
 });
 renderMaterialLegend([0, 0, 0, 0]);

 const ctx2 = document.getElementById('gradeChart').getContext('2d');
 gradeChart = new Chart(ctx2, {
  data: {
  labels: [],
  datasets: [
   {
   type: 'bar',
   label: 'Kadar Ni Actual (%)',
   data: [],
   backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
   borderRadius: 6,
   barPercentage: 0.45
   },
   {
   // BARU: garis Target Ship Ni% MIN (dulunya 1 garis tetap "Target Ni (1.50%)" hardcode).
   // Label diisi ulang di updateDashboard() sesuai globalCOGConfig.Target_Ship_Ni_Min.
   type: 'line',
   label: 'Target Kapal Min',
   data: [],
   borderColor: '#f59e0b',
   borderWidth: 2,
   borderDash: [5, 5],
   pointRadius: 3,
   pointBackgroundColor: '#f59e0b',
   fill: false
   },
   {
   // BARU: garis Target Ship Ni% MAX -- bareng garis Min, membentuk range spesifikasi
   // jual kapal (bukan target tunggal), sesuai globalCOGConfig.Target_Ship_Ni_Max.
   type: 'line',
   label: 'Target Kapal Max',
   data: [],
   borderColor: '#fb923c',
   borderWidth: 2,
   borderDash: [2, 3],
   pointRadius: 3,
   pointBackgroundColor: '#fb923c',
   fill: false
   }
  ]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
   y: {
   min: 0,
   max: 2.0,
   grid: { color: 'rgba(150, 150, 150, 0.08)' },
   ticks: { color: '#94a3b8', stepSize: 0.2, font: { size: 10 } }
   },
   x: {
   grid: { display: false },
   ticks: { color: '#94a3b8', font: { size: 10 } }
   }
  },
  plugins: {
   legend: {
   position: 'top',
   align: 'end',
   labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 }, filter: function(item) { return item.text.includes('Target'); } }
   }
  }
  }
 });

 // DIBUAT DEFENSIF (Split 3 Dashboard, 23 Agu): 6 canvas di bawah ini (trendTonaseChart,
 // trendNiChart, trendMonthlyChart, smChart, rekonChart, blockModelChart) hidup di tab-trend
 // dan tab-rekonsiliasi -- TIDAK ADA di dashboard Member. initCharts() dipanggil paling awal
 // di DOMContentLoaded, jadi kalau tidak dijaga, baris pertama yang crash akan menghentikan
 // SELURUH inisialisasi aplikasi utk Member. Semua titik PEMAKAIAN chart ini di file lain
 // SUDAH dijaga if(chartVar) -- variabel global yang sengaja dibiarkan undefined di sini
 // otomatis aman dipakai di titik-titik itu.
 const elTrendTonase = document.getElementById('trendTonaseChart');
 if (elTrendTonase) {
 const ctx3 = elTrendTonase.getContext('2d');
 trendTonaseChart = new Chart(ctx3, {
  type: 'line',
  data: {
  labels: [],
  datasets: [{
   label: currentLang === 'en' ? 'Total Tonnage (Tons)' : 'Total Tonase (Ton)',
   data: [],
   borderColor: '#0ea5e9',
   backgroundColor: 'rgba(14, 165, 233, 0.14)',
   fill: true,
   tension: 0.35,
   pointRadius: 3.5,
   pointHoverRadius: 7,
   pointBackgroundColor: '#3b82f6',
   pointBorderColor: '#ffffff',
   pointBorderWidth: 1.5
  }]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
   y: { grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
   x: { grid: { color: 'rgba(150, 150, 150, 0.04)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
  },
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }
  }
 });
 }

 const elTrendNi = document.getElementById('trendNiChart');
 if (elTrendNi) {
 const ctx4 = elTrendNi.getContext('2d');
 trendNiChart = new Chart(ctx4, {
  type: 'line',
  data: {
  labels: [],
  datasets: [
   {
   label: 'Rata-rata Ni %',
   data: [],
   borderColor: '#10b981',
   backgroundColor: 'rgba(16, 185, 129, 0.12)',
   fill: true,
   tension: 0.35,
   pointRadius: 3.5,
   pointHoverRadius: 7,
   pointBackgroundColor: '#10b981',
   pointBorderColor: '#ffffff',
   pointBorderWidth: 1.5
   },
   {
   label: 'Cut-off Minimum (1.30%)',
   data: [],
   borderColor: '#f59e0b',
   borderWidth: 2,
   borderDash: [4, 4],
   pointRadius: 0,
   fill: false
   }
  ]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
   y: { min: 0.5, max: 2.5, grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
   x: { grid: { color: 'rgba(150, 150, 150, 0.04)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
  },
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }
  }
 });
 }

 // BARU: trendMonthlyChart -- bar chart Tonase per bulan (dual-axis line untuk Ni%),
 // 6 bulan terakhir yang punya data. Dipakai view toggle "Bulan ke Bulan" (Visual & Trend).
 const elTrendMonthly = document.getElementById('trendMonthlyChart');
 if (elTrendMonthly) {
 const ctx4b = elTrendMonthly.getContext('2d');
 trendMonthlyChart = new Chart(ctx4b, {
  data: {
  labels: [],
  datasets: [
   {
   type: 'bar',
   label: currentLang === 'en' ? 'Tonnage (Tons)' : 'Tonase (Ton)',
   data: [],
   backgroundColor: 'rgba(6, 182, 212, 0.55)',
   borderRadius: 6,
   borderSkipped: false,
   yAxisID: 'y'
   },
   {
   type: 'line',
   label: 'Rata-rata Ni %',
   data: [],
   borderColor: '#10b981',
   backgroundColor: '#10b981',
   tension: 0.35,
   pointRadius: 4,
   pointHoverRadius: 7,
   pointBackgroundColor: '#10b981',
   pointBorderColor: '#ffffff',
   pointBorderWidth: 1.5,
   yAxisID: 'y1'
   }
  ]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
   y: { position: 'left', grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } }, title: { display: true, text: currentLang === 'en' ? 'Tons' : 'Ton', color: '#64748b', font: { size: 10 } } },
   y1: { position: 'right', min: 0.5, max: 2.5, grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } }, title: { display: true, text: 'Ni %', color: '#64748b', font: { size: 10 } } },
   x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
  },
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }
  }
 });
 }

 const elSm = document.getElementById('smChart');
 if (elSm) {
 const ctx5 = elSm.getContext('2d');
 smChart = new Chart(ctx5, {
  type: 'bar',
  data: {
  labels: [],
  datasets: [{
   label: 'Rata-rata SM (SiO2/MgO)',
   data: [],
   backgroundColor: '#f59e0b',
   borderRadius: 8,
   borderSkipped: false,
   barPercentage: 0.55
  }]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
   y: { grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
   x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
  },
  plugins: { legend: { display: false } }
  }
 });
 }

 const elRekon = document.getElementById('rekonChart');
 if (elRekon) {
 const ctx6 = elRekon.getContext('2d');
 rekonChart = new Chart(ctx6, {
  type: 'bar',
  data: {
  labels: [],
  datasets: [
   { label: 'EFO', data: [], backgroundColor: '#3b82f6', borderRadius: 4, stack: 'a' },
   { label: 'ETO', data: [], backgroundColor: '#10b981', borderRadius: 4, stack: 'a' },
   { label: 'Direct', data: [], backgroundColor: '#f59e0b', borderRadius: 4, stack: 'a' },
   { label: 'Disposal', data: [], backgroundColor: '#64748b', borderRadius: 4, stack: 'a' },
   { label: 'Belum Dikirim', data: [], backgroundColor: '#ef4444', borderRadius: 4, stack: 'a' }
  ]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
   y: { stacked: true, grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
   x: { stacked: true, grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
  },
  plugins: {
   legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } }
  }
  }
 });
 }

 const ctx7 = document.getElementById('validasiChart').getContext('2d');
 validasiChart = new Chart(ctx7, {
  type: 'bar',
  data: {
  labels: [],
  datasets: [{ label: 'Ni % rata-rata', data: [], backgroundColor: '#10b981', borderRadius: 6, barPercentage: 0.55, maxBarThickness: 64 }]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
   y: { grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
   x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
  },
  plugins: { legend: { display: false } }
  }
 });

 const elBlockModel = document.getElementById('blockModelChart');
 if (elBlockModel) {
 const ctx8 = elBlockModel.getContext('2d');
 blockModelChart = new Chart(ctx8, {
  type: 'bar',
  data: {
  labels: [],
  datasets: [
   { label: 'Estimasi (Ton)', data: [], backgroundColor: '#3b82f6', borderRadius: 4 },
   // BARU: series GC (Grade Control) -- SUM Tonase per Blok dari Produksi_GC (dihitung
   // client-side lewat computeGcTonaseByBlok(), sheet BlockModel tidak simpan ini). Ditaruh
   // di antara Estimasi dan Realisasi supaya urutan visual mengikuti rantai BM->GC->Pit Actual.
   { label: 'GC (Ton)', data: [], backgroundColor: '#a855f7', borderRadius: 4 },
   { label: 'Realisasi (Ton)', data: [], backgroundColor: [], borderRadius: 4 }
  ]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
   y: { grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
   x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
  },
  plugins: {
   legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } }
  }
  }
 });
 }
 }

 // BARU: SUM Tonase per Blok+Pit dari Produksi_GC (globalRawData) -- untuk series GC di
 // chart Block Model vs Actual. Granularitas Blok+Pit WAJIB sama dengan Estimasi_tonase &
 // Realisasi_Tonase di BlockModel (1 baris = 1 Blok+Pit, misal "L-01 Avanza"), konsisten
 // dengan pola computeRealisasiKimiaByBlok() -- kalau cuma dikelompokkan per Blok saja,
 // semua Pit dalam 1 Blok salah dapat angka gabungan yang sama (bug yang pernah ditemukan).
 async function fetchDataFromGoogleSheets(isManual = false) {
 // Jalur UTAMA: Apps Script (GOOGLE_SCRIPT_READ_URL?sheet=produksi) -- sama seperti
 // Member/Issue/Validasi/BlockModel yang sudah terbukti stabil, tidak butuh proxy pihak ketiga.
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=produksi&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load production data.' : 'Gagal memuat data produksi'));
  applyFetchedProductionData(result.data || []);
  return;
 } catch (err) {
  console.error('Gagal memuat data produksi via Apps Script, coba jalur CSV cadangan:', err);
 }

 // Jalur CADANGAN (fallback) -- CSV publish langsung, lalu proxy pihak ketiga kalau itu pun
 // gagal. Dipertahankan sebagai jaring pengaman kalau Apps Script sendiri sedang bermasalah,
 // bukan lagi jalur utama seperti sebelumnya.
 const noCacheUrl = ORIGINAL_CSV_URL + '&t=' + new Date().getTime();
 const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(noCacheUrl);

 try {
  let response = await fetchWithTimeout(noCacheUrl);
  if (!response.ok) throw new Error("Direct fetch failed");
  let csvText = await response.text();
  parseAndRenderCSV(csvText);
 } catch (err) {
  try {
  let responseProxy = await fetchWithTimeout(proxyUrl);
  let csvText = await responseProxy.text();
  parseAndRenderCSV(csvText);
  } catch (proxyErr) {
  const isTimeout = err.name === 'AbortError' || proxyErr.name === 'AbortError';
  showError(isTimeout ? "Server Tidak Merespons (Timeout)" : "Offline");
  }
 }
 }

 function parseAccuracyValue_(raw) {
 if (raw === null || raw === undefined) return null;
 const s = String(raw).trim();
 if (!s || s === '-') return null;
 const m = s.match(/-?\d+(?:[.,]\d+)?/);
 if (!m) return null;
 const n = parseFloat(m[0].replace(',', '.'));
 return isNaN(n) ? null : n;
 }

 function renderLeaderboard() {
 const listEl = document.getElementById('leaderboard-list');
 if (!listEl) return;

 const ranked = (globalMemberData || [])
  .map(item => {
  const member = {};
  Object.keys(item).forEach(k => member[k.trim().toLowerCase()] = item[k]);
  return {
   nama: member['nama'] || member['name'] || (currentLang === 'en' ? 'No Name' : 'Tanpa Nama'),
   jabatan: member['jabatan'] || member['role'] || '-',
   target: member['target'] || '-',
   inspeksi: member['inspeksi'] || '-',
   accuracyRaw: member['accuracy'] || '-',
   accuracyNum: parseAccuracyValue_(member['accuracy'])
  };
  })
  .filter(m => m.accuracyNum !== null)
  .sort((a, b) => b.accuracyNum - a.accuracyNum);

 if (ranked.length === 0) {
  listEl.innerHTML = `<p class="text-[11px] text-slate-500 font-medium">${translations[currentLang].leaderboard_empty}</p>`;
  return;
 }

 const medalByRank = { 1: '🥇', 2: '🥈', 3: '🥉' };
 listEl.innerHTML = ranked.map((m, idx) => {
  const rank = idx + 1;
  const medal = medalByRank[rank] || '';
  const rankBadgeClass = rank <= 3
   ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
   : 'bg-slate-800/60 text-slate-400 border-slate-700/60';
  return `<div class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-900/40 border border-slate-700/50 text-xs">
   <div class="flex items-center gap-3 min-w-0">
   <span class="flex items-center justify-center w-7 h-7 rounded-lg border font-bold text-[11px] shrink-0 ${rankBadgeClass}">${medal || rank}</span>
   <div class="min-w-0">
    <p class="font-semibold text-title truncate">${m.nama}</p>
    <p class="text-[10px] text-slate-500 font-medium truncate">${m.jabatan}${m.target !== '-' ? ' · ' + (currentLang === 'en' ? 'Target' : 'Target') + ': ' + m.target : ''}${m.inspeksi !== '-' ? ' · ' + m.inspeksi : ''}</p>
   </div>
   </div>
   <span class="font-bold text-blue-400 shrink-0">${m.accuracyRaw}</span>
  </div>`;
 }).join('');
 lucide.createIcons();
 }

 function getLoggedInChatIdentity() {
 const memberToken = (localStorage.getItem('mine_member_token') || '').trim();
 if (memberToken) {
  const name = (localStorage.getItem('mine_member_user_name') || localStorage.getItem('mine_member_login_id') || '').trim();
  const roleId = (localStorage.getItem('mine_member_role_id') || '').trim();
  if (name) return { sender: name, role: roleId || 'MEMBER', type: 'member' };
 }
 const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
 if (devToken) {
  const name = (localStorage.getItem('mine_user_name') || '').trim();
  const roleId = (localStorage.getItem('mine_role_id') || '').trim();
  if (name) return { sender: name, role: roleId || 'DEVELOPER', type: 'developer' };
 }
 return { sender: '', role: '', type: 'anonymous' };
 }

 function onChatSenderChange() {
 syncChatSenderToLoggedInUser();
 renderChatMessages();
 }

 function scrollChatToBottom() {
 const area = document.getElementById('chat-messages-area');
 if (area) area.scrollTop = area.scrollHeight;
 }

 function updateChatUnreadBadge() {
 const badge = document.getElementById('chat-unread-badge');
 const activeTab = document.querySelector('aside nav button.nav-item-active');
 const isChatOpen = activeTab && activeTab.id === 'btn-chat';
 const unreadCount = globalChatData.filter(function(m) { return Number(m._row || 0) > chatLastSeenRow; }).length;

 if (!isChatOpen && unreadCount > 0) {
  badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
  badge.classList.remove('hidden');
 } else {
  badge.classList.add('hidden');
 }
 }

let compactPreviewState = {sheet:'', totalRows:0, blankRows:[]};

function updateCompactExecuteButton() {
 const btn=document.getElementById('btn-compact-execute');
 const select=document.getElementById('compact-sheet-select');
 if(!btn || !select) return;
 const ready=isDeveloperUnlocked() && compactPreviewState.sheet===select.value && compactPreviewState.blankRows.length>0;
 btn.disabled=!ready;
 btn.classList.toggle('opacity-50',!ready);
 btn.classList.toggle('cursor-not-allowed',!ready);
 btn.classList.toggle('bg-indigo-700/30',!ready);
 btn.classList.toggle('bg-indigo-600',ready);
 btn.classList.toggle('hover:bg-indigo-500',ready);
 btn.classList.toggle('cursor-pointer',ready);
}

function resetCompactPreviewState() {
 compactPreviewState={sheet:'',totalRows:0,blankRows:[]};
 const status=document.getElementById('compact-preview-status');
 if(status) status.textContent=translations[currentLang].compact_status_idle;
 updateCompactExecuteButton();
}

async function previewCompactBlankRows() {
 if(!isDeveloperUnlocked()) return;
 const select=document.getElementById('compact-sheet-select');
 const status=document.getElementById('compact-preview-status');
 if(!select || !status) return;
 const sheet=select.value;
 status.textContent=translations[currentLang].compact_status_loading;
 compactPreviewState={sheet:'',totalRows:0,blankRows:[]};
 updateCompactExecuteButton();
 try {
  const result=await postDeveloperAdmin('previewCompactBlankRows',{sheet:sheet});
  const rows=Array.isArray(result.blank_row_numbers)?result.blank_row_numbers:[];
  compactPreviewState={sheet:sheet,totalRows:Number(result.total_rows||0),blankRows:rows};
  if(rows.length===0) {
   status.textContent=translations[currentLang].compact_status_none.replace('{sheet}',sheet).replace('{rows}',String(result.total_rows||0));
  } else {
   const list=rows.join(', ');
   status.textContent=translations[currentLang].compact_status_ready.replace('{count}',String(rows.length)).replace('{sheet}',sheet).replace('{rows}',String(result.total_rows||0)).replace('{list}',list);
  }
  updateCompactExecuteButton();
 } catch(e) {
  compactPreviewState={sheet:'',totalRows:0,blankRows:[]};
  status.textContent=translations[currentLang].compact_error_prefix+' '+e.message;
  updateCompactExecuteButton();
 }
}

async function executeCompactBlankRows() {
 if(!isDeveloperUnlocked()) return;
 const select=document.getElementById('compact-sheet-select');
 const status=document.getElementById('compact-preview-status');
 if(!select || !status) return;
 const sheet=select.value;
 if(compactPreviewState.sheet!==sheet || compactPreviewState.blankRows.length<1) {
  status.textContent=translations[currentLang].compact_status_preview_required;
  updateCompactExecuteButton();
  return;
 }
 const count=compactPreviewState.blankRows.length;
 const ok=await showConfirmModal(translations[currentLang].compact_confirm_title,translations[currentLang].compact_confirm_message.replace('{count}',String(count)).replace('{sheet}',sheet));
 if(!ok) return;
 const btn=document.getElementById('btn-compact-execute');
 if(btn){btn.disabled=true;btn.classList.add('opacity-50');}
 status.textContent=translations[currentLang].compact_status_executing;
 try {
  const result=await postDeveloperAdmin('compactBlankRows',{sheet:sheet});
  status.textContent=translations[currentLang].compact_status_success.replace('{sheet}',sheet).replace('{before}',String(result.rows_before||0)).replace('{removed}',String(result.blank_rows_removed||0)).replace('{after}',String(result.rows_after||0));
  compactPreviewState={sheet:'',totalRows:0,blankRows:[]};
  updateCompactExecuteButton();
 } catch(e) {
  status.textContent=translations[currentLang].compact_error_prefix+' '+e.message;
  updateCompactExecuteButton();
 }
}

function initCompactBlankRowsControls() {
 const select=document.getElementById('compact-sheet-select');
 if(select) select.addEventListener('change',resetCompactPreviewState);
 updateCompactExecuteButton();
}

// ==== RP06-RLS: Developer Data Management (diambil dari usulan v90.2.97, diterapkan ulang
// di atas baseline yang benar). Alat bantu Developer hapus/edit baris Chat/Issue/Member
// individual atau massal, plus bersih-bersih Sessions/SecurityAuditLog/AuditTrail. ====
async function postDeveloperAdmin(action, params) {
  if (!isDeveloperUnlocked()) throw new Error(currentLang === 'en' ? 'Developer access is locked.' : 'Akses Developer terkunci.');
  const payload = new URLSearchParams(params || {});
  payload.set('action', action);
  const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
  payload.set('devToken', devToken);
  showAppLoading(translations[currentLang].dev_operation_loading_title, translations[currentLang].dev_operation_loading_message);
  try {
   // FIX (23 Agu): SEBELUMNYA pakai fetch() polos tanpa batas waktu sama sekali -- kalau
   // request macet (jaringan, cold-start Apps Script, dsb), loading bisa "menggantung"
   // tanpa pesan error apapun ke user (dilaporkan user: klik Preview di Padatkan Baris
   // Kosong, loading tidak pernah selesai). Sekarang pakai fetchWithTimeout yang sama
   // dipakai jalur login/dashboard/chat lain di file ini (20 detik), supaya SEMUA aksi
   // Developer Console (bukan cuma fitur ini) dapat pesan error jelas kalau macet,
   // bukan loading tanpa akhir.
   const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method:'POST', body:payload });
   const result = await response.json();
   if (!result || result.status !== 'success' && result.success !== true || result.ok === false) {
    throw new Error((result && result.message) || (currentLang === 'en' ? 'Developer operation failed.' : 'Operasi Developer gagal.'));
   }
   return result;
  } catch (err) {
   if (err && err.name === 'AbortError') {
    throw new Error(currentLang === 'en' ? 'Server did not respond within 20 seconds (timeout).' : 'Server tidak merespons dalam 20 detik (timeout).');
   }
   throw err;
  } finally {
   hideAppLoading();
  }
}

async function deleteChatMessage(rowNumber) {
  if (!(await showConfirmModal(currentLang === 'en' ? 'Delete Chat Message' : 'Hapus Pesan Chat', currentLang === 'en' ? 'Delete this chat message?' : 'Hapus pesan Chat ini?'))) return;
  try { await postDeveloperAdmin('developerDeleteChat',{row_number:String(rowNumber)}); await fetchChatData(); }
  catch(e){ showNoticeModal(currentLang==='en'?'Delete Failed':'Hapus Gagal',e.message); }
}

async function deleteAllChatMessages() {
  if (!(await showConfirmModal(currentLang === 'en' ? 'Delete All Chat Messages' : 'Hapus Semua Pesan Chat', currentLang === 'en' ? 'Delete ALL Chat messages?' : 'Hapus SEMUA pesan Chat?'))) return;
  try { await postDeveloperAdmin('developerDeleteAllChat',{}); await fetchChatData(); }
  catch(e){ showNoticeModal(currentLang==='en'?'Cleanup Failed':'Cleanup Gagal',e.message); }
}

async function deleteIssueByRow(rowNumber) {
  if (!(await showConfirmModal(currentLang === 'en' ? 'Delete Issue & Action' : 'Hapus Issue & Action', currentLang === 'en' ? 'Delete this Issue & Action record?' : 'Hapus record Issue & Action ini?'))) return;
  try { await postDeveloperAdmin('developerDeleteIssue',{row_number:String(rowNumber)}); await fetchIssueData(); }
  catch(e){ showNoticeModal(currentLang==='en'?'Delete Failed':'Hapus Gagal',e.message); }
}

async function deleteAllIssues() {
  if (!(await showConfirmModal(currentLang === 'en' ? 'Delete All Issue & Action' : 'Hapus Semua Issue & Action', currentLang === 'en' ? 'Delete ALL Issue & Action records?' : 'Hapus SEMUA record Issue & Action?'))) return;
  try { await postDeveloperAdmin('developerDeleteAllIssues',{}); await fetchIssueData(); }
  catch(e){ showNoticeModal(currentLang==='en'?'Cleanup Failed':'Cleanup Gagal',e.message); }
}

function updateResetProjectButton() {
  const btn=document.getElementById('btn-reset-project');
  const input=document.getElementById('reset-project-confirm');
  if(!btn || !input) return;
  const targets=[].slice.call(document.querySelectorAll('.reset-project-target:checked'));
  const member=document.getElementById('reset-project-member');
  const hasTarget=targets.length>0 || !!(member && member.checked);
  const ok=hasTarget && input.value.trim()==='RESET PROJECT' && isDeveloperUnlocked();
  btn.disabled=!ok;
  btn.classList.toggle('opacity-50',!ok);
  btn.classList.toggle('cursor-not-allowed',!ok);
  btn.classList.toggle('bg-rose-700/30',!ok);
  btn.classList.toggle('bg-rose-600',ok);
  btn.classList.toggle('hover:bg-rose-500',ok);
  btn.classList.toggle('cursor-pointer',ok);
}

function applyRetentionPolicyToControls(policy) {
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=String(value);};
 const check=(id,value)=>{const el=document.getElementById(id);if(el)el.checked=!!value;};
 if(!policy) return;
 check('retention-enabled',policy.enabled); set('retention-sessions-days',policy.sessionsDays||7);
 set('retention-security-days',policy.securityAuditDays||90); set('retention-audit-days',policy.auditTrailDays||90);
 check('retention-chat-enabled',policy.chatLogEnabled); set('retention-chat-days',policy.chatLogDays||90);
 applyResetProjectRetentionGuard();
}

// BARU (Pending item #2 dari pihak A, DIPUTUSKAN user 22 Agu -- Opsi A): saat Retention &
// Archive aktif (toggle #retention-enabled tercentang), 14 checkbox operasional Reset Total
// DIKUNCI TERCENTANG (dipaksa ikut semua, tidak bisa di-uncheck) -- supaya Reset Total selalu
// full-wipe konsisten, tidak ada sheet yang kelewat kecentang saat pindah proyek sungguhan.
// ChatLog SENGAJA DIKECUALIKAN dari guard ini -- dia sudah punya mekanisme retensi terpisah
// sendiri (opt-in toggle #retention-chat-enabled + hari), jadi tetap bebas dipilih Developer
// sesuai kebutuhan (mis. mau dipertahankan lintas proyek atau tidak). Member (#reset-project-
// member) juga TIDAK disentuh guard ini -- sudah punya opsi khusus sendiri (preserve baris
// Developer), di luar cakupan "14 checkbox operasional" yang dimaksud spesifikasi ini.
// Guard ini MURNI pencegahan human-error di frontend -- Reset Total & Retention/Archive
// TIDAK PERNAH tabrakan secara teknis (beda sheet, dan LockService.getDocumentLock() di
// backend sudah otomatis mengantre kalau kebetulan jalan bersamaan).
function applyResetProjectRetentionGuard() {
 const retentionToggle = document.getElementById('retention-enabled');
 const guardActive = !!(retentionToggle && retentionToggle.checked);
 document.querySelectorAll('.reset-project-target').forEach(function(el) {
  if (el.value === 'ChatLog') return; // dikecualikan -- retensi ChatLog sudah opt-in terpisah
  if (guardActive) {
   el.checked = true;
   el.disabled = true;
  } else {
   el.disabled = false;
  }
 });
 const hint = document.getElementById('reset-project-guard-hint');
 if (hint) hint.classList.toggle('hidden', !guardActive);
 updateResetProjectButton();
}
function retentionPolicyPayload() {
 const value=id=>{const el=document.getElementById(id);return el?el.value:'';};
 const checked=id=>{const el=document.getElementById(id);return !!(el&&el.checked);};
 return {retention_enabled:checked('retention-enabled')?'TRUE':'FALSE',sessions_retention_days:value('retention-sessions-days'),security_audit_retention_days:value('retention-security-days'),audit_trail_retention_days:value('retention-audit-days'),chatlog_retention_enabled:checked('retention-chat-enabled')?'TRUE':'FALSE',chatlog_retention_days:value('retention-chat-days')};
}
async function loadRetentionPolicy() {
 if(!isDeveloperUnlocked()) return;
 try { const result=await postDeveloperAdmin('getRetentionPolicy',{}); applyRetentionPolicyToControls(result.policy); }
 catch(e) { const status=document.getElementById('retention-policy-status'); if(status)status.textContent=(currentLang === 'en' ? 'Policy could not be loaded: ' : 'Kebijakan belum dapat dimuat: ')+e.message; }
}
async function saveRetentionPolicy() {
 if(!isDeveloperUnlocked()) return;
 try { const result=await postDeveloperAdmin('saveRetentionPolicy',retentionPolicyPayload()); applyRetentionPolicyToControls(result.policy); const status=document.getElementById('retention-policy-status'); if(status)status.textContent=currentLang === 'en' ? 'Policy saved. ChatLog stays OFF unless explicitly checked.' : 'Kebijakan tersimpan. ChatLog tetap OFF kecuali dicentang secara eksplisit.'; }
 catch(e) { showNoticeModal(currentLang === 'en' ? 'Save Policy Failed' : 'Simpan Kebijakan Gagal',e.message); }
}
async function runRetentionArchiveNow() {
 if(!isDeveloperUnlocked()) return;
 if(!(await showConfirmModal(currentLang === 'en' ? 'Run Retention & Archive' : 'Jalankan Retention & Archive', currentLang === 'en' ? 'This will delete non-ACTIVE Sessions that are past their retention period and move old audit logs to the archive sheet. Continue?' : 'Proses akan menghapus Sessions non-ACTIVE yang sudah melewati retensi dan memindahkan log audit lama ke sheet archive. Lanjutkan?'))) return;
 try { const result=await postDeveloperAdmin('runRetentionArchiveNow',{}); const status=document.getElementById('retention-policy-status'); if(result.status==='disabled'){if(status)status.textContent=currentLang === 'en' ? 'Retention is still OFF; no data was processed.' : 'Retention masih OFF; tidak ada data diproses.';return;} const summary=(result.results||[]).map(x=>x.sheet+': '+(x.archived!==undefined?(currentLang === 'en' ? 'archived ' : 'archive ')+x.archived:(currentLang === 'en' ? 'deleted ' : 'hapus ')+(x.deleted||0))).join(' | '); if(status)status.textContent=(currentLang === 'en' ? 'Done — ' : 'Selesai — ')+summary; }
 catch(e) { showNoticeModal(currentLang === 'en' ? 'Retention & Archive Failed' : 'Retention & Archive Gagal',e.message); }
}

// BARU (Pending item #1 spesifikasi performa, DIPUTUSKAN 22 Agu): panel toggle Session Cache
// -- pola LOAD/SAVE identik dgn Retention & Archive di atas, cuma target endpoint beda.
function applySessionCachePolicyToControls(policy) {
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=String(value);};
 const check=(id,value)=>{const el=document.getElementById(id);if(el)el.checked=!!value;};
 if(!policy) return;
 check('session-cache-enabled',policy.enabled); set('session-cache-ttl',policy.ttlSeconds||20);
}
async function loadSessionCachePolicy() {
 if(!isDeveloperUnlocked()) return;
 try { const result=await postDeveloperAdmin('getSessionCachePolicy',{}); applySessionCachePolicyToControls(result.policy); }
 catch(e) { const status=document.getElementById('session-cache-status'); if(status)status.textContent=(currentLang === 'en' ? 'Policy could not be loaded: ' : 'Kebijakan belum dapat dimuat: ')+e.message; }
}
async function saveSessionCachePolicy() {
 if(!isDeveloperUnlocked()) return;
 const value=id=>{const el=document.getElementById(id);return el?el.value:'';};
 const checked=id=>{const el=document.getElementById(id);return !!(el&&el.checked);};
 const payload={session_cache_enabled:checked('session-cache-enabled')?'TRUE':'FALSE',session_cache_ttl_seconds:value('session-cache-ttl')};
 try { const result=await postDeveloperAdmin('saveSessionCachePolicy',payload); applySessionCachePolicyToControls(result.policy); const status=document.getElementById('session-cache-status'); if(status)status.textContent=currentLang === 'en' ? 'Policy saved.' : 'Kebijakan tersimpan.'; }
 catch(e) { showNoticeModal(currentLang === 'en' ? 'Save Policy Failed' : 'Simpan Kebijakan Gagal',e.message); }
}

// BARU (Security hardening -- rate limit perluasan, DIPUTUSKAN 22 Agu): panel toggle API
// Abuse Guard -- pola LOAD/SAVE identik dgn Session Cache di atas, cuma target endpoint beda.
function applyApiAbuseGuardPolicyToControls(policy) {
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=String(value);};
 const check=(id,value)=>{const el=document.getElementById(id);if(el)el.checked=!!value;};
 if(!policy) return;
 check('api-abuse-guard-enabled',policy.enabled); set('api-abuse-guard-max',policy.maxRequests||90); set('api-abuse-guard-window',policy.windowSec||60);
}
async function loadApiAbuseGuardPolicy() {
 if(!isDeveloperUnlocked()) return;
 try { const result=await postDeveloperAdmin('getApiAbuseGuardPolicy',{}); applyApiAbuseGuardPolicyToControls(result.policy); }
 catch(e) { const status=document.getElementById('api-abuse-guard-status'); if(status)status.textContent=(currentLang === 'en' ? 'Policy could not be loaded: ' : 'Kebijakan belum dapat dimuat: ')+e.message; }
}
async function saveApiAbuseGuardPolicy() {
 if(!isDeveloperUnlocked()) return;
 const value=id=>{const el=document.getElementById(id);return el?el.value:'';};
 const checked=id=>{const el=document.getElementById(id);return !!(el&&el.checked);};
 const payload={api_abuse_guard_enabled:checked('api-abuse-guard-enabled')?'TRUE':'FALSE',api_abuse_max_requests:value('api-abuse-guard-max'),api_abuse_window_sec:value('api-abuse-guard-window')};
 try { const result=await postDeveloperAdmin('saveApiAbuseGuardPolicy',payload); applyApiAbuseGuardPolicyToControls(result.policy); const status=document.getElementById('api-abuse-guard-status'); if(status)status.textContent=currentLang === 'en' ? 'Policy saved.' : 'Kebijakan tersimpan.'; }
 catch(e) { showNoticeModal(currentLang === 'en' ? 'Save Policy Failed' : 'Simpan Kebijakan Gagal',e.message); }
}

async function resetProjectData() {
  if(!isDeveloperUnlocked()) return;
  const confirmInput=document.getElementById('reset-project-confirm');
  const typed=confirmInput ? confirmInput.value.trim() : '';
  if(typed!=='RESET PROJECT') { showNoticeModal('Konfirmasi Salah','Ketik persis: RESET PROJECT'); return; }
  const targets=[].slice.call(document.querySelectorAll('.reset-project-target:checked')).map(function(el){return el.value;});
  const member=document.getElementById('reset-project-member');
  if(member && member.checked) targets.push('Member');
  if(!targets.length) { showNoticeModal('Belum Ada Target','Pilih minimal 1 sheet.'); return; }

  const label=targets.join(', ');
  const msg='PERINGATAN: data terpilih akan dikosongkan dan tidak dapat dipulihkan dari aplikasi.\n\nTarget:\n'+label+'\n\nDeveloper Member tetap dipertahankan. Lanjutkan?';
  if(!(await showConfirmModal(currentLang === 'en' ? 'Reset Project' : 'Reset Project', msg))) return;

  const btn=document.getElementById('btn-reset-project');
  const status=document.getElementById('reset-project-status');
  if(btn) { btn.disabled=true; btn.classList.add('opacity-50'); }
  if(status) status.textContent='Reset sedang diproses...';
  try {
    const result=await postDeveloperAdmin('developerResetProjectData',{targets:targets.join(','),confirm_text:typed});
    const cleared=(result.results||[]).map(function(x){return x.sheet+': '+(x.rows||0)+' row';}).join(' | ');
    if(status) status.textContent='Selesai — '+cleared;
    showNoticeModal('Reset Selesai','Data operasional terpilih berhasil dibersihkan. Developer Member tetap dipertahankan.');
    document.querySelectorAll('.reset-project-target').forEach(function(el){el.checked=false;});
    if(member) member.checked=false;
    if(confirmInput) confirmInput.value='';
    updateResetProjectButton();
    try { await Promise.all([fetchChatData(), fetchIssueData(), loadMembersFromSheet()]); } catch(ignore) {}
  } catch(e) {
    if(status) status.textContent='Reset gagal';
    showNoticeModal('Reset Gagal',e.message);
    updateResetProjectButton();
  }
}

function initResetProjectControls() {
  const input=document.getElementById('reset-project-confirm');
  if(input) input.addEventListener('input',updateResetProjectButton);
  document.querySelectorAll('.reset-project-target').forEach(function(el){el.addEventListener('change',updateResetProjectButton);});
  const member=document.getElementById('reset-project-member');
  if(member) member.addEventListener('change',updateResetProjectButton);
  // Guard Reset Total x Retention (lihat komentar applyResetProjectRetentionGuard()) --
  // reaksi LIVE begitu toggle diklik, sebelum sempat disimpan ke backend lewat Save Policy.
  const retentionToggle=document.getElementById('retention-enabled');
  if(retentionToggle) retentionToggle.addEventListener('change',applyResetProjectRetentionGuard);
  updateResetProjectButton();
  loadRetentionPolicy();
}

async function cleanupGeneralSheet(sheetName) {
  if (!isDeveloperUnlocked()) return;
  const text = sheetName === 'Sessions' ? 'Bersihkan Sessions lain? Session Developer yang sedang aktif akan dipertahankan.' : `Bersihkan seluruh isi ${sheetName}?`;
  if (!(await showConfirmModal(currentLang === 'en' ? 'Cleanup Data' : 'Cleanup Data', text))) return;
  try {
    const result=await postDeveloperAdmin('developerCleanupGeneral',{target:sheetName});
    const status=document.getElementById('general-cleanup-status');
    if(status) status.textContent=(result.count||0)+' row dibersihkan';
  } catch(e){ showNoticeModal('Cleanup Gagal',e.message); }
}

 async function fetchChatData() {
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=chat&limit=100&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') return;

  const wasAtBottom = isChatScrolledToBottom();
  // Saat feed dibatasi 100 pesan, panjang array dapat tetap sama walau ada
  // pesan baru. Nomor baris sheet adalah indikator baru yang stabil.
  const previousLastRow = globalChatData.length ? Number(globalChatData[globalChatData.length - 1]._row || 0) : 0;
  const nextLastRow = result.data && result.data.length ? Number(result.data[result.data.length - 1]._row || 0) : 0;
  const hadNewMessages = nextLastRow > previousLastRow;

  globalChatData = result.data;
  renderChatMessages();
  updateChatUnreadBadge();

  if (hadNewMessages && wasAtBottom) {
  scrollChatToBottom();
  }
 } catch (err) {
  console.error('Gagal memuat chat:', err);
 }
 }

 function isChatScrolledToBottom() {
 const area = document.getElementById('chat-messages-area');
 if (!area) return true;
 return area.scrollHeight - area.scrollTop - area.clientHeight < 60;
 }

 function renderChatMessages() {
 const area = document.getElementById('chat-messages-area');
 if (!area) return;

 if (globalChatData.length === 0) {
  area.innerHTML = `<div class="text-center py-8 text-slate-500 text-xs font-medium">${currentLang === 'en' ? 'No messages yet. Start the conversation!' : 'Belum ada pesan. Mulai obrolan!'}</div>`;
  return;
 }

 const chatIdentity = getLoggedInChatIdentity();
 const mySender = chatIdentity.sender || '';

 area.innerHTML = globalChatData.map(msg => {
  const isMine = msg.sender === mySender;
  const initials = (msg.sender || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  if (isMine) {
  return `
   <div class="flex items-start justify-end gap-2.5">
   <div class="max-w-[75%]">
    <div class="flex items-baseline gap-1.5 justify-end">
    ${msg.role ? `<span class="text-[10px] text-slate-500 font-medium">${escapeHtml(msg.role)}</span>` : ''}
    <span class="text-xs font-bold text-title">${escapeHtml(msg.sender)}</span>
    </div>
    <div class="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm font-medium shadow-md mt-0.5">${escapeHtml(msg.message)}</div>
    <p class="text-[10px] text-slate-500 font-medium mt-1 text-right">${msg.timestamp}</p>
    ${isDeveloperUnlocked() && msg._row ? `<button type="button" onclick="deleteChatMessage(${msg._row})" class="mt-1 text-[9px] text-rose-300 hover:text-rose-200 font-semibold">Hapus</button>` : ''}
   </div>
   <div class="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">${initials}</div>
   </div>`;
  } else {
  return `
   <div class="flex items-start gap-2.5">
   <div class="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">${initials}</div>
   <div class="max-w-[75%]">
    <div class="flex items-baseline gap-1.5">
    <span class="text-xs font-bold text-title">${escapeHtml(msg.sender)}</span>
    ${msg.role ? `<span class="text-[10px] text-slate-500 font-medium">${escapeHtml(msg.role)}</span>` : ''}
    </div>
    <div class="bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm font-medium mt-0.5">${escapeHtml(msg.message)}</div>
    <p class="text-[10px] text-slate-500 font-medium mt-1">${msg.timestamp}</p>
    ${isDeveloperUnlocked() && msg._row ? `<button type="button" onclick="deleteChatMessage(${msg._row})" class="mt-1 text-[9px] text-rose-300 hover:text-rose-200 font-semibold">Hapus</button>` : ''}
   </div>
   </div>`;
  }
 }).join('');
 }

 function escapeHtml(str) {
 const div = document.createElement('div');
 div.innerText = str || '';
 return div.innerHTML;
 }

 async function submitChatMessage(event) {
 event.preventDefault();
 const input = document.getElementById('chat-message-input');
 const btn = document.getElementById('btn-send-chat');
 const senderSelect = document.getElementById('chat-sender-select');
 const message = input.value.trim();
 if (!message) return;

 const chatIdentity = getLoggedInChatIdentity();
 if (!chatIdentity.sender) {
  showNoticeModal(
   currentLang === 'en' ? 'Login Required' : 'Login Diperlukan',
   currentLang === 'en' ? 'Please log in as a Member first to continue.' : 'Silakan login sebagai Member terlebih dahulu untuk melanjutkan.'
  );
  return;
 }
 const sender = chatIdentity.sender;
 const role = chatIdentity.role || '';

 input.disabled = true;
 btn.disabled = true;

 try {
  const payload = buildAuthenticatedPayload({
  sheet_name: 'ChatLog',
  sender: sender,
  role: role,
  message: message
  });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();

  if (result.status === 'success') {
  input.value = '';
  // v90.2.63: render the server-accepted message locally instead of issuing
  // a second full ChatLog GET immediately after every POST. Auto-refresh
  // continues to reconcile messages from other users.
  if (result.data && result.data.message) {
   globalChatData.push(result.data);
   renderChatMessages();
   updateChatUnreadBadge();
  } else {
   // Backward-compatible fallback if an older backend is accidentally deployed.
   await fetchChatData();
  }
  scrollChatToBottom();
  } else {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to send the message.' : 'Gagal mengirim pesan.'));
  }
 } catch (err) {
  console.error('Gagal mengirim chat:', err);
  showNoticeModal(
  currentLang === 'en' ? 'Failed to Send' : 'Gagal Terkirim',
  currentLang === 'en' ? 'The message failed to send. Please check your connection and try again.' : 'Pesan gagal terkirim. Cek koneksi kamu dan coba lagi.'
  );
 } finally {
  input.disabled = false;
  btn.disabled = false;
  input.focus();
 }
 }

 async function fetchIssueData(isAutoRetry = false) {
 const tbody = document.getElementById('issue-table-body');
 if (!isAutoRetry) issueAutoRetryCount = 0;

 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=issue&t=' + new Date().getTime());
  const result = await response.json();

  if (result.status !== 'success') {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to load issue data.' : 'Gagal memuat data issue'));
  }

  globalIssueRawData = result.data || [];
  renderIssueTable(globalIssueRawData);
  issueAutoRetryCount = 0;
 } catch (err) {
  console.error('Gagal memuat data issue:', err);
  if (issueAutoRetryCount < ISSUE_MAX_AUTO_RETRY) {
  issueAutoRetryCount++;
  setTimeout(() => fetchIssueData(true), 2000 * issueAutoRetryCount);
  } else {
  const isTimeout = err.name === 'AbortError';
  const msg = isTimeout ? (currentLang === 'en' ? 'Server did not respond within 20 seconds (timeout).' : 'Server tidak merespons dalam 20 detik (timeout).') : (currentLang === 'en' ? 'Failed to load issue data from Google Sheets.' : 'Gagal memuat data issue dari Google Sheets.');
  tbody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-rose-400 text-xs space-y-2 font-medium"><p>${msg}</p><button onclick="fetchIssueData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all">${translations[currentLang].retry}</button></td></tr>`;
  }
 }
 }

 function classifyMaterial(ni, tipeOreInput, smValue) {
 const niNum = parseFloat(ni) || 0;
 const cfg = globalCOGConfig || {
  Sapro: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7 },
  Limo: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7 },
  Limo_Aktif: false,
  SM_Threshold_AutoDetect: 3
 };

 let tipeOreFinal = (tipeOreInput || 'Sapro').trim();

 // Kalau toggle Limo_Aktif MATI, paksa semua material pakai batas Sapro -- ini jaring
 // pengaman supaya baris yang Tipe_Ore-nya kosong/belum diisi tidak salah kena batas Limo.
 if (!cfg.Limo_Aktif) {
  tipeOreFinal = 'Sapro';
 } else if (tipeOreFinal === 'Auto') {
  // Auto Detect final (bukan saran) -- dipakai setelah hasil assay/SM% keluar.
  const sm = parseFloat(smValue) || 0;
  tipeOreFinal = (sm >= cfg.SM_Threshold_AutoDetect) ? 'Limo' : 'Sapro';
 } else if (tipeOreFinal !== 'Sapro' && tipeOreFinal !== 'Limo') {
  tipeOreFinal = 'Sapro'; // fallback kalau field kosong/nilai tidak dikenal
 }

 const batas = cfg[tipeOreFinal] || cfg.Sapro;

 let classGrade;
 if (niNum <= 0) {
  classGrade = 'N/A';
 } else if (niNum < batas.Batas_Waste_LG) {
  classGrade = 'Waste';
 } else if (niNum < batas.Batas_LG_MG) {
  classGrade = 'LG';
 } else if (niNum < batas.Batas_MG_HG) {
  classGrade = 'MG';
 } else if (niNum < batas.Batas_HG_VHG) {
  classGrade = 'HG';
 } else {
  classGrade = 'VHG';
 }

 return { classGrade, tipeOreFinal };
 }

 // Badge warna per Class_Grade -- dipakai di Tabel Digging (menggantikan badge lama
 // High/Medium/Low Grade 3-tingkat hardcode 1.5/1.3) dan tempat lain yang butuh tampilan sama.
 // BARU: 5 preset warna aman (kontras terjamin di background gelap) yang bisa dipilih user
 // per grade lewat Settings > Parameter COG -- SATU-SATUNYA sumber kebenaran warna grade,
 // dipakai oleh badge (renderClassGradeBadge) DAN warna teks Ni% di semua tabel (Digging,
 // Validasi, Export PDF, Rekonsiliasi), supaya tidak ada lagi tempat yang "lupa ikut ganti"
 // kalau user ubah preferensi warna. Preset dipilih dari 5 warna standar Tailwind yang aman
 // dibaca di tema gelap: merah/rose, abu/slate, kuning/amber, biru, hijau/emerald.
 const GRADE_COLOR_PRESETS = {
 merah: { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
 abu: { text: 'text-slate-400', bg: 'bg-slate-700/40', border: 'border-slate-600/40' },
 kuning: { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
 biru: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
 hijau: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }
 };
 // Default preset per grade -- dipakai kalau user belum atur apapun di Settings (sama
 // dengan skema warna lama sebelum fitur ini dibuat, cuma cyan diganti hijau karena VHG
 // harus masuk 5 preset yang bisa dipilih user).
 const GRADE_COLOR_DEFAULTS = { Waste: 'abu', LG: 'kuning', MG: 'biru', HG: 'hijau', VHG: 'hijau' };

 // Baca preferensi warna user dari globalCOGConfig (kolom Warna_Waste/LG/MG/HG/VHG di
 // sheet COGConfig), fallback ke default kalau belum diisi/globalCOGConfig belum siap.
 function getGradeColorPreset(classGrade) {
 const cfg = globalCOGConfig || {};
 const colorKey = cfg['Warna_' + classGrade] || GRADE_COLOR_DEFAULTS[classGrade] || 'abu';
 return GRADE_COLOR_PRESETS[colorKey] || GRADE_COLOR_PRESETS['abu'];
 }

 // Kelas warna teks saja (dipakai di sel angka Ni%, bukan badge) -- N/A selalu netral abu,
 // tidak ikut preferensi warna user karena bukan grade sungguhan.
 function getGradeTextClass(classGrade) {
 if (classGrade === 'N/A' || !classGrade) return 'text-slate-500';
 return getGradeColorPreset(classGrade).text;
 }

 function renderClassGradeBadge(classGrade) {
 if (classGrade === 'N/A' || !classGrade) {
  return '<span class="px-2 py-0.5 rounded-md text-[11px] bg-slate-700/40 text-slate-400 border border-slate-600/40 font-semibold">N/A</span>';
 }
 const preset = getGradeColorPreset(classGrade);
 return `<span class="px-2 py-0.5 rounded-md text-[11px] ${preset.bg} ${preset.text} border ${preset.border} font-semibold">${classGrade}</span>`;
 }

 function computeRealisasiKimiaByBlok() {
 // Rata-rata tertimbang (weighted by tonase) Ni/Fe/Co/MgO/SiO2 REALISASI per Blok+Pit
 // (BUKAN per Blok saja) -- dihitung dari data Produksi_GC (globalRawData). Granularitasnya
 // WAJIB Blok+Pit, sama seperti kolom Realisasi_Tonase & Matriks F1-F4, karena 1 Blok bisa
 // punya banyak Pit (misal L-01 = Avanza+Honda+Yamaha) yang masing-masing beda kadarnya --
 // kalau cuma dikelompokkan per Blok, semua Pit dalam 1 Blok salah dapat angka rata-rata
 // gabungan yang sama (bug yang sempat ketemu: semua Pit di L-01 tampil "1.38%" identik).
 // Key: "BLOK|PIT" (uppercase, trim), BEDA dari kolom "Validasi" lama yang membandingkan
 // Test Pit (SEBELUM digali) vs Estimasi -- ini murni realisasi assay lapangan (SETELAH
 // digali) vs Estimasi Block Model, untuk perbandingan kimia lengkap di popup detail.
 const acc = {};
 (globalRawData || []).forEach(row => {
  const c = rawToCleanRow.get(row) || {};
  const blok = (c['blok'] || c['id blok'] || c['idblok'] || c['id_blok'] || '').toString().trim().toUpperCase();
  const pit = (c['pit'] || '').toString().trim().toUpperCase();
  if (!blok) return;
  const key = blok + '|' + pit;
  const tonase = cleanNumber(c['tonase']);
  if (tonase <= 0) return;
  let ni = cleanNumber(c['ni %'] || c['ni']); if (ni > 50) ni = ni / 100;
  const fe = cleanNumber(c['fe %'] || c['fe']);
  const co = cleanNumber(c['co %'] || c['co']);
  const mgo = cleanNumber(c['mgo %'] || c['mgo']);
  const sio2 = cleanNumber(c['sio2 %'] || c['sio2']);
  if (!acc[key]) acc[key] = { tonase: 0, ni: 0, fe: 0, co: 0, mgo: 0, sio2: 0 };
  acc[key].tonase += tonase;
  acc[key].ni += ni * tonase;
  acc[key].fe += fe * tonase;
  acc[key].co += co * tonase;
  acc[key].mgo += mgo * tonase;
  acc[key].sio2 += sio2 * tonase;
 });
 const result = {};
 Object.keys(acc).forEach(key => {
  const a = acc[key];
  // SM% (SiO2/MgO) dihitung dari RASIO jumlah tertimbang (bukan rata-rata SM per baris) --
  // ini pendekatan standar untuk rasio tertimbang, konsisten dengan cara Estimasi_SM% di
  // BlockModel dihitung (SiO2 total / MgO total per blok), bukan rata-rata rasio per sampel.
  result[key] = a.tonase > 0 ? {
  ni: a.ni / a.tonase, fe: a.fe / a.tonase, co: a.co / a.tonase, mgo: a.mgo / a.tonase, sio2: a.sio2 / a.tonase,
  sm: a.mgo > 0 ? (a.sio2 / a.mgo) : null
  } : null;
 });
 return result;
 }

 function formatEstAktCell(estVal, aktVal, aktColorClass) {
 const estFmt = (typeof estVal === 'number') ? estVal.toFixed(2) : '-';
 const aktFmt = (typeof aktVal === 'number') ? aktVal.toFixed(2) : '-';
 if (estFmt === '-' && aktFmt === '-') return `<span class="text-slate-600">-</span>`;
 const aktClass = aktColorClass || 'text-title';
 return `<span class="text-slate-400">${estFmt}</span> <span class="text-slate-600">-&gt;</span> <span class="${aktClass} font-semibold">${aktFmt}</span>`;
 }

 // BARU: popup detail perbandingan kimia lengkap (Ni/Fe/Co/MgO/SiO2 Estimasi vs Aktual)
 // + Validasi cross-check + Arah Loss/Dilusi -- semua yang dipindah dari tabel utama supaya
 // layout ringkas (cukup Ni%/Fe%), tapi tetap bisa dilihat lengkap saat baris diklik.
 function unlockEwsAudioContext() {
 if (ewsAudioCtx) return;
 try {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
   ewsAudioCtx = new AudioCtx();
   if (ewsAudioCtx.state === 'suspended') ewsAudioCtx.resume().catch(() => {});
  }
 } catch (err) { /* diam-diam dilewati -- fallback ke pembuatan context langsung di triggerEwsAlert() */ }
 }
 ['click', 'touchstart', 'keydown'].forEach(evt => {
 document.addEventListener(evt, unlockEwsAudioContext, { once: true, passive: true });
 });

 // BARU (Sidequest #3): Suara & Haptik EWS -- notifikasi audio+getar SEKALI SAJA saat
 // banner EWS Dilusi/Ore Loss (F2 OUT OF TOL, satu-satunya sistem EWS di dashboard ini)
 // PERTAMA KALI muncul (transisi dari 0 ke >0 Blok/Pit OUT OF TOL). TIDAK berulang tiap
 // render/polling selama banner masih tampil, dan TIDAK berulang tiap ada tambahan Blok
 // baru selama banner sudah tampil (dikonfirmasi user 22 Agu: "sekali saja saat pertama
 // kali muncul"). Flag ewsAlertNotified direset ke false hanya kalau semua Blok kembali
 // ke status aman (banner hilang total), supaya lain kali EWS ini muncul lagi, notifikasi
 // jalan lagi dari awal. Web Audio API dipakai (bukan file suara eksternal) supaya tetap
 // jalan offline di PWA (Windows/Android). Vibration API di-skip diam-diam kalau
 // browser/OS tidak mendukung (mis. iOS Safari tidak pernah dukung Vibration API) --
 // tidak ada error yang muncul ke user, fitur suara tetap jalan normal.
 function triggerEwsAlert() {
 try {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
   if (!ewsAudioCtx) ewsAudioCtx = new AudioCtx(); // fallback kalau belum sempat di-unlock
   const ctx = ewsAudioCtx;
   if (ctx.state === 'suspended') ctx.resume().catch(() => {});
   const playBeep = (startTime, freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
   };
   const now = ctx.currentTime;
   playBeep(now, 880);
   playBeep(now + 0.35, 880);
  }
 } catch (err) {
  console.error('EWS audio alert gagal:', err);
 }
 try {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
 } catch (err) {
  // Diam-diam dilewati -- Vibration API memang tidak didukung di semua browser/OS.
 }
 }

 function computeReconciliationMatrix() {
 const tbody = document.getElementById('matrix-f1f2-body');
 if (!tbody) return; // elemen belum ada di DOM (belum sempat render awal), aman diabaikan

 // BUG FIX: dulu kolom "GC (TON)" di tabel ini diam-diam ambil dari row['Realisasi_Tonase']
 // (kolom O sheet BlockModel) -- kebetulan tidak ketahuan salah selama Realisasi_Tonase masih
 // pakai formula SUMIFS(Produksi_GC...), karena angkanya sama persis dengan GC beneran. Begitu
 // formula sheet diganti supaya Realisasi_Tonase narik dari PitActual (representasi tahap
 // Pit Actual/timbangan resmi yang benar), kolom "GC" ini jadi ikut kebawa nyamar jadi PitActual
 // -- ketahuan pas GC cuma keisi di Blok yang sudah ada data PitActual-nya. Sekarang pakai
 // computeGcTonaseByBlok() (SUM Tonase Produksi_GC per Blok+Pit), sama sumber dengan chart
 // "Block Model vs Actual" & Laporan Rekonsiliasi Profesional -- 1 sumber kebenaran GC, bukan
 // 3 tempat hitung sendiri-sendiri dengan logic beda.
 const gcTonaseByBlok = (typeof computeGcTonaseByBlok === 'function') ? computeGcTonaseByBlok() : {};

 // Jumlahkan Tonase Pit Actual per Blok+Pit (BUKAN per Blok saja) -- Block Model
 // granularitasnya per-Pit (1 Blok bisa punya banyak Pit), jadi kalau PitActual cuma
 // diagregasi per Blok, angka totalnya numpuk dobel ke tiap baris Pit dalam Blok yang
 // sama dan F2 jadi salah (ketemu pas simulasi sebelum sempat kepakai).
 const paByBlokPit = {};
 (globalPitActualData || []).forEach(row => {
  const blok = (row.blok || '').toString().trim();
  const pit = (row.pit || '').toString().trim();
  if (!blok) return;
  const key = blok + '|' + pit;
  paByBlokPit[key] = (paByBlokPit[key] || 0) + (row.tonase || 0);
 });

 let totalPitActual = 0;
 (globalPitActualData || []).forEach(row => { totalPitActual += (row.tonase || 0); });

 // Total Plant (Tonase Aktual) -- cuma shipment yang Tonase Aktual-nya SUDAH diisi
 // (draft survey final), shipment yang masih "Loading" belum ikut dihitung.
 let totalPlant = 0;
 (globalBargeShipmentData || []).forEach(s => {
  const aktual = parseFloat(s.tonase_aktual);
  if (!isNaN(aktual) && aktual > 0) totalPlant += aktual;
 });

 // Total BM -- HANYA Blok yang statusnya sudah final (bukan "Menunggu Data"), supaya F4
 // tidak "diencerkan" oleh Blok yang malah belum pernah disentuh sama sekali.
 let totalBM = 0;
 (globalBlockModelData || []).forEach(row => {
  const statusKpi = (row['Status_KPI'] || '').toString();
  const isBelumFinal = statusKpi.includes('Belum Final') || !row['Status_Depletion'];
  if (!isBelumFinal) totalBM += (row['Estimasi_tonase'] || 0);
 });

 const f3 = totalPitActual > 0 ? (totalPlant / totalPitActual * 100) : null;
 const f4 = totalBM > 0 ? (totalPlant / totalBM * 100) : null;

 const f3El = document.getElementById('matrix-f3-value');
 const f4El = document.getElementById('matrix-f4-value');
 const totalPaEl = document.getElementById('matrix-total-pitactual');
 const totalPlantEl = document.getElementById('matrix-total-plant');
 if (f3El) f3El.innerText = f3 !== null ? f3.toFixed(1) + '%' : '-';
 if (f4El) f4El.innerText = f4 !== null ? f4.toFixed(1) + '%' : '-';
 if (totalPaEl) totalPaEl.innerText = totalPitActual > 0 ? totalPitActual.toLocaleString('id-ID') + (currentLang === 'en' ? ' Tons' : ' Ton') : '-';
 if (totalPlantEl) totalPlantEl.innerText = totalPlant > 0 ? totalPlant.toLocaleString('id-ID') + (currentLang === 'en' ? ' Tons' : ' Ton') : '-';

 if (!globalBlockModelData || globalBlockModelData.length === 0) {
  tbody.innerHTML = `<tr><td colspan="7" class="text-center p-6 text-slate-500 text-xs font-medium">${currentLang === 'en' ? 'No Block Model data yet.' : 'Belum ada data Block Model.'}</td></tr>`;
  return;
 }

 // Dekat 100% = sesuai rencana (hijau). Ambang disamakan dengan permintaan EWS:
 // |deviasi| <= 2% -> OK (hijau), 2%-5% -> WARNING (kuning), > 5% -> OUT OF TOL (merah).
 // Ambang 5% ini sengaja masih hardcode di sini (belum ditarik dari COGConfig) --
 // kalau nanti mau dibuat bisa diatur dari Settings, tinggal ganti EWS_F2_TOLERANSI di bawah.
 const EWS_F2_TOLERANSI_WARNING = 2;
 const EWS_F2_TOLERANSI_OUTOFTOL = 5;
 function f1f2Color(pct) {
  if (pct === null) return 'text-slate-600';
  const dev = Math.abs(pct - 100);
  if (dev <= EWS_F2_TOLERANSI_WARNING) return 'text-emerald-400';
  if (dev <= EWS_F2_TOLERANSI_OUTOFTOL) return 'text-amber-400';
  return 'text-rose-400';
 }

 let ewsF2OutOfTolCount = 0;
 tbody.innerHTML = globalBlockModelData.map(row => {
  const idBlok = row['Id_blok'] || '-';
  const pit = row['Pit'] || '';
  const bmTon = row['Estimasi_tonase'] || 0;
  const gcKey = idBlok.toString().trim().toUpperCase() + '|' + pit.toString().trim().toUpperCase();
  const gcTon = gcTonaseByBlok[gcKey] || 0;
  const paTon = paByBlokPit[idBlok.toString().trim() + '|' + pit.toString().trim()] || 0;

  const f1 = bmTon > 0 ? (gcTon / bmTon * 100) : null;
  const f2 = gcTon > 0 ? (paTon / gcTon * 100) : null;
  const isF2OutOfTol = f2 !== null && Math.abs(f2 - 100) > EWS_F2_TOLERANSI_OUTOFTOL;
  if (isF2OutOfTol) ewsF2OutOfTolCount++;

  // BARU: Quick Link RCA di baris F2 OUT OF TOL -- sama pola dengan tabel "Block Model
  // vs Actual" (canManageRca(), devToken tetap satu-satunya penjaga akses di endpoint
  // addRcaLog, tombol ini cuma jalan pintas UI). Bedanya: di sini Tahap Bermasalah
  // langsung terisi "Pit Actual" (representasi tahap GC->Pit Actual yang deviasinya
  // OUT OF TOL) & Deskripsi Isu terisi angka F2-nya, supaya RCA yang tercipta dari EWS
  // ini konsisten kategorinya untuk pengelompokan otomatis di Laporan Berkala nanti.
  let quickLinkRcaF2 = '';
  if (isF2OutOfTol && canManageRca()) {
  const blokEsc = idBlok.toString().replace(/'/g, "\\'");
  const pitEsc = pit.toString().replace(/'/g, "\\'");
  const deskripsiEsc = `EWS: F2 (Pit Actual/GC) ${f2.toFixed(1)}% -- deviasi melebihi toleransi ${EWS_F2_TOLERANSI_OUTOFTOL}%.`.replace(/'/g, "\\'");
  quickLinkRcaF2 = `<button onclick="event.stopPropagation(); openFormRcaPopup('${blokEsc}', '${pitEsc}', 'Pit Actual', '${deskripsiEsc}')" title="${currentLang === 'en' ? 'Quick RCA (F2)' : 'Catat RCA Cepat (F2)'}" class="ml-1 inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 transition-all cursor-pointer align-middle"><i data-lucide="zap" class="w-2.5 h-2.5"></i></button>`;
  }

  return `<tr>
   <td class="p-2.5 font-semibold text-title">${idBlok}</td>
   <td class="p-2.5 text-slate-300">${pit || '-'}</td>
   <td class="p-2.5 text-right text-slate-300">${bmTon.toLocaleString('id-ID')}</td>
   <td class="p-2.5 text-right text-slate-300">${gcTon > 0 ? gcTon.toLocaleString('id-ID') : '-'}</td>
   <td class="p-2.5 text-center font-semibold ${f1f2Color(f1)}">${f1 !== null ? f1.toFixed(1) + '%' : '-'}</td>
   <td class="p-2.5 text-right text-slate-300">${paTon > 0 ? paTon.toLocaleString('id-ID') : '-'}</td>
   <td class="p-2.5 text-center font-semibold ${f1f2Color(f2)}">${f2 !== null ? f2.toFixed(1) + '%' : '-'}${quickLinkRcaF2}</td>
  </tr>`;
 }).join('');

 // EWS Dilusi/Ore Loss: badge ringkasan di atas tabel Matriks, supaya kelihatan tanpa
 // perlu scroll baca satu-satu baris. Ditaruh di elemen #matrix-ews-banner (dibuat di HTML).
 const ewsBanner = document.getElementById('matrix-ews-banner');
 if (ewsBanner) {
  if (ewsF2OutOfTolCount > 0) {
   ewsBanner.classList.remove('hidden');
   ewsBanner.innerHTML = `<i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> ${
    currentLang === 'en'
     ? `EWS: ${ewsF2OutOfTolCount} Block/Pit exceed the F2 (Pit Actual/GC) deviation tolerance of ${EWS_F2_TOLERANSI_OUTOFTOL}% -- field check recommended.`
     : `EWS: ${ewsF2OutOfTolCount} Blok/Pit deviasi F2 (Pit Actual/GC) melebihi toleransi ${EWS_F2_TOLERANSI_OUTOFTOL}% -- disarankan cek lapangan.`
   }`;
   if (typeof lucide !== 'undefined') lucide.createIcons();
   if (!ewsAlertNotified) {
    triggerEwsAlert();
    ewsAlertNotified = true;
   }
  } else {
   ewsBanner.classList.add('hidden');
   ewsBanner.innerHTML = '';
   ewsAlertNotified = false; // Reset -- supaya lain kali EWS muncul lagi, notif jalan lagi dari awal.
  }
 }
 }

 function checkExistingTP() {
 const idTp = document.getElementById('validasi-idtp-input').value.trim();
 const hint = document.getElementById('validasi-idtp-hint');
 const headerFields = document.getElementById('validasi-header-fields');
 const meterInput = document.getElementById('validasi-meter-input');

 const existing = globalValidasiData.find(g => g.idTp.toLowerCase() === idTp.toLowerCase());

 if (existing) {
  const canEditCoords = canEditValidasiCoordinates();
  headerFields.classList.remove('hidden');
  const form = document.getElementById('validasiManagerForm');
  if (form) {
   form.elements.bench.value = existing.bench !== '-' ? existing.bench : '';
   form.elements.area.value = existing.area !== '-' ? existing.area : '';
   form.elements.timur.value = existing.timur !== '-' ? existing.timur : '';
   form.elements.utara.value = existing.utara !== '-' ? existing.utara : '';
   form.elements.warna.value = existing.warna !== '-' ? existing.warna : '';
   form.elements.struktur.value = existing.struktur !== '-' ? existing.struktur : '';
  }
  setValidasiHeaderFieldState(true, canEditCoords);
  const nextMeter = Math.min(5, existing.depths.length + 1);
  meterInput.value = nextMeter;
  // Info konteks (Area & tanggal tercatat) -- area dipakai bergantian banyak member,
  // jadi siapa pun yang input langsung tahu ini TP siapa/kapan, tanpa perlu tanya orang lain.
  const areaInfo = existing.area && existing.area !== '-' ? existing.area : (currentLang === 'en' ? 'unknown' : 'tidak diketahui');
  const tglInfo = existing.tanggal && existing.tanggal !== '-' ? existing.tanggal : (currentLang === 'en' ? 'unknown date' : 'tanggal tidak diketahui');
  hint.className = 'text-[10px] mt-1 text-emerald-400';
  hint.innerText = currentLang === 'en'
  ? `Existing TP -- Area: ${areaInfo}, first recorded ${tglInfo}. Adding depth ${nextMeter}/5. Bench/coordinates already recorded, no need to re-enter.`
  : `TP sudah ada -- Area: ${areaInfo}, pertama tercatat ${tglInfo}. Menambah kedalaman ke-${nextMeter}/5. Bench/koordinat sudah tercatat, tidak perlu diisi ulang.`;
  hint.classList.remove('hidden');
  if (existing.depths.length >= 5) {
  hint.className = 'text-[10px] mt-1 text-amber-400';
  hint.innerText = currentLang === 'en'
   ? `This TP already has 5/5 depths recorded (maximum) -- Area: ${areaInfo}, first recorded ${tglInfo}.`
   : `TP ini sudah punya 5/5 kedalaman (maksimal) -- Area: ${areaInfo}, pertama tercatat ${tglInfo}.`;
  }
 } else {
  headerFields.classList.remove('hidden');
  setValidasiHeaderFieldState(false, canEditValidasiCoordinates());
  if (idTp) {
  hint.className = 'text-[10px] mt-1 text-blue-400';
  hint.innerText = currentLang === 'en' ? 'New TP -- fill in the location details below.' : 'TP baru -- lengkapi detail lokasi di bawah.';
  hint.classList.remove('hidden');
  if (!meterInput.value) meterInput.value = 1;
  } else {
  hint.classList.add('hidden');
  }
 }
 }

 function applyIssueFilter() {
 renderIssueTable(globalIssueRawData);
 }

 function translateIssueStatus(status) {
 const s = String(status || '').trim().toLowerCase();
 if (currentLang === 'en') {
  if (s === 'open') return 'Open';
  if (s === 'in progress' || s === 'progress') return 'In Progress';
  if (s === 'close' || s === 'closed') return 'Closed';
  if (s === 'resolved') return 'Resolved';
 } else {
  if (s === 'open') return 'Terbuka';
  if (s === 'in progress' || s === 'progress') return 'Dalam Proses';
  if (s === 'close' || s === 'closed' || s === 'resolved') return 'Selesai';
 }
 return status || '-';
 }

 function renderIssueTable(data) {
 const tbody = document.getElementById('issue-table-body');
 tbody.innerHTML = '';
 const statusFilter = document.getElementById('issue-status-filter') ? document.getElementById('issue-status-filter').value.toLowerCase() : '';

 let openCount = 0, progressCount = 0, resolvedCount = 0;
 let rowsRendered = 0;

 data.forEach(row => {
  const cleanRow = {};
  Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);

  const masalah = cleanRow['masalah'] || '';
  const lokasi = cleanRow['lokasi'] || '';
  if (!masalah && !lokasi) return;

  const status = (cleanRow['status'] || '').trim();
  const statusLower = status.toLowerCase();

  if (statusLower === 'open') openCount++;
  else if (statusLower === 'in progress' || statusLower === 'progress') progressCount++;
  else if (statusLower === 'close' || statusLower === 'closed' || statusLower === 'resolved') resolvedCount++;

  if (statusFilter) {
  if (statusFilter === 'open' && statusLower !== 'open') return;
  if (statusFilter === 'progress' && !statusLower.includes('progress')) return;
  if (statusFilter === 'close' && !statusLower.includes('close') && !statusLower.includes('resolved')) return;
  }

  rowsRendered++;
  const tanggal = cleanRow['tanggal'] || '-';
  const waktu = cleanRow['waktu'] || '-';

  const namaPelapor = cleanRow['pelapor'] || '-';
  const dampak = cleanRow['dampak'] || '-';
  const rekomendasi = cleanRow['rekomendasi'] || '-';
  const pic = cleanRow['pic'] || '-';
  const target = cleanRow['target'] || '-';

  let statusBadgeClass = 'bg-slate-700/30 text-slate-400 border-slate-600/30';
  if (statusLower === 'open') statusBadgeClass = 'bg-red-500/20 text-red-500 border-red-500/30';
  else if (statusLower === 'in progress' || statusLower === 'progress') statusBadgeClass = 'bg-amber-500/20 text-amber-500 border-amber-500/30';
  else if (statusLower === 'close' || statusLower === 'closed' || statusLower === 'resolved') statusBadgeClass = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';

  const tr = document.createElement('tr');
  tr.className = 'hover:bg-slate-800/20 transition-colors';
  tr.innerHTML = `
  <td class="p-3 text-slate-400">${tanggal} ${waktu !== '-' ? '<span class="text-slate-400 text-[10px] ml-1">(' + waktu + ')</span>' : ''}</td>
  <td class="p-3 text-slate-300 font-semibold">${namaPelapor}</td>
  <td class="p-3 font-semibold text-title">${lokasi || '-'}</td>
  <td class="p-3"><span class="px-2 py-0.5 rounded-md text-[11px] bg-red-500/20 text-red-500 border border-red-500/30 font-semibold">${masalah || '-'}</span></td>
  <td class="p-3 text-slate-300 font-medium">${dampak}</td>
  <td class="p-3 text-emerald-500 font-semibold">${rekomendasi}</td>
  <td class="p-3 text-slate-300 font-medium">${pic}</td>
  <td class="p-3 text-slate-300 font-medium">${target}</td>
  <td class="p-3 text-center"><span class="px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadgeClass}">${translateIssueStatus(status)}</span></td>
  <td class="p-3 text-center">${isDeveloperUnlocked() && row['_row'] ? `<button type="button" onclick="deleteIssueByRow(${row['_row']})" class="px-2 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 text-[10px] font-bold">Hapus</button>` : ''}</td>
  `;
  tbody.appendChild(tr);
 });

 if (rowsRendered === 0) {
  tbody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-slate-500 text-xs font-medium" data-i18n="issue_empty_filter">${translations[currentLang].issue_empty_filter}</td></tr>`;
 }

 document.getElementById('issue-count-open').innerText = openCount;
 document.getElementById('issue-count-progress').innerText = progressCount;
 document.getElementById('issue-count-resolved').innerText = resolvedCount;
 }

 function manualRefreshData() {
 // Animasi putar singkat sebagai feedback visual -- sebelumnya klik Refresh terasa
 // "tidak ngapa-ngapain" karena ikonnya diam, padahal proses fetch tetap jalan.
 const icon = document.getElementById('refresh-icon');
 if (icon) {
  icon.classList.add('animate-spin');
  setTimeout(() => icon.classList.remove('animate-spin'), 800);
 }
 fetchDataFromGoogleSheets(true);
 loadMembersFromSheet();
 fetchIssueData();
 fetchValidasiData();
 fetchBlockModelData();
 fetchCOGConfig(); // BARU (v89.16.24)
 // Barging di-fetch lazy (baru diambil saat tab dibuka pertama kali) -- ikut di-refresh
 // di sini juga, TAPI cuma kalau usernya memang lagi ada di tab itu, supaya tidak
 // menambah beban fetch kalau Refresh ditekan dari tab lain.
 if (currentActiveTab === 'barging') { fetchBargeShipmentData(); }
 }

 function applyFetchedProductionData(dataArray) {
 if (!dataArray || dataArray.length === 0) {
  showError("Data Kosong!");
  return;
 }
 globalRawData = dataArray;
 // Bersihkan nama kolom SEKALI di sini untuk semua baris, simpan ke rawToCleanRow --
 // fungsi-fungsi lain (applyGlobalFilter, updateDashboard, renderReconciliation,
 // populatePitDropdown) tinggal ambil hasilnya, tidak perlu proses ulang.
 rawToCleanRow = new WeakMap();
 globalRawData.forEach(row => {
  const c = {};
  Object.keys(row).forEach(k => c[k.trim().toLowerCase()] = row[k]);
  rawToCleanRow.set(row, c);
 });
 globalRawData = sortDiggingCompleteFirst(globalRawData);
 populatePitDropdown(globalRawData);
 applyGlobalFilter();
 if (currentActiveTab === 'rekonsiliasi') { renderReconciliation(); }
 // Kartu Ni% Realisasi di Ringkasan butuh globalRawData (data Digging) -- panggil ulang
 // di sini juga (bukan cuma dari fetchBlockModelData) supaya tidak kena race condition
 // yang sama kayak kolom Validasi kemarin: siapapun yang datang belakangan, render ulang.
 updateBlockModelSummaryCard();
 document.getElementById('sync-status').innerHTML = '<span class="text-emerald-400 font-semibold">' + (currentLang === 'en' ? 'Online ● ' : 'Online ● ') + new Date().toLocaleTimeString() + '</span>';
 }

 function parseAndRenderCSV(csvText) {
 Papa.parse(csvText, {
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
  applyFetchedProductionData(results.data);
  }
 });
 }

 function populatePitDropdown(data) {
 const pitSelect = document.getElementById('pit-filter');
 const currentVal = pitSelect.value;

 const pits = [...new Set(data.map(row => {
  const cleanRow = rawToCleanRow.get(row) || {};
  return cleanRow['pit'] || cleanRow['area'] || null;
 }).filter(Boolean))];

 const defaultOptText = currentLang === 'en' ? 'All Pits' : 'Semua Pit';
 pitSelect.innerHTML = `<option value="">${defaultOptText}</option>`;
 pits.forEach(pit => {
  const opt = document.createElement('option');
  opt.value = pit;
  opt.textContent = pit;
  pitSelect.appendChild(opt);
 });
 pitSelect.value = currentVal;

 const rekonPitSelect = document.getElementById('rekon-pit-filter');
 if (rekonPitSelect) {
  const rekonCurrentVal = rekonPitSelect.value;
  rekonPitSelect.innerHTML = `<option value="">${defaultOptText}</option>`;
  pits.forEach(pit => {
  const opt = document.createElement('option');
  opt.value = pit;
  opt.textContent = pit;
  rekonPitSelect.appendChild(opt);
  });
  rekonPitSelect.value = rekonCurrentVal;
 }
 }

 function showError(msg) {
 document.getElementById('sync-status').innerHTML = '<span class="text-red-400 font-bold">' + msg + '</span>';
 }

 function cleanNumber(val) {
 if (val === null || val === undefined || val === '') return 0;
 let s = val.toString().trim();
 if (s === '') return 0;

 const hasComma = s.includes(',');
 const hasDot = s.includes('.');

 if (hasComma && hasDot) {
  s = s.replace(/\./g, '').replace(',', '.');
 } else if (hasComma && !hasDot) {
  s = s.replace(',', '.');
 } else if (hasDot && !hasComma) {
  const parts = s.split('.');
  if (parts.length === 2 && parts[1].length === 3) {
  s = s.replace('.', '');
  }
 }

 return parseFloat(s) || 0;
 }

 // STEP12B.1: Production_GC Queue.
 // STATUS FULL ditentukan HANYA oleh kolom A-Q (17 field wajib).
 // Kolom R-U (ID EFO, ID ETO, Ship, Keterangan) tidak menentukan FULL
 // karena akan diisi otomatis pada tahap/proses berikutnya.
 // Sorting stabil: DATA FULL di atas, DATA BELUM LENGKAP di bawah,
 // dengan urutan asli tetap dipertahankan di dalam masing-masing kelompok.
 function handleSearchInput() {
 clearTimeout(searchDebounceTimer);
 searchDebounceTimer = setTimeout(() => {
  applyGlobalFilter();
 }, 350);
 }

 function applyGlobalFilter() {
 const selectedPit = document.getElementById('pit-filter').value.toLowerCase();
 const selectedMaterial = document.getElementById('material-filter').value.toLowerCase();
 const searchValue = document.getElementById('table-search') ? document.getElementById('table-search').value.toLowerCase() : '';

 const filteredData = globalRawData.filter(row => {
  const cleanRow = rawToCleanRow.get(row) || {};

  const pit = (cleanRow['pit'] || cleanRow['area'] || '').toLowerCase();
  const mat = (cleanRow['material'] || '').toLowerCase();

  const pitMatch = !selectedPit || pit.includes(selectedPit);
  const matMatch = !selectedMaterial || mat.includes(selectedMaterial);
  const textMatch = !searchValue || Object.values(cleanRow).some(v => v && v.toString().toLowerCase().includes(searchValue));

  return pitMatch && matMatch && textMatch;
 });

 currentPage = 1;
 globalFilteredTableData = filteredData;
 updateDashboard(filteredData);
 renderTableData(filteredData);
 }

 function renderReconciliation() {
 if (!globalRawData || globalRawData.length === 0) return;

 // DIBUAT DEFENSIF (Split 3 Dashboard, 23 Agu): ketiga elemen filter ini hidup di
 // tab-rekonsiliasi, tidak ada di dashboard Member. Fungsi ini dipanggil unconditional
 // dari blok i18n dynamic-refresh begitu globalRawData terisi -- tanpa guard, Member
 // crash setiap kali ganti bahasa (dan render lain sesudahnya di blok yang sama ikut batal).
 const rekonDateStartEl = document.getElementById('rekon-date-start');
 const rekonDateEndEl = document.getElementById('rekon-date-end');
 const rekonPitFilterEl = document.getElementById('rekon-pit-filter');
 if (!rekonDateStartEl || !rekonDateEndEl || !rekonPitFilterEl) return;

 const startVal = rekonDateStartEl.value;
 const endVal = rekonDateEndEl.value;
 const pitVal = rekonPitFilterEl.value.toLowerCase();
 const startDate = startVal ? new Date(startVal + 'T00:00:00') : null;
 const endDate = endVal ? new Date(endVal + 'T23:59:59') : null;

 const rows = globalRawData.map(row => rawToCleanRow.get(row) || {}).filter(r => {
  const material = r['material'] || '';
  const tonaseRaw = cleanNumber(r['tonase']);
  if (!material && tonaseRaw === 0) return false;

  const pit = (r['pit'] || r['area'] || '').toLowerCase();
  if (pitVal && !pit.includes(pitVal)) return false;

  if (startDate || endDate) {
  const d = parseDiggingDate(r['tanggal'] || r['date']);
  if (!d) return false;
  if (startDate && d < startDate) return false;
  if (endDate && d > endDate) return false;
  }
  return true;
 });

 let totalProduksi = 0;
 const byPit = {};
 const pendingRows = [];

 rows.forEach(r => {
  const pit = r['pit'] || r['area'] || '-';
  const blok = r['blok'] || r['id blok'] || r['idblok'] || r['id_blok'] || '-';
  const tujuan = (r['tujuan'] || '').trim();
  const tonase = cleanNumber(r['tonase']);
  totalProduksi += tonase;

  if (!byPit[pit]) byPit[pit] = { blok, produksi: 0, efo: 0, eto: 0, direct: 0, disposal: 0, belum: 0 };
  byPit[pit].produksi += tonase;

  if (tujuan.toLowerCase() === 'efo') byPit[pit].efo += tonase;
  else if (tujuan.toLowerCase() === 'eto') byPit[pit].eto += tonase;
  else if (tujuan.toLowerCase() === 'direct') byPit[pit].direct += tonase;
  else if (tujuan.toLowerCase() === 'disposal') byPit[pit].disposal += tonase;
  else {
  byPit[pit].belum += tonase;
  pendingRows.push(r);
  }
 });

 const totalTerkirim = totalProduksi - Object.values(byPit).reduce((s, p) => s + p.belum, 0);
 const selisih = totalProduksi - totalTerkirim;
 const persen = totalProduksi > 0 ? (totalTerkirim / totalProduksi * 100) : 0;

 document.getElementById('rekon-total-produksi').innerText = totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + (currentLang === 'en' ? ' Tons' : ' Ton');
 document.getElementById('rekon-total-terkirim').innerText = totalTerkirim.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + (currentLang === 'en' ? ' Tons' : ' Ton');
 document.getElementById('rekon-selisih').innerText = selisih.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + (currentLang === 'en' ? ' Tons' : ' Ton');
 document.getElementById('rekon-persen').innerText = persen.toFixed(1) + '%';

 const breakdownBody = document.getElementById('rekon-breakdown-body');
 // Dikelompokkan per Blok dulu, baru alfabetis per Pit di dalamnya --
 // supaya Pit-Pit yang berada di Blok yang sama (mis. L-01: Avanza/Honda/Yamaha)
 // tampil berurutan, bukan tersebar acak sesuai abjad nama Pit.
 const pitNames = Object.keys(byPit).sort((a, b) => {
  const blokA = byPit[a].blok, blokB = byPit[b].blok;
  if (blokA !== blokB) return blokA.localeCompare(blokB);
  return a.localeCompare(b);
 });
 reconciliationBreakdownData = pitNames.map(pit => ({ pit, ...byPit[pit] }));
 if (pitNames.length === 0) {
  breakdownBody.innerHTML = `<tr><td colspan="8" class="text-center p-6 text-slate-500 font-medium">${currentLang === 'en' ? 'No data for this filter.' : 'Tidak ada data untuk filter ini.'}</td></tr>`;
 } else {
  breakdownBody.innerHTML = pitNames.map(pit => {
  const p = byPit[pit];
  return `
   <tr class="hover:bg-slate-800/30 transition-colors">
   <td class="p-2.5 text-slate-400">${p.blok}</td>
   <td class="p-2.5 font-semibold text-title">${pit}</td>
   <td class="p-2.5 text-right font-bold text-title">${p.produksi.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
   <td class="p-2.5 text-right text-blue-400">${p.efo.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
   <td class="p-2.5 text-right text-emerald-400">${p.eto.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
   <td class="p-2.5 text-right text-amber-400">${p.direct.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
   <td class="p-2.5 text-right text-slate-400">${p.disposal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
   <td class="p-2.5 text-right ${p.belum > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}">${p.belum.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
   </tr>
  `;
  }).join('');
 }

 if (rekonChart) {
  rekonChart.data.labels = pitNames;
  rekonChart.data.datasets[0].data = pitNames.map(p => byPit[p].efo);
  rekonChart.data.datasets[1].data = pitNames.map(p => byPit[p].eto);
  rekonChart.data.datasets[2].data = pitNames.map(p => byPit[p].direct);
  rekonChart.data.datasets[3].data = pitNames.map(p => byPit[p].disposal);
  rekonChart.data.datasets[4].data = pitNames.map(p => byPit[p].belum);
  rekonChart.update();
 }

 pendingRows.sort((a, b) => {
  const da = parseDiggingDate(a['tanggal'] || a['date']);
  const db = parseDiggingDate(b['tanggal'] || b['date']);
  if (!da || !db) return 0;
  return da - db;
 });

 const pendingBody = document.getElementById('rekon-pending-body');
 const pendingBadge = document.getElementById('rekon-pending-badge');
 if (pendingBadge) {
  if (pendingRows.length > 0) {
  pendingBadge.innerText = pendingRows.length;
  pendingBadge.classList.remove('hidden');
  } else {
  pendingBadge.classList.add('hidden');
  }
 }

 if (pendingRows.length === 0) {
  pendingBody.innerHTML = `<tr><td colspan="7" class="text-center p-6 text-emerald-400 font-medium">${currentLang === 'en' ? 'All rows have a destination assigned.' : 'Semua baris sudah punya Tujuan.'}</td></tr>`;
 } else {
  const today = new Date();
  pendingBody.innerHTML = pendingRows.map(r => {
  const d = parseDiggingDate(r['tanggal'] || r['date']);
  const daysWaiting = d ? Math.max(0, Math.floor((today - d) / 86400000)) : null;
  const isStale = daysWaiting !== null && daysWaiting > 3;
  const badgeClass = isStale
   ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
   : 'bg-slate-700/40 text-slate-400 border-slate-600/40';
  const badgeText = daysWaiting === null ? '-' : (daysWaiting + (currentLang === 'en' ? 'd' : 'h'));
  return `
   <tr class="hover:bg-slate-800/30 transition-colors">
   <td class="p-2.5 text-slate-300">${(r['tanggal'] || r['date'] || '-').toString().split(' ')[0]}</td>
   <td class="p-2.5 font-semibold text-title">${r['pit'] || r['area'] || '-'}</td>
   <td class="p-2.5">${r['blok'] || r['id blok'] || r['idblok'] || r['id_blok'] || '-'}</td>
   <td class="p-2.5">${r['material'] || '-'}</td>
   <td class="p-2.5 text-right font-bold text-title">${cleanNumber(r['tonase']).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
   <td class="p-2.5">${r['id sampel'] || r['id_sampel'] || '-'}</td>
   <td class="p-2.5 text-center"><span class="px-2 py-0.5 rounded-md text-[11px] border font-semibold ${badgeClass}">${badgeText}</span></td>
   </tr>
  `;
  }).join('');
 }

 lucide.createIcons();
 }

 function resetReconciliationFilter() {
 document.getElementById('rekon-date-start').value = '';
 document.getElementById('rekon-date-end').value = '';
 document.getElementById('rekon-pit-filter').value = '';
 renderReconciliation();
 }

 let currentPageDiggingRows = [];
 let reconciliationBreakdownData = [];

 function renderTableData(data) {
 const tbody = document.getElementById('table-body');
 tbody.innerHTML = '';
 globalFilteredTableData = data;
 currentPageDiggingRows = [];

 const total = data ? data.length : 0;

 if (!total) {
  tbody.innerHTML = `<tr><td colspan="17" class="text-center p-6 text-slate-500 font-medium">${currentLang === 'en' ? 'No data found.' : 'Tidak ada data yang ditemukan.'}</td></tr>`;
  document.getElementById('table-info').innerText = currentLang === 'en' ? 'Showing 0 data rows' : 'Menampilkan 0 baris data';
  updatePaginationControls(1, 1);
  return;
 }

 const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));
 if (currentPage > totalPages) currentPage = totalPages;
 if (currentPage < 1) currentPage = 1;
 const start = (currentPage - 1) * ROWS_PER_PAGE;
 const end = Math.min(start + ROWS_PER_PAGE, total);
 const pageData = data.slice(start, end);

 pageData.forEach((row, i) => {
  const cleanRow = {};
  Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);

  const material = cleanRow['material'] || '';
  const tonaseRaw = cleanNumber(cleanRow['tonase']);
  // Lewati baris yang benar-benar kosong (tanpa material & tonase 0) --
  // ini biasanya baris kosong sisa di bawah data asli pada Google Sheets.
  if (!material && tonaseRaw === 0) return;

  const tanggal = cleanRow['tanggal'] || cleanRow['date'] || '-';
  const dayVal = cleanRow['shift'] || '-';
  const pelapor = cleanRow['pelapor'] || cleanRow['nama'] || '-';
  const pit = cleanRow['pit'] || cleanRow['area'] || '-';
  const blok = cleanRow['blok'] || cleanRow['id blok'] || cleanRow['idblok'] || cleanRow['id_blok'] || '-';
  const tonase = tonaseRaw;
  const ni = cleanRow['ni %'] || cleanRow['ni'] || '-';
  const fe = cleanRow['fe %'] || cleanRow['fe'] || '-';
  const co = cleanRow['co %'] || cleanRow['co'] || '-';
  const mgo = cleanRow['mgo %'] || cleanRow['mgo'] || '-';
  const sio2 = cleanRow['sio2 %'] || cleanRow['sio2'] || '-';
  // SM % adalah hasil hitung (SiO2 ÷ MgO) di sheet -- kalau datang sebagai angka mentah
  // dari Apps Script (bukan teks CSV yang sudah diformat sheet), desimalnya bisa panjang
  // sekali (contoh 1.3403508771929826). Dibulatkan 2 desimal di sini, konsisten dengan
  // format SM % rata-rata di tabel Validasi.
  const smRaw = cleanRow['sm %'] || cleanRow['sm'] || '-';
  const sm = typeof smRaw === 'number' ? smRaw.toFixed(2) : smRaw;
  const niNum = cleanNumber(ni);

  // Field detail (sebagian juga ditampilkan di tabel utama, sisanya cuma lewat popup)
  const cuaca = cleanRow['cuaca'] || '-';
  // BARU (v90.2.108): Waktu_Input diisi otomatis server-side saat submit (kolom B baru,
  // disisipkan setelah Tanggal) -- ditampilkan di popup detail, TIDAK ada di form input
  // manapun karena bukan field yang diisi user.
  const waktuInput = cleanRow['waktu_input'] || cleanRow['waktu input'] || '-';
  const idSampel = cleanRow['id sampel'] || cleanRow['id_sampel'] || '-';
  // BARU: Total Sampel (jumlah karung) -- sebelumnya cuma dibaca di form INPUT (buat hitung
  // Tonase otomatis), tapi tidak pernah ditampilkan balik ke Tabel Digging/popup detail
  // setelah tersimpan. Ketahuan pas data sheet sudah keisi 25/20/10/20 tapi tidak kelihatan
  // di manapun di dashboard.
  const totalSampelDisplay = cleanRow['total sampel (karung)'] || cleanRow['total sampel'] || cleanRow['total_sampel'] || '-';
  const tujuan = cleanRow['tujuan'] || '-';
  const namaShip = cleanRow['nama ship'] || cleanRow['kapal'] || cleanRow['ship'] || '-';
  const idEfo = cleanRow['id efo'] || '-';
  const idEto = cleanRow['id eto'] || '-';
  const keterangan = cleanRow['keterangan'] || '-';

  // BARU (v89.16.24): Class_Grade dihitung otomatis lewat classifyMaterial() (5 level
  // Waste/LG/MG/HG/VHG dari COGConfig), MENGGANTIKAN badge lama 3-tingkat hardcode
  // (High/Medium/Low Grade, 1.5/1.3) dan field "material" manual dari sheet.
  const tipeOreRow = cleanRow['tipe_ore'] || cleanRow['tipe ore'] || '';
  const smForClassify = typeof sm === 'number' ? sm : parseFloat(sm);
  const classifyResult = classifyMaterial(niNum, tipeOreRow, smForClassify);
  // BARU (27 Agu, "Submit Dulu, Koreksi Nanti"): classGrade 'N/A' di konteks Tabel
  // Digging SELALU berarti "Ni belum ada" (satu-satunya jalur ke 'N/A' di classifyMaterial
  // adalah niNum<=0) -- jadi badge khusus berkedip di sini, BUKAN badge N/A abu-abu biasa
  // (renderClassGradeBadge dibiarkan utuh krn dipakai jg di tabel Validasi, beda konteks).
  const isPendingAssay = classifyResult.classGrade === 'N/A';
  const statusBadge = isPendingAssay
   ? '<span class="px-2 py-0.5 rounded-md text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>' + (currentLang === 'en' ? 'Awaiting Lab' : 'Menunggu Lab') + '</span>'
   : renderClassGradeBadge(classifyResult.classGrade);

  // BARU: kolom "Material" cukup tampilkan Tipe Ore (nama lengkap Saprolite/Limonite) --
  // grade (Waste/LG/MG/HG/VHG) TIDAK diulang di sini karena sudah ada kolom "Status Grade"
  // sendiri (lihat statusBadge di bawah). Sebelumnya kolom ini tampil "HG (Sapro)" yang
  // dobel dengan badge grade di kolom lain -- membingungkan, sekarang cukup "Saprolite".
  const tipeOreLabelMap = { 'Sapro': 'Saprolite', 'Limo': 'Limonite' };
  const tipeOreLabel = tipeOreLabelMap[classifyResult.tipeOreFinal] || classifyResult.tipeOreFinal;

  const rowIndex = currentPageDiggingRows.length;
  currentPageDiggingRows.push({
  tanggal, dayVal, pelapor, pit, blok, material, tonase, ni, fe, co, mgo, sio2, sm,
  cuaca, waktuInput, idSampel, tujuan, namaShip, idEfo, idEto, keterangan, totalSampelDisplay,
  // BARU (v89.16.24): simpan hasil classifyMaterial() supaya detail modal & tempat
  // lain yang baca dari currentPageDiggingRows tetap konsisten (bukan hitung ulang).
  classGrade: classifyResult.classGrade, tipeOreFinal: classifyResult.tipeOreFinal, tipeOreLabel,
  // BARU (27 Agu): flag "masih menunggu hasil lab" -- dipakai detail modal utk
  // tampilkan tombol "Update Hasil Assay".
  isPendingAssay
  });

  // Warna teks Ni% ikut hasil classifyMaterial() (classGrade) lewat preset warna
  // terpusat (getGradeTextClass) yang bisa diatur user di Settings > Parameter COG --
  // bukan lagi hardcode hijau untuk semua baris, dan bukan lagi mapping lokal per tempat.
  const niColorClass = getGradeTextClass(classifyResult.classGrade);

  const tr = document.createElement('tr');
  tr.className = 'hover:bg-slate-800/30 transition-colors cursor-pointer';
  tr.onclick = () => openDiggingDetailModal(rowIndex);
  tr.innerHTML = `
  <td class="p-3 text-slate-400">${start + i + 1}</td>
  <td class="p-3 text-slate-300">${tanggal}</td>
  <td class="p-3 text-blue-400 font-semibold">${dayVal}</td>
  <td class="p-3 text-slate-300">${pelapor}</td>
  <td class="p-3 font-semibold text-title">${pit}</td>
  <td class="p-3 font-medium text-title">${blok}</td>
  <td class="p-3 text-slate-300">${tipeOreLabel}</td>
  <td class="p-3 text-slate-300">${idSampel}</td>
  <td class="p-3 text-center text-slate-400">${totalSampelDisplay}</td>
  <td class="p-3 text-right font-bold text-title">${tonase.toLocaleString()}</td>
  <td class="p-3 text-center ${niColorClass} font-bold">${ni}</td>
  <td class="p-3 text-center text-slate-300">${fe}</td>
  <td class="p-3 text-center text-slate-300">${co}</td>
  <td class="p-3 text-center text-slate-300">${mgo}</td>
  <td class="p-3 text-center text-slate-300">${sio2}</td>
  <td class="p-3 text-center text-slate-300">${sm}</td>
  <td class="p-3 text-center">${statusBadge}</td>
  `;
  tbody.appendChild(tr);
 });

 document.getElementById('table-info').innerText = currentLang === 'en'
  ? `Showing ${start + 1}-${end} of ${total} rows`
  : `Menampilkan ${start + 1}-${end} dari ${total} baris`;
 updatePaginationControls(currentPage, totalPages);
 }

 function updatePaginationControls(page, totalPages) {
 const pageIndicator = document.getElementById('page-indicator');
 const btnPrev = document.getElementById('btn-prev-page');
 const btnNext = document.getElementById('btn-next-page');
 if (!pageIndicator || !btnPrev || !btnNext) return;

 pageIndicator.innerText = `${page} / ${totalPages}`;
 btnPrev.disabled = page <= 1;
 btnNext.disabled = page >= totalPages;
 }

 function prevPage() {
 if (currentPage > 1) {
  currentPage--;
  renderTableData(globalFilteredTableData);
 }
 }

 function nextPage() {
 const totalPages = Math.max(1, Math.ceil(globalFilteredTableData.length / ROWS_PER_PAGE));
 if (currentPage < totalPages) {
  currentPage++;
  renderTableData(globalFilteredTableData);
 }
 }

 function updateDashboard(data) {
 let totalTonase = 0, oreTonase = 0, wasteTonase = 0, totalNi = 0, niCount = 0;
 let totalNiOre = 0, niCountOre = 0;
 let saprolitTon = 0, limonitTon = 0, lgTon = 0;

 const matGroupNiSum = {};
 const matGroupNiCount = {};
 const matGroupBlok = {};
 const dateTonaseMap = {}, dateNiMap = {};
 const pitSmMap = {};

 data.forEach(row => {
  const cleanRow = rawToCleanRow.get(row) || {};

  const tonase = cleanNumber(cleanRow['tonase']);
  let ni = cleanNumber(cleanRow['ni %'] || cleanRow['ni']);
  if (ni > 50) ni = ni / 100;

  // BARU (v89.16.24): grouping KPI ini sekarang berbasis classifyMaterial() (Class_Grade
  // otomatis dari Ni%+Tipe_Ore lewat COGConfig), MENGGANTIKAN pengelompokan lama yang
  // baca string manual dari kolom "material" (mat.includes('saprolit') dst).
  const blok = (cleanRow['blok'] || cleanRow['id blok'] || cleanRow['idblok'] || cleanRow['id_blok'] || '').trim();
  const tanggal = cleanRow['tanggal'] ? cleanRow['tanggal'].trim() : (cleanRow['date'] ? cleanRow['date'].trim() : '');
  const tipeOreRowKpi = cleanRow['tipe_ore'] || cleanRow['tipe ore'] || '';
  const smRowKpi = cleanNumber(cleanRow['sm %'] || cleanRow['sm']);
  const classifyKpi = classifyMaterial(ni, tipeOreRowKpi, smRowKpi);
  const mat = classifyKpi.classGrade.toLowerCase();

  if (tonase === 0) return;

  totalTonase += tonase;
  if (mat === 'waste' || mat === 'n/a') {
  wasteTonase += tonase;
  } else {
  oreTonase += tonase;
  // saprolitTon/limonitTon sekarang mewakili Tipe_Ore hasil klasifikasi (bukan lagi
  // teks manual); lgTon mewakili baris dengan Class_Grade = LG.
  if (classifyKpi.tipeOreFinal === 'Sapro') saprolitTon += tonase;
  else if (classifyKpi.tipeOreFinal === 'Limo') limonitTon += tonase;
  if (mat === 'lg') lgTon += tonase;
  }

  if (ni > 0) {
  totalNi += ni;
  niCount++;
  if (mat !== 'waste') {
   totalNiOre += ni;
   niCountOre++;
  }

  let displayMatKey = cleanRow['material'].trim();
  if (!matGroupNiSum[displayMatKey]) {
   matGroupNiSum[displayMatKey] = 0;
   matGroupNiCount[displayMatKey] = 0;
  }
  matGroupNiSum[displayMatKey] += ni;
  matGroupNiCount[displayMatKey]++;
  }

  if (blok) {
  let displayMatKey = cleanRow['material'].trim();
  matGroupBlok[displayMatKey] = (matGroupBlok[displayMatKey] || 0) + tonase;
  }

  if (tanggal) {
  let dateKey = tanggal.split(' ')[0];
  dateTonaseMap[dateKey] = (dateTonaseMap[dateKey] || 0) + tonase;
  if (ni > 0) {
   if (!dateNiMap[dateKey]) dateNiMap[dateKey] = { sum: 0, count: 0 };
   dateNiMap[dateKey].sum += ni;
   dateNiMap[dateKey].count++;
  }
  }

  const mgo = cleanNumber(cleanRow['mgo %'] || cleanRow['mgo']);
  const sio2 = cleanNumber(cleanRow['sio2 %'] || cleanRow['sio2']);
  if (mgo > 0 && sio2 > 0) {
  const pitName = (cleanRow['pit'] || cleanRow['area'] || 'Unknown').trim();
  if (!pitSmMap[pitName]) pitSmMap[pitName] = { sum: 0, count: 0 };
  pitSmMap[pitName].sum += sio2 / mgo;
  pitSmMap[pitName].count++;
  }
 });

 const avgNi = niCount > 0 ? (totalNi / niCount) : 0;
 const avgNiOre = niCountOre > 0 ? (totalNiOre / niCountOre) : 0;
 const sr = oreTonase > 0 ? (wasteTonase / oreTonase).toFixed(2) : '0.00';

 document.getElementById('kpi-total-tonase').innerHTML = `${totalTonase.toLocaleString()} <span class="text-xs font-semibold text-slate-400 ml-1.5" data-i18n="unit_ton">${currentLang === 'en' ? 'Tons' : 'Ton'}</span>`;
 document.getElementById('kpi-ore-tonase').innerHTML = `${oreTonase.toLocaleString()} <span class="text-xs font-semibold text-slate-400 ml-1.5" data-i18n="unit_ton">${currentLang === 'en' ? 'Tons' : 'Ton'}</span>`;
 // FIX (23 Agu): persentase Sap/Lim/LG dipindah ke legend "Distribusi Material Per Blok"
 // (generateLabels materialChart) -- kartu ini sekarang cukup teks statis (data-i18n
 // kpi_ore_sub), tidak perlu dihitung/diisi dinamis lagi di sini.
 document.getElementById('kpi-rata-ni').innerText = avgNi.toFixed(2) + '%';
 document.getElementById('kpi-rata-ni-ore').innerText = avgNiOre.toFixed(2) + '%';
 document.getElementById('kpi-sr').innerText = sr;
 document.getElementById('kpi-waste').innerText = (currentLang === 'en' ? 'Total Waste: ' : 'Total Waste: ') + wasteTonase.toLocaleString() + (currentLang === 'en' ? ' Tons' : ' Ton');

 if (materialChart) {
  materialChart.data.datasets[0].data = [saprolitTon, limonitTon, lgTon, wasteTonase];
  materialChart.update();
  renderMaterialLegend([saprolitTon, limonitTon, lgTon, wasteTonase]);
 }

 if (gradeChart) {
  const labels = Object.keys(matGroupNiSum);
  const avgNiValues = labels.map(l => (matGroupNiSum[l] / matGroupNiCount[l]).toFixed(2));
  // BARU: garis target sekarang RANGE (Min-Max) dari globalCOGConfig.Target_Ship_Ni_Min/Max
  // (Settings > Parameter COG), MENGGANTIKAN angka 1.50% tunggal yang dulu hardcode --
  // 1.50% itu sebenarnya cuma titik tengah spesifikasi jual kapal, bukan target tunggal.
  const shipMin = (globalCOGConfig && globalCOGConfig.Target_Ship_Ni_Min) || 1.3;
  const shipMax = (globalCOGConfig && globalCOGConfig.Target_Ship_Ni_Max) || 1.6;
  const targetLineMin = labels.map(() => shipMin);
  const targetLineMax = labels.map(() => shipMax);
  gradeChart.data.datasets[1].label = (currentLang === 'en' ? 'Ship Target Min (' : 'Target Kapal Min (') + shipMin.toFixed(2) + '%)';
  gradeChart.data.datasets[2].label = (currentLang === 'en' ? 'Ship Target Max (' : 'Target Kapal Max (') + shipMax.toFixed(2) + '%)';

  // Peta warna berdasarkan NAMA material -- disamakan persis dengan donut chart
  // "Distribusi Material Per Blok", supaya warna selalu konsisten di kedua chart
  // berapa pun urutan kemunculan material di data.
  const materialColorMap = {
  'saprolit': '#059669',      // Emerald 600 - high Ni ore
  'sapr': '#059669',
  'limonit': '#0ea5e9',       // Sky 500 - limonite
  'lim': '#0ea5e9',
  'low grade': '#f59e0b',     // Amber 500 - LG
  'lg': '#f59e0b',
  'waste': '#475569',         // Slate 600 - waste lebih gelap kontras
  'boulder': '#78716c',
  'overburden': '#57534e'
  };
  const materialColorMapSoft = {
  'saprolit': 'rgba(5, 150, 105, 0.15)',
  'limonit': 'rgba(14, 165, 233, 0.15)',
  'low grade': 'rgba(245, 158, 11, 0.15)',
  'lg': 'rgba(245, 158, 11, 0.15)',
  'waste': 'rgba(71, 85, 105, 0.15)'
  };
  const barColors = labels.map(l => materialColorMap[l.toLowerCase()] || '#94a3b8');

  gradeChart.data.labels = labels;
  gradeChart.data.datasets[0].data = avgNiValues;
  gradeChart.data.datasets[0].backgroundColor = barColors;
  gradeChart.data.datasets[1].data = targetLineMin;
  gradeChart.data.datasets[2].data = targetLineMax;
  gradeChart.update();
 }

 if (trendTonaseChart) {
  const sortedDates = Object.keys(dateTonaseMap).sort();
  const tonaseValues = sortedDates.map(d => dateTonaseMap[d]);

  trendTonaseChart.data.labels = sortedDates;
  trendTonaseChart.data.datasets[0].data = tonaseValues;
  trendTonaseChart.update();

  if (tonaseValues.length > 0) {
  const maxT = Math.max(...tonaseValues);
  document.getElementById('trend-peak-tonnage').innerText = maxT.toLocaleString() + (currentLang === 'en' ? ' Tons' : ' Ton');
  }
 }

 if (trendNiChart) {
  const sortedDates = Object.keys(dateNiMap).sort();
  const niValues = sortedDates.map(d => (dateNiMap[d].sum / dateNiMap[d].count).toFixed(2));
  const cutOffLine = sortedDates.map(() => 1.30);

  trendNiChart.data.labels = sortedDates;
  trendNiChart.data.datasets[0].data = niValues;
  trendNiChart.data.datasets[1].data = cutOffLine;
  trendNiChart.update();

  if (niValues.length > 0) {
  const maxN = Math.max(...niValues);
  document.getElementById('trend-max-grade').innerText = maxN.toFixed(2) + '%';
  }
 }

 if (smChart) {
  const pitLabels = Object.keys(pitSmMap);
  const smValues = pitLabels.map(p => (pitSmMap[p].sum / pitSmMap[p].count).toFixed(2));

  smChart.data.labels = pitLabels;
  smChart.data.datasets[0].data = smValues;
  smChart.update();
 }
 lucide.createIcons();
 }

 document.addEventListener('click', function (event) {
 const wrap = document.getElementById('member-session-avatar-wrap');
 const menu = document.getElementById('member-session-menu');
 if (wrap && menu && !wrap.contains(event.target)) menu.classList.add('hidden');
});

window.addEventListener('DOMContentLoaded', async () => {
 setLanguage(currentLang);
 initCharts();
 // Data produksi (CSV publish, endpoint terpisah dari Apps Script) -- aman jalan bareng, tidak ikut antre.
 fetchDataFromGoogleSheets();
 // BARU (v89.16.24): COGConfig dibutuhkan Tabel Digging & KPI segera setelah data produksi
 // datang (classifyMaterial() dipakai saat render) -- ditembak di awal juga (jeda 0ms sejajar
 // loadMembersFromSheet), bukan diantre di akhir, supaya jendela "render pakai fallback
 // default" sekecil mungkin. Re-render otomatis tetap terjadi di akhir fetchCOGConfig() kalau
 // memang datang belakangan dari fetchDataFromGoogleSheets().
 setTimeout(() => fetchCOGConfig(), 0);
 // Initial load hanya memuat data yang langsung dipakai Ringkasan. Data Validasi,
 // JSA, dan Chat dimuat saat tab terkait dibuka sehingga tidak ada enam request
 // Apps Script yang saling berebut pada cold start.
 setTimeout(() => loadMembersFromSheet(), 0);
 setTimeout(() => fetchIssueData(), 250);
 setTimeout(() => fetchBlockModelData(), 500);
 // Regional & Time READ is public and must load independently of Developer authorization.
 await loadRegionalTimeSettings();
 await refreshSecuritySession();
 renderMemberSessionAvatar();
 await refreshMemberSecuritySession();
 await loadActiveMemberSessions(); // BARU (27 Agu): Active User Indicator -- no-op kalau devToken kosong
 // DIBUAT DEFENSIF (Split 3 Dashboard, 23 Agu): elemen ini hidup di dalam tab-settings,
 // yang tidak ada di dashboard Member/Supervisor -- guard null di sini, jalur unconditional
 // di DOMContentLoaded ini kalau tidak dijaga akan throw dan menghentikan SEMUA inisialisasi
 // sesudahnya (setInterval fetch berkala, dst) di kedua dashboard turunan.
 const appVersionLabelEl = document.getElementById('app-version-label');
 if (appVersionLabelEl) appVersionLabelEl.innerText = APP_VERSION;
 setInterval(() => {
  fetchDataFromGoogleSheets();
 }, 60000);
 setInterval(() => {
  refreshMemberSecuritySession();
 }, MEMBER_SESSION_CHECK_INTERVAL_MS);
 setInterval(() => {
  loadActiveMemberSessions(); // BARU (27 Agu): Active User Indicator refresh berkala
 }, MEMBER_SESSION_CHECK_INTERVAL_MS);
 setInterval(() => {
  rotateActiveSecurityTokens();
 }, 60 * 1000);
 // Chat hanya dipoll saat tab Chat aktif dan browser terlihat.
 setInterval(() => {
  if (currentActiveTab === 'chat' && !document.hidden) { fetchChatData(); }
 }, CHAT_POLL_INTERVAL);
 });


// BARU (27 Agu): scroll horizontal via roda mouse -- setelah batang scrollbar
// disembunyikan total, mouse biasa (bukan trackpad) kehilangan satu-satunya cara
// geser ke samping (drag batang horizontal). Solusi standar (dipakai GitHub dkk):
// begitu roda mouse diputar SAAT kursor di atas tabel yang overflow horizontal (dan
// TIDAK overflow vertikal -- supaya tidak "mencuri" scroll vertikal biasa dari
// elemen yang memang scroll dua arah), gerakan roda dialihkan jadi scrollLeft.
// Pakai event delegation di document supaya otomatis berlaku ke tabel manapun,
// termasuk yang HTML-nya di-render ulang lewat innerHTML (barge-loading-log-table
// dkk) -- tidak perlu daftar ulang listener tiap kali tabel di-refresh.
document.addEventListener('wheel', function(e) {
 const container = e.target.closest('.overflow-x-auto');
 if (!container) return;
 const hasHorizontalOverflow = container.scrollWidth > container.clientWidth;
 const hasVerticalOverflow = container.scrollHeight > container.clientHeight;
 // Cuma alihkan kalau gerakan roda dominan vertikal (deltaY) DAN elemen ini murni
 // butuh scroll horizontal -- trackpad yang sudah kirim deltaX asli dibiarkan lewat apa adanya.
 if (hasHorizontalOverflow && !hasVerticalOverflow && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
  container.scrollLeft += e.deltaY;
  e.preventDefault();
 }
}, { passive: false });


// ==== MAIN/INIT ====
document.addEventListener('DOMContentLoaded', function(){
 try{ initResetProjectControls(); }catch(e){}
 try{ initCompactBlankRowsControls(); }catch(e){}
 try{
  // BARU (27 Agu): dipisah jadi 2 mount point -- Sistem (Cleanup Data, Padatkan Baris,
  // Reset Total, Reset PIN Member) vs Technical (Panduan Rekonsiliasi, Atur Parameter
  // Global). updateDeveloperAccessUI() tetap 1 fungsi yg sama, toggle SEMUA panel
  // berdasarkan ID tanpa peduli mount ke modal yang mana.
  const mountSistem=document.getElementById('developer-console-panels');
  ['dev-cleanup-panel','dev-compact-panel','panel-reset-project','panel-reset-member-pin'].forEach(function(id){
   const el=document.getElementById(id);
   if(el && mountSistem) mountSistem.appendChild(el);
  });
  const mountTechnical=document.getElementById('developer-console-technical-panels');
  ['panel-guide-rekonsiliasi','panel-parameter-global','panel-kpi-event-approval','panel-formula-kpi'].forEach(function(id){
   const el=document.getElementById(id);
   if(el && mountTechnical) mountTechnical.appendChild(el);
  });
  updateDeveloperAccessUI();
 }catch(e){ console.warn('Developer Console init skipped:',e); }
 try{ initPwaUpdateWatcher(); }catch(e){ console.warn('PWA update watcher skipped:',e); }
});

// BARU (22 Agu): Registrasi Service Worker + deteksi update PWA. Bungkus try-catch
// menyeluruh + cek dukungan browser -- kalau serviceWorker tidak didukung (mis. HTTP
// biasa bukan HTTPS, atau browser lama), dashboard TETAP jalan normal seperti sekarang,
// cuma fitur notifikasi update ini yang tidak aktif.
let pwaWaitingWorker = null;
function initPwaUpdateWatcher() {
 if (!('serviceWorker' in navigator)) return;
 navigator.serviceWorker.register('./sw.js').then(function(registration) {
  // Kasus A: SW baru ketemu SAAT halaman ini masih terbuka (paling umum -- tim buka
  // app, lalu kita deploy versi baru, lalu browser cek ulang beberapa saat kemudian).
  registration.addEventListener('updatefound', function() {
   const newWorker = registration.installing;
   if (!newWorker) return;
   newWorker.addEventListener('statechange', function() {
    // 'installed' + navigator.serviceWorker.controller SUDAH ada (bukan install
    // pertama kali) = ini benar-benar UPDATE, bukan instalasi awal PWA.
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
     pwaWaitingWorker = newWorker;
     showPwaUpdateToast();
    }
   });
  });
  // Kasus B: tab ini baru dibuka SETELAH versi baru sempat ter-install di background
  // sebelumnya (mis. tab lain sempat dibuka duluan) -- SW baru sudah "waiting", tinggal ditawarkan.
  if (registration.waiting && navigator.serviceWorker.controller) {
   pwaWaitingWorker = registration.waiting;
   showPwaUpdateToast();
  }
  // Poll aktif tiap 60 detik -- supaya notifikasi muncul dalam ~1 menit setelah deploy,
  // tidak menunggu siklus cek otomatis browser (yang bisa sampai ~24 jam).
  setInterval(function(){ registration.update().catch(function(){}); }, 60000);
 }).catch(function(err) { console.warn('SW registration gagal:', err); });

 // Begitu SW baru benar-benar ambil alih (setelah skipWaiting dari applyPwaUpdate()),
 // reload SEKALI otomatis -- ini bagian dari alur yang sudah dikonfirmasi user via klik,
 // bukan reload paksa tanpa sepengetahuan user.
 let reloading = false;
 navigator.serviceWorker.addEventListener('controllerchange', function() {
  if (reloading) return;
  reloading = true;
  window.location.reload();
 });
}
function showPwaUpdateToast() {
 const toast = document.getElementById('pwa-update-toast');
 if (toast) { toast.classList.remove('hidden'); lucide.createIcons(); }
}
function dismissPwaUpdateToast() {
 const toast = document.getElementById('pwa-update-toast');
 if (toast) toast.classList.add('hidden');
}
function applyPwaUpdate() {
 if (pwaWaitingWorker) pwaWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
 dismissPwaUpdateToast();
}

