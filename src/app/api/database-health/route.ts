import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/lib/database/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkDatabaseHealth();

  return NextResponse.json(result, {
    status: result.connected ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
