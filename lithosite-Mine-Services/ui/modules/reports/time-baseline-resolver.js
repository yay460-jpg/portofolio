/*
 * V34 — Time Baseline Resolver
 *
 * Scope:
 * - validates a Time Baseline contract;
 * - resolves one applicable baseline for operation/site/shift/date;
 * - returns a Scheduled Time contract without hard-coding the
 *   company/site Scheduled Time formula.
 *
 * This resolver does not:
 * - create equipment events;
 * - infer availability;
 * - modify raw evidence;
 * - decide that shift duration minus break is Scheduled Time.
 */

(function (global) {
  'use strict';

  const center = global.LithositeKPIEngine;
  if (!center) {
    throw new Error('LithositeKPIEngine is required before time-baseline-resolver.js');
  }

  const STATUS = Object.freeze({
    READY: center.KPI_STATUS.READY,
    INVALID_INPUT: center.KPI_STATUS.INVALID_INPUT,
    NEEDS_VALIDATION: center.KPI_STATUS.NEEDS_VALIDATION
  });

  function text(value) {
    return value === undefined || value === null ? '' : String(value).trim();
  }

  function dateOnly(value) {
    const valueText = text(value);
    if (!valueText) return null;

    const date = new Date(valueText + 'T00:00:00');
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function validateBaseline(baseline) {
    const result = center.validateRequiredTimeBaseline(baseline);

    if (result.status !== STATUS.READY) {
      return result;
    }

    const issues = [];

    if (!dateOnly(baseline.effective_from)) {
      issues.push('TIME_BASELINE_INVALID_EFFECTIVE_FROM');
    }

    if (baseline.effective_to && !dateOnly(baseline.effective_to)) {
      issues.push('TIME_BASELINE_INVALID_EFFECTIVE_TO');
    }

    if (baseline.effective_to &&
        dateOnly(baseline.effective_from) &&
        dateOnly(baseline.effective_to) &&
        dateOnly(baseline.effective_to) < dateOnly(baseline.effective_from)) {
      issues.push('TIME_BASELINE_EFFECTIVE_RANGE_INVALID');
    }

    if (text(baseline.shift_start) === text(baseline.shift_end)) {
      issues.push('TIME_BASELINE_SHIFT_RANGE_INVALID');
    }

    return {
      status: issues.length ? STATUS.INVALID_INPUT : STATUS.READY,
      issues: issues
    };
  }

  function matches(baseline, request) {
    const operation = text(request.operation);
    const site = text(request.site);
    const shift = text(request.shift);
    const targetDate = dateOnly(request.date);

    if (!targetDate) return false;

    if (operation && text(baseline.operation) !== operation) return false;
    if (site && text(baseline.site) !== site) return false;
    if (shift && text(baseline.shift_code) !== shift) return false;

    const from = dateOnly(baseline.effective_from);
    const to = baseline.effective_to ? dateOnly(baseline.effective_to) : null;

    if (!from || targetDate < from) return false;
    if (to && targetDate > to) return false;

    if (text(baseline.status) && text(baseline.status) !== 'ACTIVE') {
      return false;
    }

    return true;
  }

  /*
   * Resolves exactly one applicable baseline.
   * Zero matches and multiple matches are both non-ready states.
   */
  function resolve(request, baselines) {
    if (!request || !Array.isArray(baselines)) {
      return {
        status: STATUS.INVALID_INPUT,
        baseline: null,
        scheduledTime: null,
        issues: ['TIME_BASELINE_RESOLVE_INPUT_INVALID']
      };
    }

    const validBaselines = [];
    const validationIssues = [];

    baselines.forEach(function (baseline) {
      const validation = validateBaseline(baseline);

      if (validation.status === STATUS.READY) {
        validBaselines.push(baseline);
      } else {
        validationIssues.push({
          baselineId: baseline && baseline.baseline_id || null,
          issues: validation.issues
        });
      }
    });

    const matchesFound = validBaselines.filter(function (baseline) {
      return matches(baseline, request);
    });

    if (matchesFound.length === 0) {
      return {
        status: STATUS.NEEDS_VALIDATION,
        baseline: null,
        scheduledTime: null,
        issues: ['TIME_BASELINE_NOT_FOUND'].concat(
          validationIssues.length ? ['INVALID_BASELINES_PRESENT'] : []
        )
      };
    }

    if (matchesFound.length > 1) {
      return {
        status: STATUS.NEEDS_VALIDATION,
        baseline: null,
        scheduledTime: null,
        issues: ['TIME_BASELINE_MULTIPLE_MATCHES']
      };
    }

    const baseline = matchesFound[0];

    return {
      status: STATUS.READY,
      baseline: baseline,
      scheduledTime: {
        status: 'PENDING_DEFINITION',
        hours: null,
        sourceBaselineId: baseline.baseline_id,
        reason: 'Scheduled Time formula is not locked by company/site SOP.'
      },
      issues: []
    };
  }

  const api = Object.freeze({
    id: 'TIME_BASELINE_RESOLVER',
    status: center.ENGINE_STATUS.ACTIVE,
    validateBaseline,
    resolve
  });

  global.LithositeTimeBaselineResolver = api;
})(window);
