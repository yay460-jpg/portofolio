/* V22 ATOMIC SWAP FIXED - SVGImageElement vs HTMLImageElement
 * FIX: SVG <image> tidak punya .decode(), harus pakai new Image() loader dari href
 * + Cancel swap saat timeout, tahan map lama, jangan tampilkan incomplete frame
 * Implementasi persis koreksi user untuk arsitektur V17.1
 */

(function(){
  console.log('[V22 ATOMIC FIXED] Loading corrected SVG preloader');

  /**
   * 1. SVG Image Preloader & Decoder - FIXED
   * Browser DOM API bedakan HTMLImageElement (<img>) vs SVGImageElement (<image>)
   * SVGImageElement tidak punya .decode(), jadi pakai new Image() sebagai loader
   */
  function preloadSvgImages_(svgElement, timeoutMs = 3000) {
    const svgImages = Array.from(svgElement.querySelectorAll('image'));
    if (svgImages.length === 0) {
      console.log('[V22] No SVG images to preload');
      return Promise.resolve(true);
    }

    console.log(`[V22] Preloading ${svgImages.length} SVG images via new Image() loader`);

    const decodePromises = svgImages.map((svgImg, idx) => {
      const href = svgImg.getAttribute('href') || svgImg.getAttribute('xlink:href') || svgImg.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (!href) {
        console.log(`[V22] Tile ${idx} no href, skip`);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        const loader = new Image();
        
        // Set src dulu baru cek complete, untuk trigger load
        loader.src = href;

        if (loader.complete) {
          // Sudah di cache, langsung decode jika ada
          if (typeof loader.decode === 'function') {
            loader.decode().then(() => {
              // console.log(`[V22] Tile ${idx} decoded (cached)`);
              resolve(true);
            }).catch(() => {
              // decode gagal tapi image sudah complete, tetap anggap ready
              resolve(true);
            });
          } else {
            resolve(true);
          }
        } else {
          loader.onload = () => {
            if (typeof loader.decode === 'function') {
              loader.decode().then(() => {
                // console.log(`[V22] Tile ${idx} decoded (onload)`);
                resolve(true);
              }).catch(() => {
                resolve(true);
              });
            } else {
              resolve(true);
            }
          };
          loader.onerror = () => {
            console.warn(`[V22] Tile ${idx} failed to load: ${href.slice(0,60)}...`);
            resolve(false); // false = ada yang gagal, tapi jangan block semua
          };
        }
      });
    });

    const timerGuard = new Promise(resolve => setTimeout(() => {
      console.warn(`[V22] Preload timeout ${timeoutMs}ms`);
      resolve('TIMEOUT');
    }, timeoutMs));

    return Promise.race([Promise.all(decodePromises), timerGuard]).then(result => {
      if(result === 'TIMEOUT') {
        console.warn('[V22] Preload TIMEOUT - akan batalkan swap, tahan map lama');
        return false; // false = timeout, jangan swap
      }
      // result adalah array boolean dari tiap tile
      const allOk = Array.isArray(result) ? result.every(r => r === true) : true;
      console.log(`[V22] Preload result: ${allOk ? 'ALL READY' : 'SOME FAILED'} - ${result.length} tiles`);
      return allOk;
    });
  }

  /**
   * 2. Atomic Surface Swap (Non-Destructive) - FIXED
   * Swap HANYA jika surface baru benar-benar siap, kalau timeout tahan map lama
   */
  async function executeAtomicSurfaceSwap_(containerEl, buildNewSurfaceFn) {
    if(!containerEl) {
      console.warn('[V22] containerEl null');
      return false;
    }

    const oldSurface = containerEl.querySelector('.lithosite-map-surface') || containerEl.querySelector('svg[data-map-gesture="true"]');
    console.log(`[V22] Old surface: ${oldSurface ? 'found' : 'not found (0 peta case)'}`);

    // 1. Buat surface baru dalam keadaan detached/hidden
    let newSurface;
    try {
      const built = buildNewSurfaceFn();
      let svgEl;
      if(typeof built === 'string') {
        const temp = document.createElement('div');
        temp.innerHTML = built.trim();
        svgEl = temp.firstElementChild;
      } else {
        svgEl = built;
      }

      if(!svgEl) throw new Error('buildNewSurfaceFn return null');

      svgEl.classList.add('lithosite-map-surface', 'lithosite-map-surface--new');
      svgEl.style.visibility = 'hidden';
      svgEl.style.pointerEvents = 'none';
      svgEl.style.position = 'absolute';
      svgEl.style.inset = '0';
      svgEl.style.opacity = '0';

      containerEl.appendChild(svgEl);
      newSurface = svgEl;
      
      console.log('[V22] New surface appended hidden');

    } catch(err) {
      console.error('[V22] Build new surface failed', err);
      return false;
    }

    // 2. Preload & hardware decode seluruh tile/image
    console.log('[V22] Starting preload with 3000ms timeout');
    const isFullyReady = await preloadSvgImages_(newSurface, 3000);

    // 3. Eksekusi swap HANYA jika surface baru benar-benar siap
    if (isFullyReady) {
      console.log('[V22] Swap EXECUTED - surface ready');
      newSurface.style.visibility = '';
      newSurface.style.pointerEvents = '';
      newSurface.style.position = '';
      newSurface.style.inset = '';
      newSurface.style.opacity = '1';
      newSurface.classList.remove('lithosite-map-surface--new');
      
      if (oldSurface && oldSurface.parentNode === containerEl) {
        // Atomic: old remove, new sudah ada dan visible
        oldSurface.remove();
      } else {
        // Tidak ada old surface, bersihkan child lain
        Array.from(containerEl.children).forEach(child => {
          if(child !== newSurface) {
            try { child.remove(); } catch(_){}
          }
        });
      }

      // Re-attach handlers
      requestAnimationFrame(() => {
        try {
          if(typeof ensureMapContextBlocker_ === 'function') ensureMapContextBlocker_();
          if(typeof blockMapContextMenu_ === 'function') blockMapContextMenu_();
        } catch(_){}
      });

      return true;
    }

    // 4. Recovery jika timeout: Batalkan surface baru, tahan surface lama
    console.warn('[V22] Swap CANCELLED - preload timeout, old map dipertahankan');
    try {
      newSurface.remove();
    } catch(_){}
    return false;
  }

  // Expose
  window.preloadSvgImages_ = preloadSvgImages_;
  window.executeAtomicSurfaceSwap_ = executeAtomicSurfaceSwap_;

  // Helper build surface
  function buildNewMapSurfaceV22() {
    try {
      let points = [];
      if(typeof buildMapData === 'function') points = buildMapData();
      if(typeof renderMineGridSvg === 'function') {
        return renderMineGridSvg(points);
      }
      throw new Error('renderMineGridSvg missing');
    } catch(e) {
      console.error('[V22] buildNewMapSurface error', e);
      throw e;
    }
  }

  window.buildNewMapSurfaceV22 = buildNewMapSurfaceV22;

  // Patch save flow untuk pakai atomic fixed
  function patchToV22() {
    window.submitMapUpload_V22_ = async function() {
      const f = typeof mapUploadFormState !== 'undefined' ? mapUploadFormState : null;
      const modalState = window.MG1NewMapModal ? window.MG1NewMapModal._state : null;
      const isNewModal = modalState && modalState.open;

      let state = null;
      if(isNewModal) {
        state = modalState;
      } else if(f) {
        state = {
          file: typeof mapUploadRuntimeFile_ !== 'undefined' ? mapUploadRuntimeFile_ : (window._v19RuntimeFile||null),
          fileName: f.fileName,
          name: f.name,
          fileDataUrl: f.fileDataUrl,
          geoReference: f.geoReference,
          tilePyramid: f.tilePyramid,
          cornerTL: f.geoReference?.extent ? f.geoReference.extent.cornerTL : (f.tlTimur ? {timur: parseFloat(f.tlTimur), utara: parseFloat(f.tlUtara)} : null),
          cornerBR: f.geoReference?.extent ? f.geoReference.extent.cornerBR : (f.brTimur ? {timur: parseFloat(f.brTimur), utara: parseFloat(f.brUtara)} : null)
        };
      } else return;

      if(!state.fileDataUrl || !state.name.trim()) return;

      if(isNewModal) {
        modalState.busy = true;
        const saveBtn = document.getElementById('mg1-new-modal-save');
        const statusEl = document.getElementById('mg1-new-modal-status');
        if(saveBtn) { saveBtn.textContent = 'Menyimpan...'; saveBtn.style.opacity = '0.7'; }
        if(statusEl) statusEl.textContent = 'Menyimpan ke HP...';
      } else {
        if(typeof mapUploadBusy !== 'undefined') mapUploadBusy = true;
        try { if(typeof paintMapUploadSaveUi_ === 'function') paintMapUploadSaveUi_(); } catch(_){}
      }

      try {
        const id = 'bgmap_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
        const tilePyramid = state.tilePyramid ? {...state.tilePyramid, runtimeMapId: id} : null;

        await dbPutMap_({
          id: id,
          name: state.name.trim(),
          imageDataUrl: state.fileDataUrl,
          cornerTL: state.geoReference?.extent ? {...state.geoReference.extent.cornerTL} : state.cornerTL,
          cornerBR: state.geoReference?.extent ? {...state.geoReference.extent.cornerBR} : state.cornerBR,
          geoReference: state.geoReference||null,
          tilePyramid: tilePyramid,
          uploadedAt: new Date().toISOString(),
          uploadedBy: (typeof sessionInfo !== 'undefined' && sessionInfo) ? sessionInfo.userName : 'unknown'
        });

        if(typeof loadBackgroundMapsFromDb_ === 'function') await loadBackgroundMapsFromDb_();

        try {
          const runtimeFile = window._v19RuntimeFile || state.file;
          if(state.geoReference && runtimeFile && typeof registerLithositeRuntimePdfSource_ === 'function') {
            registerLithositeRuntimePdfSource_(id, runtimeFile, state.geoReference);
          }
        } catch(_){}

        activeBackgroundMapId = id;
        mapZoom = 1.25;
        if(typeof mapViewportState_ !== 'undefined') mapViewportState_.centerNative = null;
        try { localStorage.setItem('mg1_active_bg_map_id', id); } catch(_){}
        if(typeof mapManagePanelOpen !== 'undefined') mapManagePanelOpen = false;
        if(typeof mapUploadFormOpen !== 'undefined') mapUploadFormOpen = false;
        if(typeof kmlManagePanelOpen !== 'undefined') kmlManagePanelOpen = false;

        // Tutup modal
        const modalRoot = document.getElementById('mg1-new-map-modal-root');
        const backdrop = document.getElementById('mg1-new-modal-backdrop');
        const panel = document.getElementById('mg1-new-modal-panel');
        if(modalRoot && isNewModal) {
          if(backdrop) backdrop.style.opacity = '0';
          if(panel) { panel.style.opacity = '0'; panel.style.transform = 'translate(-50%,-44%) scale(0.96)'; }
          await new Promise(r => setTimeout(r, 260));
          modalRoot.style.display = 'none';
          modalState.open = false;
        }

        // V22 ATOMIC FIXED SWAP
        const vp = document.getElementById('mg1-map-viewport');
        if(vp) {
          console.log('[V22] Starting FIXED atomic swap with new Image() loader');
          const swapped = await executeAtomicSurfaceSwap_(vp, buildNewMapSurfaceV22);
          if(!swapped) {
            // FIXED-2: swap gagal/timeout = jangan sentuh surface lama.
            // Peta lama tetap menjadi visible surface; tidak ada direct inject
            // dan tidak ada render() fallback yang dapat membuka blank frame.
            console.warn('[V22 FIXED-2] Swap cancelled - OLD MAP retained, no destructive fallback');
          }
          console.log(`[V22] Atomic swap ${swapped ? 'SUCCESS' : 'CANCELLED'} - blank frame eliminated`);
        } else {
          if(typeof render === 'function') render();
        }

      } catch(err) {
        console.error('[V22] Save error', err);
        if(typeof render === 'function') render();
      } finally {
        if(typeof mapUploadBusy !== 'undefined') mapUploadBusy = false;
        if(isNewModal && modalState) {
          modalState.busy = false;
          const saveBtn = document.getElementById('mg1-new-modal-save');
          if(saveBtn) { saveBtn.textContent = 'Simpan Peta'; saveBtn.style.opacity = '1'; }
        }
      }
    };

    window.submitMapUpload_ = window.submitMapUpload_V22_;
    window.submitMapUpload_NoRender_ = window.submitMapUpload_V22_;
    window.submitMapUpload_Atomic_ = window.submitMapUpload_V22_;

    // Patch V19 button
    const check = setInterval(() => {
      const saveBtn = document.getElementById('mg1-new-modal-save');
      if(saveBtn) {
        clearInterval(check);
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.onclick = window.submitMapUpload_V22_;
        console.log('[V22] V19 modal button patched to FIXED atomic');
      }
    }, 500);

    console.log('[V22] submitMapUpload_ replaced with FIXED atomic version');
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchToV22);
  } else {
    patchToV22();
  }

  console.log('[V22 ATOMIC FIXED] Ready - SVG <image> via new Image() + cancel on timeout');
})();
