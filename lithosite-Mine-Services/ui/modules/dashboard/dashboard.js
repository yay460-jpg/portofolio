(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;
  if (!runtimeClient) throw new Error('LithositeRuntimeClient is required before dashboard.js');

  const state = { equipment: [], workFronts: [], operations: [], issues: [] };
  let initialized = false;
  let loading = false;

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function setWidth(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.max(0, Math.min(100, Number(value) || 0)) + '%';
  }

  function localDate(value) {
    const d = value instanceof Date ? value : new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (match) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[match];
    });
  }

  function updateKpis() {
    const today = localDate(new Date());
    const equipment = state.equipment;
    const workFronts = state.workFronts;
    const operations = state.operations;
    const issues = state.issues;

    const eqCounts = { active: 0, inactive: 0, retired: 0 };
    equipment.forEach(function (row) {
      const status = String(row.status || '').trim().toLowerCase();
      if (status === 'active') eqCounts.active++;
      else if (status === 'inactive') eqCounts.inactive++;
      else if (status === 'retired') eqCounts.retired++;
    });
    setText('dashboardTotalEquipment', equipment.length);
    setText('dashboardEquipmentSub', 'Active ' + eqCounts.active + ' · Inactive ' + eqCounts.inactive + ' · Retired ' + eqCounts.retired);

    const activeWorkFronts = workFronts.filter(function (row) {
      return String(row.status || '').trim().toLowerCase() === 'active';
    });
    setText('dashboardActiveWorkFront', activeWorkFronts.length);
    setText('dashboardWorkFrontSub', activeWorkFronts.length ? 'Active work fronts' : 'No active work fronts');

    const todayOps = operations.filter(function (row) {
      return String(row.transaction_date || '') === today;
    });
    const opStatus = {};
    todayOps.forEach(function (row) {
      const key = String(row.status || 'Unknown');
      opStatus[key] = (opStatus[key] || 0) + 1;
    });
    setText('dashboardTodayOperations', todayOps.length);
    const opParts = Object.keys(opStatus).sort().map(function (key) { return key + ' ' + opStatus[key]; });
    setText('dashboardOperationsSub', opParts.length ? opParts.join(' · ') : 'No operations today');

    const openIssues = issues.filter(function (row) {
      return String(row.status || '').trim().toLowerCase() === 'open';
    });
    const severity = {};
    openIssues.forEach(function (row) {
      const key = String(row.severity || 'Unspecified');
      severity[key] = (severity[key] || 0) + 1;
    });
    setText('dashboardOpenIssues', openIssues.length);
    const issueParts = Object.keys(severity).sort().map(function (key) { return key + ' ' + severity[key]; });
    setText('dashboardIssuesSub', issueParts.length ? issueParts.join(' · ') : 'No open issues');
  }

  function updateEquipmentStatus() {
    const total = state.equipment.length;
    const counts = { active: 0, inactive: 0, retired: 0 };
    state.equipment.forEach(function (row) {
      const status = String(row.status || '').trim().toLowerCase();
      if (status === 'active') counts.active++;
      else if (status === 'inactive') counts.inactive++;
      else if (status === 'retired') counts.retired++;
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
    const retiredEnd = inactiveEnd + retiredDeg;
    donut.style.background = total
      ? 'conic-gradient(#22c55e 0deg ' + activeDeg + 'deg,#f59e0b ' + activeDeg + 'deg ' + inactiveEnd + 'deg,#ef4444 ' + inactiveEnd + 'deg ' + retiredEnd + 'deg,#94a3b8 ' + retiredEnd + 'deg 360deg)'
      : 'conic-gradient(#94a3b8 0deg 360deg)';
  }

  function updateRecentOperations() {
    const body = document.getElementById('dashboardRecentOperationsBody');
    if (!body) return;
    body.replaceChildren();
    const head = document.createElement('div');
    head.className = 'tablegrid head';
    ['Time','Activity','Work Front','Equipment','Qty'].forEach(function (label) {
      const span = document.createElement('span'); span.textContent = label; head.appendChild(span);
    });
    body.appendChild(head);
    state.operations.slice().sort(function (a,b) {
      return String(b.transaction_date || '').localeCompare(String(a.transaction_date || '')) ||
        String(b.transaction_time || '').localeCompare(String(a.transaction_time || ''));
    }).slice(0,3).forEach(function (row) {
      const line = document.createElement('div');
      line.className = 'tablegrid row';
      [row.transaction_time || row.transaction_date || '-', row.activity || '-', row.work_front_id || '-', row.equipment_id || '-', String(row.quantity ?? '-') + (row.unit ? ' ' + row.unit : '')].forEach(function (value) {
        const span = document.createElement('span'); span.textContent = String(value); line.appendChild(span);
      });
      body.appendChild(line);
    });
  }

  function updateIssuesAlerts() {
    const body = document.getElementById('dashboardIssuesAlertsBody');
    if (!body) return;
    body.replaceChildren();
    const head = document.createElement('div');
    head.className = 'tablegrid head issue';
    ['Priority','Issue','Status'].forEach(function (label) {
      const span = document.createElement('span'); span.textContent = label; head.appendChild(span);
    });
    body.appendChild(head);
    state.issues.slice().sort(function (a,b) {
      return String(b.issue_date || '').localeCompare(String(a.issue_date || ''));
    }).slice(0,3).forEach(function (row) {
      const line = document.createElement('div');
      line.className = 'tablegrid row issue';
      const priority = document.createElement('span');
      const pill = document.createElement('b');
      pill.className = 'pill ' + String(row.severity || '').trim().toLowerCase().replace(/[^a-z]/g,'');
      pill.textContent = String(row.severity || '-');
      priority.appendChild(pill);
      const issue = document.createElement('span'); issue.textContent = String(row.description || '-');
      const status = document.createElement('span');
      const statusPill = document.createElement('b');
      statusPill.className = 'pill ' + String(row.status || '').trim().toLowerCase().replace(/[^a-z]/g,'');
      statusPill.textContent = String(row.status || '-');
      status.appendChild(statusPill);
      line.appendChild(priority); line.appendChild(issue); line.appendChild(status);
      body.appendChild(line);
    });
  }

  function updateMaterialMovement() {
    const bars = document.getElementById('dashboardMaterialBars');
    const totalLabel = document.getElementById('dashboardMaterialTotal');
    const legend = document.getElementById('dashboardMaterialLegend');
    if (!bars) return;
    bars.replaceChildren();
    const today = new Date();
    const dates = [];
    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      dates.push(date);
    }
    const totals = {};
    let combined = 0;
    let unit = '';
    state.operations.forEach(function (row) {
      const dateKey = String(row.transaction_date || '');
      const quantity = Number(row.quantity);
      if (!dateKey || !Number.isFinite(quantity)) return;
      if (!unit && row.unit) unit = String(row.unit);
      const activity = String(row.activity || '').trim();
      if (!activity) return;
      if (!totals[dateKey]) totals[dateKey] = { Hauling: 0, Dumping: 0 };
      if (activity.toLowerCase() === 'hauling') totals[dateKey].Hauling += quantity;
      else if (activity.toLowerCase() === 'dumping') totals[dateKey].Dumping += quantity;
    });
    dates.forEach(function (date) {
      const key = localDate(date);
      const values = totals[key] || { Hauling: 0, Dumping: 0 };
      combined += values.Hauling + values.Dumping;
    });
    const max = Math.max(1, ...dates.map(function (date) {
      const values = totals[localDate(date)] || { Hauling: 0, Dumping: 0 };
      return Math.max(values.Hauling, values.Dumping);
    }));
    dates.forEach(function (date) {
      const key = localDate(date);
      const values = totals[key] || { Hauling: 0, Dumping: 0 };
      const day = document.createElement('div'); day.className = 'material-day';
      const area = document.createElement('div'); area.className = 'material-day-bars';
      ['Hauling','Dumping'].forEach(function (activity) {
        const bar = document.createElement('span');
        bar.className = 'material-bar' + (activity === 'Dumping' ? ' dumping' : '');
        bar.style.height = (values[activity] ? Math.max(3, values[activity] / max * 100) : 0) + '%';
        area.appendChild(bar);
      });
      const label = document.createElement('div'); label.className = 'material-label';
      label.textContent = date.toLocaleDateString('en-US', { month:'short', day:'numeric' });
      day.appendChild(area); day.appendChild(label); bars.appendChild(day);
    });
    if (totalLabel) totalLabel.textContent = String(combined) + (unit ? ' ' + unit : '');
    if (legend) legend.innerHTML = '<span class="chartkey"><i class="chartdot chartdot-blue"></i>Hauling</span><span class="chartkey"><i class="chartdot chartdot-orange"></i>Dumping</span>';
  }

  function render() {
    updateKpis();
    updateEquipmentStatus();
    updateRecentOperations();
    updateIssuesAlerts();
    updateMaterialMovement();
  }

  async function loadData() {
    if (loading) return;
    loading = true;
    try {
      const results = await Promise.all([
        runtimeClient.request({ operation:'READ', entity:'Equipment' }),
        runtimeClient.request({ operation:'READ', entity:'WorkFront' }),
        runtimeClient.request({ operation:'READ', entity:'Operations' }),
        runtimeClient.request({ operation:'READ', entity:'Issues' })
      ]);
      state.equipment = Array.isArray(results[0].data) ? results[0].data : [];
      state.workFronts = Array.isArray(results[1].data) ? results[1].data : [];
      state.operations = Array.isArray(results[2].data) ? results[2].data : [];
      state.issues = Array.isArray(results[3].data) ? results[3].data : [];
      render();
    } catch (error) {
      console.error('[Lithosite Dashboard] Runtime load failed:', error);
    } finally {
      loading = false;
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;
    const expand = document.getElementById('expand');
    if (expand) {
      expand.addEventListener('click', function () {
        const app = document.querySelector('.app');
        if (!app) return;
        app.classList.toggle('expanded-tables');
        expand.textContent = app.classList.contains('expanded-tables') ? 'Collapse Tables ↙' : 'Expand Tables ↗';
      });
    }
    window.addEventListener('lithosite:screen-changed', function (event) {
      if (event.detail && event.detail.screen === 'Dashboard') loadData();
    });
    loadData();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  global.LithositeDashboard = Object.freeze({ init, refresh: loadData });
})(window);