// ============================================================
// SPLASH.JS -- Splash screen loading awal (opsional, durasi bisa diatur)
// [FITUR BARU -- 3 Sep] Konsep & progress-bar diambil dari referensi visual
// "Lithosite-Splash", ditulis ulang vanilla JS (bukan React) -- reuse canvas partikel
// yang sama dengan scripts/bg-particles.js sebagai latar animasinya.
//
// Pengaturan tersimpan per-device (localStorage), dikontrol dari Developer Console
// > Technical > panel "Splash Screen":
//   - mine_splash_enabled  : 'true' | 'false' (default 'false')
//   - mine_splash_duration : angka detik, 1-7 (default '3')
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

function runSplashScreen() {
  const overlay = document.getElementById('splash-screen-overlay');
  if (!overlay) return;

  if (!getSplashEnabled()) { overlay.remove(); return; }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { overlay.remove(); return; }

  overlay.classList.remove('hidden');
  // Paksa canvas partikel jalan selama splash, apa pun pengaturan Background Animasi biasa
  // (splash memang dirancang selalu pakai animasi ini sebagai identitas visualnya).
  if (typeof startBgParticlesAnimation === 'function') startBgParticlesAnimation();

  const durationMs = getSplashDurationSec() * 1000;
  const bar = document.getElementById('splash-progress-bar');
  const pct = document.getElementById('splash-progress-pct');
  const stage = document.getElementById('splash-stage-text');
  const startTime = performance.now();
  let frame = null;

  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

  const tick = (now) => {
    const elapsed = now - startTime;
    const linear = Math.min(elapsed / durationMs, 1);
    const eased = easeOutCubic(linear);
    const percent = Math.floor(eased * 100);
    if (bar) bar.style.width = percent + '%';
    if (pct) pct.innerText = percent + '%';
    if (stage) {
      if (percent < 38) stage.innerText = currentLang === 'en' ? 'Initializing site data...' : 'Memuat data situs...';
      else if (percent < 78) stage.innerText = currentLang === 'en' ? 'Loading pit blocks...' : 'Memuat blok pit...';
      else if (percent < 100) stage.innerText = currentLang === 'en' ? 'Calibrating survey models...' : 'Kalibrasi model survei...';
      else stage.innerText = currentLang === 'en' ? 'System Online' : 'Sistem Siap';
    }
    if (linear < 1) {
      frame = requestAnimationFrame(tick);
    } else {
      setTimeout(() => {
        overlay.classList.add('splash-fade-out');
        setTimeout(() => {
          overlay.remove();
          // Setelah splash selesai, biarkan pengaturan Background Animasi biasa yang
          // menentukan apakah partikel tetap jalan (mis. cakupan "Semua Halaman") atau berhenti.
          if (typeof refreshBgParticlesVisibility === 'function') refreshBgParticlesVisibility();
        }, 400);
      }, 250);
    }
  };
  frame = requestAnimationFrame(tick);
}

// --- Handler panel kontrol (Developer Console > Technical) ---
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
