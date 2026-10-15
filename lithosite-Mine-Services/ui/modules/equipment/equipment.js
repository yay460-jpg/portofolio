(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 9 Equipment');
const state={rows:[],capacities:[],status:'loading'};
let editId=null;
let runtimeReady=false;
let returnToUnitList=false;
let addEquipmentRequiresReference=false;

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
function equipmentBrand(row){
 const profile=state.capacities.find(function(item){
  return String(item.capacity_profile_id||'')===String(row.capacity_profile_id||'');
 });
 return profile?String(profile.unit_brand||'—'):'—';
}
function renderUnitList(){
 const typeFilter=document.getElementById('equipmentUnitTypeFilter');
 if(typeFilter){
  const selected=typeFilter.value;
  const types=Array.from(new Set(state.rows.map(function(row){return String(row.type||'').trim();}).filter(Boolean))).sort(function(a,b){return a.localeCompare(b);});
  typeFilter.innerHTML='<option value="">All types</option>'+types.map(function(type){return '<option value="'+esc(type)+'">'+esc(type)+'</option>';}).join('');
  if(types.includes(selected))typeFilter.value=selected;
 }
 const host=document.getElementById('equipmentUnitListRows');
 const count=document.getElementById('equipmentUnitListCount');
 if(!host||!count)return;
 if(state.status==='loading'){
  host.innerHTML='<div class="equipment-unit-empty">Loading unit database from RuntimeAdapter…</div>';
  count.textContent='Loading…';
  return;
 }
 if(state.status==='error'){
  host.innerHTML='<div class="equipment-unit-empty">Unit database unavailable. Check RuntimeAdapter and refresh.</div>';
  count.textContent='Unavailable';
  return;
 }
 const selectedType=typeFilter?typeFilter.value:'';
 const rows=state.rows.filter(function(row){return !selectedType||String(row.type||'')===selectedType;}).slice().sort(function(a,b){
  return String(b.effective_from||'').localeCompare(String(a.effective_from||''))||
   String(a.equipment_id||'').localeCompare(String(b.equipment_id||''));
 });
 host.innerHTML=rows.length?rows.map(function(row){
  const cls=String(row.status||'').toLowerCase().replace(/[^a-z]/g,'')||'inactive';
  return '<div class="equipment-unit-row">'+
   '<div class="equipment-unit-cell">'+esc(row.effective_from||'—')+'</div>'+
   '<div class="equipment-unit-cell unit-id">'+esc(row.equipment_id||'—')+'</div>'+
   '<div class="equipment-unit-cell unit-no">'+esc(row.unit_no||'—')+'</div>'+
   '<div class="equipment-unit-cell">'+esc(row.type||'—')+'</div>'+
   '<div class="equipment-unit-cell">'+esc(equipmentBrand(row))+'</div>'+
   '<div class="equipment-unit-cell">'+esc(row.category||'—')+'</div>'+
   '<div class="equipment-unit-cell"><span class="statuspill '+cls+'-status">'+esc(row.status||'—')+'</span></div>'+
   '<div class="equipment-unit-cell equipment-unit-actions"><button type="button" class="control mini edit-equipment" data-id="'+esc(row.equipment_id)+'">Edit</button><button type="button" class="control mini danger delete-equipment" data-id="'+esc(row.equipment_id)+'">Delete</button></div>'+
  '</div>';
 }).join(''):'<div class="equipment-unit-empty">No equipment units recorded yet.</div>';
 count.textContent=rows.length+' units · Runtime Ready · Canonical Equipment records';
}
async function refreshUnitList(){
 const host=document.getElementById('equipmentUnitListRows');
 const count=document.getElementById('equipmentUnitListCount');
 if(host)host.innerHTML='<div class="equipment-unit-empty">Refreshing unit database…</div>';
 if(count)count.textContent='Refreshing…';
 try{
  const results=await Promise.all([
   rc.request({operation:'READ',entity:'Equipment'}),
   rc.request({operation:'READ',entity:'GlobalCapacity'})
  ]);
  state.rows=Array.isArray(results[0].data)?results[0].data:[];
  state.capacities=Array.isArray(results[1].data)?results[1].data:[];
  state.status='ready';
  fillCapacityProfiles();
  render();
  renderUnitList();
 }catch(e){
  if(host)host.innerHTML='<div class="equipment-unit-empty error">Unit database refresh failed. Use the Equipment Refresh button and check RuntimeAdapter.</div>';
  if(count)count.textContent='Refresh failed';
  setMsg('Unit database refresh failed: '+e.message,true);
 }
}
function openUnitList(){
 renderUnitList();
 global.LithositeModalShowContract.show('equipmentUnitListModal');
 refreshUnitList();
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
    '<div class="cell">'+esc(equipmentBrand(r))+'</div>'+
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
   const results=await Promise.all([
     rc.request({operation:'READ',entity:'Equipment'}),
     rc.request({operation:'READ',entity:'GlobalCapacity'})
   ]);
   state.rows=Array.isArray(results[0].data)?results[0].data:[];
   state.capacities=Array.isArray(results[1].data)?results[1].data:[];
   fillCapacityProfiles();
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
  const results=await Promise.all([
   rc.request({operation:'READ',entity:'Equipment'}),
   rc.request({operation:'READ',entity:'GlobalCapacity'})
  ]);
  state.rows=Array.isArray(results[0].data)?results[0].data:[];
  state.capacities=Array.isArray(results[1].data)?results[1].data:[];
  fillCapacityProfiles();
  state.status='ready';render();
 }catch(e){setMsg('Refresh failed: '+e.message,true);}
}
function fillCapacityProfiles(selectedId){
 const select=document.getElementById('f_eq_capacity_profile');
 if(!select)return;
 const current=String(selectedId??select.value??'');
 select.innerHTML='<option value="">Select Global Capacity</option>';
 state.capacities.slice().sort(function(a,b){
   const activeA=String(a.status||'').toUpperCase()==='ACTIVE'?0:1;
   const activeB=String(b.status||'').toUpperCase()==='ACTIVE'?0:1;
   if(activeA!==activeB)return activeA-activeB;
   return String(a.capacity_name||'').localeCompare(String(b.capacity_name||''));
 }).forEach(function(row){
   const option=document.createElement('option');
   option.value=String(row.capacity_profile_id||'');
   option.textContent=String(row.capacity_name||row.capacity_profile_id||'')+' — '+String(row.unit_brand||'—')+' — '+String(row.capacity_value??'')+' '+String(row.measurement||'ton');
   select.appendChild(option);
 });
 if(current)select.value=current;
 updateCapacitySummary();
}
function populateOwnerNameOptions(selectedName){
 const select=document.getElementById('f_eq_owner_name');
 if(!select)return;
 const previous=String(selectedName??select.selectedOptions?.[0]?.textContent??'').trim();
 const api=global.LithositeNIK;
 const status=api&&typeof api.getStatus==='function'?api.getStatus():'loading';
 const employees=api&&typeof api.getRecords==='function'?api.getRecords():[];
 select.replaceChildren();
 const placeholder=document.createElement('option');
 placeholder.value='';
 placeholder.textContent=status==='error'?'NIK list unavailable — open List NIK to refresh':status!=='ready'?'Loading registered employees…':employees.length?'Select registered employee':'No employees registered in NIK';
 select.appendChild(placeholder);
 if(status==='ready'){
  employees.forEach(function(employee){
   const nik=String(employee['Id No (NIK)']||'').trim();
   const name=String(employee['Name Employment']||'').trim();
   if(!nik||!name)return;
   const option=document.createElement('option');
   option.value=nik;
   option.textContent=name;
   option.dataset.employeeName=name;
   select.appendChild(option);
  });
  const matching=Array.from(select.options).find(function(option){
   return option.value&&option.dataset.employeeName===previous;
  });
  if(matching)select.value=matching.value;
 }
 select.disabled=status!=='ready'||!employees.some(function(employee){
  return String(employee['Id No (NIK)']||'').trim()&&String(employee['Name Employment']||'').trim();
 });
}
function selectedOwnerName(){
 const select=document.getElementById('f_eq_owner_name');
 const option=select&&select.selectedOptions&&select.selectedOptions[0];
 return option&&option.value?String(option.dataset.employeeName||option.textContent||'').trim():'';
}
function updateCapacitySummary(){
 const select=document.getElementById('f_eq_capacity_profile');
 const brand=document.getElementById('f_eq_brand');
 const capacity=document.getElementById('f_eq_capacity');
 if(!select||!brand||!capacity)return;
 const profile=state.capacities.find(function(row){return String(row.capacity_profile_id||'')===String(select.value||'');});
 brand.value=profile?String(profile.unit_brand||'—'):'';
 capacity.value=profile?String(profile.capacity_value??'')+' '+String(profile.measurement||'ton'):'';
}
function fillUnitReference(selectedId){
 const select=document.getElementById('f_eq_unit_reference');
 if(!select)return;
 const current=String(selectedId??select.value??'');
 const units=state.rows.slice().sort(function(a,b){
  return String(a.unit_no||'').localeCompare(String(b.unit_no||''))||String(a.equipment_id||'').localeCompare(String(b.equipment_id||''));
 });
 select.innerHTML='<option value="">Select registered unit from Unit List</option>'+units.map(function(row){
  const label=String(row.unit_no||'—')+' — '+String(row.equipment_id||'')+' — '+String(row.type||'');
  return '<option value="'+esc(row.equipment_id)+'">'+esc(label)+'</option>';
 }).join('');
 if(current&&units.some(function(row){return String(row.equipment_id)===current;}))select.value=current;
}
function selectRegisteredUnit(id){
 const row=state.rows.find(function(item){return String(item.equipment_id||'')===String(id||'');});
 if(!row)return;
 editId=String(row.equipment_id);
 const map={f_eq_id:row.equipment_id,f_eq_unit_no:row.unit_no,f_eq_category:row.category,f_eq_type:row.type,f_eq_owner_type:row.owner_type,f_eq_status:row.status,f_eq_from:row.effective_from,f_eq_to:row.effective_to};
 Object.entries(map).forEach(function(entry){const el=document.getElementById(entry[0]);if(el)el.value=entry[1]??'';});
 populateOwnerNameOptions(row.owner_name);
 fillCapacityProfiles(row.capacity_profile_id||'');
 document.getElementById('f_eq_id').readOnly=true;
 document.getElementById('f_eq_unit_no').readOnly=true;
 document.getElementById('equipmentSave').textContent='Update via RuntimeAdapter';
 setMsg('Registered unit selected. Equipment ID and Unit / Fleet No. are linked to the Unit List record.');
}
function resetForm(){
 const now=new Date();
 const d=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
 document.getElementById('f_eq_id').value='EQ-'+d.replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 document.getElementById('f_eq_unit_no').value='';
 document.getElementById('f_eq_id').readOnly=true;
 document.getElementById('f_eq_unit_no').readOnly=false;
 const unitReference=document.getElementById('f_eq_unit_reference');if(unitReference)unitReference.value='';
 document.getElementById('f_eq_category').value='';
 document.getElementById('f_eq_type').value='';
 document.getElementById('f_eq_owner_type').value='';
 populateOwnerNameOptions('');
 document.getElementById('f_eq_status').value='Active';
 fillCapacityProfiles('');
 document.getElementById('f_eq_from').value=d;
 document.getElementById('f_eq_to').value='';
}
function openAdd(fromUnitList){
 returnToUnitList=!!fromUnitList;
 addEquipmentRequiresReference=!fromUnitList;
 if(returnToUnitList)global.LithositeModalShowContract.close('equipmentUnitListModal');
 editId=null;document.getElementById('equipmentModalTitle').textContent=returnToUnitList?'Add Unit':'Add Equipment';
 document.getElementById('equipmentSave').textContent='Save via RuntimeAdapter';resetForm();
 const referenceField=document.getElementById('equipmentUnitReferenceField');
 if(referenceField){referenceField.hidden=returnToUnitList;}
 fillUnitReference('');
 if(!returnToUnitList){document.getElementById('f_eq_id').value='';document.getElementById('f_eq_unit_no').value='';document.getElementById('f_eq_unit_no').readOnly=true;document.getElementById('equipmentSave').textContent='Select Unit First';setMsg('Select a registered unit from Unit List. New unit identities are created with Add Unit.');}
 global.LithositeModalShowContract.show('equipmentModal');
}
function openEdit(id,fromUnitList){
 const row=state.rows.find(x=>String(x.equipment_id)===String(id));if(!row)return;
 returnToUnitList=!!fromUnitList;
 if(returnToUnitList)global.LithositeModalShowContract.close('equipmentUnitListModal');
 editId=id;addEquipmentRequiresReference=false;
 const referenceField=document.getElementById('equipmentUnitReferenceField');if(referenceField)referenceField.hidden=true;
 document.getElementById('equipmentModalTitle').textContent=returnToUnitList?'Edit Unit':'Edit Equipment';
 document.getElementById('equipmentSave').textContent='Update via RuntimeAdapter';
 const map={f_eq_id:row.equipment_id,f_eq_unit_no:row.unit_no,f_eq_category:row.category,f_eq_type:row.type,f_eq_owner_type:row.owner_type,f_eq_owner_name:row.owner_name,f_eq_status:row.status,f_eq_from:row.effective_from,f_eq_to:row.effective_to};
 Object.entries(map).forEach(([id,v])=>document.getElementById(id).value=v??'');
 populateOwnerNameOptions(row.owner_name);
 fillCapacityProfiles(row.capacity_profile_id||'');
 global.LithositeModalShowContract.show('equipmentModal');
}
function payload(){
 return {
  equipment_id:document.getElementById('f_eq_id').value,
  unit_no:document.getElementById('f_eq_unit_no').value.trim(),
  category:document.getElementById('f_eq_category').value,
  type:document.getElementById('f_eq_type').value,
  owner_type:document.getElementById('f_eq_owner_type').value,
  owner_name:selectedOwnerName(),
  status:document.getElementById('f_eq_status').value,
  effective_from:document.getElementById('f_eq_from').value||null,
  effective_to:document.getElementById('f_eq_to').value||null,
  capacity_profile_id:document.getElementById('f_eq_capacity_profile').value||null
 };
}
async function save(){
 if(!runtimeReady){setMsg('RuntimeAdapter is not connected. Start desktop-host/server.py first.',true);return;}
 const wasEdit=Boolean(editId);
 if(addEquipmentRequiresReference&&!editId){setMsg('Select a registered unit from Unit List before saving Equipment.',true);return;}
 const row=payload();
 if(!row.unit_no||!row.category||!row.type||!row.owner_type||!row.owner_name||!row.status){setMsg('Unit / Fleet No., Category, Type, Owner Type, registered Owner Name and Status are required.',true);return;}
 if(String(row.type||'').trim().toLowerCase()==='dump truck'&&!row.capacity_profile_id){setMsg('Global Capacity Profile is required for Dump Truck.',true);return;}
 try{
  const result=editId?await rc.request({operation:'UPDATE',entity:'Equipment',entity_id:editId,patch:row}):await rc.request({operation:'CREATE',entity:'Equipment',row});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Runtime rejected the equipment');
  const reopenUnitList=returnToUnitList;
  returnToUnitList=false;
  global.LithositeModalShowContract.close('equipmentModal');
  await refreshData();renderUnitList();
  setMsg(wasEdit?'Equipment unit updated and audited.':'Equipment unit created and audited.');
  if(reopenUnitList){global.LithositeModalShowContract.show('equipmentUnitListModal');await refreshUnitList();}
 }catch(e){setMsg('Validation/runtime error: '+e.message,true);}
}
async function remove(id){
 if(!await global.LithositeDeleteConfirmContract.confirm({entity:'Equipment',id:id,warning:'Runtime will reject deletion if the equipment is referenced.'}))return;
 try{
  const result=await rc.request({operation:'DELETE',entity:'Equipment',entity_id:id});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');
  await refreshData();renderUnitList();setMsg('Equipment deleted and audited.');
 }catch(e){setMsg('Delete failed: '+e.message,true);}
}
function closeEquipmentForm(){
 const reopenUnitList=returnToUnitList;
 returnToUnitList=false;
 addEquipmentRequiresReference=false;
 global.LithositeModalShowContract.close('equipmentModal');
 if(reopenUnitList){global.LithositeModalShowContract.show('equipmentUnitListModal');refreshUnitList();}
}
function bind(){
 document.getElementById('equipmentAdd').onclick=()=>openAdd(false);
 document.getElementById('equipmentUnitListAdd').onclick=()=>openAdd(true);
 document.getElementById('equipmentRefresh').onclick=load;
 document.addEventListener('lithosite:nik-records-updated',function(){populateOwnerNameOptions(selectedOwnerName());});
 document.getElementById('equipmentUnitListButton').onclick=openUnitList;
 document.getElementById('equipmentUnitListClose').onclick=()=>global.LithositeModalShowContract.close('equipmentUnitListModal');

 document.getElementById('equipmentUnitListRefresh').onclick=refreshUnitList;
 document.getElementById('equipmentUnitTypeFilter').addEventListener('change',renderUnitList);
 document.getElementById('equipmentUnitListRows').addEventListener('click',function(event){
  const edit=event.target.closest('.edit-equipment');
  if(edit){openEdit(edit.dataset.id,true);return;}
  const del=event.target.closest('.delete-equipment');
  if(del)remove(del.dataset.id);
 });
 document.getElementById('f_eq_unit_reference').addEventListener('change',function(event){if(event.target.value)selectRegisteredUnit(event.target.value);else{editId=null;document.getElementById('f_eq_id').value='';document.getElementById('f_eq_unit_no').value='';document.getElementById('equipmentSave').textContent='Select Unit First';setMsg('Select a registered unit from Unit List.');}});
 document.getElementById('equipmentSave').onclick=save;
 document.getElementById('f_eq_capacity_profile').addEventListener('change',updateCapacitySummary);
 document.getElementById('equipmentClose').onclick=closeEquipmentForm;
 document.getElementById('equipmentCancel').onclick=closeEquipmentForm;
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