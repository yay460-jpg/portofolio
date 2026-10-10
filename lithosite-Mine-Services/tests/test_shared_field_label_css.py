import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
FIELD_LABEL_CSS = ROOT / "ui" / "shared" / "form-field.css"
MODULE_CSS = {
    "operations/operations.css": ("#operationsScreen .field label", "#modal .field label"),
    "equipment/equipment.css": ("#equipmentScreen .field label", "#equipmentModal .field label"),
    "workfront/workfront.css": ("#workfrontScreen .field label", "#workfrontModal .field label"),
    "maintenance/maintenance.css": ("#maintenanceScreen .field label", "#maintenanceModal .field label"),
    "issues/issues.css": ("#issuesScreen .field label", "#issuesModal .field label"),
    "plans/plans.css": ("#plansScreen .field label",),
    "hse/hse.css": ("#hseScreen .field label",),
    "checker/checker.css": ("#checkerScreen .field label", "#checkerModal .field label"),
}


def read(path):
    return path.read_text(encoding="utf-8")


def test_shared_field_label_stylesheet_owns_common_typography():
    css = read(FIELD_LABEL_CSS)
    for selector in (
        "#operationsScreen .field label",
        "#modal .field label",
        "#equipmentScreen .field label",
        "#equipmentModal .field label",
        "#workfrontScreen .field label",
        "#workfrontModal .field label",
        "#maintenanceScreen .field label",
        "#maintenanceModal .field label",
        "#issuesScreen .field label",
        "#issuesModal .field label",
        "#plansScreen .field label",
        "#hseScreen .field label",
        "#checkerScreen .field label",
        "#checkerModal .field label",
    ):
        assert selector in css
    for declaration in (
        "font-size:8.5px",
        "color:#8fa5bb",
        "text-transform:uppercase",
        "font-weight:600",
        "letter-spacing:.4px",
        "margin-bottom:5px",
    ):
        assert declaration in css


def test_module_field_label_duplicates_are_removed():
    for relative, selectors in MODULE_CSS.items():
        css = read(ROOT / "ui" / "modules" / relative)
        for selector in selectors:
            escaped = re.escape(selector)
            compact_css = re.sub(r"\s+", "", css)
            compact_selector = re.sub(r"\s+", "", selector)
            assert f"{compact_selector}{{" not in compact_css, (
                f"Field-label typography remains module-owned in {relative}: {selector}"
            )


def test_reports_filter_label_keeps_its_special_weight():
    reports = read(ROOT / "ui" / "modules" / "reports" / "reports.css")
    assert "#reportsScreen .filters .field label" in reports
    assert "font-weight:700" in reports


def test_shared_field_label_stylesheet_loads_after_module_styles():
    html = read(ARTIFACT)
    shared = html.index("form-field.css?v=20261011-form-field")
    # Checker CSS is checked for duplicate rules above; it is not a direct stylesheet link in this active shell.
    for module in (
        "operations.css", "equipment.css", "workfront.css", "maintenance.css",
        "issues.css", "plans.css", "hse.css",
    ):
        assert html.index(module) < shared
    assert html.index("screen-header.css") < shared
