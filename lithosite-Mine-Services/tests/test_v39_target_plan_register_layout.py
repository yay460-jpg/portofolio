from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_target_plan_has_one_static_unified_register_header():
    expected_headers = (
        "Plan ID", "Start Date", "End Date", "Domain", "Work Front", "Activity",
        "Target Qty", "Measurement", "Actual", "Variance",
        "Achievement", "Remaining", "Status", "Evidence", "Actions",
    )
    assert 'class="plantr th consolidated-th">' in HTML
    for label in expected_headers:
        assert f'<div class="cell">{label}</div>' in HTML
    assert 'id="plansViewToggle"' not in HTML
    assert 'f_plan_target_hours' not in HTML
    assert 'Target Hrs' not in HTML[HTML.index('<section id="plansScreen"'):HTML.index('<section id="hseScreen"')]
    assert 'id="plansColumns"' not in HTML
    assert 'id="plansTableTitleText"' not in HTML
    assert 'id="plansTableTitle"' not in HTML


def test_combined_register_keeps_target_actual_metrics_and_actions():
    for marker in ('class="cell num target-quantity"', 'class="cell measurement-cell"',
                   'class="cell num actual-quantity"',
                   'class="cell num variance"', 'class="cell num achievement"',
                   'class="cell num remaining"', 'class="cell status-cell"',
                   'class="cell evidence-cell"><button type="button" class="control mini view-evidence"', 'class="cell row-actions"'):
        assert marker in PLANS_JS
    status_position = PLANS_JS.index('class="cell status-cell"')
    evidence_position = PLANS_JS.index('class="cell evidence-cell"')
    actions_position = PLANS_JS.index('class="cell row-actions"')
    assert status_position < evidence_position < actions_position


def test_combined_register_uses_one_responsive_grid_for_fifteen_columns():
    assert "Unified Target Plan register: fifteen aligned columns" in PLANS_CSS
    register_css = PLANS_CSS[PLANS_CSS.index("/* Unified Target Plan register"):]
    grid_rule = register_css.split("grid-template-columns:", 1)[1].split(";", 1)[0]
    assert grid_rule.count("minmax(") == 15
    assert "grid-template-columns:minmax(90px,.9fr) minmax(78px,.78fr) minmax(78px,.78fr)" in PLANS_CSS
    assert ".plantr.consolidated-th," in PLANS_CSS
    assert ".plantr.consolidated-tr {" in PLANS_CSS
    assert "width:100%" in PLANS_CSS and "min-width:0" in PLANS_CSS


def test_target_plan_source_has_no_obsolete_toggle_or_dynamic_header_code():
    assert "viewMode" not in PLANS_JS
    assert "plansViewToggle" not in PLANS_JS
    assert "plansColumns" not in PLANS_JS
    assert "plansTableTitleText" not in PLANS_JS
    assert PLANS_CSS.count("#plansScreen .filters {") == 1
    assert PLANS_CSS.count("#plansScreen .tablepanel {") == 1
    assert "actual-th" not in PLANS_CSS and "actual-tr" not in PLANS_CSS


def test_combined_register_assets_use_current_cache_versions():
    assert "plans.js?v=20261029" in HTML
    assert "plans.css?v=20261111" in HTML


def test_work_front_column_has_room_and_wraps_full_identifier():
    assert "minmax(190px,1.45fr) minmax(95px,1fr)" in PLANS_CSS
    workfront_rules = PLANS_CSS[PLANS_CSS.index("#plansScreen .plantr.consolidated-tr > .cell:nth-child(5)"):PLANS_CSS.index("#plansScreen .consolidated-tr .cell")]
    assert "white-space:normal" in workfront_rules
    assert "overflow-wrap:anywhere" in workfront_rules
    assert "text-overflow:clip" in workfront_rules
    assert "plans.css?v=20261111" in HTML
