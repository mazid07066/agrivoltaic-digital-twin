import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
  INVERTER_PROFILES,
} from "../inverter/catalogue";

import {
  validateInverterInput,
} from "../inverter/catalogueInput";

describe(
  "Phase 9E inverter catalogue",
  () => {
    it(
      "contains SMA Sunny Tripower CORE1 STP 50-40",
      () => {
        const inverter =
          getInverterProfile(
            DEFAULT_INVERTER_PROFILE_ID,
          );

        expect(
          inverter.manufacturer,
        ).toBe(
          "SMA Solar Technology",
        );

        expect(
          inverter.model,
        ).toBe(
          "STP 50-40",
        );
      },
    );

    it(
      "preserves the SMA DC contract",
      () => {
        const inverter =
          getInverterProfile(
            DEFAULT_INVERTER_PROFILE_ID,
          );

        expect(
          inverter.dc
            .maxGeneratorPowerW,
        ).toBe(
          75_000,
        );

        expect(
          inverter.dc
            .mppVoltageMinV,
        ).toBe(
          500,
        );

        expect(
          inverter.dc
            .mppVoltageMaxV,
        ).toBe(
          800,
        );

        expect(
          inverter.dc
            .independentMpptInputs,
        ).toBe(
          6,
        );

        expect(
          inverter.dc
            .stringsPerMppt,
        ).toBe(
          2,
        );
      },
    );

    it(
      "preserves the SMA AC contract",
      () => {
        const inverter =
          getInverterProfile(
            DEFAULT_INVERTER_PROFILE_ID,
          );

        expect(
          inverter.ac
            .ratedActivePowerW,
        ).toBe(
          50_000,
        );

        expect(
          inverter.ac
            .maxOutputCurrentA,
        ).toBe(
          72.5,
        );

        expect(
          inverter.ac
            .maximumEfficiency,
        ).toBe(
          0.981,
        );

        expect(
          inverter.efficiency
            .europeanEfficiency,
        ).toBe(
          0.978,
        );
      },
    );

    it(
      "keeps inverter IDs unique",
      () => {
        const ids =
          INVERTER_PROFILES.map(
            (
              inverter,
            ) =>
              inverter.id,
          );

        expect(
          new Set(
            ids,
          ).size,
        ).toBe(
          ids.length,
        );
      },
    );

    it(
      "validates a future inverter datasheet entry",
      () => {
        const inverter =
          getInverterProfile(
            DEFAULT_INVERTER_PROFILE_ID,
          );

        const issues =
          validateInverterInput({
            manufacturer:
              inverter.manufacturer,

            series:
              inverter.series,

            model:
              inverter.model,

            maxGeneratorPowerW:
              inverter.dc
                .maxGeneratorPowerW,

            maxInputVoltageV:
              inverter.dc
                .maxInputVoltageV,

            mppVoltageMinV:
              inverter.dc
                .mppVoltageMinV,

            mppVoltageMaxV:
              inverter.dc
                .mppVoltageMaxV,

            ratedInputVoltageV:
              inverter.dc
                .ratedInputVoltageV,

            minInputVoltageV:
              inverter.dc
                .minInputVoltageV,

            startInputVoltageV:
              inverter.dc
                .startInputVoltageV,

            maxOperatingInputCurrentA:
              inverter.dc
                .maxOperatingInputCurrentA,

            maxOperatingCurrentPerMpptA:
              inverter.dc
                .maxOperatingCurrentPerMpptA,

            maxShortCircuitCurrentPerMpptA:
              inverter.dc
                .maxShortCircuitCurrentPerMpptA,

            maxShortCircuitCurrentPerStringA:
              inverter.dc
                .maxShortCircuitCurrentPerStringA,

            independentMpptInputs:
              inverter.dc
                .independentMpptInputs,

            stringsPerMppt:
              inverter.dc
                .stringsPerMppt,

            ratedActivePowerW:
              inverter.ac
                .ratedActivePowerW,

            maxApparentPowerVa:
              inverter.ac
                .maxApparentPowerVa,

            ratedGridVoltageV:
              inverter.ac
                .ratedGridVoltageV,

            maxOutputCurrentA:
              inverter.ac
                .maxOutputCurrentA,

            ratedOutputCurrentA:
              inverter.ac
                .ratedOutputCurrentA,

            outputPhases:
              3,

            ratedPowerFactor:
              inverter.ac
                .ratedPowerFactor,

            maximumEfficiency:
              inverter.ac
                .maximumEfficiency,

            europeanEfficiency:
              inverter.efficiency
                .europeanEfficiency,

            maxThdPercent:
              inverter.ac
                .maxThdPercent,
          });

        expect(
          issues.filter(
            (
              issue,
            ) =>
              issue.severity ===
              "error",
          ),
        ).toHaveLength(
          0,
        );
      },
    );
  },
);
