import {
  describe,
  expect,
  it,
} from "vitest";

import {
  suggestValidationColumn,
} from "@/lib/validationStudio";

describe(
  "Phase 12 validation column mapping",
  () => {
    it(
      "recognizes common PVlib and Simulink headings",
      () => {
        expect(
          suggestValidationColumn(
            "DateTime",
          ).variable,
        ).toBe(
          "timestamp",
        );

        expect(
          suggestValidationColumn(
            "POA_Global",
          ).variable,
        ).toBe(
          "poaWm2",
        );

        expect(
          suggestValidationColumn(
            "P_DC",
          ).variable,
        ).toBe(
          "dcPowerKw",
        );

        expect(
          suggestValidationColumn(
            "P_AC",
          ).variable,
        ).toBe(
          "acPowerKw",
        );

        expect(
          suggestValidationColumn(
            "CellTemp",
          ).variable,
        ).toBe(
          "moduleTemperatureC",
        );
      },
    );

    it(
      "recognizes real AgriTwin and external validation headings",
      () => {
        expect(
          suggestValidationColumn(
            "GHI_W_m2",
          ).variable,
        ).toBe(
          "ghiWm2",
        );

        expect(
          suggestValidationColumn(
            "DNI_W_m2",
          ).variable,
        ).toBe(
          "dniWm2",
        );

        expect(
          suggestValidationColumn(
            "DHI_W_m2",
          ).variable,
        ).toBe(
          "dhiWm2",
        );

        expect(
          suggestValidationColumn(
            "POA_global_W_m2",
          ).variable,
        ).toBe(
          "poaWm2",
        );

        expect(
          suggestValidationColumn(
            "cell_temperature_C",
          ).variable,
        ).toBe(
          "moduleTemperatureC",
        );

        expect(
          suggestValidationColumn(
            "DC_power_W",
          ).variable,
        ).toBe(
          "dcPowerKw",
        );

        expect(
          suggestValidationColumn(
            "Plant_AC_power_kW",
          ).variable,
        ).toBe(
          "acPowerKw",
        );

        expect(
          suggestValidationColumn(
            "Plant_Energy_kWh",
          ).variable,
        ).toBe(
          "energyKWh",
        );
      },
    );

    it(
      "recognizes MATLAB-style validation headings",
      () => {
        expect(
          suggestValidationColumn(
            "timestamp_local",
          ).variable,
        ).toBe(
          "timestamp",
        );

        expect(
          suggestValidationColumn(
            "modeled_power_kw",
          ).variable,
        ).toBe(
          "acPowerKw",
        );

        expect(
          suggestValidationColumn(
            "ac_generation_kw",
          ).variable,
        ).toBe(
          "acPowerKw",
        );

        expect(
          suggestValidationColumn(
            "dc_power_kw",
          ).variable,
        ).toBe(
          "dcPowerKw",
        );

        expect(
          suggestValidationColumn(
            "tcell_c",
          ).variable,
        ).toBe(
          "moduleTemperatureC",
        );

        expect(
          suggestValidationColumn(
            "poa_w_m2",
          ).variable,
        ).toBe(
          "poaWm2",
        );
      },
    );

    it(
      "does not silently guess unknown columns",
      () => {
        const result =
          suggestValidationColumn(
            "Mystery_Output_7",
          );

        expect(
          result.variable,
        ).toBeNull();

        expect(
          result.confidence,
        ).toBe(
          "none",
        );
      },
    );
  },
);
