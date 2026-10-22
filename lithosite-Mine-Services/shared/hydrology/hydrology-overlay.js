/*
 * Lithosite Hydrology Flow Overlay
 * Draws bounded D8 direction paths and an optional, non-physical particle-direction
 * cue over the Site Map terrain. It receives a narrow projection/render facade.
 */
(function(global){
  'use strict';

  var MAX_SEGMENTS=850;
  var MAX_PARTICLES=30;
  var PARTICLE_PERIOD_MS=2400;

  function fail(message){throw new Error(message);}
  function finite(value){return typeof value==='number'&&Number.isFinite(value);}

  function create(options){
    options=options||{};
    var host=options.host,topo=options.topo;
    if(!host||typeof host.appendChild!=='function')fail('Hydrology overlay requires the Site Map host.');
    if(!topo||typeof topo.projectCoordinate!=='function'||typeof topo.subscribeRender!=='function')fail('Topo3D projection/render interface is unavailable.');

    var canvas=document.createElement('canvas');
    canvas.id='dashboardHydrologyFlowOverlay';
    canvas.className='hydrology-flow-overlay';
    canvas.setAttribute('aria-hidden','true');
    canvas.setAttribute('role','presentation');
    host.appendChild(canvas);

    var particleCanvas=document.createElement('canvas');
    particleCanvas.id='dashboardHydrologyFlowParticles';
    particleCanvas.className='hydrology-flow-particles';
    particleCanvas.setAttribute('aria-hidden','true');
    particleCanvas.setAttribute('role','presentation');
    particleCanvas.hidden=true;
    host.appendChild(particleCanvas);

    var rainCanvas=document.createElement('canvas');
    rainCanvas.id='dashboardHydrologyRainDrops';
    rainCanvas.className='hydrology-rain-drops';
    rainCanvas.setAttribute('aria-hidden','true');
    rainCanvas.setAttribute('role','presentation');
    rainCanvas.hidden=true;
    host.appendChild(rainCanvas);

    var ctx=canvas.getContext('2d');
    var particleCtx=particleCanvas.getContext('2d');
    var rainCtx=rainCanvas.getContext('2d');
    if(!ctx||!particleCtx||!rainCtx){
      if(canvas.parentNode)canvas.parentNode.removeChild(canvas);
      if(particleCanvas.parentNode)particleCanvas.parentNode.removeChild(particleCanvas);
      if(rainCanvas.parentNode)rainCanvas.parentNode.removeChild(rainCanvas);
      fail('2D flow overlay canvas is unavailable.');
    }

    var analysis=null,segments=[],particleTracks=[],unsubscribe=null;
    var visible=true,animationEnabled=false,rainfallEnabled=false,destroyed=false,lastSignature='',topView=false;
    var rainDrops=[],rainImpacts=[];
    var rainMode='both',windSpeedKmh=15,windDirection='NW';
    var animationFrameId=null,animationStart=null;
    var cssWidth=0,cssHeight=0,dpr=1,segmentThreshold=0,drawnSegmentCount=0;

    function ensureCanvasSize(){
      var rect=host.getBoundingClientRect?host.getBoundingClientRect():null;
      var width=Math.max(1,Number(host.clientWidth)||(rect&&rect.width)||1);
      var height=Math.max(1,Number(host.clientHeight)||(rect&&rect.height)||1);
      var ratio=Math.min(2,Math.max(1,Number(global.devicePixelRatio)||1));
      var changed=width!==cssWidth||height!==cssHeight||ratio!==dpr;
      if(changed){
        cssWidth=width;cssHeight=height;dpr=ratio;
        [canvas,particleCanvas,rainCanvas].forEach(function(layer){
          layer.width=Math.round(cssWidth*dpr);
          layer.height=Math.round(cssHeight*dpr);
          layer.style.width='100%';layer.style.height='100%';
        });
        ctx.setTransform(dpr,0,0,dpr,0,0);
        particleCtx.setTransform(dpr,0,0,dpr,0,0);
        rainCtx.setTransform(dpr,0,0,dpr,0,0);
        rainDrops=[];rainImpacts=[];
        for(var dropIndex=0;dropIndex<48;dropIndex++)rainDrops.push(makeRainDrop(true));
        for(var impactIndex=0;impactIndex<18;impactIndex++)rainImpacts.push(makeRainImpact(true));
      }
      return {width:cssWidth,height:cssHeight,changed:changed};
    }

    function windVector(){
      var angles={N:90,NE:135,E:180,SE:225,S:270,SW:315,W:0,NW:45};
      var angle=(angles[windDirection]===undefined?225:angles[windDirection])*Math.PI/180;
      var strength=windSpeedKmh/35;
      return {x:Math.cos(angle)*strength,y:Math.sin(angle)*strength};
    }
    function makeRainDrop(randomY){
      var wind=windVector(),base=windSpeedKmh/35;
      return {x:Math.random()*Math.max(1,cssWidth),y:randomY?Math.random()*Math.max(1,cssHeight):-12,
        length:rainMode==='terrain'?5+Math.random()*7:7+Math.random()*9,
        speed:3.5+Math.random()*3.5+base*2.5,
        drift:wind.x*(.8+base*2.8),slant:wind.x*(.7+base*2.2),alpha:.18+Math.random()*.24};
    }
    function makeRainImpact(randomPosition){
      return {x:Math.random()*Math.max(1,cssWidth),y:randomPosition?cssHeight*(.38+Math.random()*.6):cssHeight*(.42+Math.random()*.55),
        radius:1+Math.random()*3,phase:Math.random()*Math.PI*2,alpha:.12+Math.random()*.16};
    }
    function drawRain(){
      var size=ensureCanvasSize();rainCtx.clearRect(0,0,size.width,size.height);
      if(!visible||!rainfallEnabled||topView)return;
      var showImpacts=rainMode==='terrain'||rainMode==='both';
      if(rainMode==='falling'||rainMode==='both'||rainMode==='terrain'){
        rainCtx.lineCap='round';rainCtx.lineWidth=1;
        for(var i=0;i<rainDrops.length;i++){
          var drop=rainDrops[i];drop.x+=drop.drift;drop.y+=drop.speed;
          if(drop.y>size.height+drop.length||drop.x<-18||drop.x>size.width+18){rainDrops[i]=makeRainDrop(false);continue;}
          var alpha=rainMode==='terrain'?drop.alpha*.55:drop.alpha;
          rainCtx.strokeStyle='rgba(190,222,245,'+alpha.toFixed(3)+')';
          rainCtx.beginPath();rainCtx.moveTo(drop.x,drop.y);rainCtx.lineTo(drop.x+drop.slant,drop.y+drop.length);rainCtx.stroke();
        }
      }
      if(showImpacts){
        for(var j=0;j<rainImpacts.length;j++){
          var impact=rainImpacts[j];impact.phase+=.09+windSpeedKmh*.001;
          var pulse=(Math.sin(impact.phase)+1)/2;
          rainCtx.strokeStyle='rgba(190,222,245,'+(impact.alpha*(1-pulse*.45)).toFixed(3)+')';
          rainCtx.lineWidth=1;rainCtx.beginPath();
          rainCtx.ellipse(impact.x,impact.y,impact.radius+pulse*2,Math.max(.7,impact.radius*.32+pulse),0,0,Math.PI*2);rainCtx.stroke();
          if(pulse>.92)rainImpacts[j]=makeRainImpact(false);
        }
      }
    }

    function buildSegments(result){
      if(!result||!result.grid||!result.stats)fail('Hydrology result is incomplete.');
      var grid=result.grid,flowTo=result.flowTo,accum=result.flowAccumulation;
      var valid=result.validMask,elevations=result.elevations;
      var size=Number(grid.rows)*Number(grid.cols);
      if(!Number.isInteger(size)||size<1||size>300000)fail('Hydrology result exceeds the flow overlay cell limit.');
      if(!flowTo||flowTo.length!==size||!accum||accum.length!==size||!valid||valid.length!==size||!elevations||elevations.length!==size)fail('Hydrology result arrays are inconsistent.');
      if(!finite(grid.originX)||!finite(grid.originY)||!finite(grid.cellSizeX)||!finite(grid.cellSizeY)||grid.cellSizeX<=0||grid.cellSizeY<=0)fail('Hydrology grid coordinate metadata is invalid.');
      var validCount=Number(result.stats.validCellCount)||Number(grid.validCellCount)||0;
      var maxAccum=Number(result.stats.maxFlowAccumulationCells)||1;
      segmentThreshold=Math.max(2,Math.ceil(validCount/MAX_SEGMENTS));
      var candidates=[];
      for(var i=0;i<size;i++){
        if(!valid[i]||flowTo[i]<0||accum[i]<segmentThreshold)continue;
        var dest=flowTo[i];
        if(dest>=size||!valid[dest]||accum[dest]<segmentThreshold)continue;
        // Keep the visual flow overlay away from the raster grid perimeter.
        // Edge-cell paths can visually trace the terrain silhouette even when
        // the underlying D8 routing result is valid.
        var row=Math.floor(i/grid.cols),col=i%grid.cols;
        var destRow=Math.floor(dest/grid.cols),destCol=dest%grid.cols;
        // Only trim perimeter paths when the raster has an interior.
        // Small grids (for example 2x3) have no interior cells, so retain
        // their valid routes rather than suppressing the entire overlay.
        if(grid.rows>2&&grid.cols>2&&
           (row===0||col===0||row===grid.rows-1||col===grid.cols-1||
            destRow===0||destCol===0||destRow===grid.rows-1||destCol===grid.cols-1))continue;
        candidates.push({from:i,to:dest,accumulation:accum[i]});
      }
      if(candidates.length>MAX_SEGMENTS){
        candidates.sort(function(a,b){return b.accumulation-a.accumulation||a.from-b.from;});
        candidates.length=MAX_SEGMENTS;
      }
      candidates.sort(function(a,b){return a.from-b.from;});
      segments=candidates;
      var ranked=segments.slice().sort(function(a,b){return b.accumulation-a.accumulation||a.from-b.from;});
      if(ranked.length>MAX_PARTICLES)ranked.length=MAX_PARTICLES;
      particleTracks=ranked.map(function(segment,index){
        return {segment:segment,phase:ranked.length?index/ranked.length:0};
      });
      drawnSegmentCount=0;
      return {segmentCount:segments.length,threshold:segmentThreshold,maxAccumulationCells:maxAccum};
    }

    function cellPoint(index,cache){
      if(cache&&cache.has(index))return cache.get(index);
      var grid=analysis.grid;
      var row=Math.floor(index/grid.cols),col=index%grid.cols;
      var x=grid.originX+col*grid.cellSizeX;
      var y=grid.originY+row*grid.cellSizeY;
      var point=topo.projectCoordinate(x,y,analysis.elevations[index]);
      if(cache)cache.set(index,point);
      return point;
    }

    function signature(frame,size){
      frame=frame||{};
      return [
        frame.view||'',frame.angleX===undefined?0:frame.angleX,
        frame.angleY===undefined?0:frame.angleY,frame.zoom===undefined?0:frame.zoom,
        frame.panX===undefined?0:frame.panX,frame.panY===undefined?0:frame.panY,
        size.width,size.height,segments.length,visible?'1':'0'
      ].join('|');
    }

    function draw(frame,force){
      if(destroyed)return;
      var size=ensureCanvasSize();
      if(!visible||!analysis){
        ctx.clearRect(0,0,size.width,size.height);
        drawnSegmentCount=0;
        lastSignature='';
        return;
      }
      var key=signature(frame,size);
      if(!force&&key===lastSignature&&!size.changed)return;
      lastSignature=key;
      ctx.clearRect(0,0,size.width,size.height);
      if(typeof topo.projectCoordinate!=='function')return;
      var maxAccum=Number(analysis.stats.maxFlowAccumulationCells)||1;
      ctx.lineCap='round';ctx.lineJoin='round';
      ctx.shadowBlur=0;
      /* Adjacent D8 segments share cells. Project each unique cell once per map frame,
         instead of repeating the same CPU projection for every segment endpoint. */
      var projectedCells=new Map();
      var arrowStride=Math.max(1,Math.ceil(segments.length/150));
      var drawn=0;
      for(var i=0;i<segments.length;i++){
        var segment=segments[i];
        var a=cellPoint(segment.from,projectedCells),b=cellPoint(segment.to,projectedCells);
        if(!a||!b||!finite(a.x)||!finite(a.y)||!finite(b.x)||!finite(b.y))continue;
        if(!a.inside&&!b.inside)continue;
        var ratio=Math.max(0,Math.min(1,Math.log1p(segment.accumulation)/Math.log1p(maxAccum)));
        var alpha=.48+.48*ratio;
        ctx.strokeStyle='rgba(56,189,248,'+alpha.toFixed(3)+')';
        ctx.lineWidth=1.05+1.25*ratio;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        if(i%arrowStride===0&&segment.accumulation>=segmentThreshold*2){
          var dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
          if(len>5){
            var t=.68,px=a.x+dx*t,py=a.y+dy*t,angle=Math.atan2(dy,dx);
            var head=3.2+2*ratio;
            ctx.fillStyle='rgba(191,239,255,'+Math.min(1,alpha+.08).toFixed(3)+')';
            ctx.beginPath();
            ctx.moveTo(px+Math.cos(angle)*head,py+Math.sin(angle)*head);
            ctx.lineTo(px+Math.cos(angle+2.45)*head,py+Math.sin(angle+2.45)*head);
            ctx.lineTo(px+Math.cos(angle-2.45)*head,py+Math.sin(angle-2.45)*head);
            ctx.closePath();ctx.fill();
          }
        }
        drawn++;
      }
      drawnSegmentCount=drawn;
    }

    function drawParticles(timestamp){
      if(destroyed)return;
      var size=ensureCanvasSize();
      particleCtx.clearRect(0,0,size.width,size.height);
      if(!visible||!analysis||!animationEnabled||!particleTracks.length)return;
      if(!finite(timestamp))timestamp=0;
      if(animationStart===null)animationStart=timestamp;
      var elapsed=((timestamp-animationStart)%PARTICLE_PERIOD_MS+PARTICLE_PERIOD_MS)%PARTICLE_PERIOD_MS;
      var progressBase=elapsed/PARTICLE_PERIOD_MS;
      var maxAccum=Number(analysis.stats.maxFlowAccumulationCells)||1;
      particleCtx.lineCap='round';
      /* Particle tracks share endpoints too; reuse their projections for this animation tick. */
      var projectedCells=new Map();
      for(var i=0;i<particleTracks.length;i++){
        var track=particleTracks[i],segment=track.segment;
        var a=cellPoint(segment.from,projectedCells),b=cellPoint(segment.to,projectedCells);
        if(!a||!b||!finite(a.x)||!finite(a.y)||!finite(b.x)||!finite(b.y))continue;
        if(!a.inside&&!b.inside)continue;
        var progress=(progressBase+track.phase)%1;
        var x=a.x+(b.x-a.x)*progress,y=a.y+(b.y-a.y)*progress;
        var tailProgress=Math.max(0,progress-.09);
        var tailX=a.x+(b.x-a.x)*tailProgress,tailY=a.y+(b.y-a.y)*tailProgress;
        var ratio=Math.max(0,Math.min(1,Math.log1p(segment.accumulation)/Math.log1p(maxAccum)));
        var alpha=.48+.42*ratio;
        particleCtx.strokeStyle='rgba(186,230,253,'+alpha.toFixed(3)+')';
        particleCtx.lineWidth=1+ratio;
        particleCtx.beginPath();particleCtx.moveTo(tailX,tailY);particleCtx.lineTo(x,y);particleCtx.stroke();
        particleCtx.fillStyle='rgba(224,242,254,'+Math.min(1,alpha+.12).toFixed(3)+')';
        particleCtx.beginPath();particleCtx.arc(x,y,1.7+ratio*1.1,0,Math.PI*2);particleCtx.fill();
      }
    }

    function animationTick(timestamp){
      animationFrameId=null;
      if(destroyed||!visible||!analysis||(!animationEnabled&&(!rainfallEnabled||topView)))return;
      if(animationEnabled)drawParticles(timestamp);
      if(rainfallEnabled&&!topView)drawRain();
      animationFrameId=global.requestAnimationFrame(animationTick);
    }
    function startAnimationLoop(){
      if(destroyed||!visible||!analysis||(!animationEnabled&&!rainfallEnabled)||animationFrameId!==null)return;
      if(typeof global.requestAnimationFrame!=='function')return;
      particleCanvas.hidden=!animationEnabled;
      rainCanvas.hidden=!rainfallEnabled;
      animationFrameId=global.requestAnimationFrame(animationTick);
    }
    function stopAnimationLoop(){
      if(animationFrameId!==null&&typeof global.cancelAnimationFrame==='function'){
        global.cancelAnimationFrame(animationFrameId);
      }
      animationFrameId=null;animationStart=null;
    }

    function setAnalysis(result){
      if(destroyed)fail('Hydrology overlay has been destroyed.');
      stopAnimationLoop();
      animationEnabled=false;particleCanvas.hidden=true;
      analysis=result;var stats=buildSegments(result);lastSignature='';draw(null,true);
      particleCtx.clearRect(0,0,cssWidth,cssHeight);
      rainMode='both';
      return stats;
    }
    function syncView(frame){
      var view=String(frame&&frame.view||'').toLowerCase();
      var nextTop=view==='top'||view==='2d'||view==='plan';
      if(nextTop===topView)return;
      topView=nextTop;lastSignature='';
      rainCanvas.hidden=!visible||!rainfallEnabled||!analysis||topView;
      if(topView){rainCtx.clearRect(0,0,cssWidth,cssHeight);if(!animationEnabled)stopAnimationLoop();}
      else if(rainfallEnabled&&visible&&analysis)startAnimationLoop();
    }
    function setVisible(value){
      if(destroyed)return false;
      visible=!!value;canvas.hidden=!visible;particleCanvas.hidden=!visible||!animationEnabled||!analysis;rainCanvas.hidden=!visible||!rainfallEnabled||!analysis;lastSignature='';
      if(visible){
        draw(null,true);
        if(animationEnabled||rainfallEnabled)startAnimationLoop();
      }else{
        stopAnimationLoop();
        var size=ensureCanvasSize();ctx.clearRect(0,0,size.width,size.height);particleCtx.clearRect(0,0,size.width,size.height);rainCtx.clearRect(0,0,size.width,size.height);
      }
      return visible;
    }
    function setAnimationEnabled(value){
      if(destroyed)return false;
      var next=!!value;
      if(next&&(!analysis||!particleTracks.length||typeof global.requestAnimationFrame!=='function'))return false;
      animationEnabled=next;
      if(animationEnabled&&visible&&analysis&&particleTracks.length){
        particleCanvas.hidden=false;animationStart=null;startAnimationLoop();
      }else{
        particleCanvas.hidden=true;
        var size=ensureCanvasSize();particleCtx.clearRect(0,0,size.width,size.height);
        if(rainfallEnabled&&visible&&analysis)startAnimationLoop();
        else stopAnimationLoop();
      }
      return animationEnabled;
    }
    function setRainfallEnabled(value){
      if(destroyed)return false;
      rainfallEnabled=!!value&&!!analysis&&typeof global.requestAnimationFrame==='function';
      rainCanvas.hidden=!visible||!rainfallEnabled||!analysis;
      if(rainfallEnabled&&visible)startAnimationLoop();
      else if(!animationEnabled){stopAnimationLoop();rainCtx.clearRect(0,0,cssWidth,cssHeight);}
      return rainfallEnabled;
    }
    function isAnimationEnabled(){return animationEnabled;}
    function setRainfallOptions(options){
      if(destroyed)return false;
      options=options||{};
      var mode=String(options.mode||rainMode);
      if(['falling','terrain','both','none'].indexOf(mode)<0)mode='both';
      rainMode=mode;
      var speed=Number(options.windSpeedKmh);
      if(Number.isFinite(speed))windSpeedKmh=Math.max(0,Math.min(35,speed));
      var direction=String(options.windDirection||windDirection).toUpperCase();
      if(['N','NE','E','SE','S','SW','W','NW'].indexOf(direction)>=0)windDirection=direction;
      rainDrops.forEach(function(drop){var next=makeRainDrop(false);drop.length=next.length;drop.speed=next.speed;drop.drift=next.drift;drop.slant=next.slant;drop.alpha=next.alpha;});
      if(analysis&&typeof global.requestAnimationFrame==='function')setRainfallEnabled(rainMode!=='none');
      return {mode:rainMode,windSpeedKmh:windSpeedKmh,windDirection:windDirection};
    }
    function isRainfallEnabled(){return rainfallEnabled;}
    function getRainfallOptions(){return {mode:rainMode,windSpeedKmh:windSpeedKmh,windDirection:windDirection};}
    function isVisible(){return visible&&!canvas.hidden;}
    function clearCanvasBackingStore(layer,context,size){
      // Recreate the bitmap to force a full transparent backing-store reset.
      // This is more robust than clearRect alone if an embedded WebView retains
      // stale pixels from a composited canvas layer.
      var width=layer.width,height=layer.height;
      layer.width=width;layer.height=height;
      context.setTransform(dpr,0,0,dpr,0,0);
      context.clearRect(0,0,size.width,size.height);
    }
    function clear(){
      stopAnimationLoop();
      analysis=null;segments=[];particleTracks=[];segmentThreshold=0;drawnSegmentCount=0;
      animationEnabled=false;rainfallEnabled=false;particleCanvas.hidden=true;rainCanvas.hidden=true;lastSignature='';
      var size=ensureCanvasSize();
      clearCanvasBackingStore(canvas,ctx,size);
      clearCanvasBackingStore(particleCanvas,particleCtx,size);
      clearCanvasBackingStore(rainCanvas,rainCtx,size);
    }
    function getStats(){
      return {
        visible:isVisible(),segmentCount:segments.length,threshold:segmentThreshold,
        drawnSegmentCount:drawnSegmentCount,animationEnabled:animationEnabled,rainfallEnabled:rainfallEnabled,
        particleTrackCount:particleTracks.length,animationRunning:animationFrameId!==null
      };
    }
    function destroy(){
      if(destroyed)return;
      stopAnimationLoop();destroyed=true;
      if(typeof unsubscribe==='function')unsubscribe();
      unsubscribe=null;analysis=null;segments=[];particleTracks=[];
      if(canvas.parentNode)canvas.parentNode.removeChild(canvas);
      if(particleCanvas.parentNode)particleCanvas.parentNode.removeChild(particleCanvas);
      if(rainCanvas.parentNode)rainCanvas.parentNode.removeChild(rainCanvas);
    }
    unsubscribe=topo.subscribeRender(function(frame){syncView(frame);draw(frame,false);});
    return {
      setAnalysis:setAnalysis,setVisible:setVisible,isVisible:isVisible,
      setAnimationEnabled:setAnimationEnabled,isAnimationEnabled:isAnimationEnabled,
      setRainfallEnabled:setRainfallEnabled,isRainfallEnabled:isRainfallEnabled,
      setRainfallOptions:setRainfallOptions,getRainfallOptions:getRainfallOptions,
      clear:clear,getStats:getStats,destroy:destroy,render:draw
    };
  }

  global.LithositeHydrologyOverlay={
    create:create,version:'1.2.0',
    limits:{maxSegments:MAX_SEGMENTS,maxParticles:MAX_PARTICLES}
  };
})(window);
