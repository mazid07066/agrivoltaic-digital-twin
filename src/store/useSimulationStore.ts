"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getPVModuleProfile } from "@/lib/pv/moduleProfiles";
import { toLandSimulationConfiguration } from "@/lib/sites/adapters/landAgrivoltaic";
import { createDefaultLandSiteProfile } from "@/lib/sites/defaults";
import { migratePersistedSiteState } from "@/lib/sites/migrations";
import type { LandAgrivoltaicSiteProfile } from "@/lib/sites/schema";
import type {
  CropId,
  PVConfiguration,
  SimulationConfiguration,
  SiteConfiguration,
  TrackingMode,
} from "@/types/simulation";

interface SimulationStore {
  activeSite: LandAgrivoltaicSiteProfile;

  /**
   * Phase 7B compatibility view.
   * Existing UI and Three.js components may continue selecting
   * state.configuration while Phase 8 uses activeSite as source of truth.
   */
  configuration: SimulationConfiguration;

  selectedHour: number;
  setSelectedHour: (hour: number) => void;
  updateSite: (values: Partial<SiteConfiguration>) => void;
  updatePV: (values: Partial<PVConfiguration>) => void;
  setCrop: (cropId: CropId) => void;
  setTrackingMode: (trackingMode: TrackingMode) => void;
  setModuleProfile: (profileId: string) => void;
  setSimulationDate: (date: string) => void;
  setDataMode: (dataMode: LandAgrivoltaicSiteProfile["dataMode"]) => void;
  replaceActiveSite: (site: LandAgrivoltaicSiteProfile) => void;
  resetConfiguration: () => void;
}

const touch = (
  site: LandAgrivoltaicSiteProfile,
): LandAgrivoltaicSiteProfile => ({
  ...site,
  updatedAt: new Date().toISOString(),
});

function synchronizedSiteState(site: LandAgrivoltaicSiteProfile) {
  return {
    activeSite: site,
    configuration: toLandSimulationConfiguration(site),
  };
}

const initialSite = createDefaultLandSiteProfile();

export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set) => ({
      ...synchronizedSiteState(initialSite),
      selectedHour: 12,

      setSelectedHour: (selectedHour) => set({ selectedHour }),

      updateSite: (values) =>
        set((state) => {
          const nextSite = touch({
            ...state.activeSite,
            name: values.name ?? state.activeSite.name,
            location: {
              ...state.activeSite.location,
              latitude:
                values.latitude ?? state.activeSite.location.latitude,
              longitude:
                values.longitude ?? state.activeSite.location.longitude,
              timezone:
                values.timezone ?? state.activeSite.location.timezone,
            },
            siteGeometry: {
              ...state.activeSite.siteGeometry,
              fieldLengthM:
                values.fieldLength ??
                state.activeSite.siteGeometry.fieldLengthM,
              fieldWidthM:
                values.fieldWidth ??
                state.activeSite.siteGeometry.fieldWidthM,
            },
          });

          return synchronizedSiteState(nextSite);
        }),

      updatePV: (values) =>
        set((state) => {
          const nextSite = touch({
            ...state.activeSite,
            pvConfiguration: {
              ...state.activeSite.pvConfiguration,
              ...values,
            },
          });

          return synchronizedSiteState(nextSite);
        }),

      setCrop: (cropId) =>
        set((state) => {
          const nextSite = touch({
            ...state.activeSite,
            cropConfiguration: { cropId },
          });

          return synchronizedSiteState(nextSite);
        }),

      setTrackingMode: (trackingMode) =>
        set((state) => {
          const nextSite = touch({
            ...state.activeSite,
            pvConfiguration: {
              ...state.activeSite.pvConfiguration,
              trackingMode,
            },
          });

          return synchronizedSiteState(nextSite);
        }),

      setModuleProfile: (profileId) =>
        set((state) => {
          const profile = getPVModuleProfile(profileId);

          const nextSite = touch({
            ...state.activeSite,
            pvConfiguration: {
              ...state.activeSite.pvConfiguration,
              moduleProfileId: profile.id,
              modulePower: profile.pmaxW,
              moduleWidth: profile.widthM,
              moduleLength: profile.lengthM,
              moduleEfficiency:
                profile.efficiencyPercent ??
                state.activeSite.pvConfiguration.moduleEfficiency,
              moduleNOCT: profile.noctC,
              temperatureCoefficientPmax:
                profile.tempCoeffPmaxPercentPerC,
              moduleVoc: profile.vocV,
              moduleVmpp: profile.vmppV,
              moduleIsc: profile.iscA,
              moduleImpp: profile.imppA,
              moduleTempCoeffVocPercentPerC:
                profile.tempCoeffVocPercentPerC,
              moduleTempCoeffIscPercentPerC:
                profile.tempCoeffIscPercentPerC,
              moduleCellsInSeries:
                profile.numberOfCells === null
                  ? null
                  : profile.numberOfCells > 100
                    ? Math.round(profile.numberOfCells / 2)
                    : profile.numberOfCells,
            },
          });

          return synchronizedSiteState(nextSite);
        }),

      setSimulationDate: (simulationDate) =>
        set((state) => {
          const nextSite = touch({
            ...state.activeSite,
            simulationDate,
          });

          return synchronizedSiteState(nextSite);
        }),

      setDataMode: (dataMode) =>
        set((state) => {
          const nextSite = touch({
            ...state.activeSite,
            dataMode,
          });

          return synchronizedSiteState(nextSite);
        }),

      replaceActiveSite: (site) =>
        set({
          ...synchronizedSiteState(site),
          selectedHour: 12,
        }),

      resetConfiguration: () => {
        const nextSite = createDefaultLandSiteProfile();
        set({
          ...synchronizedSiteState(nextSite),
          selectedHour: 12,
        });
      },
    }),
    {
      name: "agritwin-site-profile",
      // Version 2 repairs legacy efficiency values that were
      // accidentally persisted as zero when a numeric field was cleared.
      version: 2,
      partialize: (state) => ({
        activeSite: state.activeSite,
        selectedHour: state.selectedHour,
      }),
      migrate: (persistedState) => {
        const activeSite = migratePersistedSiteState(
          persistedState,
        ) as LandAgrivoltaicSiteProfile;

        const selectedHour =
          typeof (
            persistedState as { selectedHour?: unknown } | null
          )?.selectedHour === "number"
            ? (persistedState as { selectedHour: number }).selectedHour
            : 12;

        return {
          ...synchronizedSiteState(activeSite),
          selectedHour,
        };
      },
    },
  ),
);
