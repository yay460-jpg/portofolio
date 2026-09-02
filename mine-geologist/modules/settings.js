// ============================================================
// SETTINGS.JS -- Modul Settings & Developer Console
// ============================================================

// ============================================================
// CREDENTIAL MANAGER (Developer)
// ============================================================

async function openCredentialManager() {
  if (!window.isDeveloperUnlocked || !window.isDeveloperUnlocked()) {
    window.showNoticeModal(
      window.currentLang === 'en' ? 'Developer Access Locked' : 'Akses Developer Terkunci',
      window.currentLang === 'en' ? 'Unlock Developer Access first.' : 'Buka Akses Developer terlebih dahulu.'
    );
    return;
  }
  const modal = document.getElementById('credential-manager-modal');
  window.showModalAnimated(modal);
  await loadCredentialProvisionCandidates();
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeCredentialManager() {
  const modal = document.getElementById('credential-manager-modal');
  window.hideModalAnimated(modal);
}

function setCredentialManagerStatus(message, ok) {
  const el = document.getElementById('credential-manager-status');
  if (!el) return;
  el.className = 'mb-3 text-xs font-medium ' + (ok ? 'text-emerald-400' : 'text-rose-400');
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
}

function credentialEsc(v) {
  const d = document.createElement('div');
  d.textContent = v == null ? '' : String(v);
  return d.innerHTML;
}

async function loadCredentialProvisionCandidates() {
  const container = document.getElementById('credential-manager-list');
  if (!container) return;
  setCredentialManagerStatus('', true);
  container.innerHTML = '<div class="text-center py-8 text-slate-500 text-xs">' +
    (window.currentLang === 'en' ? 'Loading Users without Credentials...' : 'Memuat User yang belum memiliki Credential...') +
  '</div>';
  try {
    const result = await window.postCentralAuthenticated(
      { action: 'listMissingCredentials' },
      { developerOnly: true }
    );
    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to load the Credential list.' : 'Gagal mengambil daftar Credential.'));
    }
    const rows = Array.isArray(result.data) ? result.data : [];
    if (!rows.length) {
      container.innerHTML = '<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center text-emerald-400 text-xs font-semibold">' +
        (window.currentLang === 'en' ? 'All active Users already have Credentials.' : 'Semua User aktif sudah memiliki Credential.') +
      '</div>';
      return;
    }
    container.innerHTML = rows.map(function(u, i) {
      const defaultLogin = (u.email || '').toString().split('@')[0].replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40);
      return `
        <div class="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4" data-credential-user="${credentialEsc(u.user_id)}">
          <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr_1.4fr_1fr_1fr_auto] gap-3 items-end">
            <div>
              <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">User_ID</div>
              <div class="text-xs text-title font-bold mt-1">${credentialEsc(u.user_id)}</div>
            </div>
            <div>
              <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">${window.currentLang === 'en' ? 'Name' : 'Nama'}</div>
              <div class="text-xs text-title font-semibold mt-1">${credentialEsc(u.name || '-')}</div>
            </div>
            <div>
              <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Role / Email</div>
              <div class="text-xs text-title font-semibold mt-1">${credentialEsc(u.role_id || '-')}</div>
              <div class="text-[10px] text-slate-400 mt-0.5 truncate" title="${credentialEsc(u.email || '')}">${credentialEsc(u.email || '-')}</div>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Login_ID</label>
              <input id="cred-login-${i}" type="text" maxlength="40" value="${credentialEsc(defaultLogin)}" class="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-title focus:outline-none focus:border-indigo-500" placeholder="Login_ID">
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">${window.currentLang === 'en' ? '6-digit PIN' : 'PIN 6 digit'}</label>
              <input id="cred-pin-${i}" type="password" inputmode="numeric" maxlength="6" class="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-title focus:outline-none focus:border-indigo-500" placeholder="••••••">
            </div>
            <button onclick="window.provisionExistingCredential(${i}, '${credentialEsc(u.user_id)}')" class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap">
              <i data-lucide="key-round" class="w-3.5 h-3.5"></i> ${window.currentLang === 'en' ? 'Create Credential' : 'Buat Credential'}
            </button>
          </div>
        </div>`;
    }).join('');
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  } catch (err) {
    console.error('Credential Manager:', err);
    container.innerHTML = `<div class="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-400 text-xs font-medium">${credentialEsc(err.message || (window.currentLang === 'en' ? 'Failed to load data.' : 'Gagal memuat data.'))}</div>`;
  }
}

// ============================================================
// PROVISION EXISTING CREDENTIAL (dari auth.js yang sudah ada)
// ============================================================

window.provisionExistingCredential = async function(index, userId) {
  const loginEl = document.getElementById('cred-login-' + index);
  const pinEl = document.getElementById('cred-pin-' + index);
  const loginId = (loginEl?.value || '').trim();
  const pin = String(pinEl?.value || '').replace(/\D/g, '').slice(0, 6);
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(loginId)) {
    setCredentialManagerStatus(
      window.currentLang === 'en' ? 'Login_ID must be 3-40 characters and use only letters, numbers, dot, underscore, or hyphen.' : 'Login_ID harus 3-40 karakter dan hanya huruf, angka, titik, garis bawah, atau tanda minus.',
      false
    );
    loginEl?.focus();
    return;
  }
  if (!/^\d{6}$/.test(pin)) {
    setCredentialManagerStatus(
      window.currentLang === 'en' ? 'PIN must be exactly 6 digits.' : 'PIN harus tepat 6 digit angka.',
      false
    );
    pinEl?.focus();
    return;
  }
  try {
    const result = await window.postCentralAuthenticated({
      action: 'provisionExistingCredential',
      user_id: userId,
      login_id: loginId,
      pin: pin
    }, { developerOnly: true });
    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Credential creation failed.' : 'Credential gagal dibuat.'));
    }
    setCredentialManagerStatus(
      (window.currentLang === 'en' ? 'Credential created for ' : 'Credential berhasil dibuat untuk ') + userId + ' (' + result.credential_id + ').',
      true
    );
    await loadCredentialProvisionCandidates();
  } catch (err) {
    console.error('Provision credential:', err);
    setCredentialManagerStatus(
      err.message || (window.currentLang === 'en' ? 'Credential creation failed.' : 'Credential gagal dibuat.'),
      false
    );
  } finally {
    if (pinEl) pinEl.value = '';
  }
};

// ============================================================
// RESET MEMBER PIN (Developer)
// ============================================================

window.submitResetMemberPin = async function() {
  const elUserId = document.getElementById('reset-member-pin-userid');
  const elPin = document.getElementById('reset-member-pin-new');
  const elConfirm = document.getElementById('reset-member-pin-confirm');
  const elStatus = document.getElementById('reset-member-pin-status');
  if (!elUserId || !elPin || !elConfirm || !elStatus) return;
  const userId = elUserId.value.trim();
  const pin = elPin.value.trim();
  const confirmPin = elConfirm.value.trim();

  function setStatus(msg, ok) {
    elStatus.textContent = msg;
    elStatus.className = 'text-[10px] font-medium mt-2 ' + (ok ? 'text-emerald-400' : 'text-rose-400');
  }

  if (!userId) {
    setStatus(window.currentLang === 'en' ? 'User_ID is required.' : 'User_ID wajib diisi.', false);
    return;
  }
  if (!/^[0-9]{6}$/.test(pin)) {
    setStatus(window.currentLang === 'en' ? 'PIN must be 6 digits.' : 'PIN harus 6 digit angka.', false);
    return;
  }
  if (pin !== confirmPin) {
    setStatus(window.currentLang === 'en' ? 'PIN confirmation does not match.' : 'Ulangi PIN tidak cocok.', false);
    return;
  }
  setStatus(window.currentLang === 'en' ? 'Saving...' : 'Menyimpan...', true);
  try {
    const result = await window.postCentralAuthenticated(
      { action: 'setMemberPin', user_id: userId, pin: pin },
      { developerOnly: true }
    );
    if (result.success) {
      setStatus((window.currentLang === 'en' ? 'PIN saved for ' : 'PIN tersimpan utk ') + userId + '.', true);
      elPin.value = '';
      elConfirm.value = '';
    } else {
      setStatus(result.message || (window.currentLang === 'en' ? 'Failed to save PIN.' : 'Gagal menyimpan PIN.'), false);
    }
  } catch (err) {
    setStatus((window.currentLang === 'en' ? 'Server error: ' : 'Error server: ') + (err && err.message ? err.message : String(err)), false);
  }
};

// ============================================================
// CHAT SENDER SYNC
// ============================================================

function syncChatSenderToLoggedInUser() {
  const select = document.getElementById('chat-sender-select');
  if (!select) return;
  const identity = window.getLoggedInChatIdentity ? window.getLoggedInChatIdentity() : { sender: '', role: '' };
  select.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = identity.sender;
  opt.textContent = identity.sender || (window.currentLang === 'en' ? 'Member login required' : 'Login Member diperlukan');
  select.appendChild(opt);
  select.value = identity.sender;
  select.disabled = true;
  select.classList.add('opacity-80', 'cursor-not-allowed');
  if (identity.sender) localStorage.setItem('mine_chat_sender', identity.sender);
}

// ============================================================
// OPEN / CLOSE MODAL SETTINGS (yang spesifik)
// ============================================================

function openRegionalTimeModal() {
  const modal = document.getElementById('regional-time-modal');
  if (!modal) return;
  if (typeof window.applyRegionalTimeSettings === 'function') {
    window.applyRegionalTimeSettings(window.regionalTimeSettings || window.REGIONAL_TIME_DEFAULTS);
  }
  const modalStatus = document.getElementById('regional-time-modal-status');
  if (modalStatus) {
    modalStatus.innerText = window.currentLang === 'en' ? 'Current saved configuration.' : 'Konfigurasi tersimpan saat ini.';
  }
  window.showModalAnimated(modal);
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeRegionalTimeModal() {
  window.hideModalAnimated(document.getElementById('regional-time-modal'));
}

// ============================================================
// EXPOSE FUNCTIONS KE GLOBAL WINDOW
// ============================================================
window.openCredentialManager = openCredentialManager;
window.closeCredentialManager = closeCredentialManager;
window.loadCredentialProvisionCandidates = loadCredentialProvisionCandidates;
window.syncChatSenderToLoggedInUser = syncChatSenderToLoggedInUser;
window.openRegionalTimeModal = openRegionalTimeModal;
window.closeRegionalTimeModal = closeRegionalTimeModal;

// ======= RESTORASI DARI BASELINE (fungsi hilang di MG1) =======

// [RESTORED from baseline/core.js] applyApiAbuseGuardPolicyToControls
// BARU (Security hardening -- rate limit perluasan, DIPUTUSKAN 22 Agu): panel toggle API
// Abuse Guard -- pola LOAD/SAVE identik dgn Session Cache di atas, cuma target endpoint beda.
function applyApiAbuseGuardPolicyToControls(policy) {
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=String(value);};
 const check=(id,value)=>{const el=document.getElementById(id);if(el)el.checked=!!value;};
 if(!policy) return;
 check('api-abuse-guard-enabled',policy.enabled); set('api-abuse-guard-max',policy.maxRequests||90); set('api-abuse-guard-window',policy.windowSec||60);
}

// [RESTORED from baseline/core.js] applyResetProjectRetentionGuard
// BARU (Pending item #2 dari pihak A, DIPUTUSKAN user 22 Agu -- Opsi A): saat Retention &
// Archive aktif (toggle #retention-enabled tercentang), 14 checkbox operasional Reset Total
// DIKUNCI TERCENTANG (dipaksa ikut semua, tidak bisa di-uncheck) -- supaya Reset Total selalu
// full-wipe konsisten, tidak ada sheet yang kelewat kecentang saat pindah proyek sungguhan.
// ChatLog SENGAJA DIKECUALIKAN dari guard ini -- dia sudah punya mekanisme retensi terpisah
// sendiri (opt-in toggle #retention-chat-enabled + hari), jadi tetap bebas dipilih Developer
// sesuai kebutuhan (mis. mau dipertahankan lintas proyek atau tidak). Member (#reset-project-
// member) juga TIDAK disentuh guard ini -- sudah punya opsi khusus sendiri (preserve baris
// Developer), di luar cakupan "14 checkbox operasional" yang dimaksud spesifikasi ini.
// Guard ini MURNI pencegahan human-error di frontend -- Reset Total & Retention/Archive
// TIDAK PERNAH tabrakan secara teknis (beda sheet, dan LockService.getDocumentLock() di
// backend sudah otomatis mengantre kalau kebetulan jalan bersamaan).
function applyResetProjectRetentionGuard() {
 const retentionToggle = document.getElementById('retention-enabled');
 const guardActive = !!(retentionToggle && retentionToggle.checked);
 document.querySelectorAll('.reset-project-target').forEach(function(el) {
  if (el.value === 'ChatLog') return; // dikecualikan -- retensi ChatLog sudah opt-in terpisah
  if (guardActive) {
   el.checked = true;
   el.disabled = true;
  } else {
   el.disabled = false;
  }
 });
 const hint = document.getElementById('reset-project-guard-hint');
 if (hint) hint.classList.toggle('hidden', !guardActive);
 updateResetProjectButton();
}

// [RESTORED from baseline/core.js] applyRetentionPolicyToControls
function applyRetentionPolicyToControls(policy) {
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=String(value);};
 const check=(id,value)=>{const el=document.getElementById(id);if(el)el.checked=!!value;};
 if(!policy) return;
 check('retention-enabled',policy.enabled); set('retention-sessions-days',policy.sessionsDays||7);
 set('retention-security-days',policy.securityAuditDays||90); set('retention-audit-days',policy.auditTrailDays||90);
 check('retention-chat-enabled',policy.chatLogEnabled); set('retention-chat-days',policy.chatLogDays||90);
 applyResetProjectRetentionGuard();
}

// [RESTORED from baseline/core.js] applySessionCachePolicyToControls
// BARU (Pending item #1 spesifikasi performa, DIPUTUSKAN 22 Agu): panel toggle Session Cache
// -- pola LOAD/SAVE identik dgn Retention & Archive di atas, cuma target endpoint beda.
function applySessionCachePolicyToControls(policy) {
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=String(value);};
 const check=(id,value)=>{const el=document.getElementById(id);if(el)el.checked=!!value;};
 if(!policy) return;
 check('session-cache-enabled',policy.enabled); set('session-cache-ttl',policy.ttlSeconds||20);
}

// [RESTORED from baseline/core.js] autoSyncLatestChangelogToSheet
 // Auto-sync versi terbaru ke sheet "Changelog" -- dipicu diam-diam tiap modal Riwayat
 // Update dibuka (bukan nunggu klik manual). Cuma jalan kalau Developer sudah unlock
 // (butuh devToken buat POST), dan cuma kirim kalau versi ini BELUM ada di sheet (dicek
 // dulu lewat GET, supaya tidak dobel-catat tiap kali modal dibuka berulang).
 async function autoSyncLatestChangelogToSheet() {
 if (!isDeveloperUnlocked()) return;
 try {
  const latest = CHANGELOG_DATA[0];
  if (!latest) return;
  const latestVersion = typeof latest.version === 'object' ? latest.version.id : latest.version;

  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=changelog&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') return;

  const alreadySynced = (result.data || []).some(v => v.version === latestVersion);
  if (alreadySynced) return;

  const itemsPayload = latest.items.map(it => ({ id: it.id, en: it.en }));
  const payload = buildAuthenticatedPayload({
  action: 'addChangelogEntry',
  version: latestVersion,
  items_json: JSON.stringify(itemsPayload)
  }, { developerOnly: true });
  const syncResponse = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const syncResult = await syncResponse.json();
  if (syncResult.status === 'success') {
  console.log('Changelog versi', latestVersion, 'berhasil disinkron otomatis ke Sheets.');
  }
 } catch (err) {
  console.error('Auto-sync changelog gagal (akan dicoba lagi lain kali modal dibuka):', err);
 }
 }

// [RESTORED from baseline/core.js] cacheRegionalTimeSettings
 function cacheRegionalTimeSettings(cfg) {
  try { localStorage.setItem(REGIONAL_TIME_STORAGE_KEY, JSON.stringify(normalizeRegionalTimeConfig(cfg))); } catch (e) {}
 }

// [RESTORED from baseline/core.js] cleanupGeneralSheet
async function cleanupGeneralSheet(sheetName) {
  if (!isDeveloperUnlocked()) return;
  const text = sheetName === 'Sessions' ? 'Bersihkan Sessions lain? Session Developer yang sedang aktif akan dipertahankan.' : `Bersihkan seluruh isi ${sheetName}?`;
  if (!(await showConfirmModal(currentLang === 'en' ? 'Cleanup Data' : 'Cleanup Data', text))) return;
  try {
    const result=await postDeveloperAdmin('developerCleanupGeneral',{target:sheetName});
    const status=document.getElementById('general-cleanup-status');
    if(status) status.textContent=(result.count||0)+' row dibersihkan';
  } catch(e){ showNoticeModal('Cleanup Gagal',e.message); }
}

// [RESTORED from baseline/core.js] clearDeveloperSessionStorageIfCurrent
function clearDeveloperSessionStorageIfCurrent(token) {
   if (token && (localStorage.getItem('mine_dev_token') || '').trim() !== token) return false;
   ['mine_dev_token','mine_dev_session_id','mine_dev_expires_at','mine_user_id','mine_role_id','mine_user_name'].forEach(function(key){localStorage.removeItem(key);});
   return true;
  }

// [RESTORED from baseline/core.js] closeChangelogModal
 function closeChangelogModal() {
 const modal = document.getElementById('changelog-modal');
 hideModalAnimated(modal);
 }

// [RESTORED from baseline/core.js] closeGuideModal
 function closeGuideModal() {
 hideModalAnimated(document.getElementById('guide-rekonsiliasi-modal'));
 }

// [RESTORED from baseline/core.js] executeCompactBlankRows
async function executeCompactBlankRows() {
 if(!isDeveloperUnlocked()) return;
 const select=document.getElementById('compact-sheet-select');
 const status=document.getElementById('compact-preview-status');
 if(!select || !status) return;
 const sheet=select.value;
 if(compactPreviewState.sheet!==sheet || compactPreviewState.blankRows.length<1) {
  status.textContent=translations[currentLang].compact_status_preview_required;
  updateCompactExecuteButton();
  return;
 }
 const count=compactPreviewState.blankRows.length;
 const ok=await showConfirmModal(translations[currentLang].compact_confirm_title,translations[currentLang].compact_confirm_message.replace('{count}',String(count)).replace('{sheet}',sheet));
 if(!ok) return;
 const btn=document.getElementById('btn-compact-execute');
 if(btn){btn.disabled=true;btn.classList.add('opacity-50');}
 status.textContent=translations[currentLang].compact_status_executing;
 try {
  const result=await postDeveloperAdmin('compactBlankRows',{sheet:sheet});
  status.textContent=translations[currentLang].compact_status_success.replace('{sheet}',sheet).replace('{before}',String(result.rows_before||0)).replace('{removed}',String(result.blank_rows_removed||0)).replace('{after}',String(result.rows_after||0));
  compactPreviewState={sheet:'',totalRows:0,blankRows:[]};
  updateCompactExecuteButton();
 } catch(e) {
  status.textContent=translations[currentLang].compact_error_prefix+' '+e.message;
  updateCompactExecuteButton();
 }
}

// [RESTORED from baseline/core.js] formatDateInAppTimezone_
 // v90.2.138 FIX (temuan audit #4 -- "2 sumber waktu"): SEBELUMNYA getLocalPeriodeYyyyMm/
 // getLocalDateYyyyMmDd pakai getter LOKAL BROWSER (getFullYear/getMonth/getDate) -- kalau
 // timezone PC/HP user beda dari APP_TIMEZONE yg dikonfigurasi backend (jarang di Indonesia,
 // tapi bukan mustahil -- laptop disetel UTC, VPN, dll), "bulan berjalan" versi
 // frontend & backend bisa beda tepat di sekitar pergantian bulan/hari. Sekarang KEDUANYA
 // format tanggal berdasarkan `regionalTimeSettings.timezone` (di-cache dari APP_TIMEZONE
 // backend via loadRegionalTimeSettings() saat app dibuka) -- 1 sumber kebenaran waktu yg
 // SAMA dgn backend, bukan lagi 2 sumber terpisah. Fallback ke getter browser HANYA kalau
 // regionalTimeSettings belum sempat termuat (race sangat awal) atau timezone string rusak.
 function formatDateInAppTimezone_(dateObj) {
  const d = dateObj || new Date();
  const tz = (typeof regionalTimeSettings !== 'undefined' && regionalTimeSettings && regionalTimeSettings.timezone) || 'Asia/Jakarta';
  try {
   const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
   const map = {};
   parts.forEach(p => { map[p.type] = p.value; });
   if (map.year && map.month && map.day) return { year: map.year, month: map.month, day: map.day };
  } catch (e) { /* fallback di bawah kalau timezone string invalid/regionalTimeSettings blm siap */ }
  return { year: String(d.getFullYear()), month: String(d.getMonth() + 1).padStart(2, '0'), day: String(d.getDate()).padStart(2, '0') };
 }

// [RESTORED from baseline/core.js] loadApiAbuseGuardPolicy
async function loadApiAbuseGuardPolicy() {
 if(!isDeveloperUnlocked()) return;
 try { const result=await postDeveloperAdmin('getApiAbuseGuardPolicy',{}); applyApiAbuseGuardPolicyToControls(result.policy); }
 catch(e) { const status=document.getElementById('api-abuse-guard-status'); if(status)status.textContent=(currentLang === 'en' ? 'Policy could not be loaded: ' : 'Kebijakan belum dapat dimuat: ')+e.message; }
}

// [RESTORED from baseline/core.js] loadRetentionPolicy
async function loadRetentionPolicy() {
 if(!isDeveloperUnlocked()) return;
 try { const result=await postDeveloperAdmin('getRetentionPolicy',{}); applyRetentionPolicyToControls(result.policy); }
 catch(e) { const status=document.getElementById('retention-policy-status'); if(status)status.textContent=(currentLang === 'en' ? 'Policy could not be loaded: ' : 'Kebijakan belum dapat dimuat: ')+e.message; }
}

// [RESTORED from baseline/core.js] loadSessionCachePolicy
async function loadSessionCachePolicy() {
 if(!isDeveloperUnlocked()) return;
 try { const result=await postDeveloperAdmin('getSessionCachePolicy',{}); applySessionCachePolicyToControls(result.policy); }
 catch(e) { const status=document.getElementById('session-cache-status'); if(status)status.textContent=(currentLang === 'en' ? 'Policy could not be loaded: ' : 'Kebijakan belum dapat dimuat: ')+e.message; }
}

// [RESTORED from baseline/core.js] normalizeRegionalTimeConfig
 function normalizeRegionalTimeConfig(cfg) {
  const source = cfg || {};
  return {
   timezone: source.timezone || REGIONAL_TIME_DEFAULTS.timezone,
   locale: source.locale || REGIONAL_TIME_DEFAULTS.locale,
   dateFormat: source.dateFormat || REGIONAL_TIME_DEFAULTS.dateFormat,
   timeFormat: source.timeFormat || REGIONAL_TIME_DEFAULTS.timeFormat
  };
 }

// [RESTORED from baseline/core.js] openChangelogModal
 function openChangelogModal() {
 document.getElementById('app-version-label').innerText = APP_VERSION;
 document.getElementById('app-version-label-modal').innerText = APP_VERSION;
 renderChangelogEntries();
 const modal = document.getElementById('changelog-modal');
 showModalAnimated(modal);
 // Selalu mulai dari kondisi tertutup (hanya versi terbaru) tiap modal dibuka ulang
 const olderVersions = document.getElementById('changelog-older-versions');
 const toggleBtn = document.getElementById('btn-toggle-changelog-history');
 if (olderVersions) olderVersions.classList.add('hidden');
 if (toggleBtn) toggleBtn.querySelector('span').innerText = (currentLang === 'en') ? 'View All History' : 'Lihat Semua Riwayat';
 lucide.createIcons();
 autoSyncLatestChangelogToSheet(); // fire-and-forget, tidak menunda modal terbuka
 }

// [RESTORED from baseline/core.js] openGuideModal
 function openGuideModal() {
 const modal = document.getElementById('guide-rekonsiliasi-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

// [RESTORED from baseline/core.js] previewCompactBlankRows
async function previewCompactBlankRows() {
 if(!isDeveloperUnlocked()) return;
 const select=document.getElementById('compact-sheet-select');
 const status=document.getElementById('compact-preview-status');
 if(!select || !status) return;
 const sheet=select.value;
 status.textContent=translations[currentLang].compact_status_loading;
 compactPreviewState={sheet:'',totalRows:0,blankRows:[]};
 updateCompactExecuteButton();
 try {
  const result=await postDeveloperAdmin('previewCompactBlankRows',{sheet:sheet});
  const rows=Array.isArray(result.blank_row_numbers)?result.blank_row_numbers:[];
  compactPreviewState={sheet:sheet,totalRows:Number(result.total_rows||0),blankRows:rows};
  if(rows.length===0) {
   status.textContent=translations[currentLang].compact_status_none.replace('{sheet}',sheet).replace('{rows}',String(result.total_rows||0));
  } else {
   const list=rows.join(', ');
   status.textContent=translations[currentLang].compact_status_ready.replace('{count}',String(rows.length)).replace('{sheet}',sheet).replace('{rows}',String(result.total_rows||0)).replace('{list}',list);
  }
  updateCompactExecuteButton();
 } catch(e) {
  compactPreviewState={sheet:'',totalRows:0,blankRows:[]};
  status.textContent=translations[currentLang].compact_error_prefix+' '+e.message;
  updateCompactExecuteButton();
 }
}

// [RESTORED from baseline/produksi.js] provisionExistingCredential
async function provisionExistingCredential(index, userId) {
 const loginEl = document.getElementById('cred-login-' + index);
 const pinEl = document.getElementById('cred-pin-' + index);
 const loginId = (loginEl?.value || '').trim();
 const pin = String(pinEl?.value || '').replace(/\D/g, '').slice(0, 6);
 if (!/^[A-Za-z0-9._-]{3,40}$/.test(loginId)) {
  setCredentialManagerStatus(currentLang === 'en' ? 'Login_ID must be 3-40 characters and use only letters, numbers, dot, underscore, or hyphen.' : 'Login_ID harus 3-40 karakter dan hanya huruf, angka, titik, garis bawah, atau tanda minus.', false);
  loginEl?.focus();
  return;
 }
 if (!/^\d{6}$/.test(pin)) {
  setCredentialManagerStatus(currentLang === 'en' ? 'PIN must be exactly 6 digits.' : 'PIN harus tepat 6 digit angka.', false);
  pinEl?.focus();
  return;
 }
 try {
  const result = await postCentralAuthenticated({
   action: 'provisionExistingCredential',
   user_id: userId,
   login_id: loginId,
   pin: pin
  }, { developerOnly: true });
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Credential creation failed.' : 'Credential gagal dibuat.'));
  setCredentialManagerStatus((currentLang === 'en' ? 'Credential created for ' : 'Credential berhasil dibuat untuk ') + userId + ' (' + result.credential_id + ').', true);
  await loadCredentialProvisionCandidates();
 } catch (err) {
  console.error('Provision credential:', err);
  setCredentialManagerStatus(err.message || (currentLang === 'en' ? 'Credential creation failed.' : 'Credential gagal dibuat.'), false);
 } finally {
  if (pinEl) pinEl.value = '';
 }
}

// [RESTORED from baseline/core.js] readCachedRegionalTimeSettings
 function readCachedRegionalTimeSettings() {
  try {
   const raw = localStorage.getItem(REGIONAL_TIME_STORAGE_KEY);
   if (!raw) return null;
   return normalizeRegionalTimeConfig(JSON.parse(raw));
  } catch (e) { return null; }
 }

// [RESTORED from baseline/core.js] regionalTimeConfigEquals
 function regionalTimeConfigEquals(a, b) {
  const x = normalizeRegionalTimeConfig(a);
  const y = normalizeRegionalTimeConfig(b);
  return x.timezone === y.timezone && x.locale === y.locale && x.dateFormat === y.dateFormat && x.timeFormat === y.timeFormat;
 }

// [RESTORED from baseline/core.js] renderActiveSessionsIndicator
function renderActiveSessionsIndicator(sessionsOverride) {
 const wrap = document.getElementById('active-sessions-indicator-wrap');
 const list = document.getElementById('active-sessions-avatar-list');
 if (!wrap || !list) return;

 if (Array.isArray(sessionsOverride)) activeMemberSessions = sessionsOverride.slice();
 let sessions = Array.isArray(activeMemberSessions) ? activeMemberSessions.slice() : [];

 const seen = new Set();
 sessions = sessions.filter(function(item) {
  const sid = String(item.session_id || '').trim();
  if (!sid || seen.has(sid)) return false;
  seen.add(sid);
  return true;
 });
 activeMemberSessions = sessions;

 list.innerHTML = '';
 if (!sessions.length) {
  wrap.classList.add('hidden');
  return;
 }

 wrap.classList.remove('hidden');

 sessions.forEach(function(session) {
  const name = String(session.user_name || session.login_id || session.user_id || 'Member').trim();
  const loginId = String(session.login_id || session.user_id || '').trim();
  const avatarUrl = String(session.avatar_url || '').trim();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'active-member-avatar';
  btn.title = (currentLang === 'en' ? 'Active user: ' : 'User aktif: ') + name + (loginId ? ' (' + loginId + ')' : '');
  btn.setAttribute('aria-label', btn.title);
  if (avatarUrl) {
   const img = document.createElement('img');
   img.src = avatarUrl;
   img.alt = name;
   img.onerror = function() { this.replaceWith(document.createTextNode(memberInitials(name, loginId))); };
   btn.appendChild(img);
  } else {
   btn.textContent = memberInitials(name, loginId);
  }
  list.appendChild(btn);
 });
}

// [RESTORED from baseline/core.js] renderChangelogEntries
// ==== BARU (28 Agu): Panel Approval KPIEvent -- muat daftar PENDING, Approve/Reject
// langsung kirim ke action approveKpiEvent. Pengaju yang sama TIDAK BOLEH approve
// pengajuannya sendiri -- backend sudah menolak ini, di sini kita cuma tampilkan pesannya.
 function renderChangelogEntries() {
 const latestEl = document.getElementById('changelog-latest');
 const olderEl = document.getElementById('changelog-older-versions');
 if (!latestEl || !olderEl || !CHANGELOG_DATA.length) return;

 const renderItems = (items) => items.map(it => `<div class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">✅</span> ${(currentLang === 'en' ? it.en : it.id)}</div>`).join('');
 const getVersionLabel = (v) => (typeof v === 'object' ? (currentLang === 'en' ? v.en : v.id) : v);

 const latest = CHANGELOG_DATA[0];
 latestEl.innerHTML = `<div class="text-blue-400 font-bold text-[11px] uppercase tracking-wider mb-2">${getVersionLabel(latest.version)}</div><div class="space-y-2">${renderItems(latest.items)}</div>`;

 olderEl.innerHTML = CHANGELOG_DATA.slice(1).map(entry => `<div class="border-t border-slate-700/50 pt-3"><div class="text-slate-500 font-bold text-[11px] uppercase tracking-wider mb-2">${getVersionLabel(entry.version)}</div><div class="space-y-2">${renderItems(entry.items)}</div></div>`).join('');
 }

// [RESTORED from baseline/core.js] retentionPolicyPayload
function retentionPolicyPayload() {
 const value=id=>{const el=document.getElementById(id);return el?el.value:'';};
 const checked=id=>{const el=document.getElementById(id);return !!(el&&el.checked);};
 return {retention_enabled:checked('retention-enabled')?'TRUE':'FALSE',sessions_retention_days:value('retention-sessions-days'),security_audit_retention_days:value('retention-security-days'),audit_trail_retention_days:value('retention-audit-days'),chatlog_retention_enabled:checked('retention-chat-enabled')?'TRUE':'FALSE',chatlog_retention_days:value('retention-chat-days')};
}

// [RESTORED from baseline/core.js] runRetentionArchiveNow
async function runRetentionArchiveNow() {
 if(!isDeveloperUnlocked()) return;
 if(!(await showConfirmModal(currentLang === 'en' ? 'Run Retention & Archive' : 'Jalankan Retention & Archive', currentLang === 'en' ? 'This will delete non-ACTIVE Sessions that are past their retention period and move old audit logs to the archive sheet. Continue?' : 'Proses akan menghapus Sessions non-ACTIVE yang sudah melewati retensi dan memindahkan log audit lama ke sheet archive. Lanjutkan?'))) return;
 try { const result=await postDeveloperAdmin('runRetentionArchiveNow',{}); const status=document.getElementById('retention-policy-status'); if(result.status==='disabled'){if(status)status.textContent=currentLang === 'en' ? 'Retention is still OFF; no data was processed.' : 'Retention masih OFF; tidak ada data diproses.';return;} const summary=(result.results||[]).map(x=>x.sheet+': '+(x.archived!==undefined?(currentLang === 'en' ? 'archived ' : 'archive ')+x.archived:(currentLang === 'en' ? 'deleted ' : 'hapus ')+(x.deleted||0))).join(' | '); if(status)status.textContent=(currentLang === 'en' ? 'Done — ' : 'Selesai — ')+summary; }
 catch(e) { showNoticeModal(currentLang === 'en' ? 'Retention & Archive Failed' : 'Retention & Archive Gagal',e.message); }
}

// [RESTORED from baseline/core.js] saveApiAbuseGuardPolicy
async function saveApiAbuseGuardPolicy() {
 if(!isDeveloperUnlocked()) return;
 const value=id=>{const el=document.getElementById(id);return el?el.value:'';};
 const checked=id=>{const el=document.getElementById(id);return !!(el&&el.checked);};
 const payload={api_abuse_guard_enabled:checked('api-abuse-guard-enabled')?'TRUE':'FALSE',api_abuse_max_requests:value('api-abuse-guard-max'),api_abuse_window_sec:value('api-abuse-guard-window')};
 try { const result=await postDeveloperAdmin('saveApiAbuseGuardPolicy',payload); applyApiAbuseGuardPolicyToControls(result.policy); const status=document.getElementById('api-abuse-guard-status'); if(status)status.textContent=currentLang === 'en' ? 'Policy saved.' : 'Kebijakan tersimpan.'; }
 catch(e) { showNoticeModal(currentLang === 'en' ? 'Save Policy Failed' : 'Simpan Kebijakan Gagal',e.message); }
}

// [RESTORED from baseline/core.js] saveRegionalTimeSettings
 async function saveRegionalTimeSettings() {
  const status = document.getElementById('regional-time-status');
  const btn = document.getElementById('btn-save-regional-time');
  const cfg = normalizeRegionalTimeConfig({
   timezone: document.getElementById('regional-timezone')?.value,
   locale: document.getElementById('regional-locale')?.value,
   dateFormat: document.getElementById('regional-date-format')?.value,
   timeFormat: document.getElementById('regional-time-format')?.value
  });

  // Saving the already-active configuration is a no-op. This prevents F5/reopen from
  // forcing a fresh Developer login when the user simply clicks Save without changes.
  if (regionalTimeServerLoaded && regionalTimeConfigEquals(cfg, regionalTimeSettings)) {
   cacheRegionalTimeSettings(cfg);
   if (status) status.innerText = currentLang === 'en'
    ? 'Saved: ' + cfg.timezone + ' · ' + cfg.locale
    : 'Tersimpan: ' + cfg.timezone + ' · ' + cfg.locale;
   const modalStatus = document.getElementById('regional-time-modal-status');
   if (modalStatus) modalStatus.innerText = status ? status.innerText : '';
   setTimeout(() => closeRegionalTimeModal(), 150);
   return;
  }

  // WRITE path remains Developer-protected. This preserves the existing security boundary.
  if (!isDeveloperUnlocked()) {
   if (status) status.innerText = currentLang === 'en' ? 'Developer Access required to save changes.' : 'Akses Developer diperlukan untuk menyimpan perubahan.';
   return;
  }
  if (btn) btn.disabled = true;
  try {
   const result = await postCentralAuthenticated({ action: 'updateRegionalTimeSettings', ...cfg }, { developerOnly: true });
   if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save Regional & Time.' : 'Gagal menyimpan Regional & Time.'));
   applyRegionalTimeSettings(result.data || cfg);
   regionalTimeServerLoaded = true;
   cacheRegionalTimeSettings(regionalTimeSettings);
   if (status) status.innerText = currentLang === 'en'
    ? 'Saved: ' + cfg.timezone + ' · ' + cfg.locale
    : 'Tersimpan: ' + cfg.timezone + ' · ' + cfg.locale;
   const modalStatus = document.getElementById('regional-time-modal-status');
   if (modalStatus) modalStatus.innerText = status ? status.innerText : '';
   updateRegionalTimeSummary();
   setTimeout(() => closeRegionalTimeModal(), 250);
  } catch (err) {
   console.error('Regional & Time save failed:', err);
   if (status) status.innerText = err.message || (currentLang === 'en' ? 'Failed to save Regional & Time.' : 'Gagal menyimpan Regional & Time.');
  } finally {
   if (btn) btn.disabled = false;
  }
 }

// [RESTORED from baseline/core.js] saveRetentionPolicy
async function saveRetentionPolicy() {
 if(!isDeveloperUnlocked()) return;
 try { const result=await postDeveloperAdmin('saveRetentionPolicy',retentionPolicyPayload()); applyRetentionPolicyToControls(result.policy); const status=document.getElementById('retention-policy-status'); if(status)status.textContent=currentLang === 'en' ? 'Policy saved. ChatLog stays OFF unless explicitly checked.' : 'Kebijakan tersimpan. ChatLog tetap OFF kecuali dicentang secara eksplisit.'; }
 catch(e) { showNoticeModal(currentLang === 'en' ? 'Save Policy Failed' : 'Simpan Kebijakan Gagal',e.message); }
}

// [RESTORED from baseline/core.js] saveSessionCachePolicy
async function saveSessionCachePolicy() {
 if(!isDeveloperUnlocked()) return;
 const value=id=>{const el=document.getElementById(id);return el?el.value:'';};
 const checked=id=>{const el=document.getElementById(id);return !!(el&&el.checked);};
 const payload={session_cache_enabled:checked('session-cache-enabled')?'TRUE':'FALSE',session_cache_ttl_seconds:value('session-cache-ttl')};
 try { const result=await postDeveloperAdmin('saveSessionCachePolicy',payload); applySessionCachePolicyToControls(result.policy); const status=document.getElementById('session-cache-status'); if(status)status.textContent=currentLang === 'en' ? 'Policy saved.' : 'Kebijakan tersimpan.'; }
 catch(e) { showNoticeModal(currentLang === 'en' ? 'Save Policy Failed' : 'Simpan Kebijakan Gagal',e.message); }
}

// [RESTORED from baseline/core.js] sha256Local
function sha256Local(text) {
  // Fallback ringan untuk key lokal; tidak digunakan untuk autentikasi/token.
  var h = 2166136261;
  for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
 }

// [RESTORED from baseline/core.js] toggleChangelogHistory
 async function toggleChangelogHistory() {
 const olderVersions = document.getElementById('changelog-older-versions');
 const toggleBtn = document.getElementById('btn-toggle-changelog-history');
 const icon = toggleBtn.querySelector('[data-lucide]');
 const label = toggleBtn.querySelector('span');
 const isHidden = olderVersions.classList.contains('hidden');

 if (isHidden) {
  olderVersions.classList.remove('hidden');
  label.innerText = (currentLang === 'en') ? 'Hide Older History' : 'Sembunyikan Riwayat Lama';
  icon.setAttribute('data-lucide', 'chevron-up');
  lucide.createIcons();

  // Versi terbaru (3 terakhir) sudah tampil instan dari CHANGELOG_DATA lokal (tanpa fetch).
  // Riwayat lebih lama dari itu cuma ada di sheet "Changelog" -- fetch sekali saja saat
  // pertama kali dibuka (bukan tiap buka-tutup), tambahkan di BAWAH yang sudah ada.
  if (!changelogFullHistoryLoaded) {
   changelogFullHistoryLoaded = true; // set duluan, cegah fetch dobel kalau diklik cepat
   const loadingId = 'changelog-sheet-loading-indicator';
   olderVersions.insertAdjacentHTML('beforeend', `<p id="${loadingId}" class="text-[11px] text-slate-500 font-medium text-center py-2">${currentLang === 'en' ? 'Loading full history...' : 'Memuat riwayat lengkap...'}</p>`);

   try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=changelog&t=' + new Date().getTime());
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load history.' : 'Gagal memuat riwayat'));

    // Buang versi yang sudah tampil dari CHANGELOG_DATA lokal, biar tidak dobel.
    const localVersions = new Set(CHANGELOG_DATA.map(v => (typeof v.version === 'object' ? v.version.id : v.version)));
    const olderFromSheet = (result.data || []).filter(v => !localVersions.has(v.version));

    const loadingEl = document.getElementById(loadingId);
    if (olderFromSheet.length === 0) {
     if (loadingEl) loadingEl.innerText = currentLang === 'en' ? 'No older history yet.' : 'Belum ada riwayat lebih lama.';
    } else {
     const renderItems = (items) => items.map(it => `<div class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">✅</span> ${(currentLang === 'en' ? it.en : it.id) || it.id}</div>`).join('');
     const html = olderFromSheet.map(entry => `<div class="border-t border-slate-700/50 pt-3"><div class="text-slate-500 font-bold text-[11px] uppercase tracking-wider mb-2">${entry.version}</div><div class="space-y-2">${renderItems(entry.items)}</div></div>`).join('');
     if (loadingEl) loadingEl.outerHTML = html;
    }
   } catch (err) {
    console.error('Gagal memuat riwayat changelog lengkap:', err);
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
     loadingEl.className = 'text-[11px] text-rose-400 font-medium text-center py-2';
     loadingEl.innerText = currentLang === 'en' ? 'Failed to load full history.' : 'Gagal memuat riwayat lengkap.';
    }
    changelogFullHistoryLoaded = false; // izinkan coba lagi kalau ditutup-buka ulang
   }
  }
 } else {
  olderVersions.classList.add('hidden');
  label.innerText = (currentLang === 'en') ? 'View All History' : 'Lihat Semua Riwayat';
  icon.setAttribute('data-lucide', 'chevron-down');
 }
 lucide.createIcons();
 }

// [RESTORED from baseline/core.js] updateRegionalTimeSummary
 function updateRegionalTimeSummary() {
  const summary = document.getElementById('regional-time-summary');
  if (!summary) return;
  const cfg = regionalTimeSettings || REGIONAL_TIME_DEFAULTS;
  summary.innerText = [cfg.timezone, cfg.locale, cfg.dateFormat, cfg.timeFormat].join(' · ');
 }

// [RESTORED from baseline/core.js] updateResetProjectButton
function updateResetProjectButton() {
  const btn=document.getElementById('btn-reset-project');
  const input=document.getElementById('reset-project-confirm');
  if(!btn || !input) return;
  const targets=[].slice.call(document.querySelectorAll('.reset-project-target:checked'));
  const member=document.getElementById('reset-project-member');
  const hasTarget=targets.length>0 || !!(member && member.checked);
  const ok=hasTarget && input.value.trim()==='RESET PROJECT' && isDeveloperUnlocked();
  btn.disabled=!ok;
  btn.classList.toggle('opacity-50',!ok);
  btn.classList.toggle('cursor-not-allowed',!ok);
  btn.classList.toggle('bg-rose-700/30',!ok);
  btn.classList.toggle('bg-rose-600',ok);
  btn.classList.toggle('hover:bg-rose-500',ok);
  btn.classList.toggle('cursor-pointer',ok);
}


// [RESTORED from baseline/core.js -- stub asli MG1 di helpers.js diganti implementasi nyata]
 async function loadRegionalTimeSettings() {
  const status = document.getElementById('regional-time-status');
  // READ path is intentionally public. Developer authorization is NOT required here.
  applyRegionalTimeSettings(REGIONAL_TIME_DEFAULTS);
  if (status) status.innerText = currentLang === 'en' ? 'Loading Regional & Time...' : 'Memuat Regional & Time...';
  try {
   const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?action=getRegionalTimeSettings&t=' + Date.now());
   const result = await response.json();
   if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load Regional & Time.' : 'Gagal memuat Regional & Time.'));
   applyRegionalTimeSettings(result.data);
   regionalTimeServerLoaded = true;
   cacheRegionalTimeSettings(regionalTimeSettings);
   if (status) status.innerText = currentLang === 'en'
    ? 'Saved: ' + regionalTimeSettings.timezone + ' · ' + regionalTimeSettings.locale
    : 'Tersimpan: ' + regionalTimeSettings.timezone + ' · ' + regionalTimeSettings.locale;
  } catch (err) {
   console.warn('Regional & Time read fallback:', err);
   const cached = readCachedRegionalTimeSettings();
   if (cached) {
    applyRegionalTimeSettings(cached);
    if (status) status.innerText = currentLang === 'en'
     ? 'Last saved: ' + regionalTimeSettings.timezone + ' · ' + regionalTimeSettings.locale
     : 'Tersimpan terakhir: ' + regionalTimeSettings.timezone + ' · ' + regionalTimeSettings.locale;
   } else {
    applyRegionalTimeSettings(REGIONAL_TIME_DEFAULTS);
    if (status) status.innerText = currentLang === 'en' ? 'Default: Asia/Jakarta · id-ID' : 'Default: Asia/Jakarta · id-ID';
   }
  }
 }


// ======= RESTORASI TAMBAHAN (stub asli MG1 diganti implementasi nyata) =======

// [RESTORED from baseline/core.js] loadActiveMemberSessions
async function loadActiveMemberSessions() {
 const devToken = (localStorage.getItem('mine_dev_token') || '').trim();
 if (!devToken) {
  activeMemberSessions = [];
  renderActiveSessionsIndicator([]);
  return false;
 }
 const requestSeq = ++activeMemberIndicatorRequestSeq;
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: new URLSearchParams({ action: 'getActiveMemberSessions', sessionToken: devToken }) }, 15000);
  const result = await response.json();
  if (requestSeq !== activeMemberIndicatorRequestSeq) return false;
  if (!result || !result.success) {
   console.warn('Active Member indicator skipped:', result && result.message ? result.message : result);
   activeMemberSessions = [];
   renderActiveSessionsIndicator([]);
   return false;
  }
  renderActiveSessionsIndicator(result.sessions || []);
  return true;
 } catch (error) {
  if (requestSeq !== activeMemberIndicatorRequestSeq) return false;
  console.warn('Active Member indicator request failed:', error);
  activeMemberSessions = [];
  renderActiveSessionsIndicator([]);
  return false;
 }
}

// [RESTORED from baseline/core.js] initCompactBlankRowsControls
function initCompactBlankRowsControls() {
 const select=document.getElementById('compact-sheet-select');
 if(select) select.addEventListener('change',resetCompactPreviewState);
 updateCompactExecuteButton();
}

// [RESTORED from baseline/core.js] initResetProjectControls
function initResetProjectControls() {
  const input=document.getElementById('reset-project-confirm');
  if(input) input.addEventListener('input',updateResetProjectButton);
  document.querySelectorAll('.reset-project-target').forEach(function(el){el.addEventListener('change',updateResetProjectButton);});
  const member=document.getElementById('reset-project-member');
  if(member) member.addEventListener('change',updateResetProjectButton);
  // Guard Reset Total x Retention (lihat komentar applyResetProjectRetentionGuard()) --
  // reaksi LIVE begitu toggle diklik, sebelum sempat disimpan ke backend lewat Save Policy.
  const retentionToggle=document.getElementById('retention-enabled');
  if(retentionToggle) retentionToggle.addEventListener('change',applyResetProjectRetentionGuard);
  updateResetProjectButton();
  loadRetentionPolicy();
}
