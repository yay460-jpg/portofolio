from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui/modules/plans/plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui/modules/plans/plans.css").read_text(encoding="utf-8")
REPORTS_JS = (ROOT / "ui/modules/reports/reports.js").read_text(encoding="utf-8")
DAILY_JS = (ROOT / "ui/modules/reports/daily-report.js").read_text(encoding="utf-8")
WEEKLY_JS = (ROOT / "ui/modules/reports/weekly-report.js").read_text(encoding="utf-8")
MONTHLY_JS = (ROOT / "ui/modules/reports/monthly-report.js").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")
SCHEMA = (ROOT / "src/mine_services/schema.py").read_text(encoding="utf-8")
PLANS_SCREEN = HTML[HTML.index('<section id="plansScreen"'):HTML.index('<section id="hseScreen"')]


def test_target_plan_does_not_show_or_require_hours_but_keeps_a3_legacy_column():
    assert "target_hours" not in PLANS_JS
    assert "f_plan_target_hours" not in PLANS_SCREEN
    assert "Target Hours" not in PLANS_SCREEN
    assert "Target Hrs" not in PLANS_SCREEN
    assert '"Plans":["plan_id","period","start_date","end_date","domain","work_front_id","activity","target_quantity","measurement","target_hours","status"]' in SCHEMA


def test_report_center_uses_plan_start_end_dates_instead_of_created_date():
    assert "function reportPlanBounds(row)" in REPORTS_JS
    assert "if(entity==='Plans')return source.filter(row=>{const range=reportPlanBounds(row);return !!range&&range.start<=period.end&&range.end>=period.start;});" in REPORTS_JS
    assert "function planRange(row)" in DAILY_JS
    assert "if(name==='Plans')" in DAILY_JS
    assert "function planRange(r)" in WEEKLY_JS and "if(n==='Plans')" in WEEKLY_JS
    assert "function planRange(r)" in MONTHLY_JS and "if(n==='Plans')" in MONTHLY_JS


def test_daily_weekly_monthly_models_include_plan_vs_actual_section():
    assert REPORTS_JS.count("return attachPlanActual(") == 3
    assert "model.report_type==='DAILY'?'Plan vs Actual':model.report_type==='WEEKLY'?'Planned vs Actual':'Target vs Actual'" in REPORTS_JS
    assert "narrative('Plan vs Actual',reportSectionText" in REPORTS_JS
    assert "target_by_measurement" in REPORTS_JS
    assert "actual_by_measurement" in REPORTS_JS
    assert "variance_by_measurement" in REPORTS_JS
    assert "achievement_by_measurement" in REPORTS_JS
    assert "remaining_by_measurement" in REPORTS_JS


def test_plan_targets_are_not_prorated_and_ambiguous_operations_are_not_double_counted():
    assert "Targets are not prorated." in REPORTS_JS
    assert "Only plans whose full Start Date–End Date range is inside this report period are compared." in REPORTS_JS
    assert "if(candidates.length>1)" in REPORTS_JS
    assert "Their quantities were excluded from comparable actuals to prevent double counting." in REPORTS_JS
    assert "actual_period_output_by_measurement" in REPORTS_JS


def test_report_asset_cache_versions_are_current():
    assert "plans.js?v=20261016" in HTML
    assert "plans.css?v=20261103" in HTML
    assert "daily-report.js?v=20261011" in HTML
    assert "weekly-report.js?v=20261008" in HTML
    assert "monthly-report.js?v=20261011" in HTML
    assert "reports.js?v=20261020" in HTML
