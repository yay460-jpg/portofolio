const fs = require('fs');
const vm = require('vm');

const context = { console: { log() {} }, Promise, String, Number, Object, Array, Error };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('scripts/map/map-layer-contract.js', 'utf8'), context);
context.MG1MapLayerLibrary = {
  async getLayers(mapId) {
    if (mapId !== 'm1') throw new Error('unexpected mapId');
    return [
      { id:'b', mapId:'m1', name:'Survey 10', type:'survey', order:10, visible:true },
      { id:'a', mapId:'m1', name:'Geology', type:'geology', order:2, visible:true },
      { id:'c', mapId:'m1', name:'Survey 2', type:'survey', order:2, visible:false }
    ];
  },
  async getActiveLayer(mapId) { return mapId === 'm1' ? 'a' : null; }
};
vm.runInContext(fs.readFileSync('scripts/map/map-layer-capability.js', 'utf8'), context);
const K = context.MG1MapLayerCapability;

(async () => {
  let rows = await K.list({ mapId:'m1' });
  if (rows.map(x=>x.id).join(',') !== 'a,c,b') throw new Error('default order sort failed');

  rows = await K.list({ mapId:'m1', query:'survey', visible:true });
  if (rows.length !== 1 || rows[0].id !== 'b') throw new Error('query/visibility filter failed');

  rows = await K.list({ mapId:'m1', active:true });
  if (rows.length !== 1 || rows[0].id !== 'a') throw new Error('active filter failed');

  rows = await K.list({ mapId:'m1', sortBy:'name', direction:'desc' });
  if (rows.map(x=>x.id).join(',') !== 'b,c,a') throw new Error('deterministic name sort failed');

  const summary = await K.summary('m1');
  if (summary.total !== 3 || summary.visibleCount !== 2 || summary.hiddenCount !== 1 || summary.activeId !== 'a') {
    throw new Error('summary failed');
  }

  let failed = false;
  try { await K.list({ mapId:'m1', visible:'true' }); }
  catch (e) { failed = e.code === context.MG1MapLayerContract.errors.INVALID_VISIBLE; }
  if (!failed) throw new Error('invalid visibility must fail');

  console.log('PASS map-layer-capability.test.js');
})().catch(e => { console.error(e); process.exit(1); });
