/* V38 Stage 28 — Report Engine foundation.
 * Pure report-model layer. It consumes prepared source data and KPI results;
 * it does not read the DOM, mutate domain records, or render PDF.
 */
(function(global){
'use strict';

const TYPES = Object.freeze(['DAILY','WEEKLY','MONTHLY']);
const STATUS = Object.freeze({
  DRAFT:'DRAFT',
  READY:'READY',
  ISSUED:'ISSUED',
  VALIDATION_REQUIRED:'VALIDATION REQUIRED'
});
const DOMAINS = Object.freeze([
  'Operations','Equipment','WorkFront','Maintenance',
  'Issues','Plans','HSE','MarkerLocation','Topography'
]);

function isoDate(value){
  const s=String(value||'').slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
function assertType(type){
  const value=String(type||'').toUpperCase();
  if(!TYPES.includes(value)) throw new Error('Unsupported report type: '+value);
  return value;
}
function periodFor(type,start,end){
  const t=assertType(type), s=isoDate(start), e=isoDate(end||start);
  if(!s||!e||e<s) throw new Error('Invalid report period.');
  return Object.freeze({start:s,end:e});
}
function makeReportId(type,period,sequence){
  const suffix=String(sequence||1).padStart(3,'0');
  return 'MS-'+assertType(type).charAt(0)+'-'+period.start.replaceAll('-','')+'-'+suffix;
}
function normalizeCounts(source){
  const input=source&&typeof source==='object'?source:{};
  return Object.freeze(Object.fromEntries(DOMAINS.map(name=>{
    const value=input[name];
    return [name,Array.isArray(value)?value.length:Number.isFinite(Number(value))?Number(value):0];
  })));
}
function validationIssue(code,message,domain){
  return Object.freeze({code:String(code),message:String(message),domain:domain||null});
}
function validateSource(source,requiredDomains){
  const issues=[];
  const input=source&&typeof source==='object'?source:{};
  (requiredDomains||[]).forEach(domain=>{
    if(!DOMAINS.includes(domain)) issues.push(validationIssue('UNKNOWN_DOMAIN','Unknown source domain: '+domain,domain));
    else if(!Array.isArray(input[domain])) issues.push(validationIssue('SOURCE_UNAVAILABLE','Source domain is unavailable: '+domain,domain));
  });
  return Object.freeze(issues);
}
function normalizeKpi(kpi){
  const input=kpi&&typeof kpi==='object'?kpi:{};
  const status=String(input.status||'UNAVAILABLE');
  return Object.freeze({
    status,
    PA:input.PA??null,
    UA:input.UA??null,
    EU:input.EU??null,
    eligible:Number.isFinite(Number(input.eligible))?Number(input.eligible):0,
    excluded:Number.isFinite(Number(input.excluded))?Number(input.excluded):0,
    policy:input.policy||null,
    snapshot_id:input.snapshot_id||null,
    validation_issues:Array.isArray(input.validation_issues)?Object.freeze(input.validation_issues.slice()):Object.freeze([])
  });
}
function sectionPlan(type){
  switch(assertType(type)){
    case 'DAILY': return Object.freeze([
      'Executive Summary','Work / Task Completed','Equipment Status',
      'Work Front Status','HSE Events / Safety Notes','Maintenance / Downtime',
      'Material Movement','Issues and Abnormalities','Site Map / Spatial Activities',
      'KPI Summary','Outstanding / Carry-over Tasks','Supporting Evidence / References'
    ]);
    case 'WEEKLY': return Object.freeze([
      'Executive Summary','Planned vs Actual','Equipment Performance',
      'Work Front Progress','HSE Summary','Maintenance and Downtime Analysis',
      'Material Movement Summary','Issues and Recurring Issues','Outstanding Actions',
      'KPI Trend','Key Highlights','Top Management Concerns','Recommended Actions'
    ]);
    default: return Object.freeze([
      'Management Executive Summary','Monthly KPI','Target vs Actual',
      'Equipment Performance','Work Front Progress','HSE Performance',
      'Maintenance / Downtime','Material Movement','Major Issues / Events',
      'Recurring Problems','Outstanding Actions','Trend vs Previous Month',
      'Performance Highlights','Management Attention / Decision Required',
      'Recommendations','Appendix / Evidence'
    ]);
  }
}
function buildReportModel(options){
  const o=options&&typeof options==='object'?options:{};
  const type=assertType(o.report_type||o.reportType);
  const period=periodFor(type,o.period_start||o.start,o.period_end||o.end);
  const source=o.source_data||o.sourceData||{};
  const issues=validateSource(source,o.required_domains||DOMAINS.slice(0,7));
  const externalIssues=Array.isArray(o.validation_issues)?o.validation_issues.map((x,i)=>validationIssue(x.code||('VALIDATION_'+(i+1)),x.message||'Validation required',x.domain)): [];
  const allIssues=issues.concat(externalIssues);
  const kpi=normalizeKpi(o.kpi);
  const status=allIssues.length||['VALIDATION REQUIRED','INVALID','UNAVAILABLE'].includes(kpi.status)
    ? STATUS.VALIDATION_REQUIRED
    : STATUS.DRAFT;
  const counts=normalizeCounts(source);
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const generatedAt=o.generated_at||new Date().toISOString();
  return Object.freeze({
    schema_version:'1.0',
    report_id:o.report_id||makeReportId(type,period,o.sequence),
    report_type:type,
    period,
    scope:o.scope||'ALL',
    status,
    generated_at:generatedAt,
    application_version:o.application_version||'V38',
    source_counts:counts,
    total_source_records:total,
    kpi,
    validation:Object.freeze({
      status:allIssues.length?'VALIDATION_REQUIRED':'READY_FOR_REVIEW',
      issue_count:allIssues.length,
      issues:Object.freeze(allIssues)
    }),
    sections:Object.freeze(sectionPlan(type)),
    lineage:Object.freeze({
      source_snapshot_id:o.source_snapshot_id||null,
      kpi_snapshot_id:kpi.snapshot_id,
      kpi_policy:kpi.policy,
      source_domains:Object.freeze(Object.keys(source).filter(k=>DOMAINS.includes(k)))
    }),
    snapshot:Object.freeze({
      immutable:false,
      issued_at:null,
      revision:1
    })
  });
}
function canIssue(model){
  return !!model && model.status!==STATUS.VALIDATION_REQUIRED && model.validation?.issue_count===0;
}
function issueReport(model,issuedAt){
  if(!canIssue(model)) throw new Error('Report cannot be issued: validation required.');
  const copy=JSON.parse(JSON.stringify(model));
  copy.status=STATUS.ISSUED;
  copy.snapshot=copy.snapshot||{};
  copy.snapshot.immutable=true;
  copy.snapshot.issued_at=issuedAt||new Date().toISOString();
  copy.snapshot.revision=Number(copy.snapshot.revision||1);
  return deepFreeze(copy);
}
function deepFreeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);
    Object.keys(value).forEach(key=>deepFreeze(value[key]));
  }
  return value;
}
function toSnapshot(model){
  if(!model||typeof model!=='object') throw new Error('Report model is required.');
  const snapshot=JSON.parse(JSON.stringify(model));
  snapshot.snapshot=snapshot.snapshot||{};
  snapshot.snapshot.immutable=true;
  snapshot.snapshot.revision=Number(snapshot.snapshot.revision||1);
  return deepFreeze(snapshot);
}

global.LithositeReportEngine=Object.freeze({
  TYPES,STATUS,DOMAINS,sectionPlan,validateSource,buildReportModel,canIssue,issueReport,toSnapshot
});
})(window);
