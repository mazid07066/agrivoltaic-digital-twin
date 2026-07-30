-- AgriTwin Phase 8B-2B
-- Active workspace, multi-site registry operations and immutable site-version updates.

create table if not exists public.user_workspace_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_project_id uuid references public.projects(id) on delete set null,
  active_site_id uuid references public.sites(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_workspace_preferences_set_updated_at
before update on public.user_workspace_preferences
for each row
execute function public.set_updated_at();

alter table public.user_workspace_preferences enable row level security;

create policy "Users can read their own workspace preference"
on public.user_workspace_preferences
for select
to authenticated
using (user_id = auth.uid());

-- Direct writes are intentionally omitted. Changes go through the RPCs below.

create or replace function public.make_site_operation_result(
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
    'siteVersionId', p_site_version_id,
    'siteProfile', sv.configuration
  )
  from public.site_versions sv
  where sv.id = p_site_version_id;
$$;

revoke all on function public.make_site_operation_result(uuid, uuid, uuid) from public;

create or replace function public.set_active_workspace(
  p_project_id uuid,
  p_site_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_version_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.is_project_member(p_project_id) then
    raise exception 'You do not have access to this project.';
  end if;

  select s.active_version_id
  into selected_version_id
  from public.sites s
  where s.id = p_site_id
    and s.project_id = p_project_id
    and s.status = 'active';

  if selected_version_id is null then
    raise exception 'The selected active site or site version was not found.';
  end if;

  insert into public.user_workspace_preferences (
    user_id,
    active_project_id,
    active_site_id
  )
  values (
    current_user_id,
    p_project_id,
    p_site_id
  )
  on conflict on constraint user_workspace_preferences_pkey
  do update set
    active_project_id = excluded.active_project_id,
    active_site_id = excluded.active_site_id,
    updated_at = now();

  return public.make_site_operation_result(
    p_project_id,
    p_site_id,
    selected_version_id
  );
end;
$$;

create or replace function public.create_land_site(
  p_project_id uuid,
  p_name text,
  p_source_profile jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_name text := nullif(trim(p_name), '');
  created_site_id uuid;
  created_version_id uuid;
  generated_client_reference text := 'site-' || gen_random_uuid()::text;
  now_text text := now()::text;
  snapshot jsonb;
  configuration_hash text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.can_edit_project(p_project_id) then
    raise exception 'Editor access is required.';
  end if;

  if cleaned_name is null or char_length(cleaned_name) > 200 then
    raise exception 'A site name between 1 and 200 characters is required.';
  end if;

  if p_source_profile is null
     or jsonb_typeof(p_source_profile) <> 'object'
     or p_source_profile ->> 'siteType' <> 'land_agrivoltaic'
     or coalesce((p_source_profile ->> 'schemaVersion')::integer, 0) <> 1 then
    raise exception 'A valid Phase 8A land SiteProfile is required.';
  end if;

  snapshot := p_source_profile
    || jsonb_build_object(
      'id', generated_client_reference,
      'name', cleaned_name,
      'createdAt', now_text,
      'updatedAt', now_text
    );

  insert into public.sites (
    project_id,
    name,
    site_type,
    data_mode,
    status,
    client_reference
  )
  values (
    p_project_id,
    cleaned_name,
    'land_agrivoltaic',
    snapshot ->> 'dataMode',
    'active',
    generated_client_reference
  )
  returning id into created_site_id;

  configuration_hash := encode(
    extensions.digest(snapshot::text, 'sha256'),
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
    1,
    snapshot,
    configuration_hash,
    'Initial version created through the Phase 8B site registry.',
    current_user_id
  )
  returning id into created_version_id;

  update public.sites
  set active_version_id = created_version_id
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
    p_project_id,
    created_site_id,
    current_user_id,
    'site_created',
    'site',
    created_site_id::text,
    jsonb_build_object('configurationHash', configuration_hash)
  );

  perform public.set_active_workspace(p_project_id, created_site_id);

  return public.make_site_operation_result(
    p_project_id,
    created_site_id,
    created_version_id
  );
end;
$$;

create or replace function public.duplicate_site(
  p_site_id uuid,
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  source_site public.sites%rowtype;
  source_configuration jsonb;
  cleaned_name text := nullif(trim(p_name), '');
  created_site_id uuid;
  created_version_id uuid;
  generated_client_reference text := 'site-' || gen_random_uuid()::text;
  now_text text := now()::text;
  snapshot jsonb;
  configuration_hash text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select s.* into source_site
  from public.sites s
  where s.id = p_site_id;

  if not found or not public.can_edit_project(source_site.project_id) then
    raise exception 'The source site was not found or is not editable.';
  end if;

  if source_site.active_version_id is null then
    raise exception 'The source site has no active version.';
  end if;

  if cleaned_name is null or char_length(cleaned_name) > 200 then
    raise exception 'A duplicate-site name between 1 and 200 characters is required.';
  end if;

  select sv.configuration into source_configuration
  from public.site_versions sv
  where sv.id = source_site.active_version_id;

  snapshot := source_configuration
    || jsonb_build_object(
      'id', generated_client_reference,
      'name', cleaned_name,
      'createdAt', now_text,
      'updatedAt', now_text
    );

  insert into public.sites (
    project_id,
    name,
    site_type,
    data_mode,
    status,
    client_reference
  )
  values (
    source_site.project_id,
    cleaned_name,
    source_site.site_type,
    source_site.data_mode,
    'active',
    generated_client_reference
  )
  returning id into created_site_id;

  configuration_hash := encode(
    extensions.digest(snapshot::text, 'sha256'),
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
    coalesce((snapshot ->> 'schemaVersion')::integer, 1),
    snapshot,
    configuration_hash,
    'Initial version duplicated from site ' || source_site.id::text || '.',
    current_user_id
  )
  returning id into created_version_id;

  update public.sites
  set active_version_id = created_version_id
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
    source_site.project_id,
    created_site_id,
    current_user_id,
    'site_duplicated',
    'site',
    created_site_id::text,
    jsonb_build_object('sourceSiteId', source_site.id)
  );

  return public.make_site_operation_result(
    source_site.project_id,
    created_site_id,
    created_version_id
  );
end;
$$;

create or replace function public.rename_site(
  p_site_id uuid,
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_site public.sites%rowtype;
  source_configuration jsonb;
  cleaned_name text := nullif(trim(p_name), '');
  next_version_number integer;
  created_version_id uuid;
  snapshot jsonb;
  configuration_hash text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select s.* into target_site
  from public.sites s
  where s.id = p_site_id;

  if not found or not public.can_edit_project(target_site.project_id) then
    raise exception 'The site was not found or is not editable.';
  end if;

  if cleaned_name is null or char_length(cleaned_name) > 200 then
    raise exception 'A site name between 1 and 200 characters is required.';
  end if;

  select sv.configuration into source_configuration
  from public.site_versions sv
  where sv.id = target_site.active_version_id;

  select coalesce(max(sv.version_number), 0) + 1
  into next_version_number
  from public.site_versions sv
  where sv.site_id = target_site.id;

  snapshot := source_configuration
    || jsonb_build_object(
      'name', cleaned_name,
      'updatedAt', now()::text
    );

  configuration_hash := encode(
    extensions.digest(snapshot::text, 'sha256'),
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
    target_site.id,
    next_version_number,
    coalesce((snapshot ->> 'schemaVersion')::integer, 1),
    snapshot,
    configuration_hash,
    'Site renamed from "' || target_site.name || '" to "' || cleaned_name || '".',
    current_user_id
  )
  returning id into created_version_id;

  update public.sites
  set
    name = cleaned_name,
    active_version_id = created_version_id,
    updated_at = now()
  where id = target_site.id;

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
    'site_renamed',
    'site',
    target_site.id::text,
    jsonb_build_object('oldName', target_site.name, 'newName', cleaned_name)
  );

  return public.make_site_operation_result(
    target_site.project_id,
    target_site.id,
    created_version_id
  );
end;
$$;

create or replace function public.archive_site(
  p_site_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_site public.sites%rowtype;
  replacement_site public.sites%rowtype;
  active_count integer;
  current_active_site_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select s.* into target_site
  from public.sites s
  where s.id = p_site_id;

  if not found or not public.can_edit_project(target_site.project_id) then
    raise exception 'The site was not found or is not editable.';
  end if;

  select count(*) into active_count
  from public.sites s
  where s.project_id = target_site.project_id
    and s.status = 'active';

  if active_count <= 1 then
    raise exception 'The last active site in a project cannot be archived.';
  end if;

  update public.sites
  set status = 'archived', archived_at = now(), updated_at = now()
  where id = target_site.id;

  select uwp.active_site_id into current_active_site_id
  from public.user_workspace_preferences uwp
  where uwp.user_id = current_user_id;

  if current_active_site_id = target_site.id then
    select s.* into replacement_site
    from public.sites s
    where s.project_id = target_site.project_id
      and s.status = 'active'
      and s.id <> target_site.id
    order by s.created_at
    limit 1;

    perform public.set_active_workspace(
      replacement_site.project_id,
      replacement_site.id
    );
  end if;

  insert into public.audit_events (
    project_id,
    site_id,
    actor_id,
    event_type,
    entity_type,
    entity_id
  )
  values (
    target_site.project_id,
    target_site.id,
    current_user_id,
    'site_archived',
    'site',
    target_site.id::text
  );

  return jsonb_build_object(
    'projectId', target_site.project_id,
    'siteId', target_site.id,
    'status', 'archived'
  );
end;
$$;

create or replace function public.restore_site(
  p_site_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_site public.sites%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select s.* into target_site
  from public.sites s
  where s.id = p_site_id;

  if not found or not public.can_edit_project(target_site.project_id) then
    raise exception 'The site was not found or is not editable.';
  end if;

  update public.sites
  set status = 'active', archived_at = null, updated_at = now()
  where id = target_site.id;

  insert into public.audit_events (
    project_id,
    site_id,
    actor_id,
    event_type,
    entity_type,
    entity_id
  )
  values (
    target_site.project_id,
    target_site.id,
    current_user_id,
    'site_restored',
    'site',
    target_site.id::text
  );

  return public.make_site_operation_result(
    target_site.project_id,
    target_site.id,
    target_site.active_version_id
  );
end;
$$;

revoke all on function public.set_active_workspace(uuid, uuid) from public;
revoke all on function public.create_land_site(uuid, text, jsonb) from public;
revoke all on function public.duplicate_site(uuid, text) from public;
revoke all on function public.rename_site(uuid, text) from public;
revoke all on function public.archive_site(uuid) from public;
revoke all on function public.restore_site(uuid) from public;

grant execute on function public.set_active_workspace(uuid, uuid) to authenticated;
grant execute on function public.create_land_site(uuid, text, jsonb) to authenticated;
grant execute on function public.duplicate_site(uuid, text) to authenticated;
grant execute on function public.rename_site(uuid, text) to authenticated;
grant execute on function public.archive_site(uuid) to authenticated;
grant execute on function public.restore_site(uuid) to authenticated;

-- Backfill one active workspace for existing owners who already completed Phase 8B-2A.
insert into public.user_workspace_preferences (
  user_id,
  active_project_id,
  active_site_id
)
select distinct on (p.owner_id)
  p.owner_id,
  p.id,
  s.id
from public.projects p
join public.sites s
  on s.project_id = p.id
 and s.status = 'active'
where p.status = 'active'
order by p.owner_id, p.created_at, s.created_at
on conflict on constraint user_workspace_preferences_pkey do nothing;
