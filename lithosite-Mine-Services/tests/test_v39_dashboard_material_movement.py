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
    assert "return { Ore: 0, OB: 0, Quarry: 0, 'Top Soil': 0 };" in DASHBOARD_JS
    assert "if (material === 'ob' || material === 'overburden') return 'OB';" in DASHBOARD_JS
    assert "if (material === 'topsoil' || material === 'top soil') return 'Top Soil';" in DASHBOARD_JS
    for color_class in (
        "chart-material-ore", "chart-material-ob",
        "chart-material-quarry", "chart-material-topsoil",
        "chartdot-ore", "chartdot-ob", "chartdot-quarry", "chartdot-topsoil"
    ):
        assert color_class in DASHBOARD_CSS


def test_v39_dashboard_shows_sr_as_coming_soon_without_calculation():
    assert "appendLegendRow(" in DASHBOARD_JS
    assert "'S/R'," in DASHBOARD_JS
    assert "'Coming Soon'," in DASHBOARD_JS
    assert "chartkey-coming-soon" in DASHBOARD_JS
    assert "chartdot-sr" in DASHBOARD_CSS
    assert "const strippingRatio =" not in DASHBOARD_JS
    assert "OB + Top Soil" not in DASHBOARD_JS


def test_v39_dashboard_material_view_detail_routes_to_operations():
    assert 'id="dashboardMaterialViewDetail"' in HTML
    assert "event.target.closest('#dashboardMaterialViewDetail')" in DASHBOARD_JS
    assert "global.LithositeShellNavigation.setScreen('Operations')" in DASHBOARD_JS
    assert "dashboard.js?v=20261114" in HTML
    assert "dashboard.css?v=20261114" in HTML


def test_v39_material_movement_legend_is_raised_from_panel_bottom():
    assert "#dashboardScreen .chartnote{position:absolute;right:8px;top:48%;transform:translateY(-50%)" in DASHBOARD_CSS
    assert "dashboard.css?v=20261114" in HTML


def test_v39_material_movement_date_labels_sit_below_the_x_axis():
    assert "#dashboardScreen .bars{position:relative;border-bottom:0}" in DASHBOARD_CSS
    assert "bottom:18px;" in DASHBOARD_CSS
    assert "border-bottom:1px solid #2b425a;" in DASHBOARD_CSS
    assert "dashboard.css?v=20261114" in HTML


def test_v39_material_movement_legend_aligns_names_and_values_in_separate_columns():
    assert "function appendLegendRow(name, value, colorClass, extraClass)" in DASHBOARD_JS
    assert "label.className = 'chartkey-name';" in DASHBOARD_JS
    assert "metric.className = 'chartkey-value';" in DASHBOARD_JS
    assert "#dashboardScreen .chartkey-name{flex:1;min-width:0}" in DASHBOARD_CSS
    assert "#dashboardScreen .chartkey-value{margin-left:4px;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}" in DASHBOARD_CSS
    assert "appendLegendRow(\n      'Retase'," in DASHBOARD_JS
    assert "appendLegendRow(\n      'S/R'," in DASHBOARD_JS
    assert "dashboard.js?v=20261114" in HTML
    assert "dashboard.css?v=20261114" in HTML
