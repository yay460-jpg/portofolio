(function (global) {
  'use strict';

  const runtimeClient = global.LithositeRuntimeClient;
  let initialized = false;
  let restorePayload = null;

  const STYLE = [
    '#stage15DataModal{position:fixed;inset:0;z-index:100;background:#020812aa;display:none;align-items:center;justify-content:center}',
    '#stage15DataModal.show{display:flex}',
    '#stage15DataModal .dm-card{width:min(720px,calc(100vw - 80px));background:#0e1d2e;border:1px solid #35506b;border-radius:12px;box-shadow:0 18px 60px #0009}',
    '#stage15DataModal .dm-head,#stage15DataModal .dm-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #263e57}',
    '#stage15DataModal .dm-foot{border-bottom:0;border-top:1px solid #263e57;justify-content:flex-end;gap:8px}',
    '#stage15DataModal .dm-body{padding:16px;display:grid;gap:12px}',
    '#stage15DataModal .dm-tabs{display:flex;gap:6px}',
    '#stage15DataModal .dm-tab{height:32px;padding:6px 10px;border:1px solid #29435d;border-radius:7px;background:#12243a;color:#dbe8f5;cursor:pointer;font-size:10px}',
    '#stage15DataModal .dm-tab.active{background:#2563eb;border-color:#3b82f6;color:#fff;font-weight:700}',
    '#stage15DataModal .dm-pane{display:none;gap:10px}',
    '#stage15DataModal .dm-pane.active{display:grid}',
    '#stage15DataModal label{font-size:8.5px;color:#8fa5bb;text-transform:uppercase;font-weight:600;letter-spacing:.4px}',
    '#stage15DataModal input[type=text],#stage15DataModal input[type=file]{width:100%;height:34px;border:1px solid #29435d;border-radius:7px;background:#0c1b2c;color:#dce8f5;padding:7px 9px;font-size:10px}',
    '#stage15DataModal .dm-msg{padding:9px;border:1px solid #29435d;border-radius:7px;background:#10243a;color:#8ea3ba;font-size:9.5px}',
    '#stage15DataModal .dm-msg.error{border-color:#71343d;color:#ff9aa4;background:#28171c}',
    '#stage15DataModal .dm-help{color:#8ea3ba;font-size:9px;line-height:1.45}'
  ].join('');
  
  function ensureDom() {
    if (document.getElementById('stage15DataModal')) return;
    const style = document.createElement('style');
    style.id = 'stage15DataStyle';
    style.textContent = STYLE;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'stage15DataModal';
    modal.innerHTML =
      '<div class="dm-card">' +
        '<div class="dm-head"><div class="ptitle">Operational Data Management</div><button class="control" id="stage15DataClose">Close</button></div>' +
        '<div class="dm-body">' +
          '<div class="dm-tabs">' +
            '<button class="dm-tab active" data-pane="import">Import Data</button>' +
            '<button class="dm-tab" data-pane="backup">Backup / Restore</button>' +
          '</div>' +
          '<div class="dm-pane active" id="stage15PaneImport">' +
            '<label for="stage15ImportPath">XLSX source path</label>' +
            '<input id="stage15ImportPath" type="text" placeholder="D:\\path\\source.xlsx">' +
            '<div class="dm-help">The desktop host imports from a local path visible to Python. Import is validated and committed atomically; rejected data does not partially persist.</div>' +
            '<button class="control primary" id="stage15ImportRun">Import XLSX</button>' +
          '</div>' +
          '<div class="dm-pane" id="stage15PaneBackup">' +
            '<div class="dm-help">Backup creates a sealed SHA-256 snapshot of the current runtime. Restore accepts that snapshot JSON and uses transactional validation before commit.</div>' +
            '<div style="display:flex;gap:8px">' +
              '<button class="control primary" id="stage15BackupRun">Create Backup</button>' +
              '<input id="stage15RestoreFile" type="file" accept=".json,application/json">' +
              '<button class="control" id="stage15RestoreRun">Restore Selected</button>' +
            '</div>' +
          '</div>' +
          '<div class="dm-msg" id="stage15DataMsg">RuntimeAdapter ready.</div>' +
        '</div>' +
        '<div class="dm-foot"><button class="control" id="stage15DataClose2">Done</button></div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function msg(text, error) {
    const el = document.getElementById('stage15DataMsg');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('error', !!error);
  }

  function openPane(name) {
    document.querySelectorAll('#stage15DataModal .dm-tab').forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.pane === name);
    });
    document.getElementById('stage15PaneImport').classList.toggle('active', name === 'import');
    document.getElementById('stage15PaneBackup').classList.toggle('active', name === 'backup');
    msg(name === 'import' ? 'Import XLSX through RuntimeAdapter.' : 'Create or restore an audited snapshot.');
  }

  function open() {
    ensureDom();
    if (!initialized) {
      bind();
      initialized = true;
    }
    document.getElementById('stage15DataModal').classList.add('show');
  }

  function close() {
    const modal = document.getElementById('stage15DataModal');
    if (modal) modal.classList.remove('show');
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
      if (result.status !== 'READY') {
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
      const text = await file.text();
      restorePayload = JSON.parse(text);
      const snapshot = restorePayload.payload && restorePayload.checksum ? restorePayload : (restorePayload.snapshot || restorePayload);
      const result = await runtimeClient.request({
        operation: 'RESTORE',
        snapshot: snapshot,
        mode: 'REPLACE_RUNTIME'
      });
      if (result.status !== 'COMMITTED') {
        throw new Error(result.errors && result.errors.length ? result.errors.map(function (e) { return e.message; }).join('; ') : 'Restore rejected');
      }
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
