(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 13 Plans');

const state={rows:[],operations:[],workfronts:[],status:'loading',operationsStatus:'loading'};
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
  (!period||((r.start_date||((r.period||'')+'-01'))<=period+'-31'&&(r.end_date||((r.period||'')+'-31'))>=period+'-01'))&&
  (!domain||r.domain===domain)&&
  (!wf||r.work_front_id===wf)&&
  (!status||r.status===status)
 );
}
function planDateBounds(row){
 const period=String(row.period||'');
 return {start:String(row.start_date||monthStart(period)||'').slice(0,10),end:String(row.end_date||monthEnd(period)||'').slice(0,10)};
}
function numberLabel(value){
 const n=Number(value);
 return Number.isFinite(n)?String(Number(n.toFixed(2))):'—';
}
function normalizeMatch(value){return String(value??'').trim().toLowerCase().replace(/\s+/g,' ');}
function actualQuantityFor(plan){
 if(state.operationsStatus!=='ready')return null;
 const range=planDateBounds(plan),domain=normalizeMatch(plan.domain);
 const workFront=String(plan.work_front_id||'').trim(),activity=normalizeMatch(plan.activity),measurement=normalizeMatch(plan.measurement);
 return state.operations.reduce(function(sum,row){
  if(String(row.status||'').trim().toUpperCase()!=='VALIDATED')return sum;
  const date=String(row.transaction_date||'').slice(0,10);
  if(!date||!range.start||!range.end||date<range.start||date>range.end)return sum;
  if(normalizeMatch(row.domain)!==domain)return sum;
  if(workFront&&String(row.work_front_id||'').trim()!==workFront)return sum;
  if(normalizeMatch(row.activity)!==activity)return sum;
  if(normalizeMatch(row.measurement)!==measurement)return sum;
  const quantity=Number(row.quantity);
  return Number.isFinite(quantity)&&quantity>=0?sum+quantity:sum;
 },0);
}
function render(){
 const host=document.getElementById('plansRows');if(!host)return;
 const count=document.getElementById('plansCount');
 if(state.status==='loading'){
  host.innerHTML='<div class="empty">Loading Target Plan and Operations from RuntimeAdapter…</div>';
 }else if(state.status==='error'){
  host.innerHTML='<div class="empty">Target Plan data unavailable. Check RuntimeAdapter connection and use Refresh.</div>';
 }else{
  const rows=filtered();
  host.innerHTML=rows.length?rows.map(function(r){
   const range=planDateBounds(r);
   const operationsReady=state.operationsStatus==='ready';
   const actual=operationsReady?actualQuantityFor(r):null;
   const target=r.target_quantity===null||r.target_quantity===undefined||r.target_quantity===''?null:Number(r.target_quantity);
   const validTarget=target!==null&&Number.isFinite(target)&&target>=0;
   const validActual=operationsReady&&actual!==null&&Number.isFinite(actual)&&actual>=0;
   const variance=validTarget&&validActual?actual-target:null;
   const achievement=validTarget&&validActual&&target>0?actual/target*100:null;
   const remaining=validTarget&&validActual?Math.max(target-actual,0):null;
   const unit=String(r.measurement||'');
   return '<div class="plantr td consolidated-tr">'+
    '<div class="cell">'+esc(r.plan_id)+'</div>'+
    '<div class="cell" title="'+esc(range.start)+'">'+esc(range.start)+'</div>'+
    '<div class="cell" title="'+esc(range.end)+'">'+esc(range.end)+'</div>'+
    '<div class="cell">'+esc(r.domain)+'</div>'+
    '<div class="cell" title="'+esc(workFrontLabel(r.work_front_id))+'">'+esc(workFrontLabel(r.work_front_id))+'</div>'+
    '<div class="cell plan-activity" title="'+esc(r.activity)+'">'+esc(r.activity)+'</div>'+
    '<div class="cell num target-quantity" title="'+esc(validTarget?numberLabel(target):'—')+'">'+esc(validTarget?numberLabel(target):'—')+'</div>'+
    '<div class="cell measurement-cell">'+esc(unit)+'</div>'+
    '<div class="cell num actual-quantity" title="'+esc(validActual?numberLabel(actual):'Actual unavailable')+'">'+(validActual?esc(numberLabel(actual)):'—')+'</div>'+
    '<div class="cell num variance" title="'+esc(variance===null?'Variance unavailable':numberLabel(variance))+'">'+(variance===null?'—':esc((variance>0?'+':'')+numberLabel(variance)))+'</div>'+
    '<div class="cell num achievement">'+(achievement===null?'—':esc(numberLabel(achievement)+'%'))+'</div>'+
    '<div class="cell num remaining">'+(remaining===null?'—':esc(numberLabel(remaining)))+'</div>'+
    '<div class="cell status-cell"><span class="statuspill '+statusClass(r.status)+'">'+esc(r.status)+'</span></div>'+
    '<div class="cell row-actions"><button class="control mini edit edit-plan" data-id="'+esc(r.plan_id)+'">Edit</button><button class="control mini danger delete-plan" data-id="'+esc(r.plan_id)+'">Delete</button></div>'+
   '</div>';
  }).join(''):'<div class="empty">No Target Plan records match the current filters.</div>';
  if(count){
   const operationsNote=state.operationsStatus==='ready'
    ?'Actual from VALIDATED Operations'
    :state.operationsStatus==='error'
     ?'Operations unavailable · Actuals not calculated'
     :'Loading Operations…';
   count.textContent=rows.length+' records · '+operationsNote;
  }
 }
 if(state.status==='loading'&&count)count.textContent='Loading · Runtime Connecting';
 if(state.status==='error'&&count)count.textContent='Unavailable · Runtime Error';
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
  state.status='ready';
  await refreshOperations();
  render();
  setMsg('RuntimeAdapter connected — Target Plan and Operations are available. Actuals use VALIDATED Operations only.');
 }catch(e){
  runtimeReady=false;state.status='error';render();
  const detail=e&&e.message?e.message:String(e);
  setMsg('Runtime unavailable: '+detail+'. Start desktop-host/server.py.',true);
 }
}
async function refreshData(){
 try{
  const result=await rc.request({operation:'READ',entity:'Plans'});
  state.rows=Array.isArray(result.data)?result.data:[];
  state.status='ready';
  await refreshOperations();
  render();
 }catch(e){setMsg('Refresh failed: '+e.message,true);}
}
async function refreshOperations(){
 try{
  const result=await rc.request({operation:'READ',entity:'Operations'});
  state.operations=Array.isArray(result.data)?result.data:[];
  state.operationsStatus='ready';
 }catch(e){
  state.operations=[];
  state.operationsStatus='error';
  setMsg('Operations read failed; actual performance metrics are unavailable: '+(e&&e.message?e.message:String(e)),true);
 }
 render();
}
function localDate(){
 const now=new Date();
 return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function monthStart(period){return period?period+'-01':'';}
function monthEnd(period){
 if(!period)return '';
 const parts=period.split('-').map(Number);
 const last=new Date(parts[0],parts[1],0).getDate();
 return period+'-'+String(last).padStart(2,'0');
}
function resetForm(){
 document.getElementById('f_plan_id').value='PLN-'+Date.now().toString(36).toUpperCase();
 const today=localDate();
 document.getElementById('f_plan_start_date').value=today;
 document.getElementById('f_plan_end_date').value=today;
 document.getElementById('f_plan_domain').value=LISTS.domain[0]||'';
 document.getElementById('f_plan_work_front').value='';
 document.getElementById('f_plan_activity').value='';
 document.getElementById('f_plan_target_quantity').value='';
 document.getElementById('f_plan_measurement').value=LISTS.measurement[0]||'';
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
 const fallbackStart=monthStart(row.period||'');
 const fallbackEnd=monthEnd(row.period||'');
 const map={f_plan_id:row.plan_id,f_plan_start_date:row.start_date||fallbackStart,f_plan_end_date:row.end_date||fallbackEnd,f_plan_domain:row.domain,f_plan_work_front:row.work_front_id,
  f_plan_activity:row.activity,f_plan_target_quantity:row.target_quantity,f_plan_measurement:row.measurement,f_plan_status:row.status};
 Object.entries(map).forEach(([id,v])=>document.getElementById(id).value=v??'');
 global.LithositeModalShowContract.show('plansModal');
}
function payload(){
 return {
  plan_id:document.getElementById('f_plan_id').value,
  start_date:document.getElementById('f_plan_start_date').value,
  end_date:document.getElementById('f_plan_end_date').value,
  period:document.getElementById('f_plan_start_date').value.slice(0,7),
  domain:document.getElementById('f_plan_domain').value,
  work_front_id:document.getElementById('f_plan_work_front').value||null,
  activity:document.getElementById('f_plan_activity').value.trim(),
  target_quantity:document.getElementById('f_plan_target_quantity').value===''?null:Number(document.getElementById('f_plan_target_quantity').value),
  measurement:document.getElementById('f_plan_measurement').value,
  status:document.getElementById('f_plan_status').value
 };
}
async function save(){
 if(!runtimeReady){setMsg('RuntimeAdapter is not connected. Start desktop-host/server.py first.',true);return;}
 const row=payload();
 if(!row.start_date||!row.end_date||!row.period||!row.domain||!row.activity||row.target_quantity===null||!row.measurement||!row.status){
  setMsg('Start Date, End Date, Domain, Activity, Target Quantity, Unit and Status are required.',true);return;
 }
 if(row.end_date<row.start_date){setMsg('End Date must be on or after Start Date.',true);return;}
 if(Number.isNaN(row.target_quantity)||row.target_quantity<0){
  setMsg('Target Quantity must be a non-negative number.',true);return;
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
if(global.LithositeDataSync){global.LithositeDataSync.register('Plans',refreshData);global.LithositeDataSync.register('Operations',refreshOperations);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

global.LithositePlans=Object.freeze({
 entity:'Plans',
 readAll:()=>rc.request({operation:'READ',entity:'Plans'}),
 create:(row)=>rc.request({operation:'CREATE',entity:'Plans',row}),
 update:(id,patch)=>rc.request({operation:'UPDATE',entity:'Plans',entity_id:id,patch}),
 delete:(id)=>rc.request({operation:'DELETE',entity:'Plans',entity_id:id})
});
})(window);
