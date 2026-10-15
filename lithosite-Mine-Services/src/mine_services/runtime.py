import json
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

    def _mutate_nik(self, action, entity_id, payload, request_id):
        """Apply NIK workbook writes with the same request and audit contract as CRUD."""
        guard = self._application._request_guard(request_id)
        if guard:
            return guard

        store = self._application.store
        workbook_path = getattr(store, "path", None)
        if not workbook_path or not Path(workbook_path).is_file():
            return {"status": "REJECTED", "errors": [
                self._application._app_error("APP-006", "NIK workbook is unavailable")
            ]}

        workbook_path = Path(workbook_path)
        before_workbook = workbook_path.read_bytes()
        before_store = store.snapshot()
        existing = None
        try:
            if action != "CREATE":
                existing = next(
                    (item for item in store.all_nik_records()
                     if str(item.get("Id No (NIK)") or "").strip().casefold()
                     == str(entity_id or "").strip().casefold()),
                    None,
                )
                if existing is None:
                    return {"status": "REJECTED", "errors": [
                        self._application._app_error("APP-002", "Entity not found", "Id No (NIK)")
                    ]}

            if action == "CREATE":
                record = store.create_nik_record(payload)
                record_id = record["Id No (NIK)"]
                old_value, new_value = None, record
            elif action == "UPDATE":
                record = store.update_nik_record(entity_id, payload)
                record_id = record["Id No (NIK)"]
                old_value, new_value = existing, record
            else:
                record = store.delete_nik_record(entity_id)
                record_id = record["Id No (NIK)"]
                old_value, new_value = existing, None

            self._application.audit_repository.append(
                entity="NIK", entity_id=record_id, action=action,
                request_id=request_id,
                old_value=json.dumps(old_value, default=str, sort_keys=True) if old_value is not None else None,
                new_value=json.dumps(new_value, default=str, sort_keys=True) if new_value is not None else None,
                source=request_id,
            )
            store.save()
            self._application._requests.add(request_id)
            return {"status": "COMMITTED", "entity_id": record_id}
        except Exception as exc:
            store.replace(before_store)
            try:
                workbook_path.write_bytes(before_workbook)
            except OSError:
                return {"status": "REJECTED", "errors": [
                    self._application._app_error(
                        "APP-006", "NIK mutation failed; workbook rollback could not be confirmed"
                    )
                ]}
            code = "APP-005" if exc.__class__.__name__ == "AuditError" else "APP-006"
            return {"status": "REJECTED", "errors": [
                self._application._app_error(code, str(exc) or "NIK mutation failed")
            ]}

    def create(self, entity, row, request_id):
        if entity == "NIK":
            return self._mutate_nik("CREATE", None, row, request_id)
        return self._application.create(entity, row, request_id)

    def update(self, entity, entity_id, patch, request_id):
        if entity == "NIK":
            return self._mutate_nik("UPDATE", entity_id, patch, request_id)
        return self._application.update(entity, entity_id, patch, request_id)

    def delete(self, entity, entity_id, request_id):
        if entity == "NIK":
            return self._mutate_nik("DELETE", entity_id, None, request_id)
        return self._application.delete(entity, entity_id, request_id)

    def read(self, entity, entity_id=None):
        if entity == "NIK":
            records = self._application.store.all_nik_records()
            if entity_id is None:
                return records
            return next(
                (record for record in records if record.get("Id No (NIK)") == entity_id),
                None,
            )
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

    def _save_dataset_transactionally(self, save_operation, target_name, action):
        store = self._application.store
        before_store = store.snapshot()
        before_active = self._datasets.active_info()
        target_path = self._datasets._path(target_name)
        previous_file = target_path.read_bytes() if target_path.is_file() else None

        try:
            result = save_operation()
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
            store.replace(before_store)
            self._datasets.active = before_active
            if previous_file is None:
                target_path.unlink(missing_ok=True)
            else:
                target_path.write_bytes(previous_file)
            raise

    def save_dataset(self, name=None):
        target_name = name or (self._datasets.active or {}).get("dataset_name") or self._datasets.DEFAULT_NAME
        return self._save_dataset_transactionally(
            lambda: self._datasets.save(name=name),
            target_name,
            "DATASET_SAVE",
        )

    def save_dataset_as(self, name):
        return self._save_dataset_transactionally(
            lambda: self._datasets.save_as(name=name),
            name,
            "DATASET_SAVE_AS",
        )

    def load_dataset(self, name):
        store = self._application.store
        before = store.snapshot()
        before_controlled_lists = {
            key: set(values) for key, values in store.controlled_lists.items()
        }
        before_active = self._datasets.active_info()
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
            store.save()
            return result
        except Exception:
            # Dataset load also changes controlled lists and active-dataset
            # metadata, neither of which is included in PersistenceStore.snapshot().
            # Restore all three state groups if audit or workbook persistence fails.
            store.replace(before)
            store.controlled_lists = before_controlled_lists
            self._datasets.active = before_active
            raise

    def finalize_kpi(self, snapshot, source="runtime"):
        store = self._application.store
        before_store = store.snapshot()
        history_records = list(self._kpi_history._records)
        history_path = self._kpi_history.path
        history_file = history_path.read_bytes() if history_path and history_path.is_file() else None

        try:
            result = self._kpi_history.finalize(snapshot, source=source)
            if result.get("status") != "COMMITTED":
                return result

            self._application.audit_repository.append(
                entity="KPI_Snapshot",
                entity_id=result.get("snapshot_id"),
                action="FINALIZE",
                request_id=result.get("snapshot_id"),
                new_value=json.dumps(snapshot, default=str, sort_keys=True),
                source=source,
            )
            store.save()
            result["audit_status"] = "APPENDED"
            return result
        except Exception:
            store.replace(before_store)
            self._kpi_history._records = history_records
            if history_path:
                if history_file is None:
                    history_path.unlink(missing_ok=True)
                else:
                    history_path.parent.mkdir(parents=True, exist_ok=True)
                    history_path.write_bytes(history_file)
            return {
                "status": "REJECTED",
                "reason": "KPI_FINALIZATION_FAILED",
                "audit_status": "NOT_APPENDED",
            }

    def read_kpi_snapshots(self, scope_id=None, period_id=None):
        return self._kpi_history.list(
            scope_id=scope_id,
            period_id=period_id,
        )
