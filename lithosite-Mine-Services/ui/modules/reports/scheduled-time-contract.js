/*
 * V34 — Scheduled Time Contract
 *
 * Bridges a resolved Time Baseline to the PA denominator without
 * inventing a company/site-specific Scheduled Time formula.
 *
 * READY is possible only when an explicit scheduledHours value is
 * supplied by an approved upstream definition.
 */

(function (global) {
  'use strict';

  const center = global.LithositeKPIEngine;
  const baselineResolver = global.LithositeTimeBaselineResolver;

  if (!center) {
    throw new Error('LithositeKPIEngine is required before scheduled-time-contract.js');
  }

  if (!baselineResolver) {
    throw new Error('LithositeTimeBaselineResolver is required before scheduled-time-contract.js');
  }

  function build(resolution, scheduledHours) {
    if (!resolution || resolution.status !== center.KPI_STATUS.READY) {
      return {
        status: center.KPI_STATUS.NEEDS_VALIDATION,
        scheduledHours: null,
        sourceBaselineId: null,
        issues: ['TIME_BASELINE_NOT_READY']
      };
    }

    const hours = Number(scheduledHours);

    if (!Number.isFinite(hours) || hours <= 0) {
      return {
        status: center.KPI_STATUS.PENDING_DEFINITION,
        scheduledHours: null,
        sourceBaselineId: resolution.baseline.baseline_id,
        issues: ['SCHEDULED_TIME_FORMULA_NOT_LOCKED']
      };
    }

    return {
      status: center.KPI_STATUS.READY,
      scheduledHours: hours,
      sourceBaselineId: resolution.baseline.baseline_id,
      definitionSource: 'EXPLICIT_APPROVED_INPUT',
      issues: []
    };
  }

  const api = Object.freeze({
    id: 'SCHEDULED_TIME_CONTRACT',
    status: center.ENGINE_STATUS.ACTIVE,
    build
  });

  global.LithositeScheduledTimeContract = api;
})(window);
