# Kiosk ballot abstention and online access visibility

## Apply

1. Run `server/kiosk-abstention.sql` in Supabase SQL Editor. It patches the currently installed ballot function without changing its testing/schedule settings. It stops without changes if the installed function does not match the expected version.
2. Deploy both the server and client. The shared vote service now accepts an empty selections array for full abstention.
3. Keep `server/student-online-access.sql` installed for online activation. If not installed yet, run that separate migration before using Activate Online Access.

The full `testing-voting.sql`, `voting-controls.sql`, and `allow-partial-ballots.sql` sources also include the new abstention behavior so future installs preserve it. Use only the full script appropriate to your intended voting mode.

## Kiosk behavior

Every position has an explicit Abstain radio option. The student must answer each position with either a candidate or Abstain. A position's old required flag does not force a candidate choice. Abstentions are omitted from candidate selections. A student may abstain from every position: one submitted ballot and participation are recorded with zero candidate votes, so turnout still includes that student and they cannot submit again. Existing ballots and vote totals are not deleted or rewritten. Empty ballots still require a student eligible for at least one configured position.

The selected/unselected candidate rows now use paired theme colors, and native radio controls are visible and keyboard accessible. On narrow screens the kiosk header scrolls normally to avoid hiding ballot content.

## Where Online Access appears

After searching/selecting a student in EB > Voters > In-Person Verification, an Online account access card appears immediately below the vote-status banner, including when a vote was already recorded. It shows the Activate Online Access control even if verification is incomplete, with text explaining the required checks.

Voting does not automatically mark the identity verification record as verified. If the record says ID Check Needed, complete the physical ID and registration checklist and select Verify Student. Then the activation control becomes available. The backend still requires an approved, verified, active account with no email and no established personal password. A recorded vote is preserved and does not block online activation.

Live SQL was not executed by this task. Verify deployment in a test election before collecting real ballots.