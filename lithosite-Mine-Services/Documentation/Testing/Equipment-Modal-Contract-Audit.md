# Equipment Modal Contract Audit

**Branch:** `v41-workspace`  
**Scope:** Equipment screen, Equipment form, Unit List, Global Capacity references, NIK Owner Name selection, shared modal and delete-confirmation contracts.

## Canonical sources of truth

- **Equipment worksheet / RuntimeAdapter `Equipment` entity:** the only canonical store for Equipment/Unit records in the current A.3 schema. Unit List is a view over these same records, not a second `Units` sheet or browser-side database.
- **Global Capacity worksheet / `GlobalCapacity` entity:** the canonical capacity profile. Equipment stores `capacity_profile_id`; Brand and Capacity in the form/table are resolved from the selected profile and are not independently editable.
- **NIK worksheet / RuntimeAdapter `NIK` entity:** the canonical employee register. Owner Name choices are populated from registered NIK records; the Equipment UI does not create another employee list.
- **RuntimeAdapter:** the sole mutation boundary for Equipment create/update/delete. No `localStorage` or `indexedDB` persistence is used.

## Modal responsibilities

| UI surface | Responsibility | Mutation path |
|---|---|---|
| Equipment screen | Search/filter/inspect canonical Equipment records; show records on Map; open the shared form | Read through RuntimeAdapter |
| Unit List modal | Alternate compact view of the same Equipment records; type filter; Add Unit, Edit, Delete | Same Equipment form and RuntimeAdapter entity; no separate storage |
| Equipment form modal | Single create/update form for canonical Equipment records | RuntimeAdapter CREATE/UPDATE |
| List NIK / Employee Profile | Maintain/read the canonical NIK register and profile photo | NIK RuntimeAdapter contract and dedicated photo endpoint |
| Global Capacity modal | Maintain canonical capacity profiles | GlobalCapacity RuntimeAdapter contract |
| Modal shell / Delete confirmation | Own common modal geometry, visibility, and confirmation presentation | Shared `LithositeModalShowContract` and `LithositeDeleteConfirmContract` |

## Findings corrected

1. Removed the obsolete Registered Unit Reference selector and its state/handlers. That path made the main **Add Equipment** action require an existing Equipment record and then update it, rather than creating a new record.
2. Both **Add Equipment** and **Add Unit** now use the same form and canonical `Equipment` entity. The different title describes the entry point; it does not create a second data store.
3. Centralized Equipment and Global Capacity reads in `readCanonicalRecords()`. Initial load, refresh, and Unit List refresh now use the same read path; the two entities are each requested in one place.
4. Made refresh success/failure explicit so a refresh error is not overwritten by a false success message, and removed the redundant second refresh after saving from Unit List.
5. Consolidated Equipment CSS, removed the obsolete reference-hint rule and retained only intentional responsive overrides.
6. Added regression checks for canonical-source use, modal ownership, shared confirmation, current asset cache keys, and the centralized read path.
7. Synchronized the served artifact and version-history UI snapshot.

## Verification

The full Pytest workflow completed successfully on the audited code at commit
`5df272ee99ab8620cac6aa1b66676a56bc07ea50`: **750 passed in 52.81s**.

This records code/test verification. A separate manual Desktop Host smoke test should still exercise Add Equipment, Add Unit, Edit, Delete, filtering, RuntimeAdapter failure, and returning to Unit List after save/cancel.

## Follow-up regression fixes (15 October 2026)

A source re-check found two lifecycle inconsistencies after the initial audit:

1. The Equipment ready message claimed "offline local persistence" despite the RuntimeAdapter-only mutation contract. It now states that canonical records were loaded.
2. After a successful CREATE/UPDATE, the save path did not inspect the boolean result of the canonical refresh and could report a normal success even when the list refresh failed. It also issued a redundant Unit List refresh and duplicate render. Save now reports committed-but-refresh-failed explicitly, performs one canonical refresh, and reopens Unit List without issuing a second read.
3. Added `tests/test_equipment_modal_contract_regressions.py` to guard the status message, save/refresh outcome, and matching served-artifact/snapshot cache key.

The served artifact and version-history UI snapshot both use the refreshed Equipment asset key `20261015-equipment-contract-audit2`.

**Verification boundary:** These changes have been committed to `v41-workspace`. The regression assertions have not yet been executed in a local full Pytest run, and the Desktop Host manual smoke test remains outstanding. Do not interpret this documentation update as a PASS claim.

## Verification update (15 October 2026, CI #1198)

- Full Pytest completed on commit `22c71cc8bb2f8801ffdf0270bef075bf277e2e51`: **753 passed in 73.40s** on Python 3.13.
- The NIK photo upload parametrized cases now use explicit short pytest IDs. This keeps the oversized payload test intact while preventing pytest from deriving an environment/worker identifier from the full 100,001-byte parameter on Windows.
- The workflow verifies repository tests on its Linux runner. It does **not** by itself prove the user's local Windows environment is clean; rerun the suite on the same commit locally to confirm the environment-variable error is gone.
- Manual Desktop Host smoke testing remains outstanding: Add Equipment, Add Unit, Edit, Delete/reference rejection, filtering, RuntimeAdapter failure, and return-to-Unit-List behavior after save/cancel.
