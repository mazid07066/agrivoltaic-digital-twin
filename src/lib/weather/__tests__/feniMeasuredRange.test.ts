import { describe, expect, it } from "vitest";

import {
  FENI_COMPLETE_LOCAL_END_DATE,
  FENI_COMPLETE_LOCAL_START_DATE,
} from "../feniMeasured";

import { getFeniMeasuredRange } from "../feniMeasuredRange.server";

describe("Phase 9M Feni measured weather", () => {
  it("returns one complete Bangladesh-local day without Open-Meteo substitution", async () => {
    const response = await getFeniMeasuredRange({
      startDate: "2019-09-30",
      endDate: "2019-09-30",
      targetLatitude: 22.80029,
      targetLongitude: 91.35819,
    });

    expect(response.plan.provider).toBe("feni_measured");
    expect(response.plan.target?.classification).toBe("co_located");
    expect(response.days).toHaveLength(1);
    expect(response.days[0].source).toBe("measured");
    expect(response.days[0].weather.hourly).toHaveLength(24);
    expect(response.days[0].weather.summary.timezone).toBe("Asia/Dhaka");
    expect(response.days[0].weather.summary.source).toBe("World Bank/ESMAP Feni BDFE2");
    expect(response.days[0].weather.summary.averageCloudCover).toBeNull();
    expect(response.days[0].weather.hourly.every((point) => point.cloudCover === null)).toBe(true);
  });

  it("marks a non-Feni application as spatial transfer", async () => {
    const response = await getFeniMeasuredRange({
      startDate: "2018-01-01",
      endDate: "2018-01-01",
      targetLatitude: 24.77204655,
      targetLongitude: 89.84327976,
    });

    expect(response.plan.target?.classification).toBe("spatial_transfer");
    expect(response.warnings.join(" ")).toContain("spatial transfer");
  });

  it("enforces complete-day coverage and rejects the measured irradiance outage", async () => {
    await expect(getFeniMeasuredRange({
      startDate: "2017-07-07",
      endDate: "2017-07-07",
      targetLatitude: 22.80029,
      targetLongitude: 91.35819,
    })).rejects.toThrow("no valid DNI and/or DHI");

    await expect(getFeniMeasuredRange({
      startDate: "2017-06-08",
      endDate: "2017-06-08",
      targetLatitude: 22.80029,
      targetLongitude: 91.35819,
    })).rejects.toThrow(FENI_COMPLETE_LOCAL_START_DATE);

    expect(FENI_COMPLETE_LOCAL_END_DATE).toBe("2019-09-30");
  });
});
