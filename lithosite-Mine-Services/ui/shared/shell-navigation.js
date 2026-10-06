(function (global) {
  'use strict';

  const SCREENS = Object.freeze({
    Dashboard: 'dashboardScreen',
    Operations: 'operationsScreen',
    Equipment: 'equipmentScreen',
    'Work Front': 'workfrontScreen',
    Maintenance: 'maintenanceScreen',
    Issues: 'issuesScreen',
    Plans: 'plansScreen',
    HSE: 'hseScreen',
    Reports: 'reportsScreen'
  });

  const STORAGE_KEY = 'lithosite-active-screen';
  let currentScreen = 'Dashboard';
  let initialized = false;

  function setScreen(name, persist) {
    if (!SCREENS[name]) return false;
    currentScreen = name;

    if (persist !== false) {
      try { sessionStorage.setItem(STORAGE_KEY, name); } catch (_) {}
    }

    Object.keys(SCREENS).forEach(function (screenName) {
      const element = document.getElementById(SCREENS[screenName]);
      if (!element) return;
      const active = screenName === name;
      element.hidden = !active;
      element.setAttribute('aria-hidden', String(!active));
      element.classList.toggle('active', active);
    });

    document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
      const screen = item.getAttribute('data-screen');
      const active = screen === name;
      item.classList.toggle('active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });

    return true;
  }

  function validateShellContract() {
    const required = ['Dashboard', 'Operations', 'Equipment', 'Work Front', 'Maintenance', 'Issues', 'Plans', 'HSE', 'Reports'];
    const missing = required.filter(function (name) {
      return !document.getElementById(SCREENS[name]);
    });

    if (missing.length) {
      console.error('[Lithosite Shell] Missing required screen DOM:', missing.join(', '));
      return false;
    }

    if (!document.getElementById('side') || !document.getElementById('toggle')) {
      console.error('[Lithosite Shell] Missing required sidebar/toggle DOM.');
      return false;
    }

    return true;
  }

  function readInitialScreen() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && SCREENS[saved]) return saved;
    } catch (_) {}
    return 'Dashboard';
  }

  function ensureUserGuide() {
    if (document.getElementById('userGuideLauncher')) return;

    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    if (!document.getElementById('userGuideStyles')) {
      const stylesheet = document.createElement('link');
      stylesheet.id = 'userGuideStyles';
      stylesheet.rel = 'stylesheet';
      stylesheet.href = '../ui/shared/user-guide.css?v=20261006';
      document.head.appendChild(stylesheet);
    }

    const launcher = document.createElement('a');
    launcher.id = 'userGuideLauncher';
    launcher.className = 'user-guide-launcher';
    launcher.href = '../docs/lithosite/02_Mine-Services/10_User-Guides/1.HowTo_Uji_KPI_Grader.pdf';
    launcher.target = '_blank';
    launcher.rel = 'noopener';
    launcher.title = 'How To Use';
    launcher.setAttribute('aria-label', 'How To Use');
    launcher.textContent = '?';

    topbar.appendChild(launcher);
  }

  function init() {
    if (initialized) return true;
    if (!validateShellContract()) return false;

    initialized = true;

    const side = document.getElementById('side');
    const toggle = document.getElementById('toggle');

    if (toggle && side) {
      toggle.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        side.classList.toggle('expanded');
      });
    }

    const nav = document.querySelector('.sidebar .nav');
    ensureUserGuide();

    if (nav) {
      nav.addEventListener('click', function (event) {
        const item = event.target.closest('.nav-item');
        if (!item || !nav.contains(item)) return;

        event.preventDefault();
        event.stopPropagation();

        const screen = item.getAttribute('data-screen');
        if (screen && SCREENS[screen]) {
          setScreen(screen);
          return;
        }

        const labelNode = item.querySelector('.nav-text');
        const label = labelNode ? labelNode.textContent.trim() : '';
        if (label === 'Data Manage' && global.LithositeDataManagement) {
          global.LithositeDataManagement.open();
          return;
        }
        window.alert(label + ' module belum tersedia pada Desktop Master.');
      });
    }

    setScreen(readInitialScreen(), false);
    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  global.LithositeShellNavigation = Object.freeze({
    init,
    setScreen,
    screens: SCREENS,
    getCurrentScreen: function () { return currentScreen; }
  });
})(window);
