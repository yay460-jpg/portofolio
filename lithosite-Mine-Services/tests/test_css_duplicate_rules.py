import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
OPERATIONS = ROOT / "ui" / "modules" / "operations" / "operations.css"
EQUIPMENT = ROOT / "ui" / "modules" / "equipment" / "equipment.css"
MAINTENANCE = ROOT / "ui" / "modules" / "maintenance" / "maintenance.css"


def rule_bodies(css: str, selector_pattern: str) -> list[str]:
    return re.findall(selector_pattern + r"\\s*\\{([^{}]*)\\}", css, flags=re.S)


def test_operations_focus_and_timeline_title_have_no_redundant_rules():
    css = OPERATIONS.read_text(encoding="utf-8")
    focus = rule_bodies(
        css,
        r"#operationsScreen\\s+\\.field\\s+input:hover,\\s*"
        r"#operationsScreen\\s+\\.field\\s+select:hover,\\s*"
        r"#operationsScreen\\s+\\.field\\s+input:focus,\\s*"
        r"#operationsScreen\\s+\\.field\\s+select:focus",
    )
    assert len(focus) == 1
    assert "border-color:#4d8dff" in focus[0]
    assert not rule_bodies(css, r"#operationsScreen \\.field input:focus,#operationsScreen \\.field select:focus")
    
    title = rule_bodies(css, r"#timelineModal\\s+\\.modalhead\\s+\\.ptitle")
    assert len(title) == 1
    for token in ("display:flex", "font-weight:700", "line-height:1", "white-space:nowrap"):
        assert token in title[0]


def test_equipment_row_actions_keep_layout_with_one_rule():
    css = EQUIPMENT.read_text(encoding="utf-8")
    rules = rule_bodies(css, r"#equipmentScreen\\s+\\.row-actions")
    assert len(rules) == 1
    for token in ("display:flex", "align-items:center", "justify-content:flex-start", "gap:4px", "white-space:nowrap", "overflow:visible"):
        assert token in rules[0]


def test_maintenance_timeline_title_keeps_complete_shared_header_style():
    css = MAINTENANCE.read_text(encoding="utf-8")
    title = rule_bodies(css, r"#maintenanceTimelineModal\\s+\\.modalhead\\s+\\.ptitle")
    assert len(title) == 1
    for token in ("display:flex", "font-weight:700", "line-height:1", "white-space:nowrap"):
        assert token in title[0]
    # Keep the compact timeline title/icon alignment intact.
    assert "#maintenanceTimelineModal .modalhead .ptitle .icon{flex:0 0 15px;width:15px;height:15px}" in css


def test_active_artifact_refreshes_only_affected_css_cache_keys():
    html = ARTIFACT.read_text(encoding="utf-8")
    for name in ("operations", "equipment", "maintenance"):
        assert f"../ui/modules/{name}/{name}.css?v=20261011-css-dedupe" in html
    assert "grid-template-columns:repeat(3,minmax(0,1fr))" in OPERATIONS.read_text(encoding="utf-8")
    assert "@media(max-width:560px)" in OPERATIONS.read_text(encoding="utf-8")
