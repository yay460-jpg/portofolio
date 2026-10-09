from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html"


def test_sidebar_labels_dashboard_screen_as_workbook_without_renaming_screen_route():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert '<div class="nav-item active" data-screen="Dashboard">' in html
    assert '<div class="nav-text">Workbook</div>' in html
    assert '<div class="nav-text">Dashboard</div>' not in html
    assert '<section id="dashboardScreen" class="dashboard-screen">' in html
