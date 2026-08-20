import {
  NextResponse,
} from "next/server";

import {
  environmentalDataRequestSchema,
} from "@/lib/environment/schema";

import {
  fetchOpenMeteoEnvironment,
} from "@/lib/environment/openMeteo";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: Request,
) {
  try {
    const url =
      new URL(request.url);

    const latitude =
      Number(
        url.searchParams.get(
          "latitude",
        ),
      );

    const longitude =
      Number(
        url.searchParams.get(
          "longitude",
        ),
      );

    const startDate =
      url.searchParams.get(
        "startDate",
      );

    const endDate =
      url.searchParams.get(
        "endDate",
      );

    const mode =
      url.searchParams.get(
        "mode",
      ) ??
      "historical";

    const timezone =
      url.searchParams.get(
        "timezone",
      ) ??
      "auto";

    const parsed =
      environmentalDataRequestSchema.parse(
        {
          source:
            "open_meteo",

          mode,

          coordinate: {
            latitude,
            longitude,
          },

          startDate,

          endDate,

          timezone,
        },
      );

    const dataset =
      await fetchOpenMeteoEnvironment(
        parsed,
      );

    return NextResponse.json({
      ok: true,
      dataset,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Environmental request failed.",
      },
      {
        status: 400,
      },
    );
  }
}
