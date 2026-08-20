import type {
  Database,
  Json,
} from "@/lib/database/database.types";

import type {
  ResolvedSimulationExecutionInput,
  SimulationExecutionResult,
} from "./types";

type RunInsert =
  Database["public"]["Tables"]["simulation_runs"]["Insert"];

type HourlyInsert =
  Database["public"]["Tables"]["simulation_hourly_results"]["Insert"];

type SpatialInsert =
  Database["public"]["Tables"]["simulation_spatial_results"]["Insert"];

function asJson(
  value: unknown,
): Json {
  return value as Json;
}

function parseLocalTimestamp(
  timestamp: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const match =
    timestamp.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/,
    );

  if (!match) {
    throw new Error(
      `Invalid environmental timestamp: ${timestamp}`,
    );
  }

  return {
    year:
      Number(match[1]),

    month:
      Number(match[2]),

    day:
      Number(match[3]),

    hour:
      Number(match[4]),

    minute:
      Number(match[5]),

    second:
      Number(match[6] ?? 0),
  };
}

function timezoneParts(
  date:
    Date,

  timezone:
    string,
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          timezone,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hourCycle:
          "h23",
      },
    );

  const values =
    Object.fromEntries(
      formatter
        .formatToParts(
          date,
        )
        .filter(
          (part) =>
            part.type !==
            "literal",
        )
        .map(
          (part) => [
            part.type,
            Number(
              part.value,
            ),
          ],
        ),
    );

  return {
    year:
      values.year,

    month:
      values.month,

    day:
      values.day,

    hour:
      values.hour,

    minute:
      values.minute,

    second:
      values.second,
  };
}

/**
 * Converts an environmental timestamp expressed in its
 * dataset IANA timezone into a true UTC ISO timestamp.
 */
export function localTimestampToUtcIso(
  timestamp:
    string,

  timezone:
    string,
): string {
  const local =
    parseLocalTimestamp(
      timestamp,
    );

  const desiredAsUtc =
    Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    );

  let candidate =
    desiredAsUtc;

  /*
   * Two iterations handle normal timezone offsets and
   * DST transitions more reliably than a single pass.
   */
  for (
    let iteration = 0;
    iteration < 2;
    iteration += 1
  ) {
    const represented =
      timezoneParts(
        new Date(
          candidate,
        ),
        timezone,
      );

    const representedAsUtc =
      Date.UTC(
        represented.year,
        represented.month - 1,
        represented.day,
        represented.hour,
        represented.minute,
        represented.second,
      );

    candidate -=
      representedAsUtc -
      desiredAsUtc;
  }

  return new Date(
    candidate,
  ).toISOString();
}

export function createWeatherSnapshot(
  input:
    ResolvedSimulationExecutionInput,
): Json {
  return asJson({
    schema:
      "agritwin-weather-snapshot-v1",

    provenance:
      input.environment
        .provenance,

    startTime:
      input.environment
        .startTime,

    endTime:
      input.environment
        .endTime,

    quality:
      input.environment
        .quality,

    /*
     * Current engines execute one 24-hour period.
     * Store the exact environmental records that
     * entered the engine for reproducibility.
     */
    hourly:
      input.environment
        .hourly
        .slice(
          0,
          24,
        ),
  });
}

export function createSimulationRunInsert(
  input:
    ResolvedSimulationExecutionInput,

  requestedBy:
    string,
): RunInsert {
  const snapshot =
    input.inputSnapshot;

  return {
    project_id:
      input.scenario
        .projectId,

    site_id:
      input.siteVersion
        .siteId,

    site_version_id:
      input.siteVersion
        .id,

    scenario_id:
      input.scenario
        .id,

    status:
      "running",

    simulation_date:
      snapshot
        .simulationDate,

    engine_version:
      snapshot.engine
        .engineVersion,

    controller_version:
      snapshot.engine
        .controllerVersion,

    site_schema_version:
      snapshot.site
        .siteSchemaVersion,

    module_catalogue_version:
      snapshot.engine
        .moduleCatalogueVersion,

    weather_adapter_version:
      snapshot.engine
        .weatherAdapterVersion,

    input_snapshot:
      asJson(
        snapshot,
      ),

    weather_snapshot:
      createWeatherSnapshot(
        input,
      ),

    result_summary:
      null,

    warnings:
      asJson(
        [],
      ),

    error_message:
      null,

    requested_by:
      requestedBy,

    started_at:
      new Date()
        .toISOString(),
  };
}

export function createHourlyResultInserts(
  simulationRunId:
    string,

  result:
    SimulationExecutionResult,

  timezone:
    string,
): HourlyInsert[] {
  return result.hourly.map(
    (point) => ({
      simulation_run_id:
        simulationRunId,

      hour_index:
        point.hourIndex,

      timestamp_utc:
        localTimestampToUtcIso(
          point.timestamp,
          timezone,
        ),

      solar_altitude_deg:
        point.solarAltitudeDeg,

      solar_azimuth_deg:
        point.solarAzimuthDeg,

      ghi_wm2:
        point.ghiWm2,

      poa_wm2:
        point.poaWm2,

      module_temperature_c:
        point.moduleTemperatureC,

      pv_power_kw:
        point.pvPowerKw,

      tracker_angle_deg:
        point.trackerAngleDeg,

      tracking_state:
        point.trackingState,

      open_field_dli_increment_mol_m2:
        point.openFieldDliIncrementMolM2,

      crop_dli_increment_mol_m2:
        point.cropDliIncrementMolM2,

      additional_values:
        asJson(
          {
            ...point.additionalValues,

            sourceTimestamp:
              point.timestamp,
          },
        ),
    }),
  );
}

export function createSpatialResultInserts(
  simulationRunId:
    string,

  result:
    SimulationExecutionResult,
): SpatialInsert[] {
  return result.spatial.map(
    (item) => ({
      simulation_run_id:
        simulationRunId,

      result_kind:
        item.resultKind,

      hour_index:
        item.hourIndex,

      grid_definition:
        asJson(
          item.gridDefinition,
        ),

      values_data:
        asJson(
          item.valuesData,
        ),

      statistics:
        item.statistics
          ? asJson(
              item.statistics,
            )
          : null,
    }),
  );
}
