"use server";

import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";

import {
  createPhase8AMigrationKey,
} from "@/lib/projects/siteSnapshot";
import {
  createProjectRepository,
} from "@/lib/repositories/index.server";
import {
  isSiteProfile,
} from "@/lib/sites/migrations";

export interface ProjectBootstrapActionState {
  status: "idle" | "error";
  message: string;
}

function readRequiredString(
  formData: FormData,
  name: string,
): string {
  const value = formData.get(name);

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(`${name} is required.`);
  }

  return value.trim();
}

export async function bootstrapFirstProjectAction(
  previousState: ProjectBootstrapActionState,
  formData: FormData,
): Promise<ProjectBootstrapActionState> {
  void previousState;

  try {
    const projectName =
      readRequiredString(
        formData,
        "projectName",
      );

    const serializedSite =
      readRequiredString(
        formData,
        "siteProfile",
      );

    const parsedSite: unknown =
      JSON.parse(serializedSite);

    if (!isSiteProfile(parsedSite)) {
      return {
        status: "error",
        message:
          "The current browser site is not a supported Phase 8A SiteProfile.",
      };
    }

    const repository =
      createProjectRepository();

    await repository.bootstrapFirstProject({
      migrationKey:
        createPhase8AMigrationKey(
          parsedSite,
        ),
      projectName,
      siteProfile: parsedSite,
    });
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to create the first AgriTwin project.",
    };
  }

  revalidatePath("/projects");
  redirect("/projects?migration=complete");
}
