/* V38 Stage 36 — Issued Report History. */
(function(global){
'use strict';
const KEY='lithosite.mine-services.v38.report-history';
function read(){
  try{const raw=global.localStorage?.getItem(KEY);const value=raw?JSON.parse(raw):[];return Array.isArray(value)?value:[];}catch(e){return [];}
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
global.LithositeReportHistory=Object.freeze({KEY,save,list,get});
})(window);
