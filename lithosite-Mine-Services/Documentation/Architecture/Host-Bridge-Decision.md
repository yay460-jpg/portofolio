# Stage 6 — Host Bridge Decision

## Decision

The existing Lithosite Mine Geologist runtime is a browser/PWA application, while Mine Services runtime is Python. A browser page cannot directly import the Python RuntimeAdapter.

Therefore Stage 6 uses an explicit bridge abstraction rather than introducing a browser-side database or pretending that the Python runtime is browser-native.

The first bridge implementation is an adapter-side executor contract. It can be backed later by an Android/local-process/IPC host without changing the UI request contract.

## Host Flow

    Lithosite UI
        |
        v
    HostIntegrationBridge
        |
        v
    Stage 5 RuntimeAdapter contract
        |
        v
    Concrete local runtime executor
        |
        v
    Mine Services Python runtime

## Locked Rule

The bridge is not allowed to implement Mine Services domain logic.

The bridge only:

- builds a request envelope;
- invokes the configured executor;
- preserves request_id;
- returns the runtime response;
- maps bridge-level transport failures to a stable host error.

No IndexedDB, localStorage, Google Apps Script, or remote API is introduced as a substitute for Mine Services persistence.

## Deployment Note

The concrete executor remains deployment-specific. For Android, a local process or IPC implementation can be supplied. For a browser-only deployment, Mine Services requires an actual local host/runtime capability before end-to-end execution is possible.

This decision prevents a false integration state while keeping the UI contract stable.
