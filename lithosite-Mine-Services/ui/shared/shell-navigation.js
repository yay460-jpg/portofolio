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
    launcher.href = '#';
    launcher.title = 'How To Use';
    launcher.setAttribute('aria-label', 'How To Use');
    launcher.textContent = '?';
    launcher.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleUserGuideModal();
    });

    topbar.appendChild(launcher);
  }

  function toggleUserGuideModal() {
    let modal = document.getElementById('userGuideModal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'userGuideModal';
      modal.className = 'user-guide-modal';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML =
        '<div class="user-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="userGuideTitle">' +
          '<div class="user-guide-head">' +
            '<div><b id="userGuideTitle">How To Use</b><span>Mine Services User Guides</span></div>' +
            '<button type="button" class="control user-guide-close" id="userGuideClose" aria-label="Close">×</button>' +
          '</div>' +
          '<div class="user-guide-body">' +
            '<button type="button" class="user-guide-item" data-guide-url="/user-guide?file=1.HowTo_Uji_KPI_Grader.pdf" data-guide-title="How To Use — Uji KPI Grader">' +
              '<span class="user-guide-item-icon">?</span>' +
              '<span><b>How To Use — Uji KPI Grader</b><small>Work Front → Equipment → Operations → Validation → Timeline Integrity → KPI → Fleet → Dashboard</small></span>' +
              '<span class="user-guide-open">Open ↗</span>' +
            '</button>' +
            '<button type="button" class="user-guide-item" data-guide-url="/user-guide?file=0.Xample_Uji_Grader.pdf" data-guide-title="Example — Uji Grader">' +
              '<span class="user-guide-item-icon">✓</span>' +
              '<span><b>Example — Uji Grader</b><small>Example evidence and test reference for the KPI Grader flow.</small></span>' +
              '<span class="user-guide-open">Open ↗</span>' +
            '</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(modal);

      document.getElementById('userGuideClose').addEventListener('click', function () {
        toggleUserGuideModal();
      });

      modal.addEventListener('click', function (event) {
        if (event.target === modal) toggleUserGuideModal();
      });

      modal.querySelectorAll('.user-guide-item').forEach(function (item) {
        item.addEventListener('click', function () {
          openUserGuideReader(item.getAttribute('data-guide-url'), item.getAttribute('data-guide-title'));
        });
      });
    }

    const visible = modal.classList.toggle('show');
    modal.setAttribute('aria-hidden', String(!visible));
  }

  function openUserGuideReader(url, title) {
    let reader = document.getElementById('userGuideReaderModal');

    if (!reader) {
      reader = document.createElement('div');
      reader.id = 'userGuideReaderModal';
      reader.className = 'user-guide-reader-modal';
      reader.setAttribute('aria-hidden', 'true');
      reader.innerHTML =
        '<div class="user-guide-reader-dialog" role="dialog" aria-modal="true" aria-labelledby="userGuideReaderTitle">' +
          '<div class="user-guide-reader-head">' +
            '<div><b id="userGuideReaderTitle">How To Use</b><span id="userGuideReaderMeta">PDF Reader</span></div>' +
            '<button type="button" class="control user-guide-close" id="userGuideReaderClose" aria-label="Close">×</button>' +
          '</div>' +
          '<div class="user-guide-reader-body"><iframe id="userGuideReaderFrame" title="User Guide PDF Reader"></iframe></div>' +
        '</div>';
      document.body.appendChild(reader);

      document.getElementById('userGuideReaderClose').addEventListener('click', function () {
        closeUserGuideReader();
      });
      reader.addEventListener('click', function (event) {
        if (event.target === reader) closeUserGuideReader();
      });
    }

    document.getElementById('userGuideReaderTitle').textContent = title || 'How To Use';
    document.getElementById('userGuideReaderMeta').textContent = 'Inline PDF Reader · Loading…';
    const frame = document.getElementById('userGuideReaderFrame');

    reader.classList.add('show');
    reader.setAttribute('aria-hidden', 'false');

    const guideMenu = document.getElementById('userGuideModal');
    if (guideMenu) {
      guideMenu.classList.remove('show');
      guideMenu.setAttribute('aria-hidden', 'true');
    }

    if (frame._userGuideObjectUrl) {
      URL.revokeObjectURL(frame._userGuideObjectUrl);
      frame._userGuideObjectUrl = null;
    }

    document.getElementById('userGuideReaderMeta').textContent = 'Inline PDF Reader · Loading…';

    fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (payload) {
        if (!payload || payload.status !== 'READY' || payload.mime !== 'application/pdf' || !payload.data) {
          throw new Error('User guide payload is not a PDF');
        }
        const raw = atob(payload.data);
        const bytes = new Uint8Array(raw.length);
        for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
        const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        frame._userGuideObjectUrl = objectUrl;
        frame.src = objectUrl + '#zoom=page-width';
        document.getElementById('userGuideReaderMeta').textContent = 'Inline PDF Reader · Fit Width';
      })
      .catch(function (error) {
        frame.removeAttribute('src');
        document.getElementById('userGuideReaderMeta').textContent = 'Unable to load PDF inline';
        console.error('[Lithosite User Guide] PDF load failed:', error);
      });
  }

  function closeUserGuideReader() {
    const reader = document.getElementById('userGuideReaderModal');
    if (!reader) return;
    reader.classList.remove('show');
    reader.setAttribute('aria-hidden', 'true');
    const frame = document.getElementById('userGuideReaderFrame');
    if (frame) {
      frame.src = 'about:blank';
      if (frame._userGuideObjectUrl) {
        URL.revokeObjectURL(frame._userGuideObjectUrl);
        frame._userGuideObjectUrl = null;
      }
    }
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
