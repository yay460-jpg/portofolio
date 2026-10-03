/*
 * V34 — UA Engine
 * Utilization Availability
 *
 * This engine consumes a validated/reconciled timeline and the
 * Available Time established by the PA layer.
 *
 * It does not infer usage from activity names and does not modify
 * raw evidence.
 */

(function (global) {
  'use strict';

  const center = global.LithositeKPIEngine;
  if (!center) {
    throw new Error('LithositeKPIEngine is required before ua-engine.js');
  }

  const ENGINE_ID = 'UA';

  function calculate(input) {
    const payload = input || {};
    const timelineResult = center.classifyTimeline(payload.timeline || []);

    if (timelineResult.status !== center.KPI_STATUS.READY) {
      return {
        kpi: ENGINE_ID,
        status: timelineResult.status,
        value: null,
        unit: '%',
        reason: 'Timeline is not ready for UA calculation.',
        issues: timelineResult.issues || []
      };
    }

    const availableHours = Number(payload.availableHours);
    let usedHours;
    let usedTimeContract = null;

    if (global.LithositeUsedTimeContract) {
      usedTimeContract = global.LithositeUsedTimeContract.summarize({ timeline: payload.timeline || [] });
      if (usedTimeContract.status !== center.KPI_STATUS.READY) {
        return { kpi: ENGINE_ID, status: usedTimeContract.status, value: null, unit: '%', reason: 'Used Time is not validated.', usedTimeContract: usedTimeContract };
      }
      usedHours = usedTimeContract.usedHours;
    } else {
      usedHours = Number.isFinite(Number(payload.usedHours))
        ? Number(payload.usedHours)
        : center.sumTimelineHours(
            timelineResult.events,
            function (event) {
              return event.availability === center.AVAILABILITY.AVAILABLE &&
                event.usage === center.USAGE.USED;
            }
          );
    }

      ? Number(payload.usedHours)
      : center.sumTimelineHours(
          timelineResult.events,
          function (event) {
            return event.availability === center.AVAILABILITY.AVAILABLE &&
              event.usage === center.USAGE.USED;
          }
        );

    if (!Number.isFinite(availableHours) || availableHours <= 0) {
      return {
        kpi: ENGINE_ID,
        status: center.KPI_STATUS.INVALID_INPUT,
        value: null,
        unit: '%',
        reason: 'Available Time is required and must be greater than zero.'
      };
    }

    if (!Number.isFinite(usedHours) || usedHours < 0) {
      return {
        kpi: ENGINE_ID,
        status: center.KPI_STATUS.INVALID_INPUT,
        value: null,
        unit: '%',
        reason: 'Used Time is invalid.'
      };
    }

    if (usedHours > availableHours) {
      return {
        kpi: ENGINE_ID,
        status: center.KPI_STATUS.NEEDS_VALIDATION,
        value: null,
        unit: '%',
        reason: 'Used Time cannot exceed Available Time.'
      };
    }

    const result = center.calculateUA({
      availableHours: availableHours,
      usedHours: usedHours
    });

    return Object.assign({}, result, {
      engine: ENGINE_ID,
      timelineStatus: timelineResult.status
    });
  }

  const api = Object.freeze({
    id: ENGINE_ID,
    name: 'Utilization Availability',
    status: center.ENGINE_STATUS.ACTIVE,
    calculate
  });

  center.registerEngine(ENGINE_ID, api);
  global.LithositeUAEngine = api;
})(window);
