(function (global) {
  'use strict';

  const STATES = Object.freeze({
    CREATED: 'created',
    PREPARED: 'prepared',
    READY: 'ready',
    DESTROYED: 'destroyed'
  });

  function finite(value, field) {
    if (!Number.isFinite(value)) throw new TypeError(field + ' must be finite');
    return value;
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function MineServicesMapEngine(options) {
    options = options || {};

    this.state = STATES.CREATED;
    this.crs = options.crs || null;
    this.viewport = null;
    this.layers = new Map();
    this.renderer = null;
    this.model = options.model || null;
    this.navigation = options.navigation || null;
    this.interaction = options.interaction || null;
    this.meta = Object.freeze({
      name: 'MineServicesMapEngine',
      version: '0.2.0'
    });
  }

  MineServicesMapEngine.prototype._assertAlive = function () {
    if (this.state === STATES.DESTROYED) {
      throw new Error('Map engine has been destroyed');
    }
  };

  MineServicesMapEngine.prototype.prepare = function (config) {
    this._assertAlive();
    if (this.state !== STATES.CREATED) return this;

    config = config || {};
    if (config.crs !== undefined) this.crs = config.crs;
    if (config.viewport !== undefined) this.viewport = clone(config.viewport);
    if (config.renderer !== undefined) this.renderer = config.renderer;
    if (config.model !== undefined) this.model = config.model;
    if (config.navigation !== undefined) this.navigation = config.navigation;
    if (config.interaction !== undefined) this.interaction = config.interaction;

    this.state = STATES.PREPARED;
    return this;
  };

  MineServicesMapEngine.prototype.ready = function () {
    this._assertAlive();
    if (this.state === STATES.CREATED) this.prepare();
    if (this.state === STATES.PREPARED) this.state = STATES.READY;
    return this;
  };

  MineServicesMapEngine.prototype.getState = function () {
    return this.state;
  };

  MineServicesMapEngine.prototype.getViewport = function () {
    this._assertAlive();
    if (this.navigation && typeof this.navigation.getViewport === 'function') {
      return this.navigation.getViewport();
    }
    return clone(this.viewport);
  };

  MineServicesMapEngine.prototype.setViewport = function (viewport) {
    this._assertAlive();
    if (!viewport || typeof viewport !== 'object') {
      throw new TypeError('viewport is required');
    }
    if (viewport.width !== undefined) finite(viewport.width, 'viewport.width');
    if (viewport.height !== undefined) finite(viewport.height, 'viewport.height');
    if (viewport.zoom !== undefined) finite(viewport.zoom, 'viewport.zoom');

    if (this.navigation && typeof this.navigation.setViewport === 'function') {
      const next = this.navigation.setViewport(viewport);
      this.viewport = clone(next);
      return clone(next);
    }

    this.viewport = clone(viewport);
    return this.getViewport();
  };

  MineServicesMapEngine.prototype.setRenderer = function (renderer) {
    this._assertAlive();
    if (renderer !== null && typeof renderer !== 'object') {
      throw new TypeError('renderer must be an object or null');
    }
    this.renderer = renderer;
    return this;
  };

  MineServicesMapEngine.prototype.getRenderer = function () {
    this._assertAlive();
    return this.renderer;
  };

  MineServicesMapEngine.prototype.setModel = function (model) {
    this._assertAlive();
    if (model !== null && (typeof model !== 'object' || typeof model.snapshot !== 'function')) {
      throw new TypeError('model must expose snapshot() or be null');
    }
    this.model = model;
    return this;
  };

  MineServicesMapEngine.prototype.getModel = function () {
    this._assertAlive();
    return this.model;
  };

  MineServicesMapEngine.prototype.setNavigation = function (navigation) {
    this._assertAlive();
    if (navigation !== null && typeof navigation !== 'object') {
      throw new TypeError('navigation must be an object or null');
    }
    this.navigation = navigation;
    return this;
  };

  MineServicesMapEngine.prototype.getNavigation = function () {
    this._assertAlive();
    return this.navigation;
  };

  MineServicesMapEngine.prototype.setInteraction = function (interaction) {
    this._assertAlive();
    if (interaction !== null && typeof interaction !== 'object') {
      throw new TypeError('interaction must be an object or null');
    }
    this.interaction = interaction;
    return this;
  };

  MineServicesMapEngine.prototype.getInteraction = function () {
    this._assertAlive();
    return this.interaction;
  };

  MineServicesMapEngine.prototype.addLayer = function (layer) {
    this._assertAlive();
    if (!layer || typeof layer !== 'object' || !layer.id) {
      throw new TypeError('layer with id is required');
    }
    if (this.layers.has(layer.id)) {
      throw new Error('Layer already exists: ' + layer.id);
    }
    this.layers.set(layer.id, clone(layer));
    return clone(layer);
  };

  MineServicesMapEngine.prototype.removeLayer = function (id) {
    this._assertAlive();
    return this.layers.delete(id);
  };

  MineServicesMapEngine.prototype.getLayers = function () {
    this._assertAlive();
    return Array.from(this.layers.values()).map(clone);
  };

  MineServicesMapEngine.prototype.clear = function () {
    this._assertAlive();
    this.layers.clear();
    this.viewport = null;
    return this;
  };

  MineServicesMapEngine.prototype.destroy = function () {
    if (this.state === STATES.DESTROYED) return;
    if (this.renderer && typeof this.renderer.destroy === 'function') {
      this.renderer.destroy();
    }
    if (this.navigation && typeof this.navigation.destroy === 'function') {
      this.navigation.destroy();
    }
    if (this.interaction && typeof this.interaction.destroy === 'function') {
      this.interaction.destroy();
    }
    this.renderer = null;
    this.navigation = null;
    this.interaction = null;
    this.model = null;
    this.layers.clear();
    this.viewport = null;
    this.crs = null;
    this.state = STATES.DESTROYED;
  };

  global.MineServicesMapEngine = MineServicesMapEngine;
  global.MineServicesMapEngineStates = STATES;
})(window);
