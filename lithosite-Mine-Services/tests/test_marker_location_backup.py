import base64
from pathlib import Path

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


def test_marker_backup_atomic_write_does_not_leave_partial_package(tmp_path, monkeypatch):
    directory = tmp_path / "marker-location"
    manager = MarkerLocationBackupManager(directory)
    package_data = package([marker("ML-ATOMIC-001")])
    original_replace = Path.replace

    def fail_temp_replace(path, target):
        if path.parent == directory and path.suffix == ".tmp":
            raise OSError("simulated backup commit failure")
        return original_replace(path, target)

    monkeypatch.setattr(Path, "replace", fail_temp_replace)
    with pytest.raises(OSError, match="simulated backup commit failure"):
        manager.save(package_data, filename="markers")

    assert list(directory.iterdir()) == []


def test_marker_backup_rejects_oversized_base64_before_decode(tmp_path, monkeypatch):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    monkeypatch.setattr(MarkerLocationBackupManager, "MAX_PACKAGE_BYTES", 12)

    def decoding_must_not_run(*args, **kwargs):
        raise AssertionError("base64 payload should be size-checked before decoding")

    monkeypatch.setattr("mine_services.marker_location_backup.base64.b64decode", decoding_must_not_run)
    oversized = "A" * (4 * ((12 + 2) // 3) + 1)
    with pytest.raises(ValueError, match="exceeds"):
        manager.save(oversized)



def test_marker_listing_skips_entries_whose_metadata_cannot_be_read(tmp_path, monkeypatch):
    directory = tmp_path / "marker-location"
    manager = MarkerLocationBackupManager(directory)
    saved = manager.save(package([marker("ML-VALID-001")]))
    unreadable = directory / "unreadable.ltmarker"
    unreadable.write_bytes(base64.b64decode(package([marker("ML-BROKEN-001")])))

    original_stat = Path.stat

    def selective_stat(path, *args, **kwargs):
        if path == unreadable:
            raise OSError("simulated metadata read failure")
        return original_stat(path, *args, **kwargs)

    monkeypatch.setattr(Path, "stat", selective_stat)
    listed = manager.list()

    assert [entry["filename"] for entry in listed] == [saved["filename"]]
