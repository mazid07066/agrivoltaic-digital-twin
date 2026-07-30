import "server-only";

import type { ProjectRepository } from "./ProjectRepository";
import { SupabaseProjectRepository } from "./SupabaseProjectRepository.server";

export function createProjectRepository():
  ProjectRepository {
  return new SupabaseProjectRepository();
}
