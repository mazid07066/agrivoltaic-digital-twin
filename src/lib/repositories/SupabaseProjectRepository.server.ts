import "server-only";

import type { Json } from "@/lib/database/database.types";
import { createSupabaseServerClient } from "@/lib/database/server";
import {
  parseSiteOperationResult,
} from "@/lib/projects/registryPayload";
import {
  createSiteProfileSnapshot,
  parseSiteProfileSnapshot,
} from "@/lib/projects/siteSnapshot";
import type {
  BootstrapFirstProjectInput,
  BootstrapFirstProjectResult,
  ProjectSiteSummary,
  ProjectSummary,
  SiteOperationResult,
  SiteVersionSnapshot,
  WorkspaceSelection,
} from "@/lib/projects/types";
import type { SiteProfile } from "@/lib/sites/schema";

import type { ProjectRepository } from "./ProjectRepository";

function ensureRequiredId(
  value: string,
  fieldName: string,
): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmed;
}

function ensureName(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 200) {
    throw new Error(`${fieldName} must contain between 1 and 200 characters.`);
  }

  return trimmed;
}

export class SupabaseProjectRepository
  implements ProjectRepository
{
  private async createAuthenticatedClient() {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Authentication is required.");
    }

    return { supabase, user };
  }

  async listProjects(): Promise<ProjectSummary[]> {
    const { supabase } = await this.createAuthenticatedClient();

    const { data: projectRows, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, name, description, status, schema_version, created_at, updated_at",
      )
      .order("created_at", { ascending: true });

    if (projectError) {
      throw new Error(`Unable to load projects: ${projectError.message}`);
    }

    const { data: siteRows, error: siteError } = await supabase
      .from("sites")
      .select(
        "id, project_id, name, site_type, data_mode, status, client_reference, active_version_id, created_at, updated_at",
      )
      .order("created_at", { ascending: true });

    if (siteError) {
      throw new Error(`Unable to load sites: ${siteError.message}`);
    }

    const sitesByProject = new Map<string, ProjectSiteSummary[]>();

    for (const site of siteRows ?? []) {
      const mappedSite: ProjectSiteSummary = {
        id: site.id,
        projectId: site.project_id,
        name: site.name,
        siteType: site.site_type,
        dataMode: site.data_mode,
        status: site.status,
        clientReference: site.client_reference,
        activeVersionId: site.active_version_id,
        createdAt: site.created_at,
        updatedAt: site.updated_at,
      };

      const currentSites = sitesByProject.get(site.project_id) ?? [];
      currentSites.push(mappedSite);
      sitesByProject.set(site.project_id, currentSites);
    }

    return (projectRows ?? []).map(
      (project): ProjectSummary => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        schemaVersion: project.schema_version,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        sites: sitesByProject.get(project.id) ?? [],
      }),
    );
  }

  async getWorkspaceSelection(): Promise<WorkspaceSelection> {
    const { supabase, user } = await this.createAuthenticatedClient();

    const { data, error } = await supabase
      .from("user_workspace_preferences")
      .select("active_project_id, active_site_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load the active workspace: ${error.message}`);
    }

    return {
      activeProjectId: data?.active_project_id ?? null,
      activeSiteId: data?.active_site_id ?? null,
    };
  }

  async bootstrapFirstProject(
    input: BootstrapFirstProjectInput,
  ): Promise<BootstrapFirstProjectResult> {
    const migrationKey = input.migrationKey.trim();
    const projectName = input.projectName.trim() || "AgriTwin Project";

    if (!migrationKey) {
      throw new Error("A migration key is required.");
    }

    if (projectName.length > 200) {
      throw new Error("Project name must not exceed 200 characters.");
    }

    const snapshot = createSiteProfileSnapshot(input.siteProfile);
    const { supabase } = await this.createAuthenticatedClient();

    const { data, error } = await supabase.rpc(
      "bootstrap_first_agritwin_project",
      {
        p_migration_key: migrationKey,
        p_project_name: projectName,
        p_site_profile: snapshot as unknown as Json,
      },
    );

    if (error) {
      throw new Error(`Unable to create the first project: ${error.message}`);
    }

    const result = data?.[0];

    if (!result?.project_id || !result.site_id || !result.site_version_id) {
      throw new Error(
        "The project bootstrap operation returned an incomplete result.",
      );
    }

    return {
      projectId: result.project_id,
      siteId: result.site_id,
      siteVersionId: result.site_version_id,
      alreadyMigrated: result.already_migrated,
    };
  }

  async getSiteVersion(
    siteVersionId: string,
  ): Promise<SiteVersionSnapshot | null> {
    const validId = ensureRequiredId(siteVersionId, "Site-version ID");
    const { supabase } = await this.createAuthenticatedClient();

    const { data, error } = await supabase
      .from("site_versions")
      .select(
        "id, site_id, version_number, schema_version, configuration, configuration_hash, change_summary, created_at",
      )
      .eq("id", validId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load the site version: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      siteId: data.site_id,
      versionNumber: data.version_number,
      schemaVersion: data.schema_version,
      configuration: parseSiteProfileSnapshot(data.configuration),
      configurationHash: data.configuration_hash,
      changeSummary: data.change_summary,
      createdAt: data.created_at,
    };
  }

  async setActiveSite(
    projectId: string,
    siteId: string,
  ): Promise<SiteOperationResult> {
    const { supabase } = await this.createAuthenticatedClient();
    const { data, error } = await supabase.rpc("set_active_workspace", {
      p_project_id: ensureRequiredId(projectId, "Project ID"),
      p_site_id: ensureRequiredId(siteId, "Site ID"),
    });

    if (error) {
      throw new Error(`Unable to switch sites: ${error.message}`);
    }

    return parseSiteOperationResult(data);
  }

  async createLandSite(
    projectId: string,
    name: string,
    sourceProfile: SiteProfile,
  ): Promise<SiteOperationResult> {
    const { supabase } = await this.createAuthenticatedClient();
    const snapshot = createSiteProfileSnapshot(sourceProfile);
    const { data, error } = await supabase.rpc("create_land_site", {
      p_project_id: ensureRequiredId(projectId, "Project ID"),
      p_name: ensureName(name, "Site name"),
      p_source_profile: snapshot as unknown as Json,
    });

    if (error) {
      throw new Error(`Unable to create the site: ${error.message}`);
    }

    return parseSiteOperationResult(data);
  }

  async duplicateSite(
    siteId: string,
    name: string,
  ): Promise<SiteOperationResult> {
    const { supabase } = await this.createAuthenticatedClient();
    const { data, error } = await supabase.rpc("duplicate_site", {
      p_site_id: ensureRequiredId(siteId, "Site ID"),
      p_name: ensureName(name, "Duplicate-site name"),
    });

    if (error) {
      throw new Error(`Unable to duplicate the site: ${error.message}`);
    }

    return parseSiteOperationResult(data);
  }

  async renameSite(
    siteId: string,
    name: string,
  ): Promise<SiteOperationResult> {
    const { supabase } = await this.createAuthenticatedClient();
    const { data, error } = await supabase.rpc("rename_site", {
      p_site_id: ensureRequiredId(siteId, "Site ID"),
      p_name: ensureName(name, "Site name"),
    });

    if (error) {
      throw new Error(`Unable to rename the site: ${error.message}`);
    }

    return parseSiteOperationResult(data);
  }

  async archiveSite(siteId: string): Promise<void> {
    const { supabase } = await this.createAuthenticatedClient();
    const { error } = await supabase.rpc("archive_site", {
      p_site_id: ensureRequiredId(siteId, "Site ID"),
    });

    if (error) {
      throw new Error(`Unable to archive the site: ${error.message}`);
    }
  }

  async restoreSite(siteId: string): Promise<SiteOperationResult> {
    const { supabase } = await this.createAuthenticatedClient();
    const { data, error } = await supabase.rpc("restore_site", {
      p_site_id: ensureRequiredId(siteId, "Site ID"),
    });

    if (error) {
      throw new Error(`Unable to restore the site: ${error.message}`);
    }

    return parseSiteOperationResult(data);
  }
}
