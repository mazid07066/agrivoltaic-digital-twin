import {
  NextResponse,
} from "next/server";

import {
  loadComparableRun,
} from "@/lib/analytics/analyticsReader.server";

import {
  assessStudyCompatibility,
} from "@/lib/analytics/studyCompatibility";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

interface CompatibilityRequestBody {
  runIds?:
    unknown;
}

export async function POST(
  request:
    Request,
) {
  try {
    const body =
      (await request.json()) as
        CompatibilityRequestBody;

    if (
      !Array.isArray(
        body.runIds,
      )
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "runIds must be an array.",
        },
        {
          status:
            400,
        },
      );
    }

    const runIds =
      body.runIds
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
              "string" &&
            value.trim()
              .length >
              0,
        )
        .map(
          (
            value,
          ) =>
            value.trim(),
        );

    if (
      runIds.length <
      2
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Select at least two persisted runs.",
        },
        {
          status:
            400,
        },
      );
    }

    const uniqueIds =
      [
        ...new Set(
          runIds,
        ),
      ];

    if (
      uniqueIds.length !==
      runIds.length
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Duplicate simulation runs are not allowed.",
        },
        {
          status:
            400,
        },
      );
    }

    if (
      uniqueIds.length >
      50
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Compatibility assessment currently supports a maximum of 50 runs.",
        },
        {
          status:
            400,
        },
      );
    }

    const records =
      await Promise.all(
        uniqueIds.map(
          (
            runId,
          ) =>
            loadComparableRun(
              runId,
            ),
        ),
      );

    const compatibility =
      assessStudyCompatibility(
        records,
      );

    return NextResponse.json({
      ok:
        true,

      compatibility,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Study compatibility could not be evaluated.",
      },
      {
        status:
          400,
      },
    );
  }
}
