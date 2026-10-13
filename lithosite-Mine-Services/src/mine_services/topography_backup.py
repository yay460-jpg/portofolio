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
    def _preflight_encoded_size(cls, package_base64):
        if not isinstance(package_base64, (str, bytes, bytearray)):
            raise ValueError("Invalid LT-DTM package encoding.")
        try:
            encoded = package_base64.encode("ascii") if isinstance(package_base64, str) else bytes(package_base64)
        except (UnicodeEncodeError, ValueError, TypeError) as exc:
            raise ValueError("Invalid LT-DTM package encoding.") from exc

        # Reject excessive transport data before allocating the decoded payload.
        max_encoded_bytes = 4 * ((cls.MAX_PACKAGE_BYTES + 2) // 3)
        if len(encoded) > max_encoded_bytes:
            raise ValueError("LT-DTM package exceeds the allowed size limit.")
        padding = 2 if encoded.endswith(b"==") else 1 if encoded.endswith(b"=") else 0
        estimated_decoded_bytes = (len(encoded) // 4) * 3 - padding
        if estimated_decoded_bytes > cls.MAX_PACKAGE_BYTES:
            raise ValueError("LT-DTM package exceeds the allowed size limit.")
        return package_base64

    @classmethod
    def _read_bounded(cls, target):
        # Stat first, then read at most limit + 1 to remain safe if the file
        # changes between stat and open.
        if target.stat().st_size > cls.MAX_PACKAGE_BYTES:
            raise ValueError("LT-DTM package exceeds the allowed size limit.")
        with target.open("rb") as stream:
            payload = stream.read(cls.MAX_PACKAGE_BYTES + 1)
        if len(payload) > cls.MAX_PACKAGE_BYTES:
            raise ValueError("LT-DTM package exceeds the allowed size limit.")
        return payload

    @classmethod
    def _validate_bytes(cls, payload):
        if not payload or len(payload) < 12:
            raise ValueError("File is not a valid LITHODTM package.")
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
        self._preflight_encoded_size(package_base64)
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
        removed = []
        # Never evict the package just written. If filesystem timestamps tie,
        # the new target may not sort first, so retain it explicitly.
        candidates = [path for path in files if path != target]
        try:
            for old in candidates[self.MAX_BACKUPS - 1:]:
                old.unlink(missing_ok=True)
                removed.append(old.name)
        except OSError:
            # Do not leave a newly written backup behind when retention fails.
            # This rolls back the new file; previously removed files cannot be
            # restored if a later unlink fails after earlier deletions succeeded.
            target.unlink(missing_ok=True)
            raise
        stored = self._files()[: self.MAX_BACKUPS]
        result = self._info(target, source=source)
        result["removed"] = removed
        result["storage_used"] = len(stored)
        result["storage_max"] = self.MAX_BACKUPS
        return result

    def list(self):
        backups = self._files()[: self.MAX_BACKUPS]
        return [self._info(path) for path in backups]

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
        payload = self._read_bounded(target)
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
