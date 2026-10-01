# Stage 19.6 — Grid Engine

## Purpose

Stage 19.6 provides a platform-neutral map grid generator for Mine Services.

The grid is generated from world-space bounds or directly from the active
viewport. It does not create DOM/SVG/canvas objects and does not draw anything.

## Grid model

A grid contains:

- spacing in world units;
- major-line interval;
- vertical lines;
- horizontal lines;
- active CRS;
- world-space bounds.

## Generation

viewport -> world-space bounds -> grid spacing -> vertical + horizontal lines

The first grid coordinate is aligned to the mathematical floor of the minimum
world coordinate divided by the configured spacing. This keeps grid alignment
stable while the viewport moves.

## Major lines

A line is marked "major: true" when its grid index is divisible by
"majorEvery".

The grid engine only provides this semantic marker. Visual styling remains the
responsibility of the renderer.

## CRS

Grid lines carry the CRS of the supplied bounds or viewport center.

No CRS transformation is performed.

## Scope

Implemented:

- configurable spacing;
- configurable major interval;
- world-space grid generation;
- viewport-based grid generation;
- stable grid alignment;
- CRS propagation;
- immutable returned grid snapshots.

Not implemented:

- label layout;
- rendering;
- collision avoidance;
- automatic adaptive spacing;
- UI interaction.
