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
    if (global.LithositeNavigationGuardContract &&
        !global.LithositeNavigationGuardContract.guard()) {
      return false;
    }
    if (global.LithositeModalShowContract) {
      global.LithositeModalShowContract.closeTransient();
    }
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
      stylesheet.href = '../ui/shared/user-guide.css?v=20261007';
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

  function ensureAppInfo() {
    if (document.getElementById('appInfoLauncher')) return;

    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    if (!document.getElementById('appInfoStyles')) {
      const stylesheet = document.createElement('link');
      stylesheet.id = 'appInfoStyles';
      stylesheet.rel = 'stylesheet';
      stylesheet.href = '../ui/shared/app-info.css?v=20261008';
      document.head.appendChild(stylesheet);
    }

    const launcher = document.createElement('a');
    launcher.id = 'appInfoLauncher';
    launcher.className = 'app-info-launcher';
    launcher.href = '#';
    launcher.title = 'Version & Developer';
    launcher.setAttribute('aria-label', 'Version & Developer');
    launcher.textContent = 'i';
    launcher.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleAppInfo();
    });

    topbar.appendChild(launcher);
  }

  function toggleAppInfo() {
    let modal = document.getElementById('appInfoModal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'appInfoModal';
      modal.className = 'app-info-modal';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML =
        '<div class="app-info-dialog" role="dialog" aria-modal="true" aria-labelledby="appInfoTitle">' +
          '<div class="app-info-head">' +
            '<div><b id="appInfoTitle">About Mine Services</b><span>Application information</span></div>' +
            '<button type="button" class="control app-info-close" id="appInfoClose" aria-label="Close">×</button>' +
          '</div>' +
          '<div class="app-info-body">' +
            '<div class="app-info-row"><span class="app-info-label"><span class="app-info-label-wrap"><span class="app-info-label-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 20h8"/><path d="M12 18v2"/></svg></span><span>Application</span></span></span><span class="app-info-value"><span class="brand-litho">Litho</span><span class="brand-site">site</span> | Mine Services Development</span></div>' +
            '<div class="app-info-row"><span class="app-info-label"><span class="app-info-label-wrap"><span class="app-info-label-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg></span><span>Version</span></span></span><span class="app-info-value accent">V37 · Stage 26</span></div>' +
            '<div class="app-info-row"><span class="app-info-label"><span class="app-info-label-wrap"><span class="app-info-label-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/></svg></span><span>Artifact</span></span></span><span class="app-info-value">Mine Services Concept 2 · Operations</span></div>' +
            '<div class="app-info-row"><span class="app-info-label"><span class="app-info-label-wrap"><span class="app-info-label-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/></svg></span><span>Runtime</span></span></span><span class="app-info-value">A.3 · Desktop Master</span></div>' +
            '<div class="app-info-row"><span class="app-info-label"><span class="app-info-label-wrap"><span class="app-info-label-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.3 3-5 7-5s6.2 1.7 7 5"/></svg></span><span>Developer</span></span></span><span class="app-info-value"><span class="developer-name">Lithosite Team</span> | Sanjaya</span></div>' +
            '<div class="app-info-note">Version and runtime information for the current application workspace.</div>' +
          '</div>' +
        '</div>';

      document.body.appendChild(modal);

      document.getElementById('appInfoClose').addEventListener('click', function () {
        toggleAppInfo();
      });

      modal.addEventListener('click', function (event) {
        if (event.target === modal) toggleAppInfo();
      });
    }

    const visible = global.LithositeModalShowContract
      ? global.LithositeModalShowContract.isVisible(modal)
      : modal.classList.contains('show');

    if (visible) {
      if (global.LithositeModalShowContract) {
        global.LithositeModalShowContract.close('appInfoModal');
      } else {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
      }
    } else if (global.LithositeModalShowContract) {
      global.LithositeModalShowContract.show('appInfoModal');
    } else {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }
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
            '<button type="button" class="user-guide-item" data-guide-url="../user-guide?file=1.HowTo_Uji_KPI_Grader.pdf" data-guide-title="How To Use — Uji KPI Grader">' +
              '<span class="user-guide-item-icon">?</span>' +
              '<span><b>How To Use — Uji KPI Grader</b><small>Work Front → Equipment → Operations → Validation → Timeline Integrity → KPI → Fleet → Dashboard</small></span>' +
              '<span class="user-guide-open">Open ↗</span>' +
            '</button>' +
            '<button type="button" class="user-guide-item" data-guide-url="../user-guide?file=2.HowTo_Uji_KPI_Dump_Truck.pdf" data-guide-title="How To Use — Uji KPI Dump Truck">' +
              '<span class="user-guide-item-icon">?</span>' +
              '<span><b>How To Use — Uji KPI Dump Truck</b><small>Guide for the KPI Dump Truck test flow.</small></span>' +
              '<span class="user-guide-open">Open ↗</span>' +
            '</button>' +
            '<button type="button" class="user-guide-item" data-guide-url="../user-guide?file=0.Xample_Uji_Grader.pdf" data-guide-title="Example — Uji Grader">' +
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

    const visible = global.LithositeModalShowContract
      ? global.LithositeModalShowContract.isVisible(modal)
      : modal.classList.contains('show');

    if (visible) {
      if (global.LithositeModalShowContract) {
        global.LithositeModalShowContract.close('userGuideModal');
      } else {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
      }
    } else if (global.LithositeModalShowContract) {
      global.LithositeModalShowContract.show('userGuideModal');
    } else {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }
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

    if (global.LithositeModalShowContract) {
      global.LithositeModalShowContract.show('userGuideReaderModal');
    } else {
      reader.classList.add('show');
      reader.setAttribute('aria-hidden', 'false');
    }

    const guideMenu = document.getElementById('userGuideModal');
    if (guideMenu) {
      if (global.LithositeModalShowContract) {
        global.LithositeModalShowContract.close('userGuideModal');
      } else {
        guideMenu.classList.remove('show');
        guideMenu.setAttribute('aria-hidden', 'true');
      }
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
    if (global.LithositeModalShowContract) {
      global.LithositeModalShowContract.close('userGuideReaderModal');
    } else {
      reader.classList.remove('show');
      reader.setAttribute('aria-hidden', 'true');
    }
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

    if (global.LithositeModalShowContract) global.LithositeModalShowContract.init();
    if (global.LithositeNavigationGuardContract) global.LithositeNavigationGuardContract.init();

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
    ensureAppInfo();

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
