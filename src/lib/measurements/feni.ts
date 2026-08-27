import type {
  MeasurementStationIdentity,
} from "./contracts";

export const FENI_VALIDATION_DATASET_ID =
  "world-bank-esmap-feni-qc-v1";

export const FENI_VALIDATION_SITE = {
  id: "world-bank-esmap-feni-bdfe2",
  name: "World Bank/ESMAP Feni Validation Site",
  siteKind: "land",
  validationStatus: "environmental_validation_site",
  station: {
    id: "BDFE2",
    name: "BDFE2 (Feni)",
    hostInstitution:
      "Char Darbesh Adarsha Gram Government Primary School",
    equipment:
      "Helioscale omega station (Tier 1)",
    latitude: 22.80029,
    longitude: 91.35819,
    elevationM: 5,
    timezone: "UTC",
  } satisfies MeasurementStationIdentity,
  measurementPeriod: {
    start: "2017-06-08T00:00:00Z",
    end: "2019-09-30T23:59:00Z",
  },
  datasetId:
    FENI_VALIDATION_DATASET_ID,
  source:
    "World Bank Group / ESMAP",
  validationScope:
    "environmental_reconstruction",
  dhakaApplicationClassification:
    "spatial_transfer",
} as const;
