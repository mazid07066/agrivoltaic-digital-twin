import type {
  PVModuleProfile,
} from "./moduleProfiles";

/**
 * Input-friendly representation for new PV module
 * datasheets.
 *
 * Datasheet fields may be incomplete. Validation converts
 * only scientifically usable records into PVModuleProfile.
 */
export interface PVModuleCatalogueInput {
  id?: string | null;

  manufacturer: string;
  series?: string | null;
  model: string;

  cellTechnology?: string | null;
  cellType?: string | null;
  moduleType?: string | null;

  numberOfCells?: number | null;

  pmaxW: number;

  efficiencyPercent?: number | null;

  vocV?: number | null;
  vmppV?: number | null;
  iscA?: number | null;
  imppA?: number | null;

  noctC?: number | null;

  tempCoeffPmaxPercentPerC?:
    number | null;

  tempCoeffVocPercentPerC?:
    number | null;

  tempCoeffIscPercentPerC?:
    number | null;

  lengthM?: number | null;
  widthM?: number | null;

  thicknessMm?: number | null;
  weightKg?: number | null;

  maxSystemVoltage?:
    string | null;

  fuseA?: number | null;

  productWarranty?:
    string | null;

  linearWarranty?:
    string | null;

  source?:
    string | null;

  sourceFile?:
    string | null;
}

export interface PVModuleValidationIssue {
  field: string;

  severity:
    | "error"
    | "warning";

  message: string;
}

export interface PVModuleCompatibility {
  catalogueDisplay: boolean;

  layoutSimulation: boolean;

  pvPerformanceSimulation: boolean;

  inverterStringAnalysis: boolean;
}

export interface PVModuleValidationResult {
  valid: boolean;

  issues:
    PVModuleValidationIssue[];

  compatibility:
    PVModuleCompatibility;
}

function positive(
  value:
    number | null | undefined,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

export function validatePVModuleInput(
  input:
    PVModuleCatalogueInput,
): PVModuleValidationResult {
  const issues:
    PVModuleValidationIssue[] =
    [];

  if (!input.manufacturer.trim()) {
    issues.push({
      field:
        "manufacturer",

      severity:
        "error",

      message:
        "Manufacturer is required.",
    });
  }

  if (!input.model.trim()) {
    issues.push({
      field:
        "model",

      severity:
        "error",

      message:
        "Module model is required.",
    });
  }

  if (!positive(input.pmaxW)) {
    issues.push({
      field:
        "pmaxW",

      severity:
        "error",

      message:
        "Positive STC maximum power is required.",
    });
  }

  if (!positive(input.lengthM)) {
    issues.push({
      field:
        "lengthM",

      severity:
        "error",

      message:
        "Positive module length is required for layout simulation.",
    });
  }

  if (!positive(input.widthM)) {
    issues.push({
      field:
        "widthM",

      severity:
        "error",

      message:
        "Positive module width is required for layout simulation.",
    });
  }

  if (!positive(input.noctC)) {
    issues.push({
      field:
        "noctC",

      severity:
        "error",

      message:
        "NMOT/NOCT is required by the current AgriTwin module-temperature model.",
    });
  }

  if (
    typeof input
      .tempCoeffPmaxPercentPerC !==
      "number" ||
    !Number.isFinite(
      input
        .tempCoeffPmaxPercentPerC,
    )
  ) {
    issues.push({
      field:
        "tempCoeffPmaxPercentPerC",

      severity:
        "error",

      message:
        "Pmax temperature coefficient is required by the current AgriTwin PV model.",
    });
  }

  const hasStringElectricalData =
    positive(input.vocV) &&
    positive(input.vmppV) &&
    positive(input.iscA) &&
    positive(input.imppA);

  if (!hasStringElectricalData) {
    issues.push({
      field:
        "stcElectrical",

      severity:
        "warning",

      message:
        "Voc, Vmpp, Isc and Impp are incomplete; inverter string compatibility analysis will be limited.",
    });
  } else {
    if (
      input.vocV! <=
      input.vmppV!
    ) {
      issues.push({
        field:
          "vocV",

        severity:
          "error",

        message:
          "Voc must be greater than Vmpp.",
      });
    }

    if (
      input.iscA! <
      input.imppA!
    ) {
      issues.push({
        field:
          "iscA",

        severity:
          "error",

        message:
          "Isc must be greater than or equal to Impp.",
      });
    }

    const calculatedPower =
      input.vmppV! *
      input.imppA!;

    const differencePercent =
      Math.abs(
        calculatedPower -
        input.pmaxW,
      ) /
      input.pmaxW *
      100;

    if (
      differencePercent >
      3
    ) {
      issues.push({
        field:
          "pmaxW",

        severity:
          "warning",

        message:
          `Vmpp × Impp differs from Pmax by ${differencePercent.toFixed(
            2,
          )}%. Verify the datasheet values.`,
      });
    }
  }

  const hasErrors =
    issues.some(
      (
        issue,
      ) =>
        issue.severity ===
        "error",
    );

  const layoutSimulation =
    positive(
      input.lengthM,
    ) &&
    positive(
      input.widthM,
    );

  const pvPerformanceSimulation =
    layoutSimulation &&
    positive(
      input.noctC,
    ) &&
    typeof input
      .tempCoeffPmaxPercentPerC ===
      "number";

  return {
    valid:
      !hasErrors,

    issues,

    compatibility: {
      catalogueDisplay:
        Boolean(
          input.manufacturer.trim() &&
          input.model.trim() &&
          positive(
            input.pmaxW,
          ),
        ),

      layoutSimulation,

      pvPerformanceSimulation,

      inverterStringAnalysis:
        hasStringElectricalData,
    },
  };
}

/**
 * Converts a validated module input into the existing
 * AgriTwin runtime module contract.
 *
 * This deliberately keeps the verified simulation engines
 * free of nullable thermal/layout parameters.
 */
export function toPVModuleProfile(
  input:
    PVModuleCatalogueInput,
): PVModuleProfile {
  const validation =
    validatePVModuleInput(
      input,
    );

  if (!validation.valid) {
    throw new Error(
      validation.issues
        .filter(
          (
            issue,
          ) =>
            issue.severity ===
            "error",
        )
        .map(
          (
            issue,
          ) =>
            `${issue.field}: ${issue.message}`,
        )
        .join(
          " ",
        ),
    );
  }

  const id =
    input.id?.trim() ||
    `${input.manufacturer}-${input.model}`
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-|-$/g,
        "",
      );

  return {
    id,

    manufacturer:
      input.manufacturer.trim(),

    series:
      input.series?.trim() ??
      "",

    model:
      input.model.trim(),

    cellTechnology:
      input.cellTechnology?.trim() ??
      "Unspecified",

    cellType:
      input.cellType?.trim() ??
      "Unspecified",

    moduleType:
      input.moduleType?.trim() ??
      "Unspecified",

    numberOfCells:
      input.numberOfCells ??
      null,

    pmaxW:
      input.pmaxW,

    efficiencyPercent:
      input.efficiencyPercent ??
      null,

    vocV:
      input.vocV ??
      null,

    vmppV:
      input.vmppV ??
      null,

    iscA:
      input.iscA ??
      null,

    imppA:
      input.imppA ??
      null,

    noctC:
      input.noctC!,

    tempCoeffPmaxPercentPerC:
      input
        .tempCoeffPmaxPercentPerC!,

    tempCoeffVocPercentPerC:
      input
        .tempCoeffVocPercentPerC ??
      null,

    tempCoeffIscPercentPerC:
      input
        .tempCoeffIscPercentPerC ??
      null,

    lengthM:
      input.lengthM!,

    widthM:
      input.widthM!,

    thicknessMm:
      input.thicknessMm ??
      null,

    weightKg:
      input.weightKg ??
      null,

    maxSystemVoltage:
      input.maxSystemVoltage?.trim() ??
      "Unspecified",

    fuseA:
      input.fuseA ??
      null,

    productWarranty:
      input.productWarranty?.trim() ??
      "Unspecified",

    linearWarranty:
      input.linearWarranty?.trim() ??
      "Unspecified",

    source:
      input.source?.trim() ??
      "User supplied datasheet",

    sourceFile:
      input.sourceFile?.trim() ??
      "Manual module entry",
  };
}
