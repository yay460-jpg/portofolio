from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")
OPERATIONS_JS = (ROOT / "ui" / "modules" / "operations" / "operations.js").read_text(encoding="utf-8")
OPERATIONS_CSS = (ROOT / "ui" / "modules" / "operations" / "operations.css").read_text(encoding="utf-8")


def test_dumping_activity_shows_a_warning_to_write_hauling():
    assert 'id="f_activity"' in HTML
    assert 'id="activityWarning" class="field-warning" hidden>Warning: Please write Hauling.</small>' in HTML
    assert "function updateActivityWarning()" in OPERATIONS_JS
    assert "String(activityEl.value || '').trim().toLowerCase() === 'dumping'" in OPERATIONS_JS
    assert "warning.hidden = !isDumping;" in OPERATIONS_JS
    assert "updateActivityWarning();" in OPERATIONS_JS


def test_activity_warning_is_accessible_and_hidden_for_other_activity_values():
    assert "activityEl.setAttribute('aria-describedby', 'activityWarning');" in OPERATIONS_JS
    assert "activityEl.removeAttribute('aria-describedby');" in OPERATIONS_JS
    assert "#modal .field-warning[hidden]{display:none!important}" in OPERATIONS_CSS
    assert "#modal .field-warning{" in OPERATIONS_CSS


def test_material_movement_activity_rule_excludes_dumping_tonnage():
    dashboard = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.js").read_text(encoding="utf-8")
    assert "if (activity !== 'hauling') return;" in dashboard
    assert "if (activity !== 'hauling' && activity !== 'dumping') return;" not in dashboard
    assert "dashboard.js?v=20261115" in HTML
    assert '<span class="chartkey"><i class="chartdot chartdot-ore"></i><span class="chartkey-name">Ore</span>' in HTML
    assert '<span class="chartkey"><i class="chartdot chartdot-blue"></i>Hauling</span>' not in HTML


def test_operations_warning_assets_use_fresh_cache_keys():
    assert "operations.js?v=20261109" in HTML
    assert "operations.css?v=20261026" in HTML
