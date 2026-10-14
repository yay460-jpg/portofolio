import base64
from pathlib import Path

import pytest

from mine_services.topography_backup import TopographyBackupManager


def ltdtm_payload(version=2, body=b"demo"):
    return b"LITHODTM" + int(version).to_bytes(4, "little") + body


def test_ltdtm_backup_writes_local_package_and_lists_it(tmp_path):
    manager = TopographyBackupManager(tmp_path / "topography")
    payload = ltdtm_payload(body=b"package-one")

    result = manager.save(base64.b64encode(payload).decode("ascii"), filename="terrain.ltdtm")

    assert result["format"] == "LITHODTM"
    assert result["package_version"] == 2
    assert result["filename"].endswith(".ltdtm")
    assert (tmp_path / "topography" / result["filename"]).read_bytes() == payload
    assert manager.list()[0]["filename"] == result["filename"]


def test_ltdtm_backup_retains_only_five_newest(tmp_path):
    manager = TopographyBackupManager(tmp_path / "topography")
    for index in range(6):
        manager.save(
            base64.b64encode(ltdtm_payload(body=str(index).encode())).decode("ascii"),
            filename=f"terrain-{index}.ltdtm",
        )
    backups = manager.list()

    assert len(backups) == 5
    names = [item["filename"] for item in backups]
    assert all(name.endswith(".ltdtm") for name in names)
    assert len(list((tmp_path / "topography").glob("*.ltdtm"))) == 5


def test_ltdtm_backup_rejects_invalid_magic_and_version(tmp_path):
    manager = TopographyBackupManager(tmp_path / "topography")

    with pytest.raises(ValueError, match="valid LITHODTM"):
        manager.save(base64.b64encode(b"NOTLTDMTxxx").decode("ascii"))

    with pytest.raises(ValueError, match="Unsupported LITHODTM"):
        manager.save(base64.b64encode(ltdtm_payload(version=99)).decode("ascii"))


def test_ltdtm_backup_read_returns_exact_package_bytes(tmp_path):
    manager = TopographyBackupManager(tmp_path / "topography")
    payload = ltdtm_payload(body=b"exact-package")
    saved = manager.save(base64.b64encode(payload).decode("ascii"), filename="terrain.ltdtm")

    restored = manager.read(saved["filename"])

    assert restored["format"] == "LITHODTM"
    assert base64.b64decode(restored["data"]) == payload


def test_ltdtm_backup_rejects_path_traversal(tmp_path):
    manager = TopographyBackupManager(tmp_path / "topography")
    with pytest.raises(ValueError, match="Invalid LT-DTM backup name"):
        manager.read("../outside.ltdtm")


def test_ltdtm_backup_preflights_file_size_before_reading(tmp_path, monkeypatch):
    manager = TopographyBackupManager(tmp_path / "topography")
    monkeypatch.setattr(TopographyBackupManager, "MAX_PACKAGE_BYTES", 32)
    target = manager.directory / "oversized.ltdtm"
    target.write_bytes(ltdtm_payload(body=b"x" * 64))

    def fail_read_bytes(_self):
        raise AssertionError("backup read allocated file bytes before size preflight")

    monkeypatch.setattr(Path, "read_bytes", fail_read_bytes)
    with pytest.raises(ValueError, match="LT-DTM package"):
        manager.read(target.name)


def test_ltdtm_backup_preflights_encoded_size_before_base64_decode(tmp_path, monkeypatch):
    import mine_services.topography_backup as backup_module

    manager = TopographyBackupManager(tmp_path / "topography")
    monkeypatch.setattr(TopographyBackupManager, "MAX_PACKAGE_BYTES", 32)
    oversized_encoded = "A" * 48

    def fail_decode(*_args, **_kwargs):
        raise AssertionError("base64 decode ran before encoded-size preflight")

    monkeypatch.setattr(backup_module.base64, "b64decode", fail_decode)
    with pytest.raises(ValueError, match="LT-DTM package"):
        manager.save(oversized_encoded, filename="oversized")


def test_ltdtm_backup_write_failure_preserves_existing_backups(tmp_path, monkeypatch):
    manager = TopographyBackupManager(tmp_path / "topography")
    existing = manager.directory / "existing.ltdtm"
    original_payload = ltdtm_payload(body=b"stable")
    existing.write_bytes(original_payload)
    original_write_bytes = Path.write_bytes

    def fail_new_backup(path, data):
        if path.name.startswith("new-backup-"):
            raise OSError("simulated disk write failure")
        return original_write_bytes(path, data)

    monkeypatch.setattr(Path, "write_bytes", fail_new_backup)
    with pytest.raises(OSError, match="simulated disk write failure"):
        manager.save(base64.b64encode(ltdtm_payload(body=b"new")).decode("ascii"), filename="new-backup")

    assert existing.read_bytes() == original_payload
    assert sorted(path.name for path in manager.directory.iterdir()) == ["existing.ltdtm"]


def test_ltdtm_retention_failure_rolls_back_new_backup(tmp_path, monkeypatch):
    manager = TopographyBackupManager(tmp_path / "topography")
    for index in range(manager.MAX_BACKUPS):
        manager.save(
            base64.b64encode(ltdtm_payload(body=f"stable-{index}".encode())).decode("ascii"),
            filename=f"stable-{index}",
        )
    before = {path.name: path.read_bytes() for path in manager.directory.glob("*.ltdtm")}
    original_unlink = Path.unlink

    def fail_retention(path, *args, **kwargs):
        if path.suffix == ".ltdtm" and path.name in before:
            raise OSError("simulated retention cleanup failure")
        return original_unlink(path, *args, **kwargs)

    monkeypatch.setattr(Path, "unlink", fail_retention)
    with pytest.raises(OSError, match="simulated retention cleanup failure"):
        manager.save(
            base64.b64encode(ltdtm_payload(body=b"new")).decode("ascii"),
            filename="new-package",
        )

    assert {path.name: path.read_bytes() for path in manager.directory.glob("*.ltdtm")} == before


def test_ltdtm_partial_retention_failure_restores_evicted_backups(tmp_path, monkeypatch):
    manager = TopographyBackupManager(tmp_path / "topography")
    for index in range(manager.MAX_BACKUPS + 1):
        (manager.directory / f"stable-{index}.ltdtm").write_bytes(
            ltdtm_payload(body=f"stable-{index}".encode())
        )
    before = {path.name: path.read_bytes() for path in manager.directory.glob("*.ltdtm")}
    original_unlink = Path.unlink
    removed_once = []

    def fail_second_retention_unlink(path, *args, **kwargs):
        if path.suffix == ".ltdtm" and path.name in before:
            if removed_once:
                raise OSError("simulated second retention cleanup failure")
            removed_once.append(path.name)
        return original_unlink(path, *args, **kwargs)

    monkeypatch.setattr(Path, "unlink", fail_second_retention_unlink)
    with pytest.raises(OSError, match="simulated second retention cleanup failure"):
        manager.save(
            base64.b64encode(ltdtm_payload(body=b"new")).decode("ascii"),
            filename="new-package",
        )

    assert {path.name: path.read_bytes() for path in manager.directory.glob("*.ltdtm")} == before
