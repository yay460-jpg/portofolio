/* ============================================================
 * MINE SERVICES — Standalone Map Engine
 * Stage 19.4 — Coordinate ↔ Pixel Transform
 *
 * Platform-neutral coordinate math only. No UI or renderer dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  function finite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be finite');
    return value;
  }

  function coordinate(value, field) {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y) || !value.crs) {
      throw new TypeError(field + ' must be a valid coordinate');
    }
    return value;
  }

  function sameCRS(a, b) {
    return a.crs.id === b.crs.id &&
      a.crs.type === b.crs.type &&
      a.crs.axis === b.crs.axis;
  }

  function assertViewport(viewport) {
    if (!viewport || !viewport.center) throw new TypeError('viewport.center is required');
    coordinate(viewport.center, 'viewport.center');
    finite(viewport.width, 'viewport.width');
    finite(viewport.height, 'viewport.height');
    finite(viewport.scale, 'viewport.scale');
    if (viewport.width <= 0 || viewport.height <= 0) {
      throw new RangeError('viewport dimensions must be greater than zero');
    }
    if (viewport.scale <= 0) throw new RangeError('viewport.scale must be greater than zero');
  }

  function worldToScreen(world, viewport) {
    coordinate(world, 'world');
    assertViewport(viewport);
    if (!sameCRS(world, viewport.center)) {
      throw new Error('World coordinate CRS does not match viewport CRS');
    }

    return Object.freeze({
      x: viewport.width / 2 + (world.x - viewport.center.x) / viewport.scale,
      y: viewport.height / 2 - (world.y - viewport.center.y) / viewport.scale
    });
  }

  function screenToWorld(screen, viewport) {
    if (!screen || !Number.isFinite(screen.x) || !Number.isFinite(screen.y)) {
      throw new TypeError('screen must contain finite x and y');
    }
    assertViewport(viewport);

    return Object.freeze({
      x: viewport.center.x + (screen.x - viewport.width / 2) * viewport.scale,
      y: viewport.center.y - (screen.y - viewport.height / 2) * viewport.scale,
      crs: viewport.center.crs
    });
  }

  global.MineServicesMapCoordinateTransform = Object.freeze({
    worldToScreen,
    screenToWorld
  });
})(window);
