# Shared kiosk assistance and student themes

## Deploy in this order

1. In Supabase SQL Editor, run server/kiosk-concurrent-assistance.sql once.
   It replaces a session-wide active-operation unique index if present, adds
   one-active-operation-per-EB uniqueness, and installs an atomic served counter.
   It preserves the tables, student records, ballots, and authentication checks.
   If an EB already has duplicate active operations, finish/cancel those
   operations before rerunning the SQL; the transaction rolls back on failure.
2. Run server/voting-controls.sql in Supabase SQL Editor. This adds pause controls, notification history, and voting-hour enforcement to the ballot transaction.
3. Commit all changed and new source files, including StudentTheme.css and both SQL files.
4. Deploy the same commit to Render (server) and Vercel (client).

## Expected behavior

- Different active EB accounts can assist different students simultaneously in
  the same shared kiosk session.
- Each EB member finishes or cancels their own active assistance before starting
  another. Closing the shared session remains blocked while any assistance is active.
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
- The election date uses Asia/Manila. Voting starts no earlier than 08:00 and
  ends strictly at 17:00. Narrower configured hours are respected. Resume never
  overrides the date, hours, publication, or open-status checks.
- The server and the database ballot transaction enforce these restrictions.
  The transaction locks the election row, ordering pauses against submissions.
- Voting screens refresh availability every 15 seconds. Submission always
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