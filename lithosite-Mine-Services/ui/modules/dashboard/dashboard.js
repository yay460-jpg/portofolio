(function (global) {
  'use strict';

  function init() {
    const side = document.getElementById('side');
    const toggle = document.getElementById('toggle');
    const expand = document.getElementById('expand');

    if (toggle && side) {
      toggle.addEventListener('click', function () {
        side.classList.toggle('expanded');
      });
    }

    if (expand) {
      expand.addEventListener('click', function () {
        const app = document.querySelector('.app');
        if (!app) return;
        app.classList.toggle('expanded-tables');
        expand.textContent = app.classList.contains('expanded-tables')
          ? 'Collapse Tables ↙'
          : 'Expand Tables ↗';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.LithositeDashboard = { init: init };
})(window);
