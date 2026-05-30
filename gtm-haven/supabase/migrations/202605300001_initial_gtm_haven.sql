create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.engine_type as enum ('void', 'compliance', 'pain');
create type public.provider_mode as enum ('real', 'mock', 'disabled');
create type public.integration_provider as enum (
  'bright_data',
  'ai_ml_api',
  'featherless',
  'speechmatics',
  'cognee',
  'triggerware',
  'slack',
  'hubspot'
);
create type public.urgency_level as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.account_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_name text not null,
  industry text not null,
  employees integer,
  crm_stage text not null default 'Not in pipeline',
  convergence_score integer not null default 0 check (convergence_score >= 0 and convergence_score <= 100),
  urgency public.urgency_level not null default 'LOW',
  threshold_crossed_at timestamptz,
  profile_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, account_name)
);

create table public.engine_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_profile_id uuid not null references public.account_profiles(id) on delete cascade,
  engine public.engine_type not null,
  title text not null,
  description text not null,
  event_time timestamptz not null,
  sub_score integer not null check (sub_score >= 0 and sub_score <= 100),
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  provenance jsonb not null,
  raw_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.convergence_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_profile_id uuid not null references public.account_profiles(id) on delete cascade,
  void_score integer not null check (void_score >= 0 and void_score <= 100),
  compliance_score integer not null check (compliance_score >= 0 and compliance_score <= 100),
  pain_score integer not null check (pain_score >= 0 and pain_score <= 100),
  convergence_score integer not null check (convergence_score >= 0 and convergence_score <= 100),
  urgency public.urgency_level not null,
  weighting jsonb not null default '{"void":0.333333,"compliance":0.333333,"pain":0.333333}'::jsonb,
  triggered_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.intel_briefs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_profile_id uuid not null references public.account_profiles(id) on delete cascade,
  convergence_run_id uuid references public.convergence_runs(id) on delete set null,
  generated_by text not null check (generated_by in ('ai_ml_api', 'mock')),
  urgency text not null,
  why_now jsonb not null default '[]'::jsonb,
  suggested_opening_line text not null,
  account_context jsonb not null default '{}'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider public.integration_provider not null,
  mode public.provider_mode not null default 'mock',
  status text not null default 'not_configured',
  encrypted_credentials jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create index account_profiles_org_score_idx on public.account_profiles (organization_id, convergence_score desc);
create index engine_signals_account_engine_idx on public.engine_signals (account_profile_id, engine, event_time desc);
create index convergence_runs_account_created_idx on public.convergence_runs (account_profile_id, created_at desc);
create index intel_briefs_account_created_idx on public.intel_briefs (account_profile_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger account_profiles_updated_at
before update on public.account_profiles
for each row execute function public.set_updated_at();

create trigger integration_connections_updated_at
before update on public.integration_connections
for each row execute function public.set_updated_at();
