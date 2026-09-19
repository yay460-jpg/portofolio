/* Lithosite Member — thin adapter for the shared Topo3D engine.
 * UI stays in map-ui.js/peta.js. This file owns only Member lifecycle/state.
 */
let memberTopo3D_ = null;
let memberTopo3DReady_ = false;
let memberTopo3DBusy_ = false;
let memberTopo3DError_ = '';

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
