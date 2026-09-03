// ============================================================
// SPLASH.JS -- Splash screen "Pixel Boot" (opsional, durasi bisa diatur)
// [DIGANTI TOTAL -- 4 Sep] Versi sebelumnya (progress-bar + logo statis + reuse canvas
// partikel bg-particles) diganti dengan animasi "Pixel Boot": wordmark LITHOSITE jatuh
// huruf per huruf (2 huruf "I" jadi ikon pensil/bor, huruf "O" jadi logo gem Lithosite
// dgn efek glow), lalu loader (garis shimmer + 4 titik memantul). Latar navy gelap
// (#0f172a, SAMA dgn warna glass-card app) -- bukan hitam pekat spt referensi visual
// asli. Badge label kecil "Lithosite • Pixel Boot" di bawah wordmark SENGAJA dihapus
// dari desain (permintaan user 4 Sep) -- cukup wordmark + loader saja.
//
// Pengaturan tersimpan per-device (localStorage), dikontrol dari Developer Console
// > Technical > panel "Splash Screen" (TIDAK BERUBAH dari sebelumnya):
//   - mine_splash_enabled  : 'true' | 'false' (default 'false')
//   - mine_splash_duration : angka detik, 1-7 (default '3') -- total durasi wordmark
//     drop + glow + loader muncul, DISKALAKAN proporsional dari timeline referensi asli
//     (4.1 detik: drop@300ms, glow@1900ms, loader@2500ms, mulai fade@3850ms, lepas@4100ms).
// ============================================================

function getSplashEnabled() {
  return localStorage.getItem('mine_splash_enabled') === 'true';
}
function setSplashEnabled(v) {
  localStorage.setItem('mine_splash_enabled', v ? 'true' : 'false');
}
function getSplashDurationSec() {
  const raw = parseInt(localStorage.getItem('mine_splash_duration') || '3', 10);
  return isNaN(raw) ? 3 : Math.min(7, Math.max(1, raw));
}
function setSplashDurationSec(v) {
  localStorage.setItem('mine_splash_duration', String(Math.min(7, Math.max(1, parseInt(v, 10) || 3))));
}

// Urutan huruf LITHOSITE: 'I' diganti tipe 'pencil' (ikon bor/pensil putih), 'O' diganti
// tipe 'gem' (assets/lithosite-logo.png, logo resmi yang sudah dipakai di 3 titik brand
// lain -- reuse aset yang sama, tidak menambah file gambar baru).
const SPLASH_LETTERS_ = [
  { type: 'text', char: 'L' },
  { type: 'pencil' },
  { type: 'text', char: 'T' },
  { type: 'text', char: 'H' },
  { type: 'gem' },
  { type: 'text', char: 'S' },
  { type: 'pencil' },
  { type: 'text', char: 'T' },
  { type: 'text', char: 'E' }
];

function buildSplashPencilIcon_(sizePx) {
  const w = Math.round(sizePx * 0.32);
  return `<svg width="${w}" height="${sizePx}" viewBox="0 0 36 112" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
    <rect x="11" y="0" width="14" height="20" rx="2" fill="white"></rect>
    <path d="M11 20 H25 V78 H22 V68 H14 V78 H11 V20 Z" fill="white"></path>
    <path d="M14 78 L22 78 L18.1 102 L13.9 102 Z" fill="white"></path>
    <path d="M14 78 L18 91 L13.9 102" fill="white" opacity="0.9"></path>
    <g stroke="#0a0a0a" stroke-width="1.2" stroke-linecap="round" opacity="0.95">
      <line x1="12.5" y1="30" x2="23.5" y2="38"></line>
      <line x1="12.5" y1="42" x2="23.5" y2="50"></line>
      <line x1="12.5" y1="54" x2="23.5" y2="62"></line>
      <line x1="18" y1="22" x2="18" y2="68" stroke-width="0.8" opacity="0.6"></line>
    </g>
    <g stroke="#0a0a0a" stroke-width="1" stroke-linecap="round" opacity="0.9">
      <line x1="14.5" y1="78" x2="18" y2="89"></line>
      <line x1="21.5" y1="78" x2="18" y2="89"></line>
    </g>
  </svg>`;
}

function buildSplashWordmark_(container) {
  container.innerHTML = '';
  const isMobile = window.innerWidth < 768;
  const letterSize = isMobile ? 40 : 84;
  SPLASH_LETTERS_.forEach((f, s) => {
    const wrap = document.createElement('div');
    wrap.className = 'relative flex items-end justify-center';
    const dropDelay = (0.3 + s * 0.12).toFixed(2);
    const waveDelay = (s * 0.06 + 0.05).toFixed(2);
    wrap.dataset.waveDelay = waveDelay;

    let inner;
    if (f.type === 'text') {
      inner = document.createElement('div');
      inner.className = 'litho-letter splash-pre-drop';
      inner.textContent = f.char;
    } else if (f.type === 'pencil') {
      inner = document.createElement('div');
      inner.className = 'splash-pre-drop';
      inner.innerHTML = buildSplashPencilIcon_(letterSize);
    } else {
      inner = document.createElement('div');
      inner.className = 'splash-pre-drop';
      const imgWrap = document.createElement('div');
      imgWrap.id = 'splash-gem-wrap';
      const gemSize = isMobile ? 40 : 72;
      imgWrap.style.width = gemSize + 'px';
      imgWrap.style.height = gemSize + 'px';
      imgWrap.style.marginBottom = (isMobile ? '4px' : '8px');
      const img = document.createElement('img');
      img.src = 'assets/lithosite-logo.png';
      img.alt = 'Lithosite';
      img.draggable = false;
      img.className = 'w-full h-full object-contain select-none pointer-events-none';
      imgWrap.appendChild(img);
      inner.appendChild(imgWrap);
    }
    inner.style.animationDelay = dropDelay + 's';
    wrap.appendChild(inner);
    container.appendChild(wrap);
  });
}

function runSplashScreen() {
  const overlay = document.getElementById('splash-screen-overlay');
  if (!overlay) return;

  if (!getSplashEnabled()) { overlay.remove(); return; }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { overlay.remove(); return; }

  overlay.classList.remove('hidden');

  const wordmark = document.getElementById('splash-wordmark');
  const loaderRow = document.getElementById('splash-loader-row');
  if (wordmark) buildSplashWordmark_(wordmark);

  const totalMs = getSplashDurationSec() * 1000;
  const scale = totalMs / 4100; // timeline referensi asli = 4.1 detik total
  const T_DROP = 300 * scale;
  const T_GLOW = 1900 * scale;
  const T_LOADER = 2500 * scale;
  const T_FADE_START = 3850 * scale;
  const T_REMOVE = totalMs + 100;

  const timers = [];

  timers.push(setTimeout(() => {
    if (!wordmark) return;
    wordmark.querySelectorAll('.splash-pre-drop').forEach((el) => el.classList.add('splash-animate-drop'));
  }, T_DROP));

  timers.push(setTimeout(() => {
    if (!wordmark) return;
    wordmark.querySelectorAll('.relative.flex.items-end.justify-center').forEach((wrap) => {
      const el = wrap.firstElementChild;
      if (!el) return;
      const delay = wrap.dataset.waveDelay || '0';
      el.style.animation = 'wavePop 0.6s cubic-bezier(0.34,1.56,0.64,1) both';
      el.style.animationDelay = delay + 's';
    });
    const gemWrap = document.getElementById('splash-gem-wrap');
    if (gemWrap) gemWrap.classList.add('rock-glow');
  }, T_GLOW));

  timers.push(setTimeout(() => {
    if (!loaderRow) return;
    loaderRow.style.opacity = '1';
    const shimmer = document.getElementById('splash-shimmer-bar');
    if (shimmer) shimmer.style.animation = 'shimmer 1.15s cubic-bezier(0.4,0,0.2,1) infinite';
    document.querySelectorAll('#splash-loader-row .splash-dot').forEach((d) => {
      const existingDelay = d.style.animationDelay || '0s';
      d.style.animation = 'dotBounce 1.2s ease-in-out infinite';
      d.style.animationDelay = existingDelay;
    });
  }, T_LOADER));

  timers.push(setTimeout(() => {
    overlay.style.animation = 'bootExit 0.7s cubic-bezier(0.7,0,0.84,0) forwards';
  }, T_FADE_START));

  timers.push(setTimeout(() => {
    overlay.remove();
  }, T_REMOVE));
}

// --- Handler panel kontrol (Developer Console > Technical) -- TIDAK BERUBAH ---
function onSplashEnabledToggle(checked) {
  setSplashEnabled(checked);
}
window.onSplashEnabledToggle = onSplashEnabledToggle;

function onSplashDurationChange(value) {
  setSplashDurationSec(value);
  const label = document.getElementById('splash-duration-value-label');
  if (label) label.innerText = getSplashDurationSec() + ' detik';
}
window.onSplashDurationChange = onSplashDurationChange;

function syncSplashPanelControls() {
  const toggle = document.getElementById('splash-enabled-toggle');
  const slider = document.getElementById('splash-duration-slider');
  const label = document.getElementById('splash-duration-value-label');
  if (toggle) toggle.checked = getSplashEnabled();
  if (slider) slider.value = getSplashDurationSec();
  if (label) label.innerText = getSplashDurationSec() + ' detik';
}
window.syncSplashPanelControls = syncSplashPanelControls;
