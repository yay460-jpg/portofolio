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


def test_repeated_surface_visual_skin_is_shared_without_changing_members():
    css = read(TABLE_CSS)
    group = (
        "#workfrontScreen .tablepanel,#maintenanceScreen .tablepanel,"
        "#plansScreen .tablepanel,#hseScreen .tablepanel,"
        "#workfrontScreen .filters,#maintenanceScreen .filters,"
        "#plansScreen .filters,#hseScreen .filters"
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
    link = html.index("table.css?v=20261011-filter-layout")
    for module in (
        "operations.css", "equipment.css", "workfront.css", "maintenance.css",
        "issues.css", "plans.css", "hse.css",
    ):
        assert html.index(module) < link


def test_shared_filter_bar_geometry_has_one_owner():
    css = read(TABLE_CSS)
    group = ",".join(f"#{screen} .filters" for screen in SCREENS)
    body = compact(rule_body(css, group))
    for declaration in ("display:grid", "gap:8px", "align-items:end", "padding:12px", "flex:0 0 auto"):
        assert compact(declaration) in body


def test_filter_columns_and_module_exceptions_remain_local():
    templates = (
        ("operations/operations.css", "grid-template-columns:repeat(8,minmax(0,1fr)) auto"),
        ("equipment/equipment.css", "grid-template-columns:1.15fr 1.15fr 1.15fr 1fr 1fr 1fr auto"),
        ("workfront/workfront.css", "grid-template-columns:1.2fr 1.2fr 1fr 1fr 1fr auto"),
        ("maintenance/maintenance.css", "grid-template-columns:repeat(5,minmax(0,1fr)) auto"),
        ("issues/issues.css", "grid-template-columns:1.1fr repeat(5,minmax(0,1fr)) auto"),
        ("plans/plans.css", "grid-template-columns:1fr 1fr 1.1fr 1.1fr 1fr auto"),
        ("hse/hse.css", "grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr auto"),
        ("checker/checker.css", "grid-template-columns:repeat(4,minmax(0,1fr)) auto"),
    )
    for relative, template in templates:
        module_css = compact(read(ROOT / "ui" / "modules" / relative))
        assert compact(template) in module_css, f"Unique filter columns changed in {relative}"

    for relative in ("operations/operations.css", "issues/issues.css", "checker/checker.css"):
        module_css = compact(read(ROOT / "ui" / "modules" / relative))
        assert "min-height:0" in module_css


def test_module_filter_rules_do_not_duplicate_shared_geometry_or_surface_skin():
    module_screens = {
        "operations/operations.css":"#operationsScreen .filters",
        "equipment/equipment.css":"#equipmentScreen .filters",
        "workfront/workfront.css":"#workfrontScreen .filters",
        "maintenance/maintenance.css":"#maintenanceScreen .filters",
        "issues/issues.css":"#issuesScreen .filters",
        "plans/plans.css":"#plansScreen .filters",
        "hse/hse.css":"#hseScreen .filters",
        "checker/checker.css":"#checkerScreen .filters",
    }
    shared_declarations = (
        "display:grid", "gap:8px", "align-items:end", "padding:12px", "flex:0 0 auto",
        "border:1px solid#28425c", "border-radius:9px", "background:#101f31",
        "box-shadow:02px9px#02081255",
    )
    for relative, selector in module_screens.items():
        module_css = read(ROOT / "ui" / "modules" / relative)
        rules = [
            match.group(2) for match in re.finditer(r"([^{}]+)\{([^{}]*)\}", module_css)
            if compact(match.group(1).strip()) == compact(selector)
        ]
        for body in rules:
            normalized = compact(body)
            for declaration in shared_declarations:
                assert compact(declaration) not in normalized, (
                    f"Shared filter declaration remains module-owned in {relative}: {declaration}"
                )
