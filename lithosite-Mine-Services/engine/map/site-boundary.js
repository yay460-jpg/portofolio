/* ============================================================
 * MINE SERVICES — Map Engine Site / Boundary
 * Stage 19.8 — Site / Boundary
 *
 * Platform-neutral domain model. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const TYPES = Object.freeze({
    SITE: 'site',
    BOUNDARY: 'boundary'
  });

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
    if (geometry.type !== 'Polygon' && geometry.type !== 'Point') {
      throw new TypeError('site geometry must be Point or Polygon');
    }
    return geometry;
  }

  function createSite(config) {
    config = config || {};
    const geometry = validGeometry(config.geometry);

    return Object.freeze({
      id: requiredId(config.id, 'site.id'),
      type: TYPES.SITE,
      name: config.name === undefined ? '' : String(config.name),
      geometry: clone(geometry),
      crs: geometry.crs,
      metadata: Object.freeze(clone(config.metadata || {}))
    });
  }

  function createBoundary(config) {
    config = config || {};
    const geometry = validGeometry(config.geometry);

    if (geometry.type !== 'Polygon') {
      throw new TypeError('boundary geometry must be Polygon');
    }

    return Object.freeze({
      id: requiredId(config.id, 'boundary.id'),
      type: TYPES.BOUNDARY,
      name: config.name === undefined ? '' : String(config.name),
      geometry: clone(geometry),
      crs: geometry.crs,
      metadata: Object.freeze(clone(config.metadata || {}))
    });
  }

  function assertSameCRS(site, boundary) {
    if (!site || !boundary || !site.crs || !boundary.crs) {
      throw new TypeError('site and boundary CRS are required');
    }
    if (site.crs.id !== boundary.crs.id ||
        site.crs.type !== boundary.crs.type ||
        site.crs.axis !== boundary.crs.axis) {
      throw new Error('Site and boundary CRS do not match');
    }
    return true;
  }

  function boundsFromGeometry(geometry) {
    validGeometry(geometry);

    const points = geometry.type === 'Point'
      ? [geometry.coordinate]
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

  function boundsFromSite(site) {
    if (!site || site.type !== TYPES.SITE) throw new TypeError('site is required');
    return boundsFromGeometry(site.geometry);
  }

  function boundsFromBoundary(boundary) {
    if (!boundary || boundary.type !== TYPES.BOUNDARY) {
      throw new TypeError('boundary is required');
    }
    return boundsFromGeometry(boundary.geometry);
  }

  global.MineServicesMapSiteBoundary = Object.freeze({
    TYPES,
    createSite,
    createBoundary,
    assertSameCRS,
    boundsFromGeometry,
    boundsFromSite,
    boundsFromBoundary
  });
})(window);
