# Stage 26 — Data File Management Contract

Status: IMPLEMENTED / AWAITING LOCAL REGRESSION
Workspace: V37
Stage: 26
Schema: A.3

## Scope

Named editable operational datasets for the Desktop Master.

## Functional Contract

1. **Save**
   - Updates the currently active dataset.
   - Reuses the same dataset identity and filename.
   - Repeated Save operations do not create additional dataset files.
   - If no active dataset exists, Save creates Mine-Services-Working.json.

2. **Save As**
   - Creates a new dataset file with a new dataset identity.
   - The new dataset becomes the active working dataset.
   - The previous dataset remains unchanged.
   - An existing dataset name is not overwritten by Save As.

3. **Load Data**
   - Loads a named saved dataset into the current runtime.
   - Dataset schema and entity payload are validated before replacement.
   - Current runtime audit history is retained and the load is audited.
   - After a successful load, subscribed UI modules refresh through the shared data-sync boundary.

4. **Backup**
   - Remains a separate recovery mechanism.
   - Every Backup creates a new sealed SHA-256 snapshot.
   - Backup files are not editable working datasets.

5. **Restore**
   - Remains a recovery operation for sealed backup snapshots.
   - Restore does not change the Save / Save As dataset identity contract.

## Storage

Editable datasets are stored under:

Database/Datasets/

Each dataset is a JSON document containing dataset metadata, schema version, and operational entity data. Audit history is maintained by the runtime database and is not used as the editable dataset payload.

## Runtime Operations

- LIST_DATASETS
- SAVE_DATASET
- SAVE_AS_DATASET
- LOAD_DATASET

## Design Principle

The UI intentionally resembles common application file workflows, while the runtime keeps Dataset Management separate from Backup / Restore so that ordinary Save does not become a new recovery snapshot.

## Acceptance Gate

Required evidence:

- Save twice → one dataset file, same dataset identity.
- Save As → second dataset file, new identity, new active dataset.
- Load Data → selected dataset replaces runtime data and refreshes modules.
- Existing Backup / Restore behavior remains green.
- Full regression suite remains green.
