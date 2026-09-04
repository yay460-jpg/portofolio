/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- member-app/scripts/issue.js
 * [PARTISI -- 4 Sep, Tahap 4] Modal Issue & Action -- data ASLI dari sheet "Masalah
 * & Rekomendasi" (list + form tambah). Diekstrak dari index.html tunggal -- 0
 * restrukturisasi logika. File ke-7, di luar rencana awal 6 file (ketemu saat
 * pemetaan: Issue berdiri sendiri, bukan bagian Settings/Account).
 * Dependency: config.js, auth.js, renderSimpleModal()/render() (index.html Tahap 5).
 * ============================================================ */

// ==== MODAL: ISSUE & ACTION (data ASLI dari sheet "Masalah & Rekomendasi") ====
let issueModalOpen = false;
let issueListData = [];
let issueLoading = false;
let issueErrorMsg = '';
let issueFormOpen = false;
let issueFormState = { masalah:'', lokasi:'', dampak:'', rekomendasi:'', pic:'', target:'', status:'Open' };
let issueSubmitStatusMsg = '', issueSubmitOk = true, issueSubmitBusy = false;

async function openIssueModal() {
  issueModalOpen = true; issueLoading = true; issueErrorMsg = ''; issueFormOpen = false;
  render();
  try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=issue&t=' + Date.now());
    const result = await response.json();
    if (result.status === 'error') {
      issueErrorMsg = result.message || 'Server menolak permintaan data Issue.';
      issueListData = [];
    } else {
      issueListData = (result.data || []).slice().reverse();
    }
  } catch (err) {
    issueErrorMsg = 'Tidak bisa menghubungi server: ' + (err && err.message ? err.message : String(err));
    issueListData = [];
  }
  issueLoading = false;
  render();
}
function closeIssueModal() { issueModalOpen = false; render(); }
function openIssueForm() {
  issueFormOpen = true;
  issueFormState = { masalah:'', lokasi:'', dampak:'', rekomendasi:'', pic:'', target:'', status:'Open' };
  issueSubmitStatusMsg = '';
  render();
}
function closeIssueForm() { issueFormOpen = false; render(); }
function updateIssueField(name, val) { issueFormState[name] = val; render(); }

async function submitIssueEntry() {
  const f = issueFormState;
  if (!f.masalah || !f.lokasi || !f.pic) {
    issueSubmitStatusMsg = 'Masalah, Lokasi, dan PIC wajib diisi.'; issueSubmitOk = false; render(); return;
  }
  issueSubmitBusy = true; issueSubmitStatusMsg = ''; render();
  try {
    const now = new Date();
    const payload = buildAuthenticatedPayload({
      sheet_name: 'Masalah & Rekomendasi',
      tanggal: todayDateStr(),
      waktu: now.toTimeString().slice(0,5),
      masalah: f.masalah, lokasi: f.lokasi, dampak: f.dampak,
      rekomendasi: f.rekomendasi, pic: f.pic, target: f.target, status: f.status
    });
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
    const result = await response.json();
    if (result.status === 'success') {
      issueSubmitStatusMsg = 'Issue berhasil disimpan!'; issueSubmitOk = true; render();
      setTimeout(async () => { issueFormOpen = false; await openIssueModal(); }, 800);
    } else {
      throw new Error(result.message || 'Gagal menyimpan issue.');
    }
  } catch (err) {
    issueSubmitStatusMsg = err.message || 'Terjadi kesalahan saat menyimpan.'; issueSubmitOk = false;
  }
  issueSubmitBusy = false;
  render();
}

function statusBadgeColor(status) {
  const s = String(status||'').toLowerCase();
  if (s === 'close' || s === 'closed') return 'bg-[#22c55e]';
  if (s === 'progress') return 'bg-[#2563eb]';
  return 'bg-amber-500'; // Open
}

function renderIssueModal(justOpened) {
  if (!issueModalOpen) return '';
  let body;
  if (issueFormOpen) {
    const f = issueFormState;
    body = '<div class="space-y-3">' +
      fieldRow('Masalah *', textField('masalah', f.masalah, 'Deskripsi masalah')) +
      fieldRow('Lokasi *', textField('lokasi', f.lokasi, 'cth. Pit A1')) +
      fieldRow('Dampak', textField('dampak', f.dampak, 'Dampak operasional')) +
      fieldRow('Rekomendasi', textField('rekomendasi', f.rekomendasi, 'Saran tindak lanjut')) +
      fieldRow('PIC *', textField('pic', f.pic, 'Nama PIC (harus terdaftar di Member)')) +
      fieldRow('Target', textField('target', f.target, 'cth. 30 Agu 2026')) +
      fieldRow('Status', selectField('status', ['Open','Progress','Close'], f.status)) +
      (issueSubmitStatusMsg ? '<p class="text-xs font-medium ' + (issueSubmitOk?'text-emerald-400':'text-rose-400') + '">' + issueSubmitStatusMsg + '</p>' : '') +
      '<button onclick="submitIssueEntry()" ' + (issueSubmitBusy?'disabled':'') + ' class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm py-3 rounded-xl disabled:opacity-60">' +
        (issueSubmitBusy ? '<span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full spin"></span>' : icon('save','w-4 h-4')) +
        '<span>' + (issueSubmitBusy?'Menyimpan...':'Simpan Issue') + '</span>' +
      '</button>' +
      '<button onclick="closeIssueForm()" class="w-full text-center text-[11px] text-white/40 font-medium py-1">Batal, kembali ke daftar</button>' +
    '</div>';
  } else if (issueLoading) {
    body = '<div class="flex items-center justify-center py-10"><span class="w-6 h-6 border-2 border-white/20 border-t-[#2563eb] rounded-full spin"></span></div>';
  } else if (issueErrorMsg) {
    body = '<div class="rounded-[12px] bg-rose-500/10 border border-rose-500/25 p-4"><div class="text-xs font-bold text-rose-300">Gagal memuat Issue</div><div class="text-[11px] text-rose-300/70 mt-1">' + issueErrorMsg + '</div></div>';
  } else {
    body = '<button onclick="openIssueForm()" class="w-full mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs py-3 rounded-xl">' + icon('plus','w-4 h-4') + '<span>Tambah Issue Baru</span></button>';
    if (!issueListData.length) {
      body += '<div class="text-center text-white/40 text-xs py-6">Belum ada issue tercatat.</div>';
    } else {
      issueListData.forEach(it => {
        body += '<div class="rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-3.5 mb-2.5">' +
          '<div class="flex items-start justify-between gap-2 mb-1">' +
            '<span class="text-[13px] font-bold text-white leading-tight">' + (it.masalah||'-') + '</span>' +
            '<span class="shrink-0 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full ' + statusBadgeColor(it.status) + ' text-white">' + (it.status||'Open') + '</span>' +
          '</div>' +
          '<div class="text-[11px] text-white/45">' + (it.lokasi||'-') + ' &bull; PIC ' + (it.pic||'-') + (it.target ? (' &bull; target ' + it.target) : '') + '</div>' +
        '</div>';
      });
    }
  }
  return renderSimpleModal(issueFormOpen ? 'Tambah Issue' : 'Issue &amp; Action', issueFormOpen ? 'Masalah &amp; Rekomendasi' : (issueListData.length + ' issue tercatat'), body, issueFormOpen ? 'closeIssueForm()' : 'closeIssueModal()', undefined, justOpened);
}
