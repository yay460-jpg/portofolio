/* MG1 V25.5 — MAP LAYER MANAGEMENT BRIDGE
 *
 * UI-facing management boundary for semantic Map Layers.
 * This bridge delegates all business/persistence work to the Layer Library.
 * It does not own DOM rendering, IndexedDB, Map lifecycle, tiles, GeoReference,
 * or renderer-layer state.
 */
(function (global) {
  'use strict';

  var C = global.MG1MapLayerContract;
  var L = global.MG1MapLayerLibrary;
  var Q = global.MG1MapLayerCapability;

  if (!C) throw new Error('MG1MapLayerManagement requires MG1MapLayerContract');
  if (!L) throw new Error('MG1MapLayerManagement requires MG1MapLayerLibrary');
  if (!Q) throw new Error('MG1MapLayerManagement requires MG1MapLayerCapability');

  function error(code, operation) {
    var e = new Error(code);
    e.code = code;
    e.operation = operation;
    return e;
  }

  function requireId(value, code, operation) {
    if (typeof value !== 'string' || !value.trim()) throw error(code, operation);
    return value.trim();
  }

  async function list(mapId, options) {
    mapId = requireId(mapId, C.errors.INVALID_MAP_ID, 'list');
    return Q.list(Object.assign({}, options || {}, { mapId: mapId }));
  }

  async function summary(mapId) {
    mapId = requireId(mapId, C.errors.INVALID_MAP_ID, 'summary');
    return Q.summary(mapId);
  }

  async function create(mapId, input) {
    mapId = requireId(mapId, C.errors.INVALID_MAP_ID, 'create');
    return L.createLayer(mapId, input);
  }

  async function rename(layerId, name) {
    layerId = requireId(layerId, C.errors.INVALID_ID, 'rename');
    if (typeof name !== 'string' || !name.trim()) throw error(C.errors.INVALID_NAME, 'rename');
    return L.updateLayer(layerId, { name: name.trim() });
  }

  async function update(layerId, patch) {
    layerId = requireId(layerId, C.errors.INVALID_ID, 'update');
    return L.updateLayer(layerId, patch);
  }

  async function setVisibility(layerId, visible) {
    layerId = requireId(layerId, C.errors.INVALID_ID, 'setVisibility');
    return L.setVisibility(layerId, visible);
  }

  async function activate(mapId, layerId) {
    mapId = requireId(mapId, C.errors.INVALID_MAP_ID, 'activate');
    if (layerId === null) return L.setActiveLayer(mapId, null);
    layerId = requireId(layerId, C.errors.INVALID_ID, 'activate');
    return L.setActiveLayer(mapId, layerId);
  }

  async function getActive(mapId) {
    mapId = requireId(mapId, C.errors.INVALID_MAP_ID, 'getActive');
    return L.getActiveLayer(mapId);
  }

  async function remove(layerId) {
    layerId = requireId(layerId, C.errors.INVALID_ID, 'remove');
    return L.deleteLayer(layerId);
  }

  async function cloneForMap(sourceMapId, targetMapId) {
    sourceMapId = requireId(sourceMapId, C.errors.INVALID_MAP_ID, 'cloneForMap');
    targetMapId = requireId(targetMapId, C.errors.INVALID_MAP_ID, 'cloneForMap');
    return L.cloneLayersForMap(sourceMapId, targetMapId);
  }

  global.MG1MapLayerManagement = Object.freeze({
    version: '25.5-s01',
    list: list,
    summary: summary,
    create: create,
    rename: rename,
    update: update,
    setVisibility: setVisibility,
    activate: activate,
    getActive: getActive,
    remove: remove,
    cloneForMap: cloneForMap
  });

  console.log('[V25.5 MAP LAYER] Management bridge ready — UI delegates to Layer Library');
})(window);
