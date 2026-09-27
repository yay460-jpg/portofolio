# Stage 6 Baseline

## Status

- Stage 6: CONTRACT DEFINED — IMPLEMENTATION PENDING
- Stage 5: PASS — BASELINED
- Database schema: A.1
- Database mode: OFFLINE
- Phase A: LOCKED

## Reason

The Mine Services runtime is implemented in Python while the existing Lithosite Mine Geologist UI is a browser/PWA runtime. A concrete host bridge between those execution environments has not yet been selected. Therefore Stage 6 is not declared PASS and no browser-side duplicate persistence layer is introduced.

## Locked Decision

Host integration must invoke the Stage 5 RuntimeAdapter and must not bypass the runtime with a second authoritative database or UI-owned domain validation.

## Next Action

Select and implement the concrete host runtime/bridge, then run the Stage 6 end-to-end integration test plan before baselining Stage 6.
