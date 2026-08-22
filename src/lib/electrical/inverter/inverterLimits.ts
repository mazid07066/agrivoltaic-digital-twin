import type {
  InverterDcInput,
  InverterOperatingState,
  InverterSpecification,
} from "./types";

export interface InverterLimitEvaluation {
  state:
    InverterOperatingState;

  dcVoltageAvailable:
    boolean;

  startVoltageReached:
    boolean;

  withinNormalMpptVoltageRange:
    boolean;

  dcOvervoltage:
    boolean;

  dcOvercurrent:
    boolean;

  mpptOvercurrent:
    boolean;

  mpptShortCircuitViolation:
    boolean;

  stringShortCircuitViolation:
    boolean;
}

function finiteValue(
  value: number | null,
): number | null {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : null;
}

export function evaluateInverterDcLimits(
  input: InverterDcInput,
  specification: InverterSpecification,
): InverterLimitEvaluation {
  const voltage =
    finiteValue(
      input.voltageV.value,
    );

  const current =
    finiteValue(
      input.currentA.value,
    );

  const dcOvervoltage =
    voltage !== null &&
    voltage >
      specification.dc
        .maxInputVoltageV;

  const dcVoltageAvailable =
    voltage !== null &&
    voltage >=
      specification.dc
        .minInputVoltageV;

  const startVoltageReached =
    voltage !== null &&
    voltage >=
      specification.dc
        .startInputVoltageV;

  const withinNormalMpptVoltageRange =
    voltage !== null &&
    voltage >=
      specification.dc
        .mppVoltageMinV &&
    voltage <=
      specification.dc
        .mppVoltageMaxV;

  const dcOvercurrent =
    current !== null &&
    current >
      specification.dc
        .maxOperatingInputCurrentA;

  const mpptOvercurrent =
    input.mppts.some(
      (mppt) =>
        mppt.currentA.value !== null &&
        Number.isFinite(
          mppt.currentA.value,
        ) &&
        mppt.currentA.value >
          specification.dc
            .maxOperatingCurrentPerMpptA,
    );

  const mpptShortCircuitViolation =
    input.mppts.some(
      (mppt) =>
        mppt.shortCircuitCurrentA
          .value !== null &&
        Number.isFinite(
          mppt.shortCircuitCurrentA
            .value,
        ) &&
        mppt.shortCircuitCurrentA
          .value >
          specification.dc
            .maxShortCircuitCurrentPerMpptA,
    );

  const stringShortCircuitViolation =
    input.mppts.some(
      (mppt) =>
        mppt.strings.some(
          (string) =>
            string
              .shortCircuitCurrentA
              .value !== null &&
            Number.isFinite(
              string
                .shortCircuitCurrentA
                .value,
            ) &&
            string
              .shortCircuitCurrentA
              .value >
              specification.dc
                .maxShortCircuitCurrentPerStringA,
        ),
    );

  const protectionFault =
    dcOvervoltage ||
    mpptShortCircuitViolation ||
    stringShortCircuitViolation;

  let state:
    InverterOperatingState;

  if (
    voltage === null ||
    voltage <
      specification.dc
        .minInputVoltageV
  ) {
    state =
      "OFF";
  } else if (
    voltage <
      specification.dc
        .startInputVoltageV
  ) {
    state =
      "WAITING_FOR_START";
  } else if (
    protectionFault
  ) {
    state =
      "FAULT";
  } else if (
    dcOvercurrent ||
    mpptOvercurrent
  ) {
    state =
      "DERATED";
  } else {
    state =
      "MPPT_ACTIVE";
  }

  return {
    state,

    dcVoltageAvailable,

    startVoltageReached,

    withinNormalMpptVoltageRange,

    dcOvervoltage,

    dcOvercurrent,

    mpptOvercurrent,

    mpptShortCircuitViolation,

    stringShortCircuitViolation,
  };
}
