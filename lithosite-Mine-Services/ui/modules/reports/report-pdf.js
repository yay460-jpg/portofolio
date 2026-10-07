/* V38 Stage 35 — Report PDF print renderer. */
(function(global){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pct=v=>{const n=Number(v);return Number.isFinite(n)?n.toFixed(2)+'%':'—';};
const pctText=v=>{
  const n=Number(v);
  return Number.isFinite(n)?n.toFixed(2)+'%':'—';
};
const countText=v=>{
  if(!v||typeof v!=='object'||Array.isArray(v))return '';
  const entries=Object.entries(v);
  return entries.length?entries.map(([key,count])=>key+': '+count).join(' · '):'None recorded.';
};
const text=v=>{
  if(v===null||v===undefined)return '';
  if(typeof v==='string')return v;
  if(typeof v==='number'||typeof v==='boolean')return String(v);
  if(Array.isArray(v))return v.length?v.map(item=>text(item)).join('\n'):'None recorded.';
  if(typeof v==='object'){
    const lines=[];
    const add=(label,value)=>{if(value!==undefined&&value!==null&&String(value)!=='')lines.push(label+': '+String(value));};
    if(v.headline)add('Headline',v.headline);
    if(v.statement)add('Summary',v.statement);
    if(v.status)add('Status',v.status);
    if(v.management_attention)add('Management attention',v.management_attention);
    if(v.record_count!==undefined)add('Records',v.record_count);
    if(v.completed_count!==undefined)add('Completed / validated',v.completed_count);
    if(v.open_count!==undefined)add('Open',v.open_count);
    if(v.open_issue_count!==undefined)add('Open issues',v.open_issue_count);
    if(v.open_plan_count!==undefined)add('Open plans',v.open_plan_count);
    if(v.operations!==undefined)add('Operations',v.operations);
    if(v.completed!==undefined)add('Completed',v.completed);
    if(v.equipment!==undefined)add('Equipment',v.equipment);
    if(v.workfront!==undefined)add('WorkFront',v.workfront);
    if(v.hse!==undefined)add('HSE',v.hse);
    if(v.maintenance!==undefined)add('Maintenance',v.maintenance);
    if(v.downtime_hours!==undefined)add('Downtime hours',v.downtime_hours===null?'Not available':v.downtime_hours);
    if(v.quantity_total!==undefined)add('Quantity total',v.quantity_total===null?'Not available':v.quantity_total);
    if(v.source_issue_records!==undefined)add('Source issue records',v.source_issue_records);
    if(v.target_data_available===false)add('Target vs actual','Target data is not available in the current source model; no target is fabricated.');
    if(v.comparison_available===false)add('Comparison','Historical comparison is not available in this report snapshot.');
    if(v.classification_available===false)add('Recurring classification','Historical recurring classification is not available in this report snapshot.');
    if(v.decision_required!==undefined)add('Decision required',v.decision_required?'Yes':'No');
    if(v.source_domains)add('Source domains',Array.isArray(v.source_domains)?v.source_domains.join(', '):v.source_domains);
    for(const key of ['by_status','by_activity','by_workfront','by_severity','by_unit','planned_by_status','actual_by_status','issues_by_status','plans_by_status']){
      if(v[key])add(key.replaceAll('_',' '),countText(v[key]));
    }
    if(v.kpi&&typeof v.kpi==='object'){
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
      const k=v.current,parts=[];
      if(k.status)parts.push('Status '+k.status);
      if(k.PA!==undefined&&k.PA!==null)parts.push('PA '+pctText(k.PA));
      if(k.UA!==undefined&&k.UA!==null)parts.push('UA '+pctText(k.UA));
      if(k.EU!==undefined&&k.EU!==null)parts.push('EU '+pctText(k.EU));
      if(parts.length)add('Current KPI',parts.join(' · '));
    }
    if(Array.isArray(v.items)&&v.items.length)add('Actions',v.items.join(' · '));
    if(v.note)add('Note',v.note);
    if(v.evidence&&typeof v.evidence==='object'){
      const summary=Object.entries(v.evidence).map(([domain,items])=>domain+': '+(Array.isArray(items)?items.length:0)).join(' · ');
      if(summary)add('Evidence records',summary);
    }
    if(lines.length)return lines.join('\n');
  }
  return 'Structured report data is available in the issued snapshot.';
};
function render(model){
  if(!model)throw new Error('Report model is required.');
  const win=window.open('','_blank'); if(!win)throw new Error('PDF window was blocked by the browser.');
  const k=model.kpi||{}, counts=model.source_counts||{}, sections=model.section_data||{};
  const title=(model.report_type||'REPORT')+' Report · '+model.period.start+(model.period.start!==model.period.end?' → '+model.period.end:'');
  const rows=Object.keys(counts).map(d=>'<tr><td>'+esc(d)+'</td><td>'+esc(counts[d])+'</td></tr>').join('');
  const section=(name,value)=>'<section><h2>'+esc(name)+'</h2><p>'+esc(text(value)||'Source evidence retained in the immutable snapshot.')+'</p></section>';
  const plan=Array.isArray(model.sections)?model.sections:[];
  const body=plan.map(name=>section(name,sections[name]||'Source evidence retained in the immutable snapshot.')).join('');
  win.document.open();
  win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{font-family:Arial,sans-serif;color:#172333;margin:28px;font-size:9px}h1{font-size:22px;margin:0 0 4px}h2{font-size:13px;margin:18px 0 6px;border-bottom:1px solid #cbd5e1;padding-bottom:4px}p{line-height:1.45;color:#475569;white-space:pre-line}.meta{color:#64748b;margin-bottom:16px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.kpi{border:1px solid #cbd5e1;padding:8px;border-radius:5px}.kpi small{display:block;color:#64748b;text-transform:uppercase}.kpi b{font-size:16px}table{width:100%;border-collapse:collapse;margin:7px 0 14px}th,td{text-align:left;padding:5px;border-bottom:1px solid #e2e8f0}th{font-size:7px;text-transform:uppercase;color:#64748b}td{font-size:8px}section{break-inside:avoid}.footer{margin-top:22px;color:#64748b;font-size:8px}@media print{button{display:none}}</style></head><body><h1>Reports &amp; KPI</h1><div class="meta">'+esc(title)+' · '+esc(model.status)+' · Report ID '+esc(model.report_id||'—')+' · Snapshot '+esc(model.snapshot_id||'DRAFT')+'</div><div class="kpis"><div class="kpi"><small>Records</small><b>'+esc(model.total_records??model.total_source_records??0)+'</b></div><div class="kpi"><small>PA</small><b>'+pct(k.PA)+'</b></div><div class="kpi"><small>UA</small><b>'+pct(k.UA)+'</b></div><div class="kpi"><small>EU</small><b>'+pct(k.EU)+'</b></div></div><h2>Operational Source Summary</h2><table><thead><tr><th>Domain</th><th>Records</th></tr></thead><tbody>'+rows+'</tbody></table>'+body+'<div class="footer">Lithosite Mine Services · V38 · Generated from the report snapshot.</div><script>window.onload=function(){setTimeout(function(){window.print()},150)}</script></body></html>');
  win.document.close();
  return true;
}
global.LithositePdfRenderer=Object.freeze({render});
})(window);
