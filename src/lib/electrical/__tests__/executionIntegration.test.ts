import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createElectricalSimulationResult,
} from "../adapters/executionElectricalAdapter";

import type {
  SimulationExecutionResult,
} from "@/lib/execution/types";

function scientificResult(
  engineKind:
    "land" |
    "rooftop",
): SimulationExecutionResult {
  return {
    schema:
      "agritwin-execution-result-v1",

    status:
      "completed",

    engine: {
      engineKind,

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
      engineKind,

      siteType:
        engineKind ===
        "land"
          ? "land_agrivoltaic"
          : "flat_roof",

      installedCapacityKw:
        50,

      dailyEnergyKwh:
        100,

      specificYieldKwhPerKw:
        2,

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
}

describe(
  "Phase 9E execution electrical integration",
  () => {
    it.each(
      [
        "land",
        "rooftop",
      ] as const,
    )(
      "creates electrical results downstream of %s simulation output",
      (
        engineKind,
      ) => {
        const result =
          createElectricalSimulationResult(
            scientificResult(
              engineKind,
            ),
          );

        expect(
          result.hourly,
        ).toHaveLength(
          24,
        );

        expect(
          result.provenance
            .sourcePvPowerField,
        ).toBe(
          "pvPowerKw",
        );

        expect(
          result.provenance
            .provider,
        ).toBe(
          "simulation",
        );

        expect(
          result.provenance
            .efficiencyApplicationMode,
        ).toBe(
          "legacy_power_passthrough",
        );
      },
    );

    it(
      "converts noon PV power into three-phase inverter output",
      () => {
        const result =
          createElectricalSimulationResult(
            scientificResult(
              "land",
            ),
          );

        const noon =
          result.hourly[12];

        expect(
          noon.inverter
            .ac
            .activePowerKw,
        ).toBeCloseTo(
          50,
          8,
        );

        expect(
          noon.inverter
            .ac
            .lineCurrentA,
        ).toBeCloseTo(
          72.17,
          1,
        );
      },
    );

    it(
      "shows grid import at zero-PV hours",
      () => {
        const result =
          createElectricalSimulationResult(
            scientificResult(
              "land",
            ),
          );

        const midnight =
          result.hourly[0];

        expect(
          midnight.inverter
            .state,
        ).toBe(
          "OFF",
        );

        expect(
          midnight.inverter
            .ac
            .activePowerKw,
        ).toBe(
          0,
        );

        expect(
          midnight.distribution
            .gridImportKw,
        ).toBe(
          24,
        );

        expect(
          midnight.distribution
            .balanceWithinTolerance,
        ).toBe(
          true,
        );
      },
    );

    it(
      "shows grid export when inverter output exceeds the demonstration load",
      () => {
        const result =
          createElectricalSimulationResult(
            scientificResult(
              "rooftop",
            ),
          );

        const noon =
          result.hourly[12];

        expect(
          noon.distribution
            .totalRequestedLoadKw,
        ).toBe(
          24,
        );

        expect(
          noon.distribution
            .gridExportKw,
        ).toBeCloseTo(
          26,
          8,
        );

        expect(
          noon.distribution
            .balanceWithinTolerance,
        ).toBe(
          true,
        );
      },
    );

    it(
      "records zero assumed distribution losses",
      () => {
        const result =
          createElectricalSimulationResult(
            scientificResult(
              "land",
            ),
          );

        expect(
          result.hourly.every(
            (point) =>
              point.distribution
                .distributionLossKw ===
              0,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
