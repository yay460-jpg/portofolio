from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v25-STAGE13.html"
TEXT = ARTIFACT.read_text(encoding="utf-8")
MAINTENANCE_JS = (ROOT / "ui" / "modules" / "maintenance" / "maintenance.js").read_text(encoding="utf-8")
SHELL_JS = (ROOT / "ui" / "shared" / "shell-navigation-v25.js").read_text(encoding="utf-8")


def test_stage11_maintenance_screen_and_module_are_wired():
    assert 'id="maintenanceScreen"' in TEXT
    assert ">Maintenance<" in TEXT
    assert "maintenance.js?v=20261005" in TEXT
    assert "entity:'Maintenance'" in MAINTENANCE_JS


def test_stage11_maintenance_schema_fields_present():
    for field in (
        "maintenance_id", "equipment_id", "event_date", "event_type",
        "failure_code", "start_time", "end_time", "downtime_hours",
        "action", "status", "source",
    ):
        assert field in MAINTENANCE_JS


def test_stage11_runtime_crud_contract_present():
    for operation in ("READ", "CREATE", "UPDATE", "DELETE"):
        assert f"operation:'{operation}',entity:'Maintenance'" in MAINTENANCE_JS
    assert "RuntimeAdapter" in MAINTENANCE_JS


def test_stage11_controlled_vocab_and_equipment_reference_are_runtime_sourced():
    assert "maintenance_event_type" in MAINTENANCE_JS
    assert "maintenance_status" in MAINTENANCE_JS
    assert "entity:'_Lists'" in MAINTENANCE_JS
    assert "entity:'Equipment'" in MAINTENANCE_JS
    assert "f_maintenance_equipment" in TEXT


def test_stage11_runtime_errors_are_visible():
    assert "state.status='error'" in MAINTENANCE_JS
    assert "Maintenance data unavailable" in MAINTENANCE_JS
    assert "Validation/runtime error:" in MAINTENANCE_JS
    assert "Delete failed:" in MAINTENANCE_JS


def test_stage11_shell_contract_includes_maintenance():
    assert "Maintenance: 'maintenanceScreen'" in SHELL_JS
    assert "'Maintenance'" in SHELL_JS
    assert "const required = ['Dashboard', 'Operations', 'Equipment', 'Work Front', 'Maintenance', 'Issues', 'Plans'];" in SHELL_JS
    assert "let currentScreen = 'Dashboard';" in SHELL_JS
    assert "const STORAGE_KEY = 'lithosite-v25-active-screen';" in SHELL_JS
    assert "readInitialScreen" in SHELL_JS
    assert "setScreen(readInitialScreen(), false);" in SHELL_JS


def test_stage11_no_browser_database_access():
    assert "indexedDB" not in (TEXT + MAINTENANCE_JS).lower()
    assert "localStorage" not in (TEXT + MAINTENANCE_JS)


def test_stage11_workfront_action_buttons_follow_crud_mini_contract():
    assert '.wfcell.row-actions .control.mini{height:24px;padding:3px 7px;font-size:8px}' in TEXT
    assert '#workfrontScreen .danger{color:#fca5a5;border-color:#5a2b32;background:#12243a}' in TEXT
    assert '.wfcell.row-actions .control{height:30px;padding:5px 8px}' not in TEXT

def test_stage11_native_picker_icons_follow_dark_theme():
    assert 'input[type="date"],input[type="time"],input[type="datetime-local"]{color-scheme:dark}' in TEXT
    assert '::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.85}' in TEXT


def test_stage11_modal_and_runtime_message_present():
    assert 'id="maintenanceModal"' in TEXT
    assert 'id="maintenanceRuntimeMsg"' in TEXT
    assert 'id="maintenanceSave"' in TEXT
