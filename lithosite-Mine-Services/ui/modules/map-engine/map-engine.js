/* Lithosite Mine Services — Topo3D host. Shared engine is the single rendering implementation. */
(function(global){
  'use strict';
  function init(){
    var host=document.getElementById('dashboardSiteMap');
    if(!host||!global.LithositeTopo3D)return;
    var canvas=host.querySelector('#dashboardTopo3DCanvas');
    if(!canvas)return;
    var status=host.querySelector('#dashboardTopo3DStatus');
    var engine=null;
    var geo=null;
    var autoRotate=false;
    var autoRotateRaf=null;
    var northConvergence=0;
    var activePickPoint=null;
    var pickedPoints={A:null,B:null};
    function startAutoRotate(){
      if(autoRotate)return;
      autoRotate=true;
      function tick(){
        if(!autoRotate)return;
        if(engine&&engine.getState().ready){
          engine.angleY+=0.0035;
          if(engine.angleY>Math.PI*2)engine.angleY-=Math.PI*2;
          updateNorthArrow();
        }
        autoRotateRaf=requestAnimationFrame(tick);
      }
      autoRotateRaf=requestAnimationFrame(tick);
    }
    function stopAutoRotate(){
      autoRotate=false;
      if(autoRotateRaf)cancelAnimationFrame(autoRotateRaf);
      autoRotateRaf=null;
    }
    function initGeoAdapter(){
      if(!global.LithositeMineServicesGeo)return;
      var config=global.LithositeMineServicesGeoConfig;
      if(!config&&host.dataset.utmZone&&host.dataset.utmHemisphere){
        config={zone:host.dataset.utmZone,hemisphere:host.dataset.utmHemisphere};
      }
      if(!config)return;
      try{geo=global.LithositeMineServicesGeo.create(config);}
      catch(error){setStatus(error&&error.message?error.message:'Geo Engine initialization failed','error');}
    }
    function updateCoordinateInfo(meta){
      var el=host.querySelector('#dashboardTopo3DCoordinate');
      var northLabel=host.querySelector('#dashboardTopo3DNorthLabel');
      var northArrow=host.querySelector('.topo3d-north-arrow');
      if(!meta||!meta.bounds)return;
      var b=meta.bounds;
      var e=(b.minX+b.maxX)/2;
      var n=(b.minY+b.maxY)/2;
      var z=(b.minZ+b.maxZ)/2;
      var text='Center · E '+e.toFixed(2)+' m · N '+n.toFixed(2)+' m · Z '+z.toFixed(2)+' m';
      var convergence=0;
      if(geo){
        try{
          var ll=geo.inverseUtm(e,n);
          text+=' · Lat '+ll.lat.toFixed(6)+' · Lon '+ll.lon.toFixed(6);
          var conv=geo.convergence(e,n);
          if(conv&&conv.ok)convergence=Number(conv.convergenceDeg)||0;
        }catch(error){}
      }
      northConvergence=convergence;
      if(el)el.textContent=text;
      if(northLabel)northLabel.textContent='Grid North · '+convergence.toFixed(2)+'° convergence';
      if(northArrow)northArrow.style.transform='rotate('+(-convergence)+'deg)';
    }
    function updateNorthArrow(){
      var northArrow=host.querySelector('.topo3d-north-arrow');
      if(!northArrow||!engine)return;
      var angle=(Number(engine.angleY)||0)*180/Math.PI;
      northArrow.style.transform='rotate('+(angle-northConvergence)+'deg)';
    }
    function setPickedPoint(label,point){
      var suffix=label==='A'?'1':'2';
      var eEl=host.querySelector('#dashboardTopo3DMeasureE'+suffix);
      var nEl=host.querySelector('#dashboardTopo3DMeasureN'+suffix);
      if(eEl)eEl.value=point.easting.toFixed(2);
      if(nEl)nEl.value=point.northing.toFixed(2);
      var coordEl=host.querySelector('#dashboardTopo3DPoint'+label+'Coord');
      if(coordEl)coordEl.textContent='E '+point.easting.toFixed(2)+' · N '+point.northing.toFixed(2);
      var marker=host.querySelector('#dashboardTopo3DPoint'+label);
      if(marker){
        marker.style.left=point.screenX+'px';
        marker.style.top=point.screenY+'px';
        marker.classList.add('visible');
      }
    }
    function syncPickedMarkers(){
      if(!engine)return;
      ['A','B'].forEach(function(label){
        var point=pickedPoints[label];
        var marker=host.querySelector('#dashboardTopo3DPoint'+label);
        if(!point||!marker)return;
        var p=engine.projectCoordinate(point.easting,point.northing,point.elevation);
        if(!p||!p.inside){marker.classList.remove('visible');return;}
        marker.style.left=p.x+'px';
        marker.style.top=p.y+'px';
        marker.classList.add('visible');
      });
      var line=host.querySelector('#dashboardTopo3DMeasureLine');
      if(line){
        var a=pickedPoints.A&&engine.projectCoordinate(pickedPoints.A.easting,pickedPoints.A.northing,pickedPoints.A.elevation);
        var b=pickedPoints.B&&engine.projectCoordinate(pickedPoints.B.easting,pickedPoints.B.northing,pickedPoints.B.elevation);
        if(a&&b&&a.inside&&b.inside){line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);line.classList.add('visible');}
        else line.classList.remove('visible');
      }
    }
    function setPickMode(label){
      activePickPoint=label;
      ['A','B'].forEach(function(key){
        var btn=host.querySelector('#dashboardTopo3DMeasurePick'+key);
        if(btn)btn.classList.toggle('is-active',key===label);
      });
      var result=host.querySelector('#dashboardTopo3DMeasureResult');
      if(result)result.textContent='Click terrain to set Point '+label;
    }
    function handlePointPick(event){
      if(!activePickPoint||!engine||!engine.getState().ready)return;
      var rect=canvas.getBoundingClientRect();
      var x=event.clientX-rect.left,y=event.clientY-rect.top;
      var point=engine.pickCoordinate(x,y,22);
      if(!point)return;
      pickedPoints[activePickPoint]=point;
      setPickedPoint(activePickPoint,point);
      var next=activePickPoint==='A'?'B':null;
      if(next)setPickMode(next);else{
        activePickPoint=null;
        ['A','B'].forEach(function(key){
          var btn=host.querySelector('#dashboardTopo3DMeasurePick'+key);
          if(btn)btn.classList.remove('is-active');
        });
        updateMeasurement();
      }
    }
    function updateMeasurement(){
      var result=host.querySelector('#dashboardTopo3DMeasureResult');
      if(!result)return;
      var bearingDistance=geo?geo.bearingDistance:(typeof global.bearingDistanceGrid_==='function'?function(e1,n1,e2,n2){return global.bearingDistanceGrid_(e1,n1,e2,n2);}:null);
      if(!bearingDistance){
        result.textContent='Geo measurement engine unavailable';
        return;
      }
      var fields=['E1','N1','E2','N2'].map(function(key){
        var el=host.querySelector('#dashboardTopo3DMeasure'+key);
        return el?Number(el.value):NaN;
      });
      if(fields.some(function(v){return !Number.isFinite(v);})){
        result.textContent='Enter E1, N1, E2 and N2';
        return;
      }
      try{
        var m=bearingDistance(fields[0],fields[1],fields[2],fields[3]);
        result.innerHTML='<div class="measure-result-main">Bearing <b>'+m.bearingGridDeg.toFixed(2)+'°</b> · Distance <b>'+m.distanceMeters.toFixed(2)+' m</b></div><div class="measure-result-sub">A → B · Grid Bearing · Horizontal distance</div>';
      }catch(error){
        result.textContent=error&&error.message?error.message:'Measurement failed';
      }
    }
    function clearMeasurement(){
      ['E1','N1','E2','N2'].forEach(function(key){
        var el=host.querySelector('#dashboardTopo3DMeasure'+key);
        if(el)el.value='';
      });
      pickedPoints={A:null,B:null};
      activePickPoint=null;
      ['A','B'].forEach(function(key){
        var marker=host.querySelector('#dashboardTopo3DPoint'+key);
        if(marker)marker.classList.remove('visible');
        var btn=host.querySelector('#dashboardTopo3DMeasurePick'+key);
        if(btn)btn.classList.remove('is-active');
      });
      var result=host.querySelector('#dashboardTopo3DMeasureResult');
      if(result)result.textContent='Bearing — · Distance —';
    }
    function syncTopViewClass(){
      host.classList.toggle('is-top-view',!!engine&&engine.getState().view==='top');
    }
    function setStatus(message,kind){
      if(status){
        status.textContent=message;
        status.classList.remove('ready','error');
        if(kind)status.classList.add(kind);
      }
      var guideStatus=host.querySelector('#dashboardTopo3DGuideStatus');
      if(guideStatus)guideStatus.textContent=message;
    }
    try{
      initGeoAdapter();
      engine=global.LithositeTopo3D.create({
        canvas:canvas,
        onStatus:function(message){setStatus(message);},
        onRender:function(){syncPickedMarkers();if(global.MineServicesMarkerLocation)global.MineServicesMarkerLocation.renderMarkers(engine,host);},
        onReady:function(payload){setStatus('Topo3D siap. Menunggu data topografi…');if(payload&&payload.meta)updateCoordinateInfo(payload.meta);},
        onError:function(error){setStatus(error&&error.message?error.message:'Topo3D error','error');}
      });
      engine.prepare().then(function(){
        setStatus('Topo3D siap · pilih .ltdtm atau pasangan .dtm + .str');
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
          updateCoordinateInfo(engine.getState().meta);
          setStatus('Topography 3D siap · Auto 360° aktif','ready');
          startAutoRotate();
        }catch(error){
          setStatus(error&&error.message?error.message:'Gagal memuat topografi','error');
        }finally{input.value='';}
      });
      var bind=function(id,fn){var el=host.querySelector(id);if(el)el.addEventListener('click',fn);};
      bind('#dashboardTopo3DFit',function(){engine.fit();syncTopViewClass();updateNorthArrow();});
      bind('#dashboardTopo3DTop',function(){engine.setView('top');syncTopViewClass();updateNorthArrow();});
      bind('#dashboardTopo3DView',function(){engine.setView('3d');syncTopViewClass();updateNorthArrow();});
      bind('#dashboardTopo3DShaded',function(){engine.setMode('shaded');});
      bind('#dashboardTopo3DElevation',function(){engine.setMode('elevation');});
      bind('#dashboardTopo3DMeasurePickA',function(){setPickMode('A');});
      bind('#dashboardTopo3DMeasurePickB',function(){setPickMode('B');});
      bind('#dashboardTopo3DMeasureRun',updateMeasurement);
      canvas.addEventListener('click',handlePointPick);
      bind('#dashboardTopo3DMeasureClear',clearMeasurement);
      bind('#dashboardTopo3DWire',function(){engine.setMode('wire');});
      var rotate360=host.querySelector('#dashboardTopo3DRotate360');
      if(rotate360)rotate360.addEventListener('click',function(){
        if(autoRotate){stopAutoRotate();rotate360.classList.remove('is-active');rotate360.textContent='360°';}
        else{startAutoRotate();rotate360.classList.add('is-active');rotate360.textContent='360° Auto';}
      });
      var northSync=setInterval(updateNorthArrow,100);
      var guide=host.querySelector('#dashboardTopo3DGuideToggle');
      var guidePanel=host.querySelector('#dashboardTopo3DGuide');
      var measureToggle=host.querySelector('#dashboardTopo3DMeasureToggle');
      var measurePanel=host.querySelector('#dashboardTopo3DMeasure');
      if(guide&&guidePanel)guide.addEventListener('click',function(){
        var open=guidePanel.classList.toggle('open');
        guide.setAttribute('aria-expanded',open?'true':'false');
        if(open&&measurePanel&&measureToggle){
          measurePanel.classList.remove('open');
          measureToggle.setAttribute('aria-expanded','false');
        }
      });
      if(measureToggle&&measurePanel)measureToggle.addEventListener('click',function(){
        var open=measurePanel.classList.toggle('open');
        measureToggle.setAttribute('aria-expanded',open?'true':'false');
        if(open&&guide&&guidePanel){
          guidePanel.classList.remove('open');
          guide.setAttribute('aria-expanded','false');
        }
      });
    }catch(error){setStatus(error&&error.message?error.message:'Topo3D initialization failed','error');}
    global.MineServicesTopo3D={getEngine:function(){return engine;},getGeo:function(){return geo;}};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
