(function (global) {
  'use strict';

  const REQUIRED = Object.freeze([
    'setViewport', 'getViewport',
    'worldToScreen', 'screenToWorld',
    'pan', 'zoom', 'zoomAtPoint',
    'fitBounds',
    'addLayer', 'removeLayer', 'setLayerVisibility',
    'addPoint', 'addLine', 'addPolygon',
    'clear'
  ]);

  function finite(value, field) {
    if (!Number.isFinite(value)) {
      throw new TypeError(field + ' must be finite');
    }
    return value;
  }

  function createEngineAdapter(api) {
    if (!api || typeof api !== 'object') {
      throw new TypeError('map engine API is required');
    }

    REQUIRED.forEach(function (method) {
      if (typeof api[method] !== 'function') {
        throw new TypeError('map engine API.' + method + ' is required');
      }
    });

    function setViewport(viewport) {
      return api.setViewport(viewport);
    }

    function getViewport() {
      return api.getViewport();
    }

    function worldToScreen(world, viewport) {
      return api.worldToScreen(world, viewport);
    }

    function screenToWorld(screen, viewport) {
      return api.screenToWorld(screen, viewport);
    }

    function pan(deltaX, deltaY) {
      finite(deltaX, 'deltaX');
      finite(deltaY, 'deltaY');
      return api.pan(deltaX, deltaY);
    }

    function zoom(delta) {
      finite(delta, 'delta');
      return api.zoom(delta);
    }

    function zoomAtPoint(delta, point) {
      finite(delta, 'delta');
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        throw new TypeError('point must contain finite x and y');
      }
      return api.zoomAtPoint(delta, point);
    }

    function fitBounds(bounds, viewport, options) {
      return api.fitBounds(bounds, viewport, options);
    }

    function addLayer(layer) {
      return api.addLayer(layer);
    }

    function removeLayer(id) {
      return api.removeLayer(id);
    }

    function setLayerVisibility(id, visible) {
      return api.setLayerVisibility(id, visible);
    }

    function addPoint(feature) {
      return api.addPoint(feature);
    }

    function addLine(feature) {
      return api.addLine(feature);
    }

    function addPolygon(feature) {
      return api.addPolygon(feature);
    }

    function clear() {
      return api.clear();
    }

    return Object.freeze({
      setViewport,
      getViewport,
      worldToScreen,
      screenToWorld,
      pan,
      zoom,
      zoomAtPoint,
      fitBounds,
      addLayer,
      removeLayer,
      setLayerVisibility,
      addPoint,
      addLine,
      addPolygon,
      clear
    });
  }

  global.MineServicesMapEngineAdapter = Object.freeze({
    REQUIRED,
    createEngineAdapter
  });
})(window);
