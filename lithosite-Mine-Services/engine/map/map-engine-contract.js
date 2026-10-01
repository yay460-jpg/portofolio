/* ============================================================
 * MINE SERVICES — Standalone Map Engine
 * Stage 19.1 — Engine Contract
 *
 * Contract only. No DOM, renderer, mapping-library, or Android dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const CONTRACT_VERSION = '0.1.0';

  const METHODS = Object.freeze([
    'setViewport', 'getViewport', 'worldToScreen', 'screenToWorld',
    'pan', 'zoom', 'zoomAtPoint', 'addLayer', 'removeLayer',
    'setLayerVisibility', 'addPoint', 'addLine', 'addPolygon',
    'fitBounds', 'clear'
  ]);

  const LAYER_TYPES = Object.freeze([
    'site', 'boundary', 'workfront', 'equipment', 'operations',
    'maintenance', 'hse', 'issue', 'route', 'stockpile', 'infrastructure'
  ]);

  const GEOMETRY_TYPES = Object.freeze(['Point', 'LineString', 'Polygon']);

  global.MineServicesMapEngineContract = Object.freeze({
    name: 'MineServicesMapEngine',
    version: CONTRACT_VERSION,
    platformNeutral: true,
    domIndependent: true,
    methods: METHODS,
    layerTypes: LAYER_TYPES,
    geometryTypes: GEOMETRY_TYPES
  });
})(window);