import {
  environmentalDataRequestSchema,
} from "./schema";

import type {
  EnvironmentalDataRequest,
} from "./request";

import type {
  GeographicCoordinate,
} from "./types";

import type {
  Scenario,
} from "@/lib/scenarios/types";

export interface ScenarioEnvironmentContext {
  /**
   * Coordinates from the currently selected
   * AgriTwin site.
   */
  siteCoordinate:
    GeographicCoordinate;

  /**
   * Site timezone when known.
   */
  siteTimezone?:
    string | null;
}

function yearRange(
  year: number,
): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate:
      `${year}-01-01`,

    endDate:
      `${year}-12-31`,
  };
}

function resolveCoordinate(
  scenario: Scenario,
  context: ScenarioEnvironmentContext,
): GeographicCoordinate {
  const latitude =
    scenario.weatherConfig.latitude;

  const longitude =
    scenario.weatherConfig.longitude;

  if (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude)
  ) {
    return {
      latitude,
      longitude,
    };
  }

  return context.siteCoordinate;
}

function resolveDateRange(
  scenario: Scenario,
): {
  startDate: string;
  endDate: string;
} {
  const weather =
    scenario.weatherConfig;

  if (
    weather.startDate &&
    weather.endDate
  ) {
    return {
      startDate:
        weather.startDate,

      endDate:
        weather.endDate,
    };
  }

  if (
    weather.year !== null &&
    weather.year !== undefined
  ) {
    return yearRange(
      weather.year,
    );
  }

  throw new Error(
    "Scenario weather configuration requires either a start/end date range or a year.",
  );
}

export function resolveScenarioEnvironmentalRequest(
  scenario: Scenario,
  context: ScenarioEnvironmentContext,
): EnvironmentalDataRequest {
  const weather =
    scenario.weatherConfig;

  const source =
    weather.source ??
    "open_meteo";

  const mode =
    weather.mode ??
    "historical";

  if (
    source === "open_meteo" &&
    mode !== "historical" &&
    mode !== "forecast"
  ) {
    throw new Error(
      `Open-Meteo scenario mode "${mode}" is not supported.`,
    );
  }

  const {
    startDate,
    endDate,
  } =
    resolveDateRange(
      scenario,
    );

  const coordinate =
    resolveCoordinate(
      scenario,
      context,
    );

  const timezone =
    weather.timezone ??
    context.siteTimezone ??
    "auto";

  return environmentalDataRequestSchema.parse(
    {
      source,
      mode,
      coordinate,
      startDate,
      endDate,
      timezone,
      datasetId:
        weather.datasetId ??
        null,
    },
  );
}
