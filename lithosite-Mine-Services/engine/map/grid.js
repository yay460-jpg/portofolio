/* ============================================================
 * MINE SERVICES — Standalone Map Engine
 * Stage 19.6 — Grid Engine
 *
 * Platform-neutral grid generation. No UI or renderer dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  function finite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be finite');
    return value;
  }

  function positive(value, field) {
    finite(value, field);
    if (value <= 0) throw new RangeError(field + ' must be greater than zero');
    return value;
  }

  function validBounds(bounds) {
    if (!bounds || !bounds.crs) throw new TypeError('bounds with CRS are required');
    finite(bounds.minX, 'bounds.minX');
    finite(bounds.maxX, 'bounds.maxX');
    finite(bounds.minY, 'bounds.minY');
    finite(bounds.maxY, 'bounds.maxY');
    if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
      throw new RangeError('grid bounds are invalid');
    }
    return bounds;
  }

  function gridIndex(value, spacing) {
    return Math.floor(value / spacing);
  }

  function createGrid(options) {
    options = options || {};

    var spacing = positive(
      options.spacing === undefined ? 10 : options.spacing,
      'spacing'
    );

    var majorEvery = positive(
      options.majorEvery === undefined ? 5 : options.majorEvery,
      'majorEvery'
    );

    function setOptions(next) {
      next = next || {};
      if (next.spacing !== undefined) spacing = positive(next.spacing, 'spacing');
      if (next.majorEvery !== undefined) majorEvery = positive(next.majorEvery, 'majorEvery');
      return getOptions();
    }

    function getOptions() {
      return Object.freeze({
        spacing: spacing,
        majorEvery: majorEvery
      });
    }

    function generate(bounds) {
      validBounds(bounds);

      var startX = Math.floor(bounds.minX / spacing) * spacing;
      var startY = Math.floor(bounds.minY / spacing) * spacing;
      var lines = [];
      var xCount = 0;
      var yCount = 0;

      for (var x = startX; x <= bounds.maxX; x += spacing) {
        lines.push(Object.freeze({
          orientation: 'vertical',
          index: gridIndex(x, spacing),
          coordinate: x,
          major: Math.abs(gridIndex(x, spacing)) % majorEvery === 0,
          start: Object.freeze({ x: x, y: bounds.minY }),
          end: Object.freeze({ x: x, y: bounds.maxY }),
          crs: bounds.crs
        }));
        xCount += 1;
      }

      for (var y = startY; y <= bounds.maxY; y += spacing) {
        lines.push(Object.freeze({
          orientation: 'horizontal',
          index: gridIndex(y, spacing),
          coordinate: y,
          major: Math.abs(gridIndex(y, spacing)) % majorEvery === 0,
          start: Object.freeze({ x: bounds.minX, y: y }),
          end: Object.freeze({ x: bounds.maxX, y: y }),
          crs: bounds.crs
        }));
        yCount += 1;
      }

      return Object.freeze({
        spacing: spacing,
        majorEvery: majorEvery,
        bounds: Object.freeze({
          minX: bounds.minX,
          maxX: bounds.maxX,
          minY: bounds.minY,
          maxY: bounds.maxY,
          crs: bounds.crs
        }),
        verticalCount: xCount,
        horizontalCount: yCount,
        lines: Object.freeze(lines)
      });
    }

    function generateFromViewport(viewport) {
      if (!viewport || typeof viewport !== 'object') {
        throw new TypeError('viewport is required');
      }
      if (!viewport.center || !viewport.center.crs) {
        throw new TypeError('viewport center with CRS is required');
      }
      positive(viewport.width, 'viewport.width');
      positive(viewport.height, 'viewport.height');
      positive(viewport.scale, 'viewport.scale');

      return generate({
        minX: viewport.center.x - viewport.width * viewport.scale / 2,
        maxX: viewport.center.x + viewport.width * viewport.scale / 2,
        minY: viewport.center.y - viewport.height * viewport.scale / 2,
        maxY: viewport.center.y + viewport.height * viewport.scale / 2,
        crs: viewport.center.crs
      });
    }

    return Object.freeze({
      setOptions,
      getOptions,
      generate,
      generateFromViewport
    });
  }

  global.MineServicesMapGrid = Object.freeze({
    createGrid
  });
})(window);
