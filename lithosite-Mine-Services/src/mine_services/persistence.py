from __future__ import annotations
from copy import deepcopy

class PersistenceStore:
    """Offline in-memory persistence reference; transaction layer supplies atomicity."""
    def __init__(self):
        self._data = {}

    def snapshot(self):
        return deepcopy(self._data)

    def replace(self, snapshot):
        self._data = deepcopy(snapshot)

    def exists(self, entity, pk):
        return pk in self._data.get(entity, {})

    def get(self, entity, pk):
        value=self._data.get(entity,{}).get(pk)
        return deepcopy(value) if value is not None else None

    def all(self, entity):
        return deepcopy(list(self._data.get(entity,{}).values()))

    def insert(self, entity, pk, row):
        self._data.setdefault(entity,{})[pk]=deepcopy(dict(row))

    def update(self, entity, pk, row):
        if not self.exists(entity,pk):
            raise KeyError(pk)
        self._data[entity][pk]=deepcopy(dict(row))

    def delete(self, entity, pk):
        if not self.exists(entity,pk):
            raise KeyError(pk)
        del self._data[entity][pk]
