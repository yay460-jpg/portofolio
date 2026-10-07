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
    HSE:{label:'HSE',category:'HSE',visual_class:'marker-type-hse',visual_symbol:'⚠'},
    ASSET:{label:'Asset / Equipment',category:'Asset / Equipment',visual_class:'marker-type-asset',visual_symbol:'◆'},
    FACILITY:{label:'Facility',category:'Facility',visual_class:'marker-type-facility',visual_symbol:'⌂'},
    WORKFRONT:{label:'WorkFront',category:'WorkFront',visual_class:'marker-type-workfront',visual_symbol:'▦'},
    STOCKPILE:{label:'Stockpile',category:'Stockpile',visual_class:'marker-type-stockpile',visual_symbol:'▲'},
    DISPOSAL:{label:'Disposal',category:'Disposal',visual_class:'marker-type-disposal',visual_symbol:'▼'},
    DRAINAGE:{label:'Drainage',category:'Drainage',visual_class:'marker-type-drainage',visual_symbol:'≋'},
    WORKSHOP:{label:'Workshop',category:'Workshop',visual_class:'marker-type-workshop',visual_symbol:'⚙'},
    OTHER:{label:'Other',category:'Other',visual_class:'marker-type-other',visual_symbol:'•'}
  };

  var DOMAIN_LINK_DEFINITIONS = {
    HSE:'HSE',
    ASSET:'Equipment',
    WORKFRONT:'WorkFront'
  };
  var GLOBAL_SPATIAL_TYPES = ['FACILITY','WORKSHOP','STOCKPILE','DISPOSAL','DRAINAGE','OTHER'];

  var VALID_STATUS = ['ACTIVE','INACTIVE','REMOVED'];
  var MAX_ACTIVE_MARKERS_BY_TYPE = {
    HSE:5,
    ASSET:5,
    WORKFRONT:5,
    FACILITY:3,
    STOCKPILE:3,
    DISPOSAL:5,
    DRAINAGE:3,
    WORKSHOP:2,
    OTHER:3
  };
  var markers = {};
  var sequence = 0;
  var visibility = {};
  var selectedMarkerId = null;
  var ACTIVE_MARKER_STORAGE_KEY = 'lithosite-mine-services-active-markers-v1';
  var MARKER_PACKAGE_MAGIC = 'LITMARKR';
  var MARKER_PACKAGE_VERSION = 1;

  TYPES.forEach(function(type){ visibility[type]=true; });

  function bytesToBase64(buffer){
    var bytes=new Uint8Array(buffer),binary='',chunk=0x8000;
    for(var i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+chunk,bytes.length)));
    return btoa(binary);
  }

  function base64ToBytes(value){
    var binary=atob(value||''),bytes=new Uint8Array(binary.length);
    for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return bytes;
  }

  function buildMarkerPackageBytes(rows){
    var json=JSON.stringify({format:'LT-MARKER',version:MARKER_PACKAGE_VERSION,markers:rows});
    var body=new TextEncoder().encode(json);
    var payload=new Uint8Array(12+body.length);
    for(var i=0;i<8;i++)payload[i]=MARKER_PACKAGE_MAGIC.charCodeAt(i);
    new DataView(payload.buffer).setUint32(8,MARKER_PACKAGE_VERSION,true);
    payload.set(body,12);
    return payload;
  }

  function parseMarkerPackageBytes(bytes){
    if(!bytes||bytes.length<12)throw new Error('File is not a valid LT-MARKER package.');
    for(var i=0;i<8;i++)if(bytes[i]!==MARKER_PACKAGE_MAGIC.charCodeAt(i))throw new Error('File is not a valid LT-MARKER package.');
    var version=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(8,true);
    if(version!==MARKER_PACKAGE_VERSION)throw new Error('Unsupported LT-MARKER package version: '+version+'.');
    var json=new TextDecoder().decode(bytes.subarray(12));
    var document=JSON.parse(json);
    if(!document||document.format!=='LT-MARKER'||document.version!==MARKER_PACKAGE_VERSION||!Array.isArray(document.markers)){
      throw new Error('File is not a valid LT-MARKER package.');
    }
    return document.markers;
  }

  function validateMarkerCollection(rows){
    if(!Array.isArray(rows))throw new Error('Marker dataset must be an array.');
    var ids={},activeCounts={},sources={};
    rows.forEach(function(row){
      var marker=normalizeMarker(row);
      if(ids[marker.marker_id])throw new Error('Duplicate marker_id: '+marker.marker_id);
      ids[marker.marker_id]=true;
      activeCounts[marker.marker_type]=(activeCounts[marker.marker_type]||0)+(marker.status==='ACTIVE'?1:0);
      var limit=getMarkerLimit(marker.marker_type);
      if(activeCounts[marker.marker_type]>limit)throw new Error('Marker Location limit reached for '+marker.marker_type+': '+limit+' active spatial markers maximum');
      var def=getDomainLinkDefinition(marker.marker_type);
      if(def.link_mode==='DOMAIN_LINKED'){
        if(marker.source_entity!==def.source_entity||!marker.source_id)throw new Error(marker.marker_type+' marker requires '+def.source_entity+' source_entity and source_id');
        var sourceKey=marker.source_entity+'\\u0000'+marker.source_id;
        if(marker.status==='ACTIVE'&&sources[sourceKey])throw new Error('Spatial marker already assigned to '+marker.source_entity+' '+marker.source_id);
        if(marker.status==='ACTIVE')sources[sourceKey]=true;
      }else if(marker.source_entity||marker.source_id){
        throw new Error('Global spatial marker '+marker.marker_id+' must not contain source_entity or source_id');
      }
    });
    return rows.map(clone);
  }

  function updateSequenceFromMarkers(rows){
    var max=sequence;
    rows.forEach(function(row){
      var match=String(row.marker_id||'').match(/^ML-(\\d+)$/);
      if(match)max=Math.max(max,Number(match[1])||0);
    });
    sequence=max;
  }

  function persistActiveMarkers(){
    try{
      localStorage.setItem(ACTIVE_MARKER_STORAGE_KEY,JSON.stringify(listMarkers()));
      return true;
    }catch(error){return false;}
  }

  function clearActiveMarkerPersistence(){
    try{localStorage.removeItem(ACTIVE_MARKER_STORAGE_KEY);}catch(error){}
  }

  function restoreActiveMarkers(){
    try{
      var raw=localStorage.getItem(ACTIVE_MARKER_STORAGE_KEY);
      if(!raw)return false;
      var rows=JSON.parse(raw);
      rows=validateMarkerCollection(rows);
      var next={};
      rows.forEach(function(row){next[row.marker_id]=row;});
      markers=next;
      updateSequenceFromMarkers(rows);
      return true;
    }catch(error){
      clearActiveMarkerPersistence();
      return false;
    }
  }

  function replaceMarkers(rows){
    var validated=validateMarkerCollection(rows);
    var next={};
    validated.forEach(function(row){next[row.marker_id]=row;});
    markers=next;
    selectedMarkerId=null;
    updateSequenceFromMarkers(validated);
    persistActiveMarkers();
    return listMarkers();
  }

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
      category:definition.category,
      visual_class:definition.visual_class,
      visual_symbol:definition.visual_symbol
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
        category:definition.category,
        visual_class:definition.visual_class,
        visual_symbol:definition.visual_symbol
      };
    });
  }

  function isDomainLinkedType(type){
    var normalized=normalizeType(type);
    return !!DOMAIN_LINK_DEFINITIONS[normalized];
  }

  function isGlobalSpatialType(type){
    var normalized=normalizeType(type);
    return GLOBAL_SPATIAL_TYPES.indexOf(normalized)!==-1;
  }

  function getDomainLinkDefinition(type){
    var normalized=normalizeType(type);
    return {
      marker_type:normalized,
      source_entity:DOMAIN_LINK_DEFINITIONS[normalized]||'',
      link_mode:DOMAIN_LINK_DEFINITIONS[normalized]?'DOMAIN_LINKED':'GLOBAL_SPATIAL'
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

  function getActiveMarkerCount(markerType, excludeMarkerId){
    var type=normalizeType(markerType);
    var exclude=String(excludeMarkerId||'').trim();
    return Object.keys(markers).reduce(function(count,id){
      var marker=markers[id];
      if(id!==exclude && marker && marker.status==='ACTIVE' && marker.marker_type===type)return count+1;
      return count;
    },0);
  }

  function getMarkerLimit(markerType){
    var type=normalizeType(markerType);
    return MAX_ACTIVE_MARKERS_BY_TYPE[type];
  }

  function getMarkerCapacity(markerType){
    var type=normalizeType(markerType);
    var limit=getMarkerLimit(type);
    var active=getActiveMarkerCount(type);
    return {marker_type:type,active:active,limit:limit,available:Math.max(0,limit-active)};
  }

  function findActiveMarkerBySource(sourceEntity, sourceId, excludeMarkerId){
    var entity=String(sourceEntity||'').trim();
    var source=String(sourceId||'').trim();
    var exclude=String(excludeMarkerId||'').trim();
    if(!entity || !source)return null;
    var ids=Object.keys(markers);
    for(var i=0;i<ids.length;i++){
      var marker=markers[ids[i]];
      if(ids[i]!==exclude && marker && marker.status==='ACTIVE' && marker.source_entity===entity && marker.source_id===source)return marker;
    }
    return null;
  }

  function assertMarkerCapacity(marker, excludeMarkerId){
    if(marker.status!=='ACTIVE')return;
    var duplicate=findActiveMarkerBySource(marker.source_entity,marker.source_id,excludeMarkerId);
    if(duplicate){
      throw new Error('Spatial marker already assigned to '+marker.source_entity+' '+marker.source_id+' ('+duplicate.marker_id+')');
    }
    var active=getActiveMarkerCount(marker.marker_type,excludeMarkerId);
    var limit=getMarkerLimit(marker.marker_type);
    if(active>=limit){
      throw new Error('Marker Location limit reached for '+marker.marker_type+': '+limit+' active spatial markers maximum');
    }
  }

  function createMarker(input){
    var marker=normalizeMarker(input);
    if(markers[marker.marker_id])throw new Error('Marker already exists: '+marker.marker_id);
    assertMarkerCapacity(marker);
    markers[marker.marker_id]=marker;
    persistActiveMarkers();
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
    assertMarkerCapacity(next,id);
    markers[id]=next;
    persistActiveMarkers();
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

  function createDomainSpatialMarker(input){
    input=input||{};
    var entity=String(input.source_entity||'').trim();
    var sourceId=String(input.source_id||'').trim();
    if(!entity)throw new Error('Domain spatial marker requires source_entity');
    if(!sourceId)throw new Error('Domain spatial marker requires source_id');
    var markerType=normalizeType(input.marker_type);
    var expectedEntity=DOMAIN_LINK_DEFINITIONS[markerType];
    if(expectedEntity && entity!==expectedEntity){
      throw new Error('Marker source_entity does not match marker_type: '+markerType);
    }
    if(!isFiniteNumber(Number(input.easting))||!isFiniteNumber(Number(input.northing))||!isFiniteNumber(Number(input.elevation))){
      throw new Error('Domain spatial marker requires explicit finite easting, northing, and elevation');
    }
    return createMarker({
      marker_id:input.marker_id,
      marker_type:markerType,
      label:String(input.label||sourceId).trim(),
      easting:input.easting,
      northing:input.northing,
      elevation:input.elevation,
      source_entity:entity,
      source_id:sourceId,
      status:input.status
    });
  }

  function createHSESpatialMarker(input){
    input=input||{};
    var hseId=String(input.hse_id||'').trim();
    if(!hseId)throw new Error('HSE spatial marker requires hse_id');
    return createMarker({
      marker_id:input.marker_id,
      marker_type:'HSE',
      label:String(input.label||hseId).trim(),
      easting:input.easting,
      northing:input.northing,
      elevation:input.elevation,
      source_entity:'HSE',
      source_id:hseId,
      status:input.status
    });
  }

  function resolveDomainSpatialLink(markerId, domainRecords){
    var marker=getMarker(markerId);
    if(!marker)return {status:'MISSING_MARKER',marker_id:String(markerId||'').trim()};
    var entity=String(marker.source_entity||'').trim();
    var sourceId=String(marker.source_id||'').trim();
    if(!entity && !sourceId && isGlobalSpatialType(marker.marker_type)){
      return {
        status:'NOT_LINKED',
        marker_id:marker.marker_id,
        source_entity:'',
        source_id:'',
        marker:marker
      };
    }
    if(!entity || !sourceId){
      return {
        status:'ORPHAN',
        marker_id:marker.marker_id,
        source_entity:entity,
        source_id:sourceId,
        marker:marker
      };
    }
    if(!domainRecords || typeof domainRecords!=='object'){
      return {
        status:'UNVERIFIED',
        marker_id:marker.marker_id,
        source_entity:entity,
        source_id:sourceId,
        marker:marker
      };
    }
    var records=domainRecords[entity];
    if(!Array.isArray(records)){
      return {
        status:'UNVERIFIED',
        marker_id:marker.marker_id,
        source_entity:entity,
        source_id:sourceId,
        marker:marker
      };
    }
    var primaryKey=entity==='Equipment'?'equipment_id':
      entity==='WorkFront'?'work_front_id':
      entity==='HSE'?'hse_id':'id';
    var record=null;
    records.some(function(item){
      if(item && String(item[primaryKey]||'').trim()===sourceId){
        record=item;
        return true;
      }
      return false;
    });
    return record ? {
      status:'VALID',
      marker_id:marker.marker_id,
      source_entity:entity,
      source_id:sourceId,
      marker:marker,
      record:clone(record)
    } : {
      status:'BROKEN',
      marker_id:marker.marker_id,
      source_entity:entity,
      source_id:sourceId,
      marker:marker
    };
  }

  function buildDomainSpatialSyncPlan(markerId, domainRecords){
    var link=resolveDomainSpatialLink(markerId,domainRecords);
    var base={
      status:link.status,
      marker_id:link.marker_id,
      source_entity:link.source_entity,
      source_id:link.source_id,
      action:'NO_SPATIAL_MUTATION',
      coordinate_authority:'MapMarker',
      domain_authority:'DomainRecord'
    };
    if(link.marker)base.marker=link.marker;
    if(link.record)base.record=link.record;
    return base;
  }

  function listDomainSpatialLinkIssues(domainRecords){
    return listMarkers().map(function(marker){
      return resolveDomainSpatialLink(marker.marker_id,domainRecords);
    }).filter(function(result){
      return result.status==='ORPHAN' || result.status==='BROKEN';
    });
  }

  function showDomainRecordOnMap(sourceEntity, sourceId){
    var entity=String(sourceEntity||'').trim();
    var id=String(sourceId||'').trim();
    if(!entity || !id)return {ok:false,status:'INVALID_DOMAIN_REFERENCE',source_entity:entity,source_id:id};
    var matches=findMarkersBySource(entity,id);
    if(!matches.length){
      return {ok:false,status:'SPATIAL_LOCATION_NOT_ASSIGNED',source_entity:entity,source_id:id};
    }
    var marker=selectMarker(matches[0].marker_id);
    if(global.LithositeShellNavigation && typeof global.LithositeShellNavigation.setScreen==='function'){
      global.LithositeShellNavigation.setScreen('Dashboard');
    }
    var map=document.getElementById('dashboardSiteMap');
    if(map && typeof map.scrollIntoView==='function'){
      setTimeout(function(){
        map.scrollIntoView({behavior:'smooth',block:'center'});
        document.dispatchEvent(new CustomEvent('mine-services:focus-marker',{detail:{marker:marker}}));
      },40);
    }else{
      document.dispatchEvent(new CustomEvent('mine-services:focus-marker',{detail:{marker:marker}}));
    }
    return {ok:true,status:'SHOWN_ON_MAP',source_entity:entity,source_id:id,marker:marker};
  }

  function findMarkersBySource(sourceEntity, sourceId){
    var entity=String(sourceEntity||'').trim();
    var source=String(sourceId||'').trim();
    if(!entity || !source)return [];
    return listMarkers().filter(function(marker){
      return marker.source_entity===entity && marker.source_id===source;
    });
  }

  function listHSESpatialMarkers(hseId){
    return findMarkersBySource('HSE',hseId);
  }

  function removeMarker(markerId){
    var id=String(markerId||'').trim();
    if(!markers[id])return false;
    if(selectedMarkerId===id)selectedMarkerId=null;
    delete markers[id];
    persistActiveMarkers();
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

  function ensureDomainPopup(container){
    if(!container)return null;
    var popup=container.querySelector('.map-marker-domain-popup');
    if(popup)return popup;
    popup=document.createElement('div');
    popup.className='map-marker-domain-popup';
    popup.hidden=true;
    popup.innerHTML='<div class="map-marker-domain-popup__head"><strong class="map-marker-domain-popup__title"></strong><button type="button" class="map-marker-domain-popup__close" aria-label="Close marker details">×</button></div><div class="map-marker-domain-popup__body"><div class="map-marker-domain-popup__meta"></div><button type="button" class="control mini map-marker-domain-popup__open">Open Record</button></div>';
    popup.querySelector('.map-marker-domain-popup__close').addEventListener('click',function(){
      popup.hidden=true;
    });
    popup.querySelector('.map-marker-domain-popup__open').addEventListener('click',function(){
      var entity=popup.dataset.sourceEntity||'';
      var sourceId=popup.dataset.sourceId||'';
      if(!entity||!sourceId)return;
      document.dispatchEvent(new CustomEvent('mine-services:open-domain-record',{
        detail:{source_entity:entity,source_id:sourceId}
      }));
    });
    container.appendChild(popup);
    return popup;
  }

  function showMarkerDomainPopup(marker, container){
    if(!marker||!container)return null;
    var popup=ensureDomainPopup(container);
    if(!popup)return null;
    var definition=getMarkerTypeDefinition(marker.marker_type);
    popup.dataset.sourceEntity=marker.source_entity||'';
    popup.dataset.sourceId=marker.source_id||'';
    popup.querySelector('.map-marker-domain-popup__title').textContent=marker.label||marker.marker_id;
    popup.querySelector('.map-marker-domain-popup__meta').textContent=(definition.label||marker.marker_type)+' · '+(marker.source_entity||'MapMarker')+' · '+(marker.source_id||'No domain reference');
    popup.querySelector('.map-marker-domain-popup__open').hidden=!(marker.source_entity&&marker.source_id);
    popup.hidden=false;
    return popup;
  }

  function positionDomainPopup(engine, container){
    if(!engine||!container)return;
    var popup=container.querySelector('.map-marker-domain-popup');
    if(!popup||popup.hidden||!selectedMarkerId)return;
    var marker=markers[selectedMarkerId];
    if(!marker)return;
    var projected=engine.projectCoordinate(marker.easting,marker.northing,marker.elevation);
    if(!projected||!projected.inside){popup.hidden=true;return;}
    popup.style.left=Math.min(Math.max(projected.x+14,8),Math.max(8,container.clientWidth-popup.offsetWidth-8))+'px';
    popup.style.top=Math.min(Math.max(projected.y+14,8),Math.max(8,container.clientHeight-popup.offsetHeight-8))+'px';
  }

  function handleMarkerClick(markerElement){
    if(!markerElement)return null;
    var id=markerElement.getAttribute('data-marker-id');
    if(!id)return null;
    var marker=selectMarker(id);
    var container=markerElement.closest('#dashboardSiteMap')||markerElement.parentElement;
    showMarkerDomainPopup(marker,container);
    return marker;
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
    clearActiveMarkerPersistence();
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
      var typeDefinition=getMarkerTypeDefinition(marker.marker_type);
      var icon=el.querySelector('.map-location-marker__icon');
      var label=el.querySelector('.map-location-marker__label');
      if(!icon){
        icon=document.createElement('span');
        icon.className='map-location-marker__icon';
        icon.setAttribute('aria-hidden','true');
        el.appendChild(icon);
      }
      if(!label){
        label=document.createElement('span');
        label.className='map-location-marker__label';
        el.appendChild(label);
      }
      icon.textContent=typeDefinition.visual_symbol;
      label.textContent=marker.label;
      el.dataset.markerType=marker.marker_type;
      el.dataset.markerCategory=typeDefinition.category;
      el.dataset.markerVisual=typeDefinition.visual_class;
      TYPES.forEach(function(type){
        var visualClass=TYPE_DEFINITIONS[type].visual_class;
        el.classList.toggle(visualClass,visualClass===typeDefinition.visual_class);
      });
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

    positionDomainPopup(engine,container);
    return active.map(function(marker){return marker.marker_id;});
  }


  function refreshMarkerLocationUI(){
    var panel=document.getElementById('markerLocationPanel');if(!panel)return;
    var list=panel.querySelector('.marker-location-list'),count=panel.querySelector('.marker-location-count'),rows=listMarkers();
    if(count)count.textContent=rows.length+' marker'+(rows.length===1?'':'s');if(!list)return;
    if(!rows.length){list.innerHTML='<div class="marker-location-empty">Belum ada marker. Gunakan <b>Pick on Map</b> atau isi koordinat eksplisit.</div>';return;}
    list.innerHTML=rows.map(function(marker){var def=getMarkerTypeDefinition(marker.marker_type);return '<div class="marker-location-row" data-marker-id="'+String(marker.marker_id).replace(/"/g,'&quot;')+'"><span class="marker-location-row__icon '+def.visual_class+'">'+def.visual_symbol+'</span><span class="marker-location-row__main"><b>'+String(marker.label||marker.marker_id).replace(/[&<>"']/g,'')+'</b><small>'+def.label+' · '+String(marker.source_id||'No source').replace(/[&<>"']/g,'')+'</small></span><button type="button" class="control mini marker-location-show" data-marker-id="'+String(marker.marker_id).replace(/"/g,'&quot;')+'">Show</button></div>';}).join('');
  }
  function syncMarkerLocationSourceEntity(){
    var typeEl=document.getElementById('markerLocationType'),entityEl=document.getElementById('markerLocationSourceEntity'),sourceEl=document.getElementById('markerLocationSourceId'),labelEl=document.getElementById('markerLocationLabel');if(!typeEl||!entityEl||!sourceEl||!labelEl)return;
    var def=getDomainLinkDefinition(typeEl.value);
    entityEl.value=def.link_mode==='GLOBAL_SPATIAL'?'Global Spatial':def.source_entity;
    sourceEl.disabled=def.link_mode==='GLOBAL_SPATIAL';
    if(def.link_mode==='GLOBAL_SPATIAL'){
      sourceEl.innerHTML='<option value="">Not required for global spatial marker</option>';
      labelEl.readOnly=false;
    }
  }
  function sourceRecordKey(entity){
    return entity==='Equipment'?'equipment_id':entity==='WorkFront'?'work_front_id':entity==='HSE'?'hse_id':'id';
  }
  function sourceRecordLabel(entity,row){
    if(!row)return '';
    if(entity==='Equipment')return String(row.unit_no||row.equipment_id||'').trim();
    if(entity==='WorkFront')return String(row.location||row.work_front_id||'').trim();
    if(entity==='HSE')return String(row.event_type||row.domain||row.hse_id||'').trim();
    return String(row.name||row.label||row.id||'').trim();
  }
  async function loadMarkerLocationSources(){
    var typeEl=document.getElementById('markerLocationType'),entityEl=document.getElementById('markerLocationSourceEntity'),sourceEl=document.getElementById('markerLocationSourceId'),labelEl=document.getElementById('markerLocationLabel');
    if(!typeEl||!entityEl||!sourceEl||!labelEl)return;
    var entity=entityEl.value;
    var def=getDomainLinkDefinition(typeEl.value);
    labelEl.value='';
    if(def.link_mode==='GLOBAL_SPATIAL'){
      sourceEl.innerHTML='<option value="">Not required for global spatial marker</option>';
      sourceEl.disabled=true;
      labelEl.readOnly=false;
      return;
    }
    sourceEl.innerHTML='<option value="">Loading source records…</option>';
    sourceEl.disabled=true;
    var key=sourceRecordKey(entity);
    if(!global.LithositeRuntimeClient || !['Equipment','WorkFront','HSE'].includes(entity)){
      sourceEl.innerHTML='<option value="">Source records unavailable</option>';
      sourceEl.disabled=false;
      labelEl.readOnly=false;
      return;
    }
    try{
      var result=await global.LithositeRuntimeClient.request({operation:'READ',entity:entity});
      var rows=Array.isArray(result.data)?result.data:[];
      var available=rows.filter(function(row){return row&&String(row[key]||'').trim();});
      sourceEl.innerHTML='<option value="">Select '+entity+' record</option>'+available.map(function(row){var id=String(row[key]).trim();var desc=sourceRecordLabel(entity,row);return '<option value="'+id.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" data-label="'+desc.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">'+id.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+(desc?' · '+desc.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'):'')+'</option>';}).join('');
      sourceEl.disabled=false;
      labelEl.readOnly=true;
      sourceEl.onchange=function(){var opt=sourceEl.options[sourceEl.selectedIndex];labelEl.value=opt&&opt.value?(opt.dataset.label||opt.value):'';};
    }catch(error){
      sourceEl.innerHTML='<option value="">Source records unavailable</option>';
      sourceEl.disabled=false;
      labelEl.readOnly=false;
      setMarkerLocationPanelMessage('Source records unavailable: '+(error&&error.message?error.message:'Runtime error')+'.',true);
    }
  }
  function setMarkerLocationPanelMessage(message,error){
    var el=document.querySelector('#markerLocationPanel .marker-location-message');if(!el)return;
    el.textContent=message||'';el.classList.toggle('error',!!error);
  }
  function renderMarkerLocationNow(){
    var host=document.getElementById('dashboardSiteMap'),topo=global.MineServicesTopo3D,engine=topo&&typeof topo.getEngine==='function'?topo.getEngine():null;
    if(engine&&host)renderMarkers(engine,host);refreshMarkerLocationUI();
  }
  function showMarkerLocationNotice(message,error){
    var host=document.getElementById('dashboardSiteMap');if(!host)return;
    var existing=host.querySelector('#markerLocationNotice');if(existing)existing.remove();
    var notice=document.createElement('div');notice.id='markerLocationNotice';
    notice.style.cssText='position:absolute;top:12px;left:12px;z-index:70;max-width:360px;padding:10px 13px;border:1px solid '+(error?'rgba(248,113,113,.5)':'rgba(74,222,128,.45)')+';border-radius:8px;background:'+(error?'rgba(69,10,10,.94)':'rgba(5,46,22,.94)')+';color:#ecfdf5;box-shadow:0 10px 24px rgba(0,0,0,.35);font:600 12px Segoe UI,Arial,sans-serif;line-height:1.45;';
    notice.textContent=message;host.appendChild(notice);setTimeout(function(){if(notice.parentNode)notice.remove();},4500);
  }

  async function backupMarkerLocations(){
    try{
      var rows=listMarkers();
      if(!rows.length)throw new Error('Add at least one marker before creating a backup.');
      var bytes=buildMarkerPackageBytes(rows);
      var result=await global.LithositeRuntimeClient.request({
        operation:'SAVE_MARKER_LOCATION_BACKUP',
        package_base64:bytesToBase64(bytes.buffer),
        filename:'Lithosite_MarkerLocation',
        source:'Mine-Services-Marker-Location'
      });
      if(result.status!=='SAVED')throw new Error('Marker Location backup rejected');
      showMarkerLocationNotice('Success — marker locations have been backed up.',false);
      setMarkerLocationPanelMessage('Marker Location backup saved · '+String(result.storage_used||1)+' / '+String(result.storage_max||5)+' stored.',false);
      return result;
    }catch(error){
      showMarkerLocationNotice(error&&error.message?error.message:'Marker Location backup failed.',true);
      setMarkerLocationPanelMessage(error&&error.message?error.message:'Marker Location backup failed.',true);
      return null;
    }
  }

  async function openMarkerLocationBackupPanel(){
    var panel=document.getElementById('markerLocationBackupPanel');
    if(!panel||!global.LithositeRuntimeClient)return;
    var list=panel.querySelector('#markerLocationBackupList'),storage=panel.querySelector('#markerLocationBackupStorage'),restore=panel.querySelector('#markerLocationBackupRestore');
    panel.hidden=false;list.textContent='Loading backups…';storage.textContent='Checking Marker Location storage…';
    try{
      var result=await global.LithositeRuntimeClient.request({operation:'LIST_MARKER_LOCATION_BACKUPS'});
      var backups=Array.isArray(result.backups)?result.backups:[],max=Math.max(1,Number(result.max_backups)||5),used=Math.min(backups.length,Number(result.storage_used)||backups.length);
      storage.innerHTML='<div style="font-weight:650;white-space:nowrap">Marker Location Backup Storage · '+used+' / '+max+' backups used</div><div style="margin-top:3px;color:#8fa7bf;font-size:9px">'+(used<max?used+' backup'+(used===1?'':'s')+' stored.':'Storage full — saving a new backup will automatically remove the oldest backup.')+'</div>';
      if(!backups.length){list.textContent='No Marker Location backups yet.';restore.disabled=true;return;}
      restore.disabled=false;
      list.innerHTML='<label style="display:block;margin-bottom:4px;color:#93c5fd">Select backup</label><select id="markerLocationBackupSelect" style="width:100%;height:30px;box-sizing:border-box;padding:0 8px;border-radius:6px;background:#071525;color:#dbe8f5;border:1px solid #29415f;font:600 9px/28px Segoe UI,Arial,sans-serif">'+backups.map(function(item){var label=item.filename+' · '+(Number(item.size_bytes||0)/1048576).toFixed(2)+' MB';return '<option value="'+String(item.filename).replace(/"/g,'&quot;')+'">'+label+'</option>';}).join('')+'</select>';
    }catch(error){
      list.textContent=error&&error.message?error.message:'Backup list unavailable';storage.textContent='Marker Location Backup Storage · unavailable';restore.disabled=true;
    }
  }

  async function restoreMarkerLocations(){
    var panel=document.getElementById('markerLocationBackupPanel'),select=panel&&panel.querySelector('#markerLocationBackupSelect');
    if(!select||!select.value)return;
    try{
      var result=await global.LithositeRuntimeClient.request({operation:'LOAD_MARKER_LOCATION_BACKUP',filename:select.value});
      if(result.status!=='READY'||!result.data)throw new Error('Marker Location backup unavailable');
      var rows=parseMarkerPackageBytes(base64ToBytes(result.data));
      replaceMarkers(rows);
      renderMarkerLocationNow();
      showMarkerLocationNotice('Success — marker locations have been restored.',false);
      setMarkerLocationPanelMessage('Marker Location restored · '+rows.length+' marker'+(rows.length===1?'':'s')+'.',false);
      panel.hidden=true;
    }catch(error){
      showMarkerLocationNotice(error&&error.message?error.message:'Marker Location restore failed.',true);
      setMarkerLocationPanelMessage(error&&error.message?error.message:'Marker Location restore failed.',true);
    }
  }

  function clearMarkerLocations(){
    clearMarkers();
    renderMarkerLocationNow();
    showMarkerLocationNotice('Marker locations cleared · pilih marker baru',false);
    setMarkerLocationPanelMessage('Marker locations cleared · pilih marker baru',false);
  }

  function bindMarkerLocationUI(){
    var host=document.getElementById('dashboardSiteMap'),panelHost=host&&host.closest('.panel'),toolbar=panelHost&&panelHost.querySelector('.topo3d-toolbar');
    if(!host||!toolbar||document.getElementById('markerLocationToggle'))return;
    var toggle=document.createElement('button');toggle.type='button';toggle.id='markerLocationToggle';toggle.textContent='Marker Location';toolbar.appendChild(toggle);
    var panel=document.createElement('section');panel.id='markerLocationPanel';panel.className='marker-location-panel';panel.hidden=true;
    panel.innerHTML='<div class="marker-location-panel__head"><div><strong>Marker Location</strong><small>Spatial reference &amp; domain link</small></div><button type="button" class="marker-location-close" aria-label="Close Marker Location">×</button></div><div class="marker-location-panel__body"><div class="marker-location-actions marker-location-backup-actions"><button type="button" class="control mini" id="markerLocationBackup">Backup</button><button type="button" class="control mini" id="markerLocationRestore">Restore</button><button type="button" class="control mini" id="markerLocationClear">Clear</button></div><div id="markerLocationBackupPanel" class="marker-location-backup-panel" hidden><div class="marker-location-backup-storage" id="markerLocationBackupStorage"></div><div id="markerLocationBackupList"></div><div class="marker-location-backup-policy">Maximum 5 backups. When a new backup is saved while storage is full, the oldest backup is automatically deleted.</div><div class="marker-location-backup-actions"><button type="button" class="topo3d-modal-button" id="markerLocationBackupClose">Close</button><button type="button" class="topo3d-modal-button primary" id="markerLocationBackupRestore">Restore Selected</button></div></div><div class="marker-location-fields"><label>Marker Type<select id="markerLocationType"></select></label><label>Source Entity<input id="markerLocationSourceEntity" type="text" readonly></label><label>Source ID<select id="markerLocationSourceId"><option value="">Select source record</option></select></label><label>Label<input id="markerLocationLabel" type="text" placeholder="Marker label"></label><label>Marker ID<input id="markerLocationId" type="text" placeholder="Optional · auto ML-xxxx"></label><label>Easting<input id="markerLocationEasting" type="number" step="any" placeholder="Easting"></label><label>Northing<input id="markerLocationNorthing" type="number" step="any" placeholder="Northing"></label><label>Elevation<input id="markerLocationElevation" type="number" step="any" placeholder="Elevation"></label></div><div class="marker-location-actions"><button type="button" class="control mini" id="markerLocationPick">Pick on Map</button><button type="button" class="control mini primary" id="markerLocationCreate">Add Marker</button></div><div class="marker-location-message">Pick on Map switches to Top View before coordinate picking.</div></div>';
    host.appendChild(panel);
    panel.querySelector('#markerLocationBackup').addEventListener('click',backupMarkerLocations);
    panel.querySelector('#markerLocationRestore').addEventListener('click',openMarkerLocationBackupPanel);
    panel.querySelector('#markerLocationClear').addEventListener('click',clearMarkerLocations);
    panel.querySelector('#markerLocationBackupClose').addEventListener('click',function(){panel.querySelector('#markerLocationBackupPanel').hidden=true;});
    panel.querySelector('#markerLocationBackupRestore').addEventListener('click',restoreMarkerLocations);
    var typeEl=panel.querySelector('#markerLocationType');typeEl.innerHTML=TYPES.map(function(type){return '<option value="'+type+'">'+getMarkerTypeDefinition(type).label+'</option>';}).join('');syncMarkerLocationSourceEntity();
    function refreshMarkerLocationCapacityMessage(){
      var capacity=getMarkerCapacity(typeEl.value);
      setMarkerLocationPanelMessage(getMarkerTypeDefinition(typeEl.value).label+' spatial markers: '+capacity.active+'/'+capacity.limit+' active. '+(capacity.available?'Masih tersedia '+capacity.available+' slot.':'Batas tercapai; nonaktifkan/hapus marker spatial untuk membuat lokasi baru.'),capacity.available===0);
    }
    toggle.addEventListener('click',function(){panel.hidden=!panel.hidden;toggle.classList.toggle('is-active',!panel.hidden);if(!panel.hidden){refreshMarkerLocationUI();refreshMarkerLocationCapacityMessage();loadMarkerLocationSources();}});
    panel.querySelector('.marker-location-close').addEventListener('click',function(){panel.hidden=true;toggle.classList.remove('is-active');});
    typeEl.addEventListener('change',function(){syncMarkerLocationSourceEntity();refreshMarkerLocationCapacityMessage();loadMarkerLocationSources();});
    panel.querySelector('#markerLocationPick').addEventListener('click',function(){document.dispatchEvent(new CustomEvent('mine-services:marker-pick-request'));setMarkerLocationPanelMessage('Pick mode aktif · Top View. Klik satu titik pada terrain.',false);});
    panel.querySelector('#markerLocationCreate').addEventListener('click',function(){
      var type=typeEl.value,entity=panel.querySelector('#markerLocationSourceEntity').value.trim(),sourceId=panel.querySelector('#markerLocationSourceId').value.trim(),label=panel.querySelector('#markerLocationLabel').value.trim(),markerId=panel.querySelector('#markerLocationId').value.trim(),e=Number(panel.querySelector('#markerLocationEasting').value),n=Number(panel.querySelector('#markerLocationNorthing').value),z=Number(panel.querySelector('#markerLocationElevation').value);
      try{var def=getDomainLinkDefinition(type);var marker=def.link_mode==='DOMAIN_LINKED'?createDomainSpatialMarker({marker_id:markerId||undefined,marker_type:type,label:label||sourceId,easting:e,northing:n,elevation:z,source_entity:entity,source_id:sourceId,status:'ACTIVE'}):createMarker({marker_id:markerId||undefined,marker_type:type,label:label||markerId||getMarkerTypeDefinition(type).label,easting:e,northing:n,elevation:z,source_entity:'',source_id:'',status:'ACTIVE'});selectMarker(marker.marker_id);renderMarkerLocationNow();showMarkerDomainPopup(marker,host);setMarkerLocationPanelMessage('Marker '+marker.marker_id+' berhasil dibuat dan ditampilkan di Map.',false);}
      catch(error){setMarkerLocationPanelMessage(error&&error.message?error.message:'Gagal membuat marker.',true);}
    });
    document.addEventListener('mine-services:marker-coordinate-picked',function(event){var point=event&&event.detail;if(!point)return;panel.querySelector('#markerLocationEasting').value=Number(point.easting).toFixed(3);panel.querySelector('#markerLocationNorthing').value=Number(point.northing).toFixed(3);panel.querySelector('#markerLocationElevation').value=Number(point.elevation).toFixed(3);setMarkerLocationPanelMessage('Koordinat terrain terpilih · E '+Number(point.easting).toFixed(3)+' · N '+Number(point.northing).toFixed(3)+' · Z '+Number(point.elevation).toFixed(3),false);});
    refreshMarkerLocationUI();
  }
  function initMarkerLocationUI(){
    restoreActiveMarkers();
    if(typeof document==='undefined')return;
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindMarkerLocationUI);else bindMarkerLocationUI();
  }

  initMarkerLocationUI();

  global.MineServicesMarkerLocation={
    TYPES:TYPES.slice(),
    TYPE_DEFINITIONS:listMarkerTypeDefinitions(),
    DOMAIN_LINK_DEFINITIONS:listDomainLinkDefinitions(),
    getMarkerTypeDefinition:getMarkerTypeDefinition,
    listMarkerTypeDefinitions:listMarkerTypeDefinitions,
    getDomainLinkDefinition:getDomainLinkDefinition,
    listDomainLinkDefinitions:listDomainLinkDefinitions,
    isDomainLinkedType:isDomainLinkedType,
    isGlobalSpatialType:isGlobalSpatialType,
    createMarker:createMarker,
    createDomainSpatialMarker:createDomainSpatialMarker,
    createHSESpatialMarker:createHSESpatialMarker,
    findMarkersBySource:findMarkersBySource,
    showDomainRecordOnMap:showDomainRecordOnMap,
    listHSESpatialMarkers:listHSESpatialMarkers,
    placeMarker:placeMarker,
    setMarkerLocation:setMarkerLocation,
    updateMarker:updateMarker,
    setMarkerSource:setMarkerSource,
    getMarkerSource:getMarkerSource,
    resolveMarkerLink:resolveMarkerLink,
    resolveDomainSpatialLink:resolveDomainSpatialLink,
    listDomainSpatialLinkIssues:listDomainSpatialLinkIssues,
    buildDomainSpatialSyncPlan:buildDomainSpatialSyncPlan,
    removeMarker:removeMarker,
    getMarker:getMarker,
    listMarkers:listMarkers,
    getActiveMarkerCount:getActiveMarkerCount,
    getMarkerLimit:getMarkerLimit,
    getMarkerCapacity:getMarkerCapacity,
    findActiveMarkerBySource:findActiveMarkerBySource,
    selectMarker:selectMarker,
    clearSelectedMarker:clearSelectedMarker,
    getSelectedMarker:getSelectedMarker,
    handleMarkerClick:handleMarkerClick,
    showMarkerDomainPopup:showMarkerDomainPopup,
    positionDomainPopup:positionDomainPopup,
    getVisibleMarkers:getVisibleMarkers,
    setMarkerVisibility:setMarkerVisibility,
    getMarkerVisibility:getMarkerVisibility,
    getVisibilityState:getVisibilityState,
    setMarkerVisibilityFilter:setMarkerVisibilityFilter,
    showAllMarkers:showAllMarkers,
    hideAllMarkers:hideAllMarkers,
    clearMarkers:clearMarkers,
    replaceMarkers:replaceMarkers,
    exportMarkerPackage:function(){return buildMarkerPackageBytes(listMarkers());},
    importMarkerPackage:function(bytes){return replaceMarkers(parseMarkerPackageBytes(bytes));},
    persistActiveMarkers:persistActiveMarkers,
    restoreActiveMarkers:restoreActiveMarkers,
    renderMarkers:renderMarkers
  };
})(window);
