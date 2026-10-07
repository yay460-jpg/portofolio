import base64

import pytest

from mine_services.marker_location_backup import MarkerLocationBackupManager


def marker(marker_id, marker_type="HSE", status="ACTIVE", source_entity="HSE", source_id="HSE-001"):
    if marker_type in {"FACILITY", "WORKSHOP", "STOCKPILE", "DISPOSAL", "DRAINAGE", "OTHER"}:
        source_entity = ""
        source_id = ""
    return {
        "marker_id": marker_id,
        "marker_type": marker_type,
        "label": marker_id,
        "easting": 500000.0,
        "northing": 9600000.0,
        "elevation": 100.0,
        "source_entity": source_entity,
        "source_id": source_id,
        "status": status,
    }


def package(markers, version=1):
    payload = b"LITMARKR" + int(version).to_bytes(4, "little")
    import json
    payload += json.dumps({"format": "LT-MARKER", "version": version, "markers": markers}).encode()
    return base64.b64encode(payload).decode("ascii")


def test_marker_backup_writes_and_reads_package(tmp_path):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    saved = manager.save(package([marker("ML-0001")]), filename="markers")

    assert saved["format"] == "LT-MARKER"
    assert saved["package_version"] == 1
    restored = manager.read(saved["filename"])
    assert base64.b64decode(restored["data"]).startswith(b"LITMARKR")
    assert restored["marker_count"] == 1


def test_marker_backup_retains_only_five(tmp_path):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    for index in range(6):
        manager.save(package([marker(f"ML-{index:04d}")]), filename=f"markers-{index}")

    assert len(manager.list()) == 5
    assert len(list((tmp_path / "marker-location").glob("*.ltmarker"))) == 5


def test_marker_backup_enforces_each_active_limit(tmp_path):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    rows = [marker(f"ML-{index:04d}", marker_type="FACILITY") for index in range(4)]

    with pytest.raises(ValueError, match="(?i)Facility"):
        manager.save(package(rows))


def test_marker_backup_rejects_duplicate_active_domain_source(tmp_path):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    rows = [marker("ML-0001", source_id="HSE-001"), marker("ML-0002", source_id="HSE-001")]

    with pytest.raises(ValueError, match="already assigned"):
        manager.save(package(rows))


def test_marker_backup_rejects_global_domain_source_fields(tmp_path):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    row = marker("ML-0001", marker_type="FACILITY")
    row["source_entity"] = "HSE"
    row["source_id"] = "HSE-001"

    with pytest.raises(ValueError, match="must not contain"):
        manager.save(package([row]))


def test_marker_backup_rejects_invalid_package_version(tmp_path):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")

    with pytest.raises(ValueError, match="Unsupported LT-MARKER"):
        manager.save(package([marker("ML-0001")], version=99))
