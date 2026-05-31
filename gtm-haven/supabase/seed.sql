insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-8000-000000000001', 'PreIntent Demo Workspace', 'preintent-demo')
on conflict (slug) do nothing;

insert into public.account_profiles (
  id,
  organization_id,
  account_name,
  industry,
  employees,
  crm_stage,
  convergence_score,
  urgency,
  threshold_crossed_at,
  profile_payload
)
values (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  'Acme FinTech',
  'FinTech / Payments',
  340,
  'Not in pipeline',
  87,
  'HIGH',
  '2026-05-30T08:30:00Z',
  '{"stack":["AWS","Stripe","Postgres"],"contact":"Head of Payments Infrastructure"}'
)
on conflict (organization_id, account_name) do nothing;

insert into public.integration_connections (organization_id, provider, mode, status, settings, last_sync_at)
values
  ('00000000-0000-4000-8000-000000000001', 'bright_data', 'mock', 'healthy', '{"tools":["MCP Server","Scraping Browser","Web Unlocker","SERP API","Web Scraper API"]}', null),
  ('00000000-0000-4000-8000-000000000001', 'ai_ml_api', 'mock', 'healthy', '{"role":"Intel Brief generation"}', null),
  ('00000000-0000-4000-8000-000000000001', 'featherless', 'mock', 'healthy', '{"role":"Pain signal classification"}', null),
  ('00000000-0000-4000-8000-000000000001', 'speechmatics', 'mock', 'healthy', '{"role":"Audio transcript signal"}', null),
  ('00000000-0000-4000-8000-000000000001', 'cognee', 'mock', 'healthy', '{"role":"Account Intelligence Profile memory"}', null),
  ('00000000-0000-4000-8000-000000000001', 'triggerware', 'mock', 'healthy', '{"role":"Threshold routing preview"}', null),
  ('00000000-0000-4000-8000-000000000001', 'slack', 'mock', 'healthy', '{"channel":"#sales-alerts"}', null),
  ('00000000-0000-4000-8000-000000000001', 'hubspot', 'mock', 'healthy', '{"objectMapping":"company-lead-task"}', null)
on conflict (organization_id, provider) do nothing;
