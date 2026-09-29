(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 10 Work Front');
const state={rows:[],status:'loading'};
let editId=null;
let runtimeReady=false;
const LISTS={domain:[],status:[]};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function setMsg(text,error){
 const el=document.getElementById('workfrontRuntimeMsg');
 if(el){el.textContent=text;el.classList.toggle('error',!!error);}
}
function fillSelect(id,items,empty){
 const el=document.getElementById(id); if(!el)return;
 const current=el.value;
 el.innerHTML='<option value="">'+esc(empty)+'</option>'+items.map(v=>'<option value="'+esc(v).replace(/"/g,'&quot;')+'">'+esc(v)+'</option>').join('');
 if(items.includes(current))el.value=current;
}
async function loadLists(){
 const result=await rc.request({operation:'READ',entity:'_Lists'});
 const lists=(result.data&&typeof result.data==='object')?result.data:result;
 LISTS.domain=Array.isArray(lists.service_domain)?lists.service_domain:[];
 LISTS.status=Array.isArray(lists.work_front_status)?lists.work_front_status:[];
 if(!LISTS.domain.length||!LISTS.status.length) throw new Error('Controlled vocabulary _Lists is incomplete');
 fillLists();
}
function fillLists(){
 fillSelect('workfrontDomainFilter',LISTS.domain,'All domains');
 fillSelect('workfrontStatusFilter',LISTS.status,'All status');
 fillSelect('f_wf_domain',LISTS.domain,'Select domain');
 fillSelect('f_wf_status',LISTS.status,'Select status');
}
function filtered(){
 const id=document.getElementById('workfrontIdFilter').value.trim().toLowerCase();
 const domain=document.getElementById('workfrontDomainFilter').value;
 const location=document.getElementById('workfrontLocationFilter').value.trim().toLowerCase();
 const responsible=document.getElementById('workfrontResponsibleFilter').value.trim().toLowerCase();
 const status=document.getElementById('workfrontStatusFilter').value;
 return state.rows.filter(r=>
  (!id||String(r.work_front_id||'').toLowerCase().includes(id))&&
  (!domain||r.domain===domain)&&
  (!location||String(r.location||'').toLowerCase().includes(location))&&
  (!responsible||String(r.responsible||'').toLowerCase().includes(responsible))&&
  (!status||r.status===status)
 );
}
function render(){
 const host=document.getElementById('workfrontRows'); if(!host)return;
 if(state.status==='loading') host.innerHTML='<div class="empty">Loading Work Front from RuntimeAdapter…</div>';
 else if(state.status==='error') host.innerHTML='<div class="empty">Work Front data unavailable. Check RuntimeAdapter connection and use Refresh.</div>';
 else {
  const rows=filtered();
  host.innerHTML=rows.length?rows.map(r=>{
   const cls=String(r.status||'').toLowerCase().replace(/[^a-z]/g,'')||'closed-status';
   return '<div class="wfgrid td"><div class="wfcell">'+esc(r.work_front_id)+'</div><div class="wfcell">'+esc(r.domain)+'</div><div class="wfcell">'+esc(r.location)+'</div><div class="wfcell">'+esc(r.responsible)+'</div><div class="wfcell"><span class="statuspill '+cls+'-status">'+esc(r.status)+'</span></div><div class="wfcell">'+esc(r.effective_from)+'</div><div class="wfcell">'+esc(r.effective_to)+'</div><div class="wfcell row-actions"><button class="control mini edit-workfront" data-id="'+esc(r.work_front_id)+'">Edit</button><button class="control mini danger delete-workfront" data-id="'+esc(r.work_front_id)+'">Delete</button></div></div>';
  }).join(''):'<div class="empty">No Work Front matches the current filters.</div>';
  document.getElementById('workfrontCount').textContent=rows.length+' records · Runtime Ready';
 }
 if(state.status==='loading')document.getElementById('workfrontCount').textContent='Loading · Runtime Connecting';
 if(state.status==='error')document.getElementById('workfrontCount').textContent='Unavailable · Runtime Error';
}
async function load(){
 state.status='loading';render();
 try{
  const health=await rc.health(); runtimeReady=health.status==='READY';
  if(!runtimeReady)throw new Error('Runtime health is not READY');
  await loadLists();
  const result=await rc.request({operation:'READ',entity:'WorkFront'});
  state.rows=Array.isArray(result.data)?result.data:[];
  state.status='ready';render();
  setMsg('RuntimeAdapter connected — offline local persistence active.');
 }catch(e){
  runtimeReady=false;state.status='error';render();
  setMsg('Runtime unavailable: '+e.message+'. Start desktop-host/server.py.',true);
 }
}
function resetForm(){
 const now=new Date();const d=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
 document.getElementById('f_wf_id').value='WF-'+d.replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 document.getElementById('f_wf_domain').value='';document.getElementById('f_wf_location').value='';
 document.getElementById('f_wf_responsible').value='';document.getElementById('f_wf_status').value=LISTS.status.includes('ACTIVE')?'ACTIVE':(LISTS.status[0]||'');
 document.getElementById('f_wf_from').value=d;document.getElementById('f_wf_to').value='';
}
function openAdd(){editId=null;document.getElementById('workfrontModalTitle').textContent='Add Work Front';document.getElementById('workfrontSave').textContent='Save via RuntimeAdapter';resetForm();document.getElementById('workfrontModal').classList.add('show');}
function openEdit(id){
 const row=state.rows.find(x=>String(x.work_front_id)===String(id));if(!row)return;
 editId=id;document.getElementById('workfrontModalTitle').textContent='Edit Work Front';document.getElementById('workfrontSave').textContent='Update via RuntimeAdapter';
 const map={f_wf_id:row.work_front_id,f_wf_domain:row.domain,f_wf_location:row.location,f_wf_responsible:row.responsible,f_wf_status:row.status,f_wf_from:row.effective_from,f_wf_to:row.effective_to};
 Object.entries(map).forEach(([id,v])=>document.getElementById(id).value=v??'');
 document.getElementById('workfrontModal').classList.add('show');
}
function payload(){return {work_front_id:document.getElementById('f_wf_id').value,domain:document.getElementById('f_wf_domain').value,location:document.getElementById('f_wf_location').value,responsible:document.getElementById('f_wf_responsible').value,status:document.getElementById('f_wf_status').value,effective_from:document.getElementById('f_wf_from').value||null,effective_to:document.getElementById('f_wf_to').value||null};}
async function save(){
 if(!runtimeReady){setMsg('RuntimeAdapter is not connected. Start desktop-host/server.py first.',true);return;}
 const row=payload();if(!row.domain||!row.status){setMsg('Domain and Status are required.',true);return;}
 try{
  const result=editId?await rc.request({operation:'UPDATE',entity:'WorkFront',entity_id:editId,patch:row}):await rc.request({operation:'CREATE',entity:'WorkFront',row});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Runtime rejected the Work Front');
  document.getElementById('workfrontModal').classList.remove('show');await load();setMsg(editId?'Work Front updated and audited.':'Work Front created and audited.');
 }catch(e){setMsg('Validation/runtime error: '+e.message,true);}
}
async function remove(id){
 if(!confirm('Delete Work Front '+id+'?\nRuntime will reject deletion if the Work Front is referenced.'))return;
 try{
  const result=await rc.request({operation:'DELETE',entity:'WorkFront',entity_id:id});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');
  await load();setMsg('Work Front deleted and audited.');
 }catch(e){setMsg('Delete failed: '+e.message,true);}
}
function bind(){
 document.getElementById('workfrontAdd').onclick=openAdd;document.getElementById('workfrontRefresh').onclick=load;document.getElementById('workfrontSave').onclick=save;
 document.getElementById('workfrontClose').onclick=()=>document.getElementById('workfrontModal').classList.remove('show');
 document.getElementById('workfrontCancel').onclick=()=>document.getElementById('workfrontModal').classList.remove('show');
 document.getElementById('workfrontClear').onclick=()=>{['workfrontIdFilter','workfrontDomainFilter','workfrontLocationFilter','workfrontResponsibleFilter','workfrontStatusFilter'].forEach(id=>document.getElementById(id).value='');render();};
 ['workfrontIdFilter','workfrontDomainFilter','workfrontLocationFilter','workfrontResponsibleFilter','workfrontStatusFilter'].forEach(id=>{const e=document.getElementById(id);e.addEventListener('input',render);e.addEventListener('change',render);});
 document.getElementById('workfrontRows').addEventListener('click',e=>{const edit=e.target.closest('.edit-workfront');if(edit)openEdit(edit.dataset.id);const del=e.target.closest('.delete-workfront');if(del)remove(del.dataset.id);});
}
bind();load();
})(window);
