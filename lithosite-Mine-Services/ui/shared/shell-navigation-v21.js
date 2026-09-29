(function (global) {
  'use strict';

  const SCREENS = Object.freeze({
    Dashboard: 'dashboardScreen',
    Operations: 'operationsScreen',
    Equipment: 'equipmentScreen'
  });

  function setScreen(name) {
    if (!SCREENS[name]) return false;

    Object.keys(SCREENS).forEach(function (screenName) {
      const element = document.getElementById(SCREENS[screenName]);
      if (!element) return;
      const active = screenName === name;
      element.hidden = !active;
      element.setAttribute('aria-hidden', String(!active));
      element.classList.toggle('active', active);
    });

    document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
      const label = item.querySelector('.nav-text')?.textContent.trim();
      const active = label === name;
      item.classList.toggle('active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });

    return true;
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
        if (SCREENS[label]) {
          setScreen(label);
          return;
        }
        window.alert(label + ' module belum tersedia pada Desktop Master.');
      });
    });

    setScreen('Dashboard');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.LithositeShellNavigation = Object.freeze({
    init,
    setScreen,
    screens: SCREENS
  });
})(window);
