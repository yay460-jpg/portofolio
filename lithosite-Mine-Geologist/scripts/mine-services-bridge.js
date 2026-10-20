// ============================================================
// MINE SERVICES BRIDGE — Stage 6 host boundary
// ============================================================
//
// This file does NOT implement Mine Services persistence.
// It provides a transport-neutral host bridge for the Stage 5
// RuntimeAdapter contract.
//
// A concrete local executor must be injected by the host runtime.
// ============================================================

(function () {
  'use strict';

  const OPERATIONS = new Set([
    'CREATE', 'UPDATE', 'DELETE', 'READ',
    'IMPORT_XLSX', 'BACKUP', 'RESTORE'
  ]);

  function createRequestId(prefix) {
    const safePrefix = String(prefix || 'mine-services');
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return safePrefix + '-' + globalThis.crypto.randomUUID();
    }
    return safePrefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  class MineServicesBridgeError extends Error {
    constructor(code, message) {
      super(message);
      this.name = 'MineServicesBridgeError';
      this.code = code;
    }
  }

  class MineServicesBridge {
    constructor(executor) {
      if (typeof executor !== 'function') {
        throw new MineServicesBridgeError(
          'HOST-001',
          'A concrete local runtime executor is required.'
        );
      }
      this._executor = executor;
    }

    async call(operation, payload, requestId) {
      if (!OPERATIONS.has(operation)) {
        throw new MineServicesBridgeError(
          'HOST-002',
          'Unsupported Mine Services operation.'
        );
      }

      const id = String(requestId || createRequestId('mine-services'));
      const request = {
        request_id: id,
        operation,
        ...(payload && typeof payload === 'object' ? payload : {})
      };

      try {
        const result = await this._executor(request);
        if (!result || typeof result !== 'object') {
          throw new MineServicesBridgeError(
            'HOST-003',
            'Invalid runtime response.'
          );
        }
        if (!Object.prototype.hasOwnProperty.call(result, 'request_id')) {
          throw new MineServicesBridgeError(
            'HOST-003',
            'Runtime response is missing request_id.'
          );
        }
        return result;
      } catch (error) {
        if (error instanceof MineServicesBridgeError) throw error;
        throw new MineServicesBridgeError(
          'HOST-004',
          'Mine Services runtime invocation failed.'
        );
      }
    }
  }

  globalThis.MineServicesBridge = MineServicesBridge;
  globalThis.MineServicesBridgeError = MineServicesBridgeError;
  globalThis.createMineServicesRequestId = createRequestId;
})();
