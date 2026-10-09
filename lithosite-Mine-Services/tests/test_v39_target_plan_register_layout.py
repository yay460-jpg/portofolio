from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_target_plan_register_restores_separate_measurement_column():
    assert "['Plan ID','Plan Range','Domain','Work Front','Activity','Target Qty','Measurement','Target Hrs','Status','Actions']" in PLANS_JS
    assert 'class="cell num target-quantity"' in PLANS_JS
    assert """class="cell measurement-cell">'+esc(r.measurement)+'</div>'""" in PLANS_JS
    assert """class="cell num target-hours">'+esc(r.target_hours)+'</div>'""" in PLANS_JS
    assert "numberLabel(targetValue)+(r.measurement?" not in PLANS_JS


def test_target_quantity_and_target_hours_are_centered_like_activity():
    assert ".plantr:not(.actual-th):not(.actual-tr) > .cell:nth-child(5)" in PLANS_CSS
    assert ".plantr:not(.actual-th):not(.actual-tr) > .cell:nth-child(6)" in PLANS_CSS
    assert ".plantr:not(.actual-th):not(.actual-tr) > .cell:nth-child(8)" in PLANS_CSS
    assert "text-align:center" in PLANS_CSS


def test_target_plan_register_uses_ten_balanced_columns_without_forced_overflow():
    assert "grid-template-columns:minmax(100px,.8fr) minmax(145px,1.05fr) minmax(110px,.8fr) minmax(180px,1.25fr) minmax(125px,1fr) minmax(95px,.75fr) minmax(90px,.6fr) minmax(90px,.65fr) minmax(78px,.55fr) minmax(110px,.8fr)" in PLANS_CSS
    assert "width:100%" in PLANS_CSS
    assert "min-width:0" in PLANS_CSS


def test_plan_vs_actual_keeps_responsive_columns_and_centered_metrics():
    assert "minmax(90px,.7fr) minmax(130px,.95fr) minmax(100px,.75fr) minmax(170px,1.25fr) minmax(120px,1.1fr)" in PLANS_CSS
    assert ".plantr.actual-tr > .cell:nth-child(n+6):nth-child(-n+11)" in PLANS_CSS
    assert "plans.css?v=20261030" in HTML
    assert "plans.js?v=20261012" in HTML
