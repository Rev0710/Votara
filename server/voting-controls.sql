-- Run once in Supabase SQL Editor before deploying both services.
BEGIN;
ALTER TABLE public.elections ADD COLUMN IF NOT EXISTS voting_paused boolean NOT NULL DEFAULT false;

ALTER TABLE public.elections ADD COLUMN IF NOT EXISTS voting_resumes_at timestamptz;

-- A due pause is also interpreted as resumed inside the ballot transaction.
-- Reconcile its stored flag and notification when any client requests updates.
CREATE OR REPLACE FUNCTION public.resume_due_voting_controls()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 UPDATE public.elections SET voting_paused=false
 WHERE voting_paused=true AND voting_resumes_at IS NOT NULL
 AND voting_resumes_at<=clock_timestamp() AND status='open' AND is_published=true;
$$;
REVOKE ALL ON FUNCTION public.resume_due_voting_controls() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resume_due_voting_controls() TO service_role;


CREATE TABLE IF NOT EXISTS public.election_voting_notices (
 id text PRIMARY KEY,
 election_id uuid NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
 message text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.election_voting_notices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.election_voting_notices FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.election_voting_notices TO service_role;

CREATE OR REPLACE FUNCTION public.record_voting_control_notice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_automatic boolean;
BEGIN
 IF NEW.voting_paused IS DISTINCT FROM OLD.voting_paused THEN
  v_automatic := NOT NEW.voting_paused AND NEW.voting_resumes_at IS NOT NULL
    AND NEW.voting_resumes_at <= clock_timestamp();
  INSERT INTO public.election_voting_notices(id,election_id,message,created_at)
  VALUES(gen_random_uuid()::text, NEW.id, NEW.title || CASE WHEN NEW.voting_paused
    THEN ': voting is paused for online students and kiosks. It will resume automatically on '
      || to_char(NEW.voting_resumes_at AT TIME ZONE 'Asia/Manila','FMMonth DD, YYYY FMHH12:MI AM')
      || ' (Asia/Manila).'
    WHEN v_automatic THEN ': voting has resumed automatically. Online and kiosk ballots are available within the configured voting hours.'
    ELSE ': voting has been resumed by the Electoral Board. Voting hours still apply.' END,
    CASE WHEN v_automatic THEN NEW.voting_resumes_at ELSE clock_timestamp() END);
 END IF;
 RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS election_voting_control_notice ON public.elections;
CREATE TRIGGER election_voting_control_notice AFTER UPDATE OF voting_paused ON public.elections
FOR EACH ROW EXECUTE FUNCTION public.record_voting_control_notice();

-- Called by the bell feed: deterministic IDs make notices durable and prevent duplicates.
-- The timestamp is the actual schedule boundary even if the server was asleep then.
CREATE OR REPLACE FUNCTION public.get_election_voting_notices()
RETURNS SETOF public.election_voting_notices
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM public.resume_due_voting_controls();
 INSERT INTO public.election_voting_notices(id,election_id,message,created_at)
 SELECT e.id::text || '-' || n.kind || '-' || n.at_time::text, e.id,
 e.title || CASE WHEN n.kind='opens'
  THEN ': voting hours have opened. Vote between 8:00 AM and 5:00 PM (Asia/Manila), within the configured election schedule. Any Electoral Board pause still applies.'
  ELSE ': voting hours have closed. Online and kiosk ballots can no longer be submitted.' END,
 n.at_time
 FROM public.elections e
 CROSS JOIN LATERAL (SELECT e.election_date AS voting_day UNION SELECT (e.voting_resumes_at AT TIME ZONE 'Asia/Manila')::date WHERE e.voting_resumes_at IS NOT NULL AND (e.voting_resumes_at AT TIME ZONE 'Asia/Manila')::date >= e.election_date) d
 CROSS JOIN LATERAL (VALUES
 ('opens', (d.voting_day + GREATEST(COALESCE(e.start_time::time,'08:00'::time),'08:00'::time)) AT TIME ZONE 'Asia/Manila'),
 ('closes', (d.voting_day + LEAST(COALESCE(e.end_time::time,'17:00'::time),'17:00'::time)) AT TIME ZONE 'Asia/Manila')
 ) n(kind,at_time)
 WHERE e.is_published=true AND e.status IN ('open','closed')
 AND n.at_time <= now() AND n.at_time >= now()-interval '30 days'
 ON CONFLICT (id) DO NOTHING;
 RETURN QUERY SELECT n.* FROM public.election_voting_notices n
 JOIN public.elections e ON e.id=n.election_id
 WHERE e.is_published=true AND n.created_at >= now()-interval '30 days'
 ORDER BY n.created_at DESC LIMIT 30;
END;
$$;
REVOKE ALL ON FUNCTION public.get_election_voting_notices() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_election_voting_notices() TO service_role;

CREATE OR REPLACE FUNCTION public.submit_votara_vote(p_election_id uuid, p_student_id uuid, p_selections jsonb, p_ballot_token_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE

    -- ========================================================
    -- ELECTION
    -- ========================================================

    v_election RECORD;


    -- ========================================================
    -- STUDENT
    -- ========================================================

    v_student RECORD;


    -- ========================================================
    -- PARTICIPATION
    -- ========================================================

    v_participation RECORD;


    -- ========================================================
    -- BALLOT
    -- ========================================================

    v_ballot_id uuid;


    -- ========================================================
    -- SELECTION PROCESSING
    -- ========================================================

    v_selection jsonb;

    v_position_id uuid;

    v_candidate_id uuid;

    v_position RECORD;

    v_candidate RECORD;


    -- ========================================================
    -- COUNTS
    -- ========================================================

    v_selection_count integer;

BEGIN

    -- ========================================================
    -- 1. BASIC INPUT VALIDATION
    -- ========================================================

    IF p_election_id IS NULL THEN

        RAISE EXCEPTION
            'Election ID is required.';

    END IF;


    IF p_student_id IS NULL THEN

        RAISE EXCEPTION
            'Student ID is required.';

    END IF;


    IF p_selections IS NULL THEN

        RAISE EXCEPTION
            'Vote selections are required.';

    END IF;


    IF jsonb_typeof(p_selections) <> 'array' THEN

        RAISE EXCEPTION
            'Vote selections must be a JSON array.';

    END IF;


    -- Empty selections are allowed for an intentional full-abstention ballot.


    -- ========================================================
    -- 2. PREVENT CONCURRENT DOUBLE VOTING
    --
    -- The lock is transaction-level and automatically released
    -- when this function finishes.
    --
    -- It prevents two simultaneous requests from the same
    -- student/election from both being accepted.
    -- ========================================================

    PERFORM pg_advisory_xact_lock(
        hashtext(
            p_election_id::text
            || ':'
            || p_student_id::text
        )
    );


    -- ========================================================
    -- 3. LOAD ELECTION
    -- ========================================================

    SELECT
        e.*
    INTO
        v_election
    FROM
        public.elections e
    WHERE
        e.id = p_election_id
    FOR SHARE;


    IF NOT FOUND THEN

        RAISE EXCEPTION
            'Election not found.';

    END IF;


    -- ========================================================
    -- 4. ELECTION MUST BE PUBLISHED
    -- ========================================================

    IF COALESCE(
        v_election.is_published,
        false
    ) <> true THEN

        RAISE EXCEPTION
            'This election is not published.';

    END IF;


    -- ========================================================
    -- 5. ELECTION MUST BE OPEN
    --
    -- VOTARA uses:
    --
    --   draft
    --   scheduled
    --   open
    --   closed
    --   cancelled
    --
    -- "open" is the active voting state.
    -- ========================================================

    IF LOWER(
        COALESCE(
            v_election.status,
            ''
        )
    ) <> 'open' THEN

        RAISE EXCEPTION
            'The election is not currently open for voting.';

    END IF;


    -- Enforced inside the ballot transaction while the election row is locked.
    IF COALESCE(v_election.voting_paused, false) AND (v_election.voting_resumes_at IS NULL OR clock_timestamp() < v_election.voting_resumes_at) THEN
        RAISE EXCEPTION 'Voting is paused by the Electoral Board.';
    END IF;
    IF ((clock_timestamp() AT TIME ZONE 'Asia/Manila')::date < v_election.election_date OR ((clock_timestamp() AT TIME ZONE 'Asia/Manila')::date <> v_election.election_date AND (clock_timestamp() AT TIME ZONE 'Asia/Manila')::date IS DISTINCT FROM (v_election.voting_resumes_at AT TIME ZONE 'Asia/Manila')::date))
       OR (clock_timestamp() AT TIME ZONE 'Asia/Manila')::time <
          GREATEST(COALESCE(v_election.start_time::time, '08:00'::time), '08:00'::time)
       OR (clock_timestamp() AT TIME ZONE 'Asia/Manila')::time >=
          LEAST(COALESCE(v_election.end_time::time, '17:00'::time), '17:00'::time) THEN
        RAISE EXCEPTION 'Voting is available only on the election date between 8:00 AM and 5:00 PM (Asia/Manila), within the configured schedule.';
    END IF;

    -- ========================================================
    -- 6. LOAD STUDENT
    -- ========================================================

    SELECT
        s.*
    INTO
        v_student
    FROM
        public.students s
    WHERE
        s.id = p_student_id
    FOR SHARE;


    IF NOT FOUND THEN

        RAISE EXCEPTION
            'Student not found.';

    END IF;


    -- ========================================================

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

    -- 7. CHECK EXISTING PARTICIPATION
    --
    -- If the row does not exist yet, create it as not voted.
    -- ========================================================

    SELECT
        vp.*
    INTO
        v_participation
    FROM
        public.vote_participations vp
    WHERE
        vp.election_id = p_election_id
        AND vp.student_id = p_student_id
    FOR UPDATE;


    IF FOUND THEN

        IF COALESCE(
            v_participation.has_voted,
            false
        ) = true THEN

            RAISE EXCEPTION
                'This student has already voted in this election.';

        END IF;

    ELSE

        INSERT INTO public.vote_participations (
            election_id,
            student_id,
            has_voted,
            voted_at,
            created_at,
            updated_at
        )
        VALUES (
            p_election_id,
            p_student_id,
            false,
            NULL,
            now(),
            now()
        );

    END IF;


    -- ========================================================
    -- 8. COUNT SELECTIONS
    -- ========================================================

    v_selection_count =
        jsonb_array_length(
            p_selections
        );


    -- ========================================================
    -- 9. PROCESS EACH SELECTION
    -- ========================================================

    FOR v_selection IN
        SELECT
            value
        FROM
            jsonb_array_elements(
                p_selections
            )
    LOOP


        -- ----------------------------------------------------
        -- POSITION ID
        -- ----------------------------------------------------

        IF NOT (
            v_selection ? 'positionId'
        ) THEN

            RAISE EXCEPTION
                'Each vote selection must contain a positionId.';

        END IF;


        IF NOT (
            v_selection ? 'candidateId'
        ) THEN

            RAISE EXCEPTION
                'Each vote selection must contain a candidateId.';

        END IF;


        BEGIN

            v_position_id :=
                (v_selection ->> 'positionId')::uuid;

        EXCEPTION
            WHEN invalid_text_representation THEN

                RAISE EXCEPTION
                    'Invalid position ID in vote selection.';

        END;


        BEGIN

            v_candidate_id :=
                (v_selection ->> 'candidateId')::uuid;

        EXCEPTION
            WHEN invalid_text_representation THEN

                RAISE EXCEPTION
                    'Invalid candidate ID in vote selection.';

        END;


        -- ----------------------------------------------------
        -- VALIDATE POSITION
        -- ----------------------------------------------------

        SELECT
            p.*
        INTO
            v_position
        FROM
            public.positions p
        WHERE
            p.id = v_position_id
            AND p.election_id = p_election_id
            AND COALESCE(
                p.is_active,
                true
            ) = true;


        IF NOT FOUND THEN

            RAISE EXCEPTION
                'The selected position is invalid or inactive.';

        END IF;


        -- ----------------------------------------------------
        -- PREVENT DUPLICATE POSITION SELECTIONS
        -- ----------------------------------------------------

        IF (
            SELECT
                COUNT(*)
            FROM
                jsonb_array_elements(
                    p_selections
                ) AS duplicate_check(value)
            WHERE
                (duplicate_check.value ->> 'positionId') =
                v_position_id::text
        ) > 1 THEN

            RAISE EXCEPTION
                'A position cannot have multiple selections.';

        END IF;


        -- ----------------------------------------------------
        -- YEAR-LEVEL ELIGIBILITY
        --
        -- If a position has year-level configuration,
        -- the student's year level must be included.
        --
        -- If a position has no year-level configuration,
        -- it is treated as generally available.
        -- ----------------------------------------------------

        IF EXISTS (
            SELECT
                1
            FROM
                public.position_year_levels pyl
            WHERE
                pyl.position_id = v_position_id
        ) THEN

            IF NOT EXISTS (
                SELECT
                    1
                FROM
                    public.position_year_levels pyl
                WHERE
                    pyl.position_id = v_position_id
                    AND LOWER(
                        TRIM(
                            pyl.year_level
                        )
                    ) =
                    LOWER(
                        TRIM(
                            v_student.year_level
                        )
                    )
            ) THEN

                RAISE EXCEPTION
                    'The student is not eligible to vote for the selected position.';

            END IF;

        END IF;


        -- ----------------------------------------------------
        -- VALIDATE CANDIDATE
        --
        -- Candidate must:
        --   1. Exist
        --   2. Belong to this election
        --   3. Belong to this position
        --   4. Be active
        --
        -- approval_status is intentionally ignored.
        -- ----------------------------------------------------

        SELECT
            c.*
        INTO
            v_candidate
        FROM
            public.candidates c
        WHERE
            c.id = v_candidate_id
            AND c.election_id = p_election_id
            AND c.position_id = v_position_id
            AND COALESCE(
                c.is_active,
                true
            ) = true;


        IF NOT FOUND THEN

            RAISE EXCEPTION
                'The selected candidate is invalid or inactive.';

        END IF;


    END LOOP;


    -- Unselected positions are abstentions. Every supplied selection has
    -- already passed position, candidate and year-level validation above.

    -- ========================================================
    -- 11. CREATE BALLOT
    -- ========================================================

    INSERT INTO public.ballots (
        election_id,
        ballot_token_hash,
        submitted_at,
        status,
        created_at
    )
    VALUES (
        p_election_id,
        p_ballot_token_hash,
        now(),
        'submitted',
        now()
    )
    RETURNING
        id
    INTO
        v_ballot_id;


    -- ========================================================
    -- 12. CREATE INDIVIDUAL BALLOT VOTES
    -- ========================================================

    INSERT INTO public.ballot_votes (
        ballot_id,
        position_id,
        candidate_id,
        created_at
    )
    SELECT
        v_ballot_id,

        (selection.value ->> 'positionId')::uuid,

        (selection.value ->> 'candidateId')::uuid,

        now()

    FROM
        jsonb_array_elements(
            p_selections
        ) AS selection(value);


    -- ========================================================
    -- 13. MARK STUDENT AS HAVING VOTED
    -- ========================================================

    UPDATE public.vote_participations

    SET
        has_voted = true,

        voted_at = now(),

        updated_at = now()

    WHERE
        election_id = p_election_id

        AND student_id = p_student_id;


    -- ========================================================
    -- 14. RETURN SUCCESS
    -- ========================================================

    RETURN jsonb_build_object(

        'success',
        true,

        'ballotId',
        v_ballot_id,

        'message',
        'Vote submitted successfully.'

    );


END;
$function$
;
REVOKE ALL ON FUNCTION public.submit_votara_vote(uuid,uuid,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_votara_vote(uuid,uuid,jsonb,text) TO service_role;
REVOKE ALL ON FUNCTION public.record_voting_control_notice() FROM PUBLIC, anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
