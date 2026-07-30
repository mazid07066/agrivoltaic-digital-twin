-- AgriTwin Phase 8C-1
-- Simple rectangular flat-roof site creation foundation.
-- No structural-safety determination is performed.

create or replace function public.create_flat_roof_site(
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
  generated_client_reference text :=
    'flat-roof-' || gen_random_uuid()::text;
  now_text text := now()::text;
  snapshot jsonb;
  geometry jsonb;
  configuration_hash text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.can_edit_project(p_project_id) then
    raise exception 'Editor access is required.';
  end if;

  if cleaned_name is null
     or char_length(cleaned_name) > 200 then
    raise exception
      'A site name between 1 and 200 characters is required.';
  end if;

  if p_source_profile is null
     or jsonb_typeof(p_source_profile) <> 'object'
     or p_source_profile ->> 'siteType' <> 'flat_roof'
     or coalesce(
       (p_source_profile ->> 'schemaVersion')::integer,
       0
     ) <> 1 then
    raise exception
      'A valid schema-version-1 flat-roof SiteProfile is required.';
  end if;

  geometry := p_source_profile -> 'siteGeometry';

  if geometry is null
     or jsonb_typeof(geometry) <> 'object'
     or geometry ->> 'kind' <> 'flat_roof'
     or coalesce(
       (geometry ->> 'buildingHeightM')::double precision,
       -1
     ) < 0
     or coalesce(
       (geometry ->> 'roofLengthM')::double precision,
       0
     ) <= 0
     or coalesce(
       (geometry ->> 'roofWidthM')::double precision,
       0
     ) <= 0 then
    raise exception
      'Flat-roof geometry requires non-negative building height and positive roof dimensions.';
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
    'flat_roof',
    snapshot ->> 'dataMode',
    'active',
    generated_client_reference
  )
  returning id into created_site_id;

  configuration_hash := encode(
    extensions.digest(
      snapshot::text,
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
    1,
    snapshot,
    configuration_hash,
    'Initial rectangular flat-roof version created in Phase 8C-1.',
    current_user_id
  )
  returning id into created_version_id;

  update public.sites
  set
    active_version_id = created_version_id,
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
    p_project_id,
    created_site_id,
    current_user_id,
    'flat_roof_site_created',
    'site',
    created_site_id::text,
    jsonb_build_object(
      'configurationHash',
      configuration_hash,
      'buildingHeightM',
      geometry -> 'buildingHeightM',
      'roofLengthM',
      geometry -> 'roofLengthM',
      'roofWidthM',
      geometry -> 'roofWidthM',
      'structuralAssessment',
      false
    )
  );

  perform public.set_active_workspace(
    p_project_id,
    created_site_id
  );

  return public.make_site_operation_result(
    p_project_id,
    created_site_id,
    created_version_id
  );
end;
$$;

revoke all
on function public.create_flat_roof_site(
  uuid,
  text,
  jsonb
)
from public;

grant execute
on function public.create_flat_roof_site(
  uuid,
  text,
  jsonb
)
to authenticated;
