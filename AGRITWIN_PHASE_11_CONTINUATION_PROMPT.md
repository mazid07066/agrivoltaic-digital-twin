# AgriTwin Phase 11 Continuation Prompt

Continue development of AgriTwin from the completed and verified
Phase 10 measured-data foundation.

## Project identity

Project:

AgriTwin — Weather-, Sensor- and Geometry-Aware Digital Twin for
Agrivoltaic Land and Rooftop Systems

Repository:

`~/Projects/agrivoltaic-digital-twin`

GitHub:

`mazid07066/agrivoltaic-digital-twin`

Completed Phase 10 branch:

`feature/phase-10-measured-data-foundation`

Verified Phase 10 commit:

`cf2ca91 feat(measurements): complete Phase 10 Feni data foundation`

Recommended Phase 11 branch:

`feature/phase-11-feni-gold-synchronization`

Inspect the actual repository before assuming that `cf2ca91` remains
the latest commit.

## Required Phase 10 documents

Read these files completely before changing code:

- `AGRITWIN_PHASE_10_COMPLETION.md`
- `AGRITWIN_PHASE_9_CLOSURE_AND_FUTURE_ROADMAP.md`
- `data/measured/world-bank-esmap-feni/README.md`
- `data/measured/world-bank-esmap-feni/manifest.json`
- `data/measured/world-bank-esmap-feni/reports/data-quality-report.json`
- `docs/datasets/world-bank-esmap-feni.md`
- `research/data_pipeline/README.md`
- `research/data_pipeline/feni_pipeline.py`
- `src/lib/measurements/contracts.ts`
- `src/lib/measurements/feni.ts`
- `src/lib/measurements/registry.ts`
- `src/lib/environment/types.ts`

## Verified Phase 10 baseline

Phase 10 established:

- official World Bank/ESMAP dataset identity;
- official Feni station BDFE2;
- coordinates `22.80029, 91.35819`;
- elevation 5 m;
- source timezone UTC;
- official sensor identities;
- CC BY 4.0 attribution;
- immutable acquisition manifest;
- source file size and SHA-256;
- Raw/Bronze/Silver contracts;
- deterministic streaming Python ETL;
- UTC and Asia/Dhaka timestamps;
- original and normalized units;
- raw and decoded QC flags;
- missing-value reasons;
- valid, flagged, invalid and missing classifications;
- source-row provenance;
- malformed-row detection;
- duplicate and ordering detection;
- daily and monthly coverage;
- deterministic quality report;
- Feni validation-site registry;
- EnvironmentalDataset compatibility;
- explicit Feni-validation/Dhaka-spatial-transfer separation.

Controlled QC source:

- path: `data/environment/solar-mem-data.csv`;
- size: 423,310,809 bytes;
- SHA-256:
  `39a7697322612ff98e4e7a3454e3e8bd4eb206e53417973b73845394ec07d3c1`;
- records: 1,216,800;
- period: 2017-06-08 through 2019-09-30 UTC;
- resolution: one minute;
- rejected rows: 0;
- duplicate timestamps: 0;
- missing timestamps: 0;
- temporal coverage: 100%.

Final Phase 10 verification:

- 5 Python acceptance tests passed;
- 68 Vitest files passed;
- 274 Vitest tests passed;
- TypeScript passed;
- ESLint passed;
- production build passed;
- deterministic report passed;
- Phase 10 branch was pushed to origin.

## Phase 11 objective

Phase 11 will build the synchronized and reproducibly fingerprinted
Gold-data foundation needed for later supervised environmental
reconstruction.

Do not train final ML models during Phase 11.

## Phase 11 sequence

### Phase 11A — Read-only inspection

Before making changes:

1. inspect the branch and working tree;
2. inspect local and remote HEAD;
3. inspect recent commits;
4. inspect all Phase 10 artifacts;
5. inspect the Python runtime and environment files;
6. inspect existing Open-Meteo clients and contracts;
7. inspect provenance and fingerprint modules;
8. inspect ignore and large-data conventions;
9. inspect existing tests.

Do not create the Phase 11 branch until the Phase 10 checkpoint is
confirmed.

### Phase 11B — Reproducible Python environment

Create a minimal pinned Python environment for data processing and
testing.

Inspect the actual Python installation first.

Do not introduce TensorFlow, PyTorch or other heavy ML frameworks.

### Phase 11C — Historical provider manifest

Acquire consistent historical environmental data for the exact Feni
coordinates.

Record:

- API endpoint;
- selected historical/reanalysis model;
- requested coordinates;
- provider grid coordinates;
- provider elevation;
- requested variables;
- requested period;
- native temporal resolution;
- units;
- retrieval time;
- request fingerprint;
- response checksum;
- provider/model identity;
- licence and citation.

Do not silently combine historical models.

Use “historical reconstruction,” not “forecast.”

### Phase 11D — Resolution policy

The measured source is one-minute data and should be aggregated to
15-minute measurements.

Verify the historical provider’s native resolution before alignment.

If Open-Meteo historical values are hourly:

- retain their native hourly identity;
- do not fabricate independent 15-minute reanalysis observations;
- document the alignment strategy;
- consider parallel 15-minute measurement and hourly synchronized
  products;
- test timestamp boundaries explicitly.

### Phase 11E — Measurement aggregation

Use variable-specific aggregation:

- GHI/DNI/DHI: mean and valid-sample ratio;
- temperature: mean and justified extrema;
- relative humidity: mean;
- pressure: mean;
- wind speed: mean and available maximum;
- wind direction: circular/vector aggregation;
- precipitation: sum;
- QC: retain valid, flagged, invalid and missing counts.

Do not invent a minimum valid-sample threshold. Select, document and
test any threshold before applying it.

### Phase 11F — Cleaning

Preserve separately:

- original measurement;
- QC-classified measurement;
- cleaned measurement;
- interpolation status;
- missing reason.

Do not overwrite original values.

Permit interpolation only for explicitly bounded short gaps. Long gaps
must remain missing.

### Phase 11G — UTC synchronization

Synchronize measurement and provider records by UTC.

Report:

- matched timestamps;
- unmatched timestamps;
- provider gaps;
- measurement-valid ratios;
- usable target rows;
- excluded rows and reasons;
- temporal offsets.

Prevent timezone and off-by-one-hour errors.

### Phase 11H — Feature engineering

Subject to scientific verification, implement:

- solar elevation and zenith;
- extraterrestrial irradiance;
- clearness index;
- hour sine/cosine;
- day-of-year sine/cosine;
- annual-cycle features;
- daylight and seasonal indicators;
- lag features;
- rolling mean/min/max/standard deviation;
- precipitation accumulations;
- temperature/RH interactions.

All lag and rolling features must be causal.

### Phase 11I — Chronological splits

Create chronological train, validation and test definitions.

Do not randomly split rows.

Test against:

- future-looking lag features;
- centred rolling windows;
- interpolation crossing split boundaries;
- duplicate timestamps across splits;
- scaler/statistic leakage;
- invalid split ordering.

Phase 11 creates split definitions but does not train final models.

### Phase 11J — Gold manifest and fingerprint

The Gold dataset identity must preserve:

- station identity;
- measurement source checksum;
- provider request fingerprint;
- provider response checksum;
- native source resolutions;
- aggregation policy;
- cleaning policy;
- interpolation policy;
- feature version;
- split version;
- code commit;
- row counts and coverage;
- source classification for every field;
- deterministic Gold fingerprint.

Large generated artifacts must remain outside normal Git.

Commit only manifests, contracts, reports, fingerprints, documentation
and small fixtures.

## Scientific boundaries

Feni measurements validate the environmental layer at Feni.

They do not validate:

- PV DC output;
- inverter AC output;
- energy yield;
- clipping;
- crop DLI;
- crop yield;
- the complete digital twin.

Application to Dhaka is spatial transfer.

Never label reanalysis, interpolated, cleaned or corrected values as
measured observations.

## Non-negotiable architecture rules

Do not:

- rewrite Git history;
- merge to `main` unless instructed;
- replace the Phase 7B simulation engine;
- bypass `EnvironmentalDataset`;
- mutate immutable site versions;
- alter completed simulation runs;
- discard QC flags;
- fabricate measurements;
- treat flagged values as valid silently;
- present Feni validation as Dhaka validation;
- call historical reconstruction a forecast;
- train final ML models in Phase 11;
- commit large generated datasets blindly;
- expose `.env` files or secrets;
- commit or push before verification and approval.

Preserve:

- source checksums;
- environmental provenance;
- request and dataset fingerprints;
- execution fingerprints;
- source classification;
- Land and Rooftop regression behaviour;
- equipment and engine identity;
- scenario immutability.

## Phase 11 acceptance gate

Phase 11 is complete only when:

- the provider/model is explicit;
- source checksums exist;
- aggregation is deterministic;
- native resolutions are preserved;
- synchronization is UTC-safe;
- QC and valid-sample ratios are retained;
- original and cleaned values remain separate;
- interpolation is bounded and auditable;
- long gaps remain missing;
- features are reproducible and causal;
- chronological splits contain no leakage;
- Gold manifest and fingerprint exist;
- no final model training occurred;
- `git diff --check` passes;
- Python tests pass;
- TypeScript passes;
- lint passes;
- the full Vitest suite passes;
- production build passes;
- Phase 11 completion Markdown exists;
- commit and push occur only after explicit approval.

## Development interaction rules

Work checkpoint by checkpoint.

For every checkpoint:

1. explain what is being inspected or changed;
2. provide one complete terminal command block;
3. state “Copy only this block”;
4. keep prose outside the command block;
5. do not use `exit` directly in the interactive terminal;
6. leave the terminal open;
7. wait for complete output;
8. inspect the output before continuing;
9. do not assume success;
10. do not commit or push without explicit approval.

Use `grep`, `find`, `sed`, `awk` or Python because `rg` may not be
installed.

## Required first response in the new chat

Do not implement Phase 11 immediately.

First:

- acknowledge the verified Phase 10 checkpoint;
- state that Phase 11 builds the synchronized Gold-data foundation;
- provide one read-only Xubuntu-compatible inspection command;
- inspect branch, status, recent commits, local/remote Phase 10 HEAD,
  Phase 10 documents, manifest, quality report, ETL, Python environment,
  Open-Meteo modules, ignore conventions and relevant tests;
- do not create a branch;
- do not download data;
- do not modify files;
- do not run destructive commands;
- leave the terminal open;
- request the complete inspection output.
