// ============================================================
// EXPORT.JS -- (file baru, dibuat saat restorasi MG1)
// ============================================================



// ======= RESTORASI DARI BASELINE (fungsi hilang di MG1) =======

// [RESTORED from baseline/core.js] authorizeExportServerSide
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

// [RESTORED from baseline/core.js] buildExportAuthenticatedPayload
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

// [RESTORED from baseline/core.js] buildPeriodicReportHtml
 function buildPeriodicReportHtml(startDate, endDate) {
 const t = (id, en) => currentLang === 'en' ? en : id;

 const finalRows = (globalBlockModelData || []).filter(row => {
  const statusKpi = (row['Status_KPI'] || '').toString();
  const depletionVal_ = (row['Status_Depletion'] || '').toString().trim();
  const isBelumFinal = statusKpi.includes('Belum Final') || depletionVal_ !== 'Selesai';
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

// [RESTORED from baseline/core.js] buildPrintReport
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

// [RESTORED from baseline/core.js] buildProfessionalReportHtml
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
  const depletionVal_ = (row['Status_Depletion'] || '').toString().trim();
  const isBelumFinal = statusKpi.includes('Belum Final') || depletionVal_ !== 'Selesai';
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

// [RESTORED from baseline/core.js] closeExportPreview
 function closeExportPreview() {
 const modal = document.getElementById('export-preview-modal');
 hideModalAnimated(modal);
 }

// [RESTORED from baseline/core.js] closePeriodicReportModal
 function closePeriodicReportModal() {
 hideModalAnimated(document.getElementById('periodic-report-modal'));
 }

// [RESTORED from baseline/core.js] closeProfessionalReportModal
 function closeProfessionalReportModal() {
 hideModalAnimated(document.getElementById('professional-report-modal'));
 }

// [FIX -- export KPI Member, 3 Sep] Fetch skor 5 pilar KPI untuk SEMUA member yang akan
// di-export, sekaligus/paralel (bukan 1-per-1 berurutan, biar tidak lambat). Hasil disimpan
// di memberKpiScoreCache (key = nama member lowercase), dibaca oleh getExportColumns.
async function fetchMemberKpiScoresForExport(requestId) {
  const periode = typeof getLocalPeriodeYyyyMm === 'function' ? getLocalPeriodeYyyyMm() : '';
  const members = (globalMemberData || []).slice();
  const results = await Promise.all(members.map(async function(item) {
    const nama = item['nama'] || item['Nama'] || '';
    if (!nama) return null;
    try {
      const url = window.GOOGLE_SCRIPT_READ_URL + '?sheet=kpiscore&member_id=' + encodeURIComponent(nama) + '&periode=' + periode + '&t=' + Date.now();
      const response = await fetchWithTimeout(url);
      const result = await response.json();
      if (result.status !== 'success' || !result.data) return { nama: nama, ok: false };
      return { nama: nama, ok: true, data: result.data };
    } catch (e) {
      return { nama: nama, ok: false };
    }
  }));
  if (requestId !== memberKpiExportRequestId) return false;
  memberKpiScoreCache = {};
  results.forEach(function(r) {
    if (r) memberKpiScoreCache[r.nama.trim().toLowerCase()] = r.ok ? r.data : null;
  });
  return true;
}

// [RESTORED from baseline/core.js] executeConfirmedExport
 async function executeConfirmedExport() {
 if (pendingExportSource === 'rca' && rcaExportLoading) {
  showNoticeModal(
   currentLang === 'en' ? 'RCA Data Still Loading' : 'Data RCA Masih Dimuat',
   currentLang === 'en' ? 'Please wait until RCA data finishes loading before exporting.' : 'Tunggu sampai data RCA selesai dimuat sebelum melakukan export.'
  );
  return;
 }
 if (pendingExportSource === 'member' && memberKpiExportLoading) {
  showNoticeModal(
   currentLang === 'en' ? 'KPI Scores Still Loading' : 'Skor KPI Masih Dimuat',
   currentLang === 'en' ? 'Please wait until KPI scores finish loading before exporting.' : 'Tunggu sampai skor KPI selesai dimuat sebelum melakukan export.'
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
   link.setAttribute('download',filenameBase + getLocalDateYyyyMmDd() + '.csv');
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

// [RESTORED from baseline/core.js] exportToWord
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
 link.setAttribute('download', filenameBase + getLocalDateYyyyMmDd() + '.doc');
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 logExportActivity(pendingExportSource, 'Word', filteredExportData.length, 'SUCCESS');
 }

// [RESTORED from baseline/core.js] generatePeriodicReport
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

// [RESTORED from baseline/core.js] getExportAuditFilterParams
  function getExportAuditFilterParams() {
  try {
   if (pendingExportSource === 'digging') return JSON.stringify({ pit: document.getElementById('pit-filter')?.value || '' });
   if (pendingExportSource === 'rekonsiliasi') return JSON.stringify({ pit: document.getElementById('rekon-pit-filter')?.value || '', date_start: document.getElementById('rekon-date-start')?.value || '', date_end: document.getElementById('rekon-date-end')?.value || '' });
   return '{}';
  } catch (e) { return '{}'; }
 }

// [RESTORED from baseline/core.js] getExportAuthToken
 function getExportAuthToken() {
  // Export harus mengikuti role/session yang sedang diprioritaskan UI.
  // Bila Developer session aktif, jangan jatuhkan request ke member token lama/stale.
  const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
  if (devToken) return devToken;
  return (localStorage.getItem('mine_member_token') || '').trim();
 }

// [RESTORED from baseline/core.js] getExportColumns
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
  const fmt1 = (v) => (v === null || v === undefined || v === '' || isNaN(parseFloat(v))) ? '-' : Number(v).toLocaleString('id-ID', {minimumFractionDigits:1, maximumFractionDigits:1});
  const fmtPct = (v) => (v === null || v === undefined || v === '' || isNaN(parseFloat(v))) ? '-' : Number(v).toFixed(2) + '%';
  // [FIX -- export KPI Member, 3 Sep] kolom lama (Target Blending/Inspeksi Bench/Accuracy)
  // sudah tidak dipakai sejak alih fungsi 30 Agu -- diganti 3 pasang tonase (sama dgn kartu
  // Member) + 5 pilar KPI + Skor Gabungan (dari memberKpiScoreCache, lihat
  // fetchMemberKpiScoresForExport). Kalau skor belum sempat termuat (cache kosong utk nama
  // itu), tampil '-' -- tidak pernah crash.
  const kpiScoreFor = function(item) {
   return memberKpiScoreCache[(item.nama || '').trim().toLowerCase()] || null;
  };
  const pilarScore = function(item, key) {
   const d = kpiScoreFor(item);
   if (!d || !d[key] || d[key].score === null || d[key].score === undefined) return '-';
   return Math.round(d[key].score);
  };
  const finalScore = function(item) {
   const d = kpiScoreFor(item);
   if (!d || d.final_score === null || d.final_score === undefined) return '-';
   return Math.round(d.final_score);
  };
  return {
  heads: [
   { key: 'th_nama_export', i18n: 'export_th_nama', fallback: 'Nama' },
   { key: 'th_jabatan_export', i18n: 'export_th_jabatan', fallback: 'Jabatan' },
   { key: 'th_total_tonase_export', i18n: 'export_th_total_tonase', fallback: 'Total Tonase' },
   { key: 'th_total_ni_export', i18n: 'export_th_total_ni', fallback: 'Avg Ni' },
   { key: 'th_waste_tonase_export', i18n: 'export_th_waste_tonase', fallback: 'Waste Tonase' },
   { key: 'th_waste_ni_export', i18n: 'export_th_waste_ni', fallback: 'Waste Ni' },
   { key: 'th_bersih_tonase_export', i18n: 'export_th_bersih_tonase', fallback: 'Tonase Murni' },
   { key: 'th_bersih_ni_export', i18n: 'export_th_bersih_ni', fallback: 'Ni Murni' },
   { key: 'th_pilar_laporan_export', i18n: 'export_th_pilar_laporan', fallback: 'Laporan Tepat Waktu' },
   { key: 'th_pilar_kehadiran_export', i18n: 'export_th_pilar_kehadiran', fallback: 'Kehadiran' },
   { key: 'th_pilar_safety_export', i18n: 'export_th_pilar_safety', fallback: 'Safety' },
   { key: 'th_pilar_sampling_export', i18n: 'export_th_pilar_sampling', fallback: 'Sampling' },
   { key: 'th_pilar_attitude_export', i18n: 'export_th_pilar_attitude', fallback: 'Attitude' },
   { key: 'th_final_score_export', i18n: 'export_th_final_score', fallback: 'Skor Gabungan' },
   { key: 'th_status_export', i18n: 'export_th_status', fallback: 'Status' },
   { key: 'th_grade_export', i18n: 'export_th_grade', fallback: 'Grade' }
  ],
  rowHtml: function(item) {
   return `
   <td class="p-2.5 font-medium text-title">${item.nama || '-'}</td>
   <td class="p-2.5">${item.jabatan || '-'}</td>
   <td class="p-2.5 text-center">${fmt1(item.total_tonase)}</td>
   <td class="p-2.5 text-center">${fmtPct(item.avg_ni_total)}</td>
   <td class="p-2.5 text-center">${fmt1(item.waste_tonase)}</td>
   <td class="p-2.5 text-center">${fmtPct(item.avg_ni_waste)}</td>
   <td class="p-2.5 text-center">${fmt1(item.tonase_murni)}</td>
   <td class="p-2.5 text-center">${fmtPct(item.avg_ni_murni)}</td>
   <td class="p-2.5 text-center">${pilarScore(item, 'pilar_laporan_tepat_waktu')}</td>
   <td class="p-2.5 text-center">${pilarScore(item, 'pilar_kehadiran')}</td>
   <td class="p-2.5 text-center">${pilarScore(item, 'pilar_safety')}</td>
   <td class="p-2.5 text-center">${pilarScore(item, 'pilar_kelengkapan_sampling')}</td>
   <td class="p-2.5 text-center">${pilarScore(item, 'pilar_attitude')}</td>
   <td class="p-2.5 text-center font-semibold">${finalScore(item)}</td>
   <td class="p-2.5">${item.status || '-'}</td>
   <td class="p-2.5 text-center font-semibold">${item.grade || '-'}</td>
   `;
  },
  rowPrint: function(item) {
   return [item.nama || '-', item.jabatan || '-', fmt1(item.total_tonase), fmtPct(item.avg_ni_total),
    fmt1(item.waste_tonase), fmtPct(item.avg_ni_waste), fmt1(item.tonase_murni), fmtPct(item.avg_ni_murni),
    pilarScore(item, 'pilar_laporan_tepat_waktu'), pilarScore(item, 'pilar_kehadiran'), pilarScore(item, 'pilar_safety'),
    pilarScore(item, 'pilar_kelengkapan_sampling'), pilarScore(item, 'pilar_attitude'), finalScore(item),
    item.status || '-', item.grade || '-'];
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

// [RESTORED from baseline/core.js] getExportTitleSubtitle
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

// [RESTORED from baseline/core.js] handleExportSelection
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

// [RESTORED from baseline/core.js] isExportFormatAllowed
 function isExportFormatAllowed(role, format) {
  role = String(role || 'PUBLIC').toUpperCase();
  format = String(format || '').toLowerCase();
  if (role === 'DEVELOPER') return ['csv','pdf','word'].indexOf(format) >= 0;
  if (role === 'SUPERVISOR') return ['pdf','word'].indexOf(format) >= 0;
  if (role === 'MEMBER') return format === 'pdf';
  return false;
 }

// [RESTORED from baseline/core.js] logExportActivity
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

// [RESTORED from baseline/core.js] openPeriodicReportModal
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

// [RESTORED from baseline/core.js] openProfessionalReportModal
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

// [RESTORED from baseline/core.js] printPeriodicReport
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

// [RESTORED from baseline/core.js] printProfessionalReport
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

// [RESTORED from baseline/core.js] renderExportPreview
 function renderExportPreview() {
 const cols = getExportColumns(pendingExportSource);
 const isRcaLoading = pendingExportSource === 'rca' && rcaExportLoading;
 const isMemberLoading = pendingExportSource === 'member' && memberKpiExportLoading;
 const isPreviewLoading = isRcaLoading || isMemberLoading;

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
 document.getElementById('preview-rows-val').innerText = isPreviewLoading
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
 if (isPreviewLoading) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td colspan="${cols.heads.length}" class="p-6 text-center text-slate-400 font-medium">` +
   `<span class="inline-flex items-center gap-2"><i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i>` +
   `${isMemberLoading ? (currentLang === 'en' ? 'Loading KPI scores...' : 'Memuat skor KPI...') : (currentLang === 'en' ? 'Loading RCA data...' : 'Memuat data RCA...')}</span></td>`;
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

// [RESTORED from baseline/barging.js] setExportConfirmLoadingState
 function setExportConfirmLoadingState(disabled) {
 const confirmBtn = document.getElementById('btn-confirm-export');
 if (!confirmBtn) return;
 if (disabled) {
  confirmBtn.disabled = true;
  confirmBtn.classList.add('opacity-60', 'cursor-not-allowed');
  confirmBtn.classList.remove('hover:bg-blue-500');
  confirmBtn.setAttribute('aria-busy', 'true');
  confirmBtn.innerHTML = '<i data-lucide="loader-circle" class="w-3.5 h-3.5 animate-spin"></i> ' + (currentLang === 'en' ? 'Loading RCA data...' : 'Memuat data RCA...');
 } else {
  confirmBtn.disabled = false;
  confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
  confirmBtn.classList.add('hover:bg-blue-500');
  confirmBtn.removeAttribute('aria-busy');
  lucide.createIcons();
 }
 lucide.createIcons();
 }

// [RESTORED from baseline/core.js] setExportOrientation
 function setExportOrientation(orientation) {
 pendingExportOrientation = orientation;
 const btnP = document.getElementById('btn-orientation-portrait');
 const btnL = document.getElementById('btn-orientation-landscape');
 const activeClass = 'bg-blue-600 text-white shadow-md';
 const inactiveClass = 'text-slate-400 hover:text-slate-200';
 btnP.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ' + (orientation === 'portrait' ? activeClass : inactiveClass);
 btnL.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ' + (orientation === 'landscape' ? activeClass : inactiveClass);
 }

// [RESTORED from baseline/core.js] setExportSource
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

 // [FIX -- export KPI Member, 3 Sep] sama pola dengan RCA: tunggu fetch skor 5 pilar semua
 // member selesai dulu sebelum tombol konfirmasi export boleh dipakai.
 if (source === 'member') {
  const requestId = ++memberKpiExportRequestId;
  memberKpiExportLoading = true;
  renderExportPreview();
  setExportConfirmLoadingState(true);
  fetchMemberKpiScoresForExport(requestId).then(ok => {
   if (requestId !== memberKpiExportRequestId || pendingExportSource !== 'member') return;
   memberKpiExportLoading = false;
   renderExportPreview();
   setExportConfirmLoadingState(!ok);
  });
  return;
 }

 // Membatalkan state loading RCA yang mungkin masih berjalan ketika user berpindah sumber.
 rcaExportRequestId++;
 rcaExportLoading = false;
 // Sama untuk state loading KPI Member.
 memberKpiExportRequestId++;
 memberKpiExportLoading = false;
 renderExportPreview();
 }

// [RESTORED from baseline/core.js] setPeriodicReportPreset
 function setPeriodicReportPreset(type) {
 const today = new Date();
 const endStr = getLocalDateYyyyMmDd(today);
 let start;
 if (type === 'week') {
  const day = today.getDay();
  const diffToMonday = (day === 0) ? 6 : day - 1;
  start = new Date(today);
  start.setDate(today.getDate() - diffToMonday);
 } else {
  start = new Date(today.getFullYear(), today.getMonth(), 1);
 }
 document.getElementById('periodic-report-start').value = getLocalDateYyyyMmDd(start);
 document.getElementById('periodic-report-end').value = endStr;
 }

// [RESTORED from baseline/core.js] showExportFormatForbidden
 function showExportFormatForbidden(format) {
  const role = getCurrentExportRole();
  const label = format === 'csv' ? 'CSV' : (format === 'word' ? 'Word' : 'PDF');
  const message = currentLang === 'en'
   ? (label + ' export is not available for role ' + role + '.')
   : ('Ekspor ' + label + ' tidak tersedia untuk role ' + role + '.');
  showNoticeModal(currentLang === 'en' ? 'Export Restricted' : 'Ekspor Dibatasi', message);
 }
