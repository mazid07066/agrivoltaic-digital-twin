import {
  NextResponse,
} from "next/server";

import {
  loadComparableRun,
} from "@/lib/analytics/analyticsReader.server";

import {
  analyzePersistedRuns,
} from "@/lib/analytics/multiRunAnalytics";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

interface StudyRequestBody {
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
        StudyRequestBody;

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
            "A Phase 9D study set currently supports a maximum of 50 runs.",
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

    const analytics =
      analyzePersistedRuns(
        records,
      );

    return NextResponse.json({
      ok:
        true,

      analytics,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Multi-run analytics failed.",
      },
      {
        status:
          400,
      },
    );
  }
}
