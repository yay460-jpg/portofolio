import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
TABLE_CSS = ROOT / "ui" / "shared" / "table.css"

HEADER_SELECTORS = (
    "#operationsScreen .th",
    "#equipmentScreen .th",
    "#maintenanceScreen .th",
    "#issuesScreen .th",
    "#plansScreen .th",
    "#hseScreen .th",
    "#checkerScreen .checker-tr.th",
)
SPACING_SELECTORS = (
    "#operationsScreen .th",
    "#equipmentScreen .th",
    "#maintenanceScreen .th",
    "#issuesScreen .th",
    "#plansScreen .th",
    "#checkerScreen .checker-tr.th",
)


def read(path):
    return path.read_text(encoding="utf-8")


def compact(text):
    return re.sub(r"\s+", "", re.sub(r"/\*[\s\S]*?\*/", "", text))


def rule_body(css, selector):
    for match in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
        if compact(match.group(1).strip()) == compact(selector):
            return match.group(2)
    raise AssertionError(f"CSS rule not found: {selector}")


def test_shared_table_header_baseline_has_one_owner():
    css = read(TABLE_CSS)
    selector_group = ",".join(HEADER_SELECTORS)
    body = compact(rule_body(css, selector_group))
    for declaration in (
        "height:34px", "background:#12243a", "color:#8fa5bb",
        "font-size:8px", "text-transform:uppercase", "font-weight:600",
        "position:sticky", "top:0", "z-index:2",
    ):
        assert compact(declaration) in body


def test_shared_letter_spacing_preserves_the_original_header_difference():
    css = read(TABLE_CSS)
    base_body = compact(rule_body(css, ",".join(HEADER_SELECTORS)))
    spacing_body = compact(rule_body(css, ",".join(SPACING_SELECTORS)))
    assert "letter-spacing:.3px" not in base_body
    assert spacing_body.startswith("letter-spacing:.3px")


def test_duplicate_header_rules_are_removed_but_workfront_remains_specific():
    modules = {
        "operations/operations.css": "#operationsScreen .th",
        "equipment/equipment.css": "#equipmentScreen .th",
        "maintenance/maintenance.css": "#maintenanceScreen .th",
        "issues/issues.css": "#issuesScreen .th",
        "plans/plans.css": "#plansScreen .th",
        "hse/hse.css": "#hseScreen .th",
        "checker/checker.css": "#checkerScreen .checker-tr.th",
    }
    for relative, selector in modules.items():
        css = compact(read(ROOT / "ui" / "modules" / relative))
        assert compact(selector) + "{" not in css, (
            f"Shared table-header rule remains module-owned in {relative}"
        )
    workfront = compact(read(ROOT / "ui" / "modules" / "workfront" / "workfront.css"))
    assert ".wfgrid.th{height:34px;background:#12243a;color:#8fa5bb;font-size:8px;text-transform:uppercase}" in workfront


def test_shared_tablehead_geometry_preserves_only_required_local_flex_overrides():
    css = read(TABLE_CSS)
    group = (
        "#operationsScreen .tablehead,#equipmentScreen .tablehead,#workfrontScreen .tablehead,"
        "#maintenanceScreen .tablehead,#issuesScreen .tablehead,#plansScreen .tablehead,"
        "#hseScreen .tablehead,#checkerScreen .tablehead"
    )
    body = compact(rule_body(css, group))
    for declaration in (
        "height:40px", "display:flex", "align-items:center", "justify-content:space-between",
        "padding:0 12px", "border-bottom:1px solid #263e57",
    ):
        assert compact(declaration) in body
    modules = {
        "operations/operations.css": "#operationsScreen .tablehead",
        "equipment/equipment.css": "#equipmentScreen .tablehead",
        "workfront/workfront.css": "#workfrontScreen .tablehead",
        "maintenance/maintenance.css": "#maintenanceScreen .tablehead",
        "issues/issues.css": "#issuesScreen .tablehead",
        "plans/plans.css": "#plansScreen .tablehead",
        "hse/hse.css": "#hseScreen .tablehead",
        "checker/checker.css": "#checkerScreen .tablehead",
    }
    for relative, selector in modules.items():
        module_css = compact(read(ROOT / "ui" / "modules" / relative))
        if relative in ("maintenance/maintenance.css", "plans/plans.css"):
            assert compact(selector + "{flex:0 0 40px}") in module_css
        else:
            assert compact(selector + "{") not in module_css
    maintenance = read(ROOT / "ui" / "modules" / "maintenance" / "maintenance.css")
    plans = read(ROOT / "ui" / "modules" / "plans" / "plans.css")
    assert re.search(r"flex:\s*0\s+0\s+40px", maintenance)
    assert re.search(r"flex:\s*0\s+0\s+40px", plans)


def test_table_stylesheet_link_is_well_formed_and_loaded_after_modules():
    html = read(ARTIFACT)
    assert html.count('rel="stylesheet"') == len(re.findall(r'<link rel="stylesheet" href="[^"]+">', html))
    link = html.index("table.css?v=20261011-tablehead")
    for module in (
        "operations.css", "equipment.css", "workfront.css", "maintenance.css",
        "issues.css", "plans.css", "hse.css",
    ):
        assert html.index(module) < link
