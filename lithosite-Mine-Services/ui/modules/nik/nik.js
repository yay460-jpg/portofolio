(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
const modal=global.LithositeModalShowContract;
if(!rc)throw new Error('LithositeRuntimeClient is required before the NIK module');
if(!modal)throw new Error('LithositeModalShowContract is required before the NIK module');

const state={rows:[],status:'loading',error:'',saving:false};
let editingId=null;
function requestId(action){return 'nik-'+action+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
let visibleRows=[];
const FIELDS=['Effective From','Effective To','Id No (NIK)','Origin','Name Employment','Information'];
const TEMPORARY_TEST_INFORMATION='TEMPORARY TEST DATA — remove after validation';

function esc(value){
 return String(value??'').replace(/[&<>"']/g,function(character){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
 });
}
function notifyConsumers(){
 document.dispatchEvent(new CustomEvent('lithosite:nik-records-updated',{detail:{
  status:state.status,
  rows:state.rows.map(function(row){return Object.assign({},row);}),
  error:state.error
 }}));
}
function filteredRows(){
 const search=String(document.getElementById('equipmentNIKSearch')?.value||'').trim().toLocaleLowerCase();
 const origin=String(document.getElementById('equipmentNIKOriginFilter')?.value||'');
 return state.rows.filter(function(row){
  const matchesOrigin=!origin||String(row.Origin||'')===origin;
  const matchesSearch=!search||FIELDS.some(function(field){return String(row[field]??'').toLocaleLowerCase().includes(search);});
  return matchesOrigin&&matchesSearch;
 });
}
function syncOriginFilter(){
 const select=document.getElementById('equipmentNIKOriginFilter');
 if(!select)return;
 const current=select.value;
 const origins=Array.from(new Set(state.rows.map(function(row){return String(row.Origin||'').trim();}).filter(Boolean))).sort();
 select.replaceChildren(new Option('All origins',''));
 origins.forEach(function(origin){select.add(new Option(origin,origin));});
 if(origins.includes(current))select.value=current;
}
function render(){
 const host=document.getElementById('equipmentNIKListRows');
 const count=document.getElementById('equipmentNIKListCount');
 if(!host||!count)return;
 if(state.status==='loading'){
  host.innerHTML='<div class="equipment-nik-empty">Loading NIK records from RuntimeAdapter…</div>';
  count.textContent='Loading…';
  return;
 }
 if(state.status==='error'){
  host.innerHTML='<div class="equipment-nik-empty error">NIK list unavailable: '+esc(state.error||'RuntimeAdapter read failed')+'. Check the desktop host and refresh.</div>';
  count.textContent='Unavailable';
  return;
 }
 visibleRows=filteredRows();
 host.innerHTML=visibleRows.length?visibleRows.map(function(row){
  return '<div class="equipment-nik-row">'+FIELDS.map(function(field){
   const value=row[field];
   return '<div class="equipment-nik-cell">'+esc(value===null||value===undefined||value===''?'—':value)+'</div>';
  }).join('')+'<div class="equipment-nik-cell equipment-nik-profile-action"><button type="button" class="control mini view-nik-profile" data-id="'+esc(row['Id No (NIK)'])+'">View</button></div><div class="equipment-nik-cell equipment-nik-actions"><button type="button" class="control mini edit-nik" data-id="'+esc(row['Id No (NIK)'])+'">Edit</button> <button type="button" class="control mini danger delete-nik" data-id="'+esc(row['Id No (NIK)'] )+'">Delete</button></div></div>';
 }).join(''):'<div class="equipment-nik-empty">'+(state.rows.length?'No employees match the current filters.':'No employee records found in the NIK sheet.')+'</div>';
 count.textContent=visibleRows.length+' of '+state.rows.length+' employees · RuntimeAdapter';
}
async function refresh(){
 state.status='loading';
 state.error='';
 render();
 notifyConsumers();
 try{
  const result=await rc.request({operation:'READ',entity:'NIK',request_id:requestId('read')});
  if(result.status==='REJECTED'||result.status==='ERROR'||result.errors?.length){
   throw new Error((result.errors||[]).map(function(item){return item.message;}).join('; ')||('Runtime returned '+result.status));
  }
  if(!Array.isArray(result.data))throw new Error('RuntimeAdapter returned no NIK data array');
  state.rows=result.data.filter(function(row){
   return row&&FIELDS.some(function(field){return row[field]!==null&&row[field]!==undefined&&row[field]!=='';});
  }).map(function(row){
   const clean=Object.assign({},row);
   if(String(clean.Information||'').trim()===TEMPORARY_TEST_INFORMATION)clean.Information='';
   return clean;
  });
  state.status='ready';
  syncOriginFilter();
 }catch(error){
  state.status='error';
  state.error=String(error&&error.message||error);
  const message=document.getElementById('equipmentRuntimeMsg');
  if(message){
   message.textContent='NIK list refresh failed: '+state.error;
   message.classList.add('error');
  }
 }
 render();
 notifyConsumers();
 return state.rows.map(function(row){return Object.assign({},row);});
}
function open(){
 render();
 modal.show('equipmentNIKListModal');
 refresh();
}
function bind(){
 const openButton=document.getElementById('equipmentNIKListButton');
 const closeButton=document.getElementById('equipmentNIKListClose');
 const profileCloseButton=document.getElementById('equipmentNIKProfileClose');
 const refreshButton=document.getElementById('equipmentNIKListRefresh');
 const addButton=document.getElementById('equipmentNIKAdd');
 const cancelButton=document.getElementById('equipmentNIKCancel');
 const form=document.getElementById('equipmentNIKForm');
 const message=document.getElementById('equipmentNIKFormMessage');
 if(openButton)openButton.addEventListener('click',open);
 if(closeButton)closeButton.addEventListener('click',function(){modal.close('equipmentNIKListModal');});
 if(profileCloseButton)profileCloseButton.addEventListener('click',function(){modal.close('equipmentNIKProfileModal');});
 if(refreshButton)refreshButton.addEventListener('click',refresh);
 if(addButton)addButton.addEventListener('click',function(){
  if(!form)return;
  if(!form.hidden){form.reset();editingId=null;form.querySelector('[name="Id No (NIK)"]').readOnly=false;}
  form.hidden=!form.hidden;
  if(!form.hidden){message.textContent='';document.getElementById('equipmentNIKFormTitle').textContent='Add NIK';document.getElementById('equipmentNIKSave').textContent='Save NIK';form.querySelector('[name="Id No (NIK)"]').focus();}
 });
 if(cancelButton)cancelButton.addEventListener('click',function(){form.reset();form.hidden=true;editingId=null;form.querySelector('[name="Id No (NIK)"]').readOnly=false;message.textContent='';document.getElementById('equipmentNIKFormTitle').textContent='Add NIK';document.getElementById('equipmentNIKSave').textContent='Save NIK';});
 const listRows=document.getElementById('equipmentNIKListRows');
 if(listRows)listRows.addEventListener('click',async function(event){
  const profile=event.target.closest('.view-nik-profile');
  const edit=event.target.closest('.edit-nik');
  const del=event.target.closest('.delete-nik');
  if(profile){
   const id=profile.dataset.id;
   const row=state.rows.find(function(item){return String(item['Id No (NIK)'])===id;});
   if(!row)return;
   const profileImage=document.getElementById('equipmentNIKProfileImage');
   const profileMessage=document.getElementById('equipmentNIKProfileMessage');
   const profileTitle=document.getElementById('equipmentNIKProfileTitle');
   if(!profileImage||!profileMessage||!profileTitle)return;
   profileImage.hidden=true;
   profileImage.alt='Profile photo for '+String(row['Name Employment']||id);
   profileImage.dataset.nikId=id;
   profileTitle.textContent='Employee Profile — '+String(row['Name Employment']||id);
   profileMessage.textContent='Loading profile photo…';
   profileImage.onload=function(){
    if(profileImage.dataset.nikId!==id)return;
    profileImage.hidden=false;
    profileMessage.textContent='';
   };
   profileImage.onerror=function(){
    if(profileImage.dataset.nikId!==id)return;
    profileImage.hidden=true;
    profileMessage.textContent='No profile photo found. Place the image in Database/NIK as '+id+'.jpg, .jpeg, .png, or .webp.';
   };
   profileImage.src='/nik/profile?nik_id='+encodeURIComponent(id)+'&v='+Date.now();
   modal.show('equipmentNIKProfileModal');
   return;
  }
  if(edit){
   const row=state.rows.find(function(item){return String(item['Id No (NIK)'])===edit.dataset.id;});
   if(!row||!form)return;
   editingId=String(row['Id No (NIK)']);
   FIELDS.forEach(function(field){const input=form.elements.namedItem(field);if(input)input.value=row[field]??'';});
   form.querySelector('[name="Id No (NIK)"]').readOnly=true;
   form.hidden=false;
   document.getElementById('equipmentNIKFormTitle').textContent='Edit NIK';
   document.getElementById('equipmentNIKSave').textContent='Update NIK';
   message.textContent='NIK ID is locked to preserve the employee reference.';
   form.querySelector('[name="Name Employment"]').focus();
   return;
  }
  if(del){
   const id=del.dataset.id;
   const row=state.rows.find(function(item){return String(item['Id No (NIK)'])===id;});
   if(!row||!global.confirm('Delete NIK record for '+String(row['Name Employment']||id)+'? This removes the row from the A3 NIK sheet.'))return;
   del.disabled=true;
   try{
    const result=await rc.request({operation:'DELETE',entity:'NIK',entity_id:id,request_id:requestId('delete')});
    if(result.status!=='COMMITTED'||result.errors?.length)throw new Error((result.errors||[]).map(function(item){return item.message;}).join('; ')||'RuntimeAdapter did not delete the NIK record');
    await refresh();
    const runtimeMessage=document.getElementById('equipmentRuntimeMsg');
    if(runtimeMessage){runtimeMessage.textContent='NIK record deleted from A3.';runtimeMessage.classList.remove('error');}
   }catch(error){
    message.textContent='Delete failed: '+String(error&&error.message||error);
   }finally{del.disabled=false;}
  }
 });
 const search=document.getElementById('equipmentNIKSearch');
 const origin=document.getElementById('equipmentNIKOriginFilter');
 if(search)search.addEventListener('input',render);
 if(origin)origin.addEventListener('change',render);
 if(form)form.addEventListener('submit',async function(event){
  event.preventDefault();
  if(state.saving)return;
  const values=new FormData(form);
  const row={};
  FIELDS.forEach(function(field){row[field]=String(values.get(field)||'').trim();});
  if(!row['Id No (NIK)']||!row['Name Employment']){
   message.textContent='Id No (NIK) and Name Employment are required.';
   return;
  }
  state.saving=true;
  const save=document.getElementById('equipmentNIKSave');
  if(save)save.disabled=true;
  message.textContent='Saving employee to A3…';
  try{
   const result=editingId
    ?await rc.request({operation:'UPDATE',entity:'NIK',entity_id:editingId,patch:row,request_id:requestId('update')})
    :await rc.request({operation:'CREATE',entity:'NIK',row:row,request_id:requestId('create')});
   if(result.status!=='COMMITTED'||result.errors?.length){
    throw new Error((result.errors||[]).map(function(item){return item.message;}).join('; ')||'RuntimeAdapter did not commit the NIK record');
   }
   form.reset();
   form.hidden=true;
   editingId=null;
   form.querySelector('[name="Id No (NIK)"]').readOnly=false;
   document.getElementById('equipmentNIKFormTitle').textContent='Add NIK';
   document.getElementById('equipmentNIKSave').textContent='Save NIK';
   message.textContent='';
   await refresh();
   const runtimeMessage=document.getElementById('equipmentRuntimeMsg');
   if(runtimeMessage){runtimeMessage.textContent='NIK employee saved to A3.';runtimeMessage.classList.remove('error');}
  }catch(error){
   message.textContent=String(error&&error.message||error);
  }finally{
   state.saving=false;
   if(save)save.disabled=false;
  }
 });
}
function init(){
 bind();
 refresh();
}
global.LithositeNIK={
 getRecords:function(){return state.rows.map(function(row){return Object.assign({},row);});},
 getStatus:function(){return state.status;},
 refresh:refresh
};
if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
 init();
}
})(window);
