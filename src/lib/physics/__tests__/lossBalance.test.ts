import { describe, expect, it } from "vitest";
import {
  applyDcLossChain,
  calculateEnergyBalance,
  createDefaultExplicitLossConfiguration,
} from "@/lib/physics";

describe("explicit loss accounting", () => {
  it("treats negative module-quality loss as a gain", () => {
    const configuration = createDefaultExplicitLossConfiguration();
    const result = applyDcLossChain(100_000, configuration);
    const quality = result.stages[0];
    expect(quality.lossPowerW).toBeLessThan(0);
    expect(quality.outputPowerW).toBeGreaterThan(quality.inputPowerW);
  });

  it("conserves power across named stages", () => {
    const configuration = createDefaultExplicitLossConfiguration();
    const result = applyDcLossChain(100_000, configuration);
    const balance = calculateEnergyBalance({
      inputPowerW: 100_000,
      deliveredPowerW: result.outputPowerW,
      stages: result.stages,
    });
    expect(balance.balanceResidualW).toBeCloseTo(0, 8);
    expect(balance.withinTolerance).toBe(true);
  });
});
