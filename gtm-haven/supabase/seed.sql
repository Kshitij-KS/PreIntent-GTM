insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-8000-000000000001', 'Demo Revenue Command', 'demo-revenue-command')
on conflict (slug) do nothing;

insert into public.competitors (id, organization_id, name, domain, segment, monitored_since)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Acme Corp', 'acme.com', 'Enterprise CRM', '2026-04-01T00:00:00Z'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Zenith Tech', 'zenith.example', 'Customer Success', '2026-04-01T00:00:00Z')
on conflict (organization_id, domain) do nothing;

insert into public.integration_connections (organization_id, provider, mode, status, settings, last_sync_at)
values
  ('00000000-0000-4000-8000-000000000001', 'bright_data', 'mock', 'healthy', '{"tools":["SERP API","Web Scraper API","Scraping Browser","Web Unlocker"]}', '2026-05-30T07:45:00Z'),
  ('00000000-0000-4000-8000-000000000001', 'ai_ml_api', 'mock', 'healthy', '{"briefs":"structured"}', '2026-05-30T07:48:00Z'),
  ('00000000-0000-4000-8000-000000000001', 'slack', 'mock', 'healthy', '{"channel":"#gtm-intel"}', '2026-05-30T07:50:00Z'),
  ('00000000-0000-4000-8000-000000000001', 'hubspot', 'mock', 'healthy', '{"objectMapping":"company-task-note"}', '2026-05-30T07:51:00Z')
on conflict (organization_id, provider) do nothing;
