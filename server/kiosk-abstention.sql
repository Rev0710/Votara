-- Run this file once in Supabase SQL Editor. Preserves the currently installed voting schedule/testing mode.
-- Records a full-abstention ballot with zero candidate selections and still marks the student as voted.
BEGIN;
DO $migration$
DECLARE original text; updated text;
BEGIN
 IF to_regprocedure('public.submit_votara_vote(uuid,uuid,jsonb,text)') IS NULL THEN
  RAISE EXCEPTION 'Install the current voting SQL function before applying kiosk-abstention.sql.';
 END IF;
 SELECT pg_get_functiondef('public.submit_votara_vote(uuid,uuid,jsonb,text)'::regprocedure) INTO original;
 IF position('Full-abstention eligibility' IN original)>0 THEN RETURN; END IF;
 updated:=regexp_replace(original,
 $pattern$IF[[:space:]]+jsonb_array_length\(p_selections\)[[:space:]]*=[[:space:]]*0[[:space:]]+THEN[[:space:]]+RAISE[[:space:]]+EXCEPTION[[:space:]]+'At least one vote selection is required\.';[[:space:]]+END[[:space:]]+IF;$pattern$,
 '-- Empty selections represent full abstention.','i');
 IF updated=original OR position('-- 7. CHECK EXISTING PARTICIPATION' IN updated)=0 THEN
  RAISE EXCEPTION 'The installed voting function differs from this project version. No changes were made. Apply the current complete testing-voting.sql for testing or voting-controls.sql for scheduled voting.';
 END IF;
 updated:=replace(updated,'-- 7. CHECK EXISTING PARTICIPATION',$guard$

    -- Full-abstention eligibility: empty ballots still require an eligible position.
    IF jsonb_array_length(p_selections) = 0 THEN
        IF LOWER(TRIM(v_student.year_level::text)) ~ '^(1|1st|first)([[:space:]]|$)'
           OR NOT EXISTS (
            SELECT 1 FROM public.positions p
            WHERE p.election_id = p_election_id AND COALESCE(p.is_active, true)
            AND (NOT EXISTS (SELECT 1 FROM public.position_year_levels pyl WHERE pyl.position_id = p.id)
                 OR EXISTS (SELECT 1 FROM public.position_year_levels pyl WHERE pyl.position_id = p.id
                    AND LOWER(TRIM(pyl.year_level::text)) = LOWER(TRIM(v_student.year_level::text))))
        ) THEN RAISE EXCEPTION 'No voting positions are available for this student.';
        END IF;
    END IF;

    -- 7. CHECK EXISTING PARTICIPATION$guard$);
 EXECUTE updated;
END $migration$;
NOTIFY pgrst,'reload schema';
COMMIT;
