-- Apply in the VOTARA Supabase SQL editor before enabling EB issue reports.
-- Existing student reports and their policies are unchanged.
create table if not exists public.staff_issue_reports (
 id uuid primary key default gen_random_uuid(),
 reference text not null unique,
 staff_id uuid references public.staff_users(id) on delete set null,
 reporter_name text not null,
 contact_email text,
 category text not null default 'Electoral Board issue',
 subject text not null check (char_length(subject) between 4 and 160),
 description text not null check (char_length(description) between 10 and 5000),
 status text not null default 'submitted' check (status in ('submitted','in_review','resolved','closed')),
 admin_response text check (char_length(admin_response)<=2000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 resolved_at timestamptz
);
alter table public.staff_issue_reports enable row level security;
revoke all on public.staff_issue_reports from anon, authenticated;
grant select, insert, update on public.staff_issue_reports to service_role;
create index if not exists staff_issue_reports_owner_created on public.staff_issue_reports(staff_id,created_at desc);
