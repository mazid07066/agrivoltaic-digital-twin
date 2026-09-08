# AgriTwin Digital Twin
## Complete Development, Operational, Scientific and Workflow Record Through Phase 12

**Project:** Weather-, Sensor- and Geometry-Aware Digital Twin for Agrivoltaic Land and Rooftop Systems
**Repository:** `mazid07066/agrivoltaic-digital-twin`
**Primary development branch at Phase 12 closure:** `feature/phase-12-validation-explainability`
**Document purpose:** authoritative consolidated engineering and research record through formal Phase 12 closure
**Supersedes:** earlier incomplete or stale master-development summaries through Phase 12

---

# 1. Document Authority and Status

This document consolidates the operational, scientific, architectural, verification and workflow history of AgriTwin through Phase 12. It is intended to be the single master record for understanding how the system evolved, how the major scientific contracts are enforced, how data move through the platform, and how later phases depend on earlier validated foundations.

Where older development notes conflict with formal closure records, the formal closure state is authoritative. In particular:

- Phase 10 is formally complete.
- Phase 11 is formally complete.
- Phase 12 is formally complete.
- Phase 11 no longer has a pending retrospective audit requirement.
- Phase 12 was reconciled with the formally closed Phase 11 history before final acceptance.
- Cross-model comparison is verification unless the reference is a synchronized measurement of the relevant physical quantity.

Final consolidated status:

| Phase | Status | Primary outcome |
|---|---|---|
| 1 | Complete | Initial coupled agrivoltaic simulation concept |
| 2 | Complete | Solar geometry and irradiance foundation |
| 3 | Complete | PV power and thermal performance foundation |
| 4 | Complete | Crop-light, shading and DLI coupling |
| 5 | Complete | Tracking and adaptive agrivoltaic operation |
| 6 | Complete | Spatial digital-twin representation |
| 7 | Complete | Protected scientific land-engine core |
| 8 | Complete | Persistent multi-site platform, database and rooftop architecture |
| 9 | Complete with corrective extensions through 9O | Scenarios, reproducibility, analytics, electrical BOS, export, physics corrections and measured-weather integration |
| 10 | **FORMALLY COMPLETE** | Feni measured-data Raw/Bronze/Silver foundation |
| 11 | **FORMALLY COMPLETE** | Feni Gold synchronization, causal features, chronological splits and reproducible manifests |
| 12 | **FORMALLY COMPLETE** | Cross-model Validation & Explainability Studio |

---

# 2. Project Purpose

AgriTwin is a research-oriented digital-twin platform for agrivoltaic land systems and rooftop PV systems. It is designed to preserve scientific traceability while allowing configuration, simulation, comparison, validation, persistence and decision support across multiple sites and scenarios.

The platform is not designed around machine learning as the computational centre. Physics-based simulation, explicit environmental provenance, immutable configuration history and reproducible execution are the primary architecture. Machine-learning layers may consume reproducible data produced by the platform, but they must not silently replace the scientific contracts of the digital twin.

The high-level architecture is:

```text
DATA SOURCES
    |
    v
ENVIRONMENTAL / MEASUREMENT INGESTION
    |
    v
CANONICAL ENVIRONMENTAL OR MEASUREMENT CONTRACT
    |
    +----------------------------+
    |                            |
    v                            v
SITE VERSION                 SCENARIO VERSION
    |                            |
    +-------------+--------------+
                  |
                  v
        IMMUTABLE EXECUTION INPUT
                  |
                  v
        LAND / ROOFTOP DIGITAL TWIN
                  |
                  v
          PV / CROP PHYSICS OUTPUT
                  |
                  v
        ELECTRICAL BALANCE OF SYSTEM
                  |
                  v
            PERSISTED RUN
                  |
        +---------+----------+
        |                    |
        v                    v
 ANALYTICS / MCDA     VALIDATION / EXPLAINABILITY
```

---

# 3. Scientific and Engineering Invariants

The following constraints are considered persistent design rules unless deliberately versioned and documented in a later phase.

1. The verified Phase 7 scientific core must not be casually replaced by a new implementation merely because another library provides similar functions.
2. `EnvironmentalDataset` remains the canonical environmental abstraction for simulation-facing weather/environment data.
3. Site versions are immutable historical configuration records.
4. Scenario execution must resolve into a detached runtime configuration; scenario overrides must not mutate persisted site versions.
5. Reproducible execution requires an immutable input snapshot plus environment and execution fingerprints.
6. Physics/Research mode must not apply the legacy aggregate `systemEfficiency` term where explicit physical losses are already represented.
7. Inverter efficiency must never be double counted.
8. Manufacturer values must not be invented. Unknown catalogue values must remain unknown, derived with explicit provenance, or block a scientific pathway if required.
9. A failed single-diode scientific fit must block physics/research execution instead of silently producing apparently valid output.
10. MPPT/string topology assumptions must be explicit and distinguishable from measured telemetry.
11. Validation must not silently interpolate, extrapolate, round timestamps, shift timestamps, resample, nearest-neighbour match or truncate date ranges.
12. Validation statistics must operate on the full synchronized series even when plotting uses reduced rendering points.
13. Human-visible timestamps may be shown in site-local time, but absolute canonical timestamps remain the synchronization authority.
14. Feni environmental measurements validate the environmental layer at Feni; they do not automatically validate DC power, AC output, crop DLI, crop yield or the complete digital twin.
15. PVlib/Simulink comparison is cross-model verification unless the comparator is measured physical output.

---

# 4. End-to-End Operational Workflow

A typical research workflow through the completed Phase 12 architecture is:

```text
1. Authenticate and open a project.
2. Create/select a Land or Rooftop site.
3. Save an immutable site version.
4. Select the environmental source and mode.
5. Create a baseline or alternative scenario.
6. Resolve scenario + site + environment into immutable execution input.
7. Run Land/Rooftop physics through the canonical adapter.
8. Pass PV output into the electrical balance-of-system layer.
9. Persist summary/hourly/spatial/electrical outputs and provenance.
10. Compare runs in analytics or MCDA.
11. Export reproducible research evidence.
12. Import AgriTwin, PVlib, Simulink or measured time series into Validation Studio.
13. Align only by exact canonical timestamp intersection.
14. Calculate validation metrics and scientific views.
15. Inspect explainability/provenance and export publication/report artifacts.
```

---

# 5. Phase 1 - Initial Agrivoltaic Simulation Foundation

## Objective

Establish the first working coupled agrivoltaic simulator rather than treating PV generation and agricultural performance as independent calculations.

## Operational capabilities

- agrivoltaic site configuration;
- PV-array configuration;
- crop selection;
- date-based simulation;
- hourly simulation;
- initial graphical interface;
- synthetic environmental fallback where required.

## Scientific foundation

The first model connected incoming solar resource to PV generation and agricultural-light availability. This was intentionally an integrated concept: energy production and crop-light effects belonged to the same simulated site and time basis.

## Workflow

```text
site + PV + crop + date
        |
        v
hourly environment
        |
        v
PV estimate + crop-light estimate
        |
        v
summary visualization
```

## Legacy importance

Phase 1 established the coupled-system direction that all later phases preserved.

---

# 6. Phase 2 - Solar Geometry and Irradiance

## Objective

Replace purely heuristic solar input handling with a geometric solar-energy foundation.

## Scientific capabilities

- solar altitude/elevation;
- solar zenith;
- solar azimuth;
- angle of incidence;
- direct irradiance;
- diffuse irradiance;
- ground-reflected irradiance;
- plane-of-array irradiance.

## Scientific workflow

```text
timestamp + coordinate
        |
        v
solar position
        |
        v
beam/diffuse/ground components
        |
        v
plane-of-array irradiance
```

Plane-of-array irradiance became a key upstream quantity for later PV, thermal and validation work.

---

# 7. Phase 3 - PV Performance and Thermal Response

## Objective

Convert irradiance into module/array power with configuration-aware thermal effects.

## Capabilities

- module power;
- installed PV capacity;
- hourly PV generation;
- daily energy;
- module temperature effects;
- maximum-power temperature coefficient;
- module catalogue support;
- historical broad `systemEfficiency` derating.

## Important later constraint

The original aggregate `systemEfficiency` parameter predates the explicit physical-loss and inverter layers. Later physics/research modes isolate this legacy term to prevent double counting.

## Scientific workflow

```text
POA irradiance
  + ambient environment
  + module parameters
        |
        v
module temperature
        |
        v
module/array DC power
        |
        v
daily energy integration
```

---

# 8. Phase 4 - Agrivoltaic Shading, Crop Irradiance and DLI

## Objective

Make the model genuinely agrivoltaic by representing crop-light effects below and between PV rows.

## Capabilities

- row spacing;
- panel height;
- field geometry;
- shading estimates;
- crop-level irradiance;
- open-field irradiance;
- crop-light reduction;
- Daily Light Integral (DLI);
- target crop DLI.

## Scientific workflow

```text
solar geometry + array geometry
        |
        v
shadow / irradiance reduction
        |
        v
crop-level irradiance
        |
        v
time integration
        |
        v
crop DLI and light-retention indicators
```

---

# 9. Phase 5 - Tracking and Adaptive Agrivoltaic Operation

## Objective

Represent operating strategies that trade energy capture against agricultural-light constraints.

## Supported concepts

- fixed operation;
- standard tracking;
- reverse tracking;
- custom/adaptive operation;
- tracker-angle calculation;
- crop-protection logic.

## Scientific significance

Tracking became a policy variable rather than merely a graphical setting. This later enabled controlled scenario studies in which tracking choice changed energy yield and Land Equivalent Ratio while other environmental inputs remained fixed.

---

# 10. Phase 6 - Spatial Digital Twin

## Objective

Move from scalar site summaries to spatial representation of the agrivoltaic field.

## Capabilities

- spatial irradiance calculations;
- hourly shadow grids;
- daily DLI grids;
- beneath-panel zones;
- between-row zones;
- outer/open-field zones;
- zone statistics;
- DLI heat maps;
- three-dimensional digital-twin visualization.

## Workflow

```text
field geometry + solar position + row geometry
        |
        v
spatial shadow/irradiance field
        |
        v
hourly spatial accumulation
        |
        v
DLI map + zone statistics + 3D scene
```

---

# 11. Phase 7 - Protected Scientific Agrivoltaic Core

## Status

**COMPLETE**

## Objective

Consolidate the scientific land engine into a stable core that later application, persistence and analytics layers can consume without repeatedly rewriting the physics.

## Delivered scientific components

- solar-position modelling;
- GHI/DNI/DHI handling;
- POA irradiance;
- module-temperature calculation;
- PV generation;
- fixed, standard, reverse and custom tracking pathways where applicable;
- adaptive control;
- crop DLI;
- crop-light reduction;
- spatial irradiance/DLI;
- estimated crop yield;
- Land Equivalent Ratio;
- field geometry;
- coupled PV/crop simulation.

## Architectural contract

Later phases use adapters around the scientific core. External reference libraries such as PVlib may be used for verification but do not silently replace the protected engine.

```text
site/scenario configuration
        |
        v
adapter
        |
        v
Phase 7 scientific engine
        |
        v
canonical simulation result
```

---

# 12. Phase 8 - Persistent Multi-Site Platform and Environmental Architecture

## Status

**COMPLETE**

Phase 8 transformed AgriTwin from a single simulation interface into a persistent multi-site digital-twin application.

## 12.1 Phase 8A - Site Schema Architecture

### Objective

Introduce a generic site abstraction while preserving the land scientific core.

### Contract

```text
Site profile
    |
    v
Site-specific adapter
    |
    v
existing scientific engine
```

This allowed Land and Rooftop site types to coexist without duplicating the entire simulation stack.

## 12.2 Phase 8B - Supabase, Authentication and Multi-Site Persistence

### Delivered

- Supabase database;
- authentication;
- projects;
- multi-site registry;
- persistent sites;
- site versions;
- simulation-run persistence foundation;
- row-level ownership/access concepts.

### Core persistent entities

- projects;
- sites;
- site versions;
- simulation runs;
- hourly results;
- spatial results.

## 12.3 Phase 8C - Rooftop Digital Twin

### Delivered

- flat-roof sites;
- building height;
- roof dimensions;
- parapets;
- setbacks;
- usable roof area;
- module-layout solver;
- rooftop installed capacity;
- rooftop POA irradiance;
- module temperature;
- rooftop PV power and daily energy;
- rooftop-specific 3D scene;
- immutable rooftop versions.

## Environmental architecture

Phase 8 also established the provider abstraction that later became critical for reproducibility:

- Open-Meteo;
- uploaded/local datasets;
- manual data;
- sensor data;
- synthetic data;
- environmental provenance;
- environmental fingerprinting.

All simulation-facing weather data are normalized through a common environmental contract.

---

# 13. Phase 9 - Research Scenarios, Reproducibility, Analytics and Electrical BOS

## Status

**COMPLETE WITH FORMALLY PRESERVED EXTENSIONS THROUGH PHASE 9O**

Phase 9 is a major umbrella phase. It converted the platform from a configurable simulator into a reproducible research system and later corrected important scientific issues discovered during deeper validation.

---

# 14. Phase 9A - Scenario Architecture

## Objective

Create formal baseline and alternative research scenarios with versioning and lineage.

## Scenario content

- project ID;
- site ID;
- scenario type;
- status;
- baseline flag;
- parent scenario;
- scenario version;
- technical configuration;
- agricultural configuration;
- weather configuration;
- policy configuration;
- economic configuration;
- metadata/provenance.

## Workflow

```text
immutable site version
        +
scenario definition
        |
        v
runtime scenario override
        |
        v
simulation execution
```

Scenario duplication preserves lineage. Scenario editing creates versioned evolution rather than overwriting scientific history.

---

# 15. Phase 9B - Canonical Environmental Resolution

## Objective

Ensure all scenarios use one environmental pipeline rather than creating parallel weather logic.

## Supported modes/sources

- historical;
- forecast;
- typical;
- dataset;
- sensor;
- Open-Meteo;
- uploaded/local datasets;
- manual/sensor/synthetic pathways.

## Contract

All sources resolve into `EnvironmentalDataset` before reaching simulation.

```text
provider/source-specific data
        |
        v
normalization + provenance
        |
        v
EnvironmentalDataset
        |
        v
execution resolver
```

---

# 16. Phase 9C - Reproducible Execution

## Objective

Make a simulation run reproducible and auditable.

## Architecture

```text
Site Version
    +
Scenario Version
    +
Resolved Environmental Dataset
        |
        v
Resolved Execution Input
        |
        v
Immutable Input Snapshot
        |
        +--> Environment Fingerprint
        |
        +--> Execution Fingerprint
        |
        v
Land/Rooftop Adapter
        |
        v
Canonical Result
        |
        v
Persisted Simulation Run
```

## Persisted evidence

- run identity;
- site version;
- scenario/version;
- environmental source;
- environmental fingerprint;
- execution fingerprint;
- engine identity/version;
- input snapshot;
- summary output;
- hourly output;
- spatial output;
- warnings/errors;
- timestamps.

## Scientific rule

Scenario overrides create a detached runtime profile. Persisted site history remains immutable.

---

# 17. Phase 9D - Analytics and Decision Support

## Objective

Support scientific comparison of controlled alternatives rather than ad-hoc visual inspection.

## Delivered analytics

- baseline comparison;
- policy evaluation;
- multi-run studies;
- compatibility checks;
- Pareto analysis;
- MCDA;
- metric-direction handling;
- weighting;
- normalization;
- sensitivity analysis;
- robustness analysis;
- missing-data rejection.

## Controlled Rice study

Recorded date: `2026-08-20`.

The study held project, site, site version, environment and environmental fingerprint constant while changing selected technical/scenario variables.

Approximate persisted results:

| Scenario | Daily Energy | Specific Yield | Crop DLI | Crop Yield | LER |
|---|---:|---:|---:|---:|---:|
| Baseline | 97.47 kWh | 2.9536 | 44.12 | 88.2% | 1.60 |
| Height 4 m | 97.47 kWh | 2.9536 | 44.06 | 88.3% | 1.60 |
| Spacing 6 m | 97.47 kWh | 2.9536 | 43.92 | 88.4% | 1.60 |
| Standard tracking | 181.21 kWh | 5.4912 | 43.39 | 88.8% | 2.14 |
| Fixed tracking | 144.84 kWh | 4.3891 | 43.27 | 88.9% | 1.96 |

Recorded MCDA order:

1. Standard tracking
2. Fixed tracking
3. Row spacing 6 m
4. Panel height 4 m
5. Baseline

## Policy normalization

Policy thresholds stored as fractions are normalized before comparison against percentage-valued results. Example: `0.8` represents `80%`.

---

# 18. Phase 9E - Electrical Balance-of-System

## Objective

Extend the digital twin downstream from PV generation into inverter, AC distribution, loads and optional grid interaction.

## Electrical architecture

```text
PV ARRAY
   |
   v
DC POWER
   |
   v
STRING / MPPT AGGREGATION
   |
   v
INVERTER
   |
   v
3-PHASE AC BUS
   |
   v
DISTRIBUTION BOARD
   |
   +--> FEEDERS --> LOADS
   |
   +--> OPTIONAL GRID
```

## Reference inverter

Initial demonstration reference: SMA Sunny Tripower CORE1 STP 50-40 profile.

Important reference constraints used in the model include approximately:

- 75 kWp maximum generator power;
- 1000 V maximum DC input voltage;
- 500-800 V MPP range;
- 670 V rated input voltage;
- 150 V minimum input voltage;
- 188 V start voltage;
- 120 A maximum operating input current;
- 20 A maximum operating current per MPPT;
- 30 A maximum short-circuit current per MPPT/string input;
- six independent MPPT inputs;
- two strings per MPPT;
- 50 kW rated AC active power;
- 50 kVA apparent power;
- three-phase operation;
- maximum efficiency approximately 98.1%;
- European efficiency approximately 97.8%.

No fabricated manufacturer part-load efficiency curve is treated as authoritative.

## Inverter states

- `OFF`;
- `WAITING_FOR_START`;
- `MPPT_ACTIVE`;
- `DERATED`;
- `CLIPPED`;
- `GRID_LIMITED`;
- `FAULT`.

## Three-phase relation

The model uses the standard relation:

`P = sqrt(3) * V_LL * I * PF`

with consistent line-to-line versus line-to-neutral interpretation.

## Provenance rule

Assumed string/MPPT allocations must be identified as assumptions and never labelled as measured telemetry.

---

# 19. Phase 9F/9G - Equipment Selection, Compatibility and Research Export

## Equipment-selection workflow

The platform added catalogue-driven PV module and inverter selection so chosen equipment affects the actual execution path rather than only UI display.

```text
SELECTED PV MODULE
        +
SELECTED INVERTER
        |
        v
STRING DESIGN / MPPT COMPATIBILITY
        |
        v
SITE/SCENARIO CONFIGURATION
        |
        v
ELECTRICAL EXECUTION
        |
        v
PROVENANCE / EXPORT
```

Compatibility checks cover relevant voltage/current constraints, MPPT windows and topology assumptions.

## Research export extension

Research-oriented export functionality expanded to include structured evidence such as:

- XLSX reports;
- PDF/printable reports;
- validation contracts;
- topology exchange;
- full weather/power retention where required;
- explicit limitations and warnings;
- scene/research capture support.

---

# 20. Phase 9H-9L - Physics Upgrade

## Objective

Separate explicit physical-loss behavior from legacy aggregate derating and improve consistency between scientific layers.

## Key outcomes

- explicit-loss physics pathway;
- research/physics mode separated from legacy aggregate `systemEfficiency`;
- improved topology consistency;
- versioned physics behavior;
- preservation of prior persisted runs through version-aware interpretation.

## Scientific constraint

A physics/research run must not apply an aggregate system-efficiency factor after explicit losses have already been represented.

---

# 21. Phase 9M - Feni Measured Weather Integration and Weather-Range Resilience

## Objective

Add the large World Bank/ESMAP Feni dataset as an optional measured weather source and stabilize long-range weather requests.

## Feni data integration

The dataset can be selected as measured weather only for its available temporal coverage. Open-Meteo remains an alternative provider pathway.

Feni station identity later formalized in Phase 10:

- station BDFE2;
- latitude 22.80029 N;
- longitude 91.35819 E;
- elevation approximately 5 m;
- source timezone UTC.

## Range-resilience work

Long range Open-Meteo requests received bounded timeout/retry behavior, progress reporting and cancellation support to prevent indefinite UI blocking.

Recorded Phase 9M verification included passing TypeScript, ESLint, Vitest, production build and dependency checks at its closure checkpoint.

---

# 22. Phase 9N - Single-Diode Scientific Correction

## Problem discovered

A deeper diagnostic showed that the existing single-diode implementation could reproduce Voc and Isc while materially underestimating Pmp for a reference module, meaning apparent electrical plausibility did not guarantee a valid MPP fit.

Reference module: Canadian Solar CS1U-420MS.

Reference datasheet values:

- Pmax 420 W;
- Vmp 44.90 V;
- Imp 9.37 A;
- Voc 53.80 V;
- Isc 9.80 A;
- Pmax coefficient -0.37 %/C;
- Voc coefficient -0.29 %/C;
- Isc coefficient +0.05 %/C.

## Corrective methodology

The Phase 9N solver calibrates a consistent set of single-diode parameters against the supplied datasheet targets rather than relying on a coarse default parameterization.

Representative calibrated values recorded during diagnosis:

- ILRef approximately 9.805 A;
- I0Ref approximately 1.17e-11 A;
- Rs approximately 0.299 ohm;
- RshRef approximately 999 kohm;
- aRef approximately 1.960.

Representative corrected behavior:

- STC Pmp approximately 420.68 W;
- Vmp approximately 44.90 V;
- Imp approximately 9.369 A;
- Voc approximately 53.80 V;
- 65 C Pmp approximately 365.46 W;
- 65 C Voc approximately 47.93 V.

## Scientific acceptance rule

Calibration results are classified. A failed scientific fit must block physics/research execution rather than silently returning a power point.

## Test-runtime note

The catalogue-wide calibration test is computationally heavy. The individual test timeout was increased narrowly from 30 seconds to 60 seconds because valid executions repeatedly approached or exceeded the former 30-second boundary under full-suite load. This timeout change does not modify model physics.

---

# 23. Phase 9O - Relative Row-Shading Correction

## Objective

Correct relative row-shading geometry and preserve explicit engine versioning.

Recorded physics versions include:

- `agritwin-land-phase9o-relative-row-shading-v1`;
- `agritwin-rooftop-phase9o-relative-row-shading-v1`.

Land and Rooftop pathways share the common physics timestep infrastructure where appropriate.

Spatial-light refinement may continue in future research, but the identified row-shading correction itself is considered closed.

---

# 24. Phase 10 - Feni Measured-Data Foundation

## Status

**FORMALLY COMPLETE**

## Branch and closure

- branch: `feature/phase-10-measured-data-foundation`;
- implementation commit: `cf2ca91`;
- final continuation/documentation checkpoint: `4154387`.

## Dataset identity

World Bank / ESMAP Feni station BDFE2.

- latitude: 22.80029;
- longitude: 91.35819;
- elevation: approximately 5 m;
- native timezone: UTC;
- native resolution: one minute;
- period: 2017-06-08 through 2019-09-30;
- rows: 1,216,800;
- recorded temporal completeness: 100%;
- controlled source SHA-256: `39a7697322612ff98e4e7a3454e3e8bd4eb206e53417973b73845394ec07d3c1`.

## Pipeline

```text
RAW SOURCE
    |
    v
BRONZE - preserved source values and QC
    |
    v
SILVER - canonical timestamps, units, QC states and provenance
```

## Delivered

- immutable acquisition manifest;
- checksum and size validation;
- station/sensor identity;
- Raw/Bronze/Silver measurement contracts;
- streaming Python ETL;
- UTC and Asia/Dhaka timestamp representations;
- original and normalized units;
- QC flag retention and composite decoding;
- missing reasons and quality status;
- source-row provenance;
- malformed-row reporting;
- duplicate/order detection;
- coverage and longest-gap analysis;
- deterministic JSON quality report;
- Feni validation-site registry;
- environment-adapter compatibility.

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

## Scientific boundary

Phase 10 is a measured environmental-data foundation. It does not validate plant DC, inverter AC, crop DLI, crop yield or the complete digital twin. No final ML model is trained.

---

# 25. Phase 11 - Feni Gold Synchronization Foundation

## Status

**FORMALLY COMPLETE**

## Branch and commits

- branch: `feature/phase-11-feni-gold-synchronization`;
- implementation commit: `c04470e`;
- formal closure documentation commit: `6915576`.

## Objective

Create a reproducible Gold layer between Feni measured observations and hourly historical/provider data such as Open-Meteo while preserving timestamp integrity, QC, provenance and leakage-safe future modelling preparation.

## Implemented module

`research/data_pipeline/gold_pipeline.py`

provides:

- deterministic JSON fingerprinting;
- strict timezone-aware UTC parsing;
- one-minute grid enforcement;
- deterministic 15-minute measured aggregation;
- deterministic hourly measured aggregation;
- variable-specific aggregation;
- circular mean for wind direction;
- QC/sample-coverage preservation;
- provider normalization and manifesting;
- exact UTC synchronization;
- canonical synchronized Gold rows;
- explicit cleaning-state metadata;
- bounded auditable interpolation;
- deterministic solar/time features;
- causal lags;
- trailing rolling statistics;
- chronological train/validation/test splits;
- final Gold manifest and fingerprints.

## Aggregation policy

### 15-minute measured representation

- exact absolute UTC quarter-hour buckets;
- expected complete bucket count: 15 one-minute observations.

### Hourly measured representation

- derived directly from one-minute Silver records;
- expected complete bucket count: 60 observations;
- not produced by averaging already-aggregated 15-minute means.

### Variable rules

- scalar continuous variables: arithmetic mean;
- precipitation: sum;
- wind direction: circular mean.

## Timestamp policy

Canonical processing timezone: `UTC`.

Feni human/display timezone: `Asia/Dhaka`.

Requirements:

- timezone-aware measurement timestamps;
- exact one-minute measurement grid;
- exact hourly provider grid;
- duplicate absolute timestamps rejected.

No silent rounding, shifting, nearest-neighbour matching or resampling.

## Synchronization policy

Authoritative method:

`exact_utc_timestamp_intersection`

Only timestamps present exactly in both measured and provider hourly datasets enter synchronized Gold rows. Different source ranges are allowed; unmatched hours remain unmatched and are counted.

## QC policy

Gold variables preserve:

- valid/flagged/invalid/missing counts;
- expected samples;
- observed samples;
- usable samples;
- coverage ratio;
- usable ratio;
- interpolation status.

## Interpolation policy

Interpolation is **disabled by default**.

When explicitly enabled:

- only approved continuous variables may be interpolated;
- linear interpolation only;
- internal gaps only;
- explicit maximum gap bound;
- no edge extrapolation;
- no bridging missing hourly timestamps;
- interpolation boundaries and status recorded.

## Feature engineering

Deterministic features include:

- UTC hour;
- Asia/Dhaka local hour;
- local day-of-year;
- cyclical hour encoding;
- cyclical annual encoding;
- solar declination;
- hour angle;
- zenith;
- elevation;
- equation of time;
- causal lag features;
- trailing rolling mean/min/max/std.

Default lags: `1 h, 3 h, 6 h, 24 h`.

Default trailing windows: `3 h, 6 h, 24 h`.

## Causal guarantees

- lags reference strictly earlier rows;
- rolling windows are trailing only;
- centered windows prohibited;
- no future rows used;
- non-contiguous hourly feature input rejected.

## Chronological splits

Default deterministic partition:

- train 70%;
- validation 15%;
- test 15%.

Rows are contiguous, chronological and never randomly shuffled.

## Reproducibility

Fingerprints bind:

- provider request;
- provider source identity;
- provider artifact;
- provider manifest;
- measurement source;
- synchronization policy;
- cleaning policy;
- feature policy;
- split policy;
- synchronized rows;
- complete Gold manifest.

Changing data rows or scientific policies changes the final Gold fingerprint.

## Final verification

Recorded final acceptance:

- TypeScript PASS;
- ESLint PASS with 0 errors and 3 non-blocking warnings;
- Phase 10 + 11 Python tests: 54 passed;
- Python compile PASS;
- full Vitest suite: 92 files / 350 tests passed;
- Next.js production build PASS;
- `git diff --check` PASS;
- dependency audit: 0 vulnerabilities;
- local/remote implementation checkpoint synchronized at `c04470e38eb6ad5f493516d99269f823ed56cef9` before final closure documentation.

## Scientific boundary

No final machine-learning model was trained in Phase 11. Phase 11 prepares reproducible, leakage-aware data for later research.

---

# 26. Phase 12 - Cross-Model Validation and Explainability Studio

## Status

**FORMALLY COMPLETE**

## Branch and key commits

Branch: `feature/phase-12-validation-explainability`.

Recorded key implementation history:

- `102ebdd` - complete site-aware validation and explainability;
- `ca3912d` - finalize site-aware reporting and local-time exports;
- `08ea840` - align datasets by exact timestamp intersection;
- `3590dc0` - record development history through Phase 12;
- `b648e4b` - formally close Phase 12.

The Phase 12 branch was reconciled/fast-forwarded through the formally closed Phase 11 branch before final acceptance.

## Route

`/validation`

## Studio structure

- Datasets;
- Alignment;
- Comparison;
- Metrics;
- Explain.

## Supported sources

- AgriTwin;
- PVlib;
- Simulink;
- measured observations;
- generic compatible CSV/XLSX time-series data.

## Dataset import

Implemented capabilities include:

- CSV;
- XLSX;
- automatic column inspection;
- canonical variable mapping;
- configurable column mapping;
- PVlib aliases;
- Simulink aliases;
- AgriTwin result recognition;
- AgriTwin hourly power/weather merge;
- timezone-aware timestamp conversion;
- variable-level provenance;
- unit normalization.

## Canonical timestamp policy

Internal synchronization uses absolute canonical timestamps.

The import layer supports timezone-aware timestamps and local timestamps with declared timezone. Duplicate timestamps and invalid bounds are detected.

For Feni human-facing reporting, timestamps are formatted in `Asia/Dhaka`; UTC remains the synchronization basis.

## Synchronization policy

Authoritative method:

**exact canonical timestamp intersection**

Allowed:

- different source date ranges;
- different row counts;
- different coverage;
- different sampling intervals when exact common timestamps exist.

Blocked where appropriate:

- zero exact overlap;
- duplicate timestamps;
- unresolved timezone mismatch;
- no common canonical variable.

Never automatic:

- interpolation;
- extrapolation;
- nearest-neighbour matching;
- timestamp rounding;
- timestamp shifting;
- silent resampling;
- silent date-range truncation.

## Comparison views

- overlay;
- residual;
- parity scatter;
- y=x reference line;
- daily energy;
- cumulative energy.

Residual convention:

`candidate - reference`

Plot reduction may be applied only for visualization performance. Metrics use the complete synchronized series.

## Metrics

- Mean Bias Error (MBE);
- Mean Absolute Error (MAE);
- Root Mean Square Error (RMSE);
- normalized RMSE;
- coefficient of determination (R2);
- correlation;
- total-series error.

Power-series totals are not mislabeled as energy unless the compared variable is an actual energy quantity.

## Explainability

Evidence-oriented stages include:

- environmental/weather input;
- plane-of-array irradiance;
- optical/IAM effects;
- shading/soiling;
- thermal behavior;
- DC generation;
- crop irradiance where available;
- string/MPPT topology;
- inverter conversion;
- AC output.

Explainability is provenance-constrained. If a canonical dataset does not expose an intermediate stage, the UI reports that limitation rather than inventing causal attribution.

## Provenance

The studio preserves evidence such as:

- source type;
- source file;
- variable source;
- unit conversion;
- timestamp transformation;
- timezone conversion;
- canonical variable mapping;
- preprocessing transformations.

## Research exports

- aligned CSV;
- comparison XLSX;
- metrics XLSX;
- explainability XLSX;
- publication-oriented PNG;
- vector SVG;
- browser print / Save PDF;
- report metadata;
- figure metadata.

## Feni reporting context

- site: Feni, Bangladesh;
- station: BDFE2;
- latitude: 22.80029;
- longitude: 91.35819;
- display timezone: Asia/Dhaka;
- UTC offset: UTC+06:00.

A previously observed six-hour display error was corrected by formatting canonical timestamps using the site timezone for human-facing charts/reports while preserving absolute timestamps internally.

## Scientific classification

AgriTwin-to-PVlib and AgriTwin-to-Simulink comparisons are **cross-model verification**.

Empirical validation requires synchronized measured observations of the relevant physical output.

Measured Feni weather observations validate the environmental layer only. They do not directly validate:

- PV DC power;
- inverter AC output;
- crop DLI;
- crop yield;
- plant-level system performance;
- the complete agrivoltaic digital twin.

## Final verification

Recorded final Phase 12 acceptance:

- TypeScript PASS;
- ESLint PASS;
- ESLint errors: 0;
- ESLint warnings: 3 non-blocking warnings;
- Phase 10 + 11 Python tests: 54 passed;
- Python compile PASS;
- Phase 12 validation tests: 41 passed across 13 test files;
- full Vitest suite: 350 tests across 92 files passed;
- Next.js production build PASS;
- dependency audit: 0 vulnerabilities;
- `git diff --check` PASS.

The retained non-blocking ESLint warnings concern an unused validation-site label import, an image-optimization advisory, and an unused research SVG style helper. They do not alter scientific behavior or acceptance.

---

# 27. Canonical Data and Provenance Workflows

## Environmental simulation data

```text
Open-Meteo / uploaded / sensor / manual / synthetic
        |
        v
provider-specific normalization
        |
        v
EnvironmentalDataset
        |
        v
scenario/environment resolver
        |
        v
immutable execution input
```

## Feni measured-data research pipeline

```text
World Bank / ESMAP source
        |
        v
RAW identity + checksum
        |
        v
BRONZE preservation
        |
        v
SILVER canonical records + QC
        |
        v
15-min and hourly GOLD aggregation
        |
        +--> provider artifact / manifest
        |
        v
exact UTC timestamp intersection
        |
        v
canonical synchronized Gold rows
        |
        +--> optional bounded interpolation (explicit only)
        |
        +--> causal features
        |
        +--> chronological splits
        |
        v
Gold manifest + fingerprints
```

---

# 28. Simulation Execution Workflow

```text
Project
  |
  v
Site
  |
  v
Immutable Site Version
  |
  +-------------------+
  |                   |
  v                   v
Scenario           Environment Source
  |                   |
  +---------+---------+
            |
            v
Resolved Execution Input
            |
            +--> immutable snapshot
            +--> environment fingerprint
            +--> execution fingerprint
            |
            v
Land/Rooftop Adapter
            |
            v
Physics Engine
            |
            v
PV/Crop Result
            |
            v
Electrical BOS
            |
            v
Persisted Run
```

---

# 29. Validation Workflow

```text
AgriTwin / PVlib / Simulink / Measured / Generic CSV-XLSX
        |
        v
Import + canonical mapping + timezone resolution
        |
        v
Dataset provenance
        |
        v
Compatibility inspection
        |
        v
EXACT CANONICAL TIMESTAMP INTERSECTION
        |
        v
Synchronized comparison series
        |
        +--> overlay
        +--> residual
        +--> parity
        +--> daily/cumulative energy
        |
        +--> MBE / MAE / RMSE / nRMSE / R2 / correlation / total-series error
        |
        +--> explainability + provenance
        |
        v
CSV / XLSX / PNG / SVG / PDF research export
```

---

# 30. Repository Architecture at Phase 12

Representative source areas include:

- `src/lib/analytics` - baseline comparison, Pareto, MCDA, sensitivity and robustness;
- `src/lib/database` - database contracts/types;
- `src/lib/electrical` - inverter, MPPT, strings, distribution, telemetry and electrical persistence;
- `src/lib/environment` - canonical environment contracts and providers;
- `src/lib/execution` - scenario resolution, adapters, snapshots, fingerprints and persistence mapping;
- `src/lib/geometry` - land/roof geometry and research-scene geometry;
- `src/lib/measurements` - measured-data identities/manifests;
- `src/lib/modelTransparency` - scientific model transparency;
- `src/lib/physics` - PV/irradiance/thermal/single-diode/shading physics;
- `src/lib/powerSeries` - power-series range and integration logic;
- `src/lib/projects` - project/site-version payload contracts;
- `src/lib/pv` - PV module catalogue and inputs;
- `src/lib/researchExport` - common research export structures;
- `src/lib/rooftop` - rooftop simulation;
- `src/lib/scenarios` - scenario contracts/configuration;
- `src/lib/simulation` - scientific simulation integration/regression;
- `src/lib/sites` - site contracts/adapters/migration;
- `src/lib/validationExchange` - validation exchange manifests/topology/CSV;
- `src/lib/validationStudio` - import, synchronization, comparison, metrics, explainability and export;
- `src/lib/weather` - weather range and measured Feni integration.

Application/API areas include project/site/scenario pages, analytics routes, simulation-run routes, weather/environment APIs and `/validation`.

---

# 31. Testing and Acceptance Philosophy

AgriTwin uses layered verification rather than relying on a single application build.

Typical gates include:

1. TypeScript typecheck;
2. ESLint;
3. targeted unit/scientific tests;
4. full Vitest regression suite;
5. Python pipeline tests where relevant;
6. Python syntax/compile checks;
7. Next.js production build;
8. dependency audit;
9. `git diff --check`;
10. branch/local/remote commit verification;
11. documented scientific limitations.

A passing build is not considered sufficient evidence of scientific validity. Scientific invariants are covered by focused tests such as:

- scenario scientific effect;
- Phase 7 regression parity;
- single-diode calibration and catalogue classification;
- row-shading geometry;
- energy integration;
- environment provenance;
- Feni measured range behavior;
- synchronization exact-intersection tests;
- timezone conversion;
- validation metrics/comparison behavior;
- topology compatibility.

---

# 32. Release and Branch History Highlights

Important recorded checkpoints include:

- `7071d60` - complete early Phases 1-6B;
- `2347220` - protected Phase 7B PV checkpoint;
- Phase 8 tagged/merged checkpoints for site schema, database, multi-site and rooftop foundations;
- `142f1b5` - Phase 9A scenario foundation;
- `1bdcd96` - Phase 9B environmental pipeline;
- `0cd1f05` - Phase 9C reproducible execution;
- `1098fc0` - Phase 9 scenario execution and decision analytics;
- `9e08550` - Phase 9E electrical balance-of-system;
- `dfa023e` - equipment selection and compatibility;
- `6f820df` - Phase 9G research export closure;
- `9b04a69` - Phase 9H-9L physics upgrade;
- `5294fa0` - Phase 9M Feni integration;
- `31863da` and related Phase 9N calibration history - single-diode correction;
- `13bb3cb` - relative PV row-shading geometry correction;
- `cf2ca91` - Phase 10 measured-data foundation;
- `c04470e` - Phase 11 Feni Gold synchronization;
- `6915576` - formal Phase 11 closure;
- `102ebdd`, `ca3912d`, `08ea840` - Phase 12 validation/explainability implementation and synchronization correction;
- `b648e4b` - formal Phase 12 closure.

---

# 33. Known Scientific Limitations at Phase 12 Closure

The completed system is a strong research platform, but the following are not yet claimed as complete empirical validation:

- measured plant-level DC calibration;
- measured inverter AC validation;
- comprehensive uncertainty quantification across all model stages;
- parameter identification from co-located plant measurements;
- crop-yield empirical validation for the complete crop model;
- final forecasting model training;
- closed-loop field controller synthesis;
- bidirectional actuation/control of a deployed agrivoltaic system.

Feni measured weather data are geographically specific. Applying their conclusions directly to another site is spatial transfer unless that site has co-located measurements.

---

# 34. Future Development Direction After Phase 12

A scientifically coherent next sequence should build on, not bypass, the completed foundations. Appropriate future work includes:

- plant-output measurement ingestion for DC/AC empirical validation;
- uncertainty propagation and confidence intervals;
- parameter estimation/calibration using measured plant data;
- explicit forecast-model training using Phase 11 leakage-safe Gold data;
- sensor fusion with quality-aware provenance;
- controller design and closed-loop simulation;
- real hardware/IoT integration with telemetry quality classification;
- spatial crop-model refinement and measured crop response;
- cross-site transfer studies with explicit domain-shift reporting.

Any future ML or control phase should preserve the immutable execution and validation contracts established through Phase 12.

---

# 35. Historical Evidence Preservation

Historical work products such as patches, source archives, blocked handoff notes and temporary Phase 9N work directories have been deliberately preserved outside the tracked master record. They should not be accidentally staged merely to make the working tree visually clean.

Examples previously preserved as untracked evidence include:

- `AGRITWIN_PHASE_9H_TO_9L.patch`;
- `AGRITWIN_PHASE_9H_TO_9L_CURRENT_CHECKPOINT.txt`;
- `AGRITWIN_PHASE_9H_TO_9L_CURRENT_SOURCE.tar.gz`;
- `AGRITWIN_PHASE_9N_BLOCKED_HANDOFF.md`;
- `agritwin_apply_editable_mppt_topology.sh`;
- `phase9n-work/`.

These are historical evidence, not part of the authoritative tracked master document.

---

# 36. Operational Rules for Continued Development

Before beginning any new phase:

1. start from a synchronized branch containing formal Phase 12 closure;
2. do not rewrite old phase records unless correcting a documented factual error;
3. preserve scientific engine version identifiers when behavior changes;
4. add focused regression tests before broad UI work for physics changes;
5. preserve exact timestamp/provenance contracts for measured and validation data;
6. separate cross-model verification from empirical validation language;
7. never stage historical evidence accidentally;
8. run full repository acceptance gates before formal closure;
9. create a phase-specific closure record containing scientific boundaries and exact acceptance evidence;
10. update this master record only after the phase is formally closed.

---

# 37. Final Formal State Through Phase 12

AgriTwin has completed a continuous development sequence from an initial coupled agrivoltaic simulator to a reproducible, persistent, multi-site research digital twin with environmental provenance, measured-data pipelines, electrical BOS modelling, decision analytics, scientific correction/versioning, and a cross-model Validation & Explainability Studio.

The authoritative closure state is:

**AGRITWIN_DEVELOPMENT_RECORD_STATUS: COMPLETE THROUGH PHASE 12**

**PHASE_10_STATUS: FORMALLY COMPLETE**

**PHASE_11_STATUS: FORMALLY COMPLETE**

**PHASE_12_STATUS: FORMALLY COMPLETE**

**PHASE_11_VERIFICATION_STATUS: PASSED**

**PHASE_12_VERIFICATION_STATUS: PASSED**

---

# 38. Source Records Used for This Consolidation

This master record consolidates the repository's development and closure evidence, including the Phase 1-9 complete handoff, Phase 9 extension closure records, Phase 10 completion record, Phase 11 formal closure record, Phase 12 formal closure record, and the development-phase record through Phase 12.

This document intentionally removes stale status language from earlier intermediate records while preserving the underlying scientific and operational history.
