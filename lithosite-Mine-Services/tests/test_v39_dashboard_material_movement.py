from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html"
DASHBOARD_JS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.js").read_text(encoding="utf-8")
DASHBOARD_CSS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.css").read_text(encoding="utf-8")
HTML = ARTIFACT.read_text(encoding="utf-8")


def test_v39_dashboard_material_legend_shows_material_tonnage_and_haulage_retase():
    assert "const chartDateKeys = new Set(chartDates.map(localDateKey))" in DASHBOARD_JS
    assert "const chartOperations = rawOperations.filter(function (row)" in DASHBOARD_JS
    assert "String(row.status || '').trim().toUpperCase() !== 'VALIDATED'" in DASHBOARD_JS
    assert "const chartHaulingOperations = chartOperations.filter(function (row)" in DASHBOARD_JS
    assert "String(row.activity || '').trim().toLowerCase() === 'hauling'" in DASHBOARD_JS
    assert "const chartMaterialTotals = chartDates.reduce(function (sum, date)" in DASHBOARD_JS
    assert "item.name + ': ' + formatTotal(chartMaterialTotals[item.name]) + ' ton'" in DASHBOARD_JS
    assert "totalStrong.textContent = formatTotal(classifiedTotal) + ' ton';" in DASHBOARD_JS
    assert "'Retase: ' + formatTotal(chartRetase) + ' rit'" in DASHBOARD_JS
    assert "chartdot-retase" in DASHBOARD_CSS
    assert 'id="dashboardMaterialLegend"' in HTML


def test_v39_dashboard_material_movement_uses_four_material_categories():
    for name in ("Ore", "OB", "Quarry", "Top Soil"):
        assert "{ name: '" + name + "'" in DASHBOARD_JS
        assert name + ': ' in DASHBOARD_JS
    assert "if (material === 'ob' || material === 'overburden') return 'OB';" in DASHBOARD_JS
    assert "if (material === 'topsoil' || material === 'top soil') return 'Top Soil';" in DASHBOARD_JS
    for color_class in (
        "chart-material-ore", "chart-material-ob",
        "chart-material-quarry", "chart-material-topsoil",
        "chartdot-ore", "chartdot-ob", "chartdot-quarry", "chartdot-topsoil"
    ):
        assert color_class in DASHBOARD_CSS


def test_v39_dashboard_shows_sr_as_coming_soon_without_calculation():
    assert "S/R: Coming Soon" in DASHBOARD_JS
    assert "chartkey-coming-soon" in DASHBOARD_JS
    assert "chartdot-sr" in DASHBOARD_CSS
    assert "const strippingRatio =" not in DASHBOARD_JS
    assert "OB + Top Soil" not in DASHBOARD_JS


def test_v39_dashboard_material_view_detail_routes_to_operations():
    assert 'id="dashboardMaterialViewDetail"' in HTML
    assert "event.target.closest('#dashboardMaterialViewDetail')" in DASHBOARD_JS
    assert "global.LithositeShellNavigation.setScreen('Operations')" in DASHBOARD_JS
    assert "dashboard.js?v=20261113" in HTML
    assert "dashboard.css?v=20261111" in HTML
