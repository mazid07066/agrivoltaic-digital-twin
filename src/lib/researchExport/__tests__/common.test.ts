import {
  describe,
  expect,
  it,
} from "vitest";

import {
  exportBasename,
  flattenConfiguration,
  researchFormulaRows,
} from "../common";

import type {
  ResearchExportPayload,
} from "../types";

describe(
  "research export foundation",
  () => {
    it(
      "flattens nested configuration values",
      () => {
        const rows =
          flattenConfiguration({
            location: {
              latitude:
                23.8103,
            },
            enabled:
              true,
          });

        expect(
          rows,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              parameter:
                "location.latitude",
              value:
                23.8103,
            }),
            expect.objectContaining({
              parameter:
                "enabled",
              value:
                true,
            }),
          ]),
        );
      },
    );

    it(
      "provides traceable engineering formulas",
      () => {
        const formulas =
          researchFormulaRows();

        expect(
          formulas.length,
        ).toBeGreaterThanOrEqual(
          8,
        );

        expect(
          formulas.some(
            (
              formula,
            ) =>
              formula.equation.includes(
                "P_STC",
              ),
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "creates a stable report filename",
      () => {
        const payload =
          {
            site: {
              name:
                "Dhaka Agrivoltaic Site 2",
            },
            startDate:
              "2025-01-01",
            endDate:
              "2025-12-31",
          } as ResearchExportPayload;

        expect(
          exportBasename(
            payload,
          ),
        ).toBe(
          "dhaka-agrivoltaic-site-2_2025-01-01_2025-12-31_simulation-report",
        );
      },
    );
  },
);
