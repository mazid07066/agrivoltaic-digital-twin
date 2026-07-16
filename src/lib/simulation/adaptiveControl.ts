import { AdaptiveControllerResults } from "@/types/simulation";

export interface TrackingCandidate {
  hour: number;
  daylight: boolean;
  standardCropIrradiance: number;
  reverseCropIrradiance: number;
  standardPVPower: number;
  reversePVPower: number;
}

const toDLI = (irradianceSum: number) =>
  irradianceSum * 0.45 * 4.57 * 3600 / 1_000_000;

/**
 * Starts from crop-protective reverse tracking, then admits standard-tracking
 * hours in descending PV-benefit order while retaining the crop DLI target.
 */
export function createAdaptiveSchedule(
  candidates: TrackingCandidate[],
  targetDLI: number,
  protectedZoneRatio = 1,
): AdaptiveControllerResults {
  const schedule: Array<"standard" | "reverse"> = Array(24).fill("reverse");
  let cropSum = candidates.reduce((sum, item) => sum + item.reverseCropIrradiance, 0);
  const ranked = candidates.filter((item) => item.daylight).sort((a, b) => {
    const aCropCost = Math.max(a.reverseCropIrradiance - a.standardCropIrradiance, 0.01);
    const bCropCost = Math.max(b.reverseCropIrradiance - b.standardCropIrradiance, 0.01);
    return (b.standardPVPower - b.reversePVPower) / bCropCost -
      (a.standardPVPower - a.reversePVPower) / aCropCost;
  });
  for (const item of ranked) {
    const nextCropSum = cropSum - item.reverseCropIrradiance + item.standardCropIrradiance;
    if (toDLI(nextCropSum) * protectedZoneRatio >= targetDLI) {
      schedule[item.hour] = "standard";
      cropSum = nextCropSum;
    }
  }
  const daylight = candidates.filter((item) => item.daylight);
  const standardTrackingHours = daylight.filter((item) => schedule[item.hour] === "standard").length;
  const wholeFieldDLI = toDLI(cropSum);
  const predictedDLI = wholeFieldDLI * protectedZoneRatio;
  return {
    enabled: true, targetDLI, predictedDLI: Number(predictedDLI.toFixed(2)),
    targetSatisfied: predictedDLI >= targetDLI,
    standardTrackingHours,
    reverseTrackingHours: daylight.length - standardTrackingHours,
    schedule,
    protectionBasis: "beneath-panel",
    wholeFieldDLI: Number(wholeFieldDLI.toFixed(2)),
    protectedZoneDLI: Number(predictedDLI.toFixed(2)),
    effectiveControllerTarget: Number((targetDLI / Math.max(protectedZoneRatio, 0.01)).toFixed(2)),
  };
}
