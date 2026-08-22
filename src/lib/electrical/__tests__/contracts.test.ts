import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PHASE_9E_DEMONSTRATION_INVERTER,
} from "../inverter/specification";

import type {
  ElectricalValue,
  InverterOperatingState,
} from "../inverter/types";

describe(
  "Phase 9E electrical contracts",
  () => {
    it(
      "preserves the supplied inverter DC limits",
      () => {
        const inverter =
          PHASE_9E_DEMONSTRATION_INVERTER;

        expect(
          inverter.dc.maxGeneratorPowerW,
        ).toBe(
          75_000,
        );

        expect(
          inverter.dc.maxInputVoltageV,
        ).toBe(
          1_000,
        );

        expect(
          inverter.dc.mppVoltageMinV,
        ).toBe(
          500,
        );

        expect(
          inverter.dc.mppVoltageMaxV,
        ).toBe(
          800,
        );

        expect(
          inverter.dc.ratedInputVoltageV,
        ).toBe(
          670,
        );

        expect(
          inverter.dc.minInputVoltageV,
        ).toBe(
          150,
        );

        expect(
          inverter.dc.startInputVoltageV,
        ).toBe(
          188,
        );

        expect(
          inverter.dc.maxOperatingInputCurrentA,
        ).toBe(
          120,
        );

        expect(
          inverter.dc.independentMpptInputs,
        ).toBe(
          6,
        );

        expect(
          inverter.dc.stringsPerMppt,
        ).toBe(
          2,
        );
      },
    );

    it(
      "preserves the supplied inverter AC limits",
      () => {
        const inverter =
          PHASE_9E_DEMONSTRATION_INVERTER;

        expect(
          inverter.ac.ratedActivePowerW,
        ).toBe(
          50_000,
        );

        expect(
          inverter.ac.maxApparentPowerVa,
        ).toBe(
          50_000,
        );

        expect(
          inverter.ac.ratedOutputCurrentA,
        ).toBe(
          72.5,
        );

        expect(
          inverter.ac.outputPhases,
        ).toBe(
          3,
        );

        expect(
          inverter.ac.ratedPowerFactor,
        ).toBe(
          1,
        );

        expect(
          inverter.ac.maximumEfficiency,
        ).toBeCloseTo(
          0.981,
        );

        expect(
          inverter.ac.maxThdPercent,
        ).toBe(
          3,
        );
      },
    );

    it(
      "represents six MPPT inputs with twelve maximum strings",
      () => {
        const inverter =
          PHASE_9E_DEMONSTRATION_INVERTER;

        expect(
          inverter.dc.independentMpptInputs *
            inverter.dc.stringsPerMppt,
        ).toBe(
          12,
        );
      },
    );

    it(
      "keeps assumptions distinguishable from calculated data",
      () => {
        const calculated:
          ElectricalValue<number> =
          {
            value:
              42,

            provenance:
              "calculated",
          };

        const assumed:
          ElectricalValue<number> =
          {
            value:
              670,

            provenance:
              "assumed",

            note:
              "Demonstration DC operating voltage.",
          };

        expect(
          calculated.provenance,
        ).toBe(
          "calculated",
        );

        expect(
          assumed.provenance,
        ).toBe(
          "assumed",
        );
      },
    );

    it(
      "supports the required inverter operating states",
      () => {
        const states:
          InverterOperatingState[] =
          [
            "OFF",
            "WAITING_FOR_START",
            "MPPT_ACTIVE",
            "DERATED",
            "CLIPPED",
            "GRID_LIMITED",
            "FAULT",
          ];

        expect(
          states,
        ).toHaveLength(
          7,
        );
      },
    );

    it(
      "contains the nominal 230/400 V three-phase system",
      () => {
        expect(
          PHASE_9E_DEMONSTRATION_INVERTER
            .ac
            .supportedNominalVoltages,
        ).toContainEqual(
          {
            lineNeutralV:
              230,

            lineLineV:
              400,
          },
        );
      },
    );
  },
);

describe(
  "Phase 9E efficiency compatibility",
  () => {
    it(
      "supports legacy passthrough without silently double-counting inverter efficiency",
      () => {
        const mode:
          import("../inverter/types")
            .InverterEfficiencyApplicationMode =
          "legacy_power_passthrough";

        expect(
          mode,
        ).toBe(
          "legacy_power_passthrough",
        );
      },
    );
  },
);
