/* ============================================================
 * MINE SERVICES — Map Engine Layer Management
 * Stage 20.5 — Layer Management
 *
 * Platform-neutral ordered layer registry. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const LAYER_TYPES = Object.freeze([
    'site',
    'boundary',
    'workfront',
    'equipment',
    'operations',
    'maintenance',
    'hse',
    'issue',
    'route',
    'stockpile',
    'infrastructure'
  ]);

  function requiredId(value) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError('layer.id is required');
    }
    return value.trim();
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function validateLayer(layer) {
    if (!layer || typeof layer !== 'object') {
      throw new TypeError('layer is required');
    }

    const id = requiredId(layer.id);
    const type = layer.type === undefined ? null : String(layer.type);

    if (type !== null && !LAYER_TYPES.includes(type)) {
      throw new TypeError('unsupported layer type');
    }

    const visible = layer.visible === undefined ? true : layer.visible;
    if (typeof visible !== 'boolean') {
      throw new TypeError('layer.visible must be boolean');
    }

    const order = layer.order === undefined ? 0 : layer.order;
    if (!Number.isFinite(order)) {
      throw new TypeError('layer.order must be finite');
    }

    return {
      id,
      type,
      name: layer.name === undefined ? id : String(layer.name),
      visible,
      order,
      metadata: clone(layer.metadata || {})
    };
  }

  function createLayerManager(options) {
    options = options || {};
    const layers = new Map();

    function addLayer(layer) {
      const normalized = validateLayer(layer);
      if (layers.has(normalized.id)) {
        throw new Error('Layer already exists: ' + normalized.id);
      }
      layers.set(normalized.id, normalized);
      return clone(normalized);
    }

    function removeLayer(id) {
      return layers.delete(requiredId(id));
    }

    function getLayer(id) {
      const normalizedId = requiredId(id);
      return layers.has(normalizedId) ? clone(layers.get(normalizedId)) : null;
    }

    function setLayerVisibility(id, visible) {
      const normalizedId = requiredId(id);
      if (typeof visible !== 'boolean') {
        throw new TypeError('visible must be boolean');
      }
      const layer = layers.get(normalizedId);
      if (!layer) throw new Error('Layer not found: ' + normalizedId);
      layer.visible = visible;
      return clone(layer);
    }

    function setLayerOrder(id, order) {
      const normalizedId = requiredId(id);
      if (!Number.isFinite(order)) {
        throw new TypeError('layer.order must be finite');
      }
      const layer = layers.get(normalizedId);
      if (!layer) throw new Error('Layer not found: ' + normalizedId);
      layer.order = order;
      return clone(layer);
    }

    function listLayers() {
      return Array.from(layers.values())
        .sort(function (a, b) {
          return a.order - b.order;
        })
        .map(clone);
    }

    function clear() {
      layers.clear();
    }

    return Object.freeze({
      addLayer,
      removeLayer,
      getLayer,
      setLayerVisibility,
      setLayerOrder,
      listLayers,
      clear
    });
  }

  global.MineServicesMapLayerManager = Object.freeze({
    LAYER_TYPES,
    createLayerManager
  });
})(window);
