"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getPVModuleProfile } from "@/lib/pv/moduleProfiles";
import type { SiteVersionOperationResult } from "@/lib/projects/types";
import { createDefaultFlatRoofSiteProfile } from "@/lib/sites/defaults";
import { isFlatRoofSiteProfile } from "@/lib/sites/migrations";
import type {
  FlatRoofGeometry,
  FlatRoofSiteProfile,
  SiteProfile,
} from "@/lib/sites/schema";
import type { PVConfiguration } from "@/types/simulation";

interface RooftopStore {
  activeSite: FlatRoofSiteProfile;
  databaseSiteId: string | null;
  activeVersionId: string | null;
  activeVersionNumber: number | null;
  lastSavedHash: string | null;
  lastSavedAt: string | null;
  isDirty: boolean;
  selectedHour: number;
  setSelectedHour: (hour: number) => void;
  replaceActiveSite: (
    site: SiteProfile,
    context?: {
      databaseSiteId: string;
      activeVersionId: string;
      activeVersionNumber?: number | null;
      lastSavedHash?: string | null;
    },
  ) => void;
  setDatabaseContext: (context: {
    databaseSiteId: string;
    activeVersionId: string;
    activeVersionNumber?: number | null;
    lastSavedHash?: string | null;
  }) => void;
  markSaved: (result: SiteVersionOperationResult) => void;
  markDirty: () => void;
  updateVersionMetadata: (values: {
    activeVersionNumber: number;
    lastSavedHash: string | null;
    lastSavedAt: string;
  }) => void;
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
        databaseSiteId: null,
        activeVersionId: null,
        activeVersionNumber: null,
        lastSavedHash: null,
        lastSavedAt: null,
        isDirty: false,
        selectedHour: 12,

        setSelectedHour: (selectedHour) =>
          set({ selectedHour }),

        replaceActiveSite: (site, context) => {
          if (!isFlatRoofSiteProfile(site)) {
            throw new Error("The rooftop store only accepts flat-roof profiles.");
          }

          set({
            activeSite: site,
            selectedHour: 12,
            databaseSiteId: context?.databaseSiteId ?? null,
            activeVersionId: context?.activeVersionId ?? null,
            activeVersionNumber: context?.activeVersionNumber ?? null,
            lastSavedHash: context?.lastSavedHash ?? null,
            lastSavedAt: null,
            isDirty: false,
          });
        },

        setDatabaseContext: (context) =>
          set({
            databaseSiteId: context.databaseSiteId,
            activeVersionId: context.activeVersionId,
            activeVersionNumber: context.activeVersionNumber ?? null,
            lastSavedHash: context.lastSavedHash ?? null,
            lastSavedAt: null,
            isDirty: false,
          }),

        markSaved: (result) => {
          if (!isFlatRoofSiteProfile(result.siteProfile)) {
            throw new Error("The rooftop store only accepts flat-roof profiles.");
          }

          set({
            activeSite: result.siteProfile,
            databaseSiteId: result.siteId,
            activeVersionId: result.activeVersionId,
            activeVersionNumber: result.activeVersionNumber,
            lastSavedHash: result.configurationHash,
            lastSavedAt: result.createdAt,
            isDirty: false,
          });
        },

        markDirty: () => set({ isDirty: true }),

        updateVersionMetadata: (values) =>
          set({
            activeVersionNumber: values.activeVersionNumber,
            lastSavedHash: values.lastSavedHash,
            lastSavedAt: values.lastSavedAt,
          }),

        updateIdentity: (values) =>
          set((state) => ({
            isDirty: true,
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
            isDirty: true,
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
            isDirty: true,
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
            isDirty: true,
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
            isDirty: true,
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
            isDirty: true,
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
              isDirty: true,
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
            databaseSiteId: null,
            activeVersionId: null,
            activeVersionNumber: null,
            lastSavedHash: null,
            lastSavedAt: null,
            isDirty: false,
            selectedHour: 12,
          }),
      }),
      {
        name: "agritwin-flat-roof-profile",
        version: 2,
        storage: createJSONStorage(() =>
          typeof window === "undefined"
            ? {
                getItem: () => null,
                setItem: () => undefined,
                removeItem: () => undefined,
              }
            : window.localStorage,
        ),
        partialize: (state) => ({
          activeSite: state.activeSite,
          databaseSiteId: state.databaseSiteId,
          activeVersionId: state.activeVersionId,
          activeVersionNumber: state.activeVersionNumber,
          lastSavedHash: state.lastSavedHash,
          lastSavedAt: state.lastSavedAt,
          isDirty: state.isDirty,
          selectedHour: state.selectedHour,
        }),
        migrate: (persisted) => {
          const candidate = (
            persisted as {
              activeSite?: unknown;
              selectedHour?: unknown;
              databaseSiteId?: unknown;
              activeVersionId?: unknown;
              activeVersionNumber?: unknown;
              lastSavedHash?: unknown;
              lastSavedAt?: unknown;
              isDirty?: unknown;
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
            databaseSiteId:
              typeof (persisted as { databaseSiteId?: unknown } | null)
                ?.databaseSiteId === "string"
                ? (persisted as { databaseSiteId: string }).databaseSiteId
                : null,
            activeVersionId:
              typeof (persisted as { activeVersionId?: unknown } | null)
                ?.activeVersionId === "string"
                ? (persisted as { activeVersionId: string }).activeVersionId
                : null,
            activeVersionNumber:
              typeof (persisted as { activeVersionNumber?: unknown } | null)
                ?.activeVersionNumber === "number"
                ? (persisted as { activeVersionNumber: number })
                    .activeVersionNumber
                : null,
            lastSavedHash:
              typeof (persisted as { lastSavedHash?: unknown } | null)
                ?.lastSavedHash === "string"
                ? (persisted as { lastSavedHash: string }).lastSavedHash
                : null,
            lastSavedAt:
              typeof (persisted as { lastSavedAt?: unknown } | null)
                ?.lastSavedAt === "string"
                ? (persisted as { lastSavedAt: string }).lastSavedAt
                : null,
            isDirty:
              (persisted as { isDirty?: unknown } | null)?.isDirty === true,
          };
        },
      },
    ),
  );
