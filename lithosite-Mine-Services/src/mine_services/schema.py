SCHEMA_VERSION = "A.1"

ENTITIES = {
    "Equipment": {
        "pk": "equipment_id",
        "required": {"equipment_id", "equipment_type", "owner_type"},
        "fields": {"equipment_id": str, "equipment_type": str, "owner_type": str, "owner_name": str,
                   "status": str, "created_at": str, "updated_at": str},
    },
    "WorkFront": {
        "pk": "work_front_id",
        "required": {"work_front_id", "name"},
        "fields": {"work_front_id": str, "name": str, "status": str, "created_at": str, "updated_at": str},
    },
    "Operations": {
        "pk": "transaction_id",
        "required": {"transaction_id", "work_front_id"},
        "fields": {"transaction_id": str, "work_front_id": str, "equipment_id": str,
                   "quantity": (int, float), "unit": str, "actual_hours": (int, float),
                   "created_at": str, "updated_at": str},
    },
    "Maintenance": {
        "pk": "maintenance_id",
        "required": {"maintenance_id", "equipment_id"},
        "fields": {"maintenance_id": str, "equipment_id": str, "status": str,
                   "downtime_hours": (int, float), "created_at": str, "updated_at": str},
    },
    "Issues": {
        "pk": "issue_id",
        "required": {"issue_id"},
        "fields": {"issue_id": str, "work_front_id": str, "equipment_id": str,
                   "status": str, "closed_at": str, "created_at": str, "updated_at": str},
    },
    "Plans": {
        "pk": "plan_id",
        "required": {"plan_id"},
        "fields": {"plan_id": str, "work_front_id": str, "period": str,
                   "status": str, "target_quantity": (int, float), "unit": str,
                   "target_hours": (int, float), "created_at": str, "updated_at": str},
    },
    "HSE": {
        "pk": "hse_id",
        "required": {"hse_id"},
        "fields": {"hse_id": str, "work_front_id": str, "severity": str,
                   "status": str, "closed_at": str, "created_at": str, "updated_at": str},
    },
}

LISTS = {
    "maintenance_status": {"Open", "In Progress", "Completed", "Cancelled"},
    "plan_status": {"Draft", "Approved", "In Progress", "Completed", "Cancelled"},
    "hse_severity": {"Low", "Medium", "High", "Critical"},
    "hse_status": {"Open", "In Progress", "Closed", "Void"},
}

FK_RULES = {
    "Operations.work_front_id": ("WorkFront", "work_front_id", True),
    "Operations.equipment_id": ("Equipment", "equipment_id", False),
    "Maintenance.equipment_id": ("Equipment", "equipment_id", True),
    "Issues.work_front_id": ("WorkFront", "work_front_id", False),
    "Issues.equipment_id": ("Equipment", "equipment_id", False),
    "Plans.work_front_id": ("WorkFront", "work_front_id", False),
    "HSE.work_front_id": ("WorkFront", "work_front_id", False),
}

NUMERIC_FIELDS = {"quantity", "actual_hours", "downtime_hours", "target_quantity", "target_hours"}
SYSTEM_FIELDS = {"created_at", "updated_at"}
