/*
 * Lithosite Hydrology Flow Overlay
 * Draws bounded D8 direction segments on a 2D overlay aligned to the Topo3D canvas.
 * It receives a narrow projection/render facade, never the Topo3D internal model.
 */
(function(global){
  'use strict';

  var MAX_SEGMENTS=2400;

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
    var ctx=canvas.getContext('2d');
    if(!ctx){if(canvas.parentNode)canvas.parentNode.removeChild(canvas);fail('2D flow overlay canvas is unavailable.');}

    var analysis=null,segments=[],unsubscribe=null,visible=true,destroyed=false,lastSignature='';
    var cssWidth=0,cssHeight=0,dpr=1,segmentThreshold=0,drawnSegmentCount=0;

    function ensureCanvasSize(){
      var rect=host.getBoundingClientRect?host.getBoundingClientRect():null;
      var width=Math.max(1,Number(host.clientWidth)||(rect&&rect.width)||1);
      var height=Math.max(1,Number(host.clientHeight)||(rect&&rect.height)||1);
      var ratio=Math.min(2,Math.max(1,Number(global.devicePixelRatio)||1));
      var changed=width!==cssWidth||height!==cssHeight||ratio!==dpr;
      if(changed){
        cssWidth=width;cssHeight=height;dpr=ratio;
        canvas.width=Math.round(cssWidth*dpr);
        canvas.height=Math.round(cssHeight*dpr);
        canvas.style.width='100%';canvas.style.height='100%';
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      return {width:cssWidth,height:cssHeight,changed:changed};
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
        candidates.push({from:i,to:dest,accumulation:accum[i]});
      }
      if(candidates.length>MAX_SEGMENTS){
        candidates.sort(function(a,b){return b.accumulation-a.accumulation||a.from-b.from;});
        candidates.length=MAX_SEGMENTS;
      }
      candidates.sort(function(a,b){return a.from-b.from;});
      segments=candidates;
      drawnSegmentCount=0;
      return {segmentCount:segments.length,threshold:segmentThreshold,maxAccumulationCells:maxAccum};
    }

    function cellPoint(index){
      var grid=analysis.grid;
      var row=Math.floor(index/grid.cols),col=index%grid.cols;
      var x=grid.originX+col*grid.cellSizeX;
      var y=grid.originY+row*grid.cellSizeY;
      // Use source surface elevation for draping; depression filling alters routing, not terrain.
      return topo.projectCoordinate(x,y,analysis.elevations[index]);
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
      if(destroyed||!visible||!analysis)return;
      var size=ensureCanvasSize();
      var key=signature(frame,size);
      if(!force&&key===lastSignature&&!size.changed)return;
      lastSignature=key;
      ctx.clearRect(0,0,size.width,size.height);
      if(typeof topo.projectCoordinate!=='function')return;
      var maxAccum=Number(analysis.stats.maxFlowAccumulationCells)||1;
      ctx.lineCap='round';ctx.lineJoin='round';
      var arrowStride=Math.max(1,Math.ceil(segments.length/150));
      var drawn=0;
      for(var i=0;i<segments.length;i++){
        var segment=segments[i];
        var a=cellPoint(segment.from),b=cellPoint(segment.to);
        if(!a||!b||!finite(a.x)||!finite(a.y)||!finite(b.x)||!finite(b.y))continue;
        if(!a.inside&&!b.inside)continue;
        var ratio=Math.max(0,Math.min(1,Math.log1p(segment.accumulation)/Math.log1p(maxAccum)));
        var alpha=.48+.48*ratio;
        ctx.strokeStyle='rgba(56,189,248,'+alpha.toFixed(3)+')';
        ctx.lineWidth=1.05+1.25*ratio;
        ctx.shadowColor='rgba(2,8,23,.85)';ctx.shadowBlur=2;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.shadowBlur=0;
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

    function setAnalysis(result){
      if(destroyed)fail('Hydrology overlay has been destroyed.');
      analysis=result;buildSegments(result);lastSignature='';draw(null,true);
      return {segmentCount:segments.length,threshold:segmentThreshold};
    }
    function setVisible(value){
      if(destroyed)return false;
      visible=!!value;canvas.hidden=!visible;lastSignature='';
      if(visible)draw(null,true);
      else{var size=ensureCanvasSize();ctx.clearRect(0,0,size.width,size.height);}
      return visible;
    }
    function isVisible(){return visible&&!canvas.hidden;}
    function clear(){
      analysis=null;segments=[];segmentThreshold=0;drawnSegmentCount=0;lastSignature='';
      var size=ensureCanvasSize();ctx.clearRect(0,0,size.width,size.height);
    }
    function getStats(){
      return {visible:isVisible(),segmentCount:segments.length,threshold:segmentThreshold,drawnSegmentCount:drawnSegmentCount};
    }
    function destroy(){
      if(destroyed)return;
      destroyed=true;
      if(typeof unsubscribe==='function')unsubscribe();
      unsubscribe=null;analysis=null;segments=[];
      if(canvas.parentNode)canvas.parentNode.removeChild(canvas);
    }
    unsubscribe=topo.subscribeRender(function(frame){draw(frame,false);});
    return {setAnalysis:setAnalysis,setVisible:setVisible,isVisible:isVisible,clear:clear,getStats:getStats,destroy:destroy,render:draw};
  }

  global.LithositeHydrologyOverlay={create:create,version:'1.0.0',limits:{maxSegments:MAX_SEGMENTS}};
})(window);
