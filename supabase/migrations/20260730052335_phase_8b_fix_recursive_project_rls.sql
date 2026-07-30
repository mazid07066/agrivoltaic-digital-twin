-- AgriTwin Phase 8B-2A RLS repair
-- Removes recursive projects/project_members policy dependencies.

-- =========================================================
-- Security-definer authorization helpers
-- =========================================================

create or replace function public.is_project_owner(
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
    where p.id = target_project_id
      and p.owner_id = auth.uid()
  );
$$;

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
    where p.id = target_project_id
      and p.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
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
    where p.id = target_project_id
      and p.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'editor')
  );
$$;

revoke all
on function public.is_project_owner(uuid)
from public;

revoke all
on function public.is_project_member(uuid)
from public;

revoke all
on function public.can_edit_project(uuid)
from public;

grant execute
on function public.is_project_owner(uuid)
to authenticated;

grant execute
on function public.is_project_member(uuid)
to authenticated;

grant execute
on function public.can_edit_project(uuid)
to authenticated;

-- =========================================================
-- Remove recursive project policies
-- =========================================================

drop policy if exists
  "Project owners and members can read projects"
on public.projects;

drop policy if exists
  "Authenticated users can create owned projects"
on public.projects;

drop policy if exists
  "Project owners can update projects"
on public.projects;

drop policy if exists
  "Project owners can delete projects"
on public.projects;

drop policy if exists
  "Project members can view membership"
on public.project_members;

drop policy if exists
  "Project owners can manage members"
on public.project_members;

-- =========================================================
-- Non-recursive projects policies
-- =========================================================

create policy "Project participants can read projects"
on public.projects
for select
to authenticated
using (
  public.is_project_member(id)
);

create policy "Authenticated users can create owned projects"
on public.projects
for insert
to authenticated
with check (
  owner_id = auth.uid()
);

create policy "Project owners can update projects"
on public.projects
for update
to authenticated
using (
  public.is_project_owner(id)
)
with check (
  owner_id = auth.uid()
);

create policy "Project owners can delete projects"
on public.projects
for delete
to authenticated
using (
  public.is_project_owner(id)
);

-- =========================================================
-- Non-recursive membership policies
-- =========================================================

create policy "Project participants can read membership"
on public.project_members
for select
to authenticated
using (
  public.is_project_member(project_id)
);

create policy "Project owners can insert membership"
on public.project_members
for insert
to authenticated
with check (
  public.is_project_owner(project_id)
);

create policy "Project owners can update membership"
on public.project_members
for update
to authenticated
using (
  public.is_project_owner(project_id)
)
with check (
  public.is_project_owner(project_id)
);

create policy "Project owners can delete membership"
on public.project_members
for delete
to authenticated
using (
  public.is_project_owner(project_id)
);

-- =========================================================
-- Replace site policies with helper-based checks
-- This avoids repeated cross-table RLS evaluation.
-- =========================================================

drop policy if exists
  "Project participants can read sites"
on public.sites;

drop policy if exists
  "Project owners and editors can create sites"
on public.sites;

drop policy if exists
  "Project owners and editors can update sites"
on public.sites;

create policy "Project participants can read sites"
on public.sites
for select
to authenticated
using (
  public.is_project_member(project_id)
);

create policy "Project editors can create sites"
on public.sites
for insert
to authenticated
with check (
  public.can_edit_project(project_id)
);

create policy "Project editors can update sites"
on public.sites
for update
to authenticated
using (
  public.can_edit_project(project_id)
)
with check (
  public.can_edit_project(project_id)
);

create policy "Project editors can archive or delete sites"
on public.sites
for delete
to authenticated
using (
  public.can_edit_project(project_id)
);

-- =========================================================
-- Replace direct project checks on scenarios
-- =========================================================

drop policy if exists
  "Project participants can read scenarios"
on public.scenarios;

drop policy if exists
  "Project owners and editors can manage scenarios"
on public.scenarios;

create policy "Project participants can read scenarios"
on public.scenarios
for select
to authenticated
using (
  public.is_project_member(project_id)
);

create policy "Project editors can insert scenarios"
on public.scenarios
for insert
to authenticated
with check (
  public.can_edit_project(project_id)
);

create policy "Project editors can update scenarios"
on public.scenarios
for update
to authenticated
using (
  public.can_edit_project(project_id)
)
with check (
  public.can_edit_project(project_id)
);

create policy "Project editors can delete scenarios"
on public.scenarios
for delete
to authenticated
using (
  public.can_edit_project(project_id)
);

-- =========================================================
-- Replace direct project checks on simulation runs
-- =========================================================

drop policy if exists
  "Project participants can read simulation runs"
on public.simulation_runs;

drop policy if exists
  "Project owners and editors can create simulation runs"
on public.simulation_runs;

drop policy if exists
  "Project owners and editors can update simulation run status"
on public.simulation_runs;

create policy "Project participants can read simulation runs"
on public.simulation_runs
for select
to authenticated
using (
  public.is_project_member(project_id)
);

create policy "Project editors can create simulation runs"
on public.simulation_runs
for insert
to authenticated
with check (
  public.can_edit_project(project_id)
);

create policy "Project editors can update simulation runs"
on public.simulation_runs
for update
to authenticated
using (
  public.can_edit_project(project_id)
)
with check (
  public.can_edit_project(project_id)
);

-- =========================================================
-- Replace direct project checks on audit events
-- =========================================================

drop policy if exists
  "Project participants can read audit events"
on public.audit_events;

drop policy if exists
  "Project participants can create audit events"
on public.audit_events;

create policy "Project participants can read audit events"
on public.audit_events
for select
to authenticated
using (
  project_id is not null
  and public.is_project_member(project_id)
);

create policy "Project editors can create audit events"
on public.audit_events
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and project_id is not null
  and public.can_edit_project(project_id)
);
