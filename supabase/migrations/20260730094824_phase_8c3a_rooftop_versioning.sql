-- AgriTwin Phase 8C-3A
-- Immutable site-version saving, history listing and restoration.
-- This migration does not alter rooftop geometry or simulation equations.

-- =========================================================
-- Rich version-operation result helper
-- =========================================================

create or replace function public.make_site_version_operation_result(
  p_project_id uuid,
  p_site_id uuid,
  p_site_version_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'projectId', p_project_id,
    'siteId', p_site_id,
    'siteVersionId', sv.id,
    'siteProfile', sv.configuration,
    'activeVersionId', sv.id,
    'activeVersionNumber', sv.version_number,
    'configurationHash', sv.configuration_hash,
    'changeSummary', sv.change_summary,
    'createdAt', sv.created_at
  )
  from public.site_versions sv
  where sv.id = p_site_version_id
    and sv.site_id = p_site_id;
$$;

revoke all
on function public.make_site_version_operation_result(
  uuid,
  uuid,
  uuid
)
from public;

grant execute
on function public.make_site_version_operation_result(
  uuid,
  uuid,
  uuid
)
to authenticated;

-- =========================================================
-- Save an immutable version
-- =========================================================

create or replace function public.save_site_version(
  p_site_id uuid,
  p_expected_active_version_id uuid,
  p_schema_version integer,
  p_configuration jsonb,
  p_change_summary text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_site public.sites%rowtype;
  cleaned_summary text := nullif(trim(p_change_summary), '');
  configuration_name text;
  configuration_site_type text;
  configuration_data_mode text;
  configuration_client_reference text;
  configuration_schema_version integer;
  configuration_hash text;
  active_configuration_hash text;
  next_version_number integer;
  created_version_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select s.*
  into target_site
  from public.sites s
  where s.id = p_site_id
  for update;

  if not found then
    raise exception 'The site was not found.';
  end if;

  if not public.can_edit_project(target_site.project_id) then
    raise exception 'Editor access is required.';
  end if;

  if target_site.status <> 'active' then
    raise exception 'Archived sites cannot be edited.';
  end if;

  if target_site.active_version_id is null then
    raise exception 'The site has no active version.';
  end if;

  if target_site.active_version_id
     is distinct from p_expected_active_version_id then
    raise exception
      'The active site version changed after this editor was opened. Reload the latest version before saving.';
  end if;

  if p_configuration is null
     or jsonb_typeof(p_configuration) <> 'object' then
    raise exception 'A complete SiteProfile configuration object is required.';
  end if;

  if p_schema_version is null
     or p_schema_version < 1 then
    raise exception 'Schema version must be at least 1.';
  end if;

  begin
    configuration_schema_version :=
      (p_configuration ->> 'schemaVersion')::integer;
  exception
    when invalid_text_representation then
      raise exception 'Configuration schemaVersion must be an integer.';
  end;

  if configuration_schema_version is distinct from p_schema_version then
    raise exception
      'The configuration schemaVersion does not match the supplied schema version.';
  end if;

  configuration_name :=
    nullif(trim(p_configuration ->> 'name'), '');

  if configuration_name is null
     or char_length(configuration_name) > 200 then
    raise exception
      'Configuration name must contain between 1 and 200 characters.';
  end if;

  configuration_site_type :=
    p_configuration ->> 'siteType';

  if configuration_site_type is distinct from target_site.site_type then
    raise exception
      'The configuration siteType does not match the database site type.';
  end if;

  configuration_data_mode :=
    p_configuration ->> 'dataMode';

  if configuration_data_mode not in (
    'virtual',
    'connected',
    'hybrid'
  ) then
    raise exception
      'Configuration dataMode must be virtual, connected or hybrid.';
  end if;

  configuration_client_reference :=
    p_configuration ->> 'id';

  if target_site.client_reference is null then
    raise exception
      'The database site has no client reference.';
  end if;

  if configuration_client_reference
     is distinct from target_site.client_reference then
    raise exception
      'The configuration ID does not match the site client reference.';
  end if;

  if cleaned_summary is null then
    raise exception 'A change summary is required.';
  end if;

  if char_length(cleaned_summary) > 500 then
    raise exception
      'The change summary must not exceed 500 characters.';
  end if;

  configuration_hash := encode(
    extensions.digest(
      p_configuration::text,
      'sha256'
    ),
    'hex'
  );

  select sv.configuration_hash
  into active_configuration_hash
  from public.site_versions sv
  where sv.id = target_site.active_version_id;

  if configuration_hash is not distinct from active_configuration_hash then
    raise exception
      'The configuration is unchanged. Modify the design before saving a new version.';
  end if;

  select coalesce(
    max(sv.version_number),
    0
  ) + 1
  into next_version_number
  from public.site_versions sv
  where sv.site_id = target_site.id;

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
    target_site.id,
    next_version_number,
    p_schema_version,
    p_configuration,
    configuration_hash,
    cleaned_summary,
    current_user_id
  )
  returning public.site_versions.id
  into created_version_id;

  update public.sites
  set
    active_version_id = created_version_id,
    name = configuration_name,
    data_mode = configuration_data_mode,
    updated_at = now()
  where public.sites.id = target_site.id;

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
    target_site.project_id,
    target_site.id,
    current_user_id,
    'site_version_saved',
    'site_version',
    created_version_id::text,
    jsonb_build_object(
      'previousVersionId',
      target_site.active_version_id,
      'newVersionId',
      created_version_id,
      'versionNumber',
      next_version_number,
      'configurationHash',
      configuration_hash,
      'changeSummary',
      cleaned_summary
    )
  );

  return public.make_site_version_operation_result(
    target_site.project_id,
    target_site.id,
    created_version_id
  );
end;
$$;

revoke all
on function public.save_site_version(
  uuid,
  uuid,
  integer,
  jsonb,
  text
)
from public;

grant execute
on function public.save_site_version(
  uuid,
  uuid,
  integer,
  jsonb,
  text
)
to authenticated;

-- =========================================================
-- List immutable version history
-- =========================================================

create or replace function public.list_site_versions(
  p_site_id uuid
)
returns table (
  version_id uuid,
  site_id uuid,
  version_number integer,
  schema_version integer,
  configuration_hash text,
  change_summary text,
  created_by uuid,
  creator_display_name text,
  created_at timestamptz,
  is_active boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  target_active_version_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select
    s.project_id,
    s.active_version_id
  into
    target_project_id,
    target_active_version_id
  from public.sites s
  where s.id = p_site_id;

  if not found then
    raise exception 'The site was not found.';
  end if;

  if not public.is_project_member(target_project_id) then
    raise exception 'You do not have access to this site.';
  end if;

  return query
  select
    sv.id as version_id,
    sv.site_id,
    sv.version_number,
    sv.schema_version,
    sv.configuration_hash,
    sv.change_summary,
    sv.created_by,
    p.display_name as creator_display_name,
    sv.created_at,
    sv.id = target_active_version_id as is_active
  from public.site_versions sv
  left join public.profiles p
    on p.id = sv.created_by
  where sv.site_id = p_site_id
  order by sv.version_number desc;
end;
$$;

revoke all
on function public.list_site_versions(uuid)
from public;

grant execute
on function public.list_site_versions(uuid)
to authenticated;

-- =========================================================
-- Restore a historical version as a new version
-- =========================================================

create or replace function public.restore_site_version(
  p_site_id uuid,
  p_source_version_id uuid,
  p_expected_active_version_id uuid,
  p_change_summary text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_site public.sites%rowtype;
  source_version public.site_versions%rowtype;
  cleaned_summary text := nullif(trim(p_change_summary), '');
  restored_configuration jsonb;
  restored_configuration_hash text;
  restored_name text;
  restored_data_mode text;
  next_version_number integer;
  created_version_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select s.*
  into target_site
  from public.sites s
  where s.id = p_site_id
  for update;

  if not found then
    raise exception 'The site was not found.';
  end if;

  if not public.can_edit_project(target_site.project_id) then
    raise exception 'Editor access is required.';
  end if;

  if target_site.status <> 'active' then
    raise exception 'Archived sites cannot be restored to a new version.';
  end if;

  if target_site.active_version_id
     is distinct from p_expected_active_version_id then
    raise exception
      'The active site version changed after this editor was opened. Reload the latest version before restoring.';
  end if;

  select sv.*
  into source_version
  from public.site_versions sv
  where sv.id = p_source_version_id
    and sv.site_id = target_site.id;

  if not found then
    raise exception
      'The selected historical version was not found for this site.';
  end if;

  if source_version.id = target_site.active_version_id then
    raise exception
      'The selected version is already active.';
  end if;

  if cleaned_summary is null then
    cleaned_summary :=
      'Restored from Version ' ||
      source_version.version_number::text ||
      '.';
  end if;

  if char_length(cleaned_summary) > 500 then
    raise exception
      'The change summary must not exceed 500 characters.';
  end if;

  restored_configuration :=
    source_version.configuration
    || jsonb_build_object(
      'updatedAt',
      now()::text
    );

  restored_name :=
    nullif(trim(restored_configuration ->> 'name'), '');

  restored_data_mode :=
    restored_configuration ->> 'dataMode';

  if restored_name is null
     or char_length(restored_name) > 200 then
    raise exception
      'The historical configuration contains an invalid site name.';
  end if;

  if restored_data_mode not in (
    'virtual',
    'connected',
    'hybrid'
  ) then
    raise exception
      'The historical configuration contains an invalid data mode.';
  end if;

  if restored_configuration ->> 'id'
     is distinct from target_site.client_reference then
    raise exception
      'The historical configuration ID does not match the site client reference.';
  end if;

  if restored_configuration ->> 'siteType'
     is distinct from target_site.site_type then
    raise exception
      'The historical configuration site type does not match the database site.';
  end if;

  restored_configuration_hash := encode(
    extensions.digest(
      restored_configuration::text,
      'sha256'
    ),
    'hex'
  );

  select coalesce(
    max(sv.version_number),
    0
  ) + 1
  into next_version_number
  from public.site_versions sv
  where sv.site_id = target_site.id;

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
    target_site.id,
    next_version_number,
    source_version.schema_version,
    restored_configuration,
    restored_configuration_hash,
    cleaned_summary,
    current_user_id
  )
  returning public.site_versions.id
  into created_version_id;

  update public.sites
  set
    active_version_id = created_version_id,
    name = restored_name,
    data_mode = restored_data_mode,
    updated_at = now()
  where public.sites.id = target_site.id;

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
    target_site.project_id,
    target_site.id,
    current_user_id,
    'site_version_restored',
    'site_version',
    created_version_id::text,
    jsonb_build_object(
      'sourceVersionId',
      source_version.id,
      'sourceVersionNumber',
      source_version.version_number,
      'previousActiveVersionId',
      target_site.active_version_id,
      'newVersionId',
      created_version_id,
      'newVersionNumber',
      next_version_number,
      'configurationHash',
      restored_configuration_hash
    )
  );

  return public.make_site_version_operation_result(
    target_site.project_id,
    target_site.id,
    created_version_id
  );
end;
$$;

revoke all
on function public.restore_site_version(
  uuid,
  uuid,
  uuid,
  text
)
from public;

grant execute
on function public.restore_site_version(
  uuid,
  uuid,
  uuid,
  text
)
to authenticated;
