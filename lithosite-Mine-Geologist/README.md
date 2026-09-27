# Lithosite

Lithosite is the product layer for mining operational software.

## Product Modules

- Mine Geologist
- Mine Services
- Mine Plan
- Mine Pit Control

## Current Position

Mine Geologist is the canonical runtime product in `lithosite-Mine-Geologist/`.

The former compatibility runtime has been retired; historical rollback is preserved through Git history.

Mine Services is the next independent module and is currently being developed from its Stage 1 Data Model foundation.

Mine Plan and Mine Pit Control are planned modules.

## Repository Rule

The canonical Mine Geologist runtime is preserved as a protected product boundary while Lithosite product documentation is maintained separately under `docs/lithosite/`.

See:

- `docs/lithosite/00_Product/Product-Architecture.md`
- `docs/lithosite/00_Product/Module-Map.md`
- `docs/lithosite/00_Product/Repository-Migration-Map.md`
- `docs/lithosite/00_Product/Security-Evolution.md`
