(function (global) {
  'use strict';

  const MATERIALS = [
    { name: 'Ore', color: '#3b82f6' },
    { name: 'OB', color: '#f59e0b' },
    { name: 'Quarry', color: '#22c55e' },
    { name: 'Top Soil', color: '#a78bfa' }
  ];

  function text(node, value) {
    if (node) node.textContent = value;
  }

  function sum(rows, getter) {
    return rows.reduce(function (total, row) {
      const value = Number(getter(row));
      return total + (Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
  }

  function isValidated(row) {
    return String(row.status || '').trim().toLowerCase() === 'validated';
  }

  function isHauling(row) {
    return String(row.activity || '').trim().toLowerCase() === 'hauling';
  }

  function renderMaterial(root, rows) {
    const totals = MATERIALS.map(function (material) {
      const matched = rows.filter(function (row) {
        return String(row.material || '').trim().toLowerCase() === material.name.toLowerCase() &&
          /^(t|ton|tonne|tonnes|tonnage|metric ton|metric tons)$/i.test(String(row.measurement || '').trim());
      });
      return { name: material.name, color: material.color, value: sum(matched, function (row) { return row.quantity; }) };
    });
    const total = sum(totals, function (item) { return item.value; });
    const donut = root.querySelector('.operations-material-donut');
    const holeTotal = root.querySelector('.operations-material-hole strong');
    const legend = root.querySelector('.operations-material-legend');
    if (donut && global.LithositeGraphicDonut) {
      donut.classList.add('graphic-donut');
      global.LithositeGraphicDonut.render({
        element: donut,
        segments: totals,
        label: 'Validated material movement, ' + total + ' tons',
        emptyColor: '#203247'
      });
    }
    text(holeTotal, total.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    if (legend) {
      const rowsHtml = totals.map(function (item) {
        return '<div><i style="--dot:' + item.color + '"></i><span>' + item.name +
          '</span><b>' + item.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
          ' <small>ton</small></b></div>';
      }).join('');
      const retase = sum(rows, function (row) { return row.retase; });
      legend.innerHTML = rowsHtml + '<hr><div><i style="--dot:#94a3b8"></i><span>Retase</span><b>' +
        retase.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
        ' <small>rit</small></b></div><div class="operations-sr-row"><span>S/R</span><span class="operations-coming-soon">Coming Soon</span></div>';
    }
  }

  function renderDailyActivity(root, haulingRows) {
    const chart = root.querySelector('.operations-chart-bars');
    const labels = root.querySelector('.operations-chart-xlabels');
    const heading = root.querySelector('.operations-hauling-heading > div > span');
    if (!chart || !labels) return;
    const dates = Array.from(new Set(haulingRows.map(function (row) {
      return String(row.transaction_date || '').slice(0, 10);
    }).filter(Boolean))).sort().slice(-7);
    const series = dates.map(function (date) {
      const daily = haulingRows.filter(function (row) { return String(row.transaction_date || '').slice(0, 10) === date; });
      return {
        date: date,
        tons: sum(daily, function (row) {
          return /^(t|ton|tonne|tonnes|tonnage|metric ton|metric tons)$/i.test(String(row.measurement || '').trim()) ? row.quantity : 0;
        }),
        trips: sum(daily, function (row) { return row.retase; })
      };
    });
    const maxTons = Math.max.apply(null, series.map(function (item) { return item.tons; }).concat([0]));
    const maxTrips = Math.max.apply(null, series.map(function (item) { return item.trips; }).concat([0]));
    chart.replaceChildren();
    labels.replaceChildren();
    // Each date owns one grid cell containing both its bar pair and its label.
    // This prevents separate plot/label widths from creating horizontal drift.
    const categoryColumns = 'repeat(' + Math.max(series.length, 1) + ', minmax(0, 1fr))';
    chart.style.gridTemplateColumns = categoryColumns;
    chart.style.gap = '5px';
    chart.style.inset = '0 2px 0';
    labels.style.display = 'none';
    const spansMonths = series.some(function (item, index) {
      return index > 0 && item.date.slice(0, 7) !== series[index - 1].date.slice(0, 7);
    });
    series.forEach(function (item) {
      const group = document.createElement('div');
      group.className = 'operations-chart-category';
      const pair = document.createElement('div');
      pair.className = 'operations-chart-bar-pair';
      const ton = document.createElement('i');
      const trips = document.createElement('b');
      const label = document.createElement('span');
      ton.style.height = (maxTons ? item.tons / maxTons * 100 : 0) + '%';
      trips.style.height = (maxTrips ? item.trips / maxTrips * 100 : 0) + '%';
      ton.setAttribute('aria-label', item.date + ' tonnage: ' + item.tons);
      trips.setAttribute('aria-label', item.date + ' trips: ' + item.trips);
      label.className = 'operations-chart-category-label';
      label.textContent = spansMonths ? item.date.slice(5, 10).replace('-', '/') : item.date.slice(8, 10);
      label.title = item.date;
      pair.append(ton, trips);
      group.append(pair, label);
      chart.appendChild(group);
    });
    chart.setAttribute('aria-label', series.length
      ? 'Validated hauling activity for the most recent ' + series.length + ' recorded dates'
      : 'No validated hauling activity recorded');
    text(heading, series.length ? 'Production & Fleet Activity · ' + series[series.length - 1].date : 'No validated hauling records');
    const note = root.querySelector('.operations-chart-note');
    text(note, series.length ? 'Showing ' + series.length + ' of up to 7 latest dates with validated hauling data · bars scaled independently to each metric peak' : 'No validated hauling records for this period');
    const plot = root.querySelector('.operations-hauling-chart');
    if (plot) plot.setAttribute('aria-label', series.length ? 'Validated daily tonnage and trips, dates labeled by day of month' : 'No validated daily hauling records');
  }

  function renderDowntime(root, maintenanceRows, haulingRows) {
    // Link maintenance to the same shift-anchored operating date, including Night events
    // recorded after midnight on the next calendar date.
    const haulingShiftKeys = new Set(haulingRows.map(function (row) {
      const equipmentId = String(row.equipment_id || '').trim();
      const operatingDate = timelineAnchorDate(row, 'transaction_date', 'transaction_time');
      return equipmentId && /^\d{4}-\d{2}-\d{2}$/.test(operatingDate)
        ? equipmentId + '|' + operatingDate
        : '';
    }).filter(Boolean));
    const linked = maintenanceRows.filter(function (row) {
      const equipmentId = String(row.equipment_id || '').trim();
      const operatingDate = timelineAnchorDate(row, 'event_date', 'start_time');
      return !!equipmentId && /^\d{4}-\d{2}-\d{2}$/.test(operatingDate) &&
        haulingShiftKeys.has(equipmentId + '|' + operatingDate);
    });
    const breakdown = sum(linked.filter(function (row) {
      return /breakdown|failure|jam/i.test(String(row.event_type || '') + ' ' + String(row.action || ''));
    }), function (row) { return row.downtime_hours; });
    const repair = sum(linked.filter(function (row) {
      const eventType = String(row.event_type || '').trim();
      const action = String(row.action || '').trim();
      const isBreakdown = /breakdown|failure|jam/i.test(eventType + ' ' + action);
      // Count explicit repair work only. Generic Maintenance rows can represent
      // Corrective, Inspection, or Preventive actions and must not be folded
      // into Repair Hours; a breakdown row is not counted again as repair.
      return !isBreakdown && (/repair/i.test(action) || /^repair(?:ing)?$/i.test(eventType));
    }), function (row) { return row.downtime_hours; });
    // Keep Breakdown Hours and Repair Hours visibly distinct; never present their sum as a single downtime total.
    const heading = root.querySelector('.operations-downtime-heading > div strong');
    text(heading, 'Breakdown Hours & Repair Hours');
    const combinedForSplit = breakdown + repair;
    const downtimeValue = root.querySelector('.operations-downtime-heading > b');
    if (downtimeValue && downtimeValue.firstChild) {
      downtimeValue.firstChild.nodeValue = breakdown.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' h';
    }
    const small = root.querySelector('.operations-downtime-heading > b small');
    text(small, linked.length ? '(breakdown only)' : '(no linked records)');
    const bar = root.querySelector('.operations-downtime-bar');
    if (bar) {
      const i = bar.querySelector('i');
      const b = bar.querySelector('b');
      if (i) i.style.width = (combinedForSplit ? breakdown / combinedForSplit * 100 : 0) + '%';
      if (b) b.style.flex = combinedForSplit ? (repair / combinedForSplit) : '1';
    }
    const legend = root.querySelectorAll('.operations-downtime-legend span b');
    if (legend[0]) text(legend[0], breakdown.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' h');
    if (legend[1]) text(legend[1], repair.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' h');
  }

  function timeMinutes(value) {
    const match = String(value || '').match(/^(\d{2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  function timelineAnchorDate(row, dateField, timeField) {
    const date = String(row && row[dateField] || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const shift = String(row && (row.shift || row.shift_name) || '').trim().toLowerCase();
    const clock = String(row && row[timeField] || '').slice(0, 5);
    const minutes = timeMinutes(clock);
    // Night records after midnight stay attached to the calendar date when that shift began.
    if (shift !== 'night' || minutes === null || minutes >= 12 * 60) return date;
    const previousDate = new Date(date + 'T00:00:00');
    if (Number.isNaN(previousDate.getTime())) return date;
    previousDate.setDate(previousDate.getDate() - 1);
    return previousDate.getFullYear() + '-' +
      String(previousDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(previousDate.getDate()).padStart(2, '0');
  }

  function timelineOffsetMinutes(value) {
    const rawMinutes = timeMinutes(value);
    if (rawMinutes === null) return null;
    const timelineStart = 360; // 06:00
    const timelineSpan = 1440; // 24 hours, ending at 06:00 on the next date
    return ((rawMinutes - timelineStart) % timelineSpan + timelineSpan) % timelineSpan;
  }

  function timelineSegment(track, startValue, endValue, className, label) {
    const startOffset = timelineOffsetMinutes(startValue);
    const rawEndOffset = timelineOffsetMinutes(endValue);
    if (startOffset === null || rawEndOffset === null) return;
    let endOffset = rawEndOffset;
    if (endOffset <= startOffset) endOffset += 1440;
    const timelineSpan = 1440;
    const start = Math.max(0, startOffset);
    const end = Math.min(timelineSpan, endOffset);
    if (end <= start) return;
    const segment = document.createElement('span');
    segment.className = 'operations-timeline-segment ' + className;
    segment.style.left = (start / timelineSpan * 100) + '%';
    segment.style.width = ((end - start) / timelineSpan * 100) + '%';
    segment.title = label + ': ' + startValue + '–' + endValue;
    segment.setAttribute('aria-label', segment.title);
    track.appendChild(segment);
  }

  function renderTimeline(root, haulingRows, equipmentRows, maintenanceRows) {
    const panel = root.querySelector('.operations-timeline-panel');
    if (!panel) return;
    // A row represents the full 06:00-to-06:00 operating cycle. Anchor after-midnight
    // Night records to the previous calendar date before choosing the latest cycle.
    const grouped = new Map();
    haulingRows.forEach(function (row) {
      const id = String(row.equipment_id || '').trim();
      const date = timelineAnchorDate(row, 'transaction_date', 'transaction_time');
      if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      if (!grouped.has(id)) grouped.set(id, []);
      grouped.get(id).push(row);
    });
    const unitRows = Array.from(grouped.entries()).map(function (entry) {
      const equipment = equipmentRows.find(function (item) { return String(item.equipment_id || '').trim() === entry[0]; }) || {};
      const latestDate = entry[1].map(function (row) {
        return timelineAnchorDate(row, 'transaction_date', 'transaction_time');
      }).sort().slice(-1)[0];
      const rows = entry[1].filter(function (row) {
        return timelineAnchorDate(row, 'transaction_date', 'transaction_time') === latestDate;
      }).sort(function (a, b) {
        const aOffset = timelineOffsetMinutes(a.transaction_time);
        const bOffset = timelineOffsetMinutes(b.transaction_time);
        return (aOffset === null ? Number.MAX_SAFE_INTEGER : aOffset) -
          (bOffset === null ? Number.MAX_SAFE_INTEGER : bOffset);
      });
      const events = maintenanceRows.filter(function (item) {
        return String(item.equipment_id || '').trim() === entry[0] &&
          timelineAnchorDate(item, 'event_date', 'start_time') === latestDate;
      });
      return { id: entry[0], label: String(equipment.unit_no || entry[0]), date: latestDate, rows: rows, events: events };
    });
    const title = panel.querySelector('h3');
    if (title) {
      title.replaceChildren(document.createTextNode('Unit Timeline '));
      const sub = document.createElement('span');
      sub.textContent = unitRows.length ? '24 h cycle · Day and Night' : 'No validated hauling records';
      title.appendChild(sub);
    }
    const rowsViewport = panel.querySelector('.operations-timeline-rows');
    if (!rowsViewport) return;
    rowsViewport.querySelectorAll('.operations-timeline-row').forEach(function (node) { node.remove(); });
    unitRows.forEach(function (unit) {
      const row = document.createElement('div');
      row.className = 'operations-timeline-row';
      const icon = document.createElement('span');
      icon.className = 'operations-truck-emoji';
      icon.textContent = '🚛';
      const label = document.createElement('b');
      label.textContent = unit.label;
      const track = document.createElement('div');
      track.classList.add('operations-timeline-track');
      unit.rows.forEach(function (item) {
        const start = String(item.transaction_time || '').slice(0, 5);
        let end = String(item.end_time || '').slice(0, 5);
        if (!end && start && Number.isFinite(Number(item.actual_hours))) {
          const mins = timeMinutes(start);
          if (mins !== null) end = String(Math.floor((mins + Number(item.actual_hours) * 60) / 60)).padStart(2, '0') + ':' +
            String(Math.round((mins + Number(item.actual_hours) * 60) % 60)).padStart(2, '0');
        }
        timelineSegment(track, start, end, 'is-operating', 'Operating (Hauling)');
      });
      unit.events.forEach(function (item) {
        const action = String(item.action || '').trim().toLowerCase();
        const eventType = String(item.event_type || '').trim().toLowerCase();
        const isBreakdown = /breakdown|failure|jam/.test(eventType + ' ' + action);
        const isRepairing = action === 'repairing';
        if (!isBreakdown && !isRepairing) return;
        timelineSegment(
          track,
          String(item.start_time || '').slice(0, 5),
          String(item.end_time || '').slice(0, 5),
          isBreakdown ? 'is-breakdown' : 'is-repairing',
          isBreakdown ? 'Breakdown' : 'Repairing'
        );
      });
      const hours = sum(unit.rows, function (item) { return item.actual_hours; });
      const hoursLabel = document.createElement('strong');
      hoursLabel.textContent = hours.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' h';
      row.append(icon, label, track, hoursLabel);
      rowsViewport.appendChild(row);
    });
  }

  function renderUtilization(root, haulingRows) {
    const tons = sum(haulingRows, function (row) {
      return /^(t|ton|tonne|tonnes|tonnage|metric ton|metric tons)$/i.test(String(row.measurement || '').trim()) ? row.quantity : 0;
    });
    const trips = sum(haulingRows, function (row) { return row.retase; });
    const items = root.querySelectorAll('.operations-util-item strong');
    text(items[0], tons.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' t');
    text(items[1], trips.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' rit');

    // Operations Graphics baseline: 11 available hours per unit per shift.
    // Count each unit/date/shift once so multiple hauling entries in one shift do not
    // multiply the available-time denominator.
    const shifts = new Map();
    const eligibleRows = [];
    haulingRows.forEach(function (row) {
      const equipmentId = String(row.equipment_id || '').trim();
      const date = timelineAnchorDate(row, 'transaction_date', 'transaction_time');
      if (!equipmentId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      const shift = String(row.shift || row.shift_name || '').trim().toLowerCase() || 'unspecified';
      const key = equipmentId + '|' + date + '|' + shift;
      if (!shifts.has(key)) shifts.set(key, []);
      shifts.get(key).push(row);
      eligibleRows.push(row);
    });
    const activeHours = sum(eligibleRows, function (row) { return row.actual_hours; });
    const availableHours = shifts.size * 11;
    const utilizationPercent = availableHours > 0 ? activeHours / availableHours * 100 : 0;

    const utilization = root.querySelector('.operations-utilization');
    if (utilization) {
      text(utilization.querySelector(':scope > b'), availableHours
        ? utilizationPercent.toLocaleString(undefined, { maximumFractionDigits: 1 }) + '%'
        : '—');
      const bar = utilization.querySelector('.operations-util-bar i');
      if (bar) bar.style.width = Math.max(0, Math.min(100, utilizationPercent)) + '%';
      const foot = utilization.querySelector('.operations-util-foot');
      if (foot) {
        const spans = foot.querySelectorAll('span');
        text(spans[0], 'Active time ' + activeHours.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' h');
        text(spans[1], 'Total available ' + availableHours.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' h');
      }
      const note = utilization.querySelector('small');
      text(note, availableHours ? 'Baseline: 11 h per unit / shift' : 'No validated unit-shift records');
    }
  }

  function render(data) {
    const root = document.getElementById('operationsGraphicsContent');
    if (!root || !root.dataset.initialized || !data) return;
    const allOperations = Array.isArray(data.operations) ? data.operations : [];
    const validated = allOperations.filter(isValidated);
    const maintenance = Array.isArray(data.maintenance) ? data.maintenance : [];
    const equipment = Array.isArray(data.equipment) ? data.equipment : [];
    const hauling = validated.filter(isHauling);
    renderMaterial(root, validated);
    renderDailyActivity(root, hauling);
    renderDowntime(root, maintenance, hauling);
    renderTimeline(root, hauling, equipment, maintenance);
    renderUtilization(root, hauling);
  }

  global.LithositeOperationsGraphics = Object.freeze({ render: render });
})(window);
