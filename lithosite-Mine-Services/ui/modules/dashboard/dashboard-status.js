(function (global) {
  'use strict';

  const state = {
    scope: 'ALL_DAYS',
    shift: 'ALL'
  };

  let onChange = null;
  let bound = false;

  function getContext() {
    return {
      scope: state.scope,
      shift: state.shift
    };
  }

  function localDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function todayKey() {
    return localDateKey(new Date());
  }

  function normalizeShift(value) {
    return String(value || '').trim().toUpperCase() === 'NIGHT' ? 'NIGHT' : 'DAY';
  }

  function filteredOperations(records) {
    const rows = Array.isArray(records) ? records : [];

    if (state.scope === 'ALL_DAYS') {
      return rows.slice();
    }

    const today = todayKey();
    return rows.filter(function (row) {
      if (String(row.transaction_date || '') !== today) return false;
      return String(row.shift || '').trim().toUpperCase() === state.shift;
    });
  }

  function filteredIssues(records) {
    const rows = Array.isArray(records) ? records : [];

    if (state.scope === 'ALL_DAYS') {
      return rows.slice();
    }

    const today = todayKey();
    return rows.filter(function (row) {
      return String(row.issue_date || '') === today;
    });
  }

  function updateControls() {
    const scope = document.getElementById('dashboardScope');
    const shift = document.getElementById('dashboardShift');

    if (scope) scope.value = state.scope;

    if (shift) {
      shift.value = state.shift === 'NIGHT' ? 'NIGHT' : 'DAY';
      shift.disabled = state.scope === 'ALL_DAYS';
      shift.setAttribute(
        'aria-disabled',
        state.scope === 'ALL_DAYS' ? 'true' : 'false'
      );
    }
  }

  function setContext(scope, shift) {
    state.scope = String(scope || '').toUpperCase() === 'TODAY'
      ? 'TODAY'
      : 'ALL_DAYS';

    state.shift = state.scope === 'ALL_DAYS'
      ? 'ALL'
      : normalizeShift(shift);

    updateControls();

    if (typeof onChange === 'function') onChange(getContext());
  }

  function bindControls() {
    if (bound) return;

    const scope = document.getElementById('dashboardScope');
    const shift = document.getElementById('dashboardShift');

    if (!scope) return;

    bound = true;

    scope.addEventListener('change', function () {
      setContext(scope.value, shift ? shift.value : 'DAY');
    });

    if (shift) {
      shift.addEventListener('change', function () {
        setContext(scope.value, shift.value);
      });
    }
  }

  function init(callback) {
    if (typeof callback === 'function') onChange = callback;

    bindControls();

    // V39 default is deliberately ALL DATES / Day + Night.
    // The visible Day Shift value is disabled and is not active while ALL_DAYS.
    state.scope = 'ALL_DAYS';
    state.shift = 'ALL';

    updateControls();
  }

  global.LithositeDashboardStatus = Object.freeze({
    init: init,
    getContext: getContext,
    setContext: setContext,
    filteredOperations: filteredOperations,
    filteredIssues: filteredIssues,
    updateControls: updateControls
  });
})(window);
