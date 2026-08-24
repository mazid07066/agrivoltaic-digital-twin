# AgriTwin Phase 9 Completion Record

## Status

Phase 9 is complete.

Completion branch:

`feature/phase-9-mcda-data-analytics`

Phase 9 delivers a reproducible scenario, analytics,
environmental-data, equipment-selection, electrical
balance-of-system and historical/forecast power-series
platform without modifying the validated Phase 7B land or
Phase 8C rooftop scientific engines.

## Phase 9A — MCDA and decision analytics

Completed capabilities include:

- Multi-criteria decision analysis.
- Weight normalization and validation.
- Sensitivity and robustness analysis.
- Pareto-front identification.
- Baseline comparisons.
- Policy evaluation.
- Multi-run and study analytics.
- Compatibility checking across study runs.

## Phase 9B — Environmental data

Completed capabilities include:

- Open-Meteo integration.
- Historical and forecast environmental requests.
- Local uploaded datasets.
- Environmental normalization and quality checks.
- Geography and timezone handling.
- Environmental provenance and fingerprints.
- Scenario weather resolution.

## Phase 9C — Scenario execution

Completed capabilities include:

- Typed scenario contracts and validation.
- Land and rooftop execution adapters.
- Immutable resolved execution inputs.
- Scenario technical overrides.
- Scientific-effect regression tests.
- Execution identity and fingerprints.
- Deterministic reproducibility.

## Phase 9D — Persistence and analytics integration

Completed capabilities include:

- Simulation-run persistence mapping.
- Hourly result persistence.
- Run retrieval and comparisons.
- Study compatibility analysis.
- Analytics API routes.
- Historical run compatibility.

## Phase 9E — Electrical balance of system

Completed capabilities include:

- PV module and inverter catalogue selection.
- Inverter specification modelling.
- Inverter quantity and plant-equivalent capacity.
- Explicit modules-per-string configuration.
- Explicit total strings-per-inverter configuration.
- Per-inverter MPPT allocation.
- Designed and demonstration DC inputs.
- Temperature-adjusted operating string voltage.
- Operating-current and short-circuit-current separation.
- Bifacial current factors.
- Hard absolute-voltage safety checks.
- Advisory temperature-adjusted MPPT-window checks.
- Inverter loading-ratio assessment.
- Installed-versus-required module reporting.
- Installed-versus-configured plant STC power.
- Multi-inverter repeated topology.
- AC conversion and three-phase electrical outputs.
- Grid import, grid export and feeder distribution.
- Electrical telemetry-provider contracts.
- Electrical provenance and persistence.
- Land and rooftop electrical BOS displays.

Verified chosen topology:

- 17 modules per string.
- 7 strings per inverter.
- 6 MPPT channels per inverter.
- MPPT allocation `[2, 1, 1, 1, 1, 1]`.
- Repeated independently for every inverter.
- 119 modules required per inverter block.

## Phase 9F — Power history and forecast

Completed capabilities include:

- One-day hourly PV-power graph.
- Custom date-range daily-energy graph.
- Current-date selection.
- Configured-date selection.
- Historical date selection.
- Historical-to-current ranges.
- Past-to-past ranges.
- Recent-to-future forecast ranges.
- Historical-to-future mixed ranges.
- Open-Meteo historical coverage from 1940.
- Forecast boundary validation.
- Historical, forecast and mixed provenance labels.
- Thirty-one-day client request batching.
- Exactly 24 normalized local hourly records per day.
- Land-engine daily power-series calculation.
- Rooftop-engine daily power-series calculation.
- Total energy, daily average and peak summaries.
- Retryable upstream-network errors.
- IPv4-capable server transport for Linux/Node environments.
- Existing dashboard outputs retained unchanged.

## Verification gates

Phase 9 closure requires and has automated coverage for:

- TypeScript.
- ESLint.
- Vitest.
- Next.js production build.
- Existing scientific regression tests.
- Electrical topology regression tests.
- Weather range planning and normalization.
- Long-range request batching.
- Land and rooftop graph calculations.
- Retryable network failures.
- Live historical Open-Meteo data.
- Live current Open-Meteo data.
- Live future Open-Meteo forecasts.
- Mixed historical/forecast ranges.
- Unavailable future-date rejection.

## Scientific boundaries

- Historical and forecast values are weather-model inputs,
  not on-site measurements.
- Forecast data are limited to the active Open-Meteo
  forecast horizon.
- Temperature-adjusted MPPT-window results are advisory.
- Absolute maximum DC voltage and current limits remain hard
  engineering constraints.
- Inverter quantity does not create PV energy. Installed
  modules determine physical array power.
- Demonstration load profiles remain assumed until measured
  or scenario-configured load data are supplied.
- Field calibration remains necessary before operational
  control decisions.

## Next phase

Phase 10 will focus on persistent multi-day studies,
electrical energy-series analytics, saved comparisons and
CSV/JSON research exports.

## Final Land 3D physical-geometry correction

The final Phase 9 visualization checkpoint removed the
hard-coded 44 × 24 m Three.js ground and fixed camera.

The Land digital twin now:

- derives the displayed site from the configured field dimensions;
- preserves physical module size, row count and row spacing;
- calculates the complete array footprint;
- distinguishes the registered field from array overflow;
- reports the minimum recommended field dimensions;
- adapts crops, grid, lighting, camera and orbit limits;
- positions the electrical BOS outside the cultivation footprint;
- verifies the geometry through automated regression tests.

An oversized array is intentionally not compressed to fit the
scene because doing so would misrepresent the engineering design.
