(function (global) {
  'use strict';

  function validEngine(engine) {
    if (!engine || typeof engine !== 'object') {
      throw new TypeError('map engine is required');
    }
    return engine;
  }

  function createEngineSession(engine, rendererBoundary) {
    validEngine(engine);

    if (!rendererBoundary || typeof rendererBoundary.prepare !== 'function' ||
        typeof rendererBoundary.render !== 'function' ||
        typeof rendererBoundary.resize !== 'function' ||
        typeof rendererBoundary.destroy !== 'function') {
      throw new TypeError('renderer boundary is required');
    }

    let started = false;
    let destroyed = false;

    function assertAlive() {
      if (destroyed) throw new Error('engine session has been destroyed');
    }

    function prepare(context) {
      assertAlive();
      rendererBoundary.prepare(context);
      started = true;
      return engine;
    }

    function render(snapshot) {
      assertAlive();
      if (!started) throw new Error('engine session must be prepared before render');
      return rendererBoundary.render(snapshot);
    }

    function resize(width, height) {
      assertAlive();
      return rendererBoundary.resize(width, height);
    }

    function destroy() {
      if (destroyed) return;
      rendererBoundary.destroy();
      if (typeof engine.destroy === 'function') engine.destroy();
      destroyed = true;
      started = false;
    }

    function isStarted() {
      return started;
    }

    return Object.freeze({
      prepare,
      render,
      resize,
      destroy,
      isStarted
    });
  }

  global.MineServicesMapEngineSession = Object.freeze({
    createEngineSession
  });
})(window);
