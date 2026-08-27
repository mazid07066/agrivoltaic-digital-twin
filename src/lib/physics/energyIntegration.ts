export interface TimestepReport {
  rawRowCount: number;
  simulationRowCount: number;
  medianTimestepSeconds: number | null;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  duplicateTimestampCount: number;
  gapCount: number;
}

export function inspectTimesteps(timestamps: string[]): TimestepReport {
  const instants = timestamps
    .map((timestamp) => ({ timestamp, milliseconds: new Date(timestamp).getTime() }))
    .filter((item) => Number.isFinite(item.milliseconds))
    .sort((a, b) => a.milliseconds - b.milliseconds);
  const differences = instants
    .slice(1)
    .map((item, index) => (item.milliseconds - instants[index].milliseconds) / 1000);
  const positive = differences.filter((value) => value > 0).sort((a, b) => a - b);
  const median =
    positive.length === 0
      ? null
      : positive.length % 2 === 1
        ? positive[(positive.length - 1) / 2]
        : (positive[positive.length / 2 - 1] + positive[positive.length / 2]) / 2;
  return {
    rawRowCount: timestamps.length,
    simulationRowCount: instants.length,
    medianTimestepSeconds: median,
    firstTimestamp: instants[0]?.timestamp ?? null,
    lastTimestamp: instants[instants.length - 1]?.timestamp ?? null,
    duplicateTimestampCount: differences.filter((value) => value === 0).length,
    gapCount:
      median === null
        ? 0
        : differences.filter((value) => value > median * 1.5).length,
  };
}

export function integratePowerSeriesKwh(input: {
  timestamps: string[];
  powerW: number[];
  finalIntervalSeconds?: number;
}): { energyKwh: number; timestep: TimestepReport } {
  if (input.timestamps.length !== input.powerW.length) {
    throw new Error("Power and timestamp series must have equal lengths.");
  }
  const timestep = inspectTimesteps(input.timestamps);
  const fallbackSeconds =
    input.finalIntervalSeconds ?? timestep.medianTimestepSeconds ?? 3600;
  let energyWh = 0;
  for (let index = 0; index < input.powerW.length; index += 1) {
    const current = new Date(input.timestamps[index]).getTime();
    const next =
      index + 1 < input.timestamps.length
        ? new Date(input.timestamps[index + 1]).getTime()
        : Number.NaN;
    const seconds =
      Number.isFinite(current) && Number.isFinite(next) && next > current
        ? (next - current) / 1000
        : fallbackSeconds;
    energyWh += Math.max(0, input.powerW[index]) * seconds / 3600;
  }
  return { energyKwh: energyWh / 1000, timestep };
}
