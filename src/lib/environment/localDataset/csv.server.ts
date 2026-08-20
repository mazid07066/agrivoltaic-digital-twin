import "server-only";

import {
  createReadStream,
} from "node:fs";

import {
  parse,
} from "csv-parse";

import {
  assessEnvironmentalQuality,
} from "../quality";

import type {
  EnvironmentalDataset,
  EnvironmentalHourlyPoint,
} from "../types";

import {
  hardenEnvironmentalProvenance,
} from "../provenance.server";

import type {
  EnvironmentalDataRequest,
} from "../request";

import {
  normalizeNumericValue,
} from "./normalize";

import {
  resolveLocalDatasetPath,
} from "./path.server";

import type {
  LocalEnvironmentalDatasetDefinition,
} from "./types";

function value(
  row: Record<
    string,
    string
  >,
  column:
    string | null | undefined,
): string | null {
  if (!column) {
    return null;
  }

  return row[column] ??
    null;
}

export async function loadLocalCsvEnvironmentalDataset(
  definition:
    LocalEnvironmentalDatasetDefinition,

  request:
    EnvironmentalDataRequest,
): Promise<EnvironmentalDataset> {
  const path =
    resolveLocalDatasetPath(
      definition.filename,
    );

  const hourly:
    EnvironmentalHourlyPoint[] =
    [];

  const parser =
    createReadStream(
      path,
      {
        encoding:
          "utf8",
      },
    ).pipe(
      parse({
        columns:
          true,

        skip_empty_lines:
          true,

        trim:
          true,
      }),
    );

  for await (
    const rawRow of
    parser
  ) {
    const row =
      rawRow as Record<
        string,
        string
      >;

    const timestamp =
      value(
        row,
        definition.columnMap
          .timestamp,
      );

    if (!timestamp) {
      continue;
    }

    /**
     * Initial implementation assumes timestamps
     * are lexically sortable ISO-like values.
     *
     * More complex dataset timestamp parsing can
     * be added after inspecting the actual file.
     */
    const datePart =
      timestamp.slice(
        0,
        10,
      );

    if (
      datePart <
        request.startDate ||
      datePart >
        request.endDate
    ) {
      continue;
    }

    hourly.push({
      timestamp,

      ghiWm2:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .ghi,
          ),

          definition
            .units
            .ghi,
        ),

      dniWm2:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .dni,
          ),

          definition
            .units
            .dni,
        ),

      dhiWm2:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .dhi,
          ),

          definition
            .units
            .dhi,
        ),

      temperatureC:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .temperature,
          ),

          definition
            .units
            .temperature,
        ),

      relativeHumidityPct:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .relativeHumidity,
          ),

          definition
            .units
            .relativeHumidity,
        ),

      cloudCoverPct:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .cloudCover,
          ),

          definition
            .units
            .cloudCover,
        ),

      windSpeedMs:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .windSpeed,
          ),

          definition
            .units
            .windSpeed,
        ),

      windDirectionDeg:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .windDirection,
          ),

          definition
            .units
            .windDirection,
        ),

      precipitationMm:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .precipitation,
          ),

          definition
            .units
            .precipitation,
        ),

      pressureHpa:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .pressure,
          ),

          definition
            .units
            .pressure,
        ),

      et0Mm:
        normalizeNumericValue(
          value(
            row,
            definition
              .columnMap
              .et0,
          ),

          definition
            .units
            .et0,
        ),
    });
  }

  if (
    hourly.length === 0
  ) {
    throw new Error(
      `Dataset "${definition.id}" contains no records for the requested period.`,
    );
  }

  const quality =
    assessEnvironmentalQuality(
      hourly,
    );

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
        "AgriTwin Local Dataset",

      requestedCoordinate:
        request.coordinate,

      resolvedCoordinate:
        request.coordinate,

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

        name:
          definition.name,

        units:
          definition.units,

        columnMap:
          definition.columnMap,

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
