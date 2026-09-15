/* MG1 V25.21-s04 — FEATURE DRAWING ADAPTER
 * Point picking + zero-render overlay.
 * IMPORTANT: this adapter never calls the global render() path while entering/leaving
 * point-pick mode. The existing map surface therefore stays mounted; no tile rebuild,
 * no Atomic Surface swap, and no modal-induced flicker.
 */
(function (global) {
  'use strict';

  var drawingState = { active:false, layerId:null, type:null };
  var pendingPreviewPoint_ = null;
  var hiddenLayerPanel_ = null;
  var overlaySyncScheduled_ = false;
  var overlaySyncToken_ = 0;

  function escape_(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function ensureStatusHost_() {
    var el = document.getElementById('mg1-feature-drawing-status');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'mg1-feature-drawing-status';
    document.body.appendChild(el);
    return el;
  }

  function setStatus_(message) {
    var el = ensureStatusHost_();
    el.innerHTML = '<div class="fixed left-1/2 -translate-x-1/2 bottom-24 z-[120] max-w-[calc(100vw-32px)] rounded-xl bg-[#101a33] border border-blue-400/30 shadow-2xl px-4 py-3 text-[11px] text-white">' +
      '<div class="font-bold text-blue-300">Pilih lokasi di peta</div><div class="mt-0.5 text-white/55">' +
      escape_(message || 'Klik satu titik pada peta untuk menempatkan data.') + '</div>' +
      '<button type="button" onclick="MG1MapFeatureDrawing.cancel()" class="mt-2 text-[10px] text-rose-300">Batal</button></div>';
  }

  function clearStatus_() {
    var el = document.getElementById('mg1-feature-drawing-status');
    if (el) el.innerHTML = '';
  }

  function findLayerPanel_() {
    try {
      var nodes = document.querySelectorAll('.fixed');
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        if (!n || !n.textContent) continue;
        var text = String(n.textContent).replace(/\s+/g, ' ').trim();
        if (/^Layer Peta(?:\s|$)/.test(text)) return n;
      }
    } catch (_) {}
    return null;
  }

  function hideLayerPanelWithoutRender_() {
    var panel = findLayerPanel_();
    if (!panel) return;
    hiddenLayerPanel_ = { el:panel, display:panel.style.display };
    panel.style.display = 'none';
  }

  function showLayerPanelWithoutRender_() {
    if (!hiddenLayerPanel_ || !hiddenLayerPanel_.el) return;
    hiddenLayerPanel_.el.style.display = hiddenLayerPanel_.display || '';
    hiddenLayerPanel_ = null;
  }

  function updatePointPickStatusInDom_(layerId, message, ok) {
    try {
      var root = document.querySelector('.mg1-feature-create-form[data-layer-id="' + CSS.escape(String(layerId)) + '"]');
      if (!root) return;
      var box = root.querySelector('[data-feature-geometry-status]');
      if (!box) return;
      box.className = 'rounded-lg bg-blue-500/5 border border-blue-500/10 px-2.5 py-2 text-[9px] ' +
        (ok ? 'text-emerald-300/80' : 'text-blue-200/60');
      box.textContent = message;
    } catch (_) {}
  }

  function getMapSvg_() {
    try {
      var vp = document.getElementById('mg1-map-viewport');
      if (!vp || !vp.querySelectorAll) return null;
      var list = vp.querySelectorAll('svg[data-map-gesture="true"]');
      for (var i = list.length - 1; i >= 0; i--) {
        var svg = list[i];
        if (!svg) continue;
        var rect = svg.getBoundingClientRect ? svg.getBoundingClientRect() : null;
        var style = global.getComputedStyle ? global.getComputedStyle(svg) : null;
        if (!(style && (style.display === 'none' || style.visibility === 'hidden')) &&
            (!rect || (rect.width > 0 && rect.height > 0))) return svg;
      }
    } catch (_) {}
    return null;
  }

  function getOverlayGroup_(svg) {
    if (!svg) return null;
    var g = svg.querySelector ? svg.querySelector('g[data-mg1-semantic-feature-overlay="true"]') : null;
    if (g) return g;
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-mg1-semantic-feature-overlay', 'true');
    g.setAttribute('pointer-events', 'none');
    g.setAttribute('aria-label', 'Data Layer');
    svg.appendChild(g);
    return g;
  }

  function projectNativeToSvg_(x, y) {
    if (typeof global.computeResponsiveDisplayBounds_ !== 'function' ||
        typeof global.buildMapData !== 'function' ||
        typeof global.getMapSvgViewportSize_ !== 'function') return null;
    var bounds = global.computeResponsiveDisplayBounds_(global.buildMapData());
    if (!bounds) return null;
    var size = global.getMapSvgViewportSize_();
    if (typeof global.projectToSvg === 'function') return global.projectToSvg(Number(x), Number(y), bounds, size.viewW, size.viewH);
    var rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
    if (!(rangeT > 0) || !(rangeU > 0)) return null;
    return {
      x: ((Number(x) - bounds.minT) / rangeT) * size.viewW,
      y: size.viewH - (((Number(y) - bounds.minU) / rangeU) * size.viewH)
    };
  }

  function renderPointOverlay_(svg, records) {
    if (!svg) return;
    var group = getOverlayGroup_(svg);
    if (!group) return;
    while (group.firstChild) group.removeChild(group.firstChild);
    records.forEach(function(rec) {
      var pos = projectNativeToSvg_(rec.x, rec.y);
      if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', 'translate(' + pos.x.toFixed(3) + ' ' + pos.y.toFixed(3) + ')');
      g.setAttribute('pointer-events', 'none');

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', rec.pending ? '7' : '6');
      circle.setAttribute('fill', rec.pending ? '#f59e0b' : '#22d3ee');
      circle.setAttribute('stroke', '#0b1329');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('vector-effect', 'non-scaling-stroke');
      g.appendChild(circle);

      var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('r', rec.pending ? '11' : '9');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', rec.pending ? '#f59e0b' : '#22d3ee');
      ring.setAttribute('stroke-width', '1.5');
      ring.setAttribute('opacity', '0.65');
      ring.setAttribute('vector-effect', 'non-scaling-stroke');
      g.appendChild(ring);

      var label = rec.name ? document.createElementNS('http://www.w3.org/2000/svg', 'text') : null;
      if (label) {
        label.setAttribute('x', '12');
        label.setAttribute('y', '3');
        label.setAttribute('font-size', '9');
        label.setAttribute('font-family', 'sans-serif');
        label.setAttribute('font-weight', '700');
        label.setAttribute('fill', '#fff');
        label.setAttribute('stroke', '#0b1329');
        label.setAttribute('stroke-width', '3');
        label.setAttribute('paint-order', 'stroke');
        label.textContent = String(rec.name).slice(0, 28);
        g.appendChild(label);
      }
      group.appendChild(g);
    });
  }

  async function syncPointOverlay_() {
    if (overlaySyncScheduled_) return;
    overlaySyncScheduled_ = true;
    var token = ++overlaySyncToken_;
    global.requestAnimationFrame(function() {
      overlaySyncScheduled_ = false;
      (async function() {
        try {
          var svg = getMapSvg_();
          if (!svg || typeof global.MG1MapLayerManagement === 'undefined' || typeof global.MG1MapFeatureManagement === 'undefined') return;
          var mapId = null;
          try {
            if (typeof global.getSemanticActiveMapId_ === 'function') mapId = global.getSemanticActiveMapId_();
            if (!mapId && global.localStorage) mapId = global.localStorage.getItem('mg1_active_bg_map_id');
          } catch (_) {}
          if (!mapId) return;

          var layers = await global.MG1MapLayerManagement.list(mapId, { sortBy:'order', direction:'asc' });
          if (token !== overlaySyncToken_) return;
          var records = [];
          for (var i=0; i<layers.length; i++) {
            var layer = layers[i];
            if (!layer || layer.visible === false) continue;
            var features = await global.MG1MapFeatureManagement.list(layer.id, { sortBy:'id', direction:'asc' });
            for (var j=0; j<features.length; j++) {
              var f = features[j], geom = f && f.geometry;
              if (!f || !geom || geom.type !== 'Point' || !Array.isArray(geom.coordinates) || geom.coordinates.length < 2) continue;
              records.push({
                x:Number(geom.coordinates[0]), y:Number(geom.coordinates[1]),
                name:(f.properties && (f.properties.name || f.properties.hole_id || f.properties.category)) || f.id
              });
            }
          }
          if (pendingPreviewPoint_) records.push({
            x:Number(pendingPreviewPoint_.x), y:Number(pendingPreviewPoint_.y), name:'Lokasi baru', pending:true
          });
          if (token === overlaySyncToken_) renderPointOverlay_(getMapSvg_(), records);
        } catch (err) {
          console.warn('[V25.21 FEATURE DRAWING] Point overlay sync skipped', err);
        }
      })();
    });
  }

  function mapCoordinateFromClick_(event, svgEl) {
    if (typeof global.computeResponsiveDisplayBounds_ !== 'function' || typeof global.buildMapData !== 'function')
      throw new Error('Map coordinate engine belum siap.');
    var bounds = global.computeResponsiveDisplayBounds_(global.buildMapData());
    if (!bounds) throw new Error('Batas peta belum tersedia.');
    var size = global.getMapSvgViewportSize_();
    var ctm = svgEl.getScreenCTM && svgEl.getScreenCTM();
    if (!ctm || typeof ctm.inverse !== 'function') throw new Error('Transform peta belum tersedia.');
    var inv = ctm.inverse();
    var clientPoint = null;
    if (typeof global.DOMPoint === 'function') clientPoint = new global.DOMPoint(event.clientX, event.clientY);
    else clientPoint = { x:event.clientX, y:event.clientY };
    var p = typeof clientPoint.matrixTransform === 'function' ? clientPoint.matrixTransform(inv) : {
      x: inv.a * clientPoint.x + inv.c * clientPoint.y + inv.e,
      y: inv.b * clientPoint.x + inv.d * clientPoint.y + inv.f
    };
    var nativeX = bounds.minT + (p.x / size.viewW) * (bounds.maxT - bounds.minT);
    var nativeY = bounds.minU + ((size.viewH - p.y) / size.viewH) * (bounds.maxU - bounds.minU);
    if (!Number.isFinite(nativeX) || !Number.isFinite(nativeY)) throw new Error('Koordinat peta tidak valid.');
    return { x:nativeX, y:nativeY, svgX:p.x, svgY:p.y };
  }

  function pickPoint_(event) {
    if (!drawingState.active || drawingState.type !== 'point') return;
    var target = event.target && event.target.closest ? event.target.closest('svg[data-map-gesture="true"]') : null;
    if (!target) return;
    try {
      event.preventDefault();
      event.stopPropagation();
      var point = mapCoordinateFromClick_(event, target);
      var layerId = drawingState.layerId;
      var geometry = { type:'Point', coordinates:[point.x, point.y], coordinateSpace:'native' };
      if (typeof global.setSemanticFeatureGeometryFromMap_ !== 'function') throw new Error('Feature UI adapter belum siap.');
      global.setSemanticFeatureGeometryFromMap_(layerId, geometry);
      pendingPreviewPoint_ = { x:point.x, y:point.y };
      updatePointPickStatusInDom_(layerId, '✓ Lokasi sudah dipilih di peta. Siap disimpan.', true);
      clearStatus_();
      drawingState = { active:false, layerId:null, type:null };
      showLayerPanelWithoutRender_();
      syncPointOverlay_();
      console.log('[V25.21 FEATURE DRAWING] Point selected', { layerId:layerId, x:point.x, y:point.y });
    } catch (err) {
      console.error('[V25.21 FEATURE DRAWING] Point selection failed', err);
      setStatus_(err && err.message ? err.message : String(err));
    }
  }

  function start(layerId, type) {
    if (type !== 'point') {
      if (typeof global.setSemanticFeatureDrawingError_ === 'function')
        global.setSemanticFeatureDrawingError_('Untuk tahap ini pemilihan peta baru tersedia untuk Titik.');
      return false;
    }
    pendingPreviewPoint_ = null;
    drawingState = { active:true, layerId:String(layerId), type:type };
    ensureStatusHost_();
    setStatus_('Klik satu titik pada peta untuk menempatkan data.');
    // DO NOT call closeLayerManagementPanel_(): it calls render() and rebuilds the map.
    hideLayerPanelWithoutRender_();
    console.log('[V25.21 FEATURE DRAWING] Point pick started', drawingState);
    return true;
  }

  function cancel() {
    drawingState = { active:false, layerId:null, type:null };
    pendingPreviewPoint_ = null;
    clearStatus_();
    showLayerPanelWithoutRender_();
    syncPointOverlay_();
    console.log('[V25.21 FEATURE DRAWING] cancelled');
  }

  function clearPreview() {
    pendingPreviewPoint_ = null;
    syncPointOverlay_();
  }

  document.addEventListener('click', pickPoint_, true);
  document.addEventListener('DOMContentLoaded', function(){ syncPointOverlay_(); });
  setTimeout(function(){ syncPointOverlay_(); }, 0);
  try {
    // Only observe direct viewport child replacement. Do NOT observe all SVG attributes or
    // descendants: tile loading/animation can produce hundreds of mutations and cause an
    // unnecessary database/readback storm. A surface replacement is a direct child change.
    var vpObserver = new MutationObserver(function(mutations) {
      for (var i=0;i<mutations.length;i++) {
        if (mutations[i].type === 'childList') { syncPointOverlay_(); break; }
      }
    });
    var initialVp = document.getElementById('mg1-map-viewport');
    if (initialVp) vpObserver.observe(initialVp, { childList:true, subtree:false });
  } catch (_) {}

  global.addEventListener('resize', function(){ syncPointOverlay_(); });
  global.MG1MapFeatureDrawing = Object.freeze({
    version:'25.21-s04', start:start, cancel:cancel,
    isActive:function(){return drawingState.active;}, sync:syncPointOverlay_, clearPreview:clearPreview
  });
  console.log('[V25.21 MAP FEATURE] Drawing adapter ready — Point pick, no-render mode');
})(window);
