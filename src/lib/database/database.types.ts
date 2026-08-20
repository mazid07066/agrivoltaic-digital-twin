export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          event_type: string
          id: number
          project_id: string | null
          site_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: never
          project_id?: string | null
          site_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: never
          project_id?: string | null
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      client_migration_receipts: {
        Row: {
          created_at: string
          id: string
          migration_key: string
          project_id: string
          site_id: string
          site_version_id: string
          source_client_site_id: string | null
          source_schema_version: number
          source_site_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          migration_key: string
          project_id: string
          site_id: string
          site_version_id: string
          source_client_site_id?: string | null
          source_schema_version: number
          source_site_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          migration_key?: string
          project_id?: string
          site_id?: string
          site_version_id?: string
          source_client_site_id?: string | null
          source_schema_version?: number
          source_site_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_migration_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_migration_receipts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_migration_receipts_site_version_id_fkey"
            columns: ["site_version_id"]
            isOneToOne: false
            referencedRelation: "site_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      model_versions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json
          model_type: string
          version: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          model_type: string
          version: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          model_type?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          institution: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          institution?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          institution?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          schema_version: number
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          schema_version?: number
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          schema_version?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          agricultural_config: Json
          archived_at: string | null
          configuration: Json
          created_at: string
          created_by: string | null
          description: string | null
          economic_config: Json
          id: string
          is_baseline: boolean
          metadata: Json
          name: string
          parent_scenario_id: string | null
          policy_config: Json
          project_id: string
          scenario_type: string
          scenario_version: number
          site_id: string
          status: string
          technical_config: Json
          updated_at: string
          weather_config: Json
        }
        Insert: {
          agricultural_config?: Json
          archived_at?: string | null
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          economic_config?: Json
          id?: string
          is_baseline?: boolean
          metadata?: Json
          name: string
          parent_scenario_id?: string | null
          policy_config?: Json
          project_id: string
          scenario_type?: string
          scenario_version?: number
          site_id: string
          status?: string
          technical_config?: Json
          updated_at?: string
          weather_config?: Json
        }
        Update: {
          agricultural_config?: Json
          archived_at?: string | null
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          economic_config?: Json
          id?: string
          is_baseline?: boolean
          metadata?: Json
          name?: string
          parent_scenario_id?: string | null
          policy_config?: Json
          project_id?: string
          scenario_type?: string
          scenario_version?: number
          site_id?: string
          status?: string
          technical_config?: Json
          updated_at?: string
          weather_config?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_parent_scenario_id_fkey"
            columns: ["parent_scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_hourly_results: {
        Row: {
          additional_values: Json
          crop_dli_increment_mol_m2: number | null
          ghi_wm2: number | null
          hour_index: number
          id: number
          module_temperature_c: number | null
          open_field_dli_increment_mol_m2: number | null
          poa_wm2: number | null
          pv_power_kw: number | null
          simulation_run_id: string
          solar_altitude_deg: number | null
          solar_azimuth_deg: number | null
          timestamp_utc: string
          tracker_angle_deg: number | null
          tracking_state: string | null
        }
        Insert: {
          additional_values?: Json
          crop_dli_increment_mol_m2?: number | null
          ghi_wm2?: number | null
          hour_index: number
          id?: never
          module_temperature_c?: number | null
          open_field_dli_increment_mol_m2?: number | null
          poa_wm2?: number | null
          pv_power_kw?: number | null
          simulation_run_id: string
          solar_altitude_deg?: number | null
          solar_azimuth_deg?: number | null
          timestamp_utc: string
          tracker_angle_deg?: number | null
          tracking_state?: string | null
        }
        Update: {
          additional_values?: Json
          crop_dli_increment_mol_m2?: number | null
          ghi_wm2?: number | null
          hour_index?: number
          id?: never
          module_temperature_c?: number | null
          open_field_dli_increment_mol_m2?: number | null
          poa_wm2?: number | null
          pv_power_kw?: number | null
          simulation_run_id?: string
          solar_altitude_deg?: number | null
          solar_azimuth_deg?: number | null
          timestamp_utc?: string
          tracker_angle_deg?: number | null
          tracking_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_hourly_results_simulation_run_id_fkey"
            columns: ["simulation_run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_runs: {
        Row: {
          completed_at: string | null
          controller_version: string | null
          created_at: string
          engine_version: string
          error_message: string | null
          id: string
          input_snapshot: Json
          module_catalogue_version: string | null
          project_id: string
          requested_by: string | null
          result_summary: Json | null
          scenario_id: string | null
          simulation_date: string
          site_id: string
          site_schema_version: number
          site_version_id: string
          started_at: string | null
          status: string
          warnings: Json
          weather_adapter_version: string | null
          weather_snapshot: Json | null
        }
        Insert: {
          completed_at?: string | null
          controller_version?: string | null
          created_at?: string
          engine_version: string
          error_message?: string | null
          id?: string
          input_snapshot: Json
          module_catalogue_version?: string | null
          project_id: string
          requested_by?: string | null
          result_summary?: Json | null
          scenario_id?: string | null
          simulation_date: string
          site_id: string
          site_schema_version: number
          site_version_id: string
          started_at?: string | null
          status?: string
          warnings?: Json
          weather_adapter_version?: string | null
          weather_snapshot?: Json | null
        }
        Update: {
          completed_at?: string | null
          controller_version?: string | null
          created_at?: string
          engine_version?: string
          error_message?: string | null
          id?: string
          input_snapshot?: Json
          module_catalogue_version?: string | null
          project_id?: string
          requested_by?: string | null
          result_summary?: Json | null
          scenario_id?: string | null
          simulation_date?: string
          site_id?: string
          site_schema_version?: number
          site_version_id?: string
          started_at?: string | null
          status?: string
          warnings?: Json
          weather_adapter_version?: string | null
          weather_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_runs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_runs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_runs_site_version_id_fkey"
            columns: ["site_version_id"]
            isOneToOne: false
            referencedRelation: "site_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_spatial_results: {
        Row: {
          created_at: string
          grid_definition: Json
          hour_index: number | null
          id: string
          result_kind: string
          simulation_run_id: string
          statistics: Json | null
          values_data: Json
        }
        Insert: {
          created_at?: string
          grid_definition: Json
          hour_index?: number | null
          id?: string
          result_kind: string
          simulation_run_id: string
          statistics?: Json | null
          values_data: Json
        }
        Update: {
          created_at?: string
          grid_definition?: Json
          hour_index?: number | null
          id?: string
          result_kind?: string
          simulation_run_id?: string
          statistics?: Json | null
          values_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "simulation_spatial_results_simulation_run_id_fkey"
            columns: ["simulation_run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      site_versions: {
        Row: {
          change_summary: string | null
          configuration: Json
          configuration_hash: string | null
          created_at: string
          created_by: string | null
          id: string
          schema_version: number
          site_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          configuration: Json
          configuration_hash?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          schema_version: number
          site_id: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          configuration?: Json
          configuration_hash?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          schema_version?: number
          site_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "site_versions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          active_version_id: string | null
          archived_at: string | null
          client_reference: string | null
          created_at: string
          data_mode: string
          id: string
          name: string
          project_id: string
          site_type: string
          status: string
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          archived_at?: string | null
          client_reference?: string | null
          created_at?: string
          data_mode?: string
          id?: string
          name: string
          project_id: string
          site_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          archived_at?: string | null
          client_reference?: string | null
          created_at?: string
          data_mode?: string
          id?: string
          name?: string
          project_id?: string
          site_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_active_version_fk"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "site_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workspace_preferences: {
        Row: {
          active_project_id: string | null
          active_site_id: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_project_id?: string | null
          active_site_id?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_project_id?: string | null
          active_site_id?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_workspace_preferences_active_project_id_fkey"
            columns: ["active_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workspace_preferences_active_site_id_fkey"
            columns: ["active_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_site: { Args: { p_site_id: string }; Returns: Json }
      bootstrap_first_agritwin_project: {
        Args: {
          p_migration_key: string
          p_project_name: string
          p_site_profile: Json
        }
        Returns: {
          already_migrated: boolean
          project_id: string
          site_id: string
          site_version_id: string
        }[]
      }
      can_edit_project: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      create_flat_roof_site: {
        Args: { p_name: string; p_project_id: string; p_source_profile: Json }
        Returns: Json
      }
      create_land_site: {
        Args: { p_name: string; p_project_id: string; p_source_profile: Json }
        Returns: Json
      }
      duplicate_site: {
        Args: { p_name: string; p_site_id: string }
        Returns: Json
      }
      is_project_member: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      is_project_owner: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      list_site_versions: {
        Args: { p_site_id: string }
        Returns: {
          change_summary: string
          configuration_hash: string
          created_at: string
          created_by: string
          creator_display_name: string
          is_active: boolean
          schema_version: number
          site_id: string
          version_id: string
          version_number: number
        }[]
      }
      make_site_operation_result: {
        Args: {
          p_project_id: string
          p_site_id: string
          p_site_version_id: string
        }
        Returns: Json
      }
      make_site_version_operation_result: {
        Args: {
          p_project_id: string
          p_site_id: string
          p_site_version_id: string
        }
        Returns: Json
      }
      rename_site: {
        Args: { p_name: string; p_site_id: string }
        Returns: Json
      }
      restore_site: { Args: { p_site_id: string }; Returns: Json }
      restore_site_version: {
        Args: {
          p_change_summary: string
          p_expected_active_version_id: string
          p_site_id: string
          p_source_version_id: string
        }
        Returns: Json
      }
      save_site_version: {
        Args: {
          p_change_summary: string
          p_configuration: Json
          p_expected_active_version_id: string
          p_schema_version: number
          p_site_id: string
        }
        Returns: Json
      }
      set_active_workspace: {
        Args: { p_project_id: string; p_site_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
