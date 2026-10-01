(function (global) {
  'use strict';

  function finite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be finite');
    return value;
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function createMapModel(options) {
    options = options || {};
    const layerManager = options.layerManager || null;
    const featureRegistry = options.featureRegistry || null;

    function requireManager(manager, field) {
      if (!manager || typeof manager.getLayer !== 'function') {
        throw new TypeError(field + ' is required');
      }
      return manager;
    }

    function addFeature(feature) {
      if (!featureRegistry || typeof featureRegistry.addFeature !== 'function') {
        throw new Error('featureRegistry is not configured');
      }
      requireManager(layerManager, 'layerManager');

      const layer = layerManager.getLayer(feature && feature.layerId);
      if (!layer) throw new Error('Layer not found: ' + feature.layerId);

      return featureRegistry.addFeature(feature);
    }

    function updateFeature(id, patch) {
      if (!featureRegistry || typeof featureRegistry.updateFeature !== 'function') {
        throw new Error('featureRegistry is not configured');
      }
      return featureRegistry.updateFeature(id, patch);
    }

    function removeFeature(id) {
      if (!featureRegistry || typeof featureRegistry.removeFeature !== 'function') {
        throw new Error('featureRegistry is not configured');
      }
      return featureRegistry.removeFeature(id);
    }

    function getFeature(id) {
      if (!featureRegistry || typeof featureRegistry.getFeature !== 'function') {
        throw new Error('featureRegistry is not configured');
      }
      return featureRegistry.getFeature(id);
    }

    function getFeaturesByLayer(layerId) {
      if (!featureRegistry || typeof featureRegistry.getFeaturesByLayer !== 'function') {
        throw new Error('featureRegistry is not configured');
      }
      return featureRegistry.getFeaturesByLayer(layerId);
    }

    function snapshot() {
      requireManager(layerManager, 'layerManager');
      if (!featureRegistry || typeof featureRegistry.listFeatures !== 'function') {
        throw new Error('featureRegistry is not configured');
      }

      return Object.freeze({
        layers: clone(layerManager.listLayers()),
        features: clone(featureRegistry.listFeatures())
      });
    }

    return Object.freeze({
      addFeature,
      updateFeature,
      removeFeature,
      getFeature,
      getFeaturesByLayer,
      snapshot
    });
  }

  global.MineServicesMapModel = Object.freeze({
    createMapModel
  });
})(window);
