(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before runtime-status.js');

async function refresh(){
  const schema=document.getElementById('runtimeSchema');
  const mode=document.getElementById('runtimeMode');
  const readyText=document.getElementById('runtimeReadyText');
  const readyDot=document.getElementById('runtimeReadyDot');
  const statusDot=document.getElementById('runtimeStatusDot');

  try{
    const h=await rc.health();
    const ready=h && h.status==='READY';
    if(schema) schema.textContent=h && h.schema ? h.schema : 'Unknown';
    const offline=!!(h && h.offline);
    if(mode) mode.textContent=offline ? 'OFFLINE' : 'ONLINE';
    if(statusDot) statusDot.classList.toggle('offline-pulse',offline);
    if(readyText) readyText.textContent=ready ? 'Database + Runtime Ready' : 'Runtime Not Ready';
    if(readyDot) readyDot.classList.toggle('ok', !!ready);
  }catch(e){
    if(schema) schema.textContent='Unavailable';
    if(mode) mode.textContent='OFFLINE';
    if(statusDot) statusDot.classList.add('offline-pulse');
    if(readyText) readyText.textContent='Runtime Unavailable';
    if(readyDot) readyDot.classList.remove('ok');
  }
}

function pulseReadyDot(event){
  const detail=event && event.detail;
  const readyDot=document.getElementById('runtimeReadyDot');
  if(!detail || !detail.operation || !readyDot || !readyDot.classList.contains('ok')) return;
  readyDot.classList.remove('recorded-pulse');
  void readyDot.offsetWidth;
  readyDot.classList.add('recorded-pulse');
}

global.addEventListener('lithosite:runtime-mutated',pulseReadyDot);
document.addEventListener('DOMContentLoaded',refresh);
global.LithositeRuntimeStatus=Object.freeze({refresh});
})(window);
