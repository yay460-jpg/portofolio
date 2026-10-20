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
    assert "if(!confirm(" not in GLOBAL_CAPACITY_JS
    assert "global.LithositeDeleteConfirmContract=Object.freeze" in DELETE_CONFIRM_CONTRACT
    assert 'id="globalDeleteConfirmModal"' not in ARTIFACT
    assert 'id="globalDeleteConfirmModal"' not in SNAPSHOT
    for html in (ARTIFACT, SNAPSHOT):
        assert "global-capacity.js?v=20261015-lithosite-delete-confirm" in html


def test_global_capacity_list_and_editor_have_independent_single_close_controls():
    import re

    for html in (ARTIFACT, SNAPSHOT):
        for modal_id, close_id in (
            ("capacityModal", "capacityClose"),
            ("capacityEditModal", "capacityEditClose"),
        ):
            start = html.find(f'<div class="modalback" id="{modal_id}"')
            assert start >= 0, f"Missing modal root: {modal_id}"
            if modal_id == "capacityModal":
                end = html.find('<div class="modalback" id="capacityEditModal"', start)
            else:
                end = html.find('<section id="maintenanceScreen"', start)
            assert end > start, f"Could not bound modal markup: {modal_id}"
            root = html[start:end]
            assert root.count(f'id="{close_id}"') == 1
            assert root.count(">Close</button>") == 1


def test_global_capacity_cache_keys_match_between_served_artifact_and_snapshot():
    import re

    pattern = r'\.\./ui/modules/workfront/global-capacity\.css\?v=([^"\']+)'
    for asset in (pattern, r'\.\./ui/modules/workfront/global-capacity\.js\?v=([^"\']+)'):
        served = re.search(asset, ARTIFACT)
        snapshot = re.search(asset, SNAPSHOT)
        assert served and snapshot
        assert served.group(1) == snapshot.group(1)
