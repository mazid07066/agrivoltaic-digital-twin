import "server-only";

import https from "node:https";

import {
  hardenEnvironmentalProvenance,
} from "../provenance.server";

import type {
  EnvironmentalDataRequest,
} from "../request";

import type {
  EnvironmentalDataset,
} from "../types";

import {
  normalizeOpenMeteoResponse,
} from "./normalize";

import {
  buildOpenMeteoUrl,
} from "./request";

import type {
  OpenMeteoResponse,
} from "./types";

const OPEN_METEO_TIMEOUT_MS = 30_000;

interface HttpJsonResponse {
  statusCode: number;
  body: string;
}

/**
 * Perform an HTTPS request using Node's native HTTPS transport.
 *
 * We explicitly use IPv4 because Node/Undici fetch can fail on
 * some networks when IPv6 is unavailable or Happy-Eyeballs
 * connection attempts time out.
 *
 * AgriTwin's Open-Meteo adapter is server-side only, so using
 * node:https is appropriate here.
 */
function requestJson(
  url: string,
): Promise<HttpJsonResponse> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const request =
        https.request(
          url,
          {
            method: "GET",

            family: 4,

            headers: {
              Accept:
                "application/json",

              "User-Agent":
                "AgriTwin/Phase-9B",
            },
          },
          (response) => {
            const chunks:
              Buffer[] = [];

            response.on(
              "data",
              (chunk: Buffer | string) => {
                chunks.push(
                  Buffer.isBuffer(
                    chunk,
                  )
                    ? chunk
                    : Buffer.from(
                        chunk,
                      ),
                );
              },
            );

            response.on(
              "end",
              () => {
                const body =
                  Buffer.concat(
                    chunks,
                  ).toString(
                    "utf8",
                  );

                resolve({
                  statusCode:
                    response.statusCode ??
                    0,

                  body,
                });
              },
            );
          },
        );

      request.setTimeout(
        OPEN_METEO_TIMEOUT_MS,
        () => {
          request.destroy(
            new Error(
              `Open-Meteo request timed out after ${OPEN_METEO_TIMEOUT_MS} ms.`,
            ),
          );
        },
      );

      request.on(
        "error",
        (error) => {
          reject(
            new Error(
              [
                "Open-Meteo network request failed.",
                error.message,
              ].join(" "),
              {
                cause:
                  error,
              },
            ),
          );
        },
      );

      request.end();
    },
  );
}

/**
 * Fetch and normalize environmental data from Open-Meteo.
 *
 * The returned object follows AgriTwin's canonical
 * EnvironmentalDataset schema rather than exposing provider-
 * specific field names to the simulation/policy layers.
 */
export async function fetchOpenMeteoEnvironment(
  request: EnvironmentalDataRequest,
): Promise<EnvironmentalDataset> {
  const url =
    buildOpenMeteoUrl(
      request,
    );

  let response:
    HttpJsonResponse;

  try {
    response =
      await requestJson(
        url,
      );
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Open-Meteo network request failed.",
      {
        cause:
          error,
      },
    );
  }

  if (
    response.statusCode < 200 ||
    response.statusCode >= 300
  ) {
    const details =
      response.body
        .trim()
        .slice(
          0,
          1000,
        );

    throw new Error(
      [
        `Open-Meteo request failed with HTTP ${response.statusCode}.`,

        details
          ? `Provider response: ${details}`
          : null,
      ]
        .filter(
          Boolean,
        )
        .join(" "),
    );
  }

  let payload:
    OpenMeteoResponse;

  try {
    payload =
      JSON.parse(
        response.body,
      ) as OpenMeteoResponse;
  } catch (
    error
  ) {
    throw new Error(
      "Open-Meteo returned invalid JSON.",
      {
        cause:
          error,
      },
    );
  }

  if (
    !payload.hourly?.time?.length
  ) {
    throw new Error(
      "Open-Meteo returned no hourly environmental records.",
    );
  }

  const dataset =
  normalizeOpenMeteoResponse(
    request,
    payload,
  );

return hardenEnvironmentalProvenance(
  request,
  dataset,
);
}
