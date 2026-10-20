from pathlib import Path
import re

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
SNAPSHOT = ROOT / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html"
DASHBOARD_JS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.js").read_text(encoding="utf-8")
DASHBOARD_CSS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.css").read_text(encoding="utf-8")
DONUT_JS = (ROOT / "ui" / "shared" / "graphicdonut.js").read_text(encoding="utf-8")
DONUT_CSS = (ROOT / "ui" / "shared" / "graphicdonut.css").read_text(encoding="utf-8")
HTML = ARTIFACT.read_text(encoding="utf-8")
SNAPSHOT_HTML = SNAPSHOT.read_text(encoding="utf-8")


def test_equipment_status_uses_shared_donut_controller_without_moving_data_logic():
    assert "const graphicDonut = window.LithositeGraphicDonut" in DASHBOARD_JS
    assert "graphicDonut.render({" in DASHBOARD_JS
    assert "segments: [" in DASHBOARD_JS
    assert "{ label: 'Active', value: counts.active, color: '#22c55e' }" in DASHBOARD_JS
    assert "{ label: 'Inactive', value: counts.inactive, color: '#f59e0b' }" in DASHBOARD_JS
    assert "{ label: 'Retired', value: counts.retired, color: '#ef4444' }" in DASHBOARD_JS
    assert "const unclassified = Math.max(0, total - counts.active - counts.inactive - counts.retired)" in DASHBOARD_JS
    assert "setText('dashboardEquipmentTotal', total)" in DASHBOARD_JS
    assert 'id="dashboardEquipmentDonut"' in HTML
    assert 'id="dashboardEquipmentTotal"' in HTML


def test_shared_donut_controller_exposes_render_and_clear_contract():
    assert "function render(options)" in DONUT_JS
    assert "function clear(target)" in DONUT_JS
    assert "global.LithositeGraphicDonut = Object.freeze({ render: render, clear: clear })" in DONUT_JS
    assert "Number.isFinite(value) && value > 0" in DONUT_JS
    assert "conic-gradient(" in DONUT_JS
    assert "setAttribute('role', 'img')" in DONUT_JS
    assert "setAttribute('aria-label'" in DONUT_JS
    assert "element.removeAttribute('aria-label')" in DONUT_JS


def test_donut_assets_are_loaded_and_cache_keys_match_active_artifact_snapshot():
    active_js = re.search(r'<script src="(\.\./ui/shared/graphicdonut\.js\?v=[^"]+)"', HTML)
    snapshot_js = re.search(r'<script src="(\.\./ui/shared/graphicdonut\.js\?v=[^"]+)"', SNAPSHOT_HTML)
    active_css = re.search(r'<link rel="stylesheet" href="(\.\./ui/shared/graphicdonut\.css\?v=[^"]+)"', HTML)
    snapshot_css = re.search(r'<link rel="stylesheet" href="(\.\./ui/shared/graphicdonut\.css\?v=[^"]+)"', SNAPSHOT_HTML)
    assert active_js and snapshot_js and active_js.group(1) == snapshot_js.group(1)
    assert active_css and snapshot_css and active_css.group(1) == snapshot_css.group(1)


def test_shared_donut_css_primitives_are_present_but_dashboard_still_owns_live_geometry():
    for selector in (
        ".graphic-donut {",
        ".graphic-donut__hole {",
        ".graphic-donut__center {",
        ".graphic-donut__total {",
        ".graphic-donut__label {",
    ):
        assert selector in DONUT_CSS
    assert "#dashboardScreen .donut{" in DASHBOARD_CSS
    assert "#dashboardScreen .donut:after{" in DASHBOARD_CSS
    assert 'class="donut"' in HTML
    assert 'class="graphic-donut"' not in HTML
