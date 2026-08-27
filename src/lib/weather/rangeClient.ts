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

  timeoutMs?:
    number;
}

export async function getWeatherRange({
  latitude,
  longitude,
  startDate,
  endDate,
  signal,
  timeoutMs = 30_000,
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

  const requestController =
    new AbortController();

  const forwardAbort = () =>
    requestController.abort();

  signal?.addEventListener(
    "abort",
    forwardAbort,
    { once: true },
  );

  const timeout =
    globalThis.setTimeout(
      () =>
        requestController.abort(),
      timeoutMs,
    );

  let response:
    Response;

  try {
    response =
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

          signal:
            requestController.signal,
        },
      );
  } catch (error) {
    if (
      requestController.signal.aborted &&
      !signal?.aborted
    ) {
      throw new Error(
        `Weather batch timed out after ${Math.round(timeoutMs / 1000)} seconds. Retry the request; if it recurs, request a shorter date range.`,
      );
    }

    throw error;
  } finally {
    globalThis.clearTimeout(
      timeout,
    );

    signal?.removeEventListener(
      "abort",
      forwardAbort,
    );
  }

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
