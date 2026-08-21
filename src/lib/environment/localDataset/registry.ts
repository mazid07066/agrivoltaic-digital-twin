import type {
  LocalEnvironmentalDatasetDefinition,
} from "./types";

export const LOCAL_ENVIRONMENT_DATASETS:
  LocalEnvironmentalDatasetDefinition[] =
  [

    {
      id:
        "phase9d-rice-study-20260820",

      name:
        "Phase 9D Rice AV Frozen Weather — 20 August 2026",

      description:
        "Frozen 24-hour environmental evidence derived from the corrected Phase 9D reference execution for controlled scenario comparison, MCDA, Pareto, sensitivity, and reproducibility verification.",

      filename:
        "phase9d-rice-study-20260820.csv",

      format:
        "csv",

      parser:
        "standard_csv",

      timezone:
        "Asia/Dhaka",

      mode:
        "dataset",

      columnMap: {
        timestamp:
          "timestamp",

        ghi:
          "ghi_wm2",

        dni:
          "dni_wm2",

        dhi:
          "dhi_wm2",

        temperature:
          "temperature_c",

        relativeHumidity:
          "relative_humidity_pct",

        cloudCover:
          "cloud_cover_pct",

        windSpeed:
          "wind_speed_ms",

        windDirection:
          "wind_direction_deg",

        precipitation:
          "precipitation_mm",

        pressure:
          "pressure_hpa",

        et0:
          "et0_mm",
      },

      units: {
        ghi:
          "W/m2",

        dni:
          "W/m2",

        dhi:
          "W/m2",

        temperature:
          "C",

        relativeHumidity:
          "%",

        cloudCover:
          "%",

        windSpeed:
          "m/s",

        windDirection:
          "degree",

        precipitation:
          "mm",

        pressure:
          "hPa",

        et0:
          "mm",
      },

      metadata: {
        temporalResolution:
          "1 hour",

        normalizedResolution:
          "1 hour",

        frozenEvidence:
          true,

        referenceRunId:
          "6cb8ccd5-3738-4f94-b3d4-5f617da0a9ba",

        originalSource:
          "open_meteo",

        studyDate:
          "2026-08-20",

        localOnly:
          true,
      },
    },

    {
      id:
        "solar-mem-data-v1",

      name:
        "Solar-MEM Measurement Dataset",

      description:
        "High-resolution measured solar and meteorological observations normalized by AgriTwin from one-minute logger records to hourly environmental records.",

      filename:
        "solar-mem-data.csv",

      format:
        "csv",

      parser:
        "solar_mem",

      timezone:
        "Asia/Dhaka",

      mode:
        "dataset",

      /*
       * Solar-MEM uses a metadata/header format
       * handled by the dedicated parser. These
       * mappings document the principal variables.
       */
      columnMap: {
        timestamp:
          "JulianTime",

        ghi:
          "GHI_ThPyra1_Wm-2_avg",

        dni:
          "DNI_ThPyrh1_Wm-2_avg",

        dhi:
          "DHI_ThPyra2_Wm-2_avg",

        temperature:
          null,

        relativeHumidity:
          "RH_ThHyg1_per100_avg",

        cloudCover:
          null,

        windSpeed:
          null,

        windDirection:
          null,

        precipitation:
          "Precip_Pluvio1_mm_sum",

        pressure:
          "Pres_Logger1_hPa_avg",

        et0:
          null,
      },

      units: {
        ghi:
          "W/m2",

        dni:
          "W/m2",

        dhi:
          "W/m2",

        temperature:
          "C",

        relativeHumidity:
          "%",

        windSpeed:
          "m/s",

        windDirection:
          "degree",

        precipitation:
          "mm",

        pressure:
          "hPa",
      },

      metadata: {
        temporalResolution:
          "1 minute",

        normalizedResolution:
          "1 hour",

        missingValueMarkers: [
          "NaN",
          "1e+20",
        ],

        localOnly:
          true,
      },
    },
  ];

export function getLocalEnvironmentDatasetDefinition(
  id: string,
): LocalEnvironmentalDatasetDefinition | null {
  return (
    LOCAL_ENVIRONMENT_DATASETS.find(
      (dataset) =>
        dataset.id === id,
    ) ??
    null
  );
}
