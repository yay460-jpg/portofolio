// [FITUR TRIAL -- 4 Sep] Expand view kartu Member (Engine KPI 5 Pilar) -- 3 opsi UI
// dipasang bersamaan di Developer Console > Technical supaya bisa dicoba langsung &
// dipilih rasanya, BUKAN fitur final. Pengaturan tersimpan per-device (localStorage).
// Nilai 'style': 'sidebar' (Opsi 1, panel geser dari kanan) | 'inline' (Opsi 2, card
// memanjang ke bawah, DEFAULT) | 'overlay' (Opsi 3, card membesar sedikit di tempat).

function getMemberKpiExpandStyle_() {
 return localStorage.getItem('mine_member_kpi_expand_style') || 'inline';
}
function setMemberKpiExpandStyle_(v) {
 localStorage.setItem('mine_member_kpi_expand_style', v);
}

// Dipanggil dari dropdown panel Technical. Render ulang grid Member supaya style baru
// langsung kepakai di semua kartu (bukan cuma kartu yang sedang dibuka).
function onMemberKpiExpandStyleChange(v) {
 setMemberKpiExpandStyle_(v);
 if (typeof loadMembersFromSheet === 'function') loadMembersFromSheet();
}

// Sinkronkan dropdown Technical dengan localStorage saat panel dibuka (sama pola dengan
// syncBgParticlesPanelControls/syncSplashPanelControls).
function syncMemberKpiExpandStyleControls() {
 const sel = document.getElementById('member-kpi-expand-style-select');
 if (sel) sel.value = getMemberKpiExpandStyle_();
}

// Trigger klik icon di kartu. index = index kartu (sama dgn dipakai openMemberModal).
// event.stopPropagation() WAJIB dipanggil di pemanggil (onclick inline di member.js),
// supaya tidak ikut membuka modal detail member (klik kartu itu sendiri).
function toggleMemberKpiExpand(index) {
 const block = document.getElementById('member-kpi-expand-' + index);
 const card = document.getElementById('member-card-' + index);
 const icon = document.getElementById('member-kpi-expand-icon-' + index);
 if (!block) return;
 const willExpand = !block.classList.contains('expanded');
 block.classList.toggle('expanded', willExpand);
 if (card) card.classList.toggle('mkce-overlay-active', willExpand && getMemberKpiExpandStyle_() === 'overlay');
 if (icon) {
  icon.setAttribute('data-lucide', willExpand ? 'chevron-up' : 'chevron-down');
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
 }
}
