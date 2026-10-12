from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

def test_stage36_console_policy_set_surface():
    html = read("Artifacts/Mine-Services-Operations.html")
    reports = read("ui/modules/reports/reports.js")
    foundation = read("ui/modules/reports/kpi-foundation.js")

    assert 'id="reportsConsoleModal"' in html
    assert 'id="reportsTimeBaseline"' in html
    assert 'id="reportsEUDenominator"' in html
    assert 'id="reportsEffectiveTimeRule"' in html
    assert 'id="reportsResetConsole"' in html
    assert "Apply Policy Set" in html

    assert "TIME_BASELINES" in reports
    assert "EU_DENOMINATOR_OPTIONS" in reports
    assert "EFFECTIVE_RULE_OPTIONS" in reports
    assert "renderConsolePolicy" in reports
    assert "applyConsoleButton" in reports
    assert "applyConsoleButton.onclick=applyConsole" in reports

    assert "TIME_BASELINES" in foundation
    assert "effectiveTimeRule" in foundation
    assert "EU-EFFECTIVE-OVER-SCHEDULED" in foundation
    assert "EU-EFFECTIVE-OVER-AVAILABLE" in foundation
    assert "STANDARD_CYCLE" in foundation
    assert "PURE_EFFECTIVE" in foundation

def test_stage36_console_contains_policy_only():
    html = read("Artifacts/Mine-Services-Operations.html")
    start = html.index('<div id="reportsConsoleModal"')
    end = html.index('<div id="reportsHistoryModal"', start)
    modal = html[start:end]

    assert 'id="reportsTimeBaseline"' in modal
    assert 'id="reportsEUDenominator"' in modal
    assert 'id="reportsEffectiveTimeRule"' in modal
    assert 'id="reportsActivePolicy"' in modal
    assert 'id="reportsTimelineEvidence"' not in modal
    assert 'id="reportsDowntimeSummary"' not in modal
    assert 'id="reportsEUEvidence"' not in modal

def test_stage36_console_reset_restores_default_selection():
    reports = read("ui/modules/reports/reports.js")
    assert "DEFAULT_POLICY.baseline.baseline_id" in reports
    assert "DEFAULT_POLICY.euDenominator" in reports
    assert "DEFAULT_POLICY.effectiveTimeRule" in reports
    assert "resetConsolePolicy" in reports

def test_stage36_equipment_list_owns_scroll_without_visible_scrollbar():
    css = read("ui/modules/reports/reports.css")
    assert "#reportsScreen .kpi-panel{display:flex;flex-direction:column;min-height:0;overflow:hidden}" in css
    # The list is a content container; the dedicated parent owns vertical scrolling.
    assert "#reportsScreen .equipment-kpi-list{flex:1 1 auto;min-height:0;max-height:none;scrollbar-width:none}" in css
    assert "#reportsScreen .equipment-kpi-scroll{flex:1 1 0;min-height:0;overflow-y:auto;overflow-x:hidden;" in css
    assert "#reportsScreen .equipment-kpi-list::-webkit-scrollbar{width:0;height:0;display:none}" in css

def test_stage36_dedicated_equipment_scroll_viewport():
    html = read("Artifacts/Mine-Services-Operations.html")
    css = read("ui/modules/reports/reports.css")
    reports = read("ui/modules/reports/reports.js")

    assert '<div class="equipment-kpi-scroll"><div id="equipmentKpiRows"' in html
    assert '#reportsScreen .equipment-kpi-scroll{flex:1 1 0;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;' in css
    assert '#reportsScreen .equipment-kpi-scroll::-webkit-scrollbar{width:0;height:0;display:none}' in css
    assert "equipmentScroll.addEventListener('wheel'" in reports
    assert "e.preventDefault()" in reports

def test_stage36_equipment_unit_column():
    html = read("Artifacts/Mine-Services-Operations.html")
    reports = read("ui/modules/reports/reports.js")
    foundation = read("ui/modules/reports/kpi-foundation.js")
    css = read("ui/modules/reports/reports.css")

    assert '<span>Equipment</span><span>Date</span><span>Measurement</span><span>Scheduled h</span>' in html
    assert 'class="eq-date"' in reports
    assert 'class="eq-unit"' in reports
    assert 'unitNo:row.unit_no' in foundation
    assert '.eq-date' in css
    assert '.eq-unit' in css

def test_stage36_console_policy_persists_across_reload():
    reports = read("ui/modules/reports/reports.js")
    assert "POLICY_STORAGE_KEY" in reports
    assert "function readPolicyStorage()" in reports
    assert "storage?.getItem(POLICY_STORAGE_KEY)" in reports
    assert "global.localStorage.setItem(POLICY_STORAGE_KEY" in reports
    assert "state.policy=loadStoredPolicy()" in reports
    assert "persistPolicy(state.policy)" in reports
    assert "No runtime policy changes occur until Apply Policy Set." in reports


def test_stage36_console_reset_warns_before_replacing_policy_selection():
    reports = read("ui/modules/reports/reports.js")
    assert "global.confirm('Reset Policy Set to the project default?" in reports
    assert "samePolicy(state.policy,DEFAULT_POLICY)" in reports


def test_kpi_policy_storage_uses_version_neutral_key_and_legacy_migration():
    reports = read("ui/modules/reports/reports.js")
    dashboard = read("ui/modules/dashboard/dashboard.js")

    assert "const POLICY_STORAGE_KEY='lithosite.mine-services.kpi-policy';" in reports
    assert "const LEGACY_POLICY_STORAGE_PATTERN=" in reports
    assert "function legacyPolicyKeys(storage)" in reports
    assert "function readPolicyStorage()" in reports
    assert "if(stored.legacy)persistPolicy(policy);" in reports

    assert "const KPI_POLICY_STORAGE_KEY = 'lithosite.mine-services.kpi-policy';" in dashboard
    assert "const LEGACY_KPI_POLICY_STORAGE_PATTERN =" in dashboard
    assert "function legacyKpiPolicyKeys(storage)" in dashboard
    assert "storage.setItem(KPI_POLICY_STORAGE_KEY, raw)" in dashboard

    assert "lithosite.mine-services.v36.kpi-policy" not in reports
    assert "lithosite.mine-services.v36.kpi-policy" not in dashboard
