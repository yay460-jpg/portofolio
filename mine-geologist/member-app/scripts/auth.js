/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- member-app/scripts/auth.js
 * [PARTISI -- 4 Sep, Tahap 3] Login (verifyMemberPin), session (simpan/muat/hapus dari
 * localStorage, key SAMA dgn dashboard web biar konsisten), logout (lapor server dulu
 * baru reload penuh). Diekstrak dari index.html tunggal -- 0 restrukturisasi logika,
 * murni pindah teks.
 * Dependency dari file lain (config.js): GOOGLE_SCRIPT_READ_URL, fetchWithTimeout, icon.
 * Dependency dari index.html (belum dipartisi): render(), loadRingkasanData().
 * ============================================================ */

let sessionInfo = null; // {token, userName, loginId, roleId, avatarUrl}
let loginInFlight = false;

// ==== UTIL: sesi tersimpan (nama key SAMA dengan dashboard web, biar konsisten) ====
function saveSession(result, loginIdFallback) {
  sessionInfo = {
    token: result.token,
    sessionId: result.session_id || '',
    userId: result.user_id || '',
    loginId: result.login_id || loginIdFallback,
    roleId: result.role_id || 'MEMBER',
    userName: result.user_name || result.login_id || loginIdFallback,
    avatarUrl: result.avatar_url || result.photo_url || result.avatar || ''
  };
  try {
    localStorage.setItem('mine_member_token', sessionInfo.token);
    localStorage.setItem('mine_member_session_id', sessionInfo.sessionId);
    localStorage.setItem('mine_member_user_id', sessionInfo.userId);
    localStorage.setItem('mine_member_login_id', sessionInfo.loginId);
    localStorage.setItem('mine_member_role_id', sessionInfo.roleId);
    localStorage.setItem('mine_member_user_name', sessionInfo.userName);
    localStorage.setItem('mine_member_avatar_url', sessionInfo.avatarUrl);
  } catch (e) {}
}
function loadStoredSession() {
  try {
    const token = localStorage.getItem('mine_member_token');
    if (!token) return null;
    return {
      token: token,
      sessionId: localStorage.getItem('mine_member_session_id') || '',
      userId: localStorage.getItem('mine_member_user_id') || '',
      loginId: localStorage.getItem('mine_member_login_id') || '',
      roleId: localStorage.getItem('mine_member_role_id') || 'MEMBER',
      userName: localStorage.getItem('mine_member_user_name') || '',
      avatarUrl: localStorage.getItem('mine_member_avatar_url') || ''
    };
  } catch (e) { return null; }
}
function clearSession() {
  sessionInfo = null;
  try {
    ['mine_member_token','mine_member_session_id','mine_member_user_id','mine_member_login_id','mine_member_role_id','mine_member_user_name','mine_member_avatar_url']
      .forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

// ==== LOGIN (verifyMemberPin) -- endpoint & field SAMA PERSIS dgn dashboard web ====
async function submitLogin(loginId, email, pin, onStatus) {
  if (loginInFlight) return;
  if (!loginId || !email || !/^[0-9]{6}$/.test(pin)) {
    onStatus('Login_ID, email terdaftar, dan PIN 6 digit wajib diisi.', false);
    return;
  }
  loginInFlight = true;
  onStatus('Memeriksa akun member...', true, true);
  try {
    const payload = new URLSearchParams({
      action: 'verifyMemberPin',
      login_id: loginId,
      email: email,
      pin: pin,
      client_info: (navigator.userAgent || '').slice(0, 180)
    });
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
    const result = await response.json();
    if (!result.success || !result.token) {
      if (result.locked && result.retry_after) {
        onStatus('Credential terkunci. Coba lagi dalam ' + result.retry_after + ' detik.', false);
      } else if (result.rate_limited || result.brute_force_blocked) {
        onStatus('Terlalu banyak percobaan. Coba lagi sebentar lagi.', false);
      } else {
        onStatus(result.message || 'Login member gagal.', false);
      }
      return;
    }
    saveSession(result, loginId);
    onStatus('Login berhasil sebagai ' + sessionInfo.userName + '.', true);
    setTimeout(() => { loginModalOpen = false; render(); loadRingkasanData(); }, 500);
  } catch (err) {
    console.error('Login error:', err);
    onStatus('Tidak bisa menghubungi server. Coba lagi.', false);
  } finally {
    loginInFlight = false;
  }
}

// BARU (27 Agu): logout sekarang (1) lapor ke server dulu (action=logoutSession) supaya
// sesi ini ditandai LOGOUT di sheet Sessions -- sebelumnya cuma dihapus di HP sendiri,
// server masih menganggap sesi "aktif" sampai idle-timeout alami habis (nyambung
// langsung ke fix Active User Indicator yang dikerjakan hari ini di web dashboard).
// Best-effort, timeout pendek -- gagal pun tetap lanjut logout, jangan sampai macet
// cuma gara2 network jelek. (2) reload PENUH (persis Ctrl+F5) supaya semua sisa state
// (avatar, polling chat, dsb) benar2 hilang total, bukan cuma di-render ulang di tempat.
async function handleLogout() {
  if (sessionInfo && sessionInfo.token) {
    try {
      await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'logoutSession', sessionToken: sessionInfo.token })
      }, 5000);
    } catch (e) {
      console.warn('Lapor logout ke server gagal (tetap lanjut logout lokal):', e);
    }
  }
  clearSession();
  location.reload();
}

// ==== RENDER: LOGIN (modal, dipicu dari avatar header) ====
let loginModalOpen = false;
let loginStatusMsg = '', loginStatusOk = true, loginBusy = false;
function renderLoginModal(justOpened) {
  if (!loginModalOpen) return '';
  const animClass = (justOpened === false) ? '' : ' fade-in';
  return '' +
  '<div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center px-6' + animClass + '" onclick="if(event.target===this)closeLoginModal()">' +
    '<div class="w-full max-w-sm bg-[#0e1933] rounded-[26px] border border-white/10 p-6 relative">' +
      '<button onclick="closeLoginModal()" class="absolute right-4 top-4 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">' + icon('x','w-3.5 h-3.5 text-white/50') + '</button>' +
      '<div class="flex flex-col items-center mb-6">' +
        '<img src="../assets/lithosite-logo.png" alt="Lithosite" class="w-14 h-14 object-contain mb-3">' +
        '<div class="text-sm font-bold tracking-[0.06em] text-white">MINE GEOLOGIST</div>' +
        '<div class="text-[9px] tracking-[0.2em] text-white/30 mt-1">LITHOSITE &bull; MEMBER ACCESS</div>' +
      '</div>' +
      '<form id="login-form" class="space-y-3">' +
        '<div>' +
          '<label class="block text-[11px] text-white/50 mb-1.5 font-medium">Login ID</label>' +
          '<input id="login-id-input" type="text" autocomplete="username" placeholder="cth. member01" class="w-full bg-[#0b1329] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/60">' +
        '</div>' +
        '<div>' +
          '<label class="block text-[11px] text-white/50 mb-1.5 font-medium">Email Terdaftar</label>' +
          '<input id="login-email-input" type="email" autocomplete="email" placeholder="nama@email.com" class="w-full bg-[#0b1329] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/60">' +
        '</div>' +
        '<div>' +
          '<label class="block text-[11px] text-white/50 mb-1.5 font-medium">PIN (6 digit)</label>' +
          '<input id="login-pin-input" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" placeholder="******" class="w-full bg-[#0b1329] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white tracking-[0.3em] focus:outline-none focus:border-blue-400/60">' +
        '</div>' +
        (loginStatusMsg ? '<p class="text-xs font-medium ' + (loginStatusOk ? 'text-emerald-400' : 'text-rose-400') + '">' + loginStatusMsg + '</p>' : '') +
        '<button id="login-submit-btn" type="submit" class="w-full mt-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-60">' +
          (loginBusy ? '<span class="w-4 h-4 border-2 border-[#0b1329]/40 border-t-[#0b1329] rounded-full spin"></span>' : icon('log-in','w-4 h-4')) +
          '<span>' + (loginBusy ? 'Memeriksa...' : 'Masuk') + '</span>' +
        '</button>' +
      '</form>' +
    '</div>' +
  '</div>';
}
function openLoginModal() { loginStatusMsg = ''; loginModalOpen = true; render(); }
function closeLoginModal() { loginModalOpen = false; render(); }
