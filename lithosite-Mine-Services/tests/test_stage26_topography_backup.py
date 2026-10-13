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
