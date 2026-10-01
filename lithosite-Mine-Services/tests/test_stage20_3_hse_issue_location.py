from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "hse-issue-location.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_hse_issue_location_engine_exists():
    assert ENGINE.exists()
    assert "createHSE" in SOURCE
    assert "createIssue" in SOURCE
    assert "boundsFromLocation" in SOURCE


def test_hse_issue_location_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_hse_and_issue_types_exist():
    assert "HSE: 'hse'" in SOURCE
    assert "ISSUE: 'issue'" in SOURCE


def test_hse_issue_require_id_and_location_crs():
    assert "hse.id" in SOURCE
    assert "issue.id" in SOURCE
    assert "location CRS is required" in SOURCE


def test_hse_preserves_domain_attributes():
    assert "severity:" in SOURCE
    assert "status:" in SOURCE
    assert "metadata:" in SOURCE


def test_issue_preserves_domain_attributes():
    assert "priority:" in SOURCE
    assert "status:" in SOURCE
    assert "metadata:" in SOURCE


def test_hse_issue_crs_must_match_reference():
    assert "assertSameCRS" in SOURCE
    assert "HSE/Issue CRS does not match reference CRS" in SOURCE


def test_hse_issue_bounds_are_location_based():
    assert "minX: item.location.x" in SOURCE
    assert "maxX: item.location.x" in SOURCE
    assert "minY: item.location.y" in SOURCE
    assert "maxY: item.location.y" in SOURCE


def test_hse_issue_exports_are_frozen():
    assert "MineServicesMapHSEIssueLocation" in SOURCE
    assert "Object.freeze" in SOURCE
