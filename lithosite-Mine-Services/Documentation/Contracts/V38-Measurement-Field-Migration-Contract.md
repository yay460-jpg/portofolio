# V38 Measurement Field Migration Contract

## Status
**PASS / LOCKED** after runtime and workbook migration verification.

## Purpose
V38 standardizes the semantic field name **Measurement** for fields that describe the measurement unit of a quantity or capacity.

This is a schema/data migration, not a cosmetic label change.

## Canonical fields

| Entity | Retired field | Canonical field |
|---|---|---|
| Operations | `unit` | `measurement` |
| Operations | `capacity_unit` | `capacity_measurement` |
| Plans | `unit` | `measurement` |
| GlobalCapacity | `unit` | `measurement` |
| _Lists | `unit` | `measurement` |

### Explicit exception
`Equipment.unit_no` remains unchanged. It is an equipment/fleet identifier, not a measurement field.

## Runtime authority
The canonical A.3 schema in `src/mine_services/schema.py` is the only runtime schema.

The `_Lists` sheet remains the production controlled-vocabulary authority. Its measurement vocabulary values are unchanged:

- hour
- km
- m
- m2
- m3
- ton
- unit
- cycle

Only the field/list header is renamed.

## Workbook migration
Use the one-time migration:

```powershell
python -m src.mine_services.migrate_v38_measurement
```

The migration is idempotent and fails if an unexpected header conflict exists. It verifies the canonical headers after saving.

## Scope lock
This migration does not change:

- APP shell
- shared modal shell
- modal ownership
- Operation modal grid/layout
- runtime status accessory
- Operation business rules
- capacity values
- controlled-vocabulary values

## Regression rule
No new `unit` or `capacity_unit` schema-field references may be introduced. Future schema versions must retire A.3 before becoming the sole active schema.
