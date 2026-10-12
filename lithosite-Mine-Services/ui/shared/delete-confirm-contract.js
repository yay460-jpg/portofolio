(function(global){
'use strict';
let pending=null;
function ensure(){
 let root=document.getElementById('globalDeleteConfirmModal');
 if(root)return root;
 root=document.createElement('div');root.id='globalDeleteConfirmModal';root.className='modalback';root.setAttribute('aria-hidden','true');
 root.innerHTML='<div class="modal modal-shell-valid global-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="globalDeleteTitle"><div class="modalhead"><strong id="globalDeleteTitle" class="ptitle">Delete Record</strong><button type="button" id="globalDeleteClose" class="control secondary mini">Close</button></div><div class="modalbody"><p id="globalDeleteMessage"></p><div class="global-delete-id"><span id="globalDeleteLabel">Record ID</span><strong id="globalDeleteId"></strong></div><div id="globalDeleteEvidence" class="global-delete-evidence" hidden></div><div class="global-delete-warning"><strong>This action cannot be undone.</strong><p id="globalDeleteWarning"></p></div></div><div class="modalfoot"><span>Permanent action · Runtime validation applies</span><button type="button" id="globalDeleteCancel" class="control secondary mini">Cancel</button><button type="button" id="globalDeleteAction" class="control danger mini global-delete-action">Delete Record</button></div></div>';
 document.body.appendChild(root);
 root.querySelector('#globalDeleteClose').onclick=()=>settle(false);
 root.querySelector('#globalDeleteCancel').onclick=()=>settle(false);
 root.querySelector('#globalDeleteAction').onclick=()=>settle(true);
 root.addEventListener('click',e=>{if(e.target===root)settle(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pending){e.preventDefault();settle(false);}});
 return root;
}
function settle(value){
 if(!pending)return;
 const current=pending;pending=null;
 const root=document.getElementById('globalDeleteConfirmModal');
 if(global.LithositeModalShowContract)global.LithositeModalShowContract.close('globalDeleteConfirmModal');
 else if(root){root.classList.remove('show','open');root.setAttribute('aria-hidden','true');}
 if(current.focus&&document.contains(current.focus))current.focus.focus();
 current.resolve(value===true);
}
function confirmDelete(options){
 const o=options||{};
 if(pending)settle(false);
 const root=ensure(),name=String(o.entity||'Record'),id=String(o.id||'');
 root.querySelector('#globalDeleteTitle').textContent='Delete '+name;
 root.querySelector('#globalDeleteMessage').textContent=String(o.message||'This will permanently delete the selected record.');
 root.querySelector('#globalDeleteLabel').textContent=name+' ID';
 root.querySelector('#globalDeleteId').textContent=id;
 root.querySelector('#globalDeleteWarning').textContent=String(o.warning||'The runtime will validate references and retain the audit record.');
 const evidence=root.querySelector('#globalDeleteEvidence');
 evidence.hidden=!o.evidenceFolder;
 evidence.textContent=o.evidenceFolder?'Evidence folder: '+String(o.evidenceFolder):'';
 root.querySelector('#globalDeleteAction').textContent=o.evidenceFolder?'Delete Plan & Evidence':'Delete '+name;
 return new Promise(resolve=>{
  pending={resolve,focus:document.activeElement};
  const opened=global.LithositeModalShowContract?global.LithositeModalShowContract.show('globalDeleteConfirmModal'):(root.classList.add('show'),root.setAttribute('aria-hidden','false'),true);
  if(!opened){settle(false);return;}
  root.querySelector('#globalDeleteCancel').focus();
 });
}
global.LithositeDeleteConfirmContract=Object.freeze({confirm:confirmDelete,cancel:()=>settle(false)});
})(window);
