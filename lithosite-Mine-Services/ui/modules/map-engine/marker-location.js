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

  var VALID_STATUS = ['ACTIVE','INACTIVE','REMOVED'];
  var markers = {};
  var sequence = 0;
  var visibility = {};

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

  function removeMarker(markerId){
    var id=String(markerId||'').trim();
    if(!markers[id])return false;
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

  function setMarkerVisibility(type, visible){
    var normalized=normalizeType(type);
    visibility[normalized]=!!visible;
    return visibility[normalized];
  }

  function getMarkerVisibility(type){
    var normalized=normalizeType(type);
    return visibility[normalized];
  }

  function getVisibleMarkers(){
    return listMarkers().filter(function(marker){
      return visibility[marker.marker_type]===true && marker.status!=='REMOVED';
    });
  }

  function showAllMarkers(){
    TYPES.forEach(function(type){ visibility[type]=true; });
  }

  function hideAllMarkers(){
    TYPES.forEach(function(type){ visibility[type]=false; });
  }

  function clearMarkers(){
    markers={};
  }

  global.MineServicesMarkerLocation={
    TYPES:TYPES.slice(),
    createMarker:createMarker,
    updateMarker:updateMarker,
    removeMarker:removeMarker,
    getMarker:getMarker,
    listMarkers:listMarkers,
    getVisibleMarkers:getVisibleMarkers,
    setMarkerVisibility:setMarkerVisibility,
    getMarkerVisibility:getMarkerVisibility,
    showAllMarkers:showAllMarkers,
    hideAllMarkers:hideAllMarkers,
    clearMarkers:clearMarkers
  };
})(window);
