/* MG1 / LITHOSITE V24.5 S2.1 — STORAGE / CAPACITY CAPABILITY
 * Read-only storage observation. No IndexedDB writes/deletes, no lifecycle,
 * no activation, no import/export, no renderer/tile/runtime behavior.
 */
(function (global) {
  'use strict';

  var STATES = Object.freeze({
    UNKNOWN: 'STORAGE_UNKNOWN',
    EMPTY: 'STORAGE_EMPTY',
    NORMAL: 'STORAGE_NORMAL',
    HIGH: 'STORAGE_HIGH',
    CRITICAL: 'STORAGE_CRITICAL',
    FULL: 'STORAGE_FULL'
  });

  var THRESHOLDS = Object.freeze({ HIGH: 0.70, CRITICAL: 0.85, FULL: 1.00 });

  function utf8Bytes_(value) {
    var json = JSON.stringify(value);
    if (global.TextEncoder) return new global.TextEncoder().encode(json).byteLength;
    return unescape(encodeURIComponent(json)).length;
  }

  function maps_() {
    if (!global.MG1MapLibrary || typeof global.MG1MapLibrary.getAll !== 'function') {
      throw new Error('Map Library tidak tersedia');
    }
    return Promise.resolve(global.MG1MapLibrary.getAll());
  }

  function stateFromRatio_(ratio, mapCount, estimateAvailable) {
    if (!estimateAvailable || !Number.isFinite(ratio)) {
      return mapCount === 0 ? STATES.EMPTY : STATES.UNKNOWN;
    }
    if (ratio >= THRESHOLDS.FULL) return STATES.FULL;
    if (ratio >= THRESHOLDS.CRITICAL) return STATES.CRITICAL;
    if (ratio >= THRESHOLDS.HIGH) return STATES.HIGH;
    return mapCount === 0 ? STATES.EMPTY : STATES.NORMAL;
  }

  async function browserEstimate_() {
    try {
      if (!global.navigator || !global.navigator.storage ||
          typeof global.navigator.storage.estimate !== 'function') {
        return { available: false, usage: null, quota: null };
      }
      var result = await global.navigator.storage.estimate();
      var usage = Number(result && result.usage);
      var quota = Number(result && result.quota);
      if (!Number.isFinite(usage) || !Number.isFinite(quota) || quota <= 0) {
        return { available: false, usage: null, quota: null };
      }
      return { available: true, usage: usage, quota: quota };
    } catch (_) {
      return { available: false, usage: null, quota: null };
    }
  }

  async function summary() {
    var maps = await maps_();
    var mapCount = Array.isArray(maps) ? maps.length : 0;
    var payloadBytes = 0;
    var largestMapBytes = 0;
    var largestMapId = null;

    (Array.isArray(maps) ? maps : []).forEach(function (entry) {
      var bytes = 0;
      try { bytes = utf8Bytes_(entry); } catch (_) { bytes = 0; }
      payloadBytes += bytes;
      if (bytes > largestMapBytes) {
        largestMapBytes = bytes;
        largestMapId = entry && entry.id != null ? String(entry.id) : null;
      }
    });

    var estimate = await browserEstimate_();
    var ratio = estimate.available ? estimate.usage / estimate.quota : null;
    return {
      mapCount: mapCount,
      payloadBytes: payloadBytes,
      payloadMB: payloadBytes / 1024 / 1024,
      usageBytes: estimate.usage,
      quotaBytes: estimate.quota,
      usageRatio: ratio,
      state: stateFromRatio_(ratio, mapCount, estimate.available),
      estimateAvailable: estimate.available,
      largestMapBytes: largestMapBytes,
      largestMapId: largestMapId
    };
  }

  global.MG1MapStorageCapability = Object.freeze({
    version: '24.5-s2.1',
    states: STATES,
    thresholds: THRESHOLDS,
    summary: summary
  });

  console.log('[V24.5 S2.1] Storage capability ready — read-only observation boundary');
})(window);
