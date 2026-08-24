import type {
  WeatherApiError,
  WeatherRangeResponse,
} from "@/types/weather";

export interface WeatherRangeRequest {
  latitude:
    number;

  longitude:
    number;

  startDate:
    string;

  endDate:
    string;

  signal?:
    AbortSignal;
}

export async function getWeatherRange({
  latitude,
  longitude,
  startDate,
  endDate,
  signal,
}: WeatherRangeRequest): Promise<WeatherRangeResponse> {
  const parameters =
    new URLSearchParams({
      latitude:
        latitude.toString(),

      longitude:
        longitude.toString(),

      startDate,

      endDate,
    });

  const response =
    await fetch(
      `/api/weather-range?${parameters.toString()}`,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },

        cache:
          "no-store",

        signal,
      },
    );

  const data =
    (
      await response.json()
    ) as
      | WeatherRangeResponse
      | WeatherApiError;

  if (
    !response.ok ||
    "error" in data
  ) {
    const errorData =
      data as WeatherApiError;

    throw new Error(
      errorData.details
        ? `${errorData.error} ${errorData.details}`
        : errorData.error,
    );
  }

  return data;
}
