<<<<<<< HEAD
Votara is an online voting system designed to provide a simple, secure, and organized way for registered voters to participate in an election.
=======
# About VOTARA

VOTARA --- Online Voting System

Team **VOTARA** A modern, secure, and structured web-based student election system.

Project Overview VOTARA is a department-level online voting system designed to reduce registration and election-day delays, simplify Electoral Board (EB) administration, and provide a controlled digital voting workflow for students, EB members, and administrators. Brand Guidelines Brand Identity VOTARA represents a modern, clean, forward-thinking aesthetic using a geometric logo mark, readable typography, and a consistent blue-centered visual identity. Logo Variations

Primary Light Version: Blue icon with dark text on light/white backgrounds.
Monochrome Dark Version: Solid black icon and typography on light backgrounds.
Inverted / Dark Mode Version: Bright blue icon and typography on dark backgrounds. Color Palette Color Hex Usage Deep #1A192B Dark backgrounds and primary text contrast White #FFFFFF Light backgrounds and negative space Serenade #FFE8D6 Accent backgrounds and warm pastel areas Blue Screen #0055FF Primary brand color, CTA elements, logo emblem G Nova #50C8FF Secondary blue, highlights, digital elements Typography
Font: Poppins, sans-serif
Weights: Regular, Medium, Bold
Characters: Uppercase A--Z, lowercase a--z, numbers 0--9, and common symbols. Usage Guidelines
Maintain clear space around the logo.
Preserve logo proportions and orientation.
Maintain strong contrast.

### Main Goals

- Simplify student registration.
- Provide OTP-based verification.
- Allow students to submit required registration documents.
- Support registration selfie capture.
- Support late enrollee registration.
- Provide Electoral Board review and approval.
- Manage party lists and candidates.
- Configure elections and eligible year levels.
- Provide controlled student voting.
- Monitor voting participation.
- Generate election results and reports.
- Maintain audit records.
- Provide administrative oversight.
- Provide a temporary election-day kiosk workflow.


# Project Objectives

VOTARA aims to:

1. Provide a convenient online student registration process.
2. Reduce manual registration and verification delays.
3. Provide controlled access to the student voting system.
4. Allow the Electoral Board to manage the election lifecycle.
5. Support students who enroll after the original student roster is prepared.
6. Improve account security through JWT and password hashing.
7. Require students to establish a personal password before normal dashboard access.
8. Require student profile completion before proceeding to the normal dashboard.
9. Provide organized election monitoring and reporting.
10. Maintain structured records of election-related activities.

# System Roles

VOTARA consists of three primary system roles.

| Role | Main Responsibilities |
|---|---|
| **Student / User** | Registration, OTP verification, account setup, password management, profile photo, and voting |
| **Electoral Board (EB)** | Registration management, late enrollee management, party lists, candidates, elections, kiosk, voting monitoring, results, reports, audit logs, and settings |
| **Admin** | System administration, staff/account management, system monitoring, reports, and audit oversight |

---

# System Overview

The overall VOTARA process follows this structure:

```text
STUDENT / USER
     |
     +-- Student Registration
     |
     +-- OTP Verification
     |
     +-- Registration Requirements
     |
     +-- Document Submission
     |
     +-- Registration Selfie
     |
     +-- Application Submission
     |
     v
ELECTORAL BOARD
     |
     +-- Registration Management
     |
     +-- Late Enrollee Management
     |
     +-- Party List Management
     |
     +-- Candidate Management
     |
     +-- Election Management
     |
     +-- Kiosk Management
     |
     +-- Voting Monitoring
     |
     +-- Results & Reports
     |
     +-- Audit Logs
     |
     +-- Settings
     |
     v
STUDENT ACCOUNT
     |
     +-- Temporary Password
     |
     +-- First Login
     |
     +-- Change Personal Password
     |
     +-- Complete Profile Photo
     |
     v
STUDENT DASHBOARD
     |
     +-- Election Eligibility Check
     |
     +-- Voting
     |
     +-- Voting Participation
     |
     v
RESULTS & REPORTS
     |
     v
ADMINISTRATIVE OVERSIGHT

1. Student enters Student ID and registration information.
2. System verifies the student's information.
3. Student completes OTP verification.
4. Student proceeds to Registration Requirements.
5. Student submits the required documents.
6. Student provides a registration selfie.
7. Registration application is submitted.
8. Electoral Board reviews the application.
9. EB chooses one of the following actions:
   - Approve
   - Reject
   - Correction
10. If approved, the student account is created or activated.
11. A temporary password is generated.
12. The temporary password is sent to the student's registered email.
13. Student logs in using the temporary password.
14. Student is required to change the password.
15. Student completes the required profile photo.
16. Student proceeds to the Student Dashboard.

Student enters Student ID
          |
          v
Student ID not found
          |
          v
Late Enrollee Prompt
          |
          +------------------+
          |                  |
         YES                 NO
          |                  |
          v                  v
Late Enrollee          Return to
Registration           Landing Page
          |
          v
Enter Full Name
          |
          v
Select Year Level
          |
          v
Registration Requirements
          |
          +-- School ID Front
          |
          +-- School ID Back
          |
          +-- Registration Form
          |
          +-- Registration Selfie
          |
          v
Submit Application
          |
          v
EB Late Enrollee Management
          |
          +-----------------------------+
          |             |               |
        APPROVE       REJECT        CORRECTION
          |             |               |
          v             v               v
Create/Activate     Reason          Student
Student Record      Required        Corrects
          |                             |
          v                             |
Create/Activate                       |
Student Account                       |
          |                             |
          v                             |
Generate Temporary Password             |
          |                             |
          v                             |
Send Approval Email                     |
          |                             |
          v                             |
Student First Login                     |
          |                             |
          v                             |
Change Personal Password                |
          |                             |
          v                             |
Complete Profile Photo                  |
          |                             |
          v                             |
Student Dashboard <---------------------+

Late Enrollee Approval
When the Electoral Board approves a late enrollee:
1. The system validates the registration.
2. The student's identity information is checked.
3. If the student does not yet exist in the official students table, the system creates the student record.
4. A student account is created or activated.
5. A temporary password is generated.
6. The password is securely hashed.
7. The account is marked with must_change_password = true.
8. An approval email is sent to the registered email address.
9. A student notification is created.
10. The student logs in using the temporary password.
11. The student must create a personal password.
12. The student must complete their profile photo.
13. The student can then access the dashboard.

Temporary Password
       |
       v
Student Login
       |
       v
Authentication
       |
       v
Temporary Password Accepted
       |
       v
Force Password Change
       |
       v
Student Creates Personal Password
       |
       v
Profile Photo Requirement
       |
       v
Student Takes / Uploads Photo
       |
       v
Student Dashboard

Student Dashboard
       |
       v
Check Election Availability
       |
       v
Check Student Eligibility
       |
       v
Check Year Level
       |
       v
Display Applicable Positions
       |
       v
Select Candidates
       |
       v
Validate Required Choices
       |
       v
Review Ballot
       |
       v
Confirm Vote
       |
       v
Submit Ballot
       |
       v
Record Voting Participation
       |
       v
Voting Complete

Electoral Board Modules
The Electoral Board dashboard contains the following primary modules:
1. Registration Management
2. Late Enrollee Management
3. Party List Management
4. Candidate Management
5. Election Management
6. Kiosk Management
7. Voting Monitoring
8. Results & Reports
9. Audit Logs
10. Settings


Registration Management
The Electoral Board can:

- View registration applications.
- Search and filter applicants.
- Review submitted registration information.
- View submitted documents.
- View registration selfies.
- Approve applications.
- Reject applications.
- Request corrections.

Late Enrollee Management
The Electoral Board can:
- View late enrollee applications.
- Review late enrollee information.
- View submitted school ID documents.
- View registration forms.
- View the registration selfie.
- Review year-level information.
- Approve applications.
- Reject applications with a reason.
- Request corrections with a reason.

Party List Management
The Electoral Board can manage party lists associated with an election.
Functions include:
- Create party lists.
- Edit party list information.
- Review party list status.
- Approve party lists.
- Reject party lists.
- Activate party lists.
- Deactivate party lists.
Candidate Management
The Electoral Board manages candidates participating in an election.
Functions include:
- Add candidates.
- Select registered students.
- Assign candidates to positions.
- Review candidate information.
- Activate candidates.
- Deactivate candidates.
- Prepare candidates for an election.
Election Management
The Electoral Board can configure:
- Election title.
- Election description.
- Election date.
- Election start time.
- Election end time.
- Election status.
- Participating year levels.
- Election positions.
- Required positions.
- Position eligibility.

Kiosk Management
Kiosk Management provides a temporary software-based session that can be operated by an Electoral Board member during election operations.
The kiosk does not require a dedicated physical kiosk device.
A kiosk session can contain:

- Session ID
- Election ID
- EB operator
- Session status
- Start time
- End time
- Last activity
- Number of students served
- Creation timestamp
- Update timestamp

EB Login
   |
   v
Kiosk Management
   |
   v
Select Election
   |
   v
Start Temporary Kiosk Session
   |
   v
Serve Eligible Students
   |
   v
Track Session Activity
   |
   v
Close Kiosk Session

Voting Monitoring
Voting Monitoring allows the Electoral Board to monitor election participation.
The module can provide information such as:
- Total eligible voters.
- Number of students who have voted.
- Number of students who have not voted.
- Voting participation statistics.
- Current election status.

Results & Reports
The Results & Reports module provides election information for the Electoral Board.
It can include:
- Candidate vote totals.
- Position results.
- Election summaries.
- Voting participation statistics.
- Election reports.

Audit Logs
Audit Logs provide records of important Electoral Board and administrative activities.
Examples include:
- Authentication activities.
- Registration actions.
- Late enrollee actions.
- Party list actions.
- Candidate actions.
- Election configuration actions.
- Administrative actions.

Security and Authentication
VOTARA uses multiple security mechanisms.

Authentication:
- JWT-based authentication.
- Role-based authorization.
- Protected API endpoints.
- Active account validation.
- Token expiration.
- Student authentication.
- Electoral Board authentication.
- Admin authentication.

Password Security:
- bcryptjs password hashing.
- Temporary passwords for newly approved accounts.
- Forced first-login password change.
- Personal student passwords.
- Password requirement validation.
- must_change_password account state.

Registration Security:

- Student ID validation.
- OTP verification.
- Registration application review.
- Registration document submission.
- Registration selfie.
- Electoral Board approval.
- Electoral Board rejection.
- Correction workflow.

elections
 |
 +-- 1:M election_year_levels
 |
 +-- 1:M positions
 |      |
 |      +-- 1:M position_year_levels
 |      |
 |      +-- 1:M candidates
 |
 +-- 1:M party_lists
 |
 +-- 1:M vote_participations
 |
 +-- 1:M ballots
        |
        +-- 1:M ballot_votes


students
 |
 +-- 1:1 student_accounts
 |
 +-- 1:M vote_participations
 |
 +-- 1:M candidates


registration_applications
 |
 +-- 1:M registration_documents
 |
 +-- 1:M identity_verifications


staff_users
 |
 +-- 1:M audit_logs

 Technology Stack

Frontend
- React.js
- Vite
- React Router
- Axios
- React Icons
- Poppins
- Responsive CSS

Backend
- Node.js
- Express.js
- JSON Web Token (jsonwebtoken)
- bcryptjs
- dotenv
- CORS
- express-validator
- Nodemon

Database and Storage
- Supabase
- PostgreSQL
- Supabase Storage

Email
- Gmail-based email delivery.
- SMTP configuration.
- Registration-related emails.
- Approval emails.
- Temporary-password delivery.

Development Tools
- Visual Studio Code
- Git
- GitHub
- Supabase Dashboard
- Postman
- Browser Developer Tools
- npm
- PowerShell / Windows Terminal

Note: html5-qrcode existed in the project's dependency history, but QR-based voting and QR-based verification are not part of the finalized VOTARA workflow.


VOTARA/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   ├── student/
│   │   │   ├── electoralBoard/
│   │   │   └── admin/
│   │   │
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   │
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md

#Finalized Scope
The following decisions represent the finalized VOTARA scope.
Voting

- VOTARA uses a web-based voting process.
- Voting eligibility is controlled by configured election rules.
- Student year level determines applicable year-level representation.
- Required positions must be completed before ballot submission.

Year-Level Rules
- 1st Year students do not use the general year-level representative.
- 2nd Year has a 2nd Year Representative.
- 3rd Year has a 3rd Year Representative.
- 4th Year has a 4th Year Representative.


Team VOTARA
Team VOTARA
VOTARA is developed collaboratively by Team VOTARA.

Development Areas
Area	Responsibility
Frontend Development	    React, Vite, responsive user interfaces
Backend Development	        Node.js, Express, REST APIs
Database Development	    Supabase, PostgreSQL, database relationships
Authentication & Security	JWT, bcrypt, authorization, account protection
Election Development	    Elections, positions, candidates, party lists
Voting & Results	        Ballots, voting participation, results
Testing & QA	            Functional and integration testing
UI/UX & Branding	        VOTARA design system and interface consistency
Documentation	            Technical and project documentation


Testing Strategy
Student Testing
The student side should be tested for:

- Valid registration.
- Invalid Student ID.
- OTP verification.
- Registration requirements.
- Document submission.
- Registration selfie.
- Normal approval.
- Late enrollee registration.
- Late enrollee approval.
- Late enrollee rejection.
- Late enrollee correction.
- Temporary-password login.
- Forced password change.
- Profile photo requirement.
- Year-level eligibility.
- Election access.
- Vote submission.
- Duplicate voting prevention.

Electoral Board Testing
The EB side should be tested for:
- EB authentication.
- Registration Management.
- Late Enrollee Management.
- Party List Management.
- Candidate Management.
- Election Management.
- Kiosk Management.
- Voting Monitoring.
- Results & Reports.
- Audit Logs.
- Settings.

Admin Testing
The Admin side should be tested for:
- Admin authentication.
- Staff/account management.
- Administrative oversight.
- System monitoring.
- Reports.
- Audit information.


flowchart TD
    A[Student / User] --> B{Student ID in Official Roster?}
    B -->|Yes| C[Normal Registration]
    B -->|No| D[Late Enrollee Registration]
    C --> E[OTP Verification]
    D --> E
    E --> F[Registration Requirements]
    F --> G[Documents + Registration Selfie]
    G --> H[Submit Registration]
    H --> I[Electoral Board Review]
    I --> J{Decision}
    J -->|Correction| K[Student Corrects Requirements]
    K --> H
    J -->|Reject| L[Application Rejected]
    J -->|Approve| M[Create / Activate Student Account]
    M --> N[Generate Temporary Password]
    N --> O[Send Approval Email]
    O --> P[Student First Login]
    P --> Q[Change Personal Password]
    Q --> R[Complete Profile Photo]
    R --> S[Student Dashboard]
    S --> T{Eligible to Vote?}
    T -->|2nd / 3rd / 4th Year| U[Access Election]
    T -->|1st Year| V[No General Voting Access]
    U --> W[Select Required Candidates]
    W --> X[Review Ballot]
    X --> Y[Submit Vote]
    Y --> Z[Record Voting Participation]
    I --> EB[EB Management]
    EB --> EB1[Registration]
    EB --> EB2[Late Enrollees]
    EB --> EB3[Party Lists]
    EB --> EB4[Candidates]
    EB --> EB5[Elections]
    EB --> EB6[Kiosk]
    EB --> EB7[Voting Monitoring]
    EB --> EB8[Results & Reports]
    EB --> EB9[Audit Logs]
    AD[Admin] --> AD1[Administrative Oversight]
    AD --> AD2[Staff / Account Management]
    AD --> AD3[System Monitoring]
    AD --> AD4[Reports / Audit Review]


Development Roadmap

Foundation
████████████████████ 100%

Authentication & Registration
████████████████████ 100%

EB Management
████████████████████ 100%

Voting & Results
██████████████████░░  90%

Kiosk
██████░░░░░░░░░░░░░░  30%

Testing & Integration
██████░░░░░░░░░░░░░░  30%

Overall Development
████████████████░░░░ ~80%



Future Development
The immediate development priorities are:

1. Kiosk Management
        |
        v
2. Kiosk Session Database Integration
        |
        v
3. Full Student-to-Election End-to-End Testing
        |
        v
4. Security and Permission Testing
        |
        v
5. Automatic Audit Logging Completion
        |
        v
6. Final UI/UX Polish
        |
        v
7. Production Deployment Testing
        |
        v
8. Final Documentation
        |
        v
9. VOTARA Release

Team Members
Add the official team members below:
Team VOTARA

1. John Rev Dela Rosa
2. Ryan Tacaisan
3. Matthew Chin
4. Jeremie Balondon
5. Mark Lester Bachoco
6. Shenea Jane Alamon

VOTARA
Modernizing Student Elections Through a Clean, Secure, and Structured Digital Voting Experience.

Built with
React • Vite • Node.js • Express • Supabase • PostgreSQL • JWT • bcryptjs
Developed by
Team VOTARA

ELECTORAL BOARD
        ↓
EB Login
        ↓
EB Dashboard
        ↓
Kiosk Management
        ↓
Select Election
        ↓
Start Kiosk Session
        ↓
Generate Session ID
        ↓
Kiosk Session Active
        ↓
Serve Eligible Student
        ↓
Verify Student
        ↓
Check Voting Eligibility
        ↓
Eligible?
   ┌────┴────┐
  YES        NO
   ↓          ↓
Allow       Deny Access
Voting      / Return
   ↓
Student Votes
   ↓
Submit Ballot
   ↓
Record Voting Participation
   ↓
Update Students Served
   ↓
Return to Kiosk
   ↓
Next Student
   ↓
Close Kiosk Session
   ↓
Session Summary
   ↓
END

ELECTORAL BOARD (EB) KIOSK FLOW — INSTRUCTIONS
Electoral Board
The Electoral Board (EB) is responsible for managing and supervising the voting kiosk.
EB Login
The EB member logs into the system using their authorized account.
EB Dashboard
After logging in, the EB member is taken to the dashboard where they can manage the election and kiosk.
Kiosk Management
The EB member opens the Kiosk Management section to control the voting kiosk.
Select Election
The EB member selects the election that will be conducted.
Start Kiosk Session
The EB member starts a new voting session for the selected election.
Generate Session ID
The system automatically generates a unique Session ID to identify the current kiosk session.
Kiosk Session Active
The kiosk becomes active and is ready to serve students.
Serve Eligible Student
The next student approaches the kiosk and begins the voting process.
Verify Student
The system verifies the student's identity using the required verification method, such as a QR code or other approved identification.
Check Voting Eligibility
The system checks whether the student is allowed to vote and whether they have already participated in the election.
Eligible?
The system determines if the student is eligible to vote.

If YES:

The system allows the student to proceed.
The student selects and submits their votes.

If NO:

The system denies voting access.
The student is informed that they cannot proceed and is returned from the voting process.
Student Votes
An eligible student selects their preferred candidates/options on the ballot.
Submit Ballot
The student reviews and submits the completed ballot.
Record Voting Participation
The system records that the student has participated in the election to prevent duplicate voting.
Update Students Served
The system updates the kiosk's count of students who have been successfully served.
Return to Kiosk
After the student's voting process is completed, the kiosk returns to the main kiosk screen.
Next Student
The kiosk is ready to serve the next student.
Close Kiosk Session
When voting at the kiosk is finished, the EB member closes the kiosk session.
Session Summary
The system displays a summary of the session, such as the number of students served and participation records.
END
The kiosk session is officially completed.

