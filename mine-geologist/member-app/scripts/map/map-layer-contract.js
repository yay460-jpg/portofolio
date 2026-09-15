/* MG1 V25.1 — MAP LAYER DATA CONTRACT
 *
 * Contract-only boundary for the semantic Map Layer Platform.
 * This file does NOT own IndexedDB, UI, activation, rendering, tiles,
 * GeoReference, or Feature persistence.
 *
 * Important terminology boundary:
 * "Layer" here means a semantic/persistent map layer.
 * Renderer/tile layers inside peta.js remain protected and are unrelated.
 */
(function (global) {
  'use strict';

  var VERSION = '25.1-s01';
  var SCHEMA_VERSION = 1;

  var REQUIRED = ['id', 'mapId', 'name'];
  var OPTIONAL = ['type', 'order', 'visible', 'metadata', 'schemaVersion'];
  var FORBIDDEN = [
    'active', 'features', 'tiles', 'tilePyramid', 'imageDataUrl',
    'geoReference', 'canvas', 'rendererState', 'activeBackgroundMapId'
  ];

  var ERROR = Object.freeze({
    INVALID_INPUT: 'MG1_LAYER_INVALID_INPUT',
    INVALID_ID: 'MG1_LAYER_INVALID_ID',
    INVALID_MAP_ID: 'MG1_LAYER_INVALID_MAP_ID',
    INVALID_NAME: 'MG1_LAYER_INVALID_NAME',
    INVALID_TYPE: 'MG1_LAYER_INVALID_TYPE',
    INVALID_ORDER: 'MG1_LAYER_INVALID_ORDER',
    INVALID_VISIBLE: 'MG1_LAYER_INVALID_VISIBLE',
    INVALID_METADATA: 'MG1_LAYER_INVALID_METADATA',
    INVALID_SCHEMA_VERSION: 'MG1_LAYER_INVALID_SCHEMA_VERSION',
    NOT_FOUND: 'MG1_LAYER_NOT_FOUND',
    MAP_NOT_FOUND: 'MG1_LAYER_MAP_NOT_FOUND',
    MAP_MISMATCH: 'MG1_LAYER_MAP_MISMATCH',
    NOT_VISIBLE: 'MG1_LAYER_NOT_VISIBLE',
    DUPLICATE_ID: 'MG1_LAYER_DUPLICATE_ID',
    STORAGE_ERROR: 'MG1_LAYER_STORAGE_ERROR',
    TRANSACTION_ABORTED: 'MG1_LAYER_TRANSACTION_ABORTED',
    FORBIDDEN_FIELD: 'MG1_LAYER_FORBIDDEN_FIELD'
  });

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function nonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function cloneMetadata(value) {
    if (value === undefined) return {};
    if (!isObject(value)) return null;
    var output = {};
    Object.keys(value).forEach(function (key) {
      output[key] = value[key];
    });
    return output;
  }

  function validate(input) {
    var errors = [];

    if (!isObject(input)) {
      return { ok: false, errors: [ERROR.INVALID_INPUT] };
    }

    REQUIRED.forEach(function (key) {
      if (input[key] === undefined || input[key] === null) {
        errors.push(key === 'id' ? ERROR.INVALID_ID :
          key === 'mapId' ? ERROR.INVALID_MAP_ID : ERROR.INVALID_NAME);
      }
    });

    if (input.id !== undefined && !nonEmptyString(String(input.id))) {
      errors.push(ERROR.INVALID_ID);
    }
    if (input.mapId !== undefined && !nonEmptyString(String(input.mapId))) {
      errors.push(ERROR.INVALID_MAP_ID);
    }
    if (input.name !== undefined && !nonEmptyString(String(input.name))) {
      errors.push(ERROR.INVALID_NAME);
    }
    if (input.type !== undefined && !nonEmptyString(String(input.type))) {
      errors.push(ERROR.INVALID_TYPE);
    }
    if (input.order !== undefined &&
        (typeof input.order !== 'number' || !Number.isFinite(input.order))) {
      errors.push(ERROR.INVALID_ORDER);
    }
    if (input.visible !== undefined && typeof input.visible !== 'boolean') {
      errors.push(ERROR.INVALID_VISIBLE);
    }
    if (input.metadata !== undefined && !isObject(input.metadata)) {
      errors.push(ERROR.INVALID_METADATA);
    }
    if (input.schemaVersion !== undefined && input.schemaVersion !== SCHEMA_VERSION) {
      errors.push(ERROR.INVALID_SCHEMA_VERSION);
    }

    FORBIDDEN.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        errors.push(ERROR.FORBIDDEN_FIELD + ':' + key);
      }
    });

    return { ok: errors.length === 0, errors: errors };
  }

  function normalize(input) {
    var result = validate(input);
    if (!result.ok) {
      var error = new Error(result.errors.join(', '));
      error.code = ERROR.INVALID_INPUT;
      error.errors = result.errors.slice();
      throw error;
    }

    return {
      id: String(input.id).trim(),
      mapId: String(input.mapId).trim(),
      name: String(input.name).trim(),
      type: input.type !== undefined ? String(input.type).trim() : 'generic',
      order: input.order !== undefined ? input.order : 0,
      visible: input.visible !== undefined ? input.visible : true,
      metadata: cloneMetadata(input.metadata),
      schemaVersion: SCHEMA_VERSION
    };
  }

  function listFields() {
    return {
      required: REQUIRED.slice(),
      optional: OPTIONAL.slice(),
      forbidden: FORBIDDEN.slice()
    };
  }

  global.MG1MapLayerContract = Object.freeze({
    version: VERSION,
    schemaVersion: SCHEMA_VERSION,
    errors: ERROR,
    validate: validate,
    normalize: normalize,
    listFields: listFields
  });

  console.log('[V25.1 MAP LAYER] Contract ready — semantic Layer only; runtime protected');
})(window);
