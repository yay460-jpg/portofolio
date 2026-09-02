// ============================================================
// RECONCILIATION.JS -- Block Model, Rekonsiliasi, F1-F4, RCA, Pit Actual, COGConfig
// (Bagian terakhir dari produksi.js yang dipecah)
// ============================================================

// ============================================================
// GLOBAL VARIABLES
// ============================================================

if (typeof window.globalBlockModelData === 'undefined') window.globalBlockModelData = [];
if (typeof window.globalPitActualData === 'undefined') window.globalPitActualData = [];
if (typeof window.globalRcaLogData === 'undefined') window.globalRcaLogData = [];
if (typeof window.globalCOGConfig === 'undefined') window.globalCOGConfig = null;
if (typeof window.reconciliationBreakdownData === 'undefined') window.reconciliationBreakdownData = [];
if (typeof window.ewsAlertNotified === 'undefined') window.ewsAlertNotified = false;
if (typeof window.ewsAudioCtx === 'undefined') window.ewsAudioCtx = null;
if (typeof window.cogConfigFetchRequestSeq === 'undefined') window.cogConfigFetchRequestSeq = 0;
if (typeof window.rcaExportRequestId === 'undefined') window.rcaExportRequestId = 0;
if (typeof window.rcaExportLoading === 'undefined') window.rcaExportLoading = false;

// ============================================================
// BLOCK MODEL -- FETCH & RENDER
// ============================================================

async function fetchBlockModelData() {
  try {
    const response = await fetchWithTimeout(
      window.GOOGLE_SCRIPT_READ_URL + '?sheet=blockmodel&t=' + new Date().getTime()
    );
    const result = await response.json();

    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to load Block Model data.' : 'Gagal memuat data Block Model'));
    }

    window.globalBlockModelData = result.data || [];
    if (typeof markDataFresh_ === 'function') markDataFresh_('Block Model');
    renderBlockModelChart();
    renderBlockModelTable();
    updateBlockModelSummaryCard();
    computeReconciliationMatrix();
  } catch (err) {
    console.error('Gagal memuat data Block Model:', err);
    if (typeof markDataStale_ === 'function') markDataStale_('Block Model');
    const isTimeout = err.name === 'AbortError';
    const tbody = document.getElementById('rekon-blockmodel-body');
    if (tbody) {
      const msg = isTimeout ?
        (window.currentLang === 'en' ? 'Server did not respond within 20s (timeout).' : 'Server tidak merespons dalam 20 detik (timeout).') :
        (window.currentLang === 'en' ? 'Failed to load Block Model data from Google Sheets.' : 'Gagal memuat data Block Model dari Google Sheets.');
      tbody.innerHTML = '<tr><td colspan="9" class="text-center p-6 text-rose-400 text-xs space-y-2 font-medium">' +
        '<p>' + msg + '</p>' +
        '<button onclick="fetchBlockModelData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all">' +
        (window.currentLang === 'en' ? 'Retry' : 'Coba Lagi (Retry)') +
        '</button></td></tr>';
    }
  }
}

function computeGcTonaseByBlok() {
  const acc = {};
  (window.globalRawData || []).forEach(function(row) {
    const c = window.rawToCleanRow ? window.rawToCleanRow.get(row) || {} : {};
    const blok = (c['blok'] || c['id blok'] || c['idblok'] || c['id_blok'] || '').toString().trim().toUpperCase();
    const pit = (c['pit'] || '').toString().trim().toUpperCase();
    if (!blok) return;
    const key = blok + '|' + pit;
    const tonase = cleanNumber(c['tonase']);
    if (tonase <= 0) return;
    acc[key] = (acc[key] || 0) + tonase;
  });
  return acc;
}

function renderBlockModelTable() {
  const tbody = document.getElementById('rekon-blockmodel-body');
  const countEl = document.getElementById('rekon-blockmodel-badge');
  if (!tbody) return;

  if (!window.globalBlockModelData || window.globalBlockModelData.length === 0) {
    const emptyMsg = window.currentLang === 'en' ? 'No Block Model data yet.' : 'Belum ada data Block Model.';
    tbody.innerHTML = '<tr><td colspan="9" class="text-center p-6 text-slate-500 text-xs font-medium">' + emptyMsg + '</td></tr>';
    if (countEl) countEl.classList.add('hidden');
    return;
  }

  if (countEl) {
    countEl.innerText = window.globalBlockModelData.length;
    countEl.classList.remove('hidden');
  }

  const realisasiKimiaByBlok = computeRealisasiKimiaByBlok();

  // Legenda toleransi
  const legendEl = document.getElementById('blockmodel-toleransi-legend');
  if (legendEl) {
    const tolCfgLegend = window.globalCOGConfig || {};
    const warnPctLegend = typeof tolCfgLegend.Toleransi_Warning_Pct === 'number' ? tolCfgLegend.Toleransi_Warning_Pct : 5;
    const ootPctLegend = typeof tolCfgLegend.Toleransi_OutOfTol_Pct === 'number' ? tolCfgLegend.Toleransi_OutOfTol_Pct : 10;
    legendEl.innerHTML = (window.currentLang === 'en' ?
      'Tolerance legend: <span class="text-emerald-400 font-semibold">OK</span> &le; &plusmn;' + warnPctLegend + '% &middot; <span class="text-amber-400 font-semibold">WARNING</span> &plusmn;' + warnPctLegend + '%-' + ootPctLegend + '% &middot; <span class="text-rose-400 font-semibold">OUT OF TOL</span> &gt; &plusmn;' + ootPctLegend + '%' :
      'Legenda toleransi: <span class="text-emerald-400 font-semibold">OK</span> &le; &plusmn;' + warnPctLegend + '% &middot; <span class="text-amber-400 font-semibold">WARNING</span> &plusmn;' + warnPctLegend + '%-' + ootPctLegend + '% &middot; <span class="text-rose-400 font-semibold">OUT OF TOL</span> &gt; &plusmn;' + ootPctLegend + '%'
    );
  }

  tbody.innerHTML = window.globalBlockModelData.map(function(row, idx) {
    const idBlok = row['Id_blok'] || '-';
    const pit = row['Pit'] || '-';
    const estimasiNi = row['Estimasi_Ni %'];
    const estimasi = row['Estimasi_tonase'];
    const realisasi = row['Realisasi_Tonase'];
    const variasi = row['Variasi_%'];
    const arahRaw = (row['Arah'] || '').toString();
    const statusKpi = (row['Status_KPI'] || '').toString();
    const depletionVal_ = (row['Status_Depletion'] || '').toString().trim();
    const isBelumFinal = statusKpi.includes('Belum Final') || depletionVal_ !== 'Selesai';

    const estimasiFmt = (typeof estimasi === 'number') ? estimasi.toLocaleString('id-ID') : (estimasi || '-');
    const realisasiFmt = (typeof realisasi === 'number') ? realisasi.toLocaleString('id-ID') : (realisasi || '-');
    const variasiFmt = (typeof variasi === 'number') ? variasi.toFixed(2) + '%' : (variasi || '-');

    const variasiTon = (!isBelumFinal && typeof realisasi === 'number' && typeof estimasi === 'number') ? (realisasi - estimasi) : null;
    const variasiTonFmt = variasiTon === null ? '' : '<div class="text-[9.5px] font-normal text-slate-500 mt-0.5">' +
      (variasiTon < 0 ? '-' : '+') + Math.abs(variasiTon).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' Ton</div>';

    const realKimiaKey = idBlok.trim().toUpperCase() + '|' + pit.trim().toUpperCase();
    const realKimia = realisasiKimiaByBlok[realKimiaKey] || null;
    const niAktColorBM = realKimia && typeof realKimia.ni === 'number' ?
      getGradeTextClass(classifyMaterial(realKimia.ni, 'Auto', realKimia.sm).classGrade) :
      'text-title';
    const niCellHtml = formatEstAktCell(estimasiNi, realKimia ? realKimia.ni : null, niAktColorBM);
    const feCellHtml = formatEstAktCell(row['Estimasi_Fe %'], realKimia ? realKimia.fe : null);
    const smCellHtml = formatEstAktCell(row['Estimasi_SM %'], realKimia ? realKimia.sm : null);

    let variasiColorClass = 'text-slate-300';
    if (!isBelumFinal) {
      if (arahRaw.includes('Realisasi < Estimasi')) {
        variasiColorClass = 'text-amber-400 font-bold';
      } else if (arahRaw.includes('Realisasi > Estimasi')) {
        variasiColorClass = 'text-rose-400 font-bold';
      }
    }

    let toleransiBadge = '';
    let isOutOfTol = false;
    if (!isBelumFinal && typeof variasi === 'number') {
      const tolCfg = window.globalCOGConfig || {};
      const warnPct = typeof tolCfg.Toleransi_Warning_Pct === 'number' ? tolCfg.Toleransi_Warning_Pct : 5;
      const ootPct = typeof tolCfg.Toleransi_OutOfTol_Pct === 'number' ? tolCfg.Toleransi_OutOfTol_Pct : 10;
      const absVariasi = Math.abs(variasi);
      if (absVariasi > ootPct) {
        toleransiBadge = '<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">OUT OF TOL</span>';
        isOutOfTol = true;
      } else if (absVariasi > warnPct) {
        toleransiBadge = '<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">WARNING</span>';
      } else {
        toleransiBadge = '<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">OK</span>';
      }
    }

    let quickLinkRca = '';
    if (isOutOfTol && typeof canManageRca === 'function' && canManageRca()) {
      const blokEsc = idBlok.toString().replace(/'/g, "\\'");
      const pitEsc = pit.toString().replace(/'/g, "\\'");
      quickLinkRca = '<button onclick="event.stopPropagation(); openFormRcaPopup(\'' + blokEsc + '\', \'' + pitEsc + '\')" title="' +
        (window.currentLang === 'en' ? 'Quick RCA' : 'Catat RCA Cepat') +
        '" class="ml-1 inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 transition-all cursor-pointer align-middle"><i data-lucide="zap" class="w-2.5 h-2.5"></i></button>';
    }

    let statusBadge;
    if (isBelumFinal) {
      const label = window.currentLang === 'en' ? 'Awaiting Data' : 'Menunggu Data';
      statusBadge = '<span class="px-2 py-0.5 rounded-lg bg-slate-700/40 text-slate-400 border border-slate-600/40 font-semibold text-[11px]">' + label + '</span>';
    } else if (statusKpi.trim().toLowerCase() === 'aman') {
      const label = window.currentLang === 'en' ? 'Safe' : 'Aman';
      statusBadge = '<span class="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">' + label + '</span>';
    } else {
      const label = window.currentLang === 'en' ? 'Not Safe' : 'Tidak Aman';
      statusBadge = '<span class="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-[11px]">' + label + '</span>';
    }

    const rowClass = isBelumFinal ? 'opacity-50 cursor-pointer hover:bg-slate-800/30 transition-colors' : 'cursor-pointer hover:bg-slate-800/30 transition-colors';

    return '<tr class="' + rowClass + '" onclick="openBlockModelDetailModal(' + idx + ')">' +
      '<td class="p-2.5 font-semibold text-title">' + idBlok + '</td>' +
      '<td class="p-2.5 text-slate-300">' + pit + '</td>' +
      '<td class="p-2.5 text-center">' + niCellHtml + '</td>' +
      '<td class="p-2.5 text-center">' + feCellHtml + '</td>' +
      '<td class="p-2.5 text-center">' + smCellHtml + '</td>' +
      '<td class="p-2.5 text-right text-slate-300">' + estimasiFmt + '</td>' +
      '<td class="p-2.5 text-right text-slate-300">' + realisasiFmt + '</td>' +
      '<td class="p-2.5 text-right ' + variasiColorClass + '">' + variasiFmt + toleransiBadge + quickLinkRca + variasiTonFmt + '</td>' +
      '<td class="p-2.5 text-center">' + statusBadge + '</td>' +
    '</tr>';
  }).join('');

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function computeRealisasiKimiaByBlok() {
  const acc = {};
  (window.globalRawData || []).forEach(function(row) {
    const c = window.rawToCleanRow ? window.rawToCleanRow.get(row) || {} : {};
    const blok = (c['blok'] || c['id blok'] || c['idblok'] || c['id_blok'] || '').toString().trim().toUpperCase();
    const pit = (c['pit'] || '').toString().trim().toUpperCase();
    if (!blok) return;
    const key = blok + '|' + pit;
    const tonase = cleanNumber(c['tonase']);
    if (tonase <= 0) return;
    if (!acc[key]) acc[key] = {
      niSum: 0, niTon: 0, feSum: 0, feTon: 0, coSum: 0, coTon: 0,
      mgoSum: 0, mgoTon: 0, sio2Sum: 0, sio2Ton: 0
    };

    const rawNi = c['ni %'] !== undefined && c['ni %'] !== null && c['ni %'] !== '' ? c['ni %'] : c['ni'];
    if (rawNi !== undefined && rawNi !== null && rawNi !== '') {
      let ni = cleanPercentValue(rawNi);
      if (ni > 50) ni = ni / 100;
      acc[key].niSum += ni * tonase;
      acc[key].niTon += tonase;
    }
    const rawFe = c['fe %'] !== undefined && c['fe %'] !== null && c['fe %'] !== '' ? c['fe %'] : c['fe'];
    if (rawFe !== undefined && rawFe !== null && rawFe !== '') {
      const fe = cleanPercentValue(rawFe);
      acc[key].feSum += fe * tonase;
      acc[key].feTon += tonase;
    }
    const rawCo = c['co %'] !== undefined && c['co %'] !== null && c['co %'] !== '' ? c['co %'] : c['co'];
    if (rawCo !== undefined && rawCo !== null && rawCo !== '') {
      const co = cleanPercentValue(rawCo);
      acc[key].coSum += co * tonase;
      acc[key].coTon += tonase;
    }
    const rawMgo = c['mgo %'] !== undefined && c['mgo %'] !== null && c['mgo %'] !== '' ? c['mgo %'] : c['mgo'];
    if (rawMgo !== undefined && rawMgo !== null && rawMgo !== '') {
      const mgo = cleanPercentValue(rawMgo);
      acc[key].mgoSum += mgo * tonase;
      acc[key].mgoTon += tonase;
    }
    const rawSio2 = c['sio2 %'] !== undefined && c['sio2 %'] !== null && c['sio2 %'] !== '' ? c['sio2 %'] : c['sio2'];
    if (rawSio2 !== undefined && rawSio2 !== null && rawSio2 !== '') {
      const sio2 = cleanPercentValue(rawSio2);
      acc[key].sio2Sum += sio2 * tonase;
      acc[key].sio2Ton += tonase;
    }
  });

  const result = {};
  Object.keys(acc).forEach(function(key) {
    const a = acc[key];
    const mgoAvg = a.mgoTon > 0 ? a.mgoSum / a.mgoTon : null;
    const sio2Avg = a.sio2Ton > 0 ? a.sio2Sum / a.sio2Ton : null;
    result[key] = (a.niTon > 0 || a.feTon > 0 || a.coTon > 0 || a.mgoTon > 0 || a.sio2Ton > 0) ? {
      ni: a.niTon > 0 ? a.niSum / a.niTon : null,
      fe: a.feTon > 0 ? a.feSum / a.feTon : null,
      co: a.coTon > 0 ? a.coSum / a.coTon : null,
      mgo: mgoAvg,
      sio2: sio2Avg,
      sm: (mgoAvg && mgoAvg > 0 && sio2Avg !== null) ? (sio2Avg / mgoAvg) : null
    } : null;
  });
  return result;
}

function formatEstAktCell(estVal, aktVal, aktColorClass) {
  const estFmt = (typeof estVal === 'number') ? estVal.toFixed(2) : '-';
  const aktFmt = (typeof aktVal === 'number') ? aktVal.toFixed(2) : '-';
  if (estFmt === '-' && aktFmt === '-') return '<span class="text-slate-600">-</span>';
  const aktClass = aktColorClass || 'text-title';
  return '<span class="text-slate-400">' + estFmt + '</span> <span class="text-slate-600">-&gt;</span> <span class="' + aktClass + ' font-semibold">' + aktFmt + '</span>';
}

function renderBlockModelChart() {
  const countEl = document.getElementById('blockmodel-badge');
  if (typeof blockModelChart === 'undefined' || !blockModelChart) return;

  if (!window.globalBlockModelData || window.globalBlockModelData.length === 0) {
    blockModelChart.data.labels = [];
    blockModelChart.data.datasets[0].data = [];
    blockModelChart.data.datasets[1].data = [];
    blockModelChart.data.datasets[2].data = [];
    blockModelChart.data.datasets[2].backgroundColor = [];
    blockModelChart.update();
    if (countEl) countEl.classList.add('hidden');
    return;
  }

  if (countEl) {
    countEl.innerText = window.globalBlockModelData.length;
    countEl.classList.remove('hidden');
  }

  const arahLabel = function(arahRaw) {
    if (window.currentLang !== 'en') return arahRaw;
    if (arahRaw.includes('Realisasi < Estimasi')) return 'Actual < Estimate';
    if (arahRaw.includes('Realisasi > Estimasi')) return 'Actual > Estimate';
    if (arahRaw.includes('Sama Persis')) return 'Exact Match';
    return arahRaw;
  };

  const labels = [];
  const estimasiData = [];
  const gcData = [];
  const realisasiData = [];
  const realisasiColors = [];
  const meta = [];

  const gcTonaseByBlok = computeGcTonaseByBlok();

  window.globalBlockModelData.forEach(function(row) {
    const idBlok = row['Id_blok'] || '-';
    const pit = row['Pit'] || '-';
    const estimasi = row['Estimasi_tonase'];
    const realisasi = row['Realisasi_Tonase'];
    const variasi = row['Variasi_%'];
    const arah = arahLabel(row['Arah'] || '-');
    const statusKpi = (row['Status_KPI'] || '').toString();
    const depletionVal_ = (row['Status_Depletion'] || '').toString().trim();
    const isBelumFinal = statusKpi.includes('Belum Final') || depletionVal_ !== 'Selesai';

    labels.push([idBlok + ' ' + pit, isBelumFinal ? '-' : (typeof variasi === 'number' ? variasi.toFixed(2) + '%' : '-')]);
    estimasiData.push(typeof estimasi === 'number' ? estimasi : 0);
    const gcKey = idBlok.toString().trim().toUpperCase() + '|' + pit.toString().trim().toUpperCase();
    gcData.push(gcTonaseByBlok[gcKey] || 0);
    realisasiData.push(typeof realisasi === 'number' ? realisasi : 0);

    let barColor, statusLabel;
    if (isBelumFinal) {
      barColor = '#64748b';
      statusLabel = window.currentLang === 'en' ? 'Awaiting Data' : 'Menunggu Data';
    } else if (statusKpi.trim().toLowerCase() === 'aman') {
      barColor = '#10b981';
      statusLabel = window.currentLang === 'en' ? 'Safe' : 'Aman';
    } else {
      barColor = '#f43f5e';
      statusLabel = window.currentLang === 'en' ? 'Not Safe' : 'Tidak Aman';
    }
    realisasiColors.push(barColor);

    const variasiFmt = isBelumFinal ? '-' : ((typeof variasi === 'number') ? variasi.toFixed(2) + '%' : (variasi || '-'));
    meta.push({ variasiFmt: variasiFmt, arah: arah, statusLabel: statusLabel });
  });

  blockModelChart.data.labels = labels;
  blockModelChart.data.datasets[0].label = window.currentLang === 'en' ? 'Estimated (Ton)' : 'Estimasi (Ton)';
  blockModelChart.data.datasets[0].data = estimasiData;
  blockModelChart.data.datasets[1].label = 'GC (Ton)';
  blockModelChart.data.datasets[1].data = gcData;
  blockModelChart.data.datasets[2].label = window.currentLang === 'en' ? 'Actual (Ton)' : 'Realisasi (Ton)';
  blockModelChart.data.datasets[2].data = realisasiData;
  blockModelChart.data.datasets[2].backgroundColor = realisasiColors;

  blockModelChart.options.plugins.tooltip = {
    callbacks: {
      afterLabel: function(context) {
        if (context.datasetIndex !== 2) return '';
        const m = meta[context.dataIndex];
        const variasiLabel = window.currentLang === 'en' ? 'Variance' : 'Variasi';
        const statusLabelText = window.currentLang === 'en' ? 'Status' : 'Status';
        return variasiLabel + ': ' + m.variasiFmt + ' (' + m.arah + ')\n' + statusLabelText + ': ' + m.statusLabel;
      }
    }
  };

  blockModelChart.update();
}

function updateBlockModelSummaryCard() {
  const estEl = document.getElementById('summary-blockmodel-estimasi');
  const realEl = document.getElementById('summary-blockmodel-realisasi');
  const varEl = document.getElementById('summary-blockmodel-variance');
  const countEl = document.getElementById('summary-blockmodel-count');
  const estNiEl = document.getElementById('summary-blockmodel-estimasi-ni');
  const realNiEl = document.getElementById('summary-blockmodel-realisasi-ni');
  const varTonEl = document.getElementById('summary-blockmodel-variance-ton');
  if (!estEl || !realEl || !varEl) return;

  const finalRows = (window.globalBlockModelData || []).filter(function(row) {
    const statusKpi = (row['Status_KPI'] || '').toString();
    const depletionVal_ = (row['Status_Depletion'] || '').toString().trim();
    return !(statusKpi.includes('Belum Final') || depletionVal_ !== 'Selesai');
  });

  if (finalRows.length === 0) {
    estEl.innerText = '0 ' + (window.currentLang === 'en' ? 'Tons' : 'Ton');
    realEl.innerText = '0 ' + (window.currentLang === 'en' ? 'Tons' : 'Ton');
    varEl.innerText = '0%';
    if (estNiEl) estNiEl.innerText = '-';
    if (realNiEl) realNiEl.innerText = '-';
    if (countEl) countEl.innerText = window.currentLang === 'en' ? 'Overall Variance (no finalized blocks yet)' : 'Variance Keseluruhan (belum ada blok final)';
    if (varTonEl) { varTonEl.innerText = '-'; varTonEl.className = 'text-[10px] text-slate-500 font-medium mt-0.5'; }
    return;
  }

  const totalEstimasi = finalRows.reduce(function(s, r) {
    return s + (typeof r['Estimasi_tonase'] === 'number' ? r['Estimasi_tonase'] : 0);
  }, 0);
  const totalRealisasi = finalRows.reduce(function(s, r) {
    return s + (typeof r['Realisasi_Tonase'] === 'number' ? r['Realisasi_Tonase'] : 0);
  }, 0);
  const variancePct = totalEstimasi === 0 ? 0 : Math.abs(totalEstimasi - totalRealisasi) / totalEstimasi * 100;

  estEl.innerText = totalEstimasi.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + (window.currentLang === 'en' ? ' Tons' : ' Ton');
  realEl.innerText = totalRealisasi.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + (window.currentLang === 'en' ? ' Tons' : ' Ton');
  varEl.innerText = variancePct.toFixed(2) + '%';
  if (countEl) {
    countEl.innerText = window.currentLang === 'en' ?
      'Overall Variance (' + finalRows.length + ' finalized blocks)' :
      'Variance Keseluruhan (' + finalRows.length + ' blok final)';
  }

  if (varTonEl) {
    const varianceTon = totalRealisasi - totalEstimasi;
    const isLossTon = varianceTon < 0;
    const absVarianceTonFmt = Math.abs(varianceTon).toLocaleString('id-ID', { maximumFractionDigits: 0 });
    const labelTon = isLossTon ?
      (window.currentLang === 'en' ? 'Loss: ' + absVarianceTonFmt + ' Ton' : 'Loss: ' + absVarianceTonFmt + ' Ton') :
      (varianceTon > 0 ?
        (window.currentLang === 'en' ? 'Dilution: +' + absVarianceTonFmt + ' Ton' : 'Dilusi: +' + absVarianceTonFmt + ' Ton') :
        (window.currentLang === 'en' ? '0 Ton' : '0 Ton'));
    varTonEl.innerText = labelTon;
    varTonEl.className = 'text-[10px] font-medium mt-0.5 ' + (isLossTon ? 'text-amber-400' : (varianceTon > 0 ? 'text-rose-400' : 'text-slate-500'));
  }

  // Ni% Estimasi
  if (estNiEl) {
    let sumEstimasiMetal = 0;
    finalRows.forEach(function(r) {
      const t = typeof r['Estimasi_tonase'] === 'number' ? r['Estimasi_tonase'] : 0;
      const ni = typeof r['Estimasi_Ni %'] === 'number' ? r['Estimasi_Ni %'] : 0;
      sumEstimasiMetal += t * ni;
    });
    const avgEstimasiNi = totalEstimasi > 0 ? sumEstimasiMetal / totalEstimasi : 0;
    estNiEl.innerText = avgEstimasiNi > 0 ? avgEstimasiNi.toFixed(2) + '%' : '-';
  }

  // Ni% Realisasi
  if (realNiEl) {
    const finalBlokPitSet = new Set(finalRows.map(function(r) {
      const b = (r['Id_blok'] || '').toString().trim().toUpperCase();
      const p = (r['Pit'] || '').toString().trim().toUpperCase();
      return b + '|' + p;
    }));
    let sumRealisasiMetal = 0, sumRealisasiTon = 0;
    (window.globalRawData || []).forEach(function(row) {
      const cleanRow = window.rawToCleanRow ? window.rawToCleanRow.get(row) : null;
      if (!cleanRow) return;
      const blok = (cleanRow['blok'] || cleanRow['id blok'] || cleanRow['id_blok'] || '').toString().trim().toUpperCase();
      const pit = (cleanRow['pit'] || cleanRow['area'] || '').toString().trim().toUpperCase();
      if (!finalBlokPitSet.has(blok + '|' + pit)) return;
      const tonase = cleanNumber(cleanRow['tonase']);
      let ni = cleanPercentValue(cleanRow['ni %'] || cleanRow['ni']);
      if (ni > 50) ni = ni / 100;
      if (tonase > 0 && ni > 0) {
        sumRealisasiMetal += tonase * ni;
        sumRealisasiTon += tonase;
      }
    });
    const avgRealisasiNi = sumRealisasiTon > 0 ? sumRealisasiMetal / sumRealisasiTon : 0;
    realNiEl.innerText = avgRealisasiNi > 0 ? avgRealisasiNi.toFixed(2) + '%' : '-';
  }
}

function openBlockModelDetailModal(idx) {
  const row = window.globalBlockModelData[idx];
  if (!row) return;
  const idBlok = (row['Id_blok'] || '-').toString();
  const pit = row['Pit'] || '-';
  const estimasiNi = row['Estimasi_Ni %'];

  const realisasiKimiaByBlok = computeRealisasiKimiaByBlok();
  const realKimiaKey = idBlok.trim().toUpperCase() + '|' + pit.toString().trim().toUpperCase();
  const realKimia = realisasiKimiaByBlok[realKimiaKey] || null;

  const paramRows = [
    { label: 'Ni %', est: estimasiNi, akt: realKimia ? realKimia.ni : null },
    { label: 'Fe %', est: row['Estimasi_Fe %'], akt: realKimia ? realKimia.fe : null },
    { label: 'Co %', est: row['Estimasi_Co %'], akt: realKimia ? realKimia.co : null },
    { label: 'MgO %', est: row['Estimasi_MgO %'], akt: realKimia ? realKimia.mgo : null },
    { label: 'SiO2 %', est: row['Estimasi_SiO %'], akt: realKimia ? realKimia.sio2 : null },
    { label: 'SM % (SiO2/MgO)', est: row['Estimasi_SM %'], akt: realKimia ? realKimia.sm : null }
  ];

  const rowsHtml = paramRows.map(function(p) {
    const estFmt = (typeof p.est === 'number') ? p.est.toFixed(2) : '-';
    const aktFmt = (typeof p.akt === 'number') ? p.akt.toFixed(2) : '-';
    let deltaHtml = '<span class="text-slate-600">-</span>';
    if (typeof p.est === 'number' && typeof p.akt === 'number') {
      const delta = p.akt - p.est;
      const sign = delta >= 0 ? '+' : '';
      const color = Math.abs(delta) <= 0.1 ? 'text-emerald-400' : 'text-amber-400';
      deltaHtml = '<span class="' + color + ' font-semibold">' + sign + delta.toFixed(2) + '</span>';
    }
    return '<tr class="border-b border-slate-800/40">' +
      '<td class="p-2 text-slate-300 font-medium">' + p.label + '</td>' +
      '<td class="p-2 text-right text-slate-400">' + estFmt + '</td>' +
      '<td class="p-2 text-right text-title font-semibold">' + aktFmt + '</td>' +
      '<td class="p-2 text-right">' + deltaHtml + '</td>' +
    '</tr>';
  }).join('');

  let validasiHtml = '<span class="text-slate-600">-</span>';
  if (typeof estimasiNi === 'number' && window.globalValidasiData && window.globalValidasiData.length > 0) {
    const matchingGroups = window.globalValidasiData.filter(function(g) {
      return (g.blok || '').trim().toUpperCase() === idBlok.trim().toUpperCase();
    });
    const niValues = matchingGroups.map(function(g) { return g.avg && g.avg.ni; }).filter(function(v) { return v !== null && v !== undefined; });
    if (niValues.length > 0) {
      const avgValidasiNi = niValues.reduce(function(a, b) { return a + b; }, 0) / niValues.length;
      const delta = avgValidasiNi - estimasiNi;
      const deltaColor = Math.abs(delta) <= 0.1 ? 'text-emerald-400' : 'text-amber-400';
      const sign = delta >= 0 ? '+' : '';
      validasiHtml = '<span class="text-slate-300 font-semibold">' + avgValidasiNi.toFixed(2) + '%</span> <span class="' + deltaColor + ' text-[10px] font-semibold">(' + sign + delta.toFixed(2) + ' vs Estimasi)</span>';
    }
  }

  document.getElementById('blockmodel-detail-title').innerText = idBlok + ' / ' + pit;
  document.getElementById('blockmodel-detail-validasi').innerHTML = validasiHtml;
  document.getElementById('blockmodel-detail-kimia-body').innerHTML = rowsHtml;

  showModalAnimated(document.getElementById('blockmodel-detail-modal'));
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeBlockModelDetailModal() {
  hideModalAnimated(document.getElementById('blockmodel-detail-modal'));
}

// ============================================================
// REKONSILIASI (Breakdown, Pending, Filter)
// ============================================================

function renderReconciliation() {
  if (!window.globalRawData || window.globalRawData.length === 0) return;

  const rekonDateStartEl = document.getElementById('rekon-date-start');
  const rekonDateEndEl = document.getElementById('rekon-date-end');
  const rekonPitFilterEl = document.getElementById('rekon-pit-filter');
  if (!rekonDateStartEl || !rekonDateEndEl || !rekonPitFilterEl) return;

  const startVal = rekonDateStartEl.value;
  const endVal = rekonDateEndEl.value;
  const pitVal = rekonPitFilterEl.value.toLowerCase();
  const startDate = startVal ? new Date(startVal + 'T00:00:00') : null;
  const endDate = endVal ? new Date(endVal + 'T23:59:59') : null;

  const rows = window.globalRawData.map(function(row) {
    return window.rawToCleanRow ? window.rawToCleanRow.get(row) || {} : {};
  }).filter(function(r) {
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
  const byBlokPit = {};
  const pendingRows = [];

  rows.forEach(function(r) {
    const pit = r['pit'] || r['area'] || '-';
    const blok = r['blok'] || r['id blok'] || r['idblok'] || r['id_blok'] || '-';
    const tujuan = (r['tujuan'] || '').trim();
    const tonase = cleanNumber(r['tonase']);
    totalProduksi += tonase;

    const blokPitKey = blok + '|' + pit;
    if (!byBlokPit[blokPitKey]) {
      byBlokPit[blokPitKey] = { blok: blok, pit: pit, produksi: 0, efo: 0, eto: 0, direct: 0, disposal: 0, belum: 0 };
    }
    byBlokPit[blokPitKey].produksi += tonase;

    if (tujuan.toLowerCase() === 'efo') byBlokPit[blokPitKey].efo += tonase;
    else if (tujuan.toLowerCase() === 'eto') byBlokPit[blokPitKey].eto += tonase;
    else if (tujuan.toLowerCase() === 'direct') byBlokPit[blokPitKey].direct += tonase;
    else if (tujuan.toLowerCase() === 'disposal') byBlokPit[blokPitKey].disposal += tonase;
    else {
      byBlokPit[blokPitKey].belum += tonase;
      pendingRows.push(r);
    }
  });

  const totalTerkirim = totalProduksi - Object.values(byBlokPit).reduce(function(s, p) { return s + p.belum; }, 0);
  const selisih = totalProduksi - totalTerkirim;
  const persen = totalProduksi > 0 ? (totalTerkirim / totalProduksi * 100) : 0;

  document.getElementById('rekon-total-produksi').innerText = totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 0 }) +
    (window.currentLang === 'en' ? ' Tons' : ' Ton');
  document.getElementById('rekon-total-terkirim').innerText = totalTerkirim.toLocaleString('id-ID', { maximumFractionDigits: 0 }) +
    (window.currentLang === 'en' ? ' Tons' : ' Ton');
  document.getElementById('rekon-selisih').innerText = selisih.toLocaleString('id-ID', { maximumFractionDigits: 0 }) +
    (window.currentLang === 'en' ? ' Tons' : ' Ton');
  document.getElementById('rekon-persen').innerText = persen.toFixed(1) + '%';

  const breakdownBody = document.getElementById('rekon-breakdown-body');
  const blokPitKeys = Object.keys(byBlokPit).sort(function(a, b) {
    const blokA = byBlokPit[a].blok, blokB = byBlokPit[b].blok;
    if (blokA !== blokB) return blokA.localeCompare(blokB);
    return byBlokPit[a].pit.localeCompare(byBlokPit[b].pit);
  });
  window.reconciliationBreakdownData = blokPitKeys.map(function(k) { return byBlokPit[k]; });

  if (blokPitKeys.length === 0) {
    breakdownBody.innerHTML = '<tr><td colspan="8" class="text-center p-6 text-slate-500 font-medium">' +
      (window.currentLang === 'en' ? 'No data for this filter.' : 'Tidak ada data untuk filter ini.') +
      '</td></tr>';
  } else {
    breakdownBody.innerHTML = blokPitKeys.map(function(k) {
      const p = byBlokPit[k];
      return '<tr class="hover:bg-slate-800/30 transition-colors">' +
        '<td class="p-2.5 text-slate-400">' + p.blok + '</td>' +
        '<td class="p-2.5 font-semibold text-title">' + p.pit + '</td>' +
        '<td class="p-2.5 text-right font-bold text-title">' + p.produksi.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + '</td>' +
        '<td class="p-2.5 text-right text-blue-400">' + p.efo.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + '</td>' +
        '<td class="p-2.5 text-right text-emerald-400">' + p.eto.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + '</td>' +
        '<td class="p-2.5 text-right text-amber-400">' + p.direct.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + '</td>' +
        '<td class="p-2.5 text-right text-slate-400">' + p.disposal.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + '</td>' +
        '<td class="p-2.5 text-right ' + (p.belum > 0 ? 'text-rose-400 font-bold' : 'text-slate-500') + '">' + p.belum.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + '</td>' +
      '</tr>';
    }).join('');
  }

  if (typeof rekonChart !== 'undefined' && rekonChart) {
    const chartLabels = blokPitKeys.map(function(k) { return byBlokPit[k].blok + ' - ' + byBlokPit[k].pit; });
    rekonChart.data.labels = chartLabels;
    rekonChart.data.datasets[0].data = blokPitKeys.map(function(k) { return byBlokPit[k].efo; });
    rekonChart.data.datasets[1].data = blokPitKeys.map(function(k) { return byBlokPit[k].eto; });
    rekonChart.data.datasets[2].data = blokPitKeys.map(function(k) { return byBlokPit[k].direct; });
    rekonChart.data.datasets[3].data = blokPitKeys.map(function(k) { return byBlokPit[k].disposal; });
    rekonChart.data.datasets[4].data = blokPitKeys.map(function(k) { return byBlokPit[k].belum; });
    rekonChart.update();
  }

  pendingRows.sort(function(a, b) {
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
    pendingBody.innerHTML = '<tr><td colspan="7" class="text-center p-6 text-emerald-400 font-medium">' +
      (window.currentLang === 'en' ? 'All rows have a destination assigned.' : 'Semua baris sudah punya Tujuan.') +
      '</td></tr>';
  } else {
    const today = new Date();
    pendingBody.innerHTML = pendingRows.map(function(r) {
      const d = parseDiggingDate(r['tanggal'] || r['date']);
      const daysWaiting = d ? Math.max(0, Math.floor((today - d) / 86400000)) : null;
      const isStale = daysWaiting !== null && daysWaiting > 3;
      const badgeClass = isStale ?
        'bg-rose-500/20 text-rose-400 border-rose-500/30' :
        'bg-slate-700/40 text-slate-400 border-slate-600/40';
      const badgeText = daysWaiting === null ? '-' : (daysWaiting + (window.currentLang === 'en' ? 'd' : ' hr'));
      return '<tr class="hover:bg-slate-800/30 transition-colors">' +
        '<td class="p-2.5 text-slate-300">' + ((r['tanggal'] || r['date'] || '-').toString().split(' ')[0]) + '</td>' +
        '<td class="p-2.5 font-semibold text-title">' + (r['pit'] || r['area'] || '-') + '</td>' +
        '<td class="p-2.5">' + (r['blok'] || r['id blok'] || r['idblok'] || r['id_blok'] || '-') + '</td>' +
        '<td class="p-2.5">' + (r['material'] || '-') + '</td>' +
        '<td class="p-2.5 text-right font-bold text-title">' + cleanNumber(r['tonase']).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + '</td>' +
        '<td class="p-2.5">' + (r['id sampel'] || r['id_sampel'] || '-') + '</td>' +
        '<td class="p-2.5 text-center"><span class="px-2 py-0.5 rounded-md text-[11px] border font-semibold ' + badgeClass + '">' + badgeText + '</span></td>' +
      '</tr>';
    }).join('');
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function resetReconciliationFilter() {
  document.getElementById('rekon-date-start').value = '';
  document.getElementById('rekon-date-end').value = '';
  document.getElementById('rekon-pit-filter').value = '';
  renderReconciliation();
}

// ============================================================
// F1-F4 MATRIX
// ============================================================

function computeReconciliationMatrix() {
  const tbody = document.getElementById('matrix-f1f2-body');
  if (!tbody) return;

  const gcTonaseByBlok = computeGcTonaseByBlok();

  const paByBlokPit = {};
  (window.globalPitActualData || []).forEach(function(row) {
    const blok = (row.blok || '').toString().trim();
    const pit = (row.pit || '').toString().trim();
    if (!blok) return;
    const key = blok + '|' + pit;
    paByBlokPit[key] = (paByBlokPit[key] || 0) + (row.tonase || 0);
  });

  let totalPitActual = 0;
  (window.globalPitActualData || []).forEach(function(row) {
    totalPitActual += (row.tonase || 0);
  });

  let totalPlant = 0;
  (window.globalBargeShipmentData || []).forEach(function(s) {
    const aktual = parseFloat(s.tonase_aktual);
    if (!isNaN(aktual) && aktual > 0) totalPlant += aktual;
  });

  let totalBM = 0;
  (window.globalBlockModelData || []).forEach(function(row) {
    const statusKpi = (row['Status_KPI'] || '').toString();
    const depletionVal_ = (row['Status_Depletion'] || '').toString().trim();
    const isBelumFinal = statusKpi.includes('Belum Final') || depletionVal_ !== 'Selesai';
    if (!isBelumFinal) totalBM += (row['Estimasi_tonase'] || 0);
  });

  const f3 = totalPitActual > 0 ? (totalPlant / totalPitActual * 100) : null;
  const f4 = totalBM > 0 ? (totalPlant / totalBM * 100) : null;

  const f3El = document.getElementById('matrix-f3-value');
  const f4El = document.getElementById('matrix-f4-value');
  const totalPaEl = document.getElementById('matrix-total-pitactual');
  const totalPlantEl = document.getElementById('matrix-total-plant');

  if (f3El) f3El.innerText = f3 !== null ? f3.toFixed(1) + '%' : '-';
  if (f4El) {
    f4El.innerText = f4 !== null ? f4.toFixed(1) + '%*' : '-';
    f4El.title = window.currentLang === 'en' ?
      'Caution: F4 compares 2 different populations -- Total BM only counts finalized Blocks, but Total Plant includes ALL actual shipments without Block filtering.' :
      'Perhatian: F4 membandingkan 2 populasi berbeda -- Total BM hanya menghitung Blok yang sudah final, sedangkan Total Plant mencakup SEMUA shipment aktual tanpa filter Blok.';
  }
  if (totalPaEl) totalPaEl.innerText = totalPitActual > 0 ?
    totalPitActual.toLocaleString('id-ID') + (window.currentLang === 'en' ? ' Tons' : ' Ton') :
    '-';
  if (totalPlantEl) totalPlantEl.innerText = totalPlant > 0 ?
    totalPlant.toLocaleString('id-ID') + (window.currentLang === 'en' ? ' Tons' : ' Ton') :
    '-';

  if (!window.globalBlockModelData || window.globalBlockModelData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-6 text-slate-500 text-xs font-medium">' +
      (window.currentLang === 'en' ? 'No Block Model data yet.' : 'Belum ada data Block Model.') +
      '</td></tr>';
    return;
  }

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
  tbody.innerHTML = window.globalBlockModelData.map(function(row) {
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

    let quickLinkRcaF2 = '';
    if (isF2OutOfTol && typeof canManageRca === 'function' && canManageRca()) {
      const blokEsc = idBlok.toString().replace(/'/g, "\\'");
      const pitEsc = pit.toString().replace(/'/g, "\\'");
      const deskripsiEsc = 'EWS: F2 (Pit Actual/GC) ' + f2.toFixed(1) + '% -- deviasi melebihi toleransi ' + EWS_F2_TOLERANSI_OUTOFTOL + '%.'.replace(/'/g, "\\'");
      quickLinkRcaF2 = '<button onclick="event.stopPropagation(); openFormRcaPopup(\'' + blokEsc + '\', \'' + pitEsc + '\', \'Pit Actual\', \'' + deskripsiEsc + '\')" title="' +
        (window.currentLang === 'en' ? 'Quick RCA (F2)' : 'Catat RCA Cepat (F2)') +
        '" class="ml-1 inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 transition-all cursor-pointer align-middle"><i data-lucide="zap" class="w-2.5 h-2.5"></i></button>';
    }

    return '<tr>' +
      '<td class="p-2.5 font-semibold text-title">' + idBlok + '</td>' +
      '<td class="p-2.5 text-slate-300">' + (pit || '-') + '</td>' +
      '<td class="p-2.5 text-right text-slate-300">' + bmTon.toLocaleString('id-ID') + '</td>' +
      '<td class="p-2.5 text-right text-slate-300">' + (gcTon > 0 ? gcTon.toLocaleString('id-ID') : '-') + '</td>' +
      '<td class="p-2.5 text-center font-semibold ' + f1f2Color(f1) + '">' + (f1 !== null ? f1.toFixed(1) + '%' : '-') + '</td>' +
      '<td class="p-2.5 text-right text-slate-300">' + (paTon > 0 ? paTon.toLocaleString('id-ID') : '-') + '</td>' +
      '<td class="p-2.5 text-center font-semibold ' + f1f2Color(f2) + '">' + (f2 !== null ? f2.toFixed(1) + '%' : '-') + quickLinkRcaF2 +
    '</td></tr>';
  }).join('');

  // EWS Banner
  const ewsBanner = document.getElementById('matrix-ews-banner');
  if (ewsBanner) {
    if (ewsF2OutOfTolCount > 0) {
      ewsBanner.classList.remove('hidden');
      ewsBanner.innerHTML = '<i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> ' +
        (window.currentLang === 'en' ?
          'EWS: ' + ewsF2OutOfTolCount + ' Block/Pit exceed the F2 deviation tolerance of ' + EWS_F2_TOLERANSI_OUTOFTOL + '% -- field check recommended.' :
          'EWS: ' + ewsF2OutOfTolCount + ' Blok/Pit deviasi F2 melebihi toleransi ' + EWS_F2_TOLERANSI_OUTOFTOL + '% -- disarankan cek lapangan.'
        );
      if (typeof lucide !== 'undefined') lucide.createIcons();
      if (!window.ewsAlertNotified) {
        triggerEwsAlert();
        window.ewsAlertNotified = true;
      }
    } else {
      ewsBanner.classList.add('hidden');
      ewsBanner.innerHTML = '';
      window.ewsAlertNotified = false;
    }
  }
}

// ============================================================
// EWS ALERT (Suara & Haptik)
// ============================================================

function unlockEwsAudioContext() {
  if (window.ewsAudioCtx) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      window.ewsAudioCtx = new AudioCtx();
      if (window.ewsAudioCtx.state === 'suspended') {
        window.ewsAudioCtx.resume().catch(function() {});
      }
    }
  } catch (err) { /* diam-diam */ }
}
['click', 'touchstart', 'keydown'].forEach(function(evt) {
  document.addEventListener(evt, unlockEwsAudioContext, { once: true, passive: true });
});

function triggerEwsAlert() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      if (!window.ewsAudioCtx) window.ewsAudioCtx = new AudioCtx();
      const ctx = window.ewsAudioCtx;
      if (ctx.state === 'suspended') ctx.resume().catch(function() {});
      function playBeep(startTime, freq) {
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
      }
      const now = ctx.currentTime;
      playBeep(now, 880);
      playBeep(now + 0.35, 880);
    }
  } catch (err) {
    console.error('EWS audio alert gagal:', err);
  }
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch (err) { /* diam-diam */ }
}

// ============================================================
// RCA LOG
// ============================================================

async function fetchRcaLogData(exportRequestId) {
  const listEl = document.getElementById('rca-log-list');
  if (listEl) listEl.innerHTML = '<p class="text-[11px] text-slate-500 font-medium">' +
    (window.currentLang === 'en' ? 'Loading RCA data...' : 'Memuat data RCA...') + '</p>';
  try {
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL + '?sheet=rcalog&t=' + new Date().getTime());
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to load RCA data.' : 'Gagal memuat data RCA'));
    }
    window.globalRcaLogData = result.data || [];
    if (listEl) renderRcaLogList();
    const exportModal = document.getElementById('export-preview-modal');
    if (exportRequestId === undefined || exportRequestId === window.rcaExportRequestId) {
      if (exportModal && !exportModal.classList.contains('hidden') && window.pendingExportSource === 'rca') {
        if (typeof renderExportPreview === 'function') renderExportPreview();
      }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return true;
  } catch (err) {
    console.error('Gagal memuat data RCA:', err);
    const isTimeout = err.name === 'AbortError';
    if (listEl) listEl.innerHTML = '<div class="text-center py-4">' +
      '<p class="text-[11px] text-rose-400 font-medium mb-2">' +
        (isTimeout ?
          (window.currentLang === 'en' ? 'Server not responding (timeout).' : 'Server tidak merespons (timeout).') :
          (window.currentLang === 'en' ? 'Failed to load RCA data.' : 'Gagal memuat data RCA.')) +
      '</p>' +
      '<button onclick="fetchRcaLogData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all">' +
      (window.currentLang === 'en' ? 'Retry' : 'Coba Lagi') +
      '</button></div>';
    return false;
  }
}

function renderRcaLogList() {
  const listEl = document.getElementById('rca-log-list');
  if (!listEl) return;

  const overdueBadgeEl = document.getElementById('rca-overdue-badge');
  if (overdueBadgeEl) {
    const overdueCount = (window.globalRcaLogData || []).filter(isRcaOverdue).length;
    if (overdueCount > 0) {
      overdueBadgeEl.innerText = overdueCount + ' ' + (window.currentLang === 'en' ? 'OVERDUE' : 'TERLAMBAT');
      overdueBadgeEl.classList.remove('hidden');
    } else {
      overdueBadgeEl.classList.add('hidden');
    }
  }

  if (window.globalRcaLogData.length === 0) {
    listEl.innerHTML = '<p class="text-[11px] text-slate-500 font-medium">' +
      (window.currentLang === 'en' ? 'No RCA entries yet.' : 'Belum ada entri RCA.') + '</p>';
    return;
  }

  const statusPriority = { 'open': 0, 'progress': 1, 'closed': 2 };
  const sorted = [...window.globalRcaLogData].sort(function(a, b) {
    const pa = statusPriority[(a.status || '').toLowerCase()] ?? 3;
    const pb = statusPriority[(b.status || '').toLowerCase()] ?? 3;
    if (pa !== pb) return pa - pb;
    const oa = isRcaOverdue(a) ? 0 : 1;
    const ob = isRcaOverdue(b) ? 0 : 1;
    return oa - ob;
  });

  const statusColors = {
    'open': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'closed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  };

  listEl.innerHTML = sorted.map(function(r) {
    const statusLower = String(r.status || 'Open').toLowerCase();
    const statusClass = statusColors[statusLower] || 'bg-slate-700/40 text-slate-400 border-slate-600/40';
    const isClosed = statusLower === 'closed';
    const overdue = isRcaOverdue(r);
    const createdDate = formatRcaDateTimePart(r.created_date, 'date');
    const createdTime = formatRcaDateTimePart(r.created_time, 'time');
    const closedDate = formatRcaDateTimePart(r.closed_date, 'date');
    const closedTime = formatRcaDateTimePart(r.closed_time, 'time');
    const createdInfo = (r.created_by || createdDate || createdTime) ?
      '<span>Maker: ' + (r.created_by || '-') + (createdDate ? ' · ' + createdDate : '') + (createdTime ? ' ' + createdTime : '') + '</span>' : '';
    const closedInfo = isClosed && (r.closed_by || closedDate || closedTime) ?
      '<span class="text-emerald-400/80">Checker: ' + (r.closed_by || '-') + (closedDate ? ' · ' + closedDate : '') + (closedTime ? ' ' + closedTime : '') + '</span>' : '';
    const safeId = String(r.rca_id || '').replace(/'/g, "\\'");
    const overdueBadge = overdue ?
      '<span class="px-1.5 py-0.5 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[10px] font-bold whitespace-nowrap animate-pulse">' +
      (window.currentLang === 'en' ? 'OVERDUE' : 'TERLAMBAT') + '</span>' : '';
    const closeButton = (!isClosed && typeof canCloseRca === 'function' && canCloseRca()) ?
      '<button type="button" onclick="closeRcaLog(\'' + safeId + '\')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all cursor-pointer"><i data-lucide="check-circle-2" class="w-3 h-3"></i>' +
      (window.currentLang === 'en' ? 'Close RCA' : 'Tutup RCA') + '</button>' : '';

    return '<div class="bg-slate-900/40 border ' + (overdue ? 'border-rose-500/50' : 'border-slate-700/60') + ' rounded-xl p-3">' +
      '<div class="flex items-start justify-between gap-2 mb-1.5 flex-wrap">' +
        '<div class="flex items-center gap-2 flex-wrap">' +
          '<span class="font-bold text-title text-xs">' + r.blok + (r.pit ? ' / ' + r.pit : '') + '</span>' +
          '<span class="px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[10px] font-semibold border border-blue-500/25">' + (r.tahap || '-') + '</span>' +
          '<span class="text-[10px] text-slate-600">' + (r.rca_id || '') + '</span>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 flex-wrap justify-end">' +
          overdueBadge +
          '<span class="px-2 py-0.5 rounded-md text-[10px] font-semibold border ' + statusClass + ' whitespace-nowrap">' +
            (r.status ? ((window.currentLang === 'en' || statusLower !== 'open') ? r.status : 'Terbuka') : (window.currentLang === 'en' ? 'Open' : 'Terbuka')) +
          '</span>' +
        '</div>' +
      '</div>' +
      '<p class="text-[11px] text-slate-300 font-medium mb-1">' + (r.deskripsi_isu || '-') + '</p>' +
      (r.root_cause ? '<p class="text-[11px] text-slate-500"><span class="font-semibold text-slate-400">' + (window.currentLang === 'en' ? 'Root Cause:' : 'Akar Masalah:') + '</span> ' + r.root_cause + '</p>' : '') +
      (r.tindakan ? '<p class="text-[11px] text-slate-500"><span class="font-semibold text-slate-400">' + (window.currentLang === 'en' ? 'Action' : 'Tindakan') + ':</span> ' + r.tindakan + '</p>' : '') +
      '<div class="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-medium flex-wrap">' +
        (r.pic ? '<span>PIC: ' + r.pic + '</span>' : '') +
        (r.target ? '<span class="' + (overdue ? 'text-rose-400 font-bold' : '') + '">Target: ' + r.target + '</span>' : '') +
        createdInfo + closedInfo +
      '</div>' +
      '<div class="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-slate-800/70">' +
        '<button type="button" onclick="copyRcaToClipboard(this, \'' + safeId + '\')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-600/40 text-[10px] font-bold transition-all cursor-pointer"><i data-lucide="clipboard-copy" class="w-3 h-3"></i>' +
        (window.currentLang === 'en' ? 'Copy' : 'Salin') + '</button>' +
        closeButton +
      '</div>' +
    '</div>';
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function isRcaOverdue(r) {
  if (!r || !r.target) return false;
  const statusLower = String(r.status || 'Open').toLowerCase();
  if (statusLower === 'closed') return false;
  const targetDate = parseDiggingDate(r.target);
  if (!targetDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  return today.getTime() > targetDate.getTime();
}

function formatRcaDateTimePart(value, kind) {
  if (value === null || value === undefined || value === '') return '';
  const s = String(value).trim();
  if (kind === 'time') {
    const legacyTime = s.match(/^1899-12-30T(\d{2}):(\d{2})(?::(\d{2}))?/i);
    if (legacyTime) return legacyTime[1] + ':' + legacyTime[2] + ':' + (legacyTime[3] || '00');
    const timeMatch = s.match(/(?:T|\s)(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) return timeMatch[1] + ':' + timeMatch[2] + ':' + (timeMatch[3] || '00');
    return s;
  }
  if (kind === 'date') {
    const legacyDate = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s)/);
    if (legacyDate) {
      const d = new Date(legacyDate[1] + '-' + legacyDate[2] + '-' + legacyDate[3] + 'T00:00:00');
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      }
    }
    return s;
  }
  return s;
}

function openFormRcaPopup(prefillBlok, prefillPit, prefillTahap, prefillDeskripsi) {
  if (!canManageRca()) {
    showNoticeModal(
      window.currentLang === 'en' ? 'Locked' : 'Terkunci',
      window.currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first.' :
      'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu.'
    );
    return;
  }
  ['rca-blok', 'rca-pit', 'rca-deskripsi', 'rca-root-cause', 'rca-tindakan', 'rca-target'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('rca-tahap').value = '';
  if (typeof populateNameOptions === 'function') populateNameOptions(document.getElementById('rca-pic'));
  document.getElementById('rca-status-msg').classList.add('hidden');
  if (prefillBlok) document.getElementById('rca-blok').value = prefillBlok;
  if (prefillPit) document.getElementById('rca-pit').value = prefillPit;
  if (prefillTahap) document.getElementById('rca-tahap').value = prefillTahap;
  if (prefillDeskripsi) document.getElementById('rca-deskripsi').value = prefillDeskripsi;
  if (typeof updateRcaPitActualEvidence === 'function') updateRcaPitActualEvidence();
  const modal = document.getElementById('form-rca-popup-modal');
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeFormRcaPopup() {
  hideModalAnimated(document.getElementById('form-rca-popup-modal'));
}

async function submitRcaLog() {
  const blok = document.getElementById('rca-blok').value.trim();
  const pit = document.getElementById('rca-pit').value.trim();
  const tahap = document.getElementById('rca-tahap').value;
  const deskripsi = document.getElementById('rca-deskripsi').value.trim();
  const rootCause = document.getElementById('rca-root-cause').value.trim();
  const tindakan = document.getElementById('rca-tindakan').value.trim();
  const pic = document.getElementById('rca-pic').value;
  const target = document.getElementById('rca-target').value;
  const statusMsg = document.getElementById('rca-status-msg');
  const submitBtn = document.getElementById('btn-submit-rca');
  const originalHtml = submitBtn.innerHTML;

  if (!blok || !deskripsi) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Fill in Blok and Issue Description at minimum.' : 'Isi minimal Blok dan Deskripsi Isu.';
    statusMsg.classList.remove('hidden');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' +
    (window.currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');

  try {
    const payload = buildAuthenticatedPayload({
      action: 'addRcaLog',
      blok: blok, pit: pit, tahap: tahap,
      deskripsi_isu: deskripsi,
      root_cause: rootCause,
      tindakan: tindakan,
      pic: pic,
      target: target
    }, {});
    const response = await fetch(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to save RCA.' : 'Gagal mencatat RCA.'));
    }

    statusMsg.className = 'text-xs text-emerald-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Recorded!' : 'Berhasil dicatat!';
    statusMsg.classList.remove('hidden');
    setTimeout(function() {
      closeFormRcaPopup();
      statusMsg.classList.add('hidden');
      if (typeof fetchRcaLogData === 'function') fetchRcaLogData();
    }, 900);
  } catch (error) {
    console.error('Error recording RCA:', error);
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = error.message || (window.currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.');
    statusMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

async function closeRcaLog(rcaId) {
  if (!canCloseRca()) {
    showNoticeModal(
      window.currentLang === 'en' ? 'Access Denied' : 'Akses Ditolak',
      window.currentLang === 'en' ? 'Your role cannot close RCA.' : 'Role Anda tidak memiliki hak menutup RCA.'
    );
    return;
  }
  if (!rcaId) return;
  const ok = await showConfirmModal(
    window.currentLang === 'en' ? 'Close RCA' : 'Tutup RCA',
    window.currentLang === 'en' ? 'Close this RCA? This action will mark it Closed and record the Checker identity.' :
    'Tutup RCA ini? RCA akan menjadi Closed dan identitas Checker akan dicatat.'
  );
  if (!ok) return;
  try {
    const payload = buildAuthenticatedPayload({ action: 'closeRcaLog', rca_id: rcaId }, {});
    const response = await fetch(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
    const result = await response.json();
    if (result.status !== 'success') {
      const err = new Error(result.message || (window.currentLang === 'en' ? 'Failed to close RCA.' : 'Gagal menutup RCA.'));
      err.code = result.code || '';
      throw err;
    }
    showNoticeModal(
      window.currentLang === 'en' ? 'RCA Closed' : 'RCA Ditutup',
      window.currentLang === 'en' ? 'RCA successfully closed by Checker.' : 'RCA berhasil ditutup oleh Checker.'
    );
    if (typeof fetchRcaLogData === 'function') fetchRcaLogData();
  } catch (error) {
    console.error('Error closing RCA:', error);
    showNoticeModal(
      window.currentLang === 'en' ? 'Close RCA Failed' : 'Gagal Menutup RCA',
      error.message || (window.currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.')
    );
  }
}

async function copyRcaToClipboard(btnEl, rcaId) {
  const r = (window.globalRcaLogData || []).find(function(x) { return String(x.rca_id) === String(rcaId); });
  if (!r) return;

  const en = window.currentLang === 'en';
  const statusLower = String(r.status || 'Open').toLowerCase();
  const createdDate = formatRcaDateTimePart(r.created_date, 'date');
  const createdTime = formatRcaDateTimePart(r.created_time, 'time');
  const closedDate = formatRcaDateTimePart(r.closed_date, 'date');
  const closedTime = formatRcaDateTimePart(r.closed_time, 'time');

  const lines = [];
  lines.push('RCA ' + (r.rca_id || ''));
  lines.push((en ? 'Block/Pit' : 'Blok/Pit') + ': ' + (r.blok || '-') + (r.pit ? ' / ' + r.pit : ''));
  lines.push((en ? 'Affected Stage' : 'Tahap Bermasalah') + ': ' + (r.tahap || '-'));
  lines.push('Status: ' + (r.status || (en ? 'Open' : 'Terbuka')));
  lines.push((en ? 'Issue Description' : 'Deskripsi Isu') + ': ' + (r.deskripsi_isu || '-'));
  if (r.root_cause) lines.push((en ? 'Root Cause' : 'Akar Masalah') + ': ' + r.root_cause);
  if (r.tindakan) lines.push((en ? 'Action' : 'Tindakan') + ': ' + r.tindakan);
  if (r.pic) lines.push('PIC: ' + r.pic);
  if (r.target) lines.push('Target: ' + r.target);
  if (r.created_by || createdDate || createdTime) {
    lines.push('Maker: ' + (r.created_by || '-') + (createdDate ? ' · ' + createdDate : '') + (createdTime ? ' ' + createdTime : ''));
  }
  if (statusLower === 'closed' && (r.closed_by || closedDate || closedTime)) {
    lines.push('Checker: ' + (r.closed_by || '-') + (closedDate ? ' · ' + closedDate : '') + (closedTime ? ' ' + closedTime : ''));
  }
  const text = lines.join('\n');

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (btnEl) {
      const original = btnEl.innerHTML;
      btnEl.disabled = true;
      btnEl.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i>' + (en ? 'Copied' : 'Tersalin');
      if (typeof lucide !== 'undefined') lucide.createIcons();
      setTimeout(function() {
        btnEl.innerHTML = original;
        btnEl.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }, 1500);
    }
  } catch (err) {
    console.error('Copy RCA failed:', err);
    showNoticeModal(en ? 'Copy Failed' : 'Gagal Menyalin', en ? 'Could not copy to clipboard.' : 'Tidak dapat menyalin ke clipboard.');
  }
}

// ============================================================
// PIT ACTUAL
// ============================================================

async function fetchPitActualData() {
  try {
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL + '?sheet=pitactual&t=' + new Date().getTime());
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to load Pit Actual data.' : 'Gagal memuat data Pit Actual'));
    }
    window.globalPitActualData = result.data || [];
    computeReconciliationMatrix();
    if (typeof markDataFresh_ === 'function') markDataFresh_('Pit Actual');
  } catch (err) {
    console.error('Gagal memuat data Pit Actual:', err);
    if (typeof markDataStale_ === 'function') markDataStale_('Pit Actual');
  }
}

function canManagePitActual() {
  return isDeveloperUnlocked();
}

function openFormPitActualPopup() {
  if (!canManagePitActual()) {
    showNoticeModal(
      window.currentLang === 'en' ? 'Locked' : 'Terkunci',
      window.currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first.' :
      'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu.'
    );
    return;
  }
  ['pa-tanggal', 'pa-blok', 'pa-pit', 'pa-rit', 'pa-catatan'].forEach(function(id) { document.getElementById(id).value = ''; });
  document.getElementById('pa-shift').value = '';
  document.getElementById('pa-tf').value = 26;
  document.getElementById('pa-tonase-preview').innerText = '';
  if (typeof populateNameOptions === 'function') populateNameOptions(document.getElementById('pa-pic'));
  document.getElementById('pa-status-msg').classList.add('hidden');
  const modal = document.getElementById('form-pitactual-popup-modal');
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeFormPitActualPopup() {
  hideModalAnimated(document.getElementById('form-pitactual-popup-modal'));
}

function updatePitActualTonasePreview() {
  const rit = parseFloat(document.getElementById('pa-rit').value) || 0;
  const tf = parseFloat(document.getElementById('pa-tf').value) || 0;
  const preview = document.getElementById('pa-tonase-preview');
  preview.innerText = (rit > 0 && tf > 0) ?
    (window.currentLang === 'en' ? 'Tonnage: ' : 'Tonase: ') + (rit * tf).toLocaleString() + (window.currentLang === 'en' ? ' tons' : ' ton') :
    '';
}

async function submitPitActual() {
  const tanggal = document.getElementById('pa-tanggal').value;
  const shift = document.getElementById('pa-shift').value;
  const blok = document.getElementById('pa-blok').value.trim();
  const pit = document.getElementById('pa-pit').value.trim();
  const rit = parseFloat(document.getElementById('pa-rit').value) || 0;
  const tf = parseFloat(document.getElementById('pa-tf').value) || 0;
  const pic = document.getElementById('pa-pic').value;
  const catatan = document.getElementById('pa-catatan').value.trim();
  const statusMsg = document.getElementById('pa-status-msg');
  const submitBtn = document.getElementById('btn-submit-pitactual');
  const originalHtml = submitBtn.innerHTML;

  if (!tanggal || !shift || !blok || rit <= 0 || tf <= 0) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Fill in Date, Shift, Blok, Rit, and TF.' : 'Isi Tanggal, Shift, Blok, Rit, dan TF.';
    statusMsg.classList.remove('hidden');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' +
    (window.currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');

  try {
    const payload = buildAuthenticatedPayload({
      action: 'addPitActual',
      tanggal: tanggal, shift: shift, blok: blok, pit: pit, rit: rit, tf: tf, pic: pic, catatan: catatan
    }, { developerOnly: true });
    const response = await fetch(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to save Pit Actual.' : 'Gagal mencatat Pit Actual.'));
    }

    statusMsg.className = 'text-xs text-emerald-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Recorded!' : 'Berhasil dicatat!';
    statusMsg.classList.remove('hidden');
    setTimeout(function() {
      closeFormPitActualPopup();
      statusMsg.classList.add('hidden');
      if (typeof fetchPitActualData === 'function') fetchPitActualData();
    }, 900);
  } catch (error) {
    console.error('Error recording Pit Actual:', error);
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = error.message || (window.currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.');
    statusMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function openPitActualHistoryModal() {
  const modal = document.getElementById('pitactual-history-modal');
  document.getElementById('pitactual-history-search').value = '';
  renderPitActualHistoryTable();
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closePitActualHistoryModal() {
  hideModalAnimated(document.getElementById('pitactual-history-modal'));
}

function renderPitActualHistoryTable() {
  const tbody = document.getElementById('pitactual-history-body');
  if (!tbody) return;

  const searchInput = document.getElementById('pitactual-history-search');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

  const sorted = [...(window.globalPitActualData || [])].sort(function(a, b) {
    return (b.tanggal || '').localeCompare(a.tanggal || '');
  });

  const filtered = query ? sorted.filter(function(row) {
    const haystack = [row.blok, row.pit, row.pic, row.catatan].map(function(v) { return (v || '').toString().toLowerCase(); }).join(' ');
    return haystack.includes(query);
  }) : sorted;

  if (filtered.length === 0) {
    const msg = query ?
      (window.currentLang === 'en' ? 'No matching records found.' : 'Tidak ada data yang cocok.') :
      (window.currentLang === 'en' ? 'No Pit Actual records yet.' : 'Belum ada data Pit Actual.');
    tbody.innerHTML = '<tr><td colspan="9" class="text-center p-6 text-slate-500 text-xs font-medium">' + msg + '</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(row) {
    const tonase = typeof row.tonase === 'number' ? row.tonase.toLocaleString('id-ID') : (row.tonase || '-');
    const catatanHtml = row.catatan ?
      '<span class="text-amber-300">' + row.catatan + '</span>' :
      '<span class="text-slate-600">-</span>';
    return '<tr class="hover:bg-slate-800/30 transition-colors">' +
      '<td class="p-2.5 text-slate-300">' + (row.tanggal || '-') + '</td>' +
      '<td class="p-2.5 text-slate-300">' + (row.shift || '-') + '</td>' +
      '<td class="p-2.5 font-semibold text-title">' + (row.blok || '-') + '</td>' +
      '<td class="p-2.5 text-slate-300">' + (row.pit || '-') + '</td>' +
      '<td class="p-2.5 text-right text-slate-300">' + (row.rit || '-') + '</td>' +
      '<td class="p-2.5 text-right text-slate-300">' + (row.tf || '-') + '</td>' +
      '<td class="p-2.5 text-right font-bold text-title">' + tonase + '</td>' +
      '<td class="p-2.5 text-slate-300">' + (row.pic || '-') + '</td>' +
      '<td class="p-2.5">' + catatanHtml + '</td>' +
    '</tr>';
  }).join('');
}

function getPitActualCatatanByBlokPit(blok, pit) {
  const blokUp = (blok || '').toString().trim().toUpperCase();
  const pitUp = (pit || '').toString().trim().toUpperCase();
  if (!blokUp) return [];
  return (window.globalPitActualData || []).filter(function(row) {
    const rowBlok = (row.blok || '').toString().trim().toUpperCase();
    const rowPit = (row.pit || '').toString().trim().toUpperCase();
    if (rowBlok !== blokUp) return false;
    if (pitUp && rowPit !== pitUp) return false;
    return !!(row.catatan && row.catatan.toString().trim());
  });
}

function updateRcaPitActualEvidence() {
  const wrap = document.getElementById('rca-pitactual-evidence-wrap');
  const list = document.getElementById('rca-pitactual-evidence-list');
  if (!wrap || !list) return;

  const blok = document.getElementById('rca-blok').value;
  const pit = document.getElementById('rca-pit').value;
  const matches = getPitActualCatatanByBlokPit(blok, pit);

  if (matches.length === 0) {
    wrap.classList.add('hidden');
    list.innerHTML = '';
    return;
  }

  list.innerHTML = matches.map(function(row) {
    return '<p class="text-[11px] text-slate-300"><span class="text-slate-500">' + (row.tanggal || '-') + ' (' + (row.pic || '-') + '):</span> ' + row.catatan + '</p>';
  }).join('');
  wrap.classList.remove('hidden');
}

// ============================================================
// COGCONFIG
// ============================================================

async function fetchCOGConfig() {
  const requestSeq = ++window.cogConfigFetchRequestSeq;
  try {
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL + '?sheet=cogconfig&t=' + new Date().getTime());
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to load COG configuration.' : 'Gagal memuat COGConfig'));
    }

    const rows = result.data || [];
    const cfg = {
      Sapro: null, Limo: null, Limo_Aktif: false, SM_Threshold_AutoDetect: 3,
      Target_Ship_Ni_Min: 1.3, Target_Ship_Ni_Max: 1.6,
      Warna_Waste: 'abu', Warna_LG: 'kuning', Warna_MG: 'biru', Warna_HG: 'hijau', Warna_VHG: 'hijau',
      Bucket_per_Sampel: 8, Sampel_per_Dome_Max: 25,
      Toleransi_Warning_Pct: 5, Toleransi_OutOfTol_Pct: 10
    };
    const VALID_COLOR_PRESETS = ['merah', 'abu', 'kuning', 'biru', 'hijau'];
    const alreadySetFields = new Set();

    function setOnceGlobal(fieldName, value) {
      if (alreadySetFields.has(fieldName)) return;
      alreadySetFields.add(fieldName);
      cfg[fieldName] = value;
    }

    rows.forEach(function(row) {
      const tipe = (row['Tipe_Ore'] || '').toString().trim();
      const batas = {
        Batas_Waste_LG: parseFloat(row['Batas_Waste_LG']),
        Batas_LG_MG: parseFloat(row['Batas_LG_MG']),
        Batas_MG_HG: parseFloat(row['Batas_MG_HG']),
        Batas_HG_VHG: parseFloat(row['Batas_HG_VHG']),
        WMT_per_Bucket: (row['WMT_per_Bucket'] !== undefined && row['WMT_per_Bucket'] !== '' && !isNaN(parseFloat(row['WMT_per_Bucket']))) ?
          parseFloat(row['WMT_per_Bucket']) : 2.2
      };
      if (tipe === 'Sapro') cfg.Sapro = batas;
      if (tipe === 'Limo') cfg.Limo = batas;

      if (row['Limo_Aktif'] !== undefined && row['Limo_Aktif'] !== '') {
        const v = row['Limo_Aktif'].toString().trim().toUpperCase();
        setOnceGlobal('Limo_Aktif', v === 'TRUE');
      }
      if (row['SM_Threshold_AutoDetect'] !== undefined && row['SM_Threshold_AutoDetect'] !== '') {
        const smT = parseFloat(row['SM_Threshold_AutoDetect']);
        if (!isNaN(smT)) setOnceGlobal('SM_Threshold_AutoDetect', smT);
      }
      if (row['Target_Ship_Ni_Min'] !== undefined && row['Target_Ship_Ni_Min'] !== '') {
        const tsMin = parseFloat(row['Target_Ship_Ni_Min']);
        if (!isNaN(tsMin)) setOnceGlobal('Target_Ship_Ni_Min', tsMin);
      }
      if (row['Target_Ship_Ni_Max'] !== undefined && row['Target_Ship_Ni_Max'] !== '') {
        const tsMax = parseFloat(row['Target_Ship_Ni_Max']);
        if (!isNaN(tsMax)) setOnceGlobal('Target_Ship_Ni_Max', tsMax);
      }
      if (row['Bucket_per_Sampel'] !== undefined && row['Bucket_per_Sampel'] !== '') {
        const bps = parseFloat(row['Bucket_per_Sampel']);
        if (!isNaN(bps)) setOnceGlobal('Bucket_per_Sampel', bps);
      }
      if (row['Sampel_per_Dome_Max'] !== undefined && row['Sampel_per_Dome_Max'] !== '') {
        const spd = parseFloat(row['Sampel_per_Dome_Max']);
        if (!isNaN(spd)) setOnceGlobal('Sampel_per_Dome_Max', spd);
      }
      if (row['Toleransi_Warning_Pct'] !== undefined && row['Toleransi_Warning_Pct'] !== '') {
        const twp = parseFloat(row['Toleransi_Warning_Pct']);
        if (!isNaN(twp)) setOnceGlobal('Toleransi_Warning_Pct', twp);
      }
      if (row['Toleransi_OutOfTol_Pct'] !== undefined && row['Toleransi_OutOfTol_Pct'] !== '') {
        const top = parseFloat(row['Toleransi_OutOfTol_Pct']);
        if (!isNaN(top)) setOnceGlobal('Toleransi_OutOfTol_Pct', top);
      }
      ['Waste', 'LG', 'MG', 'HG', 'VHG'].forEach(function(grade) {
        const colKey = 'Warna_' + grade;
        const val = row[colKey];
        if (val !== undefined && val !== '' && VALID_COLOR_PRESETS.indexOf(val.toString().trim()) !== -1) {
          setOnceGlobal(colKey, val.toString().trim());
        }
      });
    });

    const sapreoMissing = !cfg.Sapro, limoMissing = !cfg.Limo;
    if (sapreoMissing) cfg.Sapro = { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 };
    if (limoMissing) cfg.Limo = { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 };

    if (requestSeq !== window.cogConfigFetchRequestSeq) return;
    window.globalCOGConfig = cfg;
    window.cogConfigUsingFallback = sapreoMissing || limoMissing;
    if (window.cogConfigUsingFallback && typeof window.showCogFallbackWarning_ === 'function') {
      window.showCogFallbackWarning_();
    }
  } catch (err) {
    if (requestSeq !== window.cogConfigFetchRequestSeq) return;
    console.error('Gagal memuat COGConfig, pakai fallback default Sapro:', err);
    window.globalCOGConfig = {
      Sapro: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 },
      Limo: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 },
      Limo_Aktif: false,
      SM_Threshold_AutoDetect: 3,
      Target_Ship_Ni_Min: 1.3,
      Target_Ship_Ni_Max: 1.6,
      Warna_Waste: 'abu', Warna_LG: 'kuning', Warna_MG: 'biru', Warna_HG: 'hijau', Warna_VHG: 'hijau',
      Bucket_per_Sampel: 8, Sampel_per_Dome_Max: 25,
      Toleransi_Warning_Pct: 5, Toleransi_OutOfTol_Pct: 10
    };
    window.cogConfigUsingFallback = true;
    if (typeof window.showCogFallbackWarning_ === 'function') window.showCogFallbackWarning_();
  }
  // Re-render UI yang butuh COGConfig
  if (window.globalFilteredTableData && window.globalFilteredTableData.length > 0) {
    if (typeof renderTableData === 'function') renderTableData(window.globalFilteredTableData);
    if (typeof updateDashboard === 'function') updateDashboard(window.globalFilteredTableData);
  }
  if (window.globalBlockModelData && window.globalBlockModelData.length > 0) {
    if (typeof renderBlockModelTable === 'function') renderBlockModelTable();
  }
}

function openCOGConfigModal(tab) {
  const modal = document.getElementById('cogconfig-modal');
  document.getElementById('cogconfig-select-tipe').value = 'Sapro';
  loadCOGConfigFormValues();
  switchCOGConfigTab(tab || 'cog');
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCOGConfigModal() {
  hideModalAnimated(document.getElementById('cogconfig-modal'));
  document.getElementById('cogconfig-status-msg').classList.add('hidden');
}

function switchCOGConfigTab(tab) {
  const tabs = ['cog', 'flag', 'bucket'];
  const titleMap = {
    cog: { title: 'cogconfig_modal_title', subtitle: 'cogconfig_modal_subtitle', icon: 'sliders-horizontal', color: 'cyan' },
    flag: { title: 'flagconfig_card_title', subtitle: 'flagconfig_modal_subtitle', icon: 'flag', color: 'fuchsia' },
    bucket: { title: 'bucketconfig_card_title', subtitle: 'bucketconfig_modal_subtitle', icon: 'package', color: 'orange' }
  };
  const info = titleMap[tab] || titleMap.cog;

  tabs.forEach(function(t) {
    const btn = document.getElementById('cogconfig-tabbtn-' + t);
    const content = document.getElementById('cogconfig-tab-content-' + t);
    const active = t === tab;
    if (content) content.classList.toggle('hidden', !active);
    if (btn) {
      const activeColorClass = active ? ('bg-' + (titleMap[t] ? titleMap[t].color : 'cyan') + '-600 text-white') : 'text-slate-400 hover:text-slate-200';
      btn.className = 'flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ' + activeColorClass;
    }
  });

  const tipeOreWrap = document.getElementById('cogconfig-tipeore-wrap');
  if (tipeOreWrap) tipeOreWrap.classList.toggle('hidden', tab === 'flag');

  const titleEl = document.getElementById('cogconfig-modal-title');
  const subtitleEl = document.getElementById('cogconfig-modal-subtitle');
  if (titleEl) {
    titleEl.setAttribute('data-i18n', info.title);
    titleEl.innerText = window.translations && window.translations[window.currentLang] ? window.translations[window.currentLang][info.title] : titleEl.innerText;
  }
  if (subtitleEl) {
    subtitleEl.setAttribute('data-i18n', info.subtitle);
    subtitleEl.innerText = window.translations && window.translations[window.currentLang] ? window.translations[window.currentLang][info.subtitle] : subtitleEl.innerText;
  }
  const iconEl = document.getElementById('cogconfig-modal-icon');
  if (iconEl) iconEl.setAttribute('data-lucide', info.icon);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function loadCOGConfigFormValues() {
  const tipe = document.getElementById('cogconfig-select-tipe').value;
  const cfg = window.globalCOGConfig || {
    Sapro: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 },
    Limo: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 },
    Limo_Aktif: false,
    SM_Threshold_AutoDetect: 3,
    Target_Ship_Ni_Min: 1.3,
    Target_Ship_Ni_Max: 1.6,
    Bucket_per_Sampel: 8,
    Sampel_per_Dome_Max: 25
  };
  const batas = cfg[tipe] || cfg.Sapro;

  document.getElementById('cogconfig-batas-waste-lg').value = batas.Batas_Waste_LG;
  document.getElementById('cogconfig-batas-lg-mg').value = batas.Batas_LG_MG;
  document.getElementById('cogconfig-batas-mg-hg').value = batas.Batas_MG_HG;
  document.getElementById('cogconfig-batas-hg-vhg').value = batas.Batas_HG_VHG;
  document.getElementById('cogconfig-limo-aktif').checked = !!cfg.Limo_Aktif;
  document.getElementById('cogconfig-sm-threshold').value = cfg.SM_Threshold_AutoDetect;
  document.getElementById('cogconfig-target-ship-min').value = cfg.Target_Ship_Ni_Min;
  document.getElementById('cogconfig-target-ship-max').value = cfg.Target_Ship_Ni_Max;
  document.getElementById('cogconfig-toleransi-warning').value = cfg.Toleransi_Warning_Pct !== undefined ? cfg.Toleransi_Warning_Pct : 5;
  document.getElementById('cogconfig-toleransi-ootol').value = cfg.Toleransi_OutOfTol_Pct !== undefined ? cfg.Toleransi_OutOfTol_Pct : 10;
  document.getElementById('cogconfig-warna-waste').value = cfg.Warna_Waste || 'abu';
  document.getElementById('cogconfig-warna-lg').value = cfg.Warna_LG || 'kuning';
  document.getElementById('cogconfig-warna-mg').value = cfg.Warna_MG || 'biru';
  document.getElementById('cogconfig-warna-hg').value = cfg.Warna_HG || 'hijau';
  document.getElementById('cogconfig-warna-vhg').value = cfg.Warna_VHG || 'hijau';
  document.getElementById('cogconfig-wmt-bucket').value = batas.WMT_per_Bucket !== undefined ? batas.WMT_per_Bucket : 2.2;
  document.getElementById('cogconfig-bucket-sampel').value = cfg.Bucket_per_Sampel || 8;
  document.getElementById('cogconfig-sampel-dome').value = cfg.Sampel_per_Dome_Max || 25;
}

async function submitCOGConfigForm() {
  const statusMsg = document.getElementById('cogconfig-status-msg');
  const submitBtn = document.getElementById('btn-submit-cogconfig');
  const originalHtml = submitBtn.innerHTML;

  const tipeOre = document.getElementById('cogconfig-select-tipe').value;
  const batasWasteLG = parseFloat(document.getElementById('cogconfig-batas-waste-lg').value);
  const batasLGMG = parseFloat(document.getElementById('cogconfig-batas-lg-mg').value);
  const batasMGHG = parseFloat(document.getElementById('cogconfig-batas-mg-hg').value);
  const batasHGVHG = parseFloat(document.getElementById('cogconfig-batas-hg-vhg').value);
  const limoAktif = document.getElementById('cogconfig-limo-aktif').checked;
  const smThreshold = parseFloat(document.getElementById('cogconfig-sm-threshold').value);
  const targetShipMin = parseFloat(document.getElementById('cogconfig-target-ship-min').value);
  const targetShipMax = parseFloat(document.getElementById('cogconfig-target-ship-max').value);
  const warnaWaste = document.getElementById('cogconfig-warna-waste').value;
  const warnaLG = document.getElementById('cogconfig-warna-lg').value;
  const warnaMG = document.getElementById('cogconfig-warna-mg').value;
  const warnaHG = document.getElementById('cogconfig-warna-hg').value;
  const warnaVHG = document.getElementById('cogconfig-warna-vhg').value;
  const wmtPerBucket = parseFloat(document.getElementById('cogconfig-wmt-bucket').value);
  const bucketPerSampel = document.getElementById('cogconfig-bucket-sampel').value;
  const sampelPerDomeMax = document.getElementById('cogconfig-sampel-dome').value;
  const toleransiWarning = parseFloat(document.getElementById('cogconfig-toleransi-warning').value);
  const toleransiOotol = parseFloat(document.getElementById('cogconfig-toleransi-ootol').value);

  // Validasi urutan naik
  if (isNaN(batasWasteLG) || isNaN(batasLGMG) || isNaN(batasMGHG) || isNaN(batasHGVHG)) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'All 4 COG thresholds must be filled with numbers.' : 'Semua 4 batas COG wajib diisi angka.';
    statusMsg.classList.remove('hidden');
    return;
  }
  if (!(batasWasteLG < batasLGMG && batasLGMG < batasMGHG && batasMGHG < batasHGVHG)) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Threshold order must be ascending: Waste->LG < LG->MG < MG->HG < HG->VHG.' :
      'Urutan batas harus naik: Waste->LG < LG->MG < MG->HG < HG->VHG.';
    statusMsg.classList.remove('hidden');
    return;
  }
  if (!isNaN(targetShipMin) && !isNaN(targetShipMax) && targetShipMin >= targetShipMax) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'Ship Target Ni% Min must be less than Max.' : 'Target Ship Ni% Min harus lebih kecil dari Max.';
    statusMsg.classList.remove('hidden');
    return;
  }
  if (!isNaN(toleransiWarning) && !isNaN(toleransiOotol) && toleransiWarning >= toleransiOotol) {
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'WARNING threshold must be less than OUT OF TOL threshold.' :
      'Ambang WARNING harus lebih kecil dari ambang OUT OF TOL.';
    statusMsg.classList.remove('hidden');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' +
    (window.currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');

  try {
    const payload = buildAuthenticatedPayload({
      action: 'updateCOGConfig',
      tipe_ore: tipeOre,
      batas_waste_lg: batasWasteLG,
      batas_lg_mg: batasLGMG,
      batas_mg_hg: batasMGHG,
      batas_hg_vhg: batasHGVHG,
      limo_aktif: limoAktif ? 'true' : 'false',
      sm_threshold_autodetect: smThreshold,
      target_ship_ni_min: isNaN(targetShipMin) ? '' : targetShipMin,
      target_ship_ni_max: isNaN(targetShipMax) ? '' : targetShipMax,
      warna_waste: warnaWaste,
      warna_lg: warnaLG,
      warna_mg: warnaMG,
      warna_hg: warnaHG,
      warna_vhg: warnaVHG,
      wmt_per_bucket: isNaN(wmtPerBucket) ? '' : wmtPerBucket,
      bucket_per_sampel: bucketPerSampel,
      sampel_per_dome_max: sampelPerDomeMax,
      toleransi_warning_pct: isNaN(toleransiWarning) ? '' : toleransiWarning,
      toleransi_ootol_pct: isNaN(toleransiOotol) ? '' : toleransiOotol,
      updated_by: 'Developer'
    }, { developerOnly: true });
    const response = await fetch(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to save COG parameters.' : 'Gagal menyimpan parameter COG.'));
    }

    statusMsg.className = 'text-xs text-emerald-400';
    statusMsg.innerText = window.currentLang === 'en' ? 'COG parameters saved!' : 'Parameter COG berhasil disimpan!';
    statusMsg.classList.remove('hidden');

    await fetchCOGConfig();

    setTimeout(function() {
      statusMsg.classList.add('hidden');
    }, 1500);
  } catch (error) {
    console.error('Error submitting COGConfig:', error);
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = error.message || (window.currentLang === 'en' ? 'An error occurred while saving.' : 'Terjadi kesalahan saat menyimpan.');
    statusMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// ============================================================
// EXPOSE FUNCTIONS KE GLOBAL WINDOW
// ============================================================
window.fetchBlockModelData = fetchBlockModelData;
window.computeGcTonaseByBlok = computeGcTonaseByBlok;
window.renderBlockModelTable = renderBlockModelTable;
window.computeRealisasiKimiaByBlok = computeRealisasiKimiaByBlok;
window.formatEstAktCell = formatEstAktCell;
window.renderBlockModelChart = renderBlockModelChart;
window.updateBlockModelSummaryCard = updateBlockModelSummaryCard;
window.openBlockModelDetailModal = openBlockModelDetailModal;
window.closeBlockModelDetailModal = closeBlockModelDetailModal;
window.renderReconciliation = renderReconciliation;
window.resetReconciliationFilter = resetReconciliationFilter;
window.computeReconciliationMatrix = computeReconciliationMatrix;
window.triggerEwsAlert = triggerEwsAlert;
window.unlockEwsAudioContext = unlockEwsAudioContext;
window.fetchRcaLogData = fetchRcaLogData;
window.renderRcaLogList = renderRcaLogList;
window.openFormRcaPopup = openFormRcaPopup;
window.closeFormRcaPopup = closeFormRcaPopup;
window.submitRcaLog = submitRcaLog;
window.closeRcaLog = closeRcaLog;
window.copyRcaToClipboard = copyRcaToClipboard;
window.isRcaOverdue = isRcaOverdue;
window.formatRcaDateTimePart = formatRcaDateTimePart;
window.fetchPitActualData = fetchPitActualData;
window.canManagePitActual = canManagePitActual;
window.openFormPitActualPopup = openFormPitActualPopup;
window.closeFormPitActualPopup = closeFormPitActualPopup;
window.updatePitActualTonasePreview = updatePitActualTonasePreview;
window.submitPitActual = submitPitActual;
window.openPitActualHistoryModal = openPitActualHistoryModal;
window.closePitActualHistoryModal = closePitActualHistoryModal;
window.renderPitActualHistoryTable = renderPitActualHistoryTable;
window.getPitActualCatatanByBlokPit = getPitActualCatatanByBlokPit;
window.updateRcaPitActualEvidence = updateRcaPitActualEvidence;
window.fetchCOGConfig = fetchCOGConfig;
window.openCOGConfigModal = openCOGConfigModal;
window.closeCOGConfigModal = closeCOGConfigModal;
window.switchCOGConfigTab = switchCOGConfigTab;
window.loadCOGConfigFormValues = loadCOGConfigFormValues;
window.submitCOGConfigForm = submitCOGConfigForm;

// ======= RESTORASI DARI BASELINE (fungsi hilang di MG1) =======

// [RESTORED from baseline/core.js] renderRcaGroupingSummary
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

// [RESTORED from baseline/core.js] switchRekonView
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

// [RESTORED from baseline/core.js] switchTrendView
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

// [RESTORED from baseline/core.js] toggleRekonFilterPanel
 function toggleRekonFilterPanel() {
 const panel = document.getElementById('rekon-filter-panel');
 panel.classList.toggle('hidden');
 panel.classList.toggle('flex');
 }


// [RESTORED from baseline/core.js -- stub asli MG1 di helpers.js diganti implementasi nyata]
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
  let ni = cleanPercentValue(cleanRow['ni %'] || cleanRow['ni']);
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
