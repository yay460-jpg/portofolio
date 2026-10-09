from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_target_plan_keeps_measurement_column_close_to_quantity():
    assert "['Plan ID','Plan Range','Domain','Work Front','Activity','Target Qty','Measurement','Target Hrs','Status','Actions']" in PLANS_JS
    assert "esc(r.target_quantity)" in PLANS_JS
    assert "esc(r.measurement)" in PLANS_JS


def test_target_plan_register_uses_compact_grid_and_tight_quantity_unit_padding():
    assert "grid-template-columns:100px 150px 130px 220px 210px 75px 72px 80px 80px 100px minmax(80px,1fr)" in PLANS_CSS
    assert "padding-left:2px" in PLANS_CSS
    assert "padding-right:2px" in PLANS_CSS
    assert "plans.css?v=20261028" in HTML
