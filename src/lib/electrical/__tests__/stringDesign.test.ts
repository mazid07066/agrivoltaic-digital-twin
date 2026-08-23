import {
  describe,
  expect,
  it,
} from "vitest";

import {
  recommendPVStringDesign,
} from "../stringDesign";

import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
} from "../inverter/catalogue";

import {
  getPVModuleProfile,
} from "@/lib/pv/moduleProfiles";

describe(
  "PV string-design recommendation",
  () => {
    const inverter =
      getInverterProfile(
        DEFAULT_INVERTER_PROFILE_ID,
      );

    it(
      "creates a complete constrained design for 102 modules",
      () => {
        const pvModule =
          getPVModuleProfile(
            "canadian-solar-inc-cs3w-420pb-ag",
          );

        const result =
          recommendPVStringDesign({
            module: pvModule,
            inverter,
            moduleCount: 102,
            minimumDesignTemperatureC: 5,
            maximumDesignCellTemperatureC: 71.4,
            bifacialCurrentFactor: 1,
          });

        expect(result.selected).not.toBeNull();

        const selected = result.selected!;

        expect(
          selected.assignedModules +
            selected.unassignedModules,
        ).toBe(102);

        expect(
          selected.assignments,
        ).toHaveLength(
          selected.inverterCount *
            inverter.dc.independentMpptInputs,
        );

        expect(
          selected.stringsPerMppt,
        ).toBeLessThanOrEqual(
          result.maximumStringsPerMppt!,
        );

        expect(
          selected.stringVocColdV,
        ).toBeLessThanOrEqual(
          inverter.dc.maxInputVoltageV,
        );

        expect(
          selected.stringVmppHotV,
        ).toBeGreaterThanOrEqual(
          inverter.dc.mppVoltageMinV,
        );

        expect(
          selected.stringVmppColdV,
        ).toBeLessThanOrEqual(
          inverter.dc.mppVoltageMaxV,
        );
      },
    );

    it(
      "does not invent missing catalogue electrical values",
      () => {
        const incompleteModule =
          getPVModuleProfile(
            "canadian-solar-cs3w-mb-ag-420",
          );

        const result =
          recommendPVStringDesign({
            module: incompleteModule,
            inverter,
            moduleCount: 102,
            minimumDesignTemperatureC: 5,
            maximumDesignCellTemperatureC: 71.4,
            bifacialCurrentFactor: 1,
          });

        expect(result.status).toBe(
          "NOT_EVALUATED",
        );

        expect(result.selected).toBeNull();
        expect(result.reasons.length).toBeGreaterThan(0);
      },
    );

    it(
      "requires environmental design inputs",
      () => {
        const pvModule =
          getPVModuleProfile(
            "canadian-solar-inc-cs3w-420pb-ag",
          );

        const result =
          recommendPVStringDesign({
            module: pvModule,
            inverter,
            moduleCount: 102,
            minimumDesignTemperatureC: null,
            maximumDesignCellTemperatureC: null,
            bifacialCurrentFactor: null,
          });

        expect(result.status).toBe(
          "NOT_EVALUATED",
        );

        expect(result.selected).toBeNull();
      },
    );
  },
);

describe(
  "string-design engineering priorities",
  () => {
    it(
      "prefers one inverter over a smaller partial-module remainder",
      () => {
        const baseModule =
          getPVModuleProfile(
            "canadian-solar-inc-cs3w-420pb-ag",
          );

        const result =
          recommendPVStringDesign({
            module: {
              ...baseModule,
              id: "ranking-fixture",
              vocV: 54,
              vmppV: 44.9,
              iscA: 11,
              imppA: 10.5,
              tempCoeffVocPercentPerC:
                -0.27,
              tempCoeffIscPercentPerC:
                0.05,
            },
            inverter:
              getInverterProfile(
                DEFAULT_INVERTER_PROFILE_ID,
              ),
            moduleCount: 102,
            minimumDesignTemperatureC: 5,
            maximumDesignCellTemperatureC: 71.4,
            bifacialCurrentFactor: 1,
          });

        expect(result.selected).not.toBeNull();

        expect(
          result.selected?.inverterCount,
        ).toBe(1);

        expect(
          result.selected?.modulesPerString,
        ).toBe(16);

        expect(
          result.selected?.totalStrings,
        ).toBe(6);

        expect(
          result.selected?.unassignedModules,
        ).toBe(6);
      },
    );
  },
);

