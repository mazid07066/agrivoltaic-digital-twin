-- AgriTwin Phase 9H–9L physics, loss and validation persistence.
-- Additive and nullable so historical Phase 7B/9 runs remain readable.

alter table public.simulation_runs
  add column if not exists simulation_model_mode text,
  add column if not exists physics_model_version text,
  add column if not exists explicit_loss_summary jsonb,
  add column if not exists energy_balance_summary jsonb,
  add column if not exists parameter_source_manifest jsonb;

alter table public.simulation_runs
  drop constraint if exists simulation_runs_model_mode_check;

alter table public.simulation_runs
  add constraint simulation_runs_model_mode_check
  check (
    simulation_model_mode is null
    or simulation_model_mode in (
      'legacy_parity',
      'physics_research',
      'reference_validation'
    )
  );

alter table public.simulation_hourly_results
  add column if not exists physics_values jsonb
    not null default '{}'::jsonb;

comment on column public.simulation_runs.simulation_model_mode is
  'Phase 9H execution boundary: legacy_parity, physics_research or reference_validation.';
comment on column public.simulation_runs.explicit_loss_summary is
  'Named optical, DC, MPPT, inverter and AC energy losses; inverter conversion is never duplicated in aggregate efficiency.';
comment on column public.simulation_runs.energy_balance_summary is
  'Numerical conservation audit and tolerance summary for physics-mode execution.';
comment on column public.simulation_runs.parameter_source_manifest is
  'Manufacturer, measured, standard/reference, user-assumption, calibrated and estimated parameter classifications.';
comment on column public.simulation_hourly_results.physics_values is
  'Phase 9H–9L hourly solar, tracker, POA, IAM, shading, thermal, module, string, MPPT, inverter, loss and balance diagnostics.';
