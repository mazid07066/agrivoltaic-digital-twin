import { getPVModuleProfile } from "@/lib/pv/moduleProfiles";

import {
  DEFAULT_INVERTER_PROFILE_ID,
} from "@/lib/electrical/inverter/catalogue";

import type {
  FlatRoofSiteProfile,
  LandAgrivoltaicSiteProfile,
} from "./schema";

import {
  createDefaultPhysicsModelConfiguration,
} from "@/lib/physics/defaults";

function createDefaultPVConfiguration() {
  const pvModule = getPVModuleProfile("jinko-solar-jkm-540-560m");

  return {
    moduleProfileId: pvModule.id,
    inverterProfileId: DEFAULT_INVERTER_PROFILE_ID,
    inverterCount: 1,
    modulesPerString: null,
    stringsPerInverter: null,
    stringsPerMppt: null,
    mpptStringAllocation: null,
    minimumDesignTemperatureC: null,
    maximumDesignCellTemperatureC: null,
    bifacialCurrentFactor: null,
    numberOfRows: 6,
    modulesPerRow: 10,
    moduleWidth: pvModule.widthM,
    moduleLength: pvModule.lengthM,
    modulePower: pvModule.pmaxW,
    rowSpacing: 4,
    panelHeight: 2,
    tilt: 20,
    azimuth: 180,
    systemEfficiency: 0.82,
    trackingMode: "custom" as const,
    groundAlbedo: 0.2,
    maximumTrackerAngle: 60,
    moduleEfficiency: pvModule.efficiencyPercent ?? 21.29,
    moduleNOCT: pvModule.noctC,
    temperatureCoefficientPmax:
      pvModule.tempCoeffPmaxPercentPerC,
    moduleVoc: pvModule.vocV,
    moduleVmpp: pvModule.vmppV,
    moduleIsc: pvModule.iscA,
    moduleImpp: pvModule.imppA,
    moduleTempCoeffVocPercentPerC:
      pvModule.tempCoeffVocPercentPerC,
    moduleTempCoeffIscPercentPerC:
      pvModule.tempCoeffIscPercentPerC,
    moduleCellsInSeries:
      pvModule.numberOfCells === null
        ? null
        : pvModule.numberOfCells > 100
          ? Math.round(pvModule.numberOfCells / 2)
          : pvModule.numberOfCells,
    physicsConfiguration:
      createDefaultPhysicsModelConfiguration(
        "legacy_parity",
      ),
  };
}

export function createDefaultLandSiteProfile(
  simulationDate = new Date().toISOString().slice(0, 10),
): LandAgrivoltaicSiteProfile {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    id: "site-phase-7b-default",
    name: "Dhaka Agrivoltaic Research Site",
    siteType: "land_agrivoltaic",
    dataMode: "virtual",
    location: {
      latitude: 23.8103,
      longitude: 90.4125,
      timezone: "Asia/Dhaka",
    },
    siteGeometry: {
      kind: "land",
      fieldLengthM: 44,
      fieldWidthM: 20,
    },
    pvConfiguration: createDefaultPVConfiguration(),
    cropConfiguration: { cropId: "tomato" },
    simulationDate,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultFlatRoofSiteProfile(
  simulationDate = new Date().toISOString().slice(0, 10),
): FlatRoofSiteProfile {
  const now = new Date().toISOString();
  const pvConfiguration = createDefaultPVConfiguration();

  return {
    schemaVersion: 1,
    id: `flat-roof-${crypto.randomUUID()}`,
    name: "New Flat-Roof PV Site",
    siteType: "flat_roof",
    dataMode: "virtual",
    location: {
      latitude: 23.8103,
      longitude: 90.4125,
      timezone: "Asia/Dhaka",
    },
    siteGeometry: {
      kind: "flat_roof",
      buildingHeightM: 12,
      roofLengthM: 30,
      roofWidthM: 20,
      roofAzimuthDeg: 180,
      roofSlopeDeg: 0,
      parapet: {
        enabled: true,
        heightM: 1,
        widthM: 0.2,
      },
      setbacks: {
        northM: 1.5,
        southM: 1.5,
        eastM: 1.5,
        westM: 1.5,
      },
      array: {
        rackHeightM: 0.5,
        tiltDeg: 15,
        azimuthDeg: 180,
        rowSpacingM: 0.8,
        orientation: "portrait",
      },
      surfaceAlbedo: 0.25,
    },
    pvConfiguration: {
      ...pvConfiguration,
      numberOfRows: 0,
      modulesPerRow: 0,
      rowSpacing: 0.8,
      panelHeight: 0.5,
      tilt: 15,
      azimuth: 180,
      trackingMode: "fixed",
      maximumTrackerAngle: 0,
      groundAlbedo: 0.25,
    },
    simulationDate,
    createdAt: now,
    updatedAt: now,
  };
}
