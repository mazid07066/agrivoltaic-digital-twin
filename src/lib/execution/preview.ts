import type {
  ResolvedSimulationExecutionInput,
} from "./types";

export interface ExecutionInputPreview {
  scenario: {
    id: string;
    name: string;
    version: number;
    type: string;
    baseline: boolean;
  };

  site: {
    id: string;
    name: string;
    type: string;
    versionId: string;
    versionNumber: number;
    schemaVersion: number;
  };

  engine: {
    kind: string;
    version: string;
    controllerVersion:
      string | null;
    weatherAdapterVersion:
      string | null;
  };

  environment: {
    source: string;
    mode: string;
    datasetId:
      string | null;
    startTime: string;
    endTime: string;
    recordCount: number;
    coveragePercent:
      number | null;
    missingRequiredValues:
      number;
    requestFingerprint:
      string | null;
    datasetFingerprint:
      string | null;
  };

  execution: {
    simulationDate: string;
    inputFingerprint:
      string | null;
  };
}

export function createExecutionInputPreview(
  resolved:
    ResolvedSimulationExecutionInput,
): ExecutionInputPreview {
  const snapshot =
    resolved.inputSnapshot;

  return {
    scenario: {
      id:
        snapshot.scenario
          .scenarioId,

      name:
        snapshot.scenario
          .scenarioName,

      version:
        snapshot.scenario
          .scenarioVersion,

      type:
        snapshot.scenario
          .scenarioType,

      baseline:
        snapshot.scenario
          .isBaseline,
    },

    site: {
      id:
        snapshot.site.siteId,

      name:
        snapshot.site.siteName,

      type:
        snapshot.site.siteType,

      versionId:
        snapshot.site
          .siteVersionId,

      versionNumber:
        snapshot.site
          .siteVersionNumber,

      schemaVersion:
        snapshot.site
          .siteSchemaVersion,
    },

    engine: {
      kind:
        snapshot.engine
          .engineKind,

      version:
        snapshot.engine
          .engineVersion,

      controllerVersion:
        snapshot.engine
          .controllerVersion,

      weatherAdapterVersion:
        snapshot.engine
          .weatherAdapterVersion,
    },

    environment: {
      source:
        snapshot.environment
          .source,

      mode:
        snapshot.environment
          .mode,

      datasetId:
        snapshot.environment
          .datasetId,

      startTime:
        snapshot.environment
          .startTime,

      endTime:
        snapshot.environment
          .endTime,

      recordCount:
        snapshot.environment
          .recordCount,

      coveragePercent:
        snapshot.environment
          .coveragePercent,

      missingRequiredValues:
        snapshot.environment
          .missingRequiredValueCount,

      requestFingerprint:
        snapshot.environment
          .requestFingerprint,

      datasetFingerprint:
        snapshot.environment
          .datasetFingerprint,
    },

    execution: {
      simulationDate:
        snapshot.simulationDate,

      inputFingerprint:
        snapshot
          .inputFingerprint,
    },
  };
}
