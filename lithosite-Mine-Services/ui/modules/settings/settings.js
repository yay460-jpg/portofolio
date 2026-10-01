(function (global) {
  'use strict';

  const STORAGE_KEY = 'lithosite-v30-settings';

  function readPreferences() {
    let settings = { motion: 'normal', defaultScreen: 'Dashboard', sidebarStartup: 'compact' };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) settings = Object.assign(settings, JSON.parse(raw));
    } catch (_) {}
    return settings;
  }

  function load() {
    const settings = readPreferences();
    const motion = document.getElementById('settingsMotion');
    const defaultScreen = document.getElementById('settingsDefaultScreen');
    const sidebarStartup = document.getElementById('settingsSidebarStartup');

    if (motion) motion.value = settings.motion;
    if (defaultScreen) defaultScreen.value = settings.defaultScreen;
    if (sidebarStartup) sidebarStartup.value = settings.sidebarStartup || 'compact';
  }

  function save() {
    const motion = document.getElementById('settingsMotion');
    const defaultScreen = document.getElementById('settingsDefaultScreen');
    const sidebarStartup = document.getElementById('settingsSidebarStartup');

    const settings = {
      motion: motion ? motion.value : 'normal',
      defaultScreen: defaultScreen ? defaultScreen.value : 'Dashboard',
      sidebarStartup: sidebarStartup ? sidebarStartup.value : 'compact'
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) {}

    if (global.LithositeShellNavigation) {
      global.LithositeShellNavigation.applyPreferences();
    }

    const message = document.getElementById('settingsMessage');
    if (message) {
      message.textContent = 'Local preferences saved. XLSX database is unchanged.';
    }
  }

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}

    load();

    if (global.LithositeShellNavigation) {
      global.LithositeShellNavigation.applyPreferences();
    }

    const message = document.getElementById('settingsMessage');
    if (message) message.textContent = 'Local preferences reset.';
  }

  function init() {
    load();

    ['settingsMotion', 'settingsDefaultScreen', 'settingsSidebarStartup'].forEach(function (id) {
      const element = document.getElementById(id);
      if (element) element.addEventListener('change', save);
    });

    const resetButton = document.getElementById('settingsReset');
    if (resetButton) resetButton.addEventListener('click', reset);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  global.LithositeSettings = Object.freeze({
    init,
    load,
    save,
    reset
  });
})(window);
