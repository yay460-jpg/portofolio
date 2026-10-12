(function(global){
  'use strict';

  const KEY = 'lithosite.mine-services.kpi-policy';
  const LEGACY_KEY_PATTERN = /^lithosite\.mine-services\.v\d+\.kpi-policy$/;

  function legacyKeys(storage) {
    if (!storage || typeof storage.key !== 'function') return [];
    let length = 0;
    try { length = Number(storage.length) || 0; } catch (_) { return []; }

    const keys = [];
    for (let index = 0; index < length; index += 1) {
      let key = null;
      try { key = storage.key(index); } catch (_) { continue; }
      if (typeof key === 'string' && LEGACY_KEY_PATTERN.test(key)) keys.push(key);
    }
    const versionNumber = key => Number(key.match(/\.v(\d+)\.kpi-policy$/)?.[1] || 0);
    return keys.sort((a, b) => versionNumber(b) - versionNumber(a));
  }

  function parsePolicy(raw) {
    if (typeof raw !== 'string' || !raw) return null;
    try {
      const value = JSON.parse(raw);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch (_) {
      return null;
    }
  }

  function read(storage) {
    if (!storage || typeof storage.getItem !== 'function') return null;

    try {
      let currentRaw = null;
      try { currentRaw = storage.getItem(KEY); } catch (_) {}
      const current = parsePolicy(currentRaw);
      if (current) return current;

      for (const legacyKey of legacyKeys(storage)) {
        let raw = null;
        try { raw = storage.getItem(legacyKey); } catch (_) { continue; }
        const saved = parsePolicy(raw);
        if (!saved) continue;
        try { storage.setItem(KEY, raw); } catch (_) {}
        return saved;
      }
    } catch (_) {}
    return null;
  }

  global.LithositeDashboardKpiPolicyStorage = Object.freeze({
    KEY,
    LEGACY_KEY_PATTERN,
    read
  });
})(window);
