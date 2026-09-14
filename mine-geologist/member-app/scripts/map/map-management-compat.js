/* ===== V19 NEW MODAL UX INTEGRATED ===== */
/* V19 NEW MODAL UX - NO FLICKER NO GLITCH
 * Modal import GeoPDF isolasi total dari render() global.
 * - Hidup di document.body, di luar #app
 * - Tidak pernah manggil render() selama proses baca + pyramid
 * - Progress update via direct DOM, bukan via global state + render()
 * - Pas Simpan: capture overlay peta lama, tutup modal, 1x render() final + fade
 * Cara pakai: load file ini SETELAH peta.js, lalu panggil window.MG1NewMapModal.open()
 * Tombol "Tambah Peta Baru" yang lama otomatis di-override ke modal baru.
 */

(function(){
  console.log('[V19 NEW MODAL] Loading isolated no-flicker modal');

  // State isolated - tidak pakai mapUploadFormState global
  const state = {
    open: false,
    file: null,
    fileName: '',
    name: '',
    fileDataUrl: '',
    geoReference: null,
    tilePyramid: null,
    cornerTL: null,
    cornerBR: null,
    busy: false,
    processing: false,
    statusMsg: '',
    statusOk: true,
    progress: 0
  };

  let els = {};
  let progressRaf = null;
  let lastProgress = -1;

  // V24.5 Lithosite toast — replaces native alert() for Map Package feedback.
  let toastTimer = null;
  function showLithositeToast_(message, type='success') {
    let toast = document.getElementById('mg1-lithosite-toast');
    if(!toast) {
      toast = document.createElement('div');
      toast.id = 'mg1-lithosite-toast';
      toast.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:28px', 'transform:translate(-50%,14px)',
        'z-index:2147483647', 'min-width:260px', 'max-width:min(88vw,420px)',
        'padding:12px 16px', 'border-radius:14px', 'border:1px solid rgba(255,255,255,.10)',
        'background:rgba(14,25,51,.96)', 'box-shadow:0 16px 44px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06)',
        'backdrop-filter:blur(16px)', '-webkit-backdrop-filter:blur(16px)',
        'display:flex', 'align-items:center', 'gap:10px', 'font-size:12px', 'font-weight:800',
        'letter-spacing:-.01em', 'color:#fff', 'opacity:0', 'pointer-events:none',
        'transition:opacity 180ms ease, transform 220ms cubic-bezier(.16,1,.3,1)'
      ].join(';');
      document.body.appendChild(toast);
    }
    const ok = type === 'success';
    const icon = ok ? '✓' : '⚠';
    toast.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:' +
      (ok ? 'rgba(52,211,153,.14)' : 'rgba(251,113,133,.14)') + ';color:' +
      (ok ? '#6ee7b7' : '#fb7185') + ';font-size:13px;flex:0 0 auto;">' + icon + '</span>' +
      '<span style="line-height:1.35;">' + String(message).replace(/[&<>]/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}) + '</span>';
    if(toastTimer) clearTimeout(toastTimer);
    requestAnimationFrame(function(){
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%,0)';
    });
    toastTimer = setTimeout(function(){
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%,14px)';
    }, 2600);
  }

  // Cross-IIFE bridge: the management action panel lives in a second IIFE.
  // Keep one canonical toast implementation instead of duplicating the UI helper.
  window.MG1LithositeToast = showLithositeToast_;

  function ensureDom() {
    if(document.getElementById('mg1-new-map-modal-root')) {
      els.root = document.getElementById('mg1-new-map-modal-root');
      els.backdrop = document.getElementById('mg1-new-modal-backdrop');
      els.panel = document.getElementById('mg1-new-modal-panel');
      els.nameInput = document.getElementById('mg1-new-modal-name');
      els.fileInput = document.getElementById('mg1-new-modal-file');
      els.restoreInput = document.getElementById('mg1-new-modal-restore-file');
      els.restoreBtn = document.getElementById('mg1-new-modal-restore');
      els.fileLabel = document.getElementById('mg1-new-modal-file-label');
      els.preview = document.getElementById('mg1-new-modal-preview');
      els.coords = document.getElementById('mg1-new-modal-coords');
      els.status = document.getElementById('mg1-new-modal-status');
      els.progressBar = document.getElementById('mg1-new-modal-progress');
      els.progressFill = document.getElementById('mg1-new-modal-progress-fill');
      els.saveBtn = document.getElementById('mg1-new-modal-save');
      return;
    }

    const root = document.createElement('div');
    root.id = 'mg1-new-map-modal-root';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:none;';
    root.innerHTML = `
      <div id="mg1-new-modal-backdrop" style="position:absolute;inset:0;background:rgba(3,8,20,0.78);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;transition:opacity 220ms ease;"></div>
      <div id="mg1-new-modal-panel" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-44%) scale(0.96);width:min(92vw,420px);max-height:86vh;overflow:auto;background:#0e1933;border:1px solid rgba(255,255,255,0.12);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08);opacity:0;transition:all 280ms cubic-bezier(0.16,1,0.3,1);">
        <div style="position:sticky;top:0;z-index:2;background:rgba(14,25,51,0.9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:18px 18px 12px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:14px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Tambah / Pulihkan Peta</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px;">Tambah file peta baru atau pulihkan backup .mg1map</div>
          </div>
          <button id="mg1-new-modal-close" style="width:32px;height:32px;border-radius:9999px;background:rgba(255,255,255,0.08);border:none;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.6);font-size:16px;">✕</button>
        </div>
        <div style="padding:16px 18px 18px;">
          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:10px;color:rgba(255,255,255,0.45);margin-bottom:6px;font-weight:600;letter-spacing:0.04em;">NAMA PETA</label>
            <input id="mg1-new-modal-name" placeholder="cth. Foto Udara Avenza Sep 2025" style="width:100%;background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:10px 12px;font-size:13px;color:#fff;outline:none;transition:border 0.2s;" />
          </div>
          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:10px;color:rgba(255,255,255,0.45);margin-bottom:6px;font-weight:600;">GAMBAR PETA (PNG,JPG,GeoTIFF,GeoPDF)</label>
            <input type="file" id="mg1-new-modal-file" accept=".png,.jpg,.jpeg,.tif,.tiff,.pdf" style="display:none;" />
            <button id="mg1-new-modal-pick" style="width:100%;background:rgba(37,99,235,0.12);border:1px dashed rgba(37,99,235,0.4);border-radius:12px;padding:12px;font-size:12px;font-weight:700;color:#60a5fa;">+ Pilih File Peta Baru</button>
            <div id="mg1-new-modal-file-label" style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.35);">Tidak ada file dipilih</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin:4px 0 12px;">
            <div style="height:1px;flex:1;background:rgba(255,255,255,.08);"></div>
            <span style="font-size:9px;color:rgba(255,255,255,.28);font-weight:700;">ATAU</span>
            <div style="height:1px;flex:1;background:rgba(255,255,255,.08);"></div>
          </div>
          <input type="file" id="mg1-new-modal-restore-file" accept=".mg1map,application/json" style="display:none;" />
          <button id="mg1-new-modal-restore" type="button" style="width:100%;background:rgba(16,185,129,.09);border:1px solid rgba(52,211,153,.22);border-radius:12px;padding:11px 12px;font-size:11px;font-weight:800;color:#6ee7b7;">↥ Import / Restore Backup Peta</button>
          <div style="margin:7px 2px 12px;font-size:9px;line-height:1.45;color:rgba(255,255,255,.28);">Gunakan file <b style="color:rgba(255,255,255,.42);">.mg1map</b> yang sebelumnya di-Backup / Export. Ini mengembalikan peta beserta data package-nya ke Library.</div>
          <div id="mg1-new-modal-preview" style="display:none;margin-bottom:12px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);background:#0b1329;"></div>
          <div id="mg1-new-modal-coords" style="display:none;margin-bottom:12px;background:rgba(255,255,255,0.04);border-radius:12px;padding:10px 12px;"></div>
          <div id="mg1-new-modal-progress" style="display:none;margin-bottom:12px;">
            <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:9999px;overflow:hidden;">
              <div id="mg1-new-modal-progress-fill" style="height:100%;width:0%;background:linear-gradient(90deg,#2563eb,#60a5fa);transition:width 0.2s ease;"></div>
            </div>
            <div id="mg1-new-modal-status" style="margin-top:8px;font-size:11px;font-weight:500;color:rgba(255,255,255,0.7);"></div>
          </div>
          <button id="mg1-new-modal-save" style="width:100%;background:linear-gradient(180deg,#2563eb,#1d4ed8);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:800;color:#fff;box-shadow:0 4px 16px rgba(37,99,235,0.4);transition:all 0.2s;opacity:0.5;pointer-events:none;">Simpan Peta Baru</button>
          <div style="margin-top:10px;text-align:center;font-size:9px;color:rgba(255,255,255,0.25);line-height:1.4;">Koordinat auto-detect dari GeoPDF/GeoTIFF. Cek ulang sebelum Simpan.<br/>Peta disimpan di HP (IndexedDB) - tidak perlu internet lagi.</div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    // cache els
    els.root = root;
    els.backdrop = document.getElementById('mg1-new-modal-backdrop');
    els.panel = document.getElementById('mg1-new-modal-panel');
    els.nameInput = document.getElementById('mg1-new-modal-name');
    els.fileInput = document.getElementById('mg1-new-modal-file');
    els.restoreInput = document.getElementById('mg1-new-modal-restore-file');
    els.restoreBtn = document.getElementById('mg1-new-modal-restore');
    els.fileLabel = document.getElementById('mg1-new-modal-file-label');
    els.preview = document.getElementById('mg1-new-modal-preview');
    els.coords = document.getElementById('mg1-new-modal-coords');
    els.status = document.getElementById('mg1-new-modal-status');
    els.progressBar = document.getElementById('mg1-new-modal-progress');
    els.progressFill = document.getElementById('mg1-new-modal-progress-fill');
    els.saveBtn = document.getElementById('mg1-new-modal-save');

    // events
    document.getElementById('mg1-new-modal-close').onclick = close;
    document.getElementById('mg1-new-modal-pick').onclick = () => els.fileInput.click();
    if(els.restoreBtn && els.restoreInput) {
      els.restoreBtn.onclick = () => els.restoreInput.click();
      els.restoreInput.onchange = onRestoreBackup;
    }
    els.backdrop.onclick = close;
    els.fileInput.onchange = onFileSelected;
    els.nameInput.oninput = (e) => { state.name = e.target.value; validate(); };
    els.saveBtn.onclick = onSave;
  }

  function open() {
    ensureDom();
    state.open = true;
    els.root.style.display = 'block';
    // animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        els.backdrop.style.opacity = '1';
        els.panel.style.opacity = '1';
        els.panel.style.transform = 'translate(-50%,-50%) scale(1)';
      });
    });
    // reset
    reset();
  }

  function close() {
    if(!state.open) return;
    els.backdrop.style.opacity = '0';
    els.panel.style.opacity = '0';
    els.panel.style.transform = 'translate(-50%,-44%) scale(0.96)';
    setTimeout(() => {
      els.root.style.display = 'none';
      state.open = false;
    }, 260);
  }

  function reset() {
    state.file = null;
    state.fileName = '';
    state.name = '';
    state.fileDataUrl = '';
    state.geoReference = null;
    state.tilePyramid = null;
    state.cornerTL = null;
    state.cornerBR = null;
    state.busy = false;
    state.processing = false;
    state.statusMsg = '';
    state.progress = 0;
    els.nameInput.value = '';
    els.fileInput.value = '';
    if(els.restoreInput) els.restoreInput.value = '';
    if(els.restoreBtn) { els.restoreBtn.disabled = false; els.restoreBtn.textContent = '↥ Import / Restore Backup Peta'; els.restoreBtn.style.opacity = '1'; }
    els.fileLabel.textContent = 'Tidak ada file dipilih';
    els.fileLabel.style.color = 'rgba(255,255,255,0.35)';
    els.preview.style.display = 'none';
    els.preview.innerHTML = '';
    els.coords.style.display = 'none';
    els.coords.innerHTML = '';
    els.progressBar.style.display = 'none';
    els.progressFill.style.width = '0%';
    els.status.textContent = '';
    els.saveBtn.style.opacity = '0.5';
    els.saveBtn.style.pointerEvents = 'none';
    els.saveBtn.textContent = 'Simpan Peta Baru';
  }

  function validate() {
    const ok = state.fileDataUrl && state.name.trim().length >= 2;
    els.saveBtn.style.opacity = ok ? '1' : '0.5';
    els.saveBtn.style.pointerEvents = ok ? 'auto' : 'none';
  }

  function setStatus(msg, ok=true, progress=null) {
    state.statusMsg = msg;
    state.statusOk = ok;
    if(els.status) {
      els.status.textContent = msg;
      els.status.style.color = ok ? 'rgba(255,255,255,0.7)' : '#fb7185';
    }
    if(progress !== null) {
      state.progress = progress;
      if(els.progressBar) els.progressBar.style.display = 'block';
      // batch via rAF
      if(progressRaf) cancelAnimationFrame(progressRaf);
      progressRaf = requestAnimationFrame(() => {
        if(els.progressFill) {
          els.progressFill.style.width = Math.max(0,Math.min(100,progress)) + '%';
        }
        lastProgress = progress;
      });
    }
  }

  async function onFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    state.file = file;
    state.fileName = file.name;
    els.fileLabel.textContent = file.name + ' (' + (file.size/1024/1024).toFixed(2) + ' MB)';
    els.fileLabel.style.color = '#fff';
    
    // auto fill name
    if(!state.name) {
      const base = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g,' ').slice(0,40);
      state.name = base;
      els.nameInput.value = base;
    }

    setStatus('Membaca file...', true, 0);
    els.progressBar.style.display = 'block';

    if(/\.pdf$/i.test(file.name)) {
      await handleGeoPdf(file);
    } else if(/\.(tif|tiff)$/i.test(file.name)) {
      await handleGeoTiff(file);
    } else {
      await handleImage(file);
    }
    validate();
  }

  async function onRestoreBackup(e) {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    if(!window.MG1MapPackageTransfer || typeof window.MG1MapPackageTransfer.importFile !== 'function') {
      setStatus('Modul Map Package belum siap. Coba lagi.', false);
      return;
    }
    if(els.restoreInput) els.restoreInput.value = '';
    if(els.restoreBtn) { els.restoreBtn.disabled = true; els.restoreBtn.textContent = 'Memvalidasi backup...'; els.restoreBtn.style.opacity = '.7'; }
    if(els.progressBar) els.progressBar.style.display = 'block';
    setStatus('Memvalidasi backup .mg1map...', true, 10);
    try {
      setStatus('Memeriksa ID peta di Library...', true, 42);
      const result = await window.MG1MapPackageTransfer.importFile(file, function(progress, message){
        setStatus(message || 'Memulihkan backup...', true, progress);
      });
      console.log('[V24.5] Map Backup restore PASS', result);
      setStatus('Memulihkan backup...', true, 100);
      close();
      setTimeout(() => {
        try { if(typeof openManageModal === 'function') openManageModal(); } catch(_){}
        showLithositeToast_('Peta berhasil dikembalikan', 'success');
      }, 300);
    } catch(e) {
      if(e && e.code === 'ID_COLLISION') {
        console.log('[V24.5] Map Backup restore REJECTED', {reason:e.code, ids:Array.isArray(e.ids)?e.ids:[], committedCount:Number(e.committedCount)||0});
        setStatus('Ditolak — ID peta sudah ada di Library.', false, 100);
        showLithositeToast_('Ditolak — ID peta sudah ada di Library', 'error');
      } else if(e && e.code === 'INTEGRITY_MISMATCH') {
        console.log('[V24.5] Map Backup restore REJECTED', {reason:e.code, committedCount:Number(e.committedCount)||0});
        setStatus('Restore ditolak: integrity check gagal.', false, 100);
        showLithositeToast_('Ditolak — integrity check gagal', 'error');
      } else {
        console.error('[V24.5] Map Backup restore failed', e);
        setStatus('Restore gagal: ' + String(e && e.message || e), false, 100);
        showLithositeToast_('Restore gagal — ' + String(e && e.message || e), 'error');
      }
    } finally {
      if(els.restoreBtn) { els.restoreBtn.disabled = false; els.restoreBtn.textContent = '↥ Import / Restore Backup Peta'; els.restoreBtn.style.opacity = '1'; }
    }
  }

  async function handleImage(file) {
    const reader = new FileReader();
    reader.onload = () => {
      state.fileDataUrl = reader.result;
      els.preview.style.display = 'block';
      els.preview.innerHTML = `<img src="${reader.result}" style="width:100%;display:block;" />`;
      setStatus('Gambar siap. Isi koordinat manual 2 sudut.', true, 100);
      showManualCoordsForm();
    };
    reader.readAsDataURL(file);
  }

  async function handleGeoTiff(file) {
    setStatus('Membaca GeoTIFF...', true, 10);
    try {
      if(typeof tryParseGeoTiff_ === 'function') {
        const res = await tryParseGeoTiff_(file);
        if(res && res.cornerTL) {
          state.fileDataUrl = res.imageDataUrl;
          state.cornerTL = res.cornerTL;
          state.cornerBR = res.cornerBR;
          els.preview.style.display = 'block';
          els.preview.innerHTML = `<img src="${res.imageDataUrl}" style="width:100%;display:block;" />`;
          showCoords(res.cornerTL, res.cornerBR, true);
          setStatus('✓ Koordinat GeoTIFF terbaca otomatis.', true, 100);
          return;
        }
      }
    } catch(err) {
      console.warn('[V19] GeoTIFF parse fail', err);
    }
    // fallback to image
    await handleImage(file);
  }

  async function handleGeoPdf(file) {
    state.processing = true;
    setStatus('Membaca metadata GeoPDF...', true, 5);

    // Progress reporter yang TIDAK manggil render() global
    let pendingMsg = '';
    let pendingPct = 0;
    let rafPending = false;
    const paint = () => {
      rafPending = false;
      setStatus(pendingMsg, true, pendingPct);
    };
    const reporter = (msg, pct) => {
      pendingMsg = msg;
      pendingPct = pct;
      if(!rafPending) {
        rafPending = true;
        requestAnimationFrame(paint);
      }
    };
    reporter.stop = () => {};

    try {
      // tryParseGeoPdf_ ada di peta.js global - pakai itu tapi dengan reporter isolasi
      let geoRefReady = false;
      const applyEarly = ({geoReference, cornerTL, cornerBR}) => {
        if(!cornerTL || !cornerBR) return;
        geoRefReady = true;
        state.geoReference = geoReference;
        state.cornerTL = cornerTL;
        state.cornerBR = cornerBR;
        // update coords DOM langsung tanpa render()
        showCoords(cornerTL, cornerBR, true);
      };

      if(typeof tryParseGeoPdf_ !== 'function') {
        setStatus('PDF parser belum siap. Coba lagi.', false, 0);
        return;
      }

      const result = await tryParseGeoPdf_(file, reporter, applyEarly);

      if(result && result.ok) {
        state.geoReference = result.geoReference;
        state.tilePyramid = result.tilePyramid;
        state.fileDataUrl = result.imageDataUrl;
        state.cornerTL = result.cornerTL;
        state.cornerBR = result.cornerBR;
        
        // preview
        els.preview.style.display = 'block';
        els.preview.innerHTML = `<img src="${result.imageDataUrl}" style="width:100%;display:block;" />`;
        showCoords(result.cornerTL, result.cornerBR, true);
        setStatus('✓ Koordinat & gambar terbaca otomatis dari GeoPDF.', true, 100);
        
        // simpan runtime file untuk V15
        try {
          if(typeof mapUploadRuntimeFile_ !== 'undefined') {
            mapUploadRuntimeFile_ = file;
          }
          window._v19RuntimeFile = file;
        } catch(_){}
      } else if(result && result.cornerTL) {
        // partial: koordinat ok, gambar gagal
        state.geoReference = result.geoReference;
        state.cornerTL = result.cornerTL;
        state.cornerBR = result.cornerBR;
        showCoords(result.cornerTL, result.cornerBR, true);
        setStatus(result.reason || 'Koordinat terbaca, tapi gambar gagal. Upload PNG/JPG terpisah.', false, 100);
        // tetap allow save dengan koordinat saja? minta image
      } else {
        setStatus((result && result.reason) ? result.reason : 'Gagal baca GeoPDF. Export ulang sebagai PNG/JPG.', false, 0);
      }
    } catch(err) {
      console.error('[V19] GeoPDF error', err);
      setStatus('Error baca GeoPDF: ' + (err.message||err), false, 0);
    } finally {
      state.processing = false;
    }
  }

  function showCoords(tl, br, auto) {
    els.coords.style.display = 'block';
    els.coords.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
        <div><div style="color:rgba(255,255,255,0.35);font-size:9px;">KIRI-ATAS Timur</div><div style="color:#fff;font-weight:600;">${tl.timur}</div></div>
        <div><div style="color:rgba(255,255,255,0.35);font-size:9px;">KIRI-ATAS Utara</div><div style="color:#fff;font-weight:600;">${tl.utara}</div></div>
        <div><div style="color:rgba(255,255,255,0.35);font-size:9px;">KANAN-BAWAH Timur</div><div style="color:#fff;font-weight:600;">${br.timur}</div></div>
        <div><div style="color:rgba(255,255,255,0.35);font-size:9px;">KANAN-BAWAH Utara</div><div style="color:#fff;font-weight:600;">${br.utara}</div></div>
      </div>
      <div style="margin-top:8px;font-size:9px;color:${auto?'#4ade80':'#fbbf24'};">${auto?'✓ Koordinat auto-detect dari file':'Isi manual 2 sudut'}</div>
    `;
  }

  function showManualCoordsForm() {
    // untuk PNG/JPG biasa - tetap tampilkan form manual simple
    els.coords.style.display = 'block';
    els.coords.innerHTML = `
      <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:6px;">Masukkan Timur/Utara KIRI-ATAS dan KANAN-BAWAH dari ArcGIS/data survey</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <input id="mg1-v19-tl-timur" placeholder="Kiri-Atas Timur" style="background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;font-size:11px;color:#fff;" />
        <input id="mg1-v19-tl-utara" placeholder="Kiri-Atas Utara" style="background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;font-size:11px;color:#fff;" />
        <input id="mg1-v19-br-timur" placeholder="Kanan-Bawah Timur" style="background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;font-size:11px;color:#fff;" />
        <input id="mg1-v19-br-utara" placeholder="Kanan-Bawah Utara" style="background:#0b1329;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;font-size:11px;color:#fff;" />
      </div>
    `;
  }

  async function onSave() {
    if(state.busy || state.processing) return;
    if(!state.fileDataUrl) {
      setStatus('Pilih gambar peta dulu.', false);
      return;
    }
    if(!state.name.trim()) {
      setStatus('Nama peta wajib diisi.', false);
      return;
    }

    // ambil koordinat - dari auto atau manual
    let tlTimur, tlUtara, brTimur, brUtara;
    if(state.cornerTL && state.cornerBR) {
      tlTimur = state.cornerTL.timur;
      tlUtara = state.cornerTL.utara;
      brTimur = state.cornerBR.timur;
      brUtara = state.cornerBR.utara;
    } else {
      // manual
      const tlT = document.getElementById('mg1-v19-tl-timur');
      const tlU = document.getElementById('mg1-v19-tl-utara');
      const brT = document.getElementById('mg1-v19-br-timur');
      const brU = document.getElementById('mg1-v19-br-utara');
      if(!tlT || !tlU || !brT || !brU || !tlT.value || !tlU.value || !brT.value || !brU.value) {
        setStatus('Isi 4 angka Timur/Utara.', false);
        return;
      }
      tlTimur = parseFloat(tlT.value);
      tlUtara = parseFloat(tlU.value);
      brTimur = parseFloat(brT.value);
      brUtara = parseFloat(brU.value);
    }

    state.busy = true;
    els.saveBtn.textContent = 'Menyimpan...';
    els.saveBtn.style.opacity = '0.7';
    setStatus('Menyimpan ke HP...', true, 90);

    // V19: capture peta lama untuk no flicker transition
    let freezeOverlay = null;
    try {
      if(typeof captureMapSurfaceTransition_ === 'function') {
        freezeOverlay = captureMapSurfaceTransition_();
      }
    } catch(_){}

    try {
      const id = 'bgmap_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
      const tilePyramid = state.tilePyramid ? {...state.tilePyramid, runtimeMapId: id} : null;

      // dbPutMap_ ada di peta.js global
      if(typeof dbPutMap_ !== 'function') throw new Error('dbPutMap_ tidak tersedia');

      await dbPutMap_({
        id: id,
        name: state.name.trim(),
        imageDataUrl: state.fileDataUrl,
        cornerTL: state.geoReference && state.geoReference.extent ? {...state.geoReference.extent.cornerTL} : {timur: tlTimur, utara: tlUtara},
        cornerBR: state.geoReference && state.geoReference.extent ? {...state.geoReference.extent.cornerBR} : {timur: brTimur, utara: brUtara},
        geoReference: state.geoReference || null,
        tilePyramid: tilePyramid,
        uploadedAt: new Date().toISOString(),
        uploadedBy: (typeof sessionInfo !== 'undefined' && sessionInfo) ? sessionInfo.userName : 'unknown'
      });

      if(typeof loadBackgroundMapsFromDb_ === 'function') {
        await loadBackgroundMapsFromDb_();
      }

      // runtime PDF source
      try {
        const runtimeFile = window._v19RuntimeFile || state.file;
        if(state.geoReference && runtimeFile && typeof registerLithositeRuntimePdfSource_ === 'function') {
          registerLithositeRuntimePdfSource_(id, runtimeFile, state.geoReference);
        }
      } catch(_){}

      // aktifkan peta baru langsung - tidak lewat Kelola modal
      if(typeof activeBackgroundMapId !== 'undefined') {
        activeBackgroundMapId = id;
      }
      if(typeof mapZoom !== 'undefined') mapZoom = 1.25;
      if(typeof mapViewportState_ !== 'undefined') mapViewportState_.centerNative = null;
      try { localStorage.setItem('mg1_active_bg_map_id', id); } catch(_){}

      setStatus('✓ Peta tersimpan!', true, 100);

      // tutup modal dengan fade natural
      setTimeout(() => {
        close();
        // satu render final saja - dengan overlay freeze yang sudah di-capture
        try {
          if(typeof mapManagePanelOpen !== 'undefined') mapManagePanelOpen = false;
          if(typeof mapUploadFormOpen !== 'undefined') mapUploadFormOpen = false;
          if(typeof render === 'function') render();
        } catch(_){}
        try {
          if(typeof releaseMapSurfaceTransition_ === 'function') {
            releaseMapSurfaceTransition_(freezeOverlay);
          } else if(freezeOverlay) {
            freezeOverlay.style.transition = 'opacity 250ms ease-out';
            freezeOverlay.style.opacity = '0';
            setTimeout(()=>{ try{freezeOverlay.remove();}catch(_){} }, 300);
          }
        } catch(_){}
      }, 400);

    } catch(err) {
      console.error('[V19] save error', err);
      setStatus('Gagal simpan: ' + (err.message||err), false);
      state.busy = false;
      els.saveBtn.textContent = 'Simpan Peta Baru';
      els.saveBtn.style.opacity = '1';
      try { if(freezeOverlay) freezeOverlay.remove(); } catch(_){}
    }
  }

  // Public API
  window.MG1NewMapModal = {
    open: open,
    close: close,
    _state: state
  };

  // Auto-override tombol lama "Tambah Peta Baru" dan "Kelola Peta Background"
  function overrideOldButtons() {
    // Override global openMapUploadForm_ jika ada
    if(typeof window.openMapUploadForm_ === 'function') {
      const old = window.openMapUploadForm_;
      window.openMapUploadForm_ = function() {
        console.log('[V19] openMapUploadForm_ overridden -> new modal');
        open();
      };
    }
    // Override openMapManagePanel_ untuk tetap pakai modal lama? tapi kita skip
    // Tombol di UI yang manggil openMapManagePanel_ tetap jalan, tapi Tambah Peta Baru di dalamnya kita override
    const check = setInterval(() => {
      const btns = document.querySelectorAll('button');
      btns.forEach(b => {
        if(b.textContent && b.textContent.includes('Tambah Peta Baru') && !b.__v19Overridden) {
          b.__v19Overridden = true;
          b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); open(); };
        }
      });
    }, 1000);
  }

  // Init after DOM ready
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { ensureDom(); overrideOldButtons(); });
  } else {
    ensureDom();
    overrideOldButtons();
  }

  console.log('[V19 NEW MODAL] Ready - call MG1NewMapModal.open() to test');
})();

/* ===== V23 NO MODAL FLICKER TIMING FIX INTEGRATED ===== */
/* V23 NO MODAL FLICKER - MATIKAN render() UNTUK SEMUA MODAL PETA
 * Masalah video 18.28: 
 * - openMapManagePanel_() { render() } -> rebuild #app
 * - openMapUploadForm_() { render() } -> rebuild #app lagi
 * - Klik + Tambah Peta Baru di dalam Kelola -> 2 modal rebutan render -> flicker 7.6s, 10.8s
 * Solusi: Override semua open/close modal jadi isolated, tidak pakai render() global
 */

(function(){
  console.log('[V23] Loading NO-MODAL-FLICKER fix');

  // Simpan original untuk fallback
  const origOpenManage = window.openMapManagePanel_;
  const origCloseManage = window.closeMapManagePanel_;
  const origOpenUpload = window.openMapUploadForm_;
  const origCloseUpload = window.closeMapUploadForm_;

  // State untuk modal isolated
  let manageModalEl = null;
  let uploadModalEl = null;

  function ensureManageModalDom() {
    if(manageModalEl && document.body.contains(manageModalEl)) return manageModalEl;

    const el = document.createElement('div');
    el.id = 'mg1-manage-modal-isolated';
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483646;display:none;';
    el.innerHTML = `
      <div id="mg1-manage-backdrop" style="position:absolute;inset:0;background:rgba(3,8,20,0.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;transition:opacity 200ms ease;"></div>
      <div id="mg1-manage-panel" style="position:absolute;left:0;right:0;bottom:0;max-height:82vh;background:#0e1933;border-top:1px solid rgba(255,255,255,0.10);border-radius:22px 22px 0 0;transform:translateY(100%);transition:transform 300ms cubic-bezier(0.16,1,0.3,1);overflow:auto;box-shadow:0 -18px 60px rgba(0,0,0,.28);">
        <div style="padding:18px 16px 14px;">
          <div style="width:38px;height:4px;background:rgba(255,255,255,.22);border-radius:9999px;margin:0 auto 14px;"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div>
              <div style="font-size:14px;font-weight:800;color:#fff;letter-spacing:-.01em;">Map Library</div>
              <div id="mg1-manage-count" style="font-size:10px;color:rgba(255,255,255,.42);margin-top:3px;">0 peta tersimpan</div>
            </div>
            <button id="mg1-manage-close" type="button" aria-label="Tutup" style="width:30px;height:30px;border-radius:9999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.68);font-size:17px;line-height:1;">×</button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
            <button id="mg1-manage-add" type="button" aria-label="Tambah peta" title="Tambah peta" style="flex:0 0 48px;width:48px;height:44px;border-radius:12px;background:#2563eb;border:1px solid rgba(96,165,250,.25);color:#fff;font-size:28px;line-height:1;font-weight:300;box-shadow:0 8px 22px rgba(37,99,235,.18);">+</button>
            <button id="mg1-manage-scope" type="button" aria-label="Tampilkan peta aktif" title="Hanya peta aktif / Semua peta" data-scope="all" style="flex:0 0 48px;width:48px;height:44px;border-radius:12px;background:rgba(245,158,11,.13);border:1px solid rgba(245,158,11,.28);color:#fbbf24;font-size:20px;line-height:1;font-weight:800;">✓</button>
            <div style="position:relative;flex:1;min-width:0;">
              <input id="mg1-manage-search" type="search" autocomplete="off" placeholder="Cari peta..." aria-label="Cari peta" style="width:100%;height:44px;box-sizing:border-box;background:#0a142b;border:1px solid rgba(255,255,255,.10);border-radius:12px;padding:0 46px 0 14px;color:#fff;font-size:12px;outline:none;">
              <button id="mg1-manage-options" type="button" aria-label="Urutkan dan filter" title="Urutkan dan filter" style="position:absolute;right:5px;top:5px;width:34px;height:34px;border:0;border-radius:9px;background:transparent;color:rgba(255,255,255,.62);font-size:18px;line-height:1;">☰</button>
            </div>
          </div>

          <div id="mg1-manage-options-panel" style="display:none;margin:-4px 0 12px;padding:10px;background:#101d39;border:1px solid rgba(255,255,255,.08);border-radius:12px;">
            <div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.38);letter-spacing:.05em;text-transform:uppercase;margin:0 0 8px;">Pengaturan Library</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
              <label style="display:block;font-size:9px;color:rgba(255,255,255,.42);font-weight:700;">Urutkan
                <select id="mg1-manage-sort" aria-label="Urutkan peta" style="display:block;width:100%;margin-top:5px;background:#16233f;border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:8px;color:#fff;font-size:10px;font-weight:700;outline:none;">
                  <option value="name-asc">Nama A–Z</option><option value="name-desc">Nama Z–A</option><option value="newest">Terbaru</option><option value="oldest">Terlama</option>
                </select>
              </label>
              <label style="display:block;font-size:9px;color:rgba(255,255,255,.42);font-weight:700;">Label
                <select id="mg1-manage-label" aria-label="Filter label" style="display:block;width:100%;margin-top:5px;background:#16233f;border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:8px;color:#fff;font-size:10px;font-weight:700;outline:none;">
                  <option value="__all__">Semua Label</option>
                </select>
              </label>
              <label style="display:block;font-size:9px;color:rgba(255,255,255,.42);font-weight:700;">Koleksi
                <select id="mg1-manage-collection" aria-label="Filter koleksi" style="display:block;width:100%;margin-top:5px;background:#16233f;border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:8px;color:#fff;font-size:10px;font-weight:700;outline:none;">
                  <option value="__all__">Semua Koleksi</option>
                </select>
              </label>
            </div>
            <div style="height:1px;background:rgba(255,255,255,.06);margin:10px 0;"> </div>
            <div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.38);letter-spacing:.05em;text-transform:uppercase;margin:0 0 7px;">Storage Summary</div>
            <div id="mg1-manage-storage" style="padding:10px 10px;border:1px solid rgba(96,165,250,.12);border-radius:11px;background:rgba(255,255,255,.025);display:none;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
              <div style="min-width:0;">
                <div style="font-size:10px;font-weight:800;color:rgba(255,255,255,.82);">Penyimpanan Peta</div>
                <div id="mg1-manage-storage-detail" style="font-size:9px;color:rgba(255,255,255,.40);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Membaca kapasitas...</div>
              </div>
              <span id="mg1-manage-storage-state" style="display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:800;letter-spacing:.03em;background:rgba(255,255,255,.07);color:rgba(255,255,255,.58);">—</span>
            </div>
            <div style="margin-top:9px;height:5px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;">
              <div id="mg1-manage-storage-bar" style="height:100%;width:0%;border-radius:999px;background:#60a5fa;transition:width 220ms ease;"></div>
            </div>
            <div id="mg1-manage-storage-meta" style="display:flex;justify-content:space-between;gap:10px;margin-top:5px;font-size:8px;color:rgba(255,255,255,.28);">
              <span>Payload peta: —</span><span>Kuota: —</span>
            </div>
            <div id="mg1-manage-storage-hint" role="status" aria-live="polite" style="display:none;margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.06);font-size:8px;line-height:1.35;color:rgba(255,255,255,.48);"></div>
            </div>
          </div>
          <div id="mg1-manage-list"></div>
          <div style="margin-top:8px;font-size:9px;color:rgba(255,255,255,.25);text-align:center;">Peta disimpan di HP · IndexedDB · offline</div>
        </div>
      </div>
    `;
    document.body.appendChild(el);

    el.querySelector('#mg1-manage-backdrop').onclick = () => closeManageModal();
    el.querySelector('#mg1-manage-close').onclick = () => closeManageModal();
    el.querySelector('#mg1-manage-add').onclick = () => {
      closeManageModal();
      setTimeout(() => openUploadModal(), 330);
    };

    manageModalEl = el;
    return el;
  }

  function getManageActiveId_() {
    let activeId = null;
    try {
      activeId = (typeof activeBackgroundMapId !== 'undefined' && activeBackgroundMapId)
        || localStorage.getItem('mg1_active_bg_map_id')
        || null;
    } catch (_) {}
    return activeId;
  }

  function renderManageList_(listEl, maps, activeId) {
    if(!listEl) return;
    if(!maps || maps.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:28px 0;color:rgba(255,255,255,.32);font-size:11px;">Tidak ada peta yang cocok.</div>';
      return;
    }
    listEl.innerHTML = maps.map(m => {
      const isActive = !!activeId && String(m.id) === String(activeId);
      const cardStyle = isActive
        ? 'display:flex;align-items:center;gap:10px;background:rgba(16,185,129,.075);border:1px solid rgba(16,185,129,.42);border-radius:14px;padding:10px;margin-bottom:8px;'
        : 'display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.035);border-radius:14px;padding:10px;margin-bottom:8px;';
      const safeId = escapeHtml_(m.id || '');
      const safeName = escapeHtml_(m.name || 'Tanpa nama');
      const metadata = `${safeId.slice(0,12)} • ${m.tilePyramid ? (m.tilePyramid.levels?.length||0)+' level' : 'single'}${getMapLabels_(m).length ? ` • 🏷️ ${getMapLabels_(m).slice(0,2).map(function(v){ return escapeHtml_(v); }).join(' · ')}` : ''}${Array.isArray(m.collectionNames) && m.collectionNames.length ? ` • ${m.collectionNames.slice(0,2).map(function(v){ return '◈ ' + escapeHtml_(v); }).join(' · ')}` : ''}`;
      return `
        <div style="${cardStyle}" data-map-card="${safeId}">
          <div style="width:52px;height:52px;border-radius:10px;background:#0b1329;overflow:hidden;flex-shrink:0;border:1px solid rgba(255,255,255,.06);">
            ${m.imageDataUrl ? `<img src="${m.imageDataUrl}" alt="" style="width:100%;height:100%;object-fit:cover;">` : ''}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:7px;min-width:0;">
              <div style="font-size:12px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safeName}</div>
              ${isActive ? '<span style="display:inline-flex;align-items:center;gap:4px;flex-shrink:0;font-size:9px;font-weight:800;color:#6ee7b7;"><span style="width:7px;height:7px;border-radius:50%;background:#34d399;"></span>AKTIF</span>' : ''}
            </div>
            <div style="font-size:9px;color:rgba(255,255,255,.38);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${metadata}</div>
          </div>
          <button type="button" aria-label="Menu ${safeName}" data-map-menu="${safeId}" style="width:38px;height:38px;border-radius:9999px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.72);font-size:18px;letter-spacing:2px;line-height:1;flex-shrink:0;">•••</button>
        </div>`;
    }).join('');
  }

  function showMapActionSheet_(entry, activeId, onDone) {
    if (!entry || !entry.id) return;
    const old = document.getElementById('mg1-map-action-sheet'); if (old) old.remove();
    const isActive = !!activeId && String(activeId) === String(entry.id);
    const root = document.createElement('div');
    root.id = 'mg1-map-action-sheet';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-end;justify-content:center;background:rgba(3,8,20,.60);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
    const row = (icon, label, attr, danger) => `<button type="button" ${attr || ''} style="width:100%;display:flex;align-items:center;gap:16px;padding:15px 20px;background:transparent;border:0;border-bottom:1px solid rgba(255,255,255,.065);color:${danger ? '#ff6262' : '#e7ebf4'};font-size:13px;text-align:left;"><span style="width:22px;text-align:center;font-size:18px;opacity:.85;">${icon}</span><span>${label}</span></button>`;
    root.innerHTML = `<div id="mg1-map-action-panel" role="dialog" aria-modal="true" aria-label="Aksi peta" style="width:min(100%,520px);background:#101c38;border:1px solid rgba(255,255,255,.10);border-radius:22px 22px 0 0;box-shadow:0 -18px 55px rgba(0,0,0,.35);padding:12px 18px 18px;transform:translateY(110%);transition:transform 220ms cubic-bezier(.16,1,.3,1);">
      <div style="width:38px;height:4px;background:rgba(255,255,255,.20);border-radius:9999px;margin:0 auto 12px;"></div>
      <div style="display:flex;align-items:center;gap:12px;padding:0 2px 12px;">
        <div style="width:48px;height:48px;border-radius:10px;background:#0b1329;overflow:hidden;flex-shrink:0;">${entry.imageDataUrl ? `<img src="${entry.imageDataUrl}" alt="" style="width:100%;height:100%;object-fit:cover;">` : ''}</div>
        <div style="min-width:0;"><div style="display:flex;align-items:center;gap:7px;min-width:0;"><div style="font-size:14px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml_(entry.name || 'Tanpa nama')}</div>${isActive ? '<span style="display:inline-flex;align-items:center;gap:4px;flex-shrink:0;font-size:9px;font-weight:800;color:#6ee7b7;"><span style="width:6px;height:6px;border-radius:50%;background:#34d399;"></span>AKTIF</span>' : ''}</div><div style="font-size:10px;color:rgba(255,255,255,.40);margin-top:3px;">${escapeHtml_(entry.id || '')}</div></div>
      </div>
      <div style="overflow:hidden;border:1px solid rgba(255,255,255,.08);border-radius:15px;background:#091329;">
        ${!isActive ? row('✓','Aktifkan Peta','data-action="activate"') : ''}
        ${row('ⓘ','Lihat Info Peta','data-action="info"')}
        ${row('⧉','Duplikat / Salin Peta','data-action="duplicate"')}
        ${row('⇄','Ganti Data Peta','data-action="replace"')}
        ${row('✎','Edit Nama','data-action="rename"')}
        ${row('🏷️','Edit Label','data-action="label"')}
        ${row('▦','Ganti Koleksi','data-action="collection"')}
        ${row('⇩','Backup / Export Peta','data-action="export"')}
        ${row('↗','Bagikan / Transfer Peta','data-action="share"')}
        ${row('▣','Hapus Peta','data-action="delete"', true)}
      </div>
      <button type="button" data-action="cancel" style="width:100%;margin-top:14px;padding:12px;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.78);font-size:12px;font-weight:800;">Batal</button>
    </div>`;
    document.body.appendChild(root);
    const panel = root.querySelector('#mg1-map-action-panel');
    const close = () => { panel.style.transform='translateY(110%)'; setTimeout(()=>root.remove(),230); };
    root.addEventListener('click', ev => { if (ev.target === root) close(); });
    root.querySelector('[data-action="cancel"]').onclick = close;
    root.querySelectorAll('[data-action]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      if (action === 'cancel') return;
      btn.onclick = async () => {
        if (action === 'activate') { close(); await window.MG1MapLibrary.activate(entry.id); return; }
        if (action === 'duplicate') { close(); if (window.MG1MapLifecycleCompletion && typeof window.MG1MapLifecycleCompletion.duplicate === 'function') { await window.MG1MapLifecycleCompletion.duplicate(entry.id); if (typeof onDone === 'function') await onDone(); } return; }
        if (action === 'replace') { close(); if (window.MG1MapLifecycleCompletion && typeof window.MG1MapLifecycleCompletion.beginReplace === 'function') { await window.MG1MapLifecycleCompletion.beginReplace(entry.id); } return; }
        if (action === 'share') {
          close();
          if (!window.MG1MapPackageTransfer || typeof window.MG1MapPackageTransfer.shareMaps !== 'function') return;
          try {
            const result = await window.MG1MapPackageTransfer.shareMaps([String(entry.id)]);
            console.log('[V24.5 S2.5.1] Map share/transfer PASS', {id: entry.id, name: entry.name, count: result.count, bytes: result.bytes, integrity: result.integrity});
            if (typeof window.MG1LithositeToast === 'function') window.MG1LithositeToast('Peta siap dibagikan / ditransfer', 'success');
          } catch(e) {
            if (e && e.code === 'SHARE_CANCELLED') {
              console.log('[V24.5 S2.5.1] Map share cancelled', {id: entry.id});
              if (typeof window.MG1LithositeToast === 'function') window.MG1LithositeToast('Berbagi dibatalkan', 'error');
            } else {
              if (e && e.code === 'SHARE_CANCELLED') {
                console.log('[V24.5 S2.5.1] Map share cancelled', {id: entry.id});
              } else if (e && (e.code === 'SHARE_UNAVAILABLE' || e.code === 'SHARE_FILE_UNSUPPORTED')) {
                console.warn('[V24.5 S2.5.1] Map share unavailable', e);
                if (typeof window.MG1LithositeToast === 'function') window.MG1LithositeToast('Bagikan tidak tersedia pada browser/perangkat ini', 'error');
              } else {
                console.error('[V24.5 S2.5.1] Map share failed', e);
                if (typeof window.MG1LithositeToast === 'function') window.MG1LithositeToast('Bagikan peta gagal', 'error');
              }
            }
          }
          return;
        }
        if (action === 'export') {
          close();
          if (!window.MG1MapPackageTransfer || typeof window.MG1MapPackageTransfer.exportMaps !== 'function') return;
          try {
            const result = await window.MG1MapPackageTransfer.exportMaps([String(entry.id)]);
            console.log('[V24.5] Map Backup export PASS', {id: entry.id, name: entry.name, count: result.count, bytes: result.bytes, integrity: result.integrity});
            if (typeof window.MG1LithositeToast === 'function') window.MG1LithositeToast('Backup berhasil — file .mg1map tersimpan', 'success');
          } catch(e) {
            console.error('[V24.5] Map Backup export failed', e);
            if (typeof window.MG1LithositeToast === 'function') window.MG1LithositeToast('Backup / Export gagal — ' + String(e && e.message || e), 'error');
          }
          return;
        }
        close();
        if (action === 'info') showMapInfo_(entry);
        else if (action === 'rename') showMapRename_(entry, onDone);
        else if (action === 'label') showMapLabel_(entry, onDone);
        else if (action === 'collection') showMapCollections_(entry, onDone);
        else if (action === 'delete') await window.MG1MapLibrary.remove(entry.id);
      };
    });
    requestAnimationFrame(() => requestAnimationFrame(() => { panel.style.transform='translateY(0)'; }));
  }

  function formatMapDate_(value) {
    if (!value) return '—';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (_) { return String(value); }
  }

  function escapeHtml_(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // V24.3 Slice 8+9: client-side sorting + read-only map info.
  function showMapInfo_(entry) {
    if (!entry) return;
    const old = document.getElementById('mg1-map-info-modal');
    if (old) old.remove();
    const contractMeta = (window.MG1MapLibraryContract && typeof window.MG1MapLibraryContract.metadata === 'function')
      ? window.MG1MapLibraryContract.metadata(entry) : null;
    const levels = entry.tilePyramid && Array.isArray(entry.tilePyramid.levels) ? entry.tilePyramid.levels.length : 0;
    const geo = contractMeta && contractMeta.hasGeoReference ? 'Tersedia' : 'Tidak tersedia';
    const preview = contractMeta && contractMeta.hasPreview ? 'Tersedia' : 'Tidak tersedia';
    const activeId = getManageActiveId_();
    const isActive = !!activeId && String(activeId) === String(entry.id);
    const el = document.createElement('div');
    el.id = 'mg1-map-info-modal';
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(3,8,20,0.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
    el.innerHTML = `
      <div role="dialog" aria-modal="true" aria-label="Info peta" style="width:min(420px,100%);max-height:80vh;overflow:auto;background:#0e1933;border:1px solid rgba(255,255,255,0.1);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.45);padding:16px;color:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="font-size:13px;font-weight:800;">Info Peta</div>
          <button type="button" data-info-close style="width:28px;height:28px;border-radius:9999px;background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.7);">✕</button>
        </div>
        ${entry.imageDataUrl ? `<div style="height:120px;border-radius:10px;overflow:hidden;background:#0b1329;margin-bottom:12px;"><img src="${entry.imageDataUrl}" style="width:100%;height:100%;object-fit:cover;" /></div>` : ''}
        <div style="font-size:14px;font-weight:800;margin-bottom:10px;">${escapeHtml_(entry.name || 'Tanpa nama')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${[
            ['Status', isActive ? '● AKTIF' : 'Tidak aktif'],
            ['ID', entry.id || '—'],
            ['Level tile', levels ? String(levels) : 'Single'],
            ['Preview', preview],
            ['GeoReference', geo],
            ['Terakhir disimpan', formatMapDate_(entry.uploadedAt)]
          ].map(function(pair){ return `<div style="background:rgba(255,255,255,0.04);border-radius:9px;padding:9px;"><div style="font-size:9px;color:rgba(255,255,255,0.38);margin-bottom:3px;">${escapeHtml_(pair[0])}</div><div style="font-size:10px;color:#fff;word-break:break-word;">${escapeHtml_(pair[1])}</div></div>`; }).join('')}
        </div>
        <div style="margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,0.07);border-radius:11px;background:rgba(255,255,255,0.025);">
          <div style="font-size:9px;letter-spacing:.08em;color:rgba(255,255,255,0.38);font-weight:800;margin-bottom:4px;">LITHOSITE</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.58);line-height:1.45;">Mining Operational Map Platform</div>
          <button type="button" data-contact-us style="margin-top:9px;width:100%;padding:8px 10px;border-radius:9px;border:1px solid rgba(96,165,250,0.24);background:rgba(59,130,246,0.10);color:#93c5fd;font-size:10px;font-weight:800;">✉ Contact Us</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    const close = () => el.remove();
    el.querySelector('[data-info-close]').onclick = close;
    const contactBtn = el.querySelector('[data-contact-us]');
    if (contactBtn) contactBtn.onclick = function () {
      const email = String(window.MG1_CONTACT_EMAIL || '').trim();
      if (email) {
        window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Lithosite Contact');
        return;
      }
      const notice = document.createElement('div');
      notice.style.cssText = 'position:fixed;inset:0;z-index:2147483648;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(3,8,20,0.58);backdrop-filter:blur(5px);';
      notice.innerHTML = '<div role=\"dialog\" aria-modal=\"true\" style=\"width:min(320px,100%);background:#0e1933;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:16px;color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.4);\"><div style=\"font-size:13px;font-weight:800;margin-bottom:7px;\">Contact Us</div><div style=\"font-size:11px;line-height:1.5;color:rgba(255,255,255,.58);\">Email kontak Lithosite belum dikonfigurasi. Slot ini siap digunakan untuk alamat support atau partner resmi.</div><button type=\"button\" data-contact-close style=\"margin-top:12px;width:100%;padding:8px;border:0;border-radius:9px;background:rgba(255,255,255,.08);color:#fff;font-size:10px;font-weight:800;\">Tutup</button></div>';
      document.body.appendChild(notice);
      const done = () => notice.remove();
      notice.querySelector('[data-contact-close]').onclick = done;
      notice.addEventListener('click', function(ev){ if(ev.target === notice) done(); });
    };
    el.addEventListener('click', function(ev){ if(ev.target === el) close(); });
  }

  // V24.3 Slice 11: rename map metadata only; no runtime surface rebuild.
  function showMapRename_(entry, onDone) {
    if (!entry || !entry.id) return;
    const old = document.getElementById('mg1-map-rename-modal');
    if (old) old.remove();
    const root = document.createElement('div');
    root.id = 'mg1-map-rename-modal';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(3,8,20,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
    root.innerHTML = `
      <div role="dialog" aria-modal="true" aria-label="Ganti nama peta" style="width:min(360px,100%);background:#0e1933;border:1px solid rgba(255,255,255,.1);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.45);padding:16px;color:#fff;">
        <div style="font-size:13px;font-weight:800;margin-bottom:10px;">Ganti Nama Peta</div>
        <input id="mg1-map-rename-input" type="text" maxlength="120" autocomplete="off" value="${escapeHtml_(entry.name || '')}" aria-label="Nama peta baru" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:10px 11px;color:#fff;font-size:11px;outline:none;">
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="button" data-rename-cancel style="flex:1;padding:9px;border-radius:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.75);font-size:10px;font-weight:800;">Batal</button>
          <button type="button" data-rename-save style="flex:1;padding:9px;border-radius:9px;background:#2563eb;border:0;color:#fff;font-size:10px;font-weight:800;">Simpan</button>
        </div>
      </div>`;
    document.body.appendChild(root);
    const input = root.querySelector('#mg1-map-rename-input');
    const close = () => root.remove();
    root.querySelector('[data-rename-cancel]').onclick = close;
    root.onclick = ev => { if (ev.target === root) close(); };
    const save = async () => {
      const name = String(input.value || '').trim();
      if (!name) { input.focus(); return; }
      if (name === String(entry.name || '').trim()) { close(); return; }
      try {
        const updated = (window.MG1MapLibrary && typeof window.MG1MapLibrary.updateMetadata === 'function')
          ? await window.MG1MapLibrary.updateMetadata(entry.id, {name: name})
          : Object.assign({}, entry, {name: name});
        if (!window.MG1MapLibrary || typeof window.MG1MapLibrary.updateMetadata !== 'function') {
          if (typeof dbPutMap_ === 'function') await dbPutMap_(updated);
          if (Array.isArray(window.backgroundMapsList)) {
            const idx = window.backgroundMapsList.findIndex(m => m && String(m.id) === String(entry.id));
            if (idx >= 0) window.backgroundMapsList[idx] = updated;
          }
        }
        close();
        if (typeof onDone === 'function') await onDone();
      } catch (e) {
        console.warn('[V24.3 MAP LIBRARY] rename failed', e);
      }
    };
    root.querySelector('[data-rename-save]').onclick = save;
    input.addEventListener('keydown', ev => { if (ev.key === 'Enter') save(); if (ev.key === 'Escape') close(); });
    requestAnimationFrame(() => { input.focus(); input.select(); });
  }

  // V24.3 Map Library: labels are logical metadata, not filesystem folders.
  // Legacy folderName is read as one label for backward compatibility.
  function getMapLabels_(map) {
    if (Array.isArray(map && map.labels)) {
      return map.labels.map(function(v){ return String(v || '').trim(); }).filter(Boolean);
    }
    const legacy = String(map && map.folderName || '').trim();
    return legacy ? [legacy] : [];
  }

  function collectLabelNames_(maps) {
    const names = []; const seen = new Set();
    (Array.isArray(maps) ? maps : []).forEach(function(m) {
      getMapLabels_(m).forEach(function(name) {
        if (!name) return;
        const key = name.toLocaleLowerCase(); if (seen.has(key)) return;
        seen.add(key); names.push(name);
      });
    });
    return names.sort(function(a,b){ return a.localeCompare(b, 'id', {sensitivity:'base', numeric:true}); });
  }

  function showMapLabel_(entry, onDone) {
    if (!entry || !entry.id) return;
    const old = document.getElementById('mg1-map-label-modal'); if (old) old.remove();
    const root = document.createElement('div'); root.id = 'mg1-map-label-modal';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(3,8,20,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
    const labels = getMapLabels_(entry);
    const presets = ['Production','Exploration','Geology','Topography','Survey'];
    root.innerHTML = `
      <div role="dialog" aria-modal="true" aria-label="Edit label peta" style="width:min(390px,100%);background:#0e1933;border:1px solid rgba(255,255,255,.1);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.45);padding:16px;color:#fff;">
        <div style="font-size:13px;font-weight:800;margin-bottom:4px;">Edit Label Peta</div>
        <div style="font-size:10px;color:rgba(255,255,255,.42);margin-bottom:12px;">Label adalah metadata untuk mengelompokkan peta. Tidak membuat folder fisik dan tidak mengubah tile/runtime.</div>
        <div id="mg1-map-label-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"></div>
        <input id="mg1-map-label-input" type="text" maxlength="80" autocomplete="off" placeholder="Ketik label, lalu Enter" aria-label="Tambah label" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:10px 11px;color:#fff;font-size:11px;outline:none;">
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
          ${presets.map(function(v){ return `<button type="button" data-label-preset="${v}" style="padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:9px;font-weight:700;">${v}</button>`; }).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="button" data-label-cancel style="flex:1;padding:9px;border-radius:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.75);font-size:10px;font-weight:800;">Batal</button>
          <button type="button" data-label-save style="flex:1;padding:9px;border-radius:9px;background:#2563eb;border:0;color:#fff;font-size:10px;font-weight:800;">Simpan</button>
        </div>
      </div>`;
    document.body.appendChild(root);
    const chips = root.querySelector('#mg1-map-label-chips');
    const input = root.querySelector('#mg1-map-label-input');
    const selected = labels.slice(0,12);
    function renderChips_() {
      chips.innerHTML = selected.length ? selected.map(function(label, i){
        return `<button type="button" data-remove-label="${i}" style="display:inline-flex;align-items:center;gap:5px;padding:6px 8px;border-radius:9999px;background:rgba(37,99,235,.12);border:1px solid rgba(96,165,250,.22);color:#bfdbfe;font-size:9px;font-weight:700;">🏷️ ${escapeHtml_(label)} <span style="opacity:.65;">×</span></button>`;
      }).join('') : '<span style="font-size:9px;color:rgba(255,255,255,.28);">Belum ada label</span>';
    }
    renderChips_();
    const close = () => root.remove();
    root.querySelector('[data-label-cancel]').onclick = close;
    root.onclick = ev => { if (ev.target === root) close(); };
    root.querySelectorAll('[data-label-preset]').forEach(function(btn){
      btn.onclick = () => {
        const value = String(btn.dataset.labelPreset || '').trim();
        if (value && !selected.some(function(v){ return v.toLocaleLowerCase() === value.toLocaleLowerCase(); }) && selected.length < 12) selected.push(value);
        renderChips_(); input.focus();
      };
    });
    chips.addEventListener('click', function(ev){
      const btn = ev.target.closest('[data-remove-label]'); if (!btn) return;
      selected.splice(Number(btn.dataset.removeLabel), 1); renderChips_();
    });
    input.addEventListener('keydown', function(ev){
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const value = String(input.value || '').trim().slice(0,80);
        if (value && !selected.some(function(v){ return v.toLocaleLowerCase() === value.toLocaleLowerCase(); }) && selected.length < 12) selected.push(value);
        input.value = ''; renderChips_();
      } else if (ev.key === 'Escape') close();
    });
    root.querySelector('[data-label-save]').onclick = async () => {
      try {
        if (window.MG1MapLibrary && typeof window.MG1MapLibrary.updateMetadata === 'function') {
          await window.MG1MapLibrary.updateMetadata(entry.id, {labels: selected});
        } else {
          const updated = Object.assign({}, entry); updated.labels = selected.slice(); delete updated.folderName;
          if (typeof dbPutMap_ === 'function') await dbPutMap_(updated);
          if (Array.isArray(window.backgroundMapsList)) { const idx = window.backgroundMapsList.findIndex(m => m && String(m.id) === String(entry.id)); if (idx >= 0) window.backgroundMapsList[idx] = updated; }
        }
        close(); if (typeof onDone === 'function') await onDone();
      } catch (e) { console.warn('[V24.3 MAP LIBRARY] label update failed', e); }
    };
    requestAnimationFrame(() => { input.focus(); });
  }

  // V24.3 Slice 13: lightweight multi-collection metadata. No collection store yet.
  function normalizeCollectionNames_(values) {
    var seen = Object.create(null), out = [];
    (Array.isArray(values) ? values : []).forEach(function(v){
      var name = String(v == null ? '' : v).trim().slice(0,80);
      if (!name) return;
      var key = name.toLocaleLowerCase();
      if (seen[key]) return;
      seen[key] = true; out.push(name);
    });
    return out.slice(0,8);
  }

  function collectCollectionNames_(maps) {
    var all = [];
    (Array.isArray(maps) ? maps : []).forEach(function(m){
      if (m && Array.isArray(m.collectionNames)) all = all.concat(m.collectionNames);
    });
    return normalizeCollectionNames_(all).sort(function(a,b){ return a.localeCompare(b, 'id', {sensitivity:'base', numeric:true}); });
  }

  function showMapCollections_(entry, onDone) {
    if (!entry || !entry.id) return;
    var old = document.getElementById('mg1-map-collection-modal'); if (old) old.remove();
    var presets = ['Current Maps','Historical Maps','Drill Maps','Geological Maps','Operational Maps'];
    var selected = normalizeCollectionNames_(entry.collectionNames || []);
    var root = document.createElement('div'); root.id = 'mg1-map-collection-modal';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(3,8,20,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
    root.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Atur koleksi peta" style="width:min(380px,100%);background:#0e1933;border:1px solid rgba(255,255,255,.1);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.45);padding:16px;color:#fff;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;"><div><div style="font-size:13px;font-weight:800;">Atur Koleksi</div><div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:2px;">Satu peta boleh masuk beberapa koleksi.</div></div><button type="button" data-collection-close style="width:28px;height:28px;border-radius:9999px;background:rgba(255,255,255,.08);border:none;color:rgba(255,255,255,.7);">✕</button></div>'
      + '<div style="font-size:11px;font-weight:700;color:#fff;margin-bottom:8px;">' + escapeHtml_(entry.name || 'Tanpa nama') + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:6px;">'
      + presets.map(function(v){ var checked = selected.some(function(x){ return x.toLocaleLowerCase() === v.toLocaleLowerCase(); }); return '<label style="display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:9px;background:rgba(255,255,255,.035);color:rgba(255,255,255,.8);font-size:10px;font-weight:700;cursor:pointer;"><input type="checkbox" data-collection-check value="' + escapeHtml_(v) + '" ' + (checked ? 'checked' : '') + ' style="accent-color:#2563eb;">' + escapeHtml_(v) + '</label>'; }).join('')
      + '</div>'
      + '<div style="margin-top:10px;"><input id="mg1-map-collection-custom" type="text" maxlength="80" autocomplete="off" placeholder="Koleksi custom…" aria-label="Koleksi custom" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 10px;color:#fff;font-size:10px;outline:none;"></div>'
      + '<div style="display:flex;gap:8px;margin-top:12px;"><button type="button" data-collection-cancel style="flex:1;padding:9px;border-radius:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.75);font-size:10px;font-weight:800;">Batal</button><button type="button" data-collection-save style="flex:1;padding:9px;border-radius:9px;background:#2563eb;border:0;color:#fff;font-size:10px;font-weight:800;">Simpan</button></div>'
      + '</div>';
    document.body.appendChild(root);
    var input = root.querySelector('#mg1-map-collection-custom');
    var close = function(){ root.remove(); };
    root.querySelector('[data-collection-close]').onclick = close;
    root.querySelector('[data-collection-cancel]').onclick = close;
    root.onclick = function(ev){ if(ev.target === root) close(); };
    var save = async function(){
      var names = [];
      root.querySelectorAll('[data-collection-check]:checked').forEach(function(cb){ names.push(cb.value); });
      var custom = String(input && input.value || '').trim(); if (custom) names.push(custom);
      var updated = Object.assign({}, entry); var normalized = normalizeCollectionNames_(names);
      if (normalized.length) updated.collectionNames = normalized; else delete updated.collectionNames;
      try {
        if (window.MG1MapLibrary && typeof window.MG1MapLibrary.updateMetadata === 'function') {
          await window.MG1MapLibrary.updateMetadata(entry.id, {collectionNames: normalized});
        } else {
          if (typeof dbPutMap_ === 'function') await dbPutMap_(updated);
          if (Array.isArray(window.backgroundMapsList)) { var idx = window.backgroundMapsList.findIndex(function(m){ return m && String(m.id) === String(entry.id); }); if (idx >= 0) window.backgroundMapsList[idx] = updated; }
        }
        close(); if (typeof onDone === 'function') await onDone();
      } catch (e) { console.warn('[V24.3 MAP LIBRARY] collection update failed', e); }
    };
    root.querySelector('[data-collection-save]').onclick = save;
    if (input) input.addEventListener('keydown', function(ev){ if(ev.key === 'Enter') save(); if(ev.key === 'Escape') close(); });
  }

  console.log('[V24.3 MAP LIBRARY] Slice 13 collections ready — metadata-only; no new store');
  console.log('[V24.5 S2.3.1] Storage Summary moved into three-line Library options panel');

  function openManageModal() {
    const el = ensureManageModalDom();
    const backdrop = el.querySelector('#mg1-manage-backdrop');
    const panel = el.querySelector('#mg1-manage-panel');
    const listEl = el.querySelector('#mg1-manage-list');
    const countEl = el.querySelector('#mg1-manage-count');
    const storageEl = el.querySelector('#mg1-manage-storage');
    const storageDetailEl = el.querySelector('#mg1-manage-storage-detail');
    const storageStateEl = el.querySelector('#mg1-manage-storage-state');
    const storageBarEl = el.querySelector('#mg1-manage-storage-bar');
    const storageMetaEl = el.querySelector('#mg1-manage-storage-meta');
    const storageHintEl = el.querySelector('#mg1-manage-storage-hint');
    const searchEl = el.querySelector('#mg1-manage-search');
    const filterEl = el.querySelector('#mg1-manage-filter');
    const sortEl = el.querySelector('#mg1-manage-sort');
    const labelEl = el.querySelector('#mg1-manage-label');
    const collectionEl = el.querySelector('#mg1-manage-collection');
    let manageFilter_ = 'all';
    let manageLabel_ = '__all__';
    let manageCollection_ = '__all__';
    let manageSort_ = 'name-asc';

    function applyManageFilter_(maps, activeId, filter) {
      if(filter === 'active') return maps.filter(m => activeId && String(m.id) === String(activeId));
      if(filter === 'inactive') return maps.filter(m => !activeId || String(m.id) !== String(activeId));
      return maps;
    }

    function syncManageFilterButtons_() {
      if(!filterEl) return;
      filterEl.querySelectorAll('[data-filter]').forEach(btn => {
        const on = btn.dataset.filter === manageFilter_;
        btn.style.background = on ? 'rgba(255,255,255,0.08)' : 'transparent';
        btn.style.borderColor = on ? 'rgba(255,255,255,0.12)' : 'transparent';
        btn.style.color = on ? '#fff' : 'rgba(255,255,255,0.5)';
      });
    }

    function applyManageLabel_(maps, label) {
      if (!label || label === '__all__') return maps;
      if (label === '__none__') return maps.filter(m => getMapLabels_(m).length === 0);
      const key = String(label).trim().toLocaleLowerCase();
      return maps.filter(m => getMapLabels_(m).some(function(v){ return String(v || '').trim().toLocaleLowerCase() === key; }));
    }

    function applyManageCollection_(maps, collection) {
      if (!collection || collection === '__all__') return maps;
      if (collection === '__none__') return maps.filter(m => !Array.isArray(m && m.collectionNames) || m.collectionNames.length === 0);
      const key = String(collection).trim().toLocaleLowerCase();
      return maps.filter(m => Array.isArray(m && m.collectionNames) && m.collectionNames.some(function(v){ return String(v || '').trim().toLocaleLowerCase() === key; }));
    }

    function syncManageCollectionOptions_(maps) {
      if (!collectionEl) return;
      const names = collectCollectionNames_(maps); const current = manageCollection_;
      collectionEl.innerHTML = '<option value="__all__">Semua koleksi</option><option value="__none__">Tanpa koleksi</option>' + names.map(function(name){ return `<option value="${escapeHtml_(name)}">◈ ${escapeHtml_(name)}</option>`; }).join('');
      const hasCurrent = Array.from(collectionEl.options).some(function(o){ return o.value === current; });
      manageCollection_ = hasCurrent ? current : '__all__'; collectionEl.value = manageCollection_;
      collectionEl.style.display = (names.length || maps.some(function(m){ return !Array.isArray(m && m.collectionNames) || m.collectionNames.length === 0; })) ? '' : 'none';
    }

    function syncManageLabelOptions_(maps) {
      if (!labelEl) return;
      const names = collectLabelNames_(maps); const current = manageLabel_;
      labelEl.innerHTML = '<option value="__all__">Semua Label</option><option value="__none__">Tanpa Label</option>' + names.map(function(name){ return `<option value="${escapeHtml_(name)}">🏷️ ${escapeHtml_(name)}</option>`; }).join('');
      const hasCurrent = Array.from(labelEl.options).some(function(o){ return o.value === current; });
      manageLabel_ = hasCurrent ? current : '__all__'; labelEl.value = manageLabel_;
      labelEl.style.display = (names.length || maps.some(function(m){ return getMapLabels_(m).length === 0; })) ? '' : 'none';
    }

    function applyManageSort_(maps, sort) {
      const result = Array.isArray(maps) ? maps.slice() : [];
      result.sort(function(a, b) {
        if (sort === 'newest' || sort === 'oldest') {
          const at = new Date(a && a.uploadedAt || 0).getTime() || 0;
          const bt = new Date(b && b.uploadedAt || 0).getTime() || 0;
          return sort === 'newest' ? (bt - at) : (at - bt);
        }
        const an = String(a && a.name || '').trim().toLocaleLowerCase();
        const bn = String(b && b.name || '').trim().toLocaleLowerCase();
        const cmp = an.localeCompare(bn, 'id', { sensitivity: 'base', numeric: true });
        return sort === 'name-desc' ? -cmp : cmp;
      });
      return result;
    }

    function formatStorageBytes_(bytes) {
      const n = Number(bytes);
      if (!Number.isFinite(n) || n < 0) return '—';
      if (n < 1024) return Math.round(n) + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
      return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
    }

    function storageStateLabel_(state) {
      return ({
        STORAGE_EMPTY: 'KOSONG',
        STORAGE_NORMAL: 'NORMAL',
        STORAGE_HIGH: 'TINGGI',
        STORAGE_CRITICAL: 'KRITIS',
        STORAGE_FULL: 'PENUH',
        STORAGE_UNKNOWN: 'TIDAK DIKETAHUI'
      })[state] || '—';
    }

    function storageStateStyle_(state) {
      if (state === 'STORAGE_FULL' || state === 'STORAGE_CRITICAL') return ['rgba(251,113,133,.14)', '#fb7185'];
      if (state === 'STORAGE_HIGH') return ['rgba(251,191,36,.13)', '#fbbf24'];
      if (state === 'STORAGE_NORMAL') return ['rgba(52,211,153,.13)', '#6ee7b7'];
      if (state === 'STORAGE_EMPTY') return ['rgba(96,165,250,.12)', '#93c5fd'];
      return ['rgba(255,255,255,.07)', 'rgba(255,255,255,.58)'];
    }

    function storageStateHint_(state) {
      if (state === 'STORAGE_NORMAL') return '';
      return ({
        STORAGE_EMPTY: 'Belum ada peta tersimpan.',
        STORAGE_HIGH: 'Kapasitas mulai tinggi. Pertimbangkan menghapus peta yang sudah tidak diperlukan.',
        STORAGE_CRITICAL: 'Kapasitas kritis. Kosongkan ruang sebelum menyimpan peta tambahan.',
        STORAGE_FULL: 'Penyimpanan browser penuh. Penyimpanan peta baru dapat gagal sampai ruang tersedia.',
        STORAGE_UNKNOWN: 'Status kapasitas browser tidak dapat dibaca saat ini.'
      })[state] || 'Status penyimpanan tidak tersedia.';
    }

    async function refreshStorageSummary_() {
      if (!storageEl) return;
      if (!window.MG1MapStorageCapability || typeof window.MG1MapStorageCapability.summary !== 'function') {
        storageEl.style.display = 'none';
        return;
      }
      storageEl.style.display = 'block';
      if (storageDetailEl) storageDetailEl.textContent = 'Membaca kapasitas...';
      try {
        const summary = await window.MG1MapStorageCapability.summary();
        const state = String(summary && summary.state || 'STORAGE_UNKNOWN');
        const ratio = Number(summary && summary.usageRatio);
        const ratioPct = Number.isFinite(ratio) && ratio >= 0 ? Math.min(100, ratio * 100) : null;
        const label = storageStateLabel_(state);
        const style = storageStateStyle_(state);
        if (storageStateEl) {
          storageStateEl.textContent = label;
          storageStateEl.style.background = style[0];
          storageStateEl.style.color = style[1];
        }
        if (storageBarEl) {
          storageBarEl.style.width = ratioPct == null ? '0%' : (ratioPct > 0 ? Math.max(2, ratioPct) : 0) + '%';
          storageBarEl.style.background = style[1];
        }
        if (storageDetailEl) {
          const count = Number(summary && summary.mapCount) || 0;
          const used = summary && summary.estimateAvailable ? formatStorageBytes_(summary.usageBytes) : 'tidak tersedia';
          storageDetailEl.textContent = count + ' peta · penggunaan browser ' + used;
        }
        if (storageMetaEl) {
          const payload = formatStorageBytes_(summary && summary.payloadBytes);
          const quota = summary && summary.estimateAvailable ? formatStorageBytes_(summary.quotaBytes) : '—';
          storageMetaEl.innerHTML = '<span>Payload peta: ' + escapeHtml_(payload) + '</span><span>Kuota: ' + escapeHtml_(quota) + '</span>';
        }
        const hint = storageStateHint_(state);
        if (storageHintEl) {
          storageHintEl.textContent = hint;
          storageHintEl.style.display = hint ? 'block' : 'none';
          storageHintEl.style.color = style[1];
        }
        console.log('[V24.5 S2.4] Storage warning hardening PASS', {state: state, mapCount: summary.mapCount, usageRatio: summary.usageRatio});
      } catch (e) {
        if (storageStateEl) {
          storageStateEl.textContent = 'ERROR';
          storageStateEl.style.background = 'rgba(251,113,133,.14)';
          storageStateEl.style.color = '#fb7185';
        }
        if (storageDetailEl) storageDetailEl.textContent = 'Ringkasan penyimpanan tidak tersedia';
        if (storageBarEl) storageBarEl.style.width = '0%';
        if (storageMetaEl) storageMetaEl.innerHTML = '<span>Payload peta: —</span><span>Kuota: —</span>';
        console.warn('[V24.5 S2.3] Storage Summary UI failed', e);
      }
    }

    async function refreshManageList_(query) {
      try {
        const maps = (window.MG1MapLibraryCapability && typeof window.MG1MapLibraryCapability.list === 'function')
          ? await window.MG1MapLibraryCapability.list({query: query || ''})
          : ((window.MG1MapLibrary && typeof window.MG1MapLibrary.getAll === 'function')
            ? await window.MG1MapLibrary.getAll()
            : (typeof backgroundMapsList !== 'undefined' ? backgroundMapsList : []));
        const total = (window.MG1MapLibraryCapability && typeof window.MG1MapLibraryCapability.list === 'function')
          ? await window.MG1MapLibraryCapability.list()
          : maps;
        const activeId = getManageActiveId_();
        syncManageLabelOptions_(maps);
        syncManageCollectionOptions_(maps);
        const filtered = applyManageCollection_(applyManageLabel_(applyManageFilter_(maps, activeId, manageFilter_), manageLabel_), manageCollection_);
        const sorted = applyManageSort_(filtered, manageSort_);
        const q = String(query || '').trim();
        const scopedLabel = manageFilter_ === 'active' ? 'aktif' : (manageFilter_ === 'inactive' ? 'tidak aktif' : 'peta');
        countEl.textContent = q || manageFilter_ !== 'all' || manageSort_ !== 'name-asc' || manageLabel_ !== '__all__' || manageCollection_ !== '__all__'
          ? `${sorted.length} dari ${total.length} ${scopedLabel}`
          : `${sorted.length} peta tersimpan`;
        renderManageList_(listEl, sorted, activeId);
        refreshStorageSummary_();
      } catch(e) {
        console.warn('[V24.3 MAP LIBRARY] manage list update fail', e);
      }
    }

    if(searchEl) searchEl.value = '';
    if(sortEl) sortEl.value = manageSort_;
    const scopeBtnOpen = el.querySelector('#mg1-manage-scope');
    if(scopeBtnOpen) { scopeBtnOpen.dataset.scope = 'all'; scopeBtnOpen.style.background='rgba(245,158,11,.13)'; scopeBtnOpen.style.borderColor='rgba(245,158,11,.28)'; scopeBtnOpen.style.color='#fbbf24'; }
    const optionsPanelOpen = el.querySelector('#mg1-manage-options-panel');
    if(optionsPanelOpen) optionsPanelOpen.style.display='none';
    syncManageFilterButtons_();
    refreshManageList_('');
    if(searchEl && !searchEl.__mg1Bound) {
      searchEl.__mg1Bound = true;
      searchEl.addEventListener('input', function() { refreshManageList_(this.value); });
    }
    if(filterEl && !filterEl.__mg1Bound) {
      filterEl.__mg1Bound = true;
      filterEl.addEventListener('click', function(ev) {
        const btn = ev.target.closest('[data-filter]');
        if(!btn) return;
        manageFilter_ = btn.dataset.filter || 'all';
        syncManageFilterButtons_();
        refreshManageList_(searchEl ? searchEl.value : '');
      });
    }
    if(sortEl && !sortEl.__mg1Bound) {
      sortEl.__mg1Bound = true;
      sortEl.addEventListener('change', function() {
        manageSort_ = this.value || 'name-asc';
        refreshManageList_(searchEl ? searchEl.value : '');
      });
    }
    if(labelEl && !labelEl.__mg1Bound) {
      labelEl.__mg1Bound = true;
      labelEl.addEventListener('change', function() {
        manageLabel_ = this.value || '__all__';
        refreshManageList_(searchEl ? searchEl.value : '');
      });
    }
    if(collectionEl && !collectionEl.__mg1Bound) {
      collectionEl.__mg1Bound = true;
      collectionEl.addEventListener('change', function() {
        manageCollection_ = this.value || '__all__';
        refreshManageList_(searchEl ? searchEl.value : '');
      });
    }
    if(listEl && !listEl.__mg1InfoBound) {
      listEl.__mg1InfoBound = true;
      listEl.addEventListener('click', async function(ev) {
        const menuBtn = ev.target.closest('[data-map-menu]');
        if(!menuBtn) return;
        const id = menuBtn.getAttribute('data-map-menu');
        try {
          const maps = (window.MG1MapLibrary && typeof window.MG1MapLibrary.getAll === 'function') ? await window.MG1MapLibrary.getAll() : [];
          const entry = maps.find(function(m){ return m && String(m.id) === String(id); });
          if (entry) showMapActionSheet_(entry, getManageActiveId_(), async function(){ await refreshManageList_(searchEl ? searchEl.value : ''); });
        } catch (e) { console.warn('[V24.3 MAP LIBRARY] map action menu failed', e); }
      });
    }

    const scopeBtn = el.querySelector('#mg1-manage-scope');
    if(scopeBtn && !scopeBtn.__mg1Bound) {
      scopeBtn.__mg1Bound = true;
      scopeBtn.addEventListener('click', function() {
        const active = scopeBtn.dataset.scope === 'active';
        scopeBtn.dataset.scope = active ? 'all' : 'active';
        manageFilter_ = active ? 'all' : 'active';
        scopeBtn.style.background = active ? 'rgba(245,158,11,.13)' : 'rgba(16,185,129,.13)';
        scopeBtn.style.borderColor = active ? 'rgba(245,158,11,.28)' : 'rgba(52,211,153,.30)';
        scopeBtn.style.color = active ? '#fbbf24' : '#6ee7b7';
        refreshManageList_(searchEl ? searchEl.value : '');
      });
    }

    const optionsBtn = el.querySelector('#mg1-manage-options');
    const optionsPanel = el.querySelector('#mg1-manage-options-panel');
    if(optionsBtn && optionsPanel && !optionsBtn.__mg1Bound) {
      optionsBtn.__mg1Bound = true;
      optionsBtn.addEventListener('click', function(){
        optionsPanel.style.display = optionsPanel.style.display === 'none' ? 'block' : 'none';
      });
    }

    el.style.display = 'block';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      });
    });

    // Canonical V24.3 owns this modal; never enable the legacy renderMapManagePanel_() path.
    // Keep the legacy flag false so a later global render() cannot resurrect old UI.
    if(typeof mapManagePanelOpen !== 'undefined') mapManagePanelOpen = false;
  }

  function closeManageModal() {
    if(!manageModalEl) return;
    const backdrop = manageModalEl.querySelector('#mg1-manage-backdrop');
    const panel = manageModalEl.querySelector('#mg1-manage-panel');
    if(backdrop) backdrop.style.opacity = '0';
    if(panel) panel.style.transform = 'translateY(100%)';
    setTimeout(() => {
      manageModalEl.style.display = 'none';
      if(typeof mapManagePanelOpen !== 'undefined') mapManagePanelOpen = false;
    }, 300);
  }

  // Dipakai save flow V22 agar daftar peta langsung tampil tanpa render() global.
  window._v23OpenManageModal = openManageModal;

  // Isolated upload modal sudah ada di V19, tapi kita pastikan tidak pakai render()
  function openUploadModal() {
    // Jika V19 modal ada, pakai itu
    if(window.MG1NewMapModal && typeof window.MG1NewMapModal.open === 'function') {
      window.MG1NewMapModal.open();
      return;
    }
    // Fallback: pakai original tapi tanpa flicker double
    // Tutup manage dulu baru buka upload
    closeManageModal();
    setTimeout(() => {
      if(typeof mapUploadFormOpen !== 'undefined') {
        mapUploadFormOpen = true;
        // JANGAN render() - langsung buat modal isolated simple
        // Untuk sekarang fallback ke original jika V19 tidak ada
        if(origOpenUpload) {
          // Override render di original untuk tidak rebuild #app? 
          // Kita set flag untuk skip render sekali
          window._v23SkipNextRender = true;
          origOpenUpload();
        }
      }
    }, 200);
  }

  function closeUploadModal() {
    if(window.MG1NewMapModal && typeof window.MG1NewMapModal.close === 'function') {
      window.MG1NewMapModal.close();
      return;
    }
    if(typeof mapUploadFormOpen !== 'undefined') mapUploadFormOpen = false;
    // Jangan render() - tutup via DOM saja jika ada
    const v19Root = document.getElementById('mg1-new-map-modal-root');
    if(v19Root) {
      const backdrop = document.getElementById('mg1-new-modal-backdrop');
      const panel = document.getElementById('mg1-new-modal-panel');
      if(backdrop) backdrop.style.opacity = '0';
      if(panel) { panel.style.opacity = '0'; panel.style.transform = 'translate(-50%,-44%) scale(0.96)'; }
      setTimeout(() => { v19Root.style.display = 'none'; }, 260);
    } else {
      if(origCloseUpload) {
        window._v23SkipNextRender = true;
        origCloseUpload();
      }
    }
  }

  // Override global functions - NO RENDER
  window.openMapManagePanel_ = function() {
    console.log('[V23] openMapManagePanel_ overridden - no render()');
    openManageModal();
  };

  window.closeMapManagePanel_ = function() {
    console.log('[V23] closeMapManagePanel_ overridden - no render()');
    closeManageModal();
    // Juga tutup upload jika ada
    if(typeof mapUploadFormOpen !== 'undefined' && mapUploadFormOpen) {
      mapUploadFormOpen = false;
    }
  };

  window.openMapUploadForm_ = function() {
    console.log('[V23] openMapUploadForm_ overridden - no render(), use V19 isolated modal');
    // Tutup manage dulu biar tidak double modal
    closeManageModal();
    setTimeout(() => openUploadModal(), 330);
  };

  window.closeMapUploadForm_ = function() {
    console.log('[V23] closeMapUploadForm_ overridden - no render()');
    closeUploadModal();
  };

  // Helper untuk activate/delete tanpa render() global - pakai atomic swap
  window._v23ActivateMap = async function(id) {
    closeManageModal();
    setTimeout(async () => {
      try {
        activeBackgroundMapId = id;
        mapZoom = 1.25;
        if(typeof mapViewportState_ !== 'undefined') mapViewportState_.centerNative = null;
        try { localStorage.setItem('mg1_active_bg_map_id', id); } catch(_){}
        
        // Atomic swap tanpa render()
        const vp = document.getElementById('mg1-map-viewport');
        if(vp && typeof window.executeAtomicSurfaceSwap_ === 'function' && typeof window.buildNewMapSurfaceV22 === 'function') {
          await window.executeAtomicSurfaceSwap_(vp, window.buildNewMapSurfaceV22);
        } else if(typeof window.updateMapViewportDirectNoRender_ === 'function') {
          window.updateMapViewportDirectNoRender_();
        } else if(typeof render === 'function') {
          render();
        }
      } catch(e) {
        console.error('[V23] activate fail', e);
        if(typeof render === 'function') render();
      }
    }, 200);
  };

  function showMapDeleteConfirmV2_() {
    return new Promise(function(resolve) {
      const old = document.getElementById('mg1-map-delete-confirm-v2');
      if (old) old.remove();

      const root = document.createElement('div');
      root.id = 'mg1-map-delete-confirm-v2';
      root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
      root.innerHTML = `
        <div style="width:min(100%,390px);background:#0e1933;border:1px solid rgba(255,255,255,.10);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.45);overflow:hidden;">
          <div style="padding:18px 18px 14px;">
            <div style="font-size:15px;font-weight:800;color:#fff;">Hapus Data Map?</div>
            <div style="margin-top:6px;font-size:10px;line-height:1.5;color:rgba(255,255,255,.42);">Data peta akan dihapus dari perangkat ini.</div>
          </div>
          <div style="display:flex;gap:10px;padding:0 18px 18px;">
            <button type="button" id="mg1-map-delete-cancel-v2" style="flex:1;height:42px;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10);color:rgba(255,255,255,.78);font-size:12px;font-weight:700;">Batal</button>
            <button type="button" id="mg1-map-delete-ok-v2" style="flex:1;height:42px;border-radius:12px;background:#e11d48;border:1px solid rgba(255,255,255,.06);color:#fff;font-size:12px;font-weight:800;">Oke</button>
          </div>
        </div>`;
      document.body.appendChild(root);

      const finish = function(result) {
        if (root.parentNode) root.remove();
        resolve(result);
      };
      root.querySelector('#mg1-map-delete-cancel-v2').onclick = function() { finish(false); };
      root.querySelector('#mg1-map-delete-ok-v2').onclick = function() { finish(true); };
      root.onclick = function(e) { if (e.target === root) finish(false); };
    });
  }

  window._v23DeleteMap = async function(id) {
    if(!(await showMapDeleteConfirmV2_())) return;
    try {
      if(typeof dbDeleteMap_ === 'function') await dbDeleteMap_(id);
      if(activeBackgroundMapId === id) {
        activeBackgroundMapId = null;
        try { localStorage.removeItem('mg1_active_bg_map_id'); } catch(_){}
      }
      if(typeof loadBackgroundMapsFromDb_ === 'function') await loadBackgroundMapsFromDb_();
      // Refresh manage modal list tanpa render()
      openManageModal();
      // Jika peta aktif dihapus, update viewport
      if(!activeBackgroundMapId) {
        const vp = document.getElementById('mg1-map-viewport');
        if(vp && typeof window.buildNewMapSurfaceV22 === 'function' && typeof window.executeAtomicSurfaceSwap_ === 'function') {
          await window.executeAtomicSurfaceSwap_(vp, window.buildNewMapSurfaceV22);
        }
      }
    } catch(e) {
      console.error('[V23] delete fail', e);
    }
  };

  // Intercept render() untuk skip jika flag _v23SkipNextRender
  if(typeof window.render === 'function' && !window._v23RenderPatched) {
    const origRender = window.render;
    window.render = function() {
      if(window._v23SkipNextRender) {
        console.log('[V23] Skipping render() to prevent modal flicker');
        window._v23SkipNextRender = false;
        return;
      }
      return origRender.apply(this, arguments);
    };
    window._v23RenderPatched = true;
  }

  // Auto patch tombol-tombol lama
  function patchOldButtons() {
    const check = setInterval(() => {
      const btns = document.querySelectorAll('button, [onclick*="openMapManagePanel"], [onclick*="openMapUploadForm"]');
      btns.forEach(b => {
        const onclick = b.getAttribute('onclick') || '';
        if(onclick.includes('openMapManagePanel_') && !b.__v23Patched) {
          b.__v23Patched = true;
          b.onclick = (e) => { e.preventDefault(); openManageModal(); };
        }
        if(onclick.includes('openMapUploadForm_') && !b.__v23Patched) {
          b.__v23Patched = true;
          b.onclick = (e) => { e.preventDefault(); openUploadModal(); };
        }
      });
    }, 1000);
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchOldButtons);
  } else {
    patchOldButtons();
  }

  console.log('[V23] Ready - All map modals isolated, no render() flicker');
})();
(function(){
  'use strict';
  console.log('[V24.1] TRUE INSTANT SAVE loading');

  function getSaveState_(){
    const f = typeof mapUploadFormState !== 'undefined' ? mapUploadFormState : null;
    const modalState = window.MG1NewMapModal ? window.MG1NewMapModal._state : null;
    const isNewModal = !!(modalState && modalState.open);
    if(isNewModal) return { state: modalState, isNewModal };
    if(!f) return { state:null, isNewModal:false };
    return {
      isNewModal:false,
      state:{
        file: typeof mapUploadRuntimeFile_ !== 'undefined' ? mapUploadRuntimeFile_ : (window._v19RuntimeFile || null),
        name: f.name,
        fileDataUrl: f.fileDataUrl,
        geoReference: f.geoReference,
        tilePyramid: f.tilePyramid,
        cornerTL: f.geoReference?.extent ? f.geoReference.extent.cornerTL : (f.tlTimur ? {timur:parseFloat(f.tlTimur), utara:parseFloat(f.tlUtara)} : null),
        cornerBR: f.geoReference?.extent ? f.geoReference.extent.cornerBR : (f.brTimur ? {timur:parseFloat(f.brTimur), utara:parseFloat(f.brUtara)} : null)
      }
    };
  }

  function closeUploadModalInstant_(isNewModal, modalState){
    const root = document.getElementById('mg1-new-map-modal-root');
    const backdrop = document.getElementById('mg1-new-modal-backdrop');
    const panel = document.getElementById('mg1-new-modal-panel');
    if(root && isNewModal){
      if(backdrop) backdrop.style.opacity='0';
      if(panel){ panel.style.opacity='0'; panel.style.transform='translate(-50%,-44%) scale(0.96)'; }
      setTimeout(()=>{ root.style.display='none'; if(modalState) modalState.open=false; }, 200);
    } else {
      if(typeof mapUploadFormOpen !== 'undefined') mapUploadFormOpen=false;
      if(typeof mapManagePanelOpen !== 'undefined') mapManagePanelOpen=false;
    }
  }

  function buildInstantPreviewSurface_(mapEntry){
    if(typeof renderMineGridSvg !== 'function' || typeof buildMapData !== 'function') return null;
    const idx = Array.isArray(backgroundMapsList) ? backgroundMapsList.findIndex(m=>m && m.id===mapEntry.id) : -1;
    const previous = idx >= 0 ? backgroundMapsList[idx] : null;
    // Force the existing renderer to use the single full image for the first paint.
    // This avoids building/preloading the 25-level pyramid before the user sees the map.
    if(idx >= 0) backgroundMapsList[idx] = {...mapEntry, tilePyramid:null};
    else if(Array.isArray(backgroundMapsList)) backgroundMapsList.push({...mapEntry, tilePyramid:null});
    let built='';
    try { built = renderMineGridSvg(buildMapData()); } finally {
      if(idx >= 0) backgroundMapsList[idx] = previous;
      else if(Array.isArray(backgroundMapsList)) backgroundMapsList.pop();
    }
    const temp=document.createElement('div');
    temp.innerHTML=String(built||'').trim();
    const svg=temp.firstElementChild;
    if(!svg) return null;
    svg.classList.add('lithosite-map-surface','lithosite-map-surface--instant');
    svg.style.visibility='hidden';
    svg.style.pointerEvents='none';
    svg.style.position='absolute';
    svg.style.inset='0';
    svg.style.opacity='1';
    return svg;
  }

  function showInstantPreview_(mapEntry){
    const vp=document.getElementById('mg1-map-viewport');
    if(!vp) return Promise.resolve(false);
    let svg;
    try { svg=buildInstantPreviewSurface_(mapEntry); } catch(e){ console.warn('[V24.1] preview build failed',e); return Promise.resolve(false); }
    if(!svg) return Promise.resolve(false);
    vp.appendChild(svg);
    const href=svg.querySelector('image')?.getAttribute('href') || svg.querySelector('image')?.getAttribute('xlink:href') || '';
    if(!href){
      svg.style.visibility=''; svg.style.pointerEvents='';
      const old=vp.querySelector('svg[data-map-gesture="true"]:not(.lithosite-map-surface--instant)');
      if(old) old.remove();
      return Promise.resolve(true);
    }
    return new Promise(resolve=>{
      let settled=false;
      const finish=(ok)=>{
        if(settled) return; settled=true;
        if(ok){
          svg.style.visibility=''; svg.style.pointerEvents='';
          const old=vp.querySelector('svg[data-map-gesture="true"]:not(.lithosite-map-surface--instant)');
          if(old) old.remove();
          svg.classList.remove('lithosite-map-surface--instant');
          requestAnimationFrame(()=>{ try{ if(typeof ensureMapContextBlocker_==='function') ensureMapContextBlocker_(); }catch(_){} });
        } else {
          try{svg.remove();}catch(_){}
        }
        resolve(!!ok);
      };
      const loader=new Image();
      loader.onload=()=>finish(true);
      loader.onerror=()=>finish(false);
      loader.src=href;
      setTimeout(()=>finish(false),1200);
    });
  }

  function persistMapVersionAware_(entry){
    return new Promise(async (resolve,reject)=>{
      try {
        if(!entry || !entry.id) return reject(new Error('entry unavailable'));
        const db=await openMapDb_();
        const tx=db.transaction(MAP_DB_STORE_,'readwrite');
        const store=tx.objectStore(MAP_DB_STORE_);
        let skipped=false;
        const req=store.get(entry.id);
        req.onsuccess=()=>{
          const existing=req.result;
          const curVer=existing && existing.tilePyramid && Number(existing.tilePyramid.__persistVersion)||0;
          const newVer=entry && entry.tilePyramid && Number(entry.tilePyramid.__persistVersion)||0;
          if(newVer < curVer){
            skipped=true;
            return;
          }
          store.put(entry);
        };
        req.onerror=()=>{ try{store.put(entry);}catch(_){} };
        tx.oncomplete=()=>{
          try{db.close();}catch(_){}
          resolve(skipped ? {ok:true,skipped:true,reason:'version-skipped fallback'} : {ok:true});
        };
        tx.onerror=()=>{try{db.close();}catch(_){} reject(tx.error||new Error('version-aware fallback failed'));};
        tx.onabort=()=>{try{db.close();}catch(_){} reject(tx.error||new Error('version-aware fallback aborted'));};
      } catch(e) { reject(e); }
    });
  }

  function persistMapInWorker_(entry){
    return new Promise((resolve,reject)=>{
      if(typeof Worker==='undefined' || typeof Blob==='undefined' || typeof URL==='undefined' || !URL.createObjectURL){
        reject(new Error('Worker tidak tersedia')); return;
      }
      const workerCode=`
        self.onmessage=function(ev){
          const d=ev.data||{}; const req=indexedDB.open(d.dbName,2);
          req.onupgradeneeded=function(){const db=req.result; if(!db.objectStoreNames.contains(d.storeName)) db.createObjectStore(d.storeName,{keyPath:'id'}); if(!db.objectStoreNames.contains('kmlOverlays')) db.createObjectStore('kmlOverlays',{keyPath:'id'});};
          req.onerror=function(){self.postMessage({ok:false,error:String(req.error&&req.error.message||req.error||'open failed')});};
          req.onsuccess=function(){
            const db=req.result;
            try {
              // Read + version check + put must share ONE readwrite transaction.
              // This closes the T0-T3 race where a stale worker read could overwrite
              // a newer runtime persistence that committed between separate transactions.
              const tx=db.transaction(d.storeName,'readwrite');
              const store=tx.objectStore(d.storeName);
              let skipped=false;
              const getReq=store.get(d.entry.id);
              getReq.onsuccess=function(){
                const existing=getReq.result;
                const curVer=existing && existing.tilePyramid && Number(existing.tilePyramid.__persistVersion)||0;
                const newVer=d.entry && d.entry.tilePyramid && Number(d.entry.tilePyramid.__persistVersion)||0;
                if(newVer < curVer){
                  skipped=true;
                  return;
                }
                store.put(d.entry);
              };
              getReq.onerror=function(){
                // Preserve previous fallback behavior if the version read itself fails.
                try{store.put(d.entry);}catch(_){}
              };
              tx.oncomplete=function(){
                try{db.close();}catch(_){}
                if(skipped){
                  self.postMessage({ok:true, skipped:true, reason:'version-skipped V24.1 worker'});
                } else {
                  self.postMessage({ok:true});
                }
              };
              tx.onerror=function(){try{db.close();}catch(_){} self.postMessage({ok:false,error:String(tx.error&&tx.error.message||tx.error||'put failed')});};
              tx.onabort=tx.onerror;
            }catch(e){try{db.close();}catch(_){} self.postMessage({ok:false,error:String(e&&e.message||e)});}
          };
        };
      `;
      const blob=new Blob([workerCode],{type:'application/javascript'});
      const url=URL.createObjectURL(blob);
      const worker=new Worker(url);
      const cleanup=()=>{try{worker.terminate();}catch(_){} try{URL.revokeObjectURL(url);}catch(_){} };
      worker.onmessage=ev=>{const r=ev.data||{}; cleanup(); if(r.skipped){ resolve(true); return; } r.ok?resolve(true):reject(new Error(r.error||'worker save failed'));};
      worker.onerror=ev=>{cleanup(); reject(new Error(ev&&ev.message||'worker error'));};
      try{worker.postMessage({dbName:'mg1_background_maps',storeName:'maps',entry:entry});}
      catch(e){cleanup(); reject(e);}
    });
  }

  function scheduleBackgroundPersistence_(entry){
    const run=()=>{
      console.log('[V24.1] Background persistence starting - version-aware + clone-safe');
      try {
        let entryToPersist = entry;
        // === FIX race T0-T3: ambil entry terbaru dari RAM, bukan closure lama ===
        try {
          if (typeof backgroundMapsList !== 'undefined' && Array.isArray(backgroundMapsList)) {
            const latest = backgroundMapsList.find(m => m && String(m.id) === String(entry.id));
            if (latest) {
              const curVer = Number(latest.tilePyramid && latest.tilePyramid.__persistVersion) || 0;
              const oldVer = Number(entry.tilePyramid && entry.tilePyramid.__persistVersion) || 0;
              if (curVer > oldVer) {
                console.log('[V24.1] Using latest entry from RAM, version', oldVer, '->', curVer);
                entryToPersist = latest;
              }
              // Jika latest sudah lebih baru, jangan overwrite dengan versi lama
              if (curVer > 0 && oldVer > 0 && oldVer < curVer && latest !== entry) {
                console.log('[V24.1] Skipped - newer version in RAM exists', curVer, 'vs', oldVer);
                return;
              }
            }
          }
        } catch(_) {}
        // Clone-safe sanitize
        try {
          if (entryToPersist && entryToPersist.tilePyramid && typeof sanitizePyramidForStorage_ === 'function') {
            const cleanPyramid = sanitizePyramidForStorage_(entryToPersist.tilePyramid);
            entryToPersist = { ...entryToPersist, tilePyramid: cleanPyramid };
          }
        } catch(_) {}
        persistMapInWorker_(entryToPersist).then(()=>{
          console.log('[V24.1] Background IndexedDB save DONE');
          entry.__v24Persisted=true;
        }).catch(err=>{
          console.warn('[V24.1] Worker persistence failed, fallback idle DB save:',err);
          const fallback=()=>{
            try {
              let safe = entryToPersist;
              try {
                if (safe && safe.tilePyramid && typeof sanitizePyramidForStorage_ === 'function') {
                  safe = { ...safe, tilePyramid: sanitizePyramidForStorage_(safe.tilePyramid) };
                }
              } catch(_) {}
              // Final version check before fallback
              try {
                if (typeof backgroundMapsList !== 'undefined' && Array.isArray(backgroundMapsList)) {
                  const latest = backgroundMapsList.find(m => m && String(m.id) === String(safe.id));
                  if (latest) {
                    const curVer = Number(latest.tilePyramid && latest.tilePyramid.__persistVersion) || 0;
                    const newVer = Number(safe.tilePyramid && safe.tilePyramid.__persistVersion) || 0;
                    if (curVer > 0 && newVer > 0 && newVer < curVer) {
                      console.log('[V24.1 fallback] Skipped - newer version exists', curVer, 'vs', newVer);
                      return;
                    }
                  }
                }
              } catch(_) {}
              if(typeof persistMapVersionAware_==='function') persistMapVersionAware_(safe).then(r=>{
                if(r&&r.skipped) console.log('[V24.1 fallback] Skipped stale DB write');
              }).catch(e=>console.warn('[V24.1] fallback DB save failed',e));
            } catch(e2) { console.warn('[V24.1] fallback sanitize failed', e2); }
          };
          if(typeof requestIdleCallback==='function') requestIdleCallback(fallback,{timeout:10000}); else setTimeout(fallback,1000);
        });
      } catch(e) { console.warn('[V24.1] schedule failed', e); }
    };
    if(typeof requestIdleCallback==='function') requestIdleCallback(run,{timeout:5000});
    else setTimeout(run,1500);
  }

  window.submitMapUpload_InstantV24_1 = async function(){
    if(window.__v24SaveInFlight) return;
    const pack=getSaveState_();
    const state=pack.state, isNewModal=pack.isNewModal;
    if(!state) return;
    if(!state.fileDataUrl || !String(state.name||'').trim()) return;
    window.__v24SaveInFlight=true;

    const id='bgmap_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
    const tilePyramid=state.tilePyramid && typeof state.tilePyramid==='object' ? {...state.tilePyramid,runtimeMapId:id} : null;
    const entry={
      id,
      name:String(state.name).trim(),
      imageDataUrl:state.fileDataUrl,
      cornerTL:state.geoReference?.extent ? {...state.geoReference.extent.cornerTL} : state.cornerTL,
      cornerBR:state.geoReference?.extent ? {...state.geoReference.extent.cornerBR} : state.cornerBR,
      geoReference:state.geoReference||null,
      tilePyramid,
      uploadedAt:new Date().toISOString(),
      uploadedBy:(typeof sessionInfo!=='undefined' && sessionInfo)?sessionInfo.userName:'unknown'
    };

    if(isNewModal && pack.state){
      pack.state.busy=false;
      const btn=document.getElementById('mg1-new-modal-save'); if(btn){btn.textContent='Menyimpan...';btn.style.opacity='0.7';}
      const st=document.getElementById('mg1-new-modal-status'); if(st) st.textContent='Peta diterapkan. Menyimpan data di belakang...';
    }

    // 1) RAM commit first — this is the user-visible save.
    if(Array.isArray(backgroundMapsList)) backgroundMapsList.push(entry);
    activeBackgroundMapId=id;
    mapZoom=1.25;
    if(typeof compassRotationOffsetDeg_!=='undefined') compassRotationOffsetDeg_=0;
    if(typeof mapViewportState_!=='undefined' && mapViewportState_) mapViewportState_.centerNative=null;
    try{localStorage.setItem('mg1_active_bg_map_id',id);}catch(_){ }

    // 2) Close upload modal immediately; never wait for IndexedDB.
    closeUploadModalInstant_(isNewModal, pack.state);

    // 3) Show the new map from the full image as soon as it decodes; old map stays until then.
    showInstantPreview_(entry).catch(e=>console.warn('[V24.1] instant preview error',e));

    // 4) Upgrade to pyramid atomically in the background; never await it here.
    setTimeout(()=>{
      try{
        const vp=document.getElementById('mg1-map-viewport');
        if(vp && typeof executeAtomicSurfaceSwap_==='function' && typeof buildNewMapSurfaceV22==='function'){
          executeAtomicSurfaceSwap_(vp,buildNewMapSurfaceV22).then(ok=>console.log('[V24.1] detail atomic swap',ok?'READY':'CANCELLED')).catch(e=>console.warn('[V24.1] detail swap failed; current map retained',e));
        }
      }catch(e){console.warn('[V24.1] detail swap start failed',e);}
    },50);

    // 5) Manage list appears quickly from RAM; no DB reload and no global render.
    setTimeout(()=>{
      try{
        if(typeof window._v23OpenManageModal==='function') window._v23OpenManageModal();
        else if(typeof window.openMapManagePanel_==='function') window.openMapManagePanel_();
      }catch(e){console.warn('[V24.1] manage modal failed',e);}
    },230);

    // 6) Heavy IndexedDB persistence is deliberately decoupled from the click path.
    scheduleBackgroundPersistence_(entry);

    // UI busy state can be cleared immediately because save-to-RAM already committed.
    if(typeof mapUploadBusy!=='undefined') mapUploadBusy=false;
    if(isNewModal && pack.state) pack.state.busy=false;
    window.__v24SaveInFlight=false;
  };

  window.submitMapUpload_ = window.submitMapUpload_InstantV24_1;
  window.submitMapUpload_NoRender_ = window.submitMapUpload_InstantV24_1;
  window.submitMapUpload_Atomic_ = window.submitMapUpload_InstantV24_1;

  const bind=()=>{
    const b=document.getElementById('mg1-new-modal-save');
    if(!b) return false;
    b.type='button'; b.onclick=window.submitMapUpload_InstantV24_1; b.__v24SaveBound=true; return true;
  };
  bind();
  const iv=setInterval(()=>{ if(bind()) clearInterval(iv); },250);
  console.log('[V24.1] Ready - RAM-first save, worker persistence, instant preview, V22 detail upgrade');
})();
