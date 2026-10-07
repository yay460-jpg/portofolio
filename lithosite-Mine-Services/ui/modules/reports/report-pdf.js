/* V38 Stage 35 — Report PDF print renderer. */
(function(global){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pct=v=>{const n=Number(v);return Number.isFinite(n)?n.toFixed(2)+'%':'—';};
const pctText=v=>{
  const n=Number(v);
  return Number.isFinite(n)?n.toFixed(2)+'%':'—';
};
const humanize=v=>String(v??'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const countText=v=>{
  if(!v||typeof v!=='object'||Array.isArray(v))return '';
  const entries=Object.entries(v);
  return entries.length?entries.map(([key,count])=>humanize(key)+': '+count).join(' · '):'None recorded.';
};
const pctText=v=>{
  const n=Number(v);
  return Number.isFinite(n)?n.toFixed(2)+'%':'—';
};
const text=v=>{
  if(v===null||v===undefined)return '';
  if(typeof v==='string')return v;
  if(typeof v==='number'||typeof v==='boolean')return String(v);
  if(Array.isArray(v))return v.length?v.map(item=>text(item)).join('\n'):'None recorded.';
  if(typeof v==='object'){
    const lines=[];
    const add=(label,value)=>{
      if(value===undefined||value===null||String(value)==='')return;
      lines.push(label+': '+String(value));
    };
    const handled=new Set();
    const known=[
      ['headline','Headline'],['statement','Summary'],['status','Status'],
      ['management_attention','Management attention'],['record_count','Records'],
      ['completed_count','Completed / validated'],['open_count','Open'],
      ['open_issue_count','Open issues'],['open_plan_count','Open plans'],
      ['operations','Operations'],['completed','Completed'],['equipment','Equipment'],
      ['workfront','WorkFront'],['hse','HSE'],['maintenance','Maintenance'],
      ['downtime_hours','Downtime hours'],['quantity_total','Quantity total'],
      ['source_issue_records','Source issue records'],['decision_required','Decision required'],
      ['source','Source'],['target_data_available','Target data available'],
      ['actual_records','Actual records'],['planned_records','Planned records'],
      ['comparison_available','Comparison available'],['classification_available','Recurring classification'],
      ['note','Note']
    ];
    known.forEach(([key,label])=>{
      if(Object.prototype.hasOwnProperty.call(v,key)){
        handled.add(key);
        if(key==='target_data_available'&&v[key]===false)add(label,'No — target values are not available in the current source model.');
        else if(key==='comparison_available'&&v[key]===false)add(label,'No — historical comparison is not available in this snapshot.');
        else if(key==='classification_available'&&v[key]===false)add(label,'No — recurring classification is not available in this snapshot.');
        else if(key==='decision_required')add(label,v[key]?'Yes':'No');
        else add(label,v[key]);
      }
    });
    if(v.by_status){handled.add('by_status');add('Status breakdown',countText(v.by_status));}
    if(v.by_activity){handled.add('by_activity');add('Activity breakdown',countText(v.by_activity));}
    if(v.by_workfront){handled.add('by_workfront');add('WorkFront breakdown',countText(v.by_workfront));}
    if(v.by_severity){handled.add('Severity breakdown',countText(v.by_severity));}
    if(v.by_unit){handled.add('Unit breakdown',countText(v.by_unit));}
    if(v.planned_by_status){handled.add('planned_by_status');add('Planned status',countText(v.planned_by_status));}
    if(v.actual_by_status){handled.add('actual_by_status');add('Actual status',countText(v.actual_by_status));}
    if(v.issues_by_status){handled.add('issues_by_status');add('Issue status',countText(v.issues_by_status));}
    if(v.plans_by_status){handled.add('Plan status',countText(v.plans_by_status));}
    if(v.kpi&&typeof v.kpi==='object'){
      handled.add('kpi');
      const k=v.kpi,parts=[];
      if(k.status)parts.push('Status '+k.status);
      if(k.PA!==undefined&&k.PA!==null)parts.push('PA '+pctText(k.PA));
      if(k.UA!==undefined&&k.UA!==null)parts.push('UA '+pctText(k.UA));
      if(k.EU!==undefined&&k.EU!==null)parts.push('EU '+pctText(k.EU));
      if(k.eligible!==undefined)parts.push('Eligible '+k.eligible);
      if(k.excluded!==undefined)parts.push('Excluded '+k.excluded);
      if(parts.length)add('KPI',parts.join(' · '));
    }
    if(v.current&&typeof v.current==='object'){
      handled.add('current');
      const k=v.current,parts=[];
      if(k.status)parts.push('Status '+k.status);
      if(k.PA!==undefined&&k.PA!==null)parts.push('PA '+pctText(k.PA));
      if(k.UA!==undefined&&k.UA!==null)parts.push('UA '+pctText(k.UA));
      if(k.EU!==undefined&&k.EU!==null)parts.push('EU '+pctText(k.EU));
      if(parts.length)add('Current KPI',parts.join(' · '));
    }
    if(v.source_domains){handled.add('source_domains');add('Source domains',Array.isArray(v.source_domains)?v.source_domains.join(', '):v.source_domains);}
    if(Array.isArray(v.items)&&v.items.length){handled.add('items');add('Actions',v.items.join(' · '));}
    if(v.evidence&&typeof v.evidence==='object'){
      handled.add('evidence');
      const summary=Object.entries(v.evidence).map(([domain,items])=>domain+': '+(Array.isArray(items)?items.length:0)).join(' · ');
      if(summary)add('Evidence records',summary);
    }
    for(const [key,value] of Object.entries(v)){
      if(handled.has(key)||value===undefined||value===null||String(value)==='')continue;
      if(typeof value==='object'){
        if(Array.isArray(value))add(humanize(key),value.length?value.join(' · '):'None recorded.');
        else add(humanize(key),countText(value)||'Structured evidence available.');
      }else{
        add(humanize(key),value);
      }
    }
    return lines.join('\n');
  }
  return 'No section-specific narrative is available in this report snapshot.';
};
function render(model){
  if(!model)throw new Error('Report model is required.');
  const win=window.open('','_blank');
  if(!win)throw new Error('PDF window was blocked by the browser.');
  const k=model.kpi||{}, counts=model.source_counts||{}, sections=model.section_data||{};
  const type=String(model.report_type||'REPORT').toUpperCase();
  const period=model.period||{start:'—',end:'—'};
  const title=type+' Report';
  const periodText=period.start===period.end?period.start:(period.start+' → '+period.end);
  const escAttr=v=>esc(v).replace(/\n/g,' ');
  const rows=Object.keys(counts).map(domain=>'<tr><td>'+esc(domain)+'</td><td class="num">'+esc(counts[domain])+'</td></tr>').join('');
  const section=(name,value)=>{
    const body=text(value)||'Source evidence retained in the immutable snapshot.';
    return '<section class="report-section"><h2>'+esc(name)+'</h2><div class="section-body">'+esc(body)+'</div></section>';
  };
  const plan=Array.isArray(model.sections)?model.sections:[];
  const body=plan.map(name=>section(name,sections[name])).join('');
  const status=String(model.status||'DRAFT');
  const statusClass=status==='ISSUED'?'issued':(status==='READY'?'ready':(status==='VALIDATION REQUIRED'?'warning':'draft'));
  const attention=status==='VALIDATION REQUIRED'
    ? '<div class="attention warning"><b>Validation Required</b><span>This report cannot be treated as final until the KPI/source validation gate is resolved.</span></div>'
    : '<div class="attention"><b>Report Status</b><span>'+esc(status)+' · Generated from the selected report period and immutable report snapshot.</span></div>';
  const documentControl='<table class="control"><tbody>'+
    '<tr><th>Report Type</th><td>'+esc(type)+'</td><th>Period</th><td>'+esc(periodText)+'</td></tr>'+
    '<tr><th>Status</th><td><span class="status '+statusClass+'">'+esc(status)+'</span></td><th>Scope</th><td>'+esc(model.scope||'ALL')+'</td></tr>'+
    '<tr><th>Report ID</th><td>'+esc(model.report_id||'—')+'</td><th>Snapshot</th><td>'+esc(model.snapshot_id||'DRAFT')+'</td></tr>'+
    '<tr><th>Records</th><td>'+esc(model.total_records??model.total_source_records??0)+'</td><th>Data Status</th><td>'+esc(model.report_data_status||'REQUESTED_PERIOD')+'</td></tr>'+
    '</tbody></table>';
  const kpiCards=[
    ['PA',pctText(k.PA)],
    ['UA',pctText(k.UA)],
    ['EU',pctText(k.EU)],
    ['KPI Status',String(k.status||'UNAVAILABLE')]
  ].map(item=>'<div class="kpi-card"><small>'+esc(item[0])+'</small><strong>'+esc(item[1])+'</strong></div>').join('');
  win.document.open();
  win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+escAttr(title+' · '+periodText)+'</title><style>'+
    '@page{size:A4 portrait;margin:16mm 15mm 17mm}'+
    '*{box-sizing:border-box}'+
    'html,body{margin:0;padding:0;background:#fff;color:#172333;font-family:Arial,Helvetica,sans-serif;font-size:9.5px}'+
    'body{line-height:1.45}'+
    '.page{width:100%;max-width:180mm;margin:0 auto}'+
    '.brand{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #24456f;padding:0 0 9px;margin-bottom:14px}'+
    '.brand-main{display:flex;flex-direction:column;gap:2px}.brand-name{font-size:10px;font-weight:700;letter-spacing:.7px;color:#24456f;text-transform:uppercase}.brand-title{font-size:21px;font-weight:700;color:#172f4d}.brand-sub{font-size:9px;color:#64748b}'+
    '.brand-mark{font-size:8px;color:#64748b;text-align:right;line-height:1.5}.brand-mark b{color:#24456f}'+
    '.document-title{margin:0 0 5px;font-size:18px;color:#173a63}.document-period{font-size:9px;color:#64748b;margin-bottom:10px}'+
    '.control{width:100%;border-collapse:collapse;margin:8px 0 12px}.control th,.control td{border:1px solid #cbd5e1;padding:5px 7px;text-align:left}.control th{width:14%;background:#e9eff7;color:#29476b;font-size:7.5px;text-transform:uppercase}.control td{width:36%;color:#24364a}.status{display:inline-block;font-weight:700}.status.issued{color:#15803d}.status.ready{color:#2563eb}.status.warning{color:#b45309}.status.draft{color:#64748b}'+
    '.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0 14px}.kpi-card{border:1px solid #cbd5e1;border-top:3px solid #315a86;padding:7px 8px;background:#f8fafc;min-height:43px}.kpi-card small{display:block;color:#64748b;font-size:7px;text-transform:uppercase;letter-spacing:.4px}.kpi-card strong{display:block;margin-top:3px;color:#173a63;font-size:13px}'+
    '.attention{display:flex;gap:8px;align-items:flex-start;border:1px solid #c8d7e8;border-left:4px solid #315a86;background:#f3f7fb;padding:7px 9px;margin:0 0 14px}.attention b{color:#24456f;white-space:nowrap}.attention span{color:#475569}.attention.warning{border-color:#e7c77d;border-left-color:#d18a00;background:#fff8e8}.attention.warning b{color:#a15c00}'+
    '.summary-title{font-size:11px;font-weight:700;color:#24456f;text-transform:uppercase;letter-spacing:.5px;margin:0 0 6px;padding-bottom:4px;border-bottom:1px solid #cbd5e1}'+
    '.summary-table{width:100%;border-collapse:collapse;margin:0 0 14px}.summary-table th{background:#24456f;color:#fff;padding:5px 7px;text-align:left;font-size:7.5px;text-transform:uppercase}.summary-table td{border:1px solid #d7dee8;padding:4px 7px}.summary-table td.num{text-align:right;font-variant-numeric:tabular-nums}'+
    '.report-section{break-inside:avoid;margin:0 0 12px}.report-section h2{font-size:12px;color:#24456f;margin:0 0 6px;padding:5px 7px;background:#e8eef6;border-left:4px solid #315a86;border-bottom:1px solid #cbd5e1}.section-body{padding:3px 7px;color:#334155;white-space:pre-line;line-height:1.5}'+
    '.footer{margin-top:18px;padding-top:6px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;color:#64748b;font-size:7.5px}.footer b{color:#24456f}'+
    '.page-break{break-before:page}'+
    '@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.report-section{break-inside:avoid}.footer{position:fixed;left:0;right:0;bottom:-10mm;background:#fff}.no-print{display:none}}'+
    '</style></head><body><main class="page">'+
    '<header class="brand"><div class="brand-main"><div class="brand-name">Lithosite Mine Services</div><div class="brand-title">Reports &amp; KPI</div><div class="brand-sub">Operational Management Report · V38</div></div><div class="brand-mark"><b>'+esc(type)+' REPORT</b><br>'+esc(periodText)+'</div></header>'+
    '<h1 class="document-title">'+esc(title)+'</h1><div class="document-period">'+esc(periodText)+' · '+esc(status)+'</div>'+
    documentControl+
    '<div class="kpi-grid">'+kpiCards+'</div>'+
    attention+
    '<h2 class="summary-title">Operational Source Summary</h2><table class="summary-table"><thead><tr><th>Domain</th><th>Records</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    body+
    '<footer class="footer"><span><b>Lithosite Mine Services</b> · V38 · Report Snapshot</span><span>Generated '+esc((model.generated_at||new Date().toISOString()).slice(0,19).replace('T',' '))+'</span></footer>'+
    '</main><script>window.onload=function(){setTimeout(function(){window.print()},180)}</script></body></html>');
  win.document.close();
  return true;
}
global.LithositePdfRenderer=Object.freeze({render});
})(window);
