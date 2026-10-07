/* V38 Stage 31 — Monthly Management Report Engine.
 * Pure aggregation layer for management Monthly reports.
 * Read-only: consumes prepared source arrays and KPI snapshot; never mutates domain data.
 */
(function(global){
'use strict';
const REQUIRED=['Operations','Equipment','WorkFront','Maintenance','Issues','Plans','HSE'];
const OPTIONAL=['MarkerLocation','Topography'];
const CLOSED=['CLOSED','RESOLVED','VOIDED','COMPLETED','DONE'];
function dateOf(row){if(!row||typeof row!=='object')return null;for(const k of ['transaction_date','event_date','maintenance_date','issue_date','plan_date','date','work_date','created_at','updated_at']){const v=String(row[k]??'').slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v}return null}
function rows(s,n){return Array.isArray(s?.[n])?s[n]:[]}
function scoped(s,n,a,b){return rows(s,n).filter(r=>{const d=dateOf(r);return !!d&&d>=a&&d<=b})}
function text(row,keys){for(const k of keys){const v=String(row?.[k]??'').trim();if(v)return v}return 'Unspecified'}
function count(a,keys){const o={};a.forEach(r=>{const k=text(r,keys);o[k]=(o[k]||0)+1});return o}
function sum(a,keys){let total=0,found=0;a.forEach(r=>{for(const k of keys){const n=Number(r?.[k]);if(Number.isFinite(n)){total+=n;found++;break}}});return found?total:null}
function kpiSummary(k){k=k&&typeof k==='object'?k:{status:'UNAVAILABLE'};return {status:String(k.status||'UNAVAILABLE'),PA:k.PA??null,UA:k.UA??null,EU:k.EU??null,eligible:Number(k.eligible)||0,excluded:Number(k.excluded)||0,validation_issues:Array.isArray(k.validation_issues)?k.validation_issues.slice():[],equipment:Array.isArray(k.equipment)?k.equipment:[]}}
function buildMonthlyReport(o){
 o=o&&typeof o==='object'?o:{};const a=String(o.period_start||o.start||'').slice(0,10),b=String(o.period_end||o.end||'').slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(a)||!/^\d{4}-\d{2}-\d{2}$/.test(b)||b<a)throw new Error('Invalid Monthly report period.');
 const s=o.source_data||o.source||{},missing=REQUIRED.filter(n=>!Array.isArray(s[n])),d={};[...REQUIRED,...OPTIONAL].forEach(n=>d[n]=scoped(s,n,a,b));
 const ops=d.Operations,eq=d.Equipment,wf=d.WorkFront,ma=d.Maintenance,ix=d.Issues,pl=d.Plans,h=d.HSE,k=kpiSummary(o.kpi);
 const validation=missing.map(x=>({code:'SOURCE_UNAVAILABLE',domain:x,message:'Required Monthly source domain is unavailable: '+x}));
 if(k.status!=='READY')validation.push({code:'KPI_NOT_READY',domain:'KPI',message:'KPI foundation status is '+k.status+'.'});
 k.validation_issues.forEach((item,i)=>validation.push({code:item.code||('KPI_VALIDATION_'+(i+1)),domain:item.domain||'KPI',message:item.message||'KPI validation required.'}));
 const done=ops.filter(r=>['VALIDATED','COMPLETED','DONE','CLOSED'].includes(String(r?.status||r?.state||'').toUpperCase()));
 const openI=ix.filter(r=>!CLOSED.includes(String(r?.status||r?.state||'').toUpperCase()));
 const openP=pl.filter(r=>!CLOSED.includes(String(r?.status||r?.state||'').toUpperCase()));
 const evidence={};[...REQUIRED,...OPTIONAL].forEach(n=>{evidence[n]=d[n].slice(0,100).map(r=>({id:text(r,['id','operation_id','transaction_id','equipment_id','workfront_id','issue_id','plan_id','hse_id','marker_id','topography_id'])==='Unspecified'?null:text(r,['id','operation_id','transaction_id','equipment_id','workfront_id','issue_id','plan_id','hse_id','marker_id','topography_id']),date:dateOf(r),label:text(r,['activity','description','name','title','status'])}))});
 const section_data={
 'Management Executive Summary':{statement:'Monthly management summary '+a+' → '+b+'. Operations '+ops.length+'; completed '+done.length+'; open issues '+openI.length+'; open plans '+openP.length+'.',status:validation.length?'VALIDATION REQUIRED':'READY FOR REVIEW'},
 'Monthly KPI':{status:k.status,PA:k.PA,UA:k.UA,EU:k.EU,eligible:k.eligible,excluded:k.excluded},
 'Target vs Actual':{target_data_available:false,actual_records:ops.length,planned_records:pl.length,note:'Target values are not configured in the current source model; no target is fabricated.'},
 'Equipment Performance':{record_count:eq.length,by_status:count(eq,['status','state']),kpi:{status:k.status,PA:k.PA,UA:k.UA,EU:k.EU}},
 'Work Front Progress':{record_count:wf.length,by_status:count(wf,['status','state'])},
 'HSE Performance':{record_count:h.length,by_severity:count(h,['severity','risk_level']),by_status:count(h,['status','state'])},
 'Maintenance / Downtime':{record_count:ma.length,downtime_hours:sum(ma,['actual_hours','downtime_hours','duration_hours','hours']),by_status:count(ma,['status','state','maintenance_status'])},
 'Material Movement':{record_count:ops.length,quantity_total:sum(ops,['quantity','actual_quantity','movement_quantity']),by_unit:count(ops,['unit','uom'])},
 'Major Issues / Events':{record_count:ix.length,open_count:openI.length,by_severity:count(ix,['severity','priority'])},
 'Recurring Problems':{classification_available:false,source_issue_records:ix.length,note:'Recurring classification requires historical comparison; it is not fabricated in this stage.'},
 'Outstanding Actions':{open_issue_count:openI.length,open_plan_count:openP.length,issues_by_status:count(openI,['status','state']),plans_by_status:count(openP,['status','state'])},
 'Trend vs Previous Month':{comparison_available:false,current:{PA:k.PA,UA:k.UA,EU:k.EU,status:k.status},note:'Previous-month history is not yet available in the report snapshot.'},
 'Performance Highlights':{operations:ops.length,completed:done.length,equipment:eq.length,workfront:wf.length,hse:h.length,maintenance:ma.length},
 'Management Attention / Decision Required':{status:validation.length?'VALIDATION REQUIRED':openI.length?'ATTENTION':'CLEAR',open_issues:openI.length,open_plans:openP.length,decision_required:validation.length>0},
 'Recommendations':{status:validation.length?'VALIDATION REQUIRED':'REVIEW',items:validation.length?['Resolve source/KPI validation before issuing the management report.']:['Review major issues, outstanding plans, and KPI performance before management issue.']},
 'Appendix / Evidence':{source_domains:[...REQUIRED,...OPTIONAL].filter(n=>Array.isArray(s[n])),evidence}
 };
 const sections=['Management Executive Summary','Monthly KPI','Target vs Actual','Equipment Performance','Work Front Progress','HSE Performance','Maintenance / Downtime','Material Movement','Major Issues / Events','Recurring Problems','Outstanding Actions','Trend vs Previous Month','Performance Highlights','Management Attention / Decision Required','Recommendations','Appendix / Evidence'];
 return Object.freeze({schema_version:'1.0',report_type:'MONTHLY',period:Object.freeze({start:a,end:b}),scope:o.scope||'ALL',status:validation.length?'VALIDATION REQUIRED':'DRAFT',source_counts:Object.freeze(Object.fromEntries([...REQUIRED,...OPTIONAL].map(n=>[n,d[n].length]))),total_source_records:Object.values(d).reduce((n,x)=>n+x.length,0),metrics:Object.freeze({operations_completed:done.length,open_issues:openI.length,open_plans:openP.length,downtime_hours:sum(ma,['actual_hours','downtime_hours','duration_hours','hours']),material_quantity:sum(ops,['quantity','actual_quantity','movement_quantity'])}),kpi:Object.freeze(k),validation:Object.freeze({status:validation.length?'VALIDATION REQUIRED':'READY',issue_count:validation.length,issues:Object.freeze(validation)}),sections:Object.freeze(sections),section_data:Object.freeze(section_data)})
}
global.LithositeMonthlyReport=Object.freeze({buildMonthlyReport,dateOf});
})(window);
