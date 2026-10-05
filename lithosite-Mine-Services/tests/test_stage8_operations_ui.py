from pathlib import Path


ROOT = Path(__file__).parents[1]
UI = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v37-STAGE26.html"
OPS_JS = ROOT / "ui" / "modules" / "operations" / "operations.js"


def test_stage8_operations_ui_contract_markers():
    ui_text = UI.read_text(encoding="utf-8")
    ops_text = OPS_JS.read_text(encoding="utf-8")

    required_ui = [
        'id="operationsScreen"',
        'id="activityFilter"',
        'id="sourceFilter"',
        'runtime-client.js',
        'shell-navigation.js',
        'operations.js',
        "does not write directly to the database",
        'id="f_unit"',
        'Unit / Fleet No.',
    ]

    required_ops = [
        "operation: 'READ', entity: 'Operations'",
        "operation: 'READ', entity: 'WorkFront'",
        "operation: 'READ', entity: 'Equipment'",
        "operation: 'READ', entity: '_Lists'",
        "operation: 'CREATE'",
        "operation: 'UPDATE'",
        "operation: 'DELETE'",
        "openEdit",
        "removeRow",
        "RuntimeAdapter connected",

    ]

    for marker in required_ui:
        assert marker in ui_text, marker

    for marker in required_ops:
        assert marker in ops_text, marker


def test_stage8_operations_ui_has_no_browser_database():
    ui_text = UI.read_text(encoding="utf-8").lower()
    ops_text = OPS_JS.read_text(encoding="utf-8").lower()

    combined = ui_text + "\n" + ops_text
    assert "indexeddb" not in combined
    assert "localstorage" not in combined


def test_stage8_operations_ui_uses_schema_status_values():
    ui_text = UI.read_text(encoding="utf-8")

    for status in ("DRAFT", "VALIDATED", "REJECTED", "VOIDED"):
        assert status in ui_text

    assert "Valid</option>" not in ui_text
    assert "Pending</option>" not in ui_text




def test_stage8_operations_uses_controlled_domain_and_unit_lists():
    ui_text = UI.read_text(encoding="utf-8")
    ops_text = OPS_JS.read_text(encoding="utf-8")

    assert '<select id="f_unit">' in ui_text
    assert "dataState.lists.service_domain" in ops_text
    assert "dataState.lists.unit" in ops_text


def test_stage8_operations_renders_equipment_unit_fleet_reference():
    ui_text = UI.read_text(encoding="utf-8")
    ops_text = OPS_JS.read_text(encoding="utf-8")

    assert '<div class="cell">Unit / Fleet No.</div>' in ui_text
    assert "const unitFleetNo = equipment ? equipment.unit_no : '';" in ops_text
    assert "esc(unitFleetNo)" in ops_text



def test_stage8_operations_work_timeline_detail_contract():
    ui_text = UI.read_text(encoding="utf-8")
    ops_text = OPS_JS.read_text(encoding="utf-8")

    assert 'id="timelineModal"' in ui_text
    assert 'id="timelineRows"' in ui_text
    assert "function timelineGroups(rows)" in ops_text
    assert "function openTimeline(key)" in ops_text
    assert "data-key=" in ops_text
    assert "Work Timeline" in ui_text


def test_stage8_operations_edit_from_timeline_preserves_detail_modal():
    ops_text = OPS_JS.read_text(encoding="utf-8")

    assert "let activeTimelineKey = null;" in ops_text
    assert "openEdit(edit.dataset.id);" in ops_text
    assert "document.getElementById('timelineModal').classList.remove('show');" in ops_text
    assert "if (wasEditing && savedTimelineKey)" in ops_text
    assert "openTimeline(savedRowKey);" in ops_text


def test_stage8_operations_modal_transition_contract():
    ops_text = OPS_JS.read_text(encoding="utf-8")
    css_text = (ROOT / "ui" / "modules" / "operations" / "operations.css").read_text(encoding="utf-8")

    assert "function fadeOutModal(element, duration)" in ops_text
    assert "await fadeOutModal(modal, 160);" in ops_text
    assert "modal-fade-in" in ops_text
    assert "modal-fade-out" in css_text
    assert "@keyframes opsModalFadeIn" in css_text
    assert "@keyframes opsModalFadeOut" in css_text
