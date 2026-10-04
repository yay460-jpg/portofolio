/* V34 Stage 23: operational data display remains read-only; KPI snapshot finalization is an explicit runtime operation. */
(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
const foundation=global.LithositeKPIFoundation;
if(!rc)throw new Error('LithositeRuntimeClient is required before reports.js');
if(!foundation)throw new Error('LithositeKPIFoundation is required before reports.js');

const entities=['Operations','Equipment','WorkFront','Maintenance','Issues','Plans','HSE'];
const state={data:{},status:'loading',kpi:null,snapshots:[],date:null};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const rows=name=>Array.isArray(state.data[name])?state.data[name]:[];

function msg(text,error){const el=document.getElementById('reportsRuntimeMsg');if(el){el.textContent=text;el.classList.toggle('error',!!error);}}
function latestOperationalDate(){const values=rows('Operations').map(r=>String(r.transaction_date||'').slice(0,10)).filter(Boolean).sort();return values.length?values[values.length-1]:new Date().toISOString().slice(0,10);}
function fmtHours(value){const n=Number(value);return Number.isFinite(n)?n.toFixed(2):'—';}
function fmtPct(value,status){
  if(value===null||value===undefined||value==='') return '—';
  if(status && status!=='READY') return '—';
  const n=Number(value);
  return Number.isFinite(n)?n.toFixed(2)+'%':'—';
}
function setDateControl(){const el=document.getElementById('reportsKpiDate');if(!el)return;if(!state.date)state.date=latestOperationalDate();el.value=state.date;}

function renderCounts(){
  const total=entities.reduce((n,e)=>n+rows(e).length,0);
  const k={operations:rows('Operations').length,equipment:rows('Equipment').length,workfront:rows('WorkFront').length,maintenance:rows('Maintenance').length,issues:rows('Issues').length,plans:rows('Plans').length,hse:rows('HSE').length};
  ['operations','equipment','workfront','maintenance','issues','plans','hse'].forEach(x=>{const el=document.getElementById('reportKpi'+x[0].toUpperCase()+x.slice(1));if(el)el.textContent=k[x];});
  const host=document.getElementById('reportsSummary');
  if(host)host.innerHTML='<div class="report-row report-head"><span>Domain</span><span>Records</span><span>Share</span></div>'+entities.map(e=>{const n=rows(e).length;const share=total?Math.round(n/total*100):0;return '<div class="report-row"><span>'+esc(e)+'</span><b>'+n+'</b><span class="report-bar"><i style="width:'+share+'%"></i></span></div>';}).join('');
  const meta=document.getElementById('reportsCount');if(meta)meta.textContent=total+' records · Runtime Ready';
}

function renderKpi(){
  const k=state.kpi,pa=k&&k.results?k.results.PA:null,ua=k&&k.results?k.results.UA:null,eu=k&&k.results?k.results.EU:null;
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  set('reportsFleetPA',fmtPct(pa&&pa.value,pa&&pa.status));
  set('reportsFleetUA',fmtPct(ua&&ua.value,ua&&ua.status));set('reportsFleetEU',fmtPct(eu&&eu.value,eu&&eu.status));
  set('reportsFleetStatus',k?String(k.status):'—');set('reportsEligible',k&&k.population?String(k.population.eligible):'0');set('reportsExcluded',k&&k.population?String(k.population.excluded):'0');
  const baseline=foundation.DEFAULT_BASELINE;
  set('reportsBaseline',baseline.baseline_id+' · '+baseline.shift_start+'–'+baseline.shift_end+' · break '+baseline.breaks.map(b=>b.start+'–'+b.end).join(', '));

  const host=document.getElementById('equipmentKpiRows');if(!host)return;
  if(!k){host.innerHTML='<div class="kpi-empty">KPI calculation unavailable.</div>';return;}
  host.innerHTML=(k.equipment||[]).map(result=>{
    const t=result.timeline||{},rpa=result.results&&result.results.PA||{},rua=result.results&&result.results.UA||{};
    const classes=String(result.status||'').toLowerCase().replace(/[^a-z_]/g,'-'),reu=result.results&&result.results.EU||{};
    const events=(t.events||[]).map(ev=>{
      const s=new Date(ev.start_time),e=new Date(ev.end_time);
      const st=Number.isNaN(s.getTime())?'—':s.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
      const et=Number.isNaN(e.getTime())?'—':e.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
      return '<div class="kpi-event"><span>'+esc(st)+'–'+esc(et)+'</span><b>'+esc(ev.availability)+' / '+esc(ev.usage)+'</b><span>'+esc(ev.source_entity)+':'+esc(ev.source_id)+' '+esc(ev.event_version||'')+'</span></div>';
    }).join('');
    return '<details class="equipment-kpi-detail"><summary><span class="eq-id">'+esc(result.equipmentId)+'</span><span>'+fmtHours(rpa.denominatorHours)+'</span><span>'+fmtHours(rpa.numeratorHours)+'</span><span>'+fmtHours(rua.numeratorHours)+'</span><strong>'+fmtPct(rpa.value,rpa.status)+'</strong><strong>'+fmtPct(rua.value,rua.status)+'</strong><em class="'+classes+'">'+esc(result.status||'—')+'</em></summary><div class="kpi-lineage"><div><b>EU</b> '+fmtPct(reu.value,reu.status)+' · '+esc(reu.status||'—')+'</div><div><b>Timeline</b> '+esc(t.events?t.events.length:0)+' event slices · baseline '+esc(t.baseline&&t.baseline.version||'—')+'</div>'+(t.issues&&t.issues.length?'<div class="kpi-issues">'+t.issues.map(i=>esc(i.code)).join(' · ')+'</div>':'<div class="kpi-issues ok">Timeline validated</div>')+'<div class="kpi-event-list">'+(events||'<div class="kpi-event">No event evidence</div>')+'</div></div></details>';
  }).join('')||'<div class="kpi-empty">No equipment records.</div>';

  const issueHost=document.getElementById('kpiExclusions');
  if(issueHost)issueHost.innerHTML=(k.exclusions||[]).length?(k.exclusions||[]).map(x=>'<div class="kpi-exclusion"><b>'+esc(x.equipmentId)+'</b> · '+esc(x.status)+' · '+esc((x.issues||[]).map(i=>i.code).join(', ')||'validation required')+'</div>').join(''):'<div class="kpi-exclusion ok">All equipment eligible for this calculation scope.</div>';
  const finalize=document.getElementById('reportsFinalizeKpi');if(finalize)finalize.disabled=!k||k.status!=='READY';
}

async function calculate(){
  state.date=(document.getElementById('reportsKpiDate')?.value||state.date||latestOperationalDate()).slice(0,10);
  state.kpi=foundation.calculateFleet({date:state.date,baseline:foundation.DEFAULT_BASELINE,equipment:rows('Equipment'),operations:rows('Operations'),maintenance:rows('Maintenance')});
  renderKpi();
  try{state.snapshots=await foundation.listSnapshots('FLEET:ALL',state.date);renderSnapshotHistory();}catch(error){state.snapshots=[];renderSnapshotHistory();msg('KPI calculated; snapshot history unavailable: '+error.message,true);}
}

function renderSnapshotHistory(){
  const host=document.getElementById('kpiSnapshotHistory');if(!host)return;
  const snapshots=state.snapshots||[];
  if(!snapshots.length){host.innerHTML='<div class="kpi-history-empty">No finalized snapshot for this scope/date.</div>';return;}
  const sorted=snapshots.slice().sort((a,b)=>Number(a.revision||0)-Number(b.revision||0));
  const current=sorted[sorted.length-1];
  host.innerHTML=sorted.map(s=>'<div class="kpi-history-row"><span>Revision '+esc(s.revision)+(String(s.snapshot_id||'')===String(current.snapshot_id||'')?' CURRENT':'')+'</span><b>'+fmtPct(s.result&&s.result.PA&&s.result.PA.value)+'</b><b>'+fmtPct(s.result&&s.result.UA&&s.result.UA.value)+'</b><b>'+fmtPct(s.result&&s.result.EU&&s.result.EU.value)+'</b><span>'+esc(s.finalized_at||s.created_at||'')+'</span><span>'+esc(s.status||'FINAL')+'</span></div>').join('');
}

async function finalizeCurrent(){
  if(!state.kpi||state.kpi.status!=='READY'){msg('Finalization blocked: calculation is not READY.',true);return;}
  try{
    const snapshot=foundation.buildSnapshot({calculation:state.kpi,scopeType:'FLEET',scopeId:'FLEET:ALL',periodId:state.date});
    const result=await foundation.finalizeSnapshot(snapshot);
    if(result.status==='COMMITTED')msg('KPI snapshot finalized — Revision '+result.revision+'.');
    else if(result.status==='EXISTING')msg('Identical KPI snapshot already exists — Revision '+result.revision+' remains current.');
    else msg('KPI finalization rejected: '+(result.reason||result.status||'Unknown'),true);
    state.snapshots=await foundation.listSnapshots('FLEET:ALL',state.date);renderSnapshotHistory();
  }catch(error){msg('KPI finalization failed: '+error.message,true);}
}

async function load(){
  state.status='loading';
  try{
    const h=await rc.health();if(h.status!=='READY')throw new Error('Runtime health is not READY');
    const result=await Promise.all(entities.map(entity=>rc.request({operation:'READ',entity})));
    entities.forEach((e,i)=>state.data[e]=Array.isArray(result[i].data)?result[i].data:[]);
    if(!state.date)state.date=latestOperationalDate();
    setDateControl();renderCounts();await calculate();state.status='ready';
    msg('RuntimeAdapter connected — KPI Foundation E2E active. Baseline is PROJECT_DEFAULT, not an official site SOP.');
  }catch(error){state.status='error';renderCounts();const meta=document.getElementById('reportsCount');if(meta)meta.textContent='Unavailable · Runtime Error';msg('Reports/KPI unavailable: '+error.message,true);}
}
function filteredCount(){
  const text=(document.getElementById('reportsSearch')?.value||'').trim().toLowerCase();
  if(!text){renderCounts();return;}
  let n=0;entities.forEach(e=>rows(e).forEach(r=>{if(JSON.stringify(r).toLowerCase().includes(text))n++;}));
  const m=document.getElementById('reportsCount');if(m)m.textContent=n+' matching records · Runtime Ready';
}
function bind(){
  const refresh=document.getElementById('reportsRefresh');if(refresh)refresh.onclick=load;
  const clear=document.getElementById('reportsClear');if(clear)clear.onclick=()=>{document.getElementById('reportsSearch').value='';renderCounts();};
  const search=document.getElementById('reportsSearch');if(search)search.addEventListener('input',filteredCount);
  const date=document.getElementById('reportsKpiDate');if(date)date.addEventListener('change',calculate);
  const historyModal=document.getElementById('reportsHistoryModal');
  const openHistory=document.getElementById('reportsOpenHistory');
  const closeHistory=document.getElementById('reportsCloseHistory');
  const showHistory=()=>{if(historyModal){historyModal.classList.add('open');historyModal.setAttribute('aria-hidden','false');renderSnapshotHistory();}};
  const hideHistory=()=>{if(historyModal){historyModal.classList.remove('open');historyModal.setAttribute('aria-hidden','true');}};
  if(openHistory)openHistory.onclick=showHistory;
  if(closeHistory)closeHistory.onclick=hideHistory;
  if(historyModal)historyModal.onclick=e=>{if(e.target===historyModal)hideHistory();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&historyModal&&historyModal.classList.contains('open'))hideHistory();});
  const finalize=document.getElementById('reportsFinalizeKpi');if(finalize)finalize.onclick=finalizeCurrent;
}
if(global.LithositeDataSync)global.LithositeDataSync.register('Reports',load);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{bind();load();});else{bind();load();}
global.LithositeReports=Object.freeze({refresh:load,calculate});
})(window);
