(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 9 Equipment');
const state={rows:[]};
let editId=null;
let runtimeReady=false;

/* A.1 controlled vocabulary contract mirrored from the authoritative runtime schema: equipment_category, equipment_type, owner_type, equipment_status. */
const LISTS={
 category:['Heavy Equipment','Light Vehicle','Support Equipment'],
 type:['Dump Truck','Excavator','Dozer','Grader','Water Truck','Loader','Light Vehicle','Other'],
 owner_type:['Owner','Contractor'],
 status:['Active','Inactive','Retired']
};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function setMsg(text,error){
 const el=document.getElementById('equipmentRuntimeMsg');
 if(el){el.textContent=text;el.classList.toggle('error',!!error);}
}
function fillSelect(id,items,empty){
 const el=document.getElementById(id);
 const current=el.value;
 el.innerHTML='<option value="">'+esc(empty)+'</option>'+items.map(v=>'<option value="'+esc(v).replace(/"/g,'&quot;')+'">'+esc(v)+'</option>').join('');
 if(items.includes(current))el.value=current;
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
function filtered(){
 const id=document.getElementById('equipmentIdFilter').value.trim().toLowerCase();
 const cat=document.getElementById('equipmentCategoryFilter').value;
 const type=document.getElementById('equipmentTypeFilter').value;
 const owner=document.getElementById('equipmentOwnerFilter').value;
 const status=document.getElementById('equipmentStatusFilter').value;
 return state.rows.filter(r=>
   (!id||String(r.equipment_id||'').toLowerCase().includes(id))&&
   (!cat||r.category===cat)&&(!type||r.type===type)&&
   (!owner||r.owner_type===owner)&&(!status||r.status===status)
 );
}
function render(){
 const rows=filtered();
 document.getElementById('equipmentRows').innerHTML=rows.length?rows.map(r=>{
   const cls=String(r.status||'').toLowerCase().replace(/[^a-z]/g,'')||'inactive-status';
   return '<div class="tr td">'+
    '<div class="cell">'+esc(r.equipment_id)+'</div>'+
    '<div class="cell">'+esc(r.category)+'</div>'+
    '<div class="cell">'+esc(r.type)+'</div>'+
    '<div class="cell">'+esc(r.owner_type)+'</div>'+
    '<div class="cell">'+esc(r.owner_name)+'</div>'+
    '<div class="cell"><span class="statuspill '+cls+'-status">'+esc(r.status)+'</span></div>'+
    '<div class="cell">'+esc(r.effective_from)+'</div>'+
    '<div class="cell">'+esc(r.effective_to)+'</div>'+
    '<div class="cell row-actions"><button class="control mini edit-equipment" data-id="'+esc(r.equipment_id)+'">Edit</button><button class="control mini danger delete-equipment" data-id="'+esc(r.equipment_id)+'">Delete</button></div>'+
   '</div>';
 }).join(''):'<div class="empty">No equipment matches the current filters.</div>';
 document.getElementById('equipmentCount').textContent=rows.length+' records · '+(runtimeReady?'Runtime Ready':'Runtime Not Connected');
}
async function load(){
 try{
   const health=await rc.health();
   runtimeReady=health.status==='READY';
   const result=await rc.request({operation:'READ',entity:'Equipment'});
   state.rows=Array.isArray(result.data)?result.data:[];
   render();
   setMsg('RuntimeAdapter connected — offline local persistence active.');
 }catch(e){
   runtimeReady=false;state.rows=[];render();
   setMsg('Runtime unavailable: '+e.message+'. Start desktop-host/server.py.',true);
 }
}
function resetForm(){
 const now=new Date();
 const d=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
 document.getElementById('f_eq_id').value='EQ-'+d.replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
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
 document.getElementById('equipmentModal').classList.add('show');
}
function openEdit(id){
 const row=state.rows.find(x=>String(x.equipment_id)===String(id));if(!row)return;
 editId=id;document.getElementById('equipmentModalTitle').textContent='Edit Equipment';
 document.getElementById('equipmentSave').textContent='Update via RuntimeAdapter';
 const map={f_eq_id:row.equipment_id,f_eq_category:row.category,f_eq_type:row.type,f_eq_owner_type:row.owner_type,f_eq_owner_name:row.owner_name,f_eq_status:row.status,f_eq_from:row.effective_from,f_eq_to:row.effective_to};
 Object.entries(map).forEach(([id,v])=>document.getElementById(id).value=v??'');
 document.getElementById('equipmentModal').classList.add('show');
}
function payload(){
 return {
  equipment_id:document.getElementById('f_eq_id').value,
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
 if(!row.category||!row.type||!row.owner_type||!row.status){setMsg('Category, Type, Owner Type and Status are required.',true);return;}
 try{
  const result=editId?await rc.request({operation:'UPDATE',entity:'Equipment',entity_id:editId,patch:row}):await rc.request({operation:'CREATE',entity:'Equipment',row});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Runtime rejected the equipment');
  document.getElementById('equipmentModal').classList.remove('show');
  await load();setMsg(editId?'Equipment updated and audited.':'Equipment created and audited.');
 }catch(e){setMsg('Validation/runtime error: '+e.message,true);}
}
async function remove(id){
 if(!confirm('Delete equipment '+id+'?\nRuntime will reject deletion if the equipment is referenced.'))return;
 try{
  const result=await rc.request({operation:'DELETE',entity:'Equipment',entity_id:id});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');
  await load();setMsg('Equipment deleted and audited.');
 }catch(e){setMsg('Delete failed: '+e.message,true);}
}
function bind(){
 document.getElementById('equipmentAdd').onclick=openAdd;
 document.getElementById('equipmentRefresh').onclick=load;
 document.getElementById('equipmentSave').onclick=save;
 document.getElementById('equipmentClose').onclick=()=>document.getElementById('equipmentModal').classList.remove('show');
 document.getElementById('equipmentCancel').onclick=()=>document.getElementById('equipmentModal').classList.remove('show');
 document.getElementById('equipmentClear').onclick=()=>{['equipmentIdFilter','equipmentCategoryFilter','equipmentTypeFilter','equipmentOwnerFilter','equipmentStatusFilter'].forEach(id=>document.getElementById(id).value='');render();};
 ['equipmentIdFilter','equipmentCategoryFilter','equipmentTypeFilter','equipmentOwnerFilter','equipmentStatusFilter'].forEach(id=>{const e=document.getElementById(id);e.addEventListener('input',render);e.addEventListener('change',render);});
 document.getElementById('equipmentRows').addEventListener('click',e=>{
  const edit=e.target.closest('.edit-equipment');if(edit)openEdit(edit.dataset.id);
  const del=e.target.closest('.delete-equipment');if(del)remove(del.dataset.id);
 });
}
fillLists();bind();load();
})(window);