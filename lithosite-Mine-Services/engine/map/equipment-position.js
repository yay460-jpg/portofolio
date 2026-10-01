/* ============================================================
 * MINE SERVICES — Map Engine Equipment Position
 * Stage 20.0 — Equipment Position
 *
 * Platform-neutral equipment map object. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const TYPES = Object.freeze({
    EQUIPMENT: 'equipment'
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

  function coordinate(value) {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) {
      throw new TypeError('position must be a valid coordinate');
    }
    if (!value.crs || typeof value.crs.id !== 'string') {
      throw new TypeError('position CRS is required');
    }
    return Object.freeze({ x: finite(value.x, 'position.x'), y: finite(value.y, 'position.y'), crs: value.crs });
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function createEquipment(config) {
    config = config || {};
    const position = coordinate(config.position);

    const heading = config.heading === undefined ? null : finite(config.heading, 'heading');
    const elevation = config.elevation === undefined ? null : finite(config.elevation, 'elevation');

    return Object.freeze({
      id: requiredId(config.id, 'equipment.id'),
      type: TYPES.EQUIPMENT,
      name: config.name === undefined ? '' : String(config.name),
      category: config.category === undefined ? '' : String(config.category),
      status: config.status === undefined ? '' : String(config.status),
      position,
      crs: position.crs,
      heading: heading,
      elevation: elevation,
      metadata: Object.freeze(clone(config.metadata || {}))
    });
  }

  function assertSameCRS(equipment, reference) {
    if (!equipment || !equipment.crs || !reference || !reference.crs) {
      throw new TypeError('Equipment and reference CRS are required');
    }

    if (equipment.crs.id !== reference.crs.id ||
        equipment.crs.type !== reference.crs.type ||
        equipment.crs.axis !== reference.crs.axis) {
      throw new Error('Equipment CRS does not match reference CRS');
    }

    return true;
  }

  function boundsFromEquipment(equipment) {
    if (!equipment || equipment.type !== TYPES.EQUIPMENT) {
      throw new TypeError('equipment is required');
    }

    return Object.freeze({
      minX: equipment.position.x,
      maxX: equipment.position.x,
      minY: equipment.position.y,
      maxY: equipment.position.y,
      crs: equipment.position.crs
    });
  }

  global.MineServicesMapEquipmentPosition = Object.freeze({
    TYPES,
    createEquipment,
    assertSameCRS,
    boundsFromEquipment
  });
})(window);
