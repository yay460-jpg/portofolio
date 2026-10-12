/* Issued Report History. */
(function(global){
'use strict';
const KEY='lithosite.mine-services.report-history';
const LEGACY_KEY_PATTERN=/^lithosite\.mine-services\.v\d+\.report-history$/;
function legacyKeys(storage){
  if(!storage||typeof storage.key!=='function')return [];
  const found=[];
  const length=Number(storage.length)||0;
  for(let index=0;index<length;index++){
    const key=storage.key(index);
    if(typeof key==='string'&&LEGACY_KEY_PATTERN.test(key))found.push(key);
  }
  const versionNumber=key=>Number(key.match(/\.v(\d+)\.report-history$/)?.[1]||0);
  return found.sort((a,b)=>versionNumber(b)-versionNumber(a));
}
function read(){
  try{
    const storage=global.localStorage;
    const current=storage?.getItem(KEY);
    if(current){
      try{
        const value=JSON.parse(current);
        if(Array.isArray(value))return value;
      }catch(_){}
    }
    for(const legacyKey of legacyKeys(storage)){
      const raw=storage?.getItem(legacyKey);
      if(!raw)continue;
      let value;
      try{value=JSON.parse(raw);}catch(_){continue;}
      if(Array.isArray(value)){
        try{storage?.setItem(KEY,JSON.stringify(value));}catch(e){}
        return value;
      }
    }
    return [];
  }catch(e){return [];}
}
function write(items){try{global.localStorage?.setItem(KEY,JSON.stringify(items));return true;}catch(e){return false;}}
function save(snapshot){
  if(!snapshot||!snapshot.snapshot?.immutable)throw new Error('Only immutable issued snapshots can enter report history.');
  const items=read().filter(x=>x.snapshot_id!==snapshot.snapshot_id);
  items.push(JSON.parse(JSON.stringify(snapshot)));
  items.sort((a,b)=>String(b.snapshot?.issued_at||'').localeCompare(String(a.snapshot?.issued_at||'')));
  write(items.slice(0,100));
  return items[0]||snapshot;
}
function list(type){
  const items=read();
  return type?items.filter(x=>String(x.report_type||'')===String(type).toUpperCase()):items;
}
function get(id){return read().find(x=>String(x.snapshot_id)===String(id))||null;}
global.LithositeReportHistory=Object.freeze({KEY,LEGACY_KEY_PATTERN,save,list,get});
})(window);
