from pathlib import Path


UI = Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Concept-2-Operations-v1.html"


def test_stage8_operations_ui_contract_markers():
    text = UI.read_text(encoding="utf-8")
    required = [
        "const HOST='http://127.0.0.1:8765'",
        "operation:'READ',entity:'Operations'",
        "operation:'READ',entity:'WorkFront'",
        "operation:'READ',entity:'Equipment'",
        "operation:'CREATE'",
        "operation:'UPDATE'",
        "operation:'DELETE'",
        "activityFilter",
        "sourceFilter",
        "openEdit",
        "removeRow",
        "RuntimeAdapter connected",
        "does not write directly to the database",
    ]
    for marker in required:
        assert marker in text, marker


def test_stage8_operations_ui_has_no_browser_database():
    text = UI.read_text(encoding="utf-8").lower()
    assert "indexeddb" not in text
    assert "localstorage" not in text


def test_stage8_operations_ui_uses_schema_status_values():
    text = UI.read_text(encoding="utf-8")
    for status in ("DRAFT", "VALIDATED", "REJECTED", "VOIDED"):
        assert status in text
    assert "Valid</option>" not in text
    assert "Pending</option>" not in text
