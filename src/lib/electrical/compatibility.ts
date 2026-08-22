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
}

export interface PVInverterCompatibilityReport {
  schema: "agritwin-pv-inverter-compatibility-v1";
  status: EquipmentCompatibilityStatus;
  moduleProfileId: string;
  inverterSpecificationId: string;
  calculations: {
    totalArrayPowerW: number | null;
    totalStringCount: number | null;
    stringVmppV: number | null;
    stringVocStcV: number | null;
    stringVocColdV: number | null;
    stringIscA: number | null;
    mpptImppA: number | null;
    mpptIscA: number | null;
    totalImppA: number | null;
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
}: PVInverterCompatibilityInput): PVInverterCompatibilityReport {
  const checks: EquipmentCompatibilityCheck[] = [];

  const validModuleCount =
    positiveInteger(moduleCount);

  const validModulesPerString =
    positiveInteger(modulesPerString);

  const validStringsPerMppt =
    positiveInteger(stringsPerMppt);

  const totalArrayPowerW =
    validModuleCount
      ? module.pmaxW * moduleCount
      : null;

  if (totalArrayPowerW === null) {
    checks.push(
      unavailable(
        "array-power",
        "Total array STC power",
        "Module count was not supplied.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "array-power",
        label: "Total array STC power",
        actual: totalArrayPowerW,
        limit: inverter.dc.maxGeneratorPowerW,
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

  if (totalStringCount === null) {
    checks.push(
      unavailable(
        "string-capacity",
        "Total inverter string capacity",
        "Module count and modules per string are required.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "string-capacity",
        label: "Total inverter string capacity",
        actual: totalStringCount,
        limit:
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

  if (totalImppA === null) {
    checks.push(
      unavailable(
        "total-impp",
        "Total DC operating current",
        "Total string count or module Impp is unavailable.",
      ),
    );
  } else {
    checks.push(
      maximumCheck({
        id: "total-impp",
        label: "Total DC operating current",
        actual: totalImppA,
        limit:
          inverter.dc
            .maxOperatingInputCurrentA,
        unit: "A",
      }),
    );
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
      totalStringCount,
      stringVmppV,
      stringVocStcV,
      stringVocColdV,
      stringIscA,
      mpptImppA,
      mpptIscA,
      totalImppA,
    },

    checks,
  };
}
