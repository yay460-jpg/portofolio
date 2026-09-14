const assert=require('assert'),fs=require('fs'),vm=require('vm');
const calls=[];
const C={errors:{INVALID_LAYER_ID:'INVALID_LAYER_ID',INVALID_INPUT:'INVALID_INPUT'}};
const L={async getFeatures(id){calls.push(id);return [
 {id:'f2',layerId:id,type:'point',geometry:{type:'Point'},properties:{name:'Beta'},schemaVersion:1},
 {id:'f1',layerId:id,type:'polygon',geometry:{type:'Polygon'},properties:{name:'Alpha'},schemaVersion:1},
 {id:'f3',layerId:id,type:'point',geometry:null,properties:{name:'Gamma'},schemaVersion:1}
]}};
const ctx={window:{MG1MapFeatureContract:C,MG1MapFeatureLibrary:L},console:{log(){}}};
vm.runInNewContext(fs.readFileSync('scripts/map/map-feature-capability.js','utf8'),ctx);
const Q=ctx.window.MG1MapFeatureCapability;
(async()=>{
 assert.deepStrictEqual((await Q.list('l1')).map(x=>x.id),['f1','f2','f3']);
 assert.deepStrictEqual((await Q.list('l1',{type:'POINT',geometryType:'point'})).map(x=>x.id),['f2']);
 assert.deepStrictEqual((await Q.list('l1',{query:'alpha'})).map(x=>x.id),['f1']);
 assert.deepStrictEqual((await Q.list('l1',{sortBy:'type',direction:'desc'})).map(x=>x.id),['f1','f3','f2']);
 const s=await Q.summary('l1'); assert.strictEqual(s.total,3); assert.strictEqual(s.types.point,2); assert.strictEqual(s.geometries.none,1);
 assert.deepStrictEqual(calls,['l1','l1','l1','l1','l1']);
 console.log('PASS v25-feature-capability.test.js');
})().catch(e=>{console.error(e);process.exit(1)});
