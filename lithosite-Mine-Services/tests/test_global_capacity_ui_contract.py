from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = (ROOT / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
SNAPSHOT = (ROOT / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html").read_text(encoding="utf-8")
GLOBAL_CAPACITY_JS = (ROOT / "ui" / "modules" / "workfront" / "global-capacity.js").read_text(encoding="utf-8")
DELETE_CONFIRM_CONTRACT = (ROOT / "ui" / "shared" / "delete-confirm-contract.js").read_text(encoding="utf-8")


def test_global_capacity_delete_uses_shared_lithosite_confirmation():
    assert "global.LithositeDeleteConfirmContract.confirm({" in GLOBAL_CAPACITY_JS
    assert "actionLabel:'Delete Global Capacity'" in GLOBAL_CAPACITY_JS
    assert "entity:'Global Capacity'" in GLOBAL_CAPACITY_JS
    assert "Runtime will reject deletion" not in GLOBAL_CAPACITY_JS
    assert "if(!confirm(" not in GLOBAL_CAPACITY_JS
    assert "global.LithositeDeleteConfirmContract=Object.freeze" in DELETE_CONFIRM_CONTRACT
    assert 'id="globalDeleteConfirmModal"' not in ARTIFACT
    assert 'id="globalDeleteConfirmModal"' not in SNAPSHOT
    for html in (ARTIFACT, SNAPSHOT):
        assert "global-capacity.js?v=20261015-lithosite-delete-confirm" in html
