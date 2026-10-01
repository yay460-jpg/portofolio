(function (global) {
  'use strict';

  const REQUIRED = Object.freeze([
    'prepare',
    'render',
    'resize',
    'destroy'
  ]);

  function validateRenderer(renderer) {
    if (!renderer || typeof renderer !== 'object') {
      throw new TypeError('renderer is required');
    }

    REQUIRED.forEach(function (method) {
      if (typeof renderer[method] !== 'function') {
        throw new TypeError('renderer.' + method + ' is required');
      }
    });

    return true;
  }

  function createRendererBoundary(renderer) {
    validateRenderer(renderer);

    let prepared = false;
    let destroyed = false;

    function assertAlive() {
      if (destroyed) throw new Error('Renderer boundary has been destroyed');
    }

    function prepare(context) {
      assertAlive();
      if (!prepared) {
        renderer.prepare(context);
        prepared = true;
      }
      return true;
    }

    function render(snapshot) {
      assertAlive();
      if (!prepared) throw new Error('Renderer boundary must be prepared before render');
      return renderer.render(snapshot);
    }

    function resize(width, height) {
      assertAlive();
      if (!Number.isFinite(width) || width <= 0) {
        throw new RangeError('renderer width must be greater than zero');
      }
      if (!Number.isFinite(height) || height <= 0) {
        throw new RangeError('renderer height must be greater than zero');
      }
      return renderer.resize(width, height);
    }

    function destroy() {
      if (destroyed) return;
      renderer.destroy();
      destroyed = true;
      prepared = false;
    }

    return Object.freeze({
      prepare,
      render,
      resize,
      destroy
    });
  }

  global.MineServicesMapRendererBoundary = Object.freeze({
    REQUIRED,
    validateRenderer,
    createRendererBoundary
  });
})(window);
