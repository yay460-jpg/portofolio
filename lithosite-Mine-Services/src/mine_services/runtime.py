import json
from pathlib import Path

from .snapshot import SnapshotManager
from .kpi_snapshot_store import KPIHistoryStore
from .application import ApplicationService
from .import_engine import ImportCoordinator


class RuntimeInterface:
    """Single integration boundary for UI/API adapters."""

    def __init__(self, application=None, importer=None, snapshots=None):
        self._application = application or ApplicationService()
        self._importer = importer or ImportCoordinator(
            self._application.store,
            audit_repository=self._application.audit_repository,
        )
        self._snapshots = snapshots or SnapshotManager(
            self._application.store,
            audit_repository=self._application.audit_repository,
        )
        store_path = getattr(self._application.store, "path", None)
        history_path = Path(store_path).with_name("KPI-History.json") if store_path else None
        self._kpi_history = KPIHistoryStore(history_path)

    def create(self, entity, row, request_id):
        return self._application.create(entity, row, request_id)

    def update(self, entity, entity_id, patch, request_id):
        return self._application.update(entity, entity_id, patch, request_id)

    def delete(self, entity, entity_id, request_id):
        return self._application.delete(entity, entity_id, request_id)

    def read(self, entity, entity_id=None):
        if entity == "_Lists":
            if entity_id:
                return sorted(self._application.store.controlled_lists.get(entity_id, set()))
            return {
                name: sorted(values)
                for name, values in self._application.store.controlled_lists.items()
            }
        if entity == "AuditLog":
            events = self._application.audit_repository.all()
            if entity_id is None:
                return events
            return next(
                (event for event in events if event.get("audit_id") == entity_id),
                None,
            )
        return self._application.read(entity, entity_id)

    def import_xlsx(self, path):
        return self._importer.import_xlsx(path)

    def backup(self, source="runtime"):
        return self._snapshots.capture(source=source)

    def restore(self, snapshot, mode="REPLACE_RUNTIME"):
        return self._snapshots.restore(snapshot, mode=mode)

    def finalize_kpi(self, snapshot, source="runtime"):
        result = self._kpi_history.finalize(snapshot, source=source)
        if result.get("status") == "COMMITTED":
            before = self._application.store.snapshot()
            try:
                self._application.audit_repository.append(
                    entity="KPI_Snapshot",
                    entity_id=result.get("snapshot_id"),
                    action="FINALIZE",
                    request_id=result.get("snapshot_id"),
                    new_value=json.dumps(snapshot, default=str, sort_keys=True),
                    source=source,
                )
                self._application.store.save()
                result["audit_status"] = "APPENDED"
            except Exception:
                self._application.store.replace(before)
                result["audit_status"] = "NOT_APPENDED"
        return result

    def read_kpi_snapshots(self, scope_id=None, period_id=None):
        return self._kpi_history.list(
            scope_id=scope_id,
            period_id=period_id,
        )
