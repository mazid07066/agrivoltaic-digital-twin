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

    it("forwards the selected provider without source mixing", async () => {
      const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return new Response(JSON.stringify({
        schema: "agritwin-weather-range-v1",
        plan: {
          schema: "agritwin-weather-range-plan-v1",
          requestedStartDate: "2019-09-30",
          requestedEndDate: "2019-09-30",
          earliestHistoricalDate: "2017-06-09",
          latestForecastDate: "2019-09-30",
          source: "measured",
          segments: [],
          provider: "feni_measured",
        },
        days: [],
        warnings: [],
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      });
      vi.stubGlobal("fetch", fetchMock);

      await getWeatherRange({
        latitude: 22.80029,
        longitude: 91.35819,
        startDate: "2019-09-30",
        endDate: "2019-09-30",
        provider: "feni_measured",
      });

      expect(String(fetchMock.mock.calls[0][0])).toContain("provider=feni_measured");
    });
  },
);
