const fs = require('fs');
const vm = require('vm');

const context = { console, Promise, Date, Math, Object, Array, String, Number, Error, setTimeout, clearTimeout };
context.window = context;
const calls = [];
context.MG1MapLayerContract = undefined;
vm.createContext(context);
vm.runInContext(fs.readFileSync('scripts/map/map-layer-contract.js','utf8'), context);
context.MG1MapLayerStore = {
  async getLayer(id){ calls.push(['getLayer',id]); return {id,mapId:'m1',name:'L1'}; },
  async getLayers(mapId){ calls.push(['getLayers',mapId]); return []; },
  async createLayer(layer){ calls.push(['createLayer',layer]); return layer; },
  async updateLayer(id,p){ calls.push(['updateLayer',id,p]); return {id}; },
  async setVisibility(id,v){ calls.push(['setVisibility',id,v]); return {id,visible:v}; },
  async getActiveLayer(mapId){ calls.push(['getActiveLayer',mapId]); return null; },
  async setActiveLayer(mapId,id){ calls.push(['setActiveLayer',mapId,id]); return id; },
  async deleteLayer(id){ calls.push(['deleteLayer',id]); return true; },
  async cloneLayersForMap(sourceMapId,targetMapId){ calls.push(['cloneLayersForMap',sourceMapId,targetMapId]); return {sourceMapId,targetMapId}; }
};
vm.runInContext(fs.readFileSync('scripts/map/map-layer-library.js','utf8'), context);
const L = context.MG1MapLayerLibrary;
(async()=>{
  const created = await L.createLayer('m1',{name:'Geology'});
  if(created.mapId!=='m1' || created.type!=='generic' || created.visible!==true) throw new Error('create defaults failed');
  await L.setActiveLayer('m1',null);
  await L.setVisibility('layer_x',false);
  await L.cloneLayersForMap('m1','m2');
  if(calls[0][0]!=='createLayer' || calls[1][0]!=='setActiveLayer' || calls[2][0]!=='setVisibility' || calls[3][0]!=='cloneLayersForMap') throw new Error('facade delegation failed');
  let failed=false; try{ await L.getLayers(''); }catch(e){ failed=e.code===context.MG1MapLayerContract.errors.INVALID_MAP_ID; }
  if(!failed) throw new Error('invalid mapId not rejected');
  console.log('PASS map-layer-library.test.js');
})().catch(e=>{ console.error(e); process.exit(1); });
