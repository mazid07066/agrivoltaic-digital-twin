import type {
  InverterSpecification,
} from "./inverter/types";

import type {
  PVModuleProfile,
} from "@/lib/pv/moduleProfiles";

export interface StringDesignInput {
  module: PVModuleProfile;
  inverter: InverterSpecification;
  moduleCount: number;
  minimumDesignTemperatureC: number | null;
  maximumDesignCellTemperatureC: number | null;
  bifacialCurrentFactor: number | null;
}

export interface MpptStringAssignment {
  inverterIndex: number;
  mpptIndex: number;
  stringCount: number;
  modulesPerString: number;
}

export interface StringDesignCandidate {
  modulesPerString: number;
  totalStrings: number;
  stringsPerMppt: number;
  inverterCount: number;
  assignedModules: number;
  unassignedModules: number;
  inverterLoadingRatio: number;
  stringVocColdV: number;
  stringVmppHotV: number;
  stringVmppColdV: number;
  designIscHotA: number;
  voltageMarginV: number;
  fuseRequired: boolean;
  assignments: MpptStringAssignment[];
}

export interface StringDesignRecommendation {
  schema: "agritwin-string-design-v1";
  status:
    | "PASS"
    | "WARNING"
    | "FAIL"
    | "NOT_EVALUATED";
  reasons: string[];
  feasibleModulesPerString: number[];
  maximumStringsPerMppt: number | null;
  selected: StringDesignCandidate | null;
  candidates: StringDesignCandidate[];
}

function unavailable(
  reasons: string[],
): StringDesignRecommendation {
  return {
    schema: "agritwin-string-design-v1",
    status: "NOT_EVALUATED",
    reasons,
    feasibleModulesPerString: [],
    maximumStringsPerMppt: null,
    selected: null,
    candidates: [],
  };
}

function createAssignments({
  totalStrings,
  inverterCount,
  mpptCount,
  modulesPerString,
}: {
  totalStrings: number;
  inverterCount: number;
  mpptCount: number;
  modulesPerString: number;
}): MpptStringAssignment[] {
  const channelCount =
    inverterCount * mpptCount;

  const base =
    Math.floor(totalStrings / channelCount);

  const remainder =
    totalStrings % channelCount;

  return Array.from(
    { length: channelCount },
    (_, index) => ({
      inverterIndex:
        Math.floor(index / mpptCount) + 1,

      mpptIndex:
        index % mpptCount + 1,

      stringCount:
        base + (index < remainder ? 1 : 0),

      modulesPerString,
    }),
  );
}

export function recommendPVStringDesign({
  module: pvModule,
  inverter,
  moduleCount,
  minimumDesignTemperatureC,
  maximumDesignCellTemperatureC,
  bifacialCurrentFactor,
}: StringDesignInput): StringDesignRecommendation {
  const reasons: string[] = [];

  if (
    !Number.isInteger(moduleCount) ||
    moduleCount < 1
  ) {
    reasons.push(
      "A positive integer module count is required.",
    );
  }

  if (minimumDesignTemperatureC === null) {
    reasons.push(
      "Minimum design temperature is required.",
    );
  }

  if (maximumDesignCellTemperatureC === null) {
    reasons.push(
      "Maximum design cell temperature is required.",
    );
  }

  if (
    bifacialCurrentFactor === null ||
    !Number.isFinite(bifacialCurrentFactor) ||
    bifacialCurrentFactor < 1
  ) {
    reasons.push(
      "A bifacial current factor of at least 1 is required.",
    );
  }

  if (
    pvModule.vocV === null ||
    pvModule.vmppV === null ||
    pvModule.iscA === null ||
    pvModule.imppA === null ||
    pvModule.tempCoeffVocPercentPerC === null ||
    pvModule.tempCoeffIscPercentPerC === null
  ) {
    reasons.push(
      "The selected module lacks required Voc, Vmpp, Isc, Impp or temperature-coefficient data.",
    );
  }

  if (reasons.length > 0) {
    return unavailable(reasons);
  }

  const minimumTemperature =
    minimumDesignTemperatureC as number;

  const maximumCellTemperature =
    maximumDesignCellTemperatureC as number;

  const currentFactor =
    bifacialCurrentFactor as number;

  const vocStc =
    pvModule.vocV as number;

  const vmppStc =
    pvModule.vmppV as number;

  const iscStc =
    pvModule.iscA as number;

  const imppStc =
    pvModule.imppA as number;

  const voltageCoefficient =
    pvModule.tempCoeffVocPercentPerC as number;

  const currentCoefficient =
    pvModule.tempCoeffIscPercentPerC as number;

  const vocCold =
    vocStc *
    (
      1 +
      voltageCoefficient /
        100 *
        (minimumTemperature - 25)
    );

  const vmppCold =
    vmppStc *
    (
      1 +
      voltageCoefficient /
        100 *
        (minimumTemperature - 25)
    );

  const vmppHot =
    vmppStc *
    (
      1 +
      voltageCoefficient /
        100 *
        (maximumCellTemperature - 25)
    );

  const designIscHot =
    iscStc *
    (
      1 +
      currentCoefficient /
        100 *
        (maximumCellTemperature - 25)
    ) *
    currentFactor;

  /*
   * Operating-current checks use module Impp with the
   * configured bifacial current factor. Temperature-adjusted
   * Isc is reserved for short-circuit checks.
   */
  const operatingCurrentPerString =
    imppStc *
    currentFactor;

  const parsedModuleVoltage =
    Number.parseFloat(
      pvModule.maxSystemVoltage,
    );

  const maximumSystemVoltage =
    Number.isFinite(parsedModuleVoltage)
      ? Math.min(
          parsedModuleVoltage,
          inverter.dc.maxInputVoltageV,
        )
      : inverter.dc.maxInputVoltageV;

  /*
   * The STC MPPT window defines the recommended nominal
   * string range. Hot/cold Vmpp values remain available as
   * advisory engineering outputs and ranking margins.
   *
   * Cold-condition Voc remains an absolute hard limit.
   */
  const minimumModulesPerString =
    Math.ceil(
      inverter.dc.mppVoltageMinV /
        vmppStc,
    );

  const maximumModulesByVoc =
    Math.floor(
      maximumSystemVoltage /
        vocCold,
    );

  const maximumModulesByMppt =
    Math.floor(
      inverter.dc.mppVoltageMaxV /
        vmppStc,
    );

  const maximumModulesPerString =
    Math.min(
      maximumModulesByVoc,
      maximumModulesByMppt,
    );

  const maximumStringsPerMppt =
    Math.min(
      inverter.dc.stringsPerMppt,
      Math.floor(
        inverter.dc
          .maxOperatingCurrentPerMpptA /
          operatingCurrentPerString,
      ),
      Math.floor(
        inverter.dc
          .maxShortCircuitCurrentPerMpptA /
          designIscHot,
      ),
    );

  if (
    minimumModulesPerString >
      maximumModulesPerString ||
    maximumStringsPerMppt < 1
  ) {
    return {
      schema: "agritwin-string-design-v1",
      status: "FAIL",
      reasons: [
        "No string design satisfies the voltage and MPPT-current constraints.",
      ],
      feasibleModulesPerString: [],
      maximumStringsPerMppt,
      selected: null,
      candidates: [],
    };
  }

  const candidates:
    StringDesignCandidate[] = [];

  for (
    let modulesPerString =
      minimumModulesPerString;
    modulesPerString <=
      maximumModulesPerString;
    modulesPerString += 1
  ) {
    const totalStrings =
      Math.floor(
        moduleCount /
          modulesPerString,
      );

    if (totalStrings < 1) {
      continue;
    }

    const unassignedModules =
      moduleCount %
      modulesPerString;

    const maximumStringsPerInverter =
      inverter.dc.independentMpptInputs *
      maximumStringsPerMppt;

    const inverterCount =
      Math.ceil(
        totalStrings /
          maximumStringsPerInverter,
      );

    const assignments =
      createAssignments({
        totalStrings,
        inverterCount,
        mpptCount:
          inverter.dc
            .independentMpptInputs,
        modulesPerString,
      });

    const actualStringsPerMppt =
      Math.max(
        ...assignments.map(
          (assignment) =>
            assignment.stringCount,
        ),
      );

    if (
      actualStringsPerMppt >
      maximumStringsPerMppt
    ) {
      continue;
    }

    const inverterStringCounts =
      Array.from(
        { length: inverterCount },
        (_, index) =>
          assignments
            .filter(
              (assignment) =>
                assignment.inverterIndex ===
                index + 1,
            )
            .reduce(
              (sum, assignment) =>
                sum +
                assignment.stringCount,
              0,
            ),
      );

    const perInverterValid =
      inverterStringCounts.every(
        (stringCount) =>
          stringCount *
            modulesPerString *
            pvModule.pmaxW <=
            inverter.dc
              .maxGeneratorPowerW &&
          stringCount *
            operatingCurrentPerString <=
            inverter.dc
              .maxOperatingInputCurrentA,
      );

    if (!perInverterValid) {
      continue;
    }

    const assignedModules =
      totalStrings *
      modulesPerString;

    const inverterLoadingRatio =
      assignedModules *
      pvModule.pmaxW /
      (
        inverterCount *
        inverter.ac
          .ratedActivePowerW
      );

    const stringVocColdV =
      modulesPerString *
      vocCold;

    const stringVmppHotV =
      modulesPerString *
      vmppHot;

    const stringVmppColdV =
      modulesPerString *
      vmppCold;

    const voltageMarginV =
      Math.min(
        maximumSystemVoltage -
          stringVocColdV,
        stringVmppHotV -
          inverter.dc
            .mppVoltageMinV,
        inverter.dc.mppVoltageMaxV -
          stringVmppColdV,
      );

    candidates.push({
      modulesPerString,
      totalStrings,
      stringsPerMppt:
        actualStringsPerMppt,
      inverterCount,
      assignedModules,
      unassignedModules,
      inverterLoadingRatio,
      stringVocColdV,
      stringVmppHotV,
      stringVmppColdV,
      designIscHotA:
        designIscHot,
      voltageMarginV,
      fuseRequired:
        actualStringsPerMppt >= 3,
      assignments,
    });
  }

  candidates.sort(
    (left, right) =>
      (
        left.unassignedModules === 0
          ? 0
          : 1
      ) -
        (
          right.unassignedModules === 0
            ? 0
            : 1
        ) ||
      left.inverterCount -
        right.inverterCount ||
      left.unassignedModules -
        right.unassignedModules ||
      Math.abs(
        left.inverterLoadingRatio -
          1.25,
      ) -
        Math.abs(
          right.inverterLoadingRatio -
            1.25,
        ) ||
      right.voltageMarginV -
        left.voltageMarginV,
  );

  const selected =
    candidates[0] ?? null;

  if (selected === null) {
    return {
      schema: "agritwin-string-design-v1",
      status: "FAIL",
      reasons: [
        "No complete inverter and MPPT assignment satisfies all constraints.",
      ],
      feasibleModulesPerString:
        Array.from(
          {
            length:
              maximumModulesPerString -
              minimumModulesPerString +
              1,
          },
          (_, index) =>
            minimumModulesPerString +
            index,
        ),
      maximumStringsPerMppt,
      selected: null,
      candidates: [],
    };
  }

  const exactAllocation =
    selected.unassignedModules === 0;

  const recommendedIlr =
    selected.inverterLoadingRatio >=
      1.1 &&
    selected.inverterLoadingRatio <=
      1.35;

  return {
    schema: "agritwin-string-design-v1",
    status:
      exactAllocation &&
      recommendedIlr
        ? "PASS"
        : "WARNING",
    reasons: [
      exactAllocation
        ? "Every physical module is assigned to a complete string."
        : `${selected.unassignedModules} module(s) remain unassigned.`,
      recommendedIlr
        ? "Inverter loading ratio is within 1.10 to 1.35."
        : "Inverter loading ratio is outside 1.10 to 1.35.",
    ],
    feasibleModulesPerString:
      Array.from(
        {
          length:
            maximumModulesPerString -
            minimumModulesPerString +
            1,
        },
        (_, index) =>
          minimumModulesPerString +
          index,
      ),
    maximumStringsPerMppt,
    selected,
    candidates,
  };
}
