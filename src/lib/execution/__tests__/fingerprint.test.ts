import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createExecutionFingerprint,
} from "../fingerprint";

describe(
  "Phase 9C execution fingerprints",
  () => {
    it(
      "produces stable fingerprints regardless of object key order",
      () => {
        const first =
          createExecutionFingerprint({
            projectId:
              "project-1",

            scenario: {
              version:
                2,

              id:
                "scenario-1",
            },

            environment: {
              datasetFingerprint:
                "sha256:abc",
            },
          });

        const second =
          createExecutionFingerprint({
            environment: {
              datasetFingerprint:
                "sha256:abc",
            },

            scenario: {
              id:
                "scenario-1",

              version:
                2,
            },

            projectId:
              "project-1",
          });

        expect(
          first,
        ).toBe(
          second,
        );

        expect(
          first.startsWith(
            "sha256:",
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "changes when a scientific input changes",
      () => {
        const first =
          createExecutionFingerprint({
            scenarioVersion:
              1,

            siteVersion:
              5,

            environment:
              "sha256:data-a",
          });

        const second =
          createExecutionFingerprint({
            scenarioVersion:
              2,

            siteVersion:
              5,

            environment:
              "sha256:data-a",
          });

        expect(
          first,
        ).not.toBe(
          second,
        );
      },
    );
  },
);
