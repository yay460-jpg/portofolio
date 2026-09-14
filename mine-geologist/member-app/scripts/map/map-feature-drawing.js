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

  function mapCoordinateFromClick_(event, svgEl) {
    if (typeof global.computeResponsiveDisplayBounds_ !== 'function' || typeof global.buildMapData !== 'function') throw new Error('Map coordinate engine belum siap.');
    var bounds = global.computeResponsiveDisplayBounds_(global.buildMapData());
    if (!bounds) throw new Error('Batas peta belum tersedia.');
    var rect = (svgEl.parentElement || svgEl).getBoundingClientRect();
    if (!(rect.width > 0) || !(rect.height > 0)) throw new Error('Viewport peta tidak tersedia.');
    var size = global.getMapSvgViewportSize_();
    var viewBox = global.getMapViewBox_(bounds);
    var svgX = viewBox.x + ((event.clientX - rect.left) / rect.width) * viewBox.w;
    var svgY = viewBox.y + ((event.clientY - rect.top) / rect.height) * viewBox.h;
    if (!Number.isFinite(svgX) || !Number.isFinite(svgY)) throw new Error('Posisi klik tidak valid.');
    var rotation = 0;
    try {
      var transform = global.getComputedStyle ? global.getComputedStyle(svgEl).transform : '';
      var match = String(transform || '').match(/^matrix\(([^)]+)\)$/);
      if (match) { var parts = match[1].split(',').map(Number); if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) rotation = Math.atan2(parts[1], parts[0]) * 180 / Math.PI; }
    } catch (_) {}
    if (Math.abs(rotation) > 0.0001) {
      var rad = -rotation * Math.PI / 180;
      var cx = size.viewW / 2, cy = size.viewH / 2;
      var dx = svgX - cx, dy = svgY - cy;
      svgX = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
      svgY = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    }
    var rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
    var nativeX = bounds.minT + (svgX / size.viewW) * rangeT;
    var nativeY = bounds.minU + ((size.viewH - svgY) / size.viewH) * rangeU;
    if (!Number.isFinite(nativeX) || !Number.isFinite(nativeY)) throw new Error('Koordinat peta tidak valid.');
    return { x:nativeX, y:nativeY, svgX:svgX, svgY:svgY };
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

  global.MG1MapFeatureDrawing = Object.freeze({ version:'25.21-s01', start:start, cancel:cancel, isActive:function(){return drawingState.active;} });
  console.log('[V25.21 MAP FEATURE] Drawing adapter ready — Point pick only');
})(window);
