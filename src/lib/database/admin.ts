import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { serverEnvironment } from "./environment.server";

export function createSupabaseAdminClient() {
  return createClient<Database>(
    serverEnvironment.supabaseUrl,
    serverEnvironment.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
