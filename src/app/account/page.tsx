import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/database/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, institution, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">
        AgriTwin account
      </h1>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-slate-500">
              Email
            </dt>
            <dd className="font-medium text-slate-900">
              {user.email ?? "Not available"}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">
              Display name
            </dt>
            <dd className="font-medium text-slate-900">
              {profile?.display_name ??
                "Not configured"}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">
              Institution
            </dt>
            <dd className="font-medium text-slate-900">
              {profile?.institution ??
                "Not configured"}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">
              User ID
            </dt>
            <dd className="break-all font-mono text-sm text-slate-900">
              {user.id}
            </dd>
          </div>
        </dl>

        <form
          action={signOutAction}
          className="mt-6"
        >
          <button
            type="submit"
            className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-800"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
