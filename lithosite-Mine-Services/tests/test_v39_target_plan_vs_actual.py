from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_combined_register_reads_operations_and_uses_validated_records_only():
    assert "entity:'Operations'" in PLANS_JS
    assert "const operationsReady=state.operationsStatus==='ready';" in PLANS_JS
    assert "Actual from VALIDATED Operations" in PLANS_JS
    assert "String(row.status||'').trim().toUpperCase()!=='VALIDATED'" in PLANS_JS
    assert "date<range.start||date>range.end" in PLANS_JS
    assert "normalizeMatch(row.domain)!==domain" in PLANS_JS
    assert "workFront&&String(row.work_front_id||'').trim()!==workFront" in PLANS_JS
    assert "normalizeMatch(row.activity)!==activity" in PLANS_JS
    assert "normalizeMatch(row.measurement)!==measurement" in PLANS_JS


def test_combined_register_calculates_actual_variance_achievement_and_remaining():
    for label in ("Actual", "Variance", "Achievement", "Remaining"):
        assert f'<div class="cell">{label}</div>' in HTML
    for marker in ('class="cell num actual-quantity"', 'class="cell num variance"',
                   'class="cell num achievement"', 'class="cell num remaining"'):
        assert marker in PLANS_JS
    assert "const variance=validTarget&&validActual?actual-target:null;" in PLANS_JS
    assert "actual/target*100" in PLANS_JS
    assert "Math.max(target-actual,0)" in PLANS_JS
    assert "Actual unavailable" in PLANS_JS
    assert "Operations unavailable · Actuals not calculated" in PLANS_JS
    assert "consolidated-tr" in PLANS_JS
    assert "plansColumns" not in PLANS_JS
    assert "plansViewToggle" not in HTML
    assert "plansTableTitle" not in PLANS_JS
    assert "plans.js?v=20261018" in HTML
    assert "plans.css?v=20261105" in HTML


def test_target_plan_register_uses_measurement_as_the_only_visible_unit_label():
    assert "validActual?esc(numberLabel(actual)):'—'" in PLANS_JS
    assert "validActual?numberLabel(actual):'Actual unavailable'" in PLANS_JS
    assert "esc((variance>0?'+':'')+numberLabel(variance))" in PLANS_JS
    assert "esc(numberLabel(remaining))" in PLANS_JS
    assert "numberLabel(actual)+' '+unit" not in PLANS_JS
    assert "numberLabel(variance)+' '+unit" not in PLANS_JS
    assert "numberLabel(remaining)+' '+unit" not in PLANS_JS
    assert "plans.js?v=20261018" in HTML
