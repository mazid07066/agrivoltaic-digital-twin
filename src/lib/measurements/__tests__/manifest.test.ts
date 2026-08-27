import {
  describe,
  expect,
  it,
} from "vitest";

import {
  FENI_VALIDATION_DATASET_ID,
  FENI_VALIDATION_SITE,
} from "../feni";

import {
  parseMeasurementManifest,
} from "../manifest";

const validManifest = {
  schemaVersion: 1,
  datasetId:
    FENI_VALIDATION_DATASET_ID,
  title: "Feni measurements",
  publisher: "World Bank Group / ESMAP",
  serviceProvider: "Suntrace GmbH",
  officialDatasetId: "official-id",
  officialSourceUrl:
    "https://energydata.info/example",
  licence: {
    id: "CC-BY-4.0",
    title:
      "Creative Commons Attribution 4.0",
    url:
      "https://creativecommons.org/licenses/by/4.0/",
  },
  citation: "World Bank/ESMAP",
  retrievedAt:
    "2026-08-20T11:37:02Z",
  manifestCreatedAt:
    "2026-08-27T00:00:00Z",
  station:
    FENI_VALIDATION_SITE.station,
  sensors: [],
  measurementPeriod: {
    start:
      "2017-06-08T00:00:00Z",
    end:
      "2019-09-30T23:59:00Z",
    sourceResolution: "PT1M",
    expectedIntervalSeconds: 60,
  },
  resources: [
    {
      id: "resource-id",
      role:
        "quality_controlled_measurements",
      name: "QC",
      format: "CSV",
      url:
        "https://energydata.info/qc.csv",
      localPath: "qc.csv",
      fileSizeBytes: 10,
      sha256: "a".repeat(64),
      acquired: true,
      immutable: true,
    },
  ],
  scientificBoundaries: {
    validationScope:
      "environmental_reconstruction",
    isDhakaValidation: false,
    dhakaApplicationClassification:
      "spatial_transfer",
    fullDigitalTwinValidation: false,
    modelTrainingPerformed: false,
  },
} as const;

describe(
  "Phase 10 measured-data manifest",
  () => {
    it(
      "accepts the controlled Feni manifest",
      () => {
        const parsed =
          parseMeasurementManifest(
            validManifest,
          );

        expect(
          parsed.datasetId,
        ).toBe(
          FENI_VALIDATION_DATASET_ID,
        );

        expect(
          parsed.station.latitude,
        ).toBe(
          22.80029,
        );
      },
    );

    it(
      "rejects acquired resources without checksums",
      () => {
        const invalid = {
          ...validManifest,
          resources: [
            {
              ...validManifest.resources[0],
              sha256: null,
            },
          ],
        };

        expect(
          () =>
            parseMeasurementManifest(
              invalid,
            ),
        ).toThrow(
          /requires a checksum/,
        );
      },
    );

    it(
      "keeps Feni validation separate from Dhaka",
      () => {
        expect(
          FENI_VALIDATION_SITE
            .station.timezone,
        ).toBe(
          "UTC",
        );

        expect(
          FENI_VALIDATION_SITE
            .dhakaApplicationClassification,
        ).toBe(
          "spatial_transfer",
        );
      },
    );
  },
);
