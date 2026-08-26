# AgriTwin Phase 9 Closure and Phase 10–18 Roadmap

**Project:** AgriTwin — Weather-, Sensor- and Geometry-Aware Digital Twin for Agrivoltaic Land and Rooftop Systems  
**Repository:** `mazid07066/agrivoltaic-digital-twin`  
**Release branch:** `feature/phase-9-mcda-data-analytics`  
**Phase 9 closure date:** 26 August 2026  
**Final Phase 9 checkpoint:** `5a30278`  
**Status:** Phase 9 complete, verified and pushed

---

## 1. Purpose of this record

This document preserves the development history, delivered architecture,
verification state and scientific boundaries of AgriTwin through Phase 9. It
also defines the approved development sequence from Phase 10 onward.

Future development must extend the verified Phase 9 baseline. It must not
replace the Phase 7B physical simulation core, bypass canonical environmental
data resolution, mutate immutable site versions, double-count inverter
efficiency, or present reconstructed/modelled values as physical measurements.

---

## 2. Final Phase 9 verification checkpoint

The final Phase 9 verification completed successfully with:

- TypeScript typecheck: **PASS**
- ESLint: **PASS**
- Vitest: **59 test files passed**
- Automated tests: **254 tests passed**
- Next.js production build: **PASS**
- Static and dynamic route generation: **PASS**
- Git working tree after push: **clean**
- Local branch synchronized with the remote branch

Final Phase 9 commits visible at closure:

| Commit | Purpose |
|---|---|
| `31f6086` | Configurable PV string topology |
| `4a667e3` | Physical inverter topology and power-series analytics |
| `28d833d` | Stable historical/forecast weather series and Phase 9F closure |
| `5a30278` | Field-aware Land 3D scene and final visualization correction |

Earlier Phase 9 scenario execution and decision-analytics development was
consolidated through the verified Phase 9A–9D work, including reproducible
execution, persisted results, policy evaluation, Pareto analysis, MCDA and
sensitivity/robustness analysis.

---

## 3. Foundation inherited by Phase 9

### Phase 7B physical simulation core

Phase 9 retained and extended the existing engineering model:

- solar position and sun-path calculation;
- GHI, DNI, DHI and plane-of-array irradiance;
- module temperature and temperature derating;
- module-driven installed capacity;
- hourly PV power and daily energy;
- fixed, standard, reverse and custom/adaptive tracking;
- crop-level irradiance and daily light integral;
- spatial ground-light simulation and DLI heat map;
- beneath-panel, between-row and open-field zones;
- crop-light target controller;
- estimated crop-yield index;
- land-equivalent ratio;
- land geometry and PV layout calculations.

### Phase 8 platform foundation

Phase 8 supplied the persistent multi-site platform on which Phase 9 was built:

- Supabase authentication and database integration;
- projects and project ownership;
- Land and Flat-Roof site types;
- site registry;
- immutable site versions;
- rooftop geometry, setbacks, parapets and layout solver;
- Open-Meteo, uploaded, sensor, manual and synthetic environment modes;
- canonical environmental dataset abstraction;
- environmental provenance and fingerprints;
- persistent scenario and execution foundations.

---

## 4. Phase 9 history and delivered work

## 4.1 Phase 9A — Scenario domain and versioning

Phase 9A established scenarios as versioned research objects rather than
temporary UI selections.

Delivered capabilities:

- project and site ownership;
- scenario identifiers and versions;
- baseline and alternative scenarios;
- scenario duplication and parent lineage;
- technical, agricultural, weather, policy and economic sections;
- draft/ready/executed status handling;
- scenario metadata and audit information;
- immutable saved site versions separated from runtime overrides.

The scenario override bridge applies scenario changes to a detached runtime
site profile. It does not alter the stored site version used as the source.

## 4.2 Phase 9B — Environmental resolution

Phase 9B routed every supported environmental source into a canonical
`EnvironmentalDataset`.

Supported modes include:

- historical Open-Meteo data;
- operational forecast data;
- typical/synthetic data;
- registered uploaded datasets;
- sensor-oriented datasets;
- manual environmental inputs.

Every resolved dataset carries source identity, time range, units, quality
information and provenance. Simulation adapters consume the normalized
contract rather than source-specific payloads.

## 4.3 Phase 9C — Reproducible execution

Phase 9C created the immutable execution path:

1. resolve the selected site version;
2. apply scenario overrides to a detached runtime copy;
3. resolve the environmental dataset;
4. produce immutable site, scenario and environment snapshots;
5. calculate environment and execution fingerprints;
6. route execution to the Land or Rooftop adapter;
7. produce canonical summary, hourly and spatial results;
8. persist status, timestamps, errors, engine identity and provenance.

This allows a completed simulation run to be audited and reproduced without
depending on later changes to the project, site, scenario or weather source.

## 4.4 Phase 9D — Analytics and decision support

Phase 9D transformed persisted simulation runs into a controlled study and
decision-analysis system.

Delivered analytics include:

- baseline-versus-alternative comparison;
- policy threshold evaluation;
- multi-run study summaries;
- study compatibility checks;
- Pareto-front identification;
- multi-criteria decision analysis;
- MCDA weight management;
- sensitivity and robustness analysis;
- energy, specific yield, crop DLI, yield index and LER comparisons;
- reproducibility checks across dates, site versions and environment
  fingerprints.

The controlled Phase 9D rice study demonstrated that multiple alternatives
could be executed from the same site version, date and environmental dataset
and then ranked through policy, Pareto and MCDA analysis.

## 4.5 Phase 9E — Electrical balance of system

Phase 9E extended the PV simulation downstream into an explicit electrical
digital twin.

Delivered equipment and topology features:

- selectable PV module catalogue;
- selectable inverter catalogue;
- selected equipment persisted in site/scenario configuration;
- selected equipment used by execution rather than only displayed;
- module and inverter datasheet summaries;
- modules per string;
- strings per inverter;
- strings per MPPT;
- inverter quantity;
- explicit MPPT allocation;
- repeated independent topology for multiple inverter units;
- selected topology and inverter identity in execution provenance.

Delivered compatibility checks:

- installed array STC power;
- configured topology STC power;
- maximum generator power;
- string and inverter capacity;
- string Vmpp and Voc at STC;
- cold-condition Voc safety;
- temperature-adjusted MPPT operating-window advisories;
- string Isc and Impp;
- MPPT operating and short-circuit current;
- total inverter DC operating current;
- inverter loading ratio;
- module assignment and unassigned-module reporting.

Electrical operation includes:

- inverter OFF, waiting, MPPT-active, derated, clipped, grid-limited and fault
  states;
- six independent MPPT inputs and physical string allocation;
- three-phase AC conversion;
- AC bus and distribution board;
- feeders and loads;
- grid import and export;
- energy-balance checks;
- alarms and operating-limit reporting;
- visible electrical BOS in Land and Rooftop dashboards;
- provider abstraction for simulation and future telemetry integrations.

The electrical model explicitly prevents double application of inverter or
system efficiency.

## 4.6 Phase 9F — Historical and forecast power series

Phase 9F added user-selectable time-series analysis without removing or
changing the existing single-day dashboard outputs.

Delivered functions:

- current-date hourly PV power graph;
- configured-date hourly graph;
- historical single-day graph;
- past-to-past date ranges;
- historical-to-current ranges;
- recent-to-future operational forecast ranges;
- mixed historical and forecast ranges;
- batching for ranges longer than 31 days;
- daily energy and peak-power series;
- Land and Rooftop calculation adapters;
- historical/forecast source segmentation;
- unavailable-future-date validation;
- retryable network-failure messages;
- robust Open-Meteo server transport;
- tests for range planning, normalization, browser client and simulation
  integration.

The live Phase 9F acceptance script passed all required date combinations,
including the longer-than-31-day batching case.

## 4.7 Final Phase 9 visualization correction

The final visualization correction removed hard-coded Land scene dimensions.

The Land 3D twin now:

- uses configured field length and width;
- preserves actual module dimensions and row spacing;
- calculates the complete physical array footprint;
- detects array overflow beyond the registered field;
- recommends minimum field dimensions;
- distinguishes the registered field from overflow area;
- dynamically positions crops and grid lines;
- adapts camera distance, shadow range and orbit limits;
- moves the electrical BOS outside the cultivation footprint;
- provides editable field dimensions;
- verifies footprint calculations with automated tests.

An oversized array is intentionally not compressed to fit the scene because
that would misrepresent the engineering configuration.

---

## 5. Phase 9 end-state architecture

```text
DATA SOURCES
Open-Meteo | uploaded dataset | sensor | manual | synthetic
      |
      v
CANONICAL ENVIRONMENTAL DATASET
quality | units | time range | provenance | fingerprint
      |
      v
IMMUTABLE SITE VERSION + VERSIONED SCENARIO
      |
      v
DETACHED RESOLVED EXECUTION INPUT
site snapshot | scenario snapshot | environment fingerprint
      |
      +----------------------+
      |                      |
      v                      v
LAND DIGITAL TWIN       ROOFTOP DIGITAL TWIN
PV + crop light         roof geometry + PV
      |                      |
      +----------+-----------+
                 |
                 v
ELECTRICAL BOS
strings -> MPPT -> inverter -> three-phase AC
-> feeders/loads -> grid import/export
                 |
                 v
IMMUTABLE SIMULATION RUN
summary | hourly | spatial | electrical | provenance
                 |
                 v
ANALYTICS AND DECISION SUPPORT
baseline | policy | Pareto | MCDA | sensitivity | robustness
```

---

## 6. Phase 9 invariants that future phases must preserve

Future work must comply with the following rules:

1. Do not replace the verified Phase 7B physical simulation core without a
   separately validated model version.
2. Do not bypass `EnvironmentalDataset` when adding a data source.
3. Do not mutate saved site versions during scenario execution.
4. Do not alter a completed simulation run.
5. Preserve all dataset, model, site, scenario and execution fingerprints.
6. Do not invent missing module, inverter, weather, sensor or agronomic values.
7. Keep `NOT_EVALUATED` distinct from `PASS`.
8. Treat maximum DC voltage and current constraints as hard safety checks.
9. Keep temperature-adjusted MPPT-window checks advisory where appropriate.
10. Do not double-count PV system or inverter efficiency.
11. Keep installed hardware, configured topology and simulated availability
    separate.
12. Keep measured, cleaned, reconstructed, forecast, climate-projected and
    synthetic values visibly distinguishable.
13. Preserve Land and Rooftop regression behaviour unless an approved model
    migration explicitly changes it.
14. Every scientific output must carry source and model provenance.
15. Commit only after diff check, typecheck, lint, tests and production build.

---

## 7. Scientific limitations at Phase 9 closure

Phase 9 is a verified design, simulation and decision-support platform, but it
is not yet a fully field-validated operational digital twin.

Current limitations include:

- no dedicated World Bank/ESMAP Feni measurement importer;
- no one-minute to 15-minute synchronization pipeline;
- no measured-versus-Open-Meteo paired training dataset;
- no supervised environmental reconstruction model;
- no model registry for trained ML artifacts;
- no measured PV/inverter power validation dataset;
- no live sensor ingestion pipeline in production;
- no long-term climate-projection engine;
- crop yield remains a light-based estimate rather than a field-calibrated crop
  model;
- a model trained at Feni cannot be claimed as validated for Dhaka without
  spatial-transfer validation or local measurements.

Open-Meteo operational forecasts must remain separate from multi-year climate
projections. A 2026–2030 climate series is a scenario-based projection, not a
deterministic weather forecast.

---

## 8. Phase 10 — Measured-data foundation

**Recommended branch:** `feature/phase-10-measured-data-foundation`

### Objective

Integrate the World Bank/ESMAP Bangladesh solar measurement dataset as an
immutable and provenance-controlled research source.

The official dataset is available through ENERGYDATA.INFO and includes raw,
quality-controlled and header resources for the Feni measurement station:

- <https://energydata.info/dataset/bangladesh-solar-radiation-measurement-data>

### Phase 10A — Acquisition and manifest

- acquire QC, raw and header resources;
- preserve original files without modification;
- record URLs, retrieval time, licence and required citation;
- calculate SHA-256 checksums;
- create a formal dataset manifest;
- register Feni as a dedicated validation site;
- capture coordinates, elevation, timezone and sensor metadata.

### Phase 10B — Measurement schema

Create canonical fields for:

- UTC and Asia/Dhaka timestamps;
- GHI, DNI and DHI;
- ambient temperature;
- relative humidity;
- wind speed and direction;
- atmospheric pressure;
- precipitation where available;
- original QC flags;
- source row, file, dataset and station identifiers.

### Phase 10C — Layered storage

- **Raw:** immutable source files;
- **Bronze:** parsed values in original units;
- **Silver:** normalized units, timestamps and quality flags;
- **Gold:** synchronized 15-minute machine-learning dataset.

### Phase 10 acceptance gate

- deterministic import and checksums;
- no duplicate timestamps;
- documented units and timezone conversion;
- preserved QC flags;
- coverage and missingness report;
- row-count reconciliation;
- Feni validation-site registration;
- tests for parsing, units, time and malformed rows;
- full existing regression suite remains green.

---

## 9. Phase 11 — Synchronization, cleaning and features

### Objective

Create the same-location, same-period World Bank/Open-Meteo training dataset.

### Work

- fetch a frozen Open-Meteo historical model for the Feni coordinates;
- normalize timestamps to UTC before joining;
- resample one-minute measurements to 15-minute intervals;
- calculate valid-sample ratios;
- preserve original and cleaned values separately;
- flag physically impossible values and sensor outages;
- limit interpolation to explicitly approved short gaps;
- generate solar geometry, clearness index, cyclical time, lagged and rolling
  features;
- create chronological training, validation and frozen test periods;
- prevent future-value leakage.

### Acceptance gate

- reproducible dataset fingerprint;
- published data dictionary;
- disjoint chronological splits;
- leakage tests;
- downloadable missingness and outlier reports;
- exact aggregation rules for each variable.

---

## 10. Phase 12 — Supervised reconstruction and model registry

### Objective

Train measured-equivalent environmental correction models.

### Model sequence

1. raw Open-Meteo baseline;
2. mean/quantile bias correction;
3. linear or Ridge regression;
4. Random Forest;
5. XGBoost or histogram gradient boosting;
6. LSTM only if simpler models are demonstrably insufficient.

Train separately for GHI, DNI, DHI, temperature, RH, wind, pressure and any
adequately measured precipitation target.

### Evaluation

- chronological and rolling-origin validation;
- R-squared;
- RMSE and normalized RMSE;
- MAE;
- mean bias error;
- correlation and skill improvement over raw Open-Meteo;
- daylight-only solar metrics;
- residual analysis by hour and month;
- uncertainty intervals;
- feature importance and model interpretability.

MAPE must not be used for nighttime or near-zero irradiance.

### Model registry

Every model version must record its target, algorithm, parameters, feature
list, dataset fingerprint, training period, split definition, metrics, random
seed, code commit, artifact checksum and approval status.

### Acceptance gate

- approved model beats the raw-weather baseline on the untouched test period;
- no leakage detected;
- saved model reproduces recorded predictions;
- uncertainty is available;
- rejected and retired models remain traceable.

---

## 11. Phase 13 — Corrected historical reconstruction

### Objective

Produce a continuous bias-corrected 2019–2026 environmental series.

### Work

- retain raw and corrected values together;
- preserve uncertainty bounds;
- mark each point as observed, cleaned observation, raw reanalysis,
  ML-corrected, interpolated or unavailable;
- generate monthly and annual quality summaries;
- integrate corrected series into Scenario Lab;
- provide raw-versus-corrected, measured-overlap and uncertainty graphs;
- provide CSV export and model-version selection.

This output must be called a **bias-corrected historical reconstruction**, not
a forecast.

### Acceptance gate

- explicit gaps instead of invented continuity;
- reproducible fingerprints;
- model and data provenance visible in UI and exports;
- corrected values never labelled as measurements;
- Feni calibration clearly separated from transferred application elsewhere.

---

## 12. Phase 14 — Digital-twin calibration and validation

### Objective

Use corrected environmental data and physical PV observations to validate the
complete twin.

### Required physical observations

- inverter DC power;
- inverter AC power;
- cumulative energy;
- module temperature;
- plane-of-array irradiance;
- tracker position where applicable;
- availability, fault and curtailment states.

Without measured PV output, the system may be described as an
**environmentally calibrated simulation**, not a fully validated digital twin.

### Calibration scope

- soiling and wiring loss;
- thermal correction;
- inverter efficiency;
- availability;
- shading correction;
- albedo;
- tracker-angle bias.

Catalogue and safety values must not be changed merely to improve agreement.

### Acceptance gate

- separate calibration and validation periods;
- measured-versus-simulated power and energy plots;
- RMSE, normalized RMSE, MAE, MBE and performance ratio;
- realistic parameter bounds;
- baseline and calibrated results both retained;
- uncertainty propagated through PV and electrical outputs.

---

## 13. Phase 15 — Climate and energy projection, 2026–2030

### Objective

Provide uncertainty-aware climate scenarios and energy projections.

Open-Meteo's Climate API provides regional downscaled daily climate-model data
through 2050:

- <https://open-meteo.com/en/docs/climate-api>

### Work

- support multiple climate models/members;
- retain model identity and scenario provenance;
- bias-correct against a consistent historical reference such as ERA5-Land;
- preserve the climate-change signal;
- disaggregate daily values to hourly profiles where required;
- conserve daily irradiation, precipitation and temperature extrema;
- generate multiple stochastic realizations;
- propagate weather uncertainty into PV, inverter, crop-light and energy
  outputs.

### UI terminology

- **Forecast:** operational weather-model horizon;
- **Projection:** multi-year climate scenario;
- never present 2026–2030 projections as exact future weather.

### Acceptance gate

- at least three climate-model members;
- visible median, P10/P90 and model spread;
- conservation tests for daily-to-hourly conversion;
- annual PV energy, clipping, DLI and heat-stress distributions;
- no result without model and scenario provenance.

---

## 14. Phase 16 — Real-time operational twin

### Objective

Connect sensors, inverter telemetry and electrical meters through the existing
provider abstraction.

### Inputs

- GHI and POA pyranometers;
- ambient temperature and RH;
- module temperature;
- wind and rainfall;
- soil moisture and PAR/DLI sensors;
- inverter DC/AC telemetry;
- feeder, load and grid meters;
- tracker position and controller status.

### Platform work

- MQTT and authenticated REST ingestion;
- device registry;
- clock drift, duplicates and out-of-order handling;
- time-series persistence;
- sensor quality and health flags;
- latest-state cache;
- historical aggregation;
- simulation fallback when telemetry is unavailable.

### Acceptance gate

- replay and live modes normalize identically;
- source outages cannot crash simulation;
- duplicate and late messages handled deterministically;
- sensor-health and model-residual alarms;
- every output labelled live, measured, reconstructed, forecast, projection or
  synthetic;
- physical actuation disabled by default.

---

## 15. Phase 17 — Control and robust decision support

### Objective

Extend the validated twin into supervised operational optimization.

### Capabilities

- adaptive tracker scheduling;
- crop-DLI protection;
- energy-maximizing operation;
- heat-stress protection;
- irrigation recommendation;
- feeder and load prioritization;
- grid export limiting;
- clipping mitigation;
- uncertainty-aware scenario optimization;
- expanded MCDA combining energy, crop, water, economics, reliability and
  environmental objectives.

### Safe control sequence

```text
Recommendation
      -> hard-constraint validation
      -> operator approval
      -> command dispatch
      -> acknowledgement
      -> measured response
      -> audit record
```

### Acceptance gate

- electrical and agronomic hard constraints cannot be overridden;
- recommendations explain trade-offs;
- manual override and safe fallback;
- complete control audit trail;
- baseline-versus-optimized comparison;
- closed-loop automation only after supervised field trials.

---

## 16. Phase 18 — Reproducible research and production release

### Objective

Package the complete system as a scientifically defensible, maintainable and
deployable research platform.

### Deliverables

- final methodology and architecture;
- dataset cards and data dictionary;
- model cards;
- licence and citation registry;
- reproducible training and evaluation commands;
- experiment manifests;
- containerized ML services;
- database migrations and retention policy;
- API documentation;
- operator and user manuals;
- calibration and validation report;
- uncertainty and limitation statement;
- archived dataset/model/execution fingerprints;
- security, privacy, performance and recovery assessments;
- tagged release and publication-ready artifacts.

---

## 17. Recommended immediate Phase 10 release boundary

The first Phase 10 commit should contain only:

1. World Bank/ESMAP Feni acquisition manifest;
2. immutable raw-file registration;
3. checksums, licence and citation metadata;
4. Feni validation-site profile;
5. canonical measurement schema and units;
6. deterministic CSV/header parser;
7. preservation of original QC flags;
8. coverage, missingness and duplicate report;
9. parser, timestamp, unit and malformed-row tests;
10. Phase 10A documentation.

ML training must not begin before this acceptance gate is complete.

---

## 18. Git and verification policy for future phases

For every subphase:

1. inspect branch, working tree and recent commits;
2. create a phase-specific branch from the verified checkpoint;
3. make narrowly scoped changes;
4. add unit, integration and regression tests;
5. run `git diff --check`;
6. run typecheck;
7. run lint;
8. run targeted tests;
9. run the complete test suite;
10. run the production build;
11. inspect the final diff and working tree;
12. commit with a phase-specific message;
13. push the current branch;
14. record acceptance evidence in the phase handoff file.

Do not rewrite Git history or merge to `main` unless explicitly authorized.

---

## 19. Final Phase 9 closure statement

Phase 9 is complete.

AgriTwin now provides a reproducible multi-site Land and Rooftop digital-twin
platform with environmental abstraction, immutable scenarios and executions,
physical PV and agrivoltaic simulation, explicit inverter/string/MPPT topology,
three-phase electrical distribution, historical and operational forecast power
series, policy evaluation, Pareto analysis, MCDA, sensitivity analysis and
field-aware 3D visualization.

The next research objective is not to rebuild these capabilities. It is to
calibrate and validate them using traceable measured data, extend them with
uncertainty-aware historical reconstruction and climate projections, and then
connect them safely to operational telemetry and supervised control.

