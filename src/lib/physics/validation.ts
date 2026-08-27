export interface ValidationMetrics {
  sampleCount: number;
  mbe: number;
  mae: number;
  rmse: number;
  nmbePercent: number | null;
  nrmsePercent: number | null;
  rSquared: number | null;
  maximumAbsoluteError: number;
  percentile95AbsoluteError: number;
}

export function calculateValidationMetrics(
  predicted: number[],
  measured: number[],
): ValidationMetrics {
  if (predicted.length !== measured.length || predicted.length === 0) {
    throw new Error("Predicted and measured arrays must have the same non-zero length.");
  }
  const errors = predicted.map((value, index) => value - measured[index]);
  const absoluteErrors = errors.map(Math.abs).sort((a, b) => a - b);
  const mean = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  const mbe = mean(errors);
  const mae = mean(absoluteErrors);
  const rmse = Math.sqrt(mean(errors.map((error) => error ** 2)));
  const measuredMean = mean(measured);
  const total = measured.reduce((sum, value) => sum + (value - measuredMean) ** 2, 0);
  const residual = errors.reduce((sum, value) => sum + value ** 2, 0);
  const percentileIndex = Math.min(
    absoluteErrors.length - 1,
    Math.ceil(0.95 * absoluteErrors.length) - 1,
  );
  return {
    sampleCount: predicted.length,
    mbe,
    mae,
    rmse,
    nmbePercent: measuredMean !== 0 ? (mbe / measuredMean) * 100 : null,
    nrmsePercent: measuredMean !== 0 ? (rmse / measuredMean) * 100 : null,
    rSquared: total > 0 ? 1 - residual / total : null,
    maximumAbsoluteError: absoluteErrors[absoluteErrors.length - 1],
    percentile95AbsoluteError: absoluteErrors[percentileIndex],
  };
}
