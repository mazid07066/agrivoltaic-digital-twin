# AgriTwin — Complete Development Handoff: Phases 1–9

## Project

**AgriTwin — Weather-, Sensor- and Geometry-Aware Digital Twin for Agrivoltaic Land and Rooftop Systems**

Repository:

`~/Projects/agrivoltaic-digital-twin`

Development branch:

`feature/phase-9-mcda-data-analytics`

Phase 9 release predecessor:

`1098fc0 — feat: complete Phase 9 scenario execution and decision analytics`

The final Phase 9E release commit should be recorded here after successful verification and push.

---

# 1. Project Purpose

AgriTwin is a research-oriented digital-twin platform for modelling agrivoltaic land systems and rooftop PV systems while preserving environmental provenance, scenario identity, reproducibility, scientific traceability, electrical-system behaviour, and decision-support analytics.

The fundamental architecture is:

```text
DATA SOURCES
        ↓
ENVIRONMENTAL INGESTION
        ↓
CANONICAL EnvironmentalDataset
        ↓
SITE VERSION + SCENARIO
        ↓
IMMUTABLE EXECUTION SNAPSHOT
        ↓
LAND / ROOFTOP DIGITAL TWIN
        ↓
PV OUTPUT
        ↓
ELECTRICAL BALANCE-OF-SYSTEM
        ↓
PERSISTED RUNS
        ↓
REPRODUCIBILITY
        ↓
ANALYTICS / POLICY / MCDA
```

Machine learning is deliberately not the computational centre of AgriTwin.

Future ML reconstruction will provide additional environmental datasets through the canonical `EnvironmentalDataset` boundary.

---

# 2. Phase 1 — Initial Agrivoltaic Simulation Foundation

Phase 1 established the first working computational concept of AgriTwin.

Principal capabilities introduced included:

- agrivoltaic site configuration
- PV-array configuration
- crop selection
- date-based simulation
- synthetic environmental fallback
- hourly simulation
- basic PV generation
- basic crop-light modelling
- initial graphical interface

This phase established the core concept that PV and agricultural behaviour should be simulated together rather than independently.

---

# 3. Phase 2 — Solar Geometry and Irradiance

The simulation engine was expanded to use solar geometry.

Capabilities included:

- solar altitude
- solar zenith
- solar azimuth
- angle of incidence
- direct irradiance
- diffuse irradiance
- ground-reflected irradiance
- plane-of-array irradiance

This created the physical solar-energy foundation used throughout later phases.

---

# 4. Phase 3 — PV Performance

The PV simulation was extended to represent system performance from module and array characteristics.

Capabilities included:

- module power
- installed PV capacity
- hourly PV generation
- daily PV energy
- system-efficiency parameter
- module-temperature effects
- temperature coefficient of maximum power
- module catalogue support

The existing historical `systemEfficiency` parameter predates Phase 9E and represents a broad system-level derating.

For Phase 9E this legacy behaviour was explicitly documented so inverter efficiency would not be silently double counted.

---

# 5. Phase 4 — Agrivoltaic Shading and Crop Light

The digital twin was expanded beyond PV-only generation.

Capabilities included:

- row spacing
- panel height
- field geometry
- shading estimates
- crop-level irradiance
- open-field irradiance
- crop-light reduction
- crop Daily Light Integral
- target crop DLI

The system became a coupled PV–crop simulator rather than simply a solar-energy calculator.

---

# 6. Phase 5 — Tracking and Adaptive Operation

PV tracking and agrivoltaic control were introduced.

Supported concepts include:

- fixed operation
- standard tracking
- reverse tracking
- custom/adaptive behaviour
- tracker-angle calculation
- crop-protection logic

Adaptive control allows AgriTwin to evaluate energy production against agricultural-light constraints.

---

# 7. Phase 6 — Spatial Digital Twin

The agricultural simulation was expanded spatially.

Capabilities included:

- spatial irradiance calculations
- daily DLI grids
- hourly shadow grids
- beneath-panel zones
- between-row zones
- outer-field/open zones
- zone statistics
- spatial DLI heat maps
- three-dimensional digital-twin visualization

This phase established the virtual agrivoltaic landscape used by subsequent research functionality.

---

# 8. Phase 7 — Core Scientific Land Agrivoltaic Digital Twin

Phase 7 consolidated the scientific land engine.

The verified Phase 7B engine includes:

- solar-position modelling
- irradiance modelling
- POA irradiance
- module-temperature effects
- PV generation
- standard tracking
- reverse tracking
- fixed/custom operation where supported
- adaptive control
- crop DLI
- crop-light reduction
- spatial irradiance/DLI
- estimated crop yield
- Land Equivalent Ratio
- site geometry
- coupled PV/crop simulation

The Phase 7B scientific engine is considered a protected scientific core.

It must not be replaced merely because another library offers similar functionality.

PVLib or another external model may be introduced later as a validation/reference implementation.

---

# 9. Phase 8 — Application, Database and Multi-Site Architecture

Phase 8 transformed AgriTwin from a single simulation interface into a persistent digital-twin platform.

Major capabilities introduced include:

- Supabase-backed database
- authentication
- projects
- multi-site architecture
- site registry
- land sites
- rooftop sites
- immutable site versions
- rooftop geometry
- environmental source abstraction
- environmental provenance
- environmental fingerprints
- Open-Meteo integration
- uploaded/local environmental datasets
- persistent site information

---

# 10. Phase 8A — Site Schema Architecture

A generic site-profile architecture was introduced.

The site abstraction supports multiple site types while retaining the existing land scientific engine.

Important principle:

```text
Site profile
      ↓
Site-specific adapter
      ↓
existing scientific engine
```

This prevented the multi-site upgrade from destroying the verified simulation core.

---

# 11. Phase 8B — Database and Multi-Site Infrastructure

Phase 8B established the persistent project/site model.

Principal database entities include:

- projects
- sites
- site versions
- simulation runs
- hourly simulation results
- spatial simulation results

Supabase Row-Level Security was introduced for authenticated project ownership and access.

---

# 12. Phase 8C — Rooftop Digital Twin

Phase 8C introduced rooftop PV simulation.

Capabilities include:

- flat-roof sites
- building height
- roof dimensions
- parapets
- setbacks
- array geometry
- module layout solver
- usable roof area
- rooftop installed capacity
- rooftop solar geometry
- rooftop POA irradiance
- module temperature
- rooftop PV power
- rooftop daily energy
- rooftop-specific three-dimensional visualization
- immutable rooftop site versions

The current rooftop engine executes one simulation day at a time.

---

# 13. Phase 9A — Scenario Architecture

Phase 9A introduced formal research scenarios.

Saved scenarios contain:

- project ID
- site ID
- scenario type
- scenario status
- baseline flag
- parent scenario
- scenario version
- technical configuration
- agricultural configuration
- weather configuration
- policy configuration
- economic configuration
- metadata and provenance

Scenario editing increments scenario version numbers.

Scenario duplication preserves lineage.

---

# 14. Phase 9B — Canonical Environmental Resolution

Phase 9B integrated scenario weather configuration with the existing environmental architecture.

Supported source concepts include:

- Open-Meteo
- uploaded datasets
- sensors
- manual datasets
- synthetic datasets

Supported modes include:

- historical
- forecast
- typical
- dataset
- sensor

All environmental data are resolved into:

`EnvironmentalDataset`

before reaching either simulation engine.

No second independent weather pathway should be created.

---

# 15. Phase 9C — Reproducible Execution

Phase 9C established immutable and reproducible simulation execution.

Architecture:

```text
Site Version
     +
Scenario
     +
Resolved Environmental Dataset
        ↓
Resolved Execution Input
        ↓
Immutable Input Snapshot
        ↓
Environment Fingerprint
        ↓
Execution Fingerprint
        ↓
Land / Rooftop Adapter
        ↓
Canonical Result
        ↓
Persisted Simulation Run
```

Persisted information includes:

- simulation run identity
- site version
- scenario/version
- environmental source
- environmental fingerprint
- execution fingerprint
- engine identity/version
- input snapshot
- result summary
- hourly results
- spatial results
- warnings
- timestamps
- failure information

Reproducibility verification checks whether persisted immutable inputs can describe the same execution evidence.

---

# 16. Phase 9 Scenario Override Bridge

Scenario design values are applied through:

`src/lib/execution/scenarioOverrides.ts`

The override layer constructs a detached runtime site profile.

The immutable persisted site version is never modified.

Verified scientific effects include:

- panel-height changes reaching the engine
- row-spacing changes reaching the engine
- crop settings reaching the engine
- tracking mode affecting simulation
- tilt affecting PV behaviour where physically relevant

---

# 17. Phase 9D — Analytics and Decision Support

Phase 9D introduced the research analytics layer.

Capabilities include:

- baseline comparison
- policy evaluation
- multi-run studies
- compatibility verification
- Pareto analysis
- MCDA
- benefit/cost metric direction
- metric weighting
- normalization
- missing-data rejection
- sensitivity analysis
- ranking robustness

Primary areas include:

`src/app/analytics/`

`src/app/api/analytics/`

`src/components/analytics/`

`src/lib/analytics/`

---

# 18. Phase 9D Controlled Environmental Dataset

A frozen environmental evidence dataset was added:

`data/environment/phase9d-rice-study-20260820.csv`

Dataset ID:

`phase9d-rice-study-20260820`

Simulation date:

`20 August 2026`

The dataset was registered in the local environmental dataset registry and used to create a reproducible controlled experiment.

---

# 19. Phase 9D Controlled Study

The controlled study compared one baseline with four alternatives.

All runs retained the same:

- project
- site
- site version
- environment
- environmental fingerprint
- dataset
- date
- crop
- policy conditions

Only selected technical variables changed.

Baseline:

**Rice AV Policy Baseline Test**

Scenario ID:

`12790cbf-3c8d-42bc-bb7a-2b58dbbadd50`

Configuration included:

- panel height 5 m
- row spacing 8 m
- tilt 20°
- azimuth 180°
- reverse tracking
- rice crop
- frozen uploaded dataset
- minimum crop retention 80%
- maximum GCR 40%
- minimum LER 1.1

Alternatives:

- Panel height 4 m
- Row spacing 6 m
- Standard tracking
- Fixed tracking

---

# 20. Phase 9D Controlled Results

Approximate persisted controlled results were:

| Scenario | Daily Energy | Specific Yield | Crop DLI | Crop Yield | LER |
|---|---:|---:|---:|---:|---:|
| Baseline | 97.47 kWh | 2.9536 | 44.12 | 88.2% | 1.60 |
| Panel Height 4 m | 97.47 kWh | 2.9536 | 44.06 | 88.3% | 1.60 |
| Row Spacing 6 m | 97.47 kWh | 2.9536 | 43.92 | 88.4% | 1.60 |
| Standard Tracking | 181.21 kWh | 5.4912 | 43.39 | 88.8% | 2.14 |
| Fixed Tracking | 144.84 kWh | 4.3891 | 43.27 | 88.9% | 1.96 |

Environment-control verification demonstrated:

- 5 runs
- one simulation date
- one site version
- one environmental fingerprint
- one dataset ID

Scientific variation therefore resulted from controlled scenario changes.

---

# 21. Phase 9D MCDA

Final controlled MCDA ranking:

1. Standard Tracking
2. Fixed Tracking
3. Row Spacing 6 m
4. Panel Height 4 m
5. Baseline

MCDA supports:

- benefit metrics
- cost metrics
- weights
- normalization
- neutral metric exclusion
- ranking
- sensitivity/robustness

---

# 22. Phase 9D Policy Normalization

Scenario policy thresholds are stored as fractions.

Examples:

```text
0.8 = 80%
0.4 = 40%
```

Simulation results such as crop retention and GCR are percentage-valued.

Phase 9 normalizes fraction-valued policy thresholds before comparison.

This behaviour is covered by tests and must not regress.

---

# 23. Phase 9E — Electrical Balance-of-System

Phase 9E extended the digital twin downstream of PV generation.

Architecture:

```text
PV ARRAY
    ↓
PV POWER
    ↓
STRING / MPPT AGGREGATION
    ↓
INVERTER
    ↓
3-PHASE AC BUS
    ↓
DISTRIBUTION BOARD
    ↓
FEEDERS
    ↓
LOADS
    ↓
OPTIONAL GRID
```

The electrical layer is downstream of the land and rooftop scientific engines.

The PV scientific engines were not rewritten.

---

# 24. Phase 9E Inverter Model

The initial demonstration inverter is based on:

**SMA Sunny Tripower CORE1 STP 50-40**

Key supplied specifications include:

DC:

- maximum generator power: 75 kWp
- maximum input voltage: 1000 V
- MPP range: 500–800 V
- rated input voltage: 670 V
- minimum input voltage: 150 V
- start voltage: 188 V
- maximum operating input current: 120 A
- maximum current per MPPT: 20 A
- maximum Isc per MPPT: 30 A
- maximum Isc per string: 30 A
- MPPTs: 6
- strings per MPPT: 2

AC:

- rated active power: 50 kW
- maximum apparent power: 50 kVA
- supported nominal systems: 220/380 V, 230/400 V and 240/415 V
- nominal frequency: 50/60 Hz
- rated current: 72.5 A
- maximum current: 72.5 A
- phases: 3
- connection: 3-(N)-PE
- rated PF: 1
- THD: <3%
- maximum efficiency: 98.1%
- European efficiency: 97.8%

No fabricated manufacturer part-load efficiency curve is used.

---

# 25. Inverter Operating States

The electrical model supports:

- `OFF`
- `WAITING_FOR_START`
- `MPPT_ACTIVE`
- `DERATED`
- `CLIPPED`
- `GRID_LIMITED`
- `FAULT`

DC voltage/current and inverter limits generate explicit alarms rather than silently modifying scientific values.

---

# 26. MPPT and String Architecture

The Phase 9E inverter architecture represents:

```text
MPPT 1
 ├─ String 1
 └─ String 2

...

MPPT 6
 ├─ String 1
 └─ String 2
```

Maximum:

- 6 independent MPPT inputs
- 12 strings

Where true string telemetry is unavailable, demonstration allocation is explicitly identified as assumed data.

It must never be presented as measured telemetry.

---

# 27. Three-Phase Model

Three-phase calculations use:

```text
P = √3 × VLL × I × PF
```

Therefore:

```text
I = P / (√3 × VLL × PF)
```

For approximately:

- 50 kW
- 400 V line-to-line
- PF = 1

the expected current is compatible with the inverter's 72.5 A rating.

230 V is treated as line-to-neutral voltage in a 230/400 V system, not line-to-line voltage.

---

# 28. AC Distribution

The Phase 9E distribution subsystem contains:

- AC bus
- feeders
- load profiles
- feeder priority
- enabled/disabled feeders
- connected load
- power factor
- grid import
- grid export
- served load
- unserved load

Grid-connected operation:

```text
PV > load → grid export
PV < load → grid import
```

Islanded operation:

```text
PV < load → unserved load
```

Battery storage is deliberately not included yet.

---

# 29. Electrical Energy Balance

The grid-connected balance is:

```text
PV AC available
+
Grid import
=
Load served
+
Grid export
+
Distribution losses
```

Current Phase 9E assumes:

`distribution loss = 0`

because cable, transformer and feeder impedance data have not yet been supplied.

No fictitious cable loss model is used.

Numerical balance verification is implemented.

---

# 30. Phase 9E Persistence

The Phase 9E additive Supabase migration is:

`20260822103000_phase_9e_electrical_persistence.sql`

The migration adds optional electrical persistence without invalidating historical runs.

Simulation-run electrical fields include:

- electrical summary
- electrical provenance
- electrical operating mode

Hourly records include:

- optional `electrical_values`

Historical runs remain readable.

---

# 31. Phase 9E Electrical Provenance

Electrical provenance records modelling assumptions such as:

- inverter specification ID
- electrical provider
- inverter model version
- distribution model version
- source PV field
- efficiency interpretation
- DC-voltage assumption
- MPPT allocation assumption
- distribution-loss assumption

This preserves research traceability.

---

# 32. Phase 9E Three-Dimensional BOS

Electrical components are represented inside the virtual land and rooftop environments.

The current visual implementation includes conceptual representation of:

- PV source
- inverter
- AC distribution board
- feeders
- loads
- grid connection

The visual design can be further refined later without changing the electrical model.

---

# 33. Phase 9E Telemetry Provider Foundation

The scientific inverter model is not directly coupled to communication protocols.

Provider architecture supports the future concepts:

- simulation
- Modbus TCP
- Modbus RTU
- MQTT
- REST
- manual

Current Phase 9E implements simulation and preserves explicit unsupported-provider boundaries for future hardware integration.

Future physical architecture:

```text
Physical inverter
       ↓
Protocol adapter
       ↓
Canonical inverter telemetry
       ↓
AgriTwin
```

---

# 34. PV Module Catalogue

AgriTwin contains a reusable PV-module catalogue.

A module profile may contain:

- manufacturer
- series
- model
- technology
- cell type
- module type
- number of cells
- Pmax
- efficiency
- Voc
- Vmpp
- Isc
- Impp
- NOCT/NMOT
- temperature coefficients
- dimensions
- weight
- maximum system voltage
- fuse rating
- warranties
- datasheet source

An input/validation layer was added to support future module datasheets without modifying simulation code manually.

---

# 35. Inverter Catalogue

Phase 9E adds:

`inverter-catalogue.json`

The first catalogue entry is the SMA Sunny Tripower CORE1 STP 50-40.

The catalogue architecture separates:

```text
raw datasheet record
       ↓
catalogue normalization
       ↓
InverterSpecification
       ↓
Phase 9E model
```

This makes future inverter addition easier and prevents duplication of the electrical model.

---

# 36. Equipment Compatibility Layer

The final Phase 9 equipment-design layer compares the selected PV module with the selected inverter.

Checks should include:

- array STC power versus inverter generator limit
- string Vmpp versus MPP range
- string Voc versus maximum DC voltage
- MPPT Impp versus MPPT operating-current limit
- MPPT Isc versus MPPT short-circuit-current limit
- string Isc versus string-current limit
- string count versus MPPT/string capacity

Compatibility states should distinguish:

- pass
- warning
- fail
- not evaluated

Cold-condition Voc must not be invented.

If minimum design temperature is unavailable, the cold-voltage check must explicitly remain unevaluated.

---

# 37. Phase 9 Verification

Prior Phase 9D checkpoint verification:

- typecheck passed
- 38 test files passed
- 136 tests passed
- lint passed
- production build passed

Phase 9D release commit:

`1098fc0`

`feat: complete Phase 9 scenario execution and decision analytics`

During Phase 9E development, verification later reached:

- 47 test files
- 203 tests
- typecheck passed
- lint passed
- production build passed
- `git diff --check` passed

The final Phase 9E release should record its final commit hash here after completion.

---

# 38. Important Scientific Constraints

The following rules must continue to be respected.

### Do not replace the Phase 7B scientific engine

External libraries may validate it but should not silently replace it.

### EnvironmentalDataset remains canonical

All direct, uploaded, reconstructed, sensor and future climate data must pass through the environmental resolver.

### Immutable site versions remain immutable

Runtime scenario overrides operate on detached copies.

### Reproducibility and physical validation are separate

Reproducibility asks:

> Can the same immutable inputs describe the same execution?

Physical validation asks:

> Does AgriTwin agree with measured/reference reality?

### Do not invent unavailable electrical quantities

Assumed or demonstration values must carry provenance.

### Do not invent cable or transformer losses

Losses require physical parameters.

### Do not double-count inverter efficiency

The historical `systemEfficiency` field already applies a broad upstream derating.

Phase 9E therefore explicitly distinguishes legacy passthrough and explicit inverter-efficiency modes.

---

# 39. Current Software Architecture

Important areas now include:

```text
src/lib/simulation/
src/lib/sites/
src/lib/rooftop/
src/lib/environment/
src/lib/scenarios/
src/lib/execution/
src/lib/analytics/
src/lib/pv/
src/lib/electrical/
src/components/twin/
src/components/twin/electrical/
src/components/rooftop/
src/app/analytics/
src/app/scenarios/
src/app/simulation-runs/
```

Electrical structure includes approximately:

```text
src/lib/electrical/
├── types.ts
├── demonstration.ts
├── adapters/
├── inverter/
├── distribution/
├── telemetry/
└── __tests__/
```

---

# 40. Database Architecture Through Phase 9

Major persisted research entities now include:

```text
projects
sites
site_versions
scenarios
simulation_runs
simulation_hourly_results
simulation_spatial_results
```

Simulation evidence includes:

```text
site version
scenario identity
scenario version
environment provenance
environment fingerprint
execution fingerprint
input snapshot
engine identity
summary
hourly values
spatial values
electrical summary
electrical provenance
hourly electrical values
warnings/errors
timestamps
```

---

# 41. Phase 9 Final Research Pipeline

The completed Phase 9 pipeline is:

```text
DATA SOURCES
     ↓
ENVIRONMENT RESOLUTION
     ↓
EnvironmentalDataset
     ↓
SCENARIO LAB
     ↓
IMMUTABLE EXECUTION INPUT
     ↓
LAND / ROOFTOP DIGITAL TWIN
     ↓
PV
     ↓
ELECTRICAL BOS
     ↓
PERSISTED RUN
     ↓
REPRODUCIBILITY
     ↓
ANALYTICS
     ↓
POLICY
     ↓
PARETO
     ↓
MCDA
     ↓
ROBUSTNESS
```

---

# 42. Known Limitations at the End of Phase 9

The following are intentional current limitations:

- scientific engines currently execute one 24-hour period at a time
- inverter part-load manufacturer curve is not yet modelled
- distribution cable losses are not modelled
- transformer model is not implemented
- battery storage is not implemented
- physical inverter communication is not yet enabled
- MPPT/string allocation may use demonstration assumptions where actual topology is unavailable
- real string voltage/current telemetry is not yet available
- cold-condition string Voc requires an explicit design minimum temperature
- Phase 9 3D BOS presentation can receive additional visual refinement
- physical/reference validation has not yet been implemented

These are roadmap items, not silent modelling assumptions.

---

# 43. Phase 9F — Next Phase: Physical / Model Validation

Phase 9F is the next development phase.

It is different from reproducibility.

Target architecture:

```text
MEASURED / REFERENCE DATA
          +
PERSISTED AGRITWIN RUN
          ↓
TIMESTAMP ALIGNMENT
          ↓
MEASURED vs SIMULATED
          ↓
VALIDATION METRICS
```

Required metrics:

- R²
- RMSE
- MAE
- MAPE
- MBE
- NMBE
- energy error %
- sample count
- coverage

Potential validation targets:

- GHI
- POA irradiance
- ambient temperature
- module temperature
- PV DC power
- inverter AC power
- daily energy
- feeder/load measurements where available

Recommended application route:

`/validation`

Calibration must remain explicit and versioned.

AgriTwin must not become an opaque self-modifying model.

---

# 44. Phase 10 — Measured Data and ML

After validation infrastructure is established, Phase 10 will introduce measured-data engineering and ML reconstruction.

## Phase 10A — Measured Dataset Registry

Potential sources include:

- World Bank data
- weather stations
- pyranometers
- field sensors
- inverter telemetry
- IoT systems
- uploaded CSV files

The architecture must remain provider-neutral.

## Phase 10B — Data Engineering

Recommended module:

`src/lib/data-pipeline/`

Capabilities:

- timezone normalization
- timestamp synchronization
- resampling
- missing-value handling
- outlier detection
- quality flags
- feature engineering
- ML-ready dataset construction

## Phase 10C — Python ML Service

Major model training should occur outside Next.js.

Suggested architecture:

```text
AgriTwin
   ↓
ML API
   ↓
Python
```

Initial tools:

- pandas
- NumPy
- scikit-learn
- XGBoost

Deep-learning models may be introduced later if justified.

## Phase 10D — Model Registry

Persist:

- model ID
- algorithm
- hyperparameters
- dataset fingerprint
- training period
- validation period
- R²
- RMSE
- MAE
- MAPE
- NMBE
- artifact reference
- provenance

## Phase 10E — Environmental Reconstruction

Target:

```text
Measured historical data
        +
Open-Meteo historical data
        ↓
ML correction/reconstruction
        ↓
validation
        ↓
historical reconstruction
        ↓
EnvironmentalDataset
```

Potential future environmental source:

`ml_reconstructed`

The reconstructed output must still enter the existing environmental resolver.

---

# 45. Phase 11 — Future Environment and Climate Projection

Phase 11 will distinguish short-term weather forecasts from long-term environmental/climate projections.

Potential source categories:

- historical
- forecast
- typical meteorological year
- uploaded future dataset
- climate projection
- ML-reconstructed historical
- ML-corrected projection

Target architecture:

```text
FUTURE ENVIRONMENT
       ↓
OPTIONAL BIAS CORRECTION
       ↓
EnvironmentalDataset
       ↓
SCENARIO
       ↓
DIGITAL TWIN
       ↓
PV
       ↓
INVERTER
       ↓
LOADS / GRID
       ↓
CROP / LER / ENERGY
       ↓
ANALYTICS
```

---

# 46. Phase 12 — Integrated Research Decision-Support Platform

The final intended architecture is:

```text
DATA SOURCES
     ↓
ENVIRONMENT
     ↓
DATA ENGINEERING
     ↓
DIRECT DATA / ML RECONSTRUCTION
     ↓
CANONICAL EnvironmentalDataset
     ↓
SCENARIO LAB
     ↓
IMMUTABLE EXECUTION SNAPSHOT
     ↓
DIGITAL TWIN

       LAND
        +
     ROOFTOP

     ↓
PV
     ↓
INVERTER
     ↓
3-PHASE AC
     ↓
FEEDERS / LOADS / GRID
     ↓
PERSISTED RUNS
     ↓
REPRODUCIBILITY
     +
PHYSICAL VALIDATION
     +
ANALYTICS
     ↓
POLICY / PARETO / MCDA
     ↓
FUTURE PROJECTION
     ↓
RESEARCH DECISION SUPPORT
```

---

# 47. Development Rules Going Forward

Before modifying the repository:

1. inspect branch and worktree
2. confirm the last verified checkpoint
3. inspect the actual files to be modified
4. avoid broad unrelated refactors

During development:

1. change one subsystem at a time
2. preserve existing scientific engines
3. preserve provenance
4. preserve immutable execution evidence
5. add focused tests
6. distinguish assumptions from calculated/measured values

Before committing:

```bash
npm run typecheck
npm test
npm run lint
npm run build
git diff --check
```

Only commit after successful verification.

Do not:

- rewrite Git history
- merge into `main` without explicit instruction
- silently replace scientific models
- bypass EnvironmentalDataset
- modify immutable site versions
- fabricate unavailable physical data

---

# 48. Phase 9 Completion Definition

Phase 9 can be considered complete when:

- scenario architecture works
- environmental resolution works
- immutable execution works
- persisted evidence works
- reproducibility verification works
- analytics works
- controlled scientific variation is demonstrated
- MCDA and robustness work
- inverter model works
- MPPT/string model works
- three-phase AC calculations work
- load/grid dispatch works
- electrical energy balance works
- electrical persistence works
- land and rooftop BOS integration works
- inverter telemetry abstraction exists
- PV module catalogue is extensible
- inverter catalogue is extensible
- selected inverter drives the runtime model
- PV/inverter compatibility is visible
- full verification succeeds
- release commit is pushed

At that point development should move to Phase 9F physical/model validation.

---

# 49. Next Starting Point

The next development session should begin with:

```bash
cd ~/Projects/agrivoltaic-digital-twin

git branch --show-current
git status --short
git log -5 --oneline --decorate

npm run typecheck
```

Confirm the final Phase 9 release commit and a clean worktree before beginning Phase 9F.

The first Phase 9F activity should be inspection and design of the validation contracts.

Do not begin by modifying the scientific engines.