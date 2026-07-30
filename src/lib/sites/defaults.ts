import { getPVModuleProfile } from "@/lib/pv/moduleProfiles";
import type { LandAgrivoltaicSiteProfile } from "./schema";

export function createDefaultLandSiteProfile(
  simulationDate = new Date().toISOString().slice(0, 10),
): LandAgrivoltaicSiteProfile {
  const pvModule = getPVModuleProfile("jinko-solar-jkm-540-560m");
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
    pvConfiguration: {
      moduleProfileId: pvModule.id,
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
      trackingMode: "custom",
      groundAlbedo: 0.2,
      maximumTrackerAngle: 60,
      moduleEfficiency: pvModule.efficiencyPercent ?? 21.29,
      moduleNOCT: pvModule.noctC,
      temperatureCoefficientPmax: pvModule.tempCoeffPmaxPercentPerC,
      moduleVoc: pvModule.vocV,
      moduleVmpp: pvModule.vmppV,
      moduleIsc: pvModule.iscA,
      moduleImpp: pvModule.imppA,
    },
    cropConfiguration: { cropId: "tomato" },
    simulationDate,
    createdAt: now,
    updatedAt: now,
  };
}

