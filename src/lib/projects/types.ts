import type { Database } from "@/lib/database/database.types";
import type { SiteProfile } from "@/lib/sites/schema";

export type ProjectRow =
  Database["public"]["Tables"]["projects"]["Row"];

export type SiteRow =
  Database["public"]["Tables"]["sites"]["Row"];

export type SiteVersionRow =
  Database["public"]["Tables"]["site_versions"]["Row"];

export type MigrationReceiptRow =
  Database["public"]["Tables"]["client_migration_receipts"]["Row"];

export type WorkspacePreferenceRow =
  Database["public"]["Tables"]["user_workspace_preferences"]["Row"];

export interface ProjectSiteSummary {
  id: string;
  projectId: string;
  name: string;
  siteType: SiteRow["site_type"];
  dataMode: SiteRow["data_mode"];
  status: SiteRow["status"];
  clientReference: string | null;
  activeVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectRow["status"];
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  sites: ProjectSiteSummary[];
}

export interface WorkspaceSelection {
  activeProjectId: string | null;
  activeSiteId: string | null;
}

export interface BootstrapFirstProjectInput {
  migrationKey: string;
  projectName: string;
  siteProfile: SiteProfile;
}

export interface BootstrapFirstProjectResult {
  projectId: string;
  siteId: string;
  siteVersionId: string;
  alreadyMigrated: boolean;
}

export interface SiteOperationResult {
  projectId: string;
  siteId: string;
  siteVersionId: string;
  siteProfile: SiteProfile;
}

export interface SiteVersionOperationResult extends SiteOperationResult {
  activeVersionId: string;
  activeVersionNumber: number;
  configurationHash: string;
  changeSummary: string;
  createdAt: string;
}

export interface SiteVersionHistoryEntry {
  versionId: string;
  siteId: string;
  versionNumber: number;
  schemaVersion: number;
  configurationHash: string | null;
  changeSummary: string | null;
  createdBy: string | null;
  creatorDisplayName: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface SiteVersionSnapshot {
  id: string;
  siteId: string;
  versionNumber: number;
  schemaVersion: number;
  configuration: SiteProfile;
  configurationHash: string | null;
  changeSummary: string | null;
  createdAt: string;
}
