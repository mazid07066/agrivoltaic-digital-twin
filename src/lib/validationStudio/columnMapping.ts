import type {
  ValidationColumnSuggestion,
} from "./importTypes";

function normalize(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(
      /[\s\-()[\]{}]+/g,
      "_",
    )
    .replaceAll(
      /__+/g,
      "_",
    );
}

export function normalizeValidationColumnName(
  value:
    string,
): string {
  return normalize(
    value,
  );
}

export function suggestValidationColumn(
  column:
    string,
): ValidationColumnSuggestion {
  const name =
    normalize(
      column,
    );

  if (
    [
      "timestamp",
      "datetime",
      "date_time",
      "time",
      "timestamp_utc",
      "timestamp_local",
    ].includes(
      name,
    )
  ) {
    return {
      column,

      variable:
        "timestamp",

      confidence:
        "high",

      reason:
        "Recognized timestamp column name.",
    };
  }

  const exact:
    Record<
      string,
      ValidationColumnSuggestion["variable"]
    > = {
      ghi:
        "ghiWm2",

      ghi_wm2:
        "ghiWm2",

      ghi_w_m2:
        "ghiWm2",

      dni:
        "dniWm2",

      dni_wm2:
        "dniWm2",

      dni_w_m2:
        "dniWm2",

      dhi:
        "dhiWm2",

      dhi_wm2:
        "dhiWm2",

      dhi_w_m2:
        "dhiWm2",

      poa:
        "poaWm2",

      poa_wm2:
        "poaWm2",

      poa_w_m2:
        "poaWm2",

      poa_global:
        "poaWm2",

      poa_global_w_m2:
        "poaWm2",

      poa_effective_w_m2:
        "poaWm2",

      ambient_temperature:
        "ambientTemperatureC",

      ambient_temp:
        "ambientTemperatureC",

      ambient_temperature_c:
        "ambientTemperatureC",

      temperature:
        "ambientTemperatureC",

      temperature_c:
        "ambientTemperatureC",

      temp_air_c:
        "ambientTemperatureC",

      module_temperature:
        "moduleTemperatureC",

      module_temperature_c:
        "moduleTemperatureC",

      module_temp:
        "moduleTemperatureC",

      cell_temperature:
        "moduleTemperatureC",

      cell_temperature_c:
        "moduleTemperatureC",

      cell_temp:
        "moduleTemperatureC",

      celltemp:
        "moduleTemperatureC",

      tcell:
        "moduleTemperatureC",

      tcell_c:
        "moduleTemperatureC",

      dc_power:
        "dcPowerKw",

      dc_power_w:
        "dcPowerKw",

      dc_power_kw:
        "dcPowerKw",

      p_dc:
        "dcPowerKw",

      p_dc_w:
        "dcPowerKw",

      p_dc_kw:
        "dcPowerKw",

      pdc:
        "dcPowerKw",

      ac_power:
        "acPowerKw",

      ac_power_w:
        "acPowerKw",

      ac_power_kw:
        "acPowerKw",

      p_ac:
        "acPowerKw",

      p_ac_w:
        "acPowerKw",

      p_ac_kw:
        "acPowerKw",

      pac:
        "acPowerKw",

      modeled_power_kw:
        "acPowerKw",

      ac_generation_kw:
        "acPowerKw",

      plant_ac_power_kw:
        "acPowerKw",

      plant_ac_power_w:
        "acPowerKw",

      pv_power_kw:
        "acPowerKw",

      power_kw:
        "acPowerKw",

      energy:
        "energyKWh",

      energy_kwh:
        "energyKWh",

      plant_energy_kwh:
        "energyKWh",

      daily_energy_kwh:
        "energyKWh",

      dc_voltage:
        "dcVoltageV",

      dc_voltage_v:
        "dcVoltageV",

      voltage:
        "dcVoltageV",

      voltage_v:
        "dcVoltageV",

      dc_current:
        "dcCurrentA",

      dc_current_a:
        "dcCurrentA",

      current:
        "dcCurrentA",

      current_a:
        "dcCurrentA",

      crop_irradiance:
        "cropIrradianceWm2",

      crop_irradiance_w_m2:
        "cropIrradianceWm2",
    };

  const variable =
    exact[
      name
    ];

  if (
    variable
  ) {
    return {
      column,

      variable,

      confidence:
        "high",

      reason:
        "Recognized validation variable column name.",
    };
  }

  if (
    name.includes(
      "timestamp",
    ) ||
    name.includes(
      "datetime",
    )
  ) {
    return {
      column,

      variable:
        "timestamp",

      confidence:
        "medium",

      reason:
        "Column name appears to represent time.",
    };
  }

  if (
    name.includes(
      "ghi",
    )
  ) {
    return {
      column,

      variable:
        "ghiWm2",

      confidence:
        "medium",

      reason:
        "Column name contains GHI.",
    };
  }

  if (
    name.includes(
      "dni",
    )
  ) {
    return {
      column,

      variable:
        "dniWm2",

      confidence:
        "medium",

      reason:
        "Column name contains DNI.",
    };
  }

  if (
    name.includes(
      "dhi",
    )
  ) {
    return {
      column,

      variable:
        "dhiWm2",

      confidence:
        "medium",

      reason:
        "Column name contains DHI.",
    };
  }

  if (
    name.includes(
      "poa",
    )
  ) {
    return {
      column,

      variable:
        "poaWm2",

      confidence:
        "medium",

      reason:
        "Column name contains POA.",
    };
  }

  return {
    column,

    variable:
      null,

    confidence:
      "none",

    reason:
      "No safe automatic mapping is available.",
  };
}
