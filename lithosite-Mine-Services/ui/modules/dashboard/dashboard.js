(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;

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

  function todayKey() {
    return localDateKey(new Date());
  }

  function updateKpis() {
    const equipment = state.equipment;
    const workFronts = state.workFronts;
    const operations = state.operations;
    const issues = state.issues;

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

    const today = todayKey();
    const todayOperations = operations.filter(function (row) {
      return String(row.transaction_date || '') === today;
    });

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

    setText('dashboardTodayOperations', todayOperations.length);

    const operationStatuses = {};
    todayOperations.forEach(function (row) {
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
      setText('dashboardFleetPA', '—');
      setText('dashboardFleetUA', '—');
      setText('dashboardFleetEU', '—');
      return;
    }

    const baselines = foundation.TIME_BASELINES || [];
    const defaultBaseline = foundation.DEFAULT_BASELINE || baselines[0];
    let policy = {
      baseline: defaultBaseline,
      euDenominator: 'AVAILABLE',
      effectiveTimeRule: 'PURE_EFFECTIVE'
    };

    try {
      const raw = global.localStorage && global.localStorage.getItem('lithosite.mine-services.v36.kpi-policy');
      if (raw) {
        const saved = JSON.parse(raw);
        const baseline = baselines.find(function (item) {
          return item.baseline_id === saved.baselineId;
        });
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
        operations: state.operations,
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
      setText('dashboardFleetPA', '—');
      setText('dashboardFleetUA', '—');
      setText('dashboardFleetEU', '—');
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
    if (!body) return;

    body.replaceChildren();

    state.operations
      .slice()
      .sort(function (a, b) {
        return (
          String(b.transaction_date || '').localeCompare(String(a.transaction_date || '')) ||
          String(b.transaction_time || '').localeCompare(String(a.transaction_time || ''))
        );
      })
      .slice(0, 3)
      .forEach(function (row) {
        const line = document.createElement('div');
        line.className = 'tablegrid row';

        [
          row.transaction_time || row.transaction_date || '-',
          row.activity || '-',
          row.work_front_id || '-',
          row.equipment_id || '-',
          String(row.quantity ?? '-') + (row.unit ? ' ' + row.unit : '')
        ].forEach(function (value) {
          const cell = document.createElement('span');
          cell.textContent = String(value);
          line.appendChild(cell);
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
    if (!body) return;

    body.replaceChildren();

    state.issues
      .slice()
      .sort(function (a, b) {
        return String(b.issue_date || '').localeCompare(String(a.issue_date || ''));
      })
      .slice(0, 3)
      .forEach(function (row) {
        const line = document.createElement('div');
        line.className = 'tablegrid row issue';

        const priority = document.createElement('span');
        const pill = document.createElement('b');
        pill.className = 'pill ' + String(row.severity || '').trim().toLowerCase();
        pill.textContent = String(row.severity || '-');
        priority.appendChild(pill);

        const issue = document.createElement('span');
        issue.textContent = String(row.description || '-');

        const status = document.createElement('span');
        const statusPill = document.createElement('b');
        statusPill.className = 'pill ' + String(row.status || '').trim().toLowerCase();
        statusPill.textContent = String(row.status || '-');
        status.appendChild(statusPill);

        line.appendChild(priority);
        line.appendChild(issue);
        line.appendChild(status);
        body.appendChild(line);
      });

    if (!body.children.length) {
      const line = document.createElement('div');
      line.className = 'tablegrid row issue';
      line.innerHTML = '<span>—</span><span>No issues</span><span>—</span>';
      body.appendChild(line);
    }
  }

  function updateMaterialMovement() {
    const bars = document.getElementById('dashboardMaterialBars');
    const note = document.getElementById('dashboardMaterialNote');
    const legend = document.getElementById('dashboardMaterialLegend');
    if (!bars || !note || !legend) return;

    const dates = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    const totals = {};
    dates.forEach(function (date) {
      totals[localDateKey(date)] = { Hauling: 0, Dumping: 0 };
    });

    state.operations.forEach(function (row) {
      const key = String(row.transaction_date || '');
      if (!totals[key]) return;

      const activity = String(row.activity || '').trim().toLowerCase();
      const quantity = Number(row.quantity);
      if (!Number.isFinite(quantity)) return;

      if (activity === 'hauling') totals[key].Hauling += quantity;
      if (activity === 'dumping') totals[key].Dumping += quantity;
    });

    const max = Math.max.apply(null, dates.map(function (date) {
      const t = totals[localDateKey(date)];
      return Math.max(t.Hauling, t.Dumping);
    }));

    bars.replaceChildren();

    dates.forEach(function (date) {
      const key = localDateKey(date);
      const group = document.createElement('div');
      group.style.cssText = 'display:flex;flex-direction:column;align-items:center;height:100%;min-width:30px;justify-content:flex-end';

      const area = document.createElement('div');
      area.style.cssText = 'flex:1;display:flex;align-items:flex-end;justify-content:center;gap:3px;width:100%';

      const hauling = document.createElement('span');
      hauling.className = 'v';
      hauling.style.height = String(max ? totals[key].Hauling / max * 100 : 0) + '%';

      const dumping = document.createElement('span');
      dumping.className = 'v vo';
      dumping.style.height = String(max ? totals[key].Dumping / max * 100 : 0) + '%';

      area.appendChild(hauling);
      area.appendChild(dumping);

      const label = document.createElement('span');
      label.style.cssText = 'height:18px;line-height:18px;font-size:9px;color:#8ea3ba;white-space:nowrap';
      label.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      group.appendChild(area);
      group.appendChild(label);
      bars.appendChild(group);
    });

    legend.replaceChildren();
    ['Hauling', 'Dumping'].forEach(function (name) {
      const key = document.createElement('span');
      key.className = 'chartkey';
      const dot = document.createElement('i');
      dot.className = name === 'Dumping' ? 'chartdot chartdot-orange' : 'chartdot chartdot-blue';
      key.appendChild(dot);
      key.appendChild(document.createTextNode(name));
      legend.appendChild(key);
    });

    const combined = dates.reduce(function (sum, date) {
      const t = totals[localDateKey(date)];
      return sum + t.Hauling + t.Dumping;
    }, 0);

    const unit = state.operations.find(function (row) { return row.unit; });
    const totalStrong = note.querySelector('strong');
    if (totalStrong) {
      totalStrong.textContent = String(combined) + (unit && unit.unit ? ' ' + unit.unit : '');
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
