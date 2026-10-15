from pathlib import Path

ARTIFACT = Path(__file__).parents[1] / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html"
TEXT = ARTIFACT.read_text(encoding="utf-8")
EQUIPMENT_JS = (Path(__file__).parents[1] / "ui" / "modules" / "equipment" / "equipment.js").read_text(encoding="utf-8")
EQUIPMENT_CSS = (Path(__file__).parents[1] / "ui" / "modules" / "equipment" / "equipment.css").read_text(encoding="utf-8")
NIK_JS = (Path(__file__).parents[1] / "ui" / "modules" / "nik" / "nik.js").read_text(encoding="utf-8")
NIK_CSS = (Path(__file__).parents[1] / "ui" / "modules" / "nik" / "nik.css").read_text(encoding="utf-8")
SHELL_JS = (Path(__file__).parents[1] / "ui" / "shared" / "shell-navigation.js").read_text(encoding="utf-8")


def test_stage9_equipment_screen_exists():
    assert 'id="equipmentScreen"' in TEXT
    assert ">Equipment<" in TEXT
    assert "equipment.js?v=20261015-nik-owner-selector" in TEXT
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
    assert "equipment.js?v=20261015-nik-owner-selector" in artifact
    assert "equipment.css?v=20261015-unit-reference-hint" in artifact

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


def test_unit_database_has_single_close_control():
    artifact = (Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    start = artifact.index('id="equipmentUnitListModal"')
    end = artifact.index('<section id="workfrontScreen"', start)
    modal = artifact[start:end]
    assert modal.count('>Close</button>') == 1
    assert '<div class="modalfoot" aria-hidden="true"></div>' in modal
    assert 'equipmentUnitListFooterClose' not in modal


def test_unit_database_empty_footer_is_collapsed_by_its_actual_modal_class():
    css = (Path(__file__).parents[1] / "ui" / "modules" / "equipment" / "equipment.css").read_text(encoding="utf-8")
    assert "#equipmentUnitListModal > .modal.equipment-unit-modal > .modalfoot:empty{display:none;" in css
    assert ".modal.modal-shell-valid > .modalfoot:empty" not in css
    assert "#equipmentUnitListModal .modalfoot{gap:12px}" not in css
    assert "#equipmentUnitListModal .equipment-unit-toolbar-actions{gap:8px}" not in css


def test_unit_database_action_styles_have_single_owner_rule():
    assert EQUIPMENT_CSS.count("#equipmentUnitListModal .equipment-unit-actions{") == 1
    assert "equipment.css?v=20261015-unit-reference-hint" in TEXT


def test_unit_database_body_cells_use_compact_typography():
    assert "#equipmentUnitListModal .equipment-unit-row:not(.equipment-unit-head) .equipment-unit-cell{font-size:9.5px}" in EQUIPMENT_CSS
    assert "font-size:12px;line-height:1.35" not in EQUIPMENT_CSS
    assert "equipment.css?v=20261015-unit-reference-hint" in TEXT


def test_global_capacity_modal_has_one_close_button_and_no_footer_action():
    artifact = (Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    snapshot = (Path(__file__).parents[1] / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html").read_text(encoding="utf-8")
    js = (Path(__file__).parents[1] / "ui" / "modules" / "workfront" / "global-capacity.js").read_text(encoding="utf-8")
    css = (Path(__file__).parents[1] / "ui" / "modules" / "workfront" / "global-capacity.css").read_text(encoding="utf-8")
    for html in (artifact, snapshot):
        start = html.index('id="capacityModal"')
        end = html.index('id="capacityEditModal"', start)
        modal = html[start:end]
        assert modal.count('>Close</button>') == 1
        assert '<div class="modalfoot"></div>' in modal
        assert 'capacityFooterClose' not in modal
    assert "capacityFooterClose" not in js
    # The empty footer is retained only as the shared-shell boundary; the
    # ID-scoped rule must override the shared shell's fixed-height footer.
    assert "#capacityModal > .modal.capacity-modal > .modalfoot:empty{display:none;flex:0 0 0;min-height:0;height:0;padding:0;border:0;margin:0}" in css
    shell_css = (Path(__file__).parents[1] / "ui" / "shared" / "modal-shell-contract.css").read_text(encoding="utf-8")
    assert ".modalback > .modal.modal-shell-valid > .modalfoot{" in shell_css
    assert "capacityFooterClose" not in js
    assert js.count("getElementById('capacityClose').onclick") == 1
    assert "global-capacity.js?v=20261015-single-close" in artifact
    assert "global-capacity.css?v=20261015-single-close" in artifact
    assert "global-capacity.js?v=20261015-single-close" in snapshot
    assert "global-capacity.css?v=20261015-single-close" in snapshot


def test_add_equipment_unit_reference_hint_uses_compact_module_typography():
    artifact = (Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    snapshot = ARTIFACT.read_text(encoding="utf-8")
    for html in (artifact, snapshot):
        assert '<small class="equipment-unit-reference-hint">Select a registered unit to keep Equipment ID and Unit / Fleet No. linked.</small>' in html
        assert "equipment.css?v=20261015-unit-reference-hint" in html
    assert "#equipmentModal .equipment-unit-reference-hint{display:block;margin-top:4px;color:var(--muted);font-size:9px;line-height:1.35}" in EQUIPMENT_CSS
    assert ".equipment-unit-reference-hint" not in (Path(__file__).parents[1] / "ui" / "shared" / "form-field.css").read_text(encoding="utf-8")

def test_equipment_controls_order_and_nik_modal_initializes_after_dom_ready():
    artifact = (Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    snapshot = ARTIFACT.read_text(encoding="utf-8")
    for html in (artifact, snapshot):
        refresh = html.index('id="equipmentRefresh"')
        nik = html.index('id="equipmentNIKListButton"')
        units = html.index('id="equipmentUnitListButton"')
        capacity = html.index('id="globalCapacityButton"')
        add = html.index('id="equipmentAdd"')
        assert refresh < nik < units < capacity < add
    nik_js = NIK_JS
    assert "document.addEventListener('DOMContentLoaded',init,{once:true})" in nik_js
    assert "bind();" in nik_js
    modal_contract = (Path(__file__).parents[1] / "ui" / "shared" / "modal-show-contract.js").read_text(encoding="utf-8")
    assert "'equipmentNIKListModal'" in modal_contract
    assert "'equipmentNIKListModal'," in modal_contract


def test_equipment_owner_name_is_selected_from_canonical_nik_register():
    artifact = (Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    for html in (TEXT, artifact):
        assert '<label>Owner Name</label><select id="f_eq_owner_name"' in html
        assert 'id="f_eq_owner_name" placeholder="Owner / contractor name"' not in html
        assert 'Names are not entered manually.' in html
    assert "function populateOwnerNameOptions(selectedName)" in EQUIPMENT_JS
    assert "employee['Id No (NIK)']" in EQUIPMENT_JS
    assert "employee['Name Employment']" in EQUIPMENT_JS
    assert "owner_name:selectedOwnerName()" in EQUIPMENT_JS
    assert "registered Owner Name and Status are required." in EQUIPMENT_JS
    assert "lithosite:nik-records-updated" in EQUIPMENT_JS
    assert "global.LithositeNIK={" in NIK_JS
    assert "document.dispatchEvent(new CustomEvent('lithosite:nik-records-updated'" in NIK_JS
    assert "NIK list unavailable: '+esc(state.error" in NIK_JS


def test_nik_list_has_add_form_search_and_origin_filter_in_artifact_and_snapshot():
    artifact = (Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    for html in (TEXT, artifact):
        assert 'id="equipmentNIKAdd">Add NIK</button>' in html
        assert 'id="equipmentNIKSearch"' in html
        assert 'id="equipmentNIKOriginFilter"' in html
        assert 'id="equipmentNIKForm"' in html
        assert 'name="Id No (NIK)" required' in html
        assert 'name="Name Employment" required' in html
        assert 'id="equipmentNIKSave">Save NIK</button>' in html
        assert "nik.js?v=20261015-nik-crud-filter" in html
        assert "nik.css?v=20261015-nik-crud-filter" in html
    assert "operation:'CREATE',entity:'NIK',row:row" in NIK_JS
    assert "function filteredRows()" in NIK_JS
    assert "function syncOriginFilter()" in NIK_JS


def test_nik_list_modal_uses_canonical_a3_columns_and_read_only_runtime_data():
    artifact = (Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    snapshot = ARTIFACT.read_text(encoding="utf-8")
    expected_headers = (
        "Effective From", "Effective To", "Id No (NIK)",
        "Origin", "Name Employment", "Information",
    )
    for html in (artifact, snapshot):
        assert 'id="equipmentNIKListButton" aria-haspopup="dialog" aria-controls="equipmentNIKListModal">List NIK</button>' in html
        start = html.index('id="equipmentNIKListModal"')
        end = html.index('</body>', start)
        modal = html[start:end]
        assert modal.count('>Close</button>') == 1
        for header in expected_headers:
            assert f'<div class="equipment-nik-cell">{header}</div>' in modal
        assert 'id="equipmentNIKListRefresh"' in modal
        assert 'id="equipmentNIKListRows"' in modal
    for html in (artifact, snapshot):
        assert 'nik.css?v=20261015-nik-crud-filter' in html
        assert 'nik.js?v=20261015-nik-crud-filter' in html
    assert "rc.request({operation:'READ',entity:'NIK'})" in NIK_JS
    assert "function refresh()" in NIK_JS
    assert "function render()" in NIK_JS
    assert "operation:'CREATE',entity:'NIK'" in NIK_JS
    assert "equipmentNIKSearch" in NIK_JS
    assert "equipmentNIKOriginFilter" in NIK_JS
    assert "Id No (NIK) and Name Employment are required." in NIK_JS
    assert "equipmentNIKListButton" not in EQUIPMENT_JS
    assert "NIK employee register: read-only view of the canonical A.3 worksheet." in NIK_CSS
    assert "#equipmentNIKListModal .equipment-nik-row{" in NIK_CSS
    assert "equipmentNIKListModal" not in EQUIPMENT_CSS

