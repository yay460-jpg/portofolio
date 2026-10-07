/* V38 Stage 35 — Report PDF print renderer. */
(function(global){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pct=v=>{const n=Number(v);return Number.isFinite(n)?n.toFixed(2)+'%':'—';};
function render(model){
  if(!model)throw new Error('Report model is required.');
  const win=window.open('','_blank'); if(!win)throw new Error('PDF window was blocked by the browser.');
  const k=model.kpi||{}, counts=model.source_counts||{}, sections=model.section_data||{};
  const title=(model.report_type||'REPORT')+' Report · '+model.period.start+(model.period.start!==model.period.end?' → '+model.period.end:'');
  const rows=Object.keys(counts).map(d=>'<tr><td>'+esc(d)+'</td><td>'+esc(counts[d])+'</td></tr>').join('');
  const section=(name,text)=>'<section><h2>'+esc(name)+'</h2><p>'+esc(text||'Source evidence retained in the immutable snapshot.')+'</p></section>';
  const plan=Array.isArray(model.sections)?model.sections:[];
  const body=plan.map(name=>section(name,sections[name]||'Source evidence retained in the immutable snapshot.')).join('');
  win.document.open();
  win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{font-family:Arial,sans-serif;color:#172333;margin:28px;font-size:9px}h1{font-size:22px;margin:0 0 4px}h2{font-size:13px;margin:18px 0 6px;border-bottom:1px solid #cbd5e1;padding-bottom:4px}p{line-height:1.45;color:#475569}.meta{color:#64748b;margin-bottom:16px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.kpi{border:1px solid #cbd5e1;padding:8px;border-radius:5px}.kpi small{display:block;color:#64748b;text-transform:uppercase}.kpi b{font-size:16px}table{width:100%;border-collapse:collapse;margin:7px 0 14px}th,td{text-align:left;padding:5px;border-bottom:1px solid #e2e8f0}th{font-size:7px;text-transform:uppercase;color:#64748b}td{font-size:8px}section{break-inside:avoid}.footer{margin-top:22px;color:#64748b;font-size:8px}@media print{button{display:none}}</style></head><body><h1>Reports &amp; KPI</h1><div class="meta">'+esc(title)+' · '+esc(model.status)+' · Report ID '+esc(model.report_id||'—')+' · Snapshot '+esc(model.snapshot_id||'DRAFT')+'</div><div class="kpis"><div class="kpi"><small>Records</small><b>'+esc(model.total_records??model.total_source_records??0)+'</b></div><div class="kpi"><small>PA</small><b>'+pct(k.PA)+'</b></div><div class="kpi"><small>UA</small><b>'+pct(k.UA)+'</b></div><div class="kpi"><small>EU</small><b>'+pct(k.EU)+'</b></div></div><h2>Operational Source Summary</h2><table><thead><tr><th>Domain</th><th>Records</th></tr></thead><tbody>'+rows+'</tbody></table>'+body+'<div class="footer">Lithosite Mine Services · V38 · Generated from the report snapshot.</div><script>window.onload=function(){setTimeout(function(){window.print()},150)}</script></body></html>');
  win.document.close();
  return true;
}
global.LithositePdfRenderer=Object.freeze({render});
})(window);
