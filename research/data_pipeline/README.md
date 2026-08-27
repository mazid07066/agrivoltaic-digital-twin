# Feni measured-data pipeline

`feni_pipeline.py` is a Python-standard-library streaming ETL and
quality-audit command for the World Bank/ESMAP Feni QC dataset.

It validates the controlled file size and SHA-256 checksum before
processing. It preserves raw values and QC flags in the optional Bronze
layer and emits canonical UTC/Asia-Dhaka timestamps, normalized units,
QC components, validity status, missing reasons and source-row identity
in the optional Silver layer.

The normal Phase 10 audit generates only the deterministic quality
report. Large Bronze and Silver JSONL artifacts are local and ignored by
Git. Gold synchronization and 15-minute ML preparation are deferred to
Phase 11.

No model training is performed.
