class TransactionManager:
    """Snapshot-based atomic transaction boundary for the reference store."""
    def __init__(self, store):
        self.store=store
        self._before=None
        self.active=False

    def begin(self):
        if self.active: raise RuntimeError("TRANSACTION_ACTIVE")
        self._before=self.store.snapshot()
        self.active=True

    def commit(self):
        if not self.active: raise RuntimeError("TRANSACTION_NOT_ACTIVE")
        self._before=None
        self.active=False

    def rollback(self):
        if not self.active: return
        self.store.replace(self._before)
        self._before=None
        self.active=False
