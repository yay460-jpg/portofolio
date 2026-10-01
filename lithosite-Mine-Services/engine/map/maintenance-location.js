/* ============================================================
 * MINE SERVICES — Map Engine Maintenance Location
 * Stage 20.2 — Maintenance Location
 *
 * Platform-neutral maintenance map object. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const TYPES = Object.freeze({
    MAINTENANCE: 'maintenance'
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

  function createMaintenance(config) {
    config = config || {};
    const position = location(config.location);

    return Object.freeze({
      id: requiredId(config.id, 'maintenance.id'),
      type: TYPES.MAINTENANCE,
      name: config.name === undefined ? '' : String(config.name),
      status: config.status === undefined ? '' : String(config.status),
      maintenanceType: config.maintenanceType === undefined ? '' : String(config.maintenanceType),
      location: position,
      crs: position.crs,
      metadata: Object.freeze(clone(config.metadata || {}))
    });
  }

  function assertSameCRS(maintenance, reference) {
    if (!maintenance || !maintenance.crs || !reference || !reference.crs) {
      throw new TypeError('Maintenance and reference CRS are required');
    }

    if (maintenance.crs.id !== reference.crs.id ||
        maintenance.crs.type !== reference.crs.type ||
        maintenance.crs.axis !== reference.crs.axis) {
      throw new Error('Maintenance CRS does not match reference CRS');
    }

    return true;
  }

  function boundsFromMaintenance(maintenance) {
    if (!maintenance || maintenance.type !== TYPES.MAINTENANCE) {
      throw new TypeError('maintenance is required');
    }

    return Object.freeze({
      minX: maintenance.location.x,
      maxX: maintenance.location.x,
      minY: maintenance.location.y,
      maxY: maintenance.location.y,
      crs: maintenance.location.crs
    });
  }

  global.MineServicesMapMaintenanceLocation = Object.freeze({
    TYPES,
    createMaintenance,
    assertSameCRS,
    boundsFromMaintenance
  });
})(window);
