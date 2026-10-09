from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_target_plan_register_exposes_start_and_end_date_separately():
    assert "['Plan ID','Start Date','End Date','Domain','Work Front','Activity','Target Qty','Measurement','Target Hrs','Status','Actions']" in PLANS_JS
    assert """title="'+esc(range.start)+'">'+esc(range.start)""" in PLANS_JS
    assert """title="'+esc(range.end)+'">'+esc(range.end)""" in PLANS_JS
    assert 'class="cell measurement-cell"' in PLANS_JS


def test_plan_vs_actual_exposes_start_and_end_date_separately():
    assert "['Plan ID','Start Date','End Date','Domain','Work Front','Activity','Target','Actual','Variance','Achievement','Remaining','Status']" in PLANS_JS
    assert "Actual from VALIDATED Operations" in PLANS_JS


def test_target_plan_grids_match_column_counts_and_remain_responsive():
    assert "grid-template-columns:minmax(100px,.8fr) minmax(105px,.75fr) minmax(105px,.75fr)" in PLANS_CSS
    assert "grid-template-columns:minmax(90px,.7fr) minmax(100px,.75fr) minmax(100px,.75fr)" in PLANS_CSS
    assert "width:100%" in PLANS_CSS and "min-width:0" in PLANS_CSS


def test_target_qty_and_hours_remain_centered():
    assert ".plantr:not(.actual-th):not(.actual-tr) > .cell:nth-child(7)" in PLANS_CSS
    assert ".plantr:not(.actual-th):not(.actual-tr) > .cell:nth-child(9)" in PLANS_CSS
    assert "text-align:center" in PLANS_CSS


def test_stylesheet_and_script_cache_versions_are_current():
    assert "plans.js?v=20261013" in HTML
    assert "plans.css?v=20261101" in HTML
