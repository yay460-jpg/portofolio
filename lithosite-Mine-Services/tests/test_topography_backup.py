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


def test_ltdtm_backup_atomic_write_does_not_leave_partial_package(tmp_path, monkeypatch):
    directory = tmp_path / "topography"
    manager = TopographyBackupManager(directory)
    payload = ltdtm_payload(body=b"must-not-be-partially-committed")
    original_replace = Path.replace

    def fail_temp_replace(path, target):
        if path.parent == directory and path.suffix == ".tmp":
            raise OSError("simulated backup commit failure")
        return original_replace(path, target)

    monkeypatch.setattr(Path, "replace", fail_temp_replace)
    with pytest.raises(OSError, match="simulated backup commit failure"):
        manager.save(base64.b64encode(payload).decode("ascii"), filename="terrain")

    assert list(directory.iterdir()) == []


def test_ltdtm_backup_rejects_oversized_base64_before_decode(tmp_path, monkeypatch):
    manager = TopographyBackupManager(tmp_path / "topography")
    monkeypatch.setattr(TopographyBackupManager, "MAX_PACKAGE_BYTES", 12)

    def decoding_must_not_run(*args, **kwargs):
        raise AssertionError("base64 payload should be size-checked before decoding")

    monkeypatch.setattr("mine_services.topography_backup.base64.b64decode", decoding_must_not_run)
    oversized = "A" * (4 * ((12 + 2) // 3) + 1)
    with pytest.raises(ValueError, match="exceeds"):
        manager.save(oversized)



def test_ltdtm_listing_skips_entries_whose_metadata_cannot_be_read(tmp_path, monkeypatch):
    directory = tmp_path / "topography"
    manager = TopographyBackupManager(directory)
    saved = manager.save(base64.b64encode(ltdtm_payload(body=b"valid")).decode("ascii"))
    unreadable = directory / "unreadable.ltdtm"
    unreadable.write_bytes(ltdtm_payload(body=b"damaged entry"))

    original_stat = Path.stat

    def selective_stat(path, *args, **kwargs):
        if path == unreadable:
            raise OSError("simulated metadata read failure")
        return original_stat(path, *args, **kwargs)

    monkeypatch.setattr(Path, "stat", selective_stat)
    listed = manager.list()

    assert [entry["filename"] for entry in listed] == [saved["filename"]]
