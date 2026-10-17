/*
 * Lithosite Hydrology Engine
 * Version: 1.0.0
 * Purpose: bounded, UI-independent terrain-grid analysis for indicative runoff studies.
 *
 * Input grid row index increases toward +northing. D8 direction codes:
 * 1=N, 2=NE, 3=E, 4=SE, 5=S, 6=SW, 7=W, 8=NW; 0=valid cell without
 * a downstream route; -1=NoData. Flow accumulation includes the cell itself.
 *
 * This engine deliberately does not read private Topo3D state or modify source DTM.
 * A reviewed read-only mesh adapter is required to feed the loaded Site Map mesh.
 */
(function(global){
  'use strict';

  var VERSION='1.0.0';
  var MAX_GRID_CELLS=300000;
  var MAX_TIN_VERTICES=300000;
  var MAX_TIN_TRIANGLES=600000;
  var DEFAULT_MAX_RASTER_SAMPLES=5000000;
  var MAX_RASTER_SAMPLES=10000000;

  var DX=[0,1,1,1,0,-1,-1,-1];
  var DY=[1,1,0,-1,-1,-1,0,1];
  var DIRECTION_NAMES=['N','NE','E','SE','S','SW','W','NW'];

  function fail(code,message){
    var error=new Error(message);
    error.code=code;
    throw error;
  }
  function finiteNumber(value){return typeof value==='number'&&Number.isFinite(value);}
  function positiveNumber(value,label){
    if(!finiteNumber(value)||value<=0)fail('HYDROLOGY_INVALID_INPUT',label+' must be a finite number greater than zero.');
    return value;
  }
  function safeInteger(value,label,min,max){
    if(!Number.isInteger(value)||value<min||value>max)fail('HYDROLOGY_INVALID_INPUT',label+' is outside the supported range.');
    return value;
  }
  function dataLength(value){
    return value&&typeof value.length==='number'&&Number.isInteger(value.length)&&value.length>=0;
  }
  function MinHeap(){
    this.items=[];
  }
  MinHeap.prototype.push=function(item){
    var a=this.items,idx=a.length;
    a.push(item);
    while(idx>0){
      var parent=(idx-1)>>1,other=a[parent];
      if(other.z<item.z||(other.z===item.z&&other.index<=item.index))break;
      a[idx]=other;idx=parent;
    }
    a[idx]=item;
  };
  MinHeap.prototype.pop=function(){
    var a=this.items;
    if(!a.length)return null;
    var root=a[0],last=a.pop();
    if(a.length){
      var idx=0;
      while(true){
        var left=idx*2+1,right=left+1,best=idx;
        if(left<a.length&&(a[left].z<last.z||(a[left].z===last.z&&a[left].index<last.index)))best=left;
        if(right<a.length&&(a[right].z<a[best].z||(a[right].z===a[best].z&&a[right].index<a[best].index)))best=right;
        if(best===idx)break;
        a[idx]=a[best];idx=best;
      }
      a[idx]=last;
    }
    return root;
  };
  function makeBounds(rawXYZ){
    var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(var i=0;i<rawXYZ.length;i+=3){
      var x=rawXYZ[i],y=rawXYZ[i+1],z=rawXYZ[i+2];
      if(!finiteNumber(x)||!finiteNumber(y)||!finiteNumber(z))fail('HYDROLOGY_MESH_INVALID','Mesh vertices must contain finite Easting, Northing, and Elevation values.');
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);
      minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    }
    return {minX:minX,minY:minY,maxX:maxX,maxY:maxY};
  }

  function HydrologyEngine(options){
    options=options||{};
    this.maxGridCells=options.maxGridCells===undefined?MAX_GRID_CELLS:safeInteger(options.maxGridCells,'maxGridCells',4,MAX_GRID_CELLS);
    this.maxRasterSamples=options.maxRasterSamples===undefined?DEFAULT_MAX_RASTER_SAMPLES:safeInteger(options.maxRasterSamples,'maxRasterSamples',1,MAX_RASTER_SAMPLES);
  }

  HydrologyEngine.prototype.rasterizeTIN=function(options){
    options=options||{};
    var rawXYZ=options.rawXYZ||options.vertices;
    var indices=options.indices;
    if(!dataLength(rawXYZ)||rawXYZ.length<9||rawXYZ.length%3!==0)fail('HYDROLOGY_MESH_INVALID','rawXYZ must be packed XYZ triples.');
    if(!dataLength(indices)||indices.length<3||indices.length%3!==0)fail('HYDROLOGY_MESH_INVALID','indices must contain complete triangle triples.');
    var vertexCount=rawXYZ.length/3,triangleCount=indices.length/3;
    if(vertexCount>MAX_TIN_VERTICES)fail('HYDROLOGY_RESOURCE_LIMIT','Mesh vertex count exceeds the Topo3D limit.');
    if(triangleCount>MAX_TIN_TRIANGLES)fail('HYDROLOGY_RESOURCE_LIMIT','Mesh triangle count exceeds the Topo3D limit.');
    var cellSizeM=positiveNumber(options.cellSizeM,'cellSizeM');
    var maxGridCells=options.maxGridCells===undefined?this.maxGridCells:safeInteger(options.maxGridCells,'maxGridCells',4,this.maxGridCells);
    var maxRasterSamples=options.maxRasterSamples===undefined?this.maxRasterSamples:safeInteger(options.maxRasterSamples,'maxRasterSamples',1,this.maxRasterSamples);
    var bounds=options.bounds||makeBounds(rawXYZ);
    ['minX','minY','maxX','maxY'].forEach(function(key){
      if(!finiteNumber(bounds[key]))fail('HYDROLOGY_MESH_INVALID','Terrain bounds are incomplete.');
    });
    if(bounds.maxX<=bounds.minX||bounds.maxY<=bounds.minY)fail('HYDROLOGY_MESH_INVALID','Terrain bounds must have positive width and height.');
    var cols=Math.ceil((bounds.maxX-bounds.minX)/cellSizeM);
    var rows=Math.ceil((bounds.maxY-bounds.minY)/cellSizeM);
    safeInteger(rows,'raster rows',2,maxGridCells);
    safeInteger(cols,'raster columns',2,maxGridCells);
    if(rows*cols>maxGridCells)fail('HYDROLOGY_RESOURCE_LIMIT','Raster grid exceeds '+maxGridCells.toLocaleString('en-US')+' cells. Increase grid resolution.');
    var elevations=new Float64Array(rows*cols);
    elevations.fill(NaN);
    var validMask=new Uint8Array(rows*cols);
    var testedSamples=0,validCellCount=0;
    var minX=bounds.minX,minY=bounds.minY;

    for(var tri=0;tri<indices.length;tri+=3){
      var ia=indices[tri],ib=indices[tri+1],ic=indices[tri+2];
      if(!Number.isInteger(ia)||!Number.isInteger(ib)||!Number.isInteger(ic)||ia<0||ib<0||ic<0||ia>=vertexCount||ib>=vertexCount||ic>=vertexCount){
        fail('HYDROLOGY_MESH_INVALID','Triangle index references a missing vertex.');
      }
      var a=ia*3,b=ib*3,c=ic*3;
      var x1=rawXYZ[a],y1=rawXYZ[a+1],z1=rawXYZ[a+2];
      var x2=rawXYZ[b],y2=rawXYZ[b+1],z2=rawXYZ[b+2];
      var x3=rawXYZ[c],y3=rawXYZ[c+1],z3=rawXYZ[c+2];
      var denominator=(y2-y3)*(x1-x3)+(x3-x2)*(y1-y3);
      if(Math.abs(denominator)<1e-12)continue;
      var triMinX=Math.min(x1,x2,x3),triMaxX=Math.max(x1,x2,x3);
      var triMinY=Math.min(y1,y2,y3),triMaxY=Math.max(y1,y2,y3);
      var col0=Math.max(0,Math.ceil((triMinX-minX)/cellSizeM-.5));
      var col1=Math.min(cols-1,Math.floor((triMaxX-minX)/cellSizeM-.5));
      var row0=Math.max(0,Math.ceil((triMinY-minY)/cellSizeM-.5));
      var row1=Math.min(rows-1,Math.floor((triMaxY-minY)/cellSizeM-.5));
      if(col0>col1||row0>row1)continue;
      for(var row=row0;row<=row1;row++){
        var y=minY+(row+.5)*cellSizeM;
        for(var col=col0;col<=col1;col++){
          var flatIndex=row*cols+col;
          if(validMask[flatIndex])continue;
          testedSamples++;
          if(testedSamples>maxRasterSamples)fail('HYDROLOGY_RESOURCE_LIMIT','TIN rasterization exceeded the bounded cell-sampling budget.');
          var x=minX+(col+.5)*cellSizeM;
          var w1=((y2-y3)*(x-x3)+(x3-x2)*(y-y3))/denominator;
          var w2=((y3-y1)*(x-x3)+(x1-x3)*(y-y3))/denominator;
          var w3=1-w1-w2;
          var tolerance=-1e-10;
          if(w1>=tolerance&&w2>=tolerance&&w3>=tolerance){
            elevations[flatIndex]=w1*z1+w2*z2+w3*z3;
            validMask[flatIndex]=1;
            validCellCount++;
          }
        }
      }
    }
    if(validCellCount<4)fail('HYDROLOGY_GRID_INVALID','Terrain did not produce enough valid raster cells at this resolution.');
    return {
      rows:rows,cols:cols,elevations:elevations,validMask:validMask,
      originX:minX+cellSizeM/2,originY:minY+cellSizeM/2,
      cellSizeM:cellSizeM,cellSizeX:cellSizeM,cellSizeY:cellSizeM,
      validCellCount:validCellCount,validCellFraction:validCellCount/(rows*cols),
      bounds:{minX:bounds.minX,minY:bounds.minY,maxX:bounds.maxX,maxY:bounds.maxY},
      rasterization:{method:'TIN_TRIANGLE_INTERPOLATION',testedSamples:testedSamples,sourceVertexCount:vertexCount,sourceTriangleCount:triangleCount}
    };
  };

  HydrologyEngine.prototype.analyzeGrid=function(options){
    options=options||{};
    var rows=safeInteger(options.rows,'rows',2,this.maxGridCells);
    var cols=safeInteger(options.cols,'cols',2,this.maxGridCells);
    var size=rows*cols;
    if(size>this.maxGridCells)fail('HYDROLOGY_RESOURCE_LIMIT','Grid exceeds '+this.maxGridCells.toLocaleString('en-US')+' cells.');
    var elevationsIn=options.elevations;
    if(!dataLength(elevationsIn)||elevationsIn.length!==size)fail('HYDROLOGY_GRID_INVALID','elevations length must equal rows × cols.');
    var validIn=options.validMask;
    if(validIn!==undefined&&(!dataLength(validIn)||validIn.length!==size))fail('HYDROLOGY_GRID_INVALID','validMask length must equal rows × cols.');
    var cellSizeM=options.cellSizeM;
    var cellSizeX=positiveNumber(options.cellSizeX===undefined?cellSizeM:options.cellSizeX,'cellSizeX');
    var cellSizeY=positiveNumber(options.cellSizeY===undefined?cellSizeM:options.cellSizeY,'cellSizeY');
    var noDataValue=options.noDataValue;
    var elevations=new Float64Array(size),validMask=new Uint8Array(size),validCellCount=0;
    for(var i=0;i<size;i++){
      var value=elevationsIn[i];
      var isValid=(validIn===undefined||!!validIn[i])&&finiteNumber(value)&&!(noDataValue!==undefined&&value===noDataValue);
      if(isValid){elevations[i]=value;validMask[i]=1;validCellCount++;}
      else elevations[i]=NaN;
    }
    if(validCellCount<4)fail('HYDROLOGY_GRID_INVALID','At least four valid elevation cells are required.');
    var treatment=String(options.depressionTreatment||'FILL').toUpperCase();
    if(treatment==='BREACH')fail('HYDROLOGY_UNSUPPORTED_MODE','Depression treatment BREACH is reserved for a future model version.');
    if(treatment!=='FILL'&&treatment!=='PRESERVE')fail('HYDROLOGY_INVALID_INPUT','depressionTreatment must be FILL or PRESERVE in this engine version.');

    var filledElevations=new Float64Array(elevations);
    var flowTo=new Int32Array(size);flowTo.fill(-1);
    var flowDirection=new Int8Array(size);flowDirection.fill(-1);
    var flowAccumulation=new Uint32Array(size);
    var outletMask=new Uint8Array(size),parent=new Int32Array(size);parent.fill(-1);
    var parentDirection=new Int8Array(size),visited=new Uint8Array(size);
    var warnings=[];
    var hasNoData=false;
    for(i=0;i<size;i++)if(!validMask[i]){hasNoData=true;break;}
    if(hasNoData)warnings.push('Cells adjacent to NoData are treated as open analysis boundaries; verify terrain coverage before interpreting outlets.');

    function indexAt(row,col){return row*cols+col;}
    function isOpenBoundary(idx){
      var row=Math.floor(idx/cols),col=idx%cols;
      if(row===0||row===rows-1||col===0||col===cols-1)return true;
      for(var d=0;d<8;d++){
        var nr=row+DY[d],nc=col+DX[d];
        if(nr<0||nr>=rows||nc<0||nc>=cols||!validMask[indexAt(nr,nc)])return true;
      }
      return false;
    }
    if(treatment==='FILL'){
      var heap=new MinHeap(),seedCount=0;
      for(i=0;i<size;i++){
        if(validMask[i]&&isOpenBoundary(i)){
          visited[i]=1;outletMask[i]=1;heap.push({index:i,z:elevations[i]});seedCount++;
        }
      }
      if(seedCount===0){
        var lowest=-1,lowestZ=Infinity;
        for(i=0;i<size;i++)if(validMask[i]&&elevations[i]<lowestZ){lowestZ=elevations[i];lowest=i;}
        if(lowest>=0){visited[lowest]=1;outletMask[lowest]=1;heap.push({index:lowest,z:lowestZ});}
        warnings.push('No exposed raster boundary was found; the lowest valid cell was used as a local outlet.');
      }
      while(heap.items.length){
        var current=heap.pop(),currentRow=Math.floor(current.index/cols),currentCol=current.index%cols;
        for(var nd=0;nd<8;nd++){
          var rr=currentRow+DY[nd],cc=currentCol+DX[nd];
          if(rr<0||rr>=rows||cc<0||cc>=cols)continue;
          var neighbour=indexAt(rr,cc);
          if(!validMask[neighbour]||visited[neighbour])continue;
          visited[neighbour]=1;
          parent[neighbour]=current.index;
          parentDirection[neighbour]=((nd+4)%8)+1;
          filledElevations[neighbour]=Math.max(elevations[neighbour],filledElevations[current.index]);
          heap.push({index:neighbour,z:filledElevations[neighbour]});
        }
      }
    }else{
      for(i=0;i<size;i++)if(validMask[i]&&isOpenBoundary(i))outletMask[i]=1;
    }

    // D8 routing selects the greatest positive downslope gradient; ties retain fixed direction order.
    for(i=0;i<size;i++){
      if(!validMask[i])continue;
      var rowNow=Math.floor(i/cols),colNow=i%cols,zNow=filledElevations[i];
      var bestSlope=0,bestIndex=-1,bestDirection=0;
      for(var dir=0;dir<8;dir++){
        var r2=rowNow+DY[dir],c2=colNow+DX[dir];
        if(r2<0||r2>=rows||c2<0||c2>=cols)continue;
        var candidate=indexAt(r2,c2);
        if(!validMask[candidate])continue;
        var drop=zNow-filledElevations[candidate];
        if(drop<=0)continue;
        var distance=Math.hypot(DX[dir]*cellSizeX,DY[dir]*cellSizeY);
        var slope=drop/distance;
        if(slope>bestSlope){bestSlope=slope;bestIndex=candidate;bestDirection=dir+1;}
      }
      if(bestIndex>=0){
        flowTo[i]=bestIndex;flowDirection[i]=bestDirection;
      }else if(treatment==='FILL'&&parent[i]>=0){
        flowTo[i]=parent[i];flowDirection[i]=parentDirection[i];
      }else{
        flowTo[i]=-1;flowDirection[i]=0;
      }
    }

    // Accumulation is propagated over a topological order to avoid recursive stack growth.
    var indegree=new Uint32Array(size),queue=new Int32Array(validCellCount);
    for(i=0;i<size;i++)if(validMask[i]){
      flowAccumulation[i]=1;
      if(flowTo[i]>=0)indegree[flowTo[i]]++;
    }
    var head=0,tail=0,processed=0;
    for(i=0;i<size;i++)if(validMask[i]&&indegree[i]===0)queue[tail++]=i;
    while(head<tail){
      var node=queue[head++];processed++;
      var dest=flowTo[node];
      if(dest>=0){
        flowAccumulation[dest]+=flowAccumulation[node];
        indegree[dest]--;
        if(indegree[dest]===0)queue[tail++]=dest;
      }
    }
    if(processed!==validCellCount)fail('HYDROLOGY_FLOW_CYCLE','Flow-routing graph contains a cycle; results were not returned.');

    var outletCells=[],sinkCells=[],maxFlowAccumulationCells=0,outletCount=0,sinkCount=0;
    for(i=0;i<size;i++)if(validMask[i]){
      if(flowAccumulation[i]>maxFlowAccumulationCells)maxFlowAccumulationCells=flowAccumulation[i];
      if(flowTo[i]===-1){
        if(outletMask[i]){outletCount++;outletCells.push({index:i,row:Math.floor(i/cols),col:i%cols,accumulation:flowAccumulation[i]});}
        else {sinkCount++;sinkCells.push({index:i,row:Math.floor(i/cols),col:i%cols,accumulation:flowAccumulation[i]});}
      }
    }
    function rankCells(cells,limit){
      cells.sort(function(a,b){return b.accumulation-a.accumulation||a.index-b.index;});
      return cells.slice(0,limit);
    }
    var topFlowCells=[];
    for(i=0;i<size;i++)if(validMask[i])topFlowCells.push({index:i,row:Math.floor(i/cols),col:i%cols,accumulation:flowAccumulation[i]});
    topFlowCells=rankCells(topFlowCells,20);
    outletCells=rankCells(outletCells,100);
    sinkCells=rankCells(sinkCells,100);

    var rainfallResult=null;
    if(options.rainfall!==undefined&&options.rainfall!==null){
      var rain=options.rainfall;
      var intensity=positiveNumber(rain.intensityMmHr,'rainfall.intensityMmHr');
      var duration=positiveNumber(rain.durationMin,'rainfall.durationMin');
      var coefficient=rain.runoffCoefficient;
      if(!finiteNumber(coefficient)||coefficient<0||coefficient>1)fail('HYDROLOGY_INVALID_INPUT','rainfall.runoffCoefficient must be between 0 and 1.');
      var totalRainfall=intensity*duration/60;
      var providedArea=rain.catchmentAreaM2;
      var area=providedArea===undefined?validCellCount*cellSizeX*cellSizeY:positiveNumber(providedArea,'rainfall.catchmentAreaM2');
      rainfallResult={
        intensityMmHr:intensity,durationMin:duration,totalRainfallMm:totalRainfall,
        runoffCoefficient:coefficient,catchmentAreaM2:area,
        catchmentAreaSource:providedArea===undefined?'valid_grid_cell_estimate':'provided',
        rainfallVolumeM3:area*totalRainfall/1000,
        estimatedRunoffVolumeM3:area*totalRainfall/1000*coefficient,
        interpretation:'Indicative volume estimate using constant rainfall intensity and a user-supplied runoff coefficient; not a flood-depth or velocity prediction.'
      };
    }

    return {
      engine:'LithositeHydrology',version:VERSION,method:'D8',
      depressionTreatment:treatment,
      directionCodes:{N:1,NE:2,E:3,SE:4,S:5,SW:6,W:7,NW:8,NODATA:-1,SINK_OR_OUTLET:0},
      grid:{
        rows:rows,cols:cols,cellSizeX:cellSizeX,cellSizeY:cellSizeY,
        originX:finiteNumber(options.originX)?options.originX:null,
        originY:finiteNumber(options.originY)?options.originY:null,
        validCellCount:validCellCount,totalCellCount:size,validCellFraction:validCellCount/size
      },
      elevations:elevations,validMask:validMask,filledElevations:filledElevations,
      flowDirection:flowDirection,flowTo:flowTo,flowAccumulation:flowAccumulation,
      stats:{
        validCellCount:validCellCount,outletCount:outletCount,sinkCount:sinkCount,
        maxFlowAccumulationCells:maxFlowAccumulationCells,
        topFlowCells:topFlowCells,outletCells:outletCells,sinkCells:sinkCells,
        outletListTruncated:outletCount>outletCells.length,
        sinkListTruncated:sinkCount>sinkCells.length
      },
      rainfall:rainfallResult,warnings:warnings,
      limitations:[
        'D8 selects one steepest downslope neighbour per cell and does not simulate water depth or velocity.',
        'FILL raises closed depressions to a spill surface and routes equal-level filled cells through a deterministic priority-flood parent tree.',
        'PRESERVE retains the supplied elevation surface; closed pits and flats may remain sinks.',
        'NoData-adjacent cells are treated as open analysis boundaries.',
        'TIN rasterization samples triangle planes at grid-cell centres; coarse resolution may omit small terrain features.'
      ]
    };
  };

  HydrologyEngine.prototype.analyzeTIN=function(mesh,settings){
    settings=settings||{};
    var grid=this.rasterizeTIN({
      rawXYZ:mesh&&mesh.rawXYZ,indices:mesh&&mesh.indices,bounds:mesh&&mesh.bounds,
      cellSizeM:settings.gridResolutionM===undefined?settings.cellSizeM:settings.gridResolutionM,
      maxGridCells:settings.maxGridCells,maxRasterSamples:settings.maxRasterSamples
    });
    var analysis=this.analyzeGrid({
      rows:grid.rows,cols:grid.cols,elevations:grid.elevations,validMask:grid.validMask,
      cellSizeM:grid.cellSizeM,originX:grid.originX,originY:grid.originY,
      depressionTreatment:settings.depressionTreatment||'FILL',rainfall:settings.rainfall
    });
    analysis.grid=Object.assign({},analysis.grid,{
      originX:grid.originX,originY:grid.originY,bounds:grid.bounds,
      rasterization:grid.rasterization,validCellFraction:grid.validCellFraction
    });
    return analysis;
  };

  global.LithositeHydrology={
    create:function(options){return new HydrologyEngine(options||{});},
    version:VERSION,
    limits:{maxGridCells:MAX_GRID_CELLS,maxTinVertices:MAX_TIN_VERTICES,maxTinTriangles:MAX_TIN_TRIANGLES,maxRasterSamples:MAX_RASTER_SAMPLES},
    directionNames:DIRECTION_NAMES.slice()
  };
})(window);
