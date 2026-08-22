import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createThreePhaseAcBus,
} from "../distribution/acBus";

import {
  dispatchElectricalPower,
} from "../distribution/dispatch";

import {
  evaluateElectricalBalance,
} from "../distribution/energyBalance";

import {
  summarizeElectricalDistribution,
} from "../distribution/summary";

import type {
  ElectricalFeederDefinition,
} from "../distribution/types";

const timestamp =
  "2026-08-20T12:00:00";

function feeder(
  id: string,
  loadKw: number,
  priority: number,
  connectedLoadKw =
    loadKw,
): ElectricalFeederDefinition {
  return {
    id,

    name:
      id,

    nominalVoltageV:
      400,

    phases:
      3,

    connectedLoadKw,

    powerFactor:
      1,

    priority,

    enabled:
      true,

    loadProfile: [
      {
        timestamp,

        activePowerKw:
          loadKw,

        powerFactor:
          1,
      },
    ],
  };
}

describe(
  "Phase 9E AC bus",
  () => {
    it(
      "creates the nominal 230/400 V 50 Hz three-phase bus",
      () => {
        const bus =
          createThreePhaseAcBus();

        expect(
          bus.lineNeutralVoltageV,
        ).toBe(
          230,
        );

        expect(
          bus.lineLineVoltageV,
        ).toBe(
          400,
        );

        expect(
          bus.frequencyHz,
        ).toBe(
          50,
        );

        expect(
          bus.phases,
        ).toBe(
          3,
        );
      },
    );
  },
);

describe(
  "Phase 9E grid-connected dispatch",
  () => {
    it(
      "uses PV for load first and exports surplus",
      () => {
        const result =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "grid_connected",

              pvAcAvailableKw:
                40,

              feeders: [
                feeder(
                  "feeder-1",
                  20,
                  1,
                ),

                feeder(
                  "feeder-2",
                  10,
                  2,
                ),
              ],
            },
          );

        expect(
          result.totalRequestedLoadKw,
        ).toBe(
          30,
        );

        expect(
          result.totalServedLoadKw,
        ).toBe(
          30,
        );

        expect(
          result.pvToLoadKw,
        ).toBe(
          30,
        );

        expect(
          result.gridImportKw,
        ).toBe(
          0,
        );

        expect(
          result.gridExportKw,
        ).toBe(
          10,
        );

        expect(
          result.curtailedPvKw,
        ).toBe(
          0,
        );

        expect(
          result.unservedLoadKw,
        ).toBe(
          0,
        );

        expect(
          result.balanceWithinTolerance,
        ).toBe(
          true,
        );
      },
    );

    it(
      "imports grid power when PV is insufficient",
      () => {
        const result =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "grid_connected",

              pvAcAvailableKw:
                20,

              feeders: [
                feeder(
                  "feeder-1",
                  30,
                  1,
                ),

                feeder(
                  "feeder-2",
                  10,
                  2,
                ),
              ],
            },
          );

        expect(
          result.totalServedLoadKw,
        ).toBe(
          40,
        );

        expect(
          result.pvToLoadKw,
        ).toBe(
          20,
        );

        expect(
          result.gridImportKw,
        ).toBe(
          20,
        );

        expect(
          result.gridExportKw,
        ).toBe(
          0,
        );

        expect(
          result.unservedLoadKw,
        ).toBe(
          0,
        );

        expect(
          result.balanceWithinTolerance,
        ).toBe(
          true,
        );
      },
    );

    it(
      "serves all load entirely from grid when PV is zero",
      () => {
        const result =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "grid_connected",

              pvAcAvailableKw:
                0,

              feeders: [
                feeder(
                  "load",
                  25,
                  1,
                ),
              ],
            },
          );

        expect(
          result.gridImportKw,
        ).toBe(
          25,
        );

        expect(
          result.totalServedLoadKw,
        ).toBe(
          25,
        );

        expect(
          result.balanceWithinTolerance,
        ).toBe(
          true,
        );
      },
    );
  },
);

describe(
  "Phase 9E islanded dispatch",
  () => {
    it(
      "reports unserved load when PV is insufficient",
      () => {
        const result =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "islanded",

              pvAcAvailableKw:
                20,

              feeders: [
                feeder(
                  "critical",
                  15,
                  1,
                ),

                feeder(
                  "secondary",
                  15,
                  2,
                ),
              ],
            },
          );

        expect(
          result.gridImportKw,
        ).toBe(
          0,
        );

        expect(
          result.gridExportKw,
        ).toBe(
          0,
        );

        expect(
          result.totalServedLoadKw,
        ).toBe(
          20,
        );

        expect(
          result.unservedLoadKw,
        ).toBe(
          10,
        );

        expect(
          result.feeders[0]
            .servedLoadKw,
        ).toBe(
          15,
        );

        expect(
          result.feeders[1]
            .servedLoadKw,
        ).toBe(
          5,
        );

        expect(
          result.balanceWithinTolerance,
        ).toBe(
          true,
        );
      },
    );

    it(
      "serves higher-priority feeders first",
      () => {
        const result =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "islanded",

              pvAcAvailableKw:
                10,

              feeders: [
                feeder(
                  "low-priority",
                  10,
                  5,
                ),

                feeder(
                  "high-priority",
                  10,
                  1,
                ),
              ],
            },
          );

        const high =
          result.feeders.find(
            (item) =>
              item.feederId ===
              "high-priority",
          );

        const low =
          result.feeders.find(
            (item) =>
              item.feederId ===
              "low-priority",
          );

        expect(
          high?.servedLoadKw,
        ).toBe(
          10,
        );

        expect(
          low?.servedLoadKw,
        ).toBe(
          0,
        );
      },
    );

    it(
      "curtails surplus PV because islanded mode has no grid or battery sink",
      () => {
        const result =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "islanded",

              pvAcAvailableKw:
                40,

              feeders: [
                feeder(
                  "load",
                  15,
                  1,
                ),
              ],
            },
          );

        expect(
          result.totalServedLoadKw,
        ).toBe(
          15,
        );

        expect(
          result.curtailedPvKw,
        ).toBe(
          25,
        );

        expect(
          result.gridExportKw,
        ).toBe(
          0,
        );

        expect(
          result.balanceWithinTolerance,
        ).toBe(
          true,
        );
      },
    );
  },
);

describe(
  "Phase 9E feeder loading",
  () => {
    it(
      "calculates feeder loading from served power and connected load",
      () => {
        const result =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "grid_connected",

              pvAcAvailableKw:
                20,

              feeders: [
                feeder(
                  "feeder-1",
                  10,
                  1,
                  20,
                ),
              ],
            },
          );

        expect(
          result.feeders[0]
            .loadingPercent,
        ).toBeCloseTo(
          50,
          8,
        );
      },
    );

    it(
      "ignores disabled feeder demand",
      () => {
        const disabled =
          feeder(
            "disabled",
            30,
            1,
          );

        disabled.enabled =
          false;

        const result =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "grid_connected",

              pvAcAvailableKw:
                10,

              feeders: [
                disabled,
              ],
            },
          );

        expect(
          result.totalRequestedLoadKw,
        ).toBe(
          0,
        );

        expect(
          result.gridExportKw,
        ).toBe(
          10,
        );
      },
    );
  },
);

describe(
  "Phase 9E electrical balance",
  () => {
    it(
      "verifies a balanced grid-connected timestep",
      () => {
        const result =
          evaluateElectricalBalance(
            {
              pvAcAvailableKw:
                20,

              gridImportKw:
                10,

              loadServedKw:
                25,

              gridExportKw:
                5,

              curtailedPvKw:
                0,

              distributionLossKw:
                0,
            },
          );

        expect(
          result.balanceErrorKw,
        ).toBeCloseTo(
          0,
          10,
        );

        expect(
          result.withinTolerance,
        ).toBe(
          true,
        );
      },
    );

    it(
      "detects an electrical imbalance",
      () => {
        const result =
          evaluateElectricalBalance(
            {
              pvAcAvailableKw:
                20,

              gridImportKw:
                0,

              loadServedKw:
                18,

              gridExportKw:
                0,

              curtailedPvKw:
                0,

              distributionLossKw:
                0,
            },
          );

        expect(
          result.balanceErrorKw,
        ).toBe(
          2,
        );

        expect(
          result.withinTolerance,
        ).toBe(
          false,
        );
      },
    );
  },
);

describe(
  "Phase 9E distribution summary",
  () => {
    it(
      "aggregates hourly grid and load energy",
      () => {
        const first =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "grid_connected",

              pvAcAvailableKw:
                20,

              feeders: [
                feeder(
                  "load",
                  30,
                  1,
                ),
              ],
            },
          );

        const second =
          dispatchElectricalPower(
            {
              timestamp,

              operatingMode:
                "grid_connected",

              pvAcAvailableKw:
                40,

              feeders: [
                feeder(
                  "load",
                  30,
                  1,
                ),
              ],
            },
          );

        const summary =
          summarizeElectricalDistribution(
            [
              first,
              second,
            ],
          );

        expect(
          summary.totalLoadDemandKwh,
        ).toBe(
          60,
        );

        expect(
          summary.totalLoadServedKwh,
        ).toBe(
          60,
        );

        expect(
          summary.totalGridImportKwh,
        ).toBe(
          10,
        );

        expect(
          summary.totalGridExportKwh,
        ).toBe(
          10,
        );

        expect(
          summary.maximumBalanceErrorKw,
        ).toBeCloseTo(
          0,
          10,
        );
      },
    );
  },
);
