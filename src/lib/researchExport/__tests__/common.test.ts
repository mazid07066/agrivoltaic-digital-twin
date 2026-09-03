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

describe(
  "research export warning deduplication",
  () => {
    it(
      "removes repeated human-readable warnings while preserving unique warnings",
      async () => {
        const {
          deduplicateResearchWarnings,
        } =
          await import(
            "@/lib/researchExport/common"
          );

        const repeated =
          "Cloud cover is not measured in this dataset and remains N/A; no Open-Meteo value is substituted.";

        expect(
          deduplicateResearchWarnings(
            [
              repeated,
              repeated,
              "2018-06-17 contains 1 partial hourly measurement(s); valid-minute counts are preserved in the export.",
              repeated,
            ],
          ),
        ).toEqual(
          [
            repeated,
            "2018-06-17 contains 1 partial hourly measurement(s); valid-minute counts are preserved in the export.",
          ],
        );
      },
    );
  },
);

describe(
  "research export warning deduplication",
  () => {
    it(
      "removes repeated human-readable warnings while preserving unique warnings",
      async () => {
        const {
          deduplicateResearchWarnings,
        } =
          await import(
            "@/lib/researchExport/common"
          );

        const repeated =
          "Cloud cover is not measured in this dataset and remains N/A; no Open-Meteo value is substituted.";

        expect(
          deduplicateResearchWarnings(
            [
              repeated,
              repeated,
              "2018-06-17 contains 1 partial hourly measurement(s); valid-minute counts are preserved in the export.",
              repeated,
            ],
          ),
        ).toEqual(
          [
            repeated,
            "2018-06-17 contains 1 partial hourly measurement(s); valid-minute counts are preserved in the export.",
          ],
        );
      },
    );
  },
);
