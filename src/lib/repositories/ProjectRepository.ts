import type {
  BootstrapFirstProjectInput,
  BootstrapFirstProjectResult,
  ProjectSummary,
  SiteVersionSnapshot,
} from "@/lib/projects/types";

export interface ProjectRepository {
  listProjects(): Promise<ProjectSummary[]>;

  bootstrapFirstProject(
    input: BootstrapFirstProjectInput,
  ): Promise<BootstrapFirstProjectResult>;

  getSiteVersion(
    siteVersionId: string,
  ): Promise<SiteVersionSnapshot | null>;
}
