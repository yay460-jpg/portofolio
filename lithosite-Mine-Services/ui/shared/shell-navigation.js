(function (global) {
  'use strict';

  const routes = {
    'Dashboard': '../Artifacts/Mine-Services-Concept-2-Operations-Dashboard-Progress-v1.html',
    'Operations': '../Artifacts/Mine-Services-Concept-2-Operations-v1.html'
  };

  function init() {
    document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
      const labelEl = item.querySelector('.nav-text');
      if (!labelEl) return;
      const label = labelEl.textContent.trim();
      item.style.cursor = 'pointer';
      item.addEventListener('click', function () {
        const route = routes[label];
        if (route) {
          window.location.href = route;
          return;
        }
        if (label !== 'Operations' && label !== 'Dashboard') {
          window.alert(label + ' module belum tersedia pada Desktop Master.');
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.LithositeShellNavigation = { init: init };
})(window);
