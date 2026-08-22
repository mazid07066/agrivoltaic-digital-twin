-- =========================================================
-- AgriTwin Phase 9E
-- Electrical Balance-of-System persistence
-- =========================================================
--
-- Backward-compatible additive migration.
--
-- Historical simulation runs remain valid because all new
-- run-level columns are nullable and hourly electrical data
-- defaults to an empty JSON object.
-- =========================================================

alter table public.simulation_runs
  add column if not exists electrical_summary jsonb,
  add column if not exists electrical_provenance jsonb,
  add column if not exists electrical_operating_mode text;

alter table public.simulation_runs
  drop constraint if exists simulation_runs_electrical_operating_mode_check;

alter table public.simulation_runs
  add constraint simulation_runs_electrical_operating_mode_check
  check (
    electrical_operating_mode is null
    or electrical_operating_mode in (
      'grid_connected',
      'islanded'
    )
  );

alter table public.simulation_hourly_results
  add column if not exists electrical_values jsonb
    not null default '{}'::jsonb;

comment on column public.simulation_runs.electrical_summary is
  'Phase 9E optional electrical simulation summary including inverter and AC distribution energy statistics.';

comment on column public.simulation_runs.electrical_provenance is
  'Phase 9E electrical modelling provenance including inverter specification, efficiency interpretation, DC voltage assumption, MPPT allocation and load assumptions.';

comment on column public.simulation_runs.electrical_operating_mode is
  'Phase 9E electrical operating mode: grid_connected or islanded.';

comment on column public.simulation_hourly_results.electrical_values is
  'Phase 9E optional hourly inverter, MPPT/string, AC and distribution result payload.';
