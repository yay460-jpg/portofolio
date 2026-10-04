import hashlib
import json
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path


class KPIHistoryStore:
    """Append-only KPI final snapshot store for V34 Stage 23."""

    VERSION = "V34-KPI-SNAPSHOT-STORE-1"

    def __init__(self, path=None):
        self.path = Path(path) if path else None
        self._records = []
        self._load()

    @staticmethod
    def _fingerprint(snapshot):
        raw = json.dumps(
            snapshot,
            sort_keys=True,
            default=str,
            separators=(",", ":"),
            ensure_ascii=False,
        ).encode("utf-8")
        return hashlib.sha256(raw).hexdigest()

    @staticmethod
    def _now():
        return datetime.now(timezone.utc).isoformat()

    def _load(self):
        self._records = []
        if not self.path or not self.path.exists():
            return
        with self.path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        if payload.get("store_version") != self.VERSION:
            raise ValueError("KPI_SNAPSHOT_STORE_VERSION")
        records = payload.get("snapshots", [])
        if not isinstance(records, list):
            raise ValueError("KPI_SNAPSHOT_STORE_INVALID")
        self._records = records

    def _save(self):
        if not self.path:
            return
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "store_version": self.VERSION,
            "updated_at": self._now(),
            "snapshots": self._records,
        }
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            prefix=self.path.stem + ".",
            suffix=self.path.suffix,
            dir=self.path.parent,
            delete=False,
        ) as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
            temp_path = Path(handle.name)
        try:
            temp_path.replace(self.path)
        finally:
            if temp_path.exists():
                temp_path.unlink()

    @staticmethod
    def _natural_key(snapshot):
        return (
            str(snapshot.get("scope_type") or ""),
            str(snapshot.get("scope_id") or ""),
            str(snapshot.get("period_id") or ""),
        )

    def list(self, scope_id=None, period_id=None):
        records = list(self._records)
        if scope_id not in (None, ""):
            records = [x for x in records if x.get("scope_id") == scope_id]
        if period_id not in (None, ""):
            records = [x for x in records if x.get("period_id") == period_id]
        return [dict(x) for x in records]

    def finalize(self, snapshot, source="runtime"):
        if not isinstance(snapshot, dict):
            return {"status": "REJECTED", "reason": "SNAPSHOT_INVALID"}

        required = (
            "snapshot_version",
            "scope_type",
            "scope_id",
            "period_id",
            "calculation_version",
            "policy",
            "time_baseline",
            "result",
            "event_versions",
        )
        missing = [field for field in required if field not in snapshot]
        if missing:
            return {
                "status": "REJECTED",
                "reason": "SNAPSHOT_REQUIRED_FIELDS",
                "fields": missing,
            }

        if snapshot.get("status") != "FINAL_CANDIDATE":
            return {"status": "REJECTED", "reason": "SNAPSHOT_NOT_FINAL_CANDIDATE"}

        result = snapshot.get("result") or {}
        for kpi in ("PA", "UA"):
            value = result.get(kpi) or {}
            if value.get("status") != "READY":
                return {
                    "status": "REJECTED",
                    "reason": "KPI_NOT_READY",
                    "kpi": kpi,
                    "kpi_status": value.get("status"),
                }

        policy = snapshot.get("policy") or {}
        baseline = snapshot.get("time_baseline") or {}
        if not policy.get("id") or not policy.get("version"):
            return {"status": "REJECTED", "reason": "POLICY_VERSION_REQUIRED"}
        if not baseline.get("id") or not baseline.get("version"):
            return {
                "status": "REJECTED",
                "reason": "TIME_BASELINE_VERSION_REQUIRED",
            }

        candidate = dict(snapshot)
        for key in (
            "snapshot_id",
            "revision",
            "created_at",
            "finalized_at",
            "source",
            "supersedes_snapshot_id",
        ):
            candidate.pop(key, None)

        fingerprint = self._fingerprint(candidate)
        natural_key = self._natural_key(candidate)
        existing = [
            x for x in self._records if self._natural_key(x) == natural_key
        ]

        for row in existing:
            if (
                row.get("content_fingerprint") == fingerprint
                and row.get("status") == "FINAL"
            ):
                return {
                    "status": "EXISTING",
                    "snapshot_id": row.get("snapshot_id"),
                    "revision": row.get("revision"),
                    "current": True,
                }

        next_revision = (
            max([int(x.get("revision", 0) or 0) for x in existing] or [0]) + 1
        )
        previous = (
            max(existing, key=lambda x: int(x.get("revision", 0) or 0))
            if existing
            else None
        )

        record = dict(candidate)
        record.update(
            {
                "snapshot_id": str(uuid.uuid4()),
                "revision": next_revision,
                "created_at": self._now(),
                "finalized_at": self._now(),
                "source": source,
                "status": "FINAL",
                "content_fingerprint": fingerprint,
                "supersedes_snapshot_id": (
                    previous.get("snapshot_id") if previous else None
                ),
            }
        )

        self._records.append(record)
        self._save()

        return {
            "status": "COMMITTED",
            "snapshot_id": record["snapshot_id"],
            "revision": next_revision,
            "current": True,
        }
