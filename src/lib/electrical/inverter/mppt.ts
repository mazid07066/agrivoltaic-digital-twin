import type {
  InverterDcInput,
  InverterMpptInput,
  InverterSpecification,
  InverterStringInput,
} from "./types";

export interface DemonstrationMpptAllocationInput {
  availablePowerKw:
    number;

  requestedPowerKw?:
    number;

  dcVoltageV?:
    number;

  activeMpptCount?:
    number;
}

function requireNonNegativeFinite(
  value:
    number,
  label:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative finite number.`,
    );
  }
}

function requirePositiveFinite(
  value:
    number,
  label:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <= 0
  ) {
    throw new Error(
      `${label} must be a positive finite number.`,
    );
  }
}

/**
 * Creates an explicitly assumed / derived DC topology from
 * aggregate PV power.
 *
 * This is a Phase 9E demonstration allocation only.
 *
 * It does NOT represent measured string or MPPT telemetry.
 *
 * Assumptions:
 * - common MPPT voltage
 * - equal power allocation among active MPPTs
 * - equal power allocation among strings on each active MPPT
 * - no fabricated Isc values
 *
 * Future physical telemetry can replace this allocation
 * without changing the inverter model contract.
 */
export function createDemonstrationDcInput(
  input:
    DemonstrationMpptAllocationInput,

  specification:
    InverterSpecification,
): InverterDcInput {
  requireNonNegativeFinite(
    input.availablePowerKw,
    "Available DC power",
  );

  const requestedPowerKw =
    input.requestedPowerKw ??
    input.availablePowerKw;

  requireNonNegativeFinite(
    requestedPowerKw,
    "Requested DC power",
  );

  const dcVoltageV =
    input.dcVoltageV ??
    (
      input.availablePowerKw > 0
        ? specification.dc
            .ratedInputVoltageV
        : 0
    );

  if (
    input.dcVoltageV !==
    undefined
  ) {
    requirePositiveFinite(
      dcVoltageV,
      "DC voltage",
    );
  } else {
    requireNonNegativeFinite(
      dcVoltageV,
      "DC voltage",
    );
  }

  const maximumMpptCount =
    specification.dc
      .independentMpptInputs;

  const activeMpptCount =
    input.activeMpptCount ??
    maximumMpptCount;

  if (
    !Number.isInteger(
      activeMpptCount,
    ) ||
    activeMpptCount < 1 ||
    activeMpptCount >
      maximumMpptCount
  ) {
    throw new Error(
      `Active MPPT count must be an integer between 1 and ${maximumMpptCount}.`,
    );
  }

  const boundedRequestedPowerKw =
    Math.min(
      requestedPowerKw,
      input.availablePowerKw,
    );

  const totalCurrentA =
    boundedRequestedPowerKw >
    0
      ? (
          boundedRequestedPowerKw *
          1000
        ) /
        dcVoltageV
      : 0;

  const powerPerActiveMpptKw =
    boundedRequestedPowerKw /
    activeMpptCount;

  const currentPerActiveMpptA =
    totalCurrentA /
    activeMpptCount;

  const stringsPerMppt =
    specification.dc
      .stringsPerMppt;

  const powerPerStringKw =
    powerPerActiveMpptKw /
    stringsPerMppt;

  const currentPerStringA =
    currentPerActiveMpptA /
    stringsPerMppt;

  const mppts:
    InverterMpptInput[] =
    Array.from(
      {
        length:
          maximumMpptCount,
      },
      (
        _,
        mpptIndexZeroBased,
      ) => {
        const active =
          mpptIndexZeroBased <
          activeMpptCount;

        const strings:
          InverterStringInput[] =
          Array.from(
            {
              length:
                stringsPerMppt,
            },
            (
              __,
              stringIndexZeroBased,
            ) => ({
              stringIndex:
                stringIndexZeroBased +
                1,

              currentA: {
                value:
                  active
                    ? currentPerStringA
                    : 0,

                provenance:
                  "demonstration_allocation",

                note:
                  "Derived from equal allocation of aggregate PV power; not measured string current.",
              },

              shortCircuitCurrentA: {
                value:
                  null,

                provenance:
                  "demonstration_allocation",

                note:
                  "String Isc is unavailable from aggregate PV power and is intentionally not fabricated.",
              },

              powerKw: {
                value:
                  active
                    ? powerPerStringKw
                    : 0,

                provenance:
                  "demonstration_allocation",

                note:
                  "Equal string power allocation for the Phase 9E demonstration topology.",
              },
            }),
          );

        return {
          mpptIndex:
            mpptIndexZeroBased +
            1,

          voltageV: {
            value:
              active
                ? dcVoltageV
                : null,

            provenance:
              "demonstration_allocation",

            note:
              active
                ? "Uses the explicit Phase 9E common DC-voltage assumption."
                : "Inactive MPPT.",
          },

          currentA: {
            value:
              active
                ? currentPerActiveMpptA
                : 0,

            provenance:
              "demonstration_allocation",

            note:
              "Derived from equal aggregate-power allocation across active MPPT inputs.",
          },

          shortCircuitCurrentA: {
            value:
              null,

            provenance:
              "demonstration_allocation",

            note:
              "MPPT Isc is unavailable from aggregate PV power and is intentionally not fabricated.",
          },

          powerKw: {
            value:
              active
                ? powerPerActiveMpptKw
                : 0,

            provenance:
              "demonstration_allocation",

            note:
              "Equal power allocation across active MPPT inputs.",
          },

          strings,
        };
      },
    );

  return {
    availablePowerKw: {
      value:
        input.availablePowerKw,

      provenance:
        "calculated",

      note:
        "Aggregate PV power supplied by the upstream AgriTwin simulation.",
    },

    requestedPowerKw: {
      value:
        boundedRequestedPowerKw,

      provenance:
        "derived",

      note:
        "Requested inverter DC power bounded by available aggregate PV power.",
    },

    voltageV: {
      value:
        dcVoltageV,

      provenance:
        "assumed",

      note:
        input.dcVoltageV ===
        undefined
          ? (
              input.availablePowerKw > 0
                ? "Uses the supplied inverter rated input voltage of 670 V as the Phase 9E demonstration assumption."
                : "Uses 0 V when aggregate PV power is zero so the demonstration inverter remains off."
            )
          : "Uses an explicitly supplied Phase 9E demonstration DC voltage.",
    },

    currentA: {
      value:
        totalCurrentA,

      provenance:
        "derived",

      note:
        "Derived from aggregate requested DC power divided by the assumed DC voltage.",
    },

    mppts,
  };
}
