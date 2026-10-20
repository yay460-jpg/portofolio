(function (global) {
  'use strict';

  const center = global.LithositeKPIEngine;
  const contract = global.LithositeEffectiveTimeContract;

  if (!center) {
    throw new Error('LithositeKPIEngine is required before eu-engine.js');
  }

  if (!contract) {
    throw new Error('LithositeEffectiveTimeContract is required before eu-engine.js');
  }

  const ENGINE_ID = 'EU';

  function calculate(input) {
    const payload = input || {};

    const timelineResult = center.classifyTimeline(
      payload.timeline || []
    );

    if (timelineResult.status !== 'READY') {
      return {
        kpi: ENGINE_ID,
        status: timelineResult.status,
        value: null,
        unit: '%',
        reason: 'Timeline is not ready for EU evaluation.',
        issues: timelineResult.issues || []
      };
    }

    const evidence = contract.summarize({
      timeline: payload.timeline || [],
      availableHours: payload.availableHours,
      effectiveHours: payload.effectiveHours
    });

    if (evidence.status !== 'READY') {
      return {
        kpi: ENGINE_ID,
        status: evidence.status,
        value: null,
        unit: '%',
        reason: evidence.reason || 'Effective Time evidence is not validated.',
        evidence
      };
    }

    const result = center.calculateEU({
      effectiveHours: evidence.effectiveHours,
      availableHours: evidence.availableHours
    });

    return Object.assign({}, result, {
      engine: ENGINE_ID,
      evidence
    });
  }

  const api = Object.freeze({
    id: ENGINE_ID,
    name: 'Equipment Effectiveness',
    version: 'V35-EU-ENGINE-0.1',
    status: center.ENGINE_STATUS.ACTIVE,
    calculate
  });

  center.registerEngine(ENGINE_ID, api);
  global.LithositeEUEngine = api;
})(window);
