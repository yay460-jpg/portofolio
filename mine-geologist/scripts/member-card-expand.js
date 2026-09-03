// [FINAL -- 4 Sep, keputusan user] Expand view kartu Member (Engine KPI 5 Pilar).
// Sebelumnya sempat dipasang 3 opsi trial sekaligus di Developer Console > Technical
// ("sidebar"/"inline"/"overlay") supaya bisa dicoba langsung. User memilih Opsi 2
// (card memanjang ke bawah) sebagai final -- panel trial & 2 opsi lain DIHAPUS total,
// file ini disederhanakan jadi murni toggle collapse/expand.

// Trigger klik icon di kartu. index = index kartu (sama dgn dipakai openMemberModal).
// event.stopPropagation() WAJIB dipanggil di pemanggil (onclick inline di member.js),
// supaya tidak ikut membuka modal detail member (klik kartu itu sendiri).
function toggleMemberKpiExpand(index) {
 const block = document.getElementById('member-kpi-expand-' + index);
 const icon = document.getElementById('member-kpi-expand-icon-' + index);
 if (!block) return;
 const willExpand = !block.classList.contains('expanded');
 block.classList.toggle('expanded', willExpand);
 if (icon) {
  icon.setAttribute('data-lucide', willExpand ? 'chevron-up' : 'chevron-down');
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
 }
}
