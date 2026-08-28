import type {
  InverterDcInput,
  InverterMpptInput,
  InverterSpecification,
  InverterStringInput,
} from "./types";

import {
  createBalancedMpptAllocation,
  resolveMpptAllocation,
} from "../mpptAllocation";

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

export interface DesignedDcTopologyInput {
  availablePowerKw: number;
  moduleCount: number;
  modulesPerString: number;
  stringsPerMppt: number;
  inverterCount: number;

  /**
   * Explicit physical strings assigned to each identical
   * inverter. Omitted for legacy inferred designs.
   */
  stringsPerInverter?: number;

  /** Exact per-inverter allocation in MPPT order. */
  mpptStringAllocation?: number[];

  moduleVmppV: number;
  moduleTemperatureC: number;
  voltageTemperatureCoefficientPercentPerC: number;
}

function requirePositiveInteger(
  value: number,
  label: string,
): void {
  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      `${label} must be a positive integer.`,
    );
  }
}

/**
 * Creates a DC input from an accepted physical string design.
 *
 * Aggregate simulated PV power is distributed according to
 * the actual number of complete strings assigned across the
 * available inverter MPPT channels.
 *
 * String voltage is derived from selected-module Vmpp and
 * the hourly simulated module temperature. Because the
 * catalogue currently has no separate Vmpp temperature
 * coefficient, the documented voltage coefficient is used
 * as the bounded engineering approximation.
 *
 * Short-circuit current remains null here: hourly Isc cannot
 * be recovered accurately from aggregate PV power. Design
 * Isc is evaluated separately by compatibility.ts.
 */
export function createDesignedDcInput(
  input: DesignedDcTopologyInput,
  specification: InverterSpecification,
): InverterDcInput {
  requireNonNegativeFinite(
    input.availablePowerKw,
    "Available DC power",
  );

  requirePositiveInteger(
    input.moduleCount,
    "Module count",
  );

  requirePositiveInteger(
    input.modulesPerString,
    "Modules per string",
  );

  requirePositiveInteger(
    input.stringsPerMppt,
    "Strings per MPPT",
  );

  requirePositiveInteger(
    input.inverterCount,
    "Inverter count",
  );

  if (input.stringsPerInverter !== undefined) {
    requirePositiveInteger(
      input.stringsPerInverter,
      "Strings per inverter",
    );
  }

  requirePositiveFinite(
    input.moduleVmppV,
    "Module Vmpp",
  );

  if (
    !Number.isFinite(
      input.moduleTemperatureC,
    )
  ) {
    throw new Error(
      "Module temperature must be finite.",
    );
  }

  if (
    !Number.isFinite(
      input.voltageTemperatureCoefficientPercentPerC,
    )
  ) {
    throw new Error(
      "Voltage temperature coefficient must be finite.",
    );
  }

  if (
    input.stringsPerMppt >
    specification.dc.stringsPerMppt
  ) {
    throw new Error(
      `Strings per MPPT exceeds the inverter limit of ${specification.dc.stringsPerMppt}.`,
    );
  }

  const totalStringCount =
    input.stringsPerInverter !== undefined
      ? input.stringsPerInverter *
        input.inverterCount
      : Math.floor(
          input.moduleCount /
          input.modulesPerString,
        );

  if (totalStringCount < 1) {
    throw new Error(
      "The design does not contain a complete string.",
    );
  }

  const assignedModuleCount =
    totalStringCount *
    input.modulesPerString;

  if (assignedModuleCount > input.moduleCount) {
    throw new Error(
      `The chosen topology requires ${assignedModuleCount} modules but only ${input.moduleCount} are installed.`,
    );
  }

  const plantMpptCount =
    input.inverterCount *
    specification.dc.independentMpptInputs;

  const maximumStringCapacity =
    plantMpptCount *
    input.stringsPerMppt;

  if (
    totalStringCount >
    maximumStringCapacity
  ) {
    throw new Error(
      `The design requires ${totalStringCount} strings but the configured plant supports ${maximumStringCapacity}.`,
    );
  }

  const voltageFactor =
    1 +
    (
      input
        .voltageTemperatureCoefficientPercentPerC /
      100
    ) *
    (
      input.moduleTemperatureC -
      25
    );

  const operatingStringVoltageV =
    input.modulesPerString *
    input.moduleVmppV *
    voltageFactor;

  if (
    input.availablePowerKw > 0 &&
    (
      !Number.isFinite(
        operatingStringVoltageV,
      ) ||
      operatingStringVoltageV <= 0
    )
  ) {
    throw new Error(
      "Calculated operating string voltage must be positive.",
    );
  }

  /*
   * Modules outside complete strings are electrically
   * unassigned and therefore cannot contribute to the
   * designed inverter input.
   */
  const assignedPowerFraction =
    assignedModuleCount /
    input.moduleCount;

  const designedAvailablePowerKw =
    input.availablePowerKw *
    assignedPowerFraction;

  const powerPerStringKw =
    designedAvailablePowerKw /
    totalStringCount;

  const currentPerStringA =
    designedAvailablePowerKw > 0
      ? (
          powerPerStringKw *
          1000
        ) /
        operatingStringVoltageV
      : 0;

  const mpptCountPerInverter =
    specification.dc.independentMpptInputs;

  const perInverterAllocation =
    input.stringsPerInverter !== undefined
      ? resolveMpptAllocation(
          input.mpptStringAllocation,
          {
            mpptCount:
              mpptCountPerInverter,
            totalStrings:
              input.stringsPerInverter,
            maximumStringsPerMppt:
              specification.dc.stringsPerMppt,
          },
        )
      : null;

  const plantAllocation =
    perInverterAllocation === null
      ? createBalancedMpptAllocation(
          totalStringCount,
          plantMpptCount,
        )
      : null;

  const mppts: InverterMpptInput[] =
    Array.from(
      {
        length:
          plantMpptCount,
      },
      (
        _,
        mpptIndexZeroBased,
      ) => {
        const allocationChannelIndex =
          mpptIndexZeroBased %
          mpptCountPerInverter;

        const assignedStrings =
          perInverterAllocation
            ? perInverterAllocation[
                allocationChannelIndex
              ] ?? 0
            : plantAllocation?.[
                mpptIndexZeroBased
              ] ?? 0;

        if (
          assignedStrings >
          input.stringsPerMppt
        ) {
          throw new Error(
            "Balanced MPPT assignment exceeds the accepted strings-per-MPPT design.",
          );
        }

        const strings:
          InverterStringInput[] =
          Array.from(
            {
              length:
                assignedStrings,
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
                  currentPerStringA,

                provenance:
                  "derived",

                note:
                  "Derived from assigned aggregate PV power and temperature-adjusted string Vmpp; not measured telemetry.",
              },

              shortCircuitCurrentA: {
                value:
                  null,

                provenance:
                  "derived",

                note:
                  "Hourly string Isc is intentionally unavailable; design Isc is evaluated by the compatibility engine.",
              },

              powerKw: {
                value:
                  powerPerStringKw,

                provenance:
                  "derived",

                note:
                  "Aggregate simulated PV power allocated equally across complete physical strings.",
              },
            }),
          );

        const mpptPowerKw =
          assignedStrings *
          powerPerStringKw;

        const mpptCurrentA =
          assignedStrings *
          currentPerStringA;

        const operating =
          assignedStrings > 0 &&
          designedAvailablePowerKw > 0;

        return {
          mpptIndex:
            mpptIndexZeroBased +
            1,

          voltageV: {
            value:
              operating
                ? operatingStringVoltageV
                : null,

            provenance:
              "calculated",

            note:
              assignedStrings > 0
                ? "Calculated from modules per string, module Vmpp and hourly module temperature."
                : "No string is assigned to this MPPT channel.",
          },

          currentA: {
            value:
              mpptCurrentA,

            provenance:
              "derived",

            note:
              assignedStrings > 0
                ? `Sum of ${assignedStrings} assigned string current(s).`
                : "No string is assigned to this MPPT channel.",
          },

          shortCircuitCurrentA: {
            value:
              null,

            provenance:
              "derived",

            note:
              "Operational Isc is not inferred from aggregate PV power.",
          },

          powerKw: {
            value:
              mpptPowerKw,

            provenance:
              "derived",

            note:
              assignedStrings > 0
                ? `Power from ${assignedStrings} assigned string(s).`
                : "No string is assigned to this MPPT channel.",
          },

          strings,
        };
      },
    );

  const totalCurrentA =
    designedAvailablePowerKw > 0
      ? (
          designedAvailablePowerKw *
          1000
        ) /
        operatingStringVoltageV
      : 0;

  return {
    availablePowerKw: {
      value:
        designedAvailablePowerKw,

      provenance:
        "calculated",

      note:
        assignedModuleCount ===
        input.moduleCount
          ? "All configured modules are assigned to complete strings."
          : `${input.moduleCount - assignedModuleCount} module(s) are excluded because they do not form a complete string.`,
    },

    requestedPowerKw: {
      value:
        designedAvailablePowerKw,

      provenance:
        "derived",

      note:
        "Requested power from modules assigned to the accepted string design.",
    },

    voltageV: {
      value:
        designedAvailablePowerKw > 0
          ? operatingStringVoltageV
          : 0,

      provenance:
        "calculated",

      note:
        "Temperature-adjusted operating string Vmpp; no inverter rated-voltage assumption is used.",
    },

    currentA: {
      value:
        totalCurrentA,

      provenance:
        "derived",

      note:
        "Total designed DC power divided by calculated operating string voltage.",
    },

    mppts,
  };
}
