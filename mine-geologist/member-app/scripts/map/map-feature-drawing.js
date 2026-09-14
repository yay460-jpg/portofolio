/* MG1 V25.21 — FEATURE DRAWING ADAPTER
 * Point picking only. Bridges semantic Feature UI to the existing map surface
 * without modifying peta.js, Tile Engine, GeoReference, or gesture ownership.
 */
(function (global) {
  'use strict';

  var drawingState = { active:false, layerId:null, type:null };

  function escape_(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function setStatus_(message) {
    var el = document.getElementById('mg1-feature-drawing-status');
    if (!el) return;
    el.innerHTML = '<div class="fixed left-1/2 -translate-x-1/2 bottom-24 z-[120] max-w-[calc(100vw-32px)] rounded-xl bg-[#101a33] border border-blue-400/30 shadow-2xl px-4 py-3 text-[11px] text-white">' +
      '<div class="font-bold text-blue-300">Pilih lokasi di peta</div><div class="mt-0.5 text-white/55">' + escape_(message || 'Klik satu titik pada peta untuk menempatkan data.') + '</div>' +
      '<button type="button" onclick="MG1MapFeatureDrawing.cancel()" class="mt-2 text-[10px] text-rose-300">Batal</button></div>';
  }

  function clearStatus_() {
    var el = document.getElementById('mg1-feature-drawing-status');
    if (el) el.innerHTML = '';
  }

  function ensureStatusHost_() {
    var el = document.getElementById('mg1-feature-drawing-status');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'mg1-feature-drawing-status';
    document.body.appendChild(el);
    return el;
  }

  function getMapSvg_( ) {
    try {
      var vp = document.getElementById('mg1-map-viewport');
      return vp ? vp.querySelector('svg[data-map-gesture="true"]') : null;
    } catch (_) { return null; }
  }

  function nativeToSvg_(nativeX, nativeY) {
    if (typeof global.computeResponsiveDisplayBounds_ !== 'function' || typeof global.buildMapData !== 'function') throw new Error('Map coordinate engine belum siap.');
    var bounds = global.computeResponsiveDisplayBounds_(global.buildMapData());
    if (!bounds) throw new Error('Batas peta belum tersedia.');
    var size = global.getMapSvgViewportSize_();
    var rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
    if (!(rangeT > 0) || !(rangeU > 0)) throw new Error('Rentang koordinat peta belum valid.');
    return {
      x: ((Number(nativeX) - bounds.minT) / rangeT) * size.viewW,
      y: size.viewH - ((Number(nativeY) - bounds.minU) / rangeU) * size.viewH
    };
  }

  function mapCoordinateFromClick_(event, svgEl) {
    if (typeof global.computeResponsiveDisplayBounds_ !== 'function' || typeof global.buildMapData !== 'function') throw new Error('Map coordinate engine belum siap.');
    var bounds = global.computeResponsiveDisplayBounds_(global.buildMapData());
    if (!bounds) throw new Error('Batas peta belum tersedia.');
    var rect = svgEl.getBoundingClientRect();
    if (!(rect.width > 0) || !(rect.height > 0)) throw new Error('Viewport peta tidak tersedia.');
    var size = global.getMapSvgViewportSize_();
    var viewBox = global.getMapViewBox_(bounds);
    var px = event.clientX - rect.left, py = event.clientY - rect.top;
    var rotation = 0;
    try {
      var transform = global.getComputedStyle ? global.getComputedStyle(svgEl).transform : '';
      var match = String(transform || '').match(/^matrix\(([^)]+)\)$/);
      if (match) { var parts = match[1].split(',').map(Number); if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) rotation = Math.atan2(parts[1], parts[0]) * 180 / Math.PI; }
    } catch (_) {}
    if (Math.abs(rotation) > 0.0001) {
      var rad = -rotation * Math.PI / 180;
      var cx = rect.width / 2, cy = rect.height / 2;
      var dx = px - cx, dy = py - cy;
      px = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
      py = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    }
    var svgX = viewBox.x + (px / rect.width) * viewBox.w;
    var svgY = viewBox.y + (py / rect.height) * viewBox.h;
    var nativeX = bounds.minT + (svgX / size.viewW) * (bounds.maxT - bounds.minT);
    var nativeY = bounds.minU + ((size.viewH - svgY) / size.viewH) * (bounds.maxU - bounds.minU);
    if (!Number.isFinite(nativeX) || !Number.isFinite(nativeY)) throw new Error('Koordinat peta tidak valid.');
    return { x:nativeX, y:nativeY, svgX:svgX, svgY:svgY };
  }

  var overlaySyncScheduled_ = false;
  var overlaySyncToken_ = 0;

  function renderPointOverlay_(svg, records) {
    if (!svg) return;
    var old = svg.querySelector('#mg1-semantic-feature-overlay');
    if (old) old.remove();
    if (!records.length) return;
    var ns = 'http://www.w3.org/2000/svg';
    var group = document.createElementNS(ns, 'g');
    group.id = 'mg1-semantic-feature-overlay';
    group.setAttribute('pointer-events', 'none');
    group.setAttribute('aria-hidden', 'true');
    records.forEach(function(rec) {
      try {
        var pos = nativeToSvg_(rec.x, rec.y);
        if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
        var g = document.createElementNS(ns, 'g');
        g.setAttribute('transform', 'translate(' + pos.x + ' ' + pos.y + ')');
        var halo = document.createElementNS(ns, 'circle');
        halo.setAttribute('r', '7'); halo.setAttribute('fill', '#0b1329'); halo.setAttribute('stroke', '#22d3ee'); halo.setAttribute('stroke-width', '2'); halo.setAttribute('opacity', '0.95');
        var dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('r', '3.2'); dot.setAttribute('fill', '#22d3ee');
        g.appendChild(halo); g.appendChild(dot);
        if (rec.name) {
          var text = document.createElementNS(ns, 'text');
          text.setAttribute('x', '10'); text.setAttribute('y', '4'); text.setAttribute('font-size', '7'); text.setAttribute('font-family', 'sans-serif'); text.setAttribute('font-weight', '700'); text.setAttribute('fill', '#ffffff'); text.setAttribute('stroke', '#0b1329'); text.setAttribute('stroke-width', '2'); text.setAttribute('paint-order', 'stroke');
          text.textContent = String(rec.name).slice(0, 28);
          g.appendChild(text);
        }
        group.appendChild(g);
      } catch (_) {}
    });
    svg.appendChild(group);
  }

  async function syncPointOverlay_() {
    if (overlaySyncScheduled_) return;
    overlaySyncScheduled_ = true;
    var token = ++overlaySyncToken_;
    requestAnimationFrame(async function() {
      overlaySyncScheduled_ = false;
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
            records.push({ x:Number(geom.coordinates[0]), y:Number(geom.coordinates[1]), name:(f.properties && (f.properties.name || f.properties.hole_id || f.properties.category)) || f.id });
          }
        }
        if (token === overlaySyncToken_) renderPointOverlay_(getMapSvg_(), records);
      } catch (err) {
        console.warn('[V25.21 FEATURE DRAWING] Point overlay sync skipped', err);
      }
    });
  }

  function pickPoint_(event) {
    if (!drawingState.active || drawingState.type !== 'point') return;
    var target = event.target && event.target.closest ? event.target.closest('svg[data-map-gesture="true"]') : null;
    if (!target) return;
    try {
      event.preventDefault();
      event.stopPropagation();
      var point = mapCoordinateFromClick_(event, target);
      var geometry = { type:'Point', coordinates:[point.x, point.y], coordinateSpace:'native' };
      if (typeof global.setSemanticFeatureGeometryFromMap_ !== 'function') throw new Error('Feature UI adapter belum siap.');
      global.setSemanticFeatureGeometryFromMap_(drawingState.layerId, geometry);
      syncPointOverlay_();
      var layerId = drawingState.layerId;
      drawingState = { active:false, layerId:null, type:null };
      clearStatus_();
      if (typeof global.openLayerManagementPanel_ === 'function') global.openLayerManagementPanel_();
      console.log('[V25.21 FEATURE DRAWING] Point selected', { layerId:layerId, x:point.x, y:point.y });
    } catch (err) {
      console.error('[V25.21 FEATURE DRAWING] Point selection failed', err);
      setStatus_(err && err.message ? err.message : String(err));
    }
  }

  function start(layerId, type) {
    if (type !== 'point') {
      if (typeof global.setSemanticFeatureDrawingError_ === 'function') global.setSemanticFeatureDrawingError_('Untuk tahap ini pemilihan peta baru tersedia untuk Titik.');
      return false;
    }
    drawingState = { active:true, layerId:String(layerId), type:type };
    ensureStatusHost_();
    setStatus_('Klik satu titik pada peta untuk menempatkan data.');
    if (typeof global.closeLayerManagementPanel_ === 'function') global.closeLayerManagementPanel_();
    console.log('[V25.21 FEATURE DRAWING] Point pick started', drawingState);
    return true;
  }

  function cancel() {
    drawingState = { active:false, layerId:null, type:null };
    clearStatus_();
    if (typeof global.openLayerManagementPanel_ === 'function') global.openLayerManagementPanel_();
    console.log('[V25.21 FEATURE DRAWING] cancelled');
  }

  document.addEventListener('click', pickPoint_, true);
  document.addEventListener('DOMContentLoaded', function(){ syncPointOverlay_(); });
  setTimeout(function(){ syncPointOverlay_(); }, 0);
  try {
    var vpObserver = new MutationObserver(function(mutations) {
      for (var i=0;i<mutations.length;i++) { if (mutations[i].type === 'childList') { syncPointOverlay_(); break; } }
    });
    var initialVp = document.getElementById('mg1-map-viewport');
    if (initialVp) vpObserver.observe(initialVp, { childList:true });
  } catch (_) {}

  window.addEventListener('resize', function(){ syncPointOverlay_(); });

  global.MG1MapFeatureDrawing = Object.freeze({ version:'25.21-s02', start:start, cancel:cancel, isActive:function(){return drawingState.active;}, sync:syncPointOverlay_ });
  console.log('[V25.21 MAP FEATURE] Drawing adapter ready — Point pick only');
})(window);
