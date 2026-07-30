import "server-only";

import { createSupabaseAdminClient } from "./admin";

export interface DatabaseHealthResult {
  status: "ok" | "error";
  connected: boolean;
  checkedAtUtc: string;
  database: "supabase-postgresql";
  modelVersionCount?: number;
  error?: string;
}

export async function checkDatabaseHealth():
  Promise<DatabaseHealthResult> {
  const checkedAtUtc = new Date().toISOString();

  try {
    const supabase = createSupabaseAdminClient();

    const { count, error } = await supabase
      .from("model_versions")
      .select("id", {
        count: "exact",
        head: true,
      });

    if (error) {
      return {
        status: "error",
        connected: false,
        checkedAtUtc,
        database: "supabase-postgresql",
        error: error.message,
      };
    }

    return {
      status: "ok",
      connected: true,
      checkedAtUtc,
      database: "supabase-postgresql",
      modelVersionCount: count ?? 0,
    };
  } catch (error) {
    return {
      status: "error",
      connected: false,
      checkedAtUtc,
      database: "supabase-postgresql",
      error:
        error instanceof Error
          ? error.message
          : "Unknown database health error.",
    };
  }
}
