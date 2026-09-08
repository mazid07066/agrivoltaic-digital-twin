# AgriTwin Phase 12 Closure Record

## Status

**FORMALLY COMPLETE**

Phase 12 — Cross-Model Validation & Explainability Studio — has completed
implementation, reconciliation with the formally closed Phase 11 branch,
repository-wide verification and final acceptance.

## Branch

`feature/phase-12-validation-explainability`

## Route

`/validation`

## Studio

**Validation & Explainability Studio**

The studio provides:

- dataset ingestion;
- canonical timestamp processing;
- synchronization and compatibility inspection;
- cross-model comparison;
- statistical validation metrics;
- scientific visualization;
- model-stage explainability;
- provenance inspection;
- research-oriented exports.

## Supported validation sources

Phase 12 supports validation datasets originating from:

- AgriTwin;
- PVlib;
- Simulink;
- measured observations;
- generic CSV/XLSX time-series datasets compatible with the canonical import contract.

## Dataset import

Implemented import capabilities include:

- CSV;
- XLSX;
- automatic column inspection;
- canonical variable identification;
- configurable column mapping;
- PVlib aliases;
- Simulink aliases;
- AgriTwin result recognition;
- AgriTwin hourly power/weather merging;
- canonical timestamp conversion;
- timezone-aware local timestamp conversion;
- variable-level provenance;
- unit normalization.

## Canonical timestamp policy

Internal synchronization uses absolute canonical timestamps.

Timestamp handling explicitly supports:

- timezone-aware timestamps;
- local timestamps with declared timezone;
- canonical conversion to absolute time;
- duplicate-timestamp detection;
- bounds validation.

For the Feni validation context, human-facing reporting uses:

`Asia/Dhaka`

UTC remains the authoritative internal synchronization basis.

## Synchronization policy

The authoritative Phase 12 synchronization method is:

`exact canonical timestamp intersection`

Only timestamps occurring exactly in every compared dataset are used.

Different:

- source date ranges;
- source row counts;
- sampling coverage;

are permitted when exact common timestamps exist.

The synchronization layer does not silently perform:

- interpolation;
- extrapolation;
- nearest-neighbour matching;
- timestamp rounding;
- timestamp shifting;
- silent resampling;
- silent date-range truncation.

Synchronization is blocked when appropriate for:

- zero exact overlap;
- duplicate timestamps;
- unresolved timezone incompatibility;
- absence of common canonical variables.

## Cross-model comparison

Implemented comparison views include:

- overlay;
- residual;
- parity scatter;
- y=x reference;
- daily energy;
- cumulative energy.

Residual convention:

`candidate - reference`

Visualization reduction may be used only for rendering performance.

Statistical calculations continue to use the complete synchronized
comparison series.

## Statistical metrics

Implemented metrics include:

- Mean Bias Error (MBE);
- Mean Absolute Error (MAE);
- Root Mean Square Error (RMSE);
- normalized RMSE;
- coefficient of determination (R²);
- correlation;
- total-series error.

The interface distinguishes power-series total error from true
energy-error terminology.

## Explainability

The Explainability Studio reports available scientific evidence across
model stages including:

- environmental/weather input;
- plane-of-array irradiance;
- optical/IAM effects;
- shading and soiling;
- thermal behavior;
- DC generation;
- string and MPPT topology;
- inverter conversion;
- AC output;
- crop irradiance where available.

Explainability is provenance-oriented and evidence-constrained.

No unsupported causal attribution is invented.

Where a canonical dataset does not expose a specific intermediate stage,
the studio explicitly reports that limitation.

## Provenance

Phase 12 preserves dataset provenance including:

- source type;
- source file;
- variable source;
- unit conversion;
- timestamp transformation;
- timezone conversion;
- canonical variable mapping;
- preprocessing transformations.

## Research exports

Implemented exports include:

- aligned CSV;
- comparison XLSX;
- metrics XLSX;
- explainability XLSX;
- publication-oriented PNG;
- vector SVG;
- browser print / Save PDF;
- report metadata;
- figure metadata.

Human-visible report timestamps for the Feni research context are
rendered in site-local time.

## Site-aware reporting

Current validation site:

- Site: Feni, Bangladesh
- Station: BDFE2
- Latitude: 22.80029
- Longitude: 91.35819
- Display timezone: Asia/Dhaka
- UTC offset: UTC+06:00

A previously observed six-hour chart-display offset was corrected by
formatting canonical timestamps using the site timezone for human
reporting while preserving absolute timestamps internally.

## Scientific classification

AgriTwin-to-PVlib and AgriTwin-to-Simulink comparisons are classified as:

**cross-model verification**

They are not, by themselves, empirical validation of the complete
digital twin.

Empirical validation requires synchronized measured observations of the
relevant physical output.

Measured environmental observations at Feni validate the environmental
layer only.

Phase 12 does not claim that Feni environmental measurements directly
validate:

- PV DC power;
- inverter AC output;
- crop DLI;
- crop yield;
- plant-level system performance;
- the complete agrivoltaic digital twin.

## Phase 11 reconciliation

Before final Phase 12 acceptance, the Phase 12 branch was fast-forwarded
through the formally closed Phase 11 branch.

Phase 12 therefore includes:

- Phase 10 measured-data foundation;
- Phase 11 Feni Gold synchronization;
- Phase 11 provider synchronization;
- bounded cleaning/interpolation policy;
- causal feature foundation;
- chronological splits;
- Phase 11 manifests and fingerprints;
- Phase 11 formal closure records.

## Final verification

Final repository-wide acceptance results:

- TypeScript: PASS
- ESLint: PASS
- ESLint errors: 0
- ESLint warnings: 3
- Phase 10 + 11 Python tests: 54 passed
- Python compile: PASS
- Phase 12 validation tests: 41 passed
- Phase 12 validation test files: 13 passed
- Full Vitest suite: 350 passed
- Full Vitest test files: 92 passed
- Next.js production build: PASS
- dependency audit: 0 vulnerabilities
- `git diff --check`: PASS

The three retained ESLint warnings are non-blocking:

- unused `validationSiteCoordinateLabel`;
- `<img>` optimization advisory in validation export/report code;
- unused `copyResearchSvgStyles`.

They do not affect type safety, tests, build acceptance or Phase 12
scientific behavior.

## Key Phase 12 implementation commits

Recorded Phase 12 implementation history includes:

- `102ebdd` — `feat(validation): complete Phase 12 site-aware validation and explainability`
- `ca3912d` — `feat(validation): finalize Phase 12 site-aware reporting and local-time exports`
- `08ea840` — `fix(validation): align datasets by exact timestamp intersection`
- `3590dc0` — `docs(project): record AgriTwin development history through Phase 12`

Phase 12 was subsequently reconciled with the formally closed Phase 11
history before final acceptance.

## Known limitations

Phase 12 does not provide:

- plant-level measured DC validation;
- measured inverter AC validation;
- complete agrivoltaic empirical validation;
- uncertainty quantification of all model stages;
- parameter identification from measured plant data;
- final machine-learning forecasting;
- closed-loop controller synthesis;
- bidirectional field control.

These remain appropriate future research/development directions.

## Closure

All required Phase 12 implementation, synchronization, scientific
reporting, verification, regression, build and repository gates have
passed.

**PHASE_12_VERIFICATION_STATUS: PASSED**

**PHASE_12_STATUS: FORMALLY COMPLETE**
