from .runtime import RuntimeInterface


class AdapterContractError(ValueError):
    """Raised when an adapter request violates the runtime envelope contract."""

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
        "LIST_DATASETS",
        "SAVE_DATASET",
        "SAVE_AS_DATASET",
        "LOAD_DATASET",
        "SAVE_TOPOGRAPHY_BACKUP",
        "LIST_TOPOGRAPHY_BACKUPS",
        "LOAD_TOPOGRAPHY_BACKUP",
        "SAVE_MARKER_LOCATION_BACKUP",
        "LIST_MARKER_LOCATION_BACKUPS",
        "LOAD_MARKER_LOCATION_BACKUP",
        "FINALIZE_KPI",
        "READ_KPI_SNAPSHOTS",
    }

    def __init__(self, runtime=None):
        self._runtime = runtime or RuntimeInterface()

    @staticmethod
    def _required(request, field):
        value = request.get(field)
        if value in (None, ""):
            raise AdapterContractError(
                "ADP-003",
                f"Missing required field: {field}",
                field,
            )
        return value

    @classmethod
    def _validate_request(cls, request):
        if not isinstance(request, dict):
            raise AdapterContractError("ADP-001", "Request must be an object")
        request_id = cls._required(request, "request_id")
        operation = cls._required(request, "operation")
        if operation not in cls.OPERATIONS:
            raise AdapterContractError(
                "ADP-002",
                f"Unsupported operation: {operation}",
                "operation",
            )
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
            elif operation == "LIST_DATASETS":
                result = self._runtime.list_datasets()
            elif operation == "SAVE_DATASET":
                result = self._runtime.save_dataset(name=request.get("name"))
            elif operation == "SAVE_AS_DATASET":
                name = self._required(request, "name")
                result = self._runtime.save_dataset_as(name=name)
            elif operation == "LOAD_DATASET":
                name = self._required(request, "name")
                result = self._runtime.load_dataset(name=name)
            elif operation == "SAVE_TOPOGRAPHY_BACKUP":
                package_base64 = self._required(request, "package_base64")
                result = self._runtime.save_topography_backup(
                    package_base64,
                    filename=request.get("filename"),
                    source=request.get("source", "Map-Topography"),
                )
                result["status"] = "SAVED"
            elif operation == "LIST_TOPOGRAPHY_BACKUPS":
                result = self._runtime.list_topography_backups()
            elif operation == "LOAD_TOPOGRAPHY_BACKUP":
                name = self._required(request, "filename")
                result = self._runtime.load_topography_backup(name)
            elif operation == "SAVE_MARKER_LOCATION_BACKUP":
                package_base64 = self._required(request, "package_base64")
                result = self._runtime.save_marker_location_backup(
                    package_base64,
                    filename=request.get("filename"),
                    source=request.get("source", "Marker-Location"),
                )
                result["status"] = "SAVED"
            elif operation == "LIST_MARKER_LOCATION_BACKUPS":
                result = self._runtime.list_marker_location_backups()
            elif operation == "LOAD_MARKER_LOCATION_BACKUP":
                name = self._required(request, "filename")
                result = self._runtime.load_marker_location_backup(name)
            elif operation == "FINALIZE_KPI":
                snapshot = self._required(request, "snapshot")
                result = self._runtime.finalize_kpi(
                    snapshot,
                    source=request.get("source", "runtime"),
                )
            elif operation == "READ_KPI_SNAPSHOTS":
                result = self._runtime.read_kpi_snapshots(
                    scope_id=request.get("scope_id"),
                    period_id=request.get("period_id"),
                )
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
