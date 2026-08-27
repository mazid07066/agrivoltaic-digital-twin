import { calculateValidationMetrics } from "./validation";
import type { ValidationMetrics } from "./validation";

export type ValidationLayer =
  | "irradiance"
  | "module_temperature"
  | "dc_electrical"
  | "inverter"
  | "end_to_end";

export interface LayeredValidationSeries {
  layer: ValidationLayer;
  quantity: string;
  unit: string;
  predicted: number[];
  measured: number[];
  timestamps?: string[];
  normalizationReference?: number;
}

export interface LayeredValidationResult {
  layer: ValidationLayer;
  quantity: string;
  unit: string;
  metrics: ValidationMetrics;
  interpretation: string[];
}

export function validateModelLayer(
  series: LayeredValidationSeries,
): LayeredValidationResult {
  const metrics = calculateValidationMetrics(series.predicted, series.measured);
  const interpretation: string[] = [];
  if (series.layer === "irradiance" && Math.abs(metrics.nmbePercent ?? 0) > 5) {
    interpretation.push(
      "Systematic POA bias suggests review of transposition, IAM, tracker geometry or shading.",
    );
  }
  if (series.layer === "module_temperature" && metrics.rmse > 5) {
    interpretation.push(
      "Module-temperature RMSE exceeds 5 °C; review wind exposure and thermal coefficients.",
    );
  }
  if (series.layer === "inverter" && Math.abs(metrics.nmbePercent ?? 0) > 2) {
    interpretation.push(
      "Inverter bias exceeds 2%; inspect part-load conversion, clipping and standby boundaries.",
    );
  }
  return {
    layer: series.layer,
    quantity: series.quantity,
    unit: series.unit,
    metrics,
    interpretation,
  };
}

export interface CalibratedParameterRevision {
  parameter: string;
  originalValue: number;
  updatedValue: number;
  unit: string;
  timestamp: string;
  reason: string;
  source: "measured_residual_calibration";
  confidence: number | null;
}

export function createCalibratedParameterRevision(input: {
  parameter: string;
  originalValue: number;
  updatedValue: number;
  unit: string;
  timestamp?: string;
  reason: string;
  confidence?: number | null;
}): CalibratedParameterRevision {
  if (!input.reason.trim()) {
    throw new Error("Calibration revisions require an explicit reason.");
  }
  return {
    parameter: input.parameter,
    originalValue: input.originalValue,
    updatedValue: input.updatedValue,
    unit: input.unit,
    timestamp: input.timestamp ?? new Date().toISOString(),
    reason: input.reason,
    source: "measured_residual_calibration",
    confidence: input.confidence ?? null,
  };
}
