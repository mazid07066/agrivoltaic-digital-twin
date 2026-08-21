import {
  NextResponse,
} from "next/server";

import {
  listAnalyticsRuns,
} from "@/lib/analytics/analyticsReader.server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const runs =
      await listAnalyticsRuns();

    return NextResponse.json({
      ok:
        true,

      runs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Analytics runs could not be loaded.",
      },
      {
        status:
          400,
      },
    );
  }
}
