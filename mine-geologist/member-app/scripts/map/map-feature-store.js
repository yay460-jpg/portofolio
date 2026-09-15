/* MG1 V25.10.2 — MAP FEATURE STORE
 * Persistence boundary. Feature belongs to exactly one Layer.
 */
(function(global){
  'use strict';
  var FEATURE_STORE='features', LAYER_STORE='layers', SCHEMA_VERSION=1;
  var C=global.MG1MapFeatureContract;
  if(!C) throw new Error('MG1MapFeatureStore requires MG1MapFeatureContract');
  if(typeof global.openMapDb_!=='function') throw new Error('MG1MapFeatureStore requires openMapDb_ from map-package.js');
  function err(code,op,cause){var e=new Error(code);e.code=code;e.operation=op;if(cause)e.cause=cause;return e;}
  function reqP(r){return new Promise(function(res,rej){r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}})}
  function txP(tx,op){return new Promise(function(res,rej){var done=false;tx.oncomplete=function(){if(!done){done=true;res()}};tx.onabort=function(){if(!done){done=true;rej(err(C.errors.TRANSACTION_ABORTED,op,tx.error))}};tx.onerror=function(){if(!done&&tx.error){done=true;rej(err(C.errors.STORAGE_ERROR,op,tx.error))}}})}
  function normErr(e,op){return e&&e.code?e:err(C.errors.STORAGE_ERROR,op,e)}
  async function getFeature(id){try{var db=await global.openMapDb_(),tx=db.transaction(FEATURE_STORE,'readonly');return await reqP(tx.objectStore(FEATURE_STORE).get(id))}catch(e){throw normErr(e,'getFeature')}}
  async function getFeatures(layerId){try{var db=await global.openMapDb_(),tx=db.transaction(FEATURE_STORE,'readonly');var idx=tx.objectStore(FEATURE_STORE).index('layerId');var rows=await reqP(idx.getAll(layerId));return (rows||[]).sort(function(a,b){return String(a.id).localeCompare(String(b.id))})}catch(e){throw normErr(e,'getFeatures')}}
  async function createFeature(feature){var n=C.normalize(feature);try{var db=await global.openMapDb_(),tx=db.transaction([LAYER_STORE,FEATURE_STORE],'readwrite'),done=txP(tx,'createFeature'),layers=tx.objectStore(LAYER_STORE),features=tx.objectStore(FEATURE_STORE);if(!await reqP(layers.get(n.layerId))){try{tx.abort()}catch(_){ }throw err(C.errors.LAYER_NOT_FOUND,'createFeature')}if(await reqP(features.get(n.id))){try{tx.abort()}catch(_){ }throw err(C.errors.DUPLICATE_ID,'createFeature')}features.put(n);await done;return n}catch(e){throw normErr(e,'createFeature')}}
  async function updateFeature(id,patch){C.validatePatch(patch);try{var db=await global.openMapDb_(),tx=db.transaction(FEATURE_STORE,'readwrite'),done=txP(tx,'updateFeature'),store=tx.objectStore(FEATURE_STORE),cur=await reqP(store.get(id));if(!cur){try{tx.abort()}catch(_){ }throw err(C.errors.NOT_FOUND,'updateFeature')}var n=C.normalize(Object.assign({},cur,patch,{id:cur.id,layerId:cur.layerId,schemaVersion:SCHEMA_VERSION}));store.put(n);await done;return n}catch(e){throw normErr(e,'updateFeature')}}
  async function deleteFeature(id){try{var db=await global.openMapDb_(),tx=db.transaction(FEATURE_STORE,'readwrite'),done=txP(tx,'deleteFeature');tx.objectStore(FEATURE_STORE).delete(id);await done}catch(e){throw normErr(e,'deleteFeature')}}
  async function deleteFeaturesForLayer(layerId){try{var db=await global.openMapDb_(),tx=db.transaction(FEATURE_STORE,'readwrite'),done=txP(tx,'deleteFeaturesForLayer'),idx=tx.objectStore(FEATURE_STORE).index('layerId'),r=idx.openCursor(IDBKeyRange.only(layerId));r.onsuccess=function(){var c=r.result;if(!c)return;c.delete();c.continue()};await done}catch(e){throw normErr(e,'deleteFeaturesForLayer')}}
  global.MG1MapFeatureStore=Object.freeze({getFeature:getFeature,getFeatures:getFeatures,createFeature:createFeature,updateFeature:updateFeature,deleteFeature:deleteFeature,deleteFeaturesForLayer:deleteFeaturesForLayer});
})(typeof window!=='undefined'?window:globalThis);
