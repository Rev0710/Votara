# Student dashboard update

Applied locally on 17 October 2026 to the existing Documents/VOTARA project. No commit, GitHub push, or deployment was performed.

## Requested changes

- A viewport-height sidebar with the logo at the top and logout at the bottom. Only the main content scrolls; the navigation stays in place on long dashboard, candidate, about, policy, and terms pages.
- A responsive navigation drawer on phones, with an outside-click backdrop and Escape support. On very short screens, navigation can scroll internally so every item remains reachable.
- A saved light/dark toggle immediately beside the search field. Theme styles are scoped to the student dashboard.
- A glass header and card surfaces using the existing blue/navy palette and inherited fonts, with clearer supporting text and dark-mode contrast.
- Dot-pattern backgrounds throughout the student content area, including the guidelines page.
- Filled dot silhouettes for every main navigation icon, matching the existing dashboard icon style. The Votara brand logo is unchanged.
- Guidelines organized into three readable cards without removing the existing twelve guidelines.
- Connected the existing student concern and admin reply routes. Student submissions use `/api/students/issues`; administrators use `/api/admin/student-issue-reports`.

The existing StudentDashboard.css file, including the owner's previous edit, is byte-for-byte unchanged. New styles are isolated in StudentDashboard.workspace.css.

## Concern replies

Students: Settings → Report an Issue → select a category → submit details. Report history shows the current status, administrator response, and update timeline.

Administrators: System Settings → Security → Student issue reports. Enter an administrator response and save it; the existing controls also support status changes.

The student endpoints inherit the existing student-session middleware. The administrator controller verifies an active administrator account. Report history remains restricted to its owner or an authorized administrator.

A read-only Supabase check confirmed that `student_issue_reports`, `student_issue_report_history`, and the attachment bucket `student-issue-attachments` are available. No real student records, reports, replies, or votes were created or changed during verification.

## Validation

- Client production build passed. Existing unrelated banner/export/bundle-size warnings remain.
- Server tests passed: 58 security/report regression checks plus 3 existing Vitest checks. The 59 existing TODO tests remain unfinished.
- Nine new report tests cover submission, administrator queue access, replies visible in student history, student isolation, inactive/unauthorized administrators, validation, signed attachment links, and route mounting.
- Browser preview used isolated test data. Checked 320px and 390px phones, a 768px tablet, and a 1280px desktop; checked content overflow, full-height navigation, independent scrolling, theme switching and persistence, and a simulated concern submission.
- The existing palette, font declarations, voting logic, election settings, registration flow, and administrator interface were preserved.

Restart the backend and frontend development processes and refresh the student page to load the new server routes and styles. No pull or ZIP extraction is required for this local checkout.
