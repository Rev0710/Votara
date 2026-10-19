-- Run after staff-issue-reports.sql. Existing reports are retained.
-- Lifetime limit: five reports per student account / EB account.
BEGIN;
CREATE OR REPLACE FUNCTION public.enforce_issue_report_quota()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE owner_id uuid; used integer;
BEGIN
 IF TG_TABLE_NAME='student_issue_reports' THEN
  owner_id:=NEW.student_id;
  PERFORM pg_advisory_xact_lock(hashtextextended('student-report:'||owner_id::text,0));
  SELECT count(*) INTO used FROM public.student_issue_reports WHERE student_id=owner_id;
 ELSIF TG_TABLE_NAME='staff_issue_reports' THEN
  owner_id:=NEW.staff_id;
  PERFORM pg_advisory_xact_lock(hashtextextended('staff-report:'||owner_id::text,0));
  SELECT count(*) INTO used FROM public.staff_issue_reports WHERE staff_id=owner_id;
 ELSE RAISE EXCEPTION 'Unsupported report table';
 END IF;
 IF used>=5 THEN RAISE EXCEPTION 'REPORT_LIMIT_REACHED: maximum 5 reports per account'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS student_issue_report_quota ON public.student_issue_reports;
CREATE TRIGGER student_issue_report_quota BEFORE INSERT ON public.student_issue_reports FOR EACH ROW EXECUTE FUNCTION public.enforce_issue_report_quota();
DROP TRIGGER IF EXISTS staff_issue_report_quota ON public.staff_issue_reports;
CREATE TRIGGER staff_issue_report_quota BEFORE INSERT ON public.staff_issue_reports FOR EACH ROW EXECUTE FUNCTION public.enforce_issue_report_quota();
COMMIT;
