from pathlib import Path
import json
import os
import shutil
import subprocess

import pytest


REPO_ROOT = Path(__file__).parents[2]
MEMBER_APP = REPO_ROOT / "lithosite-Mine-Geologist" / "member-app"
SECURITY_JS = MEMBER_APP / "scripts" / "map" / "map-security.js"
TRANSFER_JS = MEMBER_APP / "scripts" / "map" / "map-package-transfer.js"
MAP_JS = MEMBER_APP / "scripts" / "peta.js"
INDEX_HTML = MEMBER_APP / "index.html"


def test_browser_guard_load_order_and_shipped_consumers_are_consistent():
    html = INDEX_HTML.read_text(encoding="utf-8")
    security = html.index('src="scripts/map/map-security.js"')
    map_ui = html.index('src="scripts/peta.js"')
    transfer = html.index('src="scripts/map/map-package-transfer.js"')
    assert security < map_ui < transfer

    transfer_source = TRANSFER_JS.read_text(encoding="utf-8")
    map_source = MAP_JS.read_text(encoding="utf-8")
    assert "MG1LithositeSecurity.validatePayload(entry)" in transfer_source
    assert "MG1LithositeSecurity.isSafeImageDataUrl" in map_source


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Browser Guard runtime tests")
def test_browser_guard_exports_are_frozen_and_validate_safe_and_hostile_payloads():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_MAP_SECURITY, 'utf8'), { window });
const api = window.MG1LithositeSecurity;
const safeImage = 'data:image/png;base64,QUJD';
const unsafeImage = 'data:text/html;base64,QUJD';
const safePayload = {
  imageDataUrl: safeImage,
  tilePyramid: {
    levels: [{
      factor: 1,
      tiles: [{ x: 0, y: 0, tileKey: 'L1_X0_Y0', dataUrl: safeImage }]
    }]
  }
};
const hostilePayloads = [
  null,
  [],
  { imageDataUrl: unsafeImage },
  { tilePyramid: { levels: new Array(17).fill({ factor: 1, tiles: [] }) } },
  { tilePyramid: { levels: [{ factor: 1, tiles: [{ x: 1000001, y: 0 }] }] } },
  { tilePyramid: { levels: [{ factor: 1, tiles: [{ x: 0, y: 0, tileKey: 'L2_X0_Y0' }] }] } }
];
const mutationBlocked = (() => {
  try { api.injected = true; } catch (_) {}
  return !Object.prototype.hasOwnProperty.call(api, 'injected');
})();
process.stdout.write(JSON.stringify({
  frozen: Object.isFrozen(api),
  expectedExports: ['isSafeImageDataUrl', 'isSafeTileKey', 'validateTile', 'validatePayload', 'validateImportPackage'].every(k => typeof api[k] === 'function'),
  mutationBlocked,
  safeImage: api.isSafeImageDataUrl(safeImage),
  unsafeImage: api.isSafeImageDataUrl(unsafeImage),
  safePayload: api.validatePayload(safePayload),
  hostileRejected: hostilePayloads.every(payload => api.validatePayload(payload) === false),
  validLegacy: api.validateImportPackage({ maps: [{ imageDataUrl: safeImage, tiles: [{ dataUrl: safeImage, tileKey: 'L1_X0_Y0' }] }] }),
  invalidLegacy: api.validateImportPackage({ maps: [{ imageDataUrl: unsafeImage }] })
}));
"""
    env = os.environ.copy()
    env["LITHOSITE_MAP_SECURITY"] = str(SECURITY_JS)
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert output["frozen"] is True, output
    assert output["expectedExports"] is True, output
    assert output["mutationBlocked"] is True, output
    assert output["safeImage"] is True and output["unsafeImage"] is False, output
    assert output["safePayload"] is True, output
    assert output["hostileRejected"] is True, output
    assert output["validLegacy"] == {"ok": True}, output
    assert output["invalidLegacy"] == {"ok": False, "reason": "unsafe-image-data"}, output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Browser Guard consumer runtime tests")
def test_map_package_transfer_rejects_unsafe_payload_before_storage_commit():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const window = {
  navigator: { deviceMemory: 8 },
  crypto: crypto.webcrypto,
  MG1MapLibrary: { getAll: async () => [] }
};
let writes = 0, recoveryStarts = 0;
window.dbPutMap_ = async () => { writes++; };
window.MG1MapRecovery = { beginImport: () => { recoveryStarts++; } };
const context = vm.createContext({
  window,
  TextEncoder,
  TextDecoder,
  console: { log() {} },
  structuredClone,
  crypto: crypto.webcrypto
});
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_SECURITY, 'utf8'), context);
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_TRANSFER, 'utf8'), context);
function canonicalize(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalize(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}
(async () => {
  const payload = {
    format: 'MG1-LITHOSITE-MAP-PACKAGE',
    schemaVersion: 1,
    exportedAt: '2026-10-14T00:00:00.000Z',
    maps: [{ id: 'hostile-map', name: 'Hostile', imageDataUrl: 'data:text/html;base64,QUJD' }]
  };
  const integrity = crypto.createHash('sha256').update(canonicalize(payload)).digest('hex');
  const raw = JSON.stringify({ ...payload, integrity: { algorithm: 'SHA-256', scope: 'payload', value: integrity } });
  let rejected = false, errorMessage = '';
  try {
    await window.MG1MapPackageTransfer.importFile({
      name: 'hostile.mg1map',
      size: Buffer.byteLength(raw),
      text: async () => raw
    });
  } catch (error) {
    rejected = true;
    errorMessage = error.message;
  }
  process.stdout.write(JSON.stringify({ rejected, errorMessage, writes, recoveryStarts }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_MAP_SECURITY"] = str(MEMBER_APP / "scripts" / "map" / "map-security.js")
    env["LITHOSITE_MAP_TRANSFER"] = str(MEMBER_APP / "scripts" / "map" / "map-package-transfer.js")
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert output == {
        "rejected": True,
        "errorMessage": "Payload package tidak aman",
        "writes": 0,
        "recoveryStarts": 0,
    }, output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Browser Guard consumer runtime tests")
def test_map_package_transfer_commits_valid_payload_after_guard_and_integrity_checks():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const window = {
  navigator: { deviceMemory: 8 },
  crypto: crypto.webcrypto,
  MG1MapLibrary: { getAll: async () => [] }
};
let writes = 0, recoveryStarts = 0;
window.dbPutMap_ = async entry => { writes++; if (entry.id !== 'safe-map') throw new Error('unexpected map'); };
window.MG1MapRecovery = { beginImport: ids => { recoveryStarts++; if (ids[0] !== 'safe-map') throw new Error('unexpected recovery ID'); } };
const context = vm.createContext({
  window, TextEncoder, TextDecoder, console: { log() {} }, structuredClone, crypto: crypto.webcrypto
});
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_SECURITY, 'utf8'), context);
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_TRANSFER, 'utf8'), context);
function canonicalize(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalize(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
(async () => {
  const payload = {
    format: 'MG1-LITHOSITE-MAP-PACKAGE',
    schemaVersion: 1,
    exportedAt: '2026-10-14T00:00:00.000Z',
    maps: [{ id: 'safe-map', name: 'Safe map', imageDataUrl: 'data:image/png;base64,QUJD' }]
  };
  const integrity = crypto.createHash('sha256').update(canonicalize(payload)).digest('hex');
  const raw = JSON.stringify({ ...payload, integrity: { algorithm: 'SHA-256', scope: 'payload', value: integrity } });
  let errorMessage = '', result = null;
  try {
    result = await window.MG1MapPackageTransfer.importFile({
      name: 'safe.mg1map', size: Buffer.byteLength(raw), text: async () => raw
    });
  } catch (error) { errorMessage = error.message; }
  process.stdout.write(JSON.stringify({ ok: !!(result && result.ok), count: result && result.count, errorMessage, writes, recoveryStarts }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_MAP_SECURITY"] = str(MEMBER_APP / "scripts" / "map" / "map-security.js")
    env["LITHOSITE_MAP_TRANSFER"] = str(MEMBER_APP / "scripts" / "map" / "map-package-transfer.js")
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert output == {
        "ok": True,
        "count": 1,
        "errorMessage": "",
        "writes": 1,
        "recoveryStarts": 1,
    }, output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Browser Guard integrity tests")
def test_map_package_transfer_rejects_tampered_integrity_before_side_effects():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const window = {
  navigator: { deviceMemory: 8 },
  crypto: crypto.webcrypto,
  MG1MapLibrary: { getAll: async () => [] }
};
let writes = 0, recoveryStarts = 0;
window.dbPutMap_ = async () => { writes++; };
window.MG1MapRecovery = { beginImport: () => { recoveryStarts++; } };
const context = vm.createContext({
  window, TextEncoder, TextDecoder, console: { log() {} }, structuredClone, crypto: crypto.webcrypto
});
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_SECURITY, 'utf8'), context);
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_TRANSFER, 'utf8'), context);
(async () => {
  const payload = {
    format: 'MG1-LITHOSITE-MAP-PACKAGE',
    schemaVersion: 1,
    exportedAt: '2026-10-14T00:00:00.000Z',
    maps: [{ id: 'tampered-map', name: 'Tampered', imageDataUrl: 'data:image/png;base64,QUJD' }]
  };
  const raw = JSON.stringify({
    ...payload,
    integrity: { algorithm: 'SHA-256', scope: 'payload', value: '0'.repeat(64) }
  });
  let rejected = false, errorMessage = '';
  try {
    await window.MG1MapPackageTransfer.importFile({
      name: 'tampered.mg1map', size: Buffer.byteLength(raw), text: async () => raw
    });
  } catch (error) { rejected = true; errorMessage = error.message; }
  process.stdout.write(JSON.stringify({ rejected, errorMessage, writes, recoveryStarts }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_MAP_SECURITY"] = str(MEMBER_APP / "scripts" / "map" / "map-security.js")
    env["LITHOSITE_MAP_TRANSFER"] = str(MEMBER_APP / "scripts" / "map" / "map-package-transfer.js")
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert output["rejected"] is True, output
    assert output["writes"] == 0 and output["recoveryStarts"] == 0, output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Browser Guard malformed-package tests")
def test_map_package_transfer_rejects_truncated_json_before_side_effects():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const window = {
  navigator: { deviceMemory: 8 },
  crypto: crypto.webcrypto,
  MG1MapLibrary: { getAll: async () => [] }
};
let writes = 0, recoveryStarts = 0;
window.dbPutMap_ = async () => { writes++; };
window.MG1MapRecovery = { beginImport: () => { recoveryStarts++; } };
const context = vm.createContext({
  window, TextEncoder, TextDecoder, console: { log() {} }, structuredClone, crypto: crypto.webcrypto
});
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_SECURITY, 'utf8'), context);
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_TRANSFER, 'utf8'), context);
(async () => {
  const raw = '{"format":"MG1-LITHOSITE-MAP-PACKAGE","schemaVersion":1,"maps":[';
  let rejected = false, errorMessage = '';
  try {
    await window.MG1MapPackageTransfer.importFile({
      name: 'truncated.mg1map', size: Buffer.byteLength(raw), text: async () => raw
    });
  } catch (error) { rejected = true; errorMessage = error.message; }
  process.stdout.write(JSON.stringify({ rejected, errorMessage, writes, recoveryStarts }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_MAP_SECURITY"] = str(MEMBER_APP / "scripts" / "map" / "map-security.js")
    env["LITHOSITE_MAP_TRANSFER"] = str(MEMBER_APP / "scripts" / "map" / "map-package-transfer.js")
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert output["rejected"] is True, output
    assert output["writes"] == 0 and output["recoveryStarts"] == 0, output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Browser Guard import preflight tests")
def test_map_package_transfer_rejects_duplicate_id_before_side_effects():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const window = {
  navigator: { deviceMemory: 8 },
  crypto: crypto.webcrypto,
  MG1MapLibrary: { getAll: async () => [] }
};
let writes = 0, recoveryStarts = 0;
window.dbPutMap_ = async () => { writes++; };
window.MG1MapRecovery = { beginImport: () => { recoveryStarts++; } };
const context = vm.createContext({
  window, TextEncoder, TextDecoder, console: { log() {} }, structuredClone, crypto: crypto.webcrypto
});
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_SECURITY, 'utf8'), context);
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_TRANSFER, 'utf8'), context);
function canonicalize(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalize(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
(async () => {
  const entry = { id: 'duplicate-map', name: 'Duplicate', imageDataUrl: 'data:image/png;base64,QUJD' };
  const payload = {
    format: 'MG1-LITHOSITE-MAP-PACKAGE',
    schemaVersion: 1,
    exportedAt: '2026-10-14T00:00:00.000Z',
    maps: [entry, { ...entry }]
  };
  const integrity = crypto.createHash('sha256').update(canonicalize(payload)).digest('hex');
  const raw = JSON.stringify({ ...payload, integrity: { algorithm: 'SHA-256', scope: 'payload', value: integrity } });
  let rejected = false, errorCode = '', errorMessage = '';
  try {
    await window.MG1MapPackageTransfer.importFile({
      name: 'duplicates.mg1map', size: Buffer.byteLength(raw), text: async () => raw
    });
  } catch (error) { rejected = true; errorCode = error.code || ''; errorMessage = error.message; }
  process.stdout.write(JSON.stringify({ rejected, errorCode, errorMessage, writes, recoveryStarts }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_MAP_SECURITY"] = str(MEMBER_APP / "scripts" / "map" / "map-security.js")
    env["LITHOSITE_MAP_TRANSFER"] = str(MEMBER_APP / "scripts" / "map" / "map-package-transfer.js")
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert output["rejected"] is True, output
    assert output["errorCode"] == "PACKAGE_ID_DUPLICATE", output
    assert output["writes"] == 0 and output["recoveryStarts"] == 0, output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Browser Guard collision preflight tests")
def test_map_package_transfer_rejects_existing_ids_before_side_effects():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
let libraryMaps = [{ id: 'collision-map', name: 'Existing library map' }];
const window = {
  navigator: { deviceMemory: 8 },
  crypto: crypto.webcrypto,
  MG1MapLibrary: { getAll: async () => libraryMaps },
  backgroundMapsList: []
};
let writes = 0, recoveryStarts = 0;
window.dbPutMap_ = async () => { writes++; };
window.MG1MapRecovery = { beginImport: () => { recoveryStarts++; } };
const context = vm.createContext({
  window, TextEncoder, TextDecoder, console: { log() {} }, structuredClone, crypto: crypto.webcrypto
});
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_SECURITY, 'utf8'), context);
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_TRANSFER, 'utf8'), context);
function canonicalize(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalize(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
(async () => {
  const payload = {
    format: 'MG1-LITHOSITE-MAP-PACKAGE',
    schemaVersion: 1,
    exportedAt: '2026-10-14T00:00:00.000Z',
    maps: [{ id: 'collision-map', name: 'Incoming map', imageDataUrl: 'data:image/png;base64,QUJD' }]
  };
  const integrity = crypto.createHash('sha256').update(canonicalize(payload)).digest('hex');
  const raw = JSON.stringify({ ...payload, integrity: { algorithm: 'SHA-256', scope: 'payload', value: integrity } });
  async function attempt() {
    try {
      await window.MG1MapPackageTransfer.importFile({
        name: 'collision.mg1map', size: Buffer.byteLength(raw), text: async () => raw
      });
      return { rejected: false, code: '' };
    } catch (error) {
      return { rejected: true, code: error.code || '', message: error.message };
    }
  }
  const libraryCollision = await attempt();
  libraryMaps = [];
  window.backgroundMapsList = [{ id: 'collision-map', name: 'Existing background map' }];
  const backgroundCollision = await attempt();
  process.stdout.write(JSON.stringify({ libraryCollision, backgroundCollision, writes, recoveryStarts }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_MAP_SECURITY"] = str(MEMBER_APP / "scripts" / "map" / "map-security.js")
    env["LITHOSITE_MAP_TRANSFER"] = str(MEMBER_APP / "scripts" / "map" / "map-package-transfer.js")
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert output["libraryCollision"]["rejected"] is True, output
    assert output["libraryCollision"]["code"] == "ID_COLLISION", output
    assert output["backgroundCollision"]["rejected"] is True, output
    assert output["backgroundCollision"]["code"] == "ID_COLLISION", output
    assert output["writes"] == 0 and output["recoveryStarts"] == 0, output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Browser Guard size-limit tests")
def test_map_package_transfer_rejects_oversized_file_before_reading():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const window = {
  navigator: { deviceMemory: 2 },
  crypto: crypto.webcrypto,
  MG1MapLibrary: { getAll: async () => [] }
};
let reads = 0, writes = 0, recoveryStarts = 0;
window.dbPutMap_ = async () => { writes++; };
window.MG1MapRecovery = { beginImport: () => { recoveryStarts++; } };
const context = vm.createContext({
  window, TextEncoder, TextDecoder, console: { log() {} }, structuredClone, crypto: crypto.webcrypto
});
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_SECURITY, 'utf8'), context);
vm.runInContext(fs.readFileSync(process.env.LITHOSITE_MAP_TRANSFER, 'utf8'), context);
(async () => {
  let rejected = false, errorCode = '', errorMessage = '';
  try {
    await window.MG1MapPackageTransfer.importFile({
      name: 'oversized.mg1map',
      size: 64 * 1024 * 1024 + 1,
      text: async () => { reads++; return '{}'; }
    });
  } catch (error) { rejected = true; errorCode = error.code || ''; errorMessage = error.message; }
  process.stdout.write(JSON.stringify({ rejected, errorCode, errorMessage, reads, writes, recoveryStarts }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_MAP_SECURITY"] = str(MEMBER_APP / "scripts" / "map" / "map-security.js")
    env["LITHOSITE_MAP_TRANSFER"] = str(MEMBER_APP / "scripts" / "map" / "map-package-transfer.js")
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert output["rejected"] is True, output
    assert output["errorCode"] == "PACKAGE_TOO_LARGE", output
    assert output["reads"] == 0, output
    assert output["writes"] == 0 and output["recoveryStarts"] == 0, output
