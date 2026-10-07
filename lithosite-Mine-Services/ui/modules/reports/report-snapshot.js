/* V38 Stage 33 — Immutable Report Snapshot. */
(function(global){
'use strict';
function deepFreeze(v){
  if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);Object.keys(v).forEach(k=>deepFreeze(v[k]));}
  return v;
}
function canonical(v){
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
async function digest(value){
  const text=canonical(value), data=new TextEncoder().encode(text);
  if(global.crypto?.subtle){
    const hash=await global.crypto.subtle.digest('SHA-256',data);
    return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  return 'UNAVAILABLE';
}
async function create(model,issuedAt){
  if(!model||model.status==='VALIDATION REQUIRED')throw new Error('Cannot snapshot a report requiring validation.');
  const copy=JSON.parse(JSON.stringify(model));
  copy.status='ISSUED';
  copy.snapshot={...(copy.snapshot||{}),immutable:true,issued_at:issuedAt||new Date().toISOString(),revision:Number(copy.snapshot?.revision||1)};
  copy.snapshot_id=copy.report_id+'@r'+copy.snapshot.revision;
  copy.fingerprint=await digest(copy);
  return deepFreeze(copy);
}
function verify(snapshot){return !!snapshot&&snapshot.snapshot?.immutable===true&&!!snapshot.snapshot_id&&!!snapshot.fingerprint;}
global.LithositeReportSnapshot=Object.freeze({create,verify,canonical});
})(window);
