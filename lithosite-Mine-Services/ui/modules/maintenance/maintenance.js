(function (global) {
  'use strict';

  const MODULE = 'Maintenance';

  function runtime() {
    return global.LithositeRuntimeAdapter || global.RuntimeAdapter || null;
  }

  function requestId(action, id) {
    return 'stage11-maintenance-' + action.toLowerCase() + '-' + (id || Date.now()) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function readAll() {
    const rt = runtime();
    if (!rt || typeof rt.read !== 'function') return [];
    return rt.read(MODULE) || [];
  }

  function getLists() {
    const rt = runtime();
    if (!rt || typeof rt.read !== 'function') return {};
    return rt.read('_Lists') || {};
  }

  function create(row) {
    const rt = runtime();
    if (!rt || typeof rt.create !== 'function') throw new Error('RuntimeAdapter is not connected.');
    return rt.create(MODULE, row, requestId('CREATE', row.maintenance_id));
  }

  function update(id, patch) {
    const rt = runtime();
    if (!rt || typeof rt.update !== 'function') throw new Error('RuntimeAdapter is not connected.');
    return rt.update(MODULE, id, patch, requestId('UPDATE', id));
  }

  function remove(id) {
    const rt = runtime();
    if (!rt || typeof rt.delete !== 'function') throw new Error('RuntimeAdapter is not connected.');
    return rt.delete(MODULE, id, requestId('DELETE', id));
  }

  function init() {
    global.LithositeMaintenance = Object.freeze({
      entity: MODULE,
      readAll,
      getLists,
      create,
      update,
      delete: remove
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);