import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/database/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const tokenHash =
    requestUrl.searchParams.get("token_hash");

  const type =
    requestUrl.searchParams.get(
      "type",
    ) as EmailOtpType | null;

  const next =
    requestUrl.searchParams.get("next") ??
    "/projects";

  if (tokenHash && type) {
    const supabase =
      await createSupabaseServerClient();

    const { error } =
      await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

    if (!error) {
      redirect(
        next.startsWith("/")
          ? next
          : "/projects",
      );
    }
  }

  redirect(
    "/login?error=email-confirmation-failed",
  );
}
