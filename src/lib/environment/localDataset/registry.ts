import type {
  LocalEnvironmentalDatasetDefinition,
} from "./types";

export const LOCAL_ENVIRONMENT_DATASETS:
  LocalEnvironmentalDatasetDefinition[] =
  [
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
