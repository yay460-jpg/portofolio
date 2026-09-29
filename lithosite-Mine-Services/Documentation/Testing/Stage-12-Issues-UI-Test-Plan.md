# Stage 12 — Issues UI Test Plan

## Shell
1. Open V24 Stage 12 artifact.
2. Confirm Desktop Master shell loads.
3. Expand/collapse sidebar.
4. Select **Issues**.
5. Confirm Issues becomes the active workspace without leaving the shell.
6. Confirm Dashboard, Operations, Equipment, Work Front and Maintenance remain reachable.

## Issues Data
1. Confirm Runtime Ready state.
2. Confirm Issues records load.
3. Confirm domain, severity and status filters populate from _Lists.
4. Confirm Work Front and Equipment filters resolve from runtime data.
5. Confirm human-facing Equipment `unit_no` is shown where available.

## CRUD
1. Add a valid Issue and save via RuntimeAdapter.
2. Confirm record appears in the table.
3. Edit the Issue.
4. Confirm updated values persist.
5. Delete the Issue.
6. Confirm the record disappears.
7. Confirm runtime messages report committed/audited mutations.

## Validation
1. Use an invalid Work Front reference — expect rejection.
2. Use an invalid Equipment reference — expect rejection.
3. Use an invalid severity/status/domain — expect rejection.
4. Set Status = Closed without Closed At — expect rejection.
5. Set a non-Closed status with Closed At — expect rejection.
6. Set Status = Closed with Closed At — expect commit.

## Visual Consistency
- Dark navy Desktop Master layout remains unchanged.
- Issues follows the existing CRUD table/modal conventions.
- Edit/Delete buttons use the common mini-button contract.
- Native date/datetime controls retain the existing dark picker treatment.
- No layout is moved outside the shell.
