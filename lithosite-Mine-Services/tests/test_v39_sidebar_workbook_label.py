from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v40-STAGE29.html"


def test_sidebar_labels_dashboard_screen_as_workbook_without_renaming_screen_route():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert '<div class="nav-item active" data-screen="Dashboard">' in html
    assert '<div class="nav-text">Workbook</div>' in html
    assert '<div class="nav-text">Dashboard</div>' not in html
    assert '<section id="dashboardScreen" class="dashboard-screen">' in html


def test_sidebar_workflow_order_uses_existing_screen_routes():
    html = ARTIFACT.read_text(encoding="utf-8")
    sidebar_start = html.index('<aside class="sidebar" id="side">')
    sidebar_end = html.index('</aside>', sidebar_start)
    sidebar = html[sidebar_start:sidebar_end]

    expected = [
        ('data-screen="Dashboard"', "Workbook"),
        ('data-screen="Work Front"', "1 Work Front"),
        ('data-screen="Plans"', "2 Target Plan"),
        ('data-screen="Equipment"', "3 Equipment"),
        ('data-screen="Operations"', "4 Operations"),
        ('data-screen="Maintenance"', "5 Maintenance"),
        ('data-screen="Issues"', "6 Issues"),
        ('data-screen="HSE"', "7 HSE"),
        ('data-screen="Reports"', "8 Reports &amp; KPI"),
    ]
    positions = []
    for route, label in expected:
        marker = sidebar.index(route)
        assert f'<div class="nav-text">{label}</div>' in sidebar[marker:marker + 300]
        positions.append(marker)

    assert positions == sorted(positions)
    assert sidebar.index('class="sep workflow-start-sep"') < positions[1]
    data_manage = sidebar.index('<div class="nav-item" title="Data management">')
    assert positions[-1] < sidebar.index('class="sep"', positions[-1]) < data_manage
    assert '<div class="nav-text">Data Manage</div>' in sidebar
