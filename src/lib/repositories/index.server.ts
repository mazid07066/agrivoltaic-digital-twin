import "server-only";

import type {
  ProjectRepository,
} from "./ProjectRepository";
import type {
  ScenarioRepository,
} from "./ScenarioRepository";

import {
  SupabaseProjectRepository,
} from "./SupabaseProjectRepository.server";

import {
  SupabaseScenarioRepository,
} from "./SupabaseScenarioRepository.server";

export function createProjectRepository():
  ProjectRepository {
  return new SupabaseProjectRepository();
}

export function createScenarioRepository():
  ScenarioRepository {
  return new SupabaseScenarioRepository();
}
