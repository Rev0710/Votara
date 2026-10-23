> Current state: Temporary testing mode is enabled in source. Apply the complete
> server/testing-voting.sql and deploy both services to disable pause/date/hour
> enforcement in production. Existing voting data is preserved.

# Temporary overnight testing mode

Pause/resume and voting date/hour restrictions are temporarily disabled.
A published election must still have status open. Authentication, year-level
eligibility, valid candidate checks and one ballot per student remain enforced.

## Deploy now

1. Run the entire server/testing-voting.sql file in Supabase SQL Editor.
   This replaces only the ballot function and preserves recorded data.
2. Commit and push all source changes.
3. Redeploy the server on Render and client on Vercel.

The server switch is server/src/config/votingControls.js (enabled:false).
The EB button switch is VOTING_CONTROLS_ENABLED in
client/src/pages/electoralBoard/ElectionManagement.jsx (false).
The student/kiosk availability endpoint now reports paused:false and ignores
dates/hours while testing, so already-open clients refresh to normal Vote labels.
Pause/resume notices are suppressed during testing. Stored pause data is kept.

## Restore later

1. Run the latest entire server/voting-controls.sql in Supabase SQL Editor.
2. Set enabled:true in server/src/config/votingControls.js.
3. Set VOTING_CONTROLS_ENABLED=true in ElectionManagement.jsx.
4. Deploy both services from that commit.

Do not run voting-controls.sql during overnight testing; it reinstates the time
restriction. The testing script must be applied to remove database enforcement
from a database where voting-controls.sql was previously installed.

No production SQL was executed from this task.