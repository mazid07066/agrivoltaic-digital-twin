import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createValidationManifest,
} from "../manifest";

import {
  VALIDATION_EXCHANGE_SCHEMA,
} from "../types";

describe(
  "validation exchange manifest",
  () => {
    it(
      "creates a versioned reproducible manifest",
      () => {
        const manifest =
          createValidationManifest({
            packageId:
              "validation-run-1",
            createdAt:
              "2026-08-26T12:30:00+06:00",
            runId:
              "run-1",
            inputFingerprint:
              "input-sha256",
            environmentFingerprint:
              "environment-sha256",
            sourceCommit:
              "5a30278",
            siteKind:
              "land",
            siteId:
              "site-1",
            siteVersionId:
              "version-1",
            scenarioId:
              "scenario-1",
            simulationDate:
              "2026-08-26",
            startDate:
              "2026-08-20",
            endDate:
              "2026-08-26",
            timezone:
              "Asia/Dhaka",
            weatherPeriod:
              "mixed",
            moduleProfileId:
              "module-1",
            inverterProfileId:
              "inverter-1",
            software: [
              {
                name:
                  "AgriTwin",
                version:
                  "phase-9g",
              },
            ],
          });

        expect(
          manifest.schema,
        ).toBe(
          VALIDATION_EXCHANGE_SCHEMA,
        );

        expect(
          manifest.createdAt,
        ).toBe(
          "2026-08-26T06:30:00.000Z",
        );

        expect(
          manifest.startDate,
        ).toBe(
          "2026-08-20",
        );

        expect(
          manifest.endDate,
        ).toBe(
          "2026-08-26",
        );
      },
    );

    it(
      "rejects a reversed date range",
      () => {
        expect(
          () =>
            createValidationManifest({
              packageId:
                "validation-run-1",
              createdAt:
                "2026-08-26T00:00:00Z",
              inputFingerprint:
                "fingerprint",
              siteKind:
                "rooftop",
              siteId:
                "site-1",
              simulationDate:
                "2026-08-26",
              startDate:
                "2026-08-27",
              endDate:
                "2026-08-26",
              timezone:
                "Asia/Dhaka",
              weatherPeriod:
                "forecast",
            }),
        ).toThrow(
          "start date cannot be after",
        );
      },
    );
  },
);
