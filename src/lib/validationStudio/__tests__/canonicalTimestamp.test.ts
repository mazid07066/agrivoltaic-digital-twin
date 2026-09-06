import {
  describe,
  expect,
  it,
} from "vitest";

import {
  requireAbsoluteTimestamp,
} from "@/lib/validationStudio";

describe(
  "Phase 12 canonical timestamps",
  () => {
    it(
      "accepts ISO timestamps with T and explicit UTC offset",
      () => {
        expect(
          requireAbsoluteTimestamp(
            "2019-10-01T00:00:00+06:00",
          ),
        ).toBe(
          "2019-09-30T18:00:00.000Z",
        );
      },
    );

    it(
      "accepts space-separated timestamps with explicit UTC offset",
      () => {
        expect(
          requireAbsoluteTimestamp(
            "2019-10-01 00:00:00+06:00",
          ),
        ).toBe(
          "2019-09-30T18:00:00.000Z",
        );
      },
    );

    it(
      "still rejects timezone-naive timestamps",
      () => {
        expect(
          () =>
            requireAbsoluteTimestamp(
              "2019-10-01T00:00:00",
            ),
        ).toThrow(
          "must include Z or an explicit UTC offset",
        );
      },
    );
  },
);
