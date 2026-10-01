(function (global) {
  'use strict';

  function finite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be finite');
    return value;
  }

  function requiredId(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(field + ' is required');
    }
    return value.trim();
  }

  function createPublicAPI(options) {
    options = options || {};
    const navigation = options.navigation || null;
    const model = options.model || null;
    const interaction = options.interaction || null;
    const transform = options.transform || null;
    const fitBounds = options.fitBounds || null;

    function requireMethod(owner, method, field) {
      if (!owner || typeof owner[method] !== 'function') {
        throw new Error(field + '.' + method + ' is required');
      }
      return owner[method];
    }

    function setViewport(viewport) {
      return requireMethod(navigation, 'setViewport', 'navigation').call(navigation, viewport);
    }

    function getViewport() {
      return requireMethod(navigation, 'getViewport', 'navigation').call(navigation);
    }

    function pan(deltaX, deltaY) {
      finite(deltaX, 'deltaX');
      finite(deltaY, 'deltaY');
      return requireMethod(navigation, 'pan', 'navigation').call(navigation, deltaX, deltaY);
    }

    function zoom(delta) {
      return requireMethod(navigation, 'zoom', 'navigation').call(navigation, delta);
    }

    function zoomAtPoint(delta, point) {
      return requireMethod(navigation, 'zoomAtPoint', 'navigation').call(navigation, delta, point);
    }

    function worldToScreen(world, viewport) {
      return requireMethod(transform, 'worldToScreen', 'transform')
        .call(transform, world, viewport || getViewport());
    }

    function screenToWorld(screen, viewport) {
      return requireMethod(transform, 'screenToWorld', 'transform')
        .call(transform, screen, viewport || getViewport());
    }

    function fit(bounds, viewport, config) {
      return requireMethod(fitBounds, 'fitBounds', 'fitBounds')
        .call(fitBounds, bounds, viewport || getViewport(), config);
    }

    function addFeature(feature) {
      return requireMethod(model, 'addFeature', 'model').call(model, feature);
    }

    function updateFeature(id, patch) {
      return requireMethod(model, 'updateFeature', 'model')
        .call(model, requiredId(id, 'feature.id'), patch);
    }

    function removeFeature(id) {
      return requireMethod(model, 'removeFeature', 'model')
        .call(model, requiredId(id, 'feature.id'));
    }

    function getFeature(id) {
      return requireMethod(model, 'getFeature', 'model')
        .call(model, requiredId(id, 'feature.id'));
    }

    function getFeaturesByLayer(layerId) {
      return requireMethod(model, 'getFeaturesByLayer', 'model')
        .call(model, requiredId(layerId, 'layer.id'));
    }

    function select(featureId) {
      return requireMethod(interaction, 'select', 'interaction')
        .call(interaction, requiredId(featureId, 'feature.id'));
    }

    function clearSelection() {
      return requireMethod(interaction, 'clearSelection', 'interaction').call(interaction);
    }

    function getSelectedFeatureId() {
      return requireMethod(interaction, 'getSelectedFeatureId', 'interaction').call(interaction);
    }

    function hover(featureId) {
      return requireMethod(interaction, 'hover', 'interaction')
        .call(interaction, requiredId(featureId, 'feature.id'));
    }

    function clearHover() {
      return requireMethod(interaction, 'clearHover', 'interaction').call(interaction);
    }

    function getHoveredFeatureId() {
      return requireMethod(interaction, 'getHoveredFeatureId', 'interaction').call(interaction);
    }

    return Object.freeze({
      setViewport,
      getViewport,
      pan,
      zoom,
      zoomAtPoint,
      worldToScreen,
      screenToWorld,
      fitBounds: fit,
      addFeature,
      updateFeature,
      removeFeature,
      getFeature,
      getFeaturesByLayer,
      select,
      clearSelection,
      getSelectedFeatureId,
      hover,
      clearHover,
      getHoveredFeatureId
    });
  }

  global.MineServicesMapPublicAPI = Object.freeze({
    createPublicAPI
  });
})(window);
