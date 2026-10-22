-- Preserve EB issue report history while freeing a staff email for reuse.
-- Run this migration in the Supabase SQL Editor before deploying permanent staff deletion.
do $$
declare fk record;
begin
  if to_regclass('public.staff_issue_reports') is not null then
    for fk in
      select tc.constraint_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name and tc.constraint_schema = kcu.constraint_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name and ccu.constraint_schema = tc.constraint_schema
      where tc.constraint_type = 'FOREIGN KEY'
        and tc.table_schema = 'public'
        and tc.table_name = 'staff_issue_reports'
        and kcu.column_name = 'staff_id'
        and ccu.table_schema = 'public'
        and ccu.table_name = 'staff_users'
        and ccu.column_name = 'id'
    loop
      execute format('alter table public.staff_issue_reports drop constraint %I', fk.constraint_name);
    end loop;
    alter table public.staff_issue_reports alter column staff_id drop not null;
    alter table public.staff_issue_reports
      add constraint staff_issue_reports_staff_id_fkey
      foreign key (staff_id) references public.staff_users(id) on delete set null;
  end if;
end $$;
