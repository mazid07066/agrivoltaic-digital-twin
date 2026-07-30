-- AgriTwin Phase 8B-1C
-- Authentication profile provisioning and ownership safeguards.

-- =========================================================
-- Automatically create a public profile for each Auth user
-- =========================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    institution
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'AgriTwin User'
    ),
    nullif(new.raw_user_meta_data ->> 'institution', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- =========================================================
-- Allow users to insert their own missing profile
-- This also supports accounts created before this migration.
-- =========================================================

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- =========================================================
-- Project membership helper functions
-- =========================================================

create or replace function public.is_project_member(
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = target_project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.user_id is not null
      )
  );
$$;

create or replace function public.can_edit_project(
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = target_project_id
      and (
        p.owner_id = (select auth.uid())
        or pm.role in ('owner', 'editor')
      )
  );
$$;

revoke all on function public.is_project_member(uuid)
from public;

revoke all on function public.can_edit_project(uuid)
from public;

grant execute on function public.is_project_member(uuid)
to authenticated;

grant execute on function public.can_edit_project(uuid)
to authenticated;

-- =========================================================
-- Backfill profiles for existing Auth users
-- =========================================================

insert into public.profiles (
  id,
  display_name,
  institution
)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'display_name', ''),
    split_part(coalesce(u.email, ''), '@', 1),
    'AgriTwin User'
  ),
  nullif(u.raw_user_meta_data ->> 'institution', '')
from auth.users u
on conflict (id) do nothing;
