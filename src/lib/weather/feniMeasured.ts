export const FENI_COMPLETE_LOCAL_START_DATE = "2017-06-09";
export const FENI_COMPLETE_LOCAL_END_DATE = "2019-09-30";
export const FENI_DATASET_ID = "world-bank-esmap-feni-bdfe2-hourly-bst-v1";
export const FENI_DERIVATIVE_SHA256 = "f3ca4069ff99aee7bc0e6a874db0ae341c204c4d75f721bf1a4066661d0a2355";

export const FENI_STATION = {
  id: "BDFE2",
  name: "BDFE2 (Feni)",
  latitude: 22.80029,
  longitude: 91.35819,
  elevationM: 5,
} as const;

export const FENI_INVALID_LOCAL_DATES = [
  "2017-07-07",
  "2017-07-08",
] as const;
