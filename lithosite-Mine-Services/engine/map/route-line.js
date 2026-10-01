/* ============================================================
 * MINE SERVICES — Map Engine Route / Line
 * Stage 20.4 — Route / Line Geometry
 *
 * Platform-neutral route domain model. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const TYPES = Object.freeze({
    ROUTE: 'route'
  });

  const GEOMETRY_TYPES = Object.freeze([
    'LineString'
  ]);

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

  function validGeometry(geometry) {
    if (!geometry || typeof geometry !== 'object') {
      throw new TypeError('geometry is required');
    }
    if (geometry.type !== 'LineString') {
      throw new TypeError('route geometry must be LineString');
    }
    if (!geometry.crs || typeof geometry.crs.id !== 'string') {
      throw new TypeError('geometry CRS is required');
    }
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
      throw new RangeError('route geometry must contain at least two coordinates');
    }
    return geometry;
  }

  function createRoute(config) {
    config = config || {};
    const geometry = validGeometry(config.geometry);

    return Object.freeze({
      id: requiredId(config.id, 'route.id'),
      type: TYPES.ROUTE,
      name: config.name === undefined ? '' : String(config.name),
      status: config.status === undefined ? '' : String(config.status),
      routeType: config.routeType === undefined ? '' : String(config.routeType),
      direction: config.direction === undefined ? '' : String(config.direction),
      geometry: clone(geometry),
      crs: geometry.crs,
      metadata: Object.freeze(clone(config.metadata || {}))
    });
  }

  function assertSameCRS(route, reference) {
    if (!route || !route.crs || !reference || !reference.crs) {
      throw new TypeError('Route and reference CRS are required');
    }

    if (route.crs.id !== reference.crs.id ||
        route.crs.type !== reference.crs.type ||
        route.crs.axis !== reference.crs.axis) {
      throw new Error('Route CRS does not match reference CRS');
    }

    return true;
  }

  function boundsFromRoute(route) {
    if (!route || route.type !== TYPES.ROUTE) {
      throw new TypeError('route is required');
    }

    const points = route.geometry.coordinates;
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    points.forEach(function (point) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    return Object.freeze({
      minX,
      maxX,
      minY,
      maxY,
      crs: route.geometry.crs
    });
  }

  global.MineServicesMapRouteLine = Object.freeze({
    TYPES,
    GEOMETRY_TYPES,
    createRoute,
    assertSameCRS,
    boundsFromRoute
  });
})(window);
