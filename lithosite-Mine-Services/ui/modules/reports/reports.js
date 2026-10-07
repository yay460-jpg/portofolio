/* V34 Stage 23: operational data display remains read-only; KPI snapshot finalization is an explicit runtime operation. */
(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
const foundation=global.LithositeKPIFoundation;
if(!rc)throw new Error('LithositeRuntimeClient is required before reports.js');
if(!foundation)throw new Error('LithositeKPIFoundation is required before reports.js');

const entities=['Operations','Equipment','WorkFront','Maintenance','Issues','Plans','HSE'];
const TIME_BASELINES=foundation.TIME_BASELINES||Object.freeze([foundation.DEFAULT_BASELINE]);
const EU_DENOMINATOR_OPTIONS=Object.freeze({AVAILABLE:'Available Time',SCHEDULED:'Scheduled Time'});
const EFFECTIVE_RULE_OPTIONS=Object.freeze({PURE_EFFECTIVE:'Pure Effective / Net Operating',STANDARD_CYCLE:'Standard Cycle Operating'});
const DEFAULT_POLICY=Object.freeze({baseline:TIME_BASELINES[0],euDenominator:'AVAILABLE',effectiveTimeRule:'PURE_EFFECTIVE'});
const POLICY_STORAGE_KEY='lithosite.mine-services.v36.kpi-policy';
function clonePolicy(policy){
  const p=policy||DEFAULT_POLICY;
  return Object.freeze({
    baseline:p.baseline||DEFAULT_POLICY.baseline,
    euDenominator:p.euDenominator==='SCHEDULED'?'SCHEDULED':'AVAILABLE',
    effectiveTimeRule:p.effectiveTimeRule==='STANDARD_CYCLE'?'STANDARD_CYCLE':'PURE_EFFECTIVE'
  });
}
function samePolicy(a,b){
  const x=clonePolicy(a),y=clonePolicy(b);
  return x.baseline.baseline_id===y.baseline.baseline_id&&x.euDenominator===y.euDenominator&&x.effectiveTimeRule===y.effectiveTimeRule;
}
function loadStoredPolicy(){
  try{
    if(!global.localStorage)return DEFAULT_POLICY;
    const raw=global.localStorage.getItem(POLICY_STORAGE_KEY);
    if(!raw)return DEFAULT_POLICY;
    const saved=JSON.parse(raw);
    const baseline=TIME_BASELINES.find(item=>item.baseline_id===saved.baselineId)||DEFAULT_POLICY.baseline;
    return clonePolicy({baseline,euDenominator:saved.euDenominator,effectiveTimeRule:saved.effectiveTimeRule});
  }catch(error){return DEFAULT_POLICY;}
}
function persistPolicy(policy){
  try{
    if(!global.localStorage)return;
    const p=clonePolicy(policy);
    global.localStorage.setItem(POLICY_STORAGE_KEY,JSON.stringify({
      version:'1',
      baselineId:p.baseline.baseline_id,
      euDenominator:p.euDenominator,
      effectiveTimeRule:p.effectiveTimeRule
    }));
  }catch(error){}
}
const state={data:{},status:'loading',kpi:null,snapshots:[],date:null,scope:'ALL_DATES',baseline:DEFAULT_POLICY.baseline,policy:loadStoredPolicy()};
state.baseline=state.policy.baseline;
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
function setDateControl(){const el=document.getElementById('reportsKpiDate');if(!el)return;if(!state.date)state.date=latestOperationalDate();el.value=state.date;el.disabled=state.scope!=='DATE';el.hidden=state.scope!=='DATE';const label=document.querySelector('label[for="reportsKpiDate"]');if(label)label.hidden=state.scope!=='DATE';const scopeEl=document.getElementById('reportsKpiScope');if(scopeEl)scopeEl.value=state.scope;const scopeLabel=document.getElementById('reportsKpiScopeLabel');if(scopeLabel){scopeLabel.textContent='Valid data';scopeLabel.hidden=state.scope==='DATE';}}

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
  const baseline=state.baseline||foundation.DEFAULT_BASELINE;
  set('reportsBaseline',baseline.baseline_id+' · '+baseline.shift_start+'–'+baseline.shift_end+' · break '+baseline.breaks.map(b=>b.start+'–'+b.end).join(', '));set('reportsBaselineStatus',baseline.status||'PROJECT_DEFAULT');
  const euContext=document.getElementById('reportsFleetEUContext');if(euContext){const p=state.policy||DEFAULT_POLICY;euContext.textContent='Effective / '+(EU_DENOMINATOR_OPTIONS[p.euDenominator]||p.euDenominator);}

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
    const sourceDates=state.scope==='DATE'
      ? [result.timeline&&result.timeline.lineage&&result.timeline.lineage.date].filter(Boolean)
      : (Array.isArray(result.validatedDates)?result.validatedDates:[]);
    const sourceDateLabel=sourceDates.length===1?sourceDates[0]:(sourceDates.length?sourceDates.join(', '):'—');
    return '<details class="equipment-kpi-detail"><summary><span class="eq-id">'+esc(result.equipmentId)+'</span><span class="eq-date">'+esc(sourceDateLabel)+'</span><span class="eq-unit">'+esc(result.unitNo||'—')+'</span><span>'+fmtHours(rpa.denominatorHours)+'</span><span>'+fmtHours(rpa.numeratorHours)+'</span><span>'+fmtHours(rua.numeratorHours)+'</span><strong>'+fmtPct(rpa.value,rpa.status)+'</strong><strong>'+fmtPct(rua.value,rua.status)+'</strong><em class="'+classes+'">'+esc(result.status||'—')+'</em></summary><div class="kpi-lineage"><div><b>EU</b> '+fmtPct(reu.value,reu.status)+' · '+esc(reu.status||'—')+'</div><div><b>Timeline</b> '+esc(t.events?t.events.length:0)+' event slices · baseline '+esc(t.baseline&&t.baseline.version||'—')+'</div>'+(t.issues&&t.issues.length?'<div class="kpi-issues">'+t.issues.map(i=>esc(i.code)).join(' · ')+'</div>':'<div class="kpi-issues ok">Timeline validated</div>')+'<div class="kpi-event-list">'+(events||'<div class="kpi-event">No event evidence</div>')+'</div></div></details>';
  }).join('')||'<div class="kpi-empty">No equipment records.</div>';

  const issueHost=document.getElementById('kpiExclusions');
  if(issueHost)issueHost.innerHTML=(k.exclusions||[]).length?(k.exclusions||[]).map(x=>'<div class="kpi-exclusion"><b>'+esc(x.equipmentId)+'</b> · '+esc(x.status)+' · '+esc((x.issues||[]).map(i=>i.code).join(', ')||'validation required')+'</div>').join(''):'<div class="kpi-exclusion ok">All equipment eligible for this calculation scope.</div>';
  const finalize=document.getElementById('reportsFinalizeKpi');if(finalize)finalize.disabled=state.scope!=='DATE'||!k||k.status!=='READY';
  const history=document.getElementById('reportsOpenHistory');if(history)history.disabled=state.scope!=='DATE';
  const scopeLabel=document.getElementById('reportsKpiScopeLabel');if(scopeLabel){scopeLabel.textContent='Valid data';scopeLabel.hidden=state.scope==='DATE';}
}

async function calculate(){
  state.scope=document.getElementById('reportsKpiScope')?.value||state.scope||'ALL_DATES';
  if(state.scope==='DATE'){
    state.date=(document.getElementById('reportsKpiDate')?.value||state.date||latestOperationalDate()).slice(0,10);
    state.kpi=foundation.calculateFleet({date:state.date,baseline:state.baseline||foundation.DEFAULT_BASELINE,policy:state.policy||DEFAULT_POLICY,equipment:rows('Equipment'),operations:rows('Operations'),maintenance:rows('Maintenance')});
    try{state.snapshots=await foundation.listSnapshots('FLEET:ALL',state.date);renderSnapshotHistory();}catch(error){state.snapshots=[];renderSnapshotHistory();msg('KPI calculated; snapshot history unavailable: '+error.message,true);}
  }else{
    state.kpi=foundation.calculateFleetAllDates({baseline:state.baseline||foundation.DEFAULT_BASELINE,policy:state.policy||DEFAULT_POLICY,equipment:rows('Equipment'),operations:rows('Operations'),maintenance:rows('Maintenance')});
    state.snapshots=[];
    renderSnapshotHistory();
  }
  setDateControl();
  renderKpi();
}

function renderSnapshotHistory(){
  const host=document.getElementById('kpiSnapshotHistory');if(!host)return;
  const snapshots=state.snapshots||[];
  if(!snapshots.length){host.innerHTML='<div class="kpi-history-empty">No finalized snapshot for this scope/date.</div>';return;}
  const sorted=snapshots.slice().sort((a,b)=>Number(a.revision||0)-Number(b.revision||0));
  const current=sorted[sorted.length-1];
  host.innerHTML=sorted.map(s=>'<div class="kpi-history-row"><span>Revision '+esc(s.revision)+(String(s.snapshot_id||'')===String(current.snapshot_id||'')?' CURRENT':'')+'</span><b>'+fmtPct(s.result&&s.result.PA&&s.result.PA.value)+'</b><b>'+fmtPct(s.result&&s.result.UA&&s.result.UA.value)+'</b><b>'+fmtPct(s.result&&s.result.EU&&s.result.EU.value)+'</b><span>'+esc(s.finalized_at||s.created_at||'')+'</span><span>'+esc(s.status||'FINAL')+'</span></div>').join('');
}

function renderConsolePolicy(){
  const p=state.policy||DEFAULT_POLICY;
  const baselineSelect=document.getElementById('reportsTimeBaseline');
  const euSelect=document.getElementById('reportsEUDenominator');
  const effectiveSelect=document.getElementById('reportsEffectiveTimeRule');
  const stateHost=document.getElementById('reportsTimeBaselineState');
  const active=document.getElementById('reportsActivePolicy');
  if(baselineSelect)baselineSelect.value=p.baseline.baseline_id;
  if(euSelect)euSelect.value=p.euDenominator;
  if(effectiveSelect)effectiveSelect.value=p.effectiveTimeRule;
  if(stateHost)stateHost.textContent=p.baseline.status||'PROJECT_DEFAULT';
  if(active)active.textContent=p.baseline.baseline_id+' · '+p.baseline.shift_start+'–'+p.baseline.shift_end+' · EU '+(EU_DENOMINATOR_OPTIONS[p.euDenominator]||p.euDenominator)+' · '+(EFFECTIVE_RULE_OPTIONS[p.effectiveTimeRule]||p.effectiveTimeRule);
}

async function finalizeCurrent(){
  if(state.scope!=='DATE'){msg('Finalization is available only for a specific KPI date.',true);return;}
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
    state.policy=loadStoredPolicy();
    state.baseline=state.policy.baseline;
    const h=await rc.health();if(h.status!=='READY')throw new Error('Runtime health is not READY');
    const result=await Promise.all(entities.map(entity=>rc.request({operation:'READ',entity})));
    entities.forEach((e,i)=>state.data[e]=Array.isArray(result[i].data)?result[i].data:[]);
    if(!state.date)state.date=latestOperationalDate();
    state.scope=document.getElementById('reportsKpiScope')?.value||'ALL_DATES';
    setDateControl();renderCounts();await calculate();state.status='ready';
    msg('RuntimeAdapter connected — KPI Foundation E2E active. Policy Set is project-configurable and is not an official site SOP.');
  }catch(error){state.status='error';renderCounts();const meta=document.getElementById('reportsCount');if(meta)meta.textContent='Unavailable · Runtime Error';msg('Reports/KPI unavailable: '+error.message,true);}
}
function filteredCount(){
  const text=(document.getElementById('reportsSearch')?.value||'').trim().toLowerCase();
  if(!text){renderCounts();return;}
  let n=0;entities.forEach(e=>rows(e).forEach(r=>{if(JSON.stringify(r).toLowerCase().includes(text))n++;}));
  const m=document.getElementById('reportsCount');if(m)m.textContent=n+' matching records · Runtime Ready';
}
function reportPeriod(type,endDate){
  const end=new Date(String(endDate||latestOperationalDate()).slice(0,10)+'T00:00:00');
  if(Number.isNaN(end.getTime()))return null;
  const start=new Date(end);
  if(type==='WEEKLY'){const day=(end.getDay()+6)%7;start.setDate(end.getDate()-day);}
  else if(type==='MONTHLY'){start.setDate(1);}
  return {start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10)};
}
function reportRecordDate(row){
  const keys=['transaction_date','event_date','activity_date','work_date','plan_date','maintenance_date','inspection_date','record_date','date','created_at','updated_at'];
  for(const key of keys){
    const value=String(row?.[key]??'').slice(0,10);
    if(/^\\d{4}-\\d{2}-\\d{2}$/.test(value))return value;
  }
  return '';
}
function reportRecordLabel(row){
  const keys=['activity','activity_name','task','task_name','description','work_description','issue','issue_type','equipment_id','equipmentId','unit_no','unitNo','id','record_id','code','name'];
  for(const key of keys){const value=String(row?.[key]??'').trim();if(value)return value;}
  return 'Source record';
}
function reportRecordStatus(row){
  const keys=['status','state','condition','priority','severity'];
  for(const key of keys){const value=String(row?.[key]??'').trim();if(value)return value;}
  return '—';
}
function reportRowsForEntity(entity,period){
  const source=rows(entity);
  if(!source.length)return [];
  return source.filter(row=>{
    const d=reportRecordDate(row);
    return !d || (d>=period.start&&d<=period.end);
  });
}
function reportValue(row,keys,fallback='—'){
  for(const key of keys){
    const value=row?.[key];
    if(value!==undefined&&value!==null&&String(value).trim()!=='')return String(value).trim();
  }
  return fallback;
}
function reportDetailRows(entity,records){
  const configs={
    Operations:{
      columns:[['Date',r=>reportRecordDate(r)||'Undated'],['Activity',r=>reportValue(r,['activity','activity_name','task','task_name','description','work_description'])],['Equipment',r=>reportValue(r,['equipment_id','equipmentId','unit_no','unitNo'])],['Work Front',r=>reportValue(r,['work_front','workfront','work_front_name','workfront_name'])],['Status',r=>reportRecordStatus(r)]]
    },
    Equipment:{
      columns:[['Date',r=>reportRecordDate(r)||'Undated'],['Equipment',r=>reportValue(r,['equipment_id','equipmentId','id','record_id'])],['Unit',r=>reportValue(r,['unit_no','unitNo','unit','equipment_unit'])],['Status',r=>reportRecordStatus(r)],['Condition',r=>reportValue(r,['condition','equipment_condition','availability_status'])]]
    },
    WorkFront:{
      columns:[['Date',r=>reportRecordDate(r)||'Undated'],['Work Front',r=>reportValue(r,['work_front','workfront','name','work_front_name','workfront_name'])],['Activity',r=>reportValue(r,['activity','activity_name','task','task_name','description'])],['Status',r=>reportRecordStatus(r)],['Progress',r=>reportValue(r,['progress','progress_pct','completion','completion_pct'])]
    },
    Maintenance:{
      columns:[['Date',r=>reportRecordDate(r)||'Undated'],['Equipment',r=>reportValue(r,['equipment_id','equipmentId','unit_no','unitNo'])],['Maintenance',r=>reportValue(r,['maintenance_type','type','activity','description','work_description'])],['Duration',r=>reportValue(r,['duration','duration_hours','downtime_hours','hours'])],['Status',r=>reportRecordStatus(r)]]
    },
    Issues:{
      columns:[['Date',r=>reportRecordDate(r)||'Undated'],['Issue',r=>reportValue(r,['issue','issue_type','title','description','problem'])],['Severity',r=>reportValue(r,['severity','priority'])],['Status',r=>reportRecordStatus(r)],['Owner',r=>reportValue(r,['owner','assigned_to','responsible','pic'])]
    },
    Plans:{
      columns:[['Date',r=>reportRecordDate(r)||'Undated'],['Plan',r=>reportValue(r,['plan','plan_name','activity','activity_name','task','description'])],['Target',r=>reportValue(r,['target','target_value','planned_qty','quantity'])],['Status',r=>reportRecordStatus(r)],['Owner',r=>reportValue(r,['owner','assigned_to','responsible','pic'])]
    },
    HSE:{
      columns:[['Date',r=>reportRecordDate(r)||'Undated'],['Event',r=>reportValue(r,['event','event_type','incident','incident_type','activity','description'])],['Severity',r=>reportValue(r,['severity','risk_level','priority'])],['Status',r=>reportRecordStatus(r)],['Action',r=>reportValue(r,['action','corrective_action','recommendation'])]
    }
  };
  const config=configs[entity]||configs.Operations;
  return {columns:config.columns.map(x=>x[0]),rows:records.slice(0,80).map(row=>config.columns.map(x=>x[1](row)))};
}
function reportDailyTrend(records){
  const counts={};
  records.forEach(row=>{const d=reportRecordDate(row)||'Undated';counts[d]=(counts[d]||0)+1;});
  return Object.entries(counts).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,count])=>({date,count}));
}
function reportKpiTrend(model){
  const dates=[...new Set((model.kpi?.equipment||[]).flatMap(r=>r.validatedDates||[]))].sort();
  return dates.map(date=>{
    const items=(model.kpi?.equipment||[]).filter(r=>(r.validatedDates||[]).includes(date));
    const avg=(key)=>{const v=items.map(r=>Number(r.results?.[key]?.value)).filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
    return {date,PA:avg('PA'),UA:avg('UA'),EU:avg('EU')};
  });
}
function reportTableRows(records){
  return records.slice(0,80).map(row=>({
    date:reportRecordDate(row)||'Undated',
    label:reportRecordLabel(row),
    status:reportRecordStatus(row)
  }));
}
function buildReportModel(){
  const type=document.getElementById('reportCenterType')?.value||'DAILY';
  const requestedEnd=document.getElementById('reportCenterDate')?.value||latestOperationalDate();
  const requestedPeriod=reportPeriod(type,requestedEnd);
  if(!requestedPeriod)return null;
  const datedValues=entities.flatMap(entity=>rows(entity).map(reportRecordDate).filter(Boolean)).sort();
  const latestAvailable=datedValues[datedValues.length-1]||requestedEnd;
  const requestedRows=entities.reduce((n,e)=>n+reportRowsForEntity(e,requestedPeriod).length,0);
  const effectiveEnd=requestedRows>0?requestedPeriod.end:latestAvailable;
  const effectivePeriod=type==='DAILY'?{start:effectiveEnd,end:effectiveEnd}:reportPeriod(type,effectiveEnd);
  const scoped=Object.fromEntries(entities.map(entity=>[entity,reportRowsForEntity(entity,effectivePeriod)]));
  const totalRecords=Object.values(scoped).reduce((n,list)=>n+list.length,0);
  const k=state.kpi;
  const kpi={
    status:k?.status||'UNAVAILABLE',
    PA:k?.results?.PA?.value??null,
    UA:k?.results?.UA?.value??null,
    EU:k?.results?.EU?.value??null,
    eligible:k?.population?.eligible??0,
    excluded:k?.population?.excluded??0,
    equipment:Array.isArray(k?.equipment)?k.equipment:[]
  };
  const sourceTables=Object.fromEntries(entities.map(entity=>[entity,reportTableRows(scoped[entity])]));
  const detailTables=Object.fromEntries(entities.map(entity=>[entity,reportDetailRows(entity,scoped[entity])]));
  const activityTrend=reportDailyTrend(scoped.Operations);
  const maintenanceTrend=reportDailyTrend(scoped.Maintenance);
  const issueTrend=reportDailyTrend(scoped.Issues);
  const kpiTrend=reportKpiTrend({kpi});
  const sections=type==='DAILY'
    ? ['Executive Summary','Work / Task Completed','Equipment Status','Work Front Status','HSE Events','Maintenance / Downtime','Material Movement','Issues and Abnormalities','Site Map / Spatial Activities','KPI Summary','Outstanding / Carry-over Tasks','Supporting Evidence']
    : type==='WEEKLY'
    ? ['Executive Summary','Planned vs Actual','Equipment Performance','Work Front Progress','HSE Summary','Maintenance and Downtime Analysis','Material Movement Summary','Issues and Recurring Issues','Outstanding Actions','KPI Trend','Key Highlights','Top Management Concerns','Recommended Actions']
    : ['Management Executive Summary','Monthly KPI','Target vs Actual','Equipment Performance','Work Front Progress','HSE Performance','Maintenance / Downtime','Material Movement','Major Issues / Events','Recurring Problems','Outstanding Actions','Trend vs Previous Month','Performance Highlights','Management Attention / Decision Required','Recommendations','Appendix / Evidence'];
  const sectionData={
    'Executive Summary':'Source records: '+totalRecords+'. KPI state: '+kpi.status+'. Effective data period: '+effectivePeriod.start+(effectivePeriod.start!==effectivePeriod.end?' → '+effectivePeriod.end:'')+'.',
    'Management Executive Summary':'Source records: '+totalRecords+'. KPI state: '+kpi.status+'. Effective data period: '+effectivePeriod.start+(effectivePeriod.start!==effectivePeriod.end?' → '+effectivePeriod.end:'')+'.',
    'Work / Task Completed':'Operations '+scoped.Operations.length+' records.',
    'Planned vs Actual':'Plans '+scoped.Plans.length+' records; Operations '+scoped.Operations.length+' actual records.',
    'Equipment Status':'Equipment '+scoped.Equipment.length+' records; KPI eligible '+kpi.eligible+', excluded '+kpi.excluded+'.',
    'Equipment Performance':'Equipment '+scoped.Equipment.length+' source records. KPI fleet status: '+kpi.status+'.',
    'Work Front Status':'WorkFront '+scoped.WorkFront.length+' records.',
    'Work Front Progress':'WorkFront '+scoped.WorkFront.length+' records.',
    'HSE Events':'HSE '+scoped.HSE.length+' records.',
    'HSE Summary':'HSE '+scoped.HSE.length+' records.',
    'HSE Performance':'HSE '+scoped.HSE.length+' records.',
    'Maintenance / Downtime':'Maintenance '+scoped.Maintenance.length+' records.',
    'Maintenance and Downtime Analysis':'Maintenance '+scoped.Maintenance.length+' records.',
    'Material Movement':'Operations '+scoped.Operations.length+' source records used as material/operational movement evidence.',
    'Material Movement Summary':'Operations '+scoped.Operations.length+' source records used as material/operational movement evidence.',
    'Issues and Abnormalities':'Issues '+scoped.Issues.length+' records.',
    'Issues and Recurring Issues':'Issues '+scoped.Issues.length+' records.',
    'Major Issues / Events':'Issues '+scoped.Issues.length+' records.',
    'Outstanding Actions':'Issues '+scoped.Issues.length+' + Plans '+scoped.Plans.length+' source records.',
    'Outstanding / Carry-over Tasks':'Issues '+scoped.Issues.length+' + Plans '+scoped.Plans.length+' source records.',
    'KPI Summary':'PA '+fmtPct(kpi.PA)+' · UA '+fmtPct(kpi.UA)+' · EU '+fmtPct(kpi.EU)+' · validation '+kpi.status+'.',
    'Monthly KPI':'PA '+fmtPct(kpi.PA)+' · UA '+fmtPct(kpi.UA)+' · EU '+fmtPct(kpi.EU)+' · validation '+kpi.status+'.',
    'KPI Trend':'Current KPI snapshot: PA '+fmtPct(kpi.PA)+' · UA '+fmtPct(kpi.UA)+' · EU '+fmtPct(kpi.EU)+'.',
    'Key Highlights':'Operations '+scoped.Operations.length+' · Equipment '+scoped.Equipment.length+' · WorkFront '+scoped.WorkFront.length+' · Maintenance '+scoped.Maintenance.length+' · HSE '+scoped.HSE.length+'.',
    'Performance Highlights':'Operations '+scoped.Operations.length+' · Equipment '+scoped.Equipment.length+' · WorkFront '+scoped.WorkFront.length+' · Maintenance '+scoped.Maintenance.length+' · HSE '+scoped.HSE.length+'.',
    'Top Management Concerns':kpi.status==='READY'?'No KPI validation gate is blocking the report.':'KPI validation state is '+kpi.status+'; management should review validation evidence before issuing the report.',
    'Management Attention / Decision Required':kpi.status==='READY'?'No KPI validation decision is currently required.':'Resolve KPI validation before issuing the management report.',
    'Recommended Actions':'Review source evidence, confirm KPI validation, then issue the report snapshot.',
    'Recommendations':'Review source evidence, confirm KPI validation, then issue the report snapshot.',
    'Target vs Actual':'Target values are not yet configured in the current report source model; actual source records are included below.',
    'Trend vs Previous Month':'Historical comparison is not yet populated in the current report snapshot.',
    'Recurring Problems':'Recurring classification is not yet populated; source issue records are retained as evidence.',
    'Site Map / Spatial Activities':'Spatial evidence is referenced from the current operational source set; map embedding is pending.',
    'Supporting Evidence':'Source tables below retain report-period evidence from the RuntimeAdapter.',
    'Appendix / Evidence':'Source tables below retain report-period evidence from the RuntimeAdapter.'
  };
  return {
    report_period_requested:requestedPeriod,report_period_effective:effectivePeriod,
    report_data_status:requestedRows>0?'REQUESTED_PERIOD':'LATEST_AVAILABLE_DATA',
    report_id:'DRAFT-'+type+'-'+requestedPeriod.start+'-'+requestedPeriod.end,
    report_type:type,period:requestedPeriod,scope:'ALL',status:'DRAFT',generated_at:new Date().toISOString(),
    source_counts:Object.fromEntries(entities.map(e=>[e,scoped[e].length])),
    total_records:totalRecords,kpi,sections,section_data:sectionData,source_tables:sourceTables,
    detail_tables:detailTables,activity_trend:activityTrend,maintenance_trend:maintenanceTrend,issue_trend:issueTrend,kpi_trend:kpiTrend
  };
}
function renderReportCenterSummary(model){
  const host=document.getElementById('reportCenterSummary'),status=document.getElementById('reportCenterStatus');
  if(!host||!model)return;
  const p=model.period;
  host.innerHTML='<b>'+esc(model.report_type)+' REPORT</b> · '+esc(p.start)+(p.start!==p.end?' → '+esc(p.end):'')+' · '+model.total_records+' source records · KPI '+esc(model.kpi?.status||'UNAVAILABLE');
  if(status)status.textContent='Draft prepared';
}
function reportBar(value,max){
  const n=Number(value);
  if(!Number.isFinite(n)||!Number.isFinite(max)||max<=0)return '<span class="report-bar"><i style="width:0%"></i></span>';
  const pct=Math.max(0,Math.min(100,(n/max)*100));
  return '<span class="report-bar"><i style="width:'+pct.toFixed(1)+'%"></i></span>';
}
function reportKpiEquipment(model){
  return (model.kpi?.equipment||[]).slice(0,20).map(result=>{
    const pa=result.results?.PA||{},ua=result.results?.UA||{},eu=result.results?.EU||{};
    return {
      id:String(result.equipmentId||'—'),
      unit:String(result.unitNo||'—'),
      date:(result.validatedDates||[]).join(', ')||result.timeline?.lineage?.date||'—',
      scheduled:pa.denominatorHours,
      available:pa.numeratorHours,
      used:ua.numeratorHours,
      pa:pa.value,
      ua:ua.value,
      eu:eu.value,
      status:String(result.status||'—')
    };
  });
}
function reportPreviewTable(table,empty='No source records in this period.'){
  if(!table||!table.rows?.length)return '<div class="report-preview-copy">'+esc(empty)+'</div>';
  return '<div class="report-table-wrap"><table class="report-preview-table"><thead><tr>'+table.columns.map(col=>'<th>'+esc(col)+'</th>').join('')+'</tr></thead><tbody>'+table.rows.map(row=>'<tr>'+row.map(value=>'<td>'+esc(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
function reportPreviewTrend(rows,fields){
  if(!rows?.length)return '<div class="report-preview-copy">No dated trend records are available for this period.</div>';
  return '<div class="report-table-wrap"><table class="report-preview-table compact"><thead><tr><th>Date</th>'+fields.map(f=>'<th>'+esc(f.label)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr><td>'+esc(row.date)+'</td>'+fields.map(f=>'<td>'+esc(f.format?f.format(row[f.key]):row[f.key]??0)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
function renderReportPreview(model){
  const host=document.getElementById('reportPreviewBody'),meta=document.getElementById('reportPreviewMeta');
  if(!host||!model)return;
  if(meta)meta.textContent=model.report_type+' · '+model.period.start+(model.period.start!==model.period.end?' → '+model.period.end:'')+' · DRAFT';
  const k=model.kpi||{},eq=reportKpiEquipment(model);
  const narrative=(title,text)=>'<section class="report-preview-block"><div class="report-preview-block-head"><b>'+esc(title)+'</b></div><div class="report-preview-copy">'+esc(text||'No evidence summary available.')+'</div></section>';
  const detail=(title,entity,subtitle)=>'<section class="report-preview-block"><div class="report-preview-block-head"><b>'+esc(title)+'</b><span>'+esc(subtitle||((model.source_counts?.[entity]||0)+' records'))+'</span></div>'+reportPreviewTable(model.detail_tables?.[entity])+'</section>';
  const fleet='<section class="report-preview-block"><div class="report-preview-block-head"><b>Fleet KPI</b><span>'+esc(k.status||'UNAVAILABLE')+'</span></div><div class="report-kpi-bars">'+['PA','UA','EU'].map(name=>'<div><label>'+name+' <b>'+fmtPct(k[name])+'</b></label>'+reportBar(Number(k[name]),100)+'</div>').join('')+'</div></section>';
  const planActual='<section class="report-preview-block"><div class="report-preview-block-head"><b>Planned vs Actual</b><span>Plans '+(model.source_counts.Plans||0)+' · Operations '+(model.source_counts.Operations||0)+'</span></div>'+reportPreviewTable(model.detail_tables?.Plans)+'<div class="report-preview-copy">Actual operational activity is represented by the Operations evidence below.</div>'+reportPreviewTrend(model.activity_trend,[{key:'count',label:'Operations'}])+'</section>';
  const kpiTrend='<section class="report-preview-block"><div class="report-preview-block-head"><b>KPI Trend</b><span>Equipment evidence by validated date</span></div>'+reportPreviewTrend(model.kpi_trend,[{key:'PA',label:'PA',format:fmtPct},{key:'UA',label:'UA',format:fmtPct},{key:'EU',label:'EU',format:fmtPct}])+'</section>';
  const management= k.status!=='READY'
    ? narrative(model.report_type==='MONTHLY'?'Management Attention / Decision Required':'Top Management Concerns','KPI validation is '+(k.status||'UNAVAILABLE')+'. Resolve validation evidence before issuing this management report.')
    : narrative(model.report_type==='MONTHLY'?'Management Attention / Decision Required':'Top Management Concerns','KPI validation is READY. Review operational evidence, recurring issues and actions before issue.');
  const commonHead='<div class="report-preview-kpis"><div><small>Records</small><b>'+model.total_records+'</b></div><div><small>PA</small><b>'+fmtPct(k.PA)+'</b></div><div><small>UA</small><b>'+fmtPct(k.UA)+'</b></div><div><small>EU</small><b>'+fmtPct(k.EU)+'</b></div></div><div class="report-preview-period"><b>Effective data period</b> '+esc(model.report_period_effective.start)+(model.report_period_effective.start!==model.report_period_effective.end?' → '+esc(model.report_period_effective.end):'')+' · '+esc(model.report_data_status)+'</div>';
  let body='';
  if(model.report_type==='DAILY'){
    body=commonHead+
      narrative('Executive Summary','Operational source records: '+model.total_records+'. KPI state: '+(k.status||'UNAVAILABLE')+'. Daily report focuses on what happened and what remains outstanding.')+
      fleet+detail('Work / Task Completed','Operations','Operational activity evidence')+
      detail('Equipment Status','Equipment')+
      detail('Work Front Status','WorkFront')+
      detail('HSE Events','HSE')+
      detail('Maintenance / Downtime','Maintenance')+
      detail('Issues and Abnormalities','Issues')+
      detail('Planned Work','Plans')+
      management+
      '<section class="report-preview-block"><div class="report-preview-block-head"><b>Source Evidence</b><span>Traceable RuntimeAdapter records</span></div>'+reportPreviewTable(model.detail_tables?.Operations)+'</section>';
  }else if(model.report_type==='WEEKLY'){
    body=commonHead+
      narrative('Executive Summary','Weekly management view: performance, completed activity, equipment condition, recurring issues and actions for the selected period.')+
      fleet+planActual+
      detail('Equipment Performance','Equipment')+
      detail('Work Front Progress','WorkFront')+
      detail('HSE Summary','HSE')+
      detail('Maintenance and Downtime Analysis','Maintenance')+
      detail('Issues and Recurring Issues','Issues')+
      kpiTrend+
      narrative('Key Highlights','Operations '+(model.source_counts.Operations||0)+' · Equipment '+(model.source_counts.Equipment||0)+' · WorkFront '+(model.source_counts.WorkFront||0)+' · Maintenance '+(model.source_counts.Maintenance||0)+' · HSE '+(model.source_counts.HSE||0)+'.')+
      management+
      narrative('Recommended Actions','Review outstanding Plans and Issues, confirm KPI validation, then issue the report snapshot.');
  }else{
    body=commonHead+
      narrative('Management Executive Summary','Monthly management view: performance against available evidence, equipment/work-front status, HSE, maintenance, recurring problems and decisions required.')+
      fleet+
      planActual+
      detail('Equipment Performance','Equipment')+
      detail('Work Front Progress','WorkFront')+
      detail('HSE Performance','HSE')+
      detail('Maintenance / Downtime','Maintenance')+
      detail('Major Issues / Events','Issues')+
      kpiTrend+
      narrative('Trend vs Previous Month','The current snapshot contains period evidence. A previous-month comparison will only be shown when an equivalent historical KPI snapshot is available; no synthetic comparison is created.')+
      management+
      narrative('Recommendations','Resolve validation gates, review recurring Issues and Plans, and approve the report only after source evidence is confirmed.');
  }
  host.innerHTML=body+'<div class="report-preview-note">Preview is read-only. Generate PDF uses this same Report Snapshot. No value is invented when source fields are unavailable.</div>';
}
function generatePdf(model){
  if(!model)return;
  const win=window.open('','_blank');
  if(!win){msg('PDF window was blocked by the browser.',true);return;}
  const title=model.report_type+' Report · '+model.period.start+(model.period.start!==model.period.end?' → '+model.period.end:'');
  const k=model.kpi||{};
  const tableHtml=table=>{
    if(!table?.rows?.length)return '<p>No source records in this period.</p>';
    return '<table><thead><tr>'+table.columns.map(col=>'<th>'+esc(col)+'</th>').join('')+'</tr></thead><tbody>'+table.rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  };
  const trendHtml=(rows,fields)=>{
    if(!rows?.length)return '<p>No dated trend records are available.</p>';
    return '<table><thead><tr><th>Date</th>'+fields.map(f=>'<th>'+esc(f.label)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.date)+'</td>'+fields.map(f=>'<td>'+esc(f.format?f.format(r[f.key]):r[f.key]??0)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  };
  const section=(heading,content)=>'<section><h2>'+esc(heading)+'</h2>'+content+'</section>';
  const detail=(heading,entity)=>section(heading,tableHtml(model.detail_tables?.[entity]));
  let content=section('Executive Summary','<p>Source records: '+model.total_records+'. KPI validation state: '+esc(k.status||'UNAVAILABLE')+'. Effective data period: '+esc(model.report_period_effective.start)+(model.report_period_effective.start!==model.report_period_effective.end?' → '+esc(model.report_period_effective.end):'')+'.</p>');
  content+='<section><h2>Fleet KPI</h2><div class="kpis"><div class="kpi"><small>PA</small><b>'+fmtPct(k.PA)+'</b></div><div class="kpi"><small>UA</small><b>'+fmtPct(k.UA)+'</b></div><div class="kpi"><small>EU</small><b>'+fmtPct(k.EU)+'</b></div><div class="kpi"><small>Validation</small><b>'+esc(k.status||'UNAVAILABLE')+'</b></div></div></section>';
  if(model.report_type==='DAILY'){
    content+=detail('Work / Task Completed','Operations')+detail('Equipment Status','Equipment')+detail('Work Front Status','WorkFront')+detail('HSE Events','HSE')+detail('Maintenance / Downtime','Maintenance')+detail('Issues and Abnormalities','Issues')+detail('Planned Work','Plans');
  }else if(model.report_type==='WEEKLY'){
    content+=section('Planned vs Actual',tableHtml(model.detail_tables?.Plans)+trendHtml(model.activity_trend,[{key:'count',label:'Operations'}]));
    content+=detail('Equipment Performance','Equipment')+detail('Work Front Progress','WorkFront')+detail('HSE Summary','HSE')+detail('Maintenance and Downtime Analysis','Maintenance')+detail('Issues and Recurring Issues','Issues');
    content+=section('KPI Trend',trendHtml(model.kpi_trend,[{key:'PA',label:'PA',format:fmtPct},{key:'UA',label:'UA',format:fmtPct},{key:'EU',label:'EU',format:fmtPct}]));
    content+=section('Recommended Actions','<p>Review outstanding Plans and Issues, confirm KPI validation, then issue the report snapshot.</p>');
  }else{
    content+=section('Planned vs Actual',tableHtml(model.detail_tables?.Plans)+trendHtml(model.activity_trend,[{key:'count',label:'Operations'}]));
    content+=detail('Equipment Performance','Equipment')+detail('Work Front Progress','WorkFront')+detail('HSE Performance','HSE')+detail('Maintenance / Downtime','Maintenance')+detail('Major Issues / Events','Issues');
    content+=section('KPI Trend',trendHtml(model.kpi_trend,[{key:'PA',label:'PA',format:fmtPct},{key:'UA',label:'UA',format:fmtPct},{key:'EU',label:'EU',format:fmtPct}]));
    content+=section('Management Attention / Decision Required','<p>'+(k.status==='READY'?'KPI validation is READY. Review evidence and approve issue.':'KPI validation is '+esc(k.status||'UNAVAILABLE')+'. Resolve validation before issuing the management report.')+'</p>');
    content+=section('Recommendations','<p>Resolve validation gates, review recurring Issues and Plans, and approve the report only after source evidence is confirmed.</p>');
  }
  const sourceRows=entities.map(e=>'<tr><td>'+esc(e)+'</td><td>'+model.source_counts[e]+'</td></tr>').join('');
  content+=section('Operational Source Summary','<table><thead><tr><th>Domain</th><th>Records</th></tr></thead><tbody>'+sourceRows+'</tbody></table>');
  win.document.open();
  win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{font-family:Arial,sans-serif;color:#172333;margin:28px;font-size:9px}h1{font-size:22px;margin:0 0 4px}h2{font-size:13px;margin:18px 0 6px;border-bottom:1px solid #cbd5e1;padding-bottom:4px}p{line-height:1.45;color:#475569}.meta{color:#64748b;margin-bottom:16px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.kpi{border:1px solid #cbd5e1;padding:8px;border-radius:5px}.kpi small{display:block;color:#64748b;text-transform:uppercase}.kpi b{font-size:15px}table{width:100%;border-collapse:collapse;margin:7px 0 14px}th,td{text-align:left;padding:5px;border-bottom:1px solid #e2e8f0}th{font-size:7px;text-transform:uppercase;color:#64748b}td{font-size:8px}section{break-inside:avoid}.footer{margin-top:22px;color:#64748b;font-size:8px}</style></head><body><h1>Reports &amp; KPI</h1><div class="meta">'+esc(title)+' · DRAFT · Report ID '+esc(model.report_id||'DRAFT')+' · Effective '+esc(model.report_period_effective.start)+(model.report_period_effective.start!==model.report_period_effective.end?' → '+esc(model.report_period_effective.end):'')+'</div>'+content+'<div class="footer">Generated from the same Report Snapshot used by Preview.</div><script>window.onload=function(){setTimeout(function(){window.print()},150)}</script></body></html>');
  win.document.close();
}
function bind(){
  const reportType=document.getElementById('reportCenterType');
  const reportDate=document.getElementById('reportCenterDate');
  const reportPrepare=document.getElementById('reportCenterPrepare');
  const reportPreview=document.getElementById('reportCenterPreview');
  const reportPdf=document.getElementById('reportCenterPdf');
  const previewModal=document.getElementById('reportPreviewModal');
  const previewClose=document.getElementById('reportPreviewClose');
  let reportDraft=null;
  const latest=latestOperationalDate();
  if(reportDate)reportDate.value=latest;
  const prepareReport=()=>{
    reportDraft=buildReportModel();
    renderReportCenterSummary(reportDraft);
    if(reportPreview)reportPreview.disabled=!reportDraft;
    if(reportPdf)reportPdf.disabled=!reportDraft;
  };
  const showReportPreview=()=>{
    if(!reportDraft||!previewModal)return;
    renderReportPreview(reportDraft);
    if(global.LithositeModalShowContract)global.LithositeModalShowContract.show('reportPreviewModal');
    else{previewModal.classList.add('open');previewModal.setAttribute('aria-hidden','false');}
  };
  const hideReportPreview=()=>{
    if(!previewModal)return;
    if(global.LithositeModalShowContract)global.LithositeModalShowContract.close('reportPreviewModal');
    else{previewModal.classList.remove('open');previewModal.setAttribute('aria-hidden','true');}
  };
  if(reportType)reportType.onchange=()=>{prepareReport();};
  if(reportDate)reportDate.onchange=()=>{prepareReport();};
  if(reportPrepare)reportPrepare.onclick=prepareReport;
  if(reportPreview)reportPreview.onclick=showReportPreview;
  if(reportPdf)reportPdf.onclick=()=>generatePdf(reportDraft);
  if(previewClose)previewClose.onclick=hideReportPreview;
  if(previewModal)previewModal.onclick=e=>{if(e.target===previewModal)hideReportPreview();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&previewModal&&previewModal.classList.contains('open'))hideReportPreview();});

  const refresh=document.getElementById('reportsRefresh');if(refresh)refresh.onclick=load;
  const clear=document.getElementById('reportsClear');if(clear)clear.onclick=()=>{document.getElementById('reportsSearch').value='';renderCounts();};
  const search=document.getElementById('reportsSearch');if(search)search.addEventListener('input',filteredCount);
  const scope=document.getElementById('reportsKpiScope');if(scope)scope.addEventListener('change',()=>{state.scope=scope.value==='DATE'?'DATE':'ALL_DATES';setDateControl();calculate();});
  const date=document.getElementById('reportsKpiDate');if(date)date.addEventListener('change',calculate);
  const equipmentScroll=document.querySelector('#reportsScreen .equipment-kpi-scroll');
  if(equipmentScroll){
    equipmentScroll.addEventListener('wheel',e=>{
      if(equipmentScroll.scrollHeight<=equipmentScroll.clientHeight)return;
      equipmentScroll.scrollTop+=e.deltaY;
      e.preventDefault();
    },{passive:false});
  }
  const consoleModal=document.getElementById('reportsConsoleModal');
  const openConsole=document.getElementById('reportsConsole');
  const closeConsole=document.getElementById('reportsCloseConsole');
  const cancelConsole=document.getElementById('reportsCancelConsole');
  const resetConsole=document.getElementById('reportsResetConsole');
  const applyConsoleButton=document.getElementById('reportsApplyConsole');
  const baselineSelect=document.getElementById('reportsTimeBaseline');
  const euDenominatorSelect=document.getElementById('reportsEUDenominator');
  const effectiveRuleSelect=document.getElementById('reportsEffectiveTimeRule');

  const showConsole=()=>{
    if(!consoleModal)return;
    renderConsolePolicy();
    if(global.LithositeModalShowContract){
      global.LithositeModalShowContract.show('reportsConsoleModal');
    }else{
      consoleModal.classList.add('open');
      consoleModal.setAttribute('aria-hidden','false');
    }
  };
  const hideConsole=()=>{
    if(!consoleModal)return;
    if(global.LithositeModalShowContract){
      global.LithositeModalShowContract.close('reportsConsoleModal');
    }else{
      consoleModal.classList.remove('open');
      consoleModal.setAttribute('aria-hidden','true');
    }
  };
  const applyConsole=async()=>{
    const baselineId=baselineSelect?.value||DEFAULT_POLICY.baseline.baseline_id;
    const euDenominator=euDenominatorSelect?.value||DEFAULT_POLICY.euDenominator;
    const effectiveTimeRule=effectiveRuleSelect?.value||DEFAULT_POLICY.effectiveTimeRule;
    const baseline=TIME_BASELINES.find(item=>item.baseline_id===baselineId)||DEFAULT_POLICY.baseline;
    state.policy=Object.freeze({
      baseline,
      euDenominator:euDenominator==='SCHEDULED'?'SCHEDULED':'AVAILABLE',
      effectiveTimeRule:effectiveTimeRule==='STANDARD_CYCLE'?'STANDARD_CYCLE':'PURE_EFFECTIVE'
    });
    state.baseline=state.policy.baseline;
    persistPolicy(state.policy);
    hideConsole();
    await calculate();
    renderKpi();
  };
  const resetConsolePolicy=()=>{
    const changedFromDefault=!samePolicy(state.policy,DEFAULT_POLICY)||
      baselineSelect?.value!==DEFAULT_POLICY.baseline.baseline_id||
      euDenominatorSelect?.value!==DEFAULT_POLICY.euDenominator||
      effectiveRuleSelect?.value!==DEFAULT_POLICY.effectiveTimeRule;
    if(changedFromDefault&&!global.confirm('Reset Policy Set to the project default? The current selection will be replaced. No runtime policy changes occur until Apply Policy Set.'))return;
    if(baselineSelect)baselineSelect.value=DEFAULT_POLICY.baseline.baseline_id;
    if(euDenominatorSelect)euDenominatorSelect.value=DEFAULT_POLICY.euDenominator;
    if(effectiveRuleSelect)effectiveRuleSelect.value=DEFAULT_POLICY.effectiveTimeRule;
    syncConsolePreview();
  };
  const syncConsolePreview=()=>{
    const p={baseline:TIME_BASELINES.find(item=>item.baseline_id===baselineSelect?.value)||DEFAULT_POLICY.baseline,euDenominator:euDenominatorSelect?.value||DEFAULT_POLICY.euDenominator,effectiveTimeRule:effectiveRuleSelect?.value||DEFAULT_POLICY.effectiveTimeRule};
    const stateEl=document.getElementById('reportsTimeBaselineState');
    const active=document.getElementById('reportsActivePolicy');
    if(stateEl)stateEl.textContent=p.baseline.status||'PROJECT_DEFAULT';
    if(active)active.textContent=p.baseline.baseline_id+' · '+p.baseline.shift_start+'–'+p.baseline.shift_end+' · EU '+(EU_DENOMINATOR_OPTIONS[p.euDenominator]||p.euDenominator)+' · '+(EFFECTIVE_RULE_OPTIONS[p.effectiveTimeRule]||p.effectiveTimeRule);
  };
  if(baselineSelect)baselineSelect.onchange=syncConsolePreview;
  if(euDenominatorSelect)euDenominatorSelect.onchange=syncConsolePreview;
  if(effectiveRuleSelect)effectiveRuleSelect.onchange=syncConsolePreview;
  if(openConsole)openConsole.onclick=showConsole;
  if(closeConsole)closeConsole.onclick=hideConsole;
  if(cancelConsole)cancelConsole.onclick=hideConsole;
  if(resetConsole)resetConsole.onclick=resetConsolePolicy;
  if(applyConsoleButton)applyConsoleButton.onclick=applyConsole;
  if(consoleModal)consoleModal.onclick=e=>{if(e.target===consoleModal)hideConsole();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&consoleModal&&consoleModal.classList.contains('open'))hideConsole();});

  const historyModal=document.getElementById('reportsHistoryModal');
  const openHistory=document.getElementById('reportsOpenHistory');
  const closeHistory=document.getElementById('reportsCloseHistory');
  const showHistory=()=>{
    if(!historyModal)return;
    renderSnapshotHistory();
    if(global.LithositeModalShowContract){
      global.LithositeModalShowContract.show('reportsHistoryModal');
    }else{
      historyModal.classList.add('open');
      historyModal.setAttribute('aria-hidden','false');
    }
  };
  const hideHistory=()=>{
    if(!historyModal)return;
    if(global.LithositeModalShowContract){
      global.LithositeModalShowContract.close('reportsHistoryModal');
    }else{
      historyModal.classList.remove('open');
      historyModal.setAttribute('aria-hidden','true');
    }
  };
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
