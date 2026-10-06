(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;
  let initialized = false;
  let restorePayload = null;
  let activeDataset = null;

  function ensureDom() {
    if (document.getElementById('stage15DataModal')) return;
    const modal = document.createElement('div');
    modal.id = 'stage15DataModal';
    modal.innerHTML =
      '<div class="dm-card">' +
        '<div class="dm-head"><div class="ptitle">Operational Data Management</div><button class="control" id="stage15DataClose">Close</button></div>' +
        '<div class="dm-body">' +
          '<div class="dm-tabs">' +
            '<button class="dm-tab active" data-pane="data">Data Files</button>' +
            '<button class="dm-tab" data-pane="backup">Backup / Restore</button>' +
            '<button class="dm-tab" data-pane="import" disabled aria-disabled="true" title="Import temporarily locked">Import Data</button>' +
          '</div>' +
          '<div class="dm-pane active" id="stage15PaneData">' +
            '<div class="dm-help">Save updates the active dataset file. Save As creates a new dataset and makes it the active working dataset. Load Data switches the runtime to a saved dataset.</div>' +
            '<div class="dm-actions dm-data-actions">' +
              '<button class="control primary" id="stage15SaveRun">Save</button>' +
              '<button class="control" id="stage15SaveAsRun">Save As</button>' +
            '</div>' +
            '<div class="dm-load">' +
              '<label for="stage15DatasetSelect">Load Data</label>' +
              '<div class="dm-actions">' +
                '<select id="stage15DatasetSelect"><option value="">No saved datasets</option></select>' +
                '<button class="control" id="stage15DatasetRefresh">Refresh</button>' +
                '<button class="control primary" id="stage15LoadRun">Load Data</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="dm-pane" id="stage15PaneImport">' +
            '<label for="stage15ImportPath">XLSX source path</label>' +
            '<input id="stage15ImportPath" type="text" placeholder="D:\\path\\source.xlsx">' +
            '<div class="dm-help">The desktop host imports from a local path visible to Python. Import is validated and committed atomically; rejected data does not partially persist.</div>' +
            '<button class="control primary" id="stage15ImportRun" disabled>Import XLSX</button>' +
          '</div>' +
          '<div class="dm-pane" id="stage15PaneBackup">' +
            '<div class="dm-help">Backup creates a sealed SHA-256 snapshot of the current runtime. Restore accepts that snapshot JSON and uses transactional validation before commit.</div>' +
            '<div class="dm-actions">' +
              '<button class="control primary" id="stage15BackupRun">Create Backup</button>' +
              '<input id="stage15RestoreFile" type="file" accept=".json,application/json">' +
              '<button class="control" id="stage15RestoreRun">Restore Selected</button>' +
            '</div>' +
          '</div>' +
          '<div class="dm-msg" id="stage15DataMsg">RuntimeAdapter ready.</div>' +
        '</div>' +
        '<div class="dm-foot"><button class="control" id="stage15DataClose2">Done</button></div>' +
      '</div>' +
      '<div class="dm-native-dialog" id="stage15DatasetDialog" hidden aria-hidden="true">' +
        '<div class="dm-dialog-card" role="dialog" aria-modal="true" aria-labelledby="stage15DatasetDialogTitle">' +
          '<div class="dm-dialog-title" id="stage15DatasetDialogTitle">Save Dataset As</div>' +
          '<div class="dm-dialog-body">' +
            '<label for="stage15DatasetNameInput">Dataset name</label>' +
            '<input id="stage15DatasetNameInput" type="text" autocomplete="off" spellcheck="false">' +
            '<div class="dm-dialog-help">Create a new working dataset from the current runtime.</div>' +
          '</div>' +
          '<div class="dm-dialog-foot">' +
            '<button class="control" id="stage15DatasetDialogCancel">Cancel</button>' +
            '<button class="control primary" id="stage15DatasetDialogConfirm">Save As</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="dm-native-dialog" id="stage15ConfirmDialog" hidden aria-hidden="true">' +
        '<div class="dm-dialog-card" role="dialog" aria-modal="true" aria-labelledby="stage15ConfirmDialogTitle">' +
          '<div class="dm-dialog-title" id="stage15ConfirmDialogTitle">Load Dataset</div>' +
          '<div class="dm-dialog-body"><div class="dm-dialog-help" id="stage15ConfirmDialogText"></div></div>' +
          '<div class="dm-dialog-foot">' +
            '<button class="control" id="stage15ConfirmDialogCancel">Cancel</button>' +
            '<button class="control primary" id="stage15ConfirmDialogConfirm">Load Data</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function showDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    dialog.hidden = false;
    dialog.setAttribute('aria-hidden', 'false');
    window.setTimeout(function () {
      const input = dialog.querySelector('input');
      if (input) { input.focus(); input.select(); }
    }, 0);
  }

  function hideDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    dialog.hidden = true;
    dialog.setAttribute('aria-hidden', 'true');
  }

  function askSaveAsName(current) {
    return new Promise(function (resolve) {
      const dialog = document.getElementById('stage15DatasetDialog');
      const input = document.getElementById('stage15DatasetNameInput');
      const confirm = document.getElementById('stage15DatasetDialogConfirm');
      const cancel = document.getElementById('stage15DatasetDialogCancel');
      if (!dialog || !input || !confirm || !cancel) return resolve(null);

      input.value = current;
      const finish = function (value) {
        confirm.removeEventListener('click', onConfirm);
        cancel.removeEventListener('click', onCancel);
        input.removeEventListener('keydown', onKeydown);
        hideDialog('stage15DatasetDialog');
        resolve(value);
      };
      const onConfirm = function () {
        const value = input.value.trim();
        if (!value) {
          input.focus();
          return;
        }
        finish(value);
      };
      const onCancel = function () { finish(null); };
      const onKeydown = function (event) {
        if (event.key === 'Enter') { event.preventDefault(); onConfirm(); }
        if (event.key === 'Escape') { event.preventDefault(); onCancel(); }
      };

      confirm.addEventListener('click', onConfirm);
      cancel.addEventListener('click', onCancel);
      input.addEventListener('keydown', onKeydown);
      showDialog('stage15DatasetDialog');
    });
  }

  function askLoadConfirmation(name) {
    return new Promise(function (resolve) {
      const dialog = document.getElementById('stage15ConfirmDialog');
      const text = document.getElementById('stage15ConfirmDialogText');
      const confirm = document.getElementById('stage15ConfirmDialogConfirm');
      const cancel = document.getElementById('stage15ConfirmDialogCancel');
      if (!dialog || !text || !confirm || !cancel) return resolve(false);

      text.textContent = 'Load dataset "' + name + '" and replace the current runtime data?';
      const finish = function (value) {
        confirm.removeEventListener('click', onConfirm);
        cancel.removeEventListener('click', onCancel);
        hideDialog('stage15ConfirmDialog');
        resolve(value);
      };
      const onConfirm = function () { finish(true); };
      const onCancel = function () { finish(false); };
      const onKeydown = function (event) {
        if (event.key === 'Enter') { event.preventDefault(); onConfirm(); }
        if (event.key === 'Escape') { event.preventDefault(); onCancel(); }
      };
      dialog.addEventListener('keydown', onKeydown);
      confirm.addEventListener('click', onConfirm);
      cancel.addEventListener('click', onCancel);
      showDialog('stage15ConfirmDialog');
      confirm.focus();
    });
  }

  function msg(text, error) {
    const el = document.getElementById('stage15DataMsg');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('error', !!error);
  }

  async function refreshDatasets(selectName) {
    try {
      const result = await runtimeClient.request({ operation: 'LIST_DATASETS' });
      if (result.status !== 'READY') throw new Error('Dataset list unavailable');
      activeDataset = result.active || activeDataset;
      const select = document.getElementById('stage15DatasetSelect');
      const datasets = Array.isArray(result.datasets) ? result.datasets : [];
      select.innerHTML = datasets.length
        ? datasets.map(function (item) {
            return '<option value="' + String(item.dataset_name || '').replace(/"/g, '&quot;') + '">' +
              String(item.dataset_name || item.filename || '') +
              '</option>';
          }).join('')
        : '<option value="">No saved datasets</option>';
      const target = selectName || (activeDataset && activeDataset.dataset_name);
      if (target && datasets.some(function (item) { return item.dataset_name === target; })) {
        select.value = target;
      }
    } catch (error) {
      msg('Dataset list failed: ' + error.message, true);
    }
  }

  function openPane(name) {
    document.querySelectorAll('#stage15DataModal .dm-tab').forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.pane === name);
    });
    document.getElementById('stage15PaneImport').classList.toggle('active', name === 'import');
    document.getElementById('stage15PaneBackup').classList.toggle('active', name === 'backup');
    document.getElementById('stage15PaneData').classList.toggle('active', name === 'data');
    if (name === 'data') refreshDatasets();
    msg(
      name === 'import'
        ? 'Import XLSX through RuntimeAdapter.'
        : name === 'backup'
          ? 'Create or restore an audited snapshot.'
          : 'Manage the active operational dataset.'
    );
  }

  function open() {
    ensureDom();
    if (!initialized) {
      bind();
      initialized = true;
    }
    openPane('data');
    document.getElementById('stage15DataModal').classList.add('show');
  }

  function close() {
    const modal = document.getElementById('stage15DataModal');
    if (modal) modal.classList.remove('show');
  }

  async function runSave() {
    try {
      msg('Saving active dataset…');
      const result = await runtimeClient.request({
        operation: 'SAVE_DATASET',
        name: activeDataset && activeDataset.dataset_name ? activeDataset.dataset_name : null
      });
      if (result.status !== 'SAVED') throw new Error('Save rejected');
      activeDataset = result;
      await refreshDatasets(result.dataset_name);
      msg('Saved: ' + result.filename);
    } catch (error) {
      msg('Save failed: ' + error.message, true);
    }
  }

  async function runSaveAs() {
    const current = activeDataset && activeDataset.dataset_name
      ? activeDataset.dataset_name
      : 'Mine-Services-Working';
    const name = await askSaveAsName(current);
    if (name === null) return;

    try {
      msg('Creating new dataset…');
      const result = await runtimeClient.request({
        operation: 'SAVE_AS_DATASET',
        name: name.trim()
      });
      if (result.status !== 'SAVED_AS') throw new Error('Save As rejected');
      activeDataset = result;
      await refreshDatasets(result.dataset_name);
      msg('Saved As: ' + result.filename + ' · now active.');
    } catch (error) {
      msg('Save As failed: ' + error.message, true);
    }
  }

  async function runLoad() {
    const select = document.getElementById('stage15DatasetSelect');
    const name = select && select.value;
    if (!name) return msg('Select a saved dataset first.', true);
    if (!(await askLoadConfirmation(name))) return;

    try {
      msg('Loading and validating dataset…');
      const result = await runtimeClient.request({
        operation: 'LOAD_DATASET',
        name: name
      });
      if (result.status !== 'LOADED') throw new Error('Load rejected');
      activeDataset = result;
      renderActiveDataset();
      if (global.LithositeDataSync) await global.LithositeDataSync.refreshAll();
      msg('Loaded: ' + result.filename + ' · runtime refreshed.');
    } catch (error) {
      msg('Load failed: ' + error.message, true);
    }
  }

  async function runImport() {
    const path = document.getElementById('stage15ImportPath').value.trim();
    if (!path) return msg('XLSX source path is required.', true);
    try {
      msg('Importing and validating XLSX…');
      const result = await runtimeClient.request({ operation: 'IMPORT_XLSX', path: path });
      if (result.status !== 'COMMITTED') {
        throw new Error(result.errors && result.errors.length ? result.errors.map(function (e) { return e.message; }).join('; ') : 'Import rejected');
      }
      msg('Import committed and audited successfully.');
    } catch (error) {
      msg('Import failed: ' + error.message, true);
    }
  }

  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  async function runBackup() {
    try {
      msg('Creating sealed runtime snapshot…');
      const result = await runtimeClient.request({ operation: 'BACKUP', source: 'Stage15-UI' });
      if (result.status !== 'SEALED') {
        throw new Error(result.errors && result.errors.length ? result.errors.map(function (e) { return e.message; }).join('; ') : 'Backup failed');
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadJson('Mine-Services-Backup-' + stamp + '.json', result);
      msg('Backup created, checksum sealed, and downloaded.');
    } catch (error) {
      msg('Backup failed: ' + error.message, true);
    }
  }

  async function runRestore() {
    const input = document.getElementById('stage15RestoreFile');
    const file = input && input.files && input.files[0];
    if (!file) return msg('Select a backup JSON file first.', true);
    try {
      msg('Reading and validating snapshot…');
      restorePayload = JSON.parse(await file.text());
      const snapshot = restorePayload.payload && restorePayload.checksum ? restorePayload : (restorePayload.snapshot || restorePayload);
      const result = await runtimeClient.request({
        operation: 'RESTORE',
        snapshot: snapshot,
        mode: 'REPLACE_RUNTIME'
      });
      if (result.status !== 'COMMITTED') {
        throw new Error(result.errors && result.errors.length ? result.errors.map(function (e) { return e.message; }).join('; ') : 'Restore rejected');
      }
      if (global.LithositeDataSync) await global.LithositeDataSync.refreshAll();
      msg('Restore committed and audited successfully.');
    } catch (error) {
      restorePayload = null;
      msg('Restore failed: ' + error.message, true);
    }
  }

  function bind() {
    ensureDom();
    document.getElementById('stage15DataClose').addEventListener('click', close);
    document.getElementById('stage15DataClose2').addEventListener('click', close);
    document.querySelectorAll('#stage15DataModal .dm-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { openPane(tab.dataset.pane); });
    });
    document.getElementById('stage15ImportRun').addEventListener('click', runImport);
    document.getElementById('stage15BackupRun').addEventListener('click', runBackup);
    document.getElementById('stage15RestoreRun').addEventListener('click', runRestore);
    document.getElementById('stage15SaveRun').addEventListener('click', runSave);
    document.getElementById('stage15SaveAsRun').addEventListener('click', runSaveAs);
    document.getElementById('stage15DatasetRefresh').addEventListener('click', function () { refreshDatasets(); });
    document.getElementById('stage15LoadRun').addEventListener('click', runLoad);
    document.getElementById('stage15DataModal').addEventListener('click', function (event) {
      if (event.target.id === 'stage15DataModal') close();
    });
  }

  function init() {
    if (initialized) return;
    initialized = true;
    bind();
  }

  global.LithositeDataManagement = Object.freeze({
    init,
    open,
    close
  });
})(window);
