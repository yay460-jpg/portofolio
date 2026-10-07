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
    state.data={};
    for(const entity of entities){
      const result=await rc.request({operation:'READ',entity});
      state.data[entity]=Array.isArray(result.data)?result.data:[];
    }
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
    if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
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
  const k=state.kpi;
  const kpi={
    status:k?.status||'UNAVAILABLE',
    PA:k?.results?.PA?.value??null,
    UA:k?.results?.UA?.value??null,
    EU:k?.results?.EU?.value??null,
    eligible:k?.population?.eligible??0,
    excluded:k?.population?.excluded??0,
    validation_issues:Array.isArray(k?.validation?.issues)?k.validation.issues:[],
    equipment:Array.isArray(k?.equipment)?k.equipment:[]
  };
  if(type==='DAILY'&&global.LithositeDailyReport){
    const daily=global.LithositeDailyReport.buildDailyReport({
      period_start:effectivePeriod.start,
      period_end:effectivePeriod.end,
      scope:'ALL',
      source_data:{...scoped,MarkerLocation:reportRowsForEntity('MarkerLocation',effectivePeriod),Topography:reportRowsForEntity('Topography',effectivePeriod)},
      kpi
    });
    const formal=global.LithositeReportEngine
      ? global.LithositeReportEngine.buildReportModel({
          report_type:'DAILY',
          period_start:effectivePeriod.start,
          period_end:effectivePeriod.end,
          scope:'ALL',
          source_data:{...scoped,MarkerLocation:daily.section_data['Site Map / Spatial Activities'] ? reportRowsForEntity('MarkerLocation',effectivePeriod) : [],Topography:reportRowsForEntity('Topography',effectivePeriod)},
          kpi
        })
      : null;
    return {
      ...(formal||{}),
      ...daily,
      report_period_requested:requestedPeriod,
      report_period_effective:effectivePeriod,
      report_data_status:requestedRows>0?'REQUESTED_PERIOD':'LATEST_AVAILABLE_DATA',
      report_id:'DRAFT-DAILY-'+requestedPeriod.start+'-'+requestedPeriod.end,
      generated_at:new Date().toISOString(),
      status:daily.status
    };
  }
  if(type==='WEEKLY'&&global.LithositeWeeklyReport){
    const weekly=global.LithositeWeeklyReport.buildWeeklyReport({
      period_start:effectivePeriod.start,
      period_end:effectivePeriod.end,
      scope:'ALL',
      source_data:{...scoped,MarkerLocation:reportRowsForEntity('MarkerLocation',effectivePeriod),Topography:reportRowsForEntity('Topography',effectivePeriod)},
      kpi
    });
    const formal=global.LithositeReportEngine?.buildReportModel({
      report_type:'WEEKLY',
      period_start:effectivePeriod.start,
      period_end:effectivePeriod.end,
      scope:'ALL',
      source_data:{...scoped,MarkerLocation:reportRowsForEntity('MarkerLocation',effectivePeriod),Topography:reportRowsForEntity('Topography',effectivePeriod)},
      kpi
    });
    return {...(formal||{}),...weekly,report_period_requested:requestedPeriod,report_period_effective:effectivePeriod,report_data_status:requestedRows>0?'REQUESTED_PERIOD':'LATEST_AVAILABLE_DATA',report_id:'DRAFT-WEEKLY-'+requestedPeriod.start+'-'+requestedPeriod.end,generated_at:new Date().toISOString()};
  }
  if(type==='MONTHLY'&&global.LithositeMonthlyReport){
    const monthly=global.LithositeMonthlyReport.buildMonthlyReport({
      period_start:effectivePeriod.start,
      period_end:effectivePeriod.end,
      scope:'ALL',
      source_data:{...scoped,MarkerLocation:reportRowsForEntity('MarkerLocation',effectivePeriod),Topography:reportRowsForEntity('Topography',effectivePeriod)},
      kpi
    });
    const formal=global.LithositeReportEngine?.buildReportModel({
      report_type:'MONTHLY',
      period_start:effectivePeriod.start,
      period_end:effectivePeriod.end,
      scope:'ALL',
      source_data:{...scoped,MarkerLocation:reportRowsForEntity('MarkerLocation',effectivePeriod),Topography:reportRowsForEntity('Topography',effectivePeriod)},
      kpi
    });
    return {...(formal||{}),...monthly,report_period_requested:requestedPeriod,report_period_effective:effectivePeriod,report_data_status:requestedRows>0?'REQUESTED_PERIOD':'LATEST_AVAILABLE_DATA',report_id:'DRAFT-MONTHLY-'+requestedPeriod.start+'-'+requestedPeriod.end,generated_at:new Date().toISOString(),status:monthly.status};
  }
  const sourceTables=Object.fromEntries(entities.map(entity=>[entity,reportTableRows(scoped[entity])]));
  const sections=global.LithositeReportEngine
    ? global.LithositeReportEngine.sectionPlan(type)
    : (type==='WEEKLY'
      ? ['Executive Summary','Planned vs Actual','Equipment Performance','Work Front Progress','HSE Summary','Maintenance and Downtime Analysis','Material Movement Summary','Issues and Recurring Issues','Outstanding Actions','KPI Trend','Key Highlights','Top Management Concerns','Recommended Actions']
      : ['Management Executive Summary','Monthly KPI','Target vs Actual','Equipment Performance','Work Front Progress','HSE Performance','Maintenance / Downtime','Material Movement','Major Issues / Events','Recurring Problems','Outstanding Actions','Trend vs Previous Month','Performance Highlights','Management Attention / Decision Required','Recommendations','Appendix / Evidence']);
  const sectionData={
    'Executive Summary':'Source records: '+Object.values(scoped).reduce((n,list)=>n+list.length,0)+'. KPI state: '+kpi.status+'.',
    'Management Executive Summary':'Source records: '+Object.values(scoped).reduce((n,list)=>n+list.length,0)+'. KPI state: '+kpi.status+'.',
    'Planned vs Actual':'Plans '+scoped.Plans.length+' records; Operations '+scoped.Operations.length+' actual records.',
    'Equipment Performance':'Equipment '+scoped.Equipment.length+' source records. KPI fleet status: '+kpi.status+'.',
    'Work Front Progress':'WorkFront '+scoped.WorkFront.length+' records.',
    'HSE Summary':'HSE '+scoped.HSE.length+' records.',
    'HSE Performance':'HSE '+scoped.HSE.length+' records.',
    'Maintenance and Downtime Analysis':'Maintenance '+scoped.Maintenance.length+' records.',
    'Material Movement Summary':'Operations '+scoped.Operations.length+' source records.',
    'Issues and Recurring Issues':'Issues '+scoped.Issues.length+' records.',
    'Major Issues / Events':'Issues '+scoped.Issues.length+' records.',
    'Outstanding Actions':'Issues '+scoped.Issues.length+' + Plans '+scoped.Plans.length+' source records.',
    'KPI Trend':'Current KPI snapshot: PA '+fmtPct(kpi.PA)+' · UA '+fmtPct(kpi.UA)+' · EU '+fmtPct(kpi.EU)+'.',
    'Key Highlights':'Operations '+scoped.Operations.length+' · Equipment '+scoped.Equipment.length+' · WorkFront '+scoped.WorkFront.length+'.',
    'Performance Highlights':'Operations '+scoped.Operations.length+' · Equipment '+scoped.Equipment.length+' · WorkFront '+scoped.WorkFront.length+'.',
    'Top Management Concerns':kpi.status==='READY'?'No KPI validation gate is blocking the report.':'KPI validation state is '+kpi.status+'.',
    'Management Attention / Decision Required':kpi.status==='READY'?'No KPI validation decision is currently required.':'Resolve KPI validation before issuing the management report.',
    'Recommended Actions':'Review source evidence, confirm KPI validation, then issue the report snapshot.',
    'Recommendations':'Review source evidence, confirm KPI validation, then issue the report snapshot.',
    'Target vs Actual':'Target values are not yet configured in the current report source model; actual source records are included.',
    'Trend vs Previous Month':'Historical comparison is not yet populated in the current report snapshot.',
    'Recurring Problems':'Recurring classification is not yet populated; source issue records are retained as evidence.',
    'Appendix / Evidence':'Source tables below retain report-period evidence from the RuntimeAdapter.'
  };
  const totalRecords=Object.values(scoped).reduce((n,list)=>n+list.length,0);
  return {
    report_period_requested:requestedPeriod,
    report_period_effective:effectivePeriod,
    report_data_status:requestedRows>0?'REQUESTED_PERIOD':'LATEST_AVAILABLE_DATA',
    report_id:'DRAFT-'+type+'-'+requestedPeriod.start+'-'+requestedPeriod.end,
    report_type:type,
    period:requestedPeriod,
    scope:'ALL',
    status:'DRAFT',
    generated_at:new Date().toISOString(),
    source_counts:Object.fromEntries(entities.map(e=>[e,scoped[e].length])),
    total_records:totalRecords,
    kpi,
    sections,
    section_data:sectionData,
    source_tables:sourceTables
  };
}
function renderReportCenterSummary(model){
  const host=document.getElementById('reportCenterSummary'),status=document.getElementById('reportCenterStatus');
  if(!host||!model)return;
  const p=model.period;
  const totalRecords=Number.isFinite(Number(model.total_records))?Number(model.total_records):Number(model.total_source_records||0);
  host.innerHTML='<b>'+esc(model.report_type)+' REPORT</b> · '+esc(p.start)+(p.start!==p.end?' → '+esc(p.end):'')+' · '+totalRecords+' source records · KPI '+esc(model.kpi?.status||'UNAVAILABLE');
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
function renderReportPreview(model){
  const host=document.getElementById('reportPreviewBody'),meta=document.getElementById('reportPreviewMeta');
  if(!host||!model)return;
  if(meta)meta.textContent=model.report_type+' · '+model.period.start+(model.period.start!==model.period.end?' → '+model.period.end:'')+' · DRAFT';
  const k=model.kpi||{}, pa=Number(k.PA),ua=Number(k.UA),eu=Number(k.EU);
  const maxPct=100;
  const eq=reportKpiEquipment(model);
  const eqRows=eq.map(r=>'<tr><td><b>'+esc(r.id)+'</b></td><td>'+esc(r.unit)+'</td><td>'+esc(r.date)+'</td><td>'+fmtHours(r.scheduled)+'</td><td>'+fmtHours(r.available)+'</td><td>'+fmtHours(r.used)+'</td><td><b>'+fmtPct(r.pa)+'</b></td><td>'+fmtPct(r.ua)+'</td><td>'+fmtPct(r.eu)+'</td><td>'+esc(r.status)+'</td></tr>').join('');
  const sourceRows=entities.map(entity=>'<tr><td>'+esc(entity)+'</td><td>'+model.source_counts[entity]+'</td></tr>').join('');
  const narrative=(title,text)=>'<section class="report-preview-block"><div class="report-preview-block-head"><b>'+esc(title)+'</b></div><div class="report-preview-copy">'+esc(text)+'</div></section>';
  const totalRecords=Number.isFinite(Number(model.total_records))?Number(model.total_records):Number(model.total_source_records||0);
  host.innerHTML=
    '<div class="report-preview-kpis"><div><small>Records</small><b>'+totalRecords+'</b></div><div><small>PA</small><b>'+fmtPct(k.PA)+'</b></div><div><small>UA</small><b>'+fmtPct(k.UA)+'</b></div><div><small>EU</small><b>'+fmtPct(k.EU)+'</b></div></div>'+
    '<div class="report-preview-period"><b>Effective data period</b> '+esc(model.report_period_effective.start)+(model.report_period_effective.start!==model.report_period_effective.end?' → '+esc(model.report_period_effective.end):'')+' · '+esc(model.report_data_status)+'</div>'+
    narrative('Executive Summary','Operational source records: '+totalRecords+'. KPI validation state: '+(k.status||'UNAVAILABLE')+'. The report uses the same KPI snapshot and source evidence shown in Report Center.')+
    '<section class="report-preview-block"><div class="report-preview-block-head"><b>Fleet KPI</b><span>Current KPI snapshot</span></div><div class="report-kpi-bars">'+
      '<div><label>PA <b>'+fmtPct(k.PA)+'</b></label>'+reportBar(pa,maxPct)+'</div>'+
      '<div><label>UA <b>'+fmtPct(k.UA)+'</b></label>'+reportBar(ua,maxPct)+'</div>'+
      '<div><label>EU <b>'+fmtPct(k.EU)+'</b></label>'+reportBar(eu,maxPct)+'</div>'+
    '</div></section>'+
    '<section class="report-preview-block"><div class="report-preview-block-head"><b>Equipment Performance</b><span>'+eq.length+' KPI rows</span></div>'+
      '<div class="report-table-wrap"><table class="report-preview-table"><thead><tr><th>Equipment</th><th>Unit</th><th>Date</th><th>Scheduled</th><th>Available</th><th>Used</th><th>PA</th><th>UA</th><th>EU</th><th>Status</th></tr></thead><tbody>'+eqRows+'</tbody></table></div></section>'+
    '<section class="report-preview-block"><div class="report-preview-block-head"><b>Operational Source Summary</b><span>'+totalRecords+' records</span></div><div class="report-table-wrap"><table class="report-preview-table compact"><thead><tr><th>Domain</th><th>Records</th></tr></thead><tbody>'+sourceRows+'</tbody></table></div></section>'+
    narrative('Planned vs Actual',model.section_data['Planned vs Actual']||'Plan and actual source data are retained for the selected period.')+
    narrative('Maintenance / Downtime',model.section_data['Maintenance and Downtime Analysis']||model.section_data['Maintenance / Downtime']||'Maintenance source evidence is retained below.')+
    narrative('HSE Summary',model.section_data['HSE Summary']||model.section_data['HSE Events']||'HSE source evidence is retained below.')+
    narrative('Issues and Actions',model.section_data['Issues and Recurring Issues']||model.section_data['Issues and Abnormalities']||'Issue source evidence is retained below.')+
    '<section class="report-preview-block"><div class="report-preview-block-head"><b>Source Evidence</b><span>Traceable RuntimeAdapter records</span></div><div class="report-preview-copy">Detailed source rows remain available in the report snapshot. No source data is invented when a domain does not provide the required field.</div></section>'+
    '<div class="report-preview-note">Preview is read-only. Generate PDF uses this same Report Snapshot.</div>';
}
function generatePdf(model){
  if(!model)return;
  if(!model.snapshot?.immutable){
    msg('Issue the report before generating the final PDF.',true);
    return;
  }
  try{
    if(global.LithositePdfRenderer)global.LithositePdfRenderer.render(model);
    else throw new Error('PDF renderer is unavailable.');
  }catch(error){msg(error.message||'PDF generation failed.',true);}
}

function bind(){
  const reportType=document.getElementById('reportCenterType');
  const reportDate=document.getElementById('reportCenterDate');
  const reportPrepare=document.getElementById('reportCenterPrepare');
  const reportPreview=document.getElementById('reportCenterPreview');
  const reportValidate=document.getElementById('reportCenterValidate');
  const reportIssue=document.getElementById('reportCenterIssue');
  const reportHistory=document.getElementById('reportCenterHistory');
  const reportPdf=document.getElementById('reportCenterPdf');
  const issuedHistoryModal=document.getElementById('reportIssuedHistoryModal');
  const issuedHistoryBody=document.getElementById('reportIssuedHistoryBody');
  const issuedHistoryClose=document.getElementById('reportIssuedHistoryClose');
  const previewModal=document.getElementById('reportPreviewModal');
  const previewClose=document.getElementById('reportPreviewClose');
  let reportDraft=null;
  const latest=latestOperationalDate();
  if(reportDate)reportDate.value=latest;
  const prepareReport=()=>{
    const raw=buildReportModel();
    reportDraft=global.LithositeReportValidation
      ? global.LithositeReportValidation.apply(raw,{kpi:raw.kpi})
      : raw;
    renderReportCenterSummary(reportDraft);
    if(reportPreview)reportPreview.disabled=!reportDraft;
    if(reportValidate)reportValidate.disabled=!reportDraft;
    if(reportIssue)reportIssue.disabled=!reportDraft||reportDraft.status!=='READY';
    if(reportPdf)reportPdf.disabled=!reportDraft||!reportDraft.snapshot?.immutable;
    if(reportDraft?.status==='VALIDATION REQUIRED')msg('Report prepared but validation is required before issue.',true);
    else msg('Report prepared and ready for review.',false);
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
  if(reportValidate)reportValidate.onclick=()=>{
    if(!reportDraft)return;
    reportDraft=global.LithositeReportValidation
      ? global.LithositeReportValidation.apply(reportDraft,{kpi:reportDraft.kpi})
      : reportDraft;
    renderReportCenterSummary(reportDraft);
    if(reportIssue)reportIssue.disabled=reportDraft.status!=='READY';
    msg(reportDraft.status==='READY'?'Validation PASS — report is ready to issue.':'Validation required — resolve the report gate before issue.',reportDraft.status!=='READY');
  };
  if(reportIssue)reportIssue.onclick=async()=>{
    if(!reportDraft)return;
    if(!global.LithositeReportSnapshot||!global.LithositeReportHistory){msg('Report snapshot/history engine is unavailable.',true);return;}
    try{
      reportDraft=await global.LithositeReportSnapshot.create(reportDraft);
      global.LithositeReportHistory.save(reportDraft);
      renderReportCenterSummary(reportDraft);
      renderReportPreview(reportDraft);
      if(reportIssue)reportIssue.disabled=true;
      if(reportPdf)reportPdf.disabled=false;
      msg('Report issued — immutable snapshot saved to Report History.',false);
    }catch(error){msg(error.message||'Report issue failed.',true);}
  };
  if(reportPdf)reportPdf.onclick=()=>generatePdf(reportDraft);
  if(previewClose)previewClose.onclick=hideReportPreview;
  if(previewModal)previewModal.onclick=e=>{if(e.target===previewModal)hideReportPreview();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&previewModal&&previewModal.classList.contains('open'))hideReportPreview();});

  const renderIssuedHistory=()=>{
    if(!issuedHistoryBody||!global.LithositeReportHistory)return;
    const items=global.LithositeReportHistory.list();
    issuedHistoryBody.innerHTML=items.length
      ? items.map(item=>'<div class="kpi-history-row"><span>'+esc(item.report_type||'REPORT')+'</span><b>'+esc(item.period?.start||'—')+'</b><b>'+esc(item.period?.end||'—')+'</b><span>'+esc(item.snapshot_id||'—')+'</span><span>'+esc(item.snapshot?.issued_at||'')+'</span></div>').join('')
      : '<div class="kpi-history-empty">No issued report snapshot yet.</div>';
  };
  const showIssuedHistory=()=>{
    renderIssuedHistory();
    if(global.LithositeModalShowContract)global.LithositeModalShowContract.show('reportIssuedHistoryModal');
    else if(issuedHistoryModal){issuedHistoryModal.classList.add('open');issuedHistoryModal.setAttribute('aria-hidden','false');}
  };
  const hideIssuedHistory=()=>{
    if(!issuedHistoryModal)return;
    if(global.LithositeModalShowContract)global.LithositeModalShowContract.close('reportIssuedHistoryModal');
    else{issuedHistoryModal.classList.remove('open');issuedHistoryModal.setAttribute('aria-hidden','true');}
  };
  if(reportHistory)reportHistory.onclick=showIssuedHistory;
  if(issuedHistoryClose)issuedHistoryClose.onclick=hideIssuedHistory;
  if(issuedHistoryModal)issuedHistoryModal.onclick=e=>{if(e.target===issuedHistoryModal)hideIssuedHistory();};

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
