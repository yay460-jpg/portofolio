from .runtime import RuntimeInterface


class AdapterContractError(ValueError):
    """Raised when an adapter request violates the Stage 5 envelope contract."""

    def __init__(self, code, message, field=None):
        super().__init__(message)
        self.code = code
        self.field = field


class RuntimeAdapter:
    """External UI/API adapter for the Mine Services RuntimeInterface."""

    OPERATIONS = {
        "CREATE",
        "UPDATE",
        "DELETE",
        "READ",
        "IMPORT_XLSX",
        "BACKUP",
        "RESTORE",
    }

    def __init__(self, runtime=None):
        self._runtime = runtime or RuntimeInterface()

    @staticmethod
    def _required(request, field):
        value = request.get(field)
        if value in (None, ""):
            raise AdapterContractError("ADP-003", f"Missing required field: {field}", field)
        return value

    @classmethod
    def _validate_request(cls, request):
        if not isinstance(request, dict):
            raise AdapterContractError("ADP-001", "Request must be an object")

        request_id = cls._required(request, "request_id")
        operation = cls._required(request, "operation")
        if operation not in cls.OPERATIONS:
            raise AdapterContractError("ADP-002", f"Unsupported operation: {operation}", "operation")
        return request_id, operation

    @staticmethod
    def _response(request_id, result):
        response = {"request_id": request_id}
        if isinstance(result, dict):
            response.update(result)
        else:
            response["status"] = "OK"
            response["data"] = result

        if response.get("errors"):
            response["errors"] = [
                {
                    "code": getattr(error, "code", None),
                    "field": getattr(error, "field", None),
                    "message": getattr(error, "message", str(error)),
                }
                if not isinstance(error, dict)
                else error
                for error in response["errors"]
            ]
        return response

    @staticmethod
    def _error_response(request_id, error):
        return {
            "request_id": request_id,
            "status": "REJECTED",
            "errors": [{
                "code": error.code,
                "field": error.field,
                "message": str(error),
            }],
        }

    def handle(self, request):
        request_id = request.get("request_id") if isinstance(request, dict) else None
        try:
            request_id, operation = self._validate_request(request)

            if operation == "CREATE":
                entity = self._required(request, "entity")
                row = self._required(request, "row")
                result = self._runtime.create(entity, row, request_id)
            elif operation == "UPDATE":
                entity = self._required(request, "entity")
                entity_id = self._required(request, "entity_id")
                patch = self._required(request, "patch")
                result = self._runtime.update(entity, entity_id, patch, request_id)
            elif operation == "DELETE":
                entity = self._required(request, "entity")
                entity_id = self._required(request, "entity_id")
                result = self._runtime.delete(entity, entity_id, request_id)
            elif operation == "READ":
                entity = self._required(request, "entity")
                result = self._runtime.read(entity, request.get("entity_id"))
            elif operation == "IMPORT_XLSX":
                path = self._required(request, "path")
                result = self._runtime.import_xlsx(path)
            elif operation == "BACKUP":
                result = self._runtime.backup(source=request.get("source", "runtime"))
            else:
                snapshot = self._required(request, "snapshot")
                result = self._runtime.restore(
                    snapshot,
                    mode=request.get("mode", "REPLACE_RUNTIME"),
                )

            return self._response(request_id, result)
        except AdapterContractError as exc:
            return self._error_response(request_id, exc)
        except Exception:
            return {
                "request_id": request_id,
                "status": "REJECTED",
                "errors": [{
                    "code": "ADP-005",
                    "field": None,
                    "message": "Runtime operation failed",
                }],
            }
