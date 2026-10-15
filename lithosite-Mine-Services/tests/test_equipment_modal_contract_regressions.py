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
    marker = "equipment.js?v=20261015-equipment-contract-audit2"

    assert marker in artifact
    assert marker in snapshot
