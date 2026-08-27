import catalogue from "../../../../inverter-catalogue.json";

import type {
  InverterSpecification,
} from "./types";

export interface InverterCatalogueProfile
  extends InverterSpecification {
  manufacturer: string;

  series: string;

  model: string;

  inverterType: string;

  topology: string;

  efficiency: {
    maximumEfficiency: number;

    europeanEfficiency:
      number | null;

    curveAvailable: boolean;

    curveDigitized: boolean;
  };

  general: {
    widthMm:
      number | null;

    heightMm:
      number | null;

    depthMm:
      number | null;

    weightKg:
      number | null;

    operatingTemperatureMinC:
      number | null;

    operatingTemperatureMaxC:
      number | null;

    noiseDbA:
      number | null;

    nightSelfConsumptionW:
      number | null;

    coolingConcept:
      string | null;

    protectionDegree:
      string | null;
  };

  communications: {
    ethernet: boolean;

    wifi: boolean;

    rs485Optional: boolean;

    smaModbus: boolean;

    sunSpecModbus: boolean;

    speedwireWebconnect: boolean;
  };

  features: {
    integratedDcDisconnector:
      boolean;

    groundFaultMonitoring:
      boolean;

    gridMonitoring:
      boolean;

    dcReversePolarityProtection:
      boolean;

    residualCurrentMonitoring:
      boolean;

    shadeManagement:
      string | null;

    offGridCapable:
      boolean;
  };

  source: string;

  sourceFile: string;

  datasheetStatus:
    string | null;
}

/*
 * JSON catalogue profiles use the same dc/ac contracts
 * as the Phase 9E inverter model.
 *
 * maximumEfficiency remains available in ac because that
 * field is part of the existing inverter specification.
 */
type RawInverterCatalogueProfile =
  Omit<
    InverterCatalogueProfile,
    "name" | "ac"
  > & {
    name?: string;

    ac:
      Omit<
        InverterCatalogueProfile["ac"],
        "maximumEfficiency"
      >;
  };

const raw =
  catalogue.inverters as unknown as
    RawInverterCatalogueProfile[];

export const INVERTER_PROFILES:
  InverterCatalogueProfile[] =
  raw.map(
    (
      profile,
    ) => ({
      ...profile,

      name:
        profile.name ??
        `${profile.manufacturer} ${profile.model}`,

      ac: {
        ...profile.ac,

        maximumEfficiency:
          profile.efficiency
            .maximumEfficiency,
      },

      nightSelfConsumptionW:
        profile.general
          .nightSelfConsumptionW ??
        undefined,
    }),
  );

export const INVERTER_MANUFACTURERS =
  [
    ...new Set(
      INVERTER_PROFILES.map(
        (
          profile,
        ) =>
          profile.manufacturer,
      ),
    ),
  ].sort();

export function findInverterProfile(
  id:
    string,
): InverterCatalogueProfile | null {
  return (
    INVERTER_PROFILES.find(
      (
        profile,
      ) =>
        profile.id === id,
    ) ??
    null
  );
}

export function getInverterProfile(
  id:
    string,
): InverterCatalogueProfile {
  const profile =
    findInverterProfile(
      id,
    );

  if (!profile) {
    throw new Error(
      `Unknown inverter catalogue profile: ${id}`,
    );
  }

  return profile;
}

export const DEFAULT_INVERTER_PROFILE_ID =
  "sma-sunny-tripower-core1-stp50-40";
