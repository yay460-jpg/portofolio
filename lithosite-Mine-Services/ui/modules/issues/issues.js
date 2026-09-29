(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 12 Issues');

const state={rows:[],workfronts:[],equipment:[],status:'loading'};
let editId=null;
let runtimeReady=false;
const LISTS={domain:[],severity:[],status:[]};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function setMsg(text,error){const el=document.getElementById('issuesRuntimeMsg');if(el){el.textContent=text;el.classList.toggle('error',!!error);}}
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
function fillEquipmentSelect(id,empty){
 const el=document.getElementById(id);if(!el)return;
 const cur=el.value;
 el.innerHTML='<option value="">'+esc(empty)+'</option>'+
   state.equipment.filter(x=>x.equipment_id).map(x=>{
     const label=x.unit_no?(x.unit_no+' — '+(x.type||'Equipment')):x.equipment_id;
     return '<option value="'+esc(x.equipment_id)+'">'+esc(label)+'</option>';
   }).join('');
 if(state.equipment.some(x=>x.equipment_id===cur))el.value=cur;
}
function workFrontLabel(id){
 const x=state.workfronts.find(r=>String(r.work_front_id)===String(id));
 if(!x)return id||'';
 return x.location?(x.work_front_id+' — '+x.location):x.work_front_id;
}
function equipmentLabel(id){
 const x=state.equipment.find(r=>String(r.equipment_id)===String(id));
 if(!x)return id||'';
 return x.unit_no?(x.unit_no+' — '+(x.type||'Equipment')):x.equipment_id;
}
async function loadLists(){
 const result=await rc.request({operation:'READ',entity:'_Lists'});
 const lists=(result.data&&typeof result.data==='object')?result.data:result;
 LISTS.domain=Array.isArray(lists.service_domain)?lists.service_domain:[];
 LISTS.severity=Array.isArray(lists.issue_severity)?lists.issue_severity:[];
 LISTS.status=Array.isArray(lists.issue_status)?lists.issue_status:[];
 if(!LISTS.domain.length||!LISTS.severity.length||!LISTS.status.length)throw new Error('Controlled vocabulary _Lists is incomplete for Issues');
 fillLists();
}
function fillLists(){
 fillSelect('issuesDomainFilter',LISTS.domain,'All domains');
 fillSelect('issuesSeverityFilter',LISTS.severity,'All severity');
 fillSelect('issuesStatusFilter',LISTS.status,'All status');
 fillWorkFrontSelect('issuesWorkFrontFilter','All work fronts');
 fillEquipmentSelect('issuesEquipmentFilter','All equipment');
 fillSelect('f_issue_domain',LISTS.domain,'Select domain');
 fillWorkFrontSelect('f_issue_work_front','None');
 fillEquipmentSelect('f_issue_equipment','None');
 fillSelect('f_issue_severity',LISTS.severity,'Select severity');
 fillSelect('f_issue_status',LISTS.status,'Select status');
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
   const eq=await rc.request({operation:'READ',entity:'Equipment'});
   state.equipment=Array.isArray(eq.data)?eq.data:[];
   fillLists();
   const result=await rc.request({operation:'READ',entity:'Issues'});
   state.rows=Array.isArray(result.data)?result.data:[];
   state.status='ready';render();
   setMsg('RuntimeAdapter connected — Issues persistence is offline-first and audit-backed.');
 }catch(e){
   runtimeReady=false;state.status='error';render();
   const detail=e&&e.message?e.message:String(e);
   const count=document.getElementById('issuesCount');
   if(count)count.textContent='Runtime Error · '+detail;
   console.error('[Lithosite Issues] Runtime load failed:',e);
   setMsg('Runtime unavailable: '+detail+'. Start desktop-host/server.py.',true);
 }
}
async function refreshData(){
 try{
  const result=await rc.request({operation:'READ',entity:'Issues'});
  state.rows=Array.isArray(result.data)?result.data:[];state.status='ready';render();
 }catch(e){setMsg('Refresh failed: '+e.message,true);}
}
function filtered(){
 const id=document.getElementById('issuesIdFilter').value.trim().toLowerCase();
 const domain=document.getElementById('issuesDomainFilter').value;
 const wf=document.getElementById('issuesWorkFrontFilter').value;
 const eq=document.getElementById('issuesEquipmentFilter').value;
 const severity=document.getElementById('issuesSeverityFilter').value;
 const status=document.getElementById('issuesStatusFilter').value;
 return state.rows.filter(r=>
  (!id||String(r.issue_id||'').toLowerCase().includes(id))&&
  (!domain||r.domain===domain)&&
  (!wf||r.work_front_id===wf)&&
  (!eq||r.equipment_id===eq)&&
  (!severity||r.severity===severity)&&
  (!status||r.status===status)
 );
}
function severityClass(v){return String(v||'').toLowerCase().replace(/\s+/g,'-');}
function statusClass(v){return String(v||'').toLowerCase().replace(/\s+/g,'-');}
function render(){
 const host=document.getElementById('issuesRows');if(!host)return;
 if(state.status==='loading')host.innerHTML='<div class="empty">Loading Issues from RuntimeAdapter…</div>';
 else if(state.status==='error')host.innerHTML='<div class="empty">Issues data unavailable. Check RuntimeAdapter connection and use Refresh.</div>';
 else{
  const rows=filtered();
  host.innerHTML=rows.length?rows.map(r=>'<div class="tr td">'+
   '<div class="cell">'+esc(r.issue_id)+'</div>'+
   '<div class="cell">'+esc(r.issue_date)+'</div>'+
   '<div class="cell">'+esc(r.domain)+'</div>'+
   '<div class="cell">'+esc(workFrontLabel(r.work_front_id))+'</div>'+
   '<div class="cell">'+esc(equipmentLabel(r.equipment_id))+'</div>'+
   '<div class="cell issue-description" title="'+esc(r.description)+'">'+esc(r.description)+'</div>'+
   '<div class="cell"><span class="statuspill '+severityClass(r.severity)+'">'+esc(r.severity)+'</span></div>'+
   '<div class="cell"><span class="statuspill '+statusClass(r.status)+'">'+esc(r.status)+'</span></div>'+
   '<div class="cell">'+esc(r.assigned_to)+'</div>'+
   '<div class="cell">'+esc(r.closed_at)+'</div>'+
   '<div class="cell row-actions"><button class="control mini edit-issue" data-id="'+esc(r.issue_id)+'">Edit</button><button class="control mini danger delete-issue" data-id="'+esc(r.issue_id)+'">Delete</button></div>'+
  '</div>').join(''):'<div class="empty">No Issues records match the current filters.</div>';
  document.getElementById('issuesCount').textContent=rows.length+' records · Runtime Ready';
 }
 if(state.status==='loading')document.getElementById('issuesCount').textContent='Loading · Runtime Connecting';
 if(state.status==='error')document.getElementById('issuesCount').textContent='Unavailable · Runtime Error';
}
function nowLocalDate(){
 const now=new Date();
 return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function nowLocalDateTime(){
 const now=new Date();
 return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
function resetForm(){
 const d=nowLocalDate();
 document.getElementById('f_issue_id').value='ISS-'+d.replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 document.getElementById('f_issue_date').value=d;
 document.getElementById('f_issue_domain').value=LISTS.domain[0]||'';
 document.getElementById('f_issue_work_front').value='';
 document.getElementById('f_issue_equipment').value='';
 document.getElementById('f_issue_description').value='';
 document.getElementById('f_issue_severity').value=LISTS.severity.includes('Medium')?'Medium':(LISTS.severity[0]||'');
 document.getElementById('f_issue_status').value=LISTS.status.includes('Open')?'Open':(LISTS.status[0]||'');
 document.getElementById('f_issue_assigned_to').value='';
 document.getElementById('f_issue_closed_at').value='';
}
function openAdd(){
 editId=null;
 document.getElementById('issuesModalTitle').textContent='Add Issue';
 document.getElementById('issuesSave').textContent='Save via RuntimeAdapter';
 resetForm();
 document.getElementById('issuesModal').classList.add('show');
}
function openEdit(id){
 const row=state.rows.find(x=>String(x.issue_id)===String(id));if(!row)return;
 editId=id;
 document.getElementById('issuesModalTitle').textContent='Edit Issue';
 document.getElementById('issuesSave').textContent='Update via RuntimeAdapter';
 const map={
  f_issue_id:row.issue_id,f_issue_date:row.issue_date,f_issue_domain:row.domain,
  f_issue_work_front:row.work_front_id,f_issue_equipment:row.equipment_id,
  f_issue_description:row.description,f_issue_severity:row.severity,
  f_issue_status:row.status,f_issue_assigned_to:row.assigned_to,
  f_issue_closed_at:row.closed_at?String(row.closed_at).slice(0,16):''
 };
 Object.entries(map).forEach(([id,v])=>document.getElementById(id).value=v??'');
 document.getElementById('issuesModal').classList.add('show');
}
function payload(){
 const status=document.getElementById('f_issue_status').value;
 return {
  issue_id:document.getElementById('f_issue_id').value,
  issue_date:document.getElementById('f_issue_date').value,
  domain:document.getElementById('f_issue_domain').value,
  work_front_id:document.getElementById('f_issue_work_front').value||null,
  equipment_id:document.getElementById('f_issue_equipment').value||null,
  description:document.getElementById('f_issue_description').value.trim(),
  severity:document.getElementById('f_issue_severity').value,
  status:status,
  assigned_to:document.getElementById('f_issue_assigned_to').value.trim(),
  closed_at:status==='Closed'?(document.getElementById('f_issue_closed_at').value||null):null
 };
}
async function save(){
 if(!runtimeReady){setMsg('RuntimeAdapter is not connected. Start desktop-host/server.py first.',true);return;}
 const row=payload();
 if(!row.issue_date||!row.description||!row.severity||!row.status){
  setMsg('Issue Date, Description, Severity and Status are required.',true);return;
 }
 if(row.status==='Closed'&&!row.closed_at){
  setMsg('Closed At is required when Status is Closed.',true);return;
 }
 try{
  const result=editId?await rc.request({operation:'UPDATE',entity:'Issues',entity_id:editId,patch:row}):await rc.request({operation:'CREATE',entity:'Issues',row});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Runtime rejected the Issue record');
  document.getElementById('issuesModal').classList.remove('show');
  await refreshData();
  setMsg(editId?'Issue updated and audited.':'Issue created and audited.');
 }catch(e){setMsg('Validation/runtime error: '+e.message,true);}
}
async function remove(id){
 if(!confirm('Delete Issue '+id+'?\nRuntime will validate references and audit the mutation.'))return;
 try{
  const result=await rc.request({operation:'DELETE',entity:'Issues',entity_id:id});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');
  await refreshData();setMsg('Issue deleted and audited.');
 }catch(e){setMsg('Delete failed: '+e.message,true);}
}
function bind(){
 document.getElementById('issuesAdd').onclick=openAdd;
 document.getElementById('issuesRefresh').onclick=load;
 document.getElementById('issuesSave').onclick=save;
 document.getElementById('issuesClose').onclick=()=>document.getElementById('issuesModal').classList.remove('show');
 document.getElementById('issuesCancel').onclick=()=>document.getElementById('issuesModal').classList.remove('show');
 document.getElementById('issuesClear').onclick=()=>{
  ['issuesIdFilter','issuesDomainFilter','issuesWorkFrontFilter','issuesEquipmentFilter','issuesSeverityFilter','issuesStatusFilter'].forEach(id=>document.getElementById(id).value='');
  render();
 };
 ['issuesIdFilter','issuesDomainFilter','issuesWorkFrontFilter','issuesEquipmentFilter','issuesSeverityFilter','issuesStatusFilter'].forEach(id=>{
  const e=document.getElementById(id);e.addEventListener('input',render);e.addEventListener('change',render);
 });
 document.getElementById('f_issue_status').addEventListener('change',()=>{
  const status=document.getElementById('f_issue_status').value;
  const closed=document.getElementById('f_issue_closed_at');
  if(status==='Closed'&&!closed.value)closed.value=nowLocalDateTime();
  if(status!=='Closed')closed.value='';
 });
 document.getElementById('issuesRows').addEventListener('click',e=>{
  const edit=e.target.closest('.edit-issue');if(edit)openEdit(edit.dataset.id);
  const del=e.target.closest('.delete-issue');if(del)remove(del.dataset.id);
 });
}
function init(){if(!document.getElementById('issuesScreen'))return;if(document.getElementById('issuesAdd'))bind();load();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

global.LithositeIssues=Object.freeze({
 entity:'Issues',
 readAll:()=>rc.request({operation:'READ',entity:'Issues'}),
 getLists:()=>rc.request({operation:'READ',entity:'_Lists'}),
 create:(row)=>rc.request({operation:'CREATE',entity:'Issues',row}),
 update:(id,patch)=>rc.request({operation:'UPDATE',entity:'Issues',entity_id:id,patch}),
 delete:(id)=>rc.request({operation:'DELETE',entity:'Issues',entity_id:id})
});
})(window);
