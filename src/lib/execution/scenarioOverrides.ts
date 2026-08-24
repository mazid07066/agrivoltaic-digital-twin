import type {
  Scenario,
} from "@/lib/scenarios/types";

import type {
  CropId,
} from "@/types/simulation";

import type {
  LandAgrivoltaicSiteProfile,
  SiteProfile,
} from "@/lib/sites/schema";

import {
  findPVModuleProfile,
} from "@/lib/pv/moduleProfiles";

import {
  getInverterProfile,
} from "@/lib/electrical/inverter/catalogue";

function finiteNumber(
  value:
    unknown,
): number | null {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  )
    ? value
    : null;
}

function positiveNumber(
  value:
    unknown,

  label:
    string,
): number | null {
  const number =
    finiteNumber(
      value,
    );

  if (
    number === null
  ) {
    return null;
  }

  if (
    number <=
    0
  ) {
    throw new Error(
      `${label} must be greater than zero.`,
    );
  }

  return number;
}

function boundedNumber(
  value:
    unknown,

  minimum:
    number,

  maximum:
    number,

  label:
    string,
): number | null {
  const number =
    finiteNumber(
      value,
    );

  if (
    number === null
  ) {
    return null;
  }

  if (
    number <
      minimum ||
    number >
      maximum
  ) {
    throw new Error(
      `${label} must be between ${minimum} and ${maximum}.`,
    );
  }

  return number;
}

export function applyEquipmentScenarioOverrides<
  T extends SiteProfile,
>(
  stored: T,
  scenario: Scenario,
): T {
  /*
   * Equipment overrides always operate on a detached copy.
   * The immutable stored site version is never mutated.
   */
  const runtime =
    structuredClone(
      stored,
    );

  const technical =
    scenario.technicalConfig ??
    {};

  const moduleId =
    technical.moduleId
      ?.trim();

  if (moduleId) {
    const moduleProfile =
      findPVModuleProfile(
        moduleId,
      );

    if (!moduleProfile) {
      throw new Error(
        `Unknown PV module catalogue profile: ${moduleId}`,
      );
    }

    runtime.pvConfiguration = {
      ...runtime.pvConfiguration,

      moduleProfileId:
        moduleProfile.id,

      modulePower:
        moduleProfile.pmaxW,

      moduleWidth:
        moduleProfile.widthM,

      moduleLength:
        moduleProfile.lengthM,

      moduleEfficiency:
        moduleProfile.efficiencyPercent ??
        runtime.pvConfiguration
          .moduleEfficiency,

      moduleNOCT:
        moduleProfile.noctC,

      temperatureCoefficientPmax:
        moduleProfile
          .tempCoeffPmaxPercentPerC,

      moduleVoc:
        moduleProfile.vocV,

      moduleVmpp:
        moduleProfile.vmppV,

      moduleIsc:
        moduleProfile.iscA,

      moduleImpp:
        moduleProfile.imppA,
    };
  }

  const modulePower =
    positiveNumber(
      technical.modulePowerW,
      "Module power",
    );

  if (modulePower !== null) {
    runtime
      .pvConfiguration
      .modulePower =
      modulePower;
  }

  const inverterId =
    technical.inverterId
      ?.trim();

  if (inverterId) {
    /*
     * Validate the selected ID against the catalogue.
     * This prevents a displayed selection from silently
     * executing the default inverter.
     */
    const inverter =
      getInverterProfile(
        inverterId,
      );

    runtime
      .pvConfiguration
      .inverterProfileId =
      inverter.id;
  }

  const inverterCount =
    positiveNumber(
      technical.inverterCount,
      "Inverter count",
    );

  if (inverterCount !== null) {
    if (!Number.isInteger(inverterCount)) {
      throw new Error(
        "Inverter count must be an integer.",
      );
    }

    runtime
      .pvConfiguration
      .inverterCount =
      inverterCount;
  }

  const modulesPerString =
    positiveNumber(
      technical.modulesPerString,
      "Modules per string",
    );

  if (modulesPerString !== null) {
    if (!Number.isInteger(modulesPerString)) {
      throw new Error(
        "Modules per string must be an integer.",
      );
    }

    runtime
      .pvConfiguration
      .modulesPerString =
      modulesPerString;
  }

  const stringsPerInverter =
    positiveNumber(
      technical.stringsPerInverter,
      "Strings per inverter",
    );

  if (stringsPerInverter !== null) {
    if (!Number.isInteger(stringsPerInverter)) {
      throw new Error(
        "Strings per inverter must be an integer.",
      );
    }

    runtime
      .pvConfiguration
      .stringsPerInverter =
      stringsPerInverter;
  }

  const stringsPerMppt =
    positiveNumber(
      technical.stringsPerMppt,
      "Strings per MPPT",
    );

  if (stringsPerMppt !== null) {
    if (!Number.isInteger(stringsPerMppt)) {
      throw new Error(
        "Strings per MPPT must be an integer.",
      );
    }

    runtime
      .pvConfiguration
      .stringsPerMppt =
      stringsPerMppt;
  }

  const minimumDesignTemperatureC =
    finiteNumber(
      technical
        .minimumDesignTemperatureC,
    );

  if (
    minimumDesignTemperatureC !==
    null
  ) {
    runtime
      .pvConfiguration
      .minimumDesignTemperatureC =
      minimumDesignTemperatureC;
  }

  const maximumDesignCellTemperatureC =
    finiteNumber(
      technical
        .maximumDesignCellTemperatureC,
    );

  if (
    maximumDesignCellTemperatureC !==
    null
  ) {
    runtime
      .pvConfiguration
      .maximumDesignCellTemperatureC =
      maximumDesignCellTemperatureC;
  }

  const bifacialCurrentFactor =
    positiveNumber(
      technical.bifacialCurrentFactor,
      "Bifacial current factor",
    );

  if (bifacialCurrentFactor !== null) {
    if (bifacialCurrentFactor < 1) {
      throw new Error(
        "Bifacial current factor must be at least 1.",
      );
    }

    runtime
      .pvConfiguration
      .bifacialCurrentFactor =
      bifacialCurrentFactor;
  }

  return runtime;
}

export function applyLandScenarioOverrides(
  stored:
    LandAgrivoltaicSiteProfile,

  scenario:
    Scenario,
): LandAgrivoltaicSiteProfile {
  /*
   * Execution must never mutate the immutable
   * persisted site-version snapshot.
   */
  const runtime =
    applyEquipmentScenarioOverrides(
      stored,
      scenario,
    );

  const technical =
    scenario.technicalConfig ??
    {};

  const agricultural =
    scenario.agriculturalConfig ??
    {};

  /*
   * Scenario technical configuration uses the
   * Phase 9 scenario naming contract, whereas
   * the verified Phase 7B engine reads the
   * legacy PVConfiguration field names.
   *
   * Explicitly bridge those contracts here.
   */

  const panelHeight =
    positiveNumber(
      technical.panelHeightM,
      "Panel height",
    );

  if (
    panelHeight !==
    null
  ) {
    runtime
      .pvConfiguration
      .panelHeight =
      panelHeight;
  }

  const rowSpacing =
    positiveNumber(
      technical.rowSpacingM,
      "Row spacing",
    );

  if (
    rowSpacing !==
    null
  ) {
    runtime
      .pvConfiguration
      .rowSpacing =
      rowSpacing;
  }

  const tilt =
    boundedNumber(
      technical.tiltDeg,
      0,
      90,
      "PV tilt",
    );

  if (
    tilt !==
    null
  ) {
    runtime
      .pvConfiguration
      .tilt =
      tilt;
  }

  const azimuth =
    boundedNumber(
      technical.azimuthDeg,
      0,
      360,
      "PV azimuth",
    );

  if (
    azimuth !==
    null
  ) {
    runtime
      .pvConfiguration
      .azimuth =
      azimuth;
  }

  if (
    technical.trackingMode !==
      undefined &&
    technical.trackingMode !==
      null
  ) {
    runtime
      .pvConfiguration
      .trackingMode =
      technical
        .trackingMode;
  }

  /*
   * GCR is intentionally not written directly
   * into the runtime SiteProfile.
   *
   * The current Phase 7B engine derives physical
   * array coverage from row spacing, module size,
   * row count and modules per row. Treating GCR
   * as an independent geometry override would
   * create internally inconsistent geometry.
   */

  if (
    agricultural.cropId !==
      undefined &&
    agricultural.cropId !==
      null &&
    agricultural.cropId.trim()
  ) {
    runtime
      .cropConfiguration
      .cropId =
      agricultural
        .cropId as CropId;
  }

  return runtime;
}
