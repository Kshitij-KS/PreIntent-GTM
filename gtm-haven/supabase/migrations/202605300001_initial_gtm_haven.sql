create extension if not exists pgcrypto;
create schema if not exists private;

create type public.member_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.signal_type as enum (
  'm_and_a',
  'executive_change',
  'negative_sentiment',
  'positive_milestone',
  'negative_space',
  'job_posting',
  'community_pain',
  'regulatory'
);
create type public.alert_status as enum ('new', 'acknowledged', 'actioned', 'dismissed');
create type public.provider_mode as enum ('real', 'mock', 'disabled');
create type public.integration_provider as enum ('bright_data', 'ai_ml_api', 'cognee', 'slack', 'hubspot', 'triggerware');

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

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  domain text not null,
  segment text not null default 'Unknown',
  monitored_since timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, domain)
);

create table public.signal_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider public.integration_provider,
  label text not null,
  url text not null,
  captured_at timestamptz not null,
  source_quality numeric(4, 3) not null check (source_quality >= 0 and source_quality <= 1),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  source_id uuid not null references public.signal_sources(id) on delete restrict,
  type public.signal_type not null,
  title text not null,
  description text not null,
  event_time timestamptz not null,
  impact_score integer not null check (impact_score >= 0 and impact_score <= 100),
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  entities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.scoring_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  explanation text not null,
  contributions jsonb not null default '[]'::jsonb,
  as_of timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  title text not null,
  brief text not null,
  owner_role text not null,
  action text not null,
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  title text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  status public.alert_status not null default 'new',
  owner text not null,
  source_signal_ids uuid[] not null default '{}',
  slack_delivery text not null default 'ready',
  hubspot_sync text not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create table public.integration_sync_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid references public.integration_connections(id) on delete set null,
  provider public.integration_provider not null,
  operation text not null,
  idempotency_key text not null,
  status text not null,
  request_summary jsonb not null default '{}'::jsonb,
  response_summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  unique (organization_id, provider, idempotency_key)
);

create index competitors_organization_idx on public.competitors (organization_id, name);
create index signal_sources_organization_captured_idx on public.signal_sources (organization_id, captured_at desc);
create index signals_competitor_time_idx on public.signals (competitor_id, event_time desc);
create index signals_organization_type_time_idx on public.signals (organization_id, type, event_time desc);
create index scoring_runs_competitor_as_of_idx on public.scoring_runs (competitor_id, as_of desc);
create index alerts_organization_status_severity_idx on public.alerts (organization_id, status, severity);
create index sync_logs_organization_created_idx on public.integration_sync_logs (organization_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.competitors enable row level security;
alter table public.signal_sources enable row level security;
alter table public.signals enable row level security;
alter table public.scoring_runs enable row level security;
alter table public.recommendations enable row level security;
alter table public.alerts enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_sync_logs enable row level security;

create or replace function private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members members
    where members.organization_id = target_organization_id
      and members.user_id = auth.uid()
  );
$$;

create policy "members can read their organizations"
  on public.organizations for select
  using (private.is_org_member(id));

create policy "members can read memberships"
  on public.organization_members for select
  using (private.is_org_member(organization_id));

create policy "admins can manage memberships"
  on public.organization_members for all
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_members.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_members.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create policy "members can read competitors"
  on public.competitors for select
  using (private.is_org_member(organization_id));

create policy "admins can manage competitors"
  on public.competitors for all
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

create policy "members can read signal sources"
  on public.signal_sources for select
  using (private.is_org_member(organization_id));

create policy "members can read signals"
  on public.signals for select
  using (private.is_org_member(organization_id));

create policy "members can read scoring runs"
  on public.scoring_runs for select
  using (private.is_org_member(organization_id));

create policy "members can read recommendations"
  on public.recommendations for select
  using (private.is_org_member(organization_id));

create policy "members can read alerts"
  on public.alerts for select
  using (private.is_org_member(organization_id));

create policy "members can update alert workflow state"
  on public.alerts for update
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

create policy "admins can read integrations"
  on public.integration_connections for select
  using (private.is_org_member(organization_id));

create policy "admins can manage integrations"
  on public.integration_connections for all
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

create policy "members can read sync logs"
  on public.integration_sync_logs for select
  using (private.is_org_member(organization_id));
