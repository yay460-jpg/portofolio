# Stage 5 — Adapter Security Boundary

## Purpose

Define the security boundary for the Lithosite UI/API adapter without changing the offline runtime contracts.

## Controls

- Treat all adapter input as untrusted transport data.
- Validate request envelope shape before routing.
- Require request IDs for correlation and mutation idempotency.
- Do not expose repository, persistence, validator, transaction, or audit objects.
- Do not leak runtime exception details through adapter responses.
- Preserve existing application/import/restore validation and atomicity.
- Keep the core runtime offline; transport integration must not introduce a network dependency into persistence.
- Keep baseline artifacts outside runtime mutation.

## Non-Goals

This document does not define authentication, authorization, TLS, API gateway policy, or deployment-specific transport controls. Those belong to the eventual host application/API layer and must be added without bypassing the RuntimeAdapter boundary.

## Acceptance

Any future transport implementation must satisfy this adapter boundary before it is allowed to invoke Mine Services runtime operations.
