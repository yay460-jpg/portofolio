/* ============================================================
 * MINE SERVICES — Map Engine Operations Location
 * Stage 20.1 — Operations Location
 *
 * Platform-neutral operations map object. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const TYPES = Object.freeze({
    OPERATIONS: 'operations'
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

  function position(value) {
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

  function createOperation(config) {
    config = config || {};
    const location = position(config.location);

    return Object.freeze({
      id: requiredId(config.id, 'operation.id'),
      type: TYPES.OPERATIONS,
      name: config.name === undefined ? '' : String(config.name),
      status: config.status === undefined ? '' : String(config.status),
      location,
      crs: location.crs,
      metadata: Object.freeze(clone(config.metadata || {}))
    });
  }

  function assertSameCRS(operation, reference) {
    if (!operation || !operation.crs || !reference || !reference.crs) {
      throw new TypeError('Operation and reference CRS are required');
    }

    if (operation.crs.id !== reference.crs.id ||
        operation.crs.type !== reference.crs.type ||
        operation.crs.axis !== reference.crs.axis) {
      throw new Error('Operation CRS does not match reference CRS');
    }

    return true;
  }

  function boundsFromOperation(operation) {
    if (!operation || operation.type !== TYPES.OPERATIONS) {
      throw new TypeError('operation is required');
    }

    return Object.freeze({
      minX: operation.location.x,
      maxX: operation.location.x,
      minY: operation.location.y,
      maxY: operation.location.y,
      crs: operation.location.crs
    });
  }

  global.MineServicesMapOperationsLocation = Object.freeze({
    TYPES,
    createOperation,
    assertSameCRS,
    boundsFromOperation
  });
})(window);
