"use client";

import { useActionState, useState } from "react";

import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/app/auth/actions";

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

export default function AuthForm() {
  const [mode, setMode] =
    useState<"signin" | "signup">("signin");

  const [signInState, signInFormAction, signInPending] =
    useActionState(signInAction, initialState);

  const [signUpState, signUpFormAction, signUpPending] =
    useActionState(signUpAction, initialState);

  const activeState =
    mode === "signin"
      ? signInState
      : signUpState;

  const pending =
    mode === "signin"
      ? signInPending
      : signUpPending;

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "signin"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600"
          }`}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>

        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "signup"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600"
          }`}
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
      </div>

      <form
        action={
          mode === "signin"
            ? signInFormAction
            : signUpFormAction
        }
        className="space-y-4"
      >
        {mode === "signup" ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Display name
              </span>
              <input
                type="text"
                name="displayName"
                required
                autoComplete="name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Institution
              </span>
              <input
                type="text"
                name="institution"
                autoComplete="organization"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
          </>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete={
              mode === "signin"
                ? "current-password"
                : "new-password"
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>

        {activeState.message ? (
          <p
            role="status"
            className={`rounded-xl px-3 py-2 text-sm ${
              activeState.status === "error"
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {activeState.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-emerald-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Please wait..."
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </section>
  );
}
