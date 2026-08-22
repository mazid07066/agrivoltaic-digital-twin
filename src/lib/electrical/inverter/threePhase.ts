const SQRT_3 = Math.sqrt(3);

function assertPositive(
  value: number,
  name: string,
): void {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${name} must be a positive finite number.`,
    );
  }
}

export function lineCurrentFromThreePhasePower(
  activePowerKw: number,
  lineLineVoltageV: number,
  powerFactor: number,
): number {
  if (
    !Number.isFinite(activePowerKw) ||
    activePowerKw < 0
  ) {
    throw new Error(
      "Active power must be a non-negative finite number.",
    );
  }

  assertPositive(
    lineLineVoltageV,
    "Line-to-line voltage",
  );

  if (
    !Number.isFinite(powerFactor) ||
    powerFactor <= 0 ||
    powerFactor > 1
  ) {
    throw new Error(
      "Power factor must be greater than 0 and no greater than 1.",
    );
  }

  return (
    activePowerKw * 1000
  ) / (
    SQRT_3 *
    lineLineVoltageV *
    powerFactor
  );
}

export function apparentPowerFromActivePower(
  activePowerKw: number,
  powerFactor: number,
): number {
  if (
    !Number.isFinite(activePowerKw) ||
    activePowerKw < 0
  ) {
    throw new Error(
      "Active power must be a non-negative finite number.",
    );
  }

  if (
    !Number.isFinite(powerFactor) ||
    powerFactor <= 0 ||
    powerFactor > 1
  ) {
    throw new Error(
      "Power factor must be greater than 0 and no greater than 1.",
    );
  }

  return activePowerKw / powerFactor;
}

export function reactivePowerFromActivePower(
  activePowerKw: number,
  powerFactor: number,
): number {
  const apparentPowerKva =
    apparentPowerFromActivePower(
      activePowerKw,
      powerFactor,
    );

  return Math.sqrt(
    Math.max(
      0,
      apparentPowerKva ** 2 -
        activePowerKw ** 2,
    ),
  );
}

export function lineLineVoltageFromLineNeutral(
  lineNeutralVoltageV: number,
): number {
  assertPositive(
    lineNeutralVoltageV,
    "Line-to-neutral voltage",
  );

  return (
    SQRT_3 *
    lineNeutralVoltageV
  );
}
