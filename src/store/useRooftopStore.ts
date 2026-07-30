"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getPVModuleProfile } from "@/lib/pv/moduleProfiles";
import { createDefaultFlatRoofSiteProfile } from "@/lib/sites/defaults";
import { isFlatRoofSiteProfile } from "@/lib/sites/migrations";
import type {
  FlatRoofGeometry,
  FlatRoofSiteProfile,
} from "@/lib/sites/schema";
import type { PVConfiguration } from "@/types/simulation";

interface RooftopStore {
  activeSite: FlatRoofSiteProfile;
  selectedHour: number;
  setSelectedHour: (hour: number) => void;
  replaceActiveSite: (
    site: FlatRoofSiteProfile,
  ) => void;
  updateIdentity: (
    values: Partial<{
      name: string;
      latitude: number;
      longitude: number;
      timezone: string;
      simulationDate: string;
    }>,
  ) => void;
  updateGeometry: (
    values: Partial<
      Omit<
        FlatRoofGeometry,
        "kind" | "parapet" | "setbacks" | "array"
      >
    >,
  ) => void;
  updateParapet: (
    values: Partial<FlatRoofGeometry["parapet"]>,
  ) => void;
  updateSetbacks: (
    values: Partial<FlatRoofGeometry["setbacks"]>,
  ) => void;
  updateArray: (
    values: Partial<FlatRoofGeometry["array"]>,
  ) => void;
  updatePV: (
    values: Partial<PVConfiguration>,
  ) => void;
  setModuleProfile: (profileId: string) => void;
  reset: () => void;
}

function touch(
  site: FlatRoofSiteProfile,
): FlatRoofSiteProfile {
  return {
    ...site,
    updatedAt: new Date().toISOString(),
  };
}

export const useRooftopStore =
  create<RooftopStore>()(
    persist(
      (set) => ({
        activeSite:
          createDefaultFlatRoofSiteProfile(),
        selectedHour: 12,

        setSelectedHour: (selectedHour) =>
          set({ selectedHour }),

        replaceActiveSite: (activeSite) =>
          set({
            activeSite,
            selectedHour: 12,
          }),

        updateIdentity: (values) =>
          set((state) => ({
            activeSite: touch({
              ...state.activeSite,
              name:
                values.name ??
                state.activeSite.name,
              simulationDate:
                values.simulationDate ??
                state.activeSite.simulationDate,
              location: {
                ...state.activeSite.location,
                latitude:
                  values.latitude ??
                  state.activeSite.location
                    .latitude,
                longitude:
                  values.longitude ??
                  state.activeSite.location
                    .longitude,
                timezone:
                  values.timezone ??
                  state.activeSite.location
                    .timezone,
              },
            }),
          })),

        updateGeometry: (values) =>
          set((state) => ({
            activeSite: touch({
              ...state.activeSite,
              siteGeometry: {
                ...state.activeSite.siteGeometry,
                ...values,
              },
            }),
          })),

        updateParapet: (values) =>
          set((state) => ({
            activeSite: touch({
              ...state.activeSite,
              siteGeometry: {
                ...state.activeSite.siteGeometry,
                parapet: {
                  ...state.activeSite.siteGeometry
                    .parapet,
                  ...values,
                },
              },
            }),
          })),

        updateSetbacks: (values) =>
          set((state) => ({
            activeSite: touch({
              ...state.activeSite,
              siteGeometry: {
                ...state.activeSite.siteGeometry,
                setbacks: {
                  ...state.activeSite.siteGeometry
                    .setbacks,
                  ...values,
                },
              },
            }),
          })),

        updateArray: (values) =>
          set((state) => ({
            activeSite: touch({
              ...state.activeSite,
              siteGeometry: {
                ...state.activeSite.siteGeometry,
                array: {
                  ...state.activeSite.siteGeometry
                    .array,
                  ...values,
                },
              },
              pvConfiguration: {
                ...state.activeSite.pvConfiguration,
                rowSpacing:
                  values.rowSpacingM ??
                  state.activeSite.pvConfiguration
                    .rowSpacing,
                panelHeight:
                  values.rackHeightM ??
                  state.activeSite.pvConfiguration
                    .panelHeight,
                tilt:
                  values.tiltDeg ??
                  state.activeSite.pvConfiguration
                    .tilt,
                azimuth:
                  values.azimuthDeg ??
                  state.activeSite.pvConfiguration
                    .azimuth,
              },
            }),
          })),

        updatePV: (values) =>
          set((state) => ({
            activeSite: touch({
              ...state.activeSite,
              pvConfiguration: {
                ...state.activeSite.pvConfiguration,
                ...values,
              },
            }),
          })),

        setModuleProfile: (profileId) =>
          set((state) => {
            const profile =
              getPVModuleProfile(profileId);

            return {
              activeSite: touch({
                ...state.activeSite,
                pvConfiguration: {
                  ...state.activeSite
                    .pvConfiguration,
                  moduleProfileId: profile.id,
                  modulePower: profile.pmaxW,
                  moduleWidth: profile.widthM,
                  moduleLength: profile.lengthM,
                  moduleEfficiency:
                    profile.efficiencyPercent ??
                    state.activeSite
                      .pvConfiguration
                      .moduleEfficiency,
                  moduleNOCT: profile.noctC,
                  temperatureCoefficientPmax:
                    profile
                      .tempCoeffPmaxPercentPerC,
                  moduleVoc: profile.vocV,
                  moduleVmpp: profile.vmppV,
                  moduleIsc: profile.iscA,
                  moduleImpp: profile.imppA,
                },
              }),
            };
          }),

        reset: () =>
          set({
            activeSite:
              createDefaultFlatRoofSiteProfile(),
            selectedHour: 12,
          }),
      }),
      {
        name: "agritwin-flat-roof-profile",
        version: 1,
        partialize: (state) => ({
          activeSite: state.activeSite,
          selectedHour: state.selectedHour,
        }),
        migrate: (persisted) => {
          const candidate = (
            persisted as {
              activeSite?: unknown;
              selectedHour?: unknown;
            } | null
          )?.activeSite;

          return {
            activeSite:
              isFlatRoofSiteProfile(candidate)
                ? candidate
                : createDefaultFlatRoofSiteProfile(),
            selectedHour:
              typeof (
                persisted as {
                  selectedHour?: unknown;
                } | null
              )?.selectedHour === "number"
                ? (
                    persisted as {
                      selectedHour: number;
                    }
                  ).selectedHour
                : 12,
          };
        },
      },
    ),
  );
