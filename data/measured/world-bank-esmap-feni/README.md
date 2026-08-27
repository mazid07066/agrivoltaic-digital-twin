# World Bank/ESMAP Feni measurements

This directory registers the World Bank/ESMAP quality-controlled
one-minute measurements from station BDFE2 in Feni, Bangladesh.

The 423 MB QC file remains in the existing local reproducible cache at
`data/environment/solar-mem-data.csv` and is excluded from Git. Its
identity is fixed by the SHA-256 value in `manifest.json`.

Only the small official schema/header resource is retained here. Large
raw, Bronze and Silver artifacts must remain outside Git. Generated
reports may be committed when they are deterministic and reasonably
sized.

## Scientific boundary

These observations validate the environmental reconstruction layer at
Feni. They do not validate PV power, inverter output, crop DLI, crop
yield or the complete digital twin. Application to Dhaka is spatial
transfer until Dhaka observations become available.

Phase 10 performs no model training.
