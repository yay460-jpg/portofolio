from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
SHARED_HEADER = ROOT / "ui" / "shared" / "screen-header.css"

MODULE_STYLESHEETS = [
    ROOT / "ui" / "modules" / "equipment" / "equipment.css",
    ROOT / "ui" / "modules" / "operations" / "operations.css",
    ROOT / "ui" / "modules" / "plans" / "plans.css",
    ROOT / "ui" / "modules" / "issues" / "issues.css",
    ROOT / "ui" / "modules" / "hse" / "hse.css",
    ROOT / "ui" / "modules" / "checker" / "checker.css",
]


def test_shared_stylesheet_owns_common_screen_heading_rules():
    css = SHARED_HEADER.read_text(encoding="utf-8")
    assert ".head{" in css
    assert ".title h1{" in css
    assert ".title p{" in css
    assert "background:linear-gradient(90deg,#60a5fa,#dbeafe 58%,#fff)" in css
    assert "@media(max-width:1400px)" in css
    assert ".title h1{font-size:20px}" in css


def test_module_styles_do_not_duplicate_shared_heading_typography():
    for path in MODULE_STYLESHEETS:
        css = path.read_text(encoding="utf-8")
        assert ".title h1" not in css, f"Base title typography remains duplicated in {path.name}"
        assert ".title p" not in css, f"Base title subtitle typography remains duplicated in {path.name}"

    # Dashboard intentionally changes only subtitle color for its data-heavy context.
    dashboard = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.css").read_text(encoding="utf-8")
    assert "#dashboardScreen .title p{color:#b9c9d9}" in dashboard


def test_shared_heading_styles_are_removed_from_inline_shell_css():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/shared/screen-header.css?v=20261011-shared-header" in html
    assert ".head{height:42px;display:flex;justify-content:space-between}" not in html
    assert ".title h1{margin:0;font-size:21px;line-height:24px" not in html
    assert ".title p{margin:2px 0;color:var(--muted);font-size:11px}" not in html
    assert ".boundary{padding:18px}.title h1{font-size:20px}.ptitle" not in html


def test_module_specific_header_geometry_remains_owned_by_each_layout():
    for relative, selector in (
        ("equipment/equipment.css", "#equipmentScreen .head{height:48px"),
        ("operations/operations.css", "#operationsScreen .head{height:48px"),
        ("plans/plans.css", "#plansScreen .head {"),
        ("issues/issues.css", "#issuesScreen .head{height:48px"),
        ("hse/hse.css", "#hseScreen .head{height:48px"),
        ("maintenance/maintenance.css", "#maintenanceScreen .head{height:48px"),
    ):
        css = (ROOT / "ui" / "modules" / relative).read_text(encoding="utf-8")
        assert selector in css
