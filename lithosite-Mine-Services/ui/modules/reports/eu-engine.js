/*
 * V34 — EU Engine
 * Equipment Effectiveness
 *
 * EU remains definition-pending in V34.
 * This engine exists to reserve the KPI boundary without
 * hard-coding a site/company-specific denominator.
 *
 * The engine accepts effectiveHours only as evidence/input for
 * future definition work. It does not calculate a percentage yet.
 */

(function (global) {
  'use strict';

  const center = global.LithositeKPIEngine;
  if (!center) {
    throw new Error('LithositeKPIEngine is required before eu-engine.js');
  }

  const ENGINE_ID = 'EU';

  function calculate(input) {
    const payload = input || {};
    const timelineResult = center.classifyTimeline(payload.timeline || []);

    if (timelineResult.status !== center.KPI_STATUS.READY) {
      return {
        kpi: ENGINE_ID,
        status: timelineResult.status,
        value: null,
        unit: '%',
        reason: 'Timeline is not ready for EU definition evaluation.',
        issues: timelineResult.issues || []
      };
    }

    const hasEffectiveEvidence =
      payload.effectiveHours !== undefined &&
      payload.effectiveHours !== null &&
      payload.effectiveHours !== '';

    let effectiveHours = null;
    if (hasEffectiveEvidence) {
      effectiveHours = Number(payload.effectiveHours);
      if (!Number.isFinite(effectiveHours) || effectiveHours < 0) {
        return {
          kpi: ENGINE_ID,
          status: center.KPI_STATUS.INVALID_INPUT,
          value: null,
          unit: '%',
          reason: 'Effective Time evidence is invalid.'
        };
      }
    }

    return {
      kpi: ENGINE_ID,
      engine: ENGINE_ID,
      status: center.KPI_STATUS.PENDING_DEFINITION,
      value: null,
      unit: '%',
      reason: 'EU formula and denominator are not locked; follow the applicable company/site SOP.',
      evidence: hasEffectiveEvidence ? { effectiveHours: effectiveHours } : null,
      timelineStatus: timelineResult.status
    };
  }

  const api = Object.freeze({
    id: ENGINE_ID,
    name: 'Equipment Effectiveness',
    status: center.ENGINE_STATUS.ACTIVE,
    calculate
  });

  center.registerEngine(ENGINE_ID, api);
  global.LithositeEUEngine = api;
})(window);
