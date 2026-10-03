/*
 * V34 — Available Time Contract
 *
 * Purpose:
 * - formalize Available Time as a validated timeline-derived layer;
 * - count only intervals explicitly classified AVAILABLE;
 * - never infer missing time as Available;
 * - preserve traceability to source event IDs;
 * - return NEEDS_VALIDATION when the timeline has unresolved classifications,
 *   invalid intervals, overlaps, or internal evidence gaps.
 *
 * This is a contract layer, not a new KPI formula.
 */

(function (global) {
  'use strict';

  const center = global.LithositeKPIEngine;
  if (!center) {
    throw new Error('LithositeKPIEngine is required before availability-time-contract.js');
  }

  const CONTRACT_ID = 'AVAILABLE_TIME';

  function summarize(input) {
    const payload = input || {};
    const events = Array.isArray(payload.timeline) ? payload.timeline : [];
    const timelineResult = center.classifyTimeline(events);

    if (timelineResult.status !== center.KPI_STATUS.READY) {
      return {
        id: CONTRACT_ID,
        status: timelineResult.status,
        availableHours: null,
        availableEventIds: [],
        notAvailableHours: null,
        unresolvedGaps: [],
        issues: timelineResult.issues || []
      };
    }

    const gaps = center.findTimelineGaps(events);

    if (gaps.length) {
      return {
        id: CONTRACT_ID,
        status: center.KPI_STATUS.NEEDS_VALIDATION,
        availableHours: null,
        availableEventIds: [],
        notAvailableHours: null,
        unresolvedGaps: gaps,
        issues: [{
          code: 'TIMELINE_GAP_UNRESOLVED',
          count: gaps.length
        }]
      };
    }

    const availableEvents = timelineResult.events.filter(function (event) {
      return event.availability === center.AVAILABILITY.AVAILABLE;
    });

    const notAvailableEvents = timelineResult.events.filter(function (event) {
      return event.availability === center.AVAILABILITY.NOT_AVAILABLE;
    });

    return {
      id: CONTRACT_ID,
      status: center.KPI_STATUS.READY,
      availableHours: center.sumTimelineHours(
        availableEvents,
        function () { return true; }
      ),
      availableEventIds: availableEvents.map(function (event) {
        return event.event_id || null;
      }),
      notAvailableHours: center.sumTimelineHours(
        notAvailableEvents,
        function () { return true; }
      ),
      unresolvedGaps: [],
      issues: []
    };
  }

  const api = Object.freeze({
    id: CONTRACT_ID,
    name: 'Available Time Contract',
    status: center.ENGINE_STATUS.ACTIVE,
    summarize
  });

  global.LithositeAvailableTimeContract = api;
})(window);
