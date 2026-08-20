"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/database/server";

export interface AuthActionState {
  status: "idle" | "success" | "error";
  message: string;
}

const initialFailureState: AuthActionState = {
  status: "error",
  message: "Authentication request failed.",
};

function readRequiredFormValue(
  formData: FormData,
  fieldName: string,
): string {
  const value = formData.get(fieldName);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

export async function signInAction(
  previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;

  try {
    const email = readRequiredFormValue(
      formData,
      "email",
    ).toLowerCase();

    const password = readRequiredFormValue(
      formData,
      "password",
    );

    const supabase = await createSupabaseServerClient();

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }
  } catch (error) {
    return {
      ...initialFailureState,
      message:
        error instanceof Error
          ? error.message
          : initialFailureState.message,
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/projects");
  redirect("/projects");
}

export async function signUpAction(
  previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;

  try {
    const displayName = readRequiredFormValue(
      formData,
      "displayName",
    );

    const email = readRequiredFormValue(
      formData,
      "email",
    ).toLowerCase();

    const password = readRequiredFormValue(
      formData,
      "password",
    );

    const institutionValue =
      formData.get("institution");

    const institution =
      typeof institutionValue === "string"
        ? institutionValue.trim()
        : "";

    if (password.length < 8) {
      return {
        status: "error",
        message:
          "Use a password containing at least 8 characters.",
      };
    }

    const supabase = await createSupabaseServerClient();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
      "http://localhost:3000";

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/confirm`,
          data: {
            display_name: displayName,
            institution:
              institution || null,
          },
        },
      });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    if (data.session) {
      revalidatePath("/", "layout");
      revalidatePath("/projects");
      redirect("/projects");
    }

    return {
      status: "success",
      message:
        "Account created. Check your email to confirm your address.",
    };
  } catch (error) {
    return {
      ...initialFailureState,
      message:
        error instanceof Error
          ? error.message
          : initialFailureState.message,
    };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
