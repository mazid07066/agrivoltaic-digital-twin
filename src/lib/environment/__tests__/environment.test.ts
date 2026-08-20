import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assessEnvironmentalQuality,
} from "../quality";

import {
  environmentalDataRequestSchema,
} from "../schema";

import {
  kilometresPerHourToMetresPerSecond,
  wattsPerSquareMetreHoursToKilowattHoursPerSquareMetre,
} from "../units";

describe(
  "Phase 9B environmental foundation",
  () => {
    it(
      "accepts a valid Open-Meteo request",
      () => {
        const result =
          environmentalDataRequestSchema.safeParse(
            {
              source:
                "open_meteo",

              mode:
                "historical",

              coordinate: {
                latitude:
                  23.8103,

                longitude:
                  90.4125,
              },

              startDate:
                "2025-01-01",

              endDate:
                "2025-12-31",

              timezone:
                "Asia/Dhaka",
            },
          );

        expect(
          result.success,
        ).toBe(true);
      },
    );

    it(
      "rejects reversed dates",
      () => {
        const result =
          environmentalDataRequestSchema.safeParse(
            {
              source:
                "open_meteo",

              mode:
                "historical",

              coordinate: {
                latitude:
                  23.8103,

                longitude:
                  90.4125,
              },

              startDate:
                "2025-12-31",

              endDate:
                "2025-01-01",
            },
          );

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "converts km/h to m/s",
      () => {
        expect(
          kilometresPerHourToMetresPerSecond(
            36,
          ),
        ).toBeCloseTo(
          10,
        );
      },
    );

    it(
      "integrates hourly irradiance",
      () => {
        const value =
          wattsPerSquareMetreHoursToKilowattHoursPerSquareMetre(
            [
              0,
              500,
              1000,
              500,
            ],
          );

        expect(
          value,
        ).toBeCloseTo(
          2,
        );
      },
    );

    it(
      "detects missing environmental values",
      () => {
        const quality =
          assessEnvironmentalQuality(
            [
              {
                timestamp:
                  "2025-06-01T12:00",

                ghiWm2:
                  500,

                dniWm2:
                  null,

                dhiWm2:
                  200,

                temperatureC:
                  30,

                relativeHumidityPct:
                  70,

                cloudCoverPct:
                  50,

                windSpeedMs:
                  3,

                precipitationMm:
                  0,
              },
            ],
          );

        expect(
          quality.recordCount,
        ).toBe(1);

        expect(
          quality.missingValueCount,
        ).toBe(1);

        expect(
          quality.warnings.length,
        ).toBeGreaterThan(
          0,
        );
      },
    );
  },
);
