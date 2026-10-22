from copy import deepcopy
from pathlib import Path
from tempfile import NamedTemporaryFile

from openpyxl import load_workbook
from openpyxl.utils.cell import get_column_letter, range_boundaries

from . import schema as DEFAULT_SCHEMA


class PersistenceStore:
    def __init__(self, path=None, schema_module=None):
        self.schema = schema_module or DEFAULT_SCHEMA
        self.path = Path(path) if path else None
        self._data = {e: {} for e in self.schema.DOMAIN_ENTITIES}
        self._audit = []
        # Production vocabulary is loaded exclusively from the A3 workbook `_Lists`.
        # This fallback exists only for explicit in-memory/test stores with no workbook path.
        self.controlled_lists = {
            "equipment_category": {"Heavy Equipment", "Light Vehicle", "Support Equipment"},
            "equipment_type": {"Dump Truck", "Excavator", "Dozer", "Grader", "Water Truck", "Loader", "Light Vehicle", "Other"},
            "owner_type": {"Owner", "Contractor"},
            "equipment_status": {"Active", "Inactive", "Retired"},
            "service_domain": {"Road & Hauling", "Drainage & Dewatering", "Land Clearing", "Disposal & Stockpile", "Mining", "Reclamation", "Other"},
            "work_front_status": {"Active", "Inactive", "Closed"},
            "capacity_status": {"Active", "Inactive"},
            "checker_shift": {"Day", "Night"},
            "checker_material": {"Ore", "OB", "Quarry", "Top Soil"},
            "transaction_status": {"DRAFT", "VALIDATED", "REJECTED", "VOIDED"},
            "measurement": {"hour", "km", "m", "m2", "m3", "ton", "unit", "cycle"},
            "maintenance_event_type": {"Preventive", "Corrective", "Inspection", "Breakdown"},
            "issue_severity": {"Low", "Medium", "High", "Critical"},
            "issue_status": {"Open", "In Progress", "Closed", "Void"},
            "hse_event_type": {"Inspection", "Incident", "Near Miss", "Environmental", "Corrective Action"},
            "maintenance_status": {"Open", "In Progress", "Completed", "Cancelled"},
            "plan_status": {"Draft", "Approved", "In Progress", "Completed", "Cancelled"},
            "hse_severity": {"Low", "Medium", "High", "Critical"},
            "hse_status": {"Open", "In Progress", "Closed", "Void"},
        } if not self.path else {}
        if self.path and self.path.exists():
            self.load()

    def snapshot(self):
        return {"data": deepcopy(self._data), "audit": deepcopy(self._audit)}

    def replace(self, snapshot):
        data = snapshot.get("data", {})
        if not isinstance(data, dict):
            raise ValueError("SNAPSHOT_DATA_INVALID")
        # Older A.3 snapshots may predate the RainfallSimulation entity.
        self._data = {
            entity: deepcopy(data.get(entity, {}))
            for entity in self.schema.DOMAIN_ENTITIES
        }
        self._audit = deepcopy(snapshot.get("audit", []))

    def exists(self, entity, pk):
        return pk in self._data.get(entity, {})

    def get(self, entity, pk):
        return deepcopy(self._data.get(entity, {}).get(pk))

    def all(self, entity):
        return deepcopy(list(self._data.get(entity, {}).values()))

    def all_nik_records(self):
        """Read the canonical NIK worksheet as read-only records."""
        if not self.path or not self.path.is_file():
            return []
        workbook = load_workbook(self.path, read_only=True, data_only=True)
        try:
            if "NIK" not in workbook.sheetnames:
                raise ValueError("SHEET_MISSING:NIK")
            worksheet = workbook["NIK"]
            rows = worksheet.iter_rows(values_only=True)
            headers = list(next(rows, ()))
            if headers != self.schema.NIK_HEADERS:
                raise ValueError("HEADER_MISMATCH:NIK")

            records = []
            for values in rows:
                if not any(value not in (None, "") for value in values):
                    continue
                record = {}
                for header, value in zip(headers, values):
                    if hasattr(value, "isoformat"):
                        value = value.isoformat()
                    record[header] = value
                records.append(record)
            return records
        finally:
            workbook.close()

    def create_nik_record(self, row):
        """Append one validated employee to the canonical NIK worksheet atomically."""
        if not self.path or not self.path.is_file():
            raise ValueError("NIK workbook is unavailable")
        if not isinstance(row, dict):
            raise ValueError("NIK record must be an object")
        record = {header: str(row.get(header) or "").strip() for header in self.schema.NIK_HEADERS}
        if not record["Id No (NIK)"] or not record["Name Employment"]:
            raise ValueError("Id No (NIK) and Name Employment are required")
        workbook = load_workbook(self.path)
        try:
            if "NIK" not in workbook.sheetnames:
                raise ValueError("SHEET_MISSING:NIK")
            worksheet = workbook["NIK"]
            if [cell.value for cell in worksheet[1]] != self.schema.NIK_HEADERS:
                raise ValueError("HEADER_MISMATCH:NIK")
            nik = record["Id No (NIK)"].casefold()
            for values in worksheet.iter_rows(min_row=2, values_only=True):
                if len(values) > 2 and str(values[2] or "").strip().casefold() == nik:
                    raise ValueError("DUPLICATE_NIK:Id No (NIK) already exists")
            worksheet.append([record[header] or None for header in self.schema.NIK_HEADERS])
            with NamedTemporaryFile(prefix=self.path.stem + ".", suffix=self.path.suffix,
                                    dir=self.path.parent, delete=False) as file:
                temp_path = Path(file.name)
            try:
                workbook.save(temp_path)
                temp_path.replace(self.path)
            finally:
                if temp_path.exists():
                    temp_path.unlink()
            return record
        finally:
            workbook.close()

    def update_nik_record(self, entity_id, patch):
        """Update a NIK row by its immutable Id No (NIK), preserving worksheet headers."""
        if not self.path or not self.path.is_file():
            raise ValueError("NIK workbook is unavailable")
        if not isinstance(patch, dict):
            raise ValueError("NIK patch must be an object")
        record = {header: str(patch.get(header) or "").strip() for header in self.schema.NIK_HEADERS}
        if not record["Id No (NIK)"] or not record["Name Employment"]:
            raise ValueError("Id No (NIK) and Name Employment are required")
        if str(record["Id No (NIK)"]).casefold() != str(entity_id).casefold():
            raise ValueError("Id No (NIK) cannot be changed while editing a record")
        workbook = load_workbook(self.path)
        try:
            if "NIK" not in workbook.sheetnames:
                raise ValueError("SHEET_MISSING:NIK")
            worksheet = workbook["NIK"]
            if [cell.value for cell in worksheet[1]] != self.schema.NIK_HEADERS:
                raise ValueError("HEADER_MISMATCH:NIK")
            target_row = None
            for row_index in range(2, worksheet.max_row + 1):
                value = str(worksheet.cell(row=row_index, column=3).value or "").strip()
                if value.casefold() == str(entity_id).strip().casefold():
                    target_row = row_index
                    break
            if target_row is None:
                raise ValueError("NIK record not found")
            for column, header in enumerate(self.schema.NIK_HEADERS, start=1):
                worksheet.cell(row=target_row, column=column, value=record[header] or None)
            with NamedTemporaryFile(prefix=self.path.stem + ".", suffix=self.path.suffix,
                                    dir=self.path.parent, delete=False) as file:
                temp_path = Path(file.name)
            try:
                workbook.save(temp_path)
                temp_path.replace(self.path)
            finally:
                if temp_path.exists():
                    temp_path.unlink()
            return record
        finally:
            workbook.close()

    def delete_nik_record(self, entity_id):
        """Delete one NIK row by Id No (NIK) using an atomic workbook replacement."""
        if not self.path or not self.path.is_file():
            raise ValueError("NIK workbook is unavailable")
        workbook = load_workbook(self.path)
        try:
            if "NIK" not in workbook.sheetnames:
                raise ValueError("SHEET_MISSING:NIK")
            worksheet = workbook["NIK"]
            if [cell.value for cell in worksheet[1]] != self.schema.NIK_HEADERS:
                raise ValueError("HEADER_MISMATCH:NIK")
            target_row = None
            for row_index in range(2, worksheet.max_row + 1):
                value = str(worksheet.cell(row=row_index, column=3).value or "").strip()
                if value.casefold() == str(entity_id).strip().casefold():
                    target_row = row_index
                    break
            if target_row is None:
                raise ValueError("NIK record not found")
            worksheet.delete_rows(target_row, 1)
            with NamedTemporaryFile(prefix=self.path.stem + ".", suffix=self.path.suffix,
                                    dir=self.path.parent, delete=False) as file:
                temp_path = Path(file.name)
            try:
                workbook.save(temp_path)
                temp_path.replace(self.path)
            finally:
                if temp_path.exists():
                    temp_path.unlink()
            return {"Id No (NIK)": str(entity_id)}
        finally:
            workbook.close()

    def insert(self, entity, pk, row):
        self._data.setdefault(entity, {})[pk] = deepcopy(dict(row))

    def update(self, entity, pk, row):
        if not self.exists(entity, pk):
            raise KeyError(pk)
        self._data[entity][pk] = deepcopy(dict(row))

    def delete(self, entity, pk):
        if not self.exists(entity, pk):
            raise KeyError(pk)
        del self._data[entity][pk]

    def add_audit(self, event):
        self._audit.append(deepcopy(event))

    def audit(self):
        return deepcopy(self._audit)

    @staticmethod
    def _system_version(workbook):
        if "_System" not in workbook.sheetnames:
            raise ValueError("SHEET_MISSING:_System")
        for values in workbook["_System"].iter_rows(values_only=True):
            vals = list(values)
            for i, value in enumerate(vals):
                if value == "schema_version" and i + 1 < len(vals) and vals[i + 1] is not None:
                    return str(vals[i + 1])
        raise ValueError("SCHEMA_VERSION:MISSING")

    def _migrate_a3_checker_support_headers(self, workbook):
        """Upgrade the existing A3 workbook headers for the V38 Operations/Checker support layer.

        This is intentionally narrow: only the known pre-support A3 headers are migrated.
        Existing row values are preserved; new support fields start blank.
        """
        if getattr(self.schema, "SCHEMA_VERSION", None) != "A.3":
            return False

        changed = False

        equipment = workbook["Equipment"]
        current_equipment = [cell.value for cell in equipment[1]]
        legacy_equipment = list(self.schema.HEADERS["Equipment"][:-1])
        if current_equipment == legacy_equipment:
            equipment.cell(row=1, column=equipment.max_column + 1, value="capacity_profile_id")
            changed = True

        operations = workbook["Operations"]
        current_operations = [cell.value for cell in operations[1]]
        legacy_operations = list(self.schema.HEADERS["Operations"][:-4])
        if current_operations == legacy_operations:
            for header in self.schema.HEADERS["Operations"][-4:]:
                operations.cell(row=1, column=operations.max_column + 1, value=header)
            changed = True

        global_capacity = workbook["GlobalCapacity"]
        current_global_capacity = [cell.value for cell in global_capacity[1]]
        legacy_global_capacity = list(self.schema.HEADERS["GlobalCapacity"])
        legacy_global_capacity.remove("unit_brand")
        if current_global_capacity == legacy_global_capacity:
            insert_at = current_global_capacity.index("capacity_value") + 1
            global_capacity.insert_cols(insert_at, 1)
            global_capacity.cell(row=1, column=insert_at, value="unit_brand")
            changed = True

        checker = workbook["Checker"]
        current_checker = [cell.value for cell in checker[1]]
        legacy_checker = [h for h in self.schema.HEADERS["Checker"] if h != "operation_id"]
        if current_checker == legacy_checker:
            checker.insert_cols(2, 1)
            checker.cell(row=1, column=2, value="operation_id")
            changed = True

        plans = workbook["Plans"]
        current_plans = [cell.value for cell in plans[1]]
        legacy_plans = ["plan_id", "period", "domain", "work_front_id", "activity", "target_quantity", "measurement", "target_hours", "status"]
        legacy_plans_without_hours = [header for header in legacy_plans if header != "target_hours"]
        if current_plans in (legacy_plans, legacy_plans_without_hours):
            plans.insert_cols(3, 2)
            plans.cell(row=1, column=3, value="start_date")
            plans.cell(row=1, column=4, value="end_date")
            changed = True
            # Preserve historical monthly plans by expanding them to calendar month bounds.
            from calendar import monthrange
            for row_index in range(2, plans.max_row + 1):
                period = plans.cell(row=row_index, column=2).value
                if not period:
                    continue
                period_text = str(period).strip()
                if len(period_text) == 7 and period_text[4] == "-":
                    try:
                        year, month = int(period_text[:4]), int(period_text[5:7])
                        last_day = monthrange(year, month)[1]
                        plans.cell(row=row_index, column=3, value=f"{year:04d}-{month:02d}-01")
                        plans.cell(row=row_index, column=4, value=f"{year:04d}-{month:02d}-{last_day:02d}")
                    except (ValueError, TypeError):
                        pass

        return changed

    def _migrate_a3_nik_sheet(self, workbook):
        """Create or upgrade the NIK worksheet to the canonical employee-register headers."""
        if getattr(self.schema, "SCHEMA_VERSION", None) != "A.3":
            return False
        if "NIK" not in workbook.sheetnames:
            insert_at = workbook.sheetnames.index("Equipment") + 1
            worksheet = workbook.create_sheet("NIK", index=insert_at)
            for column, header in enumerate(self.schema.NIK_HEADERS, start=1):
                worksheet.cell(row=1, column=column, value=header)
            return True

        worksheet = workbook["NIK"]
        current_headers = [cell.value for cell in worksheet[1]]
        if current_headers == self.schema.NIK_HEADERS:
            return False
        # Upgrade only the earlier empty placeholder. Never overwrite existing content.
        if worksheet.max_row == 1 and all(value is None for value in current_headers):
            for column, header in enumerate(self.schema.NIK_HEADERS, start=1):
                worksheet.cell(row=1, column=column, value=header)
            return True
        raise ValueError("HEADER_MISMATCH:NIK")

    def _migrate_a3_rainfall_simulation_sheet(self, workbook):
        """Create the RainfallSimulation worksheet without changing existing A3 records."""
        if getattr(self.schema, "SCHEMA_VERSION", None) != "A.3":
            return False
        headers = list(self.schema.HEADERS["RainfallSimulation"])
        if "RainfallSimulation" not in workbook.sheetnames:
            insert_at = workbook.sheetnames.index("AuditLog") if "AuditLog" in workbook.sheetnames else len(workbook.sheetnames)
            worksheet = workbook.create_sheet("RainfallSimulation", index=insert_at)
            worksheet.append(headers)
            return True

        worksheet = workbook["RainfallSimulation"]
        current_headers = [cell.value for cell in worksheet[1]]
        if current_headers == headers:
            return False
        if worksheet.max_row == 1 and all(value in (None, "") for value in current_headers):
            for column, header in enumerate(headers, start=1):
                worksheet.cell(row=1, column=column, value=header)
            return True
        raise ValueError("HEADER_MISMATCH:RainfallSimulation")

    def _migrate_a3_top_soil_material(self, workbook):
        """Add Top Soil to the A.3 controlled material list without changing existing entries."""
        if getattr(self.schema, "SCHEMA_VERSION", None) != "A.3":
            return False
        lists = workbook["_Lists"] if "_Lists" in workbook.sheetnames else None
        if lists is None:
            return False

        headers = [cell.value for cell in lists[1]]
        try:
            column = headers.index("checker_material") + 1
        except ValueError:
            return False

        values = [
            lists.cell(row=row_index, column=column).value
            for row_index in range(2, lists.max_row + 1)
        ]
        if any(value == "Top Soil" for value in values):
            return False

        last_value_row = max(
            (row_index for row_index in range(2, lists.max_row + 1)
             if lists.cell(row=row_index, column=column).value not in (None, "")),
            default=1,
        )
        lists.cell(row=last_value_row + 1, column=column, value="Top Soil")
        return True

    def _migrate_a3_remove_plans_target_hours(self, workbook):
        """Remove the retired target_hours column from the A.3 Plans worksheet."""
        if getattr(self.schema, "SCHEMA_VERSION", None) != "A.3":
            return False
        if "Plans" not in workbook.sheetnames:
            return False

        plans = workbook["Plans"]
        headers = [cell.value for cell in plans[1]]
        try:
            column_index = headers.index("target_hours") + 1
        except ValueError:
            return False

        # Track worksheet filter/table ranges before deleting the field.
        worksheet_filter_ref = plans.auto_filter.ref
        table_ranges = []
        for table in plans.tables.values():
            try:
                min_col, min_row, max_col, max_row = range_boundaries(table.ref)
            except (TypeError, ValueError):
                continue
            table_ranges.append((table, min_col, min_row, max_col, max_row))

        # Delete by header name rather than a fixed position to preserve all other fields.
        plans.delete_cols(column_index, 1)

        # openpyxl does not automatically update worksheet AutoFilter/table metadata
        # when deleting columns, so update those ranges explicitly to keep the XLSX valid.
        if worksheet_filter_ref:
            try:
                min_col, min_row, max_col, max_row = range_boundaries(worksheet_filter_ref)
                if min_col <= column_index <= max_col:
                    max_col -= 1
                elif column_index < min_col:
                    min_col -= 1
                    max_col -= 1
                if max_col >= min_col:
                    plans.auto_filter.ref = (
                        f"{get_column_letter(min_col)}{min_row}:"
                        f"{get_column_letter(max_col)}{max_row}"
                    )
            except (TypeError, ValueError):
                pass

        for table, min_col, min_row, max_col, max_row in table_ranges:
            if min_col <= column_index <= max_col:
                table_column_index = column_index - min_col
                if 0 <= table_column_index < len(table.tableColumns) and table.tableColumns[table_column_index].name == "target_hours":
                    del table.tableColumns[table_column_index]
                else:
                    table.tableColumns = [
                        table_column for table_column in table.tableColumns
                        if table_column.name != "target_hours"
                    ]
                for column_id, table_column in enumerate(table.tableColumns, start=1):
                    table_column.id = column_id
                max_col -= 1
            elif column_index < min_col:
                min_col -= 1
                max_col -= 1
            if max_col >= min_col:
                table.ref = (
                    f"{get_column_letter(min_col)}{min_row}:"
                    f"{get_column_letter(max_col)}{max_row}"
                )
                if table.autoFilter is not None:
                    table.autoFilter.ref = table.ref

        return True

    def _validate_workbook_contract(self, workbook):
        required = set(self.schema.DOMAIN_ENTITIES) | {"_System", "_Lists", "AuditLog"}
        missing = required - set(workbook.sheetnames)
        if missing:
            raise ValueError(f"SHEET_MISSING:{sorted(missing)}")

        if self._system_version(workbook) != self.schema.SCHEMA_VERSION:
            raise ValueError(f"SCHEMA_VERSION:{self._system_version(workbook)}")

        for entity in self.schema.DOMAIN_ENTITIES:
            rows = list(workbook[entity].values)
            if not rows or list(rows[0]) != self.schema.HEADERS[entity]:
                raise ValueError(f"HEADER_MISMATCH:{entity}")

        audit_rows = list(workbook["AuditLog"].values)
        if not audit_rows or list(audit_rows[0]) != self.schema.HEADERS["AuditLog"]:
            raise ValueError("HEADER_MISMATCH:AuditLog")

    def _migrate_a3_maintenance_shift(self, workbook):
        """Append the Maintenance shift field to an existing A.3 workbook safely.

        Existing records are preserved and receive a blank shift; the migration
        never infers Day/Night from calendar date or clock time.
        """
        if getattr(self.schema, "SCHEMA_VERSION", None) != "A.3":
            return False
        if "Maintenance" not in workbook.sheetnames:
            raise ValueError("SHEET_MISSING:Maintenance")
        worksheet = workbook["Maintenance"]
        current_headers = [cell.value for cell in worksheet[1]]
        expected_headers = list(self.schema.HEADERS["Maintenance"])
        if current_headers == expected_headers:
            return False
        legacy_headers = [header for header in expected_headers if header != "shift"]
        if current_headers != legacy_headers:
            raise ValueError("HEADER_MISMATCH:Maintenance")
        new_column = len(current_headers) + 1
        worksheet.cell(row=1, column=new_column, value="shift")
        # Keep worksheet filtering aligned with the appended column when present.
        if worksheet.auto_filter.ref:
            from openpyxl.utils.cell import range_boundaries
            from openpyxl.utils import get_column_letter
            try:
                min_col, min_row, max_col, max_row = range_boundaries(worksheet.auto_filter.ref)
                if max_col < new_column:
                    worksheet.auto_filter.ref = (
                        f"{get_column_letter(min_col)}{min_row}:"
                        f"{get_column_letter(new_column)}{max_row}"
                    )
            except (TypeError, ValueError):
                pass
        return True

    def _migrate_a3_issue_hse_shift_time(self, workbook):
        """Append time and shift fields to existing A.3 Issues/HSE sheets safely.

        Existing values are preserved, and historical records receive blank values.
        The migration never guesses a shift from date or time.
        """
        if getattr(self.schema, "SCHEMA_VERSION", None) != "A.3":
            return False

        changed = False
        specifications = {
            "Issues": ("issue_time", "shift"),
            "HSE": ("event_time", "shift"),
        }
        for entity, added_fields in specifications.items():
            if entity not in workbook.sheetnames:
                raise ValueError(f"SHEET_MISSING:{entity}")
            worksheet = workbook[entity]
            current_headers = [cell.value for cell in worksheet[1]]
            expected_headers = list(self.schema.HEADERS[entity])
            if current_headers == expected_headers:
                continue
            legacy_headers = [header for header in expected_headers if header not in added_fields]
            if current_headers != legacy_headers:
                raise ValueError(f"HEADER_MISMATCH:{entity}")
            for header in added_fields:
                worksheet.cell(row=1, column=worksheet.max_column + 1, value=header)
            if worksheet.auto_filter.ref:
                try:
                    min_col, min_row, max_col, max_row = range_boundaries(worksheet.auto_filter.ref)
                    new_last_col = worksheet.max_column
                    if max_col < new_last_col:
                        worksheet.auto_filter.ref = (
                            f"{get_column_letter(min_col)}{min_row}:"
                            f"{get_column_letter(new_last_col)}{max_row}"
                        )
                except (TypeError, ValueError):
                    pass
            changed = True
        return changed

    def load(self):
        wb = load_workbook(self.path, data_only=False)
        expected_schema = getattr(self.schema, "SCHEMA_VERSION", None)
        if expected_schema and self._system_version(wb) != expected_schema:
            raise ValueError(f"SCHEMA_VERSION:{self._system_version(wb)}")
        if expected_schema == "A.3":
            required_migration_sheets = {"Operations", "GlobalCapacity", "Checker"}
            missing = required_migration_sheets - set(wb.sheetnames)
            if missing:
                raise ValueError(f"SHEET_MISSING:{sorted(missing)}")
        migrated = self._migrate_a3_checker_support_headers(wb)
        nik_sheet_migrated = self._migrate_a3_nik_sheet(wb)
        rainfall_sheet_migrated = self._migrate_a3_rainfall_simulation_sheet(wb)
        top_soil_migrated = self._migrate_a3_top_soil_material(wb)
        plan_hours_migrated = self._migrate_a3_remove_plans_target_hours(wb)
        maintenance_shift_migrated = self._migrate_a3_maintenance_shift(wb)
        issue_hse_shift_time_migrated = self._migrate_a3_issue_hse_shift_time(wb)
        if migrated or nik_sheet_migrated or rainfall_sheet_migrated or top_soil_migrated or plan_hours_migrated or maintenance_shift_migrated or issue_hse_shift_time_migrated:
            wb.save(self.path)
        wb = load_workbook(self.path, data_only=True)
        self._validate_workbook_contract(wb)
        if [cell.value for cell in wb["NIK"][1]] != self.schema.NIK_HEADERS:
            raise ValueError("HEADER_MISMATCH:NIK")

        for entity in self.schema.DOMAIN_ENTITIES:
            rows = list(wb[entity].values)
            self._data[entity] = {}
            pk = self.schema.PKS[entity]
            for values in rows[1:]:
                if all(value is None for value in values):
                    continue
                row = dict(zip(self.schema.HEADERS[entity], values))
                self._data[entity][row[pk]] = row

        values = list(wb["_Lists"].values)
        if values:
            workbook_lists = {
                header: {
                    row[i]
                    for row in values[1:]
                    if i < len(row) and row[i] not in (None, "")
                }
                for i, header in enumerate(values[0])
                if header not in (None, "")
            }
            required_lists = set(self.schema.CONTROLLED.values())
            missing_lists = sorted(required_lists - set(workbook_lists))
            if missing_lists:
                raise ValueError(f"CONTROLLED_LIST_MISSING:{missing_lists}")
            self.controlled_lists = workbook_lists

        rows = list(wb["AuditLog"].values)
        self._audit = [
            dict(zip(self.schema.HEADERS["AuditLog"], values))
            for values in rows[1:]
            if not all(value is None for value in values)
        ]

    def save(self):
        if not self.path:
            return

        wb = load_workbook(self.path)
        self._validate_workbook_contract(wb)

        for entity in self.schema.DOMAIN_ENTITIES:
            ws = wb[entity]
            if ws.max_row > 1:
                ws.delete_rows(2, ws.max_row - 1)
            for row in self.all(entity):
                ws.append([row.get(header) for header in self.schema.HEADERS[entity]])

        ws = wb["AuditLog"]
        if ws.max_row > 1:
            ws.delete_rows(2, ws.max_row - 1)
        for row in self.audit():
            ws.append([row.get(header) for header in self.schema.HEADERS["AuditLog"]])

        with NamedTemporaryFile(
            prefix=self.path.stem + ".",
            suffix=self.path.suffix,
            dir=self.path.parent,
            delete=False,
        ) as file:
            temp_path = Path(file.name)

        try:
            wb.save(temp_path)
            temp_path.replace(self.path)
        finally:
            if temp_path.exists():
                temp_path.unlink()
