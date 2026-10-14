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


def test_marker_backup_preflights_file_size_before_reading(tmp_path, monkeypatch):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    monkeypatch.setattr(MarkerLocationBackupManager, "MAX_PACKAGE_BYTES", 32)
    target = manager.directory / "oversized.ltmarker"
    target.write_bytes(b"x" * 64)

    def fail_read_bytes(_self):
        raise AssertionError("backup read allocated file bytes before size preflight")

    monkeypatch.setattr(Path, "read_bytes", fail_read_bytes)
    with pytest.raises(ValueError, match="Marker Location package"):
        manager.read(target.name)


def test_marker_backup_preflights_encoded_size_before_base64_decode(monkeypatch, tmp_path):
    import mine_services.marker_location_backup as backup_module

    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    monkeypatch.setattr(MarkerLocationBackupManager, "MAX_PACKAGE_BYTES", 32)
    oversized_encoded = "A" * 48

    def fail_decode(*_args, **_kwargs):
        raise AssertionError("base64 decode ran before encoded-size preflight")

    monkeypatch.setattr(backup_module.base64, "b64decode", fail_decode)
    with pytest.raises(ValueError, match="Marker Location package"):
        manager.save(oversized_encoded, filename="oversized")


def test_marker_backup_write_failure_preserves_existing_backups(tmp_path, monkeypatch):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    existing = manager.directory / "existing.ltmarker"
    original_payload = base64.b64decode(package([marker("ML-EXISTING")]))
    existing.write_bytes(original_payload)
    original_write_bytes = Path.write_bytes

    def fail_new_backup(path, data):
        if path.name.startswith("new-backup-"):
            raise OSError("simulated disk write failure")
        return original_write_bytes(path, data)

    monkeypatch.setattr(Path, "write_bytes", fail_new_backup)
    with pytest.raises(OSError, match="simulated disk write failure"):
        manager.save(package([marker("ML-NEW")]), filename="new-backup")

    assert existing.read_bytes() == original_payload
    assert sorted(path.name for path in manager.directory.iterdir()) == ["existing.ltmarker"]


def test_marker_retention_failure_rolls_back_new_backup(tmp_path, monkeypatch):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    for index in range(manager.MAX_BACKUPS):
        manager.save(package([marker(f"ML-STABLE-{index}")]), filename=f"stable-{index}")
    before = {path.name: path.read_bytes() for path in manager.directory.glob("*.ltmarker")}
    original_unlink = Path.unlink

    def fail_retention(path, *args, **kwargs):
        if path.suffix == ".ltmarker" and path.name in before:
            raise OSError("simulated retention cleanup failure")
        return original_unlink(path, *args, **kwargs)

    monkeypatch.setattr(Path, "unlink", fail_retention)
    with pytest.raises(OSError, match="simulated retention cleanup failure"):
        manager.save(package([marker("ML-NEW")]), filename="new-package")

    assert {path.name: path.read_bytes() for path in manager.directory.glob("*.ltmarker")} == before


def test_marker_partial_retention_failure_restores_evicted_backups(tmp_path, monkeypatch):
    manager = MarkerLocationBackupManager(tmp_path / "marker-location")
    for index in range(manager.MAX_BACKUPS + 1):
        (manager.directory / f"stable-{index}.ltmarker").write_bytes(
            base64.b64decode(package([marker(f"ML-STABLE-{index}")]))
        )
    before = {path.name: path.read_bytes() for path in manager.directory.glob("*.ltmarker")}
    original_unlink = Path.unlink
    removed_once = []

    def fail_second_retention_unlink(path, *args, **kwargs):
        if path.suffix == ".ltmarker" and path.name in before:
            if removed_once:
                raise OSError("simulated second retention cleanup failure")
            removed_once.append(path.name)
        return original_unlink(path, *args, **kwargs)

    monkeypatch.setattr(Path, "unlink", fail_second_retention_unlink)
    with pytest.raises(OSError, match="simulated second retention cleanup failure"):
        manager.save(package([marker("ML-NEW")]), filename="new-package")

    assert {path.name: path.read_bytes() for path in manager.directory.glob("*.ltmarker")} == before
