import {
  describe,
  expect,
  it,
} from "vitest";

import {
  formatValidationDateRange,
  formatValidationLocalDate,
  formatValidationLocalDateTime,
} from "../reportingTime";

import {
  FENI_VALIDATION_SITE,
  validationSiteCoordinateLabel,
} from "../site";

describe(
  "Feni validation reporting time",
  () => {
    it(
      "reports the Feni site coordinates",
      () => {
        expect(
          FENI_VALIDATION_SITE.latitude,
        ).toBeCloseTo(
          22.80029,
          8,
        );

        expect(
          FENI_VALIDATION_SITE.longitude,
        ).toBeCloseTo(
          91.35819,
          8,
        );

        expect(
          validationSiteCoordinateLabel(),
        ).toBe(
          "22.800290° N, 91.358190° E",
        );
      },
    );

    it(
      "converts the synchronized UTC start into Feni civil time",
      () => {
        expect(
          formatValidationLocalDate(
            "2026-09-05T18:00:00.000Z",
          ),
        ).toBe(
          "06 Sept 2026",
        );
      },
    );

    it(
      "converts midnight at the Feni site correctly",
      () => {
        expect(
          formatValidationLocalDateTime(
            "2026-09-05T18:00:00.000Z",
          ),
        ).toContain(
          "06 Sept 2026",
        );

        expect(
          formatValidationLocalDateTime(
            "2026-09-05T18:00:00.000Z",
          ),
        ).toContain(
          "00:00",
        );
      },
    );

    it(
      "reports the complete synchronized range in site-local time",
      () => {
        const range =
          formatValidationDateRange(
            "2026-09-05T18:00:00.000Z",
            "2026-09-12T17:00:00.000Z",
          );

        expect(
          range,
        ).toContain(
          "06 Sept 2026",
        );

        expect(
          range,
        ).toContain(
          "00:00",
        );

        expect(
          range,
        ).toContain(
          "12 Sept 2026",
        );

        expect(
          range,
        ).toContain(
          "23:00",
        );
      },
    );
  },
);
