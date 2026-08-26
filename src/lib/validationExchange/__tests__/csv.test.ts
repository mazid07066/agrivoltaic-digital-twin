import {
  describe,
  expect,
  it,
} from "vitest";

import {
  escapeCsvCell,
  serializeCsv,
} from "../csv";

describe(
  "validation exchange CSV serializer",
  () => {
    it(
      "escapes commas, quotes and newlines",
      () => {
        expect(
          escapeCsvCell(
            'Dhaka, "North"\nSite',
          ),
        ).toBe(
          '"Dhaka, ""North""\nSite"',
        );
      },
    );

    it(
      "preserves zero and emits blanks for unavailable values",
      () => {
        const csv =
          serializeCsv(
            [
              {
                value: 0,
                missing: null,
              },
            ],
            [
              {
                header:
                  "value",
                value:
                  (row) =>
                    row.value,
              },
              {
                header:
                  "missing",
                value:
                  (row) =>
                    row.missing,
              },
            ],
          );

        expect(csv).toBe(
          "value,missing\n0,\n",
        );
      },
    );

    it(
      "rejects an empty column contract",
      () => {
        expect(
          () =>
            serializeCsv(
              [],
              [],
            ),
        ).toThrow(
          "at least one column",
        );
      },
    );
  },
);
