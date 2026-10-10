(function (global) {
  'use strict';

  const runtime = global.LithositeRuntimeClient;
  if (!runtime) throw new Error('LithositeRuntimeClient is required before LithositeEvidence');

  const ALLOWED_MODULES = new Set(['TargetPlan', 'HSE', 'Maintenance']);
  const MODULE_ICON_HREFS = Object.freeze({ TargetPlan: '#plans', HSE: '#hse', Maintenance: '#maintenance' });
  const UPLOAD_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']);
  const MAX_FILE_BYTES = 100000000;
  const ELEMENT_IDS = Object.freeze({
    modal: 'evidenceModal',
    title: 'evidenceTitle',
    moduleLabel: 'evidenceModuleLabel',
    iconUse: 'evidenceIconUse',
    close: 'evidenceClose',
    refresh: 'evidenceRefresh',
    record: 'evidenceRecord',
    status: 'evidenceStatus',
    list: 'evidenceList',
    uploadButton: 'evidenceUploadButton',
    uploadInput: 'evidenceUploadInput',
    uploadStatus: 'evidenceUploadStatus',
    previewLabel: 'evidencePreviewLabel',
    preview: 'evidencePreview',
    meta: 'evidenceMeta'
  });

  let current = null;
  let files = [];
  let objectUrl = '';
  let previewRequest = 0;
  let uploadBusy = false;
  let initialized = false;

  function element(key) {
    return document.getElementById(ELEMENT_IDS[key] || key);
  }

  function isModalVisible() {
    const modal = element('modal');
    return !!modal && !modal.hidden && (
      modal.classList.contains('show') || modal.classList.contains('open')
    );
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[character];
    });
  }

  function sizeLabel(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
    return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  function dateLabel(timestamp) {
    const date = new Date((Number(timestamp) || 0) * 1000);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : '';
  }

  function makeFileUrl(filename) {
    if (!current) return '';
    return runtime.HOST + '/evidence/file?module=' +
      encodeURIComponent(current.module) +
      '&record_id=' + encodeURIComponent(current.recordId) +
      '&filename=' + encodeURIComponent(filename);
  }

  function setStatus(message, isError) {
    const status = element('status');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', !!isError);
  }

  function setUploadStatus(message, isError) {
    const status = element('uploadStatus');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', !!isError);
  }

  function setPreviewLabel(label, filename) {
    const labelElement = element('previewLabel');
    if (!labelElement) return;
    labelElement.textContent = label && filename ? label + ': ' + filename : (label || '');
    labelElement.title = labelElement.textContent;
  }

  function releaseObjectUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = '';
    }
  }

  function invalidatePreview() {
    previewRequest += 1;
    releaseObjectUrl();
  }

  function resetPreview() {
    const preview = element('preview');
    if (preview) preview.innerHTML = '<div class="evidence-empty">Select a PDF or image from the list.</div>';
    setPreviewLabel('', '');
  }

  function renderFiles(items) {
    const list = element('list');
    if (!list) return;

    if (!items.length) {
      list.innerHTML = '<div class="evidence-empty">No evidence files are linked to this record yet.</div>';
      return;
    }

    list.innerHTML = items.map(function (file) {
      const name = String(file.name || '');
      const extension = name.split('.').pop().toUpperCase();
      const available = file.available !== false;
      return '<button type="button" class="evidence-file-button" data-evidence-name="' + escapeHtml(name) + '" ' +
        (available ? '' : 'disabled title="File exceeds the 100 MB preview limit"') + '>' +
        '<span class="evidence-file-icon">' + escapeHtml(extension.slice(0, 5)) + '</span>' +
        '<span class="evidence-file-description"><span class="evidence-file-name">' + escapeHtml(name) +
        '</span><span class="evidence-file-meta">' + escapeHtml(sizeLabel(file.size)) + ' · ' +
        escapeHtml(dateLabel(file.modified_at)) + (available ? '' : ' · Too large to open') +
        '</span></span></button>';
    }).join('');
  }

  async function previewFile(filename) {
    if (!current) return;
    const preview = element('preview');
    const file = files.find(function (item) { return String(item.name) === String(filename); });
    if (!preview || !file) return;

    const context = current;
    invalidatePreview();
    const requestId = ++previewRequest;
    const safeName = escapeHtml(file.name);

    if (file.available === false) {
      setPreviewLabel('Preview unavailable', file.name);
      preview.innerHTML = '<div class="evidence-empty">This file exceeds the 100 MB preview limit.</div>';
      setStatus('This file exceeds the 100 MB preview limit.', true);
      return;
    }

    const fileUrl = makeFileUrl(file.name);
    const mime = String(file.mime_type || '').toLowerCase();
    const isPdf = file.previewable && mime === 'application/pdf';
    const isImage = file.previewable && mime.indexOf('image/') === 0;

    if (!isPdf && !isImage) {
      setPreviewLabel('Document selected', file.name);
      preview.innerHTML = '<div class="evidence-download-panel"><p><b>' + safeName +
        '</b><br>Word documents cannot be previewed natively in this window. Use the button to download the original file.</p>' +
        '<a class="control primary" href="' + escapeHtml(fileUrl) + '" download="' + safeName + '">Download document</a></div>';
      setStatus('', false);
      return;
    }

    setPreviewLabel(isPdf ? 'Loading PDF preview' : 'Loading image preview', file.name);
    preview.innerHTML = '<div class="evidence-preview-content"><div class="evidence-empty">Loading file preview…</div></div>';
    setStatus('', false);

    try {
      const response = await fetch(runtime.HOST + '/evidence/preview', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: context.module,
          record_id: context.recordId,
          filename: file.name
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.status !== 'READY' || typeof payload.data !== 'string') {
        const detail = payload.errors && payload.errors[0] && payload.errors[0].message;
        throw new Error(detail || 'Evidence preview request failed (HTTP ' + response.status + ')');
      }
      if (current !== context || requestId !== previewRequest) return;

      const binary = atob(payload.data);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      const blob = new Blob([bytes], {
        type: String(payload.mime_type || file.mime_type || 'application/octet-stream')
      });
      objectUrl = URL.createObjectURL(blob);

      if (isPdf) {
        preview.innerHTML = '<div class="evidence-preview-content"><iframe class="evidence-pdf" src="' +
          escapeHtml(objectUrl) + '" title="' + safeName + '"></iframe></div>';
        setPreviewLabel('PDF preview', file.name);
      } else {
        preview.innerHTML = '<div class="evidence-preview-content"><img class="evidence-image" src="' +
          escapeHtml(objectUrl) + '" alt="' + safeName + '"></div>';
        setPreviewLabel('Image preview', file.name);
      }
      setStatus('', false);
    } catch (error) {
      if (current !== context || requestId !== previewRequest) return;
      preview.innerHTML = '<div class="evidence-empty">Preview unavailable. ' +
        escapeHtml(error && error.message ? error.message : String(error)) + '</div>';
      setPreviewLabel('', '');
      setStatus('Could not preview ' + file.name, true);
    }
  }

  async function uploadFiles(fileList) {
    const selected = Array.from(fileList || []);
    if (!selected.length || !current || !current.allowUpload || uploadBusy) return;
    const context = current;
    uploadBusy = true;
    const button = element('uploadButton');
    if (button) button.disabled = true;
    let uploaded = 0;
    const failures = [];

    try {
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        const extension = (String(file.name).match(/\.[^.]+$/) || [''])[0].toLowerCase();
        if (!UPLOAD_EXTENSIONS.has(extension)) {
          failures.push(file.name + ': unsupported file type');
          continue;
        }
        if (!file.size) {
          failures.push(file.name + ': empty files are not accepted');
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          failures.push(file.name + ': exceeds the 100 MB per-file limit');
          continue;
        }

        setUploadStatus('Uploading ' + (index + 1) + ' of ' + selected.length + ': ' + file.name, false);
        try {
          const query = 'module=' + encodeURIComponent(context.module) +
            '&record_id=' + encodeURIComponent(context.recordId) +
            '&filename=' + encodeURIComponent(file.name);
          const response = await fetch(runtime.HOST + '/evidence/upload?' + query, {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: file,
            cache: 'no-store'
          });
          const payload = await response.json();
          if (!response.ok || payload.status !== 'READY') {
            const detail = payload.errors && payload.errors[0] && payload.errors[0].message;
            throw new Error(detail || 'Upload failed (HTTP ' + response.status + ')');
          }
          uploaded += 1;
        } catch (error) {
          failures.push(file.name + ': ' + (error && error.message ? error.message : String(error)));
        }
      }
    } finally {
      uploadBusy = false;
      if (button) button.disabled = false;
      const input = element('uploadInput');
      if (input) input.value = '';
    }

    if (current === context && !isModalVisible()) {
      clearSessionAfterExternalClose();
      return;
    }
    if (current === context) {
      try {
        await refresh();
      } catch (error) {
        failures.push('Could not refresh the Evidence list: ' +
          (error && error.message ? error.message : String(error)));
      }
    }
    if (current !== context) return;
    if (failures.length) {
      const details = failures.slice(0, 4).join(' · ') +
        (failures.length > 4 ? ' · +' + (failures.length - 4) + ' more' : '');
      setUploadStatus('Uploaded ' + uploaded + ' of ' + selected.length + ' file(s). ' + details, true);
    } else {
      setUploadStatus('Upload complete: ' + uploaded + ' file(s) saved to this record.', false);
    }
  }

  async function refresh() {
    if (!current) return;
    const context = current;
    invalidatePreview();
    setPreviewLabel('', '');
    const list = element('list');
    const preview = element('preview');
    const meta = element('meta');
    if (list) list.innerHTML = '<div class="evidence-empty">Loading evidence files…</div>';
    if (preview) preview.innerHTML = '<div class="evidence-empty">Select a PDF or image from the list.</div>';
    setStatus('Reading the central Evidence folder…', false);
    if (meta) {
      meta.textContent = 'Database/Evidence/' + context.module + '/' + context.recordId +
        ' · Evidence viewer' + (context.allowUpload ? ' · Upload destination managed by Desktop Host' : '');
    }

    const url = runtime.HOST + '/evidence/list?module=' + encodeURIComponent(context.module) +
      '&record_id=' + encodeURIComponent(context.recordId);
    const response = await fetch(url, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || payload.status !== 'READY') {
      const detail = payload.errors && payload.errors[0] && payload.errors[0].message;
      throw new Error(detail || 'Evidence list could not be loaded');
    }
    if (current !== context) return;

    files = Array.isArray(payload.files) ? payload.files : [];
    renderFiles(files);
    setStatus(files.length
      ? files.length + ' evidence file(s) found. Select a file to preview it.'
      : 'No evidence files found for this record.', false);
    if (meta) {
      meta.textContent = payload.folder + ' · Evidence viewer' +
        (context.allowUpload ? ' · Upload destination managed by Desktop Host' : '');
    }
  }

  function clearSessionAfterExternalClose() {
    if (!current || isModalVisible() || uploadBusy) return;
    invalidatePreview();
    resetPreview();
    setUploadStatus('', false);
    files = [];
    current = null;
  }

  function close() {
    if (!current) return false;
    if (uploadBusy) {
      setUploadStatus('Please wait for the current upload to finish before closing this viewer.', true);
      return false;
    }
    invalidatePreview();
    setPreviewLabel('', '');
    setUploadStatus('', false);
    if (global.LithositeModalShowContract) {
      global.LithositeModalShowContract.close('evidenceModal');
    } else {
      const modal = element('modal');
      if (modal) {
        modal.classList.remove('show', 'open');
        modal.setAttribute('aria-hidden', 'true');
      }
    }
    resetPreview();
    current = null;
    files = [];
    return true;
  }

  function open(options) {
    const input = options && typeof options === 'object' ? options : {};
    const moduleName = String(input.module || '');
    const recordId = String(input.recordId || '');
    if (!ALLOWED_MODULES.has(moduleName) || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(recordId)) return false;
    if (uploadBusy) {
      setUploadStatus('Please wait for the current upload to finish before switching records.', true);
      return false;
    }

    invalidatePreview();
    current = {
      module: moduleName,
      recordId: recordId,
      title: String(input.title || (moduleName + ' Evidence')),
      recordLabel: String(input.recordLabel || recordId),
      allowUpload: input.allowUpload === true && moduleName === 'TargetPlan'
    };
    files = [];

    const title = element('title');
    const record = element('record');
    const moduleLabel = element('moduleLabel');
    const iconUse = element('iconUse');
    const button = element('uploadButton');
    const fileInput = element('uploadInput');
    const list = element('list');
    if (title) title.textContent = current.title;
    if (moduleLabel) moduleLabel.textContent = moduleName === 'TargetPlan' ? 'TARGET PLAN' : moduleName.toUpperCase();
    if (iconUse) iconUse.setAttribute('href', '../../assets/lithosite-icons.svg' + (MODULE_ICON_HREFS[moduleName] || '#reports'));
    if (record) record.textContent = current.recordLabel;
    if (button) {
      button.hidden = !current.allowUpload;
      button.disabled = uploadBusy;
    }
    if (fileInput) {
      fileInput.hidden = !current.allowUpload;
      fileInput.value = '';
    }
    if (list) list.innerHTML = '<div class="evidence-empty">Loading evidence files…</div>';
    resetPreview();
    setStatus('Reading the central Evidence folder…', false);
    setUploadStatus('', false);

    const modal = element('modal');
    let opened = false;
    if (global.LithositeModalShowContract) {
      opened = global.LithositeModalShowContract.show('evidenceModal');
    } else if (modal) {
      modal.hidden = false;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      opened = true;
    }
    if (!opened) {
      current = null;
      return false;
    }
    refresh().catch(function (error) {
      if (!current || current.module !== moduleName || current.recordId !== recordId) return;
      files = [];
      if (element('list')) {
        element('list').innerHTML = '<div class="evidence-empty">Evidence folder could not be read. Confirm the Desktop Host has been restarted after updating the project.</div>';
      }
      setStatus('Evidence unavailable: ' + (error && error.message ? error.message : String(error)), true);
      if (element('meta')) element('meta').textContent = 'Local Evidence service unavailable';
    });
    return true;
  }

  function init() {
    if (initialized || !element('modal')) return;
    initialized = true;
    const closeButton = element('close');
    const refreshButton = element('refresh');
    const uploadButton = element('uploadButton');
    const uploadInput = element('uploadInput');
    const modal = element('modal');
    const list = element('list');

    if (modal && typeof MutationObserver === 'function') {
      const visibilityObserver = new MutationObserver(clearSessionAfterExternalClose);
      visibilityObserver.observe(modal, { attributes: true, attributeFilter: ['class', 'hidden'] });
    }
    if (closeButton) closeButton.addEventListener('click', close);
    if (refreshButton) refreshButton.addEventListener('click', function () {
      refresh().catch(function (error) {
        setStatus('Evidence unavailable: ' + (error && error.message ? error.message : String(error)), true);
      });
    });
    if (uploadButton && uploadInput) uploadButton.addEventListener('click', function () { uploadInput.click(); });
    if (uploadInput) uploadInput.addEventListener('change', function (event) { uploadFiles(event.target.files); });
    if (modal) modal.addEventListener('click', function (event) {
      if (event.target === modal) close();
    });
    if (list) list.addEventListener('click', function (event) {
      const button = event.target.closest('.evidence-file-button');
      if (button && !button.disabled) previewFile(button.dataset.evidenceName || '');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && current && isModalVisible()) {
        event.preventDefault();
        close();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  global.LithositeEvidence = Object.freeze({
    open: open,
    close: close,
    refresh: refresh,
    isOpen: function () { return !!current && isModalVisible(); }
  });
})(window);
