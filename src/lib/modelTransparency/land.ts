import {
  calculateLandArrayFootprint,
} from "@/lib/geometry/landArrayFootprint";

import type {
  InverterCatalogueProfile,
} from "@/lib/electrical/inverter/catalogue";

import type {
  PVModuleProfile,
} from "@/lib/pv/moduleProfiles";

import type {
  LandAgrivoltaicSiteProfile,
} from "@/lib/sites/schema";

import type {
  SimulationResults,
} from "@/types/simulation";

export interface LandModelTransparencyInput {
  site: LandAgrivoltaicSiteProfile;
  module: PVModuleProfile;
  inverter: InverterCatalogueProfile;
  results?: SimulationResults | null;
  selectedHour?: number;
}

export interface LandModelTransparency {
  moduleCount: number;
  installedCapacityKw: number;
  configuredAcCapacityKw: number;
  inverterLoadingRatio: number | null;
  fieldAreaM2: number;
  moduleAreaM2: number;
  physicalModuleCoveragePercent: number;
  footprint: ReturnType<
    typeof calculateLandArrayFootprint
  >;
  totalConfiguredStrings: number | null;
  requiredModules: number | null;
  moduleBalance: number | null;
  stringVmppV: number | null;
  stringVocStcV: number | null;
  mpptOperatingCurrentA: number | null;
  dailySpecificYieldKWhPerKwp: number | null;
  dailyCapacityFactorPercent: number | null;
  selectedPoint:
    SimulationResults["hourly"][number] | null;
}

function positiveInteger(
  value: number | null | undefined,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}

export function calculateLandModelTransparency({
  site,
  module,
  inverter,
  results = null,
  selectedHour = 12,
}: LandModelTransparencyInput):
  LandModelTransparency {
  const pv =
    site.pvConfiguration;

  const moduleCount =
    pv.numberOfRows *
    pv.modulesPerRow;

  const installedCapacityKw =
    moduleCount *
    pv.modulePower /
    1000;

  const inverterCount =
    positiveInteger(
      pv.inverterCount,
    )
      ? pv.inverterCount
      : 1;

  const configuredAcCapacityKw =
    inverterCount *
    inverter.ac.ratedActivePowerW /
    1000;

  const fieldAreaM2 =
    site.siteGeometry.fieldLengthM *
    site.siteGeometry.fieldWidthM;

  const moduleAreaM2 =
    moduleCount *
    pv.moduleWidth *
    pv.moduleLength;

  const footprint =
    calculateLandArrayFootprint({
      fieldLengthM:
        site.siteGeometry.fieldLengthM,
      fieldWidthM:
        site.siteGeometry.fieldWidthM,
      numberOfRows:
        pv.numberOfRows,
      modulesPerRow:
        pv.modulesPerRow,
      rowSpacingM:
        pv.rowSpacing,
      moduleWidthM:
        pv.moduleWidth,
      moduleLengthM:
        pv.moduleLength,
    });

  const totalConfiguredStrings =
    positiveInteger(
      pv.stringsPerInverter,
    )
      ? pv.stringsPerInverter *
        inverterCount
      : null;

  const requiredModules =
    totalConfiguredStrings !== null &&
    positiveInteger(
      pv.modulesPerString,
    )
      ? totalConfiguredStrings *
        pv.modulesPerString
      : null;

  const selectedPoint =
    results?.hourly[
      selectedHour
    ] ?? null;

  return {
    moduleCount,

    installedCapacityKw,

    configuredAcCapacityKw,

    inverterLoadingRatio:
      configuredAcCapacityKw > 0
        ? installedCapacityKw /
          configuredAcCapacityKw
        : null,

    fieldAreaM2,

    moduleAreaM2,

    physicalModuleCoveragePercent:
      fieldAreaM2 > 0
        ? moduleAreaM2 /
          fieldAreaM2 *
          100
        : 0,

    footprint,

    totalConfiguredStrings,

    requiredModules,

    moduleBalance:
      requiredModules === null
        ? null
        : moduleCount -
          requiredModules,

    stringVmppV:
      positiveInteger(
        pv.modulesPerString,
      ) &&
      module.vmppV !== null
        ? pv.modulesPerString *
          module.vmppV
        : null,

    stringVocStcV:
      positiveInteger(
        pv.modulesPerString,
      ) &&
      module.vocV !== null
        ? pv.modulesPerString *
          module.vocV
        : null,

    mpptOperatingCurrentA:
      positiveInteger(
        pv.stringsPerMppt,
      ) &&
      module.imppA !== null
        ? pv.stringsPerMppt *
          module.imppA
        : null,

    dailySpecificYieldKWhPerKwp:
      results &&
      installedCapacityKw > 0
        ? results.dailyEnergyKWh /
          installedCapacityKw
        : null,

    dailyCapacityFactorPercent:
      results &&
      installedCapacityKw > 0
        ? results.dailyEnergyKWh /
          (
            installedCapacityKw *
            24
          ) *
          100
        : null,

    selectedPoint,
  };
}
