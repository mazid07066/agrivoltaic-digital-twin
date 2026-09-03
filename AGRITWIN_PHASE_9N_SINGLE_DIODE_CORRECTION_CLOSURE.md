# AgriTwin Phase 9N - Datasheet-Calibrated Single-Diode Correction

## Status

Completed and repository-verified on branch:

`feature/phase-9n-single-diode-correction`

## Corrected Defect

The previous AgriTwin single-diode implementation used approximate parameter construction and could incorrectly interpret module physical cell-count information as electrical series-cell information.

For the Canadian Solar CS1U-420MS reference module, the historical defect reproduced approximately:

- Datasheet Pmax: 420 W
- Previous modeled Pmp: 330.58 W
- Approximate power error: -21.29%

Phase 9N replaces that implementation with deterministic datasheet-calibrated and scientifically validated five-parameter single-diode physics.

## Reference Module

Canadian Solar CS1U-420MS:

- Pmax: 420 W
- Vmpp: 44.90 V
- Impp: 9.37 A
- Voc: 53.80 V
- Isc: 9.80 A
- gamma_Pmax: -0.37 %/degC
- beta_Voc: -0.29 %/degC
- alpha_Isc: +0.05 %/degC

## Implemented

Phase 9N provides:

- deterministic calibration of IL_ref;
- deterministic calibration of I0_ref;
- calibrated Rs;
- calibrated Rsh_ref;
- calibrated modified diode factor a_ref;
- direct a_ref use without requiring an invented electrical series-cell count;
- De Soto-style irradiance and temperature translation;
- implicit single-diode current solution;
- numerical open-circuit-voltage solution;
- convergent numerical maximum-power-point solution;
- sampled I-V curves retained for visualization only;
- deterministic calibration caching;
- STC validation;
- gamma_Pmax validation;
- beta_Voc validation;
- scientific PASS / WARNING / FAIL classification;
- failed scientific fits blocked from calibrated single-diode execution;
- parameter-identifiability warnings;
- removal of the runtime 72-series-cell fallback;
- ModuleOperatingPoint scientific diagnostics;
- Land scientific validation UI;
- updated research-export model description;
- distinct Phase 9N Land and Rooftop physics engine identities.

## Validation Gates

Required single-diode calibration gates:

- Pmp relative error <= 2%
- Vmp relative error <= 2%
- Imp relative error <= 2%
- Voc relative error <= 1%
- Isc relative error <= 1%
- gamma_Pmax absolute error <= 0.05 percentage point/degC
- beta_Voc absolute error <= 0.05 percentage point/degC

A failed required gate produces FAIL and blocks calibrated single-diode physics execution.

WARNING is used when the numerical scientific gates pass but limitations remain, such as weak Rsh identifiability or unavailable effective electrical series-cell count.

## Catalogue Validation

Representative catalogue calibration was tested.

Modules that cannot satisfy the configured scientific tolerance are explicitly classified FAIL instead of being silently accepted.

This preserves scientific traceability.

## Compatibility

Phase 9N preserves:

- Phase 7B legacy behavior;
- legacy-parity mode;
- separation of aggregate systemEfficiency from physics/reference mode;
- inverter modelling;
- string design;
- MPPT limits;
- editable MPPT topology including [1,1,1,1,1,2];
- Land execution;
- Rooftop execution;
- existing historical persisted runs.

## Physics Versions

Phase 9N uses:

- `agritwin-land-phase9n-single-diode-v2`
- `agritwin-rooftop-phase9n-single-diode-v2`

This distinguishes post-correction scientific execution from Phase 9H-9L physics.

## Database

No Phase 9N database migration was required.

Existing optional JSON physics persistence remains compatible with historical data.

## Verification

Completed successfully:

- Phase 9N focused tests: PASS
- catalogue calibration tests: PASS
- physics suite: PASS
- full repository suite: 81 test files / 308 tests PASS
- TypeScript: PASS
- ESLint: PASS
- npm run verify: PASS
- Next.js production build: PASS
- npm audit --omit=dev: 0 vulnerabilities
- git diff --check: PASS

## Branch

`feature/phase-9n-single-diode-correction`

## Commit

`feat(physics): calibrate single-diode module model`
