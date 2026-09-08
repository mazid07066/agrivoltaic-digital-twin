# Feni measured-data pipeline

The AgriTwin Feni research-data pipeline provides deterministic
Raw -> Bronze -> Silver -> Gold processing for the World Bank/ESMAP
BDFE2 measurement dataset.

No model training is performed in this pipeline.

## Phase 10 — Raw / Bronze / Silver

`feni_pipeline.py` provides the Phase 10 streaming ETL and
quality-audit implementation.

It:

- verifies the controlled source file size and SHA-256 checksum;
- preserves original measurements and QC flags in Bronze;
- emits canonical Silver records with UTC timestamps;
- preserves Asia/Dhaka display timestamps;
- preserves normalized units;
- decodes QC components;
- records valid, flagged, invalid and missing states;
- preserves source-row identity;
- detects malformed rows, duplicates, ordering errors and gaps;
- produces deterministic quality reports.

Large Bronze and Silver JSONL artifacts remain local and must not be
committed to Git.

## Phase 11 — Gold synchronization foundation

`gold_pipeline.py` implements the reproducible Phase 11 Gold-data
foundation.

### Measurement aggregation

The one-minute Silver measurements may be aggregated to:

- 15-minute Gold measurement buckets; and
- hourly Gold measurement buckets.

Hourly aggregation is performed directly from one-minute Silver data,
not by averaging already-aggregated 15-minute values.

Variable-specific aggregation rules are preserved:

- arithmetic mean for scalar continuous variables;
- sum for precipitation;
- circular mean for wind direction.

Every aggregation retains:

- expected sample count;
- observed sample count;
- usable sample count;
- coverage ratio;
- usable ratio;
- valid / flagged / invalid / missing QC counts;
- interpolation count.

Flagged numeric observations remain distinguishable in QC metadata.
Invalid and missing observations are never silently treated as valid.

### Timestamp policy

Gold processing uses canonical absolute UTC timestamps.

Silver timestamps must:

- be timezone-aware;
- resolve to UTC;
- lie exactly on the one-minute grid.

Hourly provider timestamps must:

- be timezone-aware;
- resolve to UTC;
- lie exactly on the hourly grid.

Duplicate absolute timestamps are rejected.

No timestamp rounding, shifting or nearest-neighbour matching is
performed.

### Provider artifact and provenance

Phase 11 defines a deterministic hourly provider artifact and manifest
contract suitable for Open-Meteo historical data.

Provider metadata records:

- provider identity;
- provider model when available;
- requested coordinate;
- resolved coordinate when available;
- elevation when available;
- UTC time range;
- interval;
- request fingerprint;
- source-identity fingerprint;
- provider-artifact fingerprint;
- provider-manifest fingerprint.

The provider artifact layer is deterministic and contains no model
training.

### Exact synchronization

Measured and provider hourly records are synchronized using:

`exact_utc_timestamp_intersection`

Only timestamps that occur exactly in both datasets are included.

Different source ranges are allowed.

Unmatched hours are counted but not fabricated.

No:

- interpolation;
- extrapolation;
- automatic resampling;
- timestamp rounding;
- timestamp shifting;
- nearest-neighbour matching

is performed by synchronization.

### Canonical synchronized Gold rows

The synchronized Gold schema preserves independent measured and provider
values.

Measured values retain:

- QC counts;
- expected samples;
- observed samples;
- usable samples;
- coverage;
- aggregation method;
- interpolation state.

Unavailable values remain explicitly unavailable.

### Cleaning and interpolation policy

Interpolation is disabled by default.

When deliberately enabled, only approved continuous variables may use
bounded linear interpolation.

Current policy:

- internal gaps only;
- no edge extrapolation;
- no interpolation across missing timestamp intervals;
- no interpolation beyond the configured gap limit;
- no chaining from interpolated boundary values;
- every interpolation is explicitly marked;
- interpolation method and boundary timestamps are recorded.

Irradiance, precipitation, wind direction and other non-approved
variables are not silently interpolated.

### Feature engineering

Phase 11 provides deterministic causal feature generation.

Features include:

- UTC hour;
- Asia/Dhaka local hour;
- local day of year;
- cyclical hour features;
- cyclical day-of-year features;
- deterministic solar-position features;
- lag features;
- trailing rolling mean;
- trailing rolling minimum;
- trailing rolling maximum;
- trailing rolling standard deviation.

Default lag horizons:

- 1 hour;
- 3 hours;
- 6 hours;
- 24 hours.

Default trailing rolling windows:

- 3 hours;
- 6 hours;
- 24 hours.

All lags use strictly earlier observations.

Rolling windows are trailing only.

Centred windows and future observations are prohibited.

### Chronological splits

Phase 11 defines deterministic contiguous chronological partitions for
future supervised research preparation.

Default fractions:

- train: 70%;
- validation: 15%;
- test: 15%.

Rows are never shuffled.

The split contract records that:

- splits are chronological;
- randomization is disabled;
- future leakage is prohibited;
- no model training is performed.

### Gold manifest and fingerprints

The final Gold manifest binds:

- measurement-source identity;
- provider manifest;
- synchronization policy;
- cleaning policy;
- feature policy;
- split policy;
- synchronized Gold rows;
- site identity;
- temporal coverage.

Changes to either data rows or scientific policies change the Gold
fingerprint.

The manifest explicitly records:

- interpolation must be explicit;
- extrapolation is prohibited;
- nearest-neighbour timestamp matching is prohibited;
- timestamp rounding is prohibited;
- silent resampling is prohibited;
- random temporal splitting is prohibited;
- future feature leakage is prohibited;
- model training was not performed;
- empirical plant-output validation was not performed.

## Scientific boundary

Phase 11 prepares synchronized environmental data for later research.

It does not:

- train a final machine-learning model;
- calibrate the AgriTwin PV engine;
- validate PV DC output against plant measurements;
- validate AC output against plant measurements;
- validate crop output;
- establish complete digital-twin empirical validation.

Feni measurements remain environmental observations from BDFE2.
Application to another location remains spatial transfer unless
co-located measurements exist.
