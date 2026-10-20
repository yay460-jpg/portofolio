(function (global, document) {
  'use strict';

  const MODAL_ID = 'operationsGuideModal';
  const CLOSE_ID = 'operationsGuideClose';
  const HELP_ID = 'operationsGraphicsHelp';

  function modalElement() {
    return document.getElementById(MODAL_ID);
  }

  function openGuide(event) {
    if (event) {
      event.preventDefault();
    }
    const modal = modalElement();
    if (!modal) return;
    modal.hidden = false;
    modal.removeAttribute('hidden');
    modal.style.removeProperty('display');
    if (global.LithositeModalShowContract &&
        typeof global.LithositeModalShowContract.show === 'function') {
      global.LithositeModalShowContract.show(MODAL_ID);
    } else {
      modal.classList.remove('open', 'is-closing');
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeGuide(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const modal = modalElement();
    if (!modal) return;
    if (global.LithositeModalShowContract &&
        typeof global.LithositeModalShowContract.close === 'function') {
      try {
        global.LithositeModalShowContract.close(MODAL_ID);
      } catch (error) {
        // The local fallback below is authoritative for this small support modal.
      }
    }
    modal.classList.remove('show', 'open', 'is-closing');
    modal.setAttribute('aria-hidden', 'true');
    const anotherVisible = Array.from(document.querySelectorAll(
      '.modalback.show, .modalback.open, [role="dialog"].show, [role="dialog"].open'
    )).some(function (item) {
      return item !== modal && !item.contains(modal);
    });
    if (!anotherVisible) document.body.classList.remove('modal-open');
  }

  // Delegation is intentional: this file is loaded before some modal markup
  // in Mine-Services-Operations.html, so binding directly at startup is unsafe.
  document.addEventListener('click', function (event) {
    const target = event.target && event.target.closest
      ? event.target.closest('#' + CLOSE_ID + ', #' + HELP_ID)
      : null;
    if (!target) return;
    if (target.id === CLOSE_ID) closeGuide(event);
    else if (target.id === HELP_ID) openGuide(event);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      const modal = modalElement();
      if (modal && (modal.classList.contains('show') || modal.classList.contains('open'))) {
        closeGuide(event);
      }
    }
  });

  global.LithositeModalSupport = Object.freeze({
    open: openGuide,
    close: closeGuide
  });
})(window, document);
