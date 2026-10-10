import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
FIELD_LABEL_CSS = ROOT / "ui" / "shared" / "field-label.css"
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
            assert not re.search(rf"(?m)^\s*{escaped}\s*\{{", css), (
                f"Field-label typography remains module-owned in {relative}: {selector}"
            )


def test_reports_filter_label_keeps_its_special_weight():
    reports = read(ROOT / "ui" / "modules" / "reports" / "reports.css")
    assert "#reportsScreen .filters .field label" in reports
    assert "font-weight:700" in reports


def test_shared_field_label_stylesheet_loads_after_module_styles():
    html = read(ARTIFACT)
    shared = html.index("field-label.css?v=20261011-shared-field-label")
    for module in (
        "operations.css", "equipment.css", "workfront.css", "maintenance.css",
        "issues.css", "plans.css", "hse.css", "checker.css",
    ):
        assert html.index(module) < shared
    assert html.index("screen-header.css") < shared
