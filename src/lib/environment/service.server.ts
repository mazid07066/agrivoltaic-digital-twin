import "server-only";

import {
  fetchOpenMeteoEnvironment,
} from "./openMeteo";

import {
  resolveScenarioEnvironmentalRequest,
  type ScenarioEnvironmentContext,
} from "./scenarioResolver";

import type {
  EnvironmentalDataset,
} from "./types";

import type {
  Scenario,
} from "@/lib/scenarios/types";

import {
  getLocalEnvironmentDatasetDefinition,
} from "./localDataset/registry";

import {
  loadLocalCsvEnvironmentalDataset,
} from "./localDataset/csv.server";

import {
  loadSolarMemEnvironmentalDataset,
} from "./localDataset/solarMem.server";

export async function loadScenarioEnvironment(
  scenario: Scenario,
  context: ScenarioEnvironmentContext,
): Promise<EnvironmentalDataset> {
  const request =
    resolveScenarioEnvironmentalRequest(
      scenario,
      context,
    );

  switch (
    request.source
  ) {
    case "open_meteo":
      return fetchOpenMeteoEnvironment(
        request,
      );

    case "uploaded_dataset": {
      if (
        !request.datasetId
      ) {
        throw new Error(
          "Uploaded environmental dataset scenarios require datasetId.",
        );
      }

      const definition =
        getLocalEnvironmentDatasetDefinition(
          request.datasetId,
        );

      if (!definition) {
        throw new Error(
          `Environmental dataset "${request.datasetId}" is not registered.`,
        );
      }

      if (
        definition.parser ===
        "solar_mem"
      ) {
        return loadSolarMemEnvironmentalDataset(
          definition,
          request,
        );
      }

      return loadLocalCsvEnvironmentalDataset(
        definition,
        request,
      );
    }

    case "sensor":
      throw new Error(
        "Sensor environmental data is not yet enabled.",
      );

    case "synthetic":
      throw new Error(
        "Synthetic environmental data is not yet enabled.",
      );

    case "manual":
      throw new Error(
        "Manual environmental data is not yet enabled.",
      );

    default: {
      const exhaustive:
        never =
        request.source;

      throw new Error(
        `Unsupported environmental source: ${exhaustive}`,
      );
    }
  }
}
