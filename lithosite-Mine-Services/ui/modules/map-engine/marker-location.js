/* Lithosite Mine Services — Central marker location model. */
(function(global){
  'use strict';

  var TYPES = [
    'HSE',
    'ASSET',
    'FACILITY',
    'WORKFRONT',
    'STOCKPILE',
    'DISPOSAL',
    'DRAINAGE',
    'WORKSHOP',
    'OTHER'
  ];

  var TYPE_DEFINITIONS = {
    HSE:{label:'HSE',category:'HSE'},
    ASSET:{label:'Asset / Equipment',category:'Asset / Equipment'},
    FACILITY:{label:'Facility',category:'Facility'},
    WORKFRONT:{label:'WorkFront',category:'WorkFront'},
    STOCKPILE:{label:'Stockpile',category:'Stockpile'},
    DISPOSAL:{label:'Disposal',category:'Disposal'},
    DRAINAGE:{label:'Drainage',category:'Drainage'},
    WORKSHOP:{label:'Workshop',category:'Workshop'},
    OTHER:{label:'Other',category:'Other'}
  };

  var DOMAIN_LINK_DEFINITIONS = {
    HSE:'HSE',
    ASSET:'Equipment',
    WORKFRONT:'WorkFront',
    FACILITY:'Facility',
    STOCKPILE:'Stockpile',
    DISPOSAL:'Disposal',
    DRAINAGE:'Drainage',
    WORKSHOP:'Workshop',
    OTHER:'Other'
  };

  var VALID_STATUS = ['ACTIVE','INACTIVE','REMOVED'];
  var markers = {};
  var sequence = 0;
  var visibility = {};
  var selectedMarkerId = null;

  TYPES.forEach(function(type){ visibility[type]=true; });

  function isFiniteNumber(value){
    return typeof value==='number' && isFinite(value);
  }

  function isValidType(type){
    return TYPES.indexOf(String(type||'').toUpperCase())!==-1;
  }

  function normalizeType(type){
    var normalized=String(type||'OTHER').trim().toUpperCase();
    if(!isValidType(normalized))throw new Error('Invalid marker_type: '+normalized);
    return normalized;
  }

  function clone(marker){
    var copy={};
    Object.keys(marker).forEach(function(key){ copy[key]=marker[key]; });
    return copy;
  }

  function cloneDefinition(definition){
    return {
      label:definition.label,
      category:definition.category
    };
  }

  function getMarkerTypeDefinition(type){
    var normalized=normalizeType(type);
    return cloneDefinition(TYPE_DEFINITIONS[normalized]);
  }

  function listMarkerTypeDefinitions(){
    return TYPES.map(function(type){
      var definition=getMarkerTypeDefinition(type);
      return {
        marker_type:type,
        label:definition.label,
        category:definition.category
      };
    });
  }

  function getDomainLinkDefinition(type){
    var normalized=normalizeType(type);
    return {
      marker_type:normalized,
      source_entity:DOMAIN_LINK_DEFINITIONS[normalized]
    };
  }

  function listDomainLinkDefinitions(){
    return TYPES.map(function(type){
      return getDomainLinkDefinition(type);
    });
  }

  function nextId(){
    sequence+=1;
    return 'ML-'+String(sequence).padStart(4,'0');
  }

  function normalizeMarker(input){
    input=input||{};
    if(!isFiniteNumber(Number(input.easting))||!isFiniteNumber(Number(input.northing))||!isFiniteNumber(Number(input.elevation))){
      throw new Error('Marker coordinates must contain finite easting, northing, and elevation');
    }

    var markerId=String(input.marker_id||'').trim()||nextId();
    var status=String(input.status||'ACTIVE').trim().toUpperCase();
    if(VALID_STATUS.indexOf(status)===-1)throw new Error('Invalid marker status: '+status);

    return {
      marker_id:markerId,
      marker_type:normalizeType(input.marker_type),
      label:String(input.label||markerId).trim(),
      easting:Number(input.easting),
      northing:Number(input.northing),
      elevation:Number(input.elevation),
      source_entity:String(input.source_entity||'').trim(),
      source_id:String(input.source_id||'').trim(),
      status:status
    };
  }

  function setMarkerLocation(markerId,easting,northing,elevation){
    var id=String(markerId||'').trim();
    if(!markers[id])throw new Error('Marker not found: '+id);
    if(!isFiniteNumber(Number(easting))||!isFiniteNumber(Number(northing))||!isFiniteNumber(Number(elevation))){
      throw new Error('Marker location must contain finite easting, northing, and elevation');
    }
    return updateMarker(id,{
      easting:Number(easting),
      northing:Number(northing),
      elevation:Number(elevation)
    });
  }

  function placeMarker(input){
    return createMarker(input);
  }

  function createMarker(input){
    var marker=normalizeMarker(input);
    if(markers[marker.marker_id])throw new Error('Marker already exists: '+marker.marker_id);
    markers[marker.marker_id]=marker;
    return clone(marker);
  }

  function updateMarker(markerId, patch){
    var id=String(markerId||'').trim();
    if(!markers[id])throw new Error('Marker not found: '+id);
    var next=clone(markers[id]);
    patch=patch||{};
    Object.keys(patch).forEach(function(key){
      if(key!=='marker_id')next[key]=patch[key];
    });
    next=normalizeMarker(next);
    next.marker_id=id;
    markers[id]=next;
    return clone(next);
  }

  function setMarkerSource(markerId, sourceEntity, sourceId){
    var id=String(markerId||'').trim();
    if(!markers[id])throw new Error('Marker not found: '+id);
    var entity=String(sourceEntity||'').trim();
    var source=String(sourceId||'').trim();
    if(!entity || !source)throw new Error('Marker domain link requires source_entity and source_id');
    return updateMarker(id,{
      source_entity:entity,
      source_id:source
    });
  }

  function getMarkerSource(markerId){
    var marker=getMarker(markerId);
    if(!marker)return null;
    return {
      marker_id:marker.marker_id,
      marker_type:marker.marker_type,
      source_entity:marker.source_entity,
      source_id:marker.source_id
    };
  }

  function resolveMarkerLink(markerId){
    var link=getMarkerSource(markerId);
    if(!link || !link.source_entity || !link.source_id)return null;
    return link;
  }

  function removeMarker(markerId){
    var id=String(markerId||'').trim();
    if(!markers[id])return false;
    if(selectedMarkerId===id)selectedMarkerId=null;
    delete markers[id];
    return true;
  }

  function getMarker(markerId){
    var marker=markers[String(markerId||'').trim()];
    return marker?clone(marker):null;
  }

  function listMarkers(){
    return Object.keys(markers).map(function(id){ return clone(markers[id]); });
  }

  function selectMarker(markerId){
    var id=String(markerId||'').trim();
    if(!markers[id])throw new Error('Marker not found: '+id);
    if(markers[id].status==='REMOVED')throw new Error('Cannot select a removed marker: '+id);
    selectedMarkerId=id;
    return clone(markers[id]);
  }

  function clearSelectedMarker(){
    selectedMarkerId=null;
    return null;
  }

  function getSelectedMarker(){
    return selectedMarkerId?getMarker(selectedMarkerId):null;
  }

  function handleMarkerClick(markerElement){
    if(!markerElement)return null;
    var id=markerElement.getAttribute('data-marker-id');
    if(!id)return null;
    return selectMarker(id);
  }

  function setMarkerVisibility(type, visible){
    var normalized=normalizeType(type);
    visibility[normalized]=!!visible;
    if(selectedMarkerId){
      var selected=markers[selectedMarkerId];
      if(selected && visibility[selected.marker_type]!==true)selectedMarkerId=null;
    }
    return visibility[normalized];
  }

  function getMarkerVisibility(type){
    var normalized=normalizeType(type);
    return visibility[normalized];
  }

  function getVisibilityState(){
    var selected=[];
    TYPES.forEach(function(type){
      if(visibility[type]===true)selected.push(type);
    });
    return {
      all:selected.length===TYPES.length,
      none:selected.length===0,
      selected_types:selected
    };
  }

  function setMarkerVisibilityFilter(types){
    if(!Array.isArray(types))throw new Error('Marker visibility filter must be an array of marker types');
    var selected={};
    types.forEach(function(type){
      selected[normalizeType(type)]=true;
    });
    TYPES.forEach(function(type){
      visibility[type]=selected[type]===true;
    });
    if(selectedMarkerId){
      var selectedMarker=markers[selectedMarkerId];
      if(selectedMarker && visibility[selectedMarker.marker_type]!==true)selectedMarkerId=null;
    }
    return getVisibilityState();
  }

  function getVisibleMarkers(){
    return listMarkers().filter(function(marker){
      return visibility[marker.marker_type]===true && marker.status!=='REMOVED';
    });
  }

  function showAllMarkers(){
    TYPES.forEach(function(type){ visibility[type]=true; });
    return getVisibilityState();
  }

  function hideAllMarkers(){
    TYPES.forEach(function(type){ visibility[type]=false; });
    selectedMarkerId=null;
    return getVisibilityState();
  }

  function clearMarkers(){
    markers={};
    selectedMarkerId=null;
  }

  function ensureRenderLayer(container){
    if(!container)return null;
    var layer=container.querySelector('.map-marker-layer');
    if(layer)return layer;
    layer=document.createElement('div');
    layer.className='map-marker-layer';
    container.appendChild(layer);
    return layer;
  }

  function renderMarkers(engine, container){
    if(!engine||!container)return [];
    var layer=ensureRenderLayer(container);
    if(!layer)return [];

    var active=getVisibleMarkers();
    var activeIds={};
    active.forEach(function(marker){
      var projected=engine.projectCoordinate(marker.easting,marker.northing,marker.elevation);
      if(!projected||!projected.inside)return;
      activeIds[marker.marker_id]=true;

      var el=layer.querySelector('[data-marker-id="'+marker.marker_id.replace(/"/g,'&quot;')+'"]');
      if(!el){
        el=document.createElement('button');
        el.type='button';
        el.className='map-location-marker';
        el.setAttribute('data-marker-id',marker.marker_id);
        el.setAttribute('aria-label',marker.label);
        el.addEventListener('click',function(){ handleMarkerClick(el); });
        layer.appendChild(el);
      }
      el.textContent=marker.label;
      el.dataset.markerType=marker.marker_type;
      el.dataset.markerCategory=getMarkerTypeDefinition(marker.marker_type).category;
      el.classList.toggle('is-selected',selectedMarkerId===marker.marker_id);
      el.style.left=projected.x+'px';
      el.style.top=projected.y+'px';
      el.classList.add('is-visible');
    });

    Array.prototype.slice.call(layer.querySelectorAll('.map-location-marker')).forEach(function(el){
      var id=el.getAttribute('data-marker-id');
      if(!activeIds[id]){
        el.classList.remove('is-visible');
        el.classList.remove('is-selected');
      }
    });

    return active.map(function(marker){return marker.marker_id;});
  }

  global.MineServicesMarkerLocation={
    TYPES:TYPES.slice(),
    TYPE_DEFINITIONS:listMarkerTypeDefinitions(),
    DOMAIN_LINK_DEFINITIONS:listDomainLinkDefinitions(),
    getMarkerTypeDefinition:getMarkerTypeDefinition,
    listMarkerTypeDefinitions:listMarkerTypeDefinitions,
    getDomainLinkDefinition:getDomainLinkDefinition,
    listDomainLinkDefinitions:listDomainLinkDefinitions,
    createMarker:createMarker,
    placeMarker:placeMarker,
    setMarkerLocation:setMarkerLocation,
    updateMarker:updateMarker,
    setMarkerSource:setMarkerSource,
    getMarkerSource:getMarkerSource,
    resolveMarkerLink:resolveMarkerLink,
    removeMarker:removeMarker,
    getMarker:getMarker,
    listMarkers:listMarkers,
    selectMarker:selectMarker,
    clearSelectedMarker:clearSelectedMarker,
    getSelectedMarker:getSelectedMarker,
    handleMarkerClick:handleMarkerClick,
    getVisibleMarkers:getVisibleMarkers,
    setMarkerVisibility:setMarkerVisibility,
    getMarkerVisibility:getMarkerVisibility,
    getVisibilityState:getVisibilityState,
    setMarkerVisibilityFilter:setMarkerVisibilityFilter,
    showAllMarkers:showAllMarkers,
    hideAllMarkers:hideAllMarkers,
    clearMarkers:clearMarkers,
    renderMarkers:renderMarkers
  };
})(window);
