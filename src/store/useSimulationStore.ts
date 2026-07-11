"use client";

import { create } from "zustand";
import {
  CropId,
  PVConfiguration,
  SimulationConfiguration,
  SiteConfiguration,
  TrackingMode,
} from "@/types/simulation";

interface SimulationStore {
  configuration: SimulationConfiguration;
  selectedHour: number;
  setSelectedHour: (hour: number) => void;
  updateSite: (values: Partial<SiteConfiguration>) => void;
  updatePV: (values: Partial<PVConfiguration>) => void;
  setCrop: (cropId: CropId) => void;
  setTrackingMode: (trackingMode: TrackingMode) => void;
  setSimulationDate: (date: string) => void;
  resetConfiguration: () => void;
}

const initialConfiguration: SimulationConfiguration = {
  site: {
    name: "Dhaka Agrivoltaic Research Site",
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: "Asia/Dhaka",
    fieldLength: 44,
    fieldWidth: 20,
  },
  pv: {
    numberOfRows: 6,
    modulesPerRow: 10,
    moduleWidth: 1.13,
    moduleLength: 2.28,
    modulePower: 550,
    rowSpacing: 4,
    panelHeight: 2,
    tilt: 20,
    azimuth: 180,
    systemEfficiency: 0.82,
    trackingMode: "custom",
    groundAlbedo: 0.2,
    maximumTrackerAngle: 60,
  },
  cropId: "tomato",
  simulationDate: new Date().toISOString().slice(0, 10),
};

export const useSimulationStore = create<SimulationStore>((set) => ({
  configuration: initialConfiguration,
  selectedHour: 12,

  setSelectedHour: (selectedHour) => set({ selectedHour }),

  updateSite: (values) =>
    set((state) => ({
      configuration: {
        ...state.configuration,
        site: {
          ...state.configuration.site,
          ...values,
        },
      },
    })),

  updatePV: (values) =>
    set((state) => ({
      configuration: {
        ...state.configuration,
        pv: {
          ...state.configuration.pv,
          ...values,
        },
      },
    })),

  setCrop: (cropId) =>
    set((state) => ({
      configuration: {
        ...state.configuration,
        cropId,
      },
    })),

  setTrackingMode: (trackingMode) =>
    set((state) => ({
      configuration: {
        ...state.configuration,
        pv: {
          ...state.configuration.pv,
          trackingMode,
        },
      },
    })),

  setSimulationDate: (simulationDate) =>
    set((state) => ({
      configuration: {
        ...state.configuration,
        simulationDate,
      },
    })),

  resetConfiguration: () =>
    set({
      configuration: initialConfiguration,
      selectedHour: 12,
    }),
}));
