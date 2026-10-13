import json
import threading
from pathlib import Path

from mine_services.adapter import RuntimeAdapter
from mine_services.persistence import PersistenceStore
from mine_services.runtime import RuntimeInterface
from mine_services.application import ApplicationService
from mine_services.audit import AuditRepository
from mine_services.import_engine import ImportCoordinator
from mine_services.snapshot import SnapshotManager


DATABASE_NAME = "Mine-Services-Database.xlsx"
_ADAPTERS = {}
_ADAPTERS_LOCK = threading.RLock()


def _runtime_for(app_dir):
    root = Path(app_dir).resolve()
    cache_key = str(root)
    with _ADAPTERS_LOCK:
        cached = _ADAPTERS.get(cache_key)
        if cached is not None:
            return cached

        root.mkdir(parents=True, exist_ok=True)
        database = root / DATABASE_NAME

        if not database.exists():
            raise FileNotFoundError("Mine Services database seed is not installed")

        store = PersistenceStore(database)
        audit = AuditRepository(store)
        application = ApplicationService(store=store, audit_repository=audit)
        runtime = RuntimeInterface(
            application=application,
            importer=ImportCoordinator(store, audit_repository=audit),
            snapshots=SnapshotManager(store, audit_repository=audit),
        )
        adapter = RuntimeAdapter(runtime)
        _ADAPTERS[cache_key] = adapter
        return adapter

def healthcheck(app_dir):
    adapter = _runtime_for(app_dir)
    return json.dumps({
        "status": "READY",
        "database_mode": "OFFLINE",
        "schema_version": "A.1",
        "runtime": type(adapter).__name__,
    })


def handle(app_dir, request_json):
    adapter = _runtime_for(app_dir)
    request = json.loads(request_json)
    response = adapter.handle(request)
    return json.dumps(response, default=str)
