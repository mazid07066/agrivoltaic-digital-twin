import {
  assessEnvironmentalQuality,
} from "../quality";

import type {
  EnvironmentalDataRequest,
} from "../request";

import type {
  EnvironmentalDailySummary,
  EnvironmentalDataset,
  EnvironmentalHourlyPoint,
} from "../types";

import type {
  OpenMeteoResponse,
} from "./types";

function valueAt(
  values:
    | number[]
    | undefined,
  index: number,
): number | null {
  const value =
    values?.[index];

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null;
}

function stringAt(
  values:
    | string[]
    | undefined,
  index: number,
): string | null {
  const value =
    values?.[index];

  return typeof value === "string"
    ? value
    : null;
}

export function normalizeOpenMeteoResponse(
  request: EnvironmentalDataRequest,
  payload: OpenMeteoResponse,
): EnvironmentalDataset {
  const times =
    payload.hourly?.time ?? [];

  const hourly:
    EnvironmentalHourlyPoint[] =
    times.map(
      (timestamp, index) => ({
        timestamp,

        ghiWm2:
          valueAt(
            payload.hourly
              ?.shortwave_radiation,
            index,
          ),

        dniWm2:
          valueAt(
            payload.hourly
              ?.direct_normal_irradiance,
            index,
          ),

        dhiWm2:
          valueAt(
            payload.hourly
              ?.diffuse_radiation,
            index,
          ),

        temperatureC:
          valueAt(
            payload.hourly
              ?.temperature_2m,
            index,
          ),

        relativeHumidityPct:
          valueAt(
            payload.hourly
              ?.relative_humidity_2m,
            index,
          ),

        cloudCoverPct:
          valueAt(
            payload.hourly
              ?.cloud_cover,
            index,
          ),

        windSpeedMs:
          valueAt(
            payload.hourly
              ?.wind_speed_10m,
            index,
          ),

        windDirectionDeg:
          valueAt(
            payload.hourly
              ?.wind_direction_10m,
            index,
          ),

        precipitationMm:
          valueAt(
            payload.hourly
              ?.precipitation,
            index,
          ),

        pressureHpa:
          valueAt(
            payload.hourly
              ?.surface_pressure,
            index,
          ),

        et0Mm:
          valueAt(
            payload.hourly
              ?.et0_fao_evapotranspiration,
            index,
          ),
      }),
    );

  const dailyTimes =
    payload.daily?.time ?? [];

  const daily:
    EnvironmentalDailySummary[] =
    dailyTimes.map(
      (date, index) => ({
        date,

        sunrise:
          stringAt(
            payload.daily
              ?.sunrise,
            index,
          ),

        sunset:
          stringAt(
            payload.daily
              ?.sunset,
            index,
          ),

        maximumTemperatureC:
          valueAt(
            payload.daily
              ?.temperature_2m_max,
            index,
          ),

        minimumTemperatureC:
          valueAt(
            payload.daily
              ?.temperature_2m_min,
            index,
          ),

        totalPrecipitationMm:
          valueAt(
            payload.daily
              ?.precipitation_sum,
            index,
          ),

        maximumWindSpeedMs:
          valueAt(
            payload.daily
              ?.wind_speed_10m_max,
            index,
          ),
      }),
    );

  const quality =
    assessEnvironmentalQuality(
      hourly,
    );

  return {
    schemaVersion: 1,

    provenance: {
      source:
        "open_meteo",

      mode:
        request.mode,

      provider:
        "Open-Meteo",

      requestedCoordinate:
        request.coordinate,

      resolvedCoordinate: {
        latitude:
          payload.latitude,

        longitude:
          payload.longitude,
      },

      timezone:
        payload.timezone,

      retrievedAt:
        new Date().toISOString(),

      datasetId:
        null,

      providerModel:
        null,

      providerElevationM:
        payload.elevation ??
        null,

      rawSourceMetadata: {
        timezoneAbbreviation:
          payload
            .timezone_abbreviation ??
          null,

        utcOffsetSeconds:
          payload
            .utc_offset_seconds ??
          null,

        hourlyUnits:
          payload.hourly_units ??
          {},

        dailyUnits:
          payload.daily_units ??
          {},
      },
    },

    startTime:
      hourly[0]
        ?.timestamp ??
      request.startDate,

    endTime:
      hourly[
        hourly.length - 1
      ]?.timestamp ??
      request.endDate,

    hourly,

    daily,

    quality,
  };
}
