-- Install in Supabase SQL Editor before deploying. Existing votes and approvals are unchanged.
BEGIN;
ALTER TABLE public.student_accounts ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS student_accounts_normalized_email_unique ON public.student_accounts(lower(trim(email))) WHERE nullif(trim(email),'') IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.student_online_access (
 account_id uuid PRIMARY KEY REFERENCES public.student_accounts(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE, issued_by uuid NOT NULL, issued_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL, consumed_at timestamptz, email text, challenge_id uuid,
 otp_hash text, otp_expires_at timestamptz, attempts integer NOT NULL DEFAULT 0,
 sent_at timestamptz, send_count integer NOT NULL DEFAULT 0
);
ALTER TABLE public.student_online_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_online_access FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.student_online_access TO service_role;
CREATE OR REPLACE FUNCTION public.student_online_access_eligible(p_account_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.student_accounts a JOIN public.students s ON s.student_id=a.student_id
 JOIN public.registration_applications r ON r.id=a.registration_id AND r.student_id=a.student_id
 WHERE a.id=p_account_id AND nullif(trim(a.email),'') IS NULL AND a.must_change_password=true
 AND a.account_status='active' AND r.application_status='approved'
 AND lower(coalesce(s.enrollment_status::text,'active')) IN ('active','enrolled')
 AND lower(trim(s.year_level::text)) !~ '^(1|1st|first)([[:space:]]|$)'
 AND (SELECT i.verification_status FROM public.identity_verifications i WHERE i.registration_id=r.id ORDER BY i.created_at DESC LIMIT 1)='verified');
$$;
CREATE OR REPLACE FUNCTION public.issue_student_online_access(p_student_id uuid,p_staff_id uuid,p_token_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.student_accounts%ROWTYPE; g public.student_online_access%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.staff_users WHERE id=p_staff_id AND role='electoral_board' AND is_active=true) THEN
 RETURN jsonb_build_object('success',false,'message','Active Electoral Board access is required.'); END IF;
 SELECT a1.* INTO a FROM public.student_accounts a1 JOIN public.students s ON s.student_id=a1.student_id WHERE s.id=p_student_id FOR UPDATE OF a1;
 IF NOT FOUND OR NOT public.student_online_access_eligible(a.id) THEN
 RETURN jsonb_build_object('success',false,'message','Activate the approved and verified account first. Online activation is only for students without email who have not set a personal password.'); END IF;
 SELECT * INTO g FROM public.student_online_access WHERE account_id=a.id;
 IF FOUND AND g.issued_at>now()-interval '60 seconds' THEN
 RETURN jsonb_build_object('success',false,'message','Wait one minute before issuing another activation code.'); END IF;
 INSERT INTO public.student_online_access(account_id,token_hash,issued_by,expires_at) VALUES(a.id,p_token_hash,p_staff_id,now()+interval '30 minutes')
 ON CONFLICT(account_id) DO UPDATE SET token_hash=excluded.token_hash,issued_by=excluded.issued_by,issued_at=now(),expires_at=excluded.expires_at,
 consumed_at=NULL,email=NULL,challenge_id=NULL,otp_hash=NULL,otp_expires_at=NULL,attempts=0,sent_at=NULL,send_count=0;
 RETURN jsonb_build_object('success',true,'expiresAt',now()+interval '30 minutes');
END $$;
CREATE OR REPLACE FUNCTION public.request_student_online_code(p_token_hash text,p_email text,p_challenge_id uuid,p_otp_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE g public.student_online_access%ROWTYPE; a public.student_accounts%ROWTYPE; clean_email text:=lower(trim(p_email));
BEGIN
 SELECT a1.* INTO a FROM public.student_accounts a1 JOIN public.student_online_access x ON x.account_id=a1.id WHERE x.token_hash=p_token_hash FOR UPDATE OF a1;
 IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'message','Invalid or expired activation code. Ask EB for a new code.'); END IF;
 SELECT * INTO g FROM public.student_online_access WHERE account_id=a.id FOR UPDATE;
 IF g.token_hash<>p_token_hash OR g.consumed_at IS NOT NULL OR g.expires_at<=now() OR NOT public.student_online_access_eligible(a.id) THEN
 RETURN jsonb_build_object('success',false,'message','Invalid or expired activation code. Ask EB for a new code.'); END IF;
 IF clean_email IS NULL OR length(clean_email)>254 OR clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
 RETURN jsonb_build_object('success',false,'message','Enter a valid email address.'); END IF;
 IF g.sent_at>now()-interval '30 seconds' THEN
 RETURN jsonb_build_object('success',false,'retryAfter',ceil(extract(epoch FROM g.sent_at+interval '30 seconds'-now())),'message','Please wait before requesting another code.'); END IF;
 IF g.send_count>=5 THEN RETURN jsonb_build_object('success',false,'message','Code request limit reached. Ask EB for a new activation code.'); END IF;
 IF EXISTS(SELECT 1 FROM public.student_accounts WHERE lower(trim(email))=clean_email AND id<>a.id)
 OR EXISTS(SELECT 1 FROM public.registration_applications WHERE lower(trim(email))=clean_email AND student_id<>a.student_id) THEN
 RETURN jsonb_build_object('success',false,'message','This email is unavailable. Use another address.'); END IF;
 UPDATE public.student_online_access SET email=clean_email,challenge_id=p_challenge_id,otp_hash=p_otp_hash,otp_expires_at=now()+interval '5 minutes',
 attempts=0,sent_at=now(),send_count=send_count+1 WHERE account_id=a.id;
 RETURN jsonb_build_object('success',true,'expiresAt',g.expires_at);
END $$;
CREATE OR REPLACE FUNCTION public.finish_student_online_access(p_token_hash text,p_challenge_id uuid,p_otp_hash text,p_password_hash text,p_phone text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE g public.student_online_access%ROWTYPE; a public.student_accounts%ROWTYPE;
BEGIN
 SELECT a1.* INTO a FROM public.student_accounts a1 JOIN public.student_online_access x ON x.account_id=a1.id WHERE x.token_hash=p_token_hash FOR UPDATE OF a1;
 IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'message','Invalid or expired activation code. Ask EB for a new code.'); END IF;
 SELECT * INTO g FROM public.student_online_access WHERE account_id=a.id FOR UPDATE;
 IF g.token_hash<>p_token_hash OR g.consumed_at IS NOT NULL OR g.expires_at<=now() OR NOT public.student_online_access_eligible(a.id) THEN
 RETURN jsonb_build_object('success',false,'message','Invalid or expired activation code. Ask EB for a new code.'); END IF;
 IF g.challenge_id IS NULL OR g.challenge_id<>p_challenge_id OR g.otp_hash IS NULL OR g.otp_expires_at<=now() OR g.attempts>=5 THEN
 RETURN jsonb_build_object('success',false,'message','Email code expired or attempt limit reached. Request another code.'); END IF;
 IF g.otp_hash<>p_otp_hash THEN
 UPDATE public.student_online_access SET attempts=attempts+1 WHERE account_id=a.id;
 RETURN jsonb_build_object('success',false,'message','The email verification code is incorrect.'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('votara-online-email:'||g.email,0));
 IF EXISTS(SELECT 1 FROM public.student_accounts WHERE lower(trim(email))=g.email AND id<>a.id)
 OR EXISTS(SELECT 1 FROM public.registration_applications WHERE lower(trim(email))=g.email AND student_id<>a.student_id) THEN
 RETURN jsonb_build_object('success',false,'message','This email is unavailable. Request a code for another address.'); END IF;
 UPDATE public.student_accounts SET email=g.email,email_verified_at=now(),password_hash=p_password_hash,must_change_password=false,updated_at=now() WHERE id=a.id;
 UPDATE public.registration_applications SET email=g.email,updated_at=now() WHERE id=a.registration_id AND student_id=a.student_id;
 IF nullif(trim(p_phone),'') IS NOT NULL THEN UPDATE public.students SET contact_number=trim(p_phone),profile_updated_at=now() WHERE student_id=a.student_id; END IF;
 DELETE FROM public.student_active_sessions WHERE student_account_id=a.id;
 UPDATE public.student_online_access SET consumed_at=now(),otp_hash=NULL WHERE account_id=a.id;
 RETURN jsonb_build_object('success',true,'studentId',a.student_id,'message','Online access activated. Sign in with your Student ID and new password.');
EXCEPTION WHEN unique_violation THEN RETURN jsonb_build_object('success',false,'message','This email is unavailable. Use another address.');
END $$;
REVOKE ALL ON FUNCTION public.student_online_access_eligible(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.issue_student_online_access(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.request_student_online_code(text,text,uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.finish_student_online_access(text,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.student_online_access_eligible(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.issue_student_online_access(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.request_student_online_code(text,text,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_student_online_access(text,uuid,text,text,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;