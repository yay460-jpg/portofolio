/* ============================================================
 * LITHOSITE MEMBER -- DEVELOPER PROFILE
 * Isolated module: trigger + modal + animation only.
 * Asset: ../assets/lithosite-member-developer.png
 * Tidak bergantung pada lifecycle map / boot / render selain hook render().
 * ============================================================ */

let developerProfileOpen = false;
let developerProfileAnimationRaf_ = 0;
let developerProfileAnimationTimers_ = [];
let developerProfileBlinkInterval_ = 0;

function clearDeveloperProfileAnimation_() {
  if (developerProfileAnimationRaf_) {
    cancelAnimationFrame(developerProfileAnimationRaf_);
    developerProfileAnimationRaf_ = 0;
  }
  developerProfileAnimationTimers_.forEach(function(timerId) {
    clearTimeout(timerId);
  });
  developerProfileAnimationTimers_ = [];
  if (developerProfileBlinkInterval_) {
    clearInterval(developerProfileBlinkInterval_);
    developerProfileBlinkInterval_ = 0;
  }
}

function openDeveloperProfileModal_() {
  clearDeveloperProfileAnimation_();
  developerProfileOpen = true;
  render();
  developerProfileAnimationTimers_.push(setTimeout(startDeveloperProfileAnimation_, 0));
}

function closeDeveloperProfileModal_() {
  clearDeveloperProfileAnimation_();
  developerProfileOpen = false;
  render();
}

function startDeveloperProfileAnimation_() {
  clearDeveloperProfileAnimation_();
  developerProfileAnimationRaf_ = requestAnimationFrame(function() {
    const panel = document.getElementById('developer-profile-panel');
    const image = document.getElementById('developer-profile-image');
    const text = document.getElementById('developer-profile-text');
    if (!panel || !image || !text || !developerProfileOpen) return;

    panel.classList.add('developer-profile-ready');
    image.classList.add('developer-profile-image-ready');
    text.classList.add('developer-profile-text-ready');
    developerProfileAnimationRaf_ = 0;

    developerProfileBlinkInterval_ = setInterval(function() {
      if (!developerProfileOpen) return;
      const currentImage = document.getElementById('developer-profile-image');
      if (!currentImage) return;
      currentImage.classList.remove('developer-profile-blink');
      void currentImage.offsetWidth;
      currentImage.classList.add('developer-profile-blink');
    }, 3200);
  });
}

function renderDeveloperProfileModal() {
  if (!developerProfileOpen) return '';

  return '' +
    '<div class="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="if(event.target===this)closeDeveloperProfileModal_()">' +
      '<div id="developer-profile-panel" class="w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] bg-[#0b1329] border border-white/[0.08] shadow-2xl overflow-hidden translate-y-4 opacity-0 transition-all duration-300" onclick="event.stopPropagation()">' +
        '<div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">' +
          '<div>' +
            '<div class="text-[15px] font-bold text-white">Developer</div>' +
            '<div class="text-[10px] text-white/35">Lithosite Member</div>' +
          '</div>' +
          '<button onclick="closeDeveloperProfileModal_()" aria-label="Tutup Profile Developer" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 active:scale-95">' +
            icon('x','w-4 h-4') +
          '</button>' +
        '</div>' +
        '<div class="px-5 pt-5 pb-6 text-center">' +
          '<div class="mx-auto w-[230px] h-[230px] flex items-end justify-center overflow-hidden">' +
            '<img id="developer-profile-image" src="../assets/lithosite-member-developer.png" alt="Lithosite Developer" class="w-[230px] h-[230px] object-contain opacity-0 scale-90 -translate-y-2 transition-all duration-500 ease-out">' +
          '</div>' +
          '<div id="developer-profile-text" class="mt-2 opacity-0 translate-y-2 transition-all duration-500 ease-out text-left">' +
            '<div class="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">Aplikasi</div>' +
            '<div class="mt-0.5 text-[13px] font-semibold leading-snug text-white">Manajemen Program (Web &amp; Mobile)</div>' +
            '<div class="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">Tujuan</div>' +
            '<div class="mt-0.5 text-[12px] leading-relaxed text-white/60">Membantu mengatur tugas, deadline, dan kolaborasi secara real-time</div>' +
            '<div class="mt-4 text-right text-[11px] leading-relaxed text-white/55">Regards,-<br><span class="font-semibold text-white/75">Yaya</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<style>' +
      '.developer-profile-ready{transform:translateY(0);opacity:1}' +
      '.developer-profile-image-ready{opacity:1;transform:scale(1) translateY(0)}' +
      '.developer-profile-text-ready{opacity:1;transform:translateY(0)}' +
      '.developer-profile-blink{animation:developerProfileBlink_ .22s ease}' +
      '@keyframes developerProfileBlink_{0%,100%{transform:scale(1)}50%{transform:scale(.985)}}' +
    '</style>';
}
