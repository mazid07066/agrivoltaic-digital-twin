# AgriTwin Phase 9M — Feni Measured-Weather Integration Closure

## Purpose

Phase 9M adds an exclusive measured-weather pathway to the Land and Rooftop
power-series workflow while preserving the existing Open-Meteo pathway. It is
an environmental-input extension, not a claim that the PV model has been
validated against measured electrical output.

## Source evidence

| Item | Value |
|---|---|
| Publisher | World Bank Group / ESMAP |
| Station | BDFE2, Feni |
| Coordinates | 22.80029° N, 91.35819° E |
| Elevation | 5 m |
| License | CC BY 4.0 |
| Source resolution | 1 minute |
| Source rows | 1,216,800 |
| Source timezone | UTC |
| Source SHA-256 | `39a7697322612ff98e4e7a3454e3e8bd4eb206e53417973b73845394ec07d3c1` |

The original file is approximately 404 MiB and remains immutable outside Git.
The deployed derivative is approximately 3.5 MiB with 20,280 hourly records.

## Canonical transformation

Each timestamp is interpreted as UTC and converted to Asia/Dhaka before an
hourly group is chosen:

\[
t_{BST}=t_{UTC}+6\ \text{hours}
\]

For GHI, DNI, DHI, ambient temperature, relative humidity, wind speed and
pressure, the hourly value is the arithmetic mean of valid source minutes:

\[
\bar{x}_h=\frac{1}{n_h}\sum_{i=1}^{n_h}x_i
\]

Precipitation is summed:

\[
P_h=\sum_{i=1}^{n_h}P_i
\]

Wind direction uses the circular mean:

\[
\theta_h=\operatorname{atan2}\left(\sum_i\sin\theta_i,\sum_i\cos\theta_i\right)
\]

No cloud-cover measurement exists. The canonical value is null/N/A and is not
replaced by an Open-Meteo value. No interpolation is performed by Phase 9M.

## Runtime architecture

1. `scripts/prepare_feni_hourly.py` verifies the raw checksum and creates the
   canonical CSV and manifest.
2. `feniMeasuredRange.server.ts` loads and caches the compact derivative in a
   server-only API execution path.
3. `/api/weather-range` branches on an explicit provider parameter.
4. `PowerOutputTimeSeries` sends either `open_meteo` or `feni_measured` for the
   complete request. The providers cannot be combined within an execution.
5. The unchanged Land/Rooftop physics engine consumes the normalized 24-hour
   `WeatherResponse` contract.
6. XLSX/PDF exports preserve provider, station, dataset, quality and spatial
   application classification.

## Coverage and quality gates

| Gate | Enforcement |
|---|---|
| Complete local-day start | 2017-06-09 |
| Complete local-day end | 2019-09-30 |
| Required hours/day | Exactly 24 |
| Invalid irradiance outage | 2017-07-07 and 2017-07-08 rejected |
| Partial hours | Allowed with explicit warning and valid-minute counts |
| Missing cloud cover | Null/N/A; never zero-filled for reporting |
| Out-of-range request | HTTP 422 with a non-retryable explanation |

The raw audit found 20,241 complete hourly rows, 23 partial rows and 16 invalid
rows. The 16 invalid rows form the continuous DNI/DHI outage described above.

## Spatial validity

The measured series represents Feni BDFE2. When configured site coordinates
are not within 0.01° of the station, the run is labeled `spatial_transfer` and
the UI/export warns that it is not co-located validation. This prevents a
Jamalpur, Dhaka or other site run from being reported as though its weather had
been measured at that site.

## Open-Meteo compatibility mapping

| AgriTwin input | Feni source | Aggregation | Runtime value |
|---|---|---|---|
| GHI | `GHI_ThPyra1_Wm-2_avg` | Mean | W/m² |
| DNI | `DNI_ThPyrh1_Wm-2_avg` | Mean | W/m² |
| DHI | `DHI_ThPyra2_Wm-2_avg` | Mean | W/m² |
| Temperature | `Temp_ThHyg1_degC_avg` | Mean | °C |
| Relative humidity | `RH_ThHyg1_per100_avg` | Mean | % |
| Wind speed | `WindSpeed_Anemo1_ms_avg` | Mean | m/s |
| Precipitation | `Precip_Pluvio1_mm_sum` | Sum | mm/hour |
| Pressure | `Pres_Logger1_hPa_avg` | Mean | hPa |
| Wind direction | `WindDir_Wvane1_deg_avg360` | Circular mean | degrees |
| Cloud cover | Not measured | None | null/N/A |

Instrument temperatures, duplicate anemometer channels, reference-cell GTI,
service-button data and raw QC flag columns are not required by the current PV
weather contract. They remain in the immutable source for future validation
work and are not falsely presented as Open-Meteo-equivalent inputs.

## Verification requirements

Closure requires:

```bash
git diff --check
npm run verify
npm audit --omit=dev
```

Automated coverage includes timezone-aware daily normalization, provider
forwarding, source isolation, cloud-cover null handling, coverage bounds,
irradiance-outage rejection, spatial-transfer classification, existing power
series regression tests, TypeScript, ESLint and the production build.

## Scientific limitation

Phase 9M makes measured environmental inputs available to the digital twin.
It does not create measured DC/AC power, module-temperature or crop-response
observations. Therefore, PV-model accuracy, loss calibration and agronomic
validation remain separate research tasks.
