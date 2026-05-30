alter table public.organizations
add column if not exists company_knowledge jsonb;
