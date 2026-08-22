export interface AcBusDefinition {
  lineNeutralVoltageV: number;

  lineLineVoltageV: number;

  phases: 3;

  frequencyHz: number;
}

export function createThreePhaseAcBus(
  lineNeutralVoltageV = 230,
  lineLineVoltageV = 400,
  frequencyHz = 50,
): AcBusDefinition {
  const values = [
    lineNeutralVoltageV,
    lineLineVoltageV,
    frequencyHz,
  ];

  if (
    values.some(
      (value) =>
        !Number.isFinite(
          value,
        ) ||
        value <= 0,
    )
  ) {
    throw new Error(
      "AC bus voltage and frequency values must be positive finite numbers.",
    );
  }

  return {
    lineNeutralVoltageV,

    lineLineVoltageV,

    phases:
      3,

    frequencyHz,
  };
}
