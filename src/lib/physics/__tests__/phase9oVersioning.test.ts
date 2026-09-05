import {
  describe,
  expect,
  it,
} from "vitest";

import {
  LAND_PHYSICS_ENGINE_VERSION,
  ROOFTOP_PHYSICS_ENGINE_VERSION,
} from "@/lib/execution/versions";

describe(
  "Phase 9O physics versioning",
  () => {
    it(
      "identifies Land and Rooftop runs as relative-row-shading physics",
      () => {
        expect(
          LAND_PHYSICS_ENGINE_VERSION,
        ).toContain(
          "phase9o-relative-row-shading",
        );

        expect(
          ROOFTOP_PHYSICS_ENGINE_VERSION,
        ).toContain(
          "phase9o-relative-row-shading",
        );

        expect(
          LAND_PHYSICS_ENGINE_VERSION,
        ).not.toContain(
          "phase9n-single-diode",
        );

        expect(
          ROOFTOP_PHYSICS_ENGINE_VERSION,
        ).not.toContain(
          "phase9n-single-diode",
        );
      },
    );
  },
);
