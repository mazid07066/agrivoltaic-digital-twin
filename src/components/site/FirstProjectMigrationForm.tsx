"use client";

import {
  useActionState,
  useSyncExternalStore,
} from "react";

import {
  bootstrapFirstProjectAction,
  type ProjectBootstrapActionState,
} from "@/app/projects/actions";
import {
  useSimulationStore,
} from "@/store/useSimulationStore";

const initialProjectBootstrapState:
  ProjectBootstrapActionState = {
    status: "idle",
    message: "",
  };

function subscribeToHydration() {
  return () => {
    // No external subscription is required.
  };
}

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

export default function FirstProjectMigrationForm() {
  const activeSite =
    useSimulationStore(
      (state) => state.activeSite,
    );

  const hydrated = useHasHydrated();

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    bootstrapFirstProjectAction,
    initialProjectBootstrapState,
  );

  if (!hydrated) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-slate-600">
          Loading the current Phase 8A site…
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-900">
        Preserve the current land site
      </h2>

      <p className="mt-2 text-slate-600">
        This creates the first database project and
        stores an immutable version of the current
        Phase 8A land configuration.
      </p>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-500">
            Site
          </dt>

          <dd className="font-medium text-slate-900">
            {activeSite.name}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-slate-500">
            Site type
          </dt>

          <dd className="font-medium text-slate-900">
            {activeSite.siteType.replaceAll(
              "_",
              " ",
            )}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-slate-500">
            Data mode
          </dt>

          <dd className="font-medium text-slate-900">
            {activeSite.dataMode}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-slate-500">
            Schema version
          </dt>

          <dd className="font-medium text-slate-900">
            {activeSite.schemaVersion}
          </dd>
        </div>
      </dl>

      <form
        action={formAction}
        className="mt-6 space-y-4"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Project name
          </span>

          <input
            type="text"
            name="projectName"
            required
            maxLength={200}
            defaultValue="AgriTwin Project"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>

        <input
          type="hidden"
          name="siteProfile"
          value={JSON.stringify(activeSite)}
        />

        {state.message ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Preserving project…"
            : "Create and preserve project"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-500">
        Repeating this operation with the same site
        returns the existing migration receipt instead
        of creating a duplicate project.
      </p>
    </section>
  );
}
