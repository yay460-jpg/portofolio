(function (global) {
  'use strict';

  const state = {
    activeId: null,
    initialized: false
  };

  const NON_BLOCKING = new Set([
    'stage15DataModal',
    'reportsConsoleModal',
    'reportsHistoryModal',
    'timelineModal',
    'appInfoModal',
    'userGuideModal',
    'userGuideReaderModal'
  ]);

  function isVisible(el) {
    return !!el && !el.hidden && (
      el.classList.contains('show') ||
      el.classList.contains('open')
    );
  }

  function hide(el) {
    if (!el) return;
    el.classList.remove('show', 'open');
    if (el.hasAttribute('aria-hidden')) el.setAttribute('aria-hidden', 'true');
  }

  function getApplicationModals() {
    return Array.from(document.querySelectorAll('.modalback, .modal, [role="dialog"], .app-info-modal, .user-guide-modal, .user-guide-reader-modal'))
      .filter(function (el) {
        if (!el.id) return false;
        if (el.closest('.modalback') && el !== el.closest('.modalback')) return false;
        return isVisible(el);
      });
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
    el.hidden = false;
    el.classList.add('show');
    el.classList.remove('open');
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

    enforceSingleVisible();
  }

  global.LithositeModalShowContract = Object.freeze({
    init: init,
    show: show,
    close: close,
    closeAll: closeAll,
    closeTransient: closeTransient,
    isVisible: isVisible,
    nonBlocking: NON_BLOCKING
  });
})(window);
