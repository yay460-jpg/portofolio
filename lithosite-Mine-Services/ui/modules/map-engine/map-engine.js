(function(global){
  'use strict';

  function initMapEngineHost(root, snapshot){
    if(!root) return null;

    if(snapshot && snapshot.model && Array.isArray(snapshot.model.features)){
      snapshot.model.features
        .filter(function(feature){ return feature.layerId === 'workfront'; })
        .forEach(function(feature){
          const marker=root.querySelector('[data-feature-id="' + feature.id + '"]');
          if(marker && feature.properties && feature.properties.name){
            marker.textContent=feature.id + ' · ' + feature.properties.name;
          }
        });
    }

    const zoomIn=root.querySelector('[data-map-action="zoom-in"]');
    const zoomOut=root.querySelector('[data-map-action="zoom-out"]');
    const target=root.querySelector('[data-map-action="target"]');

    [zoomIn,zoomOut,target].forEach(function(btn){
      if(!btn) return;
      btn.addEventListener('click',function(){
        root.dispatchEvent(new CustomEvent('lithosite:map-action',{
          detail:{action:btn.dataset.mapAction}
        }));
      });
    });

    root.addEventListener('click',function(event){
      const marker=event.target.closest('.ms-map-engine__marker');
      if(!marker) return;
      root.dispatchEvent(new CustomEvent('lithosite:map-feature-select',{
        detail:{featureId:marker.dataset.featureId}
      }));
    });

    root.dataset.engineReady=snapshot && snapshot.initialized ? 'true' : 'false';
    return root;
  }

  global.MineServicesMapEngineHost=Object.freeze({
    init:initMapEngineHost
  });
})(window);
