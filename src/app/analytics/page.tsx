import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

import LogoutButton from "@/components/auth/LogoutButton";

import {
  createSupabaseServerClient,
} from "@/lib/database/server";

export const dynamic =
  "force-dynamic";

export default async function AnalyticsPage() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    redirect(
      "/login",
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-700">
              AgriTwin Policy Test Bench
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Analytics & Decision Support
            </h1>

            <p className="mt-3 max-w-3xl text-slate-600">
              Compare reproducible persisted
              digital-twin runs and build the
              foundation for policy evaluation,
              MCDA and sensitivity analysis.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/projects"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
            >
              Projects
            </Link>

            <Link
              href="/scenarios"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
            >
              Scenario Lab
            </Link>

            <Link
              href="/analytics"
              aria-current="page"
              className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
            >
              Analytics
            </Link>

            <LogoutButton className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50" />
          </div>
        </header>

        <section className="mt-8">
          <AnalyticsDashboard />
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phase 9D-3
            </p>

            <h2 className="mt-2 font-semibold text-slate-900">
              Policy Evaluation
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Constraint pass/fail and policy
              compliance scoring will be added
              here.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phase 9D-6
            </p>

            <h2 className="mt-2 font-semibold text-slate-900">
              MCDA
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Criteria normalization, weights
              and decision ranking will build
              on persisted-run comparisons.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phase 9D-9
            </p>

            <h2 className="mt-2 font-semibold text-slate-900">
              Sensitivity Analysis
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Ranking robustness under changing
              policy and criterion weights.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
