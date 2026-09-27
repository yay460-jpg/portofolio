/* MINE GEOLOGIST / LITHOSITE -- Map State
 * STEP 9.6 extraction from peta.js.
 * Purpose: own map viewport / gesture / selection state only.
 * No behavior or state names changed. Keep classic-script global lexical contract.
 */

// ==== MAP STATE =============================================================
let mapZoom = 1;
let mapRotationDeg_ = 0;
let mapViewportState_ = { centerNative: null }
let mapPanVelocity_ = { x:0, y:0, lastX:0, lastY:0, lastT:0 };
let mapPanInertiaRaf_ = null;;

// STEP 5.6: state gesture pinch-to-zoom 2 jari.
let mapPinchState_ = { active: false, startDistance: 0, startZoom: 1, startAngle: 0, startRotation: 0, currentRotation: 0, anchorNative: null, midX: 0, midY: 0, suppressTapUntil: 0, visualSvg: null };
let mapPinchRenderScheduled_ = false;

// STEP 7.6: single-finger pan state.
let mapPanState_ = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, baseCenterNative: null, baseRectW: 0, baseRectH: 0, visualSvg: null, moved: false, suppressTapUntil: 0, velocityX: 0, velocityY: 0, lastX: 0, lastY: 0, lastT: 0 };
let mapPanRenderScheduled_ = false;

// STEP 7.6E: smooth zoom-button visual transition.
let mapButtonZoomRaf_ = null;
let mapButtonZoomVisual_ = null;
let mapButtonZoomTarget_ = null;

// STEP 7.6 V10.4: unified Pointer Events state.
let mapPointerState_ = new Map();
// STEP 7.6B-V13.1: one gesture = one input owner.
let mapGestureOwner_ = null;
let mapGestureRenderPending_ = false;

let mapViewportRatio_ = 1;
let mapViewportSyncScheduled_ = false;

// ID TP yg sedang dibuka detailnya, null = tidak ada modal terbuka.
let mapDetailIdTp = null;
// TP yg harus otomatis dibuka detailnya ketika tab Peta aktif.
let mapFocusIdTp = null;
