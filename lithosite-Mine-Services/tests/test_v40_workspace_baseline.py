from pathlib import Path

ROOT = Path(__file__).parents[1]
V39_ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html"
V40_ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v40-STAGE29.html"
LOCK = ROOT / "Documentation" / "Version-History" / "Baseline" / "V39-Baseline-Lock.md"
WORKSPACE_DOC = ROOT / "Documentation" / "Version-History" / "V40-Workspace-Initialization.md"


def test_v40_has_a_new_artifact_and_preserves_the_locked_v39_artifact():
    assert V39_ARTIFACT.is_file()
    assert V40_ARTIFACT.is_file()
    lock = LOCK.read_text(encoding="utf-8")
    assert "**Status:** LOCKED / CLOSED TO FEATURE CHANGES" in lock
    assert "`v39-workspace`" in lock
    assert "434 passed in 27.15s" in lock


def test_desktop_host_and_launcher_open_the_v40_artifact():
    server = (ROOT / "desktop-host" / "server.py").read_text(encoding="utf-8")
    launcher = (ROOT / "desktop-host" / "start-mine-services.bat").read_text(encoding="utf-8")
    expected = "/Artifacts/Mine-Services-Operations.html"

    assert expected in server
    assert expected in launcher
    assert "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html" not in server
    assert "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html" not in launcher


def test_v40_workspace_lineage_and_plan_vs_actual_backlog_are_documented():
    doc = WORKSPACE_DOC.read_text(encoding="utf-8")

    assert "**Status:** OPEN WORKSPACE — NOT LOCKED" in doc
    assert "V39 baseline" in doc
    assert "Plan vs Actual cards in Work Control" in doc
    assert "has not been implemented by this copy/rename operation" in doc
