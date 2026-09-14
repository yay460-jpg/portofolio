const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const contract = {
  errors: {
    INVALID_ID:'INVALID_ID', INVALID_MAP_ID:'INVALID_MAP_ID', INVALID_NAME:'INVALID_NAME', INVALID_INPUT:'INVALID_INPUT'
  }
};
const calls = [];
const library = {
  async createLayer(mapId,input){ calls.push(['create',mapId,input]); return {mapId,input}; },
  async updateLayer(id,patch){ calls.push(['update',id,patch]); return {id,patch}; },
  async setVisibility(id,v){ calls.push(['visibility',id,v]); return {id,v}; },
  async setActiveLayer(mapId,id){ calls.push(['active',mapId,id]); return id; },
  async getActiveLayer(mapId){ calls.push(['getActive',mapId]); return null; },
  async deleteLayer(id){ calls.push(['remove',id]); return true; },
  async cloneLayersForMap(sourceMapId,targetMapId){ calls.push(['cloneForMap',sourceMapId,targetMapId]); return {sourceMapId,targetMapId}; }
};
const capability = {
  async list(options){ calls.push(['list',options]); return []; },
  async summary(mapId){ calls.push(['summary',mapId]); return {}; }
};
const context = {window:{MG1MapLayerContract:contract,MG1MapLayerLibrary:library,MG1MapLayerCapability:capability}, console:{log(){}}};
vm.runInNewContext(fs.readFileSync('scripts/map/map-layer-management.js','utf8'), context);
const M = context.window.MG1MapLayerManagement;
assert(M);
(async()=>{
  await M.list('map1',{query:'geo'});
  await M.create('map1',{name:'A'});
  await M.rename('layer1','Renamed');
  await M.setVisibility('layer1',false);
  await M.activate('map1',null);
  await M.getActive('map1');
  await M.remove('layer1');
  await M.cloneForMap('map1','map2');
  assert.deepStrictEqual(calls.map(x=>x[0]),['list','create','update','visibility','active','getActive','remove','cloneForMap']);
  assert.strictEqual(calls[0][1].mapId,'map1');
  assert.strictEqual(calls[2][2].name,'Renamed');
  console.log('PASS map-layer-management.test.js');
})().catch(err=>{console.error(err);process.exit(1)});
