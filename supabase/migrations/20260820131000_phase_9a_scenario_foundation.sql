-- ============================================================
-- AgriTwin Phase 9A
-- Policy-Test-Bench Scenario Foundation
--
-- Extends the existing Phase 8B scenarios architecture.
--
-- IMPORTANT:
-- - Existing scenarios are preserved.
-- - Existing configuration JSONB is preserved.
-- - Existing simulation_runs -> scenario_id relationships remain.
-- - Existing site/roof/simulation models are not modified.
-- ============================================================


-- ============================================================
-- 1. Extend existing scenarios table
-- ============================================================

alter table public.scenarios
  add column if not exists scenario_type text
    not null default 'agrivoltaic',

  add column if not exists is_baseline boolean
    not null default false,

  add column if not exists parent_scenario_id uuid,

  add column if not exists scenario_version integer
    not null default 1,

  add column if not exists technical_config jsonb
    not null default '{}'::jsonb,

  add column if not exists agricultural_config jsonb
    not null default '{}'::jsonb,

  add column if not exists weather_config jsonb
    not null default '{}'::jsonb,

  add column if not exists policy_config jsonb
    not null default '{}'::jsonb,

  add column if not exists economic_config jsonb
    not null default '{}'::jsonb,

  add column if not exists metadata jsonb
    not null default '{}'::jsonb,

  add column if not exists archived_at timestamptz;


-- ============================================================
-- 2. Parent scenario relationship
-- ============================================================

alter table public.scenarios
  drop constraint if exists scenarios_parent_scenario_id_fkey;

alter table public.scenarios
  add constraint scenarios_parent_scenario_id_fkey
  foreign key (parent_scenario_id)
  references public.scenarios(id)
  on delete set null;


-- ============================================================
-- 3. Scenario-version validation
-- ============================================================

alter table public.scenarios
  drop constraint if exists scenarios_version_check;

alter table public.scenarios
  add constraint scenarios_version_check
  check (scenario_version >= 1);


-- ============================================================
-- 4. Scenario type validation
-- ============================================================

alter table public.scenarios
  drop constraint if exists scenarios_type_check;

alter table public.scenarios
  add constraint scenarios_type_check
  check (length(trim(scenario_type)) >= 1);


-- ============================================================
-- 5. Prevent scenario from parenting itself
-- ============================================================

alter table public.scenarios
  drop constraint if exists scenarios_not_own_parent;

alter table public.scenarios
  add constraint scenarios_not_own_parent
  check (
    parent_scenario_id is null
    or parent_scenario_id <> id
  );


-- ============================================================
-- 6. Expand existing status model
--
-- Existing Phase 8B values:
--   active
--   archived
--
-- Phase 9A adds:
--   draft
--   ready
--
-- Existing records remain fully valid.
-- ============================================================

alter table public.scenarios
  drop constraint if exists scenarios_status_check;

alter table public.scenarios
  add constraint scenarios_status_check
  check (
    status in (
      'draft',
      'ready',
      'active',
      'archived'
    )
  );


-- Keep the existing default ('active') for backwards compatibility.
-- Phase 9A application code will explicitly create new policy scenarios
-- as 'draft'.


-- ============================================================
-- 7. Populate archive metadata for existing archived scenarios
-- ============================================================

update public.scenarios
set archived_at = coalesce(archived_at, updated_at, created_at, now())
where status = 'archived'
  and archived_at is null;


-- ============================================================
-- 8. Indexes for scenario and policy analysis
-- ============================================================

create index if not exists scenarios_project_id_idx
  on public.scenarios(project_id);

create index if not exists scenarios_parent_id_idx
  on public.scenarios(parent_scenario_id);

create index if not exists scenarios_project_status_idx
  on public.scenarios(project_id, status);

create index if not exists scenarios_project_site_idx
  on public.scenarios(project_id, site_id);

create index if not exists scenarios_created_by_idx
  on public.scenarios(created_by);

create index if not exists scenarios_baseline_idx
  on public.scenarios(project_id, is_baseline)
  where is_baseline = true;


-- ============================================================
-- 9. Relationship and archival consistency
--
-- A scenario's site must belong to its project.
-- A derived scenario's parent must belong to the same project.
-- ============================================================

create or replace function public.validate_scenario_relationships()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_site_project_id uuid;
  parent_project_id uuid;
begin

  -- ----------------------------------------------------------
  -- Verify site/project consistency
  -- ----------------------------------------------------------

  select s.project_id
    into target_site_project_id
  from public.sites s
  where s.id = new.site_id;

  if target_site_project_id is null then
    raise exception
      'Scenario site does not exist.';
  end if;

  if target_site_project_id <> new.project_id then
    raise exception
      'Scenario site must belong to the selected project.';
  end if;


  -- ----------------------------------------------------------
  -- Verify parent scenario/project consistency
  -- ----------------------------------------------------------

  if new.parent_scenario_id is not null then

    select sc.project_id
      into parent_project_id
    from public.scenarios sc
    where sc.id = new.parent_scenario_id;

    if parent_project_id is null then
      raise exception
        'Parent scenario does not exist.';
    end if;

    if parent_project_id <> new.project_id then
      raise exception
        'Parent scenario must belong to the same project.';
    end if;

  end if;


  -- ----------------------------------------------------------
  -- Archive timestamp consistency
  -- ----------------------------------------------------------

  if new.status = 'archived' then

    if new.archived_at is null then
      new.archived_at := now();
    end if;

  else
    new.archived_at := null;
  end if;


  return new;
end;
$$;


drop trigger if exists scenarios_validate_relationships
  on public.scenarios;

create trigger scenarios_validate_relationships
before insert or update on public.scenarios
for each row
execute function public.validate_scenario_relationships();


-- ============================================================
-- 10. RLS
--
-- RLS already exists from Phase 8B.
-- Existing SELECT / INSERT / UPDATE policies are preserved.
--
-- For policy/research provenance, Phase 9A removes permanent
-- scenario deletion. Scenarios should instead be archived.
-- ============================================================

alter table public.scenarios
enable row level security;


-- Current database has this granular DELETE policy.
drop policy if exists
  "Project editors can delete scenarios"
  on public.scenarios;


-- Older Phase 8B installations may still contain the original
-- combined FOR ALL policy. Do not drop it here because some
-- databases have already migrated to granular policies.
--
-- Current linked database has granular scenario policies.


-- ============================================================
-- 11. Ensure authenticated API privileges
-- ============================================================

grant select, insert, update
on table public.scenarios
to authenticated;


-- ============================================================
-- 12. Documentation
-- ============================================================

comment on table public.scenarios is
'AgriTwin scenario definitions for reproducible digital-twin simulation, analytics, MCDA and policy-test-bench studies.';

comment on column public.scenarios.configuration is
'Existing general scenario configuration retained for backwards compatibility and full configuration snapshots.';

comment on column public.scenarios.scenario_type is
'Scenario classification such as agrivoltaic, agriculture_baseline or pv_baseline.';

comment on column public.scenarios.is_baseline is
'Marks a scenario as a baseline for technical, agricultural, economic or policy comparison.';

comment on column public.scenarios.parent_scenario_id is
'Optional parent scenario used to derive alternative designs and policy experiments.';

comment on column public.scenarios.scenario_version is
'Logical scenario definition version used for reproducibility and provenance.';

comment on column public.scenarios.technical_config is
'PV module, array geometry, tracker, orientation and other technical assumptions.';

comment on column public.scenarios.agricultural_config is
'Crop, season, DLI target, yield-response and agricultural assumptions.';

comment on column public.scenarios.weather_config is
'Weather source, period, dataset and environmental-data assumptions.';

comment on column public.scenarios.policy_config is
'Policy constraints, thresholds, incentives and regulatory assumptions.';

comment on column public.scenarios.economic_config is
'CAPEX, OPEX, tariff, crop-price and other future economic assumptions.';

comment on column public.scenarios.metadata is
'Extensible provenance and research metadata for the scenario.';

comment on column public.scenarios.archived_at is
'Timestamp at which the scenario entered archived status.';
