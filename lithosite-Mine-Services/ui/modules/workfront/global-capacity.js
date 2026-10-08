(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before global-capacity.js');
const state={rows:[],status:'loading'};
let editId=null,runtimeReady=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function msg(text,error){const e=document.getElementById('capacityRuntimeMsg');if(e){e.textContent=text;e.classList.toggle('error',!!error)}}
function render(){
 const host=document.getElementById('capacityRows');if(!host)return;
 if(state.status==='loading'){host.innerHTML='<div class="empty">Loading Global Capacity…</div>';return}
 if(state.status==='error'){host.innerHTML='<div class="empty">Global Capacity unavailable. Check RuntimeAdapter.</div>';return}
 const rows=state.rows.slice().sort((a,b)=>String(a.capacity_name||'').localeCompare(String(b.capacity_name||'')));
 host.innerHTML=rows.length?rows.map(r=>{
  const cls=String(r.status||'').toLowerCase().replace(/[^a-z]/g,'')||'inactive-status';
  return '<div class="capacity-grid td"><div class="capacity-cell">'+esc(r.capacity_profile_id)+'</div><div class="capacity-cell">'+esc(r.capacity_name)+'</div><div class="capacity-cell capacity-value">'+esc(r.capacity_value)+'</div><div class="capacity-cell">'+esc(r.unit)+'</div><div class="capacity-cell"><span class="statuspill '+cls+'-status">'+esc(r.status)+'</span></div><div class="capacity-cell row-actions"><button class="control mini edit edit-capacity" data-id="'+esc(r.capacity_profile_id)+'">Edit</button><button class="control mini danger delete-capacity" data-id="'+esc(r.capacity_profile_id)+'">Delete</button></div></div>'
 }).join(''):'<div class="empty">No Global Capacity profile configured - Set operational capacity independently from DT brand. Decimal values are allowed, for example 25.5, 27.5, 29, 32, or 35.5 ton.</div>';
 const count=document.getElementById('capacityCount');if(count)count.textContent=rows.length+' profiles';
}
async function load(){
 try{const h=await rc.health();runtimeReady=h.status==='READY';if(!runtimeReady)throw new Error('Runtime health is not READY');
 const r=await rc.request({operation:'READ',entity:'GlobalCapacity'});state.rows=Array.isArray(r.data)?r.data:[];state.status='ready';render();msg('RuntimeAdapter connected — Global Capacity is configuration data.')}
 catch(e){runtimeReady=false;state.status='error';render();msg('Runtime unavailable: '+e.message,true)}
}
function reset(){
 const now=new Date(),d=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
 document.getElementById('f_cap_id').value='GC-'+d.replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 document.getElementById('f_cap_name').value='';
 document.getElementById('f_cap_brand').value='';
 document.getElementById('f_cap_value').value='';
 document.getElementById('f_cap_unit').value='ton';
 document.getElementById('f_cap_status').value='Active';
 document.getElementById('f_cap_from').value=d;
 document.getElementById('f_cap_to').value='';
}
function openAdd(){editId=null;document.getElementById('capacityModalTitle').textContent='Add Global Capacity';document.getElementById('capacitySave').textContent='Save via RuntimeAdapter';reset();document.getElementById('capacityEditModal').classList.add('show')}
function openEdit(id){const r=state.rows.find(x=>String(x.capacity_profile_id)===String(id));if(!r)return;editId=id;document.getElementById('capacityModalTitle').textContent='Edit Global Capacity';document.getElementById('capacitySave').textContent='Update via RuntimeAdapter';const m={f_cap_id:r.capacity_profile_id,f_cap_name:r.capacity_name,f_cap_brand:r.unit_brand,f_cap_value:r.capacity_value,f_cap_unit:r.unit,f_cap_status:r.status,f_cap_from:r.effective_from,f_cap_to:r.effective_to};Object.entries(m).forEach(([id,v])=>document.getElementById(id).value=v??'');document.getElementById('capacityEditModal').classList.add('show')}
function payload(){return {capacity_profile_id:document.getElementById('f_cap_id').value,capacity_name:document.getElementById('f_cap_name').value.trim(),unit_brand:document.getElementById('f_cap_brand').value.trim(),capacity_value:Number(document.getElementById('f_cap_value').value),unit:'ton',status:document.getElementById('f_cap_status').value,effective_from:document.getElementById('f_cap_from').value||null,effective_to:document.getElementById('f_cap_to').value||null}}
async function save(){
 if(!runtimeReady){msg('RuntimeAdapter is not connected.',true);return}
 const row=payload();if(!row.capacity_name||!Number.isFinite(row.capacity_value)||row.capacity_value<=0){msg('Capacity Name and a positive numeric capacity are required.',true);return}
 try{const r=editId?await rc.request({operation:'UPDATE',entity:'GlobalCapacity',entity_id:editId,patch:row}):await rc.request({operation:'CREATE',entity:'GlobalCapacity',row});if(r.status!=='COMMITTED')throw new Error((r.errors||[]).map(x=>x.message).join('; ')||'Runtime rejected Global Capacity');document.getElementById('capacityEditModal').classList.remove('show');await load();msg(editId?'Global Capacity updated and audited.':'Global Capacity created and audited.')}catch(e){msg('Validation/runtime error: '+e.message,true)}
}
async function remove(id){
 if(!confirm('Delete Global Capacity '+id+'? Runtime will reject deletion if it is referenced by a Work Front or Operation.'))return;
 try{const r=await rc.request({operation:'DELETE',entity:'GlobalCapacity',entity_id:id});if(r.status!=='COMMITTED')throw new Error((r.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');await load();msg('Global Capacity deleted and audited.')}catch(e){msg('Delete failed: '+e.message,true)}
}
function bind(){
 document.getElementById('globalCapacityButton').onclick=()=>{if(global.LithositeModalShowContract){global.LithositeModalShowContract.show('capacityModal')}else{openAdd();return}load()};
 document.getElementById('capacityAdd').onclick=openAdd;
 document.getElementById('capacityRefresh').onclick=load;
 document.getElementById('capacityClose').onclick=()=>document.getElementById('capacityModal').classList.remove('show');
 document.getElementById('capacityEditClose').onclick=()=>document.getElementById('capacityEditModal').classList.remove('show');
 document.getElementById('capacityCancel').onclick=()=>document.getElementById('capacityEditModal').classList.remove('show');
 document.getElementById('capacitySave').onclick=save;
 document.getElementById('capacityRows').addEventListener('click',e=>{const edit=e.target.closest('.edit-capacity');if(edit)openEdit(edit.dataset.id);const del=e.target.closest('.delete-capacity');if(del)remove(del.dataset.id)});
}
global.LithositeGlobalCapacity={load,rows:()=>state.rows.slice()};
bind();load();
})(window);
