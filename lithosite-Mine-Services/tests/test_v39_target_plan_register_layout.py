from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_target_plan_register_combines_target_quantity_and_unit_in_one_cell():
    assert "['Plan ID','Plan Range','Domain','Work Front','Activity','Target Qty','Target Hrs','Status','Actions']" in PLANS_JS
    assert 'class="cell num target-quantity"' in PLANS_JS
    assert "numberLabel(targetValue)+(r.measurement?' '+String(r.measurement):'')" in PLANS_JS
    assert "Target Qty','Measurement'" not in PLANS_JS


def test_target_plan_register_has_nine_balanced_columns_and_fills_available_width():
    assert "grid-template-columns:minmax(100px,.8fr) minmax(140px,1.05fr) minmax(110px,.8fr) minmax(170px,1.25fr) minmax(140px,1.2fr) minmax(105px,.9fr) minmax(75px,.6fr) minmax(80px,.7fr) minmax(100px,.8fr)" in PLANS_CSS
    assert "width:100%" in PLANS_CSS
    assert "min-width:0" in PLANS_CSS


def test_plan_vs_actual_fits_table_width_without_forcing_horizontal_overflow():
    assert "minmax(90px,.7fr) minmax(130px,.95fr) minmax(100px,.75fr) minmax(170px,1.25fr) minmax(120px,1.1fr) minmax(85px,.65fr) minmax(85px,.65fr) minmax(90px,.75fr) minmax(95px,.8fr) minmax(90px,.8fr) minmax(72px,.55fr)" in PLANS_CSS
    assert "min-width:0" in PLANS_CSS
    assert "plans.css?v=20261029" in HTML
