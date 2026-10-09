(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;
  const dashboardStatus = global.LithositeDashboardStatus;

  if (!runtimeClient) {
    throw new Error('LithositeRuntimeClient is required before dashboard.js');
  }

  const state = {
    equipment: [],
    workFronts: [],
    operations: [],
    issues: [],
    maintenance: []
  };

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function setWidth(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.width = String(value) + '%';
  }

  function localDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

    function updateKpis() {
    const equipment = state.equipment;
    const workFronts = state.workFronts;
    const operations = dashboardStatus.filteredOperations(state.operations);
    const issues = dashboardStatus.filteredIssues(state.issues);

    const equipmentStatus = { active: 0, inactive: 0, retired: 0 };
    equipment.forEach(function (row) {
      const status = String(row.status || '').trim().toLowerCase();
      if (status === 'active') equipmentStatus.active += 1;
      if (status === 'inactive') equipmentStatus.inactive += 1;
      if (status === 'retired') equipmentStatus.retired += 1;
    });

    const activeWorkFronts = workFronts.filter(function (row) {
      return String(row.status || '').trim().toLowerCase() === 'active';
    });

    const contextOperations = operations;

    const openIssues = issues.filter(function (row) {
      return String(row.status || '').trim().toLowerCase() === 'open';
    });

    setText('dashboardTotalEquipment', equipment.length);
    setText(
      'dashboardEquipmentSub',
      'Active ' + equipmentStatus.active +
      ' · Inactive ' + equipmentStatus.inactive +
      ' · Retired ' + equipmentStatus.retired
    );

    setText('dashboardActiveWorkFront', activeWorkFronts.length);
    setText(
      'dashboardWorkFrontSub',
      activeWorkFronts.length + ' Active · ' +
      Math.max(workFronts.length - activeWorkFronts.length, 0) + ' Inactive'
    );

    setText('dashboardTodayOperations', contextOperations.length);
    setText(
      'dashboardOperationsLabel',
      dashboardStatus.getContext().scope === 'ALL_DAYS'
        ? 'Operations'
        : 'Today Operations'
    );

    const operationStatuses = {};
    contextOperations.forEach(function (row) {
      const status = String(row.status || '').trim();
      if (status) operationStatuses[status] = (operationStatuses[status] || 0) + 1;
    });
    setText(
      'dashboardOperationsSub',
      Object.keys(operationStatuses).sort().map(function (key) {
        return key + ' ' + operationStatuses[key];
      }).join(' · ') || 'No operations'
    );

    setText('dashboardOpenIssues', openIssues.length);

    const issueSeverities = {};
    openIssues.forEach(function (row) {
      const severity = String(row.severity || '').trim();
      if (severity) issueSeverities[severity] = (issueSeverities[severity] || 0) + 1;
    });
    setText(
      'dashboardIssuesSub',
      Object.keys(issueSeverities).sort().map(function (key) {
        return key + ' ' + issueSeverities[key];
      }).join(' · ') || 'No open issues'
    );
  }

  function updateFleetKpi() {
    const foundation = global.LithositeKPIFoundation;
    if (!foundation || typeof foundation.calculateFleetAllDates !== 'function') {
      setText('dashboardFleetPA', '—'); setText('dashboardFleetUA', '—'); setText('dashboardFleetEU', '—'); return;
    }
    const baselines = foundation.TIME_BASELINES || [];
    const defaultBaseline = foundation.DEFAULT_BASELINE || baselines[0];
    let policy = { baseline: defaultBaseline, euDenominator: 'AVAILABLE', effectiveTimeRule: 'PURE_EFFECTIVE' };
    try {
      const raw = global.localStorage && global.localStorage.getItem('lithosite.mine-services.v36.kpi-policy');
      if (raw) {
        const saved = JSON.parse(raw);
        const baseline = baselines.find(function (item) { return item.baseline_id === saved.baselineId; });
        policy = {
          baseline: baseline || defaultBaseline,
          euDenominator: saved.euDenominator === 'SCHEDULED' ? 'SCHEDULED' : 'AVAILABLE',
          effectiveTimeRule: saved.effectiveTimeRule === 'STANDARD_CYCLE' ? 'STANDARD_CYCLE' : 'PURE_EFFECTIVE'
        };
      }
    } catch (_) {}
    try {
      const calculation = foundation.calculateFleetAllDates({
        baseline: policy.baseline,
        policy: policy,
        equipment: state.equipment,
        operations: dashboardStatus.filteredOperations(state.operations),
        maintenance: state.maintenance
      });
      const results = calculation && calculation.results ? calculation.results : {};
      const format = function (result) {
        if (!result || result.status !== 'READY' || result.value === null || result.value === undefined) return '—';
        const value = Number(result.value);
        return Number.isFinite(value) ? value.toFixed(2) + '%' : '—';
      };
      setText('dashboardFleetPA', format(results.PA));
      setText('dashboardFleetUA', format(results.UA));
      setText('dashboardFleetEU', format(results.EU));
    } catch (error) {
      console.warn('[Dashboard] Fleet KPI calculation unavailable:', error);
      setText('dashboardFleetPA', '—'); setText('dashboardFleetUA', '—'); setText('dashboardFleetEU', '—');
    }
  }

  function updateEquipmentStatus() {
    const equipment = state.equipment;
    const total = equipment.length;
    const counts = { active: 0, inactive: 0, retired: 0 };

    equipment.forEach(function (row) {
      const status = String(row.status || '').trim().toLowerCase();
      if (status === 'active') counts.active += 1;
      else if (status === 'inactive') counts.inactive += 1;
      else if (status === 'retired') counts.retired += 1;
    });

    setText('dashboardEquipmentTotal', total);
    setText('dashboardEquipmentActive', counts.active);
    setText('dashboardEquipmentInactive', counts.inactive);
    setText('dashboardEquipmentRetired', counts.retired);

    setWidth('dashboardEquipmentActiveBar', total ? counts.active / total * 100 : 0);
    setWidth('dashboardEquipmentInactiveBar', total ? counts.inactive / total * 100 : 0);
    setWidth('dashboardEquipmentRetiredBar', total ? counts.retired / total * 100 : 0);

    const donut = document.getElementById('dashboardEquipmentDonut');
    if (!donut) return;

    const activeDeg = total ? counts.active / total * 360 : 0;
    const inactiveDeg = total ? counts.inactive / total * 360 : 0;
    const retiredDeg = total ? counts.retired / total * 360 : 0;
    const inactiveEnd = activeDeg + inactiveDeg;

    donut.style.background = total
      ? 'conic-gradient(#22c55e 0deg ' + activeDeg + 'deg,#f59e0b ' +
        activeDeg + 'deg ' + inactiveEnd + 'deg,#ef4444 ' +
        inactiveEnd + 'deg ' + (inactiveEnd + retiredDeg) +
        'deg,#94a3b8 ' + (inactiveEnd + retiredDeg) + 'deg 360deg)'
      : 'conic-gradient(#94a3b8 0deg 360deg)';
  }

  function updateRecentOperations() {
    const body = document.getElementById('dashboardRecentOperationsBody');
    const count = document.getElementById('dashboardRecentOperationsCount');
    if (!body) return;
    const operations = dashboardStatus.filteredOperations(state.operations);
    if (count) {
      count.hidden = dashboardStatus.getContext().scope !== 'ALL_DAYS';
      count.textContent = dashboardStatus.getContext().scope === 'ALL_DAYS' ? operations.length + ' records' : '';
    }
    body.replaceChildren();
    operations.slice().sort(function (a, b) {
      return String(b.transaction_date || '').localeCompare(String(a.transaction_date || '')) ||
        String(b.transaction_time || '').localeCompare(String(a.transaction_time || ''));
    }).slice(0, 3).forEach(function (row) {
      const line = document.createElement('div');
      line.className = 'tablegrid row';
      [
        row.transaction_time || row.transaction_date || '-',
        row.activity || '-',
        row.work_front_id || '-',
        row.equipment_id || '-',
        String(row.quantity ?? '-') + (row.measurement ? ' ' + row.measurement : '')
      ].forEach(function (value) {
        const cell = document.createElement('span'); cell.textContent = String(value); line.appendChild(cell);
      });
      body.appendChild(line);
    });
    if (!body.children.length) {
      const line = document.createElement('div');
      line.className = 'tablegrid row';
      line.innerHTML = '<span>No operations</span><span>—</span><span>—</span><span>—</span><span>—</span>';
      body.appendChild(line);
    }
  }

  function updateIssuesAlerts() {
    const body = document.getElementById('dashboardIssuesAlertsBody');
    const count = document.getElementById('dashboardIssuesAlertsCount');
    if (!body) return;
    const issues = dashboardStatus.filteredIssues(state.issues);
    if (count) {
      count.hidden = dashboardStatus.getContext().scope !== 'ALL_DAYS';
      count.textContent = dashboardStatus.getContext().scope === 'ALL_DAYS' ? issues.length + ' records' : '';
    }
    body.replaceChildren();
    issues.slice().sort(function (a, b) {
      return String(b.issue_date || '').localeCompare(String(a.issue_date || ''));
    }).slice(0, 3).forEach(function (row) {
      const line = document.createElement('div'); line.className = 'tablegrid row issue';
      const priority = document.createElement('span');
      const pill = document.createElement('b');
      pill.className = 'pill ' + String(row.severity || '').trim().toLowerCase();
      pill.textContent = String(row.severity || '-'); priority.appendChild(pill);
      const issue = document.createElement('span'); issue.textContent = String(row.description || '-');
      const status = document.createElement('span');
      const statusPill = document.createElement('b');
      statusPill.className = 'pill ' + String(row.status || '').trim().toLowerCase();
      statusPill.textContent = String(row.status || '-'); status.appendChild(statusPill);
      line.appendChild(priority); line.appendChild(issue); line.appendChild(status); body.appendChild(line);
    });
    if (!body.children.length) {
      const line = document.createElement('div'); line.className = 'tablegrid row issue';
      line.innerHTML = '<span>—</span><span>No issues</span><span>—</span>'; body.appendChild(line);
    }
  }

  function updateMaterialMovement() {
    const bars = document.getElementById('dashboardMaterialBars');
    const note = document.getElementById('dashboardMaterialNote');
    const legend = document.getElementById('dashboardMaterialLegend');
    if (!bars || !note || !legend) return;

    const context = dashboardStatus.getContext();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totals = {};
    const rawOperations = Array.isArray(state.operations) ? state.operations : [];

    rawOperations.forEach(function (row) {
      const key = String(row.transaction_date || '');
      if (!key) return;

      if (context.scope === 'TODAY' && context.shift !== 'ALL') {
        const shift = String(row.shift || '').trim().toUpperCase();
        if (shift !== context.shift) return;
      }

      const activity = String(row.activity || '').trim().toLowerCase();
      if (activity !== 'hauling' && activity !== 'dumping') return;

      const quantity = Number(row.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return;

      if (!totals[key]) totals[key] = { Hauling: 0, Dumping: 0 };
      totals[key][activity === 'hauling' ? 'Hauling' : 'Dumping'] += quantity;
    });

    let chartDates = [];
    let activeDates = [];

    if (context.scope === 'ALL_DAYS') {
      // All Day: seven most recent recorded material-movement dates.
      activeDates = Object.keys(totals)
        .filter(function (key) {
          const total = totals[key];
          return total.Hauling > 0 || total.Dumping > 0;
        })
        .sort(function (a, b) { return b.localeCompare(a); })
        .slice(0, 7)
        .sort(function (a, b) { return a.localeCompare(b); })
        .map(function (key) {
          const parts = key.split('-').map(Number);
          return new Date(parts[0], parts[1] - 1, parts[2]);
        });
      chartDates = activeDates.slice();
    } else {
      // Today: keep a normal seven-calendar-date running timeline ending today.
      // Dates remain visible even when there is no movement on that date.
      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        chartDates.push(date);
      }
      activeDates = chartDates.filter(function (date) {
        const total = totals[localDateKey(date)];
        return total && (total.Hauling > 0 || total.Dumping > 0);
      });
    }

    const max = activeDates.reduce(function (value, date) {
      const total = totals[localDateKey(date)];
      return Math.max(value, total.Hauling, total.Dumping);
    }, 0);

    bars.replaceChildren();

    chartDates.forEach(function (date) {
      const key = localDateKey(date);
      const total = totals[key] || { Hauling: 0, Dumping: 0 };

      const group = document.createElement('div');
      group.style.cssText = 'display:flex;flex-direction:column;align-items:center;height:100%;min-width:30px;justify-content:flex-end';

      const area = document.createElement('div');
      area.style.cssText = 'flex:1;display:flex;align-items:flex-end;justify-content:center;gap:3px;width:100%';

      const hauling = document.createElement('span');
      hauling.className = 'v';
      hauling.style.height = String(max ? total.Hauling / max * 100 : 0) + '%';

      const dumping = document.createElement('span');
      dumping.className = 'v vo';
      dumping.style.height = String(max ? total.Dumping / max * 100 : 0) + '%';

      area.appendChild(hauling);
      area.appendChild(dumping);

      const label = document.createElement('span');
      label.style.cssText = 'height:18px;line-height:18px;font-size:9px;color:#b9c9d9;white-space:nowrap';
      label.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      group.appendChild(area);
      group.appendChild(label);
      bars.appendChild(group);
    });

    if (!chartDates.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'height:100%;display:flex;align-items:center;justify-content:center;color:#7f95aa;font-size:9px;width:100%';
      empty.textContent = 'No material movement recorded';
      bars.appendChild(empty);
    }

    const chartDateKeys = new Set(activeDates.map(localDateKey));
    const chartOperations = rawOperations.filter(function (row) {
      if (!chartDateKeys.has(String(row.transaction_date || ''))) return false;
      if (context.scope === 'TODAY' && context.shift !== 'ALL') {
        return String(row.shift || '').trim().toUpperCase() === context.shift;
      }
      return true;
    });
    const chartRetase = chartOperations.reduce(function (sum, row) {
      if (row.retase === null || row.retase === undefined || row.retase === '') return sum;
      const retase = Number(row.retase);
      return Number.isFinite(retase) && retase >= 0 ? sum + retase : sum;
    }, 0);
    const chartTonTotals = activeDates.reduce(function (sum, date) {
      const total = totals[localDateKey(date)] || { Hauling: 0, Dumping: 0 };
      sum.Hauling += total.Hauling;
      sum.Dumping += total.Dumping;
      return sum;
    }, { Hauling: 0, Dumping: 0 });
    const combined = chartTonTotals.Hauling + chartTonTotals.Dumping;
    const unit = rawOperations.find(function (row) {
      const activity = String(row.activity || '').trim().toLowerCase();
      return row.measurement && (activity === 'hauling' || activity === 'dumping');
    });
    const measurementLabel = unit && unit.measurement ? String(unit.measurement) : 'ton';

    function formatTotal(value) {
      return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
    }

    legend.replaceChildren();
    [
      { name: 'Hauling', value: chartTonTotals.Hauling, className: 'chartdot-blue' },
      { name: 'Dumping', value: chartTonTotals.Dumping, className: 'chartdot-orange' }
    ].forEach(function (item) {
      const key = document.createElement('span');
      key.className = 'chartkey';
      const dot = document.createElement('i');
      dot.className = 'chartdot ' + item.className;
      key.appendChild(dot);
      key.appendChild(document.createTextNode(
        item.name + ': ' + formatTotal(item.value) + ' ' + measurementLabel
      ));
      legend.appendChild(key);
    });

    const retaseKey = document.createElement('span');
    retaseKey.className = 'chartkey chartkey-retase';
    const retaseDot = document.createElement('i');
    retaseDot.className = 'chartdot chartdot-retase';
    retaseKey.appendChild(retaseDot);
    const displayedRetase = formatTotal(chartRetase);
    retaseKey.appendChild(document.createTextNode('Retase: ' + displayedRetase + ' rit'));
    legend.appendChild(retaseKey);

    const totalStrong = note.querySelector('strong');
    if (totalStrong) {
      totalStrong.textContent = String(combined) + (unit && unit.measurement ? ' ' + unit.measurement : '');
    }
  }

  function render() {
    updateKpis();
    updateFleetKpi();
    updateEquipmentStatus();
    updateRecentOperations();
    updateIssuesAlerts();
    updateMaterialMovement();
  }

  async function loadData() {
    try {
      const results = await Promise.all([
        runtimeClient.request({ operation: 'READ', entity: 'Equipment' }),
        runtimeClient.request({ operation: 'READ', entity: 'WorkFront' }),
        runtimeClient.request({ operation: 'READ', entity: 'Operations' }),
        runtimeClient.request({ operation: 'READ', entity: 'Issues' }),
        runtimeClient.request({ operation: 'READ', entity: 'Maintenance' })
      ]);

      state.equipment = Array.isArray(results[0].data) ? results[0].data : [];
      state.workFronts = Array.isArray(results[1].data) ? results[1].data : [];
      state.operations = Array.isArray(results[2].data) ? results[2].data : [];
      state.issues = Array.isArray(results[3].data) ? results[3].data : [];
      state.maintenance = Array.isArray(results[4].data) ? results[4].data : [];

      render();
    } catch (error) {
      console.error('[Dashboard] Runtime load failed:', error);
    }
  }

  function init() {
    if (!dashboardStatus || typeof dashboardStatus.init !== 'function') {
      throw new Error('LithositeDashboardStatus is required before dashboard.js');
    }
    dashboardStatus.init(function () {
      render();
    });
    if (!document.body.dataset.dashboardExpandBound) {
      document.body.dataset.dashboardExpandBound = '1';
      document.addEventListener('click', function (event) {
        const expand = event.target.closest('#expand');
        if (!expand) return;
        const app = document.querySelector('.app');
        if (!app) return;
        app.classList.toggle('expanded-tables');
        expand.textContent = app.classList.contains('expanded-tables')
          ? 'Collapse Tables'
          : 'Expand Tables';
      });
    }

    if (!document.body.dataset.dashboardEquipmentViewAllBound) {
      document.body.dataset.dashboardEquipmentViewAllBound = '1';
      document.addEventListener('click', function (event) {
        const viewAll = event.target.closest('#dashboardEquipmentViewAll');
        if (!viewAll) return;
        if (global.LithositeShellNavigation &&
            typeof global.LithositeShellNavigation.setScreen === 'function') {
          global.LithositeShellNavigation.setScreen('Equipment');
        }
      });
    }

    if (!document.body.dataset.dashboardMaterialViewDetailBound) {
      document.body.dataset.dashboardMaterialViewDetailBound = '1';
      document.addEventListener('click', function (event) {
        const viewDetail = event.target.closest('#dashboardMaterialViewDetail');
        if (!viewDetail) return;
        if (global.LithositeShellNavigation &&
            typeof global.LithositeShellNavigation.setScreen === 'function') {
          global.LithositeShellNavigation.setScreen('Operations');
        }
      });
    }

    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (global.LithositeDataSync) global.LithositeDataSync.register('Dashboard', loadData);

  global.LithositeDashboard = Object.freeze({
    init: init,
    refresh: loadData
  });
})(window);
