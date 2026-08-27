# AgriTwin Phase 9H–9L Physics and Efficiency Upgrade

## 1. Closure status

This extension upgrades the Phase 9G/Phase 10 checkpoint into a mode-aware PV physics pipeline while preserving historical results. It was implemented from checkpoint `4154387a3adf5dc014de77c50b9393bf4f631f74` on `feature/phase-10-measured-data-foundation` and is intended to be committed on a new branch named `feature/phase-9h-9l-physics-upgrade`.

The implementation contains three explicit modes:

| Mode | Purpose | Aggregate `systemEfficiency` | Physics chain |
|---|---|---:|---|
| `legacy_parity` | Reproduce existing Phase 7B/9 results | Used | Existing SunCalc, isotropic POA, NOCT and aggregate factor |
| `physics_research` | Auditable research simulation | Ignored | Explicit solar, optical, thermal, electrical, inverter and loss stages |
| `reference_validation` | Locked comparison configuration | Ignored | Same versioned physics equations with reference defaults |

Mode identity is included in execution fingerprints, persistence, analytics compatibility, UI diagnostics and research exports. Runs made in different model modes are not treated as scientifically comparable.

## 2. Completed scope

| Phase | Completed capability | Main implementation |
|---|---|---|
| 9H | Explicit efficiency/loss boundary, signed loss waterfall, fitted SMA inverter, night standby, availability, degradation, curtailment, balance residual and provenance | `src/lib/physics/losses.ts`, `inverter.ts`, `engine.ts` |
| 9I | SPA-equivalent solar geometry, horizontal single-axis tracking, standard backtracking and Perez POA | `solar.ts`, `tracker.ts`, `irradiance.ts` |
| 9J | Martin–Ruiz IAM, row-level geometric shading, component-specific shading and separate crop-ground irradiance | `iam.ts`, `shading.ts` |
| 9K | Selectable simple NOCT, Faiman and PVsyst thermal models plus temperature-validation metrics | `thermal.ts`, `validation.ts`, `layeredValidation.ts` |
| 9L | Five-parameter single-diode operating points, I–V/P–V curves, string mismatch, actual 6-MPPT allocation, dynamic limits and cold-Voc design check | `singleDiode.ts`, `stringMppt.ts`, `engine.ts` |

The shared physics domain is exported from `src/lib/physics/index.ts` and is used by both Land and Rooftop simulations.

## 3. Authoritative reference plant

| Item | Implemented reference |
|---|---:|
| Module | Canadian Solar CS1U-420MS |
| Module STC | 420 W, 44.9 V, 9.37 A, 53.8 V, 9.80 A |
| Temperature coefficients | Pmax −0.37%/°C, Voc −0.29%/°C, Isc +0.05%/°C |
| Array | 357 modules, 21 strings, 17 modules/string, 149.94 kWp |
| Inverters | 3 × SMA STP 50-40/41, 150 kWac total |
| MPPT topology | 6 MPPT/inverter, allocation `[2,1,1,1,1,1]` |
| STC string voltage | Vmpp 763.3 V; Voc 914.6 V |
| Two-string MPPT current | 18.74 A at STC |
| Inverter limits | 500–800 V MPPT, 1000 Vdc maximum, 20 A operating and 30 A short-circuit per MPPT |
| Night consumption | 4.8 W/inverter |
| Tracker reference | Horizontal single axis, ±60°, GCR configurable, backtracking enabled |

The cold-Voc engineering check returns approximately 980.91 V at the default user assumption of 0 °C and a critical cell temperature of approximately −7.2 °C for a 17-module string. The design temperature remains user controlled; it is not represented as a manufacturer limit.

## 4. Explicit efficiency boundary

Physics modes use the following auditable chain:

1. Solar position and tracker orientation
2. Perez or isotropic POA components
3. IAM and row-specific shading
4. Soiling
5. Cell temperature
6. Module electrical conversion
7. Module quality, module mismatch, string mismatch and DC ohmic stages
8. MPPT operating constraints
9. Fitted inverter conversion and clipping
10. AC ohmic, transformer, auxiliary, curtailment and availability stages
11. Net delivered AC power

The inverter efficiency is calculated only in the fitted inverter model. It is not duplicated in explicit losses, and `systemEfficiency` is not applied in physics modes.

Reference explicit values are:

| Stage | Value | Default source | Enabled |
|---|---:|---|---|
| Soiling | 3.00% loss | User assumption | Yes |
| Module quality | −0.60% loss (gain) | Reference default | Yes |
| Module mismatch | 1.00% loss | Reference default | Yes |
| String mismatch | 0.10% loss | Reference default | Yes |
| DC ohmic | 1.00% loss | User assumption | Yes |
| AC ohmic | 0.50% loss | User assumption | Yes |
| Transformer | 0.00% loss | Not supplied | No |
| Auxiliary | 0.20% loss | User assumption | Yes |
| Availability | 0.00% loss | Ideal baseline | No |
| Degradation | 0.00%/year | Ideal baseline | No |
| Curtailment | 0.00% loss | Ideal baseline | No |

Negative loss values are preserved as gains. Every stage records its input, signed change and output. The numerical energy-balance residual is reported with a tolerance status.

## 5. Phase 9I solar, tracker and POA

The new solar calculation produces zenith, apparent zenith, elevation, azimuth, declination and equation of time from a UTC instant, latitude, longitude and elevation. The implementation is SPA-equivalent for the supported application but is not represented as a verbatim certified NREL SPA distribution.

Tracker strategies are distinct:

- fixed tilt;
- true tracking;
- standard backtracking;
- adaptive custom research control;
- measured/SCADA angle;
- stow state.

The tracker output records ideal angle, backtracked angle, command, optional measured angle, final surface tilt/azimuth and operational state. Standard backtracking uses GCR, axis geometry, cross-axis slope and configured rotation limits.

POA output preserves direct, sky diffuse, ground diffuse and global components. Physics/reference defaults use Perez; isotropic remains selectable for parity and comparison.

## 6. Phase 9J optics, shading and crops

Martin–Ruiz IAM is applied separately to direct, sky-diffuse and ground-reflected irradiance. AOI, each IAM term, global POA and effective POA are retained as timestep diagnostics.

Geometric row shading produces a factor for every PV row rather than applying one plant-wide shade percentage. Beam, diffuse and ground-reflected components receive separate effects. Row factors flow into string operating conditions, allowing row/string mismatch to emerge from geometry.

Crop-ground irradiance is a separate output from PV front-surface irradiance and is available inside persisted/exported physics diagnostics. This creates a stable boundary for future crop-yield calibration without conflating crop light with module POA.

## 7. Phase 9K thermal models and validation

Selectable thermal models are:

| Model | Inputs |
|---|---|
| Simple NOCT | Ambient temperature, irradiance, NOCT |
| Faiman | Ambient temperature, irradiance, wind, `u0`, `u1` |
| PVsyst | Ambient temperature, irradiance, wind, absorption, module efficiency, `Uc`, `Uv` |

The reference PVsyst defaults are `Uc = 29 W/(m²·K)`, `Uv = 0` and absorption `0.9`. Wind requests now explicitly use metres per second at the Open-Meteo boundary.

Validation utilities calculate count, bias, MAE, RMSE, normalized bias/RMSE, R², maximum absolute error and P95 absolute error. Layered validation can isolate solar/tracker, POA, temperature, DC and AC discrepancies, and calibrated revisions retain parameter source and reason.

## 8. Phase 9L module, strings and MPPT

The high-fidelity module path estimates a five-parameter single-diode model from available datasheet values, solves the implicit diode equation and derives MPP from the I–V curve. It returns Isc, Voc, Imp, Vmp, Pmp and optional I–V/P–V points. The original linear temperature-corrected power model remains selectable.

Strings are series-connected module operating points. Different row irradiance factors create string mismatch. Strings are allocated across six MPPTs with `[2,1,1,1,1,1]` for each seven-string inverter.

Each MPPT reports operating voltage, current, power, short-circuit current, string count, current limiting, voltage limiting and status. It evaluates the manufacturer voltage window, 1000 V maximum, operating-current limit, short-circuit-current limit and maximum strings per MPPT dynamically.

## 9. SMA inverter behavior

Physics modes use the fitted loss relation per inverter:

```text
P_loss = 75.0 + 0.016711 × Pdc + 1.6038e-08 × Pdc²
Pac,unclipped = Pdc − P_loss
Pac = min(Pac,unclipped, 50,000 W)
```

The implementation reproduces approximately 98.1% maximum efficiency and 97.8% European weighted efficiency. It includes clipping and 4.8 W/inverter nighttime consumption. The electrical execution adapter selects this fitted mode for physics runs and preserves legacy power passthrough for parity runs, preventing double conversion.

## 10. Application integration

| Area | Integration |
|---|---|
| Land simulation | Shared physics timestep, row geometry, delivered AC energy and diagnostic warnings |
| Rooftop simulation | Fixed-plane shared physics, delivered AC energy and diagnostic warnings |
| Power-series chart | Uses delivered AC in physics mode and preserves original series in legacy mode |
| Scientific UI | Mode/model controls, source labels, explicit loss editor, selected-hour diagnostics and waterfall |
| Hourly tables | Separate DC and net delivered AC columns |
| Execution | Physics version and mode in canonical identity and provenance |
| Electrical adapter | Physics-aware fitted inverter path and explicit downstream loss accounting |
| Analytics | Mixed model modes rejected as incompatible studies |
| XLSX | Efficiency/loss worksheet, model identity, formulas and assumptions |
| PDF | Model mode and efficiency boundary statement |
| Validation CSV | Solar, POA, effective irradiance, temperature, DC and AC diagnostic columns |

## 11. Persistence and migration

Migration `supabase/migrations/20260827120000_phase_9h_9l_physics_persistence.sql` adds nullable, backward-compatible run metadata:

- `simulation_model_mode`;
- `physics_model_version`;
- `explicit_loss_summary`;
- `energy_balance_summary`;
- `parameter_source_manifest`;
- hourly `physics_values` JSONB.

Historical rows remain valid. The generated database TypeScript contract, persistence mapping, persistent executor and persisted-run mapper were updated together.

Apply the migration before executing physics-mode runs against a deployed database:

```bash
npx supabase db push
```

## 12. Verification evidence

The completed source passed:

| Gate | Result |
|---|---|
| TypeScript | Passed (`tsc --noEmit`) |
| ESLint | Passed |
| Automated tests | 76 files passed; 291 tests passed |
| Production build | Passed with non-secret Supabase build placeholders |
| Diff whitespace check | Passed |
| Production dependency audit | 0 vulnerabilities |

New regression coverage includes solar reference geometry, backtracking, Perez/isotropic POA, IAM, row/crop shading, thermal models, single-diode response, string mismatch, MPPT allocation and limits, cold Voc, SMA efficiency, signed losses, energy balance, plant ceiling, timestep integration, layered metrics, legacy parity and the absence of aggregate-efficiency double counting.

## 13. Scientific limitations

This extension provides a defensible and auditable implementation foundation; it does not establish agreement with a physical plant by itself.

- The SPA-equivalent routine requires comparison with a certified SPA or pvlib reference over the deployment domain.
- Perez coefficients and tracker behavior require cross-implementation benchmark datasets.
- The shading model is row-level geometric shading, not a full 3D bifacial/ray-tracing model.
- The single-diode five parameters are estimated when full manufacturer/CEC parameters are unavailable.
- Module-temperature validation requires synchronized rear-module sensor observations.
- Measured tracker angle and inverter availability interfaces are represented by configuration/state inputs; live SCADA transport remains Phase 10/11 work.
- External PVlib, Simulink and measured-plant statistical validation remain pending.
- Calibration must change named, source-labelled parameters and preserve pre/post metrics; annual-energy tuning alone is not validation.

The correct research description is: a mode-aware, physics-based agrivoltaic digital twin with explicit losses, reproducible diagnostics and interfaces for independent and measured-data validation.

## 14. Commit boundary

The Phase 9H–9L commit should contain the shared physics domain, Land/Rooftop integration, electrical adapter updates, scientific UI, persistence migration, exports, analytics compatibility checks, tests and this closure record. It should not modify or erase the existing Phase 10 measured-data work already present at checkpoint `4154387`.
