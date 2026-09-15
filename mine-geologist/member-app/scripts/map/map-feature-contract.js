/* MG1 V25.10.1 — MAP FEATURE CONTRACT
 * Semantic Feature only. No renderer, tile, GeoReference, or viewport ownership.
 */
(function (global) {
  'use strict';
  var SCHEMA_VERSION = 1;
  var TYPES = ['point', 'line', 'polygon', 'generic'];
  var ERR = Object.freeze({
    INVALID_INPUT:'INVALID_INPUT', INVALID_ID:'INVALID_ID', INVALID_LAYER_ID:'INVALID_LAYER_ID',
    INVALID_TYPE:'INVALID_TYPE', INVALID_GEOMETRY:'INVALID_GEOMETRY', INVALID_PROPERTIES:'INVALID_PROPERTIES',
    INVALID_SCHEMA_VERSION:'INVALID_SCHEMA_VERSION', NOT_FOUND:'NOT_FOUND', LAYER_NOT_FOUND:'LAYER_NOT_FOUND',
    LAYER_MISMATCH:'LAYER_MISMATCH', DUPLICATE_ID:'DUPLICATE_ID', FORBIDDEN_FIELD:'FORBIDDEN_FIELD',
    STORAGE_ERROR:'STORAGE_ERROR', TRANSACTION_ABORTED:'TRANSACTION_ABORTED'
  });
  var FORBIDDEN = Object.freeze(['layerId','layer','features','tiles','tilePyramid','imageDataUrl','geoReference','canvas','rendererState','activeBackgroundMapId','renderer']);
  function fail(code){ var e=new Error(code); e.code=code; return e; }
  function isObj(v){ return v && typeof v==='object' && !Array.isArray(v); }
  function clone(v){ return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function normalize(input){
    if (!isObj(input)) throw fail(ERR.INVALID_INPUT);
    if (typeof input.id !== 'string' || !input.id.trim()) throw fail(ERR.INVALID_ID);
    if (typeof input.layerId !== 'string' || !input.layerId.trim()) throw fail(ERR.INVALID_LAYER_ID);
    var type = input.type == null ? 'generic' : input.type;
    if (TYPES.indexOf(type) < 0) throw fail(ERR.INVALID_TYPE);
    if (input.geometry != null && !isObj(input.geometry)) throw fail(ERR.INVALID_GEOMETRY);
    if (input.properties != null && !isObj(input.properties)) throw fail(ERR.INVALID_PROPERTIES);
    var schemaVersion = input.schemaVersion == null ? SCHEMA_VERSION : input.schemaVersion;
    if (!Number.isInteger(schemaVersion) || schemaVersion < 1) throw fail(ERR.INVALID_SCHEMA_VERSION);
    return { id:input.id.trim(), layerId:input.layerId.trim(), type:type,
      geometry:clone(input.geometry == null ? null : input.geometry),
      properties:clone(input.properties == null ? {} : input.properties), schemaVersion:schemaVersion };
  }
  function validatePatch(patch){
    if (!isObj(patch)) throw fail(ERR.INVALID_INPUT);
    FORBIDDEN.forEach(function(k){ if (Object.prototype.hasOwnProperty.call(patch,k)) throw fail(ERR.FORBIDDEN_FIELD + ':' + k); });
  }
  global.MG1MapFeatureContract = Object.freeze({ SCHEMA_VERSION:SCHEMA_VERSION, types:TYPES, errors:ERR, forbiddenFields:FORBIDDEN, normalize:normalize, validatePatch:validatePatch });
})(typeof window !== 'undefined' ? window : globalThis);
