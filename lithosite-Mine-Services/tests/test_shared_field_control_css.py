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
)
MODULE_CSS = {
    "operations/operations.css": SHARED_SELECTORS[0:2],
    "equipment/equipment.css": SHARED_SELECTORS[2:4],
    "workfront/workfront.css": SHARED_SELECTORS[4:5],
    "maintenance/maintenance.css": SHARED_SELECTORS[5:7],
    "issues/issues.css": SHARED_SELECTORS[7:8],
    "plans/plans.css": SHARED_SELECTORS[8:9],
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
    selector_group = ",".join(SHARED_SELECTORS)
    body = compact(rule_body(css, selector_group))
    expected = (
        "width:100%", "height:32px", "border:1px solid #29435d",
        "border-radius:7px", "background:#0c1b2c", "color:#dce8f5",
        "padding:0 9px", "font:inherit", "font-size:10px", "outline:none",
    )
    for declaration in expected:
        assert compact(declaration) in body, f"Missing shared declaration: {declaration}"


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
    assert compact("#operationsScreen .field input:focus") in operations
    assert compact("#workfrontModal .field input,#workfrontModal .field select{") in workfront
    assert compact("#issuesModal .field input,#issuesModal .field select,#issuesModal .field textarea{") in issues
    assert compact("#hseScreen .field input,#hseScreen .field select,#hseScreen .field textarea{") in hse


def test_form_field_stylesheet_link_is_well_formed_and_ordered():
    html = read(ARTIFACT)
    style_link_count = html.count('rel="stylesheet"')
    well_formed_links = len(re.findall(r'<link rel="stylesheet" href="[^"]+">', html))
    assert well_formed_links == style_link_count, "A stylesheet link is malformed"
    assert 'href=""' not in html, "An empty stylesheet href is present"
    assert len(re.findall(r"<style\b[^>]*>", html)) == html.count("</style>"), "Inline stylesheet tags are unbalanced"
    assert not re.search(r"<style>\s*</style>", html), "An empty style block is present"
    assert "ImportLock" not in html
    assert not re.search(r"\bV\d+(?:\.\d+)*\s+LOCKED\b", html, re.IGNORECASE)
    assert '<style id="navigation-disabled-state">' in html
    assert html.count('href="../ui/shared/form-field.css') == 1
    assert "field-label.css" not in html
    shared = html.index("form-field.css")
    for module in (
        "operations.css", "equipment.css", "workfront.css", "maintenance.css",
        "issues.css", "plans.css", "hse.css",
    ):
        assert html.index(module) < shared



def test_native_date_and_time_picker_icons_have_dark_theme_contrast():
    css = read(FORM_FIELD_CSS)
    compact_css = compact(css)
    assert 'input[type="date"],input[type="time"],input[type="datetime-local"]{color-scheme:dark!important;accent-color:#60a5fa;}' in compact_css
    assert 'input[type="date"]::-webkit-calendar-picker-indicator,input[type="time"]::-webkit-calendar-picker-indicator,input[type="datetime-local"]::-webkit-calendar-picker-indicator{filter:brightness(0)invert(1)!important;opacity:1!important;cursor:pointer;}' in compact_css


def test_active_entrypoint_loads_picker_contrast_stylesheet():
    entrypoint = read(ARTIFACT)
    expected = 'form-field.css'
    assert expected in read(ARTIFACT)
    assert expected in entrypoint
