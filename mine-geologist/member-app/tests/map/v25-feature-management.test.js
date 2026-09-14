const assert=require('assert'),fs=require('fs'),vm=require('vm');
const calls=[];
const C={errors:{INVALID_LAYER_ID:'INVALID_LAYER_ID',INVALID_ID:'INVALID_ID'}};
const L={
 async createFeature(layerId,input){calls.push(['create',layerId,input]);return 1},
 async updateFeature(id,p){calls.push(['update',id,p]);return 2},
 async deleteFeature(id){calls.push(['remove',id]);return 3},
 async deleteFeaturesForLayer(id){calls.push(['removeForLayer',id]);return 4}
};
const Q={async list(id,o){calls.push(['list',id,o]);return []},async summary(id){calls.push(['summary',id]);return {}}};
const ctx={window:{MG1MapFeatureContract:C,MG1MapFeatureLibrary:L,MG1MapFeatureCapability:Q},console:{log(){}}};
vm.runInNewContext(fs.readFileSync('scripts/map/map-feature-management.js','utf8'),ctx);
const M=ctx.window.MG1MapFeatureManagement;
(async()=>{
 await M.list('l1',{type:'point'}); await M.summary('l1'); await M.create('l1',{type:'point'}); await M.update('f1',{properties:{a:1}}); await M.remove('f1'); await M.removeForLayer('l1');
 assert.deepStrictEqual(calls.map(x=>x[0]),['list','summary','create','update','remove','removeForLayer']);
 assert.strictEqual(calls[0][1],'l1'); assert.strictEqual(calls[2][1],'l1');
 console.log('PASS v25-feature-management.test.js');
})().catch(e=>{console.error(e);process.exit(1)});
