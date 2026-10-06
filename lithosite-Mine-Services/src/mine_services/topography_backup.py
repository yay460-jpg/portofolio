import base64
import binascii
from datetime import datetime, timezone
from pathlib import Path


class TopographyBackupManager:
    """Local Mine Services retention store for portable .ltdtm packages."""

    MAX_BACKUPS = 5
    MAX_PACKAGE_BYTES = 128 * 1024 * 1024
    MAGIC = b"LITHODTM"
    SUPPORTED_VERSION = 2

    def __init__(self, directory):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)

    def _files(self):
        return sorted(
            self.directory.glob("*.ltdtm"),
            key=lambda p: p.stat().st_mtime_ns,
            reverse=True,
        )

    @staticmethod
    def _safe_name(name):
        stem = Path(name or "").stem.strip() or "topography-backup"
        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in stem)
        return (safe or "topography-backup")[:96]

    @classmethod
    def _validate_bytes(cls, payload):
        if not payload or len(payload) < 12:
            raise ValueError("Invalid LT-DTM package.")
        if len(payload) > cls.MAX_PACKAGE_BYTES:
            raise ValueError("LT-DTM package exceeds the 128 MB limit.")
        if payload[:8] != cls.MAGIC:
            raise ValueError("File is not a valid LITHODTM package.")
        version = int.from_bytes(payload[8:12], "little")
        if version != cls.SUPPORTED_VERSION:
            raise ValueError(f"Unsupported LITHODTM package version: {version}.")

    def save(self, package_base64, filename=None, source="runtime"):
        if not package_base64:
            raise ValueError("LT-DTM package data is required.")
        try:
            payload = base64.b64decode(package_base64, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("Invalid LT-DTM package encoding.") from exc
        self._validate_bytes(payload)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S-%f")[:-3]
        stem = self._safe_name(filename or "topography")
        target = self.directory / f"{stem}-{stamp}.ltdtm"
        suffix = 1
        while target.exists():
            target = self.directory / f"{stem}-{stamp}-{suffix}.ltdtm"
            suffix += 1
        target.write_bytes(payload)
        files = self._files()
        for old in files[self.MAX_BACKUPS:]:
            old.unlink(missing_ok=True)
        return self._info(target, source=source)

    def list(self):
        return [self._info(path) for path in self._files()[: self.MAX_BACKUPS]]

    def read(self, filename):
        safe = Path(str(filename or "")).name
        if not safe.lower().endswith(".ltdtm") or safe != filename:
            raise ValueError("Invalid LT-DTM backup name.")
        target = (self.directory / safe).resolve()
        try:
            target.relative_to(self.directory.resolve())
        except ValueError as exc:
            raise ValueError("Invalid LT-DTM backup path.") from exc
        if not target.is_file():
            raise FileNotFoundError("Topography backup not found.")
        payload = target.read_bytes()
        self._validate_bytes(payload)
        return {**self._info(target), "data": base64.b64encode(payload).decode("ascii")}

    @staticmethod
    def _info(path, source=None):
        stat = path.stat()
        result = {
            "filename": path.name,
            "size_bytes": stat.st_size,
            "modified_at": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
            "format": "LITHODTM",
            "package_version": 2,
        }
        if source:
            result["source"] = source
        return result
