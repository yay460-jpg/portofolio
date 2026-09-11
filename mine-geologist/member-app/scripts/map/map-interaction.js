/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- map interaction boundary
 * STEP 9.12-B: pan / pinch / pointer / zoom / viewport interaction.
 * Structural extraction only. Runtime behavior intentionally unchanged.
 * Dependencies remain global-compatible with the classic script loader.
 * ============================================================ */

function captureMapViewportCenter_(bounds) {
  if (!bounds) return;
  const viewBox = getMapViewBox_(bounds);
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  if (!(rangeT > 0) || !(rangeU > 0)) return;
  const centerSvgX = viewBox.x + viewBox.w / 2;
  const centerSvgY = viewBox.y + viewBox.h / 2;
  const nativeX = bounds.minT + (centerSvgX / 320) * rangeT;
  const nativeY = bounds.minU + ((320 - centerSvgY) / 320) * rangeU;
  if (Number.isFinite(nativeX) && Number.isFinite(nativeY)) {
    mapViewportState_.centerNative = { x: nativeX, y: nativeY };
  }
}

function pinchDistance_(a, b) {
  const dx = b.clientX - a.clientX, dy = b.clientY - a.clientY;
  return Math.hypot(dx, dy);
}

function pinchMidpoint_(a, b, rect) {
  return {
    x: ((a.clientX + b.clientX) / 2 - rect.left) / rect.width,
    y: ((a.clientY + b.clientY) / 2 - rect.top) / rect.height
  };
}

function pinchAngle_(a, b) {
  return Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180 / Math.PI;
}

function normalizeAngleDelta_(deg) {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function composeMapTransform_(scale, rotationDeg, dx, dy) {
  const s = Number.isFinite(scale) ? scale : 1;
  const r = Number.isFinite(rotationDeg) ? rotationDeg : 0;
  const x = Number.isFinite(dx) ? dx : 0;
  const y = Number.isFinite(dy) ? dy : 0;
  return 'translate3d(' + x.toFixed(3) + 'px,' + y.toFixed(3) + 'px,0) scale(' + s.toFixed(5) + ') rotate(' + r.toFixed(4) + 'deg)';
}

function nativeFromClientPoint_(event, bounds, rect) {
  const viewW = 320, viewH = 320;
  const viewBox = getMapViewBox_(bounds);
  const sx = viewBox.x + ((event.clientX - rect.left) / rect.width) * viewBox.w;
  const sy = viewBox.y + ((event.clientY - rect.top) / rect.height) * viewBox.h;
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  return {
    x: bounds.minT + (sx / viewW) * rangeT,
    y: bounds.minU + ((viewH - sy) / viewH) * rangeU
  };
}

function scheduleMapPinchRender_() {
  if (mapPinchRenderScheduled_) return;
  mapPinchRenderScheduled_ = true;
  requestAnimationFrame(() => {
    mapPinchRenderScheduled_ = false;
    if (mapPinchState_.active) render();
  });
}

function handleMapTouchStart_(event) {
  if (mapGestureOwner_ === 'pointer') return;
  if (mapGestureOwner_ === null) {
    if (mapPointerState_.size || mapPanState_.active || mapPinchState_.active || mapPanInertiaRaf_) resetMapGestureTransientState_();
    mapGestureOwner_ = 'touch';
  }
  console.log('[TRACE] touchstart owner=touch', event.touches.length);
  if (!event || !event.touches || event.touches.length!==1) {
    if (event.touches && event.touches.length===2) {
      // 2 finger -> pinch
      const a=event.touches[0], b=event.touches[1];
      const rect=(event.currentTarget.parentElement || event.currentTarget).getBoundingClientRect();
      const bounds=computeResponsiveDisplayBounds_(buildMapData());
      if (!bounds) return;
      const distance=Math.hypot(b.clientX-a.clientX, b.clientY-a.clientY);
      const midpoint={x:((a.clientX+b.clientX)/2-rect.left)/rect.width, y:((a.clientY+b.clientY)/2-rect.top)/rect.height};
      const angle=pinchAngle_(a,b);
      const anchor=nativeFromClientPoint_({clientX:(a.clientX+b.clientX)/2, clientY:(a.clientY+b.clientY)/2}, bounds, rect);
      mapPanState_.active=false;
      if (mapPanInertiaRaf_) { cancelAnimationFrame(mapPanInertiaRaf_); mapPanInertiaRaf_=null; }
      const svg=event.currentTarget.querySelector('svg');
      mapPinchState_={active:true,startDistance:distance,startZoom:mapZoom,startAngle:angle,startRotation:mapRotationDeg_,currentRotation:mapRotationDeg_,anchorNative:anchor,midX:midpoint.x,midY:midpoint.y,suppressTapUntil:Date.now()+500,visualSvg:svg};
      if(svg){svg.style.transform=composeMapTransform_(1, mapRotationDeg_, 0, 0);svg.style.transformOrigin='50% 50%';svg.style.willChange='transform';}
      event.preventDefault();event.stopPropagation();
    }
    return;
  }
  event.preventDefault();event.stopPropagation();
  const svg=event.currentTarget.querySelector('svg')||event.currentTarget;
  const bounds=computeResponsiveDisplayBounds_(buildMapData());
  if(!bounds) { console.log('[TRACE] no bounds'); return; }
  const startX=event.touches[0].clientX, startY=event.touches[0].clientY;
  beginMapPanPointer_(event, svg, bounds, startX, startY);
  console.log('[TRACE] pan started', startX, startY, 'center', mapPanState_.baseCenterNative);
}

function handleMapTouchMove_(event) {
  if (!mapPanState_.active || !event.touches || event.touches.length!==1) {
    if (mapPinchState_.active && event.touches && event.touches.length===2) {
      event.preventDefault();
      const a=event.touches[0], b=event.touches[1];
      const distance=Math.hypot(b.clientX-a.clientX, b.clientY-a.clientY);
      if(!(distance>0)||!(mapPinchState_.startDistance>0)) return;
      const angle=pinchAngle_(a,b);
      mapPinchState_.currentRotation = mapPinchState_.startRotation + normalizeAngleDelta_(angle - mapPinchState_.startAngle);
      const rect=(event.currentTarget.parentElement || event.currentTarget).getBoundingClientRect();
      const midpoint={x:((a.clientX+b.clientX)/2-rect.left)/rect.width, y:((a.clientY+b.clientY)/2-rect.top)/rect.height};
      mapPinchState_.midX=midpoint.x; mapPinchState_.midY=midpoint.y;
      mapZoom=Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, mapPinchState_.startZoom*(distance/mapPinchState_.startDistance)));
      applyPinchVisualTransform_(mapZoom);
    }
    return;
  }
  event.preventDefault();event.stopPropagation();
  const curX=event.touches[0].clientX, curY=event.touches[0].clientY;
  const dx=curX-mapPanState_.startX, dy=curY-mapPanState_.startY;
  const now=performance.now();
  const dt=Math.max(1,now-mapPanState_.lastT);
  const sample=Math.max(0.001, Math.min(1,16/dt));
  const vx=(curX-mapPanState_.lastX)/dt, vy=(curY-mapPanState_.lastY)/dt;
  mapPanState_.velocityX=mapPanState_.velocityX*(1-sample)+vx*sample;
  mapPanState_.velocityY=mapPanState_.velocityY*(1-sample)+vy*sample;
  mapPanState_.lastX=curX;mapPanState_.lastY=curY;mapPanState_.lastT=now;
  mapPanState_.dx=dx;mapPanState_.dy=dy;
  if(Math.hypot(dx,dy)>=4) mapPanState_.moved=true;
  scheduleMapPanVisual_();
}

function handleMapTouchEnd_(event) {
  if (mapGestureOwner_ !== 'touch') return;
  const touches = event && event.touches ? event.touches : null;
  console.log('[TRACE] touchend owner=touch moved', mapPanState_.moved, 'remaining', touches ? touches.length : 0);
  if (touches && touches.length === 1 && mapPinchState_.active) {
    try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
    const bounds = computeResponsiveDisplayBounds_(buildMapData());
    if (bounds) commitMapPinchViewport_(bounds);
    const visual = mapPinchState_.visualSvg;
    mapPinchState_.active = false; mapPinchState_.suppressTapUntil = Date.now()+350;
    if (visual) { visual.style.transform=composeMapTransform_(1, mapRotationDeg_, 0, 0); visual.style.transformOrigin='50% 50%'; visual.style.willChange=''; }
    mapPinchState_.visualSvg = null; mapPinchRenderScheduled_ = false;
    const svg = event.currentTarget.querySelector('svg') || event.currentTarget;
    if (bounds) beginMapPanPointer_(event, svg, bounds, touches[0].clientX, touches[0].clientY);
    return;
  }
  if (touches && touches.length > 0) return;
  if (!mapPanState_.active && !mapPinchState_.active) { mapGestureOwner_=null; return; }
  try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
  if (mapPinchState_.active) {
    const bounds=computeResponsiveDisplayBounds_(buildMapData()); if(bounds) commitMapPinchViewport_(bounds);
    mapPinchState_.active=false; mapPinchState_.suppressTapUntil=Date.now()+350;
    const visual=mapPinchState_.visualSvg; if(visual){visual.style.transform=composeMapTransform_(1, mapRotationDeg_, 0, 0);visual.style.transformOrigin='50% 50%';visual.style.willChange='';}
    mapPinchState_.visualSvg=null; mapPinchRenderScheduled_=false; mapGestureOwner_=null;
    requestAnimationFrame(()=>{render();flushMapGestureRender_();}); return;
  }
  if (mapPanState_.active) {
    if (mapPanState_.moved && startMapPanInertia_()) { mapPanState_.suppressTapUntil=Date.now()+500; mapGestureOwner_=null; return; }
    commitMapPan_(0,0); mapPanState_.suppressTapUntil=mapPanState_.moved?Date.now()+350:0; mapGestureOwner_=null; flushMapGestureRender_();
  }
}

function scheduleMapPanVisual_() {
  const svg = mapPanState_.visualSvg;
  if (!svg || !mapPanState_.active) return;
  // STEP 7.6D: apply visual pan immediately from the input event.
  // Do not wait an extra requestAnimationFrame; the browser can composite the
  // transform on the next frame while the input event is still in flight.
  applyPanVisual_(svg, mapPanState_.dx, mapPanState_.dy);
}

function applyPanVisual_(svg, dx, dy) {
  if (!svg) return;
  const base = mapPanState_.baseViewBox;
  const rectW = Number(mapPanState_.baseRectW) || 0;
  const rectH = Number(mapPanState_.baseRectH) || 0;
  if (!base || !(rectW > 0) || !(rectH > 0)) return;

  const x = Number.isFinite(dx) ? dx : 0;
  const y = Number.isFinite(dy) ? dy : 0;
  const r = (Number.isFinite(mapRotationDeg_) ? mapRotationDeg_ : 0) * Math.PI / 180;
  // CSS pan translation is in screen pixels. Convert it into SVG/viewBox coordinates.
  // Because the SVG itself may be rotated, undo that rotation before shifting viewBox.
  const qx = x * Math.cos(-r) - y * Math.sin(-r);
  const qy = x * Math.sin(-r) + y * Math.cos(-r);
  const vx = base.w / rectW;
  const vy = base.h / rectH;
  svg.setAttribute('viewBox',
    (base.x - qx * vx).toFixed(5) + ' ' +
    (base.y - qy * vy).toFixed(5) + ' ' +
    base.w.toFixed(5) + ' ' + base.h.toFixed(5));
  // Keep CSS transform stable: rotation only. No translate on the surface itself.
  svg.style.transform = composeMapTransform_(1, mapRotationDeg_, 0, 0);
  svg.style.willChange = 'transform';
}

function restoreMapPanViewBox_() {
  const svg = mapPanState_.visualSvg;
  const base = mapPanState_.baseViewBox;
  if (!svg || !base) return;
  svg.setAttribute('viewBox', base.x + ' ' + base.y + ' ' + base.w + ' ' + base.h);
}

function applyPinchVisualTransform_(zoom) {
  const svg = mapPinchState_.visualSvg;
  if (!svg || !mapPinchState_.active) return false;
  const baseZoom = Math.max(0.0001, mapPinchState_.startZoom);
  const visualScale = Math.max(0.1, zoom / baseZoom);
  svg.style.transformOrigin = (mapPinchState_.midX * 100).toFixed(2) + '% ' + (mapPinchState_.midY * 100).toFixed(2) + '%';
  svg.style.transform = composeMapTransform_(visualScale, mapPinchState_.currentRotation, 0, 0);
  svg.style.willChange = 'transform';
  return true;
}

function getMapPointerSvg_(event) {
  return event && event.currentTarget && event.currentTarget.tagName === 'svg'
    ? event.currentTarget
    : (event && event.currentTarget ? event.currentTarget.querySelector('svg') : null);
}

function getMapPointerRect_(svg) {
  if (!svg) return null;
  const r = (svg.parentElement || svg).getBoundingClientRect();
  return r && r.width > 0 && r.height > 0 ? r : null;
}

function getMapCenterNative_(bounds) {
  if (!bounds) return null;
  const vb = getMapViewBox_(bounds);
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  if (!(rangeT > 0) || !(rangeU > 0)) return null;
  const sx = vb.x + vb.w / 2, sy = vb.y + vb.h / 2;
  return {
    x: bounds.minT + (sx / 320) * rangeT,
    y: bounds.minU + ((320 - sy) / 320) * rangeU
  };
}

function beginMapPanPointer_(event, svg, bounds, startX, startY) {
  if (mapButtonZoomRaf_) cancelMapButtonZoom_(true);
  const baseCenterNative = getMapCenterNative_(bounds);
  const rect = getMapPointerRect_(svg);
  if (!baseCenterNative || !rect) return false;
  if (mapPanInertiaRaf_) { cancelAnimationFrame(mapPanInertiaRaf_); mapPanInertiaRaf_ = null; }
  mapPanState_ = {
    active: true,
    startX, startY,
    dx: 0, dy: 0,
    baseCenterNative,
    baseRectW: rect.width,
    baseRectH: rect.height,
    baseBounds: bounds,
    baseViewBox: getMapViewBox_(bounds),
    visualSvg: svg,
    moved: false,
    suppressTapUntil: 0,
    velocityX: 0,
    velocityY: 0,
    lastX: startX,
    lastY: startY,
    lastT: performance.now()
  };
  svg.style.transition = 'none';
  applyPanVisual_(svg, 0, 0);
  return true;
}

function commitMapPan_(extraDx, extraDy) {
  const svg = mapPanState_.visualSvg;
  const d1Dx = Number(mapPanState_.dx || 0) + Number(extraDx || 0);
  const d1Dy = Number(mapPanState_.dy || 0) + Number(extraDy || 0);
  const bounds = mapPanState_.baseBounds;
  if (bounds && mapPanState_.baseCenterNative && mapPanState_.baseRectW > 0 && mapPanState_.baseRectH > 0) {
    const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
    const zoomedW = 320 / Math.max(0.0001, mapZoom), zoomedH = 320 / Math.max(0.0001, mapZoom);
    const totalDx = mapPanState_.dx + (extraDx || 0);
    const totalDy = mapPanState_.dy + (extraDy || 0);
    const deltaNativeX = -(totalDx / mapPanState_.baseRectW) * (zoomedW / 320) * rangeT;
    const deltaNativeY = (totalDy / mapPanState_.baseRectH) * (zoomedH / 320) * rangeU;
    const nx = mapPanState_.baseCenterNative.x + deltaNativeX;
    const ny = mapPanState_.baseCenterNative.y + deltaNativeY;
    if (Number.isFinite(nx) && Number.isFinite(ny)) mapViewportState_.centerNative = { x: nx, y: ny };
  }
  if (svg) {
    restoreMapPanViewBox_();
    svg.style.transition = '';
    svg.style.transform = 'none';
    svg.style.willChange = '';
  }
  mapPanState_.active = false;
  mapPanState_.visualSvg = null;
  mapPanRenderScheduled_ = false;
  mapPanInertiaRaf_ = null;
  if (mapPanState_.moved) {
    render();
    // D1 hanya berjalan SETELAH commit/render selesai. Tidak pernah masuk ke jalur
    // scheduleMapPanVisual_ sehingga gesture 60 FPS tetap bebas dari planner.
    try {
      const d1 = planPassivePrefetchAfterPan_(d1Dx, d1Dy);
    } catch (_) {}
  }
}

function startMapPanInertia_() {
  const svg = mapPanState_.visualSvg;
  if (!svg) return false;
  let vx = mapPanState_.velocityX;
  let vy = mapPanState_.velocityY;
  const speed = Math.hypot(vx, vy);
  if (!mapPanState_.moved || speed < 0.08) return false;
  const friction = 0.90;
  let extraDx = 0, extraDy = 0;
  let lastFrame = performance.now();
  const tick = (now) => {
    if (!mapPanState_.active || mapPanState_.visualSvg !== svg) { mapPanInertiaRaf_ = null; return; }
    const dt = Math.min(32, Math.max(8, now - lastFrame));
    lastFrame = now;
    extraDx += vx * dt;
    extraDy += vy * dt;
    vx *= Math.pow(friction, dt / 16);
    vy *= Math.pow(friction, dt / 16);
    applyPanVisual_(svg, mapPanState_.dx + extraDx, mapPanState_.dy + extraDy);
    if (Math.hypot(vx, vy) > 0.02 && Math.hypot(extraDx, extraDy) < 420) {
      mapPanInertiaRaf_ = requestAnimationFrame(tick);
    } else {
      mapPanState_.dx += extraDx;
      mapPanState_.dy += extraDy;
      commitMapPan_(0, 0);
    }
  };
  mapPanInertiaRaf_ = requestAnimationFrame(tick);
  return true;
}

function commitMapPinchViewport_(bounds) {
  if (!bounds || !mapPinchState_.anchorNative) return;
  mapRotationDeg_ = Number.isFinite(mapPinchState_.currentRotation) ? mapPinchState_.currentRotation : mapRotationDeg_;
  if (compassState_.active && Number.isFinite(compassState_.smoothedHeadingDeg)) {
    compassRotationOffsetDeg_ = normalizeSignedDeg_(mapRotationDeg_ + compassState_.smoothedHeadingDeg);
  }
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  const zoomedW = 320 / Math.max(0.0001, mapZoom), zoomedH = 320 / Math.max(0.0001, mapZoom);
  if (!(rangeT > 0) || !(rangeU > 0)) return;
  const anchor = mapPinchState_.anchorNative;
  const anchorX = ((anchor.x - bounds.minT) / rangeT) * 320;
  const anchorY = 320 - ((anchor.y - bounds.minU) / rangeU) * 320;
  const fx = Math.max(0, Math.min(1, mapPinchState_.midX));
  const fy = Math.max(0, Math.min(1, mapPinchState_.midY));
  const pX = fx * 320, pY = fy * 320;
  const cX = 160, cY = 160;
  const rad = -mapRotationDeg_ * Math.PI / 180;
  const dx = pX - cX, dy = pY - cY;
  const qX = cX + (dx * Math.cos(rad) - dy * Math.sin(rad));
  const qY = cY + (dx * Math.sin(rad) + dy * Math.cos(rad));
  const centerSvgX = anchorX - (qX - cX) * (zoomedW / 320);
  const centerSvgY = anchorY - (qY - cY) * (zoomedH / 320);
  const centerNativeX = bounds.minT + (centerSvgX / 320) * rangeT;
  const centerNativeY = bounds.minU + ((320 - centerSvgY) / 320) * rangeU;
  if (Number.isFinite(centerNativeX) && Number.isFinite(centerNativeY)) {
    mapViewportState_.centerNative = { x: centerNativeX, y: centerNativeY };
  }
}

function handleMapPointerDown_(event) {
  if (mapGestureOwner_ === 'touch') return;
  if (mapGestureOwner_ === null) {
    if (mapPointerState_.size || mapPanState_.active || mapPinchState_.active || mapPanInertiaRaf_) resetMapGestureTransientState_();
    mapGestureOwner_ = 'pointer';
  }
  if (!event || !event.currentTarget) { mapGestureOwner_=null; return; }
  const svg = getMapPointerSvg_(event);
  if (!svg) return;
  // V13 TRACE FIX: di S7 Edge, pointerdown HARUS preventDefault untuk dapat pointermove, tap tetap masuk via suppressTapUntil
  try{ event.preventDefault(); }catch(_){}
  try { svg.setPointerCapture(event.pointerId); } catch (_) {}
  mapPointerState_.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const points = Array.from(mapPointerState_.entries());
  const bounds = computeResponsiveDisplayBounds_(buildMapData());
  if (!bounds) return;
  if (points.length === 1) {
    beginMapPanPointer_(event, svg, bounds, event.clientX, event.clientY);
    return;
  }
  if (points.length === 2) {
    const a = points[0][1], b = points[1][1];
    const rect = getMapPointerRect_(svg);
    if (!rect) return;
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (!(distance > 0)) return;
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    const midpoint = { x: ((a.x + b.x) / 2 - rect.left) / rect.width, y: ((a.y + b.y) / 2 - rect.top) / rect.height };
    const anchor = nativeFromClientPoint_({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }, bounds, rect);
    mapPanState_.active = false;
    if (mapPanInertiaRaf_) { cancelAnimationFrame(mapPanInertiaRaf_); mapPanInertiaRaf_ = null; }
    mapPinchState_ = { active: true, startDistance: distance, startZoom: mapZoom, startAngle: angle, startRotation: mapRotationDeg_, currentRotation: mapRotationDeg_, anchorNative: anchor, midX: midpoint.x, midY: midpoint.y, suppressTapUntil: Date.now() + 500, visualSvg: svg };
    svg.style.transform = composeMapTransform_(1, mapRotationDeg_, 0, 0);
    svg.style.transformOrigin = '50% 50%';
    svg.style.willChange = 'transform';
    event.preventDefault();
  }
}

function handleMapPointerMove_(event) {
  if (mapGestureOwner_ !== 'pointer') return;
  if (!event || !event.currentTarget || !mapPointerState_.has(event.pointerId)) return;
  mapPointerState_.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const svg = getMapPointerSvg_(event);
  const points = Array.from(mapPointerState_.entries());
  if (mapPinchState_.active && points.length >= 2) {
    event.preventDefault();
    const a = points[0][1], b = points[1][1];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (!(distance > 0) || !(mapPinchState_.startDistance > 0)) return;
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    mapPinchState_.currentRotation = mapPinchState_.startRotation + normalizeAngleDelta_(angle - mapPinchState_.startAngle);
    const rect = getMapPointerRect_(svg);
    if (!rect) return;
    mapPinchState_.midX = ((a.x + b.x) / 2 - rect.left) / rect.width;
    mapPinchState_.midY = ((a.y + b.y) / 2 - rect.top) / rect.height;
    mapZoom = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, mapPinchState_.startZoom * (distance / mapPinchState_.startDistance)));
    applyPinchVisualTransform_(mapZoom);
    return;
  }
  if (mapPanState_.active && points.length === 1) {
    event.preventDefault();
    const curX = event.clientX, curY = event.clientY;
    const dx = curX - mapPanState_.startX;
    const dy = curY - mapPanState_.startY;
    const now = performance.now();
    const dt = Math.max(1, now - mapPanState_.lastT);
    const sample = Math.max(0.001, Math.min(1, 16 / dt));
    const vx = (curX - mapPanState_.lastX) / dt;
    const vy = (curY - mapPanState_.lastY) / dt;
    mapPanState_.velocityX = mapPanState_.velocityX * (1 - sample) + vx * sample;
    mapPanState_.velocityY = mapPanState_.velocityY * (1 - sample) + vy * sample;
    mapPanState_.lastX = curX; mapPanState_.lastY = curY; mapPanState_.lastT = now;
    mapPanState_.dx = dx; mapPanState_.dy = dy;
    if (Math.hypot(dx, dy) >= 4) mapPanState_.moved = true;
    scheduleMapPanVisual_();
  }
}

function handleMapPointerUp_(event) {
  if (mapGestureOwner_ !== 'pointer') return;
  if (!event) { resetMapGestureTransientState_(); return; }
  const svg=getMapPointerSvg_(event); const wasPinching=mapPinchState_.active; const wasPanning=mapPanState_.active; const moved=mapPanState_.moved;
  mapPointerState_.delete(event.pointerId);
  try { if(svg && svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId); } catch(_) {}
  const remaining=Array.from(mapPointerState_.entries());
  if (wasPinching && remaining.length===1) {
    const bounds=computeResponsiveDisplayBounds_(buildMapData()); if(bounds) commitMapPinchViewport_(bounds);
    mapPinchState_.active=false; mapPinchState_.suppressTapUntil=Date.now()+350;
    const visual=mapPinchState_.visualSvg || svg; if(visual){visual.style.transform=composeMapTransform_(1, mapRotationDeg_, 0, 0);visual.style.transformOrigin='50% 50%';visual.style.willChange='';}
    mapPinchState_.visualSvg=null; mapPinchRenderScheduled_=false;
    if(bounds && visual){const q=remaining[0][1]; beginMapPanPointer_(event,visual,bounds,q.x,q.y);}
    return;
  }
  if (remaining.length>0) return;
  if (wasPinching) {
    const bounds=computeResponsiveDisplayBounds_(buildMapData()); if(bounds) commitMapPinchViewport_(bounds);
    mapPinchState_.active=false; mapPinchState_.suppressTapUntil=Date.now()+350;
    const visual=mapPinchState_.visualSvg; if(visual){visual.style.transform=composeMapTransform_(1, mapRotationDeg_, 0, 0);visual.style.transformOrigin='50% 50%';visual.style.willChange='';}
    mapPinchState_.visualSvg=null; mapPinchRenderScheduled_=false; mapGestureOwner_=null;
    requestAnimationFrame(()=>{render();flushMapGestureRender_();}); return;
  }
  if (wasPanning) {
    if(moved && startMapPanInertia_()){mapPanState_.suppressTapUntil=Date.now()+500;mapGestureOwner_=null;return;}
    commitMapPan_(0,0); mapPanState_.suppressTapUntil=moved?Date.now()+350:0; mapGestureOwner_=null; flushMapGestureRender_();
  } else { mapGestureOwner_=null; flushMapGestureRender_(); }
}

function handleMapPointerCancel_(event) {
  handleMapPointerUp_(event);
}

function getMapButtonZoomSvg_() {
  try {
    const vp = document.getElementById('mg1-map-viewport');
    return vp ? vp.querySelector('svg[data-map-gesture=\"true\"]') : null;
  } catch (_) { return null; }
}

function easeOutCubic_(t) {
  const p = 1 - Math.max(0, Math.min(1, t));
  return 1 - p * p * p;
}

function cancelMapButtonZoom_(commitVisual) {
  if (mapButtonZoomRaf_) { try { cancelAnimationFrame(mapButtonZoomRaf_); } catch (_) {} mapButtonZoomRaf_ = null; }
  const visual = Number.isFinite(mapButtonZoomVisual_) ? mapButtonZoomVisual_ : mapZoom;
  mapButtonZoomVisual_ = null;
  mapButtonZoomTarget_ = null;
  if (commitVisual && Number.isFinite(visual) && Math.abs(visual - mapZoom) > 0.0001) {
    const bounds = computeResponsiveDisplayBounds_(buildMapData());
    if (bounds) captureMapViewportCenter_(bounds);
    mapZoom = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, visual));
  }
  const svg = getMapButtonZoomSvg_();
  if (svg) { svg.style.transform = composeMapTransform_(1, mapRotationDeg_, 0, 0); svg.style.transformOrigin = '50% 50%'; svg.style.willChange = ''; }
}

function animateMapButtonZoom_(targetZoom) {
  const target = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, targetZoom));
  const svg = getMapButtonZoomSvg_();
  if (!svg) {
    mapZoom = target;
    if (mapZoom === MAP_ZOOM_MIN) mapViewportState_.centerNative = null;
    render();
    return;
  }
  const currentVisual = Number.isFinite(mapButtonZoomVisual_) ? mapButtonZoomVisual_ : mapZoom;
  mapButtonZoomTarget_ = target;
  if (Math.abs(currentVisual - target) < 0.0001) return;
  if (mapButtonZoomRaf_) { try { cancelAnimationFrame(mapButtonZoomRaf_); } catch (_) {} mapButtonZoomRaf_ = null; }
  const start = currentVisual;
  const distance = Math.abs(target - start);
  const duration = Math.max(170, Math.min(300, 150 + distance * 180));
  const startTime = performance.now();
  svg.style.transition = 'none';
  svg.style.transformOrigin = '50% 50%';
  svg.style.willChange = 'transform';
  const tick = (now) => {
    const liveTarget = Number.isFinite(mapButtonZoomTarget_) ? mapButtonZoomTarget_ : target;
    const elapsed = now - startTime;
    const t = Math.max(0, Math.min(1, elapsed / duration));
    const eased = easeOutCubic_(t);
    const visualZoom = start + (liveTarget - start) * eased;
    mapButtonZoomVisual_ = visualZoom;
    const scale = Math.max(0.1, visualZoom / Math.max(0.0001, mapZoom));
    svg.style.transform = composeMapTransform_(scale, mapRotationDeg_, 0, 0);
    if (t < 1) {
      mapButtonZoomRaf_ = requestAnimationFrame(tick);
      return;
    }
    mapButtonZoomRaf_ = null;
    mapZoom = liveTarget;
    if (mapZoom === MAP_ZOOM_MIN) mapViewportState_.centerNative = null;
    mapButtonZoomVisual_ = null;
    mapButtonZoomTarget_ = null;
    mapGestureRenderPending_ = false;
    svg.style.transform = 'none';
    svg.style.transformOrigin = '';
    svg.style.willChange = '';
    render();
  };
  mapButtonZoomRaf_ = requestAnimationFrame(tick);
}

function zoomMapIn() {
  const bounds = computeResponsiveDisplayBounds_(buildMapData());
  if (bounds) captureMapViewportCenter_(bounds);
  const base = Number.isFinite(mapButtonZoomTarget_) ? mapButtonZoomTarget_ : mapZoom;
  animateMapButtonZoom_(base + MAP_ZOOM_STEP);
}

function zoomMapOut() {
  const bounds = computeResponsiveDisplayBounds_(buildMapData());
  if (bounds) captureMapViewportCenter_(bounds);
  const base = Number.isFinite(mapButtonZoomTarget_) ? mapButtonZoomTarget_ : mapZoom;
  animateMapButtonZoom_(base - MAP_ZOOM_STEP);
}

function resetMapView() { cancelMapButtonZoom_(false); mapZoom = activeBackgroundMapId ? 1.25 : 1; compassRotationOffsetDeg_ = 0; mapRotationDeg_ = (compassState_.active && Number.isFinite(compassState_.smoothedHeadingDeg)) ? normalizeSignedDeg_(-compassState_.smoothedHeadingDeg) : 0; mapViewportState_.centerNative = null; mapPanState_ = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, baseCenterNative: null, baseRectW: 0, baseRectH: 0, visualSvg: null, moved: false, suppressTapUntil: 0, velocityX: 0, velocityY: 0, lastX: 0, lastY: 0, lastT: 0 }; mapPinchState_ = { active: false, startDistance: 0, startZoom: mapZoom, startAngle: 0, startRotation: mapRotationDeg_, currentRotation: mapRotationDeg_, anchorNative: null, midX: 0, midY: 0, suppressTapUntil: 0, visualSvg: null }; render(); }
