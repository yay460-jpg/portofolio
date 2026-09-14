const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/../../scripts/map/map-ui.js','utf8');
const ctx={window:null,activeBackgroundMapId:'map-1',render:()=>{},icon:()=>'<i/>',renderHeader:()=>'',renderBottomNav:()=>'',renderSectionTitle:()=>'',renderSimpleModal:(t,s,b,c)=>b};
ctx.window=ctx;
ctx.MG1MapLayerManagement={list:async()=>[]};
vm.createContext(ctx); vm.runInContext(src,ctx);

assert.strictEqual(ctx.mg1SmartLayerType_('Drillhole'),'drilling');
assert.strictEqual(ctx.mg1SmartLayerType_('Hauling Road'),'road');
assert.strictEqual(ctx.mg1SmartLayerType_('Ore Zone'),'geology');
assert.strictEqual(ctx.mg1SmartLayerType_('Crusher'),'infrastructure');
(async()=>{ await ctx.openLayerManagementPanel_();
ctx.updateSemanticLayerDraft_('Drillhole');
let html=ctx.renderSemanticLayerPanel_();
assert(html.includes('value="drilling" selected'),'name inference should select Pemboran');
ctx.updateSemanticLayerDraft_('Hauling Road');
html=ctx.renderSemanticLayerPanel_();
assert(html.includes('value="road" selected'),'name inference should select Jalan / Jalur');
ctx.updateSemanticLayerDraftType_('custom');
ctx.updateSemanticLayerDraft_('Ore Zone');
html=ctx.renderSemanticLayerPanel_();
assert(html.includes('value="custom" selected'),'manual type selection must remain authoritative');
const groups=ctx.mg1GroupLayers_([
 {id:'1',name:'Pit',type:'mining'},
 {id:'2',name:'DH',type:'drilling'},
 {id:'3',name:'Fault',type:'structure'},
 {id:'4',name:'Road',type:'road'},
 {id:'5',name:'Other',type:'custom'}
]);
assert.strictEqual(JSON.stringify(groups.map(g=>g.key)),JSON.stringify(['drilling','structure','mining','road','custom']));
assert.strictEqual(groups.find(g=>g.key==='drilling').layers[0].id,'2');
console.log('PASS v25-smart-grouping-ui.test.js');
})().catch(e=>{console.error(e);process.exit(1)});
