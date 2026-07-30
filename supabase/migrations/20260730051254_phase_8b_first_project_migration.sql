-- AgriTwin Phase 8B-2A
-- First-project bootstrap, legacy client reference and migration receipt.

-- =========================================================
-- Preserve the original browser/local-storage site ID
-- =========================================================

alter table public.sites
  add column if not exists client_reference text;

create unique index if not exists sites_project_client_reference_uidx
  on public.sites(project_id, client_reference)
  where client_reference is not null;

-- =========================================================
-- One-time client migration receipts
-- =========================================================

create table if not exists public.client_migration_receipts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  migration_key text not null
    check (char_length(trim(migration_key)) between 1 and 300),

  project_id uuid not null
    references public.projects(id)
    on delete cascade,

  site_id uuid not null
    references public.sites(id)
    on delete cascade,

  site_version_id uuid not null
    references public.site_versions(id)
    on delete cascade,

  source_schema_version integer not null
    check (source_schema_version >= 1),

  source_site_type text not null,

  source_client_site_id text,

  created_at timestamptz not null default now(),

  unique (user_id, migration_key)
);

create index if not exists client_migration_receipts_user_idx
  on public.client_migration_receipts(user_id);

create index if not exists client_migration_receipts_project_idx
  on public.client_migration_receipts(project_id);

alter table public.client_migration_receipts
  enable row level security;

create policy "Users can read their own migration receipts"
on public.client_migration_receipts
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Inserts are intentionally performed only through the trusted
-- bootstrap function below. No direct authenticated insert policy
-- is provided.

-- =========================================================
-- Atomic first-project bootstrap
-- =========================================================

create or replace function public.bootstrap_first_agritwin_project(
  p_migration_key text,
  p_project_name text,
  p_site_profile jsonb
)
returns table (
  project_id uuid,
  site_id uuid,
  site_version_id uuid,
  already_migrated boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  existing_receipt public.client_migration_receipts%rowtype;

  created_project_id uuid;
  created_site_id uuid;
  created_site_version_id uuid;

  cleaned_project_name text;
  source_site_name text;
  source_site_type text;
  source_data_mode text;
  source_client_site_id text;
  source_schema_version integer;
  configuration_hash text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_migration_key is null
     or char_length(trim(p_migration_key)) = 0 then
    raise exception 'Migration key is required.';
  end if;

  if p_site_profile is null
     or jsonb_typeof(p_site_profile) <> 'object' then
    raise exception 'A valid site profile object is required.';
  end if;

  source_site_type :=
    nullif(trim(p_site_profile ->> 'siteType'), '');

  source_data_mode :=
    nullif(trim(p_site_profile ->> 'dataMode'), '');

  source_site_name :=
    nullif(trim(p_site_profile ->> 'name'), '');

  source_client_site_id :=
    nullif(trim(p_site_profile ->> 'id'), '');

  source_schema_version :=
    coalesce(
      nullif(p_site_profile ->> 'schemaVersion', '')::integer,
      1
    );

  if source_site_type <> 'land_agrivoltaic' then
    raise exception
      'Phase 8B-2A only migrates land_agrivoltaic sites.';
  end if;

  if source_data_mode not in (
    'virtual',
    'connected',
    'hybrid'
  ) then
    raise exception 'Unsupported site data mode.';
  end if;

  if source_site_name is null then
    raise exception 'Site name is required.';
  end if;

  if source_schema_version <> 1 then
    raise exception
      'Unsupported SiteProfile schema version: %.',
      source_schema_version;
  end if;

  cleaned_project_name :=
    coalesce(
      nullif(trim(p_project_name), ''),
      'AgriTwin Project'
    );

  if char_length(cleaned_project_name) > 200 then
    raise exception 'Project name must not exceed 200 characters.';
  end if;

  /*
   * Serialise concurrent attempts by this user for the same
   * migration key. This prevents two rapid clicks from creating
   * duplicate projects.
   */
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      current_user_id::text || ':' || trim(p_migration_key),
      0
    )
  );

  select *
  into existing_receipt
  from public.client_migration_receipts cmr
  where cmr.user_id = current_user_id
    and cmr.migration_key = trim(p_migration_key)
  limit 1;

  if found then
    return query
    select
      existing_receipt.project_id,
      existing_receipt.site_id,
      existing_receipt.site_version_id,
      true;

    return;
  end if;

  insert into public.projects (
    owner_id,
    name,
    description,
    status,
    schema_version
  )
  values (
    current_user_id,
    cleaned_project_name,
    'Created by migrating the verified Phase 8A land site.',
    'active',
    1
  )
  returning id into created_project_id;

  insert into public.project_members (
    project_id,
    user_id,
    role
  )
  values (
    created_project_id,
    current_user_id,
    'owner'
  )
  on conflict (project_id, user_id)
  do update set role = 'owner';

  insert into public.sites (
    project_id,
    name,
    site_type,
    data_mode,
    status,
    client_reference
  )
  values (
    created_project_id,
    source_site_name,
    source_site_type,
    source_data_mode,
    'active',
    source_client_site_id
  )
  returning id into created_site_id;

  configuration_hash :=
    encode(
      extensions.digest(
        p_site_profile::text,
        'sha256'
      ),
      'hex'
    );

  insert into public.site_versions (
    site_id,
    version_number,
    schema_version,
    configuration,
    configuration_hash,
    change_summary,
    created_by
  )
  values (
    created_site_id,
    1,
    source_schema_version,
    p_site_profile,
    configuration_hash,
    'Initial immutable version migrated from Phase 8A local persistence.',
    current_user_id
  )
  returning id into created_site_version_id;

  update public.sites
  set
    active_version_id = created_site_version_id,
    updated_at = now()
  where id = created_site_id;

  insert into public.audit_events (
    project_id,
    site_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    details
  )
  values (
    created_project_id,
    created_site_id,
    current_user_id,
    'phase_8a_site_migrated',
    'site_version',
    created_site_version_id::text,
    jsonb_build_object(
      'migrationKey', trim(p_migration_key),
      'sourceClientSiteId', source_client_site_id,
      'sourceSchemaVersion', source_schema_version,
      'siteType', source_site_type,
      'dataMode', source_data_mode,
      'configurationHash', configuration_hash
    )
  );

  insert into public.client_migration_receipts (
    user_id,
    migration_key,
    project_id,
    site_id,
    site_version_id,
    source_schema_version,
    source_site_type,
    source_client_site_id
  )
  values (
    current_user_id,
    trim(p_migration_key),
    created_project_id,
    created_site_id,
    created_site_version_id,
    source_schema_version,
    source_site_type,
    source_client_site_id
  );

  return query
  select
    created_project_id,
    created_site_id,
    created_site_version_id,
    false;
end;
$$;

revoke all
on function public.bootstrap_first_agritwin_project(
  text,
  text,
  jsonb
)
from public;

grant execute
on function public.bootstrap_first_agritwin_project(
  text,
  text,
  jsonb
)
to authenticated;
