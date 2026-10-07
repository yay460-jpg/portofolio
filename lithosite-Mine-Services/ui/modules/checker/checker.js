(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;
  if (!runtimeClient) throw new Error('LithositeRuntimeClient is required before checker.js');

  const modal = document.getElementById('checkerModal');
  const dataState = { checkers: [], workFronts: [], equipment: [], lists: {} };
  let editId = null;
  let runtimeReady = false;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (match) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[match];
    });
  }

  function setMsg(text, error) {
    const el = document.getElementById('checkerRuntimeMsg');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('error', Boolean(error));
  }

  function optionize(id, items, valueKey, labelFn, emptyLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    el.innerHTML = '<option value="">' + emptyLabel + '</option>' +
      items.map(function (item) {
        return '<option value="' + esc(item[valueKey]) + '">' + esc(labelFn(item)) + '</option>';
      }).join('');
    if (items.some(function (item) { return String(item[valueKey]) === current; })) el.value = current;
  }

  function fillRefs() {
    optionize('checkerFilterShift',
      [{value:'Day'},{value:'Night'}], 'value', function (x) { return x.value; }, 'All shifts');
    optionize('checkerFilterEquipment', dataState.equipment, 'equipment_id',
      function (x) { return x.equipment_id + ' — ' + (x.type || ''); }, 'All equipment');
    optionize('checkerEquipment', dataState.equipment, 'equipment_id',
      function (x) { return x.equipment_id + ' — ' + (x.type || ''); }, 'Select equipment');
    optionize('checkerWorkFront', dataState.workFronts, 'work_front_id',
      function (x) { return x.work_front_id + ' — ' + (x.location || ''); }, 'Select work front');

    const shifts = Array.isArray(dataState.lists.checker_shift) ? dataState.lists.checker_shift : ['Day','Night'];
    const materials = Array.isArray(dataState.lists.checker_material) ? dataState.lists.checker_material : ['Ore','OB','Quarry'];
    optionize('checkerShift', shifts.map(function (x) { return {value:x}; }), 'value', function (x) { return x.value; }, 'Select shift');
    optionize('checkerMaterial', materials.map(function (x) { return {value:x}; }), 'value', function (x) { return x.value; }, 'Not specified');
  }

  function equipmentFor(id) {
    return dataState.equipment.find(function (x) {
      return String(x.equipment_id || '') === String(id || '');
    }) || null;
  }

  function refreshContext() {
    const equipment = equipmentFor(document.getElementById('checkerEquipment').value);
    const type = document.getElementById('checkerEquipmentType');
    if (type) type.value = equipment ? (equipment.type || '') : '';

    const activity = String(document.getElementById('checkerActivity').value || '').trim().toLowerCase();
    const isHauling = activity === 'hauling' && equipment &&
      String(equipment.type || '').trim().toLowerCase() === 'dump truck';

    const retase = document.getElementById('checkerRetase');
    if (retase) {
      retase.disabled = !isHauling;
      retase.required = isHauling;
      if (!isHauling) retase.value = '';
    }
  }

  function resetForm() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    document.getElementById('checkerId').value =
      'CHK-' + localDate.replaceAll('-', '') + '-' +
      Math.random().toString(36).slice(2, 8).toUpperCase();
    document.getElementById('checkerName').value = '';
    document.getElementById('checkerDate').value = localDate;
    document.getElementById('checkerStart').value = now.toTimeString().slice(0, 5);
    document.getElementById('checkerEnd').value = '';
    document.getElementById('checkerShift').value = '';
    document.getElementById('checkerEquipment').value = '';
    document.getElementById('checkerEquipmentType').value = '';
    document.getElementById('checkerWorkFront').value = '';
    document.getElementById('checkerActivity').value = '';
    document.getElementById('checkerMaterial').value = '';
    document.getElementById('checkerRetase').value = '';
    document.getElementById('checkerSource').value = 'Checker';
    refreshContext();
  }

  function filterRows() {
    const date = document.getElementById('checkerFilterDate').value;
    const shift = document.getElementById('checkerFilterShift').value;
    const equipment = document.getElementById('checkerFilterEquipment').value;
    const activity = document.getElementById('checkerFilterActivity').value.trim().toLowerCase();
    return dataState.checkers.filter(function (row) {
      return (!date || String(row.observation_date || '') === date) &&
        (!shift || row.shift === shift) &&
        (!equipment || row.equipment_id === equipment) &&
        (!activity || String(row.activity || '').toLowerCase().includes(activity));
    });
  }

  function render() {
    const rows = filterRows().sort(function (a, b) {
      return (String(a.observation_date || '') + String(a.start_time || ''))
        .localeCompare(String(b.observation_date || '') + String(b.start_time || ''));
    });
    document.getElementById('checkerRows').innerHTML = rows.map(function (row) {
      const eq = equipmentFor(row.equipment_id);
      return '<div class="checker-tr td">' +
        '<div class="cell">' + esc(row.observation_date) + '</div>' +
        '<div class="cell">' + esc(row.start_time) + '–' + esc(row.end_time || '—') + '</div>' +
        '<div class="cell">' + esc(row.shift) + '</div>' +
        '<div class="cell">' + esc(row.equipment_id) + '</div>' +
        '<div class="cell">' + esc(eq ? eq.type : '—') + '</div>' +
        '<div class="cell">' + esc(row.work_front_id) + '</div>' +
        '<div class="cell">' + esc(row.activity) + '</div>' +
        '<div class="cell">' + esc(row.material || '—') + '</div>' +
        '<div class="cell">' + esc(row.retase ?? '—') + '</div>' +
        '<div class="cell">' + esc(row.checker_name) + '</div>' +
        '<div class="cell row-actions">' +
          '<button class="control mini checker-edit" data-id="' + esc(row.checker_id) + '">Edit</button>' +
          '<button class="control mini danger checker-delete" data-id="' + esc(row.checker_id) + '">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('') || '<div class="empty">No checker observations match the current filters.</div>';

    document.getElementById('checkerCount').textContent =
      rows.length + ' observations · ' + (runtimeReady ? 'Runtime Ready' : 'Runtime Not Connected');
  }

  async function loadData() {
    try {
      const health = await runtimeClient.health();
      runtimeReady = health.status === 'READY';
      const results = await Promise.all([
        runtimeClient.request({operation:'READ', entity:'Checker'}),
        runtimeClient.request({operation:'READ', entity:'WorkFront'}),
        runtimeClient.request({operation:'READ', entity:'Equipment'}),
        runtimeClient.request({operation:'READ', entity:'_Lists'})
      ]);
      dataState.checkers = Array.isArray(results[0].data) ? results[0].data : [];
      dataState.workFronts = Array.isArray(results[1].data) ? results[1].data : [];
      dataState.equipment = Array.isArray(results[2].data) ? results[2].data : [];
      dataState.lists = results[3].data && typeof results[3].data === 'object' ? results[3].data : results[3];
      fillRefs();
      render();
      setMsg('RuntimeAdapter connected — field observations use local persistence.');
    } catch (error) {
      runtimeReady = false;
      render();
      setMsg('Runtime unavailable: ' + error.message + '. Start desktop-host/server.py.', true);
    }
  }

  function openAdd() {
    editId = null;
    document.getElementById('checkerModalTitle').textContent = 'Add Checker Observation';
    resetForm();
    setMsg('');
    if (global.LithositeModalShowContract) global.LithositeModalShowContract.show('checkerModal');
    else modal.classList.add('show');
  }

  function openEdit(id) {
    const row = dataState.checkers.find(function (item) {
      return String(item.checker_id) === String(id);
    });
    if (!row) return;
    editId = id;
    document.getElementById('checkerModalTitle').textContent = 'Edit Checker Observation';
    document.getElementById('checkerId').value = row.checker_id || '';
    document.getElementById('checkerName').value = row.checker_name || '';
    document.getElementById('checkerDate').value = row.observation_date || '';
    document.getElementById('checkerStart').value = row.start_time || '';
    document.getElementById('checkerEnd').value = row.end_time || '';
    document.getElementById('checkerShift').value = row.shift || '';
    document.getElementById('checkerEquipment').value = row.equipment_id || '';
    document.getElementById('checkerWorkFront').value = row.work_front_id || '';
    document.getElementById('checkerActivity').value = row.activity || '';
    document.getElementById('checkerMaterial').value = row.material || '';
    document.getElementById('checkerRetase').value = row.retase ?? '';
    document.getElementById('checkerSource').value = row.source || 'Checker';
    refreshContext();
    if (global.LithositeModalShowContract) global.LithositeModalShowContract.show('checkerModal');
    else modal.classList.add('show');
  }

  function payload() {
    const retase = document.getElementById('checkerRetase').value;
    return {
      checker_id: document.getElementById('checkerId').value,
      checker_name: document.getElementById('checkerName').value.trim(),
      observation_date: document.getElementById('checkerDate').value,
      start_time: document.getElementById('checkerStart').value,
      end_time: document.getElementById('checkerEnd').value || null,
      shift: document.getElementById('checkerShift').value,
      equipment_id: document.getElementById('checkerEquipment').value,
      work_front_id: document.getElementById('checkerWorkFront').value,
      activity: document.getElementById('checkerActivity').value.trim(),
      material: document.getElementById('checkerMaterial').value || null,
      retase: retase === '' ? null : Number(retase),
      source: document.getElementById('checkerSource').value
    };
  }

  async function save() {
    if (!runtimeReady) return setMsg('RuntimeAdapter is not connected.', true);
    const row = payload();
    if (!row.checker_name || !row.observation_date || !row.start_time || !row.shift ||
        !row.equipment_id || !row.work_front_id || !row.activity) {
      return setMsg('Complete the required Checker observation fields before saving.', true);
    }
    try {
      const result = editId
        ? await runtimeClient.request({operation:'UPDATE', entity:'Checker', entity_id:editId, patch:row})
        : await runtimeClient.request({operation:'CREATE', entity:'Checker', row:row});
      if (result.status !== 'COMMITTED') {
        throw new Error(result.errors && result.errors.length
          ? result.errors.map(function (x) { return x.message; }).join('; ')
          : 'Runtime rejected the Checker observation');
      }
      if (global.LithositeModalShowContract) global.LithositeModalShowContract.close('checkerModal');
      else modal.classList.remove('show');
      await loadData();
      setMsg(editId ? 'Checker observation updated and audited.' : 'Checker observation created and audited.');
      editId = null;
    } catch (error) {
      setMsg('Validation/runtime error: ' + error.message, true);
    }
  }

  async function remove(id) {
    if (!confirm('Delete Checker observation ' + id + '?\nThis action is permanent in the local database.')) return;
    try {
      const result = await runtimeClient.request({operation:'DELETE', entity:'Checker', entity_id:id});
      if (result.status !== 'COMMITTED') throw new Error(
        result.errors && result.errors[0] ? result.errors[0].message : 'Delete rejected'
      );
      await loadData();
    } catch (error) {
      setMsg('Delete failed: ' + error.message, true);
    }
  }

  function bind() {
    document.getElementById('checkerAdd').onclick = openAdd;
    document.getElementById('checkerRefresh').onclick = loadData;
    document.getElementById('checkerClose').onclick = function () {
      if (global.LithositeModalShowContract) global.LithositeModalShowContract.close('checkerModal');
      else modal.classList.remove('show');
    };
    document.getElementById('checkerCancel').onclick = function () {
      if (global.LithositeModalShowContract) global.LithositeModalShowContract.close('checkerModal');
      else modal.classList.remove('show');
    };
    document.getElementById('checkerSave').onclick = save;
    ['checkerEquipment','checkerActivity'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', refreshContext);
      document.getElementById(id).addEventListener('input', refreshContext);
    });
    ['checkerFilterDate','checkerFilterShift','checkerFilterEquipment','checkerFilterActivity'].forEach(function (id) {
      const el = document.getElementById(id);
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    document.getElementById('checkerClear').onclick = function () {
      ['checkerFilterDate','checkerFilterShift','checkerFilterEquipment','checkerFilterActivity']
        .forEach(function (id) { document.getElementById(id).value = ''; });
      render();
    };
    document.getElementById('checkerRows').addEventListener('click', function (event) {
      const edit = event.target.closest('.checker-edit');
      if (edit) return openEdit(edit.dataset.id);
      const del = event.target.closest('.checker-delete');
      if (del) remove(del.dataset.id);
    });
  }

  if (global.LithositeDataSync) global.LithositeDataSync.register('Checker', loadData);
  bind();
  loadData();
})(window);
