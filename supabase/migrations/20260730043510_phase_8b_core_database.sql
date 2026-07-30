-- AgriTwin Phase 8B-1
-- Core project, site-version and simulation preservation schema.

create extension if not exists pgcrypto;

-- =========================================================
-- Utility functions
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- User profiles
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  institution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- =========================================================
-- Projects
-- =========================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 200),
  description text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  schema_version integer not null default 1
    check (schema_version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index projects_owner_id_idx
  on public.projects(owner_id);

create index projects_owner_status_idx
  on public.projects(owner_id, status);

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

-- =========================================================
-- Project members
-- =========================================================

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer'
    check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index project_members_user_id_idx
  on public.project_members(user_id);

-- =========================================================
-- Sites
-- =========================================================

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  site_type text not null
    check (
      site_type in (
        'land_agrivoltaic',
        'flat_roof',
        'pitched_roof',
        'industrial_shed',
        'greenhouse',
        'carport',
        'facade'
      )
    ),
  data_mode text not null default 'virtual'
    check (data_mode in ('virtual', 'connected', 'hybrid')),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  active_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index sites_project_id_idx
  on public.sites(project_id);

create index sites_project_status_idx
  on public.sites(project_id, status);

create trigger sites_set_updated_at
before update on public.sites
for each row
execute function public.set_updated_at();

-- =========================================================
-- Immutable site versions
-- =========================================================

create table public.site_versions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  schema_version integer not null check (schema_version >= 1),
  configuration jsonb not null,
  configuration_hash text,
  change_summary text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (site_id, version_number)
);

create index site_versions_site_id_idx
  on public.site_versions(site_id);

create index site_versions_site_created_idx
  on public.site_versions(site_id, created_at desc);

alter table public.sites
  add constraint sites_active_version_fk
  foreign key (active_version_id)
  references public.site_versions(id)
  on delete set null;

-- =========================================================
-- Scenarios
-- =========================================================

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  description text,
  configuration jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scenarios_site_id_idx
  on public.scenarios(site_id);

create trigger scenarios_set_updated_at
before update on public.scenarios
for each row
execute function public.set_updated_at();

-- =========================================================
-- Immutable simulation runs
-- =========================================================

create table public.simulation_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  site_version_id uuid not null references public.site_versions(id) on delete restrict,
  scenario_id uuid references public.scenarios(id) on delete set null,

  status text not null default 'queued'
    check (
      status in (
        'queued',
        'running',
        'completed',
        'failed',
        'cancelled'
      )
    ),

  simulation_date date not null,
  engine_version text not null,
  controller_version text,
  site_schema_version integer not null,
  module_catalogue_version text,
  weather_adapter_version text,

  input_snapshot jsonb not null,
  weather_snapshot jsonb,
  result_summary jsonb,
  warnings jsonb not null default '[]'::jsonb,
  error_message text,

  requested_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index simulation_runs_project_id_idx
  on public.simulation_runs(project_id);

create index simulation_runs_site_id_idx
  on public.simulation_runs(site_id);

create index simulation_runs_site_created_idx
  on public.simulation_runs(site_id, created_at desc);

create index simulation_runs_status_idx
  on public.simulation_runs(status);

-- =========================================================
-- Hourly simulation results
-- =========================================================

create table public.simulation_hourly_results (
  id bigint generated always as identity primary key,
  simulation_run_id uuid not null
    references public.simulation_runs(id) on delete cascade,

  hour_index smallint not null check (hour_index between 0 and 23),
  timestamp_utc timestamptz not null,

  solar_altitude_deg double precision,
  solar_azimuth_deg double precision,
  ghi_wm2 double precision,
  poa_wm2 double precision,
  module_temperature_c double precision,
  pv_power_kw double precision,
  tracker_angle_deg double precision,
  tracking_state text,

  open_field_dli_increment_mol_m2 double precision,
  crop_dli_increment_mol_m2 double precision,

  additional_values jsonb not null default '{}'::jsonb,

  unique (simulation_run_id, hour_index)
);

create index simulation_hourly_results_run_idx
  on public.simulation_hourly_results(simulation_run_id);

create index simulation_hourly_results_timestamp_idx
  on public.simulation_hourly_results(timestamp_utc);

-- =========================================================
-- Spatial simulation results
-- =========================================================

create table public.simulation_spatial_results (
  id uuid primary key default gen_random_uuid(),
  simulation_run_id uuid not null
    references public.simulation_runs(id) on delete cascade,

  result_kind text not null
    check (
      result_kind in (
        'daily_dli_grid',
        'hourly_shadow_grid',
        'protected_zone_statistics',
        'other'
      )
    ),

  hour_index smallint check (hour_index between 0 and 23),
  grid_definition jsonb not null,
  values_data jsonb not null,
  statistics jsonb,
  created_at timestamptz not null default now()
);

create index simulation_spatial_results_run_idx
  on public.simulation_spatial_results(simulation_run_id);

-- =========================================================
-- Model and catalogue versions
-- =========================================================

create table public.model_versions (
  id uuid primary key default gen_random_uuid(),
  model_type text not null,
  version text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (model_type, version)
);

-- =========================================================
-- Audit trail
-- =========================================================

create table public.audit_events (
  id bigint generated always as identity primary key,
  project_id uuid references public.projects(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_project_created_idx
  on public.audit_events(project_id, created_at desc);

create index audit_events_site_created_idx
  on public.audit_events(site_id, created_at desc);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.sites enable row level security;
alter table public.site_versions enable row level security;
alter table public.scenarios enable row level security;
alter table public.simulation_runs enable row level security;
alter table public.simulation_hourly_results enable row level security;
alter table public.simulation_spatial_results enable row level security;
alter table public.model_versions enable row level security;
alter table public.audit_events enable row level security;

-- Profiles

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Project helper rule:
-- A user may access a project when they own it or are listed as a member.

create policy "Project owners and members can read projects"
on public.projects
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = projects.id
      and pm.user_id = (select auth.uid())
  )
);

create policy "Authenticated users can create owned projects"
on public.projects
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Project owners can update projects"
on public.projects
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Project owners can delete projects"
on public.projects
for delete
to authenticated
using (owner_id = (select auth.uid()));

-- Project members

create policy "Project members can view membership"
on public.project_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = (select auth.uid())
  )
);

create policy "Project owners can manage members"
on public.project_members
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = (select auth.uid())
  )
);

-- Sites

create policy "Project participants can read sites"
on public.sites
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = sites.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.user_id is not null
      )
  )
);

create policy "Project owners and editors can create sites"
on public.sites
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = sites.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
);

create policy "Project owners and editors can update sites"
on public.sites
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = sites.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
)
with check (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = sites.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
);

-- Site versions

create policy "Project participants can read site versions"
on public.site_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.sites s
    join public.projects p on p.id = s.project_id
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where s.id = site_versions.site_id
      and (
        p.owner_id = (select auth.uid())
        or pm.user_id is not null
      )
  )
);

create policy "Project owners and editors can create site versions"
on public.site_versions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sites s
    join public.projects p on p.id = s.project_id
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where s.id = site_versions.site_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
);

-- Scenarios

create policy "Project participants can read scenarios"
on public.scenarios
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = scenarios.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.user_id is not null
      )
  )
);

create policy "Project owners and editors can manage scenarios"
on public.scenarios
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = scenarios.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
)
with check (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = scenarios.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
);

-- Simulation runs

create policy "Project participants can read simulation runs"
on public.simulation_runs
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = simulation_runs.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.user_id is not null
      )
  )
);

create policy "Project owners and editors can create simulation runs"
on public.simulation_runs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = simulation_runs.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
);

create policy "Project owners and editors can update simulation run status"
on public.simulation_runs
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = simulation_runs.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
)
with check (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = simulation_runs.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
);

-- Hourly results

create policy "Project participants can read hourly results"
on public.simulation_hourly_results
for select
to authenticated
using (
  exists (
    select 1
    from public.simulation_runs sr
    join public.projects p on p.id = sr.project_id
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where sr.id = simulation_hourly_results.simulation_run_id
      and (
        p.owner_id = (select auth.uid())
        or pm.user_id is not null
      )
  )
);

create policy "Project owners and editors can create hourly results"
on public.simulation_hourly_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.simulation_runs sr
    join public.projects p on p.id = sr.project_id
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where sr.id = simulation_hourly_results.simulation_run_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
);

-- Spatial results

create policy "Project participants can read spatial results"
on public.simulation_spatial_results
for select
to authenticated
using (
  exists (
    select 1
    from public.simulation_runs sr
    join public.projects p on p.id = sr.project_id
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where sr.id = simulation_spatial_results.simulation_run_id
      and (
        p.owner_id = (select auth.uid())
        or pm.user_id is not null
      )
  )
);

create policy "Project owners and editors can create spatial results"
on public.simulation_spatial_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.simulation_runs sr
    join public.projects p on p.id = sr.project_id
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where sr.id = simulation_spatial_results.simulation_run_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
);

-- Model versions are readable by signed-in users.
-- Writes should be performed by trusted server-side service-role code.

create policy "Authenticated users can read model versions"
on public.model_versions
for select
to authenticated
using (true);

-- Audit events

create policy "Project participants can read audit events"
on public.audit_events
for select
to authenticated
using (
  project_id is not null
  and exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = audit_events.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.user_id is not null
      )
  )
);

create policy "Project participants can create audit events"
on public.audit_events
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and project_id is not null
  and exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = audit_events.project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  )
);

-- =========================================================
-- Initial model-version records
-- =========================================================

insert into public.model_versions (
  model_type,
  version,
  description,
  metadata
)
values
  (
    'simulation_engine',
    '0.8b',
    'AgriTwin Phase 8B database foundation using the preserved Phase 7B-PV land engine.',
    '{"land_engine":"phase-7b-pv"}'::jsonb
  ),
  (
    'adaptive_controller',
    'phase-7b',
    'Protected beneath-panel DLI iterative adaptive tracking controller.',
    '{}'::jsonb
  ),
  (
    'site_schema',
    '1',
    'Versioned AgriTwin SiteProfile schema.',
    '{}'::jsonb
  )
on conflict (model_type, version) do nothing;
