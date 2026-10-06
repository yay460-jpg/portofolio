(function (global) {
  'use strict';

  const state = {
    initialized: false,
    blocked: false,
    reason: '',
    registrations: new Map(),
    toast: null
  };

  function createToast() {
    if (state.toast) return state.toast;

    const toast = document.createElement('div');
    toast.id = 'navigationGuardToast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = [
      'position:fixed',
      'left:50%',
      'bottom:48px',
      'transform:translateX(-50%)',
      'z-index:99999',
      'display:none',
      'max-width:min(520px,calc(100vw - 32px))',
      'padding:10px 14px',
      'border:1px solid #6b4d22',
      'border-radius:8px',
      'background:#241b0d',
      'color:#f8d58a',
      'box-shadow:0 12px 32px #0009',
      'font:600 11px Segoe UI,Arial,sans-serif',
      'text-align:center'
    ].join(';');
    document.body.appendChild(toast);
    state.toast = toast;
    return toast;
  }

  function notify(message) {
    const toast = createToast();
    toast.textContent = message || 'Close your table or card before leaving.';
    toast.style.display = 'block';
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.style.display = 'none';
    }, 3200);
  }

  function register(id, options) {
    if (!id) return false;
    state.registrations.set(id, Object.assign({
      message: 'Close your table or card before leaving.',
      active: false
    }, options || {}));
    return true;
  }

  function unregister(id) {
    state.registrations.delete(id);
  }

  function setActive(id, active) {
    const item = state.registrations.get(id);
    if (!item) return false;
    item.active = !!active;
    return true;
  }

  function registerModal(id, options) {
    return register(id, Object.assign({
      type: 'modal'
    }, options || {}));
  }

  function sync() {
    state.blocked = false;
    state.reason = '';

    state.registrations.forEach(function (item) {
      if (!item.active) return;
      state.blocked = true;
      state.reason = item.message;
    });

    if (!state.blocked) {
      document.querySelectorAll('.navigation-guard-active').forEach(function (el) {
        el.classList.remove('navigation-guard-active');
      });
    }
    return state.blocked;
  }

  function guard() {
    if (!sync()) return true;
    notify(state.reason);
    return false;
  }

  function init() {
    if (state.initialized || !document.body) return;
    state.initialized = true;
  }

  global.LithositeNavigationGuardContract = Object.freeze({
    init: init,
    register: register,
    unregister: unregister,
    registerModal: registerModal,
    setActive: setActive,
    guard: guard,
    sync: sync,
    isBlocked: function () { return sync(); },
    notify: notify
  });
})(window);
