import type {
  Database,
  Json,
} from "@/lib/database/database.types";

import type {
  CanonicalHourlySimulationPoint,
  CanonicalSpatialSimulationResult,
  SimulationExecutionInputSnapshot,
} from "./types";

import type {
  PersistedSimulationRun,
} from "./persistedRunTypes";

type SimulationRunRow =
  Database["public"]["Tables"]["simulation_runs"]["Row"];

type HourlyRow =
  Database["public"]["Tables"]["simulation_hourly_results"]["Row"];

type SpatialRow =
  Database["public"]["Tables"]["simulation_spatial_results"]["Row"];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function asRecord(
  value: Json | null,
): Record<string, unknown> {
  return isRecord(value)
    ? value
    : {};
}

function nullableNumber(
  value: number | null,
): number | null {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : null;
}

function mapInputSnapshot(
  value: Json,
): SimulationExecutionInputSnapshot {
  if (
    !isRecord(value) ||
    value.schema !==
      "agritwin-execution-input-v1"
  ) {
    throw new Error(
      "Simulation run contains an invalid Phase 9C input snapshot.",
    );
  }

  return value as unknown as
    SimulationExecutionInputSnapshot;
}

export function mapSimulationHourlyRow(
  row:
    HourlyRow,
): CanonicalHourlySimulationPoint {
  return {
    hourIndex:
      row.hour_index,

    timestamp:
      row.timestamp_utc,

    solarAltitudeDeg:
      nullableNumber(
        row.solar_altitude_deg,
      ),

    solarAzimuthDeg:
      nullableNumber(
        row.solar_azimuth_deg,
      ),

    ghiWm2:
      nullableNumber(
        row.ghi_wm2,
      ),

    poaWm2:
      nullableNumber(
        row.poa_wm2,
      ),

    moduleTemperatureC:
      nullableNumber(
        row.module_temperature_c,
      ),

    pvPowerKw:
      nullableNumber(
        row.pv_power_kw,
      ),

    trackerAngleDeg:
      nullableNumber(
        row.tracker_angle_deg,
      ),

    trackingState:
      row.tracking_state,

    openFieldDliIncrementMolM2:
      nullableNumber(
        row.open_field_dli_increment_mol_m2,
      ),

    cropDliIncrementMolM2:
      nullableNumber(
        row.crop_dli_increment_mol_m2,
      ),

    additionalValues:
      asRecord(
        row.additional_values,
      ),
  };
}

export function mapSimulationSpatialRow(
  row:
    SpatialRow,
): CanonicalSpatialSimulationResult {
  return {
    resultKind:
      row.result_kind as
        CanonicalSpatialSimulationResult["resultKind"],

    hourIndex:
      row.hour_index,

    gridDefinition:
      asRecord(
        row.grid_definition,
      ),

    valuesData:
      row.values_data,

    statistics:
      row.statistics
        ? asRecord(
            row.statistics,
          )
        : null,
  };
}

export function mapPersistedSimulationRun(
  run:
    SimulationRunRow,

  hourly:
    HourlyRow[],

  spatial:
    SpatialRow[],
): PersistedSimulationRun {
  return {
    id:
      run.id,

    projectId:
      run.project_id,

    siteId:
      run.site_id,

    siteVersionId:
      run.site_version_id,

    scenarioId:
      run.scenario_id,

    status:
      run.status as
        PersistedSimulationRun["status"],

    simulationDate:
      run.simulation_date,

    engineVersion:
      run.engine_version,

    controllerVersion:
      run.controller_version,

    siteSchemaVersion:
      run.site_schema_version,

    moduleCatalogueVersion:
      run.module_catalogue_version,

    weatherAdapterVersion:
      run.weather_adapter_version,

    inputSnapshot:
      mapInputSnapshot(
        run.input_snapshot,
      ),

    weatherSnapshot:
      run.weather_snapshot,

    resultSummary:
      run.result_summary,

    warnings:
      run.warnings,

    errorMessage:
      run.error_message,

    requestedBy:
      run.requested_by,

    startedAt:
      run.started_at,

    completedAt:
      run.completed_at,

    createdAt:
      run.created_at,

    hourly:
      [...hourly]
        .sort(
          (
            first,
            second,
          ) =>
            first.hour_index -
            second.hour_index,
        )
        .map(
          mapSimulationHourlyRow,
        ),

    spatial:
      spatial.map(
        mapSimulationSpatialRow,
      ),
  };
}
