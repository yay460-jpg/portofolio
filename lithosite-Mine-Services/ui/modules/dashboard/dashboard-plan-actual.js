(function(global){'use strict';
function norm(v){return String(v??'').trim().toLowerCase().replace(/\s+/g,' ');}
function bounds(r){const p=String(r.period||''),m=/^(\d{4})-(\d{2})$/.exec(p);const start=String(r.start_date||(m?p+'-01':'')).slice(0,10);const end=String(r.end_date||(m?m[1]+'-'+m[2]+'-'+String(new Date(+m[1],+m[2],0).getDate()).padStart(2,'0'):'')).slice(0,10);return {start,end};}
function dateOK(d){return /^\d{4}-\d{2}-\d{2}$/.test(String(d||''));}
function calculate(plans,operations,context,today){
 const ps=Array.isArray(plans)?plans:[],ops=Array.isArray(operations)?operations:[],ctx=context||{scope:'ALL_DAYS',shift:'ALL'},todayKey=String(today||'');
 const todayScope=String(ctx.scope||'ALL_DAYS')==='TODAY',shift=String(ctx.shift||'ALL').toUpperCase();
 if(todayScope&&shift!=='ALL')return {status:'SHIFT_NOT_COMPARABLE',rows:[],note:'Target Plan has no shift allocation; shift-level comparison is unavailable.'};
 const scoped=ps.map((row,i)=>{const range=bounds(row);if(!dateOK(range.start)||!dateOK(range.end)||range.start>range.end)return null;const overlaps=!todayScope||(range.start<=todayKey&&range.end>=todayKey);if(!overlaps)return null;return {row,range,key:String(row.plan_id||'PLAN-'+i),contained:!todayScope||(range.start>=todayKey&&range.end<=todayKey)};}).filter(Boolean);
 const comparable=scoped.filter(x=>x.contained),keys=new Set(comparable.map(x=>x.key)),validated=ops.filter(r=>{const d=String(r.transaction_date||'').slice(0,10);return String(r.status||'').trim().toUpperCase()==='VALIDATED'&&dateOK(d)&&(!todayScope||d===todayKey);});
 const actual=new Map(comparable.map(x=>[x.key,0])),ambiguous=new Set();let ambiguousCount=0;
 function matches(op,item){const d=String(op.transaction_date||'').slice(0,10),p=item.row;if(!dateOK(d)||d<item.range.start||d>item.range.end)return false;if(norm(op.domain)!==norm(p.domain)||norm(op.activity)!==norm(p.activity)||norm(op.measurement)!==norm(p.measurement))return false;const wf=String(p.work_front_id||'').trim();return !wf||String(op.work_front_id||'').trim()===wf;}
 validated.forEach(op=>{const candidates=scoped.filter(x=>matches(op,x));if(candidates.length>1){ambiguousCount++;candidates.forEach(x=>ambiguous.add(x.key));return;}if(candidates.length!==1||!keys.has(candidates[0].key))return;const q=Number(op.quantity);if(Number.isFinite(q)&&q>=0)actual.set(candidates[0].key,(actual.get(candidates[0].key)||0)+q);});
 const targets={},actuals={},ambiguousUnits=new Set();
 comparable.forEach(x=>{const u=String(x.row.measurement||'Unspecified').trim()||'Unspecified',raw=x.row.target_quantity,t=raw===null||raw===undefined||raw===''?NaN:Number(raw);if(Number.isFinite(t)&&t>=0)targets[u]=(targets[u]||0)+t;if(ambiguous.has(x.key))ambiguousUnits.add(u);});
 Object.keys(targets).forEach(u=>{const group=comparable.filter(x=>(String(x.row.measurement||'Unspecified').trim()||'Unspecified')===u);actuals[u]=ambiguousUnits.has(u)?null:group.reduce((sum,x)=>sum+(actual.get(x.key)||0),0);});
 const rows=Object.keys(targets).sort().map(unit=>{const target=targets[unit],a=actuals[unit];return {unit,target,actual:a,variance:a===null?null:a-target,achievement:a===null||target<=0?null:a/target*100,remaining:a===null?null:Math.max(target-a,0)};});
 return {status:!comparable.length?'NO_COMPARABLE_PLAN':ambiguousCount?'AMBIGUOUS_PLAN_MATCH':rows.length?'READY':'NO_VALID_TARGET',rows,comparablePlanCount:comparable.length,unallocatedPlanCount:scoped.length-comparable.length,validatedOperationCount:validated.length,ambiguousOperationCount:ambiguousCount,note:todayScope?'Today view compares only Target Plans fully contained in today. Multi-day targets are not prorated.':'All-dates view compares each Target Plan across its full date range. Measurement units remain separate.'};
}
global.LithositeDashboardPlanActual=Object.freeze({calculate});
})(window);
