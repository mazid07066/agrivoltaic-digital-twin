import {
  describe,
  expect,
  it,
} from "vitest";

import {
  localTimestampToUtcIso,
} from "../persistenceMapping";

describe(
  "Phase 9C persistence mapping",
  () => {
    it(
      "converts Dhaka local time to UTC",
      () => {
        expect(
          localTimestampToUtcIso(
            "2025-06-01T12:00",
            "Asia/Dhaka",
          ),
        ).toBe(
          "2025-06-01T06:00:00.000Z",
        );
      },
    );

    it(
      "preserves UTC timestamps correctly",
      () => {
        expect(
          localTimestampToUtcIso(
            "2025-06-01T12:00",
            "UTC",
          ),
        ).toBe(
          "2025-06-01T12:00:00.000Z",
        );
      },
    );
  },
);
