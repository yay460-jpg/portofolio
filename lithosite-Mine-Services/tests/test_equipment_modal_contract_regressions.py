from pathlib import Path


ROOT = Path(__file__).parents[1]
EQUIPMENT_JS = ROOT / "ui" / "modules" / "equipment" / "equipment.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
SNAPSHOT = ROOT / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html"


def test_equipment_status_does_not_claim_parallel_browser_persistence():
    js = EQUIPMENT_JS.read_text(encoding="utf-8")
    assert "RuntimeAdapter connected — canonical records loaded." in js
    assert "offline local persistence active" not in js


def test_equipment_save_reports_refresh_failure_without_claiming_refresh_success():
    js = EQUIPMENT_JS.read_text(encoding="utf-8")
    start = js.index("async function save()")
    end = js.index("\nasync function remove(", start)
    save = js[start:end]

    assert "const refreshed=await refreshData();" in save
    assert "if(refreshed){" in save
    assert "Equipment creation committed, but the list could not refresh." in save
    assert "Equipment update committed, but the list could not refresh." in save
    assert "await refreshUnitList()" not in save
    assert "renderUnitList()" not in save


def test_equipment_served_artifact_and_snapshot_load_current_contract_asset():
    artifact = ARTIFACT.read_text(encoding="utf-8")
    snapshot = SNAPSHOT.read_text(encoding="utf-8")
    marker = "equipment.js?v=20261016-capacity-profile-guard"

    assert marker in artifact
    assert marker in snapshot



def test_equipment_add_and_edit_clear_stale_operation_message():
    js = EQUIPMENT_JS.read_text(encoding="utf-8")
    reset = js[js.index("function resetForm()"):js.index("\nfunction openAdd(")]
    edit = js[js.index("function openEdit("):js.index("\nfunction payload()")]

    assert "setMsg('');" in reset
    assert "setMsg('');" in edit


def test_equipment_cancel_closes_form_without_runtime_mutation_and_restores_unit_list():
    js = EQUIPMENT_JS.read_text(encoding="utf-8")
    close = js[js.index("function closeEquipmentForm()"):js.index("\nfunction bind()")]
    bind = js[js.index("function bind()"):js.index("\ndocument.addEventListener('mine-services:open-domain-record'")]

    assert "global.LithositeModalShowContract.close('equipmentModal')" in close
    assert "global.LithositeModalShowContract.show('equipmentUnitListModal')" in close
    assert "refreshUnitList()" in close
    assert "rc.request" not in close
    assert "document.getElementById('equipmentCancel').onclick=closeEquipmentForm;" in bind


def test_equipment_edit_preserves_unavailable_capacity_reference_until_user_resolves_it():
    js = EQUIPMENT_JS.read_text(encoding="utf-8")
    fill = js[js.index("function fillCapacityProfiles("):js.index("\nfunction populateOwnerNameOptions(")]
    summary = js[js.index("function updateCapacitySummary("):js.index("\nfunction resetForm()")]
    save = js[js.index("async function save()"):js.index("\nasync function remove(")]

    assert "Unavailable Global Capacity profile — " in fill
    assert "missing.disabled=true;" in fill
    assert "Global Capacity profile is optional for this equipment type." in summary
    assert "Global Capacity profile is required for Dump Truck." in summary
    assert "The selected Global Capacity profile is unavailable." in save
    assert "f_eq_type').addEventListener('change',updateCapacitySummary)" in js


def test_equipment_capacity_profile_placeholders_explain_unresolved_values():
    artifact = ARTIFACT.read_text(encoding="utf-8")
    snapshot = SNAPSHOT.read_text(encoding="utf-8")

    assert 'placeholder="Select a valid Global Capacity profile"' in artifact
    assert 'placeholder="Select a valid Global Capacity profile"' in snapshot
    assert "equipment.js?v=20261016-capacity-profile-guard" in artifact
    assert "equipment.js?v=20261016-capacity-profile-guard" in snapshot
