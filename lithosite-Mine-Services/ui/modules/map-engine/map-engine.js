/* Lithosite Mine Services — Topo3D host. Shared engine is the single rendering implementation. */
(function(global){
  'use strict';
  function init(){
    var host=document.getElementById('dashboardSiteMap');
    var panel=host&&host.closest('.panel');
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
    var ACTIVE_TOPO_DB='lithosite-mine-services';
    var ACTIVE_TOPO_STORE='active-topography';
    function openActiveTopoStore(){
      return new Promise(function(resolve,reject){
        if(!global.indexedDB){reject(new Error('Browser storage unavailable'));return;}
        var request=global.indexedDB.open(ACTIVE_TOPO_DB,1);
        request.onupgradeneeded=function(){var db=request.result;if(!db.objectStoreNames.contains(ACTIVE_TOPO_STORE))db.createObjectStore(ACTIVE_TOPO_STORE);};
        request.onsuccess=function(){resolve(request.result);};
        request.onerror=function(){reject(request.error||new Error('Active topography storage unavailable'));};
      });
    }
    async function saveActiveTopography(buffer,filename){
      try{
        var db=await openActiveTopoStore();
        await new Promise(function(resolve,reject){
          var tx=db.transaction(ACTIVE_TOPO_STORE,'readwrite');
          tx.objectStore(ACTIVE_TOPO_STORE).put({buffer:buffer,filename:filename||'Lithosite_Topography.ltdtm',savedAt:new Date().toISOString()},'current');
          tx.oncomplete=resolve; tx.onerror=function(){reject(tx.error||new Error('Active topography cache failed'));};
        });
        db.close();
      }catch(error){}
    }
    async function restoreActiveTopography(){
      try{
        var db=await openActiveTopoStore();
        var saved=await new Promise(function(resolve,reject){
          var tx=db.transaction(ACTIVE_TOPO_STORE,'readonly'),request=tx.objectStore(ACTIVE_TOPO_STORE).get('current');
          request.onsuccess=function(){resolve(request.result||null);};
          request.onerror=function(){reject(request.error||new Error('Active topography cache unavailable'));};
        });
        db.close();
        if(!saved||!saved.buffer)return false;
        setStatus('Memulihkan topography terakhir…');
        var file=new File([saved.buffer],saved.filename||'Lithosite_Topography.ltdtm',{type:'application/octet-stream'});
        await engine.loadLTDtm(file);
        engine.fit();
        updateCoordinateInfo(engine.getState().meta);
        setStatus('Topography 3D dipulihkan otomatis · '+(saved.filename||'LT-DTM'),'ready');
        startAutoRotate();
        return true;
      }catch(error){
        setStatus('Topography cache tidak dapat dipulihkan otomatis','error');
        return false;
      }
    }
    function bytesToBase64(buffer){
      var bytes=new Uint8Array(buffer), binary='';
      var chunk=0x8000;
      for(var i=0;i<bytes.length;i+=chunk){
        binary+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+chunk,bytes.length)));
      }
      return btoa(binary);
    }
    function base64ToBytes(value){
      var binary=atob(value||''), bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      return bytes;
    }
    function ensureTopoBackupPanel(){
      var existing=host.querySelector('#dashboardTopo3DBackupPanel');
      if(existing)return existing;
      var panel=document.createElement('div');
      panel.id='dashboardTopo3DBackupPanel';
      panel.style.cssText='position:absolute;top:42px;left:8px;z-index:30;width:320px;padding:12px;border:1px solid rgba(96,165,250,.35);border-radius:10px;background:#0b1b2d;box-shadow:0 16px 36px rgba(0,0,0,.42);display:none;color:#dbeafe;font:12px Segoe UI,Arial,sans-serif;';
      panel.innerHTML='<div style="font-weight:700;margin-bottom:8px">Topography Backups</div><div id="dashboardTopo3DBackupStorage" style="margin-bottom:8px;padding:8px 9px;border:1px solid rgba(96,165,250,.2);border-radius:7px;background:rgba(7,21,37,.72)"></div><div id="dashboardTopo3DBackupList"></div><div id="dashboardTopo3DBackupPolicy" style="margin-top:8px;color:#8fa7bf;line-height:1.45">Maximum 5 backups. When a new backup is saved while storage is full, the oldest backup is automatically deleted.</div><div style="display:flex;justify-content:flex-end;gap:6px;margin-top:10px"><button type="button" id="dashboardTopo3DBackupClose">Close</button><button type="button" id="dashboardTopo3DBackupRestore" class="primary">Restore Selected</button></div>';
      host.appendChild(panel);
      panel.querySelector('#dashboardTopo3DBackupClose').addEventListener('click',function(){panel.style.display='none';});
      panel.querySelector('#dashboardTopo3DBackupRestore').addEventListener('click',async function(){
        var select=panel.querySelector('#dashboardTopo3DBackupSelect');
        if(!select||!select.value)return;
        try{
          setStatus('Reading topography backup…');
          var result=await global.LithositeRuntimeClient.request({operation:'LOAD_TOPOGRAPHY_BACKUP',filename:select.value});
          if(result.status!=='READY'||!result.data)throw new Error('Topography backup unavailable');
          var bytes=base64ToBytes(result.data);
          var file=new File([bytes],result.filename||select.value,{type:'application/octet-stream'});
          await engine.loadLTDtm(file);
          engine.fit();
          updateCoordinateInfo(engine.getState().meta);
          saveActiveTopography(await bytes.buffer.slice(0),result.filename||select.value);
          setStatus('Topography restored · '+(result.filename||select.value),'ready');
          startAutoRotate();
          panel.style.display='none';
        }catch(error){
          setStatus(error&&error.message?error.message:'Topography restore failed','error');
        }
      });
      return panel;
    }
    async function openTopoBackupPanel(){
      var panel=ensureTopoBackupPanel(), list=panel.querySelector('#dashboardTopo3DBackupList');
      var storage=panel.querySelector('#dashboardTopo3DBackupStorage');
      list.textContent='Loading backups…';
      storage.textContent='Checking LT-DTM storage…';
      panel.style.display='block';
      try{
        var result=await global.LithositeRuntimeClient.request({operation:'LIST_TOPOGRAPHY_BACKUPS'});
        var backups=Array.isArray(result.backups)?result.backups:[];
        var max=Math.max(1,Number(result.max_backups)||5);
        var used=Math.min(backups.length,Number(result.storage_used)||backups.length);
        storage.innerHTML='<div style="font-weight:700;color:#dbeafe">LT-DTM Backup Storage</div><div style="margin-top:3px;font-size:15px;font-weight:700">'+used+' / '+max+' backups used'+(used>=max?' · FULL':'')+'</div><div style="margin-top:3px;color:#8fa7bf">'+(used<max?used+' backup'+(used===1?'':'s')+' stored.':'Storage full — saving a new backup will automatically remove the oldest backup.')+'</div>';
        if(!backups.length){
          list.textContent='No topography backups yet.';
          panel.querySelector('#dashboardTopo3DBackupRestore').disabled=true;
          return;
        }
        panel.querySelector('#dashboardTopo3DBackupRestore').disabled=false;
        list.innerHTML='<label style="display:block;margin-bottom:4px;color:#93c5fd">Select backup</label><select id="dashboardTopo3DBackupSelect" style="width:100%;padding:8px;border-radius:7px;background:#071525;color:#dbeafe;border:1px solid #29415f">'+backups.map(function(item){
          var label=item.filename+' · '+(Number(item.size_bytes||0)/1048576).toFixed(2)+' MB';
          return '<option value="'+String(item.filename).replace(/"/g,'&quot;')+'">'+label+'</option>';
        }).join('')+'</select>';
      }catch(error){
        list.textContent=error&&error.message?error.message:'Backup list unavailable';
        storage.textContent='LT-DTM Backup Storage · unavailable';
        panel.querySelector('#dashboardTopo3DBackupRestore').disabled=true;
      }
    }
    async function backupTopography(){
      try{
        if(!engine||!engine.getState().meta)throw new Error('Load a topography before creating a backup.');
        setStatus('Creating LT-DTM backup…');
        var exported=await engine.exportLTDtm({filename:'Lithosite_Topography'});
        var buffer=await exported.blob.arrayBuffer();
        var result=await global.LithositeRuntimeClient.request({
          operation:'SAVE_TOPOGRAPHY_BACKUP',
          package_base64:bytesToBase64(buffer),
          filename:exported.filename,
          source:'Mine-Services-Map'
        });
        if(result.status!=='SAVED')throw new Error('Topography backup rejected');
        var removed=Array.isArray(result.removed)?result.removed:[];
        if(removed.length){
          setStatus('LT-DTM backup saved · oldest backup removed: '+removed.join(', '),'ready');
        }else{
          setStatus('LT-DTM backup saved · storage '+String(result.storage_used||'')+' / '+String(result.storage_max||5),'ready');
        }
      }catch(error){
        setStatus(error&&error.message?error.message:'Topography backup failed','error');
      }
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
      engine.prepare().then(async function(){
        if(!(await restoreActiveTopography()))setStatus('Topo3D siap · pilih .ltdtm ou pasangan .dtm + .str');
      }).catch(function(error){
        setStatus(error&&error.message?error.message:'WebGL tidak tersedia','error');
      });
      var input=(panel||host).querySelector('#dashboardTopo3DFile');
      if(input)input.addEventListener('change',async function(){
        if(!input.files||!input.files.length)return;
        try{
          setStatus('Memuat data topografi…');
          await engine.loadFiles(input.files);
          engine.fit();
          updateCoordinateInfo(engine.getState().meta);
          try{
            var activeExport=await engine.exportLTDtm({filename:'Lithosite_Active_Topography'});
            saveActiveTopography(await activeExport.blob.arrayBuffer(),activeExport.filename);
          }catch(error){}
          setStatus('Topography 3D siap · Auto 360° aktif','ready');
          startAutoRotate();
        }catch(error){
          setStatus(error&&error.message?error.message:'Gagal memuat topografi','error');
        }finally{input.value='';}
      });
      var bind=function(id,fn){var el=(panel||host).querySelector(id);if(el)el.addEventListener('click',fn);};
      bind('#dashboardTopo3DFit',function(){engine.fit();syncTopViewClass();updateNorthArrow();});
      bind('#dashboardTopo3DTop',function(){engine.setView('top');syncTopViewClass();updateNorthArrow();});
      bind('#dashboardTopo3DView',function(){engine.setView('3d');syncTopViewClass();updateNorthArrow();});
      bind('#dashboardTopo3DShaded',function(){engine.setMode('shaded');});
      bind('#dashboardTopo3DElevation',function(){engine.setMode('elevation');});
      bind('#dashboardTopo3DMeasurePickA',function(){setPickMode('A');});
      bind('#dashboardTopo3DMeasurePickB',function(){setPickMode('B');});
      bind('#dashboardTopo3DMeasureRun',updateMeasurement);
      canvas.addEventListener('click',function(event){if(activePickPoint==='__MARKER__'){var rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top,point=engine.pickCoordinate(x,y,22);if(point){activePickPoint=null;document.dispatchEvent(new CustomEvent('mine-services:marker-coordinate-picked',{detail:point}));setStatus('Marker coordinate picked · E '+point.easting.toFixed(3)+' · N '+point.northing.toFixed(3)+' · Z '+point.elevation.toFixed(3),'ready');}return;}handlePointPick(event);});
      bind('#dashboardTopo3DMeasureClear',clearMeasurement);
      bind('#dashboardTopo3DWire',function(){engine.setMode('wire');});
      bind('#dashboardTopo3DBackup',backupTopography);
      bind('#dashboardTopo3DRestore',openTopoBackupPanel);
      var rotate360=(panel||host).querySelector('#dashboardTopo3DRotate360');
      if(rotate360)rotate360.addEventListener('click',function(){
        if(autoRotate){stopAutoRotate();rotate360.classList.remove('is-active');rotate360.textContent='360°';}
        else{startAutoRotate();rotate360.classList.add('is-active');rotate360.textContent='360° Auto';}
      });
      document.addEventListener('mine-services:marker-pick-request',function(){if(!engine||!engine.getState().ready)return;engine.setView('top');syncTopViewClass();updateNorthArrow();activePickPoint='__MARKER__';setStatus('Marker Location · Top View aktif · klik terrain untuk memilih koordinat');});
      document.addEventListener('mine-services:focus-marker',function(event){
        var marker=event&&event.detail&&event.detail.marker;
        if(!marker||!engine||!engine.getState().ready)return;
        requestAnimationFrame(function(){
          if(engine.focusCoordinate)engine.focusCoordinate(marker.easting,marker.northing,marker.elevation);
        });
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
