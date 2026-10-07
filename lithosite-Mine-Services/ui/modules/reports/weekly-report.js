(function(global){'use strict';
const REQUIRED=['Operations','Equipment','WorkFront','Maintenance','Issues','Plans','HSE'];
const CLOSED=['CLOSED','RESOLVED','VOIDED','COMPLETED','DONE'];
function dateOf(r){for(const k of ['transaction_date','event_date','maintenance_date','issue_date','plan_date','date','work_date']){const v=String(r?.[k]||'').slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v}return null}
function rows(s,n){return Array.isArray(s?.[n])?s[n]:[]}
function scoped(s,n,a,b){return rows(s,n).filter(r=>{const d=dateOf(r);return !d||(d>=a&&d<=b)})}
function count(a,ks){const o={};a.forEach(r=>{let k='Unspecified';for(const x of ks){if(String(r?.[x]||'').trim()){k=String(r[x]).trim();break}}o[k]=(o[k]||0)+1});return o}
function sum(a,ks){let t=0,f=0;a.forEach(r=>{for(const k of ks){const n=Number(r?.[k]);if(Number.isFinite(n)){t+=n;f++;break}}});return f?t:null}
function buildWeeklyReport(o){
 o=o||{};const a=String(o.period_start||o.start||'').slice(0,10),b=String(o.period_end||o.end||'').slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(a)||!/^\d{4}-\d{2}-\d{2}$/.test(b)||b<a)throw new Error('Invalid Weekly report period.');
 const s=o.source_data||o.source||{},missing=REQUIRED.filter(n=>!Array.isArray(s[n])),d={};
 REQUIRED.forEach(n=>d[n]=scoped(s,n,a,b));
 const ops=d.Operations,eq=d.Equipment,wf=d.WorkFront,ma=d.Maintenance,ix=d.Issues,pl=d.Plans,h=d.HSE,k=o.kpi||{status:'UNAVAILABLE'},v=missing.map(x=>({code:'SOURCE_UNAVAILABLE',domain:x,message:'Required Weekly source domain is unavailable: '+x}));
 if(k.status!=='READY')v.push({code:'KPI_NOT_READY',domain:'KPI',message:'KPI foundation status is '+k.status+'.'});
 const done=ops.filter(r=>['VALIDATED','COMPLETED','DONE','CLOSED'].includes(String(r.status||r.state||'').toUpperCase())),openI=ix.filter(r=>!CLOSED.includes(String(r.status||r.state||'').toUpperCase())),openP=pl.filter(r=>!CLOSED.includes(String(r.status||r.state||'').toUpperCase()));
 const section_data={
 'Executive Summary':{statement:'Weekly summary '+a+' -> '+b+'. Operations '+ops.length+'; completed '+done.length+'; open issues '+openI.length+'; open plans '+openP.length+'.'},
 'Planned vs Actual':{planned_records:pl.length,actual_records:ops.length,planned_by_status:count(pl,['status','state']),actual_by_status:count(ops,['status','state'])},
 'Equipment Performance':{record_count:eq.length,by_status:count(eq,['status','state']),kpi:{status:k.status,PA:k.PA??null,UA:k.UA??null,EU:k.EU??null}},
 'Work Front Progress':{record_count:wf.length,by_status:count(wf,['status','state'])},
 'HSE Summary':{record_count:h.length,by_severity:count(h,['severity','risk_level'])},
 'Maintenance and Downtime Analysis':{record_count:ma.length,downtime_hours:sum(ma,['actual_hours','downtime_hours','duration_hours','hours'])},
 'Material Movement Summary':{record_count:ops.length,quantity_total:sum(ops,['quantity','actual_quantity','movement_quantity'])},
 'Issues and Recurring Issues':{record_count:ix.length,open_count:openI.length,by_severity:count(ix,['severity','priority'])},
 'Outstanding Actions':{open_issue_count:openI.length,open_plan_count:openP.length},
 'KPI Trend':{current:{PA:k.PA??null,UA:k.UA??null,EU:k.EU??null,status:k.status},comparison_available:false},
 'Key Highlights':{operations:ops.length,completed:done.length,equipment:eq.length,workfront:wf.length,hse:h.length,maintenance:ma.length},
 'Top Management Concerns':{status:v.length?'VALIDATION REQUIRED':openI.length?'ATTENTION':'CLEAR'},
 'Recommended Actions':{status:v.length?'VALIDATION REQUIRED':'REVIEW'}
 };
 return Object.freeze({schema_version:'1.0',report_type:'WEEKLY',period:Object.freeze({start:a,end:b}),scope:o.scope||'ALL',status:v.length?'VALIDATION REQUIRED':'DRAFT',source_counts:Object.freeze(Object.fromEntries(REQUIRED.map(n=>[n,d[n].length]))),total_source_records:Object.values(d).reduce((n,x)=>n+x.length,0),metrics:Object.freeze({operations_completed:done.length,open_issues:openI.length,open_plans:openP.length}),kpi:Object.freeze({...k}),validation:Object.freeze({status:v.length?'VALIDATION REQUIRED':'READY',issue_count:v.length,issues:Object.freeze(v)}),sections:Object.freeze(['Executive Summary','Planned vs Actual','Equipment Performance','Work Front Progress','HSE Summary','Maintenance and Downtime Analysis','Material Movement Summary','Issues and Recurring Issues','Outstanding Actions','KPI Trend','Key Highlights','Top Management Concerns','Recommended Actions']),section_data:Object.freeze(section_data)})
}
global.LithositeWeeklyReport=Object.freeze({buildWeeklyReport,dateOf});
})(window);