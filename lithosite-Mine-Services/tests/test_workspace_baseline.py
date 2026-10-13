from pathlib import Path

ROOT = Path(__file__).parents[1]
ACTIVE_ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
LEGACY_ARTIFACTS = (
    ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html",
    ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v40-STAGE29.html",
)
LOCK = ROOT / "Documentation" / "Version-History" / "Baseline" / "Baseline-Lock-Archive-B.md"


def test_runtime_has_one_version_neutral_canonical_artifact():
    assert ACTIVE_ARTIFACT.is_file()
    assert all(not artifact.exists() for artifact in LEGACY_ARTIFACTS)


def test_desktop_host_and_launcher_open_the_canonical_artifact():
    server = (ROOT / "desktop-host" / "server.py").read_text(encoding="utf-8")
    launcher = (ROOT / "desktop-host" / "start-mine-services.bat").read_text(encoding="utf-8")
    expected = "/Artifacts/Mine-Services-Operations.html"
    assert expected in server
    assert expected in launcher


def test_historical_baseline_lock_records_the_release_decision():
    doc = LOCK.read_text(encoding="utf-8")
    assert "**Status:** LOCKED" in doc
    assert "Full Pytest #451" in doc
    assert "Plan vs Actual" in doc
    assert "HOLD" in doc
