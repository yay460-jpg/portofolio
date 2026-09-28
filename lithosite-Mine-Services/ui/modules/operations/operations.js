(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;
  if (!runtimeClient) {
    throw new Error('LithositeRuntimeClient is required before operations.js');
  }

  const side = document.getElementById('side');
  const toggle = document.getElementById('toggle');
  const modal = document.getElementById('modal');
  const dataState = { operations: [], workFronts: [], equipment: [] };

  let editId = null;
  let runtimeReady = false;

  if (toggle) {
    toggle.onclick = function () {
      side.classList.toggle('expanded');
    };
  }

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

    const domains = Array.from(new Set(
      dataState.workFronts.map(function (x) { return x.domain; }).filter(Boolean)
    )).sort();

    optionize(
      'domain',
      domains.map(function (domain) { return { domain: domain }; }),
      'domain',
      function (x) { return x.domain; },
      'All domains'
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

    optionize(
      'f_domain',
      domains.map(function (domain) { return { domain: domain }; }),
      'domain',
      function (x) { return x.domain; },
      'Select domain'
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

  function render() {
    const rows = filterRows();

    const output = rows.map(function (row) {
      const cls = String(row.status || '').toLowerCase().replace(/[^a-z]/g, '') || 'draft';
      const id = esc(row.transaction_id);

      return '<div class="tr td">' +
        '<div class="cell">' + esc(row.transaction_date) + '</div>' +
        '<div class="cell">' + esc(row.transaction_time) + '</div>' +
        '<div class="cell">' + esc(row.domain) + '</div>' +
        '<div class="cell">' + esc(row.work_front_id) + '</div>' +
        '<div class="cell">' + esc(row.equipment_id) + '</div>' +
        '<div class="cell">' + esc(row.activity) + '</div>' +
        '<div class="cell">' + esc(row.quantity) + '</div>' +
        '<div class="cell">' + esc(row.unit) + '</div>' +
        '<div class="cell">' + esc(row.actual_hours) + '</div>' +
        '<div class="cell">' + esc(row.target_hours) + '</div>' +
        '<div class="cell"><span class="statuspill ' + cls + '">' + esc(row.status) + '</span></div>' +
        '<div class="cell muted">' + esc(row.source) + '</div>' +
        '<div class="cell row-actions">' +
          '<button class="control mini edit-row" data-id="' + id + '">Edit</button>' +
          '<button class="control mini danger delete-row" data-id="' + id + '">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');

    document.getElementById('rows').innerHTML =
      output || '<div class="empty">No operations match the current filters.</div>';

    document.getElementById('count').textContent =
      rows.length + ' records · ' + (runtimeReady ? 'Runtime Ready' : 'Runtime Not Connected');
  }

  async function loadData() {
    try {
      const health = await runtimeClient.health();
      runtimeReady = health.status === 'READY';

      const results = await Promise.all([
        runtimeClient.request({ operation: 'READ', entity: 'Operations' }),
        runtimeClient.request({ operation: 'READ', entity: 'WorkFront' }),
        runtimeClient.request({ operation: 'READ', entity: 'Equipment' })
      ]);

      dataState.operations = Array.isArray(results[0].data) ? results[0].data : [];
      dataState.workFronts = Array.isArray(results[1].data) ? results[1].data : [];
      dataState.equipment = Array.isArray(results[2].data) ? results[2].data : [];

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
    document.getElementById('modalTitle').textContent = 'Add Operation';
    document.getElementById('stage').textContent = 'Save via RuntimeAdapter';
    resetForm();
    modal.classList.add('show');
  }

  function openEdit(id) {
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

    modal.classList.add('show');
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

      await loadData();
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
      const edit = event.target.closest('.edit-row');
      if (edit) openEdit(edit.dataset.id);

      const del = event.target.closest('.delete-row');
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

      modal.classList.remove('show');
      await loadData();
      setRuntimeState(
        editId ? 'Operation updated and audited.' : 'Operation created and audited.'
      );
    } catch (error) {
      setRuntimeState('Validation/runtime error: ' + error.message, true);
    }
  }

  bindControls();
  loadData();
})(window);
