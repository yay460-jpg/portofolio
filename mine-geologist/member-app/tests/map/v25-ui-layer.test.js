const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/../../scripts/map/map-ui.js','utf8');
const calls=[];
const ctx={window:null,activeBackgroundMapId:'map-1',render:()=>calls.push(['render']),icon:()=>'<i/>',renderHeader:()=>'',renderBottomNav:()=>'',renderSectionTitle:()=>'',renderSimpleModal:(t,s,b,c)=>b};
ctx.window=ctx; ctx.MG1MapLayerManagement={
 list: async(...a)=>{calls.push(['list',...a]); return [{id:'l1',name:'Ore',visible:true,active:true}]},
 create: async(...a)=>{calls.push(['create',...a]); return {id:'l2'}},
 setVisibility: async(...a)=>calls.push(['visibility',...a]),
 activate: async(...a)=>calls.push(['activate',...a]),
 remove: async(...a)=>calls.push(['remove',...a])
};
vm.createContext(ctx); vm.runInContext(src,ctx);
(async()=>{
 await ctx.openLayerManagementPanel_();
 await ctx.createSemanticLayer_();
 ctx.updateSemanticLayerDraft_('Test');
 await ctx.createSemanticLayer_();
 await ctx.activateSemanticLayer_('l1');
 await ctx.toggleSemanticLayerVisibility_('l1',false);
 await ctx.removeSemanticLayer_('l1');
 assert(calls.some(x=>x[0]==='list'&&x[1]==='map-1'));
 assert(calls.some(x=>x[0]==='create'&&x[1]==='map-1'&&x[2].name==='Test'));
 assert(calls.some(x=>x[0]==='activate'&&x[1]==='map-1'&&x[2]==='l1'));
 assert(calls.some(x=>x[0]==='visibility'&&x[1]==='l1'&&x[2]===false));
 assert(calls.some(x=>x[0]==='remove'&&x[1]==='l1'));
 console.log('PASS v25-ui-layer.test.js');
})().catch(e=>{console.error(e);process.exit(1)});
