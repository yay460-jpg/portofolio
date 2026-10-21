(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;
  if (!runtimeClient) {
    throw new Error('LithositeRuntimeClient is required before operations.js');
  }

  const modal = document.getElementById('modal');
  const dataState = { operations: [], checkers: [], workFronts: [], equipment: [], capacities: [], maintenance: [], lists: {} };

  let editId = null;
  let runtimeReady = false;
  let activeTimelineKey = null;
  let addWorkMode = false;

  function setRuntimeState(text, error) {
    const el = document.getElementById('runtimeMsg');
    if (el) {
      el.textContent = text;
      el.classList.toggle('error', Boolean(error));
    }
  }

  function optionize(id, items, valueKey, labelFn, emptyLabel) {
    const el = document.getElementById(id);
    const current = el.value;
    el.innerHTML =
      '<option value="">' + emptyLabel + '</option>' +
      items.map(function (item) {
        return '<option value="' +
          String(item[valueKey] ?? '').replace(/"/g, '&quot;') +
          '">' + labelFn(item) + '</option>';
      }).join('');

    if (items.some(function (item) {
      return String(item[valueKey]) === current;
    })) {
      el.value = current;
    }
  }

  function matchesEquipmentGroup(type, group) {
    const normalizedType = String(type || '').trim().toLowerCase();
    if (!group) return true;
    if (group === 'dump-truck') return normalizedType === 'dump truck';
    if (group === 'excavator') return normalizedType === 'excavator';
    if (group === 'support-unit') return normalizedType === 'grader' || normalizedType === 'dozer';
    return true;
  }

  function fillRefs() {
    optionize(
      'wf',
      dataState.workFronts,
      'work_front_id',
      function (x) { return x.work_front_id; },
      'All work fronts'
    );

    optionize(
      'eq',
      dataState.equipment,
      'equipment_id',
      function (x) { return x.equipment_id; },
      'All equipment'
    );

    const domains = Array.isArray(dataState.lists.service_domain)
      ? dataState.lists.service_domain
      : [];

    optionize(
      'domain',
      domains.map(function (domain) { return { domain: domain }; }),
      'domain',
      function (x) { return x.domain; },
      'All domains'
    );

    optionize(
      'f_domain',
      domains.map(function (domain) { return { domain: domain }; }),
      'domain',
      function (x) { return x.domain; },
      'Select domain'
    );

    optionize(
      'f_measurement',
      Array.isArray(dataState.lists.measurement)
        ? dataState.lists.measurement.map(function (measurement) { return { measurement: measurement }; })
        : [],
      'measurement',
      function (x) { return x.measurement; },
      'Select measurement'
    );

    optionize(
      'f_shift',
      (Array.isArray(dataState.lists.checker_shift) ? dataState.lists.checker_shift : ['Day','Night'])
        .map(function (shift) { return { value: shift }; }),
      'value',
      function (x) { return x.value; },
      'Select shift'
    );

    optionize(
      'f_material',
      (Array.isArray(dataState.lists.checker_material) ? dataState.lists.checker_material : ['Ore','OB','Quarry'])
        .map(function (material) { return { value: material }; }),
      'value',
      function (x) { return x.value; },
      'Not specified'
    );

    optionize(
      'f_wf',
      dataState.workFronts,
      'work_front_id',
      function (x) { return x.work_front_id + ' — ' + (x.location || ''); },
      'Select work front'
    );

    optionize(
      'f_eq',
      dataState.equipment,
      'equipment_id',
      function (x) { return x.equipment_id + ' — ' + (x.type || ''); },
      'None'
    );
  }

  function filterRows() {
    const date = document.getElementById('date').value;
    const domain = document.getElementById('domain').value;
    const wf = document.getElementById('wf').value;
    const equipmentGroup = document.getElementById('equipmentGroupFilter').value;
    const eq = document.getElementById('eq').value;
    const equipmentById = new Map(
      dataState.equipment.map(function (item) {
        return [String(item.equipment_id || ''), item];
      })
    );
    const activity = document.getElementById('activityFilter').value.trim().toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const source = document.getElementById('sourceFilter').value.trim().toLowerCase();

    return dataState.operations.filter(function (row) {
      return (!date || String(row.transaction_date || '') === date) &&
        (!domain || row.domain === domain) &&
        (!wf || row.work_front_id === wf) &&
        (!equipmentGroup || matchesEquipmentGroup(
          equipmentById.get(String(row.equipment_id || ''))?.type,
          equipmentGroup
        )) &&
        (!eq || row.equipment_id === eq) &&
        (!activity || String(row.activity || '').toLowerCase().includes(activity)) &&
        (!status || row.status === status) &&
        (!source || String(row.source || '').toLowerCase().includes(source));
    });
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (match) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[match];
    });
  }

  function maintenanceLinksFor(items) {
    if (!Array.isArray(dataState.maintenance) || !items.length) return [];
    const first = items[0];
    const date = String(first.transaction_date || '');
    const equipmentId = String(first.equipment_id || '').trim();
    if (!date || !equipmentId) return [];
    return dataState.maintenance.filter(function (row) {
      return String(row.event_date || '') === date &&
        String(row.equipment_id || '').trim() === equipmentId;
    });
  }

  function timelineGroups(rows) {
    const groups = new Map();

    rows.forEach(function (row) {
      const equipmentId = String(row.equipment_id || '').trim();
      const key = String(row.transaction_date || '') + '|' +
        (equipmentId || 'NO-EQUIPMENT|' + String(row.transaction_id || ''));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });

    const grouped = Array.from(groups.values()).map(function (items) {
      items.sort(function (a, b) {
        return String(a.transaction_time || '').localeCompare(String(b.transaction_time || ''));
      });
      return items;
    });

    // Always render work timelines chronologically: date first, then start time.
    // This is derived from the operation records, so new records are auto-positioned
    // without relying on database insertion order.
    grouped.sort(function (a, b) {
      const aFirst = a[0] || {};
      const bFirst = b[0] || {};
      const dateCompare = String(aFirst.transaction_date || '')
        .localeCompare(String(bFirst.transaction_date || ''));
      if (dateCompare !== 0) return dateCompare;

      const timeCompare = String(aFirst.transaction_time || '')
        .localeCompare(String(bFirst.transaction_time || ''));
      if (timeCompare !== 0) return timeCompare;

      const equipmentCompare = String(aFirst.equipment_id || '')
        .localeCompare(String(bFirst.equipment_id || ''));
      if (equipmentCompare !== 0) return equipmentCompare;

      return String(aFirst.transaction_id || '')
        .localeCompare(String(bFirst.transaction_id || ''));
    });

    return grouped;
  }

  function openTimeline(key) {
    activeTimelineKey = key;
    const rows = dataState.operations
      .filter(function (row) {
        const equipmentId = String(row.equipment_id || '').trim();
        const rowKey = String(row.transaction_date || '') + '|' +
          (equipmentId || 'NO-EQUIPMENT|' + String(row.transaction_id || ''));
        return rowKey === key;
      })
      .sort(function (a, b) {
        return String(a.transaction_time || '').localeCompare(String(b.transaction_time || ''));
      });

    if (!rows.length) return;

    const first = rows[0];
    const checkerByOperation = new Map(dataState.checkers.map(function (item) {
      return [String(item.operation_id || ''), item];
    }));
    const equipment = dataState.equipment.find(function (item) {
      return String(item.equipment_id || '') === String(first.equipment_id || '');
    });
    const unitFleetNo = equipment ? equipment.unit_no : '';

    document.getElementById('timelineTitle').textContent =
      'Work Timeline — ' + (first.equipment_id || 'Unassigned');

    document.getElementById('timelineMeta').textContent =
      String(first.transaction_date || '—') + ' · Start ' +
      String(first.transaction_time || '—') + ' · End ' +
      String(rows[rows.length - 1].end_time || rows[rows.length - 1].transaction_time || '—') +
      ' · ' + rows.length + ' events';

    const uniqueContextValue = function (items, getter, emptyLabel) {
      const values = Array.from(new Set(items.map(function (item) {
        return String(getter(item) || '').trim();
      }).filter(Boolean)));
      if (!values.length) return emptyLabel || '—';
      return values.length === 1 ? values[0] : 'Mixed';
    };

    const shiftSummary = uniqueContextValue(rows, function (row) {
      return row.shift;
    });
    const checkerSummary = uniqueContextValue(rows, function (row) {
      const linked = checkerByOperation.get(String(row.transaction_id)) || {};
      return row.checker_name || linked.checker_name;
    });

    const equipmentRecord = dataState.equipment.find(function (item) {
      return String(item.equipment_id || '') === String(first.equipment_id || '');
    });
    const capacityProfile = equipmentRecord && equipmentRecord.capacity_profile_id
      ? dataState.capacities.find(function (item) {
          return String(item.capacity_profile_id || '') === String(equipmentRecord.capacity_profile_id || '');
        })
      : null;
    const capacitySummary = uniqueContextValue(rows, function (row) {
      return row.applied_capacity ?? '';
    }, '');
    const resolvedCapacity = capacitySummary === 'Mixed'
      ? 'Mixed'
      : (capacitySummary !== '—' && capacitySummary !== ''
        ? capacitySummary
        : (capacityProfile && capacityProfile.capacity_value != null
          ? String(capacityProfile.capacity_value)
          : '—'));

    document.getElementById('timelineSummary').innerHTML =
      '<span><b>Domain</b><strong>' + esc(first.domain || '—') + '</strong></span>' +
      '<span><b>Work Front</b><strong>' + esc(first.work_front_id || '—') + '</strong></span>' +
      '<span><b>Unit / Fleet No.</b><strong>' + esc(unitFleetNo || '—') + '</strong></span>' +
      '<span><b>Shift</b><strong>' + esc(shiftSummary) + '</strong></span>' +
      '<span><b>Checker</b><strong>' + esc(checkerSummary) + '</strong></span>' +
      '<span><b>Capacity</b><strong>' + esc(resolvedCapacity) + '</strong></span>';

    document.getElementById('timelineRows').innerHTML = rows.map(function (row) {
      const cls = String(row.status || '').toLowerCase().replace(/[^a-z]/g, '') || 'draft';
      const id = esc(row.transaction_id);
      return '<div class="timeline-tr">' +
        '<div class="cell">' + esc(row.transaction_time || '—') + '</div>' +
        '<div class="cell">' + esc(row.activity) + '</div>' +
        '<div class="cell">' + esc(row.material || '—') + '</div>' +
        '<div class="cell">' + esc(row.retase ?? '—') + '</div>' +
        '<div class="cell">' + esc(row.quantity) + '</div>' +
        '<div class="cell">' + esc(row.measurement) + '</div>' +
        '<div class="cell">' + esc(row.actual_hours) + '</div>' +
        '<div class="cell">' + esc(row.target_hours) + '</div>' +
        '<div class="cell"><span class="statuspill ' + cls + '">' + esc(row.status) + '</span></div>' +
        '<div class="cell muted">' + esc(row.source) + '</div>' +
        '<div class="cell row-actions">' +
          '<button class="control mini edit edit-timeline-row" data-id="' + id + '">Edit</button>' +
          '<button class="control mini danger delete-timeline-row" data-id="' + id + '">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');

    const addWorkButton = document.getElementById('timelineAddWork');
    if (addWorkButton) addWorkButton.disabled = !rows.length || !shiftSummary || shiftSummary === 'Mixed';
    if(global.LithositeModalShowContract){global.LithositeModalShowContract.show('timelineModal');}else{document.getElementById('timelineModal').classList.add('show')};
  }

  function render() {
    const rows = filterRows();
    const groups = timelineGroups(rows);

    const output = groups.map(function (items) {
      const first = items[0];
      const equipment = dataState.equipment.find(function (item) {
        return String(item.equipment_id || '') === String(first.equipment_id || '');
      });
      const unitFleetNo = equipment ? equipment.unit_no : '';
      const key = esc(
        String(first.transaction_date || '') + '|' +
        (String(first.equipment_id || '').trim() ||
          'NO-EQUIPMENT|' + String(first.transaction_id || ''))
      );
      const statusValues = Array.from(new Set(items.map(function (row) {
        return String(row.status || '');
      })));
      const status = statusValues.length === 1 ? statusValues[0] : 'MIXED';
      const cls = status.toLowerCase().replace(/[^a-z]/g, '') || 'draft';
      const actualHours = items.reduce(function (sum, row) {
        return sum + (Number(row.actual_hours) || 0);
      }, 0);
      const targetHours = items.reduce(function (sum, row) {
        return sum + (Number(row.target_hours) || 0);
      }, 0);
      const totalRetase = items.reduce(function (sum, row) {
        return sum + (Number(row.retase) || 0);
      }, 0);
      const shiftValues = Array.from(new Set(items.map(function (row) {
        return String(row.shift || '').trim();
      }).filter(Boolean)));
      const shiftSummary = shiftValues.length === 1 ? shiftValues[0] : (shiftValues.length ? 'Mixed' : '—');

      return '<div class="tr td" data-trace-key="' + key + '">' +
        '<div class="cell">' + esc(first.transaction_date) + '</div>' +
        '<div class="cell">' + esc(first.transaction_time) + '</div>' +
        '<div class="cell">' + esc(shiftSummary) + '</div>' +
        '<div class="cell">' + esc(first.domain) + '</div>' +
        '<div class="cell">' + esc(first.work_front_id) + '</div>' +
        '<div class="cell">' + esc(first.equipment_id) + '</div>' +
        '<div class="cell">' + esc(unitFleetNo) + '</div>' +
        '<div class="cell"><button class="control mini event timeline-row" data-key="' + key + '">' +
          items.length + ' event' + (items.length === 1 ? '' : 's') +
        '</button></div>' +
        '<div class="cell">' + esc(totalRetase || '—') + '</div>' +
        '<div class="cell">' + esc(actualHours || '—') + '</div>' +
        '<div class="cell">' + esc(targetHours || '—') + '</div>' +
        '<div class="cell"><span class="statuspill ' + cls + '">' + esc(status) + '</span></div>' +
        (maintenanceLinksFor(items).length
          ? '<div class="cell"><button class="control mini linked maintenance-link" data-date="' + esc(first.transaction_date) + '" data-equipment="' + esc(first.equipment_id) + '">' +
              maintenanceLinksFor(items).length + ' linked</button></div>'
          : '<div class="cell muted">—</div>') +
        '<div class="cell row-actions"><button class="control mini view timeline-row" data-key="' + key + '">View</button></div>' +
      '</div>';
    }).join('');

    document.getElementById('rows').innerHTML =
      output || '<div class="empty">No operations match the current filters.</div>';

    document.getElementById('count').textContent =
      groups.length + ' work timelines · ' + rows.length + ' events · ' +
      (runtimeReady ? 'Runtime Ready' : 'Runtime Not Connected');

    if (global.LithositeOperationsGraphics) {
      global.LithositeOperationsGraphics.render(dataState);
    }
  }

  function focusTrace(target) {
    const date = String(target && target.date || '');
    const equipmentId = String(target && target.equipmentId || '').trim();
    if (!date || !equipmentId) return;

    document.getElementById('date').value = date;
    document.getElementById('eq').value = dataState.equipment.some(function (item) {
      return String(item.equipment_id || '').trim() === equipmentId;
    }) ? equipmentId : '';
    ['domain', 'wf', 'equipmentGroupFilter', 'activityFilter', 'statusFilter', 'sourceFilter']
      .forEach(function (id) {
        document.getElementById(id).value = '';
      });
    render();

    const traceKey = date + '|' + equipmentId;
    const row = Array.from(document.querySelectorAll('#rows .tr[data-trace-key]')).find(function (item) {
      return String(item.dataset.traceKey || '') === traceKey;
    });
    if (!row) return;
    row.classList.remove('operation-trace-highlight');
    void row.offsetWidth;
    row.classList.add('operation-trace-highlight');
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(function () {
      row.classList.remove('operation-trace-highlight');
    }, 2400);
  }

  async function reconcileCheckerEvidence() {
    if (!global.LithositeCheckerSupport ||
        typeof global.LithositeCheckerSupport.syncMissingFromOperations !== 'function') {
      return null;
    }

    const report = await global.LithositeCheckerSupport.syncMissingFromOperations(dataState.operations);
    if (report.created > 0) {
      const refreshed = await runtimeClient.request({ operation: 'READ', entity: 'Checker' });
      dataState.checkers = Array.isArray(refreshed.data) ? refreshed.data : [];
    }
    return report;
  }

  function checkerSyncMessage(report) {
    if (!report) return 'RuntimeAdapter connected — offline local persistence active.';
    const messages = ['RuntimeAdapter connected — offline local persistence active.'];
    if (report.created > 0) {
      messages.push('Checker evidence backfilled for ' + report.created + ' existing operation(s).');
    }
    if (report.retaseWithoutCheckerName > 0) {
      messages.push(report.retaseWithoutCheckerName +
        ' operation(s) have Retase but no Checker Name; Checker rows were not fabricated. ' +
        'Edit those operations with Checker Name, End Time, Shift, and Equipment.');
    }
    if (report.errors && report.errors.length) {
      messages.push(report.errors.length + ' operation(s) need Checker attention: ' +
        report.errors.slice(0, 2).map(function (item) {
          return item.operation_id + ': ' + item.message;
        }).join(' | '));
    }
    return messages.join(' ');
  }

  async function loadData() {
    try {
      const health = await runtimeClient.health();
      runtimeReady = health.status === 'READY';

      const results = await Promise.all([
        runtimeClient.request({ operation: 'READ', entity: 'Operations' }),
        runtimeClient.request({ operation: 'READ', entity: 'Checker' }),
        runtimeClient.request({ operation: 'READ', entity: 'WorkFront' }),
        runtimeClient.request({ operation: 'READ', entity: 'Equipment' }),
        runtimeClient.request({ operation: 'READ', entity: '_Lists' }),
        runtimeClient.request({ operation: 'READ', entity: 'GlobalCapacity' }),
        runtimeClient.request({ operation: 'READ', entity: 'Maintenance' })
      ]);

      dataState.operations = Array.isArray(results[0].data) ? results[0].data : [];
      dataState.checkers = Array.isArray(results[1].data) ? results[1].data : [];
      dataState.workFronts = Array.isArray(results[2].data) ? results[2].data : [];
      dataState.equipment = Array.isArray(results[3].data) ? results[3].data : [];
      dataState.lists = (results[4].data && typeof results[4].data === 'object') ? results[4].data : results[4];
      dataState.capacities = Array.isArray(results[5].data) ? results[5].data : [];
      dataState.maintenance = Array.isArray(results[6].data) ? results[6].data : [];

      const checkerBackfill = await reconcileCheckerEvidence();
      fillRefs();
      render();
      setRuntimeState(checkerSyncMessage(checkerBackfill), Boolean(checkerBackfill && checkerBackfill.errors && checkerBackfill.errors.length));
    } catch (error) {
      runtimeReady = false;
      render();
      setRuntimeState(
        'Runtime unavailable: ' + error.message + '. Start desktop-host/server.py.',
        true
      );
    }
  }

  async function refreshData() {
    try {
      const results = await Promise.all([
        runtimeClient.request({ operation: 'READ', entity: 'Operations' }),
        runtimeClient.request({ operation: 'READ', entity: 'Checker' }),
        runtimeClient.request({ operation: 'READ', entity: 'WorkFront' }),
        runtimeClient.request({ operation: 'READ', entity: 'Equipment' }),
        runtimeClient.request({ operation: 'READ', entity: 'Maintenance' }),
        runtimeClient.request({ operation: 'READ', entity: 'GlobalCapacity' })
      ]);
      dataState.operations = Array.isArray(results[0].data) ? results[0].data : [];
      dataState.checkers = Array.isArray(results[1].data) ? results[1].data : [];
      dataState.workFronts = Array.isArray(results[2].data) ? results[2].data : [];
      dataState.equipment = Array.isArray(results[3].data) ? results[3].data : [];
      dataState.maintenance = Array.isArray(results[4].data) ? results[4].data : [];
      dataState.capacities = Array.isArray(results[5].data) ? results[5].data : [];
      const checkerBackfill = await reconcileCheckerEvidence();
      fillRefs();
      render();
      if (checkerBackfill && (checkerBackfill.created > 0 ||
          (checkerBackfill.errors && checkerBackfill.errors.length) ||
          checkerBackfill.retaseWithoutCheckerName > 0)) {
        setRuntimeState(checkerSyncMessage(checkerBackfill), Boolean(checkerBackfill.errors && checkerBackfill.errors.length));
      }
    } catch (error) {
      setRuntimeState('Refresh failed: ' + error.message, true);
    }
  }

  function updateActivityWarning() {
    const activityEl = document.getElementById('f_activity');
    const warning = document.getElementById('activityWarning');
    if (!activityEl || !warning) return;

    const isDumping = String(activityEl.value || '').trim().toLowerCase() === 'dumping';
    warning.hidden = !isDumping;
    if (isDumping) {
      activityEl.setAttribute('aria-describedby', 'activityWarning');
    } else if (activityEl.getAttribute('aria-describedby') === 'activityWarning') {
      activityEl.removeAttribute('aria-describedby');
    }
  }

  function refreshHaulingFields() {
    updateActivityWarning();
    const activity = String(document.getElementById('f_activity').value || '').trim().toLowerCase();
    const eq = dataState.equipment.find(function(x){ return String(x.equipment_id || '') === String(document.getElementById('f_eq').value || ''); });
    const isHauling = activity === 'hauling' && String(eq && eq.type || '').trim().toLowerCase() === 'dump truck';
    let capacity = null;
    if (eq && eq.capacity_profile_id) {
      const profile = dataState.capacities.find(function(x){ return String(x.capacity_profile_id) === String(eq.capacity_profile_id); });
      if (profile) capacity = Number(profile.capacity_value);
    }
    const capacityEl=document.getElementById('f_capacity'), qtyEl=document.getElementById('f_qty'), retaseEl=document.getElementById('f_retase');
    capacityEl.value = isHauling && Number.isFinite(capacity) ? String(capacity) : '';
    capacityEl.disabled = true;
    qtyEl.readOnly = isHauling;
    if (isHauling && Number.isFinite(capacity) && retaseEl.value !== '') {
      const retase=Number(retaseEl.value);
      qtyEl.value=Number.isFinite(retase) ? String(retase*capacity) : '';
      document.getElementById('f_measurement').value='ton';
    } else if (!isHauling) {
      capacityEl.value='';
      qtyEl.readOnly=false;
    }
  }

  function resetForm() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);

    document.getElementById('f_id').value =
      'OPS-' + localDate.replaceAll('-', '') + '-' +
      Math.random().toString(36).slice(2, 8).toUpperCase();

    document.getElementById('f_date').value = localDate;
    document.getElementById('f_time').value = now.toTimeString().slice(0, 5);

    ['f_domain', 'f_wf', 'f_eq'].forEach(function (id) {
      document.getElementById(id).value = '';
    });

    document.getElementById('f_activity').value = '';
    document.getElementById('f_material').value = '';
    document.getElementById('f_checker_name').value = '';
    document.getElementById('f_retase').value = '';
    document.getElementById('f_capacity').value = '';
    document.getElementById('f_qty').value = '';
    document.getElementById('f_measurement').value = '';
    document.getElementById('f_actual').value = '';
    document.getElementById('f_target').value = '';
    document.getElementById('f_status').value = 'DRAFT';
    document.getElementById('f_source').value = 'Manual';
  }

  function openAdd() {
    editId = null;
    addWorkMode = false;
    ['f_date', 'f_eq', 'f_shift'].forEach(function (id) {
      document.getElementById(id).disabled = false;
    });
    setRuntimeState('RuntimeAdapter connected — offline local persistence active.');
    document.getElementById('modalTitle').textContent = 'Add Operation';
    document.getElementById('stage').textContent = 'Save via RuntimeAdapter';
    resetForm();
    refreshHaulingFields();
    global.LithositeModalShowContract.show('modal');
  }

  function openAddWork() {
    const rows = dataState.operations.filter(function (row) {
      const equipmentId = String(row.equipment_id || '').trim();
      const key = String(row.transaction_date || '') + '|' +
        (equipmentId || 'NO-EQUIPMENT|' + String(row.transaction_id || ''));
      return key === activeTimelineKey;
    }).sort(function (a, b) {
      return String(a.transaction_time || '').localeCompare(String(b.transaction_time || ''));
    });
    if (!rows.length) {
      setRuntimeState('Work Timeline has no event to extend.', true);
      return;
    }

    const first = rows[0];
    const shifts = Array.from(new Set(rows.map(function (row) {
      return String(row.shift || '').trim();
    }).filter(Boolean)));
    if (shifts.length !== 1) {
      setRuntimeState('Add Work requires one consistent shift in this timeline.', true);
      return;
    }

    const last = rows[rows.length - 1];
    const startParts = String(last.transaction_time || '').split(':');
    const startMinutes = (Number(startParts[0]) * 60) + Number(startParts[1]);
    const actualHours = Number(last.actual_hours);
    if (!Number.isFinite(startMinutes) || startParts.length < 2 ||
        !Number.isFinite(actualHours) || actualHours < 0) {
      setRuntimeState('Cannot calculate the next Start Time: the last event needs a valid start time and Actual Hours.', true);
      return;
    }
    const nextMinutes = Math.round(startMinutes + actualHours * 60);
    if (nextMinutes >= 24 * 60) {
      setRuntimeState('The calculated Start Time crosses midnight. Review the shift timeline before adding work.', true);
      return;
    }
    const nextTime = String(Math.floor(nextMinutes / 60)).padStart(2, '0') + ':' +
      String(nextMinutes % 60).padStart(2, '0');

    editId = null;
    addWorkMode = true;
    resetForm();
    document.getElementById('modalTitle').textContent = 'Add Work';
    document.getElementById('stage').textContent = 'Save Work via RuntimeAdapter';
    document.getElementById('f_date').value = first.transaction_date || '';
    document.getElementById('f_time').value = nextTime;
    document.getElementById('f_eq').value = first.equipment_id || '';
    document.getElementById('f_shift').value = shifts[0];
    ['f_date', 'f_eq', 'f_shift'].forEach(function (id) {
      document.getElementById(id).disabled = true;
    });
    refreshHaulingFields();
    global.LithositeModalShowContract.show('modal');
  }

  function openEdit(id) {
    addWorkMode = false;
    ['f_date', 'f_eq', 'f_shift'].forEach(function (id) {
      document.getElementById(id).disabled = false;
    });
    setRuntimeState('RuntimeAdapter connected — offline local persistence active.');
    const row = dataState.operations.find(function (item) {
      return String(item.transaction_id) === String(id);
    });

    if (!row) return;

    editId = id;
    document.getElementById('modalTitle').textContent = 'Edit Operation';
    document.getElementById('stage').textContent = 'Update via RuntimeAdapter';

    const fields = {
      f_id: row.transaction_id,
      f_date: row.transaction_date,
      f_time: row.transaction_time,
      f_end_time: row.end_time,
      f_shift: row.shift,
      f_domain: row.domain,
      f_wf: row.work_front_id,
      f_eq: row.equipment_id,
      f_activity: row.activity,
      f_material: row.material,
      f_checker_name: row.checker_name,
      f_retase: row.retase,
      f_capacity: row.applied_capacity,
      f_qty: row.quantity,
      f_measurement: row.measurement,
      f_actual: row.actual_hours,
      f_target: row.target_hours,
      f_status: row.status,
      f_source: row.source
    };

    Object.entries(fields).forEach(function (entry) {
      document.getElementById(entry[0]).value = entry[1] ?? '';
    });
    refreshHaulingFields();

    global.LithositeModalShowContract.show('modal');
  }

  async function removeRow(id) {
    const row = dataState.operations.find(function (item) {
      return String(item.transaction_id) === String(id);
    });

    if (!row) return;

    if (!await global.LithositeDeleteConfirmContract.confirm({entity:'Operation',id:id,warning:'This action is permanent in the local database. The runtime will validate and audit the deletion.'})) { return; }

    try {
      const result = await runtimeClient.request({
        operation: 'DELETE',
        entity: 'Operations',
        entity_id: id
      });

      if (result.status !== 'COMMITTED') {
        throw new Error(
          result.errors && result.errors[0] && result.errors[0].message
            ? result.errors[0].message
            : 'Delete rejected'
        );
      }

      await refreshData();
      if (activeTimelineKey) {
        openTimeline(activeTimelineKey);
      }
      setRuntimeState('Operation deleted and audited.');
    } catch (error) {
      setRuntimeState('Delete failed: ' + error.message, true);
    }
  }


  function closeOperationForm() {
    global.LithositeModalShowContract.close('modal');
    if (activeTimelineKey) {
      openTimeline(activeTimelineKey);
    }
  }

  function bindControls() {
    const bind = function (id, handler) {
      const element = document.getElementById(id);
      if (!element) throw new Error('Operations UI element #' + id + ' not found');
      element.addEventListener('click', handler);
    };

    bind('add', openAdd);
    bind('close', closeOperationForm);
    bind('cancel', closeOperationForm);
    bind('stage', saveForm);
    bind('refresh', loadData);
    ['f_wf','f_eq','f_activity','f_retase'].forEach(function(id){const el=document.getElementById(id);if(el){el.addEventListener('input',refreshHaulingFields);el.addEventListener('change',refreshHaulingFields);}});

    // Keep controls reliable after external JS extraction.
    document.getElementById('add').onclick = openAdd;
    document.getElementById('refresh').onclick = loadData;
    document.getElementById('close').onclick = closeOperationForm;
    document.getElementById('cancel').onclick = closeOperationForm;
    document.getElementById('stage').onclick = saveForm;

    const clear = document.getElementById('clear');
    if (!clear) throw new Error('Operations UI element #clear not found');
    clear.addEventListener('click', function () {
      ['date', 'domain', 'wf', 'equipmentGroupFilter', 'eq', 'activityFilter', 'statusFilter', 'sourceFilter']
        .forEach(function (id) {
          document.getElementById(id).value = '';
        });
      render();
    });

    document
      .querySelectorAll('#date,#domain,#wf,#equipmentGroupFilter,#eq,#activityFilter,#statusFilter,#sourceFilter')
      .forEach(function (element) {
        element.addEventListener('input', render);
        element.addEventListener('change', render);
      });

    document.getElementById('rows').addEventListener('click', function (event) {
      const maintenanceLink = event.target.closest('.maintenance-link');
      if (maintenanceLink) {
        const date = maintenanceLink.dataset.date || '';
        const equipmentId = maintenanceLink.dataset.equipment || '';
        if (global.LithositeShellNavigation) {
          global.LithositeShellNavigation.setScreen('Maintenance');
        }
        window.setTimeout(function () {
          if (global.LithositeMaintenance && typeof global.LithositeMaintenance.focusTrace === 'function') {
            global.LithositeMaintenance.focusTrace({
              date: date,
              equipmentId: equipmentId
            });
          }
        }, 0);
        return;
      }

      const timeline = event.target.closest('.timeline-row');
      if (timeline) {
        openTimeline(timeline.dataset.key);
        return;
      }

      const edit = event.target.closest('.edit-row');
      if (edit) openEdit(edit.dataset.id);

      const del = event.target.closest('.delete-row');
      if (del) removeRow(del.dataset.id);
    });

    document.getElementById('timelineAddWork').onclick = openAddWork;
    document.getElementById('timelineClose').onclick = function () {
      document.getElementById('timelineModal').classList.remove('show');
      activeTimelineKey = null;
    };
    document.getElementById('timelineRows').addEventListener('click', function (event) {
      const edit = event.target.closest('.edit-timeline-row');
      if (edit) {
        openEdit(edit.dataset.id);
        return;
      }

      const del = event.target.closest('.delete-timeline-row');
      if (del) removeRow(del.dataset.id);
    });
  }

  function formPayload() {
    function numberOrNull(id) {
      const value = document.getElementById(id).value;
      return value === '' ? null : Number(value);
    }

    return {
      transaction_id: document.getElementById('f_id').value,
      transaction_date: document.getElementById('f_date').value,
      transaction_time: document.getElementById('f_time').value,
      end_time: document.getElementById('f_end_time').value || null,
      shift: document.getElementById('f_shift').value,
      domain: document.getElementById('f_domain').value,
      work_front_id: document.getElementById('f_wf').value,
      equipment_id: document.getElementById('f_eq').value || null,
      activity: document.getElementById('f_activity').value,
      material: document.getElementById('f_material').value || null,
      checker_name: document.getElementById('f_checker_name').value.trim(),
      retase: numberOrNull('f_retase'),
      capacity_profile_id: (function(){ const eq=dataState.equipment.find(function(x){return String(x.equipment_id)===String(document.getElementById('f_eq').value)}); return eq ? (eq.capacity_profile_id || null) : null; })(),
      applied_capacity: numberOrNull('f_capacity'),
      capacity_measurement: 'ton',
      quantity: numberOrNull('f_qty'),
      measurement: document.getElementById('f_measurement').value,
      actual_hours: numberOrNull('f_actual'),
      target_hours: numberOrNull('f_target'),
      status: document.getElementById('f_status').value,
      source: document.getElementById('f_source').value
    };
  }

  async function saveForm() {
    if (!runtimeReady) {
      setRuntimeState(
        'RuntimeAdapter is not connected. Start desktop-host/server.py first.',
        true
      );
      return;
    }

    const row = formPayload();

    if (!row.work_front_id) {
      setRuntimeState('Work Front is required before runtime submission.', true);
      return;
    }

    try {
      const result = editId
        ? await runtimeClient.request({
            operation: 'UPDATE',
            entity: 'Operations',
            entity_id: editId,
            patch: row
          })
        : await runtimeClient.request({
            operation: 'CREATE',
            entity: 'Operations',
            row: row
          });

      if (result.status !== 'COMMITTED') {
        throw new Error(
          result.errors && result.errors.length
            ? result.errors.map(function (item) { return item.message; }).join('; ')
            : 'Runtime rejected the operation'
        );
      }

      const wasEditing = Boolean(editId);
      const wasAddingWork = addWorkMode;
      const savedTimelineKey = activeTimelineKey;
      const savedRowKey = String(row.transaction_date || '') + '|' +
        (String(row.equipment_id || '').trim() ||
          'NO-EQUIPMENT|' + String(row.transaction_id || ''));

      let checkerMessage = '';
      if (global.LithositeCheckerSupport) {
        try {
          const checkerResult = await global.LithositeCheckerSupport.syncFromOperation(row);
          if (checkerResult.status === 'CREATED') checkerMessage = ' Checker evidence recorded.';
          if (checkerResult.status === 'UPDATED') checkerMessage = ' Checker evidence updated.';
        } catch (checkerError) {
          checkerMessage = ' Warning: operation committed, but Checker evidence was not recorded: ' + checkerError.message;
        }
      }

      global.LithositeModalShowContract.close('modal');
      await refreshData();

      if (wasEditing && savedTimelineKey) {
        openTimeline(savedRowKey);
      } else if (wasAddingWork && savedTimelineKey) {
        openTimeline(savedTimelineKey);
      } else if (!wasEditing) {
        activeTimelineKey = null;
      }
      addWorkMode = false;

      setRuntimeState(
        wasEditing ? 'Operation updated and audited.' + checkerMessage :
          (wasAddingWork ? 'Work added to the existing timeline.' + checkerMessage : 'Operation created and audited.' + checkerMessage)
      );
    } catch (error) {
      setRuntimeState('Validation/runtime error: ' + error.message, true);
    }
  }

  if (global.LithositeDataSync) global.LithositeDataSync.register('Operations', refreshData);


  // Operations Graphics presentation is mounted by the Operations module, not embedded in the artifact HTML.
  const operationsGraphicsContent = document.getElementById('operationsGraphicsContent');
  if (operationsGraphicsContent && !operationsGraphicsContent.dataset.initialized) {
    operationsGraphicsContent.innerHTML = "\n<section class=\"operations-graphics-card operations-material-card\"><div class=\"operations-graphics-card-head\"><div><strong>Material Movement</strong><span>Classified material and retase overview</span></div></div><div class=\"operations-material-content\"><div class=\"operations-material-donut\" role=\"img\" aria-label=\"Material movement totals: Ore 212 tons, OB 292.5 tons, Quarry 51 tons, Top Soil 55 tons\"><div class=\"operations-material-hole\"><strong>610.5</strong><span>total ton</span></div></div><div class=\"operations-material-legend\"><div><i style=\"--dot:#3b82f6\"></i><span>Ore</span><b>212 <small>ton</small></b></div><div><i style=\"--dot:#f59e0b\"></i><span>OB</span><b>292.5 <small>ton</small></b></div><div><i style=\"--dot:#22c55e\"></i><span>Quarry</span><b>51 <small>ton</small></b></div><div><i style=\"--dot:#a78bfa\"></i><span>Top Soil</span><b>55 <small>ton</small></b></div><hr><div><i style=\"--dot:#94a3b8\"></i><span>Retase</span><b>23 <small>rit</small></b></div><div class=\"operations-sr-row\"><span>S/R</span><span class=\"operations-coming-soon\">Coming Soon</span></div></div></div><button type=\"button\" class=\"operations-partnership-card\" data-partnerships-open aria-haspopup=\"dialog\" aria-controls=\"operationsPartnershipsModal\"><span class=\"operations-partnership-icon\" aria-hidden=\"true\">🤝</span><span class=\"operations-partnership-copy\"><strong>Mitra Operasional Tambang</strong><small>Partnership · Vendor · Advertising</small><em>Explore partnership <span aria-hidden=\"true\">↗</span></em></span></button></section>\n<section class=\"operations-graphics-card operations-hauling-card\"><div class=\"operations-hauling-heading\"><div><strong>Dump Truck — Hauling</strong><span>Production &amp; Fleet Activity · 16 Oct 2026 (Shift 1)</span></div></div><div class=\"operations-hauling-grid\">\n<section class=\"operations-hauling-panel operations-activity-panel\"><div class=\"operations-panel-title\"><div><strong>Daily Hauling Activity</strong><span>Relative daily trend (each metric scaled to its own peak)</span></div><div class=\"operations-chart-legend\"><span><i style=\"--dot:#22d983\"></i>Tonnage (relative to peak)</span><span><i style=\"--dot:#12cce8\"></i>Trips (relative to peak)</span></div></div><div class=\"operations-hauling-chart\" role=\"img\" aria-label=\"Illustrative daily normalized tonnage and trips from October 10 to 16\"><div class=\"operations-ylabels\"><span>100%</span><span>80%</span><span>60%</span><span>40%</span><span>20%</span><span>0%</span></div><div class=\"operations-chart-plot\"><div class=\"operations-chart-grid\"></div><div class=\"operations-chart-bars\"><div><i style=\"height:35%\"></i><b style=\"height:44%\"></b></div><div><i style=\"height:69%\"></i><b style=\"height:60%\"></b></div><div><i style=\"height:84%\"></i><b style=\"height:75%\"></b></div><div><i style=\"height:100%\"></i><b style=\"height:90%\"></b></div><div><i style=\"height:64%\"></i><b style=\"height:69%\"></b></div><div><i style=\"height:38%\"></i><b style=\"height:48%\"></b></div><div><i style=\"height:56%\"></i><b style=\"height:60%\"></b></div></div><div class=\"operations-chart-xlabels\"><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span>15</span><span>16</span></div></div></div><p class=\"operations-chart-note\">Illustrative trend · daily values normalized independently</p></section>\n<div class=\"operations-hauling-side\"><section class=\"operations-hauling-panel operations-downtime-panel\"><div class=\"operations-downtime-heading\"><span class=\"operations-wrench\" aria-hidden=\"true\">🔧</span><div><strong>Accumulated Breakdown &amp; Repair Hours</strong><span>Only units used for hauling in this period</span></div><b>11.0 h<small>(jam-unit)</small></b></div><div class=\"operations-downtime-bar\"><i></i><b></b></div><div class=\"operations-downtime-legend\"><span><i></i>Breakdown <b>7.5 h</b></span><span><i></i>Repair <b>3.5 h</b></span></div></section>\n<section class=\"operations-hauling-panel operations-timeline-panel\"><h3>Unit Timeline Example <span>Shift 06:00–18:00 · Effective 11 h</span></h3><div class=\"operations-timeline-hours\"><span>06:00</span><span>10:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div><div class=\"operations-timeline-row\"><span class=\"operations-truck-emoji\">🚛</span><b>DT 1</b><div><i></i><em></em><i></i></div><strong>1.5 h</strong></div><div class=\"operations-timeline-row\"><span class=\"operations-truck-emoji\">🚛</span><b>DT 2</b><div><i></i><em></em><i></i></div><strong>2.0 h</strong></div><div class=\"operations-timeline-row\"><span class=\"operations-truck-emoji\">🚛</span><b>DT 3</b><div><i></i><mark></mark></div><strong>7.5 h</strong></div><div class=\"operations-timeline-row\"><span class=\"operations-truck-emoji\">🚛</span><b>DT 4</b><div><i style=\"width:48%\"></i><em style=\"width:18%\"></em><i style=\"width:34%\"></i></div><strong>0.0 h</strong></div><div class=\"operations-timeline-legend\"><span><i></i>Operating (Hauling)</span><span><i></i>Repairing</span><span><i></i>Breakdown / Not Ready</span></div></section></div>\n<section class=\"operations-hauling-panel operations-utilization-panel\"><div class=\"operations-util-item\"><span class=\"operations-util-icon operations-util-icon-tonnage\" aria-hidden=\"true\">🚚</span><div><small>Period Total (Tonnage)</small><strong>1,245 t</strong></div></div><div class=\"operations-util-item\"><span class=\"operations-util-icon operations-util-icon-trips\" aria-hidden=\"true\">🔁</span><div><small>Period Total (Trips)</small><strong>86 rit</strong></div></div><div class=\"operations-utilization\"><span aria-hidden=\"true\">📊</span><div><strong>Fleet Utilization</strong><small>Persentase waktu unit aktif</small></div><div class=\"operations-util-bar\"><i></i></div><b>68%</b><div class=\"operations-util-foot\"><span>Active time <b>327.5 h</b></span><span>Total available <b>480 h</b></span></div></div></section>\n</div>";
    operationsGraphicsContent.dataset.initialized = 'true';
  }

  // Operations Graphics modal follows the established Equipment Graphics modal contract.
  const operationsGraphicsButton = document.getElementById('operationsGraphicsButton');
  const operationsGraphicsClose = document.getElementById('operationsGraphicsClose');
  const operationsGraphicsHelp = document.getElementById('operationsGraphicsHelp');
  const operationsGuideClose = document.getElementById('operationsGuideClose');
  const operationsGuideModal = document.getElementById('operationsGuideModal');
  if (operationsGraphicsButton) operationsGraphicsButton.addEventListener('click', function () {
    global.LithositeModalShowContract.show('operationsGraphicsModal');
  });
  if (operationsGraphicsClose) operationsGraphicsClose.addEventListener('click', function () {
    global.LithositeModalShowContract.close('operationsGraphicsModal');
  });
  if (operationsGraphicsHelp) operationsGraphicsHelp.addEventListener('click', function (event) {
    if (event) event.preventDefault();
    if (operationsGuideModal) operationsGuideModal.style.removeProperty('display');
    global.LithositeModalShowContract.show('operationsGuideModal');
  });
  function closeOperationsGuide(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!operationsGuideModal) return;
    // This guide has no standard modal body/footer, so close it directly rather
    // than relying on the shared contract's animated-shell eligibility checks.
    try {
      if (global.LithositeModalShowContract && typeof global.LithositeModalShowContract.close === 'function') {
        global.LithositeModalShowContract.close('operationsGuideModal');
      }
    } catch (error) {
      // The explicit local close below remains authoritative.
    }
    operationsGuideModal.classList.remove('show', 'open', 'is-closing');
    operationsGuideModal.setAttribute('aria-hidden', 'true');
    operationsGuideModal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
  if (operationsGuideClose) {
    operationsGuideClose.addEventListener('click', closeOperationsGuide);
    // Assign a direct handler too, so the close action remains reliable if
    // another module overwrites or intercepts ordinary click listeners.
    operationsGuideClose.onclick = closeOperationsGuide;
  }
  if (operationsGuideModal) operationsGuideModal.addEventListener('click', function (event) {
    if (event.target === operationsGuideModal) closeOperationsGuide();
  });
  if (operationsGuideModal) operationsGuideModal.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeOperationsGuide();
  });
  const operationsGraphicsModal = document.getElementById('operationsGraphicsModal');
  if (operationsGraphicsModal) operationsGraphicsModal.addEventListener('click', function (event) {
    if (event.target === operationsGraphicsModal) global.LithositeModalShowContract.close('operationsGraphicsModal');
  });

  bindControls();
  loadData();
  global.LithositeOperations = Object.freeze({ focusTrace: focusTrace });
})(window);
