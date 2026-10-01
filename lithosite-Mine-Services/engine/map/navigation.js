/* ============================================================
 * MINE SERVICES — Standalone Map Engine
 * Stage 19.5 — Pan / Zoom
 *
 * Platform-neutral viewport navigation. No UI or renderer dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  function finite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be finite');
    return value;
  }

  function coordinate(value) {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y) || !value.crs) {
      throw new TypeError('viewport center must be a valid coordinate');
    }
    return value;
  }

  function cloneCoordinate(value) {
    return Object.freeze({
      x: value.x,
      y: value.y,
      crs: value.crs
    });
  }

  function validateViewport(viewport) {
    if (!viewport || !viewport.center) throw new TypeError('viewport is required');
    coordinate(viewport.center);
    finite(viewport.width, 'viewport.width');
    finite(viewport.height, 'viewport.height');
    finite(viewport.scale, 'viewport.scale');
    if (viewport.width <= 0 || viewport.height <= 0) {
      throw new RangeError('viewport dimensions must be greater than zero');
    }
    if (viewport.scale <= 0) throw new RangeError('viewport.scale must be greater than zero');
  }

  function cloneViewport(viewport) {
    validateViewport(viewport);
    return {
      center: cloneCoordinate(viewport.center),
      width: viewport.width,
      height: viewport.height,
      scale: viewport.scale,
      zoom: viewport.zoom
    };
  }

  function createNavigation(viewport, options) {
    validateViewport(viewport);
    options = options || {};

    var minZoom = options.minZoom === undefined ? -20 : finite(options.minZoom, 'minZoom');
    var maxZoom = options.maxZoom === undefined ? 20 : finite(options.maxZoom, 'maxZoom');
    if (minZoom > maxZoom) throw new RangeError('minZoom must not exceed maxZoom');

    var state = cloneViewport(viewport);
    if (state.zoom === undefined) state.zoom = 0;
    finite(state.zoom, 'viewport.zoom');
    state.zoom = Math.max(minZoom, Math.min(maxZoom, state.zoom));

    var baseScale = state.scale;

    function snapshot() {
      return Object.freeze(cloneViewport(state));
    }

    function setViewport(next) {
      validateViewport(next);
      state = cloneViewport(next);
      if (state.zoom === undefined) state.zoom = 0;
      state.zoom = Math.max(minZoom, Math.min(maxZoom, finite(state.zoom, 'viewport.zoom')));
      baseScale = state.scale / Math.pow(2, state.zoom);
      return snapshot();
    }

    function pan(deltaX, deltaY) {
      finite(deltaX, 'deltaX');
      finite(deltaY, 'deltaY');
      state.center = cloneCoordinate({
        x: state.center.x + deltaX * state.scale,
        y: state.center.y - deltaY * state.scale,
        crs: state.center.crs
      });
      return snapshot();
    }

    function zoomBy(delta, anchor) {
      finite(delta, 'delta');
      if (anchor !== undefined) {
        if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
          throw new TypeError('zoom anchor must contain finite x and y');
        }
      }

      var oldZoom = state.zoom;
      var nextZoom = Math.max(minZoom, Math.min(maxZoom, oldZoom + delta));
      var actualDelta = nextZoom - oldZoom;
      if (actualDelta === 0) return snapshot();

      var oldScale = state.scale;
      var nextScale = baseScale * Math.pow(2, nextZoom);

      if (anchor) {
        var worldX = state.center.x + (anchor.x - state.width / 2) * oldScale;
        var worldY = state.center.y - (anchor.y - state.height / 2) * oldScale;
        state.center = cloneCoordinate({
          x: worldX - (anchor.x - state.width / 2) * nextScale,
          y: worldY + (anchor.y - state.height / 2) * nextScale,
          crs: state.center.crs
        });
      }

      state.scale = nextScale;
      state.zoom = nextZoom;
      return snapshot();
    }

    function zoomAtPoint(delta, anchor) {
      return zoomBy(delta, anchor);
    }

    function getBounds() {
      return Object.freeze({
        minX: state.center.x - (state.width / 2) * state.scale,
        maxX: state.center.x + (state.width / 2) * state.scale,
        minY: state.center.y - (state.height / 2) * state.scale,
        maxY: state.center.y + (state.height / 2) * state.scale,
        crs: state.center.crs
      });
    }

    return Object.freeze({
      getViewport: snapshot,
      setViewport,
      pan,
      zoom: zoomBy,
      zoomAtPoint,
      getBounds
    });
  }

  global.MineServicesMapNavigation = Object.freeze({
    createNavigation
  });
})(window);
