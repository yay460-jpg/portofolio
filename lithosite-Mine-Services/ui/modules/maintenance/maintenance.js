(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 11 Maintenance');
const state={rows:[],equipment:[],status:'loading'};
let editId=null;
let runtimeReady=false;
let activeTimelineKey=null;
const LISTS={event_type:[],status:[],action:[]};
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function setMsg(text,error){const el=document.getElementById('maintenanceRuntimeMsg');if(el){el.textContent=text;el.classList.toggle('error',!!error);}}
function fillSelect(id,items,empty){const el=document.getElementById(id);if(!el)return;const cur=el.value;el.innerHTML='<option value="">'+esc(empty)+'</option>'+items.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');if(items.includes(cur))el.value=cur;}
async function loadLists(){const result=await rc.request({operation:'READ',entity:'_Lists'});const lists=(result.data&&typeof result.data==='object')?result.data:result;LISTS.event_type=Array.isArray(lists.maintenance_event_type)?lists.maintenance_event_type:[];LISTS.status=Array.isArray(lists.maintenance_status)?lists.maintenance_status:[];LISTS.action=Array.isArray(lists.maintenance_event_type)?lists.maintenance_event_type:[];if(!LISTS.event_type.length||!LISTS.status.length)throw new Error('Controlled vocabulary _Lists is incomplete for Maintenance');fillLists();}
function fillEquipmentSelect(id,empty){const el=document.getElementById(id);if(!el)return;const cur=el.value;el.innerHTML='<option value="">'+esc(empty)+'</option>'+state.equipment.filter(x=>x.equipment_id).map(x=>{const label=x.unit_no?(x.unit_no+' — '+(x.type||'Equipment')):x.equipment_id;return '<option value="'+esc(x.equipment_id)+'">'+esc(label)+'</option>';}).join('');if(state.equipment.some(x=>x.equipment_id===cur))el.value=cur;}
function equipmentLabel(id){const x=state.equipment.find(r=>String(r.equipment_id)===String(id));if(!x)return id;return x.unit_no?(x.unit_no+' — '+(x.type||'Equipment')):x.equipment_id;}
function fillLists(){fillSelect('maintenanceEventTypeFilter',LISTS.event_type,'All event types');fillSelect('maintenanceStatusFilter',LISTS.status,'All status');fillEquipmentSelect('maintenanceEquipmentFilter','All equipment');fillEquipmentSelect('f_maintenance_equipment','Select equipment');fillSelect('f_maintenance_event_type',LISTS.event_type,'Select event type');fillSelect('f_maintenance_action',LISTS.action,'Select action');fillSelect('f_maintenance_status',LISTS.status,'Select status');}
async function load(){if(!state.rows.length){state.status='loading';render();}try{const health=await rc.health();runtimeReady=health.status==='READY';if(!runtimeReady)throw new Error('Runtime health is not READY');await loadLists();const eq=await rc.request({operation:'READ',entity:'Equipment'});state.equipment=Array.isArray(eq.data)?eq.data:[];fillLists();const result=await rc.request({operation:'READ',entity:'Maintenance'});state.rows=Array.isArray(result.data)?result.data:[];state.status='ready';render();setMsg('RuntimeAdapter connected — Maintenance persistence is offline-first and audit-backed.');}catch(e){runtimeReady=false;state.status='error';render();setMsg('Runtime unavailable: '+e.message+'. Start desktop-host/server.py.',true);}}
async function refreshData(){
 try{
  const result=await rc.request({operation:'READ',entity:'Maintenance'});
  state.rows=Array.isArray(result.data)?result.data:[];state.status='ready';render();
 }catch(e){setMsg('Refresh failed: '+e.message,true);}
}
function filtered(){const id=document.getElementById('maintenanceIdFilter').value.trim().toLowerCase();const eq=document.getElementById('maintenanceEquipmentFilter').value;const type=document.getElementById('maintenanceEventTypeFilter').value;const status=document.getElementById('maintenanceStatusFilter').value;const source=document.getElementById('maintenanceSourceFilter').value.trim().toLowerCase();return state.rows.filter(r=>(!id||String(r.maintenance_id||'').toLowerCase().includes(id))&&(!eq||r.equipment_id===eq)&&(!type||r.event_type===type)&&(!status||r.status===status)&&(!source||String(r.source||'').toLowerCase().includes(source)));}
function maintenanceGroups(rows){
 const groups=new Map();
 rows.forEach(function(row){
  const equipmentId=String(row.equipment_id||'').trim();
  const key=String(row.event_date||'')+'|'+(equipmentId||'NO-EQUIPMENT|'+String(row.maintenance_id||''));
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(row);
 });
 const grouped=Array.from(groups.values()).map(function(items){
  items.sort(function(a,b){return String(a.start_time||'').localeCompare(String(b.start_time||''));});
  return items;
 });
 grouped.sort(function(a,b){
  const ad=String(a[0]?.event_date||''),bd=String(b[0]?.event_date||'');
  if(ad!==bd)return ad.localeCompare(bd);
  const at=String(a[0]?.start_time||''),bt=String(b[0]?.start_time||'');
  if(at!==bt)return at.localeCompare(bt);
  return String(a[0]?.equipment_id||'').localeCompare(String(b[0]?.equipment_id||''));
 });
 return grouped;
}
function openMaintenanceTimeline(key){
 activeTimelineKey=key;
 const rows=state.rows.filter(function(row){
  const equipmentId=String(row.equipment_id||'').trim();
  return String(row.event_date||'')+'|'+(equipmentId||'NO-EQUIPMENT|'+String(row.maintenance_id||''))===key;
 }).sort(function(a,b){return String(a.start_time||'').localeCompare(String(b.start_time||''));});
 if(!rows.length)return;
 const first=rows[0];
 const equipment=state.equipment.find(function(item){return String(item.equipment_id||'')===String(first.equipment_id||'');});
 document.getElementById('maintenanceTimelineTitle').textContent='Maintenance Timeline — '+(equipment?.unit_no||first.equipment_id||'Unassigned');
 document.getElementById('maintenanceTimelineMeta').textContent=String(first.event_date||'—')+' · '+rows.length+' events · '+rows.reduce(function(sum,row){return sum+(Number(row.downtime_hours)||0);},0)+' downtime hrs';
 document.getElementById('maintenanceTimelineSummary').innerHTML='<span><b>Equipment</b> '+esc(equipment?.unit_no||first.equipment_id||'—')+'</span><span><b>Type</b> '+esc(equipment?.type||'—')+'</span><span><b>Status</b> '+esc(equipment?.status||'—')+'</span>';
 document.getElementById('maintenanceTimelineRows').innerHTML=rows.map(function(row){
  const cls=String(row.status||'').toLowerCase().replace(/[^a-z]/g,'')||'open';
  return '<div class="maintenance-timeline-tr"><div class="cell">'+esc(row.start_time||'—')+'</div><div class="cell">'+esc(row.end_time||'—')+'</div><div class="cell">'+esc(row.event_type)+'</div><div class="cell">'+esc(row.failure_code||'—')+'</div><div class="cell">'+esc(row.downtime_hours??'—')+'</div><div class="cell">'+esc(row.action)+'</div><div class="cell"><span class="statuspill '+cls+'">'+esc(row.status)+'</span></div><div class="cell">'+esc(row.source)+'</div><div class="cell row-actions"><button class="control mini edit-maintenance-timeline" data-id="'+esc(row.maintenance_id)+'">Edit</button><button class="control mini danger delete-maintenance-timeline" data-id="'+esc(row.maintenance_id)+'">Delete</button></div></div>';
 }).join('');
 if(global.LithositeModalShowContract){global.LithositeModalShowContract.show('maintenanceTimelineModal');}else{document.getElementById('maintenanceTimelineModal').classList.add('show')};
}
function render(){
 const host=document.getElementById('maintenanceRows');
 if(!host)return;
 if(state.status==='loading')host.innerHTML='<div class="empty">Loading Maintenance from RuntimeAdapter…</div>';
 else if(state.status==='error')host.innerHTML='<div class="empty">Maintenance data unavailable. Check RuntimeAdapter connection and use Refresh.</div>';
 else{
  const rows=filtered().slice().sort(function(a,b){return String(a.event_date||'').localeCompare(String(b.event_date||''))||String(a.start_time||'').localeCompare(String(b.start_time||''))||String(a.equipment_id||'').localeCompare(String(b.equipment_id||''))||String(a.maintenance_id||'').localeCompare(String(b.maintenance_id||''));});
  const groups=maintenanceGroups(rows);
  host.innerHTML=groups.length?groups.map(function(items){
   const first=items[0];
   const equipment=state.equipment.find(function(item){return String(item.equipment_id||'')===String(first.equipment_id||'');});
   const key=esc(String(first.event_date||'')+'|'+(String(first.equipment_id||'').trim()||'NO-EQUIPMENT|'+String(first.maintenance_id||'')));
   const statuses=Array.from(new Set(items.map(function(row){return String(row.status||'');})));
   const status=statuses.length===1?statuses[0]:'MIXED';
   const cls=status.toLowerCase().replace(/[^a-z]/g,'')||'open';
   const downtime=items.reduce(function(sum,row){return sum+(Number(row.downtime_hours)||0);},0);
   return '<div class="tr td maintenance-trace-row" data-trace-key="'+key+'"><div class="cell">'+esc(first.event_date)+'</div><div class="cell">'+esc(equipment?.unit_no||first.equipment_id||'—')+'</div><div class="cell">'+esc(equipment?.type||'—')+'</div><div class="cell"><button class="control mini maintenance-timeline-row" data-key="'+key+'" data-trace-key="'+key+'">'+items.length+' event'+(items.length===1?'':'s')+'</button></div><div class="cell">'+esc(downtime||'—')+'</div><div class="cell"><span class="statuspill '+cls+'">'+esc(status)+'</span></div><div class="cell row-actions"><button class="control mini maintenance-timeline-row" data-key="'+key+'">View</button></div></div>';
  }).join(''):'<div class="empty">No Maintenance records match the current filters.</div>';
  document.getElementById('maintenanceCount').textContent=groups.length+' maintenance timelines · '+rows.length+' events · Runtime Ready';
 }
 if(state.status==='loading')document.getElementById('maintenanceCount').textContent='Loading · Runtime Connecting';
 if(state.status==='error')document.getElementById('maintenanceCount').textContent='Unavailable · Runtime Error';
}
function focusTrace(target) {
 const date=String(target&&target.date||'');
 const equipmentId=String(target&&target.equipmentId||'').trim();
 if(!equipmentId)return;
 const filter=document.getElementById('maintenanceEquipmentFilter');
 if(filter)filter.value=equipmentId;
 render();
 const key=date+'|'+equipmentId;
 const buttons=Array.from(document.querySelectorAll('#maintenanceRows .maintenance-timeline-row'));
 const targetButtons=buttons.filter(function(button){return String(button.dataset.traceKey||'')===key;});
 targetButtons.forEach(function(button){
  button.classList.remove('trace-highlight');
  void button.offsetWidth;
  button.classList.add('trace-highlight');
 });
 if(targetButtons.length){
  const row=targetButtons[0].closest('.tr');
  if(row)row.scrollIntoView({behavior:'smooth',block:'center'});
 }
 window.setTimeout(function(){
  targetButtons.forEach(function(button){button.classList.remove('trace-highlight');});
 },2400);
}

function resetForm(){const now=new Date();const d=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);document.getElementById('f_maintenance_id').value='MNT-'+d.replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();document.getElementById('f_maintenance_equipment').value=state.equipment[0]?.equipment_id||'';document.getElementById('f_maintenance_event_date').value=d;document.getElementById('f_maintenance_event_type').value=LISTS.event_type[0]||'';document.getElementById('f_maintenance_failure_code').value='';document.getElementById('f_maintenance_start_time').value='';document.getElementById('f_maintenance_end_time').value='';document.getElementById('f_maintenance_downtime_hours').value='';document.getElementById('f_maintenance_action').value=LISTS.action[0]||'';document.getElementById('f_maintenance_status').value=LISTS.status.includes('Open')?'Open':(LISTS.status[0]||'');document.getElementById('f_maintenance_source').value='Manual';}
function openAdd(){editId=null;document.getElementById('maintenanceModalTitle').textContent='Add Maintenance';document.getElementById('maintenanceSave').textContent='Save via RuntimeAdapter';resetForm();if(global.LithositeModalShowContract){global.LithositeModalShowContract.show('maintenanceModal');}else{document.getElementById('maintenanceModal').classList.add('show')};}
function openEdit(id){const row=state.rows.find(x=>String(x.maintenance_id)===String(id));if(!row)return;editId=id;document.getElementById('maintenanceModalTitle').textContent='Edit Maintenance';document.getElementById('maintenanceSave').textContent='Update via RuntimeAdapter';const map={f_maintenance_id:row.maintenance_id,f_maintenance_equipment:row.equipment_id,f_maintenance_event_date:row.event_date,f_maintenance_event_type:row.event_type,f_maintenance_failure_code:row.failure_code,f_maintenance_start_time:row.start_time,f_maintenance_end_time:row.end_time,f_maintenance_downtime_hours:row.downtime_hours,f_maintenance_action:row.action,f_maintenance_status:row.status,f_maintenance_source:row.source};Object.entries(map).forEach(([id,v])=>document.getElementById(id).value=v??'');if(global.LithositeModalShowContract){global.LithositeModalShowContract.show('maintenanceModal');}else{document.getElementById('maintenanceModal').classList.add('show')};}
function payload(){return {maintenance_id:document.getElementById('f_maintenance_id').value,equipment_id:document.getElementById('f_maintenance_equipment').value,event_date:document.getElementById('f_maintenance_event_date').value,event_type:document.getElementById('f_maintenance_event_type').value,failure_code:document.getElementById('f_maintenance_failure_code').value,start_time:document.getElementById('f_maintenance_start_time').value||null,end_time:document.getElementById('f_maintenance_end_time').value||null,downtime_hours:document.getElementById('f_maintenance_downtime_hours').value===''?null:Number(document.getElementById('f_maintenance_downtime_hours').value),action:document.getElementById('f_maintenance_action').value,status:document.getElementById('f_maintenance_status').value,source:document.getElementById('f_maintenance_source').value};}
async function save(){if(!runtimeReady){setMsg('RuntimeAdapter is not connected. Start desktop-host/server.py first.',true);return;}const row=payload();if(!row.equipment_id||!row.event_date||!row.event_type||!row.action||!row.status){setMsg('Equipment, Event Date, Event Type, Action and Status are required.',true);return;}try{const wasEditing=Boolean(editId);const savedTimelineKey=activeTimelineKey;const result=editId?await rc.request({operation:'UPDATE',entity:'Maintenance',entity_id:editId,patch:row}):await rc.request({operation:'CREATE',entity:'Maintenance',row});if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Runtime rejected the Maintenance record');document.getElementById('maintenanceModal').classList.remove('show');await refreshData();if(wasEditing&&savedTimelineKey){const savedKey=String(row.event_date||'')+'|'+(String(row.equipment_id||'').trim()||'NO-EQUIPMENT|'+String(row.maintenance_id||''));openMaintenanceTimeline(savedKey);}else{activeTimelineKey=null;}setMsg(wasEditing?'Maintenance updated and audited.':'Maintenance created and audited.');}catch(e){setMsg('Validation/runtime error: '+e.message,true);}}
async function remove(id){if(!confirm('Delete Maintenance '+id+'?\nRuntime will validate references and audit the mutation.'))return;try{const result=await rc.request({operation:'DELETE',entity:'Maintenance',entity_id:id});if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');await refreshData();setMsg('Maintenance deleted and audited.');}catch(e){setMsg('Delete failed: '+e.message,true);}}
function bind(){
 document.getElementById('maintenanceAdd').onclick=openAdd;
 document.getElementById('maintenanceRefresh').onclick=load;
 document.getElementById('maintenanceSave').onclick=save;
 document.getElementById('maintenanceClose').onclick=()=>document.getElementById('maintenanceModal').classList.remove('show');
 document.getElementById('maintenanceCancel').onclick=()=>document.getElementById('maintenanceModal').classList.remove('show');
 document.getElementById('maintenanceClear').onclick=()=>{['maintenanceIdFilter','maintenanceEquipmentFilter','maintenanceEventTypeFilter','maintenanceStatusFilter','maintenanceSourceFilter'].forEach(id=>document.getElementById(id).value='');render();};
 ['maintenanceIdFilter','maintenanceEquipmentFilter','maintenanceEventTypeFilter','maintenanceStatusFilter','maintenanceSourceFilter'].forEach(id=>{const e=document.getElementById(id);e.addEventListener('input',render);e.addEventListener('change',render);});
 document.getElementById('maintenanceRows').addEventListener('click',function(e){
  const timeline=e.target.closest('.maintenance-timeline-row');
  if(timeline){openMaintenanceTimeline(timeline.dataset.key);return;}
  const edit=e.target.closest('.edit-maintenance');if(edit)openEdit(edit.dataset.id);
  const del=e.target.closest('.delete-maintenance');if(del)remove(del.dataset.id);
 });
 document.getElementById('maintenanceTimelineClose').onclick=function(){document.getElementById('maintenanceTimelineModal').classList.remove('show');activeTimelineKey=null;};
 document.getElementById('maintenanceTimelineRows').addEventListener('click',function(e){
  const edit=e.target.closest('.edit-maintenance-timeline');
  if(edit){document.getElementById('maintenanceTimelineModal').classList.remove('show');openEdit(edit.dataset.id);return;}
  const del=e.target.closest('.delete-maintenance-timeline');
  if(del)remove(del.dataset.id);
 });
}
function init(){if(!document.getElementById('maintenanceScreen'))return;if(document.getElementById('maintenanceAdd'))bind();load();}
if(global.LithositeDataSync)global.LithositeDataSync.register('Maintenance',refreshData);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
global.LithositeMaintenance=Object.freeze({entity:'Maintenance',focusTrace,readAll:()=>rc.request({operation:'READ',entity:'Maintenance'}),getLists:()=>rc.request({operation:'READ',entity:'_Lists'}),create:(row)=>rc.request({operation:'CREATE',entity:'Maintenance',row}),update:(id,patch)=>rc.request({operation:'UPDATE',entity:'Maintenance',entity_id:id,patch}),delete:(id)=>rc.request({operation:'DELETE',entity:'Maintenance',entity_id:id})});
})(window);
