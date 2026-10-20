/* V38 Stage 32 — Validation + KPI Lineage. Pure validation layer. */
(function(global){
'use strict';
const REQUIRED=Object.freeze(['Operations','Equipment','WorkFront','Maintenance','Issues','Plans','HSE']);
function issue(code,message,domain){return Object.freeze({code,message,domain:domain||null});}
function validate(options){
  const o=options||{}, model=o.model||{}, source=o.source_data||{}, kpi=o.kpi||model.kpi||{};
  const issues=[];
  REQUIRED.forEach(d=>{if(!Array.isArray(source[d]) && !(Number(model.source_counts?.[d])>0 || Number(model.source_counts?.[d])===0)) issues.push(issue('SOURCE_UNAVAILABLE','Required source domain is unavailable: '+d,d));});
  if(!kpi || !kpi.status || ['READY','FINAL','ISSUED'].indexOf(String(kpi.status).toUpperCase())<0)
    issues.push(issue('KPI_NOT_READY','KPI result is not READY for report issue.','KPI'));
  const lineage=Object.freeze({
    source_snapshot_id:o.source_snapshot_id||model.lineage?.source_snapshot_id||null,
    kpi_snapshot_id:kpi.snapshot_id||model.lineage?.kpi_snapshot_id||null,
    period:model.period||null,
    scope:model.scope||'ALL',
    policy:kpi.policy||model.lineage?.kpi_policy||null,
    baseline:kpi.baseline||kpi.policy?.baseline||null,
    source_domains:Object.freeze(Object.keys(source).filter(Boolean).sort()),
    generated_from:'RuntimeAdapter → KPI Foundation → Report Engine'
  });
  return Object.freeze({status:issues.length?'VALIDATION REQUIRED':'READY',issue_count:issues.length,issues:Object.freeze(issues),lineage});
}
function apply(model,options){
  const result=validate({...(options||{}),model});
  const copy=JSON.parse(JSON.stringify(model||{}));
  copy.status=result.status==='READY'?'READY':'VALIDATION REQUIRED';
  copy.validation={status:result.status,issue_count:result.issue_count,issues:result.issues};
  copy.lineage={...(copy.lineage||{}),...result.lineage};
  return Object.freeze(copy);
}
global.LithositeReportValidation=Object.freeze({REQUIRED,validate,apply});
})(window);
