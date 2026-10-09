from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_target_plan_register_combines_quantity_and_measurement_in_one_cell():
    assert "Target Qty','Target Hrs','Status','Actions'" in PLANS_JS
    assert 'class="cell num target-quantity"' in PLANS_JS
    assert "numberLabel(r.target_quantity)+' '+String(r.measurement||'')" in PLANS_JS


def test_target_plan_register_uses_compact_grid_and_reduced_quantity_padding():
    assert "grid-template-columns:100px 150px 130px 220px 210px 130px 80px 80px 100px minmax(80px,1fr)" in PLANS_CSS
    assert "padding-left:4px" in PLANS_CSS
    assert "padding-right:4px" in PLANS_CSS
    assert "plans.css?v=20261027" in HTML
