# Phase 9M Feni measured-weather derivative

`feni-bdfe2-hourly-bst-v1.csv` is the runtime-safe hourly derivative of the
World Bank/ESMAP Bangladesh Solar Radiation Measurement Data resource for
station BDFE2 (Feni). The 404 MiB original source is intentionally not stored
in Git or deployed to Vercel.

Rebuild from an immutable local copy:

```bash
npm run data:feni -- /absolute/path/solar-measurements_bangladesh_feni_wb-esmap_qc.csv
```

The builder refuses any source whose SHA-256 is not:

```text
39a7697322612ff98e4e7a3454e3e8bd4eb206e53417973b73845394ec07d3c1
```

Transformation rules:

- parse the logger timestamps as UTC;
- convert every minute to Asia/Dhaka (UTC+06:00) before grouping;
- arithmetic mean for GHI, DNI, DHI, temperature, humidity, wind speed and pressure;
- sum precipitation;
- circular mean wind direction;
- retain valid-minute counts and quality state;
- keep cloud cover empty because the station dataset does not measure it;
- do not interpolate or fetch replacement data from Open-Meteo.

Complete Bangladesh local-day coverage is 2017-06-09 through 2019-09-30.
Requests containing 2017-07-07 or 2017-07-08 are rejected because the source
contains a continuous 16-hour DNI/DHI outage.

Source: World Bank Group / ESMAP, Bangladesh Solar Radiation Measurement Data.
License: Creative Commons Attribution 4.0 (CC BY 4.0).
