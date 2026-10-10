import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
BUTTON_CSS = ROOT / "ui" / "shared" / "button.css"
DASHBOARD_CSS = ROOT / "ui" / "modules" / "dashboard" / "dashboard.css"
MODULE_CSS = [
    ROOT / "ui" / "modules" / "workfront" / "workfront.css",
    ROOT / "ui" / "modules" / "equipment" / "equipment.css",
    ROOT / "ui" / "modules" / "operations" / "operations.css",
    ROOT / "ui" / "modules" / "maintenance" / "maintenance.css",
    ROOT / "ui" / "modules" / "issues" / "issues.css",
    ROOT / "ui" / "modules" / "hse" / "hse.css",
]


def test_filter_clear_geometry_has_one_shared_owner():
    shared = BUTTON_CSS.read_text(encoding="utf-8")
    assert ".filters > .control.clear{" in shared
    assert "width:56px;min-width:56px;max-width:56px;height:32px" in shared

    duplicated_geometry = (
        ".clear{width:56px",
        ".clear{height:32px}",
        "#equipmentClear{width:56px",
        "#workfrontClear{width:56px",
        "#clear{width:56px",
        "#maintenanceClear{width:56px",
        "#issuesClear{width:56px",
        "#hseClear{width:56px",
        "#plansClear{width:56px",
    )
    for path in MODULE_CSS:
        css = path.read_text(encoding="utf-8")
        for selector in duplicated_geometry:
            assert selector not in css, f"Clear sizing remains module-owned in {path.name}: {selector}"


def test_filter_clear_buttons_use_the_shared_class():
    html = ARTIFACT.read_text(encoding="utf-8")
    for element_id in (
        "equipmentClear", "workfrontClear", "maintenanceClear", "clear",
        "plansClear", "hseClear", "issuesClear",
    ):
        assert f'class="control clear" id="{element_id}"' in html

    # Report search Clear has its own compact search action and must not inherit filter geometry.
    assert 'class="control reports-search-clear" id="reportsClear"' in html
    assert 'class="control clear" id="reportsClear"' not in html
    # Map toolbar Clear actions are not filter-panel controls.
    assert 'id="dashboardTopo3DClear"' in html
    assert 'id="dashboardTopo3DMeasureClear"' in html


def test_shared_button_stylesheet_loads_after_filter_module_styles():
    html = ARTIFACT.read_text(encoding="utf-8")
    shared = html.index("button.css?v=20261011-clear-contract")
    for module in ("workfront.css", "equipment.css", "operations.css", "maintenance.css", "issues.css", "hse.css", "plans.css"):
        assert html.index(module) < shared


def test_dashboard_css_contains_no_empty_rules_or_version_comments():
    css = DASHBOARD_CSS.read_text(encoding="utf-8")
    assert not re.search(r"[^{}]+\{\s*\}", css)
    assert not re.search(r"\bV\d+\b|Stage\s+\d+", css)
