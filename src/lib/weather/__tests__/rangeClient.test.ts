import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getWeatherRange,
} from "../rangeClient";

describe(
  "weather-range browser client",
  () => {
    afterEach(
      () => {
        vi.unstubAllGlobals();
      },
    );

    it(
      "surfaces a useful retryable network error",
      async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(
            async () =>
              new Response(
                JSON.stringify({
                  error:
                    "Open-Meteo could not provide the requested weather range.",

                  details:
                    "The upstream weather connection failed. Please retry the request.",

                  retryable:
                    true,
                }),
                {
                  status:
                    502,

                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                },
              ),
          ),
        );

        await expect(
          getWeatherRange({
            latitude:
              23.81,

            longitude:
              90.41,

            startDate:
              "2026-08-24",

            endDate:
              "2026-08-24",
          }),
        ).rejects.toThrow(
          "Please retry the request",
        );
      },
    );

    it(
      "ends a stalled browser request at the configured deadline",
      async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(
            (
              _input: RequestInfo | URL,
              init?: RequestInit,
            ) =>
              new Promise<Response>(
                (
                  _resolve,
                  reject,
                ) => {
                  init?.signal?.addEventListener(
                    "abort",
                    () =>
                      reject(
                        new DOMException(
                          "Aborted",
                          "AbortError",
                        ),
                      ),
                    { once: true },
                  );
                },
              ),
          ),
        );

        await expect(
          getWeatherRange({
            latitude: 23.81,
            longitude: 90.41,
            startDate: "2026-08-01",
            endDate: "2026-08-27",
            timeoutMs: 5,
          }),
        ).rejects.toThrow(
          "Weather batch timed out",
        );
      },
    );
  },
);
