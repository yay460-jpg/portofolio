from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKER = (ROOT / "ui" / "modules" / "checker" / "checker.js").read_text(encoding="utf-8")
OPERATIONS = (ROOT / "ui" / "modules" / "operations" / "operations.js").read_text(encoding="utf-8")
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_existing_operations_can_backfill_missing_checker_rows():
    assert "async function syncMissingFromOperations(operations)" in CHECKER
    assert "entity: 'Checker'" in CHECKER
    assert "existingOperationIds.has(operationId)" in CHECKER
    assert "operation: 'CREATE'" in CHECKER
    assert "report.created += 1" in CHECKER


def test_checker_backfill_is_idempotent_and_does_not_overwrite_existing_evidence():
    assert "existingOperationIds.add(operationId)" in CHECKER
    assert "report.alreadyRecorded += 1" in CHECKER
    assert "A validated Operation is historical evidence. Never silently rewrite its" in CHECKER
    assert "syncMissingFromOperations: syncMissingFromOperations" in CHECKER


def test_checker_name_and_required_field_gates_are_not_fabricated():
    assert "if (!checkerName) return null;" in CHECKER
    assert "End Time is required when Checker Name is provided." in CHECKER
    assert "Shift is required when Checker Name is provided." in CHECKER
    assert "Equipment is required for a Checker observation." in CHECKER
    assert "retaseWithoutCheckerName" in CHECKER
    assert "Checker rows were not fabricated." in OPERATIONS


def test_operations_load_and_refresh_run_the_safe_backfill():
    assert "async function reconcileCheckerEvidence()" in OPERATIONS
    assert "syncMissingFromOperations(dataState.operations)" in OPERATIONS
    assert OPERATIONS.count("const checkerBackfill = await reconcileCheckerEvidence();") == 2
    assert "Checker evidence backfilled for " in OPERATIONS


def test_backfill_assets_use_fresh_cache_keys():
    assert "operations.js?v=20261108" in HTML
    assert "checker.js?v=20261013" in HTML
