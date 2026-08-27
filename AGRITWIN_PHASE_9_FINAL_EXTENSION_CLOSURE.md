# AgriTwin Phase 9 Final Extension Closure

## 1. Purpose

This document closes the complete Phase 9 extension sequence of AgriTwin after the original scenario, analytics, electrical, validation-export and scientific-transparency work was expanded with the Phase 9H–9L physics upgrade.

It records:

- what Phase 9 now contains;
- the final Git checkpoints;
- the efficiency-model boundary;
- the Phase 9H–9L scientific implementation;
- verification evidence;
- persistence and deployment requirements;
- remaining scientific limitations;
- the correct continuation boundary for Phase 10 and Phase 11.

Phase 9 is considered software-complete at this checkpoint. External PVlib, Simulink and measured-plant validation remain later research work and are not claimed as completed by this closure.

## 2. Repository checkpoint

| Item | Value |
|---|---|
| Repository | `mazid07066/agrivoltaic-digital-twin` |
| Local repository | `~/Projects/agrivoltaic-digital-twin` |
| Final extension branch | `feature/phase-9h-9l-physics-upgrade` |
| Final extension commit | `9b04a69` |
| Commit title | `feat(physics): complete Phase 9H to 9L upgrade` |
| Extension base | `4154387` |
| Phase 9G checkpoint | `6f820df` |
| Phase 10 measured-data checkpoint in ancestry | `cf2ca91` |
| Phase 11 continuation-document checkpoint in ancestry | `4154387` |

The final branch is synchronized with:

```text
origin/feature/phase-9h-9l-physics-upgrade
```

## 3. Complete Phase 9 scope

| Phase | Status | Delivered scope |
|---|---|---|
| 9A | Complete | Versioned scenarios, lineage, baseline identity and technical/agricultural/weather/policy/economic configuration |
| 9B | Complete | Environmental resolution into the canonical `EnvironmentalDataset` abstraction |
| 9C | Complete | Reproducible execution, immutable input snapshots, fingerprints, persisted runs and engine identity |
| 9D | Complete | Baseline comparison, policy evaluation, multi-run analytics, Pareto analysis, MCDA and sensitivity/robustness |
| 9E | Complete | Electrical BOS, inverter/MPPT behavior, three-phase AC, feeders, loads, grid balance and electrical provenance |
| 9F | Complete | Equipment selection, module/inverter catalogue wiring, compatibility checks and physical topology |
| 9G | Complete | Scientific transparency, validation exchange, XLSX/PDF research exports and deterministic 3D research capture |
| 9H | Complete | Explicit efficiency and loss accounting, fitted inverter conversion, clipping, standby and balance residual |
| 9I | Complete | SPA-equivalent solar geometry, tracker/backtracking and Perez POA irradiance |
| 9J | Complete | IAM, geometric row shading and separate crop/PV irradiance |
| 9K | Complete | NOCT, Faiman and PVsyst thermal models with temperature-validation metrics |
| 9L | Complete | Single-diode modules, I–V/P–V curves, string mismatch and dynamic MPPT operation |

## 4. Final architecture

```text
Environmental source
        ↓
Canonical EnvironmentalDataset
        ↓
Immutable site version + scenario overrides
        ↓
Versioned execution input and fingerprints
        ↓
Selected simulation mode
        ├── Legacy Web parity
        ├── Physics / Research
        └── Reference validation
        ↓
Land or Rooftop physical model
        ↓
Solar → tracker → POA → IAM → shading → temperature
        ↓
Module → string → MPPT → inverter → AC losses
        ↓
Loads, feeders, grid and energy balance
        ↓
Persisted results, analytics and research exports
```

The Phase 7B legacy calculation remains available for reproducibility. It was not deleted, silently rewritten or used as the high-fidelity physics calculation.

## 5. Simulation modes and efficiency boundary

Three modes define which equations are active.

| Mode | Intended use | Aggregate `systemEfficiency` | Downstream inverter behavior |
|---|---|---:|---|
| `legacy_parity` | Reproduce historical Web results | Applied | Legacy power passthrough |
| `physics_research` | Auditable research simulation | Ignored | Explicit fitted inverter model |
| `reference_validation` | Controlled external-model comparison | Ignored | Explicit fitted inverter model with reference configuration |

### 5.1 Why the efficiency field remains

The historical `systemEfficiency` field remains in the site configuration because removing it would prevent reproduction of older site versions, scenarios and simulation runs.

It is active only when the UI reports:

```text
Simulation mode: Legacy Web parity
Active boundary: aggregate systemEfficiency
```

In Physics/Research and Reference Validation modes:

- `systemEfficiency` is not applied;
- inverter efficiency is calculated by the inverter model;
- optical, thermal, DC and AC losses are applied as named stages;
- the legacy factor cannot be multiplied into the result;
- exports and provenance record the selected model mode.

The field therefore represents a compatibility input, not the efficiency mechanism of the upgraded physics model.

### 5.2 No-double-counting rule

Physics modes use one explicit calculation boundary:

```text
Incident irradiance
  → optical effects
  → geometric shading
  → soiling
  → module temperature
  → single-diode conversion
  → module/string/DC losses
  → MPPT constraints
  → inverter conversion and clipping
  → AC/transformer/auxiliary losses
  → curtailment and availability
  → net delivered AC
```

Inverter conversion is not duplicated in the explicit percentage-loss configuration. Night self-consumption is not counted again as auxiliary loss.

## 6. Phase 9H efficiency and loss accounting

The physics domain implements an auditable signed loss waterfall.

| Stage | Reference setting | Interpretation |
|---|---:|---|
| Soiling | 3.00% | User assumption |
| Module quality | −0.60% | Gain relative to nominal; sign preserved |
| Module mismatch | 1.00% | Reference assumption |
| String mismatch | 0.10% | Reference assumption |
| DC ohmic | 1.00% | User assumption |
| AC ohmic | 0.50% | User assumption |
| Transformer | 0.00%, disabled | Transformer data not supplied |
| Auxiliary | 0.20% | User assumption |
| Availability | 0.00%, disabled | Ideal baseline |
| Degradation | 0.00%, disabled | Ideal baseline |
| Curtailment | 0.00%, disabled | Ideal baseline |

Each stage records input power, signed change and output power. The calculation reports an energy-balance residual and tolerance status.

The SMA inverter fit is:

```text
P_loss = 75.0 + 0.016711 × Pdc + 1.6038e-08 × Pdc²
Pac,unclipped = Pdc − P_loss
Pac = min(Pac,unclipped, 50,000 W per inverter)
```

The reference checks reproduce approximately:

- maximum efficiency: 98.1%;
- European weighted efficiency: 97.8%;
- night self-consumption: 4.8 W per inverter;
- plant AC ceiling: 150 kW for three inverter units.

## 7. Phase 9I solar geometry, tracking and POA

The shared physics domain provides:

- solar zenith;
- apparent zenith;
- solar elevation;
- solar azimuth;
- declination;
- equation of time;
- ideal tracker angle;
- backtracked angle;
- commanded angle;
- optional measured angle;
- final surface tilt and azimuth.

Supported tracker strategies are fixed tilt, true tracking, standard backtracking, adaptive custom tracking, measured/SCADA tracking and stow operation.

Physics/reference mode supports Perez anisotropic transposition. Isotropic POA remains selectable as a baseline. Direct, sky-diffuse, ground-diffuse and global POA components remain separately visible.

## 8. Phase 9J optics, row shading and crop irradiance

Martin–Ruiz IAM is applied separately to direct, sky-diffuse and ground-reflected irradiance.

The model exposes:

- angle of incidence;
- direct IAM;
- diffuse IAM;
- ground IAM;
- global POA;
- effective POA.

Row shading is evaluated geometrically for individual rows rather than applying one generic plant-level shade percentage. Row factors affect string operating conditions and therefore create electrical mismatch where irradiance differs.

Crop-ground irradiance is calculated separately from PV front-surface irradiance. This preserves the agrivoltaic boundary needed for later crop and microclimate validation.

## 9. Phase 9K module temperature

The following thermal models are selectable:

| Model | Status |
|---|---|
| Simple NOCT | Retained for legacy/baseline comparison |
| Faiman | Implemented with irradiance and wind dependence |
| PVsyst | Implemented with absorption, module efficiency, `Uc` and `Uv` |

Reference PVsyst values are:

```text
Uc = 29 W/(m²·K)
Uv = 0
Module absorption = 0.9
```

Open-Meteo wind input is explicitly requested in metres per second.

Validation utilities calculate bias, MAE, RMSE, normalized bias/RMSE, R², maximum error and P95 absolute error. These metrics are ready for measured rear-module temperature data when synchronized sensor observations are available.

## 10. Phase 9L module, string and MPPT physics

The module electrical model supports:

- the legacy simple power equation;
- a five-parameter single-diode calculation;
- Isc, Voc, Imp, Vmp and Pmp;
- I–V and P–V points when requested;
- irradiance and cell-temperature response.

The reference plant topology is:

| Item | Value |
|---|---:|
| Modules | 357 |
| Installed DC | 149.94 kWp |
| Modules/string | 17 |
| Total strings | 21 |
| Inverters | 3 |
| Strings/inverter | 7 |
| MPPTs/inverter | 6 |
| Allocation | `[2,1,1,1,1,1]` |
| STC string Vmpp | 763.3 V |
| STC string Voc | 914.6 V |
| Two-string MPPT current | 18.74 A |

Dynamic checks include:

- MPPT operating voltage range;
- inverter maximum DC voltage;
- MPPT operating current;
- MPPT short-circuit current;
- maximum strings per MPPT;
- current limiting;
- voltage limiting;
- MPPT status and warnings.

The cold-Voc check produces approximately 980.91 V at the user assumption of 0 °C and identifies approximately −7.2 °C as the critical cell temperature for a 17-module string reaching 1000 V.

## 11. Land, Rooftop and execution integration

| Area | Completed integration |
|---|---|
| Land | Shared physics engine, row geometry, crop irradiance, delivered AC and diagnostics |
| Rooftop | Shared fixed-plane physics, delivered AC and diagnostics |
| Power series | Physics mode uses net delivered AC; legacy mode preserves historical behavior |
| Electrical adapter | Selects fitted conversion for physics and passthrough for legacy |
| Execution identity | Includes model mode and physics version |
| Persistence | Stores mode, physics version, losses, balance, source manifest and hourly physics values |
| Analytics | Rejects mixed-model-mode studies as incompatible |
| Scientific UI | Mode controls, model selection, source labels, losses and selected-hour diagnostics |
| XLSX | Efficiency/loss worksheet, model identity, formulas, assumptions and diagnostics |
| PDF | Model mode, active efficiency boundary and research disclaimer |
| Validation exchange | Solar, POA, temperature, DC and AC diagnostic fields |

## 12. Persistence migration

Phase 9H–9L includes:

```text
supabase/migrations/20260827120000_phase_9h_9l_physics_persistence.sql
```

The migration adds backward-compatible fields for:

- simulation model mode;
- physics model version;
- explicit-loss summary;
- energy-balance summary;
- parameter-source manifest;
- hourly physics values.

The source commit does not prove that the migration has been applied to every remote environment. Deployment must be verified separately with:

```bash
npx supabase db push
npx supabase migration list
```

## 13. Final verification record

The final Phase 9 extension commit recorded:

| Verification gate | Result |
|---|---|
| Branch | `feature/phase-9h-9l-physics-upgrade` |
| Commit | `9b04a69` |
| Files changed | 64 |
| Insertions/deletions | 4,287 / 31 |
| TypeScript | Passed |
| ESLint | Passed |
| Automated tests | 76 files passed; 291 tests passed |
| Next.js production build | Passed |
| Production dependency audit | 0 vulnerabilities |
| Git diff validation | Passed |
| Remote synchronization | Branch pushed to origin |

The Vite configuration notice about future native config loading is a non-blocking compatibility warning. It did not cause a test, lint, typecheck or build failure.

## 14. Preserved scientific limitations

Phase 9 now provides the software and exchange foundation for defensible validation, but it does not claim that measured validation is complete.

- The SPA-equivalent implementation still requires comparison across a certified SPA/pvlib benchmark dataset.
- Perez and tracker outputs require systematic cross-implementation comparison.
- Geometric row shading is not full 3D bifacial ray tracing.
- Single-diode parameters are estimated where full manufacturer/CEC parameters are unavailable.
- Temperature metrics require synchronized measured module-temperature data.
- Live tracker, inverter-availability and outage states require SCADA connectivity.
- PVlib and Simulink must remain independent implementations rather than wrappers around AgriTwin calculations.
- Agreement in annual energy alone is not sufficient validation.
- Calibration must preserve original parameters, source categories, revisions and before/after error metrics.
- Research claims require measured-data comparison and quantified uncertainty.

## 15. Phase 9 closure statement

Phase 9 is closed as a complete software extension comprising reproducible scenario execution, environmental resolution, analytics, physical and electrical topology, equipment compatibility, scientific transparency, research exports and an auditable physics-based PV calculation path.

The final system now supports:

- backward-compatible legacy reproduction;
- explicit physics and research operation;
- reference-validation configuration;
- named and source-labelled losses;
- no-double-counting efficiency boundaries;
- high-resolution intermediate diagnostics;
- physical/electrical warnings;
- persisted provenance;
- independent validation exchange;
- research-oriented XLSX, PDF, CSV, PNG and JSON artifacts.

No further feature should be added under Phase 9 unless it repairs a defect in this closed scope.

## 16. Continuation boundary

Future work continues outside Phase 9:

| Phase | Continuation focus |
|---|---|
| Phase 10 | Measured-data ingestion, synchronization, quality control, PVlib/Simulink execution, statistical validation, calibration and uncertainty |
| Phase 11 | Operational digital-twin synchronization, sensor/SCADA connectivity, control workflows and continued research deployment |

The appropriate final description is:

> AgriTwin is a transparent, mode-aware and reproducible agrivoltaic digital-twin platform with explicit PV physics, electrical BOS, scientific diagnostics and external-validation interfaces. Physical-plant validation remains an evidence-producing continuation activity.
