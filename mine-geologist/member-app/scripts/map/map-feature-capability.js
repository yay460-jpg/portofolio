/* MG1 V25.12.1 — MAP FEATURE CAPABILITY
 * Read/query boundary for semantic Features. No renderer, tile, GeoReference, or UI ownership.
 */
(function (global) {
  'use strict';
  var C = global.MG1MapFeatureContract;
  var L = global.MG1MapFeatureLibrary;
  if (!C) throw new Error('MG1MapFeatureCapability requires MG1MapFeatureContract');
  if (!L) throw new Error('MG1MapFeatureCapability requires MG1MapFeatureLibrary');

  function requireId(v, code) {
    if (typeof v !== 'string' || !v.trim()) { var e = new Error(code); e.code = code; throw e; }
    return v.trim();
  }
  function q(v) { return String(v == null ? '' : v).trim().toLocaleLowerCase(); }
  function text(a,b) { return String(a || '').localeCompare(String(b || ''), 'id', {sensitivity:'base', numeric:true}); }
  function geometryKind(row) { return row && row.geometry && typeof row.geometry.type === 'string' ? row.geometry.type : ''; }
  function compare(a,b,sortBy) {
    var r;
    if (sortBy === 'type') r = text(a.type,b.type);
    else if (sortBy === 'geometry') r = text(geometryKind(a),geometryKind(b));
    else if (sortBy === 'schemaVersion') r = (Number(a.schemaVersion)||0) - (Number(b.schemaVersion)||0);
    else r = text(a.id,b.id);
    if (r) return r;
    return text(a.id,b.id);
  }
  async function list(layerId, options) {
    layerId = requireId(layerId, C.errors.INVALID_LAYER_ID);
    options = options || {};
    var rows = await L.getFeatures(layerId);
    var query = q(options.query);
    var type = options.type == null ? null : q(options.type);
    var geometry = options.geometryType == null ? null : q(options.geometryType);
    var filtered = rows.filter(function(row) {
      if (!row) return false;
      if (type !== null && q(row.type) !== type) return false;
      if (geometry !== null && q(geometryKind(row)) !== geometry) return false;
      if (query) {
        var hay = [row.id,row.type,geometryKind(row),JSON.stringify(row.properties || {})].map(q).join(' ');
        if (hay.indexOf(query) === -1) return false;
      }
      return true;
    });
    var sortBy = options.sortBy || 'id';
    if (['id','type','geometry','schemaVersion'].indexOf(sortBy) === -1) { var e = new Error(C.errors.INVALID_INPUT); e.code=C.errors.INVALID_INPUT; throw e; }
    var direction = options.direction || 'asc';
    if (direction !== 'asc' && direction !== 'desc') { var d = new Error(C.errors.INVALID_INPUT); d.code=C.errors.INVALID_INPUT; throw d; }
    filtered.sort(function(a,b){ var r=compare(a,b,sortBy); return direction==='desc' ? -r : r; });
    return filtered;
  }
  async function summary(layerId) {
    layerId = requireId(layerId, C.errors.INVALID_LAYER_ID);
    var rows = await L.getFeatures(layerId);
    var types = Object.create(null), geometries = Object.create(null);
    rows.forEach(function(row){
      if (!row) return;
      var t=q(row.type)||'generic'; types[t]=(types[t]||0)+1;
      var g=q(geometryKind(row))||'none'; geometries[g]=(geometries[g]||0)+1;
    });
    return {layerId:layerId,total:rows.length,types:types,geometries:geometries};
  }
  global.MG1MapFeatureCapability = Object.freeze({version:'25.12-s01',list:list,summary:summary});
  console.log('[V25.12 MAP FEATURE] Capability ready — query/filter/summary only');
})(window);
