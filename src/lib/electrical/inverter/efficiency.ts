import type {
  ElectricalValue,
  InverterEfficiencyApplicationMode,
  InverterSpecification,
} from "./types";

import {
  calculateFittedInverterConversion,
} from "@/lib/physics/inverter";

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
      "explicit_fitted_curve"
  ) {
    const plantCountMatch =
      specification.id.match(
        /::plant-(\d+)$/,
      );
    const inverterCount =
      plantCountMatch
        ? Math.max(
            1,
            Number(
              plantCountMatch[1],
            ),
          )
        : 1;
    const dcPerInverterKw =
      acceptedDcPowerKw /
      inverterCount;
    const fitted =
      calculateFittedInverterConversion(
        {
          dcInputPowerW:
            dcPerInverterKw *
            1000,

          ratedAcPowerW:
            specification.ac
              .ratedActivePowerW /
            inverterCount,

          nightSelfConsumptionW:
            specification
              .nightSelfConsumptionW ??
            4.8,
        },
      );

    return {
      appliedEfficiency: {
        value:
          fitted.efficiency,

        provenance:
          "calculated",

        note:
          "SMA STP 50-40 fitted part-load loss curve: 75 W + 0.016711·Pdc + 1.6038e-8·Pdc².",
      },

      acBeforePowerLimitsKw:
        fitted.acUnclippedPowerW /
        1000 *
        inverterCount,

      conversionLossKw:
        fitted.conversionLossW /
        1000 *
        inverterCount,
    };
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
