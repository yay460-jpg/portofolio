/* ============================================================
 * MINE SERVICES — Map Engine WorkFront Geometry
 * Stage 19.9 — WorkFront Geometry
 *
 * Platform-neutral WorkFront domain model. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const TYPES = Object.freeze({
    WORKFRONT: 'workfront'
  });

  const GEOMETRY_TYPES = Object.freeze([
    'Point',
    'LineString',
    'Polygon'
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
    if (!geometry.crs || typeof geometry.crs.id !== 'string') {
      throw new TypeError('geometry CRS is required');
    }
    if (!GEOMETRY_TYPES.includes(geometry.type)) {
      throw new TypeError('unsupported WorkFront geometry type');
    }
    return geometry;
  }

  function createWorkFront(config) {
    config = config || {};
    const geometry = validGeometry(config.geometry);

    return Object.freeze({
      id: requiredId(config.id, 'workfront.id'),
      type: TYPES.WORKFRONT,
      name: config.name === undefined ? '' : String(config.name),
      status: config.status === undefined ? '' : String(config.status),
      geometry: clone(geometry),
      crs: geometry.crs,
      metadata: Object.freeze(clone(config.metadata || {}))
    });
  }

  function assertSameCRS(workfront, reference) {
    if (!workfront || !reference || !workfront.crs || !reference.crs) {
      throw new TypeError('WorkFront and reference CRS are required');
    }

    if (workfront.crs.id !== reference.crs.id ||
        workfront.crs.type !== reference.crs.type ||
        workfront.crs.axis !== reference.crs.axis) {
      throw new Error('WorkFront CRS does not match reference CRS');
    }

    return true;
  }

  function boundsFromGeometry(geometry) {
    validGeometry(geometry);

    const points = geometry.type === 'Point'
      ? [geometry.coordinate]
      : geometry.type === 'LineString'
        ? geometry.coordinates
        : geometry.rings.reduce(function (all, ring) {
            return all.concat(ring);
          }, []);

    if (!points.length) throw new RangeError('geometry contains no coordinates');

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
      crs: geometry.crs
    });
  }

  function boundsFromWorkFront(workfront) {
    if (!workfront || workfront.type !== TYPES.WORKFRONT) {
      throw new TypeError('workfront is required');
    }
    return boundsFromGeometry(workfront.geometry);
  }

  global.MineServicesMapWorkFront = Object.freeze({
    TYPES,
    GEOMETRY_TYPES,
    createWorkFront,
    assertSameCRS,
    boundsFromGeometry,
    boundsFromWorkFront
  });
})(window);
