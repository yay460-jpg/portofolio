/* ============================================================
 * MINE SERVICES — Map Engine Coordinate Model
 * Stage 19.2 — Coordinate System
 *
 * CRS is explicit configuration. No Mine Geologist CRS is inherited
 * and no project CRS is hard-coded until Mine Services data defines it.
 * ============================================================ */

(function (global) {
  'use strict';

  const TYPES = Object.freeze({ PROJECTED: 'projected', GEOGRAPHIC: 'geographic' });
  const AXES = Object.freeze({ XY: 'xy', LON_LAT: 'lonlat', LAT_LON: 'latlon' });

  function requireFinite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be a finite number');
    return value;
  }

  function createCRS(config) {
    if (!config || typeof config !== 'object') throw new TypeError('CRS configuration is required');
    const type = config.type || TYPES.PROJECTED;
    if (type !== TYPES.PROJECTED && type !== TYPES.GEOGRAPHIC) throw new TypeError('Unsupported CRS type');
    if (!config.id || typeof config.id !== 'string') throw new TypeError('CRS id is required');
    const axis = config.axis || (type === TYPES.PROJECTED ? AXES.XY : AXES.LON_LAT);
    if (!Object.values(AXES).includes(axis)) throw new TypeError('Unsupported CRS axis order');
    return Object.freeze({
      id: config.id,
      type,
      axis,
      units: config.units || (type === TYPES.PROJECTED ? 'meter' : 'degree')
    });
  }

  function createCoordinate(x, y, crs) {
    const coordinateCRS = createCRS(crs);
    return Object.freeze({
      x: requireFinite(x, 'x'),
      y: requireFinite(y, 'y'),
      crs: coordinateCRS
    });
  }

  function isCoordinate(value) {
    return Boolean(value && Number.isFinite(value.x) && Number.isFinite(value.y) &&
      value.crs && typeof value.crs.id === 'string');
  }

  function assertSameCRS(a, b) {
    if (!isCoordinate(a) || !isCoordinate(b)) throw new TypeError('Valid coordinates are required');
    if (a.crs.id !== b.crs.id || a.crs.type !== b.crs.type || a.crs.axis !== b.crs.axis) {
      throw new Error('Coordinate reference systems do not match');
    }
    return true;
  }

  global.MineServicesMapCoordinate = Object.freeze({
    TYPES,
    AXES,
    createCRS,
    createCoordinate,
    isCoordinate,
    assertSameCRS
  });
})(window);