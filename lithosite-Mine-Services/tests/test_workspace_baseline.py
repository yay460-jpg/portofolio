import re
from pathlib import Path

ROOT = Path(__file__).parents[1]
ACTIVE_ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
ARTIFACTS_DIR = ROOT / "Artifacts"
BASELINE_DOCS = ROOT / "Documentation" / "Version-History" / "Baseline"
VERSIONED_TEST_FILENAME = re.compile(r"(?i)(?:^|[_-])(?:stage[-_]?\d+|v\d+(?:\.\d+)*)(?=[_.-]|$)")


def test_runtime_has_one_version_neutral_canonical_artifact():
    assert ACTIVE_ARTIFACT.is_file()
    html_artifacts = sorted(ARTIFACTS_DIR.glob("*.html"), key=lambda path: path.name)
    assert [path.name for path in html_artifacts] == [ACTIVE_ARTIFACT.name]


def test_desktop_host_and_launcher_open_the_canonical_artifact():
    server = (ROOT / "desktop-host" / "server.py").read_text(encoding="utf-8")
    launcher = (ROOT / "desktop-host" / "start-mine-services.bat").read_text(encoding="utf-8")
    expected = "/Artifacts/Mine-Services-Operations.html"
    assert expected in server
    assert expected in launcher


def test_locked_baseline_records_the_release_decision():
    index = (BASELINE_DOCS / "README.md").read_text(encoding="utf-8")
    match = re.search(r"\[[^\]]+\]\(([^)]+-Baseline-Lock\.md)\)", index)
    assert match, "Baseline index must identify the current lock record"

    lock_path = (BASELINE_DOCS / match.group(1)).resolve()
    assert lock_path.parent == BASELINE_DOCS.resolve()
    document = lock_path.read_text(encoding="utf-8")
    assert "**Status:** LOCKED" in document
    assert "Full Pytest #" in document
    assert "Plan vs Actual" in document
    assert "HOLD" in document


def test_active_test_filenames_are_version_neutral():
    tests_dir = ROOT / "tests"
    offenders = [
        path.name
        for path in tests_dir.iterdir()
        if path.is_file()
        and path.name.startswith("test_")
        and VERSIONED_TEST_FILENAME.search(path.name)
    ]
    assert not offenders, f"Versioned test filenames remain: {offenders}"
