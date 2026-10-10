import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
TABLE_CSS = ROOT / "ui" / "shared" / "table.css"

SCREENS = (
    "operationsScreen", "equipmentScreen", "workfrontScreen", "maintenanceScreen",
    "issuesScreen", "plansScreen", "hseScreen", "checkerScreen",
)
MODULE_CSS = {
    "operations/operations.css": "#operationsScreen",
    "equipment/equipment.css": "#equipmentScreen",
    "workfront/workfront.css": "#workfrontScreen",
    "maintenance/maintenance.css": "#maintenanceScreen",
    "issues/issues.css": "#issuesScreen",
    "plans/plans.css": "#plansScreen",
    "hse/hse.css": "#hseScreen",
    "checker/checker.css": "#checkerScreen",
}


def read(path):
    return path.read_text(encoding="utf-8")


def compact(text):
    return re.sub(r"\s+", "", re.sub(r"/\*[\s\S]*?\*/", "", text))


def rule_body(css, selector):
    for match in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
        if compact(match.group(1).strip()) == compact(selector):
            return match.group(2)
    raise AssertionError(f"CSS rule not found: {selector}")


def test_shared_tablepanel_geometry_has_one_owner():
    css = read(TABLE_CSS)
    group = ",".join(f"#{screen} .tablepanel" for screen in SCREENS)
    body = compact(rule_body(css, group))
    for declaration in (
        "position:relative", "flex:1 1 auto", "min-width:0", "min-height:0",
        "display:flex", "flex-direction:column", "margin-top:12px", "overflow:hidden",
    ):
        assert compact(declaration) in body


def test_repeated_tablepanel_visual_skin_is_shared_without_changing_members():
    css = read(TABLE_CSS)
    group = (
        "#workfrontScreen .tablepanel,#maintenanceScreen .tablepanel,"
        "#plansScreen .tablepanel,#hseScreen .tablepanel"
    )
    body = compact(rule_body(css, group))
    for declaration in (
        "background:#101f31", "border:1px solid #28425c", "border-radius:9px",
        "box-shadow:0 2px 9px #02081255",
    ):
        assert compact(declaration) in body


def test_module_tablepanel_rules_do_not_duplicate_shared_geometry_or_skin():
    for relative, screen in MODULE_CSS.items():
        css = compact(read(ROOT / "ui" / "modules" / relative))
        assert compact(f"{screen} .tablepanel" + "{") not in css, (
            f"Tablepanel styling remains module-owned in {relative}"
        )


def test_scroll_grid_baseline_is_shared_and_module_exceptions_remain():
    css = read(TABLE_CSS)
    group = ",".join(f"#{screen} .grid" for screen in SCREENS)
    body = compact(rule_body(css, group))
    for declaration in ("flex:1 1 auto", "min-width:0", "min-height:0", "overflow:auto"):
        assert compact(declaration) in body

    local_expectations = (
        ("operations/operations.css", "#operationsScreen .grid", "height:auto"),
        ("issues/issues.css", "#issuesScreen .grid", "height:auto"),
        ("plans/plans.css", "#plansScreen .grid", "width:100%"),
        ("plans/plans.css", "#plansScreen .grid", "height:auto"),
        ("hse/hse.css", "#hseScreen .grid", "height:auto"),
        ("checker/checker.css", "#checkerScreen .grid", "height:auto"),
    )
    for relative, selector, declaration in local_expectations:
        module_css = read(ROOT / "ui" / "modules" / relative)
        assert compact(declaration) in compact(rule_body(module_css, selector)), (
            f"Module-specific grid override lost in {relative}: {declaration}"
        )

    removed_local_rules = (
        ("equipment/equipment.css", "#equipmentScreen .grid"),
        ("workfront/workfront.css", "#workfrontScreen .grid"),
        ("maintenance/maintenance.css", "#maintenanceScreen .grid"),
    )
    for relative, selector in removed_local_rules:
        module_css = compact(read(ROOT / "ui" / "modules" / relative))
        assert compact(selector + "{") not in module_css


def test_shared_table_layout_asset_is_linked_after_module_stylesheets():
    html = read(ARTIFACT)
    assert html.count('rel="stylesheet"') == len(re.findall(r'<link rel="stylesheet" href="[^"]+">', html))
    link = html.index("table.css?v=20261011-table-layout")
    for module in (
        "operations.css", "equipment.css", "workfront.css", "maintenance.css",
        "issues.css", "plans.css", "hse.css",
    ):
        assert html.index(module) < link
