(function (global) {
  'use strict';

  function setScreen(name) {
    const dashboard = document.getElementById('dashboardScreen');
    const operations = document.getElementById('operationsScreen');
    const items = document.querySelectorAll('.sidebar .nav-item');
    const isOperations = name === 'Operations';

    if (dashboard) dashboard.style.display = isOperations ? 'none' : 'block';
    if (operations) {
      operations.classList.toggle('active', isOperations);
      operations.setAttribute('aria-hidden', String(!isOperations));
    }

    items.forEach(function (item) {
      const label = item.querySelector('.nav-text')?.textContent.trim();
      item.classList.toggle('active', label === name);
    });
  }

  function init() {
    const side = document.getElementById('side');
    const toggle = document.getElementById('toggle');
    if (toggle && side) {
      toggle.addEventListener('click', function () {
        side.classList.toggle('expanded');
      });
    }

    document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
      item.addEventListener('click', function () {
        const label = item.querySelector('.nav-text')?.textContent.trim();
        if (label === 'Dashboard' || label === 'Operations') {
          setScreen(label);
          return;
        }
        window.alert(label + ' module belum tersedia pada Desktop Master.');
      });
    });

    setScreen('Dashboard');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.LithositeShellNavigation = { init, setScreen };
})(window);
