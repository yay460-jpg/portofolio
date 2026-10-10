import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
FORM_FIELD_CSS = ROOT / "ui" / "shared" / "form-field.css"
SHARED_SELECTORS = (
    "#operationsScreen .field input,#operationsScreen .field select",
    "#modal .field input,#modal .field select",
    "#equipmentScreen .field input,#equipmentScreen .field select",
    "#equipmentModal .field input,#equipmentModal .field select",
    "#workfrontScreen .field input,#workfrontScreen .field select",
    "#maintenanceScreen .field input,#maintenanceScreen .field select",
    "#maintenanceModal .field input,#maintenanceModal .field select",
    "#issuesScreen .field input,#issuesScreen .field select",
    "#plansScreen .field input, #plansScreen .field select",
    "#checkerScreen .field input, #checkerScreen .field select",
    "#checkerModal .field input, #checkerModal .field select",
)
MODULE_CSS = {
    "operations/operations.css": SHARED_SELECTORS[0:2],
    "equipment/equipment.css": SHARED_SELECTORS[2:4],
    "workfront/workfront.css": SHARED_SELECTORS[4:5],
    "maintenance/maintenance.css": SHARED_SELECTORS[5:7],
    "issues/issues.css": SHARED_SELECTORS[7:8],
    "plans/plans.css": SHARED_SELECTORS[8:9],
    "checker/checker.css": SHARED_SELECTORS[9:11],
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


def test_shared_form_control_geometry_has_one_owner():
    css = read(FORM_FIELD_CSS)
    expected = (
        "width:100%", "height:32px", "border:1px solid #29435d",
        "border-radius:7px", "background:#0c1b2c", "color:#dce8f5",
        "padding:0 9px", "font:inherit", "font-size:10px", "outline:none",
    )
    for selector in SHARED_SELECTORS:
        body = compact(rule_body(css, selector))
        for declaration in expected:
            assert compact(declaration) in body, f"Missing {declaration} from shared selector {selector}"


def test_shared_form_control_duplicates_are_removed_from_modules():
    for relative, selectors in MODULE_CSS.items():
        css = read(ROOT / "ui" / "modules" / relative)
        for selector in selectors:
            assert compact(selector) + "{" not in compact(css), (
                f"Shared single-line control rule remains in {relative}: {selector}"
            )


def test_module_specific_control_behavior_remains_local():
    operations = compact(read(ROOT / "ui" / "modules" / "operations" / "operations.css"))
    workfront = compact(read(ROOT / "ui" / "modules" / "workfront" / "workfront.css"))
    issues = compact(read(ROOT / "ui" / "modules" / "issues" / "issues.css"))
    hse = compact(read(ROOT / "ui" / "modules" / "hse" / "hse.css"))
    checker = compact(read(ROOT / "ui" / "modules" / "checker" / "checker.css"))
    assert compact("#operationsScreen .field input:focus") in operations
    assert compact("#workfrontModal .field input,#workfrontModal .field select{") in workfront
    assert compact("#issuesModal .field input,#issuesModal .field select,#issuesModal .field textarea{") in issues
    assert compact("#hseScreen .field input,#hseScreen .field select,#hseScreen .field textarea{") in hse
    assert compact("#checkerScreen .field input:focus") in checker


def test_form_field_stylesheet_link_is_well_formed_and_ordered():
    html = read(ARTIFACT)
    style_link_count = html.count('rel="stylesheet"')
    well_formed_links = len(re.findall(r'<link rel="stylesheet" href="[^"]+">', html))
    assert well_formed_links == style_link_count, "A stylesheet link is malformed"
    assert 'href=""' not in html, "An empty stylesheet href is present"
    assert html.count("<style>") == html.count("</style>"), "Inline stylesheet tags are unbalanced"
    assert html.count('href="../ui/shared/form-field.css?v=20261011-form-field"') == 1
    assert "field-label.css" not in html
    shared = html.index("form-field.css?v=20261011-form-field")
    for module in (
        "operations.css", "equipment.css", "workfront.css", "maintenance.css",
        "issues.css", "plans.css", "hse.css",
    ):
        assert html.index(module) < shared
