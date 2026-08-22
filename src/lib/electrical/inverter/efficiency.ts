import type {
  ElectricalValue,
  InverterEfficiencyApplicationMode,
  InverterSpecification,
} from "./types";

export interface EfficiencyEvaluation {
  appliedEfficiency:
    ElectricalValue<number>;

  acBeforePowerLimitsKw:
    number;

  conversionLossKw:
    number;
}

export function evaluateInverterEfficiency(
  acceptedDcPowerKw: number,
  mode:
    InverterEfficiencyApplicationMode,
  specification:
    InverterSpecification,
): EfficiencyEvaluation {
  if (
    !Number.isFinite(
      acceptedDcPowerKw,
    ) ||
    acceptedDcPowerKw < 0
  ) {
    throw new Error(
      "Accepted DC power must be a non-negative finite number.",
    );
  }

  if (
    mode ===
      "legacy_power_passthrough"
  ) {
    return {
      appliedEfficiency: {
        value:
          1,

        provenance:
          "assumed",

        note:
          "No additional inverter conversion factor is applied because upstream pvPowerKw already includes the legacy aggregate systemEfficiency derating.",
      },

      acBeforePowerLimitsKw:
        acceptedDcPowerKw,

      conversionLossKw:
        0,
    };
  }

  const efficiency =
    Math.min(
      Math.max(
        specification.ac
          .maximumEfficiency,
        0,
      ),
      1,
    );

  const acBeforePowerLimitsKw =
    acceptedDcPowerKw *
    efficiency;

  return {
    appliedEfficiency: {
      value:
        efficiency,

      provenance:
        "assumed",

      note:
        "Constant bounded inverter efficiency assumption using the supplied maximum efficiency; no manufacturer part-load curve is available.",
    },

    acBeforePowerLimitsKw,

    conversionLossKw:
      Math.max(
        0,
        acceptedDcPowerKw -
          acBeforePowerLimitsKw,
      ),
  };
}
