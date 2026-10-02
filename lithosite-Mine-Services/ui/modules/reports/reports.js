(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before reports.js');
const entities=['Operations','Equipment','WorkFront','Maintenance','Issues','Plans','HSE'];
const state={data:{},status:'loading'};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function msg(t,e){const x=document.getElementById('reportsRuntimeMsg');if(x){x.textContent=t;x.classList.toggle('error',!!e);}}
function rows(name){return Array.isArray(state.data[name])?state.data[name]:[];}
function render(){
 const total=entities.reduce((n,e)=>n+rows(e).length,0);
 const k={operations:rows('Operations').length,equipment:rows('Equipment').length,workfront:rows('WorkFront').length,maintenance:rows('Maintenance').length,issues:rows('Issues').length,plans:rows('Plans').length,hse:rows('HSE').length};
 ['operations','equipment','workfront','maintenance','issues','plans','hse'].forEach(x=>{const el=document.getElementById('reportKpi'+x[0].toUpperCase()+x.slice(1));if(el)el.textContent=k[x];});
 const host=document.getElementById('reportsSummary');
 if(host)host.innerHTML='<div class="report-row report-head"><span>Domain</span><span>Records</span><span>Share</span></div>'+entities.map(e=>{const n=rows(e).length;const share=total?Math.round(n/total*100):0;return '<div class="report-row"><span>'+esc(e)+'</span><b>'+n+'</b><span class="report-bar"><i style="width:'+share+'%"></i></span></div>';}).join('');
 const meta=document.getElementById('reportsCount');if(meta)meta.textContent=total+' records · Runtime Ready';
}
async function load(){state.status='loading';try{const h=await rc.health();if(h.status!=='READY')throw new Error('Runtime health is not READY');const r=await Promise.all(entities.map(entity=>rc.request({operation:'READ',entity})));entities.forEach((e,i)=>state.data[e]=Array.isArray(r[i].data)?r[i].data:[]);state.status='ready';render();msg('RuntimeAdapter connected — schema ' + (h.schema || 'Unknown') + ' — offline read-only reporting active.');}catch(e){state.status='error';render();const m=document.getElementById('reportsCount');if(m)m.textContent='Unavailable · Runtime Error';msg('Reports unavailable: '+e.message,true);}}
function filteredCount(){const text=(document.getElementById('reportsSearch')?.value||'').trim().toLowerCase();if(!text)return;let n=0;entities.forEach(e=>rows(e).forEach(r=>{if(JSON.stringify(r).toLowerCase().includes(text))n++;}));const m=document.getElementById('reportsCount');if(m)m.textContent=n+' matching records · Runtime Ready';}
function bind(){document.getElementById('reportsRefresh').onclick=load;document.getElementById('reportsClear').onclick=()=>{document.getElementById('reportsSearch').value='';render();};document.getElementById('reportsSearch').addEventListener('input',filteredCount);}
if(global.LithositeDataSync)global.LithositeDataSync.register('Reports',load);
bind();load();
global.LithositeReports=Object.freeze({refresh:load});
})(window);
