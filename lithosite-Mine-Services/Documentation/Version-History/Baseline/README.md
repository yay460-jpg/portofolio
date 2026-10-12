# Baseline

## Current locked baseline

**Status:** LOCKED  
**Product:** Lithosite Mine Services  
**Canonical artifact:** `Artifacts/Mine-Services-Operations.html`  
**Schema:** A.3  
**Database:** `Database/Mine-Services-Database-A3.xlsx`

See [V40 Baseline Lock](./V40-Baseline-Lock.md) for the release decision, evidence, commit, and explicitly deferred gates.

## Historical baselines

Earlier baseline lock documents remain in this directory as historical records only. Their runtime artifacts and version-specific filenames are not kept in the active Artifacts folder.

## Current development workspace

The fresh workspace branch is `v41-workspace`, created from the promoted `main` baseline. See [V41 Workspace Initialization](../V41-Workspace-Initialization.md). All development changes belong on the workspace branch; `main` remains the locked baseline until a later release is explicitly promoted. Runtime filenames remain version-neutral; version history belongs in Documentation.

Runtime operations must never overwrite the baseline or mutate the operational database without authorization.
