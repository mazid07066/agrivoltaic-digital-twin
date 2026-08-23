import type {
  InverterSpecification,
} from "./inverter/types";

import type {
  PVModuleProfile,
} from "@/lib/pv/moduleProfiles";

export type EquipmentCompatibilityStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "NOT_EVALUATED";

export interface EquipmentCompatibilityCheck {
  id: string;
  label: string;
  status: EquipmentCompatibilityStatus;
  actual: number | null;
  limit: number | null;
  unit: string | null;
  message: string;
}

export interface PVInverterCompatibilityInput {
  module: PVModuleProfile;
  inverter: InverterSpecification;
  moduleCount: number | null;
  modulesPerString: number | null;
  stringsPerMppt: number | null;
  minimumDesignTemperatureC: number | null;
  maximumDesignCellTemperatureC?: number | null;
  bifacialCurrentFactor?: number | null;
  inverterCount?: number | null;
}

export interface PVInverterCompatibilityReport {
  schema: "agritwin-pv-inverter-compatibility-v1";
  status: EquipmentCompatibilityStatus;
  moduleProfileId: string;
  inverterSpecificationId: string;
  calculations: {
    totalArrayPowerW: number | null;
    inverterCount: number | null;
    totalAcCapacityW: number | null;
    totalStringCount: number | null;
    stringVmppV: number | null;
    stringVmppHotV: number | null;
    stringVmppColdV: number | null;
    stringVocStcV: number | null;
    stringVocColdV: number | null;
    stringIscA: number | null;
    designIscHotA: number | null;
    mpptImppA: number | null;
    mpptIscA: number | null;
    mpptDesignCurrentA: number | null;
    totalImppA: number | null;
    inverterLoadingRatio: number | null;
  };
  checks: EquipmentCompatibilityCheck[];
}

function positiveInteger(
  value: number | null,
): value is number {
  return (
    value !== null &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
  );
}

function unavailable(
  id: string,
  label: string,
  message: string,
): EquipmentCompatibilityCheck {
  return {
    id,
    label,
    status: "NOT_EVALUATED",
    actual: null,
    limit: null,
    unit: null,
    message,
  };
}

function maximumCheck({
  id,
  label,
  actual,
  limit,
  unit,
}: {
  id: string;
  label: string;
  actual: number;
  limit: number;
  unit: string;
}): EquipmentCompatibilityCheck {
  const passes = actual <= limit;

  return {
    id,
    label,
    status: passes ? "PASS" : "FAIL",
    actual,
    limit,
    unit,
    message: passes
      ? `${label} is within the inverter limit.`
      : `${label} exceeds the inverter limit.`,
  };
}

function minimumCheck({
  id,
  label,
  actual,
  limit,
  unit,
}: {
  id: string;
  label: string;
  actual: number;
  limit: number;
  unit: string;
}): EquipmentCompatibilityCheck {
  const passes = actual >= limit;

  return {
    id,
    label,
    status: passes ? "PASS" : "FAIL",
    actual,
    limit,
    unit,
    message: passes
      ? `${label} meets the inverter minimum.`
      : `${label} is below the inverter minimum.`,
  };
}

function overallStatus(
  checks: EquipmentCompatibilityCheck[],
): EquipmentCompatibilityStatus {
  if (checks.some((check) => check.status === "FAIL")) {
    return "FAIL";
  }

  if (checks.some((check) => check.status === "WARNING")) {
    return "WARNING";
  }

  if (
    checks.some(
      (check) => check.status === "NOT_EVALUATED",
    )
  ) {
    return "WARNING";
  }

  return "PASS";
}

export function assessPVInverterCompatibility({
  module,
  inverter,
  moduleCount,
  modulesPerString,
  stringsPerMppt,
  minimumDesignTemperatureC,
  maximumDesignCellTemperatureC = null,
  bifacialCurrentFactor = null,
  inverterCount = 1,
}: PVInverterCompatibilityInput): PVInverterCompatibilityReport {
  const checks: EquipmentCompatibilityCheck[] = [];

  const validModuleCount =
    positiveInteger(moduleCount);

  const validModulesPerString =
    positiveInteger(modulesPerString);

  const validStringsPerMppt =
    positiveInteger(stringsPerMppt);

  const configuredInverterCount =
    positiveInteger(inverterCount)
      ? inverterCount
      : null;

  const totalAcCapacityW =
    configuredInverterCount === null
      ? null
      : configuredInverterCount *
        inverter.ac.ratedActivePowerW;

  const totalArrayPowerW =
    validModuleCount
      ? module.pmaxW * moduleCount
      : null;

  if (
    totalArrayPowerW === null ||
    configuredInverterCount === null
  ) {
    checks.push(
      unavailable(
        "array-power",
        "Total array STC power",
        "Module count and inverter quantity are required.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "array-power",
        label: "Total array STC power",
        actual: totalArrayPowerW,
        limit:
          configuredInverterCount *
          inverter.dc.maxGeneratorPowerW,
        unit: "W",
      }),
    );
  }

  const totalStringCount =
    validModuleCount && validModulesPerString
      ? Math.ceil(moduleCount / modulesPerString)
      : null;

  if (
    validModuleCount &&
    validModulesPerString &&
    moduleCount % modulesPerString !== 0
  ) {
    checks.push({
      id: "partial-string",
      label: "Complete string allocation",
      status: "WARNING",
      actual: moduleCount,
      limit: modulesPerString,
      unit: "modules",
      message:
        "Module count is not exactly divisible by modules per string; the final string would be incomplete.",
    });
  }

  if (
    totalStringCount === null ||
    configuredInverterCount === null
  ) {
    checks.push(
      unavailable(
        "string-capacity",
        "Total inverter string capacity",
        "Module count, string design and inverter quantity are required.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "string-capacity",
        label: "Total inverter string capacity",
        actual: totalStringCount,
        limit:
          configuredInverterCount *
          inverter.dc.independentMpptInputs *
          inverter.dc.stringsPerMppt,
        unit: "strings",
      }),
    );
  }

  if (!validStringsPerMppt) {
    checks.push(
      unavailable(
        "strings-per-mppt",
        "Strings per MPPT",
        "Strings per MPPT was not supplied.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "strings-per-mppt",
        label: "Strings per MPPT",
        actual: stringsPerMppt,
        limit: inverter.dc.stringsPerMppt,
        unit: "strings",
      }),
    );
  }

  const stringVmppV =
    validModulesPerString && module.vmppV !== null
      ? modulesPerString * module.vmppV
      : null;

  if (stringVmppV === null) {
    checks.push(
      unavailable(
        "string-vmpp-min",
        "String Vmpp minimum",
        "Modules per string or module Vmpp is unavailable.",
      ),
      unavailable(
        "string-vmpp-max",
        "String Vmpp maximum",
        "Modules per string or module Vmpp is unavailable.",
      ),
    );
  } else {
    checks.push(
      minimumCheck({
        id: "string-vmpp-min",
        label: "String Vmpp minimum",
        actual: stringVmppV,
        limit: inverter.dc.mppVoltageMinV,
        unit: "V",
      }),
      maximumCheck({
        id: "string-vmpp-max",
        label: "String Vmpp maximum",
        actual: stringVmppV,
        limit: inverter.dc.mppVoltageMaxV,
        unit: "V",
      }),
    );
  }

  let stringVmppHotV: number | null = null;

  if (maximumDesignCellTemperatureC === null) {
    checks.push(
      unavailable(
        "string-vmpp-hot-min",
        "Hot-condition string Vmpp",
        "Hot-condition Vmpp = NOT_EVALUATED. Reason: maximum design cell temperature not supplied.",
      ),
    );
  } else if (module.tempCoeffVocPercentPerC === null) {
    checks.push(
      unavailable(
        "string-vmpp-hot-min",
        "Hot-condition string Vmpp",
        "Hot-condition Vmpp = NOT_EVALUATED. Reason: voltage temperature coefficient is unavailable.",
      ),
    );
  } else if (stringVmppV === null) {
    checks.push(
      unavailable(
        "string-vmpp-hot-min",
        "Hot-condition string Vmpp",
        "Hot-condition Vmpp = NOT_EVALUATED. Reason: string Vmpp at STC is unavailable.",
      ),
    );
  } else {
    stringVmppHotV =
      stringVmppV *
      (
        1 +
        (
          module.tempCoeffVocPercentPerC /
          100
        ) *
        (
          maximumDesignCellTemperatureC -
          25
        )
      );

    checks.push(
      minimumCheck({
        id: "string-vmpp-hot-min",
        label: "Hot-condition string Vmpp",
        actual: stringVmppHotV,
        limit: inverter.dc.mppVoltageMinV,
        unit: "V",
      }),
    );
  }

  let stringVmppColdV: number | null = null;

  if (minimumDesignTemperatureC === null) {
    checks.push(
      unavailable(
        "string-vmpp-cold-max",
        "Cold-condition string Vmpp",
        "Cold-condition Vmpp = NOT_EVALUATED. Reason: minimum design temperature not supplied.",
      ),
    );
  } else if (module.tempCoeffVocPercentPerC === null) {
    checks.push(
      unavailable(
        "string-vmpp-cold-max",
        "Cold-condition string Vmpp",
        "Cold-condition Vmpp = NOT_EVALUATED. Reason: voltage temperature coefficient is unavailable.",
      ),
    );
  } else if (stringVmppV === null) {
    checks.push(
      unavailable(
        "string-vmpp-cold-max",
        "Cold-condition string Vmpp",
        "Cold-condition Vmpp = NOT_EVALUATED. Reason: string Vmpp at STC is unavailable.",
      ),
    );
  } else {
    stringVmppColdV =
      stringVmppV *
      (
        1 +
        (
          module.tempCoeffVocPercentPerC /
          100
        ) *
        (
          minimumDesignTemperatureC -
          25
        )
      );

    checks.push(
      maximumCheck({
        id: "string-vmpp-cold-max",
        label: "Cold-condition string Vmpp",
        actual: stringVmppColdV,
        limit: inverter.dc.mppVoltageMaxV,
        unit: "V",
      }),
    );
  }

  const stringVocStcV =
    validModulesPerString && module.vocV !== null
      ? modulesPerString * module.vocV
      : null;

  if (stringVocStcV === null) {
    checks.push(
      unavailable(
        "string-voc-stc",
        "String Voc at STC",
        "Modules per string or module Voc is unavailable.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "string-voc-stc",
        label: "String Voc at STC",
        actual: stringVocStcV,
        limit: inverter.dc.maxInputVoltageV,
        unit: "V",
      }),
    );
  }

  let stringVocColdV: number | null = null;

  if (minimumDesignTemperatureC === null) {
    checks.push(
      unavailable(
        "string-voc-cold",
        "Cold-condition string Voc",
        "Cold-condition Voc = NOT_EVALUATED. Reason: minimum design temperature not supplied.",
      ),
    );
  } else if (module.tempCoeffVocPercentPerC === null) {
    checks.push(
      unavailable(
        "string-voc-cold",
        "Cold-condition string Voc",
        "Cold-condition Voc = NOT_EVALUATED. Reason: module Voc temperature coefficient is unavailable.",
      ),
    );
  } else if (stringVocStcV === null) {
    checks.push(
      unavailable(
        "string-voc-cold",
        "Cold-condition string Voc",
        "Cold-condition Voc = NOT_EVALUATED. Reason: string Voc at STC is unavailable.",
      ),
    );
  } else {
    stringVocColdV =
      stringVocStcV *
      (
        1 +
        (
          module.tempCoeffVocPercentPerC /
          100
        ) *
        (
          minimumDesignTemperatureC -
          25
        )
      );

    checks.push(
      maximumCheck({
        id: "string-voc-cold",
        label: "Cold-condition string Voc",
        actual: stringVocColdV,
        limit: inverter.dc.maxInputVoltageV,
        unit: "V",
      }),
    );
  }

  const stringIscA = module.iscA;

  if (stringIscA === null) {
    checks.push(
      unavailable(
        "string-isc",
        "String short-circuit current",
        "Module Isc is unavailable.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "string-isc",
        label: "String short-circuit current",
        actual: stringIscA,
        limit:
          inverter.dc
            .maxShortCircuitCurrentPerStringA,
        unit: "A",
      }),
    );
  }

  let designIscHotA: number | null = null;

  if (maximumDesignCellTemperatureC === null) {
    checks.push(
      unavailable(
        "design-isc-hot",
        "Hot bifacial design current",
        "Design current = NOT_EVALUATED. Reason: maximum design cell temperature not supplied.",
      ),
    );
  } else if (bifacialCurrentFactor === null) {
    checks.push(
      unavailable(
        "design-isc-hot",
        "Hot bifacial design current",
        "Design current = NOT_EVALUATED. Reason: bifacial current factor not supplied.",
      ),
    );
  } else if (
    !Number.isFinite(bifacialCurrentFactor) ||
    bifacialCurrentFactor < 1
  ) {
    checks.push({
      id: "design-isc-hot",
      label: "Hot bifacial design current",
      status: "FAIL",
      actual: bifacialCurrentFactor,
      limit: 1,
      unit: "factor",
      message:
        "Bifacial current factor must be a finite value greater than or equal to 1.",
    });
  } else if (
    module.iscA === null ||
    module.tempCoeffIscPercentPerC === null
  ) {
    checks.push(
      unavailable(
        "design-isc-hot",
        "Hot bifacial design current",
        "Design current = NOT_EVALUATED. Reason: module Isc or its temperature coefficient is unavailable.",
      ),
    );
  } else {
    designIscHotA =
      module.iscA *
      (
        1 +
        (
          module.tempCoeffIscPercentPerC /
          100
        ) *
        (
          maximumDesignCellTemperatureC -
          25
        )
      ) *
      bifacialCurrentFactor;

    checks.push({
      id: "design-isc-hot",
      label: "Hot bifacial design current",
      status: "PASS",
      actual: designIscHotA,
      limit: null,
      unit: "A",
      message:
        "Hot-condition Isc includes the configured bifacial current factor.",
    });
  }

  const designImppA =
    module.imppA !== null &&
    bifacialCurrentFactor !== null &&
    Number.isFinite(bifacialCurrentFactor) &&
    bifacialCurrentFactor >= 1
      ? module.imppA *
        bifacialCurrentFactor
      : null;

  const mpptDesignCurrentA =
    validStringsPerMppt &&
    designImppA !== null
      ? stringsPerMppt *
        designImppA
      : null;

  if (mpptDesignCurrentA === null) {
    checks.push(
      unavailable(
        "mppt-design-current",
        "MPPT bifacial operating current",
        "Strings per MPPT, module Impp and bifacial current factor are required.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "mppt-design-current",
        label: "MPPT bifacial operating current",
        actual: mpptDesignCurrentA,
        limit:
          inverter.dc
            .maxOperatingCurrentPerMpptA,
        unit: "A",
      }),
    );
  }

  const mpptDesignShortCircuitCurrentA =
    validStringsPerMppt &&
    designIscHotA !== null
      ? stringsPerMppt *
        designIscHotA
      : null;

  if (mpptDesignShortCircuitCurrentA === null) {
    checks.push(
      unavailable(
        "mppt-design-short-circuit-current",
        "MPPT hot short-circuit current",
        "Strings per MPPT and hot-condition Isc are required.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "mppt-design-short-circuit-current",
        label: "MPPT hot short-circuit current",
        actual: mpptDesignShortCircuitCurrentA,
        limit:
          inverter.dc
            .maxShortCircuitCurrentPerMpptA,
        unit: "A",
      }),
    );
  }

  const mpptImppA =
    validStringsPerMppt && module.imppA !== null
      ? stringsPerMppt * module.imppA
      : null;

  if (mpptImppA === null) {
    checks.push(
      unavailable(
        "mppt-impp",
        "MPPT operating current",
        "Strings per MPPT or module Impp is unavailable.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "mppt-impp",
        label: "MPPT operating current",
        actual: mpptImppA,
        limit:
          inverter.dc
            .maxOperatingCurrentPerMpptA,
        unit: "A",
      }),
    );
  }

  const mpptIscA =
    validStringsPerMppt && module.iscA !== null
      ? stringsPerMppt * module.iscA
      : null;

  if (mpptIscA === null) {
    checks.push(
      unavailable(
        "mppt-isc",
        "MPPT short-circuit current",
        "Strings per MPPT or module Isc is unavailable.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "mppt-isc",
        label: "MPPT short-circuit current",
        actual: mpptIscA,
        limit:
          inverter.dc
            .maxShortCircuitCurrentPerMpptA,
        unit: "A",
      }),
    );
  }

  const totalImppA =
    totalStringCount !== null && module.imppA !== null
      ? totalStringCount * module.imppA
      : null;

  if (
    totalImppA === null ||
    configuredInverterCount === null
  ) {
    checks.push(
      unavailable(
        "total-impp",
        "Total DC operating current",
        "String count, module Impp and inverter quantity are required.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "total-impp",
        label: "Total DC operating current",
        actual: totalImppA,
        limit:
          configuredInverterCount *
          inverter.dc.maxOperatingInputCurrentA,
        unit: "A",
      }),
    );
  }

  const inverterLoadingRatio =
    totalArrayPowerW === null ||
    totalAcCapacityW === null
      ? null
      : totalArrayPowerW /
        totalAcCapacityW;

  if (inverterLoadingRatio === null) {
    checks.push(
      unavailable(
        "inverter-loading-ratio",
        "Inverter loading ratio",
        "ILR = NOT_EVALUATED. Reason: total array power is unavailable.",
      ),
    );
  } else {
    const inRecommendedRange =
      inverterLoadingRatio >= 1.1 &&
      inverterLoadingRatio <= 1.35;

    checks.push({
      id: "inverter-loading-ratio",
      label: "Inverter loading ratio",
      status:
        inRecommendedRange
          ? "PASS"
          : "WARNING",
      actual: inverterLoadingRatio,
      limit: 1.35,
      unit: "p.u.",
      message:
        inRecommendedRange
          ? "ILR is within the configured engineering target range of 1.10 to 1.35."
          : "ILR is outside the engineering target range of 1.10 to 1.35; review inverter quantity or array size.",
    });
  }

  return {
    schema:
      "agritwin-pv-inverter-compatibility-v1",

    status:
      overallStatus(checks),

    moduleProfileId:
      module.id,

    inverterSpecificationId:
      inverter.id,

    calculations: {
      totalArrayPowerW,
      inverterCount:
        configuredInverterCount,
      totalAcCapacityW,
      totalStringCount,
      stringVmppV,
      stringVmppHotV,
      stringVmppColdV,
      stringVocStcV,
      stringVocColdV,
      stringIscA,
      designIscHotA,
      mpptImppA,
      mpptIscA,
      mpptDesignCurrentA,
      totalImppA,
      inverterLoadingRatio,
    },

    checks,
  };
}
