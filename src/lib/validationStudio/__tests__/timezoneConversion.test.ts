import {
  describe,
  expect,
  it,
} from "vitest";

import {
  localTimestampInZoneToAbsolute,
} from "../canonical";

describe(
  "localTimestampInZoneToAbsolute",
  () => {
    it(
      "converts Asia/Dhaka local time to the correct UTC instant",
      () => {
        expect(
          localTimestampInZoneToAbsolute(
            "2019-10-01T00:00",
            "Asia/Dhaka",
          ),
        ).toBe(
          "2019-09-30T18:00:00.000Z",
        );
      },
    );

    it(
      "preserves UTC local time as UTC",
      () => {
        expect(
          localTimestampInZoneToAbsolute(
            "2019-10-01T00:00",
            "UTC",
          ),
        ).toBe(
          "2019-10-01T00:00:00.000Z",
        );
      },
    );

    it(
      "rejects malformed local timestamps",
      () => {
        expect(
          () =>
            localTimestampInZoneToAbsolute(
              "not-a-time",
              "Asia/Dhaka",
            ),
        ).toThrow();
      },
    );
  },
);
