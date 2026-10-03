/*
 * V34 — Equipment KPI Engine Center
 * Scope: PA / UA / EU / MTBF / MTTR
 *
 * This file is the central orchestration/contract layer for the KPI engines.
 * It owns shared timeline validation helpers, formula contracts, engine registry,
 * dependency rules, and HOLD/ACTIVE state.
 *
 * IMPORTANT:
 * - This layer consumes a validated/reconciled timeline; it does not guess missing time.
 * - Time Baseline is an input/reference, not an equipment event.
 * - Raw evidence must remain unchanged.
 * - Company/site-specific KPI definitions remain configurable.
 * - EU formula is intentionally NOT locked.
 * - MTBF and MTTR engines are intentionally HOLD.
 */

(function (global) {
  'use strict';

  const VERSION = 'V34-KPI-ENGINE-CENTER-0.1';

  const ENGINE_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    HOLD: 'HOLD'
  });

  const KPI_STATUS = Object.freeze({
    READY: 'READY',
    PENDING_DEFINITION: 'PENDING_DEFINITION',
    HOLD: 'HOLD',
    INVALID_INPUT: 'INVALID_INPUT',
    NEEDS_VALIDATION: 'NEEDS_VALIDATION'
  });

  const AVAILABILITY = Object.freeze({
    AVAILABLE: 'AVAILABLE',
    NOT_AVAILABLE: 'NOT_AVAILABLE',
    UNRESOLVED: 'UNRESOLVED'
  });

  const USAGE = Object.freeze({
    USED: 'USED',
    NOT_USED: 'NOT_USED',
    UNRESOLVED: 'UNRESOLVED'
  });

  const EFFECTIVENESS = Object.freeze({
    EFFECTIVE: 'EFFECTIVE',
    NOT_EFFECTIVE: 'NOT_EFFECTIVE',
    UNRESOLVED: 'UNRESOLVED'
  });

  /*
   * Central engine map.
   * Individual files can later register/replace the ACTIVE adapters:
   *   pa-engine.js
   *   ua-engine.js
   *   eu-engine.js
   *   mtbf-engine.js  -> HOLD
   *   mttr-engine.js  -> HOLD
   */
  const ENGINE_REGISTRY = {
    PA: {
      id: 'PA',
      name: 'Physical Availability',
      status: ENGINE_STATUS.ACTIVE,
      dependsOn: ['TIMELINE', 'TIME_BASELINE'],
      formulaId: 'PA-AVAILABLE-OVER-SCHEDULED',
      engine: null
    },
    UA: {
      id: 'UA',
      name: 'Utilization of Availability',
      status: ENGINE_STATUS.ACTIVE,
      dependsOn: ['PA', 'TIMELINE'],
      formulaId: 'UA-USED-OVER-AVAILABLE',
      engine: null
    },
    EU: {
      id: 'EU',
      name: 'Effective Utilization',
      status: ENGINE_STATUS.ACTIVE,
      dependsOn: ['UA', 'TIMELINE'],
      formulaId: null,
      definitionStatus: KPI_STATUS.PENDING_DEFINITION,
      engine: null
    },
    MTBF: {
      id: 'MTBF',
      name: 'Mean Time Between Failures',
      status: ENGINE_STATUS.HOLD,
      dependsOn: ['TIMELINE'],
      formulaId: null,
      engine: null
    },
    MTTR: {
      id: 'MTTR',
      name: 'Mean Time To Repair',
      status: ENGINE_STATUS.HOLD,
      dependsOn: ['TIMELINE'],
      formulaId: null,
      engine: null
    }
  };

  const FORMULAS = Object.freeze({
    PA: {
      id: 'PA-AVAILABLE-OVER-SCHEDULED',
      numerator: 'availableHours',
      denominator: 'scheduledHours',
      calculate: function (availableHours, scheduledHours) {
        return ratioPercent(availableHours, scheduledHours);
      }
    },

    UA: {
      id: 'UA-USED-OVER-AVAILABLE',
      numerator: 'usedHours',
      denominator: 'availableHours',
      calculate: function (usedHours, availableHours) {
        return ratioPercent(usedHours, availableHours);
      }
    },

    /*
     * EU deliberately has no calculation function yet.
     * The official denominator/definition must be supplied by the
     * applicable company/site SOP before implementation is locked.
     */
    EU: {
      id: null,
      numerator: 'effectiveHours',
      denominator: null,
      calculate: null
    },

    MTBF: {
      id: null,
      calculate: null
    },

    MTTR: {
      id: null,
      calculate: null
    }
  });

  function asFiniteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function toDate(value) {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function durationHours(start, end) {
    const startDate = toDate(start);
    const endDate = toDate(end);

    if (!startDate || !endDate || endDate <= startDate) {
      return null;
    }

    return (endDate.getTime() - startDate.getTime()) / 3600000;
  }

  function ratioPercent(numerator, denominator) {
    const n = asFiniteNumber(numerator);
    const d = asFiniteNumber(denominator);

    if (n === null || d === null || d <= 0) {
      return null;
    }

    return (n / d) * 100;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /*
   * Timeline normalization does NOT infer missing boundaries.
   * start/end must already come from validated/reconciled evidence.
   */
  function normalizeTimeline(events) {
    if (!Array.isArray(events)) {
      return {
        status: KPI_STATUS.INVALID_INPUT,
        events: [],
        issues: ['TIMELINE_NOT_ARRAY']
      };
    }

    const issues = [];
    const normalized = events.map(function (event, index) {
      const start = toDate(event.start_time || event.start);
      const end = toDate(event.end_time || event.end);
      const duration = durationHours(start, end);

      if (!start || !end || duration === null) {
        issues.push({
          code: 'INVALID_INTERVAL',
          index: index,
          eventId: event.event_id || null
        });
      }

      return Object.assign({}, event, {
        _index: index,
        _start: start,
        _end: end,
        _durationHours: duration
      });
    }).sort(function (a, b) {
      const aTime = a._start ? a._start.getTime() : Number.POSITIVE_INFINITY;
      const bTime = b._start ? b._start.getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });

    for (let i = 1; i < normalized.length; i += 1) {
      const previous = normalized[i - 1];
      const current = normalized[i];

      if (!previous._end || !current._start) continue;

      if (current._start < previous._end) {
        issues.push({
          code: 'TIMELINE_OVERLAP',
          previousEventId: previous.event_id || null,
          eventId: current.event_id || null
        });
      }
    }

    return {
      status: issues.length ? KPI_STATUS.NEEDS_VALIDATION : KPI_STATUS.READY,
      events: normalized,
      issues: issues
    };
  }

  /*
   * Gaps are reported, not automatically classified as Available,
   * Standby, Operating, or Not Available.
   */
  function findTimelineGaps(events) {
    const normalized = normalizeTimeline(events);
    const gaps = [];

    for (let i = 1; i < normalized.events.length; i += 1) {
      const previous = normalized.events[i - 1];
      const current = normalized.events[i];

      if (!previous._end || !current._start) continue;

      const gapHours = durationHours(previous._end, current._start);
      if (gapHours !== null && gapHours > 0) {
        gaps.push({
          from: previous._end.toISOString(),
          to: current._start.toISOString(),
          durationHours: gapHours,
          status: AVAILABILITY.UNRESOLVED,
          reason: 'NO_EVIDENCE'
        });
      }
    }

    return gaps;
  }

  function sumTimelineHours(events, predicate) {
    return events.reduce(function (total, event) {
      if (!predicate(event)) return total;

      const duration = asFiniteNumber(event._durationHours);
      return duration === null ? total : total + duration;
    }, 0);
  }

  function classifyTimeline(events) {
    const normalized = normalizeTimeline(events);

    if (normalized.status !== KPI_STATUS.READY) {
      return {
        status: normalized.status,
        events: normalized.events,
        issues: normalized.issues
      };
    }

    const unresolved = normalized.events.filter(function (event) {
      return (
        event.availability === AVAILABILITY.UNRESOLVED ||
        event.usage === USAGE.UNRESOLVED ||
        event.effectiveness === EFFECTIVENESS.UNRESOLVED
      );
    });

    return {
      status: unresolved.length
        ? KPI_STATUS.NEEDS_VALIDATION
        : KPI_STATUS.READY,
      events: normalized.events,
      issues: unresolved.map(function (event) {
        return {
          code: 'UNRESOLVED_CLASSIFICATION',
          eventId: event.event_id || null
        };
      })
    };
  }

  function validateRequiredTimeBaseline(timeBaseline) {
    if (!timeBaseline || typeof timeBaseline !== 'object') {
      return {
        status: KPI_STATUS.INVALID_INPUT,
        issues: ['TIME_BASELINE_REQUIRED']
      };
    }

    const required = [
      'baseline_id',
      'shift_start',
      'shift_end',
      'effective_from'
    ];

    const missing = required.filter(function (key) {
      return timeBaseline[key] === undefined || timeBaseline[key] === null || timeBaseline[key] === '';
    });

    return {
      status: missing.length ? KPI_STATUS.INVALID_INPUT : KPI_STATUS.READY,
      issues: missing.map(function (key) {
        return 'TIME_BASELINE_' + key.toUpperCase() + '_REQUIRED';
      })
    };
  }

  function calculatePA(input) {
    const scheduledHours = asFiniteNumber(input.scheduledHours);
    const availableHours = asFiniteNumber(input.availableHours);

    if (scheduledHours === null || availableHours === null || scheduledHours <= 0) {
      return {
        kpi: 'PA',
        status: KPI_STATUS.INVALID_INPUT,
        value: null
      };
    }

    return {
      kpi: 'PA',
      status: KPI_STATUS.READY,
      value: FORMULAS.PA.calculate(availableHours, scheduledHours),
      unit: '%',
      numeratorHours: availableHours,
      denominatorHours: scheduledHours
    };
  }

  function calculateUA(input) {
    const availableHours = asFiniteNumber(input.availableHours);
    const usedHours = asFiniteNumber(input.usedHours);

    if (availableHours === null || usedHours === null || availableHours <= 0) {
      return {
        kpi: 'UA',
        status: KPI_STATUS.INVALID_INPUT,
        value: null
      };
    }

    return {
      kpi: 'UA',
      status: KPI_STATUS.READY,
      value: FORMULAS.UA.calculate(usedHours, availableHours),
      unit: '%',
      numeratorHours: usedHours,
      denominatorHours: availableHours
    };
  }

  function calculateEU() {
    return {
      kpi: 'EU',
      status: KPI_STATUS.PENDING_DEFINITION,
      value: null,
      unit: '%',
      reason: 'Official EU definition/denominator is not locked.'
    };
  }

  function getEngineStatus() {
    return Object.keys(ENGINE_REGISTRY).reduce(function (result, key) {
      result[key] = Object.assign({}, ENGINE_REGISTRY[key], {
        engine: undefined
      });
      return result;
    }, {});
  }

  function registerEngine(kpiId, engine) {
    const entry = ENGINE_REGISTRY[kpiId];

    if (!entry) {
      throw new Error('Unknown KPI engine: ' + kpiId);
    }

    if (entry.status === ENGINE_STATUS.HOLD) {
      throw new Error(kpiId + ' engine is HOLD and cannot be activated by default.');
    }

    if (!engine || typeof engine.calculate !== 'function') {
      throw new Error(kpiId + ' engine must expose calculate(input).');
    }

    entry.engine = engine;
    return getEngineStatus()[kpiId];
  }

  /*
   * Central bundle calculation.
   * The center coordinates the common timeline and formula contracts.
   * Individual engines can later replace the PA/UA/EU adapters.
   */
  function calculateBundle(input) {
    const payload = input || {};
    const timelineResult = classifyTimeline(payload.timeline || []);

    if (timelineResult.status !== KPI_STATUS.READY) {
      return {
        status: timelineResult.status,
        timeline: timelineResult,
        results: {
          PA: null,
          UA: null,
          EU: null,
          MTBF: { kpi: 'MTBF', status: KPI_STATUS.HOLD, value: null },
          MTTR: { kpi: 'MTTR', status: KPI_STATUS.HOLD, value: null }
        }
      };
    }

    const pa = ENGINE_REGISTRY.PA.engine
      ? ENGINE_REGISTRY.PA.engine.calculate(payload)
      : calculatePA(payload);

    const uaInput = Object.assign({}, payload, {
      availableHours: pa && Number.isFinite(Number(pa.numeratorHours))
        ? Number(pa.numeratorHours)
        : payload.availableHours
    });

    const ua = ENGINE_REGISTRY.UA.engine
      ? ENGINE_REGISTRY.UA.engine.calculate(uaInput)
      : calculateUA(uaInput);

    const euInput = Object.assign({}, payload, {
      availableHours: ua && Number.isFinite(Number(ua.denominatorHours))
        ? Number(ua.denominatorHours)
        : uaInput.availableHours,
      usedHours: ua && Number.isFinite(Number(ua.numeratorHours))
        ? Number(ua.numeratorHours)
        : payload.usedHours
    });

    const eu = ENGINE_REGISTRY.EU.engine
      ? ENGINE_REGISTRY.EU.engine.calculate(euInput)
      : calculateEU(euInput);

    return {
      status: KPI_STATUS.READY,
      timeline: {
        status: timelineResult.status,
        issues: timelineResult.issues,
        gaps: findTimelineGaps(payload.timeline || [])
      },
      results: {
        PA: pa,
        UA: ua,
        EU: eu,
        MTBF: {
          kpi: 'MTBF',
          status: KPI_STATUS.HOLD,
          value: null,
          reason: 'MTBF engine is intentionally on HOLD.'
        },
        MTTR: {
          kpi: 'MTTR',
          status: KPI_STATUS.HOLD,
          value: null,
          reason: 'MTTR engine is intentionally on HOLD.'
        }
      }
    };
  }

  const api = Object.freeze({
    VERSION,
    ENGINE_STATUS,
    KPI_STATUS,
    AVAILABILITY,
    USAGE,
    EFFECTIVENESS,
    FORMULAS,
    ENGINE_REGISTRY,
    durationHours,
    normalizeTimeline,
    findTimelineGaps,
    classifyTimeline,
    validateRequiredTimeBaseline,
    calculatePA,
    calculateUA,
    calculateEU,
    sumTimelineHours,
    calculateBundle,
    getEngineStatus,
    registerEngine,
    clone
  });

  global.LithositeKPIEngine = api;
})(window);
