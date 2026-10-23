-- TEMPORARY OVERNIGHT TESTING: run in Supabase SQL Editor.
-- Keeps authentication, published/open status, candidate validation and one ballot
-- per student. Removes only pause/date/hour restrictions from the ballot function.
-- Existing ballots and accounts are preserved.
-- Restore by running voting-controls.sql and enabling both source switches.
-- Allows abstention by omitting positions; requires at least one selection.
-- Changes only the supplied function; no votes or positions are deleted.
BEGIN;
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


    IF jsonb_array_length(p_selections) = 0 THEN

        RAISE EXCEPTION
            'At least one vote selection is required.';

    END IF;


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
NOTIFY pgrst, 'reload schema';
COMMIT;
