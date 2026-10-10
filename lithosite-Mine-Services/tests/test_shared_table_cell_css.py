import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
MODULE_RULES = {
    "operations/operations.css": {
        "#operationsScreen .cell": r"padding\s*:\s*0\s+9px",
        "#timelineModal .timeline-tr .cell": r"padding\s*:\s*0\s+8px",
    },
    "equipment/equipment.css": {"#equipmentScreen .cell": r"padding\s*:\s*0\s+9px"},
    "workfront/workfront.css": {".wfcell": r"padding\s*:\s*0\s+9px"},
    "maintenance/maintenance.css": {"#maintenanceScreen .cell": r"padding\s*:\s*0\s+9px"},
    "issues/issues.css": {"#issuesScreen .cell": r"padding\s*:\s*0\s+9px"},
    "plans/plans.css": {"#plansScreen .cell": r"padding\s*:\s*0\s+8px"},
    "hse/hse.css": {"#hseScreen .cell": r"padding\s*:\s*0\s+6px"},
}
SHARED_SELECTOR = (
    "#operationsScreen .cell,#equipmentScreen .cell,#maintenanceScreen .cell,"
    "#issuesScreen .cell,#plansScreen .cell,#hseScreen .cell,"
    "#workfrontScreen .wfcell,#timelineModal .timeline-tr .cell"
)
TEXT_CLIP_DECLARATIONS = ("overflow:hidden", "text-overflow:ellipsis", "white-space:nowrap")


def read(path):
    return path.read_text(encoding="utf-8")


def compact(text):
    return re.sub(r"\s+", "", re.sub(r"/\*[\s\S]*?\*/", "", text))


def rule_body(css, selector):
    for match in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
        if compact(match.group(1).strip()) == compact(selector):
            return match.group(2)
    raise AssertionError(f"CSS rule not found: {selector}")


def test_active_shell_owns_shared_cell_text_clipping():
    html = compact(read(ARTIFACT))
    selector = compact(SHARED_SELECTOR)
    rules = [m for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", html) if compact(m.group(1)) == selector]
    assert len(rules) == 1, "Shared table-cell clipping should have one owner in active shell"
    body = compact(rules[0].group(2))
    for declaration in TEXT_CLIP_DECLARATIONS:
        assert declaration in body


def test_module_cell_rules_keep_padding_but_drop_duplicate_clipping():
    for relative, expected_rules in MODULE_RULES.items():
        css = read(ROOT / "ui" / "modules" / relative)
        for selector, expected_padding in expected_rules.items():
            body = rule_body(css, selector)
            assert re.search(expected_padding, body), (
                f"Module-specific cell padding changed in {relative}: {selector}"
            )
            compact_body = compact(body)
            for declaration in TEXT_CLIP_DECLARATIONS:
                assert declaration not in compact_body, (
                    f"Duplicate text-clipping declaration remains in {relative}: {selector}"
                )


def test_cell_layout_geometry_remains_module_owned():
    expectations = (
        ("operations/operations.css", "#operationsScreen .cell", r"padding\s*:\s*0\s+9px"),
        ("equipment/equipment.css", "#equipmentScreen .cell", r"padding\s*:\s*0\s+9px"),
        ("workfront/workfront.css", ".wfcell", r"padding\s*:\s*0\s+9px"),
        ("maintenance/maintenance.css", "#maintenanceScreen .cell", r"padding\s*:\s*0\s+9px"),
        ("issues/issues.css", "#issuesScreen .cell", r"padding\s*:\s*0\s+9px"),
        ("plans/plans.css", "#plansScreen .cell", r"padding\s*:\s*0\s+8px"),
        ("hse/hse.css", "#hseScreen .cell", r"padding\s*:\s*0\s+6px"),
    )
    for relative, selector, padding_pattern in expectations:
        css = read(ROOT / "ui" / "modules" / relative)
        body = rule_body(css, selector)
        assert re.search(padding_pattern, body)
    operations = read(ROOT / "ui" / "modules" / "operations" / "operations.css")
    assert "min-width:1000px" in operations
    equipment = read(ROOT / "ui" / "modules" / "equipment" / "equipment.css")
    assert "min-width:1300px" in equipment
