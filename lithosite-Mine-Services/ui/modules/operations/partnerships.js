(function (global) {
  'use strict';
  const modalId = 'operationsPartnershipsModal';
  let returnFocus = null;

  function ensureModal() {
    let modal = document.getElementById(modalId);
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'operations-partnerships-backdrop';
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = '<section class="operations-partnerships-dialog" role="dialog" aria-modal="true" aria-labelledby="operationsPartnershipsTitle" tabindex="-1">' +
      '<header class="operations-partnerships-head"><span class="operations-partnerships-head-icon" aria-hidden="true">🤝</span>' +
      '<div class="operations-partnerships-title"><h2 id="operationsPartnershipsTitle">Mitra Operasional Tambang</h2><p>Partnership · Vendor · Advertising</p></div>' +
      '<button type="button" class="control" data-partnerships-close aria-label="Close partnership modal">Close</button></header>' +
      '<div class="operations-partnerships-body"><p class="operations-partnerships-intro">Lithosite terbuka untuk menjajaki kerja sama dengan perusahaan dan penyedia layanan yang mendukung kegiatan pertambangan. Silakan hubungi tim Lithosite untuk membahas kebutuhan dan bentuk kerja sama.</p>' +
      '<div class="operations-partnerships-options">' +
      '<article class="operations-partnership-option"><span aria-hidden="true">⛏️</span><strong>Kontraktor &amp; Mitra Operasional</strong><p>Jasa operasional, kontraktor tambang, dan dukungan lapangan.</p></article>' +
      '<article class="operations-partnership-option"><span aria-hidden="true">🚚</span><strong>Vendor &amp; Supplier</strong><p>Alat berat, suku cadang, perlengkapan, dan pasokan.</p></article>' +
      '<article class="operations-partnership-option"><span aria-hidden="true">📣</span><strong>Advertising &amp; Promotion</strong><p>Peluang promosi produk dan layanan yang relevan.</p></article>' +
      '</div><div class="operations-partnerships-contact"><strong>Contact Lithosite Team</strong><p>Alamat email resmi tim Lithosite belum dikonfigurasi. Hubungi tim melalui kanal resmi perusahaan hingga alamat kontak ditetapkan.</p></div></div>' +
      '</section>';
    document.body.appendChild(modal);
    return modal;
  }

  function openModal(trigger) {
    const modal = ensureModal();
    returnFocus = trigger || document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    const dialog = modal.querySelector('[role="dialog"]');
    if (dialog) dialog.focus();
  }

  function closeModal() {
    const modal = document.getElementById(modalId);
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
    returnFocus = null;
  }

  document.addEventListener('click', function (event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const open = target.closest('[data-partnerships-open]');
    if (open) {
      event.preventDefault();
      openModal(open);
      return;
    }
    const close = target.closest('[data-partnerships-close]');
    if (close) {
      event.preventDefault();
      closeModal();
      return;
    }
    const modal = document.getElementById(modalId);
    if (modal && !modal.hidden && target === modal) closeModal();
  });

  document.addEventListener('keydown', function (event) {
    const modal = document.getElementById(modalId);
    if (event.key === 'Escape' && modal && !modal.hidden) closeModal();
  });
})(window);
