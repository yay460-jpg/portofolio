from pathlib import Path

ARTIFACT = Path(__file__).parents[1] / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html"
TEXT = ARTIFACT.read_text(encoding="utf-8")
EQUIPMENT_JS = (Path(__file__).parents[1] / "ui" / "modules" / "equipment" / "equipment.js").read_text(encoding="utf-8")
EQUIPMENT_CSS = (Path(__file__).parents[1] / "ui" / "modules" / "equipment" / "equipment.css").read_text(encoding="utf-8")
SHELL_JS = (Path(__file__).parents[1] / "ui" / "shared" / "shell-navigation.js").read_text(encoding="utf-8")


def test_stage9_equipment_screen_exists():
    assert 'id="equipmentScreen"' in TEXT
    assert ">Equipment<" in TEXT
    assert "equipment.js?v=20261015-unit-list-reference" in TEXT
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
    for label in ("Date Record", "Unique ID", "Unit / Fleet No.", "Type", "Brand", "Category", "Status", "Action"):
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
    assert 'class="control mini edit-equipment"' in EQUIPMENT_JS
    assert 'class="control mini danger delete-equipment"' in EQUIPMENT_JS
    assert "equipment-unit-open" not in EQUIPMENT_JS
    assert "equipmentUnitListModal" in (Path(__file__).parents[1] / "ui" / "shared" / "modal-show-contract.js").read_text(encoding="utf-8")


def test_equipment_unit_list_modal_has_scrollable_compact_layout():
    assert "width:min(1240px,calc(100vw - 40px))" in EQUIPMENT_CSS
    assert "grid-template-columns:120px minmax(155px,1.3fr) minmax(120px,1fr)" in EQUIPMENT_CSS
    assert "max-height:min(58vh,560px)" in EQUIPMENT_CSS
    assert "equipment-unit-actions .mini" in EQUIPMENT_CSS


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
    assert "equipment.js?v=20261015-unit-list-reference" in artifact
    assert "equipment.css?v=20261015-unit-type-filter" in artifact

def test_equipment_unit_list_desktop_grid_fits_actions_without_forced_horizontal_overflow():
    css = EQUIPMENT_CSS[EQUIPMENT_CSS.index('/* Unit Database layout correction'): ]
    assert 'width:100%;\n min-width:0;' in css
    assert 'grid-template-columns:120px minmax(155px,1.3fr)' in css
    assert 'min-width:850px' in css  # narrow-screen media override only
    assert 'white-space:nowrap' in css
    assert 'min-width:0;\n height:28px' in css


def test_unit_database_can_add_and_edit_canonical_unit_records():
    modal = TEXT[TEXT.index('id="equipmentUnitListModal"'):TEXT.index('id="workfrontScreen"')]
    assert 'id="equipmentUnitListAdd">Add Unit</button>' in modal
    assert 'id="equipmentUnitListRefresh">Refresh List</button>' in modal
    assert "document.getElementById('equipmentUnitListAdd').onclick=()=>openAdd(true);" in EQUIPMENT_JS
    assert "function openAdd(fromUnitList)" in EQUIPMENT_JS
    assert "returnToUnitList=!!fromUnitList" in EQUIPMENT_JS
    assert "returnToUnitList?'Add Unit':'Add Equipment'" in EQUIPMENT_JS
    assert "operation:'CREATE',entity:'Equipment',row" in EQUIPMENT_JS
    assert "operation:'UPDATE',entity:'Equipment',entity_id:editId,patch:row" in EQUIPMENT_JS


def test_unit_database_form_returns_to_list_after_save_or_cancel():
    assert "function closeEquipmentForm()" in EQUIPMENT_JS
    assert "if(reopenUnitList){global.LithositeModalShowContract.show('equipmentUnitListModal');refreshUnitList();}" in EQUIPMENT_JS
    assert "if(reopenUnitList){global.LithositeModalShowContract.show('equipmentUnitListModal');await refreshUnitList();}" in EQUIPMENT_JS


def test_unit_database_uses_existing_a3_equipment_entity_not_parallel_storage():
    schema = (Path(__file__).parents[1] / "src" / "mine_services" / "schema.py").read_text(encoding="utf-8")
    assert '"Equipment"' in schema
    assert 'rc.request({operation:"CREATE",entity:"Unit"' not in EQUIPMENT_JS
    assert "indexedDB" not in EQUIPMENT_JS.lower()
    assert "localStorage" not in EQUIPMENT_JS


def test_add_equipment_requires_registered_unit_list_reference():
    artifact = (Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    assert 'id="equipmentUnitReferenceField"' in artifact
    assert 'id="f_eq_unit_reference"' in artifact
    assert "function fillUnitReference(selectedId)" in EQUIPMENT_JS
    assert "function selectRegisteredUnit(id)" in EQUIPMENT_JS
    assert "addEquipmentRequiresReference&&!editId" in EQUIPMENT_JS
    assert "Select a registered unit from Unit List before saving Equipment." in EQUIPMENT_JS
    assert "document.getElementById('f_eq_id').readOnly=true" in EQUIPMENT_JS
    assert "document.getElementById('f_eq_unit_no').readOnly=true" in EQUIPMENT_JS
