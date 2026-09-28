(function (global) {
  'use strict';

  const routes = {
    'Dashboard': '../Artifacts/Mine-Services-Concept-2-Operations-Dashboard-v19-LOCKED.html'
  };

  function init() {
    document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
      const labelEl = item.querySelector('.nav-text');
      if (!labelEl) return;
      const label = labelEl.textContent.trim();

      item.style.cursor = 'pointer';

      item.addEventListener('click', function () {
        if (label === 'Operations') return;

        const route = routes[label];
        if (route) {
          window.location.href = route;
          return;
        }

        // Future module: keep navigation explicit without pretending the screen exists.
        if (label !== 'Dashboard') {
          window.alert(label + ' module belum tersedia pada Desktop Master.');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.LithositeShellNavigation = { init: init };
})(window);
