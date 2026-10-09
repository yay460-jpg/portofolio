(function (global) {
  'use strict';

  /*
   * V38 Checker Support Layer
   * -------------------------
   * Checker is no longer a standalone operational screen.
   * Operations is the operational entry point; this layer records the
   * field-observation evidence in A3.Checker when an operation carries
   * checker information.
   */

  const runtimeClient = global.LithositeRuntimeClient;
  if (!runtimeClient) {
    throw new Error('LithositeRuntimeClient is required before checker.js');
  }

  function normalize(value) {
    return String(value ?? '').trim();
  }

  function buildCheckerId(operationId) {
    return 'CHK-' + normalize(operationId).replace(/[^A-Za-z0-9_-]/g, '-');
  }

  function buildRecord(operation) {
    const checkerName = normalize(operation.checker_name);
    if (!checkerName) return null;

    if (!normalize(operation.end_time)) {
      throw new Error('End Time is required when Checker Name is provided.');
    }
    if (!normalize(operation.shift)) {
      throw new Error('Shift is required when Checker Name is provided.');
    }
    if (!normalize(operation.equipment_id)) {
      throw new Error('Equipment is required for a Checker observation.');
    }

    const retase = operation.retase === null || operation.retase === '' ||
      operation.retase === undefined ? null : Number(operation.retase);

    return {
      checker_id: buildCheckerId(operation.transaction_id),
      operation_id: operation.transaction_id,
      checker_name: checkerName,
      observation_date: operation.transaction_date,
      start_time: operation.transaction_time,
      end_time: operation.end_time,
      shift: operation.shift,
      equipment_id: operation.equipment_id,
      work_front_id: operation.work_front_id,
      activity: normalize(operation.activity),
      material: normalize(operation.material) || null,
      retase: Number.isFinite(retase) ? retase : null,
      source: 'Operations'
    };
  }

  async function findByOperation(operationId) {
    const result = await runtimeClient.request({
      operation: 'READ',
      entity: 'Checker'
    });
    const rows = Array.isArray(result.data) ? result.data : [];
    return rows.find(function (row) {
      return normalize(row.operation_id) === normalize(operationId);
    }) || null;
  }

  async function syncFromOperation(operation) {
    const record = buildRecord(operation);
    if (!record) {
      return { status: 'SKIPPED', reason: 'No Checker Name supplied.' };
    }

    const existing = await findByOperation(operation.transaction_id);

    // A validated Operation is historical evidence. Never silently rewrite its
    // existing Checker snapshot through the support layer.
    if (existing && String(operation.status || '').toUpperCase() === 'VALIDATED') {
      return {
        status: 'SKIPPED',
        reason: 'Validated Operation — existing Checker evidence is preserved.',
        checker_id: existing.checker_id
      };
    }

    const result = existing
      ? await runtimeClient.request({
          operation: 'UPDATE',
          entity: 'Checker',
          entity_id: existing.checker_id,
          patch: record
        })
      : await runtimeClient.request({
          operation: 'CREATE',
          entity: 'Checker',
          row: record
        });

    if (result.status !== 'COMMITTED') {
      const message = result.errors && result.errors.length
        ? result.errors.map(function (item) { return item.message; }).join('; ')
        : 'Checker evidence was rejected by RuntimeAdapter.';
      throw new Error(message);
    }

    return {
      status: existing ? 'UPDATED' : 'CREATED',
      checker_id: record.checker_id
    };
  }

  async function syncMissingFromOperations(operations) {
    const rows = Array.isArray(operations) ? operations : [];
    const result = await runtimeClient.request({
      operation: 'READ',
      entity: 'Checker'
    });
    const existingRows = Array.isArray(result.data) ? result.data : [];
    const existingOperationIds = new Set(existingRows.map(function (row) {
      return normalize(row.operation_id);
    }).filter(Boolean));
    const report = {
      created: 0,
      alreadyRecorded: 0,
      withoutCheckerName: 0,
      retaseWithoutCheckerName: 0,
      errors: []
    };

    for (const operation of rows) {
      const operationId = normalize(operation.transaction_id);
      if (!operationId) continue;
      const checkerName = normalize(operation.checker_name);
      if (!checkerName) {
        report.withoutCheckerName += 1;
        if (operation.retase !== null && operation.retase !== undefined &&
            String(operation.retase).trim() !== '') {
          report.retaseWithoutCheckerName += 1;
        }
        continue;
      }
      if (existingOperationIds.has(operationId)) {
        report.alreadyRecorded += 1;
        continue;
      }

      try {
        const record = buildRecord(operation);
        if (!record) {
          report.withoutCheckerName += 1;
          continue;
        }
        const created = await runtimeClient.request({
          operation: 'CREATE',
          entity: 'Checker',
          row: record
        });
        if (created.status !== 'COMMITTED') {
          const message = created.errors && created.errors.length
            ? created.errors.map(function (item) { return item.message; }).join('; ')
            : 'Checker evidence was rejected by RuntimeAdapter.';
          throw new Error(message);
        }
        existingOperationIds.add(operationId);
        report.created += 1;
      } catch (error) {
        report.errors.push({
          operation_id: operationId,
          message: error.message || 'Checker evidence could not be backfilled.'
        });
      }
    }
    return report;
  }

  async function getForOperation(operationId) {
    return findByOperation(operationId);
  }

  global.LithositeCheckerSupport = {
    buildRecord: buildRecord,
    syncFromOperation: syncFromOperation,
    syncMissingFromOperations: syncMissingFromOperations,
    getForOperation: getForOperation
  };
})(window);
