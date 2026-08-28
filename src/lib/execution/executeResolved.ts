import {
  createElectricalSimulationResult,
} from "@/lib/electrical/adapters/executionElectricalAdapter";

import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
} from "@/lib/electrical/inverter/catalogue";

import {
  assessPVInverterCompatibility,
} from "@/lib/electrical/compatibility";

import {
  findPVModuleProfile,
} from "@/lib/pv/moduleProfiles";

import {
  executeLandSimulation,
} from "./landAdapter";

import {
  executeRooftopSimulation,
} from "./rooftopAdapter";

import type {
  ResolvedSimulationExecutionInput,
  SimulationExecutionResult,
} from "./types";

export function executeResolvedSimulation(
  input:
    ResolvedSimulationExecutionInput,
): SimulationExecutionResult {
  const engineKind =
    input.inputSnapshot
      .engine
      .engineKind;

  let scientificResult:
    SimulationExecutionResult;

  switch (
    engineKind
  ) {
    case "land":
      scientificResult =
        executeLandSimulation(
          input,
        );
      break;

    case "rooftop":
      scientificResult =
        executeRooftopSimulation(
          input,
        );
      break;

    default: {
      const exhaustiveCheck:
        never =
        engineKind;

      throw new Error(
        `Unsupported simulation engine: ${String(
          exhaustiveCheck,
        )}`,
      );
    }
  }

  const selectedInverterId =
    input.scenario
      .technicalConfig
      .inverterId
      ?.trim() ||
    input.siteVersion
      .configuration
      .pvConfiguration
      .inverterProfileId ||
    DEFAULT_INVERTER_PROFILE_ID;

  const selectedInverter =
    getInverterProfile(
      selectedInverterId,
    );

  const sitePvConfiguration =
    input.siteVersion
      .configuration
      .pvConfiguration;

  const selectedModuleId =
    input.scenario
      .technicalConfig
      .moduleId
      ?.trim() ||
    sitePvConfiguration
      .moduleProfileId;

  const selectedModule =
    findPVModuleProfile(
      selectedModuleId,
    );

  if (!selectedModule) {
    throw new Error(
      `Unknown PV module catalogue profile: ${selectedModuleId}`,
    );
  }

  const compatibility =
    assessPVInverterCompatibility({
      module:
        selectedModule,

      inverter:
        selectedInverter,

      moduleCount:
        scientificResult
          .summary
          .moduleCount,

      modulesPerString:
        input.scenario
          .technicalConfig
          .modulesPerString ??
        sitePvConfiguration
          .modulesPerString ??
        null,

      stringsPerInverter:
        input.scenario
          .technicalConfig
          .stringsPerInverter ??
        sitePvConfiguration
          .stringsPerInverter ??
        null,

      stringsPerMppt:
        input.scenario
          .technicalConfig
          .stringsPerMppt ??
        sitePvConfiguration
          .stringsPerMppt ??
        null,

      minimumDesignTemperatureC:
        input.scenario
          .technicalConfig
          .minimumDesignTemperatureC ??
        sitePvConfiguration
          .minimumDesignTemperatureC ??
        null,

      maximumDesignCellTemperatureC:
        input.scenario
          .technicalConfig
          .maximumDesignCellTemperatureC ??
        sitePvConfiguration
          .maximumDesignCellTemperatureC ??
        null,

      bifacialCurrentFactor:
        input.scenario
          .technicalConfig
          .bifacialCurrentFactor ??
        sitePvConfiguration
          .bifacialCurrentFactor ??
        null,

      inverterCount:
        input.scenario
          .technicalConfig
          .inverterCount ??
        sitePvConfiguration
          .inverterCount ??
        1,
    });

  /*
   * Phase 9E electrical processing is deliberately
   * downstream of the verified scientific PV engines.
   *
   * Neither the Phase 7B land engine nor the Phase 8C
   * rooftop engine is modified by the electrical model.
   */
  return {
    ...scientificResult,

    electrical:
      createElectricalSimulationResult(
        scientificResult,
        selectedInverter,
        compatibility,

        {
          moduleProfileId:
            selectedModule.id,

          moduleCount:
            scientificResult
              .summary
              .moduleCount,

          modulesPerString:
            input.scenario
              .technicalConfig
              .modulesPerString ??
            sitePvConfiguration
              .modulesPerString ??
            null,

          stringsPerInverter:
            input.scenario
              .technicalConfig
              .stringsPerInverter ??
            sitePvConfiguration
              .stringsPerInverter ??
            null,

          stringsPerMppt:
            input.scenario
              .technicalConfig
              .stringsPerMppt ??
            sitePvConfiguration
              .stringsPerMppt ??
            null,

          mpptStringAllocation:
            sitePvConfiguration
              .mpptStringAllocation ??
            null,

          inverterCount:
            input.scenario
              .technicalConfig
              .inverterCount ??
            sitePvConfiguration
              .inverterCount ??
            1,
        },
      ),
  };
}
