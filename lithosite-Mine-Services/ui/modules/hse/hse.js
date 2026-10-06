(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 14 HSE');

const state={rows:[],workfronts:[],status:'loading'};
const LISTS={domain:[],event_type:[],severity:[],status:[]};
let editId=null;
let runtimeReady=false;

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function setMsg(text,error){const el=document.getElementById('hseRuntimeMsg');if(el){el.textContent=text;el.classList.toggle('error',!!error);}}
function setMapMsg(text,error){const el=document.getElementById('hseMapMsg');if(el){el.textContent=text;el.classList.toggle('error',!!error);}}
function fillSelect(id,items,empty){
 const el=document.getElementById(id);if(!el)return;
 const cur=el.value;
 el.innerHTML='<option value="">'+esc(empty)+'</option>'+items.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');
 if(items.includes(cur))el.value=cur;
}
function fillWorkFrontSelect(id,empty){
 const el=document.getElementById(id);if(!el)return;
 const cur=el.value;
 el.innerHTML='<option value="">'+esc(empty)+'</option>'+
   state.workfronts.filter(x=>x.work_front_id).map(x=>{
     const label=x.work_front_id+(x.location?' — '+x.location:'');
     return '<option value="'+esc(x.work_front_id)+'">'+esc(label)+'</option>';
   }).join('');
 if(state.workfronts.some(x=>x.work_front_id===cur))el.value=cur;
}
function workFrontLabel(id){
 const x=state.workfronts.find(r=>String(r.work_front_id)===String(id));
 if(!x)return id||'';
 return x.location?(x.work_front_id+' — '+x.location):x.work_front_id;
}
async function loadLists(){
 const result=await rc.request({operation:'READ',entity:'_Lists'});
 const lists=(result.data&&typeof result.data==='object')?result.data:result;
 LISTS.domain=Array.isArray(lists.service_domain)?lists.service_domain:[];
 LISTS.event_type=Array.isArray(lists.hse_event_type)?lists.hse_event_type:[];
 LISTS.severity=Array.isArray(lists.hse_severity)?lists.hse_severity:[];
 LISTS.status=Array.isArray(lists.hse_status)?lists.hse_status:[];
 if(!LISTS.domain.length||!LISTS.event_type.length||!LISTS.severity.length||!LISTS.status.length){
   throw new Error('Controlled vocabulary _Lists is incomplete for HSE');
 }
 fillLists();
}
function fillLists(){
 fillSelect('hseDomainFilter',LISTS.domain,'All domains');
 fillWorkFrontSelect('hseWorkFrontFilter','All work fronts');
 fillSelect('hseEventTypeFilter',LISTS.event_type,'All event types');
 fillSelect('hseSeverityFilter',LISTS.severity,'All severity');
 fillSelect('hseStatusFilter',LISTS.status,'All status');
 fillSelect('f_hse_domain',LISTS.domain,'Select domain');
 fillWorkFrontSelect('f_hse_work_front','None');
 fillSelect('f_hse_event_type',LISTS.event_type,'Select event type');
 fillSelect('f_hse_severity',LISTS.severity,'Select severity');
 fillSelect('f_hse_action',LISTS.event_type,'Select action');
 fillSelect('f_hse_status',LISTS.status,'Select status');
}
async function load(){
 if(!state.rows.length){state.status='loading';render();}
 try{
  const health=await rc.health();
  runtimeReady=health.status==='READY';
  if(!runtimeReady)throw new Error('Runtime health is not READY');
  await loadLists();
  const wf=await rc.request({operation:'READ',entity:'WorkFront'});
  state.workfronts=Array.isArray(wf.data)?wf.data:[];
  fillLists();
  const result=await rc.request({operation:'READ',entity:'HSE'});
  state.rows=Array.isArray(result.data)?result.data:[];
  state.status='ready';render();
  setMsg('RuntimeAdapter connected — HSE persistence is offline-first and audit-backed.');
 }catch(e){
  runtimeReady=false;state.status='error';render();
  const detail=e&&e.message?e.message:String(e);
  setMsg('Runtime unavailable: '+detail+'. Start desktop-host/server.py.',true);
 }
}
async function refreshData(){
 try{
  const result=await rc.request({operation:'READ',entity:'HSE'});
  state.rows=Array.isArray(result.data)?result.data:[];state.status='ready';render();
 }catch(e){setMsg('Refresh failed: '+e.message,true);}
}
function filtered(){
 const id=document.getElementById('hseIdFilter').value.trim().toLowerCase();
 const domain=document.getElementById('hseDomainFilter').value;
 const wf=document.getElementById('hseWorkFrontFilter').value;
 const type=document.getElementById('hseEventTypeFilter').value;
 const severity=document.getElementById('hseSeverityFilter').value;
 const status=document.getElementById('hseStatusFilter').value;
 return state.rows.filter(r=>
  (!id||String(r.hse_id||'').toLowerCase().includes(id))&&
  (!domain||r.domain===domain)&&
  (!wf||r.work_front_id===wf)&&
  (!type||r.event_type===type)&&
  (!severity||r.severity===severity)&&
  (!status||r.status===status)
 );
}
function statusClass(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')||'status';}
function severityClass(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')||'severity';}
function render(){
 const host=document.getElementById('hseRows');if(!host)return;
 if(state.status==='loading')host.innerHTML='<div class="empty">Loading HSE from RuntimeAdapter…</div>';
 else if(state.status==='error')host.innerHTML='<div class="empty">HSE data unavailable. Check RuntimeAdapter connection and use Refresh.</div>';
 else{
  const rows=filtered();
  host.innerHTML=rows.length?rows.map(r=>'<div class="hsetr td">'+
   '<div class="cell">'+esc(r.hse_id)+'</div>'+
   '<div class="cell">'+esc(r.event_date)+'</div>'+
   '<div class="cell">'+esc(r.domain)+'</div>'+
   '<div class="cell">'+esc(workFrontLabel(r.work_front_id))+'</div>'+
   '<div class="cell">'+esc(r.event_type)+'</div>'+
   '<div class="cell"><span class="statuspill '+severityClass(r.severity)+'">'+esc(r.severity)+'</span></div>'+
   '<div class="cell hse-description" title="'+esc(r.description)+'">'+esc(r.description)+'</div>'+
   '<div class="cell">'+esc(r.action)+'</div>'+
   '<div class="cell"><span class="statuspill '+statusClass(r.status)+'">'+esc(r.status)+'</span></div>'+
   '<div class="cell">'+esc(r.closed_at)+'</div>'+
   '<div class="cell row-actions"><button class="control mini show-map-hse" data-id="'+esc(r.hse_id)+'">Show on Map</button><button class="control mini edit-hse" data-id="'+esc(r.hse_id)+'">Edit</button><button class="control mini danger delete-hse" data-id="'+esc(r.hse_id)+'">Delete</button></div>'+
  '</div>').join(''):'<div class="empty">No HSE records match the current filters.</div>';
  document.getElementById('hseCount').textContent=rows.length+' records · Runtime Ready';
 }
 if(state.status==='loading')document.getElementById('hseCount').textContent='Loading · Runtime Connecting';
 if(state.status==='error')document.getElementById('hseCount').textContent='Unavailable · Runtime Error';
}
function nowLocalDate(){
 const now=new Date();
 return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function nowLocalDateTime(){
 const now=new Date();
 return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
function syncClosedAtField(){
 const status=document.getElementById('f_hse_status').value;
 const closed=document.getElementById('f_hse_closed_at');
 if(!closed)return;
 if(status==='Closed'){
  closed.disabled=false;
  if(!closed.value)closed.value=nowLocalDateTime();
 }else{
  closed.value='';
  closed.disabled=true;
 }
}
function resetForm(){
 const d=nowLocalDate();
 document.getElementById('f_hse_id').value='HSE-'+d.replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 document.getElementById('f_hse_event_date').value=d;
 document.getElementById('f_hse_domain').value=LISTS.domain[0]||'';
 document.getElementById('f_hse_work_front').value='';
 document.getElementById('f_hse_event_type').value=LISTS.event_type[0]||'';
 document.getElementById('f_hse_severity').value=LISTS.severity.includes('Medium')?'Medium':(LISTS.severity[0]||'');
 document.getElementById('f_hse_description').value='';
 document.getElementById('f_hse_action').value=LISTS.event_type[0]||'';
 document.getElementById('f_hse_status').value=LISTS.status.includes('Open')?'Open':(LISTS.status[0]||'');
 document.getElementById('f_hse_closed_at').value='';
 syncClosedAtField();
}
function openAdd(){
 editId=null;
 document.getElementById('hseModalTitle').textContent='Add HSE Event';
 document.getElementById('hseSave').textContent='Save via RuntimeAdapter';
 resetForm();
 if(global.LithositeModalShowContract){global.LithositeModalShowContract.show('hseModal');}else{document.getElementById('hseModal').classList.add('show')};
}
function openEdit(id){
 const row=state.rows.find(x=>String(x.hse_id)===String(id));if(!row)return;
 editId=id;
 document.getElementById('hseModalTitle').textContent='Edit HSE Event';
 document.getElementById('hseSave').textContent='Update via RuntimeAdapter';
 const map={
  f_hse_id:row.hse_id,f_hse_event_date:row.event_date,f_hse_domain:row.domain,
  f_hse_work_front:row.work_front_id,f_hse_event_type:row.event_type,
  f_hse_severity:row.severity,f_hse_description:row.description,
  f_hse_action:row.action,f_hse_status:row.status,
  f_hse_closed_at:row.closed_at?String(row.closed_at).slice(0,16):''
 };
 Object.entries(map).forEach(([id,v])=>document.getElementById(id).value=v??'');
 syncClosedAtField();
 if(global.LithositeModalShowContract){global.LithositeModalShowContract.show('hseModal');}else{document.getElementById('hseModal').classList.add('show')};
}
function payload(){
 const status=document.getElementById('f_hse_status').value;
 return {
  hse_id:document.getElementById('f_hse_id').value,
  event_date:document.getElementById('f_hse_event_date').value,
  domain:document.getElementById('f_hse_domain').value,
  work_front_id:document.getElementById('f_hse_work_front').value||null,
  event_type:document.getElementById('f_hse_event_type').value,
  severity:document.getElementById('f_hse_severity').value,
  description:document.getElementById('f_hse_description').value.trim(),
  action:document.getElementById('f_hse_action').value,
  status,
  closed_at:document.getElementById('f_hse_closed_at').value||null
 };
}
async function save(){
 if(!runtimeReady){setMsg('RuntimeAdapter is not connected. Start desktop-host/server.py first.',true);return;}
 const row=payload();
 if(!row.event_date||!row.domain||!row.event_type||!row.severity||!row.description||!row.action||!row.status){
  setMsg('Event Date, Domain, Event Type, Severity, Description, Action and Status are required.',true);return;
 }
 if(row.status==='Closed'&&!row.closed_at){
  setMsg('Closed At is required when Status is Closed.',true);return;
 }
 try{
  const result=editId?await rc.request({operation:'UPDATE',entity:'HSE',entity_id:editId,patch:row}):await rc.request({operation:'CREATE',entity:'HSE',row});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Runtime rejected the HSE record');
  document.getElementById('hseModal').classList.remove('show');
  await refreshData();
  setMsg(editId?'HSE event updated and audited.':'HSE event created and audited.');
 }catch(e){setMsg('Validation/runtime error: '+e.message,true);}
}
async function remove(id){
 if(!confirm('Delete HSE event '+id+'?\nRuntime will validate references and audit the mutation.'))return;
 try{
  const result=await rc.request({operation:'DELETE',entity:'HSE',entity_id:id});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');
  await refreshData();setMsg('HSE event deleted and audited.');
 }catch(e){setMsg('Delete failed: '+e.message,true);}
}
function bind(){
 document.getElementById('hseAdd').onclick=openAdd;
 document.getElementById('hseRefresh').onclick=load;
 document.getElementById('hseSave').onclick=save;
 document.getElementById('hseClose').onclick=()=>document.getElementById('hseModal').classList.remove('show');
 document.getElementById('hseCancel').onclick=()=>document.getElementById('hseModal').classList.remove('show');
 document.getElementById('hseClear').onclick=()=>{
  ['hseIdFilter','hseDomainFilter','hseWorkFrontFilter','hseEventTypeFilter','hseSeverityFilter','hseStatusFilter'].forEach(id=>document.getElementById(id).value='');
  render();
 };
 ['hseIdFilter','hseDomainFilter','hseWorkFrontFilter','hseEventTypeFilter','hseSeverityFilter','hseStatusFilter'].forEach(id=>{
  const e=document.getElementById(id);e.addEventListener('input',render);e.addEventListener('change',render);
 });
 document.getElementById('f_hse_status').addEventListener('change',syncClosedAtField);
 document.getElementById('hseRows').addEventListener('click',e=>{
  const showMap=e.target.closest('.show-map-hse');if(showMap){
   const api=global.MineServicesMarkerLocation;
   const result=api&&typeof api.showDomainRecordOnMap==='function'?api.showDomainRecordOnMap('HSE',showMap.dataset.id):{ok:false,status:'MAP_INTERACTION_UNAVAILABLE'};
   setMapMsg(result.ok?'HSE '+showMap.dataset.id+' shown on Map.':'Spatial location not assigned for HSE '+showMap.dataset.id+'.',!result.ok);
   return;
  }
  const edit=e.target.closest('.edit-hse');if(edit)openEdit(edit.dataset.id);
  const del=e.target.closest('.delete-hse');if(del)remove(del.dataset.id);
 });
}
function init(){if(!document.getElementById('hseScreen'))return;if(document.getElementById('hseAdd'))bind();load();}
document.addEventListener('mine-services:open-domain-record',function(event){
 const detail=event&&event.detail||{};
 if(detail.source_entity!=='HSE'||!detail.source_id)return;
 if(global.LithositeShellNavigation)global.LithositeShellNavigation.setScreen('HSE');
 setTimeout(function(){openEdit(detail.source_id);},0);
});
if(global.LithositeDataSync)global.LithositeDataSync.register('HSE',refreshData);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

global.LithositeHSE=Object.freeze({
 entity:'HSE',
 readAll:()=>rc.request({operation:'READ',entity:'HSE'}),
 getLists:()=>rc.request({operation:'READ',entity:'_Lists'}),
 create:(row)=>rc.request({operation:'CREATE',entity:'HSE',row}),
 update:(id,patch)=>rc.request({operation:'UPDATE',entity:'HSE',entity_id:id,patch}),
 delete:(id)=>rc.request({operation:'DELETE',entity:'HSE',entity_id:id})
});
})(window);
