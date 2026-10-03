/*
 * V34 — Used Time Contract
 *
 * Used Time is derived only from intervals that are explicitly:
 *   AVAILABLE + USED
 *
 * No inference is made from activity names or raw record presence.
 * NOT_AVAILABLE never becomes Used Time.
 * AVAILABLE + NOT_USED remains Available Time but not Used Time.
 * UNRESOLVED evidence blocks the contract.
 */

(function (global) {
  'use strict';

  const center = global.LithositeKPIEngine;
  if (!center) {
    throw new Error('LithositeKPIEngine is required before used-time-contract.js');
  }

  const CONTRACT_ID = 'USED_TIME';

  function summarize(input) {
    const payload = input || {};
    const events = Array.isArray(payload.timeline) ? payload.timeline : [];
    const timelineResult = center.classifyTimeline(events);

    if (timelineResult.status !== center.KPI_STATUS.READY) {
      return {
        id: CONTRACT_ID,
        status: timelineResult.status,
        usedHours: null,
        usedEventIds: [],
        notUsedAvailableHours: null,
        issues: timelineResult.issues || []
      };
    }

    const gaps = center.findTimelineGaps(events, payload.scheduledWindows);

    if (gaps.length) {
      return {
        id: CONTRACT_ID,
        status: center.KPI_STATUS.NEEDS_VALIDATION,
        usedHours: null,
        usedEventIds: [],
        notUsedAvailableHours: null,
        issues: [{
          code: 'TIMELINE_GAP_UNRESOLVED',
          count: gaps.length
        }]
      };
    }

    const usedEvents = timelineResult.events.filter(function (event) {
      return event.availability === center.AVAILABILITY.AVAILABLE &&
        event.usage === center.USAGE.USED;
    });

    const notUsedAvailableEvents = timelineResult.events.filter(function (event) {
      return event.availability === center.AVAILABILITY.AVAILABLE &&
        event.usage === center.USAGE.NOT_USED;
    });

    return {
      id: CONTRACT_ID,
      status: center.KPI_STATUS.READY,
      usedHours: center.sumTimelineHours(
        usedEvents,
        function () { return true; }
      ),
      usedEventIds: usedEvents.map(function (event) {
        return event.event_id || null;
      }),
      notUsedAvailableHours: center.sumTimelineHours(
        notUsedAvailableEvents,
        function () { return true; }
      ),
      issues: []
    };
  }

  const api = Object.freeze({
    id: CONTRACT_ID,
    name: 'Used Time Contract',
    status: center.ENGINE_STATUS.ACTIVE,
    summarize
  });

  global.LithositeUsedTimeContract = api;
})(window);
