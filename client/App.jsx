import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import MaintenanceGate from './src/MaintenanceGate';
import EBWorkspace from './src/pages/electoralBoard/EBWorkspace';
import AdminWorkspace from './src/pages/admin/AdminWorkspace';
import AdminLateEnrollees from './src/pages/admin/AdminLateEnrollees';
import VotaraIntro from "./src/components/VotaraIntro";

// =====================================================
// PUBLIC / AUTH PAGES
// =====================================================
import Vote from "./src/pages/student/Vote";
import LandingPage from "./src/pages/public/LandingPage";
import Register from "./src/pages/auth/Register";
import LateEnrolleeForm from "./src/pages/public/LateEnrolleeForm";
import OTPVerification from "./src/pages/auth/OTPVerification";
import StudentRegistration from "./src/pages/auth/StudentRegistration";
import RegistrationConfirmation from "./src/pages/auth/RegistrationConfirmation";
import RegistrationSubmitted from "./src/pages/public/RegistrationSubmitted";
import StudentLogin from "./src/pages/auth/StudentLogin";
import ForgotPassword from "./src/pages/auth/ForgotPassword";
import AccountSelection from "./src/pages/auth/AccountSelection";
import ChangeTemporaryPassword from "./src/pages/auth/ChangeTemporaryPassword";
import UploadProfilePicture from "./src/pages/auth/UploadProfilePicture";
import AdminRegister from "./src/pages/auth/AdminRegister";
import StaffLogin from "./src/pages/auth/StaffLogin";
import StaffChangePassword from "./src/pages/auth/StaffChangePassword";

// =====================================================
// ADMIN
// =====================================================

import AdminDashboard from "./src/pages/admin/AdminDashboard";
import RegistrationRequirements from "./src/pages/auth/RegistrationRequirements";
import AdminDataManagement from "./src/pages/admin/AdminDataManagement";
import AdminUserAccessManagement from "./src/pages/admin/AdminUserAccessManagement";


import EBCandidateManagement from "./src/pages/electoralBoard/EBCandidateManagement";
import ManagePartyList from "./src/pages/electoralBoard/ManagePartyList";
import ElectionManagement from "./src/pages/electoralBoard/ElectionManagement";
import CreateElection from "./src/pages/electoralBoard/CreateElection";

import KioskVoting from "./src/pages/electoralBoard/KioskVoting";
import ElectoralBoardAuditLogs from "./src/pages/electoralBoard/AuditLogs";
import AdminAuditLogs from "./src/pages/admin/AdminAuditLogs";
import Reports from "./src/pages/admin/Reports";
import SystemSettings from "./src/pages/admin/SystemSettings";

import StudentDashboard from "./src/pages/student/StudentDashboard";
import Settings from "./src/pages/student/Settings";

import ElectoralBoardLogin from "./src/pages/auth/ElectoralBoardLogin";

import EBDashboard from "./src/pages/electoralBoard/EBDashboard";

import "./App.css";
import "./src/pages/admin/AdminWorkspace.css";
import "./src/pages/electoralBoard/EBWorkspace.css";


const LoginPage = () => {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Poppins, sans-serif",
            }}
        >
            <h1>Login Page</h1>
        </div>
    );
};


const App = () => {
    const location = useLocation();
    // Play the intro only on the initial visit to the public root URL.
    // Route changes later in this SPA do not restart the intro.
   const [showInitialIntro, setShowInitialIntro] = useState(
    () => location.pathname === "/"
);

if (showInitialIntro) {
    return (
        <VotaraIntro
            onComplete={() => setShowInitialIntro(false)}
        />
    );
}

    return (
        <div
            className="page-transition"
            key={location.pathname}
        >
            <MaintenanceGate><AdminWorkspace><EBWorkspace><Routes location={location}>
<Route path="/admin/late-enrollees" element={<AdminLateEnrollees/>}/>


                <Route
                    path="/"
                    element={<LandingPage />}
                />


                <Route
                    path="/register"
                    element={<Register />}
                />


                <Route
                    path="/late-enrollee"
                    element={<LateEnrolleeForm />}
                />


                {/* =================================================
                    OTP VERIFICATION
                ================================================= */}

                <Route
                    path="/verify-otp"
                    element={<OTPVerification />}
                />


                {/* =================================================
                    STUDENT REGISTRATION DETAILS
                    After OTP verification
                ================================================= */}

                <Route
                    path="/student-registration"
                    element={<StudentRegistration />}
                />


                {/* =================================================
                    REGISTRATION CONFIRMATION
                ================================================= */}

                <Route
                    path="/registration-confirmation"
                    element={<RegistrationConfirmation />}
                />


                {/* =================================================
                    REGISTRATION SUBMITTED
                ================================================= */}

                <Route
                    path="/registration-submitted"
                    element={<RegistrationSubmitted />}
                />


                {/* =================================================
                    STUDENT LOGIN
                ================================================= */}

                <Route
                    path="/student-login"
                    element={<StudentLogin />}
                />


                {/* =================================================
                    CHANGE TEMPORARY PASSWORD
                ================================================= */}

                <Route
                    path="/change-password"
                    element={<ChangeTemporaryPassword />}
                />


                {/* =================================================
                    PROFILE PICTURE
                ================================================= */}

                <Route
                    path="/upload-profile-picture"
                    element={<UploadProfilePicture />}
                />


                {/* =================================================
                    STUDENT DASHBOARD
                ================================================= */}

                <Route
                    path="/student-dashboard"
                    element={<StudentDashboard />}
                />


                {/* =================================================
                    EXISTING LOGIN ROUTE
                ================================================= */}

                <Route
                    path="/login"
                    element={<StudentLogin />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />


                {/* =================================================
                    ACCOUNT SELECTION
                ================================================= */}

                <Route
                    path="/account-selection"
                    element={<AccountSelection />}
                />
                <Route
                    path="/admin/register"
                    element={<AdminRegister />}
                />
                
                <Route
                    path="/admin-login"
                    element={<AccountSelection />}
                />

                {/* =================================================
                    STUDENT SETTINGS
                ================================================= */}

                <Route
                    path="/student-settings"
                    element={<Settings />}
                />


                {/* =================================================
                    ELECTORAL BOARD LOGIN
                ================================================= */}

                <Route
                    path="/electoral-board/login"
                    element={<ElectoralBoardLogin />}
                />


                {/* =================================================
                    ELECTORAL BOARD DASHBOARD
                ================================================= */}

                <Route
                    path="/electoral-board/dashboard"
                    element={<EBDashboard />}
                />
                <Route
                    path="/kiosk-voting"
                    element={<KioskVoting />}
                />

                <Route
                    path="/electoral-board/audit-logs"
                    element={<ElectoralBoardAuditLogs />}
                />

                <Route
                    path="/staff-change-password"
                    element={<StaffChangePassword />}
                />
                <Route
                    path="/electoral-board/election-management"
                    element={<ElectionManagement />}
                />
                <Route
                    path="/electoral-board/create-election"
                    element={<CreateElection />}
                />


                {/* =================================================
                    ADMIN — ELECTORAL BOARD MANAGEMENT
                ================================================= */}

                <Route
                    path="/admin/electoral-board"
                    element={
                        <Navigate to="/admin/users" replace />
                    }
                />
                <Route
                    path="/admin-dashboard"
                    element={<AdminDashboard />}
                />
                <Route
                    path="/admin/students"
                    element={
                        <Navigate to="/admin/users" replace />
                    }
                />
                <Route
                    path="/admin/data-management"
                    element={<AdminDataManagement />}
                />

                <Route
                    path="/admin/users"
                    element={<AdminUserAccessManagement />}
                />
                <Route

                    path="/admin/election"
                    element={
                        <Navigate to="/admin/reports" replace />
                    }
                />

                <Route
                    path="/admin/candidates"

                    element={
                        <Navigate to="/admin/data-management" replace />
                    }
                />
                <Route
                    path="/electoral-board/candidates"

                    element={
                        <EBCandidateManagement />
                    }
                />

                <Route
                    path="/electoral-board/manage-party-list"
                    element={<ManagePartyList />}
                />

                <Route
                    path="/admin/audit-logs"
                    element={
                        <AdminAuditLogs />
                    }
                />

                <Route
                    path="/admin/reports"
                    element={
                        <Reports />
                    }
                />
                <Route
                    path="/admin/results"
                    element={
                        <Navigate to="/admin/reports" replace />
                    }
                />
                <Route
                    path="/admin/settings"
                    element={
                        <SystemSettings />
                    }
                />
                <Route
                    path="/admin/admin-accounts"
                    element={<Navigate to="/admin/users" replace />}
                />
                <Route
                    path="/registration-requirements"
                    element={<RegistrationRequirements />}
                />

                <Route
                    path="/vote"
                    element={<Vote />}
                />
            </Routes></EBWorkspace></AdminWorkspace></MaintenanceGate>
        </div>
    );
};

export default App;