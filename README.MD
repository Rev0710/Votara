VOTARA is a school-department election system designed to manage student registration, identity verification, voting, Electoral Board operations, and system administration. The system supports secure, transparent, and anonymous elections.

1. Student / Voter Flow
Start → Landing Page → Registration → Verification → Login → Voting
Step 1: Landing Page
The student visits the VOTARA landing page to view election information, registration status, announcements, and access guidelines. The student can choose to register or log in.
Step 2: Choose Registration Method
The student selects one of two registration methods:

Online Registration: The student registers using a device and submits the required documents.


In-Person Registration: The student visits the VOTARA registration desk and presents a physical Student ID.

Step 3: Online Registration Process
The student fills out the registration form, uploads the required documents, takes a real-time selfie when required, and submits the application. The documents and application information are saved in Supabase (PostgreSQL).
Step 4: In-Person Registration Process
The student goes to the registration desk and presents a physical Student ID. The Poll Worker or Electoral Board verifies the ID and student information. After successful verification, the authorized staff member selects Verified, and the account is activated.
Step 5: Electoral Board Verification
The Electoral Board reviews submitted documents and the student's selfie for online registration. The board checks the student's eligibility and makes an approval decision.

Approved: The system generates a temporary password and sends a notification to the student.


Needs Correction / Rejected: The student is notified and may submit corrections or reapply according to the rules.

Step 6: Notification to Student
The student receives an email or in-app notification about the registration status, including approval, rejection, or a request for correction.
Step 7: First Login
The student logs in using the Student ID or email and temporary password provided by the Electoral Board. The student must create a permanent password before continuing.
Step 8: Remote Voting
During the election period, the system checks the student's eligibility and verifies OTP when required. The student views the randomized ballot, selects candidates, and submits the vote. The system records the anonymous ballot and provides confirmation.
Step 9: Kiosk Voting
For on-campus voting, the student presents their physical ID to the Poll Worker. The Poll Worker issues a one-time PIN. The student enters their Student ID and PIN at the kiosk, votes, and submits the ballot. The kiosk vote is recorded as final according to the system rules.
Step 10: Late Enrollment / Same-Day Registration
Students who have not registered previously may submit a late enrollment request online or in person. The Electoral Board verifies enrollment status, supporting documents, and eligibility before approving or rejecting the request.
2. Electoral Board (EB) Flow
Start → EB Login → Rate Limit Check → Credential Validation → EB Dashboard
Step 1: EB Login
The Electoral Board enters their email and password. The system performs a rate limit check and validates the login credentials.

Invalid: The system may apply a temporary lockout.


Valid: The user proceeds to the EB Dashboard.

Step 2: Dashboard Overview
The Electoral Board can view registered students, pending applications, approved students, remote votes, kiosk votes, and turnout statistics.
Step 3: Online Registration Management
The EB reviews pending applications, checks submitted documents, views student selfies, verifies student information, approves or rejects applications, and notifies students.
Step 4: In-Person Verification
The EB searches for the Student ID, views student details, verifies the physical ID, and selects Verified when the student meets the requirements.
Step 5: Late Enrollment Management
The EB reviews late enrollment requests, checks enrollment status, verifies documents, approves or rejects requests, and notifies students.
Step 6: Party List Management
The EB adds and edits party lists, sets party descriptions, approves or rejects party lists, views party candidates, and activates or deactivates parties.
Step 7: Candidate Management
The EB adds candidates, assigns positions, performs required approval procedures, and monitors election status.
Step 8: Voting Monitoring
The EB monitors real-time voting activity, views voter status, checks kiosk and Poll Worker activity, filters voting records, and handles reported issues.
Step 9: Results and Reports
The EB generates election results, views turnout by year level, exports reports in PDF or CSV format, and supports ballot-count verification.
Step 10: Audit Logs
The EB views system logs, tracks registration and election activities, searches and filters records, and maintains tamper-evident audit records.
3. Admin Flow
Start → Admin Login → Rate Limit Check → Credential Validation → Admin Dashboard
Step 1: Admin Login
The administrator enters their email and password. The system checks the login rate limit and validates the credentials.

Invalid: The system may apply a temporary lockout.


Valid: The administrator proceeds to the Admin Dashboard.

Step 2: System Dashboard
The administrator views system health, total users, election status, server usage, and activity logs.
Step 3: User and Access Management
The administrator creates and manages user accounts, manages Electoral Board and Poll Worker accounts, sets roles and permissions, and resets accounts when authorized.
Step 4: Data Management
The administrator manages student data, updates enrollment status, manages collections, performs backups and restoration, and carries out authorized data cleanup.
Step 5: System Configuration
The administrator configures system parameters, email and SMS settings, rate limiting, security settings, and maintenance mode.
Step 6: Monitoring and Logs
The administrator monitors system logs, failed login attempts, OTP and PIN attempts, suspicious activities, and exports logs.
Step 7: Support and Troubleshooting
The administrator handles user issues, assigns Poll Workers, fixes system errors, manages server resources, and provides technical support.
Step 8: Reports and Analytics
The administrator generates system usage reports, reviews user activity, views election summaries, reviews security incidents, and exports data.
4. Shared Security and Technology
The VOTARA system uses security controls to protect student accounts, voting processes, and system records.
Security Features:

Secure authentication using JWT or sessions.


Password hashing using bcrypt or Argon2.


Rate limiting and brute-force protection.


Role-based access control.


Input validation and security middleware.


HTTPS and secure connections.


Supabase Row Level Security (RLS).


Audit logging and database backup.


Anonymous ballot storage.

Technology Stack:

Frontend: React and Vite.


Backend: Node.js and Express.js.


Database: Supabase PostgreSQL.


Storage: Supabase Storage.

