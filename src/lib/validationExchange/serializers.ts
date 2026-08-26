import {
  serializeCsv,
} from "./csv";

import type {
  CsvColumn,
} from "./csv";

import type {
  ValidationDailyPowerRow,
  ValidationElectricalTopologyRow,
  ValidationHourlyPowerRow,
  ValidationPhysicalTopologyRow,
  ValidationWeatherRow,
} from "./types";

const weatherColumns:
  CsvColumn<ValidationWeatherRow>[] = [
    {
      header:
        "timestamp_utc",
      value:
        (row) =>
          row.timestampUtc,
    },
    {
      header:
        "timestamp_local",
      value:
        (row) =>
          row.timestampLocal,
    },
    {
      header:
        "timezone",
      value:
        (row) =>
          row.timezone,
    },
    {
      header:
        "source",
      value:
        (row) =>
          row.source,
    },
    {
      header:
        "source_period",
      value:
        (row) =>
          row.sourcePeriod,
    },
    {
      header:
        "ghi_w_m2",
      value:
        (row) =>
          row.ghiWM2,
    },
    {
      header:
        "dni_w_m2",
      value:
        (row) =>
          row.dniWM2,
    },
    {
      header:
        "dhi_w_m2",
      value:
        (row) =>
          row.dhiWM2,
    },
    {
      header:
        "temp_air_c",
      value:
        (row) =>
          row.temperatureC,
    },
    {
      header:
        "relative_humidity_pct",
      value:
        (row) =>
          row.relativeHumidityPercent,
    },
    {
      header:
        "wind_speed_m_s",
      value:
        (row) =>
          row.windSpeedMS,
    },
    {
      header:
        "precipitation_mm",
      value:
        (row) =>
          row.precipitationMm,
    },
    {
      header:
        "pressure_pa",
      value:
        (row) =>
          row.pressurePa,
    },
    {
      header:
        "quality_flag",
      value:
        (row) =>
          row.qualityFlag,
    },
  ];

const hourlyPowerColumns:
  CsvColumn<ValidationHourlyPowerRow>[] = [
    {
      header:
        "resolution",
      value:
        (row) =>
          row.resolution,
    },
    {
      header:
        "timestamp_utc",
      value:
        (row) =>
          row.timestampUtc,
    },
    {
      header:
        "timestamp_local",
      value:
        (row) =>
          row.timestampLocal,
    },
    {
      header:
        "timezone",
      value:
        (row) =>
          row.timezone,
    },
    {
      header:
        "source_period",
      value:
        (row) =>
          row.sourcePeriod,
    },
    {
      header:
        "pv_power_kw",
      value:
        (row) =>
          row.pvPowerKw,
    },
    {
      header:
        "pv_dc_power_kw",
      value:
        (row) =>
          row.pvDcPowerKw,
    },
    {
      header:
        "pv_ac_power_kw",
      value:
        (row) =>
          row.pvAcPowerKw,
    },
    {
      header:
        "poa_irradiance_w_m2",
      value:
        (row) =>
          row.poaIrradianceWM2,
    },
    {
      header:
        "module_temperature_c",
      value:
        (row) =>
          row.moduleTemperatureC,
    },
    {
      header:
        "inverter_state",
      value:
        (row) =>
          row.inverterState,
    },
  ];

const dailyPowerColumns:
  CsvColumn<ValidationDailyPowerRow>[] = [
    {
      header:
        "resolution",
      value:
        (row) =>
          row.resolution,
    },
    {
      header:
        "date",
      value:
        (row) =>
          row.date,
    },
    {
      header:
        "timezone",
      value:
        (row) =>
          row.timezone,
    },
    {
      header:
        "source_period",
      value:
        (row) =>
          row.sourcePeriod,
    },
    {
      header:
        "daily_energy_kwh",
      value:
        (row) =>
          row.dailyEnergyKWh,
    },
    {
      header:
        "peak_power_kw",
      value:
        (row) =>
          row.peakPowerKw,
    },
    {
      header:
        "sample_count",
      value:
        (row) =>
          row.sampleCount,
    },
  ];

const electricalTopologyColumns:
  CsvColumn<ValidationElectricalTopologyRow>[] = [
    {
      header:
        "inverter_index",
      value:
        (row) =>
          row.inverterIndex,
    },
    {
      header:
        "inverter_profile_id",
      value:
        (row) =>
          row.inverterProfileId,
    },
    {
      header:
        "mppt_index",
      value:
        (row) =>
          row.mpptIndex,
    },
    {
      header:
        "string_index",
      value:
        (row) =>
          row.stringIndex,
    },
    {
      header:
        "modules_per_string",
      value:
        (row) =>
          row.modulesPerString,
    },
    {
      header:
        "string_module_count",
      value:
        (row) =>
          row.stringModuleCount,
    },
    {
      header:
        "module_profile_id",
      value:
        (row) =>
          row.moduleProfileId,
    },
    {
      header:
        "allocation_status",
      value:
        (row) =>
          row.allocationStatus,
    },
  ];

const physicalTopologyColumns:
  CsvColumn<ValidationPhysicalTopologyRow>[] = [
    {
      header:
        "row_index",
      value:
        (row) =>
          row.rowIndex,
    },
    {
      header:
        "module_index",
      value:
        (row) =>
          row.moduleIndex,
    },
    {
      header:
        "x_m",
      value:
        (row) =>
          row.xM,
    },
    {
      header:
        "y_m",
      value:
        (row) =>
          row.yM,
    },
    {
      header:
        "z_m",
      value:
        (row) =>
          row.zM,
    },
    {
      header:
        "tilt_deg",
      value:
        (row) =>
          row.tiltDeg,
    },
    {
      header:
        "azimuth_deg",
      value:
        (row) =>
          row.azimuthDeg,
    },
    {
      header:
        "tracking_mode",
      value:
        (row) =>
          row.trackingMode,
    },
    {
      header:
        "row_spacing_m",
      value:
        (row) =>
          row.rowSpacingM,
    },
    {
      header:
        "panel_height_m",
      value:
        (row) =>
          row.panelHeightM,
    },
    {
      header:
        "field_length_m",
      value:
        (row) =>
          row.fieldLengthM,
    },
    {
      header:
        "field_width_m",
      value:
        (row) =>
          row.fieldWidthM,
    },
  ];

export function serializeWeatherCsv(
  rows: readonly ValidationWeatherRow[],
): string {
  return serializeCsv(
    rows,
    weatherColumns,
  );
}

export function serializeHourlyPowerCsv(
  rows: readonly ValidationHourlyPowerRow[],
): string {
  return serializeCsv(
    rows,
    hourlyPowerColumns,
  );
}

export function serializeDailyPowerCsv(
  rows: readonly ValidationDailyPowerRow[],
): string {
  return serializeCsv(
    rows,
    dailyPowerColumns,
  );
}

export function serializeElectricalTopologyCsv(
  rows:
    readonly ValidationElectricalTopologyRow[],
): string {
  return serializeCsv(
    rows,
    electricalTopologyColumns,
  );
}

export function serializePhysicalTopologyCsv(
  rows:
    readonly ValidationPhysicalTopologyRow[],
): string {
  return serializeCsv(
    rows,
    physicalTopologyColumns,
  );
}
