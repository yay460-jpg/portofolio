const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const ROOT=path.resolve(__dirname,'..');
const MODULE=path.join(ROOT,'ui','modules','reports','report-history.js');
const source=fs.readFileSync(MODULE,'utf8');
const KEY='lithosite.mine-services.report-history';

function load(storage){
  const context={localStorage:storage};
  context.window=context;
  vm.createContext(context);
  vm.runInContext(source,context,{filename:MODULE});
  return context.LithositeReportHistory;
}
function makeStorage(seed,options){
  const values=Object.assign(Object.create(null),seed||{});
  const settings=options||{};
  return {
    get length(){if(settings.throwLength)throw new Error('length unavailable');return Object.keys(values).length;},
    key(index){if(settings.throwKeyAt===index)throw new Error('key unavailable');return Object.keys(values)[index]||null;},
    getItem(key){if(settings.throwGetItem===key)throw new Error('read unavailable');return Object.prototype.hasOwnProperty.call(values,key)?values[key]:null;},
    setItem(key,value){if(settings.throwSetItem)throw new Error('write unavailable');values[key]=String(value);},
    removeItem(key){delete values[key];},
    values
  };
}

{
  const newerKey='lithosite.mine-services.v12.report-history';
  const olderKey='lithosite.mine-services.v3.report-history';
  const newer=[{snapshot_id:'newer',report_type:'DAILY',snapshot:{immutable:true,issued_at:'2026-10-12T12:00:00Z'}}];
  const older=[{snapshot_id:'older',report_type:'WEEKLY',snapshot:{immutable:true,issued_at:'2026-10-11T12:00:00Z'}}];
  const storage=makeStorage({[newerKey]:JSON.stringify(newer),[olderKey]:JSON.stringify(older)});
  const history=load(storage);
  assert.strictEqual(history.get('newer').snapshot_id,'newer');
  assert.deepStrictEqual(JSON.parse(storage.getItem(KEY)),newer);
  assert.strictEqual(storage.getItem(newerKey),JSON.stringify(newer));
  assert.strictEqual(storage.getItem(olderKey),JSON.stringify(older));
}

{
  const validKey='lithosite.mine-services.v4.report-history';
  const records=[{snapshot_id:'recoverable',report_type:'MONTHLY',snapshot:{immutable:true,issued_at:'2026-10-01T00:00:00Z'}}];
  const storage=makeStorage({[KEY]:'{broken',[validKey]:JSON.stringify(records)},{throwKeyAt:0});
  const history=load(storage);
  assert.strictEqual(history.get('recoverable').snapshot_id,'recoverable');
  assert.deepStrictEqual(JSON.parse(storage.getItem(KEY)),records);
  assert.strictEqual(storage.getItem(validKey),JSON.stringify(records));
}

{
  const storage=makeStorage({}, {throwLength:true});
  assert.strictEqual(load(storage).list().length,0);
}
{
  const storage=makeStorage();
  const history=load(storage);
  assert.throws(()=>history.save({snapshot:{immutable:false},snapshot_id:'draft'}),/Only immutable issued snapshots/);
  const issued={snapshot_id:'issued-1',report_type:'DAILY',snapshot:{immutable:true,issued_at:'2026-10-13T00:00:00Z'}};
  history.save(issued);
  assert.strictEqual(history.get('issued-1').snapshot_id,'issued-1');
}
console.log('REPORT_HISTORY_MIGRATION_PASS');
