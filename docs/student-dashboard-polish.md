# Student dashboard polish — October 18, 2026

Updated the existing local project at C:\Users\ysaafyloz\Documents\VOTARA. Changes are local, uncommitted, and not pushed to GitHub.

- Terms and Privacy contents links remain readable on hover/focus in both themes.
- About, Contact, and election-result message cards use themed translucent surfaces and readable text.
- Removed number badge backgrounds from the guidelines and About cards.
- Corrected report dialog X, Cancel, Done, and supporting text contrast. Explicitly imported its existing Settings stylesheet.
- Search uses a rounded focus ring, without an inner rectangular outline, and opens dashboard, voting, candidates, results, guidelines, settings, About, Contact, Terms, Privacy, or issue reporting.
- Candidate directory cards are capped at 360px on larger screens and fit the available width on phones; images remain 180px high.
- Choosing an already-selected candidate clears it. Removed the browser-side rule requiring a candidate for every position. Only chosen positions are sent; confirmation lists skipped positions. At least one candidate must still be selected.

Validation: production build passes (existing banner/export/bundle warnings remain). Server suite: 61 native tests and 3 Vitest tests pass; 59 pre-existing TODO tests remain. Checked desktop dark/light appearance, phone layout, feature search, policy links, report controls, and candidate deselection using isolated mock data. No actual votes or reports were submitted to the live database.

Voting limitation: the database function submit_votara_vote is not defined in the checked-in source. The server-side tests verify that partial selections reach that existing function and invalid/duplicate choices are rejected, but do not verify the live function's treatment of omitted required positions. Verify a partial ballot in a test election before relying on it in a real election. No database function or election rules were changed.

Open the same VOTARA folder in VS Code and refresh the running student page. No git pull is needed for these local edits.
