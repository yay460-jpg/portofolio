/* MG1 V25.2 — MAP LAYER STORE
 *
 * Persistence boundary for semantic Map Layers.
 * Depends on openMapDb_() from map-package.js and MG1MapLayerContract.
 * Does not own Map lifecycle, rendering, tiles, GeoReference, or UI.
 */
(function (global) {
  'use strict';

  var LAYER_STORE = 'layers';
  var LAYER_STATE_STORE = 'mapLayerState';
  var MAP_STORE = 'maps';
  var FEATURE_STORE = 'features';
  var SCHEMA_VERSION = 1;
  var C = global.MG1MapLayerContract;

  if (!C) throw new Error('MG1MapLayerStore requires MG1MapLayerContract');
  if (typeof global.openMapDb_ !== 'function') {
    throw new Error('MG1MapLayerStore requires openMapDb_ from map-package.js');
  }

  function storeError(code, operation, cause) {
    var error = new Error(code);
    error.code = code;
    error.operation = operation;
    if (cause) error.cause = cause;
    return error;
  }

  function requestPromise(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function transactionPromise(tx, operation) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      tx.oncomplete = function () {
        if (!settled) { settled = true; resolve(); }
      };
      tx.onabort = function () {
        if (!settled) { settled = true; reject(storeError(C.errors.TRANSACTION_ABORTED, operation, tx.error)); }
      };
      tx.onerror = function () {
        // The transaction will normally abort; keep a normalized error if it does not.
        if (tx.error && !settled) { settled = true; reject(storeError(C.errors.STORAGE_ERROR, operation, tx.error)); }
      };
    });
  }

  function normalizeStorageError(error, operation) {
    if (error && error.code) return error;
    return storeError(C.errors.STORAGE_ERROR, operation, error);
  }

  async function getLayer(id) {
    try {
      var db = await global.openMapDb_();
      var tx = db.transaction(LAYER_STORE, 'readonly');
      return await requestPromise(tx.objectStore(LAYER_STORE).get(id));
    } catch (e) {
      throw normalizeStorageError(e, 'getLayer');
    }
  }

  async function getLayers(mapId) {
    try {
      var db = await global.openMapDb_();
      var tx = db.transaction(LAYER_STORE, 'readonly');
      var index = tx.objectStore(LAYER_STORE).index('mapId');
      var rows = await requestPromise(index.getAll(mapId));
      return (rows || []).sort(function (a, b) {
        var ao = Number.isFinite(a.order) ? a.order : 0;
        var bo = Number.isFinite(b.order) ? b.order : 0;
        if (ao !== bo) return ao - bo;
        return String(a.id).localeCompare(String(b.id));
      });
    } catch (e) {
      throw normalizeStorageError(e, 'getLayers');
    }
  }

  async function createLayer(layer) {
    var normalized;
    try {
      normalized = C.normalize(layer);
    } catch (e) {
      throw e;
    }

    try {
      var db = await global.openMapDb_();
      var tx = db.transaction([MAP_STORE, LAYER_STORE], 'readwrite');
      var txDone = transactionPromise(tx, 'createLayer');
      var maps = tx.objectStore(MAP_STORE);
      var layers = tx.objectStore(LAYER_STORE);
      var map = await requestPromise(maps.get(normalized.mapId));
      if (!map) {
        try { tx.abort(); } catch (_) {}
        throw storeError(C.errors.MAP_NOT_FOUND, 'createLayer');
      }
      var existing = await requestPromise(layers.get(normalized.id));
      if (existing) {
        try { tx.abort(); } catch (_) {}
        throw storeError(C.errors.DUPLICATE_ID, 'createLayer');
      }
      layers.put(normalized);
      await txDone;
      return normalized;
    } catch (e) {
      throw normalizeStorageError(e, 'createLayer');
    }
  }

  async function updateLayer(id, patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw storeError(C.errors.INVALID_INPUT, 'updateLayer');
    }
    var forbidden = ['id', 'mapId', 'active', 'features', 'tiles', 'tilePyramid', 'imageDataUrl', 'geoReference', 'canvas', 'rendererState', 'activeBackgroundMapId'];
    for (var i = 0; i < forbidden.length; i++) {
      if (Object.prototype.hasOwnProperty.call(patch, forbidden[i])) {
        throw storeError(C.errors.FORBIDDEN_FIELD + ':' + forbidden[i], 'updateLayer');
      }
    }

    try {
      var db = await global.openMapDb_();
      var tx = db.transaction([LAYER_STORE, LAYER_STATE_STORE], 'readwrite');
      var txDone = transactionPromise(tx, 'updateLayer');
      var store = tx.objectStore(LAYER_STORE);
      var states = tx.objectStore(LAYER_STATE_STORE);
      var current = await requestPromise(store.get(id));
      if (!current) {
        try { tx.abort(); } catch (_) {}
        throw storeError(C.errors.NOT_FOUND, 'updateLayer');
      }
      var candidate = Object.assign({}, current, patch, { id: current.id, mapId: current.mapId, schemaVersion: SCHEMA_VERSION });
      var normalized = C.normalize(candidate);
      var state = await requestPromise(states.get(current.mapId));
      store.put(normalized);
      // Invariant: an ACTIVE Layer must always remain visible. Updating the
      // active Layer to hidden therefore clears activeLayerId atomically.
      if (normalized.visible === false && state && state.activeLayerId === current.id) {
        states.put({ mapId: current.mapId, activeLayerId: null, schemaVersion: SCHEMA_VERSION });
      }
      await txDone;
      return normalized;
    } catch (e) {
      throw normalizeStorageError(e, 'updateLayer');
    }
  }

  async function setVisibility(id, visible) {
    if (typeof visible !== 'boolean') throw storeError(C.errors.INVALID_VISIBLE, 'setVisibility');
    try {
      var db = await global.openMapDb_();
      var tx = db.transaction([LAYER_STORE, LAYER_STATE_STORE], 'readwrite');
      var txDone = transactionPromise(tx, 'setVisibility');
      var layers = tx.objectStore(LAYER_STORE);
      var states = tx.objectStore(LAYER_STATE_STORE);
      var current = await requestPromise(layers.get(id));
      if (!current) {
        try { tx.abort(); } catch (_) {}
        throw storeError(C.errors.NOT_FOUND, 'setVisibility');
      }
      var normalized = C.normalize(Object.assign({}, current, { visible: visible }));
      var state = await requestPromise(states.get(current.mapId));
      layers.put(normalized);
      // Invariant: an ACTIVE Layer must always remain visible. Hiding the
      // active Layer therefore atomically clears activeLayerId in the same tx.
      if (visible === false && state && state.activeLayerId === current.id) {
        states.put({ mapId: current.mapId, activeLayerId: null, schemaVersion: SCHEMA_VERSION });
      }
      await txDone;
      return normalized;
    } catch (e) {
      throw normalizeStorageError(e, 'setVisibility');
    }
  }

  async function getActiveLayer(mapId) {
    try {
      var db = await global.openMapDb_();
      var tx = db.transaction(LAYER_STATE_STORE, 'readonly');
      var state = await requestPromise(tx.objectStore(LAYER_STATE_STORE).get(mapId));
      return state && state.activeLayerId ? state.activeLayerId : null;
    } catch (e) {
      throw normalizeStorageError(e, 'getActiveLayer');
    }
  }

  async function setActiveLayer(mapId, layerId) {
    if (typeof mapId !== 'string' || !mapId.trim()) throw storeError(C.errors.INVALID_MAP_ID, 'setActiveLayer');
    if (layerId !== null && (typeof layerId !== 'string' || !layerId.trim())) {
      throw storeError(C.errors.INVALID_ID, 'setActiveLayer');
    }

    try {
      var db = await global.openMapDb_();
      var tx = db.transaction([LAYER_STORE, LAYER_STATE_STORE], 'readwrite');
      var txDone = transactionPromise(tx, 'setActiveLayer');
      var layers = tx.objectStore(LAYER_STORE);
      var states = tx.objectStore(LAYER_STATE_STORE);
      var state = { mapId: mapId, activeLayerId: layerId, schemaVersion: SCHEMA_VERSION };

      if (layerId !== null) {
        var layer = await requestPromise(layers.get(layerId));
        if (!layer) {
          try { tx.abort(); } catch (_) {}
          throw storeError(C.errors.NOT_FOUND, 'setActiveLayer');
        }
        if (layer.mapId !== mapId) {
          try { tx.abort(); } catch (_) {}
          throw storeError(C.errors.MAP_MISMATCH, 'setActiveLayer');
        }
        if (layer.visible !== true) {
          try { tx.abort(); } catch (_) {}
          throw storeError(C.errors.NOT_VISIBLE, 'setActiveLayer');
        }
      }

      states.put(state);
      await txDone;
      return layerId;
    } catch (e) {
      throw normalizeStorageError(e, 'setActiveLayer');
    }
  }

  async function deleteLayer(id) {
    try {
      var db = await global.openMapDb_();
      var stores = [LAYER_STORE, LAYER_STATE_STORE];
      if (db.objectStoreNames.contains(FEATURE_STORE)) stores.push(FEATURE_STORE);
      var tx = db.transaction(stores, 'readwrite');
      var txDone = transactionPromise(tx, 'deleteLayer');
      var layers = tx.objectStore(LAYER_STORE);
      var states = tx.objectStore(LAYER_STATE_STORE);
      var features = db.objectStoreNames.contains(FEATURE_STORE) ? tx.objectStore(FEATURE_STORE) : null;
      var layer = await requestPromise(layers.get(id));
      if (!layer) {
        try { tx.abort(); } catch (_) {}
        throw storeError(C.errors.NOT_FOUND, 'deleteLayer');
      }
      var state = await requestPromise(states.get(layer.mapId));
      layers.delete(id);
      if (features) {
        var featureIndex = features.index('layerId');
        var featureReq = featureIndex.openCursor(IDBKeyRange.only(id));
        featureReq.onsuccess = function () {
          var cursor = featureReq.result;
          if (!cursor) return;
          cursor.delete();
          cursor.continue();
        };
      }
      if (state && state.activeLayerId === id) {
        states.put({ mapId: layer.mapId, activeLayerId: null, schemaVersion: SCHEMA_VERSION });
      }
      await txDone;
      return true;
    } catch (e) {
      throw normalizeStorageError(e, 'deleteLayer');
    }
  }


  async function cloneLayersForMap(sourceMapId, targetMapId) {
    if (typeof sourceMapId !== 'string' || !sourceMapId.trim() ||
        typeof targetMapId !== 'string' || !targetMapId.trim()) {
      throw storeError(C.errors.INVALID_MAP_ID, 'cloneLayersForMap');
    }
    sourceMapId = sourceMapId.trim();
    targetMapId = targetMapId.trim();
    try {
      var db = await global.openMapDb_();
      var stores = [MAP_STORE, LAYER_STORE, LAYER_STATE_STORE];
      if (db.objectStoreNames.contains(FEATURE_STORE)) stores.push(FEATURE_STORE);
      var tx = db.transaction(stores, 'readwrite');
      var txDone = transactionPromise(tx, 'cloneLayersForMap');
      var maps = tx.objectStore(MAP_STORE);
      var layers = tx.objectStore(LAYER_STORE);
      var states = tx.objectStore(LAYER_STATE_STORE);
      var features = db.objectStoreNames.contains(FEATURE_STORE) ? tx.objectStore(FEATURE_STORE) : null;
      var sourceMap = await requestPromise(maps.get(sourceMapId));
      var targetMap = await requestPromise(maps.get(targetMapId));
      if (!sourceMap) { try { tx.abort(); } catch (_) {} throw storeError(C.errors.MAP_NOT_FOUND, 'cloneLayersForMap'); }
      if (!targetMap) { try { tx.abort(); } catch (_) {} throw storeError(C.errors.MAP_NOT_FOUND, 'cloneLayersForMap'); }
      var sourceLayers = await requestPromise(layers.index('mapId').getAll(sourceMapId));
      var layerIdMap = {};
      (sourceLayers || []).forEach(function (source) {
        var newId = 'layer_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
        while (layerIdMap[newId]) newId = 'layer_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
        layerIdMap[String(source.id)] = newId;
        var copy = C.normalize(Object.assign({}, source, { id: newId, mapId: targetMapId }));
        layers.add(copy);
      });
      if (features) {
        var featureIndex = features.index('layerId');
        for (var si = 0; si < (sourceLayers || []).length; si++) {
          var sourceLayer = sourceLayers[si];
          var sourceFeatures = await requestPromise(featureIndex.getAll(sourceLayer.id));
          var targetLayerId = layerIdMap[String(sourceLayer.id)];
          (sourceFeatures || []).forEach(function (sourceFeature) {
            var newFeatureId = 'feature_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
            var featureCopy = Object.assign({}, sourceFeature, { id: newFeatureId, layerId: targetLayerId });
            features.add(featureCopy);
          });
        }
      }
      var sourceState = await requestPromise(states.get(sourceMapId));
      var activeTarget = null;
      if (sourceState && sourceState.activeLayerId && layerIdMap[String(sourceState.activeLayerId)]) {
        activeTarget = layerIdMap[String(sourceState.activeLayerId)];
      }
      states.put({ mapId: targetMapId, activeLayerId: activeTarget, schemaVersion: SCHEMA_VERSION });
      await txDone;
      return { sourceMapId: sourceMapId, targetMapId: targetMapId, clonedCount: (sourceLayers || []).length, activeLayerId: activeTarget, layerIdMap: layerIdMap };
    } catch (e) {
      throw normalizeStorageError(e, 'cloneLayersForMap');
    }
  }

  global.MG1MapLayerStore = Object.freeze({
    version: '25.2-s01',
    schemaVersion: SCHEMA_VERSION,
    getLayer: getLayer,
    getLayers: getLayers,
    createLayer: createLayer,
    updateLayer: updateLayer,
    setVisibility: setVisibility,
    getActiveLayer: getActiveLayer,
    setActiveLayer: setActiveLayer,
    deleteLayer: deleteLayer,
    cloneLayersForMap: cloneLayersForMap
  });

  console.log('[V25.2 MAP LAYER] Store ready — IndexedDB v4 boundary (Layer + Feature stores)');
})(window);
