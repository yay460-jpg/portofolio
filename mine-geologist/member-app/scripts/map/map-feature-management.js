/* MG1 V25.12.2 — MAP FEATURE MANAGEMENT BRIDGE
 * UI-facing semantic Feature boundary. No DOM, IndexedDB, renderer, tile, or GeoReference ownership.
 */
(function (global) {
  'use strict';
  var C=global.MG1MapFeatureContract, L=global.MG1MapFeatureLibrary, Q=global.MG1MapFeatureCapability;
  if(!C) throw new Error('MG1MapFeatureManagement requires MG1MapFeatureContract');
  if(!L) throw new Error('MG1MapFeatureManagement requires MG1MapFeatureLibrary');
  if(!Q) throw new Error('MG1MapFeatureManagement requires MG1MapFeatureCapability');
  function id(v,code,op){if(typeof v!=='string'||!v.trim()){var e=new Error(code);e.code=code;e.operation=op;throw e}return v.trim()}
  async function list(layerId,options){return Q.list(id(layerId,C.errors.INVALID_LAYER_ID,'list'),options)}
  async function summary(layerId){return Q.summary(id(layerId,C.errors.INVALID_LAYER_ID,'summary'))}
  async function create(layerId,input){return L.createFeature(id(layerId,C.errors.INVALID_LAYER_ID,'create'),input)}
  async function update(featureId,patch){return L.updateFeature(id(featureId,C.errors.INVALID_ID,'update'),patch)}
  async function remove(featureId){return L.deleteFeature(id(featureId,C.errors.INVALID_ID,'remove'))}
  async function removeForLayer(layerId){return L.deleteFeaturesForLayer(id(layerId,C.errors.INVALID_LAYER_ID,'removeForLayer'))}
  global.MG1MapFeatureManagement=Object.freeze({version:'25.12-s01',list:list,summary:summary,create:create,update:update,remove:remove,removeForLayer:removeForLayer});
  console.log('[V25.12 MAP FEATURE] Management bridge ready — UI delegates to Feature Library');
})(window);
