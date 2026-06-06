-- Fix: organizations with NULL owner_user_id can't be updated via RLS.
-- Set owner_user_id from the existing membership for any orgs missing it.
update public.organizations
set owner_user_id = members.user_id
from (
  select distinct on (organization_id) organization_id, user_id
  from public.organization_members
  where role = 'owner'
  order by organization_id, created_at
) members
where organizations.id = members.organization_id
  and organizations.owner_user_id is null;

-- Also allow org members (not just owners) to update their org's knowledge doc.
-- This handles the case where owner_user_id is still null or mismatched.
drop policy if exists "Members can update organization knowledge" on public.organizations;
create policy "Members can update organization knowledge"
on public.organizations for update
to authenticated
using (
  exists (
    select 1
    from public.organization_members
    where organization_members.organization_id = organizations.id
      and organization_members.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.organization_members
    where organization_members.organization_id = organizations.id
      and organization_members.user_id = (select auth.uid())
  )
);

-- Ensure user_profiles rows exist for all existing users (backfill).
insert into public.user_profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Mark users who already have an org with a knowledge doc as 'complete'
-- so they aren't re-routed to onboarding on next login.
update public.user_profiles
set setup_status = 'complete'
from public.organization_members om
join public.organizations o on o.id = om.organization_id
where user_profiles.user_id = om.user_id
  and o.company_knowledge is not null
  and user_profiles.setup_status = 'incomplete';
