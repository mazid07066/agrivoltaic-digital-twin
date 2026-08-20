import "server-only";

import {
  createReadStream,
} from "node:fs";

import {
  createInterface,
} from "node:readline";

import {
  assessEnvironmentalQuality,
} from "../quality";

import {
  hardenEnvironmentalProvenance,
} from "../provenance.server";

import type {
  EnvironmentalDataRequest,
} from "../request";

import type {
  EnvironmentalDataset,
  EnvironmentalHourlyPoint,
} from "../types";

import {
  normalizeNumericValue,
} from "./normalize";

import {
  resolveLocalDatasetPath,
} from "./path.server";

import type {
  LocalEnvironmentalDatasetDefinition,
} from "./types";

interface SolarMemColumnIndexes {
  timestamp: number;

  ghi: number | null;
  dni: number | null;
  dhi: number | null;

  temperature: number | null;
  relativeHumidity: number | null;

  windSpeed: number | null;
  windDirection: number | null;

  precipitation: number | null;
  pressure: number | null;
}

interface HourAccumulator {
  timestamp: string;

  ghiSum: number;
  ghiCount: number;

  dniSum: number;
  dniCount: number;

  dhiSum: number;
  dhiCount: number;

  temperatureSum: number;
  temperatureCount: number;

  humiditySum: number;
  humidityCount: number;

  pressureSum: number;
  pressureCount: number;

  windSpeedSum: number;
  windSpeedCount: number;

  windSinSum: number;
  windCosSum: number;
  windDirectionCount: number;

  precipitationSum: number;

  sourceRows: number;
}

function findExactColumn(
  columns: string[],
  name: string,
): number | null {
  const index =
    columns.indexOf(name);

  return index >= 0
    ? index
    : null;
}

function findPatternColumn(
  columns: string[],
  patterns: RegExp[],
): number | null {
  for (
    const pattern of patterns
  ) {
    const index =
      columns.findIndex(
        (column) =>
          pattern.test(column),
      );

    if (
      index >= 0
    ) {
      return index;
    }
  }

  return null;
}

function exactOrPattern(
  columns: string[],
  exactName: string,
  patterns: RegExp[],
): number | null {
  return (
    findExactColumn(
      columns,
      exactName,
    ) ??
    findPatternColumn(
      columns,
      patterns,
    )
  );
}

function resolveColumns(
  columns: string[],
): SolarMemColumnIndexes {
  const timestamp =
    findExactColumn(
      columns,
      "JulianTime",
    ) ??
    0;

  return {
    timestamp,

    dhi:
      exactOrPattern(
        columns,
        "DHI_ThPyra2_Wm-2_avg",
        [
          /^DHI_/i,
          /diffuse.*irradi/i,
        ],
      ),

    dni:
      exactOrPattern(
        columns,
        "DNI_ThPyrh1_Wm-2_avg",
        [
          /^DNI_/i,
          /direct.*normal/i,
        ],
      ),

    ghi:
      exactOrPattern(
        columns,
        "GHI_ThPyra1_Wm-2_avg",
        [
          /^GHI_/i,
          /global.*horizontal/i,
        ],
      ),

    precipitation:
      exactOrPattern(
        columns,
        "Precip_Pluvio1_mm_sum",
        [
          /precip.*mm.*sum/i,
          /rain.*mm/i,
        ],
      ),

    pressure:
      exactOrPattern(
        columns,
        "Pres_Logger1_hPa_avg",
        [
          /pres.*hpa/i,
          /pressure/i,
        ],
      ),

    relativeHumidity:
      exactOrPattern(
        columns,
        "RH_ThHyg1_per100_avg",
        [
          /^RH_/i,
          /relative.*humidity/i,
        ],
      ),

    temperature:
      findPatternColumn(
        columns,
        [
          /Temp_ThHyg.*degC.*avg/i,
          /ambient.*temp/i,
          /air.*temp/i,
          /temp.*air/i,
          /^Temp_Logger1_degC_avg$/i,
        ],
      ),

    windSpeed:
      findPatternColumn(
        columns,
        [
          /wind.*speed.*avg/i,
          /wind.*spd.*avg/i,
          /^WS_.*avg/i,
          /anem.*speed/i,
        ],
      ),

    windDirection:
      findPatternColumn(
        columns,
        [
          /wind.*direction.*avg/i,
          /wind.*dir.*avg/i,
          /^WD_.*avg/i,
        ],
      ),
  };
}

function columnName(
  columns: string[],
  index: number | null,
): string | null {
  return index === null
    ? null
    : columns[index] ??
        null;
}

function field(
  row: string[],
  index: number | null,
): string | null {
  if (
    index === null
  ) {
    return null;
  }

  return row[index] ??
    null;
}

function extractDate(
  timestamp: string,
): string | null {
  const match =
    timestamp.match(
      /^(\d{4}-\d{2}-\d{2})[ T]/,
    );

  return match?.[1] ??
    null;
}

function extractHour(
  timestamp: string,
): string | null {
  const match =
    timestamp.match(
      /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):\d{2}:\d{2}/,
    );

  if (!match) {
    return null;
  }

  return `${match[1]}T${match[2]}:00`;
}

function createAccumulator(
  timestamp: string,
): HourAccumulator {
  return {
    timestamp,

    ghiSum: 0,
    ghiCount: 0,

    dniSum: 0,
    dniCount: 0,

    dhiSum: 0,
    dhiCount: 0,

    temperatureSum: 0,
    temperatureCount: 0,

    humiditySum: 0,
    humidityCount: 0,

    pressureSum: 0,
    pressureCount: 0,

    windSpeedSum: 0,
    windSpeedCount: 0,

    windSinSum: 0,
    windCosSum: 0,
    windDirectionCount: 0,

    precipitationSum: 0,

    sourceRows: 0,
  };
}

function addMeanValue(
  accumulator:
    HourAccumulator,

  value:
    number | null,

  sumKey:
    | "ghiSum"
    | "dniSum"
    | "dhiSum"
    | "temperatureSum"
    | "humiditySum"
    | "pressureSum"
    | "windSpeedSum",

  countKey:
    | "ghiCount"
    | "dniCount"
    | "dhiCount"
    | "temperatureCount"
    | "humidityCount"
    | "pressureCount"
    | "windSpeedCount",
): void {
  if (
    value === null
  ) {
    return;
  }

  accumulator[sumKey] +=
    value;

  accumulator[countKey] +=
    1;
}

function mean(
  sum: number,
  count: number,
): number | null {
  return count > 0
    ? sum / count
    : null;
}

function finalizeHour(
  accumulator:
    HourAccumulator,
): EnvironmentalHourlyPoint {
  let windDirectionDeg:
    number | null = null;

  if (
    accumulator
      .windDirectionCount >
    0
  ) {
    const radians =
      Math.atan2(
        accumulator
          .windSinSum,

        accumulator
          .windCosSum,
      );

    windDirectionDeg =
      (
        radians *
          180 /
          Math.PI +
        360
      ) %
      360;
  }

  return {
    timestamp:
      accumulator.timestamp,

    ghiWm2:
      mean(
        accumulator.ghiSum,
        accumulator.ghiCount,
      ),

    dniWm2:
      mean(
        accumulator.dniSum,
        accumulator.dniCount,
      ),

    dhiWm2:
      mean(
        accumulator.dhiSum,
        accumulator.dhiCount,
      ),

    temperatureC:
      mean(
        accumulator
          .temperatureSum,

        accumulator
          .temperatureCount,
      ),

    relativeHumidityPct:
      mean(
        accumulator
          .humiditySum,

        accumulator
          .humidityCount,
      ),

    /*
     * Solar-MEM currently has no mapped cloud
     * variable. Preserve absence rather than
     * manufacturing an estimate.
     */
    cloudCoverPct:
      null,

    windSpeedMs:
      mean(
        accumulator
          .windSpeedSum,

        accumulator
          .windSpeedCount,
      ),

    windDirectionDeg,

    precipitationMm:
      accumulator
        .precipitationSum,

    pressureHpa:
      mean(
        accumulator
          .pressureSum,

        accumulator
          .pressureCount,
      ),

    et0Mm:
      null,

    additionalValues: {
      sourceMinuteRecords:
        accumulator
          .sourceRows,
    },
  };
}

export async function loadSolarMemEnvironmentalDataset(
  definition:
    LocalEnvironmentalDatasetDefinition,

  request:
    EnvironmentalDataRequest,
): Promise<EnvironmentalDataset> {
  const path =
    resolveLocalDatasetPath(
      definition.filename,
    );

  const input =
    createReadStream(
      path,
      {
        encoding:
          "utf8",

        highWaterMark:
          256 * 1024,
      },
    );

  const lines =
    createInterface({
      input,

      crlfDelay:
        Infinity,
    });

  let lineNumber = 0;

  let columns:
    string[] | null =
    null;

  let indexes:
    SolarMemColumnIndexes | null =
    null;

  const hourly:
    EnvironmentalHourlyPoint[] =
    [];

  let current:
    HourAccumulator | null =
    null;

  let sourceRowsRead = 0;
  let sourceRowsUsed = 0;

  let invalidTimestampRows =
    0;

  let reachedRequestedPeriod =
    false;

  try {
    for await (
      const rawLine of
      lines
    ) {
      lineNumber += 1;

      /*
       * Line 1:
       *   # Variables:
       *
       * Line 2:
       *   # JulianTime,DHI,...
       */
      if (
        lineNumber === 1
      ) {
        continue;
      }

      if (
        lineNumber === 2
      ) {
        const header =
          rawLine.startsWith(
            "#",
          )
            ? rawLine
                .slice(1)
                .trim()
            : rawLine.trim();

        columns =
          header
            .split(",")
            .map(
              (column) =>
                column.trim(),
            );

        indexes =
          resolveColumns(
            columns,
          );

        if (
          indexes.ghi ===
            null ||
          indexes.dni ===
            null ||
          indexes.dhi ===
            null
        ) {
          throw new Error(
            "Solar-MEM required GHI/DNI/DHI columns could not be resolved.",
          );
        }

        continue;
      }

      if (
        !columns ||
        !indexes
      ) {
        throw new Error(
          "Solar-MEM header was not initialized.",
        );
      }

      if (
        rawLine.trim() ===
        ""
      ) {
        continue;
      }

      sourceRowsRead += 1;

      /*
       * Solar-MEM export contains no quoted
       * comma-bearing text fields, so splitting
       * each logger record directly is both safe
       * and much faster than constructing an
       * object for every one of 1.2M records.
       */
      const row =
        rawLine.split(",");

      const timestamp =
        field(
          row,
          indexes.timestamp,
        );

      if (!timestamp) {
        invalidTimestampRows +=
          1;

        continue;
      }

      const rowDate =
        extractDate(
          timestamp,
        );

      if (!rowDate) {
        invalidTimestampRows +=
          1;

        continue;
      }

      if (
        rowDate <
        request.startDate
      ) {
        continue;
      }

      if (
        rowDate >
        request.endDate
      ) {
        /*
         * The dataset is chronological.
         *
         * Terminate the stream immediately once
         * the requested date range has passed.
         */
        if (
          reachedRequestedPeriod
        ) {
          break;
        }

        continue;
      }

      reachedRequestedPeriod =
        true;

      sourceRowsUsed += 1;

      const hour =
        extractHour(
          timestamp,
        );

      if (!hour) {
        invalidTimestampRows +=
          1;

        continue;
      }

      if (
        current &&
        current.timestamp !==
          hour
      ) {
        hourly.push(
          finalizeHour(
            current,
          ),
        );

        current = null;
      }

      if (!current) {
        current =
          createAccumulator(
            hour,
          );
      }

      current.sourceRows +=
        1;

      addMeanValue(
        current,

        normalizeNumericValue(
          field(
            row,
            indexes.ghi,
          ),
          "W/m2",
        ),

        "ghiSum",
        "ghiCount",
      );

      addMeanValue(
        current,

        normalizeNumericValue(
          field(
            row,
            indexes.dni,
          ),
          "W/m2",
        ),

        "dniSum",
        "dniCount",
      );

      addMeanValue(
        current,

        normalizeNumericValue(
          field(
            row,
            indexes.dhi,
          ),
          "W/m2",
        ),

        "dhiSum",
        "dhiCount",
      );

      addMeanValue(
        current,

        normalizeNumericValue(
          field(
            row,
            indexes
              .temperature,
          ),
          "C",
        ),

        "temperatureSum",
        "temperatureCount",
      );

      addMeanValue(
        current,

        normalizeNumericValue(
          field(
            row,
            indexes
              .relativeHumidity,
          ),
          "%",
        ),

        "humiditySum",
        "humidityCount",
      );

      addMeanValue(
        current,

        normalizeNumericValue(
          field(
            row,
            indexes.pressure,
          ),
          "hPa",
        ),

        "pressureSum",
        "pressureCount",
      );

      addMeanValue(
        current,

        normalizeNumericValue(
          field(
            row,
            indexes.windSpeed,
          ),
          definition.units
            .windSpeed,
        ),

        "windSpeedSum",
        "windSpeedCount",
      );

      const windDirection =
        normalizeNumericValue(
          field(
            row,
            indexes
              .windDirection,
          ),
          "degree",
        );

      if (
        windDirection !==
        null
      ) {
        const radians =
          windDirection *
          Math.PI /
          180;

        current.windSinSum +=
          Math.sin(
            radians,
          );

        current.windCosSum +=
          Math.cos(
            radians,
          );

        current
          .windDirectionCount +=
          1;
      }

      const precipitation =
        normalizeNumericValue(
          field(
            row,
            indexes
              .precipitation,
          ),
          "mm",
        );

      /*
       * Precipitation is a minute SUM variable,
       * therefore hourly precipitation is the
       * sum of the valid minute records.
       */
      if (
        precipitation !==
        null
      ) {
        current
          .precipitationSum +=
          precipitation;
      }
    }
  } finally {
    /*
     * Ensure the 404 MB file descriptor/stream
     * is closed immediately after the requested
     * period is completed.
     */
    lines.close();
    input.destroy();
  }

  if (current) {
    hourly.push(
      finalizeHour(
        current,
      ),
    );
  }

  if (
    hourly.length === 0
  ) {
    throw new Error(
      `Solar-MEM dataset contains no records between ${request.startDate} and ${request.endDate}.`,
    );
  }

  const quality =
    assessEnvironmentalQuality(
      hourly,
      [
        "ghiWm2",
        "dniWm2",
        "dhiWm2",
        "temperatureC",
        "relativeHumidityPct",
        "windSpeedMs",
        "precipitationMm",
      ],
    );

  quality.warnings.push(
    "Solar-MEM one-minute measurements were aggregated to canonical hourly records.",
  );

  if (
    indexes?.windSpeed ===
    null
  ) {
    quality.warnings.push(
      "No wind-speed column was automatically detected.",
    );
  }

  if (
    indexes?.windDirection ===
    null
  ) {
    quality.warnings.push(
      "No wind-direction column was automatically detected.",
    );
  }

  if (
    invalidTimestampRows >
    0
  ) {
    quality.warnings.push(
      `${invalidTimestampRows} Solar-MEM rows had invalid timestamps.`,
    );
  }

  const resolvedColumns =
    columns &&
    indexes
      ? {
          timestamp:
            columnName(
              columns,
              indexes
                .timestamp,
            ),

          ghi:
            columnName(
              columns,
              indexes.ghi,
            ),

          dni:
            columnName(
              columns,
              indexes.dni,
            ),

          dhi:
            columnName(
              columns,
              indexes.dhi,
            ),

          temperature:
            columnName(
              columns,
              indexes
                .temperature,
            ),

          relativeHumidity:
            columnName(
              columns,
              indexes
                .relativeHumidity,
            ),

          windSpeed:
            columnName(
              columns,
              indexes
                .windSpeed,
            ),

          windDirection:
            columnName(
              columns,
              indexes
                .windDirection,
            ),

          precipitation:
            columnName(
              columns,
              indexes
                .precipitation,
            ),

          pressure:
            columnName(
              columns,
              indexes.pressure,
            ),
        }
      : {};

  const dataset:
    EnvironmentalDataset = {
    schemaVersion:
      1,

    provenance: {
      source:
        "uploaded_dataset",

      mode:
        "dataset",

      provider:
        "Solar-MEM measurement dataset",

      requestedCoordinate:
        request.coordinate,

      /*
       * Until the actual Solar-MEM measurement
       * station coordinates are registered, do
       * not claim that the logger location equals
       * the scenario coordinate.
       */
      resolvedCoordinate:
        null,

      timezone:
        definition.timezone,

      retrievedAt:
        new Date()
          .toISOString(),

      datasetId:
        definition.id,

      providerModel:
        null,

      providerElevationM:
        null,

      rawSourceMetadata: {
        filename:
          definition.filename,

        format:
          definition.format,

        parser:
          definition.parser,

        originalTemporalResolution:
          "1 minute",

        normalizedTemporalResolution:
          "1 hour",

        sourceRowsRead,

        sourceRowsUsed,

        invalidTimestampRows,

        totalColumns:
          columns?.length ??
          0,

        resolvedColumns,

        metadata:
          definition.metadata ??
          {},
      },
    },

    startTime:
      hourly[0]
        .timestamp,

    endTime:
      hourly[
        hourly.length - 1
      ].timestamp,

    hourly,

    quality,
  };

  return hardenEnvironmentalProvenance(
    request,
    dataset,
  );
}
