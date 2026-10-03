/*
 * V34 — PA Engine
 * Physical Availability
 *
 * This engine is intentionally small:
 * - consumes validated/reconciled timeline information;
 * - uses the central KPI engine contract;
 * - does not infer missing time;
 * - does not modify raw evidence;
 * - does not decide site-specific Scheduled Time rules.
 */

(function (global) {
  'use strict';

  const center = global.LithositeKPIEngine;
  if (!center) {
    throw new Error('LithositeKPIEngine is required before pa-engine.js');
  }

  const ENGINE_ID = 'PA';

  function calculate(input) {
    const payload = input || {};
    const timelineResult = center.classifyTimeline(payload.timeline || []);

    if (timelineResult.status !== center.KPI_STATUS.READY) {
      return {
        kpi: ENGINE_ID,
        status: timelineResult.status,
        value: null,
        unit: '%',
        reason: 'Timeline is not ready for PA calculation.',
        issues: timelineResult.issues || []
      };
    }

    const scheduledHours = payload.scheduledTime && payload.scheduledTime.status === 'READY'
      ? Number(payload.scheduledTime.scheduledHours)
      : Number(payload.scheduledHours);
    const availableHours = Number.isFinite(Number(payload.availableHours))
      ? Number(payload.availableHours)
      : center.sumTimelineHours(
          timelineResult.events,
          function (event) {
            return event.availability === center.AVAILABILITY.AVAILABLE;
          }
        );

    if (payload.scheduledTime && payload.scheduledTime.status === 'PENDING_DEFINITION') {
      return {
        kpi: ENGINE_ID,
        status: center.KPI_STATUS.PENDING_DEFINITION,
        value: null,
        unit: '%',
        reason: 'Scheduled Time definition is not locked.'
      };
    }

    if (!Number.isFinite(scheduledHours) || scheduledHours <= 0) {
      return {
        kpi: ENGINE_ID,
        status: center.KPI_STATUS.INVALID_INPUT,
        value: null,
        unit: '%',
        reason: 'Scheduled Time is required and must be greater than zero.'
      };
    }

    if (!Number.isFinite(availableHours) || availableHours < 0) {
      return {
        kpi: ENGINE_ID,
        status: center.KPI_STATUS.INVALID_INPUT,
        value: null,
        unit: '%',
        reason: 'Available Time is invalid.'
      };
    }

    if (availableHours > scheduledHours) {
      return {
        kpi: ENGINE_ID,
        status: center.KPI_STATUS.NEEDS_VALIDATION,
        value: null,
        unit: '%',
        reason: 'Available Time cannot exceed Scheduled Time.'
      };
    }

    const result = center.calculatePA({
      scheduledHours: scheduledHours,
      availableHours: availableHours
    });

    return Object.assign({}, result, {
      engine: ENGINE_ID,
      timelineStatus: timelineResult.status
    });
  }

  const api = Object.freeze({
    id: ENGINE_ID,
    name: 'Physical Availability',
    status: center.ENGINE_STATUS.ACTIVE,
    calculate
  });

  center.registerEngine(ENGINE_ID, api);
  global.LithositePAEngine = api;
})(window);
