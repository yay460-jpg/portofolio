/* MG1 V25.10.3 — MAP FEATURE LIBRARY
 * Canonical semantic Feature business facade. Feature belongs to exactly one Layer.
 */
(function(global){
  'use strict';
  var C=global.MG1MapFeatureContract, S=global.MG1MapFeatureStore;
  if(!C) throw new Error('MG1MapFeatureLibrary requires MG1MapFeatureContract');
  if(!S) throw new Error('MG1MapFeatureLibrary requires MG1MapFeatureStore');
  function id(v,code){if(typeof v!=='string'||!v.trim()){var e=new Error(code);e.code=code;throw e}return v.trim()}
  async function getFeature(featureId){return S.getFeature(id(featureId,C.errors.INVALID_ID))}
  async function getFeatures(layerId){return S.getFeatures(id(layerId,C.errors.INVALID_LAYER_ID))}
  async function createFeature(layerId,input){
    layerId=id(layerId,C.errors.INVALID_LAYER_ID);
    if(!input||typeof input!=='object'||Array.isArray(input)){var e=new Error(C.errors.INVALID_INPUT);e.code=C.errors.INVALID_INPUT;throw e}
    var candidate=Object.assign({},input,{layerId:layerId});
    if(!candidate.id) candidate.id='feature_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
    return S.createFeature(C.normalize(candidate));
  }
  async function updateFeature(featureId,patch){return S.updateFeature(id(featureId,C.errors.INVALID_ID),patch)}
  async function deleteFeature(featureId){return S.deleteFeature(id(featureId,C.errors.INVALID_ID))}
  async function deleteFeaturesForLayer(layerId){return S.deleteFeaturesForLayer(id(layerId,C.errors.INVALID_LAYER_ID))}
  global.MG1MapFeatureLibrary=Object.freeze({version:'25.10-s01',getFeature:getFeature,getFeatures:getFeatures,createFeature:createFeature,updateFeature:updateFeature,deleteFeature:deleteFeature,deleteFeaturesForLayer:deleteFeaturesForLayer});
  console.log('[V25.10 MAP FEATURE] Library ready — persistence/business facade');
})(window);
