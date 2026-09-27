// ============================================================
// API.JS -- Fungsi fetch & network utilities
// ============================================================

// Konstanta GOOGLE_SCRIPT_READ_URL dan FETCH_TIMEOUT_MS ada di config.js

function withReadAuthToken(url) {
  const rawUrl = String(url || '');
  if (/[?&](sessionToken|devToken)=/i.test(rawUrl)) return rawUrl;
  const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
  const memberToken = (localStorage.getItem('mine_member_token') || '').trim();
  const token = devToken || memberToken;
  if (!token) return rawUrl;
  const key = devToken ? 'devToken' : 'sessionToken';
  return rawUrl + (rawUrl.indexOf('?') >= 0 ? '&' : '?') + key + '=' + encodeURIComponent(token);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = window.FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const method = String(options.method || 'GET').toUpperCase();
    const requestUrl = method === 'GET' ? withReadAuthToken(url) : url;
    return await fetch(requestUrl, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// MEMBANGUN PAYLOAD UNTUK POST
// ============================================================
function buildAuthenticatedPayload(source, options) {
  options = options || {};
  let payload;
  if (source instanceof HTMLFormElement) {
    payload = new URLSearchParams(new FormData(source));
  } else if (source instanceof URLSearchParams) {
    payload = new URLSearchParams(source);
  } else if (source && typeof source === 'object') {
    payload = new URLSearchParams(source);
  } else {
    payload = new URLSearchParams();
  }

  // 🔥 getCentralAuthToken() diambil dari auth.js (single source of truth)
  const token = window.getCentralAuthToken(options);
  payload.delete('sessionToken');
  payload.delete('devToken');

  if (options.developerOnly) {
    payload.set('devToken', token);
  } else {
    payload.set('sessionToken', token);
  }
  return payload;
}

async function postCentralAuthenticated(source, options) {
  options = options || {};
  const payload = buildAuthenticatedPayload(source, options);
  const needsLoading = !!options.developerOnly && options.showLoading !== false;
  if (needsLoading) {
    showAppLoading(
      window.translations && window.translations[currentLang]
        ? window.translations[currentLang].dev_operation_loading_title
        : 'Memproses...',
      window.translations && window.translations[currentLang]
        ? window.translations[currentLang].dev_operation_loading_message
        : 'Mohon tunggu...'
    );
  }
  try {
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL, {
      method: 'POST',
      body: payload
    });
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      throw new Error('Response server tidak valid (bukan JSON). HTTP ' + response.status);
    }
    if (!response.ok) {
      throw new Error(result && result.message ? result.message : ('HTTP ' + response.status));
    }
    return result;
  } finally {
    if (needsLoading) hideAppLoading();
  }
}

async function postDeveloperAdmin(action, params) {
  if (!isDeveloperUnlocked()) {
    throw new Error(
      (window.translations && window.translations[currentLang]
        ? window.translations[currentLang].compact_error_prefix
        : 'Akses Developer terkunci.')
    );
  }
  const payload = new URLSearchParams(params || {});
  payload.set('action', action);
  const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
  payload.set('devToken', devToken);
  showAppLoading(
    window.translations && window.translations[currentLang]
      ? window.translations[currentLang].dev_operation_loading_title
      : 'Memproses...',
    window.translations && window.translations[currentLang]
      ? window.translations[currentLang].dev_operation_loading_message
      : 'Mohon tunggu...'
  );
  try {
    const response = await fetchWithTimeout(window.GOOGLE_SCRIPT_READ_URL, {
      method: 'POST',
      body: payload
    });
    const result = await response.json();
    if (!result || (result.status !== 'success' && result.success !== true && result.ok === false)) {
      throw new Error(
        (result && result.message) ||
        (currentLang === 'en' ? 'Developer operation failed.' : 'Operasi Developer gagal.')
      );
    }
    return result;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error(
        currentLang === 'en'
          ? 'Server did not respond within 20 seconds (timeout).'
          : 'Server tidak merespons dalam 20 detik (timeout).'
      );
    }
    throw err;
  } finally {
    hideAppLoading();
  }
}

// ============================================================
// EXPOSE KE GLOBAL WINDOW
// ============================================================
window.withReadAuthToken = withReadAuthToken;
window.fetchWithTimeout = fetchWithTimeout;
window.buildAuthenticatedPayload = buildAuthenticatedPayload;
window.postCentralAuthenticated = postCentralAuthenticated;
window.postDeveloperAdmin = postDeveloperAdmin;