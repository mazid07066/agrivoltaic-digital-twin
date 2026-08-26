# AgriTwin Phase 9G Validation and Research Export Closure

## 1. Purpose

This document preserves the implementation history, architecture, verification requirements, scientific limitations, and Phase 10 continuation plan for the Phase 9G extension of AgriTwin.

Phase 9G adds:

- configuration-safe Open-Meteo power series;
- scientific model transparency;
- physical-layout validation;
- PVlib and Simulink validation-exchange foundations;
- topology and research-data exports;
- multi-sheet XLSX datasets;
- formatted PDF simulation reports;
- deterministic 3D research views;
- fullscreen, clean-scene, and 4K capture facilities;
- export provenance and explicit validation disclaimers.

It does not replace the protected Phase 7B simulation core, mutate immutable site versions, bypass `EnvironmentalDataset`, or claim that external validation is complete.

## 2. Repository checkpoint

- Repository: `~/Projects/agrivoltaic-digital-twin`
- GitHub: `mazid07066/agrivoltaic-digital-twin`
- Branch: `feature/phase-9g-validation-export`
- Phase 9 visual baseline: `5a30278 fix(land): make 3D farm geometry field aware`
- Weather/power-series closure: `28d833d fix(weather): stabilize power series and close phase 9`
- Electrical/power-series checkpoint: `4a667e3 feat: add physical inverter topology and power-series analytics`

## 3. Phase 9G-1A: validation exchange

The typed exchange layer under `src/lib/validationExchange/` provides CSV serialization, validation manifests, weather rows, hourly-power rows, daily-energy rows, physical topology, electrical topology, MPPT/string allocation validation, and stable public exports.

```text
src/lib/validationExchange/types.ts
src/lib/validationExchange/csv.ts
src/lib/validationExchange/manifest.ts
src/lib/validationExchange/topology.ts
src/lib/validationExchange/serializers.ts
src/lib/validationExchange/index.ts
```

Electrical topology is represented as:

```text
Inverter -> MPPT -> String -> Modules
```

Rows preserve inverter and module profiles, MPPT and string indices, modules per string, assigned module count, and assigned/inactive state. No topology is invented when a chosen design is incomplete.

The `validation/pvlib/` and `validation/simulink/` workspaces establish the external validation boundary. PVlib must independently reproduce solar position, irradiance transposition, module temperature, DC power, inverter conversion, clipping, and energy rather than call the TypeScript power engine. Simulink execution remains external because MATLAB was unavailable in the inspected Linux environment.

## 4. Configuration-integrity repair

A stale-result risk was identified in `PowerOutputTimeSeries`: a graph could remain visible after the active site or PV configuration changed.

The Land graph is now keyed by `activeSite.updatedAt`, while Rooftop is keyed by `site.updatedAt`. Configuration changes destroy old graph/export state and require regeneration.

`src/lib/powerSeries/__tests__/configurationIntegrity.test.ts` verifies that an approximately 149.94 kWp configured plant cannot silently return the default approximately 33 kWp plant result.

## 5. Reviewed 149.94 kWp example

The reviewed configuration used 357 Canadian Solar CS1U-MS-420 modules at 420 W, 21 rows by 17 modules, three 50 kW SMA STP 50-40 inverters, 17 modules per string, seven strings per inverter, 21 strings total, six MPPT inputs per inverter, 4 m row spacing, 2 m height, 180-degree azimuth, 82% aggregate efficiency, 0.2 albedo, and Open-Meteo weather.

After repairing stale graph state, the reviewed 2025 result was approximately:

```text
Total energy:       192,754.8 kWh
Average/day:            528.1 kWh
Peak daily energy:      871.5 kWh
Peak power:              96.89 kW
Specific yield:       1,285.5 kWh/kWp/year
Capacity factor:          14.7%
```

These are plausible preliminary modeled values for Dhaka. Plausibility is not validation, and the figures must not be represented as measured or independently validated results.

## 6. Physical-layout integrity

`src/lib/geometry/landArrayFootprint.ts` evaluates registered and required dimensions, overflow, fit state, recommended field size, and visualization dimensions.

For 21 rows, 17 modules per row, 4 m spacing, 0.992 m module width, and 2.078 m module length:

```text
Row length      = 17 x 0.992 = 16.864 m
Row-centre span = (21 - 1) x 4 = 80 m
Required width  = 80 + 2.078 = 82.078 m
```

A 44 m x 20 m field cannot contain the array. The minimum rounded width is approximately 83 m; 56 m x 100 m is a physically consistent preliminary example.

## 7. Scientific model transparency

The implementation under `src/lib/modelTransparency/` and `src/components/twin/science/` exposes installed DC capacity, inverter AC capacity, inverter loading ratio, module coverage, specific yield, capacity factor, equipment, field fit, equations, substituted values, editable inputs, catalogue values, assumptions, and provenance.

Principal equations include:

```text
P_STC = N_modules x P_module / 1000
G_POA = G_beam + G_sky + G_ground
T_module = T_air + ((NOCT - 20) / 800) x G_POA
f_T = 1 + gamma_Pmax x (T_module - 25)
P_PV = P_STC x (G_POA / 1000) x f_T x eta_system
E_day = sum(P_PV,h x delta_t)
V_string,mpp = N_modules/string x V_module,mpp
I_AC = P_AC / (sqrt(3) x V_LL x PF)
```

These describe the current simplified model and are not substitutes for an IEC-compliant design study.

## 8. Electrical interpretation

The reviewed allocation is balanced: `21 strings x 17 modules/string = 357 modules`. Checks cover array power, inverter capacity, module allocation, string capacity, strings per MPPT, Vmpp, Voc, operating and short-circuit current, total DC current, and inverter loading ratio.

Without minimum design temperature and maximum cell temperature, cold Voc, cold/hot Vmpp, and hot-condition current checks remain incomplete. The approximately 763.3 V STC string Vmpp is close to the 800 V MPPT upper boundary and requires temperature-aware confirmation. Conductor sizing, voltage drop, protection coordination, earthing, connector limits, transformer loss, and fault studies remain outside the simplified twin.

## 9. Research-oriented 3D scene

The scene provides deterministic Perspective, Top, Front, and Side views; zoom; fit; reset; fullscreen; clean mode; and high-resolution export. Camera calculations and filenames are implemented in `src/lib/geometry/sceneResearch.ts`.

The export produces a 3840 x 2160 PNG with a research caption plus a JSON sidecar containing site, location, timezone, field, simulation time, camera view, equipment, geometry, capacity, solar position, footprint, fit state, and a modeled-image disclaimer. Browser HTML labels are not treated as permanent image metadata; the sidecar preserves context independently.

## 10. XLSX research export

After graph generation, `Export XLSX` creates a local browser workbook with:

1. Summary
2. Configuration
3. Daily Energy
4. Hourly Power
5. Hourly Weather
6. Electrical Topology
7. Model Formulas
8. Assumptions
9. Warnings
10. Provenance

Hourly weather contains GHI, DNI, DHI, temperature, relative humidity, cloud cover, wind, and precipitation. Hourly modeled power is retained for every requested day rather than only the selected display day.

The final dependency is `write-excel-file/browser`. ExcelJS was removed because its dependency chain introduced a vulnerable legacy UUID package.

## 11. PDF simulation report

`Download PDF report` creates a structured document containing report identity, site and period, PV and inverter configuration, topology, geometry, installed capacity, energy KPIs, specific yield, capacity factor, a vector chart, equations, provenance, assumptions, warnings, validation statement, headers, footers, and page numbers.

The PDF is the human-readable report; XLSX is the authoritative row-level export.

## 12. Export lifecycle

```text
Active configuration
  -> Open-Meteo range
  -> Land/Rooftop simulation per day
  -> daily energy + complete hourly power + complete weather
  -> visible graph
  -> XLSX/PDF export
```

Changing configuration invalidates graph and export state, ensuring regenerated artifacts correspond to the active configuration.

## 13. Verification evidence

The targeted Phase 9G checkpoint passed eight test files and sixteen tests covering camera utilities, field footprint, transparency, configuration integrity, power-series integration, CSV, manifests, topology, and export helpers. TypeScript, ESLint, and `git diff --check` passed.

Final closure additionally requires:

```bash
npm run verify
npm audit --omit=dev
```

The closure process must stop before commit if typecheck, lint, tests, build, diff validation, or production audit fails.

## 14. Manual acceptance

- Generate one-day, historical, and forecast graphs.
- Confirm changing capacity changes results and clears old data.
- Open XLSX in Excel or LibreOffice and inspect all ten sheets.
- Confirm row counts, totals, topology, formulas, and provenance.
- Inspect PDF identity, KPIs, chart, pagination, and disclaimer.
- Test all camera views, zoom, fit, reset, fullscreen, and clean mode.
- Inspect the 4K PNG and JSON metadata.

## 15. Scientific limitations

Phase 9G does not establish agreement with a physical plant, PVlib, or Simulink. Open-Meteo inputs are modeled/reanalysis/forecast data rather than site measurements. The 82% efficiency remains an aggregate loss factor, thermal behavior is simplified, and some electrical checks require design temperatures.

The appropriate description is:

> A transparent, reproducible agrivoltaic digital-twin research platform with preliminary modeled outputs and external validation interfaces.

It is not yet an unqualified publication-ready physical-plant model.

## 16. Phase 10 continuation

Recommended branch: `feature/phase-10-measured-data-foundation`.

### Phase 10A: measured-data ingestion

Preserve immutable raw CSV; validate timestamps, timezones, and units; map irradiance, weather, DC/AC power, and module temperature; add missing/outlier flags, fingerprints, and provenance.

### Phase 10B: synchronization and preprocessing

Create a common time base, one-minute to 15-minute resampling, variable-specific aggregation, missing-data policy, interpolation limits, quality flags, and synchronized measured/Open-Meteo datasets.

### Phase 10C: independent PVlib validation

Independently implement solar position, decomposition where needed, transposition, IAM, temperature, module DC, inverter AC, clipping, and energy.

### Phase 10D: Simulink validation

Create topology-consistent PV array, MPPT, inverter, grid/load boundary, weather import, and synchronized result export.

### Phase 10E: statistical validation

Calculate MBE, MAE, RMSE, normalized RMSE, MAPE, R-squared, energy bias, and peak error for AgriTwin, PVlib, Simulink, and measured-data comparisons.

### Phase 10F: calibrated loss budget

Add auditable soiling, mismatch, DC wiring, inverter, AC wiring, transformer, availability, degradation, shading, clipping, and curtailment losses while retaining legacy aggregate-efficiency compatibility.

### Phase 10G: uncertainty and publication evidence

Add input/parameter uncertainty, confidence intervals, seasonal validation, sensitivity, residual/parity plots, experiment manifests, and code/model/dataset fingerprints.

## 17. Publication-readiness criteria

Publication-level accuracy claims require valid geometry and topology, design temperatures, synchronized measurements, independent PVlib and Simulink execution, declared metric thresholds, calibrated losses, quantified uncertainty, fingerprinted artifacts, reproducible figures, and preserved experiment manifests.

## 18. Closure statement

Phase 9G completes the validation-export and scientific-transparency extension of Phase 9. AgriTwin now provides configuration-safe power series, visible equations and parameters, physical warnings, validation contracts, topology exchange, complete weather/power retention, XLSX datasets, PDF reports, deterministic scene views, fullscreen presentation, 4K snapshots, JSON metadata, and explicit validation limitations.

Phase 10 must focus on measured-data ingestion, independent model execution, statistical validation, calibration, and uncertainty quantification.
