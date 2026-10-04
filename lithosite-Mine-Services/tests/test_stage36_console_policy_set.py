from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

def test_stage36_console_policy_set_surface():
    html = read("Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v36-STAGE25.html")
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
    html = read("Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v36-STAGE25.html")
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
