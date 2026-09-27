// ============================================================
// BG-PARTICLES.JS -- Animasi background titik terkoneksi (opsional, hemat resource)
// [FITUR BARU -- 3 Sep] Ditulis ulang vanilla JS bersih dari referensi visual
// "Lithosite-Splash" (file React Artifact 845KB, cuma dipakai sebagai acuan desain --
// TIDAK di-embed langsung krn bertentangan dgn prinsip MG1: ringan, tanpa build-step,
// sadar bandwidth sinyal tambang yg lemah).
//
// Pengaturan tersimpan per-device (localStorage), dikontrol dari Developer Console
// > Technical > panel "Background Animasi":
//   - mine_bg_particles_enabled : 'true' | 'false' (default 'false' -- OFF sampai
//     developer aktifkan sendiri, supaya tidak otomatis nyala di semua device tanpa disadari)
//   - mine_bg_particles_scope   : 'login' | 'login_settings' | 'all'
//
// Animasi TIDAK jalan (hemat CPU/baterai) kalau: (a) preference OFF, (b) scope tidak
// cocok dgn tampilan saat ini, (c) prefers-reduced-motion aktif di device user.
// ============================================================

let bgParticlesAnimFrame = null;
let bgParticlesList = [];
let bgParticlesResizeHandlerBound = false;

function getBgParticlesEnabled() {
  return localStorage.getItem('mine_bg_particles_enabled') === 'true';
}
function setBgParticlesEnabled(v) {
  localStorage.setItem('mine_bg_particles_enabled', v ? 'true' : 'false');
}
function getBgParticlesScope() {
  return localStorage.getItem('mine_bg_particles_scope') || 'login';
}
function setBgParticlesScope(v) {
  localStorage.setItem('mine_bg_particles_scope', v);
}

// Tentukan apakah animasi SEHARUSNYA tampil di kondisi tampilan saat ini.
function shouldShowBgParticles() {
  if (!getBgParticlesEnabled()) return false;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const scope = getBgParticlesScope();
  if (scope === 'all') return true;
  const loginModal = document.getElementById('member-login-modal');
  const loginModalOpen = loginModal && !loginModal.classList.contains('hidden');
  if (scope === 'login') return !!loginModalOpen;
  if (scope === 'login_settings') return !!loginModalOpen || currentActiveTab === 'settings';
  return false;
}

function stopBgParticlesAnimation() {
  if (bgParticlesAnimFrame) {
    cancelAnimationFrame(bgParticlesAnimFrame);
    bgParticlesAnimFrame = null;
  }
  const canvas = document.getElementById('bg-particles-canvas');
  if (canvas) canvas.classList.add('hidden');
}

function startBgParticlesAnimation() {
  const canvas = document.getElementById('bg-particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  canvas.classList.remove('hidden');
  if (bgParticlesAnimFrame) return; // sudah jalan, tidak perlu mulai ulang

  const PARTICLE_COUNT = 42;
  const CONNECT_DIST = 140;
  const COLOR_RGB = '56, 189, 248'; // sky-400, senada dgn aksen biru MG1

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    if (bgParticlesList.length === 0) {
      bgParticlesList = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.6
      }));
    }
  };
  resize();
  if (!bgParticlesResizeHandlerBound) {
    window.addEventListener('resize', resize);
    bgParticlesResizeHandlerBound = true;
  }

  const tick = () => {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    for (const p of bgParticlesList) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    for (let i = 0; i < bgParticlesList.length; i++) {
      for (let j = i + 1; j < bgParticlesList.length; j++) {
        const a = bgParticlesList[i], b = bgParticlesList[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.18;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${COLOR_RGB}, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (const p of bgParticlesList) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${COLOR_RGB}, 0.55)`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = `rgba(${COLOR_RGB}, 0.15)`;
      ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    bgParticlesAnimFrame = requestAnimationFrame(tick);
  };
  tick();
}

// Panggil ini tiap kali kondisi tampilan berpotensi berubah (ganti tab, buka/tutup modal
// login, atau setelah pengaturan diubah dari Developer Console).
function refreshBgParticlesVisibility() {
  if (shouldShowBgParticles()) startBgParticlesAnimation();
  else stopBgParticlesAnimation();
}
window.refreshBgParticlesVisibility = refreshBgParticlesVisibility;

// --- Handler panel kontrol (Developer Console > Technical) ---
function onBgParticlesEnabledToggle(checked) {
  setBgParticlesEnabled(checked);
  refreshBgParticlesVisibility();
}
window.onBgParticlesEnabledToggle = onBgParticlesEnabledToggle;

function onBgParticlesScopeChange(value) {
  setBgParticlesScope(value);
  refreshBgParticlesVisibility();
}
window.onBgParticlesScopeChange = onBgParticlesScopeChange;

// Isi ulang kontrol panel (toggle + dropdown) sesuai preference tersimpan -- dipanggil saat
// panel Technical Console dimount/dibuka, supaya tampilan switch selalu sinkron dgn state asli.
function syncBgParticlesPanelControls() {
  const toggle = document.getElementById('bg-particles-enabled-toggle');
  const select = document.getElementById('bg-particles-scope-select');
  if (toggle) toggle.checked = getBgParticlesEnabled();
  if (select) select.value = getBgParticlesScope();
}
window.syncBgParticlesPanelControls = syncBgParticlesPanelControls;
