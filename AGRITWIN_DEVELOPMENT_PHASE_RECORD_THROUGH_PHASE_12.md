# AgriTwin Development Phase Record — Through Phase 12

**Project:** Weather-, Sensor- and Geometry-Aware Digital Twin for Agrivoltaic Land and Rooftop Systems  
**Repository:** `~/Projects/agrivoltaic-digital-twin`  
**Current OS:** Debian 13  
**Current branch:** `feature/phase-12-validation-explainability`  
**Purpose:** Persistent development record of completed phases, verified checkpoints, scientific constraints, unresolved work, and the next development sequence.

---

## 1. Current phase status

| Phase | Status | Summary |
|---|---|---|
| Phase 1–6 | Complete | Early application, geometry, simulation and platform foundation. |
| Phase 7 | Complete | Scientific agrivoltaic simulation core. |
| Phase 8 | Complete | Multi-site, Supabase, Land/Rooftop, environmental abstraction and immutable site foundation. |
| Phase 9 | Complete with later corrective extensions | Scenarios, reproducible execution, analytics, electrical model, validation export and scientific corrections through 9O. |
| Phase 10 | **FORMALLY COMPLETE** | Measured-data foundation using World Bank/ESMAP Feni data. |
| Phase 11 | **FORMALLY COMPLETE** | Deterministic Feni Gold synchronization, provider alignment, bounded cleaning, causal features, chronological splits, manifests and fingerprints completed and verified. |
| Phase 12 | **FORMALLY COMPLETE** | Validation & Explainability Studio, cross-model comparison, exact timestamp-intersection alignment, local-time reporting, explainability and research exports completed and verified. |

### Roadmap note

The current Phase 10–12 numbering supersedes the older early-project roadmap that used Phase 10 for IoT monitoring, Phase 11 for calibration/data fusion and Phase 12 for bidirectional control.

The active roadmap is:

- **Phase 10:** Measured-data foundation
- **Phase 11:** Feni Gold synchronization / provider synchronization / causal feature foundation
- **Phase 12:** Cross-model validation and explainability

---

## 2. Scientific constraints preserved across phases

- Preserve Phase 7B scientific-core parity unless changes are explicitly versioned.
- Physics/Research mode must not apply aggregate `systemEfficiency`.
- Never double-count inverter efficiency.
- Preserve `EnvironmentalDataset` as the canonical environmental abstraction.
- Preserve Open-Meteo/Feni provider provenance.
- Preserve immutable site versions and execution fingerprints.
- Preserve editable MPPT topology, including explicit distributions such as `[1,1,1,1,1,2]`.
- Keep old persisted runs readable.
- Do not invent manufacturer parameters.
- Failed module fit blocks physics/research execution.
- Incompatible physics-engine versions must not be silently compared.
- Validation must not silently interpolate, extrapolate, round timestamps, resample, truncate date ranges or convert units.
- PVlib/Simulink agreement is **verification**, not empirical validation.
- Empirical validation requires measured plant/output observations.

---

# 3. Phase 7 — Scientific Agrivoltaic Simulation Core

## Status
**COMPLETE**

## Delivered
- Solar position
- GHI / DNI / DHI handling
- Plane-of-array irradiance
- PV power
- Module temperature
- Fixed / standard / reverse / custom tracking
- Adaptive control
- Crop DLI
- Spatial DLI
- Crop-yield estimation
- Land Equivalent Ratio
- Field geometry

Phase 7 established the simulation core used by all later platform, analytics, validation and control work.

---

# 4. Phase 8 — Multi-Site Platform and Environmental Architecture

## Status
**COMPLETE**

## Delivered
- Supabase authentication
- Projects and multi-site support
- Land and Rooftop modes
- Site registry
- Immutable site versions
- Open-Meteo integration
- Uploaded dataset support
- Sensor/manual/synthetic modes
- Environmental provenance and fingerprints
- Rooftop geometry and solver foundation

---

# 5. Phase 9 — Reproducible Execution, Analytics, Electrical Modeling and Scientific Corrections

## Status
**COMPLETE**

### Phase 9A — Scenarios
- Baseline and alternative scenarios
- Duplication and lineage
- Versioned metadata

### Phase 9B — Environment
- Canonical `EnvironmentalDataset`
- Historical / forecast / typical / dataset / sensor sources

### Phase 9C — Reproducible execution
- Immutable input snapshot
- Environment fingerprint
- Execution fingerprint
- Persisted runs
- Summary / hourly / spatial outputs

### Phase 9D — Analytics
- Baseline comparison
- Policy evaluation
- Multi-run analytics
- Pareto
- MCDA
- Sensitivity
- Robustness

Recorded Rice study on 2026-08-20:
- baseline energy ≈ 97.47 kWh
- ALT-C energy ≈ 181.21 kWh
- MCDA order recorded as Standard > Fixed > Spacing 6 m > Height 4 m > Baseline

### Phase 9E — Electrical
- Inverter MPPT model
- SMA STP 50-40 reference profile
- Three-phase AC
- Feeders / loads / grid
- Operating states
- Electrical provenance and persistence
- No inverter-efficiency double counting

### Phase 9G — Research export / transparency closure
- XLSX
- PDF
- validation contracts
- topology exchange
- complete weather/power retention
- explicit scientific limitations

### Phase 9H–9L — Physics upgrade
- Explicit-loss physics
- improved topology consistency
- versioned physics behavior
- research-mode separation from legacy aggregate efficiency

### Phase 9M — Feni weather-range / outage repair
Recorded verification:
- TypeScript PASS
- ESLint PASS
- 78 Vitest files / 304 tests PASS
- Next.js production build PASS
- dependency audit 0 vulnerabilities
- Vercel trace PASS
- patch application check PASS

### Phase 9N — Single-diode correction
Reference module: Canadian Solar CS1U-420MS

Recorded reference values:
- Pmax 420 W
- Vmp 44.90 V
- Imp 9.37 A
- Voc 53.80 V
- Isc 9.80 A
- Pmax coefficient -0.37 %/°C
- Voc coefficient -0.29 %/°C
- Isc coefficient +0.05 %/°C

Corrected fit example:
- ILRef ≈ 9.805 A
- I0Ref ≈ 1.17e-11 A
- Rs ≈ 0.299 Ω
- RshRef ≈ 999 kΩ
- aRef ≈ 1.960

Corrected behavior:
- STC Pmp ≈ 420.68 W
- Vmp ≈ 44.90 V
- Imp ≈ 9.369 A
- Voc ≈ 53.80 V
- 65 °C Pmp ≈ 365.46 W
- 65 °C Voc ≈ 47.93 V

Recorded verification:
- 81 test files / 311 tests PASS
- TypeScript PASS
- Next build PASS
- dependency audit later reached 0 vulnerabilities

### Phase 9O — Relative row shading
Physics versions:
- `agritwin-land-phase9o-relative-row-shading-v1`
- `agritwin-rooftop-phase9o-relative-row-shading-v1`

Land and Rooftop share `simulatePhysicsTimestep()`.

Spatial-light refinement remains a future improvement, but does not reopen the completed row-shading correction.

---

# 6. Phase 10 — Measured-Data Foundation

## Status
# **FORMALLY COMPLETE**

## Branch
`feature/phase-10-measured-data-foundation`

## Recorded commits
- Implementation: `cf2ca91`
- Final continuation/documentation checkpoint: `4154387`

## Recorded final HEAD
`4154387a3adf5dc014de77c50b9393bf4f631f74`

## Dataset
World Bank / ESMAP Feni BDFE2

### Site
- Latitude: `22.80029`
- Longitude: `91.35819`
- Elevation: approximately 5 m
- Native time basis: UTC
- Native interval: 1 minute

### Coverage
- 2017-06-08 to 2019-09-30
- 1,216,800 rows
- recorded completeness: 100%

## Recorded QC totals

| Variable | Valid | Flagged | Invalid | Missing |
|---|---:|---:|---:|---:|
| DHI | 587,955 | 627,431 | 408 | 1,006 |
| DNI | 724,100 | 447,331 | 44,168 | 1,201 |
| GHI | 666,533 | 549,825 | 426 | 16 |
| RH | 862,631 | 15 | 354,138 | 16 |
| Temperature | 1,216,783 | 1 | 0 | 16 |
| Pressure | 1,216,784 | 0 | 0 | 16 |
| Wind direction | 1,216,761 | 0 | 0 | 39 |
| Wind speed | 1,216,784 | 0 | 0 | 16 |
| Precipitation | 1,216,780 | 4 | 0 | 16 |

## Pipeline
`Raw -> Bronze -> Silver`

## Delivered
- immutable raw-data registration
- Feni site profile
- canonical measurement schema
- deterministic parsing
- QC decoding preserved
- checksums/fingerprints
- provenance
- coverage / missingness / duplicate handling
- timestamp/unit handling
- environment-adapter compatibility
- no ML training

## Formal verification
Recorded at closure:
- 68 Vitest files / 274 tests PASS
- production build PASS
- documentation complete
- commit/push complete
- branch synchronized

## Decision
**Phase 10 is complete and should remain closed unless a regression is discovered.**

---

# 7. Phase 11 — Feni Gold Synchronization Foundation

## Status
# **FORMALLY COMPLETE**

Phase 11 implementation, verification and closure are now preserved in `AGRITWIN_PHASE_11_CLOSURE.md` and the Phase 11 branch history.

## Intended branch
`feature/phase-11-feni-gold-synchronization`

## Objective
Create a reproducible Gold synchronization layer between:
- Feni measured environmental data
- Open-Meteo historical/provider data

while preserving UTC synchronization, provenance, QC, deterministic preprocessing and leakage-free future ML preparation.

## Intended / inspected architecture

### Gold aggregation
- 1-minute measured input
- deterministic 15-minute measured aggregation
- hourly provider representation
- synchronized provider/measured dataset

### Cleaning
- explicit cleaning policy
- bounded interpolation policy
- QC/sample-ratio preservation
- no silent fabrication

### Feature foundation
- solar features
- cyclical time features
- causal lag features
- causal rolling features

### Chronological splits
- leakage-free
- train/validation/test preparation
- no random temporal leakage

### Reproducibility
- manifests
- checksums
- fingerprints
- provider identity

### Explicit exclusion
**No final ML training in Phase 11.**

## Missing formal closure evidence

A final Phase 11 closure record should still capture:
1. final branch and HEAD;
2. implementation commit(s);
3. final Gold schema;
4. aggregation behavior;
5. QC rules;
6. interpolation bounds;
7. synchronization tests;
8. causal-feature tests;
9. chronological-split tests;
10. complete Vitest count;
11. TypeScript result;
12. production build result;
13. remote push/upstream verification;
14. known limitations;
15. formal closure statement.

## Current judgement
**Phase 11 is functionally advanced/substantially implemented, but not formally closed in the preserved development record.**

A short retrospective Phase 11 audit should be performed before claiming an unbroken formally closed Phase 10 -> Phase 11 -> Phase 12 sequence.

---

# 8. Phase 12 — Cross-Model Validation & Explainability Studio

## Status
**ACTIVE / ADVANCED**

## Branch
`feature/phase-12-validation-explainability`

## Route
`/validation`

## Studio
**Validation & Explainability Studio**

Tabs:
- Datasets
- Alignment
- Comparison
- Metrics
- Explain

## Dataset import
Supports CSV/XLSX and current AgriTwin/PVlib/Simulink validation workflows.

Important auto-import work:
- canonical timestamp merge
- AgriTwin Hourly Power + Hourly Weather merge
- canonical variable mapping
- PVlib/Simulink alias handling
- variable provenance

## Current synchronization policy

> **Align by exact canonical timestamp intersection.**

Allowed:
- different source date ranges
- different row counts
- missing non-common timestamps
- different sampling intervals when exact common timestamps exist

Blocked:
- no exact common timestamp
- duplicate timestamps
- unresolved timezone mismatch
- no common canonical variable

Never automatic:
- interpolation
- extrapolation
- nearest-neighbour matching
- timestamp rounding
- silent resampling
- silent date-range truncation

Latest synchronization-policy commit recorded:
`08ea840` — `fix(validation): align datasets by exact timestamp intersection`

## Time reporting
Internal synchronization uses canonical absolute timestamps.

Human reporting for the Feni validation context uses:
- `Asia/Dhaka`
- UTC+06:00

Site:
- Feni, Bangladesh
- Latitude `22.80029`
- Longitude `91.35819`

A confirmed -6 h chart display error was corrected by formatting canonical timestamps in `Asia/Dhaka` instead of displaying UTC as local time.

## Comparison views
- Overlay
- Residual
- Parity scatter
- y=x line
- Daily energy
- Cumulative energy

Visualization reduction may be applied only for rendering; statistical metrics continue to use the full synchronized raw series.

## Metrics
- MBE
- MAE
- RMSE
- nRMSE
- R²
- correlation
- total-series error

For power series, the metric is labeled **Total-series error**, not Energy error unless the compared variable is true energy.

## Explainability
Evidence-oriented stages include:
- weather resource
- POA
- thermal
- DC
- crop irradiance
- AC
- IAM/optical
- shading/soiling
- string/MPPT
- inverter decomposition

No invented causal attribution.

## Exports
Developed/implemented:
- aligned CSV
- comparison XLSX
- metrics XLSX
- explainability XLSX
- PNG
- SVG
- PDF
- report/figure metadata

### Comparison XLSX time policy
Current requirement:
> **Visible comparison timestamps should be site-local only.**

UTC remains internal for synchronization.

## Recorded Phase 12 verification checkpoint
Before the latest synchronization-policy update:
- TypeScript PASS
- `git diff --check` PASS
- 10 test files / 34 tests PASS
- Next.js production build PASS

The timestamp-intersection policy was subsequently tested, committed and pushed successfully.

---

# 9. Current validation example

Feni cross-model comparison:
- AgriTwin
- PVlib
- Simulink

Example local period:
- 2026-09-06 00:00
- through 2026-09-12 23:00
- `Asia/Dhaka`

Equivalent canonical UTC period:
- 2026-09-05T18:00:00Z
- through 2026-09-12T17:00:00Z

Small negative nighttime PVlib/Simulink AC values around `-0.0144 kW` are treated as model-defined standby/auxiliary net consumption and are not silently clamped in validation.

---

# 10. Historical files that must remain preserved

Do not delete, overwrite or accidentally stage:
- `AGRITWIN_PHASE_9H_TO_9L.patch`
- `AGRITWIN_PHASE_9H_TO_9L_CURRENT_CHECKPOINT.txt`
- `AGRITWIN_PHASE_9H_TO_9L_CURRENT_SOURCE.tar.gz`
- `AGRITWIN_PHASE_9N_BLOCKED_HANDOFF.md`
- `agritwin_apply_editable_mppt_topology.sh`
- `phase9n-work/`

Do not rewrite Git history.

Do not merge to `main` without explicit authorization.

---

# 11. Current development environment

The project is now developed on **Debian 13**.

The migration from Xubuntu does not change the scientific rules, Git policy, synchronization logic or validation requirements.

Expected stack:
- VS Code
- Bash
- Node.js / npm
- TypeScript
- Vitest
- Next.js
- Git/GitHub
- Vercel
- Supabase

---

# 12. Immediate Phase 11 retrospective audit

Before declaring Phase 11 complete:

## Git
- locate `feature/phase-11-feni-gold-synchronization`
- identify final HEAD
- identify implementation commit(s)
- verify remote branch

## Code
Verify:
- Gold aggregation
- provider synchronization
- QC propagation
- interpolation limits
- solar/cyclical features
- causal lag/rolling features
- chronological splits
- manifests/fingerprints

## Scientific
Confirm:
- UTC synchronization
- deterministic aggregation
- no leakage
- no silent interpolation
- no Phase 11 ML training

## Gates
Run:
- TypeScript
- `git diff --check`
- targeted Phase 11 tests
- full Vitest
- production build

## Closure artifact
Create:
`AGRITWIN_PHASE_11_CLOSURE.md`

If all pass, change Phase 11 status in this master record to **COMPLETE**.

---

# 13. Recommended next sequence

1. **Retrospective Phase 11 closure audit**
2. **Final deployed Phase 12 acceptance**
   - import
   - mismatched date ranges
   - timestamp intersection
   - local-time display
   - comparison XLSX
   - metrics
   - scientific plots
   - explainability
   - all exports
3. Create `AGRITWIN_PHASE_12_CLOSURE.md`
4. Only then consider merge/release

---

# 14. Research maturity statement

Current defensible description:

> AgriTwin is a transparent and reproducible agrivoltaic digital-twin research platform with explicit physics, configurable electrical topology, modeled and measured environmental inputs, reproducible execution, cross-model validation interfaces, statistical comparison, explainability/provenance reporting and timestamp-aware synchronization.

It should not yet be described as a fully empirically validated physical-plant model unless measured plant DC/AC observations are supplied, synchronized, evaluated and reported.

---

# 15. Record maintenance rule

After every future phase or corrective subphase, record:

1. branch;
2. HEAD;
3. commits;
4. files changed;
5. scientific behavior changed;
6. tests and counts;
7. typecheck;
8. production build;
9. dependency/security audit when relevant;
10. Vercel/manual acceptance;
11. unresolved limitations;
12. formal phase-closure status.

---

**End of current AgriTwin development record through Phase 12.**
