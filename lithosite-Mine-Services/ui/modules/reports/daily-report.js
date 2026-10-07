/* V38 Stage 29 — Daily Report Engine.
 * Pure aggregation layer for management Daily reports.
 * Read-only: consumes prepared source arrays and KPI snapshot; never mutates domain data.
 */
(function(global){
'use strict';

const REQUIRED=['Operations','Equipment','WorkFront','Maintenance','Issues','Plans','HSE'];
const OPTIONAL=['MarkerLocation','Topography'];

function dateOf(row){
  if(!row||typeof row!=='object')return null;
  const keys=['transaction_date','event_date','maintenance_date','issue_date','plan_date','date','work_date','created_at','updated_at'];
  for(const key of keys){
    const value=String(row[key]??'').slice(0,10);
    if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
  }
  return null;
}
function textOf(row,keys){
  if(!row||typeof row!=='object')return '';
  for(const key of keys){
    const value=String(row[key]??'').trim();
    if(value)return value;
  }
  return '';
}
function rows(source,name){
  return Array.isArray(source?.[name])?source[name]:[];
}
function inPeriod(row,start,end){
  const d=dateOf(row);
  return !d||(d>=start&&d<=end);
}
function scoped(source,name,start,end){
  return rows(source,name).filter(r=>inPeriod(r,start,end));
}
function countBy(rowsList,keyCandidates){
  const out={};
  rowsList.forEach(row=>{
    const key=textOf(row,keyCandidates)||'Unspecified';
    out[key]=(out[key]||0)+1;
  });
  return out;
}
function sumNumeric(rowsList,keyCandidates){
  let total=0,count=0;
  rowsList.forEach(row=>{
    for(const key of keyCandidates){
      const n=Number(row?.[key]);
      if(Number.isFinite(n)){total+=n;count++;break;}
    }
  });
  return count?total:null;
}
function kpiSummary(kpi){
  const k=kpi&&typeof kpi==='object'?kpi:{};
  const status=String(k.status||'UNAVAILABLE');
  return {
    status,
    PA:k.PA??null,
    UA:k.UA??null,
    EU:k.EU??null,
    eligible:Number(k.eligible)||0,
    excluded:Number(k.excluded)||0,
    validation_issues:Array.isArray(k.validation_issues)?k.validation_issues.slice():[],\n    equipment:Array.isArray(k.equipment)?k.equipment:[]
  };
}
function sourceAvailability(source){
  const missing=REQUIRED.filter(name=>!Array.isArray(source?.[name]));
  return {
    missing_required:missing,
    status:missing.length?'VALIDATION REQUIRED':'READY'
  };
}
function buildDailyReport(options){
  const o=options&&typeof options==='object'?options:{};
  const periodStart=String(o.period_start||o.start||'').slice(0,10);
  const periodEnd=String(o.period_end||o.end||periodStart).slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(periodStart)||!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)||periodEnd<periodStart){
    throw new Error('Invalid Daily report period.');
  }
  const source=o.source_data||o.source||{};
  const availability=sourceAvailability(source);
  const scopedData={};
  [...REQUIRED,...OPTIONAL].forEach(name=>{scopedData[name]=scoped(source,name,periodStart,periodEnd);});
  const operations=scopedData.Operations;
  const equipment=scopedData.Equipment;
  const workfront=scopedData.WorkFront;
  const maintenance=scopedData.Maintenance;
  const issues=scopedData.Issues;
  const plans=scopedData.Plans;
  const hse=scopedData.HSE;
  const kpi=kpiSummary(o.kpi);
  const validationIssues=[];
  availability.missing_required.forEach(domain=>validationIssues.push({
    code:'SOURCE_UNAVAILABLE',domain,message:'Required Daily source domain is unavailable: '+domain
  }));
  if(kpi.status!=='READY')validationIssues.push({
    code:'KPI_NOT_READY',domain:'KPI',message:'KPI foundation status is '+kpi.status+'.'
  });
  kpi.validation_issues.forEach((item,index)=>validationIssues.push({
    code:item.code||('KPI_VALIDATION_'+(index+1)),domain:item.domain||'KPI',
    message:item.message||'KPI validation required.'
  }));

  const completed=operations.filter(r=>{
    const s=textOf(r,['status','state']).toUpperCase();
    return ['VALIDATED','COMPLETED','DONE','CLOSED'].includes(s);
  });
  const openIssues=issues.filter(r=>!['CLOSED','RESOLVED','VOIDED'].includes(textOf(r,['status','state']).toUpperCase()));
  const openPlans=plans.filter(r=>!['COMPLETED','DONE','CLOSED','VOIDED'].includes(textOf(r,['status','state']).toUpperCase()));
  const downtime=sumNumeric(maintenance,['actual_hours','downtime_hours','duration_hours','hours']);
  const movement=sumNumeric(operations,['quantity','actual_quantity','movement_quantity']);

  const evidence={};
  [...REQUIRED,...OPTIONAL].forEach(name=>{
    evidence[name]=scopedData[name].slice(0,100).map(row=>({
      id:textOf(row,['id','operation_id','transaction_id','equipment_id','workfront_id','issue_id','plan_id','hse_id','marker_id','topography_id'])||null,
      date:dateOf(row),
      label:textOf(row,['activity','description','name','title','status'])||'Source record'
    }));
  });

  const sectionData={
    'Executive Summary':{
      headline:'Daily operational summary',
      status:validationIssues.length?'VALIDATION REQUIRED':'READY FOR REVIEW',
      statement:'Operations '+operations.length+' records, '+completed.length+' completed/validated; Equipment '+equipment.length+'; WorkFront '+workfront.length+'; HSE '+hse.length+'; Issues '+issues.length+'.',
      management_attention:validationIssues.length?'Validation evidence must be resolved before issue.':'No source/KPI validation gate is blocking review.'
    },
    'Work / Task Completed':{
      record_count:operations.length,completed_count:completed.length,
      by_activity:countBy(completed,['activity','task','description'])
    },
    'Equipment Status':{
      record_count:equipment.length,
      by_status:countBy(equipment,['status','state']),
      kpi:{eligible:kpi.eligible,excluded:kpi.excluded,status:kpi.status}
    },
    'Work Front Status':{
      record_count:workfront.length,
      by_status:countBy(workfront,['status','state']),
      by_workfront:countBy(operations,['work_front','workfront','work_front_id'])
    },
    'HSE Events / Safety Notes':{
      record_count:hse.length,
      by_severity:countBy(hse,['severity','risk_level']),
      by_status:countBy(hse,['status','state'])
    },
    'Maintenance / Downtime':{
      record_count:maintenance.length,
      downtime_hours:downtime,
      by_status:countBy(maintenance,['status','state','maintenance_status'])
    },
    'Material Movement':{
      source:'Operations',
      record_count:operations.length,
      quantity_total:movement,
      by_unit:countBy(operations,['unit','uom'])
    },
    'Issues and Abnormalities':{
      record_count:issues.length,open_count:openIssues.length,
      by_severity:countBy(issues,['severity','priority']),
      by_status:countBy(issues,['status','state'])
    },
    'Site Map / Spatial Activities':{
      marker_records:scopedData.MarkerLocation.length,
      topography_records:scopedData.Topography.length,
      status:(scopedData.MarkerLocation.length||scopedData.Topography.length)?'EVIDENCE AVAILABLE':'NO SPATIAL EVIDENCE IN SOURCE SNAPSHOT'
    },
    'KPI Summary':{
      status:kpi.status,PA:kpi.PA,UA:kpi.UA,EU:kpi.EU,
      eligible:kpi.eligible,excluded:kpi.excluded
    },
    'Outstanding / Carry-over Tasks':{
      open_issue_count:openIssues.length,open_plan_count:openPlans.length,
      plans_by_status:countBy(openPlans,['status','state'])
    },
    'Supporting Evidence / References':{
      source_domains:[...REQUIRED,...OPTIONAL].filter(name=>Array.isArray(source?.[name])),
      evidence
    }
  };

  return Object.freeze({
    schema_version:'1.0',
    report_type:'DAILY',
    period:Object.freeze({start:periodStart,end:periodEnd}),
    scope:o.scope||'ALL',
    status:validationIssues.length?'VALIDATION REQUIRED':'DRAFT',
    source_counts:Object.freeze(Object.fromEntries([...REQUIRED,...OPTIONAL].map(name=>[name,scopedData[name].length]))),
    total_source_records:Object.values(scopedData).reduce((n,list)=>n+list.length,0),
    metrics:Object.freeze({
      operations_completed:completed.length,
      open_issues:openIssues.length,
      open_plans:openPlans.length,
      downtime_hours:downtime,
      material_quantity:movement
    }),
    kpi:Object.freeze(kpi),
    validation:Object.freeze({
      status:validationIssues.length?'VALIDATION REQUIRED':'READY',
      issue_count:validationIssues.length,
      issues:Object.freeze(validationIssues)
    }),
    sections:Object.freeze([
      'Executive Summary','Work / Task Completed','Equipment Status','Work Front Status',
      'HSE Events / Safety Notes','Maintenance / Downtime','Material Movement',
      'Issues and Abnormalities','Site Map / Spatial Activities','KPI Summary',
      'Outstanding / Carry-over Tasks','Supporting Evidence / References'
    ]),
    section_data:Object.freeze(sectionData)
  });
}

global.LithositeDailyReport=Object.freeze({buildDailyReport,dateOf});
})(window);
