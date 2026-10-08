(function (global) {
  'use strict';

  const state = {
    activeId: null,
    initialized: false,
    blockedToast: null
  };

  const OPEN_CLASS_BY_ID = new Set([
    'reportsConsoleModal',
    'reportsHistoryModal',
    'reportPreviewModal'
  ]);

  function isVisible(el) {
    return !!el && !el.hidden && (
      el.classList.contains('show') ||
      el.classList.contains('open')
    );
  }

  function enforceShellContract() {
    document.querySelectorAll('.modalback > .modal').forEach(function (modal) {
      const hasHeader = !!modal.querySelector(':scope > .modalhead');
      const hasBody = !!modal.querySelector(':scope > .modalbody');
      const hasFooter = !!modal.querySelector(':scope > .modalfoot');
      modal.classList.toggle('modal-shell-valid', hasHeader && hasBody && hasFooter);
    });
  }

  function hide(el) {
    if (!el) return;
    el.classList.remove('show', 'open');
    if (el.hasAttribute('aria-hidden')) el.setAttribute('aria-hidden', 'true');
  }

  function getApplicationModals() {
    return Array.from(document.querySelectorAll('.modalback, .modal, [role="dialog"], .app-info-modal, .user-guide-modal, .user-guide-reader-modal, #stage15DataModal'))
      .filter(function (el) {
        if (!el.id) return false;
        if (el.closest('.modalback') && el !== el.closest('.modalback')) return false;
        return isVisible(el);
      });
  }

  function hasOtherVisible(id) {
    return getApplicationModals().some(function (el) {
      return !id || el.id !== id;
    });
  }

  function notifyBlocked(message) {
    if (!document.body) return;
    let toast = state.blockedToast;
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'modalShowGuardToast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = [
        'position:fixed',
        'left:50%',
        'bottom:48px',
        'transform:translateX(-50%)',
        'z-index:100000',
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
      state.blockedToast = toast;
    }
    toast.textContent = message || 'Close the current modal before opening this.';
    toast.style.display = 'block';
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.style.display = 'none';
    }, 3200);
  }

  function closeAll(exceptId) {
    getApplicationModals().forEach(function (el) {
      if (exceptId && el.id === exceptId) return;
      hide(el);
    });
    if (!exceptId) state.activeId = null;
  }

  function show(id) {
    const el = document.getElementById(id);
    if (!el) return false;

    closeAll(id);

    const openClass = OPEN_CLASS_BY_ID.has(id) ? 'open' : 'show';
    const closedClass = openClass === 'open' ? 'show' : 'open';

    el.hidden = false;
    el.classList.remove(closedClass);
    el.classList.add(openClass);
    el.setAttribute('aria-hidden', 'false');
    state.activeId = id;
    return true;
  }

  function close(id) {
    const el = id ? document.getElementById(id) : (state.activeId ? document.getElementById(state.activeId) : null);
    hide(el);
    if (!id || state.activeId === id) state.activeId = null;
  }

  function closeTransient() {
    closeAll();
  }

  function enforceSingleVisible() {
    const visible = getApplicationModals();
    if (!visible.length) {
      state.activeId = null;
      return;
    }
    const winner = visible[visible.length - 1];
    visible.forEach(function (el) {
      if (el !== winner) hide(el);
    });
    state.activeId = winner.id;
  }

  function init() {
    if (state.initialized || !document.body) return;
    state.initialized = true;

    const observer = new MutationObserver(function (mutations) {
      let changed = false;
      mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') changed = true;
      });
      if (changed) enforceSingleVisible();
    });

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    enforceShellContract();
    enforceSingleVisible();
  }

  global.LithositeModalShowContract = Object.freeze({
    init: init,
    show: show,
    close: close,
    closeAll: closeAll,
    closeTransient: closeTransient,
    enforceShellContract: enforceShellContract,
    isVisible: isVisible,
    hasOtherVisible: hasOtherVisible,
    notifyBlocked: notifyBlocked,
    openClassById: OPEN_CLASS_BY_ID
  });
})(window);
