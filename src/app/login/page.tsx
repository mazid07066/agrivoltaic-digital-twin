import { redirect } from "next/navigation";

import AuthForm from "@/components/auth/AuthForm";
import { createSupabaseServerClient } from "@/lib/database/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto mb-8 max-w-md text-center">
        <h1 className="text-3xl font-semibold text-slate-900">
          AgriTwin
        </h1>

        <p className="mt-2 text-slate-600">
          Sign in to preserve projects, sites,
          simulations and future sensor records.
        </p>
      </div>

      <AuthForm />
    </main>
  );
}
