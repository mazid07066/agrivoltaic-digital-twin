import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getResearchCameraPosition,
  researchSnapshotBasename,
} from "../sceneResearch";

describe(
  "research-scene utilities",
  () => {
    it(
      "provides deterministic publication camera views",
      () => {
        expect(
          getResearchCameraPosition(
            100,
            "perspective",
          ),
        ).toEqual([
          62,
          48,
          72,
        ]);

        expect(
          getResearchCameraPosition(
            100,
            "top",
          ),
        ).toEqual([
          0,
          98,
          0.01,
        ]);

        expect(
          getResearchCameraPosition(
            100,
            "front",
          ),
        ).toEqual([
          0,
          28,
          95,
        ]);

        expect(
          getResearchCameraPosition(
            100,
            "side",
          ),
        ).toEqual([
          95,
          28,
          0,
        ]);
      },
    );

    it(
      "creates a stable research export name",
      () => {
        expect(
          researchSnapshotBasename({
            siteName:
              "Dhaka Agrivoltaic Site 2",
            simulationDate:
              "2026-07-29",
            hour:
              9,
            view:
              "top",
          }),
        ).toBe(
          "dhaka-agrivoltaic-site-2_2026-07-29_0900_top_digital-twin",
        );
      },
    );
  },
);
