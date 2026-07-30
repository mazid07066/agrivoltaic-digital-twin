import type {
  BootstrapFirstProjectInput,
  BootstrapFirstProjectResult,
  ProjectSummary,
  SiteOperationResult,
  SiteVersionSnapshot,
  WorkspaceSelection,
} from "@/lib/projects/types";
import type { SiteProfile } from "@/lib/sites/schema";

export interface ProjectRepository {
  listProjects(): Promise<ProjectSummary[]>;

  getWorkspaceSelection(): Promise<WorkspaceSelection>;

  bootstrapFirstProject(
    input: BootstrapFirstProjectInput,
  ): Promise<BootstrapFirstProjectResult>;

  getSiteVersion(
    siteVersionId: string,
  ): Promise<SiteVersionSnapshot | null>;

  setActiveSite(
    projectId: string,
    siteId: string,
  ): Promise<SiteOperationResult>;

  createLandSite(
    projectId: string,
    name: string,
    sourceProfile: SiteProfile,
  ): Promise<SiteOperationResult>;

  duplicateSite(
    siteId: string,
    name: string,
  ): Promise<SiteOperationResult>;

  renameSite(
    siteId: string,
    name: string,
  ): Promise<SiteOperationResult>;

  archiveSite(siteId: string): Promise<void>;

  restoreSite(siteId: string): Promise<SiteOperationResult>;
}
