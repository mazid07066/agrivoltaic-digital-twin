import "server-only";

import {
  Buffer,
} from "node:buffer";

import {
  get,
} from "node:https";

export interface OpenMeteoHttpResponse {
  statusCode:
    number;

  body:
    string;
}

function requestOnce(
  url:
    string,

  timeoutMs:
    number,
): Promise<OpenMeteoHttpResponse> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      let settled =
        false;

      const finish = <T>(
        callback: (value: T) => void,
        value: T,
      ) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(
          responseTimer,
        );
        callback(
          value,
        );
      };

      const request =
        get(
          url,
          {
            /*
             * Some Linux/Node environments resolve an
             * unreachable IPv6 Open-Meteo address before
             * IPv4. The browser and curl may still work.
             * Pinning this server request to IPv4 avoids
             * that runtime-only failure.
             */
            family:
              4,

            headers: {
              Accept:
                "application/json",

              "User-Agent":
                "AgriTwin-Digital-Twin/0.9",
            },
          },
          (
            response,
          ) => {
            const chunks:
              Buffer[] = [];

            response.on(
              "data",
              (
                chunk:
                  Buffer |
                  string,
              ) => {
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
                finish(
                  resolve,
                  {
                    statusCode:
                      response.statusCode ??
                      502,

                    body:
                      Buffer.concat(
                        chunks,
                      ).toString(
                        "utf8",
                      ),
                  },
                );
              },
            );

            response.on(
              "aborted",
              () => {
                finish(
                  reject,
                  new Error(
                    "Open-Meteo closed the response before completion.",
                  ),
                );
              },
            );

            response.on(
              "error",
              (error) => {
                finish(
                  reject,
                  error,
                );
              },
            );
          },
        );

      /*
       * Use an absolute deadline. request.setTimeout() only
       * measures socket inactivity and can wait indefinitely
       * when an upstream response continues to trickle data.
       */
      const responseTimer =
        setTimeout(
          () => {
            request.destroy(
              new Error(
                `Open-Meteo request exceeded the ${timeoutMs} ms total deadline.`,
              ),
            );
          },
          timeoutMs,
        );

      request.setTimeout(
        timeoutMs,
        () => {
          request.destroy(
            new Error(
              `Open-Meteo request timed out after ${timeoutMs} ms.`,
            ),
          );
        },
      );

      request.on(
        "error",
        (
          error,
        ) => {
          finish(
            reject,
            error,
          );
        },
      );
    },
  );
}

function retryableStatus(
  statusCode:
    number,
): boolean {
  return (
    statusCode === 429 ||
    statusCode >= 500
  );
}

export async function requestOpenMeteoWithRetry({
  url,
  attempts = 2,
  timeoutMs = 12_000,
}: {
  url:
    string;

  attempts?:
    number;

  timeoutMs?:
    number;
}): Promise<OpenMeteoHttpResponse> {
  let lastError:
    unknown = null;

  for (
    let attempt = 1;
    attempt <= attempts;
    attempt += 1
  ) {
    try {
      const response =
        await requestOnce(
          url,
          timeoutMs,
        );

      if (
        !retryableStatus(
          response.statusCode,
        ) ||
        attempt === attempts
      ) {
        return response;
      }

      lastError =
        new Error(
          `Open-Meteo returned HTTP ${response.statusCode}.`,
        );
    } catch (error) {
      lastError =
        error;

      if (
        attempt === attempts
      ) {
        break;
      }
    }

    await new Promise<void>(
      (
        resolve,
      ) => {
        setTimeout(
          resolve,
          attempt * 400,
        );
      },
    );
  }

  const detail =
    lastError instanceof Error
      ? lastError.message
      : "Unknown network error.";

  throw new Error(
    `Open-Meteo connection failed after ${attempts} attempts. ${detail}`,
  );
}
