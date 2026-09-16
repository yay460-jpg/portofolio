// MINE GEOLOGIST MAP DEVICE PROFILE
// STEP 9.7 extraction: behavior-preserving physical split from peta.js.
// LOCKED CORE: do not alter detection or tier mapping without dedicated audit.

// STEP A - DEVICE PROFILER V1
// Profiling saja. TIDAK mengubah renderer GeoPDF, tile pyramid, tile size, batch,
// prefetch, cache, gesture, atau parameter existing V13.1/V14.x.
// Tujuan: mengukur kemampuan perangkat dan menghasilkan diagnostic LOW/BALANCED/HIGH
// untuk field test sebelum parameter adaptive dipakai pada STEP B/C.
// ============================================================================
// IMPORTANT — LOCKED DEVICE TIER DETECTION CORE
// This function is FUNCTIONAL, not temporary diagnostic UI.
// It detects/classifies the device tier (LOW / BALANCED / HIGH) using hardware
// hints + raster benchmark. DO NOT delete, rename, bypass, or replace it
// without a dedicated cross-file audit. Its result feeds tile-engine selection.
// ============================================================================
function getDeviceTileProfile_() {
  const mem = Number(navigator.deviceMemory) || 0;
  const cores = Number(navigator.hardwareConcurrency) || 0;
  const dpr = Number(window.devicePixelRatio) || 1;
  const screenWidth = Number(window.screen && window.screen.width) || 0;
  const screenHeight = Number(window.screen && window.screen.height) || 0;
  const screenPixels = screenWidth * screenHeight * dpr * dpr;

  // STEP A V2: raster/compositing micro-benchmark.
  // Lebih dekat ke pekerjaan tile bitmap daripada fillRect sederhana, tetapi tetap
  // kecil dan terisolasi. Hasil INI masih diagnostic; belum mengubah renderer.
  let benchMs = 70;
  let benchSamples = [];
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
    if (!ctx) throw new Error('Canvas 2D tidak tersedia.');

    // Warm-up agar JIT/Canvas initialization tidak masuk hasil pengukuran utama.
    for (let w = 0; w < 2; w++) {
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgb(' + ((i * 31) % 255) + ',80,180)';
        ctx.fillRect((i * 13) % 448, (i * 17) % 448, 64, 64);
      }
      ctx.drawImage(canvas, 0, 0, 512, 512, 0, 0, 256, 256);
    }

    for (let sample = 0; sample < 6; sample++) {
      const t0 = performance.now();

      // Pola raster + transform + compositing + image scaling.
      for (let i = 0; i < 80; i++) {
        const x = (i * 37) % 480;
        const y = (i * 53) % 480;
        ctx.globalAlpha = 0.55 + ((i % 4) * 0.1);
        ctx.fillStyle = 'rgb(' + ((i * 47) % 255) + ',' + ((i * 29) % 255) + ',180)';
        ctx.fillRect(x, y, 48, 48);

        ctx.beginPath();
        ctx.arc((x + 24) % 512, (y + 24) % 512, 12 + (i % 8), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      for (let i = 0; i < 8; i++) {
        ctx.drawImage(canvas, 0, 0, 512, 512, i * 8, i * 6, 256, 256);
      }

      // Readback kecil untuk memaksa sinkronisasi raster/composite.
      ctx.getImageData(0, 0, 32, 32);

      benchSamples.push(performance.now() - t0);
    }

    benchSamples.sort(function(a, b) { return a - b; });
    benchMs = benchSamples[Math.floor(benchSamples.length / 2)];
    try { canvas.width = 1; canvas.height = 1; } catch (_) {}
  } catch (e) {
    benchMs = 70;
    benchSamples = [];
  }

  let webglRenderer = '';
  try {
    const glCanvas = document.createElement('canvas');
    const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) webglRenderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
    }
    try { glCanvas.width = 1; glCanvas.height = 1; } catch (_) {}
  } catch (_) {}

  // Klasifikasi STEP A saja. Hardware hints + V2 benchmark sebagai sinyal.
  let tier = 'BALANCED';
  if (benchMs > 25 || (mem > 0 && mem <= 4) || (cores > 0 && cores <= 4)) tier = 'LOW';
  if (benchMs < 8 && mem >= 8 && cores >= 6 && screenPixels > 2000000) tier = 'HIGH';

  const profile = {
    tier: tier,
    benchMs: Number(benchMs.toFixed(1)),
    benchmarkType: 'canvas-raster-v2',
    benchmarkSamples: benchSamples.map(function(v) { return Number(v.toFixed(1)); }),
    memoryGB: mem || null,
    cores: cores || null,
    dpr: Number(dpr.toFixed(2)),
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    screenPixels: Math.round(screenPixels),
    webglRenderer: webglRenderer || null,
    profilerVersion: 'A2'
  };

  try { localStorage.setItem('mg1_device_tile_profile_v2', JSON.stringify(profile)); } catch (_) {}
  window.mg1DeviceTileProfile = profile;
  return profile;
}

// STEP B - TILE ENGINE PROFILE V1
// Parameter profile saja. TIDAK dipakai oleh renderer pada tahap ini.
// ============================================================================
// IMPORTANT — LOCKED TILE ENGINE PROFILE CORE
// This function converts the detected tier into the functional tile-engine
// contract. LOW=768px, BALANCED=256px, HIGH=512px.
// DO NOT delete, rename, or alter these tier mappings without a dedicated
// geometry/runtime audit. Renderer and persistence depend on this contract.
// ============================================================================
function getDeviceTileEngineProfile_() {
  let deviceProfile = window.mg1DeviceTileProfile;
  if (!deviceProfile) {
    try {
      const cached = localStorage.getItem('mg1_device_tile_profile_v2');
      if (cached) deviceProfile = JSON.parse(cached);
    } catch (_) {}
  }
  if (!deviceProfile) {
    try { deviceProfile = getDeviceTileProfile_(); } catch (_) { deviceProfile = { tier: 'BALANCED' }; }
  }
  const tier = String(deviceProfile.tier || 'BALANCED').toUpperCase();
  const profiles = {
    LOW: { tier:'LOW', tileSize:768, maxFactor:1, usableFactors:[0.5,1], batchSize:2, batchDelayMs:25, prefetchRadius:0, cacheLimit:40 },
    BALANCED: { tier:'BALANCED', tileSize:256, maxFactor:2, usableFactors:[0.25,0.5,1,2], batchSize:8, batchDelayMs:12, prefetchRadius:2, cacheLimit:150 },
    HIGH: { tier:'HIGH', tileSize:512, maxFactor:2, usableFactors:[0.25,0.5,1,2], batchSize:16, batchDelayMs:0, prefetchRadius:3, cacheLimit:300 }
  };
  const profile = Object.assign({}, profiles[tier] || profiles.BALANCED, {
    sourceProfilerVersion: deviceProfile.profilerVersion || 'A2',
    benchmarkMs: Number(deviceProfile.benchMs) || null
  });
  try { localStorage.setItem('mg1_tile_engine_profile_v1', JSON.stringify(profile)); } catch (_) {}
  window.mg1DeviceTileEngineProfile = profile;
  // IMPORTANT: functional runtime state; do not remove.
  return profile;
}

