from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAINTENANCE_CSS = ROOT / "ui" / "modules" / "maintenance" / "maintenance.css"
MAINTENANCE_JS = ROOT / "ui" / "modules" / "maintenance" / "maintenance.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"


def test_maintenance_register_view_button_matches_compact_operations_geometry():
    css = MAINTENANCE_CSS.read_text(encoding="utf-8")
    js = MAINTENANCE_JS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    selector = "#maintenanceScreen .row-actions .control.view{"
    assert css.count(selector) == 1
    rule = css.split(selector, 1)[1].split("}", 1)[0]
    assert "width:42px" in rule
    assert "min-width:42px" in rule
    assert "max-width:42px" in rule
    assert "flex:0 0 42px" in rule
    assert "height:30px" in rule
    assert "justify-content:center" in rule

    assert 'class="control mini view maintenance-timeline-row"' in js
    assert "../ui/modules/maintenance/maintenance.css?v=20261012-compact-view" in html


def test_maintenance_view_button_sizing_is_scoped_and_does_not_override_operations():
    css = MAINTENANCE_CSS.read_text(encoding="utf-8")

    assert "#operationsScreen .row-actions .control.view{" not in css
    assert css.count("#maintenanceTimelineModal .row-actions .mini{") == 1
    assert "#maintenanceScreen .row-actions .control.view{" in css
