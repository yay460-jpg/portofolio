from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_v39_target_plan_has_separate_plan_vs_actual_view():
    assert 'id="plansViewToggle"' in HTML
    assert 'id="plansColumns"' in HTML
    assert "viewMode=viewMode==='register'?'actual':'register'" in PLANS_JS
    assert "Target Plan Register" in PLANS_JS
    assert "Plan vs Actual" in PLANS_JS
    assert 'id="plansTableTitleText"' in HTML


def test_v39_plan_vs_actual_uses_only_validated_operations_in_plan_date_range():
    assert "entity:'Operations'" in PLANS_JS
    assert "state.operationsStatus='ready'" in PLANS_JS
    assert "String(row.status||'').trim().toUpperCase()!=='VALIDATED'" in PLANS_JS
    assert "date<range.start||date>range.end" in PLANS_JS
    assert "normalizeMatch(row.domain)!==domain" in PLANS_JS
    assert "workFront&&String(row.work_front_id||'').trim()!==workFront" in PLANS_JS
    assert "normalizeMatch(row.activity)!==activity" in PLANS_JS
    assert "normalizeMatch(row.measurement)!==measurement" in PLANS_JS


def test_v39_plan_vs_actual_displays_variance_achievement_and_remaining_target():
    assert "'Variance'" in PLANS_JS
    assert "'Achievement'" in PLANS_JS
    assert "'Remaining'" in PLANS_JS
    assert "actual-target" in PLANS_JS
    assert "actual/target*100" in PLANS_JS
    assert "Math.max(target-actual,0)" in PLANS_JS
    assert "actual-th" in PLANS_CSS
    assert "plans.js?v=20261012" in HTML
    assert "plans.css?v=20261031" in HTML
