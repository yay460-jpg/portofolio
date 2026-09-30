(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }

  function setWidth(id, value) {
    const element = document.getElementById(id);
    if (element) element.style.width = String(value) + '%';
  }

  function updateMaterialMovement(operations) {
    const bars = document.getElementById('dashboardMaterialBars');
    const note = document.getElementById('dashboardMaterialNote');
    const legend = document.getElementById('dashboardMaterialLegend');

    if (!bars || !note || !legend) return;

    const now = new Date();
    const dates = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    const totals = {};

    dates.forEach(function (date) {
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');

      totals[key] = {
        Hauling: 0,
        Dumping: 0
      };
    });

    operations.forEach(function (row) {
      const date = String(row.transaction_date || '');
      if (!totals[date]) return;

      const activity = String(row.activity || '').trim();
      const quantity = Number(row.quantity);

      if (!Number.isFinite(quantity)) return;

      if (activity.toLowerCase() === 'hauling') {
        totals[date].Hauling += quantity;
      } else if (activity.toLowerCase() === 'dumping') {
        totals[date].Dumping += quantity;
      }
    });

    const max = Math.max.apply(null, dates.map(function (date) {
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');

      return Math.max(totals[key].Hauling, totals[key].Dumping);
    }));

    bars.replaceChildren();

    dates.forEach(function (date) {
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');

      const group = document.createElement('div');
      group.style.cssText =
        'display:flex;flex-direction:column;align-items:center;height:100%;' +
        'min-width:30px;justify-content:flex-end';

      const barArea = document.createElement('div');
      barArea.style.cssText =
        'flex:1;display:flex;align-items:flex-end;justify-content:center;gap:3px;width:100%';

      const hauling = document.createElement('span');
      hauling.className = 'v';
      hauling.style.height = String(max ? (totals[key].Hauling / max) * 100 : 0) + '%';

      const dumping = document.createElement('span');
      dumping.className = 'v vo';
      dumping.style.height = String(max ? (totals[key].Dumping / max) * 100 : 0) + '%';

      barArea.appendChild(hauling);
      barArea.appendChild(dumping);

      const label = document.createElement('span');
      label.style.cssText =
        'height:18px;line-height:18px;font-size:9px;color:#8ea3ba;white-space:nowrap';

      label.textContent = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      group.appendChild(barArea);
      group.appendChild(label);
      bars.appendChild(group);
    });

    legend.replaceChildren();

    ['Hauling', 'Dumping'].forEach(function (activity) {
      const key = document.createElement('span');
      key.className = 'chartkey';

      const dot = document.createElement('i');
      dot.className = activity === 'Dumping'
        ? 'chartdot chartdot-orange'
        : 'chartdot chartdot-blue';

      key.appendChild(dot);
      key.appendChild(document.createTextNode(activity));
      legend.appendChild(key);
    });

    const combined = dates.reduce(function (sum, date) {
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');

      return sum + totals[key].Hauling + totals[key].Dumping;
    }, 0);

    const unit = operations.find(function (row) {
      return row.unit;
    });

    const totalLabel = String(combined) +
      (unit && unit.unit ? ' ' + String(unit.unit) : '');

    const totalStrong = note.querySelector('strong');
    if (totalStrong) totalStrong.textContent = totalLabel;
  }

  function updateIssuesAlerts(issues) {
    const body = document.getElementById('dashboardIssuesAlertsBody');
    if (!body) return;

    body.replaceChildren();

    const rows = issues
      .slice()
      .sort(function (a, b) {
        return String(b.issue_date || '').localeCompare(String(a.issue_date || ''));
      })
      .slice(0, 3);

    rows.forEach(function (row) {
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
      statusPill.className = 'pill open';
      statusPill.textContent = String(row.status || '-');
      status.appendChild(statusPill);

      line.appendChild(priority);
      line.appendChild(issue);
      line.appendChild(status);

      body.appendChild(line);
    });
  }

  function updateRecentOperations(operations) {
    const body = document.getElementById('dashboardRecentOperationsBody');
    if (!body) return;

    body.replaceChildren();

    const rows = operations
      .slice()
      .sort(function (a, b) {
        return String(b.transaction_date || '').localeCompare(String(a.transaction_date || ''));
      })
      .slice(0, 3);

    rows.forEach(function (row) {
      const line = document.createElement('div');
      line.className = 'tablegrid row';

      const values = [
        row.transaction_date || '-',
        row.activity || '-',
        row.work_front_id || '-',
        row.equipment_id || '-',
        String(row.quantity ?? '-') + (row.unit ? ' ' + row.unit : '')
      ];

      values.forEach(function (value) {
        const cell = document.createElement('span');
        cell.textContent = String(value);
        line.appendChild(cell);
      });

      body.appendChild(line);
    });
  }

  function updateEquipmentStatus(equipment) {
    const total = equipment.length;
    const counts = {
      active: 0,
      inactive: 0,
      retired: 0
    };

    equipment.forEach(function (row) {
      const status = String(row.status || '').trim().toLowerCase();

      if (status === 'active') {
        counts.active += 1;
      } else if (status === 'inactive') {
        counts.inactive += 1;
      } else if (status === 'retired') {
        counts.retired += 1;
      }
    });

    setText('dashboardEquipmentTotal', total);
    setText('dashboardEquipmentActive', counts.active);
    setText('dashboardEquipmentInactive', counts.inactive);
    setText('dashboardEquipmentRetired', counts.retired);

    setWidth('dashboardEquipmentActiveBar', total ? (counts.active / total) * 100 : 0);
    setWidth('dashboardEquipmentInactiveBar', total ? (counts.inactive / total) * 100 : 0);
    setWidth('dashboardEquipmentRetiredBar', total ? (counts.retired / total) * 100 : 0);

    const donut = document.getElementById('dashboardEquipmentDonut');

    if (donut) {
      const activeDeg = total ? (counts.active / total) * 360 : 0;
      const inactiveDeg = total ? (counts.inactive / total) * 360 : 0;
      const retiredDeg = total ? (counts.retired / total) * 360 : 0;

      const inactiveEnd = activeDeg + inactiveDeg;

      donut.style.background = total
        ? 'conic-gradient(#22c55e 0deg ' + activeDeg + 'deg,' +
          '#f59e0b ' + activeDeg + 'deg ' + inactiveEnd + 'deg,' +
          '#ef4444 ' + inactiveEnd + 'deg ' +
          (inactiveEnd + retiredDeg) + 'deg,' +
          '#94a3b8 ' + (inactiveEnd + retiredDeg) + 'deg 360deg)'
        : 'conic-gradient(#94a3b8 0deg 360deg)';
    }
  }

  function init() {
    const expand = document.getElementById('expand');

    if (expand) {
      expand.addEventListener('click', function () {
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

  global.LithositeDashboard = Object.freeze({
    init,
    refresh: loadData
  });
})(window);
