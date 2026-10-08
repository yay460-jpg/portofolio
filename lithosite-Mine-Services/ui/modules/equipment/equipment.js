(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 9 Equipment');
const state={rows:[],status:'loading'};
let editId=null;
let runtimeReady=false;

/* A.1 controlled vocabulary is supplied by the RuntimeAdapter from the authoritative _Lists contract. */
const LISTS={category:[],type:[],owner_type:[],status:[]};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function setMsg(text,error){
 const el=document.getElementById('equipmentRuntimeMsg');
 if(el){el.textContent=text;el.classList.toggle('error',!!error);}
}
function setMapMsg(text,error){
 const el=document.getElementById('equipmentMapMsg');
 if(el){el.textContent=text;el.classList.toggle('error',!!error);}
}
function fillSelect(id,items,empty){
 const el=document.getElementById(id);
 const current=el.value;
 el.innerHTML='<option value="">'+esc(empty)+'</option>'+items.map(v=>'<option value="'+esc(v).replace(/"/g,'&quot;')+'">'+esc(v)+'</option>').join('');
 if(items.includes(current))el.value=current;
}
async function loadLists(){
 const result=await rc.request({operation:'READ',entity:'_Lists'});
 const lists=(result.data&&typeof result.data==='object')?result.data:result;
 LISTS.category=Array.isArray(lists.equipment_category)?lists.equipment_category:[];
 LISTS.type=Array.isArray(lists.equipment_type)?lists.equipment_type:[];
 LISTS.owner_type=Array.isArray(lists.owner_type)?lists.owner_type:[];
 LISTS.status=Array.isArray(lists.equipment_status)?lists.equipment_status:[];
 if(!LISTS.category.length||!LISTS.type.length||!LISTS.owner_type.length||!LISTS.status.length){
   throw new Error('Controlled vocabulary _Lists is incomplete');
 }
 fillLists();
}
function fillLists(){
 fillSelect('equipmentCategoryFilter',LISTS.category,'All categories');
 fillSelect('equipmentTypeFilter',LISTS.type,'All types');
 fillSelect('equipmentOwnerFilter',LISTS.owner_type,'All owners');
 fillSelect('equipmentStatusFilter',LISTS.status,'All status');
 fillSelect('f_eq_category',LISTS.category,'Select category');
 fillSelect('f_eq_type',LISTS.type,'Select type');
 fillSelect('f_eq_owner_type',LISTS.owner_type,'Select owner type');
 fillSelect('f_eq_status',LISTS.status,'Select status');
}
function matchesEquipmentGroup(type, group){
 const normalizedType=String(type||'').trim().toLowerCase();
 if(!group)return true;
 if(group==='dump-truck')return normalizedType==='dump truck';
 if(group==='excavator')return normalizedType==='excavator';
 if(group==='support-unit')return normalizedType==='grader'||normalizedType==='dozer';
 return true;
}
function filtered(){
 const id=document.getElementById('equipmentIdFilter').value.trim().toLowerCase();
 const group=document.getElementById('equipmentMasterGroupFilter').value;
 const cat=document.getElementById('equipmentCategoryFilter').value;
 const type=document.getElementById('equipmentTypeFilter').value;
 const owner=document.getElementById('equipmentOwnerFilter').value;
 const status=document.getElementById('equipmentStatusFilter').value;
 return state.rows.filter(r=>
   (!id||String(r.equipment_id||'').toLowerCase().includes(id))&&
   (!group||matchesEquipmentGroup(r.type,group))&&
   (!cat||r.category===cat)&&(!type||r.type===type)&&
   (!owner||r.owner_type===owner)&&(!status||r.status===status)
 );
}
function render(){
 const host=document.getElementById('equipmentRows');
 if(!host)return;
 if(state.status==='loading'){
   host.innerHTML='<div class="empty">Loading Equipment from RuntimeAdapter…</div>';
 }else if(state.status==='error'){
   host.innerHTML='<div class="empty">Equipment data unavailable. Check RuntimeAdapter connection and use Refresh.</div>';
 }else{
   const rows=filtered().slice().sort(function(a,b){
     const dateCompare=String(a.effective_from||'').localeCompare(String(b.effective_from||''));
     if(dateCompare!==0)return dateCompare;
     const statusCompare=String(a.status||'').localeCompare(String(b.status||''));
     if(statusCompare!==0)return statusCompare;
     const unitCompare=String(a.unit_no||'').localeCompare(String(b.unit_no||''));
     if(unitCompare!==0)return unitCompare;
     return String(a.equipment_id||'').localeCompare(String(b.equipment_id||''));
   });
   host.innerHTML=rows.length?rows.map(r=>{
   const cls=String(r.status||'').toLowerCase().replace(/[^a-z]/g,'')||'inactive-status';
   return '<div class="tr td">'+
    '<div class="cell">'+esc(r.equipment_id)+'</div>'+
    '<div class="cell">'+esc(r.unit_no)+'</div>'+
    '<div class="cell">'+esc(r.category)+'</div>'+
    '<div class="cell">'+esc(r.type)+'</div>'+
    '<div class="cell">'+esc(r.owner_type)+'</div>'+
    '<div class="cell">'+esc(r.owner_name)+'</div>'+
    '<div class="cell"><span class="statuspill '+cls+'-status">'+esc(r.status)+'</span></div>'+
    '<div class="cell">'+esc(r.effective_from)+'</div>'+
    '<div class="cell">'+esc(r.effective_to)+'</div>'+
    '<div class="cell row-actions"><button class="control mini view show-map-equipment" data-id="'+esc(r.equipment_id)+'">Show on Map</button><button class="control mini edit edit-equipment" data-id="'+esc(r.equipment_id)+'">Edit</button><button class="control mini danger delete-equipment" data-id="'+esc(r.equipment_id)+'">Delete</button></div>'+
   '</div>';
 }).join(''):'<div class="empty">No equipment matches the current filters.</div>';
   document.getElementById('equipmentCount').textContent=rows.length+' records · Runtime Ready';
 }
 if(state.status==='loading')document.getElementById('equipmentCount').textContent='Loading · Runtime Connecting';
 if(state.status==='error')document.getElementById('equipmentCount').textContent='Unavailable · Runtime Error';
}
async function load(){
 if(!state.rows.length){state.status='loading';render();}
 try{
   const health=await rc.health();
   runtimeReady=health.status==='READY';
   if(!runtimeReady) throw new Error('Runtime health is not READY');
   await loadLists();
   const result=await rc.request({operation:'READ',entity:'Equipment'});
   state.rows=Array.isArray(result.data)?result.data:[];
   state.status='ready';
   render();
   setMsg('RuntimeAdapter connected — offline local persistence active.');
 }catch(e){
   runtimeReady=false;state.status='error';render();
   setMsg('Runtime unavailable: '+e.message+'. Start desktop-host/server.py.',true);
 }
}
async function refreshData(){
 try{
  const result=await rc.request({operation:'READ',entity:'Equipment'});
  state.rows=Array.isArray(result.data)?result.data:[];
  state.status='ready';render();
 }catch(e){setMsg('Refresh failed: '+e.message,true);}
}
function resetForm(){
 const now=new Date();
 const d=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
 document.getElementById('f_eq_id').value='EQ-'+d.replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 document.getElementById('f_eq_unit_no').value='';
 document.getElementById('f_eq_category').value='';
 document.getElementById('f_eq_type').value='';
 document.getElementById('f_eq_owner_type').value='';
 document.getElementById('f_eq_owner_name').value='';
 document.getElementById('f_eq_status').value='Active';
 document.getElementById('f_eq_from').value=d;
 document.getElementById('f_eq_to').value='';
}
function openAdd(){
 editId=null;document.getElementById('equipmentModalTitle').textContent='Add Equipment';
 document.getElementById('equipmentSave').textContent='Save via RuntimeAdapter';resetForm();
 global.LithositeModalShowContract.show('equipmentModal');
}
function openEdit(id){
 const row=state.rows.find(x=>String(x.equipment_id)===String(id));if(!row)return;
 editId=id;document.getElementById('equipmentModalTitle').textContent='Edit Equipment';
 document.getElementById('equipmentSave').textContent='Update via RuntimeAdapter';
 const map={f_eq_id:row.equipment_id,f_eq_unit_no:row.unit_no,f_eq_category:row.category,f_eq_type:row.type,f_eq_owner_type:row.owner_type,f_eq_owner_name:row.owner_name,f_eq_status:row.status,f_eq_from:row.effective_from,f_eq_to:row.effective_to};
 Object.entries(map).forEach(([id,v])=>document.getElementById(id).value=v??'');
 global.LithositeModalShowContract.show('equipmentModal');
}
function payload(){
 return {
  equipment_id:document.getElementById('f_eq_id').value,
  unit_no:document.getElementById('f_eq_unit_no').value.trim(),
  category:document.getElementById('f_eq_category').value,
  type:document.getElementById('f_eq_type').value,
  owner_type:document.getElementById('f_eq_owner_type').value,
  owner_name:document.getElementById('f_eq_owner_name').value,
  status:document.getElementById('f_eq_status').value,
  effective_from:document.getElementById('f_eq_from').value||null,
  effective_to:document.getElementById('f_eq_to').value||null
 };
}
async function save(){
 if(!runtimeReady){setMsg('RuntimeAdapter is not connected. Start desktop-host/server.py first.',true);return;}
 const row=payload();
 if(!row.unit_no||!row.category||!row.type||!row.owner_type||!row.status){setMsg('Unit / Fleet No., Category, Type, Owner Type and Status are required.',true);return;}
 try{
  const result=editId?await rc.request({operation:'UPDATE',entity:'Equipment',entity_id:editId,patch:row}):await rc.request({operation:'CREATE',entity:'Equipment',row});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Runtime rejected the equipment');
  global.LithositeModalShowContract.close('equipmentModal');
  await refreshData();setMsg(editId?'Equipment updated and audited.':'Equipment created and audited.');
 }catch(e){setMsg('Validation/runtime error: '+e.message,true);}
}
async function remove(id){
 if(!confirm('Delete equipment '+id+'?\nRuntime will reject deletion if the equipment is referenced.'))return;
 try{
  const result=await rc.request({operation:'DELETE',entity:'Equipment',entity_id:id});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');
  await refreshData();setMsg('Equipment deleted and audited.');
 }catch(e){setMsg('Delete failed: '+e.message,true);}
}
function bind(){
 document.getElementById('equipmentAdd').onclick=openAdd;
 document.getElementById('equipmentRefresh').onclick=load;
 document.getElementById('equipmentSave').onclick=save;
 document.getElementById('equipmentClose').onclick=()=>global.LithositeModalShowContract.close('equipmentModal');
 document.getElementById('equipmentCancel').onclick=()=>global.LithositeModalShowContract.close('equipmentModal');
 document.getElementById('equipmentClear').onclick=()=>{['equipmentIdFilter','equipmentMasterGroupFilter','equipmentCategoryFilter','equipmentTypeFilter','equipmentOwnerFilter','equipmentStatusFilter'].forEach(id=>document.getElementById(id).value='');render();};
 ['equipmentIdFilter','equipmentMasterGroupFilter','equipmentCategoryFilter','equipmentTypeFilter','equipmentOwnerFilter','equipmentStatusFilter'].forEach(id=>{const e=document.getElementById(id);e.addEventListener('input',render);e.addEventListener('change',render);});
 document.getElementById('equipmentRows').addEventListener('click',e=>{
  const showMap=e.target.closest('.show-map-equipment');if(showMap){
   const api=global.MineServicesMarkerLocation;
   const result=api&&typeof api.showDomainRecordOnMap==='function'?api.showDomainRecordOnMap('Equipment',showMap.dataset.id):{ok:false,status:'MAP_INTERACTION_UNAVAILABLE'};
   setMapMsg(result.ok?'Equipment '+showMap.dataset.id+' shown on Map.':'Spatial location not assigned for Equipment '+showMap.dataset.id+'.',!result.ok);
   return;
  }
  const edit=e.target.closest('.edit-equipment');if(edit)openEdit(edit.dataset.id);
  const del=e.target.closest('.delete-equipment');if(del)remove(del.dataset.id);
 });
}
document.addEventListener('mine-services:open-domain-record',function(event){
 const detail=event&&event.detail||{};
 if(detail.source_entity!=='Equipment'||!detail.source_id)return;
 if(global.LithositeShellNavigation)global.LithositeShellNavigation.setScreen('Equipment');
 setTimeout(function(){openEdit(detail.source_id);},0);
});
if(global.LithositeDataSync)global.LithositeDataSync.register('Equipment',refreshData);
bind();load();
})(window);