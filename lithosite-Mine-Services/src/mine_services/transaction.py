class TransactionManager:
 def __init__(self,store):self.store=store;self._before=None;self.active=False
 def begin(self):
  if self.active:raise RuntimeError("TRANSACTION_ACTIVE")
  self._before=self.store.snapshot();self.active=True
 def commit(self):
  if not self.active:raise RuntimeError("TRANSACTION_NOT_ACTIVE")
  try:self.store.save()
  except Exception:self.store.replace(self._before);self.active=False;self._before=None;raise
  self.active=False;self._before=None
 def rollback(self):
  if self.active:self.store.replace(self._before);self.active=False;self._before=None
