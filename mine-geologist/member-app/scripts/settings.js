/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- member-app/scripts/settings.js
 * [PARTISI -- 4 Sep, Tahap 4] Modal Report Data, Modal Pengaturan (Foto Profil lokal
 * per-device + Versi App + info Akun), Menu Akun (dipicu avatar header). Diekstrak
 * dari index.html tunggal -- 0 restrukturisasi logika.
 * Catatan: renderSimpleModal() (wrapper modal bottom-sheet dipakai 9 modal lintas-
 * file) SENGAJA TETAP di index.html (Tahap 5) -- itu infrastruktur UI generik dipakai
 * kpi.js/digging.js/validasi.js/issue.js/settings.js sekaligus, bukan spesifik Settings.
 * Dependency: config.js, auth.js, render() (index.html Tahap 5).
 * ============================================================ */

// ==== MODAL: REPORT DATA (dulu tab "Laporan", sekarang dipindah ke menu avatar) ====
let reportModalOpen = false;
function openReportModal() { reportModalOpen = true; accountMenuOpen = false; render(); }
function closeReportModal() { reportModalOpen = false; render(); }
function renderReportModal(justOpened) {
  if (!reportModalOpen) return '';
  let body = '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4 flex gap-3">' +
    '<div class="flex-1 text-center"><div class="text-lg font-bold text-white">' + sumField(globalDiggingToday,'Tonase').toFixed(0) + '</div><div class="text-[9px] text-white/40">TON DIG</div></div>' +
    '<div class="flex-1 text-center"><div class="text-lg font-bold text-blue-300">' + globalDiggingToday.length + '</div><div class="text-[9px] text-white/40">ENTRI</div></div>' +
    '<div class="flex-1 text-center"><div class="text-lg font-bold text-emerald-300">' + (avgField(globalDiggingToday,'Ni %')||avgField(globalDiggingToday,'Ni')).toFixed(2) + '%</div><div class="text-[9px] text-white/40">NI AVG</div></div>' +
  '</div>';
  ['Export PDF Report','Export CSV Data','Export Word Doc'].forEach(label => {
    body += '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4 flex items-center justify-between opacity-60 mt-2.5">' +
      '<div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">' + icon('file-text','w-4 h-4 text-white/50') + '</div>' +
      '<div class="text-sm font-semibold text-white">' + label + '</div></div>' + icon('download','w-4 h-4 text-white/30') +
    '</div>';
  });
  body += '<p class="text-[10px] text-white/25 text-center mt-3">Export belum tersambung di versi ini -- pakai dashboard web utk export laporan.</p>';
  return renderSimpleModal('Report Data', 'Ringkasan &amp; unduh laporan', body, 'closeReportModal()', undefined, justOpened);
}

// [PARTISI -- 4 Sep, Tahap 4] Modal KPI & Absensi + Modal JSA dipindah ke scripts/kpi.js.


// ==== MODAL: PENGATURAN (Simple Settings) ====
let settingsModalOpen = false;
function openSettingsModal() { settingsModalOpen = true; accountMenuOpen = false; render(); }
function closeSettingsModal() { settingsModalOpen = false; render(); }
function renderSettingsModal(justOpened) {
  if (!settingsModalOpen) return '';
  const hasCustomAvatar = !!getCustomAvatarDataUrl();
  const body = '' +
    // BARU (27 Agu): Foto Profil -- disimpan LOKAL di HP masing-masing (localStorage,
    // per Login_ID), TIDAK pernah terupload ke server manapun. Member bebas pasang/
    // copot kapan saja lewat tombol di sini -- kalau foto dihapus dari galeri Android,
    // app TIDAK bisa otomatis tahu (batasan PWA, bukan bug) -- makanya disediakan tombol
    // "Copot Foto" di dalam app sebagai cara pasti untuk menghapusnya.
    '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4">' +
      '<div class="flex items-center gap-3 mb-3">' +
        '<div class="w-14 h-14 rounded-full bg-[#0b1329] border-2 border-white/10 overflow-hidden flex items-center justify-center text-[16px] font-bold text-blue-200 shrink-0">' +
          (hasCustomAvatar ? '<img id="settings-avatar-preview" src="' + getCustomAvatarDataUrl() + '" class="w-full h-full object-cover">' : '<span id="settings-avatar-preview-initials">' + getMemberInitials() + '</span>') +
        '</div>' +
        '<div class="min-w-0">' +
          '<div class="text-[13px] font-bold text-white">Foto Profil</div>' +
          '<div class="text-[11px] text-white/40">Tersimpan lokal di HP ini saja</div>' +
        '</div>' +
      '</div>' +
      '<input type="file" accept="image/*" id="avatar-file-input" class="hidden" onchange="handleAvatarFileSelected(event)">' +
      '<div class="flex gap-2">' +
        '<button onclick="document.getElementById(\'avatar-file-input\').click()" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">' + icon('image-plus','w-4 h-4') + '<span>' + (hasCustomAvatar ? 'Ganti Foto' : 'Pilih Foto') + '</span></button>' +
        (hasCustomAvatar ? '<button onclick="removeCustomAvatar()" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-rose-300 text-xs font-bold">' + icon('trash-2','w-4 h-4') + '<span>Copot Foto</span></button>' : '') +
      '</div>' +
      '<p id="avatar-status-msg" class="text-[10px] mt-2 hidden"></p>' +
    '</div>' +
    '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4 flex items-center justify-between mt-2.5">' +
      '<div><div class="text-[13px] font-bold text-white">Versi App</div><div class="text-[11px] text-white/40">' + APP_VERSION + '</div></div>' +
      icon('info','w-4 h-4 text-white/30') +
    '</div>' +
    '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-4 flex items-center justify-between mt-2.5">' +
      '<div><div class="text-[13px] font-bold text-white">Akun</div><div class="text-[11px] text-white/40">' + (sessionInfo ? sessionInfo.userName + ' &bull; ' + sessionInfo.roleId : 'Belum login') + '</div></div>' +
      icon('user','w-4 h-4 text-white/30') +
    '</div>' +
    '<p class="text-[10px] text-white/25 text-center mt-3">Pengaturan lain (tema, bahasa, notifikasi) menyusul di versi berikutnya.</p>';
  return renderSimpleModal('Pengaturan', 'Setting sederhana', body, 'closeSettingsModal()', undefined, justOpened);
}

// [PARTISI -- 4 Sep, Tahap 4] Modal Issue & Action dipindah ke scripts/issue.js.

// ==== MENU AKUN (dipicu dari avatar header) ====
// ==== BARU (27 Agu): FOTO PROFIL LOKAL -- Member pilih foto dari galeri Android,
// disimpan di localStorage HP itu SENDIRI (base64, dikompres dulu via canvas supaya
// hemat kuota), kunci disimpan per Login_ID (bukan 1 kunci global) supaya kalau ganti
// akun di HP yang sama, fotonya tidak tertukar. TIDAK PERNAH terupload ke server --
// murni preferensi lokal per perangkat. Karena PWA (bukan app native), app TIDAK BISA
// otomatis tahu kalau foto aslinya dihapus dari galeri Android -- makanya disediakan
// tombol "Copot Foto" di dalam app sebagai satu-satunya cara pasti menghapusnya.
function getCustomAvatarStorageKey() {
  const loginId = (localStorage.getItem('mine_member_login_id') || 'guest').trim();
  return 'mine_member_avatar_custom_' + loginId;
}
function getCustomAvatarDataUrl() {
  try { return localStorage.getItem(getCustomAvatarStorageKey()) || ''; } catch (e) { return ''; }
}
function getMemberInitials() {
  const name = (sessionInfo && sessionInfo.userName) ? sessionInfo.userName.trim() : '';
  if (!name) return '';
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function handleAvatarFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  const statusEl = document.getElementById('avatar-status-msg');
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    if (statusEl) { statusEl.textContent = 'File yang dipilih bukan gambar.'; statusEl.className = 'text-[10px] mt-2 text-rose-400'; statusEl.classList.remove('hidden'); }
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Kompres + resize ke maksimal 256x256 sebelum disimpan -- foto asli dari kamera
      // HP modern bisa >5MB, jauh melebihi kuota localStorage (~5-10MB total per app).
      const canvas = document.createElement('canvas');
      const maxSize = 256;
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
      else { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
      try {
        localStorage.setItem(getCustomAvatarStorageKey(), compressedDataUrl);
        if (statusEl) { statusEl.textContent = 'Foto tersimpan di HP ini.'; statusEl.className = 'text-[10px] mt-2 text-emerald-400'; statusEl.classList.remove('hidden'); }
        render();
      } catch (err) {
        if (statusEl) { statusEl.textContent = 'Gagal menyimpan -- ruang penyimpanan HP penuh.'; statusEl.className = 'text-[10px] mt-2 text-rose-400'; statusEl.classList.remove('hidden'); }
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = ''; // reset supaya bisa pilih file yg sama lagi kalau mau
}
function removeCustomAvatar() {
  try { localStorage.removeItem(getCustomAvatarStorageKey()); } catch (e) {}
  render();
}

let accountMenuOpen = false;
function toggleAccountMenu() { accountMenuOpen = !accountMenuOpen; render(); }
function closeAccountMenu() { accountMenuOpen = false; render(); }
function renderAccountMenu() {
  if (!accountMenuOpen) return '';
  const hasSession = !!(sessionInfo && sessionInfo.userName);
  function item(iconName, label, onclick) {
    return '<button onclick="' + onclick + '" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] text-left">' +
      icon(iconName, 'w-[18px] h-[18px] text-white/60') +
      '<span class="text-[13px] font-semibold text-white">' + label + '</span>' +
    '</button>';
  }
  return '' +
  '<div class="fixed inset-0 z-40" onclick="closeAccountMenu()">' +
    '<div class="absolute right-4 top-[60px] w-[240px] rounded-[14px] bg-[#0e1933] border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)] overflow-hidden fade-in" onclick="event.stopPropagation()">' +
      (hasSession ? '<div class="px-4 py-3 border-b border-white/[0.06]"><div class="text-[13px] font-bold text-white truncate">' + sessionInfo.userName + '</div><div class="text-[10px] text-white/40">' + sessionInfo.roleId + '</div></div>' : '') +
      item(hasSession ? 'log-out' : 'log-in', hasSession ? 'Logout' : 'Login', hasSession ? 'handleLogout(); closeAccountMenu();' : 'openLoginModal(); closeAccountMenu();') +
      item('calendar-check', 'KPI &amp; Absensi', 'openKpiModal()') +
      item('file-text', 'Report Data', 'openReportModal()') +
      item('settings', 'Pengaturan', 'openSettingsModal()') +
    '</div>' +
  '</div>';
}

