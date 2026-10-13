import base64
import binascii
import tempfile
import stat
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
        files = []
        for path in self.directory.glob("*.ltdtm"):
            try:
                if path.is_symlink():
                    continue
                info = path.stat()
            except (OSError, RuntimeError):
                continue
            if not stat.S_ISREG(info.st_mode):
                continue
            files.append((info.st_mtime_ns, path))
        files.sort(key=lambda item: item[0], reverse=True)
        return [path for _, path in files]

    @staticmethod
    def _safe_name(name):
        stem = Path(name or "").stem.strip() or "topography-backup"
        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in stem)
        return (safe or "topography-backup")[:96]

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

    @classmethod
    def _decode_base64(cls, package_base64):
        if not package_base64:
            raise ValueError("LT-DTM package data is required.")
        if not isinstance(package_base64, (str, bytes, bytearray)):
            raise ValueError("Invalid LT-DTM package encoding.")
        max_encoded_length = 4 * ((cls.MAX_PACKAGE_BYTES + 2) // 3)
        if len(package_base64) > max_encoded_length:
            raise ValueError("LT-DTM package exceeds the 128 MB limit.")
        try:
            return base64.b64decode(package_base64, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("Invalid LT-DTM package encoding.") from exc

    @staticmethod
    def _atomic_write(target, payload):
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="wb",
                prefix="." + target.name + ".",
                suffix=".tmp",
                dir=target.parent,
                delete=False,
            ) as handle:
                temp_path = Path(handle.name)
                handle.write(payload)
                handle.flush()
            temp_path.replace(target)
        finally:
            if temp_path is not None and temp_path.exists():
                temp_path.unlink()

    def save(self, package_base64, filename=None, source="runtime"):
        payload = self._decode_base64(package_base64)
        self._validate_bytes(payload)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S-%f")[:-3]
        stem = self._safe_name(filename or "topography")
        target = self.directory / f"{stem}-{stamp}.ltdtm"
        suffix = 1
        while target.exists():
            target = self.directory / f"{stem}-{stamp}-{suffix}.ltdtm"
            suffix += 1
        self._atomic_write(target, payload)
        files = self._files()
        removed = []
        # Never evict the package just written. If filesystem timestamps tie,
        # the new target may not sort first, so retain it explicitly.
        candidates = [path for path in files if path != target]
        for old in candidates[self.MAX_BACKUPS - 1:]:
            old.unlink(missing_ok=True)
            removed.append(old.name)
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
