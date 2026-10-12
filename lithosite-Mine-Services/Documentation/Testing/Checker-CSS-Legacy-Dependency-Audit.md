# Checker CSS Legacy Dependency Audit

**Branch:** `v40-workspace`  
**Audit baseline:** commit `46b71ac1` (Full Pytest workflow run #345: PASS)  
**Scope:** Determine whether `ui/modules/checker/checker.css` is still an active screen stylesheet or a legacy test dependency.  
**Status:** Cleanup applied; full Pytest validation after CSS deletion is pending.

## Findings from the active shell

- `Artifacts/Mine-Services-Operations.html` does **not** load `checker.css` as a stylesheet.
- The active shell contains no `id="checkerScreen"` or `id="checkerModal"` element.
- The shell still loads `ui/modules/checker/checker.js`. Its module header describes Checker as a support layer for operation-linked field-observation evidence, not a standalone operational screen.
- The active shell's shared inline CSS and `ui/shared/table.css` still include some `#checkerScreen` selectors. They do not make `checker.css` active, but they are stale screen-scoped compatibility selectors until their removal is validated.
- Therefore, the stylesheet was classified as **unlinked legacy screen CSS**. Reference checks covered all three repository HTML artifacts, `checker.js`, and the active CSS test inventories. No non-screen consumer was found. The JavaScript support layer remains in scope and was retained.

## Test dependency classification

| Test file | Checker-related assertion area | Classification | Safe next action |
|---|---|---|---|
| `tests/test_css_duplicate_rules.py` | Local `.control`, `.control.primary`, and `.mini` rules in `checker.css` | **LEGACY** | Retire only the Checker-screen CSS contract test after confirming no active screen consumes those rules. Preserve tests for shared button contracts and all active modules. |
| `tests/test_shared_field_control_css.py` | Checker screen/modal field selectors and focus rule in `checker.css` | **LEGACY** for Checker selectors; **SHARED CONTRACT** for the shared field stylesheet and active screen checks | Remove Checker from the module inventory; retain shared field control assertions for active screens. |
| `tests/test_shared_field_label_css.py` | Checker screen/modal label selectors in `checker.css` | **LEGACY** for Checker selectors; **SHARED CONTRACT** for shared label typography and stylesheet order | Remove Checker from the module inventory; keep active-module label coverage. |
| `tests/test_shared_runtime_error_css.py` | Checker-specific `.runtime-msg` layout in `checker.css`; shared error palette includes a Checker selector | **LEGACY** for Checker-specific layout; **SHARED CONTRACT** for error palette behavior on active screens | Retain palette checks for active screens and Reports. Remove Checker-only layout assertions after checking other consumers. |
| `tests/test_shared_screen_header_css.py` | Checker stylesheet included in the list of modules checked for duplicate shared heading typography | **LEGACY** | Remove Checker stylesheet from the active stylesheet inventory; preserve active module header ownership checks. |
| `tests/test_shared_screen_primitives_css.py` | Checker-specific `.controls` and `.empty` rules; shared inline selector group includes Checker | **LEGACY** for Checker screen; **SHARED CONTRACT** for primitives used by active modules | Remove Checker from active module expectations. Only remove the inline compatibility selector after checking all shell consumers. |
| `tests/test_shared_table_header_css.py` | Checker-specific `.checker-tr.th` and `.tablehead` expectations; shared table header group includes Checker | **LEGACY** for Checker table; **SHARED CONTRACT** for active table headers and shared tablehead geometry | Remove Checker from the active module/header inventories; retain all active-module and Workfront-specific assertions. |
| `tests/test_shared_table_layout_css.py` | Checker grid/filter layout exceptions and inclusion in shared table layout groups | **LEGACY** for Checker screen layout; **SHARED CONTRACT** for shared table layout/filter geometry | Remove Checker from active screen inventories; preserve the active-module geometry and filter assertions. |

## Guardrails

1. Do **not** delete `checker.js`; it is still loaded by the active shell and provides operation-linked Checker evidence support.
2. Do **not** remove shared field, button, error, screen primitive, or table contracts that are used by active screens.
3. Reference audit complete: no `checker.css` links remain in the three HTML artifacts, `checker.js`, or active CSS test inventories. The stylesheet was deleted in commit `4f639e9b` as a separate, reversible change.
4. Update test inventories and stale shell selector groups in a separate, narrowly scoped patch. Do not mix this with unrelated UI/CSS changes.
5. Run focused tests for every touched contract, then the full `python -m pytest -q` suite. Require clean CI before considering the CSS file deletion.
6. Keep any removal of the unlinked stylesheet as a distinct follow-up commit so a regression can be reverted independently.

## Current decision

**Decision: legacy Checker screen CSS removed; Checker JavaScript retained.** Full Pytest run #351 passed after the CSS deletion: **548 passed in 50.89s**. The Checker CSS cleanup is validated PASS; the earlier run #346 failure was an intermediate commit where the field-control test inventory had not yet been synchronized, and was corrected in #347.
