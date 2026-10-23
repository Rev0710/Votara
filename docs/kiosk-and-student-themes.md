# Shared kiosk assistance and student themes

## Deploy in this order

1. In Supabase SQL Editor, run or rerun server/kiosk-concurrent-assistance.sql.
   It removes the earlier session-wide and per-EB active-operation limits and
   installs an atomic served counter. Each device keeps its own operation ID.
   It preserves the tables, student records, ballots, and authentication checks.
2. Run server/voting-controls.sql in Supabase SQL Editor. This adds pause controls, notification history, and voting-hour enforcement to the ballot transaction.
3. Commit all changed and new source files, including StudentTheme.css and both SQL files.
4. Deploy the same commit to Render (server) and Vercel (client).

## Expected behavior

- Different devices can assist different students simultaneously in the same
  shared kiosk session, including devices signed into the same EB account.
- Finishing or cancelling releases only the operation owned by that page.
  Closing the shared session remains blocked while any assistance is active.
- Temporary kiosk JWTs are restricted to their active kiosk operation and ballot
  endpoints. Normal student logins still require their database-backed session.
- A 30-second heartbeat maintains the operation while the kiosk is open.
  Successful voting completes it; cancellation releases it.
- The existing submit_votara_vote transaction still enforces one submitted
  ballot per student/election.
- The student theme toggle covers dashboard cards, profile view/edit, password,
  candidates, ballot, results, guidelines and support dialogs. Card surfaces
  use glass styling with an opaque fallback for reduced transparency.

## Checks completed locally

Client production compilation and server JavaScript syntax checks.
The SQL has not been executed against the live database by this task.
## Voting controls and notifications

- Pause/Resume is beside Create Election in EB Election Management. It controls
  a published, open election. A selector appears if several elections are open.
- Both online and kiosk voting follow this control. Conflicting staff changes
  require refreshing rather than overwriting another EB member's decision.
- Election and scheduled continuation dates use Asia/Manila. Voting starts no earlier than 08:00 and
  ends strictly at 17:00. Narrower configured hours are respected. A saved overnight pause permits its scheduled continuation date. Publication,
  open status, configured hours, and one ballot per student still apply.
- The server and the database ballot transaction enforce these restrictions.
  The transaction locks the election row, ordering pauses against submissions.
- Voting screens refresh availability every 5 seconds. Submission always
  rechecks availability on the server, including between screen refreshes.
- Student notification bells display opening, closing, pause, and resume notices.
  Pause/resume history is recorded by a database trigger. Scheduled notices use
  deterministic IDs and actual boundary timestamps, materialized when the bell
  feed is read. The bell polls every 60 seconds while the page is visible.
- Students signing in later can see the last 30 days of notices. These are in-app
  bell updates, not phone/OS push notifications.
- SQL migrations have not been executed against production. Apply both before
  deploying Render and Vercel.
- Local desktop/mobile profile fixtures were visually inspected in both themes.
  Production sessions and live ballots were not exercised.
## Pause confirmation and deployment troubleshooting

Pause and Resume now require confirmation before sending the update. The dialog
keeps save errors visible and does not claim success until the returned saved
pause state matches the requested value. Page alerts have explicit foreground
colors so EB theme overrides cannot wash out the message.

If the API reports VOTING_CONTROLS_NOT_INSTALLED, run the complete
server/voting-controls.sql in the Supabase project used by Render. The script
now also reloads PostgREST's schema cache. Then deploy the changed server and
client from the same commit. Do not apply only the new column: the notice trigger
and ballot function must also be installed.

Permission failures and other database failures now have separate messages;
server logs record the database error code and message. A missing or malformed
pause flag blocks voting until setup is repaired. An unsuccessful pause request
never changes the button to Resume or falsely reports that voting was paused.

The database connectivity check during this change could not connect, so no live
schema inspection or production migration was completed from this workspace.
## Automatic next-morning resume and student controls

Run the UPDATED complete server/voting-controls.sql in the Supabase project
configured on Render, even if an earlier version was already applied. It now
adds voting_resumes_at and resume_due_voting_controls(), updates notification
triggers and the ballot function, and reloads PostgREST's schema cache. Applying
only a column does not install the complete feature. Existing accounts and
ballots are preserved. Redeploy Render and Vercel after applying the migration.

- EB confirmation schedules each pause to end the following day at 08:00
  Asia/Manila. The server computes the timestamp; the client cannot choose it.
- The original election date remains intact. Its scheduled resume date becomes
  an allowed continuation day, subject to the 08:00–17:00 limit and any narrower
  configured voting hours. Resuming does not clear existing vote participation.
- The ballot transaction interprets a due scheduled pause as resumed, even if
  no process ran at exactly 08:00. Requests reconcile the stored pause flag and
  record a resume notification with the scheduled boundary timestamp.
- Student and kiosk screens refresh the server state every five seconds while
  visible, and on focus. Same-browser tabs also signal each other to refresh.
- While paused, Vote becomes Paused; candidate controls, candidate navigation,
  selections, and submission are disabled. Student notices display the exact
  automatic resume date and time. Resume restores controls when hours allow.
- Existing selections are preserved during a pause. Previously submitted ballots
  remain recorded and cannot be submitted again on the continuation day.
- Browser feedback alone is not enforcement: all ballot submissions still pass
  the server and database pause/hour checks.

Local client compilation and server syntax checks passed for this update.
No production migration or live ballot was executed from this workspace.