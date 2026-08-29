// ==== SETTINGS.js -- v90.2.120 ====

 function getCurrentExportRole() {
  if ((localStorage.getItem('mine_dev_token') || '').trim()) return 'DEVELOPER';
  const role = (localStorage.getItem('mine_member_role_id') || '').trim().toUpperCase();
  return role || 'PUBLIC';
 }

function markSecurityUserActivity() {
  lastSecurityUserActivityAt = Date.now();
}

['pointerdown','keydown','touchstart'].forEach(function(type) {
  document.addEventListener(type, markSecurityUserActivity, { passive: true });
});

// v90.2.131 FIX (temuan audit -- security/session-behavior): SEBELUMNYA
// visibilitychange memanggil markSecurityUserActivity() -- kembali ke tab (alt-tab, OS
// auto-restore fokus, atau notifikasi mobile yg sekilas membawa app ke depan) DIANGGAP
// aktivitas user nyata, padahal TIDAK ADA pointer/keyboard/touch event sungguhan.
// Akibatnya: begitu rotateActiveSecurityTokens() dipanggil tepat sesudahnya, jendela
// idle-check-nya baru saja di-reset oleh visibility itu sendiri -- kontradiksi langsung
// dgn komentar v90.2.64 di bawah ("idle tetap ditentukan oleh aktivitas user nyata").
// SEKARANG: kembali ke tab TETAP memicu cek ulang sesi/rotasi (kalau memang masih valid
// & belum idle timeout), TAPI TIDAK LAGI mereset jam aktivitas -- kalau user genuinely
// sudah idle lama sebelum tab disembunyikan, kembali ke tab TIDAK diam-diam
// memperpanjang idle window-nya.
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState !== 'visible') return;
  setTimeout(function() {
    if (localStorage.getItem('mine_member_token') || localStorage.getItem('mine_dev_token')) {
      rotateActiveSecurityTokens().catch(function(err) { console.warn('Session resume check skipped:', err); });
    }
    updateSessionIdleWarning();
  }, 0);
});

// v90.2.64: lightweight idle warning. It never extends a session by itself;
// only an explicit user action can dismiss the warning and trigger activity.
const SESSION_IDLE_WARNING_MINUTES = 5;
let sessionIdleWarningEl = null;
async function rotateActiveSecurityTokens() {
  // v90.2.64: visibility bukan lagi indikator idle.
  // Hidden hanya mengurangi polling; idle tetap ditentukan oleh aktivitas user nyata.
  if (Date.now() - lastSecurityUserActivityAt > TOKEN_ROTATION_ACTIVITY_WINDOW_MS) return;
  const now = Date.now();
  if (localStorage.getItem('mine_member_token') && now - lastMemberTokenRotationAt >= TOKEN_ROTATION_INTERVAL_MS) {
    await queueMemberSessionOperation(async function() {
      if (localStorage.getItem('mine_member_token')) {
        await rotateStoredSession('member', 'mine_member_token', 'mine_member_expires_at', 'mine_member_session_id', 'lastMemberTokenRotationAt');
      }
    });
  }
  if (localStorage.getItem('mine_dev_token') && now - lastDeveloperTokenRotationAt >= TOKEN_ROTATION_INTERVAL_MS) {
    await queueDeveloperSessionOperation(async function() {
      if (localStorage.getItem('mine_dev_token')) {
        await rotateStoredSession('developer', 'mine_dev_token', 'mine_dev_expires_at', 'mine_dev_session_id', 'lastDeveloperTokenRotationAt');
      }
    });
  }
}

// SECURITY 90V STEP 12B FIX: validasi session Member berkala tanpa menyentuh Last_Seen.
// Polling data 30 detik bukan validasi session. Heartbeat ini memakai touch=0 agar
// pemeriksaan berkala tidak dianggap aktivitas user dan tidak memperpanjang idle timeout.
const MEMBER_SESSION_CHECK_INTERVAL_MS = 30000;
let memberSessionValidationSeq = 0;
// v90.2.62: serialize Member validate/rotate operations. Without this guard,
// a 30s validateSession request can race a 15m rotateSession request; the
// validator may receive the old-token response after rotation and clear the
// current local session, producing a false 'kick'.
let memberSessionOperationChain = Promise.resolve();
async function openCredentialManager() {
 if (!isDeveloperUnlocked()) {
  showNoticeModal(
   currentLang === 'en' ? 'Developer Access Locked' : 'Akses Developer Terkunci',
   currentLang === 'en' ? 'Unlock Developer Access first.' : 'Buka Akses Developer terlebih dahulu.'
  );
  return;
 }
 const modal = document.getElementById('credential-manager-modal');
 showModalAnimated(modal);
 await loadCredentialProvisionCandidates();
 lucide.createIcons();
}

function closeCredentialManager() {
 const modal = document.getElementById('credential-manager-modal');
 hideModalAnimated(modal);
}

// BARU (27 Agu): submit Reset PIN Member -- backend action setMemberPin sudah lama ada,
// panel ini baru UI-nya. Validasi client (6 digit, PIN cocok 2x) SEBELUM kirim, tapi
// server tetap re-validasi semuanya sendiri (tidak dipercaya dari client).
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
 container.innerHTML = '<div class="text-center py-8 text-slate-500 text-xs">' + (currentLang === 'en' ? 'Loading Users without Credentials...' : 'Memuat User yang belum memiliki Credential...') + '</div>';
 try {
  const result = await postCentralAuthenticated({ action: 'listMissingCredentials' }, { developerOnly: true });
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load the Credential list.' : 'Gagal mengambil daftar Credential.'));
  const rows = Array.isArray(result.data) ? result.data : [];
  if (!rows.length) {
   container.innerHTML = '<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center text-emerald-400 text-xs font-semibold">' + (currentLang === 'en' ? 'All active Users already have Credentials.' : 'Semua User aktif sudah memiliki Credential.') + '</div>';
   return;
  }
  container.innerHTML = rows.map((u, i) => {
   const defaultLogin = (u.email || '').toString().split('@')[0].replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40);
   return `
    <div class="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4" data-credential-user="${credentialEsc(u.user_id)}">
     <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr_1.4fr_1fr_1fr_auto] gap-3 items-end">
      <div>
       <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">User_ID</div>
       <div class="text-xs text-title font-bold mt-1">${credentialEsc(u.user_id)}</div>
      </div>
      <div>
       <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">${currentLang === 'en' ? 'Name' : 'Nama'}</div>
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
       <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">${currentLang === 'en' ? '6-digit PIN' : 'PIN 6 digit'}</label>
       <input id="cred-pin-${i}" type="password" inputmode="numeric" maxlength="6" class="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-title focus:outline-none focus:border-indigo-500" placeholder="••••••">
      </div>
      <button onclick="provisionExistingCredential(${i}, '${credentialEsc(u.user_id)}')" class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap">
       <i data-lucide="key-round" class="w-3.5 h-3.5"></i> ${currentLang === 'en' ? 'Create Credential' : 'Buat Credential'}
      </button>
     </div>
    </div>`;
  }).join('');
  lucide.createIcons();
 } catch (err) {
  console.error('Credential Manager:', err);
  container.innerHTML = `<div class="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-400 text-xs font-medium">${credentialEsc(err.message || (currentLang === 'en' ? 'Failed to load data.' : 'Gagal memuat data.'))}</div>`;
 }
}

 function syncChatSenderToLoggedInUser() {
 const select = document.getElementById('chat-sender-select');
 if (!select) return;
 const identity = getLoggedInChatIdentity();
 select.innerHTML = '';
 const opt = document.createElement('option');
 opt.value = identity.sender;
 opt.textContent = identity.sender || (currentLang === 'en' ? 'Member login required' : 'Login Member diperlukan');
 select.appendChild(opt);
 select.value = identity.sender;
 select.disabled = true;
 select.classList.add('opacity-80', 'cursor-not-allowed');
 if (identity.sender) localStorage.setItem('mine_chat_sender', identity.sender);
 }
