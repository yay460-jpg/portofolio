from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
TEXT = ARTIFACT.read_text(encoding="utf-8")
MAINTENANCE_JS = (ROOT / "ui" / "modules" / "maintenance" / "maintenance.js").read_text(encoding="utf-8")
SHELL_JS = (ROOT / "ui" / "shared" / "shell-navigation.js").read_text(encoding="utf-8")


def test_stage11_maintenance_screen_and_module_are_wired():
    assert 'id="maintenanceScreen"' in TEXT
    assert ">Maintenance<" in TEXT
    assert "maintenance.js?" in TEXT
    assert "entity:'Maintenance'" in MAINTENANCE_JS


def test_stage11_maintenance_schema_fields_present():
    for field in (
        "maintenance_id", "equipment_id", "event_date", "event_type",
        "failure_code", "start_time", "end_time", "downtime_hours",
        "action", "status", "source", "shift",
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
    assert "const required = ['Dashboard', 'Operations', 'Equipment', 'Work Front', 'Maintenance', 'Issues', 'Plans', 'HSE', 'Reports'];" in SHELL_JS
    assert "let currentScreen = 'Dashboard';" in SHELL_JS
    assert "const STORAGE_KEY = 'lithosite-active-screen';" in SHELL_JS
    assert "readInitialScreen" in SHELL_JS
    assert "setScreen(readInitialScreen(), false);" in SHELL_JS


def test_stage11_no_browser_database_access():
    assert "indexedDB" not in (TEXT + MAINTENANCE_JS).lower()
    assert "localStorage" not in (TEXT + MAINTENANCE_JS)


def test_stage11_workfront_action_buttons_follow_crud_mini_contract():
    WORKFRONT_CSS = (ROOT / "ui" / "modules" / "workfront" / "workfront.css").read_text(encoding="utf-8")
    BUTTON_CSS = (ROOT / "ui" / "shared" / "button.css").read_text(encoding="utf-8")
    assert '.wfcell.row-actions .control.mini{height:24px;padding:3px 7px;font-size:8px}' in WORKFRONT_CSS
    assert '.control.danger{background:var(--button-danger);border-color:var(--button-danger-border);color:var(--button-danger-text)}' in BUTTON_CSS
    assert '.wfcell.row-actions .control{height:30px;padding:5px 8px}' not in WORKFRONT_CSS

def test_stage11_native_picker_icons_follow_dark_theme():
    assert 'input[type="date"],input[type="time"],input[type="datetime-local"]{color-scheme:dark}' in TEXT
    assert '::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.85}' in TEXT


def test_stage11_modal_and_runtime_message_present():
    assert 'id="maintenanceModal"' in TEXT
    assert 'id="maintenanceRuntimeMsg"' in TEXT
    assert 'id="maintenanceSave"' in TEXT








def test_stage11_maintenance_trace_focus_contract():
    assert "function focusTrace(target)" in MAINTENANCE_JS
    assert "data-trace-key" in MAINTENANCE_JS
    assert "trace-highlight" in MAINTENANCE_JS
    assert "focusTrace," in MAINTENANCE_JS


def test_stage11_maintenance_shift_is_form_table_and_timeline_synced():
    schema_text = (ROOT / "src" / "mine_services" / "schema.py").read_text(encoding="utf-8")
    persistence_text = (ROOT / "src" / "mine_services" / "persistence.py").read_text(encoding="utf-8")

    assert 'id="f_maintenance_shift"' in TEXT
    assert '<div class="cell">Shift</div>' in TEXT
    assert "checker_shift" in schema_text
    assert '"Maintenance.shift":"checker_shift"' in schema_text
    assert "shift:[]" in MAINTENANCE_JS
    assert "f_maintenance_shift:row.shift" in MAINTENANCE_JS
    assert "shift:document.getElementById('f_maintenance_shift').value" in MAINTENANCE_JS
    assert "_migrate_a3_maintenance_shift" in persistence_text
    assert 'value="Day"' not in TEXT and 'value="Night"' not in TEXT


def test_stage11_maintenance_shift_partitions_timeline_and_preserves_calendar_date():
    assert "String(row.shift||'')" in MAINTENANCE_JS
    assert "startsWith(key+'|')" in MAINTENANCE_JS
    assert "String(first.shift||'')" in MAINTENANCE_JS
    assert "shiftAnchorDate" not in MAINTENANCE_JS
    persistence_text = (ROOT / "src" / "mine_services" / "persistence.py").read_text(encoding="utf-8")
    assert 'legacy_headers = [header for header in expected_headers if header != "shift"]' in persistence_text
    assert 'worksheet.cell(row=1, column=new_column, value="shift")' in persistence_text


def test_stage11_operations_links_match_cross_midnight_night_shift():
    assert "function linkedOperationsFor(items)" in MAINTENANCE_JS
    assert "maintenanceShift!=='night'" in MAINTENANCE_JS
    assert "String(row.transaction_time||'')>='18:00'" in MAINTENANCE_JS
    assert "return date===expectedDate" in MAINTENANCE_JS
