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
    Reports: 'reportsScreen',
    Settings: 'settingsScreen'
  });

  const STORAGE_KEY = 'lithosite-v30-active-screen';
  const SETTINGS_KEY = 'lithosite-v30-settings';
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
    const required = ['Dashboard', 'Operations', 'Equipment', 'Work Front', 'Maintenance', 'Issues', 'Plans', 'HSE', 'Reports', 'Settings'];
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

  function readPreferences() {
    let preferences = { motion: 'normal', defaultScreen: 'Dashboard' };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) preferences = Object.assign(preferences, JSON.parse(raw));
    } catch (_) {}
    if (!SCREENS[preferences.defaultScreen]) preferences.defaultScreen = 'Dashboard';
    if (preferences.motion !== 'reduced') preferences.motion = 'normal';
    return preferences;
  }

  function applyPreferences() {
    const preferences = readPreferences();
    document.documentElement.classList.toggle('reduced-motion', preferences.motion === 'reduced');
    return preferences;
  }

  function readInitialScreen() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && SCREENS[saved]) return saved;
    } catch (_) {}
    return readPreferences().defaultScreen;
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

    // Preferences are local UI state only; they never mutate the XLSX database.
    applyPreferences();
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
    getCurrentScreen: function () { return currentScreen; },
    applyPreferences
  });
})(window);

