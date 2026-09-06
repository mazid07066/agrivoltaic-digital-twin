import type {
  ValidationStudioUnit,
  ValidationStudioVariable,
} from "./types";

export function canonicalUnitForVariable(
  variable:
    ValidationStudioVariable,
): ValidationStudioUnit {
  switch (
    variable
  ) {
    case "ghiWm2":
    case "dniWm2":
    case "dhiWm2":
    case "poaWm2":
    case "cropIrradianceWm2":
      return "W/m2";

    case "ambientTemperatureC":
    case "moduleTemperatureC":
      return "degC";

    case "dcPowerKw":
    case "acPowerKw":
      return "kW";

    case "energyKWh":
      return "kWh";

    case "dcVoltageV":
      return "V";

    case "dcCurrentA":
      return "A";
  }
}

export function convertValidationValue(
  value:
    number,

  fromUnit:
    ValidationStudioUnit,

  toUnit:
    ValidationStudioUnit,
): number {
  if (
    fromUnit ===
    toUnit
  ) {
    return value;
  }

  if (
    toUnit === "kW"
  ) {
    if (
      fromUnit === "W"
    ) {
      return value / 1000;
    }

    if (
      fromUnit === "MW"
    ) {
      return value * 1000;
    }
  }

  if (
    toUnit === "kWh"
  ) {
    if (
      fromUnit === "Wh"
    ) {
      return value / 1000;
    }

    if (
      fromUnit === "MWh"
    ) {
      return value * 1000;
    }
  }

  if (
    toUnit === "degC"
  ) {
    throw new Error(
      `Temperature conversion from ${fromUnit} is not supported yet.`,
    );
  }

  throw new Error(
    `Unsupported validation unit conversion: ${fromUnit} -> ${toUnit}`,
  );
}
