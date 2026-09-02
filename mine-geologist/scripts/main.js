// ============================================================
// MAIN.JS -- Entry point & inisialisasi aplikasi
// ============================================================

// ============================================================
// GLOBAL STATE (Satu-satunya deklarasi variabel global)
// ============================================================

let currentPage = 1;
let searchDebounceTimer = null;
let globalFilteredTableData = [];
let globalRawData = [];
let rawToCleanRow = new WeakMap();
let filteredExportData = [];
let globalMemberData = [];
let globalJsaLogData = [];
let globalBargeShipmentData = [];
let globalBargeLoadingLogData = [];
let globalBargeShiftReportData = [];
let globalBargeSublotData = [];
let globalRcaLogData = [];
let globalPitActualData = [];
let globalBlockModelData = [];
let globalChatData = [];
let globalIssueRawData = [];
let globalValidasiData = [];
let globalValidasiConfig = {};
let globalCOGConfig = null;
let cogConfigUsingFallback = false;
let currentActiveTab = 'ringkasan';
let currentTrendView = 'tonase';
let currentRekonView = 'breakdown';
let currentOpenDiggingRow = null;
let currentOpenBargeShipment = null;
let domePickerListCache = [];
let reconciliationBreakdownData = [];
let ewsAlertNotified = false;
// FIX: gunakan window.chatLastSeenRow sebagai sumber tunggal
window.chatLastSeenRow = 0;
let rcaExportRequestId = 0;
let rcaExportLoading = false;
let pendingExportType = '';
let pendingExportSource = 'digging';
let pendingExportOrientation = 'portrait';
let compactPreviewState = { sheet: '', totalRows: 0, blankRows: [] };

// Chart instances
let materialChart, gradeChart, trendTonaseChart, trendNiChart, smChart, rekonChart, validasiChart, blockModelChart, trendMonthlyChart;

// Stale data tracking
const staleDataSources = new Set();

// ============================================================
// 🔥 FIX BLOCKER #1: SINKRONKAN WINDOW DENGAN STATE LOKAL
// ============================================================

function syncGlobalStateToWindow() {
  window.globalRawData = globalRawData;
  window.rawToCleanRow = rawToCleanRow;
  window.globalFilteredTableData = globalFilteredTableData;
  window.globalMemberData = globalMemberData;
  window.globalJsaLogData = globalJsaLogData;
  window.globalBargeShipmentData = globalBargeShipmentData;
  window.globalBargeLoadingLogData = globalBargeLoadingLogData;
  window.globalBargeShiftReportData = globalBargeShiftReportData;
  window.globalBargeSublotData = globalBargeSublotData;
  window.globalRcaLogData = globalRcaLogData;
  window.globalPitActualData = globalPitActualData;
  window.globalBlockModelData = globalBlockModelData;
  window.globalChatData = globalChatData;
  window.globalIssueRawData = globalIssueRawData;
  window.globalValidasiData = globalValidasiData;
  window.globalValidasiConfig = globalValidasiConfig;
  window.globalCOGConfig = globalCOGConfig;
  window.cogConfigUsingFallback = cogConfigUsingFallback;
  window.reconciliationBreakdownData = reconciliationBreakdownData;
  window.domePickerListCache = domePickerListCache;
  window.currentOpenDiggingRow = currentOpenDiggingRow;
  window.currentOpenBargeShipment = currentOpenBargeShipment;
  window.chatLastSeenRow = window.chatLastSeenRow;
  window.ewsAlertNotified = ewsAlertNotified;
}

// ============================================================
// 🔥 FIX BLOCKER #2: DASHBOARD UPDATE ENGINE
// ============================================================

function updateDashboard(data) {
  // Gunakan data yang diberikan, atau fallback ke globalFilteredTableData
  const sourceData = data || globalFilteredTableData || globalRawData;
  if (!sourceData || sourceData.length === 0) {
    // Jika tidak ada data, reset KPI cards ke 0
    document.getElementById('kpi-total-tonase').innerHTML = '0 <span class="text-xs font-semibold text-slate-400 ml-1.5" data-i18n="unit_ton">Ton</span>';
    document.getElementById('kpi-ore-tonase').innerHTML = '0 <span class="text-xs font-semibold text-slate-400 ml-1.5" data-i18n="unit_ton">Ton</span>';
    document.getElementById('kpi-rata-ni').innerText = '0%';
    document.getElementById('kpi-rata-ni-ore').innerText = '0%';
    document.getElementById('kpi-sr').innerText = '0.00';
    document.getElementById('kpi-waste').innerText = (window.currentLang === 'en' ? 'Total Waste: ' : 'Total Waste: ') + '0 Ton';
    return;
  }

  // --- Kalkulasi ulang semua KPI ---
  let totalTonase = 0, oreTonase = 0, wasteTonase = 0, pendingAssayTon = 0;
  let totalNi = 0, niCount = 0;
  let totalNiOre = 0, niCountOre = 0;
  let saprolitTon = 0, limonitTon = 0, lgTon = 0;
  const matGroupNiSum = {}, matGroupNiCount = {}, matGroupBlok = {};
  const dateTonaseMap = {}, dateNiMap = {};
  const pitSmMap = {};

  sourceData.forEach(row => {
    const cleanRow = {};
    Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);

    const tonase = cleanNumber(cleanRow['tonase']);
    let ni = cleanPercentValue(cleanRow['ni %'] || cleanRow['ni']);
    if (ni > 50) ni = ni / 100;

    const blok = (cleanRow['blok'] || cleanRow['id blok'] || cleanRow['idblok'] || cleanRow['id_blok'] || '').trim();
    const tanggal = cleanRow['tanggal'] ? cleanRow['tanggal'].trim() : (cleanRow['date'] ? cleanRow['date'].trim() : '');
    const tipeOreRowKpi = cleanRow['tipe_ore'] || cleanRow['tipe ore'] || '';
    const smRowKpi = cleanPercentValue(cleanRow['sm %'] || cleanRow['sm']);
    const classifyKpi = classifyMaterial(ni, tipeOreRowKpi, smRowKpi);
    const mat = classifyKpi.classGrade.toLowerCase();

    if (tonase === 0) return;

    totalTonase += tonase;

    // Klasifikasi material untuk donut chart
    if (mat === 'waste') {
      wasteTonase += tonase;
    } else if (mat === 'n/a') {
      pendingAssayTon += tonase;
    } else if (mat === 'lg') {
      oreTonase += tonase;
      lgTon += tonase;
    } else {
      oreTonase += tonase;
      if (classifyKpi.tipeOreFinal === 'Sapro') saprolitTon += tonase;
      else if (classifyKpi.tipeOreFinal === 'Limo') limonitTon += tonase;
    }

    // Ni% untuk grade chart
    if (ni > 0) {
      totalNi += ni;
      niCount++;
      if (mat !== 'waste') {
        totalNiOre += ni;
        niCountOre++;
      }
      if (!matGroupNiSum[classifyKpi.classGrade]) {
        matGroupNiSum[classifyKpi.classGrade] = 0;
        matGroupNiCount[classifyKpi.classGrade] = 0;
      }
      matGroupNiSum[classifyKpi.classGrade] += ni;
      matGroupNiCount[classifyKpi.classGrade]++;
    }

    if (blok) {
      matGroupBlok[classifyKpi.classGrade] = (matGroupBlok[classifyKpi.classGrade] || 0) + tonase;
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

    const mgo = cleanPercentValue(cleanRow['mgo %'] || cleanRow['mgo']);
    const sio2 = cleanPercentValue(cleanRow['sio2 %'] || cleanRow['sio2']);
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

  // Update DOM
  document.getElementById('kpi-total-tonase').innerHTML = `${totalTonase.toLocaleString()} <span class="text-xs font-semibold text-slate-400 ml-1.5" data-i18n="unit_ton">${window.currentLang === 'en' ? 'Tons' : 'Ton'}</span>`;
  document.getElementById('kpi-ore-tonase').innerHTML = `${oreTonase.toLocaleString()} <span class="text-xs font-semibold text-slate-400 ml-1.5" data-i18n="unit_ton">${window.currentLang === 'en' ? 'Tons' : 'Ton'}</span>`;
  document.getElementById('kpi-rata-ni').innerText = avgNi.toFixed(2) + '%';
  document.getElementById('kpi-rata-ni-ore').innerText = avgNiOre.toFixed(2) + '%';
  document.getElementById('kpi-sr').innerText = sr;
  document.getElementById('kpi-waste').innerText = (window.currentLang === 'en' ? 'Total Waste: ' : 'Total Waste: ') + wasteTonase.toLocaleString() + (window.currentLang === 'en' ? ' Tons' : ' Ton');

  // Update charts
  if (materialChart) {
    materialChart.data.datasets[0].data = [saprolitTon, limonitTon, lgTon, wasteTonase, pendingAssayTon];
    materialChart.update();
    renderMaterialLegend([saprolitTon, limonitTon, lgTon, wasteTonase, pendingAssayTon]);
  }

  if (gradeChart) {
    const labels = Object.keys(matGroupNiSum);
    const avgNiValues = labels.map(l => (matGroupNiSum[l] / matGroupNiCount[l]).toFixed(2));
    const shipMin = (globalCOGConfig && globalCOGConfig.Target_Ship_Ni_Min) || 1.3;
    const shipMax = (globalCOGConfig && globalCOGConfig.Target_Ship_Ni_Max) || 1.6;
    const targetLineMin = labels.map(() => shipMin);
    const targetLineMax = labels.map(() => shipMax);
    gradeChart.data.datasets[1].label = (window.currentLang === 'en' ? 'Ship Target Min (' : 'Target Kapal Min (') + shipMin.toFixed(2) + '%)';
    gradeChart.data.datasets[2].label = (window.currentLang === 'en' ? 'Ship Target Max (' : 'Target Kapal Max (') + shipMax.toFixed(2) + '%)';
    const materialColorMap = {
      'saprolit': '#059669', 'sapr': '#059669',
      'limonit': '#0ea5e9', 'lim': '#0ea5e9',
      'low grade': '#f59e0b', 'lg': '#f59e0b',
      'waste': '#475569'
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
      document.getElementById('trend-peak-tonnage').innerText = maxT.toLocaleString() + (window.currentLang === 'en' ? ' Tons' : ' Ton');
    }
  }

  if (trendNiChart) {
    const sortedDates = Object.keys(dateNiMap).sort();
    const niValues = sortedDates.map(d => (dateNiMap[d].sum / dateNiMap[d].count).toFixed(2));
    const shipMinTrend = (globalCOGConfig && globalCOGConfig.Target_Ship_Ni_Min) || 1.3;
    const cutOffLine = sortedDates.map(() => shipMinTrend);
    trendNiChart.data.labels = sortedDates;
    trendNiChart.data.datasets[0].data = niValues;
    trendNiChart.data.datasets[1].data = cutOffLine;
    trendNiChart.data.datasets[1].label = (window.currentLang === 'en' ? 'Cut-off Minimum (' : 'Cut-off Minimum (') + shipMinTrend.toFixed(2) + '%)';
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

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

// ============================================================
// NAVIGATION / SWITCH TAB
// ============================================================

function switchTab(tabName) {
  if (window.innerWidth < 768) { closeMobileSidebar(); }
  currentActiveTab = tabName;
  const tabs = ['ringkasan', 'trend', 'tabel', 'rekonsiliasi', 'validasi', 'barging', 'issue', 'kpimember', 'chat', 'settings'];

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
    if (typeof renderReconciliation === 'function') renderReconciliation();
    if (typeof fetchBlockModelData === 'function') fetchBlockModelData();
    if (typeof fetchValidasiData === 'function') fetchValidasiData();
    if (typeof fetchRcaLogData === 'function') fetchRcaLogData();
    if (typeof fetchPitActualData === 'function') fetchPitActualData();
    if (typeof fetchBargeShipmentData === 'function') fetchBargeShipmentData();
  }

  if (tabName === 'trend') {
    if (typeof fetchBlockModelData === 'function') fetchBlockModelData();
  }

  if (tabName === 'validasi') {
    if (typeof fetchValidasiData === 'function') fetchValidasiData();
  }

  if (tabName === 'kpimember') {
    if (typeof fetchJsaLogData === 'function') fetchJsaLogData();
    if (typeof updateKpiButtonsVisibility === 'function') updateKpiButtonsVisibility();
  }

  if (tabName === 'chat') {
    if (typeof fetchChatData === 'function') {
      fetchChatData().then(() => {
        window.chatLastSeenRow = globalChatData.length ? Number(globalChatData[globalChatData.length - 1]._row || 0) : 0;
        if (typeof updateChatUnreadBadge === 'function') updateChatUnreadBadge();
      });
    }
    if (typeof scrollChatToBottom === 'function') scrollChatToBottom();
  }

  if (tabName === 'issue') {
    if (typeof fetchIssueData === 'function') fetchIssueData();
  }

  if (tabName === 'barging') {
    if (typeof fetchBargeShipmentData === 'function') fetchBargeShipmentData();
  }

  if (typeof updateTabTitles === 'function') updateTabTitles(tabName);
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('main-sidebar');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  if (sidebar) sidebar.classList.add('-translate-x-full');
  if (overlay) overlay.classList.add('hidden');
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

// ============================================================
// THEME
// ============================================================

function setTheme(theme) {
  const body = document.body;
  const darkCard = document.getElementById('theme-card-dark');
  const whiteCard = document.getElementById('theme-card-white');
  const checkDark = document.getElementById('check-dark');
  const checkWhite = document.getElementById('check-white');

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

  if (typeof renderMaterialLegend === 'function' && materialChart) {
    renderMaterialLegend(materialChart.data.datasets[0].data);
  }
}

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

function updateChartTheme(textColor) {
  const charts = [materialChart, gradeChart, trendTonaseChart, trendNiChart, smChart, rekonChart, blockModelChart, validasiChart, trendMonthlyChart];
  charts.forEach(c => {
    if (c) {
      if (c.options && c.options.plugins && c.options.plugins.legend && c.options.plugins.legend.labels) {
        c.options.plugins.legend.labels.color = textColor;
      }
      if (c.options && c.options.scales) {
        if (c.options.scales.x && c.options.scales.x.ticks) c.options.scales.x.ticks.color = textColor;
        if (c.options.scales.y && c.options.scales.y.ticks) c.options.scales.y.ticks.color = textColor;
      }
      c.update();
    }
  });
}

// ============================================================
// UPDATE TAB TITLES (i18n)
// ============================================================

function updateTabTitles(tabName) {
  const titleMap = {
    'ringkasan': window.currentLang === 'en' ? 'Daily Geologist Report' : 'Laporan Harian Geologist',
    'trend': window.currentLang === 'en' ? 'Visual & Trend Report' : 'Report Visual & Analisis Tren',
    'tabel': window.currentLang === 'en' ? 'Mining Digging Database Details' : 'Detail Database Digging Tambang',
    'rekonsiliasi': window.currentLang === 'en' ? 'Production & Reserve Reconciliation' : 'Rekonsiliasi Produksi & Cadangan',
    'validasi': window.currentLang === 'en' ? 'Test Pit Assay Validation' : 'Validasi Assay Test Pit',
    'barging': window.currentLang === 'en' ? 'Barge Loading & Shipment' : 'Pemuatan Tongkang & Shipment',
    'issue': window.currentLang === 'en' ? 'Issue & Action Plan Management' : 'Manajemen Issue & Action Plan',
    'kpimember': window.currentLang === 'en' ? 'Geology Team Member KPI & Performance' : 'Kinerja & KPI Member Tim Geologi',
    'chat': window.currentLang === 'en' ? 'Team Chat' : 'Chat Tim',
    'settings': window.currentLang === 'en' ? 'Dashboard Settings & Preferences' : 'Pengaturan Dashboard & Preferences'
  };
  const subtitleMap = {
    'ringkasan': window.currentLang === 'en' ? "Today's mining production & grade performance summary" : 'Ringkasan performa produksi & kadar tambang hari ini',
    'trend': window.currentLang === 'en' ? 'Historical Tonnage & Mineral Grade Fluctuation Charts' : 'Grafik Historis Fluktuasi Tonase & Kadar Mineral',
    'tabel': window.currentLang === 'en' ? 'Full detail of daily production & assay data, per row' : 'Rincian lengkap data produksi & assay harian per baris',
    'rekonsiliasi': window.currentLang === 'en' ? 'Match production tonnage, shipment destinations, and geological model reserve estimates' : 'Sinkron data produksi, tujuan kapal, dan estimasi model geologi',
    'validasi': window.currentLang === 'en' ? 'Assay results per depth (1-5m) for each test pit' : 'Hasil assay per kedalaman (1-5m) tiap titik test pit',
    'barging': window.currentLang === 'en' ? 'Barge loading progress per shipment, from Dome to vessel' : 'Progress pemuatan tongkang per shipment, dari Dome sampai kapal',
    'issue': window.currentLang === 'en' ? 'Field Evaluation & Corrective Actions' : 'Evaluasi Lapangan & Tindakan Perbaikan',
    'kpimember': window.currentLang === 'en' ? 'Field Geologist Performance Monitoring' : 'Monitoring Kinerja Geologist Lapangan',
    'chat': window.currentLang === 'en' ? 'Internal Team Communication -- Synced to Google Sheets' : 'Komunikasi Internal Tim -- Tersinkron ke Google Sheets',
    'settings': window.currentLang === 'en' ? 'Appearance & Data Connection Settings' : 'Pengaturan Tampilan & Koneksi Data'
  };

  const titleEl = document.getElementById('page-title');
  const subtitleEl = document.getElementById('page-subtitle');
  if (titleEl) titleEl.innerText = titleMap[tabName] || 'Mine Geologist';
  if (subtitleEl) subtitleEl.innerText = subtitleMap[tabName] || '';
}

// ============================================================
// CHART INITIALIZATION
// ============================================================

function initCharts() {
  // Material Chart (Doughnut)
  const ctx1 = document.getElementById('materialChart');
  if (ctx1) {
    materialChart = new Chart(ctx1.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Saprolit', 'Limonit', 'Low Grade', 'Waste', 'Pending Assay'],
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: ['#059669', '#0ea5e9', '#f59e0b', '#475569', '#a855f7'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '68%'
      }
    });
    if (typeof renderMaterialLegend === 'function') renderMaterialLegend([0, 0, 0, 0, 0]);
  }

  // Grade Chart
  const ctx2 = document.getElementById('gradeChart');
  if (ctx2) {
    gradeChart = new Chart(ctx2.getContext('2d'), {
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
          y: { min: 0, max: 2.0, grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', stepSize: 0.2, font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
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
  }

  // Trend Tonase Chart
  const elTrendTonase = document.getElementById('trendTonaseChart');
  if (elTrendTonase) {
    trendTonaseChart = new Chart(elTrendTonase.getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: window.currentLang === 'en' ? 'Total Tonnage (Tons)' : 'Total Tonase (Ton)', data: [], borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.14)', fill: true, tension: 0.35, pointRadius: 3.5, pointHoverRadius: 7, pointBackgroundColor: '#3b82f6', pointBorderColor: '#ffffff', pointBorderWidth: 1.5 }] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }, x: { grid: { color: 'rgba(150, 150, 150, 0.04)' }, ticks: { color: '#94a3b8', font: { size: 10 } } } }, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } } }
    });
  }

  // Trend Ni Chart
  const elTrendNi = document.getElementById('trendNiChart');
  if (elTrendNi) {
    trendNiChart = new Chart(elTrendNi.getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Rata-rata Ni %', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)', fill: true, tension: 0.35, pointRadius: 3.5, pointHoverRadius: 7, pointBackgroundColor: '#10b981', pointBorderColor: '#ffffff', pointBorderWidth: 1.5 }, { label: 'Cut-off Minimum (1.30%)', data: [], borderColor: '#f59e0b', borderWidth: 2, borderDash: [4, 4], pointRadius: 0, fill: false }] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { min: 0.5, max: 2.5, grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }, x: { grid: { color: 'rgba(150, 150, 150, 0.04)' }, ticks: { color: '#94a3b8', font: { size: 10 } } } }, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } } }
    });
  }

  // Monthly Trend Chart
  const elTrendMonthly = document.getElementById('trendMonthlyChart');
  if (elTrendMonthly) {
    trendMonthlyChart = new Chart(elTrendMonthly.getContext('2d'), {
      data: { labels: [], datasets: [{ type: 'bar', label: window.currentLang === 'en' ? 'Tonnage (Tons)' : 'Tonase (Ton)', data: [], backgroundColor: 'rgba(6, 182, 212, 0.55)', borderRadius: 6, borderSkipped: false, yAxisID: 'y' }, { type: 'line', label: 'Rata-rata Ni %', data: [], borderColor: '#10b981', backgroundColor: '#10b981', tension: 0.35, pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: '#10b981', pointBorderColor: '#ffffff', pointBorderWidth: 1.5, yAxisID: 'y1' }] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { position: 'left', grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } }, title: { display: true, text: window.currentLang === 'en' ? 'Tons' : 'Ton', color: '#64748b', font: { size: 10 } } }, y1: { position: 'right', min: 0.5, max: 2.5, grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } }, title: { display: true, text: 'Ni %', color: '#64748b', font: { size: 10 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } } }, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } } }
    });
  }

  // SM Chart
  const elSm = document.getElementById('smChart');
  if (elSm) {
    smChart = new Chart(elSm.getContext('2d'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Rata-rata SM (SiO2/MgO)', data: [], backgroundColor: '#f59e0b', borderRadius: 8, borderSkipped: false, barPercentage: 0.55 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } } }, plugins: { legend: { display: false } } }
    });
  }

  // Reconciliation Chart
  const elRekon = document.getElementById('rekonChart');
  if (elRekon) {
    rekonChart = new Chart(elRekon.getContext('2d'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'EFO', data: [], backgroundColor: '#3b82f6', borderRadius: 4, stack: 'a' }, { label: 'ETO', data: [], backgroundColor: '#10b981', borderRadius: 4, stack: 'a' }, { label: 'Direct', data: [], backgroundColor: '#f59e0b', borderRadius: 4, stack: 'a' }, { label: 'Disposal', data: [], backgroundColor: '#64748b', borderRadius: 4, stack: 'a' }, { label: 'Belum Dikirim', data: [], backgroundColor: '#ef4444', borderRadius: 4, stack: 'a' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { stacked: true, grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }, x: { stacked: true, grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } } }, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } } } }
    });
  }

  // Validation Chart
  const ctxValidasi = document.getElementById('validasiChart');
  if (ctxValidasi) {
    validasiChart = new Chart(ctxValidasi.getContext('2d'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Ni % rata-rata', data: [], backgroundColor: '#10b981', borderRadius: 6, barPercentage: 0.55, maxBarThickness: 64 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } } }, plugins: { legend: { display: false } } }
    });
  }

  // Block Model Chart
  const elBlockModel = document.getElementById('blockModelChart');
  if (elBlockModel) {
    blockModelChart = new Chart(elBlockModel.getContext('2d'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Estimasi (Ton)', data: [], backgroundColor: '#3b82f6', borderRadius: 4 }, { label: 'GC (Ton)', data: [], backgroundColor: '#a855f7', borderRadius: 4 }, { label: 'Realisasi (Ton)', data: [], backgroundColor: [], borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(150, 150, 150, 0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } } }, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } } } }
    });
  }
}

// ============================================================
// RENDER MATERIAL LEGEND
// ============================================================

function renderMaterialLegend(values) {
  const el = document.getElementById('material-chart-legend');
  if (!el) return;
  const labels = ['Saprolit', 'Limonit', 'Low Grade', 'Waste', 'Pending Assay'];
  const colors = ['#059669', '#0ea5e9', '#f59e0b', '#475569', '#a855f7'];
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

// ============================================================
// STALE DATA BANNER
// ============================================================

function updateStaleDataBanner_() {
  let banner = document.getElementById('stale-data-banner');
  if (staleDataSources.size === 0) {
    if (banner) {
      banner.classList.remove('stale-toast-show');
      banner.classList.add('stale-toast-hide');
      setTimeout(() => { const b = document.getElementById('stale-data-banner'); if (b) b.remove(); }, 350);
    }
    return;
  }
  const listText = Array.from(staleDataSources).join(', ');
  const message = window.currentLang === 'en'
    ? `Some data failed to refresh (${listText}) -- numbers shown for these may be outdated.`
    : `Sebagian data gagal dimuat ulang (${listText}) -- angka yang ditampilkan untuk bagian ini mungkin sudah usang.`;
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'stale-data-banner';
    banner.className = 'fixed z-[96] bg-amber-600/95 backdrop-blur-sm text-white text-[11px] font-semibold py-2 px-3 shadow-2xl rounded-xl max-w-[260px] stale-toast-anchor';
    if (!document.getElementById('stale-toast-style')) {
      const style = document.createElement('style');
      style.id = 'stale-toast-style';
      style.textContent = `
        .stale-toast-anchor { left: 76px; bottom: 76px; transform: translateX(-24px); opacity: 0; transition: transform 0.3s ease, opacity 0.3s ease; }
        .stale-toast-anchor.stale-toast-show { transform: translateX(0); opacity: 1; }
        .stale-toast-anchor.stale-toast-hide { transform: translateX(-24px); opacity: 0; }
      `;
      document.head.appendChild(style);
    }
    document.body.appendChild(banner);
    void banner.offsetWidth;
  }
  banner.classList.remove('stale-toast-hide');
  banner.classList.add('stale-toast-show');
  banner.innerHTML = `<div class="flex items-start gap-1.5"><i data-lucide="triangle-alert" class="w-3.5 h-3.5 shrink-0 mt-0.5"></i><span>${message}</span></div>`;
  if (window.lucide) lucide.createIcons();
}

function markDataFresh_(sourceName) {
  staleDataSources.delete(sourceName);
  updateStaleDataBanner_();
}

function markDataStale_(sourceName) {
  staleDataSources.add(sourceName);
  updateStaleDataBanner_();
}

// ============================================================
// FETCH PRODUCTION DATA
// ============================================================

let produksiFetchRequestSeq = 0;

function fetchDataFromGoogleSheets(isManual = false) {
  const requestSeq = ++produksiFetchRequestSeq;
  try {
    fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL + '?sheet=produksi&t=' + new Date().getTime())
      .then(response => response.json())
      .then(result => {
        if (requestSeq !== produksiFetchRequestSeq) return;
        if (result.status !== 'success') throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to load production data.' : 'Gagal memuat data produksi'));
        applyFetchedProductionData(result.data || []);
        markDataFresh_('Produksi');
      })
      .catch(err => {
        if (requestSeq !== produksiFetchRequestSeq) return;
        console.error('Gagal memuat data produksi:', err);
        markDataStale_('Produksi');
        const isTimeout = err.name === 'AbortError';
        showError(isTimeout ? (window.currentLang === 'en' ? 'Server Not Responding (Timeout)' : 'Server Tidak Merespons (Timeout)') : (window.currentLang === 'en' ? 'Failed to load data. Please check your connection.' : 'Gagal memuat data. Silakan cek koneksi Anda.'));
      });
  } catch (err) {
    if (requestSeq !== produksiFetchRequestSeq) return;
    console.error('Gagal memuat data produksi:', err);
    markDataStale_('Produksi');
  }
}

function applyFetchedProductionData(dataArray) {
  if (!dataArray || dataArray.length === 0) {
    showError("Data Kosong!");
    return;
  }

  // Update local state
  globalRawData = dataArray;
  rawToCleanRow = new WeakMap();

  globalRawData.forEach(row => {
    const c = {};
    Object.keys(row).forEach(k => c[k.trim().toLowerCase()] = row[k]);
    rawToCleanRow.set(row, c);
  });

  globalRawData = sortDiggingCompleteFirst(globalRawData);

  // 🔥 FIX BLOCKER #1: Sinkronkan window dengan state lokal
  syncGlobalStateToWindow();

  if (typeof populatePitDropdown === 'function') populatePitDropdown(globalRawData);
  if (typeof applyGlobalFilter === 'function') applyGlobalFilter();

  // 🔥 FIX BLOCKER #2: Update dashboard dengan data terbaru
  if (typeof updateDashboard === 'function') {
    updateDashboard(globalFilteredTableData || globalRawData);
  }

  if (currentActiveTab === 'rekonsiliasi' && typeof renderReconciliation === 'function') {
    renderReconciliation();
  }

  if (typeof updateBlockModelSummaryCard === 'function') updateBlockModelSummaryCard();

  const syncStatus = document.getElementById('sync-status');
  if (syncStatus) {
    syncStatus.innerHTML = '<span class="text-emerald-400 font-semibold">' +
      (window.currentLang === 'en' ? 'Online ● ' : 'Online ● ') +
      new Date().toLocaleTimeString() + '</span>';
  }
}

function sortDiggingCompleteFirst(data) {
  if (!Array.isArray(data)) return data || [];
  return data
    .map((row, index) => ({ row, index, clean: rawToCleanRow.get(row) || {} }))
    .sort((a, b) => {
      const completeA = isDiggingRowComplete(a.clean) ? 1 : 0;
      const completeB = isDiggingRowComplete(b.clean) ? 1 : 0;
      if (completeA !== completeB) return completeB - completeA;
      return a.index - b.index;
    })
    .map(item => item.row);
}

function isDiggingRowComplete(cleanRow) {
  const requiredKeys = [
    'tanggal', 'shift', 'cuaca', 'pelapor', 'pit', 'blok', 'material',
    'id sampel', 'total sampel (karung)', 'tonase', 'ni %', 'fe %', 'co %',
    'mgo %', 'sio2 %', 'sm %', 'tujuan'
  ];
  const requiredOk = requiredKeys.every(key => {
    const value = cleanRow[key];
    return value !== null && value !== undefined && String(value).trim() !== '';
  });
  const tipeOreResolved = cleanRow['tipe_ore'] !== undefined ? cleanRow['tipe_ore'] : cleanRow['tipe ore'];
  const tipeOreOk = tipeOreResolved !== null && tipeOreResolved !== undefined && String(tipeOreResolved).trim() !== '';
  return requiredOk && tipeOreOk;
}

function showError(msg) {
  const syncStatus = document.getElementById('sync-status');
  if (syncStatus) syncStatus.innerHTML = '<span class="text-red-400 font-bold">' + msg + '</span>';
}

// ============================================================
// MANUAL REFRESH
// ============================================================

function manualRefreshData() {
  const icon = document.getElementById('refresh-icon');
  if (icon) {
    icon.classList.add('animate-spin');
    setTimeout(() => icon.classList.remove('animate-spin'), 800);
  }
  fetchDataFromGoogleSheets(true);
  if (typeof loadMembersFromSheet === 'function') loadMembersFromSheet();
  if (typeof fetchIssueData === 'function') fetchIssueData();
  if (typeof fetchValidasiData === 'function') fetchValidasiData();
  if (typeof fetchBlockModelData === 'function') fetchBlockModelData();
  if (typeof fetchCOGConfig === 'function') fetchCOGConfig();
  if (currentActiveTab === 'barging' && typeof fetchBargeShipmentData === 'function') fetchBargeShipmentData();
}

// ============================================================
// PRINT VIEW
// ============================================================

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

// ============================================================
// SIDEBAR AVATAR FALLBACK
// ============================================================

function handleSidebarAvatarError(imgEl) {
  const stage = imgEl.dataset.fallbackStage || '0';
  if (stage === '0') {
    imgEl.dataset.fallbackStage = '1';
    imgEl.src = 'assets/avatar-yaya.png';
  } else if (stage === '1') {
    imgEl.dataset.fallbackStage = '2';
    imgEl.src = 'https://ui-avatars.com/api/?name=Yaya&background=2563eb&color=fff';
  }
}

// ============================================================
// PWA UPDATE TOAST
// ============================================================

function showPwaUpdateToast() {
  const toast = document.getElementById('pwa-update-toast');
  if (toast) { toast.classList.remove('hidden'); if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons(); }
}

function dismissPwaUpdateToast() {
  const toast = document.getElementById('pwa-update-toast');
  if (toast) toast.classList.add('hidden');
}

function applyPwaUpdate() {
  if (window.pwaWaitingWorker) window.pwaWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
  dismissPwaUpdateToast();
}

function initPwaUpdateWatcher() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then(function(registration) {
    registration.addEventListener('updatefound', function() {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', function() {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          window.pwaWaitingWorker = newWorker;
          showPwaUpdateToast();
        }
      });
    });
    if (registration.waiting && navigator.serviceWorker.controller) {
      window.pwaWaitingWorker = registration.waiting;
      showPwaUpdateToast();
    }
    setInterval(function(){ registration.update().catch(function(){}); }, 60000);
  }).catch(function(err) { console.warn('SW registration gagal:', err); });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

// ============================================================
// DOMContentLoaded -- ENTRY POINT
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  // 1. Set language default
  setLanguage('id');

  // 2. Init sidebar collapse state
  initSidebarCollapseState();

  // 3. Init charts
  initCharts();
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

  // 4. Load data (staggered to avoid queue pile-up)
  if (typeof fetchDataFromGoogleSheets === 'function') fetchDataFromGoogleSheets();
  setTimeout(() => { if (typeof fetchCOGConfig === 'function') fetchCOGConfig(); }, 0);
  setTimeout(() => { if (typeof loadMembersFromSheet === 'function') loadMembersFromSheet(); }, 0);
  setTimeout(() => { if (typeof fetchIssueData === 'function') fetchIssueData(); }, 250);
  setTimeout(() => { if (typeof fetchBlockModelData === 'function') fetchBlockModelData(); }, 500);

  // 5. Load Regional & Time settings
  if (typeof loadRegionalTimeSettings === 'function') loadRegionalTimeSettings();

  // 6. Refresh security sessions
  if (typeof refreshSecuritySession === 'function') refreshSecuritySession();
  if (typeof renderMemberSessionAvatar === 'function') renderMemberSessionAvatar();
  if (typeof refreshMemberSecuritySession === 'function') refreshMemberSecuritySession();
  if (typeof loadActiveMemberSessions === 'function') loadActiveMemberSessions();

  // 7. Display version
  const appVersionLabelEl = document.getElementById('app-version-label');
  if (appVersionLabelEl) appVersionLabelEl.innerText = window.APP_VERSION;

  // 8. Set up periodic polling
  setInterval(() => { if (typeof fetchDataFromGoogleSheets === 'function') fetchDataFromGoogleSheets(); }, 60000);
  setInterval(() => { if (typeof refreshMemberSecuritySession === 'function') refreshMemberSecuritySession(); }, window.MEMBER_SESSION_CHECK_INTERVAL_MS);
  setInterval(() => { if (typeof loadActiveMemberSessions === 'function') loadActiveMemberSessions(); }, window.MEMBER_SESSION_CHECK_INTERVAL_MS);
  setInterval(() => { rotateActiveSecurityTokens(); }, 60000);
  setInterval(() => {
    if (currentActiveTab === 'chat' && !document.hidden) { if (typeof fetchChatData === 'function') fetchChatData(); }
  }, window.CHAT_POLL_INTERVAL);

  // 9. Init developer panels
  try {
    if (typeof initResetProjectControls === 'function') initResetProjectControls();
    if (typeof initCompactBlankRowsControls === 'function') initCompactBlankRowsControls();
    // [RESTORED dari baseline -- BARU (27 Agu): pindahkan panel developer-only dari posisi
    // inline-nya di halaman ke dalam 2 modal Developer Console (Sistem vs Technical), supaya
    // tidak lagi tampil menempel di tab Settings/Member. updateDeveloperAccessUI() tetap 1
    // fungsi yang sama, toggle SEMUA panel berdasarkan ID tanpa peduli mount ke modal yang mana.
    const mountSistem = document.getElementById('developer-console-panels');
    ['dev-cleanup-panel', 'dev-compact-panel', 'panel-reset-project', 'panel-reset-member-pin'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el && mountSistem) mountSistem.appendChild(el);
    });
    const mountTechnical = document.getElementById('developer-console-technical-panels');
    ['panel-guide-rekonsiliasi', 'panel-parameter-global', 'panel-kpi-event-approval', 'panel-formula-kpi', 'panel-backfill-user-id'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el && mountTechnical) mountTechnical.appendChild(el);
    });
    if (typeof updateDeveloperAccessUI === 'function') updateDeveloperAccessUI();
  } catch(e) { console.warn('Developer controls init skipped:', e); }

  // 10. Init PWA update watcher
  try {
    initPwaUpdateWatcher();
  } catch(e) { console.warn('PWA update watcher skipped:', e); }

  // 11. Update developer UI
  updateDeveloperAccessUI();

  // 12. Extra: repopulate reporter dropdown
  if (typeof populateReporterDropdown === 'function') populateReporterDropdown();

  // 13. Keyboard shortcut blocker
  document.addEventListener('keydown', function(e) {
    const key = e.key ? e.key.toUpperCase() : '';
    if (key === 'F12') { e.preventDefault(); return false; }
    if (e.ctrlKey && key === 'U') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) { e.preventDefault(); return false; }
  });

  // 14. Wheel scroll horizontal for overflow tables
  document.addEventListener('wheel', function(e) {
    const container = e.target.closest('.overflow-x-auto');
    if (!container) return;
    const hasHorizontalOverflow = container.scrollWidth > container.clientWidth;
    const hasVerticalOverflow = container.scrollHeight > container.clientHeight;
    if (hasHorizontalOverflow && !hasVerticalOverflow && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      container.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  console.log('Mine Geologist Dashboard v' + window.APP_VERSION + ' loaded successfully.');
});

// ============================================================
// EXPOSE FUNCTIONS KE GLOBAL WINDOW
// ============================================================

window.switchTab = switchTab;
window.setTheme = setTheme;
window.toggleHeaderTheme = toggleHeaderTheme;
window.updateTabTitles = updateTabTitles;
window.manualRefreshData = manualRefreshData;
window.printCurrentView = printCurrentView;
window.handleSidebarAvatarError = handleSidebarAvatarError;
window.fetchDataFromGoogleSheets = fetchDataFromGoogleSheets;
window.applyFetchedProductionData = applyFetchedProductionData;
window.markDataFresh_ = markDataFresh_;
window.markDataStale_ = markDataStale_;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
window.renderMaterialLegend = renderMaterialLegend;
window.initPwaUpdateWatcher = initPwaUpdateWatcher;
window.showPwaUpdateToast = showPwaUpdateToast;
window.dismissPwaUpdateToast = dismissPwaUpdateToast;
window.applyPwaUpdate = applyPwaUpdate;
window.updateDashboard = updateDashboard;
window.syncGlobalStateToWindow = syncGlobalStateToWindow;

// Ekspos semua state penting ke window (dilakukan juga di syncGlobalStateToWindow)
window.globalRawData = globalRawData;
window.rawToCleanRow = rawToCleanRow;
window.globalFilteredTableData = globalFilteredTableData;
window.globalMemberData = globalMemberData;
window.globalJsaLogData = globalJsaLogData;
window.globalBargeShipmentData = globalBargeShipmentData;
window.globalBargeLoadingLogData = globalBargeLoadingLogData;
window.globalBargeShiftReportData = globalBargeShiftReportData;
window.globalBargeSublotData = globalBargeSublotData;
window.globalRcaLogData = globalRcaLogData;
window.globalPitActualData = globalPitActualData;
window.globalBlockModelData = globalBlockModelData;
window.globalChatData = globalChatData;
window.globalIssueRawData = globalIssueRawData;
window.globalValidasiData = globalValidasiData;
window.globalValidasiConfig = globalValidasiConfig;
window.globalCOGConfig = globalCOGConfig;
window.cogConfigUsingFallback = cogConfigUsingFallback;
window.currentActiveTab = currentActiveTab;
window.currentTrendView = currentTrendView;
window.currentRekonView = currentRekonView;
window.currentOpenDiggingRow = currentOpenDiggingRow;
window.currentOpenBargeShipment = currentOpenBargeShipment;
window.domePickerListCache = domePickerListCache;
window.reconciliationBreakdownData = reconciliationBreakdownData;
window.chatLastSeenRow = window.chatLastSeenRow;
window.ewsAlertNotified = ewsAlertNotified;
window.staleDataSources = staleDataSources;

// ======= RESTORASI DARI BASELINE (fungsi hilang di MG1) =======

// [RESTORED from baseline/core.js] deleteAllChatMessages
async function deleteAllChatMessages() {
  if (!(await showConfirmModal(currentLang === 'en' ? 'Delete All Chat Messages' : 'Hapus Semua Pesan Chat', currentLang === 'en' ? 'Delete ALL Chat messages?' : 'Hapus SEMUA pesan Chat?'))) return;
  try { await postDeveloperAdmin('developerDeleteAllChat',{}); await fetchChatData(); }
  catch(e){ showNoticeModal(currentLang==='en'?'Cleanup Failed':'Cleanup Gagal',e.message); }
}

// [RESTORED from baseline/core.js] deleteChatMessage
async function deleteChatMessage(rowNumber) {
  if (!(await showConfirmModal(currentLang === 'en' ? 'Delete Chat Message' : 'Hapus Pesan Chat', currentLang === 'en' ? 'Delete this chat message?' : 'Hapus pesan Chat ini?'))) return;
  try { await postDeveloperAdmin('developerDeleteChat',{row_number:String(rowNumber)}); await fetchChatData(); }
  catch(e){ showNoticeModal(currentLang==='en'?'Delete Failed':'Hapus Gagal',e.message); }
}

// [RESTORED from baseline/core.js] fetchChatData
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
  window.globalChatData = globalChatData; // [FIX] sinkronisasi window.X manual, sama pola dgn fetchIssueData/loadMembersFromSheet
  renderChatMessages();
  updateChatUnreadBadge();

  if (hadNewMessages && wasAtBottom) {
  scrollChatToBottom();
  }
 } catch (err) {
  console.error('Gagal memuat chat:', err);
 }
 }

// [RESTORED from baseline/core.js] isChatScrolledToBottom
 function isChatScrolledToBottom() {
 const area = document.getElementById('chat-messages-area');
 if (!area) return true;
 return area.scrollHeight - area.scrollTop - area.clientHeight < 60;
 }

// [RESTORED from baseline/core.js] onChatSenderChange
 function onChatSenderChange() {
 syncChatSenderToLoggedInUser();
 renderChatMessages();
 }

// [RESTORED from baseline/core.js] submitChatMessage
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
