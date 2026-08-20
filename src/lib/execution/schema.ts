import {
  z,
} from "zod";

export const simulationExecutionStatusSchema =
  z.enum([
    "queued",
    "running",
    "completed",
    "failed",
    "cancelled",
  ]);

export const simulationEngineKindSchema =
  z.enum([
    "land",
    "rooftop",
  ]);

export const simulationEngineIdentitySchema =
  z.object({
    executionContractVersion:
      z.string().min(1),

    engineKind:
      simulationEngineKindSchema,

    engineVersion:
      z.string().min(1),

    controllerVersion:
      z.string().nullable(),

    weatherAdapterVersion:
      z.string().nullable(),

    moduleCatalogueVersion:
      z.string().nullable(),
  });

export const executionIdentitySchema =
  z.object({
    projectId:
      z.string().uuid(),

    siteId:
      z.string().uuid(),

    siteVersionId:
      z.string().uuid(),

    scenarioId:
      z.string().uuid(),

    scenarioVersion:
      z.number()
        .int()
        .positive(),

    simulationDate:
      z.string().regex(
        /^\d{4}-\d{2}-\d{2}$/,
      ),
  });

export const environmentalExecutionIdentitySchema =
  z.object({
    source:
      z.enum([
        "open_meteo",
        "sensor",
        "uploaded_dataset",
        "synthetic",
        "manual",
      ]),

    mode:
      z.enum([
        "historical",
        "forecast",
        "typical",
        "sensor",
        "dataset",
      ]),

    datasetId:
      z.string()
        .nullable(),

    requestFingerprint:
      z.string()
        .nullable(),

    datasetFingerprint:
      z.string()
        .nullable(),

    requestedCoordinate:
      z.object({
        latitude:
          z.number()
            .min(-90)
            .max(90),

        longitude:
          z.number()
            .min(-180)
            .max(180),
      }),

    resolvedCoordinate:
      z.object({
        latitude:
          z.number()
            .min(-90)
            .max(90),

        longitude:
          z.number()
            .min(-180)
            .max(180),
      })
        .nullable(),

    timezone:
      z.string()
        .min(1),

    startTime:
      z.string()
        .min(1),

    endTime:
      z.string()
        .min(1),

    recordCount:
      z.number()
        .int()
        .nonnegative(),

    expectedRecordCount:
      z.number()
        .int()
        .nonnegative()
        .nullable(),

    coveragePercent:
      z.number()
        .min(0)
        .max(100)
        .nullable(),

    missingRequiredValueCount:
      z.number()
        .int()
        .nonnegative(),

    warnings:
      z.array(
        z.string(),
      ),
  });

export const canonicalHourlySimulationPointSchema =
  z.object({
    hourIndex:
      z.number()
        .int()
        .min(0)
        .max(23),

    timestamp:
      z.string()
        .min(1),

    solarAltitudeDeg:
      z.number()
        .nullable(),

    solarAzimuthDeg:
      z.number()
        .nullable(),

    ghiWm2:
      z.number()
        .nullable(),

    poaWm2:
      z.number()
        .nullable(),

    moduleTemperatureC:
      z.number()
        .nullable(),

    pvPowerKw:
      z.number()
        .nullable(),

    trackerAngleDeg:
      z.number()
        .nullable(),

    trackingState:
      z.string()
        .nullable(),

    openFieldDliIncrementMolM2:
      z.number()
        .nullable(),

    cropDliIncrementMolM2:
      z.number()
        .nullable(),

    additionalValues:
      z.record(
        z.string(),
        z.unknown(),
      ),
  });

export const canonicalSimulationSummarySchema =
  z.object({
    engineKind:
      simulationEngineKindSchema,

    siteType:
      z.string()
        .min(1),

    installedCapacityKw:
      z.number()
        .nullable(),

    dailyEnergyKwh:
      z.number()
        .nullable(),

    specificYieldKwhPerKw:
      z.number()
        .nullable(),

    openFieldDliMolM2:
      z.number()
        .nullable(),

    cropDliMolM2:
      z.number()
        .nullable(),

    estimatedCropYieldPercent:
      z.number()
        .nullable(),

    landEquivalentRatio:
      z.number()
        .nullable(),

    groundCoverageRatioPercent:
      z.number()
        .nullable(),

    usableAreaPercent:
      z.number()
        .nullable(),

    moduleCount:
      z.number()
        .int()
        .nonnegative()
        .nullable(),

    additionalMetrics:
      z.record(
        z.string(),
        z.union([
          z.number(),
          z.string(),
          z.boolean(),
          z.null(),
        ]),
      ),
  });
