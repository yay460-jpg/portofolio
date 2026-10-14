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
