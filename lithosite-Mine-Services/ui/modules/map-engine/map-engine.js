/* Lithosite Mine Services — Topo3D host. Shared engine is the single rendering implementation. */
(function(global){
  'use strict';
  function init(){
    var host=document.getElementById('dashboardSiteMap');
    if(!host||!global.LithositeTopo3D)return;
    var canvas=host.querySelector('#dashboardTopo3DCanvas');
    if(!canvas)return;
    var status=host.querySelector('#dashboardTopo3DStatus');
    var meta=host.querySelector('#dashboardTopo3DMeta');
    var engine=null;
    function setStatus(message,kind){
      if(!status)return;
      status.textContent=message;
      status.classList.remove('ready','error');
      if(kind)status.classList.add(kind);
    }
    function updateMeta(){
      if(!meta||!engine)return;
      var state=engine.getState();
      if(!state.ready){meta.textContent='Topography belum dimuat';return;}
      var m=state.meta||{},b=m.bounds||{};
      meta.textContent='V '+Number(m.vertices||0).toLocaleString('id-ID')+
        ' · T '+Number(m.triangles||0).toLocaleString('id-ID')+
        ' · Z '+Number(b.minZ||0).toFixed(1)+'–'+Number(b.maxZ||0).toFixed(1);
    }
    try{
      engine=global.LithositeTopo3D.create({
        canvas:canvas,
        onStatus:function(message){setStatus(message);},
        onReady:function(){setStatus('Topo3D siap. Menunggu data topografi…');},
        onError:function(error){setStatus(error&&error.message?error.message:'Topo3D error','error');}
      });
      engine.prepare().then(function(){
        setStatus('Topo3D siap · pilih .ltdtm atau pasangan .dtm + .str');
        updateMeta();
      }).catch(function(error){
        setStatus(error&&error.message?error.message:'WebGL tidak tersedia','error');
      });
      var input=host.querySelector('#dashboardTopo3DFile');
      if(input)input.addEventListener('change',async function(){
        if(!input.files||!input.files.length)return;
        try{
          setStatus('Memuat data topografi…');
          await engine.loadFiles(input.files);
          engine.fit();
          updateMeta();
          setStatus('Topography 3D siap','ready');
        }catch(error){
          setStatus(error&&error.message?error.message:'Gagal memuat topografi','error');
        }finally{input.value='';}
      });
      var bind=function(id,fn){var el=host.querySelector(id);if(el)el.addEventListener('click',fn);};
      bind('#dashboardTopo3DFit',function(){engine.fit();});
      bind('#dashboardTopo3DTop',function(){engine.setView('top');});
      bind('#dashboardTopo3DView',function(){engine.setView('3d');});
      bind('#dashboardTopo3DShaded',function(){engine.setMode('shaded');});
      bind('#dashboardTopo3DElevation',function(){engine.setMode('elevation');});
      bind('#dashboardTopo3DWire',function(){engine.setMode('wire');});
      var guide=host.querySelector('#dashboardTopo3DGuideToggle');
      var guidePanel=host.querySelector('#dashboardTopo3DGuide');
      if(guide&&guidePanel)guide.addEventListener('click',function(){
        var open=guidePanel.classList.toggle('open');
        guide.setAttribute('aria-expanded',open?'true':'false');
      });
    }catch(error){setStatus(error&&error.message?error.message:'Topo3D initialization failed','error');}
    global.MineServicesTopo3D={getEngine:function(){return engine;}};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
