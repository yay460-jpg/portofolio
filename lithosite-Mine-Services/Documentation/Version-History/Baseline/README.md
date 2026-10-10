# Baseline

## Current locked baseline — V39

**Status:** LOCKED / CLOSED TO FEATURE CHANGES  
**Product:** Lithosite Mine Services  
**Baseline branch:** `v39-workspace`  
**Validated code snapshot:** `5da238623454bc6df3f97feb57b07b7e89c26c4e`  
**Primary artifact:** `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html`  
**Validation:** `python -m pytest -q` — **434 passed in 27.15s**, reported from the local workstation on 2026-10-10.

See [V39 Baseline Lock](./V39-Baseline-Lock.md) for the scope, acceptance record, and close-out details.

## Superseded baseline

V38 is no longer the active locked baseline. Its workspace branch and V38-specific documents are retained as historical/rollback references; they are not the current baseline.

## Active development workspace

The active development workspace is `v40-workspace`, copied from the locked V39 state. New features and layout changes must be made in that workspace, not in the closed V39 baseline. See `../V40-Workspace-Initialization.md` for its scope and initial backlog.

Runtime operations must never overwrite the baseline.
