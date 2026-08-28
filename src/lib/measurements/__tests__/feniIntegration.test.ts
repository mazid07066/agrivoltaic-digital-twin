import {
  getMeasurementValidationSite,
} from "../registry";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getLocalEnvironmentDatasetDefinition,
} from "@/lib/environment/localDataset/registry";

import {
  FENI_VALIDATION_DATASET_ID,
  FENI_VALIDATION_SITE,
} from "../feni";

describe(
  "Phase 10 Feni environment integration",
  () => {
    it(
      "registers the official Feni station identity",
      () => {
        const definition =
          getLocalEnvironmentDatasetDefinition(
            "solar-mem-data-v1",
          );

        expect(definition).not.toBeNull();
        expect(
          definition?.timezone,
        ).toBe("Asia/Dhaka");
        expect(
          definition?.metadata
            ?.stationId,
        ).toBe("BDFE2");
        expect(
          definition?.metadata
            ?.stationLatitude,
        ).toBe(22.80029);
        expect(
          definition?.metadata
            ?.stationLongitude,
        ).toBe(91.35819);
      },
    );

    it(
      "registers the Feni validation site",
      () => {
        const site =
          getMeasurementValidationSite(
            "world-bank-esmap-feni-bdfe2",
          );

        expect(site).not.toBeNull();
        expect(
          site?.datasetId,
        ).toBe(
          FENI_VALIDATION_DATASET_ID,
        );
      },
    );

    it(
      "marks Dhaka use as spatial transfer",
      () => {
        expect(
          FENI_VALIDATION_DATASET_ID,
        ).toBe(
          "world-bank-esmap-feni-qc-v1",
        );
        expect(
          FENI_VALIDATION_SITE
            .validationScope,
        ).toBe(
          "environmental_reconstruction",
        );
        expect(
          FENI_VALIDATION_SITE
            .dhakaApplicationClassification,
        ).toBe("spatial_transfer");
      },
    );
  },
);
