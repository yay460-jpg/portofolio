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
    '<div class="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target===this)closeDeveloperProfileModal_()">' +
      '<div id="developer-profile-panel" class="w-full max-w-[425px] rounded-[24px] bg-[#0e1933] border border-white/[0.08] shadow-2xl overflow-hidden translate-y-4 opacity-0 transition-all duration-300" onclick="event.stopPropagation()">' +
        '<div class="px-7 pt-7 pb-6">' +
          '<div class="flex items-start gap-5">' +
            '<div class="w-[112px] h-[150px] flex items-end justify-center overflow-hidden shrink-0">' +
              '<img id="developer-profile-image" src="../assets/lithosite-member-developer.png" alt="Lithosite Developer" class="w-[112px] h-[150px] object-contain opacity-0 scale-90 -translate-y-2 transition-all duration-500 ease-out">' +
            '</div>' +
            '<div id="developer-profile-text" class="flex-1 min-w-0 pt-1 opacity-0 translate-y-2 transition-all duration-500 ease-out text-left">' +
              '<div class="text-[24px] leading-none font-extrabold tracking-[-0.03em] text-white">Developer</div>' +
              '<div class="mt-1 text-[13px] text-blue-200/75">Lithosite Member</div>' +
              '<div class="mt-7 text-[9px] font-bold uppercase tracking-[0.18em] text-white/38">Aplikasi</div>' +
              '<div class="mt-2 inline-flex items-center rounded-full bg-white/[0.06] border border-white/[0.10] px-4 py-2 text-left">' +
                '<div class="text-[12px] leading-tight font-semibold text-white">Manajemen Program<br><span class="font-normal text-blue-200/65">(Web &amp; Mobile)</span></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="mt-5 rounded-[18px] border border-white/[0.10] bg-white/[0.025] px-5 py-4 text-left">' +
            '<div class="text-[9px] font-bold uppercase tracking-[0.18em] text-white/38">Tujuan</div>' +
            '<div class="mt-2 text-[13px] leading-relaxed text-blue-100/85">Mempermudah pengelolaan program, anggota, serta monitoring kegiatan agar lebih efektif.</div>' +
          '</div>' +

          '<div class="mt-5 text-right text-[12px] italic text-blue-100/55">Regards, Yay</div>' +
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
