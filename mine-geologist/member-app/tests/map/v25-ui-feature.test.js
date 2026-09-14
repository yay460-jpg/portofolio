const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/../../scripts/map/map-ui.js','utf8');
const calls=[];
const ctx={window:null,activeBackgroundMapId:'map-1',render:()=>calls.push(['render']),icon:()=>'<i/>',renderHeader:()=>'',renderBottomNav:()=>'',renderSectionTitle:()=>'',renderSimpleModal:(t,s,b,c)=>b};
ctx.window=ctx;
ctx.MG1MapLayerManagement={list:async()=>[{id:'l1',name:'Ore',visible:true,active:true}],create:async()=>({id:'l2'}),setVisibility:async()=>{},activate:async()=>{},remove:async()=>{}};
ctx.MG1MapFeatureManagement={
 list:async(...a)=>{calls.push(['feature-list',...a]);return [{id:'f1',layerId:'l1',type:'point',geometry:{type:'Point',coordinates:[1,2]},properties:{name:'TP-01'}}]},
 create:async(...a)=>{calls.push(['feature-create',...a]);return {id:'f2',layerId:a[0]}},
 update:async(...a)=>{calls.push(['feature-update',...a]);return {id:a[0]}},
 remove:async(...a)=>{calls.push(['feature-remove',...a]);}
};
vm.createContext(ctx); vm.runInContext(src,ctx);
(async()=>{
  await ctx.openLayerManagementPanel_();
  await ctx.toggleSemanticFeaturePanel_('l1');
  ctx.updateSemanticFeatureDraft_('l1','type','point');
  ctx.updateSemanticFeatureDraft_('l1','properties','{"name":"TP-02"}');
  ctx.updateSemanticFeatureDraft_('l1','geometry','{"type":"Point","coordinates":[3,4]}');
  await ctx.createSemanticFeature_('l1');
  await ctx.updateSemanticFeature_('f1','l1','{"name":"TP-01-updated"}','{"type":"Point","coordinates":[5,6]}');
  await ctx.removeSemanticFeature_('f1','l1');
  const html=ctx.renderSemanticLayerPanel_();
  assert(calls.some(x=>x[0]==='feature-list'&&x[1]==='l1'));
  assert(calls.some(x=>x[0]==='feature-create'&&x[1]==='l1'&&x[2].type==='point'));
  assert(calls.some(x=>x[0]==='feature-update'&&x[1]==='f1'));
  assert(calls.some(x=>x[0]==='feature-remove'&&x[1]==='f1'));
  assert(html.includes('Kelompok data'));
  assert(!html.includes('Semantic data'));
  assert(html.includes('Tambah Data'));
  assert(html.includes('Bentuk objek'));
  assert(html.includes('Titik'));
  const beforeReload= calls.filter(x=>x[0]==='feature-list').length;
  ctx.activeBackgroundMapId='map-2';
  await ctx.refreshLayerManagementPanel_();
  await ctx.toggleSemanticFeaturePanel_('l1');
  const afterReload= calls.filter(x=>x[0]==='feature-list').length;
  assert(afterReload===beforeReload+1);
  console.log('PASS v25-ui-feature.test.js');
})().catch(e=>{console.error(e);process.exit(1)});
