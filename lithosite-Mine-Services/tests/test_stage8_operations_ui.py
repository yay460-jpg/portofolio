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
        'id="f_unit"'

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
