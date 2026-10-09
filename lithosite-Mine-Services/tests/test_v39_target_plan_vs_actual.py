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
    assert "'Actual'" in PLANS_JS and "'Variance'" in PLANS_JS
    assert "'Achievement'" in PLANS_JS and "'Remaining'" in PLANS_JS
    assert "const variance=validTarget&&validActual?actual-target:null;" in PLANS_JS
    assert "actual/target*100" in PLANS_JS
    assert "Math.max(target-actual,0)" in PLANS_JS
    assert "Actual unavailable" in PLANS_JS
    assert "Operations unavailable · Actuals not calculated" in PLANS_JS
    assert "consolidated-tr" in PLANS_JS
    assert "plansColumns" not in PLANS_JS
    assert 'id="plansViewToggle"' not in HTML
    assert "plans.js?v=20261015" in HTML
    assert "plans.css?v=20261102" in HTML
