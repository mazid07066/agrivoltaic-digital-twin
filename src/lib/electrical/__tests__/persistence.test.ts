import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createHourlyResultInserts,
} from "@/lib/execution/persistenceMapping";

import {
  createElectricalSimulationResult,
} from "../adapters/executionElectricalAdapter";

import type {
  SimulationExecutionResult,
} from "@/lib/execution/types";

function createScientificResult():
  SimulationExecutionResult {
  const result:
    SimulationExecutionResult =
    {
      schema:
        "agritwin-execution-result-v1",

      status:
        "completed",

      engine: {
        engineKind:
          "land",

        executionContractVersion:
          "agritwin-execution-v1",

        engineVersion:
          "test",

        controllerVersion:
          null,

        moduleCatalogueVersion:
          null,

        weatherAdapterVersion:
          null,
      },

      simulationDate:
        "2026-08-20",

      summary: {
        engineKind:
          "land",

        siteType:
          "land_agrivoltaic",

        installedCapacityKw:
          50,

        dailyEnergyKwh:
          50,

        specificYieldKwhPerKw:
          1,

        openFieldDliMolM2:
          null,

        cropDliMolM2:
          null,

        estimatedCropYieldPercent:
          null,

        landEquivalentRatio:
          null,

        groundCoverageRatioPercent:
          null,

        usableAreaPercent:
          null,

        moduleCount:
          null,

        additionalMetrics:
          {},
      },

      hourly:
        Array.from(
          {
            length:
              24,
          },
          (
            _,
            hourIndex,
          ) => ({
            hourIndex,

            timestamp:
              `2026-08-20T${String(
                hourIndex,
              ).padStart(
                2,
                "0",
              )}:00:00`,

            solarAltitudeDeg:
              null,

            solarAzimuthDeg:
              null,

            ghiWm2:
              null,

            poaWm2:
              null,

            moduleTemperatureC:
              null,

            pvPowerKw:
              hourIndex ===
              12
                ? 50
                : 0,

            trackerAngleDeg:
              null,

            trackingState:
              null,

            openFieldDliIncrementMolM2:
              null,

            cropDliIncrementMolM2:
              null,

            additionalValues:
              {},
          }),
        ),

      spatial:
        [],

      warnings:
        [],
    };

  result.electrical =
    createElectricalSimulationResult(
      result,
    );

  return result;
}

describe(
  "Phase 9E electrical persistence mapping",
  () => {
    it(
      "persists hourly inverter and distribution values",
      () => {
        const result =
          createScientificResult();

        const rows =
          createHourlyResultInserts(
            "11111111-1111-1111-1111-111111111111",
            result,
            "UTC",
          );

        expect(
          rows,
        ).toHaveLength(
          24,
        );

        const noon =
          rows[12];

        expect(
          noon.electrical_values,
        ).toBeDefined();

        const values =
          noon.electrical_values as
            Record<
              string,
              unknown
            >;

        expect(
          values.inverter,
        ).toBeDefined();

        expect(
          values.distribution,
        ).toBeDefined();
      },
    );

    it(
      "keeps historical-style results valid without electrical data",
      () => {
        const result =
          createScientificResult();

        delete result.electrical;

        const rows =
          createHourlyResultInserts(
            "11111111-1111-1111-1111-111111111111",
            result,
            "UTC",
          );

        const values =
          rows[0]
            .electrical_values as
            Record<
              string,
              unknown
            >;

        expect(
          values,
        ).toEqual(
          {},
        );
      },
    );
  },
);
