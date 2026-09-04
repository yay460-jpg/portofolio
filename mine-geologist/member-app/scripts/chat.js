/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- member-app/scripts/chat.js
 * [PARTISI -- 4 Sep, Tahap 4] Modal Chat Tim -- data ASLI dari sheet ChatLog, poll
 * berkala selagi modal terbuka. Diekstrak dari index.html tunggal -- 0 restrukturisasi
 * logika.
 * Dependency: config.js (GOOGLE_SCRIPT_READ_URL/fetchWithTimeout/icon), auth.js
 * (sessionInfo), render() (index.html Tahap 5).
 * ============================================================ */

// ==== MODAL: CHAT TIM (data ASLI dari sheet ChatLog, poll berkala selagi modal terbuka) ====
let chatModalOpen = false;
let chatMessages = [];
let chatLoading = false;
let chatErrorMsg = '';
let chatInputText = '';
let chatSendBusy = false;
let chatPollTimer = null;

async function fetchChatMessages(silent) {
  if (!silent) { chatLoading = true; chatErrorMsg = ''; render(); }
  try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=chat&limit=50&t=' + Date.now());
    const result = await response.json();
    if (result.status === 'error') {
      chatErrorMsg = result.message || 'Server menolak permintaan Chat.';
    } else {
      chatMessages = result.data || [];
      chatErrorMsg = '';
    }
  } catch (err) {
    chatErrorMsg = 'Tidak bisa menghubungi server: ' + (err && err.message ? err.message : String(err));
  }
  chatLoading = false;
  render();
  const list = document.getElementById('chat-scroll-list');
  if (list) list.scrollTop = list.scrollHeight;
}
async function openChatModal() {
  chatModalOpen = true;
  await fetchChatMessages(false);
  if (chatPollTimer) clearInterval(chatPollTimer);
  chatPollTimer = setInterval(() => { if (chatModalOpen) fetchChatMessages(true); }, 8000);
}
function closeChatModal() {
  chatModalOpen = false;
  if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; }
  render();
}
function updateChatInput(val) { chatInputText = val; }
async function submitChatMessage() {
  const text = chatInputText.trim();
  if (!text || chatSendBusy) return;
  chatSendBusy = true; render();
  try {
    const payload = buildAuthenticatedPayload({ sheet_name: 'ChatLog', message: text });
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload }, 20000);
    const result = await response.json();
    if (result.status === 'success') {
      chatInputText = '';
      await fetchChatMessages(true);
    } else {
      chatErrorMsg = result.message || 'Gagal mengirim pesan.';
    }
  } catch (err) {
    chatErrorMsg = 'Tidak bisa menghubungi server: ' + (err && err.message ? err.message : String(err));
  }
  chatSendBusy = false;
  render();
}
function renderChatModal(justOpened) {
  if (!chatModalOpen) return '';
  const animClass = (justOpened === false) ? '' : ' fade-in';
  let list;
  if (chatLoading) {
    list = '<div class="flex items-center justify-center py-10"><span class="w-6 h-6 border-2 border-white/20 border-t-[#2563eb] rounded-full spin"></span></div>';
  } else if (chatErrorMsg && !chatMessages.length) {
    list = '<div class="rounded-[12px] bg-rose-500/10 border border-rose-500/25 p-4 m-4"><div class="text-xs font-bold text-rose-300">Gagal memuat Chat</div><div class="text-[11px] text-rose-300/70 mt-1">' + chatErrorMsg + '</div></div>';
  } else if (!chatMessages.length) {
    list = '<div class="text-center text-white/40 text-xs py-10">Belum ada pesan. Mulai percakapan tim di bawah.</div>';
  } else {
    list = chatMessages.map(m => {
      const isMe = sessionInfo && String(m.sender||'').trim().toLowerCase() === String(sessionInfo.userName||'').trim().toLowerCase();
      return '<div class="mb-3 flex ' + (isMe ? 'justify-end' : 'justify-start') + '">' +
        '<div class="max-w-[78%] ' + (isMe ? 'bg-[#2563eb]' : 'bg-[#0b1329] border border-white/[0.08]') + ' rounded-[14px] px-3.5 py-2.5">' +
          (!isMe ? '<div class="text-[10px] font-bold text-blue-300 mb-0.5">' + (m.sender||'Anonim') + (m.role ? (' &bull; ' + m.role) : '') + '</div>' : '') +
          '<div class="text-[13px] text-white leading-snug break-words">' + String(m.message||'').replace(/</g,'&lt;') + '</div>' +
          '<div class="text-[9px] ' + (isMe ? 'text-white/60' : 'text-white/30') + ' mt-1 text-right">' + (m.timestamp||'') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
  return '' +
  '<div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-end' + animClass + '" onclick="if(event.target===this)closeChatModal()">' +
    '<div class="w-full max-w-[480px] mx-auto bg-[#0e1933] rounded-t-[24px] h-[80vh] flex flex-col border-t border-white/10">' +
      '<div class="shrink-0 px-5 pt-5 pb-3 border-b border-white/[0.06] flex items-center justify-between">' +
        '<div><div class="text-sm font-bold text-white">Chat Tim</div><div class="text-[10px] text-white/35">' + chatMessages.length + ' pesan terbaru</div></div>' +
        '<button onclick="closeChatModal()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">' + icon('x','w-4 h-4 text-white/50') + '</button>' +
      '</div>' +
      '<div id="chat-scroll-list" class="flex-1 min-h-0 overflow-y-auto px-4 py-3">' + list + '</div>' +
      (chatErrorMsg && chatMessages.length ? '<div class="shrink-0 px-4 pb-1 text-[10px] text-rose-400">' + chatErrorMsg + '</div>' : '') +
      '<div class="shrink-0 px-4 py-3 border-t border-white/[0.06] flex items-center gap-2">' +
        '<input value="' + chatInputText.replace(/"/g,'&quot;') + '" oninput="updateChatInput(this.value)" onkeydown="if(event.key===\'Enter\'){submitChatMessage();}" placeholder="Tulis pesan..." class="flex-1 bg-[#0b1329] border border-white/10 rounded-full px-4 py-2.5 text-[13px] text-white outline-none focus:border-[#2563eb]/60">' +
        '<button onclick="submitChatMessage()" ' + (chatSendBusy?'disabled':'') + ' class="shrink-0 w-10 h-10 rounded-full bg-[#2563eb] flex items-center justify-center disabled:opacity-60">' +
          (chatSendBusy ? '<span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full spin"></span>' : icon('send','w-4 h-4 text-white')) +
        '</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}
