import "server-only";

import type { Json } from "@/lib/database/database.types";
import { createSupabaseServerClient } from "@/lib/database/server";
import {
  createScenarioConfigurationSnapshot,
} from "@/lib/scenarios/configuration";
import {
  mapScenarioRow,
  type ScenarioDatabaseRow,
} from "@/lib/scenarios/mapper";
import {
  createScenarioSchema,
  updateScenarioSchema,
} from "@/lib/scenarios/schema";
import type {
  CreateScenarioInput,
  Scenario,
  UpdateScenarioInput,
} from "@/lib/scenarios/types";

import type {
  ScenarioListOptions,
  ScenarioRepository,
} from "./ScenarioRepository";

function ensureId(
  value: string,
  fieldName: string,
): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmed;
}

function asJson(
  value: unknown,
): Json {
  return value as Json;
}

export class SupabaseScenarioRepository
  implements ScenarioRepository
{
  private async createAuthenticatedClient() {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error(
        "Authentication is required.",
      );
    }

    return {
      supabase,
      user,
    };
  }

  async listScenarios(
    options: ScenarioListOptions,
  ): Promise<Scenario[]> {
    const projectId = ensureId(
      options.projectId,
      "Project ID",
    );

    const { supabase } =
      await this.createAuthenticatedClient();

    let query = supabase
      .from("scenarios")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: false,
      });

    if (options.siteId) {
      query = query.eq(
        "site_id",
        ensureId(
          options.siteId,
          "Site ID",
        ),
      );
    }

    if (!options.includeArchived) {
      query = query.neq(
        "status",
        "archived",
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Unable to load scenarios: ${error.message}`,
      );
    }

    return (data ?? []).map((row) =>
      mapScenarioRow(
        row as ScenarioDatabaseRow,
      ),
    );
  }

  async getScenario(
    scenarioId: string,
  ): Promise<Scenario | null> {
    const id = ensureId(
      scenarioId,
      "Scenario ID",
    );

    const { supabase } =
      await this.createAuthenticatedClient();

    const { data, error } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to load scenario: ${error.message}`,
      );
    }

    if (!data) {
      return null;
    }

    return mapScenarioRow(
      data as ScenarioDatabaseRow,
    );
  }

  async createScenario(
    input: CreateScenarioInput,
  ): Promise<Scenario> {
    const parsed =
      createScenarioSchema.parse(input);

    const {
      supabase,
      user,
    } =
      await this.createAuthenticatedClient();

    const snapshot =
      createScenarioConfigurationSnapshot({
        technicalConfig:
          parsed.technicalConfig,
        agriculturalConfig:
          parsed.agriculturalConfig,
        weatherConfig:
          parsed.weatherConfig,
        policyConfig:
          parsed.policyConfig,
        economicConfig:
          parsed.economicConfig,
        metadata:
          parsed.metadata,
      });

    const { data, error } = await supabase
      .from("scenarios")
      .insert({
        project_id:
          parsed.projectId,

        site_id:
          parsed.siteId,

        name:
          parsed.name,

        description:
          parsed.description ?? null,

        scenario_type:
          parsed.scenarioType,

        status:
          parsed.status,

        is_baseline:
          parsed.isBaseline,

        parent_scenario_id:
          parsed.parentScenarioId ??
          null,

        scenario_version: 1,

        configuration:
          asJson(snapshot),

        technical_config:
          asJson(
            parsed.technicalConfig,
          ),

        agricultural_config:
          asJson(
            parsed.agriculturalConfig,
          ),

        weather_config:
          asJson(
            parsed.weatherConfig,
          ),

        policy_config:
          asJson(
            parsed.policyConfig,
          ),

        economic_config:
          asJson(
            parsed.economicConfig,
          ),

        metadata:
          asJson(parsed.metadata),

        created_by:
          user.id,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Unable to create scenario: ${error.message}`,
      );
    }

    return mapScenarioRow(
      data as ScenarioDatabaseRow,
    );
  }

  async updateScenario(
    scenarioId: string,
    input: UpdateScenarioInput,
  ): Promise<Scenario> {
    const id = ensureId(
      scenarioId,
      "Scenario ID",
    );

    const parsed =
      updateScenarioSchema.parse(input);

    const current =
      await this.getScenario(id);

    if (!current) {
      throw new Error(
        "Scenario was not found.",
      );
    }

    if (
      current.status === "archived"
    ) {
      throw new Error(
        "Archived scenarios cannot be edited.",
      );
    }

    const technicalConfig =
      parsed.technicalConfig ??
      current.technicalConfig;

    const agriculturalConfig =
      parsed.agriculturalConfig ??
      current.agriculturalConfig;

    const weatherConfig =
      parsed.weatherConfig ??
      current.weatherConfig;

    const policyConfig =
      parsed.policyConfig ??
      current.policyConfig;

    const economicConfig =
      parsed.economicConfig ??
      current.economicConfig;

    const metadata =
      parsed.metadata ??
      current.metadata;

    const snapshot =
      createScenarioConfigurationSnapshot({
        technicalConfig,
        agriculturalConfig,
        weatherConfig,
        policyConfig,
        economicConfig,
        metadata,
      });

    const { supabase } =
      await this.createAuthenticatedClient();

    const { data, error } = await supabase
      .from("scenarios")
      .update({
        ...(parsed.name !== undefined
          ? { name: parsed.name }
          : {}),

        ...(parsed.description !==
        undefined
          ? {
              description:
                parsed.description,
            }
          : {}),

        ...(parsed.scenarioType !==
        undefined
          ? {
              scenario_type:
                parsed.scenarioType,
            }
          : {}),

        ...(parsed.status !== undefined
          ? {
              status: parsed.status,
            }
          : {}),

        ...(parsed.isBaseline !==
        undefined
          ? {
              is_baseline:
                parsed.isBaseline,
            }
          : {}),

        ...(parsed.parentScenarioId !==
        undefined
          ? {
              parent_scenario_id:
                parsed.parentScenarioId,
            }
          : {}),

        configuration:
          asJson(snapshot),

        technical_config:
          asJson(technicalConfig),

        agricultural_config:
          asJson(agriculturalConfig),

        weather_config:
          asJson(weatherConfig),

        policy_config:
          asJson(policyConfig),

        economic_config:
          asJson(economicConfig),

        metadata:
          asJson(metadata),

        scenario_version:
          current.scenarioVersion + 1,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Unable to update scenario: ${error.message}`,
      );
    }

    return mapScenarioRow(
      data as ScenarioDatabaseRow,
    );
  }

  async duplicateScenario(
    scenarioId: string,
    name?: string,
  ): Promise<Scenario> {
    const id = ensureId(
      scenarioId,
      "Scenario ID",
    );

    const source =
      await this.getScenario(id);

    if (!source) {
      throw new Error(
        "Scenario was not found.",
      );
    }

    const duplicateName =
      name?.trim() ||
      `${source.name} — Alternative`;

    return this.createScenario({
      projectId:
        source.projectId,

      siteId:
        source.siteId,

      name:
        duplicateName,

      description:
        source.description,

      scenarioType:
        source.scenarioType,

      status:
        "draft",

      isBaseline:
        false,

      parentScenarioId:
        source.id,

      technicalConfig:
        source.technicalConfig,

      agriculturalConfig:
        source.agriculturalConfig,

      weatherConfig:
        source.weatherConfig,

      policyConfig:
        source.policyConfig,

      economicConfig:
        source.economicConfig,

      metadata: {
        ...source.metadata,

        provenance: {
          ...(
            source.metadata.provenance ??
            {}
          ),

          duplicatedFromScenarioId:
            source.id,

          duplicatedFromVersion:
            source.scenarioVersion,
        },
      },
    });
  }

  async archiveScenario(
    scenarioId: string,
  ): Promise<Scenario> {
    const id = ensureId(
      scenarioId,
      "Scenario ID",
    );

    const current =
      await this.getScenario(id);

    if (!current) {
      throw new Error(
        "Scenario was not found.",
      );
    }

    if (
      current.status === "archived"
    ) {
      return current;
    }

    const { supabase } =
      await this.createAuthenticatedClient();

    const { data, error } = await supabase
      .from("scenarios")
      .update({
        status: "archived",

        scenario_version:
          current.scenarioVersion + 1,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Unable to archive scenario: ${error.message}`,
      );
    }

    return mapScenarioRow(
      data as ScenarioDatabaseRow,
    );
  }
}
