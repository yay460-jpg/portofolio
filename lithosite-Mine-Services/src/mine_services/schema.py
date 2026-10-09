"""Canonical V38 runtime schema.

A.3 is the only active Mine Services schema. Historical A.2 is retired and
must not be used as a runtime fallback. Future schema evolution replaces this
module with the next active schema version.
"""

SCHEMA_VERSION = "A.3"
SHEETS = ["_Baseline","_System","_Lists","Equipment","WorkFront","GlobalCapacity","Checker","Operations","Maintenance","Issues","Plans","HSE","MapMarker","AuditLog"]
DOMAIN_ENTITIES = ["Equipment","WorkFront","GlobalCapacity","Checker","Operations","Maintenance","Issues","Plans","HSE","MapMarker"]

HEADERS = {
"Equipment":["equipment_id","unit_no","category","type","owner_type","owner_name","status","effective_from","effective_to","capacity_profile_id"],
"WorkFront":["work_front_id","domain","location","responsible","status","effective_from","effective_to","capacity_profile_id"],
"Operations":["transaction_id","transaction_date","transaction_time","domain","work_front_id","equipment_id","activity","quantity","measurement","actual_hours","target_hours","status","source","created_at","updated_at","retase","capacity_profile_id","applied_capacity","capacity_measurement","end_time","shift","material","checker_name"],
"Maintenance":["maintenance_id","equipment_id","event_date","event_type","failure_code","start_time","end_time","downtime_hours","action","status","source"],
"Issues":["issue_id","issue_date","domain","work_front_id","equipment_id","description","severity","status","assigned_to","closed_at"],
"Plans":["plan_id","period","start_date","end_date","domain","work_front_id","activity","target_quantity","measurement","target_hours","status"],
"HSE":["hse_id","event_date","domain","work_front_id","event_type","severity","description","action","status","closed_at"],
"AuditLog":["audit_id","timestamp","entity","entity_id","action","old_value","new_value","source"],
"GlobalCapacity":["capacity_profile_id","capacity_name","unit_brand","capacity_value","measurement","status","effective_from","effective_to"],
"Checker":["checker_id","operation_id","checker_name","observation_date","start_time","end_time","shift","equipment_id","work_front_id","activity","material","retase","source"],
"MapMarker":["marker_id","marker_type","label","easting","northing","elevation","source_entity","source_id","status"],
}

PKS={"Equipment":"equipment_id","WorkFront":"work_front_id","Operations":"transaction_id","Maintenance":"maintenance_id","Issues":"issue_id","Plans":"plan_id","HSE":"hse_id","AuditLog":"audit_id","GlobalCapacity":"capacity_profile_id","Checker":"checker_id","MapMarker":"marker_id"}

REQUIRED={
"Equipment":{"equipment_id","unit_no"},"WorkFront":{"work_front_id"},"Operations":{"transaction_id","work_front_id"},
"Maintenance":{"maintenance_id","equipment_id"},"Issues":{"issue_id"},"Plans":{"plan_id","start_date","end_date"},"HSE":{"hse_id"},
"GlobalCapacity":{"capacity_profile_id","capacity_name","capacity_value","measurement","status"},
"Checker":{"checker_id","checker_name","observation_date","start_time","end_time","shift","equipment_id","work_front_id","activity","source"},
"MapMarker":{"marker_id","marker_type","easting","northing","elevation"},
}

NUMERIC={"quantity","actual_hours","target_hours","downtime_hours","target_quantity","easting","northing","elevation","capacity_value","retase","applied_capacity"}
SYSTEM_FIELDS={"created_at","updated_at"}

FK={
"Operations.work_front_id":("WorkFront","work_front_id",True),"Operations.equipment_id":("Equipment","equipment_id",False),
"Equipment.capacity_profile_id":("GlobalCapacity","capacity_profile_id",False),
"Maintenance.equipment_id":("Equipment","equipment_id",True),"Issues.work_front_id":("WorkFront","work_front_id",False),
"Issues.equipment_id":("Equipment","equipment_id",False),"Plans.work_front_id":("WorkFront","work_front_id",False),
"HSE.work_front_id":("WorkFront","work_front_id",False),"WorkFront.capacity_profile_id":("GlobalCapacity","capacity_profile_id",False),
"Operations.capacity_profile_id":("GlobalCapacity","capacity_profile_id",False),"Checker.operation_id":("Operations","transaction_id",False),
"Checker.equipment_id":("Equipment","equipment_id",True),"Checker.work_front_id":("WorkFront","work_front_id",True),
}

CONTROLLED={
"Equipment.category":"equipment_category","Equipment.type":"equipment_type","Equipment.owner_type":"owner_type","Equipment.status":"equipment_status",
"WorkFront.domain":"service_domain","WorkFront.status":"work_front_status","Operations.domain":"service_domain","Operations.measurement":"measurement","Operations.status":"transaction_status",
"Maintenance.event_type":"maintenance_event_type","Maintenance.action":"maintenance_event_type","Maintenance.status":"maintenance_status",
"Issues.domain":"service_domain","Issues.severity":"issue_severity","Issues.status":"issue_status","Plans.domain":"service_domain","Plans.measurement":"measurement","Plans.status":"plan_status",
"HSE.domain":"service_domain","HSE.event_type":"hse_event_type","HSE.severity":"hse_severity","HSE.action":"hse_event_type","HSE.status":"hse_status",
"GlobalCapacity.measurement":"measurement","GlobalCapacity.status":"capacity_status","Checker.shift":"checker_shift","Checker.material":"checker_material",
"Operations.shift":"checker_shift","Operations.material":"checker_material",
}
