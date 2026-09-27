from .application import ApplicationService
from .import_engine import ImportCoordinator
from .snapshot import SnapshotManager


class RuntimeInterface:
    """Single integration boundary for UI/API adapters.

    The interface exposes commands and queries without exposing the persistence
    or repository objects to callers.
    """

    def __init__(self, application=None, importer=None, snapshots=None):
        self._application = application or ApplicationService()
        self._importer = importer or ImportCoordinator(self._application.store)
        self._snapshots = snapshots or SnapshotManager(self._application.store)

    def create(self, entity, row, request_id):
        return self._application.create(entity, row, request_id)

    def update(self, entity, entity_id, patch, request_id):
        return self._application.update(entity, entity_id, patch, request_id)

    def delete(self, entity, entity_id, request_id):
        return self._application.delete(entity, entity_id, request_id)

    def read(self, entity, entity_id=None):
        return self._application.read(entity, entity_id)

    def import_xlsx(self, path):
        return self._importer.import_xlsx(path)

    def backup(self, source="runtime"):
        return self._snapshots.capture(source=source)

    def restore(self, snapshot, mode="REPLACE_RUNTIME"):
        return self._snapshots.restore(snapshot, mode=mode)
