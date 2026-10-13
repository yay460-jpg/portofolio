import json
import uuid
from pathlib import Path

from .snapshot import SnapshotManager
from .dataset import DatasetManager
from .kpi_snapshot_store import KPIHistoryStore
from .application import ApplicationService
from .import_engine import ImportCoordinator
from .topography_backup import TopographyBackupManager
from .marker_location_backup import MarkerLocationBackupManager


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
        dataset_dir = Path(store_path).with_name("Datasets") if store_path else Path("Datasets")
        self._datasets = DatasetManager(self._application.store, dataset_dir)
        topography_dir = Path(store_path).with_name("topography") if store_path else Path("topography")
        self._topography = TopographyBackupManager(topography_dir)
        marker_location_dir = Path(store_path).with_name("marker-location") if store_path else Path("marker-location")
        self._marker_location = MarkerLocationBackupManager(marker_location_dir)

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

    def save_topography_backup(self, package_base64, filename=None, source="runtime"):
        return self._topography.save(package_base64, filename=filename, source=source)

    def list_topography_backups(self):
        backups = self._topography.list()
        return {
            "status": "READY",
            "backups": backups,
            "max_backups": self._topography.MAX_BACKUPS,
            "storage_used": len(backups),
        }

    def load_topography_backup(self, filename):
        result = self._topography.read(filename)
        result["status"] = "READY"
        return result

    def save_marker_location_backup(self, package_base64, filename=None, source="runtime"):
        return self._marker_location.save(package_base64, filename=filename, source=source)

    def list_marker_location_backups(self):
        backups = self._marker_location.list()
        return {
            "status": "READY",
            "backups": backups,
            "max_backups": self._marker_location.MAX_BACKUPS,
            "storage_used": len(backups),
        }

    def load_marker_location_backup(self, filename):
        result = self._marker_location.read(filename)
        result["status"] = "READY"
        return result

    def list_datasets(self):
        return {"status": "READY", "datasets": self._datasets.list(), "active": self._datasets.active_info()}

    @staticmethod
    def _capture_dataset_path_state(path):
        if not path.exists():
            return False, False, None
        if not path.is_file():
            return True, False, None
        return True, True, path.read_bytes()

    @staticmethod
    def _restore_dataset_path_state(path, state):
        existed, was_file, content = state
        if existed:
            if not was_file:
                return
            restore_path = path.with_name(
                path.name + ".restore-" + uuid.uuid4().hex
            )
            try:
                restore_path.write_bytes(content)
                restore_path.replace(path)
            finally:
                if restore_path.exists():
                    restore_path.unlink()
            return
        if path.is_file():
            path.unlink()

    def _commit_dataset_write(self, action, target_name, operation):
        store = self._application.store
        before = store.snapshot()
        active_before = self._datasets.active_info()
        target_path = self._datasets._path(target_name)
        temp_path = target_path.with_suffix(".json.tmp")
        file_states = {
            target_path: self._capture_dataset_path_state(target_path),
            temp_path: self._capture_dataset_path_state(temp_path),
        }
        try:
            result = operation()
            self._application.audit_repository.append(
                entity="_System",
                entity_id=result["dataset_id"],
                action=action,
                request_id=result["dataset_id"],
                new_value=json.dumps(result, default=str, sort_keys=True),
                source="DatasetManager",
            )
            store.save()
            return result
        except Exception:
            store.replace(before)
            self._datasets.active = active_before
            for path, state in file_states.items():
                self._restore_dataset_path_state(path, state)
            raise

    def save_dataset(self, name=None):
        active = self._datasets.active_info() or {}
        target_name = self._datasets._safe_name(
            name or active.get("dataset_name") or self._datasets.DEFAULT_NAME
        )
        return self._commit_dataset_write(
            "DATASET_SAVE",
            target_name,
            lambda: self._datasets.save(name=name),
        )

    def save_dataset_as(self, name):
        target_name = self._datasets._safe_name(name)
        return self._commit_dataset_write(
            "DATASET_SAVE_AS",
            target_name,
            lambda: self._datasets.save_as(name=name),
        )

    def load_dataset(self, name):
        before = self._application.store.snapshot()
        controlled_lists_before = {
            key: set(values)
            for key, values in self._application.store.controlled_lists.items()
        }
        active_dataset_before = self._datasets.active_info()
        try:
            result = self._datasets.load(name=name)
            self._application.audit_repository.append(
                entity="_System",
                entity_id=result["dataset_id"],
                action="DATASET_LOAD",
                request_id=result["dataset_id"],
                old_value=json.dumps(before, default=str, sort_keys=True),
                new_value=json.dumps(result, default=str, sort_keys=True),
                source="DatasetManager",
            )
            self._application.store.save()
            return result
        except Exception:
            self._application.store.replace(before)
            self._application.store.controlled_lists = controlled_lists_before
            self._datasets.active = active_dataset_before
            raise

    def finalize_kpi(self, snapshot, source="runtime"):
        result = self._kpi_history.finalize(snapshot, source=source)
        if result.get("status") not in {"COMMITTED", "EXISTING"}:
            return result

        snapshot_id = result.get("snapshot_id")
        if not snapshot_id:
            result["audit_status"] = "NOT_APPENDED"
            return result

        try:
            audit_events = self._application.audit_repository.all()
        except Exception:
            result["audit_status"] = "NOT_APPENDED"
            return result

        audit_exists = any(
            event.get("entity") == "KPI_Snapshot"
            and str(event.get("entity_id")) == str(snapshot_id)
            and event.get("action") == "FINALIZE"
            for event in audit_events
        )
        if audit_exists:
            result["audit_status"] = "ALREADY_APPENDED"
            return result

        finalized_snapshot = next(
            (
                record
                for record in self._kpi_history.list(
                    scope_id=snapshot.get("scope_id"),
                    period_id=snapshot.get("period_id"),
                )
                if str(record.get("snapshot_id")) == str(snapshot_id)
            ),
            None,
        )
        if finalized_snapshot is None:
            result["audit_status"] = "NOT_APPENDED"
            return result

        # KPI history is an append-only store separate from the workbook audit
        # log. If the snapshot committed but audit persistence failed, a retry
        # returns EXISTING; reconcile the missing audit entry on that retry.
        before = self._application.store.snapshot()
        try:
            self._application.audit_repository.append(
                entity="KPI_Snapshot",
                entity_id=snapshot_id,
                action="FINALIZE",
                request_id=snapshot_id,
                new_value=json.dumps(finalized_snapshot, default=str, sort_keys=True),
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
