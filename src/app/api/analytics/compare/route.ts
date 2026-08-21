import {
  NextResponse,
} from "next/server";

import {
  loadComparableRun,
} from "@/lib/analytics/analyticsReader.server";

import {
  comparePersistedRunRecords,
} from "@/lib/analytics/baselineComparison";

import {
  evaluatePolicyConstraints,
} from "@/lib/analytics/policyEvaluator";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET(
  request:
    Request,
) {
  try {
    const url =
      new URL(
        request.url,
      );

    const referenceRunId =
      url.searchParams.get(
        "referenceRunId",
      );

    const alternativeRunId =
      url.searchParams.get(
        "alternativeRunId",
      );

    if (
      !referenceRunId ||
      !alternativeRunId
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "referenceRunId and alternativeRunId are required.",
        },
        {
          status:
            400,
        },
      );
    }

    const [
      reference,
      alternative,
    ] =
      await Promise.all([
        loadComparableRun(
          referenceRunId,
        ),

        loadComparableRun(
          alternativeRunId,
        ),
      ]);

    const comparison =
      comparePersistedRunRecords(
        reference,
        alternative,
      );

    return NextResponse.json({
      ok:
        true,

      comparison,

      policyEvaluation: {
        reference:
          evaluatePolicyConstraints(
            reference,
          ),

        alternative:
          evaluatePolicyConstraints(
            alternative,
          ),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Run comparison failed.",
      },
      {
        status:
          400,
      },
    );
  }
}
