(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
const modal=global.LithositeModalShowContract;
if(!rc)throw new Error('LithositeRuntimeClient is required before the NIK module');
if(!modal)throw new Error('LithositeModalShowContract is required before the NIK module');

const state={rows:[],status:'loading'};
const FIELDS=['Effective From','Effective To','Id No (NIK)','Origin','Name Employment','Information'];

function esc(value){
 return String(value??'').replace(/[&<>"']/g,function(character){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
 });
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
  host.innerHTML='<div class="equipment-nik-empty error">NIK list unavailable. Check RuntimeAdapter and refresh.</div>';
  count.textContent='Unavailable';
  return;
 }
 host.innerHTML=state.rows.length?state.rows.map(function(row){
  return '<div class="equipment-nik-row">'+FIELDS.map(function(field){
   const value=row[field];
   return '<div class="equipment-nik-cell">'+esc(value===null||value===undefined||value===''?'—':value)+'</div>';
  }).join('')+'</div>';
 }).join(''):'<div class="equipment-nik-empty">No employee records found in the NIK sheet.</div>';
 count.textContent=state.rows.length+' employees · RuntimeAdapter · Read-only';
}
async function refresh(){
 state.status='loading';
 render();
 try{
  const result=await rc.request({operation:'READ',entity:'NIK'});
  if(result.status==='REJECTED'||result.status==='ERROR'||result.errors?.length){
   throw new Error((result.errors||[]).map(function(item){return item.message;}).join('; ')||'Runtime rejected NIK read');
  }
  state.rows=Array.isArray(result.data)?result.data:[];
  state.status='ready';
 }catch(error){
  state.status='error';
  const message=document.getElementById('equipmentRuntimeMsg');
  if(message){
   message.textContent='NIK list refresh failed: '+error.message;
   message.classList.add('error');
  }
 }
 render();
}
function open(){
 render();
 modal.show('equipmentNIKListModal');
 refresh();
}
function bind(){
 const openButton=document.getElementById('equipmentNIKListButton');
 const closeButton=document.getElementById('equipmentNIKListClose');
 const refreshButton=document.getElementById('equipmentNIKListRefresh');
 if(openButton)openButton.addEventListener('click',open);
 if(closeButton)closeButton.addEventListener('click',function(){modal.close('equipmentNIKListModal');});
 if(refreshButton)refreshButton.addEventListener('click',refresh);
}
function init(){
 bind();
}
if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
 init();
}
})(window);
