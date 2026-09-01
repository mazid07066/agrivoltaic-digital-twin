# AgriTwin Recent Work Update and Changelog

**Project:** AgriTwin — Weather-, Sensor- and Geometry-Aware Digital Twin for Agrivoltaic Land and Rooftop Systems  
**Update period:** Phase 9G through Phase 9M  
**Prepared:** 1 September 2026  
**Primary extension branch:** `feature/phase-9h-9l-physics-upgrade`

## 1. Executive work-update summary

The recent Phase 9 extensions transformed AgriTwin from a configuration-aware
PV digital twin into a more transparent research platform with explicit
optical, thermal, electrical and loss-model stages. The work added validation
exchange contracts, research exports, deterministic 3D capture, configurable
MPPT topology, bounded production weather requests and a measured-weather path
for the World Bank/ESMAP Feni BDFE2 station.

The existing Land and Rooftop capabilities, environmental abstraction,
immutable site versions and verified Phase 7B execution path were preserved.
Research/physics mode no longer applies the legacy aggregate system-efficiency
factor. Legacy parity remains available only as an isolated backward-compatible
mode.

Phase 9M introduced an explicit weather-provider choice:

- `open_meteo`: location-specific historical/reanalysis/forecast inputs;
- `feni_measured`: hourly measured inputs derived exclusively from Feni BDFE2.

The two sources are never blended or silently substituted. Use of Feni weather
at any other site is explicitly classified as `spatial_transfer`, not
co-located validation.

## 2. Completed work by extension

| Extension | Completed scope | Current outcome |
|---|---|---|
| Phase 9G | Validation exchange, scientific transparency, configuration-safe power series, XLSX/PDF exports, deterministic research views, fullscreen and 4K PNG/JSON scene export | Research artifacts preserve configuration, formulas, assumptions, topology and provenance |
| Phase 9H | Explicit efficiency and loss architecture | Physics mode uses named optical/DC/inverter/AC loss stages instead of aggregate efficiency |
| Phase 9I | Solar geometry, tracking/backtracking and Perez POA | Solar/tracker/irradiance calculations exposed through the physics engine and diagnostics |
| Phase 9J | IAM, row shading and crop/PV irradiance separation | Martin–Ruiz IAM, geometric shading and separated irradiance pathways integrated |
| Phase 9K | Faiman/PVsyst thermal modelling | Selectable thermal models and module-temperature diagnostics integrated |
| Phase 9L | Single-diode module, mismatch and dynamic MPPT | Module I–V representation, string/row mismatch, MPPT constraints and fitted inverter operation integrated |
| Production repair | Bounded weather-range networking and progress handling | Request deadlines, retry bounds, batching progress, cancellation and UI yielding added |
| Efficiency-state repair | Legacy-efficiency isolation and state migration | Blank/zero corruption prevented; physics mode disables aggregate efficiency; legacy values remain backward-compatible |
| Electrical topology extension | Editable MPPT allocation | Users can define allocations such as `1,1,1,1,1,2`; validation, execution, exports and tests use the selected allocation |
| Phase 9M | Feni measured-weather integration | UTC source converted to Asia/Dhaka before hourly aggregation; exclusive provider routing, quality gates, provenance and exports added |
| Phase 9M outage repair | Handling of unusable 7–8 July 2017 irradiance records | Multi-day runs omit the two invalid dates with explicit warnings; single-invalid-day requests still fail |

## 3. Phase 9H–9L physics architecture update

Physics/research mode now follows the explicit calculation boundary:

```text
Solar geometry
    → tracker/fixed orientation
    → Perez plane-of-array irradiance
    → IAM and geometric shading
    → soiling and optical losses
    → module thermal model
    → single-diode module operating point
    → row/string mismatch
    → string and MPPT operating constraints
    → fitted inverter conversion and clipping
    → AC wiring, transformer, auxiliary and availability losses
    → net delivered AC power
```

Major outcomes:

- aggregate `systemEfficiency` is disabled in physics mode;
- no blind reapplication of inverter efficiency;
- signed loss stages support gains such as module-quality tolerance;
- every loss stage preserves its source classification;
- energy-balance residuals are calculated and checked;
- the selected-hour loss waterfall is visible in the scientific panel;
- configuration and diagnostics are included in research exports;
- persisted physics configuration and version identifiers support reproducibility.

## 4. Electrical and MPPT topology update

The electrical path now supports a user-selected MPPT string-allocation vector.
For the 357-module reference plant:

```text
17 modules/string × 21 strings = 357 modules
```

A valid seven-string allocation per inverter can be entered as:

```text
1,1,1,1,1,2
```

or represented in a seven-entry presentation where required by an external
tool as:

```text
1,1,1,1,1,1,2
```

The application validates the selected structure against:

- available MPPT inputs;
- strings per MPPT;
- module allocation;
- MPPT operating current;
- MPPT short-circuit current;
- string voltage and inverter limits;
- total inverter DC current;
- selected module and inverter catalogue data.

The topology is propagated through Land/Rooftop execution, physics mode,
compatibility reporting and XLSX validation exports.

## 5. Production weather-range repair

The production freeze affecting long Open-Meteo ranges was addressed by:

- `force-dynamic` weather-range API execution;
- a bounded server execution duration;
- absolute upstream request deadlines;
- bounded retry attempts;
- browser-side request timeouts;
- abort propagation and a visible Cancel control;
- range batching;
- per-batch and per-day progress messages;
- yielding between physics simulations to keep the browser responsive;
- moving the power-series section after scientific configuration selection.

This repair was committed as:

```text
462c470 fix(weather): bound range requests and improve progress
```

## 6. Efficiency-state repair

The system-efficiency input previously remained visible and could persist as
zero when cleared. The repair:

- isolates aggregate efficiency to legacy parity mode;
- visibly disables it in physics/research mode;
- prevents a blank numeric field from becoming a persisted zero;
- migrates corrupt or invalid legacy values safely;
- retains backward compatibility for historical configurations;
- verifies that physics mode does not multiply explicit losses by aggregate
  efficiency.

Checkpoint:

```text
062804d fix(physics): isolate legacy system efficiency
```

## 7. Editable MPPT topology

The fixed/demonstration allocation was replaced with an editable allocation
path covering UI, validation, execution and exports.

Checkpoint:

```text
62fc231 feat(electrical): make MPPT topology configurable
```

Verification at that checkpoint recorded 77 test files and 298 passing tests,
followed by a successful production build.

## 8. Phase 9M measured-weather data update

### 8.1 Dataset identity

| Field | Value |
|---|---|
| Dataset | World Bank/ESMAP Bangladesh Solar Radiation Measurement Data |
| Station | BDFE2 (Feni) |
| Latitude | 22.80029° N |
| Longitude | 91.35819° E |
| Elevation | 5 m |
| Source timezone | UTC |
| Application timezone | Asia/Dhaka |
| Raw resolution | 1 minute |
| Raw rows | 1,216,800 |
| Raw size | 423,310,809 bytes |
| Raw SHA-256 | `39a7697322612ff98e4e7a3454e3e8bd4eb206e53417973b73845394ec07d3c1` |
| Licence | CC BY 4.0 |

### 8.2 Runtime preparation

The 404 MiB source remains immutable and outside Git/Vercel. A deterministic
builder verifies its checksum, converts every source minute from UTC to
Asia/Dhaka, then creates a deployable hourly derivative.

| Runtime artifact | Value |
|---|---|
| Hourly rows | 20,280 |
| Approximate size | 3.5 MiB |
| Complete hourly rows | 20,241 |
| Partial hourly rows | 23 |
| Invalid hourly rows | 16 |
| Complete local-day coverage | 2017-06-09 to 2019-09-30 |

Aggregation rules:

- arithmetic mean: GHI, DNI, DHI, temperature, relative humidity, wind speed
  and pressure;
- sum: precipitation;
- circular mean: wind direction;
- null/N/A: cloud cover, because it was not measured;
- no Open-Meteo replacement and no silent interpolation.

### 8.3 Exclusive provider routing

The power-series interface now requires one provider for the entire request.
Provider identity is carried through the API plan, simulation input, warnings,
XLSX/PDF provenance and the user interface.

When the configured site is not within the Feni station tolerance, the output
is labeled:

```text
spatial_transfer
```

It must not be reported as Feni validation of a Dhaka, Jamalpur or other plant.

## 9. Invalid irradiance-day repair

The Feni source has a continuous 16-hour period with no usable DNI/DHI spanning
7–8 July 2017. Rejecting an entire multi-year request because of these two days
was operationally excessive.

The corrected policy is:

| Request | Result |
|---|---|
| Multi-day range containing 2017-07-07/08 | Continue while excluding the two dates |
| Only 2017-07-07 or 2017-07-08 | Reject because no usable day remains |
| Other complete days | Process normally |

For the complete local coverage:

```text
Requested days: 844
Excluded days:    2
Usable days:    842
```

Excluded dates and reasons are preserved in warnings and export provenance.
The application does not fabricate DNI/DHI, interpolate the outage or borrow
Open-Meteo values.

## 10. Verification record

Latest verified Phase 9M outage-repair checkpoint:

| Verification | Result |
|---|---|
| TypeScript | Passed |
| ESLint | Passed |
| Vitest files | 78 passed |
| Vitest tests | 304 passed |
| Next.js production build | Passed |
| Production dependency audit | 0 vulnerabilities |
| Vercel output trace | Feni hourly derivative included |
| Patch application check | Passed |

The recurring Vite notice about ESM syntax in `vitest.config.ts` is a future
configuration-loader warning, not a failed test.

## 11. Key Git checkpoints

| Commit | Description |
|---|---|
| `6f820df` | Phase 9G validation/research export closure |
| `9b04a69` | Complete Phase 9H–9L physics upgrade |
| `faeb0ba` | Close final Phase 9 extension documentation |
| `462c470` | Bound weather requests and improve progress |
| `062804d` | Isolate legacy system efficiency |
| `482db6d` | Reject invalid Land simulation dates |
| `488b394` | Stabilize Land date input and field layout |
| `62fc231` | Make MPPT topology configurable |

The Phase 9M integration and invalid-day repair use guarded installer scripts
that create their commit hashes in the user's repository. Record those final
hashes here after the corresponding terminal runs; no hash is invented in this
document.

## 12. Current operational workflow

1. Configure the site, PV module, inverter, geometry and explicit physics
   assumptions.
2. Select Physics/Research mode for explicit loss modelling.
3. Confirm or edit the MPPT allocation.
4. Select exactly one weather provider.
5. For Feni co-located environmental reconstruction, use coordinates
   `22.80029, 91.35819`.
6. Select a valid measured range within 2017-06-09 to 2019-09-30.
7. Generate the graph; review exclusions, partial-hour warnings and spatial
   classification.
8. Export XLSX/PDF and retain the configuration, warnings and provenance.
9. Compare with PVlib/Simulink using matched configuration and timestamps.

## 13. Scientific status and remaining work

Completed software verification establishes implementation integrity and
reproducibility. It does not by itself establish physical-model accuracy.

Remaining research work includes:

- independent PVlib comparison using matched weather and parameters;
- Simulink comparison using matched topology and timestamp convention;
- measured DC/AC power ingestion;
- measured module-temperature validation;
- calibrated optical, thermal, DC and AC loss factors;
- statistical validation: MBE, MAE, RMSE, normalized RMSE, MAPE, R², energy
  bias and peak-power error;
- uncertainty and sensitivity analysis;
- chronological training/validation/test separation where later predictive
  work is introduced;
- publication-ready evidence with dataset, configuration, commit and model
  fingerprints.

Appropriate current research description:

> AgriTwin is a transparent and reproducible agrivoltaic digital-twin research
> platform with explicit physics, configurable electrical topology, modeled and
> measured environmental inputs, and independent-validation interfaces.

It must not yet be described as a fully validated physical plant model.

## 14. Update-log template for future entries

Use the following format for each subsequent change:

```text
Date:
Branch:
Commit:
Change category:
Problem addressed:
Files/modules changed:
Scientific or operational decision:
Backward-compatibility impact:
Data/provenance impact:
Tests added or changed:
Verification results:
Deployment result:
Known limitations:
Follow-up action:
```

