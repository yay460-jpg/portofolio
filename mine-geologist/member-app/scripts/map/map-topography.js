/* Lithosite Member — Topo3D UI adapter.
 * Shared engine stays UI-independent in shared/topo3d/topo3d-engine.js.
 * This adapter owns only Member Peta-mode switching + loading lifecycle.
 */
let memberTopo3D_ = null;
let memberTopo3DReady_ = false;
let memberTopo3DBusy_ = false;
let memberTopo3DError_ = '';
let memberPetaViewMode_ = 'location';
let memberTopoObserverInstalled_ = false;
let memberTopoMountBusy_ = false;

async function prepareMemberTopo3D_(canvas, hooks) {
  hooks = hooks || {};
  if (!canvas) throw new Error('Canvas 3D Topografi tidak tersedia.');
  if (memberTopo3DReady_ && memberTopo3D_ && memberTopo3D_.canvas === canvas) return memberTopo3D_;
  if (memberTopo3DBusy_) return memberTopo3D_;
  memberTopo3DBusy_ = true;
  memberTopo3DError_ = '';
  try {
    if (memberTopo3D_ && memberTopo3D_.canvas !== canvas) {
      try { memberTopo3D_.destroy(); } catch (_) {}
      memberTopo3D_ = null;
      memberTopo3DReady_ = false;
    }
    memberTopo3D_ = window.LithositeTopo3D.create({
      canvas: canvas,
      onStatus: function(msg) { if (hooks.onStatus) hooks.onStatus(msg); },
      onReady: function(info) { memberTopo3DReady_ = true; if (hooks.onReady) hooks.onReady(info); },
      onError: function(err) { memberTopo3DError_ = String(err && err.message ? err.message : err); if (hooks.onError) hooks.onError(err); }
    });
    await memberTopo3D_.prepare();
    memberTopo3DReady_ = true;
    return memberTopo3D_;
  } catch (err) {
    memberTopo3DError_ = String(err && err.message ? err.message : err);
    memberTopo3DReady_ = false;
    if (hooks.onError) hooks.onError(err);
    throw err;
  } finally {
    memberTopo3DBusy_ = false;
  }
}

function getMemberTopo3D_() { return memberTopo3D_; }
function getMemberTopo3DState_() {
  return {
    ready: memberTopo3DReady_,
    busy: memberTopo3DBusy_,
    error: memberTopo3DError_,
    state: memberTopo3D_ && typeof memberTopo3D_.getState === 'function' ? memberTopo3D_.getState() : null
  };
}
function destroyMemberTopo3D_() {
  if (memberTopo3D_) { try { memberTopo3D_.destroy(); } catch (_) {} }
  memberTopo3D_ = null;
  memberTopo3DReady_ = false;
  memberTopo3DBusy_ = false;
  memberTopo3DError_ = '';
}

function topoEsc_(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
  });
}

function topoSetLoading_(visible, title, sub) {
  const el = document.getElementById('mg1-topo3d-loading');
  if (!el) return;
  const t = el.querySelector('[data-topo-loading-title]');
  const s = el.querySelector('[data-topo-loading-sub]');
  if (t) t.textContent = title || 'Menyiapkan 3D Topografi…';
  if (s) s.textContent = sub || 'Menyiapkan WebGL. Mohon tunggu.';
  el.style.display = visible ? 'flex' : 'none';
}

function topoSetStatus_(msg, error) {
  const el = document.getElementById('mg1-topo3d-status');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'text-[9px] ' + (error ? 'text-rose-300' : 'text-blue-200/80');
}

function topoApplyOptions_() {
  const e = getMemberTopo3D_();
  if (!e) return;
  e.setOptions({
    zFactor: Number(document.getElementById('mg1-topo-z')?.value || 1.10),
    gapGuard: !!document.getElementById('mg1-topo-gap')?.checked,
    meshOverlay: !!document.getElementById('mg1-topo-mesh')?.checked,
    reliefOn: !!document.getElementById('mg1-topo-relief')?.checked,
    tintOn: !!document.getElementById('mg1-topo-tint')?.checked,
    aoStrength: Number(document.getElementById('mg1-topo-ao')?.value || .28),
    reliefStrength: Number(document.getElementById('mg1-topo-relief-factor')?.value || .10),
    meshAlpha: Number(document.getElementById('mg1-topo-mesh-factor')?.value || .12)
  });
}

async function prepareAndShowMemberTopo3D_() {
  const panel = document.getElementById('mg1-topo3d-panel');
  const canvas = document.getElementById('mg1-topo3d-canvas');
  if (!panel || !canvas) return;
  panel.classList.remove('hidden');
  topoSetLoading_(true, 'Menyiapkan 3D Topografi…', 'Menyiapkan data WebGL. Mohon tunggu.');
  try {
    await prepareMemberTopo3D_(canvas, {
      onStatus: function(msg) { topoSetStatus_(msg, false); },
      onError: function(err) { topoSetStatus_(err && err.message ? err.message : err, true); }
    });
    const e = getMemberTopo3D_();
    if (e) e.resize();
    topoApplyOptions_();
    await new Promise(function(resolve) { requestAnimationFrame(function() { requestAnimationFrame(resolve); }); });
    topoSetLoading_(false);
    const st = getMemberTopo3DState_();
    if (st.state && st.state.ready) topoSetStatus_('3D Topografi siap. Import DTM/STR untuk memuat terrain.', false);
  } catch (err) {
    topoSetLoading_(false);
    topoSetStatus_(err && err.message ? err.message : err, true);
  }
}

async function handleMemberTopoFiles_(input) {
  const files = input && input.files ? Array.from(input.files) : [];
  if (!files.length) return;
  const e = getMemberTopo3D_();
  if (!e) return;
  topoSetLoading_(true, 'Menyiapkan data topografi…', 'Membaca DTM/STR secara lokal. Mohon tunggu.');
  try {
    topoSetStatus_('Membaca data topografi…', false);
    const meta = await e.loadFiles(files);
    topoSetStatus_('DTM siap · ' + Number(meta.triangles || 0).toLocaleString('id-ID') + ' triangles', false);
    topoSetLoading_(false);
    const z = document.getElementById('mg1-topo-z');
    if (z) z.dispatchEvent(new Event('input', {bubbles:true}));
  } catch (err) {
    topoSetLoading_(false);
    topoSetStatus_(err && err.message ? err.message : err, true);
  } finally {
    input.value = '';
  }
}

function setMemberTopoView_(mode) {
  memberPetaViewMode_ = mode === 'topo' ? 'topo' : 'location';
  const main = document.querySelector('#app .app-main');
  if (!main) return;
  const switcher = main.querySelector('#mg1-peta-view-switch');
  const topoPanel = main.querySelector('#mg1-topo3d-panel');
  const originals = main.querySelectorAll('[data-mg1-peta-original="1"]');
  if (switcher) {
    switcher.querySelectorAll('button').forEach(function(btn) {
      btn.classList.toggle('bg-[#2563eb]/20', btn.dataset.mode === memberPetaViewMode_);
      btn.classList.toggle('text-white', btn.dataset.mode === memberPetaViewMode_);
      btn.classList.toggle('text-white/40', btn.dataset.mode !== memberPetaViewMode_);
    });
  }
  originals.forEach(function(el) { el.style.display = memberPetaViewMode_ === 'location' ? '' : 'none'; });
  if (topoPanel) topoPanel.style.display = memberPetaViewMode_ === 'topo' ? 'flex' : 'none';
  if (memberPetaViewMode_ === 'topo') prepareAndShowMemberTopo3D_();
}

function buildMemberTopo3DPanel_() {
  return '' +
    '<div id="mg1-topo3d-panel" class="relative flex-1 min-h-0 rounded-[12px] bg-[#050b18] border border-white/[0.08] overflow-hidden flex-col" style="display:none;">' +
      '<canvas id="mg1-topo3d-canvas" class="absolute inset-0 w-full h-full touch-none"></canvas>' +
      '<div class="absolute left-3 right-3 top-3 z-10 flex items-center justify-between pointer-events-none">' +
        '<div class="px-2 py-1 rounded-lg bg-[#0b1329]/85 border border-white/10 text-[10px] font-bold text-white">3D TOPOGRAFI</div>' +
        '<label class="pointer-events-auto px-2.5 py-1.5 rounded-lg bg-[#0b1329]/90 border border-white/10 text-[9px] font-bold text-white cursor-pointer">IMPORT DTM/STR<input type="file" accept=".ltdtm,.dtm,.str" multiple class="hidden" onchange="handleMemberTopoFiles_(this)"></label>' +
      '</div>' +
      '<div id="mg1-topo3d-status" class="absolute left-3 top-11 z-10 max-w-[70%] text-[9px] text-blue-200/80"></div>' +
      '<div class="absolute right-3 top-3 z-10 flex flex-col gap-1.5 pt-12">' +
        '<button onclick="getMemberTopo3D_()?.setView(\'3d\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[9px] font-bold">3D</button>' +
        '<button onclick="getMemberTopo3D_()?.setView(\'top\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[9px] font-bold">TOP</button>' +
        '<button onclick="getMemberTopo3D_()?.fit()" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[9px] font-bold">FIT</button>' +
        '<button onclick="getMemberTopo3D_()?.setMode(\'shaded\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[8px] font-bold">SHADE</button>' +
        '<button onclick="getMemberTopo3D_()?.setMode(\'elevation\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[8px] font-bold">ELEV</button>' +
        '<button onclick="getMemberTopo3D_()?.setMode(\'wire\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[7px] font-bold">WIRE</button>' +
      '</div>' +
      '<div class="absolute left-3 right-3 bottom-3 z-10 flex items-end gap-2 pointer-events-none">' +
        '<div class="pointer-events-auto flex-1 rounded-xl bg-[#0b1329]/90 border border-white/10 p-2">' +
          '<div class="grid grid-cols-3 gap-x-3 gap-y-1 text-[8px] text-white/50">' +
            '<label>Z <input id="mg1-topo-z" type="range" min="0.25" max="2.5" step="0.05" value="1.10" class="w-full"></label>' +
            '<label>AO <input id="mg1-topo-ao" type="range" min="0" max="0.60" step="0.01" value="0.28" class="w-full"></label>' +
            '<label>RELIEF <input id="mg1-topo-relief-factor" type="range" min="0" max="1.5" step="0.05" value="0.10" class="w-full"></label>' +
          '</div>' +
          '<div class="flex gap-3 mt-1.5 text-[8px] text-white/60">' +
            '<label><input id="mg1-topo-gap" type="checkbox" checked> Gap</label>' +
            '<label><input id="mg1-topo-mesh" type="checkbox"> Mesh</label>' +
            '<label><input id="mg1-topo-relief" type="checkbox" checked> Relief</label>' +
            '<label><input id="mg1-topo-tint" type="checkbox"> Tint</label>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="mg1-topo3d-loading" class="absolute inset-0 z-30 flex items-center justify-center bg-[#050b18]/92 backdrop-blur-sm" style="display:none;">' +
        '<div class="w-[270px] rounded-2xl bg-[#0b1329] border border-white/10 p-5 text-center shadow-2xl">' +
          '<div class="w-7 h-7 mx-auto mb-3 rounded-full border-[3px] border-white/10 border-t-blue-400 animate-spin"></div>' +
          '<div data-topo-loading-title class="text-xs font-bold text-white">Menyiapkan 3D Topografi…</div>' +
          '<div data-topo-loading-sub class="text-[9px] text-white/35 mt-1">Menyiapkan data WebGL. Mohon tunggu.</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function isMemberPetaViewSwitcherCandidate_(el) {
  if (!el || el.id === 'mg1-peta-view-switch') return false;
  const buttons = Array.from(el.querySelectorAll('button'));
  if (buttons.length !== 2) return false;
  const labels = buttons.map(function(btn) {
    return String(btn.textContent || '').replace(/\\s+/g, ' ').trim().toUpperCase();
  });
  return labels[0] === 'PETA LOKASI' && labels[1] === '3D TOPOGRAFI';
}

function removeDuplicateMemberTopoSwitchers_(keepMain, keepSwitcher) {
  const all = Array.from(document.querySelectorAll('#mg1-peta-view-switch'));
  all.forEach(function(el) {
    if (el === keepSwitcher && el.parentElement === keepMain) return;
    el.remove();
  });

  // The existing Peta renderer may already own the two-button view switcher.
  // Do not create a second owner: remove only a non-canonical element whose
  // two buttons are exactly the Peta/3D Topografi pair.
  if (!keepSwitcher) return;
  const candidates = Array.from(keepMain.querySelectorAll('div,section,nav'));
  candidates.forEach(function(el) {
    if (el === keepSwitcher) return;
    if (!isMemberPetaViewSwitcherCandidate_(el)) return;
    try { el.remove(); } catch (_) {}
  });
}

function removeDuplicateMemberTopoPanels_(keepMain, keepPanel) {
  const all = Array.from(document.querySelectorAll('#mg1-topo3d-panel'));
  all.forEach(function(el) {
    if (el === keepPanel && el.parentElement === keepMain) return;
    try { el.remove(); } catch (_) {}
  });
}

function mountMemberTopo3DPanel_() {
  if (typeof currentTab !== 'undefined' && currentTab !== 'peta') return;
  if (memberTopoMountBusy_) return;
  const main = document.querySelector('#app .app-main');
  if (!main) return;

  memberTopoMountBusy_ = true;
  try {
    // Cross-render guard: render() can replace .app-main while MutationObserver is
    // still delivering the previous mutation batch. Never allow stale duplicate
    // switchers/panels to survive across render cycles.
    let switcher = main.querySelector('#mg1-peta-view-switch');
    let panel = main.querySelector('#mg1-topo3d-panel');

    // Remove a legacy/generic Peta/3D switcher before any new switcher is
    // created. This keeps a single UI owner even when peta.js already renders
    // the same two-button control.
    removeDuplicateMemberTopoSwitchers_(main, switcher);

    if (switcher && panel) {
      removeDuplicateMemberTopoSwitchers_(main, switcher);
      removeDuplicateMemberTopoPanels_(main, panel);
      return;
    }

    // If only one half survived a render, remove it and rebuild the pair atomically.
    if (switcher) switcher.remove();
    if (panel) panel.remove();

    const children = Array.from(main.children);
    if (!children.length) return;

    switcher = document.createElement('div');
    switcher.id = 'mg1-peta-view-switch';
    switcher.className = 'grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0b1329] border border-white/[0.08] shrink-0';
    switcher.innerHTML =
      '<button type="button" data-mode="location" onclick="setMemberTopoView_(\'location\')" class="py-2 rounded-lg text-[10px] font-bold bg-[#2563eb]/20 text-white">PETA LOKASI</button>' +
      '<button type="button" data-mode="topo" onclick="setMemberTopoView_(\'topo\')" class="py-2 rounded-lg text-[10px] font-bold text-white/40">3D TOPOGRAFI</button>';

    main.insertBefore(switcher, children[1] || null);

    Array.from(main.children).forEach(function(el) {
      if (el !== switcher) el.setAttribute('data-mg1-peta-original','1');
    });
    switcher.removeAttribute('data-mg1-peta-original');

    const panelWrap = document.createElement('div');
    panelWrap.innerHTML = buildMemberTopo3DPanel_();
    panel = panelWrap.firstElementChild;
    main.appendChild(panel);

    // Final DOM invariant: exactly one switcher and one panel for the active Peta view.
    removeDuplicateMemberTopoSwitchers_(main, switcher);
    removeDuplicateMemberTopoPanels_(main, panel);
    setMemberTopoView_('location');
  } finally {
    memberTopoMountBusy_ = false;
  }
}

function installMemberTopo3DObserver_() {
  if (memberTopoObserverInstalled_) return;
  const app = document.getElementById('app');
  if (!app || typeof MutationObserver === 'undefined') return;
  memberTopoObserverInstalled_ = true;
  const observer = new MutationObserver(function() {
    if (typeof currentTab !== 'undefined' && currentTab !== 'peta') {
      if (memberTopo3D_) destroyMemberTopo3D_();
      return;
    }
    if (document.querySelector('#app .app-main')) mountMemberTopo3DPanel_();
  });
  observer.observe(app, {childList:true, subtree:true});
  mountMemberTopo3DPanel_();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installMemberTopo3DObserver_);
} else {
  installMemberTopo3DObserver_();
}
