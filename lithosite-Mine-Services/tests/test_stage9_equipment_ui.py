from pathlib import Path

ARTIFACT = Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v33-STAGE21.html"
TEXT = ARTIFACT.read_text(encoding="utf-8")
EQUIPMENT_JS = (Path(__file__).parents[1] / "ui" / "modules" / "equipment" / "equipment.js").read_text(encoding="utf-8")
SHELL_JS = (Path(__file__).parents[1] / "ui" / "shared" / "shell-navigation-v31.js").read_text(encoding="utf-8")


def test_stage9_equipment_screen_exists():
    assert 'id="equipmentScreen"' in TEXT
    assert ">Equipment<" in TEXT
    assert "equipment.js?v=20261005" in TEXT
    assert "entity:'Equipment'" in EQUIPMENT_JS or 'entity:"Equipment"' in EQUIPMENT_JS


def test_stage9_equipment_fields_present():
    for field in (
        "equipment_id",
        "category",
        "type",
        "owner_type",
        "owner_name",
        "status",
        "effective_from",
        "effective_to",
        "unit_no",
    ):
        assert field in EQUIPMENT_JS


def test_stage9_runtime_crud_contract_present():
    assert "operation:'READ',entity:'Equipment'" in EQUIPMENT_JS
    assert "operation:'CREATE',entity:'Equipment'" in EQUIPMENT_JS
    assert "operation:'UPDATE',entity:'Equipment'" in EQUIPMENT_JS
    assert "operation:'DELETE',entity:'Equipment'" in EQUIPMENT_JS
    assert "RuntimeAdapter" in EQUIPMENT_JS


def test_stage9_reference_protection_is_runtime_authoritative():
    assert "Runtime will reject deletion if the equipment is referenced." in EQUIPMENT_JS
    assert "Delete failed:" in EQUIPMENT_JS


def test_stage9_no_browser_database():
    assert "indexedDB" not in (TEXT + EQUIPMENT_JS).lower()
    assert "localStorage" not in (TEXT + EQUIPMENT_JS)


def test_stage9_controlled_vocab_contract_present():
    assert "equipment_category" in EQUIPMENT_JS
    assert "equipment_type" in EQUIPMENT_JS
    assert "owner_type" in EQUIPMENT_JS
    assert "equipment_status" in EQUIPMENT_JS
    assert "entity:'_Lists'" in EQUIPMENT_JS
    assert "loadLists" in EQUIPMENT_JS


def test_stage9_navigation_and_shell_guard_available():
    assert 'Equipment' in TEXT
    assert "equipmentScreen" in TEXT
    assert "let currentScreen = 'Dashboard';" in SHELL_JS
    assert "validateShellContract" in SHELL_JS
    assert "const STORAGE_KEY = 'lithosite-v31-active-screen';" in SHELL_JS
    assert "readInitialScreen" in SHELL_JS
    assert "setScreen(readInitialScreen(), false);" in SHELL_JS
    assert "dashboardScreen" in SHELL_JS
    assert "operationsScreen" in SHELL_JS
    assert "equipmentScreen" in SHELL_JS


def test_stage9_runtime_error_is_not_rendered_as_empty_dataset():
    assert "state.status='error'" in EQUIPMENT_JS
    assert "Equipment data unavailable" in EQUIPMENT_JS
    assert "state.rows=[]" not in EQUIPMENT_JS


