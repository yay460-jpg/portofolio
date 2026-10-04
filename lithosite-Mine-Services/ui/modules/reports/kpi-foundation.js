(function (global) {
  'use strict';
  const center = global.LithositeKPIEngine;
  if (!center) throw new Error('LithositeKPIEngine is required before kpi-foundation.js');
  const VERSION = 'V35-KPI-FOUNDATION-E2E-0.1';
  const DEFAULT_BASELINE = Object.freeze({
    baseline_id: 'TB-PROJECT-DAY-0600-1800',
    version: '1.0',
    name: 'Project Default Day Shift',
    shift_start: '06:00',
    shift_end: '18:00',
    breaks: [{ start: '12:00', end: '13:00' }],
    effective_from: '2026-01-01',
    effective_to: null,
    status: 'PROJECT_DEFAULT',
    source: 'V34 Stage 23 prototype'
  });
  const TIME_BASELINES=Object.freeze([
    DEFAULT_BASELINE,
    Object.freeze({
      baseline_id:'TB-PROJECT-DAY-0700-1800',
      version:'1.0',
      name:'Project Alternate Day Shift',
      shift_start:'07:00',
      shift_end:'18:00',
      breaks:[{start:'12:00',end:'13:00'}],
      effective_from:'2026-01-01',
      effective_to:null,
      status:'ALTERNATE_POLICY',
      source:'V36 Console Policy Set — alternate work timeline; break carried from project baseline until site-specific override'
    })
  ]);
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function asNumber(value){const n=Number(value);return Number.isFinite(n)?n:null;}
  function parseDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d;}
  function localDateTime(date,time){if(!date||!time)return null;const d=new Date(String(date).slice(0,10)+'T'+String(time).slice(0,5)+':00');return Number.isNaN(d.getTime())?null:d;}
  function addHours(date,hours){return new Date(date.getTime()+Number(hours)*3600000);}
  function hoursBetween(a,b){return (b.getTime()-a.getTime())/3600000;}
  function intersects(a,b){return a.start<b.end&&b.start<a.end;}
  function baselineWindows(date,baseline){
    const start=localDateTime(date,baseline.shift_start);let end=localDateTime(date,baseline.shift_end);
    if(!start||!end)return[];if(end<=start)end=new Date(end.getTime()+86400000);
    const breaks=(Array.isArray(baseline.breaks)?baseline.breaks:[]).map(function(br){
      let bs=localDateTime(date,br.start),be=localDateTime(date,br.end);if(!bs||!be)return null;
      if(be<=bs)be=new Date(be.getTime()+86400000);return{start:bs,end:be};
    }).filter(Boolean).sort((a,b)=>a.start-b.start);
    const windows=[];let cursor=start;
    breaks.forEach(function(br){if(br.end<=start||br.start>=end)return;const bs=br.start<start?start:br.start;const be=br.end>end?end:br.end;if(bs>cursor)windows.push({start:cursor,end:bs,kind:'SCHEDULED'});cursor=be>cursor?be:cursor;});
    if(cursor<end)windows.push({start:cursor,end:end,kind:'SCHEDULED'});return windows;
  }
  function scheduledHours(windows){return windows.reduce((sum,w)=>sum+hoursBetween(w.start,w.end),0);}
  function stableStringify(value){
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(stableStringify).join(',')+']';
    return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stableStringify(value[key])).join(',')+'}';
  }
  function fingerprint(value){const text=stableStringify(value);let hash=2166136261;for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return('00000000'+(hash>>>0).toString(16)).slice(-8);}
  function sourceVersion(row){return'V'+fingerprint(row);}
  function sliceToWindows(event,windows){
    const slices=[];windows.forEach(function(window){if(!intersects(event,window))return;const start=event.start>window.start?event.start:window.start;const end=event.end<window.end?event.end:window.end;if(end>start)slices.push({start,end});});return slices;
  }
  function buildOperationSource(row){
    const actual=asNumber(row.actual_hours),start=localDateTime(row.transaction_date,row.transaction_time);
    if(!start||actual===null||actual<=0)return null;
    return{start,end:addHours(start,actual),event_id:'OPS:'+row.transaction_id,event_version:sourceVersion(row),equipment_id:row.equipment_id,source_entity:'Operations',source_id:row.transaction_id,source_reference:row.transaction_id,boundary_type:'DERIVED',formation_rule:'transaction_time + actual_hours',source_boundary:'transaction_time',source_duration_hours:actual,activity:row.activity||null,work_front_id:row.work_front_id||null,availability:center.AVAILABILITY.AVAILABLE,usage:center.USAGE.USED,effectiveness:center.EFFECTIVENESS.UNRESOLVED,validation_status:'VALID'};
  }
  function buildMaintenanceSource(row){
    const type=String(row.event_type||'').toLowerCase();
    if(type!=='breakdown'&&type!=='corrective')return null;
    if(String(row.status||'').toLowerCase()==='cancelled')return null;
    if(!row.start_time||!row.end_time)return{issue:{code:'MAINTENANCE_BOUNDARY_REQUIRED',eventId:row.maintenance_id||null,equipmentId:row.equipment_id||null}};
    const start=localDateTime(row.event_date,row.start_time);let end=localDateTime(row.event_date,row.end_time);
    if(!start||!end)return{issue:{code:'MAINTENANCE_BOUNDARY_INVALID',eventId:row.maintenance_id||null,equipmentId:row.equipment_id||null}};
    if(end<=start)end=new Date(end.getTime()+86400000);
    return{event:{start,end,event_id:'MNT:'+row.maintenance_id,event_version:sourceVersion(row),equipment_id:row.equipment_id,source_entity:'Maintenance',source_id:row.maintenance_id,source_reference:row.maintenance_id,boundary_type:'EXPLICIT',formation_rule:'maintenance.start_time/end_time',event_type:row.event_type,failure_code:row.failure_code||null,availability:center.AVAILABILITY.NOT_AVAILABLE,usage:center.USAGE.NOT_USED,effectiveness:center.EFFECTIVENESS.NOT_EFFECTIVE,validation_status:'VALID'}};
  }
  function buildEquipmentTimeline(input){
    const payload=input||{},date=String(payload.date||'').slice(0,10),equipmentId=payload.equipmentId,baseline=Object.assign({},DEFAULT_BASELINE,payload.baseline||{});
    if(!date)return{status:center.KPI_STATUS.INVALID_INPUT,issues:[{code:'REPORT_DATE_REQUIRED'}]};
    if(!equipmentId)return{status:center.KPI_STATUS.INVALID_INPUT,issues:[{code:'EQUIPMENT_ID_REQUIRED'}]};
    const windows=baselineWindows(date,baseline);if(!windows.length)return{status:center.KPI_STATUS.INVALID_INPUT,issues:[{code:'TIME_BASELINE_HAS_NO_SCHEDULED_WINDOW'}]};
    const issues=[],events=[];
    (payload.operations||[]).forEach(function(row){
      if(String(row.transaction_date||'').slice(0,10)!==date||String(row.status||'').toUpperCase()!=='VALIDATED'||String(row.equipment_id)!==String(equipmentId))return;
      const event=buildOperationSource(row);
      if(!event){issues.push({code:'OPERATIONS_DURATION_EVIDENCE_INVALID',eventId:row.transaction_id||null,equipmentId:row.equipment_id||null});return;}
      sliceToWindows(event,windows).forEach(function(slice,index){events.push(Object.assign({},event,{event_id:event.event_id+':S'+(index+1),start_time:slice.start.toISOString(),end_time:slice.end.toISOString(),_source_event_id:event.event_id,_durationHours:hoursBetween(slice.start,slice.end)}));});
    });
    (payload.maintenance||[]).forEach(function(row){
      if(String(row.event_date||'').slice(0,10)!==date||String(row.equipment_id)!==String(equipmentId))return;
      const result=buildMaintenanceSource(row);if(!result)return;if(result.issue){issues.push(result.issue);return;}
      sliceToWindows(result.event,windows).forEach(function(slice,index){events.push(Object.assign({},result.event,{event_id:result.event.event_id+':S'+(index+1),start_time:slice.start.toISOString(),end_time:slice.end.toISOString(),_source_event_id:result.event.event_id,_durationHours:hoursBetween(slice.start,slice.end)}));});
    });
    events.sort((a,b)=>new Date(a.start_time)-new Date(b.start_time));
    for(let i=1;i<events.length;i+=1){const previous=events[i-1],current=events[i];if(new Date(current.start_time)<new Date(previous.end_time))issues.push({code:'TIMELINE_OVERLAP',previousEventId:previous.event_id,eventId:current.event_id,from:current.start_time,to:previous.end_time});}
    windows.forEach(function(window){
      let cursor=window.start;
      const inside=events.filter(function(event){const start=parseDate(event.start_time),end=parseDate(event.end_time);return start&&end&&intersects({start,end},window);}).sort((a,b)=>new Date(a.start_time)-new Date(b.start_time));
      inside.forEach(function(event){const start=parseDate(event.start_time),end=parseDate(event.end_time),clippedStart=start<window.start?window.start:start,clippedEnd=end>window.end?window.end:end;if(clippedEnd<=clippedStart)return;if(clippedStart>cursor)issues.push({code:'TIMELINE_GAP',from:cursor.toISOString(),to:clippedStart.toISOString(),durationHours:hoursBetween(cursor,clippedStart),reason:'NO_EVIDENCE'});if(clippedEnd>cursor)cursor=clippedEnd;});
      if(cursor<window.end)issues.push({code:'TIMELINE_GAP',from:cursor.toISOString(),to:window.end.toISOString(),durationHours:hoursBetween(cursor,window.end),reason:'NO_EVIDENCE'});
    });
    return{status:issues.length?center.KPI_STATUS.NEEDS_VALIDATION:center.KPI_STATUS.READY,baseline:clone(baseline),windows:windows.map(w=>({start:w.start.toISOString(),end:w.end.toISOString(),kind:w.kind})),scheduledHours:scheduledHours(windows),events,issues,lineage:{equipmentId,date,sourceEntities:['Equipment','Operations','Maintenance'],eventCount:events.length}};
  }
  function calculateEquipment(input){
    const payload=input||{},timeline=buildEquipmentTimeline(payload);
    if(timeline.status!==center.KPI_STATUS.READY)return{equipmentId:payload.equipmentId||null,status:timeline.status,timeline,results:{PA:{kpi:'PA',status:timeline.status,value:null,unit:'%'},UA:{kpi:'UA',status:timeline.status,value:null,unit:'%'},EU:{kpi:'EU',status:center.KPI_STATUS.NEEDS_VALIDATION,value:null,unit:'%',reason:'Effective Time evidence is not validated.'}}};
    const bundle=center.calculateBundle({timeline:timeline.events,effectiveHours:payload.effectiveHours,timelineGaps:timeline.issues.filter(i=>i.code==='TIMELINE_GAP'),scheduledWindows:timeline.windows,scheduledTime:{status:center.KPI_STATUS.READY,scheduledHours:timeline.scheduledHours,baseline_id:timeline.baseline.baseline_id,version:timeline.baseline.version}});
    return{equipmentId:payload.equipmentId||null,status:bundle.status,timeline,results:bundle.results,calculationVersion:VERSION};
  }
  function calculateFleet(input){
    const payload=input||{},equipment=Array.isArray(payload.equipment)?payload.equipment:[];
    const policy=payload.policy||{};
    const euDenominator=policy.euDenominator==='SCHEDULED'?'SCHEDULED':'AVAILABLE';
    const effectiveTimeRule=policy.effectiveTimeRule==='STANDARD_CYCLE'?'STANDARD_CYCLE':'PURE_EFFECTIVE';
    const results=equipment.map(row=>calculateEquipment({
      equipmentId:row.equipment_id,
      date:payload.date,
      baseline:payload.baseline,
      effectiveHours:payload.effectiveHoursByEquipment?payload.effectiveHoursByEquipment[row.equipment_id]:undefined,
      operations:payload.operations,
      maintenance:payload.maintenance
    }));
    const eligible=results.filter(result=>result.results&&result.results.PA&&result.results.PA.status===center.KPI_STATUS.READY&&result.results.UA&&result.results.UA.status===center.KPI_STATUS.READY);
    const scheduled=eligible.reduce((sum,r)=>sum+Number(r.results.PA.denominatorHours||0),0);
    const available=eligible.reduce((sum,r)=>sum+Number(r.results.PA.numeratorHours||0),0);
    const used=eligible.reduce((sum,r)=>sum+Number(r.results.UA.numeratorHours||0),0);
    const exclusions=results.filter(r=>!eligible.includes(r)).map(r=>({equipmentId:r.equipmentId,status:r.status,issues:r.timeline&&r.timeline.issues?r.timeline.issues:[]}));
    const euReady=eligible.length>0&&eligible.every(r=>r.results&&r.results.EU&&r.results.EU.status===center.KPI_STATUS.READY);
    const effectiveHours=euReady?eligible.reduce((sum,r)=>sum+Number(r.results.EU.numeratorHours||0),0):0;
    let fleetEU={
      kpi:'EU',
      status:center.KPI_STATUS.NEEDS_VALIDATION,
      value:null,
      unit:'%',
      denominatorType:euDenominator,
      effectiveTimeRule:effectiveTimeRule
    };
    if(euReady){
      const denominatorHours=euDenominator==='SCHEDULED'?scheduled:available;
      if(!Number.isFinite(denominatorHours)||denominatorHours<=0){
        fleetEU.reason=(euDenominator==='SCHEDULED'?'Scheduled Time':'Available Time')+' is required and must be greater than zero.';
      }else if(effectiveHours>denominatorHours){
        fleetEU.reason='Effective Time cannot exceed the selected EU denominator.';
      }else{
        fleetEU={
          kpi:'EU',
          status:center.KPI_STATUS.READY,
          value:(effectiveHours/denominatorHours)*100,
          unit:'%',
          numeratorHours:effectiveHours,
          denominatorHours:denominatorHours,
          denominatorType:euDenominator,
          effectiveTimeRule:effectiveTimeRule,
          formulaId:euDenominator==='SCHEDULED'?'EU-EFFECTIVE-OVER-SCHEDULED':'EU-EFFECTIVE-OVER-AVAILABLE'
        };
      }
    }
    return{
      status:exclusions.length||!euReady?center.KPI_STATUS.NEEDS_VALIDATION:(eligible.length?center.KPI_STATUS.READY:center.KPI_STATUS.NEEDS_VALIDATION),
      date:payload.date,
      baseline:clone(payload.baseline||DEFAULT_BASELINE),
      policy:{
        baseline:clone(payload.baseline||DEFAULT_BASELINE),
        euDenominator:euDenominator,
        effectiveTimeRule:effectiveTimeRule
      },
      population:{total:equipment.length,eligible:eligible.length,excluded:exclusions.length},
      contributingHours:{scheduledHours:scheduled,availableHours:available,usedHours:used},
      results:{PA:eligible.length?center.calculatePA({scheduledHours:scheduled,availableHours:available}):null,UA:eligible.length?center.calculateUA({availableHours:available,usedHours:used}):null,EU:fleetEU},
      equipment:results,
      exclusions,
      calculationVersion:VERSION
    };
  }
  function buildSnapshot(input){
    const payload=input||{},calculation=payload.calculation;
    if(!calculation||!calculation.results)return{status:center.KPI_STATUS.INVALID_INPUT,reason:'CALCULATION_REQUIRED'};
    const eventVersions=[];(calculation.equipment||[]).forEach(e=>((e.timeline&&e.timeline.events)||[]).forEach(event=>eventVersions.push({event_id:event.event_id,source_entity:event.source_entity,source_id:event.source_id,version:event.event_version||'V1',validation_status:event.validation_status||'VALID'})));
    return{snapshot_version:'V35-KPI-SNAPSHOT-1',scope_type:payload.scopeType||'FLEET',scope_id:payload.scopeId||'FLEET:ALL',period_id:payload.periodId||calculation.date,status:calculation.status===center.KPI_STATUS.READY?'FINAL_CANDIDATE':calculation.status,calculation_version:calculation.calculationVersion||VERSION,policy:{id:'V34-PA-UA-BASELINE',version:'1.0',status:'PROJECT_DEFAULT'},kpi_policy:clone(calculation.policy||null),time_baseline:{id:calculation.baseline.baseline_id,version:calculation.baseline.version,status:calculation.baseline.status,shift_start:calculation.baseline.shift_start,shift_end:calculation.baseline.shift_end,breaks:clone(calculation.baseline.breaks)},result:{PA:calculation.results.PA,UA:calculation.results.UA,EU:calculation.results.EU},population:clone(calculation.population),contributing_hours:clone(calculation.contributingHours),event_versions:eventVersions,exclusions:clone(calculation.exclusions||[]),source_fingerprint:fingerprint({scope_id:payload.scopeId||'FLEET:ALL',period_id:payload.periodId||calculation.date,calculation_version:calculation.calculationVersion||VERSION,policy_version:'1.0',baseline_version:calculation.baseline.version,event_versions:eventVersions,result:calculation.results})};
  }
  async function finalizeSnapshot(snapshot){const rc=global.LithositeRuntimeClient;if(!rc)throw new Error('LithositeRuntimeClient is required for snapshot finalization');return rc.request({operation:'FINALIZE_KPI',snapshot});}
  async function listSnapshots(scopeId,periodId){const rc=global.LithositeRuntimeClient;if(!rc)throw new Error('LithositeRuntimeClient is required for KPI snapshot history');const result=await rc.request({operation:'READ_KPI_SNAPSHOTS',scope_id:scopeId||null,period_id:periodId||null});return Array.isArray(result.data)?result.data:[];}
  global.LithositeKPIFoundation=Object.freeze({VERSION,DEFAULT_BASELINE,TIME_BASELINES,baselineWindows,scheduledHours,buildEquipmentTimeline,calculateEquipment,calculateFleet,buildSnapshot,finalizeSnapshot,listSnapshots,fingerprint});
})(window);
