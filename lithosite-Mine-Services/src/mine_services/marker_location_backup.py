import base64
import binascii
import json
import math
from datetime import datetime, timezone
from pathlib import Path


class MarkerLocationBackupManager:
    """Local Mine Services retention store for portable .ltmarker packages."""

    MAX_BACKUPS = 5
    MAX_PACKAGE_BYTES = 16 * 1024 * 1024
    MAGIC = b"LITMARKR"
    SUPPORTED_VERSION = 1
    VALID_STATUS = {"ACTIVE", "INACTIVE", "REMOVED"}
    ACTIVE_LIMITS = {
        "HSE": 5,
        "ASSET": 5,
        "WORKFRONT": 5,
        "FACILITY": 3,
        "WORKSHOP": 2,
        "STOCKPILE": 3,
        "DISPOSAL": 5,
        "DRAINAGE": 3,
        "OTHER": 3,
    }
    DOMAIN_ENTITIES = {
        "HSE": "HSE",
        "ASSET": "Equipment",
        "WORKFRONT": "WorkFront",
    }
    GLOBAL_TYPES = {"FACILITY", "WORKSHOP", "STOCKPILE", "DISPOSAL", "DRAINAGE", "OTHER"}
    REQUIRED_MARKER_FIELDS = {
        "marker_id",
        "marker_type",
        "label",
        "easting",
        "northing",
        "elevation",
        "source_entity",
        "source_id",
        "status",
    }

    def __init__(self, directory):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)

    def _files(self):
        return sorted(
            self.directory.glob("*.ltmarker"),
            key=lambda p: p.stat().st_mtime_ns,
            reverse=True,
        )

    @staticmethod
    def _safe_name(name):
        stem = Path(name or "").stem.strip() or "marker-location"
        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in stem)
        return (safe or "marker-location")[:96]

    @classmethod
    def _validate_markers(cls, markers):
        if not isinstance(markers, list):
            raise ValueError("Marker Location package must contain a marker list.")

        seen_ids = set()
        active_counts = {marker_type: 0 for marker_type in cls.ACTIVE_LIMITS}
        active_sources = set()

        for marker in markers:
            if not isinstance(marker, dict):
                raise ValueError("Marker Location package contains an invalid marker.")
            if not cls.REQUIRED_MARKER_FIELDS.issubset(marker):
                raise ValueError("Marker Location package contains an incomplete marker.")

            marker_id = str(marker["marker_id"]).strip()
            marker_type = str(marker["marker_type"]).strip().upper()
            label = str(marker["label"]).strip()
            source_entity = str(marker["source_entity"] or "").strip()
            source_id = str(marker["source_id"] or "").strip()
            status = str(marker["status"]).strip().upper()

            if not marker_id or marker_id in seen_ids:
                raise ValueError("Marker Location package contains duplicate marker_id values.")
            if marker_type not in cls.ACTIVE_LIMITS:
                raise ValueError(f"Invalid marker_type: {marker_type}.")
            if not label:
                raise ValueError(f"Marker {marker_id} requires a label.")
            if status not in cls.VALID_STATUS:
                raise ValueError(f"Invalid marker status: {status}.")
            coordinates = (marker["easting"], marker["northing"], marker["elevation"])
            if any(isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value)
                   for value in coordinates):
                raise ValueError(f"Marker {marker_id} coordinates must be finite numbers.")

            expected_entity = cls.DOMAIN_ENTITIES.get(marker_type)
            if expected_entity:
                if source_entity != expected_entity or not source_id:
                    raise ValueError(
                        f"{marker_type} marker {marker_id} requires source_entity={expected_entity} and source_id."
                    )
            elif marker_type in cls.GLOBAL_TYPES:
                if source_entity or source_id:
                    raise ValueError(
                        f"Global spatial marker {marker_id} must not contain source_entity or source_id."
                    )
            else:
                raise ValueError(f"Unsupported marker_type: {marker_type}.")

            if status == "ACTIVE":
                active_counts[marker_type] += 1
                if active_counts[marker_type] > cls.ACTIVE_LIMITS[marker_type]:
                    raise ValueError(
                        f"Marker Location limit reached for {marker_type}: "
                        f"{cls.ACTIVE_LIMITS[marker_type]} active spatial markers maximum."
                    )
                if expected_entity:
                    source_key = (source_entity, source_id)
                    if source_key in active_sources:
                        raise ValueError(
                            f"Spatial marker already assigned to {source_entity} {source_id}."
                        )
                    active_sources.add(source_key)

            seen_ids.add(marker_id)

    @classmethod
    def _decode(cls, package_base64):
        if not package_base64:
            raise ValueError("Marker Location package data is required.")
        try:
            payload = base64.b64decode(package_base64, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("Invalid Marker Location package encoding.") from exc

        if len(payload) > cls.MAX_PACKAGE_BYTES:
            raise ValueError("Marker Location package exceeds the 16 MB limit.")
        if len(payload) < 12 or payload[:8] != cls.MAGIC:
            raise ValueError("File is not a valid LT-MARKER package.")

        version = int.from_bytes(payload[8:12], "little")
        if version != cls.SUPPORTED_VERSION:
            raise ValueError(f"Unsupported LT-MARKER package version: {version}.")

        try:
            document = json.loads(payload[12:].decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("Marker Location package contains invalid JSON.") from exc

        if not isinstance(document, dict) or document.get("format") != "LT-MARKER":
            raise ValueError("File is not a valid LT-MARKER package.")
        if document.get("version") != cls.SUPPORTED_VERSION:
            raise ValueError("Unsupported LT-MARKER document version.")
        cls._validate_markers(document.get("markers"))
        return payload, document

    def save(self, package_base64, filename=None, source="runtime"):
        payload, document = self._decode(package_base64)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S-%f")[:-3]
        stem = self._safe_name(filename or "marker-location")
        target = self.directory / f"{stem}-{stamp}.ltmarker"
        suffix = 1
        while target.exists():
            target = self.directory / f"{stem}-{stamp}-{suffix}.ltmarker"
            suffix += 1

        target.write_bytes(payload)
        files = self._files()
        candidates = [path for path in files if path != target]
        removed = []
        for old in candidates[self.MAX_BACKUPS - 1:]:
            old.unlink(missing_ok=True)
            removed.append(old.name)

        stored = self._files()[: self.MAX_BACKUPS]
        result = self._info(target, source=source)
        result["marker_count"] = len(document["markers"])
        result["active_count"] = sum(
            1 for marker in document["markers"] if marker["status"] == "ACTIVE"
        )
        result["removed"] = removed
        result["storage_used"] = len(stored)
        result["storage_max"] = self.MAX_BACKUPS
        return result

    def list(self):
        return [self._info(path) for path in self._files()[: self.MAX_BACKUPS]]

    def read(self, filename):
        safe = Path(str(filename or "")).name
        if not safe.lower().endswith(".ltmarker") or safe != filename:
            raise ValueError("Invalid Marker Location backup name.")
        target = (self.directory / safe).resolve()
        try:
            target.relative_to(self.directory.resolve())
        except ValueError as exc:
            raise ValueError("Invalid Marker Location backup path.") from exc
        if not target.is_file():
            raise FileNotFoundError("Marker Location backup not found.")

        payload = target.read_bytes()
        _, document = self._decode(base64.b64encode(payload).decode("ascii"))
        result = self._info(target)
        result["marker_count"] = len(document["markers"])
        result["active_count"] = sum(
            1 for marker in document["markers"] if marker["status"] == "ACTIVE"
        )
        result["data"] = base64.b64encode(payload).decode("ascii")
        return result

    @staticmethod
    def _info(path, source=None):
        stat = path.stat()
        result = {
            "filename": path.name,
            "size_bytes": stat.st_size,
            "modified_at": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
            "format": "LT-MARKER",
            "package_version": 1,
        }
        if source:
            result["source"] = source
        return result
