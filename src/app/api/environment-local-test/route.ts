import {
  NextResponse,
} from "next/server";

import {
  getLocalEnvironmentDatasetDefinition,
} from "@/lib/environment/localDataset/registry";

import {
  loadSolarMemEnvironmentalDataset,
} from "@/lib/environment/localDataset/solarMem.server";

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

    const startDate =
      url.searchParams.get(
        "startDate",
      ) ??
      "2017-06-08";

    const endDate =
      url.searchParams.get(
        "endDate",
      ) ??
      startDate;

    const definition =
      getLocalEnvironmentDatasetDefinition(
        "solar-mem-data-v1",
      );

    if (!definition) {
      throw new Error(
        "Solar-MEM dataset is not registered.",
      );
    }

    const dataset =
      await loadSolarMemEnvironmentalDataset(
        definition,
        {
          source:
            "uploaded_dataset",

          mode:
            "dataset",

          coordinate: {
            /*
             * Dataset-site coordinates can be
             * replaced with verified measurement-
             * station coordinates later.
             */
            latitude:
              23.8103,

            longitude:
              90.4125,
          },

          startDate,
          endDate,

          timezone:
            definition.timezone,

          datasetId:
            definition.id,
        },
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
            : "Local environmental dataset test failed.",
      },
      {
        status: 400,
      },
    );
  }
}
