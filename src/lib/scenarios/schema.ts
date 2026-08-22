import { z } from "zod";

export const scenarioStatusSchema = z.enum([
  "draft",
  "ready",
  "active",
  "archived",
]);

export const scenarioTypeSchema = z.enum([
  "agrivoltaic",
  "agriculture_baseline",
  "pv_baseline",
  "rooftop_pv",
  "research",
  "custom",
]);

const optionalFiniteNumber = z
  .number()
  .finite()
  .nullable()
  .optional();

const optionalNonNegativeNumber = z
  .number()
  .finite()
  .nonnegative()
  .nullable()
  .optional();

export const technicalConfigSchema = z.object({
  moduleId: z.string().nullable().optional(),
  inverterId: z.string().nullable().optional(),

  modulePowerW: optionalNonNegativeNumber,

  modulesPerString: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  stringsPerMppt: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  minimumDesignTemperatureC: optionalFiniteNumber,

  panelHeightM: optionalNonNegativeNumber,

  rowSpacingM: optionalNonNegativeNumber,

  tiltDeg: optionalFiniteNumber,

  azimuthDeg: optionalFiniteNumber,

  gcr: z
    .number()
    .min(0)
    .max(1)
    .nullable()
    .optional(),

  trackingMode: z
    .enum([
      "fixed",
      "standard",
      "reverse",
      "custom",
    ])
    .nullable()
    .optional(),

  rows: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  modulesPerRow: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  systemEfficiency: z
    .number()
    .min(0)
    .max(1)
    .nullable()
    .optional(),

  additionalValues: z
    .record(z.string(), z.unknown())
    .optional(),
});

export const agriculturalConfigSchema = z.object({
  cropId: z.string().nullable().optional(),

  cropName: z.string().nullable().optional(),

  season: z.string().nullable().optional(),

  targetDliMolM2Day: optionalNonNegativeNumber,

  minimumDliMolM2Day: optionalNonNegativeNumber,

  minimumCropRetention: z
    .number()
    .min(0)
    .max(1)
    .nullable()
    .optional(),

  yieldModel: z.string().nullable().optional(),

  additionalValues: z
    .record(z.string(), z.unknown())
    .optional(),
});

export const weatherConfigSchema = z.object({
  source: z
    .enum([
      "open_meteo",
      "sensor",
      "uploaded_dataset",
      "synthetic",
      "manual",
    ])
    .nullable()
    .optional(),

  mode: z
    .enum([
      "historical",
      "forecast",
      "typical",
      "dataset",
      "sensor",
    ])
    .nullable()
    .optional(),

  startDate: z.string().nullable().optional(),

  endDate: z.string().nullable().optional(),

  year: z
    .number()
    .int()
    .min(1900)
    .max(2200)
    .nullable()
    .optional(),

  datasetId: z.string().nullable().optional(),

  latitude: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional(),

  longitude: z
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .optional(),

  timezone: z.string().nullable().optional(),

  additionalValues: z
    .record(z.string(), z.unknown())
    .optional(),
});

export const policyConfigSchema = z.object({
  minimumCropRetention: z
    .number()
    .min(0)
    .max(1)
    .nullable()
    .optional(),

  maximumGcr: z
    .number()
    .min(0)
    .max(1)
    .nullable()
    .optional(),

  minimumLer: optionalNonNegativeNumber,

  minimumPanelHeightM: optionalNonNegativeNumber,

  maximumDliReduction: z
    .number()
    .min(0)
    .max(1)
    .nullable()
    .optional(),

  minimumRenewableEnergyKwh:
    optionalNonNegativeNumber,

  policyPreset: z.string().nullable().optional(),

  additionalValues: z
    .record(z.string(), z.unknown())
    .optional(),
});

export const economicConfigSchema = z.object({
  currency: z.string().nullable().optional(),

  capex: optionalNonNegativeNumber,

  annualOpex: optionalNonNegativeNumber,

  electricityTariffPerKwh:
    optionalNonNegativeNumber,

  cropPrice: optionalNonNegativeNumber,

  discountRate: z
    .number()
    .min(0)
    .max(1)
    .nullable()
    .optional(),

  projectLifetimeYears: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  additionalValues: z
    .record(z.string(), z.unknown())
    .optional(),
});

export const scenarioMetadataSchema = z.object({
  studyName: z.string().nullable().optional(),

  researcher: z.string().nullable().optional(),

  objective: z.string().nullable().optional(),

  notes: z.string().nullable().optional(),

  tags: z.array(z.string()).optional(),

  provenance: z
    .record(z.string(), z.unknown())
    .optional(),
});

export const createScenarioSchema = z.object({
  projectId: z.string().uuid(),

  siteId: z.string().uuid(),

  name: z
    .string()
    .trim()
    .min(1)
    .max(200),

  description: z
    .string()
    .max(5000)
    .nullable()
    .optional(),

  scenarioType: scenarioTypeSchema
    .default("agrivoltaic"),

  status: scenarioStatusSchema.default("draft"),

  isBaseline: z.boolean().default(false),

  parentScenarioId: z
    .string()
    .uuid()
    .nullable()
    .optional(),

  configuration: z
    .record(z.string(), z.unknown())
    .default({}),

  technicalConfig: technicalConfigSchema
    .default({}),

  agriculturalConfig: agriculturalConfigSchema
    .default({}),

  weatherConfig: weatherConfigSchema
    .default({}),

  policyConfig: policyConfigSchema
    .default({}),

  economicConfig: economicConfigSchema
    .default({}),

  metadata: scenarioMetadataSchema.default({}),
});

export const updateScenarioSchema =
  createScenarioSchema
    .omit({
      projectId: true,
      siteId: true,
    })
    .partial();
