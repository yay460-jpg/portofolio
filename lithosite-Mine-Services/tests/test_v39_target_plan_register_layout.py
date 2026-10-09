from pathlib import Path

ROOT = Path(__file__).parents[1]
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_target_plan_has_one_static_unified_register_header():
    expected_headers = (
        "Plan ID", "Start Date", "End Date", "Domain", "Work Front", "Activity",
        "Target Qty", "Measurement", "Target Hrs", "Actual", "Variance",
        "Achievement", "Remaining", "Status", "Actions",
    )
    assert 'class="plantr th consolidated-th">' in HTML
    for label in expected_headers:
        assert f'<div class="cell">{label}</div>' in HTML
    assert 'id="plansViewToggle"' not in HTML
    assert 'id="plansColumns"' not in HTML
    assert 'id="plansTableTitleText"' not in HTML


def test_combined_register_keeps_target_actual_metrics_and_actions():
    for marker in ('class="cell num target-quantity"', 'class="cell measurement-cell"',
                   'class="cell num target-hours"', 'class="cell num actual-quantity"',
                   'class="cell num variance"', 'class="cell num achievement"',
                   'class="cell num remaining"', 'class="cell row-actions"'):
        assert marker in PLANS_JS


def test_combined_register_uses_one_responsive_grid_for_fifteen_columns():
    assert "Unified Target Plan register" in PLANS_CSS
    assert "grid-template-columns:minmax(82px,.85fr) minmax(75px,.78fr) minmax(75px,.78fr)" in PLANS_CSS
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
    assert "plans.js?v=20261015" in HTML
    assert "plans.css?v=20261102" in HTML
