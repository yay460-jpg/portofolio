(function(global){
  'use strict';

  function mountSimulationPanel(panelHost,mapHost,toggleButton,onClose){
    var panel=document.createElement('section');
    panel.id='dashboardHydrologyPanel';panel.className='hydrology-panel hydrology-panel--docked';panel.hidden=true;
    panel.setAttribute('role','region');panel.setAttribute('aria-labelledby','hydrologyPanelTitle');panel.setAttribute('aria-hidden','true');
    panel.innerHTML='<header class="hydrology-panel__header"><div><div class="hydrology-panel__eyebrow">SITE MAP ANALYSIS</div><h2 id="hydrologyPanelTitle">Rainfall Simulation</h2></div><div class="hydrology-panel__header-actions"><button type="button" class="hydrology-panel__guide" id="hydrologyGuide" aria-label="Open Rainfall Simulation guide (PDF)" title="Rainfall Simulation Guide (PDF)">?</button><button type="button" class="hydrology-panel__close" id="hydrologyClose" aria-label="Close Rainfall Simulation" title="Close panel">×</button></div></header>'+
      '<div class="hydrology-panel__form">'+
      '<label class="hydrology-field hydrology-field--wide"><span>Scenario name</span><input id="hydrologyScenarioName" type="text" maxlength="120" value="Rainfall Scenario"></label>'+
      '<label class="hydrology-field"><span>Intensity (mm/hour)</span><input id="hydrologyIntensity" type="number" min="0.1" step="any" value="50"></label>'+
      '<label class="hydrology-field"><span>Duration (minutes)</span><input id="hydrologyDuration" type="number" min="0.1" step="any" value="60"></label>'+
      '<label class="hydrology-field"><span>Runoff coefficient</span><input id="hydrologyRunoffCoefficient" type="number" min="0" max="1" step="0.05" value="0.65"></label>'+
      '<label class="hydrology-field"><span>Grid resolution (m)</span><input id="hydrologyResolution" type="number" min="0.1" step="any" value="10"></label>'+
      '<label class="hydrology-field hydrology-field--wide"><span>Depression treatment</span><select id="hydrologyDepressionTreatment"><option value="FILL">Fill depressions (FILL)</option><option value="PRESERVE">Preserve depressions (PRESERVE)</option></select></label></div>'+
      '<p class="hydrology-panel__note">D8 estimates likely surface-flow paths. Optional particles illustrate direction only; they are not a physical water simulation. v1 does not predict flood depth, water velocity, or drainage capacity. Grid limit: 300,000 cells.</p>'+
      '<div class="hydrology-panel__actions"><button type="button" class="hydrology-action hydrology-action--primary" id="hydrologyRun">Run Analysis</button><button type="button" class="hydrology-action" id="hydrologySave" disabled>Save A3 Record</button></div>'+
      '<div id="hydrologyStatus" class="hydrology-panel__status" role="status" aria-live="polite">Load topography to begin.</div>'+
      '<div id="hydrologyResults" class="hydrology-panel__results" hidden>'+
      '<div class="hydrology-result"><span>Total rainfall</span><strong id="hydrologyTotalRainfall">—</strong></div>'+
      '<div class="hydrology-result"><span>Estimated runoff</span><strong id="hydrologyRunoffVolume">—</strong></div>'+
      '<div class="hydrology-result"><span>Analyzed grid</span><strong id="hydrologyGridSize">—</strong></div>'+
      '<div class="hydrology-result"><span>Max flow accumulation</span><strong id="hydrologyMaxAccumulation">—</strong></div>'+
      '<div class="hydrology-result"><span>Outlets / sinks</span><strong id="hydrologyOutletsSinks">—</strong></div>'+
      '<div id="hydrologyWarnings" class="hydrology-panel__warning" hidden></div>'+
      '<button type="button" class="hydrology-action hydrology-panel__overlay-toggle" id="hydrologyToggleOverlay" hidden>Hide Flow Paths</button>'+
      '<button type="button" class="hydrology-action hydrology-panel__overlay-toggle" id="hydrologyToggleParticles" hidden>Start Flow Animation</button></div>';
    panelHost.appendChild(panel);
    var runButton=panel.querySelector('#hydrologyRun'),saveButton=panel.querySelector('#hydrologySave');
    var status=panel.querySelector('#hydrologyStatus'),results=panel.querySelector('#hydrologyResults');
    var overlayToggle=panel.querySelector('#hydrologyToggleOverlay');
    var particlesToggle=panel.querySelector('#hydrologyToggleParticles');
    var lastRun=null,saved=false,flowOverlay=null;
    function panelStatus(message,kind){
      status.textContent=message;status.classList.remove('is-error','is-success');
      if(kind==='error')status.classList.add('is-error');if(kind==='success')status.classList.add('is-success');
    }
    function mapStatus(message,kind){
      var node=mapHost.querySelector('#dashboardTopo3DStatus');if(!node)return;
      node.textContent=message;node.classList.remove('error','ready');if(kind)node.classList.add(kind);
    }
    function positiveValue(id,label){
      var value=Number(panel.querySelector('#'+id).value);
      if(!Number.isFinite(value)||value<=0)throw new Error(label+' must be greater than zero.');
      return value;
    }
    function renderResult(run,overlayWarning){
      var result=run.result,rain=result.rainfall,stats=result.stats;
      panel.querySelector('#hydrologyTotalRainfall').textContent=rain.totalRainfallMm.toFixed(2)+' mm';
      panel.querySelector('#hydrologyRunoffVolume').textContent=rain.estimatedRunoffVolumeM3.toLocaleString('id-ID',{maximumFractionDigits:2})+' m³';
      panel.querySelector('#hydrologyGridSize').textContent=result.grid.rows+' × '+result.grid.cols+' · '+stats.validCellCount.toLocaleString('id-ID')+' cells';
      panel.querySelector('#hydrologyMaxAccumulation').textContent=stats.maxFlowAccumulationCells.toLocaleString('id-ID')+' cells';
      panel.querySelector('#hydrologyOutletsSinks').textContent=stats.outletCount.toLocaleString('id-ID')+' / '+stats.sinkCount.toLocaleString('id-ID');
      var warning=panel.querySelector('#hydrologyWarnings'),messages=(result.warnings||[]).slice();
      messages.push('Catchment area is estimated from valid grid cells unless a catchment boundary is supplied.');
      if(overlayWarning)messages.push(overlayWarning);
      warning.textContent=messages.join(' ');warning.hidden=messages.length===0;results.hidden=false;
    }
    async function runAnalysis(){
      runButton.disabled=true;saveButton.disabled=true;lastRun=null;saved=false;results.hidden=true;overlayToggle.hidden=true;particlesToggle.hidden=true;
      particlesToggle.textContent='Start Flow Animation';
      if(flowOverlay)flowOverlay.clear();
      panelStatus('Preparing terrain grid and routing D8 flow…');
      try{
        await new Promise(function(resolve){global.requestAnimationFrame(resolve);});
        if(!global.LithositeHydrology||typeof global.LithositeHydrology.create!=='function')throw new Error('Hydrology Engine is unavailable.');
        if(!global.MineServicesTopo3D||typeof global.MineServicesTopo3D.getAnalysisMesh!=='function')throw new Error('Topo3D analysis interface is unavailable.');
        if(!global.LithositeRuntimeClient||typeof global.LithositeRuntimeClient.request!=='function')throw new Error('RuntimeClient is unavailable.');
        var mesh=global.MineServicesTopo3D.getAnalysisMesh();
        var scenarioName=String(panel.querySelector('#hydrologyScenarioName').value||'').trim();
        if(!scenarioName)throw new Error('Scenario name is required.');
        var intensity=positiveValue('hydrologyIntensity','Rainfall intensity');
        var duration=positiveValue('hydrologyDuration','Rainfall duration');
        var coefficient=Number(panel.querySelector('#hydrologyRunoffCoefficient').value);
        if(!Number.isFinite(coefficient)||coefficient<0||coefficient>1)throw new Error('Runoff coefficient must be between 0 and 1.');
        var resolution=positiveValue('hydrologyResolution','Grid resolution');
        var treatment=panel.querySelector('#hydrologyDepressionTreatment').value;
        var result=global.LithositeHydrology.create().analyzeTIN(mesh,{
          gridResolutionM:resolution,depressionTreatment:treatment,
          rainfall:{intensityMmHr:intensity,durationMin:duration,runoffCoefficient:coefficient}
        });
        lastRun={
          simulationId:global.LithositeRuntimeClient.requestId('RS'),
          scenarioName:scenarioName.slice(0,120),
          topographyName:String(mesh.name||'Loaded Topography').slice(0,200),
          settings:{intensity:intensity,duration:duration,coefficient:coefficient,resolution:resolution,treatment:treatment},
          result:result
        };
        var overlayWarning='';
        try{
          if(!global.LithositeHydrologyOverlay||typeof global.LithositeHydrologyOverlay.create!=='function')throw new Error('Flow overlay module is unavailable.');
          if(!flowOverlay)flowOverlay=global.LithositeHydrologyOverlay.create({host:mapHost,topo:global.MineServicesTopo3D});
          var overlayStats=flowOverlay.setAnalysis(result);flowOverlay.setVisible(true);
          overlayToggle.textContent='Hide Flow Paths';overlayToggle.hidden=false;
          particlesToggle.textContent='Start Flow Animation';particlesToggle.hidden=!(overlayStats&&overlayStats.segmentCount>0);
        }catch(overlayError){overlayWarning='Flow overlay could not be drawn: '+(overlayError&&overlayError.message?overlayError.message:'unknown overlay error');}
        renderResult(lastRun,overlayWarning);saveButton.disabled=false;
        panelStatus(overlayWarning?'Analysis complete; summary is available, but flow overlay needs attention.':'Analysis complete · D8 flow paths are shown on the terrain.','success');
        mapStatus('Rainfall analysis complete · '+result.stats.validCellCount.toLocaleString('id-ID')+' cells analyzed.','ready');
      }catch(error){
        panelStatus(error&&error.message?error.message:'Rainfall analysis failed.','error');
        mapStatus(error&&error.message?error.message:'Rainfall analysis failed.','error');
      }finally{runButton.disabled=false;}
    }
    async function saveRecord(){
      if(!lastRun||saved)return;
      saveButton.disabled=true;panelStatus('Saving simulation record to A3…');
      try{
        var result=lastRun.result,settings=lastRun.settings,rain=result.rainfall;
        var summary={
          engine_version:result.version,method:result.method,rows:result.grid.rows,cols:result.grid.cols,
          valid_cell_count:result.stats.validCellCount,valid_cell_fraction:result.grid.validCellFraction,
          outlet_count:result.stats.outletCount,sink_count:result.stats.sinkCount,
          max_flow_accumulation_cells:result.stats.maxFlowAccumulationCells,top_flow_cells:result.stats.topFlowCells,
          rasterization:result.grid.rasterization||null,warnings:result.warnings||[],limitations:result.limitations||[]
        };
        var row={
          simulation_id:lastRun.simulationId,scenario_name:lastRun.scenarioName,status:'COMPLETED',
          topography_name:lastRun.topographyName,
          rainfall_intensity_mm_hr:settings.intensity,rainfall_duration_min:settings.duration,
          runoff_coefficient:settings.coefficient,grid_resolution_m:settings.resolution,
          flow_algorithm:'D8',depression_treatment:settings.treatment,
          catchment_area_m2:rain.catchmentAreaM2,total_rainfall_mm:rain.totalRainfallMm,
          estimated_runoff_volume_m3:rain.estimatedRunoffVolumeM3,
          max_flow_accumulation_cells:result.stats.maxFlowAccumulationCells,
          result_summary_json:JSON.stringify(summary),model_version:'hydrology-'+result.version,
          notes:'Indicative terrain-derived D8 flow only; no flood depth or water velocity calculated.'
        };
        var response=await global.LithositeRuntimeClient.request({
          operation:'CREATE',entity:'RainfallSimulation',row:row,
          request_id:global.LithositeRuntimeClient.requestId('rainfall-save')
        });
        if(!response||response.status!=='COMMITTED'){
          var message=response&&response.errors&&response.errors[0]&&response.errors[0].message;
          throw new Error(message||'Runtime did not commit the RainfallSimulation record.');
        }
        saved=true;panelStatus('Record saved to A3 · '+lastRun.simulationId,'success');
        mapStatus('Rainfall simulation record saved · '+lastRun.simulationId,'ready');
      }catch(error){
        saveButton.disabled=false;panelStatus(error&&error.message?error.message:'Could not save simulation record.','error');
      }
    }
    runButton.addEventListener('click',runAnalysis);saveButton.addEventListener('click',saveRecord);
    overlayToggle.addEventListener('click',function(){
      if(!flowOverlay)return;
      var show=!flowOverlay.isVisible();
      flowOverlay.setVisible(show);
      overlayToggle.textContent=show?'Hide Flow Paths':'Show Flow Paths';
    });
    particlesToggle.addEventListener('click',function(){
      if(!flowOverlay)return;
      var enable=!flowOverlay.isAnimationEnabled();
      var enabled=flowOverlay.setAnimationEnabled(enable);
      particlesToggle.textContent=enabled?'Stop Flow Animation':'Start Flow Animation';
      if(enable&&!enabled)panelStatus('Animation is unavailable in this browser.','error');
      else if(enabled)panelStatus('Directional particle animation enabled; this is not a physical water model.','success');
      else panelStatus('Directional particle animation stopped.');
    });
    var guideButton=panel.querySelector('#hydrologyGuide');
    var guideModal=document.getElementById('reportPdfReaderModal');
    var guideFrame=document.getElementById('reportPdfReaderFrame');
    var guideTitle=document.getElementById('reportPdfReaderTitle');
    var guideMeta=document.getElementById('reportPdfReaderMeta');
    var guideClose=document.getElementById('reportPdfReaderClose');
    var guideUrl='../../docs/lithosite/02_Mine-Services/10_User-Guides/Guide_Panel_Rainfall_Simulation.pdf';
    if(guideButton&&guideModal&&guideFrame&&guideTitle&&guideMeta&&guideClose){
      guideButton.addEventListener('click',function(){
        guideTitle.textContent='Rainfall Simulation Guide';
        guideMeta.textContent='PDF User Guide · Fit Width';
        guideModal.classList.remove('is-closing');
        guideModal.classList.add('show');
        guideModal.setAttribute('aria-hidden','false');
        guideFrame.src=guideUrl;
      });
    }else if(guideButton){
      guideButton.addEventListener('click',function(){
        panelStatus('Rainfall guide reader is unavailable. Reload the dashboard and try again.','error');
      });
    }
    panel.querySelector('#hydrologyClose').addEventListener('click',function(){
      if(typeof onClose==='function')onClose();
    });
    return panel;
  }

  function mountRainfallButton(){
    var mapHost=document.getElementById('dashboardSiteMap');
    var mapPanel=mapHost&&mapHost.closest('.panel');
    var toolbar=mapPanel&&mapPanel.querySelector('.topo3d-toolbar');
    var dashboardScreen=document.getElementById('dashboardScreen');
    var main=dashboardScreen&&dashboardScreen.querySelector('.main');
    var right=dashboardScreen&&dashboardScreen.querySelector('.right');
    if(!toolbar||toolbar.querySelector('#dashboardHydrologyRainfallToggle')||!main||!right||!mapHost)return;

    var button=document.createElement('button');
    button.type='button';
    button.id='dashboardHydrologyRainfallToggle';
    button.textContent='Rainfall';
    button.title='Open Rainfall analysis in the dashboard workspace';
    button.setAttribute('aria-label','Rainfall simulation');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-controls','dashboardHydrologyPanel');

    var dashboardCards=Array.prototype.filter.call(right.children,function(child){
      return child.classList&&child.classList.contains('panel');
    });
    var closeTimer=null;
    function setDashboardCardsUnavailable(unavailable){
      dashboardCards.forEach(function(card){
        card.inert=!!unavailable;
        if(unavailable)card.setAttribute('aria-hidden','true');
        else card.removeAttribute('aria-hidden');
      });
    }
    function reducedMotion(){
      return document.documentElement.classList.contains('reduced-motion')||
        !!(global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function finishClose(){
      closeTimer=null;
      if(main.classList.contains('is-rainfall-mode'))return;
      simulationPanel.hidden=true;
      setDashboardCardsUnavailable(false);
    }
    function closeRainfall(){
      if(!main.classList.contains('is-rainfall-mode'))return;
      main.classList.remove('is-rainfall-mode');
      button.setAttribute('aria-expanded','false');
      simulationPanel.setAttribute('aria-hidden','true');
      button.focus();
      if(closeTimer!==null)global.clearTimeout(closeTimer);
      closeTimer=global.setTimeout(finishClose,reducedMotion()?0:220);
    }
    function openRainfall(){
      if(closeTimer!==null){global.clearTimeout(closeTimer);closeTimer=null;}
      simulationPanel.hidden=false;
      simulationPanel.setAttribute('aria-hidden','false');
      // Establish the starting style before the CSS transition to the active layout.
      void simulationPanel.offsetWidth;
      setDashboardCardsUnavailable(true);
      main.classList.add('is-rainfall-mode');
      button.setAttribute('aria-expanded','true');
      var firstInput=simulationPanel.querySelector('#hydrologyScenarioName');
      if(firstInput)firstInput.focus();
    }

    var simulationPanel=mountSimulationPanel(right,mapHost,button,closeRainfall);
    button.addEventListener('click',function(){
      if(main.classList.contains('is-rainfall-mode'))closeRainfall();
      else openRainfall();
    });
    document.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&main.classList.contains('is-rainfall-mode')){
        event.preventDefault();
        closeRainfall();
      }
    });

    var markerLocation=toolbar.querySelector('#markerLocationToggle');
    if(markerLocation)markerLocation.insertAdjacentElement('afterend',button);
    else toolbar.appendChild(button);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mountRainfallButton);
  }else{
    mountRainfallButton();
  }
})(window);
