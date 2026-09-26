/* Lithosite Member — Topo3D UI adapter.
 * Shared engine stays UI-independent in shared/topo3d/topo3d-engine.js.
 * This adapter owns only Member Peta-mode switching + loading lifecycle.
 */
let memberTopo3D_ = null;
let memberTopo3DReady_ = false;
let memberTopo3DBusy_ = false;
let memberTopo3DError_ = '';
let memberPetaViewMode_ = 'location';
let memberTopoObserverInstalled_ = false;
let memberTopoMountBusy_ = false;
let memberTopoFlagMode_ = 'off';
let memberTopoFlagSmartOffset_ = false;
let memberTopoFlagSelectedIds_ = [];
let memberTopoFlagRaf_ = null;
let memberTopoFlagLastDataKey_ = '';
let memberTopoSourceFiles_ = null;
let memberTopoFlagDataBusy_ = false;
let memberTopo360Playing_ = false;
let memberTopo360Raf_ = null;

async function prepareMemberTopo3D_(canvas, hooks) {
  hooks = hooks || {};
  if (!canvas) throw new Error('Canvas 3D Topografi tidak tersedia.');
  if (memberTopo3DReady_ && memberTopo3D_ && memberTopo3D_.canvas === canvas) return memberTopo3D_;
  if (memberTopo3DBusy_) return memberTopo3D_;
  memberTopo3DBusy_ = true;
  memberTopo3DError_ = '';
  try {
    if (memberTopo3D_ && memberTopo3D_.canvas !== canvas) {
      try { memberTopo3D_.destroy(); } catch (_) {}
      memberTopo3D_ = null;
      memberTopo3DReady_ = false;
    }
    memberTopo3D_ = window.LithositeTopo3D.create({
      canvas: canvas,
      onStatus: function(msg) { if (hooks.onStatus) hooks.onStatus(msg); },
      onReady: function(info) { memberTopo3DReady_ = true; if (hooks.onReady) hooks.onReady(info); },
      onError: function(err) { memberTopo3DError_ = String(err && err.message ? err.message : err); if (hooks.onError) hooks.onError(err); }
    });
    await memberTopo3D_.prepare();
    memberTopo3DReady_ = true;
    return memberTopo3D_;
  } catch (err) {
    memberTopo3DError_ = String(err && err.message ? err.message : err);
    memberTopo3DReady_ = false;
    if (hooks.onError) hooks.onError(err);
    throw err;
  } finally {
    memberTopo3DBusy_ = false;
  }
}

function updateMemberTopo360Button_() {
  const btn = document.getElementById('mg1-topo-360-toggle');
  if (!btn) return;
  btn.setAttribute('aria-pressed', memberTopo360Playing_ ? 'true' : 'false');
  btn.title = memberTopo360Playing_ ? 'Hentikan rotasi 360°' : 'Putar 360°';
  btn.setAttribute('aria-label', memberTopo360Playing_ ? 'Hentikan rotasi 360°' : 'Putar 360°');
  btn.classList.toggle('bg-[#2563eb]/80', memberTopo360Playing_);
  btn.classList.toggle('border-blue-300/40', memberTopo360Playing_);
  btn.innerHTML = memberTopo360Playing_
    ? '<svg viewBox="0 0 24 24" class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 7v10M17 7v10"/><path d="M5 12a7 7 0 0 0 13 3M19 12A7 7 0 0 0 6 9"/><path d="m6 6 2 3-3 .5M18 18l-2-3 3-.5"/></svg>'
    : '<svg viewBox="0 0 24 24" class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M9.5 8.8 16 12l-6.5 3.2V8.8Z" fill="currentColor" stroke="none"/></svg>';
}

function stopMemberTopo360_() {
  memberTopo360Playing_ = false;
  if (memberTopo360Raf_ != null) { cancelAnimationFrame(memberTopo360Raf_); memberTopo360Raf_ = null; }
  updateMemberTopo360Button_();
}

function startMemberTopo360_() {
  if (!memberTopo3D_ || !memberTopo3DReady_ || !memberTopo3D_.model) return;
  if (memberTopo360Playing_) return;
  memberTopo360Playing_ = true;
  updateMemberTopo360Button_();
  const tick = function() {
    if (!memberTopo360Playing_ || !memberTopo3D_ || !memberTopo3D_.model) { memberTopo360Raf_ = null; return; }
    memberTopo3D_.angleY += 0.008;
    if (memberTopo3D_.angleY > Math.PI * 2) memberTopo3D_.angleY -= Math.PI * 2;
    memberTopo360Raf_ = requestAnimationFrame(tick);
  };
  memberTopo360Raf_ = requestAnimationFrame(tick);
}

function toggleMemberTopo360_() {
  if (memberTopo360Playing_) stopMemberTopo360_();
  else startMemberTopo360_();
}

function getMemberTopo3D_() { return memberTopo3D_; }
function getMemberTopo3DState_() {
  return {
    ready: memberTopo3DReady_,
    busy: memberTopo3DBusy_,
    error: memberTopo3DError_,
    state: memberTopo3D_ && typeof memberTopo3D_.getState === 'function' ? memberTopo3D_.getState() : null
  };
}
function destroyMemberTopo3D_() {
  stopMemberTopo360_();
  if (memberTopo3D_) { try { memberTopo3D_.destroy(); } catch (_) {} }
  memberTopo3D_ = null;
  memberTopo3DReady_ = false;
  memberTopo3DBusy_ = false;
  memberTopo3DError_ = '';
}

function topoEsc_(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
  });
}

function topoSetLoading_(visible, title, sub) {
  const el = document.getElementById('mg1-topo3d-loading');
  if (!el) return;
  const t = el.querySelector('[data-topo-loading-title]');
  const s = el.querySelector('[data-topo-loading-sub]');
  if (t) t.textContent = title || 'Menyiapkan 3D Topografi…';
  if (s) s.textContent = sub || 'Menyiapkan WebGL. Mohon tunggu.';
  el.style.display = visible ? 'flex' : 'none';
}

function topoSetStatus_(msg, error) {
  const el = document.getElementById('mg1-topo3d-status');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'text-[9px] ' + (error ? 'text-rose-300' : 'text-blue-200/80');
}

function getMemberTopoFlagData_() {
  try {
    if (typeof buildMapData === 'function') {
      return buildMapData().filter(function(p) {
        return p && p.idTp && p.hasValidCoord && Number.isFinite(Number(p.timur)) && Number.isFinite(Number(p.utara));
      }).map(function(p) {
        return { idTp:String(p.idTp), timur:Number(p.timur), utara:Number(p.utara) };
      });
    }
  } catch (_) {}
  return [];
}

function topoFlagNormalizeSelection_() {
  var data=getMemberTopoFlagData_(), valid=new Set(data.map(function(p){return p.idTp;}));
  var seen=new Set(), out=[];
  (memberTopoFlagSelectedIds_||[]).forEach(function(id){ id=String(id||'').trim(); if(id&&valid.has(id)&&!seen.has(id)&&out.length<5){seen.add(id);out.push(id);} });
  memberTopoFlagSelectedIds_=out;
}

function topoRefreshFlagPicker_() {
  var picker=document.getElementById('mg1-topo-flag-picker');
  if (!picker) return;
  topoFlagNormalizeSelection_();
  var data=getMemberTopoFlagData_();
  var ids=data.map(function(p){return p.idTp;});
  var html='';
  for(var i=0;i<5;i++){
    var selected=memberTopoFlagSelectedIds_[i]||'';
    html+='<select data-topo-flag-slot="'+i+'" class="w-full h-7 rounded-md bg-[#071027] border border-white/10 text-[9px] text-white px-2 outline-none">';
    html+='<option value="">ID TP '+(i+1)+' — pilih</option>';
    ids.forEach(function(id){html+='<option value="'+topoEsc_(id)+'"'+(id===selected?' selected':'')+'>'+topoEsc_(id)+'</option>';});
    html+='</select>';
  }
  picker.innerHTML=html;
  picker.style.display=(memberTopoFlagMode_==='tp')?'grid':'none';
  picker.querySelectorAll('select[data-topo-flag-slot]').forEach(function(sel){
    sel.addEventListener('change',function(){
      var next=[];
      picker.querySelectorAll('select[data-topo-flag-slot]').forEach(function(x){var v=String(x.value||'').trim();if(v&&!next.includes(v))next.push(v);});
      memberTopoFlagSelectedIds_=next.slice(0,5);
      if(next.length>5) topoSetStatus_('Maksimum 5 ID TP.',true);
      topoRefreshFlagPicker_();
      topoStartFlagOverlay_();
    });
  });
}

async function loadMemberTopoFlagData_() {
  if (getMemberTopoFlagData_().length) return true;
  if (memberTopoFlagDataBusy_) return false;
  if (typeof fetchWithTimeout !== 'function' || typeof GOOGLE_SCRIPT_READ_URL === 'undefined') return false;
  memberTopoFlagDataBusy_ = true;
  try {
    const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=validasi&t=' + Date.now());
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message || 'Server menolak data Validasi.');
    globalValidasiFullForMap = typeof forwardFillValidasiRows_ === 'function'
      ? forwardFillValidasiRows_(result.data || []).slice()
      : (result.data || []).slice();
    if (typeof mapDataFetchAttempted !== 'undefined') mapDataFetchAttempted = true;
    return getMemberTopoFlagData_().length > 0;
  } catch (err) {
    topoSetStatus_('Data ID TP belum tersedia: ' + (err && err.message ? err.message : err), true);
    return false;
  } finally {
    memberTopoFlagDataBusy_ = false;
  }
}

function setMemberTopoFlagMode_(mode) {
  mode=(mode==='tp')?'tp':'off';
  memberTopoFlagMode_=mode;
  if(mode==='off') memberTopoFlagSelectedIds_=[];
  topoRefreshFlagPicker_();
  if(mode==='tp' && getMemberTopoFlagData_().length===0) {
    loadMemberTopoFlagData_().then(function(){ topoRefreshFlagPicker_(); topoStartFlagOverlay_(); });
  }
  topoStartFlagOverlay_();
}

function toggleMemberTopoSmartOffset_() {
  memberTopoFlagSmartOffset_ = !memberTopoFlagSmartOffset_;
  var btn=document.getElementById('mg1-topo-smart-offset-toggle');
  if(btn){
    btn.setAttribute('aria-pressed', memberTopoFlagSmartOffset_ ? 'true' : 'false');
    btn.title = memberTopoFlagSmartOffset_ ? 'Smart Offset aktif — label collision/leader line' : 'Smart Offset nonaktif — label natural';
    btn.className = 'w-8 h-8 rounded-full border text-white text-[13px] font-bold shadow-lg pointer-events-auto ' + (memberTopoFlagSmartOffset_ ? 'bg-blue-600/90 border-blue-300/60' : 'bg-[#0b1329]/95 border-white/10');
  }
  topoStartFlagOverlay_();
}

function topoFindFlagPoint_(id) {
  return getMemberTopoFlagData_().find(function(p){return p.idTp===id;})||null;
}

function topoFlagCandidatePositions_(p, labelW, labelH, w, h, smart) {
  var gap=10;
  /* Normal mode: keep labels close to their real marker and let collision
     handling choose another local quadrant. There is deliberately NO upper-lane
     bias here, so manual camera rotation feels natural instead of rigid. */
  var out=[
    {x:p.x+14,y:p.y-labelH-gap,kind:'normal'},
    {x:p.x+14,y:p.y+gap,kind:'normal'},
    {x:p.x-labelW-14,y:p.y-labelH-gap,kind:'normal'},
    {x:p.x-labelW-14,y:p.y+gap,kind:'normal'},
    {x:p.x-labelW/2,y:p.y-labelH-18,kind:'normal'},
    {x:p.x-labelW/2,y:p.y+18,kind:'normal'},
    {x:p.x+24,y:p.y-labelH/2,kind:'normal'},
    {x:p.x-labelW-24,y:p.y-labelH/2,kind:'normal'},
    {x:p.x+30,y:p.y-labelH-30,kind:'normal'},
    {x:p.x-labelW-30,y:p.y-labelH-30,kind:'normal'},
    {x:p.x+30,y:p.y+30,kind:'normal'},
    {x:p.x-labelW-30,y:p.y+30,kind:'normal'}
  ];

  if (smart) {
    /* Smart Offset mode: several elevated lanes are available for dense
       clusters, with lower fallbacks when the upper area is occupied. */
    var levels=[30,54,78,102,126];
    levels.forEach(function(up,idx){
      var spread=Math.min(2,idx)*Math.max(14,labelW*.72);
      out.push({x:p.x-labelW/2,y:p.y-labelH-up,kind:'elevated'});
      out.push({x:p.x-labelW/2-spread,y:p.y-labelH-up,kind:'elevated'});
      out.push({x:p.x-labelW/2+spread,y:p.y-labelH-up,kind:'elevated'});
    });
    [34,58,82].forEach(function(down){
      out.push({x:p.x-labelW/2,y:p.y+down,kind:'fallback'});
    });
  }

  return out.map(function(q){
    return {
      x:Math.max(4,Math.min(w-labelW-4,q.x)),
      y:Math.max(4,Math.min(h-labelH-4,q.y)),
      kind:q.kind
    };
  });
}

function topoRectsOverlap_(a,b,pad) {
  pad=pad||0;
  return !(a.x+a.w+pad<=b.x||b.x+b.w+pad<=a.x||a.y+a.h+pad<=b.y||b.y+b.h+pad<=a.y);
}

function topoFlagPointDistance_(a,b) {
  var dx=a.x-b.x,dy=a.y-b.y;
  return Math.sqrt(dx*dx+dy*dy);
}

function topoFlagIsClustered_(point, points) {
  return points.some(function(other){
    return other!==point && topoFlagPointDistance_(point.p,other.p)<82;
  });
}

function topoFlagReservedRects_(w,h) {
  /* Keep labels away from the fixed Topo3D chrome. These are intentionally
     conservative visual exclusion zones, not engine geometry. */
  return [
    {x:0,y:0,w:w,h:58},
    {x:Math.max(0,w-58),y:58,w:58,h:270},
    {x:0,y:Math.max(0,h-112),w:w,h:112}
  ];
}

function topoFlagRectDistanceToPoint_(r,p) {
  var cx=Math.max(r.x,Math.min(p.x,r.x+r.w));
  var cy=Math.max(r.y,Math.min(p.y,r.y+r.h));
  var dx=p.x-cx,dy=p.y-cy;
  return Math.sqrt(dx*dx+dy*dy);
}

function topoFlagLeaderPoints_(p,r,kind) {
  var tx=Math.max(r.x+4,Math.min(p.x,r.x+r.w-4));
  var ty=Math.max(r.y+4,Math.min(p.y,r.y+r.h-4));
  if (kind==='elevated') {
    var elbowY=Math.max(r.y+r.h+5,Math.min(p.y-7,(r.y+r.h+p.y)/2));
    return [
      {x:p.x,y:p.y},
      {x:p.x,y:elbowY},
      {x:tx,y:elbowY},
      {x:tx,y:ty}
    ];
  }
  return [{x:p.x,y:p.y},{x:tx,y:ty}];
}

function topoFlagLeaderLength_(pts) {
  var total=0;
  for(var i=1;i<pts.length;i++){
    var dx=pts[i].x-pts[i-1].x,dy=pts[i].y-pts[i-1].y;
    total+=Math.sqrt(dx*dx+dy*dy);
  }
  return total;
}

function topoRenderFlagOverlay_() {
  var overlay=document.getElementById('mg1-topo-flag-overlay'),svg=document.getElementById('mg1-topo-flag-lines'),e=getMemberTopo3D_();
  if(!overlay||!svg||!e||memberTopoFlagMode_!=='tp'||!e.getState().ready){if(overlay)overlay.style.display='none';return;}
  var canvas=document.getElementById('mg1-topo3d-canvas'); if(!canvas)return;
  overlay.style.display='block';
  var w=canvas.clientWidth,h=canvas.clientHeight; overlay.style.width=w+'px';overlay.style.height=h+'px';
  Array.from(overlay.children).forEach(function(ch){if(ch!==svg)ch.remove();});
  svg.setAttribute('width',w);svg.setAttribute('height',h);svg.setAttribute('viewBox','0 0 '+w+' '+h);
  svg.setAttribute('preserveAspectRatio','none');svg.style.pointerEvents='none';svg.innerHTML='';
  var points=memberTopoFlagSelectedIds_.map(function(id){
    var raw=topoFindFlagPoint_(id);if(!raw)return null;
    // Site DTM/STR axis contract: STR X = native Utara, STR Y = native Timur.
    // Validasi/2D Map keeps the user-facing labels Timur/Utara, so bridge them here
    // without changing the source data or 2D renderer.
    var q=e.projectCoordinate(raw.utara,raw.timur);
    return q&&Number.isFinite(q.x)&&Number.isFinite(q.y)?{id:id,p:q}:null;
  }).filter(function(item){return item.p.x>=-120&&item.p.x<=w+120&&item.p.y>=-120&&item.p.y<=h+120;});
  var labels=[],occupied=topoFlagReservedRects_(w,h);
  if(memberTopoFlagSelectedIds_.length && !points.length){ topoSetStatus_('ID TP terpilih berada di luar projection view terrain.', true); }

  /* First place the most crowded TP so the harder cluster gets the best lanes. */
  points.sort(function(a,b){
    var ac=points.filter(function(x){return x!==a&&topoFlagPointDistance_(a.p,x.p)<82;}).length;
    var bc=points.filter(function(x){return x!==b&&topoFlagPointDistance_(b.p,x.p)<82;}).length;
    return bc-ac;
  });

  points.forEach(function(item){
    var labelW=Math.max(58,Math.min(100,10+item.id.length*7)),labelH=22;
    var smart=memberTopoFlagSmartOffset_;
    var clustered=smart && topoFlagIsClustered_(item,points);
    var nearby=points.filter(function(x){return x!==item&&topoFlagPointDistance_(item.p,x.p)<82;}).length;
    var cands=topoFlagCandidatePositions_(item.p,labelW,labelH,w,h,smart);
    var best=null,bestScore=Infinity;
    cands.forEach(function(c,idx){
      var r={x:c.x,y:c.y,w:labelW,h:labelH},collisions=0;
      occupied.forEach(function(o){if(topoRectsOverlap_(r,o,5))collisions++;});
      var score=collisions*100000 + idx*2;
      /* Smart mode may prefer an elevated lane for dense clusters. Normal mode
         intentionally has no upper-lane preference and stays close to marker. */
      if(smart && clustered) score+=(c.kind==='elevated'?-1200:(c.kind==='fallback'?120:1200));
      score+=Math.abs((c.x+labelW/2)-item.p.x)*.012+Math.abs((c.y+labelH/2)-item.p.y)*.012;
      if(smart && c.kind==='elevated')score+=Math.max(0,(h-120)-(c.y+labelH))*.002;
      if(score<bestScore){bestScore=score;best={r:r,kind:c.kind};}
    });
    if(!best) best={r:{x:Math.max(4,Math.min(w-labelW-4,item.p.x-labelW/2)),y:Math.max(4,Math.min(h-labelH-4,item.p.y-labelH-18)),w:labelW,h:labelH},kind:'normal'};
    occupied.push(best.r);
    labels.push({id:item.id,p:item.p,r:best.r,kind:best.kind});
  });

  labels.forEach(function(item){
    var ns='http://www.w3.org/2000/svg';
    var leader=topoFlagLeaderPoints_(item.p,item.r,item.kind);
    var pl=document.createElementNS(ns,'polyline');
    pl.setAttribute('points',leader.map(function(pt){return pt.x+','+pt.y;}).join(' '));
    pl.setAttribute('fill','none');pl.setAttribute('stroke','#facc15');pl.setAttribute('stroke-width',item.kind==='elevated'?'1.5':'1.2');pl.setAttribute('stroke-opacity','.92');
    svg.appendChild(pl);

    var circle=document.createElementNS(ns,'circle');
    circle.setAttribute('cx',item.p.x);circle.setAttribute('cy',item.p.y);circle.setAttribute('r','6');
    circle.setAttribute('fill','#facc15');circle.setAttribute('stroke','#070b1c');circle.setAttribute('stroke-width','2');
    svg.appendChild(circle);

    var rect=document.createElementNS(ns,'rect');
    rect.setAttribute('x',item.r.x);rect.setAttribute('y',item.r.y);
    rect.setAttribute('width',item.r.w);rect.setAttribute('height',item.r.h);
    rect.setAttribute('rx','6');rect.setAttribute('fill','#071027');rect.setAttribute('fill-opacity','.96');
    rect.setAttribute('stroke','#facc15');rect.setAttribute('stroke-opacity','.45');rect.setAttribute('stroke-width','1');
    svg.appendChild(rect);

    var text=document.createElementNS(ns,'text');
    text.setAttribute('x',item.r.x+item.r.w/2);text.setAttribute('y',item.r.y+14);
    text.setAttribute('text-anchor','middle');text.setAttribute('font-size','9');text.setAttribute('font-family','Arial, sans-serif');
    text.setAttribute('font-weight','700');text.setAttribute('fill','#fef08a');
    text.textContent=item.id;
    svg.appendChild(text);
  });
}

function topoStartFlagOverlay_() {
  if(memberTopoFlagRaf_!=null)cancelAnimationFrame(memberTopoFlagRaf_);
  if(memberTopoFlagMode_!=='tp'){var o=document.getElementById('mg1-topo-flag-overlay');if(o)o.style.display='none';return;}
  function tick(){topoRenderFlagOverlay_();memberTopoFlagRaf_=requestAnimationFrame(tick);}
  memberTopoFlagRaf_=requestAnimationFrame(tick);
}

function topoStopFlagOverlay_() {
  if(memberTopoFlagRaf_!=null)cancelAnimationFrame(memberTopoFlagRaf_);memberTopoFlagRaf_=null;
  var o=document.getElementById('mg1-topo-flag-overlay');if(o)o.style.display='none';
}

function topoApplyOptions_() {
  const e = getMemberTopo3D_();
  if (!e) return;
  e.setOptions({
    zFactor: Number(document.getElementById('mg1-topo-z')?.value || 1.10),
    gapGuard: !!document.getElementById('mg1-topo-gap')?.checked,
    meshOverlay: !!document.getElementById('mg1-topo-mesh')?.checked,
    reliefOn: !!document.getElementById('mg1-topo-relief')?.checked,
    tintOn: !!document.getElementById('mg1-topo-tint')?.checked,
    aoStrength: Number(document.getElementById('mg1-topo-ao')?.value || .28),
    reliefStrength: Number(document.getElementById('mg1-topo-relief-factor')?.value || .10),
    meshAlpha: Number(document.getElementById('mg1-topo-mesh-factor')?.value || .12)
  });
}

async function prepareAndShowMemberTopo3D_() {
  const panel = document.getElementById('mg1-topo3d-panel');
  const canvas = document.getElementById('mg1-topo3d-canvas');
  if (!panel || !canvas) return;
  panel.classList.remove('hidden');
  topoSetLoading_(true, 'Menyiapkan 3D Topografi…', 'Menyiapkan data WebGL. Mohon tunggu.');
  try {
    const sameCanvas = !!(memberTopo3D_ && memberTopo3D_.canvas === canvas && memberTopo3DReady_);
    await prepareMemberTopo3D_(canvas, {
      onStatus: function(msg) { topoSetStatus_(msg, false); },
      onError: function(err) { topoSetStatus_(err && err.message ? err.message : err, true); }
    });
    const e = getMemberTopo3D_();
    if (e) e.resize();

    // Render/app lifecycle can replace .app-main and therefore the canvas.
    // Keep the last imported/restored source in memory and transparently rebuild
    // the terrain on the new canvas. This prevents Peta <-> 3D switching from
    // forcing the user to import/restore DTM + STR again.
    if (!sameCanvas && e && e.getState && !e.getState().ready && Array.isArray(memberTopoSourceFiles_) && memberTopoSourceFiles_.length) {
      topoSetStatus_('Memulihkan terrain 3D…', false);
      await e.loadFiles(memberTopoSourceFiles_);
      e.resize();
      e.fit();
    }

    topoApplyOptions_();
    await new Promise(function(resolve) { requestAnimationFrame(function() { requestAnimationFrame(resolve); }); });
    topoSetLoading_(false);
    const st = getMemberTopo3DState_();
    if (st.state && st.state.ready) {
      topoSetStatus_(memberTopoSourceFiles_ ? '3D Topografi siap.' : '3D Topografi siap. Import DTM/STR untuk memuat terrain.', false);
      topoRefreshFlagPicker_();
      topoStartFlagOverlay_();
    }
  } catch (err) {
    topoSetLoading_(false);
    topoSetStatus_(err && err.message ? err.message : err, true);
  }
}

function toggleMemberTopoPackageActions_(force) {
  const panel = document.getElementById('mg1-topo3d-panel');
  const actions = document.getElementById('mg1-topo-package-actions');
  const toggle = document.getElementById('mg1-topo-package-toggle');
  if (!panel || !actions || !toggle) return;
  const open = typeof force === 'boolean' ? force : actions.style.display === 'none';
  actions.style.display = open ? 'flex' : 'none';
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.title = open ? 'Tutup menu package' : 'Buka menu package';
}

function toggleMemberTopoControls_(force) {
  const controls = document.getElementById('mg1-topo-controls');
  const toggle = document.getElementById('mg1-topo-controls-toggle');
  if (!controls || !toggle) return;
  const open = typeof force === 'boolean' ? force : controls.style.display === 'none';
  controls.style.display = open ? 'block' : 'none';
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.title = open ? 'Tutup kontrol 3D' : 'Buka kontrol 3D';
}

function topoUpdatePackageButtons_() {
  const e = getMemberTopo3D_();
  const ready = !!(e && e.getState && e.getState().ready);
  const save = document.getElementById('mg1-topo3d-save');
  if (save) save.disabled = !ready;
}

async function handleMemberTopoFiles_(input) {
  const files = input && input.files ? Array.from(input.files) : [];
  if (!files.length) return;
  const e = getMemberTopo3D_();
  if (!e) return;
  topoSetLoading_(true, 'Menyiapkan data topografi…', 'Membaca DTM/STR secara lokal. Mohon tunggu.');
  try {
    topoSetStatus_('Membaca data topografi…', false);
    const meta = await e.loadFiles(files);
    const ltdtm = files.find(function(f) { return /\.ltdtm$/i.test(f.name); });
    if (ltdtm) memberTopoSourceFiles_ = [ltdtm];
    else {
      const dtm = files.find(function(f) { return /\.dtm$/i.test(f.name); });
      const str = files.find(function(f) { return /\.str$/i.test(f.name); });
      if (dtm && str) memberTopoSourceFiles_ = [dtm, str];
    }
    topoSetStatus_('DTM + STR siap · ' + Number(meta.triangles || 0).toLocaleString('id-ID') + ' triangles', false);
    topoUpdatePackageButtons_();
    topoRefreshFlagPicker_();
    topoStartFlagOverlay_();
    topoSetLoading_(false);
    const z = document.getElementById('mg1-topo-z');
    if (z) z.dispatchEvent(new Event('input', {bubbles:true}));
  } catch (err) {
    topoSetLoading_(false);
    topoSetStatus_(err && err.message ? err.message : err, true);
    topoUpdatePackageButtons_();
  } finally {
    input.value = '';
  }
}

async function restoreMemberTopoPackage_(input) {
  const files = input && input.files ? Array.from(input.files) : [];
  const file = files.find(function(f) { return /\.ltdtm$/i.test(f.name); });
  if (!file) return;
  const e = getMemberTopo3D_();
  if (!e) return;
  topoSetLoading_(true, 'Restore Topografi…', 'Memulihkan pasangan DTM + STR dari package.');
  try {
    topoSetStatus_('Membaca package Topografi…', false);
    const meta = await e.loadFiles([file]);
    memberTopoSourceFiles_ = [file];
    e.resize();
    e.fit();
    topoApplyOptions_();
    await new Promise(function(resolve) { requestAnimationFrame(function() { requestAnimationFrame(resolve); }); });
    topoSetStatus_('Restore berhasil · ' + Number(meta.triangles || 0).toLocaleString('id-ID') + ' triangles', false);
    topoRefreshFlagPicker_();
    topoStartFlagOverlay_();
    topoUpdatePackageButtons_();
    topoSetLoading_(false);
  } catch (err) {
    topoSetLoading_(false);
    topoSetStatus_(err && err.message ? err.message : err, true);
    topoUpdatePackageButtons_();
  } finally {
    input.value = '';
  }
}

async function saveMemberTopoPackage_() {
  const e = getMemberTopo3D_();
  if (!e || typeof e.exportLTDtm !== 'function' || !e.getState?.().ready) {
    topoSetStatus_('Save package belum siap. Import DTM + STR terlebih dahulu.', true);
    return;
  }
  topoSetLoading_(true, 'Menyimpan package…', 'Menggabungkan DTM + STR menjadi satu file.');
  try {
    const result = await e.exportLTDtm({});
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    topoSetStatus_('Package tersimpan · ' + result.filename, false);
    topoSetLoading_(false);
  } catch (err) {
    topoSetLoading_(false);
    topoSetStatus_(err && err.message ? err.message : err, true);
  }
}

function setMemberTopoView_(mode) {
  memberPetaViewMode_ = mode === 'topo' ? 'topo' : 'location';
  const main = document.querySelector('#app .app-main');
  if (!main) return;
  const switcher = main.querySelector('#mg1-peta-view-switch');
  const topoPanel = main.querySelector('#mg1-topo3d-panel');
  const originals = main.querySelectorAll('[data-mg1-peta-original="1"]');
  if (switcher) {
    switcher.querySelectorAll('button').forEach(function(btn) {
      btn.classList.toggle('bg-[#2563eb]/20', btn.dataset.mode === memberPetaViewMode_);
      btn.classList.toggle('text-white', btn.dataset.mode === memberPetaViewMode_);
      btn.classList.toggle('text-white/40', btn.dataset.mode !== memberPetaViewMode_);
    });
  }
  originals.forEach(function(el) { el.style.display = memberPetaViewMode_ === 'location' ? '' : 'none'; });
  if (topoPanel) topoPanel.style.display = memberPetaViewMode_ === 'topo' ? 'flex' : 'none';
  if (memberPetaViewMode_ === 'topo') { prepareAndShowMemberTopo3D_(); topoRefreshFlagPicker_(); topoStartFlagOverlay_(); } else { stopMemberTopo360_(); topoStopFlagOverlay_(); }
}

function buildMemberTopo3DPanel_() {
  return '' +
    '<div id="mg1-topo3d-panel" class="relative flex-1 min-h-0 rounded-[12px] bg-[#070b1c] border border-white/[0.08] overflow-hidden flex-col" style="display:none;">' +
      '<canvas id="mg1-topo3d-canvas" class="absolute inset-0 w-full h-full touch-none"></canvas>' +
      '<div class="absolute left-3 right-3 top-3 z-20 flex items-start justify-between pointer-events-none">' +
        '<button id="mg1-topo-package-toggle" type="button" aria-expanded="false" aria-controls="mg1-topo-package-actions" onclick="toggleMemberTopoPackageActions_()" title="Buka menu package" class="pointer-events-auto px-2.5 py-1.5 rounded-lg bg-[#0b1329]/90 border border-white/10 text-[10px] font-bold text-white shadow-sm">3D TOPOGRAFI</button>' +
        '<div id="mg1-topo-package-actions" class="pointer-events-auto items-center gap-1.5" style="display:none;">' +
          '<label class="px-2.5 py-1.5 rounded-lg bg-[#0b1329]/90 border border-white/10 text-[9px] font-bold text-white cursor-pointer">IMPORT DTM/STR<input type="file" accept=".dtm,.str" multiple class="hidden" onchange="handleMemberTopoFiles_(this)"></label>' +
          '<label class="px-2.5 py-1.5 rounded-lg bg-[#0b1329]/90 border border-white/10 text-[9px] font-bold text-white cursor-pointer">RESTORE PACKAGE<input type="file" accept=".ltdtm" class="hidden" onchange="restoreMemberTopoPackage_(this)"></label>' +
          '<button id="mg1-topo3d-save" type="button" disabled onclick="saveMemberTopoPackage_()" class="px-2.5 py-1.5 rounded-lg bg-[#2563eb]/25 border border-blue-400/20 text-[9px] font-bold text-white disabled:opacity-35 disabled:cursor-not-allowed">SAVE PACKAGE</button>' +
        '</div>' +
      '</div>' +
      '<div id="mg1-topo3d-status" class="absolute left-3 top-11 z-10 max-w-[70%] text-[9px] text-blue-200/80"></div>' +
      '<div class="absolute right-3 top-3 z-10 flex flex-col gap-1.5 pt-12">' +
        '<button onclick="getMemberTopo3D_()?.setView(\'3d\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[9px] font-bold">3D</button>' +
        '<button onclick="getMemberTopo3D_()?.setView(\'top\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[9px] font-bold">TOP</button>' +
        '<button id="mg1-topo-360-toggle" type="button" aria-pressed="false" onclick="toggleMemberTopo360_()" title="Putar 360°" aria-label="Putar 360°" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white shadow-lg pointer-events-auto"><svg viewBox="0 0 24 24" class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M9.5 8.8 16 12l-6.5 3.2V8.8Z" fill="currentColor" stroke="none"/></svg></button>' +
        '<button onclick="getMemberTopo3D_()?.setMode(\'shaded\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[8px] font-bold">SHADE</button>' +
        '<button onclick="getMemberTopo3D_()?.setMode(\'elevation\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[8px] font-bold">ELEV</button>' +
        '<button onclick="getMemberTopo3D_()?.setMode(\'wire\')" class="w-8 h-8 rounded-full bg-[#0b1329]/90 border border-white/10 text-white text-[7px] font-bold">WIRE</button>' +
        '<button id="mg1-topo-smart-offset-toggle" type="button" aria-pressed="false" onclick="toggleMemberTopoSmartOffset_()" title="Smart Offset nonaktif — label natural" class="w-8 h-8 rounded-full bg-[#0b1329]/95 border border-white/10 text-white text-[13px] font-bold shadow-lg pointer-events-auto" aria-label="Smart Offset">' +
          '<svg viewBox="0 0 24 24" class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
            '<path d="M7 5h8a3 3 0 0 1 3 3v2"/><path d="m15 7 3 3 3-3"/>' +
            '<path d="M17 19H9a3 3 0 0 1-3-3v-2"/><path d="m9 17-3-3-3 3"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<button id="mg1-topo-controls-toggle" type="button" aria-expanded="true" aria-controls="mg1-topo-controls" onclick="toggleMemberTopoControls_()" title="Tutup kontrol 3D" class="absolute right-3 bottom-[102px] z-20 w-8 h-8 rounded-full bg-[#0b1329]/95 border border-white/10 text-white text-[13px] font-bold shadow-lg pointer-events-auto">•••</button>' +
      '<div id="mg1-topo-controls" class="absolute left-3 right-3 bottom-3 z-10 flex items-end gap-2 pointer-events-none" style="display:block;">' +
        '<div class="pointer-events-auto flex-1 rounded-xl bg-[#0b1329]/90 border border-white/10 p-2">' +
          '<div class="grid grid-cols-3 gap-x-3 gap-y-1 text-[8px] text-white/50">' +
            '<label>Z <input id="mg1-topo-z" type="range" min="0.25" max="2.5" step="0.05" value="1.10" class="w-full"></label>' +
            '<label>AO <input id="mg1-topo-ao" type="range" min="0" max="0.60" step="0.01" value="0.28" class="w-full"></label>' +
            '<label>RELIEF <input id="mg1-topo-relief-factor" type="range" min="0" max="1.5" step="0.05" value="0.10" class="w-full"></label>' +
          '</div>' +
          '<div class="flex gap-3 mt-1.5 text-[8px] text-white/60">' +
            '<label><input id="mg1-topo-gap" type="checkbox" checked> Gap</label>' +
            '<label><input id="mg1-topo-mesh" type="checkbox"> Mesh</label>' +
            '<label><input id="mg1-topo-relief" type="checkbox" checked> Relief</label>' +
            '<label><input id="mg1-topo-tint" type="checkbox"> Tint</label>' +
          '</div>' +
          '<div class="mt-2 pt-2 border-t border-white/10">' +
            '<div class="flex items-center gap-2 text-[8px] text-white/55"><span class="font-bold text-white/70">FLAG</span>' +
              '<select id="mg1-topo-flag-mode" onchange="setMemberTopoFlagMode_(this.value)" class="flex-1 h-7 rounded-md bg-[#071027] border border-white/10 text-[9px] text-white px-2 outline-none">' +
                '<option value="off">OFF — Clean View</option>' +
                '<option value="tp">ID TP</option>' +
                '<option value="hole" disabled>ID Bor Hole — Coming Soon</option>' +
              '</select>' +
            '</div>' +
            '<div id="mg1-topo-flag-picker" class="grid grid-cols-1 gap-1.5 mt-1.5" style="display:none;"></div>' +
            '<div class="text-[8px] text-white/35 mt-1">Maksimum 5 ID TP · Smart Offset dikendalikan tombol icon terpisah.</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="mg1-topo-flag-overlay" class="absolute inset-0 z-[15] pointer-events-none" style="display:none;">' +
        '<svg id="mg1-topo-flag-lines" class="absolute inset-0 w-full h-full overflow-visible"></svg>' +
      '</div>' +
      '<div id="mg1-topo3d-loading" class="absolute inset-0 z-30 flex items-center justify-center bg-[#070b1c]/92 backdrop-blur-sm" style="display:none;">' +
        '<div class="w-[270px] rounded-2xl bg-[#0b1329] border border-white/10 p-5 text-center shadow-2xl">' +
          '<div class="w-7 h-7 mx-auto mb-3 rounded-full border-[3px] border-white/10 border-t-blue-400 animate-spin"></div>' +
          '<div data-topo-loading-title class="text-xs font-bold text-white">Menyiapkan 3D Topografi…</div>' +
          '<div data-topo-loading-sub class="text-[9px] text-white/35 mt-1">Menyiapkan data WebGL. Mohon tunggu.</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function isMemberPetaViewSwitcherCandidate_(el) {
  if (!el || el.id === 'mg1-peta-view-switch') return false;
  const buttons = Array.from(el.querySelectorAll('button'));
  if (buttons.length !== 2) return false;
  const labels = buttons.map(function(btn) {
    return String(btn.textContent || '').replace(/\\s+/g, ' ').trim().toUpperCase();
  });
  return labels[0] === 'PETA LOKASI' && labels[1] === '3D TOPOGRAFI';
}

function removeDuplicateMemberTopoSwitchers_(keepMain, keepSwitcher) {
  const all = Array.from(document.querySelectorAll('#mg1-peta-view-switch'));
  all.forEach(function(el) {
    if (el === keepSwitcher && el.parentElement === keepMain) return;
    el.remove();
  });

  // The existing Peta renderer may already own the two-button view switcher.
  // Do not create a second owner: remove only a non-canonical element whose
  // two buttons are exactly the Peta/3D Topografi pair.
  if (!keepSwitcher) return;
  const candidates = Array.from(keepMain.querySelectorAll('div,section,nav'));
  candidates.forEach(function(el) {
    if (el === keepSwitcher) return;
    if (!isMemberPetaViewSwitcherCandidate_(el)) return;
    try { el.remove(); } catch (_) {}
  });
}

function removeDuplicateMemberTopoPanels_(keepMain, keepPanel) {
  const all = Array.from(document.querySelectorAll('#mg1-topo3d-panel'));
  all.forEach(function(el) {
    if (el === keepPanel && el.parentElement === keepMain) return;
    try { el.remove(); } catch (_) {}
  });
}

function mountMemberTopo3DPanel_() {
  if (typeof currentTab !== 'undefined' && currentTab !== 'peta') return;
  if (memberTopoMountBusy_) return;
  const main = document.querySelector('#app .app-main');
  if (!main) return;

  memberTopoMountBusy_ = true;
  try {
    // Cross-render guard: render() can replace .app-main while MutationObserver is
    // still delivering the previous mutation batch. Never allow stale duplicate
    // switchers/panels to survive across render cycles.
    let switcher = main.querySelector('#mg1-peta-view-switch');
    let panel = main.querySelector('#mg1-topo3d-panel');

    // Remove a legacy/generic Peta/3D switcher before any new switcher is
    // created. This keeps a single UI owner even when peta.js already renders
    // the same two-button control.
    removeDuplicateMemberTopoSwitchers_(main, switcher);

    if (switcher && panel) {
      removeDuplicateMemberTopoSwitchers_(main, switcher);
      removeDuplicateMemberTopoPanels_(main, panel);
      return;
    }

    // If only one half survived a render, remove it and rebuild the pair atomically.
    if (switcher) switcher.remove();
    if (panel) panel.remove();

    const children = Array.from(main.children);
    if (!children.length) return;

    switcher = document.createElement('div');
    switcher.id = 'mg1-peta-view-switch';
    // Single shared view bar: it is the only element allowed to control
    // Peta Lokasi <-> 3D Topografi.  It stays pinned at the top of the
    // Peta content area while either view changes underneath it.
    switcher.className = 'absolute left-0 right-0 top-0 z-40 grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0b1329]/95 border border-white/[0.08] backdrop-blur';
    switcher.setAttribute('role', 'tablist');
    switcher.setAttribute('aria-label', 'Mode Peta');
    switcher.innerHTML =
      '<button type="button" data-mode="location" onclick="setMemberTopoView_(\'location\')" class="py-2 rounded-lg text-[10px] font-bold bg-[#2563eb]/20 text-white">PETA LOKASI</button>' +
      '<button type="button" data-mode="topo" onclick="setMemberTopoView_(\'topo\')" class="py-2 rounded-lg text-[10px] font-bold text-white/40">3D TOPOGRAFI</button>';

    main.insertBefore(switcher, children[1] || null);
    // The tab bar is a fixed overlay inside the Peta content host.  Reserve
    // one stable row for it so the active view never pushes the bar around.
    main.style.position = 'relative';
    main.style.paddingTop = '58px';

    // Only the existing Peta content is a switchable view.  The switch bar
    // and the Topo3D panel are controller/owned surfaces and must remain
    // visible/alive across tab changes.
    Array.from(main.children).forEach(function(el) {
      if (el !== switcher) el.setAttribute('data-mg1-peta-original','1');
    });
    switcher.removeAttribute('data-mg1-peta-original');

    const panelWrap = document.createElement('div');
    panelWrap.innerHTML = buildMemberTopo3DPanel_();
    panel = panelWrap.firstElementChild;
    main.appendChild(panel);

    // Final DOM invariant: exactly one switcher and one panel for the active Peta view.
    removeDuplicateMemberTopoSwitchers_(main, switcher);
    removeDuplicateMemberTopoPanels_(main, panel);
    setMemberTopoView_(memberPetaViewMode_);
  } finally {
    memberTopoMountBusy_ = false;
  }
}

function installMemberTopo3DObserver_() {
  if (memberTopoObserverInstalled_) return;
  const app = document.getElementById('app');
  if (!app || typeof MutationObserver === 'undefined') return;
  memberTopoObserverInstalled_ = true;
  const observer = new MutationObserver(function() {
    if (typeof currentTab !== 'undefined' && currentTab !== 'peta') {
      if (memberTopo3D_) destroyMemberTopo3D_();
      return;
    }
    if (document.querySelector('#app .app-main')) mountMemberTopo3DPanel_();
  });
  observer.observe(app, {childList:true, subtree:true});
  mountMemberTopo3DPanel_();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installMemberTopo3DObserver_);
} else {
  installMemberTopo3DObserver_();
}
