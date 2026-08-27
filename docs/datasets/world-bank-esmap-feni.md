# World Bank/ESMAP Feni measurement dataset

## Identity

- Dataset: Bangladesh - Solar Radiation Measurement Data
- Publisher: World Bank Group / ESMAP
- Station: BDFE2 (Feni)
- Coordinates: 22.80029° N, 91.35819° E
- Elevation: 5 m
- Source timezone: UTC
- Resolution: one minute
- Coverage: 8 June 2017 through 30 September 2019
- Licence: Creative Commons Attribution 4.0
- Service provider: Suntrace GmbH

## Processing

Phase 10 preserves the official header, manifest, source checksum,
sensor metadata and QC meanings. The streaming pipeline implements Raw,
Bronze and Silver layers without loading the 423 MB file into browser
memory.

Bronze retains original strings, units and QC flags. Silver adds UTC and
Asia/Dhaka timestamps, normalized numeric values, decoded QC components,
quality status, missing reasons and source-row provenance.

Gold resampling and ML-ready synchronization are deferred to Phase 11.

## Scientific boundary

This dataset supports environmental reconstruction validation at Feni.
It does not validate PV DC power, inverter AC output, crop DLI, crop
yield or the complete digital twin. Use at Dhaka is spatial transfer and
must be labelled accordingly.
