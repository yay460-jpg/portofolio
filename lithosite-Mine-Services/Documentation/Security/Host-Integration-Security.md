# Stage 6 — Host Integration Security Boundary

## Purpose

Define security controls for the eventual Lithosite host integration without weakening the locked Mine Services runtime boundary.

## Controls

- Treat all host-originated input as untrusted.
- Route every mutation through RuntimeAdapter.
- Preserve request_id for mutation correlation and idempotency.
- Never expose repository or persistence objects to UI code.
- Do not create a parallel authoritative UI database.
- Preserve runtime validation and atomicity.
- Preserve sanitized error behavior at the adapter boundary.
- Keep the core runtime offline.
- Keep baseline artifacts outside runtime mutation.

## Deployment-Specific Controls

Authentication, authorization, process isolation, IPC permissions, local file permissions, sandboxing, and transport security depend on the selected host runtime. Those controls must be documented before host integration is baselined.

## Non-Goal

This document does not authorize browser-side IndexedDB or localStorage as a replacement for the Mine Services persistence boundary.
