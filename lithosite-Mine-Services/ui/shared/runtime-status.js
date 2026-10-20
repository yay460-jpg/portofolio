(function(global){
'use strict';
const rc=global.LithositeRuntimeClient;
if(!rc) throw new Error('LithositeRuntimeClient is required before runtime-status.js');

async function refresh(){
  const schema=document.getElementById('runtimeSchema');
  const mode=document.getElementById('runtimeMode');
  const readyText=document.getElementById('runtimeReadyText');
  const readyDot=document.getElementById('runtimeReadyDot');

  try{
    const h=await rc.health();
    const ready=h && h.status==='READY';
    if(schema) schema.textContent=h && h.schema ? h.schema : 'Unknown';
    if(mode) mode.textContent=h && h.offline ? 'OFFLINE' : 'ONLINE';
    if(readyText) readyText.textContent=ready ? 'Database + Runtime Ready' : 'Runtime Not Ready';
    if(readyDot) readyDot.classList.toggle('ok', !!ready);
  }catch(e){
    if(schema) schema.textContent='Unavailable';
    if(mode) mode.textContent='OFFLINE';
    if(readyText) readyText.textContent='Runtime Unavailable';
    if(readyDot) readyDot.classList.remove('ok');
  }
}

document.addEventListener('DOMContentLoaded', refresh);
global.LithositeRuntimeStatus=Object.freeze({refresh});
})(window);
