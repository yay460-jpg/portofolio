(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;
  if (!runtimeClient) {
    throw new Error('LithositeRuntimeClient is required before operations.js');
  }

  const modal = document.getElementById('modal');
  const dataState = { operations: [], workFronts: [], equipment: [], maintenance: [], lists: {} };

  let editId = null;
  let runtimeReady = false;
  let activeTimelineKey = null;

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
      'f_unit',
      Array.isArray(dataState.lists.unit)
        ? dataState.lists.unit.map(function (unit) { return { unit: unit }; })
        : [],
      'unit',
      function (x) { return x.unit; },
      'Select unit'
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
    const eq = document.getElementById('eq').value;
    const activity = document.getElementById('activityFilter').value.trim().toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const source = document.getElementById('sourceFilter').value.trim().toLowerCase();

    return dataState.operations.filter(function (row) {
      return (!date || String(row.transaction_date || '') === date) &&
        (!domain || row.domain === domain) &&
        (!wf || row.work_front_id === wf) &&
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
    const equipment = dataState.equipment.find(function (item) {
      return String(item.equipment_id || '') === String(first.equipment_id || '');
    });
    const unitFleetNo = equipment ? equipment.unit_no : '';

    document.getElementById('timelineTitle').textContent =
      'Work Timeline — ' + (first.equipment_id || 'Unassigned');

    document.getElementById('timelineMeta').textContent =
      String(first.transaction_date || '—') + ' · Start ' +
      String(first.transaction_time || '—') + ' · End ' +
      String(rows[rows.length - 1].transaction_time || '—') +
      ' · ' + rows.length + ' events';

    document.getElementById('timelineSummary').innerHTML =
      '<span><b>Domain</b> ' + esc(first.domain) + '</span>' +
      '<span><b>Work Front</b> ' + esc(first.work_front_id) + '</span>' +
      '<span><b>Unit / Fleet No.</b> ' + esc(unitFleetNo) + '</span>';

    document.getElementById('timelineRows').innerHTML = rows.map(function (row) {
      const cls = String(row.status || '').toLowerCase().replace(/[^a-z]/g, '') || 'draft';
      const id = esc(row.transaction_id);
      return '<div class="timeline-tr">' +
        '<div class="cell">' + esc(row.transaction_time) + '</div>' +
        '<div class="cell">' + esc(row.work_front_id) + '</div>' +
        '<div class="cell">' + esc(row.activity) + '</div>' +
        '<div class="cell">' + esc(row.quantity) + '</div>' +
        '<div class="cell">' + esc(row.unit) + '</div>' +
        '<div class="cell">' + esc(row.actual_hours) + '</div>' +
        '<div class="cell">' + esc(row.target_hours) + '</div>' +
        '<div class="cell"><span class="statuspill ' + cls + '">' + esc(row.status) + '</span></div>' +
        '<div class="cell muted">' + esc(row.source) + '</div>' +
        '<div class="cell row-actions">' +
          '<button class="control mini edit-timeline-row" data-id="' + id + '">Edit</button>' +
          '<button class="control mini danger delete-timeline-row" data-id="' + id + '">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');

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

      return '<div class="tr td">' +
        '<div class="cell">' + esc(first.transaction_date) + '</div>' +
        '<div class="cell">' + esc(first.transaction_time) + '</div>' +
        '<div class="cell">' + esc(first.domain) + '</div>' +
        '<div class="cell">' + esc(first.work_front_id) + '</div>' +
        '<div class="cell">' + esc(first.equipment_id) + '</div>' +
        '<div class="cell">' + esc(unitFleetNo) + '</div>' +
        '<div class="cell"><button class="control mini timeline-row" data-key="' + key + '">' +
          items.length + ' event' + (items.length === 1 ? '' : 's') +
        '</button></div>' +
        '<div class="cell">' + esc(actualHours || '—') + '</div>' +
        '<div class="cell">' + esc(targetHours || '—') + '</div>' +
        '<div class="cell"><span class="statuspill ' + cls + '">' + esc(status) + '</span></div>' +
        (maintenanceLinksFor(items).length
          ? '<div class="cell"><button class="control mini maintenance-link" data-date="' + esc(first.transaction_date) + '" data-equipment="' + esc(first.equipment_id) + '">' +
              maintenanceLinksFor(items).length + ' linked</button></div>'
          : '<div class="cell muted">—</div>') +
        '<div class="cell row-actions"><button class="control mini timeline-row" data-key="' + key + '">View</button></div>' +
      '</div>';
    }).join('');

    document.getElementById('rows').innerHTML =
      output || '<div class="empty">No operations match the current filters.</div>';

    document.getElementById('count').textContent =
      groups.length + ' work timelines · ' + rows.length + ' events · ' +
      (runtimeReady ? 'Runtime Ready' : 'Runtime Not Connected');
  }

  async function loadData() {
    try {
      const health = await runtimeClient.health();
      runtimeReady = health.status === 'READY';

      const results = await Promise.all([
        runtimeClient.request({ operation: 'READ', entity: 'Operations' }),
        runtimeClient.request({ operation: 'READ', entity: 'WorkFront' }),
        runtimeClient.request({ operation: 'READ', entity: 'Equipment' }),
        runtimeClient.request({ operation: 'READ', entity: '_Lists' }),
        runtimeClient.request({ operation: 'READ', entity: 'Maintenance' })
      ]);

      dataState.operations = Array.isArray(results[0].data) ? results[0].data : [];
      dataState.workFronts = Array.isArray(results[1].data) ? results[1].data : [];
      dataState.equipment = Array.isArray(results[2].data) ? results[2].data : [];
      dataState.lists = (results[3].data && typeof results[3].data === 'object') ? results[3].data : results[3];
      dataState.maintenance = Array.isArray(results[4].data) ? results[4].data : [];

      fillRefs();
      render();
      setRuntimeState('RuntimeAdapter connected — offline local persistence active.');
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
        runtimeClient.request({ operation: 'READ', entity: 'WorkFront' }),
        runtimeClient.request({ operation: 'READ', entity: 'Equipment' }),
        runtimeClient.request({ operation: 'READ', entity: 'Maintenance' })
      ]);
      dataState.operations = Array.isArray(results[0].data) ? results[0].data : [];
      dataState.workFronts = Array.isArray(results[1].data) ? results[1].data : [];
      dataState.equipment = Array.isArray(results[2].data) ? results[2].data : [];
      dataState.maintenance = Array.isArray(results[3].data) ? results[3].data : [];
      fillRefs();
      render();
    } catch (error) {
      setRuntimeState('Refresh failed: ' + error.message, true);
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
    document.getElementById('f_qty').value = '';
    document.getElementById('f_unit').value = '';
    document.getElementById('f_actual').value = '';
    document.getElementById('f_target').value = '';
    document.getElementById('f_status').value = 'DRAFT';
    document.getElementById('f_source').value = 'Manual';
  }

  function openAdd() {
    editId = null;
    setRuntimeState('');
    document.getElementById('modalTitle').textContent = 'Add Operation';
    document.getElementById('stage').textContent = 'Save via RuntimeAdapter';
    resetForm();
    modal.classList.add('show');
  }

  function openEdit(id) {
    setRuntimeState('');
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
      f_domain: row.domain,
      f_wf: row.work_front_id,
      f_eq: row.equipment_id,
      f_activity: row.activity,
      f_qty: row.quantity,
      f_unit: row.unit,
      f_actual: row.actual_hours,
      f_target: row.target_hours,
      f_status: row.status,
      f_source: row.source
    };

    Object.entries(fields).forEach(function (entry) {
      document.getElementById(entry[0]).value = entry[1] ?? '';
    });

    modal.classList.remove('modal-fade-out');
    modal.classList.add('show', 'modal-fade-in');
  }

  async function removeRow(id) {
    const row = dataState.operations.find(function (item) {
      return String(item.transaction_id) === String(id);
    });

    if (!row) return;

    if (!confirm(
      'Delete operation ' + id + '?\nThis action is permanent in the local database.'
    )) {
      return;
    }

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
      setRuntimeState('Operation deleted and audited.');
    } catch (error) {
      setRuntimeState('Delete failed: ' + error.message, true);
    }
  }


  function bindControls() {
    const bind = function (id, handler) {
      const element = document.getElementById(id);
      if (!element) throw new Error('Operations UI element #' + id + ' not found');
      element.addEventListener('click', handler);
    };

    bind('add', openAdd);
    bind('close', function () { modal.classList.remove('show'); });
    bind('cancel', function () { modal.classList.remove('show'); });
    bind('stage', saveForm);
    bind('refresh', loadData);

    // Keep controls reliable after external JS extraction.
    document.getElementById('add').onclick = openAdd;
    document.getElementById('refresh').onclick = loadData;
    document.getElementById('close').onclick = function () { modal.classList.remove('show'); };
    document.getElementById('cancel').onclick = function () { modal.classList.remove('show'); };
    document.getElementById('stage').onclick = saveForm;

    const clear = document.getElementById('clear');
    if (!clear) throw new Error('Operations UI element #clear not found');
    clear.addEventListener('click', function () {
      ['date', 'domain', 'wf', 'eq', 'activityFilter', 'statusFilter', 'sourceFilter']
        .forEach(function (id) {
          document.getElementById(id).value = '';
        });
      render();
    });

    document
      .querySelectorAll('#date,#domain,#wf,#eq,#activityFilter,#statusFilter,#sourceFilter')
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

    document.getElementById('timelineClose').onclick = function () {
      document.getElementById('timelineModal').classList.remove('show');
      activeTimelineKey = null;
    };
    document.getElementById('timelineRows').addEventListener('click', function (event) {
      const edit = event.target.closest('.edit-timeline-row');
      if (edit) {
        document.getElementById('timelineModal').classList.remove('show');
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
      domain: document.getElementById('f_domain').value,
      work_front_id: document.getElementById('f_wf').value,
      equipment_id: document.getElementById('f_eq').value || null,
      activity: document.getElementById('f_activity').value,
      quantity: numberOrNull('f_qty'),
      unit: document.getElementById('f_unit').value,
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
      const savedTimelineKey = activeTimelineKey;
      const savedRowKey = String(row.transaction_date || '') + '|' +
        (String(row.equipment_id || '').trim() ||
          'NO-EQUIPMENT|' + String(row.transaction_id || ''));

      modal.classList.remove('show');
      await refreshData();

      if (wasEditing && savedTimelineKey) {
        openTimeline(savedRowKey);
      } else if (!wasEditing) {
        activeTimelineKey = null;
      }

      setRuntimeState(
        wasEditing ? 'Operation updated and audited.' : 'Operation created and audited.'
      );
    } catch (error) {
      setRuntimeState('Validation/runtime error: ' + error.message, true);
    }
  }

  if (global.LithositeDataSync) global.LithositeDataSync.register('Operations', refreshData);

  bindControls();
  loadData();
})(window);
