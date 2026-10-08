(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 13 Plans');

const state={rows:[],workfronts:[],status:'loading'};
let editId=null;
let runtimeReady=false;
const LISTS={domain:[],measurement:[],status:[]};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function setMsg(text,error){const el=document.getElementById('plansRuntimeMsg');if(el){el.textContent=text;el.classList.toggle('error',!!error);}}
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
 LISTS.measurement=Array.isArray(lists.measurement)?lists.measurement:[];
 LISTS.status=Array.isArray(lists.plan_status)?lists.plan_status:[];
 if(!LISTS.domain.length||!LISTS.measurement.length||!LISTS.status.length)throw new Error('Controlled vocabulary _Lists is incomplete for Plans');
 fillLists();
}
function fillLists(){
 fillSelect('plansDomainFilter',LISTS.domain,'All domains');
 fillSelect('plansStatusFilter',LISTS.status,'All status');
 fillWorkFrontSelect('plansWorkFrontFilter','All work fronts');
 fillSelect('f_plan_domain',LISTS.domain,'Select domain');
 fillWorkFrontSelect('f_plan_work_front','None');
 fillSelect('f_plan_measurement',LISTS.measurement,'Select measurement');
 fillSelect('f_plan_status',LISTS.status,'Select status');
}
function filtered(){
 const id=document.getElementById('plansIdFilter').value.trim().toLowerCase();
 const period=document.getElementById('plansPeriodFilter').value.trim().toLowerCase();
 const domain=document.getElementById('plansDomainFilter').value;
 const wf=document.getElementById('plansWorkFrontFilter').value;
 const status=document.getElementById('plansStatusFilter').value;
 return state.rows.filter(r=>
  (!id||String(r.plan_id||'').toLowerCase().includes(id))&&
  (!period||String(r.period||'').toLowerCase().includes(period))&&
  (!domain||r.domain===domain)&&
  (!wf||r.work_front_id===wf)&&
  (!status||r.status===status)
 );
}
function render(){
 const host=document.getElementById('plansRows');if(!host)return;
 if(state.status==='loading')host.innerHTML='<div class="empty">Loading Plans from RuntimeAdapter…</div>';
 else if(state.status==='error')host.innerHTML='<div class="empty">Plans data unavailable. Check RuntimeAdapter connection and use Refresh.</div>';
 else{
  const rows=filtered();
  host.innerHTML=rows.length?rows.map(r=>'<div class="plantr td">'+
   '<div class="cell">'+esc(r.plan_id)+'</div>'+
   '<div class="cell">'+esc(r.period)+'</div>'+
   '<div class="cell">'+esc(r.domain)+'</div>'+
   '<div class="cell">'+esc(workFrontLabel(r.work_front_id))+'</div>'+
   '<div class="cell plan-activity" title="'+esc(r.activity)+'">'+esc(r.activity)+'</div>'+
   '<div class="cell num">'+esc(r.target_quantity)+'</div>'+
   '<div class="cell">'+esc(r.measurement)+'</div>'+
   '<div class="cell num">'+esc(r.target_hours)+'</div>'+
   '<div class="cell"><span class="statuspill '+statusClass(r.status)+'">'+esc(r.status)+'</span></div>'+
   '<div class="cell row-actions"><button class="control mini edit edit-plan" data-id="'+esc(r.plan_id)+'">Edit</button><button class="control mini danger delete-plan" data-id="'+esc(r.plan_id)+'">Delete</button></div>'+
  '</div>').join(''):'<div class="empty">No Plans records match the current filters.</div>';
  document.getElementById('plansCount').textContent=rows.length+' records · Runtime Ready';
 }
 if(state.status==='loading')document.getElementById('plansCount').textContent='Loading · Runtime Connecting';
 if(state.status==='error')document.getElementById('plansCount').textContent='Unavailable · Runtime Error';
}
function statusClass(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')||'status';}
async function load(){
 if(!state.rows.length){state.status='loading';render();}
 try{
  const health=await rc.health();runtimeReady=health.status==='READY';
  if(!runtimeReady)throw new Error('Runtime health is not READY');
  await loadLists();
  const wf=await rc.request({operation:'READ',entity:'WorkFront'});
  state.workfronts=Array.isArray(wf.data)?wf.data:[];
  fillLists();
  const result=await rc.request({operation:'READ',entity:'Plans'});
  state.rows=Array.isArray(result.data)?result.data:[];
  state.status='ready';render();
  setMsg('RuntimeAdapter connected — Plans persistence is offline-first and audit-backed.');
 }catch(e){
  runtimeReady=false;state.status='error';render();
  const detail=e&&e.message?e.message:String(e);
  setMsg('Runtime unavailable: '+detail+'. Start desktop-host/server.py.',true);
 }
}
async function refreshData(){
 try{const result=await rc.request({operation:'READ',entity:'Plans'});state.rows=Array.isArray(result.data)?result.data:[];state.status='ready';render();}
 catch(e){setMsg('Refresh failed: '+e.message,true);}
}
function localPeriod(){
 const now=new Date();
 return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,7);
}
function resetForm(){
 document.getElementById('f_plan_id').value='PLN-'+Date.now().toString(36).toUpperCase();
 document.getElementById('f_plan_period').value=localPeriod();
 document.getElementById('f_plan_domain').value=LISTS.domain[0]||'';
 document.getElementById('f_plan_work_front').value='';
 document.getElementById('f_plan_activity').value='';
 document.getElementById('f_plan_target_quantity').value='';
 document.getElementById('f_plan_measurement').value=LISTS.measurement[0]||'';
 document.getElementById('f_plan_target_hours').value='';
 document.getElementById('f_plan_status').value=LISTS.status.includes('Draft')?'Draft':(LISTS.status[0]||'');
}
function openAdd(){
 editId=null;
 document.getElementById('plansModalTitle').textContent='Add Plan';
 document.getElementById('plansSave').textContent='Save via RuntimeAdapter';
 resetForm();global.LithositeModalShowContract.show('plansModal');
}
function openEdit(id){
 const row=state.rows.find(x=>String(x.plan_id)===String(id));if(!row)return;
 editId=id;
 document.getElementById('plansModalTitle').textContent='Edit Plan';
 document.getElementById('plansSave').textContent='Update via RuntimeAdapter';
 const map={f_plan_id:row.plan_id,f_plan_period:row.period,f_plan_domain:row.domain,f_plan_work_front:row.work_front_id,
  f_plan_activity:row.activity,f_plan_target_quantity:row.target_quantity,f_plan_measurement:row.measurement,f_plan_target_hours:row.target_hours,f_plan_status:row.status};
 Object.entries(map).forEach(([id,v])=>document.getElementById(id).value=v??'');
 global.LithositeModalShowContract.show('plansModal');
}
function payload(){
 return {
  plan_id:document.getElementById('f_plan_id').value,
  period:document.getElementById('f_plan_period').value,
  domain:document.getElementById('f_plan_domain').value,
  work_front_id:document.getElementById('f_plan_work_front').value||null,
  activity:document.getElementById('f_plan_activity').value.trim(),
  target_quantity:document.getElementById('f_plan_target_quantity').value===''?null:Number(document.getElementById('f_plan_target_quantity').value),
  measurement:document.getElementById('f_plan_measurement').value,
  target_hours:document.getElementById('f_plan_target_hours').value===''?null:Number(document.getElementById('f_plan_target_hours').value),
  status:document.getElementById('f_plan_status').value
 };
}
async function save(){
 if(!runtimeReady){setMsg('RuntimeAdapter is not connected. Start desktop-host/server.py first.',true);return;}
 const row=payload();
 if(!row.period||!row.domain||!row.activity||row.target_quantity===null||!row.measurement||row.target_hours===null||!row.status){
  setMsg('Period, Domain, Activity, Target Quantity, Unit, Target Hours and Status are required.',true);return;
 }
 if(Number.isNaN(row.target_quantity)||Number.isNaN(row.target_hours)||row.target_quantity<0||row.target_hours<0){
  setMsg('Target Quantity and Target Hours must be non-negative numbers.',true);return;
 }
 try{
  const result=editId?await rc.request({operation:'UPDATE',entity:'Plans',entity_id:editId,patch:row}):await rc.request({operation:'CREATE',entity:'Plans',row});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Runtime rejected the Plan record');
  global.LithositeModalShowContract.close('plansModal');
  await refreshData();
  setMsg(editId?'Plan updated and audited.':'Plan created and audited.');
 }catch(e){setMsg('Validation/runtime error: '+e.message,true);}
}
async function remove(id){
 if(!confirm('Delete Plan '+id+'?\nRuntime will validate references and audit the mutation.'))return;
 try{
  const result=await rc.request({operation:'DELETE',entity:'Plans',entity_id:id});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');
  await refreshData();
  setMsg('Plan deleted and audited.');
 }catch(e){setMsg('Delete failed: '+e.message,true);}
}
function bind(){
 document.getElementById('plansAdd').onclick=openAdd;
 document.getElementById('plansRefresh').onclick=load;
 document.getElementById('plansSave').onclick=save;
 document.getElementById('plansClose').onclick=()=>global.LithositeModalShowContract.close('plansModal');
 document.getElementById('plansCancel').onclick=()=>global.LithositeModalShowContract.close('plansModal');
 document.getElementById('plansClear').onclick=()=>{['plansIdFilter','plansPeriodFilter','plansDomainFilter','plansWorkFrontFilter','plansStatusFilter'].forEach(id=>document.getElementById(id).value='');render();};
 ['plansIdFilter','plansPeriodFilter','plansDomainFilter','plansWorkFrontFilter','plansStatusFilter'].forEach(id=>{const e=document.getElementById(id);e.addEventListener('input',render);e.addEventListener('change',render);});
 document.getElementById('plansRows').addEventListener('click',e=>{const edit=e.target.closest('.edit-plan');if(edit)openEdit(edit.dataset.id);const del=e.target.closest('.delete-plan');if(del)remove(del.dataset.id);});
}
function init(){if(!document.getElementById('plansScreen'))return;if(document.getElementById('plansAdd'))bind();load();}
if(global.LithositeDataSync)global.LithositeDataSync.register('Plans',refreshData);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

global.LithositePlans=Object.freeze({
 entity:'Plans',
 readAll:()=>rc.request({operation:'READ',entity:'Plans'}),
 create:(row)=>rc.request({operation:'CREATE',entity:'Plans',row}),
 update:(id,patch)=>rc.request({operation:'UPDATE',entity:'Plans',entity_id:id,patch}),
 delete:(id)=>rc.request({operation:'DELETE',entity:'Plans',entity_id:id})
});
})(window);
