from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"


def test_shared_delete_contract_is_loaded_before_entity_modules():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/shared/delete-confirm-contract.css" in html
    shared = html.index("../ui/shared/delete-confirm-contract.js")
    for module in ("equipment/equipment.js", "workfront/workfront.js",
                   "operations/operations.js", "maintenance/maintenance.js",
                   "issues/issues.js", "hse/hse.js", "plans/plans.js"):
        assert shared < html.index("../ui/modules/" + module)


def test_entity_deletions_use_shared_confirmation():
    for module in ("equipment/equipment", "workfront/workfront",
                   "operations/operations", "maintenance/maintenance",
                   "issues/issues", "hse/hse", "plans/plans"):
        source = (ROOT / "ui" / "modules" / (module + ".js")).read_text(encoding="utf-8")
        assert "LithositeDeleteConfirmContract.confirm(" in source


def test_shared_confirmation_keeps_cancel_and_evidence_options():
    source = (ROOT / "ui" / "shared" / "delete-confirm-contract.js").read_text(encoding="utf-8")
    for token in ("globalDeleteConfirmCancel", "evidenceFolder", "settle(false)", "LithositeModalShowContract"):
        assert token in source.replace("globalDeleteCancel", "globalDeleteConfirmCancel")
