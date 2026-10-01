/* ============================================================
 * MINE SERVICES — Map Engine Feature Registry
 * Stage 20.6 — Feature Management
 *
 * Platform-neutral feature registry. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  function requiredId(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(field + ' is required');
    }
    return value.trim();
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function validateFeature(feature) {
    if (!feature || typeof feature !== 'object') {
      throw new TypeError('feature is required');
    }

    const id = requiredId(feature.id, 'feature.id');
    const layerId = requiredId(feature.layerId, 'feature.layerId');

    if (!feature.geometry || typeof feature.geometry !== 'object') {
      throw new TypeError('feature.geometry is required');
    }

    if (typeof feature.geometry.type !== 'string') {
      throw new TypeError('feature.geometry.type is required');
    }

    if (!feature.geometry.crs || typeof feature.geometry.crs.id !== 'string') {
      throw new TypeError('feature.geometry CRS is required');
    }

    return {
      id,
      layerId,
      type: feature.type === undefined ? 'feature' : String(feature.type),
      geometry: clone(feature.geometry),
      properties: clone(feature.properties || {}),
      metadata: clone(feature.metadata || {})
    };
  }

  function createFeatureRegistry(options) {
    options = options || {};
    const features = new Map();

    function addFeature(feature) {
      const normalized = validateFeature(feature);

      if (features.has(normalized.id)) {
        throw new Error('Feature already exists: ' + normalized.id);
      }

      features.set(normalized.id, normalized);
      return clone(normalized);
    }

    function updateFeature(id, patch) {
      const normalizedId = requiredId(id, 'feature.id');
      if (!features.has(normalizedId)) {
        throw new Error('Feature not found: ' + normalizedId);
      }
      if (!patch || typeof patch !== 'object') {
        throw new TypeError('feature patch is required');
      }

      const current = features.get(normalizedId);
      const next = Object.assign({}, current, patch, { id: normalizedId });
      const normalized = validateFeature(next);

      features.set(normalizedId, normalized);
      return clone(normalized);
    }

    function removeFeature(id) {
      return features.delete(requiredId(id, 'feature.id'));
    }

    function getFeature(id) {
      const normalizedId = requiredId(id, 'feature.id');
      return features.has(normalizedId) ? clone(features.get(normalizedId)) : null;
    }

    function getFeaturesByLayer(layerId) {
      const normalizedLayerId = requiredId(layerId, 'layer.id');

      return Array.from(features.values())
        .filter(function (feature) {
          return feature.layerId === normalizedLayerId;
        })
        .map(clone);
    }

    function listFeatures() {
      return Array.from(features.values()).map(clone);
    }

    function clear() {
      features.clear();
    }

    return Object.freeze({
      addFeature,
      updateFeature,
      removeFeature,
      getFeature,
      getFeaturesByLayer,
      listFeatures,
      clear
    });
  }

  global.MineServicesMapFeatureRegistry = Object.freeze({
    createFeatureRegistry,
    validateFeature
  });
})(window);
