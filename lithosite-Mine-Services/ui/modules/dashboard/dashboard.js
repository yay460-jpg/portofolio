(function (global) {
  'use strict';

  function init() {
    const expand = document.getElementById('expand');
    if (!expand) return;
    expand.addEventListener('click', function () {
      const app = document.querySelector('.app');
      if (!app) return;
      app.classList.toggle('expanded-tables');
      expand.textContent = app.classList.contains('expanded-tables')
        ? 'Collapse Tables ↙'
        : 'Expand Tables ↗';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.LithositeDashboard = { init };
})(window);
