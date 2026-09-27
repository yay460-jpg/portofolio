/* STEP 9.11-C — Surface Lifecycle Boundary
 * Structural extraction only. No behavior/logic change.
 * V22/V23/V24.1 contracts preserved.
 */

function captureMapSurfaceTransition_() {
  try {
    const vp = document.getElementById('mg1-map-viewport');
    if (!vp || !document.body) return null;
    const rect = vp.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return null;

    const overlay = vp.cloneNode(true);
    overlay.id = 'mg1-map-transition-freeze';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.position = 'fixed';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.margin = '0';
    overlay.style.zIndex = '2147483646';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '1';
    overlay.style.transition = 'none';
    overlay.style.transform = 'none';
    document.body.appendChild(overlay);
    return overlay;
  } catch (_) {
    return null;
  }
}



function releaseMapSurfaceTransition_(overlay) {
  if (!overlay) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(async () => {
      try {
        const newVp = document.getElementById('mg1-map-viewport');
        if (!newVp) {
          overlay.remove();
          return;
        }

        // V17.1 FIX-2: keep the old frozen map visible while the newly-rendered
        // viewport is hidden. The DOM may be rebuilt, but the user never sees
        // an intermediate empty map frame.
        newVp.style.visibility = 'hidden';
        newVp.style.pointerEvents = 'none';

        // SVG <image> is not HTMLImageElement, so preload its href through a
        // temporary Image() and decode that resource when supported. A timeout
        // is a safety guard only: it NEVER forces an incomplete surface swap.
        const isReady = await preloadSvgImages_(newVp, 3000);
        if (!isReady) {
          // The old map exists only as the freeze overlay after render(). Keep
          // that overlay visible rather than exposing a partially-loaded new
          // surface. The temporary new viewport is removed, but the old map
          // remains visually intact as the safe fallback.
          try { newVp.remove(); } catch (_) {}
          return;
        }

        // New surface is ready. Make it visible first; remove the old frozen
        // surface on the following frame so there is never a frame with no map.
        newVp.style.visibility = '';
        newVp.style.pointerEvents = '';
        requestAnimationFrame(() => {
          try { overlay.remove(); } catch (_) {}
        });
      } catch (_) {
        // Defensive fallback: if the handoff itself fails, remove only the
        // temporary freeze overlay and never alter map engine state.
        try { overlay.remove(); } catch (_) {}
      }
    });
  });
}

(function(){
  console.log('[V22 ATOMIC FIXED] Loading corrected SVG preloader');

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

    let timeoutId = null;
    const timerGuard = new Promise(resolve => {
      timeoutId = setTimeout(() => {
        console.warn(`[V22] Preload timeout ${timeoutMs}ms`);
        resolve('TIMEOUT');
      }, timeoutMs);
    });

    return Promise.race([Promise.all(decodePromises), timerGuard]).then(result => {
      try { if (timeoutId) clearTimeout(timeoutId); } catch(_) {}
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

  window.preloadSvgImages_ = preloadSvgImages_;
  window.executeAtomicSurfaceSwap_ = executeAtomicSurfaceSwap_;

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

        // V23 SAVE UX FIX: setelah DB sukses, jangan tahan modal sampai atomic swap selesai.
        // List peta harus langsung terlihat seperti alur normal. Surface map baru boleh
        // disiapkan/ditukar di belakang tanpa memblokir penutupan modal.
        const vp = document.getElementById('mg1-map-viewport');
        const openManageAfterSave = () => {
          try {
            if(typeof window._v23OpenManageModal === 'function') {
              window._v23OpenManageModal();
              return;
            }
            if(typeof window.openMapManagePanel_ === 'function') {
              window.openMapManagePanel_();
              return;
            }
          } catch(e) { console.warn('[V23 SAVE UX] open manage failed', e); }
        };

        // Modal upload sudah ditutup. Jangan await swap di sini.
        setTimeout(openManageAfterSave, 300);

        if(vp && typeof executeAtomicSurfaceSwap_ === 'function') {
          console.log('[V22/V23] Starting atomic map swap in background');
          executeAtomicSurfaceSwap_(vp, buildNewMapSurfaceV22)
            .then(swapped => {
              console.log(`[V22/V23] Atomic swap ${swapped ? 'SUCCESS' : 'CANCELLED'} - OLD MAP retained on failure`);
            })
            .catch(e => console.warn('[V22/V23] Atomic swap failed - OLD MAP retained', e));
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

    // Bind langsung ke tombol V19. Jangan clone tombol karena V19 dapat membuat/
    // menginisialisasi ulang DOM modal setelah runtime aktif.
    const bindV22SaveButton_ = () => {
      const saveBtn = document.getElementById('mg1-new-modal-save');
      if(!saveBtn) return false;
      saveBtn.type = 'button';
      saveBtn.onclick = window.submitMapUpload_V22_;
      saveBtn.__v22SaveBound = true;
      return true;
    };
    bindV22SaveButton_();
    const check = setInterval(() => {
      if(bindV22SaveButton_()) {
        clearInterval(check);
        console.log('[V22] V19 save button bound directly to FIXED save flow');
      }
    }, 250);

    console.log('[V22] submitMapUpload_ replaced with FIXED atomic version');
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchToV22);
  } else {
    patchToV22();
  }

  console.log('[V22 ATOMIC FIXED] Ready - SVG <image> via new Image() + cancel on timeout');
})();
