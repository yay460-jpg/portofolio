/* MG1 V25.4 — MAP LAYER CAPABILITY
 *
 * Read/query boundary for semantic Map Layers.
 * No IndexedDB access, renderer access, Map lifecycle access, or UI ownership.
 * Layer visibility here means semantic layer visibility, not viewport visibility.
 */
(function (global) {
  'use strict';

  var C = global.MG1MapLayerContract;
  var L = global.MG1MapLayerLibrary;
  if (!C) throw new Error('MG1MapLayerCapability requires MG1MapLayerContract');
  if (!L) throw new Error('MG1MapLayerCapability requires MG1MapLayerLibrary');

  function normalizeMapId(value) {
    if (typeof value !== 'string' || !value.trim()) {
      var e = new Error(C.errors.INVALID_MAP_ID);
      e.code = C.errors.INVALID_MAP_ID;
      throw e;
    }
    return value.trim();
  }

  function normalizeQuery(value) {
    return String(value === undefined || value === null ? '' : value).trim().toLocaleLowerCase();
  }

  function compareText(a, b) {
    return String(a || '').localeCompare(String(b || ''), 'id', {
      sensitivity: 'base',
      numeric: true
    });
  }

  function compareRows(a, b, sortBy) {
    var result = 0;
    if (sortBy === 'name') result = compareText(a.name, b.name);
    else if (sortBy === 'type') result = compareText(a.type, b.type);
    else if (sortBy === 'id') result = compareText(a.id, b.id);
    else {
      var ao = Number.isFinite(a.order) ? a.order : 0;
      var bo = Number.isFinite(b.order) ? b.order : 0;
      result = ao - bo;
    }

    if (result !== 0) return result;
    result = compareText(a.name, b.name);
    if (result !== 0) return result;
    return compareText(a.id, b.id);
  }

  async function list(options) {
    options = options || {};
    var mapId = normalizeMapId(options.mapId);
    var rows = await L.getLayers(mapId);
    var query = normalizeQuery(options.query);
    var type = options.type === undefined || options.type === null
      ? null : String(options.type).trim().toLocaleLowerCase();
    var visible = options.visible === undefined || options.visible === null
      ? null : options.visible;

    if (visible !== null && typeof visible !== 'boolean') {
      var ve = new Error(C.errors.INVALID_VISIBLE);
      ve.code = C.errors.INVALID_VISIBLE;
      throw ve;
    }

    var activeId = null;
    var activeFilter = options.active;
    if (activeFilter !== undefined && activeFilter !== null && typeof activeFilter !== 'boolean') {
      var ae = new Error(C.errors.INVALID_INPUT);
      ae.code = C.errors.INVALID_INPUT;
      throw ae;
    }
    if (activeFilter === true || activeFilter === false) {
      activeId = await L.getActiveLayer(mapId);
    }

    var filtered = rows.filter(function (row) {
      if (!row) return false;
      if (query) {
        var haystack = [row.name, row.id, row.type].map(function (v) {
          return String(v || '').toLocaleLowerCase();
        });
        if (!haystack.some(function (v) { return v.includes(query); })) return false;
      }
      if (type !== null && String(row.type || '').toLocaleLowerCase() !== type) return false;
      if (visible !== null && row.visible !== visible) return false;
      if (activeFilter === true && row.id !== activeId) return false;
      if (activeFilter === false && row.id === activeId) return false;
      return true;
    });

    var sortBy = options.sortBy || 'order';
    if (['order', 'name', 'type', 'id'].indexOf(sortBy) === -1) {
      var se = new Error(C.errors.INVALID_INPUT);
      se.code = C.errors.INVALID_INPUT;
      throw se;
    }
    var direction = options.direction || 'asc';
    if (direction !== 'asc' && direction !== 'desc') {
      var de = new Error(C.errors.INVALID_INPUT);
      de.code = C.errors.INVALID_INPUT;
      throw de;
    }

    filtered.sort(function (a, b) {
      var result = compareRows(a, b, sortBy);
      return direction === 'desc' ? -result : result;
    });

    return filtered;
  }

  async function summary(mapId) {
    mapId = normalizeMapId(mapId);
    var rows = await L.getLayers(mapId);
    var activeId = await L.getActiveLayer(mapId);
    var visibleCount = 0;
    var types = [];
    var seenTypes = Object.create(null);

    rows.forEach(function (row) {
      if (row && row.visible === true) visibleCount++;
      var key = String(row && row.type || 'generic');
      var lower = key.toLocaleLowerCase();
      if (!seenTypes[lower]) {
        seenTypes[lower] = true;
        types.push(key);
      }
    });

    types.sort(compareText);
    return {
      mapId: mapId,
      total: rows.length,
      visibleCount: visibleCount,
      hiddenCount: rows.length - visibleCount,
      activeId: activeId,
      hasActive: !!activeId && rows.some(function (row) { return row && row.id === activeId; }),
      types: types
    };
  }

  global.MG1MapLayerCapability = Object.freeze({
    version: '25.4-s01',
    list: list,
    summary: summary
  });

  console.log('[V25.4 MAP LAYER] Capability ready — query/filter/summary only');
})(window);
