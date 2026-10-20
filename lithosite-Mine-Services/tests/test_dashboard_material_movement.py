from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html"
DASHBOARD_JS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.js").read_text(encoding="utf-8")
DASHBOARD_CSS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.css").read_text(encoding="utf-8")
BAR_JS = (ROOT / "ui" / "shared" / "graphicbar.js").read_text(encoding="utf-8")
BAR_CSS = (ROOT / "ui" / "shared" / "graphicbar.css").read_text(encoding="utf-8")
HTML = ARTIFACT.read_text(encoding="utf-8")


def test_dashboard_material_legend_shows_material_tonnage_and_haulage_retase():
    assert "const chartDateKeys = new Set(chartDates.map(localDateKey))" in DASHBOARD_JS
    assert "const chartOperations = rawOperations.filter(function (row)" in DASHBOARD_JS
    assert "String(row.status || '').trim().toUpperCase() !== 'VALIDATED'" in DASHBOARD_JS
    assert "if (String(row.activity || '').trim().toLowerCase() !== 'hauling') return;" in DASHBOARD_JS
    assert "if (activity !== 'hauling' && activity !== 'dumping') return;" not in DASHBOARD_JS
    assert "const chartHaulingOperations = chartOperations.filter(function (row)" not in DASHBOARD_JS
    assert "String(row.activity || '').trim().toLowerCase() === 'hauling'" in DASHBOARD_JS
    assert "const chartMaterialTotals = chartDates.reduce(function (sum, date)" in DASHBOARD_JS
    assert "legendItems.push({" in DASHBOARD_JS
    assert "value: formatTotal(chartMaterialTotals[item.name]) + ' ton'" in DASHBOARD_JS
    assert "label.className = 'chartkey-name';" in BAR_JS
    assert "value.className = 'chartkey-value';" in BAR_JS
    assert "totalText: formatTotal(classifiedTotal) + ' ton'" in DASHBOARD_JS
    assert "formatTotal(chartRetase) + ' rit'" in DASHBOARD_JS
    assert "label: 'Retase'" in DASHBOARD_JS
    assert "chartdot-retase" in DASHBOARD_CSS
    assert 'id="dashboardMaterialLegend"' in HTML
    assert '<span class="chartdot chartdot-ore"></span>' not in HTML
    assert '<span class="chartkey"><i class="chartdot chartdot-ore"></i><span class="chartkey-name">Ore</span>' in HTML
    assert '<span class="chartkey"><i class="chartdot chartdot-blue"></i>Hauling</span>' not in HTML
    assert '<span class="chartkey"><i class="chartdot chartdot-orange"></i>Dumping</span>' not in HTML


def test_dashboard_material_movement_uses_four_material_categories():
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
        assert color_class in BAR_CSS


def test_dashboard_shows_sr_as_coming_soon_without_calculation():
    assert "legendItems.push({" in DASHBOARD_JS
    assert "'S/R'," in DASHBOARD_JS
    assert "value: 'Coming Soon'" in DASHBOARD_JS
    assert "chartkey-coming-soon" in BAR_CSS
    assert "chartdot-sr" in BAR_CSS
    assert "const strippingRatio =" not in DASHBOARD_JS
    assert "OB + Top Soil" not in DASHBOARD_JS


def test_dashboard_material_view_detail_routes_to_operations():
    assert 'id="dashboardMaterialViewDetail"' in HTML
    assert "event.target.closest('#dashboardMaterialViewDetail')" in DASHBOARD_JS
    assert "global.LithositeShellNavigation.setScreen('Operations')" in DASHBOARD_JS
    assert "dashboard.js?v=20261012-plan-actual" in HTML
    assert "dashboard.css?v=20261115" in HTML


def test_material_movement_legend_is_raised_from_panel_bottom():
    assert "#dashboardScreen .chartnote{position:absolute;right:8px;top:48%" in DASHBOARD_CSS
    assert "graphicbar.css?v=" in HTML


def test_material_movement_date_labels_sit_below_the_x_axis():
    assert ".graphic-bar--material {" in BAR_CSS
    assert "height: calc(100% - 16px);" in BAR_CSS
    assert "bottom: 18px;" in BAR_CSS
    assert "border-bottom: 1px solid #2b425a;" in BAR_CSS
    assert "flex: 0 0 18px;" in BAR_CSS
    assert "z-index: 2;" in BAR_CSS
    assert "dashboard.css?v=20261115" in HTML


def test_material_movement_legend_is_raised_and_plot_uses_more_height():
    assert "#dashboardScreen .chartnote{position:absolute;right:8px;top:48%" in DASHBOARD_CSS
    assert "height: calc(100% - 16px);" in BAR_CSS
    assert "dashboard.css?v=20261115" in HTML


def test_material_movement_legend_aligns_names_and_values_in_separate_columns():
    assert "function renderMaterialMovement(options)" in BAR_JS
    assert "label.className = 'chartkey-name';" in BAR_JS
    assert "value.className = 'chartkey-value';" in BAR_JS
    assert "#dashboardScreen .chartkey-name { flex: 1; min-width: 0; }" in BAR_CSS
    assert "font-variant-numeric: tabular-nums;" in BAR_CSS
    assert "label: 'Retase'" in DASHBOARD_JS
    assert "label: 'S/R'" in DASHBOARD_JS
    assert "dashboard.js?v=20261012-plan-actual" in HTML
    assert "dashboard.css?v=20261115" in HTML
