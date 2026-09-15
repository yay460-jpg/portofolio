/* MG1 V25.3 — MAP LAYER LIBRARY
 *
 * Canonical semantic Layer business facade.
 * Owns business invariants; persistence remains in map-layer-store.js.
 * Does not own renderer/tile/GeoReference/Map lifecycle implementation.
 */
(function (global) {
  'use strict';

  var C = global.MG1MapLayerContract;
  var S = global.MG1MapLayerStore;
  if (!C) throw new Error('MG1MapLayerLibrary requires MG1MapLayerContract');
  if (!S) throw new Error('MG1MapLayerLibrary requires MG1MapLayerStore');

  function makeError(code, operation, cause) {
    var e = new Error(code);
    e.code = code;
    e.operation = operation;
    if (cause) e.cause = cause;
    return e;
  }

  function requireMapId(mapId) {
    if (typeof mapId !== 'string' || !mapId.trim()) {
      throw makeError(C.errors.INVALID_MAP_ID, 'map');
    }
    return mapId.trim();
  }

  async function getLayer(id) {
    if (typeof id !== 'string' || !id.trim()) return null;
    return S.getLayer(id.trim());
  }

  async function getLayers(mapId) {
    return S.getLayers(requireMapId(mapId));
  }

  async function createLayer(mapId, input) {
    mapId = requireMapId(mapId);
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw makeError(C.errors.INVALID_INPUT, 'createLayer');
    }
    var candidate = Object.assign({}, input, { mapId: mapId });
    if (!candidate.id) {
      candidate.id = 'layer_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    }
    var normalized = C.normalize(candidate);
    return S.createLayer(normalized);
  }

  async function updateLayer(id, patch) {
    if (typeof id !== 'string' || !id.trim()) throw makeError(C.errors.INVALID_ID, 'updateLayer');
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw makeError(C.errors.INVALID_INPUT, 'updateLayer');
    }
    return S.updateLayer(id.trim(), patch);
  }

  async function setVisibility(id, visible) {
    if (typeof id !== 'string' || !id.trim()) throw makeError(C.errors.INVALID_ID, 'setVisibility');
    return S.setVisibility(id.trim(), visible);
  }

  async function getActiveLayer(mapId) {
    return S.getActiveLayer(requireMapId(mapId));
  }

  async function setActiveLayer(mapId, layerId) {
    mapId = requireMapId(mapId);
    if (layerId !== null && (typeof layerId !== 'string' || !layerId.trim())) {
      throw makeError(C.errors.INVALID_ID, 'setActiveLayer');
    }
    return S.setActiveLayer(mapId, layerId === null ? null : layerId.trim());
  }

  async function deleteLayer(id) {
    if (typeof id !== 'string' || !id.trim()) throw makeError(C.errors.INVALID_ID, 'deleteLayer');
    return S.deleteLayer(id.trim());
  }

  async function cloneLayersForMap(sourceMapId, targetMapId) {
    sourceMapId = requireMapId(sourceMapId);
    targetMapId = requireMapId(targetMapId);
    if (sourceMapId === targetMapId) throw makeError(C.errors.MAP_MISMATCH, 'cloneLayersForMap');
    return S.cloneLayersForMap(sourceMapId, targetMapId);
  }

  global.MG1MapLayerLibrary = Object.freeze({
    version: '25.3-s01',
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

  console.log('[V25.3 MAP LAYER] Library ready — business facade / invariant boundary');
})(window);
