/* MG1 V24.3 — MAP LIBRARY DATA CONTRACT (Slice 13)
 *
 * Read-only contract layer. This file does NOT become the owner of storage,
 * activation, deletion, rendering, or upload. It defines the canonical
 * metadata shape that later Map Library slices will consume.
 *
 * Safety rule: preserve the existing map entry object and payload. Contract
 * helpers only read/validate fields; they never mutate persisted entries.
 */
(function (global) {
  'use strict';

  var REQUIRED = ['id', 'name'];
  var OPTIONAL = [
    'imageDataUrl', 'cornerTL', 'cornerBR', 'geoReference',
    'tilePyramid', 'uploadedAt', 'uploadedBy', 'labels', 'collectionNames', 'folderName'
  ];

  function isObject(value) {
    return value !== null && typeof value === 'object';
  }

  function validate(entry) {
    var errors = [];
    if (!isObject(entry)) return { ok: false, errors: ['entry is not an object'] };
    REQUIRED.forEach(function (key) {
      if (entry[key] === undefined || entry[key] === null || String(entry[key]).trim() === '') {
        errors.push('missing ' + key);
      }
    });
    return { ok: errors.length === 0, errors: errors };
  }

  function metadata(entry) {
    if (!isObject(entry)) return null;
    return {
      id: entry.id != null ? String(entry.id) : '',
      name: entry.name != null ? String(entry.name) : '',
      uploadedAt: entry.uploadedAt || null,
      uploadedBy: entry.uploadedBy || null,
      labels: Array.isArray(entry.labels) ? entry.labels.map(function(v){ return String(v || '').trim(); }).filter(Boolean) : (entry.folderName ? [String(entry.folderName).trim()] : []),
      collectionNames: Array.isArray(entry.collectionNames) ? entry.collectionNames.map(function(v){ return String(v || '').trim(); }).filter(Boolean) : [],
      hasPreview: typeof entry.imageDataUrl === 'string' && entry.imageDataUrl.length > 0,
      hasGeoReference: isObject(entry.geoReference),
      hasTilePyramid: isObject(entry.tilePyramid),
      cornerTL: isObject(entry.cornerTL) ? {
        timur: entry.cornerTL.timur,
        utara: entry.cornerTL.utara
      } : null,
      cornerBR: isObject(entry.cornerBR) ? {
        timur: entry.cornerBR.timur,
        utara: entry.cornerBR.utara
      } : null
    };
  }

  function listFields() {
    return { required: REQUIRED.slice(), optional: OPTIONAL.slice() };
  }

  global.MG1MapLibraryContract = Object.freeze({
    version: '24.3-s13',
    validate: validate,
    metadata: metadata,
    listFields: listFields
  });

  console.log('[V24.3 MAP LIBRARY] Data contract ready — read-only; behavior unchanged');
})(window);
