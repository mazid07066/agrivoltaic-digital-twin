# AgriTwin Phase 9O — Relative Row-Shading Geometry Correction

## Problem

The previous geometric PV row-shading calculation used:

collector vertical rise + absolute mounting clearance

as the PV-to-PV obstruction height.

For adjacent equal-height rows this is physically incorrect because the common mounting elevation cancels.

For a 2.078 m collector tilted at 22 degrees:

collector vertical rise =
2.078 × sin(22 degrees)
≈ 0.778 m

The former calculation could instead use approximately:

2.000 + 0.778 =
2.778 m

when panel clearance was 2 m.

## Correction

AgriTwin now separates:

### PV-to-PV self-shading

Uses relative collector geometry.

For equal-height rows:

relative obstruction height =
collectorLength × sin(surfaceTilt)

Common mounting clearance does not affect PV row-to-row shading.

### PV-to-ground/crop shading

Uses absolute collector elevation.

Mounting clearance therefore remains relevant to crop and ground shadow geometry.

## Shared Physics

Both Land and Rooftop use the shared `simulatePhysicsTimestep()` pathway.

Therefore both physics model identities were advanced to Phase 9O.

## Legacy Compatibility

The historical empirical spacing and height factors remain isolated to `legacy_parity`.

Physics/reference modes use the scientific shading implementation and do not consume those empirical factors.

## Regression Tests

Phase 9O verifies:

- 2.078 m collector at 22 degrees gives approximately 0.778 m vertical rise;
- equal-height PV row shading is invariant to common mounting clearance;
- ground/crop shadow remains sensitive to absolute mounting clearance;
- row-shading geometry responds to surface tilt;
- high solar elevation can produce zero row shading;
- shared Land/Rooftop physics preserves the relative-height invariant.

## Physics Versions

- `agritwin-land-phase9o-relative-row-shading-v1`
- `agritwin-rooftop-phase9o-relative-row-shading-v1`

## Deferred Refinement

The detailed Land spatial crop-shadow model remains a simplified ground-footprint model.

A future dedicated geometry phase may replace it with full module-edge ray tracing without altering the Phase 9O PV-to-PV correction.
