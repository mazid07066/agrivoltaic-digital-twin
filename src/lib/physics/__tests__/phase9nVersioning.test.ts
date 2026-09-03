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
  "Phase 9N physics identity",
  () => {
    it(
      "uses distinct post-correction engine versions",
      () => {
        expect(
          LAND_PHYSICS_ENGINE_VERSION,
        ).toContain(
          "phase9n-single-diode",
        );

        expect(
          ROOFTOP_PHYSICS_ENGINE_VERSION,
        ).toContain(
          "phase9n-single-diode",
        );

        expect(
          LAND_PHYSICS_ENGINE_VERSION,
        ).not.toBe(
          "agritwin-land-phase9h-9l-physics-v1",
        );

        expect(
          ROOFTOP_PHYSICS_ENGINE_VERSION,
        ).not.toBe(
          "agritwin-rooftop-phase9h-9l-physics-v1",
        );
      },
    );
  },
);
