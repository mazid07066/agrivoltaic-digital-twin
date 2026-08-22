import type {
  InverterAlarm,
  InverterSpecification,
} from "./types";

import type {
  InverterLimitEvaluation,
} from "./inverterLimits";

export interface InverterAlarmContext {
  limits:
    InverterLimitEvaluation;

  clippingActive:
    boolean;

  apparentPowerLimited:
    boolean;

  acLineNeutralVoltageV:
    number;

  frequencyHz:
    number;

  lineCurrentA:
    number;

  thdPercent:
    number | null;

  gridAvailable:
    boolean;
}

export function evaluateInverterAlarms(
  context:
    InverterAlarmContext,

  specification:
    InverterSpecification,
): InverterAlarm[] {
  const alarms:
    InverterAlarm[] =
    [];

  const add = (
    code:
      InverterAlarm["code"],
    active:
      boolean,
    message:
      string,
    severity:
      InverterAlarm["severity"],
  ) => {
    if (
      active
    ) {
      alarms.push({
        code,
        active:
          true,
        message,
        severity,
      });
    }
  };

  add(
    "DC_OVERVOLTAGE",
    context.limits
      .dcOvervoltage,
    "DC input voltage exceeds the inverter maximum input voltage.",
    "fault",
  );

  add(
    "DC_UNDERVOLTAGE",
    !context.limits
      .dcVoltageAvailable,
    "DC input voltage is below the minimum inverter input voltage.",
    "warning",
  );

  add(
    "START_THRESHOLD_NOT_REACHED",
    context.limits
      .dcVoltageAvailable &&
      !context.limits
        .startVoltageReached,
    "DC voltage has not reached the inverter start threshold.",
    "info",
  );

  add(
    "MPPT_VOLTAGE_OUTSIDE_NORMAL_RANGE",
    context.limits
      .startVoltageReached &&
      !context.limits
        .withinNormalMpptVoltageRange &&
      !context.limits
        .dcOvervoltage,
    "DC voltage is outside the normal MPP voltage range.",
    "warning",
  );

  add(
    "DC_OVERCURRENT",
    context.limits
      .dcOvercurrent,
    "Total DC operating current exceeds the inverter operating-current limit.",
    "warning",
  );

  add(
    "MPPT_OVERCURRENT",
    context.limits
      .mpptOvercurrent,
    "At least one MPPT exceeds its operating-current limit.",
    "warning",
  );

  add(
    "MPPT_SHORT_CIRCUIT_CURRENT_VIOLATION",
    context.limits
      .mpptShortCircuitViolation,
    "At least one MPPT exceeds the specified short-circuit-current limit.",
    "fault",
  );

  add(
    "STRING_SHORT_CIRCUIT_CURRENT_VIOLATION",
    context.limits
      .stringShortCircuitViolation,
    "At least one string exceeds the specified short-circuit-current limit.",
    "fault",
  );

  const acUndervoltage =
    context
      .acLineNeutralVoltageV <
    specification.ac
      .acVoltageMinV;

  const acOvervoltage =
    context
      .acLineNeutralVoltageV >
    specification.ac
      .acVoltageMaxV;

  add(
    "AC_UNDERVOLTAGE",
    acUndervoltage,
    "AC line-to-neutral voltage is below the configured inverter operating range.",
    "fault",
  );

  add(
    "AC_OVERVOLTAGE",
    acOvervoltage,
    "AC line-to-neutral voltage exceeds the configured inverter operating range.",
    "fault",
  );

  const frequencyRange =
    specification.ac
      .frequencyRangesHz
      .find(
        (range) =>
          range.nominalHz ===
          specification.ac
            .ratedPowerFrequencyHz,
      );

  const frequencyViolation =
    !frequencyRange ||
    context.frequencyHz <
      frequencyRange.minHz ||
    context.frequencyHz >
      frequencyRange.maxHz;

  add(
    "FREQUENCY_VIOLATION",
    frequencyViolation,
    "Grid frequency is outside the allowed inverter frequency range.",
    "fault",
  );

  add(
    "AC_OVERCURRENT",
    context.lineCurrentA >
      specification.ac
        .maxOutputCurrentA,
    "AC line current exceeds the inverter maximum output-current rating.",
    "fault",
  );

  add(
    "APPARENT_POWER_LIMIT",
    context.apparentPowerLimited,
    "Requested apparent power exceeds the inverter maximum apparent-power rating.",
    "warning",
  );

  add(
    "CLIPPING",
    context.clippingActive,
    "Available DC power exceeds the inverter deliverable active-power capability.",
    "info",
  );

  add(
    "THD_VIOLATION",
    context.thdPercent !== null &&
      context.thdPercent >
        specification.ac
          .maxThdPercent,
    "AC total harmonic distortion exceeds the inverter specification.",
    "warning",
  );

  add(
    "GRID_UNAVAILABLE",
    !context.gridAvailable,
    "Grid is unavailable.",
    "fault",
  );

  return alarms;
}
