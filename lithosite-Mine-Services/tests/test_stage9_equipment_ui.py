from pathlib import Path

ARTIFACT = Path(__file__).parents[1] / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html"
TEXT = ARTIFACT.read_text(encoding="utf-8")
EQUIPMENT_JS = (Path(__file__).parents[1] / "ui" / "modules" / "equipment" / "equipment.js").read_text(encoding="utf-8")
EQUIPMENT_CSS = (Path(__file__).parents[1] / "ui" / "modules" / "equipment" / "equipment.css").read_text(encoding="utf-8")
SHELL_JS = (Path(__file__).parents[1] / "ui" / "shared" / "shell-navigation.js").read_text(encoding="utf-8")


def test_stage9_equipment_screen_exists():
    assert 'id="equipmentScreen"' in TEXT
    assert ">Equipment<" in TEXT
    assert "equipment.js?v=20261014-unit-list" in TEXT
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
        "capacity_profile_id",
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
    assert "const STORAGE_KEY = 'lithosite-active-screen';" in SHELL_JS
    assert "readInitialScreen" in SHELL_JS
    assert "setScreen(readInitialScreen(), false);" in SHELL_JS
    assert "dashboardScreen" in SHELL_JS
    assert "operationsScreen" in SHELL_JS
    assert "equipmentScreen" in SHELL_JS


def test_stage9_runtime_error_is_not_rendered_as_empty_dataset():
    assert "state.status='error'" in EQUIPMENT_JS
    assert "Equipment data unavailable" in EQUIPMENT_JS
    assert "state.rows=[]" not in EQUIPMENT_JS




def test_stage9_global_capacity_resolution_contract_present():
    assert "Global Capacity Profile" in TEXT
    assert "f_eq_capacity_profile" in TEXT
    assert "f_eq_brand" in TEXT
    assert "f_eq_capacity" in TEXT
    assert "GlobalCapacity" in EQUIPMENT_JS
    assert "capacity_profile_id" in EQUIPMENT_JS


def test_stage9_equipment_master_brand_column_resolves_from_global_capacity():
    header = (
        '<div class="cell">Category</div><div class="cell">Brand / Merk</div>'
        '<div class="cell">Type</div>'
    )
    assert header in TEXT
    assert "function equipmentBrand(row)" in EQUIPMENT_JS
    assert "profile.unit_brand" in EQUIPMENT_JS
    assert "esc(equipmentBrand(r))" in EQUIPMENT_JS
    assert "grid-template-columns:150px 115px 125px 100px 115px" in EQUIPMENT_CSS
    assert "min-width:1300px" in EQUIPMENT_CSS


def test_equipment_unit_list_button_is_between_refresh_and_global_capacity():
    controls = TEXT[TEXT.index('id="equipmentScreen"'):TEXT.index('id="equipmentScreen"') + 1800]
    refresh = controls.index('id="equipmentRefresh"')
    unit_list = controls.index('id="equipmentUnitListButton"')
    capacity = controls.index('id="globalCapacityButton"')
    assert refresh < unit_list < capacity
    assert 'aria-controls="equipmentUnitListModal"' in controls


def test_equipment_unit_database_modal_has_requested_compact_columns():
    modal = TEXT[TEXT.index('id="equipmentUnitListModal"'):TEXT.index('id="workfrontScreen"')]
    for label in ("Date Record", "Unique ID", "Type", "Brand", "Category", "Status", "Action"):
        assert label in modal
    assert 'id="equipmentUnitListRows"' in modal
    assert 'id="equipmentUnitListRefresh"' in modal


def test_equipment_unit_database_reads_canonical_runtime_records_only():
    assert "function renderUnitList()" in EQUIPMENT_JS
    assert "function openUnitList()" in EQUIPMENT_JS
    assert "async function refreshUnitList()" in EQUIPMENT_JS
    assert "rc.request({operation:'READ',entity:'Equipment'})" in EQUIPMENT_JS
    assert "rc.request({operation:'READ',entity:'GlobalCapacity'})" in EQUIPMENT_JS
    assert "esc(row.effective_from||'—')" in EQUIPMENT_JS
    assert "esc(equipmentBrand(row))" in EQUIPMENT_JS
    assert "equipment-unit-open" in EQUIPMENT_JS
    assert "equipmentUnitListModal" in (Path(__file__).parents[1] / "ui" / "shared" / "modal-show-contract.js").read_text(encoding="utf-8")


def test_equipment_unit_list_modal_has_scrollable_compact_layout():
    assert ".equipment-unit-modal{width:min(1080px,94vw)" in EQUIPMENT_CSS
    assert "max-height:min(56vh,560px)" in EQUIPMENT_CSS
    assert "grid-template-columns:125px minmax(150px,1.35fr)" in EQUIPMENT_CSS


def test_equipment_unit_list_uses_existing_edit_and_delete_actions():
    assert 'class="control mini edit-equipment"' in EQUIPMENT_JS
    assert 'class="control mini danger delete-equipment"' in EQUIPMENT_JS
    assert "const edit=event.target.closest('.edit-equipment')" in EQUIPMENT_JS
    assert "const del=event.target.closest('.delete-equipment')" in EQUIPMENT_JS
    assert "if(del)remove(del.dataset.id)" in EQUIPMENT_JS
    assert "equipment-unit-open" not in EQUIPMENT_JS

def test_served_equipment_artifact_wires_unit_list_modal_and_fresh_assets():
    artifact = (Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    assert 'id="equipmentUnitListButton"' in artifact
    assert 'id="equipmentUnitListModal"' in artifact
    assert "equipment.js?v=20261014-unit-list" in artifact
    assert "equipment.css?v=20261014-unit-list" in artifact
