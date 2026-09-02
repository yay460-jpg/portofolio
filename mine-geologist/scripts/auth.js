// ============================================================
// AUTH.JS -- Login, logout, session, token management
// ============================================================

// ============================================================
// STATE VARIABLES
// ============================================================

let lastMemberTokenRotationAt = 0;
let lastDeveloperTokenRotationAt = 0;
let lastSecurityUserActivityAt = Date.now();
let memberLoginInFlight = false;
let sessionIdleWarningEl = null;
let memberSessionValidationSeq = 0;

// ============================================================
// DEVELOPER ACCESS HELPERS
// ============================================================

function isDeveloperUnlocked() {
  const token = localStorage.getItem('mine_dev_token');
  if (!token) return false;
  const expiresAt = localStorage.getItem('mine_dev_expires_at');
  if (expiresAt) {
    const expiresMs = new Date(expiresAt).getTime();
    if (!isNaN(expiresMs) && Date.now() >= expiresMs) return false;
  }
  return true;
}

function getCurrentExportRole() {
  if ((localStorage.getItem('mine_dev_token') || '').trim()) return 'DEVELOPER';
  const role = (localStorage.getItem('mine_member_role_id') || '').trim().toUpperCase();
  return role || 'PUBLIC';
}

// ============================================================
// SINGLE SOURCE OF TRUTH: GET AUTH TOKEN
// ============================================================

function getCentralAuthToken(options) {
  options = options || {};
  const memberToken = (localStorage.getItem('mine_member_token') || '').trim();
  const devToken = (localStorage.getItem('mine_dev_token') || '').trim();

  // FIX: Prioritaskan devToken jika tersedia.
  // Developer adalah role tertinggi, bisa melakukan semua yang Member bisa.
  if (devToken) return devToken;

  // Fallback ke memberToken jika tidak ada devToken.
  return memberToken;
}

// ============================================================
// USER ACTIVITY & IDLE
// ============================================================

function markSecurityUserActivity() {
  lastSecurityUserActivityAt = Date.now();
}

function getClientIdleLimitMinutes() {
  const role = String(localStorage.getItem('mine_member_role_id') || '').toUpperCase();
  if (localStorage.getItem('mine_dev_token')) return 60;
  if (role === 'DEVELOPER') return 60;
  return 30;
}

function resumeMemberLoginCountdown() {
  // Placeholder: jika ada fitur countdown di masa depan
}

function invalidateSessionCache(token) {
  token = String(token || '').trim();
  if (!token) return;
  // CacheService hanya tersedia di Google Apps Script.
  // Di browser, invalidasi cache server tidak dilakukan.
}

// ============================================================
// QUEUE OPERATIONS (Anti Race Condition)
// ============================================================

let developerSessionOperationChain = Promise.resolve();

function queueDeveloperSessionOperation(task) {
  const run = developerSessionOperationChain.then(task, task);
  developerSessionOperationChain = run.catch(function(){});
  return run;
}

let memberSessionOperationChain = Promise.resolve();

function queueMemberSessionOperation(task) {
  const run = memberSessionOperationChain.then(task, task);
  memberSessionOperationChain = run.catch(function () {});
  return run;
}

// ============================================================
// SESSION ROTATION (FIX: Developer → devToken, Member → sessionToken)
// ============================================================

async function rotateStoredSession(storagePrefix, tokenKey, expiresKey, sessionKey, rotationStateKey) {
  const token = (localStorage.getItem(tokenKey) || '').trim();
  if (!token) return false;

  // 🔥 FIX: Developer → devToken, Member → sessionToken
  const tokenParam = (storagePrefix === 'developer') ? 'devToken' : 'sessionToken';

  try {
    const payload = new URLSearchParams({
      action: 'rotateSession',
      [tokenParam]: token  // ← Parameter sesuai role
    });

    const response = await fetch(window.GOOGLE_SCRIPT_READ_URL, {
      method: 'POST',
      body: payload
    });
    const result = await response.json();

    if (!result.success || !result.token) {
      const msg = String(result && result.message || '').toLowerCase();
      if (msg.includes('tidak valid') || msg.includes('tidak aktif') || msg.includes('expired') ||
          msg.includes('kedaluwarsa') || msg.includes('session tidak ditemukan')) {
        if ((localStorage.getItem(tokenKey) || '').trim() === token) {
          [tokenKey, expiresKey, sessionKey].forEach(function(key) { localStorage.removeItem(key); });
        }
        if (storagePrefix === 'member') renderMemberSessionAvatar();
        if (storagePrefix === 'developer') updateDeveloperAccessUI();
      }
      return false;
    }

    localStorage.setItem(tokenKey, result.token);
    if (result.session_id) localStorage.setItem(sessionKey, result.session_id);
    if (result.expires_at) localStorage.setItem(expiresKey, result.expires_at);

    if (storagePrefix === 'member') renderMemberSessionAvatar();
    if (storagePrefix === 'developer') updateDeveloperAccessUI();

    if (rotationStateKey === 'lastMemberTokenRotationAt') lastMemberTokenRotationAt = Date.now();
    else if (rotationStateKey === 'lastDeveloperTokenRotationAt') lastDeveloperTokenRotationAt = Date.now();

    return true;
  } catch (error) {
    console.warn('Token rotation skipped:', error);
    return false;
  }
}

async function rotateActiveSecurityTokens() {
  if (Date.now() - lastSecurityUserActivityAt > window.TOKEN_ROTATION_ACTIVITY_WINDOW_MS) return;
  const now = Date.now();

  if (localStorage.getItem('mine_member_token') && now - lastMemberTokenRotationAt >= window.TOKEN_ROTATION_INTERVAL_MS) {
    await queueMemberSessionOperation(async function() {
      if (localStorage.getItem('mine_member_token')) {
        await rotateStoredSession('member', 'mine_member_token', 'mine_member_expires_at',
                                  'mine_member_session_id', 'lastMemberTokenRotationAt');
      }
    });
  }

  if (localStorage.getItem('mine_dev_token') && now - lastDeveloperTokenRotationAt >= window.TOKEN_ROTATION_INTERVAL_MS) {
    await queueDeveloperSessionOperation(async function() {
      if (localStorage.getItem('mine_dev_token')) {
        await rotateStoredSession('developer', 'mine_dev_token', 'mine_dev_expires_at',
                                  'mine_dev_session_id', 'lastDeveloperTokenRotationAt');
      }
    });
  }
}

// ============================================================
// DEVELOPER LOGIN / LOGOUT
// ============================================================

async function unlockDeveloperAccess() {
  const loginInput = document.getElementById('dev-login-id-input');
  const emailInput = document.getElementById('dev-email-input');
  const input = document.getElementById('dev-pin-input');
  const errorMsg = document.getElementById('dev-pin-error');
  const login_id = (loginInput ? loginInput.value : '').trim();
  const email = (emailInput ? emailInput.value : '').trim();
  const pin = input.value.trim();

  if (!login_id || !email || !/^[0-9]{6}$/.test(pin)) {
    errorMsg.textContent = window.currentLang === 'en' ?
      'Login_ID, registered email, and 6-digit PIN are required.' :
      'Login_ID, email terdaftar, dan PIN 6 digit wajib diisi.';
    errorMsg.classList.remove('hidden');
    return;
  }

  errorMsg.classList.add('hidden');
  input.disabled = true;
  if (loginInput) loginInput.disabled = true;
  if (emailInput) emailInput.disabled = true;
  setLoginButtonLoading('dev-login-submit', 'dev-login-spinner', true);

  try {
    const payload = new URLSearchParams({
      action: 'verifyDevPin',
      login_id: login_id,
      email: email,
      pin: pin,
      client_info: navigator.userAgent.slice(0, 180)
    });
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL, {
      method: 'POST',
      body: payload
    }, window.FETCH_TIMEOUT_MS);
    const result = await response.json();

    if (result.success && result.token) {
      localStorage.setItem('mine_dev_token', result.token);
      localStorage.setItem('mine_dev_session_id', result.session_id || '');
      localStorage.setItem('mine_dev_expires_at', result.expires_at || '');
      localStorage.setItem('mine_user_id', result.user_id || '');
      localStorage.setItem('mine_role_id', result.role_id || '');
      localStorage.setItem('mine_user_name', result.user_name || '');
      loadActiveMemberSessions();
      input.value = '';
      errorMsg.classList.add('hidden');
      updateDeveloperAccessUI();
      openDeveloperConsoleModal();
      loadMembersFromSheet().catch(function(err){
        console.warn('Refresh Member grid setelah Developer login ditunda/gagal:', err);
      });
    } else {
      errorMsg.textContent = result.message || (window.currentLang === 'en' ?
        'Developer login failed.' : 'Login Developer gagal.');
      errorMsg.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error login:', error);
    errorMsg.textContent = window.currentLang === 'en' ?
      'Could not reach server. Try again.' : 'Tidak bisa menghubungi server. Coba lagi.';
    errorMsg.classList.remove('hidden');
  } finally {
    input.disabled = false;
    if (loginInput) loginInput.disabled = false;
    if (emailInput) emailInput.disabled = false;
    setLoginButtonLoading('dev-login-submit', 'dev-login-spinner', false);
  }
}

function lockDeveloperAccess() {
  closeDeveloperConsoleModal();
  const token = localStorage.getItem('mine_dev_token');
  if (token) {
    showAppLoading(
      window.currentLang === 'en' ? 'Locking Developer Access' : 'Mengunci Akses Developer',
      window.currentLang === 'en' ? 'Please wait...' : 'Mohon tunggu...'
    );
    // 🔥 FIX: Developer logout pakai devToken
    const payload = new URLSearchParams({
      action: 'logoutSession',
      devToken: token
    });
    fetch(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }).catch(function(){});
    hideAppLoading();
  }
  ['mine_dev_token', 'mine_dev_session_id', 'mine_dev_expires_at',
   'mine_user_id', 'mine_role_id', 'mine_user_name'].forEach(key => localStorage.removeItem(key));
  updateDeveloperAccessUI();
  loadMembersFromSheet();
}

// ============================================================
// MEMBER LOGIN / LOGOUT
// ============================================================

function openMemberLoginModal() {
  const modal = document.getElementById('member-login-modal');
  const status = document.getElementById('member-login-status');
  if (status) {
    status.className = 'hidden text-xs font-medium leading-relaxed';
    status.textContent = '';
  }
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  const login = document.getElementById('member-login-id-input');
  if (login) setTimeout(() => { login.focus(); resumeMemberLoginCountdown(); }, 50);
}

function closeMemberLoginModal() {
  const modal = document.getElementById('member-login-modal');
  hideModalAnimated(modal);
}

function setMemberLoginStatus(message, ok) {
  const status = document.getElementById('member-login-status');
  if (!status) return;
  status.className = ok ? 'text-xs font-medium leading-relaxed text-emerald-400' :
                         'text-xs font-medium leading-relaxed text-rose-400';
  status.textContent = message || '';
  status.classList.remove('hidden');
}

async function submitMemberLogin(event) {
  event.preventDefault();
  if (memberLoginInFlight) return;

  const loginInput = document.getElementById('member-login-id-input');
  const emailInput = document.getElementById('member-login-email-input');
  const pinInput = document.getElementById('member-login-pin-input');
  const login_id = (loginInput ? loginInput.value : '').trim();
  const email = (emailInput ? emailInput.value : '').trim();
  const pin = (pinInput ? pinInput.value : '').replace(/\D/g, '').slice(0, 6);
  if (pinInput && pinInput.value !== pin) pinInput.value = pin;

  if (!login_id || !email || !/^[0-9]{6}$/.test(pin)) {
    setMemberLoginStatus(
      window.currentLang === 'en' ? 'Login_ID, registered email, and 6-digit PIN are required.' :
      'Login_ID, email terdaftar, dan PIN 6 digit wajib diisi.',
      false
    );
    return;
  }

  memberLoginInFlight = true;
  setLoginButtonLoading('member-login-submit', 'member-login-spinner', true,
                        'member-login-label', window.currentLang === 'en' ? 'Logging in...' : 'Masuk...');

  try {
    const payload = new URLSearchParams({
      action: 'verifyMemberPin',
      login_id: login_id,
      email: email,
      pin: pin,
      client_info: navigator.userAgent.slice(0, 180)
    });
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL, {
      method: 'POST',
      body: payload
    }, window.FETCH_TIMEOUT_MS);
    const result = await response.json();

    if (result.success && result.token) {
      localStorage.setItem('mine_member_token', result.token);
      localStorage.setItem('mine_member_session_id', result.session_id || '');
      localStorage.setItem('mine_member_expires_at', result.expires_at || '');
      localStorage.setItem('mine_member_user_id', result.user_id || '');
      localStorage.setItem('mine_member_login_id', result.login_id || login_id);
      localStorage.setItem('mine_member_role_id', result.role_id || '');
      localStorage.setItem('mine_member_user_name', result.user_name || '');
      localStorage.setItem('mine_member_avatar_url', result.avatar_url || '');
      localStorage.setItem('mine_member_must_change_pin', result.must_change_pin || '');
      renderMemberSessionAvatar();
      setMemberLoginStatus(
        window.currentLang === 'en' ? 'Login successful!' : 'Login berhasil!',
        true
      );
      setTimeout(() => {
        closeMemberLoginModal();
        if (typeof loadMembersFromSheet === 'function') loadMembersFromSheet();
      }, 600);
    } else {
      setMemberLoginStatus(
        result.message || (window.currentLang === 'en' ? 'Member login failed.' : 'Login Member gagal.'),
        false
      );
    }
  } catch (error) {
    console.error('Member login error:', error);
    setMemberLoginStatus(
      window.currentLang === 'en' ? 'Server error. Try again.' : 'Error server. Coba lagi.',
      false
    );
  } finally {
    memberLoginInFlight = false;
    setLoginButtonLoading('member-login-submit', 'member-login-spinner', false, 'member-login-label');
  }
}

function logoutMemberSession(event) {
  if (event) event.stopPropagation();
  const token = (localStorage.getItem('mine_member_token') || '').trim();
  const menu = document.getElementById('member-session-menu');
  if (menu) menu.classList.add('hidden');

  if (token) {
    const payload = new URLSearchParams({
      action: 'logoutSession',
      sessionToken: token  // ← Member pakai sessionToken
    });
    fetch(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }).catch(function(){});
  }

  ['mine_member_token', 'mine_member_session_id', 'mine_member_user_id',
   'mine_member_login_id', 'mine_member_role_id', 'mine_member_user_name',
   'mine_member_avatar_url', 'mine_member_must_change_pin'].forEach(key => localStorage.removeItem(key));

  renderMemberSessionAvatar();
  updateDeveloperAccessUI();
  loadMembersFromSheet();
}

// ============================================================
// MEMBER SESSION AVATAR
// ============================================================

function renderMemberSessionAvatar() {
  const wrap = document.getElementById('member-session-avatar-wrap');
  const box = document.getElementById('member-session-avatar');
  const img = document.getElementById('member-session-avatar-img');
  const initials = document.getElementById('member-session-avatar-initials');
  const menu = document.getElementById('member-session-menu');
  const menuName = document.getElementById('member-session-menu-name');
  const menuLogin = document.getElementById('member-session-menu-login');
  if (!wrap || !box || !img || !initials) return;

  const token = (localStorage.getItem('mine_member_token') || '').trim();
  const loginId = (localStorage.getItem('mine_member_login_id') || '').trim();
  const userName = (localStorage.getItem('mine_member_user_name') || '').trim();
  const avatarUrl = (localStorage.getItem('mine_member_avatar_url') || '').trim();

  if (!token || !loginId) {
    wrap.classList.add('hidden');
    box.classList.add('hidden');
    box.classList.remove('flex');
    if (menu) menu.classList.add('hidden');
    img.src = '';
    img.classList.add('hidden');
    initials.classList.add('hidden');
    initials.textContent = '';
    return;
  }

  wrap.classList.remove('hidden');
  box.classList.remove('hidden');
  box.classList.add('flex');

  const initialsText = memberInitials(userName, loginId);
  initials.textContent = initialsText;
  initials.classList.remove('hidden');

  if (avatarUrl) {
    img.src = avatarUrl;
    img.onload = function() {
      img.classList.remove('hidden');
      initials.classList.add('hidden');
    };
    img.onerror = function() {
      img.classList.add('hidden');
      initials.classList.remove('hidden');
    };
  } else {
    img.classList.add('hidden');
    initials.classList.remove('hidden');
  }

  if (menu) {
    menu.classList.add('hidden');
    if (menuName) menuName.textContent = userName || loginId;
    if (menuLogin) {
      menuLogin.textContent = window.currentLang === 'en' ? 'Logout' : 'Logout';
      menuLogin.onclick = function(e) {
        e.stopPropagation();
        logoutMemberSession(e);
      };
    }
  }

  box.onclick = function(e) {
    e.stopPropagation();
    if (menu) menu.classList.toggle('hidden');
  };

  document.addEventListener('click', function() {
    if (menu) menu.classList.add('hidden');
  });
}

// ============================================================
// SESSION VALIDATION (Refresh & Heartbeat)
// ============================================================

async function refreshMemberSecuritySession() {
  return queueMemberSessionOperation(async function() {
    const token = (localStorage.getItem('mine_member_token') || '').trim();
    if (!token) { renderMemberSessionAvatar(); return false; }

    const validationSeq = ++memberSessionValidationSeq;
    try {
      const payload = new URLSearchParams({
        action: 'validateSession',
        sessionToken: token,
        touch: '0'  // ← Tidak update Last_Seen
      });
      const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL, {
        method: 'POST',
        body: payload
      });
      const result = await response.json();

      const currentToken = (localStorage.getItem('mine_member_token') || '').trim();
      if (validationSeq !== memberSessionValidationSeq || currentToken !== token) {
        return currentToken === token;
      }

      if (!result.success) {
        const msg = String(result && result.message || '').toLowerCase();
        const explicitInvalid = [
          'session tidak ditemukan', 'token session tidak valid',
          'session tidak valid', 'session tidak aktif',
          'session sudah berakhir', 'session expired',
          'user tidak aktif', 'credential tidak ditemukan',
          'credential tidak aktif', 'role session sudah berubah'
        ].some(function(marker) { return msg.indexOf(marker) >= 0; });
        if (explicitInvalid) {
          ['mine_member_token', 'mine_member_session_id', 'mine_member_expires_at',
           'mine_member_user_id', 'mine_member_login_id', 'mine_member_role_id',
           'mine_member_user_name', 'mine_member_avatar_url',
           'mine_member_must_change_pin'].forEach(key => localStorage.removeItem(key));
          renderMemberSessionAvatar();
          return false;
        }
        console.warn('Member session validation returned non-explicit failure; preserving local session:', result.message || result);
        return true;
      }
      return true;
    } catch (error) {
      console.warn('Member session validation skipped:', error);
      return true;
    }
  });
}

async function refreshSecuritySession() {
  return queueDeveloperSessionOperation(async function() {
    const token = (localStorage.getItem('mine_dev_token') || '').trim();
    if (!token) { updateDeveloperAccessUI(); return false; }
    try {
      // 🔥 FIX: Developer validation pakai devToken
      const payload = new URLSearchParams({
        action: 'validateSession',
        devToken: token,
        touch: '0'  // ← Tidak update Last_Seen
      });
      const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL, {
        method: 'POST',
        body: payload
      });
      const result = await response.json();
      if (!result.success) {
        if ((localStorage.getItem('mine_dev_token') || '').trim() === token) {
          ['mine_dev_token', 'mine_dev_session_id', 'mine_dev_expires_at',
           'mine_user_id', 'mine_role_id', 'mine_user_name'].forEach(key => localStorage.removeItem(key));
        }
        updateDeveloperAccessUI();
        return false;
      }
      updateDeveloperAccessUI();
      return true;
    } catch (e) {
      console.warn('Developer session validation skipped:', e);
      updateDeveloperAccessUI();
      return false;
    }
  });
}

// ============================================================
// IDLE WARNING
// ============================================================

function ensureSessionIdleWarning() {
  if (sessionIdleWarningEl) return sessionIdleWarningEl;
  const el = document.createElement('div');
  el.id = 'session-idle-warning';
  el.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;display:none;max-width:min(92vw,520px);padding:12px 14px;border:1px solid rgba(245,158,11,.45);border-radius:12px;background:rgba(15,23,42,.96);box-shadow:0 10px 30px rgba(0,0,0,.35);color:#fff;font:600 13px/1.35 system-ui,sans-serif;';
  el.innerHTML = '<span id="session-idle-warning-text"></span><button id="session-idle-warning-btn" type="button" style="margin-left:10px;padding:6px 10px;border-radius:8px;border:1px solid rgba(245,158,11,.55);background:rgba(245,158,11,.16);color:#fde68a;font-weight:700;cursor:pointer">' +
    (window.currentLang === 'en' ? 'Stay Logged In' : 'Tetap Login') + '</button>';
  document.body.appendChild(el);
  el.querySelector('#session-idle-warning-btn').addEventListener('click', function() {
    markSecurityUserActivity();
    el.style.display = 'none';
    rotateActiveSecurityTokens().catch(function(err) {
      console.warn('Session keep-alive skipped:', err);
    });
  });
  sessionIdleWarningEl = el;
  return el;
}

function updateSessionIdleWarning() {
  if (document.visibilityState !== 'visible') return;
  const hasSession = !!(localStorage.getItem('mine_member_token') || localStorage.getItem('mine_dev_token'));
  if (!hasSession) {
    if (sessionIdleWarningEl) sessionIdleWarningEl.style.display = 'none';
    return;
  }
  const idleLimitMs = getClientIdleLimitMinutes() * 60000;
  const warningMs = window.SESSION_IDLE_WARNING_MINUTES * 60000;
  const idleFor = Date.now() - lastSecurityUserActivityAt;
  const el = ensureSessionIdleWarning();
  if (idleFor >= Math.max(0, idleLimitMs - warningMs) && idleFor < idleLimitMs) {
    const remain = Math.max(1, Math.ceil((idleLimitMs - idleFor) / 60000));
    el.querySelector('#session-idle-warning-text').textContent =
      (window.translations && window.translations[window.currentLang] ?
        window.translations[window.currentLang].session_idle_warning :
        'Session akan berakhir dalam {minutes} menit.').replace('{minutes}', remain);
    el.querySelector('#session-idle-warning-btn').textContent =
      window.currentLang === 'en' ? 'Stay Logged In' : 'Tetap Login';
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

// ============================================================
// EXPOSE FUNCTIONS KE GLOBAL WINDOW
// ============================================================

window.isDeveloperUnlocked = isDeveloperUnlocked;
window.getCurrentExportRole = getCurrentExportRole;
window.getCentralAuthToken = getCentralAuthToken;  // ← SINGLE SOURCE OF TRUTH
window.markSecurityUserActivity = markSecurityUserActivity;
window.rotateActiveSecurityTokens = rotateActiveSecurityTokens;
window.unlockDeveloperAccess = unlockDeveloperAccess;
window.lockDeveloperAccess = lockDeveloperAccess;
window.openMemberLoginModal = openMemberLoginModal;
window.closeMemberLoginModal = closeMemberLoginModal;
window.submitMemberLogin = submitMemberLogin;
window.renderMemberSessionAvatar = renderMemberSessionAvatar;
window.logoutMemberSession = logoutMemberSession;
window.updateSessionIdleWarning = updateSessionIdleWarning;
window.refreshMemberSecuritySession = refreshMemberSecuritySession;
window.refreshSecuritySession = refreshSecuritySession;
window.queueMemberSessionOperation = queueMemberSessionOperation;
window.queueDeveloperSessionOperation = queueDeveloperSessionOperation;
window.rotateStoredSession = rotateStoredSession;

// ======= RESTORASI DARI BASELINE (fungsi hilang di MG1) =======

// [RESTORED from baseline/core.js] closeDeveloperConsoleTechnicalModal
 function closeDeveloperConsoleTechnicalModal() {
  const modal = document.getElementById('developer-console-technical-modal');
  hideModalAnimated(modal);
 }

// [RESTORED from baseline/core.js] closeDeveloperProfileModal
 function closeDeveloperProfileModal() {
 const modal = document.getElementById('developer-profile-modal');
 hideModalAnimated(modal);
 }

// [RESTORED from baseline/core.js] openDeveloperConsoleTechnicalModal
 // BARU (27 Agu): Control Technical -- pola open/close identik dgn Control Sistem,
 // cuma target modal & container identity beda. updateDeveloperAccessUI() dipanggil
 // di sini juga karena fungsi itu men-toggle SEMUA panel Developer berdasarkan ID,
 // tidak peduli panel itu ada di modal Sistem atau Technical.
 function openDeveloperConsoleTechnicalModal() {
  if (!isDeveloperUnlocked()) {
   showNoticeModal(currentLang === 'en' ? 'Developer Access Locked' : 'Akses Developer Terkunci', currentLang === 'en' ? 'Unlock Developer Access first.' : 'Buka Akses Developer terlebih dahulu.');
   return;
  }
  const modal = document.getElementById('developer-console-technical-modal');
  const identity = document.getElementById('developer-console-technical-identity');
  const name = (localStorage.getItem('mine_user_name') || localStorage.getItem('mine_user_id') || 'Developer').trim();
  if (identity) identity.textContent = (currentLang === 'en' ? 'Access active as: ' : 'Akses aktif sebagai: ') + name;
  updateDeveloperAccessUI();
  showModalAnimated(modal);
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
 }

// [RESTORED from baseline/core.js] openDeveloperProfileModal
 function openDeveloperProfileModal() {
 const modal = document.getElementById('developer-profile-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }
