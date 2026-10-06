(function (global) {
  'use strict';

  const HOST = 'http://127.0.0.1:8765';

  function requestId(prefix) {
    const head = prefix || 'runtime';
    return head + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
  }

  async function request(req) {
    const payload = Object.assign({}, req, {
      request_id: req.request_id || requestId('runtime')
    });

    const response = await fetch(HOST + '/runtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.errors && result.errors[0] && result.errors[0].message
          ? result.errors[0].message
          : 'Runtime host request failed'
      );
    }

    const mutating = ['CREATE', 'UPDATE', 'DELETE', 'IMPORT_XLSX', 'RESTORE', 'LOAD_DATASET'].includes(String(req.operation || '').toUpperCase());
    const committed = result.status === 'COMMITTED';
    if (mutating && committed) {
      window.dispatchEvent(new CustomEvent('lithosite:runtime-mutated', {
        detail: {
          operation: String(req.operation || '').toUpperCase(),
          entity: req.entity || null,
          entity_id: req.entity_id || null,
          request_id: payload.request_id
        }
      }));
    }

    return result;
  }

  async function health() {
    const response = await fetch(HOST + '/health');
    return response.json();
  }

  global.LithositeRuntimeClient = Object.freeze({
    HOST,
    request,
    health,
    requestId
  });
})(window);
