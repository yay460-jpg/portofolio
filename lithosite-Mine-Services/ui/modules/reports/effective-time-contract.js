(function (global) {
  'use strict';

  const center = global.LithositeKPIEngine;

  if (!center) {
    throw new Error(
      'LithositeKPIEngine is required before effective-time-contract.js'
    );
  }

  const STATUS = {
    READY: 'READY',
    NEEDS_VALIDATION: 'NEEDS_VALIDATION',
    INVALID_INPUT: 'INVALID_INPUT'
  };

  function summarize(input) {
    const payload = input || {};
    const availableHours = Number(payload.availableHours);

    if (!Number.isFinite(availableHours) || availableHours <= 0) {
      return {
        status: STATUS.INVALID_INPUT,
        effectiveHours: null,
        availableHours: null,
        source: null,
        reason: 'Available Time is required and must be greater than zero.'
      };
    }

    const explicit =
      payload.effectiveHours !== undefined &&
      payload.effectiveHours !== null &&
      payload.effectiveHours !== '';

    if (explicit) {
      const effectiveHours = Number(payload.effectiveHours);

      if (!Number.isFinite(effectiveHours) || effectiveHours < 0) {
        return {
          status: STATUS.INVALID_INPUT,
          effectiveHours: null,
          availableHours,
          source: 'EXPLICIT_APPROVED_INPUT',
          reason: 'Effective Time evidence is invalid.'
        };
      }

      if (effectiveHours > availableHours) {
        return {
          status: STATUS.NEEDS_VALIDATION,
          effectiveHours: null,
          availableHours,
          source: 'EXPLICIT_APPROVED_INPUT',
          reason: 'Effective Time cannot exceed Available Time.'
        };
      }

      return {
        status: STATUS.READY,
        effectiveHours,
        availableHours,
        source: 'EXPLICIT_APPROVED_INPUT',
        effectiveEventIds: []
      };
    }

    const normalized = center.normalizeTimeline(payload.timeline || []);

    if (normalized.status !== 'READY') {
      return {
        status: normalized.status,
        effectiveHours: null,
        availableHours,
        source: 'TIMELINE',
        issues: normalized.issues || []
      };
    }

    const candidates = normalized.events.filter(function (event) {
      return event.availability === center.AVAILABILITY.AVAILABLE &&
        event.usage === center.USAGE.USED;
    });

    const unresolved = candidates.filter(function (event) {
      return event.effectiveness === center.EFFECTIVENESS.UNRESOLVED;
    });

    if (unresolved.length) {
      return {
        status: STATUS.NEEDS_VALIDATION,
        effectiveHours: null,
        availableHours,
        source: 'TIMELINE',
        issues: [{
          code: 'EFFECTIVENESS_UNRESOLVED',
          eventIds: unresolved.map(function (event) {
            return event.event_id || null;
          })
        }]
      };
    }

    const effective = candidates.filter(function (event) {
      return event.effectiveness === center.EFFECTIVENESS.EFFECTIVE;
    });

    if (!effective.length) {
      return {
        status: STATUS.NEEDS_VALIDATION,
        effectiveHours: null,
        availableHours,
        source: 'TIMELINE',
        issues: [{
          code: 'EFFECTIVE_TIME_EVIDENCE_REQUIRED'
        }]
      };
    }

    const effectiveHours = center.sumTimelineHours(
      effective,
      function () {
        return true;
      }
    );

    if (effectiveHours > availableHours) {
      return {
        status: STATUS.NEEDS_VALIDATION,
        effectiveHours: null,
        availableHours,
        source: 'TIMELINE',
        reason: 'Effective Time cannot exceed Available Time.'
      };
    }

    return {
      status: STATUS.READY,
      effectiveHours,
      availableHours,
      source: 'TIMELINE_EFFECTIVE_EVENTS',
      effectiveEventIds: effective.map(function (event) {
        return event.event_id || null;
      })
    };
  }

  global.LithositeEffectiveTimeContract = Object.freeze({
    id: 'EFFECTIVE_TIME',
    version: 'V35-EFFECTIVE-TIME-CONTRACT-0.1',
    summarize
  });
})(window);
