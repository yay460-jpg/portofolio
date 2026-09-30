from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v29-STAGE17.html"
TEXT = ARTIFACT.read_text(encoding="utf-8")
WORKFRONT_JS = (ROOT / "ui" / "modules" / "workfront" / "workfront.js").read_text(encoding="utf-8")
SHELL_JS = (ROOT / "ui" / "shared" / "shell-navigation-v29.js").read_text(encoding="utf-8")


def test_stage10_workfront_screen_exists():
    assert 'id="workfrontScreen"' in TEXT
    assert ">Work Front<" in TEXT
    assert "workfront.js?v=20261003" in TEXT
    assert "entity:'WorkFront'" in WORKFRONT_JS


def test_stage10_workfront_fields_present():
    for field in (
        "work_front_id",
        "domain",
        "location",
        "responsible",
        "status",
        "effective_from",
        "effective_to",
    ):
        assert field in WORKFRONT_JS


def test_stage10_runtime_crud_contract_present():
    assert "operation:'READ',entity:'WorkFront'" in WORKFRONT_JS
    assert "operation:'CREATE',entity:'WorkFront'" in WORKFRONT_JS
    assert "operation:'UPDATE',entity:'WorkFront'" in WORKFRONT_JS
    assert "operation:'DELETE',entity:'WorkFront'" in WORKFRONT_JS
    assert "RuntimeAdapter" in WORKFRONT_JS


def test_stage10_reference_protection_is_runtime_authoritative():
    assert "Runtime will reject deletion if the Work Front is referenced." in WORKFRONT_JS
    assert "Delete failed:" in WORKFRONT_JS


def test_stage10_controlled_vocab_contract_present():
    assert "service_domain" in WORKFRONT_JS
    assert "work_front_status" in WORKFRONT_JS
    assert "entity:'_Lists'" in WORKFRONT_JS
    assert "loadLists" in WORKFRONT_JS


def test_stage10_no_browser_database():
    assert "indexedDB" not in (TEXT + WORKFRONT_JS).lower()
    assert "localStorage" not in (TEXT + WORKFRONT_JS)


def test_stage10_navigation_and_shell_guard_available():
    assert "Work Front" in TEXT
    assert "workfrontScreen" in TEXT
    assert "let currentScreen = 'Dashboard';" in SHELL_JS
    assert "validateShellContract" in SHELL_JS
    assert "const STORAGE_KEY = 'lithosite-v29-active-screen';" in SHELL_JS
    assert "readInitialScreen" in SHELL_JS
    assert "setScreen(readInitialScreen(), false);" in SHELL_JS
    assert "dashboardScreen" in SHELL_JS
    assert "operationsScreen" in SHELL_JS
    assert "equipmentScreen" in SHELL_JS
    assert "workfrontScreen" in SHELL_JS


def test_stage10_runtime_error_is_not_rendered_as_empty_dataset():
    assert "state.status='error'" in WORKFRONT_JS
    assert "Work Front data unavailable" in WORKFRONT_JS
    assert "state.rows=[]" not in WORKFRONT_JS


