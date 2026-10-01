/* ============================================================
 * MINE SERVICES — Map Engine Geometry
 * Stage 19.7 — Geometry
 *
 * Platform-neutral geometry model. Geometry owns coordinates and CRS
 * consistency; rendering remains outside the engine.
 * ============================================================ */

(function (global) {
  'use strict';

  const TYPES = Object.freeze({
    POINT: 'Point',
    LINE_STRING: 'LineString',
    POLYGON: 'Polygon'
  });

  function finite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be finite');
    return value;
  }

  function validCRS(crs) {
    if (!crs || typeof crs.id !== 'string') {
      throw new TypeError('CRS is required');
    }
    return crs;
  }

  function coordinate(value, field) {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) {
      throw new TypeError(field + ' must be a valid coordinate');
    }
    validCRS(value.crs);
    return Object.freeze({
      x: value.x,
      y: value.y,
      crs: value.crs
    });
  }

  function sameCRS(a, b) {
    return a.crs.id === b.crs.id &&
      a.crs.type === b.crs.type &&
      a.crs.axis === b.crs.axis;
  }

  function assertCRS(reference, value) {
    if (!sameCRS(reference, value)) {
      throw new Error('Geometry coordinates must use the same CRS');
    }
  }

  function coordinates(points, field, minimum) {
    if (!Array.isArray(points) || points.length < minimum) {
      throw new RangeError(field + ' must contain at least ' + minimum + ' coordinates');
    }

    const normalized = points.map(function (point, index) {
      return coordinate(point, field + '[' + index + ']');
    });

    for (let i = 1; i < normalized.length; i += 1) {
      assertCRS(normalized[0], normalized[i]);
    }

    return normalized;
  }

  function createPoint(value) {
    const point = coordinate(value, 'point');
    return Object.freeze({
      type: TYPES.POINT,
      coordinate: point,
      crs: point.crs
    });
  }

  function createLineString(points) {
    const line = coordinates(points, 'lineString', 2);
    return Object.freeze({
      type: TYPES.LINE_STRING,
      coordinates: Object.freeze(line),
      crs: line[0].crs
    });
  }

  function createPolygon(rings) {
    if (!Array.isArray(rings) || rings.length === 0) {
      throw new RangeError('polygon must contain at least one ring');
    }

    const normalizedRings = rings.map(function (ring, ringIndex) {
      const normalized = coordinates(ring, 'polygon ring ' + ringIndex, 4);
      const first = normalized[0];
      const last = normalized[normalized.length - 1];

      if (first.x !== last.x || first.y !== last.y) {
        throw new Error('polygon rings must be closed');
      }

      return Object.freeze(normalized);
    });

    for (let i = 1; i < normalizedRings.length; i += 1) {
      assertCRS(
        normalizedRings[0][0],
        normalizedRings[i][0]
      );
    }

    return Object.freeze({
      type: TYPES.POLYGON,
      rings: Object.freeze(normalizedRings),
      crs: normalizedRings[0][0].crs
    });
  }

  function normalizeGeometry(geometry) {
    if (!geometry || typeof geometry !== 'object') {
      throw new TypeError('geometry is required');
    }

    switch (geometry.type) {
      case TYPES.POINT:
        return createPoint(geometry.coordinate);
      case TYPES.LINE_STRING:
        return createLineString(geometry.coordinates);
      case TYPES.POLYGON:
        return createPolygon(geometry.rings);
      default:
        throw new TypeError('Unsupported geometry type');
    }
  }

  function isGeometry(value) {
    try {
      normalizeGeometry(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  global.MineServicesMapGeometry = Object.freeze({
    TYPES,
    createPoint,
    createLineString,
    createPolygon,
    normalizeGeometry,
    isGeometry
  });
})(window);
