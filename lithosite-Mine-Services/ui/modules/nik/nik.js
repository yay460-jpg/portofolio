(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
const modal=global.LithositeModalShowContract;
if(!rc)throw new Error('LithositeRuntimeClient is required before the NIK module');
if(!modal)throw new Error('LithositeModalShowContract is required before the NIK module');

const state={rows:[],status:'loading',error:'',saving:false};
let editingId=null;
let clearPhotoConfirmResolve=null;
let clearPhotoConfirmReturnFocus=null;
function settleClearPhotoConfirmation(confirmed){
 const resolve=clearPhotoConfirmResolve;
 if(!resolve)return;
 const previousFocus=clearPhotoConfirmReturnFocus;
 clearPhotoConfirmResolve=null;
 clearPhotoConfirmReturnFocus=null;
 const confirmModal=document.getElementById('nikProfileClearConfirmModal');
 if(confirmModal){
  confirmModal.classList.remove('show','open');
  confirmModal.hidden=true;
  confirmModal.setAttribute('aria-hidden','true');
 }
 if(previousFocus&&document.contains(previousFocus)&&typeof previousFocus.focus==='function')previousFocus.focus();
 resolve(confirmed===true);
}
function requestClearPhotoConfirmation(id){
 const confirmModal=document.getElementById('nikProfileClearConfirmModal');
 const confirmId=document.getElementById('nikProfileClearConfirmId');
 const confirmAction=document.getElementById('nikProfileClearConfirmAction');
 if(!confirmModal||!confirmId||!confirmAction)return Promise.resolve(false);
 confirmId.textContent=String(id||'—');
 clearPhotoConfirmReturnFocus=document.activeElement;
 confirmModal.hidden=false;
 confirmModal.setAttribute('aria-hidden','false');
 confirmModal.classList.add('show','open');
 confirmAction.focus();
 return new Promise(function(resolve){clearPhotoConfirmResolve=resolve;});
}
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
 const profileUploadButton=document.getElementById('equipmentNIKProfileUpload');
 const profileClearButton=document.getElementById('equipmentNIKProfileClear');
 const profileUploadInput=document.getElementById('equipmentNIKProfileFile');
 const refreshButton=document.getElementById('equipmentNIKListRefresh');
 const addButton=document.getElementById('equipmentNIKAdd');
 const cancelButton=document.getElementById('equipmentNIKCancel');
 const form=document.getElementById('equipmentNIKForm');
 const message=document.getElementById('equipmentNIKFormMessage');
 if(openButton)openButton.addEventListener('click',open);
 if(closeButton)closeButton.addEventListener('click',function(){modal.close('equipmentNIKListModal');});
 if(profileCloseButton)profileCloseButton.addEventListener('click',function(){modal.close('equipmentNIKProfileModal');modal.show('equipmentNIKListModal');});
 if(profileUploadButton&&profileUploadInput){
  profileUploadButton.addEventListener('click',function(){
   if(!profileUploadButton.disabled)profileUploadInput.click();
  });
  profileUploadInput.addEventListener('change',async function(){
   const file=profileUploadInput.files&&profileUploadInput.files[0];
   const id=profileUploadInput.dataset.nikId||profileUploadButton.dataset.nikId;
   const profileMessage=document.getElementById('equipmentNIKProfileMessage');
   const profileImage=document.getElementById('equipmentNIKProfileImage');
   if(!file||!id||!profileMessage||!profileImage)return;
   if(file.size>2_000_000){
    profileMessage.textContent='Photo exceeds the 2 MB upload limit. Choose a smaller image.';
    profileUploadInput.value='';
    return;
   }
   if(!file.type.startsWith('image/')){
    profileMessage.textContent='Choose an image file (JPG, PNG, WEBP, or another browser-supported image).';
    profileUploadInput.value='';
    return;
   }
   profileUploadButton.disabled=true;
   if(profileClearButton)profileClearButton.disabled=true;
   profileMessage.textContent='Compressing photo to 100 KB or less…';
   try{
    if(typeof global.createImageBitmap!=='function')throw new Error('This browser does not support image compression.');
    const bitmap=await global.createImageBitmap(file);
    let width=bitmap.width;
    let height=bitmap.height;
    const longest=Math.max(width,height);
    if(longest>640){const scale=640/longest;width=Math.max(1,Math.round(width*scale));height=Math.max(1,Math.round(height*scale));}
    const canvas=document.createElement('canvas');
    const context=canvas.getContext('2d');
    if(!context)throw new Error('Image compression is not available.');
    let blob=null;
    for(let attempt=0;attempt<18;attempt++){
     canvas.width=width;canvas.height=height;
     context.clearRect(0,0,width,height);
     context.fillStyle='#ffffff';
     context.fillRect(0,0,width,height);
     context.drawImage(bitmap,0,0,width,height);
     const quality=Math.max(0.35,0.86-(attempt%6)*0.1);
     blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/jpeg',quality);});
     if(blob&&blob.size<=100_000)break;
     if(attempt%3===2){width=Math.max(96,Math.round(width*0.82));height=Math.max(96,Math.round(height*0.82));}
    }
    bitmap.close();
    if(!blob||blob.size>100_000)throw new Error('Could not compress this photo to 100 KB. Try a simpler or smaller image.');
    profileMessage.textContent='Uploading compressed photo…';
    const response=await fetch('/nik/upload?nik_id='+encodeURIComponent(id),{
     method:'POST',
     headers:{'Content-Type':'image/jpeg'},
     body:blob
    });
    const result=await response.json();
    if(!response.ok||result.status!=='READY'){
     throw new Error((result.errors||[]).map(function(item){return item.message;}).join('; ')||'Profile upload failed.');
    }
    profileImage.hidden=true;
    profileImage.src='/nik/profile?nik_id='+encodeURIComponent(id)+'&v='+Date.now();
    profileMessage.textContent='Photo saved · '+Math.round(result.size/1024*10)/10+' KB';
   }catch(error){
    profileMessage.textContent=String(error&&error.message||error);
   }finally{
    profileUploadButton.disabled=false;
    if(profileClearButton)profileClearButton.disabled=false;
    profileUploadInput.value='';
   }
  });
 }
 const clearConfirmClose=document.getElementById('nikProfileClearConfirmClose');
 const clearConfirmCancel=document.getElementById('nikProfileClearConfirmCancel');
 const clearConfirmAction=document.getElementById('nikProfileClearConfirmAction');
 const clearConfirmModal=document.getElementById('nikProfileClearConfirmModal');
 if(clearConfirmClose)clearConfirmClose.addEventListener('click',function(){settleClearPhotoConfirmation(false);});
 if(clearConfirmCancel)clearConfirmCancel.addEventListener('click',function(){settleClearPhotoConfirmation(false);});
 if(clearConfirmAction)clearConfirmAction.addEventListener('click',function(){settleClearPhotoConfirmation(true);});
 if(clearConfirmModal)clearConfirmModal.addEventListener('click',function(event){if(event.target===clearConfirmModal)settleClearPhotoConfirmation(false);});
 document.addEventListener('keydown',function(event){
  if(event.key==='Escape'&&clearPhotoConfirmResolve){event.preventDefault();settleClearPhotoConfirmation(false);}
 });
 if(profileClearButton){
  profileClearButton.addEventListener('click',async function(){
   const id=profileClearButton.dataset.nikId;
   const profileMessage=document.getElementById('equipmentNIKProfileMessage');
   const profileImage=document.getElementById('equipmentNIKProfileImage');
   if(!id||!profileMessage||!profileImage)return;
   if(!await requestClearPhotoConfirmation(id))return;
   profileClearButton.disabled=true;
   if(profileUploadButton)profileUploadButton.disabled=true;
   profileMessage.textContent='Clearing profile photo…';
   try{
    const response=await fetch('/nik/clear?nik_id='+encodeURIComponent(id),{method:'POST'});
    const result=await response.json();
    if(!response.ok||result.status!=='READY'){
     throw new Error((result.errors||[]).map(function(item){return item.message;}).join('; ')||'Could not clear profile photo.');
    }
    profileImage.hidden=true;
    profileImage.onload=null;
    profileImage.onerror=null;
    profileImage.removeAttribute('src');
    profileMessage.textContent=result.removed?'Profile photo cleared.':'No profile photo was stored for this NIK.';
   }catch(error){
    profileMessage.textContent=String(error&&error.message||error);
   }finally{
    profileClearButton.disabled=false;
    if(profileUploadButton)profileUploadButton.disabled=false;
   }
  });
 }
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
    profileMessage.textContent='No profile photo found. Use Upload Photo to add one.';
   };
   profileImage.src='/nik/profile?nik_id='+encodeURIComponent(id)+'&v='+Date.now();
   const uploadButton=document.getElementById('equipmentNIKProfileUpload');
   if(uploadButton){uploadButton.dataset.nikId=id;uploadButton.disabled=false;}
   const clearButton=document.getElementById('equipmentNIKProfileClear');
   if(clearButton){clearButton.dataset.nikId=id;clearButton.disabled=false;}
   const uploadInput=document.getElementById('equipmentNIKProfileFile');
   if(uploadInput){uploadInput.value='';uploadInput.dataset.nikId=id;}
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
   if(!row)return;
   const confirmed=await global.LithositeDeleteConfirmContract.confirm({
    entity:'NIK',
    id:id,
    message:'Delete the NIK record for '+String(row['Name Employment']||id)+'? This removes the row from the A3 NIK sheet.',
    warning:'This action cannot be undone. Only this NIK row is deleted; other employee records and profile photos are not intentionally changed.'
   });
   if(!confirmed)return;
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
