alter table public.organizations
add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

update public.organizations organizations
set owner_user_id = owners.user_id
from (
  select distinct on (organization_id) organization_id, user_id
  from public.organization_members
  where role = 'owner'
  order by organization_id, created_at
) owners
where organizations.id = owners.organization_id
  and organizations.owner_user_id is null;

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  setup_status text not null default 'incomplete'
    check (setup_status in ('incomplete', 'complete')),
  first_onboarding_routed_at timestamptz,
  knowledge_organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create schema if not exists private;

create or replace function private.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.create_user_profile();

insert into public.user_profiles (user_id, first_onboarding_routed_at)
select id, now()
from auth.users
on conflict (user_id) do nothing;

alter table public.user_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "Users can read their profile"
on public.user_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their profile"
on public.user_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can insert their profile"
on public.user_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read owned organizations"
on public.organizations for select
to authenticated
using ((select auth.uid()) = owner_user_id);

create policy "Users can create owned organizations"
on public.organizations for insert
to authenticated
with check ((select auth.uid()) = owner_user_id);

create policy "Users can update owned organizations"
on public.organizations for update
to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

create policy "Users can read their memberships"
on public.organization_members for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners can create their membership"
on public.organization_members for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.organizations
    where organizations.id = organization_members.organization_id
      and organizations.owner_user_id = (select auth.uid())
  )
);

grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, update on public.organizations to authenticated;
grant select, insert on public.organization_members to authenticated;
