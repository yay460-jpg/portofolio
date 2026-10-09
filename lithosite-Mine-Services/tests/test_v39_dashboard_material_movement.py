from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html"
DASHBOARD_JS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.js").read_text(encoding="utf-8")
DASHBOARD_CSS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.css").read_text(encoding="utf-8")
HTML = ARTIFACT.read_text(encoding="utf-8")


def test_v39_dashboard_material_legend_shows_tons_and_retase_for_plotted_dates():
    assert "const chartDateKeys = new Set(chartDates.map(localDateKey))" in DASHBOARD_JS
    assert "const chartOperations = rawOperations.filter(function (row)" in DASHBOARD_JS
    assert "const chartDateKeys = new Set(chartDates.map(localDateKey))" in DASHBOARD_JS
    assert "const chartHaulingOperations = chartOperations.filter(function (row)" in DASHBOARD_JS
    assert "String(row.activity || '').trim().toLowerCase() === 'hauling'" in DASHBOARD_JS
    assert "const chartTonTotals = chartDates.reduce(function (sum, date)" in DASHBOARD_JS
    assert "item.name + ': ' + formatTotal(item.value) + ' ton'" in DASHBOARD_JS
    assert "totalStrong.textContent = formatTotal(combined) + ' ton';" in DASHBOARD_JS
    assert "'Retase: ' + displayedRetase + ' rit'" in DASHBOARD_JS
    assert "chartdot-retase" in DASHBOARD_CSS
    assert 'id="dashboardMaterialLegend"' in HTML


def test_v39_dashboard_material_view_detail_routes_to_operations():
    assert 'id="dashboardMaterialViewDetail"' in HTML
    assert "event.target.closest('#dashboardMaterialViewDetail')" in DASHBOARD_JS
    assert "global.LithositeShellNavigation.setScreen('Operations')" in DASHBOARD_JS
    assert "dashboard.js?v=20261112" in HTML
    assert "dashboard.css?v=20261110" in HTML
