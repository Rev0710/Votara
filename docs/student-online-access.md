# Online access for approved kiosk students

## Install and deploy

1. Back up the database and run the entire `server/student-online-access.sql` in Supabase SQL Editor.
2. Deploy the server on Render and client on Vercel from the same commit.
3. Use the existing Gmail email configuration. No additional secrets are required.

The migration preserves account IDs, registration approvals, identity verification, participation and ballots. It adds an email verification timestamp, an activation table and restricted server-only functions. A normalized email uniqueness index intentionally fails installation if existing addresses conflict; resolve those records deliberately rather than deleting any automatically. SQL was prepared locally, not executed against production.

## EB workflow

Open Voters > In-Person Verification, find the approved student and complete the existing in-person verification. Activate the account with the existing control if it is not active. Click **Activate Online Access**, confirm the physical ID was checked for this request, then generate the code. Give the code only to that student.

Codes expire after 30 minutes. A replacement invalidates the previous code; replacement requests have a one-minute cooldown. The code is a bearer credential, is displayed only in the current dialog, is not placed in URLs or browser storage, and is stored only as a hash in the database. Existing staff request auditing records issuance without storing codes.

This feature is for approved, verified, active students who have no linked email and still require an initial password change. It cannot overwrite an established personal password or an existing email. It remains available after voting; it does not check election availability or change vote participation.

## Student workflow

Student Login > **Already registered at the kiosk? Activate your account.**

1. Paste the activation code and enter an email address.
2. Receive the 6-digit email code, enter it, create and confirm a personal password, and optionally add a contact number.
3. Finish activation. The page signs in through the existing student-login endpoint and opens the current student dashboard. Existing mandatory password/photo setup steps are respected. If automatic sign-in fails after activation, use Student Login with the Student ID and new password; activation does not need to be repeated.

Email supports password recovery. Email and phone are not new login identifiers. Phone is a contact detail and is not verified or used as an authentication factor. Email is shown in Settings > Profile; existing contact-number editing remains available. The linked email is read-only in the profile form, since this feature does not implement email replacement.

## Safeguards

- No second account is created; the existing account ID and registration ID are updated in one database transaction.
- Approval, latest identity verification, enrollment, account eligibility, code expiry and consumption are checked again when activating.
- OTP lifetime: five minutes; maximum five incorrect attempts per code; 30-second resend cooldown; maximum five sends per activation grant.
- Activation request endpoints also have IP rate limits. EB issuance is limited by authenticated staff identity.
- Passwords use the existing exactly-eight-character student policy and bcrypt with cost 12.
- Contact number is optional. Empty input preserves any existing number.
- On success, old normal student sessions are invalidated. The one-time grant is consumed atomically; simultaneous retries cannot both complete.
- Activation/OTP/password values are not logged. The activation table has RLS enabled and API access only for the server service role.

## Review before release

Use disposable records in a test database: approved verified/no-email student who already voted; the same account without a vote; expired/replaced/used codes; incorrect OTP and resend limits; email already linked to another student; account with an established password; canceled EB dialog; optional phone left blank. Confirm the original vote totals and participation remain unchanged. Check keyboard navigation, screen-reader labels, light/dark appearance, and narrow phone widths. Sending a real email and running the live migration require deployment verification by the operator.

## Disable if needed

Revert the activation UI imports/links and new route mounts in source, then deploy. Keep the migration and any linked account emails/passwords; dropping new structures is not required to hide the feature. Never reset student records or voting tables to disable activation.
## Activation connection errors and password controls

The activation page has independent Show/Hide controls and a live checklist for the existing student password policy. This is a VOTARA password, not the password for the student's email provider. Password values are cleared after confirmed activation and are never stored in local storage. Existing EB/operator sessions are kept separate.

A browser error ERR_NAME_NOT_RESOLVED means it could not resolve the API hostname. It is not an OTP or password validation response. Check the configured VITE_API_BASE_URL and network/DNS availability. The page preserves entered details when the activation request cannot reach the server. A completed activation followed by a failed sign-in is shown as account-ready, with a link to sign in normally.
