
-- Apply or reapply in Supabase SQL Editor before deploying multi-device kiosk assistance.
-- Each device owns an independent operation, including devices using the same EB account.
BEGIN;

DO $$
DECLARE old_index record;
BEGIN
    -- Replace only a session-wide active-operation unique index. Never drop
    -- primary keys, foreign keys, or unrelated uniqueness constraints.
    FOR old_index IN
        SELECT n.nspname, c.relname
        FROM pg_index i
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_class c ON c.oid = i.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = i.indkey[0]
        WHERE n.nspname = 'public' AND t.relname = 'kiosk_operations'
          AND i.indisunique AND NOT i.indisprimary AND i.indnkeyatts = 1
          AND a.attname = 'kiosk_session_id' AND i.indpred IS NOT NULL
          AND regexp_replace(pg_get_expr(i.indpred,i.indrelid),
              '\(|\)|::[a-zA-Z_][a-zA-Z_0-9.]*|\s', '', 'g') = 'operation_status=''active'''
    LOOP
        EXECUTE format('DROP INDEX %I.%I', old_index.nspname, old_index.relname);
    END LOOP;
END $$;

-- Remove the older per-member limit while preserving operation IDs and voter safeguards.
DROP INDEX IF EXISTS public.kiosk_one_active_operation_per_eb;

-- Avoid losing increments when different EB members finish simultaneously.
CREATE OR REPLACE FUNCTION public.increment_kiosk_students_served(p_session_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
    UPDATE public.kiosk_sessions
    SET students_served = COALESCE(students_served,0) + 1,
        last_activity_at = now(), updated_at = now()
    WHERE id = p_session_id;
$$;
REVOKE ALL ON FUNCTION public.increment_kiosk_students_served(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_kiosk_students_served(uuid) TO service_role;
COMMIT;
