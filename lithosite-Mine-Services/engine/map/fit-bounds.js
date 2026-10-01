(function (global) {
  'use strict';

  function finite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be finite');
    return value;
  }

  function validBounds(bounds) {
    if (!bounds || typeof bounds !== 'object') throw new TypeError('bounds are required');
    finite(bounds.minX, 'bounds.minX');
    finite(bounds.maxX, 'bounds.maxX');
    finite(bounds.minY, 'bounds.minY');
    finite(bounds.maxY, 'bounds.maxY');
    if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
      throw new RangeError('bounds are invalid');
    }
    if (!bounds.crs || typeof bounds.crs.id !== 'string') {
      throw new TypeError('bounds CRS is required');
    }
    return bounds;
  }

  function sameCRS(a, b) {
    return a.id === b.id && a.type === b.type && a.axis === b.axis;
  }

  function fitBounds(bounds, viewport, options) {
    validBounds(bounds);
    if (!viewport || !viewport.center) throw new TypeError('viewport is required');
    if (!viewport.center.crs) throw new TypeError('viewport center CRS is required');
    finite(viewport.width, 'viewport.width');
    finite(viewport.height, 'viewport.height');
    if (viewport.width <= 0 || viewport.height <= 0) {
      throw new RangeError('viewport dimensions must be greater than zero');
    }
    if (!sameCRS(bounds.crs, viewport.center.crs)) {
      throw new Error('Bounds CRS does not match viewport CRS');
    }

    options = options || {};
    const padding = options.padding === undefined ? 0 : finite(options.padding, 'padding');
    if (padding < 0 || padding * 2 >= Math.min(viewport.width, viewport.height)) {
      throw new RangeError('padding is invalid');
    }

    const usableWidth = viewport.width - padding * 2;
    const usableHeight = viewport.height - padding * 2;
    const extentX = bounds.maxX - bounds.minX;
    const extentY = bounds.maxY - bounds.minY;
    const scaleX = extentX === 0 ? 0 : extentX / usableWidth;
    const scaleY = extentY === 0 ? 0 : extentY / usableHeight;
    const scale = Math.max(scaleX, scaleY, Number.EPSILON);

    return Object.freeze({
      center: Object.freeze({
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
        crs: viewport.center.crs
      }),
      width: viewport.width,
      height: viewport.height,
      scale: scale,
      zoom: viewport.zoom === undefined ? 0 : viewport.zoom,
      padding: padding
    });
  }

  global.MineServicesMapFitBounds = Object.freeze({ fitBounds });
})(window);
