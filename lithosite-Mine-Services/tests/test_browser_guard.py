from pathlib import Path
import json
import os
import shutil
import subprocess

import pytest


REPO_ROOT = Path(__file__).resolve().parents[2]
BROWSER_GUARD = (
    REPO_ROOT
    / "lithosite-Mine-Geologist"
    / "member-app"
    / "scripts"
    / "map"
    / "map-security.js"
)


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for browser-guard runtime tests")
def test_browser_guard_loads_and_keeps_import_validation_behind_frozen_api():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const target = process.env.LITHOSITE_BROWSER_GUARD;
const window = {};
vm.runInNewContext(fs.readFileSync(target, 'utf8'), { window });
const api = window.MG1LithositeSecurity;
if (!api || typeof api.validatePayload !== 'function') {
  throw new Error('Browser Guard payload API was not exported');
}
if (!Object.isFrozen(api)) {
  throw new Error('Browser Guard API must remain immutable');
}
if (typeof api.validateImportPackage !== 'function') {
  throw new Error('Browser Guard import validation API was not exported');
}
const safe = api.validateImportPackage({
  maps: [{ imageDataUrl: 'data:image/png;base64,AAAA' }]
});
const unsafe = api.validateImportPackage({
  maps: [{ imageDataUrl: 'data:text/html;base64,AAAA' }]
});
if (!safe || safe.ok !== true) throw new Error('Safe import package was rejected');
if (!unsafe || unsafe.ok !== false) throw new Error('Unsafe import package was accepted');
process.stdout.write(JSON.stringify({ loaded: true, frozen: true, safe: safe.ok, unsafe: unsafe.ok }));
"""
    env = os.environ.copy()
    env["LITHOSITE_BROWSER_GUARD"] = str(BROWSER_GUARD)
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    assert json.loads(result.stdout) == {
        "loaded": True,
        "frozen": True,
        "safe": True,
        "unsafe": False,
    }
