export interface InverterCatalogueInput {
  id?: string | null;

  manufacturer: string;

  series: string;

  model: string;

  inverterType?: string | null;

  topology?: string | null;

  maxGeneratorPowerW: number;

  maxInputVoltageV: number;

  mppVoltageMinV: number;

  mppVoltageMaxV: number;

  ratedInputVoltageV: number;

  minInputVoltageV: number;

  startInputVoltageV: number;

  maxOperatingInputCurrentA:
    number;

  maxOperatingCurrentPerMpptA:
    number;

  maxShortCircuitCurrentPerMpptA:
    number;

  maxShortCircuitCurrentPerStringA:
    number;

  independentMpptInputs:
    number;

  stringsPerMppt:
    number;

  ratedActivePowerW:
    number;

  maxApparentPowerVa:
    number;

  ratedGridVoltageV:
    number;

  maxOutputCurrentA:
    number;

  ratedOutputCurrentA:
    number;

  outputPhases:
    3;

  ratedPowerFactor:
    number;

  maximumEfficiency:
    number;

  europeanEfficiency?:
    number | null;

  maxThdPercent:
    number;

  source?:
    string | null;

  sourceFile?:
    string | null;
}

export interface InverterInputIssue {
  field: string;

  severity:
    | "error"
    | "warning";

  message: string;
}

export function validateInverterInput(
  input:
    InverterCatalogueInput,
): InverterInputIssue[] {
  const issues:
    InverterInputIssue[] =
    [];

  const positive = (
    field:
      keyof InverterCatalogueInput,

    value:
      unknown,
  ) => {
    if (
      typeof value !==
        "number" ||
      !Number.isFinite(
        value,
      ) ||
      value <= 0
    ) {
      issues.push({
        field:
          String(
            field,
          ),

        severity:
          "error",

        message:
          `${String(
            field,
          )} must be a positive number.`,
      });
    }
  };

  if (
    !input.manufacturer
      .trim()
  ) {
    issues.push({
      field:
        "manufacturer",

      severity:
        "error",

      message:
        "Manufacturer is required.",
    });
  }

  if (
    !input.model
      .trim()
  ) {
    issues.push({
      field:
        "model",

      severity:
        "error",

      message:
        "Model is required.",
    });
  }

  positive(
    "maxGeneratorPowerW",
    input.maxGeneratorPowerW,
  );

  positive(
    "maxInputVoltageV",
    input.maxInputVoltageV,
  );

  positive(
    "ratedActivePowerW",
    input.ratedActivePowerW,
  );

  positive(
    "maxApparentPowerVa",
    input.maxApparentPowerVa,
  );

  if (
    input.mppVoltageMinV >=
    input.mppVoltageMaxV
  ) {
    issues.push({
      field:
        "mppVoltageMinV",

      severity:
        "error",

      message:
        "MPP minimum voltage must be below MPP maximum voltage.",
    });
  }

  if (
    input.startInputVoltageV <
    input.minInputVoltageV
  ) {
    issues.push({
      field:
        "startInputVoltageV",

      severity:
        "warning",

      message:
        "Start voltage is below minimum input voltage. Verify the datasheet.",
    });
  }

  if (
    input.ratedInputVoltageV <
      input.mppVoltageMinV ||
    input.ratedInputVoltageV >
      input.mppVoltageMaxV
  ) {
    issues.push({
      field:
        "ratedInputVoltageV",

      severity:
        "warning",

      message:
        "Rated input voltage lies outside the stated MPP window.",
    });
  }

  if (
    input.maximumEfficiency <=
      0 ||
    input.maximumEfficiency >
      1
  ) {
    issues.push({
      field:
        "maximumEfficiency",

      severity:
        "error",

      message:
        "Efficiency must be represented as a fraction between 0 and 1.",
    });
  }

  if (
    input.maxApparentPowerVa <
    input.ratedActivePowerW *
      input.ratedPowerFactor
  ) {
    issues.push({
      field:
        "maxApparentPowerVa",

      severity:
        "warning",

      message:
        "Apparent-power rating is inconsistent with active power and power factor.",
    });
  }

  return issues;
}
