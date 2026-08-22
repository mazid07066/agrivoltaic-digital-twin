# AgriTwin Development Checkpoint and Forward Roadmap
## Phase 9D Completion + Connected Inverter / AC Distribution Extension

**Project:** AgriTwin — Weather-, Sensor- and Geometry-Aware Digital Twin for Agrivoltaic Land and Rooftop Systems  
**Repository:** `agrivoltaic-digital-twin`  
**Current branch:** `feature/phase-9-mcda-data-analytics`  
**Verified Phase 9 commit:** `1098fc0`  
**Commit message:** `feat: complete Phase 9 scenario execution and decision analytics`  
**Remote status:** pushed to `origin/feature/phase-9-mcda-data-analytics`  
**Working tree at checkpoint:** clean

---

# 1. Current Verified State

The current AgriTwin architecture has progressed beyond a basic PV simulator and now includes:

- Multi-site architecture
- Land agrivoltaic and rooftop PV modes
- Immutable site versions
- Scenario architecture
- Open-Meteo environmental integration
- Uploaded/local environmental datasets
- Environmental provenance and dataset fingerprinting
- Reproducible execution input snapshots
- Persisted simulation runs
- Persisted hourly and spatial outputs
- Scenario-level execution overrides
- Controlled baseline/alternative experiments
- Policy evaluation
- Baseline comparison
- Multi-run analytics
- Pareto analysis
- MCDA ranking
- MCDA sensitivity / robustness analysis
- Analytics UI and API layer
- Reproducibility checks
- Full typecheck, test, lint and production-build verification

The Phase 9 release checkpoint passed:

- `npm run typecheck`
- `npm test`
- `npm run lint`
- `npm run build`

with the complete test suite passing.

---

# 2. Phase 9D Controlled Research Study

A frozen controlled environmental dataset was introduced:

`data/environment/phase9d-rice-study-20260820.csv`

Dataset ID:

`phase9d-rice-study-20260820`

The frozen dataset is registered in:

`src/lib/environment/localDataset/registry.ts`

This dataset was intentionally committed despite the broader environment-data ignore rule because it is part of the reproducible Phase 9 research evidence.

## Controlled study scenarios

### Baseline

- Scenario: `Rice AV Policy Baseline Test`
- Scenario ID: `12790cbf-3c8d-42bc-bb7a-2b58dbbadd50`
- Version: 11
- Baseline: `true`
- Panel height: 5 m
- Row spacing: 8 m
- Tilt: 20°
- Tracking: reverse
- Crop: rice
- Environmental source: uploaded dataset
- Dataset ID: `phase9d-rice-study-20260820`

### Alternatives

1. `Phase 9D ALT-A — Panel Height 4 m`
   - panel height = 4 m

2. `Phase 9D ALT-B — Row Spacing 6 m`
   - row spacing = 6 m

3. `Phase 9D ALT-C — Standard Tracking`
   - tracking mode = standard

4. `Phase 9D ALT-D — Fixed Tracking`
   - tracking mode = fixed

All alternatives preserve:

- same site
- same site version
- same simulation date
- same frozen environmental dataset
- same environmental fingerprint
- same crop
- same policy constraints
- explicit parent-scenario lineage

This forms a controlled scientific comparison set.

---

# 3. Phase 9D Scientific Effect Verification

After the scenario override bridge was connected to the land engine, scenario-level design changes produced physically distinguishable simulation results.

Controlled final study results included:

| Scenario | Daily Energy | Specific Yield | Crop DLI | Crop Yield | LER |
|---|---:|---:|---:|---:|---:|
| Baseline | 97.47 kWh | 2.9536 | 44.12 | 88.2% | 1.60 |
| ALT-A Panel Height 4 m | 97.47 kWh | 2.9536 | 44.06 | 88.3% | 1.60 |
| ALT-B Row Spacing 6 m | 97.47 kWh | 2.9536 | 43.92 | 88.4% | 1.60 |
| ALT-C Standard Tracking | 181.21 kWh | 5.4912 | 43.39 | 88.8% | 2.14 |
| ALT-D Fixed Tracking | 144.84 kWh | 4.3891 | 43.27 | 88.9% | 1.96 |

The controlled environment contract showed:

- 5 selected runs
- 1 simulation date
- 1 site version
- 1 environmental fingerprint
- 1 dataset ID

Scientific variation existed across:

- daily energy
- specific yield
- crop DLI
- crop yield
- LER

Therefore the scenario-execution bridge is operational and scientifically meaningful.

---

# 4. Phase 9D Analytics Completed

Implemented analytics include:

## 4.1 Baseline comparison

Persisted runs can be compared against a selected baseline.

Outputs include:

- absolute difference
- percentage change
- comparable metric count
- unavailable metric count

## 4.2 Policy evaluation

Current policy fields include:

- minimum crop retention
- maximum GCR
- minimum LER
- minimum panel height
- maximum DLI reduction
- minimum renewable energy

Normalized policy fractions such as:

- `0.8`
- `0.4`

are converted correctly to percentage units when compared against percentage-valued simulation metrics.

## 4.3 Multi-run analytics

Multiple compatible persisted runs can be analyzed together.

## 4.4 Study compatibility

Study compatibility checks protect the research pipeline against inappropriate comparisons across incompatible projects, sites, site types, engines, simulation dates, or environmental evidence.

## 4.5 Pareto analysis

Non-dominated alternatives can be identified across multiple competing objectives.

## 4.6 MCDA

The MCDA subsystem supports:

- benefit/cost directions
- normalized weights
- metric eligibility
- missing-evidence rejection
- ranking
- score generation
- non-discriminating metric warnings

Final controlled ranking placed:

1. ALT-C — Standard Tracking
2. ALT-D — Fixed Tracking
3. ALT-B — Row Spacing 6 m
4. ALT-A — Panel Height 4 m
5. Baseline

## 4.7 Sensitivity / robustness

Decision robustness analysis is implemented to examine how MCDA outcomes change when criterion weights change.

---

# 5. New Required Extension: Connected Inverter + AC Distribution Demonstration

AgriTwin now needs an electrical balance-of-system layer between DC PV production and site/load/grid consumption.

The new physical pipeline should be:

```text
PV Array / Agrivoltaic Site
          ↓
DC String Aggregation
          ↓
MPPT Inputs
          ↓
Connected Inverter
          ↓
3-Phase AC Bus
          ↓
Distribution Board
          ↓
Feeders
    ┌─────┼─────┐
    ↓     ↓     ↓
 Load A Load B Load C
          ↓
Optional Grid Import / Export
```

The inverter must not replace the current PV engine.

The digital twin should continue to calculate PV-side electrical production first. The inverter becomes a downstream electrical-conversion subsystem.

---

# 6. Inverter Specification to Implement

## Input (DC)

| Parameter | Value |
|---|---:|
| Max. generator power (STC) | 75,000 Wp |
| Max. input voltage | 1000 V |
| MPP voltage range | 500–800 V |
| Rated input voltage | 670 V |
| Min. input voltage | 150 V |
| Start input voltage | 188 V |
| Max. operating input current | 120 A |
| Max. operating current per MPPT | 20 A |
| Max. short-circuit current per MPPT | 30 A |
| Max. short-circuit current per string input | 30 A |
| Independent MPPT inputs | 6 |
| Strings per MPPT input | 2 |

## Output (AC)

| Parameter | Value |
|---|---:|
| Rated active power | 50,000 W |
| Max. apparent AC power | 50,000 VA |
| AC nominal voltage | 220/380 V, 230/400 V, 240/415 V |
| AC voltage range | 202–305 V |
| Grid frequency | 50 / 60 Hz |
| Frequency range | 44–55 Hz / 54–65 Hz |
| Rated power frequency | 50 Hz |
| Rated grid voltage | 230 V |
| Max. output current | 72.5 A |
| Rated output current | 72.5 A |
| Output phases | 3 |
| AC connection | 3-(N)-PE |
| Power factor at rated power | 1 |
| Adjustable displacement PF | 0.0 leading to 0.0 lagging |
| THD | < 3% |

## Technical

| Parameter | Value |
|---|---:|
| Maximum efficiency | 98.1% |

---

# 7. Scientific Modelling Rules for the Inverter

## 7.1 Do not invent unsupported datasheet curves

Only maximum efficiency has been provided.

Therefore the first implementation should use a transparent configurable efficiency assumption and explicitly report the modelling assumption.

Recommended first model:

```text
η_inverter ≤ 0.981
P_AC = min(P_DC × η_inverter, 50 kW)
```

The UI/result snapshot must state that a constant/nominal efficiency approximation is used unless a manufacturer efficiency curve is later added.

Future inverter models may add:

- Euro efficiency
- weighted efficiency
- part-load efficiency curve
- temperature derating
- reactive-power behaviour
- voltage-dependent derating
- thermal derating
- clipping curve

but none should be silently invented now.

## 7.2 DC-side operating-state logic

Recommended states:

```text
OFF
WAITING_FOR_START
MPPT_ACTIVE
DERATED
CLIPPED
GRID_LIMITED
FAULT
```

Minimum logic:

- `Vdc < 150 V` → unavailable
- `150 ≤ Vdc < 188 V` → waiting / not started
- `Vdc ≥ 188 V` → inverter may start
- `500–800 V` → normal MPPT voltage region
- `Vdc > 1000 V` → fault
- total DC operating current > 120 A → current-limit/fault/derating logic
- per-MPPT current > 20 A → MPPT current limit
- per-MPPT short-circuit current > 30 A → protection violation
- per-string short-circuit current > 30 A → protection violation

The implementation must distinguish:

- physical electrical limit
- clipping
- protection fault
- data-quality warning

## 7.3 MPPT topology

Represent:

```text
Inverter
├── MPPT 1
│   ├── String 1
│   └── String 2
├── MPPT 2
│   ├── String 1
│   └── String 2
...
└── MPPT 6
    ├── String 1
    └── String 2
```

Maximum:

- 6 MPPTs
- 2 strings per MPPT
- 12 strings total

A first demonstration may distribute site DC power equally across MPPTs only when explicit string electrical data are unavailable. This assumption must be visible in provenance.

---

# 8. Three-Phase AC Model

The AC-side model should expose both line-to-neutral and line-to-line quantities.

For a nominal 230/400 V three-phase system:

```text
V_LN ≈ 230 V
V_LL ≈ 400 V
```

For balanced three-phase real power:

```text
P = √3 × V_LL × I × PF
```

Therefore:

```text
I = P / (√3 × V_LL × PF)
```

At approximately:

```text
P = 50 kW
V_LL = 400 V
PF ≈ 1
```

the expected current is approximately consistent with the specified 72.5 A rated current.

The digital twin should not calculate a misleading 3-phase current using 230 V as line-to-line voltage.

---

# 9. Required Inverter Outputs

Each simulation timestep should expose:

## DC-side

- total DC power
- DC voltage
- DC current
- available DC power
- accepted DC power
- clipped DC power
- MPPT 1–6 voltage
- MPPT 1–6 current
- MPPT 1–6 power
- per-string current where available
- DC-limit flags

## Conversion

- inverter operating state
- efficiency
- conversion loss
- clipping loss
- derating loss
- cumulative inverter energy

## AC-side

- active power P
- reactive power Q
- apparent power S
- power factor
- L-N voltage
- L-L voltage
- phase current
- frequency
- phase count
- THD
- AC energy
- output availability
- grid compliance flags

## Alarms / protections

- DC overvoltage
- DC undervoltage
- start-voltage not reached
- MPPT voltage outside normal window
- DC overcurrent
- MPPT overcurrent
- string short-circuit-current violation
- AC overvoltage
- AC undervoltage
- frequency out of range
- AC overcurrent
- apparent-power limit
- inverter clipping
- THD violation
- grid unavailable
- general fault

---

# 10. AC Bus, Loads and Feeders

The inverter should feed a virtual AC distribution board.

Suggested first structure:

```text
Site AC Bus
├── Feeder 1
│   ├── load profile
│   └── priority
├── Feeder 2
│   ├── load profile
│   └── priority
├── Feeder 3
│   ├── load profile
│   └── priority
└── Grid connection
```

Each feeder should support:

- name
- nominal voltage
- number of phases
- connected load kW
- demand profile
- power factor
- priority
- enabled/disabled state

Per timestep calculate:

```text
PV AC Available
       ↓
Local Load Demand
       ↓
PV to Load
       ↓
Surplus or Deficit
```

If grid-connected:

```text
PV surplus → Grid Export
Load deficit → Grid Import
```

If islanded demonstration mode:

```text
PV deficit → Unserved Load
```

The user should be able to demonstrate:

- daytime PV supply to loads
- feeder loading
- load priority
- grid import
- grid export
- inverter clipping
- insufficient PV
- inverter trip/fault
- load-shedding scenario

---

# 11. Electrical Energy Balance

At every timestep enforce:

```text
P_AC_available + P_grid_import
=
P_load_served + P_grid_export + P_distribution_loss
```

For the first implementation, distribution losses may be explicitly set to zero unless cable/transformer impedance data are supplied.

Never invent feeder losses without electrical parameters.

The energy balance should produce a validation error if numerical imbalance exceeds a configured tolerance.

---

# 12. Recommended Software Architecture

Create a dedicated electrical subsystem rather than mixing inverter logic into the PV engine.

Suggested structure:

```text
src/lib/electrical/
├── types.ts
├── inverter/
│   ├── inverterModel.ts
│   ├── inverterLimits.ts
│   ├── mppt.ts
│   ├── threePhase.ts
│   ├── efficiency.ts
│   ├── alarms.ts
│   └── types.ts
├── distribution/
│   ├── acBus.ts
│   ├── feeder.ts
│   ├── loadProfile.ts
│   ├── dispatch.ts
│   ├── energyBalance.ts
│   └── types.ts
├── adapters/
│   ├── landElectricalAdapter.ts
│   └── rooftopElectricalAdapter.ts
└── __tests__/
```

Do not place these calculations directly in:

- `landAgrivoltaic.ts`
- rooftop simulation core
- analytics code

The electrical layer must remain downstream and reusable by both site types.

---

# 13. Canonical Execution Extension

Current flow:

```text
Site Version
   ↓
Scenario
   ↓
Environmental Dataset
   ↓
Resolved Execution Input
   ↓
Land / Rooftop Engine
   ↓
Canonical Simulation Result
```

Extend to:

```text
Site Version
   ↓
Scenario
   ↓
Environmental Dataset
   ↓
Resolved Execution Input
   ↓
Land / Rooftop PV Engine
   ↓
DC/PV Result
   ↓
Electrical Adapter
   ↓
Inverter
   ↓
AC Bus
   ↓
Feeders / Loads / Grid
   ↓
Canonical Simulation Result
```

The existing PV and crop calculations must remain intact.

---

# 14. Proposed Canonical Result Additions

Add optional electrical output without breaking old runs:

```ts
electrical?: {
  inverter: {
    modelId: string;
    status: string;
    dcPowerKw: number;
    acPowerKw: number;
    apparentPowerKva: number;
    reactivePowerKvar: number;
    efficiencyPercent: number;
    clippingLossKw: number;
    conversionLossKw: number;
    voltageLnV: number;
    voltageLlV: number;
    phaseCurrentA: number;
    frequencyHz: number;
    powerFactor: number;
    thdPercent: number | null;
  };

  distribution: {
    totalLoadKw: number;
    servedLoadKw: number;
    unservedLoadKw: number;
    gridImportKw: number;
    gridExportKw: number;
    feeders: [];
  };
}
```

Old persisted runs should remain readable if `electrical` is absent.

---

# 15. Persistence Model

Recommended future tables:

```text
inverter_models
site_inverters
load_profiles
distribution_feeders
electrical_run_summaries
electrical_hourly_results
```

Possible `inverter_models` fields:

- id
- manufacturer
- model
- rated_power_w
- max_apparent_power_va
- max_generator_power_wp
- max_dc_voltage_v
- mppt_min_voltage_v
- mppt_max_voltage_v
- rated_dc_voltage_v
- min_dc_voltage_v
- start_dc_voltage_v
- max_dc_current_a
- max_mppt_current_a
- max_mppt_short_circuit_current_a
- max_string_short_circuit_current_a
- mppt_count
- strings_per_mppt
- ac_nominal_voltage_json
- ac_voltage_min_v
- ac_voltage_max_v
- rated_frequency_hz
- allowed_frequency_ranges_json
- rated_current_a
- max_current_a
- phases
- connection
- rated_power_factor
- max_efficiency
- thd_limit_percent
- metadata
- created_at

Use versioning/provenance principles consistent with the rest of AgriTwin.

---

# 16. UI Requirements

Add an authenticated electrical view.

Recommended route:

`/electrical`

or later:

`/sites/[siteId]/electrical`

Initial dashboard sections:

## A. PV → inverter flow

Show:

- DC input
- accepted power
- clipped power
- AC output
- efficiency

## B. MPPT panel

Six MPPT cards:

```text
MPPT 1
Voltage
Current
Power
String 1
String 2
Status
```

## C. Three-phase AC output

Show:

- P
- Q
- S
- PF
- V L-N
- V L-L
- phase current
- frequency
- THD
- inverter state

## D. Distribution single-line visualization

```text
PV ARRAY
   │
INVERTER
   │
AC BUS
 ┌─┼───────┐
 │ │       │
F1 F2     GRID
 │ │
L1 L2
```

## E. Feeder table

- feeder
- connected load
- present demand
- PV supplied
- grid supplied
- current
- PF
- status
- served/unserved

## F. Energy balance

- PV DC energy
- inverter AC energy
- conversion losses
- site consumption
- grid import
- grid export
- unserved energy

---

# 17. Connected / Live Demonstration Path

The inverter should first be implemented as a simulation model.

After that, a connected demonstration mode can be introduced.

Future connectivity options:

```text
Physical inverter / controller
        ↓
Modbus TCP / Modbus RTU / MQTT / REST
        ↓
AgriTwin IoT Gateway
        ↓
Canonical inverter telemetry
        ↓
Live Digital Twin
```

Do not couple the core electrical model directly to one communications protocol.

Use an adapter architecture:

```text
InverterTelemetryProvider

simulation
modbus_tcp
modbus_rtu
mqtt
rest
manual
```

This will allow AgriTwin to operate both:

- fully simulated
- hardware-in-the-loop
- physically connected

without modifying the scientific core.

---

# 18. Revised Development Roadmap

Because the inverter is a central physical part of the PV digital twin, it should be introduced before final physical validation.

The earlier roadmap is therefore extended without discarding any prior work.

## Completed

### Phase 7
Core land agrivoltaic digital twin

### Phase 8
Database, multisite, rooftop and environment foundation

### Phase 9A
Scenario architecture

### Phase 9B
Scenario/environment integration

### Phase 9C
Reproducible execution and persisted results

### Phase 9D
Analytics, policy evaluation, Pareto, MCDA, sensitivity / robustness

---

# 19. New Phase 9E — Electrical Balance-of-System

## Phase 9E-1 — Electrical data contracts

Create:

- inverter specification type
- MPPT type
- string-input type
- AC-output type
- feeder type
- load-profile type
- grid-exchange type
- electrical result type

## Phase 9E-2 — Inverter model

Implement:

- DC start/stop
- MPPT voltage checks
- current checks
- 50 kW clipping
- 50 kVA apparent-power limit
- maximum 98.1% efficiency cap
- AC current
- three-phase calculations
- alarms

## Phase 9E-3 — MPPT / string aggregation

Support:

- 6 MPPTs
- 2 strings per MPPT
- 12 total string channels

## Phase 9E-4 — AC bus and feeder model

Implement:

- AC bus
- load demand
- feeder allocation
- grid import/export
- optional islanded mode
- served/unserved load

## Phase 9E-5 — Execution integration

Connect:

```text
Land PV result
Rooftop PV result
      ↓
Electrical Adapter
      ↓
Inverter
      ↓
Distribution
```

## Phase 9E-6 — Persistence

Persist:

- electrical summary
- hourly inverter result
- feeder result
- energy balance
- alarms
- inverter specification fingerprint

## Phase 9E-7 — Electrical UI

Create inverter and distribution dashboard.

## Phase 9E-8 — Connected inverter adapter foundation

Introduce telemetry-provider interface, without requiring physical hardware yet.

## Phase 9E-9 — Verification

Required:

- unit tests
- current/voltage limit tests
- clipping test
- energy-conservation test
- three-phase current test
- load dispatch test
- backward-compatibility test
- typecheck
- full tests
- lint
- production build
- controlled demonstration run
- commit
- push

---

# 20. Phase 9F — Digital Twin Physical Validation

The originally planned Phase 9E validation work moves to 9F so that the electrical inverter layer can also be validated.

This is not a change in scientific intent; only sequencing is improved.

Required pipeline:

```text
Persisted Simulation Run
        +
Measured / Reference Data
        ↓
Timestamp Alignment
        ↓
Measured vs Simulated
        ↓
Metrics
        ↓
Validation Record
```

Metrics:

- R²
- RMSE
- MAE
- MAPE
- NMBE
- MBE
- energy error %
- coverage
- sample count

Validation should eventually cover:

- irradiance
- temperature
- PV DC power
- inverter AC power
- energy
- optionally feeder measurements

Add:

`/validation`

Do not allow opaque automatic self-modification of the twin.

Calibration must remain versioned and reproducible.

---

# 21. Phase 10 — Data + ML Intelligence

## Phase 10A — Measured Dataset Registry

Create a formal measured-data registry supporting:

- World Bank measured datasets
- local station datasets
- pyranometer data
- IoT data
- inverter telemetry
- imported CSV

Do not make the system World-Bank-specific.

## Phase 10B — Synchronization and Preprocessing

Suggested:

```text
src/lib/data-pipeline/
├── types.ts
├── synchronization.ts
├── resampling.ts
├── missingValues.ts
├── outliers.ts
├── featureEngineering.ts
├── qualityReport.ts
└── datasetBuilder.ts
```

Capabilities:

- 1-minute → 15-minute/hourly resampling
- timestamp alignment
- timezone handling
- missing-value rules
- outlier detection
- QC flags
- feature engineering

## Phase 10C — Python ML Service

Recommended architecture:

```text
AgriTwin Next.js
       ↓
ML Service API
       ↓
Python
├── pandas
├── numpy
├── scikit-learn
├── xgboost
└── later PyTorch/TensorFlow
```

Initial algorithms:

- baseline regression
- Random Forest
- XGBoost

LSTM later.

## Phase 10D — ML Validation + Model Registry

Persist:

- model ID
- algorithm
- hyperparameters
- training dataset fingerprint
- validation dataset fingerprint
- train period
- validation period
- R²
- RMSE
- MAE
- MAPE
- NMBE
- model artifact reference
- model status

No model result without provenance.

## Phase 10E — Historical Reconstruction

Pipeline:

```text
Measured period
      +
Open-Meteo same period
      ↓
ML training
      ↓
Validated model
      ↓
Open-Meteo later period
      ↓
ML reconstruction
      ↓
Canonical EnvironmentalDataset
```

Add future environmental source:

`ml_reconstructed`

The reconstructed data must still enter the existing environmental resolver rather than bypassing the execution architecture.

---

# 22. Phase 11 — Future Environmental Projection

## Phase 11A — Future Climate / Environmental Scenarios

Support explicit categories:

- historical
- forecast
- typical meteorological year
- uploaded future dataset
- climate projection
- ML-reconstructed historical
- ML-corrected projection

## Phase 11B — Bias Correction

Optional ML/statistical correction of climate/environment projection inputs.

## Phase 11C — Long-Term Agrivoltaic Projection

Pipeline:

```text
Future climate/environment scenario
         ↓
Optional bias correction
         ↓
EnvironmentalDataset
         ↓
Scenario
         ↓
Digital Twin
         ↓
PV DC
         ↓
Inverter AC
         ↓
Loads / Grid
         ↓
Crop / LER / Energy
         ↓
Analytics
```

Outputs should support multi-year:

- DC energy
- AC energy
- inverter losses
- grid import/export
- crop response
- LER
- operational constraints
- policy compliance

---

# 23. Phase 12 — Integrated Research Decision-Support Platform

Final architecture:

```text
                   AGRITWIN

                 DATA SOURCES
                      │
      ┌───────────────┼────────────────┐
      │               │                │
   Sensors       Open-Meteo       Uploaded Data
      │               │                │
      └───────────────┼────────────────┘
                      ↓
            ENVIRONMENT LAYER
                      ↓
             DATA ENGINEERING
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
 Direct Environment         ML Intelligence
                                 │
                       Training / Validation
                                 │
                          Reconstruction
                                 │
          └───────────┬───────────┘
                      ↓
             EnvironmentalDataset
                      ↓
                 SCENARIO LAB
                      ↓
              EXECUTION SNAPSHOT
                      ↓
                 SHA-256 ID
                      ↓
                DIGITAL TWIN
          ┌───────────┴───────────┐
          ↓                       ↓
        LAND                   ROOFTOP
          └───────────┬───────────┘
                      ↓
                 PV DC OUTPUT
                      ↓
             ELECTRICAL BOS
                      ↓
                  INVERTER
                      ↓
               3-PHASE AC BUS
                      ↓
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
      LOADS        FEEDERS         GRID
        └─────────────┼─────────────┘
                      ↓
               SIMULATION RUN
                      ↓
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
    Hourly         Spatial       Electrical
       └──────────────┼──────────────┘
                      ↓
              PERSISTED RESULTS
                      ↓
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
Reproducibility   Validation      Analytics
                                     │
                       ┌─────────────┼─────────────┐
                       ↓             ↓             ↓
                   Baseline       Policy         MCDA
                   Compare      Evaluation      Ranking
                       └─────────────┼─────────────┘
                                     ↓
                              DECISION SUPPORT
                                     ↓
                             FUTURE PROJECTION
```

---

# 24. Immediate Next Step

Do not start Phase 10 yet.

The next development target should be:

**Phase 9E-1 — Electrical data contracts and inverter specification model**

Start by inspecting the current canonical execution-result types and land/rooftop adapter boundaries.

Do not modify the working scientific engine before inspection.

Recommended first inspection commands:

```bash
cd ~/Projects/agrivoltaic-digital-twin

echo "========================================"
echo " PHASE 9E-1 ELECTRICAL FOUNDATION INSPECTION"
echo "========================================"

echo
echo "=== CURRENT BRANCH / STATUS ==="
git branch --show-current
git status --short
git log -3 --oneline --decorate

echo
echo "=== EXECUTION TYPES ==="
sed -n '1,320p' src/lib/execution/types.ts

echo
echo "=== LAND ADAPTER ==="
sed -n '1,360p' src/lib/execution/landAdapter.ts

echo
echo "=== ROOFTOP ADAPTER ==="
sed -n '1,360p' src/lib/execution/rooftopAdapter.ts

echo
echo "=== EXECUTION RESULT REFERENCES ==="
grep -RniE \
'CanonicalSimulationSummary|SimulationExecutionResult|summary:|hourly:|spatial:' \
src/lib/execution \
src/lib/sites \
src/lib/rooftop \
| head -250

echo
echo "=== SITE PROFILE TYPES ==="
grep -RniE \
'LandAgrivoltaicSiteProfile|FlatRoof|Rooftop|SiteProfile' \
src/lib/sites \
| head -250
```

Paste the output into the new chat before making code changes.

---

# 25. New Chat Thread Prompt

Copy the following into a new chat thread under the same project:

```text
Continue development of my AgriTwin agrivoltaic digital twin from the verified Phase 9 release checkpoint.

Repository:
~/Projects/agrivoltaic-digital-twin

Current branch:
feature/phase-9-mcda-data-analytics

Verified Phase 9 commit:
1098fc0
feat: complete Phase 9 scenario execution and decision analytics

The branch has been pushed and the working tree was clean at the checkpoint.

Do NOT redo completed Phase 7, Phase 8, Phase 9A, 9B, 9C or 9D work.

Phase 9D is complete and includes:
- scenario architecture
- uploaded/frozen environmental dataset support
- reproducible persisted execution
- execution fingerprints
- scenario-level scientific overrides
- controlled baseline/alternative experiments
- policy evaluation
- baseline comparison
- multi-run analytics
- study compatibility
- Pareto analysis
- MCDA
- MCDA sensitivity / robustness
- analytics APIs and UI
- full tests/typecheck/lint/build
- frozen Phase 9D dataset
  phase9d-rice-study-20260820

The next phase is Phase 9E:
CONNECTED INVERTER + AC ELECTRICAL DISTRIBUTION DIGITAL TWIN.

The inverter specification is:

DC:
- max generator power STC 75,000 Wp
- max DC input voltage 1000 V
- MPP voltage range 500–800 V
- rated DC voltage 670 V
- minimum DC voltage 150 V
- start voltage 188 V
- max operating DC current 120 A
- max operating current per MPPT 20 A
- max short-circuit current per MPPT 30 A
- max short-circuit current per string input 30 A
- 6 independent MPPTs
- 2 strings per MPPT

AC:
- rated active power 50,000 W
- max apparent power 50,000 VA
- nominal voltage 220/380, 230/400, 240/415 V
- AC voltage range 202–305 V
- 50/60 Hz grid frequency
- 44–55 Hz / 54–65 Hz frequency ranges
- rated frequency 50 Hz
- rated grid voltage 230 V
- max/rated output current 72.5 A
- 3 phases
- 3-(N)-PE
- PF at rated power 1
- adjustable displacement PF 0.0 leading to 0.0 lagging
- THD <3%
- maximum efficiency 98.1%

Required architecture:
PV DC output
→ MPPT/string aggregation
→ inverter
→ 3-phase AC bus
→ feeders
→ loads
→ optional grid import/export.

The inverter must be a downstream electrical balance-of-system layer.
Do NOT replace or rewrite the current land/rooftop PV engines.

Required first Phase 9E subphase:
9E-1 Electrical data contracts and inverter specification model.

Before changing code:
1. verify branch, git status and commit
2. inspect current execution result types
3. inspect land adapter
4. inspect rooftop adapter
5. inspect canonical summary/hourly/spatial result contracts
6. inspect site-profile types
7. determine the minimum backward-compatible electrical extension

Important rules:
- preserve old simulation runs
- electrical output must initially be optional
- no unsupported inverter efficiency curve may be invented
- use max efficiency 98.1% as an explicit bounded assumption until a real efficiency curve is provided
- enforce DC and AC limits
- model 6 MPPT × 2 strings
- use correct three-phase equations
- expose DC, MPPT, inverter AC, losses, grid, feeder and load outputs
- enforce AC energy balance
- support future telemetry adapters such as simulation, Modbus, MQTT and REST
- do not connect protocol logic directly to the scientific inverter model
- do not commit until tests, typecheck, lint and build pass
- do not merge to main unless I explicitly instruct it

After Phase 9E:
Phase 9F = physical/model validation
Phase 10 = measured data + preprocessing + Python ML service + ML validation + reconstruction
Phase 11 = future climate/environment projection + bias correction + long-term agrivoltaic projection
Phase 12 = integrated research decision-support platform

I will paste the Phase 9E-1 inspection output next. Review it first and then guide me with exact copy-paste-ready commands and code.
```

---

# 26. Final Checkpoint

The authoritative development order is now:

```text
Phase 9D  COMPLETE
    ↓
Phase 9E  Inverter + AC Distribution
    ↓
Phase 9F  Digital Twin Physical Validation
    ↓
Phase 10  Measured Data + ML Reconstruction
    ↓
Phase 11  Future Projection
    ↓
Phase 12  Integrated Research Decision Support
```

This retains the previously agreed research pipeline while adding the missing electrical conversion and distribution layer required for a complete operational PV/agrivoltaic digital twin.
