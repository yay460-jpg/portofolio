(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before Stage 13 Plans');

const state={rows:[],operations:[],workfronts:[],status:'loading',operationsStatus:'loading'};
let editId=null;
let runtimeReady=false;
let activeEvidencePlanId='';
let activeEvidenceFiles=[];
let activeEvidenceObjectUrl='';
let evidencePreviewRequest=0;
let evidenceUploadBusy=false;
const EVIDENCE_UPLOAD_EXTENSIONS=new Set(['.pdf','.jpg','.jpeg','.png','.doc','.docx']);
const MAX_EVIDENCE_UPLOAD_BYTES=100000000;
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
    '<div class="cell evidence-cell"><button type="button" class="control mini view-evidence" data-id="'+esc(r.plan_id)+'">View</button></div>'+
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
function evidenceSizeLabel(bytes){
 const size=Number(bytes)||0;
 if(size<1024)return size+' B';
 if(size<1024*1024)return (size/1024).toFixed(1)+' KB';
 if(size<1024*1024*1024)return (size/(1024*1024)).toFixed(1)+' MB';
 return (size/(1024*1024*1024)).toFixed(1)+' GB';
}
function evidenceDateLabel(timestamp){
 const date=new Date((Number(timestamp)||0)*1000);
 return Number.isFinite(date.getTime())?date.toLocaleString():'';
}
function evidenceFileUrl(name){
 return rc.HOST+'/evidence/file?module=TargetPlan&record_id='+encodeURIComponent(activeEvidencePlanId)+'&filename='+encodeURIComponent(name);
}
function renderEvidenceFiles(files){
 const host=document.getElementById('planEvidenceList');
 if(!host)return;
 if(!files.length){
  const planId=activeEvidencePlanId;
  const folder='Database/Evidence/TargetPlan/'+planId;
  host.innerHTML='<div class="evidence-empty">No evidence files are linked to this Target Plan yet.<br><br>Copy PDF, JPG, PNG, DOC or DOCX files into <code>'+esc(folder)+'</code>, then select <b>Refresh list</b>.</div>';
  return;
 }
 host.innerHTML=files.map(function(file){
  const extension=String(file.name||'').split('.').pop().toUpperCase();
  const availability=file.available!==false;
  return '<button type="button" class="evidence-file-button" data-evidence-name="'+esc(file.name)+'" '+(availability?'':'disabled title="File exceeds the 100 MB preview limit"')+'>'+
   '<span class="evidence-file-icon">'+esc(extension.slice(0,5))+'</span>'+
   '<span class="evidence-file-description"><span class="evidence-file-name">'+esc(file.name)+'</span><span class="evidence-file-meta">'+esc(evidenceSizeLabel(file.size))+' · '+esc(evidenceDateLabel(file.modified_at))+(availability?'':' · Too large to open')+'</span></span>'+
  '</button>';
 }).join('');
}
function releaseEvidencePreviewUrl(){
 if(activeEvidenceObjectUrl){URL.revokeObjectURL(activeEvidenceObjectUrl);activeEvidenceObjectUrl='';}
}
function invalidateEvidencePreview(){
 evidencePreviewRequest+=1;
 releaseEvidencePreviewUrl();
}
async function previewEvidenceFile(name){
 const host=document.getElementById('planEvidencePreview');
 const status=document.getElementById('planEvidenceStatus');
 const file=activeEvidenceFiles.find(function(item){return String(item.name)===String(name);});
 if(!host||!file)return;
 const requestId=++evidencePreviewRequest;
 const planId=activeEvidencePlanId;
 releaseEvidencePreviewUrl();
 if(file.available===false){
  host.innerHTML='<div class="evidence-empty">This file exceeds the 100 MB preview limit.</div>';
  return;
 }
 const url=evidenceFileUrl(file.name);
 const safeName=esc(file.name);
 const mime=String(file.mime_type||'').toLowerCase();
 const isPdf=file.previewable&&mime==='application/pdf';
 const isImage=file.previewable&&mime.indexOf('image/')===0;
 if(isPdf||isImage){
  host.innerHTML='<div class="evidence-preview-content"><div class="evidence-preview-toolbar"><span>'+safeName+'</span></div><div class="evidence-empty">Loading file preview…</div></div>';
  if(status){status.classList.remove('error');status.textContent=(isPdf?'Loading PDF preview: ':'Loading image preview: ')+file.name;}
  try{
   const response=await fetch(rc.HOST+'/evidence/preview',{
    method:'POST',
    cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({module:'TargetPlan',record_id:planId,filename:file.name})
   });
   const payload=await response.json();
   if(!response.ok||payload.status!=='READY'||typeof payload.data!=='string') {
    const detail=payload.errors&&payload.errors[0]&&payload.errors[0].message;
    throw new Error(detail||'Evidence preview request failed (HTTP '+response.status+')');
   }
   if(requestId!==evidencePreviewRequest||activeEvidencePlanId!==planId)return;
   const binary=atob(payload.data);
   const bytes=new Uint8Array(binary.length);
   for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   const previewBlob=new Blob([bytes],{type:String(payload.mime_type||file.mime_type||'application/octet-stream')});
   const objectUrl=URL.createObjectURL(previewBlob);
   activeEvidenceObjectUrl=objectUrl;
   if(isPdf){
    host.innerHTML='<div class="evidence-preview-content"><div class="evidence-preview-toolbar"><span>'+safeName+'</span></div><iframe class="evidence-pdf" src="'+esc(objectUrl)+'" title="'+safeName+'"></iframe></div>';
    if(status)status.textContent='PDF preview: '+file.name;
   }else{
    host.innerHTML='<div class="evidence-preview-content"><div class="evidence-preview-toolbar"><span>'+safeName+'</span></div><img class="evidence-image" src="'+esc(objectUrl)+'" alt="'+safeName+'"></div>';
    if(status)status.textContent='Image preview: '+file.name;
   }
  }catch(error){
   if(requestId!==evidencePreviewRequest||activeEvidencePlanId!==planId)return;
   host.innerHTML='<div class="evidence-empty">Preview unavailable. '+esc(error&&error.message?error.message:String(error))+'</div>';
   if(status){status.classList.add('error');status.textContent='Could not preview '+file.name;}
  }
  return;
 }
 host.innerHTML='<div class="evidence-download-panel"><p><b>'+safeName+'</b><br>Word documents are listed here but cannot be previewed natively in this window. Use the button to download the original file.</p><a class="control primary" href="'+esc(url)+'" download="'+safeName+'">Download document</a></div>';
 if(status){status.classList.remove('error');status.textContent='Document selected: '+file.name;}
}
function setEvidenceUploadStatus(message,error){
 const status=document.getElementById('planEvidenceUploadStatus');
 if(!status)return;
 status.textContent=message||'';
 status.classList.toggle('error',!!error);
}
async function uploadSelectedEvidenceFiles(fileList){
 const files=Array.from(fileList||[]);
 const planId=activeEvidencePlanId;
 if(!files.length||!planId||evidenceUploadBusy)return;
 evidenceUploadBusy=true;
 const button=document.getElementById('planEvidenceUploadButton');
 if(button)button.disabled=true;
 let uploaded=0;
 const failures=[];
 try{
  for(let index=0;index<files.length;index++){
   const file=files[index];
   const extension=(String(file.name).match(/\.[^.]+$/)||[''])[0].toLowerCase();
   if(!EVIDENCE_UPLOAD_EXTENSIONS.has(extension)){failures.push(file.name+': unsupported file type');continue;}
   if(!file.size){failures.push(file.name+': empty files are not accepted');continue;}
   if(file.size>MAX_EVIDENCE_UPLOAD_BYTES){failures.push(file.name+': exceeds the 100 MB per-file limit');continue;}
   setEvidenceUploadStatus('Uploading '+(index+1)+' of '+files.length+': '+file.name,false);
   try{
    const query='module=TargetPlan&record_id='+encodeURIComponent(planId)+'&filename='+encodeURIComponent(file.name);
    const response=await fetch(rc.HOST+'/evidence/upload?'+query,{
     method:'POST',
     headers:{'Content-Type':'application/octet-stream'},
     body:file,
     cache:'no-store'
    });
    const payload=await response.json();
    if(!response.ok||payload.status!=='READY'){
     const detail=payload.errors&&payload.errors[0]&&payload.errors[0].message;
     throw new Error(detail||'Upload failed (HTTP '+response.status+')');
    }
    uploaded+=1;
   }catch(error){failures.push(file.name+': '+(error&&error.message?error.message:String(error)));}
  }
 }finally{
  evidenceUploadBusy=false;
  if(button)button.disabled=false;
  const input=document.getElementById('planEvidenceUploadInput');
  if(input)input.value='';
 }
 if(activeEvidencePlanId===planId)await refreshPlanEvidenceList();
 if(failures.length){
  const details=failures.slice(0,4).join(' · ')+(failures.length>4?' · +'+(failures.length-4)+' more':'');
  setEvidenceUploadStatus('Uploaded '+uploaded+' of '+files.length+' file(s). '+details,true);
 }else{
  setEvidenceUploadStatus('Upload complete: '+uploaded+' file(s) saved to this Target Plan.',false);
 }
}
async function refreshPlanEvidenceList(){
 const planId=activeEvidencePlanId;
 if(!planId)return;
 invalidateEvidencePreview();
 const list=document.getElementById('planEvidenceList');
 const preview=document.getElementById('planEvidencePreview');
 const status=document.getElementById('planEvidenceStatus');
 const meta=document.getElementById('planEvidenceMeta');
 if(list)list.innerHTML='<div class="evidence-empty">Loading evidence files…</div>';
 if(preview)preview.innerHTML='<div class="evidence-empty">Select a PDF or image from the list.</div>';
 if(status){status.classList.remove('error');status.textContent='Reading the central Evidence folder…';}
 if(meta)meta.textContent='Database/Evidence/TargetPlan/'+planId+' · Evidence viewer · Upload destination managed by Desktop Host';
 try{
  const url=rc.HOST+'/evidence/list?module=TargetPlan&record_id='+encodeURIComponent(planId);
  const response=await fetch(url,{cache:'no-store'});
  const payload=await response.json();
  if(!response.ok||payload.status!=='READY'){
   const error=payload.errors&&payload.errors[0]&&payload.errors[0].message;
   throw new Error(error||'Evidence list could not be loaded');
  }
  if(activeEvidencePlanId!==planId)return;
  activeEvidenceFiles=Array.isArray(payload.files)?payload.files:[];
  renderEvidenceFiles(activeEvidenceFiles);
  if(status){
   status.classList.remove('error');
   status.textContent=activeEvidenceFiles.length
    ?activeEvidenceFiles.length+' evidence file(s) found. Select a file to preview it.'
    :'No evidence files found for this Target Plan.';
  }
  if(meta)meta.textContent=payload.folder+' · Evidence viewer · Upload destination managed by Desktop Host';
 }catch(error){
  if(activeEvidencePlanId!==planId)return;
  activeEvidenceFiles=[];
  if(list)list.innerHTML='<div class="evidence-empty">Evidence folder could not be read. Confirm the Desktop Host has been restarted after updating the project.</div>';
  if(status){status.classList.add('error');status.textContent='Evidence unavailable: '+(error&&error.message?error.message:String(error));}
  if(meta)meta.textContent='Local Evidence service unavailable';
 }
}
function openPlanEvidence(planId){
 const row=state.rows.find(function(item){return String(item.plan_id)===String(planId);});
 if(!row)return;
 invalidateEvidencePreview();
 setEvidenceUploadStatus('',false);
 activeEvidencePlanId=String(row.plan_id||'');
 activeEvidenceFiles=[];
 const range=planDateBounds(row);
 const record=document.getElementById('planEvidenceRecord');
 if(record)record.textContent=activeEvidencePlanId+' · '+range.start+' to '+range.end+' · '+workFrontLabel(row.work_front_id);
 const title=document.getElementById('planEvidenceTitle');
 if(title)title.textContent='Target Plan Evidence';
 const preview=document.getElementById('planEvidencePreview');
 if(preview)preview.innerHTML='<div class="evidence-empty">Select a PDF or image from the list.</div>';
 if(global.LithositeModalShowContract){
  global.LithositeModalShowContract.show('planEvidenceModal');
 }else{
  const modal=document.getElementById('planEvidenceModal');
  if(modal){modal.hidden=false;modal.classList.add('show');modal.setAttribute('aria-hidden','false');}
 }
 refreshPlanEvidenceList();
}
function closePlanEvidence(){
 if(evidenceUploadBusy){setEvidenceUploadStatus('Please wait for the current upload to finish before closing this viewer.',true);return;}
 invalidateEvidencePreview();
 setEvidenceUploadStatus('',false);
 if(global.LithositeModalShowContract)global.LithositeModalShowContract.close('planEvidenceModal');
 const modal=document.getElementById('planEvidenceModal');
 if(modal){modal.classList.remove('show','open');modal.setAttribute('aria-hidden','true');}
 const preview=document.getElementById('planEvidencePreview');
 if(preview)preview.innerHTML='<div class="evidence-empty">Select a PDF or image from the list.</div>';
 activeEvidencePlanId='';
 activeEvidenceFiles=[];
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
  if(!editId&&result.evidence_folder_status==='FAILED'){
   setMsg('Plan created and audited, but its Evidence folder could not be created: '+(result.evidence_folder_message||'check Desktop Host access.'),true);
  }else{
   setMsg(editId?'Plan updated and audited.':'Plan created and Evidence folder prepared.');
  }
 }catch(e){setMsg('Validation/runtime error: '+e.message,true);}
}
async function remove(id){
 const message='Delete Plan '+id+'?\n\nThis permanently deletes all files in Database/Evidence/TargetPlan/'+id+'/ as well as the Target Plan record. The RuntimeAdapter audit log for the deletion is retained.\n\nThis action cannot be undone.';
 if(!confirm(message))return;
 try{
  const result=await rc.request({operation:'DELETE',entity:'Plans',entity_id:id});
  if(result.status!=='COMMITTED')throw new Error((result.errors||[]).map(x=>x.message).join('; ')||'Delete rejected');
  await refreshData();
  if(result.evidence_cleanup_status==='FAILED'){
   setMsg('Plan deleted and audited, but its Evidence folder could not be removed: '+(result.evidence_cleanup_message||'manual cleanup is required.'),true);
  }else{
   setMsg('Plan and its Evidence folder deleted. RuntimeAdapter audit entry retained.');
  }
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
 document.getElementById('planEvidenceClose').addEventListener('click',closePlanEvidence);
 document.getElementById('planEvidenceRefresh').addEventListener('click',refreshPlanEvidenceList);
 document.getElementById('planEvidenceUploadButton').addEventListener('click',()=>document.getElementById('planEvidenceUploadInput').click());
 document.getElementById('planEvidenceUploadInput').addEventListener('change',event=>uploadSelectedEvidenceFiles(event.target.files));
 document.getElementById('planEvidenceModal').addEventListener('click',e=>{if(e.target.id==='planEvidenceModal')closePlanEvidence();});
 document.getElementById('planEvidenceList').addEventListener('click',e=>{const fileButton=e.target.closest('.evidence-file-button');if(fileButton&&!fileButton.disabled)previewEvidenceFile(fileButton.dataset.evidenceName||'');});
 document.getElementById('plansRows').addEventListener('click',e=>{
  const evidence=e.target.closest('.view-evidence');if(evidence){openPlanEvidence(evidence.dataset.id);return;}
  const edit=e.target.closest('.edit-plan');if(edit){openEdit(edit.dataset.id);return;}
  const del=e.target.closest('.delete-plan');if(del)remove(del.dataset.id);
 });
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
