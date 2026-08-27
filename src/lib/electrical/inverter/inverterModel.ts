import {
  evaluateInverterAlarms,
} from "./alarms";

import {
  evaluateInverterEfficiency,
} from "./efficiency";

import {
  evaluateInverterDcLimits,
} from "./inverterLimits";

import {
  apparentPowerFromActivePower,
  lineCurrentFromThreePhasePower,
  reactivePowerFromActivePower,
} from "./threePhase";

import type {
  InverterDcInput,
  InverterEfficiencyApplicationMode,
  InverterOperatingState,
  InverterSpecification,
  InverterTimestepResult,
} from "./types";

export interface SimulateInverterTimestepInput {
  timestamp:
    string;

  dcInput:
    InverterDcInput;

  specification:
    InverterSpecification;

  efficiencyMode:
    InverterEfficiencyApplicationMode;

  lineNeutralVoltageV:
    number;

  lineLineVoltageV:
    number;

  frequencyHz:
    number;

  powerFactor?:
    number;

  thdPercent?:
    number | null;

  gridAvailable?:
    boolean;

  timestepHours?:
    number;
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    Math.max(
      value,
      min,
    ),
    max,
  );
}

export function simulateInverterTimestep(
  input:
    SimulateInverterTimestepInput,
): InverterTimestepResult {
  const specification =
    input.specification;

  const limits =
    evaluateInverterDcLimits(
      input.dcInput,
      specification,
    );

  const powerFactor =
    clamp(
      input.powerFactor ??
        specification.ac
          .ratedPowerFactor,
      0.000001,
      1,
    );

  const timestepHours =
    input.timestepHours ??
    1;

  if (
    !Number.isFinite(
      timestepHours,
    ) ||
    timestepHours <= 0
  ) {
    throw new Error(
      "Timestep duration must be a positive finite number.",
    );
  }

  const gridAvailable =
    input.gridAvailable ??
    true;

  const availableDcPowerKw =
    Math.max(
      0,
      input.dcInput
        .availablePowerKw
        .value,
    );

  const requestedDcPowerKw =
    Math.max(
      0,
      Math.min(
        input.dcInput
          .requestedPowerKw
          .value,
        availableDcPowerKw,
      ),
    );

  const dcGeneratorLimitKw =
    specification.dc
      .maxGeneratorPowerW /
    1000;

  const acceptedBeforeOperatingStateKw =
    Math.min(
      requestedDcPowerKw,
      dcGeneratorLimitKw,
    );

  const inverterCanOperate =
    limits.state !==
      "OFF" &&
    limits.state !==
      "WAITING_FOR_START" &&
    limits.state !==
      "FAULT" &&
    gridAvailable;

  const acceptedDcPowerKw =
    inverterCanOperate
      ? acceptedBeforeOperatingStateKw
      : 0;

  const efficiency =
    evaluateInverterEfficiency(
      acceptedDcPowerKw,
      input.efficiencyMode,
      specification,
    );

  const standbyConsumptionKw =
    input.efficiencyMode ===
      "explicit_fitted_curve" &&
    availableDcPowerKw <= 0 &&
    gridAvailable
      ? (
          specification
            .nightSelfConsumptionW ??
          4.8
        ) /
        1000
      : 0;

  const ratedActivePowerKw =
    specification.ac
      .ratedActivePowerW /
    1000;

  const maxApparentPowerKva =
    specification.ac
      .maxApparentPowerVa /
    1000;

  const activePowerLimitFromApparentKw =
    maxApparentPowerKva *
    powerFactor;

  const activePowerLimitKw =
    Math.min(
      ratedActivePowerKw,
      activePowerLimitFromApparentKw,
    );

  const activePowerKw =
    inverterCanOperate
      ? Math.min(
          efficiency
            .acBeforePowerLimitsKw,
          activePowerLimitKw,
        )
      : 0;

  const clippingLossKw =
    Math.max(
      0,
      acceptedDcPowerKw -
        activePowerKw -
        efficiency
          .conversionLossKw,
    );

  const clippingActive =
    clippingLossKw >
    1e-9;

  const apparentPowerKva =
    apparentPowerFromActivePower(
      activePowerKw,
      powerFactor,
    );

  const apparentPowerLimited =
    efficiency
      .acBeforePowerLimitsKw >
    activePowerLimitFromApparentKw +
      1e-9;

  const reactivePowerKvar =
    reactivePowerFromActivePower(
      activePowerKw,
      powerFactor,
    );

  const lineCurrentA =
    activePowerKw > 0
      ? lineCurrentFromThreePhasePower(
          activePowerKw,
          input.lineLineVoltageV,
          powerFactor,
        )
      : 0;

  let state:
    InverterOperatingState =
    limits.state;

  if (
    !gridAvailable &&
    state !==
      "OFF"
  ) {
    state =
      "GRID_LIMITED";
  } else if (
    state ===
      "MPPT_ACTIVE" &&
    clippingActive
  ) {
    state =
      "CLIPPED";
  }

  const alarms =
    evaluateInverterAlarms(
      {
        limits,

        clippingActive,

        apparentPowerLimited,

        acLineNeutralVoltageV:
          input.lineNeutralVoltageV,

        frequencyHz:
          input.frequencyHz,

        lineCurrentA,

        thdPercent:
          input.thdPercent ??
          null,

        gridAvailable,
      },
      specification,
    );

  const faultAlarmPresent =
    alarms.some(
      (alarm) =>
        alarm.severity ===
          "fault" &&
        alarm.code !==
          "GRID_UNAVAILABLE",
    );

  if (
    faultAlarmPresent
  ) {
    state =
      "FAULT";
  }

  return {
    timestamp:
      input.timestamp,

    state,

    dcInput:
      structuredClone(
        input.dcInput,
      ),

    dcOutput: {
      acceptedPowerKw:
        acceptedDcPowerKw,

      clippedPowerKw:
        clippingLossKw,

      conversionInputPowerKw:
        acceptedDcPowerKw,

      dcLimitActive:
        limits.dcOvercurrent ||
        limits.mpptOvercurrent ||
        limits.mpptShortCircuitViolation ||
        limits.stringShortCircuitViolation ||
        acceptedBeforeOperatingStateKw <
          requestedDcPowerKw,
    },

    efficiency:
      efficiency
        .appliedEfficiency,

    conversionLossKw:
      efficiency
        .conversionLossKw,

    deratingLossKw:
      0,

    standbyConsumptionKw,

    standbyConsumptionEnergyKwh:
      standbyConsumptionKw *
      timestepHours,

    ac: {
      activePowerKw,

      reactivePowerKvar,

      apparentPowerKva,

      powerFactor,

      lineNeutralVoltageV:
        input.lineNeutralVoltageV,

      lineLineVoltageV:
        input.lineLineVoltageV,

      lineCurrentA,

      frequencyHz:
        input.frequencyHz,

      phases:
        3,

      thdPercent:
        input.thdPercent ??
        null,

      energyKwh:
        activePowerKw *
        timestepHours,
    },

    alarms,
  };
}
