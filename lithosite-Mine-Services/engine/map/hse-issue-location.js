/* ============================================================
 * MINE SERVICES — Map Engine HSE / Issue Location
 * Stage 20.3 — HSE / Issue Location
 *
 * Platform-neutral HSE and Issue map objects. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const TYPES = Object.freeze({
    HSE: 'hse',
    ISSUE: 'issue'
  });

  function requiredId(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(field + ' is required');
    }
    return value.trim();
  }

  function finite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be finite');
    return value;
  }

  function location(value) {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) {
      throw new TypeError('location must be a valid coordinate');
    }
    if (!value.crs || typeof value.crs.id !== 'string') {
      throw new TypeError('location CRS is required');
    }
    return Object.freeze({
      x: finite(value.x, 'location.x'),
      y: finite(value.y, 'location.y'),
      crs: value.crs
    });
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function createHSE(config) {
    config = config || {};
    const point = location(config.location);

    return Object.freeze({
      id: requiredId(config.id, 'hse.id'),
      type: TYPES.HSE,
      name: config.name === undefined ? '' : String(config.name),
      severity: config.severity === undefined ? '' : String(config.severity),
      status: config.status === undefined ? '' : String(config.status),
      location: point,
      crs: point.crs,
      metadata: Object.freeze(clone(config.metadata || {}))
    });
  }

  function createIssue(config) {
    config = config || {};
    const point = location(config.location);

    return Object.freeze({
      id: requiredId(config.id, 'issue.id'),
      type: TYPES.ISSUE,
      name: config.name === undefined ? '' : String(config.name),
      priority: config.priority === undefined ? '' : String(config.priority),
      status: config.status === undefined ? '' : String(config.status),
      location: point,
      crs: point.crs,
      metadata: Object.freeze(clone(config.metadata || {}))
    });
  }

  function assertSameCRS(item, reference) {
    if (!item || !item.crs || !reference || !reference.crs) {
      throw new TypeError('HSE/Issue and reference CRS are required');
    }

    if (item.crs.id !== reference.crs.id ||
        item.crs.type !== reference.crs.type ||
        item.crs.axis !== reference.crs.axis) {
      throw new Error('HSE/Issue CRS does not match reference CRS');
    }

    return true;
  }

  function boundsFromLocation(item) {
    if (!item || (item.type !== TYPES.HSE && item.type !== TYPES.ISSUE)) {
      throw new TypeError('HSE or Issue is required');
    }

    return Object.freeze({
      minX: item.location.x,
      maxX: item.location.x,
      minY: item.location.y,
      maxY: item.location.y,
      crs: item.location.crs
    });
  }

  global.MineServicesMapHSEIssueLocation = Object.freeze({
    TYPES,
    createHSE,
    createIssue,
    assertSameCRS,
    boundsFromLocation
  });
})(window);
