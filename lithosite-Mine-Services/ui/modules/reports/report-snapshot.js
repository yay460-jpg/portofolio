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
  const draftId=String(copy.report_id||'');
  const issuedId=draftId.startsWith('DRAFT-')?draftId.slice(6):draftId;
  copy.report_id=issuedId||'REPORT';
  const history=global.LithositeReportHistory?.list?.(copy.report_type)||[];
  const previous=history.filter(item=>{
    const id=String(item.report_id||'');
    return id===copy.report_id||id===draftId||id==='DRAFT-'+copy.report_id;
  });
  const revisions=previous.map(item=>{
    const revision=Number(item.snapshot?.revision);
    if(Number.isFinite(revision)&&revision>0)return revision;
    const match=String(item.snapshot_id||'').match(/@r(\\d+)$/);
    return match?Number(match[1]):0;
  });
  const baseRevision=Math.max(0,Number(copy.snapshot?.revision)||0,...revisions);
  const revision=previous.length?baseRevision+1:Math.max(1,baseRevision);
  copy.status='ISSUED';
  copy.snapshot={...(copy.snapshot||{}),immutable:true,issued_at:issuedAt||new Date().toISOString(),revision};
  copy.snapshot_id=copy.report_id+'@r'+revision;
  copy.fingerprint=await digest(copy);
  return deepFreeze(copy);
}
function verify(snapshot){return !!snapshot&&snapshot.snapshot?.immutable===true&&!!snapshot.snapshot_id&&!!snapshot.fingerprint;}
global.LithositeReportSnapshot=Object.freeze({create,verify,canonical});
})(window);
