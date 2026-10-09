from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_target_plan_register_keeps_measurement_and_centers_target_fields():
    assert "['Plan ID','Plan Range','Domain','Work Front','Activity','Target Qty','Measurement','Target Hrs','Status','Actions']" in PLANS_JS
    assert 'class="cell num target-quantity"' in PLANS_JS
    assert """class="cell measurement-cell">'+esc(r.measurement)+'</div>'""" in PLANS_JS
    assert """class="cell num target-hours">'+esc(r.target_hours)+'</div>'""" in PLANS_JS
    assert ".plantr:not(.actual-th):not(.actual-tr) > .cell:nth-child(6)" in PLANS_CSS
    assert ".plantr:not(.actual-th):not(.actual-tr) > .cell:nth-child(8)" in PLANS_CSS
    assert "text-align:center" in PLANS_CSS


def test_register_and_actual_tables_use_canonical_responsive_grids():
    assert "ten grid tracks correspond exactly to ten header/data cells" in PLANS_CSS
    assert "eleven grid tracks, sized proportionally" in PLANS_CSS
    assert "grid-template-columns:minmax(100px,.8fr) minmax(145px,1.05fr)" in PLANS_CSS
    assert "grid-template-columns:minmax(90px,.7fr) minmax(130px,.95fr)" in PLANS_CSS
    assert "width:100%" in PLANS_CSS
    assert "min-width:0" in PLANS_CSS


def test_target_plan_css_has_no_repeated_override_blocks():
    assert PLANS_CSS.count("#plansScreen .filters {") == 1
    assert PLANS_CSS.count("#plansScreen .tablepanel {") == 1
    assert PLANS_CSS.count("#plansScreen .ptitle {") == 1
    assert PLANS_CSS.count("#plansScreen .plantr.actual-th,") == 1
    assert "V39 — ten aligned columns" not in PLANS_CSS
    assert "V39 — balanced register grid" not in PLANS_CSS


def test_layout_assets_use_current_cache_version():
    assert "plans.css?v=20261031" in HTML
